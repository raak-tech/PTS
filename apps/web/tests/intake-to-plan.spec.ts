import { test, expect } from '@playwright/test';
import { startConsoleErrorCollector } from './helpers/console';

test('intake prevents navigation and shows validation copy on empty submit', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();

  await expect(page).toHaveURL('/');
  await expect(page.getByText(/primary pain area is required/i)).toBeVisible();
  await expect(
    page.getByText(/primary goal for the next 2 weeks is required/i)
  ).toBeVisible();
});

test('empty submit focuses the first invalid field (a11y)', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();

  await expect(page.getByLabel(/primary pain area/i)).toBeFocused();
});

test('empty submit connects inputs to their error messages via aria-describedby (a11y)', async ({ page }) => {
  await page.goto('/');

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();

  await expect(page.getByText(/primary pain area is required/i)).toBeVisible();
  await expect(page.getByText(/primary goal for the next 2 weeks is required/i)).toBeVisible();

  await expect(page.getByLabel(/primary pain area/i)).toHaveAttribute(
    'aria-describedby',
    /primaryPainAreaError/
  );

  await expect(page.getByLabel(/primary goal for the next 2 weeks/i)).toHaveAttribute(
    'aria-describedby',
    /primaryGoalError/
  );
});

test('intake form submits and plan page renders required sections', async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  await page.goto('/');

  await expect(
    page.getByRole('heading', { name: /get a week 1 plan/i })
  ).toBeVisible();

  // Intake guardrails should be visible before any submission.
  await expect(page.getByText(/not medical advice/i)).toBeVisible();
  await expect(page.getByText(/not for emergencies/i)).toBeVisible();

  await page.getByLabel(/primary pain area/i).fill('Lower back');
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill(
    'Sleep better and return to short walks'
  );

  await page.getByRole('button', { name: /generate week 1 plan/i }).click();

  await expect(page).toHaveURL(/\/plan/);

  await expect(
    page.getByRole('heading', { name: /your week 1 plan/i })
  ).toBeVisible();

  // Plan sub-sections should exist (Sprint 1 vertical slice: static safe copy).
  await expect(page.getByRole('heading', { name: /overview/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /weekly focus/i })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /daily micro-practices/i })
  ).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /reflection prompt/i })
  ).toBeVisible();
  await expect(page.getByRole('heading', { name: /weekly check-in/i })).toBeVisible();
  await expect(page.getByRole('heading', { name: /red flags/i })).toBeVisible();
  await expect(
    page.getByRole('heading', { name: /safety & boundaries/i })
  ).toBeVisible();

  // Guardrail copy: no outcome promises, clear safety boundaries.
  await expect(page.getByText(/not medical advice/i)).toHaveCount(1);
  await expect(page.getByText(/not for emergencies/i)).toHaveCount(1);

  expect(errors, `Console errors:\n${errors.join('\n')}`).toEqual([]);
});

test('intake marks required fields as required (a11y)', async ({ page }) => {
  await page.goto('/');

  await expect(page.getByLabel(/primary pain area/i)).toHaveAttribute('required', '');
  await expect(page.getByLabel(/primary goal for the next 2 weeks/i)).toHaveAttribute(
    'required',
    ''
  );
});
