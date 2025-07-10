# Travel Workspace MVP – Instructions

## 1. Purpose

A shared, link‑based web app that lets travellers upload screenshots, auto‑extract activity details with OpenAI Vision, and arrange those activities on a 3‑day draggable calendar.

## 2. Tech Stack

| Layer   | Choice |
| ------- | ------ |
| Runtime |        |

| **Node.js 18+** |                                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Framework       | **Next.js 15** (App Router, React 18)                                              |
| Deployment      | **Vercel** (Edge/serverless)                                                       |
| Database        | **Neon PostgreSQL** (serverless Postgres)                                          |
| AI parsing      | **OpenAI GPT‑4o Vision**                                                           |
| File storage    | **Google Cloud Storage bucket** (production) · `/public/uploads/` during local dev |
| Styling         | Tailwind CSS                                                                       |
| Calendar & DnD  | React Big Calendar (timeline) + `react‑dnd`                                        |

## 3. Repository Layout

```
/
├── app/                     # App Router
│   ├── trip/[tripId]/page.tsx      # main UI (Vault + Calendar)
│   ├── trip/[tripId]/actions.ts    # **server actions** ("use server") for DB + upload logic
│   └── globals.css          # Tailwind
├── lib/
│   ├── db.ts                # Neon client helper
│   └── openai.ts            # OpenAI wrapper
├── components/              # VaultList, CalendarBoard, UploadButton, etc.
├── public/uploads/          # Dev‑time screenshot storage (git‑ignored)
└── .env.local               # DATABASE_URL, OPENAI_API_KEY, GCP creds, etc.
```

> **No **``** folder.** All mutating logic lives in **server actions** imported with `"use server"`.

## 4. Environment Variables (`.env.local`)

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
OPENAI_API_KEY=sk‑...
GCP_BUCKET_NAME=travel‑screenshots
GCP_PROJECT_ID=<project>
GCP_SERVICE_KEY=<JSON‑string or path>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 5. Local Development

