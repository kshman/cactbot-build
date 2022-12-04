import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 131-140

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors131_140,

  triggers: [
    // ---------------- Floor 131-139 Mobs ----------------
    {
      id: 'PotD 131-140 Deep Palace Ahriman Level 5 Petrify',
      // untelegraphed cone AoE that inflicts Petrify
      type: 'StartsUsing',
      netRegex: { id: '1B77', source: 'Deep Palace Ahriman', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PotD 131-140 Deep Palace Catoblepas Eye of the Stunted',
      // gaze attack that inflicts Minimum (1B6)
      type: 'StartsUsing',
      netRegex: { id: '1B7A', source: 'Deep Palace Catoblepas', capture: false },
      response: Responses.lookAway('alert'),
    },
    // ---------------- Floor 140 Boss: Ah Puch ----------------
    {
      id: 'PotD 131-140 Ah Puch Adds Spawn',
      // 5411 = Deep Palace Follower
      type: 'AddedCombatant',
      netRegex: { npcNameId: '5411', capture: false },
      suppressSeconds: 1,
      response: Responses.killAdds('alert'),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Deep Palace Ahriman': 'Katakomben-Ahriman',
        'Deep Palace Catoblepas': 'Katakomben-Catblepus',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Deep Palace Ahriman': 'ahriman des profondeurs',
        'Deep Palace Catoblepas': 'catoblepas des profondeurs',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Deep Palace Ahriman': '«Ç«£?«×«Ñ«ì«¹?«¢?«ê«Þ«ó',
        'Deep Palace Catoblepas': '«Ç«£?«×«Ñ«ì«¹?«««È«Ö«ì«Ñ«¹',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Deep Palace Ahriman': 'ä¢?Ù¢Ð¡ñýäÑ',
        'Deep Palace Catoblepas': 'ä¢??öõøÖ??ÞÙ',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Deep Palace Ahriman': '±íÀº ±ÃÀü ¾Æ¸®¸¸',
        'Deep Palace Catoblepas': '±íÀº ±ÃÀü Ä«Åäºí·¹ÆÄ½º',
      },
    },
  ],
};

export default triggerSet;
