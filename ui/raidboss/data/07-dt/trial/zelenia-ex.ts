import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'door' | 'add' | 'mov' | '1st' | '2nd' | '3rd' | 'esc' | '4th' | '5th' | '6th';
type NearFar = 'near' | 'far';
type InOut = 'in' | 'out';

export interface Data extends RaidbossData {
  phase?: Phase;
  falls: NearFar[];
  fallRes: InOut[];
  fallPrev?: InOut;
  athunder4?: string;
  roses: string[];
  donutRole?: string;
}

const phaseMap: { [id: string]: Phase } = {
  'A8B5': 'add', // Blessed Barricade
  'A8CD': 'mov', // Perfumed Quietus
  'A8B9': '1st', // Roseblood Bloom
  'AA14': '2nd', // Roseblood: 2nd Bloom
  'AA15': '3rd', // Roseblood: 3rd Bloom
  'AA16': '4th', // Roseblood: 4th Bloom
  'AA17': '5th', // Roseblood: 5th Bloom
  'AA18': '6th', // Roseblood: 6th Bloom
};

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
      roses: [],
    };
  },
  triggers: [
    {
      id: 'ZeleniaEx Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phaseMap), source: 'Zelenia' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const phase = phaseMap[matches.id];
        if (phase === undefined)
          throw new UnreachableCode();
        data.phase = phase;
      },
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
      id: 'ZeleniaEx My shock',
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
          en: 'Donut',
          ja: 'ドーナツ、塔踏み',
          ko: '도넛, 타워로',
        },
        circle: {
          en: 'Circle',
          ja: '円、散会',
          ko: '동글이, 흩어져요',
        },
      },
    },
    {
      id: 'ZeleniaEx Specter of the Lost',
      type: 'StartsUsing',
      netRegex: { id: 'A89F', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tetherBusters: Outputs.tetherBusters,
          avoidTetherBusters: Outputs.avoidTetherBusters,
        };
        if (data.role === 'tank')
          return { alertText: output.tetherBusters!() };
        return { infoText: output.avoidTetherBusters!() };
      },
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

        let move = data.role === 'dps' ? 'out' : 'in';
        if (data.phase === 'esc') {
          // 두번째꺼부터 해야하므로 1,2순서 그래야 2번이 두번째
          const bait = data.donutRole === data.role ? bait2 : bait1;
          move = bait === 'near' ? 'in' : 'out';
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
        const ind = move1 === 'in' ? output.inside!() : output.outside!();
        return output.mesg!({ ind: ind, res: join });
      },
      outputStrings: {
        mesg: {
          en: '${ind} (${res})',
          ja: '${ind} (${res})',
          ko: '${ind} ${res}',
        },
        inside: Outputs.in,
        outside: Outputs.out,
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
          en: ', ',
          ja: ', ',
          ko: '',
        },
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
          mesg: {
            en: '${ind} (${res})',
            ja: '${ind} (${res})',
            ko: '${ind} ${res}',
          },
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
            en: ', ',
            ja: ', ',
            ko: '',
          },
        };
        const join = data.fallRes.map((v) => output[v]!()).join(output.split!());
        const prev = data.fallPrev;
        const move = data.fallRes.shift();
        if (prev === undefined || move === undefined)
          return;
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
      durationSeconds: 5,
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
      id: 'ZeleniaEx Roseblood Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'A8B9', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Start from north/east',
          ja: '北/東から',
          ko: 'Ⓐ/Ⓑ 시작',
        },
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
      id: 'ZeleniaEx 2nd A.Thunder IV',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia' },
      condition: (data) => data.phase === '2nd',
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (matches.id === 'A9BA') {
          data.athunder4 = 'in';
          return output.out!();
        }
        data.athunder4 = 'out';
        return output.in!();
      },
      outputStrings: {
        in: {
          en: 'In first',
          ja: '内から',
          ko: '한칸 안쪽으로',
        },
        out: {
          en: 'Out first',
          ja: '外から',
          ko: '두칸 바깥 오른쪽으로',
        },
      },
    },
    {
      id: 'ZeleniaEx 2nd A.Thunder IV Next',
      type: 'Ability',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia', capture: false },
      condition: (data) => data.phase === '2nd' && data.athunder4 !== undefined,
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => output[data.athunder4!]!(),
      outputStrings: {
        in: {
          en: 'In second',
          ja: '内へ',
          ko: '왼쪽 안 🔜 오른쪽',
        },
        out: {
          en: 'Out second',
          ja: '外へ',
          ko: '밖으로 🔜 오른쪽',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 3rd Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA15', source: 'Zelenia', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.roses = [],
      outputStrings: {
        text: {
          en: 'Find north',
          ja: '◣◢を北に',
          ko: '◣◢ 기준 맡은 자리로',
        },
      },
    },
    {
      id: 'ZeleniaEx 3rd Rose',
      type: 'HeadMarker',
      netRegex: { id: '0250' },
      condition: (data, matches) => {
        if (data.phase !== '3rd')
          return false;
        data.roses.push(matches.target);
        return data.roses.length === 4;
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.roses.includes(data.me))
          return output.rose!();
        return output.tower!();
      },
      outputStrings: {
        rose: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 그대로',
        },
        tower: {
          en: 'Get tower',
          ja: '塔踏み',
          ko: '타워 밟아요',
        },
      },
    },
    {
      id: 'ZeleniaEx Shade\'s shock',
      type: 'StartsUsing',
      netRegex: { id: 'A8A1', source: 'Zelenia\'s Shade', capture: false },
      durationSeconds: 5,
      infoText: (data, _matches, output) => data.role === 'dps' ? output.dps!() : output.sup!(),
      run: (data) => data.phase = 'esc',
      outputStrings: {
        sup: {
          en: 'Stack north',
          ja: '北に集合',
          ko: '북쪽에서 탱힐 뭉쳐요',
        },
        dps: {
          en: 'Stack south',
          ja: '南に集合',
          ko: '남쪽에서 DPS 뭉쳐요',
        },
      },
    },
    {
      id: 'ZeleniaEx Shade\'s shock target',
      type: 'HeadMarker',
      netRegex: { id: '0244' },
      condition: (data) => data.phase === 'esc',
      suppressSeconds: 1,
      run: (data, matches) => {
        if (data.party.isDPS(matches.target))
          data.donutRole = 'dps';
        else if (data.role === 'dps')
          data.donutRole = 'unknown';
        else
          data.donutRole = data.role;
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 4th Bloom',
      type: 'StartsUsing',
      netRegex: { id: 'AA16', source: 'Zelenia', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.roses = [],
      outputStrings: {
        text: {
          en: 'Find north',
          ja: '◣◢を北に',
          ko: '◣◢ 기준 남쪽으로',
        },
      },
    },
    {
      id: 'ZeleniaEx 4th Rose',
      type: 'HeadMarker',
      netRegex: { id: '0250' },
      condition: (data, matches) => {
        if (data.phase !== '4th')
          return false;
        data.roses.push(matches.target);
        return data.roses.length === 4;
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.roses.includes(data.me))
          return output.rose!();
        return output.spread!();
      },
      outputStrings: {
        rose: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 그대로',
        },
        spread: {
          en: 'Spread',
          ja: '散会',
          ko: '북쪽에서 흩어져요',
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
      durationSeconds: 3.5,
      alertText: (_data, matches, output) => {
        const y = parseFloat(matches.y);
        if (y < 100) {
          if (matches.id === 'A8B0')
            return output.right!();
          return output.left!();
        }
        if (matches.id === 'A8B0')
          return output.left!();
        return output.right!();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'ZeleniaEx Valorous Ascension',
      type: 'StartsUsing',
      netRegex: { id: 'A8C7', source: 'Zelenia', capture: false },
      durationSeconds: 3,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Watch outside object',
          ja: '外の直線攻撃確認',
          ko: '돌진 공격 없는곳!',
        },
      },
    },
    {
      id: 'ZeleniaEx 5th A.Thunder IV',
      type: 'StartsUsing',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia' },
      condition: (data) => data.phase === '5th',
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (matches.id === 'A9BA') {
          data.athunder4 = 'in';
          return output.out!();
        }
        data.athunder4 = 'out';
        return output.in!();
      },
      outputStrings: {
        in: {
          en: 'In',
          ja: '内から',
          ko: '안으로',
        },
        out: {
          en: 'Out',
          ja: '外から',
          ko: '바깥으로',
        },
      },
    },
    {
      id: 'ZeleniaEx 5th A.Thunder IV Next',
      type: 'Ability',
      netRegex: { id: ['A9BA', 'A9BB'], source: 'Zelenia', capture: false },
      condition: (data) => data.phase === '5th' && data.athunder4 !== undefined,
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => output[data.athunder4!]!(),
      outputStrings: {
        in: {
          en: 'In',
          ja: '内へ',
          ko: '🡼방향 안으로',
        },
        out: {
          en: 'Out',
          ja: '外へ',
          ko: '🡼방향 바깥으로',
        },
      },
    },
    {
      id: 'ZeleniaEx Roseblood: 6th Bloom',
      type: 'Ability',
      netRegex: { id: 'AA18', source: 'Zelenia', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.roses = [],
      outputStrings: {
        text: {
          en: 'Spread',
          ja: '散会',
          ko: '맡은 분면 자리로',
        },
      },
    },
    {
      id: 'ZeleniaEx 6th Rose',
      type: 'HeadMarker',
      netRegex: { id: '0250' },
      condition: (data, matches) => {
        if (data.phase !== '6th')
          return false;
        data.roses.push(matches.target);
        return data.roses.length === 4;
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.roses.includes(data.me))
          return output.rose!();
        return output.tower!();
      },
      outputStrings: {
        rose: {
          en: 'Hold position',
          ja: '薔薇',
          ko: '내게 장미, 타워와 지그재그',
        },
        tower: {
          en: 'Get tower',
          ja: '塔踏み',
          ko: '타워 밟아요',
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
