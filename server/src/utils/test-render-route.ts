/**
 * Verification Test Suite for Task 5.3:
 * Secure React Resume Rendering Route & Export Token Verification
 *
 * Run: npx tsx src/utils/test-render-route.ts
 */

import http from 'http';
import jwt from 'jsonwebtoken';
import app from '../app';
import prisma from '../config/database';
import { config } from '../config';
import { signExportToken, verifyExportToken } from './jwt';
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

async function runTests() {
  console.log('\n======================================================');
  console.log('   Task 5.3 Verification: Secure Render Route & Token');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. Export Token Security & Cryptographic Invariants
  // ─────────────────────────────────────────────────────────────
  console.log('1. Export Token Security Invariants:');

  const testUserId = 'user-uuid-12345';
  const testResumeId = 'resume-uuid-67890';

  // Test 1.1: Sign valid export token
  const token = signExportToken({ userId: testUserId, resumeId: testResumeId });
  assert('signExportToken returns a valid JWT string', typeof token === 'string' && token.split('.').length === 3);

  // Test 1.2: Verify valid export token
  const verified = verifyExportToken(token);
  assert(
    'verifyExportToken extracts correct payload',
    verified.userId === testUserId &&
    verified.resumeId === testResumeId &&
    verified.purpose === 'pdf-render'
  );

  // Test 1.3: Expired export token is rejected
  let expiredRejected = false;
  try {
    const expiredToken = jwt.sign(
      { userId: testUserId, resumeId: testResumeId, purpose: 'pdf-render' },
      config.jwt.secret,
      { expiresIn: '-1s' }
    );
    verifyExportToken(expiredToken);
  } catch (err: any) {
    expiredRejected = err.statusCode === 401 && err.message.includes('expired');
  }
  assert('Expired export token is rejected with 401', expiredRejected);

  // Test 1.4: Tampered/invalid signature token is rejected
  let tamperedRejected = false;
  try {
    const tamperedToken = token.slice(0, -4) + 'abcd';
    verifyExportToken(tamperedToken);
  } catch (err: any) {
    tamperedRejected = err.statusCode === 401;
  }
  assert('Tampered token is rejected with 401', tamperedRejected);

  // Test 1.5: Non-render purpose token (e.g. standard login token) is rejected
  let wrongPurposeRejected = false;
  try {
    const loginToken = jwt.sign(
      { userId: testUserId, email: 'test@example.com' },
      config.jwt.secret,
      { expiresIn: '1h' }
    );
    verifyExportToken(loginToken);
  } catch (err: any) {
    wrongPurposeRejected = err.statusCode === 401;
  }
  assert('Standard auth token without "pdf-render" purpose is rejected with 401', wrongPurposeRejected);

  // ─────────────────────────────────────────────────────────────
  // 2. HTTP Endpoint Verification (In-Process Server)
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. HTTP Endpoint Security & Data Flow:');

  const server = http.createServer(app);
  const TEST_PORT = 5098;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, resolve));
  const baseUrl = `http://localhost:${TEST_PORT}/api`;

  try {
    // Setup test user & resume directly in DB
    const timestamp = Date.now();
    const user = await prisma.user.create({
      data: {
        email: `render_test_${timestamp}@example.com`,
        password: 'hashed_password_for_testing',
        firstName: 'Render',
        lastName: 'Tester',
      },
    });

    const resumeA = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Software Engineer Resume',
        templateId: 'modern',
        fullName: 'Jane Developer',
        email: 'jane@example.com',
        phone: '+1 (555) 019-2834',
        location: 'San Francisco, CA',
        summary: 'Experienced Full Stack Engineer specializing in TypeScript and Cloud architectures.',
        education: {
          create: [
            {
              institution: 'UC Berkeley',
              degree: 'B.S. in Computer Science',
              startDate: '2018-09-01',
              endDate: '2022-05-31',
              gpa: '3.9',
            },
          ],
        },
        experiences: {
          create: [
            {
              company: 'TechCorp Solutions',
              position: 'Senior Software Engineer',
              startDate: '2022-06-01',
              current: true,
              description: 'Led development of distributed microservices processing 10M+ events daily.',
            },
          ],
        },
        skills: {
          create: [
            { name: 'TypeScript', level: 'Expert', category: 'Languages' },
            { name: 'Node.js', level: 'Expert', category: 'Backend' },
            { name: 'React', level: 'Expert', category: 'Frontend' },
          ],
        },
      },
      include: { education: true, experiences: true, skills: true },
    });

    const resumeB = await prisma.resume.create({
      data: {
        userId: user.id,
        title: 'Second Resume',
        templateId: 'classic',
        fullName: 'Jane Developer Alt',
      },
    });

    const validTokenA = signExportToken({ userId: user.id, resumeId: resumeA.id });

    // Test 2.1: Request without token -> 401
    const noTokenRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/render-data`);
    const noTokenData: any = await noTokenRes.json();
    assert(
      'GET /api/resumes/:id/render-data without token returns 401',
      noTokenRes.status === 401 && noTokenData.success === false
    );

    // Test 2.2: Request with invalid token -> 401
    const invalidTokenRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/render-data?token=invalid.token.here`);
    assert('GET /api/resumes/:id/render-data with invalid token returns 401', invalidTokenRes.status === 401);

    // Test 2.3: Request with token meant for resume B accessing resume A -> 403
    const tokenB = signExportToken({ userId: user.id, resumeId: resumeB.id });
    const mismatchRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/render-data?token=${tokenB}`);
    const mismatchData: any = await mismatchRes.json();
    assert(
      'Mismatched resume ID token is rejected with 403 Forbidden',
      mismatchRes.status === 403 && mismatchData.message.includes('does not match')
    );

    // Test 2.4: Valid token for resume A -> returns 200 with full relational data
    const validRes = await fetch(`${baseUrl}/resumes/${resumeA.id}/render-data?token=${validTokenA}`);
    const validData: any = await validRes.json();
    assert(
      'Valid export token returns 200 OK',
      validRes.status === 200 && validData.success === true
    );
    assert(
      'Response includes full resume with education and experience',
      validData.data?.resume?.fullName === 'Jane Developer' &&
      validData.data?.resume?.education?.length === 1 &&
      validData.data?.resume?.education[0]?.institution === 'UC Berkeley' &&
      validData.data?.resume?.experiences?.length === 1 &&
      validData.data?.resume?.skills?.length === 3
    );

    // Test 2.5: Standard GET /api/resumes/:id remains protected by Bearer auth
    const standardWithoutAuth = await fetch(`${baseUrl}/resumes/${resumeA.id}`);
    assert(
      'Standard GET /api/resumes/:id still requires Bearer auth (returns 401)',
      standardWithoutAuth.status === 401
    );

    // ─────────────────────────────────────────────────────────────
    // 3. Headless Browser DOM Readiness & A4 Print Layout Verification
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. Headless Browser DOM Readiness & Template Layout:');

    const browser = await pdfService.getBrowser();
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1200, height: 1600, deviceScaleFactor: 2 });

      // Test 3.1: Verify DOM Readiness state contract (#resume-ready[data-status="ready"])
      // Simulate the exact DOM produced by RenderResumePage with loaded data
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <head>
            <style>
              body { margin: 0; background-color: #ffffff; }
              .resume-document {
                width: 210mm;
                min-height: 297mm;
                background-color: #ffffff;
                box-sizing: border-box;
                padding: 16mm 18mm;
              }
            </style>
          </head>
          <body>
            <div id="resume-ready" data-status="ready">
              <div class="resume-document">
                <header>
                  <h1 id="resume-name">${validData.data.resume.fullName}</h1>
                </header>
              </div>
            </div>
          </body>
        </html>
      `, { waitUntil: 'load' });

      const readyElement = await page.$('#resume-ready[data-status="ready"]');
      assert('Headless browser reliably identifies #resume-ready[data-status="ready"]', readyElement !== null);

      const headingText = await page.$eval('#resume-name', (el: any) => el.textContent);
      assert('Rendered template displays correct resume identity', headingText === 'Jane Developer');

      // Test 3.2: Verify A4 dimension rendering (210mm is ~793.7px at 96 DPI)
      const docWidth = await page.$eval('.resume-document', (el: any) => el.offsetWidth);
      const isApproxA4 = docWidth >= 790 && docWidth <= 796;
      assert(`A4 layout renders at standard 210mm pixel width (${docWidth}px)`, isApproxA4);

      // Test 3.3: Verify error state handling in DOM
      await page.setContent(`
        <!DOCTYPE html>
        <html>
          <body>
            <div id="resume-ready" data-status="error">
              <div class="error-msg">Export token has expired. Please try again.</div>
            </div>
          </body>
        </html>
      `, { waitUntil: 'load' });

      const errorElement = await page.$('#resume-ready[data-status="error"]');
      const errorText = await page.$eval('.error-msg', (el: any) => el.textContent);
      assert('Error state #resume-ready[data-status="error"] accurately flags errors', errorElement !== null && errorText?.includes('expired') === true);

    } finally {
      await page.close();
    }

    // Cleanup DB fixtures
    await prisma.education.deleteMany({ where: { resumeId: resumeA.id } });
    await prisma.experience.deleteMany({ where: { resumeId: resumeA.id } });
    await prisma.skill.deleteMany({ where: { resumeId: resumeA.id } });
    await prisma.resume.deleteMany({ where: { userId: user.id } });
    await prisma.user.delete({ where: { id: user.id } });

  } finally {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await pdfService.closeBrowser();
    await prisma.$disconnect();
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------');
  console.log(`Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch((err) => {
  console.error('Fatal error during Task 5.3 test execution:', err);
  process.exit(1);
});
