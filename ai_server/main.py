import os
import logging
import time
import threading
from collections import defaultdict, deque
import requests
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from dotenv import load_dotenv
from groq import Groq

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TriniBuild AI Server",
    description="AI-powered backend for TriniBuild using Groq API",
    version="1.0.0"
)

# Add CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=['https://juvay.app', 'https://www.juvay.app', 'https://trinibuild.com', 'http://localhost:5173', 'http://localhost:5174'],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Dependency-free per-IP sliding-window rate limiter ───────────────────────
# Protects the expensive LLM/vision endpoints from cost-injection abuse.
# Limits are per client IP, per rolling 60-second window.
_RATE_LIMITS = {
    "/analyze-product-image": 12,   # vision (most expensive) — 12/min/IP
    "/island-chat": 30,             # chatbot — 30/min/IP
    "/generate": 30,
    "/chatbot-reply": 30,
    "/generate-listing-description": 20,
    "/generate-job-letter": 20,
}
_RATE_WINDOW = 60  # seconds
_rate_hits = defaultdict(deque)  # key: (ip, path) -> deque[timestamps]
_rate_lock = threading.Lock()

def _client_ip(request: Request) -> str:
    # Honor X-Forwarded-For set by trusted proxy (Caddy). Caddy appends the
    # real client IP LAST, so the rightmost entry is the one we trust.
    xff = request.headers.get('x-forwarded-for', '')
    if xff:
        # Caddy appends the real client IP last
        ips = [ip.strip() for ip in xff.split(',')]
        # Return the rightmost non-empty IP (set by trusted proxy)
        return ips[-1] if ips[-1] else request.client.host
    return request.client.host

@app.middleware("http")
async def rate_limit_middleware(request: Request, call_next):
    path = request.url.path
    limit = _RATE_LIMITS.get(path)
    if limit:
        ip = _client_ip(request)
        key = (ip, path)
        now = time.time()
        with _rate_lock:
            dq = _rate_hits[key]
            while dq and dq[0] <= now - _RATE_WINDOW:
                dq.popleft()
            if len(dq) >= limit:
                retry = int(_RATE_WINDOW - (now - dq[0])) + 1
                logger.warning(f"Rate limit hit: {ip} {path} ({len(dq)}/{limit})")
                return JSONResponse(
                    status_code=429,
                    content={"error": "Too many requests. Please slow down and try again shortly."},
                    headers={"Retry-After": str(max(retry, 1))},
                )
            dq.append(now)
    return await call_next(request)

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_MODEL = "llama-3.3-70b-versatile"
# Groq vision-capable model for the product scanner. Override via env if Groq renames it.
VISION_MODEL = os.getenv("GROQ_VISION_MODEL", "meta-llama/llama-4-scout-17b-16e-instruct")

# Security: restrict which models a client may request via /generate.
# Prevents model-name injection (e.g. billing/pricing abuse).
ALLOWED_MODELS = {
    'llama-3.3-70b-versatile',
    'llama-3.1-8b-instant',
    'llama-3.2-3b-preview',
    'meta-llama/llama-4-scout-17b-16e-instruct',
}

# Security: cap prompt length to bound cost and prevent prompt-stuffing abuse.
MAX_PROMPT_CHARS = 4000

if not GROQ_API_KEY:
    logger.warning("GROQ_API_KEY not found in environment variables. AI features will fail.")

# Initialize Groq Client
client = Groq(api_key=GROQ_API_KEY)

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
    persona: str = "support_bot" # support_bot, sales_agent, business_expert
    system_prompt: Optional[str] = None

class AIResponse(BaseModel):
    content: str
    model_used: str
    processing_time_ms: Optional[float] = None

class GenerateRequest(BaseModel):
    prompt: str
    system_prompt: Optional[str] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = 2000

class AnalyzeImageRequest(BaseModel):
    image_url: str  # public URL of the uploaded product photo

class IslandChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None  # [{role, content}, ...]
    mode: str = "support"  # support, onboarding, sales

