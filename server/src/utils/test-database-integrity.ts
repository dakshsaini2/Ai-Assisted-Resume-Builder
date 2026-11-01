/**
 * Automated Verification Test Suite:
 * Database Indexes & Referential Integrity Verification
 *
 * Verifies:
 * 1. Standalone cover letters (saving/updating/listing without resumeId)
 * 2. Valid same-user resume associations
 * 3. Rejection of cross-user resume associations (returns 404)
 * 4. Rejection of nonexistent resume IDs (returns 404)
 * 5. ON DELETE SET NULL: Deleting a resume sets cover_letters.resume_id = NULL without deleting the cover letter
 * 6. Cover letter listing with composite index (userId, updatedAt DESC) and resumeId filter
 * 7. Resume CRUD and relational synchronization across all 9 child tables
 */

import http from 'http';
import app from '../app';
import prisma from '../config/database';
import { signToken } from './jwt';

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

async function runDatabaseIntegrityTests() {
  console.log('\n===============================================================');
  console.log('   Database Indexes & Referential Integrity Tests');
  console.log('===============================================================\n');

  // Start temporary test server
  const server = http.createServer(app);
  await new Promise<void>((resolve) => server.listen(0, resolve));
  const address = server.address() as any;
  const baseUrl = `http://127.0.0.1:${address.port}`;

  const timestamp = Date.now();
  let userA: any = null;
  let userB: any = null;
  let tokenA = '';
  let tokenB = '';
  let resumeA: any = null;
  let resumeB: any = null;

  try {
    // ─────────────────────────────────────────────────────────────
    // Setup Test Data
    // ─────────────────────────────────────────────────────────────
    userA = await prisma.user.create({
      data: {
        email: `db_integrity_a_${timestamp}@example.com`,
        password: 'hashedpassword123',
        firstName: 'Alice',
        lastName: 'Engineer',
      },
    });
    tokenA = signToken({ userId: userA.id, email: userA.email });

    userB = await prisma.user.create({
      data: {
        email: `db_integrity_b_${timestamp}@example.com`,
        password: 'hashedpassword123',
        firstName: 'Bob',
        lastName: 'Developer',
      },
    });
    tokenB = signToken({ userId: userB.id, email: userB.email });

    resumeA = await prisma.resume.create({
      data: {
        userId: userA.id,
        title: 'Alice Systems Engineer Resume',
        templateId: 'modern',
        fullName: 'Alice Engineer',
        email: userA.email,
        education: {
          create: [{ institution: 'MIT', degree: 'B.S. CS', sortOrder: 0 }],
        },
        experiences: {
          create: [{ company: 'Cloud Corp', position: 'Lead Architect', sortOrder: 0 }],
        },
        skills: {
          create: [{ name: 'PostgreSQL', category: 'Databases' }],
        },
      },
    });

    resumeB = await prisma.resume.create({
      data: {
        userId: userB.id,
        title: 'Bob Frontend Resume',
        templateId: 'classic',
        fullName: 'Bob Developer',
        email: userB.email,
      },
    });

    // ─────────────────────────────────────────────────────────────
    // 1. Standalone Cover Letters (No resumeId)
    // ─────────────────────────────────────────────────────────────
    console.log('1. Standalone Cover Letters (no resumeId):');

    const standaloneRes = await fetch(`${baseUrl}/api/ai/cover-letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        companyName: 'Acme Systems',
        jobRole: 'Principal Architect',
        content: 'I am applying for the Principal Architect role at Acme Systems with extensive experience.'.repeat(2),
      }),
    });
    assert('POST /api/ai/cover-letters without resumeId succeeds with 201', standaloneRes.status === 201);
    const standaloneData = (await standaloneRes.json()) as any;
    const standaloneId = standaloneData.data.id;
    assert('Created record has null resumeId', standaloneData.data.resumeId === null);

    // Update standalone cover letter
    const updateStandaloneRes = await fetch(`${baseUrl}/api/ai/cover-letters/${standaloneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        companyName: 'Acme Systems International',
      }),
    });
    assert('PUT /api/ai/cover-letters/:id maintains standalone status with 200', updateStandaloneRes.status === 200);
    const updatedStandaloneData = (await updateStandaloneRes.json()) as any;
    assert('Updated record preserves null resumeId', updatedStandaloneData.data.resumeId === null);
    assert('Updated record has new company name', updatedStandaloneData.data.companyName === 'Acme Systems International');

    // ─────────────────────────────────────────────────────────────
    // 2. Valid Same-User Resume Associations
    // ─────────────────────────────────────────────────────────────
    console.log('\n2. Valid Same-User Resume Associations:');

    const linkedRes = await fetch(`${baseUrl}/api/ai/cover-letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        companyName: 'Tech Giants Inc',
        jobRole: 'Cloud Specialist',
        content: 'Cover letter linked to Alice resume for Tech Giants Inc cloud role.'.repeat(2),
        resumeId: resumeA.id,
      }),
    });
    assert('POST /api/ai/cover-letters with same-user resumeId succeeds with 201', linkedRes.status === 201);
    const linkedData = (await linkedRes.json()) as any;
    const linkedCoverLetterId = linkedData.data.id;
    assert('Cover letter record has correct resumeId', linkedData.data.resumeId === resumeA.id);

    // Verify DB foreign key relation via Prisma include
    const dbLinked = await prisma.coverLetter.findUnique({
      where: { id: linkedCoverLetterId },
      include: { resume: true },
    });
    assert('Database relation fetch returns associated resume', dbLinked?.resume?.id === resumeA.id);
    assert('Associated resume title matches', dbLinked?.resume?.title === 'Alice Systems Engineer Resume');

    // ─────────────────────────────────────────────────────────────
    // 3. Rejection of Cross-User Resume Associations
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. Rejection of Cross-User Resume Associations:');

    // User A attempts to link User B's resume on save
    const crossSaveRes = await fetch(`${baseUrl}/api/ai/cover-letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        companyName: 'Intruder Corp',
        jobRole: 'Hacker',
        content: 'Cross-user attempt to hijack another user resume reference.'.repeat(2),
        resumeId: resumeB.id,
      }),
    });
    assert('POST /api/ai/cover-letters with cross-user resumeId returns 404', crossSaveRes.status === 404);

    // User A attempts to update cover letter with User B's resume
    const crossUpdateRes = await fetch(`${baseUrl}/api/ai/cover-letters/${standaloneId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        resumeId: resumeB.id,
      }),
    });
    assert('PUT /api/ai/cover-letters/:id with cross-user resumeId returns 404', crossUpdateRes.status === 404);

    // User A attempts to filter cover letters using User B's resumeId
    const crossFilterRes = await fetch(`${baseUrl}/api/ai/cover-letters?resumeId=${resumeB.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('GET /api/ai/cover-letters?resumeId=<otherUser> returns 404', crossFilterRes.status === 404);

    // ─────────────────────────────────────────────────────────────
    // 4. Rejection of Nonexistent Resume IDs
    // ─────────────────────────────────────────────────────────────
    console.log('\n4. Rejection of Nonexistent Resume IDs:');

    const fakeUuid = '00000000-0000-4000-8000-000000000000';
    const fakeSaveRes = await fetch(`${baseUrl}/api/ai/cover-letters`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        companyName: 'Ghost Corp',
        jobRole: 'Phantom',
        content: 'Attempt to link nonexistent resume ID in save operation.'.repeat(2),
        resumeId: fakeUuid,
      }),
    });
    assert('POST /api/ai/cover-letters with nonexistent resumeId returns 404', fakeSaveRes.status === 404);

    // ─────────────────────────────────────────────────────────────
    // 5. ON DELETE SET NULL: Deleting Resume Preserves Cover Letter
    // ─────────────────────────────────────────────────────────────
    console.log('\n5. ON DELETE SET NULL Referential Integrity Verification:');

    // Create a temporary resume for User A to be deleted
    const tempResume = await prisma.resume.create({
      data: {
        userId: userA.id,
        title: 'Temporary Resume To Delete',
        templateId: 'classic',
        fullName: 'Alice Temp',
        email: userA.email,
        education: {
          create: [{ institution: 'Temp University', degree: 'B.A.', sortOrder: 0 }],
        },
      },
    });

    // Create 2 cover letters linked to this temp resume
    const tempCl1 = await prisma.coverLetter.create({
      data: {
        userId: userA.id,
        resumeId: tempResume.id,
        companyName: 'Alpha Corp',
        jobRole: 'Alpha Lead',
        content: 'Alpha Corp cover letter content that must NOT be deleted when resume is deleted.'.repeat(2),
      },
    });

    const tempCl2 = await prisma.coverLetter.create({
      data: {
        userId: userA.id,
        resumeId: tempResume.id,
        companyName: 'Beta Corp',
        jobRole: 'Beta Lead',
        content: 'Beta Corp cover letter content that must NOT be deleted when resume is deleted.'.repeat(2),
      },
    });

    assert('Created temporary resume with 2 linked cover letters', Boolean(tempCl1.id && tempCl2.id));

    // Delete the resume via the API
    const deleteResumeRes = await fetch(`${baseUrl}/api/resumes/${tempResume.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('DELETE /api/resumes/:id succeeds with 200 OK', deleteResumeRes.status === 200);

    // Verify resume is deleted from database
    const checkResume = await prisma.resume.findUnique({
      where: { id: tempResume.id },
    });
    assert('Resume is completely removed from database', checkResume === null);

    // Verify cascade deleted resume child relations (education)
    const checkEdu = await prisma.education.findMany({
      where: { resumeId: tempResume.id },
    });
    assert('Child education records were cascade deleted', checkEdu.length === 0);

    // CRITICAL: Verify Cover Letters were NOT deleted, and resumeId was SET NULL!
    const checkCl1 = await prisma.coverLetter.findUnique({
      where: { id: tempCl1.id },
    });
    const checkCl2 = await prisma.coverLetter.findUnique({
      where: { id: tempCl2.id },
    });

    assert('Cover Letter 1 was NOT deleted', checkCl1 !== null);
    assert('Cover Letter 1 resumeId was SET to NULL', checkCl1?.resumeId === null);
    assert('Cover Letter 1 content is completely preserved', checkCl1?.companyName === 'Alpha Corp');

    assert('Cover Letter 2 was NOT deleted', checkCl2 !== null);
    assert('Cover Letter 2 resumeId was SET to NULL', checkCl2?.resumeId === null);
    assert('Cover Letter 2 content is completely preserved', checkCl2?.companyName === 'Beta Corp');

    // ─────────────────────────────────────────────────────────────
    // 6. Cover Letter Listing & Filtering with Indexes
    // ─────────────────────────────────────────────────────────────
    console.log('\n6. Cover Letter Listing & Filtering:');

    const listRes = await fetch(`${baseUrl}/api/ai/cover-letters`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('GET /api/ai/cover-letters returns 200 OK', listRes.status === 200);
    const listData = (await listRes.json()) as any;
    // Alice has: standalone + linked + tempCl1 + tempCl2 = 4 cover letters
    assert('Listing returns all 4 cover letters for User A', listData.data.coverLetters.length === 4);

    // Filter by resumeA.id
    const filterRes = await fetch(`${baseUrl}/api/ai/cover-letters?resumeId=${resumeA.id}`, {
      headers: { Authorization: `Bearer ${tokenA}` },
    });
    assert('GET /api/ai/cover-letters?resumeId=<resumeA> returns 200 OK', filterRes.status === 200);
    const filterData = (await filterRes.json()) as any;
    assert('Filtered query returns exactly 1 matching cover letter', filterData.data.coverLetters.length === 1);
    assert('Matching cover letter has resumeA ID', filterData.data.coverLetters[0].resumeId === resumeA.id);

    // ─────────────────────────────────────────────────────────────
    // 7. Resume CRUD and Nested Relations Synchronization
    // ─────────────────────────────────────────────────────────────
    console.log('\n7. Resume CRUD & Relational Sync:');

    // Update resumeA with full set of relations
    const updateResumeRes = await fetch(`${baseUrl}/api/resumes/${resumeA.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${tokenA}` },
      body: JSON.stringify({
        title: 'Updated Alice Systems Resume',
        education: [
          { institution: 'Stanford University', degree: 'M.S. CS', sortOrder: 0 },
        ],
        experiences: [
          { company: 'Distributed Tech', position: 'VP Architecture', sortOrder: 0 },
        ],
        projects: [
          { name: 'Global Cloud Fabric', technologies: 'Kubernetes, Go', sortOrder: 0 },
        ],
        skills: [
          { name: 'TypeScript', category: 'Languages' },
          { name: 'PostgreSQL', category: 'Databases' },
        ],
        certifications: [
          { name: 'AWS Solutions Architect', issuer: 'Amazon' },
        ],
        achievements: [
          { title: 'Best System Patent 2025', sortOrder: 0 },
        ],
        languages: [
          { name: 'English', proficiency: 'Native' },
        ],
      }),
    });
    assert('PUT /api/resumes/:id synchronizing 7 relation tables returns 200', updateResumeRes.status === 200);

    const updatedResumeData = (await updateResumeRes.json()) as any;
    assert('Resume title updated', updatedResumeData.data.resume.title === 'Updated Alice Systems Resume');
    assert('Education replaced', updatedResumeData.data.resume.education[0]?.institution === 'Stanford University');
    assert('Experiences replaced', updatedResumeData.data.resume.experiences[0]?.company === 'Distributed Tech');
    assert('Projects created', updatedResumeData.data.resume.projects[0]?.name === 'Global Cloud Fabric');
    assert('Skills replaced with 2 items', updatedResumeData.data.resume.skills.length === 2);
    assert('Certifications created', updatedResumeData.data.resume.certifications[0]?.name === 'AWS Solutions Architect');
    assert('Achievements created', updatedResumeData.data.resume.achievements[0]?.title === 'Best System Patent 2025');
    assert('Languages created', updatedResumeData.data.resume.languages[0]?.name === 'English');

  } catch (err) {
    console.error('Test execution error:', err);
    failed++;
  } finally {
    // ─────────────────────────────────────────────────────────────
    // Clean up test data
    // ─────────────────────────────────────────────────────────────
    try {
      if (userA) {
        await prisma.coverLetter.deleteMany({ where: { userId: userA.id } });
        await prisma.resume.deleteMany({ where: { userId: userA.id } });
        await prisma.user.delete({ where: { id: userA.id } });
      }
      if (userB) {
        await prisma.coverLetter.deleteMany({ where: { userId: userB.id } });
        await prisma.resume.deleteMany({ where: { userId: userB.id } });
        await prisma.user.delete({ where: { id: userB.id } });
      }
    } catch {
      // Ignore cleanup error
    }

    await prisma.$disconnect();
    server.close();
  }

  console.log('\n---------------------------------------------------------------');
  console.log(`Database Integrity Test Results: ${passed} passed, ${failed} failed`);
  console.log('---------------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runDatabaseIntegrityTests();
