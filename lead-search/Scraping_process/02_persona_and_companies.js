/**
 * Schritt vor der LinkedIn-Unternehmenssuche (01_company_lookup.js):
 * 1) Persona als "LinkedIn-Persona" oder "Non-LinkedIn-Persona" einstufen (LLM).
 * 2) Anhand Produkt, Zielmarkt und Branche passende Unternehmen ermitteln (LLM).
 *
 * Ausgabe: JSON + Excel/CSV mit Klassifikation und Unternehmensliste (für spätere Anbindung an 01_company_lookup).
 *
 * Umgebung: OPENAI_API_KEY (oder .env). Optional: OPENAI_BASE_URL für kompatible APIs.
 */

const OpenAI = require("openai");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "",
  baseURL: process.env.OPENAI_BASE_URL || undefined
});

// ---------- Konfiguration: aus config_persona.json oder Standardwerte ----------
const CONFIG_PATH = path.join(__dirname, "config_persona.json");
const DEFAULT_CONFIG = {
  persona: "Prozessingenieur in der Fertigung, verantwortlich für Effizienz und Qualität",
  product: "Hydraulik-Komponenten und Steuerungslösungen für mobile Arbeitsmaschinen",
  targetMarket: "DACH (Deutschland, Österreich, Schweiz)",
  industry: "Maschinenbau, Baumaschinen, Landtechnik",
  commodity_instruction: "" // optional, z.B. "nur Arztpraxen die auch operieren"
};
let CONFIG = DEFAULT_CONFIG;
try {
  if (fs.existsSync(CONFIG_PATH)) {
    CONFIG = { ...DEFAULT_CONFIG, ...JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8")) };
  }
} catch (_) {}

const OUT_DIR = path.join(__dirname, "out");
const MODEL_LIGHT = process.env.OPENAI_MODEL_LIGHT || process.env.OPENAI_MODEL || "gpt-4o-mini";
const MODEL_DEEP = process.env.OPENAI_MODEL_DEEP || "gpt-4o";

// ---------- 1) LinkedIn vs. Non-LinkedIn Persona (LLM) ----------
const PERSONA_CLASSIFY_SYSTEM = `Du bist ein Experte für B2B-Zielgruppen und LinkedIn-Nutzung.

Deine Aufgabe: Entscheide ausschließlich anhand der beschriebenen Persona, ob sie eine "LinkedIn-Persona" ist oder eine "Non-LinkedIn-Persona".

**LinkedIn-Persona** (typischerweise auf LinkedIn aktiv und gut auffindbar):
- Prozessingenieure, Entwicklungsleiter, R&D
- Vorstände, Geschäftsführer, C-Level
- Projektmanager, Product Owner
- IT-Verantwortliche, IT-Leiter, Software-Architekten
- Einkauf, Beschaffung, Supply Chain
- Vertriebsleiter, Marketing-Leitung
- Unternehmensberater, Berater

**Non-LinkedIn-Persona** (eher nicht oder wenig auf LinkedIn präsent):
- Ärzte, Klinikpersonal
- Leiter Ordnungsamt, Beamte, Behördenleitung
- Handwerker (Meister/Betriebsinhaber oft nur begrenzt)
- Gastronomen, Hotellerie (Inhaber/Küchenchef)
- Pflegeleitung, Heimleitung
- Einzelhandel (Inhaber)

Antworte NUR mit einem JSON-Objekt (kein anderer Text), Format:
{"is_linkedin_persona": true oder false, "reasoning": "kurze Begründung auf Deutsch (1-3 Sätze)"}`;

// ---------- 1b) LinkedIn vs. Non-LinkedIn Industry/Company Type (LLM) ----------
const INDUSTRY_CLASSIFY_SYSTEM = `Du bist ein Experte für B2B-Märkte und LinkedIn-Nutzung von Unternehmen/Organisationen.

Deine Aufgabe: Entscheide ausschließlich anhand der beschriebenen Branche, des Produkts und des Zielmarkts, ob die ZIELUNTERNEHMEN (Firmen, Behörden, Praxen etc.) typischerweise "LinkedIn-Unternehmen" sind oder "Non-LinkedIn-Unternehmen".

**LinkedIn Industry / LinkedIn Company** (Unternehmen sind typischerweise auf LinkedIn mit Firmenseiten vertreten, gut auffindbar):
- Industrieunternehmen, Maschinenbau, Automotive, Chemie
- Beratungen, Unternehmensberatung
- Softwareunternehmen, IT-Dienstleister
- Versicherungen, Banken (B2B)
- Großhandel, Technischer Handel

**Non-LinkedIn Industry / Non-LinkedIn Company** (Unternehmen/Organisationen eher nicht oder wenig auf LinkedIn präsent):
- Behörden, öffentliche Verwaltung, Ämter
- Krankenhäuser und Kliniken (auch wenn einzelne Träger LinkedIn haben, behandeln wir sie hier als Non-LinkedIn Industry)
- Arztpraxen
- Handwerksbetriebe (viele kleine Betriebe ohne Firmenprofil)
- Gastronomie, Hotellerie (Einzelbetriebe)
- Einzelhandel (lokale Läden)
- Pflegeheime, Soziale Einrichtungen (kleinere Träger)

Antworte NUR mit einem JSON-Objekt (kein anderer Text), Format:
{"is_linkedin_industry": true oder false, "reasoning": "kurze Begründung auf Deutsch (1-3 Sätze)"}`;

async function classifyPersona(persona) {
  const response = await openai.chat.completions.create({
    model: MODEL_LIGHT,
    messages: [
      { role: "system", content: PERSONA_CLASSIFY_SYSTEM },
      { role: "user", content: `Persona: ${persona}` }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  });
  const text = response.choices[0]?.message?.content?.trim() || "{}";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : { is_linkedin_persona: null, reasoning: "Parse fehlgeschlagen" };
  }
  return {
    is_linkedin_persona: !!parsed.is_linkedin_persona,
    reasoning: parsed.reasoning || ""
  };
}

async function classifyIndustryCompanyType(product, targetMarket, industry) {
  const userContent = [
    `Produkt: ${product}`,
    `Zielmarkt: ${targetMarket}`,
    `Branche/Industrie: ${industry || "(nicht angegeben)"}`
  ].join("\n");
  const response = await openai.chat.completions.create({
    model: MODEL_LIGHT,
    messages: [
      { role: "system", content: INDUSTRY_CLASSIFY_SYSTEM },
      { role: "user", content: userContent }
    ],
    response_format: { type: "json_object" },
    temperature: 0.2
  });
  const text = response.choices[0]?.message?.content?.trim() || "{}";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : { is_linkedin_industry: null, reasoning: "Parse fehlgeschlagen" };
  }
  return {
    is_linkedin_industry: !!parsed.is_linkedin_industry,
    reasoning: parsed.reasoning || ""
  };
}

