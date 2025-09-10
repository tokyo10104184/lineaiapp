import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);

  if (req.method === 'GET') {
    // Fetch all public characters
    try {
      const { data, error } = await supabase
        .from('public_characters')
        .select('id, name, description, icon, color, use_gauges, likes_count')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Supabase GET error:', error);
        throw error;
      }

      res.status(200).json(data);
    } catch (error: any) {
      console.error('API GET /public-characters error:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    // Create or update a public character
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: You must be logged in to publish a character.' });
      }

      const { name, description, systemPrompt, color, icon, useGauges, gauges, public_id } = req.body;

      if (!name || !systemPrompt) {
        return res.status(400).json({ error: 'Name and system_prompt are required.' });
      }

      const characterToUpsert = {
        id: public_id, // This is the public UUID, will be undefined on first publish
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
        .upsert(characterToUpsert)
        .select()
        .single(); // We expect one record back

      if (error) {
        console.error('Supabase POST (upsert) error:', error);
        throw error;
      }

      res.status(201).json(data);
    } catch (error: any) {
        console.error('API POST /public-characters error:', error);
        res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
