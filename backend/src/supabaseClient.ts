import { createClient } from '@supabase/supabase-js';

// values are read from environment variables (backend uses dotenv)
const supabaseUrl = process.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY as string;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Make sure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are defined.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
