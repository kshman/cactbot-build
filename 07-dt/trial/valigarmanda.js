const arcaneLanesConst = [
  'northFront',
  'northBack',
  'middleFront',
  'middleBack',
  'southFront',
  'southBack',
];
const headMarkerData = {
  // Offsets: 141904,234848,462721,578694,714386
  // Vfx Path: m0656_move_s5count3x
  'freezingDustMove': '00E1',
  // Offsets: 80461,507712,623762
  // Vfx Path: tank_lockonae_6m_5s_01t
  'iceTalonBuster': '0158',
};
Options.Triggers.push({
  id: 'WorquorLarDor',
  zoneId: ZoneId.WorqorLarDor,
  timelineFile: 'valigarmanda.txt',
  initData: () => ({
    phase: 'start',
    iceTalonOnYou: false,
    arcaneLaneSafe: [...arcaneLanesConst],
  }),
  triggers: [
    // ************** GENERAL ************** //
    {
      id: 'Valigarmanda Phase Tracker',
      type: 'StartsUsing',
      // 8D41: Skyruin (Ice), 95C2: Skyruin (Storm)
      netRegex: { id: ['8D41', '95C2'], source: 'Valigarmanda' },
      run: (data, matches) => data.phase = matches.id === '95C2' ? 'storm' : 'ice',
    },
    {
      id: 'Valigarmanda Strangling Coil',
      type: 'StartsUsing',
      netRegex: { id: '8D3F', source: 'Valigarmanda', capture: false },
      durationSeconds: 6.5,
      alertText: (_data, _matches, output) => output.donut(),
      outputStrings: {
        donut: {
          en: 'Donut (In)',
          de: 'Donut (Rein)',
          fr: 'Donut (Intérieur)',
          ja: 'ドーナツの中へ',
          cn: '中间月环',
          ko: '도넛 안으로',
        },
      },
    },
    {
      id: 'Valigarmanda Slithering Strike',
      type: 'StartsUsing',
      netRegex: { id: '8D3D', source: 'Valigarmanda', capture: false },
      durationSeconds: 6.5,
      alertText: (_data, _matches, output) => output.out(),
      outputStrings: {
        out: Outputs.outOfMelee,
      },
    },
    {
      id: 'Valigarmanda Susurrant Breath',
      type: 'StartsUsing',
      netRegex: { id: '8D3B', source: 'Valigarmanda', capture: false },
      durationSeconds: 6.5,
      alertText: (_data, _matches, output) => output.cone(),
      outputStrings: {
        cone: {
          en: 'Front Corner',
          de: 'Vordere Ecken',
          fr: 'Coin devant',
          ja: '前方の角へ',
          cn: '前面角落',
          ko: '앞쪽 모서리로',
        },
      },
    },
    {
      id: 'Valigarmanda Ice Talon Headmarker Collect',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.iceTalonBuster },
      condition: Conditions.targetIsYou(),
      run: (data) => data.iceTalonOnYou = true,
    },
    {
      id: 'Valigarmanda Ice Talon',
      type: 'StartsUsing',
      netRegex: { id: '8D58', source: 'Valigarmanda', capture: false },
      delaySeconds: 0.2,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          busterOnYou: Outputs.tankBusterOnYou,
          avoid: Outputs.tankBusters,
        };
        if (data.iceTalonOnYou)
          return { alertText: output.busterOnYou() };
        return { infoText: output.avoid() };
      },
      run: (data) => data.iceTalonOnYou = false,
    },
    {
      id: 'Valigarmanda Skyruin',
      type: 'StartsUsing',
      netRegex: { id: ['8D41', '95C2'], source: 'Valigarmanda', capture: false },
      delaySeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'Valigarmanda Disaster Zone',
      type: 'StartsUsing',
      netRegex: { id: ['8D44', '8D46'], source: 'Valigarmanda', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Valigarmanda Ruinfall Tower',
      type: 'StartsUsing',
      netRegex: { id: '8D5B', source: 'Valigarmanda', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.soakTower();
        return output.avoidTower();
      },
      outputStrings: {
        soakTower: {
          en: 'Soak Tower',
          de: 'Turm nehmen',
          fr: 'Prenez la Tour',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '타워 밟아요',
        },
        avoidTower: {
          en: 'Avoid Tower',
          de: 'Turm vermeiden',
          fr: 'Évitez la tour',
          ja: '塔を避ける',
          cn: '远离塔',
          ko: '타워 피해요',
        },
      },
    },
    {
      id: 'Valigarmanda Ruinfall Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8D5D', source: 'Valigarmanda', capture: false },
      // 8s between cast start and knockback applied
      delaySeconds: 3,
      response: Responses.knockback(),
    },
    // ************** STORM PHASE ************** //
    {
      id: 'Valigarmanda Thunderous Breath',
      type: 'StartsUsing',
      netRegex: { id: '8D4F', source: 'Valigarmanda', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Be on elevated tile',
          de: 'Sei auf einer schwebenden Fläche',
          fr: 'Restez sur une tuile surélevée',
          ja: '風エリアで浮く',
          cn: '站在浮空方块',
          ko: '뜨는 타일로',
        },
      },
    },
    {
      id: 'Valigarmanda Blighted Bolt',
      type: 'StartsUsing',
      netRegex: { id: '8D4C', source: 'Valigarmanda', capture: false },
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Be on ground tile - avoid feathers',
          de: 'Sei auf einer Boden-Fläche - vermeide Federn',
          fr: 'Restez sur une tuile au sol - Évitez les plumes',
          ja: '地上で羽を避ける',
          cn: '站在地面方块 - 躲避羽毛',
          ko: '바닥 타일로 (깃털 피해요)',
        },
      },
    },
    {
      // NOTE: Combatants seem to get added with correct/final position data, but if this
      // ends up being stale for some people, this can be changed to a `getCombatants` call.
      id: 'Valigarmanda Storm Arcane Sphere Collect',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Sphere' },
      condition: (data) => data.phase === 'storm',
      run: (data, matches) => {
        const posY = parseFloat(matches.y);
        // 5 spheres will spawn in 6 possible y positions: 87.5, 92.5, 97.5, 102.5, 107.5, 112.5
        if (posY < 88)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'northFront');
        else if (posY < 93)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'northBack');
        else if (posY < 98)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'middleFront');
        else if (posY < 103)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'middleBack');
        else if (posY < 108)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'southFront');
        else
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'southBack');
      },
    },
    {
      id: 'Valigarmanda Storm Arcane Sphere Safe',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Sphere', capture: false },
      condition: (data) => data.phase === 'storm',
      delaySeconds: 1,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        const safe = data.arcaneLaneSafe[0];
        if (data.arcaneLaneSafe.length !== 1 || safe === undefined)
          return output.avoid();
        return output[safe]();
      },
      run: (data) => data.arcaneLaneSafe = [...arcaneLanesConst],
      outputStrings: {
        avoid: {
          en: 'Dodge spheres',
          de: 'Spheren ausweichen',
          fr: 'Évitez les sphères',
          ja: '玉を避ける',
          cn: '躲开球',
          ko: '장판 피해요',
        },
        northFront: {
          en: 'North Row, Front Half',
          de: 'Nördliche Reihe, Vordere Hälfte',
          fr: 'Ligne Nord, Moitié avant',
          ja: '北側の前方へ',
          cn: '第一行前半',
          ko: '북쪽 줄, 앞부분',
        },
        northBack: {
          en: 'North Row, Back Half',
          de: 'Nördliche Reihe, Hintere Hälfte',
          fr: 'Ligne Nord, Moitié arrière',
          ja: '北側の後方へ',
          cn: '第一行后半',
          ko: '북쪽 줄, 뒷부분',
        },
        middleFront: {
          en: 'Middle Row, Front Half',
          de: 'Mittlere Reihe, Vordere Hälfte',
          fr: 'Ligne centrale, Moitié avant',
          ja: '中央の前方へ',
          cn: '第二行前半',
          ko: '가운데 줄, 앞부분',
        },
        middleBack: {
          en: 'Middle Row, Back Half',
          de: 'Mittlere Reihe, Hintere Hälfte',
          fr: 'Ligne centrale, Moitié arrière',
          ja: '中央の後方へ',
          cn: '第二行后半',
          ko: '가운데 줄, 뒷부분',
        },
        southFront: {
          en: 'South Row, Front Half',
          de: 'Südliche Reihe, Vordere Hälfte',
          fr: 'Ligne Sud, Moitié avant',
          ja: '南側の前方へ',
          cn: '第三行前半',
          ko: '남쪽 줄, 앞부분',
        },
        southBack: {
          en: 'South Row, Back Half',
          de: 'Südliche Reihe, Hintere Hälfte',
          fr: 'Ligne Sud, Moitié arrière',
          ja: '南側の後方へ',
          cn: '第三行后半',
          ko: '남쪽 줄, 뒷부분',
        },
      },
    },
    // ************** ICE PHASE ************** //
    {
      id: 'Valigarmanda Northern Cross',
      type: 'MapEffect',
      // 00020001 - cleaves SW half (front/right safe)
      // 00200010 - cleaves NE half (back/left safe)
      netRegex: { flags: ['00020001', '00200010'], location: '02' },
      durationSeconds: 8,
      alertText: (_data, matches, output) => {
        if (matches.flags === '00020001')
          return output.frontRight();
        return output.backLeft();
      },
      outputStrings: {
        backLeft: {
          en: 'Be Back/Left',
          de: 'Sei Hinten/Links',
          fr: 'Arrière/Gauche',
          ja: '後ろ/左へ',
          cn: '左/后 安全',
          ko: '뒤/왼쪽으로',
        },
        frontRight: {
          en: 'Be Front/Right',
          de: 'Sei Vorne/Rechts',
          fr: 'Devant/Droite',
          ja: '前/右へ',
          cn: '右/前 安全',
          ko: '앞/오른쪽으로',
        },
      },
    },
    {
      id: 'Valigarmanda Freezing Dust',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.freezingDustMove },
      condition: Conditions.targetIsYou(),
      durationSeconds: 8,
      response: Responses.moveAround('alert'),
    },
    {
      id: 'Valigarmanda Chilling Cataclysm',
      // The cast is too short for a trigger
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Sphere', capture: false },
      condition: (data) => data.phase === 'ice',
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Dodge star lines',
          de: 'Wiche Sternen-Linien aus',
          fr: 'Esquivez les lignes depuis les étoiles',
          ja: '8方向直線を避ける',
          cn: '躲避星形直线',
          ko: '방사 장판 피해요',
        },
      },
    },
    // ************** ADDS PHASE ************** //
    {
      id: 'Valigarmanda Ruin Foretold',
      type: 'StartsUsing',
      netRegex: { id: '9691', source: 'Valigarmanda', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Valigarmanda Calamitous Cry',
      type: 'Ability',
      // 87A2: First stack marker; 6854: Subsequent stack markers
      netRegex: { id: ['87A2', '6854'], source: 'Valigarmanda' },
      response: Responses.stackMarkerOn('info'),
    },
    // 3-hit AOE. First damage applied ~3.1s after cast finishes, then ~8.5s & ~16.5 thereafter.
    // Time these alerts so that warnings go out ~5s before each hit.
    {
      id: 'Valigarmanda Tulidisaster 1',
      type: 'StartsUsing',
      netRegex: { id: '8D65', source: 'Valigarmanda', capture: false },
      delaySeconds: 5,
      response: Responses.bigAoe(),
    },
    {
      id: 'Valigarmanda Tulidisaster 2',
      type: 'StartsUsing',
      netRegex: { id: '8D65', source: 'Valigarmanda', capture: false },
      delaySeconds: 13.5,
      response: Responses.bigAoe(),
    },
    {
      id: 'Valigarmanda Tulidisaster 3',
      type: 'StartsUsing',
      netRegex: { id: '8D65', source: 'Valigarmanda', capture: false },
      delaySeconds: 21.5,
      response: Responses.bigAoe(),
    },
    {
      id: 'Valigarmanda Eruption',
      type: 'StartsUsing',
      netRegex: { id: '8D5E', source: 'Valigarmanda', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait/dodge puddles x3',
          de: 'Köder und weiche Flächen aus x3',
          fr: 'Déposez/Esquivez les puddles x3',
          ja: '円範囲を捨てる ×3',
          cn: '诱导/躲避圈圈 x3',
          ko: '장판x3 유도/피해요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Calamitous Cry + Calamitous Echo': 'Calamitous Cry + Echo',
        'Slithering Strike/Strangling Coil': 'Middle/Away',
        'Strangling Coil/Slithering Strike/Susurrant Breath': 'Middle/Away/Front Corners',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Arcane Sphere': 'arkan(?:e|er|es|en) Sphäre',
        'Flame-kissed Beacon': 'flammend(?:e|er|es|en) Omen',
        'Valigarmanda': 'Valigarmanda',
      },
      'replaceText': {
        '\\(AoEs\\)': '(AoEs)',
        '\\(ice phase\\)': '(Eis Phase)',
        '\\(knockback\\)': '(Rückstoß)',
        '\\(storm phase\\)': '(Sturm-Phase)',
        '\\(tower\\)': '(Turm)',
        'Arcane Lightning': 'Geflügelter Blitz',
        'Blighted Bolt': 'Unheilvoller Blitzschlag',
        'Calamitous Cry': 'Unheilvoller Schrei',
        'Calamitous Echo': 'Unheilvolles Echo',
        'Chilling Cataclysm': 'Gefrorenes Desaster',
        'Disaster Zone': 'Katastrophengebiet',
        'Eruption': 'Eruption',
        'Freezing Dust': 'Froststaub',
        'Hail of Feathers': 'Federhagel',
        'Ice Talon': 'Eiskralle',
        'Northern Cross': 'Kreuz des Nordens',
        'Ruin Foretold': 'Katastrophenwarnung',
        'Ruinfall': 'Ruinsturz',
        'Skyruin': 'Geißel der Himmel',
        'Slithering Strike': 'Schlängelnder Hieb',
        'Strangling Coil': 'Würgewickel',
        'Susurrant Breath': 'Zischender Atem',
        'Thunderous Breath': 'Gewitteratem',
        'Tulidisaster': 'Turalisaster',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Arcane Sphere': 'sphère arcanique',
        'Flame-kissed Beacon': 'pylône de feu',
        'Valigarmanda': 'Valigarmanda',
      },
      'replaceText': {
        '\\(AoEs\\)': '(AoEs)',
        '\\(ice phase\\)': '(Phase de glace)',
        '\\(knockback\\)': '(Poussée)',
        '\\(storm phase\\)': '(Phase d\'orage)',
        '\\(tower\\)': '(Tour)',
        'Arcane Lightning': 'Éclairs foudroyants',
        'Blighted Bolt': 'Éclairs de foudre catastrophiques',
        'Calamitous Cry': 'Cri calamiteux',
        'Calamitous Echo': 'Écho calamiteux',
        'Chilling Cataclysm': 'Désastre glaçant',
        'Disaster Zone': 'Zone de désastre',
        'Eruption': 'Éruption',
        'Freezing Dust': 'Poussière glaçante',
        'Hail of Feathers': 'Déluge de plumes',
        'Ice Talon': 'Serres de glace',
        'Northern Cross': 'Croix du nord',
        'Ruin Foretold': 'Signe de désastre',
        'Ruinfall': 'Plongeon calamiteux',
        'Skyruin': 'Désastre vivant',
        'Slithering Strike': 'Frappe sinueuse',
        'Strangling Coil': 'Enroulement sinueux',
        'Susurrant Breath': 'Souffle sinueux',
        'Thunderous Breath': 'Souffle du dragon',
        'Tulidisaster': 'Désastre du Tural',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Arcane Sphere': '立体魔法陣',
        'Flame-kissed Beacon': '火の徴',
        'Valigarmanda': 'ヴァリガルマンダ',
      },
      'replaceText': {
        'Arcane Lightning': 'ライトニングボルト',
        'Blighted Bolt': '災厄の落雷',
        'Calamitous Cry': 'カラミティクライ',
        'Calamitous Echo': 'カラミティエコー',
        'Chilling Cataclysm': 'コールドディザスター',
        'Disaster Zone': 'ディザスターゾーン',
        'Eruption': 'エラプション',
        'Freezing Dust': 'フリジングダスト',
        'Hail of Feathers': 'フェザーヘイル',
        'Ice Talon': 'アイスタロン',
        'Northern Cross': 'ノーザンクロス',
        'Ruin Foretold': 'ディザスターサイン',
        'Ruinfall': 'カラミティダイヴ',
        'Skyruin': 'リビングディザスター',
        'Slithering Strike': 'スリザーストライク',
        'Strangling Coil': 'スリザーコイル',
        'Susurrant Breath': 'スリザーブレス',
        'Thunderous Breath': 'サンダーブレス',
        'Tulidisaster': 'トラルディザスター',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Arcane Sphere': '立体魔法阵',
        'Flame-kissed Beacon': '火之征兆',
        'Valigarmanda': '艳翼蛇鸟',
      },
      'replaceText': {
        '\\(AoEs\\)': '(AOE)',
        '\\(ice phase\\)': '(冰阶段)',
        '\\(knockback\\)': '(击退)',
        '\\(storm phase\\)': '(风暴阶段)',
        '\\(tower\\)': '(塔)',
        'Arcane Lightning': '奥秘闪电',
        'Blighted Bolt': '灾厄落雷',
        'Calamitous Cry': '灾祸之鸣',
        'Calamitous Echo': '灾祸之声',
        'Chilling Cataclysm': '冰之灾祸',
        'Disaster Zone': '灾祸领域',
        'Eruption': '地火喷发',
        'Freezing Dust': '结冰尘',
        'Hail of Feathers': '骤羽',
        'Ice Talon': '冰爪',
        'Northern Cross': '北十字星',
        'Ruin Foretold': '灾祸预兆',
        'Ruinfall': '灾祸冲',
        'Skyruin': '拥有生命的天灾',
        'Slithering Strike': '蛇行强袭',
        'Strangling Coil': '蛇行盘绕',
        'Susurrant Breath': '蛇行吐息',
        'Thunderous Breath': '雷鸣吐息',
        'Tulidisaster': '图拉尔灾祸',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Arcane Sphere': '입체마법진',
        'Flame-kissed Beacon': '불의 상징',
        'Valigarmanda': '발리가르만다',
      },
      'replaceText': {
        '\\(AoEs\\)': '(장판)',
        '\\(ice phase\\)': '(얼음 페이즈)',
        '\\(knockback\\)': '(넉백)',
        '\\(storm phase\\)': '(번개 페이즈)',
        '\\(tower\\)': '(기둥)',
        '\\(storm/ice phase\\?\\)': '(번개/얼음 페이즈?)',
        'Arcane Lightning': '벼락불',
        'Blighted Bolt': '재앙의 낙뢰',
        'Calamitous Cry': '재앙의 포효',
        'Calamitous Echo': '재앙의 메아리',
        'Chilling Cataclysm': '냉기 재앙',
        'Disaster Zone': '재앙 지대',
        'Eruption': '용암 분출',
        'Freezing Dust': '빙결 분진',
        'Hail of Feathers': '깃털 우박',
        'Ice Talon': '얼음 발톱',
        'Northern Cross': '북십자성',
        'Ruin Foretold': '재앙의 징조',
        'Ruinfall': '재앙 강하',
        'Skyruin': '살아있는 재앙',
        'Slithering Strike': '미끄러운 강타',
        'Strangling Coil': '휘감는 똬리',
        'Susurrant Breath': '속삭이는 숨결',
        'Thunderous Breath': '번개 숨결',
        'Tulidisaster': '투랄의 재앙',
      },
    },
  ],
});
