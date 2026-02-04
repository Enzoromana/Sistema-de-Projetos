# =======================================================
# SCRIPT DE SINCRONIZAÇÃO DE ANEXOS - JUNTA MÉDICA KLINI
# =======================================================
# Objetivo: Baixar todos os anexos do Supabase Storage
# Frequência sugerida: A cada 3 dias (via Task Scheduler)

# Configurações
$supabaseUrl = "https://vyibcbedcilkxpdrizet.supabase.co"
$supabaseKey = "sb_publishable_9XzL9sIY2ly7Y_PBsEKG1w_xjgsTqtl" # Chave Anon/Pub
$bucketId = "medical-board"
$backupBaseDir = "$PSScriptRoot\backups\attachments"

# Garantir que a pasta de backup existe
if (!(Test-Path $backupBaseDir)) {
    New-Item -ItemType Directory -Path $backupBaseDir -Force | Out-Null
}

Write-Host "--- Iniciando Sincronização de Anexos ---" -ForegroundColor Cyan

function Get-StorageFiles($prefix = "") {
    $url = "$supabaseUrl/storage/v1/object/list/$bucketId"
    $headers = @{
        "apikey"        = $supabaseKey
        "Authorization" = "Bearer $supabaseKey"
        "Content-Type"  = "application/json"
    }
    
    $body = @{
        "prefix" = $prefix
        "limit"  = 100
        "offset" = 0
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri $url -Method Post -Headers $headers -Body $body
        return $response
    }
    catch {
        Write-Host "Erro ao listar arquivos no prefixo '$prefix': $_" -ForegroundColor Red
        return @()
    }
}

function Receive-File($filePath) {
    $localPath = Join-Path $backupBaseDir $filePath.Replace("/", "\")
    $localFolder = Split-Path $localPath
    
    if (!(Test-Path $localFolder)) {
        New-Item -ItemType Directory -Path $localFolder -Force | Out-Null
    }

    if (!(Test-Path $localPath)) {
        Write-Host "Baixando: $filePath" -ForegroundColor Yellow
        $downloadUrl = "$supabaseUrl/storage/v1/object/authenticated/$bucketId/$filePath"
        $headers = @{
            "apikey"        = $supabaseKey
            "Authorization" = "Bearer $supabaseKey"
        }
        
        try {
            Invoke-RestMethod -Uri $downloadUrl -Method Get -Headers $headers -OutFile $localPath
        }
        catch {
            Write-Host "Erro ao baixar ${filePath}: $_" -ForegroundColor Red
        }
    }
    else {
        # Write-Host "Já existe: $filePath" -ForegroundColor DarkGray
    }
}

function Sync-Folder($prefix = "") {
    $items = Get-StorageFiles $prefix
    
    foreach ($item in $items) {
        $fullPath = if ($prefix -eq "") { $item.name } else { "$prefix/$($item.name)" }
        
        if ($null -eq $item.id) {
            # É uma pasta (no Supabase o ID é nulo para diretórios na listagem)
            Sync-Folder $fullPath
        }
        else {
            # É um arquivo
            Receive-File $fullPath
        }
    }
}

# Executar Sincronização
Sync-Folder

Write-Host "--- Sincronização Concluída ---" -ForegroundColor Green
