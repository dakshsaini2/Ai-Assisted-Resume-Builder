/**
 * Visual Screenshot Capturer for QA Visual Inspection
 * Takes high-resolution PNG page previews of multi-page resumes and edge cases.
 *
 * Run: npx tsx src/utils/test-screenshot-preview.ts
 */

import fs from 'fs';
import path from 'path';
import os from 'os';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import puppeteer from 'puppeteer';

import { ClassicTemplate } from '../../../client/src/components/templates/ClassicTemplate';
import { ModernTemplate } from '../../../client/src/components/templates/ModernTemplate';
import { CreativeTemplate } from '../../../client/src/components/templates/CreativeTemplate';
import type { Resume } from '../../../client/src/types';

const PREVIEW_DIR = path.resolve(__dirname, '../../test_qa_previews');
if (!fs.existsSync(PREVIEW_DIR)) {
  fs.mkdirSync(PREVIEW_DIR, { recursive: true });
}

// Read compiled CSS
const distAssetsDir = path.resolve(__dirname, '../../../client/dist/assets');
const cssFile = fs.existsSync(distAssetsDir)
  ? fs.readdirSync(distAssetsDir).find((f) => f.endsWith('.css'))
  : null;
const clientCss = cssFile ? fs.readFileSync(path.join(distAssetsDir, cssFile), 'utf-8') : '';

async function capturePreviews() {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'puppeteer_prev_'));
  const browser = await puppeteer.launch({
    headless: true,
    pipe: true,
    userDataDir: tempDir,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
  });

  try {
    const page = await browser.newPage();
  await page.setViewport({ width: 794, height: 1123, deviceScaleFactor: 2 });
  await page.emulateMediaType('print');

  // Test profile: Normal 2-page resume
  const sampleData: Partial<Resume> = {
    fullName: 'David K. Sutherland',
    title: 'Principal Cloud Infrastructure Architect',
    email: 'david.sutherland@example.com',
    phone: '+1 (555) 765-4321',
    location: 'Boston, MA',
    linkedin: 'https://linkedin.com/in/davidsutherland',
    github: 'https://github.com/davidsutherland',
    summary: 'Seasoned systems architect with 12+ years of enterprise experience designing fault-tolerant multi-cloud infrastructure, automated GitOps pipelines, and microservices backends handling millions of transactions.',
    education: [
      {
        institution: 'Massachusetts Institute of Technology (MIT)',
        degree: 'M.S. in Electrical Engineering & Computer Science',
        startDate: '2012',
        endDate: '2014',
      },
      {
        institution: 'Georgia Institute of Technology',
        degree: 'B.S. in Computer Science',
        startDate: '2008',
        endDate: '2012',
        gpa: '3.94',
      },
    ],
    experiences: [
      {
        company: 'Stripe Platform Infrastructure',
        position: 'Principal Systems Architect',
        startDate: '2021',
        current: true,
        description: '• Directed engineering initiative migrating 350+ stateful microservices to Kubernetes across 4 global regions with zero downtime.\n• Optimized database replication topology reducing cross-datacenter sync lag from 180ms to under 12ms.\n• Formulated automated canary deployment strategy eliminating deployment-related outages.',
      },
      {
        company: 'Akamai Technologies',
        position: 'Staff Network Reliability Engineer',
        startDate: '2017',
        endDate: '2021',
        description: '• Managed Tier-1 edge delivery network optimizations handling 30 million HTTP/3 requests per second.\n• Authored custom BGP traffic steering controllers dynamically mitigating DDoS amplification attacks.\n• Mentored 12 platform engineers on Linux kernel TCP socket tuning and eBPF instrumentation.',
      },
      {
        company: 'Red Hat Enterprise Software',
        position: 'Senior Software Engineer – OpenShift Core',
        startDate: '2014',
        endDate: '2017',
        description: '• Implemented OpenShift container networking plugins using Open vSwitch and Linux network namespaces.\n• Diagnosed and patched upstream Kubernetes scheduler memory leaks under sustained 10k-pod churn.',
      },
    ],
    skills: [
      { name: 'Kubernetes', category: 'Cloud Infrastructure' },
      { name: 'Go', category: 'Languages' },
      { name: 'Rust', category: 'Languages' },
      { name: 'Terraform', category: 'Cloud Infrastructure' },
      { name: 'eBPF', category: 'Systems' },
      { name: 'PostgreSQL', category: 'Data Stores' },
    ],
    projects: [
      {
        name: 'Distributed eBPF Network Probe',
        description: 'Kernel-space telemetry agent streaming low-overhead socket connection metrics to Prometheus.',
        technologies: 'C, eBPF, Go, Prometheus',
        link: 'https://github.com/sutherland/ebpf-probe',
      },
      {
        name: 'Multi-Cluster Service Mesh Router',
        description: 'Dynamic Envoy proxy control plane synchronizing mTLS service discovery across discrete Kubernetes clusters.',
        technologies: 'Go, gRPC, Envoy, Istio',
        link: 'https://github.com/sutherland/mesh-router',
      },
    ],
    certifications: [
      { name: 'AWS Certified Solutions Architect – Professional', issuer: 'Amazon Web Services', date: '2023' },
      { name: 'Certified Kubernetes Security Specialist (CKS)', issuer: 'Cloud Native Computing Foundation', date: '2022' },
    ],
  };

  const templates = [
    { id: 'classic', Component: ClassicTemplate },
    { id: 'modern', Component: ModernTemplate },
    { id: 'creative', Component: CreativeTemplate },
  ];

  for (const { id, Component } of templates) {
    const markup = renderToStaticMarkup(React.createElement(Component, { resume: sampleData }));
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            ${clientCss}
            @page { size: A4 portrait; margin: 0; }
            body { margin: 0; padding: 0; background: #fff; }
          </style>
        </head>
        <body>
          <div id="resume-ready" data-status="ready">
            ${markup}
          </div>
        </body>
      </html>
    `;

    await page.setContent(html, { waitUntil: 'load' });
    await page.evaluateHandle('document.fonts.ready');

    const screenshotPath = path.join(PREVIEW_DIR, `preview_${id}.png`);
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`Saved full preview screenshot for ${id}: ${screenshotPath}`);
  }

  } finally {
    try {
      await browser.close();
    } catch {}
    try {
      fs.rmSync(tempDir, { recursive: true, force: true });
    } catch {}
  }
  console.log('Visual previews captured successfully.');
}

capturePreviews().catch(console.error);
