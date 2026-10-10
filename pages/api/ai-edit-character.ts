import type { NextApiRequest, NextApiResponse } from 'next';
import { getAiResponse } from '../../lib/ai';
import { Character, ChutesApiRequestBody } from '../../lib/types';

const EDIT_CHARACTER_SYSTEM_PROMPT = `You are an expert character setting editor for AI chat applications.
Your task is to modify and refine an existing character's settings (name, description, systemPrompt) based on user instructions.

You MUST respond ONLY with a valid JSON object with the following structure:
{
  "name": "Updated character name",
  "description": "Updated character description",
  "systemPrompt": "Updated system prompt for the character"
}

Rules:
- Output ONLY the raw JSON object. Do not wrap in markdown code blocks (\`\`\`json ... \`\`\`), do not include greetings or extra text.
- Maintain the character's core identity unless the instruction explicitly asks to change it.
- Ensure the name, description, and system prompt are written in natural Japanese unless requested otherwise.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { character, instruction, model, provider, apiKey, cloudflareAccountId } = req.body as {
    character?: Character;
    instruction?: string;
    model?: string;
    provider?: 'openrouter' | 'gemini' | 'groq' | 'cloudflare';
    apiKey?: string;
    cloudflareAccountId?: string;
  };

  if (!character || !instruction || !model) {
    return res.status(400).json({ error: 'Missing character, instruction, or model in request body' });
  }

  try {
    const userPrompt = `現在のキャラクター設定:
- 名前: ${character.name || ''}
- 説明: ${character.description || ''}
- システムプロンプト: ${character.systemPrompt || ''}

編集指示:
${instruction}

上記の編集指示に従ってキャラクター設定を更新し、指定されたJSON形式のみで出力してください。`;

    const aiPayload: ChutesApiRequestBody = {
      model,
      messages: [
        { role: 'system', content: EDIT_CHARACTER_SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      useCensorship: false,
      provider,
      apiKey,
      cloudflareAccountId,
    };

    const reply = await getAiResponse(aiPayload);

    let jsonString = typeof reply === 'string' ? reply.trim() : String(reply).trim();

    // Remove internal reasoning tags if present
    jsonString = jsonString.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

    // Strip markdown code block wrappers
    if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim();
    }

    // Extract JSON object match
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }

    let updatedFields: any;
    try {
      updatedFields = JSON.parse(jsonString);
    } catch (parseErr) {
      console.error('Failed to parse JSON from AI response:', reply);
      throw new Error('AIからの返答をJSONとして解析できませんでした。');
    }

    const proposedCharacter: Character = {
      ...character,
      name: updatedFields.name ?? character.name,
      description: updatedFields.description ?? character.description,
      systemPrompt: updatedFields.systemPrompt ?? character.systemPrompt,
    };

    return res.status(200).json(proposedCharacter);
  } catch (error: any) {
    console.error('Error in /api/ai-edit-character:', error);
    return res.status(500).json({ error: error.message || 'AIによる編集提案の生成に失敗しました。' });
  }
}
