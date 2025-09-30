import { NextApiRequest, NextApiResponse } from 'next';
import { createSupabaseServerClient } from '../../../lib/supabaseServer';
import { createClient } from '@supabase/supabase-js';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'DELETE') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 1. Create a standard client to check user's admin status
  const supabase = createSupabaseServerClient(req, res);
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 2. Fetch the user's profile to check the is_admin flag
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (profileError || !profile) {
    return res.status(500).json({ error: 'Could not retrieve user profile.' });
  }

  // 3. Check if the user is an admin
  if (!profile.is_admin) {
    return res.status(403).json({ error: 'Forbidden: You do not have admin privileges.' });
  }

  // 4. If user is an admin, create a service role client to bypass RLS
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
      return res.status(500).json({ error: 'Service role key is not configured on the server.' });
  }

  const supabaseAdmin = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey
  );

  // 5. Proceed with the deletion
  try {
    const { character_id } = req.body;
    if (!character_id) {
      return res.status(400).json({ error: 'character_id is required.' });
    }

    const { error: deleteError } = await supabaseAdmin
      .from('public_characters')
      .delete()
      .match({ id: character_id });

    if (deleteError) {
      throw deleteError;
    }

    res.status(200).json({ message: 'Character deleted successfully by admin.' });

  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
}
