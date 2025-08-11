Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

# Centralized UI copy
# All modal strings are read from `scripts/welcome-strings.json` so non-technical users can edit copy in one place.
# Keys used:
# - title: window title of the modal
# - message: body text inside the modal
# - goText: label for the proceed button (exits with 0)
# - cancelText: label for the cancel button (exits with 100)

$scriptDir   = Split-Path -Parent $MyInvocation.MyCommand.Path
$stringsPath = Join-Path $scriptDir 'welcome-strings.json'

try {
  $strings = Get-Content -Raw -Path $stringsPath | ConvertFrom-Json
} catch {
  $strings = $null
}

if (-not $strings) {
  # Fallback defaults if JSON is missing/invalid
  $strings = [pscustomobject]@{
    title      = 'OpenGov Startup'
    message    = 'Welcome! Press proceed to continue.'
    goText     = 'Take a walk on the wild side'
    cancelText = 'Bah humbug'
  }
}

$form                = New-Object System.Windows.Forms.Form
$form.Text           = $strings.title  # modal title
$form.StartPosition  = "CenterScreen"
$form.Size           = New-Object System.Drawing.Size(640,460)
$form.TopMost        = $true

# Use a read-only multiline TextBox for reliable wrapping/scrolling
$tb                  = New-Object System.Windows.Forms.TextBox
$tb.Multiline        = $true
$tb.ReadOnly         = $true
$tb.ScrollBars       = 'Vertical'
$tb.BorderStyle      = 'None'
$tb.BackColor        = [System.Drawing.Color]::FromArgb(248,249,250)
$tb.Font             = New-Object System.Drawing.Font('Segoe UI',10)
$tb.Text             = $strings.message  # modal body text
$tb.SetBounds(16,16,596,340)

$btnGo               = New-Object System.Windows.Forms.Button
$btnGo.Text          = $strings.goText   # proceed button label
$btnGo.Font          = New-Object System.Drawing.Font('Segoe UI',9)
$btnGo.Width         = 260
$btnGo.Height        = 34
$btnGo.Add_Click({ $form.Tag = 'proceed'; $form.Close() })

$btnCancel           = New-Object System.Windows.Forms.Button
$btnCancel.Text      = $strings.cancelText  # cancel button label
$btnCancel.Font      = New-Object System.Drawing.Font('Segoe UI',9)
$btnCancel.Width     = 140
$btnCancel.Height    = 34
$btnCancel.Add_Click({ $form.Tag = 'cancel'; $form.Close() })

# Layout buttons
$btnGo.Location      = New-Object System.Drawing.Point(16,370)
$btnCancel.Location  = New-Object System.Drawing.Point(292,370)

$form.Controls.Add($tb)
$form.Controls.Add($btnGo)
$form.Controls.Add($btnCancel)

[void]$form.ShowDialog()

if ($form.Tag -eq 'proceed') { exit 0 } else { exit 100 }




