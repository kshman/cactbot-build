import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { OutputStrings, TriggerSet } from '../../../../../types/trigger';

type Phase = 'arena' | 'swords' | 'lines' | 'knockaround';

const tileNames = [
  'northCorner',
  'northwestNorth',
  'northeastNorth',
  'northwestWest',
  'insideNorth',
  'northeastEast',
  'westCorner',
  'insideWest',
  'insideEast',
  'eastCorner',
  'southwestWest',
  'insideSouth',
  'southeastEast',
  'southwestSouth',
  'southeastSouth',
  'southCorner',
] as const;

type TileName = typeof tileNames[number] | 'unknown';
type TileMap = { [y: number]: { [x: number]: TileName } };

const syncTilesMap: TileMap = {
  // y1: { x1: tileName, x2: tileName, etc. }
  // Use rounded ints for all positions to avoid fuzzy floating point values on StartsUsing lines
  89: { 100: 'northCorner' },
  93: {
    96: 'northwestNorth',
    104: 'northeastNorth',
  },
  96: {
    93: 'northwestWest',
    100: 'insideNorth',
    107: 'northeastEast',
  },
  100: {
    89: 'westCorner',
    96: 'insideWest',
    104: 'insideEast',
    111: 'eastCorner',
  },
  104: {
    93: 'southwestWest',
    100: 'insideSouth',
    107: 'southeastEast',
  },
  107: {
    96: 'southwestSouth',
    104: 'southeastSouth',
  },
  111: { 100: 'southCorner' },
};

const findClosestTile: (x: number, y: number) => TileName = (x, y) => {
  const tileValues = Object.keys(syncTilesMap).map(Number);
  const closestX = tileValues.reduce((a, b) => Math.abs(b - x) < Math.abs(a - x) ? b : a);
  const closestY = tileValues.reduce((a, b) => Math.abs(b - y) < Math.abs(a - y) ? b : a);

  const possibleTiles = syncTilesMap[closestY];
  if (possibleTiles === undefined) {
    return 'unknown';
  }
  const closestTile = possibleTiles[closestX];
  if (closestTile === undefined) {
    return 'unknown';
  }
  return closestTile;
};

const quadrantNames = ['north', 'east', 'south', 'west'] as const;
type QuadrantName = typeof quadrantNames[number];

const knockPlatforms = ['northwest', 'northeast', 'southwest', 'southeast'] as const;
type Intercard = typeof knockPlatforms[number];

// Forged Track
// The NE & NW platforms always have wind+fire tethers; SE & SW platforms always have line cleaves
// There are two possible arrangements for wind/fire and two for line cleave, so four in total.
// 1. Fire/Wind: Either both pairs of fire tethers will be closer to N than wind tethers, or both
//     will be closer to E&W. We'll call these 'fireInside' and 'fireOutside' respectively.
// 2. Line Cleaves: The line cleave tethers are identical for SE & SW, but one set is
//    inverted (e.g. mirror platform and main platform connections are swapped).
//    The easiest way to describe / distingish the two possible configurations is to look at
//    adjacent pairs of tiles on the SE/SW edge of the *main plat*. On one intercard, the tethers
//    coming from the adjacent tile pairs cross each other; on the other intercard, they do not
//    cross each other but run more parallel. So, in one configuration, the adjacent SE tethers
//    cross while the adjacent SW tethers do not; in the second config, it's vice-versa.
//    We'll call these configurations 'seCross' and 'swCross' respectively.
// tldr; 4 possible arrangements: fireInside or fireOutside + seCross or swCross.
//
// We can determine which it is based on MapEffect combinations:
//   locations '05'/'08' - NW/NE platforms (unclear which is which, but doesn't matter):
//      { location: '05', flags: '00020001' } - fireInside
//      { location: '08', flags: '00020001' } - fireOutside
//   locations '02'/'03' - SE/SW platforms (same):
//      { location: '02', flags: '02000100' } - swCross
//      { location: '03', flags: '02000100' } - seCross
const forgedTrackMapEffectFlags = ['00020001', '02000100'];
const forgedTrackMapEffectLocs = ['02', '03', '05', '08'];

type FireWindSetup = 'fireInside' | 'fireOutside';
type LineCleaveSetup = 'seCross' | 'swCross';

// define "safe lanes" for each intercardinal side of the main platform,
// consisting of all 4 tiles on that side.  Order the corner tiles last,
// so they will be used for a safe callout only if no intercard tile is safe
const forgedTrackSafeLanes: { [K in Intercard]: TileName[] } = {
  'northeast': ['northeastNorth', 'northeastEast', 'northCorner', 'eastCorner'],
  'southeast': ['southeastEast', 'southeastSouth', 'eastCorner', 'southCorner'],
  'southwest': ['southwestSouth', 'southwestWest', 'southCorner', 'westCorner'],
  'northwest': ['northwestWest', 'northwestNorth', 'westCorner', 'northCorner'],
};

