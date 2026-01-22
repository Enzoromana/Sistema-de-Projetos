-- Inserir Projeto 1: Guia Médico Klini
with p1 as (
  insert into public.projects (name, description, status, priority, deadline)
  values (
    'Guia Médico Klini',
    'Sistema de geração de guias médicos em DOCX',
    'progress',
    'high',
    '2025-01-31'
  ) returning id
)
insert into public.tasks (project_id, title, status)
select id, 'Corrigir erro 404 na geração', 'done' from p1
union all
-- Nota: 'progress' mapeado para 'pending' pois o sistema usa status binário para tarefas
select id, 'Atualizar base de 150k prestadores', 'pending' from p1 
union all
select id, 'Implementar comparativo de rede', 'pending' from p1;

-- Inserir Projeto 2: Conversor Klini v2.0
with p2 as (
  insert into public.projects (name, description, status, priority, deadline)
  values (
    'Conversor Klini v2.0',
    'Conversão de Excel para PowerPoint com branding',
    'done',
    'high',
    '2024-12-15'
  ) returning id
)
insert into public.tasks (project_id, title, status)
select id, 'Ajustar índices COM/SEM COPAY', 'done' from p2
union all
select id, 'Atualizar capa DEZEMBRO 2025', 'done' from p2;
