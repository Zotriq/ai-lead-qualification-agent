# Integration Guide

This guide explains how to configure each external integration supported by the AI Lead Qualification Agent. Every integration is **opt-in** — the system works without any of them. Integrations are activated by setting environment variables in your `.env` file (or in your deployment environment).

---

## Table of Contents

1. [Google Sheets](#google-sheets)
2. [Airtable](#airtable)
3. [HubSpot](#hubspot)
4. [Slack](#slack)
5. [n8n](#n8n)
6. [Email / SMTP](#email--smtp)
7. [Webhook Security](#webhook-security)

---

## Google Sheets

When enabled, a new row is appended to a designated spreadsheet each time a lead is qualified. The integration uses a Google service account so no OAuth browser flow is required.

### Step 1 — Create a Google Cloud project and enable the Sheets API

1. Go to [console.cloud.google.com](https://console.cloud.google.com).
2. Create a new project (or select an existing one).
3. Navigate to **APIs & Services > Library** and enable the **Google Sheets API**.

### Step 2 — Create a service account

1. Navigate to **APIs & Services > Credentials**.
2. Click **Create Credentials > Service Account**.
3. Give it a descriptive name (e.g. `lead-agent-sheets`).
4. Skip the optional role assignment on the next two screens — click **Done**.
5. Open the service account you just created, go to the **Keys** tab, click **Add Key > Create new key**, and choose **JSON**.
6. Download the JSON file. Keep it secret — it grants write access to any spreadsheet you share with it.

### Step 3 — Create and share the spreadsheet

1. Create a new Google Spreadsheet (or use an existing one).
2. Add a header row in **row 1** with these columns in order:

   ```
   lead_id | name | email | company | job_title | phone | budget | timeline | use_case | score | status | recommended_action | synced_at
   ```

3. Copy the spreadsheet ID from the URL. It is the long string between `/d/` and `/edit`:
   ```
   https://docs.google.com/spreadsheets/d/SPREADSHEET_ID_HERE/edit
   ```

4. Click **Share** and add the service account email address (found in the JSON file under `"client_email"`) as an **Editor**.

### Step 4 — Configure environment variables

Add these variables to your `.env` file:

```env
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_SPREADSHEET_ID=your_spreadsheet_id_here

# Option A: paste the entire JSON file content as a single-line string
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key":"..."}

# Option B: base64-encode the JSON file and paste the encoded string
# On Linux/Mac: base64 -w 0 service-account.json
GOOGLE_SERVICE_ACCOUNT_JSON=eyJ0eXBlIjoic2Vydmlj...
```

### What gets synced

Each qualified lead appends one row with these columns:

| Column | Source |
|---|---|
| `lead_id` | Lead UUID |
| `name` | Lead name |
| `email` | Lead email |
| `company` | Company name |
| `job_title` | Job title |
| `phone` | Phone number |
| `budget` | Budget string |
| `timeline` | Normalised timeline |
| `use_case` | Lead message / use case |
| `score` | Final qualification score |
| `status` | Qualification status |
| `recommended_action` | AI-recommended next action |
| `synced_at` | UTC timestamp of sync |

---

## Airtable

When enabled, a new record is created in an Airtable table each time a lead is qualified. The integration uses the Airtable REST API v0.

### Step 1 — Create an Airtable base and table

1. Log in to [airtable.com](https://airtable.com) and create a new base, or use an existing one.
2. Create a table named **Leads** (or any name — you will configure it below).
3. Add the following fields to the table:

   | Field Name | Field Type |
   |---|---|
   | Lead ID | Single line text |
   | Name | Single line text |
   | Email | Email |
   | Company | Single line text |
   | Job Title | Single line text |
   | Phone | Phone number |
   | Budget | Single line text |
   | Timeline | Single line text |
   | Use Case | Long text |
   | Score | Number |
   | Status | Single select (options: hot, warm, cold, unqualified) |
   | Recommended Action | Long text |

### Step 2 — Get your API credentials

**Personal Access Token:**
1. Go to [airtable.com/create/tokens](https://airtable.com/create/tokens).
2. Click **Create new token**.
3. Give it a name and grant the `data.records:write` scope.
4. Under **Access**, add the specific base you want to use.
5. Copy the generated token.

**Base ID:**
1. Open your Airtable base.
2. Go to **Help > API documentation** (or visit `https://airtable.com/developers/web/api/introduction`).
3. The base ID appears at the top of the documentation page and in all example URLs — it starts with `app` (e.g. `appXXXXXXXXXXXXXX`).

### Step 3 — Configure environment variables

```env
AIRTABLE_ENABLED=true
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX.XXXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Leads
```

`AIRTABLE_TABLE_NAME` defaults to `"Leads"` if not set.

---

## HubSpot

When enabled, leads are created or updated as HubSpot Contacts using the HubSpot Contacts API v3. If a contact with the same email address already exists, it is updated rather than duplicated.

### Step 1 — Create a Private App

HubSpot recommends Private Apps over legacy API keys.

1. In HubSpot, click the **Settings** icon (top right).
2. Navigate to **Integrations > Private Apps**.
3. Click **Create a private app**.
4. Give it a name (e.g. `Lead Qualification Agent`).
5. Under **Scopes**, grant:
   - `crm.objects.contacts.write`
   - `crm.objects.contacts.read`
6. Click **Create app** and copy the access token.

### Step 2 — Create custom contact properties

The integration writes to these HubSpot standard properties automatically: `email`, `firstname`, `lastname`, `company`, `jobtitle`, `phone`.

It also writes to the following **custom properties**, which you must create in HubSpot:

1. Go to **Settings > Properties > Contact properties**.
2. Click **Create property** for each of the following:

   | Internal Name | Label | Field Type |
   |---|---|---|
   | `lead_budget` | Lead Budget | Single-line text |
   | `lead_timeline` | Lead Timeline | Single-line text |
   | `lead_use_case` | Lead Use Case | Multi-line text |
   | `lead_score` | Lead Score | Single-line text |
   | `lead_status` | Lead Status | Single-line text |
   | `lead_recommended_action` | Recommended Action | Multi-line text |

   The **internal name** (not the label) must match exactly.

### Step 3 — Configure environment variables

```env
HUBSPOT_ENABLED=true
HUBSPOT_API_KEY=pat-na1-XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX
```

---

## Slack

When enabled, the system posts notifications to a Slack channel when a lead is qualified as `hot` or `warm`.

- **Hot leads** receive a rich Block Kit message with a button linking to the lead in the dashboard.
- **Warm leads** receive a compact single-line notification.
- **Cold and unqualified leads** do not trigger notifications.

### Step 1 — Create a Slack Incoming Webhook

1. Go to [api.slack.com/apps](https://api.slack.com/apps).
2. Click **Create New App > From scratch**.
3. Give it a name (e.g. `Lead Qualification Agent`) and pick your workspace.
4. In the left sidebar, click **Incoming Webhooks**.
5. Toggle **Activate Incoming Webhooks** to **On**.
6. Click **Add New Webhook to Workspace**.
7. Choose the channel where notifications should appear and click **Allow**.
8. Copy the webhook URL — it looks like `https://hooks.slack.com/services/T.../B.../XXXXXXXXXXXXXXXX`.

### Step 2 — Configure environment variables

```env
SLACK_WEBHOOK_URL=your-slack-webhook-url-here
```

### Notification content

**Hot lead notification includes:**
- Lead name, email, company, and score
- Qualification status and recommended action
- Budget and timeline
- A "View Lead in Dashboard" button

**Warm lead notification includes:**
- Lead name, email, company, and score

The `APP_BASE_URL` environment variable is used to construct the dashboard link in hot lead notifications:

```env
APP_BASE_URL=https://your-domain.com
```

---

## n8n

The n8n integration works in two directions:

1. **Outbound:** After qualification, the system POSTs the full lead payload to an n8n webhook URL.
2. **Inbound:** n8n workflows can submit leads to the system via `POST /api/webhooks/n8n`.

### Outbound: receiving qualified leads in n8n

#### Step 1 — Create a Webhook node in n8n

1. In your n8n workflow, add a **Webhook** node.
2. Set the **HTTP Method** to `POST`.
3. Set the **Path** to something like `/lead-qualification` (the full URL will be shown in the node).
4. Set **Authentication** to **None** (or use the header-based secret below).
5. Activate the workflow and copy the webhook URL.

#### Step 2 — Configure environment variables

```env
N8N_WEBHOOK_ENABLED=true
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/lead-qualification
```

#### Payload sent to n8n

```json
{
  "event": "lead.qualified",
  "timestamp": "2026-05-14T09:22:52Z",
  "lead": {
    "id": "3fa85f64-5717-4562-b3fc-2c963f66afa6",
    "name": "Jane Smith",
    "email": "jane.smith@techcorp.io",
    "company": "TechCorp Solutions",
    "job_title": "VP of Engineering",
    "phone": "+1-415-555-0182",
    "budget": "5000",
    "timeline": "this_month",
    "use_case": "Automate inbound sales pipeline"
  },
  "qualification": {
    "score": 87,
    "status": "hot",
    "recommended_action": "Schedule discovery call within 24 hours."
  },
  "ai_analysis": {
    "intent_level": "high",
    "budget_fit": "excellent",
    "urgency": "short_term",
    "pain_points": ["Manual pipeline not scaling"],
    "reasoning": "Strong BANT indicators across all dimensions."
  }
}
```

#### Example n8n workflow after receiving a lead

A typical downstream workflow might:

1. **Webhook node** — receives the `lead.qualified` event.
2. **IF node** — checks `qualification.status == "hot"`.
3. **HubSpot node** — creates or updates the contact.
4. **Gmail / SendGrid node** — sends the follow-up email.
5. **Slack node** — posts an alert to the sales team channel.

### Inbound: submitting leads from n8n to this system

Add an **HTTP Request** node to your n8n workflow:

- **Method:** `POST`
- **URL:** `http://your-backend:8000/api/webhooks/n8n`
- **Body:** JSON with lead fields (see field aliases in the API reference)
- **Headers:** `X-Webhook-Secret: your_secret` (if `WEBHOOK_SECRET` is configured)

The system accepts both snake_case and camelCase field names and handles nested `lead` or `data` wrappers automatically.

---

## Email / SMTP

When enabled, the system can send follow-up emails directly to leads via SMTP. Email sending is intentionally a manual step — a human must review and approve the AI-generated draft before it is dispatched.

### Workflow

1. Lead is qualified → AI generates a follow-up email draft (status: `draft_generated`).
2. Sales rep reviews the draft via `GET /api/leads/{id}/follow-up`.
3. Sales rep optionally edits the draft via `PUT /api/leads/{id}/follow-up`.
4. Sales rep approves via `POST /api/leads/{id}/approve-email`.
5. System sends via `POST /api/leads/{id}/send-email`.

### Gmail setup

1. Enable **2-Step Verification** on the Google account.
2. Go to **Google Account > Security > App passwords**.
3. Create an app password for "Mail" on your device.
4. Use the generated 16-character password as `SMTP_PASSWORD`.

```env
EMAIL_SENDING_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=yourname@gmail.com
SMTP_PASSWORD=xxxx xxxx xxxx xxxx
FROM_EMAIL=yourname@gmail.com
```

### SendGrid setup

1. Sign in to [sendgrid.com](https://sendgrid.com) and go to **Settings > API Keys**.
2. Create an API key with **Mail Send** permission.
3. Verify your sender email address under **Settings > Sender Authentication**.

```env
EMAIL_SENDING_ENABLED=true
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASSWORD=SG.XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX
FROM_EMAIL=verified-sender@yourdomain.com
```

### Amazon SES setup

1. Verify your sending domain or email address in the SES console.
2. Create SMTP credentials under **SES > SMTP Settings > Create SMTP Credentials**.

```env
EMAIL_SENDING_ENABLED=true
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=AKIAIOSFODNN7EXAMPLE
SMTP_PASSWORD=wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
FROM_EMAIL=verified-sender@yourdomain.com
```

### Mailgun setup

```env
EMAIL_SENDING_ENABLED=true
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=postmaster@mg.yourdomain.com
SMTP_PASSWORD=your-mailgun-smtp-password
FROM_EMAIL=noreply@yourdomain.com
```

### Port behaviour

| Port | Protocol |
|---|---|
| `465` | Implicit TLS (SSL) |
| `587` | STARTTLS (default — recommended) |
| `25` | Unencrypted (not recommended; often blocked) |

---

## Webhook Security

All three webhook endpoints (`/api/webhooks/lead`, `/api/webhooks/n8n`, `/api/webhooks/crm`) support an optional shared secret for request verification.

### Enabling webhook security

```env
WEBHOOK_SECRET=a-long-random-secret-string-here
```

Once set, all webhook callers must include a matching `X-Webhook-Secret` header:

```
POST /api/webhooks/lead
X-Webhook-Secret: a-long-random-secret-string-here
Content-Type: application/json
```

Requests without the header, or with a mismatched value, receive a `401 Unauthorized` response. The comparison is performed in constant time to prevent timing-based attacks.

When `WEBHOOK_SECRET` is not configured, the check is skipped and all requests are accepted — suitable for development or internal-only deployments.

### Generating a secure secret

```bash
# Linux / Mac
openssl rand -hex 32

# Python
python -c "import secrets; print(secrets.token_hex(32))"
```
