import type { NextApiRequest, NextApiResponse } from 'next';
import { getAiResponse } from '../../lib/ai';
import { ChutesApiRequestBody } from '../../lib/types';

const EDIT_MESSAGE_SYSTEM_PROMPT = `You are an AI assistant that rewrites AI-generated chat messages according to the user's specific instructions.
Your goal is to modify the provided message while preserving the persona and roleplay character context if available.

Rules:
1. Output ONLY the rewritten message text.
2. Do NOT add any extra conversational commentary, preambles, greetings, or explanation (e.g. "Here is the rewritten message:").
3. Preserve the language (Japanese unless instructed otherwise) and character tone unless the instruction asks to change it.
4. Clean any thinking tags (<think>...</think>) if present.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { currentText, instruction, characterName, systemPrompt, model, provider, apiKey, cloudflareAccountId } = req.body as {
    currentText?: string;
    instruction?: string;
    characterName?: string;
    systemPrompt?: string;
    model?: string;
    provider?: 'openrouter' | 'gemini' | 'groq' | 'cloudflare';
    apiKey?: string;
    cloudflareAccountId?: string;
  };

  if (!currentText || !instruction || !model) {
    return res.status(400).json({ error: 'Missing currentText, instruction, or model in request body' });
  }

  try {
    let contextPrompt = '';
    if (characterName) {
      contextPrompt += `Character Name: ${characterName}\n`;
    }
    if (systemPrompt) {
      contextPrompt += `Character System Prompt / Persona:\n${systemPrompt}\n\n`;
    }

    const userPrompt = `${contextPrompt}Original AI Message:
${currentText}

User Instruction for Rewriting:
${instruction}

Please rewrite the original AI message according to the instruction, outputting ONLY the final rewritten text.`;

    const aiPayload: ChutesApiRequestBody = {
      model,
      messages: [
        { role: 'system', content: EDIT_MESSAGE_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      useCensorship: false,
      provider,
      apiKey,
      cloudflareAccountId,
    };

    const reply = await getAiResponse(aiPayload);

    let cleanReply = reply.trim();
    // Clean markdown code blocks if the model wrapped it
    if (cleanReply.startsWith('```')) {
      cleanReply = cleanReply.replace(/^```(?:[a-zA-Z]+)?\n?/, '').replace(/\n?```$/, '').trim();
    }

    return res.status(200).json({ editedText: cleanReply });
  } catch (error: any) {
    console.error('Error in /api/ai-edit-message:', error);
    return res.status(500).json({ error: error.message || 'AIによるメッセージ編集の生成に失敗しました。' });
  }
}
