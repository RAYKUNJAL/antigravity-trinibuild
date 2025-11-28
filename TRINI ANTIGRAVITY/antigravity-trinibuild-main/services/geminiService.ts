
import { GoogleGenAI, Type } from "@google/genai";
import { Business, Product } from "../types";

// Helper to get the client dynamically so it picks up keys changed in Settings
const getAiClient = () => {
  const storedKey = localStorage.getItem('gemini_api_key');
  return new GoogleGenAI({ apiKey: storedKey || process.env.API_KEY });
};

const modelFlash = 'gemini-2.5-flash';
const modelImagen = 'imagen-4.0-generate-001';
const modelVision = 'gemini-3-pro-preview';
const modelChat = 'gemini-3-pro-preview';

// 0. Test API Connection
export const testApiKey = async (): Promise<boolean> => {
  const ai = getAiClient();
  try {
    await ai.models.generateContent({
      model: modelFlash,
      contents: "Test connection.",
    });
    return true;
  } catch (error) {
    console.error("API Test Failed:", error);
    return false;
  }
};

// 1. AI Store Creator Service
export const generateStoreProfile = async (businessName: string, businessType: string): Promise<Partial<Business>> => {
  const ai = getAiClient();
  const prompt = `Create a realistic business profile for a store in Trinidad & Tobago named "${businessName}" which is a "${businessType}".
  Include a catchy description, 3-4 relevant products with prices in TTD (Trinidad and Tobago Dollars), and typical operating hours.
  Ensure the tone is local and welcoming.`;

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING },
            hours: { type: Type.STRING },
            products: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  price: { type: Type.NUMBER },
                  description: { type: Type.STRING }
                }
              }
            }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No data returned from AI");
  } catch (error) {
    console.error("Error generating store:", error);
    throw error;
  }
};

// 2. Maps Grounding Service
export const findLocalBusinesses = async (query: string, userLat?: number, userLng?: number): Promise<{ text: string; chunks: any[] }> => {
  const ai = getAiClient();
  const locationContext = userLat && userLng
    ? `The user is located at lat: ${userLat}, lng: ${userLng}. Prioritize results nearby.`
    : 'Focus on Trinidad and Tobago.';

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: `Find local businesses matching this query: "${query}". ${locationContext}. List them with details.`,
      config: {
        tools: [{ googleMaps: {} }],
        toolConfig: userLat && userLng ? {
          retrievalConfig: {
            latLng: {
              latitude: userLat,
              longitude: userLng
            }
          }
        } : undefined
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text: response.text || "No results found.",
      chunks: chunks
    };
  } catch (error) {
    console.error("Error searching businesses:", error);
    return { text: "Error searching for businesses. Please try again.", chunks: [] };
  }
};

// 3. AI Product Description Generator
export const generateProductDescription = async (productName: string, price: number): Promise<string> => {
  const ai = getAiClient();
  const prompt = `Write a short, catchy, and appetizing description (under 30 words) for a product named "${productName}" costing TT$${price}. The product is sold in a store in Trinidad & Tobago. Capture the local vibe if appropriate.`;

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
    });

    return response.text?.trim() || "";
  } catch (error) {
    console.error("Error generating description:", error);
    throw error;
  }
};

