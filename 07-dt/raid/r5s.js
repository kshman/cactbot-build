const snapTwistIds = {
  'A728': [2, 'west'],
  'A729': [2, 'west'],
  'A72A': [2, 'west'],
  'A4DB': [2, 'west'],
  'A72B': [2, 'east'],
  'A72C': [2, 'east'],
  'A72D': [2, 'east'],
  'A4DC': [2, 'east'],
  'A730': [3, 'west'],
  'A731': [3, 'west'],
  'A732': [3, 'west'],
  'A4DE': [3, 'west'],
  'A733': [3, 'east'],
  'A734': [3, 'east'],
  'A735': [3, 'east'],
  'A4DD': [3, 'east'],
  'A739': [4, 'west'],
  'A73A': [4, 'west'],
  'A73B': [4, 'west'],
  'A4DF': [4, 'west'],
  'A73C': [4, 'east'],
  'A73D': [4, 'east'],
  'A73E': [4, 'east'],
  'A4E0': [4, 'east'],
};
const frogIds = {
  'A70A': 'north',
  'A70B': 'south',
  'A70C': 'west',
  'A70D': 'east',
};
const dancedIds = [
  '9BE2',
  '9BE3',
  'A36C',
  'A36D',
  'A36E',
  'A36F',
];
Options.Triggers.push({
  id: 'AacCruiserweightM1Savage',
  zoneId: ZoneId.AacCruiserweightM1Savage,
  timelineFile: 'r5s.txt',
  initData: () => ({
    deepcs: [],
    infernal: 0,
    frogs: [],
    waves: { alpha: 0, beta: 0 },
  }),
  triggers: [
    {
      id: 'R5S Deep Cut',
      type: 'HeadMarker',
      netRegex: { id: '01D7' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleaveOnYou: Outputs.tankCleaveOnYou,
          avoidCleave: Outputs.avoidTankCleave,
        };
        data.deepcs.push(matches.target);
        if (data.deepcs.length < 2)
          return;
        if (data.deepcs.includes(data.me))
          return { alertText: output.cleaveOnYou() };
        return { infoText: output.avoidCleave() };
      },
      run: (data) => {
        if (data.deepcs.length >= 2)
          data.deepcs = [];
      },
    },
    {
      id: 'R5S Flip to Side',
      type: 'StartsUsing',
      netRegex: { id: ['A780', 'A781'], source: 'Dancing Green' },
      run: (data, matches) => data.side = matches.id === 'A780' ? 'role' : 'light',
    },
    {
      id: 'R5S Snap Twist',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(snapTwistIds), source: 'Dancing Green' },
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        const st = snapTwistIds[matches.id];
        if (st === undefined)
          return;
        const cnt = st[0];
        const dir = output[st[1]]();
        const mech = output[data.side ?? 'unknown']();
        return output.text({ dir: dir, cnt: cnt, mech: mech });
      },
      run: (data) => delete data.side,
      outputStrings: {
        text: {
          en: '${dir} (${cnt} hits) => ${mech}',
          ko: '${dir}x${cnt} 🔜 ${mech}',
        },
        east: Outputs.east,
        west: Outputs.west,
        role: Outputs.rolePositions,
        light: Outputs.healerGroups,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Celebrate Good Times',
      type: 'StartsUsing',
      netRegex: { id: 'A723', source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'R5S Disco Infernal',
      type: 'StartsUsing',
      netRegex: { id: 'A756', source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
      run: (data) => data.infernal++,
    },
    {
      id: 'R5S Burn Baby Burn 1',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 1 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      countdownSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to spotlight',
          ko: '조명 밟아요',
        },
      },
    },
    {
      id: 'R5S Burn Baby Burn 2-1',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 2 && data.me === matches.target,
      durationSeconds: 9,
      countdownSeconds: 9,
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) < 14)
          return output.spot();
        return output.bait();
      },
      outputStrings: {
        spot: {
          en: 'Go to spotlight',
          ko: '조명 밟아요',
        },
        bait: {
          en: 'Bait Frog',
          ko: '개구리 부채 유도',
        },
        card: Outputs.cardinals,
        inter: Outputs.intercards,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Burn Baby Burn 2-2',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 2 && data.me === matches.target,
      delaySeconds: 11,
      durationSeconds: 8,
      countdownSeconds: 8,
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) < 14)
          return output.bait();
        return output.spot();
      },
      outputStrings: {
        spot: {
          en: 'Go to spotlight',
          ko: '조명 밟아요',
        },
        bait: {
          en: 'Bait Frog',
          ko: '개구리 부채 유도',
        },
      },
    },
    {
      id: 'R5S Inside Out',
      type: 'StartsUsing',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      durationSeconds: 4.9,
      countdownSeconds: 4.9,
      response: Responses.getOutThenIn(),
    },
    {
      id: 'R5S Inside Get Out',
      type: 'Ability',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'R5S Outside In',
      type: 'StartsUsing',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      durationSeconds: 4.9,
      countdownSeconds: 4.9,
      response: Responses.getInThenOut(),
    },
    {
      id: 'R5S Outside Get In',
      type: 'Ability',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'R5S Arcady Night Fever',
      type: 'StartsUsing',
      netRegex: { id: ['A760', 'A370'], source: 'Dancing Green', capture: false },
      infoText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.text();
      },
      run: (data) => {
        data.frogs = [];
        delete data.order;
      },
      outputStrings: {
        text: {
          en: 'Arcady Night In & Out',
          ko: '연속 안팎 + 부채꼴',
        },
      },
    },
    {
      id: 'R5S Wavelength Merge Order',
      type: 'GainsEffect',
      netRegex: { effectId: ['116E', '116F'] },
      run: (data, matches) => {
        matches.effectId === '116E' ? data.waves.alpha++ : data.waves.beta++;
        if (data.me !== matches.target)
          return;
        if (matches.effectId === '116E') {
          const alphas = { 1: 3, 2: 1, 3: 2, 4: 4 };
          data.order = alphas[data.waves.alpha];
        } else {
          const betas = { 1: 4, 2: 2, 3: 1, 4: 3 };
          data.order = betas[data.waves.beta];
        }
      },
    },
    {
      id: 'R5S Wavelength Merge Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: ['116E', '116F'] },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      countdownSeconds: 4,
      alertText: (data, _matches, output) => output.text({ order: data.order }),
      outputStrings: {
        text: {
          en: 'Merge α + β (${order})',
          ko: 'αβ 문대요! (${order}번째)',
        },
      },
    },
    {
      id: 'R5S Frog Dance Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(frogIds), source: 'Frogtourage' },
      run: (data, matches) => data.frogs.push(frogIds[matches.id] ?? 'unknown'),
    },
    {
      id: 'R5S Let\'s Dance!',
      type: 'StartsUsing',
      netRegex: { id: ['A76A', 'A390'], source: 'Dancing Green', capture: false },
      delaySeconds: 2,
      durationSeconds: 4,
      infoText: (data, _matches, output) => {
        const curr = data.frogs[0];
        if (curr === undefined) // 이게 없을리가 있나
          return output.unknown();
        if (data.order !== undefined)
          return output.combo({ dir: output[curr](), order: data.order });
        return output.text({ dir: output[curr]() });
      },
      outputStrings: {
        text: {
          en: '${dir}',
          ko: '${dir}으로',
        },
        combo: {
          en: '${dir} (${order})',
          ko: '${dir}으로 (${order}번째)',
        },
        east: Outputs.east,
        west: Outputs.west,
        north: Outputs.north,
        south: Outputs.south,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Frog Dance',
      type: 'Ability',
      netRegex: { id: dancedIds, capture: false },
      durationSeconds: 2,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: '${dir}',
            ko: '${dir}으로',
          },
          stay: {
            en: '(Stay)',
            ja: '(そのまま)',
            ko: '(그대로)',
          },
          east: Outputs.east,
          west: Outputs.west,
          north: Outputs.north,
          south: Outputs.south,
        };
        const prev = data.frogs.shift();
        const curr = data.frogs[0];
        if (curr === undefined)
          return;
        if (prev === curr)
          return { infoText: output.stay() };
        return { alertText: output.text({ dir: output[curr]() }) };
      },
    },
    {
      id: 'R5S Beats',
      type: 'StartsUsing',
      netRegex: { id: ['A75B', 'A75D'], source: 'Dancing Green' },
      infoText: (_data, matches, output) => matches.id === 'A75B' ? output.b4() : output.b8(),
      outputStrings: {
        b4: Outputs.stackPartner,
        b8: Outputs.protean,
      },
    },
    {
      id: 'R5S Ride The Waves',
      type: 'StartsUsing',
      netRegex: { id: 'A754', source: 'Dancing Green', capture: false },
      condition: (data) => data.options.AutumnStyle,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Wave + Spread',
          ko: '북에서 내려오는 장판 웨이브!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Dancing Green': 'Springhis Khan',
        'Frogtourage': 'Schenkelschwinger',
      },
      'replaceText': {},
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Dancing Green': 'Dancing Green',
        'Frogtourage': 'Danceur batracien',
      },
      'replaceText': {},
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Dancing Green': 'ダンシング・グリーン',
        'Frogtourage': 'カモン！ フロッグダンサー',
      },
      'replaceText': {
        'Deep Cut': 'ディープカット',
        'Flip to A-side': 'ジングル予約A',
        'Flip to B-side': 'ジングル予約B',
        '2-snap Twist & Drop the Needle': '2ポイント、ポーズ&ジングル',
        '3-snap Twist & Drop the Needle': '3ポイント、ポーズ&ジングル',
        '4-snap Twist & Drop the Needle': '4ポイント、ポーズ&ジングル',
        'Play A-side': 'ラウドジングルA',
        'Play B-side': 'ラウドジングルB',
        'Celebrate Good Times': 'セレブレート・グッドタイムズ',
        'Disco Infernal': 'ディスコインファーナル',
        'Funky Floor': 'ダンシングフィールド',
        'Inside Out': 'インサイドアウト',
        'Outside In': 'アウトサイドイン',
        'Ensemble Assemble': 'ダンサーズ・アッセンブル',
        'Arcady Night Fever': 'アルカディア・ナイトフィーバー',
        'Get Down!': 'ゲットダウン！',
        'Let\'s Dance': 'レッツダンス！',
        'Freak Out': '静音爆発',
        'Let\'s Pose': 'レッツポーズ！',
        'Ride the Waves': 'ウェーブ・オン・ウェーブ',
        'Quarter Beats': '4ビート',
        'Eighth Beats': '8ビート',
        'Frogtourage': 'カモン！ フロッグダンサー',
        'Moonburn': 'ムーンバーン',
        'Back-up Dance': 'ダンシングウェーブ',
        'Arcady Night Encore Starts': 'ナイトフィーバー・アンコール',
        'Let\'s Dance! Remix': 'レッツダンス・ダンス・ダンス！',
        'Do the Hustle': 'ドゥ・ザ・ハッスル',
        'Frogtourage Finale': 'ファイナル・アッセンブル',
        'Hi-NRG Fever': 'ハイエナジー・ナイトフィーバー',
      },
    },
  ],
});
