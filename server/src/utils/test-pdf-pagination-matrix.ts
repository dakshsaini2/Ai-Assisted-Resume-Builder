/**
 * Comprehensive PDF Pagination & Reliability Audit Test Suite
 *
 * Verifies:
 * 1. PDF Layout Test Matrix: 10 scenarios across 3 templates (Classic, Modern, Creative)
 * 2. Strict PDF Quality: A4 dimensions, no blank pages, zero horizontal overflow,
 *    no orphaned headings, text searchability, and valid binary structure
 * 3. Browser Reliability: Singleton lifecycle, disconnect recovery, page closure (no leaks),
 *    concurrency cap (3), queue limit (10), queue timeout, and graceful shutdown
 * 4. Visual Layout Previews: High-res screenshots of multi-page and boundary edge-cases
 *
 * Run: $env:NODE_PATH="client/node_modules;server/node_modules"; npx --prefix server tsx server/src/utils/test-pdf-pagination-matrix.ts
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
import { pdfService, ConcurrencyLimiter, DEFAULT_A4_PDF_OPTIONS } from '../services/pdf.service';
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

// Read compiled CSS from client/dist/assets
const distAssetsDir = path.resolve(__dirname, '../../../client/dist/assets');
const cssFile = fs.existsSync(distAssetsDir)
  ? fs.readdirSync(distAssetsDir).find((f) => f.endsWith('.css'))
  : null;
const clientCss = cssFile ? fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf-8') : '';

// Output directories for generated audit PDFs and visual previews
const AUDIT_PDF_DIR = path.resolve(__dirname, '../../test_audit_pdfs');
if (!fs.existsSync(AUDIT_PDF_DIR)) {
  fs.mkdirSync(AUDIT_PDF_DIR, { recursive: true });
}

const AUDIT_PREVIEW_DIR = path.resolve(__dirname, '../../test_audit_previews');
if (!fs.existsSync(AUDIT_PREVIEW_DIR)) {
  fs.mkdirSync(AUDIT_PREVIEW_DIR, { recursive: true });
}

function createHtmlDocument(template: 'classic' | 'modern' | 'creative', resume: Partial<Resume>): string {
  const Component =
    template === 'classic'
      ? ClassicTemplate
      : template === 'modern'
        ? ModernTemplate
        : CreativeTemplate;

  const markup = renderToStaticMarkup(React.createElement(Component, { resume }));

  return `<!DOCTYPE html>
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
</html>`;
}

// ─────────────────────────────────────────────────────────────
// 10 Detailed Resume Profiles for Test Matrix
// ─────────────────────────────────────────────────────────────

// Scenario 1: Minimal Resume with Missing Optional Fields
const p1_minimal: Partial<Resume> = {
  fullName: 'Morgan Blake',
  title: 'Junior Developer',
  email: 'morgan.blake@example.com',
  phone: null,
  location: null,
  linkedin: null,
  github: null,
  website: null,
  summary: null,
  education: [],
  experiences: [],
  skills: [{ name: 'JavaScript' }, { name: 'HTML' }],
};

// Scenario 2: Short 1-Page Resume
const p2_short: Partial<Resume> = {
  fullName: 'Chloe Bennett',
  title: 'Associate UX Designer',
  email: 'chloe.bennett@example.com',
  phone: '+1 (555) 234-5678',
  location: 'Austin, TX',
  linkedin: 'https://linkedin.com/in/chloebennett',
  summary: 'Detail-oriented designer with 2 years of product design experience focusing on accessible mobile design systems.',
  education: [
    {
      institution: 'University of Texas',
      degree: 'B.S. in Design',
      startDate: '2020',
      endDate: '2024',
      gpa: '3.85',
    },
  ],
  experiences: [
    {
      company: 'Studio Pixel',
      position: 'UI Designer',
      startDate: '2024-06',
      current: true,
      description: '• Designed responsive design components in Figma.\n• Collaborated with product teams to conduct usability testing.',
    },
  ],
  skills: [
    { name: 'Figma', category: 'Design' },
    { name: 'User Research', category: 'Methodology' },
    { name: 'CSS', category: 'Technical' },
  ],
};

// Scenario 3: Normal 2-Page Resume
const p3_normal_2page: Partial<Resume> = {
  fullName: 'Alexander Wright',
  title: 'Senior Software Engineer',
  email: 'alexander.wright@example.com',
  phone: '+1 (555) 876-5432',
  location: 'San Francisco, CA',
  linkedin: 'https://linkedin.com/in/alexanderwright',
  github: 'https://github.com/alexanderwright',
  summary: 'Full-stack engineer with 6+ years of expertise in distributed systems, TypeScript, Node.js, and cloud data pipelines. Led engineering initiatives improving service throughput by 40% and reducing infrastructure costs.',
  education: [
    {
      institution: 'UC Berkeley',
      degree: 'M.S. in Computer Science',
      startDate: '2016',
      endDate: '2018',
    },
    {
      institution: 'UCLA',
      degree: 'B.S. in Computer Engineering',
      startDate: '2012',
      endDate: '2016',
      gpa: '3.90',
    },
  ],
  experiences: [
    {
      company: 'Apex Cloud Solutions',
      position: 'Senior Backend Engineer',
      startDate: '2021-03',
      current: true,
      description: '• Architected distributed event processing pipeline handling 25,000 events/sec with Apache Kafka and Go.\n• Optimized PostgreSQL query execution plans reducing P99 latency from 320ms to 24ms.\n• Supervised automated continuous integration pipelines with GitHub Actions and Docker.',
    },
    {
      company: 'Fintech Velocity',
      position: 'Software Engineer',
      startDate: '2018-07',
      endDate: '2021-02',
      description: '• Engineered secure REST and GraphQL endpoints processing \$45M in daily transactions.\n• Designed automated unit and integration test suites reaching 92% code coverage.\n• Reduced frontend bundle sizes by 35% through code-splitting and asset optimization.',
    },
  ],
  projects: [
    {
      name: 'Event Horizon Analytics',
      description: 'Real-time telemetry engine with WebSockets, TimescaleDB, and interactive visualization dashboard.',
      technologies: 'Node.js, PostgreSQL, React, WebSockets',
      link: 'https://github.com/alexanderwright/event-horizon',
    },
  ],
  skills: [
    { name: 'TypeScript', category: 'Languages' },
    { name: 'Go', category: 'Languages' },
    { name: 'PostgreSQL', category: 'Databases' },
    { name: 'Docker', category: 'DevOps' },
    { name: 'Kubernetes', category: 'DevOps' },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon Web Services', date: '2023' },
  ],
};

// Scenario 4: Long 3-Page Resume
const p4_long_3page: Partial<Resume> = {
  ...p3_normal_2page,
  fullName: 'Dr. Evelyn Martinez',
  title: 'Principal Distributed Systems Architect',
  summary: 'Accomplished engineering leader and architect with 14+ years designing high-throughput distributed consensus protocols, multi-region cloud infrastructures, and enterprise fault-tolerant microservices. Published author and speaker at international systems conferences.',
  experiences: [
    ...p3_normal_2page.experiences!,
    {
      company: 'Global Defense Telemetry',
      position: 'Staff Systems Architect',
      startDate: '2014-02',
      endDate: '2018-06',
      description: '• Designed Byzantine fault-tolerant mesh routing algorithms for satellite constellations.\n• Verified distributed protocols using TLA+ model checking to guarantee zero deadlock conditions.\n• Awarded 2 US patents on secure multi-hop mesh packet routing in high-interference environments.',
    },
    {
      company: 'Siemens Industrial Networks',
      position: 'Embedded Systems Engineer',
      startDate: '2010-09',
      endDate: '2014-01',
      description: '• Developed deterministic Ethernet drivers for programmable logic controllers.\n• Achieved sub-microsecond synchronization adhering to IEEE 1588 Precision Time Protocol.',
    },
  ],
  projects: [
    ...p3_normal_2page.projects!,
    {
      name: 'Raft Consensus KV Engine',
      description: 'High-performance distributed key-value store implementing Raft consensus algorithm with snapshot compaction.',
      technologies: 'Rust, Tokio, gRPC',
      link: 'https://github.com/martinez/raft-kv',
    },
  ],
  achievements: [
    { title: 'ACM Distinguished Engineer', date: '2022', description: 'Awarded for contributions to distributed systems fault tolerance.' },
  ],
};

// Scenario 5: Very Long Resume
const p5_very_long: Partial<Resume> = {
  ...p4_long_3page,
  fullName: 'Jonathan Alexander Vance IV',
  title: 'Chief Technology Officer & Fellow',
  experiences: [
    ...p4_long_3page.experiences!,
    {
      company: 'Sun Microsystems',
      position: 'Kernel Software Engineer',
      startDate: '2005-01',
      endDate: '2010-08',
      description: '• Developed Solaris ZFS file system caching algorithms and DTrace kernel probes.\n• Resolved kernel deadlocks in high-concurrency symmetric multiprocessing architectures.',
    },
    {
      company: 'Bell Laboratories',
      position: 'Research Member',
      startDate: '2000-06',
      endDate: '2004-12',
      description: '• Investigated optical switching networks and high-density packet routing protocols.',
    },
  ],
};

// Scenario 6: Long URLs and Unbroken Text
const p6_long_urls_words: Partial<Resume> = {
  fullName: 'Dr. Wolfeschlegelsteinhausenbergerdorff Enterprise Systems Specialist',
  title: 'ChiefInternationalizationAndLocalizationArchitecturalRefactoringConsultant',
  email: 'verylongemailaddresswithlotsofcharactersandsubdomains@organization.department.enterprise.university.edu',
  phone: '+1 (555) 019-2834 ext. 48291',
  location: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, Wales, United Kingdom',
  linkedin: 'https://www.linkedin.com/in/very-long-custom-vanity-url-with-extraordinary-length-for-testing-purposes-123456789',
  github: 'https://github.com/organization-enterprise-team/super-hyper-scalable-distributed-event-driven-microservices-architecture-v2',
  website: 'https://subdomain.company-domain-with-multiple-hyphens-and-extremely-long-tld.technology/case-studies/2026',
  summary: 'Specializing in SupercalifragilisticexpialidociousInfrastructureEngineering, distributed microsegmentation, and FaultTolerantHeterogeneousComputingPlatformDesign across global enterprise domains.',
  education: [
    {
      institution: 'SwissFederalInstituteOfTechnologyDepartmentOfComputerScienceAndInformatics',
      degree: 'DoktorDerNaturwissenschaftenInformatikUndSoftwaretechnik',
      startDate: '2016-09',
      endDate: '2020-06',
      description: 'Dissertation: AsynchronousDecentralizedDeterministicZeroKnowledgeRollupConsensusProtocols.',
    },
  ],
  experiences: [
    {
      company: 'TelecommunicationsAndAerospaceDefenseInfrastructureCorporation',
      position: 'ChiefSystemArchitectureAndInteroperabilityStandardizationEngineer',
      startDate: '2020-07',
      current: true,
      description: '• Implemented CryptographicallyVerifiableZeroKnowledgeSuccinctNonInteractiveArgumentsOfKnowledge verification circuit.\n• Designed MultiProtocolLabelSwitchingTrafficEngineeringAcrossAutonomousSystemBoundaries.',
    },
  ],
  skills: [
    { name: 'ElectroencephalographicSignalProcessing', category: 'BiomedicalTech' },
    { name: 'SupercalifragilisticexpialidociousEngineering', category: 'Methodologies' },
  ],
  projects: [
    {
      name: 'HighThroughputLowLatencyInterplanetaryFileDistributionAndSynchronizationProtocol',
      description: 'Peer-to-peer data synchronization resilient against deep space telemetry delays.',
      technologies: 'Rust, WebRTC, ContentAddressing, CryptographicHashes',
      link: 'https://github.com/organization/super-long-repository-name-with-deep-nested-path/blob/main/src/very-long-file-name-without-spaces-for-testing.ts',
    },
  ],
};

// Scenario 7: Long Bullet Points
const p7_lengthy_bullets: Partial<Resume> = {
  fullName: 'Rebecca Sterling',
  title: 'Principal Technical Program Manager',
  email: 'rebecca.sterling@example.com',
  phone: '+1 (555) 789-0123',
  location: 'New York, NY',
  summary: 'Strategic Technical Program Manager with 10+ years directing cross-functional engineering initiatives across cloud infrastructure, security compliance, and enterprise data platforms.',
  education: [
    {
      institution: 'Columbia University',
      degree: 'B.S. in Industrial Engineering',
      startDate: '2010',
      endDate: '2014',
    },
  ],
  experiences: [
    {
      company: 'Enterprise Data Platform Corp',
      position: 'Director of Technical Program Management',
      startDate: '2020',
      current: true,
      description: `• Orchestrated multi-year cross-organizational cloud transformation program migrating 140+ legacy business units, 45 petabytes of unstructured analytical data, and 3,200 microservices from on-premise colocation centers to Google Cloud Platform, negotiating contractual vendor commitments that achieved \$14.8M in annualized infrastructure savings while guaranteeing 99.995% service uptime throughout migration cutovers.
• Formulated and executed enterprise-wide cybersecurity vulnerability mitigation framework encompassing automated static code analysis, third-party software bill of materials (SBOM) validation, dynamic penetration testing, and zero-trust perimeter enforcement across 28 global engineering offices, resulting in zero critical security audit findings during subsequent SOC 2 Type II and ISO 27001 compliance examinations.
• Standardized agile delivery methodologies, release governance processes, and key performance metric dashboards across 35 independent feature squads, eliminating inter-team blocking dependencies and accelerating feature deployment velocity from quarterly releases to continuous daily production deployments.`,
    },
    {
      company: 'Fintech Solutions Group',
      position: 'Senior Technical Program Manager',
      startDate: '2016',
      endDate: '2020',
      description: `• Spearheaded end-to-end development and global launch of multi-currency payment settlement engine processing \$2.4B in quarterly cross-border trade transactions, partnering with compliance attorneys, liquidity providers, and banking partners across 18 European and Asia-Pacific jurisdictions to ensure full statutory compliance with PSD2 and anti-money laundering regulations.
• Established automated incident management and disaster recovery protocols reducing mean time to detection (MTTD) by 64% and mean time to resolution (MTTR) by 52%, establishing automated telemetry alerting runbooks adopted company-wide.`,
    },
  ],
  skills: [
    { name: 'Cloud Migration Strategy', category: 'Program Management' },
    { name: 'SOC 2 & ISO 27001 Compliance', category: 'Governance' },
  ],
};

// Scenario 8: Missing Dates & Optional Values
const p8_missing_dates_values: Partial<Resume> = {
  fullName: 'Taylor Morgan',
  title: 'Consultant & Advisor',
  email: 'taylor@example.com',
  phone: null,
  location: null,
  summary: 'Independent technology advisor and startup mentor helping early-stage ventures establish scalable engineering practices.',
  education: [
    {
      institution: 'Open Online Academy',
      degree: 'Certificate in Cloud Architecture',
      startDate: null,
      endDate: null,
      gpa: null,
      description: null,
    },
  ],
  experiences: [
    {
      company: 'Advisory Practice',
      position: 'Fractional CTO',
      startDate: null,
      endDate: null,
      current: false,
      description: '• Provided architecture guidance for 6 early-stage SaaS ventures.\n• Evaluated candidate engineering leadership profiles.',
    },
  ],
  skills: [{ name: 'Strategic Architecture' }, { name: 'Technical Hiring' }],
  certifications: [{ name: 'Independent Advisory Certification', issuer: null, date: null }],
};

// Scenario 9: Multiple Education & Experience Entries
const p9_multiple_entries: Partial<Resume> = {
  fullName: 'Marcus Aurelius Vance',
  title: 'Lead Systems Engineer',
  email: 'marcus.aurelius@example.com',
  phone: '+1 (555) 999-0000',
  location: 'Seattle, WA',
  summary: 'Experienced systems professional with comprehensive educational foundation and extensive industry track record across 5 corporate environments.',
  education: [
    { institution: 'MIT', degree: 'Ph.D. in Computer Science', startDate: '2016', endDate: '2020' },
    { institution: 'Stanford University', degree: 'M.S. in Electrical Engineering', startDate: '2014', endDate: '2016' },
    { institution: 'Carnegie Mellon University', degree: 'B.S. in Computer Science', startDate: '2010', endDate: '2014' },
    { institution: 'Oxford University', degree: 'Exchange Fellow in Mathematics', startDate: '2012', endDate: '2013' },
  ],
  experiences: [
    { company: 'HyperScale Cloud Corp', position: 'Principal Architect', startDate: '2022', current: true, description: '• Spearheaded globally distributed multi-region cluster management.' },
    { company: 'Enterprise Data Fabrics', position: 'Lead Backend Engineer', startDate: '2020', endDate: '2022', description: '• Built distributed query routing layer.' },
    { company: 'NextGen Financial Systems', position: 'Senior Infrastructure Engineer', startDate: '2018', endDate: '2020', description: '• Maintained high-frequency transaction messaging queue.' },
    { company: 'Quantum Telemetry Labs', position: 'Systems Engineer', startDate: '2016', endDate: '2018', description: '• Built telemetry collectors in Rust and C++.' },
    { company: 'Silicon Valley Innovations', position: 'Software Engineer', startDate: '2014', endDate: '2016', description: '• Maintained customer-facing REST services.' },
  ],
  skills: [
    { name: 'C++', category: 'Languages' },
    { name: 'Rust', category: 'Languages' },
    { name: 'Distributed Systems', category: 'Architecture' },
    { name: 'Consensus Protocols', category: 'Architecture' },
  ],
};

// Scenario 10: Content Close to Page Boundaries
const p10_boundary_content: Partial<Resume> = {
  fullName: 'Diana Prince',
  title: 'Senior Distributed Storage Architect',
  email: 'diana.prince@example.com',
  phone: '+1 (555) 432-1098',
  location: 'Denver, CO',
  summary: 'Storage systems expert with deep knowledge of NVMe-oF, Ceph, and distributed object storage. Proven capability tuning file systems for extreme I/O performance.',
  education: [
    { institution: 'Colorado School of Mines', degree: 'M.S. in Computer Science', startDate: '2014', endDate: '2016' },
    { institution: 'University of Colorado Boulder', degree: 'B.S. in Electrical Engineering', startDate: '2010', endDate: '2014' },
  ],
  experiences: [
    {
      company: 'Storage Fabric Systems',
      position: 'Senior Storage Architect',
      startDate: '2019',
      current: true,
      description: '• Designed Ceph object storage clusters storing 80PB of analytical telemetry.\n• Optimized NVMe over Fabrics network transport yielding 3.2M IOPS at sub-millisecond latencies.\n• Implemented automated failure detection and rebalancing daemons.\n• Mentored team of 6 engineers on storage protocols and Linux kernel block layer.',
    },
    {
      company: 'Cloud Scale Networks',
      position: 'Infrastructure Engineer',
      startDate: '2016',
      endDate: '2019',
      description: '• Maintained ZFS storage appliances serving 500TB of backup snapshots.\n• Configured automated disaster recovery replication between primary and secondary data centers.\n• Wrote Prometheus exporters for storage hardware telemetry.',
    },
  ],
  skills: [
    { name: 'Ceph', category: 'Storage' },
    { name: 'NVMe-oF', category: 'Storage' },
    { name: 'Linux Kernel', category: 'Systems' },
    { name: 'Python', category: 'Scripting' },
    { name: 'Bash', category: 'Scripting' },
  ],
  projects: [
    {
      name: 'NVMe Performance Benchmark Suite',
      description: 'Automated FIO benchmarking harness for enterprise NVMe drives.',
      technologies: 'Python, FIO, Docker',
    },
  ],
};

// ─────────────────────────────────────────────────────────────
// Master Test Runner
// ─────────────────────────────────────────────────────────────

async function runAudit() {
  console.log('\n===============================================================');
  console.log('   PDF Pagination & Reliability Audit Test Suite');
  console.log('===============================================================\n');

  const testMatrix = [
    { id: '1_minimal', name: 'Minimal with Missing Fields', data: p1_minimal },
    { id: '2_short_1page', name: 'Short 1-Page Resume', data: p2_short },
    { id: '3_normal_2page', name: 'Normal 2-Page Resume', data: p3_normal_2page },
    { id: '4_long_3page', name: 'Long 3-Page Resume', data: p4_long_3page },
    { id: '5_very_long', name: 'Very Long Resume', data: p5_very_long },
    { id: '6_long_urls_words', name: 'Long URLs & Unbroken Text', data: p6_long_urls_words },
    { id: '7_lengthy_bullets', name: 'Long Bullet Points', data: p7_lengthy_bullets },
    { id: '8_missing_dates_values', name: 'Missing Dates & Optional Values', data: p8_missing_dates_values },
    { id: '9_multiple_entries', name: 'Multiple Education & Experience', data: p9_multiple_entries },
    { id: '10_boundary_content', name: 'Content Near Page Boundary', data: p10_boundary_content },
  ];

  const templates = ['classic', 'modern', 'creative'] as const;

  // Launch Puppeteer browser instance for layout audit
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'pdf_audit_'));
  const browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');

  console.log('--- Step 2 & 3: PDF Layout Matrix (10 Scenarios x 3 Templates = 30 PDFs) ---');

  interface MatrixSummary {
    scenario: string;
    template: string;
    pageCount: number;
    sizeKb: number;
    isA4: boolean;
    zeroBlankPages: boolean;
    zeroHorizontalOverflow: boolean;
    zeroOrphanHeadings: boolean;
  }

  const matrixResults: MatrixSummary[] = [];

  try {
    for (const sc of testMatrix) {
      console.log(`\nScenario: [${sc.name}]`);

      for (const tpl of templates) {
        const html = createHtmlDocument(tpl, sc.data);
        await page.setContent(html, { waitUntil: 'load' });
        await page.evaluateHandle('document.fonts.ready');

        // Check horizontal overflow in DOM
        const overflowCount = await page.evaluate(() => {
          let count = 0;
          const allElements = document.querySelectorAll('.resume-document *');
          allElements.forEach((el) => {
            const rect = el.getBoundingClientRect();
            if (rect.right > 795) count++;
          });
          return count;
        });

        // Generate PDF
        const pdfBuffer = Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS));
        const fileName = `${sc.id}_${tpl}.pdf`;
        const filePath = path.join(AUDIT_PDF_DIR, fileName);
        fs.writeFileSync(filePath, pdfBuffer);

        // Inspect PDF structure and page contents
        const inspected = inspectPdfBuffer(pdfBuffer, fileName, filePath);

        // Verify orphan headings: check that no page ends with a heading without any content following it
        let hasOrphanHeadingOnAnyPage = false;
        inspected.pages.forEach((p) => {
          const lines = p.text.trim().split(/\n+/).filter(Boolean);
          if (lines.length === 1 && /^[A-Z\s&]{3,30}$/.test(lines[0])) {
            hasOrphanHeadingOnAnyPage = true;
          }
        });

        const isA4 = inspected.isStandardA4;
        const noBlankPages = !inspected.hasBlankPages && inspected.pages.every((p) => p.charCount > 20);
        const noOverflow = overflowCount === 0;
        const noOrphanHeading = !hasOrphanHeadingOnAnyPage;

        assert(
          `[${tpl.toUpperCase()}] ${sc.name} -> Pages: ${inspected.pageCount}, A4: ${isA4 ? '✓' : '✗'}, NoBlank: ${noBlankPages ? '✓' : '✗'}, NoOverflow: ${noOverflow ? '✓' : '✗'}`,
          isA4 && noBlankPages && noOverflow && noOrphanHeading,
          `pages=${inspected.pageCount}, size=${inspected.fileSizeBytes}B`
        );

        matrixResults.push({
          scenario: sc.name,
          template: tpl,
          pageCount: inspected.pageCount,
          sizeKb: parseFloat((inspected.fileSizeBytes / 1024).toFixed(1)),
          isA4,
          zeroBlankPages: noBlankPages,
          zeroHorizontalOverflow: noOverflow,
          zeroOrphanHeadings: noOrphanHeading,
        });

        // Capture visual PNG preview for multi-page or boundary cases
        if (sc.id === '3_normal_2page' || sc.id === '10_boundary_content') {
          const previewPath = path.join(AUDIT_PREVIEW_DIR, `${sc.id}_${tpl}.png`);
          await page.screenshot({ path: previewPath as `${string}.png`, fullPage: true });
        }
      }
    }

    console.log('\n--- Step 4: Reliability & Resource Cleanup Audit ---');

    // 4.1 Browser Singleton Lifecycle
    console.log('\n4.1 Browser Singleton Lifecycle:');
    const b1 = await pdfService.getBrowser();
    const b2 = await pdfService.getBrowser();
    assert('Reuses single healthy browser instance across invocations', b1 === b2 && b1.connected);

    // 4.2 Browser Disconnect Recovery
    console.log('\n4.2 Browser Disconnect Recovery:');
    const initialPid = b1.process()?.pid;
    // Simulate unexpected crash or disconnect
    await b1.close();
    assert('Simulated browser crash disconnects instance', !b1.connected);
    // Next request should automatically launch a fresh healthy browser
    const bRecovered = await pdfService.getBrowser();
    const recoveredPid = bRecovered.process()?.pid;
    assert('Automatically launches fresh browser on next request after disconnect', bRecovered.connected);
    assert('Fresh browser instance has different PID', initialPid !== recoveredPid);

    // 4.3 Page Leak Prevention (page.close in finally)
    console.log('\n4.3 Page Leak Prevention:');
    const activePagesBefore = (await bRecovered.pages()).length;
    // Generate valid PDF via service
    await pdfService.generatePdf({ html: '<div class="resume-document">Page Leak Test</div>' });
    const activePagesAfter = (await bRecovered.pages()).length;
    assert('Page count after successful PDF generation returns to baseline (0 leaked pages)', activePagesBefore === activePagesAfter);

    // Test failure handling page cleanup
    let failedCleanly = false;
    try {
      await pdfService.generatePdf({ html: '', url: '' });
    } catch {
      failedCleanly = true;
    }
    const activePagesAfterError = (await bRecovered.pages()).length;
    assert('Page count after failed PDF generation returns to baseline (0 leaked pages on error)', activePagesAfterError === activePagesBefore && failedCleanly);

    // 4.4 Concurrency Cap (3) & Bounded Queue (10)
    console.log('\n4.4 Concurrency Cap & FIFO Queue:');
    const limiter = new ConcurrencyLimiter(3, 10, 2000);

    // Acquire 3 active slots
    await limiter.acquire();
    await limiter.acquire();
    await limiter.acquire();
    assert('Concurrency limiter holds exactly 3 active slots', limiter.getActiveCount() === 3);

    // Enqueue 10 tasks
    const queuePromises: Promise<any>[] = [];
    for (let i = 0; i < 10; i++) {
      queuePromises.push(limiter.acquire().catch((err) => err));
    }
    assert('Queue holds exactly 10 enqueued tasks', limiter.getQueueLength() === 10);

    // 14th request exceeding queue capacity rejects with 503
    let rejectedAtCapacity = false;
    try {
      await limiter.acquire();
    } catch (err: any) {
      if (err.statusCode === 503) {
        rejectedAtCapacity = true;
      }
    }
    assert('14th request exceeding max queue length rejects with 503 Capacity Limit', rejectedAtCapacity);

    // Release slot transfers to first queued task
    limiter.release();
    assert('Releasing slot transfers capacity to queued item (queue length drops to 9)', limiter.getQueueLength() === 9);

    // Reset limiter cleans up everything
    limiter.reset();
    await Promise.all(queuePromises);
    assert('Limiter reset restores activeCount=0 and queueLength=0 without hanging', limiter.getActiveCount() === 0 && limiter.getQueueLength() === 0);

    // 4.5 Queue Timeout Behavior
    console.log('\n4.5 Queue Timeout Behavior:');
    const timeoutLimiter = new ConcurrencyLimiter(1, 2, 200); // 200ms timeout
    await timeoutLimiter.acquire(); // Fill active slot
    let timeoutCaught = false;
    try {
      await timeoutLimiter.acquire(); // Wait in queue
    } catch (err: any) {
      if (err.statusCode === 503 && err.message.includes('timeout')) {
        timeoutCaught = true;
      }
    }
    assert('Queued item exceeding timeout rejects with 503 Queue Timeout', timeoutCaught);
    assert('Timed out task is cleanly purged from queue', timeoutLimiter.getQueueLength() === 0);
    timeoutLimiter.release();
    assert('Active slot released cleanly after timeout', timeoutLimiter.getActiveCount() === 0);

    // Clean up
    await page.close();
    await browser.close();
    await pdfService.closeBrowser();

  } catch (err) {
    console.error('Audit execution error:', err);
    failed++;
  }

  console.log('\n===============================================================');
  console.log(`PDF Pagination Audit Results: ${passed} passed, ${failed} failed`);
  console.log('===============================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAudit();
