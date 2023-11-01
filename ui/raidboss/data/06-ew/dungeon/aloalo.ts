import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Marches = 'front' | 'back' | 'left' | 'right';

const LalaArcaneBlghtMap: { [count: string]: Marches } = {
  '886F': 'right',
  '8870': 'left',
  '8871': 'back',
  '8872': 'front',
} as const;

export interface Data extends RaidbossData {
  quaArcaneCount: number;
  lalaBlight?: Marches;
  rotate?: 'cw' | 'ccw' | 'unknown';
  reloadCount: number;
  reloadFailed: number[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'Aloalo',
  zoneId: ZoneId.AloaloIsland,
  timelineFile: 'aloalo.txt',
  initData: () => {
    return {
      quaArcaneCount: 0,
      reloadCount: 0,
      reloadFailed: [],
    };
  },
  triggers: [
    // ----------------------------------------- Quaqua
    {
      id: 'Aloalo Quaqua Made Magic',
      type: 'StartsUsing',
      netRegex: { id: '8B94', source: 'Quaqua', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Aloalo Quaqua Arcane Armaments',
      type: 'StartsUsing',
      netRegex: { id: '8B88', source: 'Quaqua', capture: false },
      infoText: (data, _matches, output) => {
        data.quaArcaneCount++;
        if (data.quaArcaneCount === 1)
          return output.first!();
        if (data.quaArcaneCount === 2)
          return output.second!();
        if (data.quaArcaneCount === 3)
          return output.third!();
        return output.text!();
      },
      outputStrings: {
        first: {
          en: '망치, 피해요',
        },
        second: {
          en: '도넛, 안으로',
        },
        third: {
          en: '망치 + 도넛, 도넛 안으로',
        },
        text: {
          en: '망치, 도넛 조심해요',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Arcane Armaments Action',
      type: 'Ability',
      netRegex: { id: '8B88', source: 'Quaqua', capture: false },
      delaySeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '지금 피해요!',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Arcane Armaments Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8B8C', source: 'Quaqua', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '3연속 넉백, 1번부터',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Arcane Armaments Trident',
      type: 'StartsUsing',
      netRegex: { id: '8B9F', source: 'Quaqua', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '바깥에서 창, 떨어져요',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Violet Storm',
      type: 'StartsUsing',
      netRegex: { id: '8B95', source: 'Quaqua', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '앞에 부채꼴! 뒤로!',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Howl',
      type: 'StartsUsing',
      netRegex: { id: '8B96', source: 'Quaqua', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '쫄 나와요',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Scalding Waves',
      type: 'StartsUsing',
      netRegex: { id: '8B97', source: 'Anala Familiar', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '불 장판 조심해요~',
        },
      },
    },
    // ----------------------------------------- Ketuduke
    {
      id: 'Aloalo Ketuduke Tidal Roar',
      type: 'StartsUsing',
      netRegex: { id: '8AA5', source: 'Ketuduke', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Aloalo Ketuduke Encroaching Twintides',
      type: 'StartsUsing',
      netRegex: { id: '8A9F', source: 'Ketuduke' },
      condition: (_data, matches) => parseFloat(matches.castTime) > 4.5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안에 있다 => 밖으로',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Receding Twintides',
      type: 'StartsUsing',
      netRegex: { id: '8A9D', source: 'Ketuduke' },
      condition: (_data, matches) => parseFloat(matches.castTime) > 4.5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '밖에 있다 => 안으로',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Roar',
      type: 'StartsUsing',
      netRegex: { id: '8A92', source: 'Ketuduke', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '쫄 나와요',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Fluke Typhoon',
      type: 'StartsUsing',
      netRegex: { id: '8A84', source: 'Ketuduke', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '거품만 2칸 넉백',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Updraft',
      type: 'StartsUsing',
      netRegex: { id: '8D0F', source: 'Ketuduke', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '거품만 공중 띄우기',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Hydrobomb',
      type: 'StartsUsing',
      netRegex: { id: '8D0F', source: 'Ketuduke', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '거품 2칸 넉백 + 곧 장판',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Hydrobomb After',
      type: 'Ability',
      netRegex: { id: '8D0F', source: 'Ketuduke', capture: false },
      delaySeconds: 1.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '연속 따라오는 장판',
        },
      },
    },
    {
      id: 'Aloalo Ketuduke Hydroblast',
      type: 'StartsUsing',
      netRegex: { id: '8AA3', source: 'Ketuduke' },
      response: Responses.tankBuster(),
    },
    // ----------------------------------------- Lala
    {
      id: 'Aloalo Lala Lala Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['01E4', '01E5'], target: 'Lala' },
      run: (data, matches) => data.rotate = matches.id === '01E4' ? 'cw' : 'ccw',
    },
    {
      id: 'Aloalo Lala Player Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['01ED', '01EE'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.rotate = matches.id === '01ED' ? 'cw' : 'ccw',
    },
    {
      id: 'Aloalo Lala Inferno Theorem',
      type: 'StartsUsing',
      netRegex: { id: '887F', source: 'Lala', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Aloalo LaLa Arcane Blight Open',
      type: 'StartsUsing',
      // 886F 오른쪽
      // 8870 왼쪽
      // 8871 뒤
      // 8872 앞
      netRegex: { id: Object.keys(LalaArcaneBlghtMap), source: 'Lala' },
      run: (data, matches) => data.lalaBlight = LalaArcaneBlghtMap[matches.id.toUpperCase()],
    },
    {
      id: 'Aloalo Lala Arcane Blight',
      type: 'StartsUsing',
      netRegex: { id: '8873', source: 'Lala', capture: false },
      delaySeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.lalaBlight === undefined)
          return output.text!();
        if (data.rotate === undefined)
          return output[data.lalaBlight]!();
        if (data.rotate === 'cw') {
          return {
            'front': output.right!(),
            'back': output.left!(),
            'left': output.front!(),
            'right': output.back!(),
          }[data.lalaBlight];
        }
        return {
          'front': output.left!(),
          'back': output.right!(),
          'left': output.back!(),
          'right': output.front!(),
        }[data.lalaBlight];
      },
      run: (data) => {
        delete data.lalaBlight;
        delete data.rotate;
      },
      outputStrings: {
        text: {
          en: '빈 곳으로~',
        },
        front: {
          en: '앞으로',
        },
        back: {
          en: '뒤로',
        },
        left: {
          en: '왼쪽',
        },
        right: {
          en: '오른쪽',
        },
      },
    },
    {
      id: 'Aloalo Lala Arcane Plot',
      type: 'StartsUsing',
      netRegex: { id: ['8875', '8876'], source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 위치 봐둬요',
        },
      },
    },
    {
      id: 'Aloalo Lala Analysis Direction',
      type: 'GainsEffect',
      // E8E Front Unseen
      // E8F Back Unseen
      // E90 Right Unseen
      // E91 Left Unseen? E8D?
      netRegex: { effectId: ['E8E', 'E8F', 'E90', 'E91', 'E8D'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.5,
      durationSeconds: 8,
      suppressSeconds: 12, // 틀리면 한번 더 오므로 죽여버림
      alertText: (data, matches, output) => {
        const map = {
          'E8E': 'front',
          'E8F': 'back',
          'E90': 'right',
          'E91': 'left',
          'E8D': 'left',
        }[matches.effectId];
        if (map === undefined)
          return output.text!();
        if (data.rotate === undefined)
          return output[map]!();
        if (data.rotate)
          return {
            'front': output.left!(),
            'back': output.right!(),
            'left': output.back!(),
            'right': output.front!(),
          }[map];
        return {
          'front': output.right!(),
          'back': output.left!(),
          'left': output.front!(),
          'right': output.back!(),
        }[map];
      },
      run: (data) => delete data.rotate,
      outputStrings: {
        front: '보스 봐요',
        back: '뒤돌아 봐요',
        left: '오른쪽 봐요',
        right: '왼쪽 봐요',
        text: '열린 곳을 보스로',
      },
    },
    {
      id: 'Aloalo Lala Floral Figure',
      type: 'StartsUsing',
      netRegex: { id: '8880', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '씨앗 등장 => 도넛 장판',
        },
      },
    },
    {
      id: 'Aloalo Lala Faunal Figure',
      type: 'StartsUsing',
      netRegex: { id: '8882', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '밖에 쥐 등장 => 큰 장판',
        },
      },
    },
    {
      id: 'Aloalo Lala Constructive Figure',
      type: 'StartsUsing',
      netRegex: { id: '8884', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '밖에 나무 등장 => 한 줄 장판',
        },
      },
    },
    {
      id: 'Aloalo Lala Strategic Strike',
      type: 'StartsUsing',
      netRegex: { id: '887E', source: 'Lala' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Aloalo Lala Calculated Trajectory',
      type: 'GainsEffect',
      netRegex: { effectId: 'E8[3-6]' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 3,
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        const map = {
          'E83': 'front',
          'E84': 'back',
          'E85': 'left',
          'E86': 'right',
        }[matches.effectId];
        if (map === undefined)
          return output.text!();
        if (data.rotate === undefined)
          return output[map]!();
        if (data.rotate === 'cw') {
          return {
            'front': output.right!(),
            'back': output.left!(),
            'left': output.front!(),
            'right': output.back!(),
          }[map];
        }
        return {
          'front': output.left!(),
          'back': output.right!(),
          'left': output.back!(),
          'right': output.front!(),
        }[map];
      },
      run: (data) => delete data.rotate,
      outputStrings: {
        text: {
          en: '강제이동',
        },
        front: {
          en: '강제이동: 앞으로',
        },
        back: {
          en: '강제이동: 뒤로',
        },
        left: {
          en: '강제이동: 왼쪽',
        },
        right: {
          en: '강제이동: 오른쪽',
        },
      },
    },
    // ----------------------------------------- Statice
    {
      id: 'Aloalo Statice Surprise Balloon',
      type: 'StartsUsing',
      netRegex: { id: '892E', source: 'Statice', capture: false },
      // 풍선인데 알릴 필요가?
    },
    {
      id: 'Aloalo Statice Pop',
      type: 'StartsUsing',
      netRegex: { id: '892F', source: 'Statice', capture: false },
      delaySeconds: 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '넉백!',
      },
    },
    {
      id: 'Aloalo Statice 4-tonze Weight',
      type: 'StartsUsing',
      netRegex: { id: '8931', source: 'Statice', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '4톤 피해요',
      },
    },
    {
      id: 'Aloalo Statice Pinwheel',
      type: 'StartsUsing',
      netRegex: { id: '8933', source: 'Statice', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '빙글빙글 불기둥 피해요',
      },
    },
    {
      id: 'Aloalo Statice Trick Reload',
      type: 'StartsUsing',
      netRegex: { id: '892A', source: 'Statice', capture: false },
      run: (data) => {
        data.reloadCount = 0;
        data.reloadFailed = [];
      },
    },
    {
      id: 'Aloalo Statice Locked and Loaded',
      type: 'Ability',
      netRegex: { id: '8925', source: 'Statice', capture: false },
      run: (data) => data.reloadCount++,
    },
    {
      id: 'Aloalo Statice Misload',
      type: 'Ability',
      netRegex: { id: '8926', source: 'Statice', capture: false },
      run: (data) => {
        data.reloadCount++;
        data.reloadFailed.push(data.reloadCount);
      },
    },
    {
      id: 'Aloalo Statice Trigger Happy',
      type: 'StartsUsing',
      netRegex: { id: '892B', source: 'Statice', capture: false },
      infoText: (data, _matches, output) => {
        const safe = data.reloadFailed.join(', ');
        return output.text!({ safe: safe });
      },
      outputStrings: {
        text: '안전: ${safe}',
      },
    },
    {
      id: 'Aloalo Statice Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '8929', source: 'Statice', capture: false },
      response: Responses.aoe('alert'),
    },
    {
      id: 'Aloalo Statice Present Box',
      type: 'StartsUsing',
      netRegex: { id: '893E', source: 'Statice', capture: false },
      // 무슨 기믹인지 모르겠음
    },
    {
      id: 'Aloalo Statice Dartboard',
      type: 'StartsUsing',
      netRegex: { id: '893E', source: 'Statice', capture: false },
      durationSeconds: 20,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '3번 같은 곳 떨어지는데로 옮기면 될듯?',
      },
    },
    {
      id: 'Aloalo Statice Hunks of Junk',
      type: 'Ability',
      netRegex: { id: '893C', source: 'Statice', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '틀리면 대야 떨어지나 봄',
      },
    },
  ],
};

export default triggerSet;
