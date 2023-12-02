const centerX = 100;
const centerY = 100;
const distSqr = (a, b) => {
  const dX = parseFloat(a.x) - parseFloat(b.x);
  const dY = parseFloat(a.y) - parseFloat(b.y);
  return dX * dX + dY * dY;
};
const wings = {
  // vfx/lockon/eff/m0829_cst19_9s_c0v.avfx
  topLeftFirst: '01A5',
  // vfx/lockon/eff/m0829_cst20_9s_c0v.avfx
  topRightFirst: '01A6',
  // vfx/lockon/eff/m0829_cst21_6s_c0v.avfx
  middleLeftSecond: '01A7',
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  middleRightSecond: '01A8',
  // vfx/lockon/eff/m0829_cst23_9s_c0v.avfx
  bottomLeftFirst: '01A9',
  // vfx/lockon/eff/m0829_cst24_9s_c0v.avfx
  bottomRightFirst: '01AA',
  // vfx/lockon/eff/m0829_cst19_3s_c0v.avfx
  topLeftThird: '01AF',
  // vfx/lockon/eff/m0829_cst20_3s_c0v.avfx
  topRightThird: '01B0',
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  bottomLeftThird: '01B1',
  // vfx/lockon/eff/m0829_cst23_3s_c0v.avfx
  bottomRightThird: '01B2', // 82E5 damage
};
const superchainNpcNameId = '12377';
const superchainNpcBaseIdMap = {
  destination: '16176',
  out: '16177',
  in: '16178',
  protean: '16179',
  partners: '16180',
};
const engravementLabelMapAsConst = {
  DF8: 'lightTilt',
  DF9: 'darkTilt',
  DFB: 'lightTower',
  DFC: 'darkTower',
  DFD: 'lightBeam',
  DFE: 'darkBeam',
  DFF: 'crossMarked',
  E00: 'xMarked',
};
const engravementLabelMap = engravementLabelMapAsConst;
const engravementIdMap = Object.fromEntries(
  Object.entries(engravementLabelMap).map(([k, v]) => [v, k]),
);
const engravementBeamIds = [
  engravementIdMap.lightBeam,
  engravementIdMap.darkBeam,
];
const engravementTowerIds = [
  engravementIdMap.lightTower,
  engravementIdMap.darkTower,
];
const engravementTiltIds = [
  engravementIdMap.lightTilt,
  engravementIdMap.darkTilt,
];
const engravement3TheosSoulIds = [
  engravementIdMap.crossMarked,
  engravementIdMap.xMarked,
];
const anthroposTetherMap = {
  '00E9': 'light',
  '00EA': 'dark',
  '00FA': 'light',
  '00FB': 'dark', // adequately stretched
};
const tetherAbilityToTowerMap = {
  '82F1': 'lightTower',
  '82F2': 'darkTower',
};
const headmarkers = {
  ...wings,
  // vfx/lockon/eff/tank_laser_5sec_lockon_c0a1.avfx
  glaukopis: '01D7',
  // vfx/lockon/eff/sph_lockon2_num01_s8p.avfx (through sph_lockon2_num04_s8p)
  limitCut1: '0150',
  limitCut2: '0151',
  limitCut3: '0152',
  limitCut4: '0153',
  // vfx/lockon/eff/sph_lockon2_num05_s8t.avfx (through sph_lockon2_num08_s8t)
  limitCut5: '01B5',
  limitCut6: '01B6',
  limitCut7: '01B7',
  limitCut8: '01B8',
  // vfx/lockon/eff/tank_lockonae_0m_5s_01t.avfx
  palladianGrasp: '01D4',
  // vfx/lockon/eff/m0376trg_fire3_a0p.avfx
  chains: '0061',
  // vfx/lockon/eff/lockon3_t0h.avfx
  geocentrismSpread: '0016',
  // vfx/lockon/eff/lockon_en_01v.avfx
  playstationCircle: '016F',
  // vfx/lockon/eff/lockon_sitasankaku_01v.avfx
  playstationTriangle: '0170',
  // vfx/lockon/eff/lockon_sikaku_01v.avfx
  playstationSquare: '0171',
  // vfx/lockon/eff/lockon_batu_01v.avfx
  playstationCross: '0172',
  // vfx/lockon/eff/m0124trg_a4c.avfx
  caloric1Beacon: '012F',
  // vfx/lockon/eff/lockon8_line_1v.avfx
  caloric2InitialFire: '01D6',
  // vfx/lockon/eff/d1014trg_8s_0v.avfx
  caloric2Wind: '01D5',
  // 가이아오초스 작아지는 마커
  gaiaochosMinimal: '0061',
};
const limitCutMap = {
  [headmarkers.limitCut1]: 1,
  [headmarkers.limitCut2]: 2,
  [headmarkers.limitCut3]: 3,
  [headmarkers.limitCut4]: 4,
  [headmarkers.limitCut5]: 5,
  [headmarkers.limitCut6]: 6,
  [headmarkers.limitCut7]: 7,
  [headmarkers.limitCut8]: 8,
};
const limitCutIds = Object.keys(limitCutMap);
const wingIds = Object.values(wings);
const superchainNpcBaseIds = Object.values(superchainNpcBaseIdMap);
const whiteFlameDelayOutputStrings = {
  delay1: {
    en: 'now',
    de: 'jetzt',
    fr: 'Maintenant',
    cn: '现在!',
    ko: '지금 당장',
  },
  delay2: {
    en: 'soon',
    de: 'bald',
    fr: 'Bientôt',
    cn: '等1只小怪',
    ko: '첫번째',
  },
  delay3: {
    en: 'delayed',
    de: 'verzögert',
    fr: 'Retardé',
    cn: '等2只小怪',
    ko: '두번째',
  },
  delay4: {
    en: 'very delayed',
    de: 'sehr verzögert',
    fr: 'Très retardé',
    cn: '等3只小怪',
    ko: '세번째',
  },
  delay5: {
    en: 'verrry delayed',
    de: 'seeeeehr verzögert',
    fr: 'Trèèèès retardé',
    cn: '等4只小怪',
    ko: '네번째',
  },
};
const conceptPairMap = {
  [headmarkers.playstationCircle]: 'circle',
  [headmarkers.playstationTriangle]: 'triangle',
  [headmarkers.playstationSquare]: 'square',
  [headmarkers.playstationCross]: 'cross',
};
const conceptDebuffIds = {
  DE8: 'alpha',
  DE9: 'beta',
};
const conceptDebuffToColor = {
  alpha: 'red',
  beta: 'yellow',
};
const npcBaseIdToConceptColor = {
  16183: 'red',
  16184: 'blue',
  16185: 'yellow',
};
const conceptDebuffEffectIds = Object.keys(conceptDebuffIds);
const conceptNpcBaseIds = Object.keys(npcBaseIdToConceptColor);
const conceptPairIds = Object.keys(conceptPairMap);
// The below functions assign a numerical value to all (shapes) and intercept points:
// xy: 88       96       104       112
// 84  (0)--5--(10)--15--(20)--25--(30)
//      |        |         |         |
//      1       11        21        31
//      |        |         |         |
// 92  (2)--7--(12)--17--(22)--27--(32)
//      |        |         |         |
//      3       13        23        33
//      |        |         |         |
// 100 (4)--9--(14)--19--(24)--29--(34)
const conceptLocationMap = {
  north: [0, 10, 20, 30],
  middle: [2, 12, 22, 32],
  south: [4, 14, 24, 34],
};
const getConceptLocation = (concept) => {
  const x = parseFloat(concept.x);
  const y = parseFloat(concept.y);
  let row;
  if (y < 88)
    row = 'north';
  else
    row = y > 96 ? 'south' : 'middle';
  let col;
  if (x < 92)
    col = 0;
  else if (x > 108)
    col = 3;
  else
    col = x > 100 ? 2 : 1;
  return conceptLocationMap[row][col];
};
const getConceptMap = (startLoc) => {
  // takes a concept location and returns an array containing pairs of [adjacentLocation, interceptLocation]
  const conceptMap = [];
  const expectedLocs = [
    ...conceptLocationMap.north,
    ...conceptLocationMap.middle,
    ...conceptLocationMap.south,
  ];
  const [n, e, s, w] = [startLoc - 2, startLoc + 10, startLoc + 2, startLoc - 10];
  if (expectedLocs.includes(n))
    conceptMap.push([n, n + 1]);
  if (expectedLocs.includes(e))
    conceptMap.push([e, e - 5]);
  if (expectedLocs.includes(s))
    conceptMap.push([s, s - 1]);
  if (expectedLocs.includes(w))
    conceptMap.push([w, w + 5]);
  return conceptMap;
};
const palladionRayOutputStrings = {
  spread: {
    en: 'Spread: ${mesg}',
    ko: '흩어져요: ${mesg}',
  },
  raydown: {
    en: 'Ray down: ${safe}',
    ko: '빔처리: ${safe}',
  },
  safe10: {
    en: '1🡼',
    ko: '1🡼', // α, ○
  },
  safe20: {
    en: '2🡽',
    ko: '2🡽', // α, X
  },
  safe30: {
    en: '3🡼',
    ko: '3🡼', // α, Δ
  },
  safe40: {
    en: '4🡽',
    ko: '4🡽', // α, □
  },
  safe11: {
    en: '1🡿',
    ko: '1🡿', // β, ○
  },
  safe21: {
    en: '2🡾',
    ko: '2🡾', // β, X
  },
  safe31: {
    en: '3🡿',
    ko: '3🡿', // β, Δ
  },
  safe41: {
    en: '4🡾',
    ko: '4🡾', // β, □
  },
  unknown: Outputs.unknown,
};
const getPalladionRayEscape = (phase, ps, ab, output) => {
  if (ps === undefined || ab === undefined)
    return output.unknown();
  const safe1 = { circle: 1, cross: 2, triangle: 3, square: 4 };
  const safe2 = { circle: 4, cross: 3, triangle: 2, square: 1 };
  const mps = phase === 'classical1' ? safe1[ps] : safe2[ps];
  const mab = { alpha: 0, beta: 1 }[ab];
  const safe = output[`safe${mps}${mab}`]();
  return output.raydown({ safe: safe });
};
const ultimaRayDpsArrows = ['arrowE', 'arrowSE', 'arrowS', 'arrowSW'];
const getUltimaRayArrow = (isDps, dir1, dir2) => {
  if (isDps) {
    if (ultimaRayDpsArrows.includes(dir1))
      return dir1;
    if (ultimaRayDpsArrows.includes(dir2))
      return dir2;
  } else {
    if (!ultimaRayDpsArrows.includes(dir1))
      return dir1;
    if (!ultimaRayDpsArrows.includes(dir2))
      return dir2;
  }
  return undefined;
};
const pangenesisEffects = {
  stableSystem: 'E22',
  unstableFactor: 'E09',
  lightTilt: 'DF8',
  darkTilt: 'DF9',
};
const pangenesisEffectIds = Object.values(pangenesisEffects);
const getHeadmarkerId = (data, matches) => {
  if (data.decOffset === undefined) {
    if (data.expectedFirstHeadmarker === undefined) {
      console.error('missing expected first headmarker');
      return 'OOPS';
    }
    data.decOffset = parseInt(matches.id, 16) - parseInt(data.expectedFirstHeadmarker, 16);
  }
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};
Options.Triggers.push({
  id: 'AnabaseiosTheTwelfthCircleSavage',
  zoneId: ZoneId.AnabaseiosTheTwelfthCircleSavage,
  config: [
    {
      id: 'engravement1DropTower',
      name: {
        en: 'Paradeigma 2 Tower Strategy',
        de: 'Paradigma 2 Türme Strategy',
        fr: 'Paradeigma Stratégie 2 Tours',
        ja: 'パラデイグマ2の塔処理方法',
        cn: '范式 2 踩塔方法',
        ko: '파라데이그마 2 타워 공략',
      },
      type: 'select',
      options: {
        en: {
          'Based on Tether': 'tetherbase',
          'Tether direct across + nearest quadrant tower (Game8)': 'quadrant',
          'Clockwise tower from tether': 'clockwise',
          'No strategy: just call tower color': 'tower',
        },
        de: {
          'Verbindungen gerade rüber + nächstgelegener Quadrant Turm (Game8)': 'quadrant',
          'Turm im Uhrzeigersinn von der Verbindungen': 'clockwise',
          'Keine Strategie: einfach Turmfarbe nennen': 'tower',
        },
        fr: {
          'Basé sur les liens': 'tetherbase',
          'Lien direct à travers + tour du quadrant le plus proche (Game8)': 'quadrant',
          'Tour en sens horaire depuis les liens': 'clockwise',
          'Aucune stratégie : Call des couleur des tours uniquement': 'tower',
        },
        ja: {
          'ぬけまるとGame8': 'quadrant',
          '腺から時計回り': 'clockwise',
          '方針なし': 'tower',
        },
        cn: {
          '看小怪位置(菓子)': 'tetherbase',
          '垂直拉线 (Game8)': 'quadrant',
          '对角拉线': 'clockwise',
          '仅提示塔颜色': 'tower',
        },
        ko: {
          '줄 기준': 'tetherbase',
          '게임8': 'quadrant',
          '줄 기준 시계방향': 'clockwise',
          '공략 없음: 그냥 타워 색만 알림': 'tower',
        },
      },
      default: 'quadrant',
    },
    {
      id: 'classicalConceptsPairOrder',
      name: {
        en: 'Classical Concepts: Pairs Order (Left->Right)',
        de: 'Elementarschöpfung: Ordnen nach Paaren (Links->Rechts)',
        cn: '经典概念 索尼顺序（左->右）',
        ko: 'Classical Concepts: 도형 순서 (왼 -> 오)',
      },
      type: 'select',
      options: {
        en: {
          'X□○Δ (BPOG)': 'xsct',
          '○XΔ□ (Lines)': 'cxts',
          '○Δ□X (Rocketship)': 'ctsx',
          '○ΔX□ (Rainbow)': 'ctxs',
          'Δ○X□ (TOXS)': 'tcxs',
          'Just call shape and debuff': 'shapeAndDebuff',
        },
        de: {
          'X□○Δ (BLOG)': 'xsct',
          '○XΔ□ (Linien)': 'cxts',
          '○Δ□X (Raketenschiff)': 'ctsx',
          '○ΔX□ (Regenbogen)': 'ctxs',
          'Δ○X□ (TOXS)': 'tcxs',
          'Just call shape and debuff': 'shapeAndDebuff', // FIXME
        },
        fr: {
          'X□○Δ (BPOG)': 'xsct',
          '○XΔ□ (Lignes)': 'cxts',
          '○Δ□X (Fusée)': 'ctsx',
          '○ΔX□ (Arc-en-ciel)': 'ctxs',
          'Δ○X□ (TOXS)': 'tcxs',
          'Afficher uniquement la forme et le débuff': 'shapeAndDebuff',
        },
        cn: {
          'X□○Δ (BPOG)': 'xsct',
          '○XΔ□ (1234笔画)': 'cxts',
          '○Δ□X (Rocketship)': 'ctsx',
          '○ΔX□ (彩虹)': 'ctxs',
          'Δ○X□ (TOXS)': 'tcxs',
          '只报形状和debuff': 'shapeAndDebuff',
        },
        ko: {
          'X□○Δ (파보빨초)': 'xsct',
          '○XΔ□ (1234)': 'cxts',
          '○Δ□X (동세네엑)': 'ctsx',
          '○ΔX□ (무지개)': 'ctxs',
          'Δ○X□ (TOXS)': 'tcxs',
          '모양과 디버프만 알림': 'shapeAndDebuff',
        },
      },
      default: 'cxts',
    },
    {
      id: 'classicalConcepts2ActualNoFlip',
      comment: {
        en:
          'Only calls final position immediately in chosen pair order with no flip. For example, for BPOG, the blue X (crosses) will be far west. <a href="https://quisquous.github.io/cactbot/resources/images/06ew_raid_p12s_classic2_noflip.webp" target="_blank">Visual</a>',
        de:
          'Nennt die endgültige Position nur sofort in der gewählten Paarreihenfolge ohne Flip.“ Bei BPOG beispielsweise befindet sich das blaue X (Kreuze) weit westlich. <a href="https://quisquous.github.io/cactbot/resources/images/06ew_raid_p12s_classic2_noflip.webp" target="_blank">Visual</a>',
        fr:
          'Afficher la position finale uniquement dans l\'ordre des paires choisies, sans inversion. Par exemple, pour le BPOG, le X bleu (croix) sera loin à l\'ouest. <a href="https://quisquous.github.io/cactbot/resources/images/06ew_raid_p12s_classic2_noflip.webp" target="_blank">Visual</a>',
        cn:
          '只报自己图案的最终位置，没有位置变换。例如，对于 BPOG 打法，蓝 X 是第一列（西面最远）。 <a href="https://quisquous.github.io/cactbot/resources/images/06ew_raid_p12s_classic2_noflip.webp" target="_blank">Visual</a>',
        ko:
          '선택한 도형 순서에 따른 최종 위치만 알립니다. 예시에서 파보빨초를 기준으로 파랑 X는 1열이 됩니다. <a href="https://quisquous.github.io/cactbot/resources/images/06ew_raid_p12s_classic2_noflip.webp" target="_blank">Visual</a>',
      },
      name: {
        en: 'Classical Concepts 2: Actual only & no inversion',
        de: 'Classical Concepts 2: Nur tatsächlich & keine Umkehrung',
        fr: 'Classical Concepts 2 : Actuel uniquement & pas d\'inversion',
        cn: '经典概念2: 实际位置 (没有位置变换)',
        ko: '원소 이데아 2: 반전 없이 실제 위치만 알림',
      },
      type: 'checkbox',
      default: false,
    },
    {
      id: 'pangenesisFirstTower',
      name: {
        en: 'Pangenesis: First Towers',
        de: 'Pangenesis: Erste Türme',
        fr: 'Pangenesis: Première tour',
        cn: '黑白塔',
        ko: '범생설(Pangenesis): 첫번째 기둥',
      },
      type: 'select',
      options: {
        en: {
          'Call Required Swaps Only': 'agnostic',
          '0+2 (HRT)': 'not',
          '1+2 (Yuki/Rinon)': 'one',
        },
        de: {
          'Nenne nur benötigte Wechsel': 'agnostic',
          '0+2 (HRT)': 'not',
          '1+2 (Yuki/Rinon)': 'one',
        },
        fr: {
          'Afficher uniquement les swaps nécessaires': 'agnostic',
          '0+2 (HRT)': 'not',
          '1+2 (Yuki/Rinon)': 'one',
        },
        cn: {
          '只提示交换颜色': 'agnostic',
          '0+2 (HRT)': 'not',
          '1+2 (Yuki/Rinon)': 'one',
        },
        ko: {
          '교체가 필요할 때만 알림': 'agnostic',
          '0+2 (빠른 융합)': 'not',
          '1+2 (Yuki/Rinon)': 'one',
        },
      },
      default: 'agnostic',
    },
  ],
  timelineFile: 'p12s.txt',
  initData: () => {
    return {
      isDoorBoss: true,
      combatantData: [],
      paradeigmaCounter: 0,
      glaukopisSecondHitSame: false,
      engravementCounter: 0,
      engravement1BeamsPosMap: new Map(),
      engravement1TetherIds: [],
      engravement1TetherPlayers: {},
      engravement1LightBeamsPos: [],
      engravement1DarkBeamsPos: [],
      engravement1Towers: [],
      engravement3TowerPlayers: [],
      engravement3TetherPlayers: {},
      wingCollect: [],
      wingCalls: [],
      superchainCollect: [],
      lcCombatants: [],
      lcCombatantsOffset: 0,
      whiteFlameCounter: 0,
      sampleTiles: [],
      darknessClones: [],
      conceptData: {},
      pangenesisRole: {},
      pangenesisTowerCount: 0,
      gaiaochosCounter: 0,
      classicalCounter: 0,
      classicalMarker: {},
      classicalAlphaBeta: {},
      caloricCounter: 0,
      caloric1First: [],
      caloric1Buff: {},
      caloric2PassCount: 0,
      gaiaochosTetherCollect: [],
      seenSecondTethers: false,
    };
  },
  timelineTriggers: [
    {
      id: 'P12S PR 트리니티 처음에 무적',
      regex: /Trinity of Souls 1/,
      beforeSeconds: 3,
      condition: (data) => (data.role === 'tank' || data.job === 'BLU') && !data.prsTrinityInvul,
      alertText: (_data, _matches, output) => output.text(),
      run: (data) => data.prsTrinityInvul = true,
      outputStrings: {
        text: {
          en: 'Tank Invul',
          ja: 'タンク無敵',
          ko: '탱크 무적으로 받아요',
        },
      },
    },
    {
      id: 'P12S 알테마 블레이드',
      regex: /Ultima Blade/,
      beforeSeconds: 4,
      condition: (data) => data.options.AutumnStyle,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Big AoE!',
          ja: '強力な全体攻撃！',
          ko: '엄청 아픈 전체 공격!',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 Pangenesis 전 산개',
      regex: /Pangenesis/,
      beforeSeconds: 12,
      condition: (data) => data.options.AutumnStyle,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '[Pangenesis]',
          ko: '[판제네시스: 나란히 줄 서요]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 1',
      regex: /Ultima 1/,
      beforeSeconds: 7,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.reprisal();
        if (data.CanAddle())
          return output.addle();
      },
      outputStrings: {
        reprisal: {
          en: '[MT Reprisal]',
          ko: '[MT 리프]',
        },
        addle: {
          en: '[Caster Addle]',
          ko: '[아돌 넣으라우]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Gaiaochos 1',
      regex: /Gaiaochos 1/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Buff]',
          ko: '[MT 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 2',
      regex: /Ultima 2/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Reprisal]',
          ko: '[MT 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: The Classical Concepts 1',
      regex: /The Classical Concepts 1/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget !== data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[ST Reprisal]',
          ko: '[ST 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 3',
      regex: /Ultima 3/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget !== data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[ST Buff]',
          ko: '[ST 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Caloric Theory 1',
      regex: /Caloric Theory 1/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Buff]',
          ko: '[MT 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 4',
      regex: /Ultima 4/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget !== data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[ST Reprisal]',
          ko: '[ST 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Pangenesis',
      regex: /Pangenesis/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return data.palladionGrapsTarget === data.me ? output.mt() : output.st();
      },
      outputStrings: {
        mt: {
          en: '[MT Rprisal]',
          ko: '[MT 리프]',
        },
        st: {
          en: '[ST Buff]',
          ko: '[ST 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: The Classical Concepts 2',
      regex: /The Classical Concepts 2/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Buff]',
          ko: '[MT 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 5',
      regex: /Ultima 5/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Reprisal]',
          ko: '[MT 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Caloric Theory 2',
      regex: /Caloric Theory 2/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget !== data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[ST Reprisal + Buff]',
          ko: '[ST 리프 + 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ekpyrosis 2 (cast)',
      regex: /Ekpyrosis 2 \(cast\)/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Buff]',
          ko: '[MT 세이크오프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 6',
      regex: /Ultima 6/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Reprisal]',
          ko: '[MT 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Gaiaochos 2',
      regex: /Gaiaochos 2/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget !== data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[ST Reprisal]',
          ko: '[ST 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 7',
      regex: /Ultima 7/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.palladionGrapsTarget === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '[MT Reprisal]',
          ko: '[MT 리프]',
        },
      },
    },
    //
    {
      id: 'P12S 어듬이 버프: Ultima 8',
      regex: /Ultima 8/,
      beforeSeconds: 8,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return data.palladionGrapsTarget === data.me ? output.mt() : output.st();
      },
      outputStrings: {
        mt: {
          en: '[MT Buff]',
          ko: '[MT 세이크오프]',
        },
        st: {
          en: '[ST Rprisal]',
          ko: '[ST 리프]',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'P12S Phase Tracker 1',
      type: 'StartsUsing',
      netRegex: { id: ['82DA', '82F5', '86FA', '86FB'], source: 'Athena' },
      run: (data, matches) => {
        data.whiteFlameCounter = 0;
        data.superchainCollect = [];
        const phaseMap = {
          '82DA': 'superchain1',
          '82F5': 'palladion',
          '86FA': 'superchain2a',
          '86FB': 'superchain2b',
        };
        data.phase = phaseMap[matches.id];
        delete data.prsNorth;
      },
    },
    {
      id: 'P12S Phase Tracker 2',
      type: 'StartsUsing',
      // 8682 = Ultima cast
      netRegex: { id: '8682', source: 'Pallas Athena', capture: false },
      run: (data) => {
        data.isDoorBoss = false;
        data.expectedFirstHeadmarker = headmarkers.palladianGrasp;
      },
    },
    {
      id: 'P12S Phase Tracker 3',
      type: 'StartsUsing',
      netRegex: { id: ['8326', '8331', '8338', '831E', '833F'], source: 'Pallas Athena' },
      run: (data, matches) => {
        switch (matches.id) {
          case '8326':
            data.phase = data.gaiaochosCounter === 0 ? 'gaiaochos1' : 'gaiaochos2';
            data.gaiaochosCounter++;
            break;
          case '8331':
            data.phase = data.classicalCounter === 0 ? 'classical1' : 'classical2';
            data.classicalCounter++;
            break;
          case '8338':
            data.phase = 'caloric';
            data.caloricCounter++;
            break;
          case '831E':
            data.phase = 'ekpyrosis';
            break;
          case '833F':
            data.phase = 'pangenesis';
            break;
        }
      },
    },
    {
      id: 'P12S Door Boss Headmarker Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['82E7', '82E8'], source: 'Athena' },
      suppressSeconds: 99999,
      run: (data, matches) => {
        // The first headmarker in the door boss is EITHER the bottom left or bottom right wing.
        const isBottomLeft = matches.id === '82E8';
        const first = isBottomLeft ? headmarkers.bottomLeftFirst : headmarkers.bottomRightFirst;
        data.expectedFirstHeadmarker = first;
      },
    },
    // --------------------- Phase 1 ------------------------
    {
      id: 'P12S On the Soul',
      type: 'StartsUsing',
      netRegex: { id: '8304', source: 'Athena', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P12S Paradeigma Counter',
      type: 'StartsUsing',
      netRegex: { id: '82ED', source: 'Athena', capture: false },
      run: (data) => data.paradeigmaCounter++,
    },
    {
      id: 'P12S Paradeigma 1 Clones',
      type: 'Ability',
      // 8314 appears to transform the orbs ("Ideas") into clones once in position
      netRegex: { id: '8314', source: 'Thymou Idea' },
      condition: (data) => data.paradeigmaCounter === 1,
      delaySeconds: 0.5,
      suppressSeconds: 10,
      promise: async (data, matches) => {
        data.combatantData = [];
        const id = parseInt(matches.sourceId, 16);
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [id],
        })).combatants;
      },
      infoText: (data, _matches, output) => {
        if (data.combatantData.length === 0)
          return output.clones({ dir: output.unknown() });
        const y = data.combatantData[0]?.PosY;
        if (y === undefined)
          return output.clones({ dir: output.unknown() });
        if (data.options.AutumnStyle) {
          let cloneSide;
          if (y > centerY) {
            if (data.role === 'tank') {
              data.prsNorth = false;
              cloneSide = 'south';
            } else {
              data.prsNorth = true;
              cloneSide = 'north';
            }
          } else {
            if (data.role === 'tank') {
              data.prsNorth = true;
              cloneSide = 'north';
            } else {
              data.prsNorth = false;
              cloneSide = 'south';
            }
          }
          return output.clones({ dir: output[cloneSide]() });
        }
        const cloneSide = y > centerY ? 'south' : 'north';
        return output.clones({ dir: output[cloneSide]() });
      },
      outputStrings: {
        clones: {
          en: 'Clones ${dir}',
          de: 'Klone ${dir}',
          fr: 'Clones ${dir}',
          ja: '${dir}',
          cn: '分身 ${dir}',
          ko: '${dir}으로',
        },
        north: Outputs.north,
        south: Outputs.south,
        unknown: Outputs.unknown,
      },
    },
    // In Ray 1 (Paradeigma2), two adds always spawn north in pairs with PosX of [85, 105] or [95, 115].
    // Each cleaves 1/4th of the arena. So given one PosX, we can determine the inside/outside safe lanes.
    {
      id: 'P12S Ray of Light 1',
      type: 'StartsUsing',
      netRegex: { id: '82EE', source: 'Anthropos' },
      condition: (data) => data.paradeigmaCounter === 2,
      suppressSeconds: 1,
      alertText: (_data, matches, output) => {
        const x = Math.round(parseFloat(matches.x));
        let safeLanes;
        if (x < 90)
          safeLanes = 'insideWestOutsideEast';
        else if (x > 110)
          safeLanes = 'insideEastOutsideWest';
        else
          safeLanes = x < 100 ? 'insideEastOutsideWest' : 'insideWestOutsideEast';
        return output[safeLanes]();
      },
      outputStrings: {
        insideWestOutsideEast: {
          en: 'Inside West / Outside East',
          de: 'Westen innen / Osten außen',
          fr: 'Intérieur Ouest / Extérieur Est',
          ja: '西の内側 / 東の外側',
          cn: '内左 (西) / 外右 (东)',
          ko: '서[안] / 동[밖]',
        },
        insideEastOutsideWest: {
          en: 'Inside East / Outside West',
          de: 'Osten innen / Westen außen',
          fr: 'Intérieur Est / Extérieur Ouest',
          ja: '西の外側 / 東の内側',
          cn: '内右 (东) / 外左 (西)',
          ko: '동[안] / 서[밖]',
        },
      },
    },
    {
      id: 'P12S First Wing',
      type: 'StartsUsing',
      netRegex: { id: ['82E7', '82E8', '82E1', '82E2'], source: 'Athena' },
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        data.wingCollect = [];
        data.wingCalls = [];
        const isLeftAttack = matches.id === '82E8' || matches.id === '82E2';
        // Normal wings.
        const firstDir = data.superchain2aFirstDir;
        const secondDir = data.superchain2aSecondDir;
        if (data.options.AutumnStyle) {
          if (data.phase !== 'superchain2a') {
            if (data.prsNorth)
              return isLeftAttack ? output.aleft() : output.aright();
            return isLeftAttack ? output.aright() : output.aleft();
          }
          const dir = isLeftAttack ? output.aright() : output.aleft();
          if (firstDir === 'north') {
            if (secondDir === 'north')
              return output.aSc2aNn({ dir: dir });
            return output.aSc2aNs({ dir: dir });
          }
          if (secondDir === 'north')
            return output.aSc2aSn({ dir: dir });
          return output.aSc2aSs({ dir: dir });
        }
        if (data.phase !== 'superchain2a' || firstDir === undefined || secondDir === undefined)
          return isLeftAttack ? output.right() : output.left();
        if (isLeftAttack) {
          if (firstDir === 'north') {
            if (secondDir === 'north')
              return output.superchain2aRightNorthNorth();
            return output.superchain2aRightNorthSouth();
          }
          if (secondDir === 'north')
            return output.superchain2aRightSouthNorth();
          return output.superchain2aRightSouthSouth();
        }
        if (firstDir === 'north') {
          if (secondDir === 'north')
            return output.superchain2aLeftNorthNorth();
          return output.superchain2aLeftNorthSouth();
        }
        if (secondDir === 'north')
          return output.superchain2aLeftSouthNorth();
        return output.superchain2aLeftSouthSouth();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        // This could *also* say partners, but it's always partners and that feels like
        // too much information.  The "after" call could be in an info text or something,
        // but the wings are also calling out info text too.  This is a compromise.
        // Sorry also for spelling this out so explicitly, but I suspect some people
        // might want different left/right calls based on North/South boss facing
        // and it's nice to have a "go through" or "go back" description too.
        superchain2aLeftNorthNorth: {
          en: 'North + Her Left (then back North)',
          de: 'Norden + Links von Ihr (dannach Norden)',
          fr: 'Nord + Sa gauche (puis Nord à nouveau)',
          ja: '北 + 北に戻る (左安置)',
          cn: '上 (北) + Boss左侧 (稍后 回上北)',
          ko: '북쪽 🔜 되돌아 와욧 [왼쪽]',
        },
        superchain2aLeftNorthSouth: {
          en: 'North + Her Left (then go South)',
          de: 'Norden + Links von Ihr (dannach Süden)',
          fr: 'Norf + Sa gauche (puis aller au Sud)',
          ja: '北 + 南へ前進 (左安置)',
          cn: '上 (北) + Boss左侧 (稍后 去下南)',
          ko: '북쪽 🔜 계속 전진 [왼쪽]',
        },
        superchain2aLeftSouthNorth: {
          en: 'South + Left (then go North)',
          de: 'Süden + Links (dannach Norden)',
          fr: 'Sud + Gauche (puis aller au Nord)',
          ja: '南 + 北へ前進 (左安置)',
          cn: '下 (南) + 左 (稍后 去上北)',
          ko: '남쪽 🔜 계속 전진 [왼쪽]',
        },
        superchain2aLeftSouthSouth: {
          en: 'South + Left (then back South)',
          de: 'Süden + Links (dannach Süden)',
          fr: 'Sud + Gauche (puis Sud à nouveau)',
          ja: '南 + 南に戻る (左安置)',
          cn: '下 (南) + 左 (稍后 回下南)',
          ko: '남쪽 🔜 되돌아 와욧 [왼쪽]',
        },
        superchain2aRightNorthNorth: {
          en: 'North + Her Right (then back North)',
          de: 'Norden + Rechts von Ihr (dannach Norden)',
          fr: 'Nord + Sa droite (puis Nord à nouveau)',
          ja: '北 + 北に戻る (右安置)',
          cn: '上 (北) + Boss右侧 (稍后 回上北)',
          ko: '북쪽 🔜 되돌아 와욧 [오른쪽]',
        },
        superchain2aRightNorthSouth: {
          en: 'North + Her Right (then go South)',
          de: 'Norden + Rechts von Ihr (dannach Süden)',
          fr: 'Nord + Sa droite (puis aller au Sud)',
          ja: '北 + 南へ前進 (右安置)',
          cn: '上 (北) + Boss右侧 (稍后 去下南)',
          ko: '북쪽 🔜 계속 전진 [오른쪽]',
        },
        superchain2aRightSouthNorth: {
          en: 'South + Right (then go North)',
          de: 'Süden + Rechts (dannach Norden)',
          fr: 'Sud + Droite (puis aller au Nord)',
          ja: '南 + 北へ前進 (右安置)',
          cn: '下 (南) + 右 (稍后 去上北)',
          ko: '남쪽 🔜 계속 전진 [오른쪽]',
        },
        superchain2aRightSouthSouth: {
          en: 'South + Right (then back South)',
          de: 'Süden + Rechts (dannach Süden)',
          fr: 'Sud + Droite (puis Sud à nouveau)',
          ja: '南 + 南に戻る (右安置)',
          cn: '下 (南) + 右 (稍后 回下南)',
          ko: '남쪽 🔜 되돌아 와욧 [오른쪽]',
        },
        //
        aSc2aNn: {
          en: 'North[${dir}] => North again',
          ko: '북쪽[${dir}] 🔜 다시 북쪽',
        },
        aSc2aNs: {
          en: 'North[${dir}] => Strait South',
          ko: '북쪽[${dir}] 🔜 전진해서 남쪽',
        },
        aSc2aSs: {
          en: 'South[${dir}] => South again',
          ko: '남쪽[${dir}] 🔜 다시 남쪽',
        },
        aSc2aSn: {
          en: 'South[${dir}] => Strait North',
          ko: '남쪽[${dir}] 🔜 전진해서 북쪽',
        },
        aleft: Outputs.arrowW,
        aright: Outputs.arrowE,
      },
    },
    {
      id: 'P12S Wing Collect',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (!wingIds.includes(id))
          return false;
        data.wingCollect.push(id);
        return true;
      },
      delaySeconds: (data) => data.decOffset === undefined ? 1 : 0,
      durationSeconds: (data) => data.wingCollect.length === 3 ? 7 : 2,
      infoText: (data, _matches, output) => {
        if (data.wingCollect.length !== 3 && data.wingCollect.length !== 2)
          return;
        const [first, second, third] = data.wingCollect;
        if (first === undefined || second === undefined)
          return;
        const isFirstLeft = first === wings.topLeftFirst || first === wings.bottomLeftFirst;
        const isSecondLeft = second === wings.middleLeftSecond;
        const isThirdLeft = third === wings.topLeftThird || third === wings.bottomLeftThird;
        const firstStr = isFirstLeft ? output.right() : output.left();
        const isFirstTop = first === wings.topLeftFirst || first === wings.topRightFirst;
        let secondCall;
        let thirdCall;
        if (isFirstTop) {
          secondCall = isFirstLeft === isSecondLeft ? 'stay' : 'swap';
          thirdCall = isSecondLeft === isThirdLeft ? 'stay' : 'swap';
        } else {
          secondCall = isFirstLeft === isSecondLeft ? 'swap' : 'stay';
          thirdCall = isSecondLeft === isThirdLeft ? 'swap' : 'stay';
        }
        data.wingCalls = [secondCall, thirdCall];
        if (data.options.AutumnStyle) {
          if (data.phase === 'superchain2a') {
            if (third === undefined) {
              if (secondCall === 'stay')
                return output.secondWingCallStay();
              return output.secondWingCallSwap();
            }
            return output.aall({
              first: isFirstLeft ? output.aright() : output.aleft(),
              second: output[secondCall](),
              third: output[thirdCall](),
            });
          }
          if (third === undefined) {
            if (secondCall === 'stay')
              return output.secondWingCallStay();
            return output.secondWingCallSwap();
          }
          let afirst;
          if (data.prsNorth)
            afirst = isFirstLeft ? output.aleft() : output.aright();
          else
            afirst = isFirstLeft ? output.aright() : output.aleft();
          return output.aall({
            first: afirst,
            second: output[secondCall](),
            third: output[thirdCall](),
          });
        }
        // This is the second call only.
        if (third === undefined) {
          if (secondCall === 'stay')
            return output.secondWingCallStay();
          return output.secondWingCallSwap();
        }
        return output.allThreeWings({
          first: firstStr,
          second: output[secondCall](),
          third: output[thirdCall](),
        });
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        swap: {
          en: 'Swap',
          de: 'Wechseln',
          fr: 'Swap',
          ja: '横へ',
          cn: '穿',
          ko: '옆으로',
        },
        stay: {
          en: 'Stay',
          de: 'bleib Stehen',
          fr: 'Restez',
          ja: '止まる',
          cn: '停',
          ko: '그대로',
        },
        secondWingCallStay: {
          en: '(stay)',
          de: '(bleib Stehen)',
          fr: '(restez)',
          ja: '(止まる)',
          cn: '(停)',
          ko: '(그대로)',
        },
        secondWingCallSwap: {
          en: '(swap)',
          de: '(Wechseln)',
          fr: '(swap)',
          ja: '(横へ)',
          cn: '(穿)',
          ko: '(옆으로)',
        },
        allThreeWings: {
          en: '${first} => ${second} => ${third}',
          de: '${first} => ${second} => ${third}',
          fr: '${first} => ${second} => ${third}',
          cn: '${first} => ${second} => ${third}',
          ko: '${first} 🔜 ${second} 🔜 ${third}',
        },
        aleft: Outputs.arrowW,
        aright: Outputs.arrowE,
        aall: {
          en: '${first} ${second} ${third}',
          ko: '${first} ${second} ${third}',
        },
      },
    },
    {
      id: 'P12S Wing Followup',
      type: 'Ability',
      netRegex: {
        id: ['82E1', '82E2', '82E3', '82E4', '82E7', '82E8', '82E9', '82EA'],
        source: 'Athena',
        capture: false,
      },
      // These are exactly 3 apart, so give them some room to disappear and not stack up.
      durationSeconds: 2.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const call = data.wingCalls.shift();
        if (call === undefined)
          return;
        // Check if a normal wing call, not during Superchain IIA.
        const firstDir = data.superchain2aFirstDir;
        const secondDir = data.superchain2aSecondDir;
        const secondMech = data.superchain2aSecondMech;
        if (data.options.AutumnStyle) {
          if (data.phase !== 'superchain2a') {
            if (call === 'swap')
              return output.swap();
            return output.stay();
          }
          const isSecondWing = data.wingCalls.length === 1;
          if (isSecondWing) {
            const isReturnBack = firstDir === secondDir;
            const move = call !== 'swap' ? '' : output.a2swap();
            if (isReturnBack)
              return output.aSc2aMb({ move: move });
            return output.aSc2aMg({ move: move });
          }
          const isProtean = secondMech === 'protean';
          const move = call !== 'swap' ? '' : output.a2swap();
          if (firstDir === secondDir) {
            if (isProtean)
              return output.aSc2aBpro({ move: move });
            return output.aSc2aBtwo({ move: move });
          }
          if (isProtean)
            return output.aSc2aGpro({ move: move });
          return output.aSc2aGtwo({ move: move });
        }
        if (
          data.phase !== 'superchain2a' || firstDir === undefined || secondDir === undefined ||
          secondMech === undefined
        ) {
          if (call === 'swap')
            return output.swap();
          return output.stay();
        }
        // Second wing call (when middle) during Superchain IIA.
        const isSecondWing = data.wingCalls.length === 1;
        const finalDir = secondDir === 'north' ? output.north() : output.south();
        if (isSecondWing) {
          const isReturnBack = firstDir === secondDir;
          if (call === 'swap') {
            if (isReturnBack)
              return output.superchain2aSwapMidBack({ dir: finalDir });
            return output.superchain2aSwapMidGo({ dir: finalDir });
          }
          if (isReturnBack)
            return output.superchain2aStayMidBack({ dir: finalDir });
          return output.superchain2aStayMidGo({ dir: finalDir });
        }
        // Third wing call (when at final destination).
        const isProtean = secondMech === 'protean';
        if (call === 'swap') {
          if (isProtean)
            return output.superchain2aSwapProtean({ dir: finalDir });
          return output.superchain2aSwapPartners({ dir: finalDir });
        }
        if (isProtean)
          return output.superchain2aStayProtean({ dir: finalDir });
        return output.superchain2aStayPartners({ dir: finalDir });
      },
      outputStrings: {
        swap: {
          en: 'Swap',
          de: 'Wechseln',
          fr: 'Swap',
          ja: '横へ',
          cn: '穿',
          ko: '옆으로',
        },
        stay: {
          en: 'Stay',
          de: 'bleib Stehen',
          fr: 'Restez',
          ja: '止まる',
          cn: '停',
          ko: '그대로',
        },
        superchain2aSwapMidBack: {
          en: 'Swap + Mid => Back ${dir}',
          de: 'Wechseln + Mitte => Zurück nach ${dir}',
          fr: 'Swap + Milieu => Retour vers ${dir}',
          ja: '真ん中 => また${dir} (横へ)',
          cn: '穿 + 去中间 => 回到 ${dir}',
          ko: '한가운데 🔜 ${dir} 되돌아 가욧 [옆으로]',
        },
        superchain2aSwapMidGo: {
          en: 'Swap + Mid => Go ${dir}',
          de: 'Wechseln + Mitte => Geh nach ${dir}',
          fr: 'Swap + Milieu => Allez ${dir}',
          ja: '真ん中 => ${dir}前進 (横へ)',
          cn: '穿 + 去中间 => 去 ${dir}',
          ko: '한가운데 🔜 계속 전진 ${dir} [옆으로]',
        },
        superchain2aStayMidBack: {
          en: 'Stay + Mid => Back ${dir}',
          de: 'Bleib stehen + Mitte => Zurück nach ${dir}',
          fr: 'Restez + Milieu => Retour vers ${dir}',
          ja: '真ん中 => また${dir} (止まる)',
          cn: '停 + 去中间 => 回到 ${dir}',
          ko: '한가운데 🔜 ${dir} 되돌아 가욧',
        },
        superchain2aStayMidGo: {
          en: 'Stay + Mid => Go ${dir}',
          de: 'Bleib stehen + Mitte => Geh nach ${dir}',
          fr: 'Restez + Milieu => Aller vers ${dir}',
          ja: '真ん中 => ${dir}前進 (止まる)',
          cn: '停 + 去中间 => 去 ${dir}',
          ko: '한가운데 🔜 계속 전진 ${dir}',
        },
        superchain2aSwapProtean: {
          en: 'Swap => Protean + ${dir}',
          de: 'Wechseln => Himmelsrichtungen + ${dir}',
          fr: 'Swap => Position + ${dir}',
          ja: '基本散会 + ${dir} (横へ)',
          cn: '穿 => 八方分散 + ${dir}',
          ko: '${dir} + 프로틴 [옆으로]',
        },
        superchain2aStayProtean: {
          en: 'Stay => Protean + ${dir}',
          de: 'Bleib stehen => Himmelsrichtungen + ${dir}',
          fr: 'Restez => Position + ${dir}',
          ja: '基本散会 + ${dir} (止まる)',
          cn: '停 => 八方分散 + ${dir}',
          ko: '${dir} + 프로틴',
        },
        superchain2aSwapPartners: {
          en: 'Swap => Partners + ${dir}',
          de: 'Wechseln => Partner + ${dir}',
          fr: 'Swap => Partenaires + ${dir}',
          ja: 'ペア + ${dir} (横へ)',
          cn: '穿 => 双人分摊 + ${dir}',
          ko: '${dir} + 페어 [옆으로]',
        },
        superchain2aStayPartners: {
          en: 'Stay => Partners + ${dir}',
          de: 'Bleib stehen => Partner + ${dir}',
          fr: 'Restez => Partenaires + ${dir}',
          ja: 'ペア + ${dir} (止まる)',
          cn: '停 => 双人分摊 + ${dir}',
          ko: '${dir} + 페어',
        },
        north: Outputs.north,
        south: Outputs.south,
        //
        aleft: Outputs.arrowW,
        aright: Outputs.arrowE,
        a2swap: {
          en: '(Swap)',
          ko: '(옆으로)',
        },
        aSc2aMb: {
          en: 'Mid => Go back ${move}',
          ko: '한가운데로 🔜 되돌아 가욧 ${move}',
        },
        aSc2aMg: {
          en: 'Mid => Go strait ${move}',
          ko: '한가운데로 🔜 계속 전진 ${move}',
        },
        aSc2aBpro: {
          en: 'Go back + Protean ${move}',
          ko: '되돌아 와서 + 프로틴 ${move}',
        },
        aSc2aBtwo: {
          en: 'Go Back + Pair ${move}',
          ko: '되돌아 와서 + 페어 ${move}',
        },
        aSc2aGpro: {
          en: 'Go Strait + Protean ${move}',
          ko: '전진해서 + 프로틴 ${move}',
        },
        aSc2aGtwo: {
          en: 'Go Strait + Pair ${move}',
          ko: '전진해서 + 페어 ${move}',
        },
      },
    },
    {
      id: 'P12S Wing Followup Third Wing Superchain IIA',
      type: 'Ability',
      netRegex: { id: ['82E5', '82E6', '82EB', '82EC'], source: 'Athena', capture: false },
      condition: (data) => data.phase === 'superchain2a',
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const secondMech = data.superchain2aSecondMech;
        if (secondMech === undefined)
          return;
        // No direction needed here, because if you're not already here you're not going to make it.
        if (secondMech === 'protean')
          return output.protean();
        return output.partners();
      },
      outputStrings: {
        protean: {
          en: 'Protean',
          de: 'Himmelsrichtungen',
          fr: 'Positions',
          ja: '基本散会',
          cn: '八方分散',
          ko: '프로틴! 흩어져요',
        },
        partners: {
          en: 'Partners',
          de: 'Partner',
          fr: 'Partenaires',
          ja: 'ペア',
          cn: '双人分摊',
          ko: '페어! 둘이 함께',
        },
      },
    },
    {
      id: 'P12S 줄다리기 보라',
      type: 'Tether',
      netRegex: { id: ['00EA', '00FB'] },
      condition: (data, matches) => data.options.AutumnStyle && data.me === matches.target,
      durationSeconds: 7,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '🟪Tether',
          ko: '🟪줄 땡겨요',
        },
      },
    },
    {
      id: 'P12S 줄다리기 노랑',
      type: 'Tether',
      netRegex: { id: ['00E9', '00FA'] },
      condition: (data, matches) => data.options.AutumnStyle && data.me === matches.target,
      durationSeconds: 7,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '🟨Tether',
          ko: '🟨줄 땡겨요',
        },
      },
    },
    {
      id: 'P12S Engravement of Souls Tracker',
      type: 'Ability',
      netRegex: { id: '8305', source: 'Athena', capture: false },
      run: (data) => ++data.engravementCounter,
    },
    // In Engravement 1 (Paradeigma 2), 2 players receive lightTower and 2 players receive darkTower,
    // 2 players need to guide the light beam and 2 players need to guide the dark beam.
    // The operator of the beam extends the beam directly from the outside. The beam is attenuated until the jagged line disappears.
    // The people in the tower find the people who have the opposite attribute to the debuff and put them in four places.
    // At NE NW SE SW as a # shape. The position of outside Anthropos is fixed by two situation.
    // {[97, 75], [125, 97], [103, 125], [75, 103]} and {[103, 75], [125, 103], [97, 125], [75, 97]}. The Anthropos will cast
    // 'Searing Radiance' for light beam and 'Shadowsear' for dark beam. We use those as a trigger for Tower players place
    // the Tower.
    // When debuffs expire and towers drop, their debuff changes to lightTilt or darkTilt (same as tower color).
    // At the same time the towers drop, the 4 tethered players receive lightTilt or darkTilt depending on their tether color.
    //
    {
      id: 'P12S Engravement 1 Tether Tracker',
      type: 'Tether',
      netRegex: { id: Object.keys(anthroposTetherMap), source: 'Anthropos' },
      run: (data, matches) => {
        const tetherType = anthroposTetherMap[matches.id];
        if (tetherType === undefined)
          return;
        data.engravement1TetherPlayers[matches.sourceId] = tetherType;
        data.engravement1TetherIds.push(parseInt(matches.sourceId, 16));
      },
    },
    {
      id: 'P12S Engravement 1 Beam',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(tetherAbilityToTowerMap), source: 'Anthropos' },
      condition: (data) => !data.options.AutumnStyle && data.engravementCounter === 1,
      alertText: (data, matches, output) => {
        if (data.me === matches.target) {
          if (matches.id === '82F1')
            return output.lightBeam();
          return output.darkBeam();
        }
      },
      outputStrings: {
        lightBeam: {
          en: 'light beam',
          de: 'Heller Laser',
          fr: 'Rayon de lumière',
          ja: 'ひかりビーム',
          cn: '引导光激光',
          ko: '빛 선',
        },
        darkBeam: {
          en: 'dark beam',
          de: 'Dunkler Laser',
          fr: 'Rayon sombre',
          ja: 'やみビーム',
          cn: '引导暗激光',
          ko: '어둠 선',
        },
      },
    },
    {
      id: 'P12S Engravement 1 Tower Drop',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTowerIds },
      condition: (data) => data.engravementCounter === 1,
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      promise: async (data) => {
        data.combatantData = [];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: data.engravement1TetherIds,
        })).combatants;
      },
      alertText: (data, matches, output) => {
        data.engravement1Towers.push(matches.target);
        if (data.me !== matches.target)
          return;
        // if Only notify tower color
        if (data.triggerSetConfig.engravement1DropTower === 'tower') {
          if (matches.effectId === engravementIdMap.lightTower)
            return output.lightTower();
          return output.darkTower();
        }
        const locations = ['NE', 'SW', 'SE', 'NW'];
        const towerList = [];
        const towerStrategy = data.triggerSetConfig.engravement1DropTower;
        for (const combatant of data.combatantData) {
          const x = combatant.PosX;
          const y = combatant.PosY;
          const combatantId = combatant.ID;
          if (combatantId === undefined)
            return;
          const tempColor = data.engravement1TetherPlayers[combatantId.toString(16).toUpperCase()];
          const color = tempColor === 'light' ? 'dark' : 'light';
          const isCorrectColor =
            color === 'light' && matches.effectId === engravementIdMap.lightTower ||
            color === 'dark' && matches.effectId === engravementIdMap.darkTower;
          if (!isCorrectColor)
            continue;
          if (towerStrategy === 'quadrant' || towerStrategy === 'tetherbase') {
            if (x < 80 && y < 100) { // WNW: x = 75 && y = 97
              towerList.push({ location: 'NE', clone: 'WNW' });
            } else if (x < 100 && y < 80) { // NNW: x = 97 && y = 75
              towerList.push({ location: 'SW', clone: 'NNW' });
            } else if (x > 100 && y < 80) { // NNE: x = 103 && y = 75
              towerList.push({ location: 'SE', clone: 'NNE' });
            } else if (x > 120 && y < 100) { // ENE: x = 125 && y = 97
              towerList.push({ location: 'NW', clone: 'ENE' });
            } else if (x > 120 && y > 100) { // ESE: x = 125 && y = 103
              towerList.push({ location: 'SW', clone: 'ESE' });
            } else if (x > 100 && y > 120) { // SSE: x = 103 && y = 125
              towerList.push({ location: 'NE', clone: 'SSE' });
            } else if (x < 100 && y > 120) { // SSW: x = 97 && y = 125
              towerList.push({ location: 'NW', clone: 'SSW' });
            } else if (x < 80 && y > 100) { // WSW: x = 75 && y = 103
              towerList.push({ location: 'SE', clone: 'WSW' });
            }
          } else if (data.triggerSetConfig.engravement1DropTower === 'clockwise') {
            // Tether stretches across and tower is clockwise; e.g. N add stretches S, and tower is SW.
            if (x < 80 && y < 100) { // WNW: x = 75 && y = 97
              towerList.push({ location: 'SE', clone: 'WNW' });
            } else if (x < 100 && y < 80) { // NNW: x = 97 && y = 75
              towerList.push({ location: 'SW', clone: 'NNW' });
            } else if (x > 100 && y < 80) { // NNE: x = 103 && y = 75
              towerList.push({ location: 'SW', clone: 'NNE' });
            } else if (x > 120 && y < 100) { // ENE: x = 125 && y = 97
              towerList.push({ location: 'NW', clone: 'ENE' });
            } else if (x > 120 && y > 100) { // ESE: x = 125 && y = 103
              towerList.push({ location: 'NW', clone: 'ESE' });
            } else if (x > 100 && y > 120) { // SSE: x = 103 && y = 125
              towerList.push({ location: 'NE', clone: 'SSE' });
            } else if (x < 100 && y > 120) { // SSW: x = 97 && y = 125
              towerList.push({ location: 'NE', clone: 'SSW' });
            } else if (x < 80 && y > 100) { // WSW: x = 75 && y = 103
              towerList.push({ location: 'SE', clone: 'WSW' });
            }
          }
        }
        // Now use strategy and towerList (which only contains the correct color for the player)
        // to call out two spots or sort down to one spot.
        const cactbotMap = {
          NW: output.northwest(),
          NE: output.northeast(),
          SE: output.southeast(),
          SW: output.southwest(),
        };
        const autumnMap = {
          NW: output.anw(),
          NE: output.ane(),
          SE: output.ase(),
          SW: output.asw(),
        };
        const outputMap = data.options.AutumnStyle ? autumnMap : cactbotMap;
        const [tower0, tower1] = towerList;
        if (tower0 === undefined || tower1 === undefined)
          return;
        const name = data.party.member(data.me);
        if (data.options.AutumnStyle && (data.job !== 'BLU' || Autumn.isRoleName(name.nick))) {
          const pos = [];
          const isdps = data.job === 'BLU' ? Autumn.isDpsName(name.nick) : data.role === 'dps';
          towerList.forEach((value) => {
            const location = value.location;
            if (matches.effectId === engravementIdMap.lightTower) {
              if (
                (location === 'NE' && isdps) ||
                (location === 'NW' && !isdps) ||
                location === 'SE'
              )
                pos.push(location);
            } else {
              if (
                (location === 'NE' && isdps) ||
                (location === 'NW' && !isdps) ||
                location === 'SE' || location === 'SW'
              )
                pos.push(location);
            }
          });
          const posoutput = pos.map((x) => outputMap[x]).join(' ');
          if (matches.effectId === engravementIdMap.lightTower)
            return output.lightTowerOneSide({ pos1: posoutput });
          return output.darkTowerOneSide({ pos1: posoutput });
        }
        if (towerStrategy === 'clockwise' || towerStrategy === 'quadrant') {
          if (matches.effectId === engravementIdMap.lightTower) {
            return output.lightTowerSide({
              pos1: outputMap[tower0.location],
              pos2: outputMap[tower1.location],
            });
          }
          return output.darkTowerSide({
            pos1: outputMap[tower0.location],
            pos2: outputMap[tower1.location],
          });
        } else if (towerStrategy === 'tetherbase') {
          let towerResult;
          // Do the sort by role
          if (data.role === 'dps') {
            if (tower0.clone === 'WSW' || tower0.clone === 'WNW') {
              towerResult = tower0.location;
            } else if (tower1.clone === 'WSW' || tower1.clone === 'WNW') {
              towerResult = tower1.location;
            } else if (tower0.clone === 'SSW' || tower0.clone === 'SSE') {
              towerResult = tower0.location;
            } else if (tower1.clone === 'SSW' || tower1.clone === 'SSE') {
              towerResult = tower1.location;
            } else if (tower0.clone === 'ENE' || tower0.clone === 'ESE') {
              towerResult = tower0.location;
            } else if (tower1.clone === 'ENE' || tower1.clone === 'ESE') {
              towerResult = tower1.location;
            }
          } else {
            if (tower0.clone === 'NNW' || tower0.clone === 'NNE') {
              towerResult = tower0.location;
            } else if (tower1.clone === 'NNW' || tower1.clone === 'NNE') {
              towerResult = tower1.location;
            } else if (tower0.clone === 'ENE' || tower0.clone === 'ESE') {
              towerResult = tower0.location;
            } else if (tower1.clone === 'ENE' || tower1.clone === 'ESE') {
              towerResult = tower1.location;
            } else if (tower0.clone === 'SSW' || tower0.clone === 'SSE') {
              towerResult = tower0.location;
            } else if (tower1.clone === 'SSW' || tower1.clone === 'SSE') {
              towerResult = tower1.location;
            }
          }
          if (towerResult === undefined)
            return;
          if (matches.effectId === engravementIdMap.lightTower) {
            return output.lightTowerOneSide({
              pos1: outputMap[towerResult],
            });
          }
          return output.darkTowerOneSide({
            pos1: outputMap[towerResult],
          });
        }
      },
      outputStrings: {
        lightTowerSide: {
          en: 'Drop light tower ${pos1}/${pos2}',
          de: 'Heller Turm ${pos1}/${pos2} ablegen',
          fr: 'Déposez la tour de lumière ${pos1}/${pos2}',
          ja: 'ひかり設置 ${pos1}/${pos2}',
          cn: '去 ${pos1}/${pos2} 放光塔',
          ko: '🟡설치 ${pos1} ${pos2}',
        },
        darkTowerSide: {
          en: 'Drop dark tower at ${pos1}/${pos2}',
          de: 'Dunkler Turm ${pos1}/${pos2} ablegen',
          fr: 'Déposez la tour sombre ${pos1}/${pos2}',
          ja: 'やみ設置 ${pos1}/${pos2}',
          cn: '去 ${pos1}/${pos2} 放暗塔',
          ko: '🟣설치 ${pos1} ${pos2}',
        },
        lightTowerOneSide: {
          en: 'Drop light tower ${pos1}',
          de: 'Heller Turm ${pos1} ablegen',
          fr: 'Déposez la tour de lumière ${pos1}',
          ja: 'ひかり設置 ${pos1}',
          cn: '去 ${pos1} 放光塔',
          ko: '🟡설치 ${pos1}',
        },
        darkTowerOneSide: {
          en: 'Drop dark tower at ${pos1}',
          de: 'Dunkler Turm ${pos1} ablegen',
          fr: 'Déposez la tour sombre ${pos1}',
          ja: 'やみ設置 ${pos1}',
          cn: '去 ${pos1} 放暗塔',
          ko: '🟣설치 ${pos1}',
        },
        lightTower: {
          en: 'Drop light tower',
          de: 'Heller Turm ablegen',
          fr: 'Déposez la tour de lumière',
          ja: 'ひかり設置',
          cn: '放光塔',
          ko: '🟡설치',
        },
        darkTower: {
          en: 'Drop dark tower',
          de: 'Dunkler Turm ablegen',
          fr: 'Déposez la tour sombre',
          ja: 'やみ設置',
          cn: '放暗塔',
          ko: '🟣설치',
        },
        northeast: Outputs.northeast,
        northwest: Outputs.northwest,
        southeast: Outputs.southeast,
        southwest: Outputs.southwest,
        ane: Outputs.arrowNE,
        anw: Outputs.arrowNW,
        ase: Outputs.arrowSE,
        asw: Outputs.arrowSW,
      },
    },
    {
      id: 'P12S Engravement 1 Tower Soak',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTiltIds },
      condition: (data, matches) => data.engravementCounter === 1 && data.me === matches.target,
      suppressSeconds: 5,
      alertText: (data, matches, output) => {
        if (!data.engravement1Towers.includes(data.me)) {
          // Did not drop a tower, so needs to soak one.
          if (matches.effectId === engravementIdMap.lightTilt)
            return output.lightTilt();
          return output.darkTilt();
        }
      },
      outputStrings: {
        lightTilt: {
          en: 'Soak dark tower',
          de: 'Dunklen Turm nehmen',
          fr: 'Prenez la tour sombre',
          ja: 'やみ塔踏み',
          cn: '踩暗塔',
          ko: '🟣밟아요',
        },
        darkTilt: {
          en: 'Soak light tower',
          de: 'Hellen Turm nehmen',
          fr: 'Prenez la tour de lumière',
          ja: 'ひかり塔踏み',
          cn: '踩光塔',
          ko: '🟡밟아요',
        },
      },
    },
    // In Engravement 2 (Superchain 1), all supports or DPS will receive lightTilt and darkTilt (2 each).
    // All 4 also receive Heavensflame Soul.
    // The other role group will receive lightTower, darkTower, lightBeam, and darkBeam.
    // To resolve the Beams during the 2nd orb, lightBeam needs to stack with darkTower and both darkTilts, and vice versa.
    // After the 3rd orb, lightTower and darkTower will drop their towers, and  darkBeam and lightBeam (respectively) will soak them.
    // The four Heavensflame players all simultaneously need to spread to drop their AoEs.
    // Debuffs do change based on mechanic resolution, which can complicate things:
    // - When a lightTilt player soaks a dark beam, their debuff will change to darkTilt, and vice versa.
    // - Once the beams detonate, the lightBeam debuff disappears and is replaced with lightTilt (same with dark).
    // So only use the initial debuff to resolve the mechanic, and use a long suppress to avoid incorrect later alerts.
    {
      id: 'P12S Engravement 2 Debuff',
      type: 'GainsEffect',
      netRegex: {
        effectId: [...engravementBeamIds, ...engravementTowerIds, ...engravementTiltIds],
      },
      condition: (data, matches) => data.engravementCounter === 2 && data.me === matches.target,
      suppressSeconds: 30,
      run: (data, matches) => data.engravement2MyLabel = engravementLabelMap[matches.effectId],
    },
    {
      id: 'P12S Engravement 2 Heavensflame Soul Early',
      type: 'GainsEffect',
      netRegex: { effectId: 'DFA' },
      condition: (data, matches) =>
        !data.options.AutumnStyle && data.engravementCounter === 2 && data.me === matches.target,
      delaySeconds: 6.5,
      infoText: (_data, _matches, output) => output.spreadLater(),
      outputStrings: {
        spreadLater: {
          en: '(spread later)',
          de: '(später verteilen)',
          fr: '(Écartez-vous plus tard)',
          cn: '（稍后分散）',
          ko: '(나중에 산개)',
        },
      },
    },
    // darkTower/lightTower are 20s, but lightBeam/darkBeam are shorter and swap to lightTilt/darkTilt before the mechanic resolves.
    // So use a fixed delay rather than one based on effect duration.
    // TODO: Add additional logic/different outputs if oopsies happen?  (E.g. soak player hit by tower drop -> debuff change, backup soak by spread player, etc.)
    // TODO: Combine this with the second part (in/out) of Superchain I Third Mechanic?
    {
      id: 'P12S Engravement 2 Tower Drop/Soak Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: [...engravementTowerIds, ...engravementBeamIds] },
      condition: (data, matches) => data.engravementCounter === 2 && data.me === matches.target,
      delaySeconds: 16,
      alertText: (_data, matches, output) => {
        const engraveLabel = engravementLabelMap[matches.effectId];
        if (engraveLabel === undefined)
          return;
        return output[engraveLabel]();
      },
      outputStrings: {
        lightBeam: {
          en: 'Soak Dark Tower',
          de: 'Dunklen Turm nehmen',
          fr: 'Prenez la tour sombre',
          ja: 'やみ塔踏み (右)',
          cn: '踩暗塔',
          ko: '🟣밟아요🡺▶',
        },
        darkBeam: {
          en: 'Soak Light Tower',
          de: 'Hellen Turm nehmen',
          fr: 'Prenez la tour de lumière',
          ja: 'ひかり塔踏み (左)',
          cn: '踩光塔',
          ko: '◀🡸🟡밟아요',
        },
        lightTower: {
          en: 'Drop Light Tower',
          de: 'Hellen Turm ablegen',
          fr: 'Déposez la tour de lumière',
          ja: 'ひかり塔設置 (左)',
          cn: '放光塔',
          ko: '◀🡸🟡설치',
        },
        darkTower: {
          en: 'Drop Dark Tower',
          de: 'Dunklen Turm ablegen',
          fr: 'Déposez la tour sombre',
          ja: 'やみ塔設置 (右)',
          cn: '放暗塔',
          ko: '🟣설치🡺▶',
        },
      },
    },
    {
      id: 'P12S Engravement 2 Heavensflame Soul',
      type: 'GainsEffect',
      netRegex: { effectId: 'DFA' },
      condition: (data, matches) => data.engravementCounter === 2 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      response: Responses.spread('alert'),
    },
    // In Engravement 3 (Paradeigma 3), 2 support players will both receive either lightTower or darkTower.
    // The other 2 support players receive a '+'/Cross (DFF) or 'x'/Saltire (E00) debuff.
    // Because of platform separation during the mechanic, the '+' and 'x' players must soak the far north/south towers,
    // while the lightTower or darkTower players must soak the middle towers (so they can then drop their towers for DPS to soak).
    // All DPS receive tethers (2 light, 2 dark), and they receive corresponding lightTilt/darkTilt when tethers resolve.
    // If the support players receive lightTower, the darkTilt DPS must soak those towers, or vice versa.
    // While the light & dark towers are being soaked, the '+' and 'x' supports and  other 2 DPS must bait the adds' line cleaves.
    {
      id: 'P12S Engravement 3 Theos Initial',
      type: 'GainsEffect',
      netRegex: { effectId: engravement3TheosSoulIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      alertText: (_data, matches, output) => {
        const engraveLabel = engravementLabelMap[matches.effectId];
        if (engraveLabel === undefined)
          return;
        return output[engraveLabel]();
      },
      outputStrings: {
        crossMarked: {
          en: '\'+\' AoE on You',
          de: '\'+\' AoE auf DIR',
          fr: 'AoE \'+\' sur VOUS',
          ja: '自分に\'+\'',
          cn: '十 点名',
          ko: '➕ 북쪽으로!',
        },
        xMarked: {
          en: '\'x\' AoE on You',
          de: '\'x\' AoE auf DIR',
          fr: 'AoE \'x\' sur VOUS',
          ja: '自分に\'x\'',
          cn: '\'x\' 点名',
          ko: '❌ 남쪽으로!',
        },
      },
    },
    {
      id: 'P12S Engravement 3 Theos Drop AoE',
      type: 'GainsEffect',
      netRegex: { effectId: engravement3TheosSoulIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      alertText: (_data, matches, output) => {
        const engraveLabel = engravementLabelMap[matches.effectId];
        if (engraveLabel === undefined)
          return;
        return output[engraveLabel]();
      },
      outputStrings: {
        crossMarked: {
          en: 'Drop \'+\' AoE',
          de: '\'+\' AoE ablegen',
          fr: 'Déposez l\'AoE \'+\'',
          ja: '隅へ\'+\'設置',
          cn: '放置 十 点名',
          ko: '➕ 구석에 설치',
        },
        xMarked: {
          en: 'Drop \'x\' AoE',
          de: '\'x\' AoE ablegen',
          fr: 'Déposez l\'AoE \'x\'',
          ja: '中央へ\'x\'設置',
          cn: '放置 \'x\' 点名',
          ko: '❌ 가운데 설치',
        },
      },
    },
    {
      id: 'P12S Engravement 3 Theos Bait Adds',
      type: 'GainsEffect',
      netRegex: { effectId: engravement3TheosSoulIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.baitCleave(),
      outputStrings: {
        baitCleave: {
          en: 'Bait line cleave',
          de: 'Linien AoEs ködern',
          fr: 'Attirez le cleave en ligne',
          ja: '外からのレーザー誘導',
          cn: '引导射线',
          ko: '레이저 유도',
        },
      },
    },
    {
      id: 'P12S Engravement 3 Towers Collect',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTowerIds },
      condition: (data) => data.engravementCounter === 3,
      run: (data, matches) => {
        data.engravement3TowerPlayers.push(matches.target);
        data.engravement3TowerType = matches.effectId === engravementIdMap.lightTower
          ? 'lightTower'
          : 'darkTower';
      },
    },
    {
      id: 'P12S Engravement 3 Paradeigma Adds Collect',
      type: 'StartsUsing',
      netRegex: { id: ['82F1', '82F2'], source: 'Anthropos' },
      condition: (data) => data.engravementCounter === 3,
      run: (data, matches) => {
        // 82F1 = Searing Radiance (used on light tethers)
        // 82F2 = Shadowsear (used on dark tethers)
        // If the Anthroposes (Anthropi?) casting 82F1 are east, e.g., the tethered players will be west when the mechanic resolves.
        // lightTower/darkTower is applied ~1.1s before these abilities.
        const tetherPlayerSide = parseFloat(matches.x) > 100 ? 'west' : 'east';
        if (tetherAbilityToTowerMap[matches.id] === data.engravement3TowerType)
          data.engravement3TethersSide = tetherPlayerSide;
      },
    },
    {
      id: 'P12S Engravement 3 Towers Initial',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTowerIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      delaySeconds: 0.3,
      alertText: (data, _matches, output) => {
        let towerColor = output.unknown();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light()
            : output.dark();
        if (data.options.AutumnStyle) {
          const find = data.engravement3TowerPlayers.find((name) => name !== data.me);
          const partner = data.party.jobAbbr(find) ?? output.unknown();
          return output.towerOnYou({ color: towerColor, partner: partner });
        }
        const partner = data.party.member(data.engravement3TowerPlayers.find((name) =>
          name !== data.me
        )) ??
          output.unknown();
        return output.towerOnYou({ color: towerColor, partner: partner });
      },
      outputStrings: {
        towerOnYou: {
          en: '${color} Tower on You (w/ ${partner})',
          de: '${color} Turm auf Dir (mit ${partner})',
          fr: 'Tour ${color} sur vous (avec ${partner})',
          ja: '自分に${color}塔 (${partner})',
          cn: '${color} 塔点名 (+ ${partner})',
          ko: '${color}타워 (${partner})',
        },
        light: {
          en: 'Light',
          de: 'Heller',
          fr: 'de lumière',
          ja: 'ひかり',
          cn: '光',
          ko: '🟡',
        },
        dark: {
          en: 'Dark',
          de: 'Dunkler',
          fr: 'sombre',
          ja: 'やみ',
          cn: '暗',
          ko: '🟣',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Engravement 3 Paradeigma Tethers Collect',
      type: 'Tether',
      // Because tethers can spawn unstretched or already satisfied, we need to catch all 4 states
      netRegex: { id: Object.keys(anthroposTetherMap), source: 'Anthropos' },
      condition: (data) => data.engravementCounter === 3,
      run: (data, matches) => {
        const tetherType = anthroposTetherMap[matches.id];
        if (tetherType === undefined)
          return;
        data.engravement3TetherPlayers[matches.target] = tetherType;
      },
    },
    {
      id: 'P12S Engravement 3 Paradeigma Early Tower Color',
      type: 'Tether',
      // Because tethers can spawn unstretched or already satisfied, we need to trigger on all 4 states
      netRegex: { id: Object.keys(anthroposTetherMap), source: 'Anthropos' },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        let towerColor = output.unknown();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light()
            : output.dark();
        return output.towersLater({ color: towerColor });
      },
      outputStrings: {
        towersLater: {
          en: '${color} towers (later)',
          de: '${color} Türme (später)',
          fr: 'Tours ${color} (plus tard)',
          ja: '塔: ${color}',
          cn: '稍后 ${color} 塔',
          ko: '${color}타워예요',
        },
        light: {
          en: 'Light',
          de: 'Helle',
          fr: 'de lumière',
          ja: 'ひかり',
          cn: '光',
          ko: '🟡',
        },
        dark: {
          en: 'Dark',
          de: 'Dunkle',
          fr: 'sombre',
          ja: 'やみ',
          cn: '暗',
          ko: '🟣',
        },
        unknown: Outputs.unknown,
      },
    },
    // If player starts with darkTower/lightTower, they will start east or west to soak the inside towers.
    // Use their relative position at the time 8312 (Shock) is used (the initial tower soak) to determine where they should drop their tower.
    {
      id: 'P12S Engravement 3 Towers Drop Location',
      type: 'Ability',
      netRegex: { id: '8312', source: 'Athena' },
      condition: (data, matches) =>
        data.engravementCounter === 3 && data.me === matches.target &&
        data.engravement3TowerPlayers.includes(data.me),
      durationSeconds: 6,
      alertText: (data, matches, output) => {
        let towerColor = output.unknown();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light()
            : output.dark();
        if (data.engravement3TethersSide === undefined)
          return output.dropTower({ color: towerColor, spot: output.unknown() });
        const mySide = parseFloat(matches.x) > 100 ? 'east' : 'west';
        const towerSpot = mySide === data.engravement3TethersSide
          ? output.corner()
          : output.platform();
        return output.dropTower({ color: towerColor, spot: towerSpot });
      },
      outputStrings: {
        dropTower: {
          en: 'Drop ${color} Tower (${spot})',
          de: '${color} Turm (${spot})',
          fr: 'Déposez la tour ${color} (${spot})',
          ja: '${spot}に${color}塔設置',
          cn: '在 ${spot} 放 ${color} 塔',
          ko: '${spot} ${color}설치',
        },
        light: {
          en: 'Light',
          de: 'Heller',
          fr: 'de lumière',
          ja: 'ひかり',
          cn: '光',
          ko: '🟡',
        },
        dark: {
          en: 'Dark',
          de: 'Dunkler',
          fr: 'sombre',
          ja: 'やみ',
          cn: '暗',
          ko: '🟣',
        },
        platform: {
          en: 'Platform',
          de: 'Platform',
          fr: 'Plateforme',
          ja: 'マス内部',
          cn: '平台内',
          ko: '판때기 한가운데 설치',
        },
        corner: {
          en: 'Inside Corner',
          de: 'In der Ecke',
          fr: 'Dans le coin',
          ja: '真ん中のコーナー',
          cn: '平台交叉处',
          ko: '건너편에 닿게 모서리 설치',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Engravement 3 Soak Tower/Bait Adds',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTiltIds },
      condition: (data, matches) => {
        if (!data.isDoorBoss)
          return false;
        if (data.engravementCounter === 3 && data.me === matches.target)
          return true;
        return false;
      },
      suppressSeconds: 15,
      alertText: (data, matches, output) => {
        // lightTower/darkTower support players receive lightTilt/darkTilt once dropping their tower
        // so exclude them from receiving this alert
        if (data.engravement3TowerPlayers.includes(data.me))
          return;
        const soakMap = {
          lightTower: 'darkTilt',
          darkTower: 'lightTilt',
        };
        const myEffect = engravementLabelMap[matches.effectId];
        if (myEffect === undefined || data.engravement3TowerType === undefined)
          return;
        const soakTiltType = soakMap[data.engravement3TowerType];
        const towerColor = data.engravement3TowerType === 'lightTower'
          ? output.light()
          : output.dark();
        if (myEffect === soakTiltType)
          return output.soakTower({ color: towerColor });
        return output.baitCleaves();
      },
      outputStrings: {
        soakTower: {
          en: 'Soak ${color} Tower',
          de: '${color} Turm nehmen',
          fr: 'Prenez la tour ${color}',
          ja: '${color}塔踏み',
          cn: '踩 ${color} 塔',
          ko: '${color}밟아요',
        },
        baitCleaves: {
          en: 'Bait line cleave',
          de: 'Linien AoE ködern',
          fr: 'Attirez le cleave en ligne',
          ja: 'レーザー誘導',
          cn: '引导射线',
          ko: '레이저 유도',
        },
        light: {
          en: 'Light',
          de: 'Hellen',
          fr: 'de lumière',
          ja: 'ひかり',
          cn: '光',
          ko: '🟡',
        },
        dark: {
          en: 'Dark',
          de: 'Dunklen',
          fr: 'sombre',
          ja: 'やみ',
          cn: '暗',
          ko: '🟣',
        },
      },
    },
    {
      id: 'P12S Glaukopis First Cleave',
      type: 'StartsUsing',
      netRegex: { id: '82FC', source: 'Athena' },
      response: (data, matches, output) => {
        // don't use Responses.tankCleave(); we want to tell the non-targeted tank to swap
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleaveOnYou: Outputs.tankCleaveOnYou,
          tankBusterCleaves: Outputs.tankBusterCleaves,
          cleaveSwap: Outputs.tankSwap,
          avoidTankCleaves: Outputs.avoidTankCleaves,
        };
        // Multiple players can be hit by the line cleave AoE,
        // but we only care about the intended target for the Followup trigger
        data.glaukopisFirstHit = matches.target;
        if (data.me === matches.target)
          return { alertText: output.cleaveOnYou() };
        if (data.role === 'tank')
          return { alertText: output.cleaveSwap() };
        if (data.role === 'healer' || data.job === 'BLU')
          return { alertText: output.tankBusterCleaves() };
        return { infoText: output.avoidTankCleaves() };
      },
    },
    // Since multiple players could be hit by the 2nd cleave (whoopsie!), we need to check
    // if *any* of the targets of the 2nd cleave were the original cast target (MT) of the 1st cleave.
    // If so, we'll assume the original target is using invuln, and no need to swap after the 2nd.
    {
      id: 'P12S Glaukopis Second Cleave Collect',
      type: 'Ability',
      netRegex: { id: '82FD', source: 'Athena' },
      run: (data, matches) => {
        if (matches.target === data.glaukopisFirstHit)
          data.glaukopisSecondHitSame = true;
      },
    },
    {
      id: 'P12S Glaukopis Second Cleave Swap',
      type: 'Ability',
      netRegex: { id: '82FD', source: 'Athena', capture: false },
      condition: (data) => data.role === 'tank' || data.job === 'BLU',
      delaySeconds: 0.1,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.me === data.glaukopisFirstHit && !data.glaukopisSecondHitSame)
          return output.tankSwap();
      },
      run: (data) => {
        delete data.glaukopisFirstHit;
        data.glaukopisSecondHitSame = false;
      },
      outputStrings: {
        tankSwap: Outputs.tankSwap,
      },
    },
    {
      id: 'P12S Peridialogos',
      type: 'StartsUsing',
      netRegex: { id: '82FF', source: 'Athena', capture: false },
      alertText: (data, _matches, output) => {
        data.prsApoPeri = (data.prsApoPeri ?? 0) + 1;
        if (data.role === 'tank') {
          if (data.prsApoPeri === 2 && (data.job === 'WAR' || data.job === 'DRK'))
            return output.tankSolo();
          return output.tanksInPartyOut();
        }
        return output.partyOutTanksIn();
      },
      outputStrings: {
        partyOutTanksIn: {
          en: 'Party Out (Tanks In)',
          de: 'Gruppe Raus (Tanks Rein)',
          fr: 'Équipe à l\'extérieur (Tanks à l\'intérieur)',
          ja: 'ボスから離れる (タンクが内側)',
          cn: '小队出 (T进)',
          ko: '바깥으로 (탱크 안쪽)',
        },
        tanksInPartyOut: {
          en: 'Tanks In (Party Out)',
          de: 'Tanks Rein (Gruppe Raus)',
          fr: 'Tanks à l\'intérieur (Équipe à l\'extérieur',
          ja: 'ボスに足元へ (パーティーは離れる)',
          cn: 'T进 (小队出)',
          ko: '안쪽으로 (파티 바깥쪽)',
        },
        tankSolo: {
          en: 'In + Invulnerable',
          ko: '❱❱안쪽❰❰ 혼자 무적!',
        },
      },
    },
    {
      id: 'P12S Apodialogos',
      type: 'StartsUsing',
      netRegex: { id: '82FE', source: 'Athena', capture: false },
      alertText: (data, _matches, output) => {
        data.prsApoPeri = (data.prsApoPeri ?? 0) + 1;
        if (data.role === 'tank') {
          if (data.prsApoPeri === 2 && (data.job === 'WAR' || data.job === 'DRK'))
            return output.tankSolo();
          return output.tanksOutPartyIn();
        }
        return output.partyInTanksOut();
      },
      outputStrings: {
        partyInTanksOut: {
          en: 'Party In (Tanks Out)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Équipe à l\'intérieur (Tanks à l\'extérieur)',
          ja: 'ボスの足元へ (タンクは離れる)',
          cn: '小队进 (T出)',
          ko: '안쪽으로 (탱크 바깥쪽)',
        },
        tanksOutPartyIn: {
          en: 'Tanks Out (Party In)',
          de: 'Tanks Raus (Gruppe Rein)',
          fr: 'Tanks à l\'extérieur (Équipe à l\'intérieur',
          ja: 'ボスからはなれる (パーティーが内側)',
          cn: 'T出 (小队进)',
          ko: '바깥으로 (파티 안쪽)',
        },
        tankSolo: {
          en: 'Out + Invulnerable',
          ko: '❰❰바깥❱❱ 혼자 무적!',
        },
      },
    },
    {
      id: 'P12S Limit Cut',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      durationSeconds: (data) => data.options.AutumnStyle ? 4 : 20,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (!limitCutIds.includes(id))
          return;
        const num = limitCutMap[id];
        if (num === undefined)
          return;
        data.limitCutNumber = num;
        return output.text({ num: num });
      },
      outputStrings: {
        text: {
          en: '${num}',
          de: '${num}',
          fr: '${num}',
          ja: '${num}番目',
          cn: '${num}',
          ko: '${num}번',
        },
      },
    },
    {
      id: 'P12S Limit Cut Combatant Tracker',
      type: 'Ability',
      netRegex: { id: '82F3', source: 'Athena', capture: false },
      promise: async (data) => {
        const actorData = await callOverlayHandler({
          call: 'getCombatants',
        });
        if (actorData === null) {
          console.error(`LC Combatant Tracker: null data`);
          return;
        }
        const combatants = actorData.combatants.filter((combatant) => {
          const distX = Math.abs(100 - combatant.PosX);
          const distY = Math.abs(100 - combatant.PosY);
          const distance = Math.hypot(distX, distY);
          // Only "Anthropos" (12378) combatants at roughly the correct distance (roughly 9.89y intercard/10y card away from middle)
          return combatant.BNpcNameID === 12378 && Math.abs(distance - 10) < 0.25;
        });
        if (combatants.length !== 8) {
          console.error(`LC Combatant Tracker: expected 8, got ${combatants.length}`);
          return;
        }
        data.lcCombatants = combatants;
      },
    },
    {
      id: 'P12S Limit Cut Line Bait Collector',
      type: 'CombatantMemory',
      netRegex: {
        id: '40[0-9A-F]{6}',
        pair: [{ key: 'ModelStatus', value: '16384' }],
        capture: true,
      },
      condition: (data, matches) => {
        // This happens repeatedly, so suppress future calls.
        if (data.lcWhiteFlameDelay !== undefined)
          return false;
        const combatant = data.lcCombatants.find((c) => c.ID === parseInt(matches.id, 16));
        if (combatant === undefined)
          return false;
        combatant.order = data.lcCombatantsOffset;
        ++data.lcCombatantsOffset;
        return data.lcCombatantsOffset === 8;
      },
      run: (data) => {
        // Find the intercardinal adds that jumped, and then sort by order.
        const orderedJumps = data.lcCombatants
          .filter((combatant) =>
            (Directions.xyTo8DirNum(combatant.PosX, combatant.PosY, 100, 100) % 2) === 1
          ).map((combatant) => combatant.order)
          .sort((left, right) => (left ?? 0) - (right ?? 0));
        if (orderedJumps.length !== 4) {
          console.error(
            `LC Line Bait Collector: Incorrect count of intercardinal adds`,
            data.lcCombatants,
          );
          return;
        }
        const [o1, o2, o3, o4] = orderedJumps;
        if (o1 === undefined || o2 === undefined || o3 === undefined || o4 === undefined)
          return;
        data.lcWhiteFlameDelay = [o1 + 1, o2 - o1, o3 - o2, o4 - o3];
      },
    },
    {
      id: 'P12S Palladion White Flame Initial',
      type: 'StartsUsing',
      // 82F5 = Palladion cast
      // 8 seconds from Palladion starts casting to first White Flame damage
      // This is also an 8 second cast.
      // ~3 seconds after that for every potential White Flame
      netRegex: { id: '82F5', source: 'Athena', capture: false },
      // Don't collide with number callout.
      delaySeconds: 2,
      durationSeconds: (data) => {
        const delay = data.lcWhiteFlameDelay?.[0] ?? 1;
        // 8 seconds from cast start - 2 second delay already
        return (8 - 2) + 3 * (delay - 1) - 0.5;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: 'Bait (${delay})',
            de: 'Laser Ködern (${delay})',
            fr: 'Bait (${delay})',
            ja: 'レーザー誘導 (${delay})',
            cn: '引导激光 (${delay})',
            ko: '레이저 유도! 안쪽으로! (${delay})',
          },
          firstWhiteFlame: {
            en: '(5 and 7 ${delay})',
            de: '(5 und 7 ködern ${delay})',
            fr: '(5 et 7 ${delay})',
            ja: '(5と7誘導 ${delay})',
            cn: '(5 和 7 引导 ${delay})',
            ko: '(5, 7 유도 ${delay})',
          },
          ...whiteFlameDelayOutputStrings,
        };
        const delayMap = {
          1: output.delay1(),
          2: output.delay2(),
          3: output.delay3(),
          4: output.delay4(),
          5: output.delay5(),
        };
        const delayStr = delayMap[data.lcWhiteFlameDelay?.[0] ?? 1];
        const infoText = output.firstWhiteFlame({ delay: delayStr });
        if (data.limitCutNumber === 5 || data.limitCutNumber === 7)
          return { alertText: output.baitLaser({ delay: delayStr }), infoText: infoText };
        return { infoText: infoText };
      },
    },
    {
      id: 'P12S Palladion White Flame Followup',
      type: 'Ability',
      netRegex: { id: '82EF', source: 'Anthropos', capture: false },
      condition: (data) => data.phase === 'palladion',
      preRun: (data) => data.whiteFlameCounter++,
      durationSeconds: (data) => {
        const delay = data.lcWhiteFlameDelay?.[data.whiteFlameCounter] ?? 1;
        return 3 * delay - 0.5;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: 'Bait (${delay})',
            de: 'Laser Ködern (${delay})',
            fr: 'Bait (${delay})',
            ja: 'レーザー誘導 (${delay})',
            cn: '引导激光 (${delay})',
            ko: '레이저 유도! 안쪽으로! (${delay})',
          },
          secondWhiteFlame: {
            en: '(6 and 8 ${delay})',
            de: '(6 und 8 ködern ${delay})',
            fr: '(6 et 8 ${delay})',
            ja: '(6と8誘導 ${delay})',
            cn: '(6 和 8 引导 ${delay})',
            ko: '(6, 8 유도 ${delay})',
          },
          thirdWhiteFlame: {
            en: '(1 and 3 ${delay})',
            de: '(1 und 3 ködern ${delay})',
            fr: '(1 et 3 ${delay})',
            ja: '(1と3誘導 ${delay})',
            cn: '(1 和 3 引导 ${delay})',
            ko: '(1, 3 유도 ${delay})',
          },
          fourthWhiteFlame: {
            en: '(2 and 4 ${delay})',
            de: '(2 und 6 ködern ${delay})',
            fr: '(2 et 4 ${delay})',
            ja: '(2と4誘導 ${delay})',
            cn: '(2 和 4 引导 ${delay})',
            ko: '(2, 4 유도 ${delay})',
          },
          ...whiteFlameDelayOutputStrings,
        };
        const delayMap = {
          1: output.delay1(),
          2: output.delay2(),
          3: output.delay3(),
          4: output.delay4(),
          5: output.delay5(),
        };
        const delayStr = delayMap[data.lcWhiteFlameDelay?.[data.whiteFlameCounter] ?? 1];
        const baitLaser = output.baitLaser({ delay: delayStr });
        if (data.whiteFlameCounter === 1) {
          const infoText = output.secondWhiteFlame({ delay: delayStr });
          if (data.limitCutNumber === 6 || data.limitCutNumber === 8)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
        if (data.whiteFlameCounter === 2) {
          const infoText = output.thirdWhiteFlame({ delay: delayStr });
          if (data.limitCutNumber === 1 || data.limitCutNumber === 3)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
        if (data.whiteFlameCounter === 3) {
          const infoText = output.fourthWhiteFlame({ delay: delayStr });
          if (data.limitCutNumber === 2 || data.limitCutNumber === 4)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
      },
    },
    {
      id: 'P12S Superchain Theory Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds },
      // Note: do not modify or clear this in any trigger but phase reset.
      run: (data, matches) => data.superchainCollect.push(matches),
    },
    {
      id: 'P12S Superchain Theory I First Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain1' && data.superchainCollect.length === 3,
      alertText: (data, _matches, output) => {
        const ids = data.superchainCollect.slice(0, 3).map((x) => x.npcBaseId).sort();
        const [destMatches] = data.superchainCollect.filter((x) =>
          x.npcBaseId === superchainNpcBaseIdMap.destination
        );
        // Based on id sorting (see: superchainNpcBaseIdMap), they will always be in this order.
        const [, inOut, proteanPartner] = ids;
        if (destMatches === undefined || inOut === undefined || proteanPartner === undefined)
          return;
        // TODO: technically this is just intercardinals and we don't need all outputs here.
        // Do we need another helper for this?
        const dirStr = Directions.addedCombatantPosTo8DirOutput(destMatches, centerX, centerY);
        const dir = output[dirStr]();
        data.superchain1FirstDest = destMatches;
        if (inOut === superchainNpcBaseIdMap.in) {
          if (proteanPartner === superchainNpcBaseIdMap.protean)
            return output.inAndProtean({ dir: dir });
          return output.inAndPartners({ dir: dir });
        }
        if (proteanPartner === superchainNpcBaseIdMap.protean)
          return output.outAndProtean({ dir: dir });
        return output.outAndPartners({ dir: dir });
      },
      outputStrings: {
        inAndProtean: {
          en: 'In + Protean (${dir})',
          de: 'Rein + Himmelsrichtungen (${dir})',
          fr: 'Intérieur + Position (${dir})',
          ja: '内側へ + 基本散会 (${dir})',
          cn: '靠近 + 八方分散 (${dir})',
          ko: '안으로 + 프로틴 [${dir}]',
        },
        inAndPartners: {
          en: 'In + Partners (${dir})',
          de: 'Rein + Partner (${dir})',
          fr: 'Intérieur + Partenaire (${dir})',
          ja: '内側へ + ペア (${dir})',
          cn: '靠近 + 双人分摊 (${dir})',
          ko: '안으로 + 페어 [${dir}]',
        },
        outAndProtean: {
          en: 'Out + Protean (${dir})',
          de: 'Raus + Himmelsrichtungen (${dir})',
          fr: 'Extérieur + Position (${dir})',
          ja: '外側へ + 基本散会 (${dir})',
          cn: '远离 + 八方分散 (${dir})',
          ko: '밖에서 + 프로틴 [${dir}]',
        },
        outAndPartners: {
          en: 'Out + Partners (${dir})',
          de: 'Raus + Partner (${dir})',
          fr: 'Extérieur + Partenaire (${dir})',
          ja: '外側へ + ペア (${dir})',
          cn: '远离 + 双人分摊 (${dir})',
          ko: '밖에서 + 페어 [${dir}]',
        },
        ...Directions.outputStrings8Dir,
      },
    },
    {
      id: 'P12S Superchain Theory I Second Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain1' && data.superchainCollect.length === 7,
      // TODO: should we base this off of the first coil/burst instead?
      // 7.2 seconds is the time until the second mechanic finishes, so call early.
      delaySeconds: 4.5,
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        // Sort ascending.
        const collect = data.superchainCollect.slice(3, 7).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );
        const firstMechDest = data.superchain1FirstDest;
        if (firstMechDest === undefined)
          return;
        const [dest1, dest2, donut, sphere] = collect;
        if (
          dest1 === undefined || dest2 === undefined || donut === undefined || sphere === undefined
        )
          return;
        // TODO: it'd sure be nice if we had more info about what is tethered to what
        // as part of AddedCombatant, but for now we can heuristic our way out of this.
        const expectedDistanceSqr = 561.3101;
        const dest1Donut = Math.abs(distSqr(dest1, donut) - expectedDistanceSqr);
        const dest2Donut = Math.abs(distSqr(dest2, donut) - expectedDistanceSqr);
        const dest1Sphere = Math.abs(distSqr(dest1, sphere) - expectedDistanceSqr);
        const dest2Sphere = Math.abs(distSqr(dest2, sphere) - expectedDistanceSqr);
        let donutDest;
        // Extra checks just in case??
        if (dest1Donut < dest1Sphere && dest2Donut > dest2Sphere)
          donutDest = dest1;
        else if (dest1Donut > dest1Sphere && dest2Donut < dest2Sphere)
          donutDest = dest2;
        if (donutDest === undefined)
          return;
        const prevDir = Directions.addedCombatantPosTo8Dir(firstMechDest, centerX, centerY);
        const thisDir = Directions.addedCombatantPosTo8Dir(donutDest, centerX, centerY);
        const engrave = output[data.engravement2MyLabel ?? 'unknown']();
        const rotation = (thisDir - prevDir + 8) % 8;
        if (rotation === 2)
          return output.leftClockwise({ engrave: engrave });
        if (rotation === 6)
          return output.rightCounterclockwise({ engrave: engrave });
      },
      outputStrings: {
        // This is left and right facing the boss.
        leftClockwise: {
          en: 'Left (CW) => ${engrave}',
          de: 'Links (im Uhrzeigersinn) => ${engrave}',
          fr: 'Gauche (horaire) => ${engrave}',
          ja: '時計回り => ${engrave}',
          cn: '左左左 (顺时针) => ${engrave}',
          ko: '❰❰왼쪽 + ${engrave}',
        },
        rightCounterclockwise: {
          en: 'Right (CCW) => ${engrave}',
          de: 'Rechts (gegen Uhrzeigersinn) => ${engrave}',
          fr: 'Droite (Anti-horaire) => ${engrave}',
          ja: '反時計回り => ${engrave}',
          cn: '右右右 (逆时针) => ${engrave}',
          ko: '오른쪽❱❱ + ${engrave}',
        },
        lightBeam: {
          en: 'Light Beam (Stack w/Dark)',
          de: 'Heller Laser (mit Dunkel sammeln)',
          fr: 'Rayon de lumière (Pack avec sombre)',
          ja: '右塔踏み',
          cn: '光激光（与暗分摊）',
          ko: '🟣밟아요🡺▶',
        },
        darkBeam: {
          en: 'Dark Beam (Stack w/Light)',
          de: 'Dunkler Laser (mit Hell sammeln)',
          fr: 'Rayon sombre (Pack avec la lumière)',
          ja: '左塔踏み',
          cn: '暗激光（与光分摊）',
          ko: '◀🡸🟡밟아요',
        },
        lightTower: {
          en: 'Light Tower',
          de: 'Heller Turm',
          fr: 'Tour de lumière',
          ja: '左塔設置',
          cn: '光塔点名',
          ko: '◀🡸🟡설치',
        },
        darkTower: {
          en: 'Dark Tower',
          de: 'Dunkler Turm',
          fr: 'Tour sombre',
          ja: '右塔設置',
          cn: '暗塔点名',
          ko: '🟣설치🡺▶',
        },
        lightTilt: {
          en: 'Light Group',
          de: 'Helle Gruppe',
          fr: 'Groupe Lumière',
          ja: '左散会',
          cn: '光分摊组',
          ko: '◀🡸흩어져요',
        },
        darkTilt: {
          en: 'Dark Group',
          de: 'Dunkle Gruppe',
          fr: 'Groupe Sombre',
          ja: '右散会',
          cn: '暗分摊组',
          ko: '흩어져요🡺▶',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Superchain Theory I Third Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain1' && data.superchainCollect.length === 10,
      // TODO: should we base this off of the first coil/burst instead?
      // 10.6 seconds is the time until the second mechanic finishes, so call early.
      delaySeconds: 9.1,
      durationSeconds: 5.5,
      alertText: (data, _matches, output) => {
        // Sort ascending.
        const collect = data.superchainCollect.slice(7, 10).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );
        // Based on id sorting (see: superchainNpcBaseIdMap), they will always be in this order.
        const [dest, donut, sphere] = collect;
        if (dest === undefined || donut === undefined || sphere === undefined)
          return;
        const donutDistSqr = distSqr(donut, dest);
        const sphereDistSqr = distSqr(sphere, dest);
        const moveOrder = donutDistSqr > sphereDistSqr ? output.inThenOut() : output.outThenIn();
        const engrave = output[data.engravement2MyLabel ?? 'unknown']();
        return output.combined({ move: moveOrder, engrave: engrave });
      },
      outputStrings: {
        combined: {
          en: '${move} => ${engrave}',
          de: '${move} => ${engrave}',
          fr: '${move} => ${engrave}',
          ja: '${move} => ${engrave}',
          cn: '${move} => ${engrave}',
          ko: '${move} 🔜 ${engrave}',
        },
        inThenOut: Outputs.inThenOut,
        outThenIn: Outputs.outThenIn,
        lightBeam: {
          en: 'Soak Dark Tower',
          de: 'Dunklen Turm nehmen',
          fr: 'Prenez la tour sombre',
          ja: '右塔踏み',
          cn: '踩暗塔',
          ko: '🟣밟아요🡺▶',
        },
        darkBeam: {
          en: 'Soak Light Tower',
          de: 'Hellen Turm nehmen',
          fr: 'Prenez la tour de lumière',
          ja: '左塔踏み',
          cn: '踩光塔',
          ko: '◀🡸🟡밟아요',
        },
        lightTower: {
          en: 'Drop Light Tower',
          de: 'Hellen Turm ablegen',
          fr: 'Déposez la tour de lumière',
          ja: '左塔設置',
          cn: '放光塔',
          ko: '◀🡸🟡설치',
        },
        darkTower: {
          en: 'Drop Dark Tower',
          de: 'Dunklen Turm ablegen',
          fr: 'Déposez la tour sombre',
          ja: '右塔設置',
          cn: '放暗塔',
          ko: '🟣설치🡺▶',
        },
        lightTilt: Outputs.spread,
        darkTilt: Outputs.spread,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Superchain Theory IIa ',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain2a' && data.superchainCollect.length === 10,
      run: (data) => {
        // Sort ascending.
        const collect = data.superchainCollect.sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );
        // Based on id sorting (see: superchainNpcBaseIdMap), they will always be in this order.
        const [
          dest1,
          dest2,
          dest3,
          /* out1 */,
          /* out2 */,
          /* out3 */,
          /* out4 */,
          /* in1 */,
          mech1,
          mech2,
        ] = collect;
        if (
          dest1 === undefined || dest2 === undefined || dest3 === undefined ||
          mech1 === undefined || mech2 === undefined
        )
          return;
        // These are all at x = 100, y = 100 +/- 10
        const [destNorth, /* destMid */, destSouth] = [dest1, dest2, dest3].sort((a, b) =>
          parseFloat(a.y) - parseFloat(b.y)
        );
        if (destNorth === undefined || destSouth === undefined)
          return;
        const mech1NorthDist = distSqr(mech1, destNorth);
        const mech2NorthDist = distSqr(mech2, destNorth);
        const mech1SouthDist = distSqr(mech1, destSouth);
        const mech2SouthDist = distSqr(mech2, destSouth);
        // Distance between mechanic and destination determines which goes off when.
        // ~81 distance for first mechanic, ~1190 for second mechanic
        // ~440, ~480 for comparing with wrong destination.
        const firstDistance = 100;
        const secondDistance = 1000;
        let secondMech;
        let firstDir;
        let secondDir;
        if (mech1NorthDist < firstDistance || mech2NorthDist < firstDistance)
          firstDir = 'north';
        else if (mech1SouthDist < firstDistance || mech2SouthDist < firstDistance)
          firstDir = 'south';
        if (mech1NorthDist > secondDistance) {
          secondDir = 'north';
          secondMech = mech1;
        } else if (mech1SouthDist > secondDistance) {
          secondDir = 'south';
          secondMech = mech1;
        } else if (mech2NorthDist > secondDistance) {
          secondDir = 'north';
          secondMech = mech2;
        } else if (mech2SouthDist > secondDistance) {
          secondDir = 'south';
          secondMech = mech2;
        }
        if (secondMech === undefined || firstDir === undefined || secondDir === undefined) {
          const distances = [mech1NorthDist, mech1SouthDist, mech2NorthDist, mech2SouthDist];
          console.error(`Superchain2a: bad distances: ${JSON.stringify(distances)}`);
          return;
        }
        // To avoid trigger overload, we'll combine these calls with the wings calls.
        const isSecondMechProtean = secondMech.npcBaseId === superchainNpcBaseIdMap.protean;
        data.superchain2aFirstDir = firstDir;
        data.superchain2aSecondDir = secondDir;
        data.superchain2aSecondMech = isSecondMechProtean ? 'protean' : 'partners';
      },
    },
    {
      id: 'P12S Superchain Theory IIb First Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain2b' && data.superchainCollect.length === 4,
      alertText: (data, _matches, output) => {
        // Sort ascending. collect: [dest1, dest2, out/sphere, in/donut]
        const collect = data.superchainCollect.slice(0, 4).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );
        const donut = collect[3];
        if (donut === undefined)
          return;
        // For the first mechanic, two destination orbs span at [100,95] and [100,105]
        // Each has a short tether to either an 'in' or 'out' orb on the same N/S half of the area.
        // We therefore only need to know whether the 'in' orb is N or S to identify the safe spot.
        if (parseFloat(donut.y) > 100) {
          data.superchain2bFirstDir = 'south';
          return output.south();
        }
        data.superchain2bFirstDir = 'north';
        return output.north();
      },
      outputStrings: {
        north: Outputs.north,
        south: Outputs.south,
      },
    },
    {
      id: 'P12S Superchain Theory IIb Second Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain2b' && data.superchainCollect.length === 8,
      delaySeconds: 4.5,
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        // Sort ascending. collect: [dest1, dest2, out, partnerProtean]
        const collect = data.superchainCollect.slice(4, 8).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );
        const partnerProtean = collect[3];
        if (partnerProtean === undefined)
          return;
        let mechanicStr;
        if (partnerProtean.npcBaseId === superchainNpcBaseIdMap.protean) {
          mechanicStr = output.protean();
          data.superchain2bSecondMech = 'protean';
        } else {
          mechanicStr = output.partners();
          data.superchain2bSecondMech = 'partners';
        }
        // For the second mechanic, the two destination orbs spawn at [92,100] and [108,100]
        // One is tethered to a sphere (out) orb, and the other to a partner or protean orb.
        // The partner/protean orb is always on the same E/W half as the destination orb it is tethered to.
        // We therefore only need to know whether the partnerProteam orb is E or W to identify the safe spot.
        const x = parseFloat(partnerProtean.x);
        data.superchain2bSecondDir = x > 100 ? 'east' : 'west';
        let dirStr;
        if (x > 100) {
          data.superchain2bSecondDir = 'east';
          dirStr = data.superchain2bFirstDir === 'south' ? 'eastFromSouth' : 'eastFromNorth';
        } else {
          data.superchain2bSecondDir = 'west';
          dirStr = data.superchain2bFirstDir === 'south' ? 'westFromSouth' : 'westFromNorth';
        }
        return output.combined({ dir: output[dirStr](), mechanic: mechanicStr });
      },
      outputStrings: {
        combined: {
          en: '${dir} (Side) => ${mechanic} After',
          de: '${dir} (Seiten) => ${mechanic} danach',
          fr: '${dir} (Côté) => ${mechanic} ensuite',
          cn: '去 ${dir}(侧) => 稍后 ${mechanic}',
          ko: '${mechanic} [${dir}]',
        },
        east: Outputs.east,
        west: Outputs.west,
        eastFromSouth: {
          en: 'Right/East',
          de: 'Rechts/Osten',
          fr: 'Droite/Est',
          cn: '右/东',
          ko: '🡺동쪽',
        },
        eastFromNorth: {
          en: 'Left/East',
          de: 'Links/Osten',
          fr: 'Gauche/Est',
          cn: '左/东',
          ko: '🡸동쪽',
        },
        westFromSouth: {
          en: 'Left/West',
          de: 'Links/Westen',
          fr: 'Gauche/Ouest',
          cn: '左/西',
          ko: '🡸서쪽',
        },
        westFromNorth: {
          en: 'Right/West',
          de: 'Rechts/Westen',
          fr: 'Droite/Ouest',
          cn: '右/西',
          ko: '🡺서쪽',
        },
        protean: {
          en: 'Protean',
          de: 'Himmelsrichtungen',
          fr: 'Positions',
          cn: '八方分散',
          ko: '프로틴',
        },
        partners: {
          en: 'Partners',
          de: 'Partner',
          fr: 'Partenaires',
          cn: '两人分摊',
          ko: '페어',
        },
      },
    },
    {
      id: 'P12S Superchain Theory IIb Second Mechanic + Ray of Light 2',
      type: 'StartsUsing',
      netRegex: { id: '82EE', source: 'Anthropos' },
      condition: (data) => data.paradeigmaCounter === 4,
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        if (data.superchain2bSecondMech === undefined)
          return output.avoid();
        const mechanicStr = output[data.superchain2bSecondMech]();
        const x = Math.round(parseFloat(matches.x));
        if (data.superchain2bSecondDir === undefined || x === undefined)
          return output.combined({ mechanic: mechanicStr, dir: output.avoid() });
        let safeLane = output.avoid(); // default if unable to determine safe lane
        // In Ray 2 (SC IIB), the adds spawn with PosX of [87, 103] or [97, 113].
        // Because of mech timing, there is only realistically time to move either inside or outside
        // (relative to the orb) to avoid the cleave.
        if (x < 92)
          safeLane = data.superchain2bSecondDir === 'east' ? output.outside() : output.inside();
        else if (x > 108)
          safeLane = data.superchain2bSecondDir === 'east' ? output.inside() : output.outside();
        else if (x > 100)
          safeLane = data.superchain2bSecondDir === 'east' ? output.outside() : output.inside();
        else
          safeLane = data.superchain2bSecondDir === 'east' ? output.inside() : output.outside();
        return output.combined({ mechanic: mechanicStr, dir: safeLane });
      },
      outputStrings: {
        combined: {
          en: '${mechanic} => ${dir}',
          de: '${mechanic} => ${dir}',
          fr: '${mechanic} => ${dir}',
          cn: '${mechanic} => ${dir}',
          ko: '${mechanic} 🔜 ${dir}',
        },
        protean: {
          en: 'Protean',
          de: 'Himmelsrichtungen',
          fr: 'Position',
          cn: '八方分散',
          ko: '프로틴',
        },
        partners: {
          en: 'Partners',
          de: 'Partner',
          fr: 'Partenaires',
          cn: '两人分摊',
          ko: '페어',
        },
        inside: {
          en: 'Inside (avoid clones)',
          de: 'Innen (Klonen ausweichen)',
          fr: 'Intérieur (évitez les clones)',
          cn: '内侧 (躲避小怪激光)',
          ko: '안으로',
        },
        outside: {
          en: 'Outside (avoid clones)',
          de: 'Außen (Klonen ausweichen)',
          fr: 'Extérieur (évitez les clones)',
          cn: '外侧 (躲避小怪激光)',
          ko: '바깥으로',
        },
        avoid: {
          en: 'Avoid Line Cleaves',
          de: 'Vermeide Linien AoEs',
          fr: 'Évitez les cleaves en ligne',
          ja: '直線回避',
          cn: '躲避小怪激光',
          ko: '직선 장판 피해요',
        },
      },
    },
    {
      id: 'P12S Superchain Theory IIb Third Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain2b' && data.superchainCollect.length === 13,
      delaySeconds: 13.6,
      durationSeconds: 6,
      alertText: (data, _matches, output) => {
        // Sort ascending. collect: [dest1, dest2, out, out, partnerProtean]
        const collect = data.superchainCollect.slice(8, 13).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );
        const partnerProtean = collect[4];
        if (partnerProtean === undefined)
          return;
        // For the third mechanic, the three destination orbs spawn at [100,90] and [100,110]
        // Both are tethered to a sphere (out) orb, and one is tethered to a partner/protean orb.
        // The partner/protean orb is always on opposite N/S half as the destination orb it is tethered to.
        // We therefore only need to know whether the partnerProteam orb is N or S to identify the safe spot.
        const mechanicStr = partnerProtean.npcBaseId === superchainNpcBaseIdMap.protean
          ? output.protean()
          : output.partners();
        const dirStr = parseFloat(partnerProtean.y) > 100 ? output.north() : output.south();
        return output.combined({ dir: dirStr, mechanic: mechanicStr });
      },
      outputStrings: {
        combined: {
          en: '${dir} => Out + ${mechanic}',
          de: '${dir} => Raus + ${mechanic}',
          fr: '${dir} => Extérieur + ${mechanic}',
          cn: '${dir} => 远离 + ${mechanic}',
          ko: '${dir} 바깥에서 + ${mechanic}',
        },
        north: Outputs.north,
        south: Outputs.south,
        protean: {
          en: 'Protean',
          de: 'Himmelsrichtungen',
          fr: 'Positions',
          cn: '八方分散',
          ko: '프로틴',
        },
        partners: {
          en: 'Partners',
          de: 'Partner',
          fr: 'Partenaires',
          cn: '两人分摊',
          ko: '페어',
        },
      },
    },
    {
      id: 'P12S Sample Collect',
      type: 'Tether',
      netRegex: { id: '00E8', target: 'Athena' },
      condition: (data) => data.phase === 'superchain2b',
      run: (data, matches) => data.sampleTiles.push(matches),
    },
    {
      id: 'P12S Sample Safe Tile',
      type: 'Tether',
      netRegex: { id: '00E8', target: 'Athena', capture: false },
      condition: (data) => data.phase === 'superchain2b' && data.sampleTiles.length === 7,
      delaySeconds: 1,
      promise: async (data) => {
        data.combatantData = [];
        const ids = data.sampleTiles.map((tile) => parseInt(tile.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
      },
      infoText: (data, _matches, output) => {
        if (data.combatantData.length !== 7)
          return output.default();
        // platform 'combatants' can be at x:[90,110], y:[85,95,105,115]
        let safeTiles = [
          'outsideNW',
          'outsideNE',
          'insideNW',
          'insideNE',
          'insideSW',
          'insideSE',
          'outsideSW',
          'outsideSE',
        ];
        data.combatantData.forEach((tile) => {
          if (tile.PosX !== undefined && tile.PosY !== undefined) {
            let unsafeTile;
            if (tile.PosX < centerX) { // west
              if (tile.PosY < 90)
                unsafeTile = 'outsideNW';
              else if (tile.PosY > 110)
                unsafeTile = 'outsideSW';
              else
                unsafeTile = tile.PosY < centerY ? 'insideNW' : 'insideSW';
            } else { // east
              if (tile.PosY < 90)
                unsafeTile = 'outsideNE';
              else if (tile.PosY > 110)
                unsafeTile = 'outsideSE';
              else
                unsafeTile = tile.PosY < centerY ? 'insideNE' : 'insideSE';
            }
            safeTiles = safeTiles.filter((tile) => tile !== unsafeTile);
          }
        });
        if (safeTiles.length !== 1)
          return output.default();
        const safeTile = safeTiles[0];
        if (safeTile === undefined)
          return output.default();
        return output[safeTile]();
      },
      outputStrings: {
        outsideNW: {
          en: 'Outside NW',
          de: 'Außerhalb NW',
          fr: 'Extérieur NO',
          cn: '外侧 左上 (西北)',
          ko: '북서 바깥',
        },
        outsideNE: {
          en: 'Outside NE',
          de: 'Außerhalb NO',
          fr: 'Extérieur NE',
          cn: '外侧 右上(东北)',
          ko: '북동 바깥',
        },
        insideNW: {
          en: 'Inside NW',
          de: 'Innen NW',
          fr: 'Intérieur NO',
          cn: '内侧 左上(西北)',
          ko: '북서 안',
        },
        insideNE: {
          en: 'Inside NE',
          de: 'Innen NO',
          fr: 'Intérieur NE',
          cn: '内侧 右上(东北)',
          ko: '북동 안',
        },
        insideSW: {
          en: 'Inside SW',
          de: 'Innen SW',
          fr: 'Intérieur SO',
          cn: '内侧 左下(西南)',
          ko: '남서 안',
        },
        insideSE: {
          en: 'Inside SE',
          de: 'Innen SO',
          fr: 'Intérieur SE',
          cn: '内侧 右下(东南)',
          ko: '남동 안',
        },
        outsideSW: {
          en: 'Outside SW',
          de: 'Außerhalb SW',
          fr: 'Extérieur SO',
          cn: '外侧 左下(西南)',
          ko: '남서 바깥',
        },
        outsideSE: {
          en: 'Outside SE',
          de: 'Außerhalb SO',
          fr: 'Extérieur SE',
          cn: '外侧 右下(东南)',
          ko: '남동 바깥',
        },
        default: {
          en: 'Find safe tile',
          de: 'Sichere Fläche finden',
          fr: 'Trouvez la position sûre',
          cn: '找安全地板',
          ko: '안전한 판때기 찾아요',
        },
      },
    },
    {
      id: 'P12S 테오의 알테마',
      type: 'StartsUsing',
      netRegex: { id: '82FA', capture: false },
      condition: (data) => data.options.AutumnStyle,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Big AoE!',
          ko: '엄청 아픈 전체 공격! 이러다 우리 다 주거!',
        },
      },
    },
    // --------------------- Phase 2 ------------------------
    {
      id: 'P12S Geocentrism Vertical',
      type: 'StartsUsing',
      netRegex: { id: '8329', source: 'Pallas Athena', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'gaiaochos1')
          return output.mesg({ style: output.text() });
        data.geocentrism2OutputStr = output.text();
        return;
      },
      outputStrings: {
        text: {
          en: 'Vertical',
          de: 'Vertikal',
          fr: 'Vertical',
          ja: '縦',
          cn: '垂直',
          ko: '‖',
        },
        mesg: {
          en: 'AoE + Spread (${style})',
          ko: '전체 공격 + 흩어져요(${style})',
        },
      },
    },
    {
      id: 'P12S Geocentrism Circle',
      type: 'StartsUsing',
      netRegex: { id: '832A', source: 'Pallas Athena', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'gaiaochos1')
          return output.mesg({ style: output.text() });
        data.geocentrism2OutputStr = output.text();
        return;
      },
      outputStrings: {
        text: {
          en: 'Inny Spinny',
          de: 'Innerer Kreis',
          fr: 'Cercle intérieur',
          ja: 'ドーナツ',
          cn: '月环',
          ko: '◎',
        },
        mesg: {
          en: 'AoE + Spread (${style})',
          ko: '전체 공격 + 흩어져요(${style})',
        },
      },
    },
    {
      id: 'P12S Geocentrism Horizontal',
      type: 'StartsUsing',
      netRegex: { id: '832B', source: 'Pallas Athena', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'gaiaochos1')
          return output.mesg({ style: output.text() });
        data.geocentrism2OutputStr = output.text();
        return;
      },
      outputStrings: {
        text: {
          en: 'Horizontal',
          de: 'Horizontal',
          fr: 'Horizontal',
          ja: '横',
          cn: '水平',
          ko: '〓',
        },
        mesg: {
          en: 'AoE + Spread (${style})',
          ko: '전체 공격 + 흩어져요(${style})',
        },
      },
    },
    {
      id: 'P12S Classical Concepts Headmarker',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (!conceptPairIds.includes(id))
          return;
        const pair = conceptPairMap[id];
        if (pair === undefined)
          return;
        data.conceptPair = pair;
      },
    },
    {
      id: 'P12S Classical Concepts Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: conceptDebuffEffectIds },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.conceptDebuff = conceptDebuffIds[matches.effectId],
    },
    {
      id: 'P12S Classical Concepts Shape Collect',
      type: 'AddedCombatant',
      netRegex: { npcBaseId: conceptNpcBaseIds },
      run: (data, matches) => {
        const location = getConceptLocation(matches);
        const color = npcBaseIdToConceptColor[parseInt(matches.npcBaseId)];
        if (location !== undefined && color !== undefined)
          data.conceptData[location] = color;
      },
    },
    {
      id: 'P12S Classical Concepts',
      type: 'StartsUsing',
      // 8331 = The Classical Concepts (6.7s cast)
      // 8336 = Panta Rhei (9.7s cast during classical2 that inverts shapes)
      netRegex: { id: ['8331', '8336'], source: 'Pallas Athena' },
      delaySeconds: (_data, matches) => {
        if (matches.id === '8331')
          // for Classical Concepts, 6.7 cast time + 1.8 for shape/debuff/headmarker data (some variability)
          return 8.5;
        return 0; // for Panta Rhei, fire immediately once cast starts
      },
      durationSeconds: (data, matches) => {
        if (data.options.AutumnStyle) {
          if (data.phase === 'classical1')
            return 11;
          if (matches.id === '8331')
            return 16;
        }
        if (data.phase === 'classical1')
          return 12; // keep active until shapes tether
        if (matches.id === '8331')
          return 7; // for classical2 initial, display initially to allow player to find (stand in) initial position
        return 9.7; // for Panta Rhei, display until shape inversion completes
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          classic1: {
            en: '${column}, ${row} => ${intercept}',
            de: '${column}, ${row} => ${intercept}',
            fr: '${column}, ${row} => ${intercept}',
            cn: '${column}, ${row} => ${intercept}',
            ko: '${column} ${row} ${intercept}',
          },
          classic2initial: {
            en: 'Initial: ${column}, ${row} => ${intercept}',
            de: 'Initial: ${column}, ${row} => ${intercept}',
            fr: 'Initial : ${column}, ${row} => ${intercept}',
            cn: '先去 ${column}, ${row} => ${intercept}',
            ko: '시작: ${column} ${row} ${intercept}',
          },
          classic2actual: {
            en: 'Actual: ${column}, ${row} => ${intercept}',
            de: 'Tatsächlich: ${column}, ${row} => ${intercept}',
            fr: 'Actuel : ${column}, ${row} => ${intercept}',
            cn: '去 ${column}, ${row} => ${intercept}',
            ko: '반전: ${column} ${row} ${intercept}',
          },
          shapeAndDebuff: {
            en: '${shape}, ${debuff}',
            de: '${shape}, ${debuff}',
            fr: '${shape}, ${debuff}',
            ja: '${shape}, ${debuff}',
            cn: '${shape}, ${debuff}',
            ko: '${shape}, ${debuff}',
          },
          outsideWest: {
            en: 'Outside West',
            de: 'Außerhalb Westen',
            fr: 'Extérieur Ouest',
            cn: '第1列 (左西 外侧)',
            ko: '1열',
          },
          insideWest: {
            en: 'Inside West',
            de: 'Innen Westen',
            fr: 'Intérieur Ouest',
            cn: '第2列 (左西 内侧)',
            ko: '2열',
          },
          insideEast: {
            en: 'Inside East',
            de: 'Innen Osten',
            fr: 'Intérieur Est',
            cn: '第3列 (右东 内侧)',
            ko: '3列',
          },
          outsideEast: {
            en: 'Outside East',
            de: 'Außerhalb Osten',
            fr: 'Extérieur Est',
            cn: '第4列 (右东 外侧)',
            ko: '4열',
          },
          northRow: {
            en: 'North Blue',
            de: 'Norden Blau',
            fr: 'Nord Bleu',
            cn: '第1个蓝方块',
            ko: '윗쪽',
          },
          middleRow: {
            en: 'Middle Blue',
            de: 'Mitte Blau',
            fr: 'Milieu Bleu',
            cn: '第2个蓝方块',
            ko: '가운데',
          },
          southRow: {
            en: 'South Blue',
            de: 'Süden Blau',
            fr: 'Sud Bleu',
            cn: '第3个蓝方块',
            ko: '아래쪽',
          },
          leanNorth: {
            en: 'Lean North',
            de: 'Nördlich halten',
            fr: 'Légèrement au Nord',
            cn: '靠上(北)',
            ko: '🡹',
          },
          leanEast: {
            en: 'Lean East',
            de: 'Östlich halten',
            fr: 'Légèrement à l\'Est',
            cn: '靠右(东)',
            ko: '🡺',
          },
          leanSouth: {
            en: 'Lean South',
            de: 'Südlich halten',
            fr: 'Légèrement au Sud',
            cn: '靠下(南)',
            ko: '🡻',
          },
          leanWest: {
            en: 'Lean West',
            de: 'Westlich halten',
            fr: 'Légèrement à l\'Ouest',
            cn: '靠左(西)',
            ko: '🡸',
          },
          circle: {
            en: 'Red Circle',
            de: 'Roter Kreis',
            fr: 'Cercle rouge',
            ja: '赤まる',
            cn: '红圆圈',
            ko: '⚪',
          },
          triangle: {
            en: 'Green Triangle',
            de: 'Grünes Dreieck',
            fr: 'Triangle vert',
            ja: '緑さんかく',
            cn: '绿三角',
            ko: '⨻',
          },
          square: {
            en: 'Purple Square',
            de: 'Lila Viereck',
            fr: 'Carré violet',
            ja: '紫しかく',
            cn: '紫方块',
            ko: '⬜',
          },
          cross: {
            en: 'Blue X',
            de: 'Blaues X',
            fr: 'Croix bleue',
            ja: '青バツ',
            cn: '蓝 X',
            ko: '❌',
          },
          alpha: {
            en: 'Alpha',
            de: 'Alpha',
            fr: 'Alpha',
            ja: 'アルファ',
            cn: '阿尔法',
            ko: '🔴α', // 🔺🟥
          },
          beta: {
            en: 'Beta',
            de: 'Beta',
            fr: 'Beta',
            ja: 'ベータ',
            cn: '贝塔',
            ko: '🟨β',
          },
        };
        if (
          Object.keys(data.conceptData).length !== 12 ||
          data.conceptDebuff === undefined ||
          data.conceptPair === undefined
        )
          return;
        if (data.triggerSetConfig.classicalConceptsPairOrder === 'shapeAndDebuff') {
          if (matches.id === '8336') // prevent going off again on Panta Rhei
            return;
          const myShape = data.conceptPair;
          const myDebuff = data.conceptDebuff;
          const outputStr = output.shapeAndDebuff({
            shape: output[myShape](),
            debuff: output[myDebuff](),
          });
          return { alertText: outputStr };
        }
        let myColumn;
        let myRow;
        let myInterceptOutput;
        if (matches.id === '8331') {
          // for classic1 and classic2, find the (initial) position for the player to intercept
          const columnOrderFromConfig = {
            xsct: ['cross', 'square', 'circle', 'triangle'],
            cxts: ['circle', 'cross', 'triangle', 'square'],
            ctsx: ['circle', 'triangle', 'square', 'cross'],
            ctxs: ['circle', 'triangle', 'cross', 'square'],
            tcxs: ['triangle', 'circle', 'cross', 'square'],
          };
          const columnOrder =
            columnOrderFromConfig[data.triggerSetConfig.classicalConceptsPairOrder];
          if (columnOrder?.length !== 4)
            return;
          // If classicalConcepts2ActualNoFlip is enabled for classic2, the left/west assigned pair will handle
          // the left/west column, as opposed to flipping to pre-position in the right/east column before Panta Rhei.
          // To accommodate this, and because the shapes spawn in their flipped arrangement,
          // we just reverse the columnOrder from the config settings when determining initial safe spots.
          if (data.triggerSetConfig.classicalConcepts2ActualNoFlip && data.phase === 'classical2')
            columnOrder.reverse();
          myColumn = columnOrder.indexOf(data.conceptPair);
          const myColumnLocations = [
            conceptLocationMap.north[myColumn],
            conceptLocationMap.middle[myColumn],
            conceptLocationMap.south[myColumn],
          ];
          const [north, middle, south] = myColumnLocations;
          if (north === undefined || middle === undefined || south === undefined)
            return;
          let myColumnBlueLocation;
          if (data.conceptData[north] === 'blue')
            myColumnBlueLocation = north;
          else
            myColumnBlueLocation = data.conceptData[middle] === 'blue' ? middle : south;
          myRow = myColumnLocations.indexOf(myColumnBlueLocation);
          const conceptMap = getConceptMap(myColumnBlueLocation);
          const myShapeColor = conceptDebuffToColor[data.conceptDebuff];
          const possibleLocations = [];
          const possibleIntercepts = [];
          conceptMap.forEach((adjacentPair) => {
            const [location, intercept] = adjacentPair;
            if (location !== undefined && intercept !== undefined) {
              const adjacentColor = data.conceptData[location];
              if (adjacentColor === myShapeColor) {
                possibleLocations.push(location);
                possibleIntercepts.push(intercept);
              }
            }
          });
          let myIntercept; // don't set this initially in case there's something wrong with possibleLocations
          if (possibleLocations.length === 1) {
            // only one possible adjacent shape to intercept; we're done
            myIntercept = possibleIntercepts[0];
          } else if (possibleLocations.length === 2) {
            // two adjacent shapes that match player's debuff (does happen)
            // the one that is NOT adjacent to a different blue is the correct shape.
            // NOTE: There is a theoretical arrangement where both possibles are adjacent to another blue,
            // but this has never been observed in-game, and it generates two valid solution sets.
            // Since there is no single solution, we should not generate an output for it.
            const possible1 = possibleLocations[0];
            myIntercept = possibleIntercepts[0];
            if (possible1 === undefined)
              return;
            const possible1AdjacentsMap = getConceptMap(possible1);
            for (const [possibleAdjacentLocation] of possible1AdjacentsMap) {
              if (possibleAdjacentLocation === undefined)
                continue;
              const possibleAdjacentColor = data.conceptData[possibleAdjacentLocation];
              if (
                possibleAdjacentColor === 'blue' &&
                possibleAdjacentLocation !== myColumnBlueLocation
              ) {
                // there's an adjacent blue (not the one the player is responsible for), so possibleLocations[0] is eliminated
                myIntercept = possibleIntercepts[1];
                break;
              }
            }
          }
          if (myIntercept === undefined)
            return;
          const interceptDelta = myIntercept - myColumnBlueLocation;
          if (interceptDelta === -1)
            myInterceptOutput = 'leanNorth';
          else if (interceptDelta === 5)
            myInterceptOutput = 'leanEast';
          else if (interceptDelta === 1)
            myInterceptOutput = 'leanSouth';
          // else: interceptDelta === -5
          else
            myInterceptOutput = 'leanWest';
          if (data.phase === 'classical2') {
            data.classical2InitialColumn = myColumn;
            data.classical2InitialRow = myRow;
            data.classical2Intercept = myInterceptOutput;
          }
        }
        if (
          (matches.id === '8336') ||
          (matches.id === '8331' && data.triggerSetConfig.classicalConcepts2ActualNoFlip)
        ) {
          // invert myColumn, myRow, and myInterceptOutput to correspond to final/actual positions
          if (data.classical2InitialColumn !== undefined)
            myColumn = 3 - data.classical2InitialColumn;
          if (data.classical2InitialRow !== undefined)
            myRow = 2 - data.classical2InitialRow;
          if (data.classical2Intercept !== undefined) {
            const interceptOutputInvertMap = {
              leanNorth: 'leanSouth',
              leanSouth: 'leanNorth',
              leanEast: 'leanWest',
              leanWest: 'leanEast',
            };
            myInterceptOutput = interceptOutputInvertMap[data.classical2Intercept];
          }
        }
        if (myColumn === undefined || myRow === undefined || myInterceptOutput === undefined)
          return;
        const columnOutput = ['outsideWest', 'insideWest', 'insideEast', 'outsideEast'][myColumn];
        const rowOutput = ['northRow', 'middleRow', 'southRow'][myRow];
        if (columnOutput === undefined || rowOutput === undefined)
          return;
        let outputStr;
        if (data.phase === 'classical1') {
          outputStr = output.classic1({
            column: output[columnOutput](),
            row: output[rowOutput](),
            intercept: output[myInterceptOutput](),
          });
          return { alertText: outputStr };
        }
        // call the actual position on Panta Rhei or on classical2 cast (depending on classicalConcepts2ActualNoFlip)
        if (
          (matches.id === '8336' && !data.triggerSetConfig.classicalConcepts2ActualNoFlip) ||
          (matches.id === '8331' && data.triggerSetConfig.classicalConcepts2ActualNoFlip)
        ) {
          outputStr = output.classic2actual({
            column: output[columnOutput](),
            row: output[rowOutput](),
            intercept: output[myInterceptOutput](),
          });
          return { alertText: outputStr };
        }
        // the initial call is not suppressed by classicalConcepts2ActualNoFlip, so call it for classical2
        if (matches.id === '8331') {
          outputStr = output.classic2initial({
            column: output[columnOutput](),
            row: output[rowOutput](),
            intercept: output[myInterceptOutput](),
          });
          return { infoText: outputStr };
        }
        // only case left is Panta Rhei where initial call was suppressed by classicalConcepts2ActualNoFlip, so don't call anything
        return;
      },
      run: (data) => {
        if (data.phase === 'classical1') {
          data.conceptData = {};
        }
      },
    },
    {
      id: 'P12S Palladian Ray 1 Initial',
      type: 'LosesEffect',
      netRegex: { effectId: 'E04' },
      condition: (data, matches) => data.me === matches.target && data.phase === 'classical1',
      // shapes use 8333 (Implode) at t+5.6s, and 8324 (Palladian Ray cleaves) snapshots at t+8.9s
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return getPalladionRayEscape('classical1', data.conceptPair, data.conceptDebuff, output);
        if (data.conceptDebuff === undefined)
          return output.default();
        return data.conceptDebuff === 'alpha'
          ? output.baitAlphaDebuff()
          : output.baitBetaDebuff();
      },
      run: (data) => {
        delete data.conceptPair;
        delete data.conceptDebuff;
      },
      outputStrings: {
        baitAlphaDebuff: {
          en: 'Avoid Shapes => Bait Proteans (Alpha)',
          de: 'Vermeide Formen => Himmelsrichtungen ködern (Alpha)',
          fr: 'Évitez les formes => Positions (Alpha)',
          cn: '远离方块 => 引导射线 (α)',
          ko: '피하고 🔜 빔 유도 (알파)',
        },
        baitBetaDebuff: {
          en: 'Avoid Shapes => Bait Proteans (Beta)',
          de: 'Vermeide Formen => Himmelsrichtungen ködern (Beta)',
          fr: 'Évitez les formes => Positions (B2ta)',
          cn: '远离方块 => 引导射线 (β)',
          ko: '피하고 🔜 빔 유도 (베타)',
        },
        default: {
          en: 'Bait Proteans',
          de: 'Himmelsrichtungen ködern',
          fr: 'Positions',
          cn: '引导射线',
          ko: '빔 유도해요',
        },
        ...palladionRayOutputStrings,
      },
    },
    {
      id: 'P12S Palladian Ray 2 Initial',
      type: 'Tether',
      netRegex: { id: '0001', source: ['Concept of Fire', 'Concept of Earth'] },
      condition: (data, matches) => data.me === matches.target && data.phase === 'classical2',
      durationSeconds: 6,
      alertText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return getPalladionRayEscape('classical2', data.conceptPair, data.conceptDebuff, output);
        if (data.conceptDebuff === undefined)
          return output.default();
        return data.conceptDebuff === 'alpha'
          ? output.baitAlphaDebuff()
          : output.baitBetaDebuff();
      },
      outputStrings: {
        baitAlphaDebuff: {
          en: 'Bait Proteans (Alpha)',
          de: 'Himmelsrichtungen ködern (Alpha)',
          fr: 'Positions (Alpha)',
          cn: '引导射线 (α)',
          ko: '빔 유도 (알파)',
        },
        baitBetaDebuff: {
          en: 'Bait Proteans (Beta)',
          de: 'Himmelsrichtungen ködern (Beta)',
          fr: 'Positions (Beta)',
          cn: '引导射线 (β)',
          ko: '빔 유도 (베타)',
        },
        default: {
          en: 'Bait Proteans',
          de: 'Himmelsrichtungen ködern',
          fr: 'Positions',
          cn: '引导射线',
          ko: '빔 유도해요',
        },
        ...palladionRayOutputStrings,
      },
    },
    {
      id: 'P12S Palladian Ray Followup',
      type: 'Ability',
      netRegex: { id: '8323', source: 'Pallas Athena', capture: false },
      delaySeconds: 2.5,
      alertText: (data, _matches, output) => {
        if (data.phase === 'classical2')
          return output.moveAvoid();
        return output.move();
      },
      outputStrings: {
        moveAvoid: {
          en: 'Move! (avoid shapes)',
          de: 'Bewegen! (Formen vermeiden)',
          fr: 'Bougez ! (évitez les formes)',
          cn: '快躲开! (远离方块)',
          ko: '피해욧! (사이사이로)',
        },
        move: Outputs.moveAway,
      },
    },
    {
      id: 'P12S Pangenesis Collect',
      type: 'GainsEffect',
      netRegex: { effectId: pangenesisEffectIds },
      condition: (data) => !data.pangenesisDebuffsCalled && data.phase === 'pangenesis',
      run: (data, matches) => {
        const id = matches.effectId;
        if (id === pangenesisEffects.darkTilt) {
          const duration = parseFloat(matches.duration);
          // 16 = short, 20 = long
          data.pangenesisRole[matches.target] = duration > 18 ? 'longDark' : 'shortDark';
        } else if (id === pangenesisEffects.lightTilt) {
          const duration = parseFloat(matches.duration);
          // 16 = short, 20 = long
          data.pangenesisRole[matches.target] = duration > 18 ? 'longLight' : 'shortLight';
        } else if (id === pangenesisEffects.unstableFactor) {
          if (matches.count === '01')
            data.pangenesisRole[matches.target] = 'one';
        } else if (id === pangenesisEffects.stableSystem) {
          // Ordered: Unstable Factor / Stable System / Umbral Tilt (light) / Astral Tilt (dark)
          // ...and applied per person in that order.  Don't overwrite roles here.
          data.pangenesisRole[matches.target] ??= 'not';
        }
      },
    },
    {
      id: 'P12S Pangenesis Initial',
      type: 'GainsEffect',
      netRegex: { effectId: 'E22', capture: false },
      delaySeconds: 0.5,
      durationSeconds: (data) => {
        // There's ~13 seconds until the first tower and ~18 until the second tower.
        // Based on the strat chosen in the triggerset config, to avoid noisy alerts,
        // only extend duration for the long tilts and other players not taking the first towers.
        const myRole = data.pangenesisRole[data.me];
        if (myRole === undefined)
          return;
        const strat = data.triggerSetConfig.pangenesisFirstTower;
        const longerDuration = ['longDark', 'longLight'];
        if (strat === 'one')
          longerDuration.push('not');
        else if (strat === 'not')
          longerDuration.push('one');
        return longerDuration.includes(myRole) ? 17 : 12;
      },
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        const strat = data.triggerSetConfig.pangenesisFirstTower;
        const myRole = data.pangenesisRole[data.me];
        if (myRole === undefined)
          return;
        if (myRole === 'shortLight')
          return output.shortLight();
        if (myRole === 'longLight')
          return strat === 'not' ? output.longLightMerge() : output.longLight();
        if (myRole === 'shortDark')
          return output.shortDark();
        if (myRole === 'longDark')
          return strat === 'not' ? output.longDarkMerge() : output.longDark();
        const myBuddy = Object.keys(data.pangenesisRole).find((x) => {
          return data.pangenesisRole[x] === myRole && x !== data.me;
        });
        const player = myBuddy === undefined
          ? output.unknown()
          : data.options.AutumnStyle
          ? data.party.jobAbbr(myBuddy)
          : data.party.member(myBuddy);
        if (myRole === 'not') {
          if (strat === 'not')
            return output.nothingWithTower({ player: player, tower: output.firstTower() });
          else if (strat === 'one')
            return output.nothingWithTower({ player: player, tower: output.secondTower() });
          return output.nothing({ player: player });
        }
        if (strat === 'not')
          return output.oneWithTower({ player: player, tower: output.secondTowerMerge() });
        else if (strat === 'one')
          return output.oneWithTower({ player: player, tower: output.firstTower() });
        return output.one({ player: player });
      },
      run: (data) => data.pangenesisDebuffsCalled = true,
      outputStrings: {
        nothing: {
          en: 'Nothing (w/${player})',
          de: 'Nichts (mit ${player})',
          fr: 'Rien (avec ${player})',
          ja: '無職: 2番目の上の塔 (${player})',
          cn: '闲人: 踩第2轮塔 (${player})',
          ko: '무직: 둘째🡹 타워 (${player})',
        },
        nothingWithTower: {
          en: 'Nothing (w/${player}) - ${tower}',
          de: 'Nichts (mit ${player}) - ${tower}',
          fr: 'Rien (avec ${player}) - ${tower}',
          cn: '闲人 (和 ${player}) - ${tower}',
          ko: '무직: ${tower} (${player})',
        },
        one: {
          en: 'One (w/${player})',
          de: 'Eins (mit ${player})',
          fr: 'Un (avec ${player})',
          ja: '因子1: 1番目の塔 (${player})',
          cn: '单因子: 踩第1轮塔 (${player})',
          ko: '인자1: 첫 타워 (${player})',
        },
        oneWithTower: {
          en: 'One (w/${player}) - ${tower}',
          de: 'Eins (mit ${player}) - ${tower}',
          fr: 'Un (avec ${player}) - ${tower}',
          cn: '单因子 (和 ${player}) - ${tower}',
          ko: '인자1: ${tower} (${player})',
        },
        shortLight: {
          en: 'Short Light (get first dark)',
          de: 'Hell kurz (nimm erstes Dunkel)',
          fr: 'Lumière courte (prenez le 1er sombre)',
          ja: '早: 1番目のやみ塔',
          cn: '短光: 踩第1轮黑塔',
          ko: '빠름: 첫 🟣검은 타워',
        },
        longLight: {
          en: 'Long Light (get second dark)',
          de: 'Hell lang (nimm zweites Dunkel)',
          fr: 'Lumière long (prenez le 2nd sombre)',
          ja: '遅: 2番目の下のやみ塔',
          cn: '长光: 踩第2轮黑塔',
          ko: '느림: 둘째🡻 🟣검은 타워',
        },
        longLightMerge: {
          en: 'Long Light (get second dark - merge first)',
          de: 'Hell lang (nimm zweites Dunkel - zuerst kombinieren)',
          fr: 'Lumière long (prenez le 2nd sombre - fusionnez d\'abord)',
          cn: '长光 (踩第2轮黑塔 - 先合成)',
          ko: '느림: 둘째 🟣검은 타워 - 먼저 합쳐요',
        },
        shortDark: {
          en: 'Short Dark (get first light)',
          de: 'Dunkel kurz (nimm erstes Hell)',
          fr: 'Sombre court (prenez la 1ère lumière)',
          ja: '早: 1番目のひかり塔',
          cn: '短暗: 踩第1轮白塔',
          ko: '빠름: 첫 🟡하얀 타워',
        },
        longDark: {
          en: 'Long Dark (get second light)',
          de: 'Dunkel lang (nimm zweites Hell)',
          fr: 'Sombre long (prenez la 2nde lumière)',
          ja: '遅: 2番目の下のひかり塔',
          cn: '长暗: 踩第2轮白塔',
          ko: '느림: 둘째🡻 🟡하얀 타워',
        },
        longDarkMerge: {
          en: 'Long Dark (get second light - merge first)',
          de: 'Dunkel lang (nimm zweites Hell - zuerst kombinieren)',
          fr: 'Sombre long (prenez le 2nde lumière - fusionnez d\'abord)',
          cn: '长暗 (踩第2轮白塔 - 先合成)',
          ko: '느림: 둘째 🟡하얀 타워 - 먼저 합쳐요',
        },
        firstTower: {
          en: 'First Tower',
          de: 'Erster Turm',
          fr: 'Première tour',
          cn: '1 塔',
          ko: '첫 타워',
        },
        secondTower: {
          en: 'Second Tower',
          de: 'Zweiter Turm',
          fr: 'Deuxième tour',
          cn: '2 塔',
          ko: '둘째 타워',
        },
        secondTowerMerge: {
          en: 'Second Tower (Merge first)',
          de: 'Zweiter Turm (zuerst kombinieren)',
          fr: 'Deuxième tour (fusionnez d\'abord)',
          cn: '2 塔 (先合成)',
          ko: '둘째 타워 - 먼저 합쳐요',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Pangenesis Tilt Gain',
      type: 'GainsEffect',
      netRegex: { effectId: [pangenesisEffects.lightTilt, pangenesisEffects.darkTilt] },
      condition: (data, matches) => matches.target === data.me && data.phase === 'pangenesis',
      run: (data, matches) => {
        const color = matches.effectId === pangenesisEffects.lightTilt ? 'light' : 'dark';
        data.pangenesisCurrentColor = color;
      },
    },
    {
      id: 'P12S Pangenesis Tilt Lose',
      type: 'LosesEffect',
      netRegex: { effectId: [pangenesisEffects.lightTilt, pangenesisEffects.darkTilt] },
      condition: (data, matches) => matches.target === data.me && data.phase === 'pangenesis',
      run: (data) => data.pangenesisCurrentColor = undefined,
    },
    {
      id: 'P12S Pangenesis Tower',
      type: 'Ability',
      // 8343 = Umbral Advent (light tower), 8344 = Astral Advent (dark tower)
      netRegex: { id: ['8343', '8344'] },
      condition: (data, matches) => matches.target === data.me && data.phase === 'pangenesis',
      run: (data, matches) => {
        const color = matches.id === '8343' ? 'light' : 'dark';
        data.lastPangenesisTowerColor = color;
      },
    },
    {
      id: 'P12S Pangenesis Slime Reminder',
      type: 'Ability',
      // 8343 = Umbral Advent (light tower), 8344 = Astral Advent (dark tower)
      // There's always 1-2 of each, so just watch one.
      netRegex: { id: '8343', capture: false },
      condition: (data) => data.phase === 'pangenesis',
      preRun: (data) => data.pangenesisTowerCount++,
      suppressSeconds: 3,
      alarmText: (data, _matches, output) => {
        if (data.pangenesisTowerCount !== 3)
          return;
        if (data.pangenesisRole[data.me] !== 'not')
          return;
        return output.slimeTethers();
      },
      outputStrings: {
        slimeTethers: {
          en: 'Get Slime Tethers',
          de: 'Nimm Schleim Verbindung',
          fr: 'Prenez les liens Slime',
          ja: 'スライムの線取り',
          cn: '接线',
          ko: '끝이지만 무직! 슬라임 채요!',
        },
      },
    },
    {
      id: 'P12S Pangenesis Tower Call',
      type: 'GainsEffect',
      netRegex: { effectId: pangenesisEffects.lightTilt, capture: false },
      condition: (data) => {
        if (data.phase !== 'pangenesis')
          return false;
        return data.lastPangenesisTowerColor !== undefined && data.pangenesisTowerCount !== 3;
      },
      delaySeconds: 0.5,
      suppressSeconds: 3,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          // TODO: with more tracking we could even tell you who you're supposed
          // to be with so that you could yell something on comms to fix mistakes.
          lightTower: {
            en: 'Light Tower',
            de: 'Heller Turm',
            fr: 'Tour de lumière',
            ja: 'ひかり塔',
            cn: '踩白塔',
            ko: '🟡하얀 타워',
          },
          darkTower: {
            en: 'Dark Tower',
            de: 'Dunkler Turm',
            fr: 'Tour sombre',
            ja: 'やみ塔',
            cn: '踩黑塔',
            ko: '🟣검은 타워',
          },
          lightTowerSwitch: {
            en: 'Light Tower (switch)',
            de: 'Heller Turm (wechsel)',
            fr: 'Tour de lumière (switch)',
            ja: 'やみ -> ひかり塔',
            cn: '踩白塔 (换色)',
            ko: '🟡하얀 타워 (반대로)',
          },
          darkTowerSwitch: {
            en: 'Dark Tower (switch)',
            de: 'Dunkler Turm (wechsel)',
            fr: 'Tour sombre (switch)',
            ja: 'ひかり -> やみ塔',
            cn: '踩黑塔 (换色)',
            ko: '🟣검은 타워 (반대로)',
          },
        };
        const strat = data.triggerSetConfig.pangenesisFirstTower;
        const myRole = data.pangenesisRole[data.me];
        if (myRole === undefined)
          return;
        const switchOutput = data.lastPangenesisTowerColor === 'light'
          ? 'darkTowerSwitch'
          : 'lightTowerSwitch';
        const stayOutput = data.lastPangenesisTowerColor === 'light' ? 'lightTower' : 'darkTower';
        // 2nd towers
        if (data.pangenesisTowerCount === 1) {
          if (strat === 'not') {
            // in the 0+2 strat, 2nd tower responsibilities are fixed based on 1st tower soaks.
            // the shortLight, shortDark, and both 'not' players always take the northern (opposite color) towers.
            // the longLight, longDark, and both 'one' players soak the southern (same color) towers - per their still-active Pangenesis Initial call
            const swapRoles = ['not', 'shortLight', 'shortDark'];
            if (swapRoles.includes(myRole))
              return { infoText: output[switchOutput]() }; // infoText because, although a switch, it's 100% anticipated and should be treated as a reminder
            return;
          } else if (strat === 'one') {
            // in the 1+2 strat, 2nd tower responsibilities are flexible based on debuffs applied by the 1st tower
            // the 'not' players take the northern towers and the longLight and longDark players taken the southern towers
            // for the 'one' and shortDark/shortLight players, whomever receives a same-color debuff from the first tower goes north (swaps), the other goes south
            const swapRoles = ['one', 'shortLight', 'shortDark'];
            if (data.pangenesisCurrentColor === data.lastPangenesisTowerColor)
              return { alertText: output[switchOutput]() };
            else if (swapRoles.includes(myRole))
              return { infoText: output[stayOutput]() };
          } else if (data.pangenesisCurrentColor === data.lastPangenesisTowerColor)
            return { alertText: output[switchOutput]() }; // if no strat, only call a swap for players who must swap or deadge
          return;
        }
        // 3rd towers
        // in both the 0+2 and 1+2 strats, only the players whose debuff is incompatible with the next tower will swap; all others stay
        if (data.pangenesisCurrentColor === data.lastPangenesisTowerColor)
          return { alertText: output[switchOutput]() };
        if (strat === 'not' || strat === 'one')
          return { infoText: output[stayOutput]() };
      },
    },
    {
      id: 'P12S Summon Darkness Preposition',
      type: 'StartsUsing',
      netRegex: { id: '832F', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.options.AutumnStyle && data.seenSecondTethers === false,
      infoText: (_data, _matches, output) => output.stackForTethers(),
      outputStrings: {
        stackForTethers: {
          en: 'Stack for Tethers',
          de: 'Sammeln für Verbindungen',
          fr: 'Packez pour les liens',
          cn: '集合等待连线出现',
          ko: '한가운데 모여요!',
        },
      },
    },
    {
      id: 'P12S Ultima Ray 1',
      type: 'StartsUsing',
      netRegex: { id: '8330', source: 'Hemitheos' },
      condition: (data) => data.phase === 'gaiaochos1',
      infoText: (data, matches, output) => {
        data.darknessClones.push(matches);
        if (data.darknessClones.length !== 3)
          return;
        // during 'UAV' phase, the center of the circular arena is [100, 90]
        const uavCenterX = 100;
        const uavCenterY = 90;
        if (data.options.AutumnStyle) {
          const unsafeMap = {
            arrowN: 'arrowS',
            arrowNE: 'arrowSW',
            arrowE: 'arrowW',
            arrowSE: 'arrowNW',
            arrowS: 'arrowN',
            arrowSW: 'arrowNE',
            arrowW: 'arrowE',
            arrowNW: 'arrowSE',
          };
          let safeDirs = Object.keys(unsafeMap);
          data.darknessClones.forEach((clone) => {
            const x = parseFloat(clone.x);
            const y = parseFloat(clone.y);
            const cloneDir = AutumnDirections.xyToArrow8Output(x, y, uavCenterX, uavCenterY);
            const pairedDir = unsafeMap[cloneDir];
            safeDirs = safeDirs.filter((dir) => dir !== cloneDir && dir !== pairedDir);
          });
          if (safeDirs.length !== 2)
            return;
          const [dir1, dir2] = safeDirs.sort();
          if (dir1 === undefined || dir2 === undefined)
            return;
          let arrow = undefined;
          if (data.job !== 'BLU') {
            arrow = getUltimaRayArrow(data.role === 'dps', dir1, dir2);
          } else {
            const name = data.party.member(data.me);
            if (Autumn.isRoleName(name.nick))
              arrow = getUltimaRayArrow(Autumn.isDpsName(name.nick), dir1, dir2);
          }
          if (arrow !== undefined)
            return output.moveTo({ dir: output[arrow]() });
          return output.combined({ dir1: output[dir1](), dir2: output[dir2]() });
        }
        const unsafeMap = {
          dirN: 'dirS',
          dirNE: 'dirSW',
          dirE: 'dirW',
          dirSE: 'dirNW',
          dirS: 'dirN',
          dirSW: 'dirNE',
          dirW: 'dirE',
          dirNW: 'dirSE',
        };
        let safeDirs = Object.keys(unsafeMap);
        data.darknessClones.forEach((clone) => {
          const x = parseFloat(clone.x);
          const y = parseFloat(clone.y);
          const cloneDir = Directions.xyTo8DirOutput(x, y, uavCenterX, uavCenterY);
          const pairedDir = unsafeMap[cloneDir];
          safeDirs = safeDirs.filter((dir) => dir !== cloneDir && dir !== pairedDir);
        });
        if (safeDirs.length !== 2)
          return;
        const [dir1, dir2] = safeDirs.sort();
        if (dir1 === undefined || dir2 === undefined)
          return;
        return output.combined({ dir1: output[dir1](), dir2: output[dir2]() });
      },
      outputStrings: {
        combined: {
          en: '${dir1} / ${dir2} Safe',
          de: '${dir1} / ${dir2} Sicher',
          fr: '${dir1} / ${dir2} Sûr',
          cn: '${dir1} / ${dir2} 安全',
          ko: '${dir1} / ${dir2} 안전',
        },
        moveTo: {
          en: '${dir}',
          ko: '${dir}으로',
        },
        ...Directions.outputStrings8Dir,
        ...AutumnDirections.outputStringsArrow8,
      },
    },
    {
      id: 'P12S Ultima Ray 2',
      type: 'StartsUsing',
      netRegex: { id: '8330', source: 'Hemitheos' },
      condition: (data) => data.phase === 'gaiaochos2',
      infoText: (data, matches, output) => {
        // during 'UAV' phase, the center of the circular arena is [100, 90]
        const uavCenterX = 100;
        const uavCenterY = 90;
        if (data.options.AutumnStyle) {
          const safeMap = {
            // for each dir, identify the two dirs 90 degrees away
            arrowN: ['arrowW', 'arrowE'],
            arrowNE: ['arrowNW', 'arrowSE'],
            arrowE: ['arrowN', 'arrowS'],
            arrowSE: ['arrowNE', 'arrowSW'],
            arrowS: ['arrowW', 'arrowE'],
            arrowSW: ['arrowNW', 'arrowSE'],
            arrowW: ['arrowN', 'arrowS'],
            arrowNW: ['arrowNE', 'arrowSW'],
            unknown: [],
          };
          const x = parseFloat(matches.x);
          const y = parseFloat(matches.y);
          const cloneDir = AutumnDirections.xyToArrow8Output(x, y, uavCenterX, uavCenterY);
          const [dir1, dir2] = safeMap[cloneDir];
          if (dir1 === undefined || dir2 === undefined)
            return;
          let arrow = undefined;
          if (data.job !== 'BLU') {
            arrow = getUltimaRayArrow(data.role === 'dps', dir1, dir2);
          } else {
            const name = data.party.member(data.me);
            if (Autumn.isRoleName(name.nick))
              arrow = getUltimaRayArrow(Autumn.isDpsName(name.nick), dir1, dir2);
          }
          if (arrow !== undefined)
            return output.moveTo({ dir: output[arrow]() });
          return output.combined({ dir1: output[dir1](), dir2: output[dir2]() });
        }
        const safeMap = {
          // for each dir, identify the two dirs 90 degrees away
          dirN: ['dirW', 'dirE'],
          dirNE: ['dirNW', 'dirSE'],
          dirE: ['dirN', 'dirS'],
          dirSE: ['dirNE', 'dirSW'],
          dirS: ['dirW', 'dirE'],
          dirSW: ['dirNW', 'dirSE'],
          dirW: ['dirN', 'dirS'],
          dirNW: ['dirNE', 'dirSW'],
          unknown: [],
        };
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const cloneDir = Directions.xyTo8DirOutput(x, y, uavCenterX, uavCenterY);
        const [dir1, dir2] = safeMap[cloneDir];
        if (dir1 === undefined || dir2 === undefined)
          return;
        return output.combined({ dir1: output[dir1](), dir2: output[dir2]() });
      },
      outputStrings: {
        combined: {
          en: '${dir1} / ${dir2} Safe',
          de: '${dir1} / ${dir2} Sicher',
          fr: '${dir1} / ${dir2} Sûr',
          cn: '${dir1} / ${dir2} 安全',
          ko: '${dir1} / ${dir2} 안전',
        },
        moveTo: {
          en: '${dir}',
          ko: '${dir}으로',
        },
        ...Directions.outputStrings8Dir,
        ...AutumnDirections.outputStringsArrow8,
      },
    },
    {
      id: 'P12S Gaiaochos',
      type: 'StartsUsing',
      netRegex: { id: '8326', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'AoE + Shrink',
          ko: '전체 공격 + 작아져요',
        },
      },
    },
    {
      id: 'P12S Gaiaochos Tether',
      type: 'Tether',
      netRegex: { id: '0009' },
      condition: (data) => data.phase === 'gaiaochos1' || data.phase === 'gaiaochos2',
      durationSeconds: (data) => data.phase === 'gaiaochos2' ? 6 : 4,
      alertText: (data, matches, output) => {
        if (matches.source !== data.me && matches.target !== data.me)
          return;
        const partner = matches.source === data.me ? matches.target : matches.source;
        if (data.options.AutumnStyle && data.phase === 'gaiaochos1')
          return output.uav1({ partner: data.party.jobAbbr(partner) });
        if (data.phase === 'gaiaochos1')
          return output.uav1({ partner: data.party.member(partner) });
        data.seenSecondTethers = true;
        if (data.options.AutumnStyle)
          return output.uav2({
            partner: data.party.jobAbbr(partner),
            geocentrism: data.geocentrism2OutputStr ?? output.unknown(),
          });
        return output.uav2({
          partner: data.party.member(partner),
          geocentrism: data.geocentrism2OutputStr ?? output.unknown(),
        });
      },
      outputStrings: {
        uav1: {
          en: 'Break tether (w/ ${partner})',
          de: 'Verbindung brechen (mit ${partner})',
          fr: 'Cassez le lien (avec ${partner})',
          ja: '線切る (${partner})',
          cn: '拉断连线 (和 ${partner})',
          ko: '끊어요! (${partner})',
        },
        uav2: {
          en: 'Break tether (w/ ${partner}) => ${geocentrism}',
          de: 'Verbindung brechen (mit ${partner}) => ${geocentrism}',
          fr: 'Cassez le lien (avec ${partner}) => ${geocentrism}',
          cn: '拉断连线 (和 ${partner}) => ${geocentrism}',
          ko: '끊고 + 흩어져요(${geocentrism}) (${partner})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Ultima Blow Tether Collect',
      type: 'Tether',
      netRegex: { id: '0001' },
      condition: (data) => data.phase === 'gaiaochos2',
      run: (data, matches) => data.gaiaochosTetherCollect.push(matches.target),
    },
    {
      id: 'P12S Ultima Blow Tether',
      type: 'Tether',
      netRegex: { id: '0001', capture: false },
      condition: (data) => data.phase === 'gaiaochos2',
      delaySeconds: 0.5,
      suppressSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          blockPartner: {
            en: 'Block tether',
            de: 'Verbindung blockieren',
            fr: 'Bloquez le lien',
            ja: '相棒の前でビームを受ける',
            cn: '挡枪',
            ko: '줄 앞에 막아줘요',
          },
          stretchTether: {
            en: 'Stretch tether',
            de: 'Verbindung lang ziehen',
            fr: 'Étirez le lien',
            cn: '拉线',
            ko: '줄 늘려요',
          },
        };
        if (data.gaiaochosTetherCollect.includes(data.me))
          return { infoText: output.stretchTether() };
        return { alertText: output.blockPartner() };
      },
      // If people die, it's not always on the opposite role, so just re-collect.
      run: (data) => data.gaiaochosTetherCollect = [],
    },
    {
      id: 'P12S Ultima',
      type: 'StartsUsing',
      netRegex: { id: ['8682', '86F6'], source: 'Pallas Athena', capture: false },
      alertText: (data, _match, output) => {
        data.prsUltima = (data.prsUltima ?? 0) + 1;
        return output.text({ num: data.prsUltima });
      },
      outputStrings: {
        text: {
          en: 'Ultima${num} AoE',
          ko: '알테마#${num} 전체 공격',
        },
      },
    },
    {
      id: 'P12S Palladian Grasp Target',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.palladianGrasp)
          data.palladionGrapsTarget = matches.target;
      },
    },
    {
      id: 'P12S Palladian Grasp',
      type: 'StartsUsing',
      netRegex: { id: '831A', source: 'Pallas Athena', capture: false },
      response: (data, _match, output) => {
        // cactbot-builtin-response
        // We could suggest to swap here, but I think this is mostly invulned.
        output.responseOutputStrings = {
          tankBusterCleavesOnYou: {
            en: 'Half Tank Buster! Invulnerable!',
            ko: '맵 반쪽 탱크버스터! 무적으로!',
          },
          tankBusterCleaves: {
            en: 'Half Tank Buster!',
            ko: '맵 반쪽 탱크버스터!',
          },
          avoidTankCleaves: {
            en: 'Avoid half Tank Buster',
            ko: '맵 반쪽 탱크버스터 피해요',
          },
        };
        if (data.palladionGrapsTarget === data.me)
          return { alertText: output.tankBusterCleavesOnYou() };
        if (data.role === 'tank' || data.role === 'healer' || data.job === 'BLU')
          return { alertText: output.tankBusterCleaves() };
        return { infoText: output.avoidTankCleaves() };
      },
    },
    {
      id: 'P12S 크러시 헬름',
      type: 'StartsUsing',
      netRegex: { id: '8317', source: 'Pallas Athena', capture: false },
      condition: (data) => data.options.AutumnStyle,
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tank();
        if (data.role === 'healer')
          return output.healer();
      },
      outputStrings: {
        tank: {
          en: 'Tank Buster!',
          ko: '탱크버스터! 에스나 받아욧',
        },
        healer: {
          en: 'Ready to cleansing',
          ko: '탱크버스터! 에스나 받아욧',
        },
      },
    },
    {
      id: 'P12S Caloric Theory 1 Beacon Collect',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.caloric1Beacon)
          data.caloric1First.push(matches.target);
      },
    },
    {
      id: 'P12S Caloric Theory 1 Beacon',
      type: 'StartsUsing',
      netRegex: { id: '8338', source: 'Pallas Athena', capture: false },
      condition: (data) => data.caloricCounter === 1,
      preRun: (data) => {
        data.caloric1Buff = {};
        data.caloric1Mine = undefined;
      },
      delaySeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          noBeacon: {
            en: 'Initial Fire: ${player1}, ${player2}',
            de: 'Initiales Feuer: ${player1}, ${player2}',
            fr: 'Feu initial : ${player1}, ${player2}',
            cn: '火标记点: ${player1}, ${player2}',
            ko: '첫 불: ${player1}, ${player2}',
          },
          beacon: {
            en: 'Initial Fire (w/ ${partner})',
            de: 'Initiales Feuer (mit ${partner})',
            fr: 'Feu initial (avec ${partner})',
            ja: '自分に初炎 (${partner})',
            cn: '火标记点名 (和 ${partner})',
            ko: '첫 불! 앞으로! (${partner})',
          },
        };
        if (data.caloric1First.length !== 2)
          return;
        const index = data.caloric1First.indexOf(data.me);
        if (data.options.AutumnStyle && index < 0)
          return {
            infoText: output.noBeacon({
              player1: data.party.jobAbbr(data.caloric1First[0]),
              player2: data.party.jobAbbr(data.caloric1First[1]),
            }),
          };
        if (index < 0)
          return {
            infoText: output.noBeacon({
              player1: data.party.member(data.caloric1First[0]),
              player2: data.party.member(data.caloric1First[1]),
            }),
          };
        const partner = index === 0 ? 1 : 0;
        if (data.options.AutumnStyle) {
          const name = data.party.jobAbbr(data.caloric1First[partner]);
          return { alertText: output.beacon({ partner: name }) };
        }
        return {
          alertText: output.beacon({ partner: data.party.member(data.caloric1First[partner]) }),
        };
      },
    },
    {
      id: 'P12S Caloric Theory 1 Wind',
      type: 'GainsEffect',
      // E07 = Atmosfaction
      netRegex: { effectId: 'E07' },
      run: (data, matches) => data.caloric1Buff[matches.target] = 'wind',
    },
    {
      id: 'P12S Caloric Theory 1 Fire',
      type: 'GainsEffect',
      // E06 = Pyrefaction
      netRegex: { effectId: 'E06' },
      alertText: (data, matches, output) => {
        data.caloric1Buff[matches.target] = 'fire';
        const duration = parseFloat(matches.duration);
        if (duration < 12 && matches.target === data.me)
          return output.text();
      },
      outputStrings: {
        text: {
          en: 'Fire again',
          de: 'nochmal Feuer',
          fr: 'Feu à nouveau',
          ja: '再び炎！無職とあたまわり',
          cn: '二次火标记点名',
          ko: '또다시 불! 무직이랑 뭉쳐요',
        },
      },
    },
    {
      id: 'P12S Caloric Theory 1 Fire Final',
      type: 'GainsEffect',
      netRegex: { effectId: ['E06'] },
      condition: (_data, matches) => parseFloat(matches.duration) > 11,
      delaySeconds: 12.8,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.caloric1Mine === 'fire' && data.caloric1Buff[data.me] === undefined)
          return output.none();
        if (data.caloric1Mine === 'wind')
          return output.wind();
      },
      outputStrings: {
        none: {
          en: 'Stack with Fire',
          de: 'Mit Feuer sammeln',
          fr: 'Package avec le Feu',
          ja: '無職！炎とあたまわり',
          cn: '与火标记分摊',
          ko: '무직! 불이랑 뭉쳐요!',
        },
        wind: {
          en: 'Spread Wind',
          de: 'Wind verteilen',
          fr: 'Écartez le vent',
          ja: '風！ 散会',
          cn: '风点名散开',
          ko: '바람! 흩어져요!',
        },
      },
    },
    {
      id: 'P12S Caloric Theory 1 Initial Buff',
      type: 'Ability',
      netRegex: { id: '8338', source: 'Pallas Athena', capture: false },
      condition: (data) => data.caloricCounter === 1,
      delaySeconds: 2,
      durationSeconds: 8,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          fire: {
            en: 'Fire (w/${team})',
            de: 'Feuer (mit ${team})',
            fr: 'Feu (avec ${team})',
            ja: '自分に炎 (${team})',
            cn: '火标记点名 (和 ${team})',
            ko: '불 (${team})',
          },
          wind: {
            en: 'Wind (w/${team})',
            de: 'Wind (mit ${team})',
            fr: 'Vent (avec ${team})',
            ja: '自分に風 (${team})',
            cn: '风标记点名 (和 ${team})',
            ko: '바람 (${team})',
          },
          windBeacon: {
            en: 'Initial Wind',
            de: 'Initial Wind',
            fr: 'Vent inital',
            ja: '自分に初風',
            cn: '风标记点名',
            ko: '바람, 살짝 옆으로',
          },
        };
        const myBuff = data.caloric1Buff[data.me];
        data.caloric1Mine = myBuff;
        if (myBuff === undefined)
          return;
        if (myBuff === 'fire') {
          const myTeam = [];
          for (const [name, stat] of Object.entries(data.caloric1Buff)) {
            if (stat === myBuff /* && name !== data.me */)
              myTeam.push(name);
          }
          return { alertText: output.fire({ team: data.party.priorityList(myTeam).join(', ') }) };
        }
        if (data.caloric1First.includes(data.me))
          return { infoText: output.windBeacon() };
        const myTeam = [];
        for (const [name, stat] of Object.entries(data.caloric1Buff)) {
          if (stat === myBuff && /* name !== data.me && */ !data.caloric1First.includes(name))
            myTeam.push(name);
        }
        return { alertText: output.wind({ team: data.party.priorityList(myTeam).join(', ') }) };
      },
      run: (data) => {
        data.caloric1First = [];
        data.caloric1Buff = {};
      },
    },
    {
      id: 'P12S Caloric Theory 2 Fire Beacon',
      type: 'HeadMarker',
      netRegex: {},
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          fireOnMe: {
            // TODO: is "first marker" ambiguous with "first person to pass fire"
            // This is meant to be "person without wind who gets an extra stack".
            en: 'Fire Marker',
            de: 'Feuer Markierung',
            ja: '自分に初炎!',
            cn: '火标记点名',
            ko: '첫 불! 한가운데로!',
          },
          fireOn: {
            en: 'Fire on ${player}',
            de: 'Feuer auf ${player}',
            fr: 'Feu sur ${player}',
            ja: '初炎: ${player}',
            cn: '火标记点 ${player}',
            ko: '불 교대: ${player}',
          },
        };
        if (data.decOffset === undefined)
          return;
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.caloric2InitialFire)
          return;
        if (data.me === matches.target)
          return { alarmText: output.fireOnMe() };
        if (data.options.AutumnStyle && data.palladionGrapsTarget === data.me)
          return { infoText: output.fireOn({ player: data.party.jobAbbr(matches.target) }) };
        if (data.palladionGrapsTarget === data.me)
          return { infoText: output.fireOn({ player: data.party.member(matches.target) }) };
      },
    },
    {
      id: 'P12S Caloric Theory 2 Wind',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.caloric2Wind)
          return;
        return output.text();
      },
      outputStrings: {
        text: {
          en: 'Wind Spread',
          de: 'Wind verteilen',
          fr: 'Écartez le vent',
          ja: '自分に風、散会',
          cn: '风点名散开',
          ko: '바람, 흩어져요',
        },
      },
    },
    {
      id: 'P12S Caloric Theory 2 Pass',
      type: 'GainsEffect',
      netRegex: { effectId: 'E08' },
      condition: (data) => data.caloricCounter === 2,
      durationSeconds: 3,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          passFire: {
            en: 'Pass Fire',
            de: 'Feuer weitergeben',
            fr: 'Passez le feu',
            ja: '次に移る！',
            cn: '传火!',
            ko: '불 장판 옮겨욧! 반시계 방향❱❱',
          },
          moveAway: Outputs.moveAway,
        };
        const prevFire = data.caloric2Fire;
        const thisFire = matches.target;
        // Order of events:
        // - Player 1 gets the debuff at 8
        // - Player 1 gets the debuff at 7
        //
        // loop:
        // - Player 2 gets the debuff at 7
        // - Player 1 loses the debuff
        // - Player 2 gets the debuff at 6
        // etc.
        //
        // Ignore duplicates, only consider transfers.
        if (prevFire === thisFire)
          return;
        data.caloric2Fire = matches.target;
        data.caloric2PassCount++;
        if (thisFire !== data.me && prevFire !== data.me)
          return;
        if (data.caloric2PassCount === 8 || prevFire === data.me)
          return { infoText: output.moveAway() };
        if (thisFire === data.me)
          return { alertText: output.passFire() };
      },
    },
    {
      id: 'P12S Ekpyrosis Cast',
      type: 'StartsUsing',
      netRegex: { id: '831E', source: 'Pallas Athena', capture: false },
      // This cast happens while people need to plant for the end of Caloric 2,
      // so delay the call to avoid people jumping the gun.
      delaySeconds: (data) => data.caloricCounter === 2 ? 3 : 0,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Exaflare + Big AoE!',
          de: 'Exaflare + Große AoE!',
          fr: 'Brasier + Grosse AoE !',
          ja: 'エクサフレア + 全体攻撃',
          cn: '地火 + 大AoE伤害!',
          ko: '엑사플레어 + 전체 공격',
        },
      },
    },
    {
      id: 'P12S Ekpyrosis Spread',
      type: 'Ability',
      netRegex: { id: '831F', source: 'Pallas Athena', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 2,
      response: Responses.spread('alert'),
    },
    //
    {
      id: 'P12S 어듬이 프로보크',
      type: 'Ability',
      netRegex: { id: ['1D6D', '4783'] },
      condition: (data) => data.options.AutumnStyle,
      run: (data, matches) => data.palladionGrapsTarget = matches.source,
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceSync': {
        'Apodialogos/Peridialogos': 'Apodia/Peridia',
        'Astral Advance/Umbral Advance': 'Astral/Umbral Advance',
        'Astral Advent/Umbral Advent': 'Astral/Umbral Advent',
        'Astral Glow/Umbral Glow': 'Astral/Umbral Glow',
        'Astral Impact/Umbral Impact': 'Astral/Umbral Impact',
        'Superchain Coil/Superchain Burst': 'Superchain Coil/Burst',
        'Theos\'s Saltire/Theos\'s Cross': 'Saltire/Cross',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        '(?<! )Athena': 'Athena',
        'Anthropos': 'Anthropos',
        'Concept of Earth': 'Substanz der Erde',
        'Concept of Fire': 'Substanz des Feuers',
        'Concept of Water': 'Substanz des Wassers',
        'Forbidden Factor': 'Tabu',
        'Hemitheos': 'Hemitheos',
        'Pallas Athena': 'Pallas Athena',
        'Thymou Idea': 'Thymos',
      },
      'replaceText': {
        '\\(Floor Drop\\)': '(Boden bricht weg)',
        '\\(cast\\)': '(Wirken)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(proximity\\)': '(Entfernung)',
        '\\(spread\\)': '(Verteilen)',
        '--tethers--': '--Verbindungen--',
        'Apodialogos': 'Apodialogos',
        'Astral Advance': 'Lichtvordringen',
        'Astral Advent': 'Vorzeit des Lichts',
        'Astral Glow': 'Lichtglühen',
        'Astral Impact': 'Lichtschlag',
        'Caloric Theory': 'Kalorische Theorie',
        'Crush Helm': 'Zenitspaltung',
        'Demi Parhelion': 'Demi-Parhelion',
        '(?<!(Apo|Peri))Dialogos': 'Dialogos',
        'Divine Excoriation': 'Gottes Wort',
        'Dynamic Atmosphere': 'Dynamische Atmosphäre',
        'Ekpyrosis': 'Ekpyrosis',
        'Engravement of Souls': 'Seelensiegel',
        'Entropic Excess': 'Entropischer Exzess',
        'Factor In': 'Interner Faktor',
        'Gaiaochos': 'Gaiaochos',
        'Geocentrism': 'Geozentrismus',
        'Glaukopis': 'Glaukopis',
        'Ignorabimus': 'Ignorabimus',
        'Implode': 'Desintegration',
        'Missing Link': 'Schmerzende Kette',
        'On the Soul': 'Auf der Seele',
        'Palladian Grasp': 'Pallas-Griff',
        'Palladian Ray': 'Pallas-Strahl',
        'Palladion': 'Palladion',
        'Pangenesis': 'Pangenesis',
        'Panta Rhei': 'Panta Rhei',
        'Paradeigma': 'Paradigma',
        'Parthenos': 'Parthenos',
        'Peridialogos': 'Peridialogos',
        'Polarized Ray': 'Polarisierter Strahl',
        'Pyre Pulse': 'Pyrischer Puls',
        'Ray of Light': 'Lichtstrahl',
        'Sample': 'Vielfraß',
        'Searing Radiance': 'Radianz',
        'Shadowsear': 'Seelenbrenner',
        'Shock': 'Entladung',
        'Summon Darkness': 'Beschwörung der Dunkelheit',
        'Superchain Burst': 'Superkette - Ausbruch',
        'Superchain Coil': 'Superkette - Kreis',
        'Superchain Theory I(?!I)': 'Superkette - Theorie 1',
        'Superchain Theory IIA': 'Superkette - Theorie 2a',
        'Superchain Theory IIB': 'Superkette - Theorie 2b',
        'The Classical Concepts': 'Elementarschöpfung',
        'Theos\'s Cross': 'Theisches Kreuz',
        'Theos\'s Holy': 'Theisches Sanctus',
        'Theos\'s Saltire': 'Theisches Schrägkreuz',
        'Theos\'s Ultima': 'Theos Ultima',
        'Trinity of Souls': 'Dreifaltigkeit der Seelen',
        '(?<! )Ultima(?! (B|R))': 'Ultima',
        'Ultima Blade': 'Ultima-Klinge',
        'Ultima Blow': 'Ultima-Schlag',
        'Ultima Ray': 'Ultima-Strahl',
        'Umbral Advance': 'Schattenvordringen',
        'Umbral Advent': 'Vorzeit der Schatten',
        'Umbral Glow': 'Dunkelglühen',
        'Umbral Impact': 'Dunkelschlag',
        'Unnatural Enchainment': 'Seelenfessel',
        'White Flame': 'Weißes Feuer',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        '(?<! )Athena': 'Athéna',
        'Anthropos': 'anthropos',
        'Concept of Earth': 'concept de la terre',
        'Concept of Fire': 'concept du feu',
        'Concept of Water': 'concept de l\'eau',
        'Forbidden Factor': 'facteur tabou',
        'Hemitheos': 'hémithéos',
        'Pallas Athena': 'Pallas Athéna',
        'Thymou Idea': 'thymou idea',
      },
      'replaceText': {
        '--tethers--': '--liens--',
        'Apodialogos': 'Apo dialogos',
        'Astral Advance': 'Avancée astrale',
        'Astral Advent': 'Avènement astral',
        'Astral Glow': 'Lueur astrale',
        'Astral Impact': 'Attaque astrale',
        'Caloric Theory': 'Théorie du calorique',
        'Crush Helm': 'Bombardement céleste',
        'Demi Parhelion': 'Demi-parhélie',
        '(?<!(Apo| |Peri))Dialogos': 'Dialogos',
        'Divine Excoriation': 'Châtiment céleste',
        'Dynamic Atmosphere': 'Vent perçant',
        'Ekpyrosis': 'Ekpyrosis',
        'Engravement of Souls': 'Marquage d\'âme',
        'Entropic Excess': 'Vague de chaleur ardente',
        'Factor In': 'Restauration des facteurs',
        'Gaiaochos': 'Gaiaochos',
        'Geocentrism': 'Géocentrisme',
        'Glaukopis': 'Glaukopis',
        'Ignorabimus': 'Ignorabimus',
        'Implode': 'Auto-effondrement',
        'Missing Link': 'Chaînes suppliciantes',
        'On the Soul': 'Sur les âmes',
        'Palladian Grasp': 'Main de Pallas',
        'Palladian Ray': 'Rayon de Pallas',
        'Palladion': 'Palladion',
        'Pangenesis': 'Pangenèse',
        'Panta Rhei': 'Panta rhei',
        'Paradeigma': 'Paradeigma',
        'Parthenos': 'Parthénon',
        'Peridialogos': 'Péri dialogos',
        'Polarized Ray': 'Rayon de polarité',
        'Pyre Pulse': 'Vague de chaleur intense',
        'Ray of Light': 'Onde de lumière',
        'Sample': 'Voracité',
        'Searing Radiance': 'Radiance',
        'Shadowsear': 'Brûlure d\'ombre',
        'Shock': 'Décharge électrostatique',
        'Summon Darkness': 'Invocation des ténèbres',
        'Superchain Burst': 'Salve des superchaînes',
        'Superchain Coil': 'Cercle des superchaînes',
        'Superchain Theory I(?!I)': 'Théorie des superchaînes I',
        'Superchain Theory IIA': 'Théorie des superchaînes IIA',
        'Superchain Theory IIB': 'Théorie des superchaînes IIB',
        'The Classical Concepts': 'Concepts élémentaires',
        'Theos\'s Cross': 'Croix de théos',
        'Theos\'s Holy': 'Miracle de théos',
        'Theos\'s Saltire': 'Croix décussée de théos',
        'Theos\'s Ultima': 'Ultima de théos',
        'Trinity of Souls': 'Âmes trinité',
        '(?<! )Ultima(?! (B|R))': 'Ultima',
        'Ultima Blade': 'Lames Ultima',
        'Ultima Blow': 'Souffle Ultima',
        'Ultima Ray': 'Rayon Ultima',
        'Umbral Advance': 'Avancée ombrale',
        'Umbral Advent': 'Avènement ombral',
        'Umbral Glow': 'Lueur ombrale',
        'Umbral Impact': 'Attaque ombrale',
        'Unnatural Enchainment': 'Enchaînement d\'âmes',
        'White Flame': 'Feu blanc',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        '(?<! )Athena': 'アテナ',
        'Anthropos': 'アンスロポス',
        'Concept of Earth': '土の概念',
        'Concept of Fire': '火の概念',
        'Concept of Water': '水の概念',
        'Forbidden Factor': '禁忌因子',
        'Hemitheos': 'ヘーミテオス',
        'Pallas Athena': 'パラスアテナ',
        'Thymou Idea': 'テューモス・イデア',
      },
      'replaceText': {
        'Apodialogos': 'アポ・ディアロゴス',
        'Astral Advance': 'アストラルアドバンス',
        'Astral Advent': 'アストラルアドベント',
        'Astral Glow': 'アストラルグロウ',
        'Astral Impact': '星撃',
        'Caloric Theory': 'カロリックセオリー',
        'Crush Helm': '星天爆撃打',
        'Demi Parhelion': 'デミパルヘリオン',
        '(?<!(Apo|Peri))Dialogos': 'ディアロゴス',
        'Divine Excoriation': '神罰',
        'Dynamic Atmosphere': '衝風',
        'Ekpyrosis': 'エクピロシス',
        'Engravement of Souls': '魂の刻印',
        'Entropic Excess': '焦熱波',
        'Factor In': '因子還元',
        'Gaiaochos': 'ガイアオコス',
        'Geocentrism': 'ジオセントリズム',
        'Glaukopis': 'グラウコピス',
        'Ignorabimus': 'イグノラビムス',
        'Implode': '自壊',
        'Missing Link': '苦痛の鎖',
        'On the Soul': 'オン・ザ・ソウル',
        'Palladian Grasp': 'パラスの手',
        'Palladian Ray': 'パラスレイ',
        'Palladion': 'パラディオン',
        'Pangenesis': 'パンゲネシス',
        'Panta Rhei': 'パンタレイ',
        'Paradeigma': 'パラデイグマ',
        'Parthenos': 'パルテノン',
        'Peridialogos': 'ペリ・ディアロゴス',
        'Polarized Ray': 'ポラリティレイ',
        'Pyre Pulse': '重熱波',
        'Ray of Light': '光波',
        'Sample': '貪食',
        'Searing Radiance': 'レイディアンス',
        'Shadowsear': 'シャドーシアー',
        'Shock': '放電',
        'Summon Darkness': 'サモンダークネス',
        'Superchain Burst': 'スーパーチェイン・バースト',
        'Superchain Coil': 'スーパーチェイン・サークル',
        'Superchain Theory I(?!I)': 'スーパーチェイン・セオリーI',
        'Superchain Theory IIA': 'スーパーチェイン・セオリーIIA',
        'Superchain Theory IIB': 'スーパーチェイン・セオリーIIB',
        'The Classical Concepts': 'イデア・エレメンタル',
        'Theos\'s Cross': 'テオス・クロス',
        'Theos\'s Holy': 'テオス・ホーリー',
        'Theos\'s Saltire': 'テオス・サルタイアー',
        'Theos\'s Ultima': 'テオス・アルテマ',
        'Trinity of Souls': 'トリニティ・ソウル',
        '(?<! )Ultima(?! (B|R))': 'アルテマ',
        'Ultima Blade': 'アルテマブレイド',
        'Ultima Blow': 'アルテマブロウ',
        'Ultima Ray': 'アルテマレイ',
        'Umbral Advance': 'アンブラルアドバンス',
        'Umbral Advent': 'アンブラルアドベント',
        'Umbral Glow': 'アンブラルグロウ',
        'Umbral Impact': '霊撃',
        'Unnatural Enchainment': '魂の鎖',
        'White Flame': '白火',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '(?<! )Athena': '雅典娜',
        'Anthropos': '人',
        'Concept of Earth': '土之概念',
        'Concept of Fire': '火之概念',
        'Concept of Water': '水之概念',
        'Forbidden Factor': '禁忌因子',
        'Hemitheos': '半神',
        'Pallas Athena': '帕拉斯雅典娜',
        'Thymou Idea': '激情理念',
      },
      'replaceText': {
        '\\(Floor Drop\\)': '(地板坠落)',
        '\\(cast\\)': '(咏唱)',
        '\\(enrage\\)': '(狂暴)',
        '\\(proximity\\)': '(近)',
        '\\(spread\\)': '(分散)',
        '--tethers--': '--连线--',
        'Apodialogos': '远距离对话',
        'Astral Advance': '星极进升',
        'Astral Advent': '星极临',
        'Astral Glow': '星极炽光',
        'Astral Impact': '星击',
        'Buster': '死刑',
        'Caloric Theory': '热质说',
        'Crush Helm': '星天爆击打',
        'Demi Parhelion': '亚幻日',
        '(?<!(Apo|Peri))Dialogos': '对话',
        'Divine Excoriation': '神罚',
        'Dynamic Atmosphere': '冲风',
        'Ekpyrosis': '宇宙火劫',
        'Engravement of Souls': '灵魂刻印',
        'Entropic Excess': '焦热波',
        'Factor In': '因子还原',
        'Gaiaochos': '大地之主',
        'Geocentrism': '地心说',
        'Glaukopis': '明眸',
        'Ignorabimus': '我仍将一无所知',
        'Implode': '自我毁灭',
        'Missing Link': '苦痛锁链',
        'On the Soul': '论灵魂',
        'Palladian Grasp': '帕拉斯之手',
        'Palladian Ray': '帕拉斯射线',
        'Palladion': '女神的护佑',
        'Pangenesis': '泛生论',
        'Panta Rhei': '万物流变',
        'Paradeigma': '范式',
        'Parthenos': '贞女',
        'Peridialogos': '近距离对话',
        'Polarized Ray': '偏振射线',
        'Pyre Pulse': '重热波',
        'Ray of Light': '光波',
        'Sample': '贪食',
        'Searing Radiance': '飞光',
        'Shadowsear': '影伤',
        'Shock': '放电',
        'Summon Darkness': '黑暗召唤',
        'Superchain Burst': '超链爆发',
        'Superchain Coil': '超链回环',
        'Superchain Theory I(?!I)': '超链理论I',
        'Superchain Theory IIA': '超链理论IIA',
        'Superchain Theory IIB': '超链理论IIB',
        'The Classical Concepts': '元素理念',
        'Theos\'s Cross': '神之十字',
        'Theos\'s Holy': '神之神圣',
        'Theos\'s Saltire': '神之交错',
        'Theos\'s Ultima': '神之究极',
        'Trinity of Souls': '三魂一体',
        '(?<! )Ultima(?! (B|R))': '究极',
        'Ultima Blade': '究极之刃',
        'Ultima Blow': '究极强击',
        'Ultima Ray': '究极射线',
        'Umbral Advance': '灵极进升',
        'Umbral Advent': '灵极临',
        'Umbral Glow': '灵极炽光',
        'Umbral Impact': '灵击',
        'Unnatural Enchainment': '灵魂链',
        'White Flame': '白火',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '(?<! )Athena': '아테나',
        'Anthropos': '안트로포스',
        'Concept of Earth': '땅의 개념',
        'Concept of Fire': '불의 개념',
        'Concept of Water': '물의 개념',
        'Forbidden Factor': '금기 인자',
        'Hemitheos': '헤미테오스',
        'Pallas Athena': '팔라스 아테나',
        'Thymou Idea': '기개의 이데아',
      },
      'replaceText': {
        '\\(Floor Drop\\)': '(바닥 사라짐)',
        '\\(cast\\)': '(시전)',
        '\\(proximity\\)': '(근접)',
        '\\(spread\\)': '(산개)',
        '--tethers--': '--선--',
        'Apodialogos': '원거리 디아로고스',
        'Astral Advance': '별빛 촉진',
        'Astral Advent': '별빛 강림',
        'Astral Glow': '별빛 생장',
        'Astral Impact': '별빛 충격',
        'Buster': '버스터',
        'Caloric Theory': '열소설',
        'Crush Helm': '성천폭격타',
        'Demi Parhelion': '버금 무리해',
        '(?<!(Apo|Peri))Dialogos': '디아로고스',
        'Divine Excoriation': '신벌',
        'Dynamic Atmosphere': '충격풍',
        'Ekpyrosis': '에크피로시스',
        'Engravement of Souls': '영혼의 각인',
        'Entropic Excess': '초열파',
        'Factor In': '인자 환원',
        'Gaiaochos': '대지의 주인',
        'Geocentrism': '천동설',
        'Glaukopis': '글라우코피스',
        'Ignorabimus': '이그노라비무스',
        'Implode': '자기 붕괴',
        'Missing Link': '고통의 사슬',
        'On the Soul': '영혼에 관하여',
        'Palladian Grasp': '팔라스의 손',
        'Palladian Ray': '팔라스의 광휘',
        'Palladion': '팔라디온',
        'Pangenesis': '범생설',
        'Panta Rhei': '만물유전',
        'Paradeigma': '파라데이그마',
        'Parthenos': '파르테노스',
        'Peridialogos': '근거리 디아로고스',
        'Polarized Ray': '극성 광선',
        'Pyre Pulse': '중열파',
        'Ray of Light': '빛살',
        'Sample': '남식',
        'Searing Radiance': '불사르는 빛',
        'Shadowsear': '불사르는 어둠',
        'Shock': '방전',
        'Summon Darkness': '어둠 소환',
        'Superchain Burst': '초사슬 폭발',
        'Superchain Coil': '초사슬 고리',
        'Superchain Theory I(?!I)': '초사슬 이론 I',
        'Superchain Theory IIA': '초사슬 이론 IIA',
        'Superchain Theory IIB': '초사슬 이론 IIB',
        'The Classical Concepts': '원소 이데아',
        'Theos\'s Cross': '테오스 십자 불길',
        'Theos\'s Holy': '테오스 홀리',
        'Theos\'s Saltire': '테오스 교차 불길',
        'Theos\'s Ultima': '테오스 알테마',
        'Trinity of Souls': '삼위일혼',
        '(?<! )Ultima(?! (B|R))': '알테마',
        'Ultima Blade': '알테마 블레이드',
        'Ultima Blow': '알테마 공격',
        'Ultima Ray': '알테마 광선',
        'Umbral Advance': '그림자 촉진',
        'Umbral Advent': '그림자 강림',
        'Umbral Glow': '그림자 생장',
        'Umbral Impact': '그림자 충격',
        'Unnatural Enchainment': '영혼의 사슬',
        'White Flame': '하얀 불꽃',
      },
    },
  ],
});
