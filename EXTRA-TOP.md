# TOP 사용자 정의 기능 설명

설정 자체는 DSR과 같아요. [드래곤송 설정](extra/U-DSR.md) 문서를 참고하세요. 마찬가지로 고정 팀에서 사용하기 편해요.

사용자 파일에 넣을 설정은 다음과 같아요. 내 진행 상황에 맞춰 기능이 추가될 수 있어요

```typescript
Options.Triggers.push({
    zoneId: ZoneId.TheOmegaProtocolUltimate,
    timelineTriggers: [{
      id: 'TOP+ 데이터 설정',
      regex: /--setup--/,
      run: (data) => {
        data.members = [
          { r: 'MT', j: 'WAR', t: 1, pp: 1, pk: 13,sm: 1, n: '전사' },
          { r: 'ST', j: 'GNB', t: 2, pp: 2, pk: 12,sm: 8, n: '총칼이' },
          { r: 'H1', j: 'AST', t: 1, pp: 3, pk: 14,sm: 2, n: '점쟁이' },
          { r: 'H2', j: 'SCH', t: 2, pp: 4, pk: 24,sm: 7, n: '스콜라' },
          { r: 'D1', j: 'MNK', t: 1, pp: 5, pk: 11,sm: 3, n: '몽크' },
          { r: 'D2', j: 'NIN', t: 2, pp: 6, pk: 21,sm: 6, n: '닌돌이' },
          { r: 'D3', j: 'DNC', t: 1, pp: 7, pk: 22,sm: 4, n: '춤꾼' },
          { r: 'D4', j: 'RDM', t: 2, pp: 8, pk: 23,sm: 5, n: '빨개요' },
        ];
      },
    },],
});
```

|필드|설명|
|------|---------|
|r|역할. MT,ST,H1,H2,D1,D2,D3,D4의 값 중 하나|
|j|잡. 이 필드는 사실 쓰지 않아요|
|n|게임 내 캐릭터 이름|
|t|팀. Synergy/PS마커에서도 쓰여요. 1=MT팀 / 2=ST팀|
|pp|Program Loop에서 우선 순위, 1~8의 숫자|
|pk|Pantokrator에서 4:4 우선 순위, 두자리 중 앞에 1/2는 4:4팀 번호, 뒤에 1~4는 우선 순위|
|sm|Synergy/PS4마커 우선 순위, 1~8의 숫자|

* 입력하고 나서 CACTBOT을 새로 고치거나 실행해요.
* 가장 편한 방법은 디버그 체크 박스를 누르면, 안내 줄이 맨 위에 뜨고 거기에 "새로 고침"이 나오니 그걸 누르세요.

![image](https://user-images.githubusercontent.com/7216647/215310599-e60265fc-9b55-4606-b50b-58a52cb47e4e.png)
