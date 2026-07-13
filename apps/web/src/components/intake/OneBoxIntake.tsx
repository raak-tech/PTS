"use client";

import { useCallback, useRef, useState } from "react";
import { webTheme as t } from "@/lib/web-theme";
import type { ExtractionResult } from "@/lib/intake-extractor";
import type { IntakeInsertShape } from "@/lib/intake-mappers";

// ── Types ──────────────────────────────────────────────────────

type SegmentType = string | null;

/** Shape returned by POST /api/intake/extract */
export type ExtractResponse = {
  ok: boolean;
  round: number;
  extracted: ExtractionResult["extracted"];
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  followUpQuestions: string[];
  summary: string;
  clientSummary?: string;
  extractionUsable?: boolean;
  overallConfidence: number;
  mapped: IntakeInsertShape;
  error?: string;
  detail?: string;
};

/** What the parent receives when extraction is complete (ready for confirm) */
export type ExtractionComplete = {
  extracted: ExtractResponse["extracted"];
  mapped: ExtractResponse["mapped"];
  requiredFieldsMet: boolean;
  missingRequired: string[];
  lowConfidenceRequired: string[];
  summary: string;
  clientSummary: string;
  extractionUsable: boolean;
  overallConfidence: number;
  rounds: number;
  freeText: string;
};

type Props = {
  segmentType: SegmentType;
  onExtractionComplete: (data: ExtractionComplete) => void;
};

// ── Ghosted example text per segment ───────────────────────────

const EXAMPLES: Record<string, string> = {
  pain:
    "For example: I\u2019ve had lower back pain for about 8 months. It started gradually and now I can\u2019t sit through a full meeting. I used to play with my kids every evening but now I can\u2019t. I just want to get back to being able to work a full day without standing every 20 minutes\u2026",
  sleep:
    "For example: I lie awake for hours most nights, my mind racing. Even when I do sleep, I wake up feeling like I haven\u2019t rested at all. It\u2019s been going on for about 6 months and it\u2019s affecting my concentration at work\u2026",
  anxiety:
    "For example: I feel this constant knot in my chest, especially before meetings. I worry about everything \u2014 work, family, health. Sometimes I can\u2019t catch my breath. I just want to feel calm again, even for a few moments\u2026",
  injury_recovery:
    "For example: I tore my ACL playing football 4 months ago. Surgery went well but I\u2019m still limping and scared to push myself. I miss being active. I want to get back on the field but I\u2019m worried I\u2019ll never be the same\u2026",
  other:
    "For example: I\u2019m not sure exactly how to describe what I\u2019m going through. Things have felt off for a while \u2014 maybe 6 months. I\u2019m not sleeping well, I\u2019m irritable, and I don\u2019t enjoy things I used to love. I just know I want to feel better\u2026",
};

const DEFAULT_EXAMPLE =
  "For example: I\u2019ve been struggling with this for a while now. It started gradually and I didn\u2019t think much of it at first, but now it\u2019s affecting my daily life. I want to get back to feeling like myself again\u2026";

// ── Character counter helper ───────────────────────────────────

function charNudge(len: number): { text: string; color: string } | null {
  if (len < 30) return null;
  if (len < 100) return { text: `${len} characters`, color: t.textMuted };
  if (len < 250)
    return { text: `${len} characters \u2014 Good start`, color: "#2d6a4f" };
  if (len < 400)
    return {
      text: `${len} characters \u2014 This helps, keep going`,
      color: "#2d6a4f",
    };
  return { text: `${len} characters`, color: t.border };
}

// ── Component ──────────────────────────────────────────────────

