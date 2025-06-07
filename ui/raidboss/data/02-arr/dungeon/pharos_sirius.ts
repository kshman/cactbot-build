import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PharosSirius',
  zoneId: ZoneId.PharosSirius,
  triggers: [
    {
      id: 'Pharos Sirius Deathly Cadenza',
      type: 'StartsUsing',
      netRegex: { id: '5CF', source: 'Siren', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Pharos Sirius Feral Lunge',
      type: 'StartsUsing',
      netRegex: { id: '5CC', source: 'Siren', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Pharos Sirius Corrupted Crystal',
      type: 'GainsEffect',
      netRegex: { effectId: '176', count: '03' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread: Stacks Explode Soon',
          ja: '散開: クリスタルがすぐ爆発する',
          ko: '흩어져요: 곧 크리스탈 폭발',
        },
      },
    },
    {
      // Not 100% sure if there's a better way to handle the callout
      id: 'Pharos Sirius Doom',
      type: 'GainsEffect',
      netRegex: { effectId: '172' },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.target) }),
      outputStrings: {
        text: {
          en: 'Heal ${player} to full',
          ja: '${player} を全回復して',
          ko: 'HP만땅: ${player}',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Siren': 'Sirene',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Siren': 'sirène',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Siren': 'セイレーン',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Siren': '塞壬',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Siren': '세이렌',
      },
    },
  ],
};

export default triggerSet;
