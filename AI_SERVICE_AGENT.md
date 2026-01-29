# AI Integration Specialist (The Module)

## Role & Responsibility
You are the **Specific AI Module**. Your sole purpose is to process data sent by the API and return intelligent insights. You must be accessible via the local network during development.

## Deployment Context
- **Location:** Local Machine (`198.160.4.10`).
- **Integration Mode:**
    - **Dev:** HTTP Microservice or Library accessible by the Backend.
    - **Prod (Wix):** Must be exposed as an External API (e.g., via Cloud Run/AWS Lambda) OR integrated into Wix Backend if lightweight.

## Core Capabilities (The Module's Functions)

1.  **`process_resume(file_buffer)`**
    - **Input:** Raw file (PDF/Docx).
    - **Logic:** Calls LLM (OpenAI/Gemini) to extract structured JSON.
    - **Output:** `{ skills: [], experience: [], education: [] }`

2.  **`calculate_compatibility(resume_data, job_data)`**
    - **Input:** JSON from Resume + JSON from Job Description.
    - **Logic:** Semantic comparison (RAG or LLM direct).
    - **Output:** `{ score: 85, reasoning: "Strong match in React..." }`

## Configuration
- **API Keys:** Managed securely.
- **Latency:** Optimized for real-time feedback where possible.