# --- Helper Functions ---

def query_groq(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL, max_tokens: int = 2000) -> str:
    """
    Sends a prompt to the Groq API.
    """
    try:
        messages = []
        if system_prompt:
            messages.append({"role": "system", "content": system_prompt})
        
        messages.append({"role": "user", "content": prompt})

        chat_completion = client.chat.completions.create(
            messages=messages,
            model=model,
            temperature=0.7,
            max_tokens=max_tokens,
        )
        
        return chat_completion.choices[0].message.content
    except Exception as e:
        logger.error(f"Groq API error: {e}")
        return "I apologize, but I'm currently having trouble connecting to my brain. Please try again in a moment."

# --- Endpoints ---

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "TriniBuild AI Server (Groq Powered)"}

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

    generated_text = query_groq(prompt, system_prompt=system_prompt)
    
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

    generated_text = query_groq(prompt, system_prompt=system_prompt)
    
    return AIResponse(content=generated_text, model_used=DEFAULT_MODEL)

@app.post("/chatbot-reply", response_model=AIResponse)
async def chatbot_reply(request: ChatbotRequest):
    # Security: input length cap — bound cost and prevent prompt stuffing.
    if len(request.message or '') > MAX_PROMPT_CHARS:
        raise HTTPException(status_code=400, detail='Input too long')
    system_prompt = request.system_prompt
    
    if not system_prompt:
        if request.persona == "sales_agent":
            system_prompt = "You are a persuasive sales agent helping a customer find the best deals on TriniBuild."
        elif request.persona == "support_bot":
            system_prompt = "You are TriniBuild Support Bot, a helpful assistant with a slight Trinidadian accent."
        elif request.persona == "business_expert":
            system_prompt = (
                "You are the TriniBuild Business Expert, a highly knowledgeable consultant specializing in Trinidad & Tobago business law, banking regulations, and visa procedures. "
                "Your goal is to provide accurate, actionable advice to business owners and individuals. "
                "You have deep knowledge of: "
                "- Opening bank accounts in T&T (Republic Bank, FCB, Scotiabank, RBC). "
                "- Business Registration with the Ministry of Legal Affairs. "
                "- BIR Number and TAMIS registration. "
                "- Visa application processes for the US, UK, and Canada Embassies in Port of Spain. "
                "- Necessary supporting documents for loans and mortgages. "
                "Always be professional, precise, and helpful. "
                "If asked to generate a document, guide the user to the 'Documents' tab or offer to draft the content for them here."
            )
        else:
            # Default fallback
            system_prompt = "You are a helpful assistant."

    # Include context in the prompt if provided
    # Note: For chat interfaces, it's often better to pass history as messages, 
    # but for this simple endpoint, we'll append context to the prompt.
    full_prompt = request.message
    if request.context:
        full_prompt = f"Context: {request.context}\n\nUser Message: {request.message}"

    generated_text = query_groq(full_prompt, system_prompt=system_prompt)
    
    return AIResponse(content=generated_text, model_used=DEFAULT_MODEL)

@app.post("/generate")
async def generate_text(request: GenerateRequest):
    try:
        # Security: model allowlist — reject arbitrary/untrusted model names.
        if request.model and request.model not in ALLOWED_MODELS:
            raise HTTPException(status_code=400, detail='Model not allowed')
        # Security: input length cap — bound cost and prevent prompt stuffing.
        if len(request.prompt or '') > MAX_PROMPT_CHARS:
            raise HTTPException(status_code=400, detail='Input too long')
        response = query_groq(
            request.prompt,
            model=request.model or DEFAULT_MODEL,
            system_prompt=request.system_prompt or "",
            max_tokens=request.max_tokens or 2000
        )
        return {"content": response, "model_used": request.model or DEFAULT_MODEL}
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Island Chatbot persona (Trini accent, support + onboarding) ---

