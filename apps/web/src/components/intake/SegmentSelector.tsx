"use client";

import { useState } from "react";
import { webTheme as t } from "@/lib/web-theme";

const SEGMENTS = [
  {
    segmentType: "pain",
    emoji: "🩹",
    title: "Pain",
    hint: "What hurts, how long, what&rsquo;s changed?",
  },
  {
    segmentType: "sleep",
    emoji: "😴",
    title: "Sleep",
    hint: "Trouble falling asleep, staying asleep, or waking up tired?",
  },
  {
    segmentType: "anxiety",
    emoji: "😰",
    title: "Anxiety / Stress",
    hint: "Racing thoughts, worry, tension, what&rsquo;s weighing on you?",
  },
  {
    segmentType: "injury_recovery",
    emoji: "🏃",
    title: "Recovery after injury",
    hint: "What happened, what you&rsquo;re working to get back to?",
  },
  {
    segmentType: "other",
    emoji: "🔄",
    title: "Something else",
    hint: "Tell us in your own words — no wrong answer",
  },
] as const;

export type SegmentType = (typeof SEGMENTS)[number]["segmentType"];

type Props = {
  onSelect: (segmentType: SegmentType | null) => void;
};

export function SegmentSelector({ onSelect }: Props) {
  const [selected, setSelected] = useState<SegmentType | null>(null);

  const handleContinue = () => {
    if (selected) onSelect(selected);
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.preventDefault();
    onSelect(null);
  };

  return (
    <div style={{ minHeight: "100vh", background: t.page, color: t.text }}>
      <div
        style={{
          maxWidth: 720,
          margin: "0 auto",
          padding: "clamp(40px, 10vw, 72px) max(16px, 5vw) clamp(48px, 12vw, 80px)",
        }}
      >
        {/* Header */}
        <div style={{ marginBottom: "clamp(28px, 6vw, 40px)", textAlign: "center" }}>
          <h1
            style={{
              fontSize: "clamp(22px, 6vw, 32px)",
              fontWeight: 700,
              margin: "0 0 8px",
              lineHeight: 1.2,
              color: t.text,
              letterSpacing: "-0.5px",
            }}
          >
            I&rsquo;m here for help with&hellip;
          </h1>
          <p
            style={{
              fontSize: "clamp(15px, 3vw, 17px)",
              color: t.textMuted,
              margin: 0,
              lineHeight: 1.5,
              fontWeight: 500,
            }}
          >
            Choose what feels right. Your counselor will understand.
          </p>
        </div>

        {/* Segment cards */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(min(200px, 100%), 1fr))",
            gap: 12,
            marginBottom: "clamp(28px, 6vw, 40px)",
          }}
        >
          {SEGMENTS.map((seg) => {
            const isSelected = selected === seg.segmentType;
            return (
              <button
                key={seg.segmentType}
                onClick={() => setSelected(seg.segmentType)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 8,
                  padding: "clamp(16px, 4vw, 24px) clamp(12px, 3vw, 16px)",
                  borderRadius: 16,
                  border: isSelected
                    ? `2px solid ${t.text}`
                    : `1.5px solid ${t.borderLight}`,
                  background: isSelected ? t.surfaceMuted : t.surface,
                  color: t.text,
                  cursor: "pointer",
                  textAlign: "center",
                  minHeight: "auto",
                  fontWeight: 400,
                  boxShadow: isSelected
                    ? "0 4px 16px rgba(17, 17, 17, 0.08)"
                    : "0 1px 0 rgba(0, 0, 0, 0.04)",
                  transition: "all 0.15s ease",
                  position: "relative",
                  width: "100%",
                }}
              >
                {isSelected && (
                  <div
                    style={{
                      position: "absolute",
                      top: 8,
                      right: 8,
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      background: t.text,
                      color: "#fff",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    ✓
                  </div>
                )}
                <span style={{ fontSize: "clamp(28px, 5vw, 36px)", lineHeight: 1 }}>
                  {seg.emoji}
                </span>
                <span
                  style={{
                    fontSize: "clamp(14px, 2.5vw, 16px)",
                    fontWeight: isSelected ? 700 : 600,
                  }}
                >
                  {seg.title}
                </span>
                <span
                  style={{
                    fontSize: "clamp(12px, 2vw, 13px)",
                    color: t.textMuted,
                    lineHeight: 1.4,
                  }}
                >
                  {seg.hint}
                </span>
              </button>
            );
          })}
        </div>

        {/* Continue button */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
          }}
        >
          <button
            onClick={handleContinue}
            disabled={!selected}
            style={{
              padding: "14px 36px",
              borderRadius: 999,
              border: "none",
              background: selected ? t.text : "#bbb",
              color: "#fff",
              fontWeight: 700,
              fontSize: "clamp(14px, 2.5vw, 16px)",
              cursor: selected ? "pointer" : "not-allowed",
              minWidth: 180,
              opacity: selected ? 1 : 0.6,
            }}
          >
            Continue →
          </button>

          {/* Skip link */}
          <a
            href="#"
            onClick={handleSkip}
            style={{
              fontSize: "clamp(13px, 2vw, 14px)",
              color: t.textMuted,
              textDecoration: "underline",
              textUnderlineOffset: "0.2em",
              textDecorationThickness: "0.08em",
              cursor: "pointer",
              fontWeight: 500,
            }}
          >
            Skip — just let me type
          </a>
        </div>

        {/* Subtle footer */}
        <p
          style={{
            textAlign: "center",
            marginTop: "clamp(32px, 8vw, 48px)",
            fontSize: "clamp(11px, 1.5vw, 12px)",
            color: t.border,
          }}
        >
          Your answers are confidential. A counselor reviews them before your
          program starts.
        </p>
      </div>
    </div>
  );
}