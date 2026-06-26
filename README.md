# GeZoZu Vrijwilligersportaal

Onofficieel shift management portaal voor vrijwilligers van  
**Rode Kruis Vlaanderen — afdeling Genk-Zonhoven-Zutendaal**

---

## Tech stack

| Laag | Technologie |
|---|---|
| Frontend & Backend | Next.js 14 (App Router) |
| Database | PostgreSQL via Prisma |
| Auth | iron-session (eigen sessies) |
| RKV Login | Playwright + Stealth Plugin |
| Styling | Tailwind CSS — RKV huisstijl |
| Hosting | Cloudflare Pages |
| DB hosting | Neon / Supabase / Railway |

---

## Rangensysteem (laag → hoog)

| Rang | Kleur |
|---|---|
| Basisvrijwilliger | Grijs |
| Eerstehulpverlener | Geel |
| Eventhulpverlener | Oranje |
| DGH | Blauw |
| Verpleegkundige | Groen |
| Dokter | Rood |
| Adjunct | Zilver |
| Afdelingsverantwoordelijke | Goud |

Rangen worden handmatig toegewezen door admins. Toekomstige import via RKV functies is voorzien.

---

## Features

- ✅ Login via officieel RKV-account (Playwright scraping)
- ✅ Automatische profielsync bij login (naam, kwalificaties, functies)
- ✅ Profielfoto en displaynaam van mijn.rodekruis.be
- ✅ Rangensysteem met kleurcodering
- ✅ Events aanmaken, bewerken, archiveren (admins)
- ✅ Beschikbaarheid per event (JA / BLANCO / ONBESCHIKBAAR)
- ✅ Lijst- en kalenderweergave van events
- ✅ Pickup locatie op kaart (Google Maps embed)
- ✅ Externe vrijwilligers toevoegen via RKV ID
- ✅ Admin-vergrendelde velden (niet overschrijfbaar door sync)
- ✅ Profielpagina: eigen voor iedereen, andermans alleen voor admins

---

## Setup (lokaal)

### 1. Vereisten

- Node.js 20+
- PostgreSQL database (lokaal of Neon/Supabase gratis tier)

### 2. Installeren

```bash
git clone https://github.com/jouw-username/gezozu-portaal
cd gezozu-portaal
npm install
npx playwright install chromium
```

### 3. Omgevingsvariabelen

```bash
cp .env.example .env
# Pas DATABASE_URL en SESSION_SECRET aan
```

### 4. Database opzetten

```bash
npm run db:push   # schema aanmaken
```

### 5. Starten

```bash
npm run dev       # http://localhost:3000
```

---

## Deployment (Cloudflare Pages + GitHub)

### Stap 1 — Database

Maak een gratis PostgreSQL database aan op [neon.tech](https://neon.tech) of [supabase.com](https://supabase.com).  
Kopieer de connectie string.

### Stap 2 — GitHub

```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/jouw-username/gezozu-portaal
git push -u origin main
```

### Stap 3 — Cloudflare Pages

1. Ga naar [dash.cloudflare.com](https://dash.cloudflare.com) → Pages → Create project
2. Verbind je GitHub repo
3. Build settings:
   - **Framework**: Next.js
   - **Build command**: `npm run build`
   - **Output directory**: `.next`
4. Environment variables toevoegen:
   - `DATABASE_URL` — je Neon/Supabase connectie string
   - `SESSION_SECRET` — willekeurige string van 32+ tekens
   - `NODE_ENV` — `production`

### Stap 4 — GitHub Secrets (voor CI/CD)

Ga naar GitHub repo → Settings → Secrets → Actions:

| Secret | Waarde |
|---|---|
| `DATABASE_URL` | PostgreSQL connectie string |
| `SESSION_SECRET` | Geheime string 32+ tekens |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API token |
| `CLOUDFLARE_ACCOUNT_ID` | Jouw Cloudflare account ID |

### Stap 5 — Eerste admin aanmaken

Na de eerste deployment, log in met je eigen RKV-account.  
Stel jezelf daarna manueel in als admin via de database:

```sql
UPDATE "Volunteer"
SET "isAdmin" = true
WHERE "rkvId" = 'JOUW_RKV_ID';
```

Dit kan via de Neon/Supabase SQL editor.

---

## Projectstructuur

```
gezozu-portaal/
├── prisma/
│   └── schema.prisma          ← Database schema
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── auth/          ← Login, logout
│   │   │   ├── events/        ← CRUD events + beschikbaarheid
│   │   │   ├── me/            ← Eigen profiel
│   │   │   ├── profile/       ← Profiel (eigen of admin)
│   │   │   └── admin/         ← Admin endpoints
│   │   ├── dashboard/         ← Homepagina
│   │   ├── events/[id]/       ← Event detail
│   │   ├── profile/[id]/      ← Profielpagina
│   │   ├── login/             ← Loginpagina
│   │   └── admin/             ← Admin paneel
│   ├── components/            ← Herbruikbare UI componenten
│   └── lib/
│       ├── db.ts              ← Prisma singleton
│       ├── ranks.ts           ← Rang + kwalificatie definities
│       ├── scraper.ts         ← Playwright RKV login
│       └── session.ts         ← iron-session config
├── .env.example
└── .github/workflows/deploy.yml
```

---

## Toekomstige features

- [ ] Automatische rang toewijzing via RKV functies import
- [ ] Officiële OIDC integratie (als RKV IT toestemming geeft)
- [ ] Push notificaties voor nieuwe events
- [ ] Exporteren van aanwezigheidslijsten
- [ ] Statistieken dashboard voor admins
