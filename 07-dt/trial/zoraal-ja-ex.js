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
];
const syncTilesMap = {
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
const findClosestTile = (x, y) => {
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
const quadrantNames = ['north', 'east', 'south', 'west'];
const knockPlatforms = ['northwest', 'northeast', 'southwest', 'southeast'];
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
// define "safe lanes" for each intercardinal side of the main platform,
// consisting of all 4 tiles on that side.  Order the corner tiles last,
// so they will be used for a safe callout only if no intercard tile is safe
const forgedTrackSafeLanes = {
  'northeast': ['northeastNorth', 'northeastEast', 'northCorner', 'eastCorner'],
  'southeast': ['southeastEast', 'southeastSouth', 'eastCorner', 'southCorner'],
  'southwest': ['southwestSouth', 'southwestWest', 'southCorner', 'westCorner'],
  'northwest': ['northwestWest', 'northwestNorth', 'westCorner', 'northCorner'],
};
// For seCross & swCross, handle the crossing tether logic by mapping each of the possible tiles
// the sword could start on, through its tether, to the near and far tiles it will hit
// (thereby eliminating those as potential safe spots).
const crossMap = {
  'seCross': {
    'eastCorner': ['southeastEast', 'northwestNorth'],
    'southeastEast': ['southCorner', 'westCorner'],
    'southeastSouth': ['eastCorner', 'northCorner'],
    'southwestSouth': ['southCorner', 'eastCorner'],
    'southwestWest': ['westCorner', 'northCorner'],
    'westCorner': ['southwestSouth', 'northeastEast'], // crosses to southwestSouth
  },
  'swCross': {
    'eastCorner': ['southeastSouth', 'northwestWest'],
    'southeastEast': ['eastCorner', 'northCorner'],
    'southeastSouth': ['southCorner', 'westCorner'],
    'southwestSouth': ['westCorner', 'northCorner'],
    'southwestWest': ['southCorner', 'eastCorner'],
    'westCorner': ['southwestWest', 'northeastNorth'], // crosses to southwestWest
  },
};
// A `southCorner` starting sword needs special handling, as it will hit different tiles
// depending on whether it originates from the southeast or southwest platform.
const crossMapSouthCorner = {
  'seCross': {
    'southeast': ['southeastSouth', 'northwestWest'],
    'southwest': ['southwestWest', 'northeastNorth'], // southCorner crosses to southwestWest
  },
  'swCross': {
    'southeast': ['southeastEast', 'northwestNorth'],
    'southwest': ['southwestSouth', 'northeastEast'], // southCorner crosses to southwestSouth
  },
};
const stayGoOutputStrings = {
  stay: {
    en: 'Stay',
    ja: 'そのまま跳ばない',
    ko: '그대로',
  },
  goAcross: {
    en: 'Go Across',
    ja: '反対側へ跳ぶ',
    ko: '건너가서',
  },
};
Options.Triggers.push({
  id: 'EverkeepExtreme',
  zoneId: ZoneId.EverkeepExtreme,
  config: [
    {
      id: 'chasmVollokPriority',
      name: {
        en: 'Chasm of Vollok Safe Spot Priority',
      },
      comment: {
        en: 'Select which safe spots have priority during callouts.',
      },
      type: 'select',
      options: {
        en: {
          'Inside Tiles': 'inside',
          'North and South Corner': 'northSouth',
          'North Corner': 'north',
          'South Corner': 'south',
        },
      },
      default: 'inside',
    },
  ],
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
          const stayGo = data.drumFar ? output.goAcross() : output.stay();
          return output.frontRightKnockaround({ stayGo: stayGo });
        }
        return output.frontRight();
      },
      outputStrings: {
        frontRight: {
          en: 'Front + Boss\'s Right',
          ja: '前方 + ボスの右側',
          ko: '▲앞쪽 🡸왼쪽',
        },
        ...stayGoOutputStrings,
        frontRightKnockaround: {
          en: 'Front + Boss\'s Right (${stayGo})',
          ja: '前方 + ボスの右側 (${stayGo})',
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
          const stayGo = data.drumFar ? output.goAcross() : output.stay();
          return output.frontLeftKnockaround({ stayGo: stayGo });
        }
        return output.frontLeft();
      },
      outputStrings: {
        frontLeft: {
          en: 'Front + Boss\'s Left',
          ja: '前方 + ボスの左側',
          ko: '▲앞쪽 🡺오른쪽',
        },
        ...stayGoOutputStrings,
        frontLeftKnockaround: {
          en: 'Front + Boss\'s Left (${stayGo})',
          ja: '前方 + ボスの左側 (${stayGo})',
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
          const stayGo = data.drumFar ? output.stay() : output.goAcross();
          return output.backRightKnockaround({ stayGo: stayGo });
        }
        return output.backRight();
      },
      outputStrings: {
        backRight: {
          en: 'Behind + Boss\'s Left',
          ja: '後方 + ボスの左側',
          ko: '▼뒤쪽 🡸왼쪽',
        },
        ...stayGoOutputStrings,
        backRightKnockaround: {
          en: 'Behind + Boss\'s Left (${stayGo})',
          ja: '後方 + ボスの左側 (${stayGo})',
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
          const stayGo = data.drumFar ? output.stay() : output.goAcross();
          return output.backLeftKnockaround({ stayGo: stayGo });
        }
        return output.backLeft();
      },
      outputStrings: {
        backLeft: {
          en: 'Behind + Boss\'s Right',
          ja: '後方 + ボスの右側',
          ko: '▼뒤쪽 🡺오른쪽',
        },
        ...stayGoOutputStrings,
        backLeftKnockaround: {
          en: 'Behind + Boss\'s Right (${stayGo})',
          ja: '後方 + ボスの右側 (${stayGo})',
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
          return { alertText: output.tetherBuster() };
        return { infoText: output.busterAvoid() };
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
        // To make this call somewhat reasonable, we need a priority system
        // for which tiles to call.
        //
        // This is configurable with the following options:
        //
        // inside tiles:
        //   1. insideEast/insideWest
        //   2. insideNorth/insideSouth, lean E/W
        //   3. If all inside are bad, the outer intercard pairs (E/W depending on cleave)
        //
        // north and south corners:
        //   1. north/south corner, lean E/W
        //   2. insideNorth/insideSouth, lean E/W
        //   3. outer intercard pairs (E/W) depending on cleave
        //
        // north corner:
        //   Same as north/south, but call only the north side
        //
        // south corner:
        //   Same as north/South, but call only the south side
        const safeSide = matches.id === '9368' ? 'west' : 'east';
        const leanOutput = matches.id === '9368' ? output.leanWest() : output.leanEast();
        const safeTiles = tileNames.filter((tile) => !data.unsafeTiles.includes(tile));
        if (safeTiles.length !== 8)
          return;
        const insidePriority = ['insideEast', 'insideNorth'];
        const northSouthPriority = ['northCorner', 'insideNorth'];
        const priority = data.triggerSetConfig.chasmVollokPriority === 'inside'
          ? insidePriority
          : northSouthPriority;
        const safeTile = priority.find((tile) => safeTiles.includes(tile));
        if (safeTile === 'insideEast') {
          // insideEast is always safe together with insideWest
          if (safeSide === 'west')
            return output.insideWest();
          return output.insideEast();
        } else if (safeTile === 'insideNorth') {
          // insideNorth is always safe together with insideSouth
          if (data.triggerSetConfig.chasmVollokPriority === 'north')
            return output.insideN({ lean: leanOutput });
          if (data.triggerSetConfig.chasmVollokPriority === 'south')
            return output.insideS({ lean: leanOutput });
          return output.insideNS({ lean: leanOutput });
        } else if (safeTile === 'northCorner') {
          // northCorner is always safe together with southCorner
          if (data.triggerSetConfig.chasmVollokPriority === 'north')
            return output.cornerN({ lean: leanOutput });
          if (data.triggerSetConfig.chasmVollokPriority === 'south')
            return output.cornerS({ lean: leanOutput });
          return output.cornerNS({ lean: leanOutput });
        }
        // If none of the above were safe, the outer intercards are.
        if (safeSide === 'east') {
          return output.intercardsEast();
        }
        return output.intercardsWest();
      },
      run: (data) => data.unsafeTiles = [],
      outputStrings: {
        insideWest: {
          en: 'Inner West Diamond',
          ja: '内側 西の床へ',
          ko: '안쪽칸 🡸왼쪽',
        },
        insideEast: {
          en: 'Inner East Diamond',
          ja: '内側 東の床へ',
          ko: '안쪽칸 🡺오른쪽',
        },
        insideNS: {
          en: 'Inner North/South Diamonds - ${lean}',
          ja: '内側 南/北の床へ - ${lean}',
          ko: '안쪽칸 ⇅위아래 (${lean})',
        },
        insideN: {
          en: 'Inner North Diamond - ${lean}',
          ko: '안쪽칸 🡹위로 (${lean})',
        },
        insideS: {
          en: 'Inner South Diamond - ${lean}',
          ko: '안쪽칸 🡻아래로 (${lean})',
        },
        cornerNS: {
          en: 'North/South Corner Diamonds - ${lean}',
          ko: '⇅위아래 구석 (${lean})',
        },
        cornerN: {
          en: 'North Corner Diamond - ${lean}',
          ko: '🡹위쪽 구석 (${lean})',
        },
        cornerS: {
          en: 'South Corner Diamond - ${lean}',
          ko: '🡻아래쪽 구석 (${lean})',
        },
        leanWest: {
          en: 'Lean West',
          ja: '西寄り',
          ko: '살짝 🡸왼쪽',
        },
        leanEast: {
          en: 'Lean East',
          ja: '東寄り',
          ko: '살짝 🡺오른쪽',
        },
        intercardsEast: {
          en: 'Outer Intercard Diamonds - East',
          ja: '外側 斜めの床 - 東',
          ko: '바깥칸 비스듬히 🡸왼쪽',
        },
        intercardsWest: {
          en: 'Outer Intercard Diamonds - West',
          ja: '外側 斜めの床 - 西',
          ko: '바깥칸 비스듬히 🡺오른쪽',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Swords Spread Markers',
      type: 'HeadMarker',
      netRegex: { id: '00B9' },
      condition: (data, matches) => data.phase === 'swords' && data.me === matches.target,
      alertText: (_data, _matches, output) => output.safeSpread(),
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
      condition: (data, matches) => data.phase === 'swords' && parseFloat(matches.y) < 85,
      run: (data, matches) => {
        if (data.fireWindSetup === undefined)
          return;
        // Same as Chasm of Vollok, remap the sword position to a corresponding main platform tile
        // But unlike Chasm of Vollok, these Fang actors are positioned at the bak of the tiles,
        // so we need a slightly different mirrorAdjust value
        const mirrorAdjust = 22.98; // sqrt(5^2 + 5^2) * 3.25
        const swordY = parseFloat(matches.y) + mirrorAdjust;
        let swordX = parseFloat(matches.x);
        let fireWindPlatform;
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
      condition: (data, matches) => data.phase === 'swords' && parseFloat(matches.y) > 115,
      delaySeconds: 0.2,
      run: (data, matches) => {
        if (data.lineCleaveSetup === undefined || data.forgedTrackSafeTiles.length !== 4)
          return;
        const mirrorAdjust = 22.98; // sqrt(5^2 + 5^2) * 3.25
        const swordY = parseFloat(matches.y) - mirrorAdjust;
        let swordX = parseFloat(matches.x);
        let lineCleavePlatform;
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
      delaySeconds: 0.4,
      durationSeconds: 9,
      alertText: (data, _matches, output) => {
        if (data.fireWindEffect === undefined)
          return output.unknown();
        const fireWindOutput = output[data.fireWindEffect]();
        if (data.fireWindSafeDir === undefined)
          return fireWindOutput;
        const fireWindSafeOutput = output.fireWindSafe({
          fireWind: fireWindOutput,
          safeDir: output[data.fireWindSafeDir](),
        });
        // There should always be two safe tiles, but we only need one. Use the first one in the
        // array, as it is ordered to give preference to intercard (non-corner) tiles.
        let tileOutput;
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
          tileOutput = output.corner();
        else if (data.fireWindSafeDir === 'northwest')
          tileOutput = safe0 === 'northwestNorth' ? output.leanLeft() : output.leanRight();
        else if (data.fireWindSafeDir === 'northeast')
          tileOutput = safe0 === 'northeastEast' ? output.leanLeft() : output.leanRight();
        else if (data.fireWindSafeDir === 'southeast')
          tileOutput = safe0 === 'southeastSouth' ? output.leanLeft() : output.leanRight();
        else
          tileOutput = safe0 === 'southwestWest' ? output.leanLeft() : output.leanRight();
        return output.combo({ fireWindCombo: fireWindSafeOutput, tile: tileOutput });
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
          ja: '<= 左内側 (ボス正面)',
          ko: '가운데칸 🡸왼쪽',
        },
        leanRight: {
          en: 'Inside Right (Facing Boss) =>',
          ja: '右内側 (ボス正面) =>',
          ko: '가운테칸 🡺오른쪽',
        },
        corner: {
          en: 'Corners Safe',
          ja: '隅が安地',
          ko: '구석 안전',
        },
        northwest: {
          en: 'Northwest',
          ko: '🡼',
        },
        northeast: {
          en: 'Northeast',
          ko: '🡽',
        },
        southeast: {
          en: 'Southeast',
          ko: '🡾',
        },
        southwest: {
          en: 'Southwest',
          ko: '🡿',
        },
        fire: {
          en: 'Go Far',
          ja: '離れて',
          ko: '불장판',
        },
        wind: Outputs.knockback,
        fireWindSafe: {
          en: '${fireWind} ${safeDir}',
          ja: '${fireWind} ${safeDir}',
          ko: '${fireWind}${safeDir}',
        },
        combo: {
          en: '${fireWindCombo} + ${tile}',
          ja: '${fireWindCombo} + ${tile}',
          ko: '${fireWindCombo} + ${tile}',
        },
        unknown: {
          en: 'Avoid Swords',
          ja: '剣を避けて',
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
      delaySeconds: 0.3,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.drumTargets.includes(data.me))
          return output.enumOnYou();
        data.drumFar = true;
        return output.enumKnockback();
      },
      run: (data) => data.drumTargets = [],
      outputStrings: {
        enumOnYou: {
          en: 'Partner stack (on you)',
          ja: 'ペア頭割り（自分が対象）',
          ko: '내게 드럼! 산개 위치로!',
        },
        enumKnockback: {
          en: 'Partner stack (knockback)',
          ja: 'ペア頭割り（跳ばされる）',
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
        let swordQuad;
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
          return output.unknown();
        // Call these as left/right based on whether the player is on the mirror plat or not
        // Assume they are facing the boss at this point.
        // There will always be one safe quadrant closest to the boss on each platform.
        if (data.drumFar) { // player is on the mirror platform
          if (data.knockPlatform === 'northwest')
            return safeQuadrants.includes('east')
              ? output.left()
              : (safeQuadrants.includes('south')
                ? output.right()
                : output.unknown());
          else if (data.knockPlatform === 'northeast')
            return safeQuadrants.includes('west')
              ? output.right()
              : (safeQuadrants.includes('south')
                ? output.left()
                : output.unknown());
          else if (data.knockPlatform === 'southeast')
            return safeQuadrants.includes('west')
              ? output.left()
              : (safeQuadrants.includes('north')
                ? output.right()
                : output.unknown());
          else if (data.knockPlatform === 'southwest')
            return safeQuadrants.includes('east')
              ? output.right()
              : (safeQuadrants.includes('north')
                ? output.left()
                : output.unknown());
          return output.unknown();
        }
        // player is on the main platform
        if (data.knockPlatform === 'northwest')
          return safeQuadrants.includes('west')
            ? output.left()
            : (safeQuadrants.includes('north')
              ? output.right()
              : output.unknown());
        else if (data.knockPlatform === 'northeast')
          return safeQuadrants.includes('north')
            ? output.left()
            : (safeQuadrants.includes('east')
              ? output.right()
              : output.unknown());
        else if (data.knockPlatform === 'southeast')
          return safeQuadrants.includes('east')
            ? output.left()
            : (safeQuadrants.includes('south')
              ? output.right()
              : output.unknown());
        else if (data.knockPlatform === 'southwest')
          return safeQuadrants.includes('south')
            ? output.left()
            : (safeQuadrants.includes('west')
              ? output.right()
              : output.unknown());
        return output.unknown();
      },
      outputStrings: {
        unknown: {
          en: 'Safe Quadrant + Spread Out',
          ja: '安地で散開',
          ko: '안전한 칸으로 + 흩어져요',
        },
        left: {
          en: '<= Front Left Quadrant + Spread Out',
          ja: '<= 前方左の床へ + 散開',
          ko: '🡼앞왼쪽 + 흩어져요',
        },
        right: {
          en: 'Front Right Quadrant + Spread Out =>',
          ja: '前方右の床へ + 散開 =>',
          ko: '🡽앞오른쪽 + 흩어져요',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Knockaround Tornado Debuff Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '830' },
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
      netRegex: { effectId: '830' },
      condition: (data, matches) => data.phase === 'knockaround' && data.me === matches.target,
      run: (data) => data.cantTakeTornadoJump = false,
    },
    {
      id: 'Zoraal Ja Ex Duty\'s Edge',
      type: 'StartsUsing',
      netRegex: { id: '9374', source: 'Zoraal Ja', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text(),
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
        const stayGo = data.cantTakeTornadoJump ? output.stay() : output.goAcross();
        return output.combo({ breakChains: output.breakChains(), stayGo: stayGo });
      },
      outputStrings: {
        breakChains: Outputs.breakChains,
        ...stayGoOutputStrings,
        combo: {
          en: '${breakChains} (${stayGo})',
          ja: '${breakChains} (${stayGo})',
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
      delaySeconds: 0.3,
      alertText: (data, matches, output) => {
        const inOut = matches.id === '93A0' ? output.in() : output.out();
        if (data.halfCircuitSafeSide === undefined)
          return inOut;
        return output.combo({ inOut: inOut, side: output[data.halfCircuitSafeSide]() });
      },
      run: (data) => data.seenHalfCircuit = true,
      outputStrings: {
        left: {
          en: 'Boss\'s Left',
          ja: 'ボスの左側',
          ko: '🡸왼쪽으로!!',
        },
        right: {
          en: 'Boss\'s Right',
          ja: 'ボスの右側',
          ko: '🡺오른쪽으로!!',
        },
        in: Outputs.in,
        out: Outputs.out,
        combo: {
          en: '${inOut} + ${side}',
          ja: '${inOut} + ${side}',
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
      alertText: (_data, _matches, output) => output.rightSword(),
      outputStrings: {
        rightSword: {
          en: 'Boss\'s Left',
          ja: 'ボスの左側',
          ko: '칼질! 🡸왼쪽으로!!',
        },
      },
    },
    {
      id: 'Zoraal Ja Ex Might of Vollok Left Sword',
      type: 'StartsUsing',
      netRegex: { id: '9369', source: 'Zoraal Ja', capture: false },
      condition: (data) => data.phase === 'lines' && data.seenHalfCircuit,
      alertText: (_data, _matches, output) => output.leftSword(),
      outputStrings: {
        leftSword: {
          en: 'Boss\'s Right',
          ja: 'ボスの右側',
          ko: '칼질! 🡺오른쪽으로!!',
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
        const insidePriority = ['insideEast', 'insideNorth'];
        const northSouthPriority = ['northCorner', 'insideNorth'];
        const priority = data.triggerSetConfig.chasmVollokPriority === 'inside'
          ? insidePriority
          : northSouthPriority;
        const safeTile = priority.find((tile) => safeTiles.includes(tile));
        const insideSafe = safeTiles.includes('insideEast') && safeTiles.includes('insideNorth');
        if (insideSafe) {
          // Always prefer inside safe first
          return output.inside();
        } else if (safeTile === 'insideEast') {
          // insideEast is always safe together with insideWest
          return output.eastWest();
        } else if (safeTile === 'insideNorth') {
          // insideNorth is always safe together with insideSouth
          if (data.triggerSetConfig.chasmVollokPriority === 'north')
            return output.insideN();
          if (data.triggerSetConfig.chasmVollokPriority === 'south')
            return output.insideS();
          return output.insideNS();
        } else if (safeTile === 'northCorner') {
          // northCorner is always safe together with southCorner
          if (data.triggerSetConfig.chasmVollokPriority === 'north')
            return output.cornerN();
          if (data.triggerSetConfig.chasmVollokPriority === 'south')
            return output.cornerS();
          return output.cornerNS();
        }
        return output.intercard();
      },
      run: (data) => data.unsafeTiles = [],
      outputStrings: {
        inside: {
          en: 'Inside Safe',
          ja: '内側が安地',
          ko: '안쪽 안전',
        },
        eastWest: {
          en: 'Inside East/West Safe',
          ja: '内側 東/西が安地',
          ko: '안쪽 동서 안전',
        },
        insideNS: {
          en: 'Inside North/South Safe',
          ja: '内側 北/南が安地',
          ko: '안쪽 남북 안전',
        },
        insideN: {
          en: 'Inside North Safe',
          ja: '内側 北が安地',
          ko: '안쪽 🡹북쪽 안전',
        },
        insideS: {
          en: 'Inside South Safe',
          ja: '内側 南が安地',
          ko: '안쪽 🡻남쪽 안전',
        },
        cornerNS: {
          en: 'North/South Corners Safe',
          ja: '北/南の隅が安地',
          ko: '⇅남북 구석 안전',
        },
        cornerN: {
          en: 'North Corner Safe',
          ja: '北の隅が安地',
          ko: '🡹북쪽 구석 안전',
        },
        cornerS: {
          en: 'South Corner Safe',
          ja: '南の隅が安地',
          ko: '🡻남쪽 구석 안전',
        },
        intercard: {
          en: 'Outside Intercards Safe (Avoid Corners)',
          ja: '外側 斜めが安地（隅に注意）',
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
      infoText: (_data, _matches, output) => output.text(),
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
        return output.text();
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
          return output[`next${data.prTurmoilCount}`]();
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
      'replaceSync': {
        'Fang': 'Reißzahn',
        'Zoraal Ja': 'Zoraal Ja',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(lines drop\\)': '(Linien kommen)',
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
        'Might of Vollok': 'Macht von Vollok',
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
      'replaceSync': {
        'Fang': 'crochet',
        'Zoraal Ja': 'Zoraal Ja',
      },
      'replaceText': {
        '\\(cast\\)': '(Incantation)',
        '\\(damage\\)': '(Dommage)',
        '\\(enrage\\)': '(Enrage)',
        '\\(lines drop\\)': '(Lignes)',
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
        'Might of Vollok': 'Puissance de Vollok',
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
        'Might of Vollok': 'パワー・オブ・ヴォロク',
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
    {
      'locale': 'cn',
      'replaceSync': {
        'Fang': '双牙剑',
        'Zoraal Ja': '佐拉加',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(damage\\)': '(伤害)',
        '\\(enrage\\)': '(狂暴)',
        '\\(lines drop\\)': '(直线落下)',
        'Actualize': '自我实现',
        'Aero III': '暴风',
        'Backward Edge': '后向斩',
        'Bitter Whirlwind': '愤恨之风',
        'Blade Warp': '利刃召唤',
        'Burning Chains': '火焰链',
        'Chasm of Vollok': '无敌裂斩',
        'Dawn of an Age': '新曦世纪',
        'Drum of Vollok': '无敌之击',
        'Duty\'s Edge': '责任之刃',
        'Fiery Edge': '烈火刃',
        'Forged Track': '利刃冲',
        'Forward Edge': '前向斩',
        'Greater Gateway': '附魔通路',
        'Half Circuit': '回旋半身残',
        'Half Full': '半身残',
        'Might of Vollok': '无敌之力',
        'Multidirectional Divide': '多向斩',
        'Projection of Triumph': '情感投射：利刃',
        'Projection of Turmoil': '情感投射：爆发',
        'Regicidal Rage': '弑君之怒行',
        'Siege of Vollok': '无敌之环',
        'Stormy Edge': '暴风刃',
        'Sync(?![-h])': '同步',
        '(?<! )Vollok': '无敌刃',
        'Walls of Vollok': '无敌之圆',
      },
    },
  ],
});