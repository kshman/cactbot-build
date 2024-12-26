import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  blades: number;
  grim: 'front' | 'back' | 'unknown';
  scast: 'endeath' | 'unaero' | 'unknown';
  targets: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheCloudOfDarknessChaotic',
  zoneId: ZoneId.TheCloudOfDarknessChaotic,
  timelineFile: 'cloudchaotic.txt',
  initData: () => {
    return {
      blades: 0,
      grim: 'unknown',
      scast: 'unknown',
      targets: [],
    };
  },
  timelineTriggers: [],
  triggers: [
    {
      id: 'CCloud Blade of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9DFB', '9DFD', '9DFF'], source: 'Cloud of Darkness' },
      durationSeconds: 5,
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
      id: 'CCloud Deluge of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E3D', '9E01'], source: 'Cloud of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.bigAoe(),
      run: (data) => data.targets = [],
    },
    {
      // 012C 뒤에서 앞으로
      // 012D 앞에서 뒤로
      id: 'CCloud Grim Tether',
      type: 'Tether',
      netRegex: { id: ['012C', '012D'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      infoText: (data, matches, output) => {
        if (matches.id === '012C') {
          data.grim = 'back';
          return output.back!();
        }
        data.grim = 'front';
        return output.front!();
      },
      outputStrings: {
        front: {
          en: '(Move forward, later)',
          ko: '(앞에서 주먹 🔜 앞으로)',
        },
        back: {
          en: '(Move backward, later)',
          ko: '(뒤에서 주먹 🔜 뒤로)',
        },
      },
    },
    {
      id: 'CCloud Death IV', // _rsv_40515_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E43', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out => In',
          ko: '밖에서 끌려서 🔜 안으로',
        },
      },
    },
    {
      id: 'CCloud Aero IV', // _rsv_40524_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E4C', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback',
          ko: '가운데 부근 넉백',
        },
      },
    },
    {
      id: 'CCloud Endeath IV', // _rsv_40531_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E53', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.scast = 'endeath',
    },
    {
      id: 'CCloud Unaero IV', // _rsv_40532_-1_1_0_0_SE2DC5B04_EE2DC5B04
      type: 'StartsUsing',
      netRegex: { id: '9E54', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.scast = 'unaero',
    },
    {
      id: 'CCloud En&Un',
      type: 'StartsUsing',
      netRegex: { id: ['9DFB', '9DFD', '9DFF'], source: 'Cloud of Darkness' },
      condition: (data) => {
        data.blades++;
        return data.blades === 4;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        data.blades = 0;
        return output[data.scast]!();
      },
      outputStrings: {
        endeath: {
          en: 'Out => In',
          ko: '밖에서 끌려서 🔜 안으로',
        },
        unaero: {
          en: 'Knockback',
          ko: '가운데 부근 넉백',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'CCloud Target Move',
      type: 'GainsEffect',
      netRegex: { effectId: '1055' }, // _rsv_4181_-1_1_0_0_S74CFC3B0_E74CFC3B0
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      durationSeconds: 1.5,
      alarmText: (data, _matches, output) => output[data.grim]!(),
      outputStrings: {
        front: {
          en: 'Move forward!',
          ko: '앞으로!',
        },
        back: {
          en: 'Move backward!',
          ko: '뒤로!',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'CCloud Flare',
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
      id: 'CCloud Unholy Stack',
      type: 'HeadMarker',
      netRegex: { id: '0064', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    },
    {
      id: 'CCloud Break IV',
      type: 'StartsUsing',
      netRegex: { id: '9E51', source: 'Sinister Eye', capture: false },
      durationSeconds: 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Gaze',
          ko: '시선 조심!',
        },
      },
    },
    {
      id: 'CCloud Dark Dominion',
      type: 'StartsUsing',
      netRegex: { id: '9E08', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
  ],
};

export default triggerSet;
