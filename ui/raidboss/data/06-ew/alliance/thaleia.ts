import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const formsMap: { [count: string]: string } = {
  // first
  '8A0A': '왼쪽',
  '8A0D': '오른쪽',
  '8A10': '안으로',
  // second
  '8A0B': '왼쪽',
  '8A0E': '오른쪽',
  '8A11': '안으로',
  // third
  '8A0C': '왼쪽',
  '8A0F': '오른쪽',
  '8A12': '안으로',
} as const;

export interface Data extends RaidbossData {
  hydroptosisTarget?: boolean;
  soaringMinuet?: boolean;
  forms: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'Thaleia',
  zoneId: ZoneId.Thaleia,
  timelineFile: 'thaleia.txt',
  initData: () => {
    return {
      forms: [],
    };
  },
  triggers: [
    {
      id: 'Thaleia Thaliak Katarraktes',
      type: 'StartsUsing',
      netRegex: { id: '88D1', source: 'Thaliak', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Thaliak Thlipsis',
      type: 'StartsUsing',
      netRegex: { id: '88D8', source: 'Thaliak', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '모두 뭉쳐요!',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Left Bank',
      type: 'StartsUsing',
      netRegex: { id: '88D2', source: 'Thaliak', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Thaleia Thaliak Right Bank',
      type: 'StartsUsing',
      netRegex: { id: '88D3', source: 'Thaliak', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Thaleia Hydroptosis Target',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.me === matches.target,
      alertText: (data, _matches, output) => {
        data.hydroptosisTarget = true;
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '내게 장판! 밖으로!',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Hydroptosis',
      type: 'StartsUsing',
      netRegex: { id: '88D4', source: 'Thaliak', capture: false },
      condition: (data) => !data.hydroptosisTarget,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => delete data.hydroptosisTarget,
      outputStrings: {
        text: {
          en: '장판 피해요!',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Rhyton',
      type: 'StartsUsing',
      netRegex: { id: ['88D6', '88D7'], source: 'Thaliak' },
      condition: (data) => data.role === 'tank',
      response: Responses.tankBuster(),
    },
    {
      id: 'Thaleia Thaliak Tetraktys',
      type: 'StartsUsing',
      netRegex: { id: '88C9', source: 'Thaliak', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '삼각 장판 피해요!',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Tetraktuos Kosmos',
      type: 'StartsUsing',
      // 88CD, 88CE는 부속임
      netRegex: { id: '88CC', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '삼각 장판 조심해욧',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Rheognosis',
      type: 'StartsUsing',
      netRegex: { id: '88C4', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백쪽으로',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Rheognosis Petrine',
      type: 'StartsUsing',
      netRegex: { id: '88C5', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백 + 돌 굴러와요',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Hieroglyphika',
      type: 'StartsUsing',
      netRegex: { id: '88CF', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전한 곳으로',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Tempest',
      type: 'StartsUsing',
      netRegex: { id: '880B', source: 'Llymlaen', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Llymlaen Seafoam Spiral',
      type: 'StartsUsing',
      netRegex: { id: '880D', source: 'Llymlaen', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Thaleia Llymlaen Wind Rose',
      type: 'StartsUsing',
      netRegex: { id: '880C', source: 'Llymlaen', capture: false },
      response: Responses.getOut(),
    },
    /*
    {
      id: 'Thaleia Llymlaen Navigator\'s Trident',
      type: 'StartsUsing',
      netRegex: { id: '880E', source: 'Llymlaen', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '좌우 피했다 => 넉백',
        },
      },
    },
    */
    {
      id: 'Thaleia Llymlaen Navigator\'s Trident',
      type: 'StartsUsing',
      netRegex: { id: '8CCE', source: 'Llymlaen' },
      infoText: (_data, matches, output) => {
        if (parseFloat(matches.z) < 0)
          return output.right!();
        return output.left!();
      },
      outputStrings: {
        left: {
          en: '오른쪽 => 왼쪽 => 넉백',
        },
        right: {
          en: '왼쪽 => 오른쪽 => 넉백',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Navigator\'s Trident Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8811', source: 'Llymlaen', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '곧 넉백',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Surging Wave',
      type: 'StartsUsing',
      netRegex: { id: '8812', source: 'Llymlaen', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '멀리 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Left Strait',
      type: 'StartsUsing',
      netRegex: { id: '8851', source: 'Llymlaen', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Thaleia Llymlaen Right Strait',
      type: 'StartsUsing',
      netRegex: { id: '8852', source: 'Llymlaen', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Thaleia Llymlaen Deep Dive',
      type: 'StartsUsing',
      netRegex: { id: ['8819', '8834'], source: 'Llymlaen', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '모두 뭉쳐요!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Torrential Tridents',
      type: 'StartsUsing',
      netRegex: { id: '881A', source: 'Llymlaen', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '마지막 창 => 첫번째 창으로',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Stormwhorl',
      type: 'StartsUsing',
      netRegex: { id: '881E', source: 'Llymlaen', capture: false },
      condition: (data) => !data.hydroptosisTarget,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => delete data.hydroptosisTarget,
      outputStrings: {
        text: {
          en: '장판 피해요!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Denizens of the Deep',
      type: 'StartsUsing',
      netRegex: { id: '8820', source: 'Llymlaen', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '뱀 나와요!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Maelstrom',
      type: 'StartsUsing',
      netRegex: { id: '882A', source: 'Llymlaen', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 피해요!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Godsbane',
      type: 'StartsUsing',
      netRegex: { id: '8824', source: 'Llymlaen', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 + 출혈',
        },
      },
    },
    {
      id: 'Thaleia Oschon Sudden Downpour',
      type: 'StartsUsing',
      netRegex: { id: ['8999', '899A'], source: 'Oschon', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Oschon Trek Shot',
      type: 'StartsUsing',
      netRegex: { id: '898E', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '화살표 찾아서 옆으로 (보스 안따라옴)',
        },
      },
    },
    {
      id: 'Thaleia Oschon Reproduce',
      type: 'StartsUsing',
      netRegex: { id: '8989', source: 'Oschon', capture: false },
      alertText: (data, _matches, output) => {
        if (!data.soaringMinuet)
          return output.first!();
        return output.others!();
      },
      outputStrings: {
        first: {
          en: '화살표 찾아서 옆으로 (보스 따라옴)',
        },
        others: {
          en: '두 화살표 사이가 안전 (보스 따라옴)',
        },
      },
    },
    {
      id: 'Thaleia Oschon Flinted Foehn',
      type: 'StartsUsing',
      netRegex: { id: ['89A3', '89A4'], source: 'Oschon', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '연속 전체 공격',
        },
      },
    },
    {
      id: 'Thaleia Oschon Soaring Minuet',
      type: 'StartsUsing',
      netRegex: { id: ['8D0E', '8994'], source: 'Oschon', capture: false },
      response: Responses.getBehind(),
      run: (data) => data.soaringMinuet = true,
    },
    {
      id: 'Thaleia Oschon the Arrow',
      type: 'StartsUsing',
      netRegex: { id: ['899B', '899C', '899D', '899E'], source: 'Oschon' },
      suppressSeconds: 10,
      response: Responses.tankBuster(),
    },
    {
      id: 'Thaleia Tank Buster Target',
      type: 'HeadMarker',
      netRegex: { id: ['0158', '01F4'] },
      condition: (data, matches) => data.me === matches.target,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 탱크버스터 장판!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Climbing Shot',
      type: 'StartsUsing',
      netRegex: { id: ['8990', '8991', '8992', '8993'], source: 'Oschon', capture: false },
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 없는 곳으로 + 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Lofty Peaks',
      type: 'StartsUsing',
      netRegex: { id: '89A7', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '인제 곧 커져요! 버프 넣지말것!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Piton Pull',
      type: 'StartsUsing',
      netRegex: { id: ['89A9', '89AA', '89AB'], source: 'Oschon', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '갈고리 없는 모서리로!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Altitude',
      type: 'StartsUsing',
      netRegex: { id: '89AF', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전한 곳 찾아요!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Wandering Shot',
      type: 'StartsUsing',
      netRegex: { id: ['8CF6', '8CF7'], source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '구슬에서 먼곳으로!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Arrow Trail',
      type: 'StartsUsing',
      netRegex: { id: '89B2', source: 'Oschon', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '연속 세로 장판, 피해요!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Downhill',
      type: 'StartsUsing',
      netRegex: { id: '8C45', source: 'Oschon', capture: false },
      durationSeconds: 3,
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '바닥 장판 피해요!',
        },
      },
    },
    {
      id: 'Thaleia Oschon Wandering Volley',
      type: 'StartsUsing',
      netRegex: { id: ['89AC', '89AD'], source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '구슬에서 먼곳 + 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Dawn of Time',
      type: 'StartsUsing',
      netRegex: { id: '8A03', source: 'Eulogia', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Eulogia Forms',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(formsMap), source: 'Eulogia' },
      durationSeconds: (data) => data.forms.length < 2 ? 4 : 19,
      infoText: (data, matches, output) => {
        const form = formsMap[matches.id.toUpperCase()] ?? output.unknown!();
        data.forms.push(form);
        if (data.forms.length === 3) {
          const mesg = data.forms.join(' => ');
          data.forms = [];
          return output.text!({ mesg: mesg });
        }
        return output.text!({ mesg: form });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Thaleia Eulogia Sunbeam',
      type: 'StartsUsing',
      netRegex: { id: '8A00', source: 'Eulogia' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Thaleia Eulogia the Whorl',
      type: 'StartsUsing',
      netRegex: { id: '8A2F', source: 'Eulogia', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Thaleia Eulogia Love\'s Light',
      type: 'StartsUsing',
      netRegex: { id: '8A30', source: 'Eulogia', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '밝은 것부터 터져요 => 하나씩 이동',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hydrostasis',
      type: 'StartsUsing',
      netRegex: { id: '8A37', source: 'Eulogia', capture: false },
      durationSeconds: 13,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '3 => 1 => 2 순으로 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hieroglyphika',
      type: 'StartsUsing',
      netRegex: { id: '8A43', source: 'Eulogia', capture: false },
      durationSeconds: 20,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전한 곳으로',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hand of the Destroyer Red',
      type: 'StartsUsing',
      netRegex: { id: '8A47', source: 'Eulogia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '파랑쪽이 안전',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Hand of the Destroyer Blue',
      type: 'StartsUsing',
      netRegex: { id: '8A48', source: 'Eulogia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '빨간쪽이 안전',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Torrential Tridents',
      type: 'StartsUsing',
      netRegex: { id: '8A4E', source: 'Eulogia', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '마지막 창 => 첫번째 창으로',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Destructive Bolt',
      type: 'StartsUsing',
      netRegex: { id: '8CEC', source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '모두 뭉쳐요!',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Byregot\'s Strike',
      type: 'StartsUsing',
      netRegex: { id: '8A52', source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백 (번개 조심)',
          de: 'Rückstoß (mit Blitzen)',
          fr: 'Poussée (avec éclair)',
          ja: 'ノックバック (雷)',
          cn: '击退 (带闪电)',
          ko: '넉백 (번개 장판)',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Thousandfold Thrust',
      type: 'HeadMarker',
      netRegex: { id: ['0182', '0183', '0184', '0185'], target: 'Eulogia' },
      alertText: (_data, matches, output) => {
        return {
          '0182': output.back!(),
          '0183': output.front!(),
          '0184': output.left!(),
          '0185': output.right!(),
        }[matches.id];
      },
      outputStrings: {
        front: Outputs.front,
        back: Outputs.back,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'Thaleia Eulogia As Above So Below',
      type: 'StartsUsing',
      netRegex: { id: ['8A5B', '8A5C'], source: 'Eulogia' },
      infoText: (_data, matches, output) => {
        if (matches.id === '8A5B')
          return output.red!();
        return output.blue!();
      },
      outputStrings: {
        red: {
          en: '파랑색이 안전',
        },
        blue: {
          en: '빨강색이 안전',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Climbing Shot',
      type: 'StartsUsing',
      netRegex: { id: '8D0B', source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전한 곳으로 넉백!',
        },
      },
    },
    {
      id: 'Thaleia Eulogia Soaring Minuet',
      type: 'StartsUsing',
      netRegex: { id: '8A69', source: 'Eulogia', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Thaleia Eulogia Eudaimon Eorzea',
      type: 'StartsUsing',
      netRegex: { id: '8A2C', source: 'Eulogia', capture: false },
      durationSeconds: 18,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '지속적으로 전체 공격!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Eulogia': 'エウロギア',
        'Llymlaen(?!\')': 'リムレーン',
        'Oschon(?!\')': 'オシュオン',
        'Thaliak(?!\')': 'サリャク',
        'The Briny Deep': '大洋の虚',
        'The River Of Knowledge': '知恵の河',
        'The Stairway To The Seventh': '六天座の階',
        'The Twelve\'s Embrace': '祝福の天球',
        'The Windward Pass': '風の通り道',
      },
      'replaceText': {
        'Altitude': 'アルティチュード',
        'Arrow Trail': 'アロートレイル',
        'As Above, So Below': '死生択一の炎',
        'Blueblossoms': '青花散',
        'Byregot\'s Strike': 'ビエルゴズ・ストライク',
        'Climbing Shot': 'クライムシュート',
        'Crash': '衝突',
        'Dawn of Time': '星天極光',
        'Deep Dive': '海淵落とし',
        'Denizens of the Deep': '海蛇招来',
        'Destructive Bolt': '壊雷撃',
        'Dire Straits': '両舷掃討',
        'Downhill': 'ダウンヒル',
        'Eudaimon Eorzea': 'エウダイモン・エオルゼア',
        'Everfire': '死の襲火',
        'First Blush': '月閃',
        'First Form': '壱の構え',
        'Flinted Foehn': 'フェーンアロー',
        'Frothing Sea': '大洋の白波',
        'Full Bright': '月夜の巡り',
        'Giltblossoms': '黄花散',
        'Godsbane': 'ゴッズベーン',
        'Great Whirlwind': '大旋風',
        'Hand of the Destroyer': '壊神創幻撃',
        'Hieroglyphika': 'ヒエログリュフィカ',
        'Hydroptosis': 'ヒュドルピトシス',
        'Hydrostasis': 'ヒュドルスタシス',
        'Katarraktes': 'カタラクティス',
        'Landing': '落着',
        'Left/Right Bank': '左/右岸氾濫',
        'Left/Right Strait': '左/右舷掃討',
        'Lightning Bolt': '落雷',
        'Lofty Peaks': '風天の霊峰',
        'Love\'s Light': '慈愛の月',
        'Maelstrom': 'メイルシュトローム',
        'Matron\'s Breath': '豊穣の息吹',
        'Moving Mountains': '造山振動',
        'Navigator\'s Trident': 'リムレーンズトライデント',
        'Once Burned': '生の襲火',
        'Peak Peril': '造山乱流',
        'Petrine': '・ペトゥロス',
        'Piton Pull': 'ハーケンブリング',
        'Quintessence': 'クイーン・アームパンチ',
        'Radiant Finish': '焔扇流舞・終炎',
        'Radiant Flight': '焔扇',
        'Radiant Flourish': '焔扇火',
        'Radiant Rhythm': '焔扇流舞',
        'Reproduce': '分体生成',
        'Rheognosis': 'レーオノシス',
        'Rhyton': 'リュトン',
        'Seafoam Spiral': '輪の波浪',
        'Second Form': '弐の構え',
        'Serpents\' Tide': '海蛇の進撃',
        'Shockwave': '衝撃波',
        'Soaring Minuet': 'メヌエットアロー',
        'Solar Fans': '紅炎扇刃',
        'Stormwhorl': '時化の渦風',
        'Stormwinds': '時化の潮風',
        'Stormy Seas': '大時化起こし',
        'Sudden Downpour': 'ダウンポール',
        'Sunbeam': '太陽光',
        'Surging Wave': '波穿ち',
        'Swinging Draw': 'スイングアロー',
        'Tempest': '大海嵐',
        'Tetraktuos Kosmos': 'テトラクテュス・コスモス',
        'Tetraktys': 'テトラクテュス',
        'The Builder\'s Art': 'ビエルゴの神力',
        'The Destroyer\'s Might': 'ラールガーの神力',
        'The Fury\'s Ambition': 'ハルオーネの神力',
        'The Keeper\'s Gravity': 'アルジクの神力',
        'The Lover\'s Devotion': 'メネフィナの神力',
        'The Matron\'s Plenty': 'ノフィカの神力',
        'The Navigator\'s Command': 'リムレーンの神力',
        'The Scholar\'s Wisdom': 'サリャクの神力',
        'The Spinner\'s Cunning': 'ニメーヤの神力',
        'The Traders\' Equity': 'ナルザルの神力',
        'The Wanderer\'s Whimsy': 'オシュオンの神力',
        'The Warden\'s Radiance': 'アーゼマの神力',
        'Third Form': '参の構え',
        'Thlipsis': 'スリプシス',
        'Thousandfold Thrust': 'サウザンスラスト',
        'Time and Tide': '時間操作',
        'To the Last': '',
        'Torrential Tridents': '銛の雨',
        'Trek Shot': 'トレックアロー',
        'Wandering Shot': 'ワンダリングショット',
        'Wandering Volley': 'ワンダリングバラージ',
        'Wind Rose': '円の旋風',
        'the Arrow': 'オシュオンの矢',
        'the Whorl': '創世の神渦',
      },
    },
  ],
};

export default triggerSet;