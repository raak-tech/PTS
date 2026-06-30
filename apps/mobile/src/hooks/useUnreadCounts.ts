import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

import { useAuth } from '@/context/AuthContext';
import { apiGetContacts, apiGetUnreadCount } from '@/lib/api';

export function useUnreadCounts() {
  const { token, user } = useAuth();
  const [total, setTotal] = useState(0);

  const refresh = useCallback(async () => {
    if (!token || !user) {
      setTotal(0);
      return;
    }
    try {
      if (user.role === 'client') {
        const contacts = await apiGetContacts(token);
        setTotal(contacts.counselor?.unreadCount ?? 0);
        return;
      }
      if (user.role === 'provider') {
        const unread = await apiGetUnreadCount(token);
        setTotal(unread.total ?? 0);
      }
    } catch {
      /* keep last count */
    }
  }, [token, user]);

  useFocusEffect(
    useCallback(() => {
      void refresh();
      const interval = setInterval(() => void refresh(), 30_000);
      return () => clearInterval(interval);
    }, [refresh]),
  );

  return { total, refresh };
}
