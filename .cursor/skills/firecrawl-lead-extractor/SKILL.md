---
name: firecrawl-lead-extractor
description: Extracts sales leads (first names, last name, email, phone, position) from a provided URL using the Firecrawl MCP. Presents leads one-by-one for confirm/reject/abort, and appends confirmed leads to new_leads.csv (creating it if missing). Use when the user provides a URL and asks to extract contact info/leads, scrape a page with Firecrawl, or build/append to new_leads.csv.
---

# FirecrawlLeadExtractor

## Goal
Given a user-provided URL, use the **Firecrawl MCP** to fetch page content, extract **lead** contact details, then run an interactive loop:
- Show one lead in chat.
- User can **confirm**, **reject**, or **abort**.
- On confirm, append the lead to `new_leads.csv` (create if missing).

## Lead definition (strict)
A lead is only valid if **all** fields are present and non-empty:
- `first_names`
- `last_name`
- `email`
- `phone`
- `position`

If any field is missing, do **not** propose it as a lead (treat as incomplete and skip).

## Required file output
Maintain `new_leads.csv` in the current workspace folder (same folder the user opened in Cursor).

### CSV schema (exact header)
`first_names,last_name,email,phone,position,source_url`

### CSV rules
- If `new_leads.csv` does not exist, create it with the header line above.
- Append **one row per confirmed lead**.
- Deduplicate: if a confirmed lead’s `email` already exists in `new_leads.csv` (case-insensitive), do not add a duplicate row; tell the user it was already present and continue to the next lead.
- CSV escaping: if any field contains a comma, quote, or newline, wrap in double quotes and escape internal quotes by doubling them (`""`).

## Evidence policy
- Never guess. Only extract what is present in the source content.
- Every proposed lead must include a `source_url` pointing to the page where the data was found (usually the user-provided URL; use a more specific subpage URL if Firecrawl returns it).

## Firecrawl MCP usage (mandatory)
1. Verify the Firecrawl MCP server exists under the repo’s `mcps/` folder (e.g., `mcps/firecrawl/`).
2. **Before calling any MCP tool**, read the tool schema JSON in `mcps/firecrawl/tools/` to learn:
   - tool names
   - required parameters
   - output shape
3. Use the most appropriate Firecrawl tool to retrieve **readable page content** (prefer markdown/text plus links/metadata).

If Firecrawl MCP is not installed/available:
- Say so explicitly and stop (do not substitute other extraction methods unless the user asks).

## Extraction workflow

### 1) Fetch
Use Firecrawl to fetch the URL content. Prefer:
- main body text / markdown
- page title
- outbound/internal links (to discover “Contact”, “Team”, “Impressum”, “About”, “Leadership” pages)

If the page is a directory or hub page, also fetch the most relevant linked subpages (contact/team/imprint pages) to maximize chance of finding direct contact details.

### 2) Identify candidate contact blocks
From fetched content, identify places where contact info is likely:
- “Contact”, “Kontakt”, “Impressum”, “Team”, “About”, “Leadership”, “Management”, “Sales”, “Business Development”
- email addresses (regex)
- phone numbers (regex; accept international formats)
- name + title patterns near email/phone
- vCard snippets or structured person listings

### 3) Build lead objects (strict)
For each candidate person:
- Extract `first_names` and `last_name` (split the full name; keep particles with last name if present, e.g., “van”, “von”, “de”).
- Extract `position` (job title/role) as shown.
- Extract `email` and `phone` exactly as shown (normalize whitespace; do not rewrite or “fix”).
- Set `source_url` to the page where those details appear.

Only keep leads that satisfy the strict definition.

### 4) Dedupe and ordering
Before presenting:
- Deduplicate extracted leads by `email` (case-insensitive). If emails are unique but all other fields match strongly, you may also dedupe by `(first_names,last_name,phone)`.
- Order leads by quality:
  - direct email + direct phone on same page with clear title
  - then email+phone with title inferred from same block
  - prefer official pages (imprint/contact/team) over third-party sources

## Chat interaction loop (must follow)
Present leads **one at a time** in this format:

**Lead X of N**
- First names: …
- Last name: …
- Email: …
- Phone: …
- Position: …
- Source: …

Then ask:
“Reply with **confirm**, **reject**, or **abort**.”

Behavior:
- **confirm**: append to `new_leads.csv` (or skip if already present), then move to next lead.
- **reject**: do not write; move to next lead.
- **abort**: stop immediately; do not present further leads.

If the user gives any other response, ask again using the same three options.

## Completion
When all leads are processed (confirmed or rejected), summarize:
- how many were extracted
- how many confirmed
- where `new_leads.csv` was written

