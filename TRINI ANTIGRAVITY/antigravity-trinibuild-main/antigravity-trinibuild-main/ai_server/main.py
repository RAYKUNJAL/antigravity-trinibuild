import os
import logging
import requests
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TriniBuild AI Server",
    description="AI-powered backend for TriniBuild using local LLMs via Ollama",
    version="1.0.0"
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
DEFAULT_MODEL = "llama3"

# --- Pydantic Models ---

class JobLetterRequest(BaseModel):
    applicant_name: str
    position: str
    company_name: str
    skills: List[str] = []
    experience_years: int
    tone: str = "professional" # professional, enthusiastic, confident

class ListingDescriptionRequest(BaseModel):
    title: str
    category: str
    features: List[str]
    condition: str
    price: Optional[float] = None
    tone: str = "persuasive"

class ChatbotRequest(BaseModel):
    message: str
    context: Optional[str] = None
    persona: str = "support_bot" # support_bot, sales_agent
    system_prompt: Optional[str] = None

class AIResponse(BaseModel):
    content: str
    model_used: str
    processing_time_ms: Optional[float] = None

class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None

# --- Helper Functions ---

# Global variable for local model
local_llm = None

def get_local_llm():
    global local_llm
    if local_llm is None:
        try:
            from ctransformers import AutoModelForCausalLM
            logger.info("Loading local Llama model (TinyLlama)...")
            # Using TinyLlama for speed and low memory usage on standard machines
            local_llm = AutoModelForCausalLM.from_pretrained(
                "TheBloke/TinyLlama-1.1B-Chat-v1.0-GGUF",
                model_type="llama",
                gpu_layers=0
            )
            logger.info("Local model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load local model: {e}")
            return None
    return local_llm

def query_ollama(prompt: str, model: str = DEFAULT_MODEL, system_prompt: str = "") -> str:
    """
    Sends a prompt to the Ollama instance. Falls back to local ctransformers model if Ollama is down.
    """
    url = f"{OLLAMA_BASE_URL}/api/generate"
    
    payload = {
        "model": model,
        "prompt": prompt,
        "stream": False
    }
    
    if system_prompt:
        payload["system"] = system_prompt

    # 1. Try Ollama
    try:
        # logger.info(f"Sending request to Ollama: {model}")
        response = requests.post(url, json=payload, timeout=5) # Short timeout to fail fast
        response.raise_for_status()
        data = response.json()
        return data.get("response", "")
    except requests.exceptions.RequestException:
        logger.warning("Ollama not reachable. Falling back to local model.")
    
    # 2. Fallback to Local Model (ctransformers)
    llm = get_local_llm()
    if llm:
        try:
            full_prompt = f"<|system|>\n{system_prompt}</s>\n<|user|>\n{prompt}</s>\n<|assistant|>"
            logger.info("Generating with local TinyLlama...")
            return llm(full_prompt, max_new_tokens=256)
        except Exception as e:
            logger.error(f"Local inference failed: {e}")
    
    # 3. Fallback Mock
    if os.getenv("DEV_MODE", "false").lower() == "true":
         return f"[DEV MODE] Mock response for: {prompt[:50]}..."
    
    raise HTTPException(status_code=503, detail="AI Service Unavailable (Ollama & Local failed)")

# --- Endpoints ---

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "TriniBuild AI Server"}

@app.post("/generate-job-letter", response_model=AIResponse)
async def generate_job_letter(request: JobLetterRequest):
    system_prompt = (
        "You are a professional career consultant. "
        "Write a job application letter based on the provided details. "
        "Ensure the tone is appropriate for the Trinidad & Tobago job market."
    )
    
    prompt = (
        f"Write a {request.tone} job application letter for {request.applicant_name} "
        f"applying for the position of {request.position} at {request.company_name}. "
        f"They have {request.experience_years} years of experience. "
        f"Key skills: {', '.join(request.skills)}."
    )

    generated_text = query_ollama(prompt, system_prompt=system_prompt)
    
    return AIResponse(content=generated_text, model_used=DEFAULT_MODEL)

@app.post("/generate-listing-description", response_model=AIResponse)
async def generate_listing_description(request: ListingDescriptionRequest):
    system_prompt = (
        "You are an expert copywriter for an online marketplace in Trinidad & Tobago. "
        "Write a compelling product description that highlights features and benefits."
    )
    
    prompt = (
        f"Write a {request.tone} description for a {request.title} ({request.category}). "
        f"Condition: {request.condition}. "
        f"Key features: {', '.join(request.features)}. "
        f"{f'Price: TT${request.price}' if request.price else ''}"
    )

    generated_text = query_ollama(prompt, system_prompt=system_prompt)
    
    return AIResponse(content=generated_text, model_used=DEFAULT_MODEL)

@app.post("/chatbot-reply", response_model=AIResponse)
async def chatbot_reply(request: ChatbotRequest):
    system_prompt = request.system_prompt
    
    if not system_prompt:
        if request.persona == "sales_agent":
            system_prompt = "You are a persuasive sales agent helping a customer find the best deals on TriniBuild."
        elif request.persona == "support_bot":
            system_prompt = "You are TriniBuild Support Bot, a helpful assistant with a slight Trinidadian accent."
        else:
            # Default fallback
            system_prompt = "You are a helpful assistant."

    # Include context in the prompt if provided
    full_prompt = f"Context: {request.context}\n\n" if request.context else ""
    full_prompt += f"User: {request.message}\nBot:"

    generated_text = query_ollama(full_prompt, system_prompt=system_prompt)
    
    return AIResponse(content=generated_text, model_used=DEFAULT_MODEL)

@app.post("/generate")
async def generate_text(request: GenerateRequest):
    try:
        response = query_ollama(request.prompt, model=request.model or DEFAULT_MODEL, system_prompt=request.system_prompt or "")
        return {"content": response, "model_used": request.model or DEFAULT_MODEL}
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
