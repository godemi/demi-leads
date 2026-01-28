---
name: lead-search-pipeline
description: Runs the CONEXPO-based lead search workflow end-to-end in demi-leads. Use when starting a new client lead search, generating the 00-06 markdown artifacts, or producing the final 20-lead CSV with evidence URLs.
---

# LeadSearchPipeline

## Contract (must enforce)
- Work in `lead-search/<client>/`.
- Intermediate artifacts are markdown; final output is `leads.csv` with **20 named leads**.
- Every extracted fact includes a `source_url` (or `evidence_urls[]`). No bare claims.
- Prefer official exhibitor **detail pages** as exhibitor evidence.
- Unknown employee count is `null` (do not invent numbers).

## Workflow (steps 0–10)

### 0) Lock definitions
- Confirm event (CONEXPO-CON/AGG + official exhibitor directory year).
- Confirm market rules: US vs DACH.
- Confirm size rules: small <200, large ≥200, unknown treated as small until verified.
- Confirm persona rules by size.

### 1) Create folder and artifacts
Create `lead-search/<client>/` with:
- `00-sources.md`
- `01-exhibitors-raw.md`
- `02-exhibitors-clean.md`
- `03-fit-screening.md`
- `04-market-filter.md`
- `05-prioritized-companies.md`
- `06-personas.md`
- `leads.csv`

### 2) Identify official exhibitor source
In `00-sources.md`, capture:
- Directory landing page URL
- Directory portal URL
- A sample exhibitor detail page URL and its URL pattern
- Notes on extraction method and reliability (detail pages preferred)

### 3) Build exhibitor universe (raw)
For each targeted exhibitor:
- Open exhibitor detail page
- Extract: company_name, booth/hall, website, country/location, categories, description
- Append to `01-exhibitors-raw.md` with `conexpo_evidence_url`

### 4) Normalize + dedupe (clean)
Transform raw records into canonical company records:
- canonicalize company name (strip legal suffixes; normalize casing)
- extract website domain
- dedupe by domain (primary) then fuzzy name (secondary)
Write results into `02-exhibitors-clean.md`.

### 5) Buyer-fit screening
For each canonical company:
- infer `buyer_fit` (high/medium/drop)
- infer `hydraulics_relevance` (strong/moderate)
- log reasoning + evidence URLs in `03-fit-screening.md`

### 6) Market filter (US/DACH)
For each company, verify HQ/major presence:
- evidence: directory company info + optional company locations pages
- log keep/drop + evidence in `04-market-filter.md`

### 7) Prioritize companies (scoring)
Apply the rubric (0–100) and document:
- scoring table in `05-prioritized-companies.md`
- select targets for persona discovery

### 8) Enrich company size (employees)
If employee counts are viewable, capture sources; otherwise set `employee_count = null`.
Do not infer or fabricate numbers.

### 9) Persona discovery (named contacts)
Per selected company, find 2–3 personas until you reach 20 named leads:
1. Exhibitor page contacts (routing contacts allowed; tag them)
2. Company press releases/news pages
3. Public LinkedIn pages (no login) if accessible
Capture fields and evidence in `06-personas.md`.

### 10) Produce final CSV (20 leads)
Write `lead-search/<client>/leads.csv` with the required columns and:
- at least 20 rows
- each row has a `source_url`
- reasoning ties buyer fit + persona relevance to evidence

## Quality gates
- Do not proceed to CSV until there are enough **named** people across companies.
- If a company yields no named personas, log “roles to find” in `06-personas.md` and continue with other companies.

