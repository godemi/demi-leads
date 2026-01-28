# Exhibitors (clean) — normalized + deduped

Normalization rules applied:
- Strip common legal suffixes (`Inc.`, `LLC`, etc.) for the canonical name.
- Use **website domain** as primary dedupe key.
- Preserve original fields + the directory evidence URL.

| company_name_canonical | website_domain | booth / hall | country (from directory) | source_company_name | conexpo_evidence_url |
| --- | --- | --- | --- | --- | --- |
| Caterpillar | cat.com | West Hall — W40416 | United States | Caterpillar Inc. | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1040279` |
| Komatsu | komatsu.com | West Hall — W41945 | United States | Komatsu | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1039975` |
| John Deere / Wirtgen Group | deere.com | Silver Lot — SV2415 | United States | John Deere/Wirtgen Group | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1038902` |
| Volvo Construction Equipment (North America) | volvoce.com | Festival Grounds — F24029 | United States | Volvo Construction Equipment North America LLC | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1039180` |
| Liebherr | liebherr.com | Festival Grounds — F35055 | United States (US entity listed) | Liebherr | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1039356` |
| CASE Construction Equipment | casece.com | West Hall — W40701 | United States | CASE Construction Equipment | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1038699` |
| DEVELON | develon-ce.com | Festival Grounds — F32054 | United States | DEVELON | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1038870` |
| Bobcat (Doosan Bobcat North America) | bobcat.com | West Hall — W40745 | United States | Doosan Bobcat North America, Inc. | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1038765` |
| HD Hyundai Construction Equipment (North America) | hd-hyundaice.com | West Hall — W42500 | United States | HD Construction Equipment Hyundai North America | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1039799` |
| Wacker Neuson | wackerneuson.com | West Hall — W43701 | United States (US entity listed) | Wacker Neuson | `https://directory.conexpoconagg.com/8_0/exhibitor/exhibitor-details.cfm?exhid=1038807` |

