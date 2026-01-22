-- Adicionar coluna 'completed_at' (Data de Realização) nas tabelas de tarefas e subtarefas
alter table public.tasks 
add column if not exists completed_at date;

alter table public.subtasks 
add column if not exists completed_at date;
