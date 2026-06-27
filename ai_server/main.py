import os
import logging
import time
import threading
import httpx
from collections import defaultdict, deque
import requests
from fastapi import FastAPI, HTTPException, Depends, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from typing import Optional, List
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="TriniBuild AI Server",
    description="AI-powered backend for TriniBuild using self-hosted Ollama",
    version="2.0.0"
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

# Configuration — self-hosted Ollama (no API key needed, completely free)
OLLAMA_URL = os.environ.get('OLLAMA_URL', 'http://deer-flow-ollama-1:11434')
DEFAULT_MODEL = os.environ.get('DEFAULT_MODEL', 'qwen2.5:7b')
VISION_MODEL = os.environ.get('VISION_MODEL', 'qwen3-vl:8b')

# Security: restrict which models a client may request via /generate.
# Prevents model-name injection (e.g. billing/pricing abuse).
ALLOWED_MODELS = {
    'qwen2.5:7b',
    'qwen3:4b',
    'llama3.2:3b',
    'qwen3-vl:8b',
}

# Security: cap prompt length to bound cost and prevent prompt-stuffing abuse.
MAX_PROMPT_CHARS = 4000

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
    system_prompt: Optional[str] = None  # optional override of the default analysis prompt
    user_prompt: Optional[str] = None    # optional extra user instructions/hints

class IslandChatRequest(BaseModel):
    message: str
    history: Optional[List[dict]] = None  # [{role, content}, ...]
    mode: str = "support"  # support, onboarding, sales

# --- Helper Functions ---

async def ollama_chat(messages: list, model: str = None, temperature: float = 0.7, max_tokens: int = 1000) -> str:
    """Call self-hosted Ollama — no API key needed, completely free"""
    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f'{OLLAMA_URL}/api/chat',
            json={
                'model': model or DEFAULT_MODEL,
                'messages': messages,
                'stream': False,
                'options': {
                    'temperature': temperature,
                    'num_predict': max_tokens,
                }
            }
        )
        resp.raise_for_status()
        return resp.json()['message']['content']

async def ollama_vision(image_url: str, prompt: str, model: str = None) -> str:
    """Call self-hosted Ollama vision model — qwen3-vl:8b"""
    # Download the image and convert to base64
    import base64
    async with httpx.AsyncClient(timeout=60.0) as http:
        img_resp = await http.get(image_url)
        img_resp.raise_for_status()
        img_b64 = base64.b64encode(img_resp.content).decode()

    async with httpx.AsyncClient(timeout=120.0) as client:
        resp = await client.post(
            f'{OLLAMA_URL}/api/chat',
            json={
                'model': model or VISION_MODEL,
                'messages': [{
                    'role': 'user',
                    'content': prompt,
                    'images': [img_b64]
                }],
                'stream': False,
                'options': {'temperature': 0.3, 'num_predict': 800}
            }
        )
        resp.raise_for_status()
        return resp.json()['message']['content']

def query_groq(prompt: str, system_prompt: str = "", model: str = None, max_tokens: int = 2000) -> str:
    """
    Backward-compat wrapper — now calls Ollama instead of Groq.
    """
    import asyncio
    messages = []
    if system_prompt:
        messages.append({"role": "system", "content": system_prompt})
    messages.append({"role": "user", "content": prompt})
    try:
        return asyncio.run(ollama_chat(messages, model=model, max_tokens=max_tokens))
    except Exception as e:
        logger.error(f"Ollama API error: {e}")
        return "I apologize, but I'm currently having trouble connecting to my brain. Please try again in a moment."

# --- Endpoints ---

