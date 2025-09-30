import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query;

  if (req.method === 'GET') {
    if (!id || typeof id !== 'string') {
      return res.status(400).json({ error: 'A valid character ID must be provided.' });
    }

    try {
      const { data, error } = await supabase
        .from('public_characters')
        .select('*') // Select all fields for a single import
        .eq('id', id)
        .single(); // Expect only one row

      if (error) {
        if (error.code === 'PGRST116') { // PostgREST error for "Not a single row"
          return res.status(404).json({ error: 'Character not found.' });
        }
        throw error;
      }

      if (!data) {
        return res.status(404).json({ error: 'Character not found.' });
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
