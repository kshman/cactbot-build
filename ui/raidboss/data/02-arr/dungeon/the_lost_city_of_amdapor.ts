import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheLostCityOfAmdapor,
  triggers: [
    {
      id: 'Lost City Amdapor Devour',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '736', source: 'Chudo-Yudo', capture: false }),
      netRegexDe: NetRegexes.ability({ id: '736', source: 'Chudo-Yudo', capture: false }),
      netRegexFr: NetRegexes.ability({ id: '736', source: 'Chudo-Yudo', capture: false }),
      netRegexJa: NetRegexes.ability({ id: '736', source: '«Á«ç«É?«æ«É?', capture: false }),
      netRegexCn: NetRegexes.ability({ id: '736', source: 'ÎøÔ´éÖÔ´', capture: false }),
      netRegexKo: NetRegexes.ability({ id: '736', source: 'ÃßµµÀ¯µµ', capture: false }),
      response: Responses.killAdds(),
    },
    {
      id: 'Lost City Amdapor Graviball',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '762', source: 'Diabolos' }),
      netRegexDe: NetRegexes.startsUsing({ id: '762', source: 'Diabolos' }),
      netRegexFr: NetRegexes.startsUsing({ id: '762', source: 'Diabolos' }),
      netRegexJa: NetRegexes.startsUsing({ id: '762', source: '«Ç«£«¢«Ü«í«¹' }),
      netRegexCn: NetRegexes.startsUsing({ id: '762', source: 'îè?÷î?ÞÙ' }),
      netRegexKo: NetRegexes.startsUsing({ id: '762', source: 'µð¾Æº¼·Î½º' }),
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Drop Puddle Outside',
          de: 'Flache drau©¬en ablegen',
        },
      },
    },
    {
      id: 'Lost City Amdapor Ultimate Terror',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '766', source: 'Diabolos', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '766', source: 'Diabolos', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '766', source: 'Diabolos', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '766', source: '«Ç«£«¢«Ü«í«¹', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '766', source: 'îè?÷î?ÞÙ', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '766', source: 'µð¾Æº¼·Î½º', capture: false }),
      response: Responses.getIn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Chudo-Yudo': 'Chudo-Yudo',
        'Diabolos': 'Diabolos',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Chudo-Yudo': 'Chudo-Yudo',
        'Diabolos': 'Diabolos',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Chudo-Yudo': '«Á«ç«É?«æ«É?',
        'Diabolos': '«Ç«£«¢«Ü«í«¹',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Chudo-Yudo': 'ÎøÔ´éÖÔ´',
        'Diabolos': 'îè?÷î?ÞÙ',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Chudo-Yudo': 'ÃßµµÀ¯µµ',
        'Diabolos': 'µð¾Æº¼·Î½º',
      },
    },
  ],
};

export default triggerSet;
