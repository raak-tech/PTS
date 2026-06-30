import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { apiGetContacts, apiGetMusicSets, apiGetPlan, parseGeneratedPlan } from '@/lib/api';
import { useProgramTime } from '@/hooks/useProgramTime';

export function useCounselorContact() {
  const { token } = useAuth();
  const [counselorId, setCounselorId] = useState<string | null>(null);
  const [counselorName, setCounselorName] = useState<string | null>(null);
  const [calendlyUrl, setCalendlyUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void apiGetContacts(token).then((data) => {
      setCounselorId(data.counselor?.id ?? null);
      setCounselorName(data.counselor?.name ?? null);
      setCalendlyUrl(data.counselor?.calendlyUrl ?? null);
    });
  }, [token]);

  return { counselorId, counselorName, calendlyUrl };
}

export function useMusicCatalog() {
  const [byPurpose, setByPurpose] = useState<Record<string, { title: string; spotifyUri: string | null }>>({});

  useEffect(() => {
    void apiGetMusicSets().then((data) => {
      const map: Record<string, { title: string; spotifyUri: string | null }> = {};
      for (const set of data.sets) {
        map[set.purposeTag] = { title: set.title, spotifyUri: set.spotifyUri };
      }
      setByPurpose(map);
    });
  }, []);

  return byPurpose;
}

export function useTodayPlan() {
  const { token } = useAuth();
  const programTime = useProgramTime();
  const [practices, setPractices] = useState<
    { title: string; description: string; duration: string }[]
  >([]);
  const [weekTheme, setWeekTheme] = useState<string | null>(null);
  const [reflection, setReflection] = useState<string | null>(null);

  useEffect(() => {
    if (!token) return;
    void apiGetPlan(token).then(({ plan }) => {
      if (!plan) return;
      const parsed = parseGeneratedPlan(plan.generatedContent);
      const weekNumber = programTime?.weekNumber ?? 1;
      const week = parsed?.weeks.find((w) => w.week === weekNumber) ?? parsed?.weeks[weekNumber - 1];
      if (!week) return;
      setWeekTheme(week.theme);
      setPractices(week.dailyPractices);
      setReflection(week.weeklyReflection);
    });
  }, [token, programTime?.weekNumber]);

  return { practices, weekTheme, reflection };
}
