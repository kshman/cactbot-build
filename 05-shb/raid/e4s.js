Options.Triggers.push({
  id: 'EdensGateSepultureSavage',
  zoneId: ZoneId.EdensGateSepultureSavage,
  timelineFile: 'e4s.txt',
  initData: () => {
    return {
      plateFracture: [],
      gaolPlayers: [],
      gaolPlayerCount: 0,
    };
  },
  timelineTriggers: [
    {
      id: 'E4S Earthen Anguish',
      regex: /Earthen Anguish/,
      beforeSeconds: 3,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.tankBusters,
      },
    },
  ],
  triggers: [
    {
      id: 'E4S Earthen Gauntlets',
      type: 'Ability',
      netRegex: { id: '40E6', source: 'Titan', capture: false },
      run: (data) => {
        data.phase = 'landslide';
        delete data.printedBury;
      },
    },
    {
      id: 'E4S Earthen Armor',
      type: 'Ability',
      netRegex: { id: ['40E7', '40E9'], source: 'Titan', capture: false },
      run: (data) => {
        data.phase = 'armor';
        delete data.printedBury;
      },
    },
    {
      id: 'E4S Stonecrusher',
      type: 'StartsUsing',
      netRegex: { id: '4116', source: 'Titan' },
      // As this seems to usually seems to be invulned,
      // don't make a big deal out of it.
      response: Responses.tankBuster('info'),
    },
    {
      id: 'E4S Pulse of the Land',
      type: 'HeadMarker',
      netRegex: { id: '00B9' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Yellow Spread',
          ja: '黄色散会',
          ko: '🟡노랑 흩어져요',
        },
      },
    },
    {
      id: 'E4S Evil Earth',
      type: 'StartsUsing',
      netRegex: { id: '410C', source: 'Titan', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Look for Evil Earth Marker',
          de: 'Schau nach den Grimm der Erde Marker',
          fr: 'Repérez une marque de Terre maléfique',
          ja: '範囲見て',
          cn: '观察地板',
          ko: '사악한 대지 패턴 확인',
        },
      },
    },
    {
      id: 'E4S Force of the Land',
      type: 'HeadMarker',
      netRegex: { id: '00BA' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Orange Stack',
          ja: '赤頭割り',
          ko: '🔴빨강 뭉쳐요',
        },
      },
    },
    {
      id: 'E4S Voice of the Land',
      type: 'StartsUsing',
      netRegex: { id: '4114', source: 'Titan', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'E4S Geocrush',
      type: 'StartsUsing',
      netRegex: { id: '4113', source: 'Titan', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'E4S Massive Landslide - Front',
      type: 'Ability',
      netRegex: { id: '40E6', source: 'Titan', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Landslide: In Front',
          de: 'Armberge: Vor ihm',
          fr: 'Glissement : Devant',
          ja: 'ランスラ: 正面へ',
          cn: '面前躲避',
          ko: '완갑: 정면',
        },
      },
    },
    {
      id: 'E4S Massive Landslide - Sides',
      type: 'Ability',
      netRegex: { id: '4117', source: 'Titan', capture: false },
      response: Responses.goSides('info'),
    },
    {
      id: 'E4S Landslide',
      type: 'StartsUsing',
      netRegex: { id: '411A', source: 'Titan', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Back Corners',
          de: 'Hintere Ecken',
          fr: 'Coins arrière',
          ja: 'ランスラくるよ',
          cn: '后方角落',
          ko: '뒤쪽 구석으로',
        },
      },
    },
    {
      id: 'E4S Crumbling Down',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bomb on YOU',
          de: 'Bombe auf DIR',
          fr: 'Bombe sur VOUS',
          ja: 'マーカーついた',
          cn: '炸弹点名',
          ko: '거리감쇠 징 대상자',
        },
      },
    },
    {
      // Bomb positions are all x = (86 west, 100 mid, 114 east), y = (86, 100, 114).
      // Note: as these may hit multiple people, there may be multiple lines for the same bomb.
      id: 'E4S Bury Directions',
      type: 'Ability',
      netRegex: { id: '4142', source: 'Bomb Boulder' },
      condition: (data) => !data.printedBury,
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        if (data.phase === 'armor') {
          // Three line bombs (middle, e/w, w/e), with seismic wave.
          if (x < 95) {
            data.printedBury = true;
            return output.hideBehindEast();
          } else if (x > 105) {
            data.printedBury = true;
            return output.hideBehindWest();
          }
        } else if (data.phase === 'landslide') {
          // Landslide cardinals/corners + middle, followed by remaining 4.
          const xMiddle = x < 105 && x > 95;
          const yMiddle = y < 105 && y > 95;
          // Ignore middle point, which may come first.
          if (xMiddle && yMiddle)
            return;
          data.printedBury = true;
          if (!xMiddle && !yMiddle) {
            // Corners dropped first.  Cardinals safe.
            return output.goCardinalsFirst();
          }
          // Cardinals dropped first.  Corners safe.
          return output.goCornersFirst();
        }
      },
      outputStrings: {
        hideBehindEast: {
          en: 'Hide Behind East',
          de: 'Im Osten vestecken',
          fr: 'Cachez-vous derrière à l\'est',
          ja: '東',
          cn: '右边躲避',
          ko: '동쪽으로',
        },
        hideBehindWest: {
          en: 'Hide Behind West',
          de: 'Im Westen vestecken',
          fr: 'Cachez-vous derrière à l\'ouest',
          ja: '西',
          cn: '左边躲避',
          ko: '서쪽으로',
        },
        goCardinalsFirst: {
          en: 'Go Cardinals First',
          de: 'Zuerst zu den Seiten gehen',
          fr: 'Allez aux cardinaux en premier',
          ja: 'まずは十字',
          cn: '十字',
          ko: '먼저 측면으로 이동',
        },
        goCornersFirst: {
          en: 'Go Corners First',
          de: 'Zuerst in die Ecken gehen',
          fr: 'Allez dans les coins en premier',
          ja: 'まずはコーナー',
          cn: '先去角落',
          ko: '먼저 구석으로 이동',
        },
      },
    },
    {
      id: 'E4S Fault Line - Sides',
      type: 'Ability',
      netRegex: { id: '40E8', source: 'Titan', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Wheels: On Sides',
          de: 'Räder: Zur Seite',
          fr: 'Roues : Sur les côtés',
          ja: '車輪: 横へ',
          cn: '车轮：两侧',
          ko: '바퀴: 옆으로',
        },
      },
    },
    {
      id: 'E4S Fault Line - Front',
      type: 'Ability',
      netRegex: { id: '411F', source: 'Titan', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Tank Charge',
          de: 'Tank wird angefahren',
          fr: 'Charge tank',
          ja: 'タンクに突進',
          cn: '坦克冲锋',
          ko: '탱커를 향해 돌진',
        },
      },
    },
    {
      id: 'E4S Magnitude 5.0',
      type: 'StartsUsing',
      netRegex: { id: '4121', source: 'Titan', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'E4S Earthen Fury',
      type: 'StartsUsing',
      netRegex: { id: '4124', source: 'Titan Maximum', capture: false },
      response: Responses.bigAoe(),
      run: (data) => data.plateFracture = [],
    },
    {
      id: 'E4S Earthen Fury with Bleed',
      // applies 5C2 Filthy
      type: 'StartsUsing',
      netRegex: { id: '413A', source: 'Titan Maximum', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'E4S Earthen Fist - Left/Right',
      type: 'StartsUsing',
      netRegex: { id: '412F', source: 'Titan Maximum', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.leftThenRight,
      },
    },
    {
      id: 'E4S Earthen Fist - Right/Left',
      type: 'StartsUsing',
      netRegex: { id: '4130', source: 'Titan Maximum', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.rightThenLeft,
      },
    },
    {
      id: 'E4S Earthen Fist - 2x Left',
      type: 'StartsUsing',
      netRegex: { id: '4131', source: 'Titan Maximum', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Left => Stay Left',
          de: 'Links, Links bleiben',
          fr: 'À gauche, puis restez',
          ja: 'ずっと左',
          cn: '一直在左',
          ko: '왼쪽 🔜 왼쪽',
        },
      },
    },
    {
      id: 'E4S Earthen Fist - 2x Right',
      type: 'StartsUsing',
      netRegex: { id: '4132', source: 'Titan Maximum', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Right => Stay Right',
          de: 'Rechts, Rechts bleiben',
          fr: 'À droite, puis restez',
          ja: 'ずっと右',
          cn: '一直在右',
          ko: '오른쪽 🔜 오른쪽',
        },
      },
    },
    {
      id: 'E4S Dual Earthen Fists',
      type: 'StartsUsing',
      netRegex: { id: '4135', source: 'Titan Maximum', capture: false },
      response: Responses.knockback('info'),
    },
    {
      id: 'E4S Weight of the World',
      type: 'HeadMarker',
      netRegex: { id: '00BB' },
      condition: Conditions.targetIsYou(),
      alarmText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Blue Weight',
          ja: '青重み',
          ko: '🔵파랑 혼자 범위',
        },
      },
    },
    {
      id: 'E4S Megalith',
      type: 'HeadMarker',
      netRegex: { id: '005D' },
      alertText: (data, matches, output) => {
        if (data.role !== 'tank')
          return output.awayFromTanks();
        if (matches.target === data.me)
          return output.stackOnYou();
        return output.stackOn({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        awayFromTanks: {
          en: 'Away from Tanks',
          de: 'Weg von den Tanks',
          fr: 'Éloignez-vous des tanks',
          ja: 'タンクから離れ',
          cn: '远离坦克',
          ko: '탱커에서 멀어지기',
        },
        stackOnYou: Outputs.stackOnYou,
        stackOn: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'E4S Granite Gaol Collect',
      type: 'HeadMarker',
      netRegex: { id: '00BF' },
      run: (data, matches) => data.gaolPlayers.push(matches.target),
    },
    {
      id: 'E4S Granite Gaol',
      type: 'HeadMarker',
      netRegex: { id: '00BF', capture: false },
      condition: (data) => data.gaolPlayers.length === 2 && data.gaolPlayers.includes(data.me),
      alarmText: (data, _matches, output) => {
        const [first, second] = data.gaolPlayers;
        const other = first === data.me ? second : first;
        return output.text({ player: data.party.member(other) });
      },
      outputStrings: {
        text: {
          en: 'Gaol on YOU (w/${player})',
          ja: '自分にジェイル: (${player})',
          ko: '내게 감옥 (${player})',
        },
      },
    },
    {
      id: 'E4S Plate Fracture - Front Right',
      type: 'StartsUsing',
      netRegex: { id: '4125', source: 'Titan Maximum', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const last = data.plateFracture[data.plateFracture.length - 1];
        if (data.plateFracture.length === 2 || last === 'backRight')
          return output.left();
        if (data.plateFracture.length === 1 || last === 'frontLeft')
          return output.back();
        return output.leftOrBack();
      },
      run: (data) => data.plateFracture.push('frontRight'),
      outputStrings: {
        leftOrBack: {
          en: 'Left (or Back)',
          de: 'VON VORNE RECHTS RUNTER',
          fr: 'PARTEZ DE L\'AVANT DROITE',
          ja: '右前壊れるよ',
          cn: '破坏右前',
          ko: '앞 오른쪽 피하기', // FIXME
        },
        left: Outputs.left,
        back: Outputs.back,
      },
    },
    {
      id: 'E4S Plate Fracture - Back Right',
      type: 'StartsUsing',
      netRegex: { id: '4126', source: 'Titan Maximum', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const last = data.plateFracture[data.plateFracture.length - 1];
        if (data.plateFracture.length === 2 || last === 'frontRight')
          return output.left();
        if (data.plateFracture.length === 1 || last === 'backLeft')
          return output.front();
        return output.leftOrFront();
      },
      run: (data) => data.plateFracture.push('backRight'),
      outputStrings: {
        leftOrFront: {
          en: 'Left (or Front)',
          de: 'VON HINTEN RECHTS RUNTER',
          fr: 'PARTEZ DE L\'ARRIÈRE DROITE',
          ja: '右後ろ壊れるよ',
          cn: '破坏右后',
          ko: '뒤 오른쪽 피하기', // FIXME
        },
        left: Outputs.left,
        front: Outputs.front,
      },
    },
    {
      id: 'E4S Plate Fracture - Back Left',
      type: 'StartsUsing',
      netRegex: { id: '4127', source: 'Titan Maximum', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const last = data.plateFracture[data.plateFracture.length - 1];
        if (data.plateFracture.length === 2 || last === 'frontLeft')
          return output.right();
        if (data.plateFracture.length === 1 || last === 'backRight')
          return output.front();
        return output.frontOrRight();
      },
      run: (data) => data.plateFracture.push('backLeft'),
      outputStrings: {
        frontOrRight: {
          en: 'Right (or Front)',
          de: 'VON HINTEN LINKS RUNTER',
          fr: 'PARTEZ DE L\'ARRIÈRE GAUCHE',
          ja: '左後ろ壊れるよ',
          cn: '破坏左后',
          ko: '뒤 왼쪽 피하기', // FIXME
        },
        right: Outputs.right,
        front: Outputs.front,
      },
    },
    {
      id: 'E4S Plate Fracture - Front Left',
      type: 'StartsUsing',
      netRegex: { id: '4128', source: 'Titan Maximum', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const last = data.plateFracture[data.plateFracture.length - 1];
        if (data.plateFracture.length === 2 || last === 'backLeft')
          return output.right();
        if (data.plateFracture.length === 1 || last === 'frontRight')
          return output.back();
        return output.backOrRight();
      },
      run: (data) => data.plateFracture.push('frontLeft'),
      outputStrings: {
        backOrRight: {
          en: 'Right (or Back)',
          de: 'VON VORNE LINKS RUNTER',
          fr: 'PARTEZ DE L\'AVANT GAUCHE',
          ja: '左前壊れるよ',
          cn: '破坏左前',
          ko: '앞 왼쪽 피하기', // FIXME
        },
        right: Outputs.right,
        back: Outputs.back,
      },
    },
    {
      id: 'E4S Tumult',
      type: 'StartsUsing',
      netRegex: { id: '412A', source: 'Titan Maximum', capture: false },
      response: Responses.aoe(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Bomb Boulder': 'Bomber-Brocken',
        '(?<!Gigan)Titan': 'Titan',
        'Titan Maximum': 'Gigantitan',
      },
      'replaceText': {
        'Bomb Boulders': 'Tumulus',
        'Crumbling Down': 'Felsfall',
        'Dual Earthen Fists': 'Gaias Hammerfaust',
        'Earthen Anguish': 'Gaias Pein',
        'Earthen Armor': 'Basaltpanzer',
        '(?<! )Earthen Fist': 'Gaias Faust',
        'Earthen Fury': 'Gaias Zorn',
        'Earthen Gauntlets': 'Gaia-Armberge',
        'Earthen Wheels(?!/)': 'Gaia-Räder',
        'Earthen Wheels/Gauntlets': 'Gaia-Räder/Armberge',
        'Evil Earth': 'Grimm der Erde',
        'Force of the Land': 'Gaias Tosen',
        'Geocrush': 'Kraterschlag',
        '(?<! )Landslide': 'Bergsturz',
        'Magnitude 5.0': 'Magnitude 5.0',
        'Megalith': 'Megalithenbrecher',
        'Orogenesis': 'Orogenese',
        'Plate Fracture': 'Felsberster',
        'Pulse of the Land': 'Gaias Beben',
        'Right/Left Landslide': 'Rechter/Linker Bergsturz',
        'Rock Throw': 'Granitgefängnis',
        'Seismic Wave': 'Seismische Welle',
        'Stonecrusher': 'Felsbrecher',
        'Tectonic Uplift': 'Tektonische Hebung',
        'Tumult': 'Katastrophales Beben',
        'Voice of the Land': 'Aufschrei der Erde',
        'Weight of the Land': 'Gaias Gewicht',
        'Weight of the World': 'Schwere der Erde',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Bomb Boulder': 'Bombo Rocher',
        'Titan(?! )': 'Titan',
        'Titan Maximum': 'Maxi Titan',
      },
      'replaceText': {
        '\\?': ' ?',
        'Bomb Boulders': 'Bombo rocher',
        'Crumbling Down': 'Chute de monolithes',
        'Dual Earthen Fists': 'Frappe de la terre',
        'Earthen Anguish': 'Peine de la terre',
        'Earthen Armor': 'Armure tellurique',
        '(?<! )Earthen Fist': 'Poing de la terre',
        'Earthen Fury': 'Fureur tellurique',
        'Earthen Gauntlets': 'Poing tellurique',
        'Earthen Wheels(?!/)': 'Pas tellurique',
        'Earthen Wheels/Gauntlets': 'Pas/Poing tellurique',
        'Evil Earth': 'Terre maléfique',
        'Force of the Land': 'Grondement tellurique',
        'Geocrush': 'Broie-terre',
        '(?<! )Landslide': 'Glissement de terrain',
        'Magnitude 5.0': 'Magnitude 5',
        'Megalith': 'Écrasement mégalithique',
        'Orogenesis': 'Orogenèse',
        'Plate Fracture': 'Fracture rocheuse',
        'Pulse of the Land': 'Vibration tellurique',
        'Right/Left Landslide': 'Glissement dextre/senestre',
        'Rock Throw': 'Jeté de rocs',
        'Seismic Wave': 'Ondes sismiques',
        'Stonecrusher': 'Éruption tellurique',
        'Tectonic Uplift': 'Soulèvement tectonique',
        'Tumult': 'Tumulte',
        'Voice of the Land': 'Hurlement tellurique',
        'Weight of the Land': 'Poids de la terre',
        'Weight of the World': 'Poids du monde',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Bomb Boulder': 'ボムボルダー',
        'Titan(?! )': 'タイタン',
        'Titan Maximum': 'マキシタイタン',
      },
      'replaceText': {
        '\\?': '?',
        'Bomb Boulders': 'ボムボルダー',
        'Crumbling Down': '岩盤崩落',
        'Dual Earthen Fists': '大地の両拳',
        'Earthen Anguish': '大地の痛み',
        'Earthen Armor': '大地の鎧',
        '(?<! )Earthen Fist': '大地の拳',
        'Earthen Fury': '大地の怒り',
        'Earthen Gauntlets': '大地の手甲',
        'Earthen Wheels(?!/)': '大地の車輪',
        'Earthen Wheels/Gauntlets': '大地の車輪/手甲',
        'Evil Earth': 'イビルアース',
        'Force of the Land': '大地の轟き',
        'Geocrush': 'ジオクラッシュ',
        '(?<! )Landslide': 'ランドスライド',
        'Magnitude 5.0': 'マグニチュード5.0',
        'Megalith': 'メガリスクラッシュ',
        'Orogenesis': 'オーロジェニー',
        'Plate Fracture': 'ロックフラクチャー',
        'Pulse of the Land': '大地の響き',
        'Right/Left Landslide': 'レフト/ライト・ランドスライド',
        'Rock Throw': 'グラナイト・ジェイル',
        'Seismic Wave': 'サイズミックウェーブ',
        'Stonecrusher': 'ロッククラッシュ',
        'Tectonic Uplift': 'クラスタルアップリフト',
        'Tumult': '激震',
        'Voice of the Land': '大地の叫び',
        'Weight of the Land': '大地の重み',
        'Weight of the World': '大陸の重み',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Bomb Boulder': '爆破岩石',
        'Titan(?! )': '泰坦',
        'Titan Maximum': '极大泰坦',
      },
      'replaceText': {
        'Bomb Boulders': '爆破岩石',
        'Crumbling Down': '岩层崩落',
        'Dual Earthen Fists': '大地之双拳',
        'Earthen Anguish': '大地之痛',
        'Earthen Armor': '大地之铠',
        '(?<! )Earthen Fist': '大地之拳',
        'Earthen Fury': '大地之怒',
        'Earthen Gauntlets': '大地之手甲',
        'Earthen Wheels(?!/)': '大地之车轮',
        'Earthen Wheels/Gauntlets': '大地之车轮/手甲',
        'Evil Earth': '邪土',
        'Force of the Land': '大地之轰',
        'Geocrush': '大地粉碎',
        '(?<! )Landslide': '地裂',
        'Magnitude 5.0': '震级5.0',
        'Megalith': '巨石',
        'Orogenesis': '造山',
        'Plate Fracture': '岩盘粉碎',
        'Pulse of the Land': '大地之响',
        'Right/Left Landslide': '右/左地裂',
        'Rock Throw': '花岗岩牢狱',
        'Seismic Wave': '地震波',
        'Stonecrusher': '崩岩',
        'Tectonic Uplift': '地壳上升',
        'Tumult': '怒震',
        'Voice of the Land': '大地之号',
        'Weight of the Land': '大地之重',
        'Weight of the World': '铁球',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Bomb Boulder': '바위폭탄',
        'Titan(?! )': '타이탄',
        'Titan Maximum': '거대 타이탄',
      },
      'replaceText': {
        'Bomb Boulders': '바위폭탄',
        'Crumbling Down': '암반 낙하',
        'Dual Earthen Fists': '대지의 두 주먹',
        'Earthen Anguish': '대지의 고통',
        'Earthen Armor': '대지의 갑옷',
        '(?<! )Earthen Fist': '대지의 주먹',
        'Earthen Fury': '대지의 분노',
        'Earthen Gauntlets': '대지의 완갑',
        'Earthen Wheels(?!/)': '대지의 바퀴',
        'Earthen Wheels/Gauntlets': '대지의 바퀴/완갑',
        'Evil Earth': '사악한 대지',
        'Force of the Land': '대지의 고동',
        'Geocrush': '대지 붕괴',
        '(?<! )Landslide': '산사태',
        'Magnitude 5.0': '진도 5.0',
        'Megalith': '거석 붕괴',
        'Orogenesis': '조산 운동',
        'Plate Fracture': '지각판 파쇄',
        'Pulse of the Land': '대지의 울림',
        'Right/Left Landslide': '좌/우측 산사태',
        'Rock Throw': '화강암 감옥',
        'Seismic Wave': '지진파',
        'Stonecrusher': '암석 붕괴',
        'Tectonic Uplift': '지각 융기',
        'Tumult': '격진',
        'Voice of the Land': '대지의 외침',
        'Weight of the Land': '대지의 무게',
        'Weight of the World': '대륙의 무게',
      },
    },
  ],
});
