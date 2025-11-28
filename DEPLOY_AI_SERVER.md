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

## Important: Running Ollama
The AI Server relies on **Ollama** to run the LLM (Llama 3). You need to run Ollama as a service.

1.  **Create a separate service** on Cloud Clusters for Ollama.
2.  Use the official Ollama Docker image: `ollama/ollama`.
3.  Once running, get its **Internal IP/URL**.
4.  Update the `OLLAMA_BASE_URL` in your AI Server environment variables to point to this Ollama instance.
