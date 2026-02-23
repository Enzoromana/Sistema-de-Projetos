# Roadmap de Desenvolvimento - Hub Manager Klini 🚀

Este documento detalha o estado atual e o planejamento futuro para cada módulo do ecossistema, com exceção do módulo de Junta Médica.

---

## 1. 🏠 Hub Central (Core)
*O cérebro do sistema, responsável pela navegação e segurança.*

- **Estado Atual:** 
    - Autenticação via Supabase.
    - Gestão de perfil com preenchimento obrigatório de CPF/Setor.
    - **Proporção de 75%** aplicada para melhor ergonomia em telas grandes.
- **Próximos Passos:**
    - [ ] **Central de Notificações:** Avisos em tempo real de novos prazos e mensagens.
    - [ ] **Modo Escuro (Dark Mode):** Suporte nativo para alternância de temas.
    - [ ] **Dashboard de Produtividade:** Gráficos gerais de tarefas e reuniões na Home.

---

## 2. 📁 Gestão de Projetos
*Colaboração e controle de entregas.*

- **Estado Atual:** 
    - Quadro Kanban (To Do, In Progress, Done).
    - Hierarquia completa de Projetos > Tarefas > Subtarefas.
    - Arrastar e soltar (Drag & Drop) para reordenação.
- **Próximos Passos:**
    - [ ] **Anexos em Tarefas:** Upload de arquivos (PDF, Imagens) vinculados a cada card.
    - [ ] **Histórico e Comentários:** Log de alterações e chat interno por tarefa.
    - [ ] **Gráfico de Gantt:** Visualização de cronograma em linha do tempo profissional.
    - [ ] **Lembretes Automáticos:** Notificações por e-mail para prazos próximos.

---

## 3. 🗓️ Sala de Reunião
*Gestão eficiente de espaços físicos.*

- **Estado Atual:** 
    - Visões Dia, Semana e Mês.
    - Reserva simples com filtros por sala.
    - Interface otimizada para Desktop.
- **Próximos Passos:**
    - [ ] **Reservas Recorrentes:** Agendar reuniões semanais/mensais automaticamente.
    - [ ] **Check-in via QR Code:** Confirmação de presença na porta da sala.
    - [ ] **Modo TV (Digital Signage):** Painel otimizado para exibição em monitores fixos na recepção.
    - [ ] **Integração Google/Outlook:** Sincronização bidirecional com calendários externos.

---

## 4. 🛡️ Auditoria & Acessos
*Controle administrativo e segurança de dados.*

- **Estado Atual:** 
    - Controle granular de permissões (toggles por módulo).
    - Rastreabilidade de ações (Log de INSERT/UPDATE/DELETE).
    - Ajuste de relacionamento (Fix PGRST200) para identificação de usuários.
- **Próximos Passos:**
    - [ ] **Relatórios de Segurança:** Alertas de múltiplas tentativas de login falhas.
    - [ ] **Exportação de Logs:** Gerar planilhas CSV/Excel para auditorias externas.
    - [ ] **Restrição por IP:** Bloqueio de acesso administrativo fora da rede da Klini.

---

## 5. 📑 Guia Médico
*Inteligência de rede e suporte comercial.*

- **Estado Atual:** 
    - Gerador de PDF/DOCX multi-produtos (Fix K600 QC/QP).
    - Busca por especialidade e prestador.
    - **Filtro de Rede Interna:** Atalho para Centros Klini e Rede Casa.
    - **Expansão de Cards:** Visualização completa de especialidades.
    - **Visual Renovado:** Identidade visual Klini (Teal/Laranja).
- **Próximos Passos:**
    - [ ] **Mapas Interativos:** Integração com Google Maps para visualizar rede por raio geográfico.
    - [ ] **Busca por CEP:** Facilitar a busca de beneficiários perto de casa.
    - [ ] **Sincronização Automática:** Atualização em massa de prestadores via planilha central.
    - [ ] **Avaliação de Rede:** Feedback interno sobre a qualidade de atendimento dos prestadores.

---

## 📊 Conversor Comercial (SheetToSlide)
*Transformação de dados em apresentações.*

- **Estado Atual:** 
    - Extração de dados de planilhas para layouts pré-definidos.
- **Roadmap Específico:**
    - [ ] **Novos Templates:** Criação de temas personalizados para cada diretoria.
    - [ ] **Preview em Tempo Real:** Visualizar o slide antes de baixar o PPTX.

---

> [!NOTE]
> Este roadmap é um documento vivo e pode ser ajustado conforme as prioridades estratégicas da Klini.
