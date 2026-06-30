import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  apiGetHolisticCompletions,
  apiGetPlan,
  apiMarkHolisticComplete,
  parseGeneratedPlan,
  type GeneratedPlan,
  type HolisticActivityType,
} from '@/lib/api';
import { useProgramTime } from '@/hooks/useProgramTime';

export function useHolisticWeek() {
  const { token } = useAuth();
  const programTime = useProgramTime();
  const weekNumber = programTime?.weekNumber ?? 1;

  const [week, setWeek] = useState<GeneratedPlan['weeks'][number] | null>(null);
  const [completed, setCompleted] = useState<Record<HolisticActivityType, boolean>>({
    ayurveda: false,
    yoga: false,
    music: false,
  });
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [{ plan }, holistic] = await Promise.all([
        apiGetPlan(token),
        apiGetHolisticCompletions(token),
      ]);
      if (plan) {
        const parsed = parseGeneratedPlan(plan.generatedContent);
        const current =
          parsed?.weeks.find((w) => w.week === weekNumber) ?? parsed?.weeks[weekNumber - 1] ?? null;
        setWeek(current);
      }
      setCompleted(holistic.completed);
    } finally {
      setLoading(false);
    }
  }, [token, weekNumber]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const markComplete = async (activityType: HolisticActivityType) => {
    if (!token) return;
    await apiMarkHolisticComplete(token, activityType, weekNumber);
    await reload();
  };

  return { week, weekNumber, completed, loading, markComplete, reload };
}
