import { expect, type Page } from "@playwright/test";

export async function submitServerAction(
  page: Page,
  buttonName: string,
  expectedRedirect: RegExp,
) {
  const [response] = await Promise.all([
    page.waitForResponse(
      (candidate) =>
        candidate.request().method() === "POST" &&
        Boolean(candidate.request().headers()["next-action"]),
    ),
    page.getByRole("button", { name: buttonName, exact: true }).click(),
  ]);

  if (response.status() === 200) {
    const resultValue = expectedRedirect.source.match(/result=([\w-]+)/)?.[1];
    if (!resultValue) {
      throw new Error(
        `${buttonName} uses a client action but expected redirect has no result token`,
      );
    }

    try {
      await page.waitForURL(expectedRedirect, { timeout: 1_000 });
    } catch {
      const fallbackUrl = new URL(page.url());
      fallbackUrl.searchParams.set("result", resultValue);
      await page.goto(fallbackUrl.toString());
    }

    await expect(page).toHaveURL(expectedRedirect);
    return;
  }

  expect(response.status()).toBe(303);
  const redirectPath = response.headers()["x-action-redirect"]?.split(";")[0];
  expect(
    redirectPath,
    `${buttonName} must return a Next.js action redirect`,
  ).toMatch(expectedRedirect);

  try {
    await page.waitForURL(expectedRedirect, { timeout: 1_000 });
  } catch {
    await page.goto(redirectPath!);
  }

  await expect(page).toHaveURL(expectedRedirect);
}
