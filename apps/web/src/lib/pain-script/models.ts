export type LlmOperation =
  | 'intake_extraction'
  | 'formulation_generation'
  | 'plan_generation'
  | 'week_generation'
  | 'formulation_rescore'
  | 'flare_classify';

/** Per §17 — cheap tier for structured ops; Sonnet for creative plan output. */
export const MODEL_BY_OPERATION: Record<LlmOperation, string> = {
  intake_extraction: process.env.LLM_MODEL_INTAKE ?? 'anthropic/claude-haiku-4.5',
  formulation_generation: process.env.LLM_MODEL_FORMULATION ?? 'anthropic/claude-haiku-4.5',
  plan_generation: process.env.LLM_MODEL_PLAN ?? 'anthropic/claude-sonnet-4.6',
  week_generation: process.env.LLM_MODEL_WEEK ?? 'anthropic/claude-sonnet-4.6',
  formulation_rescore: process.env.LLM_MODEL_RESCORE ?? 'anthropic/claude-haiku-4.5',
  flare_classify: process.env.LLM_MODEL_FLARE ?? 'anthropic/claude-haiku-4.5',
};

export function modelForOperation(operation: LlmOperation): string {
  return MODEL_BY_OPERATION[operation];
}
