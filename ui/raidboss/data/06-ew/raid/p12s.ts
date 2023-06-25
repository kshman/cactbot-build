import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: add phase dash calls?? (maybe this is overkill)
// TODO: Superchain 2B
// TODO: final Sample safe spot

// TODO: palladian grasp tankbusters (which are often invulned)
// TODO: crush helm tankbusters??? (+esuna calls for non-invulning tanks??)
// TODO: gaiochos group up for chains / break chains calls
//       (also maybe delay the second horizontal/vertical call until after break chains)
// TODO: summon darkness tether break locations
// TODO: more aoe calls for caloric, classical, gaiaochos (big?)
// TODO: basic caloric headmarkers (e.g. beacons, initial fire spread)
// TODO: other caloric buff calls (if there's any universal strat, e.g. wind spreads)
// TODO: classical shape headmarker + pyramid/cube call
// TODO: bait proteans / move calls for classical 1 and 2

// TODO: add triggerset ui for playstation order + classical location
// TODO: detect(?!) hex strat for caloric2 and tell people who to go to??

// umbral=라이트=노랑=하양 / astral=다크=보라=깜장
// DF8:Umbral Tilt                  노랑 타워
// DF9:Astral Tilt                  보라 타워
// DFA:Heavensflame Soul
// DFB:Umbralbright Soul        타워 설치
// DFC:Astralbright Soul        타워 설치
// DFD:Umbralstrong Soul
// DFE:Astralstrong Soul
type TypeUmbralAstral = 'umbral' | 'astral' | 'unknown';
type TypePlaystation = 'circle' | 'cross' | 'triangle' | 'square';
type TypeAlphaBeta = 'alpha' | 'beta';
type TypeCaloric = 'fire' | 'wind';

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
  caloric1Beacon: '0193',
  // vfx/lockon/eff/lockon8_line_1v.avfx
  caloric2InitialFire: '01D6',
  // vfx/lockon/eff/d1014trg_8s_0v.avfx
  caloric2Wind: '01D5',
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
  readonly triggerSetConfig: { prStyle: boolean };
  prsPhase: number; // 지금은 편리하지만 스킵이 있으면 이거 깨지므로 수정해야함
  // 전반
  prsTrinityInvul?: boolean;
  prsApoPeri?: number;
  // 후반
  prsPalladionGraps?: string;
  prsUltima?: number;
  prsClassicMarker: { [name: string]: TypePlaystation };
  prsClassicAlphaBeta: { [name: string]: TypeAlphaBeta };
  prsCaloric1First: string[];
  prsCaloric1Buff: { [name: string]: TypeCaloric };
  prsCaloric1Mine?: TypeCaloric;
  prsCaloric2Fire?: string;
  prsSeenPangenesis?: boolean;
  prsPangenesisCount: { [name: string]: number };
  prsPangenesisStat: { [name: string]: TypeUmbralAstral };
  prsPangenesisDuration: { [name: string]: number };
  prsPangenesisTilt?: number;
  //
  decOffset?: number;
  expectedFirstHeadmarker?: string;
  isDoorBoss: boolean;
  phase?: 'superchain1' | 'palladion' | 'superchain2a' | 'superchain2b';
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
}

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheTwelfthCircleSavage',
  zoneId: ZoneId.AnabaseiosTheTwelfthCircleSavage,
  config: [
    {
      id: 'prStyle',
      name: {
        en: 'P12S PR 스타일',
      },
      type: 'checkbox',
      default: false,
    },
  ],
  timelineFile: 'p12s.txt',
  initData: () => {
    return {
      prsPhase: 0,
      prsClassicMarker: {},
      prsClassicAlphaBeta: {},
      prsCaloric1First: [],
      prsCaloric1Buff: {},
      prsPangenesisCount: {},
      prsPangenesisStat: {},
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
        text: '탱크 무적으로 받아요',
      },
    },
    {
      id: 'P12S 알테마 블레이드',
      regex: /Ultima Blade/,
      beforeSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '엄청 아픈 전체 공격!',
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

        const phaseMap: { [id: string]: Data['phase'] } = {
          '82DA': 'superchain1',
          '82F5': 'palladion',
          '86FA': 'superchain2a',
          '86FB': 'superchain2b',
        } as const;
        data.phase = phaseMap[matches.id];
        data.prsPhase++;
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
      netRegex: { id: '82ED', capture: false },
      run: (data) => {
        data.paradeigmaCounter++;
        data.prsPhase++;
      },
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
        const cloneSide = y > centerY
          ? data.role === 'tank' ? 'south' : 'north'
          : data.role === 'tank' ? 'north' : 'south';
        return output.clones!({ dir: output[cloneSide]!() });
      },
      outputStrings: {
        clones: {
          en: '${dir}으로',
          ko: '분신 ${dir}',
        },
        north: Outputs.north,
        south: Outputs.south,
        unknown: Outputs.unknown,
      },
    },
    // In Ray 1 (Paradeigma2), two adds always spawn north in pairs with PosX of [85, 105] or [95, 115].
    // Each cleaves 1/4th of the arena. So given one PosX, we can determine the inside/outside safe lanes.

    // TODO: In Ray 2 (SC IIB), the adds have the same cleave width but spawn at [87, 103] or [97, 113].
    // So "inside east", e.g., is a bit inaccurate.  Because of mech timing, there also isn't time to cross
    // the arena.  So realistically, this should be combined with SC IIB triggers to indicate whether
    //  the player needs to move inside or outside to avoid the cleave that will intersect the 2nd orb.
    // For now, though, display a reminder to avoid the cleaves.
    {
      id: 'P12S Ray of Light',
      type: 'StartsUsing',
      netRegex: { id: '82EE', source: 'Anthropos' },
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        const x = Math.round(parseFloat(matches.x));
        if (x === undefined)
          return output.avoid!();

        let safeLanes;
        if (data.paradeigmaCounter === 2) {
          if (x < 90)
            safeLanes = 'insideWestOutsideEast';
          else if (x > 110)
            safeLanes = 'insideEastOutsideWest';
          else
            safeLanes = x < 100 ? 'insideEastOutsideWest' : 'insideWestOutsideEast';
        }

        if (safeLanes === undefined)
          return output.avoid!(); // will fire during Ray 2 (SC IIB)
        return output[safeLanes]!();
      },
      outputStrings: {
        insideWestOutsideEast: {
          en: '서[안] / 동[밖]',
          cn: '内西 / 外东',
          ko: '서쪽 안 / 동쪽 바깥',
        },
        insideEastOutsideWest: {
          en: '서[밖] / 동[안]',
          cn: '内东 / 外西',
          ko: '동쪽 안 / 서쪽 바깥',
        },
        avoid: {
          en: '한 줄 장판 피해요',
          cn: '远离场边激光',
          ko: '직선 장판 피하기',
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
          cn: '北 + Boss左侧 (稍后 回到北)',
          ko: '북쪽 + 보스 왼쪽 (그리고 다시 북쪽)',
        },
        superchain2aLeftNorthSouth: {
          en: '북쪽 => 계속 전진 [왼쪽]',
          de: 'Norden + Links von Ihr (dannach Süden)',
          cn: '北 + Boss左侧 (稍后 去南)',
          ko: '북쪽 + 보스 왼쪽 (그리고 남쪽으로)',
        },
        superchain2aLeftSouthNorth: {
          en: '남쪽 => 계속 전진 [왼쪽]',
          de: 'Süden + Links (dannach Norden)',
          cn: '南 + 左 (稍后 去北)',
          ko: '남쪽 + 왼쪽 (그리고 북쪽으로)',
        },
        superchain2aLeftSouthSouth: {
          en: '남쪽 => 되돌아 와욧 [왼쪽]',
          de: 'Süden + Links (dannach Süden)',
          cn: '南 + 左 (稍后 回到南)',
          ko: '남쪽 + 왼쪽 (그리고 다시 남쪽)',
        },
        superchain2aRightNorthNorth: {
          en: '북쪽 => 되돌아 와욧 [오른쪽]',
          de: 'Norden + Rechts von Ihr (dannach Norden)',
          cn: '北 + Boss右侧 (稍后 回到北)',
          ko: '북쪽 + 보스 오른쪽 (그리고 다시 북쪽)',
        },
        superchain2aRightNorthSouth: {
          en: '북쪽 => 계속 전진 [오른쪽]',
          de: 'Norden + Rechts von Ihr (dannach Süden)',
          cn: '北 + Boss右侧 (稍后 去南)',
          ko: '북쪽 + 보스 오른쪽 (그리고 남쪽으로)',
        },
        superchain2aRightSouthNorth: {
          en: '남쪽 => 계속 전진 [오른쪽]',
          de: 'Süden + Rechts (dannach Norden)',
          cn: '南 + 右 (稍后 去北)',
          ko: '남쪽 + 오른쪽 (그리고 북쪽으로)',
        },
        superchain2aRightSouthSouth: {
          en: '남쪽 => 되돌아 와욧 [오른쪽]',
          de: 'Süden + Rechts (dannach Süden)',
          cn: '南 + 右 (稍后 回到南)',
          ko: '남쪽 + 오른쪽 (그리고 다시 남쪽)',
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
          cn: '穿',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          cn: '停',
          ko: '가만히',
        },
        secondWingCallStay: {
          en: '[그대로]',
          de: '(bleib Stehen)',
          fr: '(restez)',
          cn: '(停)',
          ko: '(가만히)',
        },
        secondWingCallSwap: {
          en: '[옆으로 이동]',
          de: '(Wechseln)',
          fr: '(swap)',
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
          if (data.triggerSetConfig.prStyle) {
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
        if (data.triggerSetConfig.prStyle) {
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
          cn: '穿',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          cn: '停',
          ko: '가만히',
        },
        superchain2aSwapMidBack: {
          en: '한가운데 => 되돌아 가욧 [옆으로]',
          de: 'Wechseln + Mitte => Zurück nach ${dir}',
          cn: '穿 + 去中间 => 回到 ${dir}',
          ko: '이동 + 가운데 => 다시 ${dir}',
        },
        superchain2aSwapMidGo: {
          en: '한가운데 => 계속 전진 [옆으로]',
          de: 'Wechseln + Mitte => Geh nach ${dir}',
          cn: '穿 + 去中间 => 去 ${dir}',
          ko: '이동 + 가운데 => ${dir}으로',
        },
        superchain2aStayMidBack: {
          en: '한가운데 => 되돌아 가욧',
          de: 'Bleib stehen + Mitte => Zurück nach ${dir}',
          cn: '停 + 去中间 => 回到 ${dir}',
          ko: '가만히 + 가운데 => 다시 ${dir}',
        },
        superchain2aStayMidGo: {
          en: '한가운데 => 계속 전진',
          de: 'Bleib stehen + Mitte => Geh nach ${dir}',
          cn: '停 + 去中间 => 去 ${dir}',
          ko: '가만히 + 가운데 => ${dir}으로',
        },
        superchain2aSwapProtean: {
          en: '${dir} + 프로틴 [옆으로]',
          de: 'Wechseln => Himmelsrichtungen + ${dir}',
          cn: '穿 => 八方分散 + ${dir}',
          ko: '이동 => 8방향 산개 + ${dir}',
        },
        superchain2aStayProtean: {
          en: '${dir} + 프로틴',
          de: 'Bleib stehen => Himmelsrichtungen + ${dir}',
          cn: '停 => 八方分散 + ${dir}',
          ko: '가만히 => 8방향 산개 + ${dir}',
        },
        superchain2aSwapPartners: {
          en: '${dir} + 페어 [옆으로]',
          de: 'Wechseln => Partner + ${dir}',
          cn: '穿 => 双人分摊 + ${dir}',
          ko: '이동 => 파트너 + ${dir}',
        },
        superchain2aStayPartners: {
          en: '${dir} + 페어',
          de: 'Bleib stehen => Partner + ${dir}',
          cn: '停 => 双人分摊 + ${dir}',
          ko: '가만히 => 파트너 + ${dir}',
        },
        north: Outputs.north,
        south: Outputs.south,
        prSwap: '[옆으로]',
        prsc2aMb: '한가운데로 => 되돌아 가욧 ${move}',
        prsc2aMg: '한가운데로 => 계속 전진 ${move}',
        prsc2aBpro: '되돌아 와서 + 프로틴 ${move}',
        prsc2aBtwo: '되돌아 와서 + 페어 ${move}',
        prsc2aGpro: '전진해서 + 프로틴 ${move}',
        prsc2aGtwo: '전진해서 + 페어 ${move}',
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
          cn: '八方分散',
          ko: '8방향 산개',
        },
        partners: {
          en: '페어! 둘이 함께',
          de: 'Partner',
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
        text: '🟪줄 땡겨요',
      }
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
        text: '🟨줄 땡겨요',
      }
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
          en: 'light beam 🟨줄 땡겨요',
          cn: '引导光激光',
          ko: '빛 선',
        },
        darkBeam: {
          en: 'dark beam 🟪줄 땡겨요',
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

          /*
          if (data.triggerSetConfig.engravement1DropTower === 'quadrant') {
          */
            if (x < 80 && y < 100) { // x = 75 && y = 97
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 100 && y < 80) { // x = 97 && y = 75
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 100 && y < 80) { // x = 103 && y = 75
              data.engravement1BeamsPosMap.set('SE', color);
            } else if (x > 120 && y < 100) { // x = 125 && y = 97
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x > 120 && y > 100) { // x = 125 && y = 103
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 100 && y > 120) { // x = 103 && y = 125
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 100 && y > 120) { // x = 97 && y = 125
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x < 80 && y > 100) { // x = 75 && y = 103
              data.engravement1BeamsPosMap.set('SE', color);
            }
          /*
          } else if (data.triggerSetConfig.engravement1DropTower === 'clockwise') {
            if (x < 80 && y < 100) { // x = 75 && y = 97
              data.engravement1BeamsPosMap.set('SE', color);
            } else if (x < 100 && y < 80) { // x = 97 && y = 75
              data.engravement1BeamsPosMap.set('SE', color);
            } else if (x > 100 && y < 80) { // x = 103 && y = 75
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 120 && y < 100) { // x = 125 && y = 97
              data.engravement1BeamsPosMap.set('SW', color);
            } else if (x > 120 && y > 100) { // x = 125 && y = 103
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x > 100 && y > 120) { // x = 103 && y = 125
              data.engravement1BeamsPosMap.set('NW', color);
            } else if (x < 100 && y > 120) { // x = 97 && y = 125
              data.engravement1BeamsPosMap.set('NE', color);
            } else if (x < 80 && y > 100) { // x = 75 && y = 103
              data.engravement1BeamsPosMap.set('NE', color);
            }
          }
          */
        }

        if (data.me === matches.target) {
          // if Only notify tower color
          /*
          if (data.triggerSetConfig.engravement1DropTower === 'tower') {
            if (matches.effectId === engravementIdMap.lightTower)
              return output.lightTower!();
            return output.darkTower!();
          }
          */
          data.engravement1DarkBeamsPos = [];
          data.engravement1LightBeamsPos = [];
          data.engravement1BeamsPosMap.forEach((value: string, key: string) => {
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
          cn: '去 ${pos1}/${pos2} 放光塔',
          ko: '빛 기둥 ${pos1}/${pos2}에 놓기',
        },
        darkTowerSide: {
          en: '🟣설치 ${pos1}/${pos2}',
          cn: '去 ${pos1}/${pos2} 放暗塔',
          ko: '어둠 기둥 ${pos1}/${pos2}에 놓기',
        },
        lightTower: {
          en: '🟡설치',
          cn: '放光塔',
          ko: '빛 기둥 놓기',
        },
        darkTower: {
          en: '🟣설치',
          cn: '放暗塔',
          ko: '어둠 기둥 놓기',
        },
        northeast: Outputs.arrowNE,
        northwest: Outputs.arrowNW,
        southeast: Outputs.arrowSE,
        southwest: Outputs.arrowSW,
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
          cn: '踩暗塔',
          ko: '어둠 기둥 들어가기',
        },
        darkTilt: {
          en: '🟡밟아요',
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
          en: '(곧 흩어져요)',
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
          cn: '踩暗塔',
          ko: '어둠 기둥 들어가기',
        },
        darkBeam: {
          en: '🡸🡸🟡밟아요',
          cn: '踩光塔',
          ko: '빛 기둥 들어가기',
        },
        lightTower: {
          en: '🡸🡸🟡설치',
          cn: '放光塔',
          ko: '빛 기둥 놓기',
        },
        darkTower: {
          en: '🟣설치🡺🡺',
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
          en: '내게 ➕ 북쪽으로!',
          cn: '十 点名',
          ko: '\'+\' 장판 대상자',
        },
        xMarked: {
          en: '내게 ❌ 남쪽으로!',
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
          cn: '放置 十 点名',
          ko: '\'+\' 장판 놓기',
        },
        xMarked: {
          en: '❌ 가운데 설치',
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
          data.party.prJob(data.engravement3TowerPlayers.find((name) => name !== data.me)) ??
            output.unknown!();
        return output.towerOnYou!({ color: towerColor, partner: partner });
      },
      outputStrings: {
        towerOnYou: {
          en: '내게 ${color}타워 (${partner})',
          cn: '${color} 塔点名 (+ ${partner})',
          ko: '${color} 기둥 대상자 (+ ${partner})',
        },
        light: {
          en: '🟡',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
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
      infoText: (data, matches, output) => {
        const my = matches.id === '00E9' || matches.id === '00FA' ? 'lightTower' : 'darkTower';
        if (data.engravement3TowerType !== my) {
          const towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light!()
            : output.dark!();
          return output.towersLater!({ color: towerColor });
        }
      },
      outputStrings: {
        towersLater: {
          en: '타워 들어갈거예요: ${color}',
          cn: '稍后 ${color} 塔',
          ko: '${color} 기둥 (나중에)',
        },
        light: {
          en: '🟡',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
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
          cn: '在 ${spot} 放 ${color} 塔',
          ko: '${color} 기둥 놓기 (${spot})',
        },
        light: {
          en: '🟡',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
          cn: '暗',
          ko: '어둠',
        },
        platform: {
          en: '판때기 한가운데',
          cn: '平台内',
          ko: '플랫폼 내부',
        },
        corner: {
          en: '안쪽 모서리에',
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
          cn: '踩 ${color} 塔',
          ko: '${color} 기둥 들어가기',
        },
        baitCleaves: {
          en: '천사 레이저 유도',
          cn: '引导射线',
          ko: '레이저 유도',
        },
        light: {
          en: '🟡',
          cn: '光',
          ko: '빛',
        },
        dark: {
          en: '🟣',
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
          cn: '小队出 (T进)',
          ko: '본대 밖 (탱커 안)',
        },
        tanksInPartyOut: {
          en: '안쪽으로 (파티가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Tanks à l\'intérieur (Équipe à l\'extérieur',
          cn: 'T进 (小队出)',
          ko: '탱커 안 (본대 밖)',
        },
        tankSolo: '❱❱안쪽❰❰ 혼자 무적!',
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
          cn: '小队进 (T出)',
          ko: '본대 안 (탱커 밖)',
        },
        tanksInPartyOut: {
          en: '바깥으로 (파티가 안쪽)',
          de: 'Tanks Raus (Gruppe Rein)',
          fr: 'Tanks à l\'extérieur (Équipe à l\'intérieur',
          cn: 'T出 (小队进)',
          ko: '탱커 밖 (본대 안)',
        },
        tankSolo: '❰❰바깥❱❱ 혼자 무적!',
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
        if (data.triggerSetConfig.prStyle)
          return;
       return output.text!({ num: num });
      },
      outputStrings: {
        text: {
          en: '${num}번',
          de: '${num}',
          fr: '${num}',
          ja: '${num}',
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
            cn: '引导激光',
            ko: '레이저 유도',
          },
          firstWhiteFlame: {
            en: '(5, 7 레이저 유도)',
            de: '(5 und 7 ködern)',
            fr: '(5 et 7 bait)',
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
            cn: '引导激光',
            ko: '레이저 유도',
          },
          secondWhiteFlame: {
            en: '(6, 8 레이저 유도)',
            de: '(6 und 8 ködern)',
            fr: '(6 et 8 bait)',
            cn: '(6 和 8 引导)',
            ko: '(6, 8 레이저)',
          },
          thirdWhiteFlame: {
            en: '(1, 3 레이저 유도)',
            de: '(1 und 3 ködern)',
            fr: '(1 et 3 bait)',
            cn: '(1 和 3 引导)',
            ko: '(1, 3 레이저)',
          },
          fourthWhiteFlame: {
            en: '(2, 4 레이저 유도)',
            de: '(2 und 6 ködern)',
            fr: '(2 et 4 bait)',
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
          cn: '靠近 + 八方分散 (${dir})',
          ko: '안 + 8방향 산개 (${dir})',
        },
        inAndPartners: {
          en: '안으로 + 페어 [${dir}]',
          de: 'Rein + Partner (${dir})',
          fr: 'Intérieur + Partenaire (${dir})',
          cn: '靠近 + 双人分摊 (${dir})',
          ko: '안 + 파트너 (${dir})',
        },
        outAndProtean: {
          en: '밖에서 + 프로틴 [${dir}]',
          de: 'Raus + Himmelsrichtungen (${dir})',
          fr: 'Extérieur + Position (${dir})',
          cn: '远离 + 八方分散 (${dir})',
          ko: '밖 + 8방향 산개 (${dir})',
        },
        outAndPartners: {
          en: '밖에서 + 페어 [${dir}]',
          de: 'Raus + Partner (${dir})',
          fr: 'Extérieur + Partenaire (${dir})',
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
          en: '🡸🡸시계 방향 + ${engrave}',
          de: 'Links (im Uhrzeigersinn) => ${engrave}',
          fr: 'Gauche (horaire) => ${engrave}',
          cn: '左左左 (顺时针) => ${engrave}',
          ko: '왼쪽 (시계방향) => ${engrave}',
        },
        rightCounterclockwise: {
          en: '반시계 방향🡺🡺 + ${engrave}',
          de: 'Rechts (gegen Uhrzeigersinn) => ${engrave}',
          fr: 'Droite (Anti-horaire) => ${engrave}',
          cn: '右右右 (逆时针) => ${engrave}',
          ko: '오른쪽 (반시계방향) => ${engrave}',
        },
        lightBeam: {
          en: '밟아요🡺🡺',
          cn: '光激光（与暗分摊）',
          ko: '빛 레이저 (어둠 쉐어)',
        },
        darkBeam: {
          en: '🡸🡸밟아요',
          cn: '暗激光（与光分摊）',
          ko: '어둠 레이저 (빛 쉐어),',
        },
        lightTower: {
          en: '🡸🡸🟡설치',
          cn: '光塔点名',
          ko: '빛 기둥',
        },
        darkTower: {
          en: '🟣설치🡺🡺',
          cn: '暗塔点名',
          ko: '어둠 기둥',
        },
        lightTilt: {
          en: '🡸🡸흩어져요',
          cn: '光分摊组',
          ko: '빛 쉐어',
        },
        darkTilt: {
          en: '흩어져요🡺🡺',
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
          en: '${move} + ${engrave}',
          ko: '${move} => ${engrave}',
        },
        inThenOut: '안에 있다 => 밖으로',
        outThenIn: '밖에 있다 => 안으로',
        lightBeam: {
          en: '🟣밟아요🡺🡺',
          cn: '踩暗塔',
          ko: '어둠 기둥 들어가기',
        },
        darkBeam: {
          en: '🡸🡸🟡밟아요',
          cn: '踩光塔',
          ko: '빛 기둥 들어가기',
        },
        lightTower: {
          en: '🡸🡸🟡설치',
          cn: '放光塔',
          ko: '빛 기둥 놓기',
        },
        darkTower: {
          en: '🟣설치🡺🡺',
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
    // TODO: Combine with future SC IIB trigger?  Happens immediately after 1st orb (donut)
    // and before 2nd orb (protean/partners). Also, rather than calling "sides", it should probably
    // call the specific side where the 2nd orb is.
    {
      id: 'P12S Parthenos',
      type: 'StartsUsing',
      netRegex: { id: '8303', source: 'Athena', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'P12S 테오의 알테마',
      type: 'StartsUsing',
      netRegex: { id: '82FA', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '엄청 아픈 전체 공격! 이러다 우리 다 주거!',
      },
    },
    // --------------------- Phase 2 ------------------------
    {
      id: 'P12S Geocentrism Vertical',
      type: 'StartsUsing',
      netRegex: { id: '8329', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.triggerSetConfig.prStyle,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요: ||',
          de: 'Vertikal',
          fr: 'Vertical',
          cn: '垂直',
          ko: '세로',
        },
      },
    },
    {
      id: 'P12S Geocentrism Circle',
      type: 'StartsUsing',
      netRegex: { id: '832A', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.triggerSetConfig.prStyle,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요: ◎',
          de: 'Innerer Kreis',
          fr: 'Cercle intérieur',
          cn: '月环',
          ko: '가운데 원',
        },
      },
    },
    {
      id: 'P12S Geocentrism Horizontal',
      type: 'StartsUsing',
      netRegex: { id: '832B', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.triggerSetConfig.prStyle,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요: 〓',
          de: 'Horizontal',
          fr: 'Horizontal',
          cn: '水平',
          ko: '가로',
        },
      },
    },
    {
      id: 'P12S 후반 페이즈 확인',
      type: 'StartsUsing',
      netRegex: { id: ['8326', '8331', '8338', '831E', '833F'], source: 'Pallas Athena', capture: false },
      run: (data) => {
        // 8326 가이아오코스
        // 8331 클래식 컨셉
        // 8338 칼로리
        // 831E 에크파이로시스
        // 833F 판제네시스
        if (data.prsPhase < 100)
          data.prsPhase = 0;
        data.prsPhase += 100;
      },
    },
    {
      id: 'P12S 줄 적과 연결',
      type: 'Tether',
      netRegex: { id: '0001' },
      suppressSeconds: 2,
      infoText: (data, matches, output) => {
        if (data.prsPhase === 900) {
          // 가이아오코스2 천사랑 연결
          if (data.party.isDPS(matches.target)) {
            if (data.role !== 'dps')
              return output.tetherBarrier!();
          }
          if (data.role === 'dps')
            return output.tetherBarrier!();
        } else if (data.prsPhase === 200 || data.prsPhase === 600) {
          // 클래식 컨셉 줄달리면 자기 자리 알려줌
          const myPs = data.prsClassicMarker[data.me];
          const myAb = data.prsClassicAlphaBeta[data.me];
          if (myPs === undefined || myAb === undefined)
            return;

          const iPs = { circle: 1, triangle: 2, square: 3, cross: 4 }[myPs];
          const iAb = { alpha: 0, beta: 1 }[myAb];
          if (data.prsPhase === 200)
            return output[`c1Safe${iPs}${iAb}`]!();
          return output[`c2Safe${iPs}${iAb}`]!();
        }
      },
      outputStrings: {
        // 가이아오코스2
        tetherBarrier: '줄 앞에 막아줘요',
        // 클래식 컨셉1
        c1Safe10: '🡼🡼🡼', // 알파, 동글
        c1Safe20: '오른쪽🡹🡹🡹', // 알파, 세모
        c1Safe30: '🡽🡽🡽', // 알파, 네모
        c1Safe40: '왼쪽🡹🡹🡹', // 알파, 가위
        c1Safe11: '🡿🡿🡿', // 베타, 동글
        c1Safe21: '오른쪽🡻🡻🡻', // 베타, 세모
        c1Safe31: '🡾🡾🡾', // 베타, 네모
        c1Safe41: '왼쪽🡻🡻🡻', // 베타, 가위
        // 클래식 컨셉2
        c2Safe10: '4번 🡹🡹🡹', // 알파, 동글
        c2Safe20: '2번 🡹🡹🡹', // 알파, 세모
        c2Safe30: '1번 🡹🡹🡹', // 알파, 네모
        c2Safe40: '3번 🡹🡹🡹', // 알파, 가위
        c2Safe11: '4번 🡻🡻🡻', // 베타, 동글
        c2Safe21: '2번 🡻🡻🡻', // 베타, 세모
        c2Safe31: '1번 🡻🡻🡻', // 베타, 네모
        c2Safe41: '3번 🡻🡻🡻', // 베타, 가위
      }
    },
    {
      id: 'P12S 알테마',
      type: 'StartsUsing',
      netRegex: { id: ['8682', '86F6'], source: 'Pallas Athena', capture: false },
      alertText: (data, _match, output) => {
        data.prsUltima = (data.prsUltima ?? 0) + 1;
        return output.text!({ num: data.prsUltima });
      },
      outputStrings: {
        text: '알테마#${num} 전체 공격',
      },
    },
    {
      id: 'P12S 팔라디언 그랩스 대상',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id === '01D4')
          data.prsPalladionGraps = matches.target;
      },
    },
    {
      id: 'P12S 팔라디언 그랩스',
      type: 'StartsUsing',
      netRegex: { id: '831A', source: 'Pallas Athena', capture: false },
      alertText: (data, _match, output) => {
        if (data.prsPalladionGraps === data.me)
          return output.tank!();
        return output.text!();
      },
      outputStrings: {
        tank: '맵 반쪽 탱크버스터! 무적으로!',
        text: '맵 반쪽 탱크버스터 피해요',
      },
    },
    {
      id: 'P12S 가이아오코스', // 두번옴. 참고로 작아지는 마커는 0061
      type: 'StartsUsing',
      netRegex: { id: '8326', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '전체 공격 + 작아져요',
      },
    },
    {
      id: 'P12S 가이아오코스 사슬',
      type: 'Tether',
      netRegex: { id: '0009' },
      // condition: (data) => data.prsPhase === 100 || data.prsPhase === 900,
      infoText: (data, matches, output) => {
        if (matches.source !== data.me && matches.target !== data.me)
          return;
        const partner = matches.source === data.me ? matches.target : matches.source;
        return output.breakWith!({ partner: data.party.prJob(partner) });
      },
      outputStrings: {
        breakWith: '사슬 끊어요! (${partner})',
      }
    },
    {
      id: 'P12S 지오센트리즘',
      type: 'StartsUsing',
      netRegex: { id: ['8329', '832A', '832B'], source: 'Pallas Athena' },
      durationSeconds: 6,
      alertText: (_data, matches, output) => {
        const geomap: { [id: string]: string } = {
          '8329': output.vertical!(),
          '832A': output.donut!(),
          '832B': output.horizontal!(),
        };
        const layout = geomap[matches.id] ?? output.unknown!();
        return output.text!({ layout: layout });
      },
      outputStrings: {
        text: '전체 공격 + 흩어져요: ${layout}',
        vertical: '||',
        donut: '◎',
        horizontal: '〓',
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S 클래식 컨셉 플스 마커',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        const playstationMarkerMap: { [id: string]: TypePlaystation } = {
          '016F': 'circle',
          '0170': 'triangle',
          '0171': 'square',
          '0172': 'cross',
        };
        const marker = playstationMarkerMap[id];
        if (marker === undefined)
          return;
        data.prsClassicMarker[matches.target] = marker;
      },
    },
    {
      id: 'P12S 클래식 컨셉 알파 베타',
      type: 'GainsEffect',
      netRegex: { effectId: ['DE8', 'DE9'] },
      run: (data, matches) => data.prsClassicAlphaBeta[matches.target] = matches.effectId === 'DE8' ? 'alpha' : 'beta',
    },
    {
      id: 'P12S 클래식 컨셉 반전',
      type: 'StartsUsing',
      netRegex: { id: '8331', source: 'Pallas Athena', capture: false },
      condition: (data) => data.prsPhase !== 200,
      delaySeconds: 12,
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.revert!(),
      outputStrings: {
        revert: '반대로 가야 해요',
      },
    },
    {
      id: 'P12S 클래식 컨셉 알랴줌',
      type: 'Ability',
      netRegex: { id: '8331', source: 'Pallas Athena', capture: false },
      delaySeconds: 2,
      durationSeconds: (data) => data.prsPhase === 200 ? 9 : 16,
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        const myPs = data.prsClassicMarker[data.me];
        const myAb = data.prsClassicAlphaBeta[data.me];
        if (myPs === undefined || myAb === undefined)
          return;

        const outPs = output[myPs]!();
        const outAb = output[myAb]!();
        return output.text!({ ps: outPs, ab: outAb });
      },
      outputStrings: {
        text: '${ps} + ${ab}',
        circle: '1번⚪',
        triangle: '3번⨻',
        square: '4번⬜',
        cross: '2번❌',
        alpha: '알파 🟥삼각',
        beta: '베타 🟨사각',
      },
    },
    {
      id: 'P12S 클래식 컨셉 피해욧',
      type: 'Ability',
      netRegex: { id: '8323', source: 'Pallas Athena', capture: false },
      delaySeconds: 2.5,
      durationSeconds: 4,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '피해욧',
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
        tank: '탱크버스터! 에스나 받아욧',
        healer: '탱크버스터! 에스나 준비해욧',
      },
    },
    {
      id: 'P12S 칼로리1 첫 불',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== '012F')
          return;
        data.prsCaloric1First.push(matches.target);
      },
    },
    {
      id: 'P12S 칼로리1 시작',
      type: 'StartsUsing',
      netRegex: { id: '8338', source: 'Pallas Athena', capture: false },
      condition: (data) => data.prsPhase === 300,
      preRun: (data) => {
        data.prsCaloric1Buff = {};
        data.prsCaloric1Mine = undefined;
      },
      delaySeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.prsCaloric1First.length !== 2)
          return;
        const index = data.prsCaloric1First.indexOf(data.me);
        if (index < 0)
          return;

        const partner = index === 0 ? 1 : 0;
        return output.text1st!({ partner: data.party.prJob(data.prsCaloric1First[partner]) });
      },
      outputStrings: {
        text1st: '내게 첫 불 (${partner})',
      }
    },
    {
      id: 'P12S 칼로릭1 바람', // 바람: Atmosfaction
      type: 'GainsEffect',
      netRegex: { effectId: 'E07' },
      run: (data, matches) => data.prsCaloric1Buff[matches.target] = 'wind',
    },
    {
      id: 'P12S 칼로릭1 불', // 불: Pyrefaction
      type: 'GainsEffect',
      netRegex: { effectId: 'E06' },
      alertText: (data, matches, output) => {
        data.prsCaloric1Buff[matches.target] = 'fire';

        const duration = parseInt(matches.duration);
        if (duration === 11 && matches.target === data.me)
          return output.text!();
      },
      outputStrings: {
        text: '또다시 불! 무직이랑 뭉쳐요',
      },
    },
    {
      id: 'P12S 칼로릭1 불 터짐',
      type: 'GainsEffect',
      netRegex: { effectId: ['E06'] },
      condition: (_data, matches) => parseInt(matches.duration) === 12,
      delaySeconds: 12.8,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.prsCaloric1Mine === 'fire' && data.prsCaloric1Buff[data.me] === undefined)
          return output.none!();
        if (data.prsCaloric1Mine === 'wind')
          return output.wind!();
      },
      outputStrings: {
        none: '무직! 불이랑 뭉쳐요!',
        wind: '바람! 흩어져요!',
      }
    },
    {
      id: 'P12S 칼로리1 버프 확인',
      type: 'Ability',
      netRegex: { id: '8338', source: 'Pallas Athena', capture: false },
      condition: (data) => data.prsPhase === 300,
      delaySeconds: 2,
      durationSeconds: 8,
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        const mystat = data.prsCaloric1Buff[data.me];
        data.prsCaloric1Mine = mystat;
        if (mystat === undefined)
          return;

        if (mystat === 'fire') {
          const myteam : string[] = [];
          for (const [name, stat] of Object.entries(data.prsCaloric1Buff)) {
            if (stat === mystat && name !== data.me)
              myteam.push(data.party.prJob(name));
          }
          return output.fire!({ team: myteam.sort().join(', ') });
        }

        if (data.prsCaloric1First.includes(data.me))
          return output.wind1st!();

        const myteam : string[] = [];
        for (const [name, stat] of Object.entries(data.prsCaloric1Buff)) {
          if (stat === mystat && name !== data.me && !data.prsCaloric1First.includes(name))
            myteam.push(data.party.prJob(name));
        }
        return output.wind!({ team: myteam.sort().join(', ') });
      },
      run: (data) => {
        data.prsCaloric1First = [];
        data.prsCaloric1Buff = {};
      },
      outputStrings: {
        fire: '내게 불 (${team})',
        wind: '내게 바람 (${team})',
        wind1st: '바람, 살짝 옆으로',
      },
    },
    {
      id: 'P12S 칼로리2 불',
      type: 'HeadMarker',
      netRegex: {},
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== '01D6')
          return;
        data.prsCaloric2Fire = matches.target;
        if (data.me === matches.target)
          return output.text!();
        if (data.prsPalladionGraps === data.me)
          return output.mt!({ target: data.party.prJob(matches.target) });
      },
      outputStrings: {
        text: '내게 첫 불! 가운데로',
        mt: '불 교대: ${target}',
      }
    },
    {
      id: 'P12S 칼로리2 바람',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== '01D5')
          return;
        return output.text!();
      },
      outputStrings: {
        text: '내게 바람, 흩어져요',
      }
    },
    {
      id: 'P12S 칼로릭2 불 장판',
      type: 'GainsEffect',
      netRegex: { effectId: ['E08'] },
      durationSeconds: 3,
      infoText: (data, matches, output) => {
        if (matches.target === data.me && data.prsCaloric2Fire !== data.me)
          return output.text!();
      },
      run: (data, matches) => data.prsCaloric2Fire = matches.target,
      outputStrings: {
        text: '내게 불 장판',
      }
    },
    {
      id: 'P12S 칼로릭2 옮겨욧',
      type: 'Ability',
      netRegex: { id: '833C', source: 'Pallas Athena', capture: false },
      condition: (data) => data.prsPhase === 700,
      alertText: (data, _matches, output) => {
        if (data.me === data.prsCaloric2Fire)
          return output.text!();
      },
      outputStrings: {
        text: '불 옮겨욧!',
      }
    },
    {
      id: 'P12S 에크파이로시스',
      type: 'StartsUsing',
      netRegex: { id: '831E', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '엑사플레어 + 전체 공격',
      }
    },
    {
      id: 'P12S 에크파이로시스 움직여',
      type: 'GainsEffect',
      netRegex: { effectId: '8322', source: 'Pallas Athena', capture: false },
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '흩어져욧! 달려욧!',
      }
    },
    {
      id: 'P12S 판제네시스',
      type: 'Ability',
      netRegex: { id: '833F', source: 'Pallas Athena', capture: false },
      delaySeconds: 1,
      durationSeconds: 10,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
         let partner = output.unknown!();
        // 무직, 인자1
        const mycnt = data.prsPangenesisCount[data.me] ?? 0;
        if (mycnt < 2) {
          for (const [name, cnt] of Object.entries(data.prsPangenesisCount)) {
            if (cnt === mycnt && name !== data.me) {
              partner = data.party.prJob(name);
              break;
            }
          }
          return mycnt === 0 ? output.slime!({ partner: partner }) : output.geneone!({ partner: partner });
        }
        // 시간에 따른 처리
        const mystat = data.prsPangenesisStat[data.me];
        const myduration = data.prsPangenesisDuration[data.me];
        if (mystat === undefined || myduration === undefined)
          return;
        for (const [name, duration] of Object.entries(data.prsPangenesisDuration)) {
          if (duration === myduration && name !== data.me) {
            partner = data.party.prJob(name);
            break;
          }
        }
        if (myduration < 18)
          return output.tower1st!({ color: output[mystat]!(), partner: partner });
        return output.tower2nd!({ color: output[mystat]!(), partner: partner });
      },
      run: (data) => data.prsSeenPangenesis = true,
      outputStrings: {
        tower1st: '빠른: 첫 ${color} 타워 (${partner})',
        tower2nd: '느림: 둘째🡻 ${color} 타워 (${partner})',
        geneone: '인자1: 첫 타워 (${partner} / 살짝 위로)',
        slime: '무직: 둘째🡹 타워 (${partner} / 살짝 아래로)',
        astral: '🟡하얀', // 색깔 바뀜
        umbral: '🟣검은', // 색깔 바뀜
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S 판제네시스 언스테이블',
      type: 'GainsEffect',
      netRegex: { effectId: 'E09' },
      run: (data, matches) => {
        const cnt = data.prsPangenesisCount[matches.target];
        data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
      }
    },
    {
      id: 'P12S 판제네시스 스테이블',
      type: 'GainsEffect',
      netRegex: { effectId: 'E22' },
      run: (data, matches) => {
        const cnt = data.prsPangenesisCount[matches.target];
        if (cnt === undefined)
          data.prsPangenesisCount[matches.target] = 0;
      }
    },
    {
      id: 'P12S 판제네시스 라이트', // Umbral Tilt
      type: 'GainsEffect',
      netRegex: { effectId: 'DF8' },
      condition: (data) => data.prsPhase === 500,
      run: (data, matches) => {
        if (!data.prsSeenPangenesis) {
          const cnt = data.prsPangenesisCount[matches.target];
          data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
          data.prsPangenesisDuration[matches.target] = parseFloat(matches.duration);
        }
        data.prsPangenesisStat[matches.target] = 'umbral';
      },
    },
    {
      id: 'P12S 판제네시스 다크', // Astral Tilt
      type: 'GainsEffect',
      netRegex: { effectId: 'DF9' },
      condition: (data) => data.prsPhase === 500,
      run: (data, matches) => {
        if (!data.prsSeenPangenesis) {
          const cnt = data.prsPangenesisCount[matches.target];
          data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
          data.prsPangenesisDuration[matches.target] = parseFloat(matches.duration);
        }
        data.prsPangenesisStat[matches.target] = 'astral';
      },
    },
    {
      id: 'P12S 판제네시스 이동', // Astral Advent
      type: 'Ability',
      netRegex: { id: '8344', source: 'Hemitheos', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 4,
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        data.prsPangenesisTilt = (data.prsPangenesisTilt ?? 0) + 1;
        const tilt = data.prsPangenesisTilt;

        const mycnt = data.prsPangenesisCount[data.me] ?? 0;
        const mystat = data.prsPangenesisStat[data.me];
        const myduration = data.prsPangenesisDuration[data.me] ?? 0;

        if (tilt === 1) {
          if (myduration === 16 || mycnt === 1)
            return mystat === undefined ? output.move!() : output.movecc!({ color: output[mystat]!() });
          if (myduration === 20)
            return mystat === undefined ? output.wait1g!() : output.wait1gcc!({ color: output[mystat]!() });
          if (mycnt === 0)
            return output.wait1n!();
        } else if (tilt === 2) {
          // 모두 다 이동
          return mystat === undefined ? output.move!() : output.movecc!({ color: output[mystat]!() });
        } else if (tilt === 3) {
          // 무직만 슬라임
          if (mycnt === 0)
            return output.slime!();
          return output.end!();
        }
      },
      run: (data) => {
        if (data.prsPangenesisTilt && data.prsPangenesisTilt >= 3) {
          data.prsPangenesisCount = {};
          data.prsPangenesisStat = {};
          data.prsPangenesisDuration = {};
          delete data.prsPangenesisTilt;
        }
      },
      outputStrings: {
        move: '다음 타워로',
        movecc: '다음 ${color} 타워로',
        end: '끝! 남쪽으로',
        slime: '끝이지만 무직! 슬라임 유도',
        wait1n: '둘째🡹 타워 나올 곳으로',
        wait1g: '둘째🡻 타워 나올 곳으로',
        wait1gcc: '둘째🡻 ${color} 타워 나올 곳으로',
        astral: '🟡하얀', // 색깔 바뀜
        umbral: '🟣검은', // 색깔 바뀜
      },
    },
    /*
    {
      id: 'P12S 마커 처리',
      type: 'HeadMarker',
      netRegex: {},
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        // 01D4 팔라디언 그랩스 대상자
        // 0061 작아지는 거
        // 0016 작아진 담에 지오센트리즘 개별 장판
        // 016F/0170/0171/0172 각각 🔴▲🟪❌
        // 012F 칼로릭1 첫불
        // 01D5 칼로릭2 바람
        // 01D6 칼로릭2 불
        const excludes: string[] = [
          '01D4', '0061', '0016',
          '016F', '0170', '0171', '0172',
          '012F', '01D5', '01D6',
        ];
        if (excludes.includes(id))
          return;
        return output.text!({ who: matches.target, num: id, org: matches.id });
      },
      outputStrings: {
        text: '${who} => ${num} (${org})',
      },
    },
    */
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
