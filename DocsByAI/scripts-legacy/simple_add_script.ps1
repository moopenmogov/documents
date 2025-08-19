$file = "src\taskpane\taskpane.html"
$lines = Get-Content $file -Encoding UTF8

for ($i = 0; $i -lt $lines.Count; $i++) {
    if ($lines[$i] -match "office\.js") {
        $lines = $lines[0..$i] + "    <script src=`"../../state-matrix-client.js`"></script>" + $lines[($i+1)..($lines.Count-1)]
        break
    }
}

$lines | Set-Content $file -Encoding UTF8
Write-Host "Added script include"
