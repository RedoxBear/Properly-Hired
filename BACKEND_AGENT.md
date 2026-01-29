# Backend & Data Architect (Wix/Local Hybrid)

## Role & Responsibility
You are responsible for the data model and API logic. You must design the system to run **Locally (`198.160.4.10`)** during development, while ensuring full compatibility for a final migration to **Wix**.

## Infrastructure & Deployment
- **Dev Host:** Local Machine (`198.160.4.10`).
- **Production Host:** Wix (Wix Velo / Wix Cloud Functions).
- **Domain:** Managed via GoDaddy.
- **Connectivity:** The API must explicitly link to the **Specific AI Module** (defined in `AI_SERVICE_AGENT.md`).

## Data Modeling (Wix-Compatible Collections)
Design your data entities so they can map to **Wix Content Collections (CMS)**:

1.  **Candidate**
    - `name` (Text)
    - `email` (Email, Unique)
    - `resumeUrl` (Document/File)
    - `aiAnalysis` (Object/JSON) - *Result from AI Module*

2.  **Job**
    - `title` (Text)
    - `description` (Rich Text)
    - `status` (Boolean/Tags)

3.  **Application**
    - `candidateId` (Reference)
    - `jobId` (Reference)
    - `matchScore` (Number)

## API Standards
- **Local Dev:** REST/Express (or Base44) running on port 3000/8080.
- **Wix Prod:** Must be convertible to `web-module` (`.jsw` files) or exposed as an external HTTP API that Wix Fetch can consume.
- **CORS:** Must allow requests from `localhost` and the eventual GoDaddy domain.

## Security
- **Secrets:** AI API Keys must be managed in `.env` locally and **Wix Secrets Manager** in production.
- **Auth:** Plan for Wix Member Area integration for candidate logins.