import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheLimitlessBlueExtreme,
  triggers: [
    {
      id: 'Bismarck Sharp Gust',
      type: 'StartsUsing',
      netRegex: { id: 'FAF', source: 'Bismarck', capture: false },
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Bismarck': 'Bismarck',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Bismarck': 'Bismarck',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Bismarck': '�ӫ��ޫ뫯',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Bismarck': '?��?',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Bismarck': '�񽺸���ũ',
      },
    },
  ],
};

export default triggerSet;
