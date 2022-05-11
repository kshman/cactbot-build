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
      netRegexJa: NetRegexes.startsUsing({ id: '415', source: '«Ç«â«ó«º«¦«©?«ë', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '415', source: '?Øª?', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '415', source: '¾Ç¸¶ÀÇ º®', capture: false }),
      response: Responses.goMiddle(),
    },
    {
      id: 'Amdapor Keep Liquefy Sides',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '416', source: 'Demon Wall', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '416', source: 'Damonenwand', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '416', source: 'Mur Demonique', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '416', source: '«Ç«â«ó«º«¦«©?«ë', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '416', source: '?Øª?', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '416', source: '¾Ç¸¶ÀÇ º®', capture: false }),
      response: Responses.goSides(),
    },
    {
      id: 'Amdapor Keep Repel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '417', source: 'Demon Wall', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '417', source: 'Damonenwand', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '417', source: 'Mur Demonique', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '417', source: '«Ç«â«ó«º«¦«©?«ë', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '417', source: '?Øª?', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '417', source: '¾Ç¸¶ÀÇ º®', capture: false }),
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
        'Demon Wall': '«Ç«â«ó«º«¦«©?«ë',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Demon Wall': '?Øª?',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Demon Wall': '¾Ç¸¶ÀÇ º®',
      },
    },
  ],
};

export default triggerSet;
