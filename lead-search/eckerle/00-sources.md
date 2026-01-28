# Lead Search Sources — Eckerle × CONEXPO 2026

This folder contains intermediate artifacts and the final lead list for the Eckerle lead search.

## Primary event source (official)

- CONEXPO-CON/AGG “Exhibitor Directory” landing page (links to directory + floor plan): `https://www.conexpoconagg.com/show-experience/exhibitor-directory`
- CONEXPO-CON/AGG 2026 directory portal (MapYourShow): `https://directory.conexpoconagg.com/8_0/`
  - Exhibitor profile pages follow this pattern: `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=<id>`

## Notes on how exhibitors are discovered/extracted here

The MapYourShow “gallery” UI is client-rendered and doesn’t reliably render in plain HTML fetches. For reproducible extraction with source URLs, this lead search uses:

- Direct exhibitor profile URLs on `directory.conexpoconagg.com` as the **primary evidence** that a company is a CONEXPO 2026 exhibitor.
- Discovery of exhibitor profile URLs via targeted web queries (e.g., `site:directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm <company name>`), then validating by opening each exhibitor-details page and capturing:
  - exhibitor name
  - booth/hall (when listed)
  - website (when listed)
  - location/country (when listed)

This produces a **traceable** `conexpo_evidence_url` per company even when the full directory list is not directly scrapable without a browser/API reverse-engineer step.

