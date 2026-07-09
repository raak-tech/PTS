import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { llmUsage } from '@/db/schema';
import { logError } from '@/lib/logger';

export type LlmOperation = 'plan_generation' | 'week_generation' | 'intake_extraction';

export type LlmUsageContext = {
  userId?: string;
  planId?: string;
  weekNumber?: number;
};

export type OpenRouterUsage = {
  prompt_tokens?: number;
  completion_tokens?: number;
  total_tokens?: number;
  cost?: number;
};

export type RecordLlmUsageInput = {
  operation: LlmOperation;
  model: string;
  context?: LlmUsageContext;
  usage?: OpenRouterUsage | null;
  status: 'success' | 'error';
  latencyMs: number;
  requestId?: string | null;
  errorText?: string | null;
};

export function parseOpenRouterUsage(raw: unknown): OpenRouterUsage | null {
  if (!raw || typeof raw !== 'object') return null;
  const u = raw as Record<string, unknown>;
  return {
    prompt_tokens: typeof u.prompt_tokens === 'number' ? u.prompt_tokens : undefined,
    completion_tokens: typeof u.completion_tokens === 'number' ? u.completion_tokens : undefined,
    total_tokens: typeof u.total_tokens === 'number' ? u.total_tokens : undefined,
    cost: typeof u.cost === 'number' ? u.cost : undefined,
  };
}

export async function recordLlmUsage(input: RecordLlmUsageInput): Promise<void> {
  try {
    const db = getDb();
    const prompt = input.usage?.prompt_tokens ?? null;
    const completion = input.usage?.completion_tokens ?? null;
    const total =
      input.usage?.total_tokens ??
      (prompt != null && completion != null ? prompt + completion : null);

    await db.insert(llmUsage).values({
      id: randomUUID(),
      createdAt: new Date(),
      operation: input.operation,
      model: input.model,
      userId: input.context?.userId ?? null,
      planId: input.context?.planId ?? null,
      weekNumber: input.context?.weekNumber ?? null,
      promptTokens: prompt,
      completionTokens: completion,
      totalTokens: total,
      costUsd: input.usage?.cost != null ? String(input.usage.cost) : null,
      status: input.status,
      latencyMs: input.latencyMs,
      requestId: input.requestId ?? null,
      errorText: input.errorText ?? null,
    });
  } catch (err) {
    logError('llm_usage_record_failed', err, { operation: input.operation });
  }
}
