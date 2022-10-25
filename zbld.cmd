@echo off
echo Build with Powershell 7
rem Change 'pwsh' to 'powershell' if doesn't works
pwsh "%~dp0\zbld.ps1 %*"
