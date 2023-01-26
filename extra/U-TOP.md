# TOP 사용자 정의 기능 설명

설정 자체는 DSR과 같아요. [드래곤송 설정](extra/U-DSR.md) 문서를 참고하세요. 사실... 쓰기가 귀찮아서!! 😭

사용자 파일에 넣을 설정은 다음과 같아요. 내 진행 상황에 맞춰 기능이 추가될 수 있어요

```typescript
Options.Triggers.push({
    zoneId: ZoneId.TheOmegaProtocolUltimate,
    timelineTriggers: [{
      id: 'TOP+ 데이터 설정',
      regex: /--setup--/,
      run: (data) => {
        data.prsParty = [
          { r: 'MT', j: 'WAR', pp: 1, sm: 1, n: '전사' },
          { r: 'ST', j: 'GNB', pp: 2, sm: 8,  n: '총칼이' },
          { r: 'H1', j: 'AST', pp: 3, sm: 2,  n: '점쟁이' },
          { r: 'H2', j: 'SCH', pp: 4, sm: 7,  n: '스콜라' },
          { r: 'D1', j: 'MNK', pp: 5, sm: 3,  n: '몽크' },
          { r: 'D2', j: 'NIN', pp: 6, sm: 6,  n: '닌돌이' },
          { r: 'D3', j: 'DNC', pp: 7, sm: 4,  n: '춤꾼' },
          { r: 'D4', j: 'RDM', pp: 8, sm: 5,  n: '빨개요' },
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
|pp|Program Loop에서 우선 순위|
|sm|Synergy/PS4 마커 우선 순위|

* 입력하고 나서 CACTBOT을 새로 고쳐요. 가장 편한 방법은 디버그 체크 박스를 누르면, 안내 줄이 맨 위에 뜨고 거기에 "새로 고침"이 나오니 그걸 누르세요.
