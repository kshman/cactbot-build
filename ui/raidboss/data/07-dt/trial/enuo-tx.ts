import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  grows: 'stack' | 'group' | 'unknown';
  towerer: string[];
  chains: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheUnmakingExtreme',
  zoneId: ZoneId.TheUnmakingExtreme,
  timelineFile: 'enuo-tx.txt',
  initData: () => ({
    grows: 'unknown',
    towerer: [],
    chains: 0,
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
      netRegex: { id: ['C337', 'C338'], source: 'Enuo', capture: false },
      // C337은 전반 1개 C338은 후반 2개
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
    {
      id: 'EnuoEx Towerer',
      type: 'HeadMarker',
      netRegex: { id: '02D1' },
      condition: (data, matches) => {
        data.towerer.push(matches.target);
        return data.towerer.length === 4;
      },
      infoText: (data, _matches, output) => {
        const action = data.towerer.includes(data.me) ? output.bait!() : output.tower!();
        data.towerer = [];
        return action;
      },
      outputStrings: {
        tower: Outputs.getTowers,
        bait: {
          en: 'Bait cone',
          ko: '꼬깔 유도해요',
        },
      },
    },
    {
      id: 'EnuoEx Beacon in the Dark',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '14754', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Attack the Beacon',
          ko: '거울 매우처요!',
        },
      },
    },
    {
      id: 'EnuoEx Lightless World',
      type: 'StartsUsing',
      netRegex: { id: 'C36D', source: 'Enuo', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'EnuoEx Almagest',
      type: 'StartsUsing',
      netRegex: { id: 'C334', source: 'Enuo', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'EnuoEx Passage of Naught',
      type: 'StartsUsing',
      netRegex: { id: 'C343', source: 'Enuo', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to safe spot',
          ko: '안전한 곳으로!',
        },
      },
    },
    {
      id: 'EnuoEx Shrouded Holy',
      type: 'StartsUsing',
      netRegex: { id: 'C37D', source: 'Enuo', capture: false },
      response: Responses.healerGroups(),
    },
    {
      id: 'EnuoEx Dimension Zero',
      type: 'StartsUsing',
      netRegex: { id: 'C37F', source: 'Enuo', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stacks x3',
          ko: '뭉쳐요 x3',
        },
      },
    },
    {
      id: 'EnuoEx Naught Chains',
      type: 'HeadMarker',
      netRegex: { id: '00AC' },
      condition: (data, matches) => {
        data.chains++;
        return data.me === matches.target;
      },
      durationSeconds: 8,
      infoText: (data, _matches, output) => {
        const isCw = data.chains % 4 === 1 || data.chains % 4 === 2;
        return output.text!({ dir: isCw ? output.cw!() : output.ccw!() });
      },
      outputStrings: {
        cw: Outputs.clockwise,
        ccw: Outputs.counterclockwise,
        text: {
          en: 'Go ${dir}',
          ko: '${dir}으로',
        },
      },
    },
  ],
};

export default triggerSet;
