import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AmdaporKeep,
  triggers: [
    {
      id: 'Amdapor Keep Liquefy Middle',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '415', source: 'Demon Wall', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '415', source: 'Damonenwand', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '415', source: 'Mur Demonique', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '415', source: '�ǫ�󫺫���?��', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '415', source: '?ت?', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '415', source: '�Ǹ��� ��', capture: false }),
      response: Responses.goMiddle(),
    },
    {
      id: 'Amdapor Keep Liquefy Sides',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '416', source: 'Demon Wall', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '416', source: 'Damonenwand', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '416', source: 'Mur Demonique', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '416', source: '�ǫ�󫺫���?��', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '416', source: '?ت?', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '416', source: '�Ǹ��� ��', capture: false }),
      response: Responses.goSides(),
    },
    {
      id: 'Amdapor Keep Repel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '417', source: 'Demon Wall', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '417', source: 'Damonenwand', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '417', source: 'Mur Demonique', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '417', source: '�ǫ�󫺫���?��', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '417', source: '?ت?', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '417', source: '�Ǹ��� ��', capture: false }),
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Demon Wall': 'Damonenwand',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Demon Wall': 'mur demonique',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Demon Wall': '�ǫ�󫺫���?��',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Demon Wall': '?ت?',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Demon Wall': '�Ǹ��� ��',
      },
    },
  ],
};

export default triggerSet;
