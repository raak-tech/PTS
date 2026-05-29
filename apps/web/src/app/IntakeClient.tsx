"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type IntakeData = {
  painSource: string;
  painSourceOther: string;
  painDescription: string;
  painDuration: string;
  ageRange: string;
  gender: string;
  occupation: string;
  affectsWork: string;
  hasDependents: string;
  priorTherapy: string;
  countryRegion: string;
  activitiesAffected: string[];
  biggestChange: string;
  recoveryGoal: string;
  recoveryTimeline: string;
  currentTreatment: string;
  socialSupport: string;
  structurePreference: string;
  engagementTime: string;
  hasRedFlags: boolean;
  isSafe: boolean;
  consentGiven: boolean;
};

const STORAGE_KEY = "pts.intake.draft.v3";
const empty: IntakeData = {
  painSource: "", painSourceOther: "", painDescription: "", painDuration: "",
  ageRange: "", gender: "", occupation: "", affectsWork: "", hasDependents: "", priorTherapy: "", countryRegion: "",
  activitiesAffected: [], biggestChange: "",
  recoveryGoal: "", recoveryTimeline: "",
  currentTreatment: "", socialSupport: "",
  structurePreference: "", engagementTime: "",
  hasRedFlags: false, isSafe: true, consentGiven: false,
};

const STEPS = [
  { title: "Your situation", subtitle: "Let's start with what happened." },
  { title: "A little about you", subtitle: "Your background helps us build the right support." },
  { title: "The impact on your life", subtitle: "Understanding what's changed." },
  { title: "What recovery means to you", subtitle: "Your goals shape everything." },
  { title: "Your current support", subtitle: "What's already in place." },
  { title: "How you'd like to work", subtitle: "We'll tailor the program to fit you." },
  { title: "A quick safety check", subtitle: "Before we finalise." },
];

function Radio({ name, value, checked, onChange, label }: any) {
  return (
    <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "10px 12px", borderRadius: 10, border: "1px solid #eee", fontSize: "clamp(13px, 2vw, 15px)", transition: "all 0.15s" }}>
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} style={{ accentColor: "#111", width: 16, height: 16, flexShrink: 0 }} />
      <span>{label}</span>
    </label>
  );
}

function Checkbox({ checked, onChange, label }: any) {
  return (
    <label style={{ display: "flex", alignItems: "flex-start", gap: 10, cursor: "pointer", padding: "8px 12px", borderRadius: 10, border: "1px solid #eee", fontSize: "clamp(13px, 2vw, 15px)" }}>
      <input type="checkbox" checked={checked} onChange={onChange} style={{ accentColor: "#111", width: 16, height: 16, flexShrink: 0, marginTop: 2 }} />
      <span>{label}</span>
    </label>
  );
}

