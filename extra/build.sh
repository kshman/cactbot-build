echo 하 이건 진짜
echo 인젠 셀스크립트까지
echo ----

# 빌드
echo
echo -n 빌드할까요?
read yn

if [ "${yn}" == "y" ] || [ "${yn}" == "0" ] ; then
  echo ㅇㅋ 빌드고!
  npm run build --prefix ..
  echo 빌드가 성공했을까요...
else
	echo 알겠습니다. 빌드 안합니다
fi

# 복사
echo
echo -n 빌드해놓은거 복사할까요?
read yn

if [ "${yn}" != "y" ] && [ "${yn}" != "0" ] ; then
	echo 알겠습니다. 복사는 안합니다
	exit
fi

rm -rf /mnt/d/FF14/act/plugins/cactbot/dist
rm -rf /mnt/d/FF14/act/plugins/cactbot/resources
rm -rf /mnt/d/FF14/act/plugins/cactbot/ui
rm -rf /mnt/d/FF14/act/plugins/cactbot/util
rm -f /mnt/d/FF14/act/plugins/cactbot/*.js
rm -f /mnt/d/FF14/act/plugins/cactbot/*.dll

cp ../bin/x64/Release/Cactbot*.dll /mnt/d/FF14/act/plugins/cactbot/
cp -R ../dist/* /mnt/d/FF14/act/plugins/cactbot/

# 끗
echo
echo 작업이 끝나따!!!
