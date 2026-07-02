import { useEffect, useMemo, useState } from 'react';

import { PROGRAM_TIME_TICK_MS } from '@/config/testTime';
import { computeCalendarProgramTime, computeProgramTime, type ProgramTimeState } from '@/lib/appTime';
import { useAuth } from '@/context/AuthContext';

const CALENDAR_TICK_MS = 60_000;

export function useProgramTime(): ProgramTimeState | null {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());
  const usesCalendar = Boolean(user?.programAnchorDate);
  const tickMs = usesCalendar ? CALENDAR_TICK_MS : PROGRAM_TIME_TICK_MS;

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), tickMs);
    return () => clearInterval(id);
  }, [tickMs]);

  return useMemo(() => {
    if (!user?.planApproved) return null;
    if (user.programAnchorDate) {
      return computeCalendarProgramTime(user.programAnchorDate, user.releasedWeeks ?? [], now);
    }
    if (user.programStartedAt) {
      return computeProgramTime(new Date(user.programStartedAt), user.releasedWeeks ?? [], now);
    }
    return null;
  }, [user?.planApproved, user?.programAnchorDate, user?.releasedWeeks, user?.programStartedAt, now]);
}
