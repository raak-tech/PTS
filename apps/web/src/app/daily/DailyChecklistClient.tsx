"use client";

import { useEffect, useMemo, useState } from "react";

import { Guardrails } from "../../components/Guardrails";
import { ProgramNav } from "../../components/ProgramNav";
import { encryptReflection } from "../../lib/reflection-crypto";

type ChecklistItem = {
  id: string;
  label: string;
};

type ReflectionSettings = {
  reflectionEncryptionEnabled: boolean;
  reflectionSalt: string | null;
};

type ConsentResponse = ReflectionSettings & { ok: boolean; enabled: boolean };

export function DailyChecklistClient() {
  const items: ChecklistItem[] = useMemo(
    () => [
      { id: "grounding", label: "2 minutes: breathing / grounding" },
      { id: "movement", label: "5 minutes: gentle movement (comfortable range only)" },
      { id: "values", label: "2 minutes: one small values-based action" },
    ],
    []
  );

  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const [reflection, setReflection] = useState("");
  const [encryptReflections, setEncryptReflections] = useState(false);
  const [clientSecret, setClientSecret] = useState("");
  const [reflectionSalt, setReflectionSalt] = useState<string | null>(null);
  const [status, setStatus] = useState("");
  const [settingsStatus, setSettingsStatus] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadSettings() {
      if (!document.cookie.includes("pts_session=")) return;

      try {
        const response = await fetch("/api/support/consent");
        if (!response.ok) return;
        const data = (await response.json()) as ReflectionSettings;
        if (cancelled) return;
        setEncryptReflections(Boolean(data.reflectionEncryptionEnabled));
        setReflectionSalt(data.reflectionSalt ?? null);
      } catch {
        // Leave local-only mode in place if settings are unavailable.
      }
    }

    void loadSettings();

    return () => {
      cancelled = true;
    };
  }, []);

  const totalCount = items.length;
  const completedCount = items.reduce((acc, item) => acc + (checked[item.id] ? 1 : 0), 0);

  async function updateEncryptionSetting(nextEnabled: boolean) {
    const previousEnabled = encryptReflections;
    setEncryptReflections(nextEnabled);
    setSettingsStatus("");

    try {
      const response = await fetch("/api/support/consent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reflectionEncryptionEnabled: nextEnabled }),
      });

      if (!response.ok) {
        throw new Error("Unable to update reflection encryption setting.");
      }

      const data = (await response.json()) as ConsentResponse;
      setEncryptReflections(Boolean(data.reflectionEncryptionEnabled));
      setReflectionSalt(data.reflectionSalt ?? null);
      setSettingsStatus(
        nextEnabled
          ? "Encrypted reflections enabled. Enter a client secret code to save one."
          : "Encrypted reflections disabled."
      );
    } catch {
      setEncryptReflections(previousEnabled);
      setSettingsStatus("Unable to update encrypted reflection settings right now.");
    }
  }

  return (
    <main style={{ maxWidth: 800, margin: "0 auto", padding: "48px 24px" }}>
      <h1>Daily Checklist</h1>

      <p style={{ maxWidth: 680 }}>
        Local-only: your checkmarks stay in this browser session only (no storage, no
        syncing).
      </p>

      <p style={{ marginTop: 8, marginBottom: 0, fontSize: 14, color: "#333" }}>
        <strong>Progress:</strong> {completedCount}/{totalCount}
      </p>

      <section style={{ marginTop: 24 }}>
        <h2>Today&apos;s micro-practices</h2>

        <div style={{ marginTop: 8, marginBottom: 12 }}>
          <button
            type="button"
            onClick={() => {
              setChecked({});
              setReflection("");
              setClientSecret("");
              setStatus("");
            }}
          >
            Reset checklist
          </button>
        </div>

        <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: 12 }}>
          {items.map((item) => (
            <li key={item.id}>
              <label
                style={{
                  display: "flex",
                  gap: 10,
                  alignItems: "center",
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={Boolean(checked[item.id])}
                  onChange={(e) =>
                    setChecked((prev) => ({ ...prev, [item.id]: e.target.checked }))
                  }
                />
                <span>{item.label}</span>
              </label>
            </li>
          ))}
        </ul>

        <div style={{ marginTop: 18, display: "grid", gap: 10 }}>
          <label htmlFor="reflection" style={{ display: "block", fontWeight: 600 }}>
            Reflection (optional)
          </label>
          <textarea
            id="reflection"
            name="reflection"
            rows={4}
            placeholder="Optional. Not saved unless encrypted reflections are enabled."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            style={{ width: "100%", maxWidth: 680 }}
          />

          <label style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <input
              type="checkbox"
              checked={encryptReflections}
              onChange={(e) => void updateEncryptionSetting(e.target.checked)}
            />
            Encrypt optional reflections before saving
          </label>

          <p style={{ margin: 0, maxWidth: 720, fontSize: 13, color: "#444" }}>
            When enabled, PTS encrypts the reflection in your browser before sending it.
            The server stores ciphertext and metadata only. Lost secrets cannot be
            recovered.
          </p>

          <label htmlFor="clientSecret" style={{ display: "block", fontWeight: 600 }}>
            Client secret code
          </label>
          <input
            id="clientSecret"
            name="clientSecret"
            type="password"
            autoComplete="off"
            value={clientSecret}
            onChange={(e) => setClientSecret(e.target.value)}
            placeholder="Required when encrypted reflections are enabled"
            style={{ width: "100%", maxWidth: 420 }}
          />

          <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
            {reflectionSalt
              ? "A per-user salt is already set for encrypted reflections."
              : "Encrypted reflections are not initialized yet."}
          </p>

          {settingsStatus ? (
            <p role="status" style={{ margin: 0, fontWeight: 600 }}>
              {settingsStatus}
            </p>
          ) : null}
        </div>

        <div style={{ marginTop: 18, display: "flex", gap: 12, alignItems: "center" }}>
          <button
            type="button"
            onClick={async () => {
              setStatus("");
              const completed = items.filter((item) => checked[item.id]).map((item) => item.label);
              const trimmedReflection = reflection.trim();

              if (encryptReflections && trimmedReflection && !clientSecret.trim()) {
                setStatus("Enter a client secret code before saving an encrypted reflection.");
                return;
              }

              let reflectionCiphertext: string | undefined;
              let reflectionEncryptionMeta: string | undefined;

              if (encryptReflections && trimmedReflection) {
                if (!reflectionSalt) {
                  setStatus("Initialize encrypted reflections before saving one.");
                  return;
                }

                const encrypted = await encryptReflection(
                  trimmedReflection,
                  clientSecret.trim(),
                  reflectionSalt
                );
                reflectionCiphertext = encrypted.ciphertext;
                reflectionEncryptionMeta = encrypted.meta;
              }

              const response = await fetch("/api/support/artifacts", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  kind: "daily",
                  title: "Daily completion",
                  bodyText: `Completed items:\n${completed.join("\n") || "None"}`,
                  reflectionCiphertext,
                  reflectionEncryptionMeta,
                }),
              });

              setStatus(response.ok ? "Daily completion saved." : "Enable support storage first.");
            }}
          >
            Save daily completion
          </button>
          {status ? (
            <p role="status" style={{ margin: 0, fontWeight: 600 }}>
              {status}
            </p>
          ) : null}
        </div>
      </section>

      <Guardrails style={{ marginTop: 24 }} />

      <ProgramNav style={{ marginTop: 24 }} />
    </main>
  );
}
