const { chromium } = require("playwright");
const fs = require("fs");
const XLSX = require("xlsx");

const companies = [
  "Caterpillar", "John Deere Wirtgen Group", "Bobcat Doosan Bobcat", "CASE Construction Equipment",
  "Komatsu", "Volvo Construction Equipment", "Liebherr", "DEVELON",
  "HD Hyundai Construction Equipment", "Wacker Neuson"
];

const GENERIC_WORDS = new Set(["group", "company", "equipment", "construction", "corporation", "international", "holding", "the", "und", "and", "die", "der"]);

const SKIP_DOMAINS = [
  "duckduckgo.com", "duck.ai", "linkedin.com", "facebook.com", "twitter.com", "x.com", "wikipedia.org", "youtube.com", "instagram.com", "tiktok.com",
  "apple.com", "apps.apple.com", "play.google.com", "microsoft.com", "chrome.google.com", "addons.mozilla.org",
  "amazon.com", "ebay.com", "booking.com", "tripadvisor.com", "trustpilot.com", "gmbh.de", "google.com", "bing.com", "yahoo.com", "ecosia.org",
  "finanzen.net", "finanzen.com", "reuters.com", "bloomberg.com", "handelsblatt.com", "manager-magazin.de", "capital.de", "businessinsider", "gruenderszene.de", "crunchbase.com",
  "onvista.de", "wallstreet-online", "boerse.", "ard.de", "justetf.com", "comdirect", "seekingalpha", "marketwatch", "cnbc.com", "yahoo.com/finance", "ariva.de", "guidants", "investing.com", "economist.com", "ft.com", "wsj.com",
  "spiegel.de", "focus.de", "welt.de", "sueddeutsche.de", "zeit.de", "n-tv.de", "tagesschau.de", "presseportal", "ots.at", "dapd", "branchenbuch", "gelbeseiten", "yellowpages", "katalog.", "lexikon.", "wikipedia.org", "wikimedia.org",
  "allgemeinebauzeitung.de", "bauzeitung."
];
const SKIP_HOST_PATTERNS = ["finanz", "boerse", "börse", "aktien", "stock", "magazin", "reuters", "bloomberg", "lexikon", "wiki", "katalog", "branchenbuch", "gelbeseiten", "yellowpages", "marktplatz", "investing", "presseportal", "ratings", "kurse.", "markets."];
const SKIP_PATH_PATTERNS = ["/aktie/", "/aktien/", "/news/", "/artikel/", "/article/", "/stock/", "/quote/", "/kurse/", "/markets/", "/investing/", "/ratings/"];

function csvEscape(v) {
  return `"${String(v ?? "").replace(/"/g, '""')}"`;
}

function getCompanyNameParts(companyName) {
  const slug = (companyName || "").toLowerCase().replace(/\s*(inc\.?|gmbh|ag|corp\.?|co\.?|llc|ltd\.?)\s*$/i, "").trim();
  return slug.split(/\s+/).filter(p => p.length > 1 && !GENERIC_WORDS.has(p));
}

function getCompetitorTokens(currentCompanyName, allCompanyNames) {
  const current = (currentCompanyName || "").toLowerCase().trim();
  const tokens = new Set();
  for (const name of allCompanyNames || []) {
    const n = (name || "").toLowerCase().trim();
    if (n === current) continue;
    const slug = n.replace(/\s*(inc\.?|gmbh|ag|corp\.?|co\.?|llc|ltd\.?)\s*$/i, "").trim();
    slug.split(/\s+/).filter(p => p.length > 1 && !GENERIC_WORDS.has(p)).forEach(p => tokens.add(p));
    const noSpace = slug.replace(/\s+/g, "");
    if (noSpace.length > 2) tokens.add(noSpace);
  }
  return Array.from(tokens);
}

function getDomainSlug(host) {
  const h = (host || "").replace(/^www\./, "").toLowerCase();
  const p = h.split(".");
  if (p.length >= 3 && p[p.length - 2] === "co" && ["uk", "jp", "nz", "kr"].includes(p[p.length - 1])) return p[0];
  return p.length >= 2 ? p[p.length - 2] : p[0] || "";
}

async function runDuckDuckGoSearch(page, query) {
  await page.goto("https://duckduckgo.com/", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);
  const search = page.locator('input[name="q"]');
  await search.waitFor({ timeout: 15000 });
  await search.fill(query);
  await page.keyboard.press("Enter");
  await page.waitForLoadState("domcontentloaded");
  await page.waitForTimeout(1500);
}

