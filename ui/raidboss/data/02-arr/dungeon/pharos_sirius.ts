import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.PharosSirius,
  triggers: [
    {
      id: 'Pharos Sirius Deathly Cadenza',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '5CF', source: 'Siren', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '5CF', source: 'Sirene', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '5CF', source: 'Sirene', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '5CF', source: '«»«¤«ì?«ó', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '5CF', source: 'ßÝìó', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '5CF', source: '¼¼ÀÌ·»', capture: false }),
      response: Responses.getIn(),
    },
    {
      id: 'Pharos Sirius Feral Lunge',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '5CC', source: 'Siren', capture: false }),
      netRegexDe: NetRegexes.startsUsing({ id: '5CC', source: 'Sirene', capture: false }),
      netRegexFr: NetRegexes.startsUsing({ id: '5CC', source: 'Sirene', capture: false }),
      netRegexJa: NetRegexes.startsUsing({ id: '5CC', source: '«»«¤«ì?«ó', capture: false }),
      netRegexCn: NetRegexes.startsUsing({ id: '5CC', source: 'ßÝìó', capture: false }),
      netRegexKo: NetRegexes.startsUsing({ id: '5CC', source: '¼¼ÀÌ·»', capture: false }),
      response: Responses.getOut(),
    },
    {
      id: 'Pharos Sirius Corrupted Crystal',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '176', count: '03' }),
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread: Stacks Explode Soon',
          de: 'Verteilen: Kristallstacks explodieren bald',
        },
      },
    },
    {
      // Not 100% sure if there's a better way to handle the callout
      id: 'Pharos Sirius Doom',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '172' }),
      infoText: (data, matches, output) => output.text!({ player: data.ShortName(matches.target) }),
      outputStrings: {
        text: {
          en: 'Heal ${player} to full',
          de: 'Heile ${player} voll',
          fr: 'Soin complet sur ${player}',
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
        'Siren': 'sirene',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Siren': '«»«¤«ì?«ó',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Siren': 'ßÝìó',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Siren': '¼¼ÀÌ·»',
      },
    },
  ],
};

export default triggerSet;
