# GeZoZu Vrijwilligersportaal

Onofficieel shift management portaal voor vrijwilligers van
**Rode Kruis Vlaanderen — afdeling Genk-Zonhoven-Zutendaal (GeZoZu)**

Vrijwilligers zien welke events/shiften er aankomen, duiden hun
beschikbaarheid aan (JA / ONBESCHIKBAAR) en zien wie er nog meer op een
event staat. Admins maken events aan, beheren vrijwilligers en rangen, en
houden een archief bij van voorbije en geannuleerde events.

---

## ⚠️ Belangrijke wijziging: RKV-sync is uitgeschakeld

Eerdere versies van dit project logden in via een echt RKV-account
(Playwright-scraping van mijn.rodekruis.be) en synchroniseerden profiel,
kwalificaties en functies automatisch. **Dat is nu uitgeschakeld** —
`src/lib/scraper.ts` bestaat nog enkel als lege placeholder. Concreet:

- Login gebeurt via een **eigen account** (e-mailadres, RKV ID, of
  `voornaam.achternaam`-notatie + wachtwoord), niet meer via RKV zelf.
- Profielfoto, kwalificaties en functies worden **niet meer automatisch**
  bijgewerkt — kwalificaties beheer je nu manueel per vrijwilliger via het
  admin-paneel.
- Het `RkvFunction`-model (functies/rollen bij RKV) staat nog in het schema
  en wordt getoond waar er data voor is, maar nergens in de huidige app
  wordt er nog een nieuwe rij voor aangemaakt.

---

## Tech stack

| Laag | Technologie |
|---|---|
| Frontend & Backend | Next.js 14 (App Router) |
| Taal | TypeScript |
| Database | PostgreSQL via Prisma ORM |
| Auth | Eigen account + wachtwoord (bcrypt-hash), sessies via iron-session |
| Validatie | Zod |
| Styling | Tailwind CSS — RKV huisstijl, met dark mode |
| Hosting | Cloudflare Pages (of vergelijkbaar) |
| DB hosting | Neon / Supabase / Railway |

---

## Rangensysteem (SB — Sanitaire Bekwaamheid)

Een vrijwilliger kan **meerdere SB's tegelijk** hebben. Rangen worden
handmatig toegewezen door admins.

| SB | Code | Afkorting | Kleur |
|---|---|---|---|
| Polyvalente Basisvrijwilliger | — | LOG | Grijs |
| Eerstehulpverlener | A3 | EHV | Geel |
| Eventhulpverlener | B3 | EVH | Oranje |
| Ambulancier NDPV (voorlopig) | D3 | NDPV (D3) | Grijsblauw |
| Ambulancier NDPV | D4 | NDPV | Grijs |
| Dringende geneeskundige hulpverlener | G1 | DGH | Blauw |
| Verpleegkundige | E1 | VPK | Groen |
| Spoedverpleegkundige | E3 | Spoedverpleegkundige | Groen |
| Arts | F1 | Arts | Rood |
| Urgentie-arts | F2 | Urgentie-Arts | Rood |
| Adjunct | — | Adjunct | Blauwgrijs |
| Afdelingsverantwoordelijke | — | Afdelingsverantwoordelijke | Goud |

Daarnaast bestaan er **kwalificatiebadges**, los van de SB, ook manueel
beheerd door admins sinds de RKV-sync uit staat:

`Ereteken` · `Medisch Diploma` · `Kwalificatie` · `Brevet` · `Attest`

---

## Features

- ✅ Login via eigen account: e-mailadres, `voornaam.achternaam`-notatie of
  RKV ID — wachtwoord instellen bij eerste login
- ✅ Wachtwoord wijzigen (zelf) en resetten (admin, voor andere vrijwilligers)
- ✅ Rangensysteem (SB) met kleurcodering + kwalificatiebadges
- ✅ Events aanmaken, bewerken, annuleren en archiveren (admin)
- ✅ Event herhalen/dupliceren naar een nieuwe datum — ook meerdaagse events
  (admin)
- ✅ Automatische inschrijving als RESERVE van alle in aanmerking komende
  GeZoZu-vrijwilligers bij een nieuw/herhaald event, én omgekeerd bij een
  nieuwe of gewijzigde vrijwilliger (zodat niemand onzichtbaar blijft op
  bestaande events)
