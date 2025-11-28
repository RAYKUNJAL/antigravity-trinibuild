# Deploying TriniBuild AI Server to Cloud Clusters

This guide explains how to deploy the Python AI Server (FastAPI + Ollama) to Cloud Clusters.

## Prerequisites
- A Cloud Clusters account (you are already logged in).
- Docker installed locally.

## Option 1: Deploy via Docker Image (Recommended)

### 1. Build the Image
Run this command in your terminal:

```bash
docker build -t trinibuild-ai-server ./ai_server
```

### 2. Tag and Push (If you have a registry)
If you have a Docker Hub account or private registry:

```bash
docker tag trinibuild-ai-server yourusername/trinibuild-ai-server
docker push yourusername/trinibuild-ai-server
```

### 3. Deploy on Cloud Clusters
1.  Go to the **Cloud Clusters Dashboard**.
2.  Click **"Create Application"**.
3.  Select **"Docker"** or **"Python"**.
4.  If using Docker, provide your image name (`yourusername/trinibuild-ai-server`).
5.  Set the **Port** to `8000`.
6.  **Environment Variables**:
    - `OLLAMA_BASE_URL`: If you are running Ollama in the same cluster, put its internal URL. If running separately, put the full URL.
    - `ALLOWED_ORIGINS`: `*` (or your frontend URL).

## Option 2: Deploy via Git (Direct Code)

1.  Push your code to a Git repository (GitHub/GitLab).
2.  In Cloud Clusters, create a **Python** application.
3.  Connect your repository.
4.  Set the **Build Command**: `pip install -r requirements.txt`
5.  Set the **Start Command**: `uvicorn main:app --host 0.0.0.0 --port 8000`

## Important: Running AI Models (Ollama vs Local)
The AI Server now supports two modes:

### Mode A: Hybrid (Recommended for Performance)
Use **Ollama** as a separate service. This is faster and handles multiple requests better.
1.  **Create a separate service** on Cloud Clusters for Ollama (Image: `ollama/ollama`).
2.  Get its **Internal IP/URL**.
3.  Set `OLLAMA_BASE_URL` in your AI Server environment variables.

### Mode B: Local Fallback (Easiest Setup)
If you do not set up Ollama, the server will automatically download and run a lightweight model (`TinyLlama`) directly within the Python process using `ctransformers`.
- **Pros**: Single deployment, no extra service needed.
- **Cons**: Slower, uses more RAM on the application container (ensure you have at least 2GB RAM).
- **Setup**: Just deploy the Python app (Option 2 above). No extra config needed.
