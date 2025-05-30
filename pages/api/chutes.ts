import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const { messages, model } = req.body;
  if (!messages || !model) {
    res.status(400).json({ error: 'Messages and model are required' });
    return;
  }

  try {
    const apiKey = process.env.CHUTES_API_KEY || 'cpk_ed4118b93283415581ce5204721bd861.429d755b1300581582cc392083a49856.8h5PsYWKyHyj1D1QneemTMBwZKFNKUQy';
    
    console.log('Making API request to chutes.com with model:', model);
    
    const apiRes = await fetch('https://llm.chutes.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    console.log('API response status:', apiRes.status);

    if (!apiRes.ok) {
      const text = await apiRes.text();
      console.error('API error response:', text);
      res.status(apiRes.status).json({ error: text });
      return;
    }

    const data = await apiRes.json();
    console.log('API response data:', data);
    
    if (!data.choices || !data.choices[0] || !data.choices[0].message) {
      console.error('Unexpected API response structure:', data);
      res.status(500).json({ error: 'Unexpected API response structure' });
      return;
    }
    
    const reply = data.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    console.error('API request failed:', error);
    res.status(500).json({ error: 'Internal Server Error: ' + error.message });
  }
}
