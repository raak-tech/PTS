import { redirect } from 'next/navigation';

export default function IntakeAliasPage() {
  // Canonical intake route is '/'. Keep '/intake' as a friendly alias.
  redirect('/');
}
