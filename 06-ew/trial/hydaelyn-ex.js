const storedMechanicsOutputStrings = {
  spread: Outputs.spread,
  groups: Outputs.healerGroups,
  stack: Outputs.getTogether,
};
const crystallizeOutputStrings = {
  ...storedMechanicsOutputStrings,
  crystallize: {
    en: 'Crystallize: ${name}',
    de: 'Kristalisieren: ${name}',
    fr: 'Cristallisation : ${name}',
    ja: 'クリスタライズ: ${name}',
    cn: '水晶化: ${name}',
    ko: '크리스탈라이즈: ${name}',
  },
};
const comboOutputStrings = {
  ...storedMechanicsOutputStrings,
  combo: {
    en: '${first} => ${second}',
    de: '${first} => ${second}',
    fr: '${first} => ${second}',
    ja: '${first} => ${second}',
    cn: '${first} => ${second}',
    ko: '${first} 🔜 ${second}',
  },
};
Options.Triggers.push({
  id: 'TheMinstrelsBalladHydaelynsCall',
  zoneId: ZoneId.TheMinstrelsBalladHydaelynsCall,
  timelineFile: 'hydaelyn-ex.txt',
  timelineTriggers: [
    {
      id: 'HydaelynEx Marker Equinox',
      // There is no 8E1 effect here (maybe because it is deterministic?) so use a timeline trigger.
      regex: /Equinox/,
      beforeSeconds: 3.5,
      durationSeconds: (data) => data.crystallize ? 6.5 : 3.5,
      alertText: (data, _matches, output) => {
        if (data.crystallize)
          return output.combo({
            first: output.intercards(),
            second: output[data.crystallize](),
          });
        return output.intercards();
      },
      run: (data) => delete data.crystallize,
      outputStrings: {
        ...comboOutputStrings,
        intercards: {
          en: 'Intercards',
          de: 'Interkardinal',
          fr: 'Intercardinal',
          ja: '斜めへ',
          cn: '四角',
          ko: '비스듬히 피해욧',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'HydaelynEx Heros\'s Radiance',
      type: 'StartsUsing',
      netRegex: { id: '65C1', source: 'Hydaelyn', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'HydaelynEx Shining Saber',
      type: 'StartsUsing',
      netRegex: { id: '68C8', source: 'Hydaelyn', capture: false },
      // In the final phase, there's a Shining Saber -> Crystalline Water III section.
      durationSeconds: (data) => data.crystallize ? 7 : 4,
      alertText: (data, _matches, output) => {
        if (data.crystallize)
          return output.combo({ first: output.stack(), second: output[data.crystallize]() });
        return output.stack();
      },
      run: (data) => delete data.crystallize,
      outputStrings: comboOutputStrings,
    },
    {
      id: 'HydaelynEx Magos\'s Raidance',
      type: 'StartsUsing',
      netRegex: { id: '65C2', source: 'Hydaelyn', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'HydaelynEx Parhelion Tracker',
      type: 'StartsUsing',
      netRegex: { id: '65B0', source: 'Hydaelyn', capture: false },
      run: (data) => data.parhelion = true,
    },
    {
      id: 'HydaelynEx Crystallize Water',
      type: 'Ability',
      // We could call this out on startsUsing, but no action needs to be taken for ~17 seconds,
      // and so just call this out on the action.
      netRegex: { id: ['659A', '6ED5'], source: 'Hydaelyn', capture: false },
      infoText: (_data, _matches, output) => output.crystallize({ name: output.groups() }),
      run: (data) => data.crystallize = 'groups',
      outputStrings: crystallizeOutputStrings,
    },
    {
      // During Parhelion, there's a Crystallize Water with no mechanic in between.
      id: 'HydaelynEx Crystallize Water Parhelion',
      type: 'Ability',
      netRegex: { id: ['659A', '6ED5'], source: 'Hydaelyn', capture: false },
      condition: (data) => data.parhelion,
      // There's 10 seconds between Crystallize Water ability and action in this one case.
      // Subparhelion occurs ~2s before, but that's too soon.
      delaySeconds: 5,
      alertText: (_data, _matches, output) => output.groups(),
      run: (data) => {
        delete data.crystallize;
        delete data.parhelion;
      },
      outputStrings: {
        groups: crystallizeOutputStrings.groups,
      },
    },
    {
      id: 'HydaelynEx Crystallize Ice',
      type: 'Ability',
      netRegex: { id: ['659C', '659D'], source: 'Hydaelyn', capture: false },
      infoText: (_data, _matches, output) => output.crystallize({ name: output.spread() }),
      run: (data) => data.crystallize = 'spread',
      outputStrings: crystallizeOutputStrings,
    },
    {
      id: 'HydaelynEx Crystallize Stone',
      type: 'Ability',
      netRegex: { id: ['659B', '659E'], source: 'Hydaelyn', capture: false },
      infoText: (_data, _matches, output) => output.crystallize({ name: output.stack() }),
      run: (data) => data.crystallize = 'stack',
      outputStrings: crystallizeOutputStrings,
    },
    {
      id: 'HydaelynEx Marker Anthelion',
      type: 'GainsEffect',
      netRegex: { effectId: '8E1', source: 'Hydaelyn', count: '1B5', capture: false },
      // Example timeline:
      //     t=0 StartsCasting Crystallize
      //     t=4 ActionEffect Crystalize
      //     t=7 StatusAdd 81E (this regex)
      //     t=9.5 marker appears
      //     t=13 ActionEffect Anthelion
      //     t=17 ActionEffect Crystalline Blizzard
      //
      // We could call this out immediately, but then it's very close to the Crystallize call.
      // Additionally, if we call this out immediately then players have to remember something
      // for 10 seconds.  A delay of 2.5 feels more natural in terms of time to react and
      // handle this, rather than calling it out extremely early.  Also, add a duration so that
      // this stays on screen until closer to the Crystalline action.  This also puts this call
      // closer to when the marker appears on screen, and so feels a little bit more natural.
      delaySeconds: 2.5,
      durationSeconds: (data) => data.crystallize ? 6.5 : 3.5,
      alertText: (data, _matches, output) => {
        if (data.crystallize)
          return output.combo({ first: output.in(), second: output[data.crystallize]() });
        return output.in();
      },
      run: (data) => delete data.crystallize,
      outputStrings: {
        ...comboOutputStrings,
        in: Outputs.in,
      },
    },
    {
      id: 'HydaelynEx Marker Highest Holy',
      type: 'GainsEffect',
      netRegex: { effectId: '8E1', source: 'Hydaelyn', count: '1B4', capture: false },
      delaySeconds: 2.5,
      durationSeconds: (data) => data.crystallize ? 6.5 : 3.5,
      alertText: (data, _matches, output) => {
        if (data.crystallize)
          return output.combo({ first: output.out(), second: output[data.crystallize]() });
        return output.out();
      },
      run: (data) => delete data.crystallize,
      outputStrings: {
        ...comboOutputStrings,
        out: Outputs.out,
      },
    },
    {
      id: 'HydaelynEx Aureole',
      type: 'StartsUsing',
      netRegex: { id: ['6C91', '6F11'], source: 'Hydaelyn', capture: false },
      // Late in the fight there is a Crystallize -> Aureole combo.
      alertText: (data, _matches, output) => {
        if (data.crystallize)
          return output.combo({ first: output.sides(), second: output[data.crystallize]() });
        return output.sides();
      },
      run: (data) => delete data.crystallize,
      outputStrings: {
        ...comboOutputStrings,
        sides: Outputs.sides,
      },
    },
    {
      id: 'HydaelynEx Lateral Aureole',
      type: 'StartsUsing',
      netRegex: { id: ['65C5', '6F13'], source: 'Hydaelyn', capture: false },
      alertText: (data, _matches, output) => {
        if (data.crystallize)
          return output.combo({ first: output.frontBack(), second: output[data.crystallize]() });
        return output.frontBack();
      },
      run: (data) => delete data.crystallize,
      outputStrings: {
        ...comboOutputStrings,
        frontBack: Outputs.goFrontBack,
      },
    },
    {
      id: 'HydaelynEx Mousa\'s Scorn',
      type: 'StartsUsing',
      netRegex: { id: '65C0', source: 'Hydaelyn' },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'HydaelynEx Crystal of Light',
      type: 'Ability',
      netRegex: { id: '65BE', source: 'Crystal of Light', capture: true },
      // Each of the three adds fires every 1.1s or so until about Exodus or their death
      suppressSeconds: 60,
      infoText: (data, matches, output) => {
        // North Crystals: (87.87, 93.00),  (100.00, 86.00), (112.12, 93)
        // South Crystals: (87.87, 107.00), (100.00, 114.00), (112.12, 107.00)
        const isSouthFirst = parseFloat(matches.y) > 100;
        if (data.role === 'tank')
          return output.dirEchoes({ dir: isSouthFirst ? output.north() : output.south() });
        return output.dirCrystals({ dir: isSouthFirst ? output.south() : output.north() });
      },
      outputStrings: {
        dirCrystals: {
          en: '${dir} Crystals first',
          de: 'Kristall im ${dir} zuerst',
          fr: 'Premiers cristaux au ${dir} ',
          ja: '${dir}のクリスタルから',
          cn: '先攻击 ${dir} 水晶',
          ko: '${dir} 크리스탈부터',
        },
        dirEchoes: {
          en: 'Move Echoes ${dir} first',
          de: 'Bewege Echoes zuerst nach ${dir}',
          fr: 'Déplacez les échos au ${dir} en premier',
          ja: '${dir}に誘導',
          cn: '先拉回声到 ${dir} ',
          ko: '먼저 ${dir}로 데려가욧',
        },
        north: Outputs.north,
        south: Outputs.south,
      },
    },
    {
      id: 'HydaelynEx Exodus',
      type: 'Ability',
      netRegex: { id: '6B55', source: 'Hydaelyn', capture: false },
      // 14.8 seconds from this ability (no cast) to 662B raidwide.
      delaySeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'HydaelynEx Halo',
      type: 'StartsUsing',
      netRegex: { id: '65A5', source: 'Hydaelyn', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'HydaelynEx Radiant Halo',
      type: 'StartsUsing',
      netRegex: { id: '6B54', source: 'Hydaelyn', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'HydaelynEx Heros\'s Sundering',
      type: 'StartsUsing',
      netRegex: { id: '65BF', source: 'Hydaelyn' },
      response: Responses.tankCleave('alert'),
    },
    {
      id: 'HydaelynEx Infralateral Arc',
      type: 'StartsUsing',
      netRegex: { id: '6669', source: 'Hydaelyn', capture: false },
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.rolePositions(),
      outputStrings: {
        rolePositions: {
          en: 'Role positions',
          de: 'Rollenposition',
          fr: 'Positions par rôle',
          ja: 'ロール特定位置へ',
          cn: '去指定位置',
          ko: '롤 위치로',
        },
      },
    },
    {
      id: 'HydaelynEx Heros\'s Glory',
      type: 'StartsUsing',
      netRegex: { id: '65A8', source: 'Hydaelyn', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'HydaelynEx Parhelic Circle',
      type: 'StartsUsing',
      netRegex: { id: '65AC', source: 'Hydaelyn', capture: false },
      durationSeconds: 9,
      alertText: (_data, _matches, output) => {
        // This is always crystallize === 'spread'.
        return output.combo({ first: output.avoid(), second: output.spread() });
      },
      run: (data) => delete data.crystallize,
      outputStrings: {
        ...comboOutputStrings,
        avoid: {
          en: 'Avoid Line Ends',
          de: 'Weiche den Enden der Linien aus',
          fr: 'Évitez les fins de lignes',
          ja: '線の端から離れる',
          cn: '远离线',
          ko: '줄 끝 쪽 피해욧',
        },
      },
    },
    {
      id: 'HydaelynEx Echoes',
      type: 'StartsUsing',
      netRegex: { id: '65B5', source: 'Hydaelyn', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack 5x',
          de: '5x Sammeln',
          fr: '5x Packages',
          ja: '頭割り５回',
          cn: '5连分摊',
          ko: '5x 뭉쳐요',
        },
      },
    },
    {
      id: 'HydaelynEx Bright Spectrum',
      type: 'StartsUsing',
      netRegex: { id: '65B9', source: 'Hydaelyn' },
      preRun: (data, matches) => (data.brightSpectrumStack ??= []).push(matches.target),
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.spread();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      // In practice, this cast begins after the Bright Spectrum casts.
      id: 'HydaelynEx Dichroic Spectrum',
      type: 'StartsUsing',
      netRegex: { id: '65B8', source: 'Hydaelyn' },
      infoText: (data, matches, output) => {
        if (data.brightSpectrumStack?.includes(data.me))
          return;
        if (data.me === matches.target || data.role === 'tank')
          return output.sharedTankbuster();
      },
      run: (data) => delete data.brightSpectrumStack,
      outputStrings: {
        sharedTankbuster: Outputs.sharedTankbuster,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Crystal of Light': 'Lichtkristall',
        'Hydaelyn': 'Hydaelyn',
        'Mystic Refulgence': 'Truglicht',
        'Parhelion': 'Parhelion',
      },
      'replaceText': {
        '--transition--': '--Übergang--',
        '--top-middle': '--Oben-Mitte',
        '--middle': '--Mitte',
        'Anthelion': 'Anthelion',
        'Aureole': 'Aureole',
        'Beacon': 'Lichtschein',
        'Bright Spectrum': 'Gleißendes Spektrum',
        'Crystalline Blizzard III': 'Kristall-Eisga',
        'Crystalline Stone III': 'Kristall-Steinga',
        'Crystalline Water/Stone III': 'Kristall-Aquaga/Steinga',
        'Crystalline Water III': 'Kristall-Aquaga',
        'Crystallize': 'Kristallisieren',
        'Dichroic Spectrum': 'Dichroitisches Spektrum',
        'Echoes': 'Echos',
        'Equinox': 'Äquinoktium',
        'Exodus': 'Exodus',
        '(?<!Radiant )Halo': 'Halo',
        'Heros\'s Glory': 'Glorie des Heros',
        'Heros\'s Radiance': 'Glanz des Heros',
        'Heros\'s Sundering': 'Schlag des Heros',
        'Highest Holy': 'Höchstes Sanctus',
        'Incandescence': 'Inkandeszenz',
        'Infralateral Arc': 'Infralateralbogen',
        'Lateral Aureole': 'Lateralaureole',
        'Light of the Crystal': 'Licht des Kristalls',
        'Lightwave': 'Lichtwoge',
        'Magos\'s Radiance': 'Glanz des Magos',
        'Mousa\'s Scorn': 'Zorn der Mousa',
        'Parhelic Circle': 'Horizontalkreis',
        '(?<!Sub)Parhelion': 'Parhelion',
        'Pure Crystal': 'Reiner Kristall',
        'Radiant Halo': 'Strahlender Halo',
        'Shining Saber': 'Strahlender Säbel',
        'Subparhelion': 'Subparhelion',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Crystal of Light': 'Cristal De Lumière',
        'Hydaelyn': 'Hydaelyn',
        'Mystic Refulgence': 'illusion de Lumière',
        'Parhelion': 'Parhélie',
      },
      'replaceText': {
        '\\?': ' ?',
        '--top-middle': '--En haut au milieu',
        '--middle': '--Milieu',
        'Anthelion': 'Anthélie',
        'Aureole/Lateral Aureole': 'Auréole/Auréole latérale',
        'Beacon': 'Rayon de Lumière',
        'Bright Spectrum': 'Spectre lumineux',
        'Crystalline Blizzard III': 'Méga Glace cristallisée',
        'Crystalline Stone III': 'Méga Terre cristallisée',
        'Crystalline Water III': 'Méga Eau cristallisée',
        'Crystalline Water/Stone III': 'Méga Eau/Terre cristallisée',
        'Crystallize': 'Cristallisation',
        'Dichroic Spectrum': 'Spectre dichroïque',
        'Echoes': 'Échos',
        'Equinox': 'Équinoxe',
        'Exodus': 'Exode',
        '(?<!Radiant )Halo': 'Halo',
        'Heros\'s Glory': 'Gloire du héros',
        'Heros\'s Radiance': 'Radiance du héros',
        'Heros\'s Sundering': 'Fragmentation du héros',
        'Highest Holy': 'Miracle suprême',
        'Incandescence': 'Incandescence',
        'Infralateral Arc': 'Arc infralatéral',
        'Light of the Crystal': 'Lumière du cristal',
        'Lightwave': 'Vague de Lumière',
        'Magos\'s Radiance': 'Radiance du mage',
        'Mousa\'s Scorn': 'Mépris de la muse',
        'Parhelic Circle': 'Cercle parhélique',
        '(?<!Sub)Parhelion': 'Parhélie',
        'Pure Crystal': 'Cristal pur',
        'Radiant Halo': 'Halo radiant',
        'Shining Saber': 'Sabre de brillance',
        'Subparhelion': 'Subparhélie',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Crystal of Light': '光のクリスタル',
        'Hydaelyn': 'ハイデリン',
        'Mystic Refulgence': '幻想光',
        'Parhelion': 'パルヘリオン',
      },
      'replaceText': {
        '--middle': '--中央',
        '--top-middle': '--中央前方',
        'Anthelion': 'アントゥヘリオン',
        'Aureole/Lateral Aureole': '(サイド?) オーレオール',
        'Beacon': '光芒',
        'Bright Spectrum': 'ブライトスペクトル',
        'Crystalline Blizzard III': 'クリスタル・ブリザガ',
        'Crystalline Stone III': 'クリスタル・ストンガ',
        'Crystalline Water III': 'クリスタル・ウォタガ',
        'Crystalline Water/Stone III': 'クリスタル・ウォタガ/ストンガ',
        'Crystallize': 'クリスタライズ',
        'Dichroic Spectrum': 'ダイクロイックスペクトル',
        'Echoes': 'エコーズ',
        'Equinox': 'エクイノックス',
        'Exodus': 'エクソダス',
        '(?<!Radiant )Halo': 'ヘイロー',
        'Heros\'s Glory': 'ヘロイスグローリー',
        'Heros\'s Radiance': 'ヘロイスラジエンス',
        'Heros\'s Sundering': 'ヘロイスサンダリング',
        'Highest Holy': 'ハイエストホーリー',
        'Incandescence': '幻閃光',
        'Infralateral Arc': 'ラテラルアーク',
        'Light of the Crystal': 'ライト・オブ・クリスタル',
        'Lightwave': 'ライトウェーブ',
        'Magos\'s Radiance': 'マゴスラジエンス',
        'Mousa\'s Scorn': 'ムーサスコーン',
        'Parhelic Circle': 'パーヘリックサークル',
        '(?<!Sub)Parhelion': 'パルヘリオン',
        'Pure Crystal': 'ピュアクリスタル',
        'Radiant Halo': 'レディアントヘイロー',
        'Shining Saber': 'シャイニングセイバー',
        'Subparhelion': 'サブパルヘリオン',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Crystal of Light': '光之水晶',
        'Hydaelyn': '海德林',
        'Mystic Refulgence': '幻想光',
        'Parhelion': '幻日',
      },
      'replaceText': {
        '--top-middle': '--前方中间',
        '--middle': '--中间',
        'Anthelion': '反假日',
        'Aureole': '晕光',
        'Beacon': '光芒',
        'Bright Spectrum': '明亮光谱',
        'Crystalline Blizzard III': '水晶冰封',
        'Crystalline Stone III': '水晶垒石',
        'Crystalline Water III': '水晶狂水',
        'Crystalline Water/Stone III': '水晶狂水/垒石',
        'Crystallize': '结晶',
        'Dichroic Spectrum': '二色光谱',
        'Echoes': '回声',
        'Equinox': '昼夜二分',
        'Exodus': '众生离绝',
        '(?<!Radiant )Halo': '光环',
        'Heros\'s Glory': '守护者的荣耀',
        'Heros\'s Radiance': '守护者的光辉',
        'Heros\'s Sundering': '守护者的斩断',
        'Highest Holy': '至高神圣',
        'Incandescence': '幻闪光',
        'Infralateral Arc': '外侧晕弧',
        'Lateral Aureole': '侧晕光',
        'Light of the Crystal': '水晶之光',
        'Lightwave': '光波',
        'Magos\'s Radiance': '魔法师的光辉',
        'Mousa\'s Scorn': '演艺家的蔑视',
        'Parhelic Circle': '幻日环',
        '(?<!Sub)Parhelion': '幻日',
        'Pure Crystal': '纯净水晶',
        'Radiant Halo': '明辉光环',
        'Shining Saber': '光芒刃',
        'Subparhelion': '映幻日',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Crystal of Light': '빛의 크리스탈',
        'Hydaelyn': '하이델린',
        'Mystic Refulgence': '환상빛',
        'Parhelion': '무리해',
      },
      'replaceText': {
        '--top-middle': '--위쪽 중앙',
        '--middle': '--중앙',
        'Anthelion': '맞무리해',
        'Aureole': '후광',
        'Beacon': '광망',
        'Bright Spectrum': '환한 분광',
        'Crystalline Blizzard III': '크리스탈 블리자가',
        'Crystalline Stone III': '크리스탈 스톤가',
        'Crystalline Water III': '크리스탈 워터가',
        'Crystalline Water/Stone III': '크리스탈 워터가/스톤가',
        'Crystallize': '크리스탈화',
        'Dichroic Spectrum': '이분광',
        'Echoes': '되울림',
        'Equinox': '이분점',
        'Exodus': '엑소더스',
        'Heros\'s Glory': '헤로이스의 영광',
        'Heros\'s Radiance': '헤로이스의 광휘',
        'Heros\'s Sundering': '헤로이스의 절단',
        'Highest Holy': '지고의 홀리',
        'Incandescence': '환섬광',
        'Infralateral Arc': '접선호',
        'Lateral Aureole': '측면 후광',
        'Light of the Crystal': '크리스탈의 빛',
        'Lightwave': '빛의 파도',
        'Magos\'s Radiance': '마고스의 광휘',
        'Mousa\'s Scorn': '무사의 경멸',
        'Parhelic Circle': '무리해고리',
        'Pure Crystal': '순수 크리스탈',
        'Radiant Halo': '눈부신 빛무리',
        'Shining Saber': '찬란한 검',
        'Subparhelion': '무리햇빛',
        '(?<!Radiant )Halo': '빛무리',
        '(?<!Sub)Parhelion': '무리해',
      },
    },
  ],
});
