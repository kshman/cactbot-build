const resetTrio = (data, trio) => {
  data.trio = trio;
  data.shakers = [];
  data.megaStack = [];
  data.combatantData = {};
};
const posToAngle = (pos) => {
  return xyStringToAngle(pos.x, pos.y);
};
const xyStringToAngle = (x, y) => {
  return xyToAngle(parseFloat(x), parseFloat(y));
};
const xyToAngle = (x, y) => {
  return (Math.round(180 - 180 * Math.atan2(x, y) / Math.PI) % 360);
};
const centerX = 0;
const centerY = 0;
const isClockwise = (start, compare) => {
  // assumes both start and compare are 0-360.
  // returns false if start = compare
  let isCW = false;
  if (compare > start)
    isCW = compare - start <= 180;
  else if (compare < start)
    isCW = start - compare >= 180;
  return isCW;
};
// Begin copy and paste from dragon_test.js.
const modDistance = (mark, dragon) => {
  const oneWay = (dragon - mark + 8) % 8;
  const otherWay = (mark - dragon + 8) % 8;
  const distance = Math.min(oneWay, otherWay);
  console.assert(distance >= 0);
  return distance;
};
const badSpots = (mark, dragon) => {
  // All spots between mark and dragon are bad.  If distance == 1,
  // then the dragon hits the spot behind the mark too.  e.g. N
  // mark, NE dragon will also hit NW.
  const bad = [];
  const distance = modDistance(mark, dragon);
  console.assert(distance > 0);
  console.assert(distance <= 2);
  if ((mark + distance + 8) % 8 === dragon) {
    // Clockwise.
    for (let i = 0; i <= distance; ++i)
      bad.push((mark + i) % 8);
    if (distance === 1)
      bad.push((mark - 1 + 8) % 8);
  } else {
    // Widdershins.
    for (let i = 0; i <= distance; ++i)
      bad.push((mark - i + 8) % 8);
    if (distance === 1)
      bad.push((mark + 1) % 8);
  }
  return bad;
};
const findDragonMarks = (array) => {
  const marks = [-1, -1, -1];
  let isWideThirdDive = false;
  const dragons = [];
  for (let i = 0; i < 8; ++i) {
    if (array[i])
      dragons.push(i);
  }
  if (dragons.length !== 5)
    return;
  const [d0, d1, d2, d3, d4] = dragons;
  if (
    d0 === undefined || d1 === undefined || d2 === undefined ||
    d3 === undefined || d4 === undefined
  )
    return;
  // MARK 1: counterclockwise of #1 if adjacent, clockwise if not.
  if (d0 + 1 === d1) {
    // If the first two dragons are adjacent, they *must* go CCW.
    // In the scenario of N, NE, SE, S, W dragons, the first marker
    // could be E, but that forces the second mark to be S (instead
    // of E), making SW unsafe for putting the mark between S and W.
    // Arguably, NW could be used here for the third mark, but then
    // the S dragon would cut off more of the middle of the arena
    // than desired.  This still could happen anyway in the
    // "tricksy" edge case below, but should be avoided if possible.
    marks[0] = (d0 - 1 + 8) % 8;
  } else {
    // Split dragons.  Bias towards first dragon.
    marks[0] = Math.floor((d0 + d1) / 2);
  }
  // MARK 2: go counterclockwise, unless dragon 2 is adjacent to 3.
  if (d1 === d2 - 1) {
    // Go clockwise.
    marks[1] = d2 + 1;
  } else {
    // Go counterclockwise.
    marks[1] = d2 - 1;
  }
  // MARK 3: if split, between 4 & 5.  If adjacent, clockwise of 5.
  if (d3 + 1 === d4) {
    // Adjacent dragons.
    // Clockwise is always ok.
    marks[2] = (d4 + 1) % 8;
    // Minor optimization:
    // See if counterclockwise is an option to avoid having mark 3
    // in a place that the first pair covers.
    //
    // If dragon 3 is going counterclockwise, then only need one
    // hole between #3 and #4, otherwise need all three holes.
    // e.g. N, NE, E, W, NW dragon pattern should prefer third
    // mark SW instead of N.
    const distance = marks[1] === d2 - 1 ? 2 : 4;
    if (d3 >= d2 + distance)
      marks[2] = d3 - 1;
  } else {
    // Split dragons.  Common case: bias towards last dragon, in case
    // 2nd charge is going towards this pair.
    marks[2] = Math.ceil((d3 + d4) / 2);
    if (marks[1] === d3 && marks[2] === marks[1] + 1) {
      // Tricksy edge case, e.g. N, NE, E, SE, SW.  S not safe for
      // third mark because second mark is at SE, and E dragon will
      // clip S.  Send all dragons CW even if this means eating more
      // arena space.
      marks[2] = (d4 + 1) % 8;
      isWideThirdDive = true;
    }
  }
  const bad = badSpots(marks[0], d0);
  bad.concat(badSpots(marks[0], d1));
  return {
    // Third drive is on a dragon three squares away and will cover
    // more of the middle than usual, e.g. SE dragon, SW dragon,
    // mark W (because S is unsafe from 2nd dive).
    wideThirdDive: isWideThirdDive,
    // Third mark spot is covered by the first dive so needs to be
    // patient.  Third mark should always be patient, but you never
    // know.
    unsafeThirdMark: bad.includes(marks[2]),
    marks: marks,
  };
};
// End copy and paste.
// UCU - The Unending Coil Of Bahamut (Ultimate)
Options.Triggers.push({
  id: 'TheUnendingCoilOfBahamutUltimate',
  zoneId: ZoneId.TheUnendingCoilOfBahamutUltimate,
  config: [
    {
      id: 'heavensfallTowerPosition',
      comment: {
        en:
          `With a tower at Nael being position 1, rotating clockwise, your tower position. e.g. H1 in <a href="https://clees.me/guides/ucob/" target="_blank">Clees' guide</a> is position 7.`,
      },
      name: {
        en: 'P3 Heavensfall Tower Position',
      },
      type: 'select',
      options: {
        en: {
          'Disable tower callout': 'disabled',
          'Position 1': '0',
          'Position 2': '1',
          'Position 3': '2',
          'Position 4': '3',
          'Position 5': '4',
          'Position 6': '5',
          'Position 7': '6',
          'Position 8': '7',
        },
      },
      default: 'disabled',
    },
  ],
  timelineFile: 'unending_coil_ultimate.txt',
  initData: () => {
    return {
      partyList: {},
      currentPhase: 2,
      fireDebuff: false,
      iceDebuff: false,
      thunderDebuffs: [],
      thunderOnYou: false,
      naelFireballCount: 0,
      fireballs: {
        1: [],
        2: [],
        3: [],
        4: [],
      },
      seenDragon: {},
      naelDragons: [0, 0, 0, 0, 0, 0, 0, 0],
      calledNaelDragons: false,
      wideThirdDive: false,
      unsafeThirdMark: false,
      naelDiveMarkerCount: 0,
      trioSourceIds: {},
      combatantData: {},
      heavensfallTowerSpots: [],
      shakers: [],
      megaStack: [],
      octetMarker: [],
      octetTwinDir: -1,
      exaflareCount: 0,
      akhMornCount: 0,
      mornAfahCount: 0,
    };
  },
  timelineTriggers: [
    {
      id: 'UCU Bahamut\'s Claw',
      regex: /Bahamut's Claw x5/,
      beforeSeconds: 5,
      // It's tough to track who this is on, especially for the first one.
      // Both tanks should care about the tankbuster because they can throw
      // mitigation on the other, so just always play this for both tanks.
      suppressSeconds: 1,
      response: Responses.tankBuster(),
    },
    {
      id: 'UCU Plummet',
      regex: /Plummet/,
      beforeSeconds: 3,
      suppressSeconds: 10,
      response: Responses.tankCleave(),
    },
    {
      id: 'UCU Flare Breath',
      regex: /Flare Breath/,
      beforeSeconds: 4,
      suppressSeconds: 10,
      response: Responses.tankCleave(),
    },
  ],
  triggers: [
    // --- State ---
    {
      id: 'UCU Firescorched Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '1D0' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.fireDebuff = true,
    },
    {
      id: 'UCU Firescorched Lose',
      type: 'LosesEffect',
      netRegex: { effectId: '1D0' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.fireDebuff = false,
    },
    {
      id: 'UCU Icebitten Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '1D1' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.iceDebuff = true,
    },
    {
      id: 'UCU Icebitten Lose',
      type: 'LosesEffect',
      netRegex: { effectId: '1D1' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.iceDebuff = false,
    },
    {
      id: 'UCU Fireball Counter',
      type: 'Ability',
      netRegex: { id: '26C5', source: 'Firehorn' },
      run: (data, matches) => {
        (data.fireballs[data.naelFireballCount] ??= []).push(matches.target);
      },
    },
    {
      id: 'UCU Quickmarch Phase',
      type: 'StartsUsing',
      netRegex: { id: '26E2', source: 'Bahamut Prime', capture: false },
      delaySeconds: 1,
      run: (data) => resetTrio(data, 'quickmarch'),
    },
    {
      id: 'UCU Blackfire Phase',
      type: 'StartsUsing',
      netRegex: { id: '26E3', source: 'Bahamut Prime', capture: false },
      delaySeconds: 1,
      run: (data) => resetTrio(data, 'blackfire'),
    },
    {
      id: 'UCU Fellruin Phase',
      type: 'StartsUsing',
      netRegex: { id: '26E4', source: 'Bahamut Prime', capture: false },
      delaySeconds: 1,
      run: (data) => resetTrio(data, 'fellruin'),
    },
    {
      id: 'UCU Heavensfall Phase',
      type: 'StartsUsing',
      netRegex: { id: '26E5', source: 'Bahamut Prime', capture: false },
      delaySeconds: 1,
      run: (data) => resetTrio(data, 'heavensfall'),
    },
    {
      id: 'UCU Tenstrike Phase',
      type: 'StartsUsing',
      netRegex: { id: '26E6', source: 'Bahamut Prime', capture: false },
      delaySeconds: 1,
      run: (data) => resetTrio(data, 'tenstrike'),
    },
    {
      id: 'UCU Octet Phase',
      type: 'StartsUsing',
      netRegex: { id: '26E7', source: 'Bahamut Prime', capture: false },
      delaySeconds: 1,
      run: (data) => resetTrio(data, 'octet'),
    },
    // --- Twintania ---
    {
      id: 'UCU Twisters',
      type: 'StartsUsing',
      netRegex: { id: '26AA', source: 'Twintania', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Twisters',
          de: 'Wirbelstürme',
          fr: 'Tornades',
          ja: '大竜巻',
          cn: '旋风',
          ko: '트위스터',
        },
      },
    },
    {
      id: 'UCU Death Sentence',
      type: 'StartsUsing',
      netRegex: { id: '26A9', source: 'Twintania' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'UCU Hatch Collect',
      type: 'HeadMarker',
      netRegex: { id: '0076' },
      run: (data, matches) => {
        data.hatch ??= [];
        data.hatch.push(matches.target);
      },
    },
    {
      id: 'UCU Hatch Marker YOU',
      type: 'HeadMarker',
      netRegex: { id: '0076' },
      condition: Conditions.targetIsYou(),
      alarmText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hatch on YOU',
          de: 'Ausbrüten auf DIR',
          fr: 'Éclosion sur VOUS',
          ja: '自分に魔力爆散',
          cn: '黑球点名',
          ko: '내게 마력연성',
        },
      },
    },
    {
      id: 'UCU Hatch Callouts',
      type: 'HeadMarker',
      netRegex: { id: '0076', capture: false },
      delaySeconds: 0.25,
      infoText: (data, _matches, output) => {
        if (!data.hatch)
          return;
        const hatches = data.hatch.map((n) => data.party.member(n));
        delete data.hatch;
        return output.text({ players: hatches });
      },
      outputStrings: {
        text: {
          en: 'Hatch: ${players}',
          de: 'Ausbrüten: ${players}',
          fr: 'Éclosion : ${players}',
          ja: '魔力爆散${players}',
          cn: '黑球点：${players}',
          ko: '마력연성: ${players}',
        },
      },
    },
    {
      id: 'UCU Hatch Cleanup',
      type: 'HeadMarker',
      netRegex: { id: '0076', capture: false },
      delaySeconds: 5,
      run: (data) => delete data.hatch,
    },
    {
      id: 'UCU Twintania Phase Change Watcher',
      type: 'CombatantMemory',
      // When Neurolink spawns
      netRegex: { id: '40[0-9A-F]{6}', pair: [{ key: 'BNpcID', value: '1E88FF' }], capture: false },
      condition: (data) => data.currentPhase < 4,
      sound: 'Long',
      infoText: (data, _matches, output) => output.text({ num: data.currentPhase }),
      run: (data) => {
        data.currentPhase++;
      },
      outputStrings: {
        text: {
          en: 'Phase ${num} Push',
          de: 'Phase ${num} Stoß',
          fr: 'Phase ${num} poussée',
          ja: 'フェーズ${num}',
          cn: 'P${num}准备',
          ko: '트윈 페이즈${num}',
        },
      },
    },
    // --- Nael ---
    {
      // https://xivapi.com/NpcYell/6497?pretty=true
      // en: From on high I descend, the hallowed moon to call!
      id: 'UCU Nael Quote 1',
      type: 'NpcYell',
      netRegex: { npcYellId: '1961', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread => In',
          de: 'Verteilen => Rein',
          fr: 'Dispersez-vous => Intérieur',
          ja: '散開 => 密着',
          cn: '分散 => 靠近',
          ko: '흩어졌다 🔜 안으로',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6496?pretty=true
      // en: From on high I descend, the iron path to walk!
      id: 'UCU Nael Quote 2',
      type: 'NpcYell',
      netRegex: { npcYellId: '1960', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread => Out',
          de: 'Verteilen => Raus',
          fr: 'Dispersez-vous => Extérieur',
          ja: '散開 => 離れ',
          cn: '分散 => 远离',
          ko: '흩어졌다 🔜 밖으로',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6495?pretty=true
      // en: Take fire, O hallowed moon!
      id: 'UCU Nael Quote 3',
      type: 'NpcYell',
      netRegex: { npcYellId: '195F', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack => In',
          de: 'Stack => Rein',
          fr: 'Packez-vous => Intérieur',
          ja: '頭割り => 密着',
          cn: '分摊 => 靠近',
          ko: '뭉쳤다 🔜 안으로',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6494?pretty=true
      // en: Blazing path, lead me to iron rule!
      id: 'UCU Nael Quote 4',
      type: 'NpcYell',
      netRegex: { npcYellId: '195E', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack => Out',
          de: 'Stack => Raus',
          fr: 'Packez-vous => Extérieur',
          ja: '頭割り => 離れ',
          cn: '分摊 => 远离',
          ko: '뭉쳤다 🔜 밖으로',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6493?pretty=true
      // en: O hallowed moon, take fire and scorch my foes!
      id: 'UCU Nael Quote 5',
      type: 'NpcYell',
      netRegex: { npcYellId: '195D', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In => Stack',
          de: 'Rein => Stack',
          fr: 'Intérieur => Packez-vous',
          ja: '密着 => 頭割り',
          cn: '靠近 => 分摊',
          ko: '안으로 🔜 뭉쳐요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6492?pretty=true
      // en: O hallowed moon, shine you the iron path!
      id: 'UCU Nael Quote 6',
      type: 'NpcYell',
      netRegex: { npcYellId: '195C', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In => Out',
          de: 'Rein => Raus',
          fr: 'Intérieur => Extérieur',
          ja: '密着 => 離れ',
          cn: '靠近 => 远离',
          ko: '안으로 🔜 밖으로',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6501?pretty=true
      // en: Fleeting light! 'Neath the red moon, scorch you the earth!
      id: 'UCU Nael Quote 7',
      type: 'NpcYell',
      netRegex: { npcYellId: '1965', capture: false },
      delaySeconds: 4,
      durationSeconds: 6,
      // Make this alert so it doesn't overlap with the dive infoText occuring here.
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away from Tank => Stack',
          de: 'Weg vom Tank => Stack',
          fr: 'Éloignez-vous du tank => Packez-vous',
          ja: 'タンクから離れ => 頭割り',
          cn: '远离坦克 => 分摊',
          ko: '탱크 피했다 🔜 뭉쳐요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6500?pretty=true
      // en: Fleeting light! Amid a rain of stars, exalt you the red moon!
      id: 'UCU Nael Quote 8',
      type: 'NpcYell',
      netRegex: { npcYellId: '1964', capture: false },
      delaySeconds: 4,
      durationSeconds: 6,
      // Make this alert so it doesn't overlap with the dive infoText occuring here.
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread => Away from Tank',
          de: 'Verteilen => Weg vom Tank',
          fr: 'Dispersez-vous => Éloignez-vous du Tank',
          ja: '散開 => タンクから離れ',
          cn: '分散 => 远离坦克',
          ko: '흩어졌다 🔜 탱크 피해요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6502?pretty=true
      // en: From on high I descend, the moon and stars to bring!
      id: 'UCU Nael Quote 9',
      type: 'NpcYell',
      netRegex: { npcYellId: '1966', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread => In',
          de: 'Verteilen => Rein',
          fr: 'Dispersez-vous => Intérieur',
          ja: '散開 => 密着',
          cn: '分散 => 靠近',
          ko: '흩어졌다 🔜 안으로',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6503?pretty=true
      // en: From hallowed moon I descend, a rain of stars to bring!
      id: 'UCU Nael Quote 10',
      type: 'NpcYell',
      netRegex: { npcYellId: '1967', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In => Spread',
          de: 'Rein => Verteilen',
          fr: 'Intérieur => Dispersez-vous',
          ja: '密着 => 散開',
          cn: '靠近 => 分散',
          ko: '안으로 🔜 흩어져요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6507?pretty=true
      // en: From hallowed moon I bare iron, in my descent to wield!
      id: 'UCU Nael Quote 11',
      type: 'NpcYell',
      netRegex: { npcYellId: '196B', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In => Out => Spread',
          de: 'Rein => Raus => Verteilen',
          fr: 'Intérieur => Extérieur => Dispersion',
          ja: '密着 => 離れ => 散開',
          cn: '靠近 => 远离 => 分散',
          ko: '안으로 🔜 밖으로 🔜 흩어져요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6506?pretty=true
      // en: From hallowed moon I descend, upon burning earth to tread!
      id: 'UCU Nael Quote 12',
      type: 'NpcYell',
      netRegex: { npcYellId: '196A', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In => Spread => Stack',
          de: 'Rein => Verteilen => Stack',
          fr: 'Intérieur => Dispersion => Package',
          ja: '密着 => 散開 => 頭割り',
          cn: '靠近 => 分散 => 分摊',
          ko: '안으로 🔜 흩어졌다 🔜 뭉쳐요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6504?pretty=true
      // en: Unbending iron, take fire and descend!
      id: 'UCU Nael Quote 13',
      type: 'NpcYell',
      netRegex: { npcYellId: '1968', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out => Stack => Spread',
          de: 'Raus => Stack => Verteilen',
          fr: 'Extérieur => Package => Dispersion',
          ja: '離れ => 頭割り => 散開',
          cn: '远离 => 分摊 => 分散',
          ko: '밖으로 🔜 뭉쳤다 🔜 흩어져요',
        },
      },
    },
    {
      // https://xivapi.com/NpcYell/6505?pretty=true
      // en: Unbending iron, descend with fiery edge!
      id: 'UCU Nael Quote 14',
      type: 'NpcYell',
      netRegex: { npcYellId: '1969', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out => Spread => Stack',
          de: 'Raus => Verteilen => Stack',
          fr: 'Extérieur => Dispersion => Package',
          ja: '離れ => 散開 => 頭割り',
          cn: '远离 => 分散 => 分摊',
          ko: '밖으로 🔜 흩어졌다 🔜 뭉쳐요',
        },
      },
    },
    {
      id: 'UCU Nael Thunder Collect',
      type: 'Ability',
      netRegex: { source: 'Thunderwing', id: '26C7' },
      run: (data, matches) => {
        data.thunderDebuffs.push(matches.target);
        if (data.me === matches.target)
          data.thunderOnYou = true;
      },
    },
    {
      id: 'UCU Nael Thunderstruck',
      type: 'Ability',
      // Note: The 0A event happens before 'gains the effect' and 'starts
      // casting on' only includes one person.
      netRegex: { source: 'Thunderwing', id: '26C7', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      alarmText: (data, _matches, output) => {
        if (data.thunderOnYou)
          return output.thunderOnYou();
      },
      infoText: (data, _matches, output) => {
        if (!data.thunderOnYou) {
          const [thunder1, thunder2] = data.thunderDebuffs.map((p) => data.party.member(p));
          return output.thunderOnOthers({ player1: thunder1, player2: thunder2 });
        }
      },
      run: (data) => {
        data.thunderDebuffs = [];
        data.thunderOnYou = false;
      },
      outputStrings: {
        thunderOnYou: {
          en: 'Thunder on YOU',
          de: 'Blitz auf DIR',
          fr: 'Foudre sur VOUS',
          ja: '自分にサンダー',
          cn: '雷点名',
          ko: '내게 번개',
        },
        thunderOnOthers: {
          en: 'Thunder on ${player1}, ${player2}',
          de: 'Blitz auf ${player1}, ${player2}',
          fr: 'Foudre sur ${player1}, ${player2}',
          cn: '雷点 ${player1}, ${player2}',
          ko: '번개 ${player1}, ${player2}',
        },
      },
    },
    {
      id: 'UCU Nael Your Doom',
      type: 'GainsEffect',
      netRegex: { effectId: 'D2' },
      condition: (data, matches) => {
        return data.me === matches.target;
      },
      durationSeconds: (_data, matches) => {
        if (parseFloat(matches.duration) <= 6)
          return 3;
        if (parseFloat(matches.duration) <= 10)
          return 6;
        return 9;
      },
      suppressSeconds: 20,
      alarmText: (_data, matches, output) => {
        if (parseFloat(matches.duration) <= 6)
          return output.doom1();
        if (parseFloat(matches.duration) <= 10)
          return output.doom2();
        return output.doom3();
      },
      tts: (_data, matches, output) => {
        if (parseFloat(matches.duration) <= 6)
          return output.justNumber({ num: '1' });
        if (parseFloat(matches.duration) <= 10)
          return output.justNumber({ num: '2' });
        return output.justNumber({ num: '3' });
      },
      outputStrings: {
        doom1: {
          en: 'Doom #1 on YOU',
          de: 'Verhängnis #1 auf DIR',
          fr: 'Glas #1 sur VOUS',
          ja: '自分に一番目死の宣告',
          cn: '死宣一号点名',
          ko: '죽음의 선고 1번',
        },
        doom2: {
          en: 'Doom #2 on YOU',
          de: 'Verhängnis #2 auf DIR',
          fr: 'Glas #2 sur VOUS',
          ja: '自分に二番目死の宣告',
          cn: '死宣二号点名',
          ko: '죽음의 선고 2번',
        },
        doom3: {
          en: 'Doom #3 on YOU',
          de: 'Verhängnis #3 auf DIR',
          fr: 'Glas #3 sur VOUS',
          ja: '自分に三番目死の宣告',
          cn: '死宣三号点名',
          ko: '죽음의 선고 3번',
        },
        justNumber: {
          en: '${num}',
          de: '${num}',
          fr: '${num}',
          ja: '${num}',
          cn: '${num}',
          ko: '${num}',
        },
      },
    },
    {
      id: 'UCU Doom Init',
      type: 'GainsEffect',
      netRegex: { effectId: 'D2' },
      run: (data, matches) => {
        data.dooms ??= [null, null, null];
        let order = null;
        if (parseFloat(matches.duration) < 9)
          order = 0;
        else if (parseFloat(matches.duration) < 14)
          order = 1;
        else
          order = 2;
        // FIXME: temporary workaround for multiple gains effects messages.
        // https://github.com/ravahn/FFXIV_ACT_Plugin/issues/223#issuecomment-513486275
        if (order !== null && data.dooms[order] === null)
          data.dooms[order] = matches.target;
      },
    },
    {
      id: 'UCU Doom Cleanup',
      type: 'GainsEffect',
      netRegex: { effectId: 'D2', capture: false },
      delaySeconds: 20,
      run: (data) => {
        delete data.dooms;
        delete data.doomCount;
      },
    },
    {
      id: 'UCU Nael Cleanse Callout',
      type: 'Ability',
      netRegex: { source: 'Fang Of Light', id: '26CA', capture: false },
      infoText: (data, _matches, output) => {
        data.doomCount ??= 0;
        let name;
        if (data.dooms)
          name = data.dooms[data.doomCount];
        data.doomCount++;
        if (typeof name === 'string')
          return output.text({ num: data.doomCount, player: data.party.member(name) });
      },
      outputStrings: {
        text: {
          en: 'Cleanse #${num}: ${player}',
          de: 'Medica #${num}: ${player}',
          fr: 'Purifiez #${num}: ${player}',
          ja: '解除に番目${num}: ${player}',
          cn: '解除死宣 #${num}: ${player}',
          ko: '선고 해제 ${num}: ${player}',
        },
      },
    },
    {
      id: 'UCU Nael Fireball 1',
      type: 'Ability',
      netRegex: { source: 'Ragnarok', id: '26B8', capture: false },
      delaySeconds: 35,
      suppressSeconds: 99999,
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.naelFireballCount = 1,
      outputStrings: {
        text: {
          en: 'Fire IN',
          de: 'Feuer INNEN',
          fr: 'Feu à l\'INTÉRIEUR',
          ja: 'ファイアボールは密着',
          cn: '人群火1',
          ko: '파이어볼 함께 맞아요',
        },
      },
    },
    {
      id: 'UCU Nael Fireball 2',
      type: 'Ability',
      netRegex: { source: 'Ragnarok', id: '26B8', capture: false },
      delaySeconds: 51,
      suppressSeconds: 99999,
      alertText: (data, _matches, output) => {
        // All players should be neutral by the time fire #2 happens.
        // If you have ice at this point, it means you missed the first
        // stack.  Therefore, make sure you stack.  It's possible you
        // can survive until fire 3 happens, but it's not 100%.
        // See: https://www.reddit.com/r/ffxiv/comments/78mdwd/bahamut_ultimate_mechanics_twin_and_nael_minutia/
        if (!data.fireballs[1]?.includes(data.me))
          return output.fireOutBeInIt();
      },
      infoText: (data, _matches, output) => {
        if (data.fireballs[1]?.includes(data.me))
          return output.fireOut();
      },
      run: (data) => data.naelFireballCount = 2,
      outputStrings: {
        fireOut: {
          en: 'Fire OUT',
          de: 'Feuer AUßEN',
          fr: 'Feu à l\'EXTÉRIEUR',
          ja: 'ファイアボールは離れ',
          cn: '单吃火2',
          ko: '파이어볼 밖으로',
        },
        fireOutBeInIt: {
          en: 'Fire OUT: Be in it',
          de: 'Feuer AUßEN: Drin sein',
          fr: 'Feu à l\'EXTÉRIEUR : Allez dessus',
          ja: 'ファイアボールは離れ: 自分に密着',
          cn: '去吃火2',
          ko: '파이어볼 밖으로: 나는 함께 맞기',
        },
      },
    },
    {
      id: 'UCU Nael Fireball 3',
      type: 'Ability',
      netRegex: { source: 'Ragnarok', id: '26B8', capture: false },
      delaySeconds: 77,
      suppressSeconds: 99999,
      alertText: (data, _matches, output) => {
        // If you were the person with fire tether #2, then you could
        // have fire debuff here and need to not stack.
        if (data.fireballs[1]?.includes(data.me) && data.fireballs[2]?.includes(data.me))
          return output.fireInAvoid();
      },
      infoText: (data, _matches, output) => {
        const tookTwo = data.fireballs[1]?.filter((p) => {
          return data.fireballs[2]?.includes(p);
        });
        if (tookTwo?.includes(data.me))
          return;
        if (tookTwo && tookTwo.length > 0) {
          const players = tookTwo.map((name) => data.party.member(name));
          return output.fireInPlayersOut({ players: players });
        }
        return output.fireIn();
      },
      run: (data) => data.naelFireballCount = 3,
      outputStrings: {
        fireIn: {
          en: 'Fire IN',
          de: 'Feuer INNEN',
          fr: 'Feu à l\'INTÉRIEUR',
          ja: 'ファイアボールは密着',
          cn: '人群火3',
          ko: '파이어볼 함께 맞아요',
        },
        fireInPlayersOut: {
          en: 'Fire IN (${players} out)',
          de: 'Feuer INNEN (${players} raus)',
          fr: 'Feu à l\'INTÉRIEUR (${players} évitez)',
          ja: 'ファイアボールは密着 (${players}は外へ)',
          cn: '人群火3 (${players}躲避)',
          ko: '파이어볼 함께 맞아요 (피해요: ${players})',
        },
        fireInAvoid: {
          en: 'Fire IN: AVOID!',
          de: 'Feuer INNEN: AUSWEICHEN!',
          fr: 'Feu à l\'INTÉRIEUR : ÉVITEZ !',
          ja: 'ファイアボールは密着: 自分に離れ',
          cn: '躲避人群火3！',
          ko: '파이어볼 함께 맞아요: 나는 피해요',
        },
      },
    },
    {
      id: 'UCU Nael Fireball 4',
      type: 'Ability',
      netRegex: { source: 'Ragnarok', id: '26B8', capture: false },
      delaySeconds: 98,
      suppressSeconds: 99999,
      alertText: (data, _matches, output) => {
        const tookTwo = data.fireballs[1]?.filter((p) => {
          return data.fireballs[2]?.includes(p);
        });
        const tookThree = (tookTwo ?? []).filter((p) => {
          return data.fireballs[3]?.includes(p);
        });
        data.tookThreeFireballs = tookThree.includes(data.me);
        // It's possible that you can take 1, 2, and 3 even if nobody dies with
        // careful ice debuff luck.  However, this means you probably shouldn't
        // take 4.
        if (data.tookThreeFireballs)
          return output.fireInAvoid();
      },
      infoText: (data, _matches, output) => {
        if (!data.tookThreeFireballs)
          return output.fireIn();
      },
      run: (data) => data.naelFireballCount = 4,
      outputStrings: {
        fireIn: {
          en: 'Fire IN',
          de: 'Feuer INNEN',
          fr: 'Feu à l\'INTÉRIEUR',
          ja: 'ファイアボール密着',
          cn: '人群火4',
          ko: '파이어볼 함께 맞아요',
        },
        fireInAvoid: {
          en: 'Fire IN: AVOID!',
          de: 'Feuer INNEN: AUSWEICHEN!',
          fr: 'Feu à l\'INTÉRIEUR : ÉVITEZ !',
          ja: 'ファイアボールは密着: 自分に離れ',
          cn: '躲避人群火4！',
          ko: '파이어볼 함께 맞아요: 나는 피해요',
        },
      },
    },
    {
      id: 'UCU Dragon Tracker',
      type: 'Ability',
      netRegex: {
        source: ['Iceclaw', 'Thunderwing', 'Fang Of Light', 'Tail Of Darkness', 'Firehorn'],
        id: ['26C6', '26C7', '26CA', '26C9', '26C5'],
      },
      condition: (data, matches) => !(matches.source in data.seenDragon),
      run: (data, matches) => {
        data.seenDragon[matches.source] = true;
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        // Positions are the 8 cardinals + numerical slop on a radius=24 circle.
        // N = (0, -24), E = (24, 0), S = (0, 24), W = (-24, 0)
        const dir = Directions.xyTo8DirNum(x, y, centerX, centerY);
        data.naelDragons[dir] = 1;
        if (Object.keys(data.seenDragon).length !== 5)
          return;
        const result = findDragonMarks(data.naelDragons);
        if (!result)
          return;
        data.naelMarks = result.marks.map((i) => {
          return Directions.output8Dir[i] ?? 'unknown';
        });
        data.wideThirdDive = result.wideThirdDive;
        data.unsafeThirdMark = result.unsafeThirdMark;
        if (data.options.Debug) {
          // In case you forget, print marks in the log.
          console.log(
            `UCU Dragon Tracker${data.naelMarks.join(', ')}${data.wideThirdDive ? ' (WIDE)' : ''}`,
          );
        }
      },
    },
    {
      id: 'UCU Nael Ravensbeak',
      type: 'StartsUsing',
      netRegex: { source: 'Nael deus Darnus', id: '26B6' },
      response: Responses.tankBusterSwap('alert'),
    },
    {
      // Called out after the 1st Ravensbeak.
      id: 'UCU Nael Dragon Placement',
      type: 'Ability',
      netRegex: { source: 'Nael deus Darnus', id: '26B6', capture: false },
      condition: (data) => data.naelMarks && !data.calledNaelDragons,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        data.calledNaelDragons = true;
        const params = {
          dive1: output[data.naelMarks?.[0] ?? 'unknown'](),
          dive2: output[data.naelMarks?.[1] ?? 'unknown'](),
          dive3: output[data.naelMarks?.[2] ?? 'unknown'](),
        };
        if (data.wideThirdDive)
          return output.marksWide(params);
        return output.marks(params);
      },
      outputStrings: {
        marks: {
          en: 'Marks: ${dive1}, ${dive2}, ${dive3}',
          de: 'Markierungen : ${dive1}, ${dive2}, ${dive3}',
          fr: 'Marque : ${dive1}, ${dive2}, ${dive3}',
          ja: 'マーカー: ${dive1}, ${dive2}, ${dive3}',
          cn: '标记: ${dive1}, ${dive2}, ${dive3}',
          ko: '징: ${dive1}, ${dive2}, ${dive3}',
        },
        marksWide: {
          en: 'Marks: ${dive1}, ${dive2}, ${dive3} (WIDE)',
          de: 'Markierungen : ${dive1}, ${dive2}, ${dive3} (GROß)',
          fr: 'Marque : ${dive1}, ${dive2}, ${dive3} (LARGE)',
          ja: 'マーカー: ${dive1}, ${dive2}, ${dive3} (広)',
          cn: '标记: ${dive1}, ${dive2}, ${dive3} (大)',
          ko: '징: ${dive1}, ${dive2}, ${dive3} (넓음)',
        },
        ...Directions.outputStrings8Dir,
      },
    },
    {
      id: 'UCU Nael Dragon Dive Marker Me',
      type: 'HeadMarker',
      netRegex: { id: '0014' },
      condition: (data) => !data.trio,
      alarmText: (data, matches, output) => {
        if (matches.target !== data.me)
          return;
        const dir = data.naelMarks?.[data.naelDiveMarkerCount] ?? 'unknown';
        return output.text({ dir: output[dir]() });
      },
      outputStrings: {
        text: {
          en: 'Go To ${dir} with marker',
          de: 'Gehe nach ${dir} mit dem Marker',
          fr: 'Allez direction ${dir} avec le marqueur',
          ja: 'マーカー付いたまま${dir}へ',
          cn: '去 ${dir} 引导俯冲',
          ko: '${dir}으로 이동',
        },
        ...Directions.outputStrings8Dir,
      },
    },
    {
      id: 'UCU Nael Dragon Dive Marker Others',
      type: 'HeadMarker',
      netRegex: { id: '0014' },
      condition: (data) => !data.trio,
      infoText: (data, matches, output) => {
        if (matches.target === data.me)
          return;
        const num = data.naelDiveMarkerCount + 1;
        return output.text({ num: num, player: data.party.member(matches.target) });
      },
      outputStrings: {
        text: {
          en: 'Dive #${num}: ${player}',
          de: 'Sturz #${num} : ${player}',
          fr: 'Plongeon #${num} : ${player}',
          ja: 'ダイブ${num}番目:${player}',
          cn: '第 ${num} 次俯冲点: ${player}',
          ko: '다이브#${num}: ${player}',
        },
      },
    },
    {
      id: 'UCU Nael Dragon Dive Marker Counter',
      type: 'HeadMarker',
      netRegex: { id: '0014', capture: false },
      condition: (data) => !data.trio,
      run: (data) => data.naelDiveMarkerCount++,
    },
    // --- Bahamut Prime ---
    {
      // Octet marker tracking (77=nael, 14=dragon, 29=baha, 2A=twin)
      id: 'UCU Octet Marker Tracking',
      type: 'HeadMarker',
      netRegex: { id: ['0077', '0014', '0029'] },
      condition: (data) => data.trio === 'octet',
      run: (data, matches) => {
        data.octetMarker.push(matches.target);
        if (data.octetMarker.length !== 7)
          return;
        const partyList = data.party.details.map((p) => p.name);
        if (partyList.length !== 8) {
          console.error(`Octet error: bad party list size: ${JSON.stringify(partyList)}`);
          return;
        }
        const uniqDict = {};
        for (const marker of data.octetMarker) {
          uniqDict[marker] = true;
          if (!partyList.includes(marker)) {
            console.error(`Octet error: could not find ${marker} in ${JSON.stringify(partyList)}`);
            return;
          }
        }
        const uniq = Object.keys(uniqDict);
        // If the number of unique folks who took markers is not 7, then
        // somebody has died and somebody took two.  Could be on anybody.
        if (uniq.length !== 7)
          return;
        const remainingPlayers = partyList.filter((p) => {
          return !data.octetMarker.includes(p);
        });
        if (remainingPlayers.length !== 1) {
          // This could happen if the party list wasn't unique.
          console.error(
            `Octet error: failed to find player, ${JSON.stringify(partyList)} ${
              JSON.stringify(data.octetMarker)
            }`,
          );
          return;
        }
        // Finally, we found it!
        data.lastOctetMarker = remainingPlayers[0];
      },
    },
    {
      id: 'UCU Octet Nael Marker',
      type: 'HeadMarker',
      netRegex: { id: '0077' },
      condition: (data) => data.trio === 'octet',
      infoText: (data, matches, output) => {
        const num = data.octetMarker.length;
        return output.text({ num: num, player: data.party.member(matches.target) });
      },
      outputStrings: {
        text: {
          en: '${num}: ${player} (nael)',
          de: '${num}: ${player} (nael)',
          fr: '${num} : ${player} (nael)',
          ja: '${num}: ${player} (ネール)',
          cn: '${num}: ${player} (奈尔)',
          ko: '${num}: ${player} (넬)',
        },
      },
    },
    {
      id: 'UCU Octet Dragon Marker',
      type: 'HeadMarker',
      netRegex: { id: '0014' },
      condition: (data) => data.trio === 'octet',
      infoText: (data, matches, output) => {
        const num = data.octetMarker.length;
        return output.text({ num: num, player: data.party.member(matches.target) });
      },
      outputStrings: {
        text: {
          en: '${num}: ${player}',
          de: '${num}: ${player}',
          fr: '${num} : ${player}',
          ja: '${num}: ${player}',
          cn: '${num}：${player}',
          ko: '${num}: ${player}',
        },
      },
    },
    {
      id: 'UCU Octet Baha Marker',
      type: 'HeadMarker',
      netRegex: { id: '0029' },
      condition: (data) => data.trio === 'octet',
      infoText: (data, matches, output) => {
        const num = data.octetMarker.length;
        return output.text({ num: num, player: data.party.member(matches.target) });
      },
      outputStrings: {
        text: {
          en: '${num}: ${player} (baha)',
          de: '${num}: ${player} (baha)',
          fr: '${num} : ${player} (baha)',
          ja: '${num}: ${player} (バハ)',
          cn: '${num}: ${player} (巴哈)',
          ko: '${num}: ${player} (바하)',
        },
      },
    },
    {
      id: 'UCU Octet Twin Bait',
      type: 'HeadMarker',
      netRegex: { id: '0029', capture: false },
      condition: (data) => data.trio === 'octet',
      delaySeconds: 0.5,
      alertText: (data, _matches, output) => {
        if (data.lastOctetMarker === undefined)
          return output.twinOnUnknown({
            unknown: output.unknown(),
            dir: output[Directions.outputFrom8DirNum(data.octetTwinDir)](),
          });
        return output.twinOnPlayer({
          player: data.party.member(data.lastOctetMarker),
          dir: output[Directions.outputFrom8DirNum(data.octetTwinDir)](),
        });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        unknown: Outputs.unknown,
        twinOnPlayer: {
          en: '${player} Bait Twin (${dir})',
        },
        twinOnUnknown: {
          en: '${unknown} Bait Twin (${dir})',
        },
      },
    },
    {
      id: 'UCU Twister Dives',
      type: 'Ability',
      netRegex: { source: 'Twintania', id: '26B2', capture: false },
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Twisters',
          de: 'Wirbelstürme',
          fr: 'Tornades',
          ja: 'ツイスター',
          cn: '旋风',
          ko: '트위스터',
        },
      },
    },
    {
      id: 'UCU Bahamut Flatten',
      type: 'StartsUsing',
      netRegex: { id: '26D5', source: 'Bahamut Prime' },
      condition: Conditions.caresAboutPhysical(),
      response: Responses.tankBuster(),
    },
    {
      id: 'UCU Bahamut Gigaflare',
      type: 'StartsUsing',
      netRegex: { id: '26D6', source: 'Bahamut Prime', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Gigaflare',
          de: 'Gigaflare',
          fr: 'GigaBrasier',
          ja: 'ギガフレア',
          cn: '十亿核爆',
          ko: '기가플레어',
        },
      },
    },
    {
      id: 'UCU Quickmarch Dive Dir',
      type: 'StartsUsing',
      netRegex: { id: '26E1', source: 'Bahamut Prime' },
      condition: (data) => data.trio === 'quickmarch',
      alertText: (_data, matches, output) => {
        // Bosses jump, and dive placement is locked once Bahamut starts casting.
        // Position data is always updated by now, so need to rely on combatant data from OP.
        // Bahamut will always be on an exact cardinal/intercardinal (w/Nael & Twin on either side)
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const diveDir = Directions.xyTo8DirOutput(x, y, centerX, centerY);
        return output.dive({ dir: output[diveDir]() });
      },
      outputStrings: {
        dive: {
          en: '${dir} Dive',
          de: '${dir} Sturzbombe',
          fr: 'Plongée ${dir}',
          cn: '${dir} 俯冲',
          ko: '${dir} 다이브',
        },
        ...Directions.outputStrings8Dir,
      },
    },
    // Collect sourceIds for Nael, Twin & Bahamut when they dive during Quickmarch
    // Will use these ids later to get combatant data from Overlay Plugin
    {
      id: 'UCU P3 Nael Collect',
      type: 'StartsUsing',
      netRegex: { id: '26C3', source: 'Nael deus Darnus' },
      condition: (data) => data.trio === 'quickmarch',
      run: (data, matches) => data.trioSourceIds.nael = parseInt(matches.sourceId, 16),
    },
    {
      id: 'UCU P3 Bahamut Collect',
      type: 'StartsUsing',
      netRegex: { id: '26E1', source: 'Bahamut Prime' },
      condition: (data) => data.trio === 'quickmarch',
      run: (data, matches) => data.trioSourceIds.bahamut = parseInt(matches.sourceId, 16),
    },
    {
      id: 'UCU P3 Twintania Collect',
      type: 'StartsUsing',
      netRegex: { id: '26B2', source: 'Twintania' },
      condition: (data) => data.trio === 'quickmarch',
      run: (data, matches) => data.trioSourceIds.twin = parseInt(matches.sourceId, 16),
    },
    {
      id: 'UCU Blackfire Party Dir',
      type: 'ActorSetPos',
      netRegex: { capture: true },
      condition: (data, matches) => {
        if (data.trio !== 'blackfire')
          return false;
        if (parseInt(matches.id, 16) !== data.trioSourceIds.nael)
          return false;
        return true;
      },
      suppressSeconds: 9999,
      alertText: (_data, matches, output) => {
        const posX = parseFloat(matches.x);
        const posY = parseFloat(matches.y);
        const naelDirOutput = Directions.xyTo8DirOutput(posX, posY, centerX, centerY);
        return output.naelPosition({ dir: output[naelDirOutput]() });
      },
      outputStrings: {
        naelPosition: {
          en: 'Nael is ${dir}',
          de: 'Nael ist im ${dir}',
          fr: 'Nael est vers ${dir}',
          cn: '奈尔在 ${dir}',
          ko: '넬 ${dir}',
        },
        ...Directions.outputStrings8Dir,
      },
    },
    {
      id: 'UCU Megaflare Stack Me',
      type: 'HeadMarker',
      netRegex: { id: '0027' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Megaflare Stack',
          de: 'Megaflare Stack',
          fr: 'Mégabrasier, packez-vous',
          ja: 'メガフレア頭割り',
          cn: '分摊百万核爆',
          ko: '기가플레어 뭉쳐요',
        },
      },
    },
    {
      id: 'UCU Megaflare Stack Tracking',
      type: 'HeadMarker',
      netRegex: { id: '0027' },
      run: (data, matches) => data.megaStack.push(matches.target),
    },
    {
      id: 'UCU Megaflare Tower',
      type: 'HeadMarker',
      netRegex: { id: '0027', capture: false },
      infoText: (data, _matches, output) => {
        if (data.trio !== 'blackfire' && data.trio !== 'octet' || data.megaStack.length !== 4)
          return;
        if (data.megaStack.includes(data.me))
          return;
        if (data.trio === 'blackfire')
          return output.blackfireTower();
        if (data.lastOctetMarker === undefined || data.lastOctetMarker === data.me)
          return output.octetTowerPlusTwin();
        return output.octetTower();
      },
      tts: (data, _matches, output) => {
        if (data.trio !== 'blackfire' && data.trio !== 'octet' || data.megaStack.length !== 4)
          return;
        if (!data.megaStack.includes(data.me))
          return output.towerTTS();
      },
      outputStrings: {
        blackfireTower: {
          en: 'Tower, bait hypernova',
          de: 'Turm, Hypernova ködern',
          fr: 'Tour, attirez la Supernova',
          ja: 'タワーやスーパーノヴァ',
          cn: '踩塔, 引导超新星',
          ko: '초신성 피하고 기둥 밟아요',
        },
        octetTowerPlusTwin: {
          en: 'Bait Twin, then tower',
          de: 'Twintania in Turm locken',
          fr: 'Attirez Gémellia, puis tour',
          ja: 'タニアダイブやタワー',
          cn: '引导双塔, 踩塔',
          ko: '트윈타니아 유도 후 기둥 밟아요',
        },
        octetTower: {
          en: 'Get in a far tower',
          de: 'Geh in entfernten Turm',
          fr: 'Aller dans une tour lointaine',
          ja: '遠いタワー',
          cn: '踩远处的塔',
          ko: '타워 밟아요',
        },
        towerTTS: {
          en: 'tower',
          de: 'Turm',
          fr: 'Tour',
          ja: 'タワー',
          cn: '踩塔',
          ko: '타워',
        },
      },
    },
    {
      id: 'UCU Megaflare Twin Tower',
      type: 'HeadMarker',
      netRegex: { id: '0027', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.trio !== 'blackfire' && data.trio !== 'octet' || data.megaStack.length !== 4)
          return;
        if (data.lastOctetMarker === undefined || data.lastOctetMarker === data.me)
          return;
        const twin = data.party.member(data.lastOctetMarker);
        if (data.megaStack.includes(data.lastOctetMarker))
          return output.twinHasMegaflare({ player: twin });
        return output.twinHasTower({ player: twin });
      },
      tts: null,
      outputStrings: {
        twinHasMegaflare: {
          en: '${player} (twin) has megaflare',
          de: '${player} (Twin) hat Megaflare',
          fr: '${player} (Gémellia) a mégabrasier',
          ja: '${player} (ツインタニア) メガ頭割り',
          cn: '双塔俯冲点分摊 （${player})',
          ko: '${player} (트윈 징 대상자) 🔜 뭉쳐요',
        },
        twinHasTower: {
          en: '${player} (twin) needs tower',
          de: '${player} (Twin) braucht einen Turm',
          fr: '${player} (Gémellia) ont besoin d\'une tour',
          ja: '${player} (ツインタニア) 塔を踏む',
          cn: '双塔俯冲点踩塔（${player}）',
          ko: '${player} (트윈 징 대상자) 🔜 타워',
        },
      },
    },
    {
      id: 'UCU Heavensfall Nael Spot',
      type: 'ActorSetPos',
      netRegex: { capture: true },
      condition: (data, matches) => {
        if (data.trio !== 'heavensfall')
          return false;
        if (!Object.values(data.trioSourceIds).includes(parseInt(matches.id, 16)))
          return false;
        // Can't use suppressSeconds since this is a collector trigger
        // so just return false if we already have 3 actors stored
        if (Object.keys(data.combatantData).length >= 3)
          return false;
        return true;
      },
      preRun: (data, matches) => {
        data.combatantData[parseInt(matches.id, 16)] = matches;
      },
      alertText: (data, _matches, output) => {
        if (Object.keys(data.combatantData).length < 3)
          return;
        // Bosses line up adjacent to one another, but don't necessarily have discrete directional positions (based on 8Dir scale).
        // But we can calculate their position as an angle (relative to circular arena): 0 = N, 90 = E, 180 = S, 270 = W, etc.
        let naelAngle;
        let bahamutAngle;
        let twinAngle;
        let naelPos = 'unknown';
        for (const mob of Object.values(data.combatantData)) {
          const mobAngle = posToAngle(mob);
          const mobId = parseInt(mob.id, 16);
          // As OP does not return combatants in the order, they were passed, match based on sourceId.
          if (mobId === data.trioSourceIds.nael)
            naelAngle = mobAngle;
          else if (mobId === data.trioSourceIds.bahamut)
            bahamutAngle = mobAngle;
          else if (mobId === data.trioSourceIds.twin)
            twinAngle = mobAngle;
        }
        if (naelAngle === undefined || bahamutAngle === undefined || twinAngle === undefined)
          return;
        data.heavensfallNaelAngle = naelAngle;
        if (naelAngle >= 0 && bahamutAngle >= 0 && twinAngle >= 0) {
          if (isClockwise(naelAngle, bahamutAngle))
            naelPos = isClockwise(naelAngle, twinAngle) ? 'left' : 'middle';
          else
            naelPos = isClockwise(naelAngle, twinAngle) ? 'middle' : 'right';
        }
        return output.naelPosition({ dir: output[naelPos]() });
      },
      outputStrings: {
        naelPosition: {
          en: '${dir} Nael',
          de: '${dir} Nael',
          fr: 'Nael ${dir}',
          cn: '${dir} 奈尔',
          ko: '넬 ${dir}',
        },
        left: Outputs.left,
        middle: Outputs.middle,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'UCU Heavensfall Tower Spot',
      type: 'StartsUsingExtra',
      netRegex: { id: '26DF', capture: true },
      condition: (data) => {
        return data.triggerSetConfig.heavensfallTowerPosition !== 'disabled' &&
          data.trio === 'heavensfall';
      },
      preRun: (data, matches) => {
        data.heavensfallTowerSpots.push(matches);
      },
      durationSeconds: 8,
      infoText: (data, _matches, output) => {
        if (data.heavensfallTowerSpots.length < 8)
          return;
        const naelAngle = data.heavensfallNaelAngle;
        if (naelAngle === undefined)
          return;
        const wantedIdx = parseInt(data.triggerSetConfig.heavensfallTowerPosition);
        const towers = data.heavensfallTowerSpots.sort((l, r) => posToAngle(l) - posToAngle(r));
        const towersMap = towers.map((t) =>
          Directions.xyTo16DirNum(parseFloat(t.x), parseFloat(t.y), centerX, centerY)
        );
        let naelIdx = towers.findIndex((t) => posToAngle(t) >= naelAngle);
        if (naelIdx < 0)
          naelIdx += 8;
        const towerDir = towersMap[(wantedIdx + naelIdx) % 8];
        const myTowerDir = towerDir !== undefined
          ? Directions.output16Dir[towerDir] ?? 'unknown'
          : 'unknown';
        return output.tower({
          dir: output[myTowerDir](),
        });
      },
      outputStrings: {
        tower: {
          en: 'Tower: ${dir}',
        },
        ...Directions.outputStrings16Dir,
      },
    },
    {
      id: 'UCU Earthshaker Me',
      type: 'HeadMarker',
      netRegex: { id: '0028' },
      condition: Conditions.targetIsYou(),
      response: Responses.earthshaker('alarm'),
    },
    {
      id: 'UCU Earthshaker Tracking',
      type: 'HeadMarker',
      netRegex: { id: '0028' },
      run: (data, matches) => data.shakers.push(matches.target),
    },
    {
      id: 'UCU Earthshaker Not Me',
      type: 'HeadMarker',
      netRegex: { id: '0028', capture: false },
      alertText: (data, _matches, output) => {
        if (data.trio !== 'quickmarch')
          return;
        if (data.shakers.length !== 3)
          return;
        if (data.role === 'tank')
          return output.quickmarchTankTether();
      },
      infoText: (data, _matches, output) => {
        if (data.trio === 'quickmarch') {
          if (data.shakers.length !== 3)
            return;
          if (!data.shakers.includes(data.me) && data.role !== 'tank')
            return output.quickmarchNotOnYou();
        } else if (data.trio === 'tenstrike') {
          if (data.shakers.length === 4 && !data.shakers.includes(data.me))
            return output.tenstrikeNotOnYou();
        }
      },
      run: (data) => {
        if (data.trio === 'tenstrike' && data.shakers.length === 4)
          data.shakers = [];
      },
      outputStrings: {
        quickmarchTankTether: {
          en: 'Pick up tether',
          de: 'Verbindung holen',
          fr: 'Prenez un lien',
          ja: 'テンペストウィング線',
          cn: '接线',
          ko: '줄 가로채요',
        },
        quickmarchNotOnYou: {
          en: 'No shaker; stack south.',
          de: 'Kein Erdstoß; im süden sammeln',
          fr: 'Pas de Secousse; packez-vous au Sud.',
          ja: 'シェイカーない；頭割りで南',
          cn: '无点名，正下方分摊',
          ko: '마커 없음, 남쪽서 뭉쳐요',
        },
        tenstrikeNotOnYou: {
          en: 'Stack on safe spot',
          de: 'In Sicherheit steken',
          fr: 'Packez-vous au point safe',
          ja: '安置へ集合',
          cn: '安全点集合',
          ko: '안전한 곳에서 뭉쳐요',
        },
      },
    },
    // For Grand Octet:
    // After bosses and dragons start spawning, there's no clear log line we can trigger off of to find bosses' position
    // until it's effectively too late.  The best way to do this seems to be to fire the trigger
    // with a delay when Bahamut uses Grand Octet before all 3 bosses jump.
    {
      id: 'UCU Grand Octet Run & Rotate',
      type: 'ActorSetPos',
      netRegex: { capture: true },
      condition: (data, matches) => {
        if (data.trio !== 'octet')
          return false;
        if (!Object.values(data.trioSourceIds).includes(parseInt(matches.id, 16)))
          return false;
        // Can't use suppressSeconds since this is a collector trigger
        // so just return false if we already have 3 actors stored
        if (Object.keys(data.combatantData).length >= 3)
          return false;
        return true;
      },
      preRun: (data, matches) => {
        data.combatantData[parseInt(matches.id, 16)] = matches;
      },
      alertText: (data, _matches, output) => {
        if (Object.keys(data.combatantData).length < 3)
          return;
        let naelDirIdx;
        let bahaDirIdx;
        for (const mob of Object.values(data.combatantData)) {
          const mobId = parseInt(mob.id, 16);
          const mobDirIdx = Directions.xyTo8DirNum(
            parseFloat(mob.x),
            parseFloat(mob.y),
            centerX,
            centerY,
          );
          if (mobId === data.trioSourceIds.nael)
            naelDirIdx = mobDirIdx;
          else if (mobId === data.trioSourceIds.bahamut)
            bahaDirIdx = mobDirIdx;
          else if (mobId === data.trioSourceIds.twin)
            data.octetTwinDir = mobDirIdx;
        }
        if (naelDirIdx === undefined || bahaDirIdx === undefined)
          return;
        // If Bahamut spaws on a cardinal, the party goes opposite and rotates counter-clockwise; if intercardinal, clockwise.
        // If Nael is directly opposite Bahamut, the party instead starts one directional position over (same as the rotation direction)
        // http://clees.me/guides/ucob/
        let rotationIdxModifier; // this is used to modify the party starting spot in directions[] if Nael is opposite Bahamut
        let rotationPath;
        const bahaOutputStr = Directions.output8Dir[bahaDirIdx];
        const cardinalDirs = Directions.outputCardinalDir;
        if (bahaOutputStr === undefined)
          return;
        if (cardinalDirs.includes(bahaOutputStr)) {
          rotationIdxModifier = -1;
          rotationPath = 'counterclockwise';
        } else {
          rotationIdxModifier = 1;
          rotationPath = 'clockwise';
        }
        // start by going directly opposite Bahamut
        let partyStartIdx = bahaDirIdx >= 4 ? bahaDirIdx - 4 : bahaDirIdx + 4;
        // If Nael is there, instead go +1/-1 direction (depending on the rotation direction)
        if (naelDirIdx === partyStartIdx) {
          partyStartIdx += rotationIdxModifier;
          // if this pushes partyStartIdx beyond the array boundary, wrap around
          if (partyStartIdx === -1) {
            partyStartIdx = 7;
          } else if (partyStartIdx === 8) {
            partyStartIdx = 0;
          }
        }
        const partyStartDir = Directions.output8Dir[partyStartIdx] ?? 'unknown';
        if (partyStartDir === undefined || rotationPath === undefined)
          return;
        return output.grandOctet({
          startDir: output[partyStartDir](),
          path: output[rotationPath](),
        });
      },
      outputStrings: {
        grandOctet: {
          en: 'Bait dash, go ${startDir}, rotate ${path}',
          de: 'Ansturm ködern, gehe nach ${startDir}, rotiere ${path}',
          cn: '诱导俯冲, 去 ${startDir}, ${path} 转',
          ko: '돌진 유도, ${startDir}쪽으로, ${path}',
        },
        clockwise: Outputs.clockwise,
        counterclockwise: Outputs.counterclockwise,
        ...Directions.outputStrings8Dir,
      },
    },
    // --- Golden Bahamut ---
    {
      id: 'UCU Morn Afah',
      type: 'StartsUsing',
      netRegex: { id: '26EC', source: 'Bahamut Prime' },
      preRun: (data) => data.mornAfahCount++,
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.mornAfahYou({ num: data.mornAfahCount });
        return output.mornAfahPlayer({
          num: data.mornAfahCount,
          player: data.party.member(matches.target),
        });
      },
      outputStrings: {
        mornAfahYou: {
          en: 'Morn Afah #${num} (YOU)',
          de: 'Morn Afah #${num} (DU)',
          fr: 'Morn Afah #${num} (VOUS)',
          ja: 'モーン・アファー${num}回 (自分)',
          cn: '无尽顿悟 #${num}',
          ko: '몬 아파 ${num} (내게)',
        },
        mornAfahPlayer: {
          en: 'Morn Afah #${num} (${player})',
          de: 'Morn Afah #${num} (${player})',
          fr: 'Morn Afah #${num} (${player})',
          ja: 'モーン・アファー${num}回 (${player})',
          cn: '无尽顿悟 #${num} (${player})',
          ko: '몬 아파 ${num} (${player})',
        },
      },
    },
    {
      id: 'UCU Akh Morn',
      type: 'StartsUsing',
      netRegex: { id: '26EA', source: 'Bahamut Prime', capture: false },
      preRun: (data) => {
        data.akhMornCount++;
      },
      infoText: (data, _matches, output) => output.text({ num: data.akhMornCount }),
      outputStrings: {
        text: {
          en: 'Akh Morn #${num}',
          de: 'Akh Morn #${num}',
          fr: 'Akh Morn #${num}',
          ja: 'アク・モーン #${num}',
          cn: '死亡轮回 #${num}',
          ko: '아크 몬 ${num}',
        },
      },
    },
    {
      id: 'UCU Exaflare Direction',
      type: 'StartsUsingExtra',
      netRegex: { id: '26F0', capture: true },
      suppressSeconds: 20,
      infoText: (_data, matches, output) => {
        const towardsDirNum = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        const towardsDir = Directions.outputFrom8DirNum(towardsDirNum);
        const startDir = Directions.outputFrom8DirNum((towardsDirNum + 4) % 8);
        return output.text({
          dir1: output[startDir](),
          dir2: output[towardsDir](),
        });
      },
      tts: (_data, matches, output) => {
        const towardsDirNum = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        const towardsDir = Directions.outputFrom8DirNum(towardsDirNum);
        const startDir = Directions.outputFrom8DirNum((towardsDirNum + 4) % 8);
        return output.tts({
          dir1: output[startDir](),
          dir2: output[towardsDir](),
        });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        text: {
          en: 'Exaflares ${dir1} -> ${dir2}',
        },
        tts: {
          en: 'Exaflares ${dir1} towards ${dir2}',
        },
      },
    },
    {
      id: 'UCU Morn Afah Enrage Spread Warning',
      type: 'StartsUsing',
      netRegex: { id: '26ED', source: 'Bahamut Prime', capture: false },
      alarmText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread (Enrage)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Bahamut Prime': 'Prim-Bahamut',
        'Fang Of Light': 'Lichtklaue',
        'Firehorn': 'Feuerhorn',
        'Iceclaw': 'Eisklaue',
        'Nael Geminus': 'Nael Geminus',
        'Nael deus Darnus': 'Nael deus Darnus',
        'Phoenix': 'Phönix',
        'Ragnarok': 'Ragnarök',
        'Tail Of Darkness': 'Dunkelschweif',
        'Thunderwing': 'Donnerschwinge',
        'Twintania': 'Twintania',
      },
      'replaceText': {
        '--push--': '--stoß--',
        'Aetheric Profusion': 'Ätherische Profusion',
        'Akh Morn': 'Akh Morn',
        'Bahamut Marker': 'Bahamut Markierung',
        'Bahamut\'s Claw': 'Klauen Bahamuts',
        'Bahamut\'s Favor': 'Bahamuts Segen',
        'Blackfire Trio': 'Schwarzfeuer-Trio',
        'Calamitous Blaze': 'Katastrophale Lohe',
        'Calamitous Flame': 'Katastrophale Flammen',
        'Cauterize': 'Kauterisieren',
        'Chain Lightning': 'Kettenblitz',
        'Dalamud Dive': 'Dalamud-Sturzflug',
        'Death Sentence': 'Todesurteil',
        'Dive . Dynamo/Chariot': 'Sturzflug + Dynamo/Streitwagen',
        'Dive Dynamo Combo': 'Sturzflug Dynamo Kombo',
        'Doom': 'Verhängnis',
        'Dynamo . Beam/Chariot': 'Dynamo + Strahl/Streitwagen',
        'Earth Shaker': 'Erdstoß',
        'Exaflare': 'Exaflare',
        'Fellruin Trio': 'Untergangs-Trio',
        'Fireball': 'Feuerball',
        'Flames Of Rebirth': 'Flammen der Wiedergeburt',
        'Flare Breath': 'Flare-Atem',
        'Flatten': 'Einebnen',
        'Generate': 'Formung',
        'Gigaflare': 'Gigaflare',
        'Grand Octet': 'Großes Oktett',
        'Heavensfall Trio': 'Himmelssturz-Trio',
        'Heavensfall(?! )': 'Himmelssturz',
        'Hypernova': 'Supernova',
        'Iron Chariot': 'Eiserner Streitwagen',
        'Liquid Hell': 'Höllenschmelze',
        'Lunar Dive': 'Lunarer Sturz',
        'Lunar Dynamo': 'Lunarer Dynamo',
        '(?<! )Marker(?!\\w)': 'Markierung',
        'Megaflare Dive': 'Megaflare-Sturz',
        'Megaflare(?! Dive)': 'Megaflare',
        'Meteor Stream': 'Meteorflug',
        'Meteor/Dive or Dive/Beam': 'Meteor/Sturzflug oder Sturzflug/Strahl',
        'Morn Afah': 'Morn Afah',
        'Nael Marker': 'Nael Markierung',
        'Pepperoni': 'Megaflare Markierung',
        'Plummet(?!/)': 'Herabstürzen',
        'Quickmarch Trio': 'Todesmarsch-Trio',
        'Random Combo Attack': 'Zufälliger Komboangriff',
        '(?<!/)Ravensbeak': 'Bradamante',
        'Raven Dive': 'Bahamuts Schwinge',
        'Seventh Umbral Era': 'Siebte Ära des Schattens',
        'Spread': 'Verteilen',
        'Stack': 'Sammeln',
        'Targeted Fire': 'Gezieltes Feuer',
        'Tempest Wing': 'Sturm-Schwinge',
        'Tenstrike Trio': 'Zehnschlag-Trio',
        'Teraflare': 'Teraflare',
        'Thermionic . Dynamo/Chariot': 'Thermo + Dynamo/Streitwagen',
        'Thermionic Beam': 'Thermionischer Strahl',
        'Thermionic Burst': 'Thermionische Eruption',
        'Towers': 'Türme',
        'Triple Nael Quote': 'Dreifaches Nael Zitat',
        'Twin Marker': 'Twintania Markierung',
        'Twister': 'Wirbelsturm',
        'Twisting Dive': 'Spiralschwinge',
        'Wings Of Salvation': 'Rettende Schwinge',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Bahamut Prime': 'Primo-Bahamut',
        'Fang Of Light': 'croc de lumière',
        'Firehorn': 'corne-de-feu',
        'Iceclaw': 'griffe-de-glace',
        'Nael Deus Darnus': 'Nael deus Darnus',
        'Nael Geminus': 'Nael Geminus',
        'Ragnarok': 'Ragnarok',
        'Tail Of Darkness': 'queue de ténèbres',
        'Thunderwing': 'aile-de-foudre',
        'Twintania': 'Gémellia',
      },
      'replaceText': {
        '--push--': '--poussé(e)--',
        'Aetheric Profusion': 'Excès d\'éther',
        'Akh Morn': 'Akh Morn',
        'Bahamut Marker': 'Marqueur de Bahamut',
        'Bahamut\'s Claw': 'Griffe de Bahamut',
        'Bahamut\'s Favor': 'Auspice du dragon',
        'Blackfire Trio': 'Trio des flammes noires',
        'Calamitous Blaze': 'Brasier du Fléau',
        'Calamitous Flame': 'Flammes du Fléau',
        'Cauterize': 'Cautérisation',
        'Chain Lightning': 'Chaîne d\'éclairs',
        'Dalamud Dive': 'Chute de Dalamud',
        'Death Sentence': 'Peine de mort',
        'Dive \\+ Dynamo/Chariot': 'Plongeon + Dynamo/Char',
        'Dive Dynamo Combo': 'Combo Plongeon Dynamo',
        'Doom': 'Glas',
        'Dynamo \\+ Beam/Chariot': 'Dynamo + Rayon/Char',
        'Earth Shaker': 'Secousse',
        'Exaflare': 'ExaBrasier',
        'Fellruin Trio': 'Trio du désastre',
        'Fireball': 'Boule de feu',
        'Flames Of Rebirth': 'Feu résurrecteur',
        'Flare Breath': 'Souffle brasier',
        'Flatten': 'Compression',
        'Generate': 'Synthèse de mana',
        'Gigaflare': 'GigaBrasier',
        'Grand Octet': 'Octuors des dragons',
        'Heavensfall Trio': 'Trio de l\'univers',
        'Heavensfall(?! Trio)': 'Destruction Universelle',
        'Hypernova': 'Hypernova',
        'Iron Chariot': 'Char de fer',
        'Liquid Hell': 'Enfer liquide',
        'Lunar Dive': 'Plongeon lunaire',
        'Lunar Dynamo': 'Dynamo lunaire',
        '(?<! )Marker(?!\\w)': 'Marqueur',
        'Megaflare(?! Dive)': 'MégaBrasier',
        'Megaflare Dive': 'Plongeon MégaBrasier',
        'Meteor Stream': 'Rayon météore',
        'Meteor/Dive or Dive/Beam': 'Météore/Plongeon ou Plongeon/Rayon',
        'Morn Afah': 'Morn Afah',
        'Nael Marker': 'Marqueur de Nael',
        'Pepperoni': 'Zones au sol',
        'Plummet': 'Piqué',
        'Quickmarch Trio': 'Trio de la marche militaire',
        'Random Combo Attack': 'Combo d\'attaque aléatoire',
        'Ravensbeak': 'Bec du rapace',
        'Raven Dive': 'Fonte du rapace',
        'Seventh Umbral Era': '7e fléau',
        'Spread': 'Dispersion',
        'Stack': 'Package',
        'Targeted Fire': 'Feu ciblé',
        'Tempest Wing': 'Aile de tempête',
        'Tenstrike Trio': 'Trio des attaques',
        'Teraflare': 'TéraBrasier',
        'Thermionic \\+ Dynamo/Chariot': 'Rayon + Dynamo/Char',
        'Thermionic Beam': 'Rayon thermoïonique',
        'Thermionic Burst': 'Rafale thermoïonique',
        'Towers': 'Tours',
        'Triple Nael Quote': 'Triple citation de Nael',
        'Twin Marker': 'Marqueur de Gémellia',
        'Twister': 'Grande trombe',
        'Twisting Dive': 'Plongeon-trombe',
        'Wings Of Salvation': 'Aile de la salvation',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Bahamut Prime': 'バハムート・プライム',
        'Fang Of Light': 'ライトファング',
        'Firehorn': 'ファイアホーン',
        'Iceclaw': 'アイスクロウ',
        'Nael Deus Darnus': 'ネール・デウス・ダーナス',
        'Nael Geminus': 'ネール・ジェミナス',
        'Ragnarok': 'ラグナロク',
        'Tail Of Darkness': 'ダークテイル',
        'Thunderwing': 'サンダーウィング',
        'Twintania': 'ツインタニア',
      },
      'replaceText': {
        '--push--': '--フェイス切替--',
        'Aetheric Profusion': 'エーテリックプロフュージョン',
        'Akh Morn': 'アク・モーン',
        'Bahamut Marker': 'バハムート マーク',
        'Bahamut\'s Claw': 'バハムートクロウ',
        'Bahamut\'s Favor': '龍神の加護',
        'Blackfire Trio': '黒炎の三重奏',
        'Calamitous Blaze': '災いの焔',
        'Calamitous Flame': '災いの炎',
        'Cauterize': 'カータライズ',
        'Chain Lightning': 'チェインライトニング',
        'Dalamud Dive': 'ダラガブダイブ',
        'Death Sentence': 'デスセンテンス',
        'Dive . Dynamo/Chariot': 'ダイブ + ダイナモ/チャリオット',
        'Dive Dynamo Combo': 'ダイブ ダイナモ コンボ',
        'Doom': '死の宣告',
        'Dynamo . Beam/Chariot': 'ダイナモ + ビーム/チャリオット',
        'Earth Shaker': 'アースシェイカー',
        'Exaflare': 'エクサフレア',
        'Fellruin Trio': '厄災の三重奏',
        'Fireball(?! Soak)': 'ファイアボール',
        'Flames Of Rebirth': '転生の炎',
        'Flare Breath': 'フレアブレス',
        'Flatten': 'フラッテン',
        'Generate': '魔力錬成',
        'Gigaflare': 'ギガフレア',
        'Grand Octet': '群竜の八重奏',
        'Heavensfall Trio': '天地の三重奏',
        'Heavensfall(?! )': '天地崩壊',
        'Hypernova': 'スーパーノヴァ',
        'Liquid Hell': 'ヘルリキッド',
        'Lunar Dive': 'ルナダイブ',
        '(?<! )Marker(?!\\w)': 'マーク',
        'Megaflare(?! Dive)': 'メガフレア',
        'Megaflare Dive': 'メガフレアダイブ',
        'Meteor Stream': 'メテオストリーム',
        'Meteor/Dive or Dive/Beam': 'メテオ/ダイブ や ダイブ/ビーム',
        'Morn Afah': 'モーン・アファー',
        'Nael Marker': 'ネール マーク',
        'Pepperoni': '輪',
        'Plummet(?!\/)': 'プラメット',
        'Quickmarch Trio': '進軍の三重奏',
        'Random Combo Attack': 'ランダムコンボ',
        '(?<!\/)Ravensbeak': 'レイヴェンズビーク',
        'Seventh Umbral Era': '第七霊災',
        'Spread': '散開',
        'Stack': '集合',
        'Targeted Fire': 'タゲしたファイヤ',
        'Tempest Wing': 'テンペストウィング',
        'Tenstrike Trio': '連撃の三重奏',
        'Teraflare': 'テラフレア',
        'Thermionic . Dynamo/Chariot': 'サーミオニック + ダイナモ/チャリオット',
        'Thermionic Beam': 'サーミオニックビーム',
        'Thermionic Burst': 'サーミオニックバースト',
        'Towers': '塔',
        'Triple Nael Quote': '三体の黒玉',
        'Twin Marker': 'Twin Marker',
        'Twister': 'ツイスター',
        'Twisting Dive': 'ツイスターダイブ',
        'Wings Of Salvation': 'サルヴェーションウィング',
      },
    },
    {
      'locale': 'cn',
      'missingTranslations': true,
      'replaceSync': {
        'Bahamut Prime': '至尊巴哈姆特',
        'Fang Of Light': '光牙',
        'Firehorn': '火角',
        'Iceclaw': '冰爪',
        'Nael Deus Darnus': '奈尔·神·达纳斯',
        'Nael Geminus': '奈尔双生子',
        'Ragnarok': '诸神黄昏',
        'Tail Of Darkness': '暗尾',
        'Thunderwing': '雷翼',
        'Twintania': '双塔尼亚',
      },
      'replaceText': {
        '--push--': '--开怪--',
        'Aetheric Profusion': '以太失控',
        'Akh Morn': '死亡轮回',
        'Bahamut Marker': '巴哈标记',
        'Bahamut\'s Claw': '巴哈姆特之爪',
        'Bahamut\'s Favor': '龙神的加护',
        'Blackfire Trio': '黑炎的三重奏',
        'Calamitous Blaze': '灵灾之焰',
        'Calamitous Flame': '灵灾之炎',
        'Cauterize': '低温俯冲',
        'Chain Lightning': '雷光链',
        'Dalamud Dive': '月华冲',
        'Death Sentence': '死刑',
        'Dive . Dynamo/Chariot': '冲 + 月环/钢铁',
        'Dive Dynamo Combo': '冲月环连招',
        'Doom': '死亡宣告',
        'Dynamo . Beam/Chariot': '月环 + 光束/钢铁',
        'Earth Shaker': '大地摇动',
        'Exaflare': '百京核爆',
        'Fellruin Trio': '灾厄的三重奏',
        'Fireball(?! Soak)': '火球',
        'Flames Of Rebirth': '转生之炎',
        'Flare Breath': '核爆吐息',
        'Flatten': '夷为平地',
        'Generate': '魔力炼成',
        'Gigaflare': '十亿核爆',
        'Grand Octet': '群龙的八重奏',
        'Heavensfall Trio': '天地的三重奏',
        'Heavensfall(?! )': '天崩地裂',
        'Hypernova': '超新星',
        'Liquid Hell': '液体地狱',
        'Lunar Dive': '月流冲',
        '(?<! )Marker(?!\\w)': '标记',
        'Megaflare(?! Dive)': '百万核爆',
        'Megaflare Dive': '百万核爆冲',
        'Meteor Stream': '陨石流',
        'Meteor/Dive or Dive/Beam': '陨石/冲 或 冲/光束',
        'Morn Afah': '无尽顿悟',
        'Nael Marker': '奈尔标记',
        'Pepperoni': '大圈',
        'Plummet(?!\/)': '垂直下落',
        'Quickmarch Trio': '进军的三重奏',
        'Random Combo Attack': '随机连招',
        '(?<!\/)Ravensbeak': '凶鸟尖喙',
        'Seventh Umbral Era': '第七灵灾',
        'Spread': '分散',
        'Stack': '集合',
        'Targeted Fire': '火球点名',
        'Tempest Wing': '风暴之翼',
        'Tenstrike Trio': '连击的三重奏',
        'Teraflare': '万亿核爆',
        'Thermionic . Dynamo/Chariot': '离子 + 月环/钢铁',
        'Thermionic Beam': '热离子光束',
        'Thermionic Burst': '热离子爆发',
        'Towers': '塔',
        'Triple Nael Quote': '奈尔台词三连',
        'Twin Marker': '双塔标记',
        'Twister': '旋风',
        'Twisting Dive': '旋风冲',
        'Wings Of Salvation': '救世之翼',
      },
    },
    {
      'locale': 'ko',
      'missingTranslations': true,
      'replaceSync': {
        'Bahamut Prime': '바하무트 프라임',
        'Fang Of Light': '빛의 송곳니',
        'Firehorn': '화염뿔',
        'Iceclaw': '얼음발톱',
        'Nael Deus Darnus': '넬 데우스 다르누스',
        'Nael Geminus': '넬 게미누스',
        'Ragnarok': '라그나로크',
        'Tail Of Darkness': '어둠의 꼬리',
        'Thunderwing': '번개날개',
        'Twintania': '트윈타니아',
      },
      'replaceText': {
        '--push--': '--최소 RDPS컷--',
        'Aetheric Profusion': '에테르 홍수',
        'Akh Morn': '아크 몬',
        'Bahamut Marker': '바하무트 징',
        'Bahamut\'s Claw': '바하무트의 발톱',
        'Bahamut\'s Favor': '용신의 가호',
        'Blackfire Trio': '흑염의 3중주',
        'Calamitous Blaze': '재앙의 화염',
        'Calamitous Flame': '재앙의 불꽃',
        'Cauterize': '인두질',
        'Chain Lightning': '번개 사슬',
        'Dalamud Dive': '달라가브 강하',
        'Death Sentence': '사형 선고',
        'Dive . Dynamo/Chariot': '강하 + 달/강철',
        'Dive Dynamo Combo': '강하 달 콤보',
        'Doom': '죽음의 선고',
        'Dynamo . Beam/Chariot': '달 + 광선/강철',
        'Earth Shaker': '요동치는 대지',
        'Exaflare': '엑사플레어',
        'Fellruin Trio': '재앙의 3중주',
        'Fireball(?! Soak)': '화염구',
        'Flames Of Rebirth': '윤회의 불꽃',
        'Flare Breath': '타오르는 숨결',
        'Flatten': '짓뭉개기',
        'Generate': '마력 연성',
        'Gigaflare': '기가플레어',
        'Grand Octet': '용들의 8중주',
        'Heavensfall Trio': '천지의 3중주',
        'Heavensfall(?! )': '천지붕괴(?! )',
        'Hypernova': '초신성',
        'Liquid Hell': '지옥의 늪',
        'Lunar Dive': '달 강하',
        '(?<! )Marker(?!\\w)': '징',
        'Megaflare(?! Dive)': '메가플레어',
        'Megaflare Dive': '메가플레어 다이브',
        'Meteor Stream': '유성 폭풍',
        'Meteor/Dive or Dive/Beam': '유성/강하 or 강하/광선',
        'Morn Afah': '몬 아파',
        'Nael Marker': '넬 징',
        'Pepperoni': '메가플레어 장판',
        'Plummet(?!\/)': '곤두박질',
        'Quickmarch Trio': '진군의 3중주',
        'Random Combo Attack': '랜덤 콤보 공격',
        '(?<!\/)Ravensbeak': '흉조의 부리',
        'Seventh Umbral Era': '제7재해',
        'Spread': '산개',
        'Stack': '모이기',
        'Targeted Fire': '대상자 화염구',
        'Tempest Wing': '폭풍우 날개',
        'Tenstrike Trio': '연격의 3중주',
        'Teraflare': '테라플레어',
        'Thermionic . Dynamo/Chariot': '열전자 + 달/강철',
        'Thermionic Beam': '열전자 광선',
        'Thermionic Burst': '열전자 폭발',
        'Towers': '기둥',
        'Triple Nael Quote': '넬 3회 대사',
        'Twin Marker': '트윈 징',
        'Twister': '회오리',
        'Twisting Dive': '회오리 강하',
        'Wings Of Salvation': '구원의 날개',
      },
    },
  ],
});
