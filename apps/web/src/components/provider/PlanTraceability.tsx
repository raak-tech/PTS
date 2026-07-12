'use client';

import type { CSSProperties } from 'react';

import { MODALITIES, type ModalityCode } from '@/lib/pain-script/modalities';
import { BASIC_ID_TAGS, SCRIPT_TAGS, isFormulationTag } from '@/lib/pain-script/tags';

const chipBase: CSSProperties = {
  display: 'inline-block',
  fontSize: 11,
  fontWeight: 700,
  padding: '3px 8px',
  borderRadius: 6,
  letterSpacing: 0.2,
};

export function tagLabel(tag: string): string {
  if (isFormulationTag(tag)) {
    if (tag in SCRIPT_TAGS) return SCRIPT_TAGS[tag as keyof typeof SCRIPT_TAGS];
    if (tag in BASIC_ID_TAGS) return BASIC_ID_TAGS[tag as keyof typeof BASIC_ID_TAGS];
  }
  return tag;
}

export function TargetChips({
  targets,
  emptyLabel,
}: {
  targets?: string[];
  emptyLabel?: string;
}) {
  if (!targets?.length) {
    if (!emptyLabel) return null;
    return (
      <p style={{ margin: '4px 0 0', fontSize: 12, color: '#999', fontStyle: 'italic' }}>{emptyLabel}</p>
    );
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
      {targets.map((t) => (
        <span
          key={t}
          title={tagLabel(t)}
          style={{ ...chipBase, background: '#e8f5e9', color: '#1b5e20', border: '1px solid #c8e6c9' }}
        >
          {t}
        </span>
      ))}
    </div>
  );
}

export function ModalityBadge({ code }: { code?: string }) {
  if (!code || !(code in MODALITIES)) return null;
  const meta = MODALITIES[code as ModalityCode];
  return (
    <span
      title={meta.label}
      style={{ ...chipBase, background: '#e3f2fd', color: '#0d47a1', border: '1px solid #bbdefb' }}
    >
      {code}
    </span>
  );
}

export function MechanismLine({ mechanism, label = 'Why (counselor)' }: { mechanism?: string; label?: string }) {
  if (!mechanism?.trim()) return null;
  return (
    <p style={{ margin: '8px 0 0', fontSize: 12, color: '#555', lineHeight: 1.5, fontStyle: 'italic' }}>
      <strong style={{ fontStyle: 'normal', color: '#333' }}>{label}:</strong> {mechanism}
    </p>
  );
}

export function PersonalizationBasis({ text }: { text?: string }) {
  if (!text?.trim()) return null;
  return (
    <div style={{ marginBottom: 12, padding: '10px 12px', background: '#f3f8ff', borderRadius: 8, border: '1px solid #cfe2ff' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Client sees (personalization)
      </p>
      <p style={{ margin: 0, fontSize: 13, color: '#333', lineHeight: 1.5 }}>{text}</p>
    </div>
  );
}

/** Counselor traceability block for holistic sections — §9.3 */
export function HolisticTraceability({
  targets,
  mechanism,
  modality,
}: {
  targets?: string[];
  mechanism?: string;
  modality?: ModalityCode;
}) {
  if (!targets?.length && !mechanism && !modality) return null;

  return (
    <div style={{ marginBottom: 10, padding: '8px 10px', background: '#fafafa', borderRadius: 6, border: '1px dashed #ddd' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Formulation traceability
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <TargetChips targets={targets} />
        <ModalityBadge code={modality} />
      </div>
      <MechanismLine mechanism={mechanism} />
    </div>
  );
}

export function PracticeTraceability({
  targets,
  mechanism,
  modality,
}: {
  targets?: string[];
  mechanism?: string;
  modality?: string;
}) {
  if (!targets?.length && !mechanism && !modality) return null;

  return (
    <div style={{ marginTop: 8, paddingTop: 8, borderTop: '1px solid #eee' }}>
      <p style={{ margin: '0 0 4px', fontSize: 11, fontWeight: 700, color: '#888', textTransform: 'uppercase', letterSpacing: 0.4 }}>
        Targets & modality
      </p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
        <TargetChips targets={targets} emptyLabel="No targets tagged" />
        <ModalityBadge code={modality} />
      </div>
      <MechanismLine mechanism={mechanism} />
    </div>
  );
}
