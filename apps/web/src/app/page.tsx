"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import styles from "./page.module.css";

export default function Home() {
  const router = useRouter();

  const [primaryPainArea, setPrimaryPainArea] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [hasRedFlags, setHasRedFlags] = useState(false);

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <div className={styles.intro}>
          <h1>Get a Week 1 Plan</h1>
          <p>
            This is a lightweight, no-storage preview to help you see what a Week 1
            structure could look like.
          </p>
        </div>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            // No persistence in Sprint 1: we only route to static pages.
            // We intentionally do not store or transmit the entered details.
            router.push(hasRedFlags ? "/red-flags" : "/plan");
          }}
          style={{ width: "100%", maxWidth: 560, display: "grid", gap: 16 }}
        >
          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="primaryPainArea">Primary pain area</label>
            <input
              id="primaryPainArea"
              name="primaryPainArea"
              value={primaryPainArea}
              onChange={(e) => setPrimaryPainArea(e.target.value)}
              placeholder="e.g., Lower back"
              required
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />
          </div>

          <div style={{ display: "grid", gap: 8 }}>
            <label htmlFor="primaryGoal">Primary goal for the next 2 weeks</label>
            <input
              id="primaryGoal"
              name="primaryGoal"
              value={primaryGoal}
              onChange={(e) => setPrimaryGoal(e.target.value)}
              placeholder="e.g., Sleep better and return to short walks"
              required
              style={{ padding: 10, borderRadius: 8, border: "1px solid #ddd" }}
            />
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
