$inputFile = "CorrelaoTUSS.202409Rol.2021_TUSS202503_RN643.2025.csv"
$outputFile = "src/data/tuss.json"

# Read content, skip metadata, convert from CSV
$csvData = Get-Content $inputFile -Encoding UTF8 | Select-Object -Skip 1 | ConvertFrom-Csv -Delimiter ";"

$jsonData = @()

foreach ($row in $csvData) {
    # Get properties by index to avoid header naming issues
    $props = $row.PSObject.Properties | Select-Object -ExpandProperty Name
    $code = $row.$($props[0])
    $desc = $row.$($props[1])

    if ([string]::IsNullOrWhiteSpace($code)) { continue }

    $code = $code.Trim()
    $desc = $desc.ToString().Trim()
    
    if ($code.Length -gt 0) {
        $jsonData += @{
            value       = $code
            label       = "$code - $desc"
            code        = $code
            description = $desc
        }
    }
}

# Convert to JSON and save
$jsonData | ConvertTo-Json -Depth 10 | Set-Content -Path $outputFile -Encoding UTF8
Write-Host "JSON Conversion complete. File saved to $outputFile"
