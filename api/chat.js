export default async function handler(req, res) {
  // Set CORS headers so it works locally and on Vercel
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { message, history } = req.body;
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'Gemini API key is not configured on Vercel environment variables' });
  }

  const systemPrompt = `You are Yuva's Assistant, a helpful and professional AI coordinator for Yuva's motion design studio.

Your tone:
- Friendly, humble, and directly helpful.
- Avoid bragging or overselling (do not say "Yuva is the top/best"). Focus on how we can serve the client.
- Speak in short, simple sentences. Keep answers brief (typically 2-3 short sentences) so they are readable in a small mobile chat widget. Use more sentences only if the client asks for specific details.

Your main goals:
1. Greet visitors and explain what Yuva does (custom motion design, SaaS animations, logo animations).
2. Provide details about the three pricing packages:
   - Regular ($300): 5s logo animation, custom vector styling, 3 revisions.
   - Standard ($950): 60s SaaS explainer, scripting, layouts, voiceover, sound design.
   - Premium ($1,800): 90s launch explainer, vertical format (9:16) for socials, priority support.
3. Guide clients who want custom work to the brief builder at: /order.html.
4. Provide Yuva's contact email if they ask to talk directly: yuvasukuna09@gmail.com.
5. Answer questions about workflow (scripting -> custom layouts -> voiceover & sound -> animation -> delivery).
6. Never make up details, packages, or pricing.`;

  try {
    // Format conversation history with system instructions at the very beginning
    const formattedHistory = [];
    
    // Add the system prompt as the first message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: `System Instructions:\n${systemPrompt}` }]
    });
    // Add a mock model acknowledgement to keep role alternating
    formattedHistory.push({
      role: 'model',
      parts: [{ text: "Understood. I am Yuva's Assistant. I will help the user according to these instructions." }]
    });

    // Append the actual history
    (history || []).map(item => ({
      role: item.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: item.text }]
    })).forEach(item => formattedHistory.push(item));

    // Append the current message
    formattedHistory.push({
      role: 'user',
      parts: [{ text: message }]
    });

    // Use the secure, Google-standard x-goog-api-key header for all keys
    const headers = {
      'Content-Type': 'application/json',
      'x-goog-api-key': apiKey
    };

    // Diagnostic log: List available models to Vercel console
    try {
      const modelsResponse = await fetch(`https://generativelanguage.googleapis.com/v1/models`, {
        headers: { 'x-goog-api-key': apiKey }
      });
      const modelsData = await modelsResponse.json();
      console.log('Available Models for this API Key:', JSON.stringify(modelsData));
    } catch (e) {
      console.error('Failed to list models:', e);
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-3.1-flash-lite:generateContent`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        contents: formattedHistory,
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 300
        }
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Gemini API Error Response:', data);
      return res.status(response.status).json({ error: data.error?.message || 'Error calling Gemini API' });
    }

    const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || "I'm sorry, I couldn't process that response.";
    return res.status(200).json({ reply });

  } catch (error) {
    console.error('Serverless Chat Endpoint Error:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}
