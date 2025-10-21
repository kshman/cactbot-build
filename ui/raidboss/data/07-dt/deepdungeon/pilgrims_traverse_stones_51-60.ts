import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones51_60',
  zoneId: ZoneId.PilgrimsTraverseStones51_60,
  triggers: [
    // ---------------- Stone 60 Boss: Ancestral Maliktender ----------------
    {
      id: 'PT 51-60 Ancestral Maliktender Spineshot',
      type: 'StartsUsing',
      netRegex: { id: 'AF42', source: 'Ancestral Maliktender', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'PT 51-60 Ancestral Maliktender Spinning Needles',
      type: 'StartsUsing',
      netRegex: { id: ['AF43', 'AF44'], source: 'Ancestral Maliktender', capture: true },
      durationSeconds: 16,
      alertText: (_data, matches, output) => {
        const rotation = matches.id === 'AF43' ? output.counterclockwise!() : output.clockwise!();
        return output.text!({ rotation: rotation });
      },
      outputStrings: {
        text: {
          en: 'Sides + Rotate ${rotation}',
          ko: '옆쪽에서 + ${rotation}으로 돌아요',
        },
        clockwise: Outputs.clockwise,
        counterclockwise: Outputs.counterclockwise,
      },
    },
    {
      id: 'PT 51-60 Ancestral Maliktender One/Two-stone March',
      type: 'StartsUsing',
      netRegex: { id: ['AF3E', 'AF3F'], source: 'Ancestral Maliktender', capture: true },
      infoText: (_data, matches, output) => {
        const id = matches.id;
        if (id === 'AF3E')
          return output.text!({ count: output.once!() });
        return output.text!({ count: output.twice!() });
      },
      outputStrings: {
        text: {
          en: 'Cactuar move ${count}',
          ko: '선인장이 ${count} 이동',
        },
        once: {
          en: 'Once',
          ko: '한 번',
        },
        twice: {
          en: 'Twice',
          ko: '두 번',
        },
      },
    },
  ],
};

export default triggerSet;
