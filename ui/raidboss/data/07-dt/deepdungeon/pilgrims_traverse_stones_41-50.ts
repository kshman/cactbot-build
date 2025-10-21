import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones41_50',
  zoneId: ZoneId.PilgrimsTraverseStones41_50,
  triggers: [
    // ---------------- Stone 50 Boss: Ogbunabali ----------------
    {
      id: 'PT 41-50 Ogbunabali Liquefaction',
      type: 'StartsUsing',
      netRegex: { id: 'AA0B', source: 'Ogbunabali', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stand on a rock',
          ko: '바위 위로 올라서요',
        },
      },
    },
    {
      id: 'PT 41-50 Ogbunabali Sandpit',
      type: 'HeadMarker',
      netRegex: { id: '0280', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '4x Chasing AoE on YOU',
          ko: '따라오는 장판 x4',
        },
      },
    },
    {
      id: 'PT 41-50 Ogbunabali Biting Wind',
      type: 'StartsUsing',
      netRegex: { id: 'AA12', source: 'Ogbunabali', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      countdownSeconds: 5,
      response: Responses.knockback(),
    },
  ],
};

export default triggerSet;
