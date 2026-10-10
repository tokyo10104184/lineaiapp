import { ChutesApiRequestBody } from './types'; // Assuming this type exists and is relevant

export function normalizeMessages(messages: Array<{ role: string; content: any; [key: string]: any }>) {
  if (!messages || messages.length === 0) return messages;

  const systemContents: string[] = [];
  const nonSystemMessages: typeof messages = [];

  for (const msg of messages) {
    if (msg.role === 'system') {
      const textContent = typeof msg.content === 'string' ? msg.content.trim() : extractTextContent(msg.content).trim();
      if (textContent) {
        systemContents.push(textContent);
      }
    } else {
      nonSystemMessages.push(msg);
    }
  }

  const normalized: typeof messages = [];
  if (systemContents.length > 0) {
    normalized.push({
      role: 'system',
      content: systemContents.join('\n\n'),
    });
  }

  normalized.push(...nonSystemMessages);
  return normalized;
}

// Helper to get raw Response object (for streaming or non-streaming)
export async function getAiResponseRaw(payload: ChutesApiRequestBody, stream: boolean = false): Promise<Response> {
  const { messages: rawMessages, model, temperature = 0.7, provider, cloudflareAccountId } = payload;

  if (!rawMessages || !model) {
    throw new Error('messages and model are required for AI call');
  }

  const messages = normalizeMessages(rawMessages);

  const selectedProvider = provider || (model.toLowerCase().startsWith('gemini') ? 'gemini' : 'openrouter');

  if (selectedProvider === 'gemini') {
    const apiKey = payload.apiKey || process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY;
    if (!apiKey) {
      throw new Error("Gemini APIキーが設定されていません。設定画面からGemini APIキーを入力してください。");
    }

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
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Gemini API Error:", response.status, errorText);
      throw new Error(`Gemini API error: ${errorText}`);
    }

    return response;
  } else if (selectedProvider === 'groq') {
    const apiKey = payload.apiKey || process.env.GROQ_API_KEY;
    if (!apiKey) {
      throw new Error("Groq APIキーが設定されていません。設定画面からGroq APIキーを入力してください。");
    }

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
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API Error:", response.status, errorText);
      throw new Error(`Groq API error: ${errorText}`);
    }

    return response;
  } else if (selectedProvider === 'cloudflare') {
    const apiKey = payload.apiKey || process.env.CLOUDFLARE_API_TOKEN;
    const accountId = cloudflareAccountId || process.env.CLOUDFLARE_ACCOUNT_ID;

    if (!apiKey) {
      throw new Error("Cloudflare APIトークンが設定されていません。設定画面からCloudflare APIトークンを入力してください。");
    }
    if (!accountId) {
      throw new Error("Cloudflare Account IDが設定されていません。設定画面からCloudflare Account IDを入力してください。");
    }

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
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Cloudflare Workers AI Error:", response.status, errorText);
      throw new Error(`Cloudflare Workers AI error: ${errorText}`);
    }

    return response;
  } else {
    const apiKey = payload.apiKey || process.env.OPENROUTER_API_KEY;
    if (!apiKey) {
      throw new Error("OpenRouter APIキー (OPENROUTER_API_KEY) が設定されていません。");
    }

    const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
    const siteName = "Kint";

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
        stream: stream,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("OpenRouter API Error:", response.status, errorText);
      throw new Error(`OpenRouter API error: ${errorText}`);
    }

    return response;
  }
}

function extractTextContent(content: any): string {
  if (typeof content === 'string') {
    return content;
  }
  if (Array.isArray(content)) {
    return content
      .map((part: any) => {
        if (typeof part === 'string') return part;
        if (part && typeof part === 'object') {
          return part.text || part.content || part.value || '';
        }
        return '';
      })
      .join('');
  }
  if (content && typeof content === 'object') {
    return content.text || content.content || content.value || '';
  }
  return '';
}

// This function encapsulates the logic for calling AI APIs (OpenRouter / Gemini / Groq / Cloudflare).
export async function getAiResponse(payload: ChutesApiRequestBody): Promise<string> {
  const response = await getAiResponseRaw(payload, false);
  const data = await response.json();

  if (data.error) {
    const errMsg = typeof data.error === 'string' ? data.error : data.error.message || JSON.stringify(data.error);
    console.error("API error in payload:", data.error);
    throw new Error(`API error: ${errMsg}`);
  }

  const choice = data.choices?.[0];
  const candidate = data.candidates?.[0];
  const result = data.result;

  const rawContent =
    choice?.message?.content ??
    choice?.message?.reasoning ??
    choice?.message?.reasoning_content ??
    choice?.text ??
    result?.response ??
    result?.choices?.[0]?.message?.content ??
    candidate?.content?.parts?.[0]?.text ??
    data.output ??
    data.response ??
    data.text;

  const reply = extractTextContent(rawContent).trim();

  if (!reply) {
    console.error("No reply from API:", JSON.stringify(data));
    if (choice?.finish_reason) {
      throw new Error(`API returned empty response (finish_reason: ${choice.finish_reason}).`);
    }
    throw new Error("No reply from API.");
  }

  return reply;
}
