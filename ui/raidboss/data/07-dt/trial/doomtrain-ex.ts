import { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// @TODO:
// Could get a slightly more accurate prediction for add phase train stop location
// by adding additional rotation based on delta time between the mechanic headmarker
// and the tank headmarkers

// Train cars are 20y x 30y
// Boss is 10y north of edge
const arenas = {
  '1': {
    x: 100,
    y: 100,
  },
  '2': {
    x: 100,
    y: 150,
  },
  // car 3 happens both before and after add phase
  '3': {
    x: 100,
    y: 200,
  },
  // During add phase, small train firing tank cones is 25y away from center
  // Arena is ~30y circle
  'add': {
    x: -400,
    y: -400,
  },
  '4': {
    x: 100,
    y: 250,
  },
  '5': {
    x: 100,
    y: 300,
  },
  '6': {
    x: 100,
    y: 350,
  },
} as const;

export interface Data extends RaidbossData {
  phase: 'car1' | 'car2' | 'add' | 'car3' | 'car4' | 'car5' | 'car6';
  cleaveTrainSpeed: 'slow' | 'fast';
  addCleaveOnMe: boolean;
  trainCleaveDir: number;
  cleaveTrainId: string;
  storedKBMech?: 'pairs' | 'spread';
  car2TurretDir: 'east' | 'west';
  car2MechCount: number;
  actorPositions: { [id: string]: { x: number; y: number; heading: number; time: number } };
}

const triggerSet: TriggerSet<Data> = {
  id: 'HellOnRailsExtreme',
  zoneId: ZoneId.HellOnRailsExtreme,
  initData: () => ({
    actorPositions: {},
    cleaveTrainId: '',
    addCleaveOnMe: false,
    trainCleaveDir: -1,
    cleaveTrainSpeed: 'slow',
    phase: 'car1',
    car2TurretDir: 'east',
    car2MechCount: 0,
  }),
  triggers: [
    // General triggers
    {
      id: 'DoomtrainEx Phase Tracker 1',
      type: 'StartsUsing',
      netRegex: { id: 'B237', capture: false },
      run: (data) => {
        if (data.phase === 'car1') {
          data.phase = 'car2';
        } else if (data.phase === 'car2') {
          data.phase = 'car3';
        }
      },
    },
    {
      id: 'DoomtrainEx Phase Tracker Add Phase Start',
      type: 'StartsUsing',
      netRegex: { id: 'B246', capture: false },
      run: (data) => data.phase = 'add',
    },
    {
      id: 'DoomtrainEx Phase Tracker Add Phase End',
      type: 'Ability',
      netRegex: { id: 'B24C', capture: false },
      suppressSeconds: 1,
      run: (data) => data.phase = 'car3',
    },
    {
      id: 'DoomtrainEx Phase Tracker Car4+',
      type: 'StartsUsing',
      netRegex: { id: 'B28F', capture: false },
      run: (data) => {
        if (data.phase === 'car3')
          data.phase = 'car4';
        else if (data.phase === 'car4')
          data.phase = 'car5';
        else
          data.phase = 'car6';
      },
    },
    {
      id: 'DoomtrainEx ActorMove Tracker',
      type: 'ActorMove',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
          time: new Date(matches.timestamp).getTime(),
        },
    },
    {
      id: 'DoomtrainEx ActorSetPos Tracker',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
          time: new Date(matches.timestamp).getTime(),
        },
    },
    {
      id: 'DoomtrainEx AddedCombatant Tracker',
      type: 'AddedCombatant',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
          time: new Date(matches.timestamp).getTime(),
        },
    },
    {
      id: 'DoomtrainEx Dead Man\'s Overdraught',
      type: 'StartsUsing',
      netRegex: { id: ['B25F', 'B260'], capture: true },
      preRun: (data, matches) => {
        data.storedKBMech = matches.id === 'B260' ? 'pairs' : 'spread';
      },
      infoText: (data, _matches, output) =>
        output.text!({ mech: output[data.storedKBMech ?? 'unknown']!() }),
      outputStrings: {
        text: {
          en: 'Stored ${mech}',
          ko: '(저장: ${mech})',
        },
        pairs: Outputs.stackPartner,
        spread: Outputs.spread,
      },
    },
    // Car 1
    {
      id: 'DoomtrainEx Dead Man\'s Express/Windpipe Car1',
      type: 'StartsUsing',
      netRegex: { id: ['B266', 'B280'], capture: true },
      condition: (data) => data.phase === 'car1',
      infoText: (data, matches, output) =>
        output.text!({
          mech1: output[matches.id === 'B266' ? 'knockback' : 'drawIn']!(),
          mech2: output[data.storedKBMech ?? 'unknown']!(),
        }),
      outputStrings: {
        text: {
          en: '${mech1} => ${mech2}',
          ko: '${mech1} 🔜 ${mech2}',
        },
        unknown: Outputs.unknown,
        knockback: Outputs.knockback,
        drawIn: Outputs.drawIn,
        pairs: Outputs.stackPartner,
        spread: Outputs.spread,
      },
    },
    // Car 2
    {
      id: 'DoomtrainEx Turret Side',
      type: 'StartsUsing',
      netRegex: { id: 'B271', capture: true },
      run: (data, matches) =>
        data.car2TurretDir = parseFloat(matches.x) < arenas[2].x ? 'west' : 'east',
    },
    {
      id: 'DoomtrainEx Car2 Tankbuster',
      type: 'StartsUsing',
      netRegex: { id: 'B271', capture: false },
      condition: (data) => data.phase === 'car2' && data.car2MechCount === 1,
      infoText: (data, _matches, output) =>
        output.text!({ turretDir: output[data.car2TurretDir]!() }),
      run: (data) => data.car2MechCount++,
      outputStrings: {
        east: Outputs.east,
        west: Outputs.west,
        text: {
          en: 'LoS ${turretDir} => Tankbusters',
          ko: '시선 ${turretDir} 🔜 탱크버스터', // LoS = Line of Sight
        },
      },
    },
    {
      id: 'DoomtrainEx Dead Man\'s Express/Windpipe Car2',
      type: 'StartsUsing',
      netRegex: { id: ['B266', 'B280'], capture: true },
      condition: (data) => data.phase === 'car2',
      infoText: (data, matches, output) =>
        output.text!({
          turretDir: output[data.car2TurretDir]!(),
          mech1: output[matches.id === 'B266' ? 'knockback' : 'drawIn']!(),
          mech2: output[data.storedKBMech ?? 'unknown']!(),
        }),
      run: (data) => data.car2MechCount++,
      outputStrings: {
        text: {
          en: 'LoS ${turretDir} => ${mech1} => Dodge Lasers => ${mech2}',
          ko: '시선 ${turretDir} 🔜 ${mech1} 🔜 레이저 피하고 🔜 ${mech2}', // LoS = Line of Sight
        },
        unknown: Outputs.unknown,
        east: Outputs.east,
        west: Outputs.west,
        knockback: Outputs.knockback,
        drawIn: Outputs.drawIn,
        pairs: Outputs.stackPartner,
        spread: Outputs.spread,
      },
    },
    // Add phase
    {
      id: 'DoomtrainEx Add Actor Finder',
      type: 'ActorMove',
      netRegex: { unknown2: ['0096', '00FA'] },
      suppressSeconds: 9999,
      run: (data, matches) => {
        data.cleaveTrainId = matches.id;
      },
    },
    {
      id: 'DoomtrainEx Add Train Speed Collector',
      type: 'ActorMove',
      netRegex: { unknown2: ['0096', '00FA'] },
      condition: (data, matches) => matches.id === data.cleaveTrainId,
      run: (data, matches) => {
        data.cleaveTrainSpeed = matches.unknown2 === '0096' ? 'slow' : 'fast';
      },
    },
    {
      id: 'DoomtrainEx Add Mechanics',
      type: 'HeadMarker',
      netRegex: { id: ['027D', '027E'], capture: true },
      condition: (data) => !data.options.AutumnOnly,
      infoText: (data, matches, output) => {
        data.trainCleaveDir ??= 0;
        const addMech = matches.id === '027D' ? 'healerStacks' : 'spread';
        const mech = data.addCleaveOnMe ? output.cleave!() : output[addMech]!();
        const dirNum = Directions.hdgTo16DirNum(data.trainCleaveDir);
        const dirTxt = dirNum !== undefined ? Directions.output16Dir[dirNum ?? -1] : 'unknown';
        const dir = output[dirTxt ?? 'unknown']!();
        return output.text!({
          dir: dir,
          mech: mech,
        });
      },
      outputStrings: {
        healerStacks: Outputs.healerGroups,
        spread: Outputs.spread,
        cleave: Outputs.tankCleaveOnYou,
        unknown: Outputs.unknown,
        ...Directions.outputStrings16Dir,
        text: {
          en: 'Train ${dir}, ${mech}',
          ko: '기차 ${dir}, ${mech}',
        },
      },
    },
    {
      id: 'DoomtrainEx Autumn Mechanics',
      type: 'HeadMarker',
      netRegex: { id: ['027D', '027E'], capture: true },
      condition: (data) => data.options.AutumnOnly,
      infoText: (data, matches, output) => {
        data.trainCleaveDir ??= 0;
        const addMech = matches.id === '027D' ? 'healerStacks' : 'spread';
        const mech = data.addCleaveOnMe ? output.cleave!() : output[addMech]!();
        const dirNum = Directions.hdgTo8DirNum(data.trainCleaveDir);
        const dirTxt = dirNum !== undefined ? AutumnDir.outputDir[dirNum ?? -1] : 'unknown';
        const dir = output[dirTxt ?? 'unknown']!();
        return output.text!({
          dir: dir,
          mech: mech,
        });
      },
      outputStrings: {
        healerStacks: Outputs.healerGroups,
        spread: Outputs.spread,
        cleave: Outputs.tankCleaveOnYou,
        unknown: Outputs.unknown,
        ...AutumnDir.stringsArrow,
        text: {
          en: 'Train ${dir}, ${mech}',
          ko: '기차${dir}, ${mech}',
        },
      },
    },
    {
      id: 'DoomtrainEx Add Tank Cleave Location Prediction',
      type: 'HeadMarker',
      netRegex: { id: '019C', capture: true },
      suppressSeconds: 1,
      run: (data) => {
        const actor = data.actorPositions[data.cleaveTrainId];
        if (actor === undefined)
          return;
        data.trainCleaveDir = Math.atan2(actor.x - arenas.add.x, actor.y - arenas.add.y);
        if (data.cleaveTrainSpeed === 'slow') {
          data.trainCleaveDir -= 2;
        } else {
          data.trainCleaveDir -= 3;
        }

        if (data.trainCleaveDir < -Math.PI) {
          data.trainCleaveDir += Math.PI * 2;
        }
      },
    },
    {
      id: 'DoomtrainEx Add Tank Cleave Headmarker Collector',
      type: 'HeadMarker',
      netRegex: { id: '019C', capture: true },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 1,
      run: (data) => {
        data.addCleaveOnMe = true;
      },
    },
    // Car 3
    {
      id: 'DoomtrainEx Car3 Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: '0157', capture: true },
      condition: (data, matches) =>
        data.phase === 'car3' && Conditions.targetIsYou()(data, matches),
      response: Responses.tankBuster(),
    },
    {
      id: 'DoomtrainEx Derailment Siege Car3',
      type: 'StartsUsing',
      netRegex: { id: 'B250', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tower x3 => Next Platform',
          ko: '타워x3 🔜 다음 플랫폼',
        },
      },
    },
    // Car 4
    {
      id: 'DoomtrainEx Derailment Siege Car4',
      type: 'StartsUsing',
      netRegex: { id: 'B284', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tower x4 => Next Platform',
          ko: '타워x4 🔜 다음 플랫폼',
        },
      },
    },
    // Car 5
    {
      id: 'DoomtrainEx Derailment Siege Car5',
      type: 'StartsUsing',
      netRegex: { id: 'B284', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tower x5 => Next Platform',
          ko: '타워x5 🔜 다음 플랫폼',
        },
      },
    },
    // Car 6
    {
      id: 'DoomtrainEx Derailment Siege Car6',
      type: 'StartsUsing',
      netRegex: { id: 'B284', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tower x6 => Next Platform',
          ko: '타워x6 🔜 다음 플랫폼',
        },
      },
    },
  ],
};

export default triggerSet;
