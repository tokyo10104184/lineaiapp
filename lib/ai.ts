import { ChutesApiRequestBody } from './types'; // Assuming this type exists and is relevant

// This function encapsulates the logic for calling AI APIs (OpenRouter / Gemini).
export async function getAiResponse(payload: ChutesApiRequestBody): Promise<string> {
  const { messages, model, temperature = 0.7, provider, cloudflareAccountId } = payload;

  if (!messages || !model) {
    throw new Error('messages and model are required for AI call');
  }

  const selectedProvider = provider || (model.toLowerCase().startsWith('gemini') ? 'gemini' : 'openrouter');

  if (selectedProvider === 'gemini') {
    const apiKey = payload.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini APIキーが設定されていません。設定画面からGemini APIキーを入力してください。");
    }

    try {
      const response = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Gemini API Error:", response.status, errorText);
        throw new Error(`Gemini API error: ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content;

      if (!reply) {
        console.error("No reply from Gemini API:", data);
        throw new Error("No reply from Gemini API.");
      }

      return reply;
    } catch (error) {
      console.error("Error during Gemini API call:", error);
      throw error;
    }
  } else if (selectedProvider === 'groq') {
    const apiKey = payload.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq APIキーが設定されていません。設定画面からGroq APIキーを入力してください。");
    }

    try {
      const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Groq API Error:", response.status, errorText);
        throw new Error(`Groq API error: ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content;

      if (!reply) {
        console.error("No reply from Groq API:", data);
        throw new Error("No reply from Groq API.");
      }

      return reply;
    } catch (error) {
      console.error("Error during Groq API call:", error);
      throw error;
    }
  } else if (selectedProvider === 'cloudflare') {
    const apiKey = payload.apiKey || process.env.CLOUDFLARE_API_TOKEN;
    const accountId = cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiKey) {
      throw new Error("Cloudflare APIトークンが設定されていません。設定画面からCloudflare APIトークンを入力してください。");
    }
    if (!accountId) {
      throw new Error("Cloudflare Account IDが設定されていません。設定画面からCloudflare Account IDを入力してください。");
    }

    try {
      const response = await fetch(`https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Cloudflare Workers AI Error:", response.status, errorText);
        throw new Error(`Cloudflare Workers AI error: ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices?.[0]?.message?.content || data.result?.response || data.result?.choices?.[0]?.message?.content;

      if (!reply) {
        console.error("No reply from Cloudflare Workers AI:", data);
        throw new Error("No reply from Cloudflare Workers AI.");
      }

      return reply;
    } catch (error) {
      console.error("Error during Cloudflare Workers AI call:", error);
      throw error;
    }
  } else {
    const apiKey = process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter APIキー (OPENROUTER_API_KEY) が設定されていません。");
    }

    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const siteName = "Kint";

    try {
      const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${apiKey}`,
          "HTTP-Referer": siteUrl,
          "X-Title": siteName,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: model,
          messages: messages,
          temperature: temperature,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("OpenRouter API Error:", response.status, errorText);
        throw new Error(`OpenRouter API error: ${errorText}`);
      }

      const data = await response.json();
      const reply = data.choices[0]?.message?.content;

      if (!reply) {
        console.error("No reply from OpenRouter API:", data);
        throw new Error("No reply from OpenRouter API.");
      }

      return reply;
    } catch (error) {
      console.error("Error during OpenRouter API call:", error);
      throw error;
    }
  }
}
