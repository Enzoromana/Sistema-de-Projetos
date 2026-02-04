
$TUSS_DATA = @(
    @{ code = "10101012"; label = "10101012 - Consulta em consultório"; description = "Consulta em consultório" },
    @{ code = "10101020"; label = "10101020 - Consulta em domicílio"; description = "Consulta em domicílio" },
    @{ code = "20104010"; label = "20104010 - Teste longo"; description = "Teste longo" }
)

function Search-Tuss ($term) {
    Write-Host "Searching for: '$term'"
    if ($term.Length -lt 2) {
        Write-Host "Term too short"
        return
    }

    $lowerTerm = $term.ToLower().Trim()

    $results = $TUSS_DATA | Where-Object {
        $_.label.ToLower().Contains($lowerTerm) -or ($_.code -and $_.code.ToLower().Contains($lowerTerm))
    }

    # Simulation of sorting logic (approximate)
    $sorted = $results | Sort-Object {
        $code = $_.code.ToLower()
        if ($code -eq $lowerTerm) { return 0 }
        if ($code.StartsWith($lowerTerm)) { return 1 }
        return 2
    }

    $sorted | ForEach-Object { Write-Host " - Found: $($_.code)" }
}

Search-Tuss "10"
Search-Tuss "1010"
Search-Tuss "10101012"
Search-Tuss "Con"
