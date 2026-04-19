import { test, expect, Page } from '@playwright/test';

async function expectSharedGuardrails(page: Page) {
  await expect(
    page.getByRole('heading', { name: /safety & boundaries/i })
  ).toBeVisible();

  await expect(page.getByRole('link', { name: /red flags guidance/i })).toHaveAttribute(
    'href',
    '/red-flags'
  );

  await expect(page.getByText(/this is not medical advice\./i)).toBeVisible();

  await expect(
    page.getByText(
      /this is not for emergencies\. if you think you may be in danger, seek local emergency help\./i
    )
  ).toBeVisible();

  await expect(
    page.getByText(
      /stop any activity that feels unsafe and consider consulting a licensed clinician\./i
    )
  ).toBeVisible();
}

test('daily checklist shows the shared Safety & Boundaries guardrails block', async ({ page }) => {
  await page.goto('/daily');
  await expectSharedGuardrails(page);
});

test('weekly check-in shows the shared Safety & Boundaries guardrails block', async ({ page }) => {
  await page.goto('/check-in');
  await expectSharedGuardrails(page);
});

test('plan page shows the shared Safety & Boundaries guardrails block', async ({ page }) => {
  await page.goto('/plan');
  await expectSharedGuardrails(page);
});

test('flare-up page shows the shared Safety & Boundaries guardrails block', async ({ page }) => {
  await page.goto('/flare-up');
  await expectSharedGuardrails(page);
});
