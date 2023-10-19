import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  hydroptosisTarget?: boolean;
  rheognosisKosmos?: boolean;
  reproduce: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'Thaleia',
  zoneId: ZoneId.Thaleia,
  timelineFile: 'thaleia.txt',
  initData: () => {
    return {
      reproduce: 0,
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
      id: 'Thaleia Thaliak Hydroptosis Target',
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
      id: 'Thaleia Thaliak Rheognosis',
      type: 'StartsUsing',
      netRegex: { id: '88C4', source: 'Thaliak', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백쪽으로 가있어요',
        },
      },
    },
    {
      id: 'Thaleia Thaliak Rheognosis Kosmos',
      type: 'StartsUsing',
      netRegex: { id: ['88CC', '88CD', '88CE'], source: 'Thaliak', capture: false },
      condition: (data) => !data.rheognosisKosmos,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.rheognosisKosmos = true,
      outputStrings: {
        text: {
          en: '넉백쪽으로 + 돌 굴러와요!',
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
          en: '안전한 곳 찾아가요',
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
    {
      id: 'Thaleia Llymlaen Navigator\'s Trident',
      type: 'StartsUsing',
      netRegex: { id: '880E', source: 'Llymlaen', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '좌우 안전한 곳 찾아요 + 넉백',
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
      netRegex: { id: '8819', source: 'Llymlaen', capture: false },
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
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '마지막 창 => 첫번째 창으로',
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
          en: '장판 조심!',
        },
      },
    },
    {
      id: 'Thaleia Llymlaen Serpents\' Tide',
      type: 'StartsUsing',
      netRegex: { id: ['8826', '8827', '8829', '8829'], source: 'Thalaos', capture: false },
      durationSeconds: 3,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '뱀 돌진 조심!',
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
      id: 'Thaleia Oschon Tempest',
      type: 'StartsUsing',
      netRegex: { id: '8999', source: 'Oschon', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Thaleia Oschon Trek Shot',
      type: 'StartsUsing',
      netRegex: { id: '898E', source: 'Oschon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '화살표 찾아서 옆으로',
        },
      },
    },
    {
      id: 'Thaleia Oschon Reproduce',
      type: 'StartsUsing',
      netRegex: { id: '8989', source: 'Oschon', capture: false },
      alertText: (data, _matches, output) => {
        data.reproduce++;
        if (data.reproduce === 1)
          return output.first!();
        return output.others!();
      },
      outputStrings: {
        first: {
          en: '화살표 찾아서 옆으로',
        },
        others: {
          en: '화살포 사이 안전한 곳으로',
        },
      },
    },
    {
      id: 'Thaleia Oschon Flinted Foehn',
      type: 'StartsUsing',
      netRegex: { id: '89A3', source: 'Oschon', capture: false },
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
      netRegex: { id: '8D0E', source: 'Oschon', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Thaleia Oschon the Arrow',
      type: 'StartsUsing',
      netRegex: { id: ['899B', '899C', '899D', '899E'], source: 'Oschon' },
      suppressSeconds: 10,
      response: Responses.tankBuster(),
    },
    {
      id: 'Thaleia Oschon Climbing Shot',
      type: 'StartsUsing',
      netRegex: { id: ['8991', '8992'], source: 'Oschon', capture: false },
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 피하면서 + 넉백!',
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
          en: '화살표 구슬에서 먼곳으로!',
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
          en: '화살표 구슬에서 먼곳 + 안전한 곳 넉백!',
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
      durationSeconds: 10,
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
      netRegex: { id: ['8A43', '8A44'], source: 'Eulogia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전한 곳 찾아가요',
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
      type: 'StartsUsing',
      netRegex: { id: ['8A58', '8A59'], source: 'Eulogia', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전한 곳 찾아요!',
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
      response: Responses.aoe(),
    },
  ],
};

export default triggerSet;
