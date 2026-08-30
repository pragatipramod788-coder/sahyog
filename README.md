# SAHYOG — Civic Innovation Platform (SIH26043)
### Government of Jharkhand · Citizen–University–Industry Collaboration

This repo is a **working prototype** of SAHYOG built to demo the full user journey end to end:
landing page → citizen OTP login → multi-step problem report → AI matching → status timeline →
7-day SLA escalation → Government dashboard → University/HEI portal → Industry/CSR portal →
public transparency ledger.

---

## 1. What's actually implemented vs. simulated

To get you a **fully working, clickable prototype** quickly, this build uses Next.js API routes
with an **in-memory data store** (`lib/store.ts`) instead of standing up separate MongoDB Atlas +
Express + FastAPI services. Every module in the brief is functionally present and wired together;
the "backend" is just simplified so you can run the whole thing with one command.

| Brief asked for | This build uses | Swap path to production |
|---|---|---|
| MongoDB Atlas | In-memory store, reseeded on server restart (`lib/store.ts`) | Replace `getDb()` internals with a real `mongodb` driver client; keep the same function signatures so no API route changes |
| Node/Express API layer | Next.js Route Handlers (`app/api/**/route.ts`) | Either keep using Next.js API routes (recommended — Vercel deploys these as serverless functions), or lift the logic into a standalone Express app and point `NEXT_PUBLIC_API_URL` at it |
| Python FastAPI + sentence-transformers + FAISS | `aiClassify()` / `aiMatchHEI()` keyword-based simulation in `lib/mockData.ts` | Stand up the FastAPI service (see §5), call it from `app/api/reports/route.ts` instead of the local functions |
| NextAuth role-based auth | Mock OTP flow (`app/api/otp/route.ts`) + role tabs on `/login` | Add NextAuth with a Credentials or Phone/OTP provider, store `role` in the JWT/session, and gate `/dashboard/*` routes with middleware |
| PDF/Excel export | Buttons present in the Gov dashboard UI (no-op) | Wire to `pdf-lib` / `exceljs` on the server, or a `/api/export` route |

Everything else — the multi-step report flow, status timeline, escalation → Grievance ID flow,
district heatmap, CSR/funding tracker, HEI matched-feed + solution reuse, Industry opportunity
feed + compliance report, and the public transparency ledger — is fully functional against the
in-memory store today.

---

## 2. Folder structure

```
sahyog/
├── app/
│   ├── page.tsx                  # Landing page
│   ├── layout.tsx                # Root layout (header, footer, logo intro, language provider)
│   ├── globals.css
│   ├── login/page.tsx            # OTP login (role tabs: Citizen/Gov/HEI/Industry)
│   ├── report/new/page.tsx       # Multi-step report flow
│   ├── reports/page.tsx          # My Reports list
│   ├── reports/[id]/page.tsx     # Report detail + timeline + escalate modal
│   ├── dashboard/gov/page.tsx    # Government dashboard
│   ├── dashboard/hei/page.tsx    # University/HEI portal
│   ├── dashboard/industry/page.tsx # Industry/CSR portal
│   ├── transparency/page.tsx     # Public transparency ledger (no login)
│   ├── community/page.tsx        # Community map + leaderboard
│   ├── whatsapp/page.tsx         # WhatsApp chatbot reporting demo
│   ├── notifications/page.tsx
│   ├── settings/page.tsx
│   ├── help/page.tsx
│   └── api/
│       ├── otp/route.ts          # Send/verify OTP (mock)
│       ├── reports/route.ts      # List + create reports (+ AI classify/match)
│       ├── reports/[id]/route.ts # Get/update a report
│       ├── escalate/route.ts     # Create Grievance, route to nodal officer
│       └── projects/route.ts     # Projects + funding ledger
├── components/                   # Header, Footer, Emblem, LogoIntro, GlassCard, StatusTimeline...
├── lib/
│   ├── types.ts                  # Shared TypeScript types
│   ├── i18n.ts                   # EN/HI dictionary + language list
│   ├── LanguageContext.tsx       # Client-side language provider
│   ├── mockData.ts               # Seed data + AI classify/match simulation
│   └── store.ts                  # In-memory "database"
├── public/
├── tailwind.config.ts            # navy/saffron/forest color system
├── next.config.js
└── package.json
```

