import { ArrowOutput8, AutumnIndicator } from '../../../../../resources/autumns';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { Output, TriggerSet } from '../../../../../types/trigger';

// TODO: add phase dash calls?? (maybe this is overkill)

// TODO: crush helm tankbusters??? (+esuna calls for non-invulning tanks??)

// TODO: detect(?!) hex strat for caloric2 and tell people who to go to??

type Phase =
  | 'superchain1'
  | 'palladion'
  | 'superchain2a'
  | 'superchain2b'
  | 'gaiaochos'
  | 'gaiaochos1'
  | 'classical1'
  | 'caloric'
  | 'classical2'
  | 'gaiaochos2'
  | 'ekpyrosis'
  | 'pangenesis';

const centerX = 100;
const centerY = 100;

const distSqr = (a: NetMatches['AddedCombatant'], b: NetMatches['AddedCombatant']): number => {
  const dX = parseFloat(a.x) - parseFloat(b.x);
  const dY = parseFloat(a.y) - parseFloat(b.y);
  return dX * dX + dY * dY;
};

const wings = {
  // vfx/lockon/eff/m0829_cst19_9s_c0v.avfx
  topLeftFirst: '01A5', // 82E2 cast and damage
  // vfx/lockon/eff/m0829_cst20_9s_c0v.avfx
  topRightFirst: '01A6', // 82E1 cast and damage
  // vfx/lockon/eff/m0829_cst21_6s_c0v.avfx
  middleLeftSecond: '01A7', // 82E4 damage (top down), 82EA damage (bottom up)
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  middleRightSecond: '01A8', // 82E3 damage (top down), 82E9 damage (bottom up)
  // vfx/lockon/eff/m0829_cst23_9s_c0v.avfx
  bottomLeftFirst: '01A9', // 82E8 cast and damage
  // vfx/lockon/eff/m0829_cst24_9s_c0v.avfx
  bottomRightFirst: '01AA', // 82E7 cast and damage
  // vfx/lockon/eff/m0829_cst19_3s_c0v.avfx
  topLeftThird: '01AF', // 82EC damage
  // vfx/lockon/eff/m0829_cst20_3s_c0v.avfx
  topRightThird: '01B0', // 82EB damage
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  bottomLeftThird: '01B1', // 82E6 damage
  // vfx/lockon/eff/m0829_cst23_3s_c0v.avfx
  bottomRightThird: '01B2', // 82E5 damage
} as const;

type SuperchainMechanic = 'destination' | 'out' | 'in' | 'protean' | 'partners';
const superchainNpcNameId = '12377';
const superchainNpcBaseIdMap: Record<SuperchainMechanic, string> = {
  destination: '16176',
  out: '16177',
  in: '16178',
  protean: '16179',
  partners: '16180',
} as const;

const engravementLabelMapAsConst = {
  DF8: 'lightTilt',
  DF9: 'darkTilt',
  DFB: 'lightTower',
  DFC: 'darkTower',
  DFD: 'lightBeam',
  DFE: 'darkBeam',
  DFF: 'crossMarked',
  E00: 'xMarked',
} as const;
type EngravementLabel = typeof engravementLabelMapAsConst[keyof typeof engravementLabelMapAsConst];
const engravementLabelMap: { [effectId: string]: EngravementLabel } = engravementLabelMapAsConst;
type EngravementIdMap = Record<EngravementLabel, string>;
const engravementIdMap: EngravementIdMap = Object.fromEntries(
  Object.entries(engravementLabelMap).map(([k, v]) => [v, k]),
) as EngravementIdMap;

const engravementBeamIds: readonly string[] = [
  engravementIdMap.lightBeam,
  engravementIdMap.darkBeam,
];
const engravementTowerIds: readonly string[] = [
  engravementIdMap.lightTower,
  engravementIdMap.darkTower,
];
const engravementTiltIds: readonly string[] = [
  engravementIdMap.lightTilt,
  engravementIdMap.darkTilt,
];
const engravement3TheosSoulIds: readonly string[] = [
  engravementIdMap.crossMarked,
  engravementIdMap.xMarked,
];

type AnthroposTether = 'light' | 'dark';
const anthroposTetherMap: { [id: string]: AnthroposTether } = {
  '00E9': 'light', // needs stretching
  '00EA': 'dark', // needs stretching
  '00FA': 'light', // adequately stretched
  '00FB': 'dark', // adequately stretched
};

const tetherAbilityToTowerMap: { [id: string]: EngravementLabel } = {
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
} as const;

const limitCutMap: { [id: string]: number } = {
  [headmarkers.limitCut1]: 1,
  [headmarkers.limitCut2]: 2,
  [headmarkers.limitCut3]: 3,
  [headmarkers.limitCut4]: 4,
  [headmarkers.limitCut5]: 5,
  [headmarkers.limitCut6]: 6,
  [headmarkers.limitCut7]: 7,
  [headmarkers.limitCut8]: 8,
} as const;

const limitCutIds: readonly string[] = Object.keys(limitCutMap);
const wingIds: readonly string[] = Object.values(wings);
const superchainNpcBaseIds: readonly string[] = Object.values(superchainNpcBaseIdMap);

type FloorTile =
  | 'outsideNW'
  | 'outsideNE'
  | 'insideNW'
  | 'insideNE'
  | 'insideSW'
  | 'insideSE'
  | 'outsideSW'
  | 'outsideSE';

type ConceptColor = 'blue' | 'red' | 'yellow';
type ConceptDebuff = 'alpha' | 'beta';
type ConceptPair = 'circle' | 'triangle' | 'square' | 'cross';
type ConceptRow = 'north' | 'middle' | 'south';
type InterceptOutput = 'leanNorth' | 'leanEast' | 'leanSouth' | 'leanWest';

const conceptPairMap: { [id: string]: ConceptPair } = {
  [headmarkers.playstationCircle]: 'circle',
  [headmarkers.playstationTriangle]: 'triangle',
  [headmarkers.playstationSquare]: 'square',
  [headmarkers.playstationCross]: 'cross',
} as const;

const conceptDebuffIds: { [effectId: string]: ConceptDebuff } = {
  DE8: 'alpha',
  DE9: 'beta',
} as const;

const conceptDebuffToColor: Record<ConceptDebuff, ConceptColor> = {
  alpha: 'red',
  beta: 'yellow',
} as const;

const npcBaseIdToConceptColor: { [npcId: number]: ConceptColor } = {
  16183: 'red',
  16184: 'blue',
  16185: 'yellow',
} as const;

const conceptDebuffEffectIds: readonly string[] = Object.keys(conceptDebuffIds);
const conceptNpcBaseIds: readonly string[] = Object.keys(npcBaseIdToConceptColor);
const conceptPairIds: readonly string[] = Object.keys(conceptPairMap);

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

const conceptLocationMap: Record<ConceptRow, number[]> = {
  north: [0, 10, 20, 30],
  middle: [2, 12, 22, 32],
  south: [4, 14, 24, 34],
};

const getConceptLocation = (concept: NetMatches['AddedCombatant']): number => {
  const x = parseFloat(concept.x);
  const y = parseFloat(concept.y);

  let row: ConceptRow;
  if (y < 88)
    row = 'north';
  else
    row = y > 96 ? 'south' : 'middle';
  let col: number;
  if (x < 92)
    col = 0;
  else if (x > 108)
    col = 3;
  else
    col = x > 100 ? 2 : 1;
  return conceptLocationMap[row][col]!;
};

const getConceptMap = (startLoc: number): number[][] => {
  // takes a concept location and returns an array containing pairs of [adjacentLocation, interceptLocation]
  const conceptMap: number[][] = [];
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
    en: '흩어져요: ${mesg}',
  },
  safe10: {
    en: '1번🡼🡼', // α, ○
  },
  safe20: {
    en: '2번🡽🡽', // α, X
  },
  safe30: {
    en: '3번🡼🡼', // α, Δ
  },
  safe40: {
    en: '4번🡽🡽', // α, □
  },
  safe11: {
    en: '1번🡿🡿', // β, ○
  },
  safe21: {
    en: '2번🡾🡾', // β, X
  },
  safe31: {
    en: '3번🡿🡿', // β, Δ
  },
  safe41: {
    en: '4번🡾🡾', // β, □
  },
} as const;

const getPalladionRayEscape = (
  phase: Phase,
  ps: ConceptPair | undefined,
  ab: ConceptDebuff | undefined,
  output: Output,
) => {
  if (ps === undefined || ab === undefined)
    return;
  const safe1 = {
    circle: 1,
    cross: 2,
    triangle: 3,
    square: 4,
  } as const;
  const safe2 = {
    circle: 4,
    cross: 3,
    triangle: 2,
    square: 1,
  } as const;
  const mps = phase === 'classical1' ? safe1[ps] : safe2[ps];
  const mab = { alpha: 0, beta: 1 }[ab];
  return output[`safe${mps}${mab}`]!();
};

const ultimaRayDpsArrows: ArrowOutput8[] = ['arrowE', 'arrowSE', 'arrowS', 'arrowSW'];

const getUltimaRayArrow = (isDps: boolean, dirs: ArrowOutput8[]) => {
  const find = dirs.filter((x) => {
    if (isDps && ultimaRayDpsArrows.includes(x))
      return x;
    else if (!isDps && !ultimaRayDpsArrows.includes(x))
      return x;
  });
  if (find.length !== 1)
    return undefined;
  return find[0];
};

const pangenesisEffects = {
  stableSystem: 'E22',
  unstableFactor: 'E09',
  lightTilt: 'DF8',
  darkTilt: 'DF9',
} as const;

type CaloricMarker = 'fire' | 'wind';

const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (data.decOffset === undefined) {
    if (data.expectedFirstHeadmarker === undefined) {
      console.error('missing expected first headmarker');
      return 'OOPS';
    }
    data.decOffset = parseInt(matches.id, 16) - parseInt(data.expectedFirstHeadmarker, 16);
  }
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

