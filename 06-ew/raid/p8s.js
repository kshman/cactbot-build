const towerColors = ['green', 'blue', 'purple'];
const perfectedConcepts = ['alpha', 'beta', 'gamma'];
// prs string
const prsStrings = {
  unknown: Outputs.unknown,
  north: {
    en: 'Ⓐ',
  },
  east: {
    en: 'Ⓑ',
  },
  south: {
    en: 'Ⓒ',
  },
  west: {
    en: 'Ⓓ',
  },
  northEast: {
    en: '⓶',
  },
  southEast: {
    en: '⓷',
  },
  southWest: {
    en: '⓸',
  },
  northWest: {
    en: '⓵',
  },
  crush: {
    en: 'Crash',
    ja: 'クラッシュ',
    ko: '푹찍쾅',
  },
  impact: {
    en: 'Knockback',
    ja: 'ノックバック',
    ko: '넉백',
  },
  adjMt: {
    en: 'MT Adjust',
    ja: 'MT調整',
    ko: 'MT 조정',
  },
  adjD1: {
    en: 'D1 Adjust',
    ja: 'D1調整',
    ko: 'D1 조정',
  },
};
const centerX = 100;
const centerY = 100;
const positionMatchesTo8Dir = (combatant) => {
  const x = parseFloat(combatant.x) - centerX;
  const y = parseFloat(combatant.y) - centerY;
  // Dirs: N = 0, NE = 1, ..., NW = 7
  return Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
};
const positionTo8Dir = (combatant) => {
  const x = combatant.PosX - centerX;
  const y = combatant.PosY - centerY;
  // Dirs: N = 0, NE = 1, ..., NW = 7
  return Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
};
const headingTo8Dir = (heading) => {
  // Dirs: N = 0, NE = 1, ..., NW = 7
  return (2 - Math.round(heading * 8 / Math.PI) / 2 + 2) % 8;
};
const ventOutputStrings = {
  comboDir: {
    en: '${dir1} / ${dir2}',
    de: '${dir1} / ${dir2}',
    fr: '${dir1} / ${dir2}',
    ja: '${dir1} / ${dir2}',
    cn: '${dir1} / ${dir2}',
    ko: '${dir1} / ${dir2}',
  },
  comboArrow: {
    en: '${dir1}${dir2} ${arr1}${arr2}',
    ja: '${dir1}${dir2} ${arr1}${arr2}',
    ko: '${dir1}${dir2} ${arr1}${arr2}',
  },
  north: prsStrings.north,
  east: prsStrings.east,
  south: prsStrings.south,
  west: prsStrings.west,
  dirNE: prsStrings.northEast,
  dirSE: prsStrings.southEast,
  dirSW: prsStrings.southWest,
  dirNW: prsStrings.northWest,
  arrNE: Outputs.arrowNE,
  arrSE: Outputs.arrowSE,
  arrSW: Outputs.arrowSW,
  arrNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};
