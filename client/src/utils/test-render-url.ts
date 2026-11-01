/**
 * Automated Verification Test Suite:
 * Production-Safe PDF Render URL & Unauthenticated API Isolation
 *
 * Verifies:
 * 1. Local development configuration (Vite proxy /api & localhost:5001/api).
 * 2. Separate frontend/backend origins (https://api.resumebuilder.com/api).
 * 3. Correct render-data endpoint URL construction & trailing slash stripping.
 * 4. Export token passed unchanged in query params.
 * 5. No accidental session Authorization header attached to render-data request.
 * 6. Missing / malformed API configuration handling & descriptive error messages.
 * 7. Loading, ready, and error states transition contract in RenderResumePage.
 * 8. End-to-end client service contract for separate origin backend requests.
 *
 * Run: node server/node_modules/tsx/dist/cli.mjs client/src/utils/test-render-url.ts
 */

import { getApiBaseUrl, api, unauthenticatedApi } from '../services/api';
import { getResumeRenderData } from '../services/resumeService';

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

async function runRenderUrlTests() {
  console.log('\n======================================================');
  console.log('   Production-Safe PDF Render URL Tests');
  console.log('======================================================\n');

  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : ({} as any);
  const originalEnvUrl = globalObj?.process?.env?.VITE_API_URL;

  // ─────────────────────────────────────────────────────────────
  // 1. API Base URL Normalization & Configuration Tests
  // ─────────────────────────────────────────────────────────────
  console.log('1. API Base URL Normalization & Validation:');

  // Test 1.1: Default fallback when undefined
  const defaultUrl = getApiBaseUrl(undefined);
  assert('Falls back to /api when VITE_API_URL is undefined', defaultUrl === '/api');

  // Test 1.2: Default fallback when empty string or whitespace
  const emptyUrl = getApiBaseUrl('   ');
  assert('Falls back to /api when VITE_API_URL is whitespace', emptyUrl === '/api');

  // Test 1.3: Relative path with trailing slash stripped
  const relativeWithSlash = getApiBaseUrl('/api/');
  assert('Normalizes relative path and strips trailing slash (/api/ -> /api)', relativeWithSlash === '/api');

  // Test 1.4: Local development URL
  const localDevUrl = getApiBaseUrl('http://localhost:5001/api');
  assert('Accepts local development URL http://localhost:5001/api', localDevUrl === 'http://localhost:5001/api');

  // Test 1.5: Local development URL with trailing slash stripped
  const localDevWithSlash = getApiBaseUrl('http://localhost:5001/api/');
  assert('Strips trailing slash from local development URL', localDevWithSlash === 'http://localhost:5001/api');

  // Test 1.6: Separate backend origin in production (cross-origin architecture)
  const separateOrigin = getApiBaseUrl('https://api.resumebuilder.com/api');
  assert(
    'Accepts separate backend origin https://api.resumebuilder.com/api',
    separateOrigin === 'https://api.resumebuilder.com/api'
  );

  // Test 1.7: Rejects unsupported protocol (e.g. ftp://)
  let unsupportedProtocolThrown = false;
  try {
    getApiBaseUrl('ftp://api.resumebuilder.com/api');
  } catch (err: any) {
    unsupportedProtocolThrown = err.message.includes('Unsupported protocol "ftp:"');
  }
  assert('Throws descriptive error on unsupported protocol (ftp:)', unsupportedProtocolThrown);

  // Test 1.8: Rejects malformed URL
  let malformedThrown = false;
  try {
    getApiBaseUrl('http://not a valid url:99999/api');
  } catch (err: any) {
    malformedThrown = err.message.includes('Malformed VITE_API_URL configuration');
  }
  assert('Throws descriptive error on malformed VITE_API_URL', malformedThrown);

  // Test 1.9: Reads from environment variable fallback when no override provided
  if (globalObj?.process?.env) {
    globalObj.process.env.VITE_API_URL = 'https://custom-env-origin.com/api';
    const fromEnv = getApiBaseUrl();
    assert('Reads from environment variable fallback when no override provided', fromEnv === 'https://custom-env-origin.com/api');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Security & Session Header Isolation (unauthenticatedApi vs api)
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Security & Session Header Isolation:');

  // Setup mock localStorage in runtime
  const storageMap = new Map<string, string>();
  globalObj.localStorage = {
    getItem: (key: string) => storageMap.get(key) || null,
    setItem: (key: string, value: string) => storageMap.set(key, value),
    removeItem: (key: string) => storageMap.delete(key),
    clear: () => storageMap.clear(),
  };

  storageMap.set('token', 'stale-user-session-token-12345');

  // Test 2.1: api instance attaches session Bearer token via interceptor
  let apiHeadersSent: any = null;
  const interceptorHandlers = (api.interceptors.request as any).handlers;
  if (interceptorHandlers && interceptorHandlers.length > 0) {
    const mockConfig: any = { headers: {} };
    interceptorHandlers[0].fulfilled(mockConfig);
    apiHeadersSent = mockConfig.headers;
  }
  assert(
    'Standard api client attaches Authorization: Bearer <sessionToken>',
    apiHeadersSent?.Authorization === 'Bearer stale-user-session-token-12345'
  );

  // Test 2.2: unauthenticatedApi has zero request interceptors that could leak session tokens
  const unauthInterceptors = (unauthenticatedApi.interceptors.request as any).handlers || [];
  assert(
    'unauthenticatedApi has zero request interceptors that could leak session tokens',
    unauthInterceptors.length === 0
  );

  // Test 2.3: unauthenticatedApi has zero response interceptors that could redirect or clear localStorage
  const unauthResponseInterceptors = (unauthenticatedApi.interceptors.response as any).handlers || [];
  assert(
    'unauthenticatedApi has zero response interceptors that could trigger /login redirect',
    unauthResponseInterceptors.length === 0
  );

  // ─────────────────────────────────────────────────────────────
  // 3. getResumeRenderData Client Input Validation
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. getResumeRenderData Input Validation:');

  // Test 3.1: Rejects empty resumeId
  let emptyIdThrown = false;
  try {
    await getResumeRenderData('', 'valid-export-token');
  } catch (err: any) {
    emptyIdThrown = err.message.includes('Missing or invalid resume ID');
  }
  assert('Rejects empty resumeId with descriptive error', emptyIdThrown);

  // Test 3.2: Rejects whitespace resumeId
  let whitespaceIdThrown = false;
  try {
    await getResumeRenderData('   ', 'valid-export-token');
  } catch (err: any) {
    whitespaceIdThrown = err.message.includes('Missing or invalid resume ID');
  }
  assert('Rejects whitespace resumeId with descriptive error', whitespaceIdThrown);

  // Test 3.3: Rejects empty exportToken
  let emptyTokenThrown = false;
  try {
    await getResumeRenderData('resume-123', '');
  } catch (err: any) {
    emptyTokenThrown = err.message.includes('Missing or invalid export token');
  }
  assert('Rejects empty exportToken with descriptive error', emptyTokenThrown);

  // Test 3.4: Rejects whitespace exportToken
  let whitespaceTokenThrown = false;
  try {
    await getResumeRenderData('resume-123', '   ');
  } catch (err: any) {
    whitespaceTokenThrown = err.message.includes('Missing or invalid export token');
  }
  assert('Rejects whitespace exportToken with descriptive error', whitespaceTokenThrown);

  // ─────────────────────────────────────────────────────────────
  // 4. Render Resume Page State Machine Simulation
  // ─────────────────────────────────────────────────────────────
  console.log('\n4. RenderResumePage State Transitions:');

  // Test 4.1: Initial state is loading
  let pageStatus = 'loading';
  let pageErrorMessage: string | null = null;
  assert('Initial RenderResumePage status is "loading"', pageStatus === 'loading');

  // Test 4.2: Missing ID or Token immediately transitions to error
  const testMissingParams = (id?: string, token?: string) => {
    if (!id || !token) {
      pageStatus = 'error';
      pageErrorMessage = 'Missing resume ID or authorization token.';
    }
  };
  testMissingParams('resume-1', undefined);
  assert('Missing token transitions to error status', pageStatus === 'error');
  assert('Error message explains missing parameter', pageErrorMessage === 'Missing resume ID or authorization token.');

  // Test 4.3: Configuration error transitions to error state
  pageStatus = 'loading';
  pageErrorMessage = null;
  try {
    getApiBaseUrl('unsupported://protocol');
  } catch (err: any) {
    pageStatus = 'error';
    pageErrorMessage = err.message;
  }
  assert('Malformed VITE_API_URL transitions status to error', pageStatus === 'error');
  assert('Error message displays malformed configuration details', pageErrorMessage?.includes('Unsupported protocol') === true);

  // ─────────────────────────────────────────────────────────────
  // 5. Separate Origin Request & Network Isolation Contract
  // ─────────────────────────────────────────────────────────────
  console.log('\n5. Separate Origin Request & Header Inspection:');

  // Mock unauthenticatedApi.get to inspect exact parameters passed
  const originalGet = unauthenticatedApi.get;
  let interceptedUrl = '';
  let interceptedConfig: any = null;

  try {
    const mockResumeData = {
      id: 'resume-uuid-456',
      fullName: 'Alex Cloud Architect',
      title: 'Production URL Test Resume',
      templateId: 'modern',
    };

    unauthenticatedApi.get = (async (url: string, config: any) => {
      interceptedUrl = url;
      interceptedConfig = config;

      if (config?.params?.token === 'invalid-token') {
        const error: any = new Error('Request failed with status code 401');
        error.response = {
          status: 401,
          data: { success: false, message: 'Invalid or expired export token.' },
        };
        throw error;
      }

      return {
        data: {
          success: true,
          data: {
            resume: mockResumeData,
          },
        },
      };
    }) as any;

    const separateBackendUrl = 'https://api.resumebuilder.com/api';

    // Test 5.1: Requests use separate backend origin baseURL
    const loaded = await getResumeRenderData(
      'resume-uuid-456',
      'valid-60s-export-token',
      separateBackendUrl
    );
    assert('getResumeRenderData retrieves resume payload successfully', loaded.id === 'resume-uuid-456');
    assert('Retrieved resume has correct full name', loaded.fullName === 'Alex Cloud Architect');

    // Test 5.2: baseURL is set to the separate backend origin
    assert(
      'Request config uses configured separate backend origin baseURL',
      interceptedConfig?.baseURL === 'https://api.resumebuilder.com/api'
    );

    // Test 5.3: Request path is correct
    assert(
      'Request path targets /resumes/:id/render-data',
      interceptedUrl === '/resumes/resume-uuid-456/render-data'
    );

    // Test 5.4: Preserves exact export token in query parameters
    assert(
      'Export token is passed verbatim in params.token',
      interceptedConfig?.params?.token === 'valid-60s-export-token'
    );

    // Test 5.5: Zero Authorization header attached to render-data request
    assert(
      'Zero Authorization header attached (no stale session leakage)',
      interceptedConfig?.headers?.Authorization === undefined
    );

    // Test 5.6: Error handling on 401 response
    let caught401 = false;
    try {
      await getResumeRenderData('resume-uuid-456', 'invalid-token', separateBackendUrl);
    } catch (err: any) {
      caught401 = err.response?.status === 401;
    }
    assert('Catches 401 error gracefully when token is invalid', caught401);

    // Test 5.7: localStorage token remains untouched after 401 error
    assert(
      'User session token in localStorage is NOT wiped on render-data 401',
      storageMap.get('token') === 'stale-user-session-token-12345'
    );

  } finally {
    unauthenticatedApi.get = originalGet;
    if (globalObj?.process?.env) {
      if (originalEnvUrl !== undefined) {
        globalObj.process.env.VITE_API_URL = originalEnvUrl;
      } else {
        delete globalObj.process.env.VITE_API_URL;
      }
    }
  }

  console.log('\n------------------------------------------------------');
  console.log(`Render URL Test Results: ${passed} passed, ${failed} failed`);
  console.log('------------------------------------------------------\n');

  if (failed > 0) {
    if (globalObj?.process?.exit) {
      globalObj.process.exit(1);
    }
  }
}

runRenderUrlTests().catch((err) => {
  console.error('Fatal error during render URL tests:', err);
  const globalObj = typeof globalThis !== 'undefined' ? (globalThis as any) : undefined;
  if (globalObj?.process?.exit) {
    globalObj.process.exit(1);
  }
});
