import { GoogleGenAI } from '@google/genai';
import { ZodSchema } from 'zod';
import { config } from '../config';
import { ApiError } from '../utils/apiError';

export interface GenerateContentOptions {
  prompt: string;
  systemInstruction?: string;
  model?: string;
  temperature?: number;
  timeoutMs?: number;
}

export interface GenerateJsonOptions<T = any> extends GenerateContentOptions {
  schema?: ZodSchema<T>;
}

export function sanitizeErrorMessage(message: string, apiKey?: string): string {
  if (!message) return 'Unknown error';
  let sanitized = message;

  if (apiKey && apiKey.length > 5) {
    sanitized = sanitized.split(apiKey).join('[REDACTED_KEY]');
  }

  sanitized = sanitized.replace(/AIzaSy[A-Za-z0-9_-]{20,}/g, '[REDACTED_KEY]');
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9._~+/-]+=*/gi, 'Bearer [REDACTED_TOKEN]');
  sanitized = sanitized.replace(/(?:api[_-]?key|key)=([A-Za-z0-9_-]+)/gi, 'key=[REDACTED_KEY]');

  return sanitized;
}

export function normalizeGeminiError(error: any, apiKey?: string): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  const rawMessage = error?.message || String(error);
  const safeMessage = sanitizeErrorMessage(rawMessage, apiKey);
  const status = error?.status;
  const name = error?.name;

  if (
    status === 504 ||
    name === 'AbortError' ||
    name === 'RequestTimeoutError' ||
    name === 'RequestAbortedError' ||
    name === 'GoogleGenerativeAIAbortError' ||
    safeMessage.includes('aborted') ||
    safeMessage.includes('timeout') ||
    safeMessage.includes('ETIMEDOUT') ||
    safeMessage.includes('DEADLINE_EXCEEDED') ||
    safeMessage.includes('Deadline expired')
  ) {
    return new ApiError(504, 'The AI service took too long to respond (exceeded request deadline). Please try again.');
  }

  if (
    status === 401 ||
    status === 403 ||
    safeMessage.includes('API_KEY_INVALID') ||
    safeMessage.includes('API key not valid') ||
    safeMessage.includes('PERMISSION_DENIED')
  ) {
    return new ApiError(503, 'AI service is temporarily unavailable due to a provider configuration issue. Please contact support or try again later.');
  }

  if (
    status === 503 ||
    safeMessage.includes('UNAVAILABLE') ||
    safeMessage.includes('overloaded') ||
    safeMessage.includes('High demand')
  ) {
    return new ApiError(503, 'AI service is temporarily overloaded or unavailable. Please try again in a few moments.');
  }

  if (
    status === 429 ||
    safeMessage.includes('RESOURCE_EXHAUSTED') ||
    safeMessage.includes('quota') ||
    safeMessage.includes('rate limit')
  ) {
    return new ApiError(429, 'AI request quota has been exceeded. Please wait a moment before trying again.');
  }

  if (status === 400 || name === 'InvalidRequestError' || safeMessage.includes('INVALID_ARGUMENT')) {
    return new ApiError(400, `Invalid request to AI provider: ${safeMessage}`);
  }

  if (
    safeMessage.includes('SAFETY') ||
    safeMessage.includes('blocked') ||
    safeMessage.includes('HARM_CATEGORY')
  ) {
    return new ApiError(422, 'Content was flagged or blocked by AI safety policies.');
  }

  return new ApiError(502, `AI service encountered an unexpected error: ${safeMessage}`);
}

export function extractJsonFromText(rawText: string): string {
  const trimmed = rawText.trim();
  const fenceRegex = /^```(?:json)?\s*\n?([\s\S]*?)\n?```$/i;
  const match = trimmed.match(fenceRegex);
  if (match && match[1]) {
    return match[1].trim();
  }
  return trimmed;
}

export class GeminiService {
  private client: GoogleGenAI | null = null;
  public readonly defaultTimeoutMs: number;

  constructor(clientOverride?: GoogleGenAI, timeoutOverrideMs?: number) {
    if (clientOverride) {
      this.client = clientOverride;
    }
    this.defaultTimeoutMs = timeoutOverrideMs || config.gemini.timeoutMs || 60000;
  }

  public setClient(client: GoogleGenAI | null): void {
    this.client = client;
  }

  public getClient(): GoogleGenAI {
    if (this.client) {
      return this.client;
    }

    const apiKey = config.gemini.apiKey;
    if (!apiKey || apiKey === 'your-gemini-api-key-here' || apiKey.trim() === '') {
      throw new ApiError(503, 'AI service is not configured. Missing GEMINI_API_KEY in environment.');
    }

    this.client = new GoogleGenAI({
      apiKey,
      httpOptions: { timeout: this.defaultTimeoutMs },
    });

    return this.client;
  }

  public async generateContent(options: GenerateContentOptions): Promise<string> {
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const model = options.model || config.gemini.model;
    const client = this.getClient();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await client.models.generateContent({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature,
          abortSignal: controller.signal,
          httpOptions: { timeout: timeoutMs },
        },
      });

      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        throw new ApiError(422, 'Content generation was blocked by Gemini safety policy.');
      }

      const text = response.text;
      if (!text || text.trim() === '') {
        throw new ApiError(502, 'AI provider returned an empty response.');
      }

      return text.trim();
    } catch (error: any) {
      throw normalizeGeminiError(error, config.gemini.apiKey);
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public async generateJson<T = any>(options: GenerateJsonOptions<T>): Promise<T> {
    const timeoutMs = options.timeoutMs || this.defaultTimeoutMs;
    const model = options.model || config.gemini.model;
    const client = this.getClient();

    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
    }, timeoutMs);

    try {
      const response = await client.models.generateContent({
        model,
        contents: options.prompt,
        config: {
          systemInstruction: options.systemInstruction,
          temperature: options.temperature,
          responseMimeType: 'application/json',
          abortSignal: controller.signal,
          httpOptions: { timeout: timeoutMs },
        },
      });

      const candidate = response.candidates?.[0];
      if (candidate?.finishReason === 'SAFETY') {
        throw new ApiError(422, 'Content generation was blocked by Gemini safety policy.');
      }

      const rawText = response.text;
      if (!rawText || rawText.trim() === '') {
        throw new ApiError(502, 'AI provider returned an empty JSON response.');
      }

      const cleanedJson = extractJsonFromText(rawText);

      let parsed: any;
      try {
        parsed = JSON.parse(cleanedJson);
      } catch (parseErr: any) {
        throw new ApiError(502, `AI provider returned malformed JSON output: ${parseErr.message}`);
      }

      if (options.schema) {
        const validation = options.schema.safeParse(parsed);
        if (!validation.success) {
          const formattedIssues = validation.error.issues.map((i) => ({
            field: i.path.join('.'),
            message: i.message,
          }));
          throw new ApiError(502, 'AI response failed schema validation.', formattedIssues);
        }
        return validation.data;
      }

      return parsed as T;
    } catch (error: any) {
      throw normalizeGeminiError(error, config.gemini.apiKey);
    } finally {
      clearTimeout(timeoutId);
    }
  }
}

export const geminiService = new GeminiService();
