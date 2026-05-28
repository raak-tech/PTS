import nodemailer from 'nodemailer';

import { logError } from './logger';

export async function sendEmail(opts: { to: string; subject: string; text: string }) {
  const host = process.env.EMAIL_HOST;

  if (!host) {
    // Email not configured — acceptable for local dev / early pilot.
    // The reset URL is still written to the email_outbox table for manual delivery.
    return;
  }

  try {
    const transport = nodemailer.createTransport({
      host,
      port: Number(process.env.EMAIL_PORT ?? 587),
      secure: process.env.EMAIL_SECURE === 'true',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    await transport.sendMail({
      from: process.env.EMAIL_FROM ?? process.env.EMAIL_USER,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
  } catch (err) {
    logError('mailer_send_failed', err, { to: opts.to, subject: opts.subject });
    // Don't rethrow — email failure should not break the request flow.
    // The outbox record is the fallback.
  }
}
