import type { NextApiRequest, NextApiResponse } from 'next';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method Not Allowed' });
    return;
  }

  const { messages, model, temperature = 0.7, useCensorship, imageDataUrl } = req.body;

  if (!messages || !model) {
    return res.status(400).json({ error: 'messages and model are required' });
  }

  const siteUrl = "http://localhost:3000";
  const siteName = "My Chat App";

  try {
    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
        "HTTP-Referer": siteUrl,
        "X-Title": siteName,
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        temperature: temperature,
        // OpenRouter doesn't have a direct 'useCensorship' param,
        // but some models might be moderated by default.
        // We are not passing this to the API.
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return res.status(response.status).json({ error: `APIエラーが発生しました: ${errorText}` });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;

    if (!reply) {
      console.error("APIから返信がありません:", data);
      return res.status(500).json({ error: "APIから返信がありませんでした。" });
    }
    
    // The frontend expects a 'reply' property
    res.status(200).json({ reply: reply });

  } catch (error) {
    console.error("API呼び出し中のエラー:", error);
    res.status(500).json({ error: "内部サーバーエラーが発生しました。" });
  }
}
