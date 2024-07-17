import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

// MapEffect slots 01 - 08 are for the four towers.
// MapEffect slot 09 is something to do with the referee, not important

// Including headmarker data for savage reference
const headMarkerData = {
  // Vfx Path: com_share3t
  stack: 'A1',
  // Vfx Path: d1004turning_right_c0p
  rotateClockwise: 'A7',
  // Vfx Path: d1004turning_left_c0p
  rotateCounterClockwise: 'A8',
  // Vfx Path: m0676trg_tw_d0t1p
  dualTankbuster: '103',
} as const;
console.assert(headMarkerData);

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM3',
  zoneId: ZoneId.AacLightHeavyweightM3,
  timelineFile: 'r3n.txt',
  triggers: [
    {
      id: 'R3N Brutal Burn',
      type: 'StartsUsing',
      netRegex: { id: '9429', source: 'Brute Bomber', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R3N Brutal Impact',
      type: 'StartsUsing',
      netRegex: { id: '93D6', source: 'Brute Bomber', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R3N Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: { id: '93D5', source: 'Brute Bomber', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R3N Brutal Lariat 9AD4',
      type: 'StartsUsing',
      netRegex: { id: '9AD4', source: 'Brute Bomber', capture: false },
      response: Responses.goEast(),
    },
    {
      id: 'R3N Brutal Lariat 9AD5',
      type: 'StartsUsing',
      netRegex: { id: '9AD5', source: 'Brute Bomber', capture: false },
      response: Responses.goWest(),
    },
    {
      id: 'R3N Murderous Mist',
      type: 'StartsUsing',
      netRegex: { id: '93B5', source: 'Brute Bomber', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'R3N Barbarous Barrage',
      type: 'StartsUsing',
      netRegex: { id: '93B2', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback Towers',
          ko: '타워 넉백',
        },
      },
    },
    {
      id: 'R3N Fire Spin Clockwise',
      type: 'StartsUsing',
      netRegex: { id: '93D0', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.clockwise,
      },
    },
    {
      id: 'R3N Fire Spin Counterclockwise',
      type: 'StartsUsing',
      netRegex: { id: '93D1', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.counterclockwise,
      },
    },
    {
      id: 'R3N Fuses of Fury',
      type: 'StartsUsing',
      netRegex: { id: '93B6', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Long => Short',
          ko: '긴거 🔜 짧은거',
        },
      },
    },
    {
      id: 'R3N Lariat Combo East to West',
      type: 'StartsUsing',
      netRegex: { id: '9ADC', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East, then West',
          ko: '동쪽갔다, 서쪽으로',
        },
      },
    },
    {
      id: 'R3N Lariat Combo East to East',
      type: 'StartsUsing',
      netRegex: { id: '9ADD', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East, then East',
          ko: '동쪽가서, 그대로',
        },
      },
    },
    {
      id: 'R3N Lariat Combo West to East',
      type: 'StartsUsing',
      netRegex: { id: '9ADE', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West to East',
          ko: '서쪽갔다, 동쪽으로',
        },
      },
    },
    {
      id: 'R3N Lariat Combo West to West',
      type: 'StartsUsing',
      netRegex: { id: '9ADF', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West to West',
          ko: '서쪽가서, 그대로',
        },
      },
    },
    {
      id: 'R3N Infernal Spin Clockwise',
      type: 'StartsUsing',
      netRegex: { id: '9B42', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.clockwise,
      },
    },
    {
      id: 'R3N Infernal Spin Counterclockwise',
      type: 'StartsUsing',
      netRegex: { id: '9B43', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.counterclockwise,
      },
    },
  ],
};

export default triggerSet;
