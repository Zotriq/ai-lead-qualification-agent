# Scoring Rules

This document explains how the AI Lead Qualification Agent scores inbound leads, what each scoring component contributes, how thresholds map to qualification tiers, and how to customise the rules.

---

## Table of Contents

1. [Overview — Hybrid Scoring](#overview--hybrid-scoring)
2. [Scoring Components](#scoring-components)
3. [Qualification Thresholds](#qualification-thresholds)
4. [Score Calculation Examples](#score-calculation-examples)
5. [Customising scoring_rules.yaml](#customising-scoring_rulesyaml)

---

## Overview — Hybrid Scoring

Every lead goes through a two-stage pipeline:

```
Inbound lead
     │
     ▼
┌─────────────────────────┐
│  Stage 1: Rule Engine   │  Deterministic, fast, always runs
│  (ScoringEngine)        │  Produces: rule_score (0–100)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Stage 2: AI Analysis   │  GPT-4o-mini, async, may fall back
│  (AILeadAnalyzer)       │  Produces: ai_score (0–100)
└───────────┬─────────────┘
            │
            ▼
┌─────────────────────────┐
│  Score Blending         │  final_score = (0.60 × ai_score)
│                         │              + (0.40 × rule_score)
└───────────┬─────────────┘
            │
            ▼
    final_score → tier (hot / warm / cold / unqualified)
```

### Why hybrid?

- **Rule-based scoring** is fast, transparent, and free. It catches obvious signals (large budget, senior title, urgent timeline) reliably.
- **AI scoring** understands nuance — tone, specificity of the use case, implied urgency, and context that rules cannot capture.
- **Blending (60 % AI + 40 % rules)** gives the AI the dominant voice while keeping the system functional when OpenAI is unavailable. When OpenAI is unreachable the rule score is used for both halves, making the result fully rule-based.

The `ai_available` flag in `ai_analysis_json` tells you whether the AI actually ran.

---

## Scoring Components

The rule engine evaluates nine components. All values come from `backend/app/config/scoring_rules.yaml`.

### 1. Budget — up to 25 points

| Condition | Points |
|---|---|
| Budget >= $5,000 (high_value_min) | 25 |
| Budget >= $1,000 (medium_value_min) | 15 |
| Budget > $0 | 5 |
| No budget provided | 0 |

Budget is normalised before scoring. Currency symbols (`$`, `£`, `€`) and commas are stripped. Non-numeric labels are mapped:

| Label | Treated as |
|---|---|
| `"high"`, `"enterprise"`, `"large"` | $5,000 (high) |
| `"medium"`, `"mid"` | $1,000 (medium) |

### 2. Timeline — up to 20 points

| Timeline value | Points |
|---|---|
| `asap`, `now`, `immediately`, `urgent` | 20 |
| `this_month` (or "within 30 days") | 20 |
| `next_month` (or "30 day") | 10 |
| `this_quarter` (or "current quarter") | 5 |
| `next_quarter` | 2 |
| No timeline / unknown | 0 |

Timeline strings are normalised to lowercase and spaces are replaced with underscores before lookup. Fuzzy matching handles common variations.

### 3. Company Size — up to 15 points

| Bucket | Headcount | Points |
|---|---|---|
| `enterprise` | 500+ | 15 |
| `large` | 200–499 | 12 |
| `medium` | 50–199 | 10 |
| `small` | 10–49 | 5 |
| `micro` | 1–9 | 2 |
| `unknown` | not provided | 0 |

Company size strings are parsed to a number first. The value `"51-200"` is parsed as `51` (lower bound), which maps to `medium`. Pre-labelled strings like `"enterprise"` are accepted directly.

### 4. Decision-Maker Authority — 0 or 15 points

If the job title contains any of the following keywords (case-insensitive), 15 points are awarded:

```
CEO, Founder, Co-Founder, CTO, COO, CFO, VP, Vice President,
Director, Head of, Manager, Owner, Partner, President, Chief
```

Only a single match is needed; multiple keyword matches do not stack.

### 5. Industry Match — 0 or 10 points

If the industry field matches any of the target industries (partial match, case-insensitive), 10 points are awarded:

```
saas, technology, fintech, healthcare, ecommerce, e-commerce,
artificial intelligence, ai, automation, consulting,
professional services, real estate, finance, insurance, logistics
```

### 6. Country Match — 0 or 5 points

If the country field exactly matches any of the target countries (case-insensitive), 5 points are awarded:

```
United States, United Kingdom, Canada, Australia, Germany,
France, Netherlands, Singapore, UAE, Saudi Arabia
```

### 7. Intent Detection — 0 or 20 points

If the lead's message contains any of the intent keywords (case-insensitive), 20 points are awarded. Points are awarded once regardless of how many keywords appear:

```
need, looking for, want to, interested in, help us, automate,
improve, solution, integrate, build, develop, implement,
urgent, asap, immediately, ready to start
```

### 8. Spam Detection — 0 or -50 points

If any spam keyword is detected in the combined text (name + email + company + message + job title), a **penalty of -50 points** is applied:

```
free money, click here, act now, limited time, congratulations,
you won, nigerian prince, crypto opportunity,
guaranteed income, make money fast
```

### 9. Field Completeness — 0 to 10 points

Completeness is scored proportionally based on how many of the nine tracked fields are present and non-empty:

Tracked fields: `name`, `email`, `company`, `phone`, `budget`, `timeline`, `message`, `job_title`, `industry`

```
completeness_score = round((filled_fields / 9) × 10)
```

A lead with all nine fields filled receives the full 10 points. A lead with only name and email receives 2 points.

### 10. Missing Critical Field Penalties

Additional deductions are applied for missing fields that are considered critical:

| Missing Field | Penalty |
|---|---|
| `email` | -20 |
| `name` | -15 |
| `message` | -10 |
| `company` | -5 |

Note: In practice, `email` is required at intake, so the -20 penalty is rarely triggered.

### Score Clamping

After summing all components (including penalties), the raw total is clamped to the range **[0, 100]**:

```
final_rule_score = max(0, min(100, raw_total))
```

---

## Qualification Thresholds

After blending, the final score is mapped to a qualification tier:

| Score Range | Tier | Meaning |
|---|---|---|
| 75 – 100 | **hot** | High-intent, qualified lead. Immediate sales action recommended. Triggers Slack alert + Sheets/Airtable/HubSpot sync. |
| 50 – 74 | **warm** | Moderate fit. Worth nurturing. Triggers compact Slack notification. |
| 25 – 49 | **cold** | Low fit or missing key information. Add to a nurture sequence. |
| 0 – 24 | **unqualified** | Very poor fit, incomplete, or spam. No further action recommended. |

Thresholds are configured in `scoring_rules.yaml`:

```yaml
thresholds:
  hot: 75
  warm: 50
  cold: 25
```

Scores below `cold` (i.e. below 25) are classified as `unqualified`.

---

## Score Calculation Examples

### Example 1 — Hot Lead

**Lead data:**
- Name: Jane Smith
- Email: jane.smith@techcorp.io
- Company: TechCorp Solutions
- Company size: 80 (medium)
- Job title: VP of Engineering
- Industry: Software / SaaS
- Country: United States
- Budget: $5,000
- Timeline: this_month
- Message: "We need to automate our inbound sales pipeline."
- Phone: provided

**Rule-based breakdown:**

| Component | Score |
|---|---|
| Budget ($5,000 >= $5,000) | +25 |
| Timeline (this_month) | +20 |
| Company size (medium, 80 employees) | +10 |
| Decision-maker (VP) | +15 |
| Industry match (saas) | +10 |
| Country match (United States) | +5 |
| Intent (contains "automate", "need") | +20 |
| Spam detection | 0 |
| Completeness (8 of 9 fields filled) | +9 |
| Missing critical penalties (all present) | 0 |
| **Raw total** | **114** |
| **After clamping to [0, 100]** | **100** |

**AI score (example):** 90

**Final blended score:** `(0.60 × 90) + (0.40 × 100) = 54 + 40 = 94`

**Tier: hot**

---

### Example 2 — Warm Lead

**Lead data:**
- Name: Alex Johnson
- Email: alex@startup.io
- Company: not provided
- Company size: 15 (small)
- Job title: Marketing Manager
- Industry: E-commerce
- Country: Canada
- Budget: $1,500
- Timeline: next_quarter
- Message: "Looking for a way to improve our lead process."
- Phone: not provided

**Rule-based breakdown:**

| Component | Score |
|---|---|
| Budget ($1,500 >= $1,000) | +15 |
| Timeline (next_quarter) | +2 |
| Company size (small, 15 employees) | +5 |
| Decision-maker (Manager) | +15 |
| Industry match (e-commerce) | +10 |
| Country match (Canada) | +5 |
| Intent (contains "looking for", "improve") | +20 |
| Spam detection | 0 |
| Completeness (6 of 9 fields filled) | +7 |
| Missing critical penalties (company -5) | -5 |
| **Raw total** | **74** |
| **After clamping** | **74** |

**AI score (example):** 65

**Final blended score:** `(0.60 × 65) + (0.40 × 74) = 39 + 29.6 = 69`

**Tier: warm**

---

### Example 3 — Unqualified / Spam Lead

**Lead data:**
- Name: Make Money Fast
- Email: spam@example.com
- Message: "Guaranteed income opportunity — act now!"
- All other fields: not provided

**Rule-based breakdown:**

| Component | Score |
|---|---|
| Budget | 0 |
| Timeline | 0 |
| Company size | 0 |
| Decision-maker | 0 |
| Industry match | 0 |
| Country match | 0 |
| Intent | 0 |
| Spam detection ("guaranteed income", "act now") | -50 |
| Completeness (2 of 9 fields filled) | +2 |
| Missing critical penalties (name -15, message present, company -5) | -20 |
| **Raw total** | **-68** |
| **After clamping to [0, 100]** | **0** |

**Tier: unqualified**

---

## Customising scoring_rules.yaml

The scoring rules are loaded from `backend/app/config/scoring_rules.yaml` at startup. Editing this file and restarting the backend applies the new rules immediately. No code changes are needed.

### File location

```
backend/app/config/scoring_rules.yaml
```

### Changing score thresholds

To make it harder to reach `hot` status:

```yaml
thresholds:
  hot: 80     # was 75
  warm: 55    # was 50
  cold: 30    # was 25
```

### Changing budget thresholds

To target higher-value clients:

```yaml
budget:
  high_value_min: 10000    # was 5000 — 25 pts for $10k+
  medium_value_min: 2500   # was 1000 — 15 pts for $2.5k+
```

### Adding target industries

```yaml
target_industries:
  - saas
  - technology
  - fintech
  - healthcare
  - ecommerce
  - e-commerce
  - artificial intelligence
  - ai
  - automation
  - consulting
  - professional services
  - real estate
  - finance
  - insurance
  - logistics
  - legal          # added
  - education      # added
  - manufacturing  # added
```

### Adding target countries

```yaml
target_countries:
  - united states
  - united kingdom
  - canada
  - australia
  - germany
  - france
  - netherlands
  - singapore
  - uae
  - saudi arabia
  - india          # added
  - new zealand    # added
```

### Adjusting decision-maker titles

To score individual contributors:

```yaml
decision_maker_titles:
  - CEO
  - Founder
  - CTO
  - VP
  - Director
  - Head of
  - Manager
  - Owner
  - Senior Engineer  # added
  - Lead Developer   # added

decision_maker_score: 15  # reduce to 10 if widening the list
```

### Adjusting intent keywords

```yaml
intent_keywords:
  - need
  - looking for
  - want to
  - interested in
  - help us
  - automate
  - improve
  - solution
  - integrate
  - build
  - develop
  - implement
  - urgent
  - asap
  - immediately
  - ready to start
  - evaluate         # added
  - replace          # added
  - migrate          # added

intent_score: 20
```

### Adjusting spam keywords

```yaml
spam_keywords:
  - free money
  - click here
  - act now
  - limited time
  - congratulations
  - you won
  - nigerian prince
  - crypto opportunity
  - guaranteed income
  - make money fast
  - investment opportunity  # added

spam_penalty: -50
```

### Tuning completeness scoring

To track more fields and give them more weight:

```yaml
completeness_fields:
  - name
  - email
  - company
  - phone
  - budget
  - timeline
  - message
  - job_title
  - industry
  - country       # added
  - project_type  # added

completeness_max_score: 15  # was 10
```

### Tuning missing critical penalties

To penalise missing phone numbers:

```yaml
missing_critical_penalties:
  email: -20
  name: -15
  message: -10
  company: -5
  phone: -5   # added
```

### Applying changes

After editing the YAML file:

```bash
# If running with Docker Compose
docker compose restart backend

# If running locally
# Just restart the uvicorn process — the file is read at startup
```

No database migrations are needed. Existing lead scores are not retroactively updated. To re-score existing leads with the new rules, use `POST /api/leads/{id}/qualify` on each lead.
