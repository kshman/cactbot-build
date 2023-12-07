@echo off
echo Build with Powershell 7
rem Change 'pwsh' to 'powershell' if doesn't works
pwsh %~dp0\bldscript.ps1 -NoDll -Npm -Copy
