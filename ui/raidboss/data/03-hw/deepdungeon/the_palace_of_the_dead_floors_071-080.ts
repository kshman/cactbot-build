import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 071-080

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors71_80,

  triggers: [
    // ---------------- Floor 071-079 Mobs ----------------
    {
      id: 'PotD 071-080 Palace Cyclops Eye of the Beholder',
      // untelegraphed front cone AoE
      type: 'StartsUsing',
      netRegex: { id: '1B3C', source: 'Palace Cyclops', capture: false },
      response: Responses.awayFromFront(),
    },
    // ---------------- Floor 080 Boss: Gudanna ----------------
    {
      id: 'PotD 071-080 Gudanna Ecliptic Meteor',
      // 80% max HP damage
      type: 'StartsUsing',
      netRegex: { id: '1BBB', source: 'Gudanna' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      response: Responses.bigAoe('alert'),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Gudanna': 'Gudanna',
        'Palace Cyclops': 'Palast-Zyklop',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Gudanna': 'Gudanna',
        'Palace Cyclops': 'cyclope du palais',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Gudanna': '«°«¢«ó«Ê',
        'Palace Cyclops': '«Ñ«ì«¹?«µ«¤«¯«í«×«¹',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Gudanna': 'Í¯Ó¡?',
        'Palace Cyclops': 'ò¢??äÑËÝìÑ',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Gudanna': '±¸´Ü³ª',
        'Palace Cyclops': '±ÃÀü »çÀÌÅ¬·Ó½º',
      },
    },
  ],
};

export default triggerSet;
