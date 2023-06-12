# Requires -RunAsAdministrator

'보람찬 작업을 대충했다면!'
'빌드하고 복사를 하자고'
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

#
# 여기가 시작
#

$act = $env:APPDATA + "\Advanced Combat Tracker"
$dest = "$act\Plugins\cactbot"
"ACT 디렉터리: $act"
"cactbot 디렉터리: $dest"

try {
  # 플러그인
  ''
  $dllbuild = New-QuestionYesNo "DLL 빌드 할거임?"
  if ($dllbuild -eq $TRUE) {
    $vspath = $Env:VS_PATH
    if (-not (Test-Path "$vspath")) {
      # 보통이런식 → C:\Program Files\Microsoft Visual Studio\2022\Community
      Get-LineWithMesg "DLL 빌드하려면 VS_PATH 환경 변수를 미리 지정해야함요..."
      exit 1
    }
    else {
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
  $npmbuild = New-QuestionYesNo "NPM 빌드 할거임?"
  if ($npmbuild -eq $TRUE) {
    Get-ChildItem ..\dist\* | Remove-Item -Recurse
    npm run build --prefix ..
    if (-not $?) {
      Get-LineWithMesg "엇.... npm 오류가 있네요"
      exit 1
    }
  }

  if ($dllbuild -eq $TRUE -Or $npmbuild -eq $TRUE) {
    ''
    $yn = New-QuestionYesNo "빌드한거 복사하실랑까요?"
    if ($yn -eq $TRUE) {
      # 플러그인 복사
      if ($dllbuild -eq $TRUE) {
        '플러그인 복사'
        Remove-Item "$dest\*.dll"
        Copy-Item "..\bin\x64\Release\Cactbot*.dll" -Destination "$dest" -Force
      }

      # 데이터 복사
      if ($npmbuild -eq $TRUE) {
        'DIST 복사'
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

  ''
#  $yn = New-QuestionYesNo "실행 할까요? (runas 뜰수도 이씀)"
#  if ($yn -eq $TRUE) {
#    $actexe = "$act\Advanced Combat Tracker.exe"
#    Start-Process -FilePath $actexe -Verb runAs
#  }

  ''
  'ㅇㅋ 끝나쓰요!!!'
}
catch {
  ''
  '오류가 나쓰요!!!'

  Write-Error $Error[0]
  Get-LineWithMesg "확인하기 위해 멈췄스요"
}

exit 0
