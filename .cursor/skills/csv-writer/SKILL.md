---
name: csv-writer
description: Writes and validates the final leads.csv for demi-leads with correct schema, escaping, and evidence URLs. Use when generating or updating lead-search/<client>/leads.csv.
---

# CSVWriter

## Output file
- `lead-search/<client>/leads.csv`

## Required columns (exact order)
`number,first_names,last_name,company_name,industry,position,market,country_hq,employee_count,size_segment,buyer_fit,hydraulics_relevance,score,reasoning,source_url`

## Rules
- At least **20 rows** for final delivery.
- Every row must have a **source_url** (one URL; choose the best evidence page for that person/title).
- `employee_count`:
  - integer if verified by a viewable source
  - otherwise blank (represents `null`)
- `reasoning` must be short but explicit:
  - why this company is a buyer-fit + hydraulics relevance
  - why this persona matches targeting rules
  - tie back to evidence URL(s) referenced in markdown

## CSV escaping
- If a field contains a comma, quote, or newline:
  - wrap the field in double quotes
  - escape internal double quotes by doubling them (`""`)
- Keep `source_url` as a plain URL string (quoted only if needed by CSV rules).

## Cross-checks before finalizing
- Row count ≥ 20
- No missing `source_url`
- `score` is numeric and matches the scoring table
- `market` is one of: `US`, `DACH`, `both`

