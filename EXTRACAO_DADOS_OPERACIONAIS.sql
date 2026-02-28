-- PASSO 6: EXTRAÇÃO DE DADOS OPERACIONAIS (RODE NO PROJETO ANTIGO)

-- PASSO 6A: AGENDAMENTOS DE SALAS
SELECT string_agg(
  'INSERT INTO public.room_bookings (id, created_at, date, start_time, end_time, title, sector, description) VALUES (' ||
  id || ', ' ||
  quote_nullable(created_at) || ', ' ||
  quote_nullable(date) || ', ' ||
  quote_nullable(start_time) || ', ' ||
  quote_nullable(end_time) || ', ' ||
  quote_nullable(title) || ', ' ||
  quote_nullable(sector) || ', ' ||
  quote_nullable(description) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.room_bookings;


-- PASSO 6B: REQUISIÇÕES MÉDICAS (MEDICAL_REQUESTS)
SELECT string_agg(
  'INSERT INTO public.medical_requests (id, created_at, requisicao, ben_nome, ben_cpf, ben_email, ben_sexo, ben_nascimento, ben_telefone, ben_estado, ben_cidade, aud_nome, aud_estado, aud_crm, aud_data, ass_nome, ass_crm, ass_email, ass_telefone, ass_endereco, ass_especialidade, div_especialidade, div_motivos, situacao, prazo_ans, documentos_internos, desempatador_nome, desempatador_crm, desempatador_especialidade, desempate_ass_nome, desempate_ass_crm, desempate_ass_especialidade, parecer_conclusao, referencias_bibliograficas, tiebreaker_token, tiebreaker_allow_edit, tiebreaker_verify_crm, tiebreaker_verify_cpf) VALUES (' ||
  id || ', ' ||
  quote_nullable(created_at) || ', ' ||
  quote_nullable(requisicao) || ', ' ||
  quote_nullable(ben_nome) || ', ' ||
  quote_nullable(ben_cpf) || ', ' ||
  quote_nullable(ben_email) || ', ' ||
  quote_nullable(ben_sexo) || ', ' ||
  quote_nullable(ben_nascimento) || ', ' ||
  quote_nullable(ben_telefone) || ', ' ||
  quote_nullable(ben_estado) || ', ' ||
  quote_nullable(ben_cidade) || ', ' ||
  quote_nullable(aud_nome) || ', ' ||
  quote_nullable(aud_estado) || ', ' ||
  quote_nullable(aud_crm) || ', ' ||
  quote_nullable(aud_data) || ', ' ||
  quote_nullable(ass_nome) || ', ' ||
  quote_nullable(ass_crm) || ', ' ||
  quote_nullable(ass_email) || ', ' ||
  quote_nullable(ass_telefone) || ', ' ||
  quote_nullable(ass_endereco) || ', ' ||
  quote_nullable(ass_especialidade) || ', ' ||
  quote_nullable(div_especialidade) || ', ' ||
  COALESCE('ARRAY[' || (SELECT string_agg(quote_literal(x), ',') FROM unnest(div_motivos) AS x) || ']::text[]', 'NULL') || ', ' ||
  quote_nullable(situacao) || ', ' ||
  quote_nullable(prazo_ans) || ', ' ||
  quote_nullable(documentos_internos::text) || '::jsonb, ' ||
  quote_nullable(desempatador_nome) || ', ' ||
  quote_nullable(desempatador_crm) || ', ' ||
  quote_nullable(desempatador_especialidade) || ', ' ||
  quote_nullable(desempate_ass_nome) || ', ' ||
  quote_nullable(desempate_ass_crm) || ', ' ||
  quote_nullable(desempate_ass_especialidade) || ', ' ||
  quote_nullable(parecer_conclusao) || ', ' ||
  quote_nullable(referencias_bibliograficas) || ', ' ||
  quote_nullable(tiebreaker_token) || ', ' ||
  quote_nullable(tiebreaker_allow_edit) || ', ' ||
  quote_nullable(tiebreaker_verify_crm) || ', ' ||
  quote_nullable(tiebreaker_verify_cpf) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.medical_requests;


-- PASSO 6C: PROCEDIMENTOS MÉDICOS
SELECT string_agg(
  'INSERT INTO public.medical_procedures (id, request_id, codigo, descricao, qtd_solicitada, qtd_autorizada, justificativa, conclusao_desempate) VALUES (' ||
  id || ', ' ||
  request_id || ', ' ||
  quote_nullable(codigo) || ', ' ||
  quote_nullable(descricao) || ', ' ||
  qtd_solicitada || ', ' ||
  qtd_autorizada || ', ' ||
  quote_nullable(justificativa) || ', ' ||
  quote_nullable(conclusao_desempate) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.medical_procedures;


-- PASSO 6D: MATERIAIS MÉDICOS
SELECT string_agg(
  'INSERT INTO public.medical_materials (id, request_id, descricao, qtd_solicitada, qtd_autorizada, justificativa, conclusao_desempate) VALUES (' ||
  id || ', ' ||
  request_id || ', ' ||
  quote_nullable(descricao) || ', ' ||
  qtd_solicitada || ', ' ||
  qtd_autorizada || ', ' ||
  quote_nullable(justificativa) || ', ' ||
  quote_nullable(conclusao_desempate) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.medical_materials;


-- PASSO 6E: ANEXOS MÉDICOS
SELECT string_agg(
  'INSERT INTO public.medical_attachments (id, request_id, file_name, file_path, created_at) VALUES (' ||
  id || ', ' ||
  request_id || ', ' ||
  quote_nullable(file_name) || ', ' ||
  quote_nullable(file_path) || ', ' ||
  quote_nullable(created_at) || ') ON CONFLICT (id) DO NOTHING;',
  E'\n'
) as inserts
FROM public.medical_attachments;


-- PASSO 6F: LOGS DE AUDITORIA
SELECT string_agg(
  'INSERT INTO public.audit_logs (created_at, user_id, action, table_name, record_id, old_data, new_data) VALUES (' ||
  quote_nullable(created_at) || ', ' ||
  quote_nullable(user_id) || ', ' ||
  quote_nullable(action) || ', ' ||
  quote_nullable(table_name) || ', ' ||
  quote_nullable(record_id) || ', ' ||
  quote_nullable(old_data::text) || '::jsonb, ' ||
  quote_nullable(new_data::text) || '::jsonb);',
  E'\n'
) as inserts
FROM public.audit_logs;
