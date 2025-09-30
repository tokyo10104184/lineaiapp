import { createBrowserClient } from '@supabase/ssr';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be defined in .env.local');
}

// Note: The official docs often show this as a function `createClient()`.
// Exporting the client directly is also fine and is how it was previously structured.
// This client is for use in the browser.
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey);
