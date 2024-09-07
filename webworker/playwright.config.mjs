// @ts-check

import { defineConfig, devices } from "@playwright/test";
import { testPort, testUrl } from "./playwright.shared.mjs";

export default defineConfig({
  "testDir": ".",
  "projects": [
    {
      "name": "Pixel 7 (chromium)",
      "use": { ...devices["Pixel 7"] }
    },
    {
      "name": "Desktop Firefox (firefox)",
      "use": { ...devices["Desktop Firefox"] }
    },
    {
      "name": "iPhone 13 (webkit)",
      "use": { ...devices["iPhone 13"] }
    }
  ],
  "webServer": [
    {
      "command": `npm exec --yes -- serve --listen ${testPort}`,
      "url": testUrl
    }
  ]
});
