import Autumn, { AutumnDir } from '../../../../../resources/autumn';
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
    stampedeStyle: 'static' | 'dxa';
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
  atomicList: string[];
  atomicPartner?: string;
  fireballPosition?: DirectionOutputIntercard;
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
console.assert(headMarkerData);

const trophyStrings = {
  healerGroups: {
    en: 'Healer Groups',
    ja: 'ヒラに頭割り',
    ko: '4:4 힐러',
  },
  stack: {
    en: 'Stack in Middle',
    ja: '中央で頭割り',
    ko: '한가운데',
  },
  protean: {
    en: 'Protean',
    ja: '基本さんかい',
    ko: '자기 자리',
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
          'DXA Method': 'dxa',
        },
        ja: {
          '固定表示': 'static',
          'DXA方式': 'dxa',
        },
        ko: {
          '고정 표시': 'static',
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
    maelstromCount: 0,
    hasMeteor: false,
    fireballCount: 0,
    hasAtomic: false,
    heartbreakerCount: 0,
    meteorCount: 0,
    explosionTowerCount: 0,
    majesticTethers: [],
    atomicList: [],
  }),
  timelineTriggers: [
    {
      id: 'R11S Void Stardust End',
      // The second set of Crushing Comet/Comet does not have a related startsUsing cast
      // Timing is on the last Assault Evolved
      regex: /^Crushing Comet/,
      beforeSeconds: 11.1,
      suppressSeconds: 3,
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
  ],
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
      delaySeconds: 1,
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
      delaySeconds: 1,
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
          return output.mechanicThenBait!({ mech: output[mechanic]!(), bait: output.bait!() });
        if (data.weaponMechCount > 3)
          return output.mechanicThenMove!({ mech: output[mechanic]!(), move: output.move!() });
        return output[mechanic]!();
      },
      run: (data) => data.weaponMechCount++,
      outputStrings: {
        ...trophyStrings,
        move: Outputs.moveAway,
        bait: {
          en: 'Bait Gust',
          ja: '風誘導',
          ko: '돌풍 꼬깔 유도해요!',
        },
        mechanicThenMove: {
          en: '${mech} => ${move}',
          ja: '${mech} 🔜 ${move}',
          ko: '${mech} 🔜 ${move}',
        },
        mechanicThenBait: {
          en: '${mech} => ${bait}',
          ja: '${mech} 🔜 ${bait}',
          ko: '${mech} 🔜 ${bait}',
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
          ja: '${dir}基準 + 南北',
          ko: '${dir}기준 + 남북',
        },
        eastWest: {
          en: 'E/W Mid / ${dir} Outer + Partner Stacks',
          ja: '${dir}基準 + 東西',
          ko: '${dir}기준 + 동서',
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
    {
      id: 'R11S Maelstrom 3 Reminder',
      type: 'AddedCombatant',
      netRegex: { name: 'Maelstrom', capture: false },
      condition: (data) => data.maelstromCount === 3,
      response: Responses.moveAway(),
    },
    {
      id: 'R11S Powerful Gust Reminder',
      type: 'AddedCombatant',
      netRegex: { name: 'Maelstrom', capture: false },
      condition: (data) => data.maelstromCount === 4,
      infoText: (_data, _matches, output) => output.bait!(),
      outputStrings: {
        bait: {
          en: 'Bait Gust',
          ja: '風誘導',
          ko: '돌풍 꼬깔 유도해요!',
        },
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
      infoText: (_data, _matches, output) => output.sharedTankbuster!(),
      outputStrings: {
        sharedTankbuster: Outputs.sharedTankbuster,
      },
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
          ko: '한줄 뭉쳐요 (맨 앞에서 몸빵)',
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
          ko: '넉백 타워 들어가요!',
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
        const west = output.west!();
        if (Autumn.inMainTeam(data.moks))
          return output.mtStay!({ dir: west });
        if (Autumn.inSubTeam(data.moks))
          return output.stWest!({ dir: west });
        return output.westSafe!({ dir: west });
      },
      outputStrings: {
        westSafe: {
          en: 'Tower Knockback to ${dir}',
          ja: '塔ノックバック${dir}へ',
          ko: '타워 넉백 ${dir}쪽으로',
        },
        mtStay: {
          en: 'Tower Knockback to West',
          ja: 'MT組: そのまま${dir}',
          ko: 'MT팀: 그대로 ${dir}쪽',
        },
        stWest: {
          en: 'Tower Knockback to West',
          ja: 'ST組: ${dir}へノックバック',
          ko: 'ST팀: ${dir}쪽으로 이동 넉백',
        },
        west: markerStrings.dirW,
      },
    },
    {
      id: 'R11S Arcadion Avalanche East Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44A', 'B44C'], source: 'The Tyrant', capture: false },
      infoText: (data, _matches, output) => {
        const east = output.east!();
        if (Autumn.inMainTeam(data.moks))
          return output.mtEast!({ dir: east });
        if (Autumn.inSubTeam(data.moks))
          return output.stStay!({ dir: east });
        return output.eastSafe!({ dir: east });
      },
      outputStrings: {
        eastSafe: {
          en: 'Tower Knockback to ${dir}',
          ja: '塔ノックバック${dir}へ',
          ko: '타워 넉백 ${dir}쪽으로',
        },
        mtEast: {
          en: 'Tower Knockback to ${dir}',
          ja: 'MT組: ${dir}へノックバック',
          ko: 'MT팀: ${dir}쪽으로 이동 넉백',
        },
        stStay: {
          en: 'Tower Knockback to ${dir}',
          ja: 'ST組: そのまま${dir}',
          ko: 'ST팀: 그대로 ${dir}쪽',
        },
        east: markerStrings.dirE,
      },
    },
    {
      id: 'R11S Arcadion Avalanche Follow Up North Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44B', 'B451'], source: 'The Tyrant', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      infoText: (_data, _matches, output) => output.goNorth!(),
      outputStrings: {
        goNorth: {
          en: '🡹North',
          ja: '安置: 🡹北',
          ko: '안전: 🡹북쪽',
        },
      },
    },
    {
      id: 'R11S Arcadion Avalanche Follow Up South Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44D', 'B44F'], source: 'The Tyrant', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      infoText: (_data, _matches, output) => output.goSouth!(),
      outputStrings: {
        goSouth: {
          en: '🡻South',
          ja: '安置: 🡻南',
          ko: '안전: 🡻남쪽',
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
      infoText: (data, matches, output) => {
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
            let north: boolean | undefined = undefined;
            if (data.moks === 'H1')
              north = true;
            else if (data.moks === 'D3')
              north = !Autumn.isPureHealerJob(pj);
            else if (data.moks === 'H2')
              north = Util.isCasterDpsJob(pj);
            else if (data.moks === 'D4')
              north = false;
            else {
              // 뭐여 이건
              // 이건 무슨 잡이 미스를 내는 소린가
            }
            if (north !== undefined) {
              if (north) {
                if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
                  return output.dir!({ dir: output.nw!() });
                return output.dir!({ dir: output.ne!() });
              }
              if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
                return output.dir!({ dir: output.se!() });
              return output.dir!({ dir: output.sw!() });
            }
          }

          if (meteorQuad === 'dirNE' || meteorQuad === 'dirSW')
            return output.comboDir!({ dir1: output.nw!(), dir2: output.se!() });
          return output.comboDir!({ dir1: output.ne!(), dir2: output.sw!() });
        }
        return output.getMiddle!();
      },
      outputStrings: {
        nw: Outputs.aimNW,
        ne: Outputs.aimNE,
        sw: Outputs.aimSW,
        se: Outputs.aimSE,
        dir: {
          en: 'Go ${dir} => Bait Impacts, Avoid Corners',
          ja: '${dir}へ 🔜 着弾誘導',
          ko: '${dir}쪽 🔜 착탄 유도',
        },
        comboDir: {
          en: 'Go ${dir1}/${dir2} => Bait Impacts, Avoid Corners',
          ja: '${dir1} ${dir2} 🔜 着弾誘導',
          ko: '${dir1} ${dir2} 🔜 착탄 유도',
        },
        getMiddle: {
          en: 'Proximity AoE; Get Middle => Bait Puddles',
          ja: '連続AOE! 真ん中から',
          ko: '연속 장판! 한가운데서 시작',
        },
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
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.atomicList.length === 2) {
          if (data.role === 'tank') {
            // 탱크는 비교할게 탱크뿐
            const dir = data.moks === 'MT' ? output.right!() : output.left!();
            return output.pillar!({ dir: dir });
          } else if (Util.isHealerJob(data.job)) {
            if (data.triggerSetConfig.stampedeStyle === 'dxa')
              return output.pillarInner!({ dir: output.left!() });
            // H1는 최우선 순위
            if (data.moks === 'H1') {
              data.fireballPosition = 'dirNW';
              return output.pillarInner!({ dir: output.right!() });
            }
            // H2는 H1, D3이 없어야 오른쪽, 아니면 왼쪽
            const [j1, j2] = data.atomicList.map((n) => data.party.jobName(n));
            if (j1 !== undefined && j2 !== undefined) {
              let c = 0;
              if (Util.isHealerJob(j1) || Util.isHealerJob(j2))
                c++;
              if (Util.isRangedDpsJob(j1) || Util.isRangedDpsJob(j2))
                c++;
              if (c === 2) {
                data.fireballPosition = 'dirNW';
                return output.pillarInner!({ dir: output.right!() });
              }
              data.fireballPosition = 'dirSE';
              return output.pillarInner!({ dir: output.left!() });
            }
          } else if (data.moks === 'D1' || data.moks === 'D2') {
            if (data.triggerSetConfig.stampedeStyle === 'dxa')
              return output.pillarOuter!({ dir: output.right!() });
            // D1 오른쪽
            if (data.moks === 'D1') {
              data.fireballPosition = 'dirNE';
              return output.pillarOuter!({ dir: output.right!() });
            }
            // D2 왼쪽
            data.fireballPosition = 'dirSW';
            return output.pillarOuter!({ dir: output.left!() });
          } else if (data.moks === 'D3') {
            if (data.triggerSetConfig.stampedeStyle === 'dxa')
              return output.pillarInner!({ dir: output.left!() });
            // D3은 H1이 없어야 오른쪽, 아니면 왼쪽
            const [j1, j2] = data.atomicList.map((n) => data.party.jobName(n));
            if (j1 !== undefined && j2 !== undefined) {
              if (Autumn.isPureHealerJob(j1) || Autumn.isPureHealerJob(j2)) {
                data.fireballPosition = 'dirSE';
                return output.pillarInner!({ dir: output.left!() });
              }
              data.fireballPosition = 'dirNW';
              return output.pillarInner!({ dir: output.right!() });
            }
          } else if (data.moks === 'D4') {
            // D4는 항상 왼쪽
            data.fireballPosition = 'dirSE';
            return output.pillarInner!({ dir: output.left!() });
          }
        }
        return output.getTowers!();
      },
      outputStrings: {
        getTowers: Outputs.getTowers,
        left: {
          en: 'CCW',
          ja: '🡸反時計回り',
          ko: '🡸반시계방향',
        },
        right: {
          en: 'CW',
          ja: '時計回り🡺',
          ko: '시계방향🡺',
        },
        pillar: {
          en: 'Get ${dir} Pillar Tower',
          ja: '${dir}の塔を踏む',
          ko: '${dir}, 타워 밟아요',
        },
        pillarInner: {
          en: 'Get ${dir} Middle of Pillar Tower',
          ja: '${dir}の塔の真ん中を踏む',
          ko: '${dir}, 타워 <한가운데> 밟아요',
        },
        pillarOuter: {
          en: 'Get ${dir} Outer of Pillar Tower',
          ja: '${dir}の塔の外側を踏む',
          ko: '${dir}, 타워 <바깥쪽> 밟아요',
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
        return output.stretchTetherDir!({ dir: output[stretchDir ?? '???']!() });
      },
      outputStrings: {
        ...AutumnDir.stringsAim,
        stretchTetherDir: {
          en: 'Stretch Tether ${dir}',
          ja: '線を伸ばす: ${dir}',
          ko: '줄 늘려요: ${dir}쪽',
        },
      },
    },
    {
      id: 'R11S Two-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B7BD', source: 'The Tyrant', capture: false },
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.hasAtomic)
          return output.twoWayAtomic!();
        const pos = data.fireballPosition;
        if (pos === undefined)
          return output.twoWay!();
        const dir = (pos === 'dirNE' || pos === 'dirSE') ? output.east!() : output.west!();
        return output.twoWayDir!({ dir: dir });
      },
      outputStrings: {
        twoWay: {
          en: 'East/West Line Stack',
          ja: '東西一列頭割り',
          ko: '동서로 한줄 뭉쳐요',
        },
        twoWayAtomic: {
          en: 'Move; East/West Line Stack',
          ja: '東西一列頭割り',
          ko: '동서로 한줄 뭉쳐요',
        },
        twoWayDir: {
          en: '${dir} Line Stack',
          ja: '${dir}で一列頭割り',
          ko: '${dir}쪽 한줄 뭉쳐요',
        },
        east: markerStrings.dirE,
        west: markerStrings.dirW,
      },
    },
    {
      id: 'R11S Four-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B45A', source: 'The Tyrant', capture: false },
      alertText: (data, _matches, output) => {
        if (data.hasAtomic)
          return output.fourWayAtomic!();
        const pos = data.fireballPosition;
        if (pos === undefined)
          return output.fourWay!();
        return output.fourWayDir!({ dir: output[pos]!() });
      },
      outputStrings: {
        fourWay: {
          en: 'Intercardinal Line Stack',
          ja: '斜め一列ペア',
          ko: '❌로 한줄 페어',
        },
        fourWayAtomic: {
          en: 'Stay Corner, Intercardinal Line Stack',
          ja: '斜め一列ペア',
          ko: '❌로 한줄 페어',
        },
        fourWayDir: {
          en: '${dir} Intercardinal Line Stack',
          ja: '${dir}で斜め一列ペア',
          ko: '${dir}쪽 ❌로 한줄 뭉쳐요',
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
            return output.heartbreaker1!({
              tower: output.getTower!(),
              stack: output.stack5x!(),
            });
          case 2:
            return output.heartbreaker2!({
              tower: output.getTower!(),
              stack: output.stack6x!(),
            });
          case 3:
            return output.heartbreaker3!({
              tower: output.getTower!(),
              stack: output.stack7x!(),
            });
        }
      },
      outputStrings: {
        getTower: {
          en: 'Get Tower',
          ja: '塔を踏む',
          ko: '타워 밟아요',
        },
        stack5x: {
          en: 'Stack 5x',
          ja: '頭割り x5',
          ko: '뭉쳐요 x5',
        },
        stack6x: {
          en: 'Stack 6x',
          ja: '頭割り x6',
          ko: '뭉쳐요 x6',
        },
        stack7x: {
          en: 'Stack 7x',
          ja: '頭割り x7',
          ko: '뭉쳐요 x7',
        },
        heartbreaker1: {
          en: '${tower} => ${stack}',
          ja: '${tower} 🔜 ${stack}',
          ko: '${tower} 🔜 ${stack}',
        },
        heartbreaker2: {
          en: '${tower} => ${stack}',
          ja: '${tower} 🔜 ${stack}',
          ko: '${tower} 🔜 ${stack}',
        },
        heartbreaker3: {
          en: '${tower} => ${stack}',
          ja: '${tower} 🔜 ${stack}',
          ko: '${tower} 🔜 ${stack}',
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
