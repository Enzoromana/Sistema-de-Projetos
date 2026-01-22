-- Create a table for public profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  is_approved BOOLEAN DEFAULT false,
  access_projects BOOLEAN DEFAULT false,
  access_rooms BOOLEAN DEFAULT false,
  access_audit BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policies (idempotent)
do $$ 
begin
    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Public profiles are viewable by everyone.') then
        CREATE POLICY "Public profiles are viewable by everyone." ON public.profiles
          FOR SELECT USING (true);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can insert their own profile.') then
        CREATE POLICY "Users can insert their own profile." ON public.profiles
          FOR INSERT WITH CHECK (auth.uid() = id);
    end if;

    if not exists (select 1 from pg_policies where tablename = 'profiles' and policyname = 'Users can update own profile.') then
        CREATE POLICY "Users can update own profile." ON public.profiles
          FOR UPDATE USING (auth.uid() = id);
    end if;
end $$;

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, is_approved)
  VALUES (new.id, new.email, new.raw_user_meta_data->>'full_name', false);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger on auth.users
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
