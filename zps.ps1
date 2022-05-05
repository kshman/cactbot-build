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

# 디스트 삭제
Get-ChildItem .\dist\* | Remove-Item -Recurse

''
'NPM 빌드'
$yn = New-QuestionYesNo "NPM 빌드 할거임?"
if ($yn -eq $TRUE)
{
	& npm run build
}

''
'빌드가 성공했다면 계속하면 되능것'
$yn = New-QuestionYesNo "빌드가 성공했다면 진행해도 됨"
if ($yn -eq $FALSE) { exit 0 }

# 대상 디렉터리 삭제
Remove-Directory "D:\FF14\act\Plugins\cactbot\dist" 
Remove-Directory "D:\FF14\act\Plugins\cactbot\resources"
Remove-Directory "D:\FF14\act\Plugins\cactbot\ui"
Remove-Directory "D:\FF14\act\Plugins\cactbot\util"
Remove-Directory "D:\FF14\act\Plugins\cactbot\zh"
Remove-Item "D:\FF14\act\Plugins\cactbot\*.js"
Remove-Item "D:\FF14\act\Plugins\cactbot\*.dll"

# 플러그인 복사
'플러그인 복사'
Copy-Item ".\bin\x64\Release\Cactbot*.dll" -Destination "D:\FF14\act\Plugins\cactbot" -Force
#Copy-Item ".\bin\x64\Release\zh" -Destination "D:\FF14\act\Plugins\cactbot" -Recurse -Force

# 데이터 복사
'데이터 복사'
Copy-Item ".\dist\*" -Destination "D:\FF14\act\Plugins\cactbot" -Recurse -Force

''
'끗!!!'
Read-Host "아무거나 누르면 나갈거임..."
exit 0
