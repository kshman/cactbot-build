import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheForbiddenLandEurekaPyros,
  resetWhenOutOfCombat: false,
  triggers: [
    {
      id: 'Eureka Pyros Skoll Hoarhound Halo',
      type: 'StartsUsing',
      netRegex: { id: '36E0', source: 'Skoll', capture: false },
      response: Responses.goFrontOrSides(),
    },
    {
      id: 'Eureka Pyros Skoll Heavensward Howl',
      type: 'StartsUsing',
      netRegex: { id: '46BD', source: 'Skoll', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Eureka Pyros Falling Asleep',
      type: 'GameLog',
      netRegex: { line: '7 minutes have elapsed since your last activity..*?', capture: false },
      response: Responses.wakeUp(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?':
          'Seit deiner letzten Aktivitat sind 7 Minuten vergangen.',
        'Skoll': 'Skalli',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        '7 minutes have elapsed since your last activity.':
          'Votre personnage est inactif depuis 7 minutes',
        'Skoll': 'Skoll',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        '7 minutes have elapsed since your last activity.': 'ðÃíÂª¬ªÊª¤?÷¾ªËªÊªÃªÆª«ªé7ÝÂª¬?Î¦ª·ªÞª·ª¿¡£',
        'Skoll': '«¹«³«ë',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '7 minutes have elapsed since your last activity.': 'ì«?7ÝÂ??êó?ú¼ìòù¼ðÃíÂ',
        'Skoll': 'ÞÙ??',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '7 minutes have elapsed since your last activity..*?': '7ºÐ µ¿¾È ¾Æ¹« Á¶ÀÛÀ» ÇÏÁö ¾Ê¾Ò½À´Ï´Ù',
        'Skoll': '½ºÄÝ',
      },
    },
  ],
};

export default triggerSet;
