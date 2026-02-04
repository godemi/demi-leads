# Lead search process (replicable) — demi-leads

This document describes, step-by-step, the exact process used for the Eckerle lead search so you can run the same workflow in a separate project called **`demi-leads`**.

The output contract is:

- **Intermediate artifacts**: markdown files (auditable, with source URLs)
- **Final deliverable**: a single CSV containing **20 named leads** (people + roles) with reasoning and evidence URLs

---

## 0) Working definitions (lock these first)

1. **Event definition**
   - “CONEXPO” = CONEXPO-CON/AGG (and its official exhibitor directory for the relevant year).

2. **Market definition**
   - **US market**: HQ in US or major US operations.
   - **DACH market**: HQ in Germany/Austria/Switzerland or major operations there.

3. **Company size rule**
   - **Small**: \< 200 employees (or unknown → treat as small until verified).
   - **Large**: ≥ 200 employees.

4. **Persona targeting rule**
   - **Small**: prioritize **R&D / Engineering leadership** (hydraulics/fluid power-related).
   - **Large**: prioritize **Strategic Procurement / Sourcing** AND **R&D Hydraulics / Fluid Technology**.

---

## 1) Create the output folder structure

Create a per-client folder for the engagement and keep everything in it:

Example used here:

- `lead-search/eckerle/`

Files written (same pattern should be used in `demi-leads`):

- `00-sources.md` — authoritative event sources + extraction notes
- `01-exhibitors-raw.md` — raw exhibitor records (as extracted)
- `02-exhibitors-clean.md` — normalized + deduped canonical company records
- `03-fit-screening.md` — buyer-fit screening decisions + evidence URLs
- `04-market-filter.md` — US/DACH market evidence per company
- `05-prioritized-companies.md` — scoring table (0–100) + selected targets
- `06-personas.md` — found personas per company + evidence
- `leads.csv` — final 20-lead CSV

---

## 2) Identify the official exhibitor source (CONEXPO directory)

What we did:

1. Found the official CONEXPO “Exhibitor Directory” landing page.
2. Followed it to the official directory portal (MapYourShow-backed).
3. Confirmed exhibitor profile pages have stable URLs of the form:
   - `.../exhibitor/exhibitor-details.cfm?exhid=<id>`

How we documented it:

- Wrote the primary URLs + extraction approach into `00-sources.md`.

Key lesson:

- The directory “gallery/list” pages can be client-rendered and hard to scrape reliably via plain HTML fetch.
- The exhibitor detail pages are stable and provide **traceable evidence URLs** for each exhibitor.

---

## 3) Build the exhibitor universe (raw)

What we did (practical method):

1. Opened the official exhibitor gallery/list page.
2. Used the built-in search box to locate target exhibitors by name.
3. Clicked the exhibitor result to open the exhibitor detail page.
4. Extracted the following from each exhibitor detail page:
   - `company_name`
   - `booth / hall`
   - `website`
   - `country / location`
   - `category/tags` (product categories listed)
   - `short_description` (from “About” section)
   - `conexpo_evidence_url` (the exhibitor detail page URL)
5. Appended rows into `01-exhibitors-raw.md`.

Notes:

- In the Eckerle run, we used a **targeted working universe** (not all ~2,000 exhibitors) to reliably reach 20 leads fast.
- In a generalized pipeline, you can also bulk-extract via Firecrawl/API if the directory exposes a crawlable index or API.

---

## 4) Normalize + deduplicate (clean)

What we did:

1. Created canonical names by stripping legal suffixes (Inc/LLC/etc) and normalizing casing.
2. Extracted the **website domain** (primary dedupe key).
3. Created `02-exhibitors-clean.md` containing:
   - `company_name_canonical`
   - `website_domain`
   - `booth / hall`
   - `country (from directory)`
   - `source_company_name`
   - `conexpo_evidence_url`

Deduping rules:

- **Primary**: website domain exact match.
- **Secondary**: fuzzy company name match (only if domain missing).

---

## 5) Buyer-fit screening (candidate buyer relevance)

Goal:

- Keep only companies that plausibly **buy** Eckerle-like products/services (OEM/end user/integrator) and are relevant to hydraulics/fluid power.

What we did:

1. For each company, inferred **buyer-fit** and **hydraulics relevance** from:
   - CONEXPO directory: product categories + “About” + “New Product Showcase” sections
   - (Optionally) company website pages: `/about`, `/products`, `/solutions`, `/industries`, `/technology`
2. Classified each company:
   - `buyer_fit`: high / medium / drop
   - `hydraulics_relevance`: strong / moderate
3. Logged decisions and the reasoning in `03-fit-screening.md` with evidence URLs.

Drop rule:

- If there is **no** evidence of being a buyer/end user/integrator **and** no hydraulics relevance → drop.

---

## 6) Market filter: US or DACH only

What we did:

1. Verified HQ/major presence via:
   - CONEXPO exhibitor “Company Information” address and country
   - (Optionally) company website contact/locations pages
2. Kept only US and/or DACH; logged evidence in `04-market-filter.md`.

---

## 7) Prioritize companies (scoring)

