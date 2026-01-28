# 02-exhibitors-clean.md — normalized + deduped canonical company records

Create one canonical record per company after normalizing and deduping `01-exhibitors-raw.md`.

## Canonical fields (one block per company)

### Company: <company_name_canonical>
- **company_name_canonical**: <canonical_name_without_legal_suffixes>
- **website_domain**: <domain_only_e.g._example.com>
- **booth_hall**: <from_directory>
- **country_from_directory**: <from_directory>
- **source_company_name**: <original_company_name_as_shown>
- **conexpo_evidence_url**: <exhibitor_detail_page_url>

## Deduping rules (document decisions)
- **primary**: exact `website_domain` match.
- **secondary**: fuzzy company name match only if domain is missing.

