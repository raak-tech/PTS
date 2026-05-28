import { expect, test } from "@playwright/test";

test("Sprint 1 slice routes and navigation do not call /api/* from the browser", async ({
  page,
}) => {
  const apiRequests: string[] = [];
  page.on("request", (req) => {
    const url = req.url();
    if (url.includes("/api/")) {
      apiRequests.push(url);
    }
  });

  for (const path of ["/", "/plan", "/daily", "/check-in", "/red-flags"]) {
    await page.goto(path);
  }

  await page.goto("/");
  await page.getByLabel(/primary pain area/i).fill("Lower back");
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill("Sleep better");
  await page.getByRole("button", { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);

  await page.getByRole("link", { name: /open daily checklist/i }).click();
  await expect(page).toHaveURL(/\/daily/);
  await page.getByRole("link", { name: /back to week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/plan/);

  await page.getByRole("link", { name: /open weekly check-in/i }).click();
  await expect(page).toHaveURL(/\/check-in/);

  await page.goto("/");
  await page.getByLabel(/primary pain area/i).fill("Lower back");
  await page.getByLabel(/primary goal for the next 2 weeks/i).fill("Sleep better");
  await page.getByLabel(/i have (possible )?red flag symptoms/i).check();
  await page.getByRole("button", { name: /generate week 1 plan/i }).click();
  await expect(page).toHaveURL(/\/red-flags/);

  expect(apiRequests, `Unexpected /api requests:\n${apiRequests.join("\n")}`).toEqual([]);
});
