const { chromium } = require("playwright");

(async () => {
  const browser = await chromium.connectOverCDP("http://localhost:9222");
  const context = browser.contexts()[0];

  // Nimm den aktuell offenen Tab, oder öffne einen neuen
  const page = context.pages()[0] || (await context.newPage());

  // Test: LinkedIn Feed öffnen (du siehst es live im Chrome)
  await page.goto("https://www.linkedin.com/feed/", { waitUntil: "domcontentloaded" });

  console.log("✅ Verbunden. Titel:", await page.title());

  // Verbindung trennen (Chrome bleibt offen)
  await browser.close();
})();
