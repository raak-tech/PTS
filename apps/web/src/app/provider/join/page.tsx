import type { Metadata } from 'next';

import ProviderJoinClient from './ProviderJoinClient';

export const metadata: Metadata = {
  title: 'Join with invite code',
};

export default function ProviderJoinPage() {
  return <ProviderJoinClient />;
}
