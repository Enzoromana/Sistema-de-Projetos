-- Migration for Dev Cockpit Diagrams

-- 1. Add diagram_code to projects
ALTER TABLE public.projects ADD COLUMN IF NOT EXISTS diagram_code TEXT DEFAULT 'graph TD
A[Início] --> B[Desenvolvimento]';

-- 2. Add diagram_code to tasks
ALTER TABLE public.tasks ADD COLUMN IF NOT EXISTS diagram_code TEXT;

-- 3. Add architecture_flow to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS architecture_flow TEXT;

-- 4. Enable access for all (for now) or specific roles
-- We assume the existing RLS covers these tables, but we ensure columns are available.

COMMENT ON COLUMN public.projects.diagram_code IS 'Código Mermaid.js para visualização do fluxo do projeto';
