import { NextApiRequest, NextApiResponse } from 'next';
import { supabase } from '../../../lib/supabaseClient';
import { Character } from '../../../lib/types';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // Fetch all public characters
    try {
      const { data, error } = await supabase
        .from('public_characters')
        .select('id, name, description, icon, color, use_gauges, likes_count') // Select a subset of fields for the list view
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
    // Create a new public character
    try {
      // Note the camelCase from the request body
      const { name, description, systemPrompt, color, icon, useGauges, gauges } = req.body;

      // Basic validation
      if (!name || !systemPrompt) {
        return res.status(400).json({ error: 'Name and system_prompt are required.' });
      }

      // Map from camelCase (JS) to snake_case (DB)
      const characterToInsert = {
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
        .insert([characterToInsert])
        .select();

      if (error) {
        console.error('Supabase POST error:', error);
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
