import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vyibcbedcilkxpdrizet.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_9XzL9sIY2ly7Y_PBsEKG1w_xjgsTqtl';

export const supabase = createClient(supabaseUrl, supabaseKey);
