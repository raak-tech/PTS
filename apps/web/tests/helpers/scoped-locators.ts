import type { Locator, Page } from "@playwright/test";

type RegionRole =
  | "navigation"
  | "main"
  | "banner"
  | "contentinfo"
  | "complementary";

export function getRegion(page: Page, region: { role: RegionRole; name: RegExp | string }) {
  return page.getByRole(region.role, { name: region.name });
}

export function getLinkInRegion(
  page: Page,
  region: { role: RegionRole; name: RegExp | string },
  linkName: RegExp | string,
): Locator {
  return getRegion(page, region).getByRole("link", { name: linkName });
}

// Convenience helpers used by strict-mode-safe tests
export function programNav(page: Page): Locator {
  return getRegion(page, { role: "navigation", name: /program navigation/i });
}

export function sectionByHeading(page: Page, headingName: RegExp | string): Locator {
  const heading = page.getByRole("heading", { name: headingName });
  return page.locator("section", { has: heading });
}
