# AI Pop Studios Code Overview

## Application Entry
- `src/main.jsx` bootstraps the React app, loads global styles, and initializes analytics tracking before rendering the root component.【F:src/main.jsx†L1-L13】
- `src/index.css` pulls in Tailwind's base, component, and utilities layers and ensures the root layout fills the viewport.【F:src/index.css†L1-L7】

## Core UI (`src/App.jsx`)
- Centralizes configuration (logo fallbacks, Supabase credentials, tag/group metadata) and helper utilities for URLs, image previews, and downloads.【F:src/App.jsx†L18-L115】
- Implements a progressive image component and a robust `DownloadButton` that fetches blobs to guarantee correct file extensions, falling back to query-parameter downloads on error.【F:src/App.jsx†L117-L230】
- Provides top-level layout elements:
  - `Header` with dynamic logo fallback and TikTok CTA.【F:src/App.jsx†L239-L286】
  - `Hero` section describing the gallery and mobile-friendly guidance.【F:src/App.jsx†L288-L312】
  - `Filters` allowing search, group selection, and sort order adjustments (tag chips were removed for a simplified UI).【F:src/App.jsx†L314-L386】
  - `Footer` summarizing usage restrictions and attribution.【F:src/App.jsx†L440-L463】
- Renders a `Gallery` grid of Supabase-backed image entries and a modal detail view with download actions and TikTok links.【F:src/App.jsx†L388-L438】
- Includes an optional `AdminPanel` for authenticated Supabase uploads, handling Google OAuth, file uploads, metadata entry, and insertion into the `drops` table.【F:src/App.jsx†L465-L639】
- The root `App` component fetches entries from Supabase, applies filters/sorting, and composes the full page, including an admin mode toggled via the `?admin=1` query parameter.【F:src/App.jsx†L641-L736】

## Analytics (`src/analytics.js`)
- Lazily loads Google Analytics when a GA ID is provided in production, installs `gtag`, and emits SPA-friendly page view events on navigation changes.【F:src/analytics.js†L1-L38】

## Supabase configuration
- Authentication, gallery uploads, and the digital shop all talk to the same Supabase project. Follow the [Supabase setup guide](./SUPABASE_SETUP.md) to collect the `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON`, and admin email credentials, and to provision the `drops`/`shop_items` tables plus the shared storage bucket.

## Deployment
- The project is configured for Vercel. If you encounter a `DEPLOYMENT_NOT_FOUND` error when visiting your domain, review the [Vercel deployment troubleshooting guide](./VERCEL_DEPLOYMENT.md) for steps to relink the domain to an active build.

