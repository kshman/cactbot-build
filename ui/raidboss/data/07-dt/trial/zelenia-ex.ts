import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const phases = {
  A8B5: 'add', // Blessed Barricade
  A8B9: '1st', // Roseblood Bloom
  AA14: '2nd', // Roseblood: 2nd Bloom
  AA15: '3rd', // Roseblood: 3rd Bloom
  AA16: '4th', // Roseblood: 4th Bloom
  AA17: '5th', // Roseblood: 5th Bloom
  AA18: '6th', // Roseblood: 6th Bloom
} as const;

type Phase = (typeof phases)[keyof typeof phases] | 'door' | 'shade' | 'unknown';
type NearFar = 'near' | 'far';
type InOut = 'in' | 'out';

const fallOutputs = {
  mesg: {
    en: '${ind} (${res})',
    ja: '${ind} (${res})',
    ko: '${ind} ${res}',
  },
  stack: Outputs.stackMarker,
  inside: Outputs.in,
  outside: Outputs.out,
  stay: Outputs.stay,
  in: {
    en: 'In',
    ja: '内',
    ko: '🡹',
  },
  out: {
    en: 'Out',
    ja: '外',
    ko: '🡻',
  },
  split: {
    en: '/',
    ja: '/',
    ko: '',
  },
} as const;

export interface Data extends RaidbossData {
  phase: Phase;
  falls: NearFar[];
  fallRes: InOut[];
  fallPrev?: InOut;
  donut?: string;
}

