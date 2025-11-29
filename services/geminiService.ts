import { aiService } from "./ai";
import { Business, Product } from "../types";

// Helper to parse JSON from AI response which might contain markdown code blocks or extra text
const parseAiJson = (text: string) => {
  try {
    // Aggressive cleanup: Find the first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');

    if (start === -1 || end === -1) {
      throw new Error("No JSON object found in response");
    }

    const jsonStr = text.substring(start, end + 1);
    return JSON.parse(jsonStr);
  } catch (e) {
    console.error("Failed to parse AI JSON:", e);
    throw new Error("AI returned invalid data format");
  }
};

// 0. Test API Connection
export const testApiKey = async (): Promise<boolean> => {
  try {
    await aiService.generateText("Test connection.");
    return true;
  } catch (error) {
    console.error("API Test Failed:", error);
    return false;
  }
};

// 1. AI Store Creator Service
export const generateStoreProfile = async (businessName: string, businessType: string): Promise<Partial<Business>> => {
  const prompt = `Create a realistic business profile for a store in Trinidad & Tobago named "${businessName}" which is a "${businessType}".
  Include a catchy description, 3-4 relevant products with prices in TTD (Trinidad and Tobago Dollars), and typical operating hours.
  Ensure the tone is local and welcoming.
  
  Return ONLY valid JSON in this format:
  {
    "description": "string",
    "hours": "string",
    "products": [
      { "name": "string", "price": number, "description": "string" }
    ]
  }`;

  try {
    const text = await aiService.generateText(prompt);
    return parseAiJson(text);
  } catch (error) {
    console.error("Error generating store, using fallback:", error);
    // Fallback Template to ensure user is never blocked
    return {
      description: `Welcome to ${businessName}, your premier destination for ${businessType} in Trinidad & Tobago. We offer the best quality and service to our customers.`,
      hours: "Mon-Fri: 8am - 5pm, Sat: 9am - 2pm",
      products: [
        { name: "Signature Item", price: 150, description: "Our most popular item, loved by locals." },
        { name: "Premium Selection", price: 300, description: "High quality and durable." },
        { name: "Value Pack", price: 75, description: "Great value for your money." }
      ]
    };
  }
};

// 2. Maps Grounding Service (Mocked/AI-Hallucinated for now as we don't have Maps access in local LLM)
export const findLocalBusinesses = async (query: string, userLat?: number, userLng?: number): Promise<{ text: string; chunks: any[] }> => {
  const locationContext = userLat && userLng
    ? `The user is located at lat: ${userLat}, lng: ${userLng}. Prioritize results nearby.`
    : 'Focus on Trinidad and Tobago.';

  const prompt = `Find local businesses matching this query: "${query}". ${locationContext}. 
  List them with details. Since you don't have live map access, suggest well-known or plausible businesses in T&T.`;

  try {
    const text = await aiService.generateText(prompt);
    return {
      text: text,
      chunks: [] // No grounding chunks from local LLM
    };
  } catch (error) {
    console.error("Error searching businesses:", error);
    return { text: "Error searching for businesses. Please try again.", chunks: [] };
  }
};

// 3. AI Product Description Generator
export const generateProductDescription = async (productName: string, price: number): Promise<string> => {
  const prompt = `Write a short, catchy, and appetizing description (under 30 words) for a product named "${productName}" costing TT$${price}. The product is sold in a store in Trinidad & Tobago. Capture the local vibe if appropriate.`;
  try {
    return await aiService.generateText(prompt);
  } catch (error) {
    console.error("Error generating description:", error);
    throw error;
  }
};

// 4. AI Image Generator for Products (Using Pollinations.ai as fallback for local LLM)
export const generateProductImage = async (productName: string): Promise<string> => {
  // Local LLM is text-only, so we use a public API for images or a placeholder
  const encoded = encodeURIComponent(productName + " product professional photography");
  return `https://image.pollinations.ai/prompt/${encoded}?width=800&height=800&nologo=true`;
};

// 4b. AI Logo Generator
export const generateStoreLogo = async (storeName: string, storeType: string): Promise<string> => {
  const encoded = encodeURIComponent(`Logo for ${storeName} ${storeType} minimalist vector logo white background`);
  return `https://image.pollinations.ai/prompt/${encoded}?width=500&height=500&nologo=true`;
};

// 5. Vision AI (Product Analysis) - Mocked
export const analyzeProductPhoto = async (base64Data: string): Promise<{ name: string; price: number; description: string }> => {
  // Local LLM cannot see images. Return generic response.
  return {
    name: "Detected Item",
    price: 0,
    description: "Item analysis not available in local mode."
  };
};

// 5b. AI Business Verification (Document Scan) - Mocked
export const verifyBusinessDocument = async (base64Data: string, businessName: string): Promise<{ match: boolean; confidence: number; analysis: string }> => {
  return {
    match: true,
    confidence: 85,
    analysis: "Document verification simulated in local mode. Assumed valid for testing."
  };
};


