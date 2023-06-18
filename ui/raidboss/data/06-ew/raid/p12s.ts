import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: north / south laser add call for first Paradeigma
// TODO: second paradeigma tether/tower debuff?
// TODO: laser add call (inner west / inner east?) for second Paradeigma
// TODO: glaukopis tank swap call
// TODO: glaukopis tank swap after 2nd hit (if different person took both)
// TODO: tether/tower/saltire/cross debuffs for third Paradeigma (and partners for towers?)
// TODO: light/dark tower call for third Paradeigma (+ taking towers, baiting adds, etc)
// TODO: add phase dash calls?? (maybe this is overkill)
// TODO: Superchain 1 debuff triggers (maybe combine with existing triggers?)
// TODO: Superchain 2B
// TODO: final Sample safe spot

export type PlaystationMarker = 'circle' | 'cross' | 'triangle' | 'square';

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

const engravementIdMap = {
  lightTilt: 'DF8',
  darkTilt: 'DF9',
  lightTower: 'DFB',
  darkTower: 'DFC',
  lightBeam: 'DFD',
  darkBeam: 'DFE',
  crossMarked: 'DFF',
  xMarked: 'E00',
};
const engravementLabelMap = Object.fromEntries(
  Object.entries(engravementIdMap).map(([k, v]) => [v, k]),
);
const engravementBeamIds = [engravementIdMap.lightBeam, engravementIdMap.darkBeam];
const engravementTowerIds = [engravementIdMap.lightTower, engravementIdMap.darkTower];
const engravementTiltIds = [engravementIdMap.lightTilt, engravementIdMap.darkTilt];
const engravement3TheosSoulIds = [engravementIdMap.crossMarked, engravementIdMap.xMarked];

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
  prsStyle?: boolean;
  prsPhase: number;
  // 전반
  prsTrinityInvul?: boolean;
  prsParadeigmaTower?: 'umbral' | 'astral' | 'unknown';
  // 후반
  prsPalladionGraps?: string;
  prsUltima?: number;
  prsClassicMarker: { [name: string]: PlaystationMarker };
  prsClassicAlphaBeta: { [name: string]: 'alpha' | 'beta' };
  prsCaloricFirst: string[];
  prsCaloricBuff: { [name: string]: 'fire' | 'wind' };
  prsCaloricMine?: 'fire' | 'wind';
  prsCaloricFire?: string;
  prsSeenPangenesis?: boolean;
  prsPangenesisCount: { [name: string]: number };
  prsPangenesisStat: { [name: string]: 'dark' | 'light' };
  prsPangenesisDuration: { [name: string]: number };
  prsPangenesisTilt?: number;
  //
  decOffset?: number;
  expectedFirstHeadmarker?: string;
  isDoorBoss: boolean;
  phase?: 'superchain1' | 'palladion' | 'superchain2a' | 'superchain2b';
  engravementCounter: number;
  engravement1Towers: string[];
  engravement3TowerType?: string;
  engravement3TowerPlayers: string[];
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
  timelineFile: 'p12s.txt',
  initData: () => {
    return {
      prsPhase: 0,
      prsClassicMarker: {},
      prsClassicAlphaBeta: {},
      prsCaloricFirst: [],
      prsCaloricBuff: {},
      prsPangenesisCount: {},
      prsPangenesisStat: {},
      prsPangenesisDuration: {},
      //
      isDoorBoss: true,
      engravementCounter: 0,
      engravement1Towers: [],
      engravement3TowerPlayers: [],
      wingCollect: [],
      wingCalls: [],
      superchainCollect: [],
      whiteFlameCounter: 0,
    };
  },
  timelineTriggers: [
    {
      id: 'P12S+ 트리니티 처음에 무적',
      regex: /Trinity of Souls 1/,
      beforeSeconds: 3,
      condition: (data) => data.role === 'tank' && !data.prsTrinityInvul,
      alertText: '무적으로 받아요',
      run: (data) => data.prsTrinityInvul = true,
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

        data.prsPhase += 10;
        data.prsParadeigmaTower = 'unknown';
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
      id: 'P12S First Wing',
      type: 'StartsUsing',
      netRegex: { id: ['82E7', '82E8', '82E1', '82E2'], source: 'Athena' },
      durationSeconds: 8,
      alertText: (data, matches, output) => {
        data.wingCollect = [];
        data.wingCalls = [];
        const isLeftAttack = matches.id === '82E8' || matches.id === '82E2';

        // Normal wings.
        const firstDir = data.superchain2aFirstDir;
        const secondDir = data.superchain2aSecondDir;
        if (data.phase !== 'superchain2a' || firstDir === undefined || secondDir === undefined)
          return isLeftAttack ? output.right!() : output.left!();

        //
        if (data.prsStyle) {
          const lrs = isLeftAttack ? output.prsRight!() : output.prsLeft!();
          if (firstDir === 'north') {
            if (secondDir === 'north')
              return output.prsc2aNn!({ dir: lrs });
            return output.prsc2aNs!({ dir: lrs });
          }
          if (secondDir === 'north')
            return output.prsc2aSn!({ dir: lrs });
          return output.prsc2aSs!({ dir: lrs });
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
      tts: (data) => {
        const firstDir = data.superchain2aFirstDir;
        const secondDir = data.superchain2aSecondDir;
        if (data.phase !== 'superchain2a' || firstDir === undefined || secondDir === undefined)
          return;
        return firstDir === secondDir ? 'もどります' : 'すすみます';
      },
      outputStrings: {
        left: '❰❰❰❰❰왼쪽',
        right: '오른쪽❱❱❱❱❱',
        // This could *also* say partners, but it's always partners and that feels like
        // too much information.  The "after" call could be in an info text or something,
        // but the wings are also calling out info text too.  This is a compromise.
        // Sorry also for spelling this out so explicitly, but I suspect some people
        // might want different left/right calls based on North/South boss facing
        // and it's nice to have a "go through" or "go back" description too.
        superchain2aLeftNorthNorth: {
          en: '북쪽 + 왼쪽 => 북쪽',
        },
        superchain2aLeftNorthSouth: {
          en: '북쪽 + 왼쪽 => 남쪽',
        },
        superchain2aLeftSouthNorth: {
          en: '남쪽 + 왼쪽 => 북쪽',
        },
        superchain2aLeftSouthSouth: {
          en: '남쪽 + 왼쪽 => 남쪽',
        },
        superchain2aRightNorthNorth: {
          en: '북쪽 + 오른쪽 => 북쪽',
        },
        superchain2aRightNorthSouth: {
          en: '북쪽 + 오른쪽 => 남쪽',
        },
        superchain2aRightSouthNorth: {
          en: '남쪽 + 오른쪽 => 북쪽',
        },
        superchain2aRightSouthSouth: {
          en: '남쪽 + 오른쪽 => 남쪽',
        },
        //
        prsc2aNn: '북쪽 => 다시 북쪽 [${dir}]',
        prsc2aNs: '북쪽 => 전진해서 남쪽 [${dir}]',
        prsc2aSs: '남쪽 => 다시 남쪽 [${dir}]',
        prsc2aSn: '남쪽 => 전진해서 북쪽 [${dir}]',
        prsLeft: Outputs.left,
        prsRight: Outputs.right,
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
          en: '옆자리',
          de: 'Wechseln',
          fr: 'Swap',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          ko: '가만히',
        },
        secondWingCallStay: {
          en: '(그대로)',
          de: '(bleib Stehen)',
          fr: '(restez)',
          ko: '(가만히)',
        },
        secondWingCallSwap: {
          en: '(옆자리로 이동)',
          de: '(Wechseln)',
          fr: '(swap)',
          ko: '(이동)',
        },
        allThreeWings: {
          en: '${first} => ${second} => ${third}',
          de: '${first} => ${second} => ${third}',
          fr: '${first} => ${second} => ${third}',
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
        if (call === 'stay')
          return output.stay!();
        }

        // Second wing call (when middle) during Superchain IIA.
        const isSecondWing = data.wingCalls.length === 1;
        const finalDir = secondDir === 'north' ? output.north!() : output.south!();
        if (isSecondWing) {
          const isReturnBack = firstDir === secondDir;
          //
          if (data.prsStyle) {
            const move = call === 'swap' ? output.swap!() : output.stay!();
            if (isReturnBack)
              return output.prsc2aMb!({ move: move });
            return output.prsc2aMg!({ move: move });
          }
          //
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
        //
        if (data.prsStyle) {
          const move = call === 'swap' ? output.swap!() : output.stay!();
          if (firstDir === secondDir) {
            if (isProtean)
              return output.prsc2aBpro!({ move: move });
            return output.prsc2aBtwo!({ move: move });
          }
          if (isProtean)
            return output.prsc2aGpro!({ move: move });
          return output.prsc2aGtwo!({ move: move });
        }
        //
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
          en: '옆자리로 이동',
          de: 'Wechseln',
          fr: 'Swap',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          ko: '가만히',
        },
        superchain2aSwapMidBack: {
          en: '옆자리 + 한가운데 => ${dir} 뒤로',
        },
        superchain2aSwapMidGo: {
          en: '옆자리 + 한가운데 => ${dir}으로',
        },
        superchain2aStayMidBack: {
          en: '그대로 + 한가운데 => ${dir} 뒤로',
        },
        superchain2aStayMidGo: {
          en: '그대로 + 한가운데 => ${dir}으로',
        },
        superchain2aSwapProtean: {
          en: '옆자리 => 프로틴 + ${dir}',
        },
        superchain2aStayProtean: {
          en: '그대로 => 프로틴 + ${dir}',
        },
        superchain2aSwapPartners: {
          en: '옆자리 => 페어 + ${dir}',
        },
        superchain2aStayPartners: {
          en: '그대로 => 페어 + ${dir}',
        },
        north: Outputs.north,
        south: Outputs.south,
        //
        prsc2aMb: '한가운데로 => 되돌아 가욧 [${move}]',
        prsc2aMg: '한가운데로 => 계속 전진 [${move}]',
        prsc2aBpro: '되돌아 와서 + 프로틴 [${move}]',
        prsc2aBtwo: '되돌아 와서 + 페어 [${move}]',
        prsc2aGpro: '전진해서 + 프로틴 [${move}]',
        prsc2aGtwo: '전진해서 + 페어 [${move}]',
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
        },
        partners: {
          en: '페어! 둘이 함께',
        },
      },
    },
    {
      id: 'P12S Engravement of Souls Tracker',
      type: 'Ability',
      netRegex: { id: '8305', source: 'Athena', capture: false },
      run: (data) => ++data.engravementCounter,
    },
    // In Engravement 1 (Paradeigma 2), 2 players receive lightTower and 2 players receive darkTower.
    // When debuffs expire and towers drop, their debuff changes to lightTilt or darkTilt (same as tower color).
    // At the same time the towers drop, the 4 tethered players receive lightTilt or darkTilt depending on their tether color.
    {
      id: 'P12S Engravement 1 Tower Drop',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTowerIds },
      condition: (data) => data.engravementCounter === 1,
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (data, matches, output) => {
        data.engravement1Towers.push(matches.target);
        if (data.me === matches.target) {
          if (matches.effectId === engravementIdMap.lightTower)
            return output.lightTower!();
          return output.darkTower!();
        }
      },
      outputStrings: {
        lightTower: {
          en: '🟡타워 설치',
        },
        darkTower: {
          en: '🟣타워 설치',
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
        if (data.engravement1Towers.indexOf(data.me) === -1) {
          // Did not drop a tower, so needs to soak one.
          if (matches.effectId === engravementIdMap.lightTilt)
            return output.lightTilt!();
          return output.darkTilt!();
        }
      },
      outputStrings: {
        lightTilt: {
          en: '🟣밟아요',
        },
        darkTilt: {
          en: '🟡밟아요',
        },
      },
    },
    // In Engravement 2 (Superchain 1), all supports or  DPS will receive lightTilt and darkTilt (2 each).
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
      id: 'P12S Engravement 2 Beam Soak',
      type: 'GainsEffect',
      netRegex: { effectId: Object.values(engravementIdMap) },
      condition: (data, matches) => data.engravementCounter === 2 && data.me === matches.target,
      delaySeconds: 5, // wait until first orb resolves so as not to confuse
      durationSeconds: 7, // keep active until beams go off
      suppressSeconds: 30,
      response: (_data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          lightBeam: {
            en: '오른쪽❱❱❱❱❱ => 🟣밟아요',
          },
          darkBeam: {
            en: '❰❰❰❰❰왼쪽 => 🟡밟아요',
          },
          lightTower: {
            en: '❰❰❰❰❰왼쪽 => 🟡타워 설치',
          },
          darkTower: {
            en: '오른쪽❱❱❱❱❱ => 🟣타워 설치',
          },
          lightTilt: {
            en: '❰❰❰❰❰왼쪽 => 흩어져요',
          },
          darkTilt: {
            en: '오른쪽❱❱❱❱❱ => 흩어져요',
          },
        };

        const engraveLabel = engravementLabelMap[matches.effectId];
        if (engraveLabel === undefined)
          return;
        const engraveOutputStr = output[engraveLabel]!();
        if (engraveOutputStr === undefined)
          return;
        if (engravementBeamIds.indexOf(matches.effectId) !== -1)
          return { alarmText: engraveOutputStr };
        return { infoText: engraveOutputStr };
      },
    },
    // darkTower/lightTower are 20s, but lightBeam/darkBeam are shorter and swap to lightTilt/darkTilt before the mechanic resolves.
    // So use a fixed delay rather than one based on effect duration.
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
        const engraveOutputStr = output[engraveLabel]!();
        if (engraveOutputStr === undefined)
          return;
        return engraveOutputStr;
      },
      outputStrings: {
        lightBeam: {
          en: '오른쪽 🟣밟아요',
        },
        darkBeam: {
          en: '왼쪽 🟡밟아요',
        },
        lightTower: {
          en: '왼쪽 🟡타워 설치',
        },
        darkTower: {
          en: '오른쪽 🟣타워 설치',
        },
      },
    },
    {
      id: 'P12S Engravement 2 Heavensflame Soul',
      type: 'GainsEffect',
      netRegex: { effectId: 'DFA' },
      condition: (data, matches) => data.engravementCounter === 2 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      response: Responses.spread(),
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
        const mark = matches.effectId === engravementIdMap.crossMarked ? '➕ 북쪽으로' : '❌ 남쪽으로';
        return output.theosDebuff!({ mark: mark });
      },
      outputStrings: {
        theosDebuff: {
          en: '내게 ${mark}',
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
        const mark = matches.effectId === engravementIdMap.crossMarked ? '➕ 모서리에' : '❌ 가운데';
        return output.dropBait!({ mark: mark });
      },
      outputStrings: {
        dropBait: {
          en: '${mark} 설치',
        },
      },
    },
    {
      id: 'P12S Engravement 3 Theos Bait Adds',
      type: 'GainsEffect',
      netRegex: { effectId: engravement3TheosSoulIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.baitCleave!(),
      outputStrings: {
        baitCleave: {
          en: '천사 레이저 유도',
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
        data.engravement3TowerType = engravementLabelMap[matches.effectId];
      },
    },
    {
      id: 'P12S Engravement 3 Towers Initial',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTowerIds, capture: false },
      condition: (data) => data.engravementCounter === 3,
      delaySeconds: 0.3,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          towerOnYou: {
            en: '내게 ${color} 타워 (+${partner})',
          },
          towerLater: {
            en: '들어갈 곳: ${color} 타워',
          },
          light: {
            en: '🟡',
          },
          dark: {
            en: '🟣',
          },
          unknown: Outputs.unknown,
        };
        const towerOnYou = data.engravement3TowerPlayers.indexOf(data.me) !== -1;
        let towerColor = output.unknown!();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light!()
            : output.dark!();
        let partner;
        if (towerOnYou) {
          partner = data.ShortName(data.engravement3TowerPlayers.find((name) =>
            name !== data.me
          )) ?? output.unknown!();
          return { alertText: output.towerOnYou!({ color: towerColor, partner: partner }) };
        } else if (data.party.isDPS(data.me)) {
          // DPS want to know tower color to know if they are soaking or baiting add cleaves later
          return { alertText: output.towerLater!({ color: towerColor }) };
        }
      },
    },
    {
      id: 'P12S Engravement 3 Towers Drop',
      type: 'GainsEffect',
      netRegex: { effectId: engravementTowerIds },
      condition: (data, matches) => data.engravementCounter === 3 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      alertText: (data, _matches, output) => {
        let towerColor = output.unknown!();
        if (data.engravement3TowerType !== undefined)
          towerColor = data.engravement3TowerType === 'lightTower'
            ? output.light!()
            : output.dark!();
        return output.dropTower!({ color: towerColor });
      },
      outputStrings: {
        dropTower: {
          en: '${color}쪽에 설치',
        },
        light: {
          en: '🟪',
        },
        dark: {
          en: '🟨',
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
        if (data.engravement3TowerPlayers.indexOf(data.me) !== -1)
          return;

        const soakMap: { [key: string]: string } = {
          lightTower: 'darkTilt',
          darkTower: 'lightTilt',
        };
        const myEffect = engravementLabelMap[matches.effectId];
        if (myEffect === undefined || data.engravement3TowerType === undefined)
          return;
        const soakers = soakMap[data.engravement3TowerType];
        if (soakers === undefined)
          return;

        const towerColor = data.engravement3TowerType === 'lightTower'
          ? output.light!()
          : output.dark!();
        if (myEffect === soakers)
          return output.soakTower!({ color: towerColor });
        return output.baitCleaves!();
      },
      outputStrings: {
        soakTower: {
          en: '${color}타워 밟아요',
        },
        baitCleaves: {
          en: '레이저 유도',
        },
        light: {
          en: '🟡',
        },
        dark: {
          en: '🟣',
        },
      },
    },
    {
      id: 'P12S Peridialogos',
      type: 'StartsUsing',
      netRegex: { id: '82FF', source: 'Athena', capture: false },
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tanksInPartyOut!() : output.partyOutTanksIn!(),
      outputStrings: {
        partyOutTanksIn: {
          en: '바깥으로 (탱크가 안쪽)',
          de: 'Gruppe Raus (Tanks Rein)',
          fr: 'Équipe à l\'extérieur (Tanks à l\'intérieur)',
          ko: '본대 밖 (탱커 안)',
        },
        tanksInPartyOut: {
          en: '안쪽으로 (파티가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Tanks à l\'intérieur (Équipe à l\'extérieur',
          ko: '탱커 안 (본대 밖)',
        },
      },
    },
    {
      id: 'P12S Apodialogos',
      type: 'StartsUsing',
      netRegex: { id: '82FE', source: 'Athena', capture: false },
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tanksInPartyOut!() : output.partyInTanksOut!(),
      outputStrings: {
        partyInTanksOut: {
          en: '안쪽으로 (탱크가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Équipe à l\'intérieur (Tanks à l\'extérieur)',
          ko: '본대 안 (탱커 밖)',
        },
        tanksInPartyOut: {
          en: '바깥으로 (파티가 안쪽)',
          de: 'Tanks Raus (Gruppe Rein)',
          fr: 'Tanks à l\'extérieur (Équipe à l\'intérieur',
          ko: '탱커 밖 (본대 안)',
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
        if (data.prsStyle)
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
      durationSeconds: 3,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: '레이저 유도! 안쪽으로!',
            de: 'Laser Ködern',
            fr: 'Bait le laser',
            ko: '레이저 유도',
          },
          firstWhiteFlame: {
            en: '(5, 7 레이저 유도)',
            de: '(5 und 7 ködern)',
            fr: '(5 et 7 bait)',
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
            ko: '레이저 유도',
          },
          secondWhiteFlame: {
            en: '(6, 8 레이저 유도)',
            de: '(6 und 8 ködern)',
            fr: '(6 et 8 bait)',
            ko: '(6, 8 레이저)',
          },
          thirdWhiteFlame: {
            en: '(1, 3 레이저 유도)',
            de: '(1 und 3 ködern)',
            fr: '(1 et 3 bait)',
            ko: '(1, 3 레이저)',
          },
          fourthWhiteFlame: {
            en: '(2, 4 레이저 유도)',
            de: '(2 und 6 ködern)',
            fr: '(2 et 4 bait)',
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

        //
        if (data.prsStyle) {
          if (inOut === superchainNpcBaseIdMap.in) {
            if (proteanPartner === superchainNpcBaseIdMap.protean)
              return output.prInPro!();
            return output.prInTwo!();
          }

          if (proteanPartner === superchainNpcBaseIdMap.protean)
            return output.prOutPro!();
          return output.prOutTwo!();
        }

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
          en: '안으로 + 프로틴: (${dir})',
          de: 'Rein + Himmelsrichtungen (${dir})',
          fr: 'Intérieur + Position (${dir})',
          ko: '안 + 8방향 산개 (${dir})',
        },
        inAndPartners: {
          en: '안으로 + 페어: (${dir})',
          de: 'Rein + Partner (${dir})',
          fr: 'Intérieur + Partenaire (${dir})',
          ko: '안 + 파트너 (${dir})',
        },
        outAndProtean: {
          en: '밖에서 + 프로틴: (${dir})',
          de: 'Raus + Himmelsrichtungen (${dir})',
          fr: 'Extérieur + Position (${dir})',
          ko: '밖 + 8방향 산개 (${dir})',
        },
        outAndPartners: {
          en: '밖에서 + 페어: (${dir})',
          de: 'Raus + Partner (${dir})',
          fr: 'Extérieur + Partenaire (${dir})',
          ko: '밖 + 파트너 (${dir})',
        },
        ...Directions.outputStrings8Dir,
        //
        prInPro: '안으로 + 프로틴',
        prInTwo: '안으로 + 페어',
        prOutPro: '밖에서 + 프로틴',
        prOutTwo: '밖에서 + 페어'
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

        const rotation = (thisDir - prevDir + 8) % 8;
        if (rotation === 2)
          return output.leftClockwise!();
        if (rotation === 6)
          return output.rightCounterclockwise!();
      },
      outputStrings: {
        // This is left and right facing the boss.
        // TODO: this should probably also say your debuff,
        // e.g. "Left (Dark Laser)" or "Right (Light Tower)" or something?
        leftClockwise: {
          en: '❰❰❰❰❰시계 방향',
          de: 'Links (im Uhrzeigersinn)',
          fr: 'Gauche (horaire)',
          ko: '왼쪽 (시계방향)',
        },
        rightCounterclockwise: {
          en: '반시계 방향❱❱❱❱❱',
          de: 'Rechts (gegen Uhrzeigersinn)',
          fr: 'Droite (Anti-horaire)',
          ko: '오른쪽 (반시계방향)',
        },
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
        if (donutDistSqr > sphereDistSqr)
          return output.inThenOut!();
        return output.outThenIn!();
      },
      outputStrings: {
        // TODO: this should also say to spread / place tower / take tower
        // TODO: maybe we need separate calls for these ^ after initial donut/sphere goes off?
        inThenOut: '안에 있다 => 밖으로',
        outThenIn: '밖에 있다 => 안으로',
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
    // --------------------- Phase 2 ------------------------
    {
      id: 'P12S Geocentrism Vertical',
      type: 'StartsUsing',
      netRegex: { id: '8329', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.prsStyle,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '세로로 흩어져요',
          de: 'Vertikal',
          fr: 'Vertical',
        },
      },
    },
    {
      id: 'P12S Geocentrism Circle',
      type: 'StartsUsing',
      netRegex: { id: '832A', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.prsStyle,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '동그라미로 흩어져요',
          de: 'Innerer Kreis',
          fr: 'Cercle intérieur',
        },
      },
    },
    {
      id: 'P12S Geocentrism Horizontal',
      type: 'StartsUsing',
      netRegex: { id: '832B', source: 'Pallas Athena', capture: false },
      condition: (data) => !data.prsStyle,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '가로로 흩어져요',
          de: 'Horizontal',
          fr: 'Horizontal',
        },
      },
    },
    // --------------------- PRT 전반 ---------------------
    {
      id: 'P12S 글라우코피스',
      type: 'StartsUsing',
      netRegex: { id: '82FC', capture: false },
      condition: (data) => data.role === 'tank',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '탱크 스위치!',
      },
    },
    {
      id: 'P12S 파라데이그마',
      type: 'StartsUsing',
      netRegex: { id: '82ED', capture: false },
      run: (data) => data.prsPhase++,
    },
    {
      id: 'P12S 줄다리기 보라',
      type: 'Tether',
      netRegex: { id: ['00FB', '00EA'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      suppressSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '🟪 줄 땡겨요',
      }
    },
    {
      id: 'P12S 줄다리기 노랑',
      type: 'Tether',
      netRegex: { id: '00E9' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      suppressSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '🟨 줄 땡겨요',
      }
    },
    /* 대신 사용: Engravement 1 시리즈
    {
      id: 'P12S 첫번째 줄다리기 + 바닥',
      type: 'GainsEffect',
      netRegex: { effectId: ['DFB', 'DFC'] },
      condition: (data, matches) => data.prsPhase === 2 && matches.target === data.me,
      infoText: (_data, matches, output) => {
        if (matches.effectId === 'DFB')
          return output.twUbSoul!();
        if (matches.effectId === 'DFC')
          return output.twAbSoul!();
      },
      outputStrings: {
        twUbSoul: '🟡타워',
        twAbSoul: '🟣타워',
      }
    },
    */
   /* 대신 사용 : Engravement 2 시리즈
    {
      id: 'P12S 슈퍼체인 이펙트',
      type: 'GainsEffect',
      // DF8:Umbral Tilt 하얀 동글
      // DF9:Astral Tilt 보라 동글
      // DFA:Heavensflame Soul
      // DFB:Umbralbright Soul      타워 설치
      // DFC:Astralbright Soul      타워 설치
      // DFD:Umbralstrong Soul
      // DFE:Astralstrong Soul
      netRegex: { effectId: ['DF8', 'DF9', 'DFB', 'DFC', 'DFD', 'DFE'] },
      condition: (data, matches) => data.prsPhase === 12 && matches.target === data.me,
      delaySeconds: 4,
      durationSeconds: 18,
      suppressSeconds: 23,
      infoText: (_data, matches, output) => {
        const mesgs: { [eid: string]: string } = {
          'DF8': output.umbTilt!(),
          'DF9': output.astTilt!(),
          'DFB': output.ubSoul!(),
          'DFC': output.abSoul!(),
          'DFD': output.usSoul!(),
          'DFE': output.asSoul!()
        };
        return mesgs[matches.effectId];
      },
      outputStrings: {
        umbTilt: '❰❰❰❰❰왼쪽 => 도망가요',
        astTilt: '오른쪽❱❱❱❱❱ => 도망가요',
        ubSoul: '❰❰❰❰❰왼쪽 => 🟡타워 설치',
        abSoul: '오른쪽❱❱❱❱❱ => 🟣타워 설치',
        usSoul: '오른쪽❱❱❱❱❱ => 🟣밟아요',
        asSoul: '❰❰❰❰❰왼쪽 => 🟡밟아요',
      },
    },
    */
   /* 대신 사용: Engravement 3 시리즈
    {
      id: 'P12S 파라3 DPS 이펙트',
      type: 'GainsEffect',
      netRegex: { effectId: ['DF8', 'DF9'] },
      condition: (data, matches) => data.prsPhase === 13 && matches.target === data.me && data.role === 'dps',
      suppressSeconds: 12,
      alertText: (data, matches, output) => {
        if (matches.effectId === 'DF8')
          return data.prsParadeigmaTower === 'astral' ? output.umbTilt!() : output.bait!();
        if (matches.effectId === 'DF9')
          return data.prsParadeigmaTower === 'umbral' ? output.astTilt!() : output.bait!();
      },
      outputStrings: {
        umbTilt: '🟣타워 밟아요',
        astTilt: '🟡타워 밟아요',
        bait: '레이저 유도',
      },
    },
    {
      id: 'P12S 파라3 탱힐 이펙트',
      type: 'GainsEffect',
      netRegex: { effectId: ['DFB', 'DFC'] },
      condition: (data) => data.prsPhase === 13,
      durationSeconds: 9,
      infoText: (data, matches, output) => {
        if (matches.effectId === 'DFB') {
          data.prsParadeigmaTower = 'umbral'; // 노랑 타워
          if (matches.target === data.me)
            return output.ubSoul!();
        } else if (matches.effectId === 'DFC') {
          data.prsParadeigmaTower = 'astral'; // 보라 타워
          if (matches.target === data.me)
            return output.abSoul!();
        } else {
          data.prsParadeigmaTower = 'unknown';
        }
      },
      outputStrings: {
        ubSoul: '타워 밟고 🡺 🟪쪽에 설치 (🟡타워)', // 노랑
        abSoul: '타워 밟고 🡺 🟨쪽에 설치 (🟣타워)', // 보라
      },
    },
    {
      id: 'P12S 파라3 더하기',
      type: 'GainsEffect',
      netRegex: { effectId: 'DFF' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '북쪽  🡺 타워 밟고 🡺 모서리➕'
      },
    },
    {
      id: 'P12S 파라3 곱하기',
      type: 'GainsEffect',
      netRegex: { effectId: 'E00' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '남쪽 🡺 타워 밟고 🡺 가운데❌'
      },
    },
    */
    {
      id: 'P12S 테오의 알테마',
      type: 'StartsUsing',
      netRegex: { id: '82FA', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '엄청 아픈 전체 공격! 이러다 우리 다 주거!',
      },
    },
    // --------------------- PRT 후반 ---------------------
    {
      id: 'P12S2 페이즈 확인',
      type: 'StartsUsing',
      netRegex: { id: ['8326', '8331', '8338', '831E', '833F'], source: 'Pallas Athena' },
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
      id: 'P12S2 줄 서로 사슬',
      type: 'Tether',
      netRegex: { id: '0009' },
      infoText: (data, matches, output) => {
        if (data.prsPhase === 100) {
          // 가이아오코스 사슬
          if (matches.source !== data.me && matches.target !== data.me)
            return;
          const partner = matches.source === data.me ? matches.target : matches.source;
          return output.breakWith!({ partner: data.ShortName(partner) });
        }
      },
      outputStrings: {
        breakWith: '사슬 끊어요! (+${partner})',
      }
    },
    {
      id: 'P12S2 줄 적과 연결',
      type: 'Tether',
      netRegex: { id: '0001' },
      suppressSeconds: 2,
      infoText: (data, matches, output) => {
        if (data.prsPhase === 900) {
          // 가이아오코스2 천사랑 연결
          if (data.party.isDPS(matches.target))
            return output.dpsTether!();
          return output.thTether!();
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
        dpsTether: '탱힐이 막아요',
        thTether: 'DPS가 막아요',
        // 클래식 컨셉1
        c1Safe10: '🡼🡼', // 알파, 동글
        c1Safe20: '촉수 위로❱❱❱❱❱', // 알파, 세모
        c1Safe30: '🡽🡽', // 알파, 네모
        c1Safe40: '❰❰❰❰❰촉수 위로', // 알파, 가위
        c1Safe11: '🡿🡿', // 베타, 동글
        c1Safe21: '촉수 아래로❱❱❱❱❱', // 베타, 세모
        c1Safe31: '🡾🡾', // 베타, 네모
        c1Safe41: '❰❰❰❰❰촉수 아래로', // 베타, 가위
        // 클래식 컨셉2
        c2Safe10: '4번 위로', // 알파, 동글
        c2Safe20: '2번 위로', // 알파, 세모
        c2Safe30: '1번 위로', // 알파, 네모
        c2Safe40: '3번 위로', // 알파, 가위
        c2Safe11: '4번 아래로', // 베타, 동글
        c2Safe21: '2번 아래로', // 베타, 세모
        c2Safe31: '1번 아래로', // 베타, 네모
        c2Safe41: '3번 아래로', // 베타, 가위
      }
    },
    {
      id: 'P12S2 알테마',
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
      id: 'P12S2 팔라디언 그랩스 대상',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id === '01D4')
          data.prsPalladionGraps = matches.target;
      },
    },
    {
      id: 'P12S2 팔라디언 그랩스',
      type: 'StartsUsing',
      netRegex: { id: '831A', source: 'Pallas Athena', capture: false },
      alertText: (data, _match, output) => {
        if (data.prsPalladionGraps === data.me)
          return output.tank!();
        return output.text!();
      },
      outputStrings: {
        tank: '❰❰❰❰❰맵 반쪽 탱크버스터! 무적으로!',
        text: '탱크버스터 피해요❱❱❱❱❱',
      },
    },
    {
      id: 'P12S2 가이아오코스', // 두번옴. 참고로 작아지는 마커는 0061
      type: 'StartsUsing',
      netRegex: { id: '8326', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '전체 공격 + 작아져요',
      },
    },
    {
      id: 'P12S2 지오센트리즘',
      type: 'StartsUsing',
      netRegex: { id: ['8329', '832A', '832B'], source: 'Pallas Athena', capture: false },
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '전체 공격 + 흩어져요',
      },
    },
    {
      id: 'P12S2 클래식 컨셉 플스 마커',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        const playstationMarkerMap: { [id: string]: PlaystationMarker } = {
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
      id: 'P12S2 클래식 컨셉 알파 베타',
      type: 'GainsEffect',
      netRegex: { effectId: ['DE8', 'DE9'] },
      run: (data, matches) => data.prsClassicAlphaBeta[matches.target] = matches.effectId === 'DE8' ? 'alpha' : 'beta',
    },
    {
      id: 'P12S2 클래식 컨셉 반전',
      type: 'StartsUsing',
      netRegex: { id: '8331', source: 'Pallas Athena', capture: false },
      condition: (data) => data.prsPhase !== 200,
      delaySeconds: 12,
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.revert!(),
      outputStrings: {
        revert: '반대로 가야 해요',
      },
    },
    {
      id: 'P12S2 클래식 컨셉 알랴줌',
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
        circle: '동글 1번',
        triangle: '세모 3번',
        square: '네모 4번',
        cross: '가위 2번',
        alpha: '알파 🟥삼각',
        beta: '베타 🟨사각',
      },
    },
    {
      id: 'P12S2 클래식 컨셉 피해욧',
      type: 'Ability',
      netRegex: { id: '8323', source: 'Pallas Athena', capture: false },
      delaySeconds: 2.5,
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '피해욧',
      },
    },
    {
      id: 'P12S2 크러시 헬름',
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
      id: 'P12S2 칼로리1 첫 불',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== '012F')
          return;
        data.prsCaloricFirst.push(matches.target);
      },
    },
    {
      id: 'P12S2 칼로리2 불',
      type: 'HeadMarker',
      netRegex: {},
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== '01D6')
          return;
        data.prsCaloricFire = matches.target;
        if (data.me === matches.target)
          return output.text!();
      },
      outputStrings: {
        text: '내게 첫 불! 가운데로',
      }
    },
    {
      id: 'P12S2 칼로리2 바람',
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
        text: '내게 바람: 흩어져요',
      }
    },
    {
      id: 'P12S2 칼로리 시작',
      type: 'StartsUsing',
      netRegex: { id: '8338', source: 'Pallas Athena', capture: false },
      preRun: (data) => {
        data.prsCaloricBuff = {};
        data.prsCaloricMine = undefined;
      },
      delaySeconds: 1,
      infoText: (data, _matches, output) => {
        // 칼로릭1
        if (data.prsPhase === 300) {
          if (data.prsCaloricFirst.length !== 2)
            return;
          const index = data.prsCaloricFirst.indexOf(data.me);
          if (index < 0)
            return;

          const partner = index === 0 ? 1 : 0;
          return output.text1st!({ partner: data.ShortName(data.prsCaloricFirst[partner]) });
        }

        // 칼로릭2
        // 후... 할게 없나?
      },
      outputStrings: {
        text1st: '내게 첫 불 (+${partner})',
      }
    },
    {
      id: 'P12S2 칼로릭 바람', // 바람: Atmosfaction
      type: 'GainsEffect',
      netRegex: { effectId: 'E07' },
      run: (data, matches) => data.prsCaloricBuff[matches.target] = 'wind',
    },
    {
      id: 'P12S2 칼로릭 불', // 불: Pyrefaction
      type: 'GainsEffect',
      netRegex: { effectId: 'E06' },
      alertText: (data, matches, output) => {
        data.prsCaloricBuff[matches.target] = 'fire';

        const duration = parseInt(matches.duration);
        if (duration === 11 && matches.target === data.me)
          return output.text!();
      },
      outputStrings: {
        text: '또다시 불! 무직이랑 뭉쳐요',
      },
    },
    {
      id: 'P12S2 칼로릭 불 터짐',
      type: 'GainsEffect',
      netRegex: { effectId: ['E06'] },
      condition: (_data, matches) => parseInt(matches.duration) === 12,
      delaySeconds: 12.8,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.prsCaloricMine === 'fire' && data.prsCaloricBuff[data.me] === undefined)
          return output.none!();
        if (data.prsCaloricMine === 'wind')
          return output.wind!();
      },
      outputStrings: {
        none: '무직! 불이랑 뭉쳐요!',
        wind: '바람! 흩어져요!',
      }
    },
    {
      id: 'P12S2 칼로리 첫번째 알랴줌',
      type: 'Ability',
      netRegex: { id: '8338', source: 'Pallas Athena', capture: false },
      condition: (data) => data.prsPhase === 300,
      delaySeconds: 2,
      durationSeconds: 8,
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        const mystat = data.prsCaloricBuff[data.me];
        data.prsCaloricMine = mystat;
        if (mystat === undefined)
          return;

        if (mystat === 'fire') {
          const myteam : string[] = [];
          for (const [name, stat] of Object.entries(data.prsCaloricBuff)) {
            if (stat === mystat && name !== data.me)
              myteam.push(data.ShortName(name));
          }
          return output.fire!({ team: myteam.sort().join(', ') });
        }

        if (data.prsCaloricFirst.includes(data.me))
          return output.wind1st!();

        const myteam : string[] = [];
        for (const [name, stat] of Object.entries(data.prsCaloricBuff)) {
          if (stat === mystat && name !== data.me && !data.prsCaloricFirst.includes(name))
            myteam.push(data.ShortName(name));
        }
        return output.wind!({ team: myteam.sort().join(', ') });
      },
      run: (data) => {
        data.prsCaloricFirst = [];
        data.prsCaloricBuff = {};
      },
      outputStrings: {
        fire: '내게 불 (${team})',
        wind: '내게 바람 (${team})',
        wind1st: '바람: 살짝 옆으로',
      },
    },
    {
      id: 'P12S2 칼로릭2 불 당사자',
      type: 'GainsEffect',
      netRegex: { effectId: ['E08'] },
      durationSeconds: 3,
      infoText: (data, matches, output) => {
        if (matches.target === data.me && data.prsCaloricFire !== data.me)
          return output.text!();
      },
      run: (data, matches) => data.prsCaloricFire = matches.target,
      outputStrings: {
        text: '내게 불 장판',
      }
    },
    {
      id: 'P12S2 칼로릭2 터져욧 옮겨욧',
      type: 'Ability',
      netRegex: { id: '833C', source: 'Pallas Athena', capture: false },
      alertText: (data, _matches, output) => {
        if (data.me === data.prsCaloricFire)
          return output.text!();
      },
      outputStrings: {
        text: '이동! 다음 사람에게 옮겨요',
      }
    },
    {
      id: 'P12S2 에크파이로시스',
      type: 'StartsUsing',
      netRegex: { id: '831E', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '엑사플레어 + 전체 공격',
      }
    },
    {
      id: 'P12S2 판제네시스',
      type: 'Ability',
      netRegex: { id: '833F', source: 'Pallas Athena', capture: false },
      delaySeconds: 1,
      durationSeconds: 10,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        let partner = output.unknown!();
        // 무직
        const mycnt = data.prsPangenesisCount[data.me] ?? 0;
        if (mycnt === 0) {
          for (const [name, cnt] of Object.entries(data.prsPangenesisCount)) {
            if (cnt === 0 && name !== data.me) {
              partner = data.ShortName(name);
              break;
            }
          }
          return output.none!({ partner: partner });
        }
        // 인자 1
        if (mycnt === 1) {
          for (const [name, cnt] of Object.entries(data.prsPangenesisCount)) {
            if (cnt === 1 && name !== data.me) {
              partner = data.ShortName(name);
              break;
            }
          }
          return output.geneone!({ partner: partner });
        }

        // 이제 시간에 따른 처리
        const mystat = data.prsPangenesisStat[data.me];
        const myduration = data.prsPangenesisDuration[data.me];
        if (mystat === undefined || myduration === undefined)
          return;

        for (const [name, duration] of Object.entries(data.prsPangenesisDuration)) {
          if (duration === myduration && name !== data.me) {
            partner = data.ShortName(name);
            break;
          }
        }
        if (myduration === 16)
          return output.tower1st!({ color: output[mystat]!(), partner: partner });
        return output.tower2nd!({ color: output[mystat]!(), partner: partner });
      },
      run: (data) => data.prsSeenPangenesis = true,
      outputStrings: {
        tower1st: '첫째 ${color} 타워 (+${partner})',
        tower2nd: '기다렸다 => 둘째 아래쪽 ${color} 타워 (+${partner})',
        geneone: '위로 살짝 => 첫째 타워 (+${partner})',
        none: '아래로 살짝 => 둘째 위쪽 타워 (+${partner})',
        dark: '하얀', // 색깔 바뀜
        light: '검은', // 색깔 바뀜
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S2 판제네시스 언스테이블',
      type: 'GainsEffect',
      netRegex: { effectId: 'E09' },
      run: (data, matches) => {
        const cnt = data.prsPangenesisCount[matches.target];
        data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
      }
    },
    {
      id: 'P12S2 판제네시스 스테이블',
      type: 'GainsEffect',
      netRegex: { effectId: 'E22' },
      run: (data, matches) => {
        const cnt = data.prsPangenesisCount[matches.target];
        if (cnt === undefined)
          data.prsPangenesisCount[matches.target] = 0;
      }
    },
    {
      id: 'P12S2 판제네시스 라이트', // Umbral Tilt
      type: 'GainsEffect',
      netRegex: { effectId: 'DF8' },
      condition: (data) => data.prsPhase === 500,
      run: (data, matches) => {
        if (!data.prsSeenPangenesis) {
          const cnt = data.prsPangenesisCount[matches.target];
          data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
          data.prsPangenesisDuration[matches.target] = parseInt(matches.duration);
        }
        data.prsPangenesisStat[matches.target] = 'light';
      },
    },
    {
      id: 'P12S2 판제네시스 다크', // Astral Tilt
      type: 'GainsEffect',
      netRegex: { effectId: 'DF9' },
      condition: (data) => data.prsPhase === 500,
      run: (data, matches) => {
        if (!data.prsSeenPangenesis) {
          const cnt = data.prsPangenesisCount[matches.target];
          data.prsPangenesisCount[matches.target] = cnt === undefined ? 1 : cnt + 1;
          data.prsPangenesisDuration[matches.target] = parseInt(matches.duration);
        }
        data.prsPangenesisStat[matches.target] = 'dark';
      },
    },
    {
      id: 'P12S2 판제네시스 이동', // Astral Advent
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
        wait1n: '둘째 위쪽 타워 나올 곳으로',
        wait1g: '둘째 아래쪽 타워 나올 곳으로',
        wait1gcc: '둘째 아래쪽 ${color} 타워 나올 곳으로',
        dark: '하얀', // 색깔 바뀜
        light: '검은', // 색깔 바뀜
      },
    },
    /*
    {
      id: 'P12S2 마커 처리',
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
