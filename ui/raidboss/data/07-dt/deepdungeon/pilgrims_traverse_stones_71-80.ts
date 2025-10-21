import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  prowlingDeath?: 'shadowOfDeath' | 'nowhereToRun';
}

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones71_80',
  zoneId: ZoneId.PilgrimsTraverseStones71_80,
  triggers: [
    // ---------------- Stone 80 Boss: Forgiven Profanity ----------------
    // A9C9 = Roaring Ring dummy self-cast, donut + front cleave
    // A9CB = Roaring Ring dummy self-cast, donut + back cleave
    // A9CC = Roaring Ring damage cast
    // A9CD = Perilous Lair dummy self-cast, pbaoe + front cleave
    // A9CF = Perilous Lair dummy self-cast, pbaoe + back cleave
    // A9D0 = Perilous Lair damage cast
    // A9D1 = Profane Waul whiskers cleave damage cast
    // A9D3 = Prowling Death applies debuffs
    // A9D4 = Stalking Static dummy self-cast
    // AB13 = Stalking Static small line cleave
    // AC1C = Static Shock final big AoE
    {
      id: 'PT 71-80 Forgiven Profanity Roaring Ring',
      type: 'StartsUsing',
      netRegex: { id: ['A9C9', 'A9CB'], source: 'Forgiven Profanity', capture: true },
      alertText: (data, matches, output) => {
        const id = matches.id;
        let backFront;
        if (data.prowlingDeath === 'shadowOfDeath')
          backFront = id === 'A9C9' ? output.front!() : output.back!();
        else
          backFront = id === 'A9C9' ? output.back!() : output.front!();
        return output.text!({ in: output.in!(), backFront: backFront });
      },
      run: (data) => {
        delete data.prowlingDeath;
      },
      outputStrings: {
        text: {
          en: '${in} + ${backFront}',
          ko: '${backFront} + ${in}',
        },
        back: Outputs.back,
        front: Outputs.front,
        in: Outputs.in,
      },
    },
    {
      id: 'PT 71-80 Forgiven Profanity Perilous Lair',
      type: 'StartsUsing',
      netRegex: { id: ['A9CD', 'A9CF'], source: 'Forgiven Profanity', capture: true },
      alertText: (data, matches, output) => {
        const id = matches.id;
        let backFront;
        if (data.prowlingDeath === 'shadowOfDeath')
          backFront = id === 'A9CD' ? output.front!() : output.back!();
        else
          backFront = id === 'A9CD' ? output.back!() : output.front!();
        return output.text!({ out: output.out!(), backFront: backFront });
      },
      run: (data) => {
        delete data.prowlingDeath;
      },
      outputStrings: {
        text: {
          en: '${out} + ${backFront}',
          ko: '${backFront} + ${out}',
        },
        back: Outputs.back,
        front: Outputs.front,
        out: Outputs.out,
      },
    },
    {
      id: 'PT 71-80 Forgiven Profanity Stalking Static',
      type: 'StartsUsing',
      netRegex: { id: 'A9D4', source: 'Forgiven Profanity', capture: false },
      durationSeconds: 12,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid final AoE',
          ko: '마지막 장판 피해요!',
        },
      },
    },
    {
      id: 'PT 71-80 Forgiven Profanity Prowling Death',
      type: 'StartsUsing',
      netRegex: { id: 'A9D3', source: 'Forgiven Profanity', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'PT 71-80 Forgiven Profanity Prowling Death Collect',
      // 11A6 = Shadow of Death, lethal on expiration, cleanse by being hit by whiskers cleave
      // en: All who deny Light are condemned to death...
      // 11A7 = Nowhere to Run, gain stacks on movement, lethal at 8 stacks
      // en: Death approaches all who dare tread forth...
      type: 'GainsEffect',
      netRegex: { effectId: ['11A6', '11A7'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        data.prowlingDeath = matches.effectId === '11A6' ? 'shadowOfDeath' : 'nowhereToRun';
      },
    },
  ],
};

export default triggerSet;