ISLAND_BOT_PERSONA = (
    "You are 'Lime', the TriniBuild island assistant — a warm, friendly Trinidadian helper. "
    "Speak with a natural light Trini accent and local flavour (e.g. 'Aye', 'no problem at all', "
    "'leh we get yuh store set up', 'real easy', 'just now', 'yuh good'), but stay clear and professional — "
    "never overdo the dialect to the point it's hard to read, and keep it respectful. "
    "You help Trinidad & Tobago small businesses use TriniBuild to sell online. "
    "Key facts you know about TriniBuild: it's a FREE online store builder; free accounts get up to 10 products; "
    "ordering is WhatsApp-first with Cash on Delivery (COD); merchants pick a template, add products, and share a "
    "trinibuild.com/their-store link; paid plans add custom domains and more products; payments can be made at any T&T bank. "
    "Keep answers short, friendly, and practical. If you don't know something, say so honestly and point them to support@trinibuild.com. "
    "Never invent prices, sales numbers, or features that don't exist."
)

ISLAND_BOT_MODES = {
    "support": "The user needs help using TriniBuild. Answer their question simply and guide them step by step.",
    "onboarding": (
        "You are walking a brand-new merchant through getting started. Be encouraging and guide them: "
        "1) pick a business type, 2) choose a template, 3) add their store name and a few products, "
        "4) share their store link on WhatsApp. Ask one friendly question at a time."
    ),
    "sales": "The user is deciding whether to use TriniBuild. Be honest and helpful, highlight free COD selling and the founding-merchant offer, and invite them to start free. Do not pressure or exaggerate.",
}

@app.post("/analyze-product-image", response_model=AIResponse)
async def analyze_product_image(request: AnalyzeImageRequest):
    """Vision: turn a product photo into a ready-to-publish listing (name, price TTD, category, description, tags)."""
    try:
        completion = client.chat.completions.create(
            model=VISION_MODEL,
            messages=[{
                "role": "user",
                "content": [
                    {"type": "text", "text": (
                        "You are a product listing assistant for a Trinidad & Tobago online store. "
                        "Look at this product photo and return ONLY valid JSON (no markdown, no backticks) with keys: "
                        '{"name": "concise product name max 80 chars", "price": number in TTD (your best estimate), '
                        '"category": "one short category", "description": "2-3 short persuasive sentences for T&T shoppers", '
                        '"tags": ["tag1","tag2","tag3","tag4","tag5"]}'
                    )},
                    {"type": "image_url", "image_url": {"url": request.image_url}},
                ],
            }],
            temperature=0.4,
            max_tokens=800,
        )
        content = completion.choices[0].message.content
        return AIResponse(content=content, model_used=VISION_MODEL)
    except Exception as e:
        logger.error(f"Vision analyze error: {e}")
        raise HTTPException(status_code=502, detail="Image analysis is temporarily unavailable. Please try again.")

@app.post("/island-chat", response_model=AIResponse)
async def island_chat(request: IslandChatRequest):
    """The Trini-accent island chatbot for customer support and onboarding."""
    try:
        mode_note = ISLAND_BOT_MODES.get(request.mode, ISLAND_BOT_MODES["support"])
        messages = [{"role": "system", "content": ISLAND_BOT_PERSONA + "\n\n" + mode_note}]
        if request.history:
            # keep last 8 turns to bound tokens
            for turn in request.history[-8:]:
                role = turn.get("role")
                content = turn.get("content")
                if role in ("user", "assistant") and content:
                    messages.append({"role": role, "content": content})
        messages.append({"role": "user", "content": request.message})

        chat_completion = client.chat.completions.create(
            messages=messages,
            model=DEFAULT_MODEL,
            temperature=0.8,
            max_tokens=600,
        )
        return AIResponse(content=chat_completion.choices[0].message.content, model_used=DEFAULT_MODEL)
    except Exception as e:
        logger.error(f"Island chat error: {e}")
        return AIResponse(
            content="Aye, sorry — meh brain hiccup just now. Try me again in a moment, or reach support@trinibuild.com.",
            model_used=DEFAULT_MODEL,
        )

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
