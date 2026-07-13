"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { webTheme as t } from "@/lib/web-theme";
import { fieldLabel } from "@/lib/intake-mappers";
import type { ExtractionResult } from "@/lib/intake-extractor";
import type { IntakeInsertShape } from "@/lib/intake-mappers";

// ── Types ──────────────────────────────────────────────────────

type ConfirmData = {
  extracted: ExtractionResult["extracted"];
  mapped: IntakeInsertShape;
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  summary: string;
  clientSummary?: string;
  extractionUsable?: boolean;
  overallConfidence: number;
  rounds: number;
  segmentType: string | null;
  freeText?: string;
};

// Fields that the counselor requires at ≥0.85 confidence
const REQUIRED_FIELDS = [
  "painSource",
  "painDescription",
  "activitiesAffected",
  "biggestChange",
  "recoveryGoal",
  "hasRedFlags",
  "isSafe",
] as const;

const CONFIDENCE_HIGH = 0.85;

// ── Format field value for display ─────────────────────────────

function formatFieldValue(
  value: string | boolean | null,
  fieldName: string,
): string {
  if (value === null || value === undefined || value === "") return "(not provided)";

  if (typeof value === "boolean") {
    if (fieldName === "hasRedFlags") return value ? "Yes — flagged" : "None detected";
    if (fieldName === "isSafe") return value ? "Safe" : "Safety concern";
    if (fieldName === "hasDependents") return value ? "Yes" : "No";
    return value ? "Yes" : "No";
  }

  // activitiesAffected might be a JSON array string
  if (fieldName === "activitiesAffected") {
    try {
      const arr = JSON.parse(value);
      if (Array.isArray(arr) && arr.length > 0) return arr.join(", ");
      return String(value);
    } catch {
      return String(value);
    }
  }

  return String(value);
}

// ── Confidence badge ───────────────────────────────────────────

function ConfidenceBadge({
  confidence,
  isRequired,
}: {
  confidence: number;
  isRequired: boolean;
}) {
  const isHigh = confidence >= CONFIDENCE_HIGH;

  if (!isRequired) {
    const color = isHigh ? "#1b5e20" : t.textMuted;
    return (
      <span
        style={{
          fontSize: 11,
          color,
          fontWeight: 500,
          whiteSpace: "nowrap",
        }}
      >
        {isHigh ? "✅" : "⚪"} {(confidence * 100).toFixed(0)}%
      </span>
    );
  }

  if (isHigh) {
    return (
      <span
        style={{
          fontSize: 11,
          color: "#2d6a4f",
          fontWeight: 600,
          whiteSpace: "nowrap",
        }}
      >
        ✅ {(confidence * 100).toFixed(0)}%
      </span>
    );
  }

  return (
    <span
      style={{
        fontSize: 11,
        color: "#8a5a18",
        fontWeight: 600,
        whiteSpace: "nowrap",
      }}
    >
      ⚠️ {(confidence * 100).toFixed(0)}%
    </span>
  );
}

// ── Component ──────────────────────────────────────────────────

