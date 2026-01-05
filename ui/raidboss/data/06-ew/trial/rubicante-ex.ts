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

// 7D09 Ghastly Torch during add phase *is* an aoe + bleed but is constant and small, so skipped.

export interface Data extends RaidbossData {
  circle: number;
  decOffset?: number;
  combatantData: PluginCombatantState[];
  ordealCount: number;
  flamespireBrandStack?: string;
  flamespireBrandHasFlare?: boolean;
  flamespireBrandDebuffCollect: NetMatches['GainsEffect'][];
  flamerakeInitialSafe?: 'cardinal' | 'intercardinal';
  dualfireTargets: string[];
  flamespireClawNumber?: number;
  flamespireClawDelay?: number;
  flamespireClawCounter: number;
  innerCircleId?: string;
  middleCircleId?: string;
  outerCircleId?: string;
  spinnyCollect: NetMatches['MapEffect'][];
}

const effectIds = {
  bloomingWeltFlare: 'D9B',
  furiousWeltStack: 'D9C',
  stingingWeltSpread: 'D9D',
} as const;

const mapEffectFlags = {
  clockwise: '00020001',
  counter: '00200010',

  // just for reference
  clearClockwise: '00080004',
  clearCounter: '00400004',
  fiery: '00020001',
  notFiery: '00080004',
} as const;

const mapEffectSlots = {
  inner: '01',
  middle: '02',
  outer: '03',
} as const;

// First headmarker is tankbuster on MT
const firstHeadmarker = parseInt('0156', 16);
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const ordealPromise = async (data: Data) => {
  data.combatantData = [];

  if (
    data.innerCircleId === undefined || data.middleCircleId === undefined ||
    data.outerCircleId === undefined
  )
    return;
  const hexIds = [data.innerCircleId, data.middleCircleId, data.outerCircleId];
  const decIds = hexIds.map((x) => parseInt(x, 16));

  // Sort combatant data by the same order of hexIds, aka [inner, middle, outer]
  data.combatantData = (await callOverlayHandler({
    call: 'getCombatants',
    ids: decIds,
  })).combatants.sort((a, b) => decIds.indexOf(a?.ID ?? 0) - decIds.indexOf(b?.ID ?? 0));
};

