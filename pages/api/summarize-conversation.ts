import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../lib/supabaseServer';
import { getAiResponse } from '../../lib/ai';
import { Message } from '../../lib/types';

const SUMMARIZE_SYSTEM_PROMPT = `You are a memory summarization AI. Your task is to read a conversation between an AI character and a user, and then extract key memories from the AI's perspective.
Focus on important facts about the user (likes, dislikes, personal details), significant shared moments, and promises made.
The output should be a concise, bulleted list, starting each line with '- '.
Example output:
- ユーザーは猫を飼っていて、名前はタマ。
- 先週末、一緒に映画を見に行った。
- ユーザーは辛い食べ物が好き。

Output ONLY the bulleted list. Do not include any other text, greetings, or explanations.`;

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { messages, model, character_id } = req.body as { messages: Message[], model: string, character_id: string };

  if (!messages || messages.length === 0 || !model || !character_id) {
    return res.status(400).json({ error: 'Missing messages, model, or character_id in request body' });
  }

  try {
    // 1. Format the conversation for the AI
    const conversationText = messages
      .map(msg => `${msg.sender === 'user' ? 'User' : 'Character'}: ${msg.text}`)
      .join('\n');

    const userMessage = `Please summarize the following conversation:\n\n${conversationText}`;

    const aiPayload = {
      model: model,
      messages: [
        { role: 'system', content: SUMMARIZE_SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      temperature: 0.5,
    };

    // 2. Get the summary from the AI
    const summary = await getAiResponse(aiPayload);

    // 3. Save the summary to the database
    const memoryData = {
      user_id: user.id,
      character_id: character_id,
      memory_summary: summary,
    };

    const { error: upsertError } = await supabase
      .from('character_memories')
      .upsert(memoryData, { onConflict: 'user_id, character_id' });

    if (upsertError) {
      console.error('Error saving memory to DB:', upsertError);
      throw upsertError;
    }

    res.status(200).json({ summary });

  } catch (error: any) {
    console.error('Error in /api/summarize-conversation:', error);
    res.status(500).json({ error: error.message });
  }
}
