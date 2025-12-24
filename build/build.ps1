'보람찬 작업을 대충했다면!'
'린트를 하던가, 빌드하고 복사를 하자고'
''

# 참고로 에뮬을 돌릴땐
# npm run start

# 파워쉘 명령줄로 실행할 땐
# pwsh %~dp0\bldscript.ps1 %*

function Get-LineWithMesg([string] $msg)
{
  $in = Read-Host $msg
  return $in
}

function Get-MenuAction()
{
  $menu = @(
    '1. 모두 빌드',
    '2. NPM 빌드',
    '3. 린트',
    '4. 린트 (스크립트)',
    '5. 린트 (싱크 + 테스트)',
    '6. 린트 (버전)',
    '7. 싱크',
    '9. 에뮬레이터',
    '0. 버전 업데이트',
    '=. 오피샬 Pull',
    '공백은 종료'
  )
  Write-Host ''
  Write-Host 'Cactbot-Build 스크립트' -ForegroundColor Green
  $menu | ForEach-Object { Write-Host $_ }
  $in = Read-Host "메뉴를 선택하세요"
  return $in
}

function New-QuestionYesNo([string] $msg)
{
  do {
    $m = "{0} ('Y0⏎' 앞으로 / 'N. ' 그만)" -f $msg
    $in = Read-Host $m
    $in = $in.ToUpper()

    if ($in -eq 'Y') { return $TRUE }
    if ($in -eq '0') { return $TRUE }
    if ($in -eq '') { return $TRUE }
    if ($in -eq 'N') { return $FALSE }
    if ($in -eq '.') { return $FALSE }
    if ($in -eq ' ') { return $FALSE }
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

function Exit-ForError([string] $mesg, [int] $ecode)
{
  if ($mesg.Length -ne 0) { Read-Host $mesg }
  else { Read-Host "오류가 있어요" }
  exit $ecode
}

function Update-VersionInfo
{
  param ([string] $Filename, [string] $Find)
  try
  {
    $text = [System.IO.File]::ReadAllText($Filename);
    $len = $Find.Length
    $start = $text.IndexOf($Find)
    if ($start -le 0)
    {
      Write-Host "리드가 없어요!"
      return
    }
    $end = $text.IndexOf('.0', $start);
    $curv = [int]$text.Substring($start + $len, $end - $start - $len);
    $nxtv = $curv + 1
    Write-Host "버전 변경: $curv 🡺 $nxtv ($Filename)"

    $res = $text.Substring(0, $start + $len) + [string]$nxtv + $text.Substring($end);
    [System.IO.File]::WriteAllText($Filename, $res)
  }
  catch
  {
    Write-Host "아니... 파일이 없나봄미"
  }
}

#
# 여기가 시작
#

$act = $env:APPDATA + "\Advanced Combat Tracker"
$dest = "$act\Plugins\cactbot"
Write-Host "ACT 디렉터리: $act"
Write-Host "cactbot 디렉터리: $dest"
''

$in = Get-MenuAction
''

# 오피샬 풀링
if ($in -eq '=')
{
  Write-Host '오피샬 풀링'
  $save = Get-Location
  Set-Location ..\..\cactbot-fork
  git pull
  Set-Location $save
  Get-LineWithMesg "결과를 보기 위해 멈췄스요"
}

# 버전업
if ($in -eq '0')
{
  Write-Host "버전을 올릴꺼예요"
  Update-VersionInfo '../plugin/CactbotEventSource/Properties/AssemblyInfo.cs' 'AssemblyVersion("99.'
  Update-VersionInfo '../plugin/CactbotEventSource/Properties/AssemblyInfo.cs' 'AssemblyFileVersion("99.'
  Update-VersionInfo '../plugin/CactbotOverlay/Properties/AssemblyInfo.cs' 'AssemblyVersion("99.'
  Update-VersionInfo '../plugin/CactbotOverlay/Properties/AssemblyInfo.cs' 'AssemblyFileVersion("99.'
  Update-VersionInfo '../package.json' '"version": "99.'
  Get-LineWithMesg "버전을 확인하기 위해 멈췄어요"
}

# 에뮬레이터
if ($in -eq '9')
{
  Write-Host '에뮬레이터 실행'
  $save = Get-Location
  Set-Location ..
  npm run start -- --port 18767
  Set-Location $save
}

# 싱크
if ($in -eq '7')
{
  Write-Host '싱크'
  $save = Get-Location
  Set-Location ..
  #node --loader ts-node/esm .\util\sync_files.ts 2> $null
  node --loader ts-node/esm .\util\sync_files.ts
  if (-not $?)
  {
    Set-Location $save
    Exit-ForError('싱크 오류', 71)
  }
  Set-Location $save
}

# 린트 (스크립트)
if ($in -eq '4' -or $in -eq '3')
{
  cd ..

  Write-Host '린트 (타입스크립트)'
  npm run tsc-no-emit
  if (-not $?) { Exit-ForError('타입스크립트', 41) }

  Write-Host '린트 (스크립트)'
  npm run lint
  if (-not $?) { Exit-ForError('스크립트', 42) }
}

# 린트 (버전)
if ($in -eq '6' -or $in -eq '3')
{
  Write-Host '린트 (버전)'
  npm run validate-versions
  if (-not $?) { Exit-ForError('버전', 17) }
}

# 린트 (싱크 + 테스트)
if ($in -eq '5' -or $in -eq '3')
{
  Write-Host '린트 (싱크)'
  npm run sync-files
  if (-not $?) { Exit-ForError('싱크', 51) }

  Write-Host '린트 (테스트)'
  npm test
  if (-not $?) { Exit-ForError('테스트', 52) }
}

# 그 밖에 린트
if ($in -eq '3')
{
  Write-Host '린트 (마크다운)'
  npm run markdownlint
  if (-not $?) { Exit-ForError('마크다운', 31) }

  Write-Host '린트 (CSS)'
  npm run stylelint
  if (-not $?) { Exit-ForError('CSS', 32) }

  Write-Host '린트 - 버전'
  npm run validate-versions
  if (-not $?) { Exit-ForError('버전', 33) }
}

# 플러그인 빌드 예전꺼
if ($in -eq '9999')
{
  $vspath = $Env:VS_PATH
  if (-not (Test-Path "$vspath"))
  {
    # 보통이런식 → C:\Program Files\Microsoft Visual Studio\2022\Community
    Get-LineWithMesg "DLL 빌드하려면 VS_PATH 환경 변수를 미리 지정해야함요..."
    exit 11
  }
  else
  {
    $ENV:PATH = "$vspath\MSBuild\Current\Bin;${ENV:PATH}";
    msbuild -p:Configuration=Release -p:Platform=x64 "..\plugin\Cactbot.sln" -t:rebuild
    if (-not $?) {
      Get-LineWithMesg "엇.... msbuild 오류가 있네요"
      exit 12
    }
  }
}

# 플러그인 빌드
if ($in -eq '1')
{
  $vspath = "C:\Program Files\Microsoft Visual Studio\18\Community"
  $ENV:PATH = "$vspath\MSBuild\Current\Bin;${ENV:PATH}";
  msbuild -p:Configuration=Release -p:Platform=x64 "..\plugin\Cactbot.sln" -t:rebuild
  if (-not $?) {
    Get-LineWithMesg "엇.... msbuild 오류가 있네요"
    exit 12
  }
}

# NPM 빌드
if ($in -eq '2' -or $in -eq '1')
{
  Write-Host 'NPM 빌드'
  Get-ChildItem ..\dist\* | Remove-Item -Recurse
  npm run build --prefix ..
  if (-not $?) {
    Get-LineWithMesg "엇.... npm 오류가 있네요"
    exit 1
  }
}

# 플러그인 복사
if ($in -eq '1')
{
  Write-Host '플러그인 복사'
  Remove-Item "$dest\*.dll"
  Copy-Item "..\bin\x64\Release\Cactbot*.dll" -Destination "$dest" -Force
}

# NPM 복사
if ($in -eq '2' -or $in -eq '1')
{
  Write-Host 'DIST 복사'
  Remove-Directory "$dest\dist"
  Remove-Directory "$dest\resources"
  Remove-Directory "$dest\ui"
  Remove-Directory "$dest\util"
  Remove-Directory "$dest\zh"
  Remove-Item "$dest\*.js"
  Copy-Item "..\dist\*" -Destination "$dest" -Recurse -Force
}

Write-Host ''
Write-Host 'ㅇㅋ 끝나쓰요!!!'
exit 0