// ---------- Typ 1–4 aus Persona × Industry (Matrix wie im Screenshot) ----------
function getTypAndLonglistMethod(linkedinPersona, linkedinIndustry) {
  const typ = linkedinPersona && linkedinIndustry ? 1
    : !linkedinPersona && linkedinIndustry ? 2
    : !linkedinPersona && !linkedinIndustry ? 3
    : 4; // linkedinPersona && !linkedinIndustry
  const longlistMethod = (typ === 1 || typ === 2) ? "Longlist über Produktinfo" : "Longlist über Geo Scraping";
  const typLabel = {
    1: "LinkedIn Persona + LinkedIn Industry (z.B. Process Engineer bei BASF)",
    2: "Non-LinkedIn Persona + LinkedIn Industry (z.B. Werkschutz bei BASF)",
    3: "Non-LinkedIn Persona + Non-LinkedIn Industry (z.B. Arzt, Leitung Ordnungsamt)",
    4: "LinkedIn Persona + Non-LinkedIn Industry (z.B. Behördenleiter, untypische Kombination)"
  };
  return { typ, longlistMethod, typLabel: typLabel[typ] };
}

// ---------- 2) Unternehmen finden (Produkt + Zielmarkt + Branche) ----------
const COMPANIES_SYSTEM = `Du bist ein Experte für B2B-Märkte und Branchen.

Aufgabe: Nenne Unternehmen (Firmennamen), die das beschriebene Produkt typischerweise kaufen oder einsetzen würden. Berücksichtige den Zielmarkt und die Branche.

- Nur reale oder realistische, konkrete Firmennamen (keine generischen Bezeichnungen wie "verschiedene Maschinenbauer").
- Wenn du dir unsicher bist, nenne trotzdem plausible Namen aus der Branche.
- Fokus auf den genannten Zielmarkt (z.B. DACH = deutsche/österreichische/schweizer Unternehmen).
- WICHTIG: Wenn Typ 1 oder Typ 2, basiere die Unternehmensauswahl primär auf der Produktspezifikation und dem Zielmarkt.
- WICHTIG: Wenn Typ 3 oder Typ 4, sind Zielunternehmen Commodity (breite Auswahl), außer es gibt eine spezifische Anweisung (z.B. "nur Arztpraxen die auch operieren"), dann diese Anweisung strikt beachten.

Antworte NUR mit einem JSON-Objekt (kein anderer Text), Format:
{
  "companies": [
    {"name": "Firmenname", "industry": "Kurzbeschreibung", "country": "DE/AT/CH", "linkedin_company": true oder false},
    ...
  ],
  "recommended_channel": "linkedin" oder "non_linkedin" oder "both",
  "note": "optional: kurzer Hinweis"
}

- linkedin_company: true = Unternehmen/Branche typischerweise auf LinkedIn mit Firmenseite (Industrie, Beratung, Software etc.), false = eher nicht (Behörde, Handwerk, Arztpraxis, Gastronomie etc.).
- Mindestens 15, maximal 40 Einträge in "companies".`;

