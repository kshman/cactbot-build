import { AutumnDirections } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type News = 'north' | 'east' | 'south' | 'west' | 'unknown';
type AbsType = { id: string; prior: number; type: boolean };

const snapTwistIds: { [id: string]: [number, News] } = {
  'A728': [2, 'west'],
  'A729': [2, 'west'],
  'A72A': [2, 'west'],
  'A72B': [2, 'east'],
  'A72C': [2, 'east'],
  'A72D': [2, 'east'],
  'A730': [3, 'west'],
  'A731': [3, 'west'],
  'A732': [3, 'west'],
  'A4DE': [3, 'west'],
  'A733': [3, 'east'],
  'A734': [3, 'east'],
  'A735': [3, 'east'],
  'A4DD': [3, 'east'],
  'A739': [4, 'west'],
  'A73A': [4, 'west'],
  'A73B': [4, 'west'],
  'A73C': [4, 'east'],
  'A73D': [4, 'east'],
  'A73E': [4, 'east'],
};

export interface Data extends RaidbossData {
  side?: 'role' | 'light';
  infernal: number;
  cone: 'card' | 'inter' | 'unknown';
  frogs: News[];
  collect: string[];
  abs: AbsType[];
  order?: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM1Savage',
  zoneId: ZoneId.AacCruiserweightM1Savage,
  timelineFile: 'r5s.txt',
  initData: () => ({
    infernal: 0,
    cone: 'unknown',
    frogs: [],
    collect: [],
    abs: [],
  }),
  triggers: [
    {
      id: 'R5S Deep Cut',
      type: 'HeadMarker',
      netRegex: { id: '01D7' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleaveOnYou: Outputs.tankCleaveOnYou,
          avoidCleave: Outputs.avoidTankCleave,
        };
        data.collect.push(matches.target);
        if (data.collect.length < 2)
          return;
        if (data.collect.includes(data.me))
          return { alertText: output.cleaveOnYou!() };
        return { infoText: output.avoidCleave!() };
      },
      run: (data) => {
        if (data.collect.length >= 2)
          data.collect = [];
      },
    },
    {
      id: 'R5S Flip to Side',
      type: 'StartsUsing',
      // A780 A: 롤 산개
      // A781 B: 4:4
      netRegex: { id: ['A780', 'A781'], source: 'Dancing Green' },
      run: (data, matches) => data.side = matches.id === 'A780' ? 'role' : 'light',
    },
    {
      id: 'R5S Snap Needle',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(snapTwistIds), source: 'Dancing Green' },
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        const snap = snapTwistIds[matches.id];
        if (snap === undefined)
          return;
        const cnt = snap[0];
        const dir = output[snap[1]]!();
        const act = output[data.side ?? 'unknown']!();
        return output.text!({ dir: dir, cnt: cnt, act: act });
      },
      run: (data) => delete data.side,
      outputStrings: {
        text: {
          en: '${dir} x${cnt} => ${act}',
          ko: '${dir} ${cnt}번 🔜 ${act}',
        },
        east: Outputs.east,
        west: Outputs.west,
        role: Outputs.rolePositions,
        light: Outputs.healerGroups,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Celebrate Good Times',
      type: 'StartsUsing',
      netRegex: { id: 'A723', source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'R5S Disco Infernal',
      type: 'StartsUsing',
      netRegex: { id: 'A756', source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
      run: (data) => data.infernal++,
    },
    {
      id: 'R5S Burn Baby Burn 1',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 1 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      countdownSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to spotlight',
          ko: '조명 밟아요',
        },
      },
    },
    {
      id: 'R5S Burn Baby Burn 2-1',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 2 && data.me === matches.target,
      durationSeconds: 9,
      alertText: (data, matches, output) => {
        if (parseFloat(matches.duration) < 14)
          return output.spot!();
        return output.bait!({ dir: output[data.cone]!() });
      },
      outputStrings: {
        spot: {
          en: 'Go to spotlight',
          ko: '조명 밟아요',
        },
        bait: {
          en: 'Bait Frog: ${dir}',
          ko: '${dir} 개구리 유도',
        },
        card: Outputs.cardinals,
        inter: Outputs.intercards,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Burn Baby Burn 2-2',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 2 && data.me === matches.target,
      delaySeconds: 11,
      durationSeconds: 8,
      alertText: (data, matches, output) => {
        if (parseFloat(matches.duration) < 14) {
          const s = data.cone === 'card' ? 'inter' : data.cone === 'inter' ? 'card' : 'unknown';
          return output.bait!({ dir: output[s]!() });
        }
        return output.spot!();
      },
      outputStrings: {
        spot: {
          en: 'Go to spotlight',
          ko: '조명 밟아요',
        },
        bait: {
          en: 'Bait Frog: ${dir}',
          ko: '${dir} 개구리 유도',
        },
        card: Outputs.cardinals,
        inter: Outputs.intercards,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Inside Out',
      type: 'StartsUsing',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      durationSeconds: 4.9,
      countdownSeconds: 4.9,
      response: Responses.getOutThenIn(),
    },
    {
      id: 'R5S Inside Get Out',
      type: 'Ability',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      response: Responses.getIn('info'),
    },
    {
      id: 'R5S Outside In',
      type: 'StartsUsing',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      durationSeconds: 4.9,
      countdownSeconds: 4.9,
      response: Responses.getInThenOut(),
    },
    {
      id: 'R5S Outside Get In',
      type: 'Ability',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      response: Responses.getOut('info'),
    },
    {
      id: 'R5S Arcady Night Fever', // Arcady Night Encore
      type: 'StartsUsing',
      netRegex: { id: ['A760', 'A370'], source: 'Dancing Green', capture: false },
      // A765 -> A765, A764 안팎일걸로 추정
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.frogs = [],
      outputStrings: {
        text: {
          en: 'Night Fever',
          ko: '연속 안팎 + 부채꼴',
        },
      },
    },
    {
      id: 'R5S Frog Collect',
      type: 'ActorControlExtra',
      // [00:18:16.002] 273 111:40012007:003F:5:0:0:0
      netRegex: { id: '40[0-9A-F]{6}', category: '003F' },
      run: (data, matches) => {
        const dances: { [id: string]: News } = {
          '5': 'west',
          '7': 'east',
          '1F': 'north',
          '20': 'south',
        };
        const dir = dances[matches.param1];
        if (dir === undefined)
          return;
        data.frogs.push(dir);
      },
    },
    {
      id: 'R5S Alpha Beta',
      type: 'GainsEffect',
      netRegex: { effectId: ['116E', '116F'] },
      run: (data, matches) => {
        const dur = parseFloat(matches.duration);
        const type = matches.effectId === '116E';
        data.abs.push({ id: matches.target, prior: dur, type: type });
      },
    },
    {
      id: 'R5S My Alpha Beta',
      type: 'GainsEffect',
      netRegex: { effectId: ['116E', '116F'] },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      countdownSeconds: 4,
      alarmText: (data, _matches, output) => output.text!({ order: data.order }),
      outputStrings: {
        text: {
          en: 'Get together (${order})',
          ko: '문대요! (${order}번째)',
        },
      },
    },
    {
      id: 'R5S Let\'s Dance!', // Let's Dance Remix
      type: 'StartsUsing',
      netRegex: { id: ['A76A', 'A390'], source: 'Dancing Green', capture: false },
      delaySeconds: 2,
      durationSeconds: 4,
      infoText: (data, _matches, output) => {
        const curr = data.frogs[0];
        if (curr === undefined) // 이게 없을리가 있나
          return;

        data.order = undefined;
        let target = undefined;
        const my = data.abs.find((x) => x.id === data.me);
        if (my !== undefined) {
          const sorted = data.abs.sort((x, y) => x.prior - y.prior);
          const abm = sorted.filter((x) => x.type === my.type);
          const abo = sorted.filter((x) => x.type !== my.type);
          data.order = abm.findIndex((x) => x.id === data.me);
          target = data.party.member(abo[data.order]?.id);
          data.order++;
        }

        if (data.order !== undefined) {
          if (target === undefined)
            target = output.unknown!();
          return output.combo!({ dir: output[curr]!(), order: data.order, target: target });
        }
        return output.text!({ dir: output[curr]!() });
      },
      run: (data) => data.abs = [],
      outputStrings: {
        text: {
          en: '${dir}',
          ko: '${dir}으로',
        },
        combo: {
          en: '${dir} (${order} w/${target}',
          ko: '${dir}으로 (${order}번째, ${target})',
        },
        east: Outputs.east,
        west: Outputs.west,
        north: Outputs.north,
        south: Outputs.south,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Frog Dance',
      type: 'Ability',
      netRegex: { id: ['9BE2', '9BE3', 'A36[C-F]'], capture: false },
      durationSeconds: 2,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: '${dir}',
            ko: '${dir}으로',
          },
          east: Outputs.east,
          west: Outputs.west,
          north: Outputs.north,
          south: Outputs.south,
          stay: Outputs.stay,
        };
        const prev = data.frogs.shift();
        const curr = data.frogs[0];
        if (curr === undefined)
          return;
        if (prev === curr)
          return { infoText: output.stay!() };
        return { alertText: output.text!({ dir: output[curr]!() }) };
      },
    },
    {
      id: 'R5S Let\'s Pose!',
      type: 'StartsUsing',
      netRegex: { id: ['A76F', 'A770'], source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'R5S Ride The Waves',
      type: 'StartsUsing',
      netRegex: { id: 'A754', source: 'Dancing Green', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Wave + Spread',
          ko: '비트 + 흩어져요',
        },
      },
    },
    {
      id: 'R5S Beats',
      type: 'StartsUsing',
      netRegex: { id: ['A75B', 'A75D'], source: 'Dancing Green' },
      infoText: (_data, matches, output) => matches.id === 'A75B' ? output.b4!() : output.b8!(),
      outputStrings: {
        b4: Outputs.stackPartner,
        b8: Outputs.protean,
      },
    },
    {
      id: 'R5S Frogtourage',
      type: 'StartsUsing',
      netRegex: { id: 'A75F', source: 'Dancing Green', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Frog dancers',
          ko: '개구리 춤꾼',
        },
      },
    },
    {
      id: 'R5S Frog Burn',
      type: 'ActorSetPos',
      netRegex: { id: '40[0-9A-F]{6}', capture: true },
      condition: (data) => data.infernal > 1,
      suppressSeconds: 20,
      run: (data, matches) => {
        const dir = AutumnDirections.hdgConv8(matches.heading);
        const cardinal = [0, 2, 4, 8];
        data.cone = cardinal.includes(dir) ? 'inter' : 'card';
      },
    },
    {
      id: 'R5S Do the Hustle',
      type: 'StartsUsing',
      netRegex: { id: ['A724', 'A725'], source: 'Dancing Green', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to safe zone',
          ko: '보스 춤사위 확인해요!',
        },
      },
    },
    // Moonburn 어캄
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Dancing Green': 'ダンシング・グリーン',
      },
    },
  ],
};

export default triggerSet;
