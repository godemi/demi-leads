# 03-fit-screening.md — buyer-fit screening decisions + evidence URLs

Goal: keep only companies that plausibly **buy** hydraulics/fluid power-related products/services and are relevant to the target offering.

## Classification schema
- **buyer_fit**: `high` | `medium` | `drop`
- **hydraulics_relevance**: `strong` | `moderate`
- **drop_rule**: If no evidence of being a buyer/end user/integrator **and** no hydraulics relevance → `drop`.

## Decisions (one block per company)

### Company: <company_name_canonical>
- **buyer_fit**: <high|medium|drop>
- **hydraulics_relevance**: <strong|moderate>
- **reasoning**: <1-3 sentences tying evidence to decision>
- **evidence_urls**:
  - <conexpo_exhibitor_detail_url>
  - <optional_company_website_url>

