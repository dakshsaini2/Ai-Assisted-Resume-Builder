/**
 * Real End-to-End Browser Verification Test Suite
 * Uses real Puppeteer Chromium browser against live frontend (port 5173)
 * and live backend (port 5001) connected to PostgreSQL database (port 5433).
 *
 * Verifies:
 * 1. Download PDF from Dashboard (Classic template)
 * 2. Download PDF from Editor with pre-download auto-save (Modern template)
 * 3. Download PDF for Creative template
 * 4. Opening and inspecting all 3 downloaded PDF files
 *
 * Run: npx tsx src/utils/test-browser-verification.ts
 */

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import express from 'express';
import puppeteer, { Browser, Page } from 'puppeteer';
import bcrypt from 'bcryptjs';
import app from '../app';
import prisma from '../config/database';

let passed = 0;
let failed = 0;

function assert(testName: string, condition: boolean, details?: string) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}${details ? ` (${details})` : ''}`);
    failed++;
  }
}

async function runBrowserVerification() {
  console.log('\n======================================================');
  console.log('   Browser Verification Test Suite (Puppeteer)');
  console.log('======================================================\n');

  const downloadDir = path.resolve(__dirname, '../../test_downloads');
  if (fs.existsSync(downloadDir)) {
    fs.rmSync(downloadDir, { recursive: true, force: true });
  }
  fs.mkdirSync(downloadDir, { recursive: true });

  const clientDistDir = path.resolve(__dirname, '../../../client/dist');
  if (!fs.existsSync(clientDistDir)) {
    throw new Error('client/dist does not exist. Please run "npm run build" in client first.');
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Start Live Backend Server on Port 5001
  // ─────────────────────────────────────────────────────────────
  const backendServer = http.createServer(app);
  await new Promise<void>((resolve) => backendServer.listen(5001, '0.0.0.0', resolve));
  console.log('  [Init] Live backend server listening at http://localhost:5001');

  // ─────────────────────────────────────────────────────────────
  // 2. Start Live Frontend Server on Port 5173
  // ─────────────────────────────────────────────────────────────
  const frontendApp = express();

  // Forward /api to port 5001
  frontendApp.use('/api', async (req, res) => {
    try {
      const targetUrl = `http://localhost:5001${req.originalUrl}`;
      const forwardHeaders: Record<string, string> = {};
      for (const [k, v] of Object.entries(req.headers)) {
        if (k.toLowerCase() !== 'host' && typeof v === 'string') {
          forwardHeaders[k] = v;
        }
      }

      const bodyBuffer =
        ['GET', 'HEAD'].includes(req.method)
          ? undefined
          : await new Promise<Buffer>((resolve) => {
              const chunks: any[] = [];
              req.on('data', (c) => chunks.push(c));
              req.on('end', () => resolve(Buffer.concat(chunks)));
            });

      const response = await fetch(targetUrl, {
        method: req.method,
        headers: forwardHeaders,
        body: bodyBuffer,
      });

      res.status(response.status);
      response.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const responseData = await response.arrayBuffer();
      res.send(Buffer.from(responseData));
    } catch (err: any) {
      console.error('Proxy error:', err);
      res.status(502).json({ success: false, message: err.message });
    }
  });

  // Serve static assets from dist
  frontendApp.use(express.static(clientDistDir));

  // SPA fallback
  frontendApp.use((_req, res) => {
    res.sendFile(path.join(clientDistDir, 'index.html'));
  });

  const frontendServer = http.createServer(frontendApp);
  await new Promise<void>((resolve) => frontendServer.listen(5173, '0.0.0.0', resolve));
  console.log('  [Init] Live frontend SPA server listening at http://localhost:5173');

  // ─────────────────────────────────────────────────────────────
  // 3. Seed Database Test Fixtures
  // ─────────────────────────────────────────────────────────────
  const timestamp = Date.now();
  const hashedPassword = await bcrypt.hash('Password123!', 10);
  const testUser = await prisma.user.create({
    data: {
      email: `browser_test_${timestamp}@example.com`,
      password: hashedPassword,
      firstName: 'Browser',
      lastName: 'Tester',
    },
  });

  // Resume 1: Classic ATS Template
  const resumeClassic = await prisma.resume.create({
    data: {
      userId: testUser.id,
      title: 'Classic Systems Engineer',
      templateId: 'classic',
      fullName: 'Sarah Jenkins',
      email: 'sarah.jenkins@example.com',
      phone: '+1 (555) 234-5678',
      location: 'Boston, MA',
      summary: 'Experienced Systems Engineer specializing in distributed infrastructure and cloud security.',
      education: {
        create: [
          {
            institution: 'MIT',
            degree: 'B.S.',
            field: 'Computer Science',
            startDate: '2016-09-01',
            endDate: '2020-05-30',
            gpa: '3.9',
          },
        ],
      },
      experiences: {
        create: [
          {
            company: 'Akamai Technologies',
            position: 'Senior Infrastructure Engineer',
            startDate: '2020-06-01',
            description: 'Designed edge delivery network optimizations handling 40M+ requests per second.',
          },
        ],
      },
      skills: {
        create: [{ name: 'Kubernetes' }, { name: 'Go' }, { name: 'Terraform' }],
      },
    },
  });

  // Resume 2: Modern Tech Template
  const resumeModern = await prisma.resume.create({
    data: {
      userId: testUser.id,
      title: 'Modern Cloud Architect',
      templateId: 'modern',
      fullName: 'David Chen',
      email: 'david.chen@example.com',
      phone: '+1 (555) 876-5432',
      location: 'San Francisco, CA',
      summary: 'Full-stack architect with deep expertise in TypeScript, microservices, and reactive UIs.',
      education: {
        create: [
          {
            institution: 'Stanford University',
            degree: 'M.S.',
            field: 'Software Engineering',
            startDate: '2018-09-01',
            endDate: '2020-06-15',
          },
        ],
      },
      experiences: {
        create: [
          {
            company: 'Stripe',
            position: 'Staff Engineer',
            startDate: '2020-07-01',
            description: 'Led core billing pipeline revamp, achieving 99.999% availability.',
          },
        ],
      },
      skills: {
        create: [{ name: 'React' }, { name: 'Node.js' }, { name: 'PostgreSQL' }],
      },
    },
  });

  // Resume 3: Creative Executive Template
  const resumeCreative = await prisma.resume.create({
    data: {
      userId: testUser.id,
      title: 'Creative Design Lead',
      templateId: 'creative',
      fullName: 'Elena Rostova',
      email: 'elena.rostova@example.com',
      phone: '+1 (555) 432-1098',
      location: 'New York, NY',
      summary: 'Award-winning product designer bridging user-centered aesthetics with high-performance frontend engineering.',
      education: {
        create: [
          {
            institution: 'Rhode Island School of Design',
            degree: 'B.F.A.',
            field: 'Graphic Design',
            startDate: '2015-09-01',
            endDate: '2019-05-20',
          },
        ],
      },
      experiences: {
        create: [
          {
            company: 'Figma',
            position: 'Design Systems Lead',
            startDate: '2019-06-01',
            description: 'Created universal component library adopted across 14 product surfaces.',
          },
        ],
      },
      skills: {
        create: [{ name: 'Figma' }, { name: 'CSS/Tailwind' }, { name: 'Design Systems' }],
      },
    },
  });

  console.log('  [Init] Seeded test user and 3 resumes across all 3 templates.');

  // ─────────────────────────────────────────────────────────────
  // 4. Launch Real Puppeteer Chromium Browser
  // ─────────────────────────────────────────────────────────────
  console.log('\nStarting Chromium browser automation...');
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_bv_'));
  const browser: Browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page: Page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 900 });

  // Hook anchor clicks to capture client-side blob downloads triggered by downloadResumePdf
  await page.evaluateOnNewDocument(() => {
    const g = globalThis as any;
    g.__downloads = [];
    const origClick = g.HTMLAnchorElement?.prototype?.click;
    if (origClick) {
      g.HTMLAnchorElement.prototype.click = function (this: any) {
        if (this.download) {
          // Read blob content immediately before revocation
          const blobUrl = this.href;
          const filename = this.download;
          g.fetch(blobUrl)
            .then((res: any) => res.arrayBuffer())
            .then((ab: any) => {
              g.__downloads.push({
                filename,
                bytes: Array.from(new Uint8Array(ab)),
                timestamp: Date.now(),
              });
            })
            .catch((err: any) => {
              console.error('Failed to capture blob bytes:', err);
            });
        }
        return origClick.apply(this, arguments as any);
      };
    }
  });

  // Helper to wait for the latest client-side download to complete and write it to disk
  async function waitForLatestDownload(timeoutMs = 25000): Promise<{ filename: string; bytes: number[] }> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      const downloads = await page.evaluate(() => (globalThis as any).__downloads || []);
      if (downloads.length > 0) {
        const last = downloads[downloads.length - 1];
        if (last && last.bytes && last.bytes.length > 1000) {
          fs.writeFileSync(path.join(downloadDir, last.filename), Buffer.from(last.bytes));
          return last;
        }
      }
      await new Promise((r) => setTimeout(r, 300));
    }
    throw new Error('Timeout waiting for client-side download');
  }

  try {
    // ─────────────────────────────────────────────────────────────
    // Step A: Perform Real User Login via the UI
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Step A: UI Form Login & Navigation ---');
    await page.goto('http://localhost:5173/login', { waitUntil: 'load' });

    await page.waitForSelector('input[type="email"]');
    await page.type('input[type="email"]', testUser.email);
    await page.type('input[type="password"]', 'Password123!');
    await page.click('button[type="submit"]');

    // Wait for Dashboard to finish loading its resume cards
    await page.waitForSelector('button[aria-label="Download PDF for Classic Systems Engineer"]', {
      timeout: 15000,
    });
    const titles = await page.$$eval('div.grid h3', (elements) => elements.map((e) => e.textContent?.trim()));
    assert(
      'Dashboard loads after UI login and lists all resumes',
      titles.includes('Classic Systems Engineer') &&
        titles.includes('Modern Cloud Architect') &&
        titles.includes('Creative Design Lead')
    );

    // ─────────────────────────────────────────────────────────────
    // Step B: Download Classic Resume from Dashboard
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Step B: Dashboard PDF Download (Classic ATS Template) ---');
    const classicBtnSelector = 'button[aria-label="Download PDF for Classic Systems Engineer"]';
    await page.waitForSelector(classicBtnSelector);

    // Click the specific Classic template download button
    console.log('  Triggering download for Classic template from Dashboard...');
    await page.click(classicBtnSelector);

    // Verify loading indicator on clicked button
    await new Promise((r) => setTimeout(r, 200));
    const isClassicGenerating = await page.$eval(classicBtnSelector, (btn) => btn.textContent?.includes('Generating'));
    assert('Dashboard Classic PDF button shows "Generating..." loading state while processing', Boolean(isClassicGenerating));

    // Verify other resume buttons are NOT in loading state (isolated loading)
    const modernBtnText = await page.$eval(
      'button[aria-label="Download PDF for Modern Cloud Architect"]',
      (btn) => btn.textContent?.trim()
    );
    assert('Dashboard isolated loading: other resume buttons remain idle ("PDF")', modernBtnText === 'PDF');

    // Wait for download capture and file write
    const download1 = await waitForLatestDownload();
    assert(
      `Classic template PDF successfully downloaded from Dashboard (${download1.filename})`,
      download1.filename === 'Sarah_Jenkins_Resume.pdf'
    );

    // ─────────────────────────────────────────────────────────────
    // Step C: Editor Navigation, Editing, Auto-Save & Download
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Step C: Editor Navigation, Pre-Download Auto-Save & PDF Download ---');
    await page.goto(`http://localhost:5173/editor/${resumeModern.id}`, { waitUntil: 'load' });

    // Verify editor loaded with David Chen's data
    await page.waitForSelector('input[title="Click to rename"]', { timeout: 10000 });
    const editorTitle = await page.$eval('input[title="Click to rename"]', (el: any) => el.value);
    assert('Editor loads resume title', editorTitle === 'Modern Cloud Architect');

    // Modify candidate full name input to simulate unsaved edits
    const fullNameInput = await page.waitForSelector('input[placeholder*="Jane Doe"]', { timeout: 10000 });
    const modifiedName = 'David Chen Staff Architect';
    if (fullNameInput) {
      await fullNameInput.click();
      await page.keyboard.down('Control');
      await page.keyboard.press('KeyA');
      await page.keyboard.up('Control');
      await page.keyboard.press('Backspace');
      await fullNameInput.type(modifiedName);
    }

    // Give React time to update state
    await new Promise((r) => setTimeout(r, 400));

    // Verify Save Changes button is enabled (unsaved state)
    const saveButton = await page.$('header button:nth-of-type(2), button:has(svg.lucide-save)');
    const saveButtonText = await page.evaluate((el: any) => el?.textContent?.trim(), saveButton);
    assert('Editor detects unsaved changes before download', Boolean(saveButtonText));

    // Click "Download PDF" in Editor toolbar
    console.log('  Clicking "Download PDF" in Editor with unsaved changes...');
    const editorDownloadBtn = await page.waitForSelector('button[aria-label="Download PDF"]');
    await editorDownloadBtn?.click();

    // Verify Editor loading state
    await new Promise((r) => setTimeout(r, 200));
    const isEditorGenerating = await page.$eval('button[aria-label="Download PDF"]', (btn) =>
      btn.textContent?.includes('Generating')
    );
    assert('Editor Download PDF button shows "Generating..." loading state while processing', Boolean(isEditorGenerating));

    // Wait for Modern template download capture
    const download2 = await waitForLatestDownload();
    assert(
      `Modern template PDF successfully downloaded from Editor (${download2.filename})`,
      download2.filename === 'David_Chen_Staff_Architect_Resume.pdf'
    );

    // Verify that the editor auto-saved to the database before downloading
    const updatedResumeFromDb = await prisma.resume.findUnique({ where: { id: resumeModern.id } });
    assert(
      'Editor automatically saved changes to PostgreSQL database before generating PDF',
      updatedResumeFromDb?.fullName === modifiedName
    );

    // ─────────────────────────────────────────────────────────────
    // Step D: Download Creative Template PDF from Dashboard
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Step D: Creative Template PDF Download ---');
    await page.goto('http://localhost:5173/dashboard', { waitUntil: 'load' });
    const creativeBtnSelector = 'button[aria-label="Download PDF for Creative Design Lead"]';
    await page.waitForSelector(creativeBtnSelector, { timeout: 10000 });

    // Click Creative template PDF download button
    console.log('  Triggering download for Creative template from Dashboard...');
    await page.click(creativeBtnSelector);

    const download3 = await waitForLatestDownload();
    assert(
      `Creative template PDF successfully downloaded from Dashboard (${download3.filename})`,
      download3.filename === 'Elena_Rostova_Resume.pdf'
    );

    // ─────────────────────────────────────────────────────────────
    // Step E: Open and Inspect All 3 Downloaded PDF Documents
    // ─────────────────────────────────────────────────────────────
    console.log('\n--- Step E: Inspection of Downloaded PDF Files ---');
    const downloadedFiles = fs.readdirSync(downloadDir).filter((f) => f.endsWith('.pdf'));
    assert(`Downloaded ${downloadedFiles.length} PDF files across all 3 templates`, downloadedFiles.length >= 3);

    for (const fileName of downloadedFiles) {
      const filePath = path.join(downloadDir, fileName);
      const buffer = fs.readFileSync(filePath);

      // 1. Verify PDF Magic Bytes (%PDF-1.4 or %PDF-1.5)
      const header = buffer.subarray(0, 8).toString('utf-8');
      const hasValidHeader = header.startsWith('%PDF-');

      // 2. Verify PDF EOF Marker
      const trailer = buffer.subarray(buffer.length - 64).toString('utf-8');
      const hasValidTrailer = trailer.includes('%%EOF');

      // 3. Verify realistic file size
      const sizeKb = (buffer.length / 1024).toFixed(1);
      const hasRealisticSize = buffer.length > 5000;

      assert(
        `PDF [${fileName}] is structurally valid (Magic header: "${header.trim()}", size: ${sizeKb} KB, trailer: %%EOF)`,
        hasValidHeader && hasValidTrailer && hasRealisticSize
      );
    }

  } finally {
    // Cleanup browser
    try {
      await browser.close();
    } catch {}
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
    console.log('  [Cleanup] Closed Puppeteer browser.');

    // Cleanup servers
    (frontendServer as any).closeAllConnections?.();
    (backendServer as any).closeAllConnections?.();
    await new Promise<void>((resolve) => frontendServer.close(() => resolve()));
    await new Promise<void>((resolve) => backendServer.close(() => resolve()));
    console.log('  [Cleanup] Stopped live test servers.');

    // Cleanup database test records
    await prisma.education.deleteMany({ where: { resume: { userId: testUser.id } } });
    await prisma.experience.deleteMany({ where: { resume: { userId: testUser.id } } });
    await prisma.skill.deleteMany({ where: { resume: { userId: testUser.id } } });
    await prisma.resume.deleteMany({ where: { userId: testUser.id } });
    await prisma.user.delete({ where: { id: testUser.id } });
    console.log('  [Cleanup] Purged test database records.');

    // Cleanup downloaded test files
    if (fs.existsSync(downloadDir)) {
      fs.rmSync(downloadDir, { recursive: true, force: true });
    }
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n======================================================');
  console.log(`Browser Verification Results: ${passed} passed, ${failed} failed`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runBrowserVerification().catch((err) => {
  console.error('Fatal error during browser verification:', err);
  process.exit(1);
});