function Step1({ data, set }: any) {
  return (
    <div style={{ display: "grid", gap: 24 }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 8px" }}>What brought you here?</p>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 10 }}>Choose the one that fits best.</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "workplace", label: "Workplace injury or incident" }, { value: "accident", label: "Road accident or trauma" }, { value: "sports", label: "Sports or physical activity" }, { value: "general", label: "Health condition or gradual onset" }, { value: "other", label: "Something else" }].map(s => (
            <Radio key={s.value} name="painSource" value={s.value} checked={data.painSource === s.value} onChange={() => set({ painSource: s.value })} label={s.label} />
          ))}
        </div>
        {data.painSource === "other" && (
          <input value={data.painSourceOther} onChange={e => set({ painSourceOther: e.target.value })} placeholder="Tell us briefly" style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: "clamp(14px, 2vw, 16px)", fontFamily: "inherit", boxSizing: "border-box", marginTop: 8 }} />
        )}
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 8px", display: "block" }}>Tell us what happened or what you're dealing with.</label>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 8 }}>A few sentences is plenty.</p>
        <textarea value={data.painDescription} onChange={e => set({ painDescription: e.target.value })} rows={4} placeholder="e.g. I was in a car accident 3 months ago..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: "clamp(14px, 2vw, 16px)", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>How long has this been affecting you?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "under1m", label: "Less than a month" }, { value: "1to3m", label: "1 – 3 months" }, { value: "3to6m", label: "3 – 6 months" }, { value: "6to12m", label: "6 months to a year" }, { value: "over1y", label: "More than a year" }].map(d => (
            <Radio key={d.value} name="painDuration" value={d.value} checked={data.painDuration === d.value} onChange={() => set({ painDuration: d.value })} label={d.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step2({ data, set }: any) {
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: "clamp(14px, 2vw, 16px)", fontFamily: "inherit", boxSizing: "border-box", marginTop: 6 };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px" }}>Age range</p>
        <select value={data.ageRange} onChange={e => set({ ageRange: e.target.value })} style={inputStyle as any}>
          <option value="">Select…</option>
          <option value="under18">Under 18</option>
          <option value="18to25">18 – 25</option>
          <option value="26to35">26 – 35</option>
          <option value="36to50">36 – 50</option>
          <option value="51to65">51 – 65</option>
          <option value="over65">65+</option>
        </select>
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px" }}>Gender</p>
        <select value={data.gender} onChange={e => set({ gender: e.target.value })} style={inputStyle as any}>
          <option value="">Select…</option>
          <option value="male">Male</option>
          <option value="female">Female</option>
          <option value="nonbinary">Non-binary</option>
          <option value="other">Other / prefer not to say</option>
        </select>
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px", display: "block" }}>What do you do (occupation / main activity)?</label>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 6 }}>e.g. "Professional footballer", "Teacher", "Self-employed"</p>
        <input value={data.occupation} onChange={e => set({ occupation: e.target.value })} placeholder="Your occupation" style={inputStyle} />
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>Is this affecting your ability to work or earn?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "yes", label: "Yes — it's affecting my work or income" }, { value: "somewhat", label: "Somewhat — some impact" }, { value: "no", label: "No — not affecting my work" }].map(o => (
            <Radio key={o.value} name="affectsWork" value={o.value} checked={data.affectsWork === o.value} onChange={() => set({ affectsWork: o.value })} label={o.label} />
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>Do you have dependents (children, elderly relatives, etc.)?</p>
        <div style={{ display: "grid", gap: 8 }}>
          <Radio name="hasDependents" value="yes" checked={data.hasDependents === "yes"} onChange={() => set({ hasDependents: "yes" })} label="Yes" />
          <Radio name="hasDependents" value="no" checked={data.hasDependents === "no"} onChange={() => set({ hasDependents: "no" })} label="No" />
        </div>
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>Have you worked with a therapist or counselor before?</p>
        <div style={{ display: "grid", gap: 8 }}>
          <Radio name="priorTherapy" value="yes" checked={data.priorTherapy === "yes"} onChange={() => set({ priorTherapy: "yes" })} label="Yes" />
          <Radio name="priorTherapy" value="no" checked={data.priorTherapy === "no"} onChange={() => set({ priorTherapy: "no" })} label="No" />
        </div>
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px", display: "block" }}>Where are you based?</label>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 6 }}>Country or region — helps with time zones and context.</p>
        <input value={data.countryRegion} onChange={e => set({ countryRegion: e.target.value })} placeholder="e.g. India, Singapore, UK" style={inputStyle} />
      </div>
    </div>
  );
}

function Step3({ data, set }: any) {
  const toggle = (v: string) => {
    const cur = data.activitiesAffected;
    set({ activitiesAffected: cur.includes(v) ? cur.filter((x: string) => x !== v) : [...cur, v] });
  };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>What has this stopped you from doing?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "work", label: "Work or study" }, { value: "sport", label: "Sport or physical activity" }, { value: "social", label: "Social life and relationships" }, { value: "family", label: "Caring for family" }, { value: "sleep", label: "Sleep" }, { value: "independence", label: "Getting around independently" }, { value: "hobbies", label: "Hobbies and interests" }].map(a => (
            <Checkbox key={a.value} checked={data.activitiesAffected.includes(a.value)} onChange={() => toggle(a.value)} label={a.label} />
          ))}
        </div>
      </div>

      <div>
        <label style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px", display: "block" }}>What's the biggest thing that's changed?</label>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 8 }}>What matters most to you?</p>
        <textarea value={data.biggestChange} onChange={e => set({ biggestChange: e.target.value })} rows={4} placeholder="e.g. I used to run every morning..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: "clamp(14px, 2vw, 16px)", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
      </div>
    </div>
  );
}

