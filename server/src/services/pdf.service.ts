import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';
import { config } from '../config';
import { ApiError } from '../utils/apiError';

export interface GeneratePdfOptions {
  html?: string;
  url?: string;
  waitForSelector?: string;
  timeout?: number;
}

export const DEFAULT_A4_PDF_OPTIONS: PDFOptions = {
  format: 'A4',
  landscape: false,
  printBackground: true,
  preferCSSPageSize: true,
  margin: {
    top: '0mm',
    right: '0mm',
    bottom: '0mm',
    left: '0mm',
  },
};

const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

export class ConcurrencyLimiter {
  private activeCount = 0;
  private queue: Array<{
    resolve: () => void;
    reject: (err: any) => void;
    timer: NodeJS.Timeout;
  }> = [];

  constructor(
    public readonly maxConcurrent: number = 3,
    public readonly maxQueueLength: number = 10,
    public readonly defaultTimeoutMs: number = 15000
  ) {}

  public async acquire(timeoutMs: number = this.defaultTimeoutMs): Promise<void> {
    if (this.activeCount < this.maxConcurrent) {
      this.activeCount++;
      return;
    }

    if (this.queue.length >= this.maxQueueLength) {
      throw new ApiError(
        503,
        'PDF generation service is currently at maximum capacity. Please try again shortly.'
      );
    }

    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(() => {
        const idx = this.queue.findIndex((item) => item.timer === timer);
        if (idx !== -1) {
          this.queue.splice(idx, 1);
        }
        reject(
          new ApiError(
            503,
            'PDF generation queue timeout. Please try again shortly.'
          )
        );
      }, timeoutMs);

      this.queue.push({ resolve, reject, timer });
    });
  }

  public release(): void {
    if (this.queue.length > 0) {
      const next = this.queue.shift();
      if (next) {
        clearTimeout(next.timer);
        next.resolve();
      }
    } else {
      this.activeCount = Math.max(0, this.activeCount - 1);
    }
  }

  public getActiveCount(): number {
    return this.activeCount;
  }

  public getQueueLength(): number {
    return this.queue.length;
  }

  public reset(): void {
    for (const item of this.queue) {
      clearTimeout(item.timer);
      item.reject(new ApiError(503, 'PDF concurrency limiter reset.'));
    }
    this.queue = [];
    this.activeCount = 0;
  }
}

class PdfService {
  private browser: Browser | null = null;
  private isInitializing = false;
  public readonly concurrencyLimiter = new ConcurrencyLimiter(3, 10, 15000);

