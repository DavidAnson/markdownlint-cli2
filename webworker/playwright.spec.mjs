// @ts-check

import { expect, test } from "@playwright/test";
import { testUrl } from "./playwright.shared.mjs";

const bannerId = "qunit-banner";
const failClass = "qunit-fail";
const passClass = "qunit-pass";
const userAgentId = "qunit-userAgent";
const userAgentSelector = `#${userAgentId}`;
const failSelector = `#${bannerId}.${failClass}`;
const passSelector = `#${bannerId}.${passClass}`;

test("Test site QUnit", async ({ page }) => {
  await page.goto(testUrl);
  const bannerLocator = page.locator(`${passSelector}, ${failSelector}`);
  await bannerLocator.waitFor();
  const userAgentLocator = page.locator(userAgentSelector);
  const userAgent = await userAgentLocator.textContent() || "[UNKNOWN]";
  const path = `playwright-screenshot-${userAgent.replaceAll(/[ ,/:;\\]/gu, "_")}.png`;
  await page.screenshot({ path, "fullPage": true });
  await expect(bannerLocator).toHaveClass(passClass, { "timeout": 1 });
});
