@echo off
echo Build with Powershell 7
rem Change 'pwsh' to 'powershell' if doesn't works
pwsh %~dp0\build.ps1 -ParamDll true -ParamNpm true -ParamCopy true
