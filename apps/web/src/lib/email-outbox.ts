import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { emailOutbox } from '@/db/schema';

/**
 * Records a password-reset message for local/dev delivery via `email_outbox` (no SMTP in pilot).
 */
export function recordPasswordResetOutbox(opts: { toEmail: string; resetUrl: string }) {
  const db = getDb();
  const now = new Date();
  db.insert(emailOutbox)
    .values({
      id: randomUUID(),
      toEmail: opts.toEmail,
      subject: 'Password reset',
      bodyText: [
        'A password reset was requested for this PTS account.',
        'If that was you, open the following link once. It expires automatically and only works until used.',
        '',
        opts.resetUrl,
        '',
        'If you did not request this, you can ignore this message.',
      ].join('\n'),
      createdAt: now,
    })
    .run();
}
