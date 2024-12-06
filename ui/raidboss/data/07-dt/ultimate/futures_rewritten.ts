import { AutumnDirections } from '../../../../../resources/autumn';
// import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { PartyMemberParamObject } from '../../../../../types/party';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'p1' | 'p2' | 'p3';
type FallOfFaithTether = { target: PartyMemberParamObject; color: 'red' | 'blue' };

const p3UltimateIdKey: { [effectId: string]: string } = {
  '996': 'stack',
  '997': 'fire',
  '998': 'shadoweye',
  '99C': 'eruption',
  '99B': 'beam',
  '99D': 'water',
  '99E': 'blizzard',
  '9A0': 'return',
} as const;

const p3UltimateStrings = {
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
  p1SafeMarkers: number[];
  p1Utopian?: 'stack' | 'spread';
  p1Falled?: boolean;
  p1FallSide?: 'left' | 'right';
  p1FallTethers: FallOfFaithTether[];
  p2Kick?: 'axe' | 'scythe';
  p2Icicle?: number;
  p2Needle?: boolean;
  p2Curses: string[];
  p3Relativity?: 'ultimate';
  p3Ultimate: { [name: string]: number };
  p3UltimateAutumn: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'FuturesRewrittenUltimate',
  zoneId: ZoneId.FuturesRewrittenUltimate,
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    actors: {},
    p1SafeMarkers: [...AutumnDirections.outputNumber8],
    p1FallTethers: [],
    p2Curses: [],
    p3Ultimate: {},
    p3UltimateAutumn: [],
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
      condition: (data) => data.phase === 'p1' || data.phase === 'p2',
      run: (data, matches) => data.actors[matches.id] = matches,
    },
    // //////////////// PHASE 1 //////////////////
    {
      id: 'FRU P1 Cyclonic Break Fire',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9D89'], capture: false },
      durationSeconds: 7,
      response: Responses.stackPartner(),
    },
    {
      id: 'FRU P1 Cyclonic Break Lightning',
      type: 'StartsUsing',
      netRegex: { id: ['9CD4', '9D8A'], capture: false },
      durationSeconds: 7,
      response: Responses.spread(),
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
      run: (data, matches) => data.p1Utopian = matches.id === '9CDA' ? 'stack' : 'spread',
    },
    {
      id: 'FRU P1 Concealed Collect',
      type: 'ActorControlExtra',
      netRegex: { category: '003F', param1: '4', capture: true },
      condition: (data) => data.phase === 'p1' && data.p1Utopian !== undefined,
      durationSeconds: 2.5,
      alertText: (data, matches, output) => {
        const image = data.actors[matches.id];
        if (image === undefined)
          return;
        const dir1 = Directions.hdgTo8DirNum(parseFloat(image.heading));
        const dir2 = (dir1 + 4) % 8;
        data.p1SafeMarkers = data.p1SafeMarkers.filter((d) => d !== dir1 && d !== dir2);
        if (data.p1SafeMarkers.length !== 2)
          return;

        // 어듬이 전용
        if (data.p1SafeMarkers.includes(0))
          return output.stay!();
        return output.front!();
      },
      outputStrings: {
        front: {
          en: '(Go Front)',
          ja: '(前へ)',
          ko: '(앞으로, 내자리 아님)',
        },
        stay: {
          en: '(Stay)',
          ja: '(そのまま待機)',
          ko: '(당첨, 그대로 대기)',
        },
      },
    },
    {
      id: 'FRU P1 Concealed Safe',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker', capture: false },
      delaySeconds: 11,
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.p1SafeMarkers.length !== 2)
          return;
        const dir1 = AutumnDirections.outputFromMarker8Num(data.p1SafeMarkers.shift()!);
        const dir2 = AutumnDirections.outputFromMarker8Num(data.p1SafeMarkers.shift()!);
        const action = output[data.p1Utopian!]!();
        return output.text!({ action: action, dir1: output[dir1]!(), dir2: output[dir2]!() });
      },
      run: (data) => delete data.p1Utopian,
      outputStrings: {
        text: {
          en: '${action} ${dir1} / ${dir2}',
          ko: '${action} ${dir1}${dir2}',
        },
        stack: Outputs.stacks,
        spread: Outputs.spreadOwn,
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
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1.5,
      durationSeconds: 2.5,
      response: Responses.knockback(),
    },
    {
      id: 'FRU P1 Burnout',
      type: 'StartsUsing',
      netRegex: { id: ['9CC6', '9CE4'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2.5,
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
      run: (data, _matches) => data.p1Falled = true,
    },
    {
      id: 'FRU P1 Fall of Faith Collect',
      type: 'Tether',
      netRegex: { id: ['00F9', '011F'] },
      condition: (data, _matches) => data.phase === 'p1' && data.p1Falled,
      durationSeconds: 3,
      alertText: (data, matches, output) => {
        const target = data.party.member(matches.target);
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.p1FallTethers.push({ target: target, color: color });
        if (matches.target === data.me) {
          data.p1FallSide = data.p1FallTethers.length % 2 === 0 ? 'right' : 'left';
          return output.mine!({ num: data.p1FallTethers.length, color: output[color]!() });
        }
        if (data.options.OnlyAutumn && data.p1FallTethers.length === 4) {
          // 어듬이는 힐러 둘 다 안걸리면 오른쪽으로
          const healers = data.p1FallTethers.filter((d) => d.target.role === 'healer').length;
          if (healers === 0) {
            data.p1FallSide = 'right';
            return output.getRightAndEast!();
          }
          data.p1FallSide = 'left';
          return output.getLeftAndWest!();
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
      condition: (data) => data.p1FallTethers.length === 4,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        let colors;
        if (data.p1FallSide === undefined)
          colors = data.p1FallTethers.map((c) => output[c.color]!());
        else if (data.p1FallSide === 'left')
          colors = [data.p1FallTethers[0], data.p1FallTethers[2]].map((c) => output[c!.color]!());
        else
          colors = [data.p1FallTethers[1], data.p1FallTethers[3]].map((c) => output[c!.color]!());
        return colors.join(output.next!());
      },
      run: (data) => {
        data.p1FallTethers = [];
        delete data.p1FallSide;
      },
      outputStrings: {
        red: Outputs.red,
        blue: Outputs.blue,
        next: Outputs.next,
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
      id: 'FRU P2 Frigid Stone/Needle',
      type: 'HeadMarker',
      netRegex: { id: '0159' },
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        let cardinal = false;
        const actors = Object.values(data.actors);
        if (actors.length >= 2 && actors[1] !== undefined) {
          data.p2Icicle = Directions.hdgTo8DirNum(parseFloat(actors[1].heading));
          if (data.p2Icicle % 2 === 0)
            cardinal = true;
        }
        const [rf, rb] = cardinal ? ['intercard', 'cardinal'] : ['cardinal', 'intercard'];
        const kick = data.p2Kick === undefined ? '' : output[data.p2Kick]!();

        const target = data.party.member(matches.target);
        if (data.options.OnlyAutumn) {
          // 어듬이는 MT팀이예여
          data.p2Needle = target.role === 'dps' ? false : true;
        }
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
          en: '${kick} + ${ind} (Bait Flower)',
          ko: '${kick} + ${ind} (얼음꽃 설치)',
        },
        cone: {
          en: '${kick} + ${ind} (Bait Cone)',
          ko: '${kick} + ${ind} (원뿔 유도)',
        },
        cardinal: {
          en: 'Cardinal',
          ko: '십자',
        },
        intercard: {
          en: 'Intercard',
          ko: '비스듬',
        },
        axe: Outputs.out,
        scythe: Outputs.in,
      },
    },
    {
      id: 'FRU P2 Heavenly Strike',
      type: 'Ability',
      // 버근가 소스가 이상해
      // AOEActionEffect 16:4002699C:Usurper of Frost:9D07:Frigid Stone:
      // AOEActionEffect 16:40013FF1:Fatebreaker's Image:9D07:Frigid Stone:
      netRegex: { id: '9D07', capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.p2Icicle === undefined)
          return output.autumn!({ dir: output.unknown!() });
        const dir = data.p2Icicle;
        const dir1 = dir < 4 ? dir : dir - 4;
        const dir2 = dir < 4 ? dir + 4 : dir;
        if (data.options.OnlyAutumn) {
          // 어듬이는 MT팀이예여
          const adirs = [0, 1, 6, 7];
          const res = AutumnDirections.outputFromMarker8Num(adirs.includes(dir1) ? dir1 : dir2);
          return output.autumn!({ dir: output[res]!() });
        }
        const m1 = AutumnDirections.outputFromMarker8Num(dir1);
        const m2 = AutumnDirections.outputFromMarker8Num(dir2);
        return output.knockback!({ dir1: output[m1]!(), dir2: output[m2]!() });
      },
      run: (data, _matches) => delete data.p2Icicle,
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
      id: 'FRU P2 Axe Kick Frigid Needle',
      type: 'StartsUsing',
      netRegex: { id: '9D0A', source: 'Oracle\'s Reflection' },
      condition: (data, _matches) => data.options.OnlyAutumn,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.5,
      durationSeconds: 3,
      alarmText: (data, _matches, output) => {
        if (data.p2Needle !== undefined && !data.p2Needle)
          return output.text!();
      },
      run: (data) => delete data.p2Needle,
      outputStrings: {
        text: {
          en: 'Go center',
          ko: '움직여요! 한가운데로!',
        },
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
      id: 'FRU P2 Twin Slip',
      type: 'StartsUsing',
      netRegex: { id: ['9D01', '9D02'], source: 'Oracle\'s Reflection', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.5,
      durationSeconds: 3,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Slip',
          ko: '미끄러져요!',
        },
      },
    },
    {
      id: 'FRU P2 Hallowed Ray',
      type: 'StartsUsing',
      netRegex: { id: '9D12', capture: false },
      response: Responses.aoe(),
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
      condition: (data, matches) => !data.options.OnlyAutumn && data.me === matches.target,
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
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: 'AOE on YOU (${player})',
            ko: '내게 장판! (${player})',
          },
          chain: {
            en: 'Chain ${mark}',
            ko: '내게 체인! ${mark} 마커로!',
          },
          cnum4: Outputs.cnum4,
          cmarkC: Outputs.cmarkC,
          left: Outputs.getLeftAndWest,
          right: Outputs.getRightAndEast,
          unknown: Outputs.unknown,
        };
        if (!data.p2Curses.includes(data.me)) {
          if (data.options.OnlyAutumn) {
            // 어듬이 전용
            const p1 = data.party.member(data.p2Curses.shift());
            const p2 = data.party.member(data.p2Curses.shift());
            if (p1 === undefined || p2 === undefined)
              return;
            if (p1.job === 'AST' || p2.job === 'AST' || p1.job === 'WHM' || p2.job === 'WHM')
              return { alertText: output.chain!({ mark: output.cnum4!() }) };
            return { alertText: output.chain!({ mark: output.cmarkC!() }) };
          }
          return;
        }
        const partner = data.party.member(data.p2Curses.find((p) => p !== data.me));
        if (partner === undefined)
          return { infoText: output.text!({ player: output.unknown!() }) };
        return { infoText: output.text!({ player: partner.nick }) };
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
      run: (data) => data.p3Relativity = 'ultimate',
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
      condition: (data, matches) => data.p3Relativity === 'ultimate' && matches.target === data.me,
      run: (data, matches) => {
        data.p3Ultimate[matches.effectId.toUpperCase()] = parseFloat(matches.duration);
      },
    },
    {
      id: 'FRU P3 Ultimate Relativity Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: '99B', capture: false },
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 0.1,
      durationSeconds: (data) => data.options.OnlyAutumn ? 6 : 41,
      suppressSeconds: 0.1,
      infoText: (data, _matches, output) => {
        const ids = Object.keys(data.p3Ultimate).sort((a, b) =>
          (data.p3Ultimate[a] ?? 0) - (data.p3Ultimate[b] ?? 0)
        );
        const keys = ids.map((id) => p3UltimateIdKey[id]);
        if (keys === undefined || keys.length === 0)
          return;
        for (const key of keys) {
          if (key === undefined)
            throw new UnreachableCode();
        }
        if (data.options.OnlyAutumn) {
          // 어듬이는 TH팀이예여
          let role: 'blizzard' | 'fire11' | 'fire21' | 'fire31' | 'none';
          if (data.p3Ultimate['99E'] !== undefined)
            role = 'blizzard';
          else {
            const fire = data.p3Ultimate['997'];
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
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('모래시계 리턴 설치');
              data.p3UltimateAutumn.push('🡻블리자가 버려요');
              data.p3UltimateAutumn.push('🡻빔 유도');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻블리자가 (attack3)';
            case 'fire11': // attack3
              data.p3UltimateAutumn.push('🡻파이가 버려요');
              data.p3UltimateAutumn.push('모래시계 리턴 설치');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('🡻빔 유도');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻빠른 파이가 (attack3)';
            case 'fire21': // stop1
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('모래시계 리턴 설치');
              data.p3UltimateAutumn.push('🡸파이가 버려요');
              data.p3UltimateAutumn.push('(기둘려요)');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('🡸빔 유도 🔜 피하면서 바깥봐요');
              return '🡸중간 파이가 (stop1)';
            case 'fire31': // bind1 또는 bind2
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('🡿빔 유도');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('한가운데 리턴 설치');
              data.p3UltimateAutumn.push('🡿파이가 버려요');
              data.p3UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡿느린 파이가 (바인드 마커 달아!!!)';
            case 'none': // attack3
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('모래시계 리턴 설치');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('🡻빔 유도');
              data.p3UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p3UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻무직 (attack3)';
          }
        }
        const res = keys.map((key) => output[key!]!());
        return res.join(output.next!());
      },
      outputStrings: {
        ...p3UltimateStrings,
        next: Outputs.next,
      },
    },
    {
      id: 'FRU P3 절 시간압축 #1',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 5 + 11, // 11
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p3UltimateAutumn.shift();
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
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 6 + 16, // 16
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p3UltimateAutumn.shift();
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
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 6 + 21, // 21
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p3UltimateAutumn.shift();
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
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 6 + 26, // 26
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p3UltimateAutumn.shift();
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
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 6 + 31, // 31
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p3UltimateAutumn.shift();
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
      condition: (data) => data.p3Relativity === 'ultimate',
      delaySeconds: 5 + 42, // 42
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p3UltimateAutumn.shift();
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
          ko: '바깥으로 (파티는 안)',
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
        'Pandora': 'パンドラ・ミトロン',
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
