import Autumn, { AutumnDir } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
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
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  snakings: SnakingFlagsType[string][];
  mySnake: 'water' | 'fire' | 'unknown';
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
  // 'tankbusterBlue': '0158',
  // 'waterSnakingIndicatorSecond': '027B',
  // 'fireSnakingIndicatorSecond': '027C',
  // 'waterSnakingLateCone': '028B',
  // 'partyStackFire': '0293',
  // 'spreadFirePuddleRed': '0294',
  // 'waterSnakingIndicatorFirst': '0295',
  // 'fireSnakingIndicatorFirst': '0296',
  // 'spreadConeCutbackBlaze': '0298',
  // 'fireSnakingLateCone': '0299',
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM2Savage',
  zoneId: ZoneId.AacHeavyweightM2Savage,
  timelineFile: 'r10s.txt',
  initData: () => ({
    actorPositions: {},
    snakings: [],
    mySnake: 'unknown',
  }),
  triggers: [
    {
      id: 'R10S ActorSetPos Tracker',
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
      id: 'R10S AddedCombatant Tracker',
      type: 'AddedCombatant',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R10S Epic Brotherhood',
      type: 'Ability',
      // 딥블루는 B57B
      netRegex: { id: 'B57A', source: 'Red Hot', capture: false },
      run: (data) => {
        data.mySnake = 'unknown';
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
      id: 'R10S Floater Tethers',
      type: 'GainsEffect',
      netRegex: { effectId: Object.keys(floaterTetherMap), capture: true },
      condition: (data, matches) => matches.target === data.me,
      alertText: (_data, matches, output) => {
        const index = floaterTetherMap[matches.effectId];
        if (index === undefined)
          return;
        return output.onMe!({ num: index });
      },
      outputStrings: {
        onMe: {
          en: 'Tether on YOU (${num})',
          ja: '自分に線 #${num}',
          ko: '내게 줄 #${num}',
        },
      },
    },
    {
      id: 'R10S Alley-oop Inferno',
      type: 'StartsUsing',
      netRegex: { id: 'B5C0', source: 'Red Hot', capture: false },
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        if (data.mySnake !== 'unknown') {
          if (data.mySnake === 'fire')
            return output.fire!();
          return;
        }
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
      durationSeconds: 4.5,
      alertText: (data, matches, output) => {
        if (data.mySnake !== 'unknown') {
          if (data.mySnake === 'water')
            return output.water!();
          return;
        }
        if (matches.id === 'B5DD')
          return output.move!();
        return output.stay!();
      },
      outputStrings: {
        water: {
          en: 'Go center',
          ja: '中央へ',
          ko: '꼬깔 피해 한가운데로',
        },
        move: {
          en: 'Move',
          ja: '横に移動',
          ko: '옆으로 이동',
        },
        stay: {
          en: 'Stay',
          ja: 'そのまま待機',
          ko: '그 자리에 그대로',
        },
      },
    },
    {
      id: 'R10S Cutback Blaze',
      type: 'StartsUsing',
      netRegex: { id: 'B5C9', source: 'Red Hot', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.stack!(),
      outputStrings: {
        stack: {
          en: 'Stack => Opposite',
          ja: '全員で集合 🔜 反対側の安置へ',
          ko: '모두 모였다 🔜 반대쪽 안전한 곳으로',
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
      id: 'R10S Divers\' Dare',
      type: 'StartsUsing',
      netRegex: { id: ['B5B8', 'B5B9'], capture: false },
      suppressSeconds: 1,
      response: Responses.aoe(),
    },
    {
      id: 'R10S Sick Swell',
      type: 'Tether',
      netRegex: { id: '0174', source: 'Deep Blue', capture: true },
      delaySeconds: 0.1,
      durationSeconds: 5,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.targetId];
        if (actor === undefined)
          return;
        const dir = Directions.xyToCardinalDirOutput(actor.x, actor.y, center.x, center.y);
        if (dir === 'unknown')
          return;
        return output.text!({ dir: output[dir]!() });
      },
      outputStrings: {
        ...AutumnDir.stringsAimPlus,
        text: {
          en: 'Go ${dir}',
          ja: 'ノックバック: ${dir}',
          ko: '넉백: ${dir}쪽',
        },
      },
    },
    {
      id: 'R10S Sickest Take-off',
      type: 'StartsUsing',
      netRegex: { id: ['B592', 'B5CD'], source: 'Deep Blue', capture: true },
      durationSeconds: 5,
      alertText: (_data, matches, output) => {
        if (matches.id === 'B5CD')
          return output.stack!();
        return output.spread!();
      },
      outputStrings: {
        stack: Outputs.healerGroups,
        spread: Outputs.spread,
      },
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
            ja: 'MTは遠くでタン强誘導',
            ko: 'MT가 멀리 가서 넉백 버스터 유도',
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
        if (data.role === 'tank')
          return { alertText: output.tank!() };
        if (data.role === 'healer')
          return { infoText: output.healer!() };
        return { infoText: output.dps!() };
      },
    },
    {
      id: 'R10S Xtreme Spectacular',
      type: 'StartsUsing',
      netRegex: { id: 'B5D9', source: 'Red Hot', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.aoe!(),
      outputStrings: {
        aoe: {
          en: 'Large AOE',
          ja: '南へ！大きな連続全体攻撃',
          ko: '남쪽으로! 큰 연속 전체 공격',
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

        data.snakings.push(snaking);
      },
      infoText: (data, _matches, output) => {
        const [snaking1, snaking2] = data.snakings;
        if (snaking1 === undefined || snaking2 === undefined)
          return;

        const [water, fire] = snaking1.elem === 'water'
          ? [snaking1, snaking2]
          : [snaking2, snaking1];

        let my = undefined;
        if (data.mySnake === 'unknown') {
          // insane air 일 경우
          const team = Autumn.getTeam(data.moks);
          my = team === 'MT' ? water : fire;
        } else {
          // snaking 일 경우
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
      },
    },
    {
      id: 'R10S Snaking Gain',
      type: 'GainsEffect',
      netRegex: { effectId: ['136E', '136F'], capture: true },
      condition: (data, matches) => matches.target === data.me,
      infoText: (data, matches, output) => {
        if (matches.effectId === '136E') {
          data.mySnake = 'fire';
          return output.fire!();
        }
        data.mySnake = 'water';
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
      id: 'R10S Deep Varial',
      type: 'StartsUsing',
      netRegex: { id: 'B891', source: 'Deep Blue', capture: false },
      condition: (data) => data.mySnake === 'water',
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.water!(),
      outputStrings: {
        water: {
          en: 'Stack',
          ja: '水は頭割り',
          ko: '💧뭉쳐요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'replaceSync': {
        'Red Hot': 'レッドホット',
        'Deep Blue': 'ディープブルー',
      },
    },
  ],
};

export default triggerSet;
