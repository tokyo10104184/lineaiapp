import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const { message, personality } = req.body;

  // We'll use a placeholder for the site URL and name.
  // In a real-world scenario, you'd replace these with your actual site URL and name.
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
        model: "openrouter/sonoma-sky-alpha", // or "openrouter/sonoma-dusk-alpha"
        messages: [
          { role: "system", content: `あなたは「${personality}」という性格のチャットボットです。フレンドリーで親切に、そのキャラクターになりきって応答してください。` },
          { role: "user", content: message },
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      return res.status(response.status).json({ error: "APIエラーが発生しました。" });
    }

    const data = await response.json();
    const reply = data.choices[0]?.message?.content;

    if (!reply) {
      console.error("APIから返信がありません:", data);
      return res.status(500).json({ error: "APIから返信がありませんでした。" });
    }

    res.status(200).json({ response: reply });

  } catch (error) {
    console.error("API呼び出し中のエラー:", error);
    res.status(500).json({ error: "内部サーバーエラーが発生しました。" });
  }
}
