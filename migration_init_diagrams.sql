-- Migration to initialize diagram_code for existing projects
UPDATE public.projects 
SET diagram_code = 'graph TD
    subgraph "Interface (React/Vite)"
        UI[Painel de Controle]
        K[Kanban]
    end
    subgraph "Data (Supabase)"
        DB[(PostgreSQL)]
        RLS[Row Level Security]
    end
    UI --> DB
    K --> RLS' 
WHERE diagram_code IS NULL OR diagram_code = '';

-- Ensure default value is present for new projects
ALTER TABLE public.projects ALTER COLUMN diagram_code SET DEFAULT 'graph TD
    A[Projeto] --> B[Desenvolvimento]
    B --> C[Entrega]';