// 4. AI Image Generator for Products
export const generateProductImage = async (productName: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: modelImagen,
      prompt: `Professional commercial product photography of ${productName}, white background, studio lighting, high resolution, appetizing or sleek.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No image generated");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

// 4b. AI Logo Generator
export const generateStoreLogo = async (storeName: string, storeType: string): Promise<string> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateImages({
      model: modelImagen,
      prompt: `A modern, professional, vector-style logo for a business named "${storeName}" which is a "${storeType}". Minimalist, clean lines, suitable for a website header. White background.`,
      config: {
        numberOfImages: 1,
        outputMimeType: 'image/jpeg',
        aspectRatio: '1:1',
      },
    });

    const base64ImageBytes = response.generatedImages?.[0]?.image?.imageBytes;
    if (base64ImageBytes) {
      return `data:image/jpeg;base64,${base64ImageBytes}`;
    }
    throw new Error("No logo generated");
  } catch (error) {
    console.error("Error generating logo:", error);
    throw error;
  }
};

// 5. Vision AI (Product Analysis)
export const analyzeProductPhoto = async (base64Data: string): Promise<{ name: string; price: number; description: string }> => {
  const ai = getAiClient();
  const cleanBase64 = base64Data.split(',')[1] || base64Data;

  try {
    const response = await ai.models.generateContent({
      model: modelVision,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `Analyze this product image and extract the following details in JSON format:
            1. "name": The likely product name (read the label or identify the item).
            2. "price": The price if visible on a tag (number only). If not visible, estimate a realistic price in Trinidad & Tobago Dollars (TTD) for this type of item.
            3. "description": A short, attractive description of the visual appearance and potential ingredients/features.`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            price: { type: Type.NUMBER },
            description: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No analysis returned");
  } catch (error) {
    console.error("Vision AI error:", error);
    throw error;
  }
};

// 5b. AI Business Verification (Document Scan)
export const verifyBusinessDocument = async (base64Data: string, businessName: string): Promise<{ match: boolean; confidence: number; analysis: string }> => {
  const ai = getAiClient();
  const cleanBase64 = base64Data.split(',')[1] || base64Data;

  try {
    const response = await ai.models.generateContent({
      model: modelVision,
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64
            }
          },
          {
            text: `You are a strict Compliance Officer. Analyze this business document (Certificate of Registration, Tax ID, or Utility Bill).
            
            Task:
            1. Extract the Business Name and date.
            2. Compare the extracted name to the profile name: "${businessName}".
            3. Check if the document looks official and valid.
            
            Return JSON:
            {
              "match": boolean (true if the name matches significantly),
              "confidence": number (0-100 score of legitimacy),
              "analysis": string (Brief explanation of findings, e.g. "Name matches exactly, document date is current.")
            }`
          }
        ]
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            match: { type: Type.BOOLEAN },
            confidence: { type: Type.NUMBER },
            analysis: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No verification data returned");
  } catch (error) {
    console.error("Verification error:", error);
    throw error;
  }
};


// 6. Search Grounding
export const searchMarketTrends = async (query: string): Promise<{ text: string; chunks: any[] }> => {
  const ai = getAiClient();
  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: `Research the following topic specifically for the Trinidad and Tobago business context: "${query}". Provide a concise summary of current trends, news, prices, or relevant business information.`,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const chunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];

    return {
      text: response.text || "No insights found.",
      chunks: chunks
    };
  } catch (error) {
    console.error("Error searching trends:", error);
    throw error;
  }
};

// 7. Platform Chatbot (TriniBot)
export const chatWithTriniBot = async (message: string, history: any[]): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: modelChat,
    config: {
      systemInstruction: `You are TriniBot, the helpful AI assistant for TriniBuild, built for the people of Trinidad & Tobago.
      
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
      
      If you don't know something, say: "Hold strain, let me check that for you" or "Nah, I not too sure about that one."`,
    },
    history: history
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text || "Aye, the internet acting up a lil bit. Try again just now.";
  } catch (error) {
    console.error("Chat error:", error);
    return "Small technical difficulty here family. Give me a minute.";
  }
};

// 8. Vendor Business Chatbot (MyStore Bot)
export const chatWithVendorBot = async (message: string, history: any[], storeContext: any): Promise<string> => {
  const ai = getAiClient();

  const productsList = storeContext.products.map((p: any) => `${p.name} ($${p.price})`).join(', ');

  const chat = ai.chats.create({
    model: modelChat,
    config: {
      systemInstruction: `You are the customer service agent for ${storeContext.name}, a local business in Trinidad & Tobago.
      
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
      
      Be polite, helpful, and make the customer feel like family.`,
    },
    history: history
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text || "I not hearing you too clear. Say that again?";
  } catch (error) {
    console.error("Vendor chat error:", error);
    return "System having a lil hiccup. Try again nuh.";
  }
};

// 9. AI Blog Generator
export const generateBlogPost = async (topic: string, keywords: string): Promise<{ title: string; content: string; excerpt: string }> => {
  const ai = getAiClient();
  const prompt = `Write a SEO-optimized blog post for the TriniBuild platform.
  Topic: "${topic}"
  Target Keywords: "${keywords}"
  Context: Trinidad & Tobago market.
  
  Return JSON with:
  - "title": Engaging headline.
  - "excerpt": 2 sentence summary.
  - "content": Full HTML article (approx 400 words) with <h2> headers, bullet points, and a call to action for TriniBuild.`;

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            excerpt: { type: Type.STRING },
            content: { type: Type.STRING }
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text);
    }
    throw new Error("No blog content generated");
  } catch (error) {
    console.error("Blog Gen Error:", error);
    throw error;
  }
};

