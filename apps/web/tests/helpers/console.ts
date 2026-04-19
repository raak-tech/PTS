import type { Page } from '@playwright/test';

type Options = {
  // Optional filter for known-benign errors.
  // Return true to keep the message, false to ignore.
  keep?: (msg: string) => boolean;
};

export function startConsoleErrorCollector(page: Page, options: Options = {}) {
  const errors: string[] = [];
  const keep = options.keep ?? (() => true);

  page.on('pageerror', (err) => {
    const msg = `[pageerror] ${err?.message ?? String(err)}`;
    if (keep(msg)) errors.push(msg);
  });

  page.on('console', (msg) => {
    if (msg.type() !== 'error') return;
    const text = `[console.${msg.type()}] ${msg.text()}`;
    if (keep(text)) errors.push(text);
  });

  return errors;
}
