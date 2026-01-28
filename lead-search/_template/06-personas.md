# 06-personas.md — found personas per company + evidence

Goal: find **named** people matching persona rules; capture evidence URLs and confidence.

## Persona targeting rules (by company size)
- **Small (<200 or unknown)**: prioritize **R&D / Engineering leadership** (hydraulics/fluid power related)
- **Large (≥200)**: prioritize **Strategic Procurement / Sourcing** AND **R&D Hydraulics / Fluid Technology**

## Allowed sources (layered)
1. CONEXPO exhibitor detail pages (named contacts, if present)
2. Company press releases / news pages
3. Public LinkedIn pages (no login), if accessible

## Per-person fields
- `person_name`
- `role_title`
- `persona_type`: `R&D` | `Strategic Procurement` | `Hybrid` | `Other` (routing)
- `location` (optional)
- `source_url`
- `confidence`: `high` | `medium` | `low`

## Entries (repeat per company)

### Company: <company_name_canonical>

| person_name | role_title | persona_type | location | confidence | source_url | notes |
|---|---|---|---|---|---|---|
| <name> | <title> | <type> | <optional> | <high/medium/low> | <url> | <why this persona helps> |

