-- Adicionar coluna 'assignee' (Responsável) na tabela de subtarefas
alter table public.subtasks 
add column if not exists assignee text;