export function OneBoxIntake({ segmentType, onExtractionComplete }: Props) {
  const [freeText, setFreeText] = useState("");
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState("");
  const [round, setRound] = useState(1);

  // Follow-up state
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [priorExtraction, setPriorExtraction] = useState<string>("");
  const [showFollowUp, setShowFollowUp] = useState(false);

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const example =
    EXAMPLES[segmentType ?? ""] ?? DEFAULT_EXAMPLE;

  // ── Submit extraction ──────────────────────────────────────

  const submitExtraction = useCallback(
    async (
      text: string,
      r: number,
      prior: string,
      answers?: string[],
    ) => {
      setIsExtracting(true);
      setError("");

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 90_000);

      try {
        // Build the text to send: for follow-up rounds, combine prior text with answers
        let combinedText = text;
        if (answers && answers.length > 0) {
          const followUpText = answers
            .map((a, i) =>
              followUpQuestions[i]
                ? `Q: ${followUpQuestions[i]}\nA: ${a}`
                : `A: ${a}`,
            )
            .join("\n\n");
          combinedText = `${text}\n\n--- Follow-up answers ---\n${followUpText}`;
        }

        const res = await fetch("/api/intake/extract", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          signal: controller.signal,
          body: JSON.stringify({
            segmentType: segmentType ?? "other",
            freeText: combinedText,
            round: r,
            priorExtraction: prior || undefined,
          }),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          if ((body as { error?: string }).error === "unauthorized") {
            window.location.href = "/login/mobile?next=/intake";
            return;
          }
          throw new Error(
            typeof (body as { detail?: unknown }).detail === "string"
              ? (body as { detail: string }).detail
              : (body as { error?: string }).error ??
                  "Something went wrong extracting your intake. Please try again.",
          );
        }

        const data = (await res.json()) as ExtractResponse;

        if (!data.ok) {
          throw new Error(data.detail ?? "Extraction failed. Please try again.");
        }

        if (data.extractionUsable === false) {
          throw new Error(
            data.clientSummary ??
              "We could not understand that. Please describe your situation in plain sentences.",
          );
        }

        // If follow-up needed and rounds remain, show follow-up questions
        if (!data.requiredFieldsMet && r < 3 && data.followUpQuestions.length > 0) {
          setPriorExtraction(JSON.stringify(data.extracted));
          setFollowUpQuestions(data.followUpQuestions);
          setFollowUpAnswers(new Array(data.followUpQuestions.length).fill(""));
          setShowFollowUp(true);
          setRound(r + 1);
          return;
        }

        // Extraction complete — proceed to confirmation
        onExtractionComplete({
          extracted: data.extracted,
          mapped: data.mapped,
          requiredFieldsMet: data.requiredFieldsMet,
          missingRequired: data.missingRequired,
          lowConfidenceRequired: data.lowConfidenceRequired,
          summary: data.summary,
          clientSummary:
            data.clientSummary ??
            data.summary.replace(/\b[Tt]he client(?:'s)?\b/g, "You"),
          extractionUsable: data.extractionUsable ?? true,
          overallConfidence: data.overallConfidence,
          rounds: r,
          freeText,
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") {
          setError("The request timed out. Please try again.");
        } else {
          setError(
            err instanceof Error
              ? err.message
              : "Something went wrong. Please try again.",
          );
        }
      } finally {
        clearTimeout(timeout);
        setIsExtracting(false);
      }
    },
    [segmentType, followUpQuestions, onExtractionComplete],
  );

  // ── Handle mic input ────────────────────────────────────────

  const handleMic = useCallback(() => {
    // Check for Web Speech API support
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition ??
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      // Fallback: show a hint that device dictation isn't available
      setError(
        "Voice input isn\u2019t available on this device. You can type instead \u2014 it works just as well.",
      );
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new SpeechRecognitionCtor() as any;
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: { results: { transcript: string }[][] }) => {
      const transcript = event.results[0][0].transcript;
      setFreeText((prev) => {
        const newText = prev ? `${prev} ${transcript}` : transcript;
        return newText;
      });
    };

    recognition.onerror = () => {
      setError(
        "Voice input didn\u2019t work. You can type instead \u2014 it works just as well.",
      );
    };

    recognition.start();
  }, []);

  // ── Follow-up submit ────────────────────────────────────────

  const handleFollowUpSubmit = () => {
    const answers = followUpAnswers.filter((a) => a.trim().length > 0);
    if (answers.length === 0) {
      // All skipped — proceed to confirmation with current data
      handleSkipFollowUp();
      return;
    }
    submitExtraction(freeText, round, priorExtraction, followUpAnswers);
  };

  const handleSkipFollowUp = () => {
    // Proceed to confirmation regardless — counselor will see flags
    // We need to re-fetch to get the final state? No — we already have the data.
    // The last extraction result is what we have. We just need to pass it through.
    // But we stored it via setPriorExtraction... Let me rethink.
    // Actually, we need to signal completion. The easiest way: do one more extraction
    // with the current data but at round=3 (force-through).
    // OR: we can just tell the parent to proceed with what we have.
    // The simplest: call submitExtraction with the same text but round=3
    submitExtraction(freeText, 3, priorExtraction, followUpAnswers);
  };

  const charLen = freeText.length;
  const nudge = charNudge(charLen);
  const canSubmit = charLen >= 30 && !isExtracting;

  // ── Follow-up screen ─────────────────────────────────────────

  if (showFollowUp) {
    return (
      <div style={{ minHeight: "100vh", background: t.page, color: t.text }}>
        <div
          style={{
            maxWidth: 640,
            margin: "0 auto",
            padding: "clamp(32px, 10vw, 56px) max(16px, 5vw) clamp(40px, 12vw, 64px)",
          }}
        >
          <div style={{ marginBottom: "clamp(24px, 6vw, 32px)" }}>
            <h2
              style={{
                fontSize: "clamp(18px, 5vw, 24px)",
                fontWeight: 700,
                margin: "0 0 8px",
                lineHeight: 1.3,
                color: t.text,
              }}
            >
              Thanks — that&rsquo;s really helpful.
            </h2>
            <p
              style={{
                fontSize: "clamp(14px, 2.5vw, 16px)",
                color: t.textMuted,
                margin: 0,
                lineHeight: 1.5,
              }}
            >
              Just a couple more things so your counselor can create the right
              program for you:
            </p>
          </div>

          {followUpQuestions.map((question, i) => (
            <div key={i} style={{ marginBottom: 20 }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 600,
                  fontSize: "clamp(14px, 2.5vw, 15px)",
                  marginBottom: 8,
                  color: t.text,
                }}
              >
                💬 {question}
              </label>
              <textarea
                value={followUpAnswers[i]}
                onChange={(e) => {
                  const next = [...followUpAnswers];
                  next[i] = e.target.value;
                  setFollowUpAnswers(next);
                }}
                rows={3}
                placeholder="Type your answer here\u2026"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: `1.5px solid ${t.borderLight}`,
                  fontSize: "clamp(14px, 2.5vw, 16px)",
                  fontFamily: "inherit",
                  boxSizing: "border-box",
                  resize: "vertical",
                  minHeight: 80,
                  background: t.surface,
                  color: t.text,
                }}
              />
            </div>
          ))}

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

          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
              marginTop: 28,
            }}
          >
            <button
              onClick={handleFollowUpSubmit}
              disabled={isExtracting}
              style={{
                padding: "14px 36px",
                borderRadius: 999,
                border: "none",
                background: t.text,
                color: "#fff",
                fontWeight: 700,
                fontSize: "clamp(14px, 2.5vw, 16px)",
                cursor: isExtracting ? "not-allowed" : "pointer",
                minWidth: 180,
                opacity: isExtracting ? 0.6 : 1,
              }}
            >
              {isExtracting ? "Processing\u2026" : "Submit"}
            </button>

            <button
              onClick={handleSkipFollowUp}
              disabled={isExtracting}
              style={{
                padding: "10px 20px",
                borderRadius: 999,
                border: "none",
                background: "transparent",
                color: t.textMuted,
                fontWeight: 500,
                fontSize: "clamp(13px, 2vw, 14px)",
                cursor: isExtracting ? "not-allowed" : "pointer",
                textDecoration: "underline",
                textUnderlineOffset: "0.2em",
                minHeight: "auto",
                boxShadow: "none",
              }}
            >
              Skip for now — let counselor ask
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── Main one-box screen ──────────────────────────────────────

  return (
    <div style={{ minHeight: "100vh", background: t.page, color: t.text }}>
      <div
        style={{
          maxWidth: 640,
          margin: "0 auto",
          padding: "clamp(32px, 10vw, 56px) max(16px, 5vw) clamp(40px, 12vw, 64px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "clamp(20px, 5vw, 28px)" }}>
          <h2
            style={{
              fontSize: "clamp(18px, 5vw, 24px)",
              fontWeight: 700,
              margin: "0 0 8px",
              lineHeight: 1.3,
              color: t.text,
            }}
          >
            Tell us what&rsquo;s going on.
          </h2>
          <p
            style={{
              fontSize: "clamp(14px, 2.5vw, 16px)",
              color: t.textMuted,
              margin: 0,
              lineHeight: 1.5,
            }}
          >
            Write freely — don&rsquo;t worry about structure. Just tell us what
            you&rsquo;re experiencing.
          </p>
        </div>

        {/* Textarea with ghosted example */}
        <div style={{ position: "relative", marginBottom: 12 }}>
          <textarea
            ref={textareaRef}
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={6}
            placeholder=""
            style={{
              width: "100%",
              padding: "16px 18px",
              borderRadius: 14,
              border: `1.5px solid ${t.borderLight}`,
              fontSize: "clamp(15px, 2.5vw, 17px)",
              fontFamily: "inherit",
              lineHeight: 1.65,
              boxSizing: "border-box",
              resize: "vertical",
              minHeight: 160,
              background: t.surface,
              color: t.text,
              transition: "border-color 0.15s ease",
            }}
            onFocus={(e) => {
              e.currentTarget.style.borderColor = t.text;
            }}
            onBlur={(e) => {
              e.currentTarget.style.borderColor = t.borderLight;
            }}
          />
          {/* Ghosted example overlay */}
          {freeText.length === 0 && (
            <div
              aria-hidden="true"
              style={{
                position: "absolute",
                top: 16,
                left: 18,
                right: 18,
                fontSize: "clamp(15px, 2.5vw, 17px)",
                lineHeight: 1.65,
                color: t.border,
                pointerEvents: "none",
                userSelect: "none",
              }}
            >
              {example}
            </div>
          )}
        </div>

        {/* Character counter + nudge */}
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 20,
            fontSize: "clamp(12px, 1.5vw, 13px)",
          }}
        >
          <span
            style={{
              color: nudge?.color ?? t.border,
              fontWeight: nudge && charLen >= 100 ? 500 : 400,
              transition: "color 0.2s ease",
            }}
          >
            {nudge?.text ?? `${charLen} characters`}
          </span>
          <span style={{ color: t.border }}>
            {charLen < 30 ? "30 min" : ""}
          </span>
        </div>

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
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}
        >
          {/* Mic button */}
          <button
            onClick={handleMic}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "10px 18px",
              borderRadius: 999,
              border: `1.5px solid ${t.borderLight}`,
              background: t.surface,
              color: t.text,
              fontWeight: 500,
              fontSize: "clamp(13px, 2vw, 14px)",
              cursor: "pointer",
              minHeight: "auto",
              boxShadow: "none",
            }}
          >
            🎤 Voice
          </button>

          <button
            onClick={() => {
              if (canSubmit) submitExtraction(freeText, round, "");
            }}
            disabled={!canSubmit}
            style={{
              padding: "14px 36px",
              borderRadius: 999,
              border: "none",
              background: canSubmit ? t.text : "#bbb",
              color: "#fff",
              fontWeight: 700,
              fontSize: "clamp(14px, 2.5vw, 16px)",
              cursor: canSubmit ? "pointer" : "not-allowed",
              opacity: canSubmit ? 1 : 0.6,
            }}
          >
            {isExtracting ? "Processing\u2026" : "Continue →"}
          </button>
        </div>

        {/* Subtle note */}
        <p
          style={{
            marginTop: 24,
            fontSize: "clamp(11px, 1.5vw, 12px)",
            color: t.border,
            textAlign: "center",
          }}
        >
          Your words are confidential. A counselor reads this before building
          your program.
        </p>
      </div>
    </div>
  );
}