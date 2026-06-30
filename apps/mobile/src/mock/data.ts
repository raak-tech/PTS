import type { MockAccount } from '../types';

/** Pilot test accounts — OTP is always 123456 */
export const MOCK_OTP = '123456';

export const MOCK_ACCOUNTS: MockAccount[] = [
  {
    id: 'client-new',
    phone: '+919876543210',
    role: 'client',
    displayName: 'Test Client',
    intakeComplete: false,
    planApproved: false,
    registered: true,
  },
  {
    id: 'client-waiting',
    phone: '+919876543211',
    role: 'client',
    displayName: 'Waiting Client',
    intakeComplete: true,
    planApproved: false,
    registered: true,
  },
  {
    id: 'client-active',
    phone: '+919876543212',
    role: 'client',
    displayName: 'Active Client',
    intakeComplete: true,
    planApproved: true,
    registered: true,
  },
  {
    id: 'counselor-1',
    phone: '+919123456789',
    role: 'provider',
    displayName: 'Dr. Ramya',
    intakeComplete: true,
    planApproved: true,
    registered: true,
  },
];

export function findAccountByPhone(phone: string): MockAccount | undefined {
  const digits = phone.replace(/\D/g, '');
  return MOCK_ACCOUNTS.find((a) => a.phone.replace(/\D/g, '') === digits);
}

export const INTAKE_STEPS = [
  { title: 'Your situation', subtitle: "Let's start with what happened." },
  { title: 'A little about you', subtitle: 'Your background helps us build the right support.' },
  { title: 'The impact on your life', subtitle: "Understanding what's changed." },
  { title: 'What recovery means to you', subtitle: 'Your goals shape everything.' },
  { title: 'Your current support', subtitle: "What's already in place." },
  { title: "How you'd like to work", subtitle: "We'll tailor the program to fit you." },
  { title: 'A quick safety check', subtitle: 'Before we finalise.' },
] as const;

export const MOCK_WEEKS = [
  { id: '1', theme: 'Finding Ground', status: 'current' as const },
  { id: '2', theme: 'Understanding the Pain', status: 'locked' as const },
  { id: '3', theme: 'Gentle Re-engagement', status: 'locked' as const },
  { id: '4', theme: 'Values in Action', status: 'locked' as const },
  { id: '5', theme: 'Building Confidence', status: 'locked' as const },
  { id: '6', theme: 'Moving Forward', status: 'locked' as const },
];
/** @deprecated Use computeProgramTime() — weeks advance with test clock (1h = 1 week). */

export const MOCK_QUEUE = {
  pendingPlans: [{ id: 'plan-1', clientName: 'Waiting Client', submittedAt: '2 hours ago' }],
  unreadMessages: [{ id: 'client-waiting', clientName: 'Waiting Client', preview: 'Got the plan, thanks!' }],
  redFlags: 0,
};

export const MOCK_CLIENTS = [
  { id: 'client-waiting', name: 'Waiting Client', planStatus: 'pending', hasRedFlag: false },
  { id: 'client-active', name: 'Active Client', planStatus: 'approved', hasRedFlag: false },
];
