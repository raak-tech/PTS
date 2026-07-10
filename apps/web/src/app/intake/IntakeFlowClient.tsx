"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";

import { SegmentSelector } from "@/components/intake/SegmentSelector";
import {
  OneBoxIntake,
  type ExtractionComplete,
} from "@/components/intake/OneBoxIntake";

const STORAGE_KEY = "pts.intake.extraction.v1";

type Step = "segment" | "onebox";

export function IntakeFlowClient() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("segment");
  const [segmentType, setSegmentType] = useState<string | null>(null);

  const handleSegmentSelect = useCallback(
    (type: string | null) => {
      setSegmentType(type);
      setStep("onebox");
    },
    [],
  );

  const handleExtractionComplete = useCallback(
    (data: ExtractionComplete) => {
      // Store extraction data in sessionStorage for the confirm page
      try {
        sessionStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            ...data,
            segmentType,
          }),
        );
      } catch {
        // Silently ignore storage errors
      }

      // Navigate to confirmation page
      router.push("/intake/confirm");
    },
    [router, segmentType],
  );

  if (step === "onebox") {
    return (
      <OneBoxIntake
        segmentType={segmentType}
        onExtractionComplete={handleExtractionComplete}
      />
    );
  }

  return <SegmentSelector onSelect={handleSegmentSelect} />;
}