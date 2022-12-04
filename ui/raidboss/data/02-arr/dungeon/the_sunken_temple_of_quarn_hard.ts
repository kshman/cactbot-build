import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheSunkenTempleOfQarnHard,
  triggers: [
    {
      id: 'Sunken Quarn Hard Light of Anathema',
      type: 'StartsUsing',
      netRegex: { id: 'C26', source: 'Vicegerent to the Warden', capture: false },
      response: Responses.awayFromFront(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Vicegerent to the Warden': 'Statthalter der Aufseherin',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Vicegerent to the Warden': 'adjoint de la Gardienne',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Vicegerent to the Warden': '��?���ޫ���������������',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Vicegerent to the Warden': '?���������',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Vicegerent to the Warden': '������ ��Ȳ',
      },
    },
  ],
};

export default triggerSet;
