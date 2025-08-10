import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO:
// Party adds phase stuff?
// Individual adds phase mechs for non-healer?
// P2 stuff

export type ReapingSafeDir = 'out' | 'in' | 'mid' | 'sides';
const reapingHeadmarkerMap: { [id: string]: ReapingSafeDir } = {
  '025C': 'out',
  '025D': 'in',
  '025E': 'mid',
  '025F': 'sides',
} as const;

export interface Data extends RaidbossData {
  reapingSafeDirs: ReapingSafeDir[];
  reapingCounter: number;
  mementoMoriCount: number;
  grandCrossSpreads: string[];
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  spector?: boolean;
  massMacabre?: boolean;
  macabreMark: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheMinstrelsBalladNecronsEmbrace',
  zoneId: ZoneId.TheMinstrelsBalladNecronsEmbrace,
  timelineFile: 'necron-ex.txt',
  initData: () => ({
    actorPositions: {},
    mementoMoriCount: 0,
    reapingCounter: 0,
    reapingSafeDirs: [],
    grandCrossSpreads: [],
    macabreMark: 0,
  }),
  triggers: [
    {
      id: 'NecronEx ActorPos Tracker',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'NecronEx Blue Shockwave',
      type: 'HeadMarker',
      netRegex: { id: '0267', capture: true },
      // Annoyingly, the "target" of this headmarker is the boss, and the actual player ID is stored
      // in `data0`. So we need to map back to party info to determine if target is self or another
      condition: (data, matches) => {
        if (data.me === data.party?.idToName_?.[matches.data0])
          return true;
        return data.role === 'tank';
      },
      infoText: (_data, _matches, output) => output.tankBuster!(),
      outputStrings: {
        tankBuster: Outputs.tankBuster,
      },
    },
    {
      id: 'NecronEx Fear of Death Damage',
      type: 'StartsUsing',
      netRegex: { id: 'AE06', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'NecronEx Fear of Death Bait',
      type: 'StartsUsing',
      netRegex: { id: 'AE06', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      infoText: (_data, _matches, output) => output.baitHand!(),
      outputStrings: {
        baitHand: {
          en: 'Bait Hand',
          ko: '손 유도',
        },
      },
    },
    {
      id: 'NecronEx Cold Grip',
      type: 'StartsUsing',
      netRegex: { id: ['AE09', 'AE0A'], capture: true },
      infoText: (_data, matches, output) =>
        output.text!({
          mid: output.middle!(),
          side: output[matches.id === 'AE0A' ? 'east' : 'west']!(),
        }),
      outputStrings: {
        middle: Outputs.middle,
        east: Outputs.east,
        west: Outputs.west,
        text: {
          en: '${mid} => ${side}',
          ko: '${mid} 🔜 ${side}으로',
        },
      },
    },
    {
      id: 'NecronEx Memento Mori',
      type: 'StartsUsing',
      netRegex: { id: ['AE15', 'AE16'] },
      condition: (data) => {
        return ++data.mementoMoriCount !== 2;
      },
      infoText: (data, matches, output) => {
        if (data.options.AutumnOnly) {
          const west = matches.id === 'AE15';
          if (Autumn.isTank(data.moks))
            return west ? output.aEast!() : output.aWest!();
          return west ? output.aWest!() : output.aEast!();
        }
        return output[matches.id === 'AE15' ? 'lightWest' : 'lightEast']!();
      },
      outputStrings: {
        lightWest: {
          en: 'Light West, Dark East => Spread',
          ko: '🟡빛 서쪽, 🟣어둠 동쪽 🔜 흩어져요',
        },
        lightEast: {
          en: 'Dark West, Light East => Spread',
          ko: '🟣어둠 서쪽, 🟡빛 동쪽 🔜 흩어져요',
        },
        aWest: {
          en: 'Go West => Spread',
          ko: '서쪽에서 🔜 맡은 자리로',
        },
        aEast: {
          en: 'Go East => Spread',
          ko: '동쪽에서 🔜 맡은 자리로',
        },
      },
    },
    {
      id: 'NecronEx Soul Reaping Collector',
      type: 'StartsUsing',
      netRegex: { id: 'AE0C', capture: false },
      run: (data) => data.reapingCounter++,
    },
    {
      id: 'NecronEx Reaping Headmarker',
      type: 'HeadMarker',
      netRegex: { id: ['025C', '025D', '025E', '025F'], capture: true },
      preRun: (data, matches) => {
        const dir = reapingHeadmarkerMap[matches.id];
        if (dir === undefined)
          throw new UnreachableCode();
        data.reapingSafeDirs.push(dir);
      },
      infoText: (data, _matches, output) => {
        const dir = data.reapingSafeDirs.length > 0
          ? data.reapingSafeDirs[data.reapingSafeDirs.length - 1]
          : undefined;
        if (dir === undefined)
          throw new UnreachableCode();

        if (data.reapingCounter === 1)
          return output[dir]!();
        return output.stored!({ dir: output[dir]!() });
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        sides: Outputs.sides,
        mid: Outputs.middle,
        stored: {
          en: 'Stored ${dir}',
          ko: '(저장: ${dir})',
        },
      },
    },
    {
      id: 'NecronEx Twofold/Fourfold Blight',
      type: 'StartsUsing',
      netRegex: { id: ['AE0D', 'AE0E'], capture: true },
      infoText: (data, matches, output) => {
        const dir = data.reapingSafeDirs[0] ?? 'unknown';
        const mech = matches.id === 'AE0D' ? 'healerStacks' : 'partners';

        return output.text!({
          dir: output[dir]!(),
          mech: output[mech]!(),
        });
      },
      run: (data) => {
        data.reapingSafeDirs = [];
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        sides: Outputs.sides,
        mid: Outputs.middle,
        unknown: Outputs.unknown,
        healerStacks: Outputs.healerGroups,
        partners: {
          en: 'Partners',
          ko: '둘이 페어',
        },
        text: {
          en: '${dir} + ${mech}',
          ko: '${dir} + ${mech}',
        },
      },
    },
    {
      id: 'NecronEx End\'s Embrace',
      type: 'HeadMarker',
      netRegex: { id: '0266', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.spector) {
          data.spector = false;
          return output.spector!();
        }
        return output.bait!();
      },
      outputStrings: {
        bait: {
          en: 'Drop hand => Bait hand',
          ko: '손 떨구고 🔜 다시 유도',
        },
        spector: {
          en: 'Spread => Bait',
          ko: '손 떨구고 🔜 한가운데로 유도',
        },
      },
    },
    {
      id: 'NecronEx Grand Cross',
      type: 'StartsUsing',
      netRegex: { id: 'AE18', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'NecronEx Grand Cross Puddle Bait Initial',
      type: 'Ability',
      netRegex: { id: 'AE18', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.bait!(),
      outputStrings: {
        bait: {
          en: 'Bait puddles',
          ko: '장판 유도',
        },
      },
    },
    {
      id: 'NecronEx Grand Cross Puddle Bait End',
      type: 'Ability',
      netRegex: { id: 'AE18', capture: false },
      delaySeconds: 26.5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.bait!(),
      outputStrings: {
        bait: {
          en: 'Bait puddles => Intercardinals',
          ko: '장판 유도 🔜 비스듬히',
        },
      },
    },
    {
      id: 'NecronEx Grand Cross Spread/Tower',
      type: 'HeadMarker',
      netRegex: { id: '0263', capture: true },
      condition: (data) => !data.options.AutumnOnly || data.job === 'BLU',
      preRun: (data, matches) => data.grandCrossSpreads.push(matches.target),
      infoText: (data, _matches, output) => {
        if (data.grandCrossSpreads.length < 4)
          return;

        const spread = data.grandCrossSpreads.includes(data.me);
        return output[spread ? 'spread' : 'tower']!();
      },
      run: (data) => data.grandCrossSpreads = [],
      outputStrings: {
        spread: Outputs.spread,
        tower: {
          en: 'Tower',
          ko: '타워로',
        },
      },
    },
    {
      id: 'NecronEx 그랜드 크로스 흩쳐',
      type: 'HeadMarker',
      netRegex: { id: '0263', capture: true },
      condition: (data) => data.options.AutumnOnly && data.job !== 'BLU',
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        if (data.party.isDPS(matches.target))
          return Autumn.isDps(data.moks) ? output.spread!() : output.tower!();
        return Autumn.isDps(data.moks) ? output.tower!() : output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
        tower: Outputs.getTowers,
      },
    },
    {
      id: 'NecronEx Neutron Ring',
      type: 'StartsUsing',
      netRegex: { id: 'AE1F', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'NecronEx Darkness of Eternity',
      type: 'StartsUsing',
      netRegex: { id: 'AE24', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'NecronEx Cleanse Slow',
      type: 'GainsEffect',
      netRegex: { effectId: 'D88', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.cleanse!(),
      outputStrings: {
        cleanse: 'Cleanse Slow',
        ko: '슬로우 에스나',
      },
    },
    {
      id: 'NecronEx Specter of Death',
      type: 'StartsUsing',
      netRegex: { id: 'AE3E', capture: false },
      run: (data) => data.spector = true,
    },
    {
      id: 'NecronEx 요시 그란도 시즌',
      type: 'StartsUsing',
      netRegex: { id: ['B06F', 'B070'], capture: true },
      durationSeconds: 18,
      infoText: (data, matches, output) => {
        if (data.reapingSafeDirs.length !== 4)
          return;
        const splitter = output.splitter!();
        const join = data.reapingSafeDirs.map((dir) => output[dir]!()).join(splitter);
        const mech = matches.id === 'B06F' ? 'healerStacks' : 'partners';
        return output.text!({ join: join, season: output[mech]!() });
      },
      run: (data) => {
        data.reapingSafeDirs = [];
        data.massMacabre = false;
      },
      outputStrings: {
        text: {
          en: '${join} + ${season}',
          ko: '${join} (${season})',
        },
        in: {
          en: 'In',
          ja: '中',
          ko: '안',
        },
        out: {
          en: 'Out',
          ja: '外',
          ko: '바깥',
        },
        sides: {
          en: 'Sides',
          ja: '横',
          ko: '옆',
        },
        mid: {
          en: 'Middle',
          ja: '中',
          ko: '가운데',
        },
        splitter: {
          en: ', ',
          ja: ' / ',
          ko: ' / ',
        },
        healerStacks: {
          en: 'Healer',
          ja: 'ヒラ',
          ko: '4:4 힐러',
        },
        partners: {
          en: 'Partner',
          ja: 'ペア',
          ko: '페어',
        },
      },
    },
    {
      id: 'NecronEx Mass Macabre',
      type: 'StartsUsing',
      netRegex: { id: 'AE33', capture: false },
      run: (data) => {
        data.massMacabre = true;
        data.macabreMark = 0;
      },
    },
    {
      id: 'NecronEx Macabre Mark',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      condition: (data, matches) => data.massMacabre && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      infoText: (data, _matches, output) => {
        if (data.macabreMark >= 3)
          return;
        data.macabreMark++;
        return output.tower!();
      },
      outputStrings: {
        tower: {
          en: 'Get Towers',
          ja: '塔を踏む',
          ko: '타워 밟아요',
        },
      },
    },
  ],
};

export default triggerSet;