// For seCross & swCross, handle the crossing tether logic by mapping each of the possible tiles
// the sword could start on, through its tether, to the near and far tiles it will hit
// (thereby eliminating those as potential safe spots).
const crossMap: {
  [Setup in LineCleaveSetup]: {
    [Tile in TileName]?: [TileName, TileName];
  };
} = {
  'seCross': {
    'eastCorner': ['southeastEast', 'northwestNorth'], // crosses to southeastEast
    'southeastEast': ['southCorner', 'westCorner'], // crosses to southCorner
    'southeastSouth': ['eastCorner', 'northCorner'], // crosses to eastCorner
    'southwestSouth': ['southCorner', 'eastCorner'], // crosses to southCorner
    'southwestWest': ['westCorner', 'northCorner'], // crosses to westcorner
    'westCorner': ['southwestSouth', 'northeastEast'], // crosses to southwestSouth
  },
  'swCross': {
    'eastCorner': ['southeastSouth', 'northwestWest'], // crosses to southeastSouth
    'southeastEast': ['eastCorner', 'northCorner'], // crosses to eastCorner
    'southeastSouth': ['southCorner', 'westCorner'], // crosses to southCorner
    'southwestSouth': ['westCorner', 'northCorner'], // crosses to westCorner
    'southwestWest': ['southCorner', 'eastCorner'], // crosses too southCorner
    'westCorner': ['southwestWest', 'northeastNorth'], // crosses to southwestWest
  },
};

// A `southCorner` starting sword needs special handling, as it will hit different tiles
// depending on whether it originates from the southeast or southwest platform.
const crossMapSouthCorner: {
  [Setup in LineCleaveSetup]: {
    [Platform in Intercard]?: [TileName, TileName];
  };
} = {
  'seCross': {
    'southeast': ['southeastSouth', 'northwestWest'], // southCorner crosses to southeastSouth
    'southwest': ['southwestWest', 'northeastNorth'], // southCorner crosses to southwestWest
  },
  'swCross': {
    'southeast': ['southeastEast', 'northwestNorth'], // southCorner crosses to southeastEast
    'southwest': ['southwestSouth', 'northeastEast'], // southCorner crosses to southwestSouth
  },
};

const stayGoOutputStrings: OutputStrings = {
  stay: {
    en: 'Stay',
    ko: '그대로',
  },
  goAcross: {
    en: 'Go Across',
    ko: '건너가서',
  },
};

