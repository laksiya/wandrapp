# Travel Workspace MVP - Development Guide

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Set up environment variables:**
   Copy `.env.example` to `.env.local` and fill in your credentials:
   ```bash
   cp .env.example .env.local
   ```

3. **Database Setup (Neon PostgreSQL):**
   - Create a Neon database account
   - Create a new database
   - Run the SQL from `DATAMODEL.md` to create tables
   - Add your DATABASE_URL to `.env.local`

4. **OpenAI Setup:**
   - Get an OpenAI API key
   - Add OPENAI_API_KEY to `.env.local`

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open the app:**
   Visit `http://localhost:3000` (redirects to `/trip/seed-id`)

## Features Implemented

✅ **Upload & AI Parsing**
- Drag & drop image upload
- OpenAI GPT-4o Vision integration
- Auto-extraction of activity details

✅ **Activity Vault**
- Visual list of uploaded activities
- Drag-and-drop to calendar
- Activity type categorization

✅ **3-Day Calendar**
- React Big Calendar integration
- Drag & drop from vault to calendar
- Event resizing and moving
- Delete events functionality

✅ **Responsive Design**
- Desktop: Two-pane layout (Vault 33% | Calendar 67%)
- Mobile: Stacked layout with drag & drop

✅ **Server Actions**
- All mutations via Next.js server actions
- File upload handling (local dev + GCP production)
- Database operations with Neon PostgreSQL

## File Structure

```
/
├── app/
│   ├── trip/[tripId]/
│   │   ├── page.tsx          # Main trip UI
│   │   └── actions.ts        # Server actions
│   ├── layout.tsx            # Root layout
│   ├── page.tsx              # Home page (redirects)
│   └── globals.css           # Global styles + Tailwind
├── components/
│   ├── UploadButton.tsx      # File upload component
│   ├── VaultList.tsx         # Activity vault
│   └── CalendarBoard.tsx     # Calendar with D&D
├── lib/
│   ├── db.ts                 # Neon database client
│   └── openai.ts             # OpenAI Vision wrapper
├── public/uploads/           # Local dev file storage
└── DATAMODEL.md             # Database schema
```

## Environment Variables

- `DATABASE_URL` - Neon PostgreSQL connection string
- `OPENAI_API_KEY` - OpenAI API key for Vision
- `GCP_BUCKET_NAME` - Google Cloud Storage bucket (production)
- `GCP_PROJECT_ID` - GCP project ID (production)
- `GCP_SERVICE_KEY` - GCP service account JSON (production)
- `NEXT_PUBLIC_SITE_URL` - App base URL

## Development vs Production

**Development:**
- Images stored in `/public/uploads/`
- No GCP configuration needed

**Production:**
- Images stored in Google Cloud Storage
- Requires GCP service account setup

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Database:** Neon PostgreSQL
- **AI:** OpenAI GPT-4o Vision
- **Calendar:** React Big Calendar
- **Drag & Drop:** react-dnd
- **Styling:** Tailwind CSS
- **Deployment:** Vercel

## Deployment

1. Push to GitHub
2. Import to Vercel
3. Add environment variables
4. Deploy automatically