// 10. AI Legal Contract Generator (DocuSign)
export const generatePromoterContract = async (promoterName: string, businessName: string): Promise<string> => {
  const ai = getAiClient();
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

  try {
    const response = await ai.models.generateContent({
      model: modelFlash,
      contents: prompt,
    });

    return response.text || "Error creating contract.";
  } catch (error) {
    console.error("Contract Gen Error:", error);
    return "Standard Agreement: 2 Years Exclusivity at 6% Fee Rate.";
  }
};

// 11. Real Estate AI Agent
export const chatWithRealEstateBot = async (message: string, history: any[]): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: modelChat,
    config: {
      systemInstruction: `You are the TriniBuild Real Estate Assistant, a knowledgeable property expert for Trinidad & Tobago.
      
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
      
      If asked about specific listings, guide them to use the search filters or say you can help them refine their search criteria.`,
    },
    history: history
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text || "I'm having trouble connecting to the property database. Try again in a moment.";
  } catch (error) {
    console.error("Real Estate Chat Error:", error);
    return "Sorry, I'm experiencing a technical issue. Please try again.";
  }
};

// 12. Service Expert AI Agent
export const chatWithServiceBot = async (message: string, history: any[]): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: modelChat,
    config: {
      systemInstruction: `You are the TriniBuild Service Expert, a helpful assistant for finding home service professionals in Trinidad & Tobago.
      
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
      
      If asked for specific pros, guide them to use the search categories on the page.`,
    },
    history: history
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text || "I'm having trouble connecting to the service network. Try again in a moment.";
  } catch (error) {
    console.error("Service Chat Error:", error);
    return "Sorry, I'm experiencing a technical issue. Please try again.";
  }
};

// 13. Rideshare AI Agent
export const chatWithRidesBot = async (message: string, history: any[]): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: modelChat,
    config: {
      systemInstruction: `You are the TriniBuild Go Assistant, a helpful travel companion for Trinidad & Tobago.
      
      **Identity:**
      - You are street-smart, know the routes, and helpful.
      - You know about: Traffic hotspots (Lighthouse, UbH), best times to travel, and safety tips.
      
      **Goal:**
      - Help users book a ride (guide them to the form).
      - Estimate travel times (e.g., "POS to Sando is about 45 mins right now").
      - Explain the difference between services (TriniRide vs H-Taxi vs Courier).
      
      **Tone:**
      - "We reaching just now" attitude. Efficient but friendly.
      
      If they want to book, tell them: "Just enter your pickup and dropoff in the box on the left, and we go sort you out."`,
    },
    history: history
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text || "Signal lil bad, say that again?";
  } catch (error) {
    console.error("Rides Chat Error:", error);
    return "Sorry, connection dropped. Try again.";
  }
};

// 14. Paperwork & Visa AI Agent
export const chatWithPaperworkBot = async (message: string, history: any[]): Promise<string> => {
  const ai = getAiClient();
  const chat = ai.chats.create({
    model: modelChat,
    config: {
      systemInstruction: `You are the TriniBuild Paperwork Assistant, a specialized expert in banking compliance and visa documentation for Trinidad & Tobago citizens.

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
      
      If they ask how to start, tell them: "Sign up, start selling, and when you're ready, click the 'Documents' tab in your dashboard to download your papers instantly."`,
    },
    history: history
  });

  try {
    const response = await chat.sendMessage({ message });
    return response.text || "I'm having trouble accessing the regulation database. Please try again.";
  } catch (error) {
    console.error("Paperwork Chat Error:", error);
    return "Sorry, I'm experiencing a technical issue. Please try again.";
  }
};
