$excelFile = "c:\Users\Enzo.Romana\Sistema de Projetos\ESPECIALIDADES MEDICAS.xlsx"
$outputFile = "c:\Users\Enzo.Romana\Sistema de Projetos\src\data\specialties.json"

if (-not (Test-Path $excelFile)) {
    Write-Error "Arquivo Excel não encontrado: $excelFile"
    exit
}

try {
    $excel = New-Object -ComObject Excel.Application
    $excel.Visible = $false
    $workbook = $excel.Workbooks.Open($excelFile)
    $sheet = $workbook.Sheets.Item(1)

    $specialties = New-Object System.Collections.Generic.List[string]

    $row = 1
    # Check if first row is header, if so start at row 2
    # For now, let's just collect everything that looks like a specialty
    do {
        $value = $sheet.Cells.Item($row, 1).Text
        if (-not [string]::IsNullOrWhiteSpace($value) -and $value -ne "Especialidade" -and $value -ne "ESPECIALIDADE") {
            $specialties.Add($value.Trim())
        }
        $row++
    } while (-not [string]::IsNullOrWhiteSpace($value) -and $row -lt 1000)

    $workbook.Close($false)
    $excel.Quit()

    # Clean up COM objects
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($sheet) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($workbook) | Out-Null
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
    [System.GC]::Collect()
    [System.GC]::WaitForPendingFinalizers()

    # Convert to JSON and save
    $uniqueSpecialties = $specialties | Sort-Object -Unique
    $json = $uniqueSpecialties | ConvertTo-Json
    $json | Out-File $outputFile -Encoding UTF8

    Write-Host "Extração concluída. $($uniqueSpecialties.Count) especialidades salvas em $outputFile"
}
catch {
    Write-Error "Erro ao processar Excel: $_"
    if ($excel) { $excel.Quit() }
}
