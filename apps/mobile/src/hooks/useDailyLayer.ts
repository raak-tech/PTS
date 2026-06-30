import { useCallback, useEffect, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import {
  apiGetDailyCalendar,
  apiGetTodayReinforcement,
  apiSaveDailyCalendar,
  apiSubmitReinforcementResponse,
  apiSubmitVoiceReinforcementResponse,
  apiSubmitScheduleFeedback,
  type CalendarBlock,
  type TodayReinforcement,
} from '@/lib/api';

export function useTodayReinforcement() {
  const { token } = useAuth();
  const [reinforcement, setReinforcement] = useState<TodayReinforcement | null>(null);
  const [loading, setLoading] = useState(true);

  const reload = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    try {
      const { today } = await apiGetTodayReinforcement(token);
      setReinforcement(today);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const submitResponse = async (bodyText: string) => {
    if (!token || !reinforcement) return;
    await apiSubmitReinforcementResponse(token, reinforcement.id, bodyText);
    await reload();
  };

  const submitVoice = async (audioBase64: string) => {
    if (!token || !reinforcement) return;
    await apiSubmitVoiceReinforcementResponse(token, reinforcement.id, audioBase64);
    await reload();
  };

  return { reinforcement, loading, submitResponse, submitVoice, reload };
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