async function findCompanies(product, targetMarket, industry, isLinkedInPersona, typInfo) {
  const userContent = [
    `Produkt: ${product}`,
    `Zielmarkt: ${targetMarket}`,
    `Branche/Industrie: ${industry}`,
    `Die Zielpersona wurde als ${isLinkedInPersona ? "LinkedIn-Persona" : "Non-LinkedIn-Persona"} eingestuft.`,
    `Typ-Klassifikation: Typ ${typInfo?.typ || "?"} (${typInfo?.typLabel || ""})`,
    `Longlist-Methode: ${typInfo?.longlistMethod || ""}`,
    `Commodity-Regel: Bei Typ 3/4 sind Zielunternehmen Commodity, außer es gibt eine spezifische Anweisung.`,
    `Spezifische Anweisung (falls vorhanden): ${typInfo?.commodityInstruction || "(keine)"}`
  ].join("\n");

  const response = await openai.chat.completions.create({
    model: MODEL_DEEP,
    messages: [
      { role: "system", content: COMPANIES_SYSTEM },
      { role: "user", content: userContent }
    ],
    response_format: { type: "json_object" },
    temperature: 0.4
  });
  const text = response.choices[0]?.message?.content?.trim() || "{}";
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch (e) {
    const match = text.match(/\{[\s\S]*\}/);
    parsed = match ? JSON.parse(match[0]) : { companies: [], recommended_channel: "both", note: "" };
  }
  const companies = Array.isArray(parsed.companies) ? parsed.companies : [];
  return {
    companies: companies.map((c) => ({
      name: typeof c === "string" ? c : (c.name || c.firma || ""),
      industry: typeof c === "object" ? (c.industry || c.branche || "") : "",
      country: typeof c === "object" ? (c.country || "") : "",
      linkedin_company: typeof c === "object" && c.linkedin_company === true
    })),
    recommended_channel: parsed.recommended_channel || "both",
    note: parsed.note || ""
  };
}

// ---------- Ausgabe: JSON + Excel (Tabelle), optional CSV für 01_company_lookup ----------
function writeOutput(result) {
  ensureTypFields(result);
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const base = path.join(OUT_DIR, "persona_companies");
  const jsonPath = base + ".json";
  fs.writeFileSync(jsonPath, JSON.stringify(result, null, 2), "utf-8");
  console.log("✅ JSON:", jsonPath);

  const wb = XLSX.utils.book_new();

  const sheet1 = XLSX.utils.aoa_to_sheet([
    ["Persona", result.persona],
    ["Produkt", result.product],
    ["Zielmarkt", result.targetMarket],
    ["Branche", result.industry],
    [],
    ["LinkedIn-Persona?", result.classification.is_linkedin_persona ? "Ja" : "Nein"],
    ["Begründung Persona", result.classification.reasoning],
    [],
    ["LinkedIn Industry/Company?", result.industryClassification?.is_linkedin_industry ? "Ja" : "Nein"],
    ["Begründung Industry", result.industryClassification?.reasoning || ""],
    [],
    ["Typ (1–4)", result.typ],
    ["Typ Beschreibung", result.typLabel || ""],
    ["Longlist-Methode", result.longlistMethod || ""],
    ["Commodity-Anweisung", result.commodityInstruction || ""],
    [],
    ["Empfohlener Kanal", result.companiesResult.recommended_channel],
    ["Hinweis", result.companiesResult.note]
  ]);
  XLSX.utils.book_append_sheet(wb, sheet1, "Persona & Typ");

  const companyRows = [
    ["name", "industry", "country", "linkedin_company"],
    ...result.companiesResult.companies.map((c) => [c.name, c.industry, c.country, c.linkedin_company ? "Ja" : "Nein"])
  ];
  const sheet2 = XLSX.utils.aoa_to_sheet(companyRows);
  XLSX.utils.book_append_sheet(wb, sheet2, "Unternehmen");
  const xlsxPath = base + ".xlsx";
  XLSX.writeFile(wb, xlsxPath);
  console.log("✅ Excel:", xlsxPath);

  const csvPath = path.join(OUT_DIR, "companies_for_lookup.csv");
  const csvHeader = "company_name,industry,country,linkedin_company";
  const csvRows = result.companiesResult.companies.map((c) =>
    [c.name, c.industry, c.country, c.linkedin_company ? "1" : "0"].map((v) => `"${String(v).replace(/"/g, '""')}"`).join(",")
  );
  fs.writeFileSync(csvPath, csvHeader + "\n" + csvRows.join("\n"), "utf-8");
  console.log("✅ CSV (für 01_company_lookup):", csvPath);
}

