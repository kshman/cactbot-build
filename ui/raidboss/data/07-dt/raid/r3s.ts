import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  phaseTracker: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM3Savage',
  zoneId: ZoneId.AacLightHeavyweightM3Savage,
  timelineFile: 'r3s.txt',
  initData: () => ({
    phaseTracker: 0,
  }),
  triggers: [
    {
      id: 'R3S Phase Tracker',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB6', capture: true },
      run: (data, matches) => data.phaseTracker = parseInt(matches.count, 16),
    },
    {
      id: 'R3S Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: { id: '9423', source: 'Brute Bomber' },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R3S Brutal Impact',
      type: 'StartsUsing',
      netRegex: { id: '9425', source: 'Brute Bomber', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R3S Octuple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93D8', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Spread',
          ko: '밖으로 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octuple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93D9', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Spread',
          ko: '안으로 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93DE', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away + Spread',
          ko: '멀리 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93DF', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback + Spread',
          ko: '넉백 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Murderous Mist',
      type: 'StartsUsing',
      netRegex: { id: '93FE', source: 'Brute Bomber', capture: false },
      infoText: (data, _matches, output) => {
        if (data.phaseTracker > 0)
          return output.getHit!();
        return output.getBehind!();
      },
      outputStrings: {
        getBehind: Outputs.getBehind,
        getHit: {
          en: 'Get hit by mist',
          ko: '안개에 맞아요',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93E0', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away + Partners',
          ko: '멀리 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93E1', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback + Partners',
          ko: '넉백 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93DA', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Partners',
          ko: '밖으로 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93DB', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Partners',
          ko: '안으로 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Short Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB8', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Short Fuse',
          ko: '짧은 도화선',
        },
      },
    },
    {
      id: 'R3S Long Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB9', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Long Fuse',
          ko: '긴 도화선',
        },
      },
    },
    {
      id: 'R3S Fuse Field',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB4' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) < 30)
          return output.short!();
        return output.long!();
      },
      outputStrings: {
        short: {
          en: 'Short Fuse',
          ko: '짧은 도화선',
        },
        long: {
          en: 'Long Fuse',
          ko: '긴 도화선',
        },
      },
    },
  ],
};

export default triggerSet;
