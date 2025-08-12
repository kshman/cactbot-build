import Autumn, { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutput8, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO:
// Party adds phase stuff?
// Individual adds phase mechs for non-healer?

export type ReapingSafeDir = 'out' | 'in' | 'mid' | 'sides';
const reapingHeadmarkerMap: { [id: string]: ReapingSafeDir } = {
  '025C': 'out',
  '025D': 'in',
  '025E': 'mid',
  '025F': 'sides',
} as const;

export type LoomingSpecterDir = 'north' | 'middle' | 'south';

export interface Data extends RaidbossData {
  macabreTowerCount: number;
  circleOfLivesCounter: number;
  cropCircleOrder: ReapingSafeDir[];
  cropCircleActors: { [effectId: string]: number };
  specterCount: number;
  reapingSafeDirs: ReapingSafeDir[];
  reapingCounter: number;
  mementoMoriCount: number;
  grandCrossSpreads: string[];
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  loomingSpecterLocs: LoomingSpecterDir[];
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
    loomingSpecterLocs: [],
    specterCount: 0,
    cropCircleActors: {},
    cropCircleOrder: [],
    circleOfLivesCounter: 0,
    macabreTowerCount: 0,
  }),
  triggers: [
    {
      id: 'NecronEx ActorSetPos Tracker',
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
      id: 'NecronEx AddedCombatant Tracker',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '14095', capture: true },
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
      infoText: (_data, matches, output) => output[matches.id === 'AE0A' ? 'east' : 'west']!(),
      outputStrings: {
        east: {
          en: 'Middle => East',
          ja: '中央 => 東',
          ko: '동쪽으로❱❱❱',
        },
        west: {
          en: 'Middle => West',
          ja: '中央 => 西',
          ko: '❰❰❰서쪽으로',
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
          en: 'Light West => Spread',
          ko: '🟡빛 서쪽 🔜 흩어져요',
        },
        lightEast: {
          en: 'Light East => Spread',
          ko: '🟡빛 동쪽 🔜 흩어져요',
        },
        aWest: {
          en: 'Go West => Spread',
          ko: '❰❰❰서쪽 맡은 자리로',
        },
        aEast: {
          en: 'Go East => Spread',
          ko: '동쪽 맡은 자리로❱❱❱',
        },
      },
    },
    {
      id: 'NecronEx Soul Reaping Collector',
      type: 'StartsUsing',
      netRegex: { id: ['AE0C', 'AE14'], capture: false },
      run: (data) => data.reapingCounter++,
    },
    {
      id: 'NecronEx Reaping Headmarker Collector',
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
        else if (data.reapingCounter === 2)
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
        partners: Outputs.stackPartner,
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
        if (data.specterCount === 1)
          return output.spector!();
        return output.bait!();
      },
      outputStrings: {
        bait: {
          en: 'Drop hand => Bait hand',
          ko: '손 떨구고 🔜 다시 유도',
        },
        spector: {
          en: 'Spread => Bait',
          ko: '손 떨구고 🔜 함께 유도',
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
        data.grandCrossSpreads = [];
        return output[spread ? 'spread' : 'tower']!();
      },
      outputStrings: {
        spread: Outputs.spread,
        tower: {
          en: 'Tower',
          ko: '타워로',
        },
      },
    },
    {
      id: 'NecronEx 그랜드 크로스 타워/흩터',
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
      id: 'NecronEx Looming Specter Collector',
      type: 'Tether',
      netRegex: { id: '0066', capture: true },
      // 0.3s delay to ensure `ActorSetPos` has fired properly
      delaySeconds: 0.3,
      run: (data, matches) => {
        const pos = data.actorPositions[matches.sourceId];

        if (pos === undefined) {
          console.error(
            `Looming Specter Collector: Missing actor data for ${matches.sourceId}`,
            data.actorPositions,
          );
          return;
        }

        let dir: LoomingSpecterDir;

        if (pos.y < 99)
          dir = 'north';
        else if (pos.y > 101)
          dir = 'south';
        else
          dir = 'middle';

        data.loomingSpecterLocs.push(dir);
      },
    },
    {
      id: 'NecronEx Specter of Death Counter',
      type: 'StartsUsing',
      netRegex: { id: 'AE3E', capture: false },
      run: (data) => data.specterCount++,
    },
    {
      id: 'NecronEx Specter of Death First',
      type: 'StartsUsing',
      netRegex: { id: 'AE3E', capture: false },
      condition: (data) => data.specterCount === 1,
      delaySeconds: 1,
      infoText: (data, _matches, output) => {
        let rows: LoomingSpecterDir[] = ['middle', 'north', 'south'];
        rows = rows.filter((r) => !data.loomingSpecterLocs.includes(r));
        const row = rows[0];

        if (row === undefined || rows.length > 1) {
          console.error(`Specter of Death First: Invalid row info`, row, rows);
          return;
        }

        return output.text!({
          row: output[row]!(),
          positions: output.positions!(),
        });
      },
      run: (data) => data.loomingSpecterLocs = [],
      outputStrings: {
        positions: Outputs.positions,
        middle: {
          en: 'Middle Row',
          ko: '가운데',
        },
        north: {
          en: 'North Row',
          ko: '🡹북쪽',
        },
        south: {
          en: 'South Row',
          ko: '🡻남쪽',
        },
        text: {
          en: '${row} + ${positions}',
          ko: '${row} + ${positions}',
        },
      },
    },
    {
      id: 'NecronEx Crop Circle Collector',
      type: 'GainsEffect',
      netRegex: { effectId: '808', count: ['3B8', '3B9', '3BA', '3BB'], capture: true },
      condition: (data, matches) => {
        data.cropCircleActors[matches.count] = parseInt(matches.targetId, 16);

        if (Object.keys(data.cropCircleActors).length < 4)
          return false;

        return true;
      },
      suppressSeconds: 60,
      promise: async (data) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: Object.values(data.cropCircleActors),
        })).combatants;

        const filteredActors = actors.filter((a) => a.PosZ < 5);

        const bottomActor = filteredActors[0];

        if (filteredActors.length !== 1 || bottomActor === undefined) {
          console.error(
            `Crop Circle Collector: Wrong combatants count ${actors.length}`,
            actors,
          );
          return;
        }

        const bottomActorCount =
          Object.entries(data.cropCircleActors).filter((e) => e[1] === bottomActor.ID)[0];

        if (bottomActorCount === undefined) {
          console.error(
            `Crop Circle Collector: Missing bottomActorCount match`,
            data.cropCircleActors,
            bottomActor,
          );
          return;
        }

        const offset = parseInt(bottomActorCount[0], 16) - 0x3B8;

        data.cropCircleOrder = [...data.reapingSafeDirs, ...data.reapingSafeDirs].slice(
          offset,
          offset + 4,
        );
      },
    },
    {
      id: 'NecronEx The Second/Fourth Season',
      type: 'StartsUsing',
      netRegex: { id: ['B06F', 'B070'], capture: true },
      durationSeconds: 18,
      infoText: (data, matches, output) => {
        const [dir1, dir2, dir3, dir4] = data.cropCircleOrder;

        if (
          data.cropCircleOrder.length !== 4 || dir1 === undefined || dir2 === undefined ||
          dir3 === undefined || dir4 === undefined
        ) {
          console.error(
            `Crop Circle Collector: Invalid safe dir info`,
            data.cropCircleOrder,
          );
          return;
        }
        const mech = matches.id === 'B06F' ? 'healerStacks' : 'partners';

        return output.text!({
          dir1: output[dir1]!(),
          dir2: output[dir2]!(),
          dir3: output[dir3]!(),
          dir4: output[dir4]!(),
          mech: output[mech]!(),
        });
      },
      run: (data) => {
        data.cropCircleActors = {};
        data.cropCircleActors = {};
        data.reapingSafeDirs = [];
        data.cropCircleOrder = [];
        data.cropCircleActors = {};
      },
      outputStrings: {
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
          ko: '옆쪽',
        },
        mid: {
          en: 'Middle',
          ja: '中',
          ko: '가운데',
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
        text: {
          en: '${dir1} => ${dir2} => ${dir3} => ${dir4} + ${mech}',
          ko: '${dir1} / ${dir2} / ${dir3} / ${dir4} (${mech})',
        },
      },
    },
    {
      id: 'NecronEx Circle of Lives',
      type: 'StartsUsing',
      netRegex: { id: 'AE38', capture: true },
      preRun: (data) => data.circleOfLivesCounter++,
      delaySeconds: 0.2,
      durationSeconds: 6.5,
      infoText: (data, matches, output) => {
        const pos = data.actorPositions[matches.sourceId];

        if (pos === undefined) {
          console.error(
            `Circle of Lives: Missing actor data for ${matches.sourceId}`,
            data.actorPositions,
          );
          return;
        }

        let safe: DirectionOutput8 | 'middle';

        if (Math.abs(pos.x - 100) < 1)
          safe = 'middle';
        else
          safe = Directions.xyTo8DirOutput(pos.x, pos.y, 100, 100);

        // First 5 are part of the first set of mechs
        if (data.circleOfLivesCounter <= 5) {
          if (data.circleOfLivesCounter !== 3)
            return output[safe]!();
          return output.delay!({
            dir: output[safe]!(),
          });
        }

        // 6 and 8 are part of the second set, no hands going off during these
        if (data.circleOfLivesCounter === 6 || data.circleOfLivesCounter === 8) {
          return output[safe]!();
        }

        // Deal with the hands for 7 and 9
        const row = data.loomingSpecterLocs[0];

        if (row === undefined || data.loomingSpecterLocs.length > 2) {
          console.error(`Circle of Lives: Invalid row info`, row, data.loomingSpecterLocs);
          return;
        }

        let towards: 'dirN' | 'dirS' | 'middle';

        if (row === 'middle') {
          if (pos.y < 100)
            towards = 'dirN';
          else
            towards = 'dirS';
        } else
          towards = 'middle';

        // Clean up data.loomingSpecterLocs here instead of in run to avoid duplicating
        // condition logic
        data.loomingSpecterLocs = [];

        return output.lean!({
          dir: output[safe]!(),
          to: output[towards]!(),
        });
      },
      outputStrings: {
        ...AutumnDir.stringsAim,
        middle: Outputs.middle,
        delay: {
          en: 'Wait for hand => ${dir}',
          ko: '손 기다렸다가 ${dir}',
        },
        lean: {
          en: '${dir}, lean ${to}',
          ko: '${dir}, ${to}쪽으로',
        },
      },
    },
    {
      id: 'NecronEx Mass Macabre Initial',
      type: 'StartsUsing',
      netRegex: { id: 'AE33', capture: false },
      infoText: (_data, _matches, output) => output.towerPos!(),
      outputStrings: {
        towerPos: {
          en: 'Preposition for LP towers',
          ko: '(타워 준비)',
        },
      },
    },
    {
      id: 'NecronEx Mass Macabre Counter',
      type: 'Ability',
      netRegex: { id: 'AF13', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.macabreTowerCount++,
    },
    {
      id: 'NecronEx Mass Macabre Next',
      type: 'Ability',
      netRegex: { id: 'AF13', capture: true },
      condition: (data, matches) =>
        Conditions.targetIsYou()(data, matches) && data.macabreTowerCount < 5,
      delaySeconds: 4,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank' && data.macabreTowerCount > 2) {
          // Tanks deal with buster after 2nd tower
          return;
        }
        return output.soakNext!();
      },
      outputStrings: {
        soakNext: {
          en: 'Soak Next Tower',
          ko: '다음 타워로',
        },
        tankBuster: Outputs.tankBuster,
      },
    },
  ],
};

export default triggerSet;