// Shared alertText for vent triggers, using `ventOutputStrings` above.
const ventOutput = (autumStyle, unsafeSpots, output) => {
  const [unsafe0, unsafe1] = [...unsafeSpots].sort();
  if (unsafe0 === undefined || unsafe1 === undefined)
    throw new UnreachableCode();
  // edge case wraparound
  if (unsafe0 === 1 && unsafe1 === 7)
    return output.south();
  // adjacent unsafe spots, cardinal is safe
  if (unsafe1 - unsafe0 === 2) {
    // this average is safe to do because wraparound was taken care of above.
    const unsafeCard = Math.floor((unsafe0 + unsafe1) / 2);
    const safeDirMap = {
      0: output.south(),
      2: output.west(),
      4: output.north(),
      6: output.east(),
    };
    return safeDirMap[unsafeCard] ?? output.unknown();
  }
  // two intercards are safe, they are opposite each other,
  // so we can pick the intercard counterclock of each unsafe spot.
  // e.g. 1/5 are unsafe (NE and SW), so SE and NW are safe.
  const safeIntercardMap = {
    1: output.dirNW(),
    3: output.dirNE(),
    5: output.dirSE(),
    7: output.dirSW(),
  };
  const safeArrowMap = {
    1: output.arrNW(),
    3: output.arrNE(),
    5: output.arrSE(),
    7: output.arrSW(),
  };
  const safeStr0 = safeIntercardMap[unsafe0] ?? output.unknown();
  const safeStr1 = safeIntercardMap[unsafe1] ?? output.unknown();
  if (!autumStyle)
    return output.comboDir({ dir1: safeStr0, dir2: safeStr1 });
  const safeArr0 = safeArrowMap[unsafe0] ?? output.unknown();
  const safeArr1 = safeArrowMap[unsafe1] ?? output.unknown();
  return output.comboArrow({ dir1: safeStr0, dir2: safeStr1, arr1: safeArr0, arr2: safeArr1 });
};
const arcaneChannelFlags = '00020001'; // mapEffect flags for tower tile effect
Options.Triggers.push({
  id: 'AbyssosTheEighthCircleSavage',
  zoneId: ZoneId.AbyssosTheEighthCircleSavage,
  timelineFile: 'p8s.txt',
  initData: () => {
    return {
      combatantData: [],
      torches: [],
      flareTargets: [],
      upliftCounter: 0,
      footfallsDirs: [],
      footfallsOrder: [],
      trailblazeCount: 0,
      ventCasts: [],
      gorgons: [],
      gorgonCount: 0,
      firstSnakeOrder: {},
      firstSnakeDebuff: {},
      secondSnakeGazeFirst: {},
      secondSnakeDebuff: {},
      concept: {},
      splicer: {},
      arcaneChannelCount: 0,
      arcaneChannelColor: new Set(),
      alignmentTargets: [],
      burstCounter: 0,
      flareCounter: 0,
      inverseMagics: {},
      deformationHit: [],
      deformationNotHit: [],
      deformationOnMe: false,
    };
  },
  timelineTriggers: [
    {
      id: 'P8S Tank Cleave Autos',
      regex: /--auto--/,
      beforeSeconds: 8,
      suppressSeconds: 20,
      alertText: (data, _matches, output) => {
        // TODO: because of how the timeline starts in a doorboss fight, this call occurs
        // somewhere after the first few autos and so feels really weird.  Ideally, figure
        // out some way to call this out immediately when combat starts?? Maybe off engage?
        if (data.seenFirstTankAutos)
          return output.text();
      },
      run: (data) => data.seenFirstTankAutos = true,
      outputStrings: {
        text: {
          en: 'Tank Autos',
          de: 'Tank Auto-Angriffe',
          fr: 'Auto sur le tank',
          ja: 'タンクオートアタック',
          cn: '坦克平A',
          ko: '탱크 오토 어택!',
        },
      },
    },
    // ST 확인
    {
      id: 'P8S 어듬이 타이란트 끝나고 프로보크 안내',
      regex: /Burst 4/,
      condition: (data) => data.options.AutumnStyle && data.role === 'tank',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Provoke if you are ST',
          ko: 'ST라면 이쯤에서 헤이트 가져올것',
        },
      },
    },
    // 아이온 1
    {
      id: 'P8S 어듬이 아이온 1 버프',
      regex: /Aioniopyr 1/,
      beforeSeconds: 3,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanAddle())
          return output.addle();
      },
      outputStrings: {
        reprisal: {
          en: 'MT Reprisal',
          ko: 'MT 리프 넣으라우',
        },
        addle: {
          en: 'Caster Addle',
          ko: '아돌 넣으라우',
        },
      },
    },
    // 아이온 2
    {
      id: 'P8S 어듬이 아이온 2 버프',
      regex: /Aioniopyr 2/,
      beforeSeconds: 3,
      condition: (data) => data.options.AutumnStyle && data.role === 'tank',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'MT Reprisal',
          ko: 'MT 리프 넣으라우',
        },
      },
    },
    // 아이온 3
    {
      id: 'P8S 어듬이 아이온 3 버프',
      regex: /Aioniopyr 3/,
      beforeSeconds: 3,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanAddle())
          return output.addle();
        if (data.CanSilence())
          return output.amigo();
      },
      outputStrings: {
        reprisal: {
          en: 'MT Reprisal',
          ko: 'MT 리프 넣으라우',
        },
        addle: {
          en: '(Caster Addle, if available)',
          ko: '(아돌 남으면 넣으라우)',
        },
        amigo: {
          en: 'Range Buff',
          ko: '삼바 데 아미고 넣으라우',
        },
      },
    },
    // 아이온 4
    {
      id: 'P8S 어듬이 아이온 4 버프',
      regex: /Aioniopyr 4/,
      beforeSeconds: 3,
      condition: (data) => data.options.AutumnStyle && data.role === 'tank',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'ST Reprisal',
          ko: 'ST 리프 넣으라우',
        },
      },
    },
    // 아이온 5
    {
      id: 'P8S 어듬이 아이온 5 버프',
      regex: /Aioniopyr 5/,
      beforeSeconds: 3,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanAddle())
          return output.addle();
      },
      outputStrings: {
        reprisal: {
          en: 'MT Reprisal',
          ko: 'MT 리프 넣으라우',
        },
        addle: {
          en: 'Caster Addle',
          ko: '아돌 넣으라우',
        },
      },
    },
    // 아고니아 1
    {
      id: 'P8S 어듬이 아고니아 1 버프',
      regex: /Aionagonia 1/,
      beforeSeconds: 1,
      condition: (data) => data.options.AutumnStyle && data.role === 'tank',
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'MT Reprisal & Buff',
          ko: 'MT 리프&세이크 넣으라우',
        },
      },
    },
    // 아고니아 2
    {
      id: 'P8S 어듬이 아고니아 2 버프',
      regex: /Aionagonia 2/,
      beforeSeconds: 1,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanSilence())
          return output.amigo();
      },
      outputStrings: {
        reprisal: {
          en: 'ST Reprisal & Buff',
          ko: 'ST 리프&그거 넣으라우',
        },
        amigo: {
          en: 'Range Buff',
          ko: '삼바 데 아미고 넣으라우',
        },
      },
    },
    // 아고니아 3
    {
      id: 'P8S 어듬이 아고니아 3 버프',
      regex: /Aionagonia 3/,
      beforeSeconds: 1,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanAddle())
          return output.addle();
      },
      outputStrings: {
        reprisal: {
          en: 'MT Reprisal',
          ko: 'MT 리프 넣으라우',
        },
        addle: {
          en: 'Caster Addle',
          ko: '아돌 넣으라우',
        },
      },
    },
    // 내추럴 얼라인 안에 있는 엔드 오브 데이즈
    {
      id: 'P8S 어듬이 엔드오브데이즈 버프',
      regex: /Outer End of Days/,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role !== 'tank' && data.CanSilence())
          return output.amigo();
      },
      outputStrings: {
        amigo: {
          en: 'Range Buff',
          ko: '삼바 데 아미고 넣으라우',
        },
      },
    },
    // 하이컨셉 1
    {
      id: 'P8S 어듬이 하이컨셉 1 버프',
      regex: /High Concept 1/,
      beforeSeconds: 2,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanAddle())
          return output.addle();
      },
      outputStrings: {
        reprisal: {
          en: 'ST Reprisal',
          ko: 'ST 리프 넣으라우',
        },
        addle: {
          en: '(Caster Addle, if available)',
          ko: '(아돌 남으면 넣으라우)',
        },
        amigo: {
          en: 'Range Buff',
          ko: '삼바 데 아미고 넣으라우',
        },
      },
    },
    // 하이컨셉 2
    {
      id: 'P8S 어듬이 하이컨셉 2 버프',
      regex: /High Concept 2/,
      beforeSeconds: 2,
      condition: (data) => data.options.AutumnStyle,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.reprisal();
        if (data.CanSilence())
          return output.amigo();
      },
      outputStrings: {
        reprisal: {
          en: 'ST Reprisal',
          ko: 'ST 리프 넣으라우',
        },
        amigo: {
          en: 'Range Buff',
          ko: '삼바 데 아미고 넣으라우',
        },
      },
    },
  ],
  triggers: [
    // ---------------- Part 1 ----------------
    {
      id: 'P8S Genesis of Flame',
      type: 'StartsUsing',
      netRegex: { id: '7944', source: 'Hephaistos', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P8S Scorching Fang',
      type: 'StartsUsing',
      netRegex: { id: '7912', source: 'Hephaistos', capture: false },
      alertText: (data, _matches, output) => {
        if (data.conceptual === 'octa')
          return output.outAndSpread();
        if (data.conceptual === 'tetra')
          return output.outAndStacks();
        return output.out();
      },
      run: (data) => delete data.conceptual,
      outputStrings: {
        out: Outputs.out,
        outAndSpread: {
          en: 'Out + Spread',
          de: 'Raus + Verteilen',
          fr: 'Extérieur + Écartez-vous',
          ja: '黒線の外側 + 散会',
          cn: '黑线外侧 + 分散',
          ko: '깜선 바깥 + 흩어져욧',
        },
        outAndStacks: {
          en: 'Out + Stacks',
          de: 'Raus + Sammeln',
          fr: 'Extérieur + Package',
          ja: '黒線の外側 + 2人頭割り',
          cn: '黑线外侧 + 2人分摊',
          ko: '숫자 마커 + 페어',
        },
      },
    },
    {
      id: 'P8S Sun\'s Pinion',
      type: 'StartsUsing',
      netRegex: { id: '7913', source: 'Hephaistos', capture: false },
      // There are two casts, one for each side.
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.conceptual === 'octa')
          return output.inAndSpread();
        if (data.conceptual === 'tetra')
          return output.inAndStacks();
        return output.in();
      },
      run: (data) => delete data.conceptual,
      outputStrings: {
        in: Outputs.in,
        inAndSpread: {
          en: 'In + Spread',
          de: 'Rein + Verteilen',
          fr: 'Intérieur + Écartez-vous',
          ja: '黒線の内側 + 散会',
          cn: '黑线内侧 + 分散',
          ko: '깜선 안 + 흩어져욧',
        },
        inAndStacks: {
          en: 'In + Stacks',
          de: 'Rein + Sammeln',
          fr: 'Intérieur + Package',
          ja: '黒線の内側 + 2人頭割り',
          cn: '黑线内侧 + 2人分摊',
          ko: '깜선 안 + 페어',
        },
      },
    },
    {
      id: 'P8S Flameviper',
      type: 'StartsUsing',
      netRegex: { id: '7945', source: 'Hephaistos' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'P8S Conceptual Diflare Quadruped',
      type: 'StartsUsing',
      // 7915 normally
      // 7916 during Blazing Footfalls
      netRegex: { id: '7917', source: 'Hephaistos', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.healerGroups(),
      run: (data, _matches, output) => data.footfallsConcept = output.healerGroups(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'P8S Conceptual Tetraflare Quadruped',
      type: 'StartsUsing',
      // 7915 normally
      // 7916 during Blazing Footfalls
      netRegex: { id: '7916', source: 'Hephaistos', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text(),
      run: (data, _matches, output) => data.footfallsConcept = output.text(),
      outputStrings: {
        text: Outputs.pairStack,
      },
    },
    {
      id: 'P8S Conceptual Tetraflare',
      type: 'StartsUsing',
      // 7915 normally
      // 7916 during Blazing Footfalls
      netRegex: { id: '7915', source: 'Hephaistos', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.conceptual = 'tetra',
      outputStrings: {
        text: {
          en: '(partner stack, for later)',
          de: '(Partner-Stacks, für später)',
          fr: '(Package partenaire, pour après)',
          ja: '(後で2人頭割り)',
          cn: '(稍后 2人分摊)',
          ko: '(나중에 페어)',
        },
      },
    },
    {
      id: 'P8S Conceptual Octaflare',
      type: 'StartsUsing',
      netRegex: { id: '7914', source: 'Hephaistos', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.conceptual = 'octa',
      outputStrings: {
        text: {
          en: '(spread, for later)',
          de: '(Verteilen, für später)',
          fr: '(Écartez-vous, pour après)',
          ja: '(後で散会)',
          cn: '(稍后 分散)',
          ko: '(나중에 흩어져요)',
        },
      },
    },
    {
      id: 'P8S Octaflare',
      type: 'StartsUsing',
      netRegex: { id: '791D', source: 'Hephaistos', capture: false },
      response: Responses.spread('alarm'),
    },
    {
      id: 'P8S Tetraflare',
      type: 'StartsUsing',
      // During vents and also during clones.
      netRegex: { id: '791E', source: 'Hephaistos', capture: false },
      alertText: (data, _matches, output) => {
        if (data.illusory === 'bird')
          return output.inAndStacks();
        if (data.illusory === 'snake')
          return output.outAndStacks();
        return output.stacks();
      },
      run: (data) => delete data.illusory,
      outputStrings: {
        inAndStacks: {
          en: 'In + Stacks',
          de: 'Rein + Sammeln',
          fr: 'Intérieur + Package',
          ja: '黒線の内側 + 2人頭割り',
          cn: '黑线内侧 + 2人分摊',
          ko: '깜선 안 + 페어',
        },
        outAndStacks: {
          en: 'Out + Stacks',
          de: 'Raus + Sammeln',
          fr: 'Extérieur + Package',
          ja: '黒線の外側 + 2人頭割り',
          cn: '黑线外侧 + 2人分摊',
          ko: '숫자 마커 + 페어',
        },
        stacks: Outputs.pairStack,
      },
    },
    {
      id: 'P8S Nest of Flamevipers',
      type: 'StartsUsing',
      // During clones.
      netRegex: { id: '791F', source: 'Hephaistos', capture: false },
      alertText: (data, _matches, output) => {
        if (data.illusory === 'bird')
          return output.inAndProtean();
        if (data.illusory === 'snake') {
          if (data.role === 'healer')
            return output.outAndProteanOutside();
          if (data.role === 'dps' && (data.CanSilence() || data.CanAddle()))
            return output.outAndProteanOutside();
          return output.outAndProteanInside();
        }
        // This shouldn't happen, but just in case.
        return output.protean();
      },
      run: (data) => delete data.illusory,
      outputStrings: {
        inAndProtean: {
          en: 'In + Protean',
          de: 'Rein + Himmelsrichtung',
          fr: 'Intérieur + Positions',
          ja: '黒線の内側 + 基本散会',
          cn: '黑线内侧 + 分散引导',
          ko: '깜선 안 + 기본산개 + 프로틴',
        },
        outAndProteanInside: {
          en: 'Out + Protean',
          de: 'Raus + Himmelsrichtung',
          fr: 'Extérieur + Positions',
          ja: '黒線の外側 + 数字マーカー',
          ko: '숫자 마커로 ← 프로틴', // 밀리 안으로
        },
        outAndProteanOutside: {
          en: 'Out + Protean',
          de: 'Raus + Himmelsrichtung',
          fr: 'Extérieur + Positions',
          ja: '黒線の外側 + 散会',
          cn: '黑线外侧 + 分散引导',
          ko: '숫자 바깥 끝으로 ← 프로틴', // 원격 밖으로
        },
        protean: {
          en: 'Protean',
          de: 'Himmelsrichtung',
          fr: 'Positions',
          ja: '散会',
          cn: '分散',
          ko: '프로틴',
        },
      },
    },
    {
      id: 'P8S Torch Flame Collect',
      type: 'StartsUsing',
      netRegex: { id: '7927', source: 'Hephaistos' },
      run: (data, matches) => data.torches.push(matches),
    },
    {
      id: 'P8S Torch Flame',
      type: 'StartsUsing',
      netRegex: { id: '7927', source: 'Hephaistos', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      promise: async (data) => {
        data.combatantData = [];
        const ids = data.torches.map((torch) => parseInt(torch.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
        data.torches = [];
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length === 0)
          return;
        const safe = {
          cornerNW: true,
          cornerNE: true,
          cornerSE: true,
          cornerSW: true,
          // Unlike normal mode, these "outside" are two tiles and not 4,
          // e.g. "outsideNorth" = NNW/NNE tiles.
          // The ordering here matters.
          outsideNorth: true,
          insideNorth: true,
          outsideWest: true,
          insideWest: true,
          outsideEast: true,
          insideEast: true,
          outsideSouth: true,
          insideSouth: true,
        };
        // idx = x + y * 4
        // This map is the tile index mapped to the keys that any
        // torch exploding on that square would make unsafe.
        const unsafeMap = {
          0: ['cornerNW'],
          1: ['outsideNorth'],
          2: ['outsideNorth'],
          3: ['cornerNE'],
          4: ['outsideWest'],
          5: ['insideWest', 'insideNorth'],
          6: ['insideEast', 'insideNorth'],
          7: ['outsideEast'],
          8: ['outsideWest'],
          9: ['insideWest', 'insideSouth'],
          10: ['insideEast', 'insideSouth'],
          11: ['outsideEast'],
          12: ['cornerSW'],
          13: ['outsideSouth'],
          14: ['outsideSouth'],
          15: ['cornerSE'],
        };
        // Loop through all torches, remove any rows/columns it intersects with
        // to find safe lanes.
        for (const torch of data.combatantData) {
          // x, y = 85, 95, 105, 115
          // map to ([0, 3], [0, 3])
          const x = Math.floor((torch.PosX - 85) / 10);
          const y = Math.floor((torch.PosY - 85) / 10);
          const idx = x + y * 4;
          const unsafeArr = unsafeMap[idx];
          for (const entry of unsafeArr ?? [])
            delete safe[entry];
        }
        const safeKeys = Object.keys(safe);
        const [safe0, safe1, safe2, safe3] = safeKeys;
        // Unexpectedly zero safe zones.
        if (safe0 === undefined)
          return;
        // Blazing Foothills will have 4 safe spots
        // However, it will only be East or West
        if (data.trailblazeCount === 1) {
          if (safeKeys.length !== 3)
            return;
          if (safe0 === 'cornerNE' && safe1 === 'cornerSE' && safe2 === 'outsideEast')
            data.trailblazeTorchSafeZone = 'east';
          if (safe0 === 'cornerNW' && safe1 === 'cornerSW' && safe2 === 'outsideWest')
            data.trailblazeTorchSafeZone = 'west';
          return;
        }
        // Special case inner four squares.
        if (
          safeKeys.length === 4 &&
          // Ordered same as keys above.
          safe0 === 'insideNorth' &&
          safe1 === 'insideWest' &&
          safe2 === 'insideEast' &&
          safe3 === 'insideSouth'
        )
          return output.insideSquare();
        // Not set up to handle more than two safe zones.
        if (safe2 !== undefined)
          return;
        if (safe1 === undefined)
          return output[safe0]();
        const dir1 = output[safe0]();
        const dir2 = output[safe1]();
        return output.combo({ dir1: dir1, dir2: dir2 });
      },
      outputStrings: {
        combo: {
          en: '${dir1} / ${dir2}',
          de: '${dir1} / ${dir2}',
          fr: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          cn: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        insideSquare: {
          en: 'Inside Square',
          de: 'Inneres Viereck',
          fr: 'Intérieur carré',
          ja: '内側の四角の中',
          cn: '场中',
          ko: '가운데 사각[안]',
        },
        cornerNW: prsStrings.northWest,
        cornerNE: prsStrings.northEast,
        cornerSE: prsStrings.southEast,
        cornerSW: prsStrings.southWest,
        outsideNorth: {
          en: 'Outside North',
          de: 'Im Norden raus',
          fr: 'Nord Extérieur',
          ja: '北の外側',
          cn: '上 (北) 外侧',
          ko: '북[바깥]',
        },
        insideNorth: {
          en: 'Inside North',
          de: 'Im Norden rein',
          fr: 'Nord Intérieur',
          ja: '北の内側',
          cn: '上 (北) 内侧',
          ko: '북[안]',
        },
        outsideEast: {
          en: 'Outside East',
          de: 'Im Osten raus',
          fr: 'Est Extérieur',
          ja: '東の外側',
          cn: '右 (东) 外侧',
          ko: '동[바깥]',
        },
        insideEast: {
          en: 'Inside East',
          de: 'Im Osten rein',
          fr: 'Est Intérieur',
          ja: '東の内側',
          cn: '右 (东) 内侧',
          ko: '동[안]',
        },
        outsideSouth: {
          en: 'Outside South',
          de: 'Im Süden raus',
          fr: 'Sud Extérieur',
          ja: '南の外側',
          cn: '下 (南) 外侧',
          ko: '남[바깥]',
        },
        insideSouth: {
          en: 'Inside South',
          de: 'Im Süden rein',
          fr: 'Sud Intérieur',
          ja: '南の内側',
          cn: '下 (南) 内侧',
          ko: '남[안]',
        },
        outsideWest: {
          en: 'Outside West',
          de: 'Im Westen raus',
          fr: 'Ouest Extérieur',
          ja: '西の外側',
          cn: '左 (西) 外侧',
          ko: '서[바깥]',
        },
        insideWest: {
          en: 'Inside West',
          de: 'Im Westen rein',
          fr: 'Ouest Intérieur',
          ja: '西の内側',
          cn: '左 (西) 内侧',
          ko: '서[안]',
        },
      },
    },
    {
      id: 'P8S Ektothermos',
      type: 'StartsUsing',
      netRegex: { id: '79EA', source: 'Hephaistos', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P8S Footprint',
      type: 'Ability',
      // There is 6.4 seconds between this Reforged Reflection ability and the Footprint (7109) ability.
      netRegex: { id: '794B', source: 'Hephaistos', capture: false },
      delaySeconds: 1.5,
      alertText: (_data, _matches, output) => output.knockback(),
      outputStrings: {
        knockback: {
          en: 'Knockback',
          ja: 'ノックバック => 4足歩行',
          ko: '넉백! [쿵쾅이]',
        },
      },
    },
    {
      id: 'P8S Snaking Kick',
      type: 'StartsUsing',
      // This is the Reforged Reflection cast.
      netRegex: { id: '794C', source: 'Hephaistos', capture: false },
      alertText: (_data, _matches, output) => output.out(),
      outputStrings: {
        out: {
          en: 'Out',
          ja: '外へ => 蛇腕',
          ko: '서클 밖으로! [뱀이다~앙]',
        },
      },
    },
    {
      id: 'P8S Gorgon Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '11517', npcBaseId: '15052' },
      // We could technically call WAY ahead of time here.
      run: (data, matches) => data.gorgons.push(matches),
    },
    {
      id: 'P8S Gorgon Location',
      type: 'StartsUsing',
      // We could call the very first one out immediately on the Added Combatant line,
      // but then we'd have to duplicate this.
      netRegex: { id: '792B', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        data.gorgonCount++;
        // Gorgons fire in order of actor id (highest first), but are added in any order.
        // Sort from lowest id to highest, so we can pull off the end.
        data.gorgons.sort((a, b) => a.id.localeCompare(b.id));
        const gorgons = [];
        if (data.gorgonCount === 1 || data.gorgonCount === 2) {
          // For Snake 1, all positions are known ahead of time, so do 2 at a time.
          const g0 = data.gorgons.pop();
          const g1 = data.gorgons.pop();
          if (g0 === undefined || g1 === undefined)
            return;
          gorgons.push(g0);
          gorgons.push(g1);
        } else {
          // For Snake 2, just call all at once.
          gorgons.push(...data.gorgons);
          data.gorgons = [];
        }
        if (gorgons.length !== 2 && gorgons.length !== 4)
          return;
        const dirs = gorgons.map(positionMatchesTo8Dir).sort();
        const [d0, d1] = dirs;
        if (d0 === undefined || d1 === undefined)
          return;
        if (dirs.length === 4)
          return d0 === 0 ? output.intercards() : output.cardinals();
        const outputMap = {
          0: output.dirN(),
          1: output.dirNE(),
          2: output.dirE(),
          3: output.dirSE(),
          4: output.dirS(),
          5: output.dirSW(),
          6: output.dirW(),
          7: output.dirNW(),
        };
        const arrowMap = {
          0: output.arrN(),
          1: output.arrNE(),
          2: output.arrE(),
          3: output.arrSE(),
          4: output.arrS(),
          5: output.arrSW(),
          6: output.arrW(),
          7: output.arrNW(),
        };
        const dir1 = outputMap[d0] ?? output.unknown();
        const dir2 = outputMap[d1] ?? output.unknown();
        if (!data.options.AutumnStyle)
          return output.gorgons({ dir1: dir1, dir2: dir2 });
        const arr1 = arrowMap[d0] ?? output.unknown();
        const arr2 = arrowMap[d1] ?? output.unknown();
        return output.gorgonsArrow({ dir1: dir1, dir2: dir2, arr1: arr1, arr2: arr2 });
      },
      outputStrings: {
        cardinals: {
          en: 'Look Cardinals',
          de: 'Schaue Kardinal',
          fr: 'Regardez en cardinal',
          ja: '視線を十字に',
          cn: '看正点',
          ko: '십자 보세요 [❌고르곤]',
        },
        intercards: {
          en: 'Look Intercards',
          de: 'Schaue Interkardinal',
          fr: 'Regardez en intercardinal',
          ja: '視線を斜めに',
          cn: '看斜点',
          ko: '모서리 보세요 [➕고르곤]',
        },
        gorgons: {
          en: '${dir1}/${dir2} Gorgons',
          de: '${dir1}/${dir2} Gorgone',
          fr: 'Gorgones ${dir1}/${dir2}',
          ja: 'ゴルゴン：${dir1}/${dir2}',
          cn: '蛇: ${dir1}/${dir2}',
          ko: '고르곤: ${dir1}${dir2}',
        },
        gorgonsArrow: {
          en: '${dir1}${dir2} ${arr1}${arr2} Gorgons',
          ko: '고르곤: ${dir1}${dir2} ${arr1}${arr2}',
        },
        dirN: prsStrings.north,
        dirNE: prsStrings.northEast,
        dirE: prsStrings.east,
        dirSE: prsStrings.southEast,
        dirS: prsStrings.south,
        dirSW: prsStrings.southWest,
        dirW: prsStrings.west,
        dirNW: prsStrings.northWest,
        arrN: Outputs.arrowN,
        arrNE: Outputs.arrowNE,
        arrE: Outputs.arrowE,
        arrSE: Outputs.arrowSE,
        arrS: Outputs.arrowS,
        arrSW: Outputs.arrowSW,
        arrW: Outputs.arrowW,
        arrNW: Outputs.arrowNW,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P8S First Snake Debuff Collect',
      // BBC = First in Line
      // BBD = Second in Line,
      // D17 = Eye of the Gorgon
      // D18 = Crown of the Gorgon
      // CFE = Blood of the Gorgon
      // CFF = Breath of the Gorgon
      type: 'GainsEffect',
      netRegex: { effectId: ['BB[CD]', 'D17', 'CFE'] },
      condition: (data) => !data.firstSnakeCalled,
      run: (data, matches) => {
        const id = matches.effectId;
        if (id === 'BBC')
          data.firstSnakeOrder[matches.target] = 1;
        else if (id === 'BBD')
          data.firstSnakeOrder[matches.target] = 2;
        else if (id === 'D17')
          data.firstSnakeDebuff[matches.target] = 'gaze';
        else if (id === 'CFE')
          data.firstSnakeDebuff[matches.target] = 'poison';
      },
    },
    {
      id: 'P8S First Snake Debuff Initial Call',
      type: 'GainsEffect',
      netRegex: { effectId: ['BB[CD]', 'D17', 'CFE'], capture: false },
      condition: (data) => !data.firstSnakeCalled,
      delaySeconds: 0.3,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          firstGaze: {
            en: 'First Gaze (w/ ${player})',
            de: 'Erster Blick (+ ${player})',
            fr: 'Premier Regard (+ ${player})',
            ja: '先の石化 (+${player})',
            cn: '1组 石化 (+ ${player})',
            ko: '첫째 게이즈 (+${player})',
          },
          secondGaze: {
            en: 'Second Gaze (w/ ${player})',
            de: 'Zweiter Blick (+ ${player})',
            fr: 'Second Regard (+ ${player})',
            ja: '後の石化 (+${player})',
            cn: '2组 石化 (+ ${player})',
            ko: '둘째 게이즈 (+${player})',
          },
          firstPoison: {
            en: 'First Poison (w/ ${player})',
            de: 'Erstes Gift (+ ${player})',
            fr: 'Premier Poison (+ ${player})',
            ja: '先の毒 (+${player})',
            cn: '1组 毒 (+ ${player})',
            ko: '첫째 독 바닥 (+${player})',
          },
          secondPoison: {
            en: 'Second Poison (w/ ${player})',
            de: 'Zweites Gift (+ ${player})',
            fr: 'Second Poison (+ ${player})',
            ja: '後の毒 (+${player})',
            cn: '2组 毒 (+ ${player})',
            ko: '둘째 독 바닥 (+${player})',
          },
          unknown: Outputs.unknown,
        };
        const myNumber = data.firstSnakeOrder[data.me];
        if (myNumber === undefined)
          return;
        const myDebuff = data.firstSnakeDebuff[data.me];
        if (myDebuff === undefined)
          return;
        let partner = output.unknown();
        for (const [name, theirDebuff] of Object.entries(data.firstSnakeDebuff)) {
          if (myDebuff !== theirDebuff || name === data.me)
            continue;
          const theirNumber = data.firstSnakeOrder[name];
          if (myNumber === theirNumber) {
            partner = data.party.member(name);
            break;
          }
        }
        if (myNumber === 1) {
          if (myDebuff === 'gaze')
            return { alertText: output.firstGaze({ player: partner }) };
          return { alertText: output.firstPoison({ player: partner }) };
        }
        if (myDebuff === 'gaze')
          return { infoText: output.secondGaze({ player: partner }) };
        return { infoText: output.secondPoison({ player: partner }) };
      },
      run: (data) => data.firstSnakeCalled = true,
    },
    {
      id: 'P8S Second Snake Debuff Collect',
      // D17 = Eye of the Gorgon (gaze)
      // D18 = Crown of the Gorgon (shriek)
      // CFE = Blood of the Gorgon (small poison)
      // CFF = Breath of the Gorgon (stack poison)
      type: 'GainsEffect',
      netRegex: { effectId: ['D1[78]', 'CFF'] },
      condition: (data) => data.firstSnakeCalled,
      run: (data, matches) => {
        const id = matches.effectId;
        if (id === 'D17') {
          // 23s short, 29s long
          const duration = parseFloat(matches.duration);
          data.secondSnakeGazeFirst[matches.target] = duration < 24;
          data.secondSnakeDebuff[matches.target] ??= 'nothing';
        } else if (id === 'D18') {
          data.secondSnakeDebuff[matches.target] = 'shriek';
        } else if (id === 'CFF') {
          data.secondSnakeDebuff[matches.target] = 'stack';
        }
      },
    },
    {
      id: 'P8S Second Snake Debuff Initial Call',
      type: 'GainsEffect',
      netRegex: { effectId: ['D1[78]', 'CFF'], capture: false },
      condition: (data) => data.firstSnakeCalled,
      delaySeconds: 0.3,
      durationSeconds: 6,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          firstGaze: {
            en: 'First Gaze',
            de: 'Erster Blick',
            fr: 'Premier Regard',
            ja: '先の石化',
            cn: '1组 石化',
            ko: '첫째 게이즈',
          },
          secondGaze: {
            en: 'Second Gaze',
            de: 'Zweiter Blick',
            fr: 'Second Regard',
            ja: '後の石化',
            cn: '2组 石化',
            ko: '둘째 게이즈',
          },
          shriek: {
            en: 'Shriek later (with ${player})',
            de: 'Schrei später (mit ${player})',
            fr: 'Cri plus tard (avec ${player})',
            ja: '自分に魔眼 (+${player})',
            cn: '石化点名 (+ ${player}',
            ko: '나중에 내가 마안 (+${player})',
          },
          stack: {
            en: 'Stack later (with ${player})',
            de: 'Später sammeln (mit ${player})',
            fr: 'Package plus tard (avec ${player})',
            ja: '自分に頭割り (+${player})',
            cn: '稍后分摊 (与 ${player})',
            ko: '나중에 내게 뭉쳐요 (+${player})',
          },
          noDebuff: {
            en: 'No debuff (w/ ${player1}, ${player2}, ${player3})',
            de: 'Kein Debuff (+ ${player1}, ${player2}, ${player3})',
            fr: 'Aucun debuff (+ ${player1}, ${player2}, ${player3})',
            ja: '無職 (${player1}, ${player2}, ${player3})',
            cn: '无Debuff (+ ${player1}, ${player2}, ${player3})',
            ko: '무직이네 (${player1}, ${player2}, ${player3})',
          },
        };
        const isGazeFirst = data.secondSnakeGazeFirst[data.me];
        const myDebuff = data.secondSnakeDebuff[data.me];
        if (isGazeFirst === undefined || myDebuff === undefined)
          return;
        const friends = [];
        for (const [name, theirDebuff] of Object.entries(data.secondSnakeDebuff)) {
          if (myDebuff === theirDebuff && name !== data.me)
            friends.push(data.party.member(name));
        }
        const gazeAlert = isGazeFirst ? output.firstGaze() : output.secondGaze();
        if (myDebuff === 'nothing') {
          return {
            alertText: gazeAlert,
            infoText: output.noDebuff({
              player1: friends[0],
              player2: friends[1],
              player3: friends[2],
            }),
          };
        }
        if (myDebuff === 'shriek') {
          return {
            alertText: gazeAlert,
            infoText: output.shriek({ player: friends[0] }),
          };
        }
        if (myDebuff === 'stack') {
          return {
            alertText: gazeAlert,
            infoText: output.stack({ player: friends[0] }),
          };
        }
      },
    },
    {
      id: 'P8S Uplift Counter',
      type: 'Ability',
      netRegex: { id: '7935', source: 'Hephaistos', capture: false },
      // Count in a separate trigger so that we can suppress it, but still call out for
      // both people hit.
      preRun: (data, _matches) => data.upliftCounter++,
      durationSeconds: 1.7,
      suppressSeconds: 1,
      sound: '',
      infoText: (data, _matches, output) => output.text({ num: data.upliftCounter }),
      tts: null,
      outputStrings: {
        text: {
          en: '${num}',
          de: '${num}',
          fr: '${num}',
          ja: '${num}番',
          cn: '${num}',
          ko: '${num}번',
        },
      },
    },
    {
      id: 'P8S Uplift Number',
      type: 'Ability',
      netRegex: { id: '7935', source: 'Hephaistos' },
      condition: Conditions.targetIsYou(),
      // ~12.8 seconds between #1 Uplift (7935) to #1 Stomp Dead (7937)
      // ~13.8 seconds between #4 Uplift (7935) to #4 Stomp Dead (7937).
      // Split the difference with 13.3 seconds.
      durationSeconds: 13.3,
      alertText: (data, _matches, output) => output.text({ num: data.upliftCounter }),
      outputStrings: {
        text: {
          en: '${num}',
          de: '${num}',
          fr: '${num}',
          ja: '自分: ${num}番',
          cn: '${num}',
          ko: '나: ${num}번',
        },
      },
    },
    {
      id: 'P8S Quadrupedal Impact/Crush',
      // 7A04 Quadrupedal Impact
      // 7A05 Quadrupedal Crush
      type: 'StartsUsing',
      netRegex: { id: ['7A04', '7A05'], source: 'Hephaistos' },
      promise: async (data, matches) => {
        // select the Hephaistoss with same source id
        let hephaistosData = null;
        hephaistosData = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        });
        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (hephaistosData === null) {
          console.error(`Hephaistos: null data`);
          return;
        }
        if (hephaistosData.combatants.length !== 1) {
          console.error(`Hephaistos: expected 1, got ${hephaistosData.combatants.length}`);
          return;
        }
        const hephaistos = hephaistosData.combatants[0];
        if (!hephaistos)
          return;
        // Boss faces 3.14159274 or -3.13727832 when North
        // Flip callout if crush (7A05)
        const epsilon = 0.1;
        if (Math.abs(Math.abs(hephaistos.Heading) - 3.14) < epsilon)
          data.crushImpactSafeZone = matches.id === '7A05' ? 'south' : 'north';
        // Boss will be facing South
        else
          data.crushImpactSafeZone = matches.id === '7A05' ? 'north' : 'south';
      },
      infoText: (data, matches, output) => {
        if (data.crushImpactSafeZone === undefined) {
          if (matches.id === '7A05')
            return output.crush();
          return output.impact();
        }
        if (matches.id === '7A05')
          return output.crushDir({ dir: output[data.crushImpactSafeZone]() });
        return output.impactDir({ dir: output[data.crushImpactSafeZone]() });
      },
      outputStrings: {
        impactDir: {
          en: 'Follow to ${dir} (Knockback)',
          de: 'Nach ${dir} folgen (Rückstoß)',
          fr: 'Allez vers ${dir} (Poussée)',
          ja: '${dir}に近づく (ノックバック)',
          cn: '去 ${dir} 被击退',
          ko: '[넉백] ${dir}로 따라가요',
        },
        crushDir: {
          en: 'Away to ${dir}',
          de: 'Weg nach ${dir}',
          fr: 'Loin vers ${dir}',
          ja: '${dir}が安置 (クラッシュ)',
          cn: '去 ${dir}',
          ko: '[푹찍] ${dir}로 피해요',
        },
        crush: {
          en: 'Away From Jump',
          de: 'Weg vom Sprung',
          fr: 'Éloignez-vous du saut',
          ja: '離れる',
          cn: '远离跳的方向',
          ko: '[푹찍] 점프에게서 먼곳으로',
        },
        impact: {
          en: 'Follow Jump',
          de: 'Sprung folgen',
          fr: 'Suivez le saut',
          ja: '近づく',
          cn: '靠近跳的方向',
          ko: '[넉백] 점프 따라가요',
        },
        north: prsStrings.north,
        south: prsStrings.south,
      },
    },
    {
      id: 'P8S Blazing Footfalls',
      // 793B Trailblaze Shown
      // 793D Quadrupedal Crush Shown
      // 793C Quadrupedal Impact Shown
      // These are shown in the span of 8.5s
      // Blazing Footfalls takes 14.5s to complete +4s to resolve Torch Flames
      type: 'Ability',
      netRegex: { id: ['793C', '793D'], source: 'Hephaistos' },
      preRun: (data, matches) => {
        const x = parseInt(matches.targetX) - 100;
        const y = parseInt(matches.targetY) - 100;
        // 0 = N, 1 = E, etc
        const dir = Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;
        if (matches.id === '793C') {
          data.footfallsOrder.push('impact');
          data.footfallsDirs.push(dir);
        } else {
          data.footfallsOrder.push('crush');
          data.footfallsDirs.push((dir + 2) % 4);
        }
      },
      durationSeconds: 9,
      infoText: (data, _matches, output) => {
        const dirToCard = {
          0: output.north(),
          1: output.east(),
          2: output.south(),
          3: output.west(),
        };
        const validDirs = [0, 1, 2, 3];
        // Output first push direction
        if (
          data.footfallsDirs[0] !== undefined &&
          data.footfallsOrder[0] !== undefined &&
          data.footfallsDirs[1] === undefined &&
          data.footfallsOrder[1] === undefined
        ) {
          if (!validDirs.includes(data.footfallsDirs[0])) {
            console.error(`Blazing Footfalls: Unexpected dirs, got ${data.footfallsDirs[0]}}`);
            return;
          }
          return output.firstTrailblaze({
            dir: dirToCard[data.footfallsDirs[0]],
            concept: data.footfallsConcept,
          });
        }
      },
      outputStrings: {
        firstTrailblaze: {
          en: '${dir} Black Line => ${concept}',
          de: '${dir} Schwarze Linie => ${concept}',
          fr: '${dir} Ligne noire -> ${concept}',
          ja: '${dir}の黒線 => ${concept}',
          cn: '${dir} 黑线 => ${concept}',
          ko: '${dir} 깜선으로 🔜 ${concept}',
        },
        north: prsStrings.north,
        east: prsStrings.east,
        south: prsStrings.south,
        west: prsStrings.west,
      },
    },
    {
      id: 'P8S Blazing Footfalls Trailblaze 2',
      type: 'StartsUsing',
      netRegex: { id: ['7106', '7107'], source: 'Hephaistos', capture: false },
      condition: (data) => data.trailblazeCount === 1,
      durationSeconds: 3.9,
      infoText: (data, _matches, output) => {
        if (data.footfallsDirs[1] !== undefined && data.footfallsOrder[1] !== undefined) {
          // Check if have valid dirs
          const validDirs = [0, 1, 2, 3];
          if (!validDirs.includes(data.footfallsDirs[1])) {
            console.error(
              `Blazing Footfalls Reminder: Unexpected dirs, got ${data.footfallsDirs[1]}`,
            );
            return;
          }
          const dirToCard = {
            0: output.north(),
            1: output.east(),
            2: output.south(),
            3: output.west(),
          };
          return output.trailblaze({
            dir: dirToCard[data.footfallsDirs[1]],
            action: output[data.footfallsOrder[1]](),
          });
        }
      },
      outputStrings: {
        trailblaze: {
          en: '${dir} Black Line => ${action}',
          de: '${dir} Schwarze Linie => ${action}',
          fr: '${dir} Ligne noire -> ${action}',
          ja: '${dir}の黒線 => ${action}',
          cn: '${dir} 黑线 => ${action}',
          ko: '${dir} 깜선으로 🔜 ${action}',
        },
        crush: prsStrings.crush,
        impact: prsStrings.impact,
        north: prsStrings.north,
        east: prsStrings.east,
        south: prsStrings.south,
        west: prsStrings.west,
      },
    },
    {
      id: 'P8S Blazing Footfalls Crush/Impact Reminder',
      // Reminder after Trailblaze for Impact/Crush Movement
      type: 'StartsUsing',
      netRegex: { id: '793E', source: 'Hephaistos' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          trailblaze: {
            en: 'Wait => ${dir}',
            de: 'Warte => ${dir}',
            fr: 'Attendez -> ${dir}',
            ja: '待機 => ${dir}',
            cn: '等待 => ${dir}',
            ko: '[푹찍] 기다렸다가 🔜 ${dir}',
          },
          trailblazeKnockback: {
            en: '${dir} Knockback',
            de: '${dir} Rückstoß',
            fr: '${dir} Poussée',
            ja: 'ノックバック: ${dir}',
            cn: '${dir} 击退',
            ko: '[넉백] ${dir}',
          },
          trailblazeKnockbackToDir: {
            en: '${dir1} Knockback ${dir2}',
            de: '${dir1} Rückstoß ${dir2}',
            fr: '${dir1} Poussée ${dir2}',
            ja: 'ノックバック: ${dir1} => ${dir2}',
            cn: '${dir1} 击退到 ${dir2}',
            ko: '[넉백] ${dir1} 🔜 ${dir2}',
          },
          trailblazeKnockbackSide: {
            en: 'Knockback ${dir}',
            de: 'Rückstoß ${dir}',
            fr: 'Poussée ${dir}',
            ja: 'ノックバック: ${dir}',
            cn: '${dir} 击退',
            ko: '[넉백/파랑] ${dir}쪽',
          },
          trailblazeCrushSide: {
            en: 'Run ${dir}',
            de: 'Renne nach ${dir}',
            fr: 'Courez ${dir}',
            ja: '${dir}へ走れ',
            cn: '去 ${dir}',
            ko: '[푹찍/파랑] ${dir}쪽으로 달려요',
          },
          left: Outputs.left,
          right: Outputs.right,
          north: prsStrings.north,
          east: prsStrings.east,
          south: prsStrings.south,
          west: prsStrings.west,
        };
        if (
          data.footfallsDirs[0] !== undefined &&
          data.footfallsOrder[0] !== undefined &&
          data.footfallsDirs[1] !== undefined &&
          data.footfallsOrder[1] !== undefined
        ) {
          // Check if have valid dirs
          const validDirs = [0, 1, 2, 3];
          const dir = data.footfallsDirs[data.trailblazeCount];
          if (dir === undefined) {
            console.error(`Blazing Footfalls Crush/Impact Reminder: Unable to retreive direction.`);
            return;
          }
          if (!validDirs.includes(dir)) {
            if (data.trailblazeCount === 0)
              console.error(
                `Blazing Footfalls Crush/Impact Reminder: Unexpected dirs, got ${
                  data.footfallsDirs[0]
                }`,
              );
            console.error(
              `Blazing Footfalls Crush/Impact Reminder: Unexpected dirs, got ${
                data.footfallsDirs[1]
              }`,
            );
            return;
          }
          const dirToCard = {
            0: output.north(),
            1: output.east(),
            2: output.south(),
            3: output.west(),
          };
          // First trailblaze may require moving to new cardinal during Crush/Impact
          if (data.trailblazeCount === 0) {
            // Call move to next push back side if Crush
            // Only need to call this out if there is an upcoming pushback
            if (data.footfallsOrder[data.trailblazeCount] === 'crush')
              return { infoText: output.trailblaze({ dir: dirToCard[data.footfallsDirs[1]] }) };
            // Call future push location if knockback
            if (data.footfallsOrder[data.trailblazeCount] === 'impact')
              return {
                infoText: output.trailblazeKnockbackToDir({
                  dir1: dirToCard[dir],
                  dir2: dirToCard[data.footfallsDirs[1]],
                }),
              };
          }
          // prs: 피하는 곳 마커로 표시, 여기서 안걸릴리 없지만 혹시 안걸리면 원래 루틴
          const safedir = data.trailblazeTorchSafeZone === 'east' ? 1 : 3;
          if (data.footfallsOrder[data.trailblazeCount] === 'impact')
            return { alertText: output.trailblazeKnockbackSide({ dir: dirToCard[safedir] }) };
          if (data.footfallsOrder[data.trailblazeCount] === 'crush')
            return { alertText: output.trailblazeCrushSide({ dir: dirToCard[safedir] }) };
          // Dir is flipped for crush, thus matching knockback direction
          if (
            data.trailblazeTorchSafeZone === 'east' && dir === 0 ||
            data.trailblazeTorchSafeZone === 'west' && dir === 2
          ) {
            if (data.footfallsOrder[data.trailblazeCount] === 'impact')
              return { alertText: output.trailblazeKnockbackSide({ dir: output.left() }) };
            if (data.footfallsOrder[data.trailblazeCount] === 'crush')
              return { infoText: output.trailblazeCrushSide({ dir: output.left() }) };
          }
          if (
            data.trailblazeTorchSafeZone === 'west' && dir === 0 ||
            data.trailblazeTorchSafeZone === 'east' && dir === 2
          ) {
            if (data.footfallsOrder[data.trailblazeCount] === 'impact')
              return { alertText: output.trailblazeKnockbackSide({ dir: output.right() }) };
            if (data.footfallsOrder[data.trailblazeCount] === 'crush')
              return { infoText: output.trailblazeCrushSide({ dir: output.right() }) };
          }
          // Unable to determine direction, output only knockback
          if (data.footfallsOrder[data.trailblazeCount] === 'impact')
            return { alertText: output.trailblazeKnockback({ dir1: dirToCard[dir] }) };
        }
      },
      run: (data) => data.trailblazeCount++,
    },
    {
      id: 'P8S Illusory Hephaistos Scorched Pinion First',
      type: 'StartsUsing',
      // This is "Illusory Hephaistos" but sometimes it says "Gorgon", so drop the name.
      // This trigger calls out the Scorched Pinion location (7953), but is looking
      // for the Scorching Fang (7952) ability.  The reason for this is that there are
      // two casts of 7953 and only one 7952, and there's some suspicion that position
      // data may be incorrect on one of the 7953 mobs.
      netRegex: { id: '7952' },
      condition: (data) => data.flareTargets.length === 0,
      // For some reason the position data does not appear to be correct for either
      // 7952 or 7953.  Add a delay to hope that it gets up to date.
      // 7952/7953 is the real damage.  We could also try looking for 7950/7951, which is
      // a different mob with the Sunforge cast bar.  This might be in the correct place.
      delaySeconds: 0.3,
      promise: async (data, matches) => {
        data.combatantData = [];
        const id = parseInt(matches.sourceId, 16);
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [id],
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        const combatant = data.combatantData[0];
        if (combatant === undefined || data.combatantData.length !== 1)
          return;
        // This trigger finds the snake, so call the opposite.
        const dir = positionTo8Dir(combatant);
        if (dir === 0 || dir === 4)
          return output.eastWest();
        if (dir === 2 || dir === 6)
          return output.northSouth();
      },
      outputStrings: {
        northSouth: {
          en: 'North/South Bird',
          de: 'Norden/Süden Vogel',
          fr: 'Oiseau Nord/Sud',
          ja: '南北フェニックス',
          cn: '南/北 凤凰',
          ko: '남북으로 피닉스!',
        },
        eastWest: {
          en: 'East/West Bird',
          de: 'Osten/Westen Vogel',
          fr: 'Oiseau Est/Ouest',
          ja: '東西フェニックス',
          cn: '东/西 凤凰',
          ko: '동서로 피닉스!',
        },
      },
    },
    {
      id: 'P8S Illusory Hephaistos Scorched Pinion Second',
      type: 'StartsUsing',
      netRegex: { id: '7953', capture: false },
      condition: (data) => data.flareTargets.length > 0,
      suppressSeconds: 1,
      run: (data) => data.illusory = 'bird',
    },
    {
      id: 'P8S Illusory Hephaistos Scorching Fang Second',
      type: 'StartsUsing',
      netRegex: { id: '7952', capture: false },
      condition: (data) => data.flareTargets.length > 0,
      suppressSeconds: 1,
      run: (data) => data.illusory = 'snake',
    },
    {
      id: 'P8S Hemitheos\'s Flare Hit',
      type: 'Ability',
      netRegex: { id: '72CE', source: 'Hephaistos' },
      preRun: (data, matches) => data.flareTargets.push(matches.target),
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text();
      },
      outputStrings: {
        text: {
          en: '(avoid proteans)',
          de: '(weiche Himmelsrichtungen aus)',
          fr: '(évitez les positions)',
          ja: '(十字で回避)',
          cn: '(远离回避)',
          ko: '(피해욧! 십자로!)',
        },
      },
    },
    {
      id: 'P8S Hemitheos\'s Flare Not Hit',
      type: 'Ability',
      netRegex: { id: '72CE', source: 'Hephaistos', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.flareTargets.includes(data.me))
          return output.text();
      },
      outputStrings: {
        text: {
          en: 'In for Protean',
          de: 'rein für Himmelsrichtungen',
          fr: 'Intérieur pour les positions',
          ja: '近づく、内側で誘導',
          cn: '靠近引导',
          ko: '크로스 안쪽! 프로틴을 몸으로!',
        },
      },
    },
    {
      id: 'P8S Suneater Cthonic Vent Initial',
      type: 'StartsUsing',
      netRegex: { id: '7925' },
      condition: (data, matches) => {
        data.ventCasts.push(matches);
        return data.ventCasts.length === 2;
      },
      // Sometimes these initial positions are incorrect, so compensate with some delay.
      // TODO: can we detect/ignore these incorrect initial positions??
      delaySeconds: 0.5,
      promise: async (data) => {
        data.combatantData = [];
        const ids = data.ventCasts.map((m) => parseInt(m.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length === 0)
          return;
        const unsafeSpots = data.combatantData.map((c) => positionTo8Dir(c));
        return ventOutput(data.options.AutumnStyle, unsafeSpots, output);
      },
      run: (data) => data.ventCasts = [],
      outputStrings: ventOutputStrings,
    },
    {
      id: 'P8S Suneater Cthonic Vent Later',
      type: 'Ability',
      netRegex: { id: ['7923', '7924'] },
      condition: (data, matches) => {
        data.ventCasts.push(matches);
        return data.ventCasts.length === 2;
      },
      delaySeconds: 0.5,
      promise: async (data) => {
        data.combatantData = [];
        const ids = data.ventCasts.map((m) => parseInt(m.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length !== 2)
          return;
        const unsafeSpots = [];
        for (const c of data.combatantData) {
          const originalPos = positionTo8Dir(c);
          const heading = headingTo8Dir(c.Heading);
          // There's maybe some way to do this more generally, but I don't see it.
          // Also, if this fails for some reason, it will just not call anything below.
          if (
            originalPos === 7 && heading === 2 || originalPos === 3 && heading === 0 ||
            originalPos === 5 && heading === 1
          ) {
            // Going towards NE
            unsafeSpots.push(1);
          } else if (
            originalPos === 1 && heading === 4 || originalPos === 5 && heading === 2 ||
            originalPos === 7 && heading === 3
          ) {
            // Going towards SE
            unsafeSpots.push(3);
          } else if (
            originalPos === 3 && heading === 6 || originalPos === 1 && heading === 5 ||
            originalPos === 7 && heading === 4
          ) {
            // Going towards SW
            unsafeSpots.push(5);
          } else if (
            originalPos === 5 && heading === 0 || originalPos === 1 && heading === 6 ||
            originalPos === 3 && heading === 7
          ) {
            // Going towards NW
            unsafeSpots.push(7);
          }
        }
        return ventOutput(data.options.AutumnStyle, unsafeSpots, output);
      },
      run: (data) => data.ventCasts = [],
      outputStrings: ventOutputStrings,
    },
    {
      id: 'P8S Snake 2 Illusory Creation',
      type: 'StartsUsing',
      // Illusory Creation happens elsewhere, but this id only in Snake 2.
      // This is used to differentiate the 4x 7932 Gorgospit from the 1x 7932 Gorgospit that
      // (ideally) kills two Gorgons.
      netRegex: { id: '7931', source: 'Hephaistos', capture: false },
      run: (data) => data.seenSnakeIllusoryCreation = true,
    },
    {
      id: 'P8S Gorgospit Location',
      type: 'StartsUsing',
      netRegex: { id: '7932' },
      condition: (data) => data.seenSnakeIllusoryCreation,
      promise: async (data, matches) => {
        data.combatantData = [];
        const id = parseInt(matches.sourceId, 16);
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [id],
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        const combatant = data.combatantData[0];
        if (combatant === undefined || data.combatantData.length !== 1)
          return;
        // If Gorgons on cardinals, clone is (100, 100+/-20) or (100+/-20, 100).
        // If Gorgons on intercards, clone is (100+/-10, 100+/ 20) or (100+/-20, 100+/-10).
        // Also sometimes it's +/-11 and not +/-10 (???)
        const x = combatant.PosX;
        const y = combatant.PosY;
        // Add a little slop to find positions, just in case.  See note above about 11 vs 10.
        const epsilon = 3;
        // Handle 4x potential locations for line hitting cardinal Gorgons.
        if (Math.abs(x - 100) < epsilon)
          return output.eastWest();
        if (Math.abs(y - 100) < epsilon)
          return output.northSouth();
        // Handle 8x potential locations for line hitting intercard Gorgons.
        if (Math.abs(x - 90) < epsilon)
          return output.east();
        if (Math.abs(x - 110) < epsilon)
          return output.west();
        if (Math.abs(y - 90) < epsilon)
          return output.south();
        if (Math.abs(y - 110) < epsilon)
          return output.north();
      },
      outputStrings: {
        northSouth: {
          en: 'North / South',
          de: 'Norden / Süden',
          fr: 'Nord / Sud',
          ja: '南・北',
          cn: '南 / 北',
          ko: '위아래 ⒶⒸ',
        },
        eastWest: {
          en: 'East / West',
          de: 'Osten / Westen',
          fr: 'Est / Ouest',
          ja: '東・西',
          cn: '东 / 西',
          ko: '옆으로 ⒹⒷ',
        },
        north: {
          en: 'North ⓵⓶',
          ja: '北 ⓵⓶',
          ko: '북 ⓵⓶',
        },
        east: {
          en: 'East ⓶⓷',
          ja: '東 ⓶⓷',
          ko: '동 ⓶⓷',
        },
        south: {
          en: 'South ⓸⓷',
          ja: '南 ⓸⓷',
          ko: '남 ⓸⓷',
        },
        west: {
          en: 'West ⓵⓸',
          ja: '西 ⓵⓸',
          ko: '서 ⓵⓸',
        },
      },
    },
    // ---------------- Part 2 ----------------
    {
      id: 'P8S Aioniopyr',
      type: 'StartsUsing',
      netRegex: { id: '79DF', source: 'Hephaistos', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'P8S Tyrant\'s Unholy Darkness',
      type: 'StartsUsing',
      // Untargeted, with 79DE damage after.
      netRegex: { id: '79DD', source: 'Hephaistos', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Split Tankbusters',
          de: 'getrennte Tankbuster',
          fr: 'Séparez les Tankbuster',
          ja: '2人同時タンク強攻撃',
          cn: '分散死刑',
          ko: '따로 따로 탱크버스터',
        },
      },
    },
    {
      id: 'P8S Ashing Blaze Right',
      type: 'StartsUsing',
      netRegex: { id: '79D7', source: 'Hephaistos', capture: false },
      alertText: (data, _matches, output) => {
        if (data.firstAlignmentSecondAbility === 'stack')
          return output.rightAndStack();
        if (data.firstAlignmentSecondAbility === 'spread')
          return output.rightAndSpread();
        return output.right();
      },
      run: (data) => delete data.firstAlignmentSecondAbility,
      outputStrings: {
        right: Outputs.right,
        rightAndSpread: {
          en: 'Right + Spread',
          de: 'Rechts + Verteilen',
          fr: 'Droite + Écartez-vous',
          ja: '右 + 散会',
          cn: '右 + 分散',
          ko: '🡺오른쪽 + 흩어져욧',
        },
        rightAndStack: {
          en: 'Right + Stack',
          de: 'Rechts + Sammeln',
          fr: 'Droite + Package',
          ja: '右 + 頭割り',
          cn: '右 + 分摊',
          ko: '🡺오른쪽 + 뭉쳐욧',
        },
      },
    },
    {
      id: 'P8S Ashing Blaze Left',
      type: 'StartsUsing',
      netRegex: { id: '79D8', source: 'Hephaistos', capture: false },
      alertText: (data, _matches, output) => {
        if (data.firstAlignmentSecondAbility === 'stack')
          return output.leftAndStack();
        if (data.firstAlignmentSecondAbility === 'spread')
          return output.leftAndSpread();
        return output.left();
      },
      run: (data) => delete data.firstAlignmentSecondAbility,
      outputStrings: {
        left: Outputs.left,
        leftAndSpread: {
          en: 'Left + Spread',
          de: 'Links + Verteilen',
          fr: 'Gauche + Écartez-vous',
          ja: '左 + 散会',
          cn: '左 + 分散',
          ko: '왼쪽🡸 + 흩어져욧',
        },
        leftAndStack: {
          en: 'Left + Stack',
          de: 'Links + Sammeln',
          fr: 'Gauche + Package',
          ja: '左 + 頭割り',
          cn: '左 + 分摊',
          ko: '왼쪽🡸 + 뭉쳐욧',
        },
      },
    },
    {
      id: 'P8S High Concept',
      type: 'StartsUsing',
      netRegex: { id: '79AC', source: 'Hephaistos', capture: false },
      response: Responses.bigAoe(),
      run: (data) => {
        data.concept = {};
        data.splicer = {};
        data.prsHighConcept = (data.prsHighConcept ?? 0) + 1;
        delete data.prsMyConcept;
      },
    },
    {
      id: 'P8S Inverse Magics',
      type: 'GainsEffect',
      // This gets recast a lot on the same people, but shouldn't cause an issue.
      // This also only happens once on the second time through, so no need to reset.
      netRegex: { effectId: 'D15' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          reversed: {
            en: 'Inverse: ${player}',
            de: '${player} umgekehrt',
            fr: '${player} inversé',
            ja: '反転：${player}',
            cn: '${player} 颠倒',
            ko: '반전: ${player}',
          },
          reversedme: {
            en: 'Inverse on YOU!!!',
            ja: 'わたしが反転',
            ko: '내가 반전!!!',
          },
          ttsReverse: {
            en: 'わたしが反転',
          },
        };
        if (!data.inverseMagics[matches.target]) {
          if (data.me === matches.target)
            return { alarmText: output.reversedme(), tts: output.ttsReverse() };
          return { infoText: output.reversed({ player: data.party.member(matches.target) }) };
        }
      },
      run: (data, matches) => data.inverseMagics[matches.target] = true,
    },
    {
      id: 'P8S Natural Alignment Purple on You',
      type: 'GainsEffect',
      netRegex: { effectId: '9F8', count: '209' },
      preRun: (data, matches) => {
        data.alignmentTargets.push(matches.target);
        data.prsAlignMt = data.party.isDPS(matches.target);
      },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text();
      },
      tts: (data, matches, _output) => {
        if (data.me === matches.target)
          return 'わたしが紫丸';
      },
      outputStrings: {
        text: {
          en: 'Alignment on YOU',
          de: 'Anpassung auf DIR',
          fr: 'Alignement sur VOUS',
          ja: '自分に記述',
          cn: '记述点名',
          ko: '내게 보라🟣 동글이가!',
        },
      },
    },
    {
      id: 'P8S Natural Alignment Purple Targets',
      type: 'GainsEffect',
      netRegex: { effectId: '9F8', count: '209', capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 5,
      sound: '',
      infoText: (data, _matches, output) => {
        const [name1, name2] = data.alignmentTargets.sort();
        if (data.options.AutumnStyle)
          return output.target({
            player1: data.party.jobAbbr(name1),
            player2: data.party.jobAbbr(name2),
            target: data.prsAlignMt ? output.targetDps() : output.targetTh(),
          });
        return output.text({
          player1: data.party.member(name1),
          player2: data.party.member(name2),
        });
      },
      tts: (data, _matches, _output) => {
        if (data.role === 'tank' && data.prsAlignMt)
          return 'タンクが調整役';
      },
      run: (data) => data.alignmentTargets = [],
      outputStrings: {
        text: {
          en: 'Alignment on ${player1}, ${player2}',
          de: 'Anpassung auf ${player1}, ${player2}',
          fr: 'Alignement sur ${player1}, ${player2}',
          ja: '記述：${player1}, ${player2}',
          cn: '记述点 ${player1}, ${player2}',
          ko: '동글: ${player1}, ${player2}',
        },
        target: {
          en: 'Alignment on ${player1}, ${player2} (${target})',
          ja: '紫丸：${player1}, ${player2} (${target})',
          ko: '동글: ${player1}, ${player2} (${target})',
        },
        targetTh: {
          en: 'T&H => D1 Adjust',
          ja: 'TH',
          ko: '탱힐 → D1 조정',
        },
        targetDps: {
          en: 'DPS => MT Adjust',
          ja: 'DPS',
          ko: 'DPS → MT 조정',
        },
      },
    },
    {
      id: 'P8S Natural Alignment First',
      type: 'GainsEffect',
      // This is a magic effectId with a statusloopvfx count, like 808 elsewhere.
      netRegex: { effectId: '9F8' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ice: {
            en: 'Ice Groups First',
            de: 'Eis Gruppen zuerst',
            fr: 'Groupe Glace en 1er',
            ja: '氷の頭割りから',
            cn: '先冰分摊',
            ko: '먼저 얼음!! 3:3으로 뭉쳐욧',
          },
          fire: {
            en: 'Fire Partners First',
            de: 'Feuer Partner zuerst',
            fr: 'Partenaires de feu en 1er',
            ja: '火の2人頭割りから',
            cn: '先火分摊',
            ko: '먼저 불!! 둘씩 뭉쳐욧',
          },
          stack: {
            en: 'Stack First',
            de: 'Zuerst sammeln',
            fr: 'Package en 1er',
            ja: '頭割りから',
            cn: '先分摊',
            ko: '먼저 뭉쳐욧',
          },
          spread: {
            en: 'Spread First',
            de: 'Zuerst verteilen',
            fr: 'Écartement en 1er',
            ja: '散会から',
            cn: '先散开',
            ko: '먼저 흩어져욧',
          },
          baitAndStack: {
            en: 'Bait => Stack',
            de: 'Ködern => Sammeln',
            fr: 'Déposez -> Package',
            ja: '誘導 => 頭割り',
            cn: '诱导 => 分摊',
            ko: '가운데 모여 깔고 🔜 다시 뭉쳐욧',
          },
          baitAndSpread: {
            en: 'Bait => Spread',
            de: 'Ködern => Verteilen',
            fr: 'Déposez -> Écartez-vous',
            ja: '誘導 => 散会',
            cn: '诱导 => 分散',
            ko: '가운데 모여 깔고 🔜 흩어져욧',
          },
          adjIce: {
            en: 'Ice Groups First!! (${adj})',
            ja: '氷の頭割りから (${adj})',
            ko: '먼저 얼음!! 3:3으로 뭉쳐욧 (${adj})',
          },
          adjMt: prsStrings.adjMt,
          adjD1: prsStrings.adjD1,
        };
        const isReversed = data.inverseMagics[matches.target] === true;
        const id = matches.count;
        // Huge credit to Aya for this.  Also note `209` is the purple swirl.
        const ids = {
          fireThenIce: '1DC',
          iceThenFire: '1DE',
          stackThenSpread: '1E0',
          spreadThenStack: '1E2',
        };
        // The first time through, use the "bait" version to avoid people running off
        // as soon as they hear the beepy boops.
        if (!data.seenFirstAlignmentStackSpread) {
          // The first one can't be reversed.
          // Store the follow-up ability so it can be used with the left/right Ashing Blaze.
          if (id === ids.stackThenSpread) {
            data.firstAlignmentSecondAbility = 'spread';
            return { alertText: output.baitAndStack() };
          }
          if (id === ids.spreadThenStack) {
            data.firstAlignmentSecondAbility = 'stack';
            return { alertText: output.baitAndSpread() };
          }
        }
        const key = isReversed ? 'alarmText' : 'alertText';
        if (!isReversed && id === ids.fireThenIce || isReversed && id === ids.iceThenFire)
          return { [key]: output.fire() };
        if (!isReversed && id === ids.iceThenFire || isReversed && id === ids.fireThenIce) {
          if (!data.options.AutumnStyle)
            return { [key]: output.ice() };
          const adj = data.prsAlignMt ? output.adjMt() : output.adjD1();
          return { [key]: output.adjIce({ adj: adj }) };
        }
        if (!isReversed && id === ids.spreadThenStack || isReversed && id === ids.stackThenSpread)
          return { [key]: output.spread() };
        if (!isReversed && id === ids.stackThenSpread || isReversed && id === ids.spreadThenStack)
          return { [key]: output.stack() };
      },
    },
    {
      id: 'P8S Natural Alignment Second',
      type: 'Ability',
      netRegex: { id: ['79C0', '79BF', '79BD', '79BE'], source: 'Hephaistos' },
      suppressSeconds: 8,
      alertText: (data, matches, output) => {
        // Due to the way suppress works, put this check here and not in the condition field.
        // This callout will get merged with the left/right which happens at the same time.
        if (!data.seenFirstAlignmentStackSpread)
          return;
        const id = matches.id;
        const ids = {
          spread: '79C0',
          stack: '79BF',
          fire: '79BD',
          ice: '79BE',
        };
        // TODO: Should the left/right call (or some future "front row"/"2nd row") call be combined
        // with the followup here?
        if (id === ids.spread)
          return output.stack();
        if (id === ids.stack)
          return output.spread();
        if (id === ids.ice)
          return output.fire();
        if (id === ids.fire) {
          if (!data.options.AutumnStyle)
            return output.ice();
          return output.adjIce({ adj: data.prsAlignMt ? output.adjMt() : output.adjD1() });
        }
      },
      run: (data) => data.seenFirstAlignmentStackSpread = true,
      outputStrings: {
        stack: Outputs.stackMarker,
        spread: Outputs.spread,
        ice: {
          en: 'Ice Groups',
          de: 'Eis Gruppen',
          fr: 'Groupe de glace',
          ja: '氷の頭割り',
          cn: '冰分摊',
          ko: '얼음!! 3:3으로 뭉쳐욧',
        },
        fire: {
          en: 'Fire Partners',
          de: 'Feuer Partner',
          fr: 'Partenaires de feu',
          ja: '火の2人頭割り',
          cn: '火分摊',
          ko: '불!! 둘씩 뭉쳐욧',
        },
        adjIce: {
          en: 'Ice Groups (${adj})',
          ja: '氷の頭割り (${adj})',
          ko: '얼음!! 3:3으로 뭉쳐욧 (${adj})',
        },
        adjMt: prsStrings.adjMt,
        adjD1: prsStrings.adjD1,
      },
    },
    {
      id: 'P8S Illusory Hephaistos End of Days',
      type: 'StartsUsing',
      netRegex: { id: '7A8B' },
      infoText: (_data, matches, output) => {
        // Illusory Hephaistos are at x=(80 or 120), y=(85 or 95 or 105 or 115).
        // Either the first or second row is always free.
        const y = parseFloat(matches.y);
        const epsilon = 2;
        const row1y = 85;
        const row2y = 95;
        // TODO: combine this with the ice/fire/stack/spread calls too?
        if (Math.abs(y - row1y) < epsilon)
          return output.row2();
        if (Math.abs(y - row2y) < epsilon)
          return output.row1();
      },
      outputStrings: {
        row1: {
          en: 'Front Row',
          de: 'Vordere Reihe',
          fr: 'Première rangée',
          ja: '1列目',
          cn: '第 1 行',
          ko: '첫째 줄로!!!',
        },
        row2: {
          en: 'Second Row',
          de: 'Zweite Reihe',
          fr: 'Deuxième rangée',
          ja: '2列目',
          cn: '第 2 行',
          ko: '둘째 줄로!!!',
        },
      },
    },
    {
      id: 'P8S High Concept Collect',
      // D02 = Imperfection: Alpha
      // D03 = Imperfection: Beta
      // D04 = Imperfection: Gamma
      // D05 = Perfection: Alpha
      // D06 = Perfection: Beta
      // D07 = Perfection: Gamma
      // D08 = Inconceivable (temporary after merging)
      // D09 = Winged Conception (alpha + beta)
      // D0A = Aquatic Conception (alpha + gamma)
      // D0B = Shocking Conception (beta + gamma)
      // D0C = Fiery Conception (ifrits, alpha + alpha)
      // D0D = Toxic Conception (snake, beta + beta)
      // D0E = Growing Conception (tree together, gamma + gamma)
      // D0F = Immortal Spark (feather)
      // D10 = Immortal Conception (phoenix)
      // D11 = Solosplice
      // D12 = Multisplice
      // D13 = Supersplice
      type: 'GainsEffect',
      // Ignore D08 in the regex here.
      netRegex: { effectId: ['D0[2-79A-F]', 'D1[0-3]'] },
      run: (data, matches) => {
        const id = matches.effectId;
        // 8 and 26s second debuffs.
        const isLong = parseFloat(matches.duration) > 10;
        if (id === 'D02')
          data.concept[matches.target] = isLong ? 'longalpha' : 'shortalpha';
        else if (id === 'D03')
          data.concept[matches.target] = isLong ? 'longbeta' : 'shortbeta';
        else if (id === 'D04')
          data.concept[matches.target] = isLong ? 'longgamma' : 'shortgamma';
        else if (id === 'D05')
          data.concept[matches.target] = 'alpha';
        else if (id === 'D06')
          data.concept[matches.target] = 'beta';
        else if (id === 'D07')
          data.concept[matches.target] = 'gamma';
        else if (id === 'D11')
          data.splicer[matches.target] = 'solosplice';
        else if (id === 'D12' && data.prsHighConcept === 1)
          data.splicer[matches.target] = 'multisplice1st';
        else if (id === 'D12' && data.prsHighConcept !== 1)
          data.splicer[matches.target] = 'multisplice2nd';
        else if (id === 'D13')
          data.splicer[matches.target] = 'supersplice';
        else
          data.concept[matches.target] = 'primal';
      },
    },
    {
      id: 'P8S High Concept Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: ['D0[2-4]', 'D1[1-3]'], capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          noDebuff: {
            en: 'No Debuff',
            de: 'Kein Debuff',
            fr: 'Aucun debuff',
            ja: '無職',
            cn: '无buff',
            ko: '무직🡹',
          },
          noDebuffSplicer: {
            en: 'No Debuff + ${splicer}',
            ja: '無職 + ${splicer}',
            ko: '무직 + ${splicer}',
          },
          shortAlpha: {
            en: 'Short Alpha',
            de: 'kurzes Alpha',
            fr: 'Alpha court',
            ja: '早アルファ',
            cn: '短阿尔法',
            ko: '빠른 알파🡹',
          },
          longAlpha: {
            en: 'Long Alpha',
            de: 'langes Alpha',
            fr: 'Alpha long',
            ja: '遅アルファ',
            cn: '长阿尔法',
            ko: '느린 알파🡹',
          },
          longAlphaSplicer: {
            en: 'Long Alpha + ${splicer}',
            de: 'langes Alpha + ${splicer}',
            fr: 'Alpha long + ${splicer}',
            ja: '遅アルファ + ${splicer}',
            cn: '长阿尔法+ ${splicer}',
            ko: '느린 알파🡹 + ${splicer}',
          },
          shortBeta: {
            en: 'Short Beta',
            de: 'kurzes Beta',
            fr: 'Beta court',
            ja: '早ベータ',
            cn: '短贝塔',
            ko: '빠른 베타🡺',
          },
          longBeta: {
            en: 'Long Beta',
            de: 'langes Beta',
            fr: 'Beta long',
            ja: '遅ベータ',
            cn: '长贝塔',
            ko: '느린 베타🡺',
          },
          longBetaSplicer: {
            en: 'Long Beta + ${splicer}',
            de: 'langes Beta + ${splicer}',
            fr: 'Beta long + ${splicer}',
            ja: '遅ベータ + ${splicer}',
            cn: '长贝塔+ ${splicer}',
            ko: '느린 베타🡺 + ${splicer}',
          },
          shortGamma: {
            en: 'Short Gamma',
            de: 'kurzes Gamma',
            fr: 'Gamma court',
            ja: '早ガンマ',
            cn: '短伽马',
            ko: '빠른 감마🡻',
          },
          longGamma: {
            en: 'Long Gamma',
            de: 'langes Gamma',
            fr: 'Gamma long',
            ja: '遅ガンマ',
            cn: '长伽马',
            ko: '느린 감마🡻',
          },
          longGammaSplicer: {
            en: 'Long Gamma + ${splicer}',
            de: 'langes Gamma + ${splicer}',
            fr: 'Gamma long + ${splicer}',
            ja: '遅ガンマ + ${splicer}',
            cn: '长伽马 + ${splicer}',
            ko: '느린 감마🡻 + ${splicer}',
          },
          soloSplice: {
            en: 'Solo Stack',
            de: 'Einzelnes Sammeln',
            fr: 'Package solo',
            ja: '1人受け',
            cn: '单人分摊',
            ko: '홀로 처리(위로)',
          },
          multiSplice1st: {
            en: 'Two Stack',
            de: 'Zwei sammeln',
            fr: 'Package à 2',
            ja: '2人頭割り',
            cn: '双人分摊',
            ko: '둘이 뭉쳐욧(위로)',
          },
          superSplice: {
            en: 'Three Stack',
            de: 'Drei sammeln',
            fr: 'Package à 3',
            ja: '3人頭割り',
            cn: '三人分摊',
            ko: '셋이 뭉쳐욧(아래로)',
          },
          multiSplice2nd: {
            en: 'Two Stack',
            de: 'Zwei sammeln',
            fr: 'Package à 2',
            ja: '2人頭割り',
            cn: '双人分摊',
            ko: '둘이 뭉쳐욧(아래로)',
          },
        };
        // General thought here: alarm => EXPLOSION GO, alert/info => go to safe corner
        const concept = data.concept[data.me];
        const splicer = data.splicer[data.me];
        data.prsMyConcept = concept;
        const singleConceptMap = {
          shortalpha: output.shortAlpha(),
          longalpha: output.longAlpha(),
          shortbeta: output.shortBeta(),
          longbeta: output.longBeta(),
          shortgamma: output.shortGamma(),
          longgamma: output.longGamma(),
        };
        if (splicer === undefined) {
          if (concept === undefined)
            return { alarmText: output.noDebuff() };
          const isShort = concept === 'shortalpha' ||
            concept === 'shortbeta' ||
            concept === 'shortgamma';
          const conceptStr = singleConceptMap[concept];
          if (isShort)
            return { alarmText: conceptStr };
          return { alertText: conceptStr };
        }
        const splicerMap = {
          solosplice: output.soloSplice(),
          multisplice1st: output.multiSplice1st(),
          supersplice: output.superSplice(),
          multisplice2nd: output.multiSplice2nd(),
        };
        const splicerStr = splicerMap[splicer];
        if (concept === undefined)
          return { alarmText: output.noDebuffSplicer({ splicer: splicerStr }) };
        else if (concept === 'longalpha')
          return { alertText: output.longAlphaSplicer({ splicer: splicerStr }) };
        else if (concept === 'longbeta')
          return { alertText: output.longBetaSplicer({ splicer: splicerStr }) };
        else if (concept === 'longgamma')
          return { alertText: output.longGammaSplicer({ splicer: splicerStr }) };
        // If we get here then we have a short concept with a splicer which shouldn't be possible,
        // but at least return *something* just in case.
        return { alarmText: singleConceptMap[concept] };
      },
    },
    {
      // 원래 퍼펙트가 바뀌기 전에 이걸로 통합
      // 아니 결국 퍼펙트는 그냥 그대로 가네. 임시 꼬리 뺌
      id: 'P8S PR 퍼펙트 알파/베타/감마',
      type: 'GainsEffect',
      netRegex: { effectId: ['D05', 'D06', 'D07'] },
      condition: Conditions.targetIsYou(),
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          mesg: {
            en: '${where} [${color}]',
            ja: '${where}で合成 [${color}]',
            ko: '${where}에서 조합 [${color}]',
          },
          greenBlue: {
            en: 'Green🟢/Blue🔵',
            ja: '緑🟢・青🔵',
            ko: '초록🟢/파랑🔵',
          },
          greenPuple: {
            en: 'Green🟢/Purple🟣',
            ja: '緑🟢・紫🟣',
            ko: '초록🟢/보라🟣',
          },
          pupleBlue: {
            en: 'Purple🟣/Blue🔵',
            ja: '紫🟣・青🔵',
            ko: '보라🟣/파랑🔵',
          },
          baeksu2nd: {
            en: 'Ifrit => with Green',
            ja: 'イフリート合成 => 後で緑と合成 ',
            ko: '이프리트 조합 🔜 나중에 녹색이랑 부비부비',
          },
          north: Outputs.north,
          south: Outputs.south,
          unknown: Outputs.unknown,
        };
        const idToColor = {
          'D05': output.greenBlue(),
          'D06': output.greenPuple(),
          'D07': output.pupleBlue(),
        };
        // 첫번째: 느림-북쪽, 빨리/무직-남쪽
        const conTo1stMap = {
          shortalpha: output.south(),
          longalpha: output.north(),
          shortbeta: output.south(),
          longbeta: output.north(),
          shortgamma: output.south(),
          longgamma: output.north(),
        };
        // 두번째: 느림-북쪽, 빨리/느림감마-남쪽, 무직-둘이서이프
        const conTo2ndMap = {
          shortalpha: output.south(),
          longalpha: output.north(),
          shortbeta: output.south(),
          longbeta: output.north(),
          shortgamma: output.south(),
          longgamma: output.south(),
        };
        const stage = data.prsHighConcept;
        const mycon = data.prsMyConcept;
        const color = idToColor[matches.effectId];
        if (mycon === undefined) {
          if (stage === 1)
            return { infoText: output.mesg({ where: output.south(), color: color }) };
          return { alertText: output.baeksu2nd() };
        }
        const where = stage === 1 ? conTo1stMap[mycon] : conTo2ndMap[mycon];
        return { infoText: output.mesg({ where: where, color: color }) };
      },
    },
    {
      id: 'P8S Arcane Channel Collect',
      type: 'MapEffect',
      netRegex: { flags: arcaneChannelFlags },
      // Flags exist in phase 1, only execute trigger if phase 2
      condition: (data) => data.seenFirstTankAutos,
      run: (data, matches) => {
        const colorInt = parseInt(matches.location, 16);
        if (colorInt >= 0x1A && colorInt <= 0x23)
          data.arcaneChannelColor.add('purple');
        if (colorInt >= 0x24 && colorInt <= 0x2D)
          data.arcaneChannelColor.add('blue');
        if (colorInt >= 0x2E && colorInt <= 0x37)
          data.arcaneChannelColor.add('green');
      },
    },
    {
      id: 'P8S Arcane Channel Color',
      type: 'MapEffect',
      netRegex: { flags: arcaneChannelFlags, capture: false },
      condition: (data) => data.arcaneChannelColor.size > 0,
      delaySeconds: 0.1,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          colorTowerMergePlayer: {
            en: '${color} Tower (with ${player})',
            de: '${color} Turm (mit ${player})',
            fr: 'Tour ${color} (avec ${player})',
            ja: '${color}塔 (+${player})',
            cn: '${color} 塔 (与 ${player})',
            ko: '${color} 타워로 (+${player})',
          },
          colorTowerMergeLetter: {
            en: '${color} Tower (with ${letter})',
            de: '${color} Turm (mit ${letter})',
            fr: 'Tour ${color} (avec ${letter})',
            ja: '${color}塔 (+${letter})',
            cn: '${color} 塔 (与 ${letter})',
            ko: '${color} 타워로 (✨${letter})',
          },
          colorTowerMergePlayers: {
            en: '${color} Tower (with ${player1} or ${player2})',
            de: '${color} Turm (mit ${player1} oder ${player2})',
            fr: 'Tour ${color} (avec ${player1} ou ${player2})',
            ja: '${color}塔 (+${player1}/${player2})',
            cn: '${color} 塔 (与 ${player1} 或 ${player2})',
            ko: '${color} 타워로 (+${player1}/${player2})',
          },
          towerMergeLetters: {
            en: 'Tower (with ${letter1} or ${letter2})',
            de: 'Turm (mit ${letter1} oder ${letter2})',
            fr: 'Tour (avec ${letter1} ou ${letter2})',
            ja: '塔 (+${letter1}/${letter2})',
            cn: '塔 (与 ${letter1} 或 ${letter2})',
            ko: '타워로 (✨${letter1}/${letter2})',
          },
          towerMergePlayers: {
            en: 'Tower (with ${player1} or ${player2})',
            de: 'Turm (mit ${player1} oder ${player2})',
            fr: 'Tour (avec ${player1} ou ${player2})',
            ja: '塔 (+${player1}/${player2})',
            cn: '塔 (与 ${player1} 或 ${player2})',
            ko: '타워로 (+${player1}/${player2})',
          },
          colorTowerAvoid: {
            en: 'Avoid ${color} Towers',
            de: 'Vermeide ${color} Turm',
            fr: 'Évitez les tours ${color}',
            ja: '組合せずに逃げて: ${color}',
            cn: '避开 ${color} 塔',
            ko: '조합하지 말고 피해요: ${color}',
          },
          cloneTether: {
            en: 'Get clone tether',
            de: 'Nimm Klon Verbindung',
            fr: 'Prenez les liens des clones',
            ja: '線を付けて散開位置へ',
            cn: '拉线',
            ko: '선 달고 도망가요!',
          },
          alpha: {
            en: 'Alpha',
            de: 'Alpha',
            fr: 'Alpha',
            ja: 'アルファ',
            cn: '阿尔法',
            ko: '알파🡹',
          },
          beta: {
            en: 'Beta',
            de: 'Beta',
            fr: 'Beta',
            ja: 'ベータ',
            cn: '贝塔',
            ko: '베타🡺',
          },
          gamma: {
            en: 'Gamma',
            de: 'Gamma',
            fr: 'Gamma',
            ja: 'ガンマ',
            cn: '伽马',
            ko: '감마🡻',
          },
          purple: {
            en: 'Purple',
            de: 'Lila',
            fr: 'Violet',
            ja: '紫',
            cn: '紫',
            ko: '보라🟣',
          },
          blue: {
            en: 'Blue',
            de: 'Blau',
            fr: 'Bleu',
            ja: '青',
            cn: '蓝',
            ko: '파랑🔵',
          },
          green: {
            en: 'Green',
            de: 'Grün',
            fr: 'Vert',
            ja: '緑',
            cn: '绿',
            ko: '초록🟢',
          },
        };
        const towerColors = Array.from(data.arcaneChannelColor.keys());
        const [tower1, tower2] = towerColors;
        if (tower1 === undefined)
          return;
        const myConcept = data.concept[data.me];
        if (myConcept !== 'alpha' && myConcept !== 'beta' && myConcept !== 'gamma') {
          // Long debuffs, splicers, and primals avoid towers
          if (data.arcaneChannelCount !== 3)
            return { infoText: output.colorTowerAvoid({ color: output[tower1]() }) };
          // Primals on HC2 Second Towers get clones
          if (tower2 !== undefined && myConcept === 'primal')
            return { alertText: output.cloneTether() };
          // Likely not solveable anymore.
          return;
        }
        const towerToConcept = {
          'green': ['alpha', 'beta'],
          'blue': ['alpha', 'gamma'],
          'purple': ['beta', 'gamma'],
        };
        const conceptToPlayers = {
          'alpha': [],
          'beta': [],
          'gamma': [],
        };
        for (const [name, concept] of Object.entries(data.concept)) {
          if (concept === 'alpha' || concept === 'beta' || concept === 'gamma')
            conceptToPlayers[concept].push(name);
        }
        // HC1 (both parts), HC2 (initial tower)
        if (tower2 === undefined) {
          const color = output[tower1]();
          const concepts = towerToConcept[tower1];
          // Unused concept avoids tower
          if (!concepts.includes(myConcept))
            return { infoText: output.colorTowerAvoid({ color: color }) };
          const [otherConcept] = [...concepts].filter((x) => x !== myConcept);
          if (otherConcept === undefined)
            throw new UnreachableCode();
          const [name1, name2] = conceptToPlayers[otherConcept].map((x) => data.party.member(x));
          if (name1 === undefined)
            return {
              alertText: output.colorTowerMergeLetter({
                color: color,
                letter: output[otherConcept](),
              }),
            };
          if (name2 === undefined)
            return { alertText: output.colorTowerMergePlayer({ color: color, player: name1 }) };
          return {
            alertText: output.colorTowerMergePlayers({
              color: color,
              player1: name1,
              player2: name2,
            }),
          };
        }
        // HC2 (final towers), in order to solve this, you need a 2nd beta or gamma
        const [doubled, doub2] = perfectedConcepts.filter((x) => conceptToPlayers[x].length === 2);
        if (doub2 !== undefined || doubled === undefined)
          return;
        // If doubled, merge with somebody who doesn't have your debuff.
        if (myConcept === doubled) {
          const [concept1, concept2] = [...perfectedConcepts].filter((x) => x !== myConcept);
          if (concept1 === undefined || concept2 === undefined)
            throw new UnreachableCode();
          const [name1, name2] = [...conceptToPlayers[concept1], ...conceptToPlayers[concept2]].map(
            (x) => data.party.member(x),
          );
          if (name1 === undefined || name2 === undefined)
            return {
              alertText: output.towerMergeLetters({
                letter1: output[concept1](),
                letter2: output[concept2](),
              }),
            };
          return { alertText: output.towerMergePlayers({ player1: name1, player2: name2 }) };
        }
        // If not doubled, merge with one of the doubled folks (because they can't merge together).
        const [name1, name2] = conceptToPlayers[doubled].map((x) => data.party.member(x));
        const [tower] = towerColors.filter((x) => towerToConcept[x].includes(myConcept));
        if (tower === undefined)
          throw new UnreachableCode();
        const color = output[tower]();
        if (name1 === undefined || name2 === undefined)
          return {
            alertText: output.colorTowerMergeLetter({ color: color, letter: output[doubled]() }),
          };
        return {
          alertText: output.colorTowerMergePlayers({
            color: color,
            player1: name1,
            player2: name2,
          }),
        };
      },
      run: (data) => {
        data.arcaneChannelColor.clear();
        data.arcaneChannelCount++;
      },
    },
    {
      id: 'P8S Limitless Desolation',
      type: 'StartsUsing',
      netRegex: { id: '75ED', source: 'Hephaistos', capture: false },
      condition: (data) => !data.options.AutumnStyle,
      response: Responses.spread('alert'),
    },
    {
      id: 'P8S Tyrant\'s Fire III Counter',
      type: 'Ability',
      netRegex: { id: '75F0', source: 'Hephaistos', capture: false },
      preRun: (data) => data.burstCounter++,
      durationSeconds: 2,
      suppressSeconds: 1,
      sound: '',
      infoText: (data, _matches, output) => output.text({ num: data.burstCounter }),
      tts: null,
      outputStrings: {
        text: {
          en: '${num}',
          de: '${num}',
          fr: '${num}',
          ja: '${num}番目',
          cn: '${num}',
          ko: '${num}번',
        },
      },
    },
    {
      id: 'P8S Tyrant\'s Fire III Bait then Tower',
      type: 'Ability',
      netRegex: { id: '75F0', source: 'Hephaistos' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7.9,
      alertText: (data, _matches, output) => output.text({ num: data.burstCounter }),
      run: (data) => data.myTower = data.burstCounter,
      outputStrings: {
        text: {
          en: '${num}',
          de: '${num}',
          fr: '${num}',
          ja: '自分: ${num}番',
          cn: '${num}',
          ko: '나: ${num}번째',
        },
      },
    },
    {
      id: 'P8S Tyrant\'s Flare II Soak Tower',
      type: 'StartsUsing',
      netRegex: { id: '7A88', source: 'Hephaistos', capture: false },
      preRun: (data) => data.flareCounter++,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.flareCounter === data.myTower)
          return output.text({ num: data.myTower });
      },
      outputStrings: {
        text: {
          en: 'Soak Tower ${num}',
          de: 'Turm ${num} nehmen',
          fr: 'Prenez la tour ${num}',
          ja: '${num}番目の塔踏み',
          cn: '${num} 塔',
          ko: '${num}번째 타워에 들어가욧',
        },
      },
    },
    {
      id: 'P8S Dominion',
      type: 'StartsUsing',
      netRegex: { id: '79D9', source: 'Hephaistos', capture: false },
      response: Responses.spread('alert'),
      run: (data) => {
        data.deformationHit = [];
        data.deformationNotHit = [...data.party.partyNames];
        data.deformationOnMe = false;
        // TODO: should this be undefined and not empty string??
        data.deformationPartner = '';
      },
    },
    {
      id: 'P8S Orogenic Deformation Collect',
      type: 'Ability',
      netRegex: { id: '79DB', source: 'Hephaistos' },
      run: (data, matches) => {
        const idx = data.deformationNotHit.indexOf(matches.target);
        if (idx !== -1)
          data.deformationNotHit.splice(idx, 1);
        if (data.me === matches.target) {
          data.deformationOnMe = true;
        } else {
          data.deformationHit.push(matches.target);
        }
      },
    },
    {
      id: 'P8S Orogenic Deformation Hit',
      type: 'Ability',
      netRegex: { id: '79DB', source: 'Hephaistos' },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: 0.5,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        const myRole = data.party.isDPS(data.me) ? 'dps' : 'support';
        let partnerCount = 0;
        for (const p of data.deformationHit) {
          const pRole = data.party.isDPS(p) ? 'dps' : 'support';
          if (pRole === myRole) {
            partnerCount++;
            data.deformationPartner = p;
          }
        }
        if (data.deformationHit.length === 3 && partnerCount !== 1) {
          // non-standard party comp with multiple possible role partners - show all hit
          return output.multiple({
            player1: data.party.member(data.deformationHit[0]),
            player2: data.party.member(data.deformationHit[1]),
            player3: data.party.member(data.deformationHit[2]),
          });
        } else if (partnerCount === 1) {
          return output.partner({ player: data.deformationPartner });
        }
        return output.unknown();
      },
      outputStrings: {
        multiple: {
          en: 'Second Towers (w/ ${player1}, ${player2}, ${player3})',
          de: 'Zweite Türme (+ ${player1}, ${player2}, ${player3})',
          fr: 'Secondes tours (+ ${player1}, ${player2}, ${player3})',
          ja: '2番目で入る (${player1}, ${player2}, ${player3})',
          cn: '第二轮塔 (+ ${player1}, ${player2}, ${player3})',
          ko: '나중 타워 (${player1}, ${player2}, ${player3})',
        },
        partner: {
          en: 'Second Towers (with ${player})',
          de: 'Zweite Türme (mit ${player})',
          fr: 'Secondes tours (avec ${player})',
          ja: '2番目で入る (+${player})',
          cn: '第二轮塔 (与 ${player})',
          ko: '나중 타워 (+${player})',
        },
        unknown: {
          en: 'Second Towers',
          de: 'Zweite Türme',
          fr: 'Secondes tours',
          ja: '2番目で入る',
          cn: '第二轮塔',
          ko: '나중 타워 밟아요',
        },
      },
    },
    {
      id: 'P8S Orogenic Deformation Not Hit',
      type: 'Ability',
      netRegex: { id: '79DB', source: 'Hephaistos', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (!data.deformationOnMe) {
          const idx = data.deformationNotHit.indexOf(data.me);
          if (idx !== -1)
            data.deformationNotHit.splice(idx, 1);
          const myRole = data.party.isDPS(data.me) ? 'dps' : 'support';
          let partnerCount = 0;
          for (const p of data.deformationNotHit) {
            const pRole = data.party.isDPS(p) ? 'dps' : 'support';
            if (pRole === myRole) {
              partnerCount++;
              data.deformationPartner = p;
            }
          }
          if (data.deformationNotHit.length === 3 && partnerCount !== 1) {
            // non-standard party comp with multiple possible role partners - show all not hit
            return output.multiple({
              player1: data.party.member(data.deformationNotHit[0]),
              player2: data.party.member(data.deformationNotHit[1]),
              player3: data.party.member(data.deformationNotHit[2]),
            });
          } else if (partnerCount === 1) {
            return output.partner({ player: data.party.member(data.deformationPartner) });
          }
          return output.unknown();
        }
      },
      outputStrings: {
        multiple: {
          en: 'First Towers (w/ ${player1}, ${player2}, ${player3})',
          de: 'Erste Türme (+ ${player1}, ${player2}, ${player3})',
          fr: 'Premières tours (+ ${player1}, ${player2}, ${player3})',
          ja: '先に入る (${player1}, ${player2}, ${player3})',
          cn: '第一轮塔 (+ ${player1}, ${player2}, ${player3})',
          ko: '먼저 타워 (${player1}, ${player2}, ${player3})',
        },
        partner: {
          en: 'First Towers (with ${player})',
          de: 'Erste Türme (mit ${player})',
          fr: 'Premières tours (avec ${player})',
          ja: '先に入る (+${player})',
          cn: '第一轮塔 (与 ${player})',
          ko: '먼저 타워 (+${player})',
        },
        unknown: {
          en: 'First Towers',
          de: 'Erste Türme',
          fr: 'Premières tours',
          ja: '先に入る',
          cn: '第一轮塔',
          ko: '먼저 타워 밟아요',
        },
      },
    },
    {
      id: 'P8S Aionagonia',
      type: 'StartsUsing',
      netRegex: { id: '7A22', source: 'Hephaistos', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'big aoe + bleed',
          de: 'große AoE + Blutung',
          fr: 'Grosse AoE + Saignement',
          ja: '全体攻撃 + 出血',
          cn: '大AOE+流血',
          ko: '아픈 전체 공격 + 출혈 [어서오고]',
        },
      },
    },
    //
    {
      id: 'P8S 어듬이 내추럴 얼라인먼트',
      type: 'StartsUsing',
      netRegex: { id: '79BB', source: 'Hephaistos', capture: false },
      condition: (data) => data.options.AutumnStyle,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '[Alignment] Alignment!',
          ko: '[술식기술] 조정 걸리면 해야겠지',
        },
      },
    },
    //
    {
      id: 'P8S 어듬이 하이 컨셉',
      type: 'StartsUsing',
      netRegex: { id: '79AC', source: 'Hephaistos', capture: false },
      condition: (data) => data.options.AutumnStyle,
      // delaySeconds: 4,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '[High concept] Look for αβγ',
          ko: '[개념지배] αβγ 잘 봐야겠지',
        },
      },
    },
    //
    {
      id: 'P8S 어듬이 리미틀레스 디솔레이션',
      type: 'StartsUsing',
      netRegex: { id: '75ED', source: 'Hephaistos', capture: false },
      condition: (data) => data.options.AutumnStyle,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: '[Desolation] Spread',
          ko: '[만상회신] 자기 자리로 찾아가야겠지',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Conceptual Octaflare/Conceptual Tetraflare': 'Conceptual Octa/Tetraflare',
        'Emergent Octaflare/Emergent Tetraflare': 'Emergent Octa/Tetraflare',
        'Tetraflare/Octaflare': 'Tetra/Octaflare',
        'Scorching Fang/Scorched Pinion': 'Fang/Pinion',
        'Scorching Fang/Sun\'s Pinion': 'Fang/Pinion',
        'Tetraflare/Nest of Flamevipers': 'Tetraflare/Flamevipers',
        'Quadrupedal Impact/Quadrupedal Crush': 'Quadrupedal Impact/Crush',
        'Quadrupedal Crush/Quadrupedal Impact': 'Quadrupedal Crush/Impact',
        'Emergent Diflare/Emergent Tetraflare': 'Emergent Di/Tetraflare',
        'Forcible Trifire/Forcible Difreeze': 'Forcible Trifire/Difreeze',
        'Forcible Difreeze/Forcible Trifire': 'Forcible Difreeze/Trifire',
        'Forcible Fire III/Forcible Fire II': 'Forcible Fire III/II',
        'Forcible Fire II/Forcible Fire III': 'Forcible Fire II/III',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        '(?<!Illusory )Hephaistos': 'Hephaistos',
        'Gorgon': 'Gorgone',
        'Illusory Hephaistos': 'Hephaistos-Phantom',
        'Suneater': 'Schlund des Phoinix',
      },
      'replaceText': {
        'line': 'Linie',
        '--auto--': '--auto--',
        'Abyssal Fires': 'Feuersturm',
        'Aionagonia': 'Eiserne Agonie',
        'Aioniopyr': 'Aioniopyr',
        'Arcane Channel': 'Zirkelimpuls',
        'Arcane Control': 'Beleben des Kreises',
        'Ashing Blaze': 'Aschelodern',
        'Blazing Footfalls': 'Fackelnde Füße',
        'Blood of the Gorgon': 'Gorgons Schlangengift',
        'Breath of the Gorgon': 'Gorgons Übelgift',
        'Burst': 'Explosion',
        'Conceptual Diflare': 'Konzeptionelle Diflare',
        'Conceptual Octaflare': 'Konzeptionelle Oktaflare',
        'Conceptual Shift': 'Konzeptänderung',
        'Conceptual Tetraflare': 'Konzeptionelle Tetraflare',
        'Creation on Command': 'Schöpfungsauftrag',
        'Crown of the Gorgon': 'Gorgons Steinlicht',
        'Cthonic Vent': 'Lodernde Schlange',
        'Deconceptualize': 'Konzepttilgung',
        'Dominion': 'Schlag des Herrschers',
        'Ego Death': 'Egotod',
        'Ektothermos': 'Ektothermos',
        'Emergent Diflare': 'Steigende Diflare',
        'Emergent Octaflare': 'Steigende Oktaflare',
        'Emergent Tetraflare': 'Steigende Tetraflare',
        'End of Days': 'Ende aller Tage',
        'Everburn': 'Phoinix-Erschaffung',
        'Eye of the Gorgon': 'Gorgons Steinauge',
        '(?<!Nest of )Flameviper': 'Flammenviper',
        'Footprint': 'Fußschock',
        'Forcible Difreeze': 'Erzwungenes Di-Einfrieren',
        'Forcible Fire II(?!I)': 'Erzwungenes Feura',
        'Forcible Fire III': 'Erzwungenes Feuga',
        'Forcible Trifire': 'Erzwungenes Trifeuer',
        'Fourfold Fires': 'Vierfacher Feuersturm',
        'Genesis of Flame': 'Flammende Genesis',
        'Gorgomanteia': 'Gorgons Fluch',
        'Gorgospit': 'Gorgons Speichel',
        'Hemitheos\'s Flare': 'Hemitheos-Flare',
        'High Concept': 'Konzeptkontrolle',
        'Illusory Creation': 'Illusionsschatten',
        'Into the Shadows': 'In die Schatten',
        'Inverse Magicks': 'Magische Umkehr',
        'Limitless Desolation': 'Kosmische Verkohlung',
        'Manifold Flames': 'Mannigfaltige Flammen',
        'Natural Alignment': 'Rituelle Anpassung',
        'Nest of Flamevipers': 'Ausbreitende Viper',
        '(?<! )Octaflare': 'Oktaflare',
        'Orogenic Deformation': 'Gewaltige Bodenhebung',
        'Orogenic Shift': 'Bodenhebung',
        'Petrifaction': 'Versteinerung',
        'Quadrupedal Crush': 'Fußmalmer',
        'Quadrupedal Impact': 'Fußstampfer',
        'Reforged Reflection': 'Mutierte Schöpfung',
        'Scorched Pinion': 'Versengte Schwinge',
        'Scorching Fang': 'Flammender Zahn',
        'Snaking Kick': 'Natterntritt',
        'Splicer': 'Konzeptreflektion',
        'Stomp Dead': 'Fataler Stampfer',
        'Sun\'s Pinion': 'Schwelende Schwinge',
        'Sunforge': 'Flammenreigen der Schöpfung',
        '(?<! )Tetraflare': 'Tetraflare',
        'Torch Flame': 'Glutfeuer',
        'Trailblaze': 'Flammender Pfad',
        'Twist Nature': 'Zwangsbeschwörung',
        'Tyrant\'s Fire III': 'Feuga des Tyrannen',
        'Tyrant\'s Flare(?! II)': 'Flare des Tyrannen',
        'Tyrant\'s Flare II': 'Flare des Tyrannen II',
        'Tyrant\'s Unholy Darkness': 'Unheiliges Dunkel des Tyrannen',
        'Uplift': 'Erhöhung',
        'Volcanic Torches': 'Vulkanfackel',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        '(?<!Illusory )Hephaistos': 'Héphaïstos',
        'Gorgon': 'Gorgone',
        'Illusory Hephaistos': 'spectre d\'Héphaïstos',
        'Suneater': 'Serpent en flammes',
      },
      'replaceText': {
        'Abyssal Fires': 'Tempête enflammée',
        'Aionagonia': 'Aion agonia',
        'Aioniopyr': 'Aion pur',
        'Arcane Channel': 'Vague arcanique',
        'Arcane Control': 'Activation arcanique',
        'Ashing Blaze': 'Enfer cendreux',
        'Blazing Footfalls': 'Pas ardents',
        'Blood of the Gorgon': 'Venin reptilien de gorgone',
        'Breath of the Gorgon': 'Poison insidieux de gorgone',
        'Burst': 'Explosion',
        'Conceptual Diflare': 'Dibrasier conceptuel',
        'Conceptual Octaflare': 'Octobrasier conceptuel',
        'Conceptual Shift': 'Bascule conceptuelle',
        'Conceptual Tetraflare': 'Tetrabrasier conceptuel',
        'Creation on Command': 'Ordre de création',
        'Crown of the Gorgon': 'Lueur pétrifiante de gorgone',
        'Cthonic Vent': 'Serpents de flammes ascendants',
        'Deconceptualize': 'Effacement conceptuel',
        'Dominion': 'Poing du maître',
        'Ego Death': 'Destruction de l\'ego',
        'Ektothermos': 'Vague d\'énergie explosive',
        'Emergent Diflare': 'Dibrasier émergent',
        'Emergent Octaflare': 'Octobrasier émergent',
        'Emergent Tetraflare': 'Tetrabrasier émergent',
        'End of Days': 'Flamme de Megiddo',
        'Everburn': 'Oiseau immortel',
        'Eye of the Gorgon': 'Œil pétrifiant de gorgone',
        '(?<!Nest of )Flameviper': 'Serpent-canon',
        'Footprint': 'Choc quadrupède',
        'Forcible Difreeze': 'Di Gel forcé',
        'Forcible Fire II(?!I)': 'Extra Feu forcé',
        'Forcible Fire III': 'Méga Feu forcé',
        'Forcible Trifire': 'Tri Feu forcé',
        'Fourfold Fires': 'Quadruple tempête enflammée',
        'Genesis of Flame': 'Flammes de la création',
        'Gorgomanteia': 'Malédiction de gorgone',
        'Gorgospit': 'Crachat de gorgone',
        'Hemitheos\'s Flare': 'Brasier d\'hémithéos',
        'High Concept': 'Manipulation conceptuelle',
        'Illusory Creation': 'Création d\'ombres',
        'Into the Shadows': 'Dans l\'ombre',
        'Inverse Magicks': 'Inversion magique',
        'Limitless Desolation': 'Cendrage universel',
        'Manifold Flames': 'Flammes orientées multiples',
        'Natural Alignment': 'Description rituelle',
        'Nest of Flamevipers': 'Vipère élancée',
        '(?<! )Octaflare': 'Octobrasier',
        'Orogenic Deformation': 'Grande surrection',
        'Orogenic Shift': 'Surrection',
        'Petrifaction': 'Pétrification',
        'Quadrupedal Crush': 'Écrasement quadrupède',
        'Quadrupedal Impact': 'Impact quadrupède',
        'Reforged Reflection': 'Mutation corporelle',
        'Scorched Pinion': 'Aile embrasante',
        'Scorching Fang': 'Crocs embrasants',
        'Snaking Kick': 'Coup de pied du serpent',
        'Splicer': 'Réaction conceptuelle',
        'Stomp Dead': 'Piétinement mortel',
        'Sun\'s Pinion': 'Ailes étincelantes',
        'Sunforge': 'Bête enflammée',
        '(?<! )Tetraflare': 'Tetrabrasier',
        'Torch Flame': 'Explosion de braises',
        'Trailblaze': 'Traînée ardente',
        'Twist Nature': 'Incantation forcée',
        'Tyrant\'s Fire III': 'Méga Feu de tyran',
        'Tyrant\'s Flare(?! II)': 'Brasier de tyran',
        'Tyrant\'s Flare II': 'Brasier de tyran II',
        'Tyrant\'s Unholy Darkness': 'Miracle ténébreux de tyran',
        'Uplift': 'Exhaussement',
        'Volcanic Torches': 'Boutefeux magiques',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        '(?<!Illusory )Hephaistos': 'ヘファイストス',
        'Gorgon': 'ゴルゴン',
        'Illusory Hephaistos': 'ヘファイストスの幻影',
        'Suneater': '炎霊蛇',
      },
      'replaceText': {
        'Abyssal Fires': '炎嵐',
        'Aionagonia': 'アイオンアゴニア',
        'Aioniopyr': 'アイオンピュール',
        'Arcane Channel': '魔陣波動',
        'Arcane Control': '魔法陣起動',
        'Ashing Blaze': 'アッシュブレイズ',
        'Blazing Footfalls': 'ブレイジングフィート',
        'Blood of the Gorgon': 'ゴルゴンの蛇毒',
        'Breath of the Gorgon': 'ゴルゴンの邪毒',
        'Burst': '爆発',
        'Conceptual Diflare': 'ディフレア・コンシーヴ',
        'Conceptual Octaflare': 'オクタフレア・コンシーヴ',
        'Conceptual Shift': '概念変異',
        'Conceptual Tetraflare': 'テトラフレア・コンシーヴ',
        'Creation on Command': '創造命令',
        'Crown of the Gorgon': 'ゴルゴンの石光',
        'Cthonic Vent': '噴炎昇蛇',
        'Deconceptualize': '概念消去',
        'Dominion': '支配者の一撃',
        'Ego Death': '自己概念崩壊',
        'Ektothermos': '爆炎波動',
        'Emergent Diflare': 'エマージ・ディフレア',
        'Emergent Octaflare': 'エマージ・オクタフレア',
        'Emergent Tetraflare': 'エマージ・テトラフレア',
        'End of Days': 'メギドフレイム',
        'Everburn': '不死鳥創造',
        'Eye of the Gorgon': 'ゴルゴンの石眼',
        '(?<!Nest of )Flameviper': '炎蛇砲',
        'Footprint': 'フィートショック',
        'Forcible Difreeze': 'フォースド・ディフリーズ',
        'Forcible Fire II(?!I)': 'フォースド・ファイラ',
        'Forcible Fire III': 'フォースド・ファイガ',
        'Forcible Trifire': 'フォースド・トリファイア',
        'Fourfold Fires': '四重炎嵐',
        'Genesis of Flame': '創世の真炎',
        'Gorgomanteia': 'ゴルゴンの呪詛',
        'Gorgospit': 'ゴルゴンスピット',
        'Hemitheos\'s Flare': 'ヘーミテオス・フレア',
        'High Concept': '概念支配',
        'Illusory Creation': '幻影創造',
        'Into the Shadows': 'イントゥシャドウ',
        'Inverse Magicks': 'マジックインヴァージョン',
        'Limitless Desolation': '万象灰燼',
        'Manifold Flames': '多重操炎',
        'Natural Alignment': '術式記述',
        'Nest of Flamevipers': 'スプレッドヴァイパー',
        '(?<! )Octaflare': 'オクタフレア',
        'Orogenic Deformation': '地盤大隆起',
        'Orogenic Shift': '地盤隆起',
        'Petrifaction': 'ペトリファクション',
        'Quadrupedal Crush': 'フィートクラッシュ',
        'Quadrupedal Impact': 'フィートインパクト',
        'Reforged Reflection': '変異創身',
        'Scorched Pinion': '炎の翼',
        'Scorching Fang': '炎の牙',
        'Snaking Kick': 'スネークキック',
        'Splicer': '概念反発',
        'Stomp Dead': 'フェイタルストンプ',
        'Sun\'s Pinion': '陽炎の翼',
        'Sunforge': '創獣炎舞',
        '(?<! )Tetraflare': 'テトラフレア',
        'Torch Flame': '熾炎',
        'Trailblaze': 'トレイルブレイズ',
        'Twist Nature': '強制詠唱',
        'Tyrant\'s Fire III': 'タイラント・ファイガ',
        'Tyrant\'s Flare(?! II)': 'タイラント・フレア',
        'Tyrant\'s Flare II': 'タイラント・フレアII',
        'Tyrant\'s Unholy Darkness': 'タイラント・ダークホーリー',
        'Uplift': '隆起',
        'Volcanic Torches': '熾炎創火',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        '(?<!Illusory )Hephaistos': '赫淮斯托斯',
        'Gorgon': '戈尔贡',
        'Illusory Hephaistos': '赫淮斯托斯的幻影',
        'Suneater': '炎灵蛇',
      },
      'replaceText': {
        'line': '直线',
        '--auto--': '--平A--',
        'Abyssal Fires': '火炎风暴',
        'Aionagonia': '永恒之苦',
        'Aioniopyr': '永恒之火',
        'Arcane Channel': '魔法阵波动',
        'Arcane Control': '魔法阵启动',
        'Ashing Blaze': '激火燃灰',
        'Blazing Footfalls': '炽热践踏',
        'Blood of the Gorgon': '戈尔贡蛇毒',
        'Breath of the Gorgon': '戈尔贡邪毒',
        'Burst': '爆炸',
        'Conceptual Diflare': '二分核爆之念',
        'Conceptual Octaflare': '八分核爆之念',
        'Conceptual Shift': '概念变异',
        'Conceptual Tetraflare': '四分核爆之念',
        'Creation on Command': '创造命令',
        'Crown of the Gorgon': '戈尔贡石光',
        'Cthonic Vent': '喷炎升蛇',
        'Deconceptualize': '概念消除',
        'Dominion': '支配者的一击',
        'Ego Death': '自我概念崩坏',
        'Ektothermos': '爆热波动',
        'Emergent Diflare': '二分核爆之现',
        'Emergent Octaflare': '八分核爆之现',
        'Emergent Tetraflare': '四分核爆之现',
        'End of Days': '米吉多烈焰',
        'Everburn': '创造不死鸟',
        'Eye of the Gorgon': '戈尔贡石眼',
        '(?<!Nest of )Flameviper': '炎蛇炮',
        'Footprint': '践踏',
        'Forcible Difreeze': '强制二分玄冰',
        'Forcible Fire II(?!I)': '强制烈炎',
        'Forcible Fire III': '强制爆炎',
        'Forcible Trifire': '强制三分火炎',
        'Fourfold Fires': '四重火炎风暴',
        'Genesis of Flame': '创世真炎',
        'Gorgomanteia': '戈尔贡的诅咒',
        'Gorgospit': '戈尔贡喷吐',
        'Hemitheos\'s Flare': '半神核爆',
        'High Concept': '概念支配',
        'Illusory Creation': '创造幻影',
        'Into the Shadows': '潜入阴影',
        'Inverse Magicks': '逆魔法',
        'Limitless Desolation': '万象灰烬',
        'Manifold Flames': '多重灼炎',
        'Natural Alignment': '术式记述',
        'Nest of Flamevipers': '炎蛇群翔',
        '(?<! )Octaflare': '八分核爆',
        'Orogenic Deformation': '地面隆踊',
        'Orogenic Shift': '地面隆起',
        'Petrifaction': '石化',
        'Quadrupedal Crush': '践踏碎击',
        'Quadrupedal Impact': '践踏冲击',
        'Reforged Reflection': '变异创身',
        'Scorched Pinion': '炎之翼',
        'Scorching Fang': '烈火牙',
        'Snaking Kick': '回旋蛇踢',
        'Splicer': '概念排斥',
        'Stomp Dead': '致命践踏',
        'Sun\'s Pinion': '炎之翼',
        'Sunforge': '创兽炎舞',
        '(?<! )Tetraflare': '四分核爆之念',
        'Torch Flame': '灼炎',
        'Trailblaze': '踏火寻迹',
        'Twist Nature': '强制咏唱',
        'Tyrant\'s Fire III': '暴君爆炎',
        'Tyrant\'s Flare(?! II)': '暴君核爆',
        'Tyrant\'s Flare II': '暴君核爆II',
        'Tyrant\'s Unholy Darkness': '暴君黑暗神圣',
        'Uplift': '隆起',
        'Volcanic Torches': '灼炎创火',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        '(?<!Illusory )Hephaistos': '헤파이스토스',
        'Gorgon': '고르곤',
        'Illusory Hephaistos': '헤파이스토스의 환영',
        'Suneater': '염령사',
      },
      'replaceText': {
        'line': '직선',
        '--auto--': '--평타--',
        'Conceptual Octaflare/Conceptual Tetraflare': '옥타플레어/테트라플레어 구상',
        'Conceptual Diflare/Conceptual Tetraflare': '디플레어/테트라플레어 구상',
        'Emergent Octaflare/Emergent Tetraflare': '옥타플레어/테트라플레어 발동',
        'Emergent Diflare/Emergent Tetraflare': '디플레어/테트라플레어 발동',
        'Tetraflare/Octaflare': '테트라/옥타플레어',
        'Scorching Fang/Scorched Pinion': '타오르는 송곳니/날개',
        'Scorching Fang/Sun\'s Pinion': '타오르는 송곳니/날개',
        'Tetraflare/Nest of Flamevipers': '테트라플레어/불뱀 살포',
        'Quadrupedal Impact/Quadrupedal Crush': '발걸음 충격/파괴',
        'Quadrupedal Crush/Quadrupedal Impact': '발걸음 파괴/충격',
        'Forcible Trifire/Forcible Difreeze': '강제 트리파이어/디프리즈',
        'Forcible Difreeze/Forcible Trifire': '강제 디프리즈/트리파이어',
        'Forcible Fire III/Forcible Fire II': '강제 파이가/파이라',
        'Forcible Fire II/Forcible Fire III': '강제 파이라/파이가',
        'Abyssal Fires': '화염 폭풍',
        'Aionagonia': '영원한 고통',
        'Aioniopyr': '영원한 불꽃',
        'Arcane Channel': '마법진 파동',
        'Arcane Control': '마법진 기동',
        'Ashing Blaze': '재의 불길',
        'Blazing Footfalls': '맹렬한 발걸음',
        'Blood of the Gorgon': '고르곤의 뱀독',
        'Breath of the Gorgon': '고르곤의 맹독',
        'Burst': '폭발',
        'Conceptual Shift': '개념 변이',
        'Creation on Command': '창조 명령',
        'Crown of the Gorgon': '고르곤의 빛',
        'Cthonic Vent': '불뱀 승천',
        'Deconceptualize': '개념 소거',
        'Dominion': '도미니온',
        'Ego Death': '자기 개념 붕괴',
        'Ektothermos': '폭염 파동',
        'End of Days': '메기도 플레임',
        'Everburn': '불사조 창조',
        'Eye of the Gorgon': '고르곤의 눈',
        '(?<!Nest of )Flameviper': '불뱀 진격',
        'Footprint': '발도장',
        'Fourfold Fires': '4중 화염 폭풍',
        'Genesis of Flame': '창세의 불꽃',
        'Gorgomanteia': '고르곤의 저주',
        'Gorgospit': '고르곤의 침',
        'Hemitheos\'s Flare': '헤미테오스 플레어',
        'High Concept': '개념 지배',
        'Illusory Creation': '환영 창조',
        'Into the Shadows': '그림자 속으로',
        'Inverse Magicks': '마법 역행',
        'Limitless Desolation': '만상의 잿더미',
        'Manifold Flames': '다중 화염 조작',
        'Natural Alignment': '술식 기술',
        '(?<!/)Nest of Flamevipers': '불뱀 살포',
        'Orogenic Deformation': '지반 대융기',
        'Orogenic Shift': '지반 융기',
        'Petrifaction': '석화',
        'Reforged Reflection': '신체 변이',
        '(?<!/)Scorched Pinion': '타오르는 날개',
        'Scorching Fang(?!/)': '타오르는 송곳니',
        'Snaking Kick': '뱀꼬리 공격',
        'Splicer': '개념 반발',
        'Stomp Dead': '치명적인 내려찍기',
        '(?<!/)Sun\'s Pinion': '타오르는 날개',
        'Sunforge': '창조물의 불꽃춤',
        'Torch Flame': '단불',
        'Trailblaze': '불꽃 발자국',
        'Twist Nature': '강제 시전',
        'Tyrant\'s Fire III': '폭군의 파이가',
        'Tyrant\'s Flare(?! II)': '폭군의 플레어',
        'Tyrant\'s Flare II': '폭군의 플레어 2',
        'Tyrant\'s Unholy Darkness': '폭군의 다크 홀리',
        'Uplift': '융기',
        'Volcanic Torches': '단불 창조',
      },
    },
  ],
});
