﻿param(
  [switch]$Dll,
  [switch]$NoDll,
  [switch]$Npm,
  [switch]$NoNpm,
  [switch]$Copy,
  [switch]$LintAll,
  [switch]$LintScript,
  [switch]$LintTest,
  [switch]$LintVersion,
  [switch]$LintSync,
  [switch]$Bump
)

'보람찬 작업을 대충했다면!'
'린트를 하던가, 빌드하고 복사를 하자고'
''

# 참고로 에뮬을 돌릴땐
# npm run start

function time {
  $Command = "$args";
  Measure-Command { Invoke-Expression $Command 2>&1 | out-default }
}

function Get-LineWithMesg([string] $msg) {
  $in = Read-Host $msg
  return $in
}

function New-QuestionYesNo([string] $msg) {
  do {
    $m = "{0} ('Y0 ' 앞으로 / 'N.' 그만)" -f $msg
    $in = Read-Host $m
    $in = $in.ToUpper()

    if ($in -eq 'Y') { return $TRUE }
    if ($in -eq '0') { return $TRUE }
    if ($in -eq ' ') { return $TRUE }
    if ($in -eq 'N') { return $FALSE }
    if ($in -eq '.') { return $FALSE }
    if ($in -eq '') { return $FALSE }
  } while ($TRUE)
}

function Remove-Directory([string] $path) {
  if (Test-Path $path) {
    Remove-Item ($path + "\*") -Recurse -Force
    Remove-Item $path -Recurse -Force
  }
}

function Exit-ForError([string] $mesg, [int] $ecode) {
  if ($mesg.Length -ne 0) { Read-Host $mesg }
  else { Read-Host "오류가 있어요" }
  exit $ecode
}

