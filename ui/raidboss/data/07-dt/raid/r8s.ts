import { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const phases = {
  'A3C8': 'pack', // Tactical Pack
  'A3CB': 'saber', // Ravenous Saber
  'A3C1': 'moonlight', // Beckon Moonlight
} as const;
type Phase = (typeof phases)[keyof typeof phases] | 'door' | '2nd' | 'unknown';

const fangIds: { [id: string]: string } = {
  'A39D': 'windPlus',
  'A39E': 'windCross',
  'A3A1': 'stonePlus',
  'A3A2': 'stoneCross',
} as const;
const reignIds: { [id: string]: string } = {
  'A911': 'eminent1',
  'A912': 'eminent2',
  'A913': 'revolutionary1',
  'A914': 'revolutionary2',
} as const;
const reignKeys = Object.keys(reignIds);

const swStrings = {
  combo: {
    en: '${debuff} ${num}',
    ko: '${debuff} ${num}번째',
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
} as const;
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
} as const;

const centerX = 100;
const centerY = 100;

export interface Data extends RaidbossData {
  phase: Phase;
  // Phase 1
  reign?: number;
  decays: number;
  galedir?: number;
  galecnt: number;
  swgrp?: number;
  swstat?: 'stone' | 'wind';
  surge: number;
  packs: number;
  raged?: boolean;
  spread?: boolean;
  stack?: string;
  moonindex: number;
  moonquad?: string;
  moonbites: number[];
  // Phase 2
  hblow?: 'in' | 'out';
  platforms: number;
  //
  collect: string[];
}

const triggerSet: TriggerSet<Data> = {
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
    platforms: 5,
    collect: [],
  }),
  triggers: [
    {
      id: 'R8S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Howling Blade' },
      suppressSeconds: 1,
      run: (data, matches) => {
        data.phase = phases[matches.id as keyof typeof phases] ?? 'unknown';
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
          return output[fang]!();
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
            return output.in!();
          case 'revolutionary1':
          case 'revolutionary2':
            return output.out!();
        }
      },
      outputStrings: {
        in: {
          en: '(In later)',
          ko: '(나중에 보스 가까이)',
        },
        out: {
          en: '(Out later)',
          ko: '(나중에 보스 멀리멀리)',
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
        const mk = output[AutumnDir.markFromNum(data.reign ?? -1)]!();
        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            return output.in!({ dir: mk });
          case 'revolutionary1':
          case 'revolutionary2':
            return output.out!({ dir: mk });
        }
      },
      run: (data) => {
        data.reign = undefined;
      },
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
          return output.clockwise!();
        else if (dir === 3 || dir === 7)
          return output.counterclockwise!();
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
      id: 'R8S Aero III',
      // Happens twice, but Prowling Gale occurs simultaneously on the second one
      type: 'StartsUsing',
      netRegex: { id: 'A3B7', source: 'Howling Blade', capture: false },
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
          const dir = output[AutumnDir.markFromNum(data.galedir)]!();
          return output.knockbackTetherDir!({ dir: dir });
        }

        if (data.galedir === undefined && data.galecnt === 4)
          return output.knockbackTowers!();
      },
      outputStrings: {
        knockbackTetherDir: {
          en: 'Knockback tether: ${dir}',
          ko: '넉백 줄: ${dir}',
        },
        knockbackTowers: {
          en: 'Knockback Towers',
          ko: '넉백 타워',
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
      infoText: (_data, _matches, output) => output.text!(),
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
      netRegex: { id: 'A3DD', source: 'Wolf Of Stone', capture: false },
      delaySeconds: 2,
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
          return output.side!({ wolf: output.wolfOfWind!() });
        return output.side!({ wolf: output.wolfOfStone!() });
      },
      outputStrings: {
        wolfOfWind: {
          en: 'Green',
          ko: '🟩녹색',
        },
        wolfOfStone: {
          en: 'Yellow',
          ko: '🟨노란색',
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

        const debuff = output[data.swstat]!();
        return output.combo!({ debuff: debuff, num: data.swgrp });
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
            ko: '(포식: ${player1}, ${player2})',
          },
          onYou: {
            en: 'Predation on YOU',
            ko: '내게 포식!',
          },
        };
        data.collect.push(matches.target);
        if (data.collect.length < 2)
          return;

        // Increment count for group tracking
        data.packs++;

        if (data.collect.includes(data.me))
          return { alertText: output.onYou!() };

        const p1 = data.party.member(data.collect[0]);
        const p2 = data.party.member(data.collect[1]);
        return { infoText: output.onPlayers!({ player1: p1.jobAbbr, player2: p2.jobAbbr }) };
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
          const debuff = output[data.swstat ?? 'unknown']!();
          return output.combo!({ debuff: debuff, num: data.swgrp });
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
            const debuff = output[data.swstat ?? 'unknown']!();
            return output.combo!({ debuff: debuff, num: data.swgrp });
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
            return output.spreadClone!();
          if (data.stack === data.me)
            return output.OnYouClone!();
          const name = data.party.member(data.stack);
          return output.OnPlayerClone!({ player: name.jobAbbr });
        }
        if (data.spread)
          return output.spreadStack!();
        if (data.stack === data.me)
          return output.OnYouSpread!();
        const name = data.party.member(data.stack);
        return output.OnPlayerSpread!({ player: name.jobAbbr });
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
          ko: '흩어져요 (클론 뒤로)',
        },
        OnPlayerSpread: {
          en: 'Stack on ${player} => Spread',
          ko: '뭉쳤다(${player}) 🔜 흩어져요',
        },
        OnYouSpread: {
          en: 'Stack on YOU => Spread',
          ko: '내게 뭉쳤다 🔜 흩어져요',
        },
        OnPlayerClone: {
          en: 'Stack on ${player} (Behind Clones)',
          ko: '뭉쳐욧: ${player} (클론 뒤로)',
        },
        OnYouClone: {
          en: 'Stack on YOU (Behind Clones)',
          ko: '내게 뭉쳐요 (클론 뒤로)',
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
        return output.rotate!();
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
        const hdg = AutumnDir.hdgConv8(matches.heading, true);
        const mk = AutumnDir.markFromNum(hdg);
        return output.linesFromDir!({ dir: output[mk]!() });
      },
      outputStrings: {
        linesFromDir: {
          en: 'Lines from ${dir}',
          ko: '줄: ${dir}',
        },
        ...AutumnDir.stringsMark,
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
          const quad = output[AutumnDir.markFromNum(safe1[0] ?? -1)]!();
          return output.safeQuad!({ quad: quad });
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

        const quad1 = output[AutumnDir.markFromNum(safe1[0] ?? -1)]!();
        data.moonquad = output[AutumnDir.markFromNum(safe2[0] ?? -1)]!();
        return output.safeQuadrants!({ quad1: quad1, quad2: data.moonquad });
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
            return output.spread!();
          if (data.stack === data.me)
            return output.stackOnYou!();
          const name = data.party.member(data.stack);
          return output.stackOnPlayer!({ player: name.jobAbbr });
        }

        if (data.spread)
          return output.spreadThenStack!();
        if (data.stack === data.me)
          return output.OnYouThenSpread!();
        const name = data.party.member(data.stack);
        return output.OnPlayerThenSpread!({ player: name.jobAbbr });
      },
      run: (data) => {
        data.stack = undefined;
        data.spread = undefined;
        data.raged = true;
      },
      outputStrings: {
        spreadThenStack: Outputs.spreadThenStack,
        spread: Outputs.spread,
        stackOnPlayer: Outputs.stackOnPlayer,
        stackOnYou: Outputs.stackOnYou,
        OnPlayerThenSpread: {
          en: 'Stack on ${player} => Spread',
          ko: '뭉쳤다(${player}) 🔜 흩어져요',
        },
        OnYouThenSpread: {
          en: 'Stack on YOU => Spread',
          ko: '내게 뭉쳤다 🔜 흩어져요',
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
      infoText: (data, _matches, output) => output.safeQuad!({ quad: data.moonquad }),
      outputStrings: moonStrings,
    },
    {
      id: 'R8S Weal of Stone Cardinals',
      // This appears to always be cardinals safe
      type: 'StartsUsing',
      netRegex: { id: 'A792', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => {
        return output.cardinals!();
      },
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
      alertText: (_data, _matches, output) => output.healerGroups!(),
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
        return output.uvRayOnYou!();
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
      type: 'StartsUsing',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: true },
      delaySeconds: 0.1,
      infoText: (data, matches, output) => {
        const dir = matches.id === 'A45F' ? output.right!() : output.left!();
        const inout = output[data.hblow ?? 'unknown']!();
        return output.text!({ inout: inout, dir: dir });
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        left: Outputs.left,
        right: Outputs.right,
        text: {
          en: '${inout} + ${dir}',
          ko: '${inout} + ${dir}',
        },
        unknown: Outputs.unknown,
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

        return output.purgeOnPlayers!({ player1: name1.jobAbbr, player2: name2.jobAbbr });
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
      id: 'R8S Howling Eight',
      type: 'StartsUsing',
      netRegex: { id: 'A494', source: 'Howling Blade', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          ja: '頭割り x8',
          ko: '뭉쳐요 x8',
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
        return data.platforms > 0;
      },
      infoText: (_data, _matches, output) => output.changePlatform!(),
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ko: '플랫폼 갈아타요',
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
};

export default triggerSet;