export default function IntakeConfirmPage() {
  const router = useRouter();

  const [data, setData] = useState<ConfirmData | null>(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editedFields, setEditedFields] = useState<Record<string, string>>({});
  const [userEditedFlags, setUserEditedFlags] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // ── Load data from sessionStorage ───────────────────────────

  useEffect(() => {
    // Feature flag: redirect to legacy intake if enabled
    if (process.env.NEXT_PUBLIC_USE_LEGACY_INTAKE === "true") {
      router.replace("/");
      return;
    }

    try {
      const raw = sessionStorage.getItem("pts.intake.extraction.v1");
      if (!raw) {
        router.replace("/intake");
        return;
      }
      const parsed = JSON.parse(raw) as ConfirmData;
      setData(parsed);

      // Initialize editable values
      const edits: Record<string, string> = {};
      for (const [key, field] of Object.entries(parsed.extracted)) {
        const val = (field as { value: unknown }).value;
        edits[key] =
          val === null || val === undefined
            ? ""
            : typeof val === "boolean"
              ? String(val)
              : String(val);
      }
      setEditedFields(edits);
    } catch {
      router.replace("/intake");
    } finally {
      setLoading(false);
    }
  }, [router]);

  // ── Handler helpers ─────────────────────────────────────────

  const handleEditToggle = () => {
    setEditing((prev) => !prev);
  };

  const handleFieldEdit = (fieldName: string, newValue: string) => {
    setEditedFields((prev) => ({ ...prev, [fieldName]: newValue }));
    setUserEditedFlags((prev) => ({ ...prev, [fieldName]: true }));
  };

  const allRequiredHighConfidence = (d: ConfirmData): boolean => {
    for (const field of REQUIRED_FIELDS) {
      const entry = d.extracted[field];
      // If user edited the field, trust it (override confidence check)
      if (userEditedFlags[field]) continue;
      if (
        entry.value === null ||
        entry.value === undefined ||
        entry.value === ""
      ) {
        return false;
      }
      if (entry.confidence < CONFIDENCE_HIGH) return false;
    }
    return true;
  };

  const canStart =
    data !== null && (allRequiredHighConfidence(data) || editing);

  // ── Submit: save intake then trigger plan generation ────────

  const handleStartProgram = async () => {
    if (!data) return;
    setSubmitting(true);
    setError("");

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

    try {
      // Step 1: Save the extraction to the DB
      const saveRes = await fetch("/api/intake/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          extracted: data.extracted,
          mapped: data.mapped,
          segmentType: data.segmentType,
          rounds: data.rounds,
          overallConfidence: data.overallConfidence,
          summary: data.summary,
          rawText: data.freeText ?? "",
        }),
      });

      if (!saveRes.ok) {
        const body = await saveRes.json().catch(() => ({}));
        if ((body as { error?: string }).error === "unauthorized") {
          window.location.href = "/login/mobile?next=/intake/confirm";
          return;
        }
        throw new Error(
          (body as { error?: string }).error ?? "Could not save your intake. Please try again.",
        );
      }

      const saveData = (await saveRes.json()) as {
        ok: boolean;
        intakeSessionId: string;
        intakeResponseId: string;
        error?: string;
      };

      if (!saveData.ok || !saveData.intakeSessionId) {
        throw new Error("Save completed but no session ID returned.");
      }

      // Step 2: Trigger plan generation (creates pending_review plan)
      const planRes = await fetch("/api/intake/generate-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        signal: controller.signal,
        body: JSON.stringify({
          intakeSessionId: saveData.intakeSessionId,
        }),
      });

      if (!planRes.ok) {
        const body = await planRes.json().catch(() => ({}));
        throw new Error(
          (body as { error?: string }).error ?? "Could not start plan generation. Please try again.",
        );
      }

      // Clear storage
      sessionStorage.removeItem("pts.intake.extraction.v1");

      // Redirect to completion
      const hasRedFlags = Boolean(data.mapped.hasRedFlags);
      const dest = hasRedFlags ? "/red-flags" : "/intake/complete";
      window.location.href = dest;
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        setError("Submit timed out. Check your connection and try again.");
      } else {
        setError(
          err instanceof Error ? err.message : "Something went wrong. Please try again.",
        );
      }
    } finally {
      clearTimeout(timeout);
      setSubmitting(false);
    }
  };

  // ── Loading / no data ────────────────────────────────────────

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: t.page,
          color: t.text,
        }}
      >
        <p style={{ color: t.textMuted, fontSize: 15 }}>Loading&hellip;</p>
      </div>
    );
  }

  if (!data) return null; // Will redirect via useEffect

  const extractionUsable = data.extractionUsable !== false;
  const displaySummary =
    data.clientSummary?.trim() ||
    data.summary.replace(/\b[Tt]he client(?:'s)?\b/g, "You");

  if (!extractionUsable) {
    return (
      <div
        style={{ minHeight: "100vh", background: t.page, color: t.text, paddingBottom: 80 }}
      >
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "clamp(24px, 6vw, 36px) max(16px, 5vw)",
          }}
        >
          <h2
            style={{
              fontSize: "clamp(18px, 5vw, 24px)",
              fontWeight: 700,
              margin: "0 0 16px",
              lineHeight: 1.3,
              color: t.text,
            }}
          >
            Please try again
          </h2>
          <p
            style={{
              fontSize: "clamp(15px, 2.5vw, 17px)",
              color: t.textSecondary,
              lineHeight: 1.6,
              margin: "0 0 24px",
            }}
          >
            {displaySummary}
          </p>
          <a
            href="/intake"
            style={{
              display: "inline-block",
              padding: "14px 36px",
              borderRadius: 999,
              background: t.text,
              color: "#fff",
              fontWeight: 700,
              fontSize: "clamp(14px, 2.5vw, 16px)",
              textDecoration: "none",
            }}
          >
            Rewrite my answer
          </a>
        </div>
      </div>
    );
  }

  // ── Build field rows ─────────────────────────────────────────

  const fieldRows = Object.entries(data.extracted).map(([key, field]) => {
    const isRequired = (REQUIRED_FIELDS as readonly string[]).includes(key);
    const userEdited = userEditedFlags[key] ?? false;
    const confidence = field.confidence;
    const rawValue = field.value;
    const displayValue = userEdited
      ? editedFields[key] ?? ""
      : formatFieldValue(rawValue, key);
    const isMissing =
      rawValue === null || rawValue === undefined || rawValue === "";

    return {
      key,
      label: fieldLabel(key),
      isRequired,
      isMissing,
      confidence,
      userEdited,
      displayValue,
      rawValue,
    };
  });

  // Separate into required, optional-available, and missing
  const requiredRows = fieldRows.filter((r) => r.isRequired);
  const optionalSolid = fieldRows.filter(
    (r) => !r.isRequired && !r.isMissing,
  );
  const missingNonBlocking = fieldRows.filter(
    (r) => !r.isRequired && r.isMissing,
  );

  const allRequiredMet = allRequiredHighConfidence(data);

  return (
    <div
      style={{ minHeight: "100vh", background: t.page, color: t.text, paddingBottom: 80 }}
    >
      {/* Header */}
      <div
        style={{
          position: "sticky",
          top: 0,
          zIndex: 50,
          background: t.surface,
          borderBottom: `1px solid ${t.borderLight}`,
          padding: "0 max(16px, 5vw)",
        }}
      >
        <div
          style={{
            maxWidth: 720,
            margin: "0 auto",
            paddingTop: 16,
            paddingBottom: 12,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <span
            style={{
              fontWeight: 800,
              fontSize: "clamp(16px, 3vw, 18px)",
              letterSpacing: "-0.5px",
              color: t.text,
            }}
          >
            PTS
          </span>
          <span
            style={{
              fontSize: "clamp(13px, 2vw, 14px)",
              color: t.textMuted,
              fontWeight: 500,
            }}
          >
            {data.overallConfidence >= CONFIDENCE_HIGH
              ? "Data confidence high"
              : `Confidence: ${(data.overallConfidence * 100).toFixed(0)}%`}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "clamp(24px, 6vw, 36px) max(16px, 5vw)",
        }}
      >
        <h2
          style={{
            fontSize: "clamp(18px, 5vw, 24px)",
            fontWeight: 700,
            margin: "0 0 8px",
            lineHeight: 1.3,
            color: t.text,
          }}
        >
          📋 Here&rsquo;s what we understood:
        </h2>

        {/* Summary text */}
        {displaySummary && (
          <p
            style={{
              fontSize: "clamp(15px, 2.5vw, 17px)",
              color: t.textSecondary,
              lineHeight: 1.6,
              margin: "0 0 24px",
              padding: "16px 18px",
              background: t.surface,
              borderRadius: 14,
              border: `1px solid ${t.borderLight}`,
              fontStyle: "italic",
            }}
          >
            {displaySummary}
          </p>
        )}

        {/* Field list — not a form, until edit mode */}
        <div style={{ marginBottom: 24 }}>
          {/* Required fields */}
          <div
            style={{
              display: "grid",
              gap: 12,
              marginBottom: 20,
            }}
          >
            {requiredRows.map((row) => (
              <div
                key={row.key}
                style={{
                  padding: "12px 16px",
                  borderRadius: 12,
                  background: row.isMissing
                    ? "#fff8e1"
                    : row.confidence < CONFIDENCE_HIGH && !row.userEdited
                      ? "#fff8e1"
                      : t.surface,
                  border: `1px solid ${row.isMissing || (row.confidence < CONFIDENCE_HIGH && !row.userEdited) ? "#ffe082" : t.borderLight}`,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: 4,
                  }}
                >
                  <span
                    style={{
                      fontSize: "clamp(12px, 1.5vw, 13px)",
                      color: t.textMuted,
                      fontWeight: 600,
                      textTransform: "uppercase",
                      letterSpacing: "0.03em",
                    }}
                  >
                    {row.label}
                    {row.isRequired ? " (required)" : ""}
                  </span>
                  <ConfidenceBadge
                    confidence={row.confidence}
                    isRequired={row.isRequired}
                  />
                </div>

                {editing ? (
                  <input
                    type="text"
                    value={editedFields[row.key] ?? ""}
                    onChange={(e) => handleFieldEdit(row.key, e.target.value)}
                    style={{
                      width: "100%",
                      padding: "8px 12px",
                      borderRadius: 8,
                      border: `1.5px solid ${t.borderLight}`,
                      fontSize: "clamp(14px, 2vw, 15px)",
                      fontFamily: "inherit",
                      boxSizing: "border-box",
                      background: row.userEdited
                        ? "#f0f9ff"
                        : t.surface,
                      color: t.text,
                      minHeight: "auto",
                    }}
                  />
                ) : (
                  <span
                    style={{
                      fontSize: "clamp(14px, 2.5vw, 15px)",
                      color: row.isMissing
                        ? t.textMuted
                        : t.text,
                      fontStyle: row.isMissing ? "italic" : "normal",
                      lineHeight: 1.4,
                    }}
                  >
                    {row.displayValue}
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Optional fields present */}
          {optionalSolid.length > 0 && (
            <div style={{ marginBottom: 16 }}>
              <p
                style={{
                  fontSize: "clamp(12px, 1.5vw, 13px)",
                  color: t.textMuted,
                  fontWeight: 600,
                  marginBottom: 8,
                }}
              >
                Also captured:
              </p>
              <div style={{ display: "grid", gap: 8 }}>
                {optionalSolid.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      padding: "8px 14px",
                      borderRadius: 10,
                      background: t.surfaceMuted,
                      border: `1px solid ${t.borderLight}`,
                    }}
                  >
                    <div>
                      <span
                        style={{
                          fontSize: "clamp(12px, 1.5vw, 13px)",
                          color: t.textMuted,
                          fontWeight: 500,
                        }}
                      >
                        {row.label}
                      </span>
                      <span
                        style={{
                          fontSize: "clamp(13px, 2vw, 14px)",
                          color: t.text,
                          marginLeft: 8,
                          fontWeight: 500,
                        }}
                      >
                        {row.displayValue}
                      </span>
                    </div>
                    <ConfidenceBadge
                      confidence={row.confidence}
                      isRequired={false}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Missing non-blocking */}
          {missingNonBlocking.length > 0 && (
            <div
              style={{
                padding: "14px 16px",
                borderRadius: 12,
                background: "#fafaf8",
                border: `1px dashed ${t.borderLight}`,
                marginBottom: 20,
              }}
            >
              <p
                style={{
                  fontSize: "clamp(13px, 2vw, 14px)",
                  color: t.textMuted,
                  margin: "0 0 10px",
                  fontWeight: 500,
                }}
              >
                ❓ We&rsquo;re still not sure about:
              </p>
              <div style={{ display: "grid", gap: 6 }}>
                {missingNonBlocking.map((row) => (
                  <div
                    key={row.key}
                    style={{
                      fontSize: "clamp(13px, 2vw, 14px)",
                      color: t.textMuted,
                    }}
                  >
                    → {row.label} —
                    <span
                      onClick={() => {
                        if (!editing) setEditing(true);
                        // Focus the field by triggering edit
                      }}
                      style={{
                        color: t.textSecondary,
                        cursor: "pointer",
                        textDecoration: "underline",
                        textUnderlineOffset: "0.2em",
                        marginLeft: 4,
                        fontWeight: 500,
                      }}
                    >
                      tap to add
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status message */}
        {!allRequiredMet && !editing && (
          <div
            style={{
              padding: "12px 16px",
              borderRadius: 12,
              background: "#fff8e1",
              border: "1px solid #ffe082",
              marginBottom: 20,
              fontSize: "clamp(13px, 2vw, 14px)",
              color: "#8a5a18",
              lineHeight: 1.5,
            }}
          >
            Some fields need a bit more detail before your counselor can create
            your program. The amber sections above could use your input — or tap
            &ldquo;Let me edit something&rdquo; to fill them in directly.
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            style={{
              marginBottom: 16,
              color: t.danger,
              fontSize: "clamp(13px, 2vw, 14px)",
              background: t.dangerBg,
              padding: "10px 14px",
              borderRadius: 8,
            }}
          >
            {error}
          </div>
        )}

        {/* Actions */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 12,
          }}
        >
          <button
            onClick={handleStartProgram}
            disabled={!canStart || submitting}
            style={{
              padding: "14px 36px",
              borderRadius: 999,
              border: "none",
              background: canStart && !submitting ? t.text : "#bbb",
              color: "#fff",
              fontWeight: 700,
              fontSize: "clamp(14px, 2.5vw, 16px)",
              cursor: canStart && !submitting ? "pointer" : "not-allowed",
              minWidth: 220,
              opacity: canStart && !submitting ? 1 : 0.6,
            }}
          >
            {submitting
              ? "Submitting…"
              : editing
                ? "Save & start my program"
                : allRequiredMet
                  ? "✨ This looks right — start my program"
                  : "Add a bit more detail first"}
          </button>

          <button
            onClick={handleEditToggle}
            style={{
              padding: "10px 20px",
              borderRadius: 999,
              border: "none",
              background: "transparent",
              color: editing ? t.text : t.textMuted,
              fontWeight: 500,
              fontSize: "clamp(13px, 2vw, 14px)",
              cursor: "pointer",
              textDecoration: "underline",
              textUnderlineOffset: "0.2em",
              minHeight: "auto",
              boxShadow: "none",
            }}
          >
            {editing ? "Done editing" : "✏️ Let me edit something"}
          </button>

          {/* Back link */}
          <a
            href="/intake"
            style={{
              fontSize: "clamp(12px, 1.5vw, 13px)",
              color: t.textMuted,
              textDecoration: "underline",
              textUnderlineOffset: "0.2em",
              textDecorationThickness: "0.08em",
              marginTop: 8,
            }}
          >
            ← Go back and re-tell my story
          </a>
        </div>

        {/* Confidence footer */}
        <div
          style={{
            marginTop: 36,
            paddingTop: 20,
            borderTop: `1px solid ${t.borderLight}`,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            fontSize: "clamp(12px, 1.5vw, 13px)",
            color: t.textMuted,
          }}
        >
          <span>
            AI extracted · Round {data.rounds} of 3
          </span>
          <span>
            Confidence: {(data.overallConfidence * 100).toFixed(0)}%
          </span>
        </div>
      </div>
    </div>
  );
}