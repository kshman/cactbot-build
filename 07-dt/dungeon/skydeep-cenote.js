// TODO:
//  - Call safe tile(s) for Firearms - Artillery?
const bubbleIntercards = [...Directions.outputIntercardDir];
const featherRayCenterY = -160;
const featherRayCenterX = -105;
const featherRayWestBubblesCenterX = -113;
const featherRayEastBubblesCenterX = -97;
Options.Triggers.push({
  id: 'TheSkydeepCenote',
  zoneId: ZoneId.TheSkydeepCenote,
  timelineFile: 'skydeep-cenote.txt',
  initData: () => ({
    collectBubbles: false,
    eastBubbleSetSafe: [...bubbleIntercards],
    westBubbleSetSafe: [...bubbleIntercards],
    seenMirrorManeuver: false,
    seenDeepThunder: false,
    seenShatter: false,
  }),
  triggers: [
    // ** Feather Ray ** //
    {
      id: 'SkydeepCenote Feather Ray Immersion',
      type: 'StartsUsing',
      netRegex: { id: '8F83', source: 'Feather Ray', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'SkydeepCenote Feather Ray Nuisance Wave',
      type: 'HeadMarker',
      netRegex: { id: '0202' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.wave(),
      outputStrings: {
        wave: {
          en: 'Look away from party',
          ko: '파티 보면 안되요',
        },
      },
    },
    {
      id: 'SkydeepCenote Feather Ray Blowing Bubbles',
      type: 'Ability',
      netRegex: { id: '8F7C', source: 'Feather Ray', capture: false },
      infoText: (_data, _matches, output) => output.avoid(),
      outputStrings: {
        avoid: {
          en: 'Avoid bubbles',
          ko: '거품 피해요',
        },
      },
    },
    {
      id: 'SkydeepCenote Feather Ray Trouble Bubbles',
      type: 'Ability',
      netRegex: { id: '9783', source: 'Feather Ray', capture: false },
      infoText: (_data, _matches, output) => output.avoid(),
      outputStrings: {
        avoid: {
          en: 'Avoid bubbles',
          ko: '거품 피해요',
        },
      },
    },
    {
      id: 'SkydeepCenote Feather Ray Bubble Bomb Tracker',
      type: 'Ability',
      netRegex: { id: '8F7F', source: 'Feather Ray', capture: false },
      run: (data) => data.collectBubbles = true,
    },
    {
      id: 'SkydeepCenote Feather Ray Bubble Bomb Collect',
      type: 'ActorSetPos',
      netRegex: {},
      condition: (data) => data.collectBubbles,
      run: (data, matches) => {
        const x = Math.round(parseFloat(matches.x));
        const y = Math.round(parseFloat(matches.y));
        // Bubbles spawn in 4 rows at y: -172 (north), -164, -156, and -148 (south)
        // and in 6 columns at x: -125 (west), -117, -109, -101, -93, and -85 (east)
        // Rolling Current will shift all bubbles one column east/west.
        // One melee intercard of the boss will always be safe after Rolling Current,
        // we can collect for the 4 east-shifted intercard spots & 4 west-shifted intercard spots,
        // and once we know the Rolling Current direction, we know which boss intercard is safe.
        // Exclude combatants in the north/south rows and the far east/west columns
        // as they don't matter.  Also, use int values rather than < > comparisons,
        // as the boss gets an ActorSetPos here too for dead center, which would mess things up.
        const middleRowsY = [-156, -164];
        const middleColsX = [-117, -109, -101, -93];
        if (!middleRowsY.includes(y) || !middleColsX.includes(x))
          return;
        const relCenterX = x < featherRayCenterX
          ? featherRayWestBubblesCenterX
          : featherRayEastBubblesCenterX;
        const bubbleSpot = Directions.xyToIntercardDirOutput(x, y, relCenterX, featherRayCenterY);
        if (x < featherRayCenterX)
          data.westBubbleSetSafe = data.westBubbleSetSafe.filter((dir) => dir !== bubbleSpot);
        else
          data.eastBubbleSetSafe = data.eastBubbleSetSafe.filter((dir) => dir !== bubbleSpot);
      },
    },
    {
      id: 'SkydeepCenote Feather Ray Rolling Current',
      type: 'StartsUsing',
      // 8F80 -> push from west to east
      // 8F81 -> push from east to west
      netRegex: { id: ['8F80', '8F81'], source: 'Feather Ray' },
      alertText: (data, matches, output) => {
        const bubbleArr = matches.id === '8F80' ? data.westBubbleSetSafe : data.eastBubbleSetSafe;
        if (bubbleArr.length === 0 || bubbleArr.length > 1)
          return output.avoid();
        const safe = bubbleArr[0];
        if (safe === undefined)
          return output.avoid();
        return output.avoidDir({ dir: output[safe]() });
      },
      run: (data) => {
        data.collectBubbles = false;
        data.eastBubbleSetSafe = [...bubbleIntercards];
        data.westBubbleSetSafe = [...bubbleIntercards];
      },
      outputStrings: {
        avoidDir: {
          en: 'Safe: ${dir} (on hitbox)',
          ko: '안전: ${dir} (히트박스 밟아요)',
        },
        avoid: {
          en: 'Avoid shifting bubbles',
          ko: '이동 거품 피해요',
        },
        ...Directions.outputStringsIntercardDir,
      },
    },
    // ** Firearms ** //
    {
      id: 'SkydeepCenote Firearms Dynamic Dominance',
      type: 'StartsUsing',
      netRegex: { id: '8E60', source: 'Firearms', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'SkydeepCenote Firearms Pummel',
      type: 'StartsUsing',
      netRegex: { id: '8E5F', source: 'Firearms' },
      response: Responses.tankBuster(),
    },
    {
      id: 'SkydeepCenote Firearms Initial Mirror Maneuver',
      type: 'StartsUsing',
      // 8E5B - First Thunderlight Burst (cleave from boss toward mirror)
      netRegex: { id: '8E5B', source: 'Firearms', capture: false },
      durationSeconds: 8,
      infoText: (data, _matches, output) =>
        data.seenMirrorManeuver ? output.nearOrb() : output.awayFromOrb(),
      run: (data) => data.seenMirrorManeuver = true,
      outputStrings: {
        awayFromOrb: {
          en: 'North + Away from orb',
          ko: '북쪽 + 구슬에서 멀어져요',
        },
        nearOrb: {
          en: 'Be close to North orb',
          ko: '북쪽 구슬 가까이로',
        },
      },
    },
    {
      id: 'SkydeepCenote Firearms Artillery',
      type: 'Ability',
      netRegex: { id: '8E5A', source: 'Firearms', capture: false },
      infoText: (_data, _matches, output) => output.tiles(),
      outputStrings: {
        tiles: {
          en: 'Avoid exploding rows/columns',
          ko: '폭발 장소 피해요',
        },
      },
    },
    // ** Maulskull ** //
    {
      id: 'SkydeepCenote Maulskull Ashlayer',
      type: 'StartsUsing',
      netRegex: { id: '8F67', source: 'Maulskull', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'SkydeepCenote Maulskull Deep Thunder',
      type: 'StartsUsing',
      netRegex: { id: '8F4F', source: 'Maulskull', capture: false },
      infoText: (data, _matches, output) =>
        data.seenDeepThunder ? output.stackFive() : output.stackThree(),
      run: (data) => data.seenDeepThunder = true,
      outputStrings: {
        stackThree: {
          en: 'Stack (3 hits)',
          ko: '뭉쳐요 (3번)',
        },
        stackFive: {
          en: 'Stack (5 hits)',
          ko: '뭉쳐요 (5번)',
        },
      },
    },
    {
      id: 'SkydeepCenote Maulskull Initial Stonecarver',
      type: 'StartsUsingExtra',
      // 8F3E is the first half-arena cleave, but the actor can be east or west.
      netRegex: { id: '8F3E' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        const firstCleave = parseFloat(matches.x) > 100 ? 'east' : 'west';
        return output[firstCleave]();
      },
      outputStrings: {
        east: Outputs.leftThenRight,
        west: Outputs.rightThenLeft,
      },
    },
    {
      id: 'SkydeepCenote Maulskull Initial Skullcrush',
      type: 'StartsUsing',
      netRegex: { id: '8F43', source: 'Maulskull', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.kbAoeSpread(),
      outputStrings: {
        kbAoeSpread: {
          en: 'Knockback (AoE) => Spread',
          ko: '넉백 (AOE) 🔜 흩어져요',
        },
      },
    },
    {
      id: 'SkydeepCenote Maulskull Maulwork + Shatter Middle',
      type: 'Ability',
      netRegex: { id: ['8F47', '8F48'], source: 'Maulskull', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.dodgeSides(),
      outputStrings: {
        dodgeSides: {
          en: 'Avoid AoEs (sides after)',
          ko: 'AOE 피해요 (그리고 옆으로)',
        },
      },
    },
    {
      id: 'SkydeepCenote Maulskull Maulwork + Shatter Middle Followup',
      type: 'Ability',
      netRegex: { id: ['8F47', '8F48'], source: 'Maulskull', capture: false },
      delaySeconds: 10,
      response: Responses.goSides(),
      run: (data) => data.seenShatter = true,
    },
    {
      id: 'SkydeepCenote Maulskull Maulwork + Shatter Sides',
      type: 'Ability',
      netRegex: { id: ['8F49', '8F4A'], source: 'Maulskull', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.dodgeMiddle(),
      outputStrings: {
        dodgeMiddle: {
          en: 'Avoid AoEs (middle after)',
          ko: 'AOE 피해요 (그리고 가운데로)',
        },
      },
    },
    {
      id: 'SkydeepCenote Maulskull Maulwork + Shatter Sides Followup',
      type: 'Ability',
      netRegex: { id: ['8F49', '8F4A'], source: 'Maulskull', capture: false },
      delaySeconds: 10,
      response: Responses.goMiddle(),
      run: (data) => data.seenShatter = true,
    },
    {
      id: 'SkydeepCenote Maulskull Stonecarver + Skullcrush',
      type: 'StartsUsingExtra',
      // 8F58 is the first half-arena cleave, but the actor can be east or west.
      netRegex: { id: '8F58' },
      durationSeconds: 11,
      alertText: (_data, matches, output) => {
        const firstCleave = parseFloat(matches.x) > 100 ? 'east' : 'west';
        return output[firstCleave]();
      },
      outputStrings: {
        east: {
          en: '<== Knockback Back Left (Right After)',
          ko: '❰❰❰ 왼쪽뒤로 넉백 (그리고 오른쪽으로)',
        },
        west: {
          en: 'Knockback Back Right (Left After) ==>',
          ko: '오른쪽뒤로 넉백 (그리고 왼쪽으로) ❱❱❱',
        },
      },
    },
    {
      id: 'SkydeepCenote Maulskull Colossal Impact',
      type: 'StartsUsing',
      netRegex: { id: ['8F60', '8F61'], source: 'Maulskull' },
      durationSeconds: 7.5,
      alertText: (_data, matches, output) => {
        const dir = matches.id === '8F60' ? output.dirNE() : output.dirNW();
        return output.knockback({ dir: dir });
      },
      outputStrings: {
        knockback: {
          en: 'Knockback (to ${dir})',
          ko: '넉백 (→ ${dir})',
        },
        dirNE: Outputs.dirNE,
        dirNW: Outputs.dirNW,
      },
    },
    {
      id: 'SkydeepCenote Maulskull Destructive Heat',
      type: 'StartsUsing',
      netRegex: { id: '8F65', source: 'Maulskull', capture: false },
      condition: (data) => data.seenShatter,
      durationSeconds: 7,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.spreadAfter(),
      outputStrings: {
        spreadAfter: {
          en: '(spread after)',
          ko: '(나중에 흩어져요)',
        },
      },
    },
    {
      id: 'SkydeepCenote Maulskull Building Heat',
      type: 'StartsUsing',
      netRegex: { id: '8F66', source: 'Maulskull', capture: false },
      condition: (data) => data.seenShatter,
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.stackAfter(),
      outputStrings: {
        stackAfter: {
          en: '(stack after)',
          ko: '(나중에 뭉쳐요)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Destructive Heat/Building Heat': 'Destructive/Building Heat',
        'Building Heat/Destructive Heat': 'Building/Destructive Heat',
      },
    },
  ],
});
