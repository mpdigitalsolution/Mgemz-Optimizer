$ErrorActionPreference = "Stop"

$argsList = $args

$specKitRef = $env:SPECKIT_REF
if ([string]::IsNullOrWhiteSpace($specKitRef)) {
  $specKitRef = "v0.8.1"
}
$specKitFrom = "git+https://github.com/github/spec-kit.git@$specKitRef"

$specifyCommand = Get-Command specify -ErrorAction SilentlyContinue
if ($null -ne $specifyCommand) {
  & $specifyCommand.Source @argsList
  exit $LASTEXITCODE
}

$uvxLocal = Join-Path $PSScriptRoot "uvx.exe"
if (Test-Path $uvxLocal) {
  & $uvxLocal --from $specKitFrom specify @argsList
  exit $LASTEXITCODE
}

$uvxCommand = Get-Command uvx -ErrorAction SilentlyContinue
if ($null -ne $uvxCommand) {
  & $uvxCommand.Source --from $specKitFrom specify @argsList
  exit $LASTEXITCODE
}

Write-Error "Unable to run Spec Kit. Install Specify via: uv tool install specify-cli --from $specKitFrom (or add uvx to PATH)."
