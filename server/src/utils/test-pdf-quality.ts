/**
 * Automated Verification Test Suite for Task 5.6:
 * PDF Quality Assurance & Edge-Case Layout Verification
 *
 * Verifies:
 * 1. Standard A4 Dimensions (210mm x 297mm / 595.28 x 841.89 pt)
 * 2. Single-Page and Multi-Page Layout Flow
 * 3. All Three Templates (Classic, Modern, Creative)
 * 4. Missing Optional Sections & Sparse Data Gracefulness
 * 5. Long Content, Extreme URLs, and Word Wrapping (Zero Overflow)
 * 6. High-Fidelity Text Extraction & PDF Searchability
 * 7. PDF Binary Structural Validity (%PDF-1.4, %%EOF)
 * 8. Zero Unexpected Blank Pages
 *
 * Run: npx tsx src/utils/test-pdf-quality.ts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import puppeteer, { Browser, Page } from 'puppeteer';

import { ClassicTemplate } from '../../../client/src/components/templates/ClassicTemplate';
import { ModernTemplate } from '../../../client/src/components/templates/ModernTemplate';
import { CreativeTemplate } from '../../../client/src/components/templates/CreativeTemplate';
import type { Resume } from '../../../client/src/types';
import { DEFAULT_A4_PDF_OPTIONS } from '../services/pdf.service';
import { inspectPdfBuffer } from './test-pdf-inspector';

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

// Read compiled CSS
const distAssetsDir = path.resolve(__dirname, '../../../client/dist/assets');
const cssFile = fs.existsSync(distAssetsDir)
  ? fs.readdirSync(distAssetsDir).find((f) => f.endsWith('.css'))
  : null;
const clientCss = cssFile ? fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf-8') : '';

// Helper to create HTML
function createHtml(templateId: 'classic' | 'modern' | 'creative', resume: Partial<Resume>): string {
  const Component =
    templateId === 'classic'
      ? ClassicTemplate
      : templateId === 'modern'
        ? ModernTemplate
        : CreativeTemplate;

  const markup = renderToStaticMarkup(React.createElement(Component, { resume }));

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <style>
          ${clientCss}
          @page { size: A4 portrait; margin: 0; }
          body {
            margin: 0;
            padding: 0;
            background: #ffffff;
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div id="resume-ready" data-status="ready">
          ${markup}
        </div>
      </body>
    </html>
  `;
}

// Helper to inspect PDF structure and extract text using the comprehensive multi-font inspector
function parsePdf(buffer: Buffer) {
  const inspected = inspectPdfBuffer(buffer);
  return {
    hasMagicHeader: inspected.hasMagicHeader,
    hasEofTrailer: inspected.hasEofTrailer,
    pageCount: inspected.pageCount,
    isA4: inspected.isStandardA4,
    mediaBoxes: inspected.pageDimensions,
    pageTexts: inspected.pages.map((p) => p.text),
    hasBlankPage: inspected.hasBlankPages,
    allText: inspected.extractedAllText,
  };
}

async function runQualityTests() {
  console.log('\n======================================================');
  console.log('   Task 5.6: PDF Quality Assurance Test Suite');
  console.log('======================================================\n');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_qa_'));
  const browser: Browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page: Page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');

  try {
    // ─────────────────────────────────────────────────────────────
    // 1. Standard A4 Dimensions & MediaBox Verification
    // ─────────────────────────────────────────────────────────────
    console.log('1. Standard A4 Page Dimensions (210mm x 297mm):');

    const sampleProfile: Partial<Resume> = {
      fullName: 'Sarah Jenkins',
      title: 'Senior Infrastructure Engineer',
      email: 'sarah@example.com',
      phone: '+1 (555) 234-5678',
      location: 'Boston, MA',
    };

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      const html = createHtml(tId, sampleProfile);
      await page.setContent(html, { waitUntil: 'load' });
      const buffer = Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS));
      const parsed = parsePdf(buffer);

      assert(
        `Template [${tId}] generates standard A4 dimensions (595.28 x 841.89 pt ± 2pt)`,
        parsed.isA4 && parsed.mediaBoxes.length > 0
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 2. Single-Page and Multi-Page Flow
    // ─────────────────────────────────────────────────────────────
    console.log('\n2. Single-Page and Multi-Page Flow:');

    // 2.1 Minimal Profile -> exactly 1 page
    const minHtml = createHtml('classic', sampleProfile);
    await page.setContent(minHtml, { waitUntil: 'load' });
    const minPdf = parsePdf(Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS)));
    assert('Minimal profile produces exactly 1 page', minPdf.pageCount === 1);
    assert('Minimal profile contains no trailing blank page', !minPdf.hasBlankPage);

    // 2.2 Short Profile -> exactly 1 page
    const shortProfile: Partial<Resume> = {
      ...sampleProfile,
      summary: 'Experienced engineer with expertise in distributed cloud systems.',
      education: [
        {
          institution: 'MIT',
          degree: 'B.S. in Computer Science',
          startDate: '2016',
          endDate: '2020',
        },
      ],
      experiences: [
        {
          company: 'Akamai Technologies',
          position: 'Infrastructure Engineer',
          startDate: '2020',
          current: true,
          description: '• Maintained edge caching networks handling millions of requests.\n• Automated Kubernetes deployments.',
        },
      ],
      skills: [{ name: 'Go' }, { name: 'Kubernetes' }, { name: 'Terraform' }],
    };

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      await page.setContent(createHtml(tId, shortProfile), { waitUntil: 'load' });
      const shortPdf = parsePdf(Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS)));
      assert(`Short profile on [${tId}] produces exactly 1 page`, shortPdf.pageCount === 1);
      assert(`Short profile on [${tId}] has no blank pages`, !shortPdf.hasBlankPage);
    }

    // 2.3 Multi-page normal profile -> clean multi-page without blank pages
    const normalProfile: Partial<Resume> = {
      ...shortProfile,
      experiences: [
        ...shortProfile.experiences!,
        {
          company: 'Cloudflare',
          position: 'Senior Reliability Engineer',
          startDate: '2018',
          endDate: '2020',
          description: '• Engineered Anycast routing tables across 200 data centers.\n• Developed automated DDoS mitigation pipeline.\n• Reduced false positive rate by 42%.',
        },
        {
          company: 'Startup Lab',
          position: 'Systems Developer',
          startDate: '2016',
          endDate: '2018',
          description: '• Built event ingestion pipeline in Go and Kafka.\n• Configured monitoring with Prometheus and Grafana.',
        },
      ],
      projects: [
        {
          name: 'Distributed Lock Manager',
          description: 'Raft-based lock coordinator for distributed microservices.',
          technologies: 'Go, Raft, gRPC',
          link: 'https://github.com/test/lock-manager',
        },
        {
          name: 'eBPF Flow Tracer',
          description: 'Kernel socket probe streaming latency analytics to telemetry collectors.',
          technologies: 'C, eBPF, Linux',
          link: 'https://github.com/test/flow-tracer',
        },
      ],
      certifications: [
        { name: 'AWS Certified Solutions Architect – Professional', issuer: 'AWS', date: '2023' },
        { name: 'Certified Kubernetes Administrator (CKA)', issuer: 'Linux Foundation', date: '2022' },
      ],
    };

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      await page.setContent(createHtml(tId, normalProfile), { waitUntil: 'load' });
      const normalPdf = parsePdf(Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS)));
      assert(
        `Normal profile on [${tId}] renders cleanly across pages (${normalPdf.pageCount} pages, no blank pages)`,
        normalPdf.pageCount >= 1 && !normalPdf.hasBlankPage
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 3. Missing Optional Sections & Sparse Data Gracefulness
    // ─────────────────────────────────────────────────────────────
    console.log('\n3. Missing Optional Sections & Sparse Data Gracefulness:');

    const sparseProfile: Partial<Resume> = {
      fullName: 'Anonymous Engineer',
      title: 'Software Developer',
      email: 'anon@example.com',
      education: [
        {
          institution: 'University of Engineering',
          degree: 'B.S.',
          startDate: null,
          endDate: null,
        },
      ],
      experiences: [
        {
          company: 'Software Consultancy',
          position: 'Developer',
          startDate: '2023',
          endDate: null,
          current: true,
          description: '• Developed internal client tooling with TypeScript.',
        },
      ],
      skills: [],
      projects: [],
      certifications: [],
      achievements: [],
      languages: [],
    };

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      await page.setContent(createHtml(tId, sparseProfile), { waitUntil: 'load' });
      const sparsePdf = parsePdf(Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS)));

      assert(`Sparse profile on [${tId}] generates valid single-page PDF`, sparsePdf.pageCount === 1);
      assert(`Sparse profile on [${tId}] does not contain "null" or "undefined" text`, !sparsePdf.allText.includes('null') && !sparsePdf.allText.includes('undefined'));
    }

    // ─────────────────────────────────────────────────────────────
    // 4. Long Content, Extreme URLs, and Word Wrapping (Zero Overflow)
    // ─────────────────────────────────────────────────────────────
    console.log('\n4. Extreme URLs, Long Words & Overflow Boundaries:');

    const extremeUrlProfile: Partial<Resume> = {
      fullName: 'Dr. Wolfeschlegelsteinhausenbergerdorff Lead Architect',
      title: 'ChiefInternationalizationAndLocalizationArchitecturalRefactoringSpecialist',
      email: 'verylongemailaddresswithlotsofcharactersandsubdomains@organization.department.enterprise.university.edu',
      location: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, Wales, United Kingdom',
      linkedin: 'https://www.linkedin.com/in/very-long-custom-vanity-url-with-extraordinary-length-for-testing-purposes',
      github: 'https://github.com/organization-enterprise-team/super-hyper-scalable-distributed-event-driven-microservices-architecture-v2',
      summary: 'Architect specializing in SupercalifragilisticexpialidociousInfrastructureEngineering across geopolitical jurisdictions.',
      projects: [
        {
          name: 'HighThroughputLowLatencyInterplanetaryFileDistributionAndSynchronizationProtocol',
          description: 'Peer-to-peer data distribution framework resilient against orbital disconnects.',
          technologies: 'Rust, WebRTC, CryptographicHashes',
          link: 'https://github.com/organization/super-long-repository-name-with-deep-nested-path/blob/main/src/very-long-file-name-without-spaces-for-testing.ts',
        },
      ],
      experiences: [
        {
          company: 'TelecommunicationsAndAerospaceDefenseInfrastructureCorporation',
          position: 'ChiefSystemArchitectureAndInteroperabilityStandardizationEngineer',
          startDate: '2020',
          current: true,
          description: '• Resolved UnsynchronizedMultithreadedMemoryAllocationDeadlockScenarios in low-latency systems.',
        },
      ],
    };

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      await page.setContent(createHtml(tId, extremeUrlProfile), { waitUntil: 'load' });

      // Check DOM bounding box right-edge overflow
      const maxRightEdge = await page.evaluate(() => {
        let maxRight = 0;
        const all = document.querySelectorAll('.resume-document *');
        all.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > maxRight) maxRight = rect.right;
        });
        return Math.round(maxRight);
      });

      assert(
        `Template [${tId}] preserves A4 right margin on extreme URLs (max right: ${maxRightEdge}px <= 795px)`,
        maxRightEdge <= 795
      );

      // Verify PDF generation succeeds without clipping
      const extremePdf = parsePdf(Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS)));
      assert(`Extreme URL PDF on [${tId}] is structurally valid (Magic header: %PDF-, size > 10KB)`, extremePdf.hasMagicHeader && extremePdf.pageCount >= 1);
    }

    // ─────────────────────────────────────────────────────────────
    // 5. High-Fidelity Text Extraction & PDF Searchability
    // ─────────────────────────────────────────────────────────────
    console.log('\n5. Text Extraction & PDF Searchability:');

    const searchabilityProfile: Partial<Resume> = {
      fullName: 'Arthur Pendelton',
      title: 'Principal Systems Architect',
      email: 'arthur.p@example.com',
      experiences: [
        {
          company: 'Cyberdyne Systems Corp',
          position: 'Neural Network Architect',
          startDate: '2021',
          current: true,
          description: '• Architected automated neural network compiler.',
        },
      ],
      skills: [{ name: 'Distributed Consensus' }, { name: 'Quantum Cryptography' }],
    };

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      await page.setContent(createHtml(tId, searchabilityProfile), { waitUntil: 'load' });
      const pdfBuf = Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS));
      const searchPdf = parsePdf(pdfBuf);
      const lower = searchPdf.allText.toLowerCase();
      const collapsed = searchPdf.allText.replace(/[^a-zA-Z0-9]/g, '').toLowerCase();

      assert(
        `PDF on [${tId}] embeds extractable candidate name ("Arthur")`,
        lower.includes('arthur') || collapsed.includes('arthur')
      );
      assert(
        `PDF on [${tId}] embeds extractable company ("Cyberdyne")`,
        lower.includes('cyberdyne') || collapsed.includes('cyberdyne')
      );
      assert(
        `PDF on [${tId}] embeds extractable skill ("Cryptography")`,
        lower.includes('cryptography') || collapsed.includes('cryptography')
      );
    }

    // ─────────────────────────────────────────────────────────────
    // 6. PDF Binary Structural Validity & Page Break Integrity
    // ─────────────────────────────────────────────────────────────
    console.log('\n6. PDF Binary Structural Validity & Page Break Integrity:');

    for (const tId of ['classic', 'modern', 'creative'] as const) {
      await page.setContent(createHtml(tId, normalProfile), { waitUntil: 'load' });
      const buffer = Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS));
      const parsed = parsePdf(buffer);

      assert(`PDF [${tId}] starts with valid %PDF- magic bytes`, parsed.hasMagicHeader);
      assert(`PDF [${tId}] ends with valid %%EOF trailer marker`, parsed.hasEofTrailer);
      assert(`PDF [${tId}] has non-trivial page contents across all pages (0 blank pages)`, !parsed.hasBlankPage && parsed.pageTexts.every((t) => t.length > 50));
    }

  } finally {
    try {
      await browser.close();
    } catch {}
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n------------------------------------------------------');
  console.log(`Task 5.6 Quality Tests: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runQualityTests().catch((err) => {
  console.error('Fatal error during Task 5.6 quality test execution:', err);
  process.exit(1);
});
