Options.Triggers.push({
  id: 'TheMinstrelsBalladSphenesBurden',
  zoneId: ZoneId.TheMinstrelsBalladSphenesBurden,
  timelineFile: 'queen-eternal-ex.txt',
  initData: () => ({
    absoluteAuthorityDebuff: 'stack',
  }),
  triggers: [
    {
      id: 'QueenEternal Ex Virtual Shift',
      type: 'StartsUsing',
      netRegex: { id: ['A019', 'A01A', 'A01B'], source: 'Queen Eternal', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'QueenEternal Ex Aeroquell',
      type: 'StartsUsing',
      netRegex: { id: 'A025', source: 'Queen Eternal', capture: false },
      condition: Conditions.notOnlyAutumn(),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.stacks(),
      outputStrings: {
        stacks: Outputs.healerGroups,
      },
    },
    {
      id: 'QueenEternal Ex Legitimate Force East Safe First',
      type: 'StartsUsing',
      netRegex: { id: 'A01E', source: 'Queen Eternal', capture: false },
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'QueenEternal Ex Legitimate Force West Safe First',
      type: 'StartsUsing',
      netRegex: { id: 'A020', source: 'Queen Eternal', capture: false },
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'QueenEternal Ex World Shatter',
      type: 'StartsUsing',
      netRegex: { id: 'A01C', source: 'Queen Eternal', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'QueenEternal Ex Divide and Conquer',
      type: 'StartsUsing',
      netRegex: { id: 'A017', source: 'Queen Eternal', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'QueenEternal Ex Prosecution of War',
      type: 'StartsUsing',
      netRegex: { id: 'A00A', source: 'Queen Eternal', capture: true },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'QueenEternal Ex Royal Domain',
      type: 'StartsUsing',
      netRegex: { id: 'A04E', source: 'Queen Eternal', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'QueenEternal Ex Weighty Blow',
      type: 'StartsUsing',
      netRegex: { id: 'A033', source: 'Queen Eternal', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hide behind rocks',
          ko: '돌 뒤에 숨어요',
        },
      },
    },
    {
      id: 'QueenEternal Ex Coronation',
      type: 'StartsUsing',
      netRegex: { id: 'A013', source: 'Queen Eternal', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread, aim lasers',
          ko: '흩어져서 레이저 유도',
        },
      },
    },
    {
      id: 'QueenEternal Ex Absolute Authority',
      type: 'StartsUsing',
      netRegex: { id: 'A041', source: 'Queen Eternal', capture: false },
      infoText: (_data, _matches, output) => output.bait(),
      outputStrings: {
        bait: {
          en: 'Bait puddles',
          ja: 'ゆうか誘導',
          ko: '모여서 장판 깔아요',
        },
      },
    },
    {
      id: 'QueenEternal Ex Absolute Authority Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: '105A', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.absoluteAuthorityDebuff = 'spread',
    },
    {
      id: 'QueenEternal Ex Absolute Authority Debuff Mechanics',
      type: 'GainsEffect',
      netRegex: { effectId: '105A', capture: false },
      delaySeconds: 1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        return output.combo({
          stackSpread: output[data.absoluteAuthorityDebuff](),
          dorito: output.dorito(),
        });
      },
      outputStrings: {
        spread: {
          en: 'Flare Marker Spread',
          ko: '플레어! 흩어졌다',
        },
        stack: {
          en: 'Stack',
          ja: '頭割り',
          ko: '뭉쳤다',
        },
        dorito: {
          en: 'Dorito Stack',
          ja: 'マーカー頭割り',
          ko: '마커 뭉쳐욧',
        },
        combo: {
          en: '${stackSpread} => ${dorito}',
          ja: '${stackSpread} => ${dorito}',
          ko: '${stackSpread} 🔜 ${dorito}',
        },
      },
    },
    {
      id: 'QueenEternal Ex Rush',
      type: 'StartsUsing',
      netRegex: { id: ['A037', 'A038'], source: 'Ice Pillar', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread, stretch tethers',
          ko: '고드름 줄! 흩어져서 늘려요',
        },
      },
    },
  ],
});
