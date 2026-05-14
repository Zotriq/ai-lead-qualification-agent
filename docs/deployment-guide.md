# Deployment Guide

This guide covers how to run the AI Lead Qualification Agent in development, how to deploy it with Docker Compose, and how to take it to production on various cloud platforms.

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Local Development Setup](#local-development-setup)
4. [Docker Compose Deployment](#docker-compose-deployment)
5. [Production Considerations](#production-considerations)
6. [Cloud Deployment](#cloud-deployment)

---

## Prerequisites

| Tool | Minimum Version | Purpose |
|---|---|---|
| Python | 3.12 | Backend runtime |
| Node.js | 18 | Frontend runtime |
| PostgreSQL | 15 | Database |
| Docker | 24 | Containerised deployment |
| Docker Compose | 2.x | Multi-service orchestration |

---

## Environment Variables

Create a `.env` file in the project root (alongside `docker-compose.yml`). The backend reads this file at startup.

### Required

```env
# Database
DATABASE_URL=postgresql+asyncpg://leadagent:leadagent_secret@localhost:5432/lead_qualification

# OpenAI (leave empty to run in rule-only fallback mode)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

### Application URLs

```env
# Used to build links in Slack notifications and email drafts
APP_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8000
```

### PostgreSQL (Docker Compose only)

```env
POSTGRES_USER=leadagent
POSTGRES_PASSWORD=leadagent_secret
POSTGRES_DB=lead_qualification
```

### Dashboard authentication

```env
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=change_me_in_production
```

### Integrations (all optional — set only the ones you use)

```env
# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...

# Google Sheets
GOOGLE_SHEETS_ENABLED=false
GOOGLE_SHEETS_SPREADSHEET_ID=
GOOGLE_SERVICE_ACCOUNT_JSON=

# Airtable
AIRTABLE_ENABLED=false
AIRTABLE_API_KEY=
AIRTABLE_BASE_ID=
AIRTABLE_TABLE_NAME=Leads

# HubSpot
HUBSPOT_ENABLED=false
HUBSPOT_API_KEY=

# n8n
N8N_WEBHOOK_ENABLED=false
N8N_WEBHOOK_URL=

# Email / SMTP
EMAIL_SENDING_ENABLED=false
SMTP_HOST=
SMTP_PORT=587
SMTP_USER=
SMTP_PASSWORD=
FROM_EMAIL=

# Webhook security
WEBHOOK_SECRET=
```

### Full example `.env` file

```env
# Core
DATABASE_URL=postgresql+asyncpg://leadagent:leadagent_secret@postgres:5432/lead_qualification
OPENAI_API_KEY=sk-proj-XXXXXXXXXXXXXXXXXXXXXXXXXXXX
OPENAI_MODEL=gpt-4o-mini
APP_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8000

# Postgres (used by the postgres service in docker-compose.yml)
POSTGRES_USER=leadagent
POSTGRES_PASSWORD=leadagent_secret
POSTGRES_DB=lead_qualification

# Dashboard
DASHBOARD_USERNAME=admin
DASHBOARD_PASSWORD=supersecret

# Slack
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXX

# Google Sheets
GOOGLE_SHEETS_ENABLED=true
GOOGLE_SHEETS_SPREADSHEET_ID=1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account",...}

# Airtable
AIRTABLE_ENABLED=true
AIRTABLE_API_KEY=patXXXXXXXXXXXXXX
AIRTABLE_BASE_ID=appXXXXXXXXXXXXXX
AIRTABLE_TABLE_NAME=Leads

# HubSpot
HUBSPOT_ENABLED=true
HUBSPOT_API_KEY=pat-na1-XXXXXXXX

# n8n
N8N_WEBHOOK_ENABLED=true
N8N_WEBHOOK_URL=https://n8n.yourdomain.com/webhook/lead-qualified

# Email
EMAIL_SENDING_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=app-password-here
FROM_EMAIL=your@gmail.com

# Webhook secret
WEBHOOK_SECRET=replace-with-a-long-random-string
```

---

## Local Development Setup

This approach runs PostgreSQL in Docker and the backend/frontend directly on your machine.

### 1. Clone the repository

```bash
git clone https://github.com/Zotriq/ai-lead-qualification-agent.git
cd ai-lead-qualification-agent
```

### 2. Start PostgreSQL

```bash
docker run -d \
  --name lead-agent-postgres \
  -e POSTGRES_USER=leadagent \
  -e POSTGRES_PASSWORD=leadagent_secret \
  -e POSTGRES_DB=lead_qualification \
  -p 5432:5432 \
  postgres:16-alpine
```

### 3. Set up the Python backend

```bash
cd backend

# Create a virtual environment
python -m venv .venv
source .venv/bin/activate      # Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create a .env file in the project root (one directory up)
# The backend looks for .env relative to where it is started from
```

Create `.env` in the project root with at minimum:

```env
DATABASE_URL=postgresql+asyncpg://leadagent:leadagent_secret@localhost:5432/lead_qualification
OPENAI_API_KEY=sk-...
APP_BASE_URL=http://localhost:3000
BACKEND_BASE_URL=http://localhost:8000
```

### 4. Start the backend

```bash
# From inside the backend/ directory
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The database tables are created automatically on first startup (SQLAlchemy `create_all`).

The API is now available at `http://localhost:8000`.  
Interactive docs: `http://localhost:8000/docs`

### 5. Set up and start the frontend

```bash
cd ../frontend
npm install

# Create frontend environment file
echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local

npm run dev
```

The frontend is now available at `http://localhost:3000`.

### 6. Verify the stack

```bash
curl http://localhost:8000/health
# {"status":"ok","service":"ai-lead-qualification-agent"}

curl http://localhost:8000/ready
# {"status":"ready","checks":{"database":"ok"}}
```

---

## Docker Compose Deployment

The `docker-compose.yml` in the project root defines three services: `postgres`, `backend`, and `frontend`.

### 1. Create the `.env` file

Copy the example from the Environment Variables section above into a `.env` file in the project root. Make sure `DATABASE_URL` uses `postgres` (the Docker service name) as the host:

```env
DATABASE_URL=postgresql+asyncpg://leadagent:leadagent_secret@postgres:5432/lead_qualification
```

### 2. Build and start all services

```bash
docker compose up --build
```

Add `-d` to run in detached (background) mode:

```bash
docker compose up --build -d
```

### 3. Verify the services

```bash
docker compose ps

# Expected output:
# NAME                    STATUS          PORTS
# ...-postgres-1          running (healthy)   0.0.0.0:5432->5432/tcp
# ...-backend-1           running         0.0.0.0:8000->8000/tcp
# ...-frontend-1          running         0.0.0.0:3000->3000/tcp
```

```bash
curl http://localhost:8000/health
curl http://localhost:8000/ready
```

### 4. View logs

```bash
# All services
docker compose logs -f

# Backend only
docker compose logs -f backend

# Last 50 lines
docker compose logs --tail=50 backend
```

### 5. Stop and remove containers

```bash
# Stop but keep volumes (database data is preserved)
docker compose down

# Stop and remove volumes (destroys database data)
docker compose down -v
```

### 6. Update after code changes

```bash
docker compose up --build -d
```

---

## Production Considerations

### Reverse proxy and SSL

Never expose the backend or frontend directly on ports 8000/3000 in production. Put a reverse proxy in front with TLS termination.

**Nginx example configuration:**

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name yourdomain.com;

    ssl_certificate     /etc/letsencrypt/live/yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/yourdomain.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health probes
    location /health {
        proxy_pass http://localhost:8000;
    }
    location /ready {
        proxy_pass http://localhost:8000;
    }
}
```

Use [Certbot](https://certbot.eff.org) to obtain a free Let's Encrypt certificate:

```bash
certbot --nginx -d yourdomain.com
```

### Environment variable security

Never commit `.env` to version control. In production:

- Use your platform's secret management (AWS Secrets Manager, GCP Secret Manager, Railway variables, etc.)
- Rotate `OPENAI_API_KEY`, `WEBHOOK_SECRET`, and SMTP passwords regularly
- Set a strong, unique `DASHBOARD_PASSWORD` — the default `admin123` must not be used in production

### Database backups

The PostgreSQL data is stored in the `postgres_data` Docker volume. Set up automated backups:

```bash
# Manual backup
docker compose exec postgres pg_dump \
  -U leadagent lead_qualification \
  > backup_$(date +%Y%m%d_%H%M%S).sql

# Restore from backup
docker compose exec -T postgres psql \
  -U leadagent lead_qualification \
  < backup_20260514_090000.sql
```

For automated backups, consider:
- [pg_cron](https://github.com/citusdata/pg_cron) for scheduled dumps inside PostgreSQL
- [pgBackRest](https://pgbackrest.org) for point-in-time recovery
- Managed databases (RDS, Cloud SQL, Railway Postgres) which include automated backups

### Scaling the backend

The backend is a stateless async FastAPI app. To scale horizontally:

1. Extract the database to a managed PostgreSQL service.
2. Run multiple backend replicas behind a load balancer.
3. Replace `docker compose` with Kubernetes or a managed container service.

For a single-server deployment, increase worker count:

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000 --workers 4
```

Note: When using `--workers` with the Docker Compose setup, update the `CMD` in `backend/Dockerfile`:

```dockerfile
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "4"]
```

### CORS

The CORS policy is configured in `backend/app/main.py`. In production, restrict `allow_origins` to your actual frontend domain:

Update `APP_BASE_URL` and `BACKEND_BASE_URL` in your `.env`:

```env
APP_BASE_URL=https://yourdomain.com
BACKEND_BASE_URL=https://api.yourdomain.com
```

### Health and readiness probes

| Endpoint | Use |
|---|---|
| `GET /health` | Liveness — process is running |
| `GET /ready` | Readiness — database is reachable |

Configure your load balancer or orchestrator to use these probes. Unhealthy backend instances should be taken out of rotation.

---

## Cloud Deployment

### Railway

Railway offers the simplest path from `docker-compose.yml` to production.

1. Install the [Railway CLI](https://docs.railway.app/develop/cli) and log in.
2. Create a new project:
   ```bash
   railway init
   ```
3. Provision a PostgreSQL database from the Railway dashboard.
4. Copy the connection string from Railway and set it as `DATABASE_URL` in Railway's variable settings (using `asyncpg` driver: `postgresql+asyncpg://...`).
5. Add all other environment variables in the Railway dashboard under your service's **Variables** tab.
6. Deploy:
   ```bash
   railway up
   ```

Railway automatically builds from the `Dockerfile` in each service directory.

### Render

1. Create a new **Web Service** in the Render dashboard.
2. Connect your GitHub repository.
3. Set **Root directory** to `backend`, **Build Command** to `pip install -r requirements.txt`, and **Start Command** to `uvicorn app.main:app --host 0.0.0.0 --port 8000`.
4. Create a **PostgreSQL** database from Render's dashboard and copy the internal connection string.
5. Add all environment variables under **Environment** in the service settings.
6. Deploy.

For the frontend, create a second **Web Service** with root directory `frontend`, build command `npm install && npm run build`, and start command `npm run start`.

### AWS — Elastic Container Service (ECS)

1. Push the Docker images to Amazon ECR:
   ```bash
   aws ecr create-repository --repository-name lead-agent-backend
   aws ecr create-repository --repository-name lead-agent-frontend
   docker build -t lead-agent-backend ./backend
   docker tag lead-agent-backend:latest <account_id>.dkr.ecr.<region>.amazonaws.com/lead-agent-backend:latest
   docker push <account_id>.dkr.ecr.<region>.amazonaws.com/lead-agent-backend:latest
   ```
2. Create an **RDS PostgreSQL** instance (or Aurora Serverless v2).
3. Store secrets in **AWS Secrets Manager** and inject them as environment variables in ECS task definitions.
4. Create an ECS cluster, task definition, and service pointing to your ECR images.
5. Put an **Application Load Balancer** in front with an ACM SSL certificate.

### GCP — Cloud Run

Cloud Run is a good fit for the stateless backend.

1. Build and push images to Artifact Registry:
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/lead-agent-backend ./backend
   ```
2. Create a **Cloud SQL PostgreSQL** instance.
3. Deploy the backend:
   ```bash
   gcloud run deploy lead-agent-backend \
     --image gcr.io/PROJECT_ID/lead-agent-backend \
     --platform managed \
     --region us-central1 \
     --set-env-vars DATABASE_URL=postgresql+asyncpg://... \
     --set-secrets OPENAI_API_KEY=openai-key:latest \
     --allow-unauthenticated
   ```
4. Deploy the frontend similarly, setting `NEXT_PUBLIC_API_URL` to the Cloud Run backend URL.

### VPS / Bare Metal

For a single-server deployment on a VPS (DigitalOcean, Linode, Hetzner, etc.):

```bash
# Install Docker and Docker Compose
curl -fsSL https://get.docker.com | sh
apt install docker-compose-plugin -y

# Clone and configure
git clone https://github.com/Zotriq/ai-lead-qualification-agent.git
cd ai-lead-qualification-agent
cp .env.example .env   # edit .env with production values

# Start the stack
docker compose up -d

# Set up Nginx with Certbot
apt install nginx certbot python3-certbot-nginx -y
# Configure nginx as shown in the Reverse Proxy section above
certbot --nginx -d yourdomain.com
```

Set up automatic updates:

```bash
# /etc/cron.d/lead-agent-update
0 4 * * 0 cd /opt/ai-lead-qualification-agent && git pull && docker compose up --build -d
```

Consider using [Watchtower](https://containrrr.dev/watchtower/) to automatically pull updated Docker images:

```bash
docker run -d \
  --name watchtower \
  -v /var/run/docker.sock:/var/run/docker.sock \
  containrrr/watchtower \
  --schedule "0 0 4 * * 0"
```
