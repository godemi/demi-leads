---
name: data-normalization-and-dedupe
description: Normalizes exhibitor/company records for demi-leads, including canonical naming, website domain extraction, and deduplication rules. Use when converting 01-exhibitors-raw.md into 02-exhibitors-clean.md.
---

# DataNormalizationAndDedupe

## Inputs / outputs
- **Input**: `lead-search/<client>/01-exhibitors-raw.md`
- **Output**: `lead-search/<client>/02-exhibitors-clean.md`

## Canonical company naming
- Strip common legal suffixes (case-insensitive) when forming `company_name_canonical`, e.g.:
  - Inc, Incorporated, LLC, Ltd, Limited, GmbH, AG, KG, KGaA, SE, SAS, SA, BV, NV, Srl, SpA, Oy, AB
- Normalize whitespace and punctuation:
  - collapse multiple spaces
  - trim trailing punctuation (commas/periods)
  - keep meaningful brand punctuation (e.g., “Caterpillar” vs “Caterpillar Inc”)
- Preserve diacritics; do not transliterate unless required for matching.

## Website domain extraction (dedupe key)
- Extract the registrable domain from `website` where possible:
  - remove protocol, path, query, fragments
  - lowercase
  - remove `www.` prefix
- If multiple domains appear, prefer the primary corporate domain (not campaign microsites).
- If no website is present, set `website_domain = null` and rely on name matching only.

## Deduplication rules
- **Primary**: exact match on `website_domain` → same company.
- **Secondary** (only when domain missing): fuzzy name match:
  - treat punctuation differences as equal
  - allow small spelling variants
  - avoid merging when names are generic and ambiguous (e.g., “Hydraulics”, “Engineering”)
- When deduping, keep:
  - `source_company_name` as shown in directory for traceability
  - at least one `conexpo_evidence_url` per canonical record

## What to record in 02-exhibitors-clean.md
For each canonical company record, ensure:
- `company_name_canonical`
- `website_domain` (or `null`)
- `booth_hall`
- `country_from_directory`
- `source_company_name`
- `conexpo_evidence_url`

## Non-negotiables
- Do not fabricate missing fields.
- Keep evidence URLs stable and specific (prefer exhibitor detail pages).

