# Repositório de Backups - Klini Junta Médica

Este diretório contém os backups periódicos do sistema para garantir a continuidade em caso de falhas catastróficas.

## 📂 Conteúdo Atual
- `full_schema_backup_20260204.sql`: Consolidação completa de todas as tabelas e permissões.
- `sync_attachments.ps1`: Script PowerShell para baixar anexos do Storage.
- `attachments/`: Pasta onde os anexos físicos são armazenados pelo script.

## 🗒️ Instruções de Manutenção
1.  **Backup Semanal**: Conforme o cronograma de segurança, realize um novo dump do banco de dados toda segunda-feira e salve neste diretório com o sufixo da data (ex: `backup_YYYYMMDD.sql`).
2.  **Limpeza**: Mantenha no mínimo as últimas 4 semanas de backups aqui.
3.  **Segurança**: Evite commitar dados sensíveis (registros reais de pacientes) neste diretório se o repositório for público. Este backup contém apenas o **Schema** (estrutura).

---
*Gerado automaticamente pelo Assistente Klini.*
