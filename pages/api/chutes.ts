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
    const apiRes = await fetch('https://llm.chutes.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${process.env.CHUTES_API_KEY}`,
      },
      body: JSON.stringify({
        model,
        messages,
      }),
    });

    if (!apiRes.ok) {
      const text = await apiRes.text();
      res.status(apiRes.status).json({ error: text });
      return;
    }

    const data = await apiRes.json();
    const reply = data.choices[0].message.content;

    res.status(200).json({ reply });
  } catch (error) {
    res.status(500).json({ error: 'Internal Server Error' });
  }
}
