import { test, expect } from "@playwright/test";
import { AxeBuilder } from "@axe-core/playwright";
import { startConsoleErrorCollector } from "./helpers/console";

test("a11y smoke: sprint 1 routes have no serious or critical axe violations", async ({ page }) => {
  const errors = startConsoleErrorCollector(page);

  const pages = ["/", "/plan", "/daily", "/check-in", "/red-flags"];

  for (const path of pages) {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa"])
      .exclude('[data-axe-exclude="true"]')
      .analyze();

    const seriousOrWorse = results.violations.filter(
      (v) => v.impact === "serious" || v.impact === "critical"
    );

    expect(
      seriousOrWorse,
      `Axe violations on ${path}:\n${JSON.stringify(seriousOrWorse, null, 2)}`
    ).toEqual([]);
  }

  expect(errors, `Console errors:\n${errors.join("\n")}`).toEqual([]);
});