// 6. Search Grounding
export const searchMarketTrends = async (query: string): Promise<{ text: string; chunks: any[] }> => {
  const prompt = `Research the following topic specifically for the Trinidad and Tobago business context: "${query}". Provide a concise summary of current trends, news, prices, or relevant business information.`;
  try {
    const text = await aiService.generateText(prompt);
    return { text, chunks: [] };
  } catch (error) {
    console.error("Error searching trends:", error);
    throw error;
  }
};

// 7. Platform Chatbot (TriniBot)
export const chatWithTriniBot = async (message: string, history: any[]): Promise<string> => {
  const systemPrompt = `You are TriniBot, the helpful AI assistant for TriniBuild, built for the people of Trinidad & Tobago.
      
      **Identity:**
      You are a true Trini. You speak with a warm, friendly Trinidadian accent/dialect (Patois).
      You are hospitable, helpful, and resourceful—like a good neighbor or a knowledgeable shopkeeper.

      **Language & Tone:**
      - Use local greetings: "Wuz the scene?", "Aye good morning", "Wah going on?", "Respect".
      - Use Trini slang naturally but clearly: "Lime" (hang out), "Small ting" (no problem), "Right through" (okay/straight ahead), "Bess" (awesome/great).
      - Sentence structure should reflect local speech: "You good?", "We goin' fix that for you", "Don't study it", "Is plenty stores we have".
      - Keep it professional enough for business, but relaxed and authentic.

      **Goal:**
      Help users navigate the app, explain features (Free Store with 10 items, AI Builder, WhatsApp Checkout, TriniBuild Rides), and provide support.
      
      **Key Info:**
      - The app is "TriniBuild".
      - "TriniBuild Pay" is for payments.
      - "TriniBuild Go" is for rides/delivery.
      
      If you don't know something, say: "Hold strain, let me check that for you" or "Nah, I not too sure about that one."`;

  // Construct history string
  const historyText = history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
  const fullPrompt = `${historyText}\nuser: ${message}`;

  return await aiService.generateText(fullPrompt, systemPrompt);
};

// 8. Vendor Business Chatbot (MyStore Bot)
export const chatWithVendorBot = async (message: string, history: any[], storeContext: any): Promise<string> => {
  const productsList = storeContext.products.map((p: any) => `${p.name} ($${p.price})`).join(', ');

  const systemPrompt = `You are the customer service agent for ${storeContext.name}, a local business in Trinidad & Tobago.
      
      **Store Details:**
      Name: ${storeContext.name}
      Description: ${storeContext.description}
      Products Available: ${productsList}
      WhatsApp: ${storeContext.whatsapp || 'Not configured'}
      
      **Identity & Tone:**
      - You are a friendly, welcoming Trini shop assistant.
      - Speak with local flair and warmth. Use terms like "darling", "boss", "family", "hoss" appropriately.
      - Promote the products with enthusiasm ("This curry mango is bess!", "Real quality items we have here").
      
      **Goal:**
      - Answer questions about products.
      - Encourage customers to buy.
      - If they want to order, tell them: "Click dat WhatsApp button to lock in yuh order directly!" or "Add it to yuh cart, we delivering fast."
      
      Be polite, helpful, and make the customer feel like family.`;

  const historyText = history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
  const fullPrompt = `${historyText}\nuser: ${message}`;

  return await aiService.generateText(fullPrompt, systemPrompt);
};

// 9. AI Blog Generator
export const generateBlogPost = async (topic: string, keywords: string): Promise<{ title: string; content: string; excerpt: string }> => {
  const prompt = `Write a SEO-optimized blog post for the TriniBuild platform.
  Topic: "${topic}"
  Target Keywords: "${keywords}"
  Context: Trinidad & Tobago market.
  
  Return ONLY valid JSON with:
  - "title": Engaging headline.
  - "excerpt": 2 sentence summary.
  - "content": Full HTML article (approx 400 words) with <h2> headers, bullet points, and a call to action for TriniBuild.`;

  try {
    const text = await aiService.generateText(prompt);
    return parseAiJson(text);
  } catch (error) {
    console.error("Blog Gen Error:", error);
    throw error;
  }
};

// 10. AI Legal Contract Generator
export const generatePromoterContract = async (promoterName: string, businessName: string): Promise<string> => {
  const date = new Date().toLocaleDateString();

  const prompt = `Generate a legally binding "Promoter Partnership Agreement" for the TriniBuild E-Tick platform.
  
  Parties:
  1. TriniBuild Technologies Ltd. ("Platform")
  2. ${promoterName} representing ${businessName} ("Promoter")
  
  Key Terms:
  - Exclusivity Period: 2 Years.
  - Promotional Fee Rate: 6.0% per ticket sold (Discounted from Standard 8.0%).
  - Payout Schedule: Weekly (Every Tuesday).
  - Date: ${date}
  
  Format: Plain text with clear sections (1. Term, 2. Fees, 3. Exclusivity, 4. Signature).
  Keep it professional but concise (under 300 words) suitable for digital signing.`;

  return await aiService.generateText(prompt);
};