---

## 3. Run it locally

**Requirements:** Node.js 18.18+ (Node 20 LTS recommended), npm.

```bash
cd sahyog
npm install
npm run dev
```

Open **http://localhost:3000**. The logo-split intro plays once per browser session, then the
full site loads. Try:

1. `/` → click **Report a Problem**
2. Walk through the 4-step flow (any category, "Use current GPS" needs location permission,
   or it falls back to Ranchi coordinates automatically)
3. On submit you're AI-matched instantly — click **View Timeline**
4. On the report detail page, the **Escalate to Authority** button is always visible; it's
   auto-highlighted in red once the (seeded) SLA looks breached
5. Visit `/dashboard/gov`, `/dashboard/hei`, `/dashboard/industry`, and `/transparency`
   directly — no login is enforced yet in this prototype (see §1 for the NextAuth swap-in)

To build and run a production build locally:

```bash
npm run build
npm run start
```

---

## 4. Where to plug in the real stack

### 4.1 MongoDB Atlas
1. Create a free Atlas cluster, get your connection string.
2. `npm install mongodb`
3. In `lib/store.ts`, replace the in-memory arrays with real collections, e.g.:
   ```ts
   import { MongoClient } from "mongodb";
   const client = new MongoClient(process.env.MONGODB_URI!);
   export async function getReportsCollection() {
     await client.connect();
     return client.db("sahyog").collection("reports");
   }
   ```
4. Update each `app/api/**/route.ts` to `await` the collection calls instead of touching
   the in-memory arrays. The request/response shapes (`Report`, `Grievance`, `Project`,
   `LedgerEntry` in `lib/types.ts`) are already Mongo-friendly.

### 4.2 NextAuth (role-based auth)
1. `npm install next-auth`
2. Add `app/api/auth/[...nextauth]/route.ts` with a Credentials or custom OTP provider.
3. Store `role: "citizen" | "government" | "university" | "industry"` in the JWT callback.
4. Add `middleware.ts` to protect `/dashboard/gov`, `/dashboard/hei`, `/dashboard/industry`
   by role, and `/reports` by authenticated session.

### 4.3 Python FastAPI AI-matching microservice
Suggested minimal service (deploy separately, e.g. on Render/Railway/Fly.io):

```python
# main.py
from fastapi import FastAPI
from sentence_transformers import SentenceTransformer
import faiss, numpy as np

app = FastAPI()
model = SentenceTransformer("all-MiniLM-L6-v2")
# Build/load a FAISS index of HEI department descriptions + past-solved case embeddings.

@app.post("/match")
def match(payload: dict):
    text = payload["text"]
    vec = model.encode([text])
    D, I = index.search(np.array(vec).astype("float32"), k=3)
    # map I -> HEI/department/past-case records, return top match + confidence
    return {"matched_hei": "...", "department": "...", "confidence": 0.91, "similar_cases": [...]}
```

Then in `app/api/reports/route.ts`, replace the `aiClassify` / `aiMatchHEI` calls with a
`fetch(process.env.AI_SERVICE_URL + "/match", { method: "POST", body: JSON.stringify({ text }) })`.

### 4.4 Express API layer (optional)
The Next.js API routes already function as your API layer and deploy as serverless functions
on Vercel with zero extra config. Only split out a standalone Express service if you need:
- long-running WebSocket connections,
- a shared backend consumed by something other than this Next.js app (e.g. the WhatsApp
  webhook), or
- to keep infra symmetric with the FastAPI service on the same Node runtime.

