import Autumn, { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import Util, { DirectionOutputCardinal, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'one' | 'arenaSplit' | 'avalanche' | 'ecliptic';

type WeaponInfo = {
  delay: number;
  duration: number;
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    stampedeStyle: 'totan' | 'dxa';
  };
  phase: Phase;
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  weapons: {
    id: string;
    type: 'stack' | 'healerGroups' | 'protean';
    dir: number;
    actor: { x: number; y: number; heading: number };
  }[];
  voidStardust?: 'spread' | 'stack';
  assaultEvolvedCount: number;
  weaponMechCount: number;
  domDirectionCount: {
    vertCount: number;
    horizCount: number;
    outerSafe: DirectionOutputCardinal[];
  };
  maelstromCount: number;
  hasMeteor: boolean;
  myPlatform?: 'east' | 'west';
  arenaSplitMeteorain?: 'westIn' | 'westOut';
  arenaSplitStretchDirNum?: number;
  arenaSplitTethers: string[];
  arenaSplitCalledTether: boolean;
  arenaSplitCalledBait: boolean;
  fireballCount: number;
  hasAtomic: boolean;
  hadEclipticTether: boolean;
  heartbreakerCount: number;
  //
  meteorCount: number;
  majesticTethers: string[];
  avalancheSafe?: 'east' | 'west';
  atomicList: string[];
  atomicPartner?: string;
  atomicNorth?: boolean;
  fireballPosition?: string;
}

const center = {
  x: 100,
  y: 100,
};

const phaseMap: { [id: string]: Phase } = {
  'B43F': 'arenaSplit', // Flatliner
  'B448': 'avalanche', // Massive Meteor stacks near end of arena split
  'B452': 'ecliptic', // Ecliptic Stampede
};

const headMarkerData = {
  // Vfx Path: target_ae_s5f
  'cometSpread': '008B',
  // Vfx Path: com_share4a1
  'partnerStack': '00A1',
  // Vfx Path: com_share3t
  'fiveHitStack': '0131',
  // Vfx Path: lockon8_t0w
  'meteor': '00F4',
  'fireBreath': '00F4',
  // Vfx Path: share_laser_5sec_0t, targets The Tyrant
  'lineStack': '020D',
  // Vfx Path: m0017trg_a0c
  'atomicImpact': '001E',
  'meteorTether': '0164',
  'closeTether': '0039',
  'farTether': '00F9',
} as const;

const ultimateTrophyWeaponsMap: (WeaponInfo | undefined)[] = [
  undefined,
  undefined,
  {
    delay: 0,
    duration: 8.7,
  },
  {
    delay: 4.7,
    duration: 5.1,
  },
  {
    delay: 5.8,
    duration: 5.1,
  },
  {
    delay: 6.9,
    duration: 5.1,
  },
  {
    delay: 8,
    duration: 5.1,
  },
  {
    delay: 9.1,
    duration: 5.1,
  },
];

const trophyStrings = {
  healerGroups: {
    en: 'Healer Groups',
    ja: 'ヒラに頭割り',
    ko: '칼:44',
  },
  stack: {
    en: 'Stack in Middle',
    ja: '中央で頭割り',
    ko: '도끼:뭉쳐',
  },
  protean: {
    en: 'Protean',
    ja: '基本さんかい',
    ko: '낫:안으로',
  },
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM3Savage',
  zoneId: ZoneId.AacHeavyweightM3Savage,
  config: [
    {
      id: 'stampedeStyle',
      name: {
        en: 'Ecliptic Stampede Display Style',
        ja: 'メテオスタンピード 表示方法',
        ko: '메테오 스탬피드 표시 방법',
      },
      type: 'select',
      options: {
        en: {
          'Totan V2': 'totan',
          'DXA': 'dxa',
        },
        ja: {
          'とたんV2': 'totan',
          'DXA': 'dxa',
        },
        ko: {
          '토탄V2': 'totan',
          'DXA': 'dxa',
        },
      },
      default: 'totan',
    },
  ],
  timelineFile: 'r11s.txt',
  initData: () => ({
    phase: 'one',
    actorPositions: {},
    weapons: [],
    weaponMechCount: 0,
    domDirectionCount: {
      horizCount: 0,
      vertCount: 0,
      outerSafe: ['dirN', 'dirE', 'dirS', 'dirW'],
    },
    assaultEvolvedCount: 0,
    maelstromCount: 0,
    hasMeteor: false,
    arenaSplitTethers: [],
    arenaSplitCalledTether: false,
    arenaSplitCalledBait: false,
    fireballCount: 0,
    hasAtomic: false,
    hadEclipticTether: false,
    heartbreakerCount: 0,
    //
    meteorCount: 0,
    explosionTowerCount: 0,
    majesticTethers: [],
    atomicList: [],
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'R11S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phaseMap), source: 'The Tyrant' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const phase = phaseMap[matches.id];
        if (phase === undefined)
          throw new UnreachableCode();

        data.phase = phase;
      },
    },
    {
      id: 'R11S ActorSetPos Tracker',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R11S Crown of Arcadia',
      type: 'StartsUsing',
      netRegex: { id: 'B406', source: 'The Tyrant', capture: false },
      durationSeconds: 5,
      response: Responses.bigAoe(),
    },
    {
      id: 'R11S Raw Steel Trophy Axe',
      type: 'StartsUsing',
      netRegex: { id: 'B422', capture: false },
      delaySeconds: 2.5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tank: Outputs.sharedTankbuster,
          party: Outputs.spread,
        };
        if (data.role === 'tank')
          return { alertText: output.tank!() };
        return { infoText: output.party!() };
      },
    },
    {
      id: 'R11S Raw Steel Trophy Scythe',
      type: 'StartsUsing',
      netRegex: { id: 'B423', capture: false },
      delaySeconds: 2.5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tank: Outputs.tankBusterCleaves,
          party: Outputs.getTogether,
        };
        if (data.role === 'tank')
          return { alertText: output.tank!() };
        return { infoText: output.party!() };
      },
    },
    // For logic reasons Ultimate has to be before normal Trophy Weapons
    {
      id: 'R11S Ultimate Trophy Weapons',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: ['11D1', '11D2', '11D3'], capture: true },
      condition: (data) => data.weaponMechCount > 1,
      delaySeconds: (data) => {
        return ultimateTrophyWeaponsMap[data.weaponMechCount]?.delay ?? 0;
      },
      durationSeconds: (data) => {
        return ultimateTrophyWeaponsMap[data.weaponMechCount]?.duration ?? 0;
      },
      countdownSeconds: (data) => {
        return ultimateTrophyWeaponsMap[data.weaponMechCount]?.duration ?? 0;
      },
      infoText: (_data, matches, output) => {
        const mechanic = matches.param1 === '11D1'
          ? 'healerGroups'
          : (matches.param1 === '11D2' ? 'stack' : 'protean');
        return output[mechanic]!();
      },
      run: (data) => data.weaponMechCount++,
      outputStrings: trophyStrings,
    },
    {
      id: 'R11S Trophy Weapons 2 Early Calls',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: ['11D1', '11D2', '11D3'], capture: true },
      condition: (data, matches) => {
        if (data.weaponMechCount !== 1)
          return false;

        const actor = data.actorPositions[matches.id];

        if (actor === undefined)
          return false;

        const actorDir = Math.atan2(actor.x - center.x, actor.y - center.y);

        if ((Math.abs(actorDir - actor.heading) % Math.PI) < 0.1)
          return true;
        return false;
      },
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.id];
        if (actor === undefined)
          return;

        const mechanic = matches.param1 === '11D1'
          ? 'healerGroups'
          : (matches.param1 === '11D2' ? 'stack' : 'protean');
        const dir = Directions.xyTo8DirOutput(actor.x, actor.y, center.x, center.y);

        return output.text!({ dir: output[dir]!(), weapon: output[mechanic]!() });
      },
      outputStrings: {
        ...trophyStrings,
        ...AutumnDir.stringMarker1A2Dir,
        text: {
          en: '${dir}: ${weapon} (1st later)',
          ja: '(${dir} ${weapon})',
          ko: '(${dir} ${weapon})',
        },
      },
    },
    {
      id: 'R11S Trophy Weapons',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: ['11D1', '11D2', '11D3'], capture: true },
      condition: (data) => data.weaponMechCount < 2,
      delaySeconds: (data) => {
        if (data.weaponMechCount === 0)
          return 0.1;
        if (data.weaponMechCount === 1)
          return 10.6;
        return 0.1;
      },
      durationSeconds: (data) => {
        if (data.weaponMechCount < 2)
          return 20.9;
        return 0;
      },
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.id];

        if (actor === undefined)
          return;

        data.weapons.push({
          id: matches.id,
          type: matches.param1 === '11D1'
            ? 'healerGroups'
            : (matches.param1 === '11D2' ? 'stack' : 'protean'),
          dir: Math.atan2(actor.x - center.x, actor.y - center.y),
          actor: actor,
        });
        // Have info for 1st or 2nd mech
        if (data.weaponMechCount < 2 && data.weapons.length > 2) {
          data.weaponMechCount++;
          let candidates = data.weapons;
          data.weapons = [];

          // First weapon is the one facing towards middle
          const weapon1 = candidates.find((c) =>
            (Math.abs(c.dir - c.actor.heading) % Math.PI) < 0.1
          );
          if (weapon1 === undefined)
            return;
          candidates = candidates.filter((c) => c !== weapon1);
          // remap dir to weapon1
          candidates.forEach((c) => {
            c.dir = Math.atan2(c.actor.x - weapon1.actor.x, c.actor.y - weapon1.actor.y);
          });
          // second weapon is facing first weapon
          const weapon2 = candidates.find((c) =>
            (Math.abs(c.dir - c.actor.heading) % Math.PI) < 0.1
          );
          // third weapon is the last remaining one
          const weapon3 = candidates.find((c) => c !== weapon2);
          if (weapon2 === undefined || weapon3 === undefined)
            return;
          return output.text!({
            weapon1: output[weapon1.type]!(),
            weapon2: output[weapon2.type]!(),
            weapon3: output[weapon3.type]!(),
          });
        }
      },
      outputStrings: {
        text: {
          en: '${weapon1} => ${weapon2} => ${weapon3}',
          ja: '${weapon1} 🔜 ${weapon2} 🔜 ${weapon3}',
          ko: '${weapon1} 🔜 ${weapon2} 🔜 ${weapon3}',
        },
        ...trophyStrings,
      },
    },
    {
      id: 'R11S Void Stardust',
      type: 'StartsUsing',
      netRegex: { id: 'B412', source: 'The Tyrant', capture: false },
      infoText: (_data, _matches, output) => output.baitPuddles!(),
      outputStrings: {
        baitPuddles: {
          en: 'Bait 3x puddles',
          ja: 'AOE誘導 x3',
          ko: '장판 유도 x3',
        },
      },
    },
    {
      id: 'R11S Comet Spread Collect',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['cometSpread'], capture: false },
      suppressSeconds: 1,
      run: (data) => {
        // Only setting this once
        if (data.voidStardust === undefined)
          data.voidStardust = 'spread';
      },
    },
    {
      id: 'R11S Comet Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['cometSpread'], capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'R11S Crushing Comet Collect',
      type: 'StartsUsing',
      netRegex: { id: 'B415', source: 'The Tyrant', capture: false },
      run: (data) => {
        // Only setting this once
        if (data.voidStardust === undefined)
          data.voidStardust = 'stack';
      },
    },
    {
      id: 'R11S Crushing Comet',
      type: 'StartsUsing',
      netRegex: { id: 'B415', source: 'The Tyrant', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R11S Void Stardust End',
      // The second set of comets does not have a startsUsing cast
      // Timing is on the last Assault Evolved
      type: 'StartsUsing',
      netRegex: { id: ['B418', 'B419', 'B41A'], source: 'The Tyrant', capture: true },
      condition: (data) => {
        if (data.voidStardust === undefined)
          return false;
        data.assaultEvolvedCount++;
        if (data.assaultEvolvedCount === 3)
          return true;
        return false;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.voidStardust === 'spread')
          return output.baitPuddlesThenStack!();
        if (data.voidStardust === 'stack')
          return output.baitPuddlesThenSpread!();
      },
      outputStrings: {
        baitPuddlesThenStack: {
          en: 'Bait 3x Puddles => Stack',
          ja: 'AOE誘導 x3 🔜 頭割り',
          ko: '장판 유도 x3 🔜 뭉쳐요',
        },
        baitPuddlesThenSpread: {
          en: 'Bait 3x Puddles => Spread',
          ja: 'AOE誘導 x3 🔜 散開',
          ko: '장판 유도 x3 🔜 흩어져요',
        },
      },
    },
    {
      id: 'R11S Dance Of Domination Trophy',
      type: 'StartsUsing',
      netRegex: { id: 'B7BB', source: 'The Tyrant', capture: false },
      delaySeconds: 1,
      durationSeconds: 7.7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'AoE x6 => Big AoE',
          ja: '全体攻撃 x6 🔜 大きな全体攻撃',
          ko: '전체 공격 x6 🔜 아주 아픈 전체 공격',
        },
      },
    },
    {
      // Adapted from normal mode
      id: 'R11S Dance Of Domination Trophy Safe Spots',
      // B7BC Explosion
      type: 'StartsUsingExtra',
      netRegex: { id: 'B7BC', capture: true },
      preRun: (data, matches) => {
        // Determine whether the AoE is orthogonal or diagonal
        // Discard diagonal headings, then count orthogonals.
        const headingDirNum = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        if (headingDirNum % 2 !== 0)
          return;
        const isVert = headingDirNum % 4 === 0;
        let dangerDir: DirectionOutputCardinal | undefined = undefined;
        if (isVert) {
          data.domDirectionCount.vertCount += 1;
          if (parseFloat(matches.x) < center.x - 5)
            dangerDir = 'dirW';
          else if (parseFloat(matches.x) > center.x + 5)
            dangerDir = 'dirE';
        } else {
          data.domDirectionCount.horizCount += 1;
          if (parseFloat(matches.y) < center.y - 5)
            dangerDir = 'dirN';
          else if (parseFloat(matches.y) > center.y + 5)
            dangerDir = 'dirS';
        }
        if (dangerDir !== undefined)
          data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) =>
            dir !== dangerDir
          );
      },
      infoText: (data, _matches, output) => {
        if (data.domDirectionCount.outerSafe.length !== 1)
          return;

        const outerSafeDir = data.domDirectionCount.outerSafe[0];

        if (outerSafeDir === undefined)
          return;

        if (data.domDirectionCount.vertCount === 1)
          return output.northSouth!({ dir: output[outerSafeDir]!() });
        else if (data.domDirectionCount.horizCount === 1)
          return output.eastWest!({ dir: output[outerSafeDir]!() });
      },
      // clear the safe dirs array to prevent further outputs
      run: (data) => {
        if (data.domDirectionCount.outerSafe.length === 1)
          data.domDirectionCount.outerSafe = [];
      },
      outputStrings: {
        northSouth: {
          en: 'N/S Mid / ${dir} Outer + Partner Stacks',
          ja: '${dir}基準',
          ko: '${dir} 기준',
        },
        eastWest: {
          en: 'E/W Mid / ${dir} Outer + Partner Stacks',
          ja: '${dir}基準',
          ko: '${dir} 기준',
        },
        ...AutumnDir.stringMarker1A2Dir,
      },
    },
    {
      id: 'R11S Charybdistopia',
      type: 'StartsUsing',
      netRegex: { id: 'B425', source: 'The Tyrant', capture: false },
      response: Responses.hpTo1Aoe(),
    },
    {
      id: 'R11S Maelstrom Count',
      type: 'AddedCombatant',
      netRegex: { name: 'Maelstrom', capture: false },
      run: (data) => data.maelstromCount = data.maelstromCount + 1,
    },
    {
      id: 'R11S Powerful Gust Reminder',
      type: 'AddedCombatant',
      netRegex: { name: 'Maelstrom', capture: false },
      condition: (data) => data.maelstromCount === 4,
      infoText: (data, _matches, output) => {
        const moksMap: { [key: string]: DirectionOutputCardinal } = {
          'MT': 'dirN',
          'ST': 'dirS',
          'H1': 'dirW',
          'H2': 'dirE',
          'D1': 'dirW',
          'D2': 'dirS',
          'D3': 'dirN',
          'D4': 'dirE',
        };
        const dir = moksMap[data.moks];
        if (dir === undefined)
          return output.bait!();
        return output.baitAt!({ dir: output[dir]!() });
      },
      outputStrings: {
        bait: {
          en: 'Bait Gust',
          ja: '風誘導',
          ko: '돌풍 유도해요!',
        },
        baitAt: {
          en: 'Bait Gust at ${dir}',
          ja: '風誘導: ${dir}',
          ko: '돌풍 유도: ${dir}',
        },
        ...AutumnDir.stringMarker1A2Dir,
      },
    },
    {
      id: 'R11S One and Only',
      type: 'StartsUsing',
      netRegex: { id: 'B429', source: 'The Tyrant', capture: false },
      durationSeconds: 6,
      response: Responses.bigAoe(),
    },
    {
      id: 'R11S Great Wall of Fire',
      // Target is boss, Line AOE that will later explode
      type: 'StartsUsing',
      netRegex: { id: 'B42B', source: 'The Tyrant', capture: false },
      response: Responses.sharedOrInvinTankBuster(),
    },
    {
      id: 'R11S Fire and Fury',
      type: 'StartsUsing',
      netRegex: { id: 'B42F', source: 'The Tyrant', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'R11S Meteor',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['meteor'], capture: true },
      condition: (data, matches) => {
        if (data.me === matches.target && data.phase === 'one')
          return true;
        return false;
      },
      // response: Responses.meteorOnYou(),
      run: (data) => data.hasMeteor = true,
    },
    {
      id: 'R11S Fearsome Fireball',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['lineStack'], capture: false },
      condition: (data) => {
        data.fireballCount = data.fireballCount + 1;
        return !data.hasMeteor;
      },
      delaySeconds: 0.1, // Delay for meteor headmarkers
      infoText: (data, _matches, output) => {
        if (data.fireballCount === 1) {
          if (data.role === 'tank')
            return output.wildChargeTank!();
          return output.wildCharge!();
        }
        if (data.role === 'tank')
          return output.tetherBusters!();
        return output.wildChargeMeteor!();
      },
      run: (data) => data.hasMeteor = false,
      outputStrings: {
        wildCharge: {
          en: 'Wild Charge (behind tank)',
          ja: '一列に並んで（タンクの後ろへ）',
          ko: '한줄 뭉쳐요 (탱크 뒤로)',
        },
        wildChargeMeteor: {
          en: 'Wild Charge (behind meteor)',
          ja: '一列に並んで（隕石の後ろへ）',
          ko: '한줄 뭉쳐요 (돌 뒤로)',
        },
        wildChargeTank: {
          en: 'Wild Charge (be in front)',
          ja: '一列に並んで（前へ）',
          ko: '한줄 뭉쳐요 (맨 앞 몸빵)',
        },
        tetherBusters: Outputs.tetherBusters,
      },
    },
    {
      id: 'R11S Meteor Cleanup',
      // Player hit by Cosmic Kiss
      type: 'Ability',
      netRegex: { id: 'B435', source: 'Comet', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.hasMeteor = false,
    },
    {
      id: 'R11S Triple Tyrannhilation',
      type: 'StartsUsing',
      netRegex: { id: 'B43C', source: 'The Tyrant', capture: false },
      alertText: (_data, _matches, output) => output.losMeteor!(),
      outputStrings: {
        losMeteor: {
          en: 'LoS behind 3x meteor',
          ja: '一番後ろのメテオに隠れる',
          ko: '메테오 맨 뒤로 피해욧!',
        },
      },
    },
    {
      id: 'R11S Flatliner',
      type: 'StartsUsing',
      netRegex: { id: 'B43F', source: 'The Tyrant', capture: false },
      infoText: (_data, _matches, output) => output.flatliner!(),
      outputStrings: {
        flatliner: {
          en: 'Short knockback to sides',
          ja: '全体攻撃 + 短いノックバック',
          ko: '전체 공격 + 짧은 넉백',
        },
      },
    },
    {
      id: 'R11S Arena Split Majestic Meteorain Collect',
      // Two MapEffects happen simultaneously with tethers
      // Coincides with light tethers connecting the Meteorain portals
      // NOTE: Unsure location is which, but they are paired so only collect one
      // Location Pattern 1:
      // 17 => West Out?
      // 19 => East In?
      // Location Pattern 2:
      // 16 => East Out?
      // 18 => West In?
      type: 'MapEffect',
      netRegex: { flags: '00200010', location: ['16', '17'], capture: true },
      condition: (data) => data.phase === 'arenaSplit',
      run: (data, matches) => {
        // The second set of these can also be known from the first set as it will be oppposite
        data.arenaSplitMeteorain = matches.location === '16'
          ? 'westIn'
          : 'westOut';
      },
    },
    {
      id: 'R11S Arena Split Majestic Meteowrath Tether Collect',
      // Tethers have 2 patterns
      // Pattern 1
      // (69, 85)
      //                  (131, 95)
      //                  (131, 105)
      // (69, 115)
      // Pattern 2:
      //                  (131, 85)
      // (69, 95)
      // (69, 105)
      //                  (131, 115)
      type: 'Tether',
      netRegex: { id: [headMarkerData.closeTether, headMarkerData.farTether], capture: true },
      condition: (data) => {
        // Assuming log line of same player doesn't happen before 4 players collected
        if (data.phase === 'arenaSplit' && data.arenaSplitTethers.length < 4)
          return true;
        return false;
      },
      preRun: (data, matches) => data.arenaSplitTethers.push(matches.target),
      delaySeconds: 0.1, // Race condition with Tether lines and actor positions
      run: (data, matches) => {
        const actor = data.actorPositions[matches.sourceId];
        const hasTether = (data.me === matches.target);
        if (actor === undefined) {
          if (hasTether)
            data.arenaSplitStretchDirNum = -1; // Return -1 so that we know we at least don't bait fire breath
          return;
        }

        if (hasTether) {
          const portalDirNum = Directions.xyTo4DirIntercardNum(
            actor.x,
            actor.y,
            center.x,
            center.y,
          );
          // While two could be inter inter cards, furthest stretches will be an intercard
          const stretchDirNum = (portalDirNum + 2) % 4;
          data.arenaSplitStretchDirNum = stretchDirNum;
        }
      },
    },
    {
      id: 'R11S Arena Split Fire Breath Bait Later',
      type: 'Tether',
      netRegex: { id: [headMarkerData.closeTether, headMarkerData.farTether], capture: false },
      condition: (data) => {
        if (
          data.phase === 'arenaSplit' &&
          data.arenaSplitTethers.length === 4 &&
          !data.arenaSplitCalledBait
        ) {
          if (!data.arenaSplitTethers.includes(data.me))
            return data.arenaSplitCalledBait = true;
        }
        return false;
      },
      delaySeconds: 0.1,
      infoText: (_data, _matches, output) => output.fireBreathLater!(),
      outputStrings: {
        fireBreathLater: {
          en: 'Bait Fire Breath (later)',
          ja: '(後でファイアブレス誘導)',
          ko: '(나중에 🔥브레스 유도)',
        },
      },
    },
    {
      id: 'R11S Arena Split Majestic Meteowrath Tether Stretch Later',
      type: 'Tether',
      netRegex: { id: [headMarkerData.closeTether, headMarkerData.farTether], capture: true },
      condition: (data, matches) => {
        if (
          data.phase === 'arenaSplit' &&
          data.me === matches.target
        ) {
          // Prevent spamming tethers
          if (!data.arenaSplitCalledTether)
            return data.arenaSplitCalledTether = true;
        }
        return false;
      },
      delaySeconds: 0.1, // Race condition with Tether lines and actor positions
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.stretchTetherLater!();

        const portalDirNum = Directions.xyTo4DirIntercardNum(
          actor.x,
          actor.y,
          center.y,
          center.x,
        );
        // While these are inter inter cards, furthest stretch will be an intercard
        const stretchDirNum = (portalDirNum + 2) % 4;
        const dir = Directions.outputIntercardDir[stretchDirNum];
        return output.stretchTetherDirLater!({ dir: output[dir ?? 'unknown']!() });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        stretchTetherDirLater: {
          en: 'Tether on YOU: Stretch ${dir} (later)',
          ja: '(後で線を伸ばす: ${dir})',
          ko: '(나중에 🪢줄: ${dir})',
        },
        stretchTetherLater: {
          en: 'Tether on YOU: Stretch (later)',
          ja: '(後で線を伸ばす)',
          ko: '(나중에 🪢줄)',
        },
      },
    },
    {
      id: 'R11S Explosion Towers', // Knockback towers
      type: 'StartsUsing',
      netRegex: { id: 'B444', source: 'The Tyrant', capture: false },
      condition: (data) => data.phase === 'arenaSplit',
      durationSeconds: 9.5,
      suppressSeconds: 1,
      countdownSeconds: 9.5,
      promise: async (data) => {
        // Get player location for output
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          names: [data.me],
        })).combatants;
        const me = combatants[0];
        if (combatants.length !== 1 || me === undefined) {
          console.error(
            `R11S Explosion Towers: Wrong combatants count ${combatants.length}`,
          );
          return;
        }

        data.myPlatform = me.PosX < 100 ? 'west' : 'east';
      },
      alertText: (data, _matches, output) => {
        const myPlatform = data.myPlatform;
        const dirNum = data.arenaSplitStretchDirNum;
        if (dirNum === 0 || dirNum === 1) {
          if (myPlatform === 'east') {
            return output.tetherTowers!({
              mech1: output.northSouthSafe!(),
              mech2: output.avoidFireBreath!(),
            });
          }
          return output.tetherTowers!({
            mech1: output.eastSafe!(),
            mech2: output.avoidFireBreath!(),
          });
        }
        if (dirNum === 2 || dirNum === 3) {
          if (myPlatform === 'west') {
            return output.tetherTowers!({
              mech1: output.northSouthSafe!(),
              mech2: output.avoidFireBreath!(),
            });
          }
          return output.tetherTowers!({
            mech1: output.westSafe!(),
            mech2: output.avoidFireBreath!(),
          });
        }
        if (!data.arenaSplitTethers.includes(data.me))
          return output.fireBreathTowers!({
            mech1: output.northSouthSafe!(),
            mech2: output.baitFireBreath!(),
          });
        return output.knockbackTowers!();
      },
      outputStrings: {
        knockbackTowers: {
          en: 'Get Knockback Towers',
          ja: 'ノックバック塔を踏む',
          ko: '넉백 타워 밟아요!',
        },
        fireBreathTowers: {
          en: '${mech1} => ${mech2}',
          ja: '${mech1} 🔜 ${mech2}',
          ko: '${mech1} 🔜 ${mech2}',
        },
        tetherTowers: {
          en: '${mech1} => ${mech2}',
          ja: '${mech1} 🔜 ${mech2}',
          ko: '${mech1} 🔜 ${mech2}',
        },
        baitFireBreath: {
          en: 'Bait Near',
          ja: '🔥ブレス誘導',
          ko: '🔥브레스 유도',
        },
        avoidFireBreath: Outputs.outOfHitbox,
        northSouthSafe: {
          en: 'Tower Knockback to Same Platform',
          ja: '同じ島へ',
          ko: '같은 바닥으로',
        },
        eastSafe: {
          en: 'Tower Knockback Across to East',
          ja: '東側へ',
          ko: '🄱동쪽으로',
        },
        westSafe: {
          en: 'Tower Knockback Across to West',
          ja: '西側へ',
          ko: '🄳서쪽으로',
        },
      },
    },
    {
      id: 'R11S Fire Breath',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['fireBreath'], capture: true },
      condition: (data, matches) => {
        if (data.me === matches.target && data.phase === 'arenaSplit')
          return true;
        return false;
      },
      durationSeconds: 6,
      promise: async (data) => {
        // Get player location for output
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          names: [data.me],
        })).combatants;
        const me = combatants[0];
        if (combatants.length !== 1 || me === undefined) {
          console.error(
            `R11S Fire Breath and Bait Puddles: Wrong combatants count ${combatants.length}`,
          );
          return;
        }

        data.myPlatform = me.PosX < 100 ? 'west' : 'east';
      },
      alertText: (data, _matches, output) => {
        const meteorain = data.arenaSplitMeteorain;
        const isWestIn = meteorain === 'westIn';
        const myPlatform = data.myPlatform;
        if (meteorain !== undefined && myPlatform !== undefined) {
          if (myPlatform === 'west') {
            const dir = isWestIn ? 'front' : 'back';
            return output.fireBreathMechsPlayerWest!({
              mech1: output.fireBreathOnYou!(),
              mech2: output.bait3Puddles!(),
              dir: output[dir]!(),
            });
          }
          const dir = isWestIn ? 'back' : 'front';
          return output.fireBreathMechsPlayerEast!({
            mech1: output.fireBreathOnYou!(),
            mech2: output.bait3Puddles!(),
            dir: output[dir]!(),
          });
        }
        return output.fireBreathMechs!({
          mech1: output.fireBreathOnYou!(),
          mech2: output.bait3Puddles!(),
          mech3: output.lines!(),
        });
      },
      outputStrings: {
        bait3Puddles: {
          en: 'Bait Puddles x3',
          ja: 'AOE誘導 x3',
          ko: '장판 유도 x3',
        },
        back: {
          en: 'Inner Back',
          ja: '内側後ろへ',
          ko: '안쪽 뒤로',
        },
        front: {
          en: 'Inner Front',
          ja: '内側前へ',
          ko: '안쪽 앞으로',
        },
        lines: {
          en: 'Avoid Lines',
          ja: '直線攻撃を避ける',
          ko: '장판 피해요',
        },
        fireBreathOnYou: {
          en: 'Fire Breath on YOU',
          ja: '自分にファイアブレス',
          ko: '내게 🔥브레스',
        },
        fireBreathMechsPlayerWest: {
          en: '${mech1} + ${mech2} => ${dir}',
          ja: '${mech1} + ${mech2} 🔜 ${dir}',
          ko: '${mech1} + ${mech2} 🔜 ${dir}',
        },
        fireBreathMechsPlayerEast: {
          en: '${mech1} + ${mech2} => ${dir}',
          ja: '${mech1} + ${mech2} 🔜 ${dir}',
          ko: '${mech1} + ${mech2} 🔜 ${dir}',
        },
        fireBreathMechs: {
          en: '${mech1} + ${mech2} => ${mech3}',
          ja: '${mech1} + ${mech2} 🔜 ${mech3}',
          ko: '${mech1} + ${mech2} 🔜 ${mech3}',
        },
      },
    },
    {
      id: 'R11S Arena Split Majestic Meteowrath Tether Bait Puddles',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['fireBreath'], capture: false },
      condition: (data) => {
        if (data.phase === 'arenaSplit' && data.arenaSplitTethers.includes(data.me))
          return true;
        return false;
      },
      durationSeconds: 6,
      suppressSeconds: 1,
      promise: async (data) => {
        // Get player location for output
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          names: [data.me],
        })).combatants;
        const me = combatants[0];
        if (combatants.length !== 1 || me === undefined) {
          console.error(
            `R11S Arena Split Majestic Meteowrath Tether Bait Puddles: Wrong combatants count ${combatants.length}`,
          );
          return;
        }

        data.myPlatform = me.PosX < 100 ? 'west' : 'east';
      },
      alertText: (data, _matches, output) => {
        const meteorain = data.arenaSplitMeteorain;
        const isWestIn = meteorain === 'westIn';
        const dirNum = data.arenaSplitStretchDirNum;
        const myPlatform = data.myPlatform;
        if (dirNum !== undefined && myPlatform !== undefined) {
          const dir1 = Directions.outputIntercardDir[dirNum] ?? 'unknown';
          if (myPlatform === 'west') {
            const dir2 = isWestIn ? 'front' : 'back';
            return output.tetherMechsPlayerWest!({
              mech1: output.bait3Puddles!(),
              mech2: output.stretchTetherDir!({ dir: output[dir1]!() }),
              dir: output[dir2]!(),
            });
          }
          const dir2 = isWestIn ? 'back' : 'front';
          return output.tetherMechsPlayerEast!({
            mech1: output.bait3Puddles!(),
            mech2: output.stretchTetherDir!({ dir: output[dir1]!() }),
            dir: output[dir2]!(),
          });
        }
        return output.baitThenStretchMechs!({
          mech1: output.bait3Puddles!(),
          mech2: output.stretchTether!(),
          mech3: output.lines!(),
        });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        bait3Puddles: {
          en: 'Bait Puddles x3',
          ja: 'AOE誘導 x3',
          ko: '장판 유도 x3',
        },
        back: {
          en: 'Outer Back',
          ja: '外側後ろへ',
          ko: '바깥쪽 뒤',
        },
        front: {
          en: 'Outer Front',
          ja: '外側前へ',
          ko: '바깥쪽 앞',
        },
        lines: {
          en: 'Avoid Lines',
          ja: 'AoE回避',
          ko: '장판 피해요',
        },
        baitThenStretchMechs: {
          en: '${mech1} => ${mech2}  + ${mech3}',
          ja: '${mech1} 🔜 ${mech2} + ${mech3}',
          ko: '${mech1} 🔜 ${mech2} + ${mech3}',
        },
        stretchTether: {
          en: 'Stretch Tether',
          ja: '線を伸ばす',
          ko: '🪢줄 땡겨요',
        },
        stretchTetherDir: {
          en: 'Stretch ${dir}',
          ja: '線を${dir}へ伸ばす',
          ko: '${dir} 🪢줄',
        },
        tetherMechsPlayerEast: {
          en: '${mech1} => ${mech2} + ${dir}',
          ja: '${mech1} 🔜 ${mech2} + ${dir}',
          ko: '${mech1} 🔜 ${mech2} + ${dir}',
        },
        tetherMechsPlayerWest: {
          en: '${mech1} => ${mech2} + ${dir}',
          ja: '${mech1} 🔜 ${mech2} + ${dir}',
          ko: '${mech1} 🔜 ${mech2} + ${dir}',
        },
      },
    },
    {
      id: 'R11S Majestic Meteowrath Tether and Fire Breath Reset',
      // Reset tracker on B442 Majestic Meteowrath for next set of tethers
      type: 'Ability',
      netRegex: { id: 'B442', source: 'The Tyrant', capture: false },
      condition: (data) => data.phase === 'arenaSplit',
      suppressSeconds: 9999,
      run: (data) => {
        delete data.arenaSplitMeteorain;
        delete data.arenaSplitStretchDirNum;
        data.arenaSplitTethers = [];
        data.arenaSplitCalledTether = false;
        data.arenaSplitCalledBait = false;
      },
    },
    {
      id: 'R11S Massive Meteor',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['fiveHitStack'], capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.stackFivex!(),
      outputStrings: {
        stackFivex: {
          en: 'Stack 5x',
          ja: '頭割り x5',
          ko: '뭉쳐요 x5',
        },
      },
    },
    {
      id: 'R11S Arcadion Avalanche West Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44E', 'B450'], source: 'The Tyrant', capture: false },
      infoText: (data, _matches, output) => {
        data.avalancheSafe = 'west';
        const west = output.west!();
        return output.westSafe!({ dir: west });
      },
      outputStrings: {
        westSafe: {
          en: 'Tower Knockback to ${dir}',
          ja: '${dir}へ',
          ko: '넉백: ${dir}',
        },
        west: Outputs.m1A2W,
      },
    },
    {
      id: 'R11S Arcadion Avalanche East Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44A', 'B44C'], source: 'The Tyrant', capture: false },
      infoText: (data, _matches, output) => {
        data.avalancheSafe = 'east';
        const east = output.east!();
        return output.eastSafe!({ dir: east });
      },
      outputStrings: {
        eastSafe: {
          en: 'Tower Knockback to ${dir}',
          ja: '${dir}へ',
          ko: '넉백: ${dir}',
        },
        east: Outputs.m1A2E,
      },
    },
    {
      id: 'R11S Arcadion Avalanche Follow Up North Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44B', 'B451'], source: 'The Tyrant', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      infoText: (data, _matches, output) => {
        const dir = data.avalancheSafe === undefined
          ? output.north!()
          : data.avalancheSafe === 'east'
          ? output.northEast!()
          : output.northWest!();
        return output.goNorth!({ dir: dir });
      },
      run: (data) => delete data.avalancheSafe,
      outputStrings: {
        north: Outputs.m1A2N,
        northWest: Outputs.m1A2NW,
        northEast: Outputs.m1A2NE,
        goNorth: {
          en: 'Go to ${dir}',
          ja: '${dir}へ',
          ko: '${dir}!',
        },
      },
    },
    {
      id: 'R11S Arcadion Avalanche Follow Up South Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44D', 'B44F'], source: 'The Tyrant', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      infoText: (data, _matches, output) => {
        const dir = data.avalancheSafe === undefined
          ? output.south!()
          : data.avalancheSafe === 'east'
          ? output.southEast!()
          : output.southWest!();
        return output.goSouth!({ dir: dir });
      },
      run: (data) => delete data.avalancheSafe,
      outputStrings: {
        south: Outputs.m1A2S,
        southWest: Outputs.m1A2SW,
        southEast: Outputs.m1A2SE,
        goSouth: {
          en: 'Go to ${dir}',
          ja: '${dir}へ',
          ko: '${dir}!',
        },
      },
    },
    {
      id: 'R11S Atomic Impact Collect',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['atomicImpact'], capture: true },
      run: (data, matches) => {
        if (data.me === matches.target)
          data.hasAtomic = true;
        else
          data.atomicPartner = matches.target;
        data.atomicList.push(matches.target);
      },
    },
    {
      id: 'R11S Mammoth Meteor',
      // Occurs same time as Atomic Impact headmarkers
      type: 'StartsUsingExtra',
      netRegex: { id: 'B453', capture: true },
      delaySeconds: 0.1,
      suppressSeconds: 1,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          nw: Outputs.aimNW,
          ne: Outputs.aimNE,
          sw: Outputs.aimSW,
          se: Outputs.aimSE,
          dir: {
            en: 'Go ${dir} => Bait Impacts, Avoid Corners',
            ja: '${dir}へ',
            ko: '${dir}',
          },
          comboDir: {
            en: 'Go ${dir1}/${dir2} => Bait Impacts, Avoid Corners',
            ja: '${dir1} ${dir2}',
            ko: '${dir1} ${dir2}',
          },
          getMiddle: {
            en: 'Proximity AoE; Get Middle => Bait Puddles',
            ja: '連続AOE! 真ん中から',
            ko: '연속 장판! 한가운데서 시작',
          },
        };

        // Mammoth Meteor is always at two opposite intercardinals.
        // Once we see one, we know where the safespots are
        // without waiting on the second.
        const meteorX = parseFloat(matches.x);
        const meteorY = parseFloat(matches.y);
        const meteorQuad = Directions.xyToIntercardDirOutput(meteorX, meteorY, center.x, center.y);
        if (data.hasAtomic) {
          const pj = data.atomicPartner === undefined
            ? undefined
            : data.party.jobName(data.atomicPartner);
          if (pj !== undefined) {
            if (data.triggerSetConfig.stampedeStyle === 'totan') {
              data.atomicNorth = data.moks === 'H1'
                ? true
                : data.moks === 'D3'
                ? !Autumn.isPureHealerJob(pj)
                : data.moks === 'H2'
                ? Util.isCasterDpsJob(pj)
                : data.moks === 'D4'
                ? false
                : undefined;
            } else {
              data.atomicNorth = data.moks === 'H1'
                ? true
                : data.moks === 'D3'
                ? !Autumn.isPureHealerJob(pj)
                : data.moks === 'D4'
                ? Autumn.isBarrierHealerJob(pj)
                : data.moks === 'H2'
                ? false
                : undefined;
            }
            if (data.atomicNorth !== undefined) {
              if (data.atomicNorth) {
                data.fireballPosition = 'dirNW';
                if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
                  return { alertText: output.dir!({ dir: output.nw!() }) };
                return { alertText: output.dir!({ dir: output.ne!() }) };
              }
              data.fireballPosition = 'dirSE';
              if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
                return { alertText: output.dir!({ dir: output.se!() }) };
              return { alertText: output.dir!({ dir: output.sw!() }) };
            }
          }

          if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
            return { alertText: output.comboDir!({ dir1: output.nw!(), dir2: output.se!() }) };
          return { alertText: output.comboDir!({ dir1: output.ne!(), dir2: output.sw!() }) };
        }
        return { infoText: output.getMiddle!() };
      },
    },
    {
      id: 'R11S Cosmic Kiss', // Meteor towers
      type: 'StartsUsing',
      netRegex: { id: 'B456', source: 'The Tyrant', capture: false },
      condition: (data) => {
        if (data.hasAtomic)
          return false;
        return true;
      },
      durationSeconds: 4,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.triggerSetConfig.stampedeStyle === 'dxa') {
          // DXA
          if (data.role === 'tank')
            return output.pillar!({ dir: data.moks === 'MT' ? output.right!() : output.left!() });
          else if (data.moks === 'D1' || data.moks === 'D2') {
            // D1/D2는 시계 2개탑으로
            data.fireballPosition = 'dirNE';
            return output.pillar!({ dir: output.right!() });
          } else if (data.role === 'healer' || data.moks === 'D3' || data.moks === 'D4') {
            // 힐러/D3/D4는 반시계로 2개탑으로
            data.fireballPosition = 'dirSW';
            return output.pillar!({ dir: output.left!() });
          }
        } else {
          // 토탄V2
          if (data.role === 'tank')
            return output.pillar!({ dir: data.moks === 'MT' ? output.right!() : output.left!() });
          else if (data.role === 'healer') {
            // H1는 최우선 순위
            if (data.moks === 'H1')
              return output.pillar!({ dir: output.right!() });
            // H2는 H1/D3이 없어야 오른쪽, 아니면 왼쪽
            const [j1, j2] = data.atomicList.map((n) => data.party.jobName(n));
            if (j1 !== undefined && j2 !== undefined) {
              const hasHealer = Util.isHealerJob(j1) || Util.isHealerJob(j2);
              const hasRange = Util.isRangedDpsJob(j1) || Util.isRangedDpsJob(j2);
              const dir = hasHealer && hasRange ? output.right!() : output.left!();
              return output.pillar!({ dir: dir });
            }
          } else if (data.moks === 'D1') {
            data.fireballPosition = 'dirNE';
            return output.pillar!({ dir: output.right!() });
          } else if (data.moks === 'D2') {
            data.fireballPosition = 'dirSW';
            return output.pillar!({ dir: output.left!() });
          } else if (data.moks === 'D3') {
            // D3은 H1이 없어야 오른쪽, 아니면 왼쪽
            const [j1, j2] = data.atomicList.map((n) => data.party.jobName(n));
            if (j1 !== undefined && j2 !== undefined) {
              const hasPure = Autumn.isPureHealerJob(j1) || Autumn.isPureHealerJob(j2);
              const dir = hasPure ? output.right!() : output.left!();
              return output.pillar!({ dir: dir });
            }
          } else if (data.moks === 'D4') {
            // D4는 항상 왼쪽
            return output.pillar!({ dir: output.left!() });
          }
        }
        return output.getTowers!();
      },
      outputStrings: {
        getTowers: Outputs.getTowers,
        left: {
          en: 'Counter-CW',
          ja: '🡸反時計回り',
          ko: '🡸반시계',
        },
        right: {
          en: 'CW',
          ja: '時計回り🡺',
          ko: '시계🡺',
        },
        pillar: {
          en: 'Get ${dir} Tower',
          ja: '${dir}の塔を踏む',
          ko: '${dir} 방향 타워로',
        },
      },
    },
    {
      id: 'R11S Ecliptic Stampede Majestic Meteowrath Tether Collect',
      type: 'Tether',
      netRegex: { id: [headMarkerData.closeTether, headMarkerData.farTether], capture: true },
      condition: (data, matches) => {
        if (
          data.me === matches.target &&
          data.phase === 'ecliptic'
        )
          return true;
        return false;
      },
      suppressSeconds: 9999,
      run: (data) => data.hadEclipticTether = true,
    },
    {
      id: 'R11S Ecliptic Stampede Majestic Meteowrath Tethers',
      type: 'Tether',
      netRegex: { id: [headMarkerData.closeTether, headMarkerData.farTether], capture: true },
      condition: (data, matches) => {
        if (
          data.me === matches.target &&
          data.phase === 'ecliptic'
        )
          return true;
        return false;
      },
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return;

        const portalDirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        // TODO: Make config for options?
        const stretchDirNum = (portalDirNum + 5) % 8;
        const stretchDir = Directions.output8Dir[stretchDirNum] ?? 'unknown';
        return output.stretchTetherDir!({ dir: output[stretchDir]!() });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        stretchTetherDir: {
          en: 'Stretch Tether ${dir}',
          ja: '${dir}へ',
          ko: '${dir}쪽!',
        },
      },
    },
    {
      id: 'R11S Two-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B7BD', source: 'The Tyrant', capture: false },
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        const act = data.hadEclipticTether ? output.behind!() : output.front!();
        const pos = data.fireballPosition;
        if (pos === undefined)
          return output.twoWay!({ act: act });
        const rotMap: { [key: string]: string } = {
          'dirSW': 'dirW',
          'dirNW': 'dirW',
          'dirNE': 'dirE',
          'dirSE': 'dirE',
        };
        const npos = rotMap[pos] ?? pos;
        return output.twoWayDir!({ dir: output[npos]!(), act: act });
      },
      outputStrings: {
        twoWay: {
          en: 'East/West Line Stack, ${act}',
          ja: '東西一列頭割り (${act})',
          ko: '2웨이🟰 ${act}: 동서로 한줄',
        },
        twoWayDir: {
          en: '${dir} Line Stack, ${act}',
          ja: '${dir}で一列頭割り (${act})',
          ko: '2웨이🟰 ${act}: ${dir} 한줄',
        },
        front: {
          en: 'Be in Front',
          ja: '前へ',
          ko: '앞에서 막아요',
        },
        behind: {
          en: 'Get Behind',
          ja: '後ろへ',
          ko: '뒤로',
        },
        ...AutumnDir.stringMarker1A2Dir,
      },
    },
    {
      id: 'R11S Four-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B45A', source: 'The Tyrant', capture: false },
      alertText: (data, _matches, output) => {
        const act = data.hadEclipticTether ? output.behind!() : output.front!();
        const pos = data.fireballPosition;
        if (pos === undefined)
          return output.fourWay!({ act: act });
        return output.fourWayDir!({ dir: output[pos]!(), act: act });
      },
      outputStrings: {
        fourWay: {
          en: 'Intercardinal Line Stack, ${act}',
          ja: '斜めペア (${act})',
          ko: '4웨이❌ ${act}: 페어',
        },
        fourWayDir: {
          en: '${dir} Intercardinal Line Stack, ${act}',
          ja: '${dir}で斜めペア (${act})',
          ko: '4웨이❌ ${act}: ${dir} 페어',
        },
        front: {
          en: 'Be in Front',
          ja: '前へ',
          ko: '앞에서 막아요',
        },
        behind: {
          en: 'Get Behind',
          ja: '後ろへ',
          ko: '뒤로',
        },
        ...AutumnDir.stringMarker1A2Dir,
      },
    },
    {
      id: 'R11S Heartbreaker (Enrage Sequence)',
      type: 'StartsUsing',
      netRegex: { id: 'B45D', source: 'The Tyrant', capture: false },
      preRun: (data) => data.heartbreakerCount = data.heartbreakerCount + 1,
      infoText: (data, _matches, output) => {
        switch (data.heartbreakerCount) {
          case 1:
            return output.aoe5x!();
          case 2:
            return output.aoe6x!();
          case 3:
            return output.aoe7x!();
        }
      },
      outputStrings: {
        aoe5x: {
          en: 'AoE 5x',
          ja: '全体攻撃 x5',
          ko: '회전 회오리 x5',
        },
        aoe6x: {
          en: 'AoE 6x',
          ja: '全体攻撃 x6',
          ko: '회전 회오리 x6',
        },
        aoe7x: {
          en: 'AoE 7x',
          ja: '全体攻撃 x7',
          ko: '회전 회오리 x7',
        },
      },
    },
    // //////////////////////////////////////
    {
      id: 'R11S Meteorain',
      type: 'StartsUsing',
      netRegex: { id: 'B434', source: 'The Tyrant', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          healer: {
            en: 'Bait meteor #1',
            ja: 'メテオ誘導 #1',
            ko: '메테오 받아요! #1',
          },
          others: {
            en: 'Avoid middle!',
            ja: '中央を避けて！',
            ko: '서클 밖으로!',
          },
        };
        data.meteorCount = 1;
        if (data.role === 'healer')
          return { alertText: output.healer!() };
        return { infoText: output.others!() };
      },
    },
    {
      id: 'R11S Next Meteor',
      type: 'Ability',
      netRegex: { id: 'B439', source: 'The Tyrant', capture: false },
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        data.meteorCount++;
        if (data.meteorCount === 2) {
          if (data.moks === 'D3' || data.moks === 'D4')
            return output.next!({ num: '2' });
        }
        if (data.meteorCount === 3) {
          if (data.moks === 'D1' || data.moks === 'D2')
            return output.next!({ num: '3' });
        }
      },
      outputStrings: {
        next: {
          en: 'Bait meteor #${num}',
          ja: 'メテオ誘導 #${num}',
          ko: '메테오 받아요! #${num}',
        },
      },
    },
    {
      id: 'R11S Majestic Tether',
      type: 'Tether',
      // 참고로 00F9는 줄이 길어져서 안전해지면 바뀌는 tether id임
      netRegex: { id: '0039', capture: true },
      run: (data, matches) => data.majesticTethers.push(matches.target),
    },
    {
      id: 'R11S Majestic Tether Result',
      type: 'Tether',
      netRegex: { id: '0039', capture: false },
      delaySeconds: 0.2,
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.majesticTethers.length !== 4)
          return;
        if (data.majesticTethers.includes(data.me))
          return output.tetherOn!();
        return output.noTether!();
      },
      outputStrings: {
        tetherOn: {
          en: 'Majestic Tether on YOU',
          ja: '自分に線',
          ko: '내게 줄!',
        },
        noTether: {
          en: '(Bait aoe, later)',
          ja: '(あとでマーカー受ける)',
          ko: '(나중에 마커 받아요)',
        },
      },
    },
    {
      id: 'R11S Fire Breath Cleanup',
      type: 'StartsUsing',
      netRegex: { id: 'B446', source: 'The Tyrant', capture: false },
      run: (data, _matches) => {
        // 줄 정리만 한다
        data.majesticTethers = [];
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Majestic Meteowrath/Majestic Meteorain/Fire Breath': 'Fire Breath + Meteor Lines',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Comet': 'Komet',
        'Maelstrom': 'Mahlstrom',
        'The Tyrant': '(?:der|die|das) Tyrann',
      },
      'replaceText': {
        'Axe': 'Axt',
        'Scythe': 'Sense',
        '\\(castbar\\)': '(wirken)',
        '\\(split\\)': '(teilen)',
        '--Fire Breath Markers--': '--Feueratem Markierungen--',
        '--Meteor Markers': '--Meteor Markierungen',
        '--Meteor(?! Markers)': '--Meteor',
        '--jump': '--Sprung',
        'scythe--': 'Sense--',
        '--tethers--': '--Verbindungen--',
        'Arcadion Avalanche': 'Arkadionbruch',
        'Assault Apex': 'Waffenlawine',
        'Assault Evolved': 'Waffensturm',
        'Atomic Impact': 'Fusionseinschlag',
        'Charybdistopia': 'Charybdis des Herrschers',
        '(?<! )Comet(?!ite)': 'Komet',
        'Cometite': 'Mini-Komet',
        'Cosmic Kiss': 'Einschlag',
        'Crown of Arcadia': 'Wort des Herrschers',
        'Crushing Comet': 'Super-Komet',
        'Dance of Domination(?! Trophy)': 'Unangefochtene Überlegenheit',
        'Dance of Domination Trophy': 'Überlegene Waffenkunst',
        'Ecliptic Stampede': 'Meteo-Stampede',
        'Explosion': 'Explosion',
        'Eye of the Hurricane': 'Hurrikan des Herrschers',
        'Fearsome Fireball': 'Fürstliches Feuer',
        '(?<!--)Fire Breath': 'Feueratem',
        'Fire and Fury': 'Feueratem & Flammenschweif',
        'Flatliner': 'Herzstopper',
        'Foregone Fatality': 'Strahl der Verdammnis',
        'Four-way Fireball': 'Vierfaches Drehfeuer',
        'Great Wall of Fire': 'Feuerstrom',
        'Heartbreak Kick': 'Herzensbrecher-Kick',
        'Heartbreaker': 'Herzensbrecher',
        'Heavy Hitter': 'Zerteilen',
        'Immortal Reign': 'Unsterblichkeit des Herrschers',
        '(?<! )Impact': 'Impakt',
        'Majestic Meteor(?!ain)': 'Herrscher-Meteo',
        'Majestic Meteorain': 'Herrscher-Meteorregen',
        'Majestic Meteowrath': 'Herrscher-Meteo des Zorns',
        'Mammoth Meteor': 'Giga-Meteo',
        'Massive Meteor': 'Super-Meteo',
        '(?<! )Meteorain': 'Meteorregen',
        'One and Only': 'Alles für einen',
        'Orbital Omen': 'Orbitalachse',
        'Powerful Gust': 'Starke Bö',
        'Raw Steel(?! Trophy)': 'Waffenspalter',
        'Raw Steel Trophy': 'Spaltende Waffenkunst',
        'Shockwave': 'Schockwelle',
        'Triple Tyrannhilation': 'Drillingsstern-Tyrannensturz',
        '(?<! )Trophy Weapons': 'Waffentrophäen',
        'Two-way Fireball': 'Zweifaches Drehfeuer',
        'Ultimate Trophy Weapons': 'Unantastbare Waffentrophäen',
        'Void Stardust': 'Kometenschauer',
        '(?<! )Weapon(?!s)': 'Waffe',
        'Weighty Impact': 'Mega-Einschlag',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Comet': 'comète',
        'Maelstrom': 'maelström',
        'The Tyrant': 'The Tyrant',
      },
      'replaceText': {
        'Arcadion Avalanche': 'Écrasement de l\'Arcadion',
        'Assault Apex': 'Avalanche d\'armes',
        'Assault Evolved': 'Arsenal d\'assaut',
        'Atomic Impact': 'Impact de canon dissolvant',
        'Charybdistopia': 'Maelström',
        '(?<! )Comet(?!ite)': 'comète',
        'Cometite': 'Petite comète',
        'Cosmic Kiss': 'Impact de canon',
        'Crown of Arcadia': 'Souverain de l\'Arcadion',
        'Crushing Comet': 'Comète imposante',
        'Dance of Domination(?! Trophy)': 'Danse de la domination',
        'Dance of Domination Trophy': 'Génération d\'arme : domination',
        'Ecliptic Stampede': 'Ruée de météores',
        'Explosion': 'Explosion',
        'Eye of the Hurricane': 'Ouragan',
        'Fearsome Fireball': 'Rayon incandescent',
        'Fire Breath': 'Souffle enflammé',
        'Fire and Fury': 'Queue enflammée',
        'Flatliner': 'Dernière ligne',
        'Foregone Fatality': 'Pluie fatale',
        'Great Wall of Fire': 'Courants de feu',
        'Heartbreak Kick': 'Talon déchirant',
        'Heartbreaker': 'Ruine-cœur',
        'Heavy Hitter': 'Lacération lourde',
        'Immortal Reign': 'Règne immortel',
        '(?<! )Impact': 'Impact',
        'Majestic Meteor(?!ain)': 'Météore du champion',
        'Majestic Meteorain': 'Pluie de météores du champion',
        'Majestic Meteowrath': 'Fureur météorique du champion',
        'Mammoth Meteor': 'Météore gigantesque',
        'Massive Meteor': 'Météore imposant',
        '(?<! )Meteorain': 'Pluie de météorites',
        'One and Only': 'Seul et unique',
        'Orbital Omen': 'Pluie orbitale',
        'Powerful Gust': 'Ouragan violent',
        'Raw Steel(?! )': 'Écrasement du tyran',
        'Raw Steel Trophy': 'Génération d\'arme : écrasement',
        'Shockwave': 'Onde de choc',
        '(?<! )Trophy Weapons': 'Armes trophées',
        'Ultimate Trophy Weapons': 'Armes trophées ultimes',
        'Void Stardust': 'Pluie de comètes',
        'Weighty Impact': 'Impact de canon massif',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Comet': 'コメット',
        'Maelstrom': 'ミールストーム',
        'The Tyrant': 'ザ・タイラント',
      },
      'replaceText': {
        'Arcadion Avalanche': 'アルカディア・クラッシュ',
        'Assault Apex': 'ウェポンアバランチ',
        'Assault Evolved': 'ウェポンアサルト',
        'Atomic Impact': '融解着弾',
        'Charybdistopia': 'ザ・ミールストーム',
        '(?<! )Comet(?!ite)': 'コメット',
        'Cometite': 'プチコメット',
        'Cosmic Kiss': '着弾',
        'Crown of Arcadia': 'キング・オブ・アルカディア',
        'Crushing Comet': 'ヘビーコメット',
        'Dance of Domination(?! Trophy)': 'ダンス・オブ・ドミネーション',
        'Dance of Domination Trophy': 'ウェポンジェネレート：ドミネーション',
        'Ecliptic Stampede': 'メテオスタンピード',
        'Explosion': '爆発',
        'Eye of the Hurricane': 'ザ・ハリケーン',
        'Fearsome Fireball': 'ビッグファイア',
        'Fire Breath': 'ファイアブレス',
        'Fire and Fury': 'ファイア・アンド・テイル',
        'Flatliner': 'フラットライナー',
        'Foregone Fatality': 'フェイタルライン',
        'Great Wall of Fire': 'ファイアストリーム',
        'Heartbreak Kick': 'ハートブレイクキック',
        'Heartbreaker': 'ハートブレイカー',
        'Heavy Hitter': '重斬撃',
        'Immortal Reign': 'イモータルレイン',
        '(?<! )Impact': '衝撃',
        'Majestic Meteor(?!ain)': 'チャンピオンズ・メテオ',
        'Majestic Meteorain': 'チャンピオンズ・メテオライン',
        'Majestic Meteowrath': 'チャンピオンズ・メテオラース',
        'Mammoth Meteor': 'ヒュージメテオ',
        'Massive Meteor': 'ヘビーメテオ',
        '(?<! )Meteorain': 'メテオレイン',
        'One and Only': 'ワン・アンド・オンリー',
        'Orbital Omen': 'オービタルライン',
        'Powerful Gust': '強風',
        'Raw Steel(?! )': 'ウェポンバスター',
        'Raw Steel Trophy': 'ウェポンジェネレート：バスター',
        'Shockwave': '衝撃波',
        '(?<! )Trophy Weapons': 'トロフィーウェポンズ',
        'Ultimate Trophy Weapons': 'アルティメット・トロフィーウェポンズ',
        'Void Stardust': 'コメットレイン',
        'Weighty Impact': '重着弾',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Comet': '彗星',
        'Maelstrom': '大漩涡',
        'The Tyrant': '霸王',
      },
      'replaceText': {
        '--jump ': '--跳',
        ' Markers--': '点名--',
        '--meteor(?! Markers)': '--陨石',
        '--Meteor Markers': '--陨石标记',
        'scythe--': '镰刀--',
        '--tethers--': '--连线--',
        'Axe\\)': '斧头)',
        '\\(castbar\\)': '(咏唱栏)',
        '\\(damage\\)': '(伤害)',
        '\\(Enrage\\)': '(狂暴)',
        '\\(Scythe': '(镰刀',
        '\\(split\\)': '(分散)',
        'Arcadion Avalanche': '登天碎地',
        'Assault Apex': '铸兵崩落',
        'Assault Evolved': '铸兵突袭',
        'Atomic Impact': '融解轰击',
        'Charybdistopia': '霸王大漩涡',
        '(?<! )Comet(?!ite)': '彗星',
        'Cometite': '彗星风暴',
        'Cosmic Kiss': '轰击',
        'Crown of Arcadia': '天顶的主宰',
        'Crushing Comet': '重彗星',
        'Dance of Domination(?! Trophy)': '统治的战舞',
        'Dance of Domination Trophy': '铸兵之令：统治',
        'Ecliptic Stampede': '陨石狂奔',
        'Explosion': '爆炸',
        'Eye of the Hurricane': '霸王飓风',
        'Fearsome Fireball': '大火',
        'Fire and Fury': '兽焰连尾击',
        'Fire Breath': '火焰吐息',
        'Flatliner': '绝命分断击',
        'Foregone Fatality': '夺命链',
        'Four-way Fireball': '四向回旋火',
        'Great Wall of Fire': '火焰流',
        'Heartbreak Kick': '碎心踢',
        'Heartbreaker': '碎心击',
        'Heavy Hitter': '重斩击',
        'Immortal Reign': '万劫不朽的统治',
        '(?<! )Impact': '冲击',
        'Majestic Meteor(?!ain)': '王者陨石',
        'Majestic Meteorain': '王者陨石雨',
        'Majestic Meteowrath': '王者陨石震',
        'Mammoth Meteor': '遮天陨石',
        'Massive Meteor': '重陨石',
        '(?<! )Meteorain': '流星雨',
        'One and Only': '举世无双的霸王',
        'Orbital Omen': '星轨链',
        'Powerful Gust': '强风',
        'Raw Steel(?! Trophy)': '铸兵轰击',
        'Raw Steel Trophy(?! Axe| Scythe)': '铸兵之令：轰击',
        'Raw Steel Trophy Axe': '铸兵之令：轰击 斧',
        'Raw Steel Trophy Scythe': '铸兵之令：轰击 镰',
        'Shockwave': '冲击波',
        'Triple Tyrannhilation': '三重霸王坠击',
        '(?<! )Trophy Weapons': '历战之兵武',
        'Two-way Fireball': '双向回旋火',
        'Ultimate Trophy Weapons': '历战之极武',
        'Void Stardust': '彗星雨',
        '(?<! )Weapon(?!s)': '武器',
        'Weighty Impact': '重轰击',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Comet': '혜성',
        'Maelstrom': '대소용돌이',
        'The Tyrant': '더 타이런트',
      },
      'replaceText': {
        '--jump ': '--점프 ',
        ' Markers--': ' 징--',
        '--meteor(?! Markers)': '--메테오',
        '--Meteor Markers': '--메테오 징',
        'scythe--': '낫--',
        '--tethers--': '--선--',
        'Axe\\)': '도끼)',
        '\\(castbar\\)': '(시전바)',
        '\\(damage\\)': '(피해)',
        '\\(Enrage\\)': '(전멸기)',
        '\\(Scythe': '(낫',
        '\\(split\\)': '(분단)',
        'Arcadion Avalanche': '아르카디아 파괴',
        'Assault Apex': '무기 맹공습',
        'Assault Evolved': '무기 공습',
        'Atomic Impact': '융해 착탄',
        'Charybdistopia': '폭군의 대소용돌이',
        '(?<! )Comet(?!ite)': '혜성',
        'Cometite': '소혜성',
        'Cosmic Kiss': '착탄',
        'Crown of Arcadia': '아르카디아의 제왕',
        'Crushing Comet': '대혜성',
        'Dance of Domination(?! Trophy)': '지배의 검무',
        'Dance of Domination Trophy': '무기 생성: 지배의 검',
        'Ecliptic Stampede': '메테오 쇄도',
        'Explosion': '폭발',
        'Eye of the Hurricane': '폭군의 허리케인',
        'Fearsome Fireball': '거대한 화염',
        'Fire and Fury': '화염과 꼬리',
        'Fire Breath': '화염 숨결',
        'Flatliner': '절명격',
        'Foregone Fatality': '필멸선',
        'Four-way Fireball': '네 갈래 회전화염',
        'Great Wall of Fire': '화염 기류',
        'Heartbreak Kick': '심장파열격',
        'Heartbreaker': '심장파괴자',
        'Heavy Hitter': '집중 참격',
        'Immortal Reign': '불멸의 지배자',
        '(?<! )Impact': '충격',
        'Majestic Meteor(?!ain)': '챔피언 메테오',
        'Majestic Meteorain': '챔피언 메테오선',
        'Majestic Meteowrath': '분노의 챔피언 메테오',
        'Mammoth Meteor': '초거대 메테오',
        'Massive Meteor': '거대 메테오',
        '(?<! )Meteorain': '메테오 레인',
        'One and Only': '유일무이',
        'Orbital Omen': '궤도선',
        'Powerful Gust': '강풍',
        'Raw Steel(?! Trophy)': '무기 맹격',
        'Raw Steel Trophy(?! Axe| Scythe)': '무기 생성: 맹격',
        'Raw Steel Trophy Axe': '무기 생성: 맹격 도끼',
        'Raw Steel Trophy Scythe': '무기 생성: 맹격 낫',
        'Shockwave': '충격파',
        'Triple Tyrannhilation': '폭군 강하: 삼형제별',
        '(?<! )Trophy Weapons': '무기 트로피',
        'Two-way Fireball': '두 갈래 회전화염',
        'Ultimate Trophy Weapons': '궁극의 무기 트로피',
        'Void Stardust': '혜성우',
        '(?<! )Weapon(?!s)': '무기',
        'Weighty Impact': '겹착탄',
      },
    },
  ],
};

export default triggerSet;
