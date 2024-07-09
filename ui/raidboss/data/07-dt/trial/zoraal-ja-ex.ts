import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { OutputStrings, TriggerSet } from '../../../../../types/trigger';

// TO DO:
// * Forged Track + Fiery/Stormy Edge - call knockback dir/safe lanes

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
const mirrorPlatformLocs = ['northwest', 'northeast', 'southwest', 'southeast'] as const;
type MirrorPlatformLoc = typeof mirrorPlatformLocs[number];

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
  safeTiles: TileName[];
  drumTargets: string[];
  drumFar: boolean; // got knocked by enum partner to far platform
  mirrorPlatformLoc?: MirrorPlatformLoc;
  safeQuadrants: QuadrantName[];
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
      safeTiles: [...tileNames] as TileName[],
      drumTargets: [],
      drumFar: false,
      safeQuadrants: [...quadrantNames] as QuadrantName[],
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
        const mirrorAdjust = 21.21;
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
        data.safeTiles = data.safeTiles.filter((tile) => tile !== adjustedTile);
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
      alertText: (data, matches, output) => {
        // We should already have 8 safe tiles from Sword Collect
        // To make this call somewhat reasonable, use the following priority system
        // for calling a safe tile, depending on sword cleave:
        //   1. insideEast/insideWest
        //   2. insideNorth/insideSouth, lean E/W
        //   3. If all inside are bad, the outer intercard pairs (E/W depending on cleave)
        const safeSide = matches.id === '9368' ? 'west' : 'east';
        const leanOutput = matches.id === '9368' ? output.leanWest!() : output.leanEast!();

        if (safeSide === 'west' && data.safeTiles.includes('insideWest'))
          return output.insideWest!();
        else if (safeSide === 'east' && data.safeTiles.includes('insideEast'))
          return output.insideEast!();
        else if (data.safeTiles.includes('insideNorth'))
          return output.insideNS!({ lean: leanOutput });
        else if (safeSide === 'east')
          return output.intercardsEast!();
        return output.intercardsWest!();
      },
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
      delaySeconds: 1,
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
          data.mirrorPlatformLoc = 'northwest';
          swordX += mirrorAdjust;
          swordY += mirrorAdjust;
        } else if (swordX < 91) {
          data.mirrorPlatformLoc = 'southwest';
          swordX += mirrorAdjust;
          swordY -= mirrorAdjust;
        } else if (swordY < 91) {
          data.mirrorPlatformLoc = 'northeast';
          swordX -= mirrorAdjust;
          swordY += mirrorAdjust;
        } else if (swordY > 109) {
          data.mirrorPlatformLoc = 'southeast';
          swordX -= mirrorAdjust;
          swordY -= mirrorAdjust;
        }

        let swordQuad: QuadrantName;
        if (swordX < 98)
          swordQuad = 'west';
        else if (swordX > 102)
          swordQuad = 'east';
        else if (swordY < 99)
          swordQuad = 'north';
        else
          swordQuad = 'south';

        data.safeQuadrants = data.safeQuadrants.filter((quad) => quad !== swordQuad);
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
        if (data.safeQuadrants.length !== 2 || data.mirrorPlatformLoc === undefined)
          return output.unknown!();

        // Call these as left/right based on whether the player is on the knock plat or not
        // Assume they are facing the boss at this point.
        // There will always be one safe quadrant closest to the boss on each platform.

        if (data.drumFar) { // player is on the mirror platform
          if (data.mirrorPlatformLoc === 'northwest')
            return data.safeQuadrants.includes('east')
              ? output.left!()
              : (data.safeQuadrants.includes('south')
                ? output.right!()
                : output.unknown!());
          else if (data.mirrorPlatformLoc === 'northeast')
            return data.safeQuadrants.includes('west')
              ? output.right!()
              : (data.safeQuadrants.includes('south')
                ? output.left!()
                : output.unknown!());
          else if (data.mirrorPlatformLoc === 'southeast')
            return data.safeQuadrants.includes('west')
              ? output.left!()
              : (data.safeQuadrants.includes('north')
                ? output.right!()
                : output.unknown!());
          else if (data.mirrorPlatformLoc === 'southwest')
            return data.safeQuadrants.includes('east')
              ? output.right!()
              : (data.safeQuadrants.includes('north')
                ? output.left!()
                : output.unknown!());
          return output.unknown!();
        }

        // player is on the main platform
        if (data.mirrorPlatformLoc === 'northwest')
          return data.safeQuadrants.includes('west')
            ? output.left!()
            : (data.safeQuadrants.includes('north')
              ? output.right!()
              : output.unknown!());
        else if (data.mirrorPlatformLoc === 'northeast')
          return data.safeQuadrants.includes('north')
            ? output.left!()
            : (data.safeQuadrants.includes('east')
              ? output.right!()
              : output.unknown!());
        else if (data.mirrorPlatformLoc === 'southeast')
          return data.safeQuadrants.includes('east')
            ? output.left!()
            : (data.safeQuadrants.includes('south')
              ? output.right!()
              : output.unknown!());
        else if (data.mirrorPlatformLoc === 'southwest')
          return data.safeQuadrants.includes('south')
            ? output.left!()
            : (data.safeQuadrants.includes('west')
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
    // Use explicit output rather than Outputs.left/Outputs.right for these triggers
    // Boss likes to jump & rotate, so pure 'left'/'right' can be misleading
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
        'Forward Edge/Backward Edge': 'Forward/Backward Edge',
        'Fiery Edge/Stormy Edge': 'Fiery/Stormy Edge',
        'Siege of Vollok/Walls of Vollok': 'Siege/Walls of Vollok',
      },
    },
  ],
};

export default triggerSet;
