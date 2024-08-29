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
          ko: '점프 따라가면서 🔜 밖으로 🔜 엉댕이로',
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
  ],
});
