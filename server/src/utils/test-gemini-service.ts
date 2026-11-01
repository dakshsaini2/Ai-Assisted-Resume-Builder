/**
 * Automated Test Suite for Gemini Provider Service
 * Tests client initialization, configurable timeouts, mock responses,
 * JSON parsing, Zod validation, timeouts, error mapping, and safety handling
 * without consuming API credits.
 *
 * Run: npm --prefix server exec tsx server/src/utils/test-gemini-service.ts
 */

import { z } from 'zod';
import { GoogleGenAI } from '@google/genai';
import {
  GeminiService,
  extractJsonFromText,
  normalizeGeminiError,
  sanitizeErrorMessage,
} from '../services/gemini.service';
import { ApiError } from './apiError';
import { config, parseTimeoutMs } from '../config';

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

async function runGeminiServiceTests() {
  console.log('\n======================================================');
  console.log('   Gemini Provider Service Integration Tests');
  console.log('======================================================\n');

  // ─────────────────────────────────────────────────────────────
  // 1. Client Initialization & Timeout Configuration
  // ─────────────────────────────────────────────────────────────
  console.log('1. Client Initialization & Timeout Configuration:');

  const defaultService = new GeminiService();
  assert(
    'Default service initializes with 60,000ms deadline',
    defaultService.defaultTimeoutMs === 60000,
    `Expected 60000, got: ${defaultService.defaultTimeoutMs}`
  );
  assert(
    'Configured default Gemini model is gemini-3.8-flash',
    config.gemini.model === 'gemini-3.8-flash',
    `Expected gemini-3.8-flash, got: ${config.gemini.model}`
  );
  assert(
    'Configured default timeout is 60,000ms',
    config.gemini.timeoutMs === 60000,
    `Expected 60000, got: ${config.gemini.timeoutMs}`
  );

  // Test parseTimeoutMs behavior
  assert('parseTimeoutMs parses valid integer strings (90000 -> 90000)', parseTimeoutMs('90000') === 90000);
  assert('parseTimeoutMs falls back to 60000 for empty string', parseTimeoutMs('') === 60000);
  assert('parseTimeoutMs falls back to 60000 for undefined', parseTimeoutMs(undefined) === 60000);
  assert('parseTimeoutMs falls back to 60000 for non-numeric input', parseTimeoutMs('not-a-number') === 60000);
  assert('parseTimeoutMs falls back to 60000 for negative input', parseTimeoutMs('-5000') === 60000);
  assert('parseTimeoutMs falls back to 60000 for input below 1000ms', parseTimeoutMs('500') === 60000);
  assert('parseTimeoutMs falls back to 60000 for input exceeding 300,000ms (5min)', parseTimeoutMs('500000') === 60000);

  // Service constructor timeout override
  const customService = new GeminiService(undefined, 45000);
  assert('Constructor allows explicit timeout override (45000ms)', customService.defaultTimeoutMs === 45000);

  // ─────────────────────────────────────────────────────────────
  // 2. Missing API Key Guard (HTTP 503)
  // ─────────────────────────────────────────────────────────────
  console.log('\n2. Missing API Key Guard:');

  const originalApiKey = config.gemini.apiKey;
  try {
    (config.gemini as any).apiKey = '';
    const unconfiguredService = new GeminiService();
    let threw503 = false;
    let emptyMessage = '';
    try {
      unconfiguredService.getClient();
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 503) {
        threw503 = true;
        emptyMessage = err.message;
      }
    }
    assert('Throws 503 Service Unavailable when GEMINI_API_KEY is empty', threw503);
    assert('Message indicates missing GEMINI_API_KEY', emptyMessage.includes('Missing GEMINI_API_KEY'));

    (config.gemini as any).apiKey = 'your-gemini-api-key-here';
    let threwPlaceholder = false;
    try {
      unconfiguredService.getClient();
    } catch (err: any) {
      if (err instanceof ApiError && err.statusCode === 503) {
        threwPlaceholder = true;
      }
    }
    assert('Throws 503 Service Unavailable when GEMINI_API_KEY is default placeholder', threwPlaceholder);
  } finally {
    (config.gemini as any).apiKey = originalApiKey;
  }

  // ─────────────────────────────────────────────────────────────
  // 3. Mocked Successful Text Generation & X-Server-Timeout
  // ─────────────────────────────────────────────────────────────
  console.log('\n3. Content Generation with Mocked Client:');

  let passedHttpTimeout: number | undefined = undefined;
  let passedAbortSignal: any = undefined;

  const mockTextClient = {
    models: {
      generateContent: async (params: any) => {
        passedHttpTimeout = params.config?.httpOptions?.timeout;
        passedAbortSignal = params.config?.abortSignal;
        return {
          text: 'This is a high-quality professional summary generated for the candidate.',
          candidates: [{ finishReason: 'STOP' }],
        };
      },
    },
  } as unknown as GoogleGenAI;

  const mockService = new GeminiService(mockTextClient);
  const textResult = await mockService.generateContent({
    prompt: 'Generate summary for Jane Doe',
    timeoutMs: 60000,
  });

  assert(
    'generateContent returns text string',
    textResult === 'This is a high-quality professional summary generated for the candidate.'
  );
  assert(
    'Passes matching httpOptions.timeout to SDK (triggers X-Server-Timeout: 60 header)',
    passedHttpTimeout === 60000
  );
  assert('Attaches active AbortSignal to SDK request config', Boolean(passedAbortSignal && !passedAbortSignal.aborted));

  // ─────────────────────────────────────────────────────────────
  // 4. JSON Extraction & Cleaning
  // ─────────────────────────────────────────────────────────────
  console.log('\n4. JSON Extraction & Cleaning:');

  const rawJson = '{"summary": "Passionate engineer", "skills": ["React", "Node.js"]}';
  assert('extractJsonFromText leaves clean JSON untouched', extractJsonFromText(rawJson) === rawJson);

  const fencedJson = '```json\n{"summary": "Passionate engineer", "skills": ["React", "Node.js"]}\n```';
  assert(
    'extractJsonFromText strips ```json ... ``` markdown code fences',
    extractJsonFromText(fencedJson) === rawJson
  );

  const mockJsonClient = {
    models: {
      generateContent: async (_params: any) => {
        return {
          text: '```json\n{"summary": "Passionate engineer", "skills": ["React", "Node.js"]}\n```',
          candidates: [{ finishReason: 'STOP' }],
        };
      },
    },
  } as unknown as GoogleGenAI;

  const jsonService = new GeminiService(mockJsonClient);
  const parsedObj = await jsonService.generateJson({ prompt: 'Give me JSON' });
  assert('generateJson parses JSON properly from markdown fences', parsedObj.summary === 'Passionate engineer');
  assert('generateJson extracts array fields properly', parsedObj.skills.length === 2);

  // ─────────────────────────────────────────────────────────────
  // 5. Zod Schema Output Validation
  // ─────────────────────────────────────────────────────────────
  console.log('\n5. Zod Schema Output Validation:');

  const summarySchema = z.object({
    summary: z.string().min(5),
    skills: z.array(z.string()).min(1),
  });

  const validValidated = await jsonService.generateJson({
    prompt: 'Give me JSON',
    schema: summarySchema,
  });
  assert('Valid JSON matching Zod schema passes validation', validValidated.summary === 'Passionate engineer');

  // Mismatched schema test (e.g. expects score number)
  const strictScoreSchema = z.object({
    summary: z.string(),
    score: z.number().min(0).max(100),
  });

  let schemaValidationFailed = false;
  let schemaStatusCode = 0;
  try {
    await jsonService.generateJson({
      prompt: 'Give me JSON',
      schema: strictScoreSchema,
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      schemaValidationFailed = true;
      schemaStatusCode = err.statusCode;
    }
  }
  assert('Mismatched output triggers 502 Bad Gateway', schemaValidationFailed && schemaStatusCode === 502);

  // ─────────────────────────────────────────────────────────────
  // 6. Malformed JSON Output Handling
  // ─────────────────────────────────────────────────────────────
  console.log('\n6. Malformed JSON Output Handling:');

  const malformedClient = {
    models: {
      generateContent: async (_params: any) => {
        return {
          text: 'Here is your response: { broken json, missing quotes }',
          candidates: [{ finishReason: 'STOP' }],
        };
      },
    },
  } as unknown as GoogleGenAI;

  const malformedService = new GeminiService(malformedClient);
  let malformedCaught = false;
  let malformedStatus = 0;
  try {
    await malformedService.generateJson({ prompt: 'Broken' });
  } catch (err: any) {
    if (err instanceof ApiError) {
      malformedCaught = true;
      malformedStatus = err.statusCode;
    }
  }
  assert('Malformed JSON throws 502 Bad Gateway', malformedCaught && malformedStatus === 502);

  // ─────────────────────────────────────────────────────────────
  // 7. Timeout & Abort Handling (Deadline Bounding)
  // ─────────────────────────────────────────────────────────────
  console.log('\n7. Timeout & Abort Handling:');

  const delayedClient = {
    models: {
      generateContent: async (params: any) => {
        const signal = params.config?.abortSignal as AbortSignal | undefined;
        return new Promise((resolve, reject) => {
          const timer = setTimeout(() => {
            resolve({ text: 'Done late' });
          }, 200);

          if (signal) {
            signal.addEventListener('abort', () => {
              clearTimeout(timer);
              const abortErr: any = new Error('This operation was aborted');
              abortErr.name = 'AbortError';
              reject(abortErr);
            });
          }
        });
      },
    },
  } as unknown as GoogleGenAI;

  const delayedService = new GeminiService(delayedClient);
  let timeoutCaught = false;
  let timeoutStatusCode = 0;

  try {
    await delayedService.generateContent({
      prompt: 'Slow prompt',
      timeoutMs: 40, // 40ms threshold for test
    });
  } catch (err: any) {
    if (err instanceof ApiError) {
      timeoutCaught = true;
      timeoutStatusCode = err.statusCode;
    }
  }

  assert('Aborted request throws 504 Gateway Timeout', timeoutCaught && timeoutStatusCode === 504);

  // ─────────────────────────────────────────────────────────────
  // 8. Provider Error Mapping & Secret Redaction
  // ─────────────────────────────────────────────────────────────
  console.log('\n8. Provider Error Mapping & Secret Redaction:');

  const testKey = 'AIzaSyDemoSecretKeyForTesting123456';
  const testBearer = 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.testsecret';

  // Test 8.1: Secret Redaction (API Keys, Bearer Tokens, Query Strings)
  const rawLeak = `Request failed: Invalid key ${testKey} with auth ${testBearer} and key=${testKey}`;
  const sanitized = sanitizeErrorMessage(rawLeak, testKey);
  assert('Sanitizes explicit API key string from error messages', !sanitized.includes(testKey));
  assert('Sanitizes Google AIzaSy key patterns from error messages', sanitized.includes('[REDACTED_KEY]'));
  assert('Sanitizes Bearer authorization tokens from error messages', !sanitized.includes('testsecret') && sanitized.includes('Bearer [REDACTED_TOKEN]'));

  // Test 8.2: Upstream Credentials / Auth Failure -> HTTP 503 (NOT 401)
  const authErr = normalizeGeminiError({ status: 401, message: 'API_KEY_INVALID' }, testKey);
  assert('Maps upstream 401 / API_KEY_INVALID to 503 Service Unavailable (NEVER 401)', authErr.statusCode === 503);
  assert('Message does NOT leak internal provider keys', !authErr.message.includes(testKey));

  const permErr = normalizeGeminiError({ status: 403, message: 'PERMISSION_DENIED: caller lacks permission' }, testKey);
  assert('Maps upstream 403 / PERMISSION_DENIED to 503 Service Unavailable', permErr.statusCode === 503);

  // Test 8.3: Provider Overload -> HTTP 503
  const overloadErr = normalizeGeminiError({ status: 503, message: 'The model is overloaded. Please try again later.' }, testKey);
  assert('Maps upstream 503 / overloaded to 503 Service Unavailable', overloadErr.statusCode === 503);

  // Test 8.4: Quota Exhaustion -> HTTP 429
  const quotaErr = normalizeGeminiError({ status: 429, message: 'RESOURCE_EXHAUSTED: quota exceeded for current quota group' }, testKey);
  assert('Maps 429 / RESOURCE_EXHAUSTED to 429 Too Many Requests', quotaErr.statusCode === 429);

  // Test 8.5: 400 Invalid Request
  const badReqErr = normalizeGeminiError({ status: 400, name: 'InvalidRequestError', message: 'INVALID_ARGUMENT: unsupported parameter' }, testKey);
  assert('Maps 400 / InvalidRequestError to 400 Bad Request', badReqErr.statusCode === 400);

  // Test 8.6: Safety Block
  const safetyErr = normalizeGeminiError({ message: 'Response blocked due to SAFETY filters' }, testKey);
  assert('Maps SAFETY block to 422 Unprocessable Entity', safetyErr.statusCode === 422);

  // Test 8.7: Timeout / AbortError / Gateway Deadlines
  const abortErr = normalizeGeminiError({ name: 'RequestTimeoutError', message: 'Request timed out' }, testKey);
  assert('Maps RequestTimeoutError to 504 Gateway Timeout', abortErr.statusCode === 504);

  // Test 8.8: Google Gateway 504 & DEADLINE_EXCEEDED
  const google504Err = normalizeGeminiError({
    status: 504,
    message: '{"error":{"code":504,"message":"Deadline expired before operation could complete.","status":"DEADLINE_EXCEEDED"}}',
  }, testKey);
  assert('Maps Google HTTP status 504 to 504 Gateway Timeout', google504Err.statusCode === 504);

  const deadlineExceededErr = normalizeGeminiError({
    message: 'Operation failed with DEADLINE_EXCEEDED',
  }, testKey);
  assert('Maps DEADLINE_EXCEEDED message to 504 Gateway Timeout', deadlineExceededErr.statusCode === 504);

  const deadlineExpiredErr = normalizeGeminiError({
    message: 'Deadline expired before operation could complete.',
  }, testKey);
  assert('Maps "Deadline expired" message to 504 Gateway Timeout', deadlineExpiredErr.statusCode === 504);

  // ─────────────────────────────────────────────────────────────
  // 9. Safety FinishReason Detection in generateContent
  // ─────────────────────────────────────────────────────────────
  console.log('\n9. Safety FinishReason Detection:');

  const safetyClient = {
    models: {
      generateContent: async (_params: any) => {
        return {
          text: '',
          candidates: [{ finishReason: 'SAFETY' }],
        };
      },
    },
  } as unknown as GoogleGenAI;

  const safetyService = new GeminiService(safetyClient);
  let safetyCaught = false;
  let safetyStatus = 0;
  try {
    await safetyService.generateContent({ prompt: 'Unsafe' });
  } catch (err: any) {
    if (err instanceof ApiError) {
      safetyCaught = true;
      safetyStatus = err.statusCode;
    }
  }
  assert('generateContent flags SAFETY finishReason with 422', safetyCaught && safetyStatus === 422);

  // ─────────────────────────────────────────────────────────────
  // 10. Live Verification Check Status
  // ─────────────────────────────────────────────────────────────
  console.log('\n10. Live Verification Check:');
  const hasValidLiveKey = config.gemini.apiKey && config.gemini.apiKey !== 'your-gemini-api-key-here';
  if (process.env.RUN_LIVE_GEMINI_TEST === 'true' && hasValidLiveKey) {
    console.log('  Live verification requested via RUN_LIVE_GEMINI_TEST=true...');
    try {
      const liveService = new GeminiService();
      const liveResponse = await liveService.generateContent({ prompt: 'Hello in one word' });
      assert('Live API call executed successfully', typeof liveResponse === 'string' && liveResponse.length > 0);
    } catch (liveErr: any) {
      assert('Live API call failed', false, liveErr.message);
    }
  } else {
    console.log('  [Optional Live Test: Skipped — Automated suite ran 100% mocked to prevent consuming API credits]');
  }

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  Gemini Service Results: ${passed} passed, ${failed} failed`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runGeminiServiceTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
