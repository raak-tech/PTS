import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

import {
  ProviderClientReviewClient,
  type ClientReviewData,
} from './ProviderClientReviewClient';

const clientSummaries: Record<string, ClientReviewData> = {
  'client-001': {
    name: 'A. Client',
    program: 'Week 1 pilot',
    status: 'On track',
    adherence: '4 of 5 daily items completed this week',
    summary: 'Small, steady progress. No escalation signals in this mock view.',
    safety: 'No red flags recorded in sample data.',
    intakeSummary: 'New intake shows steady follow-through and no urgent concerns.',
    currentPlan: 'Keep the current weekly plan unchanged and maintain gentle follow-up.',
    weeklyCheckIn: 'The weekly check-in shows routine notes only, with no red-flag escalation.',
    dailyAdherence: '4 of 5 daily items completed this week.',
    redFlagStatus: 'No red flags recorded in sample data.',
  },
  'client-002': {
    name: 'B. Client',
    program: 'Week 2 pilot',
    status: 'Needs review',
    adherence: '2 of 5 daily items completed this week',
    summary: 'A gentle follow-up would make sense in a real workflow.',
    safety: 'Mock caution note only, nothing urgent.',
    intakeSummary: 'Intake notes mention a slow week and the need for a careful check-in.',
    currentPlan: 'Current plan is a light weekly structure with simple daily prompts.',
    weeklyCheckIn: 'The latest weekly check-in suggests a short provider review is enough.',
    dailyAdherence: '2 of 5 daily items completed this week.',
    redFlagStatus: 'No red flags recorded, but the case is marked for review.',
  },
  'client-003': {
    name: 'C. Client',
    program: 'Week 1 pilot',
    status: 'Stable',
    adherence: '3 of 5 daily items completed this week',
    summary: 'Stable sample case with routine follow-up only.',
    safety: 'No safety concerns in sample data.',
    intakeSummary: 'Baseline intake looks stable with no urgent concerns to escalate.',
    currentPlan: 'Maintain the current weekly plan and review again next week.',
    weeklyCheckIn: 'Weekly check-in reports are routine and do not show a spike in concern.',
    dailyAdherence: '3 of 5 daily items completed this week.',
    redFlagStatus: 'No red flags recorded in sample data.',
  },
};

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const client = clientSummaries[id as keyof typeof clientSummaries];

  return {
    title: client ? `${client.name} | Provider console` : 'Provider client',
  };
}

export default async function ProviderClientDetailPage({ params }: Props) {
  const { id } = await params;
  const client = clientSummaries[id as keyof typeof clientSummaries];

  if (!client) {
    notFound();
  }

  return <ProviderClientReviewClient client={client} />;
}
