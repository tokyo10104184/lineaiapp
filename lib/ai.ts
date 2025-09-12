import { ChutesApiRequestBody } from './types'; // Assuming this type exists and is relevant

// This function encapsulates the logic for calling the OpenRouter API.
export async function getAiResponse(payload: ChutesApiRequestBody): Promise<string> {
  const { messages, model, temperature = 0.7 } = payload;

  if (!messages || !model) {
    throw new Error('messages and model are required for AI call');
  }

  // These headers are recommended by OpenRouter for identifying traffic.
  const siteUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
  const siteName = "Kint";

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
    console.error("Error during AI API call:", error);
    // Re-throw the error to be handled by the calling API route
    throw error;
  }
}
