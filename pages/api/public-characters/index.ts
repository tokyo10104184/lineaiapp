import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { Character } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all public characters
    try {
      const { data, error } = await supabase
        .from('public_characters')
        .select('id, name, description, icon, color, use_gauges') // Select a subset of fields for the list view
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      res.status(200).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else if (req.method === 'POST') {
    // Create a new public character
    try {
      const { name, description, system_prompt, color, icon, use_gauges, gauges } = req.body as Character;

      // Basic validation
      if (!name || !system_prompt) {
        return res.status(400).json({ error: 'Name and system_prompt are required.' });
      }

      const { data, error } = await supabase
        .from('public_characters')
        .insert([{ name, description, system_prompt, color, icon, use_gauges, gauges }])
        .select();

      if (error) {
        throw error;
      }

      res.status(201).json(data);
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
