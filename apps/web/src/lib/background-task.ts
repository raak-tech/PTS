import { waitUntil } from '@vercel/functions';

export function runInBackground(task: Promise<unknown>) {
  waitUntil(task);
}
