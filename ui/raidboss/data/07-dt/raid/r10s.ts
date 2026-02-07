import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'entry' | 'snaking' | 'split' | 'xtreme';

type SnakingFlagsType = {
  [flags: string]: {
    elem: 'water' | 'fire';
    mech: 'protean' | 'stack' | 'buster';
  };
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    snakingSecond: 'static' | 'game8';
  };
  phase: Phase;
  dares: number;
  snakings: SnakingFlagsType[string][];
  snakingCount: number;
  snakingMine?: 'water' | 'fire';
  snakingSpread: boolean;
}

const center = {
  x: 100,
  y: 100,
};
console.assert(center);

const phaseMap: { [id: string]: Phase } = {
  'B381': 'snaking', // Firesnaking
  'B5D4': 'split', // Flame Floater
  'B5AE': 'xtreme', // Xtreme Firesnaking
} as const;

const floaterTetherMap: { [effectId: string]: number } = {
  'BBC': 1,
  'BBD': 2,
  'BBE': 3,
  'D7B': 4,
} as const;

const sickestTakeoffMap: { [id: string]: string } = {
  '3ED': 'healerGroups',
  '3EE': 'spread',
  '3EF': 'waterStack',
  '3F0': 'waterSpread',
} as const;

const snakingSlots = {
  'NW': '16',
  'N': '0F',
  'NE': '10',
  'W': '15',
  'C': '0E',
  'E': '11',
  'SW': '14',
  'S': '13',
  'SE': '12',
} as const;

const snakingFlags: SnakingFlagsType = {
  '00020001': {
    elem: 'water',
    mech: 'protean',
  },
  '00200010': {
    elem: 'water',
    mech: 'stack',
  },
  '00800040': {
    elem: 'water',
    mech: 'buster',
  },
  '02000100': {
    elem: 'fire',
    mech: 'protean',
  },
  '08000400': {
    elem: 'fire',
    mech: 'stack',
  },
  '20001000': {
    elem: 'fire',
    mech: 'buster',
  },
} as const;

