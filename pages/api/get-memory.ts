import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { character_id } = req.query;

  if (!character_id || typeof character_id !== 'string') {
    return res.status(400).json({ error: 'character_id is required.' });
  }

  try {
    const { data, error } = await supabase
      .from('character_memories')
      .select('memory_summary')
      .eq('user_id', user.id)
      .eq('character_id', character_id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // This code means no rows were found, which is not an error in this case.
        return res.status(200).json({ memory_summary: null });
      }
      throw error;
    }

    res.status(200).json({ memory_summary: data?.memory_summary || null });

  } catch (error: any) {
    console.error('Error fetching memory:', error);
    res.status(500).json({ error: error.message });
  }
}
