import { useEffect, useMemo, useState } from 'react';

import { PROGRAM_TIME_TICK_MS } from '@/config/testTime';
import { computeProgramTime, type ProgramTimeState } from '@/lib/appTime';
import { useAuth } from '@/context/AuthContext';

export function useProgramTime(): ProgramTimeState | null {
  const { user } = useAuth();
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), PROGRAM_TIME_TICK_MS);
    return () => clearInterval(id);
  }, []);

  return useMemo(() => {
    if (!user?.programStartedAt) return null;
    return computeProgramTime(new Date(user.programStartedAt), now);
  }, [user?.programStartedAt, now]);
}
