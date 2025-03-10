# FRU 사용자 정의 기능 설명

시간압축-절을 위한 특별한 스크립트예요. JapanDC에서 쓰는 방식을 설명했어요

```javascript
  triggers: [
    {
      id: 'FRU+ P3 시간압축 절',
      type: 'GainsEffect',
      netRegex: { effectId: '99B', capture: false },
      condition: (data) => data.p3Role !== undefined,
      delaySeconds: 0.1,
      durationSeconds: 5,
      suppressSeconds: 0.1,
      alertText: (data, _matches, _output) => {
        if (data.role === 'dps') {
          switch (data.p3Role) {
            case 'ice': // bind3
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('빔 유도');
              data.p3Strat.push('⊙뭉처요 (블리자가)');
              data.p3Strat.push('⊙리턴 설치');
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('⊙바깥봐요');
              return '블리자가 (bind3)';
            case 'f11': // attack1 또는 attack2
              data.p3Strat.push('파이가');
              data.p3Strat.push('리턴 설치 (모래시계)');
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('빔 유도');
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('⊙바깥봐요');
              return '빠른 파이가 (어택!!!)';
            case 'f21': // stop2
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('⊙리턴 설치');
              data.p3Strat.push('파이가');
              data.p3Strat.push('(⊙기둘려요)');
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('빔 유도 🔜 바깥봐요');
              return '중간 파이가 (stop2)';
            case 'f31': // bind3
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('빔 유도');
              data.p3Strat.push('⊙뭉쳐요');
              data.p3Strat.push('⊙리턴 설치');
              data.p3Strat.push('파이가 (블리자가 안으로)');
              data.p3Strat.push('⊙바깥봐요');
              return '느린 파이가 (bind3)';
          }
        }
        else {
          switch (data.p3Role) {
            case 'ice': // attack3
              data.p3Strat.push('⊙뭉쳐요 (→리턴)');
              data.p3Strat.push('🡻리턴 설치 (→블리자가)');
              data.p3Strat.push('⊙블리자가 (→빔)');
              data.p3Strat.push('🡻빔 유도 (→뭉쳐요)');
              data.p3Strat.push('⊙뭉쳐요 (→바깥)');
              data.p3Strat.push('⊙바깥봐요');
              return '🡻블리자가 (attack3)';
            case 'f11': // attack3
              data.p3Strat.push('🡻파이가 (→리턴)');
              data.p3Strat.push('🡻리턴 설치 (→뭉처요)');
              data.p3Strat.push('⊙뭉쳐요 (→빔)');
              data.p3Strat.push('🡻빔 유도 (→뭉쳐요)');
              data.p3Strat.push('⊙뭉쳐요 (→바깥)');
              data.p3Strat.push('⊙바깥봐요');
              return '🡻빠른 파이가 (attack3)';
            case 'f21': // stop1
              data.p3Strat.push('⊙뭉쳐요 (→리턴)');
              data.p3Strat.push('🡸리턴 설치 (→파이가)');
              data.p3Strat.push('🡸파이가 (→뭉처요)');
              data.p3Strat.push('⊙기둘려요 (→그대로)');
              data.p3Strat.push('⊙뭉쳐요 (→빔)');
              data.p3Strat.push('🡸빔 유도 🔜 바깥봐요');
              return '🡸중간 파이가 (stop1)';
            case 'f31': // bind1 또는 bind2
              data.p3Strat.push('⊙뭉쳐요 (→빔)');
              data.p3Strat.push('🡿빔 유도 (→뭉쳐요)');
              data.p3Strat.push('⊙뭉쳐요 (→리턴)');
              data.p3Strat.push('⊙리턴 설치 (→파이가)');
              data.p3Strat.push('🡿파이가 (→바깥)');
              data.p3Strat.push('⊙바깥봐요');
              return '🡿느린 파이가 (바인드!!!)';
          }
        }
        return '엌... 내 버프 멍미?';
      },
    },
    {
      // 첫번째 파이가, 뭉치기
      id: 'FRU+ P3 시간압축 절 #1',
      type: 'StartsUsing',
      netRegex: { source: ['Oracle of Darkness', '闇の巫女'], id: '9D4A', capture: false },
      delaySeconds: 10 - 4 + 11, // 11
      durationSeconds: 4,
      alertText: (data, _matches, _output) => data.p3Strat.shift() ?? '#1',
    },
    {
      // 첫번째 리턴, 빔유도
      id: 'FRU+ P3 시간압축 절 #2',
      type: 'StartsUsing',
      netRegex: { source: ['Oracle of Darkness', '闇の巫女'], id: '9D4A', capture: false },
      delaySeconds: 10 - 4 + 16, // 16
      durationSeconds: 4,
      alertText: (data, _matches, _output) => data.p3Strat.shift() ?? '#2',
    },
    {
      // 두번째 파이가, 뭉치기 + 블리자가
      id: 'FRU+ P3 시간압축 절 #3',
      type: 'StartsUsing',
      netRegex: { source: ['Oracle of Darkness', '闇の巫女'], id: '9D4A', capture: false },
      delaySeconds: 10 - 4 + 21, // 21
      durationSeconds: 4,
      alertText: (data, _matches, _output) => data.p3Strat.shift() ?? '#3',
    },
    {
      // 두번째 리턴, 빔유도
      id: 'FRU+ P3 시간압축 절 #4',
      type: 'StartsUsing',
      netRegex: { source: ['Oracle of Darkness', '闇の巫女'], id: '9D4A', capture: false },
      delaySeconds: 10 - 4 + 26, // 26
      durationSeconds: 4,
      alertText: (data, _matches, _output) => data.p3Strat.shift() ?? '#4',
    },
    { // 세번째 파이가, 뭉치기
      id: 'FRU+ P3 시간압축 절 #5',
      type: 'StartsUsing',
      netRegex: { source: ['Oracle of Darkness', '闇の巫女'], id: '9D4A', capture: false },
      delaySeconds: 10 - 4 + 31, // 31
      durationSeconds: 4,
      alertText: (data, _matches, _output) => data.p3Strat.shift() ?? '#5',
    },
    {
      // 세번째 리턴, 빔유도
      id: 'FRU+ P3 시간압축 절 #6',
      type: 'StartsUsing',
      netRegex: { source: ['Oracle of Darkness', '闇の巫女'], id: '9D4A', capture: false },
      delaySeconds: 10 - 4 + 36, // 36
      durationSeconds: 4,
      alertText: (data, _matches, _output) => data.p3Strat.shift() ?? '#6',
    },
  ],
```
