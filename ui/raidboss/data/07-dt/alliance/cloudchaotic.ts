import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  no?: number;
  grimDebuff?: string;
  grimCast?: 'enaero' | 'endeath' | 'unknown';
  targets: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheCloudOfDarknessChaotic',
  zoneId: ZoneId.TheCloudOfDarknessChaotic,
  timelineFile: 'cloudchaotic.txt',
  initData: () => {
    return {
      targets: [],
    };
  },
  timelineTriggers: [],
  triggers: [
    {
      id: 'CloudChaotic Blade of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9DFB', '9DFD', '9DFF'], source: 'Cloud of Darkness' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (_data, matches, output) => {
        switch (matches.id) {
          case '9DFB':
            return output.right!();
          case '9DFD':
            return output.left!();
          case '9DFF':
            return output.out!();
        }
      },
      outputStrings: {
        out: Outputs.out,
        left: Outputs.getLeftAndWest,
        right: Outputs.getRightAndEast,
      },
    },
    {
      id: 'CloudChaotic Deluge of Darkness',
      type: 'StartsUsing',
      netRegex: { id: '9E3D', source: 'Cloud of Darkness', capture: false },
      delaySeconds: 2,
      durationSeconds: 5,
      response: Responses.aoe(),
      run: (data) => data.targets = [],
    },
    {
      id: 'CloudChaotic Grim Tether',
      type: 'Tether',
      netRegex: { id: ['012C', '012D'] },
      infoText: (data, matches, output) => {
        data.no = (data.no ?? 0) + 1;
        data.grimDebuff = matches.id;
        return output.text!({ num: data.no });
      },
      outputStrings: {
        text: {
          en: 'Tether #${num}',
          ko: '줄 #${num}',
        },
      },
    },
    {
      id: 'CloudChaotic Death IV', // _rsv_40515_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E43', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out => In',
          ko: '(암렝) 밖에서 🔜 안으로',
        },
      },
    },
    {
      id: 'CloudChaotic Aero IV', // _rsv_40524_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E4C', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback',
          ko: '(암렝) 넉백',
        },
      },
    },
    {
      id: 'CloudChaotic Endeath IV', // _rsv_40531_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E53', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.grimCast = 'endeath',
    },
    {
      id: 'CloudChaotic Unaero IV',
      type: 'StartsUsing',
      netRegex: { id: '9E54', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.grimCast = 'enaero',
    },
    {
      id: 'CloudChaotic Target',
      type: 'HeadMarker',
      netRegex: { id: '0228' },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.grimCast === 'endeath') {
          // 012C 뒤에서 앞으로
          // 012D 앞에서 뒤로
          // 사실 잘 모르겟슴
          return data.grimDebuff === '012C' ? output.back!() : output.front!();
        }
        if (data.grimCast === 'enaero') {
          // 012C 뒤에서 앞으로
          // 012D 앞에서 뒤로
          return data.grimDebuff === '012C' ? output.back!() : output.front!();
        }
        return output.target!();
      },
      run: (data) => delete data.grimCast,
      outputStrings: {
        target: {
          en: 'You are target',
          ko: '내가 타겟!',
        },
        front: {
          en: 'Front',
          ko: '앞쪽에서 주먹',
        },
        back: {
          en: 'Back',
          ko: '뒤쪽에서 주먹',
        },
      },
    },
    {
      id: 'CloudChaotic Flare',
      type: 'HeadMarker',
      netRegex: { id: '015A' },
      condition: (data, matches) => {
        data.targets.push(matches.target);
        return data.targets.length === 3;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          flare: {
            en: 'Flare on YOU',
            ko: '내게 플레어!',
          },
          none: {
            en: 'No Flare',
            ko: '플레어 피해욧',
          },
        };
        if (data.targets.includes(data.me))
          return { alertText: output.flare!() };
        return { infoText: output.none!() };
      },
    },
    {
      id: 'CloudChaotic Unholy Stack',
      type: 'HeadMarker',
      netRegex: { id: '0064', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    },
    {
      id: 'CloudChaotic Break IV',
      type: 'StartsUsing',
      netRegex: { id: '9E51', source: 'Sinister Eye', capture: false },
      durationSeconds: 3,
      suppressSeconds: 1,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '시선 조심!',
      },
    },
  ],
};

export default triggerSet;