If you do split it out, move the logic from each `route.ts` into Express route handlers and
set `NEXT_PUBLIC_API_URL` in `.env.local` for the frontend to call it.

---

## 5. Environment variables (for when you wire in the real backend)

Create `.env.local`:

```bash
MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>.mongodb.net/sahyog
NEXTAUTH_SECRET=<random-32-byte-string>
NEXTAUTH_URL=http://localhost:3000
AI_SERVICE_URL=https://your-fastapi-service.onrender.com
SMS_GATEWAY_API_KEY=<msg91-or-twilio-key>
WHATSAPP_VERIFY_TOKEN=<meta-whatsapp-webhook-token>
```

None of these are required to run the prototype as-is — they're only needed once you swap in
the real services described in §4.

---

## 6. Deploying

### Frontend (Next.js) → Vercel (recommended)
1. Push this folder to a GitHub repo.
2. Go to https://vercel.com/new, import the repo.
3. Framework preset: Next.js (auto-detected). Build command `npm run build`, output is handled
   automatically.
4. Add the environment variables from §5 in Vercel's dashboard (Project → Settings →
   Environment Variables) once you've wired in MongoDB/NextAuth/FastAPI.
5. Deploy. Every push to `main` auto-deploys; PRs get preview URLs.

**Alternative:** any Node host that supports Next.js (Render, Railway, a VM with
`npm run build && npm run start` behind Nginx/PM2) works too — Vercel is just zero-config.

### Database → MongoDB Atlas
1. https://www.mongodb.com/cloud/atlas → create a free M0 cluster.
2. Database Access → add a user; Network Access → allow `0.0.0.0/0` for prototyping (restrict
   to your deployment's IPs in production).
3. Copy the connection string into `MONGODB_URI`.

### AI microservice → Render / Railway / Fly.io
1. Put the FastAPI app (§4.3) in its own repo/folder with a `requirements.txt`
   (`fastapi`, `uvicorn`, `sentence-transformers`, `faiss-cpu`).
2. Deploy as a web service with start command `uvicorn main:app --host 0.0.0.0 --port $PORT`.
3. Put the deployed URL into `AI_SERVICE_URL` on Vercel.

### WhatsApp integration
1. Register a WhatsApp Business number via Meta's Cloud API (or a BSP like Gupshup/Twilio).
2. Point the webhook at a new `app/api/whatsapp/webhook/route.ts` that mirrors the logic in
   `app/api/reports/route.ts`.
3. Verify with `WHATSAPP_VERIFY_TOKEN`.

---

## 7. Suggested next build steps (in priority order)

1. Wire real MongoDB Atlas persistence (§4.1) — everything else depends on data surviving restarts.
2. Add NextAuth with real role-based sessions and route protection (§4.2).
3. Stand up the FastAPI matching service and swap it in (§4.3).
4. Turn the Gov dashboard's PDF/Excel export buttons into real endpoints (`pdf-lib` / `exceljs`).
5. Replace the illustrative Community Map with a real Mapbox/Leaflet map using live lat/lng.
6. Add the WhatsApp Cloud API webhook so `/whatsapp` becomes a real reporting channel, not a demo.
7. Add automated tests (Playwright for the citizen report → escalate flow is the highest-value one).

---

## 8. Design notes

- **Emblem**: `components/Emblem.tsx` is an original stylised chakra/shield mark inspired by the
  visual language of Indian government portals — it deliberately does **not** reproduce the
  official State Emblem of India, which is protected under the State Emblem of India
  (Prohibition of Improper Use) Act. Swap in your institution's actual approved emblem asset
  before any real deployment.
- **Logo intro**: `components/LogoIntro.tsx` plays once per browser session (via
  `sessionStorage`) — center the emblem, hold, then split-wipe to reveal the site.
- **Color system**: navy `#0B3D91`, saffron `#f78310`, forest green `#268f54`, defined in
  `tailwind.config.ts` as full 50–950 scales so you can theme any component consistently.
