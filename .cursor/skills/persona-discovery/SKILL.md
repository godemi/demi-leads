---
name: persona-discovery
description: Discovers named personas (engineering/R&D and strategic procurement) for shortlisted companies and records evidence URLs and confidence. Use when populating 06-personas.md and selecting people for the final leads.csv.
---

# PersonaDiscovery

## Inputs / outputs
- **Input**: `lead-search/<client>/05-prioritized-companies.md`
- **Output**: `lead-search/<client>/06-personas.md` and rows for `lead-search/<client>/leads.csv`

## Target personas (by company size)
- **Small (<200 or unknown)**: prioritize **R&D / Engineering leadership** (hydraulics/fluid power related).
- **Large (≥200)**: prioritize **Strategic Procurement / Sourcing** and **R&D Hydraulics / Fluid Technology**.

## Source ladder (use in order)
1. **CONEXPO exhibitor detail pages**: contacts if present (routing contacts allowed; tag as routing).
2. **Company press releases / news**: highest confidence for named leaders + explicit titles.
3. **Public LinkedIn pages (no login)**: only if accessible; capture the exact visible page URL.

## Evidence and confidence
- **source_url required** per person (no exceptions).
- **confidence**:
  - `high`: person + title stated on official company site or press release, or clearly on official directory contact section.
  - `medium`: credible third-party source or partial title visibility.
  - `low`: weak/ambiguous page context (avoid using unless needed to reach 20 named leads).

## Recording format (06-personas.md)
For each company, create a table with:
- person_name
- role_title
- persona_type (`R&D` | `Strategic Procurement` | `Hybrid` | `Other`)
- location (optional)
- confidence
- source_url
- notes (why this persona is relevant; routing flag if applicable)

## Selection strategy to reach 20 leads
- Aim for **2–3 people per company** across top-scoring companies.
- Prefer exact matches first; then close matches; then routing contacts only if needed.
- If no named people found:
  - record “roles to find” under that company
  - move on to the next company (do not stall)

