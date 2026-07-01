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

  const systemPrompt = `You are Yuva's Assistant, a friendly and highly professional AI manager for YuvaSukuna (motion design studio).

Your main goals:
1. Greet visitors, explain Yuva's motion design work, and pitch his skills.
2. Provide details about the three pricing packages:
   - Regular (Logo & Details) - $300: 5s animation, custom vector styling, 3 revisions, source files.
   - Standard (SaaS Explainer) - $950: 60s explainer, scripting, layouts, voiceover, and sound design.
   - Premium (Full Launch Suite) - $1,800: 90s explainer, storytelling script, vertical format (9:16) for social channels, priority support.
3. If they want custom scopes, tell them to visit the Custom Brief Builder at: /order.html.
4. If they want to talk to Yuva directly, share his email: yuvasukuna09@gmail.com.
5. Answer questions about workflow (scripting -> custom layouts -> vector asset craft -> voiceover & sound -> delivery).
6. Be brief, keeping answers under 3 sentences unless asked for details, so they are readable in a small mobile chat widget. Never make up details or pricing.`;

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

    // Use standard query key for AIzaSy keys, and Authorization header for AQ. keys
    const isStandardKey = apiKey.startsWith('AIzaSy');
    const url = isStandardKey 
      ? `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`
      : `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent`;

    const headers = {
      'Content-Type': 'application/json'
    };
    if (!isStandardKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }

    const response = await fetch(url, {
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
