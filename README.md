# Device Normalizer

A device-coverage dashboard for security teams. It correlates endpoints across
**EDR (CrowdStrike)**, **MDM (JumpCloud)** and **IDP (Okta)** into one normalized
inventory, then surfaces coverage gaps — devices missing EDR, missing MDM,
identity-only / shadow IT, stale agents — and scores overall fleet posture.

> **Demo build.** This is a frontend-only showcase that runs entirely on
> **synthetic mock data** — no backend, no real devices or people. The data layer
> is intercepted in [`src/lib/mock-fetch.ts`](src/lib/mock-fetch.ts).

## Highlights

- **Bento dashboard** — risk-score + source-health hero, KPI band, paired
  operational panels, and full-width inventory tables.
- **Coverage controls** — KRI/CIS-tagged checks (e.g. "MDM without EDR").
- **People & dual-use views** — per-owner compliance; corporate vs. personal devices.
- **Scoped AI assistant** — canned, inventory-only Q&A (demo).
- Accessible nav rail, light/dark themes, reduced-motion aware, tabular numerics.

## Stack

React 19 · TypeScript · Vite · Tailwind CSS v4 · Recharts · Motion · lucide-react

## Run

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # production build
```

## Notes

All numbers, hostnames, owners and organizations in this demo are fabricated.
