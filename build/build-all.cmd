@echo off
echo Build with Powershell 7
rem Change 'pwsh' to 'powershell' if doesn't works
rem 오리지날 실행은 이거지만... 묻고따지기가 귀찮지
rem pwsh "%~dp0\build.ps1 %*"
pwsh %~dp0\bldscript.ps1 -Dll -Npm -Copy
