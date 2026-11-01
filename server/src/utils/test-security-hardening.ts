/**
 * Comprehensive Automated Security Hardening Test Suite
 *
 * Verifies:
 * - SEC-01: Authentication rate limiting (Login 5/min, Register 3/min), headers, IP isolation, and credential enumeration protection.
 * - SEC-02: PDF export per-user rate limiting (5/min), Puppeteer ConcurrencyLimiter bounded capacity (3 concurrent, 10 queue), slot release, and timeout.
 * - SEC-03: Startup fast-fail validation for missing, empty, or insecure JWT_SECRET values in production.
 * - SEC-04: Strict JWT purpose isolation between session tokens ('session') and headless PDF render tokens ('pdf-render').
 *
 * Run: npx tsx server/src/utils/test-security-hardening.ts
 */

import http from 'http';
import app from '../app';
import prisma from '../config/database';
import { validateJwtSecret, INSECURE_JWT_SECRETS } from '../config';
import { signToken, verifyToken, signExportToken, verifyExportToken } from './jwt';
import {
  authLoginRateLimiterInstance,
  authRegisterRateLimiterInstance,
  pdfDownloadRateLimiterInstance,
} from '../middleware/rateLimit.middleware';
import { ConcurrencyLimiter, pdfService } from '../services/pdf.service';
import { ApiError } from './apiError';

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

