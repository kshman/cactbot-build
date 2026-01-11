import { AutumnDir } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutputCardinal, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  weapons: { id: string; type: 'stack' | 'healerGroups' | 'protean'; dir: number; actor: { x: number; y: number; heading: number } }[];
  weaponMechCount: number;
  domDirectionCount: {
    vertCount: number;
    horizCount: number;
    outerSafe: DirectionOutputCardinal[];
  };
}

const center = {
  x: 100,
  y: 100,
};
console.assert(center);

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM3Savage',
  zoneId: ZoneId.AacHeavyweightM3Savage,
  timelineFile: 'r10s.txt',
  initData: () => ({
    actorPositions: {},
    weapons: [],
    weaponMechCount: 0,
    domDirectionCount: {
      horizCount: 0,
      vertCount: 0,
      outerSafe: ['dirN', 'dirE', 'dirS', 'dirW'],
    },
  }),
  triggers: [
    {
      id: 'R11S ActorSetPos Tracker',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R11S Raw Steel Trophy Axe',
      type: 'StartsUsing',
      netRegex: { id: 'B422', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'R11S Raw Steel Trophy Scythe',
      type: 'StartsUsing',
      netRegex: { id: 'B423', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tank!();
        return output.party!();
      },
      outputStrings: {
        tank: Outputs.tankBusterCleaves,
        party: {
          en: 'Party Stack',
          ja: 'タンク抜きで頭割り',
          ko: '뭉쳐요 (탱크 빼고)',
        }
      },
    },
    // For logic reasons Ultimate has to be before normal Trophy Weapons
    {
      id: 'R11S Ultimate Trophy Weapons',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: ['11D1', '11D2', '11D3'], capture: true },
      condition: (data) => data.weaponMechCount > 1,
      delaySeconds: (data) => {
        if (data.weaponMechCount > 2)
          return 3.7;
        return 0;
      },
      durationSeconds: (data) => {
        if (data.weaponMechCount < 3)
          return 8.7;
        return 5;
      },
      countdownSeconds: (data) => {
        if (data.weaponMechCount < 3)
          return 8.7;
        return 5;
      },
      infoText: (_data, matches, output) => {
        const mechanic = matches.param1 === '11D1' ? 'healerGroups' : (matches.param1 === '11D2' ? 'stack' : 'protean');

        return output[mechanic]!();
      },
      run: (data) => data.weaponMechCount++,
      outputStrings: {
        healerGroups: Outputs.healerGroups,
        stack: Outputs.stackMiddle,
        protean: Outputs.protean,
      },
    },
    {
      id: 'R11S Trophy Weapons',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: ['11D1', '11D2', '11D3'], capture: true },
      condition: (data) => data.weaponMechCount < 2,
      preRun: (data, matches) => {
        const actor = data.actorPositions[matches.id];

        if (actor === undefined)
          return;

        data.weapons.push({
          id: matches.id,
          type: matches.param1 === '11D1' ? 'healerGroups' : (matches.param1 === '11D2' ? 'stack' : 'protean'),
          dir: Math.atan2(actor.x - center.x, actor.y - center.y),
          actor: actor,
        });
      },
      delaySeconds: (data) => {
        if (data.weaponMechCount === 0)
          return 0;
        if (data.weaponMechCount === 1)
          return 10.6;
        return 0;
      },
      durationSeconds: (data) => {
        if (data.weaponMechCount < 2)
          return 20.9;
        return 0;
      },
      infoText: (data, _matches, output) => {
        // Have info for 1st or 2nd mech
        if (data.weaponMechCount < 2 && data.weapons.length > 2) {
          data.weaponMechCount++;
          let candidates = data.weapons;
          data.weapons = [];

          // First weapon is the one facing towards middle
          const weapon1 = candidates.find((c) => (Math.abs(c.dir - c.actor.heading) % Math.PI) < 0.1);
          if (weapon1 === undefined)
            return;
          candidates = candidates.filter((c) => c !== weapon1);
          // remap dir to weapon1
          candidates.forEach((c) => {
            c.dir = Math.atan2(c.actor.x - weapon1.actor.x, c.actor.y - weapon1.actor.y);
          });
          // second weapon is facing first weapon
          const weapon2 = candidates.find((c) => (Math.abs(c.dir - c.actor.heading) % Math.PI) < 0.1);
          // third weapon is the last remaining one
          const weapon3 = candidates.find((c) => c !== weapon2);
          if (weapon2 === undefined || weapon3 === undefined)
            return;
          return output.text!({
            weapon1: output[weapon1.type]!(),
            weapon2: output[weapon2.type]!(),
            weapon3: output[weapon3.type]!(),
          });
        }
      },
      outputStrings: {
        text: {
          en: '${weapon1} => ${weapon2} => ${weapon3}',
          ja: '${weapon1} 🔜 ${weapon2} 🔜 ${weapon3}',
          ko: '${weapon1} 🔜 ${weapon2} 🔜 ${weapon3}',
        },
        healerGroups: Outputs.healerGroups,
        stack: Outputs.stackMiddle,
        protean: Outputs.protean,
      },
    },
    {
      // Adapted from normal mode
      id: 'R11S Dance Of Domination Trophy',
      type: 'StartsUsingExtra',
      netRegex: { id: 'B7BC', capture: true },
      preRun: (data, matches) => {
        // Determine whether the AoE is orthogonal or diagonal
        // Discard diagonal headings, then count orthogonals.
        const headingDirNum = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        if (headingDirNum % 2 === 0) {
          const isVert = headingDirNum % 4 === 0;
          const isHoriz = headingDirNum % 4 === 2;
          if (isVert) {
            data.domDirectionCount.vertCount += 1;
            if (parseFloat(matches.x) < center.x - 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) => dir !== 'dirW');
            else if (parseFloat(matches.x) > center.x + 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) => dir !== 'dirE');
          } else if (isHoriz) {
            data.domDirectionCount.horizCount += 1;
            if (parseFloat(matches.y) < center.y - 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) => dir !== 'dirN');
            else if (parseFloat(matches.y) > center.y + 5)
              data.domDirectionCount.outerSafe = data.domDirectionCount.outerSafe.filter((dir) => dir !== 'dirS');
          } else {
            console.error(`Bad Domination heading data: ${matches.heading}`);
          }
        }
      },
      infoText: (data, _matches, output) => {
        if (data.domDirectionCount.outerSafe.length !== 1)
          return;

        const outerSafeDir = data.domDirectionCount.outerSafe[0];

        if (outerSafeDir === undefined)
          return;

        if (data.domDirectionCount.vertCount === 1)
          return output.northSouth!({ dir: output[outerSafeDir]!() });
        else if (data.domDirectionCount.horizCount === 1)
          return output.eastWest!({ dir: output[outerSafeDir]!() });
      },
        // clear the safe dirs array to prevent further outputs
      run: (data) => {
        if (data.domDirectionCount.outerSafe.length === 1)
          data.domDirectionCount.outerSafe = [];
      },
      outputStrings: {
        northSouth: {
          en: 'N/S Mid / ${dir} Outer + Partner Stacks',
          ja: '南北 / ${dir} 外 + ペア',
          ko: '남북 / ${dir} + 페어',
        },
        eastWest: {
          en: 'E/W Mid / ${dir} Outer + Partner Stacks',
          ja: '東西 / ${dir} 外 + ペア',
          ko: '동서 / ${dir} + 페어',
        },
        ...AutumnDir.stringsAimPlus,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'replaceSync': {
        'Comet': 'コメット',
        'The Tyrant': 'ザ・タイラント',
      },
    },
  ],
};

export default triggerSet;
