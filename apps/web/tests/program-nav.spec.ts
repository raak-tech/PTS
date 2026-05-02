import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('program pages show a consistent program navigation block', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  const pages = [
    { path: '/daily', heading: /daily checklist/i, currentText: /daily checklist/i },
    { path: '/check-in', heading: /weekly check-in/i, currentText: /weekly check-in/i },
    { path: '/plan', heading: /week 1 plan/i, currentText: /week 1 plan/i },
    { path: '/weeks', heading: /weeks 2\s*[-–]\s*6/i, currentText: /weeks 2\s*[-–]\s*6/i },
    { path: '/flare-up', heading: /flare-up protocol/i, currentText: /flare-up protocol/i },
    { path: '/red-flags', heading: /red flags/i, currentText: /red flags guidance/i },
  ];

  for (const p of pages) {
    await page.goto(p.path);
    await expect(page.getByRole('heading', { name: p.heading })).toBeVisible();

    const nav = page.getByRole('navigation', { name: /program navigation/i });
    await expect(nav).toBeVisible();

    await expect(nav.getByRole('link', { name: /daily checklist/i })).toHaveAttribute(
      'href',
      '/daily'
    );
    await expect(nav.getByRole('link', { name: /weekly check-in/i })).toHaveAttribute(
      'href',
      '/check-in'
    );
    await expect(nav.getByRole('link', { name: /week 1 plan/i })).toHaveAttribute(
      'href',
      '/plan'
    );
    await expect(nav.getByRole('link', { name: /weeks 2\s*[-–]\s*6/i })).toHaveAttribute(
      'href',
      '/weeks'
    );
    await expect(nav.getByRole('link', { name: /flare-up protocol/i })).toHaveAttribute(
      'href',
      '/flare-up'
    );
    await expect(nav.getByRole('link', { name: /red flags guidance/i })).toHaveAttribute(
      'href',
      '/red-flags'
    );
    await expect(nav.getByRole('link', { name: /back to intake/i })).toHaveAttribute(
      'href',
      '/'
    );

    const current = nav.locator('a[aria-current="page"]');
    await expect(current).toHaveCount(1);
    await expect(current).toHaveText(p.currentText);
  }

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});
