-- ==========================================
-- ENDURECIMENTO DE SEGURANÇA (RLS)
-- DATA: 2026-02-04
-- ==========================================

-- 1. Remover políticas "abertas" existentes
DROP POLICY IF EXISTS "Procedures access policy" ON public.medical_procedures;
DROP POLICY IF EXISTS "Materials access policy" ON public.medical_materials;
DROP POLICY IF EXISTS "Attachments access policy" ON public.medical_attachments;

-- 2. Criar novas políticas restritivas
-- As tabelas filhas agora verificam se o usuário tem permissão médica ou é admin

-- PROCEDIMENTOS
CREATE POLICY "Procedures restricted access" ON public.medical_procedures
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (access_medical = true OR role = 'admin')
    )
);

-- MATERIAIS
CREATE POLICY "Materials restricted access" ON public.medical_materials
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (access_medical = true OR role = 'admin')
    )
);

-- ANEXOS
CREATE POLICY "Attachments restricted access" ON public.medical_attachments
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (access_medical = true OR role = 'admin')
    )
);

-- 3. Reforçar política de requisições (caso não esteja atualizada)
DROP POLICY IF EXISTS "Medical access policy" ON public.medical_requests;
CREATE POLICY "Medical access policy" ON public.medical_requests
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND (access_medical = true OR role = 'admin')
    )
);
