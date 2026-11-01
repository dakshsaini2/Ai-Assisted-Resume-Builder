import puppeteer, { Browser, Page, PDFOptions } from 'puppeteer';

/**
 * Configuration options for PDF generation
 */
export interface GeneratePdfOptions {
  /** Optional HTML string to render directly */
  html?: string;
  /** Optional URL to navigate to (must be an internal, trusted origin) */
  url?: string;
  /** Wait for a specific DOM selector before capturing PDF */
  waitForSelector?: string;
  /** Timeout in milliseconds (default: 15,000ms) */
  timeout?: number;
}

/**
 * Standard A4 PDF Output Options
 * Aligned with CSS @page { size: A4 portrait; margin: 0; }
 */
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

/**
 * Allowed origin hosts for Puppeteer navigation (Security Protection)
 */
const ALLOWED_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

class PdfService {
  private browser: Browser | null = null;
  private isInitializing = false;

  /**
   * Lazily obtain or reconnect to a healthy browser instance.
   * Avoids launching a new Chrome process on every PDF request.
   */
  public async getBrowser(): Promise<Browser> {
    // If browser exists and is still connected, reuse it
    if (this.browser && this.browser.connected) {
      return this.browser;
    }

    // Wait if another request is currently initializing the browser
    while (this.isInitializing) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      if (this.browser && this.browser.connected) {
        return this.browser;
      }
    }

    try {
      this.isInitializing = true;

      // Clean up previous dead browser reference if any
      if (this.browser) {
        try {
          await this.browser.close();
        } catch {
          // Ignore error on dead instance
        }
        this.browser = null;
      }

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu',
          '--font-render-hinting=medium',
        ],
      });

      // Handle unexpected disconnects / crashes
      this.browser.on('disconnected', () => {
        this.browser = null;
      });

      return this.browser;
    } finally {
      this.isInitializing = false;
    }
  }

  /**
   * Safely validate that a target URL belongs strictly to an allowed internal origin.
   */
  private validateUrl(targetUrl: string): void {
    try {
      const parsed = new URL(targetUrl);
      const origin = parsed.origin;
      if (!ALLOWED_ORIGINS.includes(origin)) {
        throw new Error(`Unauthorized PDF navigation origin: ${origin}`);
      }
    } catch (err: any) {
      throw new Error(`Invalid navigation URL for PDF generation: ${err.message}`);
    }
  }

  /**
   * Generate an A4 PDF buffer from either raw HTML or a trusted local URL.
   * Guarantees that the allocated page is ALWAYS closed in a finally block.
   */
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

    const browser = await this.getBrowser();
    let page: Page | null = null;

    try {
      page = await browser.newPage();

      // Configure viewport matching A4 proportions (794x1123 at 96 DPI)
      await page.setViewport({
        width: 794,
        height: 1123,
        deviceScaleFactor: 2, // Retina quality
      });

      // Emulate print media so @media print styles apply
      await page.emulateMediaType('print');

      if (url) {
        // Navigate to trusted internal URL
        await page.goto(url, {
          waitUntil: ['networkidle0', 'domcontentloaded'],
          timeout,
        });
      } else if (html) {
        // Set raw HTML content
        await page.setContent(html, {
          waitUntil: 'domcontentloaded',
          timeout,
        });
      }

      // Wait for fonts to finish rendering
      await page.evaluateHandle('document.fonts.ready');

      // Wait for target element
      if (waitForSelector) {
        await page.waitForSelector(waitForSelector, { timeout });
      }

      // Generate the PDF
      const pdfUint8Array = await page.pdf(DEFAULT_A4_PDF_OPTIONS);
      return Buffer.from(pdfUint8Array);
    } finally {
      // Ensure page is always closed, preventing memory and handle leaks
      if (page) {
        try {
          await page.close();
        } catch {
          // Ignore close error on crashed page
        }
      }
    }
  }

  /**
   * Graceful shutdown of the Puppeteer browser instance.
   */
  public async closeBrowser(): Promise<void> {
    if (this.browser) {
      try {
        await this.browser.close();
      } catch {
        // Ignore
      }
      this.browser = null;
    }
  }
}

// Singleton export
export const pdfService = new PdfService();

// Register clean process shutdown hooks
process.on('SIGINT', async () => {
  await pdfService.closeBrowser();
});

process.on('SIGTERM', async () => {
  await pdfService.closeBrowser();
});
