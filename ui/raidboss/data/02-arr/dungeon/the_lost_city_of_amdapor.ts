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
      netRegexJa: NetRegexes.ability({ id: '736', source: '�����?���?', capture: false }),
      netRegexCn: NetRegexes.ability({ id: '736', source: '��Դ��Դ', capture: false }),
      netRegexKo: NetRegexes.ability({ id: '736', source: '�ߵ�����', capture: false }),
      response: Responses.killAdds(),
    },
    {
      id: 'Lost City Amdapor Graviball',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '762', source: 'Diabolos' }),
      netRegexDe: NetRegexes.startsUsing({ id: '762', source: 'Diabolos' }),
      netRegexFr: NetRegexes.startsUsing({ id: '762', source: 'Diabolos' }),
      netRegexJa: NetRegexes.startsUsing({ id: '762', source: '�ǫ����ܫ�' }),
      netRegexCn: NetRegexes.startsUsing({ id: '762', source: '��?��?��' }),
      netRegexKo: NetRegexes.startsUsing({ id: '762', source: '��ƺ��ν�' }),
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Drop Puddle Outside',
          de: 'Flache drau��en ablegen',
        },
      },
    },
    {
      id: 'Lost City Amdapor Ultimate Terror',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '766', source: 'Diabolos', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '766', source: 'Diabolos', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '766', source: 'Diabolos', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '766', source: '�ǫ����ܫ�', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '766', source: '��?��?��', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '766', source: '��ƺ��ν�', capture: false }),
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
        'Chudo-Yudo': '�����?���?',
        'Diabolos': '�ǫ����ܫ�',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Chudo-Yudo': '��Դ��Դ',
        'Diabolos': '��?��?��',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Chudo-Yudo': '�ߵ�����',
        'Diabolos': '��ƺ��ν�',
      },
    },
  ],
};

export default triggerSet;
