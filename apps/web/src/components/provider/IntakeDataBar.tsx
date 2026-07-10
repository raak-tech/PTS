'use client';

import { useState } from 'react';
import { fieldLabel } from '@/lib/intake-mappers';

// ── Types ──────────────────────────────────────────────────────

type FieldStatus = 'solid' | 'review' | 'missing';

type FieldEntry = {
  key: string;
  label: string;
  value: string;
  confidence: number;
  status: FieldStatus;
  isRequired: boolean;
};

type IntakeDataBarProps = {
  clientId: string;
  painSource: string;
  painDescription: string;
  recoveryGoal: string;
  hasRedFlags: boolean;
  isSafe: boolean;
  /** JSON string of confidence scores: Record<string, number> */
  confidenceScores?: string | null;
  /** Raw free text from the one-box intake */
  rawText?: string | null;
  /** Number of extraction rounds */
  rounds?: number | null;
  /** Overall confidence (0-1 stored as string) */
  overallConfidence?: string | null;
  /** AI-generated summary */
  summary?: string | null;
  /** Existing plan status */
  planStatus?: string | null;
  /** Called when counselor clicks "Generate Week 1 plan" */
  onGeneratePlan: (clientId: string) => Promise<void>;
  /** Whether plan generation is in progress */
  isGenerating?: boolean;
};

// ── Constants ──────────────────────────────────────────────────

const CONFIDENCE_SOLID = 0.85;
const CONFIDENCE_REVIEW = 0.7;

const REQUIRED_FIELDS = [
  'painSource',
  'painDescription',
  'activitiesAffected',
  'biggestChange',
  'recoveryGoal',
  'hasRedFlags',
  'isSafe',
];

// ── Helpers ────────────────────────────────────────────────────

function formatFieldValue(value: unknown, fieldKey: string): string {
  if (value === null || value === undefined || value === '') return '—';
  if (typeof value === 'boolean') {
    if (fieldKey === 'hasRedFlags') return value ? 'Yes — flagged' : 'None detected';
    if (fieldKey === 'isSafe') return value ? 'Safe' : 'Safety concern';
    return value ? 'Yes' : 'No';
  }
  if (fieldKey === 'activitiesAffected') {
    try {
      const arr = JSON.parse(String(value));
      if (Array.isArray(arr) && arr.length > 0) return arr.join(', ');
    } catch { /* use raw value */ }
  }
  return String(value);
}

function fieldStatus(confidence: number, hasValue: boolean): FieldStatus {
  if (!hasValue) return 'missing';
  if (confidence >= CONFIDENCE_SOLID) return 'solid';
  if (confidence >= CONFIDENCE_REVIEW) return 'review';
  return 'missing';
}

function statusIcon(status: FieldStatus): string {
  if (status === 'solid') return '✅';
  if (status === 'review') return '⚠️';
  return '❌';
}

function statusLabel(status: FieldStatus): string {
  if (status === 'solid') return 'Solid';
  if (status === 'review') return 'Review';
  return 'Missing';
}

// ── Component ──────────────────────────────────────────────────

