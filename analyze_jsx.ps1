param()
$filePath = 'src\components\MedicalControl.jsx'
$lines = Get-Content $filePath -Encoding UTF8

$balance = 0
$lineNum = 0
$inTemplate = $false

foreach ($line in $lines) {
    $lineNum++

    $backtickCount = ($line.ToCharArray() | Where-Object { $_ -eq [char]96 }).Count
    if ($backtickCount % 2 -ne 0) {
        $inTemplate = -not $inTemplate
    }
    if ($inTemplate) { continue }

    $opens = ([regex]::Matches($line, '<div[\s>]')).Count
    $closes = ([regex]::Matches($line, '</div\s*>')).Count
    $delta = $opens - $closes

    if ($delta -ne 0) {
        $balance += $delta
    }
    
    # Print balance at key lines
    if ($lineNum -ge 2838 -and $lineNum -le 2845) {
        $trimmed = $line.Trim()
        if ($trimmed.Length -gt 60) { $trimmed = $trimmed.Substring(0, 60) + '...' }
        Write-Host ("L{0,4}  delta={1,3}  bal={2,4}  {3}" -f $lineNum, $delta, $balance, $trimmed)
    }
}
Write-Host ""
Write-Host ("=== FINAL BALANCE: {0} ===" -f $balance)
