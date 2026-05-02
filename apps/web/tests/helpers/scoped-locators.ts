import type { Locator, Page } from "@playwright/test";

export function getRegion(page: Page, name: RegExp | string) {
  return page.getByRole("navigation", { name });
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
