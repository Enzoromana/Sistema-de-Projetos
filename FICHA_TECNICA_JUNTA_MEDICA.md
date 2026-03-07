# Ficha Técnica - Modificações Junta Médica (v2.3.0)

Este documento detalha as melhorias técnicas, reestruturações de fluxo e correções de interface implementadas no módulo de Junta Médica entre as versões 2.2.0 e 2.3.0.

## 1. Interface & UX (Premium Design)
- **Componente `CustomSelect`**: Substituição dos elementos `<select>` nativos do sistema pelos seletores customizados. Melhora a consistência visual em dispositivos Retina e garante total controle sobre a tipografia e estados de hover/foco.
- **Filtros de Dashboard**: Os filtros de "Status" e "Especialidade" na listagem principal agora utilizam o novo padrão visual, otimizando o aproveitamento de espaço e a legibilidade.
- **Campos de Justificativa**: Transição de `input` de linha única para `textarea` multi-linha nas justificativas de itens (procedimentos e materiais), permitindo descrições técnicas mais detalhadas e organizadas.

## 2. Fluxo de Trabalho & Gestão
- **Controle de Reedição (Edit Lock)**: Implementação da funcionalidade de liberar ou suspender a edição de pareceres externos através do status administrativo. 
- **Feedback em Tempo Real**: Inclusão de um numerador dinâmico de pendências no botão de conclusão (ícone de Martelo). O contador utiliza a função `getTiebreakerMissingCount` para validar campos obrigatórios instantaneamente.
- **Visualização de Anexos**: Seção de "Anexos Gerais" agora visível diretamente no modal de Status, permitindo acesso rápido a documentos complementares sem sair da timeline do processo.

## 3. Nomenclatura & Padronização
- **Profissional Assistente**: Atualização global do termo de "Médico Assistente" para "Profissional Assistente", abrangendo outras categorias de saúde participantes da divergência.
- **Localização de Órgão (CRM/CRO)**: Substituição do rótulo fixo "CRM" por campos dinâmicos que carregam o tipo de conselho selecionado (`aud_conselho_tipo` / `ass_conselho_tipo`).
- **ID de Processo**: Mudança do rótulo "Protocolo" para "Requisição" para alinhar-se ao vocabulário oficial da operadora.

## 4. Otimização de Documentação (PDF)
- **Correção de Truncamento**: Ajuste no template de geração do PDF final para evitar o corte de nomes de médicos especialistas ou conclusões extensas.
- **Alinhamento do Cabeçalho**: Refinamento do posicionamento vertical e pesos de fonte nos campos de identificação do médico auditor e assistente.

## 5. Hotfixes (v2.3.0)
- **Persistência de Dados**: Correção do erro de salvamento via adição das colunas `aud_conselho_tipo` e `ass_conselho_tipo` na tabela `medical_requests` do Supabase.
- **Resolução de `ReferenceError`**: Importação do ícone `Paperclip` no módulo de novidades, corrigindo a falha crítica de abertura da página.
- **Responsividade de Labels**: Ajuste no modal de "Detalhes do Processo" para que os sub-rótulos de Estado e Número de Registro acompanhem dinamicamente o tipo de conselho (CRM -> CRO).

---
*Gerado automaticamente pelo Antigravity Agent em 07 de Março de 2026.*