// Rückwärtskompatibel: industryClassification/typ/longlistMethod können fehlen (alte Ergebnisse)
function ensureTypFields(result) {
  if (result.typ != null) return result;
  const linkedinPersona = result.classification?.is_linkedin_persona ?? false;
  const linkedinIndustry = result.industryClassification?.is_linkedin_industry ?? false;
  const { typ, longlistMethod, typLabel } = getTypAndLonglistMethod(linkedinPersona, linkedinIndustry);
  result.industryClassification = result.industryClassification || { is_linkedin_industry: linkedinIndustry, reasoning: "" };
  result.typ = typ;
  result.typLabel = typLabel;
  result.longlistMethod = longlistMethod;
  return result;
}

// ---------- Hauptablauf ----------
async function run(config) {
  const { persona, product, targetMarket, industry, commodity_instruction } = config;
  if (!process.env.OPENAI_API_KEY && !config.apiKey) {
    console.error("OPENAI_API_KEY fehlt. Setze die Umgebungsvariable oder config.apiKey.");
    process.exit(1);
  }
  if (config.apiKey) openai.apiKey = config.apiKey;

  console.log("Persona:", persona);
  console.log("Produkt:", product);
  console.log("Zielmarkt:", targetMarket);
  console.log("Branche:", industry || "(nicht angegeben)");
  console.log("");

  console.log("1) Klassifiziere Persona (LinkedIn vs. Non-LinkedIn) …");
  const classification = await classifyPersona(persona);
  console.log("   ->", classification.is_linkedin_persona ? "LinkedIn-Persona" : "Non-LinkedIn-Persona");
  console.log("   Begründung:", classification.reasoning);
  console.log("");

  console.log("2) Klassifiziere Industry/Company Type (LinkedIn vs. Non-LinkedIn) …");
  const industryClassification = await classifyIndustryCompanyType(product, targetMarket, industry || "");
  console.log("   ->", industryClassification.is_linkedin_industry ? "LinkedIn Industry" : "Non-LinkedIn Industry");
  console.log("   Begründung:", industryClassification.reasoning);
  console.log("");

  const { typ, longlistMethod, typLabel } = getTypAndLonglistMethod(classification.is_linkedin_persona, industryClassification.is_linkedin_industry);
  console.log("3) Einstufung: Typ", typ);
  console.log("   ", typLabel);
  console.log("   Longlist-Methode:", longlistMethod);
  console.log("");

  console.log("4) Finde passende Unternehmen (LLM) …");
  const companiesResult = await findCompanies(
    product,
    targetMarket,
    industry || "",
    classification.is_linkedin_persona,
    { typ, typLabel, longlistMethod, commodityInstruction: commodity_instruction || "" }
  );
  console.log("   ->", companiesResult.companies.length, "Unternehmen");
  console.log("   Kanal:", companiesResult.recommended_channel);
  if (companiesResult.note) console.log("   Hinweis:", companiesResult.note);
  console.log("");

  const result = {
    persona,
    product,
    targetMarket,
    industry: industry || "",
    classification,
    industryClassification,
    typ,
    typLabel,
    longlistMethod,
    commodityInstruction: commodity_instruction || "",
    companiesResult,
    generatedAt: new Date().toISOString()
  };

  writeOutput(result);
  return result;
}

if (require.main === module) {
  run(CONFIG).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}

// Hinweis: companies_for_lookup.csv kann später von 01_company_lookup.js eingelesen werden
// (Spalte company_name = Firmenname für die Suche).

module.exports = { run, classifyPersona, classifyIndustryCompanyType, getTypAndLonglistMethod, findCompanies };
