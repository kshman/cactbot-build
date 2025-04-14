import { AutumnDirections } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const phases = {
  'A3C8': 'pack', // Tactical Pack
  'A3CB': 'saber', // Ravenous Saber
  'A3C1': 'moonlight', // Beckon Moonlight
} as const;
type Phase = (typeof phases)[keyof typeof phases] | 'door' | 'unknown';

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

const centerX = 100;
const centerY = 100;

export interface Data extends RaidbossData {
  phase: Phase;
  // Phase 1
  reign?: number;
  decays: number;
  swGroup?: number;
  swDebuff?: 'stone' | 'wind';
  surge: number;
  packs: number;
  raged?: boolean;
  spread?: boolean;
  stack?: string;
  chase?: number;
  // Phase 2
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
    packs: 0,
    collect: [],
    surge: 0,
  }),
  triggers: [
    {
      id: 'R8S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Howling Blade' },
      suppressSeconds: 1,
      run: (data, matches) => data.phase = phases[matches.id as keyof typeof phases] ?? 'unknown',
    },
    {
      id: 'R8S Extraplanar Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3DA', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Windfang/Stonefang',
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
      id: 'R8S Eminent/Revolutionary Reign',
      type: 'StartsUsing',
      netRegex: { id: reignKeys, source: 'Howling Blade', capture: true },
      infoText: (_data, matches, output) => {
        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            return output.inLater!();
          case 'revolutionary1':
          case 'revolutionary2':
            return output.outLater!();
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
      netRegex: { id: reignKeys, source: 'Howling Blade', capture: true },
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

        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            data.reign = (Directions.hdgTo8DirNum(actor.Heading) + 4) % 8;
            break;
          case 'revolutionary1':
          case 'revolutionary2':
            data.reign = Directions.hdgTo8DirNum(actor.Heading);
            break;
        }
      },
      infoText: (data, matches, output) => {
        const arrow = output[AutumnDirections.outputFromArrow8Num(data.reign ?? -1)]!();
        switch (reignIds[matches.id]) {
          case 'eminent1':
          case 'eminent2':
            return output.inDir!({ dir: arrow });
          case 'revolutionary1':
          case 'revolutionary2':
            return output.outDir!({ dir: arrow });
        }
      },
      run: (data) => {
        data.reign = undefined;
      },
      outputStrings: {
        inDir: {
          en: 'In ${dir}',
          ko: '${dir}안으로',
        },
        outDir: {
          en: 'Out ${dir}',
          ko: '${dir}바깥으로',
        },
        ...AutumnDirections.outputStringsArrow8,
      },
    },
    {
      id: 'R8S Millenial Decay',
      type: 'StartsUsing',
      netRegex: { id: 'A3B2', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
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

        const dir = AutumnDirections.posConv8(matches.x, matches.y, centerX, centerY);
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
          ko: '${wolf} 옆으로',
        },
      },
    },
    {
      id: 'R8S Tactical Pack Debuffs',
      // Durations could be 21s, 37s, or 54s
      type: 'GainsEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: (data, matches) => data.me === matches.target && data.phase === 'pack',
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = swStrings;

        // 1127 = Stone (Yellow Cube) Debuff
        // 1128 = Wind (Green Sphere) Debuff
        const time = parseFloat(matches.duration);
        data.swDebuff = matches.effectId === '1127' ? 'stone' : 'wind';
        data.swGroup = time < 22 ? 1 : time < 38 ? 2 : 3;

        const debuff = output[data.swDebuff]!();
        return { infoText: output.combo!({ debuff: debuff, num: data.swGroup }) };
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
      netRegex: { id: '0017' },
      infoText: (data, matches, output) => {
        data.collect.push(matches.target);
        if (data.collect.length < 2)
          return;

        // Increment count for group tracking
        data.packs = data.packs + 1;

        const p1 = data.party.member(data.collect[0]);
        const p2 = data.party.member(data.collect[1]);
        return output.predationOnPlayers!({ player1: p1.jobAbbr, player2: p2.jobAbbr });
      },
      run: (data) => {
        if (data.collect.length >= 2)
          data.collect = [];
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
      condition: (data, matches) => data.phase === 'pack' && parseFloat(matches.duration) < 2,
      // Magic Vulnerabilities from Pack Predation and Alpha Wind are 0.96s
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.swGroup === data.packs) {
          const debuff = output[data.swDebuff ?? 'unknown']!();
          return output.combo!({ debuff: debuff, num: data.swGroup });
        }
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.swGroup = undefined,
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
        if (data.swGroup === data.packs) {
          if (surge === 1 || surge === 3 || surge === 5) {
            const debuff = output[data.swDebuff ?? 'unknown']!();
            return output.combo!({ debuff: debuff, num: data.swGroup });
          }
        }
      },
      outputStrings: swStrings,
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
      type: 'HeadMarker',
      netRegex: { id: ['005D', '008B'], capture: false },
      condition: (data) => data.phase === 'saber',
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
          console.error(
            `R8S Shadowchase Direction: Wrong actor count ${actors.length}`,
          );
          return;
        }

        data.chase = Directions.xyTo16DirNum(actor.PosX, actor.PosY, centerX, centerY);
      },
      infoText: (data, _matches, output) => {
        if (data.chase === 0)
          return output.orientN!();
        if (data.chase === 8)
          return output.orientNE!();
      },
      run: (data) => {
        data.chase = undefined;
      },
      outputStrings: {
        orientN: {
          en: 'Orient N, Behind Clone',
          ko: '(북쪽 기준) 클론 뒤로',
        },
        orientNE: {
          en: 'Orient NE, Behind Clone',
          ko: '(북동쪽 기준) 클론 뒤로',
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
        const hdg = parseFloat(matches.heading);
        const dirOut = Directions.outputFrom8DirNum((Directions.hdgTo8DirNum(hdg) + 4) % 8);
        return output.linesFromDir!({ dir: output[dirOut]!() });
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
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Howling Blade': 'ハウリングブレード',
        'Wolf of Stone': '土の狼頭',
      },
    },
  ],
};

export default triggerSet;
