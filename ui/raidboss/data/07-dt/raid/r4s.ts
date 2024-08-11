import { AutumnDirections } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import {
  DirectionOutput8,
  DirectionOutputCardinal,
  DirectionOutputIntercard,
  Directions,
} from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

/*
  TO DO LIST
    - Electrope Edge 2 - call safe tile for non-Spark players?
    - Raining Swords - possibly add `alertText` calls for each safe spot in sequence?
*/

type Phase = 'door' | 'crosstail' | 'twilight' | 'midnight' | 'sunrise';

type NearFar = 'near' | 'far'; // wherever you are...
type InOut = 'in' | 'out';
type NorthSouth = 'north' | 'south';
type LeftRight = 'left' | 'right';
type CondenserMap = {
  long: string[];
  short: string[];
};
type AetherialId = keyof typeof aetherialAbility;
type AetherialEffect = 'iceRight' | 'iceLeft' | 'fireRight' | 'fireLeft';
type MidnightState = 'gun' | 'wings';
type IonClusterDebuff = 'yellowShort' | 'yellowLong' | 'blueShort' | 'blueLong';
type SunriseCardinalPair = 'northSouth' | 'eastWest';

type DirectionCardinal = Exclude<DirectionOutputCardinal, 'unknown'>;
type DirectionIntercard = Exclude<DirectionOutputIntercard, 'unknown'>;
type ReplicaCleaveMap = {
  [K in DirectionCardinal]: {
    [D in LeftRight]: DirectionOutputIntercard[];
  };
};

type ReplicaData = {
  [id: string]: {
    location?: DirectionOutput8;
    cardinalFacing?: 'opposite' | 'adjacent';
    cannonColor?: 'yellow' | 'blue';
  };
};

const centerX = 100;
const p1CenterY = 100;
const p2CenterY = 165; // wall-boss platform is south

const phaseMap: { [id: string]: Phase } = {
  '95F2': 'crosstail', // Cross Tail Switch
  '9623': 'twilight', // Twilight Sabbath
  '9AB9': 'midnight', // Midnight Sabbath
  '9622': 'sunrise', // Ion Cluster (because debuffs pre-date the Sunrise Sabbath cast)
};

const actorControlCategoryMap = {
  'setModelState': '003F',
  'playActionTimeline': '0197',
} as const;

const aetherialAbility = {
  '9602': 'fireLeft',
  '9603': 'iceLeft',
  '9604': 'fireRight',
  '9605': 'iceRight',
} as const;

const isAetherialId = (id: string): id is AetherialId => {
  return id in aetherialAbility;
};

// Replicas face center, so the half they cleave will render all those intercards unsafe.
const replicaCleaveUnsafeMap: ReplicaCleaveMap = {
  'dirN': {
    'left': ['dirNE', 'dirSE'],
    'right': ['dirNW', 'dirSW'],
  },
  'dirE': {
    'left': ['dirSE', 'dirSW'],
    'right': ['dirNW', 'dirNE'],
  },
  'dirS': {
    'left': ['dirSW', 'dirNW'],
    'right': ['dirNE', 'dirSE'],
  },
  'dirW': {
    'left': ['dirNW', 'dirNE'],
    'right': ['dirSE', 'dirSW'],
  },
};

const isCardinalDir = (dir: DirectionOutput8): dir is DirectionCardinal => {
  return (Directions.outputCardinalDir as string[]).includes(dir);
};

const isIntercardDir = (dir: DirectionOutput8): dir is DirectionIntercard => {
  return (Directions.outputIntercardDir as string[]).includes(dir);
};

const getStartingSwords = (): number[][] => Array(4).fill(0).map(() => [0, 1, 2, 3]);

const swordQuiverSafeMap = {
  '95F9': 'sidesAndBack', // front cleave
  '95FA': 'frontAndBack', // middle cleave
  '95FB': 'frontAndSides', // back cleave
} as const;

const isSwordQuiverId = (id: string): id is keyof typeof swordQuiverSafeMap => {
  return Object.keys(swordQuiverSafeMap).includes(id);
};

// For now, call the in/out, the party safe spot, and the bait spot; users can customize.
// If/once standard strats develop, this would be a good thing to revisit.
const witchHuntAlertOutputStrings = {
  in: {
    en: 'In',
    ja: '中へ',
    ko: '안',
  },
  out: {
    en: 'Out',
    ja: '外へ',
    ko: '밖',
  },
  near: {
    en: 'Baits Close (Party Far)',
    ja: '近づいて誘導 (他は離れる)',
    ko: '가까이 (파티 멀리)',
  },
  far: {
    en: 'Baits Far (Party Close)',
    ja: '離れて誘導 (他は近づく)',
    ko: '멀리 (파티 가까이)',
  },
  combo: {
    en: '${inOut} => ${bait}',
    ja: '${inOut} => ${bait}',
    ko: '${inOut} 🔜 ${bait}',
  },
  unknown: Outputs.unknown,
  markerOn: {
    en: 'Stand on Marker',
    ko: '●마커 밟아요',
  },
  markerOut: {
    en: 'Stand Outside Marker',
    ko: '●마커 바깥',
  },
  crossInside: {
    en: 'Inside Cross',
    ko: '➕십자 안쪽',
  },
  crossOn: {
    en: 'On Cross',
    ko: '➕십자 밟아요',
  },
  targetOn: {
    en: 'Stand on Target Circle',
    ko: '◎타겟서클 밟아요',
  },
  targetOut: {
    en: 'Stand Outside Target Circle',
    ko: '◎타겟서클 바깥',
  },
  prCombo: {
    en: '${inOut} => ${bait}',
    ko: '${bait} (${inOut})',
  },
} as const;

const tailThrustOutputStrings = {
  iceLeft: {
    en: 'Double Knockback (<== Start on Left)',
    ja: '2連続ノックバック (<== 左から開始)',
    ko: '두번 넉백 (❰❰❰왼쪽 시작)',
  },
  iceRight: {
    en: 'Double Knockback (Start on Right ==>)',
    ja: '2連続ノックバック (右から開始 ==>)',
    ko: '두번 넉백 (오른쪽 시작❱❱❱)',
  },
  fireLeft: {
    en: 'Fire - Start Front + Right ==>',
    ja: '火 - 最前列 + 右側へ ==>',
    ko: '🔥불 (오른쪽 시작❱❱❱)',
  },
  fireRight: {
    en: '<== Fire - Start Front + Left',
    ja: '<== 火 - 最前列 + 左側へ',
    ko: '🔥불 (❰❰❰왼쪽 시작)',
  },
  unknown: Outputs.unknown,
} as const;

const swordQuiverOutputStrings = {
  frontAndSides: {
    en: 'Go Front / Sides',
    ja: '前方 / 横側 へ',
    ko: '🡸🡹🡺앞옆으로',
  },
  frontAndBack: {
    en: 'Go Front / Back',
    ja: '前方 / 後方 へ',
    ko: '🡹🡻앞뒤로',
  },
  sidesAndBack: {
    en: 'Go Sides / Back',
    ja: '横 / 後方 へ',
    ko: '🡸🡻🡺옆뒤로',
  },
} as const;

