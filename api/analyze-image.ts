import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { imageUrl } = req.body;

    if (!imageUrl) {
      return res.status(400).json({ error: 'imageUrl is required' });
    }

    const apiKey = process.env.VITE_GEMINI_API_KEY;

    if (!apiKey) {
      console.error('VITE_GEMINI_API_KEY not found in environment');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling Gemini with image:', imageUrl);

    // First, fetch the image as base64
    const imageResponse = await fetch(imageUrl);
    const imageBuffer = await imageResponse.arrayBuffer();
    const base64Image = Buffer.from(imageBuffer).toString('base64');

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: 'Analyze this product image and provide: 1) Product name/title, 2) Brief description (2-3 sentences), 3) Suggested category. Return as JSON with keys: title, description, category.'
                },
                {
                  inline_data: {
                    mime_type: 'image/jpeg',
                    data: base64Image
                  }
                }
              ]
            }
          ]
        })
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'Gemini API error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('Gemini response:', data);

    const analysis = data.candidates?.[0]?.content?.parts?.[0]?.text || 'No response';

    return res.status(200).json({
      success: true,
      analysis: analysis
    });

  } catch (error: any) {
    console.error('Error in analyze-image:', error);
    return res.status(500).json({
      error: 'Internal server error',
      message: error.message
    });
  }
}
