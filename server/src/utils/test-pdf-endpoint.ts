/**
 * Automated Verification Test Suite for Task 5.4:
 * Secure Express PDF Download Endpoint (GET /api/resumes/:id/pdf)
 *
 * Run: npx tsx src/utils/test-pdf-endpoint.ts
 */

import http from 'http';
import app from '../app';
import prisma from '../config/database';
import { config } from '../config';
import { signToken, signExportToken } from './jwt';
import { generateResumeFilename } from './filename';
import { pdfService } from '../services/pdf.service';

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

async function runPdfEndpointTests() {
  console.log('\n======================================================');
  console.log('   Task 5.4 Verification: Express PDF Download API');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. Filename Sanitization Unit Tests
  // ─────────────────────────────────────────────────────────────
  console.log('1. Filename Sanitization & Header Protection:');

  const standardName = generateResumeFilename('Jane Doe', 'Software Engineer');
  assert('Standard candidate name generates expected filename', standardName === 'Jane_Doe_Resume.pdf');

  const punctuationName = generateResumeFilename("Dr. John O'Connor-Smith, Ph.D.", 'Executive');
  assert('Special characters and punctuation are cleanly sanitized', punctuationName === 'Dr_John_OConnor-Smith_Ph_D_Resume.pdf');

  const titleFallback = generateResumeFilename(null, 'Full Stack Developer');
  assert('Falls back to resume title when candidate name is missing', titleFallback === 'Full_Stack_Developer_Resume.pdf');

  const emptyFallback = generateResumeFilename('   ', '   ');
  assert('Falls back to safe Resume.pdf when all fields are empty', emptyFallback === 'Resume.pdf');

  const headerInjectionPayload = "\r\nContent-Disposition: inline\r\n\0Injected: True; filename=\"evil.exe\"";
  const sanitizedInjection = generateResumeFilename(headerInjectionPayload);
  assert(
    'Strips CR, LF, null-byte, quotes and semicolons to block header injection',
    !sanitizedInjection.includes('\r') &&
    !sanitizedInjection.includes('\n') &&
    !sanitizedInjection.includes('\0') &&
    !sanitizedInjection.includes('"') &&
    !sanitizedInjection.includes(';') &&
    sanitizedInjection.endsWith('.pdf')
  );

  const duplicateAvoidance = generateResumeFilename('Alex_Morgan_Resume');
  assert('Avoids duplicating _Resume suffix', duplicateAvoidance === 'Alex_Morgan_Resume.pdf');

  const spaceSuffixAvoidance = generateResumeFilename('Alex Morgan Resume');
  assert('Avoids duplicating Resume suffix when space-separated', spaceSuffixAvoidance === 'Alex_Morgan_Resume.pdf');

  const accentedName = generateResumeFilename('René Müller', 'Engineer');
  assert('Normalizes Unicode accented characters (René Müller -> Rene_Muller)', accentedName === 'Rene_Muller_Resume.pdf');

  const spanishAccentedName = generateResumeFilename('José García', 'Developer');
  assert('Normalizes Spanish accents (José García -> Jose_Garcia)', spanishAccentedName === 'Jose_Garcia_Resume.pdf');

  const truncationRecovery = generateResumeFilename('_________________________________________________________________________________________');
  assert('Safely recovers to Resume.pdf if string becomes empty after truncation', truncationRecovery === 'Resume.pdf');

  const nonLatinFallback = generateResumeFilename('李小龙', 'Developer');
  assert('Non-Latin names safely fall back to Resume.pdf', nonLatinFallback === 'Resume.pdf');

  // ─────────────────────────────────────────────────────────────
  // 2. Authentication, Authorization & Ownership Tests
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Authentication, Authorization & Ownership:');

  // Mount mock render route on Express app for deterministic testing
  app.get('/render/:id', (req, res) => {
    res.setHeader('Content-Type', 'text/html');

    if (req.query.token === 'expired-token') {
      return res.send(`
        <!DOCTYPE html>
        <html>
          <body>
            <div id="resume-ready" data-status="error">
              <div class="err-text">Export token has expired. Please try again.</div>
            </div>
          </body>
        </html>
      `);
    }

    return res.send(`
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; background: #ffffff; font-family: sans-serif; }
            .resume-document {
              width: 210mm;
              min-height: 297mm;
              padding: 16mm 18mm;
              box-sizing: border-box;
            }
          </style>
        </head>
        <body>
          <div id="resume-ready" data-status="ready">
            <div class="resume-document">
              <h1>Alice Developer</h1>
              <p>Cloud Systems Architect with 8+ years experience.</p>
            </div>
          </div>
        </body>
      </html>
    `);
  });

  const server = http.createServer(app);
  const TEST_PORT = 5097;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  const baseUrl = `http://127.0.0.1:${TEST_PORT}/api`;

  const originalClientUrl = config.clientUrl;
  config.clientUrl = `http://127.0.0.1:${TEST_PORT}`;

  const timestamp = Date.now();
  let userA: any = null;
  let userB: any = null;
  let resumeA: any = null;
  let resumeB: any = null;

  try {
    // Create User A & User B
    userA = await prisma.user.create({
      data: {
        email: `pdf_test_a_${timestamp}@example.com`,
        password: 'hashed_password_a',
        firstName: 'Alice',
        lastName: 'Developer',
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `pdf_test_b_${timestamp}@example.com`,
        password: 'hashed_password_b',
        firstName: 'Bob',
        lastName: 'Manager',
      },
    });

    // Create Resume A owned by User A
    resumeA = await prisma.resume.create({
      data: {
        userId: userA.id,
        title: 'Alice Senior Resume',
        templateId: 'modern',
        fullName: 'Alice Developer',
        email: 'alice@example.com',
        location: 'Seattle, WA',
        summary: 'Cloud Systems Architect with 8+ years experience.',
        education: {
          create: [{ institution: 'UW', degree: 'B.S. CS', startDate: '2016-09-01' }],
        },
      },
    });

    // Create Resume B owned by User B
    resumeB = await prisma.resume.create({
      data: {
        userId: userB.id,
        title: 'Bob Executive Resume',
        templateId: 'classic',
        fullName: 'Bob Manager',
      },
    });

    const tokenA = signToken({ userId: userA.id, email: userA.email });
    const tokenB = signToken({ userId: userB.id, email: userB.email });

    // Test 2.1: Missing authentication -> 401
    const noAuthRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/pdf`);
    const noAuthData: any = await noAuthRes.json();
    assert(
      'Missing authentication returns 401 Unauthorized',
      noAuthRes.status === 401 && noAuthData.success === false
    );

    // Test 2.2: Invalid authentication -> 401
    const invalidAuthRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/pdf`, {
      headers: { Authorization: 'Bearer totally.invalid.jwt.token' },
    });
    assert('Invalid Bearer token returns 401 Unauthorized', invalidAuthRes.status === 401);

    // Test 2.3: Nonexistent resume -> 404
    const nonExistentRes = await fetch(`${baseUrl}/resumes/00000000-0000-0000-0000-000000000000/pdf`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    const nonExistentData: any = await nonExistentRes.json();
    assert(
      'Nonexistent resume ID returns standard 404',
      nonExistentRes.status === 404 && nonExistentData.message.includes('not found')
    );

    // Test 2.4: Cross-user access (User B trying to download User A's resume) -> 404
    const crossUserRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    const crossUserData: any = await crossUserRes.json();
    assert(
      'Cross-user access to unowned resume returns 404 (does not generate export token)',
      crossUserRes.status === 404 && crossUserData.message.includes('not found')
    );

    // Test 2.5: Private resume caching protection on render-data endpoint
    const validExportToken = signExportToken({ userId: userA.id, resumeId: resumeA.id });
    const renderDataRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/render-data?token=${validExportToken}`);
    const renderDataCache = renderDataRes.headers.get('cache-control');
    assert(
      'GET /api/resumes/:id/render-data sets Cache-Control: no-store to prevent caching private data',
      renderDataCache?.includes('no-store') === true
    );

    // ─────────────────────────────────────────────────────────────
    // 3. Reliability, Error Handling & Page Leak Prevention
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. Reliability, Error States & Page Leak Prevention:');

    const browser = await pdfService.getBrowser();
    const initialPagesCount = (await browser.pages()).length;

    // Test 3.1: Frontend rendering server unavailable (connection refused on dead port)
    let unavailableHandled = false;
    try {
      await pdfService.generateResumePdf(resumeA.id, 'dummy-token', 'http://127.0.0.1:59999');
    } catch (err: any) {
      unavailableHandled = err.statusCode === 502 && err.message.includes('unavailable');
    }
    assert('Frontend server unavailable is caught and returns 502 Bad Gateway', unavailableHandled);

    // Test 3.2: Render error state detection from DOM (#resume-ready[data-status="error"])
    let renderErrorHandled = false;
    try {
      await pdfService.generateResumePdf(
        resumeA.id,
        'expired-token',
        `http://127.0.0.1:${TEST_PORT}`
      );
    } catch (err: any) {
      renderErrorHandled = err.statusCode === 502 && err.message.includes('Resume rendering failed');
    }
    assert('Render error state in DOM is detected and returns 502 Bad Gateway', renderErrorHandled);

    // Test 3.3: Verify no leaked pages in browser after errors
    const postFailurePagesCount = (await browser.pages()).length;
    assert(
      'No leaked Puppeteer pages after rendering failures (page.close guaranteed in finally)',
      postFailurePagesCount <= initialPagesCount
    );

    // ─────────────────────────────────────────────────────────────
    // 4. Real End-to-End PDF Download Integration Test
    // ─────────────────────────────────────────────────────────────
    console.log('\n4. Real End-to-End PDF Download Response:');

    // Test 4.1: Call GET /api/resumes/:id/pdf with User A's token
    const pdfRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/pdf`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });

    assert('GET /api/resumes/:id/pdf returns 200 OK', pdfRes.status === 200);

    // Test 4.2: MIME type application/pdf
    const contentType = pdfRes.headers.get('content-type');
    assert('Response has Content-Type: application/pdf', contentType === 'application/pdf');

    // Test 4.3: Attachment filename header
    const contentDisposition = pdfRes.headers.get('content-disposition');
    assert(
      'Response has Content-Disposition attachment with sanitized candidate filename',
      contentDisposition === 'attachment; filename="Alice_Developer_Resume.pdf"'
    );

    // Test 4.4: Cache-Control: no-store
    const cacheControl = pdfRes.headers.get('cache-control');
    assert('Response has Cache-Control: no-store', cacheControl?.includes('no-store') === true);

    // Test 4.5: Binary PDF buffer verification
    const arrayBuffer = await pdfRes.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);
    assert('Returns a non-empty binary buffer', pdfBuffer.length > 0);

    // Test 4.6: Content-Length matches
    const contentLength = pdfRes.headers.get('content-length');
    assert('Content-Length header matches received buffer size', contentLength === pdfBuffer.length.toString());

    // Test 4.7: PDF Magic bytes (%PDF-)
    const magicBytes = pdfBuffer.subarray(0, 5).toString('ascii');
    assert('Binary buffer begins with valid %PDF- magic bytes', magicBytes === '%PDF-');
    assert('Generated PDF size is realistic (> 5,000 bytes)', pdfBuffer.length > 5000);

  } finally {
    // Restore config
    config.clientUrl = originalClientUrl;

    // Clean up DB test fixtures
    if (resumeA?.id) {
      await prisma.education.deleteMany({ where: { resumeId: resumeA.id } });
      await prisma.resume.deleteMany({ where: { id: resumeA.id } });
    }
    if (resumeB?.id) {
      await prisma.resume.deleteMany({ where: { id: resumeB.id } });
    }
    if (userA?.id) {
      await prisma.user.deleteMany({ where: { id: userA.id } });
    }
    if (userB?.id) {
      await prisma.user.deleteMany({ where: { id: userB.id } });
    }

    (server as any).closeAllConnections?.();
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pdfService.closeBrowser();
    await prisma.$disconnect();
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------');
  console.log(`Task 5.4 Test Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  process.exit(failed > 0 ? 1 : 0);
}

runPdfEndpointTests().catch((err) => {
  console.error('Fatal error during Task 5.4 test execution:', err);
  process.exit(1);
});
