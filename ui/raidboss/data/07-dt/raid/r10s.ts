import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutputCardinal, Directions } from '../../../../../resources/util';
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
  floaterTethers: number;
  sickDir: DirectionOutputCardinal;
}

const center = {
  x: 100,
  y: 100,
};
console.assert(center);

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
    floaterTethers: 0,
    sickDir: 'unknown',
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
      id: 'R10S Hot Impact Buster',
      type: 'HeadMarker',
      netRegex: { id: headMarkers['hotImpact'], capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R10S Floater Tether Count',
      type: 'Tether',
      netRegex: { id: '017A', capture: true },
      infoText: (data, matches, output) => {
        data.floaterTethers++;
        if (data.me === matches.target)
          return output.onMe!({ num: data.floaterTethers });
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
      infoText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: {
          en: 'Spread + AOE',
          ja: '個人AOE + 散開',
          ko: '발밑 장판 + 흩어져요',
        },
      },
    },
    {
      id: 'R10S Cutback Blaze',
      type: 'StartsUsing',
      netRegex: { id: 'B5C9', source: 'Red Hot', capture: false },
      infoText: (_data, _matches, output) => output.stack!(),
      outputStrings: {
        stack: {
          en: 'Stack => Opposite',
          ja: '全員で集合 🔜 反対側の安置へ',
          ko: '모두 모였다 🔜 반대쪽 안치로',
        },
      },
    },
    {
      id: 'R10S Pyrotation',
      type: 'StartsUsing',
      netRegex: { id: 'B5C2', source: 'Red Hot', capture: false },
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.move!(),
      outputStrings: {
        move: {
          en: 'AOE + Move Away',
          ja: 'みんなでAOE誘導',
          ko: '발밑 장판 유도 x3',
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
      run: (data, matches) => {
        const actor = data.actorPositions[matches.targetId];
        if (actor === undefined)
          return;
        data.sickDir = Directions.xyToCardinalDirOutput(actor.x, actor.y, center.x, center.y);
      },
    },
    {
      // 이 로그가 맞는데 어떻게 해야할지 모르겠네. 자료가 모자름
      // StatusAdd 1A:808:Unknown_808:9999.00:E0000000::40004BD5:ディープブルー:3ED:59491502:
      id: 'R10S Sickest Take-off',
      type: 'StartsUsing',
      netRegex: { id: ['B592', 'B593', 'B5CD', 'B5CE'], source: 'Deep Blue', capture: false },
      infoText: (data, _matches, output) => {
        if (data.sickDir === 'unknown')
          return;
        return output.text!({ dir: output[data.sickDir]!() });
      },
      run: (data) => data.sickDir = 'unknown',
      outputStrings: {
        ...Directions.outputStringsCardinalDir,
        text: {
          en: 'Go ${dir}',
          ja: '${dir}ノックバック',
          ko: '${dir}넉백',
        },
      },
    },
    // Reverse/Double-dip Alley-oop 은 명령을 알 수 없음
    {
      id: 'R10S Deep Impact',
      type: 'StartsUsing',
      netRegex: { id: 'B5B7', source: 'Deep Blue', capture: false },
      condition: (data) => data.role === 'tank' || data.role === 'healer',
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tank: {
            en: 'Bait tank buster far away',
            ja: 'STは遠くでタン强誘導',
            ko: 'ST가 멀리 가서 넉백 버스터 유도',
          },
          healer: {
            en: 'Care for buster bait',
            ja: 'タン强に注意',
            ko: '탱크 버스터 주의',
          },
          dps: {
            en: 'Buster on tank',
            ja: 'タン强に注意',
            ko: '탱크 버스터 피해요',
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
          ko: '남쪽으로! 큰 연쇄 전체 공격',
        },
      },
    },
    {
      // 아이디가 뭔지 알아야 구분을 할텐데...
      id: 'R10S Insane Air',
      type: 'StartsUsing',
      netRegex: {
        id: ['B893', 'B894', 'B895', 'B896', 'B897', 'B898', 'B899', 'B89A'],
        source: 'Deep Blue',
        capture: false,
      },
      suppressSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Down: cone / Up: tank buster',
          ja: '🡸頭割り / 🡻4人扇 / 🡹タン强',
          ko: '🡸뭉쳐요 / 🡻네명 꼬깔 / 🡹탱크버스터',
        },
      },
    },
    {
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

        return output.text!({
          elem1: output[snaking1.elem]!(),
          mech1: output[snaking1.mech]!(),
          elem2: output[snaking2.elem]!(),
          mech2: output[snaking2.mech]!(),
        });
      },
      run: (data) => {
        if (data.snakings.length > 1)
          data.snakings = [];
      },
      outputStrings: {
        text: {
          en: '${elem1}: ${mech1}/${elem2}: ${mech2}',
          ja: '${elem1}-${mech1} / ${elem2}-${mech2}',
          ko: '${elem1} ${mech1} / ${elem2} ${mech2}',
        },
        water: {
          en: 'Water',
          ja: '水',
          ko: '물💧',
        },
        fire: {
          en: 'Fire',
          ja: '火',
          ko: '불🔥',
        },
        protean: Outputs.spread,
        stack: Outputs.stackMarker,
        buster: Outputs.tankBuster,
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
