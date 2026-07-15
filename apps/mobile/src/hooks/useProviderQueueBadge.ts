import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiGetProviderQueue } from '@/lib/api';

// Queue badge lifecycle:
// - Shows when pendingPlans.length > 0
// - Clears when Queue tab is focused (markQueueViewed)
// - Re-badges when new plans arrive on next poll after leaving

let lastViewedQueueTime = 0;

export function useProviderQueueBadge() {
  const { token } = useAuth();
  const [badgeCount, setBadgeCount] = useState(0);

  const markQueueViewed = useCallback(() => {
    lastViewedQueueTime = Date.now();
    setBadgeCount(0);
  }, []);

  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const data = await apiGetProviderQueue(token);
        const count = data.pendingPlans?.length ?? 0;
        const timeSinceView = Date.now() - lastViewedQueueTime;
        // Recently viewed → keep cleared until counselor leaves and new poll cycle
        if (timeSinceView < 60_000) {
          setBadgeCount(0);
        } else if (count > 0) {
          setBadgeCount(count);
        } else {
          setBadgeCount(0);
        }
      } catch {
        // Ignore errors
      }
    };
    void poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return { badgeCount, markQueueViewed };
}
