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

function parseAiCharacterJson(reply: string): any {
  if (!reply || typeof reply !== 'string') return null;
  let str = reply.trim();

  // 1. Remove internal reasoning / thinking tags
  str = str.replace(/<think>[\s\S]*?<\/think>/gi, '').trim();

  // 2. Extract from markdown code block if present
  const codeBlockMatch = str.match(/```(?:json)?\s*([\s\S]*?)\s*```/i);
  if (codeBlockMatch) {
    str = codeBlockMatch[1].trim();
  }

  // 3. Match outer JSON object
  const jsonObjectMatch = str.match(/\{[\s\S]*\}/);
  if (jsonObjectMatch) {
    str = jsonObjectMatch[0];
  }

  // Helper to attempt JSON parsing with minor cleanups
  function tryParse(s: string) {
    try {
      return JSON.parse(s);
    } catch (e) {
      try {
        // Fix trailing commas
        const fixed = s.replace(/,\s*([\}\]])/g, '$1');
        return JSON.parse(fixed);
      } catch (e2) {
        try {
          // Replace unescaped control characters (newlines/tabs) inside string literals
          let fixed = s.replace(/[\u0000-\u001F\u007F-\u009F]/g, (c) => {
            if (c === '\n') return '\\n';
            if (c === '\r') return '\\r';
            if (c === '\t') return '\\t';
            return '';
          });
          fixed = fixed.replace(/,\s*([\}\]])/g, '$1');
          return JSON.parse(fixed);
        } catch (e3) {
          return null;
        }
      }
    }
  }

  let parsed = tryParse(str);
  if (!parsed && str !== reply) {
    parsed = tryParse(reply);
  }
  if (parsed) return parsed;

  // Fallback: regex extraction for individual fields if strict parsing failed
  const getField = (fieldName: string) => {
    const patterns = [
      new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)"(?=\\s*,\\s*"|\\s*\\})`),
      new RegExp(`"${fieldName}"\\s*:\\s*"([\\s\\S]*?)"`),
      new RegExp(`${fieldName}\\s*:\\s*"([\\s\\S]*?)"`),
    ];
    for (const re of patterns) {
      const m = reply.match(re);
      if (m && m[1]) {
        return m[1].replace(/\\n/g, '\n').replace(/\\"/g, '"');
      }
    }
    return undefined;
  };

  const name = getField('name');
  const description = getField('description');
  const systemPrompt = getField('systemPrompt');

  if (name || description || systemPrompt) {
    return { name, description, systemPrompt };
  }

  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { character, instruction, model, provider, apiKey, cloudflareAccountId, expertPersonaPrompt } = req.body as {
    character?: Character;
    instruction?: string;
    model?: string;
    provider?: 'openrouter' | 'gemini' | 'groq' | 'cloudflare';
    apiKey?: string;
    cloudflareAccountId?: string;
    expertPersonaPrompt?: string;
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

    const systemPromptContent = expertPersonaPrompt
      ? `${expertPersonaPrompt}\n\n${EDIT_CHARACTER_SYSTEM_PROMPT}`
      : EDIT_CHARACTER_SYSTEM_PROMPT;

    const aiPayload: ChutesApiRequestBody = {
      model,
      messages: [
        { role: 'system', content: systemPromptContent },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.7,
      useCensorship: false,
      provider,
      apiKey,
      cloudflareAccountId,
    };

    const reply = await getAiResponse(aiPayload);

    const updatedFields = parseAiCharacterJson(reply);

    if (!updatedFields) {
      console.error('Failed to parse character JSON from AI response:', reply);
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
