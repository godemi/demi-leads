# demi-leads

Replicable, evidence-first lead search workflow.

## Output contract (non-negotiable)
- **Intermediate artifacts**: markdown files (auditable, with evidence URLs) in `lead-search/<client>/`
- **Final deliverable**: `lead-search/<client>/leads.csv` containing **20 named leads** with reasoning and a `source_url` per row

## Folder structure
Start every engagement in its own folder:
- `lead-search/<client>/`

Use the template scaffold at:
- `lead-search/_template/`

Required files (keep filenames):
- `00-sources.md`
- `01-exhibitors-raw.md`
- `02-exhibitors-clean.md`
- `03-fit-screening.md`
- `04-market-filter.md`
- `05-prioritized-companies.md`
- `06-personas.md`
- `leads.csv`

## Working definitions (locked)
- **Event definition**: “CONEXPO” = CONEXPO-CON/AGG and its official exhibitor directory (relevant year).
- **Market definition**:
  - **US**: HQ in US or major US operations
  - **DACH**: HQ in Germany/Austria/Switzerland or major operations there
- **Company size rule**:
  - **Small**: < 200 employees (or unknown → treat as small until verified)
  - **Large**: ≥ 200 employees
- **Persona targeting rule**:
  - **Small**: prioritize **R&D / Engineering leadership** (hydraulics/fluid power-related)
  - **Large**: prioritize **Strategic Procurement / Sourcing** AND **R&D Hydraulics / Fluid Technology**

## Scoring rubric (0–100)
- Buyer fit: high +40, medium +20
- Hydraulics relevance: strong +25, moderate +10
- Market match: HQ in US/DACH +20, major presence only +10
- Size: ≥200 +10, <200 +5, unknown +5 (mark unknown)
- Penalty safeguard: likely competitor −50

## CSV schema
Columns (exact order):
`number,first_names,last_name,company_name,industry,position,market,country_hq,employee_count,size_segment,buyer_fit,hydraulics_relevance,score,reasoning,source_url`

## Cursor automation
- Project rules live in `.cursor/rules/` (see `lead-search.mdc`).
- Project skills live in `.cursor/skills/` to help run the pipeline consistently:
  - `lead-search-pipeline`
  - `data-normalization-and-dedupe`
  - `persona-discovery`
  - `csv-writer`

## Required MCP servers (recommended)
Provision these in the Cursor project when you want automation beyond manual extraction:
- **Firecrawl**: crawling/scraping + extraction
- **Brave Search**: web discovery/search
- **CoreSignal Data API**: company size enrichment (employees, HQ) and persona enrichment (license-permitting)
- **GitHub**: store outputs and collaborate
- **Notion**: push final datasets into a sales workflow database
- **PostgreSQL**: persist normalized datasets + query/export

## Optional Postgres data model
Suggested tables (each row includes `source_url` or `source_urls[]` + timestamps):
- `exhibitors_raw`
- `exhibitors_clean`
- `companies_scored`
- `personas`
- `leads_final`
