import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Palace of the Dead Floors 031-040

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.ThePalaceOfTheDeadFloors31_40,

  triggers: [
    // ---------------- Floor 031-039 Mobs ----------------
    {
      id: 'PotD 031-040 Nightmare Eye Eyes on Me',
      // untelegraphed roomwide AoE
      type: 'StartsUsing',
      netRegex: { id: '18E2', source: 'Nightmare Eye', capture: false },
      response: Responses.aoe(),
    },
    // ---------------- Floor 40 Boss: Ixtab ----------------
    {
      id: 'PotD 031-040 Ixtab Adds Spawn',
      // 5030 = Nightmare Bhoot
      type: 'AddedCombatant',
      netRegex: { npcNameId: '5030', capture: false },
      suppressSeconds: 1,
      response: Responses.killAdds('alert'),
    },
  ],
};

export default triggerSet;