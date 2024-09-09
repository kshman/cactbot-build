const executionIdToSafeMap = {
  '9636': 'out',
  '9637': 'in',
  '9638': 'cardinals',
};
const executionOutputStrings = {
  out: Outputs.out,
  in: Outputs.in,
  cardinals: Outputs.cardinals,
  next: Outputs.next,
};
const forecastNpcYellMap = {
  '425E': ['under', 'out', 'intercards'],
  '425F': ['out', 'behind', 'under'],
  '4260': ['intercards', 'out', 'behind'],
  '4261': ['behind', 'under', 'out'], // "Reacquiring data... A howling tempest will stoke raging wildfires, followed by an almighty thunderstorm!"
};
const forecastNpcYellIds = Object.keys(forecastNpcYellMap);
const climateChangeNpcYellMap = {
  // id: { replacedEffect: newEffect }
  '428A': { 'intercards': 'under' },
  '428B': { 'behind': 'intercards' },
  '428C': { 'under': 'out' },
  '428D': { 'out': 'behind' }, // "<bloop> ErROr! Revising forecast... Expect gale-force winds, not shocking storms!"
};
const climateChangeNpcYellIds = Object.keys(climateChangeNpcYellMap);
const weatherChannelCastIds = ['967C', '967E', '9680', '9682'];
Options.Triggers.push({
  id: 'LivingMemory',
  zoneId: ZoneId.LivingMemory,
  initData: () => ({
    executionSafe: [],
    forecastSafe: [],
  }),
  triggers: [
    // ****** A-RANK: Cat's Eye ****** //
    {
      id: 'Hunt Cat\'s Eye Gravitational Wave',
      type: 'StartsUsing',
      netRegex: { id: '9BCF', source: 'Cat\'s Eye', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Cat\'s Eye Jump + Look Away',
      type: 'StartsUsing',
      netRegex: { id: '966E', source: 'Cat\'s Eye', capture: false },
      durationSeconds: 7.5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Face away from landing marker',
          ko: '착지점 바라보면 안되요!',
        },
      },
    },
    {
      id: 'Hunt Cat\'s Eye Jump + Look Toward',
      type: 'StartsUsing',
      // Only used when Wandering Eyes buff is active.
      netRegex: { id: '966F', source: 'Cat\'s Eye', capture: false },
      durationSeconds: 7.5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Face toward landing marker',
          ko: '착지점 바라봐요!',
        },
      },
    },
    {
      id: 'Hunt Cat\'s Eye Bloodshot Gaze',
      type: 'StartsUsing',
      netRegex: { id: '9673', source: 'Cat\'s Eye', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack (face away from target)',
          ko: '뭉쳐요 (눈깔 보면 안되요)',
        },
      },
    },
    // ****** A-RANK: Sally the Sweeper ****** //
    {
      id: 'Hunt Sally Execution Model Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(executionIdToSafeMap), source: 'Sally the Sweeper' },
      run: (data, matches) => {
        const safe = executionIdToSafeMap[matches.id];
        if (safe === undefined)
          throw new UnreachableCode();
        data.executionSafe.push(safe);
      },
    },
    {
      id: 'Hunt Sally Code Execution',
      type: 'StartsUsing',
      // Not clear why there are two ids, but both get used.
      netRegex: { id: ['9639', '963A'], source: 'Sally the Sweeper', capture: false },
      durationSeconds: 12,
      infoText: (data, _matches, output) => {
        const safe = data.executionSafe;
        if (safe.length !== 3)
          return;
        return safe.map((spot) => output[spot]()).join(output.next());
      },
      run: (data) => data.executionSafe = [],
      outputStrings: executionOutputStrings,
    },
    {
      id: 'Hunt Sally Reverse Code',
      type: 'StartsUsing',
      // Not clear why there are two ids, but both get used.
      netRegex: { id: ['963B', '963C'], source: 'Sally the Sweeper', capture: false },
      durationSeconds: 12,
      infoText: (data, _matches, output) => {
        const safe = data.executionSafe.reverse();
        if (safe.length !== 3)
          return;
        return safe.map((spot) => output[spot]()).join(output.next());
      },
      run: (data) => data.executionSafe = [],
      outputStrings: executionOutputStrings,
    },
    // ****** S-RANK: The Forecaster ****** //
    {
      id: 'Hunt The Forecaster Wildfire Conditions',
      type: 'StartsUsing',
      netRegex: { id: '9684', source: 'The Forecaster', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'Hunt The Forecaster Hyperelectricity',
      type: 'StartsUsing',
      netRegex: { id: '9685', source: 'The Forecaster', capture: false },
      response: Responses.outOfMelee('alert'),
    },
    {
      id: 'Hunt The Forecaster Gale-force Winds',
      type: 'StartsUsing',
      netRegex: { id: '9686', source: 'The Forecaster', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt The Forecaster Blizzard Conditions',
      type: 'StartsUsing',
      netRegex: { id: '9687', source: 'The Forecaster', capture: false },
      alertText: (_data, _matches, output) => output.intercards(),
      outputStrings: {
        intercards: Outputs.intercards,
      },
    },
    // Forecaster announces three weather effects via `NpcYell`, and then applies 3 buffs
    // with 'Forecast'. (There are only 4 possible sequences based on `NpcYell` entries.)
    // Forecaster may also follow with an `NpcYell` message indicating one of the 3 buffs
    // will be swapped to a different effect, and will use 'Climate Change' to apply a new
    // buff indicating the new effect (although the old buff remains active).
    // Again, based on NpcYell entries, however, there are only 4 possible substitutions.
    // So we can get all we need from the initial (and, if present, subsequent) NpcYell message.
    {
      id: 'Hunt The Forecaster Forecast Collect',
      type: 'NpcYell',
      netRegex: { npcNameId: '347D', npcYellId: forecastNpcYellIds },
      run: (data, matches) => {
        const safe = forecastNpcYellMap[matches.npcYellId];
        if (safe === undefined)
          throw new UnreachableCode();
        data.forecastSafe = safe;
      },
    },
    {
      id: 'Hunt The Forecaster Climate Change Collect',
      type: 'NpcYell',
      netRegex: { npcNameId: '347D', npcYellId: climateChangeNpcYellIds },
      run: (data, matches) => {
        const swapMap = climateChangeNpcYellMap[matches.npcYellId];
        if (swapMap === undefined)
          throw new UnreachableCode();
        data.forecastSafe = data.forecastSafe.map((effect) => swapMap[effect] || effect);
      },
    },
    {
      id: 'Hunt The Forecaster Weather Channel',
      type: 'StartsUsing',
      // There are 4 possible cast ids for Weather Channel, and each corresponds to
      // the first attack in the sequence. But due to Climate Change, we can't reliably
      // use the cast id to predict the final sequence, so just trigger on all of them.
      netRegex: { id: weatherChannelCastIds, source: 'The Forecaster', capture: false },
      durationSeconds: 11,
      alertText: (data, _matches, output) => {
        const safe = data.forecastSafe;
        if (safe.length !== 3)
          return;
        return safe.map((spot) => output[spot]()).join(output.next());
      },
      run: (data) => data.forecastSafe = [],
      outputStrings: {
        under: Outputs.getUnder,
        out: Outputs.out,
        behind: Outputs.getBehind,
        intercards: Outputs.intercards,
        next: Outputs.next,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Cat\'s Eye': 'Katzenauge',
        'Sally the Sweeper': 'Sally (?:der|die|das) Fegerin',
        'The Forecaster': 'Wetterreporter',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Cat\'s Eye': 'Œil-de-chat',
        'Sally the Sweeper': 'Sally la balayeuse',
        'The Forecaster': 'Monsieur météo',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Cat\'s Eye': 'キャッツアイ',
        'Sally the Sweeper': 'サリー・ザ・スイーパー',
        'The Forecaster': 'ウェザーリポーター',
      },
    },
  ],
});
