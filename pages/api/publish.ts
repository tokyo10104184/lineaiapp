import type { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../lib/supabase';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '4mb', // Allow up to 4MB for image upload (2MB limit + overhead)
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  try {
    const { character, userId } = req.body;

    if (!character || !userId) {
      return res.status(400).json({ message: 'Missing required data' });
    }

    let iconUrl = character.icon;

    // 1. Upload Icon if it's a Data URL
    if (iconUrl && iconUrl.startsWith('data:')) {
      try {
        // Parse Base64 Data URL
        const matches = iconUrl.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
        if (!matches || matches.length !== 3) {
            throw new Error('Invalid icon data URL format');
        }
        const contentType = matches[1];
        const buffer = Buffer.from(matches[2], 'base64');

        const fileExt = contentType.split('/')[1] || 'png';
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
        const filePath = `${userId}/${fileName}`;

        const { data, error: uploadError } = await supabase.storage
            .from('character-icons')
            .upload(filePath, buffer, {
                contentType: contentType,
            });

        if (uploadError) throw new Error(`Storage upload failed: ${uploadError.message}`);

        const { data: { publicUrl } } = supabase.storage
            .from('character-icons')
            .getPublicUrl(filePath);

        iconUrl = publicUrl;
      } catch (e: any) {
        console.error('Icon processing error:', e);
        return res.status(500).json({ message: `アイコン画像の処理に失敗しました: ${e.message}` });
      }
    }

    // 2. Insert into Supabase
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

    if (insertError) {
        console.error('Database insert error:', insertError);
        return res.status(500).json({ message: `データベースへの保存に失敗しました: ${insertError.message}` });
    }

    return res.status(200).json({ success: true, character: insertedData, iconUrl });

  } catch (error: any) {
    console.error('Publish API error:', error);
    return res.status(500).json({ message: `Internal Server Error: ${error.message || error}` });
  }
}
