import { useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  apiGetContacts,
  apiGetMusicSets,
  apiGetPlan,
  parseGeneratedPlan,
  type CounselorPublicProfile,
} from '@/lib/api';
import { useProgramTime } from '@/hooks/useProgramTime';

export function useCounselorContact() {
  const { token } = useAuth();
  const [counselor, setCounselor] = useState<CounselorPublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      setCounselor(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    void apiGetContacts(token)
      .then((data) => setCounselor(data.counselor ?? null))
      .catch(() => setCounselor(null))
      .finally(() => setLoading(false));
  }, [token]);

  return {
    counselor,
    counselorId: counselor?.id ?? null,
    counselorName: counselor?.name ?? null,
    calendlyUrl: counselor?.calendlyUrl ?? null,
    loading,
  };
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
      const weekNumber = programTime?.contentWeekNumber ?? programTime?.weekNumber ?? 1;
      const week = parsed?.weeks.find((w) => w.week === weekNumber) ?? parsed?.weeks[weekNumber - 1];
      if (!week) return;
      setWeekTheme(week.theme);
      setPractices(week.dailyPractices);
      setReflection(week.weeklyReflection);
    });
  }, [token, programTime?.contentWeekNumber, programTime?.weekNumber]);

  return { practices, weekTheme, reflection };
}
