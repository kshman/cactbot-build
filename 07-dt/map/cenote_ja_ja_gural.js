const cenoteJaJaOutputStrings = {
  spawn: {
    en: '${name} spawned!',
    de: '${name} erscheint!',
    fr: '${name} apparait !',
    ja: '${name} 現れる！',
    cn: '已生成 ${name}!',
    ko: '나타났어요: ${name}',
  },
};
const tuligoraTroupesIds = [
  '13242',
  '13243',
  '13244',
  '13245',
  '13246', // Tuligora Queen
];
Options.Triggers.push({
  id: 'CenoteJaJaGural',
  zoneId: ZoneId.CenoteJaJaGural,
  triggers: [
    // ---------------- random treasure mobs ----------------
    {
      id: 'Cenote Ja Ja Alpaca of Fortune Spawn',
      // 13240 = Alpaca of Fortune
      type: 'AddedCombatant',
      netRegex: { npcNameId: '13240' },
      suppressSeconds: 1,
      infoText: (_data, matches, output) => output.spawn({ name: matches.name }),
      outputStrings: cenoteJaJaOutputStrings,
    },
    {
      id: 'Cenote Ja Ja Uolon of Fortune Spawn',
      // 13241 = Uolon of Fortune
      type: 'AddedCombatant',
      netRegex: { npcNameId: '13241' },
      suppressSeconds: 1,
      infoText: (_data, matches, output) => output.spawn({ name: matches.name }),
      outputStrings: cenoteJaJaOutputStrings,
    },
    {
      id: 'Cenote Ja Ja Tuligora Troupes Spawn',
      type: 'AddedCombatant',
      netRegex: { npcNameId: tuligoraTroupesIds, capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Tuligora Troupes spawned, kill in order!',
          ko: '툴리고라 등장, 순서대로 잡아요',
        },
      },
    },
    // ---------------- final chamber boss: Bull Apollyon ----------------
    {
      id: 'Cenote Ja Ja Pyreburst',
      type: 'StartsUsing',
      netRegex: { id: '9576', source: 'Bull Apollyon', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cenote Ja Ja Blade',
      type: 'StartsUsing',
      netRegex: { id: '9575', source: 'Bull Apollyon' },
      response: Responses.tankBuster(),
    },
    // ---------------- alternate final chamber boss: Golden Molter ----------------
    {
      id: 'Cenote Ja Ja Golden Gall',
      type: 'StartsUsing',
      netRegex: { id: '957B', source: 'Golden Molter', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Cenote Ja Ja Blinding Light',
      type: 'StartsUsing',
      netRegex: { id: '96B4', source: 'Golden Molter' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Cenote Ja Ja Lightburst',
      // cast id = 9583, damage id = 9584
      type: 'StartsUsing',
      netRegex: { id: '9583', source: 'Golden Molter', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Cenote Ja Ja Lap',
      type: 'StartsUsing',
      netRegex: { id: '9582', source: 'Golden Molter' },
      response: Responses.tankBuster(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Bull Apollyon': 'Bullen-Apollyon',
        'Golden Molter': 'Golden(?:e|er|es|en) Wandler',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Bull Apollyon': 'apollyon buffle',
        'Golden Molter': 'transmueur doré',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Bull Apollyon': 'ブルアポリオン',
        'Golden Molter': 'ゴールデン・モルター',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Bull Apollyon': '莽撞亚波伦',
        'Golden Molter': '黄金蜕皮蜥',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Bull Apollyon': '황소 아폴리온',
        'Golden Molter': '황금 허물',
      },
    },
  ],
});
