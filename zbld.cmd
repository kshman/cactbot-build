@echo off
echo 파워쉘7로 빌드합니다.
rem 이거 안되면 pwsh 를 powershell로 고치셈
pwsh "%~dp0\zbld.ps1 %*"
