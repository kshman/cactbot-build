import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'AmdaporKeepHard',
  zoneId: ZoneId.AmdaporKeepHard,
  triggers: [
    {
      id: 'Amdapor Keep Hard Entrance',
      type: 'StartsUsing',
      netRegex: { id: 'C65', source: 'Boogyman', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'Amdapor Keep Hard Boss2 Headmarker on YOU',
      type: 'HeadMarker',
      netRegex: { id: '000F' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Behind Statue',
          ja: '像の後ろへ',
          ko: '조각상 뒤로',
        },
      },
    },
    {
      id: 'Amdapor Keep Hard Invisible',
      type: 'StartsUsing',
      netRegex: { id: 'C63', source: 'Boogyman', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill luminescence and stay close to boss',
          ja: '光球を倒してボスに近づく',
          ko: '빛구슬 잡고 보스에게 부비부비',
        },
      },
    },
    {
      id: 'Amdapor Keep Hard Imobilize',
      type: 'GainsEffect',
      netRegex: { effectId: ['29B', '260'], capture: false },
      response: Responses.killAdds(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Boogyman': 'Butzemann',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Boogyman': 'croque-mitaine',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Boogyman': 'ボギーマン',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Boogyman': '夜魔人',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Boogyman': '부기맨',
      },
    },
  ],
};

export default triggerSet;
