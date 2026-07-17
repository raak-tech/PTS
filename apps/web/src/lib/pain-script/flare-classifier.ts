import { log, logError } from '@/lib/logger';
import {
  parseOpenRouterUsage,
  recordLlmUsage,
  type LlmUsageContext,
} from '@/lib/llm-usage';
import { modelForOperation } from '@/lib/pain-script/models';
import { filterValidTags } from '@/lib/pain-script/tags';

export type FlareClassification = {
  tags: string[];
  severity: 'low' | 'medium' | 'high';
  safetyConcern: boolean;
};

const FLARE_CLASSIFIER_PROMPT = `A client has reported a flare-up. From their words, identify which pain-script elements are active
(usually RE_* or SD_* tags), and whether there is any safety concern. Output JSON only:
{ "tags":["RE_RELIVING"], "severity":"low|medium|high", "safetyConcern":true|false }
Do not give advice here — you only classify. If safetyConcern is true, the app shows crisis resources.
Valid tag codes: SB_SELF, SB_OTHERS, SB_LIFE, SD_BEHAVIOUR, SD_SOMATIC, SD_FANTASY, RE_TRIGGERS, RE_MEMORIES, RE_RELIVING`;

export async function classifyFlare(
  triggerText: string,
  painLevel: number | null,
  context?: LlmUsageContext,
): Promise<FlareClassification> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    return heuristicClassify(triggerText, painLevel);
  }

  const model = modelForOperation('flare_classify');
  const startedAt = Date.now();
  const userContent = `Pain level (0-10): ${painLevel ?? 'not given'}\nWhat they wrote:\n${triggerText}`;

  try {
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://pts-web-pied.vercel.app',
        'X-Title': 'PTS Flare Classify',
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: FLARE_CLASSIFIER_PROMPT },
          { role: 'user', content: userContent },
        ],
        temperature: 0.2,
        max_tokens: 300,
        usage: { include: true },
      }),
    });

    const latencyMs = Date.now() - startedAt;
    if (!response.ok) {
      await recordLlmUsage({
        operation: 'flare_classify',
        model,
        context,
        status: 'error',
        latencyMs,
        errorText: `HTTP ${response.status}`,
      });
      return heuristicClassify(triggerText, painLevel);
    }

    type OpenRouterResponse = {
      id?: string;
      choices: { message: { content: string } }[];
      usage?: unknown;
    };
    const data = (await response.json()) as OpenRouterResponse;
    const usage = parseOpenRouterUsage(data.usage);
    const raw = data.choices[0]?.message?.content ?? '';
    const cleaned = raw.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
    const parsed = JSON.parse(cleaned) as FlareClassification;
    const tags = filterValidTags(parsed.tags ?? []);

    const result: FlareClassification = {
      tags: tags.length ? tags : ['SD_SOMATIC'],
      severity: parsed.severity ?? 'medium',
      safetyConcern: Boolean(parsed.safetyConcern),
    };

    await recordLlmUsage({
      operation: 'flare_classify',
      model,
      context,
      usage,
      status: 'success',
      latencyMs,
      requestId: data.id ?? null,
    });
    return result;
  } catch (err) {
    logError('flare_classify_error', err);
    return heuristicClassify(triggerText, painLevel);
  }
}

function heuristicClassify(text: string, painLevel: number | null): FlareClassification {
  const lower = text.toLowerCase();
  const safetyConcern =
    /suicid|self.?harm|kill myself|unsafe|emergency|can't go on|end it all/.test(lower);

  let tags: string[] = ['SD_SOMATIC'];
  if (/worst case|never get better|catastroph|scared it/.test(lower)) tags = ['RE_RELIVING', 'SD_FANTASY'];
  else if (/setback|stressed|overdid|pushed/.test(lower)) tags = ['RE_TRIGGERS'];
  else if (/can't move|shut down|stopped everything/.test(lower)) tags = ['SD_BEHAVIOUR'];
  else if (/broken|fragile|useless|let me down/.test(lower)) tags = ['SB_SELF'];

  const severity =
    (painLevel ?? 0) >= 8 || safetyConcern ? 'high' : (painLevel ?? 0) >= 5 ? 'medium' : 'low';

  log('flare_classify_heuristic', { tags, severity, safetyConcern });
  return { tags, severity, safetyConcern };
}