async function runSecurityHardeningTests() {
  console.log('\n================================================================');
  console.log('   Backend Security Hardening Verification Suite');
  console.log('================================================================\n');

  // Start dedicated in-process HTTP test server on an isolated port
  const server = http.createServer(app);
  const TEST_PORT = 5096;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, '127.0.0.1', () => resolve()));
  const baseUrl = `http://127.0.0.1:${TEST_PORT}/api`;

  const timestamp = Date.now();
  let userA: any = null;
  let userB: any = null;
  let resumeA: any = null;
  let tokenA = '';
  let tokenB = '';

  try {
    // Clean initial rate limiter states for deterministic testing
    authLoginRateLimiterInstance.reset();
    authRegisterRateLimiterInstance.reset();
    pdfDownloadRateLimiterInstance.reset();

    // ─────────────────────────────────────────────────────────────
    // SEC-03: Startup Fast-Fail JWT Secret Validation
    // ─────────────────────────────────────────────────────────────
    console.log('1. SEC-03 — Production Fast-Fail JWT Secret Validation:');

    // Test 1.1: Missing secret in production throws fatal error
    let missingThrows = false;
    try {
      validateJwtSecret(undefined, 'production');
    } catch (err: any) {
      missingThrows = err.message.includes('JWT_SECRET environment variable is missing or empty in production mode');
    }
    assert('Missing JWT_SECRET in production throws fatal error', missingThrows);

    // Test 1.2: Empty / whitespace secret in production throws fatal error
    let emptyThrows = false;
    try {
      validateJwtSecret('   ', 'production');
    } catch (err: any) {
      emptyThrows = err.message.includes('missing or empty');
    }
    assert('Empty/whitespace JWT_SECRET in production throws fatal error', emptyThrows);

    // Test 1.3: Known insecure fallback secrets in production throw fatal error
    let insecureThrowsCount = 0;
    const testInsecureList = ['fallback-secret-do-not-use', 'secret', 'changeme', 'password', 'jwt-secret'];
    for (const weakSecret of testInsecureList) {
      try {
        validateJwtSecret(weakSecret, 'production');
      } catch (err: any) {
        if (err.message.includes('known weak fallback') || err.message.includes('too short')) {
          insecureThrowsCount++;
        }
      }
    }
    assert(
      'Known weak fallback secrets in production are rejected',
      insecureThrowsCount === testInsecureList.length
    );

    // Test 1.4: Short secret (<16 chars) in production throws fatal error
    let shortThrows = false;
    try {
      validateJwtSecret('short-12345', 'production');
    } catch (err: any) {
      shortThrows = err.message.includes('too short (<16 chars)');
    }
    assert('Short secret (<16 chars) in production throws fatal error', shortThrows);

    // Test 1.5: Valid strong secret in production succeeds
    const strongSecret = 'super-strong-production-entropy-key-32-chars-long';
    const validatedProd = validateJwtSecret(strongSecret, 'production');
    assert('Strong secret (>=16 chars) in production is accepted', validatedProd === strongSecret);

    // Test 1.6: Development mode provides safe fallback if secret omitted
    const devFallback = validateJwtSecret(undefined, 'development');
    assert('Development mode safely defaults without throwing', typeof devFallback === 'string' && devFallback.length > 0);

    // ─────────────────────────────────────────────────────────────
    // SEC-04: Session & Export Token Purpose Isolation
    // ─────────────────────────────────────────────────────────────
    console.log('\n2. SEC-04 — JWT Purpose & Token Isolation:');

    // Create DB users & resume
    userA = await prisma.user.create({
      data: {
        email: `sec_test_a_${timestamp}@example.com`,
        password: 'hashed_password_a',
        firstName: 'Security',
        lastName: 'UserA',
      },
    });

    userB = await prisma.user.create({
      data: {
        email: `sec_test_b_${timestamp}@example.com`,
        password: 'hashed_password_b',
        firstName: 'Security',
        lastName: 'UserB',
      },
    });

    resumeA = await prisma.resume.create({
      data: {
        userId: userA.id,
        title: 'Security Hardened Resume',
        templateId: 'modern',
        fullName: 'Security Engineer',
      },
    });

    tokenA = signToken({ userId: userA.id, email: userA.email });
    tokenB = signToken({ userId: userB.id, email: userB.email });
    const exportTokenA = signExportToken({ userId: userA.id, resumeId: resumeA.id });

    // Test 2.1: signToken includes purpose: 'session'
    const decodedSession = verifyToken(tokenA);
    assert(
      'signToken assigns purpose: "session" in payload',
      decodedSession.purpose === 'session' && decodedSession.userId === userA.id
    );

    // Test 2.2: Export token has purpose: 'pdf-render'
    const decodedExport = verifyExportToken(exportTokenA);
    assert(
      'signExportToken assigns purpose: "pdf-render" in payload',
      decodedExport.purpose === 'pdf-render' && decodedExport.resumeId === resumeA.id
    );

    // Test 2.3: Session token rejected by verifyExportToken
    let sessionRejectedByExport = false;
    try {
      verifyExportToken(tokenA);
    } catch (err: any) {
      sessionRejectedByExport = err.message.includes('Invalid token purpose');
    }
    assert('verifyExportToken rejects normal session token', sessionRejectedByExport);

    // Test 2.4: Export token rejected by verifyToken
    let exportRejectedBySession = false;
    try {
      verifyToken(exportTokenA);
    } catch (err: any) {
      exportRejectedBySession = err.message.includes('Invalid token purpose');
    }
    assert('verifyToken rejects PDF export token', exportRejectedBySession);

    // Test 2.5: HTTP check: Session token rejected at /render-data?token=... with 401
    const renderWithSessionRes = await fetch(
      `${baseUrl}/resumes/${resumeA.id}/render-data?token=${encodeURIComponent(tokenA)}`
    );
    assert(
      'GET /api/resumes/:id/render-data rejects normal session token with 401',
      renderWithSessionRes.status === 401
    );

    // Test 2.6: HTTP check: Export token rejected at authenticated /api/resumes with 401
    const resumesWithExportRes = await fetch(`${baseUrl}/resumes`, {
      headers: { Authorization: `Bearer ${exportTokenA}` },
    });
    assert(
      'GET /api/resumes rejects PDF export token with 401 Unauthorized',
      resumesWithExportRes.status === 401
    );

    // ─────────────────────────────────────────────────────────────
    // SEC-01: Authentication Rate Limiting & Protections
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. SEC-01 — Authentication Rate Limiting (Login & Register):');

    authLoginRateLimiterInstance.reset();
    authRegisterRateLimiterInstance.reset();

    // Test 3.1: Login Rate Limit - 5 attempts allowed, 6th blocked with 429
    let loginHeadersOk = false;
    let loginBlocked = false;
    let loginRetryAfter = '';

    for (let i = 1; i <= 6; i++) {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'nonexistent@example.com', password: 'wrongpassword' }),
      });

      if (i <= 5) {
        const remaining = res.headers.get('RateLimit-Remaining');
        const limit = res.headers.get('RateLimit-Limit');
        if (limit === '5' && remaining === String(5 - i)) {
          loginHeadersOk = true;
        }
      } else {
        // 6th attempt should be 429
        if (res.status === 429) {
          loginBlocked = true;
          loginRetryAfter = res.headers.get('Retry-After') || '';
        }
      }
    }

    assert('POST /api/auth/login provides RateLimit-Limit and RateLimit-Remaining headers', loginHeadersOk);
    assert(
      'POST /api/auth/login enforces 5 req/min limit, returning 429 on 6th attempt',
      loginBlocked && parseInt(loginRetryAfter, 10) > 0
    );

    // Test 3.2: Malformed login requests cannot bypass limiter
    // Limiter is already exhausted for this IP, so even malformed JSON or empty body is blocked with 429
    const malformedRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ badField: 123 }),
    });
    assert('Malformed login request cannot bypass exhausted rate limiter (returns 429)', malformedRes.status === 429);

    // Test 3.3: Register Rate Limit - 3 attempts allowed, 4th blocked with 429
    let registerHeadersOk = false;
    let registerBlocked = false;

    for (let i = 1; i <= 4; i++) {
      const res = await fetch(`${baseUrl}/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: `test_${i}@example.com`, password: 'short' }),
      });

      if (i <= 3) {
        const limit = res.headers.get('RateLimit-Limit');
        const remaining = res.headers.get('RateLimit-Remaining');
        if (limit === '3' && remaining === String(3 - i)) {
          registerHeadersOk = true;
        }
      } else {
        if (res.status === 429) {
          registerBlocked = true;
        }
      }
    }

    assert('POST /api/auth/register provides RateLimit-Limit and RateLimit-Remaining headers', registerHeadersOk);
    assert('POST /api/auth/register enforces 3 req/min limit, returning 429 on 4th attempt', registerBlocked);

    // Test 3.4: IP Isolation (Mock req tests on limiter instances)
    authLoginRateLimiterInstance.reset();
    const mockResA = {
      setHeader: (_k: string, _v: any) => {},
      status: (_s: number) => ({ json: () => {} }),
    } as any;
    let blockedA = false;
    let blockedB = false;

    const reqIpA = { ip: '198.51.100.1', socket: {} } as any;
    const reqIpB = { ip: '198.51.100.2', socket: {} } as any;

    const middleware = authLoginRateLimiterInstance.middleware();

    // Consume all 5 slots for IP A
    for (let i = 0; i < 5; i++) {
      middleware(reqIpA, mockResA, () => {});
    }
    // 6th request for IP A should trigger 429
    const mockRes429 = {
      setHeader: () => {},
      status: (code: number) => {
        if (code === 429) blockedA = true;
        return { json: () => {} };
      },
    } as any;
    middleware(reqIpA, mockRes429, () => {});

    // Request for IP B should pass cleanly
    let passedB = false;
    middleware(reqIpB, mockResA, () => {
      passedB = true;
    });

    assert('IP rate limiting isolates buckets: IP A blocked does not block IP B', blockedA && passedB);

    // Test 3.5: Avoid exposing whether an email address is registered
    authLoginRateLimiterInstance.reset();
    const wrongPasswordRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: userA.email, password: 'WrongPassword123!' }),
    });
    const nonExistentEmailRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: `no_such_email_${timestamp}@example.com`, password: 'WrongPassword123!' }),
    });
    const wrongPwData: any = await wrongPasswordRes.json();
    const nonExistentData: any = await nonExistentEmailRes.json();

    assert(
      'Login responses return identical generic 401 error message preventing email enumeration',
      wrongPasswordRes.status === 401 &&
        nonExistentEmailRes.status === 401 &&
        wrongPwData.message === nonExistentData.message &&
        wrongPwData.message === 'Invalid email or password.'
    );

    // ─────────────────────────────────────────────────────────────
    // SEC-02: Resource Protection on PDF Export
    // ─────────────────────────────────────────────────────────────
    console.log('\n4. SEC-02 — PDF Export Rate Limiting & Concurrency Queue:');

    pdfDownloadRateLimiterInstance.reset();

    // Test 4.1: PDF rate limit per authenticated user (5 req/min)
    let pdfLimitEnforced = false;
    for (let i = 1; i <= 6; i++) {
      // Use nonexistent resume ID so we test rate limiter overhead without Puppeteer render execution
      const res = await fetch(`${baseUrl}/resumes/00000000-0000-0000-0000-000000000000/pdf`, {
        headers: { Authorization: `Bearer ${tokenA}` },
      });

      if (i === 6 && res.status === 429) {
        pdfLimitEnforced = true;
      }
    }
    assert('GET /api/resumes/:id/pdf enforces 5 req/min per user, returning 429 on 6th request', pdfLimitEnforced);

    // Test 4.2: User isolation for PDF rate limit (User A blocked does not block User B)
    const userBRes = await fetch(`${baseUrl}/resumes/00000000-0000-0000-0000-000000000000/pdf`, {
      headers: { Authorization: `Bearer ${tokenB}` },
    });
    // User B should get 404 (downstream resume not found), NOT 429
    assert('PDF rate limit isolates user buckets: User A blocked does not block User B', userBRes.status === 404);

    // Test 4.3: ConcurrencyLimiter unit behavior - Capacity bounding
    const testLimiter = new ConcurrencyLimiter(3, 10, 2000);

    // Acquire 3 active slots
    await testLimiter.acquire();
    await testLimiter.acquire();
    await testLimiter.acquire();
    assert('ConcurrencyLimiter holds 3 active slots', testLimiter.getActiveCount() === 3);

    // Enqueue 10 pending requests
    const queuePromises: Promise<void>[] = [];
    for (let i = 0; i < 10; i++) {
      queuePromises.push(testLimiter.acquire().catch(() => {}));
    }
    assert('ConcurrencyLimiter enqueues up to maxQueueLength (10)', testLimiter.getQueueLength() === 10);

    // 14th request must be rejected immediately with 503 Capacity error
    let capacityRejected = false;
    try {
      await testLimiter.acquire();
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 503 && err.message.includes('maximum capacity')) {
        capacityRejected = true;
      }
    }
    assert('ConcurrencyLimiter rejects 14th request with 503 Maximum Capacity', capacityRejected);

    // Test 4.4: ConcurrencyLimiter FIFO resolution & slot release
    testLimiter.release(); // Releases one active slot, should resolve first queued item
    assert('Releasing slot transfers capacity to queued item (queue length drops to 9)', testLimiter.getQueueLength() === 9);

    // Test 4.5: Slot release on failure in finally block
    const sampleJobWithCleanup = async () => {
      await testLimiter.acquire();
      try {
        throw new Error('Simulated rendering failure');
      } finally {
        testLimiter.release();
      }
    };

    // Clean up test limiter
    testLimiter.reset();
    assert('testLimiter.reset() cleans up all queue items and active count', testLimiter.getActiveCount() === 0 && testLimiter.getQueueLength() === 0);

    let jobFailedCleanly = false;
    try {
      await sampleJobWithCleanup();
    } catch (err: any) {
      jobFailedCleanly = err.message === 'Simulated rendering failure';
    }
    assert(
      'Task error inside try/finally properly releases slot (active count returns to 0)',
      jobFailedCleanly && testLimiter.getActiveCount() === 0
    );

    // Test 4.6: Queue timeout behavior
    const timeoutLimiter = new ConcurrencyLimiter(1, 1, 100); // 100ms timeout
    await timeoutLimiter.acquire(); // fill capacity
    let queueTimedOut = false;
    try {
      await timeoutLimiter.acquire(100);
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 503 && err.message.includes('queue timeout')) {
        queueTimedOut = true;
      }
    }
    assert('Queued item exceeding timeout rejects with 503 Queue Timeout', queueTimedOut);
    timeoutLimiter.reset();

    // Verify singleton pdfService has configured concurrencyLimiter
    assert(
      'pdfService has concurrencyLimiter initialized with maxConcurrent=3, maxQueueLength=10',
      pdfService.concurrencyLimiter.maxConcurrent === 3 &&
        pdfService.concurrencyLimiter.maxQueueLength === 10
    );

  } finally {
    // Cleanup DB fixtures
    if (resumeA) {
      await prisma.resume.deleteMany({ where: { id: resumeA.id } });
    }
    if (userA) {
      await prisma.user.deleteMany({ where: { id: userA.id } });
    }
    if (userB) {
      await prisma.user.deleteMany({ where: { id: userB.id } });
    }

    // Reset rate limiter stores
    authLoginRateLimiterInstance.reset();
    authRegisterRateLimiterInstance.reset();
    pdfDownloadRateLimiterInstance.reset();

    // Close test server
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await prisma.$disconnect();
  }

  console.log('\n----------------------------------------------------------------');
  console.log(`Security Hardening Test Results: ${passed} passed, ${failed} failed`);
  console.log('----------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runSecurityHardeningTests().catch((err) => {
  console.error('Fatal error during security hardening tests:', err);
  process.exit(1);
});
