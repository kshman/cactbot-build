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
        'Halicarnassus': '«Ï«ê«««ë«Ê«Ã«½«¹',
        'Manor Sentry': 'åÙéÄîÐªÎà´ßÀ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Halicarnassus': 'ùë××???ÞÙ',
        'Manor Sentry': 'íä?îÜà´ßÀ',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Halicarnassus': 'ÇÒ¸®Ä«¸£³ª¼Ò½º',
        'Manor Sentry': 'º°±Ã ¼®»ó',
      },
    },
  ],
};

export default triggerSet;
