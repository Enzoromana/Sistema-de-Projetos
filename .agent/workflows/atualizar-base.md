---
description: Fluxo para atualizar a base de produtos/prestadores do Guia Médico
---

# Atualizar Base do Guia Médico

## Pré-requisitos
- PowerShell 5.1+ (nativo do Windows)
- Conexão com a internet (acesso a `guia-medico.klinisaude.com.br`)

## Passo a Passo

### 1. Executar o script de atualização
// turbo
```powershell
.\update_guia_base.ps1
```
O script irá:
- Ler o índice de produtos (`public/data/guia-medico/produtos.json`)
- Baixar dados atualizados de cada produto da API
- Salvar os JSONs individuais em `public/data/guia-medico/produtos/<CODIGO>.json`
- Regenerar o `produtos.json` com contagens atualizadas

### 2. Verificar os resultados
Conferir o resumo exibido no terminal. Se houver erros, reexecute ou investigue o produto individual.

### 3. Commit e deploy
```powershell
git add public/data/guia-medico/
git commit -m "chore: update guia medico data base"
git push origin main
```
O deploy no Vercel será automático após o push.

## Frequência Sugerida
- **Semanal** ou **sempre que houver alteração na rede credenciada**

## Estrutura de Dados

| Arquivo | Descrição |
|---------|-----------|
| `public/data/guia-medico/produtos.json` | Índice com todos os produtos e contagens |
| `public/data/guia-medico/produtos/<CODIGO>.json` | Dados completos de prestadores por produto |

## Fonte dos Dados
- **API**: `https://guia-medico.klinisaude.com.br/api/produto?nome=<NOME_PRODUTO>`