// RECOLLECTION (EXTREME)
const triggerSet: TriggerSet<Data> = {
  id: 'RecollectionExtreme',
  zoneId: ZoneId.RecollectionExtreme,
  timelineFile: 'zelenia-ex.txt',
  initData: () => {
    return {
      phase: 'door',
      falls: [],
      fallRes: [],
    };
  },
  triggers: [
    {
      id: 'ZeleniaEx Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Zelenia' },
      suppressSeconds: 1,
      run: (data, matches) => data.phase = phases[matches.id as keyof typeof phases] ?? 'unknown',
    },
    {
      id: 'ZeleniaEx Thorned Catharsis',
      type: 'StartsUsing',
      netRegex: { id: 'A89E', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'ZeleniaEx Shock',
      type: 'StartsUsing',
      netRegex: { id: 'A8A1', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      response: Responses.protean(),
    },
    {
      id: 'ZeleniaEx My Shock',
      type: 'HeadMarker',
      netRegex: { id: ['0244', '0245'] },
      condition: (data, matches) => data.phase === 'door' && data.me === matches.target,
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '0244')
          return output.donut!();
        return output.circle!();
      },
      outputStrings: {
        donut: {
          en: 'Get towers',
          ja: '塔踏み',
          ko: '도넛, 타워로',
        },
        circle: {
          en: 'Spread',
          ja: '散会',
          ko: '동글이, 흩어져요',
        },
      },
    },
    {
      id: 'ZeleniaEx Specter of the Lost',
      type: 'StartsUsing',
      netRegex: { id: 'A89F', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      response: Responses.tetherBuster(),
    },
    {
      id: 'ZeleniaEx Escelons\' Fall',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: ['2F6', '2F7'] },
      preRun: (data, matches) => data.falls.push(matches.count === '2F6' ? 'near' : 'far'),
      durationSeconds: 7.5,
      suppressSeconds: (data) => data.falls.length > 1 ? 20 : 0,
      infoText: (data, _matches, output) => {
        const [bait1, bait2] = data.falls;
        if (bait1 === undefined || bait2 === undefined)
          return;

        data.falls = [];
        data.fallRes = [];

        let move;
        if (data.phase !== 'shade')
          move = data.role === 'dps' ? 'out' : 'in';
        else {
          move = data.donut === data.role
            ? (bait1 === 'near' ? 'out' : 'in')
            : (bait1 === 'near' ? 'in' : 'out');
        }
        const move1 = move as InOut;
        const move2 = move1 === 'in' ? 'out' : 'in';
        if (bait1 === bait2) {
          // 2랑 4
          data.fallRes.push(move1);
          data.fallRes.push(move2);
          data.fallRes.push(move2);
          data.fallRes.push(move1);
        } else {
          // 3
          data.fallRes.push(move1);
          data.fallRes.push(move1);
          data.fallRes.push(move2);
          data.fallRes.push(move2);
        }

        const join = data.fallRes.map((v) => output[v]!()).join(output.split!());
        data.fallPrev = data.fallRes.shift();
        if (data.phase === 'shade' && data.donut === data.role) {
          data.fallPrev = undefined;
          return output.mesg!({ ind: output.stack!(), res: join });
        }
        const ind = move1 === 'in' ? output.inside!() : output.outside!();
        return output.mesg!({ ind: ind, res: join });
      },
      outputStrings: {
        ...fallOutputs,
      },
    },
    {
      id: 'ZeleniaEx Escelons\' Fall Next',
      type: 'Ability',
      netRegex: { id: ['A8AD', 'A8AE'], source: 'Zelenia', capture: false },
      condition: (data) => data.fallRes.length > 0,
      durationSeconds: 2.5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...fallOutputs,
        };
        const join = data.fallRes.map((v) => output[v]!()).join(output.split!());
        const move = data.fallRes.shift();
        if (move === undefined)
          return;
        const prev = data.fallPrev;
        data.fallPrev = move;
        if (prev === move)
          return { infoText: output.mesg!({ ind: output.stay!(), res: join }) };
        const ind = move === 'in' ? output.inside!() : output.outside!();
        return { alertText: output.mesg!({ ind: ind, res: join }) };
      },
    },
    {
      id: 'ZeleniaEx Stock Break',
      type: 'StartsUsing',
      netRegex: { id: 'A8D5', source: 'Zelenia', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.fiveAOE!(),
      outputStrings: {
        fiveAOE: {
          en: '5x AoEs',
          ko: '5x 전체공격',
        },
      },
    },
    {
      id: 'ZeleniaEx Tether',
      type: 'Tether',
      netRegex: { id: '0011' },
      condition: (data, matches) => data.me === matches.target,
      durationSeconds: 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tether',
          ja: '線',
          ko: '내게 줄!',
        },
      },
    },
    {
      id: 'ZeleniaEx Perfumed Quietus',
      type: 'StartsUsing',
      netRegex: { id: 'A8CD', source: 'Zelenia', capture: false },
      delaySeconds: 4,
      response: Responses.bigAoe(),
    },
    {
      id: 'ZeleniaEx Roseblood Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'A8B9', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'First bloom',
          ja: '(一式)',
          ko: '(1식)',
        },
      },
    },
    {
      id: 'ZeleniaEx 1st Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['00A7', '00A8'], capture: true },
      infoText: (_data, matches, output) => matches.id === '00A7' ? output.cw!() : output.ccw!(),
      outputStrings: {
        cw: Outputs.clockwise,
        ccw: Outputs.counterclockwise,
      },
    },
    {
      id: 'ZeleniaEx A.Thunder III',
      type: 'StartsUsing',
      netRegex: { id: 'A8E3', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      response: Responses.spread('alert'),
    },
    {
      id: 'ZeleniaEx Roseblood: 2nd Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA14', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Second bloom',
          ja: '(二式)',
          ko: '(2식)',
        },
      },
    },
    {
      id: 'ZeleniaEx A.Thunder IV',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia' },
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (data.phase === '2nd')
          return matches.id === 'A9BA' ? output.out2nd!() : output.in2nd!();
        if (data.phase === '5th')
          return matches.id === 'A9BA' ? output.out5th!() : output.in5th!();
      },
      outputStrings: {
        in2nd: {
          en: 'In first',
          ja: '内から',
          ko: '한칸 안쪽으로',
        },
        out2nd: {
          en: 'Out first',
          ja: '外から',
          ko: '두칸 바깥쪽으로',
        },
        in5th: {
          en: 'In',
          ja: '内から',
          ko: '안으로',
        },
        out5th: {
          en: 'Out',
          ja: '外から',
          ko: '바깥으로',
        },
      },
    },
    {
      id: 'ZeleniaEx A.Thunder IV Next',
      type: 'Ability',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia' },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (data.phase === '2nd')
          return matches.id === 'A9BA' ? output.in2nd!() : output.out2nd!();
        if (data.phase === '5th')
          return matches.id === 'A9BA' ? output.in5th!() : output.out5th!();
      },
      outputStrings: {
        in2nd: {
          en: 'In second',
          ja: '内へ',
          ko: '안으로 🔜 피해요',
        },
        out2nd: {
          en: 'Out second',
          ja: '外へ',
          ko: '바깥으로 🔜 피해요',
        },
        in5th: {
          en: 'In',
          ja: '内へ',
          ko: '🡼방향 안으로',
        },
        out5th: {
          en: 'Out',
          ja: '外へ',
          ko: '🡼방향 바깥으로',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 3rd Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA15', source: 'Zelenia', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Third bloom',
          ja: '(三式)',
          ko: '(3식 십자 타워)',
        },
      },
    },
    {
      id: 'ZeleniaEx Rose',
      type: 'HeadMarker',
      netRegex: { id: '0250' },
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        const tdps = data.party.isDPS(matches.target);
        const idps = data.role === 'dps';
        const rose = tdps === idps;
        if (data.phase === '3rd')
          return rose ? output.hold!() : output.tower!();
        if (data.phase === '4th')
          return rose ? output.hold!() : output.spread!();
        if (data.phase === '6th')
          return rose ? output.zigzag!() : output.tower!();
      },
      outputStrings: {
        hold: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 그대로',
        },
        zigzag: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 타워와 지그재그',
        },
        tower: {
          en: 'Get towers',
          ja: '塔踏み',
          ko: '타워 밟아요',
        },
        spread: {
          en: 'Spread',
          ja: '散会',
          ko: '북쪽에서 흩어져요',
        },
      },
    },
    {
      id: 'ZeleniaEx Shade\'s Shock',
      type: 'StartsUsing',
      netRegex: { id: 'A8A1', source: 'Zelenia\'s Shade', capture: false },
      durationSeconds: 5,
      infoText: (data, _matches, output) => data.role === 'dps' ? output.dps!() : output.sup!(),
      run: (data) => data.phase = 'shade',
      outputStrings: {
        sup: {
          en: 'Stack north',
          ja: '北に集合',
          ko: 'TH 북쪽에서 모여요',
        },
        dps: {
          en: 'Stack south',
          ja: '南に集合',
          ko: 'DPS 남쪽에서 모여요',
        },
      },
    },
    {
      id: 'ZeleniaEx Shade\'s Shock Determine Donut',
      type: 'HeadMarker',
      netRegex: { id: '0244' },
      condition: (data) => data.phase === 'shade',
      suppressSeconds: 1,
      run: (data, matches) => {
        if (data.party.isDPS(matches.target))
          data.donut = 'dps';
        else if (data.role === 'dps')
          data.donut = 'unknown';
        else
          data.donut = data.role;
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 4th Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA16', source: 'Zelenia', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Fourth bloom',
          ja: '(四式)',
          ko: '(4식 꽃밭)',
        },
      },
    },
    {
      id: 'ZeleniaEx Encircling Thorns',
      type: 'StartsUsing',
      netRegex: { id: 'A8C3', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack south',
          ja: '南に集合',
          ko: '남쪽에서 모여요 (덩쿨)',
        },
      },
    },
    {
      id: 'ZeleniaEx A.Banish III',
      type: 'StartsUsing',
      netRegex: { id: 'A8E8', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Break tethers',
          ja: '線切る',
          ko: '덩쿨 끊어요!',
        },
      },
    },
    {
      id: 'ZeleniaEx Power Break',
      type: 'StartsUsing',
      netRegex: { id: ['A8B0', 'A8B1'], source: 'Zelenia\'s Shade' },
      delaySeconds: 2,
      durationSeconds: 3,
      infoText: (_data, matches, output) => {
        let left = matches.id === 'A8B0';
        if (parseFloat(matches.y) < 100)
          left = !left;
        return left ? output.left!() : output.right!();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 5th Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA17', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Fifth bloom',
          ja: '(五式)',
          ko: '(5식 돌진)',
        },
      },
    },
    {
      id: 'ZeleniaEx 5th Chakram',
      type: 'ActorSetPos',
      netRegex: { id: '40[0-9A-F]{6}', capture: true },
      condition: (data, matches) => {
        if (data.phase !== '5th')
          return false;
        if (Math.abs(100 - parseFloat(matches.x)) < 2)
          return false;
        if (Math.abs(100 - parseFloat(matches.y)) < 2)
          return false;
        return true;
      },
      suppressSeconds: 9999,
      infoText: (_data, matches, output) => {
        const w = parseFloat(matches.x) < 100;
        const n = parseFloat(matches.y) < 100;
        const dir = n
          ? (w ? output.se!() : output.sw!())
          : (w ? output.ne!() : output.nw!());
        return output.text!({ dir: dir });
      },
      outputStrings: {
        text: {
          en: 'Start ${dir}',
          ja: '${dir}から',
          ko: '${dir}부터',
        },
        ne: Outputs.northeast,
        se: Outputs.southeast,
        sw: Outputs.southwest,
        nw: Outputs.northwest,
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 6th Bloom',
      type: 'Ability',
      netRegex: { id: 'AA18', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sixth bloom',
          ja: '(六式)',
          ko: '(6식 지그재그)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Zelenia': 'ゼレニア',
        // 'Zelenia\'s Shade': 'ゼレニアの幻影',
      },
    },
  ],
};

export default triggerSet;
