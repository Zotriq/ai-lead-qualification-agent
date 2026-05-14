# API Reference

**Base URL:** `http://localhost:8000`

Interactive documentation is also available at `/docs` (Swagger UI) and `/redoc` (ReDoc) when the backend is running.

---

## Table of Contents

1. [Lead Endpoints](#lead-endpoints)
2. [Email Approval Endpoints](#email-approval-endpoints)
3. [Dashboard Endpoints](#dashboard-endpoints)
4. [Webhook Endpoints](#webhook-endpoints)
5. [Health Endpoints](#health-endpoints)
6. [Common Status Codes](#common-status-codes)

---

## Lead Endpoints

All lead endpoints share the prefix `/api/leads`.

### POST /api/leads/intake

Submit a new lead for qualification.

The lead is persisted immediately and a background task is queued to run the full qualification pipeline (rule-based scoring, AI analysis, CRM sync, Slack notification). The HTTP response is returned straight away — the caller does not wait for qualification to finish.

**Request Body**

```json
{
  "name": "Jane Smith",
  "email": "jane.smith@techcorp.io",
  "phone": "+1-415-555-0182",
  "company": "TechCorp Solutions",
  "company_size": "51-200",
  "industry": "Software / SaaS",
  "job_title": "VP of Engineering",
  "budget": "5000",
  "timeline": "this_month",
  "source": "website_form",
  "message": "We need to automate our inbound sales pipeline.",
  "project_type": "sales_automation",
  "country": "United States"
}
```

| Field | Type | Required | Notes |
|---|---|---|---|
| `name` | string | Yes | Lead's full name |
| `email` | string (email) | Yes | Must be a valid email address |
| `phone` | string | No | Any format accepted |
| `company` | string | No | Company or organisation name |
| `company_size` | string | No | Headcount or label (e.g. `"51-200"`, `"enterprise"`) |
| `industry` | string | No | Industry sector |
| `job_title` | string | No | Job title or role |
| `budget` | string | No | Numeric USD amount or descriptive label (e.g. `"5000"`, `"$5,000"`, `"high"`) |
| `timeline` | string | No | One of: `asap`, `this_month`, `next_month`, `this_quarter`, `next_quarter`, or free text |
| `source` | string | No | Defaults to `"website_form"` |
| `message` | string | No | Free-text description or use case |
| `project_type` | string | No | Type of project |
| `country` | string | No | Country name |

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processing",
  "message": "Lead received. Qualification is running in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Lead accepted, qualification queued |
| `422` | Validation error (missing required field or invalid email) |

---

### GET /api/leads/

List leads with pagination and filters.

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `page` | integer | `1` | Page number (1-based) |
| `page_size` | integer | `20` | Records per page (max 200) |
| `status` | string | — | Filter by qualification status: `hot`, `warm`, `cold`, `unqualified`, `processing` |
| `source` | string | — | Filter by lead source |
| `search` | string | — | Full-text search across name, email, and company |
| `sort_by` | string | `created_at` | Sort field: `score` or `created_at` |
| `sort_order` | string | `desc` | Sort direction: `asc` or `desc` |

**Example Request**

```
GET /api/leads/?status=hot&page=1&page_size=10&sort_by=score
```

**Response — 200 OK**

```json
{
  "leads": [
    {
      "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
      "name": "Jane Smith",
      "email": "jane.smith@techcorp.io",
      "phone": "+1-415-555-0182",
      "company": "TechCorp Solutions",
      "company_size": "51-200",
      "industry": "Software / SaaS",
      "job_title": "VP of Engineering",
      "budget": "5000",
      "timeline": "this_month",
      "source": "website_form",
      "message": "We need to automate our inbound sales pipeline.",
      "project_type": "sales_automation",
      "country": "United States",
      "score": 87,
      "status": "hot",
      "recommended_action": "Schedule a discovery call within 24 hours.",
      "ai_analysis": { ... },
      "created_at": "2026-05-14T09:22:45Z",
      "updated_at": "2026-05-14T09:22:52Z",
      "follow_up_emails": [ ... ],
      "activities": [ ... ],
      "integration_syncs": [ ... ]
    }
  ],
  "total": 142,
  "page": 1,
  "page_size": 10,
  "total_pages": 15
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |

---

### GET /api/leads/{id}

Retrieve a single lead with all related records (follow-up emails, activity log, integration sync history).

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Response — 200 OK**

```json
{
  "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "name": "Jane Smith",
  "email": "jane.smith@techcorp.io",
  "company": "TechCorp Solutions",
  "score": 87,
  "status": "hot",
  "recommended_action": "Schedule a discovery call within 24 hours.",
  "ai_analysis": {
    "lead_score": 87,
    "qualification_status": "hot",
    "intent_level": "high",
    "budget_fit": "excellent",
    "urgency": "short_term",
    "industry_fit": "strong",
    "decision_maker_likelihood": "high",
    "pain_points": ["Manual pipeline not scaling"],
    "recommended_next_action": "Schedule discovery call within 24 hours.",
    "reasoning": "Strong BANT indicators across all dimensions.",
    "risks_or_missing_info": [],
    "follow_up_email": {
      "subject": "Automating your pipeline — quick 30-min call?",
      "body": "Hi Jane, ..."
    },
    "rule_score": 82,
    "ai_score": 90,
    "final_score": 87,
    "ai_available": true
  },
  "created_at": "2026-05-14T09:22:45Z",
  "updated_at": "2026-05-14T09:22:52Z",
  "follow_up_emails": [
    {
      "id": "a1b2c3d4-...",
      "subject": "Automating your pipeline — quick 30-min call?",
      "body": "Hi Jane, ...",
      "status": "draft_generated",
      "ai_generated": true,
      "approved_by": null,
      "approved_at": null,
      "sent_at": null,
      "created_at": "2026-05-14T09:22:52Z"
    }
  ],
  "activities": [
    {
      "id": "e5f6...",
      "activity_type": "lead_created",
      "message": "Lead submitted by Jane Smith via website_form.",
      "metadata": { "source": "website_form" },
      "created_at": "2026-05-14T09:22:45Z"
    }
  ],
  "integration_syncs": [
    {
      "id": "g7h8...",
      "integration_name": "google_sheets",
      "sync_status": "success",
      "external_id": "Sheet1!A5",
      "error_message": null,
      "synced_at": "2026-05-14T09:22:53Z",
      "created_at": "2026-05-14T09:22:53Z"
    }
  ]
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Lead not found |

---

### PUT /api/leads/{id}

Partially update a lead record. Only fields present in the request body are modified.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body** (all fields optional; at least one required)

```json
{
  "name": "Jane R. Smith",
  "qualification_status": "warm",
  "budget": "8000",
  "timeline": "next_quarter"
}
```

Updatable fields: `name`, `email`, `phone`, `company`, `company_size`, `industry`, `job_title`, `budget`, `timeline`, `source`, `message`, `project_type`, `country`, `qualification_score`, `qualification_status`, `ai_analysis`.

Budget and timeline values are re-normalised automatically when updated.

**Response — 200 OK**

Returns the full updated lead object (same shape as `GET /api/leads/{id}`).

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | No fields provided |
| `404` | Lead not found |
| `422` | Validation error |

---

### DELETE /api/leads/{id}

Delete a lead. Defaults to soft-delete (sets status to `"deleted"`). Pass `hard=true` for permanent deletion including all related rows.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Query Parameters**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `hard` | boolean | `false` | If `true`, permanently deletes the record and all cascade-related rows |

**Response — 200 OK (soft-delete)**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deleted": true,
  "type": "soft",
  "message": "Lead marked as deleted."
}
```

**Response — 200 OK (hard-delete)**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "deleted": true,
  "type": "hard",
  "message": "Lead permanently deleted."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Lead not found |

---

### POST /api/leads/{id}/qualify

Re-run the full AI qualification pipeline on an existing lead without resubmitting it. Useful after manually editing lead fields or when the OpenAI model is updated.

The lead status is immediately set to `"processing"` and qualification runs in the background.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body**

None.

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processing",
  "message": "Re-qualification is running in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Re-qualification queued |
| `404` | Lead not found |

---

### POST /api/leads/{id}/sync

Re-push the lead to all enabled external integrations (Google Sheets, Airtable, HubSpot, n8n) without re-running AI qualification.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body**

None.

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "syncing",
  "message": "Integration sync is running in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Sync queued |
| `404` | Lead not found |

---

### POST /api/leads/{id}/notify

Re-send the Slack notification for a lead. Hot leads receive a rich block-kit message; warm leads receive a compact message. Cold, unqualified, and processing leads are silently skipped.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body**

None.

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "notifying",
  "message": "Slack notification is being sent in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Notification queued |
| `404` | Lead not found |

---

## Email Approval Endpoints

These endpoints manage the follow-up email lifecycle. All share the prefix `/api/leads`.

The email status lifecycle is:

```
draft_generated  →  approved  →  sent
                 ↘  rejected
```

---

### GET /api/leads/{id}/follow-up

Retrieve the most recently created follow-up email draft for a lead.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Response — 200 OK**

```json
{
  "id": "a1b2c3d4-5678-90ab-cdef-1234567890ab",
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "subject": "Automating your 500 leads/month — quick 30-min call?",
  "body": "Hi Jane,\n\nThanks for reaching out...",
  "status": "draft_generated",
  "ai_generated": true,
  "approved_by": null,
  "approved_at": null,
  "sent_at": null,
  "created_at": "2026-05-14T09:22:52Z",
  "updated_at": "2026-05-14T09:22:52Z"
}
```

Email `status` values:

| Value | Meaning |
|---|---|
| `draft_generated` | AI-generated draft, pending review |
| `approved` | Approved and ready to send |
| `rejected` | Rejected, will not be sent |
| `sent` | Successfully delivered |

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Lead not found, or no follow-up email exists yet |

---

### PUT /api/leads/{id}/follow-up

Edit the subject and/or body of the latest follow-up email. Does not change the approval status.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body** (at least one field required)

```json
{
  "subject": "Updated subject line",
  "body": "Hi Jane,\n\nUpdated email body..."
}
```

**Response — 200 OK**

Returns the updated follow-up email object (same shape as `GET /api/leads/{id}/follow-up`).

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `400` | No fields provided |
| `404` | Lead or email not found |

---

### POST /api/leads/{id}/approve-email

Mark the latest follow-up email as approved and ready to send.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body**

```json
{
  "approved_by": "sales@example.com"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `approved_by` | string | Yes | Identifier of the approving user (email, name, or user ID) |

**Response — 200 OK**

Returns the updated follow-up email object with `status: "approved"`.

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Lead or email not found |
| `409` | Email has already been sent |

---

### POST /api/leads/{id}/reject-email

Mark the latest follow-up email as rejected. A rejected email will not be sent.

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body**

None.

**Response — 200 OK**

Returns the updated follow-up email object with `status: "rejected"`.

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |
| `404` | Lead or email not found |
| `409` | Email has already been sent |

---

### POST /api/leads/{id}/send-email

Dispatch the approved follow-up email to the lead's email address via SMTP.

**Requirements before calling this endpoint:**
- The latest follow-up email must have `status == "approved"` (call `/approve-email` first).
- `EMAIL_SENDING_ENABLED=true` must be set in the environment.
- SMTP credentials must be configured (`SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `FROM_EMAIL`).

**Path Parameters**

| Parameter | Type | Description |
|---|---|---|
| `id` | UUID | Lead identifier |

**Request Body**

```json
{
  "approved_by": "sales@example.com"
}
```

| Field | Type | Required | Description |
|---|---|---|---|
| `approved_by` | string | No | Optional approver override (used if not already recorded) |

**Response — 200 OK**

```json
{
  "email": {
    "id": "a1b2c3d4-...",
    "subject": "Automating your pipeline...",
    "status": "sent",
    "sent_at": "2026-05-14T10:15:00Z"
  },
  "send_result": {
    "status": "success",
    "message": "Email 'Automating your pipeline...' sent successfully to 'jane.smith@techcorp.io'."
  }
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Email sent successfully |
| `404` | Lead or email not found |
| `422` | Email is not in `approved` status, or lead has no email address |
| `502` | SMTP delivery failed |

---

## Dashboard Endpoints

All dashboard endpoints share the prefix `/api/dashboard`.

---

### GET /api/dashboard/summary

Return headline KPI counts and averages across all leads.

**Response — 200 OK**

```json
{
  "total_leads": 284,
  "hot_leads": 38,
  "warm_leads": 91,
  "cold_leads": 75,
  "unqualified_leads": 62,
  "average_score": 52.4,
  "conversion_ready": 38
}
```

| Field | Description |
|---|---|
| `total_leads` | Total records in the leads table |
| `hot_leads` | Leads with `qualification_status = "hot"` |
| `warm_leads` | Leads with `qualification_status = "warm"` |
| `cold_leads` | Leads with `qualification_status = "cold"` |
| `unqualified_leads` | Leads with `qualification_status = "unqualified"` |
| `average_score` | Mean score across all scored leads |
| `conversion_ready` | Alias for `hot_leads` (leads ready for sales follow-up) |

Note: soft-deleted leads and leads in `processing` state are excluded from status counts but included in total and average score.

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |

---

### GET /api/dashboard/leads-by-status

Return lead count breakdown by qualification status.

**Response — 200 OK**

```json
[
  { "status": "warm", "count": 91 },
  { "status": "cold", "count": 75 },
  { "status": "unqualified", "count": 62 },
  { "status": "hot", "count": 38 },
  { "status": "processing", "count": 18 }
]
```

Results are ordered by count descending. Statuses with zero leads are omitted.

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |

---

### GET /api/dashboard/leads-by-source

Return lead count breakdown by acquisition source.

**Response — 200 OK**

```json
[
  { "source": "website_form", "count": 142 },
  { "source": "n8n_webhook", "count": 67 },
  { "source": "crm_webhook", "count": 43 },
  { "source": "generic_webhook", "count": 32 }
]
```

Results are ordered by count descending. Sources with zero leads are omitted.

**Status Codes**

| Code | Meaning |
|---|---|
| `200` | Success |

---

## Webhook Endpoints

All webhook endpoints share the prefix `/api/webhooks`.

If `WEBHOOK_SECRET` is set in the environment, all webhook endpoints require an `X-Webhook-Secret` header matching the configured value. The comparison is performed in constant time to prevent timing attacks.

---

### POST /api/webhooks/lead

Generic webhook endpoint for lead intake from any external system.

The payload must include at minimum an `email` field. All other fields follow the same naming convention as `POST /api/leads/intake`.

**Headers**

| Header | Required | Description |
|---|---|---|
| `X-Webhook-Secret` | Conditional | Required when `WEBHOOK_SECRET` is configured |

**Request Body**

```json
{
  "name": "Alex Johnson",
  "email": "alex@company.com",
  "company": "Acme Inc.",
  "job_title": "CTO",
  "budget": "10000",
  "timeline": "asap",
  "message": "We need help automating our sales process.",
  "source": "partner_form"
}
```

The `source` field within the body is used as the lead source label. If omitted it defaults to `"generic_webhook"`.

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processing",
  "source": "partner_form",
  "message": "Lead received via webhook. Qualification is running in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Lead accepted |
| `400` | Invalid JSON |
| `401` | Missing or invalid `X-Webhook-Secret` |
| `422` | Missing `email` field or invalid payload |

---

### POST /api/webhooks/n8n

Receive a lead from an n8n automation workflow.

Accepts both snake_case and camelCase field names. Nested `lead`, `data`, or `body` wrappers are automatically flattened. See the field mapping table below for all accepted aliases.

**Headers**

| Header | Required | Description |
|---|---|---|
| `X-Webhook-Secret` | Conditional | Required when `WEBHOOK_SECRET` is configured |

**Request Body (n8n nested format)**

```json
{
  "workflow_id": "wf_lead_capture_typeform",
  "lead": {
    "email": "priya.nair@growthstartup.co",
    "full_name": "Priya Nair",
    "company_name": "GrowthStartup Co.",
    "jobTitle": "Head of Growth",
    "companySize": "11-50",
    "budgetRange": "$500 - $1,000/month",
    "projectTimeline": "ASAP"
  }
}
```

**n8n Field Aliases**

| n8n Field | Canonical Field |
|---|---|
| `full_name`, `fullName`, `contact_name`, `contactName` | `name` |
| `email_address`, `emailAddress` | `email` |
| `phone_number`, `phoneNumber` | `phone` |
| `company_name`, `companyName`, `organization` | `company` |
| `companySize`, `employees`, `num_employees` | `company_size` |
| `jobTitle`, `title`, `position`, `role` | `job_title` |
| `budget_range`, `budgetRange`, `project_budget`, `projectBudget` | `budget` |
| `start_date`, `startDate`, `project_timeline`, `projectTimeline` | `timeline` |
| `project_description`, `projectDescription`, `use_case`, `useCase`, `notes` | `message` |
| `projectType` | `project_type` |
| `country_code`, `countryCode` | `country` |

The lead source is always recorded as `"n8n_webhook"`.

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processing",
  "source": "n8n_webhook",
  "message": "Lead received via webhook. Qualification is running in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Lead accepted |
| `400` | Invalid JSON |
| `401` | Missing or invalid `X-Webhook-Secret` |
| `422` | Missing `email` field |

---

### POST /api/webhooks/crm

Receive a lead from a CRM system (HubSpot, Salesforce, Pipedrive, or compatible).

Nested `properties`, `contact`, `lead`, or `person` wrappers are automatically flattened. HubSpot's `{"value": "..."}` field format is supported. Arrays are also accepted — the first element is used.

**Headers**

| Header | Required | Description |
|---|---|---|
| `X-Webhook-Secret` | Conditional | Required when `WEBHOOK_SECRET` is configured |
| `X-CRM-Source` | No | Optional identifier for the originating CRM (e.g. `hubspot`, `salesforce`). Used as the source label on the lead record. |

**Request Body (HubSpot contact format)**

```json
{
  "properties": {
    "email": "john@enterprise.com",
    "firstname": "John",
    "lastname": "Doe",
    "company": "Enterprise Corp",
    "jobtitle": "Director of Operations",
    "numberofemployees": "500",
    "industry": "Logistics",
    "country": "United States"
  }
}
```

**CRM Field Aliases**

| CRM Field | Canonical Field |
|---|---|
| `firstname`, `FirstName`, `full_name`, `person_name` | `name` |
| `email`, `Email`, `contact_email` | `email` |
| `phone`, `Phone`, `mobilephone`, `contact_phone` | `phone` |
| `company`, `Company`, `org_name`, `company_name` | `company` |
| `jobtitle`, `Title`, `job_title` | `job_title` |
| `industry`, `Industry` | `industry` |
| `numberofemployees`, `NumberOfEmployees` | `company_size` |
| `country`, `Country` | `country` |
| `description`, `Description`, `message`, `notes`, `project_description` | `message` |
| `AnnualRevenue`, `budget_amount`, `project_budget` | `budget` |
| `timeline`, `project_timeline` | `timeline` |
| `lead_source`, `hs_analytics_source`, `LeadSource` | `source` |

**Response — 202 Accepted**

```json
{
  "lead_id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
  "status": "processing",
  "source": "hubspot_webhook",
  "message": "Lead received via webhook. Qualification is running in the background."
}
```

**Status Codes**

| Code | Meaning |
|---|---|
| `202` | Lead accepted |
| `400` | Invalid JSON |
| `401` | Missing or invalid `X-Webhook-Secret` |
| `422` | Missing `email` field or empty array payload |

---

## Health Endpoints

### GET /health

Liveness probe. Returns `200 OK` as long as the process is running.

**Response — 200 OK**

```json
{
  "status": "ok",
  "service": "ai-lead-qualification-agent"
}
```

Suitable for Docker and Kubernetes liveness probes.

---

### GET /ready

Readiness probe. Verifies the application can reach the database before reporting ready.

**Response — 200 OK (ready)**

```json
{
  "status": "ready",
  "checks": {
    "database": "ok"
  }
}
```

**Response — 503 Service Unavailable (not ready)**

```json
{
  "status": "not_ready",
  "checks": {
    "database": "error: ..."
  }
}
```

Suitable for Kubernetes readiness probes.

---

## Common Status Codes

| Code | Meaning |
|---|---|
| `200` | Success |
| `202` | Accepted — operation is running asynchronously |
| `400` | Bad request (e.g. invalid JSON) |
| `401` | Unauthorized (invalid or missing webhook secret) |
| `404` | Resource not found |
| `409` | Conflict (e.g. attempting to approve an already-sent email) |
| `422` | Unprocessable entity (validation error) |
| `502` | Bad gateway (upstream service error, e.g. SMTP failure) |