const headMarkers = {
  'hotImpact': '0103',
  'blueTether': '027B',
  'redTether': '027C',
  'partnerStack': '0293',
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM2Savage',
  zoneId: ZoneId.AacHeavyweightM2Savage,
  config: [
    {
      id: 'snakingSecond',
      name: {
        en: 'Snaking Second Mechanic',
        ja: 'スネーク2回目の処理方法',
        ko: '스네이크 2번째 기믹 처리 방법',
      },
      type: 'select',
      options: {
        en: {
          'Role Static (Healer>Melee>Ranged)': 'static',
          'Game 8 Style': 'game8',
        },
        ja: {
          'ロール固定（ヒーラー＞近接＞遠隔）': 'static',
          'Game 8 指定': 'game8',
        },
        ko: {
          '역할 고정 (힐러＞근접＞원거리)': 'static',
          'Game 8 스타일': 'game8',
        },
      },
      default: 'game8',
    },
  ],
  timelineFile: 'r10s.txt',
  initData: () => ({
    phase: 'entry',
    actorPositions: {},
    dares: 0,
    snakings: [],
    snakingCount: 0,
    snakingSpread: false,
  }),
  triggers: [
    {
      id: 'R10S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phaseMap), source: 'Red Hot' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const phase = phaseMap[matches.id];
        if (phase !== undefined)
          data.phase = phase;
      },
    },
    {
      id: 'R10S Hot Impact Buster',
      type: 'HeadMarker',
      netRegex: { id: headMarkers['hotImpact'], capture: true },
      durationSeconds: 5,
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R10S Flame Floater Order',
      type: 'GainsEffect',
      netRegex: { effectId: Object.keys(floaterTetherMap), capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        const index = floaterTetherMap[matches.effectId];
        if (index === undefined)
          return;
        const dist = index % 2 === 1 ? output.far!() : output.near!();
        return output.tether!({ num: index, dist: dist });
      },
      outputStrings: {
        tether: {
          en: '#${num} (${dist})',
          ja: '線#${num} (${dist})',
          ko: '줄#${num} (${dist})',
        },
        far: {
          en: 'Far',
          ja: '遠く',
          ko: '멀리가요',
        },
        near: {
          en: 'Near',
          ja: '近く',
          ko: '보스쪽',
        },
      },
    },
    {
      id: 'R10S when Fire Resistance Down II',
      type: 'GainsEffect',
      // Fire Resistance Down II
      netRegex: { effectId: 'B79', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.move!(),
      outputStrings: {
        move: {
          en: 'Move Away',
          ja: 'ゆかから逃げて',
          ko: '불장판에서 나와욧!',
        },
      },
    },
    {
      id: 'R10S Alley-oop Inferno',
      type: 'StartsUsing',
      netRegex: { id: 'B5C0', source: 'Red Hot', capture: false },
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        if (data.snakingMine === 'fire')
          return output.fire!();
        if (data.snakingMine === 'water')
          return;
        return output.spread!();
      },

      outputStrings: {
        fire: {
          en: 'Bait fire puddle',
          ja: '🔥AOE誘導',
          ko: '🔥장판 유도',
        },
        spread: {
          en: 'Spread + AOE',
          ja: '個人AOE + 散開',
          ko: '발밑 장판 + 흩어져요',
        },
      },
    },
    {
      id: 'R10S Alley-oop',
      type: 'StartsUsing',
      netRegex: { id: ['B5DD', 'B5E0'], source: 'Deep Blue', capture: true },
      condition: (data) => data.snakingMine !== 'fire',
      durationSeconds: 4.5,
      infoText: (data, matches, output) => {
        if (data.snakingMine === 'water')
          return output.water!();
        const mech = matches.id === 'B5DD' ? output.move!() : output.stay!();
        return output.text!({ protean: output.protean!(), mech: mech });
      },
      outputStrings: {
        water: {
          en: 'Bait cone => Go center',
          ja: '扇誘導 🔜 中央へ',
          ko: '꼬깔 유도 🔜 한가운데로',
        },
        move: {
          en: 'Move',
          ja: '移動',
          ko: '옆으로',
        },
        stay: {
          en: 'Stay',
          ja: '待機',
          ko: '그대로',
        },
        protean: Outputs.protean,
        text: {
          en: '${protean} => ${mech}',
          ja: '${protean} 🔜 ${mech}',
          ko: '${protean} 🔜 ${mech}',
        },
      },
    },
    {
      id: 'R10S Cutback Blaze',
      type: 'StartsUsing',
      netRegex: { id: 'B5C9', source: 'Red Hot', capture: false },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.snakingMine === 'water')
          return;
        return output.stack!();
      },
      outputStrings: {
        stack: {
          en: 'Bait cleave towards Fire',
          ja: 'みんなで扇誘導',
          ko: '모두 모여 꼬깔 유도',
        },
      },
    },
    {
      id: 'R10S Pyrotation',
      type: 'StartsUsing',
      netRegex: { id: 'B5C2', source: 'Red Hot', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.move!(),
      outputStrings: {
        move: {
          en: 'AOE + Bait puddles',
          ja: 'みんなでAOE誘導',
          ko: '모여서 장판 유도 x3',
        },
      },
    },
    {
      id: 'R10S Divers\' Dare Count',
      type: 'StartsUsing',
      netRegex: { id: ['B5B8', 'B5B9'], source: ['Red Hot', 'Deep Blue'], capture: false },
      run: (data) => data.dares++,
    },
    {
      id: 'R10S Divers\' Dare',
      type: 'StartsUsing',
      netRegex: { id: ['B5B8', 'B5B9'], source: ['Red Hot', 'Deep Blue'], capture: false },
      delaySeconds: 0.1,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          aoe: Outputs.aoe,
          bigAoe: Outputs.bigAoe,
        };
        if (data.dares === 1)
          return { infoText: output.aoe!() };
        return { alertText: output.bigAoe!() };
      },
      run: (data) => data.dares = 0,
    },
    {
      id: 'R10S Sickest Take-off',
      type: 'GainsEffect',
      netRegex: { effectId: '808', count: Object.keys(sickestTakeoffMap), capture: true },
      durationSeconds: 5,
      alertText: (data, matches, output) => {
        let mech = sickestTakeoffMap[matches.count];
        if (mech === undefined)
          return;
        if (data.phase === 'split')
          return output.splitPair!();
        if (!mech.startsWith('water'))
          return output[mech]!();
        if (data.snakingMine === 'fire')
          mech = mech.replace('water', 'fire');
        return output[mech]!();
      },
      outputStrings: {
        healerGroups: Outputs.healerGroups,
        spread: Outputs.spread,
        waterStack: {
          en: 'Water Stack',
          ja: '💧頭割り',
          ko: '💧뭉쳐요',
        },
        waterSpread: Outputs.spread,
        fireStack: {
          en: 'Water Stack',
          ja: '(💧頭割り)',
          ko: '(💧뭉쳐요)',
        },
        fireSpread: {
          en: 'Avoid Waters',
          ja: '(さんかい💧避けて)',
          ko: '(흩어지는💧피해요!)',
        },
        splitPair: {
          en: 'Split Pairs',
          ja: '分断ペア',
          ko: '분단 둘이 페어!',
        },
      },
    },
    {
      id: 'R10S Sickest Take-off Knockback',
      type: 'StartsUsing',
      netRegex: { id: 'B5CE', source: 'Deep Blue', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 6,
      response: Responses.knockback(),
    },
    {
      id: 'R10S Deep Impact',
      type: 'StartsUsing',
      netRegex: { id: 'B5B7', source: 'Deep Blue', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tank: {
            en: 'Bait tank buster far away',
            ja: 'ノックバックでタン强誘導',
            ko: '돌진 넉백 버스터 유도',
          },
          water: {
            en: 'Bait water tank buster far away',
            ja: '💧ノックバックでタン强誘導',
            ko: '내가💧돌진 넉백 버스터 유도!',
          },
          healer: {
            en: 'Care for buster bait',
            ja: 'タン强に注意',
            ko: '탱크 돌진 버스터 주의',
          },
          avoid: {
            en: 'Buster on tank',
            ja: 'タン强に注意',
            ko: '탱크 돌진 버스터 피해요',
          },
        };
        if (data.role === 'tank') {
          if (data.snakingMine === undefined)
            return { alertText: output.tank!() };
          if (data.snakingMine === 'water')
            return { alertText: output.water!() };
        }
        if (data.role === 'healer')
          return { infoText: output.healer!() };
        return { infoText: output.avoid!() };
      },
    },
    {
      id: 'R10S Xtreme Spectacular',
      type: 'StartsUsing',
      netRegex: { id: 'B5D9', source: 'Red Hot', capture: true },
      durationSeconds: 11,
      alertText: (_data, _matches, output) => output.aoe!(),
      outputStrings: {
        aoe: {
          en: 'Large AOE',
          ja: '南北へ！大きな連続全体攻撃',
          ko: '남북으로! 큰 연속 전체 공격',
        },
      },
    },
    {
      // Insane Air도 여기서 처리됨
      // ['B893', 'B894', 'B895', 'B896', 'B897', 'B898', 'B899', 'B89A']
      id: 'R10S Snaking Flags Collector',
      type: 'MapEffect',
      netRegex: {
        location: Object.values(snakingSlots),
        flags: Object.keys(snakingFlags),
        capture: true,
      },
      preRun: (data, matches) => {
        const slot = matches.location;
        const flags = matches.flags;
        const snaking = snakingFlags[flags];

        if (snaking === undefined) {
          console.log(`Could not find snaking mapping for slot ${slot}, flags ${flags}`);
          return;
        }

        if (snaking.elem === 'water')
          data.snakings = [snaking, ...data.snakings];
        else
          data.snakings.push(snaking);

        if (snaking.elem === 'fire' && (snaking.mech !== 'buster' || data.snakingCount < 4))
          data.snakingCount++;
      },
      durationSeconds: 7,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          both: {
            en: '${elem1}: ${mech1}/${elem2}: ${mech2}',
            ja: '${elem1}-${mech1} / ${elem2}-${mech2}',
            ko: '${elem1}${mech1} / ${elem2}${mech2}',
          },
          combo: {
            en: '${elem}: ${mech}',
            ja: '${elem}-${mech}',
            ko: '${elem}${mech}',
          },
          roleSwap: {
            en: '${mech} (${role} swap)',
            ja: '${mech}（${role}交代）',
            ko: '${mech} (${role} 교대)',
          },
          mySwap: {
            en: 'Swap: ${elem}: ${mech}',
            ja: '交代: ${elem}-${mech}',
            ko: '교대해요! ${elem}${mech}',
          },
          water: {
            en: 'Water',
            ja: '💧',
            ko: '💧',
          },
          fire: {
            en: 'Fire',
            ja: '🔥',
            ko: '🔥',
          },
          protean: Outputs.spread,
          stack: Outputs.stackMarker,
          buster: Outputs.tankBuster,
          tank: Outputs.tank,
          healer: Outputs.healer,
          melee: Outputs.melee,
          ranged: Outputs.ranged,
        };

        const [snaking1, snaking2] = data.snakings;
        if (snaking1 === undefined || snaking2 === undefined)
          return;

        if (data.snakingCount < 5) {
          // 어 이거 1번이 물, 2번이 불 고정같은데?
          const [water, fire] = snaking1.elem === 'water'
            ? [snaking1, snaking2]
            : [snaking2, snaking1];

          let my = undefined;
          if (data.snakingMine === undefined) {
            // insane air 일 경우
            const team = Autumn.getTeam(data.moks);
            my = team === 'MT' ? water : fire;
          } else {
            // snaking 일 경우
            my = data.snakingMine === 'water' ? water : fire;
          }

          if (my === undefined) {
            return {
              infoText: output.both!({
                elem1: output[water.elem]!(),
                mech1: output[water.mech]!(),
                elem2: output[fire.elem]!(),
                mech2: output[fire.mech]!(),
              }),
            };
          }
          return {
            infoText: output.combo!({
              elem: output[my.elem]!(),
              mech: output[my.mech]!(),
            }),
          };
        }

        // game8 방식
        if (data.triggerSetConfig.snakingSecond === 'game8') {
          let mine = false;
          if (snaking1.mech === 'buster') {
            mine = data.role === 'tank';
          } else if (snaking1.mech === 'stack') {
            mine = data.role === 'healer';
          } else if (data.snakingSpread) {
            mine = data.moks === 'D3' || data.moks === 'D4';
          } else {
            mine = data.moks === 'D1' || data.moks === 'D2';
            data.snakingSpread = true;
          }
          if (mine) {
            data.snakingMine = data.snakingMine === 'water' ? 'fire' : 'water';
            return {
              alertText: output.mySwap!({
                elem: output[data.snakingMine]!(),
                mech: output[snaking1.mech]!(),
              }),
            };
          }
          if (data.snakingMine === undefined)
            return { infoText: output[snaking1.mech]!() };
          return {
            infoText: output.combo!({
              elem: output[data.snakingMine]!(),
              mech: output[snaking1.mech]!(),
            }),
          };
        }

        // static 방식
        const role = (snaking1.mech === 'buster')
          ? output.tank!()
          : (data.snakingCount === 5)
          ? output.healer!()
          : (data.snakingCount === 6)
          ? output.melee!()
          : output.ranged!();
        return { infoText: output.roleSwap!({ mech: output[snaking1.mech]!(), role: role }) };
      },
      run: (data) => {
        if (data.snakings.length > 1)
          data.snakings = [];
      },
    },
    {
      id: 'R10S Snaking Gain',
      type: 'GainsEffect',
      netRegex: { effectId: ['136E', '136F'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        if (matches.effectId === '136E') {
          data.snakingMine = 'fire';
          return output.fire!();
        }
        data.snakingMine = 'water';
        return output.water!();
      },
      outputStrings: {
        water: {
          en: 'Water Snaking on YOU',
          ja: '自分に💧',
          ko: '내게 물💧',
        },
        fire: {
          en: 'Fire Snaking on YOU',
          ja: '自分に🔥',
          ko: '내게 불🔥',
        },
      },
    },
    {
      id: 'R10S Snaking Lost',
      type: 'LosesEffect',
      netRegex: { effectId: ['136E', '136F'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.snakingMine = undefined,
    },
    {
      id: 'R10S Xtreme Snaking Gain',
      type: 'GainsEffect',
      netRegex: { effectId: ['12DB', '12DC'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 5,
      infoText: (data, matches, output) => {
        if (matches.effectId === '12DB') {
          data.snakingMine = 'fire';
          return output.fire!();
        }
        data.snakingMine = 'water';
        return output.water!();
      },
      outputStrings: {
        water: {
          en: 'Water Snaking on YOU',
          ja: '自分に💧',
          ko: '내게 물💧',
        },
        fire: {
          en: 'Fire Snaking on YOU',
          ja: '自分に🔥',
          ko: '내게 불🔥',
        },
      },
    },
    /* 어짜피 이 뒤에 안쓰니깐 냅두자
    {
      id: 'R10S Xtreme Snaking Lost',
      type: 'LosesEffect',
      netRegex: { effectId: ['12DB', '12DC'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.snakingMine = undefined,
    }, */
    {
      id: 'R10S Deep Varial',
      type: 'MapEffect',
      netRegex: {
        location: ['02', '04'],
        flags: ['00800040', '08000400'],
        capture: true,
      },
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        const dir = matches.location === '02' ? 'north' : 'south';
        const mech = matches.flags === '00800040' ? 'stack' : 'spread';
        if (data.snakingMine === undefined)
          return output.text!({ dir: output[dir]!(), mech: output[mech]!() });
        if (data.snakingMine === 'water')
          return output.water!({ dir: output[dir]!(), mech: output[mech]!() });
        return output.fire!({ dir: output[dir]!() });
      },
      outputStrings: {
        north: {
          en: '🡹N',
          ja: '🡹北',
          ko: '🄰북쪽',
        },
        south: {
          en: '🡻S',
          ja: '🡻南',
          ko: '🄲남쪽',
        },
        stack: Outputs.stacks,
        spread: Outputs.spread,
        text: {
          en: '${dir} + Water ${mech} + Fire Spread',
          ja: '${dir} + ${mech} + 🔥散開',
          ko: '${dir} + ${mech} + 🔥흩어져요',
        },
        water: {
          en: '${dir} + Water ${mech}',
          ja: '${dir} + 💧${mech}',
          ko: '${dir} + 💧${mech}',
        },
        fire: {
          en: '${dir} + Fire Spread',
          ja: '${dir} + 🔥散開',
          ko: '${dir} + 🔥흩어져요',
        },
      },
    },
    {
      id: 'R10S Hot Aerial',
      type: 'StartsUsing',
      netRegex: { id: 'B5C4', source: 'Red Hot', capture: false },
      condition: (data) => data.snakingMine === 'fire',
      durationSeconds: 4,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.north!();
        if (data.role === 'healer')
          return output.south!();
        if (data.moks === 'D1' || data.moks === 'D2')
          return output.north!();
        if (data.moks === 'D3' || data.moks === 'D4')
          return output.south!();
        return output.bait!();
      },
      outputStrings: {
        bait: {
          en: 'Bait Hot Aerial',
          ja: '(フレイムエアリアル誘導)',
          ko: '(플레임 에이리얼 유도)',
        },
        north: {
          en: 'Bait Hot Aerial North',
          ja: '🄰北でフレイムエアリアル誘導',
          ko: '🄰북쪽으로 불장판 유도',
        },
        south: {
          en: 'Bait Hot Aerial South',
          ja: '🄲南でフレイムエアリアル誘導',
          ko: '🄲남쪽으로 불장판 유도',
        },
      },
    },
    {
      id: 'R10S Deep Aerial Tower',
      type: 'StartsUsing',
      netRegex: { id: 'B5E3', source: 'Deep Blue', capture: false },
      condition: (data) => data.role === 'healer',
      infoText: (_data, _matches, output) => output.getTower!(),
      outputStrings: {
        getTower: {
          en: 'Get Tower',
          ja: '水牢へ',
          ko: '물감옥으로',
        },
      },
    },
    {
      id: 'R10S Xtreme Wave Tethers',
      type: 'HeadMarker',
      netRegex: {
        id: [headMarkers['redTether'], headMarkers['blueTether']],
        capture: true,
      },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        if (matches.id === headMarkers['redTether'])
          return output.redTether!();
        return output.blueTether!();
      },
      outputStrings: {
        redTether: {
          en: 'Red Tether on YOU',
          ja: '自分に🔥線',
          ko: '내게 불🔥 줄',
        },
        blueTether: {
          en: 'Blue Tether on YOU',
          ja: '自分に💧線',
          ko: '내게 물💧 줄',
        },
      },
    },
    {
      id: 'R10S Firesnaking/WaterSnaking',
      type: 'StartsUsing',
      netRegex: { id: 'B381', source: 'Red Hot', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R10S Xtreme Firesnaking/WaterSnaking',
      type: 'StartsUsing',
      netRegex: { id: 'B5AE', source: 'Red Hot', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R10S Flame Floater Split',
      type: 'StartsUsing',
      netRegex: { id: 'B5D4', source: 'Red Hot', capture: false },
      infoText: (_data, _matches, output) => output.outOfMiddle!(),
      outputStrings: {
        outOfMiddle: {
          en: 'E/W Groups, Out of Middle',
          ja: '分断、組み合わせて散会',
          ko: '분단, 맡은 팀으로',
        },
      },
    },
    {
      id: 'R10S Epic Brotherhood',
      type: 'Ability',
      netRegex: { id: 'B57B', source: 'Deep Blue', capture: false },
      run: (data) => data.snakingMine = undefined,
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Reverse Alley-oop/Alley-oop Double-dip': 'Reverse Alley-oop/Double-dip',
        'Awesome Splash/Awesome Slab': 'Awesome Splash/Slab',
        'Blasting Snap/Plunging Snap/Re-entry Blast': 'Blasting/Plunging/Re-entry',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Deep Blue': 'Indigowelle',
        'Red Hot': 'Scharlachflamme',
        'The Xtremes': 'Team Extrem',
        'Watery Grave': 'Wasserkerker',
      },
      'replaceText': {
        'Alley-oop Inferno': 'Flammen-Alley-Oop',
        'Awesome Slab': 'Heftiger Hydroplatscher',
        'Awesome Splash': 'Hydroplatscher',
        'Blasting Snap': 'Flammenruck',
        'Cutback Blaze': 'Flammen-Rückschnitt',
        'Deep Aerial': 'Hydrosprung',
        'Deep Impact': 'Hydroklopper',
        'Deep Varial': 'Hydro-Halbdreher',
        'Divers\' Dare': 'Brodelnder Kampfgeist',
        'Epic Brotherhood': 'Brüderbund',
        '(?<! )Firesnaking': 'Flammen-Schlängeln',
        'Flame Floater': 'Flammenschweber',
        'Freaky Pyrotation': 'Abgefahrener Pyro-Dreher',
        'Hot Aerial': 'Flammensprung',
        'Hot Impact': 'Flammenklopper',
        'Impact Zone': 'Mega-Platzer',
        'Insane Air': 'Wahnsinnsritt',
        'Over the Falls': 'Extremer Wellensog',
        'Plunging Snap': 'Hydroruck',
        '(?<! )Pyrotation': 'Pyrodreher',
        'Scathing Steam': 'Mischexplosion',
        'Sick Swell': 'Fette Welle',
        'Sickest Take-off': 'Fetter Absprung',
        '(?<! )Watersnaking': 'Hydro-Schlängeln',
        'Xtreme Spectacular': 'Ultimatives Extremmanöver',
        'Xtreme Wave': 'Extremwelle',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Deep Blue': 'Deep Blue',
        'Red Hot': 'Red Hot',
        'The Xtremes': 'Les Xtrêmes',
        'Watery Grave': 'prison aquatique',
      },
      'replaceText': {
        'Alley-oop Inferno': 'Alley-oop enflammé',
        'Awesome Slab': 'Éclaboussement hydrique puissant',
        'Awesome Splash': 'Éclaboussement hydrique',
        'Blasting Snap': 'Claquement enflammé',
        'Cutback Blaze': 'Riposte enflammée',
        'Deep Aerial': 'Flot aérien',
        'Deep Impact': 'Impact puissant',
        'Deep Varial': 'Barrière hydrique',
        'Divers\' Dare': 'Esprit combatif',
        'Epic Brotherhood': 'Fraternité',
        '(?<! )Firesnaking': 'Ondulation enflammée',
        'Flame Floater': 'Surfeur enflammé',
        'Freaky Pyrotation': 'Rotation incandescente chaotique',
        'Hot Aerial': 'Flamme aérienne',
        'Hot Impact': 'Impact brûlant',
        'Impact Zone': 'Rupture énorme',
        'Insane Air': 'Figure démentielle',
        'Over the Falls': 'Traversée cataclysmique',
        'Plunging Snap': 'Claquement hydrique',
        '(?<! )Pyrotation': 'Rotation incandescente',
        'Scathing Steam': 'Explosion mélangée',
        'Sick Swell': 'Vague déchaînée',
        'Sickest Take-off': 'Ascension déchaînée',
        '(?<! )Watersnaking': 'Ondulation hydrique',
        'Xtreme Spectacular': 'Spectacle Xtrême',
        'Xtreme Wave': 'Vague Xtrême',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Deep Blue': 'ディープブルー',
        'Red Hot': 'レッドホット',
        'The Xtremes': 'エクストリームズ',
        'Watery Grave': '水牢',
      },
      'replaceText': {
        'Alley-oop Inferno': 'フレイムアリウープ',
        'Awesome Slab': 'ヘビー・ハイドロスプラッシュ',
        'Awesome Splash': 'ハイドロスプラッシュ',
        'Blasting Snap': 'フレイムスナップ',
        'Cutback Blaze': 'フレイムカットバック',
        'Deep Aerial': 'ハイドロエアリアル',
        'Deep Impact': 'ディープインパクト',
        'Deep Varial': 'ハイドロバリエル',
        'Divers\' Dare': 'ファイティングスピリット',
        'Epic Brotherhood': 'ブラザーフッド',
        '(?<! )Firesnaking': 'フレイムスネーキング',
        'Flame Floater': 'フレイムフローター',
        'Freaky Pyrotation': 'フリーキー・パイロローテーション',
        'Hot Aerial': 'フレイムエアリアル',
        'Hot Impact': 'ホットインパクト',
        'Impact Zone': '大破裂',
        'Insane Air': 'インセインエアー',
        'Over the Falls': 'オーバー・ザ・フォール',
        'Plunging Snap': 'ハイドロスナップ',
        '(?<! )Pyrotation': 'パイロローテーション',
        'Scathing Steam': 'ミックスエクスプロージョン',
        'Sick Swell': 'シック・スウェル',
        'Sickest Take-off': 'シック・テイクオフ',
        '(?<! )Watersnaking': 'ハイドロスネーキング',
        'Xtreme Spectacular': 'エクストリーム・スペクタクル',
        'Xtreme Wave': 'エクストリームウェーブ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Deep Blue': '深蓝',
        'Red Hot': '炽红',
        'The Xtremes': '极限兄弟',
        'Watery Grave': '水牢',
      },
      'replaceText': {
        '--add-targetable--': '--小怪可选中--',
        '--add-untargetable--': '--小怪不可选中--',
        '--blue east/west--': '--深蓝 东/西--',
        '--blue targetable--': '--深蓝可选中--',
        '--blue untargetable--': '--深蓝不可选中--',
        '--hot jump--': '--炽红 跳--',
        '--intercardinal--': '--四边中点--',
        '--red north--': '--炽红 北--',
        '\\(bait\\)': '(引导)',
        '\\(big\\)': '(大)',
        '\\(cone\\)': '(扇形)',
        '\\(damage': '(伤害',
        '\\(enrage\\)': '(狂暴)',
        '\\(line\\)': '(直线)',
        'stun\\)': '眩晕)',
        '\\(tower\\)': '(塔)',
        'Alley-oop Double-dip': '双重旋水',
        'Alley-oop Inferno': '空中旋火',
        'Awesome Slab': '浪涛翻涌',
        'Awesome Splash': '浪花飞溅',
        'Bailout': '救生',
        'Blasting Snap': '火浪急转',
        'Cutback Blaze': '火浪回切',
        'Deep Aerial': '腾水踏浪',
        'Deep Impact': '深海冲击',
        'Deep Varial': '浪尖转体',
        'Divers\' Dare': '斗志昂扬',
        'Epic Brotherhood': '兄弟同心',
        '(?<! )Firesnaking': '火蛇夺浪',
        'Flame Floater': '浪顶炽火',
        'Freaky Pyrotation': '异常旋绕巨火',
        'Hot Aerial': '腾火踏浪',
        'Hot Impact': '炽焰冲击',
        'Impact Zone': '浪崩',
        'Insane Air': '狂浪腾空',
        'Over the Falls': '无归浪卷',
        'Plunging Snap': '水浪急转',
        '(?<! )Pyrotation': '旋绕巨火',
        'Re-entry Blast': '炽红返场',
        'Reverse Alley-oop': '交错旋水',
        'Scathing Steam': '混合爆破',
        'Sick Swell': '惊涛骇浪',
        'Sickest Take-off': '破势乘浪',
        '(?<! )Watersnaking': '水蛇夺浪',
        'Xtreme Firesnaking': '极限火蛇夺浪',
        'Xtreme Spectacular': '极限炫技',
        'Xtreme Watersnaking': '极限水蛇夺浪',
        'Xtreme Wave': '极限浪波',
      },
    },
    {
      'locale': 'ko',
      'missingTranslations': true,
      'replaceSync': {
        'Deep Blue': '딥 블루',
        'Red Hot': '레드 핫',
        'The Xtremes': '익스트림즈',
        'Watery Grave': '수중 감옥',
      },
      'replaceText': {
        '--add-targetable--': '--쫄 타겟가능--',
        '--add-untargetable--': '--쫄 타겟불가--',
        '--blue east/west--': '--블루 동/서--',
        '--blue targetable--': '--블루 타겟가능--',
        '--blue untargetable--': '--블루 타겟불가능--',
        '--hot jump--': '--레드 점프--',
        '--intercardinal--': '--대각선--',
        '--red north--': '--레드 북쪽--',
        '\\(bait\\)': '(유도)',
        '\\(big\\)': '(강력)',
        '\\(cone\\)': '(부채꼴)',
        '\\(damage': '(피해',
        '\\(enrage\\)': '(전멸기)',
        '\\(line\\)': '(직선)',
        'stun\\)': '기절)',
        '\\(tower\\)': '(탑)',
        // 'Alley-oop Double-dip': 'Alley-oop Double-dip',
        'Alley-oop Inferno': '불꽃 뛰어돌기',
        'Awesome Slab': '물결 뒤덮기',
        'Awesome Splash': '물결 덮기',
        // 'Bailout': 'Bailout',
        'Blasting Snap': '불꽃 급선회',
        'Cutback Blaze': '불꽃 되돌기',
        'Deep Aerial': '물결 공중회전',
        'Deep Impact': '딥 임팩트',
        'Deep Varial': '물결 보드 꺾기',
        'Divers\' Dare': '끓어오르는 투지',
        'Epic Brotherhood': '형제애',
        '(?<! )Firesnaking': '불꽃 선점',
        'Flame Floater': '불꽃 올라타기',
        'Freaky Pyrotation': '기묘한 화염 회전',
        'Hot Aerial': '불꽃 공중회전',
        'Hot Impact': '핫 임팩트',
        'Impact Zone': '대파열',
        'Insane Air': '광란의 공중 기술',
        'Over the Falls': '집어삼키는 파도',
        'Plunging Snap': '물결 급선회',
        '(?<! )Pyrotation': '화염 회전',
        // 'Re-entry Blast': 'Re-entry Blast',
        // 'Reverse Alley-oop': 'Reverse Alley-oop',
        'Scathing Steam': '물불 작렬',
        'Sick Swell': '끝내주는 파도',
        'Sickest Take-off': '끝내주는 파도오름',
        '(?<! )Watersnaking': '물결 선점',
        // 'Xtreme Firesnaking': 'Xtreme Firesnaking',
        'Xtreme Spectacular': '익스트림 스펙터클',
        // 'Xtreme Watersnaking': 'Xtreme Watersnaking',
        'Xtreme Wave': '익스트림 웨이브',
      },
    },
  ],
};

export default triggerSet;
