import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  circle: number;
  getFourfold: boolean;
  getTwinfold: boolean;
}

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.MountOrdealsExtreme,
  timelineFile: 'rubicante-ex.txt',
  initData: () => {
    return {
      circle: 0,
      getFourfold: false,
      getTwinfold: false,
    };
  },
  timelineTriggers: [
    {
      // Gnosis does in fact have a cast time, but it's only 2.7 seconds.
      // It's safer to warn via the timeline.
      id: '루비칸테EX Arch Inferno 미리 알림',
      regex: /^Arch Inferno$/,
      beforeSeconds: 24,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '남북으로 팀',
        },
      },
    },
    {
      id: '루비칸테EX Flamespire Claw 미리 알림',
      regex: /^Flamespire Claw$/,
      beforeSeconds: 18,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '곧 주사위',
        },
      },
    },
  ],
  triggers: [
    {
      id: '루비칸테EX Inferno',
      type: 'StartsUsing',
      netRegex: { id: '7D2C', source: 'Rubicante', capture: false },
      response: Responses.aoe(),
    },
    {
      id: '루비칸테EX Ordeal of Purgation',
      type: 'StartsUsing',
      netRegex: { id: '80E9', source: 'Rubicante' },
      durationSeconds: 8,
      infoText: (data, _matches, output) => {
        data.circle++;
        return {
          0: output.p0!(),
          1: output.p1!(),
          2: output.p2!(),
          3: output.p3!(),
          4: output.p4!(),
          5: output.p5!(),
          6: output.p6!(),
          7: output.p7!(),
          8: output.p8!(),
        }[data.circle];
      },
      outputStrings: {
        p0: {
          en: '아니 오류인가...',
        },
        p1: {
          en: '#1: 보스 뒤로 / 회전 방향에 맞춰 좌우로',
        },
        p2: {
          en: '#2: V 뒤쪽',
        },
        p3: {
          en: '#3: V 안쪽 (벽까지 가면 좋음)',
        },
        p4: {
          en: '#4: ^_^ 에서 회전 방향 ^으로',
        },
        p5: {
          en: '#5: 보스 뒤로',
        },
        p6: {
          en: '#6: V 뒤쪽, 좌우 직선 찾아 그 밑단',
        },
        p7: {
          en: '#7: V 안쪽 (벽까지 가면 좋음)',
        },
        p8: {
          en: '#8: ^_^ 에서 회전 방향 ^으로',
        },
        unknown: Outputs.unknown,
      }
    },
    {
      id: '루비칸테EX Shattering Heat',
      type: 'StartsUsing',
      netRegex: { id: '7D2D', source: 'Rubicante' },
      response: Responses.tankBuster(),
    },
    {
      id: '루비칸테EX Arch Inferno',
      type: 'StartsUsing',
      netRegex: { id: '7CF9', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '남북으로 팀 나눠요!',
        },
      },
    },
    {
      id: '루비칸테EX Spike of Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D02', source: 'Rubicante' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요',
        },
      },
    },
    {
      id: '루비칸테EX Fourfold Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D03', source: 'Rubicante' },
      condition: (data) => !data.getFourfold,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.getFourfold = true,
      outputStrings: {
        text: {
          en: '힐러랑 뭉쳐요',
        },
      },
    },
    {
      id: '루비칸테EX Twinfold Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D04', source: 'Rubicante' },
      condition: (data) => !data.getTwinfold,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.getTwinfold = true,
      outputStrings: {
        text: {
          en: '짝꿍이랑 둘이 뭉쳐요',
        },
      },
    },
    {
      id: '루비칸테EX Conflagration',
      type: 'StartsUsing',
      netRegex: { id: '7CFD', source: 'Rubicante' },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '바닥 조심',
        },
      },
    },
    {
      id: '루비칸테EX Radial Flagration',
      type: 'StartsUsing',
      netRegex: { id: '7CFE', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '프로틴! 자기 자리로',
        },
      },
    },
    {
      id: '루비칸테EX Blazing Rapture',
      type: 'StartsUsing',
      netRegex: { id: '7D06', source: 'Rubicante', capture: false },
      delaySeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '아픈 전체 공격!', // 또는 쫄 못잡아서 전멸
        },
      },
    },
    {
      id: '루비칸테EX Flamespire Brand',
      type: 'StartsUsing',
      netRegex: { id: '7D13', source: 'Rubicante', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '곧 운동회~🎉 디버프 확인',
        },
      },
    },
    {
      id: '루비칸테EX Inferno Single Wing',
      type: 'StartsUsing',
      netRegex: { id: '7D0F', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '개인 장판! 자기 자리로',
        },
      },
    },
    {
      id: '루비칸테EX Scalding Signal',
      type: 'StartsUsing',
      netRegex: { id: '7D24', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '⊗밖으로! 자기 자리로',
        },
      },
    },
    {
      id: '루비칸테EX Scalding Ring',
      type: 'StartsUsing',
      netRegex: { id: '7D25', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '⊙안으로! 자기 자리로',
        },
      },
    },
    {
      id: '루비칸테EX Sweeping Immolation / Partial',
      type: 'StartsUsing',
      netRegex: { id: '7D20', source: 'Rubicante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '보스 뒤에서 흩어져요! (장판조심)',
        },
      },
    },
    {
      id: '루비칸테EX Sweeping Immolation / Total',
      type: 'StartsUsing',
      netRegex: { id: '7D21', source: 'Rubicante', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '보스 뒤에서 뭉쳐요! (장판조심)',
        },
      },
    },
    {
      id: '루비칸테EX Dualfire',
      type: 'StartsUsing',
      netRegex: { id: '7D2E', source: 'Rubicante' },
      response: (data, _matches, output) => {
        if (data.role === 'tank')
          return { alertText: output.tank!() };
        return { infoText: output.notank!() };
      },
      outputStrings: {
        tank: {
          en: '탱크 클레브! 둘이 비스듬하게 유도해요',
        },
        notank: {
          en: '탱크 클레브! 보스 엉덩이로',
        }
      },
    },
    /*
    {
      id: '루비칸테EX Flamespire Claw',
      type: 'StartsUsing',
      netRegex: { id: '7D28', source: 'Rubicante', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '주사위 눈금 확인',
        },
      },
    },
    */
    {
      id: '루비칸테EX Ghastly Flame',
      type: 'StartsUsing',
      netRegex: { id: '7D0C', source: 'Flamesent', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '쫄 잡아요!',
        },
      },
    },
    /*
    {
      id: '루비칸테EX Flamesent Shattering Heat Tether',
      type: 'Tether',
      netRegex: { id: '0054' },
      condition: (data, matches) => matches.target === data.me && data.role !== 'tank',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 버스터 줄이!',
        },
      },
    },
    */
    {
      id: '루비칸테EX Flamesent Tether',
      type: 'Tether',
      netRegex: { id: '00C0' },
      condition: (data, matches) => matches.target === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 범위 줄이!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Spike of Flame/Fourfold Flame/Twinfold Flame': 'Frames',
        'Partial Immolation/Total Immolation': 'Partial/Total Immolation',
      },
    },
  ],
};

export default triggerSet;
