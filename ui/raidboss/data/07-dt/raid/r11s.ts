import { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutputCardinal, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'one' | 'arenaSplit' | 'ecliptic';

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    trophyDisplay: 'full' | 'simple';
    dominationStyle: 'none' | 'moks';
  };
  phase: Phase;
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  weapons: {
    id: string;
    type: 'stack' | 'healerGroups' | 'protean';
    dir: number;
    actor: { x: number; y: number; heading: number };
  }[];
  weaponMechCount: number;
  domDirectionCount: {
    vertCount: number;
    horizCount: number;
    outerSafe: DirectionOutputCardinal[];
  };
  hasMeteor: boolean;
  fireballCount: number;
  hasAtomic: boolean;
  meteowrathTetherDirNum?: number;
  heartbreakerCount: number;
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
    hasMeteor: false,
    fireballCount: 0,
    hasAtomic: false,
    heartbreakerCount: 0,
  }),
  timelineTriggers: [
    {
      id: 'R11S Powerful Gust',
      regex: /Powerful Gust/,
      beforeSeconds: 6.3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Gust',
          ja: '風誘導',
          ko: '돌풍 꼬깔 유도해요!',
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
        if (phase !== undefined)
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
        return output[mechanic]!();
      },
      run: (data) => data.weaponMechCount++,
      outputStrings: trophyStrings,
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
      id: 'R11S Comet Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['cometSpread'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: {
          en: 'Comet Spread',
          ja: 'コメット散開',
          ko: '흩어지는 혜성!',
        },
      },
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
      durationSeconds: 10.9,
      response: Responses.bigAoe(),
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
          en: '${dir} + N/S Mid',
          ja: '${dir}基準 + 南北',
          ko: '${dir}기준 + 남북',
        },
        eastWest: {
          en: '${dir} + E/W Mid',
          ja: '${dir}基準 + 東西',
          ko: '${dir}기준 + 동서',
        },
        dirN: '북🄰',
        dirE: '동🄱',
        dirS: '남🄲',
        dirW: '서🄳',
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R11S Charybdistopia',
      type: 'StartsUsing',
      netRegex: { id: 'B425', source: 'The Tyrant', capture: false },
      response: Responses.hpTo1Aoe(),
    },
    {
      id: 'R11S One and Only',
      type: 'StartsUsing',
      netRegex: { id: 'B429', source: 'The Tyrant', capture: false },
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
      id: 'R11S Meteor',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['meteor'], capture: true },
      condition: (data, matches) => {
        if (data.me === matches.target && data.phase === 'one')
          return true;
        return false;
      },
      response: Responses.meteorOnYou(),
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
      alertText: (data, _matches, output) => {
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
          ko: '한줄 뭉쳐요 (혜성 뒤로)',
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
          ja: '隕石3つの後ろに隠れる',
          ko: '혜성으로 메테오 피해요 x3',
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
          ja: '横へ短いノックバック',
          ko: '옆쪽으로 짧은 넉백',
        },
      },
    },
    {
      id: 'R11S Explosion Towers', // Knockback towers
      type: 'StartsUsing',
      netRegex: { id: 'B444', source: 'The Tyrant', capture: false },
      durationSeconds: 10,
      suppressSeconds: 1,
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
      infoText: (_data, _matches, output) => output.westSafe!(),
      outputStrings: {
        westSafe: {
          en: 'Tower Knockback to West',
          ja: '塔ノックバック🄳西へ',
          ko: '타워 넉백 🄳서쪽으로',
        },
      },
    },
    {
      id: 'R11S Arcadion Avalanche East Safe',
      type: 'StartsUsing',
      netRegex: { id: ['B44A', 'B44C'], source: 'The Tyrant', capture: false },
      infoText: (_data, _matches, output) => output.eastSafe!(),
      outputStrings: {
        eastSafe: {
          en: 'Tower Knockback to East',
          ja: '塔ノックバック🄱東へ',
          ko: '타워 넉백 🄱동쪽으로',
        },
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
          ja: '🄰北',
          ko: '🄰북쪽',
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
          ja: '🄲南',
          ko: '🄲남쪽',
        },
      },
    },
    {
      id: 'R11S Atomic Impact Collect',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['atomicImpact'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.hasAtomic = true,
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
        comboDir: {
          en: 'Go ${dir1}/${dir2} => Bait Impacts, Avoid Corners',
          ja: '${dir1} ${dir2} 🔜 着弾誘導',
          ko: '${dir1} ${dir2} 🔜 착탄 유도',
        },
        getMiddle: {
          en: 'Proximity AoE; Get Middle => Bait Puddles',
          ja: '近接AoE、中央へ 🔜 AoE誘導',
          ko: '근접 장판, 한가운데로 🔜 장판 유도',
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
      response: Responses.getTowers(),
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
          ko: '줄 늘려요: ${dir}',
        },
      },
    },
    {
      id: 'R11S Two-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B7BD', source: 'The Tyrant', capture: false },
      alertText: (data, _matches, output) => {
        if (data.hasAtomic)
          return output.twoWayAtomic!();
        return output.twoWay!();
      },
      outputStrings: {
        twoWay: {
          en: 'East/West Line Stack',
          ja: '東西一列頭割り',
          ko: '동서로 한줄 뭉쳐요',
        },
        twoWayAtomic: {
          en: 'Move; East/West Line Stack',
          ja: '逃げて、東西一列頭割り',
          ko: '피하고, 동서로 한줄 뭉쳐요',
        },
      },
    },
    {
      id: 'R11S Four-way Fireball',
      type: 'StartsUsing',
      netRegex: { id: 'B45A', source: 'The Tyrant', capture: false },
      alertText: (data, _matches, output) => {
        if (data.hasAtomic)
          return output.fourWayAtomic!();
        return output.fourWay!();
      },
      outputStrings: {
        fourWay: {
          en: 'Intercardinal Line Stack',
          ja: '斜め一列頭割り',
          ko: '비스듬히 한줄 뭉쳐요',
        },
        fourWayAtomic: {
          en: 'Stay Corner, Intercardinal Line Stack',
          ja: '隅に、斜め一列頭割り',
          ko: '모서리로, 비스듬히 한줄 뭉쳐요',
        },
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
