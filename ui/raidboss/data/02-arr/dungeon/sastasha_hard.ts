import Outputs from '../../../../../resources/outputs';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'SastashaHard',
  zoneId: ZoneId.SastashaHard,
  triggers: [
    {
      id: 'Sastasha Hard Slime',
      type: 'GainsEffect',
      netRegex: { effectId: '239' },
      condition: (data) => data.CanCleanse(),
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.target) }),
      outputStrings: {
        text: {
          en: 'Esuna ${player}',
          ja: '${player} にエスナ',
          ko: '에스나: ${player}',
        },
      },
    },
    {
      id: 'Sastasha Hard Tail Screw',
      type: 'StartsUsing',
      netRegex: { id: 'BF4', source: 'Karlabos' },
      alertText: (data, matches, output) => {
        if (data.CanStun())
          return output.stun!({ name: matches.source });
      },
      infoText: (data, matches, output) => {
        return output.tailScrewOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        stun: Outputs.stunTarget,
        tailScrewOn: {
          en: 'Tail Screw on ${player}',
          ja: '${player} にテールスクリュー',
          ko: '테일 스크류: ${player}',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Karlabos': 'Karlabos',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Karlabos': 'Karlabos',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Karlabos': 'カーラボス',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Karlabos': '真红龙虾',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Karlabos': '棘刺殼蝦',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Karlabos': '칼라보스',
      },
    },
  ],
};

export default triggerSet;
