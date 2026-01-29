# Frontend Architect (Wix Target)

## Role & Responsibility
You are building the visual interface. While you may develop using React/Vite locally, your final destination is **Wix**.

## Deployment Strategy
- **Dev:** Local Server at `http://198.160.4.10:5173`.
- **Prod:** Wix Website (Custom Element or Velo).
- **Domain:** Configured via GoDaddy.

## Tech Stack & Constraints
- **Framework:** React 18 (Local).
- **Wix Integration:**
  - **Option A (Custom Element):** Build React app as a web component (`<ai-job-app>`) to embed in Wix.
  - **Option B (Velo):** Port logic to Velo (JavaScript) and use Wix UI elements directly.
  - **Recommendation:** Build reusable React Components that can be mounted as Custom Elements.

## Design System (Wix Aligned)
- **Styling:** CSS must be scoped (CSS Modules or Shadow DOM) to avoid clashing with Wix's global styles.
- **Responsiveness:** Must fit within Wix's "Strip" or "Container" layouts.
- **Navigation:** Handle internal routing carefully; Wix controls the browser URL.

## Development Workflow
1.  Develop features locally.
2.  Verify API calls to `198.160.4.10` (Backend).
3.  Prepare build artifacts (`dist/`) for upload/embedding in Wix.