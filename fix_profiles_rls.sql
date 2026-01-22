-- Drop existing restrictive policy
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

-- Create new policy that allows update if it's the user's own profile OR if the current user is an admin
CREATE POLICY "Users can update own profile or admins can update all." ON public.profiles
  FOR UPDATE USING (
    auth.uid() = id 
    OR 
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );
