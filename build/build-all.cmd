@echo off
echo Build with Powershell 7
rem Change 'pwsh' to 'powershell' if doesn't works
rem �������� ������ �̰�����... ��������Ⱑ ������
rem pwsh "%~dp0\build.ps1 %*"
pwsh %~dp0\bldscript.ps1 -Dll -Npm -Copy
