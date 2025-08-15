import Autumn, { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type ReapingSafeDir = 'out' | 'in' | 'mid' | 'sides';
const reapingHeadmarkerMap: { [id: string]: ReapingSafeDir } = {
  '025C': 'out',
  '025D': 'in',
  '025E': 'mid',
  '025F': 'sides',
} as const;

export type LoomingSpecterDir = 'north' | 'middle' | 'south';

export interface Data extends RaidbossData {
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
    loomingSpecterLocs: [],
    specterCount: 0,
    cropCircleActors: {},
    cropCircleOrder: [],
    circleOfLivesCounter: 0,
    macabreMark: 0,
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
        if (pos === undefined)
          return;
        data.loomingSpecterLocs.push(pos.y < 99 ? 'north' : pos.y > 101 ? 'south' : 'middle');
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
        if (row === undefined || rows.length > 1)
          return;
        return output.text!({ row: output[row]!(), positions: output.positions!() });
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
        return !(Object.keys(data.cropCircleActors).length < 4);
      },
      suppressSeconds: 60,
      promise: async (data) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: Object.values(data.cropCircleActors),
        })).combatants;

        const filteredActors = actors.filter((a) => a.PosZ < 5);
        const bottomActor = filteredActors[0];
        if (filteredActors.length !== 1 || bottomActor === undefined)
          return;

        const bottomActorCount =
          Object.entries(data.cropCircleActors).filter((e) => e[1] === bottomActor.ID)[0];
        if (bottomActorCount === undefined)
          return;

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
          data.cropCircleOrder.length !== 4 ||
          dir1 === undefined || dir2 === undefined || dir3 === undefined || dir4 === undefined
        )
          return;

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
        data.massMacabre = false;
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
        if (pos === undefined)
          return;

        const safe = Math.abs(pos.x - 100) < 1
          ? 'middle'
          : Directions.xyTo8DirOutput(pos.x, pos.y, 100, 100);

        if (data.circleOfLivesCounter <= 5) {
          const hand = data.loomingSpecterLocs[0];
          const circle = safe === 'middle' ? 'middle' : (pos.y < 99 ? 'north' : 'south');
          if (data.circleOfLivesCounter === 2 && hand === circle)
            return output.dodge!({ dir: output[safe]!() });
          if (data.circleOfLivesCounter && hand === circle)
            return output.delay!({ dir: output[safe]!() });
        }
        return output[safe]!();
      },
      outputStrings: {
        ...AutumnDir.stringsAim,
        middle: Outputs.middle,
        delay: {
          en: 'Wait for hand => ${dir}',
          ko: '손 기다렸다가 ${dir}',
        },
        dodge: {
          en: '${dir} => Dodge Hand',
          ko: '${dir} 🔜 손 피해요',
        },
      },
    },
    {
      id: 'NecronEx Mass Macabre',
      type: 'StartsUsing',
      netRegex: { id: 'AE33', capture: false },
      infoText: (_data, _matches, output) => output.towerPos!(),
      run: (data) => {
        data.massMacabre = true;
        data.macabreMark = 0;
      },
      outputStrings: {
        towerPos: {
          en: '(Towers soon)',
          ko: '(곧 타워)',
        },
      },
    },
    {
      id: 'NecronEx Macabre Mark',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      condition: (data, matches) => data.massMacabre && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      infoText: (data, _matches, output) => {
        if (Autumn.isTank(data.moks) && data.macabreMark >= 2)
          return;
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
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Twofold Blight/Fourfold Blight': 'Twofold/Fourfold Blight',
        'The Second Season/The Fourth Season': 'The Second/Fourth Season',
      },
    },
  ],
};

export default triggerSet;