@app.get("/")
async def health_check():
    return {"status": "ok", "service": "TriniBuild AI Server (Ollama Self-Hosted)"}

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

    generated_text = await ollama_chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ], model=DEFAULT_MODEL)
    
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

    generated_text = await ollama_chat([
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": prompt}
    ], model=DEFAULT_MODEL)
    
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

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": full_prompt},
    ]
    generated_text = await ollama_chat(messages, model=DEFAULT_MODEL)
    
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
        messages = []
        if request.system_prompt:
            messages.append({"role": "system", "content": request.system_prompt})
        messages.append({"role": "user", "content": request.prompt})
        response = await ollama_chat(
            messages,
            model=request.model or DEFAULT_MODEL,
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
        # Default product-analysis prompt; client may override via system_prompt/user_prompt.
        default_instruction = (
            "You are a product listing assistant for a Trinidad & Tobago online store. "
            "Look at this product photo and return ONLY valid JSON (no markdown, no backticks) with keys: "
            '{"name": "concise product name max 80 chars", "price": number in TTD (your best estimate), '
            '"category": "one short category", "description": "2-3 short persuasive sentences for T&T shoppers", '
            '"tags": ["tag1","tag2","tag3","tag4","tag5"]}'
        )

        # If the client supplies its own system_prompt, use it (keeps the eBay-class
        # optimizer's richer schema available); otherwise use the default above.
        instruction_text = request.system_prompt if request.system_prompt else default_instruction
        # Append any extra user hints (store name, category, merchant notes).
        if request.user_prompt:
            instruction_text = f"{instruction_text}\n\n{request.user_prompt}"

        content = await ollama_vision(request.image_url, instruction_text)
        # Strip markdown code fences if model wraps output (e.g. ```json ... ```)
        stripped = content.strip()
        if stripped.startswith('```'):
            lines = stripped.split('\n')
            # Remove first line (```json or ```) and last line (```)
            inner = lines[1:] if len(lines) > 1 else lines
            if inner and inner[-1].strip() == '```':
                inner = inner[:-1]
            content = '\n'.join(inner).strip()
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

        content = await ollama_chat(messages, model=DEFAULT_MODEL, temperature=0.8, max_tokens=600)
        return AIResponse(content=content, model_used=DEFAULT_MODEL)
    except Exception as e:
        logger.error(f"Island chat error: {e}")
        return AIResponse(
            content="Aye, sorry — meh brain hiccup just now. Try me again in a moment, or reach support@trinibuild.com.",
            model_used=DEFAULT_MODEL,
        )

class WhatsAppMessage(BaseModel):
    to: str  # phone number with country code, no +
    message: str
    order_id: Optional[str] = None

@app.post('/send-whatsapp')
async def send_whatsapp(req: WhatsAppMessage):
    # Use Twilio REST API server-side (keys are in ai_server/.env)
    account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
    auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
    from_number = os.environ.get('TWILIO_WHATSAPP_NUMBER', 'whatsapp:+14155238886')

    if not account_sid or not auth_token:
        return {'success': False, 'error': 'Twilio not configured'}

    url = f'https://api.twilio.com/2010-04-01/Accounts/{account_sid}/Messages.json'
    data = {
        'From': from_number,
        'To': f'whatsapp:{req.to}',
        'Body': req.message
    }
    async with httpx.AsyncClient() as client:
        resp = await client.post(url, data=data, auth=(account_sid, auth_token))

    if resp.status_code == 201:
        return {'success': True, 'sid': resp.json().get('sid')}
    else:
        return {'success': False, 'error': resp.text}

# Meta Ads API Integration
META_API_BASE = 'https://graph.facebook.com/v21.0'

class MetaCampaignCreate(BaseModel):
    name: str
    objective: str  # OUTCOME_TRAFFIC, OUTCOME_LEADS, OUTCOME_SALES
    daily_budget_cents: int  # in USD cents e.g. 500 = $5/day
    status: str = 'PAUSED'  # Start paused for safety

class MetaAdSetCreate(BaseModel):
    campaign_id: str
    name: str
    targeting_country: str = 'TT'  # Default T&T
    targeting_age_min: int = 18
    targeting_age_max: int = 65
    daily_budget_cents: int = 500
    optimization_goal: str = 'LINK_CLICKS'

class MetaAdCreate(BaseModel):
    adset_id: str
    name: str
    page_id: str
    headline: str
    body: str
    link_url: str
    image_url: Optional[str] = None

@app.get('/meta/campaigns')
async def get_meta_campaigns():
    token = os.environ.get('META_ACCESS_TOKEN')
    account_id = os.environ.get('META_AD_ACCOUNT_ID')
    if not token or not account_id:
        return {'success': False, 'error': 'Meta not configured', 'campaigns': []}
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f'{META_API_BASE}/act_{account_id}/campaigns',
            params={'access_token': token, 'fields': 'id,name,status,objective,daily_budget,insights{impressions,clicks,spend,ctr}'}
        )
    return {'success': True, 'campaigns': r.json().get('data', [])}

@app.post('/meta/campaigns')
async def create_meta_campaign(req: MetaCampaignCreate):
    token = os.environ.get('META_ACCESS_TOKEN')
    account_id = os.environ.get('META_AD_ACCOUNT_ID')
    if not token or not account_id:
        return {'success': False, 'error': 'Meta not configured'}
    async with httpx.AsyncClient() as client:
        r = await client.post(
            f'{META_API_BASE}/act_{account_id}/campaigns',
            data={
                'name': req.name,
                'objective': req.objective,
                'status': req.status,
                'special_ad_categories': [],
                'access_token': token
            }
        )
    data = r.json()
    if 'id' in data:
        return {'success': True, 'campaign_id': data['id']}
    return {'success': False, 'error': data.get('error', {}).get('message', 'Unknown error')}

@app.get('/meta/insights')
async def get_meta_insights():
    token = os.environ.get('META_ACCESS_TOKEN')
    account_id = os.environ.get('META_AD_ACCOUNT_ID')
    if not token or not account_id:
        return {'success': False, 'error': 'Meta not configured', 'data': {}}
    async with httpx.AsyncClient() as client:
        r = await client.get(
            f'{META_API_BASE}/act_{account_id}/insights',
            params={
                'access_token': token,
                'fields': 'impressions,clicks,spend,ctr,cpm,reach,frequency,actions',
                'date_preset': 'last_30d',
                'level': 'account'
            }
        )
    return {'success': True, 'data': r.json().get('data', [{}])[0] if r.json().get('data') else {}}

@app.post('/meta/generate-ad-copy')
async def generate_ad_copy(req: dict):
    """Use Ollama to generate Facebook ad copy for a Caribbean business"""
    business_type = req.get('business_type', 'retail')
    product = req.get('product', 'products')
    island = req.get('island', 'Trinidad')
    objective = req.get('objective', 'sales')

    prompt = f"""Write 3 Facebook ad variations for a {business_type} business in {island} promoting {product}.

Objective: {objective}
Target: Caribbean people aged 18-45
Platform: Facebook & Instagram

For each variation provide:
- Headline (max 40 chars)
- Primary text (max 125 chars, Trini-friendly tone)
- CTA: (Shop Now / Learn More / Sign Up)

Format as JSON array with fields: headline, body, cta"""

    result = await ollama_chat([{"role": "user", "content": prompt}], model=DEFAULT_MODEL)
    try:
        import json
        # Try to extract JSON from response
        start = result.find('[')
        end = result.rfind(']') + 1
        if start >= 0 and end > start:
            ads = json.loads(result[start:end])
        else:
            ads = [{'headline': 'Shop Local on Juvay', 'body': result[:125], 'cta': 'Shop Now'}]
    except:
        ads = [{'headline': 'Discover Caribbean Businesses', 'body': result[:125], 'cta': 'Learn More'}]

    return {'success': True, 'ads': ads}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
