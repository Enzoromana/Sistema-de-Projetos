-- Adiciona a coluna de referências bibliográficas na tabela de solicitações médicas
ALTER TABLE medical_requests 
ADD COLUMN IF NOT EXISTS referencias_bibliograficas TEXT;

-- Comentário para documentação
COMMENT ON COLUMN medical_requests.referencias_bibliograficas IS 'Referências bibliográficas utilizadas na conclusão do desempate da Junta Médica.';
