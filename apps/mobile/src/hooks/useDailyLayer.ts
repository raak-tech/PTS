import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  apiGetDailyCalendar,
  apiGetTodayReinforcement,
  apiSaveDailyCalendar,
  apiSubmitReinforcementResponse,
  apiSubmitScheduleFeedback,
  apiSubmitVoiceReinforcementResponse,
  type CalendarBlock,
  type TodayReinforcement,
} from '@/lib/api';

export function useTodayReinforcement() {
  const { token } = useAuth();
  const [reinforcements, setReinforcements] = useState<TodayReinforcement[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await apiGetTodayReinforcement(token);
      const list =
        data.todayReadouts && data.todayReadouts.length > 0
          ? data.todayReadouts
          : data.today
            ? [data.today]
            : [];
      setReinforcements(list);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submitResponse = async (reinforcementId: string, bodyText: string) => {
    if (!token) return;
    await apiSubmitReinforcementResponse(token, reinforcementId, bodyText);
    await reload();
  };

  const submitVoice = async (reinforcementId: string, audioBase64: string) => {
    if (!token) return;
    await apiSubmitVoiceReinforcementResponse(token, reinforcementId, audioBase64);
    await reload();
  };

  return {
    reinforcements,
    reinforcement: reinforcements[0] ?? null,
    loading,
    submitResponse,
    submitVoice,
    reload,
  };
}

export function useDailyCalendar() {
  const { token } = useAuth();
  const [blocks, setBlocks] = useState<CalendarBlock[]>([]);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { blocks: next } = await apiGetDailyCalendar(token);
      setBlocks(next);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const updateBlockStatus = async (blockId: string, status: CalendarBlock['status']) => {
    if (!token) return;
    const next = blocks.map((b) => (b.id === blockId ? { ...b, status } : b));
    setBlocks(next);
    await apiSaveDailyCalendar(token, next);
  };

  const saveBlocks = async (next: CalendarBlock[]) => {
    if (!token) return;
    setBlocks(next);
    await apiSaveDailyCalendar(token, next);
  };

  const submitFeedback = async (workedText: string, didntWorkText: string) => {
    if (!token) return;
    await apiSubmitScheduleFeedback(token, workedText, didntWorkText);
  };

  return { blocks, loading, updateBlockStatus, saveBlocks, submitFeedback, reload };
}
