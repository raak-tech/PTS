import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { apiGetProviderQueue } from '@/lib/api';

// Queue badge lifecycle:
// - Shows when pendingPlans.length > 0
// - Clears after user navigates to the Queue tab (cleared on tab screen mount)
// - Re-badges when new plans arrive on next poll

let lastViewedQueueTime = 0;

export function useProviderQueueBadge() {
  const { token } = useAuth();
  const [badgeCount, setBadgeCount] = useState(0);

  useEffect(() => {
    if (!token) return;
    const poll = async () => {
      try {
        const data = await apiGetProviderQueue(token);
        const count = data.pendingPlans?.length ?? 0;
        // Show badge only for plans that arrived after last queue view
        const now = Date.now();
        const timeSinceView = now - lastViewedQueueTime;
        if (timeSinceView < 2000) {
          // Just viewed, clear badge
          setBadgeCount(0);
        } else if (count > 0) {
          setBadgeCount(count);
        }
      } catch {
        // Ignore errors
      }
    };
    void poll();
    const interval = setInterval(poll, 30000);
    return () => clearInterval(interval);
  }, [token]);

  return { badgeCount, markQueueViewed: () => { lastViewedQueueTime = Date.now(); } };
}