- ✅ Beschikbaarheid per event: RESERVE / JA / ONBESCHIKBAAR, met een privé
  opmerking per vrijwilliger (enkel zichtbaar voor zichzelf en admins)
- ✅ Lijst- en kalenderweergave (per maand) van aankomende events op het
  dashboard
- ✅ Pickup-locatie op kaart (Google Maps embed)
- ✅ Externe vrijwilligers toevoegen via RKV ID, filterbaar in de
  vrijwilligerslijst
- ✅ Profielpagina — eigen voor iedereen, andermans enkel voor admins — met
  shift-historiek en aantal shiften dit jaar
- ✅ Admin-paneel: zoeken/filteren op naam, RKV ID of SB; rangen toewijzen;
  blokkeren; admin-rechten toekennen (pas mogelijk nadat de gebruiker zelf
  een wachtwoord heeft ingesteld)
- ✅ Archief: voorbije en geannuleerde events, gegroepeerd per jaar
- ✅ Dark mode

---

## Setup (lokaal)

### 1. Vereisten

- Node.js 20+ (CI draait op 22)
- PostgreSQL database (lokaal, of gratis tier op Neon/Supabase/Railway)

### 2. Installeren

```bash
git clone https://github.com/mm6683/RKV_GeZoZu-portaal.git
cd RKV_GeZoZu-portaal
npm install
```

### 3. Omgevingsvariabelen

```bash
cp .env.example .env
# Pas DATABASE_URL en SESSION_SECRET aan
# SESSION_SECRET: minimaal 32 tekens, genereer met `openssl rand -base64 32`
```

### 4. Database opzetten

```bash
npm run db:push   # schema naar de database pushen
```

### 5. Eerste admin aanmaken

Er is geen registratiepagina en geen RKV-login meer om een eerste account
mee te bootstrappen — nieuwe vrijwilligers worden normaal via het
admin-paneel aangemaakt, maar dat vereist zelf al een admin-account. Voor
de allereerste gebruiker moet je dus rechtstreeks in de database werken:

```bash
npm run db:studio   # opent Prisma Studio in de browser
```

Maak in de `Volunteer`-tabel manueel een rij aan met minstens:

- `rkvId` — iets uniek (bv. je eigen RKV-ID, of `LOCAL-1`)
- `voornaam`, `naam`, `volledigeNaam`
- `hoofdentiteit` — bv. `GENK-ZONHOVEN-ZUTENDAAL`
- `emailWerk` — het adres waarmee je wil inloggen
- `isAdmin` — `true`

Log daarna in op `/login` met dat e-mailadres. Omdat er nog geen
`passwordHash` staat, kom je automatisch in de flow voor het instellen van
een eerste wachtwoord (`/set-password`) terecht. Zodra dat wachtwoord
ingesteld is, ben je volwaardig ingelogd als admin en kan je vanaf dan
gewoon via het admin-paneel verder werken — Prisma Studio is dan niet meer
nodig.

### 6. Starten

```bash
npm run dev       # http://localhost:3000
```

---

## Deployment

### Database