export interface Data extends RaidbossData {
  phase: Phase;
  unsafeTiles: TileName[];
  forgedTrackSafeTiles: TileName[];
  fireWindSetup?: FireWindSetup;
  lineCleaveSetup?: LineCleaveSetup;
  fireWindEffect?: 'fire' | 'wind';
  fireWindSafeDir?: Intercard;
  drumTargets: string[];
  drumFar: boolean; // got knocked by enum partner to far platform
  knockPlatform?: Intercard;
  unsafeQuadrants: QuadrantName[];
  cantTakeTornadoJump: boolean;
  halfCircuitSafeSide?: 'left' | 'right';
  seenHalfCircuit: boolean;
  //
  prIsTurmoil: boolean;
  prTurmoilCount: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'EverkeepExtreme',
  zoneId: ZoneId.EverkeepExtreme,
  timelineFile: 'zoraal-ja-ex.txt',
  initData: () => {
    return {
      phase: 'arena',
      unsafeTiles: [],
      forgedTrackSafeTiles: [],
      drumTargets: [],
      drumFar: false,
      unsafeQuadrants: [],
      cantTakeTornadoJump: false,
      seenHalfCircuit: false,
      //
      prIsTurmoil: false,
      prTurmoilCount: 0,
    };
  },
  triggers: [
    {
      id: 'Zoraal Ja Ex Phase Tracker',
      type: 'StartsUsing',
      // 9397 - Dawn of an Age
      // 938F - Drum of Vollok
      // 938A - Projection of Triumph
      // 93A2 - Multidirectional Divide (needed to reset to arena phase before enrage)
      netRegex: { id: ['9397', '938F', '938A', '93A2'], source: 'Zoraal Ja' },
      run: (data, matches) => {
        // Knockaround is preceded by a 'Dawn of an Age' cast, but catching 'Drum of Vollok'
        // allows us to detect phase correctly.
        if (matches.id === '9397')
          data.phase = 'swords';
        else if (matches.id === '938F')
          data.phase = 'knockaround';
        else if (matches.id === '938A')
          data.phase = 'lines';
        else
          data.phase = 'arena';
      },
    },
    {
      id: 'Zoraal Ja Ex Actualize',
      type: 'StartsUsing',
      netRegex: { id: '9398', source: 'Zoraal Ja', capture: false },
      response: Responses.aoe(),
    },
    {
      // Right sword glowing (right safe)
      id: 'Zoraal Ja Ex Forward Half Right Sword',
      type: 'StartsUsing',
      netRegex: { id: ['937B', '999A'], source: 'Zoraal Ja', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'knockaround') { // 999A is the knockaround version
          const stayGo = data.drumFar ? output.goAcross!() : output.stay!();
          return output.frontRightKnockaround!({ stayGo: stayGo });
        }
        return output.frontRight!();
      },
      outputStrings: {
        frontRight: {
          en: 'Front + Boss\'s Right',
          ko: '▲앞쪽 🡸왼쪽',
        },
        ...stayGoOutputStrings,
        frontRightKnockaround: {
          en: 'Front + Boss\'s Right (${stayGo})',
          ko: '${stayGo} ▲앞쪽 🡸왼쪽',
        },
      },
    },
    {
      // Left sword glowing (left safe)
      id: 'Zoraal Ja Ex Forward Half Left Sword',
      type: 'StartsUsing',
      netRegex: { id: ['937C', '999B'], source: 'Zoraal Ja', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'knockaround') { // 999B is the knockaround version
          const stayGo = data.drumFar ? output.goAcross!() : output.stay!();
          return output.frontLeftKnockaround!({ stayGo: stayGo });
        }
        return output.frontLeft!();
      },
      outputStrings: {
        frontLeft: {
          en: 'Front + Boss\'s Left',
          ko: '▲앞쪽 🡺오른쪽',
        },
        ...stayGoOutputStrings,
        frontLeftKnockaround: {
          en: 'Front + Boss\'s Left (${stayGo})',
          ko: '${stayGo} ▲앞쪽 🡺오른쪽',
        },
      },
    },
    {
      // Right sword glowing (left safe)
      id: 'Zoraal Ja Ex Backward Half Right Sword',
      type: 'StartsUsing',
      netRegex: { id: ['937D', '999C'], source: 'Zoraal Ja', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'knockaround') { // 999C is the knockaround version
          const stayGo = data.drumFar ? output.stay!() : output.goAcross!();
          return output.backRightKnockaround!({ stayGo: stayGo });
        }
        return output.backRight!();
      },
      outputStrings: {
        backRight: {
          en: 'Behind + Boss\'s Left',
          ko: '▼뒤쪽 🡸왼쪽',
        },
        ...stayGoOutputStrings,
        backRightKnockaround: {
          en: 'Behind + Boss\'s Left (${stayGo})',
          ko: '${stayGo} ▼뒤쪽 🡸왼쪽',
        },
      },
    },
    {
      // Left sword glowing (right safe)
      id: 'Zoraal Ja Ex Backward Half Left Sword',
      type: 'StartsUsing',
      netRegex: { id: ['937E', '999D'], source: 'Zoraal Ja', capture: false },
      alertText: (data, _matches, output) => {
        if (data.phase === 'knockaround') { // 999D is the knockaround version
          const stayGo = data.drumFar ? output.stay!() : output.goAcross!();
          return output.backLeftKnockaround!({ stayGo: stayGo });
        }
        return output.backLeft!();
      },
      outputStrings: {
        backLeft: {
          en: 'Behind + Boss\'s Right',
          ko: '▼뒤쪽 🡺오른쪽',
        },
        ...stayGoOutputStrings,
        backLeftKnockaround: {
          en: 'Behind + Boss\'s Right (${stayGo})',
          ko: '${stayGo} ▼뒤쪽 🡺오른쪽',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Regicidal Rage',
      type: 'StartsUsing',
      netRegex: { id: '993B', source: 'Zoraal Ja', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tetherBuster: Outputs.tetherBusters,
          busterAvoid: Outputs.avoidTetherBusters,
        };

        if (data.role === 'tank')
          return { alertText: output.tetherBuster!() };
        return { infoText: output.busterAvoid!() };
      },
    },
    {
      id: 'Zoraal Ja Ex Dawn of an Age',
      type: 'StartsUsing',
      netRegex: { id: '9397', source: 'Zoraal Ja', capture: false },
      response: Responses.aoe(),
      run: (data) => {
        data.prIsTurmoil = false;
        data.prTurmoilCount = 0;
      },
    },
    {
      id: 'Zoraal Ja Ex Chasm of Vollok Sword Collect',
      type: 'StartsUsing',
      netRegex: { id: '9399', source: 'Fang' },
      run: (data, matches) => {
        const mirrorAdjust = 21.21; // sqrt(5^2 + 5^2) * 3
        let swordX = parseFloat(matches.x);
        let swordY = parseFloat(matches.y);
        if (swordX < 100 && swordY < 100) { // NW mirror platform
          swordX += mirrorAdjust;
          swordY += mirrorAdjust;
        } else if (swordX < 100) { // SW mirror platform
          swordX += mirrorAdjust;
          swordY -= mirrorAdjust;
        } else if (swordY < 100) { // NE mirror platform
          swordX -= mirrorAdjust;
          swordY += mirrorAdjust;
        } else { // SE mirror platform
          swordX -= mirrorAdjust;
          swordY -= mirrorAdjust;
        }

        const adjustedTile = findClosestTile(swordX, swordY);
        if (adjustedTile === 'unknown')
          return;
        data.unsafeTiles.push(adjustedTile);
      },
    },
    {
      id: 'Zoraal Ja Ex Chasm of Vollok + Half Full',
      type: 'StartsUsing',
      // 9368 - Right Sword (left/west safe)
      // 9369 - Left Sword (right/east safe)
      // Boss always faces north
      netRegex: { id: ['9368', '9369'], source: 'Zoraal Ja' },
      condition: (data) => data.phase === 'swords' && !data.seenHalfCircuit,
      durationSeconds: 6,
      alertText: (data, matches, output) => {
        // We should already have 8 safe tiles from Sword Collect
        // To make this call somewhat reasonable, use the following priority system
        // for calling a safe tile, depending on sword cleave:
        //   1. insideEast/insideWest
        //   2. insideNorth/insideSouth, lean E/W
        //   3. If all inside are bad, the outer intercard pairs (E/W depending on cleave)
        const safeSide = matches.id === '9368' ? 'west' : 'east';
        const leanOutput = matches.id === '9368' ? output.leanWest!() : output.leanEast!();

        const safeTiles = tileNames.filter((tile) => !data.unsafeTiles.includes(tile));
        if (safeTiles.length !== 8)
          return;

        if (safeSide === 'west' && safeTiles.includes('insideWest'))
          return output.insideWest!();
        else if (safeSide === 'east' && safeTiles.includes('insideEast'))
          return output.insideEast!();
        else if (safeTiles.includes('insideNorth'))
          return output.insideNS!({ lean: leanOutput });
        else if (safeSide === 'east')
          return output.intercardsEast!();
        return output.intercardsWest!();
      },
      run: (data) => data.unsafeTiles = [],
      outputStrings: {
        insideWest: {
          en: 'Inner West Diamond',
          ko: '칼질! 안쪽 서쪽',
        },
        insideEast: {
          en: 'Inner East Diamond',
          ko: '칼질! 안쪽 동쪽',
        },
        insideNS: {
          en: 'Inner North/South Diamonds - ${lean}',
          ko: '칼질! 안쪽 남북 ${lean}',
        },
        leanWest: {
          en: 'Lean West',
          ko: '약깐 서쪽',
        },
        leanEast: {
          en: 'Lean East',
          ko: '약깐 동쪽',
        },
        intercardsEast: {
          en: 'Outer Intercard Diamonds - East',
          ko: '칼질! 바깥쪽 동쪽',
        },
        intercardsWest: {
          en: 'Outer Intercard Diamonds - West',
          ko: '칼질! 바깥쪽 서쪽',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Swords Spread Markers',
      type: 'HeadMarker',
      netRegex: { id: '00B9' },
      condition: (data, matches) => data.phase === 'swords' && data.me === matches.target,
      alertText: (_data, _matches, output) => output.safeSpread!(),
      outputStrings: {
        safeSpread: Outputs.spread,
      },
    },
    // For Forged Track, we use four triggers:
    // 1. Collect the MapEffect lines to determine the fire/wind/line cleave configuration
    // 2. Collect the fire/wind sword, determine the effect and safe direction
    // 3. Collect each line cleave sword to determine safe lanes
    // 4. Provide a consolidated alert
    {
      id: 'Zoraal Ja Ex Forged Track MapEffect Collect',
      type: 'MapEffect',
      netRegex: { flags: forgedTrackMapEffectFlags, location: forgedTrackMapEffectLocs },
      condition: (data) => data.phase === 'swords',
      run: (data, matches) => {
        if (matches.location === '05')
          data.fireWindSetup = 'fireInside';
        else if (matches.location === '08')
          data.fireWindSetup = 'fireOutside';
        else if (matches.location === '02')
          data.lineCleaveSetup = 'swCross';
        else if (matches.location === '03')
          data.lineCleaveSetup = 'seCross';
      },
    },
    {
      id: 'Zoraal Ja Ex Forged Track Fire/Wind Sword Collect',
      type: 'StartsUsing',
      netRegex: { id: '939C', source: 'Fang' },
      condition: (data, matches) => data.phase === 'swords' && parseFloat(matches.y) < 85, // fire/wind sword
      run: (data, matches) => {
        if (data.fireWindSetup === undefined)
          return;

        // Same as Chasm of Vollok, remap the sword position to a corresponding main platform tile
        // But unlike Chasm of Vollok, these Fang actors are positioned at the bak of the tiles,
        // so we need a slightly different mirrorAdjust value
        const mirrorAdjust = 22.98; // sqrt(5^2 + 5^2) * 3.25
        const swordY = parseFloat(matches.y) + mirrorAdjust;
        let swordX = parseFloat(matches.x);

        let fireWindPlatform: 'northwest' | 'northeast';

        if (swordX < 85) {
          swordX += mirrorAdjust;
          fireWindPlatform = 'northwest';
        } else {
          swordX -= mirrorAdjust;
          fireWindPlatform = 'northeast';
        }

        const swordTile = findClosestTile(swordX, swordY);
        if (swordTile === 'unknown')
          return;

        // To avoid repeated nested if/else statements, assume we're seeing fireInside.
        // At the end, check the real value, and if it's fireOutside, just flip this bool
        // before setting `data.fireWindEffect` (it works because they're mirrored).
        let isFireCleave = false;

        // Since the fire/wind tethers always map to the same tiles, we can use fixed logic
        if (swordTile === 'northCorner') {
          isFireCleave = true;
          // corner tile could have two outcomes depending which platform it came from
          data.fireWindSafeDir = fireWindPlatform === 'northwest'
            ? 'southwest'
            : 'southeast';
        } else if (swordTile === 'northeastNorth') {
          isFireCleave = true;
          data.fireWindSafeDir = 'northwest';
        } else if (swordTile === 'northeastEast')
          data.fireWindSafeDir = 'southeast';
        else if (swordTile === 'eastCorner')
          data.fireWindSafeDir = 'northwest';
        else if (swordTile === 'northwestNorth') {
          isFireCleave = true;
          data.fireWindSafeDir = 'northeast';
        } else if (swordTile === 'northwestWest')
          data.fireWindSafeDir = 'southwest';
        else if (swordTile === 'westCorner')
          data.fireWindSafeDir = 'northeast';
        else
          return;

        data.forgedTrackSafeTiles = forgedTrackSafeLanes[data.fireWindSafeDir];

        if (data.fireWindSetup === 'fireOutside')
          isFireCleave = !isFireCleave;
        data.fireWindEffect = isFireCleave ? 'fire' : 'wind';
      },
    },
    {
      id: 'Zoraal Ja Ex Forged Track Cleave Swords Collect',
      type: 'StartsUsing',
      netRegex: { id: '939C', source: 'Fang' },
      condition: (data, matches) => data.phase === 'swords' && parseFloat(matches.y) > 115, // line cleave swords
      delaySeconds: 0.2, // let Fire/Wind Collect run first
      run: (data, matches) => {
        if (data.lineCleaveSetup === undefined || data.forgedTrackSafeTiles.length !== 4)
          return;

        const mirrorAdjust = 22.98; // sqrt(5^2 + 5^2) * 3.25
        const swordY = parseFloat(matches.y) - mirrorAdjust;
        let swordX = parseFloat(matches.x);

        let lineCleavePlatform: 'southwest' | 'southeast';

        if (swordX < 85) {
          swordX += mirrorAdjust;
          lineCleavePlatform = 'southwest';
        } else {
          swordX -= mirrorAdjust;
          lineCleavePlatform = 'southeast';
        }
        const swordTile = findClosestTile(swordX, swordY);
        if (swordTile === 'unknown')
          return `Unknown Tile`;

        const unsafeTiles = swordTile === 'southCorner'
          ? crossMapSouthCorner[data.lineCleaveSetup][lineCleavePlatform]
          : crossMap[data.lineCleaveSetup][swordTile];

        if (unsafeTiles === undefined)
          return;
        data.unsafeTiles.push(...unsafeTiles);
      },
    },
    {
      id: 'Zoraal Ja Ex Forged Track',
      type: 'StartsUsing',
      netRegex: { id: '935F', source: 'Zoraal Ja', capture: false },
      condition: (data) => data.phase === 'swords',
      delaySeconds: 0.4, // let the collectors finish
      durationSeconds: 9,
      alertText: (data, _matches, output) => {
        if (data.fireWindEffect === undefined)
          return output.unknown!();
        const fireWindOutput = output[data.fireWindEffect]!();

        if (data.fireWindSafeDir === undefined)
          return fireWindOutput;
        const fireWindSafeOutput = output.fireWindSafe!({
          fireWind: fireWindOutput,
          safeDir: output[data.fireWindSafeDir]!(),
        });

        // There should always be two safe tiles, but we only need one. Use the first one in the
        // array, as it is ordered to give preference to intercard (non-corner) tiles.
        let tileOutput: string;
        const safeTiles = data.forgedTrackSafeTiles.filter((tile) =>
          !data.unsafeTiles.includes(tile)
        );
        if (safeTiles.length !== 2)
          return `WTF? ${safeTiles.length} = ${safeTiles.join('|')}`;
        const [safe0] = safeTiles;
        if (safe0 === undefined)
          return fireWindSafeOutput;

        // if the first safe tile is a corner, both are. So we can call corners generally as being
        // safe (to avoid overloading the player with directional text).
        // Otherwise, call leanLeft/leanRight based on the tile orientation to the boss.
        if (safe0.includes('Corner'))
          tileOutput = output.corner!();
        else if (data.fireWindSafeDir === 'northwest')
          tileOutput = safe0 === 'northwestNorth' ? output.leanLeft!() : output.leanRight!();
        else if (data.fireWindSafeDir === 'northeast')
          tileOutput = safe0 === 'northeastEast' ? output.leanLeft!() : output.leanRight!();
        else if (data.fireWindSafeDir === 'southeast')
          tileOutput = safe0 === 'southeastSouth' ? output.leanLeft!() : output.leanRight!();
        else
          tileOutput = safe0 === 'southwestWest' ? output.leanLeft!() : output.leanRight!();

        return output.combo!({ fireWindCombo: fireWindSafeOutput, tile: tileOutput });
      },
      run: (data) => {
        data.forgedTrackSafeTiles = [];
        data.unsafeTiles = [];
        delete data.fireWindSetup;
        delete data.lineCleaveSetup;
        delete data.fireWindEffect;
        delete data.fireWindSafeDir;
      },
      outputStrings: {
        leanLeft: {
          en: '<= Inside Left (Facing Boss)',
          ko: '❰❰❰왼쪽 안으로',
        },
        leanRight: {
          en: 'Inside Right (Facing Boss) =>',
          ko: '오른쪽 안으로❱❱❱',
        },
        corner: {
          en: 'Corners Safe',
          ko: '구석 안전',
        },
        northwest: Outputs.northwest,
        northeast: Outputs.northeast,
        southeast: Outputs.southeast,
        southwest: Outputs.southwest,
        fire: {
          en: 'Go Far',
          ko: '불장판',
        },
        wind: Outputs.knockback,
        fireWindSafe: {
          en: '${fireWind} ${safeDir}',
          ko: '${fireWind} (${safeDir})',
        },
        combo: {
          en: '${fireWindCombo} + ${tile}',
          ko: '${fireWindCombo} + ${tile}',
        },
        unknown: {
          en: 'Avoid Swords',
          ko: '칼 피해요',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Bitter Whirlwind',
      type: 'StartsUsing',
      netRegex: { id: '993E', source: 'Zoraal Ja' },
      response: Responses.tankBuster(),
      run: (data) => {
        data.prIsTurmoil = false;
        data.prTurmoilCount = 0;
      },
    },
    {
      id: 'Zoraal Ja Ex Drum of Vollok Collect',
      type: 'StartsUsing',
      netRegex: { id: '938F', source: 'Zoraal Ja' },
      run: (data, matches) => data.drumTargets.push(matches.target),
    },
    {
      id: 'Zoraal Ja Ex Drum of Vollok',
      type: 'StartsUsing',
      netRegex: { id: '938F', source: 'Zoraal Ja', capture: false },
      delaySeconds: 0.3, // let Collect run first
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.drumTargets.includes(data.me))
          return output.enumOnYou!();
        data.drumFar = true;
        return output.enumKnockback!();
      },
      run: (data) => data.drumTargets = [],
      outputStrings: {
        enumOnYou: {
          en: 'Partner stack (on you)',
          ko: '내게 드럼! 산개 위치로!',
        },
        enumKnockback: {
          en: 'Partner stack (knockback)',
          ko: '넉백당해 날라가욧!',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Knockaround Swords Collect',
      type: 'StartsUsing',
      netRegex: { id: '9393', source: 'Fang' },
      condition: (data) => data.phase === 'knockaround',
      run: (data, matches) => {
        const mirrorAdjust = 21.21;
        let swordX = parseFloat(matches.x);
        let swordY = parseFloat(matches.y);

        // It seems like the mirror platform is always either NW or NE of the main platform?
        // But handle all 4 possibilities just in case.
        if (swordX < 91 && swordY < 91) {
          data.knockPlatform = 'northwest';
          swordX += mirrorAdjust;
          swordY += mirrorAdjust;
        } else if (swordX < 91) {
          data.knockPlatform = 'southwest';
          swordX += mirrorAdjust;
          swordY -= mirrorAdjust;
        } else if (swordY < 91) {
          data.knockPlatform = 'northeast';
          swordX -= mirrorAdjust;
          swordY += mirrorAdjust;
        } else if (swordY > 109) {
          data.knockPlatform = 'southeast';
          swordX -= mirrorAdjust;
          swordY -= mirrorAdjust;
        }

        let swordQuad: QuadrantName;
        if (swordX < 98)
          swordQuad = 'west';
        else if (swordX > 102)
          swordQuad = 'east';
        else if (swordY < 98)
          swordQuad = 'north';
        else
          swordQuad = 'south';

        data.unsafeQuadrants.push(swordQuad);
      },
    },
    {
      id: 'Zoraal Ja Ex Knockaround Swords + Spread',
      type: 'StartsUsing',
      netRegex: { id: '9393', source: 'Fang', capture: false },
      condition: (data) => data.phase === 'knockaround',
      delaySeconds: 0.2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const safeQuadrants = quadrantNames.filter((quad) => !data.unsafeQuadrants.includes(quad));

        if (safeQuadrants.length !== 2 || data.knockPlatform === undefined)
          return output.unknown!();

        // Call these as left/right based on whether the player is on the mirror plat or not
        // Assume they are facing the boss at this point.
        // There will always be one safe quadrant closest to the boss on each platform.

        if (data.drumFar) { // player is on the mirror platform
          if (data.knockPlatform === 'northwest')
            return safeQuadrants.includes('east')
              ? output.left!()
              : (safeQuadrants.includes('south')
                ? output.right!()
                : output.unknown!());
          else if (data.knockPlatform === 'northeast')
            return safeQuadrants.includes('west')
              ? output.right!()
              : (safeQuadrants.includes('south')
                ? output.left!()
                : output.unknown!());
          else if (data.knockPlatform === 'southeast')
            return safeQuadrants.includes('west')
              ? output.left!()
              : (safeQuadrants.includes('north')
                ? output.right!()
                : output.unknown!());
          else if (data.knockPlatform === 'southwest')
            return safeQuadrants.includes('east')
              ? output.right!()
              : (safeQuadrants.includes('north')
                ? output.left!()
                : output.unknown!());
          return output.unknown!();
        }

        // player is on the main platform
        if (data.knockPlatform === 'northwest')
          return safeQuadrants.includes('west')
            ? output.left!()
            : (safeQuadrants.includes('north')
              ? output.right!()
              : output.unknown!());
        else if (data.knockPlatform === 'northeast')
          return safeQuadrants.includes('north')
            ? output.left!()
            : (safeQuadrants.includes('east')
              ? output.right!()
              : output.unknown!());
        else if (data.knockPlatform === 'southeast')
          return safeQuadrants.includes('east')
            ? output.left!()
            : (safeQuadrants.includes('south')
              ? output.right!()
              : output.unknown!());
        else if (data.knockPlatform === 'southwest')
          return safeQuadrants.includes('south')
            ? output.left!()
            : (safeQuadrants.includes('west')
              ? output.right!()
              : output.unknown!());
        return output.unknown!();
      },
      outputStrings: {
        unknown: {
          en: 'Safe Quadrant + Spread Out',
          ko: '안전한 사분면 + 흩어져요',
        },
        left: {
          en: '<= Front Left Quadrant + Spread Out',
          ko: '❰❰❰앞 왼쪽 사분면 + 흩어져요',
        },
        right: {
          en: 'Front Right Quadrant + Spread Out =>',
          ko: '앞 오른쪽 사분면 + 흩어져요❱❱❱',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Knockaround Tornado Debuff Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '830' }, // Wind Resistance Down II - 45.96s duration
      condition: (data, matches) => {
        return data.phase === 'knockaround' &&
          data.me === matches.target &&
          parseFloat(matches.duration) > 10; // we don't care about the shorter one
      },
      run: (data) => data.cantTakeTornadoJump = true,
    },
    {
      id: 'Zoraal Ja Ex Knockaround Tornado Debuff Lose',
      type: 'LosesEffect',
      netRegex: { effectId: '830' }, // Wind Resistance Down II - 45.96s duration
      condition: (data, matches) => data.phase === 'knockaround' && data.me === matches.target,
      run: (data) => data.cantTakeTornadoJump = false,
    },
    {
      id: 'Zoraal Ja Ex Duty\'s Edge',
      type: 'StartsUsing',
      netRegex: { id: '9374', source: 'Zoraal Ja', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack',
          ko: '연속 AOE 칼질',
        },
      },
    },
    // Calling 'Stay'/'Go Across' is based on whether the player receives the chains debuff
    // and whether they still have the Wind Resistance debuff from jumping for Forward/Backward Half
    // This can lead to some potentially erroneous results - e.g., a player dies (debuff removed
    // early), is rezzed on the wrong platform, jumps early, etc.  We could instead call stay/go by
    // role, but that would break in non-standard comps, and could still lead to the same erroneous
    // results.  There doesn't seem to be a perfect solution here.
    {
      id: 'Zoraal Ja Ex Burning Chains',
      type: 'GainsEffect',
      netRegex: { effectId: '301' },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        const stayGo = data.cantTakeTornadoJump ? output.stay!() : output.goAcross!();
        return output.combo!({ breakChains: output.breakChains!(), stayGo: stayGo });
      },
      outputStrings: {
        breakChains: Outputs.breakChains,
        ...stayGoOutputStrings,
        combo: {
          en: '${breakChains} (${stayGo})',
          ko: '${stayGo} ${breakChains}',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Half Circuit Left/Right Collect',
      type: 'StartsUsing',
      // 936B - Right Sword (left safe)
      // 936C - Left Sword (right safe)
      netRegex: { id: ['936B', '936C'], source: 'Zoraal Ja' },
      run: (data, matches) => data.halfCircuitSafeSide = matches.id === '936B' ? 'left' : 'right',
    },
    {
      id: 'Zoraal Ja Ex Half Circuit',
      type: 'StartsUsing',
      // 93A0 - Swords Out (in safe)
      // 93A1 - Swords In (out safe)
      netRegex: { id: ['93A0', '93A1'], source: 'Zoraal Ja' },
      delaySeconds: 0.3, // let Left/Right Collect run first
      alertText: (data, matches, output) => {
        const inOut = matches.id === '93A0' ? output.in!() : output.out!();
        if (data.halfCircuitSafeSide === undefined)
          return inOut;
        return output.combo!({ inOut: inOut, side: output[data.halfCircuitSafeSide]!() });
      },
      run: (data) => data.seenHalfCircuit = true,
      outputStrings: {
        left: {
          en: 'Boss\'s Left',
          ko: '칼질! 왼쪽으로!!',
        },
        right: {
          en: 'Boss\'s Right',
          ko: '오른쪽!!',
        },
        in: Outputs.in,
        out: Outputs.out,
        combo: {
          en: '${inOut} + ${side}',
          ko: '칼질! ${inOut} + ${side}',
        },
      },
    },
    // Continue to use 'Boss\'s X' output rather than Outputs.left/.right for these triggers
    // Zoraal Ja jumps and rotates as the line moves through the arena, and players may
    // change directions, so use boss-relative rather than trying to guess which way the player
    // is facing.
    {
      id: 'Zoraal Ja Ex Might of Vollok Right Sword',
      type: 'StartsUsing',
      netRegex: { id: '9368', source: 'Zoraal Ja', capture: false },
      condition: (data) => data.phase === 'lines' && data.seenHalfCircuit,
      alertText: (_data, _matches, output) => output.rightSword!(),
      outputStrings: {
        rightSword: {
          en: 'Boss\'s Left',
          ko: '칼질! 왼쪽으로!!',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Might of Vollok Left Sword',
      type: 'StartsUsing',
      netRegex: { id: '9369', source: 'Zoraal Ja', capture: false },
      condition: (data) => data.phase === 'lines' && data.seenHalfCircuit,
      alertText: (_data, _matches, output) => output.leftSword!(),
      outputStrings: {
        leftSword: {
          en: 'Boss\'s Right',
          ko: '칼질! 오른쪽으로!!',
        },
      },
    },
    {
      // This Chasm of Vollok happens in swords2 and has no Half Full cleave.
      id: 'Zoraal Ja Ex Chasm of Vollok No Cleave',
      type: 'StartsUsing',
      netRegex: { id: '9399', source: 'Fang', capture: false },
      condition: (data) => data.phase === 'swords' && data.seenHalfCircuit,
      delaySeconds: 1,
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        // We should already have 8 safe tiles from Sword Collect
        // There are only six possible patterns:
        // 1. All inside tiles safe.
        // 2. No inside tiles safe (all intercard pairs safe).
        // 3-6.  Inside East&West OR North&South safe.
        const safeTiles = tileNames.filter((tile) => !data.unsafeTiles.includes(tile));
        if (safeTiles.length !== 8)
          return;

        const eastWestSafe = safeTiles.includes('insideEast') && safeTiles.includes('insideWest');
        const northSouthSafe = safeTiles.includes('insideNorth') &&
          safeTiles.includes('insideSouth');

        if (eastWestSafe && northSouthSafe)
          return output.inside!();
        else if (eastWestSafe)
          return output.eastWest!();
        else if (northSouthSafe)
          return output.northSouth!();
        return output.intercard!();
      },
      run: (data) => data.unsafeTiles = [],
      outputStrings: {
        inside: {
          en: 'Inside Safe',
          ko: '안쪽 안전',
        },
        eastWest: {
          en: 'Inside East/West Safe',
          ko: '안쪽 동서 안전',
        },
        northSouth: {
          en: 'Inside North/South Safe',
          ko: '안쪽 남북 안전',
        },
        intercard: {
          en: 'Ouside Intercards Safe (Avoid Corners)',
          ko: '바깥쪽 비스듬 안전 (구석은 피해요)',
        },
      },
    },
    // PR
    {
      id: 'Zoraal Ja Ex Projection of Triumph',
      type: 'StartsUsing',
      netRegex: { id: '938A', source: 'Zoraal Ja', capture: false },
      durationSeconds: 8,
      suppressSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Donuts and spheres',
          ko: '도넛과 동글이 피하기',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Projection of Turmoil',
      type: 'StartsUsing',
      netRegex: { id: '9A88', source: 'Zoraal Ja', capture: false },
      durationSeconds: 8,
      infoText: (data, _matches, output) => {
        data.prIsTurmoil = true;
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Line and stacks',
          ko: '빨간줄 한명씩 처리! 북으로!',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Might of Vollok',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: false },
      condition: (data) => data.prIsTurmoil,
      delaySeconds: 2,
      durationSeconds: 2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        data.prTurmoilCount++;
        if (data.prTurmoilCount >= 1 && data.prTurmoilCount <= 7)
          return output[`next${data.prTurmoilCount}` as const]!();
      },
      outputStrings: {
        next1: {
          en: 'H2',
          ko: 'H2',
        },
        next2: {
          en: 'D4',
          ko: 'D4',
        },
        next3: {
          en: 'D3',
          ko: 'D3',
        },
        next4: {
          en: 'D2',
          ko: 'D2',
        },
        next5: {
          en: 'D1',
          ko: 'D1',
        },
        next6: {
          en: 'ST',
          ko: 'ST',
        },
        next7: {
          en: 'MT',
          ko: 'MT',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Fiery Edge/Stormy Edge': 'Fiery/Stormy Edge',
        'Forward Edge/Backward Edge': 'Forward/Backward Edge',
        'Siege of Vollok/Walls of Vollok': 'Siege/Walls of Vollok',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Fang': 'Reißzahn',
        'Zoraal Ja': 'Zoraal Ja',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(lines drop\\)': '',
        'Actualize': 'Verwirklichung',
        'Aero III': 'Windga',
        'Backward Edge': 'Hinterklinge',
        'Bitter Whirlwind': 'Bitterer Wirbelwind',
        'Blade Warp': 'Klingensprung',
        'Burning Chains': 'Brennende Ketten',
        'Chasm of Vollok': 'Klippe von Vollok',
        'Dawn of an Age': 'Dämmerung eines Zeitalters',
        'Drum of Vollok': 'Trommel von Vollok',
        'Duty\'s Edge': 'Pflichtes Schneide',
        'Fiery Edge': 'Feurige Klinge',
        'Forged Track': 'Unbestimmter Pfad',
        'Forward Edge': 'Vorderklinge',
        'Greater Gateway': 'Großes Tor der Welten',
        'Half Circuit': 'Halbe Runde',
        'Half Full': 'Halbes Ganzes',
        'Multidirectional Divide': 'Wechselseitige Klingen',
        'Projection of Triumph': 'Vorhersage von Triumph',
        'Projection of Turmoil': 'Vorhersage von Aufruhr',
        'Regicidal Rage': 'Wut des Regizids',
        'Siege of Vollok': 'Belagerung von Vollok',
        'Stormy Edge': 'Stürmische Klinge',
        'Sync(?![-h])': 'Synchro',
        '(?<! )Vollok': 'Vollok',
        'Walls of Vollok': 'Mauern von Vollok',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Fang': 'crochet',
        'Zoraal Ja': 'Zoraal Ja',
      },
      'replaceText': {
        'Actualize': 'Actualisation',
        'Aero III': 'Méga Vent',
        'Backward Edge': 'Lames régressives',
        'Bitter Whirlwind': 'Tourbillon amer',
        'Blade Warp': 'Invocation incisive',
        'Burning Chains': 'Chaînes brûlantes',
        'Chasm of Vollok': 'Trappe de Vollok',
        'Dawn of an Age': 'Âge de l\'aurore',
        'Drum of Vollok': 'Coup de Vollok',
        'Duty\'s Edge': 'Devoir d\'acier',
        'Fiery Edge': 'Lames de feu',
        'Forged Track': 'Traque incisive',
        'Forward Edge': 'Lames saillantes',
        'Greater Gateway': 'Passerelle enchantée',
        'Half Circuit': 'Demi-circuit',
        'Half Full': 'Demi-plénitude',
        'Multidirectional Divide': 'Division multidirectionnelle',
        'Projection of Triumph': 'Lames repoussantes',
        'Projection of Turmoil': 'Salve repoussante',
        'Regicidal Rage': 'Régicide',
        'Siege of Vollok': 'Anneau de Vollok',
        'Stormy Edge': 'Lames de vent',
        'Sync(?![-h])': 'Synchronisation',
        '(?<! )Vollok': 'Vollok',
        'Walls of Vollok': 'Cercle de Vollok',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Fang': '双牙剣',
        'Zoraal Ja': 'ゾラージャ',
      },
      'replaceText': {
        'Actualize': 'アクチュアライズ',
        'Aero III': 'エアロガ',
        'Backward Edge': 'バックワードエッジ',
        'Bitter Whirlwind': 'ビターウィンド',
        'Blade Warp': 'サモンエッジ',
        'Burning Chains': '炎の鎖',
        'Chasm of Vollok': 'ピット・オブ・ヴォロク',
        'Dawn of an Age': 'ドーン・エイジ',
        'Drum of Vollok': 'ノック・オブ・ヴォロク',
        'Duty\'s Edge': 'デューティエッジ',
        'Fiery Edge': 'ファイアエッジ',
        'Forged Track': 'エッジトラック',
        'Forward Edge': 'フォワードエッジ',
        'Greater Gateway': 'エンチャント・ゲートウェイ',
        'Half Circuit': 'ルーズハーフ・サーキット',
        'Half Full': 'ルーズハーフ',
        'Multidirectional Divide': 'マルチウェイ',
        'Projection of Triumph': 'プロジェクション・エッジ',
        'Projection of Turmoil': 'プロジェクション・バースト',
        'Regicidal Rage': 'レジサイド',
        'Siege of Vollok': 'リング・オブ・ヴォロク',
        'Stormy Edge': 'ウィンドエッジ',
        'Sync(?![-h])': 'シンクロナス',
        '(?<! )Vollok': 'エッジ・ザ・ヴォロク',
        'Walls of Vollok': 'サークル・オブ・ヴォロク',
      },
    },
  ],
};

export default triggerSet;
