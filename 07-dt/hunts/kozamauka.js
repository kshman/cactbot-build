const doReMiseryNpcYellMap = {
  '4538': ['in', 'out', 'behind'],
  '4539': ['out', 'in', 'behind'],
  '453A': ['behind', 'in', 'out'],
  '453B': ['in', 'behind', 'out'],
  '453C': ['behind', 'out', 'in'],
  '453D': ['out', 'behind', 'in'],
  '4546': ['out', 'behind', 'out'],
  '4581': ['in', 'in', 'out'], // 17793: Ribbit! Ribbiiit! Chirp!
};
const doReMiseryOutputs = {
  out: Outputs.out,
  in: Outputs.in,
  behind: Outputs.getBehind,
  unknown: Outputs.unknown,
  next: Outputs.next,
};
Options.Triggers.push({
  id: 'Kozamauka',
  zoneId: ZoneId.Kozamauka,
  initData: () => ({
    nextDoReMisery: [],
  }),
  triggers: [
    // ****** A-RANK: Pkuucha ****** //
    {
      id: 'Hunt Pkuucha Mesmerizing March',
      type: 'StartsUsing',
      netRegex: { id: '9BB7', source: 'Pkuucha', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out (then behind)',
          ko: '밖으로 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'Hunt Pkuucha Stirring Samba',
      type: 'StartsUsing',
      netRegex: { id: '9BB8', source: 'Pkuucha', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt Pkuucha Gliding Swoop',
      type: 'StartsUsing',
      netRegex: { id: '9B4D', source: 'Pkuucha', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Follow jump (then out => behind)',
          ko: '점프 따라가서 🔜 밖으로 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'Hunt Pkuucha Marching Samba',
      type: 'StartsUsing',
      netRegex: { id: '9B75', source: 'Pkuucha', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out => Behind',
          ko: '밖으로 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'Hunt Pkuucha Marching Samba Followup',
      type: 'Ability',
      netRegex: { id: '9B75', source: 'Pkuucha', capture: false },
      delaySeconds: 1.2,
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt Pkuucha Pecking Flurry',
      type: 'StartsUsing',
      netRegex: { id: '9B50', source: 'Pkuucha', capture: false },
      durationSeconds: 10,
      response: Responses.aoe(),
    },
    // ****** A-RANK: The Raintriller ****** //
    {
      id: 'Hunt Raintriller Drop of Venom',
      type: 'StartsUsing',
      netRegex: { id: '9B4A', source: 'The Raintriller' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Hunt Raintriller Do-Re-Misery Npc Yell Collect',
      type: 'NpcYell',
      // npcNameId 3482: The Raintriller
      netRegex: { npcNameId: '3482', npcYellId: Object.keys(doReMiseryNpcYellMap) },
      run: (data, matches) => {
        const yellId = matches.npcYellId;
        const abilityList = doReMiseryNpcYellMap[yellId];
        if (abilityList === undefined)
          throw new UnreachableCode();
        data.nextDoReMisery = abilityList;
      },
    },
    {
      id: 'Hunt Raintriller Do-Re-Misery First',
      type: 'StartsUsing',
      netRegex: { id: '9B4E', source: 'The Raintriller', capture: false },
      durationSeconds: 7,
      // This ability always corresponds to npcYellId 4597 (Chirp!)
      response: Responses.getOut(),
    },
    {
      id: 'Hunt Raintriller Do-Re-Misery Second',
      type: 'StartsUsing',
      netRegex: { id: '9B47', source: 'The Raintriller', capture: false },
      durationSeconds: 11,
      // This ability always correspond to npcYellId 4537 (Chirp! Ribbit!)
      response: Responses.getOutThenIn('alert'),
    },
    {
      id: 'Hunt Raintriller Do-Re-Misery Combo',
      type: 'StartsUsing',
      netRegex: { id: '9B45', source: 'The Raintriller', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 14.5,
      alertText: (data, _matches, output) => {
        const seq = data.nextDoReMisery;
        if (seq.length !== 3)
          return output.unknown();
        const outputStr = seq.map((safe) => output[safe]()).join(output.next());
        return outputStr;
      },
      run: (data) => data.nextDoReMisery = [],
      outputStrings: doReMiseryOutputs,
    },
    // ****** S-RANK: Ihnuxokiy ****** //
    {
      id: 'Hunt Ihnuxokiy Abyssal Smog Initial',
      type: 'StartsUsing',
      netRegex: { id: '9B5D', source: 'Ihnuxokiy', capture: false },
      durationSeconds: 8,
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt Ihnuxokiy Aetherstock Out Collect',
      type: 'Ability',
      netRegex: { id: '9B62', source: 'Ihnuxokiy', capture: false },
      run: (data) => data.nextAetherstock = 'out',
    },
    {
      id: 'Hunt Ihnuxokiy Aetherstock In Collect',
      type: 'Ability',
      netRegex: { id: '9B63', source: 'Ihnuxokiy', capture: false },
      run: (data) => data.nextAetherstock = 'in',
    },
    // Ihnuxokiy applies an 8s Forward March/About Face debuff & 12s Left/Right Face debuff.
    // On expiration, each then converts to a 3s Forced March.
    // The Abyssal Smog frontal cleave snapshots 1 second after the first Forced March has expired,
    // just as the Left/Right Face debuff is converting to a Forced March.
    // The stored Aethersock snapshots as the Left/Right Face Forced March debuff expires.
    //
    // Because there is a 1s gap between the end of the Forward/Backward Forced March
    // and the start of the Left/Right Forced March, players may change their position/facing
    // during that time.
    //
    // The safest way to handle this is probably to call the initial Forward/Backward debuff
    // with a "(then x)" to indicate that the Left/Right debuff will follow.  As soon as the
    // Forward/Backward Forced March begins, we can then fire the Left/Right Forced March reminder.
    //
    // TODO: Countdowns here would be really useful...
    {
      id: 'Hunt Ihnuxokiy Left/Right Face Collect',
      type: 'GainsEffect',
      // 873: Left Face, 874: Right Face
      netRegex: { effectId: ['873', '874'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.leftRightFace = matches.effectId === '873' ? 'left' : 'right',
    },
    {
      id: 'Hunt Ihnuxokiy Forced March Forward/Backward',
      type: 'GainsEffect',
      // 871: Forward March, 872: About Face
      netRegex: { effectId: ['871', '872'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.2,
      durationSeconds: (_data, matches) => parseInt(matches.duration) - 0.2,
      infoText: (data, matches, output) => {
        const foreBack = matches.effectId === '871' ? output.forward() : output.backward();
        const leftRight = output[data.leftRightFace ?? 'unknown']();
        return output.combo({ foreBack: foreBack, leftRight: leftRight });
      },
      outputStrings: {
        combo: {
          en: 'Forced March: ${foreBack} => ${leftRight}',
          ko: '강제이동: ${foreBack} 🔜 ${leftRight}',
        },
        forward: {
          en: 'Forward',
          ko: '앞',
        },
        backward: {
          en: 'Backward',
          ko: '뒤',
        },
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Hunt Ihnuxokiy Forced March Left/Right',
      type: 'GainsEffect',
      // 873: Left Face, 874: Right Face
      netRegex: { effectId: ['873', '874'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseInt(matches.duration) - 4,
      durationSeconds: 4,
      infoText: (data, _matches, output) => {
        const leftRight = output[data.leftRightFace ?? 'unknown']();
        return output.combo({ leftRight: leftRight });
      },
      run: (data) => delete data.leftRightFace,
      outputStrings: {
        combo: {
          en: 'Forced March: ${leftRight}',
          ko: '강제이동: ${leftRight}',
        },
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Hunt Ihnuxokiy Abyssal Smog Combo',
      type: 'StartsUsing',
      netRegex: { id: '9B94', source: 'Ihnuxokiy', capture: false },
      delaySeconds: 2,
      durationSeconds: 10.5,
      alertText: (data, _matches, output) => {
        const inOut = output[data.nextAetherstock ?? 'unknown']();
        return output.combo({ behind: output.behind(), inOut: inOut });
      },
      run: (data) => delete data.nextAetherstock,
      outputStrings: {
        combo: {
          en: '${behind} => ${inOut}',
          ko: '${behind} 🔜 ${inOut}',
        },
        behind: Outputs.getBehind,
        out: Outputs.out,
        in: Outputs.in,
        unknown: Outputs.unknown,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Pkuucha': 'Pkuucha',
        'The Raintriller': 'Regentriller',
        'Ihnuxokiy': 'Ihnuxokiy',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Pkuucha': 'Pkuucha',
        'The Raintriller': 'Trilleur de pluie',
        'Ihnuxokiy': 'Ihnuxokiy',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Pkuucha': 'プクーチャ',
        'The Raintriller': 'レイントリラー',
        'Ihnuxokiy': 'イヌショキー',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Pkuucha': '普库恰',
        'The Raintriller': '惊雨蟾蜍',
        'Ihnuxokiy': '伊努索奇',
      },
    },
  ],
});
