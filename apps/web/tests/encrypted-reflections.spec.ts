import { expect, test } from "@playwright/test";

const sprint1Paths = ["/", "/plan", "/daily", "/check-in", "/red-flags"] as const;

test("Sprint 1 slice pages have no support-storage save actions or encryption controls", async ({
  page,
}) => {
  for (const path of sprint1Paths) {
    await page.goto(path);

    await expect(page.getByRole("button", { name: /save daily completion/i })).toHaveCount(0);
    await expect(page.getByRole("button", { name: /save weekly check-in/i })).toHaveCount(0);
    await expect(page.getByText(/encrypt optional reflections/i)).toHaveCount(0);
    await expect(page.getByRole("link", { name: /support storage/i })).toHaveCount(0);
  }
});
