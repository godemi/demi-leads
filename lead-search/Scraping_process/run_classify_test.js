/**
 * Test: Klassifiziert die 7 Produkt-Persona-Paare aus der Tabelle
 * (Persona → LinkedIn/Non-LinkedIn, Industry → LinkedIn/Non-LinkedIn, Typ 1–4)
 */

const { classifyPersona, classifyIndustryCompanyType, getTypAndLonglistMethod } = require("./02_persona_and_companies");
const fs = require("fs");
const path = require("path");
const XLSX = require("xlsx");

const ROWS = [
  { product: "EnviroFALK HSC Hochschrankanlage", persona: "Augenarzt Norddeutschland" },
  { product: "EnviroFALK HSC Hochschrankanlage", persona: "Hygieneverantwortlicher Krankenhaus" },
  { product: "DataCollect DSD Flex", persona: "Werkschutzleitung Industrieanlage" },
  { product: "DataCollect RSD Seitenradar", persona: "Ordnungsamtleitung Süddeutschland" },
  { product: "Munsch Pumpe NPC", persona: "Prozessingenieur Petrochemie" },
  { product: "Cotraco Kärcher k-mop 46 Bp", persona: "Gastrobetriebe Bayern" },
  { product: "Cotraco Kärcher B 260 RI", persona: "Hausmeister Automotiveunternehmen" }
];

async function main() {
  if (!process.env.OPENAI_API_KEY) {
    console.error("OPENAI_API_KEY setzen (Umgebungsvariable).");
    process.exit(1);
  }

  const results = [];
  for (let i = 0; i < ROWS.length; i++) {
    const { product, persona } = ROWS[i];
    console.log(`[${i + 1}/${ROWS.length}] ${persona} | ${product}`);
    const classification = await classifyPersona(persona);
    const industryClassification = await classifyIndustryCompanyType(product, "DACH", persona);
    const { typ, longlistMethod, typLabel } = getTypAndLonglistMethod(classification.is_linkedin_persona, industryClassification.is_linkedin_industry);
    results.push({
      product,
      persona,
      linkedin_persona: classification.is_linkedin_persona ? "Ja" : "Nein",
      persona_reasoning: classification.reasoning,
      linkedin_industry: industryClassification.is_linkedin_industry ? "Ja" : "Nein",
      industry_reasoning: industryClassification.reasoning,
      typ,
      typLabel,
      longlistMethod
    });
  }

  console.log("\n========== ERGEBNIS (Tabelle) ==========\n");
  const header = "Produkt | Persona | LinkedIn Persona? | LinkedIn Industry? | Typ | Longlist-Methode";
  console.log(header);
  console.log("-".repeat(header.length));
  results.forEach((r) => {
    console.log([r.product, r.persona, r.linkedin_persona, r.linkedin_industry, "Typ " + r.typ, r.longlistMethod].join(" | "));
  });

  const outDir = path.join(__dirname, "out");
  fs.mkdirSync(outDir, { recursive: true });
  const wb = XLSX.utils.book_new();
  const sheet = XLSX.utils.aoa_to_sheet([
    ["Produkt", "Persona", "LinkedIn Persona?", "Begründung Persona", "LinkedIn Industry?", "Begründung Industry", "Typ", "Typ Beschreibung", "Longlist-Methode"],
    ...results.map((r) => [
      r.product,
      r.persona,
      r.linkedin_persona,
      r.persona_reasoning,
      r.linkedin_industry,
      r.industry_reasoning,
      "Typ " + r.typ,
      r.typLabel,
      r.longlistMethod
    ])
  ]);
  XLSX.utils.book_append_sheet(wb, sheet, "Klassifikation");
  XLSX.writeFile(wb, path.join(outDir, "classify_test_ergebnis.xlsx"));
  console.log("\n✅ Excel: out/classify_test_ergebnis.xlsx");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
