-- 1. Table for Security Questions
CREATE TABLE IF NOT EXISTS public.user_security_questions (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    question_1 TEXT NOT NULL,
    answer_1 TEXT NOT NULL,
    question_2 TEXT NOT NULL,
    answer_2 TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_security_questions ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can manage their own security questions" 
ON public.user_security_questions 
FOR ALL USING (auth.uid() = user_id);

-- 2. RPC for Admin to Reset User Password
-- This requires the 'pgcrypto' extension for hashing or use of admin service role.
-- However, we can use a simpler approach: a table that requests changes 
-- and an admin-only trigger, but the most direct way for a Hub is an RPC 
-- that an Admin can call.

CREATE OR REPLACE FUNCTION public.admin_reset_user_password(
    target_user_id UUID,
    new_password TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with elevated permissions
AS $$
BEGIN
    -- Check if the caller is an admin
    IF NOT EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'admin'
    ) THEN
        RAISE EXCEPTION 'Acesso negado: Apenas administradores podem redefinir senhas.';
    END IF;

    -- Update the password in auth.users
    -- Note: This requires the extension 'pgcrypto' to be active in the database.
    -- Most Supabase projects have this by default.
    UPDATE auth.users
    SET encrypted_password = crypt(new_password, gen_salt('bf'))
    WHERE id = target_user_id;

    RETURN TRUE;
END;
$$;
