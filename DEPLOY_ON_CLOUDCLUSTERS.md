# Deploying AI Server to CloudClusters.io

Using CloudClusters.io is a great way to host your AI server so it is always available and doesn't rely on your local computer being on.

## Will it be faster?
**YES! We are now using Groq, which is incredibly fast.**

Because the heavy AI model is now hosted by Groq (for free), your server only needs to be a lightweight "messenger".
- **CPU:** A basic **1 vCPU** plan is now perfectly fine.
- **RAM:** **512MB or 1GB RAM** is plenty.
- **GPU:** You **DO NOT** need a GPU anymore. Save your money!

This setup is "Commercial Grade" speed for a fraction of the cost (or free).

## Deployment Steps

### Option 1: Docker Deployment (Recommended)

1. **Login to CloudClusters.io** and create a new **Docker** application.
2. **Connect your GitHub Repository** (`RAYKUNJAL/antigravity-trinibuild`).
3. **Configure the Service**:
   - **Build Context**: `ai_server` (This is important! Point it to the `ai_server` folder).
   - **Dockerfile Path**: `Dockerfile`
   - **Port**: `8000`
4. **Environment Variables**:
   - You don't strictly need any for the basic setup, but you can set `DEV_MODE=false`.
5. **Deploy**.

### Option 2: Manual Upload (If using a raw VPS)

1. **SSH into your server**.
2. **Install Docker** if not already installed.
3. **Upload your files** (or git clone).
4. Navigate to `ai_server`.
5. Run:
   ```bash
   docker-compose up -d --build
   ```

## Important Note on "Cold Starts"
When the server first starts, it will download the AI model (approx 1GB). This takes 1-2 minutes. During this time, the first request might fail or time out. **Wait a few minutes after deploying before testing.**

## Updating the Frontend
Once deployed, you will get a **Public URL** (e.g., `https://ai-server-xyz.cloudclusters.net`).
You must update your frontend to use this URL:

1. Open `.env.local` (or your Vercel/Netlify environment settings).
2. Change `VITE_AI_SERVER_URL` to your new CloudClusters URL.
   ```
   VITE_AI_SERVER_URL=https://your-new-cloud-url.com
   ```
3. Redeploy your frontend.
