# 00-sources.md — authoritative sources + extraction notes

Client: **<client>**
Event: **CONEXPO-CON/AGG (<year>)**

## Official event sources (authoritative)

### Exhibitor directory landing page
- **source_url**: <paste_official_directory_landing_url>
- **notes**: How to navigate to the official directory portal (e.g., MapYourShow-backed).

### Official directory portal (MapYourShow)
- **source_url**: <paste_official_directory_portal_url>
- **notes**: Confirm you can reach exhibitor detail pages from search results.

### Exhibitor detail page URL pattern (evidence primitive)
- **source_url**: <paste_example_exhibitor_detail_url>
- **expected_pattern**: `.../exhibitor/exhibitor-details.cfm?exhid=<id>`
- **notes**: Detail pages are preferred evidence (stable URLs); list/gallery pages may be client-rendered.

## Extraction approach
- **primary_method**: Use the exhibitor directory search → open exhibitor detail pages → extract fields into `01-exhibitors-raw.md`.
- **evidence_policy**: Every extracted fact must include a `source_url` (prefer exhibitor detail pages).