function Update-VersionInfo {
  param ([string] $Filename, [string] $Find)
  try {
    $text = [System.IO.File]::ReadAllText($Filename);
    $len = $Find.Length
    $start = $text.IndexOf($Find)
    if ($start -le 0) {
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
  catch {
    Write-Host "아니... 파일이 없나봄미"
  }
}

#
# 여기가 시작
#

if ($Bump -eq $TRUE)
{
  Write-Host "버전을 올릴꺼예요"
  Update-VersionInfo '../plugin/CactbotEventSource/Properties/AssemblyInfo.cs' 'AssemblyVersion("99.'
  Update-VersionInfo '../plugin/CactbotEventSource/Properties/AssemblyInfo.cs' 'AssemblyFileVersion("99.'
  Update-VersionInfo '../plugin/CactbotOverlay/Properties/AssemblyInfo.cs' 'AssemblyVersion("99.'
  Update-VersionInfo '../plugin/CactbotOverlay/Properties/AssemblyInfo.cs' 'AssemblyFileVersion("99.'
  Update-VersionInfo '../package.json' '"version": "99.'
  Read-Host "버전을 확인하기 위해 멈췄어요"
  exit 0
}

# 린트라면
if ($LintAll -eq $TRUE -or $LintScript -eq $TRUE -or $LintTest -eq $TRUE -or  $LintVersion -eq $TRUE -or $LintSync -eq $TRUE) {
   if ($LintAll -eq $TRUE -or $LintVersion -eq $TRUE) {
    Write-Host '린트 - 버전'
    npm run validate-versions
    if (-not $?) { Exit-ForError('버전', 17) }
   }

  if ($LintAll -eq $TRUE) {
    Write-Host '린트 - 마크다운'
    npm run markdownlint
    if (-not $?) { Exit-ForError('마크 다운', 11) }

    Write-Host '린트 - CSS'
    npm run stylelint
    if (-not $?) { Exit-ForError('CSS', 12) }

    #'린트 - SYNC FILES'
    #npm run sync-files
    #if (-not $?) { exit 1 }
  }

  if ($LintAll -eq $TRUE -or $LintScript -eq $TRUE) {
    Write-Host '린트 - 타입스크립트 검사'
    npm run tsc-no-emit
    if (-not $?) { Exit-ForError('타입스크립트 검사', 13) }

    Write-Host '린트 - 스크립트'
    npm run lint
    if (-not $?) { Exit-ForError('스크립트', 14) }
  }
  if ($LintAll -eq $TRUE -or $LintTest -eq $TRUE) {
    Write-Host '린트 - 테스트'
    npm test
    if (-not $?) { Exit-ForError('테스트', 15) }

    #'린트 - 프로세스 트리거'
    #npm run process-triggers
    #if (-not $?) { Exit-ForError('프로세스 트리거', 16) }
  }
  if ($LintSync -eq $TRUE) {
    Write-Host '린트 - 연동 파일 검사'
    npm run sync-files
    if (-not $?) { Exit-ForError('연동 파일 검사', 17) }
  }

  Write-Host ''
  Write-Host '린트 종료'
  exit 0
}

# 빌드라면
$act = $env:APPDATA + "\Advanced Combat Tracker"
$dest = "$act\Plugins\cactbot"
Write-Host "ACT 디렉터리: $act"
Write-Host "cactbot 디렉터리: $dest"

try {
  # 플러그인
  ''
  $doBuildDll = $FALSE
  if ($Dll -eq $FALSE -And $NoDll -eq $FALSE) {
    $doBuildDll = New-QuestionYesNo "DLL 빌드 할거임?"
  } else {
    if ($Dll -eq $TRUE) {
      $doBuildDll = $TRUE
    }
    if ($NoDll -eq $TRUE) {
      $doBuildDll = $FALSE
    }
  }

  if ($doBuildDll -eq $TRUE) {
    $vspath = $Env:VS_PATH
    if (-not (Test-Path "$vspath")) {
      # 보통이런식 → C:\Program Files\Microsoft Visual Studio\2022\Community
      Get-LineWithMesg "DLL 빌드하려면 VS_PATH 환경 변수를 미리 지정해야함요..."
      exit 1
    } else {
      $ENV:PATH = "$vspath\MSBuild\Current\Bin;${ENV:PATH}";
      msbuild -p:Configuration=Release -p:Platform=x64 "..\plugin\Cactbot.sln" -t:rebuild
      if (-not $?) {
        Get-LineWithMesg "엇.... msbuild 오류가 있네요"
        exit 1
      }
    }
  }

  # NPM
  ''
  $doBuildNpm = $TRUE
  if ($Npm -eq $FALSE -And $NoNpm -eq $FALSE) {
    $doBuildNpm = New-QuestionYesNo "NPM 빌드 할거임?"
  }
  else {
    if ($Npm -eq $TRUE) {
      $doBuildDll = $TRUE
    }
    if ($NoNpm -eq $TRUE) {
      $doBuildDll = $FALSE
    }
  }

  if ($doBuildNpm -eq $TRUE) {
    Get-ChildItem ..\dist\* | Remove-Item -Recurse
    npm run build --prefix ..
    if (-not $?) {
      Get-LineWithMesg "엇.... npm 오류가 있네요"
      exit 1
    }
  }

  if ($doBuildDll -eq $TRUE -Or $doBuildNpm -eq $TRUE) {
    ''
    $doCopy = $TRUE
    if ($Copy -eq $FALSE) {
      $doCopy = New-QuestionYesNo "빌드한거 복사하실랑까요?"
    }
    if ($doCopy -eq $TRUE) {
      # 플러그인 복사
      if ($doBuildDll -eq $TRUE) {
        Write-Host '플러그인 복사'
        Remove-Item "$dest\*.dll"
        Copy-Item "..\bin\x64\Release\Cactbot*.dll" -Destination "$dest" -Force
      }

      # 데이터 복사
      if ($doBuildNpm -eq $TRUE) {
        Write-Host 'DIST 복사'
        Remove-Directory "$dest\dist"
        Remove-Directory "$dest\resources"
        Remove-Directory "$dest\ui"
        Remove-Directory "$dest\util"
        Remove-Directory "$dest\zh"
        Remove-Item "$dest\*.js"
        Copy-Item "..\dist\*" -Destination "$dest" -Recurse -Force
      }
    }
  }

  Write-Host ''
  Write-Host 'ㅇㅋ 끝나쓰요!!!'
}
catch {
  Write-Host ''
  Write-Host '오류가 나쓰요!!!'

  Write-Error $Error[0]
  Get-LineWithMesg "확인하기 위해 멈췄스요"
}

exit 0