export interface Data extends RaidbossData {
  // 전반
  prsTrinityInvul?: boolean;
  prsApoPeri?: number;
  // 후반
  prsUltima?: number;
  prsSeenPangenesis?: boolean;
  prsPangenesisCount: { [name: string]: number };
  prsPangenesisDuration: { [name: string]: number };
  prsPangenesisRole: { [name: string]: 'umbral' | 'astral' };
  prsPangenesisTilt?: number;
  //
  readonly triggerSetConfig: {
    engravement1DropTower: 'quadrant' | 'clockwise' | 'tower';
    classicalConceptsPairOrder: 'xsct' | 'cxts' | 'ctsx';
  };
  decOffset?: number;
  expectedFirstHeadmarker?: string;
  isDoorBoss: boolean;
  phase?: Phase;
  combatantData: PluginCombatantState[];
  paradeigmaCounter: number;
  glaukopisFirstHit?: string;
  glaukopisSecondHitSame: boolean;
  engravementCounter: number;
  engravement1BeamsPosMap: Map<string, string>;
  engravement1TetherIds: number[];
  engravement1TetherPlayers: { [name: string]: AnthroposTether };
  engravement1LightBeamsPos: string[];
  engravement1DarkBeamsPos: string[];
  engravement1Towers: string[];
  engravement2MyLabel?: EngravementLabel;
  engravement3TowerType?: 'lightTower' | 'darkTower';
  engravement3TowerPlayers: string[];
  engravement3TetherPlayers: { [name: string]: AnthroposTether };
  engravement3TethersSide?: 'east' | 'west';
  wingCollect: string[];
  wingCalls: ('swap' | 'stay')[];
  superchainCollect: NetMatches['AddedCombatant'][];
  superchain1FirstDest?: NetMatches['AddedCombatant'];
  limitCutNumber?: number;
  whiteFlameCounter: number;
  superchain2aFirstDir?: 'north' | 'south';
  superchain2aSecondDir?: 'north' | 'south';
  superchain2aSecondMech?: 'protean' | 'partners';
  superchain2bFirstDir?: 'north' | 'south';
  superchain2bSecondMech?: 'protean' | 'partners';
  superchain2bSecondDir?: 'east' | 'west';
  sampleTiles: NetMatches['Tether'][];
  darknessClones: NetMatches['StartsUsing'][];
  conceptPair?: ConceptPair;
  conceptDebuff?: ConceptDebuff;
  conceptData: { [location: number]: ConceptColor };
  classical2InitialColumn?: number;
  classical2InitialRow?: number;
  classical2Intercept?: InterceptOutput;
  gaiaochosCounter: number;
  palladionGrapsTarget?: string;
  classicalCounter: number;
  caloricCounter: number;
  caloric1First: string[];
  caloric1Buff: { [name: string]: CaloricMarker };
  caloric1Mine?: CaloricMarker;
  caloric2Fire?: string;
  caloric2PassCount: number;
  gaiaochosTetherCollect: string[];
  seenSecondTethers: boolean;
  geocentrism2OutputStr?: string;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheTwelfthCircleSavage',
  zoneId: ZoneId.AnabaseiosTheTwelfthCircleSavage,
  config: [
    {
      id: 'engravement1DropTower',
      name: {
        en: '파라데이그마2 타워 처리 방식',
        ja: 'パラデイグマ2の塔処理方法',
        cn: '第一次拉线踩塔方法',
        ko: 'Paradeigma 2 기둥 공략',
      },
      type: 'select',
      options: {
        en: {
          '게임8': 'quadrant',
          '줄 기준 시계 방향': 'clockwise',
          '그냥 알랴줌': 'tower',
        },
        ja: {
          'ぬけまるとGame8': 'quadrant',
          '腺から時計回り': 'clockwise',
          '方針なし': 'tower',
        },
        cn: {
          '垂直拉线 (Game8)': 'quadrant',
          '对角拉线': 'clockwise',
          '仅提示塔颜色': 'tower',
        },
        ko: {
          '반대편 + 가까운 사분면의 기둥 (Game8)': 'quadrant',
          '선 연결된 곳의 시계방향': 'clockwise',
          '공략 없음: 그냥 타워 색만 알림': 'tower',
        },
      },
      default: 'quadrant',
    },
    {
      id: 'classicalConceptsPairOrder',
      name: {
        en: '클래식 컨셉 : 페어 순서 (왼쪽->오른쪽)',
      },
      type: 'select',
      options: {
        en: {
          'X□○Δ': 'xsct',
          '○XΔ□': 'cxts',
          '○Δ□X': 'ctsx',
        },
      },
      default: 'cxts',
    },
  ],
  timelineFile: 'p12s.txt',
  initData: () => {
    return {
      prsPangenesisCount: {},
      prsPangenesisRole: {},
      prsPangenesisDuration: {},
      //
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
      whiteFlameCounter: 0,
      sampleTiles: [],
      darknessClones: [],
      conceptData: {},
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
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.prsTrinityInvul = true,
      outputStrings: {
        text: {
          en: '탱크 무적으로 받아요',
        },
      },
    },
    {
      id: 'P12S 알테마 블레이드',
      regex: /Ultima Blade/,
      beforeSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '엄청 아픈 전체 공격!',
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

        const phaseMap: { [id: string]: Phase } = {
          '82DA': 'superchain1',
          '82F5': 'palladion',
          '86FA': 'superchain2a',
          '86FB': 'superchain2b',
        } as const;
        data.phase = phaseMap[matches.id];
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
      delaySeconds: 0.5, // need a small delay to let position data catch up
      suppressSeconds: 10, // we only need y-pos of one add, and don't refire on the 2nd set of orbs
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
          return output.clones!({ dir: output.unknown!() });
        const y = data.combatantData[0]?.PosY;
        if (y === undefined)
          return output.clones!({ dir: output.unknown!() });
        let cloneSide;
        if (y > centerY)
          cloneSide = data.role === 'tank' ? 'south' : 'north';
        else
          cloneSide = data.role === 'tank' ? 'north' : 'south';
        return output.clones!({ dir: output[cloneSide]!() });
      },
      outputStrings: {
        clones: {
          en: '${dir}으로',
          ja: '${dir}',
          cn: '${dir}',
          ko: '분신 ${dir}',
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
      infoText: (_data, matches, output) => {
        const x = Math.round(parseFloat(matches.x));
        let safeLanes;
        if (x < 90)
          safeLanes = 'insideWestOutsideEast';
        else if (x > 110)
          safeLanes = 'insideEastOutsideWest';
        else
          safeLanes = x < 100 ? 'insideEastOutsideWest' : 'insideWestOutsideEast';
        return output[safeLanes]!();
      },
      outputStrings: {
        insideWestOutsideEast: {
          en: '서[안] / 동[밖]',
          ja: '西の内側 / 東の外側',
          cn: '内西 / 外东',
          ko: '서쪽 안 / 동쪽 바깥',
        },
        insideEastOutsideWest: {
          en: '동[안] / 서[밖]',
          ja: '西の外側 / 東の内側',
          cn: '内东 / 外西',
          ko: '동쪽 안 / 서쪽 바깥',
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
        if (data.phase !== 'superchain2a' || firstDir === undefined || secondDir === undefined)
          return isLeftAttack ? output.right!() : output.left!();

        if (data.options.AutumnStyle) {
          const dir = isLeftAttack ? output.right!() : output.left!();
          if (firstDir === 'north') {
            if (secondDir === 'north')
              return output.prsc2aNn!({ dir: dir });
            return output.prsc2aNs!({ dir: dir });
          }
          if (secondDir === 'north')
            return output.prsc2aSn!({ dir: dir });
          return output.prsc2aSs!({ dir: dir });
        }

        if (isLeftAttack) {
          if (firstDir === 'north') {
            if (secondDir === 'north')
              return output.superchain2aRightNorthNorth!();
            return output.superchain2aRightNorthSouth!();
          }
          if (secondDir === 'north')
            return output.superchain2aRightSouthNorth!();
          return output.superchain2aRightSouthSouth!();
        }

        if (firstDir === 'north') {
          if (secondDir === 'north')
            return output.superchain2aLeftNorthNorth!();
          return output.superchain2aLeftNorthSouth!();
        }
        if (secondDir === 'north')
          return output.superchain2aLeftSouthNorth!();
        return output.superchain2aLeftSouthSouth!();
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
          en: '북쪽 => 되돌아 와욧 [왼쪽]',
          de: 'Norden + Links von Ihr (dannach Norden)',
          ja: '北 + 北に戻る (左安置)',
          cn: '北 + Boss左侧 (稍后 回到北)',
          ko: '북쪽 + 보스 왼쪽 (그리고 다시 북쪽)',
        },
        superchain2aLeftNorthSouth: {
          en: '북쪽 => 계속 전진 [왼쪽]',
          de: 'Norden + Links von Ihr (dannach Süden)',
          ja: '北 + 南へ前進 (左安置)',
          cn: '北 + Boss左侧 (稍后 去南)',
          ko: '북쪽 + 보스 왼쪽 (그리고 남쪽으로)',
        },
        superchain2aLeftSouthNorth: {
          en: '남쪽 => 계속 전진 [왼쪽]',
          de: 'Süden + Links (dannach Norden)',
          ja: '南 + 北へ前進 (左安置)',
          cn: '南 + 左 (稍后 去北)',
          ko: '남쪽 + 왼쪽 (그리고 북쪽으로)',
        },
        superchain2aLeftSouthSouth: {
          en: '남쪽 => 되돌아 와욧 [왼쪽]',
          de: 'Süden + Links (dannach Süden)',
          ja: '南 + 南に戻る (左安置)',
          cn: '南 + 左 (稍后 回到南)',
          ko: '남쪽 + 왼쪽 (그리고 다시 남쪽)',
        },
        superchain2aRightNorthNorth: {
          en: '북쪽 => 되돌아 와욧 [오른쪽]',
          de: 'Norden + Rechts von Ihr (dannach Norden)',
          ja: '北 + 北に戻る (右安置)',
          cn: '北 + Boss右侧 (稍后 回到北)',
          ko: '북쪽 + 보스 오른쪽 (그리고 다시 북쪽)',
        },
        superchain2aRightNorthSouth: {
          en: '북쪽 => 계속 전진 [오른쪽]',
          de: 'Norden + Rechts von Ihr (dannach Süden)',
          ja: '北 + 南へ前進 (右安置)',
          cn: '北 + Boss右侧 (稍后 去南)',
          ko: '북쪽 + 보스 오른쪽 (그리고 남쪽으로)',
        },
        superchain2aRightSouthNorth: {
          en: '남쪽 => 계속 전진 [오른쪽]',
          de: 'Süden + Rechts (dannach Norden)',
          ja: '南 + 北へ前進 (右安置)',
          cn: '南 + 右 (稍后 去北)',
          ko: '남쪽 + 오른쪽 (그리고 북쪽으로)',
        },
        superchain2aRightSouthSouth: {
          en: '남쪽 => 되돌아 와욧 [오른쪽]',
          de: 'Süden + Rechts (dannach Süden)',
          ja: '南 + 南に戻る (右安置)',
          cn: '南 + 右 (稍后 回到南)',
          ko: '남쪽 + 오른쪽 (그리고 다시 남쪽)',
        },
        //
        prsc2aNn: {
          en: '북쪽 => 다시 북쪽 [${dir}]',
        },
        prsc2aNs: {
          en: '북쪽 => 전진해서 남쪽 [${dir}]',
        },
        prsc2aSs: {
          en: '남쪽 => 다시 남쪽 [${dir}]',
        },
        prsc2aSn: {
          en: '남쪽 => 전진해서 북쪽 [${dir}]',
        },
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

        const firstStr = isFirstLeft ? output.right!() : output.left!();

        const isFirstTop = first === wings.topLeftFirst || first === wings.topRightFirst;
        let secondCall: 'swap' | 'stay';
        let thirdCall: 'swap' | 'stay';
        if (isFirstTop) {
          secondCall = isFirstLeft === isSecondLeft ? 'stay' : 'swap';
          thirdCall = isSecondLeft === isThirdLeft ? 'stay' : 'swap';
        } else {
          secondCall = isFirstLeft === isSecondLeft ? 'swap' : 'stay';
          thirdCall = isSecondLeft === isThirdLeft ? 'swap' : 'stay';
        }

        data.wingCalls = [secondCall, thirdCall];

        // This is the second call only.
        if (third === undefined) {
          if (secondCall === 'stay')
            return output.secondWingCallStay!();
          return output.secondWingCallSwap!();
        }

        return output.allThreeWings!({
          first: firstStr,
          second: output[secondCall]!(),
          third: output[thirdCall]!(),
        });
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        swap: {
          en: '옆으로',
          de: 'Wechseln',
          fr: 'Swap',
          ja: '横へ',
          cn: '穿',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          ja: '止まる',
          cn: '停',
          ko: '가만히',
        },
        secondWingCallStay: {
          en: '[그대로]',
          de: '(bleib Stehen)',
          fr: '(restez)',
          ja: '(止まる)',
          cn: '(停)',
          ko: '(가만히)',
        },
        secondWingCallSwap: {
          en: '[옆으로 이동]',
          de: '(Wechseln)',
          fr: '(swap)',
          ja: '(横へ)',
          cn: '(穿)',
          ko: '(이동)',
        },
        allThreeWings: {
          en: '${first} => ${second} => ${third}',
          de: '${first} => ${second} => ${third}',
          fr: '${first} => ${second} => ${third}',
          cn: '${first} => ${second} => ${third}',
          ko: '${first} => ${second} => ${third}',
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
        if (
          data.phase !== 'superchain2a' || firstDir === undefined || secondDir === undefined ||
          secondMech === undefined
        ) {
          if (call === 'swap')
            return output.swap!();
          return output.stay!();
        }

        // Second wing call (when middle) during Superchain IIA.
        const isSecondWing = data.wingCalls.length === 1;
        const finalDir = secondDir === 'north' ? output.north!() : output.south!();
        if (isSecondWing) {
          const isReturnBack = firstDir === secondDir;
          if (data.options.AutumnStyle) {
            const move = call === 'swap' ? output.prSwap!() : '';
            if (isReturnBack)
              return output.prsc2aMb!({ move: move });
            return output.prsc2aMg!({ move: move });
          }
          if (call === 'swap') {
            if (isReturnBack)
              return output.superchain2aSwapMidBack!({ dir: finalDir });
            return output.superchain2aSwapMidGo!({ dir: finalDir });
          }
          if (isReturnBack)
            return output.superchain2aStayMidBack!({ dir: finalDir });
          return output.superchain2aStayMidGo!({ dir: finalDir });
        }

        // Third wing call (when at final destination).
        const isProtean = secondMech === 'protean';
        if (data.options.AutumnStyle) {
          const move = call === 'swap' ? output.prSwap!() : '';
          if (firstDir === secondDir) {
            if (isProtean)
              return output.prsc2aBpro!({ move: move });
            return output.prsc2aBtwo!({ move: move });
          }
          if (isProtean)
            return output.prsc2aGpro!({ move: move });
          return output.prsc2aGtwo!({ move: move });
        }
        if (call === 'swap') {
          if (isProtean)
            return output.superchain2aSwapProtean!({ dir: finalDir });
          return output.superchain2aSwapPartners!({ dir: finalDir });
        }
        if (isProtean)
          return output.superchain2aStayProtean!({ dir: finalDir });
        return output.superchain2aStayPartners!({ dir: finalDir });
      },
      outputStrings: {
        swap: {
          en: '옆으로 이동',
          de: 'Wechseln',
          fr: 'Swap',
          ja: '横へ',
          cn: '穿',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          ja: '止まる',
          cn: '停',
          ko: '가만히',
        },
        superchain2aSwapMidBack: {
          en: '한가운데 => ${dir} 되돌아 가욧 [옆으로]',
          de: 'Wechseln + Mitte => Zurück nach ${dir}',
          ja: '真ん中 => また${dir} (横へ)',
          cn: '穿 + 去中间 => 回到 ${dir}',
          ko: '이동 + 가운데 => 다시 ${dir}',
        },
        superchain2aSwapMidGo: {
          en: '한가운데 => 계속 전진 ${dir} [옆으로]',
          de: 'Wechseln + Mitte => Geh nach ${dir}',
          ja: '真ん中 => ${dir}前進 (横へ)',
          cn: '穿 + 去中间 => 去 ${dir}',
          ko: '이동 + 가운데 => ${dir}으로',
        },
        superchain2aStayMidBack: {
          en: '한가운데 => ${dir} 되돌아 가욧',
          de: 'Bleib stehen + Mitte => Zurück nach ${dir}',
          ja: '真ん中 => また${dir} (止まる)',
          cn: '停 + 去中间 => 回到 ${dir}',
          ko: '가만히 + 가운데 => 다시 ${dir}',
        },
        superchain2aStayMidGo: {
          en: '한가운데 => 계속 전진 ${dir}',
          de: 'Bleib stehen + Mitte => Geh nach ${dir}',
          ja: '真ん中 => ${dir}前進 (止まる)',
          cn: '停 + 去中间 => 去 ${dir}',
          ko: '가만히 + 가운데 => ${dir}으로',
        },
        superchain2aSwapProtean: {
          en: '${dir} + 프로틴 [옆으로]',
          de: 'Wechseln => Himmelsrichtungen + ${dir}',
          ja: '基本散会 + ${dir} (横へ)',
          cn: '穿 => 八方分散 + ${dir}',
          ko: '이동 => 8방향 산개 + ${dir}',
        },
        superchain2aStayProtean: {
          en: '${dir} + 프로틴',
          de: 'Bleib stehen => Himmelsrichtungen + ${dir}',
          ja: '基本散会 + ${dir} (止まる)',
          cn: '停 => 八方分散 + ${dir}',
          ko: '가만히 => 8방향 산개 + ${dir}',
        },
        superchain2aSwapPartners: {
          en: '${dir} + 페어 [옆으로]',
          de: 'Wechseln => Partner + ${dir}',
          ja: 'ペア + ${dir} (横へ)',
          cn: '穿 => 双人分摊 + ${dir}',
          ko: '이동 => 파트너 + ${dir}',
        },
        superchain2aStayPartners: {
          en: '${dir} + 페어',
          de: 'Bleib stehen => Partner + ${dir}',
          ja: 'ペア + ${dir} (止まる)',
          cn: '停 => 双人分摊 + ${dir}',
          ko: '가만히 => 파트너 + ${dir}',
        },
        north: Outputs.north,
        south: Outputs.south,
        //
        prSwap: {
          en: '[옆으로]',
        },
        prsc2aMb: {
          en: '한가운데로 => 되돌아 가욧 ${move}',
        },
        prsc2aMg: {
          en: '한가운데로 => 계속 전진 ${move}',
        },
        prsc2aBpro: {
          en: '되돌아 와서 + 프로틴 ${move}',
        },
        prsc2aBtwo: {
          en: '되돌아 와서 + 페어 ${move}',
        },
        prsc2aGpro: {
          en: '전진해서 + 프로틴 ${move}',
        },
        prsc2aGtwo: {
          en: '전진해서 + 페어 ${move}',
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
          return output.protean!();
        return output.partners!();
      },
      outputStrings: {
        protean: {
          en: '프로틴! 흩어져요',
          de: 'Himmelsrichtungen',
          ja: '基本散会',
          cn: '八方分散',
          ko: '8방향 산개',
        },
        partners: {
          en: '페어! 둘이 함께',
          de: 'Partner',
          ja: 'ペア',
          cn: '双人分摊',
          ko: '파트너',
        },
      },
    },
    {
      id: 'P12S 줄다리기 보라',
      type: 'Tether',
      netRegex: { id: ['00EA', '00FB'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟪줄 땡겨요',
        },
      },
    },
    {
      id: 'P12S 줄다리기 노랑',
      type: 'Tether',
      netRegex: { id: ['00E9', '00FA'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟨줄 땡겨요',
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
    /*
    {
      id: 'P12S Engravement 1 Beam',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(tetherAbilityToTowerMap), source: 'Anthropos' },
      condition: (data) => data.engravementCounter === 1,
      alertText: (data, matches, output) => {
        if (data.me === matches.target) {
          if (matches.id === '82F1')
            return output.lightBeam!();
          return output.darkBeam!();
        }
      },
      outputStrings: {
        lightBeam: {
          en: 'light beam',
          ja: 'ひかりビーム',
          cn: '引导光激光',
          ko: '빛 선',
        },
        darkBeam: {
          en: 'dark beam',
          ja: 'やみビーム',
          cn: '引导暗激光',
          ko: '어둠 선',
        },
      },
    },
    */
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

        for (const combatant of data.combatantData) {
          const x = combatant.PosX;
          const y = combatant.PosY;

          const combatantId = combatant.ID;
          if (combatantId === undefined)
            return;

          const tempColor = data.engravement1TetherPlayers[combatantId.toString(16).toUpperCase()];

          const color = tempColor === 'light' ? 'dark' : 'light';

          if (data.triggerSetConfig.engravement1DropTower === 'quadrant') {
            if (x < 80 && y < 100) { // WNW: x = 75 && y = 97
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 100 && y < 80) { // NNW: x = 97 && y = 75
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 100 && y < 80) { // NNE: x = 103 && y = 75
              data.engravement1BeamsPosMap.set('SE', color);
            } else if (x > 120 && y < 100) { // ENE: x = 125 && y = 97
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x > 120 && y > 100) { // ESE: x = 125 && y = 103
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 100 && y > 120) { // SSE: x = 103 && y = 125
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 100 && y > 120) { // SSW: x = 97 && y = 125
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x < 80 && y > 100) { // WSW: x = 75 && y = 103
              data.engravement1BeamsPosMap.set('SE', color);
            }
          } else if (data.triggerSetConfig.engravement1DropTower === 'clockwise') {
            // Tether stretches across and tower is clockwise; e.g. N add stretches S, and tower is SW.
            if (x < 80 && y < 100) { // WNW: x = 75 && y = 97
              data.engravement1BeamsPosMap.set('SE', color);
            } else if (x < 100 && y < 80) { // NNW: x = 97 && y = 75
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 100 && y < 80) { // NNE: x = 103 && y = 75
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 120 && y < 100) { // ENE: x = 125 && y = 97
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x > 120 && y > 100) { // ESE: x = 125 && y = 103
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x > 100 && y > 120) { // SSE: x = 103 && y = 125
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 100 && y > 120) { // SSW: x = 97 && y = 125
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 80 && y > 100) { // WSW: x = 75 && y = 103
              data.engravement1BeamsPosMap.set('SE', color);
            }
          }
        }

        if (data.me === matches.target) {
          // if Only notify tower color
          if (data.triggerSetConfig.engravement1DropTower === 'tower') {
            if (matches.effectId === engravementIdMap.lightTower)
              return output.lightTower!();
            return output.darkTower!();
          }
          data.engravement1DarkBeamsPos = [];
          data.engravement1LightBeamsPos = [];
          data.engravement1BeamsPosMap.forEach((value: string, key: string) => {
            if (data.options.AutumnStyle) {
              if (matches.effectId === engravementIdMap.lightTower && value === 'light') {
                if (key === 'NE' && data.role === 'dps')
                  data.engravement1LightBeamsPos.push(output.northeast!());
                else if (key === 'NW' && data.role !== 'dps')
                  data.engravement1LightBeamsPos.push(output.northwest!());
                else if (key === 'SE')
                  data.engravement1LightBeamsPos.push(output.southeast!());
                else if (key === 'SW')
                  data.engravement1LightBeamsPos.push(output.southwest!());
              } else if (matches.effectId === engravementIdMap.darkTower && value === 'dark') {
                if (key === 'NE' && data.role === 'dps')
                  data.engravement1DarkBeamsPos.push(output.northeast!());
                else if (key === 'NW' && data.role !== 'dps')
                  data.engravement1DarkBeamsPos.push(output.northwest!());
                else if (key === 'SE')
                  data.engravement1DarkBeamsPos.push(output.southeast!());
                else if (key === 'SW')
                  data.engravement1DarkBeamsPos.push(output.southwest!());
              }
              return;
            }
            if (matches.effectId === engravementIdMap.lightTower && value === 'light') {
              if (key === 'NE')
                data.engravement1LightBeamsPos.push(output.northeast!());
              else if (key === 'NW')
                data.engravement1LightBeamsPos.push(output.northwest!());
              else if (key === 'SE')
                data.engravement1LightBeamsPos.push(output.southeast!());
              else if (key === 'SW')
                data.engravement1LightBeamsPos.push(output.southwest!());
            } else if (matches.effectId === engravementIdMap.darkTower && value === 'dark') {
              if (key === 'NE')
                data.engravement1DarkBeamsPos.push(output.northeast!());
              else if (key === 'NW')
                data.engravement1DarkBeamsPos.push(output.northwest!());
              else if (key === 'SE')
                data.engravement1DarkBeamsPos.push(output.southeast!());
              else if (key === 'SW')
                data.engravement1DarkBeamsPos.push(output.southwest!());
            }
          });

          if (data.options.AutumnStyle) {
            if (matches.effectId === engravementIdMap.lightTower)
              return output.simpleLightTower!({ pos: data.engravement1LightBeamsPos.join(' ') });
            return output.simpleDarkTower!({ pos: data.engravement1DarkBeamsPos.join(' ') });
          }

          // if light tower
          if (matches.effectId === engravementIdMap.lightTower) {
            return output.lightTowerSide!({
              pos1: data.engravement1LightBeamsPos[0],
              pos2: data.engravement1LightBeamsPos[1],
            });
          }

          return output.darkTowerSide!({
            pos1: data.engravement1DarkBeamsPos[0],
            pos2: data.engravement1DarkBeamsPos[1],
          });
        }
      },
      outputStrings: {
        lightTowerSide: {
          en: '🟡설치 ${pos1}/${pos2}',
          ja: 'ひかり設置 ${pos1}/${pos2}',
          cn: '去 ${pos1}/${pos2} 放光塔',
          ko: '빛 기둥 ${pos1}/${pos2}에 놓기',
        },
        darkTowerSide: {
          en: '🟣설치 ${pos1}/${pos2}',
          ja: 'やみ設置 ${pos1}/${pos2}',
          cn: '去 ${pos1}/${pos2} 放暗塔',
          ko: '어둠 기둥 ${pos1}/${pos2}에 놓기',
        },
        lightTower: {
          en: '🟡설치',
          ja: 'ひかり設置',
          cn: '放光塔',
          ko: '빛 기둥 놓기',
        },
        darkTower: {
          en: '🟣설치',
          ja: 'やみ設置',
          cn: '放暗塔',
          ko: '어둠 기둥 놓기',
        },
        northeast: Outputs.arrowNE,
        northwest: Outputs.arrowNW,
        southeast: Outputs.arrowSE,
        southwest: Outputs.arrowSW,
        simpleLightTower: {
          en: '🟡설치 ${pos}',
          ja: 'ひかり設置 ${pos}',
        },
        simpleDarkTower: {
          en: '🟣설치 ${pos}',
          ja: 'やみ設置 ${pos}',
        },
      },
    },
    {
      id: 'P12S Engravement 1 Tower Soak',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTiltIds },
      condition: (data, matches) => data.engravementCounter === 1 && data.me === matches.target,
      suppressSeconds: 5, // avoid second (incorrect) alert when debuff switches from soaking tower
      alertText: (data, matches, output) => {
        if (!data.engravement1Towers.includes(data.me)) {
          // Did not drop a tower, so needs to soak one.
          if (matches.effectId === engravementIdMap.lightTilt)
            return output.lightTilt!();
          return output.darkTilt!();
        }
      },
      outputStrings: {
        lightTilt: {
          en: '🟣밟아요',
          ja: 'やみ塔踏み',
          cn: '踩暗塔',
          ko: '어둠 기둥 들어가기',
        },
        darkTilt: {
          en: '🟡밟아요',
          ja: 'ひかり塔踏み',
          cn: '踩光塔',
          ko: '빛 기둥 들어가기',
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
    /*
    {
      id: 'P12S Engravement 2 Heavensflame Soul Early',
      type: 'GainsEffect',
      netRegex: { effectId: 'DFA' },
      condition: (data, matches) => data.engravementCounter === 2 && data.me === matches.target,
      delaySeconds: 6.5, // display a reminder as the player is moving into the second orb stack groups
      infoText: (_data, _matches, output) => output.spreadLater!(),
      outputStrings: {
        spreadLater: {
          en: '(spread later)',
          cn: '（稍后分散）',
          ko: '(나중에 산개)',
        },
      },
    },
    */
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
        return output[engraveLabel]!();
      },
      outputStrings: {
        lightBeam: {
          en: '🟣밟아요🡺🡺',
          ja: 'やみ塔踏み (右)',
          cn: '踩暗塔',
          ko: '어둠 기둥 들어가기',
        },
        darkBeam: {
          en: '🡸🡸🟡밟아요',
          ja: 'ひかり塔踏み (左)',
          cn: '踩光塔',
          ko: '빛 기둥 들어가기',
        },
        lightTower: {
          en: '🡸🡸🟡설치',
          ja: 'ひかり塔設置 (左)',
          cn: '放光塔',
          ko: '빛 기둥 놓기',
        },
        darkTower: {
          en: '🟣설치🡺🡺',
          ja: 'やみ塔設置 (右)',
          cn: '放暗塔',
          ko: '어둠 기둥 놓기',
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
        return output[engraveLabel]!();
      },
      outputStrings: {
        crossMarked: {
          en: '➕ 북쪽으로!',
          ja: '自分に\'+\'',
          cn: '十 点名',
          ko: '\'+\' 장판 대상자',
        },
        xMarked: {
          en: '❌ 남쪽으로!',
          ja: '自分に\'x\'',
          cn: '\'x\' 点名',
          ko: '\'x\' 장판 대상자',
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
        return output[engraveLabel]!();
      },
      outputStrings: {
        crossMarked: {
          en: '➕ 모서리에 설치',
          ja: '隅へ\'+\'設置',
          cn: '放置 十 点名',
          ko: '\'+\' 장판 놓기',
        },
        xMarked: {
          en: '❌ 가운데 설치',
          ja: '中央へ\'x\'設置',
          cn: '放置 \'x\' 点名',
          ko: '\'x\' 장판 놓기',
        },
      },
    },
    {
      id: 'P12S Engravement 3 Theos Bait Adds',
      type: 'GainsEffect',
      netRegex: { effectId: engravement3TheosSoulIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.baitCleave!(),
      outputStrings: {
        baitCleave: {
          en: '천사 레이저 유도',
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
        let towerColor = output.unknown!();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light!()
            : output.dark!();
        const partner =
          data.party.aJobName(data.engravement3TowerPlayers.find((name) => name !== data.me)) ??
            output.unknown!();
        return output.towerOnYou!({ color: towerColor, partner: partner });
      },
      outputStrings: {
        towerOnYou: {
          en: '${color}타워 (${partner})',
          ja: '自分に${color}塔 (${partner})',
          cn: '${color} 塔点名 (+ ${partner})',
          ko: '${color} 기둥 대상자 (+ ${partner})',
        },
        light: {
          en: '🟡',
          ja: 'ひかり',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
          ja: 'やみ',
          cn: '暗',
          ko: '어둠',
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
        let towerColor = output.unknown!();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light!()
            : output.dark!();
        return output.towersLater!({ color: towerColor });
      },
      outputStrings: {
        towersLater: {
          en: '타워 들어갈거예요: ${color}',
          ja: '塔: ${color}',
          cn: '稍后 ${color} 塔',
          ko: '${color} 기둥 (나중에)',
        },
        light: {
          en: '🟡',
          ja: 'ひかり',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
          ja: 'やみ',
          cn: '暗',
          ko: '어둠',
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
        let towerColor = output.unknown!();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light!()
            : output.dark!();

        if (data.engravement3TethersSide === undefined)
          return output.dropTower!({ color: towerColor, spot: output.unknown!() });

        const mySide = parseFloat(matches.x) > 100 ? 'east' : 'west';
        const towerSpot = mySide === data.engravement3TethersSide
          ? output.corner!()
          : output.platform!();
        return output.dropTower!({ color: towerColor, spot: towerSpot });
      },
      outputStrings: {
        dropTower: {
          en: '${spot} ${color}설치',
          ja: '${spot}に${color}塔設置',
          cn: '在 ${spot} 放 ${color} 塔',
          ko: '${color} 기둥 놓기 (${spot})',
        },
        light: {
          en: '🟡',
          ja: 'ひかり',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
          ja: 'やみ',
          cn: '暗',
          ko: '어둠',
        },
        platform: {
          en: '판때기 한가운데',
          ja: 'マス内部',
          cn: '平台内',
          ko: '플랫폼 내부',
        },
        corner: {
          en: '건너편에 닿게 모서리에',
          ja: '真ん中のコーナー',
          cn: '平台交叉处',
          ko: '플랫폼 교차지점',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S Engravement 3 Soak Tower/Bait Adds',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTiltIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      suppressSeconds: 15, // avoid second (incorrect) alert when debuff switches from soaking tower
      alertText: (data, matches, output) => {
        // lightTower/darkTower support players receive lightTilt/darkTilt once dropping their tower
        // so exclude them from receiving this alert
        if (data.engravement3TowerPlayers.includes(data.me))
          return;

        const soakMap = {
          lightTower: 'darkTilt',
          darkTower: 'lightTilt',
        } as const;
        const myEffect = engravementLabelMap[matches.effectId];
        if (myEffect === undefined || data.engravement3TowerType === undefined)
          return;
        const soakTiltType = soakMap[data.engravement3TowerType];
        const towerColor = data.engravement3TowerType === 'lightTower'
          ? output.light!()
          : output.dark!();
        if (myEffect === soakTiltType)
          return output.soakTower!({ color: towerColor });
        return output.baitCleaves!();
      },
      outputStrings: {
        soakTower: {
          en: '${color}밟아요',
          ja: '${color}塔踏み',
          cn: '踩 ${color} 塔',
          ko: '${color} 기둥 들어가기',
        },
        baitCleaves: {
          en: '천사 레이저 유도',
          ja: 'レーザー誘導',
          cn: '引导射线',
          ko: '레이저 유도',
        },
        light: {
          en: '🟡',
          ja: 'ひかり',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
          ja: 'やみ',
          cn: '暗',
          ko: '어둠',
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
          return { alertText: output.cleaveOnYou!() };
        if (data.role === 'tank')
          return { alertText: output.cleaveSwap!() };
        if (data.role === 'healer' || data.job === 'BLU')
          return { alertText: output.tankBusterCleaves!() };
        return { infoText: output.avoidTankCleaves!() };
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
          return output.tankSwap!();
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
            return output.tankSolo!();
          return output.tanksInPartyOut!();
        }
        return output.partyOutTanksIn!();
      },
      outputStrings: {
        partyOutTanksIn: {
          en: '바깥으로 (탱크가 안쪽)',
          de: 'Gruppe Raus (Tanks Rein)',
          fr: 'Équipe à l\'extérieur (Tanks à l\'intérieur)',
          ja: 'ボスから離れる (タンクが内側)',
          cn: '小队出 (T进)',
          ko: '본대 밖 (탱커 안)',
        },
        tanksInPartyOut: {
          en: '안쪽으로 (파티가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Tanks à l\'intérieur (Équipe à l\'extérieur',
          ja: 'ボスに足元へ (パーティーは離れる)',
          cn: 'T进 (小队出)',
          ko: '탱커 안 (본대 밖)',
        },
        tankSolo: {
          en: '❱❱안쪽❰❰ 혼자 무적!',
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
            return output.tankSolo!();
          return output.tanksInPartyOut!();
        }
        return output.partyInTanksOut!();
      },
      outputStrings: {
        partyInTanksOut: {
          en: '안쪽으로 (탱크가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Équipe à l\'intérieur (Tanks à l\'extérieur)',
          ja: 'ボスの足元へ (タンクは離れる)',
          cn: '小队进 (T出)',
          ko: '본대 안 (탱커 밖)',
        },
        tanksInPartyOut: {
          en: '바깥으로 (파티가 안쪽)',
          de: 'Tanks Raus (Gruppe Rein)',
          fr: 'Tanks à l\'extérieur (Équipe à l\'intérieur',
          ja: 'ボスからはなれる (パーティーが内側)',
          cn: 'T出 (小队进)',
          ko: '탱커 밖 (본대 안)',
        },
        tankSolo: {
          en: '❰❰바깥❱❱ 혼자 무적!',
        },
      },
    },
    {
      id: 'P12S Limit Cut',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      durationSeconds: 20,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (!limitCutIds.includes(id))
          return;
        const num = limitCutMap[id];
        if (num === undefined)
          return;
        data.limitCutNumber = num;
        if (data.options.AutumnStyle)
          return;
        return output.text!({ num: num });
      },
      outputStrings: {
        text: {
          en: '${num}번',
          de: '${num}',
          fr: '${num}',
          ja: '${num}番目',
          cn: '${num}',
          ko: '${num}',
        },
      },
    },
    {
      id: 'P12S Palladion White Flame Initial',
      type: 'StartsUsing',
      // 82F5 = Palladion cast
      netRegex: { id: '82F5', source: 'Athena', capture: false },
      // Don't collide with number callout.
      delaySeconds: 2,
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: '레이저 유도! 안쪽으로!',
            de: 'Laser Ködern',
            fr: 'Bait le laser',
            ja: 'レーザー誘導',
            cn: '引导激光',
            ko: '레이저 유도',
          },
          firstWhiteFlame: {
            en: '(5, 7 레이저 유도)',
            de: '(5 und 7 ködern)',
            fr: '(5 et 7 bait)',
            ja: '(5と7誘導)',
            cn: '(5 和 7 引导)',
            ko: '(5, 7 레이저)',
          },
        };
        const infoText = output.firstWhiteFlame!();
        if (data.limitCutNumber === 5 || data.limitCutNumber === 7)
          return { alertText: output.baitLaser!(), infoText: infoText };
        return { infoText: infoText };
      },
    },
    {
      id: 'P12S Palladion White Flame Followup',
      type: 'Ability',
      netRegex: { id: '82EF', source: 'Anthropos', capture: false },
      condition: (data) => data.phase === 'palladion',
      durationSeconds: 3,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: '레이저 유도! 안쪽으로!',
            de: 'Laser Ködern',
            fr: 'Bait le laser',
            ja: 'レーザー誘導',
            cn: '引导激光',
            ko: '레이저 유도',
          },
          secondWhiteFlame: {
            en: '(6, 8 레이저 유도)',
            de: '(6 und 8 ködern)',
            fr: '(6 et 8 bait)',
            ja: '(6と8誘導)',
            cn: '(6 和 8 引导)',
            ko: '(6, 8 레이저)',
          },
          thirdWhiteFlame: {
            en: '(1, 3 레이저 유도)',
            de: '(1 und 3 ködern)',
            fr: '(1 et 3 bait)',
            ja: '(1と3誘導)',
            cn: '(1 和 3 引导)',
            ko: '(1, 3 레이저)',
          },
          fourthWhiteFlame: {
            en: '(2, 4 레이저 유도)',
            de: '(2 und 6 ködern)',
            fr: '(2 et 4 bait)',
            ja: '(2と4誘導)',
            cn: '(2 和 4 引导)',
            ko: '(2, 4 레이저)',
          },
        };

        data.whiteFlameCounter++;

        const baitLaser = output.baitLaser!();

        if (data.whiteFlameCounter === 1) {
          const infoText = output.secondWhiteFlame!();
          if (data.limitCutNumber === 6 || data.limitCutNumber === 8)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
        if (data.whiteFlameCounter === 2) {
          const infoText = output.thirdWhiteFlame!();
          if (data.limitCutNumber === 1 || data.limitCutNumber === 3)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
        if (data.whiteFlameCounter === 3) {
          const infoText = output.fourthWhiteFlame!();
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
        const dir = output[dirStr]!();
        data.superchain1FirstDest = destMatches;

        if (inOut === superchainNpcBaseIdMap.in) {
          if (proteanPartner === superchainNpcBaseIdMap.protean)
            return output.inAndProtean!({ dir: dir });
          return output.inAndPartners!({ dir: dir });
        }

        if (proteanPartner === superchainNpcBaseIdMap.protean)
          return output.outAndProtean!({ dir: dir });
        return output.outAndPartners!({ dir: dir });
      },
      outputStrings: {
        inAndProtean: {
          en: '안으로 + 프로틴 [${dir}]',
          de: 'Rein + Himmelsrichtungen (${dir})',
          fr: 'Intérieur + Position (${dir})',
          ja: '内側へ + 基本散会 (${dir})',
          cn: '靠近 + 八方分散 (${dir})',
          ko: '안 + 8방향 산개 (${dir})',
        },
        inAndPartners: {
          en: '안으로 + 페어 [${dir}]',
          de: 'Rein + Partner (${dir})',
          fr: 'Intérieur + Partenaire (${dir})',
          ja: '内側へ + ペア (${dir})',
          cn: '靠近 + 双人分摊 (${dir})',
          ko: '안 + 파트너 (${dir})',
        },
        outAndProtean: {
          en: '밖에서 + 프로틴 [${dir}]',
          de: 'Raus + Himmelsrichtungen (${dir})',
          fr: 'Extérieur + Position (${dir})',
          ja: '外側へ + 基本散会 (${dir})',
          cn: '远离 + 八方分散 (${dir})',
          ko: '밖 + 8방향 산개 (${dir})',
        },
        outAndPartners: {
          en: '밖에서 + 페어 [${dir}]',
          de: 'Raus + Partner (${dir})',
          fr: 'Extérieur + Partenaire (${dir})',
          ja: '外側へ + ペア (${dir})',
          cn: '远离 + 双人分摊 (${dir})',
          ko: '밖 + 8방향 산개 (${dir})',
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
      durationSeconds: 8, // keep active until right before 2nd orb resolves
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

        const engrave = output[data.engravement2MyLabel ?? 'unknown']!();

        const rotation = (thisDir - prevDir + 8) % 8;
        if (rotation === 2)
          return output.leftClockwise!({ engrave: engrave });
        if (rotation === 6)
          return output.rightCounterclockwise!({ engrave: engrave });
      },
      outputStrings: {
        // This is left and right facing the boss.
        leftClockwise: {
          en: '❰❰시계 방향 [${engrave}]',
          de: 'Links (im Uhrzeigersinn) => ${engrave}',
          fr: 'Gauche (horaire) => ${engrave}',
          ja: '時計回り => ${engrave}',
          cn: '左左左 (顺时针) => ${engrave}',
          ko: '왼쪽 (시계방향) => ${engrave}',
        },
        rightCounterclockwise: {
          en: '반시계 방향❱❱ [${engrave}]',
          de: 'Rechts (gegen Uhrzeigersinn) => ${engrave}',
          fr: 'Droite (Anti-horaire) => ${engrave}',
          ja: '反時計回り => ${engrave}',
          cn: '右右右 (逆时针) => ${engrave}',
          ko: '오른쪽 (반시계방향) => ${engrave}',
        },
        lightBeam: {
          en: '밟아요🡺🡺',
          ja: '右塔踏み',
          cn: '光激光（与暗分摊）',
          ko: '빛 레이저 (어둠 쉐어)',
        },
        darkBeam: {
          en: '🡸🡸밟아요',
          ja: '左塔踏み',
          cn: '暗激光（与光分摊）',
          ko: '어둠 레이저 (빛 쉐어),',
        },
        lightTower: {
          en: '🡸🡸🟡설치',
          ja: '左塔設置',
          cn: '光塔点名',
          ko: '빛 기둥',
        },
        darkTower: {
          en: '🟣설치🡺🡺',
          ja: '右塔設置',
          cn: '暗塔点名',
          ko: '어둠 기둥',
        },
        lightTilt: {
          en: '🡸🡸흩어져요',
          ja: '左散会',
          cn: '光分摊组',
          ko: '빛 쉐어',
        },
        darkTilt: {
          en: '흩어져요🡺🡺',
          ja: '右散会',
          cn: '暗分摊组',
          ko: '어둠 쉐어',
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
        const moveOrder = donutDistSqr > sphereDistSqr ? output.inThenOut!() : output.outThenIn!();
        const engrave = output[data.engravement2MyLabel ?? 'unknown']!();
        return output.combined!({ move: moveOrder, engrave: engrave });
      },
      outputStrings: {
        combined: {
          en: '${move} [${engrave}]',
          ja: '${move} => ${engrave}',
          ko: '${move} => ${engrave}',
        },
        inThenOut: {
          en: '안에 있다 => 밖으로',
        },
        outThenIn: {
          en: '밖에 있다 => 안으로',
        },
        lightBeam: {
          en: '🟣밟아요🡺🡺',
          ja: '右塔踏み',
          cn: '踩暗塔',
          ko: '어둠 기둥 들어가기',
        },
        darkBeam: {
          en: '🡸🡸🟡밟아요',
          ja: '左塔踏み',
          cn: '踩光塔',
          ko: '빛 기둥 들어가기',
        },
        lightTower: {
          en: '🡸🡸🟡설치',
          ja: '左塔設置',
          cn: '放光塔',
          ko: '빛 기둥 놓기',
        },
        darkTower: {
          en: '🟣설치🡺🡺',
          ja: '右塔設置',
          cn: '放暗塔',
          ko: '어둠 기둥 놓기',
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

        let secondMech: NetMatches['AddedCombatant'] | undefined;
        let firstDir: 'north' | 'south' | undefined;
        let secondDir: 'north' | 'south' | undefined;

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
        let dir;
        if (parseFloat(donut.y) > 100) {
          data.superchain2bFirstDir = 'south';
          dir = output.south!();
        } else {
          data.superchain2bFirstDir = 'north';
          dir = output.north!();
        }
        return output.safe!({ dir: dir });
      },
      outputStrings: {
        safe: {
          en: '${dir}으로',
          ja: '${dir}',
        },
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
      durationSeconds: 6, // keep active until just before Ray of Light 2
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
          mechanicStr = output.protean!();
          data.superchain2bSecondMech = 'protean';
        } else {
          mechanicStr = output.partners!();
          data.superchain2bSecondMech = 'partners';
        }

        // For the second mechanic, the two destination orbs spawn at [92,100] and [108,100]
        // One is tethered to a sphere (out) orb, and the other to a partner or protean orb.
        // The partner/protean orb is always on the same E/W half as the destination orb it is tethered to.
        // We therefore only need to know whether the partnerProteam orb is E or W to identify the safe spot.
        const x = parseFloat(partnerProtean.x);
        data.superchain2bSecondDir = x > 100 ? 'east' : 'west';

        let dirStr: 'eastFromSouth' | 'eastFromNorth' | 'westFromSouth' | 'westFromNorth';
        if (x > 100) {
          data.superchain2bSecondDir = 'east';
          dirStr = data.superchain2bFirstDir === 'south' ? 'eastFromSouth' : 'eastFromNorth';
        } else {
          data.superchain2bSecondDir = 'west';
          dirStr = data.superchain2bFirstDir === 'south' ? 'westFromSouth' : 'westFromNorth';
        }
        return output.combined!({ dir: output[dirStr]!(), mechanic: mechanicStr });
      },
      outputStrings: {
        combined: {
          en: '${mechanic} [${dir}]',
        },
        east: Outputs.east,
        west: Outputs.west,
        eastFromSouth: {
          en: '동🡺🡺',
        },
        eastFromNorth: {
          en: '🡸🡸동',
        },
        westFromSouth: {
          en: '🡸🡸서',
        },
        westFromNorth: {
          en: '서🡺🡺',
        },
        protean: {
          en: '프로틴',
        },
        partners: {
          en: '페어',
        },
      },
    },
    {
      id: 'P12S Superchain Theory IIb Second Mechanic + Ray of Light 2',
      type: 'StartsUsing',
      netRegex: { id: '82EE', source: 'Anthropos' }, // Ray of Light cleaves from North adds
      condition: (data) => data.paradeigmaCounter === 4,
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        if (data.superchain2bSecondMech === undefined)
          return output.avoid!();
        const mechanicStr = output[data.superchain2bSecondMech]!();

        const x = Math.round(parseFloat(matches.x));
        if (data.superchain2bSecondDir === undefined || x === undefined)
          return output.combined!({ mechanic: mechanicStr, dir: output.avoid!() });

        let safeLane = output.avoid!(); // default if unable to determine safe lane

        // In Ray 2 (SC IIB), the adds spawn with PosX of [87, 103] or [97, 113].
        // Because of mech timing, there is only realistically time to move either inside or outside
        // (relative to the orb) to avoid the cleave.
        if (x < 92)
          safeLane = data.superchain2bSecondDir === 'east' ? output.outside!() : output.inside!();
        else if (x > 108)
          safeLane = data.superchain2bSecondDir === 'east' ? output.inside!() : output.outside!();
        else if (x > 100)
          safeLane = data.superchain2bSecondDir === 'east' ? output.outside!() : output.inside!();
        else
          safeLane = data.superchain2bSecondDir === 'east' ? output.inside!() : output.outside!();

        return output.combined!({ mechanic: mechanicStr, dir: safeLane });
      },
      outputStrings: {
        combined: {
          en: '${mechanic} => ${dir}',
        },
        protean: {
          en: '프로틴',
        },
        partners: {
          en: '페어',
        },
        inside: {
          en: '안으로',
        },
        outside: {
          en: '바깥으로',
        },
        avoid: {
          en: '한 줄 장판 피해요',
          ja: '直線回避',
          cn: '远离场边激光',
          ko: '직선 장판 피하기',
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
          ? output.protean!()
          : output.partners!();
        const dirStr = parseFloat(partnerProtean.y) > 100 ? output.north!() : output.south!();
        return output.combined!({ dir: dirStr, mechanic: mechanicStr });
      },
      outputStrings: {
        combined: {
          en: '밖에서 + ${mechanic} [${dir}]',
        },
        north: Outputs.north,
        south: Outputs.south,
        protean: {
          en: '프로틴',
        },
        partners: {
          en: '페어',
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
      netRegex: { id: '00E8', target: 'Athena', capture: false }, // tile combatants are the source
      condition: (data) => data.phase === 'superchain2b' && data.sampleTiles.length === 7,
      delaySeconds: 1, // short delay to avoid collision
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
          return output.default!();
        // platform 'combatants' can be at x:[90,110], y:[85,95,105,115]
        let safeTiles: FloorTile[] = [
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
            let unsafeTile: FloorTile;
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
          return output.default!();
        const safeTile = safeTiles[0];
        if (safeTile === undefined)
          return output.default!();
        return output[safeTile]!();
      },
      outputStrings: {
        outsideNW: {
          en: '북서 바깥 판때기',
        },
        outsideNE: {
          en: '북동 바깥 판때기',
        },
        insideNW: {
          en: '북서 안 판때기',
        },
        insideNE: {
          en: '북동 안 판때기',
        },
        insideSW: {
          en: '남서 안 판때기',
        },
        insideSE: {
          en: '남동 안 판때기',
        },
        outsideSW: {
          en: '남서 바깥 판때기',
        },
        outsideSE: {
          en: '남동 바깥 판때기',
        },
        default: {
          en: '안전한 판때기 찾아요',
        },
      },
    },
    {
      id: 'P12S 테오의 알테마',
      type: 'StartsUsing',
      netRegex: { id: '82FA', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '엄청 아픈 전체 공격! 이러다 우리 다 주거!',
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
          return output.text!();
        data.geocentrism2OutputStr = output.outstr!();
        return;
      },
      outputStrings: {
        text: {
          en: '전체 공격 + 흩어져요(‖)',
          de: 'Vertikal',
          fr: 'Vertical',
          ja: '横',
          cn: '垂直',
          ko: '세로',
        },
        outstr: {
          en: '‖',
          de: 'Vertikal',
          fr: 'Vertical',
          ja: '横',
          cn: '垂直',
          ko: '세로',
        },
      },
    },
    {
      id: 'P12S Geocentrism Circle',
      type: 'StartsUsing',
      netRegex: { id: '832A', source: 'Pallas Athena', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'gaiaochos1')
          return output.text!();
        data.geocentrism2OutputStr = output.outstr!();
        return;
      },
      outputStrings: {
        text: {
          en: '전체 공격 + 흩어져요(◎)',
          de: 'Innerer Kreis',
          fr: 'Cercle intérieur',
          ja: 'ドーナツ',
          cn: '月环',
          ko: '가운데 원',
        },
        outstr: {
          en: '◎',
          de: 'Innerer Kreis',
          fr: 'Cercle intérieur',
          ja: 'ドーナツ',
          cn: '月环',
          ko: '가운데 원',
        },
      },
    },
    {
      id: 'P12S Geocentrism Horizontal',
      type: 'StartsUsing',
      netRegex: { id: '832B', source: 'Pallas Athena', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'gaiaochos1')
          return output.text!();
        data.geocentrism2OutputStr = output.outstr!();
        return;
      },
      outputStrings: {
        text: {
          en: '전체 공격 + 흩어져요(〓)',
          de: 'Horizontal',
          fr: 'Horizontal',
          ja: '縦',
          cn: '水平',
          ko: '가로',
        },
        outstr: {
          en: '〓',
          de: 'Horizontal',
          fr: 'Horizontal',
          ja: '縦',
          cn: '水平',
          ko: '가로',
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
          // for Classical Concepts, 6.7 cast time + 1.5 for debuff/headmarker data (some variability)
          return 8.2;
        return 0; // for Panta Rhei, fire immediately once cast starts
      },
      durationSeconds: (data, matches) => {
        if (data.phase === 'classical1')
          return 11; // keep active until shapes tether
        if (matches.id === '8331')
          return 16; // for classical2 initial, display initially to allow player to find (stand in) initial position
        return 9.7; // for Panta Rhei, display until shape inversion completes
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          classic1: {
            en: '${column} ${row} + ${intercept} [${marker} ${tether}]',
            ja: '${column} ${row} + ${intercept} [${marker} ${tether}]',
          },
          classic2initial: {
            en: '${column} ${row} [${marker} ${tether}]',
            ja: '${column} ${row} [${marker} ${tether}]',
          },
          classic2actual: {
            en: '반전: ${column} ${row} + ${intercept}',
            ja: '反転: ${column} ${row} + ${intercept}',
          },
          outsideWest: {
            en: '1번',
            ja: '1列',
          },
          insideWest: {
            en: '2번',
            ja: '2列',
          },
          insideEast: {
            en: '3번',
            ja: '3列',
          },
          outsideEast: {
            en: '4번',
            ja: '4列',
          },
          northRow: {
            en: '위로',
            ja: '上',
          },
          middleRow: {
            en: '가운데',
            ja: '中',
          },
          southRow: {
            en: '아래로',
            ja: '下',
          },
          leanNorth: {
            en: '🡹🡹',
            ja: '🡹🡹',
          },
          leanEast: {
            en: '🡺🡺',
            ja: '🡺🡺',
          },
          leanSouth: {
            en: '🡻🡻',
            ja: '🡻🡻',
          },
          leanWest: {
            en: '🡸🡸',
            ja: '🡸🡸',
          },
          circle: {
            en: '⚪',
            ja: '⚪',
          },
          triangle: {
            en: '⨻',
            ja: '⨻',
          },
          square: {
            en: '⬜',
            ja: '⬜',
          },
          cross: {
            en: '❌',
            ja: '❌',
          },
          alpha: {
            en: 'α🔴', // 🔺🟥
            ja: 'α🔴',
          },
          beta: {
            en: 'β🟨',
            ja: 'β🟨',
          },
          simple: {
            en: '${marker} + ${tether}',
            ja: '${marker} + ${tether}',
          },
        };

        if (data.conceptDebuff === undefined || data.conceptPair === undefined)
          return;

        const failStr = output.simple!({
          marker: output[data.conceptPair]!(),
          tether: output[data.conceptDebuff]!(),
        });

        if (Object.keys(data.conceptData).length !== 12)
          return { infoText: failStr };

        let myColumn: number | undefined;
        let myRow: number | undefined;
        let myInterceptOutput: InterceptOutput | undefined;

        if (matches.id === '8331') {
          // for classic1 and classic2, find the (initial) position for the player to intercept
          const columnOrderFromConfig: { [order: string]: ConceptPair[] } = {
            xsct: ['cross', 'square', 'circle', 'triangle'],
            cxts: ['circle', 'cross', 'triangle', 'square'],
            ctsx: ['circle', 'triangle', 'square', 'cross'],
          };
          const columnOrder =
            columnOrderFromConfig[data.triggerSetConfig.classicalConceptsPairOrder];
          if (columnOrder?.length !== 4)
            return { infoText: failStr };

          myColumn = columnOrder.indexOf(data.conceptPair);
          const myColumnLocations = [
            conceptLocationMap.north[myColumn],
            conceptLocationMap.middle[myColumn],
            conceptLocationMap.south[myColumn],
          ];
          const [north, middle, south] = myColumnLocations;
          if (north === undefined || middle === undefined || south === undefined)
            return { infoText: failStr };

          let myColumnBlueLocation: number;
          if (data.conceptData[north] === 'blue')
            myColumnBlueLocation = north;
          else
            myColumnBlueLocation = data.conceptData[middle] === 'blue' ? middle : south;
          myRow = myColumnLocations.indexOf(myColumnBlueLocation);

          const conceptMap = getConceptMap(myColumnBlueLocation);
          const myShapeColor = conceptDebuffToColor[data.conceptDebuff];

          const possibleLocations: number[] = [];
          const possibleIntercepts: number[] = [];
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
              return { infoText: failStr };
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
            return { infoText: failStr };

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
        } else {
          // for Panta Rhei, get myColumn, myRow, and myInterceptOutput from data{} and invert them
          if (data.classical2InitialColumn !== undefined)
            myColumn = 3 - data.classical2InitialColumn;
          if (data.classical2InitialRow !== undefined)
            myRow = 2 - data.classical2InitialRow;
          if (data.classical2Intercept !== undefined) {
            const interceptOutputInvertMap: Record<InterceptOutput, InterceptOutput> = {
              leanNorth: 'leanSouth',
              leanSouth: 'leanNorth',
              leanEast: 'leanWest',
              leanWest: 'leanEast',
            };
            myInterceptOutput = interceptOutputInvertMap[data.classical2Intercept];
          }
        }

        if (myColumn === undefined || myRow === undefined || myInterceptOutput === undefined)
          return { infoText: failStr };

        const columnOutput = ['outsideWest', 'insideWest', 'insideEast', 'outsideEast'][myColumn];
        const rowOutput = ['northRow', 'middleRow', 'southRow'][myRow];
        if (columnOutput === undefined || rowOutput === undefined)
          return { infoText: failStr };

        let outputStr;
        if (data.phase === 'classical1') {
          outputStr = output.classic1!({
            column: output[columnOutput]!(),
            row: output[rowOutput]!(),
            intercept: output[myInterceptOutput]!(),
            marker: output[data.conceptPair]!(),
            tether: output[data.conceptDebuff]!(),
          });
          return { infoText: outputStr };
        }
        if (matches.id === '8331') { // classic2 initial
          outputStr = output.classic2initial!({
            column: output[columnOutput]!(),
            row: output[rowOutput]!(),
            marker: output[data.conceptPair]!(),
            tether: output[data.conceptDebuff]!(),
          });
          return { infoText: outputStr };
        }
        outputStr = output.classic2actual!({
          column: output[columnOutput]!(),
          row: output[rowOutput]!(),
          intercept: output[myInterceptOutput]!(),
        });
        return { alertText: outputStr };
      },
      run: (data) => {
        if (data.phase === 'classical1') {
          /*
          delete data.conceptPair;
          delete data.conceptDebuff;
          */
          data.conceptData = {};
        }
      },
    },
    {
      id: 'P12S Palladian Ray 1 Initial',
      type: 'LosesEffect',
      netRegex: { effectId: 'E04' }, // Shackled Together
      condition: (data, matches) => data.me === matches.target && data.phase === 'classical1',
      // shapes use 8333 (Implode) at t+5.6s, and 8324 (Palladian Ray cleaves) snapshots at t+8.9s
      durationSeconds: 8.5,
      alertText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return getPalladionRayEscape('classical1', data.conceptPair, data.conceptDebuff, output);
        if (data.conceptDebuff === undefined)
          return output.default!();
        return data.conceptDebuff === 'alpha'
          ? output.baitAlphaDebuff!()
          : output.baitBetaDebuff!();
      },
      run: (data) => delete data.conceptDebuff,
      outputStrings: {
        baitAlphaDebuff: {
          en: '피하고 => 빔 유도 (알파)',
          ja: '回避 => ビーム誘導 (アルファ)',
        },
        baitBetaDebuff: {
          en: '피하고 => 빔 유도 (베타)',
          ja: '回避 => ビーム誘導 (ベター)',
        },
        default: {
          en: '빔 유도해요',
          ja: 'ビーム誘導',
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
          return output.default!();
        return data.conceptDebuff === 'alpha'
          ? output.baitAlphaDebuff!()
          : output.baitBetaDebuff!();
      },
      outputStrings: {
        baitAlphaDebuff: {
          en: '빔 유도 (알파)',
          ja: 'ビーム誘導 (アルファ)',
        },
        baitBetaDebuff: {
          en: '빔 유도 (베타)',
          ja: 'ビーム誘導 (ベター)',
        },
        default: {
          en: '빔 유도해요',
          ja: 'ビーム誘導',
        },
        ...palladionRayOutputStrings,
      },
    },
    {
      id: 'P12S Palladian Ray Followup',
      type: 'Ability',
      netRegex: { id: '8323', source: 'Pallas Athena', capture: false },
      delaySeconds: 2.5,
      alarmText: (data, _matches, output) => {
        if (data.phase === 'classical2')
          return output.moveAvoid!();
        return output.move!();
      },
      outputStrings: {
        moveAvoid: {
          en: '피해욧! (사이사이로)',
          ja: '回避 (ビームの間)',
        },
        move: Outputs.moveAway,
      },
    },
    {
      id: 'P12S 판제네시스 시작',
      type: 'Ability',
      netRegex: { id: '833F', source: 'Pallas Athena', capture: false },
      delaySeconds: 1,
      durationSeconds: 10,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        // 무직, 인자1
        const mycnt = data.prsPangenesisCount[data.me] ?? 0;
        if (mycnt < 2) {
          let partner = output.unknown!();
          for (const [name, cnt] of Object.entries(data.prsPangenesisCount)) {
            if (cnt === mycnt && name !== data.me) {
              partner = data.party.aJobName(name);
              break;
            }
          }
          return mycnt === 0
            ? output.slime!({ partner: partner })
            : output.geneone!({ partner: partner });
        }
        // 시간에 따른 처리
        const mystat = data.prsPangenesisRole[data.me];
        const myduration = data.prsPangenesisDuration[data.me];
        if (mystat === undefined || myduration === undefined)
          return;
        if (myduration < 18)
          return output.tower1st!({ color: output[mystat]!() });
        return output.tower2nd!({ color: output[mystat]!() });
      },
      run: (data) => data.prsSeenPangenesis = true,
      outputStrings: {
        tower1st: {
          en: '빠른: 첫 ${color} 타워',
          ja: '早: 1の${color}塔',
        },
        tower2nd: {
          en: '느림: 둘째🡻 ${color} 타워',
          ja: '遅: 2🡻の${color}塔',
        },
        geneone: {
          en: '인자1: 첫 타워 (${partner}△)',
          ja: '因子1: 1の塔 (${partner}△)',
        },
        slime: {
          en: '무직: 둘째🡹 타워 (${partner}▽)',
          ja: '無職: 2🡹の塔 (${partner}▽)',
        },
        astral: {
          en: '🟡하얀', // 색깔 바뀜
          ja: '🟡ひかり',
        },
        umbral: {
          en: '🟣검은', // 색깔 바뀜
          ja: '🟣やみ',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S 판제네시스 상태/언스테이블',
      type: 'GainsEffect',
      netRegex: { effectId: pangenesisEffects.unstableFactor },
      run: (data, matches) => {
        const cnt = data.prsPangenesisCount[matches.target];
        data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
      },
    },
    {
      id: 'P12S 판제네시스 상태/스테이블',
      type: 'GainsEffect',
      netRegex: { effectId: pangenesisEffects.stableSystem },
      run: (data, matches) => {
        const cnt = data.prsPangenesisCount[matches.target];
        if (cnt === undefined)
          data.prsPangenesisCount[matches.target] = 0;
      },
    },
    {
      id: 'P12S 판제네시스 상태/음브랄', // Umbral Tilt
      type: 'GainsEffect',
      netRegex: { effectId: pangenesisEffects.lightTilt },
      condition: (data) => data.phase === 'pangenesis',
      run: (data, matches) => {
        if (!data.prsSeenPangenesis) {
          const cnt = data.prsPangenesisCount[matches.target];
          data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
          data.prsPangenesisDuration[matches.target] = parseFloat(matches.duration);
        }
        data.prsPangenesisRole[matches.target] = 'umbral';
      },
    },
    {
      id: 'P12S 판제네시스 상태/아스트랄', // Astral Tilt
      type: 'GainsEffect',
      netRegex: { effectId: pangenesisEffects.darkTilt },
      condition: (data) => data.phase === 'pangenesis',
      run: (data, matches) => {
        if (!data.prsSeenPangenesis) {
          const cnt = data.prsPangenesisCount[matches.target];
          data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
          data.prsPangenesisDuration[matches.target] = parseFloat(matches.duration);
        }
        data.prsPangenesisRole[matches.target] = 'astral';
      },
    },
    {
      id: 'P12S 판제네시스 상태/타워 색깔',
      type: 'Ability',
      netRegex: { id: ['8343', '8344'], source: 'Hemitheos' },
      condition: (data, matches) => matches.target === data.me,
      run: (data, matches) => {
        if (data.prsPangenesisRole[data.me] !== undefined)
          return;
        const cc = matches.id === '8343' ? 'astral' : 'umbral';
        data.prsPangenesisRole[data.me] = cc;
      },
    },
    {
      id: 'P12S 판제네시스 이동',
      type: 'Ability',
      netRegex: { id: ['8343', '8344'], source: 'Hemitheos', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 4,
      suppressSeconds: 2,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          move: {
            en: '타워 둘어가요',
            ja: '塔踏み',
          },
          movecc: {
            en: '다음 ${color} 타워',
            ja: '次${color}塔',
          },
          end: {
            en: '끝! 남쪽으로',
            ja: '終わり！南へ',
          },
          slime: {
            en: '끝이지만 무직! 슬라임 채요!',
            ja: '終わったが無職！スライム取り！',
          },
          wait1n: {
            en: '둘째🡹 타워',
            ja: '2🡹の塔',
          },
          wait1g: {
            en: '둘째🡻 타워',
            ja: '2🡻の塔',
          },
          wait1gcc: {
            en: '둘째🡻 ${color} 타워',
            ja: '2🡻の${color}塔',
          },
          astral: {
            en: '🟡하얀', // 색깔 바뀜
            ja: '🟡ひかり',
          },
          umbral: {
            en: '🟣검은', // 색깔 바뀜
            ja: '🟣やみ',
          },
        };

        data.prsPangenesisTilt = (data.prsPangenesisTilt ?? 0) + 1;
        const tilt = data.prsPangenesisTilt;

        const mycnt = data.prsPangenesisCount[data.me] ?? 0;
        const mystat = data.prsPangenesisRole[data.me];
        const myduration = data.prsPangenesisDuration[data.me] ?? 0;

        if (tilt === 1) {
          if (myduration < 18 || mycnt === 1) {
            if (mystat === undefined)
              return { alertText: output.move!() };
            return { alertText: output.movecc!({ color: output[mystat]!() }) };
          }
          if (myduration > 18) {
            if (mystat === undefined)
              return { alertText: output.wait1g!() };
            return { alertText: output.wait1gcc!({ color: output[mystat]!() }) };
          }
          if (mycnt === 0)
            return { alertText: output.wait1n!() };
        } else if (tilt === 2) {
          // 모두 다 이동
          if (mystat === undefined)
            return { alertText: output.move!() };
          return { alertText: output.movecc!({ color: output[mystat]!() }) };
        } else if (tilt === 3) {
          // 무직만 슬라임
          if (mycnt === 0)
            return { alarmText: output.slime!() };
          return { alertText: output.end!() };
        }
      },
      run: (data) => {
        if (data.prsPangenesisTilt && data.prsPangenesisTilt >= 3) {
          data.prsPangenesisCount = {};
          data.prsPangenesisRole = {};
          data.prsPangenesisDuration = {};
          delete data.prsPangenesisTilt;
        }
      },
    },
    {
      id: 'P12S Summon Darkness Preposition',
      type: 'StartsUsing',
      netRegex: { id: '832F', source: 'Pallas Athena', capture: false },
      condition: (data) => data.seenSecondTethers === false && !data.options.AutumnStyle,
      infoText: (_data, _matches, output) => output.stackForTethers!(),
      outputStrings: {
        stackForTethers: {
          en: '한가운데 모여요!',
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

        const unsafeMap: Partial<Record<ArrowOutput8, ArrowOutput8>> = {
          arrowN: 'arrowS',
          arrowNE: 'arrowSW',
          arrowE: 'arrowW',
          arrowSE: 'arrowNW',
          arrowS: 'arrowN',
          arrowSW: 'arrowNE',
          arrowW: 'arrowE',
          arrowNW: 'arrowSE',
        } as const;
        let safeDirs = Object.keys(unsafeMap) as ArrowOutput8[];
        data.darknessClones.forEach((clone) => {
          const x = parseFloat(clone.x);
          const y = parseFloat(clone.y);
          const cloneDir = AutumnIndicator.xyToArrow8Output(x, y, uavCenterX, uavCenterY);
          const pairedDir = unsafeMap[cloneDir];
          safeDirs = safeDirs.filter((dir) => dir !== cloneDir && dir !== pairedDir);
        });
        if (safeDirs.length !== 2)
          return;

        const arrow = getUltimaRayArrow(data.role === 'dps', safeDirs);
        if (arrow !== undefined)
          return output.moveTo!({ dir: output[arrow]!() });

        const [dir1, dir2] = safeDirs.sort();
        if (dir1 === undefined || dir2 === undefined)
          return;
        return output.combined!({ dir1: output[dir1]!(), dir2: output[dir2]!() });
      },
      outputStrings: {
        combined: {
          en: '${dir1} / ${dir2}',
        },
        moveTo: {
          en: '${dir}${dir}',
        },
        ...AutumnIndicator.outputStringsArrow8,
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

        const safeMap: Partial<Record<ArrowOutput8, ArrowOutput8[]>> = {
          // for each dir, identify the two dirs 90 degrees away
          arrowN: ['arrowW', 'arrowE'],
          arrowNE: ['arrowNW', 'arrowSE'],
          arrowE: ['arrowN', 'arrowS'],
          arrowSE: ['arrowNE', 'arrowSW'],
          arrowS: ['arrowW', 'arrowE'],
          arrowSW: ['arrowNW', 'arrowSE'],
          arrowW: ['arrowN', 'arrowS'],
          arrowNW: ['arrowNE', 'arrowSW'],
        };

        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const cloneDir = AutumnIndicator.xyToArrow8Output(x, y, uavCenterX, uavCenterY);
        const safeDirs = safeMap[cloneDir] ?? [];

        const arrow = getUltimaRayArrow(data.role === 'dps', safeDirs);
        if (arrow !== undefined)
          return output.moveTo!({ dir: output[arrow]!() });

        const [dir1, dir2] = safeDirs.sort();
        if (dir1 === undefined || dir2 === undefined)
          return;
        return output.combined!({ dir1: output[dir1]!(), dir2: output[dir2]!() });
      },
      outputStrings: {
        combined: {
          en: '${dir1} / ${dir2}',
        },
        moveTo: {
          en: '${dir}${dir}',
        },
        ...AutumnIndicator.outputStringsArrow8,
      },
    },
    {
      id: 'P12S Gaiaochos',
      type: 'StartsUsing',
      netRegex: { id: '8326', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 + 작아져요',
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
        if (data.phase === 'gaiaochos1')
          return output.uav1!({ partner: data.party.aJobName(partner) });
        data.seenSecondTethers = true;
        return output.uav2!({
          partner: data.party.aJobName(partner),
          geocentrism: data.geocentrism2OutputStr ?? output.unknown!(),
        });
      },
      outputStrings: {
        uav1: {
          en: '끊어요! (${partner})',
          ja: '線切る (${partner})',
        },
        uav2: {
          en: '끊으면서 흩어져요(${geocentrism})! (${partner})',
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
            en: '줄 앞에 막아줘요',
            ja: '相棒の前でビームを受ける',
          },
          stretchTether: {
            en: '줄 늘려요',
          },
        };

        if (data.gaiaochosTetherCollect.includes(data.me))
          return { infoText: output.stretchTether!() };
        return { alertText: output.blockPartner!() };
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
        return output.text!({ num: data.prsUltima });
      },
      outputStrings: {
        text: {
          en: '알테마#${num} 전체 공격',
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
            en: '맵 반쪽 탱크버스터! 무적으로!',
          },
          tankBusterCleaves: {
            en: '맵 반쪽 탱크버스터!',
          },
          avoidTankCleaves: {
            en: '맵 반쪽 탱크버스터 피해요',
          },
        };

        if (data.palladionGrapsTarget === data.me)
          return { alertText: output.tankBusterCleavesOnYou!() };
        if (data.role === 'tank' || data.role === 'healer' || data.job === 'BLU')
          return { alertText: output.tankBusterCleaves!() };
        return { infoText: output.avoidTankCleaves!() };
      },
    },
    {
      id: 'P12S 크러시 헬름',
      type: 'StartsUsing',
      netRegex: { id: '8317', source: 'Pallas Athena', capture: false },
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tank!();
        if (data.role === 'healer')
          return output.healer!();
      },
      outputStrings: {
        tank: {
          en: '탱크버스터! 에스나 받아욧',
        },
        healer: {
          en: '탱크버스터! 에스나 준비해욧',
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
      alertText: (data, _matches, output) => {
        if (data.caloric1First.length !== 2)
          return;
        const index = data.caloric1First.indexOf(data.me);
        if (index < 0)
          return;
        const partner = index === 0 ? 1 : 0;
        return output.text!({ partner: data.party.aJobName(data.caloric1First[partner]) });
      },
      outputStrings: {
        text: {
          en: '첫 불! 앞으로! (${partner})',
          ja: '自分に初炎 (${partner})', // FIXME
        },
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
          return output.text!();
      },
      outputStrings: {
        text: {
          en: '또다시 불! 무직이랑 뭉쳐요',
          ja: '再び炎！無職とあたまわり',
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
          return output.none!();
        if (data.caloric1Mine === 'wind')
          return output.wind!();
      },
      outputStrings: {
        none: {
          en: '무직! 불이랑 뭉쳐요!',
          ja: '無職！炎とあたまわり',
        },
        wind: {
          en: '바람! 흩어져요!',
          ja: '風！ 散会',
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
            en: '불 (${team})',
            ja: '自分に炎 (${team})',
          },
          wind: {
            en: '바람 (${team})',
            ja: '自分に風 (${team})',
          },
          windBeacon: {
            en: '바람, 살짝 옆으로',
            ja: '自分に初風', // FIXME
          },
        };

        const myBuff = data.caloric1Buff[data.me];
        data.caloric1Mine = myBuff;
        if (myBuff === undefined)
          return;

        if (myBuff === 'fire') {
          const myTeam: number[] = [];
          for (const [name, stat] of Object.entries(data.caloric1Buff)) {
            if (stat === myBuff && name !== data.me)
              myTeam.push(data.party.aJobIndex(name));
          }
          return { alertText: output.fire!({ team: data.party.aJobSortedList(myTeam) }) };
        }

        if (data.caloric1First.includes(data.me))
          return { infoText: output.windBeacon!() };

        const myTeam: number[] = [];
        for (const [name, stat] of Object.entries(data.caloric1Buff)) {
          if (stat === myBuff && name !== data.me && !data.caloric1First.includes(name))
            myTeam.push(data.party.aJobIndex(name));
        }
        return { alertText: output.wind!({ team: data.party.aJobSortedList(myTeam) }) };
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
            en: '첫 불! 한가운데로!',
            ja: '自分に初炎!', // FIXME
          },
          fireOn: {
            en: '불 교대: ${player}',
            ja: '初炎: ${player}',
          },
        };

        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.caloric2InitialFire)
          return;
        if (data.me === matches.target)
          return { alarmText: output.fireOnMe!() };
        if (data.palladionGrapsTarget === data.me)
          return { infoText: output.fireOn!({ player: data.party.aJobName(matches.target) }) };
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
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '바람, 흩어져요',
          ja: '自分に風、散会',
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
            en: '불 장판 옮겨욧! 반시계 방향❱❱',
            ja: '次に移る！',
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
          return { alarmText: output.moveAway!() };
        if (thisFire === data.me)
          return { alertText: output.passFire!() };
      },
    },
    {
      id: 'P12S Ekpyrosis Cast',
      type: 'StartsUsing',
      netRegex: { id: '831E', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '엑사플레어 + 전체 공격',
          de: 'Exaflare + Große AoE!', // FIXME
          fr: 'ExaBrasier + Grosse AoE!', // FIXME
          ja: 'エクサフレア + 全体攻撃',
          cn: '地火 + 大AoE伤害！', // FIXME
          ko: '엑사플레어 + 전체 공격!', // FIXME
        },
      },
    },
    {
      id: 'P12S Ekpyrosis Spread',
      type: 'Ability',
      netRegex: { id: '831F', source: 'Pallas Athena', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 2,
      response: Responses.spread('alarm'),
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
      'missingTranslations': true,
      'replaceSync': {
        'Anthropos': 'Anthropos',
        '(?<! )Athena': 'Athena',
        'Concept of Water': 'Substanz des Wassers',
        'Forbidden Factor': 'Tabu',
        'Hemitheos': 'Hemitheos',
        'Pallas Athena': 'Pallas Athena',
      },
      'replaceText': {
        '\\(Floor Drop\\)': '(Boden bricht weg)',
        '\\(cast\\)': '(Wirken)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(proximity\\)': '(Entfernung)',
        '\\(spread\\)': '(Verteilen)',
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
        'Anthropos': 'anthropos',
        '(?<! )Athena': 'Athéna',
        'Concept of Water': 'concept de l\'eau',
        'Forbidden Factor': 'facteur tabou',
        'Hemitheos': 'hémithéos',
        'Pallas Athena': 'Pallas Athéna',
      },
      'replaceText': {
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
        'Anthropos': 'アンスロポス',
        '(?<! )Athena': 'アテナ',
        'Concept of Water': '水の概念',
        'Forbidden Factor': '禁忌因子',
        'Hemitheos': 'ヘーミテオス',
        'Pallas Athena': 'パラスアテナ',
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
  ],
};

export default triggerSet;

// umbral=라이트=노랑=하양 / astral=다크=보라=깜장
// DF8:Umbral Tilt                  노랑 타워
// DF9:Astral Tilt                  보라 타워
// DFA:Heavensflame Soul
// DFB:Umbralbright Soul        타워 설치
// DFC:Astralbright Soul        타워 설치
// DFD:Umbralstrong Soul
// DFE:Astralstrong Soul
