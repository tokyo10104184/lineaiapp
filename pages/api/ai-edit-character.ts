import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../lib/supabaseServer';
import { Character } from '../../lib/types';

const AI_EDIT_SYSTEM_PROMPT = `You are an expert character designer. Your task is to modify a character's profile based on a user's request.
You will be given a JSON object representing the current character and a text instruction for the modification.
Your goal is to intelligently update the 'name', 'description', and 'systemPrompt' fields of the character to reflect the user's request.
You can also update the 'icon' and 'color' if it fits the new character concept.
Keep the other fields ('id', 'public_id', 'activeHours', 'useActiveHours', 'isPublic', 'gauges', 'useGauges') as they are.
IMPORTANT: You MUST output ONLY the complete, modified JSON object of the character. Do not include any explanations, apologies, or surrounding text. The output must be parsable as a single JSON object.`;


export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    const supabase = createSupabaseServerClient(req, res);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized' });
    }

    const { character, instruction, model } = req.body as { character: Character, instruction: string, model: string };

    if (!character || !instruction || !model) {
        return res.status(400).json({ error: 'Missing character, instruction, or model in request body' });
    }

    try {
        const userMessage = `Here is the current character JSON:
${JSON.stringify(character, null, 2)}

Here is my request:
"${instruction}"

Please provide the complete modified JSON object.`;

        // Re-using the /api/chutes endpoint for the actual AI call
        const chutesRequestBody = {
            model: model,
            messages: [
                { role: 'system', content: AI_EDIT_SYSTEM_PROMPT },
                { role: 'user', content: userMessage },
            ],
            temperature: 0.7,
            useCensorship: false,
        };

        const vercel_url = process.env.VERCEL_URL
        const protocol = vercel_url?.includes('localhost') ? 'http' : 'https'
        const baseUrl = vercel_url ? `${protocol}://${vercel_url}` : 'http://localhost:3000'

        const response = await fetch(`${baseUrl}/api/chutes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                // We might need to forward the auth token if chutes requires it, but let's assume not for now.
            },
            body: JSON.stringify(chutesRequestBody),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error from /api/chutes:', errorText);
            return res.status(response.status).json({ error: `Failed to get response from AI model. Details: ${errorText}` });
        }

        const aiResponse = await response.json();
        let replyContent = aiResponse.reply;

        // Clean the response to get only the JSON part
        const jsonMatch = replyContent.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
            throw new Error('AI response did not contain a valid JSON object.');
        }

        const jsonString = jsonMatch[0];

        // Try to parse the JSON
        const modifiedCharacter = JSON.parse(jsonString);

        res.status(200).json(modifiedCharacter);

    } catch (error: any) {
        console.error('Error in /api/ai-edit-character:', error);
        res.status(500).json({ error: error.message });
    }
}
