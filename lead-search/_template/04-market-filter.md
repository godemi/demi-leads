# 04-market-filter.md — US/DACH market evidence per company

Keep only companies with HQ in US or DACH (Germany/Austria/Switzerland) **or** major operations there.

## Market definitions
- **US**: HQ in US or major US operations
- **DACH**: HQ in Germany/Austria/Switzerland or major operations there

## Evidence sources (preferred)
- CONEXPO exhibitor “Company Information” (address/country)
- Company website locations/contact pages
- Reputable public directories (only if viewable)

## Decisions (one block per company)

### Company: <company_name_canonical>
- **market**: <US|DACH|both|drop>
- **country_hq**: <country_or_null>
- **reasoning**: <1-3 sentences>
- **evidence_urls**:
  - <conexpo_exhibitor_detail_url>
  - <optional_locations_or_contact_url>

