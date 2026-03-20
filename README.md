# Vaksinomat

Veiledet reisevaksinasjonskonsultasjon for sykepleiere hos Dr. Dropin. Erstatter lege i standard reisevaksinvurderinger – sykepleier fyller ut et 5-stegs skjema og får en faglig korrekt, datert vaksinasjonsplan med internkontroll. Høyrisikopasienter flagges automatisk til legegjennomgang.

## Komme i gang

```bash
cp .env.local.example .env.local
# Fyll inn GOOGLE_CLOUD_PROJECT

npm install
npm run dev
```

Åpne [http://localhost:3000](http://localhost:3000) – redirecter automatisk til `/consultation/new`.

## Prosjektstruktur

```
vaksinomat/
├── app/
│   ├── consultation/new/          # 5-stegs konsultasjonsskjema
│   ├── consultation/[id]/result/  # Anbefalingsplan + kopier journaltekst
│   ├── admin/                     # Legepanel – gjennomgangskø
│   └── api/                       # REST-endepunkter
├── lib/
│   ├── engines/                   # ⭐ Kjernelogikk (regelbasert, ikke AI)
│   │   ├── recommendation-engine.ts
│   │   ├── scheduling-engine.ts
│   │   ├── contraindication-checker.ts
│   │   └── journal-formatter.ts
│   ├── data/                      # JSON-loadere og Zod-validering
│   ├── claude/                    # AI-notat (kun rådgivende)
│   └── audit/                     # Firestore audit-logg
├── data/
│   ├── vaccines.json              # 13 vaksiner med doseringsoppsett
│   ├── countries.json             # 63 land med risikoprofiler
│   └── malaria-prophylaxis.json   # Malarone, Doksysyklin, Lariam
├── scripts/
│   ├── validate-data.ts           # CI-validering av JSON-data
│   ├── fhi-source.ts              # Deterministisk FHI-scraping og seksjonsuttrekk
│   ├── bootstrap-countries.ts     # Lager draft-data fra FHI-sider uten AI
│   └── update-fhi-data.ts         # Månedlig: scrape + diff + reviewrapport
└── __tests__/                     # Unit-tester for medisinsk logikk
```

## Kjøre tester

```bash
npm test               # Starter testserver automatisk og kjører hele testpakken
npm run validate-data  # Validerer vaccines.json og countries.json mot Zod-skjema
```

## Medisinsk logikk

All vaksinasjonslogikk er **regelbasert**. AI brukes ikke til å generere landdata eller anbefalinger i produktet.

### Planleggingsregler

| Regel | Logikk |
|---|---|
| Levende vaksiner | Samme dag **eller** ≥ 28 dager mellom (Gulfeber, MMR, Varicella, Oral Tyfoid) |
| Gulfeber-sertifikat | Gyldig fra dag 10 etter vaksinasjon |
| Rabies (pre-eksp) | 3 doser: dag 0, 7, 21–28 – fullfør ≥ 1 dag før avreise |
| Japansk encefalitt | 2 doser 4 uker mellom – fullfør ≥ 10 dager før avreise |
| Hep B standard | 0, 1, 6 måneder |
| Hep B akselerert | 0, 7, 21 dager (+ booster 12 mnd) – velges automatisk ved < 6 mnd til avreise |
| Malarone | Start 2 dager før, slutt 7 dager etter retur |
| Doksysyklin | Start 2 dager før, slutt 28 dager etter retur |
| Lariam | Start 18 dager før, slutt 28 dager etter retur |

### Kontraindikasjoner (absolutt)

| Tilstand | Berørte vaksiner |
|---|---|
| Gravid | Alle levende vaksiner |
| Immunsupprimert | Alle levende vaksiner |
| Eggehviteallergi | Gulfeber |
| HIV positiv (CD4 < 200) | Alle levende vaksiner + Rabies |
| Alder < 9 mnd | Gulfeber |

### Internkontroll

- **Flagg til lege:** Gravid, immunsupprimert, HIV-positiv, absolutt KI
- **Auto-godkjenn:** Alle andre saker
- Alle konsultasjoner lagres i Firestore med tidsstempel og sykepleier-ID

## GCP-oppsett

```bash
# Sett prosjekt-ID
gcloud config set project <PROJECT_ID>

# Opprett secrets
echo -n "sk-ant-..." | gcloud secrets create ANTHROPIC_API_KEY --data-file=-

# Deploy til Cloud Run via Cloud Build
gcloud builds submit
```

Se `cloudbuild.yaml` for full deploy-pipeline.

## Datahåndtering

Vaksin- og landdata er statisk JSON versjonskontrollert i Git og bakt inn i Docker-imaget. Månedlig oppdateringssyklus:

```
Cloud Scheduler (1./mnd)
  → Cloud Run Job kjører scripts/update-fhi-data.ts
      → Deterministisk scraping av FHI-landssider
      → Seksjonsuttrekk og strukturert diff uten AI
      → Diff mot gjeldende countries.json
      → Review av endringer før oppdatering
   → Medisinsk gjennomgang av diff
   → Godkjenn og merge → automatisk deploy
```

**Legge til nytt land manuelt:**
1. Legg til oppføring i `data/countries.json` med `dataVersion: "1.0.0"`
2. Kjør `npm run validate-data`
3. Commit og deploy

## Miljøvariabler

| Variabel | Beskrivelse |
|---|---|
| `GOOGLE_CLOUD_PROJECT` | GCP prosjekt-ID (Firestore) |
| `GITHUB_TOKEN` | GitHub PAT for PR-oppretting (kun update-script) |
| `GITHUB_REPO` | Format: `org/repo` (kun update-script) |
| `FIRESTORE_EMULATOR_HOST` | Valgfritt: `localhost:8080` for lokal Firestore-emulator |
