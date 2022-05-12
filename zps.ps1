# Requires -RunAsAdministrator

'하.. 힘들다'
'빌드하고 복사를 하자고'
''

# 참고로 에뮬을 돌릴땐
# npm run start

function time
{
        $Command = "$args";
        Measure-Command { Invoke-Expression $Command 2>&1 | out-default}
}

function New-QuestionYesNo([string] $msg)
{
	do
	{
		$m = "{0} ('Y0 '은 앞으로 'N'은 그만둠)" -f $msg
		$in = Read-Host $m
		$in = $in.ToUpper()

		if ($in -eq 'Y') { return $TRUE }
		if ($in -eq '0') { return $TRUE }
		if ($in -eq ' ') { return $TRUE }
		if ($in -eq 'N') { return $FALSE }
	} while ($TRUE)
}

function Remove-Directory([string] $path)
{
	if (Test-Path $path)
	{
		Remove-Item ($path + "\*") -Recurse -Force
		Remove-Item $path -Recurse -Force
	}
}

#
# 여기가 시작
#

$act = $env:APPDATA + "\Advanced Combat Tracker"
$dest = "$act\Plugins\cactbot"
"ACT 디렉터리: $act"
"cactbot 디렉터리: $dest"

# NPM
''
$npmbuild = New-QuestionYesNo "NPM 빌드 할거임?"
if ($npmbuild -eq $TRUE)
{
  Get-ChildItem .\dist\* | Remove-Item -Recurse
	& npm run build

  ''
  'NPM빌드했음.'
}

''
$yn = New-QuestionYesNo "복사하실랑까요?"
if ($yn -eq $FALSE) { exit 0 }

# 플러그인 복사
'플러그인 복사'
Remove-Item "$dest\*.dll"
Copy-Item ".\bin\x64\Release\Cactbot*.dll" -Destination "$dest" -Force

# 데이터 복사
if ($npmbuild -eq $TRUE)
{
  'DIST 복사'
  Remove-Directory "$dest\dist"
  Remove-Directory "$dest\resources"
  Remove-Directory "$dest\ui"
  Remove-Directory "$dest\util"
  Remove-Directory "$dest\zh"
  Remove-Item "$dest\*.js"
  Copy-Item ".\dist\*" -Destination "$dest" -Recurse -Force
}

''
$yn = New-QuestionYesNo "실행도할까요?"
if ($yn -eq $TRUE)
{
  $actexe = "$act\Advanced Combat Tracker.exe"
  Start-Process -FilePath $actexe -Verb runAs
}

''
'끗!!!'

exit 0