1. `npm install`
2. Create Neon DB → run SQL in `DATAMODEL.MD`.
3. Add `.env.local` using dev credentials; skip GCP and keep screenshots locally.
4. `npm run dev` → [http://localhost:3000/trip/seed‑id](http://localhost:3000/trip/seed‑id).

## 6. Deployment (Vercel)

1. Push to GitHub.
2. Import repo in Vercel, add env vars (Neon, OpenAI, GCP bucket).
3. Vercel automatically builds and deploys Edge/serverless functions.

## 7. Core Server Actions

All writes occur through **server actions** (declared with `"use server"`). Suggested structure in `trip/[tripId]/actions.ts`:

- `export async function uploadScreenshot(formData: FormData)` →
  1. Store file in GCP bucket.
  2. Call OpenAI Vision → parse `{ name, activityType, description }`.
  3. `INSERT INTO vault_items`.
- `export async function addToItinerary(itemId: string, start: string, end: string)`.
- `export async function moveItinerary(id: string, start: string, end: string)`.
- `export async function deleteItinerary(id: string)`.

These functions are imported client‑side and invoked via React forms or `useTransition`.

## 8. Key Packages

- `@neondatabase/serverless` – Postgres HTTP client
- `@google-cloud/storage` – GCS SDK
- `react-big-calendar`
- `react-dnd`, `dnd-core`
- `tailwindcss`
- `openai`
- `formidable` (only during local dev; Vercel handles multipart automatically)

## 9. Styling & Responsiveness

- **Desktop**: two‑pane `flex-row` – Vault (33%), Calendar (67%).
- **Mobile**: Vault collapses to bottom sheet; Calendar full‑width `flex-col`.
- Tailwind breakpoints (`md:`) and `overflow-auto` for long vault lists.

## 10. Limitations (MVP)

- No real‑time sync; collaborators refresh to see latest state.
- Screenshots stored locally in dev; GCP bucket in production.
- Anonymous collaboration via URL; no authentication.

## 11. Next Steps (post‑MVP)

- WebSocket / Pusher for live updates.
- Auth & granular sharing rules.
- PDF export.
- OCR fallback for heavy text screenshots.

---

**Build target:** functional in 3 working days with Node 18+ and Next.js 15.

# Travel Workspace MVP – Instructions

## 1. Purpose

A shared, link‑based web app that lets travellers upload screenshots, auto‑extract activity details with OpenAI Vision, and arrange those activities on a 3‑day draggable calendar.

## 2. Tech Stack

| Layer   | Choice |
| ------- | ------ |
| Runtime |        |

| **Node.js 18+** |                                                                                    |
| --------------- | ---------------------------------------------------------------------------------- |
| Framework       | **Next.js 15** (App Router, React 18)                                              |
| Deployment      | **Vercel** (Edge/serverless)                                                       |
| Database        | **Neon PostgreSQL** (serverless Postgres)                                          |
| AI parsing      | **OpenAI GPT‑4o Vision**                                                           |
| File storage    | **Google Cloud Storage bucket** (production) · `/public/uploads/` during local dev |
| Styling         | Tailwind CSS                                                                       |
| Calendar & DnD  | React Big Calendar (timeline) + `react‑dnd`                                        |

## 3. Repository Layout

```
/
├── app/                     # App Router
│   ├── trip/[tripId]/page.tsx      # main UI (Vault + Calendar)
│   ├── trip/[tripId]/actions.ts    # **server actions** ("use server") for DB + upload logic
│   └── globals.css          # Tailwind
├── lib/
│   ├── db.ts                # Neon client helper
│   └── openai.ts            # OpenAI wrapper
├── components/              # VaultList, CalendarBoard, UploadButton, etc.
├── public/uploads/          # Dev‑time screenshot storage (git‑ignored)
└── .env.local               # DATABASE_URL, OPENAI_API_KEY, GCP creds, etc.
```

> **No **``** folder.** All mutating logic lives in **server actions** imported with `"use server"`.

## 4. Environment Variables (`.env.local`)

```
DATABASE_URL=postgresql://<user>:<password>@<host>/<db>?sslmode=require
OPENAI_API_KEY=sk‑...
GCP_BUCKET_NAME=travel‑screenshots
GCP_PROJECT_ID=<project>
GCP_SERVICE_KEY=<JSON‑string or path>
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

## 5. Local Development

1. `npm install`
2. Create Neon DB → run SQL in `DATAMODEL.MD`.
3. Add `.env.local` using dev credentials; skip GCP and keep screenshots locally.
4. `npm run dev` → [http://localhost:3000/trip/seed‑id](http://localhost:3000/trip/seed‑id).

## 6. Deployment (Vercel)

1. Push to GitHub.
2. Import repo in Vercel, add env vars (Neon, OpenAI, GCP bucket).
3. Vercel automatically builds and deploys Edge/serverless functions.

## 7. Core Server Actions

All writes occur through **server actions** (declared with `"use server"`). Suggested structure in `trip/[tripId]/actions.ts`:

- `export async function uploadScreenshot(formData: FormData)` →
  1. Store file in GCP bucket.
  2. Call OpenAI Vision → parse `{ name, activityType, description }`.
  3. `INSERT INTO vault_items`.
- `export async function addToItinerary(itemId: string, start: string, end: string)`.
- `export async function moveItinerary(id: string, start: string, end: string)`.
- `export async function deleteItinerary(id: string)`.

These functions are imported client‑side and invoked via React forms or `useTransition`.

## 8. Key Packages

- `@neondatabase/serverless` – Postgres HTTP client
- `@google-cloud/storage` – GCS SDK
- `react-big-calendar`
- `react-dnd`, `dnd-core`
- `tailwindcss`
- `openai`
- `formidable` (only during local dev; Vercel handles multipart automatically)

## 9. Styling & Responsiveness

- **Desktop**: two‑pane `flex-row` – Vault (33%), Calendar (67%).
- **Mobile**: Vault collapses to bottom sheet; Calendar full‑width `flex-col`.
- Tailwind breakpoints (`md:`) and `overflow-auto` for long vault lists.

## 10. Limitations (MVP)

- No real‑time sync; collaborators refresh to see latest state.
- Screenshots stored locally in dev; GCP bucket in production.
- Anonymous collaboration via URL; no authentication.

## 11. Next Steps (post‑MVP)

- WebSocket / Pusher for live updates.
- Auth & granular sharing rules.
- PDF export.
- OCR fallback for heavy text screenshots.

---

**Build target:** functional in 3 working days with Node 18+ and Next.js 15.

