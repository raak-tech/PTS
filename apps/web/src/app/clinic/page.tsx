import { redirect } from 'next/navigation';

export default function ClinicHomePage() {
  redirect('/clinic/patients');
}
