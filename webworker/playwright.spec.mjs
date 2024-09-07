// @ts-check

import { expect, test } from "@playwright/test";
import { testUrl } from "./playwright.shared.mjs";

const bannerId = "qunit-banner";
const failClass = "qunit-fail";
const passClass = "qunit-pass";
const failSelector = `#${bannerId}.${failClass}`;
const passSelector = `#${bannerId}.${passClass}`;

test("Test site QUnit", async ({ page }) => {
  await page.goto(testUrl);
  const bannerLocator = page.locator(`${passSelector}, ${failSelector}`);
  await bannerLocator.waitFor();
  await expect(bannerLocator).toHaveClass(passClass, { "timeout": 1 });
});
