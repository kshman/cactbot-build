const centerX = 100;
const centerY = 100;
const eminentReign1 = 'A911'; // N=>S, SW=>NE, SE=>NW
const eminentReign2 = 'A912'; // S=>N, NW=>SE, NE=>SW
const revolutionaryReign1 = 'A913'; // N=>S, SW=>NE, SE=>NW
const revolutionaryReign2 = 'A914'; // S=>N, NW=>SE, NE=>SW
const phaseMap = {
  'A3C8': 'adds',
  'A3CB': 'rage',
  'A3C1': 'moonlight', // Beckon Moonlight
};
const headMarkerData = {
  // Shared tankbuster marker
  'tankbuster': '0256',
  // Adds red headmarker showing you will be targeted by Predation
  'predation': '0017',
  // Stony tether from Wolf of Stone
  'stoneTether': '014F',
  // Windy Tether from Wolf of Wind
  'windTether': '0150',
  // Big, pulsing, 4-arrow stack marker
  'eightHitStack': '013C',
  // Spread marker used in Terrestial Rage and Beckon Moonlight
  'spread': '008B',
  // Stack marker used in Terrestial Rage and Beckon Moonlight
  'stack': '005D',
};
const stoneWindOutputStrings = {
  stoneWindNum: {
    en: '${debuff} ${num}',
    ko: '${debuff} ${num}',
  },
  stone: {
    en: 'Stone',
    ko: '돌',
  },
  wind: {
    en: 'Wind',
    ko: '바람',
  },
  unknown: Outputs.unknown,
};
Options.Triggers.push({
  id: 'AacCruiserweightM4Savage',
  zoneId: ZoneId.AacCruiserweightM4Savage,
  timelineFile: 'r8s.txt',
  initData: () => ({
    phase: 'one',
    decayAddCount: 0,
    packPredationTracker: 0,
    packPredationTargets: [],
    surgeTracker: 0,
    isFirstRage: true,
  }),
  triggers: [
    {
      id: 'R8S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phaseMap), source: 'Howling Blade' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const phase = phaseMap[matches.id];
        if (phase === undefined)
          throw new UnreachableCode();
        data.phase = phase;
      },
    },
    {
      id: 'R8S Extraplanar Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3DA', source: 'Howling Blade', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Windfang/Stonefang',
      type: 'StartsUsing',
      netRegex: { id: ['A39E', 'A39D', 'A3A1', 'A3A2'], source: 'Howling Blade', capture: true },
      infoText: (_data, matches, output) => {
        const windfangCards = 'A39D';
        const windfangInter = 'A39E';
        const stonefangCards = 'A3A1';
        const stonefangInter = 'A3A2';
        // A39F is cast for both A39D (card windfang) and A39E (intercard windfang)
        // A3B0 is cast for both A3A1 (card stonefang) and A3A2 (intercard stonefang)
        switch (matches.id) {
          case windfangCards:
            return output.inInterCardsPartners();
          case windfangInter:
            return output.inCardsPartners();
          case stonefangCards:
            return output.outInterCardsProtean();
          case stonefangInter:
            return output.outCardsProtean();
        }
      },
      outputStrings: {
        inCardsPartners: {
          en: 'In + Cards + Partners',
          ko: '십자 안으로 + 둘이 페어',
        },
        inInterCardsPartners: {
          en: 'In + Intercards + Partners',
          ko: '비스듬 안으로 + 둘이 페어',
        },
        outCardsProtean: {
          en: 'Out + Cards + Protean',
          ko: '십자 바깥으로 + 맡은 자리로',
        },
        outInterCardsProtean: {
          en: 'Out + InterCards + Protean',
          ko: '비스듬 바깥으로 + 맡은 자리로',
        },
      },
    },
    {
      id: 'R8S Eminent/Revolutionary Reign',
      type: 'StartsUsing',
      netRegex: { id: ['A911', 'A912', 'A913', 'A914'], source: 'Howling Blade', capture: true },
      infoText: (_data, matches, output) => {
        switch (matches.id) {
          case eminentReign1:
          case eminentReign2:
            return output.inLater();
          case revolutionaryReign1:
          case revolutionaryReign2:
            return output.outLater();
        }
      },
      outputStrings: {
        inLater: {
          en: '(In Later)',
          ko: '(나중에 안으로)',
        },
        outLater: {
          en: '(Out Later)',
          ko: '(나중에 바깥으로)',
        },
      },
    },
    {
      id: 'R8S Eminent/Revolutionary Reign Direction',
      type: 'StartsUsing',
      netRegex: { id: ['A911', 'A912', 'A913', 'A914'], source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) + 1.2,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined) {
          console.error(
            `R8S Eminent/Revolutionary Reign Direction: Wrong actor count ${actors.length}`,
          );
          return;
        }
        switch (matches.id) {
          case eminentReign1:
          case eminentReign2:
            data.reignDir = (Directions.hdgTo8DirNum(actor.Heading) + 4) % 8;
            break;
          case revolutionaryReign1:
          case revolutionaryReign2:
            data.reignDir = Directions.hdgTo8DirNum(actor.Heading);
            break;
        }
      },
      infoText: (data, matches, output) => {
        const dir = output[Directions.outputFrom8DirNum(data.reignDir ?? -1)]();
        switch (matches.id) {
          case eminentReign1:
          case eminentReign2:
            return output.inDir({ dir: dir });
          case revolutionaryReign1:
          case revolutionaryReign2:
            return output.outDir({ dir: dir });
        }
      },
      run: (data) => {
        data.reignDir = undefined;
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        inDir: {
          en: 'In ${dir}',
          ko: '안으로 ${dir}',
        },
        outDir: {
          en: 'Out ${dir}',
          ko: '바깥으로 ${dir}',
        },
      },
    },
    {
      id: 'R8S Millenial Decay',
      type: 'StartsUsing',
      netRegex: { id: 'A3B2', source: 'Howling Blade', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Aero III',
      type: 'StartsUsing',
      netRegex: { id: 'A3B7', source: 'Howling Blade', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'R8S Titanic Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3C7', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Tracking Tremors',
      type: 'StartsUsing',
      netRegex: { id: 'A3B9', source: 'Howling Blade', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          de: 'Sammeln x8',
          fr: 'Package x8',
          ja: '頭割り x8',
          cn: '8次分摊',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Breath of Decay Rotation',
      type: 'StartsUsing',
      netRegex: { id: 'A3B4', source: 'Wolf of Wind', capture: true },
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        // 1st add always spawns N or S, and 2nd add always spawns intercardinal
        // we only need the position of the 2nd add to determine rotation
        data.decayAddCount++;
        if (data.decayAddCount !== 2)
          return;
        const addX = parseFloat(matches.x);
        const addY = parseFloat(matches.y);
        const addDir = Directions.xyTo8DirNum(addX, addY, centerX, centerY);
        if (addDir === 1 || addDir === 5)
          return output.clockwise();
        else if (addDir === 3 || addDir === 7)
          return output.counterclockwise();
      },
      outputStrings: {
        clockwise: {
          en: '<== Clockwise',
          ko: '❰❰❰시계방향',
        },
        counterclockwise: {
          en: 'Counterclockwise ==>',
          ko: '반시계방향❱❱❱',
        },
      },
    },
    {
      id: 'R8S Tactical Pack Tethers',
      // TODO: Call East/West instead of add?
      type: 'Tether',
      netRegex: { id: [headMarkerData.stoneTether, headMarkerData.windTether], capture: true },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, matches, output) => {
        if (matches.id === headMarkerData.stoneTether)
          return output.side({ wolf: output.wolfOfWind() });
        return output.side({ wolf: output.wolfOfStone() });
      },
      outputStrings: {
        wolfOfWind: {
          en: 'Green',
          ko: '녹색',
        },
        wolfOfStone: {
          en: 'Yellow',
          ko: '노란색',
        },
        side: {
          en: '${wolf} Side',
          ko: '${wolf} 옆으로',
        },
      },
    },
    {
      id: 'R8S Tactical Pack Debuffs',
      // Durations could be 21s, 37s, or 54s
      type: 'GainsEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: (data, matches) => {
        return data.me === matches.target && data.phase === 'adds';
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = stoneWindOutputStrings;
        // 1127 = Stone (Yellow Cube) Debuff
        // 1128 = Wind (Green Sphere) Debuff
        const cubeDebuffId = '1127';
        data.stoneWindDebuff = matches.effectId === cubeDebuffId ? 'stone' : 'wind';
        if (parseFloat(matches.duration) < 22) {
          data.stoneWindCallGroup = 1;
        } else if (parseFloat(matches.duration) < 38) {
          data.stoneWindCallGroup = 2;
        } else {
          data.stoneWindCallGroup = 3;
        }
        return {
          infoText: output.stoneWindNum({
            debuff: output[data.stoneWindDebuff](),
            num: data.stoneWindCallGroup,
          }),
        };
      },
    },
    {
      // headmarkers with casts:
      // A3CF (Pack Predation) from Wolf of Wind
      // A3E4 (Pack Predation) from Wolf of Stone
      // Simultaneously highest aggro gets cleaved:
      // A3CD (Alpha Wind) from Wolf of Wind
      // A3E2 (Alpha Wind) from Wolf of Stone
      id: 'R8S Pack Predation',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.predation },
      infoText: (data, matches, output) => {
        data.packPredationTargets.push(matches.target);
        if (data.packPredationTargets.length < 2)
          return;
        // Increment count for group tracking
        data.packPredationTracker = data.packPredationTracker + 1;
        const name1 = data.party.member(data.packPredationTargets[0]);
        const name2 = data.party.member(data.packPredationTargets[1]);
        return output.predationOnPlayers({ player1: name1, player2: name2 });
      },
      run: (data) => {
        if (data.packPredationTargets.length >= 2)
          data.packPredationTargets = [];
      },
      outputStrings: {
        predationOnPlayers: {
          en: 'Predation on ${player1} and ${player2}',
          ko: '포식: ${player1}, ${player2}',
        },
      },
    },
    {
      id: 'R8S Tactical Pack First Pop',
      // infoText as we do not know who should pop first
      // These will trigger the following spells on cleanse
      // A3EE (Sand Surge) from Font of Earth Aether
      // A3ED (Wind Surge) from Font of Wind Aether
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      condition: (data, matches) => data.phase === 'adds' && parseFloat(matches.duration) < 2,
      // Magic Vulnerabilities from Pack Predation and Alpha Wind are 0.96s
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.stoneWindCallGroup === data.packPredationTracker) {
          return output.stoneWindNum({
            debuff: output[data.stoneWindDebuff ?? 'unknown'](),
            num: data.stoneWindCallGroup,
          });
        }
      },
      outputStrings: stoneWindOutputStrings,
    },
    {
      id: 'R8S Tactical Pack Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.stoneWindCallGroup = undefined,
    },
    {
      id: 'R8S Tactical Pack Second Pop',
      // Timing based on Tether and Magic Vulnerability (3.96s)
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      condition: (data, matches) => {
        return data.phase === 'adds' && parseFloat(matches.duration) > 2;
      },
      preRun: (data) => data.surgeTracker = data.surgeTracker + 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      alarmText: (data, _matches, output) => {
        const surge = data.surgeTracker;
        if (data.stoneWindCallGroup === data.packPredationTracker) {
          if (surge === 1 || surge === 3 || surge === 5) {
            return output.stoneWindNum({
              debuff: output[data.stoneWindDebuff ?? 'unknown'](),
              num: data.stoneWindCallGroup,
            });
          }
        }
      },
      outputStrings: stoneWindOutputStrings,
    },
    {
      id: 'R8S Spread/Stack Collect',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.stack, headMarkerData.spread] },
      run: (data, matches) => {
        const id = matches.id;
        const target = matches.target;
        if (headMarkerData.stack === id)
          data.stackOnPlayer = target;
        if (headMarkerData.spread === id && target === data.me)
          data.hasSpread = true;
      },
    },
    {
      id: 'R8S Terrestrial Rage Spread/Stack',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.stack, headMarkerData.spread], capture: false },
      condition: (data) => data.phase === 'rage',
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.hasSpread)
          return data.isFirstRage ? output.spreadThenStack() : output.spread();
        if (data.stackOnPlayer === data.me)
          return data.isFirstRage
            ? output.stackThenSpread({
              stack: output.stackOnYou(),
            })
            : output.stackOnYou();
        if (data.stackOnPlayer !== undefined) {
          const name = data.party.member(data.stackOnPlayer);
          return data.isFirstRage
            ? output.stackThenSpread({
              stack: output.stackOnPlayer({ player: name }),
            })
            : output.stackOnPlayer({ player: name });
        }
      },
      run: (data) => {
        data.stackOnPlayer = undefined;
        data.hasSpread = undefined;
        data.isFirstRage = false;
      },
      outputStrings: {
        spreadThenStack: Outputs.spreadThenStack,
        stackThenSpread: {
          en: '${stack} => Spread',
          ko: '${stack} 🔜 흩어져요',
        },
        spread: Outputs.spread,
        stackOnPlayer: Outputs.stackOnPlayer,
        stackOnYou: Outputs.stackOnYou,
      },
    },
    {
      id: 'R8S Shadowchase',
      // Only need one of the 5 actors to determine pattern
      // Ids are sequential, starting 2 less than the boss
      // Two patterns (in order of IDs):
      // S, WSW, NW, NE, ESE
      // N, ENE, SE, SW, WNW
      // TODO: Split the call for if have stack/spread
      type: 'StartsUsing',
      netRegex: { id: 'A3BC', source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) + 2.9,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16) - 2],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined) {
          console.error(`R8S Shadowchase Direction: Wrong actor count ${actors.length}`);
          return;
        }
        data.shadowchase = Directions.xyTo16DirNum(actor.PosX, actor.PosY, centerX, centerY);
      },
      infoText: (data, _matches, output) => {
        if (data.shadowchase === 0)
          return output.orientN();
        if (data.shadowchase === 8)
          return output.orientNE();
      },
      run: (data) => {
        data.shadowchase = undefined;
      },
      outputStrings: {
        orientN: {
          en: 'Orient N, Behind Clone',
          ko: '북쪽 기준, 클론 뒤로',
        },
        orientNE: {
          en: 'Orient NE, Behind Clone',
          ko: '북동쪽 기준, 클론 뒤로',
        },
      },
    },
    {
      id: 'R8S Shadowchase Rotate',
      // Call to move behind Dragon Head after clones dash
      type: 'StartsUsing',
      netRegex: { id: 'A3BD', source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => {
        return output.rotate();
      },
      outputStrings: {
        rotate: {
          en: 'Rotate',
          ko: '돌아요',
        },
      },
    },
    {
      id: 'R8S Weal of Stone',
      // Calls direction that the heads are firing from
      type: 'StartsUsing',
      netRegex: { id: 'A78E', source: 'Wolf of Stone', capture: true },
      suppressSeconds: 1,
      infoText: (_data, matches, output) => {
        const hdg = parseFloat(matches.heading);
        const dirOut = Directions.outputFrom8DirNum((Directions.hdgTo8DirNum(hdg) + 4) % 8);
        return output.linesFromDir({ dir: output[dirOut]() });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        linesFromDir: {
          en: 'Lines from ${dir}',
          ko: '${dir}에서 줄',
        },
      },
    },
    {
      id: 'R8S Beckon Moonlight Spread/Stack',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.stack, headMarkerData.spread], capture: false },
      condition: (data) => data.phase === 'moonlight',
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.hasSpread)
          return data.isFirstRage ? output.spreadThenStack() : output.spread();
        if (data.stackOnPlayer === data.me)
          return data.isFirstRage
            ? output.stackThenSpread({
              stack: output.stackOnYou(),
            })
            : output.stackOnYou();
        if (data.stackOnPlayer !== undefined) {
          const name = data.party.member(data.stackOnPlayer);
          return data.isFirstRage
            ? output.stackThenSpread({
              stack: output.stackOnPlayer({ player: name }),
            })
            : output.stackOnPlayer({ player: name });
        }
      },
      run: (data) => {
        data.stackOnPlayer = undefined;
        data.hasSpread = undefined;
        data.isFirstRage = false;
      },
      outputStrings: {
        spreadThenStack: Outputs.spreadThenStack,
        stackThenSpread: {
          en: '${stack} => Spread',
          ko: '${stack} 🔜 흩어져요',
        },
        spread: Outputs.spread,
        stackOnPlayer: Outputs.stackOnPlayer,
        stackOnYou: Outputs.stackOnYou,
      },
    },
    {
      id: 'R8S Weal of Stone Cardinals',
      // This appears to always be cardinals safe
      type: 'StartsUsing',
      netRegex: { id: 'A792', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => {
        return output.cardinals();
      },
      outputStrings: {
        cardinals: Outputs.cardinals,
      },
    },
  ],
});