// 11. Real Estate AI Agent
export const chatWithRealEstateBot = async (message: string, history: any[]): Promise<string> => {
  const systemPrompt = `You are the TriniBuild Real Estate Assistant, a knowledgeable property expert for Trinidad & Tobago.
      
      **Identity:**
      - You are professional, knowledgeable, but approachable (Trini warmth).
      - You know the local market: Port of Spain, Chaguanas, San Fernando, Arima, Tobago.
      
      **Goal:**
      - Help users find properties (Rent or Buy).
      - Explain the buying process (Mortgages, Stamp Duty, Legal Fees).
      - Suggest areas based on their needs (e.g., "If you want nightlife, check Woodbrook. For family, try Lange Park.").
      
      **Tone:**
      - Helpful, expert, encouraging.
      - Use local context (e.g., "Traffic into POS can be heavy, so St. James is a good option if you work downtown.").
      
      If asked about specific listings, guide them to use the search filters or say you can help them refine their search criteria.`;

  const historyText = history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
  const fullPrompt = `${historyText}\nuser: ${message}`;

  return await aiService.generateText(fullPrompt, systemPrompt);
};

// 12. Service Expert AI Agent
export const chatWithServiceBot = async (message: string, history: any[]): Promise<string> => {
  const systemPrompt = `You are the TriniBuild Service Expert, a helpful assistant for finding home service professionals in Trinidad & Tobago.
      
      **Identity:**
      - You are practical, knowledgeable about home repairs/services, and friendly.
      - You know about: Plumbing, Electrical, AC Repair, Cleaning, Landscaping, Construction.
      
      **Goal:**
      - Help users define their project (e.g., "My tap is leaking" -> "You need a plumber").
      - Suggest what to look for in a pro (e.g., "Make sure they are licensed for electrical work").
      - Estimate rough price ranges for common T&T tasks (e.g., AC Service is usually $250-$400 TTD).
      
      **Tone:**
      - Helpful, "fix-it" attitude.
      - Use local context (e.g., "With this heat, you definitely need that AC fixed fast.").
      
      If asked for specific pros, guide them to use the search categories on the page.`;

  const historyText = history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
  const fullPrompt = `${historyText}\nuser: ${message}`;

  return await aiService.generateText(fullPrompt, systemPrompt);
};

// 13. Rideshare AI Agent
export const chatWithRidesBot = async (message: string, history: any[]): Promise<string> => {
  const systemPrompt = `You are the TriniBuild Go Assistant, a helpful travel companion for Trinidad & Tobago.
      
      **Identity:**
      - You are street-smart, know the routes, and helpful.
      - You know about: Traffic hotspots (Lighthouse, UbH), best times to travel, and safety tips.
      
      **Goal:**
      - Help users book a ride (guide them to the form).
      - Estimate travel times (e.g., "POS to Sando is about 45 mins right now").
      - Explain the difference between services (TriniRide vs H-Taxi vs Courier).
      
      **Tone:**
      - "We reaching just now" attitude. Efficient but friendly.
      
      If they want to book, tell them: "Just enter your pickup and dropoff in the box on the left, and we go sort you out."`;

  const historyText = history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
  const fullPrompt = `${historyText}\nuser: ${message}`;

  return await aiService.generateText(fullPrompt, systemPrompt);
};

// 14. Paperwork & Visa AI Agent
export const chatWithPaperworkBot = async (message: string, history: any[]): Promise<string> => {
  const systemPrompt = `You are the TriniBuild Paperwork Assistant, a specialized expert in banking compliance and visa documentation for Trinidad & Tobago citizens.

      **Identity:**
      - You are professional, precise, and reassuring.
      - You understand the frustration of "red tape" in T&T banks and embassies.
      - You are an expert on: Job Letters, Proof of Income, Financial Statements, and Visa Application requirements (US B1/B2, Canada Visitor, UK Standard Visitor).

      **Goal:**
      - Explain how TriniBuild generates official documents for self-employed users.
      - Guide users on what documents they need for loans, mortgages, or visas.
      - **Crucial:** Always remind them that they need a **Growth** or **Empire** subscription to generate these documents automatically.
      
      **Key Info to Convey:**
      - "Banks require proof of income. TriniBuild tracks your sales and generates a verified Job Letter and Income Statement."
      - "For US Visas, you need to show strong ties. A verified business profile and consistent income history on TriniBuild helps prove this."
      - "To get these documents, just upgrade to the Growth Plan in your Dashboard."

      **Tone:**
      - Empathetic but authoritative. "We handle the paperwork so you can focus on business."
      
      If they ask how to start, tell them: "Sign up, start selling, and when you're ready, click the 'Documents' tab in your dashboard to download your papers instantly."`;

  const historyText = history.map((h: any) => `${h.role}: ${h.parts[0].text}`).join('\n');
  const fullPrompt = `${historyText}\nuser: ${message}`;

  return await aiService.generateText(fullPrompt, systemPrompt);
};
