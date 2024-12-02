import { AutumnDirections, MarkerOutput8 } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { Role } from '../../../../../types/job';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'p1' | 'p2' | 'p3';
type RedBlue = 'red' | 'blue';

const ultimateRelativityIdKey: { [effectId: string]: string } = {
  '996': 'stack',
  '997': 'fire',
  '998': 'shadoweye',
  '99C': 'eruption',
  '99B': 'beam',
  '99D': 'water',
  '99E': 'blizzard',
  '9A0': 'return',
} as const;

const ultimateRelativityStrings = {
  stack: Outputs.stacks,
  fire: {
    en: 'Fire',
    ko: '파이가',
  },
  shadoweye: {
    en: 'Gaze',
    ko: '시선',
  },
  eruption: Outputs.spread,
  beam: {
    en: 'Beam',
    ko: '빔유도',
  },
  water: {
    en: 'Water',
    ko: '워터가',
  },
  blizzard: {
    en: 'Blizzard',
    ko: '블리자가',
  },
  return: {
    en: 'Return',
    ko: '회귀',
  },
} as const;

export interface Data extends RaidbossData {
  phase: Phase;
  actors: { [id: string]: NetMatches['ActorSetPos'] };
  p1SafeMarkers: MarkerOutput8[];
  p1UtopianColor?: RedBlue;
  p1Falled?: boolean;
  p1FallColors: RedBlue[];
  p1FallRoles: Role[];
  p1FallSide?: 'left' | 'right';
  p2Kick?: 'axe' | 'scythe';
  p2Knockback?: number;
  p2Curses: string[];
  p2Relativity?: 'ultimate';
  p2Ultimate: { [name: string]: number };
  p2UltimateKeys: string[];
  p2UltimateAutumn: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'FuturesRewrittenUltimate',
  zoneId: ZoneId.FuturesRewrittenUltimate,
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    actors: {},
    p1SafeMarkers: [...AutumnDirections.outputMarker8],
    p1FallColors: [],
    p1FallRoles: [],
    p2Curses: [],
    p2Ultimate: {},
    p2UltimateKeys: [],
    p2UltimateAutumn: [],
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'FRU Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9CD4', '9CFF', '9D49'], capture: true },
      run: (data, matches) => {
        switch (matches.id) {
          case '9CD0':
          case '9CD4':
            data.phase = 'p1';
            break;
          case '9CFF':
            data.phase = 'p2';
            break;
          case '9D49': // hell judgement
            data.phase = 'p3';
            break;
        }
        data.actors = {};
      },
    },
    {
      id: 'FRU Actor Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}', capture: true },
      run: (data, matches) => data.actors[matches.id] = matches,
    },
    // //////////////// PHASE 1 //////////////////
    {
      id: 'FRU P1 Cyclonic Break Fire',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9D89'], capture: false },
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.pair!(),
      outputStrings: {
        pair: Outputs.stackPartner,
      },
    },
    {
      id: 'FRU P1 Cyclonic Break Lightning',
      type: 'StartsUsing',
      netRegex: { id: ['9CD4', '9D8A'], capture: false },
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'FRU P1 Powder Mark Trail',
      type: 'StartsUsing',
      netRegex: { id: '9CE8', source: 'Fatebreaker' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'FRU P1 Utopian Sky Collect',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker' },
      run: (data, matches) => data.p1UtopianColor = matches.id === '9CDA' ? 'red' : 'blue',
    },
    {
      id: 'FRU P1 Concealed Safe Zone',
      type: 'ActorControlExtra',
      netRegex: { category: '003F', param1: '4', capture: true },
      condition: (data) => data.phase === 'p1' && data.p1UtopianColor !== undefined,
      durationSeconds: 7,
      infoText: (data, matches, output) => {
        const image = data.actors[matches.id];
        if (image === undefined)
          return;
        const dir = Directions.hdgTo8DirNum(parseFloat(image.heading));
        const dir1 = AutumnDirections.outputFromMarker8Num(dir);
        const dir2 = AutumnDirections.outputFromMarker8Num((dir + 4) % 8);
        data.p1SafeMarkers = data.p1SafeMarkers.filter((dir) => dir !== dir1 && dir !== dir2);
        if (data.p1SafeMarkers.length !== 2)
          return;
        const [m1, m2] = data.p1SafeMarkers;
        return output.text!({
          dir1: output[m1!]!(),
          dir2: output[m2!]!(),
          action: data.p1UtopianColor === 'red' ? output.stack!() : output.spread!(),
        });
      },
      outputStrings: {
        text: {
          en: '${dir1} / ${dir2} => ${action}',
          ko: '${dir1}${dir2} 🔜 ${action}',
        },
        stack: Outputs.stacks,
        spread: Outputs.spread,
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      id: 'FRU P1 Turn of the Heavens',
      type: 'StartsUsing',
      netRegex: { id: ['9CD6', '9CD7'], source: 'Fatebreaker\'s Image' },
      durationSeconds: 11,
      infoText: (_data, matches, output) => {
        const safe = matches.id === '9CD6' ? 'blue' : 'red';
        return output.text!({ safe: output[safe]!() });
      },
      outputStrings: {
        text: {
          en: '${safe} Safe',
          ko: '${safe} 안전',
        },
        blue: Outputs.blue,
        red: Outputs.red,
      },
    },
    {
      id: 'FRU P1 Blastburn',
      type: 'StartsUsing',
      netRegex: { id: ['9CC2', '9CE2'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      durationSeconds: 2.5,
      response: Responses.knockback(),
    },
    {
      id: 'FRU P1 Burnout',
      type: 'StartsUsing',
      netRegex: { id: ['9CC6', '9CE4'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      durationSeconds: 2.5,
      response: Responses.getOut(),
    },
    {
      id: 'FRU P1 Burnished Glory',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      durationSeconds: 5,
      response: Responses.bleedAoe(),
    },
    {
      id: 'FRU P1 Fall of Faith',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      condition: (data) => !data.p1Falled,
      run: (data, _matches) => {
        data.p1Falled = true;
        data.p1FallColors = [];
        data.p1FallRoles = [];
      },
    },
    {
      id: 'FRU P1 Fall of Faith Collect',
      type: 'Tether',
      netRegex: { id: ['00F9', '011F'] },
      condition: (data, _matches) => data.phase === 'p1' && data.p1Falled,
      durationSeconds: 3,
      alertText: (data, matches, output) => {
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.p1FallColors.push(color);
        const index = data.p1FallColors.length;
        if (matches.target === data.me) {
          data.p1FallRoles = [];
          data.p1FallSide = index % 2 === 0 ? 'right' : 'left';
          return output.mine!({ num: index, color: output[color]!() });
        }

        if (data.options.OnlyAutumn) {
          // 힐러 둘 다 안걸리면 어듬이는 오른쪽으로
          const member = data.party.member(matches.target);
          data.p1FallRoles.push(member.role ?? 'none');
          if (data.p1FallRoles.length === 4) {
            const healers = data.p1FallRoles.filter((r) => r === 'healer').length;
            if (healers === 0) {
              data.p1FallSide = 'right';
              return output.getRightAndEast!();
            }
            data.p1FallSide = 'left';
            return output.getLeftAndWest!();
          }
        }
      },
      outputStrings: {
        mine: {
          en: '${num} ${color}',
          ko: '내가 ${num}번째 ${color}',
        },
        red: Outputs.red,
        blue: Outputs.blue,
        getLeftAndWest: Outputs.getLeftAndWest,
        getRightAndEast: Outputs.getRightAndEast,
      },
    },
    {
      id: 'FRU P1 Fall of Faith Order',
      type: 'Ability',
      netRegex: { id: ['9CC9', '9CCC'], source: 'Fatebreaker', capture: false },
      condition: (data) => data.p1FallColors.length === 4,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        let colors;
        if (data.p1FallSide === undefined)
          colors = data.p1FallColors.map((c) => output[c]!());
        else if (data.p1FallSide === 'left')
          colors = [data.p1FallColors[0], data.p1FallColors[2]].map((c) => output[c!]!());
        else
          colors = [data.p1FallColors[1], data.p1FallColors[3]].map((c) => output[c!]!());
        return output.res!({ res: colors.join(output.next!()) });
      },
      outputStrings: {
        red: Outputs.red,
        blue: Outputs.blue,
        next: Outputs.next,
        res: {
          en: '${res}',
          ko: '${res}',
        },
      },
    },
    // //////////////// PHASE 2 //////////////////
    {
      id: 'FRU P2 Quadruple Slap',
      type: 'StartsUsing',
      netRegex: { id: '9CFF', source: 'Usurper of Frost' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'FRU P2 Diamond Dust',
      type: 'StartsUsing',
      netRegex: { id: '9D05', source: 'Usurper of Frost', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'FRU P2 Axe/Scythe Kick Collect',
      type: 'StartsUsing',
      netRegex: { id: ['9D0A', '9D0B'], source: 'Oracle\'s Reflection' },
      run: (data, matches) => data.p2Kick = matches.id === '9D0A' ? 'axe' : 'scythe',
    },
    {
      id: 'FRU P2 Flower Target',
      type: 'HeadMarker',
      netRegex: { id: '0159' },
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        let cardinal = false;
        const actors = Object.values(data.actors);
        if (actors.length >= 2 && actors[1] !== undefined) {
          data.p2Knockback = Directions.hdgTo8DirNum(parseFloat(actors[1].heading));
          if (data.p2Knockback % 2 === 0)
            cardinal = true;
        }
        const [rf, rb] = cardinal ? ['intercard', 'cardinal'] : ['cardinal', 'intercard'];
        const kick = data.p2Kick === undefined ? '' : output[data.p2Kick]!();

        const target = data.party.member(matches.target);
        if (data.role === 'dps') {
          if (target.role === 'dps')
            return output.flower!({ kick: kick, ind: output[rf]!() });
          return output.cone!({ kick: kick, ind: output[rb]!() });
        }
        if (target.role === 'dps')
          return output.cone!({ kick: kick, ind: output[rb]!() });
        return output.flower!({ kick: kick, ind: output[rf]!() });
      },
      run: (data, _matches) => data.actors = {},
      outputStrings: {
        flower: {
          en: '${ind} ${kick} => Bait Flower',
          ko: '${ind} ${kick} 🔜 얼음꽃 설치',
        },
        cone: {
          en: '${ind} ${kick} => Bait Cone',
          ko: '${ind} ${kick} 🔜 원뿔 유도',
        },
        cardinal: {
          en: 'Cardinal',
          ko: '십자',
        },
        intercard: {
          en: 'Intercard',
          ko: '비스듬히',
        },
        axe: Outputs.out,
        scythe: Outputs.in,
      },
    },
    {
      id: 'FRU P2 Heavenly Strike',
      type: 'Ability',
      netRegex: { id: '9D07', source: 'Usurper of Frost', capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.p2Knockback === undefined)
          return output.autumn!({ dir: output.unknown!() });
        const values = [data.p2Knockback, (data.p2Knockback + 4) % 8];
        const dir1 = AutumnDirections.outputFromMarker8Num(values[0]!);
        const dir2 = AutumnDirections.outputFromMarker8Num(values[1]!);

        if (data.options.OnlyAutumn) {
          // 어듬이는 MT팀이예여
          const autumnDir: MarkerOutput8[] = ['markerN', 'markerNE', 'markerW', 'markerNW'];
          const dir = autumnDir.includes(dir1) ? dir1 : dir2;
          return output.autumn!({ dir: output[dir]!() });
        }
        return output.knockback!({ dir1: output[dir1]!(), dir2: output[dir2]!() });
      },
      run: (data, _matches) => data.p2Knockback = undefined,
      outputStrings: {
        knockback: {
          en: 'Knockback ${dir1} / ${dir2}',
          ko: '넉백 ${dir1}${dir2}',
        },
        autumn: {
          en: 'Knockback ${dir}',
          ko: '넉백 ${dir}',
        },
        unknown: Outputs.unknown,
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      id: 'FRU P2 Twin Stillness',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle\'s Reflection', id: '9D01', capture: false },
      response: Responses.getBackThenFront('alert'),
    },
    {
      id: 'FRU P2 Twin Silence',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle\'s Reflection', id: '9D02', capture: false },
      response: Responses.getFrontThenBack('alert'),
    },
    {
      id: 'FRU P2 Hallowed Ray',
      type: 'StartsUsing',
      netRegex: { id: '9D12', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'FRU P2 Usurper Scythe Kick',
      type: 'StartsUsing',
      netRegex: { id: '9D0B', source: 'Usurper of Frost', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'FRU P2 Banish III Pair',
      type: 'StartsUsing',
      netRegex: { id: '9D1C', capture: false },
      response: Responses.stackPartner('info'),
    },
    {
      id: 'FRU P2 Banish III Spread',
      type: 'StartsUsing',
      netRegex: { id: '9D1D', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'FRU P2 Chains of Evelasting Light',
      type: 'GainsEffect',
      netRegex: { effectId: '103D' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chain',
          ko: '내게 체인, 맡은 자리로',
        },
      },
    },
    {
      id: 'FRU P2 Curse of Everlasting Light',
      type: 'HeadMarker',
      netRegex: { id: '0177' },
      condition: (data, matches) => {
        if (data.phase !== 'p2')
          return;
        data.p2Curses.push(matches.target);
        return data.p2Curses.length === 2;
      },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (!data.p2Curses.includes(data.me))
          return;
        const partner = data.party.member(data.p2Curses.find((p) => p !== data.me));
        if (partner === undefined)
          return output.text!({ player: output.unknown!() });
        if (data.options.OnlyAutumn) {
          // 어듬이는 TH팀이예여
          const dir = partner.role === 'dps' ? output.right!() : output.left!();
          return output.autumn!({ dir: dir, player: partner.nick });
        }
        return output.text!({ player: partner.nick });
      },
      outputStrings: {
        text: {
          en: 'AOE on YOU (${player})',
          ko: '내게 장판 (${player})',
        },
        autumn: {
          en: 'AOE ${dir} (${player})',
          ko: '장판, ${dir} (${player})',
        },
        left: Outputs.getLeftAndWest,
        right: Outputs.getRightAndEast,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'FRU P2 the House of Light',
      type: 'StartsUsing',
      netRegex: { source: 'Usurper of Frost', id: '9CFD', capture: false },
      infoText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: Outputs.spreadOwn,
      },
    },
    // //////////////// PHASE 3 //////////////////
    {
      id: 'FRU P3 Ultimate Relativity',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      response: Responses.bigAoe(),
      run: (data) => data.p2Relativity = 'ultimate',
    },
    {
      id: 'FRU P3 Ultimate Relativity Debuff Collect',
      type: 'GainsEffect',
      // 996 Spell-in-Waiting: Unholy Darkness
      // 997 Spell-in-Waiting: Dark Fire III
      // 998 Spell-in-Waiting: Shadoweye
      // 99C Spell-in-Waiting: Dark Eruption
      // 99B 빔 유도?
      // 99D Spell-in-Waiting: Dark Water III
      // 99E Spell-in-Waiting: Dark Blizzard III
      // 9A0 Spell-in-Waiting: Return
      netRegex: { effectId: ['99[678BCDE]', '9A0'] },
      condition: (data, matches) => data.p2Relativity === 'ultimate' && matches.target === data.me,
      run: (data, matches) => {
        data.p2Ultimate[matches.effectId.toUpperCase()] = parseFloat(matches.duration);
      },
    },
    {
      id: 'FRU P3 Ultimate Relativity Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: '99B', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 0.1,
      durationSeconds: (data) => data.options.OnlyAutumn ? 6 : 41,
      suppressSeconds: 0.1,
      infoText: (data, _matches, output) => {
        const ids = Object.keys(data.p2Ultimate).sort((a, b) =>
          (data.p2Ultimate[a] ?? 0) - (data.p2Ultimate[b] ?? 0)
        );
        const keys = ids.map((id) => ultimateRelativityIdKey[id]);
        if (keys === undefined || keys.length === 0)
          return;
        for (const key of keys) {
          if (key === undefined) {
            data.p2UltimateKeys = [];
            throw new UnreachableCode();
          }
          data.p2UltimateKeys.push(key);
        }
        if (data.options.OnlyAutumn) {
          // 어듬이는 TH팀이예여
          let role: 'blizzard' | 'fire11' | 'fire21' | 'fire31' | 'none';
          if (data.p2Ultimate['99E'] !== undefined)
            role = 'blizzard';
          else {
            const fire = data.p2Ultimate['997'];
            if (fire === undefined)
              role = 'none';
            else if (fire > 30)
              role = 'fire31';
            else if (fire > 20)
              role = 'fire21';
            else
              role = 'fire11';
          }
          if (role === undefined)
            throw new UnreachableCode();
          switch (role) {
            case 'blizzard': // attack3
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('🡻블리자가 버려요');
              data.p2UltimateAutumn.push('🡻빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻블리자가 (attack3)';
            case 'fire11': // attack3
              data.p2UltimateAutumn.push('🡻파이가 버려요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡻빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻빠른 파이가 (attack3)';
            case 'fire21': // stop1
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('🡸파이가 버려요');
              data.p2UltimateAutumn.push('(기둘려요)');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡸빔 유도 🔜 피하면서 바깥봐요');
              return '🡸중간 파이가 (stop1)';
            case 'fire31': // bind1 또는 bind2
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡿빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데 리턴 설치');
              data.p2UltimateAutumn.push('🡿파이가 버려요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡿느린 파이가 (바인드 마커 달아!!!)';
            case 'none': // attack3
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡻빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻무직 (attack3)';
          }
        }
        const res = keys.map((key) => output[key!]!());
        return res.join(output.next!());
      },
      outputStrings: {
        ...ultimateRelativityStrings,
        next: Outputs.next,
      },
    },
    {
      id: 'FRU P3 절 시간압축 #1',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 10 - 3 + 11, // 11
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text!({ mesg: mesg });
        return '응?';
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #2',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 10 - 3 + 16, // 16
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text!({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #3',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 10 - 3 + 21, // 21
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text!({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #4',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 10 - 3 + 26, // 26
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text!({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #5',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 10 - 3 + 31, // 31
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text!({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #6',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 10 - 3 + 42, // 42
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text!({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 Darkest Dance',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9CF5', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tanksOutPartyIn!();
        return output.partyInTanksOut!();
      },
      outputStrings: {
        partyInTanksOut: {
          en: 'Party In (Tanks Out)',
          ko: '안으로 (탱크가 밖으로)',
        },
        tanksOutPartyIn: {
          en: 'Tanks Out (Party In)',
          ko: '바깥으로 유도 (파티는 안)',
        },
      },
    },
    {
      id: 'FRU P3 Somber Dance',
      type: 'Ability',
      netRegex: { source: 'Oracle Of Darkness', id: '9D5B', capture: false },
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tanksInPartyOut!();
        return output.partyOutTanksIn!();
      },
      outputStrings: {
        partyOutTanksIn: {
          en: 'Party Out (Tanks In)',
          ko: '밖으로 (탱크가 안으로)',
        },
        tanksInPartyOut: {
          en: 'Tanks In (Party Out)',
          ko: '보스 밑으로 (파티는 바깥)',
        },
      },
    },
    {
      id: 'FRU P3 Shell Crusher',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9D5E', capture: false },
      response: Responses.getTogether(),
    },
    {
      id: 'FRU P3 Spirit Taker',
      type: 'Ability',
      netRegex: { source: 'Oracle Of Darkness', id: '9D60', capture: false },
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    {
      id: 'FRU P3 Black Halo',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9D62' },
      response: Responses.sharedOrInvinTankBuster(),
    },
    // //////////////// PHASE 4 //////////////////
    // //////////////// PHASE 5 //////////////////

    // CFB Dark Registance Down II
    // 9A1 Ice Resistance Down II
    // 1044 Light Registance Down II
    // 111F Fire Resistance Down II
    // 99F Spell-in-Waiting: Dark Aero III
    // 995 Return IV
    // 104E Spell-in-Waiting: Quietus
    // 1070 Spell-in-Waiting: Return
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Sinbound Fire III/Sinbound Thunder III': 'Sinbound Fire/Thunder',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker(?!\')': 'fusioniert(?:e|er|es|en) Ascian',
        'Fatebreaker\'s Image': 'Abbild des fusionierten Ascians',
      },
      'replaceText': {
        'Blastburn': 'Brandstoß',
        'Blasting Zone': 'Erda-Detonation',
        'Burn Mark': 'Brandmal',
        'Burnished Glory': 'Leuchtende Aureole',
        'Burnout': 'Brandentladung',
        'Burnt Strike': 'Brandschlag',
        'Cyclonic Break': 'Zyklon-Brecher',
        'Explosion': 'Explosion',
        'Fall Of Faith': 'Sünden-Erdspaltung',
        'Floating Fetters': 'Schwebende Fesseln',
        'Powder Mark Trail': 'Stetes Pulvermal',
        'Sinblaze': 'Sündenglut',
        'Sinbound Fire III': 'Sünden-Feuga',
        'Sinbound Thunder III': 'Sünden-Blitzga',
        'Sinsmite': 'Sündenblitz',
        'Sinsmoke': 'Sündenflamme',
        'Turn Of The Heavens': 'Kreislauf der Wiedergeburt',
        'Utopian Sky': 'Paradiestrennung',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker(?!\')': 'Sabreur de destins',
        'Fatebreaker\'s Image': 'double du Sabreur de destins',
      },
      'replaceText': {
        'Blastburn': 'Explosion brûlante',
        'Blasting Zone': 'Zone de destruction',
        'Burn Mark': 'Marque explosive',
        'Burnished Glory': 'Halo luminescent',
        'Burnout': 'Combustion totale',
        'Burnt Strike': 'Frappe brûlante',
        'Cyclonic Break': 'Brisement cyclonique',
        'Explosion': 'Explosion',
        'Fall Of Faith': 'Section illuminée',
        'Floating Fetters': 'Entraves flottantes',
        'Powder Mark Trail': 'Marquage fatal enchaîné',
        'Sinblaze': 'Embrasement authentique',
        'Sinbound Fire III': 'Méga Feu authentique',
        'Sinbound Thunder III': 'Méga Foudre authentique',
        'Sinsmite': 'Éclair du péché',
        'Sinsmoke': 'Flammes du péché',
        'Turn Of The Heavens': 'Cercles rituels',
        'Utopian Sky': 'Ultime paradis',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker(?!\')': 'フェイトブレイカー',
        'Fatebreaker\'s Image': 'フェイトブレイカーの幻影',
        'Usurper of Frost': 'シヴァ・ミトロン',
        'Oracle\'s Reflection': '巫女の鏡像',
        'Frozen Mirror': '氷面鏡',
        'Oracle of Darkness': '闇の巫女',
      },
      'replaceText': {
        'Blastburn': 'バーンブラスト',
        'Blasting Zone': 'ブラスティングゾーン',
        'Burn Mark': '爆印',
        'Burnished Glory': '光焔光背',
        'Burnout': 'バーンアウト',
        'Burnt Strike': 'バーンストライク',
        'Cyclonic Break': 'サイクロニックブレイク',
        'Explosion': '爆発',
        'Fall Of Faith': 'シンソイルセヴァー',
        'Floating Fetters': '浮遊拘束',
        'Powder Mark Trail': '連鎖爆印刻',
        'Sinblaze': 'シンブレイズ',
        'Sinbound Fire III': 'シンファイガ',
        'Sinbound Thunder III': 'シンサンダガ',
        'Sinsmite': 'シンボルト',
        'Sinsmoke': 'シンフレイム',
        'Turn Of The Heavens': '転輪召',
        'Utopian Sky': '楽園絶技',
      },
    },
  ],
};

export default triggerSet;

// FRU / FUTURES REWRITTEN (Ultimate) / 絶エデン / 絶もうひとつの未来
