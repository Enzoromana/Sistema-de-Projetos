$inputFile = "CorrelaoTUSS.202409Rol.2021_TUSS202503_RN643.2025.csv"
$outputFile = "src/data/tuss.js"

# Read content, skip the first metadata line, and convert from CSV dealing with delimiter and encoding
$csvData = Get-Content $inputFile -Encoding UTF8 | Select-Object -Skip 1 | ConvertFrom-Csv -Delimiter ";"

$jsContent = "export const TUSS_DATA = [`n"

foreach ($row in $csvData) {
    # Access columns by their likely names (first column is Code, second is Description)
    # PS objects from CSV have properties based on headers.
    # Header line in CSV: Código;Terminologia de Procedimentos...
    
    # We get values by position to be safer against header name changes, or just use the property names if we know them.
    # Since headers might have special chars, let's look at the PSObject properties.
    $props = $row.PSObject.Properties | Select-Object -ExpandProperty Name
    $code = $row.$($props[0])
    $desc = $row.$($props[1])

    if ([string]::IsNullOrWhiteSpace($code)) { continue }

    # Sanitize inputs for JS string inclusion
    $code = $code.Trim()
    # Escape backslashes first, then double quotes. Remove newlines.
    $desc = $desc.ToString().Replace("\", "\\").Replace('"', '\"').Replace("`r", "").Replace("`n", " ").Trim()
    
    # Validation: Ensure code is numeric-ish (sometimes they have dots, just ensure not empty)
    if ($code.Length -gt 0) {
        $jsContent += "    { value: `"$code`", label: `"$code - $desc`", code: `"$code`", description: `"$desc`" },`n"
    }
}

$jsContent += "];"
Set-Content -Path $outputFile -Value $jsContent -Encoding UTF8
Write-Host "Conversion complete. Rows processed: $($csvData.Count)"