export function IntakeDataBar({
  clientId,
  painSource,
  painDescription,
  recoveryGoal,
  hasRedFlags,
  isSafe,
  confidenceScores,
  rawText,
  rounds,
  overallConfidence,
  summary,
  planStatus,
  onGeneratePlan,
  isGenerating = false,
}: IntakeDataBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);

  // Parse confidence scores
  const scores: Record<string, number> = {};
  if (confidenceScores) {
    try {
      Object.assign(scores, JSON.parse(confidenceScores));
    } catch { /* ignore */ }
  }

  // Build field entries from known intake data + confidence scores
  const knownFields: Record<string, string> = {
    painSource: painSource || '',
    painDescription: painDescription || '',
    recoveryGoal: recoveryGoal || '',
    hasRedFlags: String(hasRedFlags),
    isSafe: String(isSafe),
  };

  // Extract additional values from rawText context if available
  // For now, we only have the key fields from the existing intake query

  const allFields: FieldEntry[] = Object.entries(scores)
    .map(([key, confidence]) => {
      const rawValue = knownFields[key];
      const hasValue = rawValue !== undefined && rawValue !== '' && rawValue !== 'false' && rawValue !== 'null';
      return {
        key,
        label: fieldLabel(key),
        value: hasValue ? formatFieldValue(rawValue, key) : '—',
        confidence,
        status: fieldStatus(confidence, hasValue),
        isRequired: REQUIRED_FIELDS.includes(key),
      };
    })
    .sort((a, b) => {
      // Sort: solid first, then review, then missing; required first within each group
      const statusOrder = { solid: 0, review: 1, missing: 2 };
      const byStatus = statusOrder[a.status] - statusOrder[b.status];
      if (byStatus !== 0) return byStatus;
      return a.isRequired === b.isRequired ? 0 : a.isRequired ? -1 : 1;
    });

  const solidFields = allFields.filter((f) => f.status === 'solid');
  const reviewFields = allFields.filter((f) => f.status === 'review');
  const missingFields = allFields.filter((f) => f.status === 'missing');

  const hasFullData = solidFields.length + reviewFields.length > 0;

  const overallPct = overallConfidence
    ? Math.round(parseFloat(overallConfidence) * 100)
    : null;

  const needsReview = planStatus === 'pending_review';
  const planDraft = planStatus === 'draft';
  const planApproved = planStatus === 'approved';

  const canGenerate = needsReview || (!planDraft && !planApproved);

  // ── Render ──────────────────────────────────────────────────

  if (!hasFullData && !rawText) {
    return (
      <div
        style={{
          padding: '16px',
          border: '1px solid var(--border)',
          borderRadius: 12,
          marginBottom: 16,
          fontSize: 13,
          color: 'var(--muted)',
          fontStyle: 'italic',
        }}
      >
        No intake extraction data available for this client.
      </div>
    );
  }

  return (
    <div
      style={{
        border: '1px solid var(--border)',
        borderRadius: 12,
        marginBottom: 16,
        overflow: 'hidden',
      }}
    >
      {/* Header bar */}
      <div
        onClick={() => setExpanded((p) => !p)}
        style={{
          padding: '14px 16px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          cursor: 'pointer',
          background: needsReview ? '#fff8e1' : 'var(--surface)',
          borderBottom: expanded ? '1px solid var(--border)' : 'none',
          userSelect: 'none',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 2 }}>
            Client intake summary
            {rounds ? (
              <span style={{ fontWeight: 400, color: 'var(--muted)', fontSize: 12, marginLeft: 8 }}>
                (round {rounds} of 3)
              </span>
            ) : null}
          </div>
          {overallPct !== null && (
            <div style={{ fontSize: 12, color: 'var(--muted)' }}>
              Data confidence: {overallPct}%
              {needsReview ? ' — Pending counselor review' : ''}
            </div>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 18, transition: 'transform 0.15s', transform: expanded ? 'rotate(180deg)' : 'none' }}>
            ▾
          </span>
        </div>
      </div>

      {/* Expanded content */}
      {expanded && (
        <div style={{ padding: '16px' }}>
          {/* AI summary */}
          {summary && (
            <div
              style={{
                padding: '12px 14px',
                background: '#f8f8f6',
                borderRadius: 8,
                marginBottom: 16,
                fontSize: 13,
                lineHeight: 1.5,
                color: 'var(--text-secondary, #555)',
                fontStyle: 'italic',
              }}
            >
              {summary}
            </div>
          )}

          {/* Status summary pills */}
          <div
            style={{
              display: 'flex',
              gap: 12,
              marginBottom: 16,
              flexWrap: 'wrap',
              fontSize: 12,
            }}
          >
            <span style={{ color: '#2d6a4f' }}>
              ✅ Solid ({solidFields.length})
            </span>
            <span style={{ color: '#8a5a18' }}>
              ⚠️ Review ({reviewFields.length})
            </span>
            <span style={{ color: '#991b1b' }}>
              ❌ Missing ({missingFields.length})
            </span>
          </div>

          {/* Solid fields */}
          {solidFields.length > 0 && (
            <FieldGroup title="Solid" fields={solidFields} variant="solid" />
          )}

          {/* Review fields */}
          {reviewFields.length > 0 && (
            <FieldGroup title="Needs review" fields={reviewFields} variant="review" />
          )}

          {/* Missing fields */}
          {missingFields.length > 0 && (
            <FieldGroup title="Missing or low confidence" fields={missingFields} variant="missing" />
          )}

          {/* Raw text transcript */}
          {rawText && (
            <div style={{ marginTop: 16 }}>
              <button
                onClick={() => setShowTranscript((p) => !p)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--primary, #333)',
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: 'pointer',
                  padding: 0,
                  textDecoration: 'underline',
                  textUnderlineOffset: '0.2em',
                  minHeight: 'auto',
                  boxShadow: 'none',
                }}
              >
                {showTranscript ? 'Hide full transcript' : 'View full transcript'} ↗
              </button>
              {showTranscript && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '12px 14px',
                    background: '#f8f8f6',
                    borderRadius: 8,
                    fontSize: 13,
                    lineHeight: 1.6,
                    color: 'var(--text-secondary, #555)',
                    maxHeight: 200,
                    overflowY: 'auto',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {rawText}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div
            style={{
              marginTop: 20,
              display: 'flex',
              gap: 10,
              flexWrap: 'wrap',
            }}
          >
            {canGenerate && (
              <button
                onClick={() => onGeneratePlan(clientId)}
                disabled={isGenerating}
                style={{
                  padding: '10px 18px',
                  fontSize: 13,
                  fontWeight: 600,
                  backgroundColor: isGenerating ? 'var(--muted)' : 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: 8,
                  cursor: isGenerating ? 'default' : 'pointer',
                  opacity: isGenerating ? 0.6 : 1,
                }}
              >
                {isGenerating ? 'Generating…' : 'Generate Week 1 plan'}
              </button>
            )}
            {planDraft && (
              <span style={{ fontSize: 12, color: '#166534', alignSelf: 'center', fontWeight: 500 }}>
                ✓ Week 1 draft generated — review in Plan tab
              </span>
            )}
            {planApproved && (
              <span style={{ fontSize: 12, color: '#166534', alignSelf: 'center', fontWeight: 500 }}>
                ✓ Plan approved
              </span>
            )}
            {needsReview && (
              <span style={{ fontSize: 12, color: '#8a5a18', alignSelf: 'center' }}>
                Review the intake data above, then generate Week 1.
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Field group sub-component ──────────────────────────────────

function FieldGroup({
  title,
  fields,
  variant,
}: {
  title: string;
  fields: FieldEntry[];
  variant: 'solid' | 'review' | 'missing';
}) {
  if (fields.length === 0) return null;

  const borderColors = {
    solid: '#c8e6c9',
    review: '#ffe082',
    missing: '#ffcdd2',
  };
  const bgColors = {
    solid: '#f1f8f1',
    review: '#fff8e1',
    missing: '#fff5f5',
  };

  return (
    <div
      style={{
        marginBottom: 12,
        border: `1px solid ${borderColors[variant]}`,
        borderRadius: 8,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          padding: '8px 14px',
          fontSize: 12,
          fontWeight: 600,
          color: 'var(--muted)',
          background: bgColors[variant],
          borderBottom: `1px solid ${borderColors[variant]}`,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gap: 1 }}>
        {fields.map((field) => (
          <div
            key={field.key}
            style={{
              padding: '8px 14px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: 13,
              background: 'var(--surface)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11 }}>{statusIcon(field.status)}</span>
              <span style={{ fontWeight: 500 }}>
                {field.label}
                {field.isRequired ? (
                  <span style={{ fontSize: 10, color: 'var(--muted)', marginLeft: 4 }}>
                    req
                  </span>
                ) : null}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span
                style={{
                  color: field.value === '—' ? 'var(--muted)' : 'inherit',
                  fontStyle: field.value === '—' ? 'italic' : 'normal',
                  maxWidth: 200,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  textAlign: 'right',
                }}
              >
                {field.value}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color:
                    field.status === 'solid'
                      ? '#2d6a4f'
                      : field.status === 'review'
                        ? '#8a5a18'
                        : '#991b1b',
                  whiteSpace: 'nowrap',
                }}
              >
                {(field.confidence * 100).toFixed(0)}%
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
