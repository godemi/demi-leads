/**
 * Deep-Research Stub (ohne LLM)
 * - Teilt Abfragen in kleinere Chunks
 * - Erzeugt Platzhalter-Longlist im gewünschten Tabellenformat
 * - Erste Schleife: Marktgröße schätzen (LLM später), Zielanzahl festlegen
 * - Longlist erzeugen (Platzhalter)
 * - Deep-Research pass: A/B/C/D klassifizieren + Reasoning schärfen
 * - C/D werden entfernt
 * - Später an LLM/Deep-Research andocken
 *
 * Ausgabe-Spalten:
 * Company, Industry, Target Industry, Country, URL, Address, Company Reasoning, Source URL,
 * Fit Check, Fit Class, Fit Reasoning, Keep (A/B)
 */

const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const CONFIG_PATH = path.join(__dirname, "config_deepsearch.json");
const EXAMPLE_PATH = path.join(__dirname, "config_deepsearch_example.json");
const OUT_DIR = path.join(__dirname, "out");

const DEFAULT_CONFIG = {
  chunk_size: 5,
  rows_per_query: 10,
  queries: []
};

function loadConfig() {
  if (fs.existsSync(CONFIG_PATH)) {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) };
  }
  if (fs.existsSync(EXAMPLE_PATH)) {
    return { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(EXAMPLE_PATH, "utf-8")) };
  }
  return DEFAULT_CONFIG;
}