// Homepage-Kandidaten aus DDG: zuerst HTML-Endpoint, sonst normale Suche. Max 3, nach Domain-Match sortiert.
async function findCompanyHomepage(page, companyName, allCompanyNames) {
  const nameParts = getCompanyNameParts(companyName);
  const competitorTokens = getCompetitorTokens(companyName, allCompanyNames || [companyName]);
  const filter = { skipDomains: SKIP_DOMAINS, skipHostPatterns: SKIP_HOST_PATTERNS, skipPathPatterns: SKIP_PATH_PATTERNS, competitorTokens };

  let candidates = [];
  try {
    await page.goto("https://duckduckgo.com/html/?q=" + encodeURIComponent('"' + companyName + '"'), { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(1200);
    candidates = await page.evaluate(extractCandidateUrlsInBrowser, { mode: "html", filter });
  } catch (_) {}

  if (candidates.length === 0) {
    await runDuckDuckGoSearch(page, `"${companyName}"`);
    for (const frac of [0.25, 0.5, 0.75, 1]) {
      await page.evaluate((f) => { const h = document.documentElement.scrollHeight - window.innerHeight; if (h > 0) window.scrollTo(0, h * f); }, frac);
      await page.waitForTimeout(500);
    }
    candidates = await page.evaluate(extractCandidateUrlsInBrowser, { mode: "js", filter });
  }

  return sortByDomainMatch(candidates, nameParts).slice(0, 3);
}

function sortByDomainMatch(urls, nameParts) {
  return urls.slice().sort((a, b) => {
    try {
      const score = (u) => nameParts.some(p => getDomainSlug(new URL(u).hostname).includes(p) || p.includes(getDomainSlug(new URL(u).hostname))) ? 1 : 0;
      return score(b) - score(a);
    } catch (_) { return 0; }
  });
}

// Wird im Browser ausgeführt – Kandidaten-URLs von DDG-Seite (args: { mode, filter })
function extractCandidateUrlsInBrowser(args) {
  const { mode, filter } = args;
  const { skipDomains, skipHostPatterns, skipPathPatterns, competitorTokens } = filter;
  function getDomainSlug(host) {
    const h = (host || "").replace(/^www\./, "").toLowerCase();
    const p = h.split(".");
    if (p.length >= 3 && p[p.length - 2] === "co" && ["uk", "jp", "nz", "kr"].includes(p[p.length - 1])) return p[0];
    return p.length >= 2 ? p[p.length - 2] : p[0] || "";
  }
  function isBad(host, path) {
    if (!host || skipDomains.some(d => host.includes(d))) return true;
    if (skipHostPatterns.some(p => host.replace(/^www\./, "").includes(p))) return true;
    if (path && skipPathPatterns.some(p => path.includes(p))) return true;
    const slug = getDomainSlug(host);
    if (competitorTokens.some(t => slug.includes(t) || t.includes(slug))) return true;
    return false;
  }
  function resolveHref(href) {
    if (!href || !href.startsWith("/")) return href;
    try {
      const uddg = new URLSearchParams((href.split("?")[1] || "")).get("uddg");
      if (uddg) return decodeURIComponent(uddg);
    } catch (_) {}
    return href;
  }
  let links = [];
  if (mode === "html") {
    document.querySelectorAll("a.result__url, a.result__a").forEach((a) => {
      const h = resolveHref(a.getAttribute("href") || a.href || "");
      if (h && !h.startsWith("/")) links.push(h);
    });
  } else {
    const root = document.querySelector("#links") || document.body;
    const resultBlocks = root.querySelectorAll("article, [data-nrn='result'], .result");
    if (resultBlocks.length > 0) {
      resultBlocks.forEach((block) => {
        if (/werbung|anzeige|sponsored/i.test(block.textContent || "") && (block.textContent || "").length < 500) return;
        const a = block.querySelector("a[href^='http']");
        if (a) {
          const h = (a.href || "").trim();
          if (h && !h.includes("duckduckgo")) links.push(h);
        }
      });
    } else {
      Array.from(root.querySelectorAll("a[href^='http']")).forEach((a) => {
        const parentText = (a.closest("article") || a.parentElement?.parentElement)?.textContent || "";
        if (/werbung|anzeige|sponsored/i.test(parentText) && parentText.length < 500) return;
        const h = (a.href || "").trim();
        if (h && !h.includes("duckduckgo")) links.push(h);
      });
    }
  }
  const out = [];
  const seen = new Set();
  for (const href of links) {
    try {
      const url = new URL(href);
      const host = url.hostname.toLowerCase();
      const path = (url.pathname || "").toLowerCase();
      if (isBad(host, path)) continue;
      if (/^(apps?|itunes|search)\./.test(host) || host.includes("store.") || host.includes("play.google")) continue;
      const norm = href.replace(/\/$/, "");
      if (seen.has(norm)) continue;
      seen.add(norm);
      out.push(href);
      if (out.length >= 5) break;
    } catch (_) {}
  }
  return out;
}

async function pickBestCompanyHomepage(page, candidateUrls, companyName) {
  if (!candidateUrls?.length) return "";
  const nameParts = getCompanyNameParts(companyName);
  const scores = [];
  for (const urlStr of candidateUrls) {
    let score = 0;
    try {
      await page.goto(urlStr, { waitUntil: "domcontentloaded", timeout: 12000 });
      await page.waitForTimeout(1500);
      const { title, h1, host } = await page.evaluate(() => ({
        title: document.title || "",
        h1: (document.querySelector("h1")?.textContent || "").trim(),
        host: window.location.hostname || ""
      }));
      const lower = (t, h, ho) => [t, h, ho].join(" ").toLowerCase();
      for (const part of nameParts) {
        if (part.length < 3) continue;
        if (lower(title, h1, host).includes(part)) {
          if ((title || "").toLowerCase().includes(part)) score += 2;
          if ((h1 || "").toLowerCase().includes(part)) score += 1;
          if ((host || "").toLowerCase().includes(part)) score += 0.5;
        }
      }
    } catch (_) { score = -1; }
    scores.push({ url: urlStr, score });
  }
  const best = scores.filter(s => s.score >= 0).sort((a, b) => b.score - a.score)[0];
  return best ? best.url : candidateUrls[0];
}

async function findLinkedInUrlOnHomepage(page, homepageUrl) {
  if (!homepageUrl) return "";
  try {
    await page.goto(homepageUrl, { waitUntil: "domcontentloaded", timeout: 20000 });
    await page.waitForTimeout(3000);
    for (const frac of [0, 0.25, 0.5, 0.75, 1]) {
      await page.evaluate((f) => { const h = document.documentElement.scrollHeight - window.innerHeight; window.scrollTo(0, h * f); }, frac);
      await page.waitForTimeout(frac === 1 ? 2000 : 800);
    }
    return await page.evaluate(() => {
      const withPos = [];
      const add = (href, el) => {
        if (!href || typeof href !== "string") return;
        const h = href.trim();
        if (!h.includes("linkedin.com/company/") || /\/jobs|\/posts|\/life/.test(h)) return;
        const m = h.match(/linkedin\.com\/company\/([^/?]+)/);
        if (m) withPos.push({ url: "https://www.linkedin.com/company/" + m[1] + "/", top: (el?.getBoundingClientRect?.()?.top ?? 0) + window.scrollY });
      };
      document.querySelectorAll("a[href*='linkedin'], [data-href*='linkedin'], [data-url*='linkedin']").forEach((el) => {
        add(el.href || el.getAttribute("href") || el.getAttribute("data-href") || el.getAttribute("data-url"), el);
      });
      document.querySelectorAll("a").forEach((a) => { const h = a.href || a.getAttribute("href") || ""; if (h.includes("linkedin")) add(h, a); });
      withPos.sort((a, b) => b.top - a.top);
      const seen = new Set();
      for (const { url } of withPos) if (!seen.has(url)) { seen.add(url); return url; }
      return "";
    });
  } catch (_) { return ""; }
}

async function findLinkedInCompanyUrlViaDDG(page, companyName) {
  await runDuckDuckGoSearch(page, `"${companyName}" LinkedIn`);
  await page.waitForTimeout(1500);
  // Kurz scrollen, damit erste Ergebnisse sichtbar geladen sind
  await page.evaluate(() => { const h = document.documentElement.scrollHeight - window.innerHeight; if (h > 0) window.scrollTo(0, Math.min(200, h)); });
  await page.waitForTimeout(500);
  // Erst versuchen: ersten passenden Link in #links anklicken (das ist der sichtbare Treffer)
  const linkSelector = "#links a[href*='linkedin.com/company/']";
  const firstLink = page.locator(linkSelector).first();
  const count = await firstLink.count().catch(() => 0);
  if (count > 0) {
    const href = await firstLink.getAttribute("href").catch(() => null);
    if (href && !/\/jobs|\/posts|\/life/.test(href)) {
      const m = href.match(/https?:\/\/[^/]*linkedin\.com\/company\/([^/?]+)/);
      if (m) return "https://www.linkedin.com/company/" + m[1] + "/";
    }
  }
  // Sonst aus dem Ergebnisbereich auslesen (ohne Klick)
  const url = await page.evaluate(() => {
    const resultsArea = document.querySelector("#links");
    const anchors = resultsArea ? Array.from(resultsArea.querySelectorAll("a[href*='linkedin']")) : Array.from(document.querySelectorAll("a[href*='linkedin']"));
    for (const a of anchors) {
      const h = (a.href || a.getAttribute("href") || "").trim();
      if (!h || !h.includes("linkedin.com/company/") || /\/jobs|\/posts|\/life/.test(h)) continue;
      const m = h.match(/https?:\/\/[^/]*linkedin\.com\/company\/([^/?]+)/);
      if (m) return "https://www.linkedin.com/company/" + m[1] + "/";
    }
    return "";
  });
  if (url) return url;
  return await page.evaluate(() => {
    const anchors = Array.from(document.querySelectorAll("a[href*='linkedin.com/company/']"));
    for (const a of anchors) {
      const h = (a.href || "").trim();
      if (/\/jobs|\/posts|\/life/.test(h)) continue;
      const m = h.match(/https?:\/\/[^/]*linkedin\.com\/company\/([^/?]+)/);
      if (m) return "https://www.linkedin.com/company/" + m[1] + "/";
    }
    return "";
  });
}

async function readLinkedInCompanyName(browser, companyUrl) {
  if (!companyUrl) return "";
  const context = await browser.newContext();
  try {
    const page = await context.newPage();
    await page.goto(companyUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
    await page.waitForTimeout(2000);
    const name = await page.evaluate(() => {
      const title = (document.title || "").replace(/\s*\|\s*LinkedIn\s*$/i, "").trim();
      const h1 = (document.querySelector("h1")?.textContent || "").trim();
      if (h1 && !/^(Mitglied werden|Join|Follow|Verfolgen|Log in|Anmelden)$/i.test(h1) && h1.length < 100) return h1;
      return title && title.length < 150 ? title : h1 || title || "";
    });
    return name || "";
  } finally { await context.close(); }
}

// Browser wie ein normaler deutscher Nutzer (Chrome/Windows), damit DDG dieselben Ergebnisse liefert wie bei manueller Suche
const BROWSER_CONTEXT_OPTIONS = {
  locale: "de-DE",
  timezoneId: "Europe/Berlin",
  viewport: { width: 1280, height: 800 },
  userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  extraHTTPHeaders: { "Accept-Language": "de-DE,de;q=0.9,en;q=0.8" }
};

(async () => {
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext(BROWSER_CONTEXT_OPTIONS);
  const page = await context.newPage();
  const rows = [["input_company", "linkedin_company_url", "linkedin_company_name"]];

  for (const c of companies) {
    console.log("== lookup:", c);
    let url = "";
    console.log("  Suche: \"Unternehmensname\" LinkedIn");
    url = await findLinkedInCompanyUrlViaDDG(page, c);
    if (url) console.log("  LinkedIn gefunden:", url);
    if (!url) {
      console.log("  Fallback: über Unternehmensseite");
      const candidates = await findCompanyHomepage(page, c, companies);
      if (candidates.length > 0) {
        console.log("  Kandidaten:", candidates.length, candidates[0], candidates.length > 1 ? "..." : "");
        const homepage = await pickBestCompanyHomepage(page, candidates, c);
        console.log("  Homepage:", homepage);
        url = await findLinkedInUrlOnHomepage(page, homepage);
        if (url) console.log("  LinkedIn via Homepage:", url);
      }
    }
    const name = await readLinkedInCompanyName(browser, url);
    console.log(" ->", url || "(not found)", "|", name || "(no name)");
    rows.push([c, url, name]);
  }

  fs.mkdirSync("out", { recursive: true });
  const csvPath = "out/company_links.csv";
  fs.writeFileSync(csvPath, rows.map(r => r.map(csvEscape).join(",")).join("\n"), "utf-8");
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, "LinkedIn Company Links");
  const xlsxPath = "out/company_links.xlsx";
  XLSX.writeFile(wb, xlsxPath);
  console.log("✅ written: " + csvPath + " und " + xlsxPath + " (Tabelle)");
  await browser.close();
})();
