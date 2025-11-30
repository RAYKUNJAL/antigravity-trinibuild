import os
import logging
import requests
from fastapi import FastAPI, HTTPException, Depends
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
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
DEFAULT_MODEL = "llama-3.3-70b-versatile"

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

# --- Helper Functions ---

def query_groq(prompt: str, system_prompt: str = "", model: str = DEFAULT_MODEL) -> str:
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
            max_tokens=1024,
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
        response = query_groq(request.prompt, model=request.model or DEFAULT_MODEL, system_prompt=request.system_prompt or "")
        return {"content": response, "model_used": request.model or DEFAULT_MODEL}
    except Exception as e:
        logger.error(f"Generation error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
