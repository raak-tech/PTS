import { filterValidTags, isFormulationTag } from '@/lib/pain-script/tags';
import type {
  BasicIdDomain,
  BasicIdProfile,
  BeliefItem,
  FormulationGenerationResult,
  PainScriptFormulation,
  ScriptBeliefs,
} from '@/lib/pain-script/types';

function emptyBasicIdDomain(): BasicIdDomain {
  return { present: false, summary: 'Not enough information — counsellor to explore.', examples: [] };
}

function normalizeBasicIdDomain(raw: unknown): BasicIdDomain {
  if (!raw || typeof raw !== 'object') return emptyBasicIdDomain();
  const d = raw as Record<string, unknown>;
  return {
    present: Boolean(d.present),
    summary: typeof d.summary === 'string' ? d.summary : emptyBasicIdDomain().summary,
    examples: Array.isArray(d.examples) ? d.examples.map(String) : [],
  };
}

function normalizeBeliefItems(raw: unknown): BeliefItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item) => {
      if (!item || typeof item !== 'object') return null;
      const o = item as Record<string, unknown>;
      const tags = filterValidTags(Array.isArray(o.tags) ? o.tags.map(String) : []);
      return {
        statement: String(o.statement ?? ''),
        evidence: String(o.evidence ?? ''),
        tags,
      };
    })
    .filter((x): x is BeliefItem => Boolean(x?.statement || x?.evidence));
}

export function normalizeFormulation(raw: unknown): FormulationGenerationResult {
  const data = (raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>;
  const sb = (data.scriptBeliefs ?? {}) as Record<string, unknown>;
  const sd = (data.scriptDisplays ?? {}) as Record<string, unknown>;
  const re = (data.reinforcingExperiences ?? {}) as Record<string, unknown>;
  const bid = (data.basicId ?? {}) as Record<string, unknown>;

  const scriptBeliefs: ScriptBeliefs = {
    self: normalizeBeliefItems(sb.self),
    others: normalizeBeliefItems(sb.others),
    life: normalizeBeliefItems(sb.life),
    needs: Array.isArray(sb.needs) ? sb.needs.map(String) : [],
    coreFeelings: Array.isArray(sb.coreFeelings) ? sb.coreFeelings.map(String) : [],
  };

  const basicId: BasicIdProfile = {
    behaviour: normalizeBasicIdDomain(bid.behaviour),
    affect: normalizeBasicIdDomain(bid.affect),
    sensation: normalizeBasicIdDomain(bid.sensation),
    imagery: normalizeBasicIdDomain(bid.imagery),
    cognition: normalizeBasicIdDomain(bid.cognition),
    interpersonal: normalizeBasicIdDomain(bid.interpersonal),
    drugBiological: normalizeBasicIdDomain(bid.drugBiological),
  };

  const primaryTargets = filterValidTags(
    Array.isArray(data.primaryTargets) ? data.primaryTargets.map(String) : [],
  ).slice(0, 5);

  const confidence: PainScriptFormulation['confidence'] = {};
  if (data.confidence && typeof data.confidence === 'object') {
    for (const [k, v] of Object.entries(data.confidence as Record<string, unknown>)) {
      if (isFormulationTag(k) && typeof v === 'number') {
        confidence[k] = Math.min(1, Math.max(0, v));
      }
    }
  }

  return {
    scriptBeliefs,
    scriptDisplays: {
      behaviours: Array.isArray(sd.behaviours) ? sd.behaviours.map(String) : [],
      somaticExperience: Array.isArray(sd.somaticExperience) ? sd.somaticExperience.map(String) : [],
      fantasies: Array.isArray(sd.fantasies) ? sd.fantasies.map(String) : [],
    },
    reinforcingExperiences: {
      currentTriggers: Array.isArray(re.currentTriggers) ? re.currentTriggers.map(String) : [],
      oldMemories: Array.isArray(re.oldMemories) ? re.oldMemories.map(String) : [],
      catastrophicReliving: Array.isArray(re.catastrophicReliving)
        ? re.catastrophicReliving.map(String)
        : [],
    },
    basicId,
    maintenanceHypothesis: String(data.maintenanceHypothesis ?? ''),
    primaryTargets,
    confidence,
    safetyFlag: Boolean(data.safetyFlag),
    safetyReason: data.safetyReason ? String(data.safetyReason) : null,
  };
}
