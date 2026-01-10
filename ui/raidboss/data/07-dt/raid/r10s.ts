import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type SnakingFlagsType = {
  [flags: string]: {
    elem: 'water' | 'fire';
    mech: 'protean' | 'stack' | 'buster';
  };
};

export interface Data extends RaidbossData {
  dares: number;
  snakings: SnakingFlagsType[string][];
  snakingCount: number;
  snakingMine?: 'water' | 'fire';
}

const center = {
  x: 100,
  y: 100,
};
console.assert(center);

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
  timelineFile: 'r10s.txt',
  initData: () => ({
    actorPositions: {},
    dares: 0,
    snakings: [],
    snakingCount: 0,
  }),
  triggers: [
    {
      id: 'R10S Hot Impact Buster',
      type: 'HeadMarker',
      netRegex: { id: headMarkers['hotImpact'], capture: true },
      durationSeconds: 5,
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R10S Floater Tethers',
      type: 'GainsEffect',
      netRegex: { effectId: Object.keys(floaterTetherMap), capture: true },
      condition: (data, matches) => matches.target === data.me,
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
      id: 'R10S Escape from Fire',
      // Fire Resistance Down II
      type: 'GainsEffect',
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
          ja: '火の床誘導',
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
          en: 'AOE + Move Away',
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
          ja: '水は頭割り',
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
          healer: {
            en: 'Care for buster bait',
            ja: 'タン强に注意',
            ko: '탱크 돌진 버스터 주의',
          },
          dps: {
            en: 'Buster on tank',
            ja: 'タン强に注意',
            ko: '탱크 돌진 버스터 피해요',
          },
        };
        if (data.role === 'tank') {
          // 색깔 있을 때는 파란 탱크에게만
          if (data.snakingMine === undefined || data.snakingMine === 'water')
            return { alertText: output.tank!() };
        }
        if (data.role === 'healer')
          return { infoText: output.healer!() };
        return { infoText: output.dps!() };
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
      infoText: (data, _matches, output) => {
        const [snaking1, snaking2] = data.snakings;
        if (snaking1 === undefined || snaking2 === undefined)
          return;

        if (data.snakingCount < 5) {
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
            return output.both!({
              elem1: output[water.elem]!(),
              mech1: output[water.mech]!(),
              elem2: output[fire.elem]!(),
              mech2: output[fire.mech]!(),
            });
          }
          return output.combo!({
            elem: output[my.elem]!(),
            mech: output[my.mech]!(),
          });
        }

        const role = (snaking1.mech === 'buster')
          ? output.tank!()
          : (data.snakingCount === 5)
          ? output.healer!()
          : (data.snakingCount === 6)
          ? output.melee!()
          : output.ranged!();
        return output.swap!({ mech: output[snaking1.mech]!(), role: role });
      },
      run: (data) => {
        if (data.snakings.length > 1)
          data.snakings = [];
      },
      outputStrings: {
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
        swap: {
          en: '${mech} (${role} swap)',
          ja: '${mech}（${role}交代）',
          ko: '${mech} (${role} 교대)',
        },
        water: {
          en: 'Water',
          ja: '水',
          ko: '💧',
        },
        fire: {
          en: 'Fire',
          ja: '火',
          ko: '🔥',
        },
        protean: Outputs.spread,
        stack: Outputs.stackMarker,
        buster: Outputs.tankBuster,
        tank: Outputs.tank,
        healer: Outputs.healer,
        melee: Outputs.melee,
        ranged: Outputs.ranged,
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
          en: 'You have Water Snaking',
          ja: '自分に水のスネーク',
          ko: '내게 물💧',
        },
        fire: {
          en: 'You have Fire Snaking',
          ja: '自分に火のスネーク',
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
          ja: '${dir} + 水は${mech} + 火は散開',
          ko: '${dir} + ${mech} + 🔥흩어져요',
        },
        water: {
          en: '${dir} + Water ${mech}',
          ja: '${dir} + 水は${mech}',
          ko: '${dir} + 💧${mech}',
        },
        fire: {
          en: '${dir} + Fire Spread',
          ja: '${dir} + 火は散開',
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
          ja: 'フレイムエアリアル誘導',
          ko: '(플레임 에이리얼 유도)',
        },
        north: {
          en: 'Bait Hot Aerial North',
          ja: '🡹北でフレイムエアリアル誘導',
          ko: '🄰북쪽으로 불장판 유도',
        },
        south: {
          en: 'Bait Hot Aerial South',
          ja: '🡻南でフレイムエアリアル誘導',
          ko: '🄲남쪽으로 불장판 유도',
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
          ja: '自分に赤い線🔥',
          ko: '내게 불🔥 줄',
        },
        blueTether: {
          en: 'Blue Tether on YOU',
          ja: '自分に青い線💧',
          ko: '내게 물💧 줄',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Reverse Alley-oop/Alley-oop Double-dip': 'Reverse Alley-oop/Double-dip',
        'Awesome Splash/Awesome Slab': 'Awesome Splash/Slab',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Red Hot': 'レッドホット',
        'Deep Blue': 'ディープブルー',
      },
      'replaceText': {
        'Reverse Alley-oop/Alley-oop Double-dip': 'リバース/ダブルディップ',
        'Awesome Splash/Awesome Slab': 'スプラッシュ/スラブ',
      },
    },
  ],
};

export default triggerSet;
