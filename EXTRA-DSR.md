# DSR 사용자 정의 기능 설명

이 기능은 사실 고정 팀을 위한 거예요. 야생의 파티에서는 적용이 힘들 수도 있어요.

* 우선 사용자 데이터를 만들거나 고쳐야 해요. cactbot 디렉터리 아래 user 또는 사용자가 따로 지정한 위치에 들어가 보세요. (아래 그림에서는 "D:\FF14\act\Plugins\cactbot\user\"가 되겠네요)

![image](https://user-images.githubusercontent.com/7216647/206669751-8ff8d05c-08c6-494b-932d-672a43777677.png)

* 사용자 파일을 고칠거예요. 잘 모르면 raidboss.js 파일을 고치면 되요. 혹시 이 파일이 없으면 raidboss-example.js의 이름을 raidboss.js로 고치세요.
* 위에 example 기준으로 설명하면 파일 맨 아래에 다음 내용을 추가하세요

```typescript
Options.Triggers.push({
    zoneId: ZoneId.DragonsongsRepriseUltimate,
    timelineTriggers: [{
      id: 'DSR+ 데이터 설정',
      regex: /--setup--/,
      run: (data) => {
        data.prsParty = [
          { r: 'MT', j: 'WAR', sp: 'ST', sc: 1, li: 9, ni: 0, nt: '🡼', wi: 0, n: '전사' },
          { r: 'ST', j: 'DRK', sp: 'MT', sc: 2, li: 9, ni: 1, nt: '🡽', wi: 1, n: '다크 나이트' },
          { r: 'H1', j: 'WHM', sp: 'H2', sc: 1, li: 0, ni: 2, nt: '🡿', wi: 2, n: '뱅마' },
          { r: 'H2', j: 'SCH', sp: 'H1', sc: 2, li: 1, ni: 3, nt: '🡾', wi: 3, n: '스콜라' },
          { r: 'D1', j: 'MNK', sp: 'D2', sc: 1, li: 2, ni: 4, nt: '🡿', wi: 7, n: '몽크' },
          { r: 'D2', j: 'RPR', sp: 'D1', sc: 2, li: 3, ni: 5, nt: '🡾', wi: 6, n: '낫쟁이' },
          { r: 'D3', j: 'DNC', sp: 'D4', sc: 1, li: 4, ni: 6, nt: '🡼', wi: 5, n: '춤꾼' },
          { r: 'D4', j: 'SMN', sp: 'D3', sc: 2, li: 5, ni: 7, nt: '🡽', wi: 4, n: '서모너' },
        ];
      },
    },],
});
```

* 이제 내용을 보고 고쳐볼까요. 보다시피 왠지 r, j, n은 딱 봐도 역할/잡/이름 같죠? 예제라서 저렇게 이름 지은거니 오해는 하지 마세요. 실제 저런 캐릭이 있을지는 저도 몰라요.
* 각 필드는 아래와 같은 의미를 갖고 있어요

|필드|설명|
|------|---------|
|r|역할. MT,ST,H1,H2,D1,D2,D3,D4의 값 중 하나|
|j|잡. 이 필드는 사실 쓰지 않아요|
|sp|Sanctity of the Ward에서 내 파트너의 역할|
|sc|Sanctity of the Ward에서 내가 들어야 할 칼의 개수|
|li|Skyward Leaps 좌우 정렬 우선 순위|
|ni|니드호그 1-2-3 타워 왼쪽 기준 우선 순위|
|nt|니드호그 4 타워에서 들어갈 곳 위치|
|wi|Wrath of the Heavens 좌우 정렬 우선 순위|
|n|게임 내 캐릭터 이름|

* 입력하고 나서 플러그인을 다시 로드하세요. 아니면 ACT를 다시 실행해도 좋겠죠.
* 이렇게 하고나면,  각 정의된 기믹이 나올 때 위치와 순번을 알려줘요. 일부 캐릭터 이름으로 나오던 것이 역할로 알려줘요. 예를 들면 리퍼인 '낫쟁이'님이 기믹에 걸렸는데 이름이 나오지 않고 'D2'라고 표시해줘요.
