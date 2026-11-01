/**
 * Automated test suite for Resume Templates
 * Tests all 3 templates against 7 distinct data scenarios:
 * 1. Minimal resume (only name & title)
 * 2. Typical student resume
 * 3. Resume with many projects
 * 4. Resume with long multiline bullet descriptions
 * 5. Resume with missing optional fields & dates
 * 6. Resume with lengthy skill lists across multiple categories
 * 7. Extensive resume spanning multiple pages
 */

import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { ClassicTemplate, ModernTemplate, CreativeTemplate } from '../components/templates';
import type { Resume } from '../types';
import { formatDateRange, parseBulletPoints, formatUrlForDisplay } from './formatters';

let passed = 0;
let failed = 0;

function assert(name: string, condition: boolean) {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

// 1. Minimal Resume
const minimalResume: Partial<Resume> = {
  fullName: 'John Doe',
  title: 'Junior Developer',
};

// 2. Typical Student Resume
const studentResume: Partial<Resume> = {
  fullName: 'Maya Lin',
  email: 'maya.lin@university.edu',
  phone: '+1 (555) 234-5678',
  location: 'Boston, MA',
  github: 'https://github.com/mayalin',
  linkedin: 'https://linkedin.com/in/mayalin',
  summary: 'Motivated Computer Science senior seeking software engineering internship.',
  education: [
    {
      institution: 'Northeastern University',
      degree: 'B.S. in Computer Science',
      startDate: 'Sep 2021',
      endDate: 'May 2025',
      gpa: '3.85',
      description: 'Relevant coursework: Algorithms, Distributed Systems, Database Design.',
    },
  ],
  experiences: [
    {
      company: 'Tech Startup Lab',
      position: 'Undergraduate Research Assistant',
      startDate: 'Jan 2024',
      current: true,
      description: '• Implemented automated benchmarks evaluating neural network inference latency.\n• Co-authored paper on distributed computing.',
    },
  ],
  skills: [
    { name: 'Python', category: 'Languages' },
    { name: 'JavaScript', category: 'Languages' },
    { name: 'React', category: 'Frontend' },
    { name: 'Git', category: 'Tools' },
  ],
  projects: [
    {
      name: 'Campus Ride Share',
      description: '• Developed mobile-friendly web app using React and Supabase.\n• Supported 500+ active student carpool requests.',
      technologies: 'React, Node.js, PostgreSQL',
      link: 'https://github.com/mayalin/campus-ride',
    },
  ],
};

// 3. Resume with Many Projects
const manyProjectsResume: Partial<Resume> = {
  ...studentResume,
  projects: Array.from({ length: 6 }).map((_, i) => ({
    name: `Project Alpha ${i + 1}`,
    description: `• Engineered component ${i + 1} with high throughput.\n• Integrated third-party APIs with caching.`,
    technologies: 'TypeScript, Tailwind, Docker',
    link: `https://github.com/test/proj-${i + 1}`,
    startDate: '2023',
    endDate: '2024',
  })),
};

// 4. Resume with Long Descriptions
const longDescriptionsResume: Partial<Resume> = {
  ...studentResume,
  experiences: [
    {
      company: 'Enterprise Corp',
      position: 'Lead Architect',
      startDate: '2019',
      endDate: '2024',
      description: `• Spearheaded migration from monolithic Ruby on Rails backend to event-driven Go microservices architecture, reducing cloud infrastructure spend by \$420,000 annually.
• Designed and executed disaster recovery strategies achieving RPO < 5 minutes and RTO < 15 minutes across multi-region AWS infrastructure.
• Mentored 14 junior and mid-level software engineers across 3 squads, promoting code quality standards and automated linting.
• Authored comprehensive architectural decision records (ADRs) guiding team through zero-downtime database schema migrations.`,
    },
  ],
};

// 5. Resume with Missing Optional Fields
const missingFieldsResume: Partial<Resume> = {
  fullName: 'Anonymous User',
  email: null,
  phone: null,
  location: null,
  summary: null,
  education: [
    {
      institution: 'Online University',
      degree: 'Degree',
      startDate: null,
      endDate: null,
      gpa: null,
      description: null,
    },
  ],
  experiences: [
    {
      company: 'Freelance',
      position: 'Contractor',
      startDate: '2022',
      endDate: null,
      current: false,
      location: null,
      description: null,
    },
  ],
};

// 6. Resume with Lengthy Skill Lists
const lengthySkillsResume: Partial<Resume> = {
  ...studentResume,
  skills: [
    'TypeScript', 'JavaScript', 'Python', 'Go', 'Rust', 'C++', 'Java', 'SQL',
    'React', 'Next.js', 'Vue.js', 'Tailwind CSS', 'Redux', 'Zustand', 'GraphQL',
    'Node.js', 'Express', 'FastAPI', 'NestJS', 'PostgreSQL', 'Redis', 'MongoDB',
    'Docker', 'Kubernetes', 'AWS', 'GCP', 'Terraform', 'CI/CD GitHub Actions',
    'Jest', 'Vitest', 'Cypress', 'Playwright', 'Git', 'Linux', 'Agile/Scrum'
  ].map((name, i) => ({
    name,
    category: i < 8 ? 'Languages' : i < 15 ? 'Frontend' : i < 22 ? 'Backend' : 'DevOps & Tools',
  })),
};

// 7. Multi-page Full Resume
const multiPageResume: Partial<Resume> = {
  ...studentResume,
  experiences: [
    {
      company: 'Tech Giants Inc',
      position: 'Staff Engineer',
      startDate: '2021',
      endDate: 'Present',
      current: true,
      description: '• Architected global data streaming platform.\n• Maintained 99.999% reliability across 10 global regions.',
    },
    {
      company: 'Midsize Software',
      position: 'Senior Engineer',
      startDate: '2018',
      endDate: '2021',
      description: '• Led backend platform team of 8 engineers.\n• Migrated database from MySQL to PostgreSQL.',
    },
    {
      company: 'Early Startup',
      position: 'Software Developer',
      startDate: '2016',
      endDate: '2018',
      description: '• Full-stack development using React and Express.\n• Designed initial database schema and REST APIs.',
    },
  ],
  projects: manyProjectsResume.projects,
  certifications: [
    { name: 'AWS Certified Solutions Architect', issuer: 'Amazon', date: '2023' },
    { name: 'Certified Kubernetes Administrator', issuer: 'CNCF', date: '2022' },
  ],
  achievements: [
    { title: 'Best Innovation Award 2023', description: 'Selected #1 out of 40 internal R&D projects' },
  ],
  languages: [
    { name: 'English', proficiency: 'Native' },
    { name: 'Spanish', proficiency: 'Professional' },
    { name: 'German', proficiency: 'Basic' },
  ],
};

function testFormatters() {
  console.log('\n--- Testing Helper Formatters ---');

  // Date Range
  assert('formatDateRange: both dates', formatDateRange('2020', '2024') === '2020 – 2024');
  assert('formatDateRange: current', formatDateRange('2020', '', true) === '2020 – Present');
  assert('formatDateRange: only start', formatDateRange('2020', '') === '2020');
  assert('formatDateRange: only end', formatDateRange('', '2024') === '2024');
  assert('formatDateRange: empty', formatDateRange('', '') === '');

  // Bullet parser
  const sampleBullets = '• First bullet\n- Second bullet\nThird plain line';
  const parsed = parseBulletPoints(sampleBullets);
  assert('parseBulletPoints: count', parsed.length === 3);
  assert('parseBulletPoints: strips symbols', parsed[0] === 'First bullet' && parsed[1] === 'Second bullet');

  // URL formatter
  assert('formatUrlForDisplay: https and www', formatUrlForDisplay('https://www.github.com/user/') === 'github.com/user');
}

function testTemplates() {
  console.log('\n--- Testing Templates Rendering ---');

  const templates = [
    { name: 'ClassicTemplate', Component: ClassicTemplate },
    { name: 'ModernTemplate', Component: ModernTemplate },
    { name: 'CreativeTemplate', Component: CreativeTemplate },
  ];

  const testPayloads = [
    { label: '1. Minimal Resume', data: minimalResume },
    { label: '2. Typical Student Resume', data: studentResume },
    { label: '3. Many Projects Resume', data: manyProjectsResume },
    { label: '4. Long Descriptions Resume', data: longDescriptionsResume },
    { label: '5. Missing Fields Resume', data: missingFieldsResume },
    { label: '6. Lengthy Skills Resume', data: lengthySkillsResume },
    { label: '7. Multi-page Extensive Resume', data: multiPageResume },
  ];

  for (const { name, Component } of templates) {
    console.log(`\nTesting ${name}:`);
    for (const { label, data } of testPayloads) {
      try {
        const html = renderToStaticMarkup(React.createElement(Component, { resume: data }));
        assert(`${name} renders [${label}] without errors`, html.length > 0 && html.includes(data.fullName!));
      } catch (err) {
        console.error(`Error rendering ${name} with ${label}:`, err);
        assert(`${name} renders [${label}] without errors`, false);
      }
    }
  }

  console.log(`\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
  console.log(`  Template Test Results: ${passed} passed, ${failed} failed`);
  console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

  if (failed > 0) {
    throw new Error(`Template verification failed with ${failed} failing tests`);
  }
}

testFormatters();
testTemplates();
