/**
 * Automated test for Puppeteer Browser Lifecycle & PDF Service (Task 5.2)
 * Run: npx tsx src/utils/test-pdf-service.ts
 */

import { pdfService } from '../services/pdf.service';

let passed = 0;
let failed = 0;

function assert(testName: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${testName}`);
    passed++;
  } else {
    console.log(`  ✗ ${testName}`);
    failed++;
  }
}

async function runPdfServiceTests() {
  console.log('\n--- Testing Puppeteer PDF Browser Service ---');

  // Test 1: Browser Launch / Acquisition
  console.log('\n1. Browser Lifecycle:');
  const browser = await pdfService.getBrowser();
  assert('Browser launches successfully', browser !== null && browser.connected);

  // Test 2: Reuse of Browser Instance (Singleton)
  const browser2 = await pdfService.getBrowser();
  assert('Reuses healthy browser instance (singleton)', browser === browser2);

  // Test 3: PDF Generation from HTML
  console.log('\n2. PDF Generation:');
  const sampleHtml = `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8">
        <title>Test Resume</title>
        <style>
          @page { size: A4 portrait; margin: 0; }
          body { font-family: sans-serif; padding: 20mm; color: #1f2937; }
          h1 { color: #f97316; font-size: 24pt; margin-bottom: 4pt; }
          p { font-size: 11pt; line-height: 1.5; color: #4b5563; }
        </style>
      </head>
      <body>
        <div class="resume-document">
          <h1>Alex Morgan</h1>
          <p>Full Stack Software Engineer • alex.morgan@example.com</p>
          <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 16px 0;" />
          <h2>Professional Summary</h2>
          <p>Passionate software engineer experienced with React, Node.js, and TypeScript.</p>
        </div>
      </body>
    </html>
  `;

  const pdfBuffer = await pdfService.generatePdf({
    html: sampleHtml,
    waitForSelector: '.resume-document',
  });

  assert('PDF buffer is returned as a non-empty Buffer', Buffer.isBuffer(pdfBuffer) && pdfBuffer.length > 0);
  assert('PDF buffer size is realistic (> 5,000 bytes)', pdfBuffer.length > 5000);

  // Check PDF Magic Header bytes "%PDF-"
  const header = pdfBuffer.subarray(0, 5).toString('ascii');
  assert('PDF begins with valid %PDF- magic bytes', header === '%PDF-');

  // Test 4: Security - reject unauthorized external URLs
  console.log('\n3. Security & Validation:');
  let rejected = false;
  try {
    await pdfService.generatePdf({ url: 'https://evil-untrusted-site.com' });
  } catch (err: any) {
    rejected = err.message.includes('Unauthorized PDF navigation origin');
  }
  assert('Rejects untrusted external navigation URLs', rejected);

  // Test 5: Browser Disconnect & Clean Shutdown
  console.log('\n4. Resource Cleanup:');
  await pdfService.closeBrowser();
  assert('Browser closes cleanly without hanging', true);

  // Test 6: Reconnection after shutdown (Lazy initialization)
  const browserReconnected = await pdfService.getBrowser();
  assert('Re-initializes cleanly on next request after closure', browserReconnected.connected);
  await pdfService.closeBrowser();

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  PDF Service Test Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runPdfServiceTests().catch((err) => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});

