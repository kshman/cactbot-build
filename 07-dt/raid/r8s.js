const phases = {
  'A3C8': 'pack',
  'A3CB': 'saber',
  'A3C1': 'moonlight', // Beckon Moonlight
};
const fangIds = {
  'A39D': 'windPlus',
  'A39E': 'windCross',
  'A3A1': 'stonePlus',
  'A3A2': 'stoneCross',
};
const reignIds = {
  'A911': 'eminent1',
  'A912': 'eminent2',
  'A913': 'revolutionary1',
  'A914': 'revolutionary2',
};
const reignKeys = Object.keys(reignIds);
const swStrings = {
  combo: {
    en: '${debuff} ${num}',
    ko: '${debuff} ${num}번째',
  },
  stone: {
    en: 'Stone',
    ko: '🟡돌',
  },
  wind: {
    en: 'Wind',
    ko: '🟢바람',
  },
  unknown: Outputs.unknown,
};
const moonStrings = {
  safeQuad: {
    en: '${quad}',
    ko: '안전: ${quad}',
  },
  safeQuadrants: {
    en: '${quad1} => ${quad2}',
    ko: '안전: ${quad1} 🔜 ${quad2}',
  },
  ...AutumnDir.stringsMark,
};
const championStrings = {
  clockwise: Outputs.clockwise,
  counterclockwise: Outputs.counterclockwise,
  in: Outputs.in,
  out: Outputs.out,
  donut: {
    en: 'Donut',
    ko: '도넛',
  },
  sides: Outputs.sides,
  mechanics: {
    en: '(${dir}) ${mech1} => ${mech2} => ${mech3} => ${mech4} => ${mech5}',
    ko: '(${dir}) ${mech1} 🔜 ${mech2} 🔜 ${mech3} 🔜 ${mech4} 🔜 ${mech5}',
  },
  left: Outputs.left,
  right: Outputs.right,
  leftSide: {
    en: 'Left Side',
    ko: '왼쪽으로',
  },
  rightSide: {
    en: 'Right Side',
    ko: '오른쪽으로',
  },
  dirMechanic: {
    en: '${dir} ${mech}',
    ko: '${dir} ${mech}',
  },
};
const centerX = 100;
const centerY = 100;
Options.Triggers.push({
  id: 'AacCruiserweightM4Savage',
  zoneId: ZoneId.AacCruiserweightM4Savage,
  timelineFile: 'r8s.txt',
  initData: () => ({
    phase: 'door',
    decays: 0,
    galecnt: 0,
    packs: 0,
    surge: 0,
    moonindex: 0,
    moonbites: [],
    tfindex: 0,
    chindex: 0,
    platforms: 5,
    collect: [],
  }),
  timelineTriggers: [
    {
      id: 'R8S Light Party Platform',
      regex: /Quake III/,
      beforeSeconds: 7,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Light Party Platform',
          ko: '플랫폼에서 4:4',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Positions',
      regex: /Ultraviolent Ray [123]/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: 'UV 자리로',
        },
      },
    },
    {
      id: 'R8S Ultraviolent 4 Positions',
      regex: /Ultraviolent Ray 4/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: 'UV 자리로',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'R8S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Howling Blade' },
      suppressSeconds: 1,
      run: (data, matches) => {
        data.phase = phases[matches.id] ?? 'unknown';
        data.raged = false;
      },
    },
    {
      id: 'R8S Phase Tracker 2',
      type: 'Ability',
      netRegex: { id: 'A82D', source: 'Howling Blade', capture: false },
      suppressSeconds: 1,
      run: (data) => {
        data.phase = '2nd';
        data.collect = [];
      },
    },
    {
      id: 'R8S Extraplanar Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3DA', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Fangs',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(fangIds), source: 'Howling Blade', capture: true },
      infoText: (_data, matches, output) => {
        const fang = fangIds[matches.id];
        if (fang !== undefined)
          return output[fang]();
      },
      outputStrings: {
        windPlus: {
          en: 'In + Cardinal + Partners',
          ko: '➕안으로 + 둘이 페어',
        },
        windCross: {
          en: 'In + Intercards + Partners',
          ko: '❌안으로 + 둘이 페어',
        },
        stonePlus: {
          en: 'Out + Cardinal + Protean',
          ko: '➕바깥으로 + 맡은 자리로',
        },
        stoneCross: {
          en: 'Out + InterCards + Protean',
          ko: '❌바깥으로 + 맡은 자리로',
        },
      },
    },
    {
      id: 'R8S Reigns',
      type: 'StartsUsing',
      netRegex: { id: reignKeys, source: 'Howling Blade', capture: true },
      infoText: (_data, matches, output) => {
        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            return output.in();
          case 'revolutionary1':
          case 'revolutionary2':
            return output.out();
        }
      },
      outputStrings: {
        in: {
          en: '(In later)',
          ko: '(나중에 가까이)',
        },
        out: {
          en: '(Out later)',
          ko: '(나중에 멀리멀리)',
        },
      },
    },
    {
      id: 'R8S Reigns Direction',
      type: 'StartsUsing',
      netRegex: { id: reignKeys, source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) + 1.2,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            data.reign = AutumnDir.hdgNum8(actor.Heading, true);
            break;
          case 'revolutionary1':
          case 'revolutionary2':
            data.reign = AutumnDir.hdgNum8(actor.Heading);
            break;
        }
      },
      infoText: (data, matches, output) => {
        const mk = output[AutumnDir.markFromNum(data.reign ?? -1)]();
        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            return output.in({ dir: mk });
          case 'revolutionary1':
          case 'revolutionary2':
            return output.out({ dir: mk });
        }
      },
      run: (data) => data.reign = undefined,
      outputStrings: {
        in: {
          en: 'In ${dir}',
          ko: '${dir} 보스 가까이',
        },
        out: {
          en: 'Out ${dir}',
          ko: '${dir} 보스 멀리멀리',
        },
        ...AutumnDir.stringsMark,
      },
    },
    {
      id: 'R8S Millenial Decay',
      type: 'StartsUsing',
      netRegex: { id: 'A3B2', source: 'Howling Blade', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Breath of Decay Rotation',
      type: 'StartsUsing',
      netRegex: { id: 'A3B4', source: 'Wolf of Wind', capture: true },
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        // 1st add always spawns N or S, and 2nd add always spawns intercardinal
        // we only need the position of the 2nd add to determine rotation
        data.decays++;
        if (data.decays !== 2)
          return;
        const dir = AutumnDir.posConv8(matches.x, matches.y, centerX, centerY);
        if (dir === 1 || dir === 5)
          return output.clockwise();
        else if (dir === 3 || dir === 7)
          return output.counterclockwise();
      },
      outputStrings: {
        clockwise: {
          en: '<== Clockwise',
          ko: '❰❰❰왼쪽으로',
        },
        counterclockwise: {
          en: 'Counterclockwise ==>',
          ko: '오른쪽으로❱❱❱',
        },
      },
    },
    {
      id: 'R8S Aero III',
      // Happens twice, but Prowling Gale occurs simultaneously on the second one
      type: 'StartsUsing',
      netRegex: { id: 'A3B7', source: 'Howling Blade', capture: false },
      condition: Conditions.notAutumnOnly(),
      suppressSeconds: 16,
      response: Responses.knockback(),
    },
    {
      id: 'R8S Prowling Gale Tower/Tether',
      // Calls each tether or get towers
      // TODO: Support getting a tower and tether?
      type: 'Tether',
      netRegex: { id: '0039', capture: true },
      preRun: (data, matches) => {
        // Set galeTetherDirNum to avoid triggering tower call
        if (data.me === matches.target)
          data.galedir = -1;
        data.galecnt++;
      },
      promise: async (data, matches) => {
        if (data.me !== matches.target)
          return;
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        const dirNum = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        data.galedir = (dirNum + 4) % 8;
      },
      infoText: (data, matches, output) => {
        if (data.galedir !== undefined && data.me === matches.target) {
          // This will trigger for each tether a player has
          const dir = output[AutumnDir.markFromNum(data.galedir)]();
          return output.knockbackTetherDir({ dir: dir });
        }
        if (data.galedir === undefined && data.galecnt === 4)
          return output.knockbackTowers();
      },
      outputStrings: {
        knockbackTetherDir: {
          en: 'Knockback tether: ${dir}',
          ko: '줄 당겨요: ${dir}',
        },
        knockbackTowers: {
          en: 'Knockback Towers',
          ko: '타워로 넉백',
        },
        ...AutumnDir.stringsMark,
      },
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
          ja: '頭割り x8',
          cn: '8次分摊',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Great Divide',
      type: 'HeadMarker',
      netRegex: { id: '0256', capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R8S Howling Havoc',
      // There are two additional casts, but only the Wolf Of Stone cast one (A3DD) does damage
      // A3DC Howling Havoc from Wolf of Stone self-cast
      // A3DB Howling Havoc from Wolf of Wind self-cast
      type: 'StartsUsing',
      netRegex: { id: 'A3DD', source: 'Wolf Of Stone', capture: true },
      // 4.7s castTime
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      response: Responses.aoe(),
    },
    {
      id: 'R8S Tactical Pack Tethers',
      // TODO: Call East/West instead of add?
      type: 'Tether',
      netRegex: { id: ['014F', '0150'], capture: true },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, matches, output) => {
        if (matches.id === '014F')
          return output.side({ wolf: output.wolfOfWind() });
        return output.side({ wolf: output.wolfOfStone() });
      },
      outputStrings: {
        wolfOfWind: {
          en: 'Green',
          ko: '🟩녹색',
        },
        wolfOfStone: {
          en: 'Yellow',
          ko: '🟨노랑',
        },
        side: {
          en: '${wolf} Side',
          ko: '${wolf}으로!',
        },
      },
    },
    {
      id: 'R8S Tactical Pack Debuffs',
      // Durations could be 21s, 37s, or 54s
      type: 'GainsEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: (data, matches) => data.me === matches.target && data.phase === 'pack',
      infoText: (data, matches, output) => {
        // 1127 = Stone (Yellow Cube) Debuff
        // 1128 = Wind (Green Sphere) Debuff
        const time = parseFloat(matches.duration);
        data.swgrp = time < 22 ? 1 : time < 38 ? 2 : 3;
        data.swstat = matches.effectId === '1127' ? 'stone' : 'wind';
        const debuff = output[data.swstat]();
        return output.combo({ debuff: debuff, num: data.swgrp });
      },
      outputStrings: swStrings,
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
      netRegex: { id: '0017' },
      condition: (data) => data.phase === 'pack',
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          onPlayers: {
            en: 'Predation on ${player1} and ${player2}',
            ko: '(뭉쳐요: ${player1}, ${player2})',
          },
          onYou: {
            en: 'Predation on YOU',
            ko: '내게 뭉쳐요!',
          },
        };
        data.collect.push(matches.target);
        if (data.collect.length < 2)
          return;
        // Increment count for group tracking
        data.packs++;
        if (data.collect.includes(data.me))
          return { alertText: output.onYou() };
        const p1 = data.party.member(data.collect[0]);
        const p2 = data.party.member(data.collect[1]);
        return { infoText: output.onPlayers({ player1: p1.jobAbbr, player2: p2.jobAbbr }) };
      },
      run: (data) => {
        if (data.collect.length >= 2)
          data.collect = [];
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
      condition: (data, matches) => data.phase === 'pack' && parseFloat(matches.duration) < 2,
      // Magic Vulnerabilities from Pack Predation and Alpha Wind are 0.96s
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.swgrp === data.packs) {
          const debuff = output[data.swstat ?? 'unknown']();
          return output.combo({ debuff: debuff, num: data.swgrp });
        }
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.swgrp = undefined,
    },
    {
      id: 'R8S Tactical Pack Second Pop',
      // Timing based on Tether and Magic Vulnerability (3.96s)
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      condition: (data, matches) => data.phase === 'pack' && parseFloat(matches.duration) > 2,
      preRun: (data) => data.surge = data.surge + 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      alarmText: (data, _matches, output) => {
        const surge = data.surge;
        if (data.swgrp === data.packs) {
          if (surge === 1 || surge === 3 || surge === 5) {
            const debuff = output[data.swstat ?? 'unknown']();
            return output.combo({ debuff: debuff, num: data.swgrp });
          }
        }
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Ravenous Saber',
      type: 'StartsUsing',
      netRegex: { id: 'A749', source: 'Howling Blade', capture: false },
      durationSeconds: 7,
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Spread/Stack Collect',
      type: 'HeadMarker',
      netRegex: { id: ['005D', '008B'] },
      run: (data, matches) => {
        if (matches.id === '005D')
          data.stack = matches.target;
        else if (matches.target === data.me)
          data.spread = true;
      },
    },
    {
      id: 'R8S Terrestrial Rage Spread/Stack',
      // For Shadowchase (A3BC), actors available roughly 2.9s after cast
      // Only need one of the 5 actors to determine pattern
      // Ids are sequential, starting 2 less than the boss
      // Two patterns (in order of IDs):
      // S, WSW, NW, NE, ESE
      // N, ENE, SE, SW, WNW
      // TODO: Add orientation call?
      type: 'HeadMarker',
      netRegex: { id: ['005D', '008B'], capture: false },
      condition: (data) => data.phase === 'saber',
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.raged) {
          if (data.spread)
            return output.spreadClone();
          if (data.stack === data.me)
            return output.OnYouClone();
          const name = data.party.member(data.stack);
          return output.OnPlayerClone({ player: name.jobAbbr });
        }
        if (data.spread)
          return output.spreadStack();
        if (data.stack === data.me)
          return output.OnYouSpread();
        const name = data.party.member(data.stack);
        return output.OnPlayerSpread({ player: name.jobAbbr });
      },
      run: (data) => {
        data.stack = undefined;
        data.spread = undefined;
        data.raged = true;
      },
      outputStrings: {
        spreadStack: Outputs.spreadThenStack,
        spreadClone: {
          en: 'Spread (Behind Clones)',
          ko: '[클론] 맡은 자리로',
        },
        OnPlayerSpread: {
          en: 'Stack on ${player} => Spread',
          ko: '뭉쳤다(${player}) 🔜 맡은 자리로',
        },
        OnYouSpread: {
          en: 'Stack on YOU => Spread',
          ko: '내게 뭉쳤다 🔜 맡은 자리로',
        },
        OnPlayerClone: {
          en: 'Stack on ${player} (Behind Clones)',
          ko: '[클론] 뭉쳐욧: ${player}',
        },
        OnYouClone: {
          en: 'Stack on YOU (Behind Clones)',
          ko: '[클론] 내게 뭉쳐요',
        },
      },
    },
    {
      id: 'R8S Shadowchase Rotate',
      // Call to move behind Dragon Head after clones dash
      type: 'StartsUsing',
      netRegex: { id: 'A3BD', source: 'Howling Blade', capture: true },
      condition: Conditions.notAutumnOnly(),
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => {
        return output.rotate();
      },
      outputStrings: {
        rotate: {
          en: 'Rotate',
          ko: '옆으로 이동',
        },
      },
    },
    {
      id: 'R8S Weal of Stone',
      // TODO: Call direction that the heads are firing from, needs OverlayPlugin
      type: 'StartsUsing',
      netRegex: { id: 'A78E', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.lines(),
      outputStrings: {
        lines: {
          en: 'Lines',
          ko: '줄',
        },
      },
    },
    {
      id: 'R8S Beckon Moonlight Quadrants',
      type: 'Ability',
      // A3E0 => Right cleave self-cast
      // A3E1 => Left cleave self-cast
      netRegex: { id: ['A3E0', 'A3E1'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: 0.1,
      durationSeconds: (data) => data.moonbites.length < 2 ? 2 : 10,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        const dirNum = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        // Moonbeam's Bite (A3C2 Left / A3C3 Right) half-room cleaves
        // Defining the cleaved side
        if (matches.id === 'A3E0') {
          const counterclock = dirNum === 0 ? 6 : dirNum - 2;
          data.moonbites.push(counterclock);
        }
        if (matches.id === 'A3E1') {
          const clockwise = (dirNum + 2) % 8;
          data.moonbites.push(clockwise);
        }
      },
      infoText: (data, _matches, output) => {
        if (data.moonbites.length === 1 || data.moonbites.length === 3)
          return;
        const quadrants = [1, 3, 5, 7];
        const beam1 = data.moonbites[0] ?? -1;
        const beam2 = data.moonbites[1] ?? -1;
        let safe1 = quadrants.filter((q) => q !== beam1 + 1);
        safe1 = safe1.filter((q) => q !== (beam1 === 0 ? 7 : beam1 - 1));
        safe1 = safe1.filter((q) => q !== beam2 + 1);
        safe1 = safe1.filter((q) => q !== (beam2 === 0 ? 7 : beam2 - 1));
        // Early output for first two
        if (data.moonbites.length === 2) {
          if (safe1.length !== 1 || safe1[0] === undefined)
            return;
          const quad = output[AutumnDir.markFromNum(safe1[0] ?? -1)]();
          return output.safeQuad({ quad: quad });
        }
        const beam3 = data.moonbites[2] ?? -1;
        const beam4 = data.moonbites[3] ?? -1;
        let safe2 = quadrants.filter((q) => q !== beam3 + 1);
        safe2 = safe2.filter((q) => q !== (beam3 === 0 ? 7 : beam3 - 1));
        safe2 = safe2.filter((q) => q !== beam4 + 1);
        safe2 = safe2.filter((q) => q !== (beam4 === 0 ? 7 : beam4 - 1));
        if (safe1[0] === undefined || safe2[0] === undefined)
          return;
        if (safe1.length !== 1)
          return;
        if (safe2.length !== 1)
          return;
        const quad1 = output[AutumnDir.markFromNum(safe1[0] ?? -1)]();
        data.moonquad = output[AutumnDir.markFromNum(safe2[0] ?? -1)]();
        return output.safeQuadrants({ quad1: quad1, quad2: data.moonquad });
      },
      outputStrings: moonStrings,
    },
    {
      id: 'R8S Beckon Moonlight Spread/Stack',
      type: 'HeadMarker',
      netRegex: { id: ['005D', '008B'], capture: false },
      condition: (data) => data.phase === 'moonlight',
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.raged) {
          if (data.spread)
            return output.spread();
          if (data.stack === data.me)
            return output.stackOnYou();
          const name = data.party.member(data.stack);
          return output.stackOnPlayer({ player: name.jobAbbr });
        }
        if (data.spread)
          return output.spreadThenStack();
        if (data.stack === data.me)
          return output.OnYouThenSpread();
        const name = data.party.member(data.stack);
        return output.OnPlayerThenSpread({ player: name.jobAbbr });
      },
      run: (data) => {
        data.stack = undefined;
        data.spread = undefined;
        data.raged = true;
      },
      outputStrings: {
        spreadThenStack: Outputs.spreadThenStack,
        spread: Outputs.protean,
        stackOnPlayer: Outputs.stackOnPlayer,
        stackOnYou: Outputs.stackOnYou,
        OnPlayerThenSpread: {
          en: 'Stack on ${player} => Spread',
          ko: '뭉쳤다(${player}) 🔜 맡은 자리로',
        },
        OnYouThenSpread: {
          en: 'Stack on YOU => Spread',
          ko: '내게 뭉쳤다 🔜 맡은 자리로',
        },
      },
    },
    {
      id: 'R8S Beckon Moonlight Quadrant Two',
      type: 'StartsUsing',
      // A3C2 => Moonbeam's Bite dash with Left cleave
      // A3C3 => Moonbeam's Bite dash with Right cleave
      netRegex: { id: ['A3C2', 'A3C3'], source: 'Moonlit Shadow', capture: true },
      condition: (data) => {
        data.moonindex++;
        return data.moonindex === 2;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (data, _matches, output) => output.safeQuad({ quad: data.moonquad }),
      outputStrings: moonStrings,
    },
    {
      id: 'R8S Weal of Stone Cardinals',
      // This appears to always be cardinals safe
      type: 'StartsUsing',
      netRegex: { id: 'A792', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.cardinals(),
      outputStrings: {
        cardinals: Outputs.cardinals,
      },
    },
    // Phase 2
    // TODO: Timeline based callout for light parties for Quake III
    // TODO: Timeline base callout for mooncleaver bait
    {
      id: 'R8S Quake III',
      type: 'StartsUsing',
      netRegex: { id: 'A45A', source: 'Howling Blade', capture: false },
      alertText: (_data, _matches, output) => output.healerGroups(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      // headmarkers with casts:
      // A45D (Ultraviolent Ray)
      // TODO: Determine platform to move to based on player positions/role?
      id: 'R8S Ultraviolent Ray Target',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => {
        return output.uvRayOnYou();
      },
      outputStrings: {
        uvRayOnYou: {
          en: 'UV Ray on YOU',
          ko: '내게 UV레이',
        },
      },
    },
    {
      id: 'R8S Twinbite',
      type: 'StartsUsing',
      netRegex: { id: 'A4CD', source: 'Howling Blade', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R8S Fanged Maw/Perimeter Collect',
      // A463 Fanged Maw (In cleave)
      // A464 Fanged Perimeter (Out cleave)
      type: 'StartsUsing',
      netRegex: { id: ['A463', 'A464'], source: 'Gleaming Fang', capture: true },
      run: (data, matches) => data.hblow = matches.id === 'A463' ? 'out' : 'in',
    },
    {
      id: 'R8S Hero\'s Blow',
      // Has two casts
      // A45F for Hero's Blow Left cleave
      // A460 for Hero's Blow Left cleave damage
      // A461 Hero's Blow Right cleave
      // A462 Hero's Blow Right cleave damage
      // Hero's Blow targets a player, the player could be anywhere
      // Call relative to boss facing
      type: 'StartsUsing',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        data.hsafe = matches.id === 'A45F'
          ? Math.abs(AutumnDir.hdgNum8(actor.Heading) - 4) % 16
          : (AutumnDir.hdgNum8(actor.Heading) + 4) % 16;
      },
      infoText: (data, _matches, output) => {
        const inout = output[data.hblow ?? 'unknown']();
        const dir = output[AutumnDir.arrowFromNum(data.hsafe ?? -1)]();
        return output.text({ inout: inout, dir: dir });
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        text: {
          en: '${inout} + ${dir}',
          ko: '${inout} + ${dir}',
        },
        unknown: Outputs.unknown,
        ...AutumnDir.stringsArrow,
      },
    },
    {
      // headmarkers with casts:
      // A467 (Elemental Purge)
      // A468 (Aerotemporal Blast) on one random non-tank
      // A469 (Geotemporal Blast) on one Tank
      id: 'R8S Elemental Purge Targets',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: (data) => data.phase === '2nd',
      infoText: (data, matches, output) => {
        data.collect.push(matches.target);
        if (data.collect.length < 2)
          return;
        const name1 = data.party.member(data.collect[0]);
        const name2 = data.party.member(data.collect[1]);
        return output.purgeOnPlayers({ player1: name1.jobAbbr, player2: name2.jobAbbr });
      },
      run: (data) => {
        if (data.collect.length >= 2)
          data.collect = [];
      },
      outputStrings: {
        purgeOnPlayers: {
          en: 'Elemental Purge on ${player1} and ${player2}',
          ko: '퍼지: ${player1}, ${player2}',
        },
      },
    },
    {
      id: 'R8S Twofold Tempest Initial Tether',
      type: 'Tether',
      netRegex: { id: '0054', capture: true },
      suppressSeconds: 50,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        const northTwoPlatforms = 94;
        const dirNS = actor.PosY < northTwoPlatforms ? 'N' : 'S';
        const dirEW = actor.PosX > centerX ? 'E' : 'W';
        if (dirNS === 'N' && dirEW === 'E')
          data.tfdir = 'dirNE';
        else if (dirNS === 'S' && dirEW === 'E')
          data.tfdir = 'dirSE';
        else if (dirNS === 'S' && dirEW === 'W')
          data.tfdir = 'dirSW';
        else if (dirNS === 'N' && dirEW === 'W')
          data.tfdir = 'dirNW';
      },
      infoText: (data, _matches, output) => {
        // Default starting tether locations
        const startingDir1 = 'dirSE';
        const startingDir2 = 'dirSW';
        const initialDir = data.tfdir ?? 'unknown';
        switch (initialDir) {
          case startingDir1:
          case startingDir2:
            if (data.twofold)
              return output.tetherOnYou();
            return output.tetherOnDir({ dir: output[initialDir]() });
          case 'dirNE':
            if (data.twofold)
              return output.passTetherDir({ dir: output[startingDir1]() });
            return output.tetherOnDir({ dir: output[startingDir1]() });
          case 'dirNW':
            if (data.twofold)
              return output.passTetherDir({ dir: output[startingDir2]() });
            return output.tetherOnDir({ dir: output[startingDir2]() });
          case 'unknown':
            return output.tetherOnDir({ dir: output['unknown']() });
        }
      },
      run: (data) => {
        // Set initialDir if pass was needed
        if (data.tfdir === 'dirNE')
          data.tfdir = 'dirSE';
        if (data.tfdir === 'dirNW')
          data.tfdir = 'dirSW';
      },
      outputStrings: {
        passTetherDir: {
          en: 'Pass Tether to ${dir}',
          ko: '줄 넘겨요: ${dir}${dir}',
        },
        tetherOnYou: {
          en: 'Tether on YOU',
          ko: '내게 줄',
        },
        tetherOnDir: {
          en: 'Tether on ${dir}',
          ko: '줄: ${dir}${dir}',
        },
        ...AutumnDir.stringsDirArrowCross,
      },
    },
    {
      id: 'R8S Twofold Tempest Tether Pass',
      // Call pass after the puddle has been dropped
      type: 'Ability',
      netRegex: { id: 'A472', source: 'Howling Blade', capture: false },
      condition: (data) => data.twofold,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.twofold) {
          if (data.tfdir === 'unknown')
            return output.passTether();
          if (data.tfindex === 1) {
            const passDir = data.tfdir === 'dirSE' ? 'dirNE' : 'dirNW';
            return output.passTetherDir({ dir: output[passDir]() });
          }
          if (data.tfindex === 2) {
            const passDir = data.tfdir === 'dirSE' ? 'dirNW' : 'dirNE';
            return output.passTetherDir({ dir: output[passDir]() });
          }
          if (data.tfindex === 3) {
            const passDir = data.tfdir === 'dirSE' ? 'dirSW' : 'dirSE';
            return output.passTetherDir({ dir: output[passDir]() });
          }
        }
        if (data.tfdir === 'unknown')
          return output.tetherOnDir({ dir: Outputs.unknown });
        if (data.tfindex === 1) {
          const passDir = data.tfdir === 'dirSE' ? 'dirNE' : 'dirNW';
          return output.tetherOnDir({ dir: output[passDir]() });
        }
        if (data.tfindex === 2) {
          const passDir = data.tfdir === 'dirSE' ? 'dirNW' : 'dirNE';
          return output.tetherOnDir({ dir: output[passDir]() });
        }
        if (data.tfindex === 3) {
          const passDir = data.tfdir === 'dirSE' ? 'dirSW' : 'dirSE';
          return output.tetherOnDir({ dir: output[passDir]() });
        }
      },
      outputStrings: {
        passTether: {
          en: 'Pass Tether',
          ko: '줄 넘겨요',
        },
        passTetherDir: {
          en: 'Pass Tether ${dir}',
          ko: '줄 넘겨요: ${dir}${dir}',
        },
        tetherOnDir: {
          en: 'Tether On ${dir}',
          ko: '줄: ${dir}${dir}',
        },
        ...AutumnDir.stringsDirArrowCross,
      },
    },
    {
      // headmarker on boss with casts:
      // A477 Champion's Circuit (clockwise)
      // A478 Champion's Circuit (counterclockwise)
      // Followed by instant cast turns:
      // A4A1 Champion's Circuit (clockwise)
      // A4A2 Champion's Circuit (counterclockwise)
      // TODO: Have starting direction?
      id: 'R8S Champion\'s Circuit Direction',
      type: 'HeadMarker',
      netRegex: { id: ['01F5', '01F6'] },
      infoText: (_data, matches, output) => {
        if (matches.id === '01F5')
          return output.clockwise();
        return output.counterclockwise();
      },
      outputStrings: {
        clockwise: {
          en: '<== Clockwise',
          ko: '❰❰❰왼쪽으로',
        },
        counterclockwise: {
          en: 'Counterclockwise ==>',
          ko: '오른쪽으로❱❱❱',
        },
      },
    },
    {
      id: 'R8S Champion\'s Circuit Mechanic Order',
      // First Casts:
      // A479 Champion's Circuit Sides safe (middle cleave)
      // A47A Champion's Circuit Donut
      // A47B Champion's Circuit In safe (halfmoon cleave)
      // A47C Champion's Circuit Out safe (in circle)
      // A47D Champion's Circuit In safe (halfmoon cleave)
      // Subsequent Casts:
      // A47E Champion's Circuit Sides (middle cleave)
      // A47F Champion's Circuit Donut
      // A480 Champion's Circuit In safe (halfmoon cleave)
      // A481 Champion's Circuit Out safe (in circle)
      // A482 Champion's Circuit In safe (halfmoon cleave)
      // Actor casting the donut is trackable to center of its platform
      // 100,    117.5  Center of S platform
      // 83.36,  105.41 Center of SW platform
      // 89.71,  85.84  Center of NW platform
      // 110.29, 85.84  Center of NE platform
      // 116.64, 105.41 Center of SE platform
      type: 'StartsUsing',
      netRegex: { id: 'A47A', source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      durationSeconds: 26,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        data.chdonut = actor.PosX;
      },
      infoText: (data, _matches, output) => {
        if (data.chclock === undefined || data.chdonut === undefined)
          return;
        // Static orders
        const order = ['donut', 'in', 'out', 'in', 'sides'];
        const order1 = ['in', 'out', 'in', 'sides', 'donut'];
        const order2 = ['out', 'in', 'sides', 'donut', 'in'];
        const order3 = ['in', 'sides', 'donut', 'in', 'out'];
        const order4 = ['sides', 'donut', 'in', 'out', 'in'];
        let newOrder;
        const x = data.chdonut;
        if (x > 99 && x < 101) {
          // S Platform
          newOrder = order;
        } else if (x > 82 && x < 85) {
          // SW Platform
          newOrder = order1;
        } else if (x > 88 && x < 91) {
          // NW Platform
          newOrder = order2;
        } else if (x > 109 && x < 112) {
          // NE Platform
          newOrder = order3;
        } else if (x > 115 && x < 118) {
          // SE Platform
          newOrder = order4;
        }
        // Failed to get clock or matching x coords
        if (
          newOrder === undefined || newOrder[0] === undefined ||
          newOrder[1] === undefined || newOrder[2] === undefined ||
          newOrder[3] === undefined || newOrder[4] === undefined
        )
          return;
        data.chorder = newOrder;
        return output.mechanics({
          dir: output[data.chclock](),
          mech1: output[newOrder[0]](),
          mech2: output[newOrder[1]](),
          mech3: output[newOrder[2]](),
          mech4: output[newOrder[3]](),
          mech5: output[newOrder[4]](),
        });
      },
      outputStrings: championStrings,
    },
    {
      id: 'R8S Champion\'s Circuit Safe Spot',
      // Gleaming Fang for the South Platform is at 96, 126.5 or 104, 126.5
      // A476 Gleaming Barrage
      type: 'StartsUsing',
      netRegex: { id: 'A476', source: 'Gleaming Fang', capture: true },
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        const dirNum = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        if (dirNum === 4)
          data.chfang = actor.PosX;
      },
      infoText: (data, _matches, output) => {
        // Have not found the south fang yet
        if (data.chfang === undefined)
          return;
        const dir = data.chfang < 100 ? output.right() : output.left();
        if (
          data.chorder === undefined ||
          data.chorder[data.chindex] === undefined
        )
          return;
        if (data.chorder[data.chindex] === 'sides')
          return data.chfang < 100 ? output.rightSide() : output.leftSide();
        const mech = data.chorder[data.chindex];
        if (mech === undefined)
          return;
        return output.dirMechanic({ dir: dir, mech: output[mech]() });
      },
      run: (data) => {
        if (data.chfang !== undefined) {
          data.chindex = data.chindex + 1;
          data.chfang = undefined;
        }
      },
      outputStrings: championStrings,
    },
    {
      id: 'R8S Lone Wolf\'s Lament Tethers',
      type: 'Tether',
      netRegex: { id: ['013E', '013D'] },
      condition: (data, matches) => {
        if (data.me === matches.target || data.me === matches.source)
          return true;
        return false;
      },
      infoText: (_data, matches, output) => {
        if (matches.id === '013E')
          return output.farTetherOnYou();
        return output.closeTetherOnYou();
      },
      outputStrings: {
        closeTetherOnYou: {
          en: 'Close Tether on YOU',
          ko: '내게 가까운 줄',
        },
        farTetherOnYou: {
          en: 'Far Tether on YOU',
          ko: '내게 멀리 줄',
        },
      },
    },
    {
      id: 'R8S Howling Eight',
      type: 'StartsUsing',
      netRegex: { id: 'A494', source: 'Howling Blade', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          ja: '頭割り x8',
          cn: '8次分摊',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Mooncleaver Platform',
      // Trigger on last hit of Howling Eight (AA0A for first set, A494 others)
      type: 'Ability',
      netRegex: { id: ['A494', 'AA0A'], source: 'Howling Blade', capture: false },
      condition: (data) => {
        // Tracking how many platforms will remain
        data.platforms--;
        return data.platforms !== 0;
      },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.changePlatform(),
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ko: '다른 플랫폼으로!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Howling Blade': 'ハウリングブレード',
        'Moonlit Shadow': 'ハウリングブレードの幻影',
        'Wolf of Stone': '土の狼頭',
        'Gleaming Fang': '光の牙',
      },
    },
  ],
});
