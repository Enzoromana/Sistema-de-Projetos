$inputFile = "CorrelaoTUSS.202409Rol.2021_TUSS202503_RN643.2025.csv"
$outputFile = "src/data/tuss.json"

if (-not (Test-Path $inputFile)) {
    Write-Error "Input file $inputFile not found!"
    exit
}

# Read content, skip only the very first title line
# Treat the second line as headers if possible, or provide custom ones
$csvData = Get-Content $inputFile -Encoding UTF8 | Select-Object -Skip 1 | ConvertFrom-Csv -Delimiter ";" -Header "Code", "Description"

$jsonData = New-Object System.Collections.Generic.List[PSObject]

foreach ($row in $csvData) {
    $code = $row.Code
    $desc = $row.Description

    if ([string]::IsNullOrWhiteSpace($code) -or $code -eq "Código") { continue }

    $codeStr = $code.ToString().Trim()
    $descStr = if ($desc) { $desc.ToString().Trim() } else { "" }
    
    if ($codeStr.Length -gt 0) {
        $obj = [PSCustomObject]@{
            value       = $codeStr
            label       = "$codeStr - $descStr"
            code        = $codeStr
            description = $descStr
        }
        $jsonData.Add($obj)
    }
}

# Convert to JSON and save using UTF8 without BOM for maximum compatibility
$jsonText = $jsonData | ConvertTo-Json -Depth 10
[System.IO.File]::WriteAllText((Resolve-Path .).Path + "/" + $outputFile, $jsonText, [System.Text.Encoding]::UTF8)

Write-Host "JSON Conversion complete. $($jsonData.Count) items saved to $outputFile"
