import type { Locator, Page } from "@playwright/test";

export function programNav(page: Page): Locator {
  return page.getByRole("navigation", { name: /program navigation/i });
}

export function sectionByHeading(page: Page, headingName: RegExp | string): Locator {
  // Most sections follow: <section><h2>...</h2> ...</section>
  return page.getByRole("heading", { name: headingName }).locator("..");
}

type RegionRole = "navigation" | "main" | "banner" | "contentinfo" | "complementary";

export function getLinkInRegion(
  page: Page,
  region: { role: RegionRole; name: RegExp | string },
  linkName: RegExp | string,
): Locator {
  const regionLocator = page.getByRole(region.role, { name: region.name });
  return regionLocator.getByRole("link", { name: linkName });
}
