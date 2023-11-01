import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type LalaMarch = 'front' | 'back' | 'left' | 'right';

const LalaArcaneBlghtMap: { [count: string]: LalaMarch } = {
  '886E': 'front',
  '886F': 'left',
  '8870': 'right',
  '8871': 'back',
} as const;

export interface Data extends RaidbossData {
  tmp: boolean;
  lalaBlight?: LalaMarch;
  lalaMarch?: LalaMarch;
  rotate?: 'cw' | 'ccw' | 'unknown';
}

const triggerSet: TriggerSet<Data> = {
  id: 'Aloalo',
  zoneId: ZoneId.AloaloIsland,
  timelineFile: 'aloalo.txt',
  initData: () => {
    return {
      tmp: false,
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
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '기믹 - 망치/동글',
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
          en: '바로 피해요!',
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
          en: '기믹 - 넉백',
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
          en: '기믹 - 창',
        },
      },
    },
    {
      id: 'Aloalo Quaqua Arcane Armaments Trident Action',
      type: 'StartsUsing',
      netRegex: { id: '8BA0', source: 'Quaqua', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '창에서 먼 곳 => 나중에 빙그르르',
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
          en: '쫄 소환 기믹',
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
          en: '쫄 소환 기믹',
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
      id: 'Aloalo Lala Lala rotation',
      type: 'HeadMarker',
      netRegex: { id: ['01E4', '01E5'], target: 'Lala' },
      run: (data, matches) => data.rotate = matches.id === '01E4' ? 'cw' : 'ccw',
    },
    {
      id: 'Aloalo Lala Player rotation',
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
      // 886E 앞?
      // 886F 오른쪽
      // 8870 왼쪽
      // 8871 뒤
      netRegex: { id: Object.keys(LalaArcaneBlghtMap), source: 'Lala' },
      run: (data, matches) => data.lalaBlight = LalaArcaneBlghtMap[matches.id.toUpperCase()],
    },
    {
      id: 'Aloalo Lala Arcane Blight',
      type: 'Ability',
      netRegex: { id: '8873', source: 'Lala', capture: false },
      infoText: (data, _matches, output) => {
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
      id: 'Aloalo Lala Analysis',
      type: 'StartsUsing',
      netRegex: { id: '887B', source: 'Lala', capture: false },
      // E8E Front Unseen
      // E8F Back Unseen
      infoText: (data, _matches, output) => {
        if (data.rotate === undefined)
          return output.text!();
        if (data.rotate === 'cw')
          return output.right!();
        return output.left!();
      },
      run: (data) => delete data.rotate,
      outputStrings: {
        text: {
          en: '열린 곳을 보스쪽으로',
        },
        left: {
          en: '열린 곳 보스 + 왼쪽으로 돌려요',
        },
        right: {
          en: '열린 곳 보스 + 오른쪽으로 돌려요',
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
          en: '밖에 쥐 등장 => 쿵하고 장판',
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
      id: 'Aloalo Lala Calculated Trajectory Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: 'E8[3-6]' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      run: (data, matches) => {
        const faceMap: { [effectId: string]: LalaMarch } = {
          E83: 'front',
          E84: 'back',
          E85: 'left',
          E86: 'right',
        } as const;
        data.lalaMarch = faceMap[matches.effectId];
      },
    },
    {
      id: 'Aloalo Lala Calculated Trajectory',
      type: 'Ability',
      netRegex: { id: '887D', source: 'Lala', capture: false },
      delaySeconds: 3,
      alertText: (data, _matches, output) => {
        if (data.lalaMarch === undefined)
          return output.text!();
        if (data.rotate === undefined)
          return output[data.lalaMarch]!();
        if (data.rotate === 'cw') {
          return {
            'front': output.right!(),
            'back': output.left!(),
            'left': output.front!(),
            'right': output.back!(),
          }[data.lalaMarch];
        }
        return {
          'front': output.left!(),
          'back': output.right!(),
          'left': output.back!(),
          'right': output.front!(),
        }[data.lalaMarch];
      },
      run: (data) => {
        delete data.lalaMarch;
        delete data.rotate;
      },
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
  ],
};

export default triggerSet;
