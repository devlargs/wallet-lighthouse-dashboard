import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://rkhuxgoazjftvxwiusze.supabase.co',
  `${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`
);

export default supabase;