function chunkArray(arr, size) {
  const out = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function placeholderCompanyName(q, idx) {
  const base = (q.target_industry || "Company").replace(/[^a-zA-Z0-9äöüÄÖÜß ]/g, "").trim();
  const short = base.length > 30 ? base.slice(0, 30).trim() : base;
  return `${short} Company ${String(idx + 1).padStart(2, "0")}`;
}

function buildRowsForQuery(q, rowsPerQuery) {
  const rows = [];
  for (let i = 0; i < rowsPerQuery; i++) {
    rows.push({
      Company: placeholderCompanyName(q, i),
      Industry: q.target_industry || q.derived_target_industry || "",
      "Target Industry": q.target_industry || q.derived_target_industry || "",
      Country: q.country || "",
      URL: "",
      Address: "",
      "Company Reasoning": `Platzhalter: ${q.product ? `Produkt ${q.product} ` : ""}im Zielmarkt ${q.target_market}.`,
      "Source URL": "",
      "Estimated Market Size": q.estimated_market_size ?? "",
      "Target Count": q.target_count ?? "",
      "Fit Check": "",
      "Fit Class": "",
      "Fit Reasoning": "",
      "Keep (A/B)": ""
    });
  }
  return rows;
}

// --- Schleife 0: Marktgröße schätzen (Stub) ---
function estimateMarketSize(q) {
  // Platzhalter: nutze config.estimated_market_size oder fallback auf rows_per_query
  if (typeof q.estimated_market_size === "number") return q.estimated_market_size;
  return Math.max(10, q.rows_per_query || 10);
}
// --- Typ 3/4: Ziel-Unternehmenstyp aus Persona ableiten (Stub-Heuristik) ---
function deriveCompanyTypeFromPersona(persona) {
  const p = (persona || "").toLowerCase();
  if (p.includes("arzt") || p.includes("augenarzt") || p.includes("zahnarzt")) return "Arztpraxen";
  if (p.includes("krankenhaus") || p.includes("klinik") || p.includes("hygiene")) return "Krankenhäuser und Kliniken";
  if (p.includes("ordnungsamt") || p.includes("behörde") || p.includes("amt")) return "Öffentliche Verwaltung / Behörden";
  if (p.includes("werkschutz") || p.includes("industrieanlage") || p.includes("prozessingenieur") || p.includes("petrochemie")) return "Industrieunternehmen";
  if (p.includes("hausmeister")) return "Facility Management / Hausmeisterdienste";
  if (p.includes("gastro") || p.includes("gastronomie") || p.includes("hotel") || p.includes("restaurant")) return "Gastronomie / Hotellerie";
  if (p.includes("handwerk") || p.includes("handwerker") || p.includes("meister")) return "Handwerksbetriebe";
  return "Unternehmen (nicht spezifiziert)";
}

function decideTargetCount(estimated) {
  if (estimated < 100) return estimated;
  return 100;
}

// --- Schleife 1: Produktfit prüfen (Stub) ---
function productFitCheck(row, q) {
  // Platzhalterlogik: Typ 1/2 => prüfen, Typ 3/4 => überspringen
  if (q.typ === 1 || q.typ === 2) {
    row["Fit Check"] = "checked";
    row["Fit Reasoning"] = `Stub: Produktfit für ${q.product} angenommen.`;
  } else {
    row["Fit Check"] = "skipped";
    row["Fit Reasoning"] = "Typ 3/4: Commodity, kein Produktfit-Check.";
  }
}

// --- Schleife 2: A/B/C/D Klassifikation (Stub) ---
function classifyABCD(row, q) {
  if (q.typ === 1 || q.typ === 2) {
    // Stub-Logik: A für erste 20%, B für nächste 30%, C/D für Rest
    const idx = row.__idx || 0;
    const n = q.rows_per_query || 10;
    const pct = (idx + 1) / n;
    if (pct <= 0.2) row["Fit Class"] = "A";
    else if (pct <= 0.5) row["Fit Class"] = "B";
    else if (pct <= 0.8) row["Fit Class"] = "C";
    else row["Fit Class"] = "D";
    row["Keep (A/B)"] = (row["Fit Class"] === "A" || row["Fit Class"] === "B") ? "keep" : "drop";
      if (!row["Fit Reasoning"]) row["Fit Reasoning"] = `Stub: ABCD-Klasse ${row["Fit Class"]} basierend auf Rang.`;
  } else {
    row["Fit Class"] = "";
    row["Keep (A/B)"] = "";
  }
}

function runStub(config) {
  const queries = config.queries || [];
  const chunks = chunkArray(queries, Math.max(1, config.chunk_size || 5));

  const allRows = [];
  chunks.forEach((chunk, chunkIdx) => {
    console.log(`Chunk ${chunkIdx + 1}/${chunks.length} (${chunk.length} Abfragen)`);
    chunk.forEach((q, qIdx) => {
      console.log(`  - Abfrage ${qIdx + 1}: ${q.product} | ${q.target_market} | ${q.target_industry}`);
      // Typ 3/4: Ziel-Unternehmenstyp aus Persona ableiten (wenn target_industry nicht gesetzt)
      const derivedIndustry = (!q.target_industry && (q.typ === 3 || q.typ === 4))
        ? deriveCompanyTypeFromPersona(q.persona || "")
        : "";

      // Schleife 0: Marktgröße schätzen + Zielanzahl bestimmen
      const estimated = estimateMarketSize(q);
      const targetCount = decideTargetCount(estimated);
      const rowsPerQuery = Math.max(1, q.rows_per_query || config.rows_per_query || targetCount);
      const qCtx = {
        ...q,
        derived_target_industry: derivedIndustry,
        rows_per_query: rowsPerQuery,
        estimated_market_size: estimated,
        target_count: targetCount
      };

      // Longlist erzeugen (Platzhalter)
      let rows = buildRowsForQuery(qCtx, rowsPerQuery).map((r, i) => ({ ...r, __idx: i }));

      // Deep-Research Pass 1/2 (nur Typ 1/2)
      rows.forEach((r) => productFitCheck(r, qCtx));
      rows.forEach((r) => classifyABCD(r, qCtx));
      // C/D entfernen (nur wenn klassifiziert)
      rows = rows.filter((r) => r["Keep (A/B)"] !== "drop");

      allRows.push(...rows.map((r) => { const c = { ...r }; delete c.__idx; return c; }));
    });
  });

  return allRows;
}

function writeOutputs(rows) {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const headers = [
    "Company", "Industry", "Target Industry", "Country", "URL", "Address",
    "Company Reasoning", "Source URL", "Estimated Market Size", "Target Count",
    "Fit Check", "Fit Class", "Fit Reasoning", "Keep (A/B)"
  ];
  const csvPath = path.join(OUT_DIR, "deep_research_stub.csv");
  const csvLines = [headers.join(",")];
  rows.forEach((r) => {
    const line = headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",");
    csvLines.push(line);
  });
  fs.writeFileSync(csvPath, csvLines.join("\n"), "utf-8");

  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    headers,
    ...rows.map((r) => headers.map((h) => r[h] ?? ""))
  ]);
  XLSX.utils.book_append_sheet(wb, sheet, "Deep Research Stub");
  const xlsxPath = path.join(OUT_DIR, "deep_research_stub.xlsx");
  XLSX.writeFile(wb, xlsxPath);

  console.log("✅ CSV:", csvPath);
  console.log("✅ Excel:", xlsxPath);
}

function main() {
  const config = loadConfig();
  if (!config.queries || config.queries.length === 0) {
    console.log("Keine Abfragen gefunden. Lege config_deepsearch.json an (siehe config_deepsearch_example.json).");
    return;
  }
  const rows = runStub(config);
  writeOutputs(rows);
}

if (require.main === module) {
  main();
}

module.exports = { runStub, writeOutputs };
