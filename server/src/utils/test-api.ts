/**
 * Automated API verification test for backend.
 * Run: npx tsx src/utils/test-api.ts
 * Requires the server to be running on PORT from .env
 */

import http from 'http';
import app from '../app';
import {
  authRegisterRateLimiterInstance,
  authLoginRateLimiterInstance,
} from '../middleware/rateLimit.middleware';

const PORT = process.env.TEST_PORT ? parseInt(process.env.TEST_PORT, 10) : 5095;
const BASE_URL = `http://127.0.0.1:${PORT}/api`;

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

async function json(res: Response): Promise<any> {
  return res.json();
}

async function runTests() {
  console.log(`\n🔧 Testing API at ${BASE_URL}\n`);

  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(PORT, '127.0.0.1', () => resolve()));

  try {
    // ── Health Check ──────────────────────────────────────────
    console.log('Health Check');
    const healthRes = await fetch(`${BASE_URL}/health`);
    const healthData = await json(healthRes);
    assert('GET /api/health returns ok', healthData.status === 'ok');

  // ── Auth: Registration ────────────────────────────────────
  console.log('\nAuth: Registration');
  const testEmail = `test_${Date.now()}@example.com`;

  const regRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'SecurePass123',
      firstName: 'Test',
      lastName: 'User',
    }),
  });
  const regData = await json(regRes);
  assert('Register new user → 201', regRes.status === 201 && regData.success === true);
  assert('Returns token', typeof regData.data?.token === 'string');
  assert('Returns user without password', regData.data?.user?.email === testEmail && !regData.data?.user?.password);

  const token = regData.data?.token;

  // Duplicate email
  const dupRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: testEmail,
      password: 'OtherPass456',
      firstName: 'Dup',
      lastName: 'User',
    }),
  });
  assert('Register duplicate email → 409', dupRes.status === 409);

  // Invalid email
  const badEmailRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'not-an-email',
      password: 'SecurePass123',
      firstName: 'Bad',
      lastName: 'Email',
    }),
  });
  assert('Register invalid email → 400', badEmailRes.status === 400);

  // Weak password
  authRegisterRateLimiterInstance.reset();
  const weakPwRes = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'another@example.com',
      password: '123',
      firstName: 'Weak',
      lastName: 'Pass',
    }),
  });
  assert('Register weak password → 400', weakPwRes.status === 400);

  // ── Auth: Login ───────────────────────────────────────────
  console.log('\nAuth: Login');
  const loginRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'SecurePass123' }),
  });
  const loginData = await json(loginRes);
  assert('Login correct credentials → 200', loginRes.status === 200 && loginData.success === true);
  assert('Login returns token', typeof loginData.data?.token === 'string');

  const wrongPwRes = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: testEmail, password: 'WrongPassword' }),
  });
  assert('Login wrong password → 401', wrongPwRes.status === 401);

  // ── Auth: Protected routes ────────────────────────────────
  console.log('\nAuth: Protected Routes');
  const noTokenRes = await fetch(`${BASE_URL}/resumes`);
  assert('No token → 401', noTokenRes.status === 401);

  const badTokenRes = await fetch(`${BASE_URL}/resumes`, {
    headers: { Authorization: 'Bearer invalid.token.here' },
  });
  assert('Invalid token → 401', badTokenRes.status === 401);

  const meRes = await fetch(`${BASE_URL}/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  const meData = await json(meRes);
  assert('GET /api/auth/me → returns user', meData.data?.user?.email === testEmail);

  // ── Resume CRUD ───────────────────────────────────────────
  console.log('\nResume: CRUD');
  const auth = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };

  // Create
  const createRes = await fetch(`${BASE_URL}/resumes`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({
      title: 'Full Stack Engineer Resume',
      templateId: 'modern',
      fullName: 'Test User',
      phone: '+1 (555) 019-2834',
      location: 'San Francisco, CA',
      summary: 'Passionate developer.',
    }),
  });
  const createData = await json(createRes);
  const resumeId = createData.data?.resume?.id;
  assert('Create resume → 201', createRes.status === 201 && typeof resumeId === 'string');

  // List
  const listRes = await fetch(`${BASE_URL}/resumes`, { headers: auth });
  const listData = await json(listRes);
  assert('List resumes → includes created', listData.data?.resumes?.length >= 1);

  // Get by ID
  const getRes = await fetch(`${BASE_URL}/resumes/${resumeId}`, { headers: auth });
  const getData = await json(getRes);
  assert('Get resume by ID → correct resume', getData.data?.resume?.id === resumeId);

  // Update with nested relations
  const updateRes = await fetch(`${BASE_URL}/resumes/${resumeId}`, {
    method: 'PUT',
    headers: auth,
    body: JSON.stringify({
      title: 'Senior Engineer',
      education: [
        { institution: 'MIT', degree: 'BS CS', startDate: '2020', endDate: '2024' },
      ],
      experiences: [
        { company: 'Google', position: 'SWE', startDate: '2024', current: true },
      ],
      skills: [
        { name: 'TypeScript', category: 'Languages', level: 'Advanced' },
        { name: 'React', category: 'Frontend', level: 'Advanced' },
      ],
      projects: [
        { name: 'Resume Builder', description: 'Full-stack app', technologies: 'React, Node' },
      ],
    }),
  });
  const updateData = await json(updateRes);
  const ur = updateData.data?.resume;
  assert('Update resume + nested relations → correct counts',
    ur?.education?.length === 1 &&
    ur?.experiences?.length === 1 &&
    ur?.skills?.length === 2 &&
    ur?.projects?.length === 1
  );

  // Request non-existent resume
  const notFoundRes = await fetch(`${BASE_URL}/resumes/00000000-0000-0000-0000-000000000000`, { headers: auth });
  assert('Non-existent resume → 404', notFoundRes.status === 404);

  // Invalid resume data
  const badDataRes = await fetch(`${BASE_URL}/resumes`, {
    method: 'POST',
    headers: auth,
    body: JSON.stringify({ title: '', templateId: 'invalid' }),
  });
  assert('Invalid resume data → 400', badDataRes.status === 400);

  // Create second user and try to access first user's resume
  console.log('\nResume: Authorization');
  authRegisterRateLimiterInstance.reset();
  const user2Email = `user2_${Date.now()}@example.com`;
  const reg2Res = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: user2Email,
      password: 'SecurePass123',
      firstName: 'Other',
      lastName: 'User',
    }),
  });
  const reg2Data = await json(reg2Res);
  const token2 = reg2Data.data?.token;
  const auth2 = { Authorization: `Bearer ${token2}`, 'Content-Type': 'application/json' };

  const crossAccessRes = await fetch(`${BASE_URL}/resumes/${resumeId}`, { headers: auth2 });
  assert('Cross-user access → 404 (not found, not forbidden)', crossAccessRes.status === 404);

  const crossDeleteRes = await fetch(`${BASE_URL}/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: auth2,
  });
  assert('Cross-user delete → 404', crossDeleteRes.status === 404);

  // Delete (by rightful owner)
  console.log('\nResume: Delete');
  const deleteRes = await fetch(`${BASE_URL}/resumes/${resumeId}`, {
    method: 'DELETE',
    headers: auth,
  });
  const deleteData = await json(deleteRes);
  assert('Delete own resume → 200', deleteRes.status === 200 && deleteData.success === true);

  // Verify deletion
  const listAfterRes = await fetch(`${BASE_URL}/resumes`, { headers: auth });
  const listAfterData = await json(listAfterRes);
  assert('Resume deleted from list', listAfterData.data?.resumes?.length === 0);

  } finally {
    if (server) {
      server.closeAllConnections?.();
      await new Promise<void>((resolve) => server.close(() => resolve()));
    }
  }

  // ── Summary ───────────────────────────────────────────────
  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Results: ${passed} passed, ${failed} failed, ${passed + failed} total`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch((err) => {
  console.error('Test runner error:', err);
  process.exit(1);
});
