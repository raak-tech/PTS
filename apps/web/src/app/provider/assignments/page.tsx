import type { Metadata } from 'next';

import ProviderAssignmentsClient from './ProviderAssignmentsClient';

export const metadata: Metadata = {
  title: 'Provider assignments',
};

export default function ProviderAssignmentsPage() {
  return <ProviderAssignmentsClient />;
}
