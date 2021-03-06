import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.HaukkeManor,
  triggers: [
    {
      id: 'Haukke Normal Dark Mist Stun',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '2C1', source: ['Manor Maidservant', 'Manor Claviger', 'Lady Amandine'] }),
      condition: (data) => data.CanStun(),
      suppressSeconds: 2,
      response: Responses.stun('info'),
    },
    {
      id: 'Haukke Normal Steward Soul Drain Stun',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '35C', source: 'Manor Steward' }),
      condition: (data) => data.CanStun(),
      response: Responses.stun('info'),
    },
    {
      // Particle and spell effects make this particular Dark Mist hard to see.
      id: 'Haukke Normal Amandine Dark Mist Dodge',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '2C1', source: 'Lady Amandine', capture: false }),
      condition: (data) => !data.CanStun(),
      response: Responses.outOfMelee('alert'),
    },
    {
      id: 'Haukke Normal Amandine Void Fire III',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '356', source: 'Lady Amandine' }),
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt('info'),
    },
    {
      id: 'Haukke Normal Amandine Void Thunder III',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '358', source: 'Lady Amandine' }),
      condition: Conditions.targetIsYou(),
      response: Responses.getBehind('info'),
    },
    {
      // Void Lamp Spawn
      id: 'Haukke Normal Void Lamps',
      type: 'GameLog',
      netRegex: NetRegexes.message({ line: 'The void lamps have begun emitting an eerie glow', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Turn off Lamps',
          de: 'Schalte die Lampen aus',
          fr: '??teignez les lampes',
          ja: '????????????',
          cn: '??????',
          ko: '?????? ??????',
        },
      },
    },
    {
      // Lady's Candle Spawn
      id: 'Haukke Normal Ladys Candle',
      type: 'AddedCombatant',
      netRegex: NetRegexes.addedCombatantFull({ npcNameId: '425', capture: false }),
      response: Responses.killAdds(),
    },
    {
      // 2 Lady's Handmaiden and 1 Manor Sentry Spawn
      // The sentry outside the bosses room loads when you enter the zone.
      // This causes the trigger to go off early, parsing for the Handmaiden fixes the problem.
      // Suppression included since 2 Handmaiden's spawn at the same time
      id: 'Haukke Normal Ladys Handmaiden',
      type: 'AddedCombatant',
      netRegex: NetRegexes.addedCombatantFull({ npcNameId: '424', capture: false }),
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill Sentry',
          de: 'Wachposten besiegen',
          fr: 'Tuez la sentinelle',
          ja: '???????????????',
          cn: '????????????',
          ko: '????????? ?????????',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Manor Maidservant': 'Hausm??dchen',
        'Manor Claviger': 'Herrenhaus-Schl??sseltr??gerin',
        'Lady Amandine': 'Lady Amandine',
        'Manor Steward': 'Seneschall',
        'The void lamps have begun emitting an eerie glow': 'Die d??steren Lampen flackern unheilvoll auf',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Manor Maidservant': 'soubrette du manoir',
        'Manor Claviger': 'clavi??re du manoir',
        'Lady Amandine': 'dame Amandine',
        'Manor Steward': 'intendant du manoir',
        'The void lamps have begun emitting an eerie glow': 'La lanterne sinistre luit d\'un ??clat lugubre',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Manor Maidservant': '?????????????????????',
        'Manor Claviger': '?????????????????????????????????',
        'Lady Amandine': '??????????????????????????????',
        'Manor Steward': '?????????????????????',
        'The void lamps have begun emitting an eerie glow': '????????????????????????????????????????????????',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Manor Maidservant': '???????????????',
        'Manor Claviger': '????????????',
        'Lady Amandine': '??????????????????',
        'Manor Steward': '???????????????',
        'The void lamps have begun emitting an eerie glow': '?????????????????????????????????????????????',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Manor Maidservant': '????????? ??????',
        'Manor Claviger': '????????? ?????????',
        'Lady Amandine': '????????? ?????????',
        'Manor Steward': '????????? ?????????',
        'The void lamps have begun emitting an eerie glow': '????????? ????????? ??????????????? ?????? ????????????',
      },
    },
  ],
};

export default triggerSet;
