# Vaksinomat – Claude Code Instructions

## Stack
- Next.js 14 App Router, TypeScript, Tailwind CSS, shadcn/ui
- Firebase Admin SDK + Firestore (GCP project `bht-vertexai-production`, region `europe-west1`)
- `@google/generative-ai` – alltid bruk `gemini-3.1-pro-preview`, aldri flash-modeller
- `date-fns` v3 med norsk locale (`{ nb } from "date-fns/locale"`)

## Medisinske regler – ALDRI bytt til AI
All medisinsk logikk er regelbasert. Bruk aldri Gemini/AI til medisinske beslutninger:
- `lib/engines/recommendation-engine.ts` – aggregerer risikoer, anbefaler vaksiner
- `lib/engines/scheduling-engine.ts` – datoplanlegging (live-vaksine 28-dagersregel, gulfeber dag 10, rabies dag 0/7/21)
- `lib/engines/contraindication-checker.ts` – blokker vaksiner for gravide/immunsupprimerte/allergi
- `lib/engines/journal-formatter.ts` – norsk journaltekst for copy-paste

AI (Gemini) brukes KUN i:
- `lib/gemini/fallback-advisor.ts` – veiledende notat for flaggede saker (ikke i request-path)
- `scripts/bootstrap-countries.ts` og `scripts/update-fhi-data.ts`

## Testing
```bash
npm run test          # alle tester (unit + API-integrasjon)
npm run test:unit     # kun unit-tester (ingen server nødvendig)
npm run test:api      # kun API-integrasjonstester (krever npm run dev)
```

**API-tester krever at dev-serveren kjører:**
```bash
npm run dev   # i en terminal
npm test      # i en annen terminal
```

API-testene treffer ekte Firestore (`bht-vertexai-production`). Testdata lagres med `nurseId: "test-nurse"`.

## Kjente fallgruver
- **`db.settings()` kan kun kalles én gang** – kall det kun inne i `getApps().length === 0`-blokken i `firestore-logger.ts`, ikke utenfor
- **`date-fns` locale**: bruk `{ nb } from "date-fns/locale"` (named export), IKKE `nb from "date-fns/locale/nb"`
- **`next.config.mjs`** – ikke `.ts` (Next.js 14 støtter ikke TS config-filer)
- **`jest.config.js`** – ikke `.ts` (ts-node ikke tilgjengelig i dev-deps)
- **Firestore-spørringer** med `where() + orderBy()` på ulike felt krever composite index – sorter heller i minnet

## GCP-ressurser
- Prosjekt: `bht-vertexai-production`
- Firestore: `europe-west1`, default database
- Autentisering lokalt: Application Default Credentials (ADC) via `gcloud auth application-default login`
- Alle GCP-ressurser MÅ opprettes via `gcloud` CLI – ikke anta at de eksisterer

## Miljøvariabler (`.env`, ikke committet)
```
GEMINI_API_KEY=...
GOOGLE_CLOUD_PROJECT=bht-vertexai-production
```