Zet een PostgreSQL database op (bv. gratis tier op
[neon.tech](https://neon.tech), [supabase.com](https://supabase.com) of
[railway.app](https://railway.app)) en kopieer de connectiestring.

### Hosting (Cloudflare Pages)

1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com) → Pages →
   Create project, en verbind je GitHub repo.
2. Build settings:
   - **Framework**: Next.js
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
3. Environment variables instellen **in het Cloudflare Pages
   project zelf** (Settings → Environment variables) — dit staat los van
   GitHub Secrets hieronder:
   - `DATABASE_URL`
   - `SESSION_SECRET`
   - `NODE_ENV` — `production`

### GitHub Actions — automatische DB-migraties

`.github/workflows/deploy.yml` draait bij elke push naar `main` en pusht
het Prisma-schema automatisch naar de productiedatabase (`prisma db push
--accept-data-loss`). Dit vereist één GitHub Secret (Settings → Secrets →
Actions):

| Secret | Waarde |
|---|---|
| `DATABASE_URL` | Dezelfde PostgreSQL connectiestring als hierboven |

Let op: deze workflow deployt de app zelf **niet** — dat doet Cloudflare
Pages via zijn eigen Git-integratie, los van GitHub Actions. De workflow
zorgt enkel dat het databaseschema bij elke push mee gesynchroniseerd
blijft.

⚠️ Omdat `--accept-data-loss` gebruikt wordt: een destructieve
schema-wijziging (bv. een enum-waarde verwijderen die nog ergens in gebruik
is) kan data laten vallen of de push laten falen. Zie
`scripts/migrate-spoed-rank.ts` voor een voorbeeld van hoe zo'n wijziging
eerst veilig voor te bereiden vóór je ze naar `main` merget.

---

## Scripts

| Commando | Omschrijving |
|---|---|
| `npm run dev` | Lokale development server |
| `npm run build` | Prisma client genereren + production build |
| `npm run start` | Production server starten |
| `npm run db:push` | Prisma schema naar de database pushen |
| `npm run db:studio` | Prisma Studio openen (GUI voor de database) |

> `npm run db:seed` staat nog wel in `package.json`, maar `prisma/seed.ts`
> bestaat niet meer in deze repo — dat commando faalt tot het bestand
> terugkomt of de referentie eruit gehaald wordt.

Daarnaast staan er in `scripts/` twee eenmalige, idempotente
migratie/backfill-scripts (elk met een `--dry-run` optie en uitgebreide
uitleg in een comment bovenaan het bestand):

- **`backfill-attendees.ts`** — vult ontbrekende RESERVE-rijen aan voor
  vrijwilligers die na het aanmaken van een event zijn toegevoegd.
- **`migrate-spoed-rank.ts`** — migreert de verwijderde SB "Spoed" naar
  `SPOEDVERPLEEGKUNDIGE`, nodig vóór je die enum-waarde uit het schema
  haalt.

Draai ze enkel als je weet dat je ze nodig hebt, bv.:

```bash
DATABASE_URL="postgresql://..." npx tsx scripts/backfill-attendees.ts --dry-run
```

---

## Projectstructuur

```
RKV_GeZoZu-portaal/
├── prisma/
│   └── schema.prisma           ← Database schema
├── scripts/
│   ├── backfill-attendees.ts   ← Eenmalig: zie "Scripts" hierboven
│   └── migrate-spoed-rank.ts   ← Eenmalig: zie "Scripts" hierboven
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/           ← login, logout, set-password, change-password
│   │   │   ├── events/         ← CRUD + beschikbaarheid + herhalen/annuleren
│   │   │   ├── me/             ← eigen (compact) profiel, o.a. voor navbar
│   │   │   ├── profile/[id]/   ← profiel (eigen of admin) + shift-historiek
│   │   │   └── admin/          ← vrijwilligersbeheer + archief
│   │   ├── dashboard/          ← homepagina (lijst-/kalenderweergave)
│   │   ├── events/[id]/        ← event-detail + beschikbaarheid aanduiden
│   │   ├── profile/[id]/       ← profielpagina
│   │   ├── login/, set-password/  ← inloggen + eerste wachtwoord instellen
│   │   └── admin/              ← admin-paneel (vrijwilligers, events, externen, archief)
│   ├── components/             ← herbruikbare UI-componenten (o.a. ThemeToggle, RankBadge)
│   └── lib/
│       ├── db.ts               ← Prisma singleton
│       ├── ranks.ts            ← SB + kwalificatiebadge definities
│       ├── eventHelpers.ts     ← auto-enrollment + "is dit shift al bezig?"-logica
│       ├── session.ts          ← iron-session config
│       └── scraper.ts          ← uitgeschakeld, enkel placeholder (zie hierboven)
├── .env.example
└── .github/workflows/deploy.yml   ← pusht het Prisma-schema bij elke push naar main
```

---

## Mogelijke volgende stappen

- [ ] RKV-sync opnieuw activeren of vervangen door een officiële
      RKV-integratie (de huidige scraping-aanpak staat volledig uit, zie
      bovenaan)
- [ ] Push notificaties voor nieuwe events
- [ ] Exporteren van aanwezigheidslijsten
- [ ] Statistieken dashboard voor admins