What we did:

1. Applied the scoring rubric (0–100) consistently for each company.
2. Sorted descending and documented in `05-prioritized-companies.md`.
3. Selected the top set for persona discovery, targeting 2–3 personas per company until reaching 20 leads.

Scoring rubric (example used):

- Buyer fit: high +40, medium +20
- Hydraulics relevance: strong +25, moderate +10
- Market match: HQ in US/DACH +20, major presence only +10
- Size: ≥200 +10, <200 +5 (unknown treated as small +5 but marked unknown)
- Penalty safeguard: likely competitor −50

---

## 8) Enrich company size (employees)

What we did (where possible):

- Looked for employee counts on:
  - company site (“About”)
  - public LinkedIn company pages (no login)
  - reputable public directories (only if viewable)

If not found:

- Set `employee_count = null`
- Defaulted the persona logic to “large” only when clearly known; otherwise kept unknown.

---

## 9) Persona discovery (named contacts)

Goal:

- Find named individuals matching role targets per company size.

What we did (layered approach):

1. **CONEXPO exhibitor pages**:
   - Some exhibitor pages include named contacts (often marketing/events).
   - Even when not the ideal persona, these can be strong “routing” contacts.
2. **Company press releases / news pages**:
   - Great for named leaders with explicit titles and high confidence.
3. **Public LinkedIn pages** (no login):
   - Used for additional named people + titles when publicly accessible.
4. Captured per-person fields:
   - `person_name`
   - `role_title`
   - `persona_type` (R&D / Strategic Procurement / Hybrid / Other)
   - `location` (if shown)
   - `source_url`
   - `confidence`
5. Logged per-company in `06-personas.md`.

Persona ranking within a company:

1. Exact match (strategic procurement; hydraulics engineering leadership)
2. Close match (engineering director; category manager components; purchasing director)
3. Routing contacts (marketing/events) if needed to reach 20 named leads

---

## 10) Produce the final CSV (20 leads)

What we did:

1. Created `lead-search/<client>/leads.csv`
2. Used columns:
   - `number,first_names,last_name,company_name,industry,position,market,country_hq,employee_count,size_segment,buyer_fit,hydraulics_relevance,score,reasoning,source_url`
3. Ensured:
   - At least **20 rows**
   - Every lead has a **source_url**
   - “Reasoning” explains buyer fit + why this persona is relevant

Quality gates:

- If no named personas found for a company, keep “roles to find” in markdown, but continue until 20 **named** leads exist in the CSV.

---

## 11) Cursor setup for the separate project: `demi-leads`

This section is meant as **instructions to Cursor in a different repo** so it can run the same pipeline consistently.

### Project conventions

- **Project name**: `demi-leads`
- **Primary output folder**: `lead-search/<client>/`
- **Always store evidence**: every extracted fact must have a `source_url`.
- **Intermediate artifacts** are always markdown; **final** is CSV.

### Recommended Cursor rule set (what Cursor should “derive”)

Create a project rule (e.g., `.cursorrules` or a Cursor “Project Rules” entry) that instructs the agent to:

- Follow the step sequence in this file and keep artifacts in `lead-search/<client>/`.
- Never write bare claims without a `source_url`.
- Prefer official event directories as source-of-truth for exhibitor evidence.
- Use a consistent scoring rubric and keep it transparent in markdown.
- Treat “unknown employee count” as `null` and do not fabricate numbers.
- Use role-based persona targeting rules (small vs large).

### Recommended skills (Cursor)

If you want reusable “skills” for `demi-leads`, create/install skills that cover:

- **LeadSearchPipeline**: run steps 0–10 and enforce artifact contracts.
- **DataNormalizationAndDedupe**: domain extraction + canonical naming + fuzzy name dedupe.
- **PersonaDiscovery**: layered discovery + evidence + confidence scoring.
- **CSVWriter**: enforce column schema and escaping rules.

(In the Eckerle run we did not rely on a prebuilt skill file; this is a suggestion for the new repo.)

### Required MCP servers for `demi-leads`

Provision and enable these MCP servers in the Cursor project:

- **Firecrawl**: crawling/scraping + extraction to structured data
- **Brave Search**: web discovery/search (company + personas)
- **CoreSignal Data API**: company size enrichment (employees, HQ) and persona enrichment if permitted by your license
- **GitHub**: store outputs, issues, and optionally automate PRs for new lead batches
- **Notion**: push final company/persona datasets into a Notion database for sales workflow
- **PostgreSQL (DMI production)**: persist normalized datasets + run queries/exports

### Minimal data model (if using Postgres)

Suggested tables:

- `exhibitors_raw`
- `exhibitors_clean`
- `companies_scored`
- `personas`
- `leads_final`

Each row must include `source_url` (or `source_urls[]`) and timestamps.

---

## 12) Known limitations (from this run)

- CONEXPO directory list pages can be client-rendered; exhibitor **detail pages** are the reliable evidence primitive.
- Some companies don’t expose procurement/engineering names publicly; in those cases, exhibitor directory contacts can be used as routing contacts, but should be tagged as such.
