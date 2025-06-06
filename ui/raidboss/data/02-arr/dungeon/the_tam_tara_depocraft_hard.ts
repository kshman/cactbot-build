import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'TheTamTaraDeepcroftHard',
  zoneId: ZoneId.TheTamTaraDeepcroftHard,
  triggers: [
    {
      id: 'Tam-Tara Hard Inhumanity',
      type: 'Ability',
      netRegex: { id: '956', source: 'Liavinne', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack (ignore adds)',
          ja: '頭割り (雑魚無視)',
          ko: '뭉쳐요 (쫄은 무시)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Liavinne': 'Liavinne',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Liavinne': 'Liavinne la dame d\'honneur',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Liavinne': '立会人リアヴィヌ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Liavinne': '证婚人 莉亚维娜',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Liavinne': '입회인 리아빈',
      },
    },
  ],
};

export default triggerSet;
