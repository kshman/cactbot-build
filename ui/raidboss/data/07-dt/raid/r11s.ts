import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import Util, {
  DirectionOutputCardinal,
  DirectionOutputIntercard,
  Directions,
} from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'one' | 'arenaSplit' | 'ecliptic';

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    trophyDisplay: 'full' | 'simple';
    dominationStyle: 'none' | 'moks';
    stampedeStyle: 'static' | 'totan' | 'dxa';
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
  fireballCount: number;
  hasAtomic: boolean;
  meteowrathTetherDirNum?: number;
  heartbreakerCount: number;
  meteorCount: number;
  majesticTethers: string[];
  avalancheSafe?: 'east' | 'west';
  atomicList: string[];
  atomicPartner?: string;
  atomicNorth?: boolean;
  fireballPosition?: string;
  hasStretchTether: boolean;
  stampedeStyle?: 'static' | 'totan' | 'dxa';
}

const center = {
  x: 100,
  y: 100,
};
console.assert(center);

const phaseMap: { [id: string]: Phase } = {
  'B43F': 'arenaSplit', // Flatliner
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

const trophyStrings = {
  healerGroups: {
    en: 'Healer Groups',
    ja: 'ヒラに頭割り',
    ko: '칼:4:4',
  },
  stack: {
    en: 'Stack in Middle',
    ja: '中央で頭割り',
    ko: '도끼:뭉쳐',
  },
  protean: {
    en: 'Protean',
    ja: '基本さんかい',
    ko: '낫:프로틴',
  },
  healerGroupsSimple: {
    en: 'Healer',
    ja: '4:4',
    ko: '4:4',
  },
  stackSimple: {
    en: 'Middle',
    ja: '中央',
    ko: '한가운데',
  },
  proteanSimple: {
    en: 'Protean',
    ja: '内側散会',
    ko: '안쪽 산개',
  },
} as const;

const markerStrings = {
  dirN: {
    en: '🡹North',
    ja: '🄰🡹北',
    ko: '🄰🡹북',
  },
  dirE: {
    en: '🡺East',
    ja: '🄱🡺東',
    ko: '🄱🡺동',
  },
  dirS: {
    en: '🡻South',
    ja: '🄲🡻南',
    ko: '🄲🡻남',
  },
  dirW: {
    en: '🡸West',
    ja: '🄳🡸西',
    ko: '🄳🡸서',
  },
  dirNW: {
    en: '🡼NW',
    ja: '➊🡼北西',
    ko: '➊🡼북서',
  },
  dirNE: {
    en: '🡽NE',
    ja: '➋🡽北東',
    ko: '➋🡽북동',
  },
  dirSE: {
    en: '🡾SE',
    ja: '➌🡾南東',
    ko: '➌🡾남동',
  },
  dirSW: {
    en: '🡿SW',
    ja: '➍🡿南西',
    ko: '➍🡿남서',
  },
  unknown: Outputs.unknown,
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM3Savage',
  zoneId: ZoneId.AacHeavyweightM3Savage,
  config: [
    {
      id: 'trophyDisplay',
      name: {
        en: 'Trophy Weapon Mechanic Display',
        ja: 'トロフィー表示方法',
        ko: '트로피 표시 방법',
      },
      type: 'select',
      options: {
        en: {
          'Full Display': 'full',
          'Simple Display': 'simple',
        },
        ja: {
          'フル表示': 'full',
          '簡易表示': 'simple',
        },
        ko: {
          '전체 표시': 'full',
          '간이 표시': 'simple',
        },
      },
      default: 'full',
    },
    {
      id: 'dominationStyle',
      name: {
        en: 'Domination Safe Spot Style',
        ja: '支配の踊り 安全地帯表示方法',
        ko: '도미네이션 안전지대 표시 방법',
      },
      type: 'select',
      options: {
        en: {
          'Just hint': 'none',
          'Advise by your moks': 'moks',
        },
        ja: {
          'ヒントのみ': 'none',
          '自分のモクスでアドバイス': 'moks',
        },
        ko: {
          '힌트만': 'none',
          '자기 몫에 따라 조언': 'moks',
        },
      },
      default: 'none',
    },
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
          'Static': 'static',
          'Totan v2': 'totan',
          'DXA Method': 'dxa',
        },
        ja: {
          'とたんV3方式': 'static',
          'とたんV2方式': 'totan',
          'DXA方式': 'dxa',
        },
        ko: {
          '토탄V3 방식': 'static',
          '토탄V2 방식': 'totan',
          'DXA 방식': 'dxa',
        },
      },
      default: 'static',
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
    fireballCount: 0,
    hasAtomic: false,
    heartbreakerCount: 0,
    meteorCount: 0,
    explosionTowerCount: 0,
    majesticTethers: [],
    atomicList: [],
    hasStretchTether: false,
  }),
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

        data.stampedeStyle = data.triggerSetConfig.stampedeStyle;
        data.stampedeStyle = 'static'; // 임시 고정
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
        if (data.weaponMechCount > 2)
          return 3.7;
        return 0;
      },
      durationSeconds: (data) => {
        if (data.weaponMechCount < 3)
          return 8.7;
        return 5;
      },
      countdownSeconds: (data) => {
        if (data.weaponMechCount < 3)
          return 8.7;
        return 5;
      },
      infoText: (data, matches, output) => {
        if (data.triggerSetConfig.trophyDisplay === 'simple') {
          const simple = matches.param1 === '11D1'
            ? 'healerGroupsSimple'
            : (matches.param1 === '11D2' ? 'stackSimple' : 'proteanSimple');
          return output[simple]!();
        }
        const mechanic = matches.param1 === '11D1'
          ? 'healerGroups'
          : (matches.param1 === '11D2' ? 'stack' : 'protean');
        if (data.weaponMechCount === 7)
          return output.mechanicThenBait!({ mech: output[mechanic]!() });
        if (data.weaponMechCount > 3)
          return output.mechanicThenMove!({ mech: output[mechanic]!() });
        return output[mechanic]!();
      },
      run: (data) => data.weaponMechCount++,
      outputStrings: {
        ...trophyStrings,
        mechanicThenMove: {
          en: '${mech} => Move',
          ja: '${mech}', // 이동 제거, 지저분하다
          ko: '${mech}', // 이동 제거, 마찬가지의 이유
        },
        mechanicThenBait: {
          en: '${mech} => Bait Gust',
          ja: '${mech} 🔜 風誘導',
          ko: '${mech} 🔜 돌풍 유도!',
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
          if (data.triggerSetConfig.trophyDisplay === 'simple') {
            const sw1 = `${weapon1.type}Simple`;
            const sw2 = `${weapon2.type}Simple`;
            const sw3 = `${weapon3.type}Simple`;
            return output.text!({
              weapon1: output[sw1]!(),
              weapon2: output[sw2]!(),
              weapon3: output[sw3]!(),
            });
          }
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
      run: (data) => data.voidStardust = 'spread',
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
      run: (data) => data.voidStardust = 'stack',
    },
    {
      id: 'R11S Crushing Comet',
      type: 'StartsUsing',
      netRegex: { id: 'B415', source: 'The Tyrant', capture: true },
      response: Responses.stackMarkerOn(),
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
      id: 'R11S Void Stardust End',
      // The second set of comets does not have a startsUsing cast
      // Timing is on the last Assault Evolved
      type: 'StartsUsing',
      netRegex: { id: ['B418', 'B419', 'B41A'], source: 'The Tyrant', capture: true },
      condition: (data) => {
        if (data.voidStardust !== undefined) {
          data.assaultEvolvedCount = data.assaultEvolvedCount + 1;
          if (data.assaultEvolvedCount === 3)
            return true;
        }
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
      // Adapted from normal mode
      id: 'R11S Dance Of Domination Trophy Safe Spots',
      // B7BC Explosion
      type: 'StartsUsingExtra',
      netRegex: { id: 'B7BC', capture: true },
      preRun: (data, matches) => {
        // Determine whether the AoE is orthogonal or diagonal
        // Discard diagonal headings, then count orthogonals.
        const headingDirNum = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        if (headingDirNum % 2 === 0) {
          const isVert = headingDirNum % 4 === 0;
          const isHoriz = headingDirNum % 4 === 2;
          if (isVert) {
            data.domDirectionCount.vertCount += 1;
            if (parseFloat(matches.x) < center.x - 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) =>
                dir !== 'dirW'
              );
            else if (parseFloat(matches.x) > center.x + 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) =>
                dir !== 'dirE'
              );
          } else if (isHoriz) {
            data.domDirectionCount.horizCount += 1;
            if (parseFloat(matches.y) < center.y - 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) =>
                dir !== 'dirN'
              );
            else if (parseFloat(matches.y) > center.y + 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) =>
                dir !== 'dirS'
              );
          } else {
            console.error(`Bad Domination heading data: ${matches.heading}`);
          }
        }
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
          ko: '${dir}쪽 기준',
        },
        eastWest: {
          en: 'E/W Mid / ${dir} Outer + Partner Stacks',
          ja: '${dir}基準',
          ko: '${dir}쪽 기준',
        },
        ...markerStrings,
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
    /* 이거 표시할 이유가 없다
    {
      id: 'R11S Maelstrom 3 Reminder',
      type: 'AddedCombatant',
      netRegex: { name: 'Maelstrom', capture: false },
      condition: (data) => data.maelstromCount === 3,
      response: Responses.moveAway(),
    }, */
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
          ko: '돌풍 유도: ${dir}쪽',
        },
        ...markerStrings,
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
          en: 'AoE + Short knockback',
          ja: '全体攻撃 + 短いノックバック',
          ko: '전체 공격 + 짧은 넉백',
        },
      },
    },
    {
      id: 'R11S Explosion Towers', // Knockback towers
      type: 'StartsUsing',
      netRegex: { id: 'B444', source: 'The Tyrant', capture: false },
      durationSeconds: 9.5,
      suppressSeconds: 1,
      countdownSeconds: 9.5,
      alertText: (_data, _matches, output) => output.knockbackTowers!(),
      outputStrings: {
        knockbackTowers: {
          en: 'Get Knockback Towers',
          ja: 'ノックバック塔を踏む',
          ko: '넉백 타워 밟아요!',
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
      infoText: (_data, _matches, output) => output.fireBreath!(),
      outputStrings: {
        fireBreath: {
          en: 'Fire Breath on YOU',
          ja: '自分にファイアブレス',
          ko: '내게 파이어 브레스',
        },
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
          ko: '${dir}쪽으로',
        },
        west: markerStrings.dirW,
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
          ko: '${dir}쪽으로',
        },
        east: markerStrings.dirE,
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
        north: markerStrings.dirN,
        northWest: markerStrings.dirNW,
        northEast: markerStrings.dirNE,
        goNorth: {
          en: 'Go to ${dir}',
          ja: '${dir}へ',
          ko: '${dir}쪽!',
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
        south: markerStrings.dirS,
        southWest: markerStrings.dirSW,
        southEast: markerStrings.dirSE,
        goSouth: {
          en: 'Go to ${dir}',
          ja: '${dir}へ',
          ko: '${dir}쪽!',
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
            ko: '${dir}쪽으로',
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
            data.atomicNorth = data.moks === 'H1'
              ? true
              : data.moks === 'D3'
              ? !Autumn.isPureHealerJob(pj)
              : data.moks === 'H2'
              ? Util.isCasterDpsJob(pj)
              : data.moks === 'D4'
              ? false
              : undefined;
            if (data.atomicNorth !== undefined) {
              if (data.atomicNorth) {
                data.fireballPosition = data.stampedeStyle !== 'static' ? 'dirNW' : 'dirN';
                if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
                  return { alertText: output.dir!({ dir: output.nw!() }) };
                return { alertText: output.dir!({ dir: output.ne!() }) };
              }
              data.fireballPosition = data.stampedeStyle !== 'static' ? 'dirSE' : 'dirS';
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
        if (data.stampedeStyle === 'dxa') {
          // DXA 스타일
          if (data.role === 'tank')
            return output.pillar!({ dir: data.moks === 'MT' ? output.right!() : output.left!() });
          else if (data.role === 'healer') {
            // 힐러는 그냥 반시계로 2개탑으로
            data.fireballPosition = 'dirSW';
            return output.pillar!({ dir: output.left!() });
          } else if (data.moks === 'D1' || data.moks === 'D2') {
            // D1/D2는 시계 2개탑으로
            data.fireballPosition = 'dirNE';
            return output.pillar!({ dir: output.right!() });
          } else if (data.moks === 'D3') {
            // D3은 반시계 2개탑으로
            data.fireballPosition = 'dirSW';
            return output.pillar!({ dir: output.left!() });
          } else if (data.moks === 'D4') {
            // D4는 항상 왼쪽
            data.fireballPosition = 'dirSW';
            return output.pillar!({ dir: output.left!() });
          }
        } else if (data.stampedeStyle === 'totan' || data.stampedeStyle === 'static') {
          // 토탄V2/V3 스타일
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
            data.fireballPosition = data.stampedeStyle === 'totan' ? 'dirNE' : 'dirN';
            return output.pillar!({ dir: output.right!() });
          } else if (data.moks === 'D2') {
            data.fireballPosition = data.stampedeStyle === 'totan' ? 'dirSW' : 'dirS';
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
      id: 'R11S Majestic Meteowrath Tethers',
      type: 'Tether',
      netRegex: { id: [headMarkerData.closeTether, headMarkerData.farTether], capture: true },
      condition: (data, matches) => {
        if (
          data.me === matches.target &&
          data.phase === 'ecliptic' &&
          data.meteowrathTetherDirNum === undefined
        )
          return true;
        return false;
      },
      suppressSeconds: 99,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined) {
          console.error(
            `R11S Majestic Meteowrath Tethers: Wrong actor count ${actors.length}`,
          );
          return;
        }

        const dirNum = Directions.xyTo8DirNum(actor.PosX, actor.PosY, center.x, center.y);
        data.meteowrathTetherDirNum = dirNum;
      },
      infoText: (data, _matches, output) => {
        if (data.meteowrathTetherDirNum === undefined)
          return;
        type dirNumStretchMap = {
          [key: number]: string;
        };
        // TODO: Make config for options?
        const stretchCW: dirNumStretchMap = {
          0: 'dirSW',
          2: 'dirNW',
          4: 'dirNE',
          6: 'dirSE',
        };
        const stretchDir = stretchCW[data.meteowrathTetherDirNum];
        if (stretchDir !== undefined)
          data.fireballPosition = stretchDir;
        data.hasStretchTether = true;
        return output.stretchTetherDir!({ dir: output[stretchDir ?? '???']!() });
      },
      outputStrings: {
        ...markerStrings,
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
        const pos = data.fireballPosition;
        if (pos === undefined)
          return data.stampedeStyle === 'static' ? output.nsWay!() : output.ewWay!();
        if (data.stampedeStyle === 'static' && data.hasStretchTether) {
          const rotMap: { [key: string]: string } = {
            'dirSW': 'dirS',
            'dirNW': 'dirN',
            'dirNE': 'dirN',
            'dirSE': 'dirS',
          };
          const npos = rotMap[pos] ?? pos;
          return output.wait!({ dir: output[npos]!() });
        }
        return output.twoWay!({ dir: output[pos]!() });
      },
      outputStrings: {
        wait: {
          en: 'Wait, ${dir} Line Stack',
          ja: '隅み待機 (${dir})',
          ko: '모서리 대기 (${dir}쪽)',
        },
        ewWay: {
          en: 'East/West Line Stack',
          ja: '東西一列頭割り',
          ko: '동서로 한줄 뭉쳐요',
        },
        nsWay: {
          en: 'North/South Line Stack',
          ja: '南北一列頭割り',
          ko: '남북으로 한줄 뭉쳐요',
        },
        twoWay: {
          en: '${dir} Line Stack',
          ja: '${dir}で一列頭割り',
          ko: '${dir}쪽 한줄 뭉쳐요',
        },
        ...markerStrings,
      },
    },
    {
      id: 'R11S Four-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B45A', source: 'The Tyrant', capture: false },
      alertText: (data, _matches, output) => {
        const pos = data.fireballPosition;
        if (pos === undefined)
          return data.stampedeStyle === 'static' ? output.plusWay!() : output.crossWay!();
        if (data.stampedeStyle === 'static') {
          const rotMap: { [key: string]: string } = {
            'dirSW': 'dirW',
            'dirNW': 'dirN',
            'dirNE': 'dirE',
            'dirSE': 'dirS',
          };
          let npos = rotMap[pos] ?? pos;
          if (data.hasStretchTether)
            return output.wait!({ dir: output[npos]!() });
          if (data.moks === 'D1' && npos === 'dirN')
            npos = 'dirW';
          else if (data.moks === 'D2' && npos === 'dirS')
            npos = 'dirE';
          return output.fourPlusWay!({ dir: output[npos]!() });
        }
        return output.fourCrossWay!({ dir: output[pos]!() });
      },
      outputStrings: {
        wait: {
          en: 'Wait, ${dir} Line Stack',
          ja: '隅み待機 (${dir})',
          ko: '모서리 대기 (${dir}쪽)',
        },
        crossWay: {
          en: 'Intercardinal Line Stack',
          ja: '斜めペア',
          ko: '❌페어',
        },
        plusWay: {
          en: 'Cardinal Line Stack',
          ja: '十字ペア',
          ko: '➕페어',
        },
        fourCrossWay: {
          en: '${dir} Intercardinal Line Stack',
          ja: '${dir}で斜めペア',
          ko: '${dir}쪽 ❌페어',
        },
        fourPlusWay: {
          en: '${dir} Cardinal Line Stack',
          ja: '${dir}で十字ペア',
          ko: '${dir}쪽 ➕페어',
        },
        ...markerStrings,
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
      'locale': 'ja',
      'replaceSync': {
        'Comet': 'コメット',
        'The Tyrant': 'ザ・タイラント',
      },
    },
  ],
};

export default triggerSet;
