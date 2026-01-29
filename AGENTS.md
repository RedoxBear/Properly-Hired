# Repository Guidelines

## Project Structure & Module Organization
- `index.html` is the Vite entry point.
- Source code lives in `src/`, with `src/main.jsx` bootstrapping React and `src/App.jsx` as the top-level component.
- Feature folders: `src/pages/` for route-level views, `src/components/` for shared UI, `src/hooks/` for reusable hooks, `src/utils/` for helpers, and `src/api/` for API helpers.
- Styling is split between `src/index.css`, `src/App.css`, and Tailwind configuration in `tailwind.config.js`.

## Build, Test, and Development Commands
- `npm install` installs dependencies.
- `npm run dev` starts the local Vite dev server with HMR.
- `npm run build` creates a production build in `dist/`.
- `npm run preview` serves the production build locally.
- `npm run lint` runs ESLint across the project.

## Coding Style & Naming Conventions
- Use 2-space indentation (consistent with existing JS/JSX files).
- Prefer JSX components in PascalCase (e.g., `UserCard.jsx`) and hooks in camelCase starting with `use` (e.g., `useUserData.js`).
- Keep route-level components in `src/pages/` and shared UI in `src/components/`.
- ESLint rules are defined in `eslint.config.js`; keep React hooks and React Refresh rules passing.

## Testing Guidelines
- No automated test framework is configured in `package.json` today.
- Rely on `npm run lint` and manual verification via `npm run dev` until tests are added.

## Commit & Pull Request Guidelines
- No Git history is present in this checkout, so there is no established commit convention.
- If you need a default, use short, imperative messages (e.g., "Add booking form").
- PRs should include a concise summary, reproduction steps for UI changes, and screenshots or short clips for visible updates.

## Configuration Tips
- Environment-specific settings belong in `.env` files at the project root (Vite reads `VITE_*` vars).
- Avoid committing secrets; prefer documenting required variables in the PR description.
