-- PASSO 5: Rode este comando no SQL Editor do PROJETO ANTIGO
-- Ele vai gerar os comandos para levar todos os seus projetos e tarefas.

-- PASSO 5A: PROJETOS (Rode no projeto antigo, pegue o resultado e leve para o novo)
SELECT string_agg(
  'INSERT INTO public.projects (id, created_at, name, description, status, priority, deadline, diagram_code) VALUES (' ||
  id || ', ' ||
  quote_nullable(created_at) || ', ' ||
  quote_nullable(name) || ', ' ||
  quote_nullable(description) || ', ' ||
  quote_nullable(status) || ', ' ||
  quote_nullable(priority) || ', ' ||
  quote_nullable(deadline) || ', ' ||
  quote_nullable(diagram_code) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.projects;

-- PASSO 5B: TAREFAS (Rode no projeto antigo após os projetos)
SELECT string_agg(
  'INSERT INTO public.tasks (id, created_at, project_id, title, status, position, start_date, deadline, completed_at) VALUES (' ||
  id || ', ' ||
  quote_nullable(created_at) || ', ' ||
  project_id || ', ' ||
  quote_nullable(title) || ', ' ||
  quote_nullable(status) || ', ' ||
  position || ', ' ||
  quote_nullable(start_date) || ', ' ||
  quote_nullable(deadline) || ', ' ||
  quote_nullable(completed_at) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.tasks;

-- PASSO 5C: SUBTAREFAS (Rode no projeto antigo por último)
SELECT string_agg(
  'INSERT INTO public.subtasks (id, created_at, task_id, title, status, assignee, position, completed_at) VALUES (' ||
  id || ', ' ||
  quote_nullable(created_at) || ', ' ||
  task_id || ', ' ||
  quote_nullable(title) || ', ' ||
  quote_nullable(status) || ', ' ||
  quote_nullable(assignee) || ', ' ||
  position || ', ' ||
  quote_nullable(completed_at) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.subtasks;
