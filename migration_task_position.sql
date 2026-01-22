-- Adicionar coluna 'position' na tabela de tarefas para permitir reordenação
alter table public.tasks 
add column if not exists position integer;

-- Inicializar a posição com o ID atual para as tarefas existentes
update public.tasks set position = id where position is null;
