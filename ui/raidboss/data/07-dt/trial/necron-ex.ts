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
          ja: 'Bait Hand',
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
          ja: 'Light West => Spread',
          ko: '🟡빛 서쪽 🔜 흩어져요',
        },
        lightEast: {
          en: 'Light East => Spread',
          ja: 'Light East => Spread',
          ko: '🟡빛 동쪽 🔜 흩어져요',
        },
        aWest: {
          en: 'Go West => Spread',
          ja: 'Go West => Spread',
          ko: '❰❰❰서쪽 맡은 자리로',
        },
        aEast: {
          en: 'Go East => Spread',
          ja: 'Go East => Spread',
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
          ja: 'Stored ${dir}',
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
          ja: '${dir} + ${mech}',
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
          ja: 'Drop hand => Bait hand',
          ko: '손 떨구고 🔜 다시 유도',
        },
        spector: {
          en: 'Spread => Bait',
          ja: 'Spread => Bait',
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
          ja: 'Bait puddles',
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
          ja: 'Bait puddles => Intercardinals',
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
          ja: 'Tower',
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
        cleanse: {
          en: 'Cleanse Slow',
          ja: 'スロウを解除',
          ko: '슬로우 에스나',
        },
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
          ja: 'Middle Row',
          ko: '가운데',
        },
        north: {
          en: 'North Row',
          ja: 'North Row',
          ko: '🡹북쪽',
        },
        south: {
          en: 'South Row',
          ja: 'South Row',
          ko: '🡻남쪽',
        },
        text: {
          en: '${row} + ${positions}',
          ja: '${row} + ${positions}',
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
          ja: '${dir1} => ${dir2} => ${dir3} => ${dir4} + ${mech}',
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
          ja: 'Wait for hand => ${dir}',
          ko: '손 기다렸다가 ${dir}',
        },
        dodge: {
          en: '${dir} => Dodge Hand',
          ja: '${dir} => Dodge Hand',
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
          ja: '(Towers soon)',
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
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Azure Aether': 'azur(?:e|er|es|en) Äther',
        'Beckoning Hands': 'lockend(?:e|er|es|en) Hand',
        'Icy Hands': 'eiskalt(?:e|er|es|en) Hand',
        'Necron': 'Ewig(?:e|er|es|en) Dunkel',
      },
      'replaceText': {
        'Aetherblight': 'Ätherische Verderbnis',
        'Blue Shockwave': 'Blaue Schockwelle',
        'Chilling Fingers': 'Klauen des Todes',
        'Choking Grasp': 'Würgegriff',
        'Circle of Lives': 'Lebenszirkel',
        'Cold Grip': 'Dunkelhieb',
        'Crop Rotation': 'Fruchtfolge der Dunkelheit',
        'Darkness of Eternity': 'Ewige Dunkelheit',
        'Existential Dread': 'Existenzielle Angst',
        'Fear of Death': 'Todesfurcht',
        'Fourfold Blight': 'Vierfaches Verderben',
        'Grand Cross': 'Supernova',
        'Inevitability': 'Unumgänglichkeit',
        'Mass Macabre': 'Massenfurcht',
        'Memento Mori': 'Memento Mori',
        'Muted Struggle': 'Stiller Kampf',
        'Necrotic Pulse': 'Nekrotischer Impuls',
        'Neutron Ring': 'Neutronenring',
        'Relentless Reaping': 'Andauernde Labung',
        'Shock(?!wave)': 'Entladung',
        '(?<!Blue )Shockwave': 'Schockwelle',
        'Smite of Gloom': 'Schlag der Schwermut',
        'Soul Reaping': 'Seelenlabung',
        'Specter of Death': 'Gesandte des Todes',
        'Spreading Fear': 'Angst verbreiten',
        'The End\'s Embrace': 'Letzte Umarmung',
        'The Fourth Season': 'Vierte Saison',
        'The Second Season': 'Zweite Saison',
        'Twofold Blight': 'Doppeltes Verderben',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Azure Aether': 'sphère d\'énergie bleue',
        'Beckoning Hands': 'grand attrape-mort',
        'Icy Hands': 'attrape-mort',
        'Necron': 'Darkness',
      },
      'replaceText': {
        '\\(cast\\)': '(Incante)',
        '\\(damage\\)': '(Dommages)',
        '\\(intercards\\)': '(Intercardinaux)',
        '\\(line\\)': '(Ligne)',
        '\\(lines\\)': '(Lignes)',
        '\\(puddle\\)': '(Puddle)',
        '\\(puddles\\)': '(Puddles)',
        '\\(spread\\)': '(Dispersion)',
        '\\(tower\\)': '(Tour)',
        'Aetherblight': 'Voie bleue',
        'Blue Shockwave': 'Onde bleue',
        'Chilling Fingers': 'Enroulement',
        'Choking Grasp': 'Pression écrasante',
        'Circle of Lives': 'Sphères d\'énergie bleues',
        'Cold Grip': 'Fouet létal',
        'Crop Rotation': 'Rotation des âmes',
        'Darkness of Eternity': 'Obscurité éternelle',
        'Existential Dread': 'Jaillissement obscur',
        'Fear of Death': 'Thanatophobie',
        'Fourfold Blight': 'Voie bleue quadruplée',
        'Grand Cross': 'Croix suprême',
        'Inevitability': 'Déluge de mort',
        'Mass Macabre': 'Panique collective',
        'Memento Mori': 'Memento mori',
        'Muted Struggle': 'Frappe écrasante',
        'Necrotic Pulse': 'Déchirement',
        'Neutron Ring': 'Anneau de neutrons',
        'Relentless Reaping': 'Âmes bleues enchaînées',
        'Shock(?!wave)': 'Décharge électrostatique',
        '(?<!Blue )Shockwave': 'Onde de choc',
        'Smite of Gloom': 'Coup des ténèbres',
        'Soul Reaping': 'Âme bleue',
        'Specter of Death': 'Agrippe-morts',
        'Spreading Fear': 'Désagrégement',
        'The End\'s Embrace': 'Aile guide',
        'The Fourth Season': 'Motifs bleus quadruplés',
        'The Second Season': 'Motifs bleus doublés',
        'Twofold Blight': 'Voie bleue doublée',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Azure Aether': '青の魂塊',
        'Beckoning Hands': '死に誘う手',
        'Icy Hands': '死を招く手',
        'Necron': '永遠の闇',
      },
      'replaceText': {
        'Aetherblight': '青の波動',
        'Blue Shockwave': '青の衝撃',
        'Chilling Fingers': 'まとわりつく',
        'Choking Grasp': '圧し潰す',
        'Circle of Lives': '青の輪波',
        'Cold Grip': '暗き死の腕',
        'Crop Rotation': '魂の輪転',
        'Darkness of Eternity': 'エターナルダークネス',
        'Existential Dread': '暗気流',
        'Fear of Death': '死の恐怖',
        'Fourfold Blight': '青の四重波',
        'Grand Cross': 'グランドクロス',
        'Inevitability': '死の氾濫',
        'Mass Macabre': '集団恐慌',
        'Memento Mori': 'メメント・モリ',
        'Muted Struggle': '叩き潰す',
        'Necrotic Pulse': '引き裂く',
        'Neutron Ring': 'ニュートンリング',
        'Relentless Reaping': '連なる青き魂',
        'Shock(?!wave)': '放電',
        '(?<!Blue )Shockwave': '衝撃波',
        'Smite of Gloom': '闇の一撃',
        'Soul Reaping': '青き魂',
        'Specter of Death': '闇の巨腕',
        'Spreading Fear': '撒き散らす',
        'The End\'s Embrace': '導きの翼',
        'The Fourth Season': '青の式波・四重',
        'The Second Season': '青の式波・二重',
        'Twofold Blight': '青の二重波',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Azure Aether': '青之魂块',
        'Beckoning Hands': '邀死之手',
        'Icy Hands': '招死之手',
        'Necron': '永远之暗',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(damage\\)': '(伤害)',
        '\\(intercards\\)': '(斜角)',
        '\\(line\\)': '(直线)',
        '\\(lines\\)': '(直线)',
        '\\(puddle\\)': '(圈)',
        '\\(puddles\\)': '(圈)',
        '\\(spread\\)': '(分散)',
        '\\(tower\\)': '(塔)',
        'Add Spawn': '小怪生成',
        'Aetherblight': '青之波动',
        'Blue Shockwave': '青之冲击',
        'Chilling Fingers': '死缠',
        'Choking Grasp': '压溃',
        'Circle of Lives': '青之环波',
        'Cold Grip': '暗之死腕',
        'Crop Rotation': '灵魂轮转',
        'Darkness of Eternity': '永远之暗',
        'Existential Dread': '暗气流',
        'Fear of Death': '死之恐惧',
        'Fourfold Blight': '青之四重波',
        'Grand Cross': '大十字',
        'Inevitability': '死之泛滥',
        'Mass Macabre': '群体恐慌',
        'Memento Mori': '死亡警告',
        'Muted Struggle': '击溃',
        'Necrotic Pulse': '撕破',
        'Neutron Ring': '中子环',
        'Relentless Reaping': '青之连魂',
        'Shock(?!wave)': '放电',
        '(?<!Blue )Shockwave': '青之冲击',
        'Smite of Gloom': '黑暗一击',
        'Soul Reaping': '青魂',
        'Specter of Death': '黑暗巨腕',
        'Spreading Fear': '散布',
        'The End\'s Embrace': '引导之翼',
        'The Fourth Season': '四重青之波潮',
        'The Second Season': '二重青之波潮',
        'Twofold Blight': '青之二重波',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        // 'Azure Aether': '', // FIXME '青之魂块'
        // 'Beckoning Hands': '', // FIXME '邀死之手'
        // 'Icy Hands': '', // FIXME '招死之手'
        // 'Necron': '', // FIXME '永远之暗'
      },
      'replaceText': {
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        // '\\(damage\\)': '', // FIXME '(伤害)'
        // '\\(intercards\\)': '', // FIXME '(斜角)'
        // '\\(line\\)': '', // FIXME '(直线)'
        // '\\(lines\\)': '', // FIXME '(直线)'
        // '\\(puddle\\)': '', // FIXME '(圈)'
        // '\\(puddles\\)': '', // FIXME '(圈)'
        // '\\(spread\\)': '', // FIXME '(分散)'
        // '\\(tower\\)': '', // FIXME '(塔)'
        // 'Aetherblight': '', // FIXME '青之波动'
        // 'Blue Shockwave': '', // FIXME '青之冲击'
        // 'Choking Grasp': '', // FIXME '压溃'
        // 'Circle of Lives': '', // FIXME '青之环波'
        // 'Cold Grip': '', // FIXME '暗之死腕'
        // 'Crop Rotation': '', // FIXME '灵魂轮转'
        // 'Darkness of Eternity': '', // FIXME '永远之暗'
        'Existential Dread': '萬死的憎惡',
        // 'Fear of Death': '', // FIXME '死之恐惧'
        // 'Fourfold Blight': '', // FIXME '青之四重波'
        'Grand Cross': '大十字',
        // 'Inevitability': '', // FIXME '死之泛滥'
        // 'Mass Macabre': '', // FIXME '群体恐慌'
        // 'Memento Mori': '', // FIXME '死亡警告'
        // 'Muted Struggle': '', // FIXME '击溃'
        // 'Neutron Ring': '', // FIXME '中子环'
        // 'Relentless Reaping': '', // FIXME '青之连魂'
        'Shock(?!wave)': '放電',
        // '(?<!Blue )Shockwave': '', // FIXME '青之冲击'
        'Smite of Gloom': '黑暗一擊',
        // 'Soul Reaping': '', // FIXME '青魂'
        // 'Specter of Death': '', // FIXME '黑暗巨腕'
        // 'The End\'s Embrace': '', // FIXME '引导之翼'
        // 'The Fourth Season': '', // FIXME '四重青之波潮'
        // 'The Second Season': '', // FIXME '二重青之波潮'
        // 'Twofold Blight': '', // FIXME '青之二重波'
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Azure Aether': '푸른 영혼 덩어리',
        'Beckoning Hands': '죽음으로 이끄는 손',
        'Icy Hands': '죽음을 부르는 손',
        'Necron': '영원한 어둠',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(damage\\)': '(피해)',
        '\\(intercards\\)': '(대각)',
        '\\(lines?\\)': '(직선)',
        '\\(puddles?\\)': '(장판)',
        '\\(spread\\)': '(산개)',
        '\\(tower\\)': '(탑)',
        'Add Spawn': '쫄 등장',
        'Aetherblight': '푸른 파동',
        'Blue Shockwave': '푸른 충격',
        'Chilling Fingers': '들러붙기',
        'Choking Grasp': '짓누르기',
        'Circle of Lives': '푸른 고리 파동',
        'Cold Grip': '검은 죽음의 팔',
        'Crop Rotation': '영혼 순환',
        'Darkness of Eternity': '영원한 어둠',
        'Existential Dread': '어두운 기류',
        'Fear of Death': '죽음에 대한 공포',
        'Fourfold Blight': '푸른 사중 파동',
        'Grand Cross': '그랜드크로스',
        'Inevitability': '죽음의 범람',
        'Mass Macabre': '집단 공황',
        'Memento Mori': '메멘토 모리',
        'Muted Struggle': '찍어누르기',
        'Necrotic Pulse': '찢어버리기',
        'Neutron Ring': '중성자 고리',
        'Relentless Reaping': '연속 푸른 영혼',
        'Shock(?!wave)': '방전',
        '(?<!Blue )Shockwave': '충격파',
        'Smite of Gloom': '어둠의 일격',
        'Soul Reaping': '푸른 영혼',
        'Specter of Death': '거대한 어둠의 팔',
        'Spreading Fear': '퍼뜨리기',
        'The End\'s Embrace': '인도의 날개',
        'The Fourth Season': '푸른 파동식: 사중',
        'The Second Season': '푸른 파동식: 이중',
        'Twofold Blight': '푸른 이중 파동',
      },
    },
  ],
};

export default triggerSet;
