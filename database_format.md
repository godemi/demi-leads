# Database format

This describes the structure of the lead tables in schema `domain`.

## domain.lead_person

| Column | Type |
| --- | --- |
| id | integer |
| lead_organization_id | integer |
| first_names | text |
| last_name | text |
| job_title | text |
| job_title_standardized | text |
| job_title_vector | tsvector |
| email | text |
| location_address | text |
| postal_code | text |
| country | text |
| country_standardized | text |
| persona | text |
| selection_reason | text |
| selection_reason_standardized | text |
| lead_type_1 | text |
| lead_type_2 | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| product | character varying |

## domain.lead_organization

| Column | Type |
| --- | --- |
| id | integer |
| name | text |
| location_address | text |
| postal_code | text |
| country | text |
| website | text |
| industry | text |
| name_standardized | text |
| industry_standardized | text |
| country_standardized | text |
| created_at | timestamp with time zone |
| updated_at | timestamp with time zone |
| reasoning | text |
