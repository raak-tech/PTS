import { redirect } from 'next/navigation';

export default function ProviderHomePage() {
  redirect('/provider/clients');
}
