import { AutumnDirections } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { PartyMemberParamObject } from '../../../../../types/party';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'p1' | 'p2' | 'p3' | 'p4' | 'p5';
type FallOfFaithTether = {
  target: PartyMemberParamObject;
  color: 'red' | 'blue';
};
type PrsFru = {
  r: string; // 롤
  j: string; // 직업
  t: number; // 팀
  p: number; // 기본 맡은 자리 방향 (0-북, 7-북서)
  mm: number; // P2 거울 팀
  n: string; // 이름
  // 내부
  i: number; // 순번
};

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

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    autumnConcealed: boolean;
  };
  phase: Phase;
  p1SafeMarkers: number[];
  p1Utopian?: 'stack' | 'spread';
  p1Falled?: boolean;
  p1FallSide?: 'left' | 'right';
  p1FallTethers: FallOfFaithTether[];
  p2Kick?: 'axe' | 'scythe';
  p2Icicle?: number;
  p2Stone?: boolean;
  p2Puddles: PartyMemberParamObject[];
  p2Lights?: number;
  p2Cursed?: boolean;
  p3Relativity?: 'ultimate';
  p3Ultimate: { [name: string]: number };
  p3Umesg: string[];
  //
  members?: PrsFru[];
  my?: PrsFru;
  actors: { [id: string]: NetMatches['ActorSetPos'] };
}

