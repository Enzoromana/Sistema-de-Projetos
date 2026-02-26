# ============================================================
# ATUALIZAÇÃO DA BASE DO GUIA MÉDICO - Hub Manager Klini
# ============================================================
# Objetivo: Baixar dados atualizados da API e regenerar JSONs locais
# Uso: .\update_guia_base.ps1
# ============================================================

$GUIA_API_BASE = "https://guia-medico.klinisaude.com.br"
$DATA_DIR = "$PSScriptRoot\public\data\guia-medico"
$PRODUTOS_DIR = "$DATA_DIR\produtos"
$PRODUTOS_INDEX = "$DATA_DIR\produtos.json"

# Garantir que as pastas existem
if (!(Test-Path $PRODUTOS_DIR)) {
    New-Item -ItemType Directory -Path $PRODUTOS_DIR -Force | Out-Null
}

Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  ATUALIZACAO DA BASE DO GUIA MEDICO" -ForegroundColor Cyan
Write-Host "  $(Get-Date -Format 'dd/MM/yyyy HH:mm:ss')" -ForegroundColor DarkGray
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host ""

# ----- ETAPA 1: Ler o indice atual de produtos -----
Write-Host "[1/3] Lendo indice de produtos..." -ForegroundColor Yellow

if (!(Test-Path $PRODUTOS_INDEX)) {
    Write-Error "Arquivo de indice nao encontrado: $PRODUTOS_INDEX"
    exit 1
}

$rawJson = Get-Content $PRODUTOS_INDEX -Raw -Encoding UTF8
$jsonObj = $rawJson | ConvertFrom-Json
$produtosIndex = $jsonObj.produtos

if ($null -eq $produtosIndex) {
    Write-Error "A propriedade 'produtos' nao foi encontrada no JSON."
    exit 1
}

$totalProdutos = $produtosIndex.Count
Write-Host "      $totalProdutos produtos encontrados no indice." -ForegroundColor Green

# ----- ETAPA 2: Baixar dados de cada produto da API -----
Write-Host ""
Write-Host "[2/3] Baixando dados atualizados da API..." -ForegroundColor Yellow

$resultados = @()
$erros = @()
$atualizados = 0

foreach ($produto in $produtosIndex) {
    $codigo = $produto.codigo_rede
    $nome = $produto.nome
    
    if ([string]::IsNullOrWhiteSpace($codigo) -or [string]::IsNullOrWhiteSpace($nome)) {
        Write-Host "      -> Pulando produto com dados incompletos" -ForegroundColor Gray
        continue
    }
    
    $outputFile = "$PRODUTOS_DIR\$codigo.json"

    Write-Host "      -> $nome ($codigo)... " -NoNewline

    try {
        $response = Invoke-RestMethod -Uri "$GUIA_API_BASE/api/produto?nome=$([System.Uri]::EscapeDataString($nome))" -Method Get -TimeoutSec 60

        if ($response.dados -and $response.dados.Count -gt 0) {
            $prestadores = $response.dados
            $totalRegistros = $prestadores.Count

            # Calcular municipios e estados unicos
            $municipios = @{}
            $estados = @{}
            foreach ($p in $prestadores) {
                $mun = if ($p.municipio) { $p.municipio } elseif ($p.endereco -and $p.endereco.municipio) { $p.endereco.municipio } else { "" }
                $uf = if ($p.uf) { $p.uf } elseif ($p.endereco -and $p.endereco.uf) { $p.endereco.uf } else { "" }
                if ($mun) { $municipios[$mun.ToUpper()] = $true }
                if ($uf) { $estados[$uf.ToUpper()] = $true }
            }

            # Montar o JSON do produto
            $produtoData = [ordered]@{
                codigo_rede       = $codigo
                nome_rede         = $nome
                total_prestadores = $totalRegistros
                data_atualizacao  = (Get-Date -Format "yyyy-MM-dd")
                prestadores       = $prestadores
            }

            $jsonText = $produtoData | ConvertTo-Json -Depth 10 -Compress:$false
            [System.IO.File]::WriteAllText($outputFile, $jsonText, [System.Text.UTF8Encoding]::new($false))

            $resultados += [PSCustomObject]@{
                Codigo     = $codigo
                Nome       = $nome
                Registros  = $totalRegistros
                Municipios = $municipios.Count
                Estados    = $estados.Count
            }

            $atualizados++
            Write-Host "$totalRegistros registros" -ForegroundColor Green
        }
        else {
            Write-Host "SEM DADOS" -ForegroundColor Red
            $erros += "$codigo ($nome): API retornou dados vazios"
        }
    }
    catch {
        Write-Host "ERRO" -ForegroundColor Red
        $erros += "$codigo ($nome): $($_.Exception.Message)"
    }
}

# ----- ETAPA 3: Regenerar o indice produtos.json -----
Write-Host ""
Write-Host "[3/3] Regenerando indice produtos.json..." -ForegroundColor Yellow

$novoIndex = @()
$processados = @{}

# Adicionar os que foram atualizados agora
foreach ($r in $resultados) {
    if (!$processados.ContainsKey($r.Codigo)) {
        $novoIndex += [ordered]@{
            codigo_rede = $r.Codigo
            nome        = $r.Nome
            registros   = $r.Registros
            municipios  = $r.Municipios
            estados     = $r.Estados
        }
        $processados[$r.Codigo] = $true
    }
}

# Manter no indice os produtos que falharam ou nao foram processados (usando dados antigos)
foreach ($produto in $produtosIndex) {
    if (!$processados.ContainsKey($produto.codigo_rede) -and ![string]::IsNullOrWhiteSpace($produto.codigo_rede)) {
        $novoIndex += [ordered]@{
            codigo_rede = $produto.codigo_rede
            nome        = $produto.nome
            registros   = $produto.registros
            municipios  = $produto.municipios
            estados     = $produto.estados
        }
        $processados[$produto.codigo_rede] = $true
    }
}

$finalOutput = [ordered]@{
    data_atualizacao = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    produtos         = $novoIndex
}

$indexJson = $finalOutput | ConvertTo-Json -Depth 5
[System.IO.File]::WriteAllText($PRODUTOS_INDEX, $indexJson, [System.Text.UTF8Encoding]::new($false))
Write-Host "      Indice salvo com $($novoIndex.Count) produtos." -ForegroundColor Green

# ----- RESUMO -----
Write-Host ""
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  RESUMO DA ATUALIZACAO" -ForegroundColor Cyan
Write-Host "====================================================" -ForegroundColor Cyan
Write-Host "  Produtos no indice: $totalProdutos" -ForegroundColor White
Write-Host "  Produtos atualizados: $atualizados" -ForegroundColor $(if ($atualizados -eq $totalProdutos) { "Green" } else { "Yellow" })

if ($erros.Count -gt 0) {
    Write-Host ""
    Write-Host "  ERROS ($($erros.Count)):" -ForegroundColor Red
    foreach ($e in $erros) {
        Write-Host "    - $e" -ForegroundColor Red
    }
}

Write-Host ""
Write-Host "  Proximo passo: git add . && git commit -m 'chore: update guia medico data' && git push" -ForegroundColor DarkGray
Write-Host ""
