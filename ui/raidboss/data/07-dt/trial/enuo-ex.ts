import Autumn, { AutumnDir, AutumnMoks } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutput8, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Positions8 = DirectionOutput8 | 'middle';

export interface Data extends RaidbossData {
  gazeDir: 'CW' | 'CCW';
  gazeOrbs: {
    tankOrb: boolean;
    color: 'light' | 'dark';
  }[];
  returnToNothingType: 'unknown' | 'healerStacks' | 'stack';
  naughtGrowsPositions: {
    pos: Positions8;
    type: 'aoe' | 'donut';
  }[];
  passageOfNaughtPositions: {
    x: number;
    y: number;
    heading: number;
    type: 'small' | 'big';
  }[];
  passageOfNaughtCounter: number;
  flareTargets: string[];
  actorPositions: { [id: string]: { x: number; y: number } };
  addPhasePositions: ('tower' | 'empty')[];
  addPhaseConeTargets: string[];
}

const center = {
  x: 100,
  y: 100,
} as const;

const moksToStrategyNo = (moks: AutumnMoks) => {
  if (Autumn.isTank(moks))
    return 1;
  if (Autumn.isHealer(moks))
    return 2;
  if (Autumn.isDpsMelee(moks))
    return 3;
  return 4;
};

const moksToTurbulenceNo = (moks: AutumnMoks) => {
  if (moks === 'MT' || moks === 'D1')
    return 1;
  if (moks === 'ST' || moks === 'D2')
    return 2;
  if (moks === 'H1' || moks === 'D3')
    return 3;
  if (moks === 'H2' || moks === 'D4')
    return 4;
  return 0;
};

const calcOppositePosition8 = (pos: Positions8): Positions8 => {
  if (pos === 'middle')
    return 'middle';
  return Directions.output8Dir[(Directions.output8Dir.indexOf(pos) + 4) % 8] ?? 'unknown';
};

// Get a sparsely populated array indicating the 16-dir positions for each mechanic in add phase
const getEmptyAddPhaseData = () => {
  const ret: Data['addPhasePositions'] = [];

  for (let i = 0; i < 8; ++i) {
    ret[i] = 'empty';
  }

  return ret;
};

const adjustDirNum = (pos: number, by: number, max: number) => {
  return (pos + max + by) % max;
};

