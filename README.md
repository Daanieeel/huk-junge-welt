# HUK-COBURG Junge Welt

Eine mobile-first Web-App, die jungen Menschen personalisierte Versicherungsempfehlungen von HUK-COBURG gibt — basierend auf ihrem Lebensstil, ihren Zielen und bestehenden Verträgen.

> Entstanden im Rahmen eines 2-tägigen Hackathons.

---

## Inhaltsverzeichnis

- [HUK-COBURG Junge Welt](#huk-coburg-junge-welt)
  - [Inhaltsverzeichnis](#inhaltsverzeichnis)
  - [Was ist das?](#was-ist-das)
  - [Architektur](#architektur)
  - [Voraussetzungen](#voraussetzungen)
  - [Setup](#setup)
    - [1. Dependencies installieren](#1-dependencies-installieren)
    - [2. Umgebungsvariablen anlegen](#2-umgebungsvariablen-anlegen)
    - [3. Infrastruktur starten](#3-infrastruktur-starten)
    - [4. MinIO Bucket anlegen](#4-minio-bucket-anlegen)
    - [5. Datenbank initialisieren](#5-datenbank-initialisieren)
    - [6. Entwicklungsserver starten](#6-entwicklungsserver-starten)
  - [Nützliche Befehle](#nützliche-befehle)
  - [Projektstruktur (Web-App)](#projektstruktur-web-app)

---

## Was ist das?

Die App führt Nutzer durch einen kurzen Bedarfscheck (Alter, Beruf, Wohnsituation, Fahrzeuge, Familie, Versicherungsziel) und generiert daraus KI-gestützte, personalisierte Versicherungsempfehlungen. Bestehende Verträge können hochgeladen und direkt mit HUK-COBURG-Tarifen verglichen werden.

**Kernfunktionen:**
- Bedarfscheck-Onboarding mit automatischer Vorausfüllung bei erneutem Aufruf
- KI-Empfehlungen via RAG-Webhook (n8n + LLM), priorisiert nach Wichtigkeit
- Wechselempfehlungen mit konkreter Ersparnis-Anzeige
- Echtzeit-Updates über WebSocket sobald neue Empfehlungen vorliegen
- Dokument-Upload für bestehende Policen (PDF/Bild)
- Qualitätsscore für den eigenen Versicherungsschutz

---

## Architektur

```
apps/
  web/          Next.js 16 — Frontend (React 19, Tailwind v4)
  rest/         Elysia REST API — Port 3001
  websocket/    Elysia WebSocket Server — Port 3002
  worker/       BullMQ Worker — verarbeitet KI-Jobs

packages/
  database/     Prisma v7 + PostgreSQL
  auth/         Better Auth 1.5.3
  message-queue/ BullMQ Producer/Consumer
  pub-sub/      Redis Pub/Sub
  env/          Zod-validierte Umgebungsvariablen
```

**Infrastruktur:** PostgreSQL · Redis · MinIO (S3-kompatibler Datei-Storage)

---

## Voraussetzungen

- [Bun](https://bun.sh) >= 1.3.6
- [Docker](https://www.docker.com) + Docker Compose

---

## Setup

### 1. Dependencies installieren

```bash
bun install
```

### 2. Umgebungsvariablen anlegen

```bash
cp .env.example .env
```

Folgende Variablen müssen zusätzlich gesetzt werden (nicht im `.env.example` enthalten):

```env
# Better Auth
BETTER_AUTH_SECRET="<min. 32 Zeichen langer zufälliger String>"
BETTER_AUTH_URL="http://localhost:3001"
WEB_URL="http://localhost:3000"

# Frontend
NEXT_PUBLIC_REST_URL="http://localhost:3001"
NEXT_PUBLIC_WEBSOCKET_URL="ws://localhost:3002"

# RAG-Webhook (n8n oder kompatibler Endpunkt)
RAG_WEBHOOK_URL="<webhook-url>"
RAG_WEBHOOK_AUTH="<base64-encoded-credentials>"  # optional
```

### 3. Infrastruktur starten

Startet PostgreSQL, Redis und MinIO per Docker Compose und führt die Datenbankmigrationen automatisch aus:

```bash
docker compose up -d
```

### 4. MinIO Bucket anlegen

Einmalig nach dem ersten Start:

1. MinIO Console öffnen: http://localhost:9001 (Login: `minioadmin` / `minioadmin`)
2. Bucket `huk-documents` anlegen
3. Bucket-Zugriff auf **Public** setzen (oder entsprechende Policy konfigurieren)

### 5. Datenbank initialisieren

```bash
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/huk_db?schema=public" bun run db:push
```

### 6. Entwicklungsserver starten

Startet alle Apps gleichzeitig via Turborepo:

```bash
bun run dev
```

| App        | URL                     |
|------------|-------------------------|
| Frontend   | http://localhost:3000   |
| REST API   | http://localhost:3001   |
| WebSocket  | ws://localhost:3002     |

---

## Nützliche Befehle

```bash
# Datenbankschema pushen (nach Schemaänderungen)
bun run db:push

# Prisma Client neu generieren
bun run db:generate

# Prisma Studio (Datenbank-UI)
bun run db:studio

# Nur eine App starten
bun run dev --filter=web
bun run dev --filter=rest
bun run dev --filter=worker
```

---

## Projektstruktur (Web-App)

```
apps/web/
  app/              Next.js App Router (Seiten & Layouts)
  components/       UI-Komponenten (nach Feature gruppiert)
  lib/
    api-client.ts   Typen & API-Wrapper
    queries.ts      TanStack Query Hooks
    ws-provider.tsx WebSocket-Client (Echtzeit-Updates)
    db.ts           Dexie/IndexedDB (lokaler Cache)
    bedarfscheck-store.ts  Zustand Store für Onboarding
```
