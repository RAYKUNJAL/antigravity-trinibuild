# Commercial Grade Deployment Guide (Split Stack)

Your TriniBuild system consists of 3 parts:
1.  **Frontend** (React/Vite)
2.  **Backend API** (Node.js/Express)
3.  **AI Server** (Python)

To go live, you cannot just deploy to Vercel. You must deploy the servers separately. This guide explains how.

---

## Phase 1: Deploy Backend API (Node.js)

We recommend **Render** or **Railway** for hosting the backend server properly.

### Option A: Render (Recommended)
1.  Push your code to GitHub.
2.  Go to [Render Dashboard](https://dashboard.render.com).
3.  Click **New +** -> **Web Service**.
4.  Connect your GitHub repository.
5.  **Root Directory:** `backend`
6.  **Build Command:** `npm install && npm run build`
7.  **Start Command:** `npm start`
8.  **Environment Variables:**
    *   `DATABASE_URL`: Your Supabase connection string.
    *   `STRIPE_SECRET_KEY`: Live key.
    *   `PAYPAL_CLIENT_ID`: Live key.
9.  Click **Create Web Service**.
10. **Copy** the URL (e.g., `https://trinibuild-backend.onrender.com`).

---

## Phase 2: Deploy AI Server (Python)

1.  Go to [Render Dashboard](https://dashboard.render.com).
2.  Click **New +** -> **Web Service**.
3.  Connect your GitHub repository.
4.  **Root Directory:** `ai_server`
5.  **Build Command:** `pip install -r requirements.txt`
6.  **Start Command:** `python main.py` (or `uvicorn main:app --host 0.0.0.0 --port 8000`)
7.  Click **Create Web Service**.
8.  **Copy** the URL (e.g., `https://trinibuild-ai.onrender.com`).

---

## Phase 3: Deploy Frontend (Vercel)

1.  Go to [Vercel Dashboard](https://vercel.com).
2.  Import your GitHub repository.
3.  **Framework Preset:** Vite
4.  **Root Directory:** `./` (default)
5.  **Environment Variables (CRITICAL):**
    *   `VITE_SUPABASE_URL`: Your Supabase URL.
    *   `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key.
    *   `VITE_API_URL`: **Paste your Backend URL from Phase 1** (e.g., `https://trinibuild-backend.onrender.com`).
    *   `VITE_AI_API_URL`: **Paste your AI URL from Phase 2** (e.g., `https://trinibuild-ai.onrender.com`).
6.  Click **Deploy**.

---

## Phase 4: Verification

1.  Visit your new Vercel URL (e.g., `trinibuild.vercel.app`).
2.  Open the **Storefront**.
3.  Add an item to the cart and proceed to checkout.
4.  The checkout process should now successfully verify with the live Backend URL instead of localhost.

**Congratulations! Your Commercial Grade System is LIVE.** 🚀
