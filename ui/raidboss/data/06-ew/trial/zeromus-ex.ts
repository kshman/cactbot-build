import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  phase: 'one' | 'two';
  seenSableThread?: boolean;
  miasmicBlasts: PluginCombatantState[];
  busterPlayers: string[];
  forkedPlayers: string[];
  blackHolePlayer?: string;
  flareMechanic?: 'spread' | 'stack';
  noxPlayers: string[];
  flowLocation?: 'north' | 'middle' | 'south';
}

const headmarkerMap = {
  tankBuster: '016C',
  blackHole: '014A',
  tether: '0146',
  // Most spread markers (Big Bang, Big Crunch, Dark Divides)
  spread: '0178',
  accelerationBomb: '010B',
  nox: '00C5',
  akhRhaiSpread: '0017',
  enums: '00D3',
  // The Dark Beckons, but also Umbral Rays
  stack: '003E',
} as const;

const centerX = 100;
const centerY = 100;

const triggerSet: TriggerSet<Data> = {
  id: 'TheAbyssalFractureExtreme',
  zoneId: ZoneId.TheAbyssalFractureExtreme,
  timelineFile: 'zeromus-ex.txt',
  initData: () => {
    return {
      phase: 'one',
      miasmicBlasts: [],
      busterPlayers: [],
      forkedPlayers: [],
      noxPlayers: [],
    };
  },
  timelineTriggers: [
    {
      id: 'ZeromusEx Flare',
      // Extra time for spreading out.
      // This could also be StartsUsing 85BD.
      regex: /^Flare$/,
      beforeSeconds: 13,
      suppressSeconds: 20,
      response: Responses.getTowers(),
    },
    {
      id: 'ZeromusEx Big Bang Spread',
      // Extra time for spreading out.
      // This could alternatively be StartsUsing 8B4C or HeadMarker 0178.
      regex: /^Big Bang$/,
      beforeSeconds: 13,
      suppressSeconds: 20,
      response: Responses.spread(),
    },
    {
      id: 'ZeromusEx Big Crunch Spread',
      // Extra time for spreading out.
      // This could alternatively be StartsUsing 8B4D or HeadMarker 0178.
      regex: /^Big Crunch$/,
      beforeSeconds: 13,
      suppressSeconds: 20,
      response: Responses.spread(),
    },
  ],
  triggers: [
    {
      id: 'ZeromusEx Abyssal Nox',
      type: 'GainsEffect',
      netRegex: { effectId: '6E9', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'HP 만땅으로!',
        },
      },
    },
    {
      id: 'ZeromusEx Sable Thread',
      type: 'Ability',
      netRegex: { id: '8AEF', source: 'Zeromus' },
      alertText: (data, matches, output) => {
        const num = data.seenSableThread ? 7 : 6;
        data.seenSableThread = true;
        if (matches.target === data.me)
          return output.lineStackOnYou!({ num: num });
        return output.lineStackOn!({ num: num, player: data.ShortName(matches.target) });
      },
      outputStrings: {
        lineStackOn: {
          en: '${num}연속 사브레 스레드: ${player}',
        },
        lineStackOnYou: {
          en: '내게 ${num}연속 사브레 스레드',
        },
      },
    },
    {
      id: 'ZeromusEx Dark Matter You',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.tankBuster },
      alertText: (data, matches, output) => {
        data.busterPlayers.push(matches.target);
        if (data.me === matches.target)
          return output.tankBusterOnYou!();
      },
      outputStrings: {
        tankBusterOnYou: Outputs.tankBusterOnYou,
      },
    },
    {
      id: 'ZeromusEx Dark Matter Others',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.tankBuster, capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        if (!data.busterPlayers.includes(data.me))
          return output.tankBusters!();
      },
      outputStrings: {
        tankBusters: Outputs.tankBusters,
      },
    },
    {
      id: 'ZeromusEx Dark Matter Cleanup',
      type: 'Ability',
      netRegex: { id: '8B84', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      run: (data) => data.busterPlayers = [],
    },
    {
      id: 'ZeromusEx Visceral Whirl NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B43', source: 'Zeromus', capture: false },
      infoText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.atext!();
        return output.text!({ dir1: output.ne!(), dir2: output.sw!() });
      },
      outputStrings: {
        text: {
          en: '${dir1}/${dir2}',
          de: '${dir1}/${dir2}',
        },
        ne: Outputs.northeast,
        sw: Outputs.southwest,
        atext: {
          en: '안전: 🡿🡽 (오른쪽)',
        },
      },
    },
    {
      id: 'ZeromusEx Visceral Whirl NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B46', source: 'Zeromus', capture: false },
      infoText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.atext!();
        return output.text!({ dir1: output.nw!(), dir2: output.se!() });
      },
      outputStrings: {
        text: {
          en: '${dir1}/${dir2}',
          de: '${dir1}/${dir2}',
        },
        nw: Outputs.northwest,
        se: Outputs.southeast,
        atext: {
          en: '안전: 🡼🡾 (왼쪽)',
        },
      },
    },
    {
      id: 'ZeromusEx Miasmic Blasts Reset',
      type: 'StartsUsing',
      // reset Blasts combatant data when the preceding Visceral Whirl is used
      netRegex: { id: '8B4[36]', source: 'Zeromus', capture: false },
      run: (data) => data.miasmicBlasts = [],
    },
    {
      id: 'ZeromusEx Miasmic Blast Safe Spots',
      type: 'StartsUsing',
      netRegex: { id: '8B49', source: 'Zeromus', capture: true },
      condition: (data) => !data.options.AutumnStyle,
      delaySeconds: 0.5,
      promise: async (data, matches) => {
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;

        const combatant = combatants[0];
        if (combatant === undefined)
          return;

        data.miasmicBlasts.push(combatant);
      },
      alertText: (data, _matches, output) => {
        if (data.miasmicBlasts.length !== 3) {
          return;
        }
        // Blasts can spawn center, on cardinals (+/-14 from center), or on intercards (+/-7 from center).
        // Unsafe spots vary for each of the 9 possible spawn points, but are always the same *relative* to that type.
        // So apply a fixed set of modifiers based on type, regardless of spawn point, to eliminate unsafe spots.
        const cardinal16Dirs = [0, 4, 8, 12];
        const intercard16Dirs = [2, 6, 10, 14];
        const unsafe16DirModifiers = {
          cardinal: [-1, 0, 1, 4, 5, 11, 12],
          intercard: [-2, 0, 2, 3, 8, 13],
        };

        let possibleSafeSpots = Directions.output16Dir;

        for (const blast of data.miasmicBlasts) {
          // special case for center - don't need to find relative dirs, just remove all intercards
          if (Math.round(blast.PosX) === 100 && Math.round(blast.PosY) === 100)
            intercard16Dirs.forEach((intercard) =>
              possibleSafeSpots = possibleSafeSpots.filter((dir) =>
                dir !== Directions.output16Dir[intercard]
              )
            );
          else {
            const blastPos16Dir = Directions.xyTo16DirNum(blast.PosX, blast.PosY, centerX, centerY);
            const relativeUnsafeDirs = cardinal16Dirs.includes(blastPos16Dir)
              ? unsafe16DirModifiers.cardinal
              : unsafe16DirModifiers.intercard;
            for (const relativeUnsafeDir of relativeUnsafeDirs) {
              const actualUnsafeDir = (16 + blastPos16Dir + relativeUnsafeDir) % 16;
              possibleSafeSpots = possibleSafeSpots.filter((dir) =>
                dir !== Directions.output16Dir[actualUnsafeDir]
              );
            }
          }
        }

        if (possibleSafeSpots.length !== 2)
          return output.avoidUnknown!();

        const [safeDir1, safeDir2] = possibleSafeSpots;
        if (safeDir1 === undefined || safeDir2 === undefined)
          return output.avoidUnknown!();

        return output.combo!({ dir1: output[safeDir1]!(), dir2: output[safeDir2]!() });
      },
      outputStrings: {
        combo: {
          en: '${dir1} / ${dir2}',
        },
        avoidUnknown: {
          en: 'Avoid Line Cleaves',
        },
        ...Directions.outputStrings16Dir,
      },
    },
    {
      id: 'ZeromusEx PR Miasmic Blast',
      type: 'StartsUsing',
      netRegex: { id: '8B49', capture: true },
      condition: (data) => data.options.AutumnStyle,
      delaySeconds: 0.5,
      promise: async (data, matches) => {
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;

        if (combatants.length !== 1)
          return;

        const combatant = combatants[0];
        if (combatant === undefined)
          return;

        data.miasmicBlasts.push(combatant);
      },
      infoText: (data, _matches, output) => {
        if (data.miasmicBlasts.length !== 3)
          return;
        const possibleSafeSpots = [
          'WNW',
          'NW',
          'NNW',
          'NNE',
          'NE',
          'ENE',
        ] as const;
        type safeSpotType = typeof possibleSafeSpots[number];
        let safeSpots: safeSpotType[] = [
          'WNW',
          'NW',
          'NNW',
          'NNE',
          'NE',
          'ENE',
        ];
        const safeSpotMap: {
          [key in safeSpotType]: { x: number; y: number };
        } = {
          'WNW': { x: 80, y: 94 },
          'NW': { x: 80, y: 80 },
          'NNW': { x: 94, y: 80 },
          'NNE': { x: 106, y: 80 },
          'NE': { x: 120, y: 80 },
          'ENE': { x: 120, y: 94 },
        };

        for (const mi of data.miasmicBlasts) {
          const removeSpots: safeSpotType[] = [];
          for (const spot of safeSpots) {
            const angle =
              ((Math.atan2(mi.PosY - safeSpotMap[spot].y, mi.PosX - safeSpotMap[spot].x) * 180 /
                Math.PI) + 180) % 90;
            if (Math.abs(angle - 45) < Number.EPSILON) {
              removeSpots.push(spot);
            }
          }
          safeSpots = safeSpots.filter((spot) => !removeSpots.includes(spot));
        }

        if (safeSpots.length !== 1 || safeSpots[0] === undefined)
          return output.unknown!();

        const where = output[safeSpots[0]]!();
        return output.text!({ safe: where });
      },
      outputStrings: {
        text: {
          en: '안전 마커: ${safe}',
        },
        WNW: {
          en: '④',
        },
        NW: {
          en: '①',
        },
        NNW: {
          en: 'Ⓐ',
        },
        NNE: {
          en: 'Ⓑ',
        },
        NE: {
          en: '②',
        },
        ENE: {
          en: '③',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'ZeromusEx Big Bang',
      type: 'StartsUsing',
      netRegex: { id: '8B4C', source: 'Zeromus', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'ZeromusEx Forked Lightning',
      type: 'GainsEffect',
      netRegex: { effectId: 'ED7' },
      condition: (data, matches) => {
        data.forkedPlayers.push(matches.target);
        return matches.target === data.me;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 5,
      alarmText: (_data, _matches, output) => output.forkedLightning!(),
      outputStrings: {
        forkedLightning: {
          en: '라이트닝! 흩어져요',
        },
      },
    },
    {
      id: 'ZeromusEx The Dark Beckons Stack',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.stack },
      condition: (data) => data.phase === 'one',
      // Wait to collect tank markers.
      delaySeconds: 0.5,
      alertText: (data, matches, output) => {
        if (data.busterPlayers.includes(data.me))
          return;
        if (data.forkedPlayers.includes(data.me))
          return;
        if (data.me === matches.target)
          return output.stackOnYou!();
        return output.stackOnTarget!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOnTarget: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'ZeromusEx Acceleration Bomb',
      type: 'GainsEffect',
      netRegex: { effectId: 'A61' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      response: Responses.stopEverything(),
    },
    {
      id: 'ZeromusEx Tether Bait',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.tether, capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '즐빼기! 가운데 뭉쳐요',
        },
      },
    },
    {
      id: 'ZeromusEx Tether',
      type: 'Tether',
      netRegex: { id: ['00A3', '010B'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      suppressSeconds: 10,
      alertText: (data, matches, output) => {
        const partner = matches.source === data.me ? matches.target : matches.source;
        return output.breakTether!({ partner: data.ShortName(partner) });
      },
      outputStrings: {
        breakTether: {
          en: '줄 끊어요: ${partner}',
          de: 'Verbindung brechen (mit ${partner})',
          ja: '線切る (${partner})',
          cn: '拉断连线 (和 ${partner})',
          ko: '선 끊기 (+ ${partner})',
        },
      },
    },
    {
      id: 'ZeromusEx Black Hole Tracker',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.blackHole },
      run: (data, matches) => data.blackHolePlayer = matches.target,
    },
    {
      id: 'ZeromusEx Fractured Eventide NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B3C', source: 'Zeromus', capture: false },
      alarmText: (data, _matches, output) => {
        if (data.me === data.blackHolePlayer)
          return data.options.AutumnStyle ? output.aHole!() : output.blackHole!();
      },
      alertText: (data, _matches, output) =>
        data.options.AutumnStyle ? output.ane!() : output.northeast!(),
      run: (data) => delete data.blackHolePlayer,
      outputStrings: {
        northeast: Outputs.northeast,
        blackHole: {
          en: '내게 블랙홀: 오른쪽 벽',
        },
        aHole: {
          en: '내게 블랙홀: 🡺②마커',
        },
        ane: {
          en: '안전: 🡺',
        },
      },
    },
    {
      id: 'ZeromusEx Fractured Eventide NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B3D', source: 'Zeromus', capture: false },
      alarmText: (data, _matches, output) => {
        if (data.me === data.blackHolePlayer)
          return data.options.AutumnStyle ? output.aHole!() : output.blackHole!();
      },
      alertText: (data, _matches, output) =>
        data.options.AutumnStyle ? output.anw!() : output.northwest!(),
      run: (data) => delete data.blackHolePlayer,
      outputStrings: {
        northwest: Outputs.northwest,
        blackHole: {
          en: '내게 블랙홀: 왼쪽 벽',
        },
        aHole: {
          en: '내게 블랙홀: 🡸①마커',
        },
        anw: {
          en: '안전: 🡸',
        },
      },
    },
    {
      id: 'ZeromusEx Big Crunch',
      type: 'StartsUsing',
      netRegex: { id: '8B4D', source: 'Zeromus', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'ZeromusEx Sparking Flare Tower',
      type: 'StartsUsing',
      netRegex: { id: '8B5E', source: 'Zeromus', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.flareMechanic = 'spread',
      outputStrings: {
        text: {
          en: '타워 밟고 => 흩어져요',
        },
      },
    },
    {
      id: 'ZeromusEx Branding Flare Tower',
      type: 'StartsUsing',
      netRegex: { id: '8B5F', source: 'Zeromus', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.flareMechanic = 'stack',
      outputStrings: {
        text: {
          en: '타워 밟고 => 페어',
        },
      },
    },
    {
      id: 'ZeromusEx Flare Mechanic With Nox',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.nox },
      condition: (data, matches) => {
        data.noxPlayers.push(matches.target);
        return data.me === matches.target;
      },
      alarmText: (data, _matches, output) => {
        if (data.flareMechanic === 'stack')
          return output.stackWithNox!();
        if (data.flareMechanic === 'spread')
          return output.spreadWithNox!();
      },
      outputStrings: {
        stackWithNox: {
          en: '페어 + 따라오는 구슬',
        },
        spreadWithNox: {
          en: '흩어지고 + 따라오는 구슬',
        },
      },
    },
    {
      id: 'ZeromusEx Flare Mechanic No Nox',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.nox, capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.noxPlayers.includes(data.me))
          return;
        if (data.flareMechanic === 'stack')
          return output.stack!();
        if (data.flareMechanic === 'spread')
          return output.spread!();
      },
      outputStrings: {
        stack: {
          en: '페어! 둘이 뭉쳐요',
        },
        spread: {
          en: '흩어져요',
        },
      },
    },
    {
      id: 'ZeromusEx Rend the Rift',
      type: 'StartsUsing',
      netRegex: { id: '8C0D', source: 'Zeromus', capture: false },
      response: Responses.aoe(),
      run: (data) => data.phase = 'two',
    },
    {
      id: 'ZeromusEx Nostalgia',
      type: 'Ability',
      // Call this on the ability not the cast so 10 second mits last.
      netRegex: { id: '8B6B', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      response: Responses.bigAoe(),
    },
    {
      id: 'ZeromusEx Flow of the Abyss',
      type: 'MapEffect',
      netRegex: { flags: '00020001', location: ['02', '03', '04'] },
      infoText: (data, matches, output) => {
        const flowMap: { [location: string]: Data['flowLocation'] } = {
          '02': 'north',
          '03': 'middle',
          '04': 'south',
        } as const;

        data.flowLocation = flowMap[matches.location];
        if (data.flowLocation === 'north')
          return output.north!();
        if (data.flowLocation === 'middle')
          return output.middle!();
        if (data.flowLocation === 'south')
          return output.south!();
      },
      outputStrings: {
        north: {
          en: '어비스: 앞쪽이 위험해요',
        },
        middle: {
          en: '어비스: 가운데가 위험해요',
        },
        south: {
          en: '어비스: 뒤쪽이 위험해요',
        },
      },
    },
    {
      id: 'ZeromusEx Akh Rhai',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.akhRhaiSpread },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.flowLocation === undefined)
          return output.spread!();
        return output[`${data.flowLocation}Spread`]!();
      },
      run: (data) => delete data.flowLocation,
      outputStrings: {
        spread: Outputs.spread,
        northSpread: {
          en: '흩어져요: 가운데/뒤쪽',
        },
        middleSpread: {
          en: '흩어져요: 앞쪽/뒤쪽',
        },
        southSpread: {
          en: '흩어져요: 앞쪽/가운데',
        },
      },
    },
    {
      id: 'ZeromusEx Akh Rhai Followup',
      type: 'Ability',
      netRegex: { id: '8B74', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
    {
      id: 'ZeromusEx Umbral Prism Enumeration',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.enums, capture: false },
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.flowLocation === undefined)
          return output.enumeration!();
        return output[`${data.flowLocation}Enumeration`]!();
      },
      run: (data) => delete data.flowLocation,
      outputStrings: {
        enumeration: {
          en: '페어',
          de: 'Enumeration',
          fr: 'Énumération',
          ja: 'エアーバンプ',
          cn: '蓝圈分摊',
          ko: '2인 장판',
        },
        northEnumeration: {
          en: '페어: 가운데/뒤쪽',
        },
        middleEnumeration: {
          en: '페어: 앞쪽/뒤쪽',
        },
        southEnumeration: {
          en: '페어: 앞쪽/가운데',
        },
      },
    },
    {
      id: 'ZeromusEx Umbral Rays Stack',
      type: 'HeadMarker',
      netRegex: { id: headmarkerMap.stack, capture: false },
      condition: (data) => data.phase === 'two',
      alertText: (data, _matches, output) => {
        if (data.flowLocation === undefined)
          return output.stack!();
        return output[`${data.flowLocation}Stack`]!();
      },
      run: (data) => delete data.flowLocation,
      outputStrings: {
        stack: Outputs.stackMarker,
        northStack: {
          en: '뭉쳐요: 가운데',
        },
        middleStack: {
          en: '뭉쳐요: 앞쪽',
        },
        southStack: {
          en: '뭉쳐요: 앞쪽/가운데',
        },
      },
    },
    // ////////////////////////////////
    {
      id: 'ZeromusEx PR Big Bang Enrage',
      type: 'StartsUsing',
      netRegex: { id: '8C1E', capture: false },
      condition: (data) => data.options.AutumnStyle,
      durationSeconds: 9.7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전멸 공격!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Branding Flare/Sparking Flare': 'Branding/Sparking Flare',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Comet': 'Komet',
        'Toxic Bubble': 'Giftblase',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        'Abyssal Echoes': 'Abyssal-Echos',
        'Abyssal Nox': 'Abyssal-Nox',
        'Akh Rhai': 'Akh Rhai',
        'Big Bang': 'Großer Knall',
        'Big Crunch': 'Großer Quetscher',
        'Black Hole': 'Schwarzes Loch',
        'Branding Flare': 'Flare-Brand',
        'Burst': 'Kosmos-Splitter',
        'Bury': 'Impakt',
        'Chasmic Nails': 'Abyssal-Nagel',
        'Dark Matter': 'Dunkelmaterie',
        'Dimensional Surge': 'Dimensionsschwall',
        'Explosion': 'Explosion',
        '(?<! )Flare': 'Flare',
        'Flow of the Abyss': 'Abyssaler Strom',
        'Forked Lightning': 'Gabelblitz',
        'Fractured Eventide': 'Abendglut',
        'Meteor Impact': 'Meteoreinschlag',
        'Miasmic Blast': 'Miasma-Detonation',
        'Nostalgia': 'Heimweh',
        'Primal Roar': 'Lautes Gebrüll',
        'Prominence Spine': 'Ossale Protuberanz',
        'Rend the Rift': 'Dimensionsstörung',
        'Sable Thread': 'Pechschwarzer Pfad',
        'Sparking Flare': 'Flare-Funken',
        'Umbral Prism': 'Umbrales Prisma',
        'Umbral Rays': 'Pfad der Dunkelheit',
        'Visceral Whirl': 'Viszerale Schürfwunden',
        'Void Bio': 'Nichts-Bio',
        'Void Meteor': 'Nichts-Meteo',
        'the Dark Beckons': 'Fressende Finsternis: Last',
        'the Dark Binds': 'Fressende Finsternis: Kette',
        'the Dark Divides': 'Fressende Finsternis: Zerschmetterung',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Comet': 'comète',
        'Toxic Bubble': 'bulle empoisonnée',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        'Abyssal Echoes': 'Écho abyssal',
        'Abyssal Nox': 'Nox abyssal',
        'Akh Rhai': 'Akh Rhai',
        'Big Bang': 'Big bang',
        'Big Crunch': 'Big crunch',
        'Black Hole': 'Trou noir',
        'Branding Flare': 'Marque de brasier',
        'Burst': 'Éclatement',
        'Bury': 'Impact',
        'Chasmic Nails': 'Clous abyssaux',
        'Dark Matter': 'Matière sombre',
        'Dimensional Surge': 'Déferlante dimensionnelle',
        'Explosion': 'Explosion',
        '(?<! )Flare': 'Brasier',
        'Flow of the Abyss': 'Flot abyssal',
        'Forked Lightning': 'Éclair ramifié',
        'Fractured Eventide': 'Éclat crépusculaire',
        'Meteor Impact': 'Impact de météore',
        'Miasmic Blast': 'Explosion miasmatique',
        'Nostalgia': 'Nostalgie',
        'Primal Roar': 'Rugissement furieux',
        'Prominence Spine': 'Évidence ossuaire',
        'Rend the Rift': 'Déchirure dimensionnelle',
        'Sable Thread': 'Rayon sombre',
        'Sparking Flare': 'Étincelle de brasier',
        'Umbral Prism': 'Déluge de Ténèbres',
        'Umbral Rays': 'Voie de ténèbres',
        'Visceral Whirl': 'Écorchure viscérale',
        'Void Bio': 'Bactéries du néant',
        'Void Meteor': 'Météores du néant',
        'the Dark Beckons': 'Ténèbres rongeuses : Gravité',
        'the Dark Binds': 'Ténèbres rongeuses : Chaînes',
        'the Dark Divides': 'Ténèbres rongeuses : Pulvérisation',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Comet': 'コメット',
        'Toxic Bubble': 'ポイズナスバブル',
        'Zeromus': 'ゼロムス',
      },
      'replaceText': {
        'Abyssal Echoes': 'アビサルエコー',
        'Abyssal Nox': 'アビサルノックス',
        'Akh Rhai': 'アク・ラーイ',
        'Big Bang': 'ビッグバーン',
        'Big Crunch': 'ビッグクランチ',
        'Black Hole': 'ブラックホール',
        'Branding Flare': 'フレアブランド',
        'Burst': '飛散',
        'Bury': '衝撃',
        'Chasmic Nails': 'アビサルネイル',
        'Dark Matter': 'ダークマター',
        'Dimensional Surge': 'ディメンションサージ',
        'Explosion': '爆発',
        '(?<! )Flare': 'フレア',
        'Flow of the Abyss': 'アビサルフロウ',
        'Forked Lightning': 'フォークライトニング',
        'Fractured Eventide': '黒竜閃',
        'Meteor Impact': 'メテオインパクト',
        'Miasmic Blast': '瘴気爆発',
        'Nostalgia': '望郷',
        'Primal Roar': '大咆哮',
        'Prominence Spine': 'プロミネンススパイン',
        'Rend the Rift': '次元干渉',
        'Sable Thread': '漆黒の熱線',
        'Sparking Flare': 'フレアスパーク',
        'Umbral Prism': '闇の重波動',
        'Umbral Rays': '闇の波動',
        'Visceral Whirl': 'ヴィセラルワール',
        'Void Bio': 'ヴォイド・バイオ',
        'Void Meteor': 'ヴォイド・メテオ',
        'the Dark Beckons': '闇の侵食：重',
        'the Dark Binds': '闇の侵食：鎖',
        'the Dark Divides': '闇の侵食：砕',
      },
    },
  ],
};

export default triggerSet;
