/**
 * Task 5.6: Comprehensive PDF QA Diagnostics & Layout Audit
 * Tests 8 distinct resume profiles across Classic, Modern, and Creative templates.
 * Analyzes layout, overflow, page breaks, orphan headings, text extraction,
 * and PDF structural validity.
 *
 * Run: npx tsx src/utils/test-qa-diagnostics.ts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import zlib from 'zlib';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import puppeteer, { Browser, Page } from 'puppeteer';

// Import templates
import { ClassicTemplate } from '../../../client/src/components/templates/ClassicTemplate';
import { ModernTemplate } from '../../../client/src/components/templates/ModernTemplate';
import { CreativeTemplate } from '../../../client/src/components/templates/CreativeTemplate';
import type { Resume } from '../../../client/src/types';
import { DEFAULT_A4_PDF_OPTIONS } from '../services/pdf.service';

// Output directory for generated test PDFs
const QA_OUTPUT_DIR = path.resolve(__dirname, '../../test_qa_output');
if (!fs.existsSync(QA_OUTPUT_DIR)) {
  fs.mkdirSync(QA_OUTPUT_DIR, { recursive: true });
}

// Read compiled Tailwind CSS dynamically from client/dist/assets
const distAssetsDir = path.resolve(__dirname, '../../../client/dist/assets');
const cssFile = fs.existsSync(distAssetsDir)
  ? fs.readdirSync(distAssetsDir).find((f) => f.endsWith('.css'))
  : null;
const clientCss = cssFile ? fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf-8') : '';

// ─────────────────────────────────────────────────────────────
// 8 Test Profiles
// ─────────────────────────────────────────────────────────────

// 1. Minimal Resume (Personal Info Only)
const profile1_minimal: Partial<Resume> = {
  fullName: 'Arthur Pendelton',
  title: 'Junior Software Engineer',
  email: 'arthur.p@example.com',
  phone: '+1 (555) 123-4567',
  location: 'Seattle, WA',
  linkedin: 'https://linkedin.com/in/arthur-pendelton',
  github: 'https://github.com/arthurpendelton',
};

// 2. Short 1-Page Resume
const profile2_short: Partial<Resume> = {
  fullName: 'Elena Rostova',
  title: 'Associate Product Designer',
  email: 'elena.rostova@example.com',
  phone: '+1 (555) 345-6789',
  location: 'Austin, TX',
  linkedin: 'https://linkedin.com/in/elenarostova',
  website: 'https://elenarostova.design',
  summary: 'User-focused product designer with 2+ years of experience crafting accessible, responsive mobile and web interfaces in fast-moving agile environments.',
  education: [
    {
      institution: 'University of Texas at Austin',
      degree: 'B.S.',
      field: 'Informatics & Design',
      startDate: '2020-08-01',
      endDate: '2024-05-15',
      gpa: '3.82',
    },
  ],
  experiences: [
    {
      company: 'Creative Cloud Studios',
      position: 'Junior UI/UX Designer',
      startDate: '2024-06-01',
      current: true,
      description: '• Designed high-fidelity prototypes in Figma for an enterprise analytics dashboard used by 12,000 daily active users.\n• Conducted 18 usability test sessions, synthesizing qualitative feedback into actionable user journey maps.\n• Partnered with frontend engineers to document design tokens and Tailwind utility patterns.',
    },
  ],
  skills: [
    { name: 'Figma', category: 'Design Tools' },
    { name: 'Design Systems', category: 'Design Tools' },
    { name: 'Wireframing', category: 'Methodologies' },
    { name: 'HTML/CSS', category: 'Frontend' },
  ],
  projects: [
    {
      name: 'Accessibility Audit Kit',
      description: 'Open-source WCAG 2.1 compliance checklist with automated contrast scoring plugins.',
      technologies: 'Figma Plugin API, TypeScript',
      link: 'https://github.com/elena/audit-kit',
    },
  ],
};

// 3. Normal 2-Page Resume
const profile3_normal_2page: Partial<Resume> = {
  fullName: 'Marcus Vance',
  title: 'Senior Full Stack Engineer',
  email: 'marcus.vance@example.com',
  phone: '+1 (555) 456-7890',
  location: 'Chicago, IL',
  linkedin: 'https://linkedin.com/in/marcusvance',
  github: 'https://github.com/marcusvance',
  summary: 'Versatile Full Stack Engineer with 7+ years of experience architecting high-concurrency microservices, real-time web applications, and scalable PostgreSQL database schemas. Proven track record leading distributed engineering teams from conception to global production launches.',
  education: [
    {
      institution: 'University of Illinois Urbana-Champaign',
      degree: 'M.S.',
      field: 'Computer Science',
      startDate: '2015-08-15',
      endDate: '2017-05-20',
      gpa: '3.91',
    },
    {
      institution: 'Purdue University',
      degree: 'B.S.',
      field: 'Computer Engineering',
      startDate: '2011-08-20',
      endDate: '2015-05-10',
      gpa: '3.78',
    },
  ],
  experiences: [
    {
      company: 'Apex Cloud Solutions',
      position: 'Staff Platform Engineer',
      startDate: '2021-03-01',
      current: true,
      description: '• Spearheaded architectural re-platforming of legacy monolithic order processing system into 14 distributed Go microservices handling 45,000 req/sec at peak.\n• Reduced P99 API latency from 420ms to 28ms by introducing Redis cluster caching layer and gRPC transport protocols.\n• Architected automated Kubernetes deployment manifests and Helm charts deployed across 3 AWS multi-region clusters.\n• Mentored 8 junior and mid-level engineers, running weekly architecture review sessions and code craftsmanship workshops.',
    },
    {
      company: 'Catalyst Financial Technologies',
      position: 'Senior Software Engineer',
      startDate: '2018-06-01',
      endDate: '2021-02-28',
      description: '• Built and maintained PCI-compliant credit card processing pipeline managing \$850M in annual transactional volume.\n• Implemented zero-downtime database schema migrations for PostgreSQL tables containing over 250 million records.\n• Developed end-to-end audit logging infrastructure using Apache Kafka and Elasticsearch for regulatory compliance.',
    },
    {
      company: 'Kinetic Web Labs',
      position: 'Full Stack Developer',
      startDate: '2017-06-01',
      endDate: '2018-05-31',
      description: '• Engineered customer-facing React SPA dashboard integrated with Express and Node.js REST API endpoints.\n• Optimized Webpack bundle sizes by 44% through code-splitting, tree-shaking, and lazy-loading of secondary routes.',
    },
  ],
  skills: [
    { name: 'TypeScript', category: 'Languages' },
    { name: 'Go', category: 'Languages' },
    { name: 'Python', category: 'Languages' },
    { name: 'SQL', category: 'Languages' },
    { name: 'React', category: 'Frontend' },
    { name: 'Next.js', category: 'Frontend' },
    { name: 'Tailwind CSS', category: 'Frontend' },
    { name: 'Node.js', category: 'Backend' },
    { name: 'PostgreSQL', category: 'Backend' },
    { name: 'Redis', category: 'Backend' },
    { name: 'Docker', category: 'DevOps & Cloud' },
    { name: 'Kubernetes', category: 'DevOps & Cloud' },
    { name: 'AWS', category: 'DevOps & Cloud' },
    { name: 'Terraform', category: 'DevOps & Cloud' },
  ],
  projects: [
    {
      name: 'Distributed Task Queue Engine',
      description: 'High-throughput async job worker system with Redis persistence, backpressure handling, and exponential backoff retry semantics.',
      technologies: 'Go, Redis, Docker, Prometheus',
      link: 'https://github.com/marcusvance/task-queue',
      startDate: '2023-01-01',
      endDate: '2023-08-30',
    },
    {
      name: 'Event Horizon Analytics',
      description: 'Real-time telemetry aggregation engine processing 100k events/sec with WebSockets and TimescaleDB analytics.',
      technologies: 'Node.js, PostgreSQL, WebSockets',
      link: 'https://github.com/marcusvance/event-horizon',
      startDate: '2022-03-01',
      endDate: '2022-11-15',
    },
  ],
  certifications: [
    { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2023' },
    { name: 'Certified Kubernetes Administrator (CKA)', issuer: 'Linux Foundation', date: '2022' },
  ],
};

// 4. Long 3-Page Resume
const profile4_long_3page: Partial<Resume> = {
  ...profile3_normal_2page,
  fullName: 'Dr. Katherine Hawthorne',
  title: 'Principal Software Architect & Fellow',
  summary: 'Distinguished Software Architect and Research Fellow with 15+ years of foundational contributions to distributed consensus protocols, high-availability cloud platforms, and large-scale enterprise system transformations. Frequent keynote speaker and author of 6 peer-reviewed papers on distributed systems reliability.',
  experiences: [
    ...profile3_normal_2page.experiences!,
    {
      company: 'Global Defense & Aerospace Systems',
      position: 'Principal Research Scientist',
      startDate: '2014-01-01',
      endDate: '2017-05-30',
      description: '• Directed research team investigating Byzantine fault-tolerant consensus mechanisms for satellite mesh networks.\n• Formally verified safety invariants of state machine replication algorithms using TLA+ and formal model checking.\n• Awarded 2 US patents on secure multi-hop routing protocols in high-interference electromagnetic environments.',
    },
    {
      company: 'Siemens Industrial Automation',
      position: 'Senior Systems Engineer',
      startDate: '2010-09-01',
      endDate: '2013-12-31',
      description: '• Designed real-time deterministic Ethernet drivers for programmable logic controllers (PLCs).\n• Achieved sub-microsecond clock synchronization accuracy adhering to IEEE 1588 Precision Time Protocol.',
    },
    {
      company: 'Bell Laboratories',
      position: 'Member of Technical Staff',
      startDate: '2008-06-01',
      endDate: '2010-08-31',
      description: '• Researched optical switching architectures for core telecommunications backbones.\n• Co-authored 4 technical whitepapers on dynamic wavelength allocation and network topology optimization.',
    },
  ],
  projects: [
    ...profile3_normal_2page.projects!,
    {
      name: 'Raft-KV Distributed Store',
      description: 'Production-ready distributed key-value store implementing Raft consensus with log compaction and dynamic membership changes.',
      technologies: 'Rust, Tokio, gRPC',
      link: 'https://github.com/hawthorne/raft-kv',
    },
    {
      name: 'TLA+ Model Repository',
      description: 'Curated collection of formal specifications for modern cloud distributed consensus and two-phase commit variants.',
      technologies: 'TLA+, PlusCal',
      link: 'https://github.com/hawthorne/formal-specs',
    },
  ],
  achievements: [
    { title: 'ACM Distinguished Engineer Award', date: '2023', description: 'Awarded for pioneering contributions to distributed system resilience' },
    { title: 'Best Technical Paper – IEEE CloudCom', date: '2020', description: 'Selected among 350 submissions for work on sub-millisecond failover protocols' },
  ],
};

// 5. Very Long Resume (Extensive History)
const profile5_very_long: Partial<Resume> = {
  ...profile4_long_3page,
  fullName: 'Jonathan Alexander Sterling III',
  title: 'Senior Vice President of Engineering',
  experiences: [
    ...profile4_long_3page.experiences!,
    {
      company: 'Oracle Corporation',
      position: 'Senior Member of Technical Staff',
      startDate: '2006-05-01',
      endDate: '2008-05-30',
      description: '• Optimized cost-based query optimizer for Oracle 11g database kernel.\n• Implemented bitmap index join pushdown algorithms resulting in 3.4x speedup on TPC-H benchmarks.',
    },
    {
      company: 'Sun Microsystems',
      position: 'Kernel Software Engineer',
      startDate: '2003-01-01',
      endDate: '2006-04-30',
      description: '• Contributed to Solaris ZFS file system metadata caching layers and DTrace profiling probes.\n• Diagnosed kernel race conditions using crash dump analysis and assembly disassembly.',
    },
  ],
  projects: [
    ...profile4_long_3page.projects!,
    {
      name: 'Compiler Optimization Suite',
      description: 'LLVM pass plugin performing loop invariant code motion and automatic vectorization for custom SIMD extensions.',
      technologies: 'C++, LLVM, Clang',
    },
    {
      name: 'Bare-Metal Hypervisor',
      description: 'Type-1 microkernel hypervisor supporting hardware-assisted virtualization for x86-64 processors.',
      technologies: 'C, Assembly, QEMU',
    },
  ],
};

// 6. Resume with Missing Optional Sections
const profile6_missing_optional: Partial<Resume> = {
  fullName: 'Devon Lee',
  title: 'Full Stack Engineer',
  email: 'devon@example.com',
  phone: null,
  location: null,
  summary: null,
  education: [
    {
      institution: 'State University',
      degree: 'B.S. in Computer Science',
      startDate: null,
      endDate: null,
      gpa: null,
      description: null,
    },
  ],
  experiences: [
    {
      company: 'Independent Contractor',
      position: 'Software Developer',
      startDate: '2023',
      endDate: null,
      current: true,
      description: '• Delivered 4 client web applications using React, Express, and SQLite.\n• Implemented automated CI/CD pipeline on GitHub Actions.',
    },
  ],
  skills: [],
  projects: [],
  certifications: [],
  achievements: [],
  languages: [],
};

// 7. Resume with Long URLs and Unusually Long Words
const profile7_long_urls_words: Partial<Resume> = {
  fullName: 'Dr. Wolfeschlegelsteinhausenbergerdorff Senior Enterprise Systems Architect',
  title: 'Lead InternationalizationAndLocalizationArchitecturalRefactoringSpecialist',
  email: 'verylongemailaddresswithlotsofcharactersandsubdomains@organization.department.enterprise.university.edu',
  phone: '+1 (555) 019-2834 ext. 48291',
  location: 'Llanfairpwllgwyngyllgogerychwyrndrobwllllantysiliogogogoch, Wales, United Kingdom',
  linkedin: 'https://www.linkedin.com/in/very-long-custom-vanity-url-with-extraordinary-length-for-testing-purposes',
  github: 'https://github.com/organization-enterprise-team/super-hyper-scalable-distributed-event-driven-microservices-architecture-v2',
  website: 'https://subdomain.company-domain-with-multiple-hyphens-and-extremely-long-tld.technology/portfolio/case-studies/2026',
  summary: 'Accomplished architect specializing in SupercalifragilisticexpialidociousInfrastructureEngineering, distributed microsegmentation, and FaultTolerantHeterogeneousComputingPlatformDesign across geopolitical jurisdictions.',
  education: [
    {
      institution: 'EidgenoessischeTechnischeHochschuleZuerichSwissFederalInstituteOfTechnology',
      degree: 'DoktorDerNaturwissenschaftenInformatikUndSoftwaretechnik',
      startDate: '2016-09-01',
      endDate: '2020-06-30',
      description: 'Dissertation: AsynchronousDecentralizedDeterministicZeroKnowledgeRollupConsensusProtocols.',
    },
  ],
  experiences: [
    {
      company: 'TelecommunicationsAndAerospaceDefenseInfrastructureCorporation',
      position: 'ChiefSystemArchitectureAndInteroperabilityStandardizationEngineer',
      startDate: '2020-07-01',
      current: true,
      description: '• Engineered CryptographicallyVerifiableZeroKnowledgeSuccinctNonInteractiveArgumentsOfKnowledge verification circuit.\n• Integrated MultiProtocolLabelSwitchingTrafficEngineeringAcrossAutonomousSystemBoundaries.\n• Resolved UnsynchronizedMultithreadedMemoryAllocationDeadlockScenarios in high-frequency trading cores.',
    },
  ],
  skills: [
    { name: 'ElectroencephalographicSignalProcessing', category: 'BiomedicalTechnologies' },
    { name: 'PhotolithographicSemiconductorManufacturing', category: 'HardwareEngineering' },
    { name: 'SupercalifragilisticexpialidociousEngineering', category: 'Methodologies' },
  ],
  projects: [
    {
      name: 'HighThroughputLowLatencyInterplanetaryFileDistributionAndSynchronizationProtocol',
      description: 'Engineered peer-to-peer data distribution framework resilient against planetary orbital disconnections.',
      technologies: 'Rust, WebRTC, ContentAddressing, CryptographicHashes',
      link: 'https://github.com/organization/super-long-repository-name-with-deep-nested-path/blob/main/src/very-long-file-name-without-spaces-for-testing.ts',
    },
  ],
};

// 8. Resume with Lengthy Bullet Points
const profile8_lengthy_bullets: Partial<Resume> = {
  fullName: 'Rebecca Sterling',
  title: 'Principal Technical Program Manager',
  email: 'rebecca.sterling@example.com',
  phone: '+1 (555) 789-0123',
  location: 'New York, NY',
  summary: 'Strategic Technical Program Manager with 10+ years directing cross-functional engineering initiatives across cloud infrastructure, security compliance, and customer-facing mobile platforms.',
  education: [
    {
      institution: 'Columbia University',
      degree: 'B.S.',
      field: 'Industrial Engineering and Operations Research',
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
    { name: 'Cross-Functional Leadership', category: 'Executive Skills' },
  ],
};

// ─────────────────────────────────────────────────────────────
// HTML Page Generator
// ─────────────────────────────────────────────────────────────

function createHtmlDocument(templateName: string, resumeData: Partial<Resume>): string {
  let templateElement: React.ReactElement;
  if (templateName === 'classic') {
    templateElement = React.createElement(ClassicTemplate, { resume: resumeData });
  } else if (templateName === 'modern') {
    templateElement = React.createElement(ModernTemplate, { resume: resumeData });
  } else {
    templateElement = React.createElement(CreativeTemplate, { resume: resumeData });
  }

  const renderedMarkup = renderToStaticMarkup(templateElement);

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <style>
          ${clientCss}
          @page {
            size: A4 portrait;
            margin: 0;
          }
          body {
            margin: 0;
            padding: 0;
            background-color: #ffffff;
            font-family: system-ui, -apple-system, sans-serif;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
        </style>
      </head>
      <body>
        <div id="resume-ready" data-status="ready">
          ${renderedMarkup}
        </div>
      </body>
    </html>
  `;
}

// ─────────────────────────────────────────────────────────────
// PDF Binary Inspector
// ─────────────────────────────────────────────────────────────

interface PdfStructureInfo {
  pageCount: number;
  mediaBoxes: string[];
  isA4Dimensions: boolean;
  hasMagicHeader: boolean;
  hasEofTrailer: boolean;
  extractedKeywords: string[];
  fileSizeKb: number;
}

function inspectPdfBuffer(buffer: Buffer, expectedKeywords: string[]): PdfStructureInfo {
  const header = buffer.subarray(0, 8).toString('utf-8');
  const trailer = buffer.subarray(buffer.length - 64).toString('utf-8');

  const hasMagicHeader = header.startsWith('%PDF-');
  const hasEofTrailer = trailer.includes('%%EOF');

  const pdfText = buffer.toString('binary');

  // Count /Type /Page (excluding /Pages)
  const pageMatches = pdfText.match(/\/Type\s*\/Page\b/g);
  const countMatch = pdfText.match(/\/Count\s+(\d+)/);
  const pageCount = pageMatches ? pageMatches.length : countMatch ? parseInt(countMatch[1], 10) : 1;

  // Extract MediaBox dimensions
  // Standard A4 is [0 0 595.28 841.89] (or approx 595 x 842 pt)
  const mediaBoxMatches = pdfText.match(/\/MediaBox\s*\[\s*([\d\.\s]+)\s*\]/g) || [];
  let isA4Dimensions = true;
  if (mediaBoxMatches.length > 0) {
    for (const mb of mediaBoxMatches) {
      const nums = mb.replace(/[\/\[\]a-zA-Z]/g, '').trim().split(/\s+/).map(Number);
      if (nums.length >= 4) {
        const width = nums[2];
        const height = nums[3];
        // 595.28 pt x 841.89 pt (tolerance ± 2pt)
        if (Math.abs(width - 595.28) > 2 || Math.abs(height - 841.89) > 2) {
          isA4Dimensions = false;
        }
      }
    }
  }

  // Decompress streams to extract raw text
  let fullDecompressedText = '';
  const streamRegex = /stream\r?\n([\s\S]*?)\r?\nendstream/g;
  let match;
  while ((match = streamRegex.exec(pdfText)) !== null) {
    const rawStream = Buffer.from(match[1], 'binary');
    try {
      const decompressed = zlib.inflateSync(rawStream);
      fullDecompressedText += decompressed.toString('utf-8') + ' ';
    } catch {
      // Stream is uncompressed or encrypted, append raw
      fullDecompressedText += rawStream.toString('binary') + ' ';
    }
  }

  // Check expected keywords
  const extractedKeywords: string[] = [];
  for (const kw of expectedKeywords) {
    if (fullDecompressedText.includes(kw) || pdfText.includes(kw)) {
      extractedKeywords.push(kw);
    }
  }

  return {
    pageCount,
    mediaBoxes: mediaBoxMatches,
    isA4Dimensions,
    hasMagicHeader,
    hasEofTrailer,
    extractedKeywords,
    fileSizeKb: parseFloat((buffer.length / 1024).toFixed(1)),
  };
}

// ─────────────────────────────────────────────────────────────
// Diagnostic Runner
// ─────────────────────────────────────────────────────────────

async function runDiagnostics() {
  console.log('\n======================================================');
  console.log('   Task 5.6: Comprehensive PDF Quality Assurance');
  console.log('======================================================\n');

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_diag_'));
  const browser: Browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  const page: Page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');

  const testMatrix = [
    { id: '1_minimal', name: 'Minimal Profile', data: profile1_minimal, expectedPages: 1 },
    { id: '2_short_1page', name: 'Short 1-Page Profile', data: profile2_short, expectedPages: 1 },
    { id: '3_normal_2page', name: 'Normal 2-Page Profile', data: profile3_normal_2page, expectedPages: 2 },
    { id: '4_long_3page', name: 'Long 3-Page Profile', data: profile4_long_3page, expectedPages: 3 },
    { id: '5_very_long', name: 'Very Long Profile', data: profile5_very_long, expectedPages: null },
    { id: '6_missing_optional', name: 'Missing Optional Sections', data: profile6_missing_optional, expectedPages: 1 },
    { id: '7_long_urls_words', name: 'Long URLs & Unusually Long Words', data: profile7_long_urls_words, expectedPages: null },
    { id: '8_lengthy_bullets', name: 'Lengthy Paragraph Bullets', data: profile8_lengthy_bullets, expectedPages: null },
  ];

  const templates = ['classic', 'modern', 'creative'] as const;

  interface DiagnosticResult {
    scenario: string;
    template: string;
    pageCount: number;
    fileSizeKb: number;
    isA4: boolean;
    hasOverflow: boolean;
    overflowElements: string[];
    orphanHeadings: string[];
    keywordsFound: number;
    keywordsExpected: number;
    savedFile: string;
  }

  const results: DiagnosticResult[] = [];

  try {
    for (const testCase of testMatrix) {
    console.log(`\n--- Scenario: ${testCase.name} ---`);

    for (const template of templates) {
      const html = createHtmlDocument(template, testCase.data);
      await page.setContent(html, { waitUntil: 'load' });
      await page.evaluateHandle('document.fonts.ready');

      // 1. Audit DOM Layout Metrics
      const layoutAudit = await page.evaluate(() => {
        const overflows: string[] = [];
        const orphanHeadings: string[] = [];

        // Check horizontal overflow (width > 794px)
        const allElements = document.querySelectorAll('.resume-document *');
        allElements.forEach((el) => {
          const rect = el.getBoundingClientRect();
          if (rect.right > 795) {
            overflows.push(`${el.tagName.toLowerCase()}.${el.className} (right: ${Math.round(rect.right)}px)`);
          }
        });

        // Check orphan section headings (headings placed dangerously close to A4 page break)
        // A4 height is ~1123px at 96 DPI
        const pageHeight = 1123;
        const headings = document.querySelectorAll('h1, h2, h3');
        headings.forEach((h) => {
          const rect = h.getBoundingClientRect();
          const topOnPage = rect.top % pageHeight;
          const bottomOnPage = rect.bottom % pageHeight;

          // If heading is in the bottom 50px of an A4 page (topOnPage > 1070), it risks being an orphan
          if (topOnPage > 1070 && bottomOnPage < pageHeight) {
            orphanHeadings.push(`${h.tagName}: "${h.textContent?.trim().slice(0, 30)}" (top on page: ${Math.round(topOnPage)}px)`);
          }
        });

        return { overflows: overflows.slice(0, 3), orphanHeadings };
      });

      // 2. Generate PDF
      const pdfBuffer = Buffer.from(await page.pdf(DEFAULT_A4_PDF_OPTIONS));

      // 3. Inspect PDF Structure
      const expectedKeywords = [
        testCase.data.fullName?.split(' ')[0] || '',
        testCase.data.title?.split(' ')[0] || '',
      ].filter(Boolean);

      const pdfInfo = inspectPdfBuffer(pdfBuffer, expectedKeywords);

      // Save PDF to output directory
      const fileName = `${testCase.id}_${template}.pdf`;
      const filePath = path.join(QA_OUTPUT_DIR, fileName);
      fs.writeFileSync(filePath, pdfBuffer);

      results.push({
        scenario: testCase.name,
        template,
        pageCount: pdfInfo.pageCount,
        fileSizeKb: pdfInfo.fileSizeKb,
        isA4: pdfInfo.isA4Dimensions,
        hasOverflow: layoutAudit.overflows.length > 0,
        overflowElements: layoutAudit.overflows,
        orphanHeadings: layoutAudit.orphanHeadings,
        keywordsFound: pdfInfo.extractedKeywords.length,
        keywordsExpected: expectedKeywords.length,
        savedFile: fileName,
      });

      const overflowTag = layoutAudit.overflows.length > 0 ? ' [OVERFLOW!]' : '';
      const orphanTag = layoutAudit.orphanHeadings.length > 0 ? ' [ORPHAN HEADING!]' : '';
      console.log(
        `  [${template.toUpperCase()}] Pages: ${pdfInfo.pageCount} | Size: ${pdfInfo.fileSizeKb} KB | A4: ${pdfInfo.isA4Dimensions ? '✓' : '✗'}${overflowTag}${orphanTag}`
      );
      if (layoutAudit.overflows.length > 0) {
        console.log(`    ↳ Overflow details: ${layoutAudit.overflows.join(', ')}`);
      }
      if (layoutAudit.orphanHeadings.length > 0) {
        console.log(`    ↳ Orphan heading details: ${layoutAudit.orphanHeadings.join(', ')}`);
      }
    }
  }
  } finally {
    try {
      await browser.close();
    } catch {}
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }

  // Print Summary Table
  console.log('\n======================================================');
  console.log('   QA Diagnostic Summary Table');
  console.log('======================================================');
  console.table(
    results.map((r) => ({
      Scenario: r.scenario,
      Template: r.template,
      Pages: r.pageCount,
      'Size (KB)': r.fileSizeKb,
      A4: r.isA4 ? 'YES' : 'NO',
      Overflow: r.hasOverflow ? 'FAIL' : 'PASS',
      Orphans: r.orphanHeadings.length,
      Saved: r.savedFile,
    }))
  );

  return results;
}

runDiagnostics().catch((err) => {
  console.error('Fatal error during QA diagnostics:', err);
  process.exit(1);
});
