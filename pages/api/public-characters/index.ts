import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const supabase = createSupabaseServerClient(req, res);

  if (req.method === 'GET') {
    try {
      const { data, error } = await supabase.rpc('get_public_characters_with_author');
      if (error) {
        console.error('Supabase GET RPC error:', error);
        throw error;
      }
      res.status(200).json(data);
    } catch (error: any) {
      console.error('API GET /public-characters error:', error);
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        return res.status(401).json({ error: 'Unauthorized: You must be logged in to publish a character.' });
      }

      // The 'id' from the body is the public_id
      const { name, description, systemPrompt, color, icon, useGauges, gauges, id: public_id } = req.body;

      if (!name || !systemPrompt) {
        return res.status(400).json({ error: 'Name and system_prompt are required.' });
      }

      const characterData = {
        author_id: user.id,
        name,
        description,
        system_prompt: systemPrompt,
        color,
        icon,
        use_gauges: useGauges,
        gauges,
      };

      // Conditionally add the id for updates, omit for inserts
      const characterToUpsert = public_id ? { id: public_id, ...characterData } : characterData;

      const { data, error } = await supabase
        .from('public_characters')
        .upsert(characterToUpsert)
        .select()
        .single();

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
