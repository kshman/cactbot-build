import { AutumnDirections } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { PartyMemberParamObject } from '../../../../../types/party';
import { TriggerSet } from '../../../../../types/trigger';

const centerX = 100;
const centerY = 100;

type Phase = 'p1' | 'p2' | 'p3ur' | 'p3ap' | 'p4' | 'p5' | 'unknown';
const phases: { [id: string]: Phase } = {
  '9CFF': 'p2', // Quadruple Slap (pre-Diamond Dust)
  '9D49': 'p3ur', // Hell's Judgment (pre-Ultimate Relativity)
  '9D4D': 'p3ap', // Spell-in-Waiting: Refrain (pre-Apocalypse)
  '9D36': 'p4', // Materialization (pre-Darklit Dragonsong)
  // '9D36': 'p4ds', // Materialization (pre-Darklit Dragonsong)
  // '9D6A': 'p4ct', // Crystallize Time
  '9D72': 'p5', // Fulgent Blade
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

// P1
type FallOfFaithTether = {
  color: 'red' | 'blue';
  target: PartyMemberParamObject;
};

// P2
type SlipClockPos = 'same' | 'oppo' | 'cw' | 'ccw' | 'unknown';
const calcClockPos = (start: number, compare: number): SlipClockPos => {
  const delta = (compare - start + 8) % 8;
  if (delta === 0)
    return 'same';
  else if (delta < 4)
    return 'cw';
  else if (delta === 4)
    return 'oppo';
  return 'ccw';
};

// P3
type UltimateRelativityRole = 'f11' | 'f21' | 'f31' | 'ice';
const findNorthDirNum = (dirs: number[]): number => {
  for (let i = 0; i < dirs.length; i++) {
    for (let j = i + 1; j < dirs.length; j++) {
      const [dir1, dir2] = [dirs[i], dirs[j]];
      if (dir1 === undefined || dir2 === undefined)
        return -1;
      const diff = Math.abs(dir1 - dir2);
      if (diff === 2)
        return Math.min(dir1, dir2) + 1;
      else if (diff === 6) // wrap around
        return (Math.max(dir1, dir2) + 1) % 8;
    }
  }
  return -1;
};
type DarkWaterContainer = {
  time: number;
  target: PartyMemberParamObject;
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    autumnConcealed: boolean;
    sinboundRotate: 'aacc' | 'addposonly'; // aacc = always away, cursed clockwise
  };
  phase: Phase;
  //
  p1SafeMarkers: number[];
  p1Utopian?: 'stack' | 'spread';
  p1Falled?: boolean;
  p1FallSide?: 'left' | 'right';
  p1FallTethers: FallOfFaithTether[];
  //
  p2Kick?: 'axe' | 'scythe';
  p2Icicle: number[];
  p2Knockback?: number;
  p2Stone?: boolean;
  p2Puddles: PartyMemberParamObject[];
  p2Lights?: number;
  p2Cursed?: boolean;
  //
  p3Role?: UltimateRelativityRole;
  p3Strat: string[];
  p3Sigyes: { [id: string]: NetMatches['AddedCombatant'] };
  p3NoranJul: number[];
  p3DarkWater: DarkWaterContainer[];
  p3MyDark?: DarkWaterContainer;
  p3ApocInit?: number;
  p3ApocSwap?: boolean;
  p3ApocNo?: number;
  p3ApocRot?: 1 | -1; // 1 = clockwise, -1 = counterclockwise
  //
  p4Tether: string[];
  p4DarkWater: string[];
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
        en: 'P1 Autumn style concealed',
        ja: 'P1 秋のスタイル concealed',
        ko: 'P1 어듬이 스타일 concealed',
      },
      comment: {
        en: 'Autumn style concealed',
        ja: '秋のスタイル concealed',
        ko: '어듬이 스타일 concealed',
      },
      type: 'checkbox',
      default: (options) => options.OnlyAutumn,
    },
    {
      id: 'sinboundRotate',
      comment: {
        en:
          `Always Away, Cursed Clockwise: <a href="https://pastebin.com/ue7w9jJH" target="_blank">LesBin<a>`,
      },
      name: {
        en: 'P2 Diamond Dust / Sinbound Holy',
        ja: 'P2 ダイアモンドダスト / シンバウンドホーリー',
        ko: 'P2 다이아몬드 더스트 / 신바운드 홀리',
      },
      type: 'select',
      options: {
        en: {
          'Always Away, Cursed Clockwise': 'aacc',
          'Call Add Position Only': 'addposonly',
        },
        ja: {
          'いつも遠く、呪い時計回り': 'aacc',
          'リンの位置だけ呼ぶ': 'addposonly',
        },
        ko: {
          '언제나 린에서 멀리, 저주 시계방향': 'aacc',
          '린 위치만 부르기': 'addposonly',
        },
      },
      default: 'aacc', // `addposonly` is not super helpful, and 'aacc' seems to be predominant
    },
  ],
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    p1SafeMarkers: [...AutumnDirections.outputNumber8],
    p1FallTethers: [],
    p2Icicle: [],
    p2Puddles: [],
    p3Ultimate: {},
    p3Umesg: [],
    p3Strat: [],
    p3Sigyes: {},
    p3NoranJul: [],
    p3DarkWater: [],
    p4Tether: [],
    p4DarkWater: [],
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
          ja: 'メンバーデータがありません',
          ko: '멤버 데이터가 없어요',
        },
        empty: {
          en: 'No my data',
          ja: '自分のデータがありません',
          ko: '내 데이터가 없어요',
        },
        ok: {
          en: 'Data OK',
          ja: 'データ確認完了',
          ko: '데이터 확인',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'FRU Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases) },
      run: (data, matches) => {
        data.phase = phases[matches.id] ?? 'unknown';
        data.actors = {};
      },
    },
    {
      id: 'FRU Actor Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}' },
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
      netRegex: { id: ['9CDA', '9CDB'] },
      run: (data, matches) => data.p1Utopian = matches.id === '9CDA' ? 'stack' : 'spread',
    },
    {
      id: 'FRU P1 Concealed',
      type: 'ActorControlExtra',
      netRegex: { category: '003F', param1: '4' },
      condition: (data) => data.phase === 'p1' && data.p1Utopian !== undefined,
      durationSeconds: (data) => data.triggerSetConfig.autumnConcealed ? 7.5 : 2.5,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          front: {
            en: '(Go Front)',
            ja: '(前へ)',
            ko: '(앞으로, 움직일 준비)',
          },
          stay: {
            en: '(Stay)',
            ja: '(そのまま待機)',
            ko: '(당첨, 그자리 그대로)',
          },
          safe: {
            en: '${action} ${dir1} / ${dir2}',
            ja: '${action} ${dir1}${dir2}',
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
          ja: '${action} ${dir1}${dir2}',
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
      delaySeconds: 5,
      durationSeconds: 7,
      infoText: (_data, matches, output) => {
        const safe = matches.id === '9CD6' ? 'blue' : 'red';
        return output.text!({ safe: output[safe]!() });
      },
      outputStrings: {
        text: {
          en: '${safe} Safe',
          ja: '${safe} 安置',
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
      id: 'FRU P1 Sinsmoke Tether',
      type: 'Tether',
      netRegex: { id: '00F9' },
      condition: (data, matches) => {
        if (data.p1Falled)
          return false;
        const target = data.party.member(matches.target);
        data.p1FallTethers.push({ target: target, color: 'red' });
        return data.p1FallTethers.length === 2;
      },
      infoText: (data, _matches, output) => {
        const r1 = data.p1FallTethers[0]?.target.role;
        const r2 = data.p1FallTethers[1]?.target.role;
        if (r1 === undefined || r2 === undefined)
          return;
        if (r1 === 'tank' && r2 === 'tank')
          return output.tt!();
        if (r1 === 'healer' && r2 === 'healer')
          return output.hh!();
        if (r1 === 'dps' && r2 === 'dps')
          return output.dps!();
        if ((r1 === 'tank' || r1 === 'healer') && (r2 === 'tank' || r2 === 'healer'))
          return output.th!();
        return output.none!();
      },
      outputStrings: {
        tt: {
          en: '(Tank-Tank)',
          ko: '(탱크 조정)',
        },
        hh: {
          en: '(Healer-Healer)',
          ko: '(힐러 조정)',
        },
        dps: {
          en: '(Dps)',
          ko: '(DPS 조정)',
        },
        th: {
          en: '(Tank-Healer)',
          ko: '(탱크/힐러 조정)',
        },
        none: {
          en: '(No adjust)',
          ko: '(조정 없음)',
        },
      },
    },
    {
      id: 'FRU P1 Fall of Faith',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      condition: (data) => !data.p1Falled,
      run: (data, _matches) => {
        data.p1FallTethers = [];
        data.p1Falled = true;
      },
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
          if (count % 2 === 0) {
            data.p1FallSide = 'right';
            return output.right!({ num: count, color: output[color]!() });
          }
          data.p1FallSide = 'left';
          return output.left!({ num: count, color: output[color]!() });
        }

        // 어듬이 전용
        if (data.options.OnlyAutumn && count === 4 && data.p1FallSide === undefined) {
          // 어듬이는 탱크 아니면 렌지 아니면 캐스터
          data.p1FallSide = 'right';
          if (data.role === 'tank') {
            const hs = data.p1FallTethers.filter((d) => d.target.role === 'healer').length;
            if (hs === 2)
              data.p1FallSide = 'left';
            const ts = data.p1FallTethers.filter((d) => d.target.role === 'tank').length;
            if ((hs + ts) === 2)
              data.p1FallSide = 'left';
          }
          return data.p1FallSide === 'left' ? output.getLeftAndWest!() : output.getRightAndEast!();
        }
      },
      outputStrings: {
        left: {
          en: 'Left ${num} ${color}',
          ja: '🡸${num}番目 ${color}',
          ko: '🡸${num}번 ${color}',
        },
        right: {
          en: 'Right ${num} ${color}',
          ja: '${num}番目 ${color}🡺',
          ko: '${num}번 ${color}🡺',
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
      id: 'FRU P2 Icicle Impact Initial Collect',
      type: 'StartsUsingExtra',
      netRegex: { id: '9D06' },
      condition: (data) => data.p2Icicle.length < 2,
      run: (data, matches) => {
        const dir = AutumnDirections.posConv8(matches.x, matches.y, centerX, centerY);
        data.p2Icicle.push(dir);
      },
    },
    {
      id: 'FRU P2 Frigid Stone/Needle',
      type: 'HeadMarker',
      netRegex: { id: '0159' },
      durationSeconds: 5,
      suppressSeconds: 1,
      // countdownSeconds: 5,
      alertText: (data, matches, output) => {
        const kick = data.p2Kick === undefined ? output.unknown!() : output[data.p2Kick]!();
        const target = data.party.member(matches.target);
        data.p2Stone = target.role === 'dps' ? data.role !== 'dps' : data.role === 'dps';
        const action = data.p2Stone ? output.stone!() : output.needle!();

        data.p2Knockback = data.p2Icicle[0] ?? undefined;
        if (data.p2Knockback === undefined)
          return output.mesg!({ dir: '', kick: kick, action: action });

        const cardinal = data.p2Knockback % 2 === 0;
        const dir = data.p2Stone
          ? (cardinal ? output.cardinals!() : output.intercards!())
          : (cardinal ? output.intercards!() : output.cardinals!());
        return output.mesg!({ dir: dir, kick: kick, action: action });
      },
      run: (data, _matches) => data.actors = {},
      outputStrings: {
        mesg: {
          en: '${dir} ${kick} => ${action}',
          ja: '${kick}${dir} => ${action}',
          ko: '${kick}${dir} 🔜 ${action}',
        },
        needle: {
          en: 'Drop Flower',
          ja: 'ゆか捨て',
          ko: '◈장판 버려욧',
        },
        stone: {
          en: 'Bait Cone',
          ja: '扇',
          ko: '▲부채꼴 유도',
        },
        cardinals: {
          en: 'Cardinals',
          ja: '十字',
          ko: '➕십자',
        },
        intercards: {
          en: 'Intercards',
          ja: '斜め',
          ko: '❌비스듬',
        },
        axe: Outputs.outside,
        scythe: Outputs.inside,
        unknown: Outputs.unknown,
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
      run: (data) => delete data.p2Stone,
      outputStrings: {
        text: {
          en: 'Go center',
          ja: '中央へ',
          ko: '한가운데로! 장판 피해욧!',
        },
      },
    },
    {
      id: 'FRU P2 Heavenly Strike',
      type: 'Ability',
      netRegex: { id: '9D07', capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.p2Knockback === undefined)
          return output.autumn!({ dir: output.unknown!() });
        const dir = data.p2Knockback;
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
      run: (data, _matches) => delete data.p2Knockback,
      outputStrings: {
        knockback: {
          en: 'Knockback ${dir1} / ${dir2}',
          ja: 'ノックバック ${dir1}${dir2}',
          ko: '넉백 ${dir1}${dir2}',
        },
        autumn: {
          en: 'Knockback ${dir}',
          ja: 'ノックバック ${dir}',
          ko: '넉백 ${dir}',
        },
        unknown: Outputs.unknown,
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      id: 'FRU P2 Twin Knockback Collect',
      type: 'StartsUsing',
      netRegex: { id: '9D10' },
      run: (data, matches) =>
        data.p2Knockback = AutumnDirections.posConv8(matches.x, matches.y, centerX, centerY),
    },
    {
      id: 'FRU P2 Sinbound Holy Rotation',
      type: 'Ability',
      netRegex: { id: '9D0F' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 5,
      infoText: (data, matches, output) => {
        const start = AutumnDirections.posConv8(matches.targetX, matches.targetY, centerX, centerY);
        const relPos = calcClockPos(start, data.p2Knockback!);
        if (data.triggerSetConfig.sinboundRotate === 'aacc')
          switch (relPos) {
            case 'same':
            case 'oppo':
              return output.aaccCursed!();
            case 'cw':
              return output.aaccRotateCCW!();
            case 'ccw':
              return output.aaccRotateCW!();
            default:
              break;
          }
        return output[relPos]!();
      },
      run: (data, _matches) => delete data.p2Knockback,
      outputStrings: {
        aaccCursed: {
          en: 'Cursed Add - Fast Clockwise',
          ko: '빠른 시계방향',
        },
        aaccRotateCCW: {
          en: 'Rotate Counterclockwise (away from add)',
          ko: '반시계방향 (린 멀리)',
        },
        aaccRotateCW: {
          en: 'Rotate Clockwise (away from add)',
          ko: '시계방향 (린 멀리)',
        },
        same: {
          en: 'Add is on knockback',
          ko: '넉백한 곳에 린',
        },
        oppo: {
          en: 'Add is opposite knockback',
          ko: '넉백 반대쪽에 린',
        },
        cw: {
          en: 'Add is clockwise',
          ko: '린이 시계방향',
        },
        ccw: {
          en: 'Add is counterclockwise',
          ko: '린이 반시계방향',
        },
      },
    },
    {
      id: 'FRU P2 Shining Armor',
      type: 'GainsEffect',
      netRegex: { effectId: '8E1', capture: false },
      condition: (data) => data.phase === 'p2',
      suppressSeconds: 1,
      countdownSeconds: 4.9,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'FRU P2 Twin Sillness/Silence',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle\'s Reflection', id: ['9D01', '9D02'] },
      durationSeconds: 2.8, // 캐스팅 시간은 3.2초
      countdownSeconds: 2.8,
      infoText: (_data, matches, output) => {
        if (matches.id === '9D01')
          return output.back!();
        return output.front!();
      },
      outputStrings: {
        front: {
          en: 'Front',
          ja: '前へ',
          ko: '앞으로',
        },
        back: {
          en: 'Back',
          ja: '後ろへ',
          ko: '뒤로',
        },
      },
    },
    {
      id: 'FRU P2 Twin Slip',
      type: 'StartsUsing',
      netRegex: { id: ['9D01', '9D02'], source: 'Oracle\'s Reflection' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.4,
      durationSeconds: 2,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Slip',
          ja: 'スリップ',
          ko: '미끄러져요!',
        },
      },
    },
    {
      id: 'FRU P2 Hallowed Ray',
      type: 'StartsUsing',
      netRegex: { id: '9D12', capture: false },
      response: Responses.bigAoe(),
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
      durationSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          puddle: {
            en: 'Puddle on YOU (${player})',
            ja: '自分にAOE (${player})',
            ko: '내게 장판! (${player})',
          },
          chain: {
            en: 'Tether on YOU (go ${mark})',
            ja: '自分に鎖 (${mark}へ)',
            ko: '${mark}마커로! 체인!',
          },
          spread: {
            en: 'Tether on YOU',
            ja: '自分に連鎖',
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
          return { infoText: output.puddle!({ player: output.unknown!() }) };
        return { infoText: output.puddle!({ player: partner.nick }) };
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
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tower: {
            en: 'Soak tower',
            ja: '塔踏み',
            ko: '타워 밟아요!',
          },
          avoid: {
            en: 'Avoid tower',
            ja: '塔を避ける',
            ko: '타워 피해요',
          },
        };
        if (data.p2Lights === 2) {
          data.p2Cursed = true;
          return { alertText: output.tower!() };
        }
        return { infoText: output.avoid!() };
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
          ja: '塔から出てて',
          ko: '타워에서 나와요!',
        },
      },
    },
    {
      id: 'FRU P2 the House of Light',
      type: 'StartsUsing',
      netRegex: { source: 'Usurper of Frost', id: '9CFD', capture: false },
      response: Responses.protean(),
    },
    {
      id: 'FRU P2 Absolute Zero',
      type: 'StartsUsing',
      netRegex: { id: '9D20', source: 'Usurper of Frost', capture: false },
      delaySeconds: 4,
      response: Responses.bigAoe(),
    },
    // //////////////// Intermission / Crystals //////////////////
    {
      id: 'FRU Intermission Target Veil',
      type: 'LosesEffect',
      // 307 - Invincibility
      netRegex: { effectId: '307', target: 'Ice Veil', capture: false },
      infoText: (_data, _matches, output) => output.targetVeil!(),
      outputStrings: {
        targetVeil: {
          en: 'Target Ice Veil',
          ko: '큰 얼음 패요!',
        },
      },
    },
    /*
    {
      id: 'FRU Intermission Junction',
      type: 'WasDefeated',
      netRegex: { target: 'Ice Veil', capture: false },
      delaySeconds: 5,
      response: Responses.bigAoe(),
    },
    */
    // //////////////// PHASE 3 //////////////////
    {
      id: 'FRU P3 Ultimate Relativity',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      delaySeconds: 4,
      durationSeconds: 5,
      response: Responses.bigAoe(),
    },
    {
      // 바깥에서 사용자 처리
      // https://x.com/PoneKoni/status/1862307791781900513
      // https://jp.finalfantasyxiv.com/lodestone/character/13307902/blog/5491265/
      id: 'FRU P3 Ultimate Relativity Autumn',
      type: 'GainsEffect',
      // 997 Spell-in-Waiting: Dark Fire III
      // 99E Spell-in-Waiting: Dark Blizzard III
      netRegex: { effectId: ['997', '99E'] },
      condition: (data, matches) => data.phase === 'p3ur' && data.me === matches.target,
      run: (data, matches) => {
        if (matches.effectId === '99E')
          data.p3Role = 'ice';
        else {
          const duration = parseFloat(matches.duration);
          if (duration > 30)
            data.p3Role = 'f31';
          else if (duration > 20)
            data.p3Role = 'f21';
          else
            data.p3Role = 'f11';
        }
      },
    },
    {
      id: 'FRU P3 Ultimate Relativity Hourglasses Collect',
      type: 'AddedCombatant',
      netRegex: { npcBaseId: '17832' },
      run: (data, matches) => data.p3Sigyes[matches.id] = matches,
    },
    {
      id: 'FRU P3 Ultimate Relativity North',
      type: 'Tether',
      netRegex: { id: '0086' },
      condition: (data) => data.phase === 'p3ur',
      alertText: (data, matches, output) => {
        const id = matches.sourceId;
        const hourglass = data.p3Sigyes[id];
        if (hourglass === undefined)
          return;
        const dir = AutumnDirections.posConv8(hourglass.x, hourglass.y, centerX, centerY);
        data.p3NoranJul.push(dir);
        if (data.p3NoranJul.length !== 3)
          return;

        const north = findNorthDirNum(data.p3NoranJul);
        data.p3Sigyes = {};
        data.p3NoranJul = [];

        if (north === -1)
          return output.text!({ mark: output.unknown!() });
        const trueNorth = (north + 4) % 8;
        return output.text!({ mark: output[AutumnDirections.outputFromMarker8Num(trueNorth)]!() });
      },
      outputStrings: {
        text: {
          en: 'North: ${mark}',
          ja: '北: ${mark}',
          ko: '북쪽: ${mark}',
        },
        unknown: Outputs.unknown,
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      id: 'FRU P3 Ultimate Relativity Look Out',
      type: 'GainsEffect',
      // 994 - Return
      netRegex: { effectId: '994' },
      condition: (data, matches) => data.phase === 'p3ur' && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      countdownSeconds: 4,
      response: Responses.lookAway('alarm'),
    },
    {
      id: 'FRU P3 Shell Crusher',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9D5E', capture: false },
      response: Responses.getTogether(),
    },
    {
      id: 'FRU P3 Black Halo',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9D62' },
      response: Responses.sharedOrInvinTankBuster(),
    },
    {
      id: 'FRU P3 Shockwave Pulsar',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D5A', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'FRU P3 Dark Water III',
      type: 'GainsEffect',
      netRegex: { effectId: '99D' },
      condition: (data, matches) => {
        if (data.phase !== 'p3ap')
          return false;
        const item = {
          target: data.party.member(matches.target),
          time: parseFloat(matches.duration),
        };
        data.p3DarkWater.push(item);
        if (data.me === matches.target)
          data.p3MyDark = item;
        return data.p3DarkWater.length === 6;
      },
      durationSeconds: 6,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          none: {
            en: 'None (${with})',
            ko: '무직 (${with})',
          },
          pot: {
            en: '(${with}, ${role})',
            ko: '(${with}, ${role})',
          },
          stand: {
            en: 'Stand (${with}, ${role})',
            ko: '그대로 (${with}, ${role})',
          },
          move: {
            en: 'Move (${with}, ${role})',
            ko: '반대 팀으로 (${with}, ${role})',
          },
          sec: {
            en: '${time}s',
            ko: '${time}초',
          },
          white: {
            en: 'None',
            ko: '무직',
          },
          unknown: Outputs.unknown,
        };
        if (data.options.OnlyAutumn) {
          // 어듬이 전용
          let role;
          let partner;
          if (data.p3MyDark === undefined) {
            role = output.white!();
            const names = data.p3DarkWater.map((d) => d.target.name);
            const f = data.party.partyNames.filter((d) => !names.includes(d) && d !== data.me);
            partner = f.length !== 0 && f[0] !== undefined ? data.party.member(f[0]) : undefined;
          } else {
            role = output.sec!({ time: data.p3MyDark.time });
            const my = data.p3MyDark;
            const s = data.p3DarkWater.filter((d) => d.time === my.time && d.target !== my.target);
            partner = s.length !== 0 && s[0] !== undefined ? s[0].target : undefined;
          }
          if (partner !== undefined) {
            if (data.role === 'tank') {
              if (partner.role === 'dps') {
                // data.p3ApocSwap = false;
                return { infoText: output.stand!({ role: role, with: partner.nick }) };
              }
              // data.p3ApocSwap = true;
              return { alertText: output.move!({ role: role, with: partner.nick }) };
            } else if (data.role === 'dps') {
              if (partner.job === 'PCT' || partner.job === 'BLM') {
                // data.p3ApocSwap = true;
                return { alertText: output.move!({ role: role, with: partner.nick }) };
              }
              // data.p3ApocSwap = false;
              return { infoText: output.stand!({ role: role, with: partner.nick }) };
            }
          }
        }
        let res;
        if (data.p3MyDark === undefined) {
          const names = data.p3DarkWater.map((d) => d.target.name);
          const f = data.party.partyNames.filter((d) => !names.includes(d) && d !== data.me);
          const p = f.length !== 0 && f[0] !== undefined ? data.party.member(f[0]) : undefined;
          res = output.none!({ with: p !== undefined ? p.nick : output.unknown!() });
        } else {
          const my = data.p3MyDark;
          const s = data.p3DarkWater.filter((d) => d.time === my.time && d.target !== my.target);
          const p = s.length !== 0 && s[0] !== undefined ? s[0].target : undefined;
          res = output.pot!({ time: my.time, with: p !== undefined ? p.nick : output.unknown!() });
        }
        return { infoText: res };
      },
    },
    {
      id: 'FRU P3 Apoc Side',
      type: 'GainsEffect',
      netRegex: { effectId: '99D', capture: false }, // Spell-in-Waiting: Dark Water III
      condition: (data) => data.phase === 'p3ap',
      suppressSeconds: 1,
      promise: async (data) => {
        const combatantData = await callOverlayHandler({
          call: 'getCombatants',
          names: [data.me],
        });
        const me = combatantData.combatants[0];
        if (!me)
          return;
        data.p3ApocInit = Directions.xyTo4DirNum(me.PosX, me.PosY, centerX, centerY);
      },
    },
    {
      id: 'FRU P3 Apoc Swap Check',
      type: 'Ability',
      netRegex: { id: '9D4F' },
      condition: (data, matches) => data.phase === 'p3ap' && data.me === matches.target,
      run: (data, matches) => {
        if (data.p3ApocSwap !== undefined)
          return;
        const x = parseFloat(matches.targetX);
        const y = parseFloat(matches.targetY);
        const stackSide = Directions.xyTo4DirNum(x, y, centerX, centerY);
        data.p3ApocSwap = data.p3ApocInit !== stackSide;
      },
    },
    {
      id: 'FRU P3 Apoc Collect',
      type: 'CombatantMemory',
      netRegex: { change: 'Add', pair: [{ key: 'BNpcID', value: '1EB0FF' }] },
      condition: (data) => data.phase === 'p3ap',
      run: (data, matches) => {
        const x = parseFloat(matches.pairPosX ?? '0');
        const y = parseFloat(matches.pairPosY ?? '0');
        const isCenterActor = Math.round(x) === 100 && Math.round(y) === 100;
        const hdg = parseFloat(matches.pairHeading ?? '0');

        if (data.p3ApocNo === undefined && isCenterActor)
          data.p3ApocNo = Directions.hdgTo8DirNum(hdg);
        else if (data.p3ApocRot === undefined && !isCenterActor) {
          const pos = Directions.xyTo8DirNum(x, y, centerX, centerY);
          const face = Directions.hdgTo8DirNum(hdg);
          const rel = calcClockPos(pos, face);
          data.p3ApocRot = rel === 'cw' ? 1 : (rel === 'ccw' ? -1 : undefined);
        }
      },
    },
    {
      // Silent early infoText with safe dirs
      id: 'FRU P3 Apoc Safe Early',
      type: 'CombatantMemory',
      netRegex: { change: 'Add', pair: [{ key: 'BNpcID', value: '1EB0FF' }], capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 0.9, // collect + short delay to avoid collision with Dark Water Debuff
      durationSeconds: 8.2,
      suppressSeconds: 1,
      soundVolume: 0,
      infoText: (data, _matches, output) => {
        const startNum = data.p3ApocNo;
        const rotationDir = data.p3ApocRot;
        if (startNum === undefined || rotationDir === undefined)
          return;

        // Safe spot(s) are 1 behind the starting dir and it's opposite (+4)
        const safe = [
          (startNum - rotationDir + 8) % 8,
          (startNum + 4 - rotationDir + 8) % 8,
        ];
        safe.sort((a, b) => a - b);

        const safeStr = safe
          .map((dir) => output[AutumnDirections.outputMarker8[dir] ?? 'unknown']!()).join('');
        return output.safe!({ dir1: safeStr });
      },
      tts: null,
      outputStrings: {
        safe: {
          en: '(Apoc safe later: ${dir1})',
          ko: '(아포 안전 ${dir1})',
        },
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      // Displays during Spirit Taker
      id: 'FRU P3 Apoc Safe',
      type: 'CombatantMemory',
      netRegex: { change: 'Add', pair: [{ key: 'BNpcID', value: '1EB0FF' }], capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 9.2,
      durationSeconds: 11,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const startNum = data.p3ApocNo;
        const rotationDir = data.p3ApocRot;
        if (startNum === undefined || rotationDir === undefined)
          return;

        // Safe spot(s) are 1 behind the starting dir and it's opposite (+4)
        // Melees lean one additional dir away from the rotation direction
        const safe = [
          (startNum - rotationDir + 8) % 8,
          (startNum + 4 - rotationDir + 8) % 8,
        ];

        const toward = [
          (safe[0]! - rotationDir + 8) % 8,
          (safe[1]! - rotationDir + 8) % 8,
        ];

        // We shouldn't just sort safe[], and toward[], since the elements are paired
        // and sorting might impact order of just one and not both.
        if (safe[0]! > safe[1]!) {
          safe.reverse();
          toward.reverse();
        }

        let safeStr = output['unknown']!();
        let towardStr = output['unknown']!();

        if (data.options.AutumnStyle) {
          const dpsDirs = [2, 3, 4, 5];
          const suppDirs = [6, 7, 0, 1];
          const myDirs = data.role === 'dps'
            ? (data.p3ApocSwap ? suppDirs : dpsDirs)
            : (data.p3ApocSwap ? dpsDirs : suppDirs);

          // use the index from safe, so we can make sure we're giving the correct 'toward'.
          const idx = safe.findIndex((idx) => myDirs.includes(idx));
          if (idx === -1)
            return output.safe!({ dir1: safeStr, dir2: towardStr });

          const safeDir = safe[idx];
          const towardDir = toward[idx];
          if (safeDir === undefined || towardDir === undefined)
            return output.safe!({ dir1: safeStr, dir2: towardStr });

          safeStr = output[AutumnDirections.outputMarker8[safeDir] ?? 'unknown']!();
          towardStr = output[AutumnDirections.outputMarker8[towardDir] ?? 'unknown']!();
          return output.safe!({ dir1: safeStr, dir2: towardStr });
        }

        safeStr = safe
          .map((dir) => output[AutumnDirections.outputMarker8[dir] ?? 'unknown']!()).join();
        towardStr = toward
          .map((dir) => output[AutumnDirections.outputMarker8[dir] ?? 'unknown']!()).join();
        return output.safe!({ dir1: safeStr, dir2: towardStr });
      },
      outputStrings: {
        safe: {
          en: 'Safe: ${dir1} (lean ${dir2})',
          ko: '${dir1} ▶ ${dir2}쪽',
        },
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      id: 'FRU P3 Apoc1',
      type: 'GainsEffect',
      netRegex: { effectId: '99D', capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 6,
      durationSeconds: 3.5,
      suppressSeconds: 1,
      response: Responses.stackMarker(),
    },
    {
      // Fire this just before the first Dark Water debuffs expire (10.0s).
      // A tiny bit early (0.2s) won't cause people to leave the stack, but the reaction
      // time on Spirit Taker is very short so the little extra helps.
      id: 'FRU P3 Apoc Spirit Taker',
      type: 'GainsEffect',
      netRegex: { effectId: '99D', capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 9.8, // first Dark Water Debuffs expire at 10.0s
      durationSeconds: 2,
      suppressSeconds: 1,
      response: Responses.spread('alert'),
    },
    {
      id: 'FRU P3 Apoc2',
      type: 'Ability',
      netRegex: { id: '9D52', source: 'Oracle of Darkness', capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 1,
      suppressSeconds: 1,
      response: Responses.stackMarker(),
    },
    {
      id: 'FRU P3 Apoc3 Darkest Dance',
      type: 'Ability',
      netRegex: { id: '9CF5', source: 'Oracle of Darkness', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback => Stacks',
          ja: 'ノックバック => あたまわり',
          ko: '넉백 🔜 뭉쳐요',
        },
      },
    },
    {
      id: 'FRU P3 Memory\'s End',
      type: 'StartsUsing',
      netRegex: { id: '9D6C', source: 'Oracle of Darkness', capture: false },
      delaySeconds: 4,
      response: Responses.bigAoe(),
    },
    // //////////////// PHASE 4 //////////////////
    {
      id: 'FRU P4 Akh Rhai',
      type: 'GainsEffect',
      netRegex: { effectId: '8E1', capture: false },
      condition: (data) => data.phase === 'p4',
      delaySeconds: 4.7,
      suppressSeconds: 1,
      response: Responses.moveAway('alert'),
    },
    {
      id: 'FRU P4 Darklit Dragonsong',
      type: 'StartsUsing',
      netRegex: { id: '9D6D', source: 'Oracle of Darkness', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'FRU P4 Refulgent Chain Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '8CD' },
      condition: (data) => data.phase === 'p4',
      run: (data, matches) => data.p4Tether.push(matches.target),
    },
    {
      id: 'FRU P4 Dark Water III',
      type: 'GainsEffect',
      netRegex: { effectId: '99D' },
      condition: (data, matches) => {
        if (data.phase !== 'p4')
          return false;
        data.p4DarkWater.push(matches.target);
        if (data.p4DarkWater.length === 2)
          return true;
        return false;
      },
      delaySeconds: 2.5,
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        const players = data.p4DarkWater.map((p) => data.party.member(p).nick).join(', ');
        return output.text!({ players: players });
      },
      outputStrings: {
        text: {
          en: '(stacks on ${players})',
          ko: '(나중에 뭉쳐요: ${players})',
        },
      },
    },
    {
      id: 'FRU P4 Path of Light',
      type: 'StartsUsing',
      netRegex: { id: '9CFB', source: 'Usurper of Frost', capture: false },
      delaySeconds: 3,
      alertText: (data, _matches, output) =>
        data.p4Tether.includes(data.me) ? output.tether!() : output.bait!(),
      outputStrings: {
        tether: {
          en: 'Soak Tower',
          ko: '타워 밟아요',
        },
        bait: {
          en: 'Bait Cleave',
          ko: '▲부채꼴 유도',
        },
      },
    },
    {
      id: 'FRU P4 Spirit Taker',
      type: 'StartsUsing',
      netRegex: { id: '9D60', source: 'Oracle of Darkness', capture: false },
      condition: (data) => data.phase === 'p4',
      delaySeconds: 0.5,
      durationSeconds: 2,
      response: Responses.spread('alert'),
    },
    {
      id: 'FRU P4 Hallowed Wings',
      type: 'StartsUsing',
      netRegex: { id: ['9D23', '9D24'], source: 'Usurper of Frost' },
      condition: (data) => data.phase === 'p4',
      delaySeconds: 1,
      infoText: (_data, matches, output) => {
        const dir = matches.id === '9D23' ? 'east' : 'west';
        return output.combo!({ dir: output[dir]!() });
      },
      outputStrings: {
        combo: {
          en: '${dir} => Stacks',
          ko: '${dir} 🔜 뭉쳐욧',
        },
        east: Outputs.east,
        west: Outputs.west,
      },
    },
    {
      id: 'FRU P4 Crystallize Time',
      type: 'StartsUsing',
      netRegex: { id: '9D6A', source: 'Oracle of Darkness', capture: false },
      response: Responses.bigAoe(),
    },
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
        'Axe Kick/Scythe Kick': 'Axe/Scythe Kick',
        'Shining Armor + Frost Armor': 'Shining + Frost Armor',
        'Sinbound Fire III/Sinbound Thunder III': 'Sinbound Fire/Thunder',
        'Dark Fire III/Unholy Darkness': '(spreads/stack)',
        'Dark Fire III/Dark Blizzard III/Unholy Darkness': '(spreads/donut/stack)',
        'Shadoweye/Dark Water III/Dark Eruption': '(gazes/stack/spreads)',
      },
    },
    {
      'missingTranslations': true,
      'locale': 'de',
      'replaceSync': {
        'Fatebreaker(?!\')': 'fusioniert(?:e|er|es|en) Ascian',
        'Fatebreaker\'s Image': 'Abbild des fusionierten Ascians',
        'Usurper of Frost': 'Shiva-Mitron',
        'Oracle\'s Reflection': 'Spiegelbild des Orakels',
        'Ice Veil': 'Immerfrost-Kristall',
        'Frozen Mirror': 'Eisspiegel',
        'Holy Light': 'heilig\\[a\\] Licht',
        'Crystal of Darkness': '[^:]+', // FIXME
        'Crystal of Light': 'Lichtkristall',
        'Oracle of Darkness': 'Orakel\\[p\\] der Dunkelheit',
        'Fragment of Fate': '[^:]+', // FIXME
        'Sorrow\'s Hourglass': 'Sanduhr\\[p\\] der Sorge',
        'Drachen Wanderer': 'Seele\\[p\\] des heiligen Drachen',
        'Pandora': '[^:]+', // FIXME
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
      'missingTranslations': true,
      'locale': 'fr',
      'replaceSync': {
        'Fatebreaker(?!\')': 'Sabreur de destins',
        'Fatebreaker\'s Image': 'double du Sabreur de destins',
        'Usurper of Frost': 'Shiva-Mitron',
        'Oracle\'s Reflection': 'reflet de la prêtresse',
        'Ice Veil': 'bloc de glaces éternelles',
        'Frozen Mirror': 'miroir de glace',
        'Holy Light': 'lumière sacrée',
        'Crystal of Darkness': '[^:]+', // FIXME
        'Crystal of Light': 'cristal de Lumière',
        'Oracle of Darkness': 'prêtresse des Ténèbres',
        'Fragment of Fate': '[^:]+', // FIXME
        'Sorrow\'s Hourglass': 'sablier de chagrin',
        'Drachen Wanderer': 'esprit du Dragon divin',
        'Pandora': '[^:]+', // FIXME
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
      'missingTranslations': true,
      'locale': 'ja',
      'replaceSync': {
        'Fatebreaker(?!\')': 'フェイトブレイカー',
        'Fatebreaker\'s Image': 'フェイトブレイカーの幻影',
        'Usurper of Frost': 'シヴァ・ミトロン',
        'Oracle\'s Reflection': '巫女の鏡像',
        'Ice Veil': '永久氷晶',
        'Frozen Mirror': '氷面鏡',
        'Holy Light': '聖なる光',
        'Crystal of Darkness': '闇水晶',
        'Crystal of Light': '光水晶',
        'Oracle of Darkness': '闇の巫女',
        'Fragment of Fate': '未来の欠片',
        'Sorrow\'s Hourglass': '悲しみの砂時計',
        'Drachen Wanderer': '聖竜気',
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