const triggerSet: TriggerSet<Data> = {
  id: 'MountOrdealsExtreme',
  zoneId: ZoneId.MountOrdealsExtreme,
  timelineFile: 'rubicante-ex.txt',
  initData: () => {
    return {
      circle: 0,
      combatantData: [],
      ordealCount: 0,
      flamespireBrandDebuffCollect: [],
      dualfireTargets: [],
      flamespireClawCounter: 0,
      spinnyCollect: [],
    };
  },
  timelineTriggers: [
    {
      id: 'RubicanteEx PR 곧 남북으로 팀',
      regex: /^Arch Inferno$/,
      beforeSeconds: 24,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'North/South Team divide',
          ja: 'North/South Team divide',
          ko: '곧 남북으로 팀',
        },
      },
    },
    {
      id: 'RubicanteEx PR 곧 주사위',
      regex: /^Flamespire Claw 1$/,
      beforeSeconds: 18,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dice soon',
          ja: 'Dice soon',
          ko: '곧 주사위',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'RubicanteEx Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      run: (data, matches) => {
        getHeadmarkerId(data, matches);
      },
    },
    {
      id: 'RubicanteEx Inferno Raidwide',
      type: 'StartsUsing',
      netRegex: { id: '7D2C', source: 'Rubicante', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'RubicanteEx Circle Id Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '808' },
      run: (data, matches) => {
        const count = matches.count;
        // Inner can also be 21F (V shape) and 220 (two lines), but 21E (one line) is first.
        if (count === '21E')
          data.innerCircleId = matches.targetId;
        else if (count === '221')
          data.middleCircleId = matches.targetId;
        else if (count === '222')
          data.outerCircleId = matches.targetId;
      },
    },
    {
      id: 'RubicanteEx Circle Spinny Collect',
      type: 'MapEffect',
      netRegex: {
        flags: [mapEffectFlags.clockwise, mapEffectFlags.counter],
        location: ['01', '02', '03'],
      },
      run: (data, matches) => data.spinnyCollect.push(matches),
    },
    {
      id: 'RubicanteEx Circle Spinny Clear',
      type: 'Ability',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      run: (data) => data.spinnyCollect = [],
    },
    {
      id: 'RubicanteEx Ordeal of Purgation Counter',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      run: (data) => data.ordealCount++,
    },
    {
      id: 'RubicanteEx Ordeal of Purgation 1',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      condition: (data) => data.ordealCount === 1,
      durationSeconds: 8,
      promise: ordealPromise,
      alertText: (data, _matches, output) => {
        // inner and outer rotating
        const spinny = data.spinnyCollect.find((x) => x.location === mapEffectSlots.inner);
        if (data.spinnyCollect.length !== 2 || spinny === undefined)
          return;

        // CW = go north
        // CCW = go south
        // Note: You can also always go opposite the inner line and slightly in the direction of rotation.
        const isCW = spinny.flags === mapEffectFlags.clockwise;
        const dirStr = isCW ? output.north!() : output.south!();
        return output.text!({ dir: dirStr });
      },
      outputStrings: {
        text: {
          en: '${dir} (max melee)',
          ja: '${dir} (max melee)',
          ko: '${dir} (칼 끝 아슬아슬)',
        },
        north: Outputs.north,
        south: Outputs.south,
      },
    },
    {
      id: 'RubicanteEx Ordeal of Purgation 2',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      condition: (data) => data.ordealCount === 2,
      durationSeconds: 8,
      promise: ordealPromise,
      alertText: (data, _matches, output) => {
        const [inner, middle, outer] = data.combatantData;
        if (inner === undefined || middle === undefined || outer === undefined)
          return;

        const innerDir8 = Directions.combatantStateHdgTo8Dir(inner);
        // The "left" leg of the V is north.
        // The middle of the V is innerDir + 1.
        // We want to go opposite, aka + 4.
        const safeDir8 = (innerDir8 + 1 + 4) % 8;
        return output[Directions.outputFrom8DirNum(safeDir8)]!();
      },
      // The entire quadrant is safe.
      outputStrings: Directions.outputStrings8Dir,
    },
    {
      id: 'RubicanteEx Ordeal of Purgation 3',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      condition: (data) => data.ordealCount === 3 || data.ordealCount === 7,
      durationSeconds: 8,
      promise: ordealPromise,
      alertText: (data, _matches, output) => {
        const [inner, middle, outer] = data.combatantData;
        if (inner === undefined || middle === undefined || outer === undefined)
          return;

        const innerDir = Directions.combatantStateHdgTo8Dir(inner);
        // The "left" leg of the V is north.
        // Tell people to go max melee to either inside interintercardinal of the V legs.
        // TODO: you could use middle's orientation here to say if the intercard between
        // the V legs is safe too.
        const safeDir16 = (innerDir * 2 + 1) % 16;
        const dirStr = {
          1: output.dirNNE!(),
          3: output.dirENE!(),
          5: output.dirESE!(),
          7: output.dirSSE!(),
          9: output.dirSSW!(),
          11: output.dirWSW!(),
          13: output.dirWNW!(),
          15: output.dirNNW!(),
        }[safeDir16];
        return output.text!({ dir: dirStr });
      },
      outputStrings: {
        text: {
          en: '${dir} (max melee)',
          ja: '${dir} (max melee)',
          ko: '${dir} (칼 끝 아슬아슬)',
        },
        dirNNE: Outputs.dirNNE,
        dirENE: Outputs.dirENE,
        dirESE: Outputs.dirESE,
        dirSSE: Outputs.dirSSE,
        dirSSW: Outputs.dirSSW,
        dirWSW: Outputs.dirWSW,
        dirWNW: Outputs.dirWNW,
        dirNNW: Outputs.dirNNW,
      },
    },
    {
      id: 'RubicanteEx Ordeal of Purgation 4',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      condition: (data) => data.ordealCount === 4 || data.ordealCount === 8,
      durationSeconds: 8,
      promise: ordealPromise,
      alertText: (data, _matches, output) => {
        const [inner, middle, outer] = data.combatantData;
        if (inner === undefined || middle === undefined || outer === undefined)
          return;

        // only middle rotating
        const spinny = data.spinnyCollect.find((x) => x.location === mapEffectSlots.middle);
        if (data.spinnyCollect.length !== 1 || spinny === undefined)
          return;

        const isCW = spinny.flags === mapEffectFlags.clockwise;
        const middleDir8 = Directions.combatantStateHdgTo8Dir(middle);

        // Ordeal 4 is "use cat ears, follow the arrow".
        // "north" for middle is upside-down cat ears.
        // Therefore, if CW we go to WSW and if CCW we go to ESE.

        const safeDir16 = (middleDir8 * 2 + (isCW ? 11 : 5)) % 16;

        return {
          1: output.dirNNE!(),
          3: output.dirENE!(),
          5: output.dirESE!(),
          7: output.dirSSE!(),
          9: output.dirSSW!(),
          11: output.dirWSW!(),
          13: output.dirWNW!(),
          15: output.dirNNW!(),
        }[safeDir16];
      },
      // The entire eighth pie slice is safe.
      outputStrings: {
        dirNNE: Outputs.dirNNE,
        dirENE: Outputs.dirENE,
        dirESE: Outputs.dirESE,
        dirSSE: Outputs.dirSSE,
        dirSSW: Outputs.dirSSW,
        dirWSW: Outputs.dirWSW,
        dirWNW: Outputs.dirWNW,
        dirNNW: Outputs.dirNNW,
      },
    },
    {
      id: 'RubicanteEx Ordeal of Purgation 5',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      condition: (data) => data.ordealCount === 5,
      durationSeconds: 8,
      promise: ordealPromise,
      alertText: (data, _matches, output) => {
        const [inner, middle, outer] = data.combatantData;
        if (inner === undefined || middle === undefined || outer === undefined)
          return;

        const innerDir8 = Directions.combatantStateHdgTo8Dir(inner);
        // if the inner line is N, there are a number of safe areas here.
        // S max melee ccw to ESE max melee, along with ENE max melee.
        // but SE (aka dir8 of 3) is the most generous safe spot.

        const safeDir8 = (innerDir8 + 3) % 8;
        return output[Directions.outputFrom8DirNum(safeDir8)]!();
      },
      // The entire quadrant is safe.
      outputStrings: Directions.outputStrings8Dir,
    },
    {
      id: 'RubicanteEx Ordeal of Purgation 6',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      condition: (data) => data.ordealCount === 6,
      promise: ordealPromise,
      alertText: (data, _matches, output) => {
        const [inner, middle, outer] = data.combatantData;
        if (inner === undefined || middle === undefined || outer === undefined)
          return;

        // Inner should always be facing north (V pointing NE)
        // or facing south (V pointing SW).
        const innerDir8 = Directions.combatantStateHdgTo8Dir(inner);
        if (innerDir8 !== 0 && innerDir8 !== 4)
          return;

        // only middle rotating
        const spinny = data.spinnyCollect.find((x) => x.location === mapEffectSlots.middle);
        if (data.spinnyCollect.length !== 1 || spinny === undefined)
          return;

        const isCW = spinny.flags === mapEffectFlags.clockwise;
        const isNorth = innerDir8 === 0;

        // Only a few patterns possible, so just call cardinals for ease.
        if (isCW)
          return isNorth ? output.south!() : output.east!();
        return isNorth ? output.west!() : output.north!();
      },
      outputStrings: {
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
      },
    },
    {
      id: 'RubicanteEx Inferno Spread',
      // also applies a 15s bleed to each player
      type: 'StartsUsing',
      netRegex: { id: '7D0F', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread',
          ja: 'Spread',
          ko: '개인 장판! 자기 자리로',
        },
      },
    },
    {
      id: 'RubicanteEx Shattering Heat',
      type: 'StartsUsing',
      netRegex: { id: '7D2D', source: 'Rubicante' },
      response: Responses.tankBuster(),
    },
    {
      id: 'RubicanteEx Spike of Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D02', source: 'Rubicante' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'RubicanteEx Fourfold Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D03', source: 'Rubicante', capture: false },
      suppressSeconds: 5,
      response: Responses.healerGroups(),
    },
    {
      id: 'RubicanteEx Twinfold Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D04', source: 'Rubicante', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.stack!(),
      outputStrings: {
        stack: Outputs.stackPartner,
      },
    },
    {
      id: 'RubicanteEx Radial Flagration',
      type: 'StartsUsing',
      netRegex: { id: '7CFE', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: {
          en: 'Protean',
          ja: '基本散会',
          ko: '프로틴, 흩어져요',
        },
      },
    },
    {
      id: 'RubicanteEx Flamesent Ghastly Wind Tether',
      type: 'Tether',
      netRegex: { id: '00C0' },
      condition: (data, matches) => matches.target === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Face tether out',
          ja: '線を外へ向ける',
          ko: '내게 범위 줄!',
        },
      },
    },
    {
      id: 'RubicanteEx Flamesent Shattering Heat Tether',
      type: 'Tether',
      netRegex: { id: '0054', capture: false },
      suppressSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tank Tethers',
          ja: 'タンク線取り',
          ko: '탱크 줄!',
        },
      },
    },
    {
      id: 'RubicanteEx Blazing Rapture',
      type: 'StartsUsing',
      netRegex: { id: '7D07', source: 'Rubicante', capture: false },
      // This is a 14 second cast.
      delaySeconds: 4,
      response: Responses.bigAoe(),
    },
    {
      id: 'RubicanteEx Flamespire Brand Debuff Collect',
      type: 'GainsEffect',
      netRegex: { effectId: [effectIds.bloomingWeltFlare, effectIds.furiousWeltStack] },
      run: (data, matches) => {
        data.flamespireBrandDebuffCollect.push(matches);
        if (matches.effectId === effectIds.furiousWeltStack)
          data.flamespireBrandStack = matches.target;
        if (matches.effectId === effectIds.bloomingWeltFlare && data.me === matches.target)
          data.flamespireBrandHasFlare = true;
      },
    },
    {
      id: 'RubicanteEx Flamespire Brand Blooming Welt',
      type: 'Ability',
      // 7D18 = 0.2s telegraph for the first Flamerake along with 7D1B/7D19 damage
      netRegex: { id: '7D18', source: 'Rubicante', capture: false },
      condition: (data) => data.flamespireBrandHasFlare,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.flamerakeInitialSafe === undefined)
          return output.out!();
        if (data.flamerakeInitialSafe === 'cardinal')
          return output.outIntercard!();
        return output.outCardinal!();
      },
      outputStrings: {
        out: Outputs.out,
        outCardinal: {
          en: 'Out + Cardinal',
          ja: 'Out + Cardinal',
          ko: '밖으로 🔜 십자',
        },
        outIntercard: {
          en: 'Out + Intercard',
          ja: 'Out + Intercard',
          ko: '밖으로 🔜 비스듬히',
        },
      },
    },
    {
      id: 'RubicanteEx Flamespire Brand Furious Welt',
      type: 'Ability',
      // 7D18 = 0.2s telegraph for the first Flamerake along with 7D1B/7D19 damage
      netRegex: { id: '7D18', source: 'Rubicante', capture: false },
      condition: (data) => !data.flamespireBrandHasFlare,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.flamespireBrandStack === data.me)
          return output.stackOnYou!();
        return output.stackOnPlayer!({ player: data.party.member(data.flamespireBrandStack) });
      },
      outputStrings: {
        stackOnPlayer: Outputs.stackOnPlayer,
        stackOnYou: Outputs.stackOnYou,
      },
    },
    {
      id: 'RubicanteEx Flamespire Brand Stinging Welt',
      type: 'Ability',
      // 7D1C and 7D1E are damage abilities for the second bounce of the flamerake.
      netRegex: { id: '7D1C', source: 'Rubicante', capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'RubicanteEx Scalding Signal',
      type: 'StartsUsing',
      netRegex: { id: '7D24', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.outAndProtean!(),
      outputStrings: {
        outAndProtean: {
          en: 'Out + Protean',
          ja: '外側 + 基本散会',
          ko: '⊗밖으로! 프로틴',
        },
      },
    },
    {
      id: 'RubicanteEx Scalding Ring',
      type: 'StartsUsing',
      netRegex: { id: '7D25', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.inAndProtean!(),
      outputStrings: {
        inAndProtean: {
          en: 'In + Protean',
          ja: '内側 + 基本散会',
          ko: '⊙안으로! 프로틴',
        },
      },
    },
    {
      id: 'RubicanteEx Sweeping Immolation Spread',
      type: 'StartsUsing',
      netRegex: { id: '7D20', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.spreadBehind!(),
      outputStrings: {
        spreadBehind: {
          en: 'Spread behind Boss',
          ja: 'ボスの後ろで散会',
          ko: '보스 뒤에서 흩어져요!',
        },
      },
    },
    {
      id: 'RubicanteEx Sweeping Immolation Stack',
      type: 'StartsUsing',
      netRegex: { id: '7D21', source: 'Rubicante', capture: false },
      infoText: (_data, _matches, output) => output.stackBehind!(),
      outputStrings: {
        stackBehind: {
          en: 'Stack behind Boss',
          ja: 'ボスの後ろで頭割り',
          ko: '보스 뒤에서 뭉쳐요!',
        },
      },
    },
    {
      id: 'RubicanteEx Dualfire Target',
      // These headmarkers come out just before the 72DE self-targeted cast.
      type: 'HeadMarker',
      netRegex: {},
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== '00E6')
          return;
        data.dualfireTargets.push(matches.target);
        if (data.me === matches.target)
          return output.tankCleaveOnYou!();
      },
      outputStrings: {
        tankCleaveOnYou: Outputs.tankCleaveOnYou,
      },
    },
    {
      id: 'RubicanteEx Dualfire Not You',
      type: 'StartsUsing',
      netRegex: { id: '7D2E', source: 'Rubicante', capture: false },
      infoText: (data, _matches, output) => {
        if (data.dualfireTargets.includes(data.me))
          return;
        if (data.role === 'healer')
          return output.tankBusterCleaves!();
        return output.avoidTankCleaves!();
      },
      run: (data) => data.dualfireTargets = [],
      outputStrings: {
        tankBusterCleaves: Outputs.tankBusterCleaves,
        avoidTankCleaves: Outputs.avoidTankCleaves,
      },
    },
    {
      id: 'RubicanteEx Flamespire Claw Numbers',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        return data.me === matches.target &&
          (/00(?:4F|5[0-6])/).test(getHeadmarkerId(data, matches));
      },
      preRun: (data, matches) => {
        const correctedMatch = getHeadmarkerId(data, matches);
        const clawNumberMap: { [id: string]: number } = {
          '004F': 1,
          '0050': 2,
          '0051': 3,
          '0052': 4,
          '0053': 5,
          '0054': 6,
          '0055': 7,
          '0056': 8,
        };
        data.flamespireClawNumber = clawNumberMap[correctedMatch];

        const clawDelayMap: { [id: string]: number } = {
          '004F': 8.3,
          '0050': 10.3,
          '0051': 12.3,
          '0052': 14.3,
          '0053': 16.3,
          '0054': 18.3,
          '0055': 20.3,
          '0056': 22.3,
        };
        data.flamespireClawDelay = clawDelayMap[correctedMatch];
        data.flamespireClawCounter = 0;
      },
      durationSeconds: (data) => {
        return data.flamespireClawDelay;
      },
      alertText: (data, _matches, output) => {
        // A common strategy is to have 7 and 8 grab the first tether
        // and everybody pick up a tether after being hit.
        if (data.flamespireClawNumber !== undefined && data.flamespireClawNumber <= 6)
          return output.num!({ num: data.flamespireClawNumber });
        return output.numGetTether!({ num: data.flamespireClawNumber });
      },
      outputStrings: {
        num: {
          en: '#${num}',
          ja: '${num}番',
          ko: '내가 ${num}번',
        },
        numGetTether: {
          en: '#${num} (Get Tether)',
          ja: '${num}番 (線取りに行く)',
          ko: '${num}번 (줄 받으러 가요)',
        },
      },
    },
    {
      id: 'RubicanteEx Flamespire Claw Counter',
      type: 'Ability',
      netRegex: { id: '7D29', source: 'Rubicante', targetIndex: '0', capture: false },
      preRun: (data, _matches) => data.flamespireClawCounter++,
      durationSeconds: 1,
      sound: '',
      infoText: (data, _matches, output) => output.text!({ num: data.flamespireClawCounter }),
      tts: null,
      outputStrings: {
        text: {
          en: '${num}',
          ja: '${num}番',
          ko: '${num}번',
        },
      },
    },
    {
      id: 'RubicanteEx Flamespire Claw Hit You',
      type: 'Ability',
      netRegex: { id: '7E73', source: 'Rubicante' },
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return false;
        if (data.flamespireClawCounter >= 7)
          return false;
        return data.flamespireClawCounter === data.flamespireClawNumber;
      },
      infoText: (_data, _matches, output) => output.getTether!(),
      outputStrings: {
        getTether: {
          en: 'Get Tether',
          ja: '線取りに行く',
          ko: '줄 채러 가요',
        },
      },
    },
    {
      id: 'RubicanteEx Flamespire Brand Call',
      type: 'MapEffect',
      netRegex: { location: '04', capture: true },
      suppressSeconds: 15,
      alertText: (data, matches, output) => {
        const intercardFlags = [
          '02000200',
          '00200020',
          '00020002',
          '00800080',
        ];
        const isIntercardSafeFirst = intercardFlags.includes(matches.flags);
        data.flamerakeInitialSafe = isIntercardSafeFirst ? 'intercardinal' : 'cardinal';

        const mech = data.flamespireBrandHasFlare ? output.outFlare!() : output.inStack!();
        const safe = isIntercardSafeFirst ? output.intercards!() : output.cardinals!();
        return output.text!({ safe: safe, mech: mech });
      },
      infoText: (data, _matches, output) => {
        let flareDPSCount = 0;
        let flareSupportCount = 0;
        let stackDPSCount = 0;
        let stackSupportCount = 0;

        for (const line of data.flamespireBrandDebuffCollect) {
          const isDPS = data.party.isDPS(line.target);
          if (line.effectId === effectIds.bloomingWeltFlare) {
            if (isDPS)
              flareDPSCount++;
            else
              flareSupportCount++;
          }
          if (line.effectId === effectIds.furiousWeltStack) {
            if (isDPS)
              stackDPSCount++;
            else
              stackSupportCount++;
          }
        }

        if (flareDPSCount > 0 && flareSupportCount > 0)
          return;
        if (stackDPSCount === 0 && stackSupportCount === 0)
          return;
        if (flareDPSCount === 0 && flareSupportCount === 0)
          return;

        if (flareDPSCount > 0 && stackSupportCount > 0)
          return output.supportStack!();
        if (flareSupportCount > 0 && stackDPSCount > 0)
          return output.dpsStack!();
      },
      outputStrings: {
        text: {
          en: '${safe} => ${mech}',
          ja: '${safe} => ${mech}',
          ko: '${safe} 🔜 ${mech}',
        },
        cardinals: {
          en: 'Cardinal',
          ja: '十字回避',
          ko: '십자',
        },
        intercards: {
          en: 'Intercard',
          ja: '斜めへ',
          ko: '비스듬',
        },
        outFlare: {
          en: 'Out + Flare',
          ja: '外側＋フレア',
          ko: '바깥 + 플레어',
        },
        inStack: {
          en: 'In + Stack',
          ja: '内側＋頭割り',
          ko: '안 + 뭉쳐요',
        },
        supportStack: {
          en: '(supports stack)',
          ja: '(supports stack)',
          ko: '(탱힐 뭉쳐요)',
        },
        dpsStack: {
          en: '(dps stack)',
          ja: '(dps stack)',
          ko: '(DPS 뭉쳐요)',
        },
      },
    },
    {
      id: 'RubicanteEx PR Ordeal of Purgation',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante', capture: false },
      durationSeconds: 8,
      infoText: (data, _matches, output) => {
        data.circle++;
        return {
          0: output.p0!(),
          1: output.p1!(),
          2: output.p2!(),
          3: output.p3!(),
          4: output.p4!(),
          5: output.p5!(),
          6: output.p6!(),
          7: output.p7!(),
          8: output.p8!(),
        }[data.circle];
      },
      outputStrings: {
        p0: {
          en: 'Error...?',
          ja: 'Error...?',
          ko: '아니 오류인가...',
        },
        p1: {
          en: '#1',
          ja: '#1',
          ko: '#1: 보스 뒤 / 회전 방향으로',
        },
        p2: {
          en: '#2',
          ja: '#2',
          ko: '#2: V 뒤쪽',
        },
        p3: {
          en: '#3',
          ja: '#3',
          ko: '#3: V 안쪽 (벽까지 가면 좋음)',
        },
        p4: {
          en: '#4',
          ja: '#4',
          ko: '#4: ^_^ 에서 회전 방향 ^으로',
        },
        p5: {
          en: '#5',
          ja: '#5',
          ko: '#5: 보스 뒤로',
        },
        p6: {
          en: '#6',
          ja: '#6',
          ko: '#6: V 뒤쪽, 좌우 직선 찾아 그 밑단',
        },
        p7: {
          en: '#7',
          ja: '#7',
          ko: '#7: V 안쪽 (벽까지 가면 좋음)',
        },
        p8: {
          en: '#8',
          ja: '#8',
          ko: '#8: ^_^ 에서 회전 방향 ^으로',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'RubicanteEx PR Arch Inferno',
      type: 'StartsUsing',
      netRegex: { id: '7CF9', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Divide North/South Teams!',
          ja: 'Divide North/South Teams!',
          ko: '남북으로 팀 나눠요!',
        },
      },
    },
    {
      id: 'RubicanteEx PR Blazing Rapture',
      type: 'StartsUsing',
      netRegex: { id: '7D06', source: 'Rubicante', capture: false },
      delaySeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Big AoE!',
          ja: 'Big AoE!',
          ko: '아픈 전체 공격!', // 또는 쫄 못잡아서 전멸,
        },
      },
    },
    {
      id: 'RubicanteEx PR Flamespire Brand',
      type: 'StartsUsing',
      netRegex: { id: '7D13', source: 'Rubicante', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Complex🎉 soon. Check your buff',
          ja: 'Complex🎉 soon. Check your buff',
          ko: '곧 운동회~🎉 디버프 확인',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Partial Immolation/Total Immolation': 'Partial/Total Immolation',
        'Scalding Ring/Scalding Signal': 'Scalding Ring/Signal',
        'Spike of Flame/Fourfold Flame/Twinfold Flame': 'Spike/Twin/Four',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Circle of Purgatory': 'Kreis der Läuterung',
        '(?<!Greater )Flamesent': 'Flammengesandt(?:e|er|es|en)',
        'Greater Flamesent': 'Infernogesandt(?:e|er|es|en)',
        'Rubicante': 'Rubicante',
        'Rubicante Mirage': 'Phantom-Rubicante',
      },
      'replaceText': {
        '\\(aoe\\)': '(AoE)',
        '\\(spread\\)': '(verteilen)',
        'Arcane Revelation': 'Arkane Enthüllung',
        'Arch Inferno': 'Erzinferno',
        'Blazing Rapture': 'Lodernde Entrückung',
        'Blooming Welt': 'Loderndes Mal',
        'Conflagration': 'Feuersnot',
        'Dualfire': 'Zwieflamme',
        'Explosive Pyre': 'Brausender Scheiterhaufen',
        'Fiery Expiation': 'Feurige Sühne',
        'Flamerake': 'Brennender Nagel',
        'Flamespire Brand': 'Mal des Flammendorns',
        'Flamespire Claw': 'Nagel des Flammendorns',
        'Fourfold Flame': 'Vierfache Flamme',
        'Furious Welt': 'Zehrendes Mal',
        'Ghastly Flame': 'Finstere Flamme',
        'Ghastly Torch': 'Finstere Fackel',
        'Ghastly Wind': 'Finstere Winde',
        'Hope Abandon Ye': 'Lasset alle Hoffnung fahren',
        'Infernal Slaughter': 'Infernales Schlachten',
        '(?<!(Arch |Erz))Inferno(?! Devil)': 'Höllenfahrt',
        'Inferno Devil': 'Höllenteufel',
        'Ordeal of Purgation': 'Probe der Läuterung',
        'Partial Immolation': 'Teilverbrennung',
        'Radial Flagration': 'Schwelender Reigen',
        'Scalding Fleet': 'Äschernder Schwarm',
        'Scalding Ring': 'Äschernder Kreis',
        'Scalding Signal': 'Äscherndes Fanal',
        'Shattering Heat': 'Klirrende Hitze',
        'Spike of Flame': 'Flammenstachel',
        'Stinging Welt': 'Flammenmal',
        'Sweeping Immolation': 'Breite Verbrennung',
        'Total Immolation': 'Totalverbrennung',
        'Twinfold Flame': 'Zweifache Flamme',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Circle of Purgatory': 'cercle arcanique du Purgatoire',
        '(?<!Greater )Flamesent': 'flamme démoniaque',
        'Greater Flamesent': 'flamme démoniaque inexorable',
        'Rubicante': 'Rubicante',
        'Rubicante Mirage': 'spectre de Rubicante',
      },
      'replaceText': {
        'Arcane Revelation': 'Déploiement arcanique',
        'Arch Inferno': 'Enfer tourbillonnant',
        'Blazing Rapture': 'Flammes folles',
        'Blooming Welt': 'Grosse malédiction explosive',
        'Conflagration': 'Jets enflammés',
        'Dualfire': 'Jets enflammés jumeaux',
        'Explosive Pyre': 'Attaque de feu explosive',
        'Fiery Expiation': 'Flamme expiatoire',
        'Flamerake': 'Griffes écarlates',
        'Flamespire Brand': 'Marque de flamme maudite',
        'Flamespire Claw': 'Griffes enflammées maudites',
        'Fourfold Flame': 'Quadruple explosion de feu',
        'Furious Welt': 'Malédiction explosive massive',
        'Ghastly Flame': 'Feu spectral',
        'Ghastly Torch': 'Flamme spectrale',
        'Ghastly Wind': 'Vent enflammé spectral',
        'Hope Abandon Ye': 'Ouverture du Purgatoire',
        'Infernal Slaughter': 'Déchaînement infernal',
        '(?<!Arch )Inferno(?! Devil)': 'Flambée',
        'Inferno Devil': 'Enfer tournoyant',
        'Ordeal of Purgation': 'Purgatoire vermillon',
        'Partial Immolation': 'Vague écarlate dispersée',
        'Radial Flagration': 'Jets enflammés radiaux',
        'Scalding Fleet': 'Calcination terrestre brutale',
        'Scalding Ring': 'Calcination terrestre circulaire',
        'Scalding Signal': 'Calcination terrestre ascendante',
        'Shattering Heat': 'Attaque de feu',
        'Spike of Flame': 'Explosion de feu',
        'Stinging Welt': 'Malédiction explosive',
        'Sweeping Immolation': 'Vague écarlate',
        'Total Immolation': 'Vague écarlate concentrée',
        'Twinfold Flame': 'Double explosion de feu',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Circle of Purgatory': '煉獄魔陣',
        '(?<!Greater )Flamesent': '炎妖',
        'Greater Flamesent': '業炎妖',
        'Rubicante(?! )': 'ルビカンテ',
        'Rubicante Mirage': 'ルビカンテの幻影',
      },
      'replaceText': {
        'Arcane Revelation': '魔法陣展開',
        'Arch Inferno': '烈風火燕流',
        'Blazing Rapture': '狂える炎',
        'Blooming Welt': '大爆呪',
        'Conflagration': '劫火流',
        'Dualfire': '双炎流',
        'Explosive Pyre': '爆炎撃',
        'Fiery Expiation': '獄炎',
        'Flamerake': '烈火赤滅爪',
        'Flamespire Brand': '炎禍の呪い',
        'Flamespire Claw': '炎禍の武爪',
        'Fourfold Flame': '四重爆炎',
        'Furious Welt': '重爆呪',
        'Ghastly Flame': '妖火',
        'Ghastly Torch': '妖火炎',
        'Ghastly Wind': '妖火風',
        'Hope Abandon Ye': '煉獄招来',
        'Infernal Slaughter': '火燕乱撃',
        '(?<!Arch )Inferno(?! Devil)': '火燕流',
        'Inferno Devil': '火燕旋風',
        'Ordeal of Purgation': '煉獄の朱炎',
        'Partial Immolation': '赤滅熱波：散炎',
        'Radial Flagration': '放散火流',
        'Scalding Fleet': '滅土焼尽：迅火',
        'Scalding Ring': '滅土焼尽：輪火',
        'Scalding Signal': '滅土焼尽：烽火',
        'Shattering Heat': '炎撃',
        'Spike of Flame': '爆炎',
        'Stinging Welt': '爆呪',
        'Sweeping Immolation': '赤滅熱波',
        'Total Immolation': '赤滅熱波：重炎',
        'Twinfold Flame': '二重爆炎',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Circle of Purgatory': '炼狱魔阵',
        '(?<!Greater )Flamesent': '炎妖',
        'Greater Flamesent': '业炎妖',
        'Rubicante(?! )': '卢比坎特',
        'Rubicante Mirage': '卢比坎特的幻影',
      },
      'replaceText': {
        '\\(aoe\\)': '(AOE)',
        '\\(spread\\)': '(分散)',
        'Arcane Revelation': '魔法阵展开',
        'Arch Inferno': '烈风火焰流',
        'Blazing Rapture': '狂炎',
        'Blooming Welt': '大爆咒',
        'Conflagration': '劫火流',
        'Dualfire': '双炎流',
        'Explosive Pyre': '爆炎击',
        'Fiery Expiation': '狱炎',
        'Flamerake': '烈火赤灭爪',
        'Flamespire Brand': '炀火之咒',
        'Flamespire Claw': '炀火武爪',
        'Fourfold Flame': '四重爆炎',
        'Furious Welt': '重爆咒',
        'Ghastly Flame': '妖火',
        'Ghastly Torch': '妖火炎',
        'Ghastly Wind': '妖火风',
        'Hope Abandon Ye': '炼狱招来',
        'Infernal Slaughter': '火焰乱击',
        '(?<!(Arch |Erz))Inferno(?! Devil)': '火焰流',
        'Inferno Devil': '火焰旋风',
        'Ordeal of Purgation': '炼狱朱炎',
        'Partial Immolation': '赤灭热波：散炎',
        'Radial Flagration': '放散火流',
        'Scalding Fleet': '灭土烧尽：迅火',
        'Scalding Ring': '灭土烧尽：环火',
        'Scalding Signal': '灭土烧尽：烽火',
        'Shattering Heat': '炎击',
        'Spike of Flame': '爆炎柱',
        'Stinging Welt': '爆咒',
        'Sweeping Immolation': '赤灭热波',
        'Total Immolation': '赤灭热波：重炎',
        'Twinfold Flame': '双重爆炎',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Circle of Purgatory': '煉獄魔陣',
        '(?<!Greater )Flamesent': '炎妖',
        'Greater Flamesent': '業炎妖',
        'Rubicante(?! )': '盧比坎特',
        'Rubicante Mirage': '盧比坎特的幻影',
      },
      'replaceText': {
        // '\\(aoe\\)': '', // FIXME '(AOE)'
        // '\\(spread\\)': '', // FIXME '(分散)'
        'Arcane Revelation': '魔法陣展開',
        'Arch Inferno': '烈風火焰流',
        'Blazing Rapture': '狂炎',
        'Blooming Welt': '大爆咒',
        'Conflagration': '劫火流',
        'Dualfire': '雙炎流',
        'Explosive Pyre': '大火焰擊',
        'Fiery Expiation': '獄炎',
        'Flamerake': '烈火赤滅爪',
        'Flamespire Brand': '煬火之咒',
        'Flamespire Claw': '煬火武爪',
        'Fourfold Flame': '四重大火焰',
        'Furious Welt': '重爆咒',
        'Ghastly Flame': '妖火',
        'Ghastly Torch': '妖火炎',
        'Ghastly Wind': '妖火風',
        'Hope Abandon Ye': '煉獄招來',
        'Infernal Slaughter': '火焰亂擊',
        // '(?<!(Arch |Erz))Inferno(?! Devil)': '', // FIXME '火焰流'
        'Inferno Devil': '火焰旋風',
        'Ordeal of Purgation': '煉獄朱炎',
        'Partial Immolation': '赤滅熱波：散炎',
        'Radial Flagration': '放散火流',
        'Scalding Fleet': '滅土燒盡：迅火',
        'Scalding Ring': '滅土燒盡：環火',
        'Scalding Signal': '滅土燒盡：烽火',
        'Shattering Heat': '炎擊',
        'Spike of Flame': '大火焰柱',
        'Stinging Welt': '爆咒',
        'Sweeping Immolation': '赤滅熱波',
        'Total Immolation': '赤滅熱波：重炎',
        'Twinfold Flame': '雙重大火焰',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Circle of Purgatory': '연옥 마법진',
        '(?<!Greater )Flamesent': '불꽃 요마',
        'Greater Flamesent': '업화의 요마',
        'Rubicante(?! )': '루비칸테',
        'Rubicante Mirage': '루비칸테의 환영',
      },
      'replaceText': {
        '\\(aoe\\)': '(광역)',
        '\\(spread\\)': '(산개)',
        'Arcane Revelation': '마법진 전개',
        'Arch Inferno': '열풍화연류',
        'Blazing Rapture': '광란의 불꽃',
        'Blooming Welt': '대폭발 저주',
        'Conflagration': '불보라',
        'Dualfire': '쌍염류',
        'Explosive Pyre': '폭염격',
        'Fiery Expiation': '지옥불',
        'Flamerake': '열화적멸조',
        'Flamespire Brand': '화마의 저주',
        'Flamespire Claw': '화마의 발톱',
        'Fourfold Flame': '사중 폭염',
        'Furious Welt': '집중 폭발 저주',
        'Ghastly Flame': '요마의 불',
        'Ghastly Torch': '요마의 화염',
        'Ghastly Wind': '요마의 불바람',
        'Hope Abandon Ye': '연옥 출현',
        'Infernal Slaughter': '화연난격',
        '(?<!(Arch |Erz))Inferno(?! Devil)': '화연류',
        'Inferno Devil': '화연선풍',
        'Ordeal of Purgation': '연옥의 홍염',
        'Partial Immolation': '적멸열파: 분산',
        'Radial Flagration': '갈래불',
        'Scalding Fleet': '멸토 소진: 돌진',
        'Scalding Ring': '멸토 소진: 고리',
        'Scalding Signal': '멸토 소진: 봉화',
        'Shattering Heat': '염격',
        'Spike of Flame': '폭염',
        'Stinging Welt': '폭발 저주',
        'Sweeping Immolation': '적멸열파',
        'Total Immolation': '적멸열파: 집중',
        'Twinfold Flame': '이중 폭염',
      },
    },
  ],
};

export default triggerSet;
