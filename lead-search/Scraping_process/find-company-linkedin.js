const { chromium } = require("playwright");

async function findLinkedInCompanyUrl(page, companyName) {
  // DuckDuckGo ist meist ohne Consent/Captcha
  await page.goto("https://duckduckgo.com/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // Suchfeld
  const search = page.locator('input[name="q"]');
  await search.waitFor({ timeout: 15000 });

  await search.fill(`${companyName} site:linkedin.com/company`);
  await page.keyboard.press("Enter");

  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1200);

  // LinkedIn /company/ Link extrahieren
  const companyUrl = await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a"));
  
    const candidates = anchors
      .map(a => a.href)
      .filter(h =>
        h &&
        h.includes("linkedin.com/company/") &&
        !h.includes("/jobs") &&
        !h.includes("/posts") &&
        !h.includes("/life")
      );
  
    // Oft sind Links über Redirects getarnt → echten URL-Teil extrahieren
    const clean = candidates.map(h => {
      const match = h.match(/https:\/\/www\.linkedin\.com\/company\/[^/?]+/);
      return match ? match[0] + "/" : null;
    }).filter(Boolean);
  
    return clean[0] || "";
  });  

  return companyUrl;
}

(async () => {
  const browser = await chromium.launch({ headless: false });
  const page = await browser.newPage();

  const url = await findLinkedInCompanyUrl(page, "Alamo Group Inc.");
  console.log("✅ LinkedIn company URL:", url || "(not found)");

  await browser.close();
})();

