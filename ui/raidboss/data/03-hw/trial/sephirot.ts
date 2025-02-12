import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'ContainmentBayS1T7',
  zoneId: ZoneId.ContainmentBayS1T7,
  triggers: [
    {
      id: 'Sephirot Fiendish Rage',
      type: 'HeadMarker',
      netRegex: { id: '0048' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Sephirot Ratzon',
      type: 'HeadMarker',
      netRegex: { id: '0046' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Sephirot Ain',
      type: 'StartsUsing',
      netRegex: { id: '16DD', source: 'Sephirot', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Sephirot Earth Shaker',
      type: 'HeadMarker',
      netRegex: { id: '0028' },
      condition: Conditions.targetIsYou(),
      response: Responses.earthshaker(),
    },
    {
      // The coordinates for skill are inconsistent and can't be used to
      // reliably determine the position of the knockback.
      id: 'Sephirot Pillar of Mercy',
      type: 'StartsUsing',
      netRegex: { id: '16EA', source: 'Sephirot', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Sephirot Storm of Words Revelation',
      type: 'StartsUsing',
      netRegex: { id: '16EC', source: 'Storm of Words', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill Storm of Words or die',
          de: 'Wörtersturm besiegen',
          fr: 'Tuez Tempête de mots ou mourrez',
          ja: 'ストーム・オブ・ワードを倒す',
          cn: '击杀言语风暴!',
          ko: '뒤쪽 스톰(신언의 폭풍) 잡아요',
        },
      },
    },
    {
      id: 'Sephirot Malkuth',
      type: 'StartsUsing',
      netRegex: { id: '16EB', source: 'Sephirot', capture: false },
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Sephirot': 'Sephirot',
        'Storm of Words': 'Wörtersturm',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Sephirot': 'Sephirot',
        'Storm of Words': 'tempête de mots',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Sephirot': 'セフィロト',
        'Storm of Words': 'ストーム・オブ・ワード',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Sephirot': '萨菲洛特',
        'Storm of Words': '言语风暴',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Sephirot': '세피로트',
        'Storm of Words': '신언의 폭풍',
      },
    },
  ],
};

export default triggerSet;
