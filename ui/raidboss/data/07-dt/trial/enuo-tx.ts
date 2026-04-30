import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  grows: 'stack' | 'group' | 'unknown';
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheUnmakingExtreme',
  zoneId: ZoneId.TheUnmakingExtreme,
  timelineFile: 'enuo-tx.txt',
  initData: () => ({
    grows: 'unknown',
  }),
  triggers: [
    {
      id: 'EnuoEx Meteorain',
      type: 'StartsUsing',
      netRegex: { id: 'C381', source: 'Enuo', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'EnuoEx Naught Grows Group',
      type: 'HeadMarker',
      netRegex: { id: '02BD', capture: false },
      suppressSeconds: 1,
      run: (data) => data.grows = 'group',
    },
    {
      id: 'EnuoEx Naught Grows Stack',
      type: 'HeadMarker',
      netRegex: { id: '02BE', capture: false },
      suppressSeconds: 1,
      run: (data) => data.grows = 'stack',
    },
    {
      id: 'EnuoEx Naught Grows',
      type: 'StartsUsing',
      netRegex: { id: 'C337', source: 'Enuo', capture: false },
      infoText: (data, _matches, output) => {
        const action = output[data.grows]!();
        return output.text!({ action: action });
      },
      outputStrings: {
        text: {
          en: 'Check void => ${action}',
          ko: '공허 확인 🔜 ${action}',
        },
        group: {
          en: '4:4 stacks',
          ko: '4:4 뭉쳐요',
        },
        stack: {
          en: 'Stacks',
          ko: '모두 뭉쳐요',
        },
        unknown: Outputs.unknown,
      },
    },
    // 멜트다운 시리즈
    // C378 젤 처음
    // C379 아마 첫 장판 (뭉쳐 깔기)
    // C37A 아마 개인 장판 (바깥에 깔기)
    {
      id: 'EnuoEx Meltdown',
      type: 'StartsUsing',
      netRegex: { id: 'C378', source: 'Enuo', capture: false },
      suppressSeconds: 1,
      response: Responses.getUnder(),
    },
    {
      id: 'EnuoEx Meltdown Spread',
      type: 'LosesEffect',
      netRegex: { effectId: '11D2', source: 'Enuo', capture: false },
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread out',
          ko: '밖으로 🔜 흩어져요',
        },
      },
    },
    {
      id: 'EnuoEx Dense Emptiness',
      type: 'StartsUsing',
      netRegex: { id: 'C371', source: 'Enuo', capture: false },
      response: Responses.healerGroups(),
    },
    {
      id: 'EnuoEx Airy Emptiness',
      type: 'StartsUsing',
      netRegex: { id: 'C370', source: 'Enuo', capture: false },
      response: Responses.stackPartner(),
    },
    {
      id: 'EnuoEx Gaze of the Void',
      type: 'StartsUsing',
      netRegex: { id: 'C352', source: 'Enuo', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Remeber first void location',
          ko: '첫 구슬 위치 기억해요',
        },
      },
    },
    {
      id: 'EnuoEx Deep Freeze',
      type: 'StartsUsing',
      netRegex: { id: 'C37B', source: 'Enuo', capture: false },
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tank!();
        return output.other!();
      },
      outputStrings: {
        tank: {
          en: 'Spread',
          ko: '흩어지고 + 계속 움직여요',
        },
        other: {
          en: 'Avoid',
          ko: '피하고 + 계속 움직여요',
        },
      },
    },
  ],
};

export default triggerSet;
