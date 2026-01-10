import { createClient } from '@supabase/supabase-js';
import type { NextApiRequest, NextApiResponse } from 'next';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return res.status(500).json({ message: 'Supabase configuration missing' });
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    const { character, userId } = req.body;

    if (!character || !userId) {
      return res.status(400).json({ message: 'Missing character data or user ID' });
    }

    let iconUrl = character.icon;

    // Upload Icon if it's a Data URL
    if (character.icon.startsWith('data:')) {
      const matches = character.icon.match(/^data:(.+);base64,(.+)$/);
      if (!matches) {
          throw new Error('Invalid image data');
      }
      const contentType = matches[1];
      const buffer = Buffer.from(matches[2], 'base64');
      const fileExt = contentType.split('/')[1] || 'png';

      const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
      const filePath = `${userId}/${fileName}`;

      const { data, error: uploadError } = await supabase.storage
        .from('character-icons')
        .upload(filePath, buffer, {
          contentType,
          upsert: true
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('character-icons')
        .getPublicUrl(filePath);

      iconUrl = publicUrl;
    }

    // Insert into Supabase
    const { data: insertedData, error: insertError } = await supabase
      .from('public_characters')
      .insert([
        {
          name: character.name,
          description: character.description,
          system_prompt: character.systemPrompt,
          icon_url: iconUrl,
          author_id: userId,
          parent_id: character.parent_id || null,
        }
      ])
      .select()
      .single();

    if (insertError) throw insertError;

    return res.status(200).json(insertedData);

  } catch (error: any) {
    console.error('API Error:', error);
    return res.status(500).json({ message: error.message || 'Internal Server Error' });
  }
}
