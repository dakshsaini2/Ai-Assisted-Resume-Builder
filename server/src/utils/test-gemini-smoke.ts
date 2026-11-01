/**
 * Live Gemini API Smoke Test
 *
 * Performs exactly one minimal live text-generation request using geminiService
 * to verify connectivity, API key validity, and model responsiveness.
 *
 * Security: NEVER prints the API key, bearer tokens, or sensitive headers.
 */

import { geminiService, sanitizeErrorMessage } from '../services/gemini.service';
import { config } from '../config';

async function runLiveSmokeTest() {
  console.log('======================================================');
  console.log('       Live Gemini API Smoke Test');
  console.log('======================================================\n');

  // 1. Verify environment configuration loading (without leaking secrets)
  const keyConfigured = Boolean(
    config.gemini.apiKey &&
    config.gemini.apiKey !== 'your-gemini-api-key-here' &&
    config.gemini.apiKey.trim().length > 10
  );

  console.log(`Configured Model: ${config.gemini.model}`);
  console.log(`Configured Timeout: ${geminiService.defaultTimeoutMs}ms`);
  console.log(`API Key Configured: ${keyConfigured ? 'YES (non-empty, valid format)' : 'NO'}`);

  if (!keyConfigured) {
    console.error('\n[FAILURE] GEMINI_API_KEY is not set or is using the default placeholder in server/.env');
    process.exit(1);
  }

  // 2. Perform exactly one minimal live generation request
  const prompt = 'Reply with exactly: GEMINI_CONNECTION_OK';
  console.log(`\nSending prompt: "${prompt}"...`);

  try {
    const startTime = Date.now();
    const responseText = await geminiService.generateContent({
      prompt,
      model: config.gemini.model,
    });
    const durationMs = Date.now() - startTime;

    console.log('\n[SUCCESS] Live Gemini API connection established.');
    console.log(`Duration: ${durationMs}ms`);
    console.log(`Response Text: "${responseText}"`);
    console.log('\n======================================================');
    process.exit(0);
  } catch (error: any) {
    const safeError = sanitizeErrorMessage(error?.message || String(error), config.gemini.apiKey);
    console.error('\n[FAILURE] Live Gemini API request failed.');
    console.error(`Status Code: ${error?.statusCode || error?.status || 'Unknown'}`);
    console.error(`Sanitized Error: ${safeError}`);
    console.log('\n======================================================');
    process.exit(1);
  }
}

runLiveSmokeTest();
