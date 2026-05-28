import { randomUUID } from 'node:crypto';

import { getDb } from '@/db';
import { emailOutbox } from '@/db/schema';
import { sendEmail } from './mailer';

/**
 * Records a password-reset message in the email_outbox table (audit trail)
 * and attempts to deliver it immediately via SMTP if EMAIL_HOST is configured.
 */
export async function recordPasswordResetOutbox(opts: { toEmail: string; resetUrl: string }) {
  const subject = 'Password reset — PTS';
  const bodyText = [
    'A password reset was requested for this PTS account.',
    'If that was you, open the following link once. It expires in 1 hour and only works until used.',
    '',
    opts.resetUrl,
    '',
    'If you did not request this, you can safely ignore this message.',
  ].join('\n');

  const db = getDb();
  await db.insert(emailOutbox).values({
    id: randomUUID(),
    toEmail: opts.toEmail,
    subject,
    bodyText,
    createdAt: new Date(),
  });

  await sendEmail({ to: opts.toEmail, subject, text: bodyText });
}