function Step4({ data, set }: any) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <label style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px", display: "block" }}>What does getting back to living look like for you?</label>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 8 }}>Be as specific as you like.</p>
        <textarea value={data.recoveryGoal} onChange={e => set({ recoveryGoal: e.target.value })} rows={4} placeholder="e.g. I want to be able to play with my kids..." style={{ width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: "clamp(14px, 2vw, 16px)", fontFamily: "inherit", boxSizing: "border-box", resize: "vertical" }} />
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>How long do you think this journey might take?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "weeks", label: "A few weeks" }, { value: "months3", label: "A few months" }, { value: "months6", label: "Around 6 months" }, { value: "year", label: "About a year" }, { value: "ongoing", label: "I'm not sure — it might be ongoing" }].map(t => (
            <Radio key={t.value} name="recoveryTimeline" value={t.value} checked={data.recoveryTimeline === t.value} onChange={() => set({ recoveryTimeline: t.value })} label={t.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step5({ data, set }: any) {
  const inputStyle: React.CSSProperties = { width: "100%", padding: "10px 14px", borderRadius: 10, border: "1.5px solid #ddd", fontSize: "clamp(14px, 2vw, 16px)", fontFamily: "inherit", boxSizing: "border-box", marginTop: 6 };
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <label style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 6px", display: "block" }}>Are you currently seeing anyone for this?</label>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: 0, marginBottom: 8 }}>Optional — helps your counselor understand the full picture.</p>
        <input value={data.currentTreatment} onChange={e => set({ currentTreatment: e.target.value })} placeholder="e.g. Seeing a physio weekly" style={inputStyle} />
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>How much support do you have from people around you?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "yes", label: "Yes — people understand what I'm going through" }, { value: "somewhat", label: "Somewhat — some people get it, some don't" }, { value: "no", label: "Not really — I feel quite alone with this" }].map(s => (
            <Radio key={s.value} name="socialSupport" value={s.value} checked={data.socialSupport === s.value} onChange={() => set({ socialSupport: s.value })} label={s.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step6({ data, set }: any) {
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>How much structure do you want?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "structured", label: "Very structured — I like clear daily tasks" }, { value: "mix", label: "A mix — structure with room to adjust" }, { value: "flexible", label: "Flexible — guidance rather than strict schedule" }].map(s => (
            <Radio key={s.value} name="structurePreference" value={s.value} checked={data.structurePreference === s.value} onChange={() => set({ structurePreference: s.value })} label={s.label} />
          ))}
        </div>
      </div>

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>When are you most likely to engage?</p>
        <div style={{ display: "grid", gap: 8 }}>
          {[{ value: "morning", label: "Morning (before 10am)" }, { value: "midday", label: "Midday (10am – 2pm)" }, { value: "evening", label: "Evening (after 5pm)" }, { value: "varies", label: "It varies — I'll engage when I can" }].map(t => (
            <Radio key={t.value} name="engagementTime" value={t.value} checked={data.engagementTime === t.value} onChange={() => set({ engagementTime: t.value })} label={t.label} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Step7({ data, set }: any) {
  const redFlags = ["Severe or sudden new weakness in your arms or legs", "Loss of bladder or bowel control", "Fever alongside severe pain", "Pain that followed a major trauma in the last 48 hours", "Numbness in your inner thighs or around the groin", "Unexplained significant weight loss"];
  return (
    <div style={{ display: "grid", gap: 20 }}>
      <div style={{ background: "#fff8e1", border: "1px solid #ffe082", borderRadius: 10, padding: "12px 16px" }}>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 8px" }}>A quick safety check</p>
        <p style={{ fontSize: "clamp(12px, 2vw, 13px)", color: "#666", margin: "0 0 8px" }}>If any of these apply <strong>right now</strong>, please seek in-person medical care.</p>
        <ul style={{ margin: 0, paddingLeft: 20, display: "grid", gap: 4 }}>
          {redFlags.map(f => <li key={f} style={{ fontSize: "clamp(13px, 2vw, 14px)", color: "#333" }}>{f}</li>)}
        </ul>
      </div>

      <Checkbox checked={data.hasRedFlags} onChange={() => set({ hasRedFlags: !data.hasRedFlags })} label="One or more of the above apply to me right now" />

      <div>
        <p style={{ fontWeight: 600, fontSize: "clamp(14px, 3vw, 16px)", margin: "0 0 10px" }}>Are you safe right now?</p>
        <div style={{ display: "grid", gap: 8 }}>
          <Radio name="isSafe" value="yes" checked={data.isSafe} onChange={() => set({ isSafe: true })} label="Yes, I'm safe" />
          <Radio name="isSafe" value="no" checked={!data.isSafe} onChange={() => set({ isSafe: false })} label="I need support right now" />
        </div>
        {!data.isSafe && (
          <div style={{ background: "#fce4ec", border: "1px solid #ef9a9a", borderRadius: 10, padding: "12px 16px", marginTop: 12 }}>
            <p style={{ margin: "0 0 6px", fontWeight: 600, color: "#b71c1c", fontSize: "clamp(14px, 2vw, 16px)" }}>You're not alone.</p>
            <p style={{ margin: 0, fontSize: "clamp(12px, 2vw, 13px)", color: "#333" }}>Please reach out. In India: <strong>iCall — 9152987821</strong>. Globally: findahelpline.com</p>
          </div>
        )}
      </div>

      <Checkbox checked={data.consentGiven} onChange={() => set({ consentGiven: !data.consentGiven })} label="I understand this is a counseling support program, not medical advice or emergency care, and I consent to my responses being used to build my personalised program." />
    </div>
  );
}

export function IntakeClient() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [data, setData] = useState<IntakeData>(empty);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) setData(JSON.parse(saved) as IntakeData);
    } catch { }
  }, []);

  const set = (partial: Partial<IntakeData>) => {
    const next = { ...data, ...partial };
    setData(next);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(next)); } catch { }
  };

  const canAdvance = () => {
    switch (step) {
      case 0: return data.painSource && data.painDescription.trim().length > 10 && data.painDuration;
      case 1: return data.ageRange && data.gender && data.occupation.trim().length > 0;
      case 2: return data.activitiesAffected.length > 0 && data.biggestChange.trim().length > 10;
      case 3: return data.recoveryGoal.trim().length > 10 && data.recoveryTimeline;
      case 4: return data.socialSupport;
      case 5: return data.structurePreference && data.engagementTime;
      case 6: return data.consentGiven && data.isSafe;
      default: return true;
    }
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
        const body = await res.json().catch(() => ({})) as any;
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
    <div style={{ minHeight: "100vh", background: "#fafafa", paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ position: "sticky", top: 0, zIndex: 50, background: "white", borderBottom: "1px solid #eee", padding: "0 max(16px, 5vw)" }}>
        <div style={{ maxWidth: 720, margin: "0 auto", paddingTop: 16, paddingBottom: 12 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10, fontSize: "clamp(13px, 2vw, 15px)" }}>
            <span style={{ fontWeight: 800, fontSize: "clamp(16px, 3vw, 18px)", letterSpacing: "-0.5px" }}>PTS</span>
            <span style={{ color: "#888" }}>Step {step + 1} of {STEPS.length}</span>
          </div>
          <div style={{ height: 4, background: "#eee", borderRadius: 2 }}>
            <div style={{ height: 4, background: "#111", borderRadius: 2, width: `${progress}%`, transition: "width 0.3s ease" }} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "clamp(24px, 8vw, 40px) max(16px, 5vw)" }}>
        <div style={{ marginBottom: "clamp(20px, 6vw, 32px)" }}>
          <h1 style={{ fontSize: "clamp(20px, 6vw, 28px)", fontWeight: 700, margin: "0 0 6px", lineHeight: 1.2 }}>{current.title}</h1>
          <p style={{ fontSize: "clamp(14px, 3vw, 16px)", color: "#666", margin: 0, lineHeight: 1.5 }}>{current.subtitle}</p>
        </div>

        {step === 0 && <Step1 data={data} set={set} />}
        {step === 1 && <Step2 data={data} set={set} />}
        {step === 2 && <Step3 data={data} set={set} />}
        {step === 3 && <Step4 data={data} set={set} />}
        {step === 4 && <Step5 data={data} set={set} />}
        {step === 5 && <Step6 data={data} set={set} />}
        {step === 6 && <Step7 data={data} set={set} />}

        {error && (
          <div style={{ marginTop: 16, color: "#b00020", fontSize: "clamp(13px, 2vw, 14px)", background: "#fce4ec", padding: "10px 14px", borderRadius: 8 }}>
            {error}
          </div>
        )}

        {/* Navigation */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "clamp(28px, 8vw, 40px)", gap: 12, flexWrap: "wrap" }}>
          {step > 0 ? (
            <button onClick={() => setStep(s => s - 1)} style={{ padding: "12px 20px", borderRadius: 999, border: "1.5px solid #ddd", background: "white", color: "#333", fontWeight: 500, fontSize: "clamp(13px, 2vw, 15px)", cursor: "pointer" }}>
              ← Back
            </button>
          ) : <div />}

          {step < STEPS.length - 1 ? (
            <button onClick={() => setStep(s => s + 1)} disabled={!canAdvance()} style={{ padding: "12px 24px", borderRadius: 999, border: "none", background: canAdvance() ? "#111" : "#ccc", color: "white", fontWeight: 700, fontSize: "clamp(13px, 2vw, 15px)", cursor: canAdvance() ? "pointer" : "not-allowed" }}>
              Continue →
            </button>
          ) : (
            <button onClick={handleSubmit} disabled={!canAdvance() || submitting} style={{ padding: "12px 24px", borderRadius: 999, border: "none", background: canAdvance() && !submitting ? "#111" : "#ccc", color: "white", fontWeight: 700, fontSize: "clamp(13px, 2vw, 15px)", cursor: canAdvance() && !submitting ? "pointer" : "not-allowed" }}>
              {submitting ? "Submitting…" : "Submit and get my plan →"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