const triggerSet: TriggerSet<Data> = {
  id: 'FuturesRewrittenUltimate',
  zoneId: ZoneId.FuturesRewrittenUltimate,
  config: [
    {
      id: 'autumnConcealed',
      name: {
        en: 'Autumn style concealed',
        ko: '어듬이 스타일 concealed',
      },
      comment: {
        en: 'Autumn style concealed',
        ko: '어듬이 스타일 concealed',
      },
      type: 'checkbox',
      default: (options) => options.OnlyAutumn,
    },
  ],
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    p1SafeMarkers: [...AutumnDirections.outputNumber8],
    p1FallTethers: [],
    p2Puddles: [],
    p3Ultimate: {},
    p3Umesg: [],
    actors: {},
  }),
  timelineTriggers: [
    {
      id: 'FRU 데이터 확인',
      regex: /--setup--/,
      delaySeconds: 1,
      durationSeconds: 2,
      infoText: (data, _matches, output) => {
        if (!data.members)
          return output.none!();
        for (let i = 0; i < data.members.length; i++) {
          const m = data.members[i];
          if (m)
            m.i = i;
        }
        data.my = data.members.find((m) => m.j === data.job && m.n === data.me);
        if (!data.my)
          return output.empty!();
        return output.ok!();
      },
      outputStrings: {
        none: {
          en: 'No members data',
          ko: '멤버 데이터가 없어요',
        },
        empty: {
          en: 'No my data',
          ko: '내 데이터가 없어요',
        },
        ok: {
          en: 'Data OK',
          ko: '데이터 확인',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'FRU Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9CD4', '9CFF', '9D49', '9D36', '9D72'], capture: true },
      run: (data, matches) => {
        switch (matches.id) {
          case '9CD0': // cyclonic break fire
          case '9CD4': // cyclonic break lightning
            data.phase = 'p1';
            break;
          case '9CFF': // quadruple slap
            data.phase = 'p2';
            break;
          case '9D49': // hell's judgement
            data.phase = 'p3';
            break;
          case '9D36': // materialization
            data.phase = 'p4';
            break;
          case '9D72': // fulgent blade
            if (data.phase === 'p5')
              return;
            data.phase = 'p5';
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
      id: 'FRU P1 Concealed',
      type: 'ActorControlExtra',
      netRegex: { category: '003F', param1: '4', capture: true },
      condition: (data) => data.phase === 'p1' && data.p1Utopian !== undefined,
      durationSeconds: (data) => data.triggerSetConfig.autumnConcealed ? 7.5 : 2.5,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
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
          safe: {
            en: '${action} ${dir1} / ${dir2}',
            ko: '${action} ${dir1}${dir2}',
          },
          stack: Outputs.stacks,
          spread: Outputs.spreadOwn,
          ...AutumnDirections.outputStringsMarker8,
        };
        const image = data.actors[matches.id];
        if (image === undefined)
          return;
        const dir1 = Directions.hdgTo8DirNum(parseFloat(image.heading));
        const dir2 = (dir1 + 4) % 8;
        data.p1SafeMarkers = data.p1SafeMarkers.filter((d) => d !== dir1 && d !== dir2);
        if (data.p1SafeMarkers.length !== 2)
          return;

        // 어듬이 제공
        if (data.triggerSetConfig.autumnConcealed) {
          const dir1 = AutumnDirections.outputFromMarker8Num(data.p1SafeMarkers.shift()!);
          const dir2 = AutumnDirections.outputFromMarker8Num(data.p1SafeMarkers.shift()!);
          return {
            infoText: output.safe!({
              action: output[data.p1Utopian!]!(),
              dir1: output[dir1]!(),
              dir2: output[dir2]!(),
            }),
          };
        }
        if (data.my !== undefined) {
          if (data.p1SafeMarkers.includes(data.my.p))
            return { alertText: output.stay!() };
          return { alertText: output.front!() };
        }
      },
    },
    {
      id: 'FRU P1 Concealed Left',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker', capture: false },
      delaySeconds: 11,
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.p1SafeMarkers.length !== 2)
          return;
        const dir1 = AutumnDirections.outputFromMarker8Num(data.p1SafeMarkers.shift()!);
        const dir2 = AutumnDirections.outputFromMarker8Num(data.p1SafeMarkers.shift()!);
        return output.safe!({
          action: output[data.p1Utopian!]!(),
          dir1: output[dir1]!(),
          dir2: output[dir2]!(),
        });
      },
      run: (data) => delete data.p1Utopian,
      outputStrings: {
        safe: {
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
        const count = data.p1FallTethers.length;
        if (matches.target === data.me) {
          data.p1FallSide = count % 2 === 0 ? 'right' : 'left';
          return output.text!({ num: count, color: output[color]!() });
        }

        // 어듬이 전용
        if (data.options.OnlyAutumn && count === 4 && data.p1FallSide === undefined) {
          // 어듬이는 탱크 아니면 렌지 아니면 캐스터
          data.p1FallSide = 'right';
          if (data.role === 'tank') {
            const healers = data.p1FallTethers.filter((d) => d.target.role === 'healer').length;
            if (healers !== 0)
              data.p1FallSide = 'left';
          }
          return data.p1FallSide === 'left' ? output.getLeftAndWest!() : output.getRightAndEast!();
        }
      },
      outputStrings: {
        text: {
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
        const [rn, rs] = cardinal ? ['intercard', 'cardinal'] : ['cardinal', 'intercard'];
        const kick = data.p2Kick === undefined ? '' : output[data.p2Kick]!();

        const target = data.party.member(matches.target);
        data.p2Stone = true;
        if (data.role === 'dps') {
          if (target.role !== 'dps')
            return output.stone!({ kick: kick, ind: output[rs]!() });
          data.p2Stone = false;
          return output.needle!({ kick: kick, ind: output[rn]!() });
        }
        if (target.role === 'dps')
          return output.stone!({ kick: kick, ind: output[rs]!() });
        data.p2Stone = false;
        return output.needle!({ kick: kick, ind: output[rn]!() });
      },
      run: (data, _matches) => data.actors = {},
      outputStrings: {
        needle: {
          en: '${kick} + ${ind} (Bait Flower)',
          ko: '${kick} + ${ind} (얼음꽃 설치)',
        },
        stone: {
          en: '${kick} + ${ind} (Bait Cone)',
          ko: '${kick} + ${ind} (원뿔 유도)',
        },
        cardinal: Outputs.cardinals,
        intercard: Outputs.intercards,
        axe: Outputs.outside,
        scythe: Outputs.inside,
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

        // 어듬이 제공
        if (data.my !== undefined) {
          const dirs = data.my.t === 1 ? [0, 1, 6, 7] : [2, 3, 4, 5];
          const res = AutumnDirections.outputFromMarker8Num(dirs.includes(dir1) ? dir1 : dir2);
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
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.5,
      durationSeconds: 2,
      alarmText: (data, _matches, output) => {
        if (data.p2Stone !== undefined && data.p2Stone)
          return output.text!();
      },
      tts: (data, _matches, output) => {
        if (data.p2Stone !== undefined && data.p2Stone)
          return output.tts!();
      },
      run: (data) => delete data.p2Stone,
      outputStrings: {
        text: {
          en: 'Go center',
          ko: '장판 피해욧! 한가운데로!',
        },
        tts: {
          en: 'center',
          ko: '動いて！',
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
      durationSeconds: 2,
      alarmText: (_data, _matches, output) => output.text!(),
      tts: (_data, _matches, output) => output.tts!(),
      outputStrings: {
        text: {
          en: 'Slip',
          ko: '미끄러져요!',
        },
        tts: {
          en: 'slip',
          ko: '動いて！',
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
      id: 'FRU P2 Mirror, Mirror',
      type: 'Ability',
      netRegex: { id: '9CF3', capture: false },
      run: (data) => data.actors = {},
    },
    /* 이거 안된다... 훔
    {
      id: 'FRU P2 Blue Mirror',
      // 257 101:800375BF:02000100:08:00:0000 빨강
      // 257 101:800375BF:02000100:02:00:0000 빨강
      // 257 101:800375BF:00020001:04:00:0000 하양
      // 271 10F:40014546:-2.3563:00:00:114.1421:114.1421:0.0000
      // 271 10F:40014547:-0.7855:00:00:114.1421:85.8579:0.0000
      // 271 10F:40014548:0.7853:00:00:85.8579:85.8579:0.0000
      type: 'MapEffect',
      netRegex: { flags: '00020001', location: '04', capture: false },
      infoText: (data, _matches, output) => {
        const actors = Object.values(data.actors);
        if (actors.length < 3)
          return;
        const sorted = actors.sort((a, b) => parseInt(b.id, 16) - parseInt(a.id, 16));
        const dir = Directions.hdgTo8DirNum(parseFloat(sorted[0]!.heading));
        if (data.my !== undefined) {
          // 어듬이 제공
          if (data.my.mm === 1) {
            const res = AutumnDirections.outputFromMarker8Num((dir + 4) % 8);
            return output.oppo!({ mark: output[res]!() });
          }
          const res = AutumnDirections.outputFromMarker8Num(dir);
          return output.blue!({ mark: output[res]!() });
        }
        const m1 = AutumnDirections.outputFromMarker8Num(dir < 4 ? dir : dir - 4);
        const m2 = AutumnDirections.outputFromMarker8Num(dir < 4 ? dir + 4 : dir);
        return output.mirror!({ m1: output[m1]!(), m2: output[m2]!() });
      },
      outputStrings: {
        blue: {
          en: 'Blue Mirror ${mark}',
          ko: '파란 거울 ${mark}',
        },
        oppo: {
          en: 'Opposite ${mark}',
          ko: '반대 거울 ${mark}',
        },
        mirror: {
          en: 'Mirror ${m1} / ${m2}',
          ko: '거울 ${m1}${m2}',
        },
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    */
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
      id: 'FRU P2 Light Rampant',
      type: 'StartsUsing',
      netRegex: { id: '9D14', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'FRU P2 Light Rampant Debuff',
      type: 'HeadMarker',
      netRegex: { id: '0177' },
      condition: (data, matches) => {
        if (data.phase !== 'p2')
          return;
        data.p2Puddles.push(data.party.member(matches.target));
        return data.p2Puddles.length === 2;
      },
      durationSeconds: 6,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          aoe: {
            en: 'AOE on YOU (${player})',
            ko: '내게 장판! (${player})',
          },
          chain: {
            en: 'Chain on YOU ${mark}',
            ko: '내게 체인! ${mark} 마커로!',
          },
          spread: {
            en: 'Chain on YOU',
            ko: '내게 체인, 맡은 자리로',
          },
          cnum4: Outputs.cnum4,
          cmarkC: Outputs.cmarkC,
          unknown: Outputs.unknown,
        };
        if (!data.p2Puddles.some((p) => p.name === data.me)) {
          if (data.options.OnlyAutumn && data.role === 'tank') {
            // 어듬이 전용
            const cps: string[] = ['AST', 'WHM'];
            const marker = data.p2Puddles.some((p) => cps.includes(p.job!)) ? 'cnum4' : 'cmarkC';
            return { alertText: output.chain!({ mark: output[marker]!() }) };
          }
          // 장판이 없어요 (Chains of Evelasting Light: effectId '103D')
          return { infoText: output.spread!() };
        }
        const partner = data.p2Puddles.find((p) => p.name !== data.me);
        if (partner === undefined)
          return { infoText: output.aoe!({ player: output.unknown!() }) };
        return { infoText: output.aoe!({ player: partner.nick }) };
      },
    },
    {
      id: 'FRU P2 Lightsteeped Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '8D1' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.p2Lights = parseInt(matches.count),
    },
    {
      id: 'FRU P2 Curse of Everlasting Light',
      type: 'LosesEffect',
      netRegex: { effectId: '103E', capture: false },
      durationSeconds: 3,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.p2Lights === 2) {
          data.p2Cursed = true;
          return output.tower!();
        }
      },
      outputStrings: {
        tower: {
          en: 'Tower',
          ko: '타워 밟아요!',
        },
      },
    },
    {
      id: 'FRU P2 Bright Hunger',
      type: 'Ability',
      netRegex: { source: 'Usurper of Frost', id: '9D15' },
      condition: (data, matches) =>
        matches.target === data.me && data.p2Cursed && data.p2Lights === 2,
      durationSeconds: 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out of tower',
          ko: '타워에서 나와요!',
        },
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
      durationSeconds: (data) => data.options.OnlyAutumn ? 5 : 41,
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
        const res = keys.map((key) => output[key!]!());
        return res.join(output.next!());
      },
      outputStrings: {
        next: {
          en: ' => ',
          ko: ' ',
        },
        stack: {
          en: 'Stacks',
          ko: '🔘',
        },
        fire: {
          en: 'Fire',
          ko: '🔥',
        },
        shadoweye: {
          en: 'Gaze',
          ko: '👁️',
        },
        eruption: {
          en: 'Spread',
          ko: '🔅',
        },
        beam: {
          en: 'Beam',
          ko: '🔦',
        },
        water: {
          en: 'Water',
          ko: '💧',
        },
        blizzard: {
          en: 'Blizzard',
          ko: '❄️',
        },
        return: {
          en: 'Return',
          ko: '↻',
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
