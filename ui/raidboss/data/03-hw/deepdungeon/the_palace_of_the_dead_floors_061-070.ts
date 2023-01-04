import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 061-070

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors61_70,

  triggers: [
    // ---------------- Floor 061-069 Mobs ----------------
    {
      id: 'PotD 061-070 Palace Diplocaulus Foregone Gleam',
      // front cone gaze
      type: 'StartsUsing',
      netRegex: { id: '1B2D', source: 'Palace Diplocaulus', capture: false },
      response: Responses.lookAway('alert'),
    },
    // ---------------- Floor 070 Boss: Yaquaru ----------------
    // intentionally blank
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Palace Diplocaulus': 'Palast-Diplocaulus',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Palace Diplocaulus': 'diplocaulus du palais',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Palace Diplocaulus': '«Ñ«ì«¹?«Ç«£«×«í«««¦«ë«¹',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Palace Diplocaulus': 'ò¢?Ø¢??',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Palace Diplocaulus': '±ÃÀü µðÇÃ·ÎÄ«¿ï·ç½º',
      },
    },
  ],
};

export default triggerSet;
