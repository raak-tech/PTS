import type { Metadata } from 'next';

import { ProviderQueueClient } from '@/components/provider/ProviderQueueClient';

export const metadata: Metadata = { title: 'Work queue | Counselor' };

export default function ProviderQueuePage() {
  return (
    <>
      <h1 className="provider-page-title">Work queue</h1>
      <p className="provider-page-subtitle">
        What needs your attention today — intakes, plans, messages, and daily engagement.
      </p>
      <ProviderQueueClient />
    </>
  );
}
