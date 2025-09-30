import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import { Character } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method === 'POST') {
    // Publish a character
    try {
      const character = req.body as Character;

      if (!character || !character.name || !character.systemPrompt) {
          return res.status(400).json({ error: 'Invalid character data provided.' });
      }

      const { name, description, systemPrompt, color, icon, useGauges, gauges } = character;

      const characterToInsert = {
        author_id: user.id,
        name,
        description,
        system_prompt: systemPrompt,
        color,
        icon,
        use_gauges: useGauges,
        gauges,
      };

      const { data, error } = await supabase
        .from('public_characters')
        .insert(characterToInsert)
        .select()
        .single();

      if (error) {
        console.error('Supabase Publish (INSERT) error:', error);
        throw error;
      }

      res.status(201).json(data); // Return the newly created public character

    } catch (error: any) {
      console.error('API Publish POST error:', error);
      res.status(500).json({ error: error.message });
    }

  } else if (req.method === 'DELETE') {
    // Unpublish a character
    try {
      const { public_id } = req.body;

      if (!public_id) {
        return res.status(400).json({ error: 'public_id is required to unpublish.' });
      }

      const { error } = await supabase
        .from('public_characters')
        .delete()
        .match({ id: public_id, author_id: user.id }); // Ensure user can only delete their own

      if (error) {
        console.error('Supabase Unpublish (DELETE) error:', error);
        throw error;
      }

      res.status(200).json({ message: 'Character unpublished successfully.' });

    } catch (error: any) {
        console.error('API Unpublish DELETE error:', error);
        res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['POST', 'DELETE']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
