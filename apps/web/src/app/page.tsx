"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  const [primaryPainArea, setPrimaryPainArea] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [hasRedFlags, setHasRedFlags] = useState(false);

  const primaryPainAreaRef = useRef<HTMLInputElement>(null);
  const primaryGoalRef = useRef<HTMLInputElement>(null);

  const [didSubmit, setDidSubmit] = useState(false);

  const primaryPainAreaError =
    didSubmit && primaryPainArea.trim().length === 0
      ? "Primary pain area is required."
      : "";

  const primaryGoalError =
    didSubmit && primaryGoal.trim().length === 0
      ? "Primary goal for the next 2 weeks is required."
      : "";

  const primaryPainAreaDescribedBy = primaryPainAreaError
    ? "primaryPainAreaHelp primaryPainAreaError"
    : "primaryPainAreaHelp";

  const primaryGoalDescribedBy = primaryGoalError
    ? "primaryGoalHelp primaryGoalError"
    : "primaryGoalHelp";

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Get a Week 1 Plan</h1>
          <p>
            This is a lightweight, no-storage preview to help you see what a Week 1
            structure could look like.
          </p>
          <div style={{ marginTop: 10, display: "grid", gap: 6 }}>
            <p style={{ margin: 0, fontSize: 13, color: "#333" }}>
              <strong>Not medical advice.</strong>
            </p>
            <p style={{ margin: 0, fontSize: 13, color: "#333" }}>
              <strong>Not for emergencies.</strong> If you might be having an emergency,
              contact local emergency services.
            </p>
            <p style={{ margin: 0, fontSize: 13 }}>
              <Link href="/red-flags">Red flags guidance</Link>
            </p>
          </div>
        </div>

        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault();
            setDidSubmit(true);

            const painOk = primaryPainArea.trim().length > 0;
            const goalOk = primaryGoal.trim().length > 0;

            if (!painOk) {
              primaryPainAreaRef.current?.focus();
              return;
            }

            if (!goalOk) {
              primaryGoalRef.current?.focus();
              return;
            }

            // No persistence in Sprint 1: we only route to static pages.
            // We intentionally do not store or transmit the entered details.
            router.push(hasRedFlags ? "/red-flags" : "/plan");
          }}
          style={{ width: "100%", maxWidth: 560, display: "grid", gap: 16 }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="primaryPainArea">Primary pain area</label>
            <p id="primaryPainAreaHelp" style={{ margin: 0, fontSize: 13, color: "#555" }}>
              Short and specific is fine. This stays on your device in Sprint 1.
            </p>
            <input
              ref={primaryPainAreaRef}
              id="primaryPainArea"
              name="primaryPainArea"
              value={primaryPainArea}
              onChange={(e) => setPrimaryPainArea(e.target.value)}
              placeholder="e.g., Lower back"
              aria-describedby={primaryPainAreaDescribedBy}
              aria-invalid={primaryPainAreaError ? "true" : "false"}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />
            {primaryPainAreaError ? (
              <p
                id="primaryPainAreaError"
                role="alert"
                style={{ margin: 0, fontSize: 13, color: "#b00020" }}
              >
                {primaryPainAreaError}
              </p>
            ) : null}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="primaryGoal">Primary goal for the next 2 weeks</label>
            <p id="primaryGoalHelp" style={{ margin: 0, fontSize: 13, color: "#555" }}>
              Something measurable and realistic for Week 1. This stays on your device in Sprint 1.
            </p>
            <input
              ref={primaryGoalRef}
              id="primaryGoal"
              name="primaryGoal"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g., Sleep better and return to short walks"
              aria-describedby={primaryGoalDescribedBy}
              aria-invalid={primaryGoalError ? "true" : "false"}
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />
            {primaryGoalError ? (
              <p
                id="primaryGoalError"
                role="alert"
                style={{ margin: 0, fontSize: 13, color: "#b00020" }}
              >
                {primaryGoalError}
              </p>
            ) : null}
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input
                id="hasRedFlags"
                name="hasRedFlags"
                type="checkbox"
                checked={hasRedFlags}
                onChange={(e) => setHasRedFlags(e.target.checked)}
              />
              <label htmlFor="hasRedFlags">I have possible red flag symptoms</label>
            </div>
            <p style={{ margin: 0, fontSize: 13, color: "#555" }}>
              Examples: new severe weakness, loss of bladder/bowel control, fever with
              severe back pain, major trauma, or unexplained weight loss.
            </p>
          </div>

          <button
            type="submit"
            style={{
              padding: "10px 14px",
              borderRadius: 999,
              border: "1px solid #111",
              background: "#111",
              color: "#fafafa",
              width: "fit-content",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Generate Week 1 Plan
          </button>
        </form>
      </main>
    </div>
  );
}
