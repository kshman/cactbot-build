import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheStoneVigilHard,
  triggers: [
    {
      id: 'Stone Vigil Hard Swinge',
      type: 'StartsUsing',
      netRegex: { id: '8F7', source: 'Gorynich', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Stone Vigil Hard Lion\'s Breath',
      type: 'StartsUsing',
      netRegex: { id: '8F6', source: 'Gorynich', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Stone Vigil Hard Rake',
      type: 'StartsUsing',
      netRegex: { id: '8F5', source: 'Gorynich' },
      response: Responses.tankBuster(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Gorynich': 'Gorynich',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Gorynich': 'Gorynich',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Gorynich': '����˫�',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Gorynich': '̫������??',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Gorynich': '����ġ',
      },
    },
  ],
};

export default triggerSet;