  public async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    while (this.isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.browser && this.browser.connected) {
        return this.browser;
      }
    }

    try {
      this.isInitializing = true;

      if (this.browser) {
        try {
          await this.browser.close();
        } catch {
        }
        this.browser = null;
      }

      this.browser = await puppeteer.launch({
        headless: true,
        pipe: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=medium',
        ],
      });

      this.browser.on('disconnected', () => {
        this.browser = null;
      });

      return this.browser;
    } finally {
      this.isInitializing = false;
    }
  }

  public validateUrl(targetUrl: string): void {
    try {
      const parsed = new URL(targetUrl);
      const isHttp = parsed.protocol === 'http:' || parsed.protocol === 'https:';

      let clientOrigin = '';
      try {
        if (config.clientUrl) {
          clientOrigin = new URL(config.clientUrl).origin;
        }
      } catch {
      }

      const isLocal =
        parsed.hostname === 'localhost' ||
        parsed.hostname === '127.0.0.1' ||
        (clientOrigin && parsed.origin === clientOrigin);

      if (!isHttp || !isLocal) {
        throw new Error(`Unauthorized PDF navigation origin: ${parsed.origin}`);
      }
    } catch (err: any) {
      if (err.message.includes('Unauthorized PDF navigation origin')) {
        throw err;
      }
      throw new Error(`Invalid navigation URL for PDF generation: ${err.message}`);
    }
  }

  public async generateResumePdf(
    resumeId: string,
    exportToken: string,
    customBaseUrl?: string
  ): Promise<Buffer> {
    const baseUrl = customBaseUrl || config.clientUrl || 'http://localhost:5173';
    const targetUrl = `${baseUrl}/render/${encodeURIComponent(resumeId)}?token=${encodeURIComponent(exportToken)}`;

    this.validateUrl(targetUrl);

    await this.concurrencyLimiter.acquire();
    try {
      const browser = await this.getBrowser();
      let page: Page | null = null;
      const timeout = 25000;

      try {
        page = await browser.newPage();

        await page.setViewport({
          width: 794,
          height: 1123,
          deviceScaleFactor: 2,
        });

        await page.emulateMediaType('print');

        try {
          await page.goto(targetUrl, {
            waitUntil: 'domcontentloaded',
            timeout,
          });
        } catch (navErr: any) {
          if (
            navErr.message?.includes('net::ERR_CONNECTION_REFUSED') ||
            navErr.message?.includes('ECONNREFUSED')
          ) {
            throw new ApiError(502, 'Frontend rendering server is unavailable. Ensure the client application is running.');
          }
          if (navErr.name === 'TimeoutError' || navErr.message?.includes('timeout')) {
            throw new ApiError(504, 'Navigation timed out while rendering resume.');
          }
          throw new ApiError(500, `Failed to navigate to resume renderer: ${navErr.message}`);
        }

        try {
          await page.waitForSelector('#resume-ready', { timeout: 10000 });
        } catch {
          throw new ApiError(504, 'Timed out waiting for resume renderer to initialize.');
        }

        const initialStatus = await page.$eval('#resume-ready', (el) => el.getAttribute('data-status'));
        if (initialStatus === 'error') {
          const errorText = await page.$eval('#resume-ready', (el) => el.textContent?.trim() || 'Unknown error');
          throw new ApiError(502, `Resume rendering failed: ${errorText}`);
        }

        if (initialStatus !== 'ready') {
          try {
            await page.waitForSelector('#resume-ready[data-status="ready"]', { timeout: 10000 });
          } catch {
            const currentStatus = await page.$eval('#resume-ready', (el) => el.getAttribute('data-status')).catch(() => 'unknown');
            if (currentStatus === 'error') {
              const errorText = await page.$eval('#resume-ready', (el) => el.textContent?.trim() || 'Unknown error');
              throw new ApiError(502, `Resume rendering failed: ${errorText}`);
            }
            throw new ApiError(504, 'Timed out waiting for resume template to complete rendering.');
          }
        }

        await page.evaluateHandle('document.fonts.ready');

        const pdfUint8Array = await page.pdf(DEFAULT_A4_PDF_OPTIONS);
        return Buffer.from(pdfUint8Array);
      } finally {
        if (page) {
          try {
            await page.close();
          } catch {
          }
        }
      }
    } finally {
      this.concurrencyLimiter.release();
    }
  }

  public async generatePdf(options: GeneratePdfOptions): Promise<Buffer> {
    const {
      html,
      url,
      waitForSelector = '.resume-document',
      timeout = 15000,
    } = options;

    if (!html && !url) {
      throw new Error('Either html or url must be provided for PDF generation.');
    }

    if (url) {
      this.validateUrl(url);
    }

    await this.concurrencyLimiter.acquire(timeout);
    try {
      const browser = await this.getBrowser();
      let page: Page | null = null;

      try {
        page = await browser.newPage();

        await page.setViewport({
          width: 794,
          height: 1123,
          deviceScaleFactor: 2,
        });

        await page.emulateMediaType('print');

        if (url) {
          await page.goto(url, {
            waitUntil: 'domcontentloaded',
            timeout,
          });
        } else if (html) {
          await page.setContent(html, {
            waitUntil: 'domcontentloaded',
            timeout,
          });
        }

        await page.evaluateHandle('document.fonts.ready');

        if (waitForSelector) {
          await page.waitForSelector(waitForSelector, { timeout });
        }

        const pdfUint8Array = await page.pdf(DEFAULT_A4_PDF_OPTIONS);
        return Buffer.from(pdfUint8Array);
      } finally {
        if (page) {
          try {
            await page.close();
          } catch {
          }
        }
      }
    } finally {
      this.concurrencyLimiter.release();
    }
  }

  public async closeBrowser(): Promise<void> {
    this.concurrencyLimiter.reset();
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
      }
      this.browser = null;
    }
  }
}

export const pdfService = new PdfService();

process.on('SIGINT', async () => {
  await pdfService.closeBrowser();
});

process.on('SIGTERM', async () => {
  await pdfService.closeBrowser();
});
