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

    const apiKey = process.env.VITE_OPENAI_API_KEY;

    if (!apiKey) {
      console.error('VITE_OPENAI_API_KEY not found in environment');
      return res.status(500).json({ error: 'API key not configured' });
    }

    console.log('Calling OpenAI with image:', imageUrl);

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this product image and provide: 1) Product name/title, 2) Brief description (2-3 sentences), 3) Suggested category. Return as JSON with keys: title, description, category.'
              },
              {
                type: 'image_url',
                image_url: { url: imageUrl }
              }
            ]
          }
        ],
        max_tokens: 300
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('OpenAI API error:', response.status, errorText);
      return res.status(response.status).json({
        error: 'OpenAI API error',
        details: errorText
      });
    }

    const data = await response.json();
    console.log('OpenAI response:', data);

    const analysis = data.choices?.[0]?.message?.content || 'No response';

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
