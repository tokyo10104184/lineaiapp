import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../../lib/supabaseServer';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const supabase = createSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  // Liking should be available to any logged-in user.
  if (!user) {
    return res.status(401).json({ error: 'You must be logged in to like a character.' });
  }

  const { id } = req.query;

  if (typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid character ID.' });
  }

  try {
    const { error } = await supabase.rpc('increment_likes', {
      character_id: id,
    });

    if (error) {
      console.error('Supabase RPC increment_likes error:', error);
      throw error;
    }

    res.status(200).json({ message: 'Like registered successfully.' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
