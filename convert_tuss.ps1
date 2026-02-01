$inputFile = "CorrelaoTUSS.202409Rol.2021_TUSS202503_RN643.2025.csv"
$outputFile = "src/data/tuss.js"

$lines = Get-Content $inputFile -Encoding UTF8
$jsContent = "export const TUSS_DATA = [`n"

# Skip the first 2 lines (header and metadata)
for ($i = 2; $i -lt $lines.Count; $i++) {
    $line = $lines[$i]
    if ([string]::IsNullOrWhiteSpace($line)) { continue }
    
    $parts = $line.Split(';')
    if ($parts.Count -lt 2) { continue }
    
    $code = $parts[0].Trim()
    $desc = $parts[1].Trim().Replace("'", "\'").Replace('"', '\"')
    
    # Simple validation to ensure code looks numeric-ish and isn't empty
    if ($code.Length -gt 0) {
        $jsContent += "    { value: `"$code`", label: `"$code - $desc`", code: `"$code`", description: `"$desc`" },`n"
    }
}

$jsContent += "];"
Set-Content -Path $outputFile -Value $jsContent -Encoding UTF8
Write-Host "Conversion complete: $outputFile"
