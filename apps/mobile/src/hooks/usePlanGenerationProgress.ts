import { useEffect, useState } from 'react';

const STEPS = [
  'Reading latest intake…',
  'Calling AI (Claude via OpenRouter)…',
  'Building your 6-week program…',
  'Adding Ayurveda, yoga & music blocks…',
  'Validating plan structure…',
] as const;

function stepIndexForElapsed(seconds: number): number {
  if (seconds < 20) return 0;
  if (seconds < 50) return 1;
  if (seconds < 110) return 2;
  if (seconds < 170) return 3;
  return 4;
}

export function usePlanGenerationProgress(active: boolean) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!active) {
      setElapsed(0);
      return;
    }
    const start = Date.now();
    const timer = setInterval(() => {
      setElapsed(Math.floor((Date.now() - start) / 1000));
    }, 1000);
    return () => clearInterval(timer);
  }, [active]);

  const stepIndex = stepIndexForElapsed(elapsed);
  const progress = Math.min(0.95, 0.12 + stepIndex * 0.18 + (elapsed % 35) / 100);

  return {
    elapsed,
    step: STEPS[stepIndex],
    progress,
    hint: 'This usually takes 2–4 minutes. Please keep the app open.',
  };
}