export interface Data extends RaidbossData {
  phase: Phase;
  // Phase 1
  bewitchingBurstSafe?: InOut;
  hasForkedLightning: boolean;
  seenBasicWitchHunt: boolean;
  witchHuntBait?: NearFar;
  witchHuntAoESafe?: InOut;
  witchGleamCount: number;
  electromines: { [id: string]: DirectionOutputIntercard };
  electrominesSafe: DirectionOutputIntercard[];
  starEffect?: 'partners' | 'spread';
  witchgleamSelfCount: number;
  condenserTimer?: 'short' | 'long';
  condenserMap: CondenserMap;
  electronStreamSafe?: 'yellow' | 'blue';
  electronStreamSide?: NorthSouth;
  seenConductorDebuffs: boolean;
  fulminousFieldCount: number;
  conductionPointTargets: string[];
  // Phase 2
  replicas: ReplicaData;
  mustardBombTargets: string[];
  kindlingCauldronTargets: string[];
  aetherialEffect?: AetherialEffect;
  twilightSafe: DirectionOutputIntercard[];
  replicaCleaveCount: number;
  secondTwilightCleaveSafe?: DirectionOutputIntercard;
  midnightCardFirst?: boolean;
  midnightFirstAdds?: MidnightState;
  midnightSecondAdds?: MidnightState;
  ionClusterDebuff?: IonClusterDebuff;
  sunriseCannons: string[];
  sunriseCloneToWatch?: string;
  sunriseTowerSpots?: SunriseCardinalPair;
  seenFirstSunrise: boolean;
  rainingSwords: {
    mySide?: LeftRight;
    tetherCount: number;
    firstActorId: number;
    left: number[][];
    right: number[][];
  };
  // PRS
  myRole?: 'tank' | 'healer' | 'melee' | 'ranged';
  imDps?: boolean;
  witchHuntFirst?: InOut;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM4Savage',
  zoneId: ZoneId.AacLightHeavyweightM4Savage,
  timelineFile: 'r4s.txt',
  initData: () => {
    return {
      phase: 'door',
      // Phase 1
      hasForkedLightning: false,
      seenBasicWitchHunt: false,
      witchGleamCount: 0,
      electromines: {},
      electrominesSafe: [],
      witchgleamSelfCount: 0,
      condenserMap: {
        long: [],
        short: [],
      },
      seenConductorDebuffs: false,
      fulminousFieldCount: 0,
      conductionPointTargets: [],
      // Phase 2
      replicas: {},
      mustardBombTargets: [],
      kindlingCauldronTargets: [],
      twilightSafe: Directions.outputIntercardDir,
      replicaCleaveCount: 0,
      sunriseCannons: [],
      seenFirstSunrise: false,
      rainingSwords: {
        tetherCount: 0,
        firstActorId: 0,
        left: getStartingSwords(),
        right: getStartingSwords(),
      },
    };
  },
  timelineTriggers: [
    // Order: Soulshock => Impact x2 => Cannonbolt (entire sequence is ~9s).
    // None of these have StartsUsing lines or other lines that could be used for pre-warn triggers;
    // they seem to be entirely timeline based.  To avoid spam, use a single alert.
    {
      id: 'R4S Soulshock',
      regex: /Soulshock/,
      beforeSeconds: 4,
      durationSeconds: 13,
      response: Responses.bigAoe(),
    },
    {
      id: 'R4S Cannonbolt',
      regex: /Cannonbolt/,
      beforeSeconds: 8,
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'South',
          ko: '남쪽으로!',
        },
      },
    },
    {
      id: 'R4S Wicked Fire prepare',
      regex: /Wicked Fire \(puddles drop\)/,
      beforeSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go center',
          ko: '장판 유도할거임 한가운데로!',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'R4S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phaseMap), source: 'Wicked Thunder' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const phase = phaseMap[matches.id];
        if (phase === undefined)
          throw new UnreachableCode();

        data.phase = phase;
      },
    },

    // ***************** PHASE 1 ***************** //
    // General
    {
      id: 'R4S Wrath of Zeus',
      type: 'StartsUsing',
      netRegex: { id: '95EF', source: 'Wicked Thunder', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R4S Wicked Bolt',
      type: 'HeadMarker',
      netRegex: { id: '013C' },
      condition: (data) => data.phase === 'door',
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R4S Wicked Jolt',
      type: 'StartsUsing',
      netRegex: { id: '95F0' },
      response: Responses.tankBusterSwap(),
    },

    // Witch Hunts
    {
      id: 'R4S Bewitching Flight',
      type: 'StartsUsing',
      netRegex: { id: '9671', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.avoid!(),
      outputStrings: {
        avoid: {
          en: 'Avoid Front + Side Cleaves',
          ja: '縦と横の範囲を避けて',
          ko: '격자 장판 피해요',
        },
      },
    },
    {
      // We don't need to collect; we can deduce in/out based on any bursting line's x-pos.
      id: 'R4S Betwitching Flight Burst',
      type: 'StartsUsingExtra',
      netRegex: { id: '95EA' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const x = parseFloat(matches.x);
        data.bewitchingBurstSafe = (x > 110 || x < 90) ? 'in' : 'out';
      },
    },
    {
      id: 'R4S Electrifying Witch Hunt',
      type: 'StartsUsing',
      netRegex: { id: '95E5', source: 'Wicked Thunder', capture: false },
      alertText: (data, _matches, output) => {
        if (data.bewitchingBurstSafe === undefined)
          return output.spreadAvoid!();
        const inOut = output[data.bewitchingBurstSafe]!();
        return output.combo!({ inOut: inOut, spread: output.spreadAvoid!() });
      },
      run: (data) => delete data.bewitchingBurstSafe,
      outputStrings: {
        in: {
          en: 'In',
          ja: '中へ',
          ko: '❱❱가운데서❰❰',
        },
        out: {
          en: 'Out',
          ja: '外へ',
          ko: '❰❰모서리로❱❱',
        },
        spreadAvoid: {
          en: 'Spread (Avoid Side Cleaves)',
          ja: '散開 (横の範囲を避けて)',
          ko: '흩어져요',
        },
        combo: {
          en: '${inOut} + ${spread}',
          ja: '${inOut} + ${spread}',
          ko: '${inOut} ${spread}',
        },
      },
    },
    {
      id: 'R4S Witch Hunt Close/Far Collect',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      condition: (data) => !data.seenBasicWitchHunt,
      run: (data, matches) => data.witchHuntBait = matches.count === '2F6' ? 'near' : 'far',
    },
    {
      id: 'R4S Forked Lightning Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '24B' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.hasForkedLightning = true,
    },
    {
      id: 'R4S Witch Hunt',
      type: 'StartsUsing',
      netRegex: { id: '95DE', source: 'Wicked Thunder', capture: false },
      delaySeconds: 0.2,
      alertText: (data, _matches, output) => {
        if (data.witchHuntBait === undefined || data.bewitchingBurstSafe === undefined)
          return;

        if (data.options.AutumnStyle) {
          const inOut = output[data.bewitchingBurstSafe]!();
          const spread = data.witchHuntBait === 'near'
            ? (data.hasForkedLightning ? output.farFoked!() : output.near!())
            : (data.hasForkedLightning ? output.nearFoked!() : output.far!());
          return output.combo!({ inOut: inOut, spread: spread });
        }

        const inOut = output[data.bewitchingBurstSafe]!();
        const spread = data.witchHuntBait === 'near'
          ? (data.hasForkedLightning ? output.far!() : output.near!())
          : (data.hasForkedLightning ? output.near!() : output.far!());
        return output.combo!({ inOut: inOut, spread: spread });
      },
      run: (data) => data.seenBasicWitchHunt = true,
      outputStrings: {
        in: {
          en: 'In',
          ja: '中へ',
          ko: '가운데',
        },
        out: {
          en: 'Out',
          ja: '外へ',
          ko: '모서리',
        },
        near: {
          en: 'Spread (Be Closer)',
          ja: '散開(近づく)',
          ko: '보스 근처로',
        },
        far: {
          en: 'Spread (Be Further)',
          ja: '散開(離れる)',
          ko: '바깥쪽 칸',
        },
        nearFoked: {
          en: 'Spread (Be Closer)',
          ja: '散開(近づく)',
          ko: '🗲보스 근처로',
        },
        farFoked: {
          en: 'Spread (Be Further)',
          ja: '散開(離れる)',
          ko: '🗲바깥쪽 칸',
        },
        combo: {
          en: '${inOut} + ${spread}',
          ja: '${inOut} + ${spread}',
          ko: '${spread} (${inOut})',
        },
      },
    },
    // For Narrowing/Widening Witch Hunt, the cast determines the first in/out safe, and it swaps each time.
    // The B9A status effect count determines the first near/far bait, and it swaps each time.
    // To simplify this, we can collect the first ones of each, call them out, and then flip them for subsequent calls.
    {
      id: 'R4S Narrowing/Widening Witch Hunt Bait Collect',
      type: 'GainsEffect',
      // count: 2F6 = near, 2F7 = far
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      condition: (data) => data.seenBasicWitchHunt,
      suppressSeconds: 15, // don't re-collect, as the effects occur 3 more times
      run: (data, matches) => data.witchHuntBait = matches.count === '2F6' ? 'near' : 'far',
    },
    {
      // Keep an infoText up during the entire mechanic with the order
      // 95E0 = Widening, 95E1 = Narrowing
      id: 'R4S Narrowing/Widening Witch Hunt General',
      type: 'StartsUsing',
      netRegex: { id: ['95E0', '95E1'], source: 'Wicked Thunder' },
      // Cast time is almost the same as the GainsEffect
      // so slight delay just in case there's a race condition issue
      delaySeconds: 0.2,
      durationSeconds: 24,
      infoText: (data, matches, output) => {
        // assumes Narrowing; if Widening, just reverse
        let aoeOrder: InOut[] = ['in', 'out', 'in', 'out'];

        if (matches.id === '95E0')
          aoeOrder = aoeOrder.reverse();
        data.witchHuntAoESafe = aoeOrder[0];
        data.witchHuntFirst = aoeOrder[0];

        // assumes Near first; if Far first, just reverse
        let baitOrder: NearFar[] = ['near', 'far', 'near', 'far'];
        if (data.witchHuntBait === undefined)
          baitOrder = [];
        else if (data.witchHuntBait === 'far')
          baitOrder = baitOrder.reverse();

        if (data.options.AutumnStyle) {
          const res: string[] = [];
          for (let i = 0; i < aoeOrder.length; ++i) {
            const inOut = aoeOrder[i]!;
            res.push(output[inOut]!());
          }
          return output.baitCombo!({ allBaits: res.join(output.separator!()) });
        }

        const baits: string[] = [];
        for (let i = 0; i < aoeOrder.length; ++i) {
          const inOut = aoeOrder[i]!;
          const bait = baitOrder[i] ?? output.unknown!();
          baits.push(output.baitStep!({ inOut: output[inOut]!(), bait: output[bait]!() }));
        }
        return output.baitCombo!({ allBaits: baits.join(output.separator!()) });
      },
      outputStrings: {
        in: {
          en: 'In',
          ja: '中へ',
          ko: '안',
        },
        out: {
          en: 'Out',
          ja: '外へ',
          ko: '밖',
        },
        near: {
          en: 'Close',
          ja: '近づく',
          ko: '가까이',
        },
        far: {
          en: 'Far',
          ja: '離れる',
          ko: '멀리',
        },
        separator: {
          en: ' => ',
          de: ' => ',
          ja: ' => ',
          cn: ' => ',
          ko: ' 🔜 ',
        },
        baitStep: {
          en: '${inOut} (${bait})',
          ja: '${inOut} (${bait})',
          ko: '${inOut} (${bait})',
        },
        baitCombo: {
          en: 'Baits: ${allBaits}',
          ja: '誘導: ${allBaits}',
          ko: '(${allBaits})',
        },
        unknown: Outputs.unknown,
      },
    },
    // In lieu of a standardized strat, use separate triggers for each callout.
    // This allows players to customize text if they will be baiting in fixed role order.
    {
      id: 'R4S Narrowing/Widening Witch Hunt First',
      type: 'StartsUsing',
      netRegex: { id: ['95E0', '95E1'], source: 'Wicked Thunder', capture: false },
      delaySeconds: 7,
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        const inOut = data.witchHuntAoESafe ?? output.unknown!();
        const bait = data.witchHuntBait ?? output.unknown!();

        // flip things for the next call
        if (data.witchHuntAoESafe !== undefined)
          data.witchHuntAoESafe = data.witchHuntAoESafe === 'in' ? 'out' : 'in';
        if (data.witchHuntBait !== undefined)
          data.witchHuntBait = data.witchHuntBait === 'near' ? 'far' : 'near';

        const role = data.myRole;
        if (role !== undefined && data.witchHuntFirst !== undefined) {
          if (data.witchHuntFirst === 'in') {
            if (role === 'tank')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOn!() });
            if (role === 'healer')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
            if (role === 'melee')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOut!() });
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
          }
          if (role === 'tank')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
          if (role === 'healer')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossOn!() });
          if (role === 'melee')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
          return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossInside!() });
        }

        return output.combo!({ inOut: output[inOut]!(), bait: output[bait]!() });
      },
      outputStrings: witchHuntAlertOutputStrings,
    },
    {
      id: 'R4S Narrowing/Widening Witch Hunt Second',
      type: 'StartsUsing',
      netRegex: { id: ['95E0', '95E1'], source: 'Wicked Thunder', capture: false },
      delaySeconds: 14,
      durationSeconds: 3.2,
      alertText: (data, _matches, output) => {
        const inOut = data.witchHuntAoESafe ?? output.unknown!();
        const bait = data.witchHuntBait ?? output.unknown!();

        // flip things for the next call
        if (data.witchHuntAoESafe !== undefined)
          data.witchHuntAoESafe = data.witchHuntAoESafe === 'in' ? 'out' : 'in';
        if (data.witchHuntBait !== undefined)
          data.witchHuntBait = data.witchHuntBait === 'near' ? 'far' : 'near';

        const role = data.myRole;
        if (role !== undefined && data.witchHuntFirst !== undefined) {
          if (data.witchHuntFirst === 'in') {
            if (role === 'tank')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
            if (role === 'healer')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossOn!() });
            if (role === 'melee')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossInside!() });
          }
          if (role === 'tank')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOn!() });
          if (role === 'healer')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
          if (role === 'melee')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOut!() });
          return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
        }

        return output.combo!({ inOut: output[inOut]!(), bait: output[bait]!() });
      },
      outputStrings: witchHuntAlertOutputStrings,
    },
    {
      id: 'R4S Narrowing/Widening Witch Hunt Third',
      type: 'StartsUsing',
      netRegex: { id: ['95E0', '95E1'], source: 'Wicked Thunder', capture: false },
      delaySeconds: 17.4,
      durationSeconds: 3.2,
      alertText: (data, _matches, output) => {
        const inOut = data.witchHuntAoESafe ?? output.unknown!();
        const bait = data.witchHuntBait ?? output.unknown!();

        // flip things for the next call
        if (data.witchHuntAoESafe !== undefined)
          data.witchHuntAoESafe = data.witchHuntAoESafe === 'in' ? 'out' : 'in';
        if (data.witchHuntBait !== undefined)
          data.witchHuntBait = data.witchHuntBait === 'near' ? 'far' : 'near';

        const role = data.myRole;
        if (role !== undefined && data.witchHuntFirst !== undefined) {
          if (data.witchHuntFirst === 'in') {
            if (role === 'tank')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOut!() });
            if (role === 'healer')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
            if (role === 'melee')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOn!() });
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
          }
          if (role === 'tank')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
          if (role === 'healer')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossInside!() });
          if (role === 'melee')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
          return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossOn!() });
        }

        return output.combo!({ inOut: output[inOut]!(), bait: output[bait]!() });
      },
      outputStrings: witchHuntAlertOutputStrings,
    },
    {
      id: 'R4S Narrowing/Widening Witch Hunt Fourth',
      type: 'StartsUsing',
      netRegex: { id: ['95E0', '95E1'], source: 'Wicked Thunder', capture: false },
      delaySeconds: 20.8,
      durationSeconds: 3.2,
      alertText: (data, _matches, output) => {
        const inOut = data.witchHuntAoESafe ?? output.unknown!();
        const bait = data.witchHuntBait ?? output.unknown!();

        const role = data.myRole;
        if (role !== undefined && data.witchHuntFirst !== undefined) {
          if (data.witchHuntFirst === 'in') {
            if (role === 'tank')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
            if (role === 'healer')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossInside!() });
            if (role === 'melee')
              return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.crossOn!() });
          }
          if (role === 'tank')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOut!() });
          if (role === 'healer')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOn!() });
          if (role === 'melee')
            return output.prCombo!({ inOut: output[inOut]!(), bait: output.targetOn!() });
          return output.prCombo!({ inOut: output[inOut]!(), bait: output.markerOut!() });
        }

        return output.combo!({ inOut: output[inOut]!(), bait: output[bait]!() });
      },
      outputStrings: witchHuntAlertOutputStrings,
    },

    // Electrope Edge 1 & 2
    {
      id: 'R4S Electrope Edge Positions',
      type: 'StartsUsing',
      netRegex: { id: '95C5', source: 'Wicked Thunder', capture: false },
      infoText: (data, _matches, output) => {
        // On the first cast, it will spawn intercardinal mines that are hit by Witchgleams.
        // On the second cast, players will be hit by Witchgleams.
        if (Object.keys(data.electromines).length === 0)
          return output.cardinals!();
        return output.protean!();
      },
      outputStrings: {
        cardinals: {
          en: 'Cardinals',
          ja: '十字回避',
          ko: '십자로!',
        },
        protean: {
          en: 'Protean',
          ja: '基本散会',
          ko: '자기 자리로!',
        },
      },
    },
    {
      id: 'R4S Witchgleam Electromine Collect',
      type: 'AddedCombatant',
      netRegex: { name: 'Electromine' },
      condition: (data) => data.witchGleamCount === 0,
      run: (data, matches) => {
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const intercard = Directions.xyToIntercardDirOutput(x, y, centerX, p1CenterY);
        data.electromines[matches.id] = intercard;
      },
    },
    {
      id: 'R4S Witchgleam Electromine Counter',
      type: 'Ability',
      netRegex: { id: '95C7', source: 'Wicked Thunder', target: 'Electromine', capture: false },
      suppressSeconds: 1,
      run: (data) => ++data.witchGleamCount,
    },
    {
      id: 'R4S Witchgleam Electromine Hit Collect',
      type: 'Ability',
      netRegex: { id: '95C7', source: 'Wicked Thunder', target: 'Electromine' },
      run: (data, matches) => {
        const mineId = matches.targetId;
        const mineDir = data.electromines[mineId];
        // Two mines get hit once, two get hit twice.  On the second hit, remove it as a safe spot.
        if (mineDir !== undefined) {
          if (data.electrominesSafe.includes(mineDir))
            data.electrominesSafe = data.electrominesSafe.filter((mine) => mine !== mineDir);
          else
            data.electrominesSafe.push(mineDir);
        }
      },
    },
    {
      id: 'R4S Four/Eight Star Effect Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: ['2F0', '2F1'] },
      run: (data, matches) => data.starEffect = matches.count === '2F0' ? 'partners' : 'spread',
    },
    {
      id: 'R4S Electrope Edge 1 Sidewise Spark',
      type: 'StartsUsing',
      // Base this on the Sidewise Spark cast, since it narrows us down to a single safe quadrant
      // Boss always faces north; 95EC = east cleave, 95ED = west cleave
      netRegex: { id: ['95EC', '95ED'], source: 'Wicked Thunder' },
      condition: (data) => data.witchGleamCount === 3,
      // Cast time is almost the same as the GainsEffect
      // so slight delay just in case there's a race condition issue
      delaySeconds: 0.2,
      alertText: (data, matches, output) => {
        const unsafeMap: { [id: string]: DirectionOutputIntercard[] } = {
          '95EC': ['dirNE', 'dirSE'],
          '95ED': ['dirNW', 'dirSW'],
        };

        const unsafeDirs = unsafeMap[matches.id] ?? [];
        data.electrominesSafe = data.electrominesSafe.filter((d) => !unsafeDirs.includes(d));
        const safeDir = data.electrominesSafe.length !== 1
          ? 'unknown'
          : data.electrominesSafe[0]!;
        let safeDirStr = output[safeDir]!();
        if (data.options.AutumnStyle) {
          const dirMap: { [dir: string]: string } = {
            dirNE: 'markerNE',
            dirSE: 'markerSE',
            dirNW: 'markerNW',
            dirSW: 'markerSW',
            unknown: 'unknown',
          };
          const marker = dirMap[safeDir];
          if (marker !== undefined)
            safeDirStr = output[marker]!();
        }

        const starEffect = data.starEffect ?? 'unknown';
        const starEffectStr = output[starEffect]!();

        return output.combo!({ dir: safeDirStr, mech: starEffectStr });
      },
      run: (data) => {
        data.witchGleamCount = 0;
        delete data.starEffect;
      },
      outputStrings: {
        ...Directions.outputStringsIntercardDir,
        partners: Outputs.stackPartner,
        spread: Outputs.spreadOwn,
        combo: {
          en: '${dir} => ${mech}',
          ja: '${dir} => ${mech}',
          ko: '${dir} ${mech}',
        },
        ...AutumnDirections.outputStringsMarkerIntercard,
      },
    },
    {
      id: 'R4S Electrical Condenser Debuff Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'F9F', capture: true },
      condition: Conditions.targetIsNotYou(),
      run: (data, matches) => {
        data.condenserTimer = parseFloat(matches.duration) > 30 ? 'long' : 'short';
        if (data.options.AutumnStyle) {
          const member = data.party.member(matches.target);
          const jobName = member.jobAbbr ?? member.nick;
          if (data.condenserTimer === 'long')
            data.condenserMap.long.push(jobName);
          else
            data.condenserMap.short.push(jobName);
          return;
        }
        const shortName = data.party.member(matches.target).nick;
        if (data.condenserTimer === 'long')
          data.condenserMap.long.push(shortName);
        else
          data.condenserMap.short.push(shortName);
      },
    },
    {
      id: 'R4S Electrical Condenser Debuff Initial',
      type: 'GainsEffect',
      netRegex: { effectId: 'F9F', capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.5,
      infoText: (data, matches, output) => {
        data.condenserTimer = parseFloat(matches.duration) > 30 ? 'long' : 'short';
        // Long debuff players will pick up an extra stack later.
        // Just handle it here to cut down on trigger counts.
        if (data.condenserTimer === 'long')
          data.witchgleamSelfCount++;

        // Some strats use long/short debuff assignments to do position swaps for EE2.
        const same = data.condenserMap[data.condenserTimer].join(', ');

        // Note: Taking unexpected lightning damage from Four/Eight Star, Sparks, or Sidewise Spark
        // will cause the stack count to increase. We could try to try to track that, but it makes
        // the final mechanic resolvable only under certain conditions (which still cause deaths),
        // so don't bother for now.  PRs welcome? :)
        return output[data.condenserTimer]!({ same: same });
      },
      outputStrings: {
        short: {
          en: 'Short Debuff (w/ ${same})',
          ja: '短いデバフ (同じく/ ${same})',
          ko: '짧은 디버프 (${same})',
        },
        long: {
          en: 'Long Debuff (w/ ${same})',
          ja: '長いデバフ (同じく/ ${same})',
          ko: '긴 디버프 (${same})',
        },
      },
    },
    {
      id: 'R4S Witchgleam Self Tracker',
      type: 'Ability',
      netRegex: { id: '9786' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.witchgleamSelfCount++,
    },
    {
      id: 'R4S Electrical Condenser Debuff Expiring',
      type: 'GainsEffect',
      netRegex: { effectId: 'F9F', capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 7,
      alertText: (data, _matches, output) => {
        if (data.options.AutumnStyle) {
          const pos = data.imDps
            ? data.witchgleamSelfCount === 2
              ? 'rightBottom'
              : 'rightTop'
            : data.witchgleamSelfCount === 2
            ? 'leftBottom'
            : 'leftTop';
          return output[pos]!();
        }
        return output.spread!({ stacks: data.witchgleamSelfCount });
      },
      outputStrings: {
        spread: {
          en: 'Spread (${stacks} stacks)',
          ja: '散開 (${stacks} 回のほう)',
          ko: '흩어져요 (${stacks}스택)',
        },
        leftTop: {
          en: 'Left Top',
          ko: '🡼왼쪽 위',
        },
        leftBottom: {
          en: 'Left Bottom',
          ko: '🡿왼쪽 아래',
        },
        rightTop: {
          en: 'Right Top',
          ko: '🡽오른쪽 위',
        },
        rightBottom: {
          en: 'Right Bottom',
          ko: '🡾오른쪽 아래',
        },
      },
    },
    {
      id: 'R4S Electrope Edge 2 Sidewise Spark',
      type: 'StartsUsing',
      // Boss always faces north; 95EC = east cleave, 95ED = west cleave
      netRegex: { id: ['95EC', '95ED'], source: 'Wicked Thunder' },
      condition: (data) => data.witchgleamSelfCount > 0,
      // Cast time is almost the same as the GainsEffect
      // so slight delay just in case there's a race condition issue
      delaySeconds: 0.2,
      alertText: (data, matches, output) => {
        let starEffect = data.starEffect ?? 'unknown';

        // Some strats have stack/spread positions based on Witchgleam stack count,
        // so for the long debuffs, add that info (both for positioning and as a reminder).
        let reminder = data.condenserTimer === 'long'
          ? output.stacks!({ stacks: data.witchgleamSelfCount })
          : '';

        if (data.options.AutumnStyle) {
          reminder = '';
          if (starEffect === 'partners') {
            if (data.witchgleamSelfCount === 2)
              starEffect = data.imDps ? 'pairSouth' : 'pairNorth';
            else {
              if (data.imDps)
                starEffect = 'pairCenter';
              else
                starEffect = matches.id === '95EC' ? 'pairWest' : 'pairEast';
            }
          }
        }

        if (matches.id === '95EC')
          return output.combo!({
            dir: output.west!(),
            mech: output[starEffect]!(),
            remind: reminder,
          });
        return output.combo!({
          dir: output.east!(),
          mech: output[starEffect]!(),
          remind: reminder,
        });
      },
      outputStrings: {
        east: Outputs.east,
        west: Outputs.west,
        partners: Outputs.stackPartner,
        spread: Outputs.spreadOwn,
        unknown: Outputs.unknown,
        stacks: {
          en: '(${stacks} stacks after)',
          ja: '(${stacks} 回のほう)',
          ko: '(${stacks}스택)',
        },
        combo: {
          en: '${dir} => ${mech} ${remind}',
          ja: '${dir} => ${mech} ${remind}',
          ko: '${dir} 🔜 ${mech} ${remind}',
        },
        pairNorth: {
          en: 'Pair North',
          ko: 'Ⓐ 둘이',
        },
        pairSouth: {
          en: 'Pair South',
          ko: 'Ⓒ 둘이',
        },
        pairWest: {
          en: 'Pair South',
          ko: 'Ⓓ 둘이',
        },
        pairEast: {
          en: 'Pair South',
          ko: 'Ⓑ 둘이',
        },
        pairCenter: {
          en: 'Pair Center',
          ko: '한가운데 둘이',
        },
      },
    },

    // Electron Streams
    {
      id: 'R4S Left Roll',
      type: 'Ability',
      netRegex: { id: '95D3', source: 'Wicked Thunder', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'R4S Right Roll',
      type: 'Ability',
      netRegex: { id: '95D2', source: 'Wicked Thunder', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'R4S Electron Stream Debuff',
      type: 'GainsEffect',
      // FA0 - Positron (Yellow), blue safe
      // FA1 - Negatron (Blue), yellow safe
      netRegex: { effectId: ['FA0', 'FA1'] },
      condition: (data, matches) => data.me === matches.target && data.phase === 'door',
      run: (data, matches) =>
        data.electronStreamSafe = matches.effectId === 'FA0' ? 'blue' : 'yellow',
    },
    {
      id: 'R4S Electron Stream Initial',
      type: 'StartsUsing',
      // 95D6 - Yellow cannon north, Blue cannnon south
      // 95D7 - Blue cannon north, Yellow cannon south
      netRegex: { id: ['95D6', '95D7'], source: 'Wicked Thunder' },
      condition: (data) => !data.seenConductorDebuffs,
      alertText: (data, matches, output) => {
        if (data.electronStreamSafe === 'yellow')
          data.electronStreamSide = matches.id === '95D6' ? 'north' : 'south';
        else if (data.electronStreamSafe === 'blue')
          data.electronStreamSide = matches.id === '95D6' ? 'south' : 'north';

        const safeDir = data.electronStreamSide ?? 'unknown';
        if (data.role === 'tank')
          return output.tank!({ dir: output[safeDir]!() });
        return output.nonTank!({ dir: output[safeDir]!() });
      },
      outputStrings: {
        north: Outputs.north,
        south: Outputs.south,
        unknown: Outputs.unknown,
        tank: {
          en: '${dir} - Be in Front',
          ja: '${dir} - ボス近くで受けて',
          ko: '${dir} - 앞에서 막아요',
        },
        nonTank: {
          en: '${dir} - Behind Tank',
          ja: '${dir} - タンクの後ろへ',
          ko: '${dir} - 탱크 뒤로',
        },
      },
    },
    {
      id: 'R4S Electron Stream Subsequent',
      type: 'StartsUsing',
      // 95D6 - Yellow cannon north, Blue cannnon south
      // 95D7 - Blue cannon north, Yellow cannon south
      netRegex: { id: ['95D6', '95D7'], source: 'Wicked Thunder' },
      condition: (data) => data.seenConductorDebuffs,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          swap: {
            en: 'Swap Sides',
            ja: '場所を交代',
            ko: '반대편으로',
          },
          stay: {
            en: 'Stay',
            ja: 'そのまま',
            ko: '그대로',
          },
          unknown: Outputs.unknown,
          tank: {
            en: '${dir} - Be in Front',
            ja: '${dir} - ボス近くで受けて',
            ko: '${dir} - 앞에서 막아요',
          },
          nonTank: {
            en: '${dir} - Behind Tank',
            ja: '${dir} - タンクの後ろへ',
            ko: '${dir} - 탱크 뒤로',
          },
        };

        let safeSide: NorthSouth | 'unknown' = 'unknown';
        let dir: 'stay' | 'swap' | 'unknown' = 'unknown';

        if (data.electronStreamSafe === 'yellow')
          safeSide = matches.id === '95D6' ? 'north' : 'south';
        else if (data.electronStreamSafe === 'blue')
          safeSide = matches.id === '95D6' ? 'south' : 'north';

        if (safeSide !== 'unknown') {
          dir = safeSide === data.electronStreamSide ? 'stay' : 'swap';
          data.electronStreamSide = safeSide; // for the next comparison
        }

        const text = data.role === 'tank'
          ? output.tank!({ dir: output[dir]!() })
          : output.nonTank!({ dir: output[dir]!() });

        if (dir === 'stay')
          return { infoText: text };
        return { alertText: text };
      },
    },
    // For now, just call the debuff effect; likely to be updated when
    // strats are solidified?
    {
      id: 'R4S Conductor/Current Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: ['FA2', 'FA3', 'FA4', 'FA5', 'FA6'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 5,
      alertText: (_data, matches, output) => {
        switch (matches.effectId) {
          case 'FA2':
            return output.remoteCurrent!();
          case 'FA3':
            return output.proximateCurrent!();
          case 'FA4':
            return output.spinningConductor!();
          case 'FA5':
            return output.roundhouseConductor!();
          case 'FA6':
            return output.colliderConductor!();
        }
      },
      run: (data) => data.seenConductorDebuffs = true,
      outputStrings: {
        remoteCurrent: {
          en: 'Far Cone on You',
          ja: '自分から遠い人に扇範囲',
          ko: '🔵멀리 (앞으로)',
        },
        proximateCurrent: {
          en: 'Near Cone on You',
          ja: '自分から近い人に扇範囲',
          ko: '🟢가까이 (앞으로)',
        },
        spinningConductor: {
          en: 'Small AoE on You',
          ja: '自分に小さい円範囲',
          ko: '●장판 (옆으로)',
        },
        roundhouseConductor: {
          en: 'Donut AoE on You',
          ja: '自分にドーナツ範囲',
          ko: '🍩도넛 (옆으로)',
        },
        colliderConductor: {
          en: 'Get Hit by Cone',
          ja: '扇範囲に当たって',
          ko: '🟣부채꼴 맞아요 (뒤로)',
        },
      },
    },

    // Fulminous Field
    {
      id: 'R4S Fulminous Field',
      type: 'Ability', // use the preceding ability (Electrope Translplant) for timing
      netRegex: { id: '98D3', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.dodge!(),
      outputStrings: {
        dodge: {
          en: 'Dodge w/Partner x7',
          ja: '相方と避ける x7',
          ko: '파트너와 왓다갔다 x7',
        },
      },
    },
    {
      id: 'R4S Fulminous Field Spread',
      type: 'Ability',
      // 90FE = initial hit, 98CD = followup hits (x6)
      netRegex: { id: ['90FE', '98CD'], source: 'Wicked Thunder' },
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        if (matches.id === '90FE')
          data.fulminousFieldCount = 1;
        else
          data.fulminousFieldCount++;

        if (data.fulminousFieldCount === 3)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'R4S Conduction Point Collect',
      type: 'Ability',
      netRegex: { id: '98CE', source: 'Wicked Thunder' },
      run: (data, matches) => data.conductionPointTargets.push(matches.target),
    },
    {
      id: 'R4S Forked Fissures',
      type: 'Ability',
      netRegex: { id: '98CE', source: 'Wicked Thunder', capture: false },
      delaySeconds: 0.2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.conductionPointTargets.includes(data.me))
          return output.far!();
        return output.near!();
      },
      run: (data) => data.conductionPointTargets = [],
      outputStrings: {
        near: {
          en: 'In Front of Partner',
          ja: '相方の前へ',
          ko: '파트너 앞에서 막아요',
        },
        far: {
          en: 'Behind Partner',
          ja: '相方の後ろへ',
          ko: '파트너 뒤로',
        },
      },
    },

    // ***************** PHASE 2 ***************** //
    // General
    {
      id: 'R4S Replica ActorSetPos Data Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4.{7}' },
      condition: (data) => data.phase !== 'door',
      run: (data, matches) => {
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const hdg = parseFloat(matches.heading);

        const locDir = Directions.xyTo8DirOutput(x, y, centerX, p2CenterY);
        (data.replicas[matches.id] ??= {}).location = locDir;

        // Determining the facing for clones on cardinals using 4Dir could get a little messy -
        // e.g., a NW-facing clone could result in a value of N or W depending on pixels/rounding.
        // To be safe, use the full 8-dir compass, and then adjust based on the clone's position
        // Note: We only care about heading for clones on cardinals during Sunrise Sabbath
        const hdgDir = Directions.outputFrom8DirNum(Directions.hdgTo8DirNum(hdg));
        if (isCardinalDir(locDir))
          (data.replicas[matches.id] ??= {}).cardinalFacing = isCardinalDir(hdgDir)
            ? 'opposite'
            : 'adjacent';
      },
    },
    {
      id: 'R4S Azure Thunder',
      type: 'StartsUsing',
      netRegex: { id: '962F', source: 'Wicked Thunder', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R4S Mustard Bomb Initial',
      type: 'StartsUsing',
      netRegex: { id: '961E', source: 'Wicked Thunder', capture: false },
      infoText: (data, _matches, output) =>
        data.role === 'tank' ? output.tank!() : output.nonTank!(),
      outputStrings: {
        tank: Outputs.tetherBusters,
        nonTank: Outputs.spreadOwn,
      },
    },
    {
      id: 'R4S Mustard Bomb Collect',
      type: 'Ability',
      // 961F - Mustard Bomb (tank tethers, x2)
      // 9620 - Kindling Cauldron (spread explosions, x4)
      netRegex: { id: ['961F', '9620'], source: 'Wicked Thunder' },
      run: (data, matches) => {
        if (matches.id === '961F')
          data.mustardBombTargets.push(matches.target);
        else
          data.kindlingCauldronTargets.push(matches.target);
      },
    },
    {
      id: 'R4S Mustard Bomb Followup',
      type: 'Ability',
      netRegex: { id: '961F', source: 'Wicked Thunder', capture: false },
      delaySeconds: 0.2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.mustardBombTargets.includes(data.me))
          return output.passDebuff!();
        else if (!data.kindlingCauldronTargets.includes(data.me))
          return output.getDebuff!();
      },
      run: (data) => {
        data.mustardBombTargets = [];
        data.kindlingCauldronTargets = [];
      },
      outputStrings: {
        passDebuff: {
          en: 'Pass Debuff',
          ja: 'デバフを渡して',
          ko: '디버프 건네줘요',
        },
        getDebuff: {
          en: 'Get Debuff',
          ja: 'デバフを取って',
          ko: '디버프 받아요',
        },
      },
    },
    {
      id: 'R4S Wicked Special Sides',
      type: 'StartsUsing',
      netRegex: { id: '9610', source: 'Wicked Thunder', capture: false },
      condition: (data) => data.secondTwilightCleaveSafe === undefined,
      response: Responses.goSides(),
    },
    {
      id: 'R4S Wicked Special In',
      type: 'StartsUsing',
      netRegex: { id: '9612', source: 'Wicked Thunder', capture: false },
      condition: (data) => data.secondTwilightCleaveSafe === undefined,
      response: Responses.goMiddle(),
    },
    {
      id: 'R4S Aetherial Conversion',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(aetherialAbility), source: 'Wicked Thunder' },
      durationSeconds: 7,
      infoText: (data, matches, output) => {
        if (!isAetherialId(matches.id))
          throw new UnreachableCode();
        // First time - no stored call (since the mech happens next), just save the effect
        const firstTime = data.aetherialEffect === undefined;
        data.aetherialEffect = aetherialAbility[matches.id];
        if (!firstTime)
          return output.stored!({ effect: output[data.aetherialEffect]!() });
      },
      outputStrings: {
        ...tailThrustOutputStrings,
        stored: {
          en: 'Stored: ${effect}',
          ja: 'あとで: ${effect}',
          ko: '저장: ${effect}',
        },
      },
    },
    {
      id: 'R4S Tail Thrust',
      type: 'StartsUsing',
      // 9606-9609 correspond to the id casts for the triggering Aetherial Conversion,
      // but we don't care which is which at this point because we've already stored the effect
      netRegex: { id: ['9606', '9607', '9608', '9609'], source: 'Wicked Thunder', capture: false },
      alertText: (data, _matches, output) => output[data.aetherialEffect ?? 'unknown']!(),
      outputStrings: tailThrustOutputStrings,
    },

    // Pre-Sabbaths
    {
      id: 'R4S Cross Tail Switch',
      type: 'StartsUsing',
      netRegex: { id: '95F2', source: 'Wicked Thunder', capture: false },
      delaySeconds: (data) => data.role === 'tank' ? 3 : 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          lb3: {
            en: 'LB3!',
            ja: 'タンク LB3!',
            ko: '탱크 리미트 브레이크!',
          },
        };

        if (data.role === 'tank')
          return { alarmText: output.lb3!() };
        return Responses.bigAoe();
      },
    },
    {
      id: 'R4S Wicked Blaze',
      type: 'HeadMarker',
      netRegex: { id: '013C', capture: false },
      condition: (data) => data.phase === 'crosstail',
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: Outputs.healerGroups,
      },
    },

    // Twilight Sabbath
    {
      id: 'R4S Wicked Fire',
      type: 'StartsUsing',
      netRegex: { id: '9630', source: 'Wicked Thunder', capture: false },
      infoText: (_data, _matches, output) => output.bait!(),
      outputStrings: {
        bait: Outputs.baitPuddles,
      },
    },
    {
      id: 'R4S Twilight Sabbath Sidewise Spark',
      type: 'GainsEffect',
      // count: 319 - add cleaves to its right, 31A - add cleaves to its left
      netRegex: { effectId: '808', count: ['319', '31A'] },
      condition: (data) => data.phase === 'twilight',
      alertText: (data, matches, output) => {
        data.replicaCleaveCount++;
        const dir = data.replicas[matches.targetId]?.location;
        if (dir === undefined || !isCardinalDir(dir))
          return;

        const cleaveDir = matches.count === '319' ? 'right' : 'left';
        const unsafeDirs = replicaCleaveUnsafeMap[dir][cleaveDir];
        data.twilightSafe = data.twilightSafe.filter((d) => !unsafeDirs.includes(d));

        if (data.replicaCleaveCount !== 2)
          return;
        const [safe0] = data.twilightSafe;
        if (safe0 === undefined)
          return;

        // on the first combo, set the second safe spot to unknown, and return the first safe spot
        // for second combo, just store the safe spot for a combined call with Wicked Special
        if (!data.secondTwilightCleaveSafe) {
          data.secondTwilightCleaveSafe = 'unknown';
          return output[safe0]!();
        }
        data.secondTwilightCleaveSafe = safe0;
      },
      run: (data) => {
        if (data.replicaCleaveCount !== 2)
          return;
        data.replicaCleaveCount = 0;
        data.twilightSafe = Directions.outputIntercardDir;
      },
      outputStrings: Directions.outputStringsIntercardDir,
    },
    {
      id: 'R4S Twilight Sabbath + Wicked Special',
      type: 'StartsUsing',
      netRegex: { id: ['9610', '9612'], source: 'Wicked Thunder' },
      condition: (data) => data.secondTwilightCleaveSafe !== undefined,
      alertText: (data, matches, output) => {
        const dir = data.secondTwilightCleaveSafe;
        if (dir === undefined)
          throw new UnreachableCode();

        return matches.id === '9610'
          ? output.combo!({ dir: output[dir]!(), inSides: output.sides!() })
          : output.combo!({ dir: output[dir]!(), inSides: output.in!() });
      },
      run: (data) => delete data.secondTwilightCleaveSafe,
      outputStrings: {
        ...Directions.outputStringsIntercardDir,
        in: Outputs.in,
        sides: Outputs.sides,
        combo: {
          en: '${dir} => ${inSides}',
          ja: '${dir} => ${inSides}',
          ko: '${dir} 🔜 ${inSides}',
        },
      },
    },

    // Midnight Sabbath
    {
      // ActorControl (category 0x0197) determines the firing order of the adds.
      // All cardinal adds get one value, and all intercardinal adds get a different value.
      // The 4 adds to fire first will always get either 11D1 (guns) or 11D3 (wings)
      // The 4 adds to fire second will always get either 11D2 (guns) or 11D4 (wings)
      id: 'R4S Midnight Sabbath First Adds',
      type: 'ActorControlExtra',
      netRegex: {
        id: '4.{7}',
        category: actorControlCategoryMap.playActionTimeline,
        param1: ['11D1', '11D3'],
      },
      condition: (data) => data.phase === 'midnight',
      delaySeconds: 0.5, // let the position collector finish
      suppressSeconds: 1, // we only need one
      run: (data, matches) => {
        const id = matches.id;
        const loc = data.replicas[id]?.location;
        if (loc === undefined)
          return;

        data.midnightCardFirst = isCardinalDir(loc);
        data.midnightFirstAdds = matches.param1 === '11D3' ? 'wings' : 'gun';
      },
    },
    {
      id: 'R4S Midnight Sabbath Second Adds',
      type: 'ActorControlExtra',
      netRegex: {
        id: '4.{7}',
        category: actorControlCategoryMap.playActionTimeline,
        param1: ['11D2', '11D4'],
      },
      condition: (data) => data.phase === 'midnight',
      delaySeconds: 0.5, // let the position collector finish
      suppressSeconds: 1, // we only need one
      run: (data, matches) => data.midnightSecondAdds = matches.param1 === '11D4' ? 'wings' : 'gun',
    },
    {
      id: 'R4S Concentrated/Scattered Burst 1',
      type: 'StartsUsing',
      // 962B - Concentrated Burst (Partners => Spread)
      // 962C - Scattered Burst (Spread => Partners)
      netRegex: { id: ['962B', '962C'], source: 'Wicked Thunder' },
      delaySeconds: 0.2, // cast starts ~1s after the ActorControl collectors, so just in case
      alertText: (data, matches, output) => {
        const firstMech = matches.id === '962B' ? 'partners' : 'spread';
        const firstMechStr = output[firstMech]!();

        if (data.midnightCardFirst === undefined || data.midnightFirstAdds === undefined)
          return firstMechStr;

        // If the first add is doing wings, that add is safe; if guns, the opposite is safe.
        const dirStr = data.midnightFirstAdds === 'wings'
          ? (data.midnightCardFirst ? output.cardinals!() : output.intercards!())
          : (data.midnightCardFirst ? output.intercards!() : output.cardinals!());

        return output.combo!({ dir: dirStr, mech: firstMechStr });
      },
      outputStrings: {
        combo: {
          en: '${dir} => ${mech}',
          ja: '${dir} => ${mech}',
          ko: '${dir} 🔜 ${mech}',
        },
        cardinals: Outputs.cardinals,
        intercards: Outputs.intercards,
        partners: Outputs.stackPartner,
        spread: Outputs.spreadSolo,
      },
    },
    {
      id: 'R4S Concentrated/Scattered Burst 2',
      type: 'Ability', // use the ability line to trigger the second call for optimal timing
      netRegex: { id: ['962B', '962C'], source: 'Wicked Thunder' },
      alertText: (data, matches, output) => {
        const secondMech = matches.id === '962B' ? 'spread' : 'partners';
        const secondMechStr = output[secondMech]!();

        if (data.midnightCardFirst === undefined || data.midnightSecondAdds === undefined)
          return secondMechStr;

        const secondAddsOnCards = !data.midnightCardFirst;

        // If the 2nd add is doing wings, that add is safe; if guns, the opposite is safe.
        const dirStr = data.midnightSecondAdds === 'wings'
          ? (secondAddsOnCards ? output.cardinals!() : output.intercards!())
          : (secondAddsOnCards ? output.intercards!() : output.cardinals!());

        return output.combo!({ dir: dirStr, mech: secondMechStr });
      },
      outputStrings: {
        combo: {
          en: '${dir} => ${mech}',
          ja: '${dir} => ${mech}',
          ko: '${dir} 🔜 ${mech}',
        },
        cardinals: Outputs.cardinals,
        intercards: Outputs.intercards,
        partners: Outputs.stackPartner,
        spread: Outputs.spreadSolo,
        unknown: Outputs.unknown,
      },
    },

    // Chain Lightning
    {
      id: 'R4S Flame Slash',
      type: 'StartsUsing',
      netRegex: { id: '9614', source: 'Wicked Thunder', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'R4S Raining Swords Tower',
      type: 'Ability',
      // use the ability line of the preceding Flame Slash cast, as the cast time
      // for Raining Swords is very short.
      netRegex: { id: '9614', source: 'Wicked Thunder', capture: false },
      alertText: (_data, _matches, output) => output.towers!(),
      outputStrings: {
        towers: {
          en: 'Tower Positions',
          ja: '塔の位置へ',
          ko: '타워 밟을 위치로!',
        },
      },
    },
    {
      id: 'R4S Raining Swords Collector',
      type: 'StartsUsing',
      netRegex: { id: '9616', source: 'Wicked Thunder', capture: false },
      promise: async (data) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;

        const swordActorIds = actors
          .filter((actor) => actor.BNpcID === 17327)
          .sort((left, right) => left.ID! - right.ID!)
          .map((actor) => actor.ID!);

        if (swordActorIds.length !== 8) {
          console.error(
            `R4S Raining Swords Collector: Missing swords, count ${swordActorIds.length}`,
          );
        }

        data.rainingSwords.firstActorId = swordActorIds[0] ?? 0;
      },
    },
    {
      id: 'R4S Raining Swords My Side Detector',
      type: 'Ability',
      // No source for this as the names aren't always correct for some reason
      netRegex: { id: '9617', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) =>
        data.rainingSwords.mySide = parseFloat(matches.x) < centerX ? 'left' : 'right',
    },
    {
      id: 'R4S Raining Swords Collect + Initial',
      type: 'Tether',
      netRegex: { id: ['0117', '0118'], capture: true },
      durationSeconds: 8,
      alertText: (data, matches, output) => {
        // 24 tethers total, in sets of 3, 8 sets total. Sets 1 and 2 correspond to first safe spots, etc.
        const swordId = matches.sourceId;
        let swordIndex = parseInt(swordId, 16) - data.rainingSwords.firstActorId;
        const swordSet = swordIndex > 3 ? data.rainingSwords.right : data.rainingSwords.left;
        // Swords are actually ordered south to north, invert them so it makes more sense
        swordIndex = 3 - (swordIndex % 4);
        const tetherSet = Math.floor(data.rainingSwords.tetherCount / 6);
        data.rainingSwords.tetherCount++;
        swordSet[tetherSet] = swordSet[tetherSet]?.filter((spot) => spot !== swordIndex) ?? [];

        if (data.rainingSwords.tetherCount === 6) {
          const leftSafe = data.rainingSwords.left[0]?.[0] ?? 0;
          const rightSafe = data.rainingSwords.right[0]?.[0] ?? 0;

          const mySide = data.rainingSwords.mySide;

          // Here (and below) if side couldn't be detected because player was dead
          // we could print out both sides instead of an unknown output?
          // And yes, it's possible to miss a tower in week one gear and survive.
          if (mySide === undefined)
            return output.unknown!();

          return output.safe!({
            side: output[mySide]!(),
            first: mySide === 'left' ? leftSafe + 1 : rightSafe + 1,
          });
        }
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        safe: {
          en: '${side}: Start at ${first}',
          ja: '${side}: まずは ${first} から',
          ko: '${side}: ${first}번으로!',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R4S Raining Swords Safe List',
      type: 'Tether',
      netRegex: { id: ['0117', '0118'], capture: false },
      condition: (data) => data.rainingSwords.tetherCount >= 18,
      durationSeconds: 24,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        const mySide = data.rainingSwords.mySide;
        if (mySide === undefined)
          return output.unknown!();

        const calloutSideSet = data.rainingSwords[mySide];

        const safeSpots = [
          calloutSideSet[0]?.[0] ?? 0,
          calloutSideSet[1]?.[0] ?? 0,
          calloutSideSet[2]?.[0] ?? 0,
        ];

        // Trim our last possible spot based on existing three safe spots
        safeSpots.push([0, 1, 2, 3].filter((spot) => !safeSpots.includes(spot))[0] ?? 0);

        return output.safe!({
          side: output[mySide]!(),
          order: safeSpots.map((i) => i + 1).join(output.separator!()),
        });
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        separator: {
          en: ' => ',
          de: ' => ',
          ja: ' => ',
          cn: ' => ',
          ko: ' 🔜 ',
        },
        safe: {
          en: '${side} Side: ${order}',
          ja: '${side} : ${order}',
          ko: '${side}: ${order}',
        },
        unknown: Outputs.unknown,
      },
    },

    // Sunrise Sabbath
    {
      id: 'R4S Ion Cluster Debuff Initial',
      type: 'GainsEffect',
      // FA0 - Positron (Yellow) (blue cannon)
      // FA1 - Negatron (Blue) (yellow cannon)
      // Long = 38s, Short = 23s
      netRegex: { effectId: ['FA0', 'FA1'] },
      condition: (data, matches) => {
        return data.me === matches.target &&
          data.phase === 'sunrise' &&
          data.ionClusterDebuff === undefined; // debuffs can get swapped/reapplied if you oopsie, so no spam
      },
      infoText: (data, matches, output) => {
        data.ionClusterDebuff = matches.effectId === 'FA0'
          ? (parseFloat(matches.duration) > 30 ? 'yellowLong' : 'yellowShort')
          : (parseFloat(matches.duration) > 30 ? 'blueLong' : 'blueShort');
        return output[data.ionClusterDebuff]!();
      },
      outputStrings: {
        yellowLong: {
          en: 'Long Yellow Debuff (Towers First)',
          ja: '長い黄色デバフ (塔から)',
          ko: '긴 🟡노랑 (타워 먼저)',
        },
        blueLong: {
          en: 'Long Blue Debuff (Towers First)',
          ja: '長い青色デバフ (塔から)',
          ko: '긴 🔵파랑 (타워 먼저)',
        },
        yellowShort: {
          en: 'Short Yellow Debuff (Cannons First)',
          ja: '短い黄色デバフ (ビーム誘導から)',
          ko: '짧은 🟡노랑 (🟦빔 먼저)',
        },
        blueShort: {
          en: 'Short Blue Debuff (Cannons First)',
          ja: '短い青色デバフ (ビーム誘導から)',
          ko: '짧은 🔵파랑 (🟨빔 먼저)',
        },
      },
    },
    {
      id: 'R4S Sunrise Sabbath Jumping Clone Collect 1',
      type: 'ActorControlExtra',
      // '1C' = jumping clone
      netRegex: { id: '4.{7}', category: actorControlCategoryMap.setModelState, param1: '1C' },
      condition: (data) => data.phase === 'sunrise' && !data.seenFirstSunrise,
      // they both face opposite or adjacent, so we only need one to resolve the mechanic
      suppressSeconds: 1,
      run: (data, matches) => {
        const id = matches.id;
        const loc = data.replicas[id]?.location;
        const facing = data.replicas[id]?.cardinalFacing;

        if (loc === undefined || facing === undefined)
          return;

        data.sunriseCloneToWatch = id;
        if (loc === 'dirN' || loc === 'dirS')
          data.sunriseTowerSpots = facing === 'opposite' ? 'northSouth' : 'eastWest';
        else if (loc === 'dirE' || loc === 'dirW')
          data.sunriseTowerSpots = facing === 'opposite' ? 'eastWest' : 'northSouth';
      },
    },
    // After clones jump for 1st towers, their model state does not change, but an ActorMove packet
    // is sent to change their location/heading. There's really no need to continually track
    // actor/position heading and update data.replicas because we can set the data props we need
    // directly from a single ActorMove packet for the 2nd set of towers.
    {
      id: 'R4S Replica Jumping Clone Collect 2',
      type: 'ActorMove',
      netRegex: { id: '4.{7}' },
      condition: (data, matches) =>
        data.phase === 'sunrise' && data.seenFirstSunrise &&
        data.sunriseCloneToWatch === matches.id,
      run: (data, matches) => {
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const hdg = parseFloat(matches.heading);

        const locDir = Directions.xyTo4DirNum(x, y, centerX, p2CenterY) % 2; // 0 = N/S, 1 = E/W
        const hdgDir = Directions.outputFrom8DirNum(Directions.hdgTo8DirNum(hdg));
        data.sunriseTowerSpots = isCardinalDir(hdgDir)
          ? (locDir === 0 ? 'northSouth' : 'eastWest') // opposite-facing
          : (locDir === 0 ? 'eastWest' : 'northSouth'); // adjacent-facing
      },
    },
    {
      id: 'R4S Sunrise Sabbath Cannon Color Collect',
      type: 'GainsEffect',
      // 2F4 = yellow cannnon, 2F5 = blue cannon
      netRegex: { effectId: 'B9A', count: ['2F4', '2F5'] },
      condition: (data) => data.phase === 'sunrise',
      run: (data, matches) => {
        const id = matches.targetId;
        const color = matches.count === '2F4' ? 'yellow' : 'blue';
        data.sunriseCannons.push(id);
        (data.replicas[id] ??= {}).cannonColor = color;
      },
    },
    {
      id: 'R4S Sunrise Sabbath Cannnons + Towers',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: ['2F4', '2F5'], capture: false },
      condition: (data) => data.phase === 'sunrise',
      delaySeconds: 0.2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.ionClusterDebuff === undefined || data.sunriseCannons.length !== 4)
          return;

        const blueCannons: DirectionOutputIntercard[] = [];
        const yellowCannons: DirectionOutputIntercard[] = [];
        data.sunriseCannons.forEach((id) => {
          const loc = data.replicas[id]?.location;
          const color = data.replicas[id]?.cannonColor;
          if (loc === undefined || color === undefined || !isIntercardDir(loc))
            return;
          (color === 'blue' ? blueCannons : yellowCannons).push(loc);
        });

        // Second time through, shorts and longs swap responsibilities
        const swapMap: Record<IonClusterDebuff, IonClusterDebuff> = {
          'yellowShort': 'yellowLong',
          'yellowLong': 'yellowShort',
          'blueShort': 'blueLong',
          'blueLong': 'blueShort',
        };
        const task = data.seenFirstSunrise ? swapMap[data.ionClusterDebuff] : data.ionClusterDebuff;

        // use bracket notation because cactbot eslint doesn't handle spread operators
        // in outputStrings; see #266 for more info
        let towerSoakStr = output['unknown']!();
        let cannonBaitStr = output['unknown']!();

        if (data.sunriseTowerSpots !== undefined) {
          towerSoakStr = output[data.sunriseTowerSpots]!();
          cannonBaitStr = data.sunriseTowerSpots === 'northSouth'
            ? output.eastWest!()
            : output.northSouth!();
          if (data.options.AutumnStyle) {
            let arrow = 'unknown';
            if (data.sunriseTowerSpots === 'northSouth')
              arrow = data.imDps ? 'arrowN' : 'arrowS';
            else
              arrow = data.imDps ? 'arrowE' : 'arrowW';
            towerSoakStr = output[arrow]!();
          }
        }

        if (task === 'yellowShort' || task === 'blueShort') {
          const cannonLocs = task === 'yellowShort' ? blueCannons : yellowCannons;
          if (data.options.AutumnStyle) {
            const locPriors = ['dirNE', 'dirSE', 'dirSW', 'dirNW', 'unknown'] as const;
            const arrowNames = ['arrowNE', 'arrowSE', 'arrowSW', 'arrowNW', 'unknown'] as const;
            const first = cannonLocs[0] !== undefined ? locPriors.indexOf(cannonLocs[0]) : 4;
            const second = cannonLocs[1] !== undefined ? locPriors.indexOf(cannonLocs[1]) : 4;
            const select = data.imDps ? Math.min(first, second) : Math.max(first, second);
            const mine = output[arrowNames[select]!]!();
            const res = task === 'yellowShort' ? 'aYellow' : 'aBlue';
            return output[res]!({ loc: mine, bait: cannonBaitStr });
          }
          const locStr = cannonLocs.map((loc) => output[loc]!()).join('/');
          return output[task]!({ loc: locStr, bait: cannonBaitStr });
        }
        if (data.options.AutumnStyle)
          return output.aLong!({ bait: towerSoakStr });
        return output[task]!({ bait: towerSoakStr });
      },
      run: (data) => {
        data.sunriseCannons = [];
        data.seenFirstSunrise = true;
        delete data.sunriseTowerSpots;
      },
      outputStrings: {
        ...Directions.outputStringsIntercardDir,
        northSouth: {
          en: 'N/S',
          ja: '南/北',
          ko: '남북',
        },
        eastWest: {
          en: 'E/W',
          ja: '東/西',
          ko: '동서',
        },
        yellowLong: {
          en: 'Soak Tower (${bait})',
          ja: '塔を踏んで (${bait})',
          ko: '${bait} 타워 밟아요',
        },
        blueLong: {
          en: 'Soak Tower (${bait})',
          ja: '塔を踏んで (${bait})',
          ko: '${bait} 타워 밟아요',
        },
        yellowShort: {
          en: 'Blue Cannon (${loc}) - Point ${bait}',
          ja: '青いビーム誘導 (${loc}) - ${bait}',
          ko: '🟦빔 ${loc} ${bait} 유도',
        },
        blueShort: {
          en: 'Yellow Cannon (${loc}) - Point ${bait}',
          ja: '黄色いビーム誘導 (${loc}) - ${bait}',
          ko: '🟨빔 ${loc} ${bait} 유도',
        },
        aLong: {
          en: 'Soak Tower (${bait})',
          ko: '타워${bait} 밟아요',
        },
        aYellow: {
          en: 'Blue Cannon (${loc}) - Point ${bait}',
          ko: '🟦빔${loc} (${bait} 유도)',
        },
        aBlue: {
          en: 'Yellow Cannon (${loc}) - Point ${bait}',
          ko: '🟨빔${loc} (${bait} 유도)',
        },
        ...AutumnDirections.outputStringsArrow8,
      },
    },

    // Finale
    {
      id: 'R4S Sword Quiver AoE',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(swordQuiverSafeMap), source: 'Wicked Thunder', capture: false },
      response: Responses.bigAoe(),
    },
    // Use Ability lines for these triggers so they don't collide with the AoE call,
    // and also because the cast starts ~14s before the mechanic resolves, and FFXIV
    // players have goldfish memories.
    {
      id: 'R4S Sword Quiver Safe',
      type: 'Ability',
      netRegex: { id: Object.keys(swordQuiverSafeMap), source: 'Wicked Thunder' },
      alertText: (_data, matches, output) => {
        const id = matches.id;
        if (!isSwordQuiverId(id))
          throw new UnreachableCode();

        return output[swordQuiverSafeMap[id]]!();
      },
      outputStrings: swordQuiverOutputStrings,
    },
    // ========== PRS ==========
    {
      id: 'R4S PRS Detect Role',
      type: 'StartsUsing',
      netRegex: { id: '95EF', source: 'Wicked Thunder', capture: false },
      suppressSeconds: 9999999,
      run: (data) => {
        data.imDps = data.party.isDPS(data.me);
        if (!data.options.AutumnStyle) {
          data.myRole = undefined;
        } else if (data.role === 'tank') {
          data.myRole = 'tank';
        } else if (data.role === 'healer') {
          data.myRole = 'healer';
        } else if (data.CanFeint()) {
          data.myRole = 'melee';
        } else {
          const aparam = data.options.AutumnParameter;
          if (aparam !== undefined && (aparam === 'D1' || aparam === 'D2'))
            data.myRole = 'melee';
          else
            data.myRole = 'ranged';
        }
      },
    },
    {
      id: 'R4S PRS Electrical Condenser Long',
      type: 'GainsEffect',
      netRegex: { effectId: 'F9F', capture: true },
      condition: (_data, matches) => parseFloat(matches.duration) > 40,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 7,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.condenserTimer === 'short')
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Stack south',
          ko: '아래쪽 가운데서 뭉쳐요',
        },
      },
    },
    {
      id: 'R4S PRS Electrical Condenser Short',
      type: 'GainsEffect',
      netRegex: { effectId: 'F9F', capture: true },
      condition: (_data, matches) => parseFloat(matches.duration) < 24,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 7,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.condenserTimer === 'long')
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Stack south',
          ko: '아래쪽 가운데서 뭉쳐요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Electromine': 'エレクトリックマイン',
        'Wicked Thunder': 'ウィケッドサンダー',
      },
    },
  ],
};

export default triggerSet;
