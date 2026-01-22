-- Adicionar coluna 'position' na tabela de subtarefas para permitir reordenação
alter table public.subtasks 
add column if not exists position integer;

-- Inicializar a posição com o ID atual para as subtarefas existentes
update public.subtasks set position = id where position is null;
