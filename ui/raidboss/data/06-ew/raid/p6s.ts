import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  decOffset?: number;
  pathogenicCellsNumber?: number;
  pathogenicCellsDelay?: number;
  pathogenicCellsCounter: number;
  secondExocleavers?: boolean;
  aetheronecrosisDuration: number;
  predationCount: number;
  predationDebuff?: string;
  polyInstance: number;
  tileTethers: NetMatches['Tether'][];
  mapEffects: NetMatches['MapEffect'][];
  combatantData: PluginCombatantState[];
  poly5FrontBackTile?: string;
  poly5SideTile?: string;
  darkSpheres: NetMatches['StartsUsing'][];
  poly6SafeSide?: string;
  //
  prsSigma?: number;
}

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
// The first 1B marker in the encounter is an Unholy Darkness stack marker (013E).
const firstHeadmarker = parseInt('013E', 16);
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 013E.
  // (This makes the offset 0, and !0 is true.)
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const crossTileFlags = '00020001'; // mapEffect flags for '+' tile effect
const diagonalTileFlags = '00400020'; // mapEffect flags for 'x' tile effect

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AbyssosTheSixthCircleSavage,
  timelineFile: 'p6s.txt',
  initData: () => {
    return {
      pathogenicCellsCounter: 0,
      aetheronecrosisDuration: 0,
      predationCount: 0,
      polyInstance: 0,
      tileTethers: [],
      mapEffects: [],
      combatantData: [],
      darkSpheres: [],
    };
  },
  triggers: [
    {
      id: 'P6S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => {
        getHeadmarkerId(data, matches);
      },
    },
    {
      id: 'P6S Hemitheos\'s Dark IV',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7860', source: 'Hegemone', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'P6S Chelic Synergy',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '788A', source: 'Hegemone' }),
      response: Responses.sharedOrInvinTankBuster(),
    },
    {
      id: 'P6S Synergy',
      type: 'StartsUsing',
      // There are 7889 individual starts using casts on the two tanks as well,
      // if this trigger wanted to be more complicated.
      netRegex: NetRegexes.startsUsing({ id: '7887', source: 'Hegemone', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '따로 따로 탱크버스터',
          de: 'getrennte Tankbuster',
          fr: 'Séparez les Tankbusters',
          ja: '2人同時タンク強攻撃',
          cn: '分散死刑',
          ko: '따로맞는 탱버',
        },
      },
    },
    {
      id: 'P6S Polyominoid Tether Collect (테스트)',
      type: 'Tether',
      netRegex: NetRegexes.tether({ id: '00CF' }),
      run: (data, matches) => {
        data.tileTethers.push(matches);
      },
    },
    {
      id: 'P6S Polyominoid MapEffect Collect (테스트)',
      type: 'MapEffect',
      netRegex: NetRegexes.mapEffect({ flags: [crossTileFlags, diagonalTileFlags] }),
      run: (data, matches) => {
        // location '00' won't be used for determining mechanic resolution
        if (matches.location !== '00')
          data.mapEffects.push(matches);
      },
    },
    {
      // Use a single trigger for Aetherial Polyominod (7866) and
      // Polyominoid Sigma (7868).  Both use MapEffects, but only
      // 7868 uses tethers to hidden actors to "swap" tiles.
      id: 'P6S Polyominoid All (테스트)',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '786[68]', source: 'Hegemone', capture: false }),
      delaySeconds: 2, // relevant mapeffect and trigger lines are consistently sent ~1.83s after the cast
      durationSeconds: 10, // leave the output up while overlapping mechanics resolve
      promise: async (data) => {
        data.combatantData = [];
        const ids = [];
        if (data.tileTethers.length !== 0) {
          for (const tether of data.tileTethers)
            ids.push(parseInt(tether.sourceId, 16), parseInt(tether.targetId, 16));
          data.combatantData = (await callOverlayHandler({
            call: 'getCombatants',
            ids: ids,
          })).combatants;
        }
      },
      infoText: (data, _matches, output) => {
        data.polyInstance++;

        if (data.tileTethers.length > 0 && data.combatantData.length === 0)
          return;
        if (data.mapEffects.length < 2)
          return;
        if (data.polyInstance === 4) // lots of safe spots, doesn't need a trigger response
          return;

        const safe: { [tile: string]: boolean } = {
          // This ordering matters for most Poly instances.
          insideNW: true,
          insideNE: true,
          insideSW: true,
          insideSE: true,
          cornerNW: true,
          cornerNE: true,
          cornerSW: true,
          cornerSE: true,
          outsideNNW: true,
          outsideNNE: true,
          outsideSSW: true,
          outsideSSE: true,
          outsideWNW: true,
          outsideENE: true,
          outsideWSW: true,
          outsideESE: true,
        };

        // Tile index mapped to arrays containing the MapEffect location code
        // for that tile and the corresponding tile name in safe[].
        const unsafeMap: { [idx: number]: [location: string, tile: string] } = {
          0: ['01', 'cornerNW'],
          1: ['02', 'outsideNNW'],
          2: ['03', 'outsideNNE'],
          3: ['04', 'cornerNE'],

          10: ['0F', 'outsideWNW'],
          11: ['05', 'insideNW'],
          12: ['06', 'insideNE'],
          13: ['10', 'outsideENE'],

          20: ['0D', 'outsideWSW'],
          21: ['07', 'insideSW'],
          22: ['08', 'insideSE'],
          23: ['0E', 'outsideESE'],

          30: ['09', 'cornerSW'],
          31: ['0A', 'outsideSSW'],
          32: ['0B', 'outsideSSE'],
          33: ['0C', 'cornerSE'],
        };

        const mapLookup: { [location: string]: number } = Object.fromEntries(Object.entries(unsafeMap).map(([tile, [location]]) => [location, parseInt(tile, 10)]));

        // Polys 2, 3, 5, and 6 involve tethers. We only care about which
        // tiles have tethers, not which tiles are tethered together.
        // This is because there are only two types of tiles, and swaps
        // are only done between tiles of opposite types.
        const tetheredTiles = [];
        if (data.tileTethers.length >= 1) {
          for (const tile of data.combatantData) {
            // x, y = 85, 95, 105, 115 (with a little variance)
            // map to ([0, 1, 2, 3] and [0, 10, 20, 30]
            const x = Math.floor((tile.PosX - 83) / 10); // add in a -2/+8 buffer in case of goofy pos data
            const y = Math.floor((tile.PosY - 83) / 10) * 10; // add in a -2/+8 buffer in case of goofy pos data
            const idx = x + y;
            if (unsafeMap[idx] === undefined)
              return;
            tetheredTiles.push(idx);
          }
        }

        // modifiers used to calculate unsafeMap indexes to be removed for each type of tile
        const relCrossTiles = new Int8Array([-30, -20, -10, -3, -2, -1, 1, 2, 3, 10, 20, 30]);
        const relDiagonalTiles = new Int8Array([-33, -27, -22, -18, -11, -9, 9, 11, 18, 22, 27, 33]);

        for (const effect of data.mapEffects) {
          if (mapLookup[effect.location] === undefined)
            return;

          const startTile: number = mapLookup[effect.location]!;
          const isTethered: boolean = tetheredTiles.includes(startTile);

          if (unsafeMap[startTile] !== undefined)
            delete safe[unsafeMap[startTile]![1]]; // delete tile where effect appears, as it will always be unsafe
          if ((effect.flags === crossTileFlags && !isTethered) || (effect.flags === diagonalTileFlags && isTethered)) {
            relCrossTiles.forEach((tileMod) => {
              const deleteTile: number = startTile + tileMod;
              if (unsafeMap[deleteTile] !== undefined)
                delete safe[unsafeMap[deleteTile]![1]];
            });
          } else if ((effect.flags === diagonalTileFlags && !isTethered) || (effect.flags === crossTileFlags && isTethered)) {
            relDiagonalTiles.forEach((tileMod) => {
              const deleteTile: number = startTile + tileMod;
              if (unsafeMap[deleteTile] !== undefined)
                delete safe[unsafeMap[deleteTile]![1]];
            });
          } else {
            return;
          }
        }

        const safeTiles: string[] = Object.keys(safe);
        const [safe0, safe1] = safeTiles;

        if (safe0 === undefined)
          return;

        const outsideFrontBackTiles = ['outsideNNW', 'outsideNNE', 'outsideSSW', 'outsideSSE'];
        const outsideSideTiles = ['outsideWNW', 'outsideENE', 'outsideWSW', 'outsideESE'];
        // establishes pairs of east/west tiles that will be safe during Poly 6
        const poly6Pairs: { [anchor: keyof typeof safe]: keyof typeof safe } = {
          insideNW: 'outsideSSW',
          insideNE: 'outsideSSE',
          insideSW: 'outsideNNW',
          insideSE: 'outsideNNE',
          cornerNW: 'outsideWSW',
          cornerNE: 'outsideESE',
          cornerSE: 'outsideENE',
          cornerSW: 'outsideWNW',
        };

        switch (data.polyInstance) {
          case 1: // four safe spots: two inside (east or west pair) and two outside (opposite east or west pair)
            if (safeTiles.length !== 4)
              return;
            if (safe0 === 'insideNW')
              return output.combo!({ dir1: output.insideWest!(), dir2: output.outsideEast!() });
            else if (safe0 === 'insideNE')
              return output.combo!({ dir1: output.insideEast!(), dir2: output.outsideWest!() });
            return;
          case 2: // one inside safe spot
            if (safeTiles.length !== 1 || output[safe0] === undefined)
              return;
            return output.single!({ dir1: output[safe0]!() });
          case 3: // two inside safe spots
            if (safeTiles.length !== 2 || safe1 === undefined || output[safe0] === undefined || output[safe1] === undefined)
              return;
            return output.combo!({ dir1: output[safe0]!(), dir2: output[safe1]!() });
          case 4: // here for completeness, but should never be run
            return;
          case 5: // two outside safe spots (reduced to one by Chorus Ixou)
            if (safeTiles.length !== 2 || safe1 === undefined)
              return;
            if ((outsideFrontBackTiles.includes(safe0)) && (outsideSideTiles.includes(safe1))) { // should be always true because of ordering
              data.poly5FrontBackTile = output[safe0]!();
              data.poly5SideTile = output[safe1]!();
              return; // success - output will be handled by Chorus Ixou trigger
            }
            return;
          case 6: // Cachexia 2 - four safe spots that form corners of a 3x3 tile sub-grid
            if (safeTiles.length !== 4 || safe1 === undefined || data.predationDebuff === undefined)
              return;
            // data.predationDebuff should be set by P6S Predation Debuff Collect
            // - CF7 Glossal Resistance Down (Snake Icon) (Left/west safe)
            // - CF8 Chelic Resistance Down (Wing Icon) (right/east safe)
            // for pol6, safe0 should always be an inside tile, and safe1 should always be a corner tile
            if (data.predationDebuff === 'CF7') {
              data.poly6SafeSide = output.left!();
              if (safe0 === 'insideNW' || safe0 === 'insideSW') // inside + wall tile safe
                return output.poly6!({ dir1: output.left!(), dir2: output[safe0]!(), dir3: output[poly6Pairs[safe0]!]!() });
              else if (safe1 === 'cornerNW' || safe1 === 'cornerSW')
                return output.poly6!({ dir1: output.left!(), dir2: output[safe1]!(), dir3: output[poly6Pairs[safe1]!]!() });
              return;
            } else if (data.predationDebuff === 'CF8') {
              data.poly6SafeSide = output.right!();
              if (safe0 === 'insideNE' || safe0 === 'insideSE') // inside + wall tile safe
                return output.poly6!({ dir1: output.right!(), dir2: output[safe0]!(), dir3: output[poly6Pairs[safe0]!]!() });
              else if (safe1 === 'cornerNE' || safe1 === 'cornerSE')
                return output.poly6!({ dir1: output.right!(), dir2: output[safe1]!(), dir3: output[poly6Pairs[safe1]!]!() });
              return;
            }
            return;
          case 7: // one inside safe spot
            if (safeTiles.length !== 1 || output[safe0] === undefined)
              return;
            return output.single!({ dir1: output[safe0]!() });
          case 8: // four safe spots: two inside (east or west pair) and two outside (opposite east or west pair)
            if (safeTiles.length !== 4)
              return;
            if (safe0 === 'insideNW')
              return output.combo!({ dir1: output.insideWest!(), dir2: output.outsideEast!() });
            else if (safe0 === 'insideNE')
              return output.combo!({ dir1: output.insideEast!(), dir2: output.outsideWest!() });
            return;
          default:
            return;
        }
      },
      run: (data) => {
        data.tileTethers = [];
        data.mapEffects = [];
        data.combatantData = [];
      },
      outputStrings: {
        combo: {
          en: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
        },
        single: {
          en: '${dir1}',
          ja: '${dir1}',
        },
        poly6: {
          en: '${dir1}: ${dir2} / ${dir3}',
          ja: '${dir1}: ${dir2} / ${dir3}',
        },
        left: {
          en: '🡸왼쪽 (날개)',
          ja: '左 (翼)',
        },
        right: {
          en: '🡺오른쪽 (비암)',
          ja: '右 (蛇)',
        },
        insideWest: {
          en: '안🡸',
          ja: '内側🡸',
        },
        insideEast: {
          en: '안🡺',
          ja: '内側🡺',
        },
        outsideWest: {
          en: '바깥🡸🡸',
          ja: '外側🡸🡸',
        },
        outsideEast: {
          en: '바깥🡺🡺',
          ja: '外側🡺🡺',
        },
        insideNW: {
          en: '안🡼',
          ja: '内側🡼',
        },
        insideNE: {
          en: '안🡽',
          ja: '内側🡽',
        },
        insideSE: {
          en: '안🡾',
          ja: '内側🡾',
        },
        insideSW: {
          en: '안🡿',
          ja: '内側🡿',
        },
        outsideNNW: {
          en: '첫줄🡸2',
          ja: '1列🡸2',
        },
        outsideNNE: {
          en: '첫줄🡺3',
          ja: '1列🡺3',
        },
        outsideSSW: {
          en: '맨아래줄🡸2',
          ja: '4列🡸2',
        },
        outsideSSE: {
          en: '맨아래줄🡺3',
          ja: '4列🡺3',
        },
        outsideWNW: {
          en: '두째줄🡸🡸1',
          ja: '2列🡸🡸1',
        },
        outsideENE: {
          en: '두째쭐🡺🡺4',
          ja: '2列🡺🡺4',
        },
        outsideWSW: {
          en: '세째줄🡸🡸1',
          ja: '3列🡸🡸1',
        },
        outsideESE: {
          en: '세째줄🡺🡺4',
          ja: '3列🡺🡺4',
        },
        cornerNW: {
          en: '🡼구석',
          ja: '🡼隅',
        },
        cornerNE: {
          en: '🡽구석',
          ja: '🡽隅',
        },
        cornerSE: {
          en: '🡾구석',
          ja: '🡾隅',
        },
        cornerSW: {
          en: '🡿구석',
          ja: '🡿隅',
        },
      },
    },
    {
      id: 'P6S Exocleaver Healer Groups',
      // Unholy Darkness stack headmarkers are same time as first Exocleaver
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7869', '786B'], source: 'Hegemone', capture: false }),
      condition: (data) => !data.secondExocleavers,
      alertText: (_data, _matches, output) => output.healerGroups!(),
      run: (data) => data.secondExocleavers = true,
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'P6S Exocleaver Move',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['7869', '786B'], source: 'Hegemone', capture: false }),
      // Supress until after second Exocleaver in the set
      suppressSeconds: 4,
      response: Responses.moveAway(),
    },
    {
      id: 'P6S Polyominoid Healer Groups (테스트)',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7892', source: 'Hegemone', capture: false }),
      // Should not be fired during Poly 1, since the Unholy Darkness headmarkers there
      // are handled by P6S Exocleaver Healer Groups.
      condition: (data) => data.polyInstance === 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.healerGroups!(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'P6S Choros Ixou Front Back (테스트)',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7883', source: 'Hegemone', capture: false }),
      alertText: (data, _matches, output) => {
        if (data.polyInstance === 5 && data.poly5FrontBackTile !== undefined)
          return output.goFrontBackPoly5!({ tile: data.poly5FrontBackTile });
        return output.goFrontBack!();
      },
      outputStrings: {
        goFrontBack: Outputs.goFrontBack,
        goFrontBackPoly5: {
          en: '앞/뒤로 (${tile})',
          ja: '縦へ (${tile})',
        },
      },
    },
    {
      id: 'P6S Choros Ixou Sides (테스트)',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7881', source: 'Hegemone', capture: false }),
      alertText: (data, _matches, output) => {
        if (data.polyInstance === 5 && data.poly5SideTile !== undefined)
          return output.goSidesPoly5!({ tile: data.poly5SideTile });
        return output.goSides!();
      },
      outputStrings: {
        goSides: Outputs.sides,
        goSidesPoly5: {
          en: '옆으로 (${tile})',
          ja: '横へ (${tile})',
        },
      },
    },
    {
      id: 'P6S Pathogenic Cells Numbers',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: (data, matches) => {
        return data.me === matches.target && (/00(?:4F|5[0-6])/).test(getHeadmarkerId(data, matches));
      },
      preRun: (data, matches) => {
        const correctedMatch = getHeadmarkerId(data, matches);
        const pathogenicCellsNumberMap: { [id: string]: number } = {
          '004F': 1,
          '0050': 2,
          '0051': 3,
          '0052': 4,
          '0053': 5,
          '0054': 6,
          '0055': 7,
          '0056': 8,
        };
        data.pathogenicCellsNumber = pathogenicCellsNumberMap[correctedMatch];

        const pathogenicCellsDelayMap: { [id: string]: number } = {
          '004F': 8.6,
          '0050': 10.6,
          '0051': 12.5,
          '0052': 14.4,
          '0053': 16.4,
          '0054': 18.3,
          '0055': 20.2,
          '0056': 22.2,
        };
        data.pathogenicCellsDelay = pathogenicCellsDelayMap[correctedMatch];
      },
      durationSeconds: (data) => {
        // Because people are very forgetful,
        // show the number until you are done.
        return data.pathogenicCellsDelay;
      },
      alertText: (data, _matches, output) => output.text!({ num: data.pathogenicCellsNumber }),
      outputStrings: {
        text: {
          en: '나: ${num}번',
          de: '#${num}',
          fr: '#${num}',
          ja: '自分: ${num}番',
          cn: '#${num}',
          ko: '${num}번째',
        },
      },
    },
    {
      id: 'P6S Pathogenic Cells Counter',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7865', source: 'Hegemone', capture: false }),
      preRun: (data, _matches) => data.pathogenicCellsCounter++,
      durationSeconds: 1.5,
      suppressSeconds: 1,
      sound: '',
      infoText: (data, _matches, output) => output.text!({ num: data.pathogenicCellsCounter }),
      tts: null,
      outputStrings: {
        text: {
          en: '${num}번',
          de: '${num}',
          fr: '${num}',
          ja: '${num}番',
          cn: '${num}',
          ko: '${num}',
        },
      },
    },
    {
      // Each head marker is for each scenario.
      // There are markers for: stack, no exchange; spread exchanged to donut; spread exchanged to stack; etc.
      // Therefore, there is no need to keep track of tethers as well.
      id: 'P6S Exchange of Agonies Markers',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        const correctedMatch = getHeadmarkerId(data, matches);
        switch (correctedMatch) {
          case '0163': // stack
          case '0167': // spread exchanged to stack
          case '0169': // donut exchanged to stack
            return output.stackOnYou!();
          case '0164': // spread
          case '0165': // stack exchanged to spread
          case '016A': // donut exchanged to spread
            return output.spreadCorner!();
          case '0166': // stack exchanged to donut
          case '0168': // spread exchanged to donut
          case '016E': // donut
            return output.donut!();
        }
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        donut: {
          en: '도넛! 뭉쳐욧!',
          de: 'Sammeln Donut',
          fr: 'Packez-vous, donut',
          ja: '頭割り',
          cn: '集合放月环',
          ko: '도넛 장판, 쉐어',
        },
        spreadCorner: {
          en: '구석으로 가욧!',
          de: 'In Ecken Verteilen',
          fr: 'Écartez-vous dans le coin',
          ja: '隅で散会',
          cn: '去角落',
          ko: '구석으로 산개',
        },
      },
    },
    {
      id: 'P6S Dark Dome Bait',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '788B', source: 'Hegemone', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '돔 장판 유도!',
          de: 'Kreise ködern',
          fr: 'Déposez les cercles',
          ja: 'ゆか誘導',
          cn: '集合放圈',
          ko: '장판 유도',
        },
      },
    },
    {
      id: 'P6S Dark Dome Move',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '788B', source: 'Hegemone', capture: false }),
      response: Responses.moveAway(),
    },
    {
      id: 'P6S Predation Debuff Collect',
      // CF7 Glossal Resistance Down (Snake Icon)
      // CF8 Chelic Resistance Down (Wing Icon)
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: ['CF7', 'CF8'] }),
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.predationDebuff = matches.effectId,
    },
    {
      id: 'P6S Predation Bait Order',
      // Using Aetheronecrosis (CF9)
      // These come out as 20s, 16s, 12s, or 8s
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CF9' }),
      condition: Conditions.targetIsYou(),
      preRun: (data, matches) => data.aetheronecrosisDuration = parseFloat(matches.duration),
      delaySeconds: 0.1,
      durationSeconds: (_data, matches) => {
        const duration = parseFloat(matches.duration);
        // First Dual Predation is 3.7s before expiration
        // Remaining Dual Predations are 12.3s (second), 12.4s (third/fourth)
        return duration > 16 ? duration - 3.8 : duration + 12.3;
      },
      infoText: (data, matches, output) => {
        const duration = parseFloat(matches.duration);
        const dir = data.predationDebuff === 'CF7' ? output.left!() : output.right!();
        let numBait;

        // Allow for slight variation in duration
        if (duration <= 8) {
          numBait = output.secondBait!();
        } else if (duration <= 12) {
          numBait = output.thirdBait!();
        } else if (duration <= 16) {
          numBait = output.fourthBait!();
        } else {
          // 20s
          numBait = output.firstBait!();
        }

        return output.text!({ dir: dir, bait: numBait });
      },
      outputStrings: {
        text: {
          en: '${dir}, ${bait}',
          de: '${dir}, ${bait}',
          fr: '${dir}, ${bait}',
          ja: '${dir}, ${bait}',
          ko: '${dir}, ${bait}',
        },
        left: {
          en: '🡸왼쪽 (날개)',
          de: 'Links (Flügel-Seite)',
          fr: 'Gauche (Côté Aile)',
          ja: '左 (翼)',
          cn: '左 (翅膀)',
          ko: '왼쪽 (날개쪽)',
        },
        right: {
          en: '🡺오른쪽 (비암)',
          de: 'Rechts (Schlangen-Seite)',
          fr: 'Droite (Côté Serpent)',
          ja: '右 (蛇)',
          cn: '右 (蛇)',
          ko: '오른쪽 (뱀쪽)',
        },
        firstBait: {
          en: '#1 (안/20초)',
          de: 'Köder als 1. (20s)',
          fr: 'Dépose en 1er (20s)',
          ja: '1番目 (20秒)',
          cn: '1组引导 (20秒)',
          ko: '유도 1번 (20초)',
        },
        secondBait: {
          en: '#2 (위/8초)',
          de: 'Köder als 2. (8s)',
          fr: 'Dépose en 2ème (8s)',
          ja: '2番目 (8秒)',
          cn: '2组引导 (8秒)',
          ko: '유도 2번 (8초)',
        },
        thirdBait: {
          en: '#3 (밖/12초)',
          de: 'Köder als 3. (12s)',
          fr: 'Dépose en 3ème (12s)',
          ja: '3番目 (12秒)',
          cn: '3组引导 (12秒)',
          ko: '유도 3번 (12초)',
        },
        fourthBait: {
          en: '#4 (아래/16초)',
          de: 'Köder als 4. (16s)',
          fr: 'Dépose en 4ème (16s)',
          ja: '4番目 (16秒)',
          cn: '4组引导 (16秒)',
          ko: '유도 4번 (16초)',
        },
      },
    },
    {
      id: 'P6S Predation In First Bait Reminder',
      // Using Dual Predation (7878)
      // Delayed to give roughly same notice interval as other bait reminders
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7878', source: 'Hegemone' }),
      condition: (data) => data.aetheronecrosisDuration > 16,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      infoText: (_data, _matches, output) => output.inFirstBait!(),
      outputStrings: {
        inFirstBait: {
          en: '안으로 (#1)',
          de: 'Rein (Köder als 1.)',
          fr: 'À l\'intérieur (1er)',
          ja: '内側へ (1番目)',
          cn: '内侧引导 (第1组)',
          ko: '안으로 (유도 1번)',
        },
      },
    },
    {
      id: 'P6S Predation In Bait Reminder',
      // Using Chelic Predation (787B) and Glossal Predation (787A)
      // Player could get hit at wrong time and still get this trigger
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['787A', '787B'], source: 'Hegemone', capture: false }),
      durationSeconds: 4,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        data.predationCount = data.predationCount + 1;
        let countMap;

        // Allow for slight variation in duration
        if (data.aetheronecrosisDuration <= 8) {
          countMap = 1;
        } else if (data.aetheronecrosisDuration <= 12) {
          countMap = 2;
        } else if (data.aetheronecrosisDuration <= 16) {
          countMap = 3;
        } else {
          // 20s
          countMap = 0;
        }

        // Output for in players
        if (countMap === data.predationCount) {
          const inBaitMap: { [duration: number]: string } = {
            1: output.inSecondBait!(),
            2: output.inThirdBait!(),
            3: output.inFourthBait!(),
          };
          return inBaitMap[data.predationCount];
        }
      },
      outputStrings: {
        inSecondBait: {
          en: '안으로 (#2)',
          de: 'Rein (Köder als 2.)',
          fr: 'À l\'intérieur (2ème)',
          ja: '内側へ (2番目)',
          cn: '内侧引导 (第2组)',
          ko: '안으로 (유도 2번)',
        },
        inThirdBait: {
          en: '안으로 (#3)',
          de: 'Rein (Köder als 3.)',
          fr: 'À l\'intérieur (3ème)',
          ja: '内側へ (3番目)',
          cn: '内侧引导 (第3组)',
          ko: '안으로 (유도 3번)',
        },
        inFourthBait: {
          en: '안으로 (#4)',
          de: 'Rein (Köder als 4.)',
          fr: 'À l\'intérieur (4ème)',
          ja: '内側へ (4番目)',
          cn: '内侧引导 (第4组)',
          ko: '안으로 (유도 4번)',
        },
      },
    },
    {
      id: 'P6S Predation Out',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['787A', '787B'], source: 'Hegemone' }),
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.out!(),
      outputStrings: {
        out: Outputs.out,
      },
    },
    {
      id: 'P6S Ptera Ixou (테스트)',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '787C', source: 'Hegemone', capture: false }),
      condition: (data) => data.polyInstance !== 6, // do not run during Poly 6/Cachexia 2 - this is handled by P6S Cachexia 2 Dark Spheres
      infoText: (data, _matches, output) => data.predationDebuff === 'CF7' ? output.left!() : output.right!(),
      outputStrings: {
        left: {
          en: '🡸왼쪽 (날개)',
          de: 'Links (Flügel-Seite)',
          fr: 'Gauche (Côté Aile)',
          ja: '左 (翼)',
          cn: '左 (翅膀)',
          ko: '왼쪽 (날개쪽)',
        },
        right: {
          en: '🡺오른쪽 (비암)',
          de: 'Rechts (Schlangen-Seite)',
          fr: 'Droite (Côté Serpent)',
          ja: '右 (蛇)',
          cn: '右 (蛇)',
          ko: '오른쪽 (뱀쪽)',
        },
      },
    },
    {
      id: 'P6S Dark Spheres Collect (테스트)',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7880', source: 'Hegemone' }),
      run: (data, matches) => data.darkSpheres.push(matches),
    },
    {
      id: 'P6S Cachexia 2 Dark Spheres (테스트)',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7880', source: 'Hegemone', capture: false }),
      delaySeconds: 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        for (const darkSphere of data.darkSpheres) {
          if (data.me === darkSphere.target)
            return data.poly6SafeSide === undefined ? output.spread!() : output.spreadSide!({ dir1: data.poly6SafeSide });
          return data.poly6SafeSide === undefined ? output.stack!() : output.stackSide!({ dir1: data.poly6SafeSide });
        }
      },
      outputStrings: {
        spread: Outputs.spread,
        stack: Outputs.stackMarker,
        spreadSide: {
          en: '흩어져욧 ${dir1}',
          ja: '散会 ${dir1}',
        },
        stackSide: {
          en: '뭉쳐욧 ${dir1}',
          ja: '頭割り ${dir1}',
        },
      },
    },
    {
      id: 'P6S Transmission',
      type: 'GainsEffect',
      // CF3 Chelomorph (Wing icon - cleave behind player)
      // D48 Glossomorph (Snake icon - cleave in front of player)
      netRegex: NetRegexes.gainsEffect({ effectId: ['CF3', 'D48'] }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => {
        // 1st transmission has 11s duration, 2nd has 25s duration
        // in either case, trigger should fire 3s before debuff expires
        return parseFloat(matches.duration) - 3;
      },
      infoText: (_data, matches, output) => {
        return matches.effectId === 'D48' ? output.forwardCleave!() : output.backwardCleave!();
      },
      outputStrings: {
        forwardCleave: {
          en: '입에서 트림',
          ja: '口からおくび',
        },
        backwardCleave: {
          en: '방구 뽕',
          ja: '尻からおなら',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Hegemone': 'Hegemone',
        'Parasitos': 'Parasit',
      },
      'replaceText': {
        'Aetherial Exchange': 'Ätherwechsel',
        'Aetheric Polyominoid': 'Äther-Polyomino',
        'Aetheronecrosis': 'Explozelle',
        'Cachexia': 'Cachexia',
        'Chelic Claw': 'Chelische Kralle',
        'Choros Ixou': 'Choros Ixou',
        'Dark Ashes': 'Dunkle Asche',
        'Dark Dome': 'Dunkles Gewölbe',
        'Dark Sphere': 'Dunkle Kugel',
        'Dual Predation': 'Doppelte Prädation',
        'Exchange Of Agonies': 'Wechselschub',
        'Exocleaver': 'Exospalter',
        'Hemitheos\'s Dark IV': 'Hemitheisches Nachtka',
        'Pathogenic Cells': 'Pathogene Zellen',
        'Polyominoid Sigma': 'Äther-Polyomino Σ',
        'Polyominous Dark IV': 'Neka-Polyomino',
        '(?<!Dual )Predation': 'Prädation',
        'Ptera Ixou': 'Ptera Ixou',
        'Reek Havoc': 'Gasausstoß',
        'Synergy': 'Synergie',
        'Transmission': 'Parasitismus',
        'Unholy Darkness': 'Unheiliges Dunkel',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Hegemone': 'Hégémone',
        'Parasitos': 'créature parasite',
      },
      'replaceText': {
        'Aetherial Exchange': 'Changement éthéréen',
        'Aetheric Polyominoid': 'Polyomino éthéré',
        'Aetheronecrosis': 'Cellules magiques actives',
        'Cachexia': 'Cachexie',
        'Chelic Claw': 'Griffe chélique',
        'Choros Ixou': 'Choros Ixou',
        'Dark Ashes': 'Cendres ténébreuses',
        'Dark Dome': 'Dôme ténébreux',
        'Dark Sphere': 'Sphère sombre',
        'Dual Predation': 'Double attaque parasitaire',
        'Exchange Of Agonies': 'Panaché ténébreux',
        'Exocleaver': 'Exo-couperet',
        'Hemitheos\'s Dark IV': 'Giga Ténèbres d\'hémithéos',
        'Pathogenic Cells': 'Souffle de cellules parasites',
        'Polyominoid Sigma': 'Polyomino éthéré Σ',
        'Polyominous Dark IV': 'Polyomino Giga Ténèbres',
        'Ptera Ixou': 'Ptera Ixou',
        'Reek Havoc': 'Exhalaison',
        'Synergy': 'Synergie',
        'Transmission': 'Parasitage',
        'Unholy Darkness': 'Miracle ténébreux',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Hegemone': 'ヘーゲモネー',
        'Parasitos': '寄生生物',
      },
      'replaceText': {
        'Aetherial Exchange': 'エーテルチェンジ',
        'Aetheric Polyominoid': 'エーテル・ポリオミノ',
        'Aetheronecrosis': '魔活細胞',
        'Cachexia': 'カヘキシー',
        'Chelic Claw': '爪撃',
        'Choros Ixou': 'ホロス・イクソス',
        'Dark Ashes': 'ダークアッシュ',
        'Dark Dome': 'ダークドーム',
        'Dark Sphere': 'ダークスフィア',
        'Dual Predation': '甲軟双撃',
        'Exchange Of Agonies': 'チェンジバースト',
        'Exocleaver': 'エクソークリーバー',
        'Hemitheos\'s Dark IV': 'ヘーミテオス・ダージャ',
        'Pathogenic Cells': '軟体細胞流',
        'Polyominoid Sigma': 'エーテル・ポリオミノΣ',
        'Polyominous Dark IV': 'ダージャ・ポリオミノ',
        'Ptera Ixou': 'プテラ・イクソス',
        'Reek Havoc': '噴気',
        'Synergy': 'シュネルギア',
        'Transmission': '寄生',
        'Unholy Darkness': 'ダークホーリー',
      },
    },
  ],
};

export default triggerSet;
