import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.HaukkeManorHard,
  triggers: [
    {
      id: 'Haukke Manor Hard Stoneskin',
      type: 'StartsUsing',
      netRegex: { id: '3F0', source: 'Manor Sentry' },
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt(),
    },
    {
      id: 'Haukke Manor Hard Beguiling Mist',
      type: 'StartsUsing',
      netRegex: { id: '6B7', source: 'Halicarnassus' },
      condition: (data) => data.CanStun(),
      response: Responses.stun(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Halicarnassus': 'Halikarnassos',
        'Manor Sentry': 'Wachter',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Halicarnassus': 'Halicarnasse',
        'Manor Sentry': 'vigile du manoir',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Halicarnassus': '�ϫꫫ��ʫë���',
        'Manor Sentry': '�����Ъ����',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Halicarnassus': '����???��',
        'Manor Sentry': '��?�����',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Halicarnassus': '�Ҹ�ī�����ҽ�',
        'Manor Sentry': '���� ����',
      },
    },
  ],
};

export default triggerSet;