const triggerSet: TriggerSet<Data> = {
  id: 'TheUnmakingExtreme',
  zoneId: ZoneId.TheUnmakingExtreme,
  timelineFile: 'enuo-ex.txt',
  initData: () => ({
    gazeDir: 'CW',
    gazeOrbs: [],
    returnToNothingType: 'unknown',
    naughtGrowsPositions: [],
    passageOfNaughtPositions: [],
    passageOfNaughtCounter: 0,
    flareTargets: [],
    actorPositions: {},
    addPhasePositions: getEmptyAddPhaseData(),
    addPhaseConeTargets: [],
  }),
  triggers: [
    {
      id: 'EnuoEx AddedCombatant Tracker',
      type: 'AddedCombatant',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
        },
    },
    {
      id: 'EnuoEx Meteorain',
      type: 'StartsUsing',
      netRegex: { id: 'C381', source: 'Enuo', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'EnuoEx Almagest',
      type: 'StartsUsing',
      netRegex: { id: 'C334', source: 'Enuo', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'EnuoEx Lightless World',
      type: 'StartsUsing',
      netRegex: { id: 'C36D', source: 'Enuo', capture: false },
      response: Responses.bigAoe(),
    },

    {
      id: 'EnuoEx Naught Grows Collector',
      type: 'StartsUsingExtra',
      netRegex: { id: ['C339', 'C33A', 'C33B', 'C33C'], capture: true },
      preRun: (data, matches) => {
        let dir: Positions8;

        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);

        const type = ['C339', 'C33B'].includes(matches.id) ? 'aoe' : 'donut';

        if (Math.abs(x - center.x) < 1 && Math.abs(y - center.y) < 1) {
          dir = 'middle';
        } else {
          dir = Directions.xyTo8DirOutput(x, y, center.x, center.y);
        }
        data.naughtGrowsPositions.push({
          pos: dir,
          type: type,
        });
      },
      delaySeconds: 0.5,
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.naughtGrowsPositions.length === 0)
          return;

        const [pos1, pos2] = data.naughtGrowsPositions;
        // Clear data here instead of in run due to variable count of entries
        data.naughtGrowsPositions = [];

        if (pos1 === undefined)
          return;

        const mech = output[data.returnToNothingType]!();

        // Two possible patterns: Single, Under Boss, Under Void
        // Single
        if (pos2 === undefined) {
          const dir = pos1.type === 'aoe' ? calcOppositePosition8(pos1.pos) : pos1.pos;
          return output.move!({ dir: output[dir]!(), mech: mech });
        }

        const middleDir = pos2.pos === 'middle' ? pos2 : pos1;
        const voidDir = pos1.pos === 'middle' ? pos2 : pos1;
        // Under Boss
        if (middleDir.type === 'donut') {
          return output.under!({
            dir: output[calcOppositePosition8(voidDir.pos)]!(),
            mech: mech,
          });
        }
        return output.move!({ dir: output[voidDir.pos]!(), mech: mech });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        middle: Outputs.middle,
        healerStacks: {
          en: '4:4 stacks',
          ko: '4:4 뭉쳐요',
        },
        stack: {
          en: 'Stacks',
          ko: '모두 뭉쳐요',
        },
        move: {
          en: '${dir} + ${mech}',
          ko: '${dir} + ${mech}',
        },
        under: {
          en: 'Under Boss + ${dir} + ${mech}',
          ko: '보스 밑 ${dir} + ${mech}',
        },
      },
    },
    {
      id: 'EnuoEx Return to Nothing Headmarker',
      type: 'HeadMarker',
      netRegex: { id: '02BD', capture: false },
      run: (data) => data.returnToNothingType = 'healerStacks',
    },
    {
      id: 'EnuoEx Greater Return to Nothing Headmarker',
      type: 'HeadMarker',
      netRegex: { id: '02BE', capture: false },
      run: (data) => data.returnToNothingType = 'stack',
    },
    {
      id: 'EnuoEx Meltdown',
      type: 'StartsUsing',
      netRegex: { id: 'C378', source: 'Enuo', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Puddles => Stop Moving => Spread',
          ko: '보스 밑으로 + 장판 버려요',
        },
      },
    },
    /* {
      id: 'EnuoEx Meltdown Chains of Condemnation',
      type: 'Ability',
      netRegex: { id: 'C378', source: 'Enuo', capture: false },
      durationSeconds: 5,
      suppressSeconds: 5,
      // 2 second debuff, then spread
      countdownSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stop Moving => Spread',
          ko: '⛔️멈추고! 🔜 흩어져요',
        },
      },
    }, */
    {
      id: 'EnuoEx Meltdown Stop',
      type: 'GainsEffect',
      netRegex: { effectId: '11D2', source: 'Enuo', capture: false },
      durationSeconds: 2,
      suppressSeconds: 2,
      countdownSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stop moving',
          ko: '⛔️멈춰요!',
        },
      },
    },
    {
      id: 'EnuoEx Meltdown Spread',
      type: 'LosesEffect',
      netRegex: { effectId: '11D2', source: 'Enuo', capture: false },
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread out',
          ko: '밖으로 🔜 흩어져요',
        },
      },
    },
    {
      id: 'EnuoEx Airy Emptiness',
      type: 'StartsUsing',
      netRegex: { id: 'C370', source: 'Enuo', capture: false },
      response: Responses.stackPartner(),
    },
    {
      id: 'EnuoEx Dense Emptiness',
      type: 'StartsUsing',
      netRegex: { id: 'C371', source: 'Enuo', capture: false },
      // Not sure if this targets healers or tanks, but this accomplishes the same thing
      response: Responses.healerGroups(),
    },

    {
      id: 'EnuoEx Gaze of the Void CW',
      type: 'StartsUsing',
      netRegex: { id: 'C353', source: 'Enuo', capture: false },
      run: (data) => data.gazeDir = 'CW',
    },
    {
      id: 'EnuoEx Gaze of the Void CCW',
      type: 'StartsUsing',
      netRegex: { id: 'C354', source: 'Enuo', capture: false },
      run: (data) => data.gazeDir = 'CCW',
    },
    {
      id: 'EnuoEx Gaze of the Void',
      type: 'StartsUsingExtra',
      netRegex: { id: 'C355', capture: true },
      delaySeconds: 0.2,
      durationSeconds: 11.3,
      suppressSeconds: 30,
      infoText: (data, matches, output) => {
        const coneDir = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        let startDir;
        let endDir;
        data.gazeOrbs = [];
        for (let i = 0; i < 8; ++i)
          data.gazeOrbs.push({ color: 'light', tankOrb: i === coneDir });
        if (data.gazeDir === 'CW') {
          startDir = ((coneDir + 8) - 1) % 8;
          endDir = (coneDir + 2) % 8;
          const orb = data.gazeOrbs[(coneDir + 1) % 8];
          if (orb === undefined)
            return;
          orb.tankOrb = true;
        } else {
          startDir = (coneDir + 1) % 8;
          endDir = ((coneDir + 8) - 2) % 8;
          const orb = data.gazeOrbs[((coneDir + 8) - 1) % 8];
          if (orb === undefined)
            return;
          orb.tankOrb = true;
        }
        return output.text!({
          rotation: output[data.gazeDir]!(),
          dir1: output[Directions.output8Dir[startDir] ?? 'unknown']!(),
          dir2: output[Directions.output8Dir[endDir] ?? 'unknown']!(),
        });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        CW: Outputs.clockwise,
        CCW: Outputs.counterclockwise,
        text: {
          en: '${dir1} ${rotation} => ${dir2}',
          ko: '${dir1} ${rotation} 🔜 ${dir2}',
        },
      },
    },
    {
      id: 'EnuoEx Gaze Orb Tether Collector',
      type: 'Tether',
      netRegex: { id: '0196', capture: true },
      preRun: (data, matches) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return;

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const orb = data.gazeOrbs[dirNum];

        if (orb === undefined)
          return;

        orb.color = 'dark';
      },
      infoText: (data, _matches, output) => {
        // Wait until we have all 4 tethers
        if (data.gazeOrbs.filter((orb) => orb.color === 'dark').length < 4) {
          return;
        }

        const strategy = moksToStrategyNo(data.moks);

        const orbs = [...data.gazeOrbs, ...data.gazeOrbs];

        let firstTankOrb = 0;

        for (let i = 0; i < orbs.length; ++i) {
          if (orbs[i]?.tankOrb === true && orbs[i + 1]?.tankOrb === true) {
            firstTankOrb = i;
            break;
          }
        }

        if (strategy === 1) {
          return output.tankOrbsDir!({
            dir: output[Directions.output16Dir[(firstTankOrb * 2) + 1] ?? 'unknown']!(),
          });
        }

        let trimmedOrbs = orbs.slice(firstTankOrb, firstTankOrb + 8);

        const orb1Light = trimmedOrbs.findIndex((orb) => orb.color === 'light');
        const orb1Dark = trimmedOrbs.findIndex((orb) => orb.color === 'dark');

        trimmedOrbs = trimmedOrbs.filter((_orb, index) =>
          index !== orb1Light && index !== orb1Dark
        );

        const orb2Light = trimmedOrbs.findIndex((orb) => orb.color === 'light');
        const orb2Dark = trimmedOrbs.findIndex((orb) => orb.color === 'dark');

        trimmedOrbs = trimmedOrbs.filter((_orb, index) =>
          index !== orb2Light && index !== orb2Dark
        );

        const orb3Light = trimmedOrbs.findIndex((orb) => orb.color === 'light');
        const orb3Dark = trimmedOrbs.findIndex((orb) => orb.color === 'dark');

        trimmedOrbs = trimmedOrbs.filter((_orb, index) =>
          index !== orb3Light && index !== orb3Dark
        );

        const orb4Light = trimmedOrbs.findIndex((orb) => orb.color === 'light');
        const orb4Dark = trimmedOrbs.findIndex((orb) => orb.color === 'dark');

        switch (strategy) {
          /* case 1:
            return output.orbSoaks!({
              dir1: output[Directions.output8Dir[(firstTankOrb + orb1Light) % 8] ?? 'unknown']!(),
              dir2: output[Directions.output8Dir[(firstTankOrb + orb1Dark) % 8] ?? 'unknown']!(),
            });*/
          case 2:
            return output.orbSoaks!({
              dir1:
                output[Directions.output8Dir[(firstTankOrb + orb2Light + 2) % 8] ?? 'unknown']!(),
              dir2:
                output[Directions.output8Dir[(firstTankOrb + orb2Dark + 2) % 8] ?? 'unknown']!(),
            });
          case 3:
            return output.orbSoaks!({
              dir1:
                output[Directions.output8Dir[(firstTankOrb + orb3Light + 4) % 8] ?? 'unknown']!(),
              dir2:
                output[Directions.output8Dir[(firstTankOrb + orb3Dark + 4) % 8] ?? 'unknown']!(),
            });
          case 4:
            return output.orbSoaks!({
              dir1:
                output[Directions.output8Dir[(firstTankOrb + orb4Light + 6) % 8] ?? 'unknown']!(),
              dir2:
                output[Directions.output8Dir[(firstTankOrb + orb4Dark + 6) % 8] ?? 'unknown']!(),
            });
          default:
            return output.unknown!();
        }
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        unknown: Outputs.unknown,
        tankOrbsDir: {
          en: 'Tank orbs ${dir}',
          ko: '탱크 구슬: ${dir}',
        },
        orbSoaks: {
          en: '${dir1} => ${dir2}',
          ko: '${dir1} 🔜 ${dir2}',
        },
      },
    },
    {
      id: 'EnuoEx Silent Torrent',
      type: 'StartsUsingExtra',
      netRegex: { id: 'C34B', capture: true },
      infoText: (_data, matches, output) => {
        // C34B is the short line. Safe spots are (clockwise):
        // +6 far
        // +7 medium
        // +8 short
        // +9 short
        // +10 short
        // +11 medium
        // +12 far

        // Due to needing to bait Meltdown puddles later, just call the close safe position
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const dangerDirNum = Directions.xyTo8DirNum(x, y, center.x, center.y);
        const closeDirNum = Directions.output8Dir[(dangerDirNum + 9) % 8] ?? 'unknown';

        return output.text!({
          dir3: output[closeDirNum]!(),
        });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        text: {
          en: '${dir3} Close',
          ko: '${dir3} 가까이',
        },
      },
    },
    {
      id: 'EnuoEx Deep Freeze',
      type: 'StartsUsing',
      netRegex: { id: 'C37C', source: 'Enuo', capture: true },
      preRun: (data, matches) => {
        data.flareTargets.push(matches.target);
      },
      delaySeconds: 0.1,
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.flareTargets.length < 2)
          return;
        if (data.flareTargets.includes(data.me))
          return output.tankFlareOnYou!();
        return output.awayFromFlares!();
      },
      run: (data) => {
        data.flareTargets = [];
      },
      outputStrings: {
        tankFlareOnYou: {
          en: 'Tank Flare on YOU => Keep Moving',
          ko: '내게 탱크 플레어 🔜 계속 움직여요',
        },
        awayFromFlares: {
          en: 'Away from tank flares => Keep Moving',
          ko: '플레어 피하면서 🔜 계속 움직여요',
        },
      },
    },
    {
      id: 'EnuoEx Deep Freeze Move Reminder',
      type: 'StartsUsing',
      netRegex: { id: 'C37B', source: 'Enuo', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      durationSeconds: 3,
    },
    {
      id: 'EnuoEx Looming Emptiness',
      type: 'StartsUsing',
      netRegex: { id: 'C33E', source: 'Looming Shadow', capture: false },
      response: Responses.knockback(),
    },
    // Empty Shadow = towers
    // Voidal Turblence C374 = self cast for cones. Actual cone hits are instant cast C376
    // Use headmarker 02D1 to ID targets instead. C374 is after last headmarker goes out,
    // but add 0.1s delay to allow for potential lag
    {
      id: 'EnuoEx Empty Shadow Collector',
      type: 'StartsUsingExtra',
      netRegex: { id: 'C35D', capture: true },
      run: (data, matches) => {
        const dirNum = Directions.xyTo16DirNum(
          parseFloat(matches.x),
          parseFloat(matches.y),
          center.x,
          center.y,
        );
        data.addPhasePositions[Math.floor(dirNum / 2)] = 'tower';
      },
    },
    {
      id: 'EnuoEx Voidal Turbulence Headmarker Collector',
      type: 'HeadMarker',
      netRegex: { id: '02D1', capture: true },
      run: (data, matches) => {
        data.addPhaseConeTargets.push(matches.target);
      },
    },
    {
      id: 'EnuoEx Voidal Turbulence',
      type: 'StartsUsing',
      netRegex: { id: 'C374', source: 'Looming Shadow', capture: false },
      delaySeconds: 0.1,
      infoText: (data, _matches, output) => {
        const strategy = moksToTurbulenceNo(data.moks);
        const cone = data.addPhaseConeTargets.includes(data.me);

        if (strategy === 0) {
          if (cone)
            return output.cone!();
          return output.tower!();
        }

        const used: number[] = [];

        const pos1Tower = data.addPhasePositions.findIndex((pos) => pos === 'tower');
        const pos1Cone = data.addPhasePositions.findIndex((pos) => pos === 'empty');

        used.push(pos1Tower, pos1Cone);

        const pos2Tower = data.addPhasePositions.findIndex((pos, index) =>
          pos === 'tower' && !used.includes(index)
        );
        const pos2Cone = data.addPhasePositions.findIndex((pos, index) =>
          pos === 'empty' && !used.includes(index)
        );

        used.push(pos2Tower, pos2Cone);

        const pos3Tower = data.addPhasePositions.findIndex((pos, index) =>
          pos === 'tower' && !used.includes(index)
        );
        const pos3Cone = data.addPhasePositions.findIndex((pos, index) =>
          pos === 'empty' && !used.includes(index)
        );

        used.push(pos3Tower, pos3Cone);

        const pos4Tower = data.addPhasePositions.findIndex((pos, index) =>
          pos === 'tower' && !used.includes(index)
        );
        const pos4Cone = data.addPhasePositions.findIndex((pos, index) =>
          pos === 'empty' && !used.includes(index)
        );

        switch (strategy) {
          case 1:
            if (cone)
              return output.conePos!({
                dir: output[Directions.output8Dir[pos1Cone] ?? 'unknown']!(),
              });
            return output.towerPos!({
              dir: output[Directions.output8Dir[pos1Tower] ?? 'unknown']!(),
            });
          case 2:
            if (cone)
              return output.conePos!({
                dir: output[Directions.output8Dir[pos2Cone] ?? 'unknown']!(),
              });
            return output.towerPos!({
              dir: output[Directions.output8Dir[pos2Tower] ?? 'unknown']!(),
            });
          case 3:
            if (cone)
              return output.conePos!({
                dir: output[Directions.output8Dir[pos3Cone] ?? 'unknown']!(),
              });
            return output.towerPos!({
              dir: output[Directions.output8Dir[pos3Tower] ?? 'unknown']!(),
            });
          case 4:
            if (cone)
              return output.conePos!({
                dir: output[Directions.output8Dir[pos4Cone] ?? 'unknown']!(),
              });
            return output.towerPos!({
              dir: output[Directions.output8Dir[pos4Tower] ?? 'unknown']!(),
            });
          default:
            return output.unknown!();
        }
      },
      run: (data) => {
        data.addPhaseConeTargets = [];
        data.addPhasePositions = getEmptyAddPhaseData();
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        unknown: Outputs.unknown,
        cone: {
          en: 'Cone on YOU',
          ko: '꼬깔 유도해요',
        },
        tower: {
          en: 'Soak Tower',
          ko: '타워 밟아요',
        },
        conePos: {
          en: 'Aim Cone ${dir}',
          ko: '꼬깔 유도: ${dir}',
        },
        towerPos: {
          en: 'Soak Tower ${dir}',
          ko: '타워: ${dir}',
        },
      },
    },
    {
      id: 'EnuoEx Curse of the Flesh',
      type: 'Ability',
      netRegex: { id: 'C369', source: 'Soothing Shadow', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.cleanse!(),
      outputStrings: {
        cleanse: {
          en: 'Cleanse Debuff',
          ko: '에스나!',
        },
      },
    },
    {
      id: 'EnuoEx Drain Touch',
      type: 'StartsUsing',
      netRegex: { id: 'C362', source: 'Protective Shadow', capture: true },
      condition: (data) => data.role === 'tank',
      suppressSeconds: 1,
      response: Responses.interrupt(),
    },
    {
      id: 'EnuoEx Weight of Nothing',
      type: 'StartsUsing',
      netRegex: { id: 'C365', source: 'Protective Shadow', capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.tankCleave(),
    },
    {
      id: 'EnuoEx Demon Eye',
      type: 'StartsUsing',
      netRegex: { id: 'C366', source: 'Aggressive Shadow', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.lookMiddle!(),
      outputStrings: {
        lookMiddle: {
          en: 'Look Middle',
          ko: '한가운데 바라봐요',
        },
      },
    },
    {
      id: 'EnuoEx Beacon in the Dark',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '14754', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Attack the Beacon',
          ko: '거울 매우처요!',
        },
      },
    },

    {
      id: 'EnuoEx Passage of Naught',
      type: 'StartsUsingExtra',
      netRegex: { id: ['C341', 'C342', 'C343'], capture: true },
      preRun: (data, matches) => {
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const heading = parseFloat(matches.heading);
        const size = matches.id === 'C341' ? 'big' : 'small';
        data.passageOfNaughtPositions.push({ x: x, y: y, heading: heading, type: size });
        data.passageOfNaughtCounter += size === 'big' ? 2 : 1;
      },
      infoText: (data, _matches, output) => {
        if (data.passageOfNaughtCounter < 4)
          return;

        const [line1, line2, line3, line4] = data.passageOfNaughtPositions;

        // Reset here due to variable amount of entries
        data.passageOfNaughtPositions = [];
        data.passageOfNaughtCounter = 0;

        if (line1 === undefined || line2 === undefined)
          return;

        // Two "big" lines
        if (line3 === undefined) {
          // On cardinals
          if (Directions.hdgTo8DirNum(line1.heading) % 2 === 0) {
            return output.intercards!();
          }
          return output.cardinals!();
        }

        // Four "small" lines
        if (line4 !== undefined)
          return output.under!();

        // We're only concerned with the "big" line, as max melee perpindicular to that line will be safe
        const big = line1.type === 'big' ? line1 : (line2.type === 'big' ? line2 : line3);

        const bigDirNum = Directions.xyTo8DirNum(big.x, big.y, center.x, center.y);

        const safe1 = adjustDirNum(bigDirNum, 2, 8);
        const safe2 = adjustDirNum(bigDirNum, 6, 8);

        // Sort directions N CW

        const safe1Sorted = safe1 > safe2 ? safe2 : safe1;
        const safe2Sorted = safe1 === safe1Sorted ? safe2 : safe1;

        return output.go!({
          dir1: output[Directions.output8Dir[safe1Sorted] ?? 'unknown']!(),
          dir2: output[Directions.output8Dir[safe2Sorted] ?? 'unknown']!(),
        });
      },
      outputStrings: {
        ...AutumnDir.stringMarker1A2Dir,
        intercards: Outputs.intercards,
        cardinals: Outputs.cardinals,
        under: Outputs.goIntoMiddle,
        go: {
          en: 'Go ${dir1} / ${dir2}',
          ko: '안전: ${dir1} / ${dir2}',
        },
      },
    },
    {
      id: 'EnuoEx Shrouded Holy',
      type: 'StartsUsing',
      netRegex: { id: 'C37D', source: 'Enuo', capture: false },
      response: Responses.healerGroups(),
    },
    {
      id: 'EnuoEx Dimension Zero',
      type: 'StartsUsing',
      netRegex: { id: 'C37F', source: 'Enuo', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stacks x3',
          ko: '뭉쳐요 x3',
        },
      },
    },
    {
      id: 'EnuoEx Naught Hunts Tether',
      type: 'Tether',
      netRegex: { id: ['0194', '0195'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 13.8,
      suppressSeconds: 8,
      countdownSeconds: 13.8,
      infoText: (_data, _matches, output) => output.chasingPuddle!(),
      outputStrings: {
        chasingPuddle: {
          en: 'Chasing puddle on you',
          ko: '내게 장판이 따라와요!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Aggressive Shadow': 'strafend(?:e|er|es|en) Hand',
        'Enuo': 'Enuo',
        'Looming Shadow': 'groß(?:e|er|es|en) Nichts-Silhouette',
        'Protective Shadow': 'beschützend(?:e|er|es|en) Hand',
        'Soothing Shadow': 'heilend(?:e|er|es|en) Hand',
        '(?<! )Void': 'Nichtswirbel',
        'Yawning Void': 'groß(?:e|er|es|en) Nichtswirbel',
      },
      'replaceText': {
        'Airy Emptiness': 'Streuende Welle',
        'All for Naught': 'Nichts-Territorium',
        'Almagest': 'Almagest',
        'Curse of the Flesh': 'Miasma-Fluch',
        'Deep Freeze': 'Tiefenfrost',
        'Demon Eye': 'Dämonenauge',
        'Dense Emptiness': 'Sammelnde Welle',
        'Dimension Zero': 'Dimension Null',
        'Empty Shadow': 'Last der Leere',
        'Endless Chase': 'Suchende Welle',
        'Gaze of the Void': 'Chaotischer Strom',
        'Great Return to Nothing': 'Große Welle der Wiederkehr',
        'Lightless World': 'Lichtlose Welt',
        'Looming Emptiness': 'Schwere Last der Leere',
        'Meltdown': 'Komplettschmelze',
        'Meteorain': 'Meteorregen',
        'Naught Grows': 'Anschwellen des Nichts',
        'Naught Hunts': 'Verfolgung des Nichts',
        'Nothingness': 'Welle der Leere',
        'Passage of Naught': 'Sammelwelle',
        '(?<! )Return to Nothing': 'Welle der Wiederkehr',
        'Shrouded Holy': 'Schattenheiligtum',
        'Silent Torrent': 'Reißender Strom',
        'Voidal Turbulence': 'Nichtsstrudel',
        'Weight of Nothing': 'Hochdruckwelle',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Aggressive Shadow': 'main assaillante de l\'ombre insondable',
        'Enuo': 'Énuo',
        'Looming Shadow': 'grande ombre insondable',
        'Protective Shadow': 'main protectrice de l\'ombre insondable',
        'Soothing Shadow': 'main guérisseuse de l\'ombre insondable',
        '(?<! )Void': 'vortex de néant',
        'Yawning Void': 'grand vortex de néant',
      },
      'replaceText': {
        'Airy Emptiness': 'Onde diffusée',
        'All for Naught': 'Domaine du néant',
        'Almagest': 'Almageste',
        'Curse of the Flesh': 'Malédiction pathogène',
        'Deep Freeze': 'Congélation ancestrale',
        'Demon Eye': 'Œil diabolique',
        'Dense Emptiness': 'Onde concentrée',
        'Dimension Zero': 'Dimension zéro',
        'Empty Shadow': 'Impact de vacuité',
        'Endless Chase': 'Néant traqueur',
        'Gaze of the Void': 'Torrents chaotiques',
        'Great Return to Nothing': 'Grande onde régressive',
        'Lightless World': 'Monde sans Lumière',
        'Looming Emptiness': 'Grand impact de vacuité',
        'Meltdown': 'Fusion ancestrale',
        'Meteorain': 'Pluie de météorites',
        'Naught Grows': 'Abcès du néant',
        'Naught Hunts': 'Poursuite du néant',
        'Nothingness': 'Rayon du néant',
        'Passage of Naught': 'Onde accumulatrice',
        '(?<! )Return to Nothing': 'Onde régressive',
        'Shrouded Holy': 'Miracle d\'ombre',
        'Silent Torrent': 'Flot d\'énergie',
        'Voidal Turbulence': 'Maelström du néant',
        'Weight of Nothing': 'Onde de particules haute tension',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Aggressive Shadow': '虚ろなる影の攻め手',
        'Enuo': 'エヌオー',
        'Looming Shadow': '虚ろなる巨影',
        'Protective Shadow': '虚ろなる影の護り手',
        'Soothing Shadow': '虚ろなる影の癒し手',
        '(?<! )Void': '無の渦',
        'Yawning Void': '無の大渦',
      },
      'replaceText': {
        'Airy Emptiness': '拡散波動',
        'All for Naught': '無の領域',
        'Almagest': 'アルマゲスト',
        'Curse of the Flesh': '病の呪詛',
        'Deep Freeze': 'ディープフリーズ',
        'Demon Eye': '悪魔の瞳',
        'Dense Emptiness': '集束波動',
        'Dimension Zero': 'ディメンションゼロ',
        'Empty Shadow': '虚ろなる衝撃',
        'Endless Chase': '追尾波動',
        'Gaze of the Void': '混沌の激流',
        'Great Return to Nothing': '回帰の重波動',
        'Lightless World': 'ライトレス・ワールド',
        'Looming Emptiness': '虚ろなる大衝撃',
        'Meltdown': 'メルトダウン',
        'Meteorain': 'メテオレイン',
        'Naught Grows': '無の肥大',
        'Naught Hunts': '無の追跡',
        'Nothingness': '無の波動',
        'Passage of Naught': '集積波動',
        '(?<! )Return to Nothing': '回帰の波動',
        'Shrouded Holy': 'シャドウホーリー',
        'Silent Torrent': '奔流',
        'Voidal Turbulence': '無の渦流',
        'Weight of Nothing': '高圧波動',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Aggressive Shadow': '虚无之攻影',
        'Enuo': '恩欧',
        'Looming Shadow': '虚无巨影',
        'Protective Shadow': '虚无之防影',
        'Soothing Shadow': '虚无之疗影',
        '(?<! )Void': '无之漩涡',
        'Yawning Void': '无之巨漩涡',
      },
      'replaceText': {
        '--Add': '--小怪',
        '--Tower adds': '--塔小怪',
        '(?<!un)targetable--': '可选中--',
        '\\(active\\)': '(激活)',
        '\\(castbar\\)': '(咏唱栏)',
        '\\(enrage\\)': '(狂暴)',
        '\\(lines\\)': '(直线)',
        '\\(puddles\\)': '(黄圈)',
        '\\(puddle baits': '(诱导黄圈',
        '\\(puddle explodes\\)': '(黄圈爆炸)',
        'pyretic\\)': '热病)',
        '\\(spread\\)': '(分散)',
        'Airy Emptiness': '扩散波动',
        'Almagest': '至高无上',
        'All for Naught': '无之领域',
        'Curse of the Flesh': '疫病诅咒',
        'Deep Freeze': '深度冻结',
        'Demon Eye': '恶魔之瞳',
        'Dense Emptiness': '集束波动',
        'Dimension Zero': '零次元',
        'Empty Shadow': '虚无冲击',
        'Endless Chase': '追尾波动',
        'Gaze of the Void': '混沌激流',
        'Great Return to Nothing': '回归重波动',
        'Lightless World': '无光的世界',
        'Looming Emptiness': '虚无大冲击',
        'Meltdown': '核心熔毁',
        'Meteorain': '流星雨',
        'Naught Grows': '无之膨胀',
        'Naught Hunts': '无之追踪',
        'Nothingness': '无之波动',
        'Passage of Naught': '聚能波动',
        '(?<!Great )Return to Nothing': '回归波动',
        'Shrouded Holy': '暗影神圣',
        'Silent Torrent': '奔流',
        'Voidal Turbulence': '无之涡流',
        'Weight of Nothing': '高压波动',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Aggressive Shadow': '공허한 그림자의 공격수',
        'Enuo': '에누오',
        'Looming Shadow': '공허한 큰 그림자',
        'Protective Shadow': '공허한 그림자의 수호자',
        'Soothing Shadow': '공허한 그림자의 치유사',
        '(?<! )Void': '무의 소용돌이',
        'Yawning Void': '무의 큰 소용돌이',
      },
      'replaceText': {
        '--Add': '--쫄',
        '--Tower adds': '--탑 쫄',
        '(?<= )targetable--': '타겟가능--',
        '\\(puddle baits \\+ pyretic\\)': '(장판 유도 + 열병)',
        '\\(puddle explodes\\)': '(장판 폭발)',
        '\\(spread\\)': '(산개)',
        '\\(lines\\)': '(선)',
        '\\(puddles\\)': '(장판)',
        '\\(big\\)': '(강력)',
        '\\(active\\)': '(활성)',
        'Airy Emptiness': '확산 파동',
        'All for Naught': '무의 영역',
        'Almagest': '알마게스트',
        'Curse of the Flesh': '질병의 저주',
        'Deep Freeze': '극한 동결',
        'Demon Eye': '악마의 눈동자',
        'Dense Emptiness': '집속 파동',
        'Dimension Zero': '0차원',
        'Empty Shadow': '공허한 충격',
        'Endless Chase': '추적 파동',
        'Gaze of the Void': '혼돈의 격류',
        'Great Return to Nothing': '회귀의 대파동',
        'Lightless World': '빛이 없는 세계',
        'Looming Emptiness': '공허한 대충격',
        'Meltdown': '용융',
        'Meteorain': '메테오 레인',
        'Naught Grows': '무의 비대',
        'Naught Hunts': '무의 추적',
        'Nothingness': '무의 파동',
        'Passage of Naught': '집적 파동',
        '(?<! )Return to Nothing': '회귀의 파동',
        'Shrouded Holy': '섀도우 홀리',
        'Silent Torrent': '급류',
        'Voidal Turbulence': '무의 맴돌이',
        'Weight of Nothing': '고압 파동',
      },
    },
  ],
};

export default triggerSet;
