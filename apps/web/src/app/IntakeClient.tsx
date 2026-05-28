"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// ── Types ────────────────────────────────────────────────────────────────────

type IntakeData = {
  // Step 1
  painSource: string;
  painSourceOther: string;
  painDescription: string;
  painDuration: string;
  // Step 2
  activitiesAffected: string[];
  biggestChange: string;
  // Step 3
  recoveryGoal: string;
  recoveryTimeline: string;
  // Step 4
  currentTreatment: string;
  socialSupport: string;
  // Step 5
  structurePreference: string;
  engagementTime: string;
  // Step 6
  hasRedFlags: boolean;
  isSafe: boolean;
  consentGiven: boolean;
};

const STORAGE_KEY = "pts.intake.draft.v1";

const empty: IntakeData = {
  painSource: "", painSourceOther: "", painDescription: "", painDuration: "",
  activitiesAffected: [], biggestChange: "",
  recoveryGoal: "", recoveryTimeline: "",
  currentTreatment: "", socialSupport: "",
  structurePreference: "", engagementTime: "",
  hasRedFlags: false, isSafe: true, consentGiven: false,
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function Radio({ name, value, checked, onChange, label }: { name: string; value: string; checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${checked ? "#111" : "#e0e0e0"}`, background: checked ? "#f5f5f5" : "white", transition: "all 0.15s" }}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ accentColor: "#111" }} />
      <span style={{ fontSize: 15 }}>{label}</span>
    </label>
  );
}

function Checkbox({ checked, onChange, label }: { checked: boolean; onChange: () => void; label: string }) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 14px", borderRadius: 10, border: `1.5px solid ${checked ? "#111" : "#e0e0e0"}`, background: checked ? "#f5f5f5" : "white", transition: "all 0.15s" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: "#111", width: 16, height: 16 }} />
      <span style={{ fontSize: 15 }}>{label}</span>
    </label>
  );
}

// ── Step components ───────────────────────────────────────────────────────────

function Step1({ data, set }: { data: IntakeData; set: (d: Partial<IntakeData>) => void }) {
  const sources = [
    { value: "workplace", label: "Workplace injury or incident" },
    { value: "accident", label: "Road accident or trauma" },
    { value: "sports", label: "Sports or physical activity" },
    { value: "general", label: "Health condition or gradual onset" },
    { value: "other", label: "Something else" },
  ];
  const durations = [
    { value: "under1m", label: "Less than a month" },
    { value: "1to3m", label: "1 – 3 months" },
    { value: "3to6m", label: "3 – 6 months" },
    { value: "6to12m", label: "6 months to a year" },
    { value: "over1y", label: "More than a year" },
  ];
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <p style={labelStyle}>What brought you here?</p>
        <p style={hintStyle}>Choose the one that fits best.</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {sources.map(s => (
            <Radio key={s.value} name="painSource" value={s.value} checked={data.painSource === s.value} onChange={() => set({ painSource: s.value })} label={s.label} />
          ))}
        </div>
        {data.painSource === "other" && (
          <input value={data.painSourceOther} onChange={e => set({ painSourceOther: e.target.value })} placeholder="Tell us briefly" style={{ ...inputStyle, marginTop: 10 }} />
        )}
      </div>

      <div>
        <label style={labelStyle} htmlFor="painDesc">Tell us what happened or what you're dealing with.</label>
        <p style={hintStyle}>A few sentences is plenty — just enough for your counselor to understand your situation.</p>
        <textarea id="painDesc" value={data.painDescription} onChange={e => set({ painDescription: e.target.value })} rows={4} placeholder="e.g. I was in a car accident 3 months ago and have had lower back and neck pain since. I've been to physio but the emotional side has been really hard." style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div>
        <p style={labelStyle}>How long has this been affecting you?</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {durations.map(d => (
            <Radio key={d.value} name="painDuration" value={d.value} checked={data.painDuration === d.value} onChange={() => set({ painDuration: d.value })} label={d.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, set }: { data: IntakeData; set: (d: Partial<IntakeData>) => void }) {
  const activities = [
    { value: "work", label: "Work or study" },
    { value: "sport", label: "Sport or physical activity" },
    { value: "social", label: "Social life and relationships" },
    { value: "family", label: "Caring for family" },
    { value: "sleep", label: "Sleep" },
    { value: "independence", label: "Getting around independently" },
    { value: "hobbies", label: "Hobbies and interests" },
  ];
  const toggle = (v: string) => {
    const cur = data.activitiesAffected;
    set({ activitiesAffected: cur.includes(v) ? cur.filter(x => x !== v) : [...cur, v] });
  };
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <p style={labelStyle}>What has this stopped you from doing?</p>
        <p style={hintStyle}>Select everything that applies.</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {activities.map(a => (
            <Checkbox key={a.value} checked={data.activitiesAffected.includes(a.value)} onChange={() => toggle(a.value)} label={a.label} />
          ))}
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="biggestChange">What's the biggest thing that's changed for you since this happened?</label>
        <p style={hintStyle}>There's no wrong answer — we want to understand what matters most to you.</p>
        <textarea id="biggestChange" value={data.biggestChange} onChange={e => set({ biggestChange: e.target.value })} rows={4} placeholder="e.g. I used to run every morning. I haven't been able to since the accident and it's affecting my mood and energy more than anything." style={{ ...inputStyle, resize: "vertical" }} />
      </div>
    </div>
  );
}

function Step3({ data, set }: { data: IntakeData; set: (d: Partial<IntakeData>) => void }) {
  const timelines = [
    { value: "weeks", label: "A few weeks" },
    { value: "months3", label: "A few months" },
    { value: "months6", label: "Around 6 months" },
    { value: "year", label: "About a year" },
    { value: "ongoing", label: "I'm not sure — it might be ongoing" },
  ];
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <label style={labelStyle} htmlFor="recoveryGoal">What does getting back to living look like for you?</label>
        <p style={hintStyle}>Think about what you'd be doing, feeling, or able to do again. Be as specific as you like.</p>
        <textarea id="recoveryGoal" value={data.recoveryGoal} onChange={e => set({ recoveryGoal: e.target.value })} rows={4} placeholder="e.g. I want to be able to play with my kids without pain, sleep through the night, and stop feeling anxious every time I get in a car." style={{ ...inputStyle, resize: "vertical" }} />
      </div>

      <div>
        <p style={labelStyle}>How long do you think this journey might take?</p>
        <p style={hintStyle}>There's no right answer — we ask so your counselor can calibrate the program realistically.</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {timelines.map(t => (
            <Radio key={t.value} name="recoveryTimeline" value={t.value} checked={data.recoveryTimeline === t.value} onChange={() => set({ recoveryTimeline: t.value })} label={t.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step4({ data, set }: { data: IntakeData; set: (d: Partial<IntakeData>) => void }) {
  const support = [
    { value: "yes", label: "Yes — people around me understand what I'm going through" },
    { value: "somewhat", label: "Somewhat — some people get it, some don't" },
    { value: "no", label: "Not really — I feel quite alone with this" },
  ];
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <label style={labelStyle} htmlFor="currentTreatment">Are you currently seeing anyone for this? (physio, doctor, specialist, etc.)</label>
        <p style={hintStyle}>Optional — helps your counselor understand the full picture.</p>
        <input id="currentTreatment" value={data.currentTreatment} onChange={e => set({ currentTreatment: e.target.value })} placeholder="e.g. Seeing a physio weekly, waiting for orthopaedic referral" style={inputStyle} />
      </div>

      <div>
        <p style={labelStyle}>How much support do you have from people around you?</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {support.map(s => (
            <Radio key={s.value} name="socialSupport" value={s.value} checked={data.socialSupport === s.value} onChange={() => set({ socialSupport: s.value })} label={s.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, set }: { data: IntakeData; set: (d: Partial<IntakeData>) => void }) {
  const structures = [
    { value: "structured", label: "Very structured — I like clear daily tasks and a plan to follow" },
    { value: "mix", label: "A mix — some structure with room to adjust" },
    { value: "flexible", label: "Flexible — I'd rather have guidance than a strict schedule" },
  ];
  const times = [
    { value: "morning", label: "Morning (before 10am)" },
    { value: "midday", label: "Midday (10am – 2pm)" },
    { value: "evening", label: "Evening (after 5pm)" },
    { value: "varies", label: "It varies — I'll engage when I can" },
  ];
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div>
        <p style={labelStyle}>How much structure do you want in your program?</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {structures.map(s => (
            <Radio key={s.value} name="structurePreference" value={s.value} checked={data.structurePreference === s.value} onChange={() => set({ structurePreference: s.value })} label={s.label} />
          ))}
        </div>
      </div>

      <div>
        <p style={labelStyle}>When are you most likely to engage with the program?</p>
        <p style={hintStyle}>We'll try to send check-ins and practices at the time that works best for you.</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          {times.map(t => (
            <Radio key={t.value} name="engagementTime" value={t.value} checked={data.engagementTime === t.value} onChange={() => set({ engagementTime: t.value })} label={t.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step6({ data, set }: { data: IntakeData; set: (d: Partial<IntakeData>) => void }) {
  const redFlagList = [
    "Severe or sudden new weakness in your arms or legs",
    "Loss of bladder or bowel control",
    "Fever alongside severe pain",
    "Pain that followed a major trauma or accident in the last 48 hours",
    "Numbness in your inner thighs or around the groin",
    "Unexplained significant weight loss",
  ];
  return (
    <div style={{ display: "grid", gap: 28 }}>
      <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 12, padding: 16 }}>
        <p style={{ margin: 0, fontWeight: 600, marginBottom: 8 }}>A quick safety check</p>
        <p style={{ margin: 0, fontSize: 14, color: "#555", marginBottom: 12 }}>
          If any of the following apply to you <strong>right now</strong>, please seek in-person medical care before continuing.
        </p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 6 }}>
          {redFlagList.map(f => <li key={f} style={{ fontSize: 14, color: "#333" }}>{f}</li>)}
        </ul>
        <p style={{ margin: "12px 0 0", fontSize: 14 }}>
          <a href="/red-flags" style={{ color: "#b00020" }}>Read more about red flags →</a>
        </p>
      </div>

      <Checkbox
        checked={data.hasRedFlags}
        onChange={() => set({ hasRedFlags: !data.hasRedFlags })}
        label="One or more of the above apply to me right now"
      />

      <div>
        <p style={labelStyle}>Are you safe right now?</p>
        <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
          <Radio name="isSafe" value="yes" checked={data.isSafe} onChange={() => set({ isSafe: true })} label="Yes, I'm safe" />
          <Radio name="isSafe" value="no" checked={!data.isSafe} onChange={() => set({ isSafe: false })} label="I need support right now" />
        </div>
        {!data.isSafe && (
          <div style={{ marginTop: 12, background: "#fce4ec", border: "1px solid #ef9a9a", borderRadius: 10, padding: 14 }}>
            <p style={{ margin: 0, fontWeight: 600, color: "#b71c1c" }}>You're not alone.</p>
            <p style={{ margin: "6px 0 0", fontSize: 14, color: "#333" }}>
              Please reach out to a crisis helpline now. In India: <strong>iCall — 9152987821</strong>. Globally: <a href="https://findahelpline.com" target="_blank" rel="noopener">findahelpline.com</a>
            </p>
          </div>
        )}
      </div>

      <div style={{ borderTop: "1px solid #eee", paddingTop: 20 }}>
        <Checkbox
          checked={data.consentGiven}
          onChange={() => set({ consentGiven: !data.consentGiven })}
          label="I understand this is a counseling support program, not medical advice or emergency care, and I consent to my responses being used to build my personalised program."
        />
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

const STEPS = [
  { title: "Your situation", subtitle: "Let's start with what happened." },
  { title: "The impact on your life", subtitle: "Understanding what's changed helps us build the right support." },
  { title: "What recovery means to you", subtitle: "Your goals shape everything we do." },
  { title: "Your current support", subtitle: "We want to work alongside what's already in place." },
  { title: "How you'd like to work", subtitle: "We'll tailor the program to fit your life." },
  { title: "A quick safety check", subtitle: "Before we finalise — a few important questions." },
];

export function IntakeClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Restore draft from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved) as IntakeData);
    } catch { /* ignore */ }
  }, []);

  const set = (partial: Partial<IntakeData>) => {
    const next = { ...data, ...partial };
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { /* ignore */ }
  };

  const canAdvance = () => {
    if (step === 0) return data.painSource && data.painDescription.trim().length > 10 && data.painDuration;
    if (step === 1) return data.activitiesAffected.length > 0 && data.biggestChange.trim().length > 10;
    if (step === 2) return data.recoveryGoal.trim().length > 10 && data.recoveryTimeline;
    if (step === 3) return data.socialSupport;
    if (step === 4) return data.structurePreference && data.engagementTime;
    if (step === 5) return data.consentGiven && data.isSafe;
    return true;
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/intake", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, activitiesAffected: JSON.stringify(data.activitiesAffected) }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({})) as { error?: string };
        if (body.error === "unauthorized") {
          router.push("/login?next=/");
          return;
        }
        throw new Error(body.error ?? "unknown");
      }
      localStorage.removeItem(STORAGE_KEY);
      if (data.hasRedFlags) {
        router.push("/red-flags");
      } else {
        router.push("/intake/complete");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong — please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const current = STEPS[step];
  const progress = ((step + 1) / STEPS.length) * 100;

  return (
    <div style={{ minHeight: "100vh", background: "#fafafa", padding: "0 0 80px" }}>
      {/* Header */}
      <div style={{ background: "white", borderBottom: "1px solid #eee", padding: "16px 24px", position: "sticky", top: 0, zIndex: 10 }}>
        <div style={{ maxWidth: 620, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <span style={{ fontWeight: 600, fontSize: 15 }}>PTS</span>
            <span style={{ fontSize: 13, color: "#888" }}>Step {step + 1} of {STEPS.length}</span>
          </div>
          <div style={{ height: 4, background: "#eee", borderRadius: 2 }}>
            <div style={{ height: 4, background: "#111", borderRadius: 2, width: `${progress}%`, transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 620, margin: "0 auto", padding: "36px 24px" }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 6px" }}>{current.title}</h1>
          <p style={{ margin: 0, color: "#666", fontSize: 15 }}>{current.subtitle}</p>
        </div>

        {step === 0 && <Step1 data={data} set={set} />}
        {step === 1 && <Step2 data={data} set={set} />}
        {step === 2 && <Step3 data={data} set={set} />}
        {step === 3 && <Step4 data={data} set={set} />}
        {step === 4 && <Step5 data={data} set={set} />}
        {step === 5 && <Step6 data={data} set={set} />}

        {error && (
          <p style={{ marginTop: 16, color: "#b00020", fontSize: 14, background: "#fce4ec", padding: "10px 14px", borderRadius: 8 }}>
            {error}
          </p>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 36, gap: 12 }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={secondaryBtnStyle}>
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={canAdvance() ? primaryBtnStyle : disabledBtnStyle}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canAdvance() || submitting} style={canAdvance() && !submitting ? primaryBtnStyle : disabledBtnStyle}>
              {submitting ? "Submitting…" : "Submit and get my plan →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const labelStyle: React.CSSProperties = { fontWeight: 600, fontSize: 16, margin: 0 };
const hintStyle: React.CSSProperties = { margin: "4px 0 0", fontSize: 13, color: "#666" };
const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: 15, fontFamily: "inherit", boxSizing: "border-box", marginTop: 8 };
const primaryBtnStyle: React.CSSProperties = { padding: "12px 28px", borderRadius: 999, border: "none", background: "#111", color: "white", fontWeight: 600, fontSize: 15, cursor: "pointer" };
const secondaryBtnStyle: React.CSSProperties = { padding: "12px 24px", borderRadius: 999, border: "1.5px solid #ddd", background: "white", color: "#333", fontWeight: 500, fontSize: 15, cursor: "pointer" };
const disabledBtnStyle: React.CSSProperties = { ...primaryBtnStyle, background: "#ccc", cursor: "not-allowed" };
