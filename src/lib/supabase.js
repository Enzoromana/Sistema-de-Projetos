import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://vyibcbedcilkxpdrizet.supabase.co';
const supabaseKey = 'sb_publishable_9XzL9sIY2ly7Y_PBsEKG1w_xjgsTqtl';

export const supabase = createClient(supabaseUrl, supabaseKey);
