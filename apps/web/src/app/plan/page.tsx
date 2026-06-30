import type { Metadata } from 'next';
import { headers } from 'next/headers';
import Link from 'next/link';
import { desc, eq } from 'drizzle-orm';

import { getDb } from '../../db';
import { planWeeks, plans } from '../../db/schema';
import { getUserFromCookieHeader } from '../../lib/session';
import type { GeneratedPlan, WeekPlan } from '../../lib/plan-generator';

export const metadata: Metadata = { title: 'Your plan | Pain to Strength' };

export default async function PlanPage() {
  const headersList = await headers();
  const user = await getUserFromCookieHeader(headersList.get('cookie'));

  let planStatus: 'none' | 'pending' | 'approved' = 'none';
  let overview = '';
  let approvedWeeks: WeekPlan[] = [];

  if (user) {
    const db = getDb();

    // Find the latest plan for this client
    const [plan] = await db
      .select()
      .from(plans)
      .where(eq(plans.userId, user.id))
      .orderBy(desc(plans.createdAt))
      .limit(1);

    if (plan) {
      // Fetch approved weeks only — client sees a week only after counselor approves it
      const weekRows = await db
        .select({ weekNumber: planWeeks.weekNumber, content: planWeeks.content, status: planWeeks.status })
        .from(planWeeks)
        .where(eq(planWeeks.planId, plan.id))
        .orderBy(planWeeks.weekNumber);

      const approvedWeekRows2 = weekRows.filter((r: { weekNumber: number; content: string; status: string }) => r.status === 'approved');

      if (approvedWeekRows2.length > 0) {
        // New model: show only approved weeks from planWeeks table
        planStatus = 'approved';
        for (const row of approvedWeekRows2) {
          try {
            approvedWeeks.push(JSON.parse(row.content) as WeekPlan);
          } catch { /* skip malformed */ }
        }
        // Try to get the overview from the plan's generatedContent
        try {
          const full = JSON.parse(plan.generatedContent) as GeneratedPlan;
          overview = full.overview ?? '';
        } catch { /* ignore */ }
      } else if (plan.status === 'approved') {
        // Legacy model: plan was approved atomically before planWeeks existed
        planStatus = 'approved';
        try {
          const full = JSON.parse(plan.generatedContent) as GeneratedPlan;
          overview = full.overview ?? '';
          approvedWeeks = full.weeks ?? [];
        } catch { /* ignore */ }
      } else {
        planStatus = 'pending';
      }
    }
  }

  if (!user) {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1>Your plan</h1>
        <p style={{ color: '#666' }}>Please sign in to see your personalised program.</p>
        <Link href="/login" style={{ display: 'inline-block', marginTop: 16, padding: '12px 28px', borderRadius: 999, background: '#111', color: 'white', textDecoration: 'none', fontWeight: 600 }}>Sign in</Link>
      </main>
    );
  }

  if (planStatus === 'none') {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1>Your plan</h1>
        <p style={{ color: '#666' }}>You haven&apos;t completed your intake yet.</p>
        <Link href="/" style={{ display: 'inline-block', marginTop: 16, padding: '12px 28px', borderRadius: 999, background: '#111', color: 'white', textDecoration: 'none', fontWeight: 600 }}>Start intake →</Link>
      </main>
    );
  }

  if (planStatus === 'pending') {
    return (
      <main style={{ maxWidth: 640, margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <div style={{ fontSize: 40, marginBottom: 20 }}>⏳</div>
        <h1>Your plan is being prepared</h1>
        <p style={{ color: '#666', lineHeight: 1.6 }}>Your counselor is reviewing the personalised program and will approve it shortly. You&apos;ll be notified when it&apos;s ready.</p>
        <p style={{ marginTop: 24 }}>
          <Link href="/messages" style={{ color: '#333', textDecoration: 'underline' }}>Check your messages →</Link>
        </p>
      </main>
    );
  }

  if (approvedWeeks.length === 0) return null;

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px 24px 80px' }}>
      {/* Safety disclaimer */}
      <div style={{ background: '#fff8e1', border: '1px solid #ffe082', borderRadius: 10, padding: '10px 16px', marginBottom: 28, fontSize: 13, color: '#555' }}>
        This program is counseling support — not medical advice. If you have an emergency, contact emergency services.{' '}
        <Link href="/red-flags" style={{ color: '#b00020' }}>Red flags guide →</Link>
      </div>

      <h1 style={{ fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>Your recovery program</h1>
      {overview && <p style={{ color: '#555', lineHeight: 1.6, margin: '0 0 32px' }}>{overview}</p>}

      {/* Approved weeks — shown in order, only what counselor has released */}
      <div style={{ display: 'grid', gap: 16 }}>
        {approvedWeeks.map((week) => (
          <details key={week.week} open={week.week === approvedWeeks[0]?.week} style={{ border: '1px solid #e0e0e0', borderRadius: 14, overflow: 'hidden' }}>
            <summary style={{ padding: '16px 20px', cursor: 'pointer', fontWeight: 600, fontSize: 16, background: '#fafafa', userSelect: 'none' }}>
              Week {week.week} — {week.theme}
            </summary>
            <div style={{ padding: '16px 20px' }}>
              <p style={{ margin: '0 0 16px', color: '#555', fontSize: 14, lineHeight: 1.6 }}>{week.focus}</p>

              <p style={{ margin: '0 0 10px', fontWeight: 600, fontSize: 14 }}>Daily practices</p>
              <div style={{ display: 'grid', gap: 10, marginBottom: 20 }}>
                {week.dailyPractices.map(p => (
                  <div key={p.title} style={{ padding: '12px 16px', background: '#f9f9f9', borderRadius: 10, border: '1px solid #ddd' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, fontSize: 14, color: '#111' }}>{p.title}</span>
                      <span style={{ fontSize: 12, color: '#555', background: '#eee', padding: '2px 8px', borderRadius: 999, fontWeight: 500 }}>{p.duration}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: 14, color: '#444', lineHeight: 1.5 }}>{p.description}</p>
                  </div>
                ))}
              </div>

              <div style={{ background: '#e3f2fd', border: '1px solid #64b5f6', borderRadius: 10, padding: '12px 16px' }}>
                <p style={{ margin: '0 0 4px', fontWeight: 600, fontSize: 13, color: '#1976d2' }}>This week&apos;s reflection</p>
                <p style={{ margin: 0, fontSize: 14, color: '#0d47a1', fontStyle: 'italic' }}>&quot;{week.weeklyReflection}&quot;</p>
              </div>
            </div>
          </details>
        ))}
      </div>

      <div style={{ background: '#f5f5f5', border: '1px solid #ccc', borderRadius: 10, padding: '16px', marginTop: 20, marginBottom: 20 }}>
        <p style={{ margin: 0, fontSize: 13, color: '#555', lineHeight: 1.6 }}>
          <strong>📅 More weeks coming</strong><br/>Your counselor will unlock the next weeks of your program as you progress. This keeps your focus on one week at a time and allows your counselor to adjust your plan based on how things are going.
        </p>
      </div>

      <div style={{ marginTop: 32, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/daily" style={{ padding: '12px 24px', borderRadius: 999, background: '#111', color: 'white', textDecoration: 'none', fontWeight: 600, fontSize: 14 }}>
          Today&apos;s practice
        </Link>
        <Link href="/messages" style={{ padding: '12px 24px', borderRadius: 999, border: '1px solid #ddd', color: '#333', textDecoration: 'none', fontSize: 14 }}>
          Message your counselor
        </Link>
      </div>
    </main>
  );
}
