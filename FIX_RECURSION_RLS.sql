-- 1. Criar uma função auxiliar para verificar se o usuário é admin sem causar recursão
-- O uso de SECURITY DEFINER faz com que a função execute com privilégios de dono do schema, contornando o RLS.
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Corrigir a política da tabela profiles (Remover a versão recursiva)
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

CREATE POLICY "Profiles access policy" ON public.profiles
FOR SELECT USING (
    id = auth.uid() -- O usuário vê a si mesmo
    OR public.check_is_admin() -- Admin vê todos
);

-- 3. Atualizar também a política de UPDATE que podia causar problemas similares
DROP POLICY IF EXISTS "Users can update own profile or admins can update all." ON public.profiles;

CREATE POLICY "Profiles update policy" ON public.profiles
FOR UPDATE USING (
    id = auth.uid() 
    OR public.check_is_admin()
);

-- 4. Forçar o recarregamento do cache do PostgREST
NOTIFY pgrst, 'reload schema';
COMMENT ON TABLE public.profiles IS 'Hub Manager Profiles - Recursion Fixed';
