// TODO: confirm Fuath Trickster npcNameId
// TODO: confirm The Keeper of the Keys npcNameId
// TODO: Goliath (final chamber boss, golden Talos)
// TODO: Alichino (alternate final chamber boss, golden Calcabrina)
const lyheGhiahOutputStrings = {
  spawn: {
    en: '${name} spawned!',
    de: '${name} erscheint!',
    fr: '${name} vient d\'apparaitre !',
    cn: '已生成 ${name}!',
    ko: '${name} 등장!',
  },
};
const dungeonCrewIds = [
  '8684',
  '8685',
  '8686',
  '8687',
  '8688', // Dungeon Queen
];
Options.Triggers.push({
  id: 'TheDungeonsOfLyheGhiah',
  zoneId: ZoneId.TheDungeonsOfLyheGhiah,
  triggers: [
    // ---------------- random treasure mobs ----------------
    {
      id: 'Dungeons of Lyhe Ghiah Fuath Trickster Spawn',
      // 9774 = Fuath Trickster
      type: 'AddedCombatant',
      netRegex: { npcNameId: '9774' },
      suppressSeconds: 1,
      infoText: (_data, matches, output) => output.spawn({ name: matches.name }),
      outputStrings: lyheGhiahOutputStrings,
    },
    {
      id: 'Dungeons of Lyhe Ghiah The Keeper of the Keys Spawn',
      // 9773 = The Keeper of the Keys
      type: 'AddedCombatant',
      netRegex: { npcNameId: '9773' },
      suppressSeconds: 1,
      infoText: (_data, matches, output) => output.spawn({ name: matches.name }),
      outputStrings: lyheGhiahOutputStrings,
    },
    {
      id: 'Dungeons of Lyhe Ghiah Dungeon Crew Spawn',
      type: 'AddedCombatant',
      netRegex: { npcNameId: dungeonCrewIds, capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Dungeon Crew spawned, kill in order!',
          de: 'Verlies-Mandragora erscheinen, in Reihenfolge besiegen!',
          fr: 'Les mandragores apparaissent, tuez-les dans l\'ordre',
          cn: '已生成 宝库蔓德拉战队, 依次击杀!',
          ko: '만드라즈 등장, 순서대로 잡아요!',
        },
      },
    },
    // ---------------- final chamber boss: Goliath ----------------
    // Mechanical Blow - tankbuster?
    // Accelerate - stack?
    // Wellbore - PBAoE, leaves ground effect?
    // Compress - plus-shaped AoE?
    // Goliath's Javelin - summoned adds, cast Compress - front line AoE?
    // ---------------- alternate final chamber boss: Alichino ----------------
    // Knockout - tankbuster?
    // Heat Gaze (first variant) - front cleave?
    // Heat Gaze (second variant) - donut AoE?
    // Maniacal Laughter - summons orbs that move toward players and detonate after some time?
    // Slapstick - roomwide AoE
    // Alich - summoned adds, cast Heat Gaze (front cleave variation)
    // Ino - summoned adds, cast Heat Gaze (donut AoE variation)
  ],
});