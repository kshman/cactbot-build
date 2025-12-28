import Autumn, { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import Util, { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { PartyMemberParamObject } from '../../../../../types/party';
import { TriggerSet } from '../../../../../types/trigger';

const centerX = 100;
const centerY = 100;
type RedBlue = 'red' | 'blue';

// Phase
type Phase = 'p1' | 'p2' | 'p3ur' | 'p3ap' | 'p4dd' | 'p4ct' | 'p5' | 'unknown';
const phases: { [id: string]: Phase } = {
  '9CFF': 'p2', // Quadruple Slap (pre-Diamond Dust)
  '9D49': 'p3ur', // Hell's Judgment (pre-Ultimate Relativity)
  '9D4D': 'p3ap', // Spell-in-Waiting: Refrain (pre-Apocalypse)
  '9D36': 'p4dd', // Materialization (pre-Darklit Dragonsong)
  '9D6A': 'p4ct', // Crystallize Time
  '9D72': 'p5', // Fulgent Blade
};

// P1
type FallOfFaithTether = {
  color: RedBlue;
  dest: PartyMemberParamObject;
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
type DarkWaterTime = {
  time: number;
  dest: PartyMemberParamObject;
};

// P4
type Crystallize = {
  debuf: string | undefined;
  color: RedBlue | undefined;
  action:
    | 'water'
    | 'unholy'
    | 'eruption'
    | 'bice'
    | 'lrice'
    | 'rrice'
    | 'laero'
    | 'raero'
    | 'unknown';
  dest: PartyMemberParamObject;
};
const calcRolePriority = (lh2: boolean, data: Data, dest?: PartyMemberParamObject): boolean => {
  // 우선 순위가 높으면 참, 아니면 거짓
  if (data.moks === 'none' || dest === undefined)
    return true;
  if (lh2 === false) {
    // H1 H2 ST MT D1 D2 D3 D4
    if (data.moks === 'MT') {
      if (dest.role === 'tank' || dest.role === 'healer')
        return false;
    } else if (data.moks === 'ST') {
      if (dest.role === 'healer')
        return false;
    } else if (data.role === 'healer') {
      if (dest.role === 'healer')
        return data.moks === 'H1' ? true : false;
    } else {
      if (dest.role === 'tank' || dest.role === 'healer')
        return false;
      if (data.moks === 'D1' || data.moks === 'D2') {
        if (Util.isMeleeDpsJob(dest.job_!) && data.moks === 'D2')
          return false;
      } else if (data.moks === 'D3') {
        if (Util.isMeleeDpsJob(dest.job_!))
          return false;
      } else {
        // 캐스터는 무조건 false
        return false;
      }
    }
  } else {
    // H1 ST MT D1 D2 D3 D4 H2
    if (data.moks === 'MT') {
      if (dest.role === 'tank')
        return false;
      if (dest.job === 'WHM' || dest.job === 'AST')
        return false;
    } else if (data.moks === 'ST') {
      if (dest.job === 'WHM' || dest.job === 'AST')
        return false;
    } else if (data.role === 'healer') {
      if (data.moks === 'H2')
        return false;
    } else {
      if (dest.role === 'tank')
        return false;
      else if (dest.role === 'healer') {
        if (dest.job === 'SCH' || dest.job === 'SGE')
          return true;
        return false;
      } else if (data.moks === 'D1' || data.moks === 'D2') {
        if (Util.isMeleeDpsJob(dest.job_!) && data.moks === 'D2')
          return false;
      } else if (data.moks === 'D3') {
        if (Util.isMeleeDpsJob(dest.job_!))
          return false;
      } else {
        // 캐스터는 무조건 false
        return false;
      }
    }
  }
  return true;
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    autumnConcealed: boolean;
    darklit: 'healerPlantNW' | 'none';
    ctPriority: boolean;
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
  p3NoranJul: number[];
  p3DarkWater: DarkWaterTime[];
  p3MyDark?: DarkWaterTime;
  p3ApocSwap?: boolean;
  p3ApocNo?: number;
  p3ApocRot?: 1 | -1; // 1 = clockwise, -1 = counterclockwise
  //
  p4Fragment?: boolean; // 참이면 북쪽, 거짓은 남쪽
  p4AyTetherCount: number;
  p4AyTethers: { [player: string]: string[] };
  p4AyCleaves: string[];
  p4AyStacks: string[];
  p4AyTowerLoc?: 'north' | 'south';
  p4Crystallize: Crystallize[];
  p4MyCrystallize?: Crystallize;
  p4MyMarker?: string;
  p4Parun?: 'left' | 'right';
  p4Tidals: number[];
  //
  p5IsDark?: boolean;
  //
  actors: { [id: string]: NetMatches['ActorSetPos'] };
  hourglasses: { [id: string]: NetMatches['AddedCombatant'] };
  firstOfAll?: boolean;
  myId?: string;
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
      default: (options) => options.AutumnOnly,
    },
    {
      id: 'darklit',
      comment: {
        en:
          `Role Quadrants, Healer Plant NW: <a href="https://pastebin.com/ue7w9jJH" target="_blank">LesBin<a>`,
        ko: `역할별 산개, 힐러는 언제나 북서: <a href="https://pastebin.com/ue7w9jJH" target="_blank">LesBin<a>`,
      },
      name: {
        en: 'P4 Darklit Dragonsong',
        ko: 'P4 다크릿 드래곤송',
      },
      type: 'select',
      options: {
        en: {
          'Role Quads, Healer Plant NW': 'healerPlantNW',
          'Call Tower/Cone Only': 'none',
        },
        ko: {
          '역할별 산개, 힐러는 언제나 북서': 'healerPlantNW',
          '타워/부채꼴 알림': 'none',
        },
      },
      default: 'healerPlantNW',
    },
    {
      id: 'ctPriority',
      name: {
        en: 'P4 Crystallize Time, H2 as the last',
        ko: 'P4 크리스탈라이즈 타임 H2를 맨 뒤로',
      },
      comment: {
        en: 'P4 Crystallize Time, H2 as the last',
        ko: 'P4 크리스탈라이즈 타임 H2를 맨 뒤로',
      },
      type: 'checkbox',
      default: false,
    },
  ],
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    p1SafeMarkers: [...AutumnDir.outputNum],
    p1FallTethers: [],
    p2Icicle: [],
    p2Puddles: [],
    p3Ultimate: {},
    p3Umesg: [],
    p3Strat: [],
    p3NoranJul: [],
    p3DarkWater: [],
    p4AyTetherCount: 0,
    p4AyTethers: {},
    p4AyCleaves: [],
    p4AyStacks: [],
    p4Crystallize: [],
    p4Tidals: [],
    actors: {},
    hourglasses: {},
    //
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'FRU 시작!',
      type: 'InCombat',
      netRegex: { inGameCombat: '1', capture: false },
      condition: (data) => !data.firstOfAll,
      durationSeconds: 3.5,
      soundVolume: 0,
      infoText: (data, _matches, output) => {
        data.firstOfAll = true;
        return output.ok!({ moks: data.moks });
      },
      outputStrings: {
        ok: {
          en: 'Combat: ${moks}',
          ja: 'Combat: ${moks}',
          ko: '시작: ${moks}',
        },
      },
    },
    {
      id: 'FRU Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases) },
      run: (data, matches) => {
        data.phase = phases[matches.id] ?? 'unknown';
        data.actors = {};
        data.hourglasses = {};
      },
    },
    {
      // TODO: 플레이어 아이디 얻어오는 기능을 플러그인으로
      id: 'FRU Find Player ID',
      type: 'Ability',
      netRegex: { id: '9CEA', source: 'Fatebreaker' }, // Burnished Glory
      condition: (data, matches) => data.me === matches.target,
      run: (data, matches) => data.myId = matches.targetId,
    },
    // //////////////// PHASE 1 //////////////////
    {
      id: 'FRU P1 Actor Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}' },
      condition: (data) => data.phase === 'p1',
      run: (data, matches) => data.actors[matches.id] = matches,
    },
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
            ko: '(당첨, 그대로)',
          },
          safe: {
            en: '${action} ${dir1} / ${dir2}',
            ja: '${action} ${dir1}${dir2}',
            ko: '${action} ${dir1}${dir2}',
          },
          stack: Outputs.stacks,
          spread: Outputs.positions,
          ...AutumnDir.stringsAim,
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
        if (data.triggerSetConfig.autumnConcealed || data.moks === 'none') {
          const dir1 = AutumnDir.dirFromNum(data.p1SafeMarkers.shift()!);
          const dir2 = AutumnDir.dirFromNum(data.p1SafeMarkers.shift()!);
          return {
            infoText: output.safe!({
              action: output[data.p1Utopian!]!(),
              dir1: output[dir1]!(),
              dir2: output[dir2]!(),
            }),
          };
        }
        const pm = {
          'MT': 0,
          'ST': 1,
          'H1': 6,
          'H2': 4,
          'D1': 5,
          'D2': 3,
          'D3': 7,
          'D4': 2,
          'none': 0, // 없으면 걍 MT
        };
        if (data.p1SafeMarkers.includes(pm[data.moks]))
          return { infoText: output.stay!() };
        return { alertText: output.front!() };
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
        const dir1 = AutumnDir.dirFromNum(data.p1SafeMarkers.shift()!);
        const dir2 = AutumnDir.dirFromNum(data.p1SafeMarkers.shift()!);
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
        spread: Outputs.positions,
        ...AutumnDir.stringsAim,
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
        data.p1FallTethers.push({ dest: target, color: 'red' });
        return data.p1FallTethers.length === 2;
      },
      infoText: (data, _matches, output) => {
        const r1 = data.p1FallTethers[0]?.dest.role;
        const r2 = data.p1FallTethers[1]?.dest.role;
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
          ja: '(Tank-Tank)',
          ko: '(탱크 조정)',
        },
        hh: {
          en: '(Healer-Healer)',
          ja: '(Healer-Healer)',
          ko: '(힐러 조정)',
        },
        dps: {
          en: '(Dps)',
          ja: '(Dps)',
          ko: '(DPS 조정)',
        },
        th: {
          en: '(Tank-Healer)',
          ja: '(Tank-Healer)',
          ko: '(탱크/힐러 조정)',
        },
        none: {
          en: '(No adjust)',
          ja: '(No adjust)',
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
        data.p1FallTethers.push({ dest: target, color: color });
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
        if (data.options.AutumnOnly && count === 4 && data.p1FallSide === undefined) {
          // 어듬이는 탱크 아니면 렌지 아니면 캐스터
          data.p1FallSide = 'right';
          if (data.role === 'tank') {
            const hs = data.p1FallTethers.filter((d) => d.dest.role === 'healer').length;
            if (hs === 2)
              data.p1FallSide = 'left';
            else {
              const ts = data.p1FallTethers.filter((d) => d.dest.role === 'tank').length;
              if ((hs + ts) === 2)
                data.p1FallSide = 'left';
            }
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
    {
      id: 'FRU P1 Clean',
      type: 'StartsUsing',
      netRegex: { id: '9CC0', source: 'Fatebreaker', capture: false },
      run: (data) => {
        data.p1SafeMarkers = [];
        delete data.p1Utopian;
        delete data.p1Falled;
        delete data.p1FallSide;
        data.p1FallTethers = [];
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
        const dir = AutumnDir.posConv8(matches.x, matches.y, centerX, centerY);
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
        axe: {
          en: 'Outside',
          ja: '外側',
          ko: '바깥',
        },
        scythe: {
          en: 'Inside',
          ja: '内側',
          ko: '안',
        },
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
          return output.knockback!({ dir: output.unknown!() });
        const dir = data.p2Knockback;
        const dir1 = dir < 4 ? dir : dir - 4;
        const dir2 = dir < 4 ? dir + 4 : dir;

        const dirs = Autumn.inMainTeam(data.moks) ? [0, 1, 6, 7] : [2, 3, 4, 5];
        const res = AutumnDir.dirFromNum(dirs.includes(dir1) ? dir1 : dir2);
        return output.knockback!({ dir: output[res]!() });
      },
      run: (data, _matches) => delete data.p2Knockback,
      outputStrings: {
        knockback: {
          en: 'Knockback ${dir}',
          ja: 'ノックバック ${dir}',
          ko: '넉백 ${dir}',
        },
        unknown: Outputs.unknown,
        ...AutumnDir.stringsAim,
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
          cnum4: Outputs.aimNW,
          cmarkC: Outputs.aimS,
          unknown: Outputs.unknown,
        };
        if (!data.p2Puddles.some((p) => p.name === data.me)) {
          if (data.options.AutumnOnly) {
            // 어듬이 전용, 탱크만 햇음
            if (data.role === 'tank') {
              const cps: string[] = ['AST', 'WHM'];
              const marker = data.p2Puddles.some((p) => cps.includes(p.job!)) ? 'cnum4' : 'cmarkC';
              return { alertText: output.chain!({ mark: output[marker]!() }) };
            }
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
      run: (data) => {
        delete data.p2Kick;
        data.p2Icicle = [];
        delete data.p2Knockback;
        delete data.p2Stone;
        data.p2Puddles = [];
        delete data.p2Lights;
        delete data.p2Cursed;
      },
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
          ja: 'Target Ice Veil',
          ko: '큰 얼음 패요!',
        },
      },
    },
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
      condition: (data) => data.phase === 'p3ur',
      run: (data, matches) => data.hourglasses[matches.id] = matches,
    },
    {
      id: 'FRU P3 Ultimate Relativity North',
      type: 'Tether',
      netRegex: { id: '0086' },
      condition: (data) => data.phase === 'p3ur',
      alertText: (data, matches, output) => {
        const id = matches.sourceId;
        const hourglass = data.hourglasses[id];
        if (hourglass === undefined)
          return;
        const dir = AutumnDir.posConv8(hourglass.x, hourglass.y, centerX, centerY);
        data.p3NoranJul.push(dir);
        if (data.p3NoranJul.length !== 3)
          return;

        const north = findNorthDirNum(data.p3NoranJul);
        data.hourglasses = {};
        data.p3NoranJul = [];

        if (north === -1)
          return output.text!({ mark: output.unknown!() });
        const trueNorth = (north + 4) % 8;
        return output.text!({ mark: output[AutumnDir.dirFromNum(trueNorth)]!() });
      },
      outputStrings: {
        text: {
          en: 'North: ${mark}',
          ja: '北: ${mark}',
          ko: '북쪽: ${mark}',
        },
        unknown: Outputs.unknown,
        ...AutumnDir.stringsAim,
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
          dest: data.party.member(matches.target),
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
        if (data.options.AutumnOnly) {
          // 어듬이 전용
          let role;
          let partner;
          if (data.p3MyDark === undefined) {
            role = output.white!();
            const names = data.p3DarkWater.map((d) => d.dest.name);
            const f = data.party.partyNames.filter((d) => !names.includes(d) && d !== data.me);
            partner = f.length !== 0 && f[0] !== undefined ? data.party.member(f[0]) : undefined;
          } else {
            role = output.sec!({ time: data.p3MyDark.time });
            const my = data.p3MyDark;
            const s = data.p3DarkWater.filter((d) => d.time === my.time && d.dest !== my.dest);
            partner = s.length !== 0 && s[0] !== undefined ? s[0].dest : undefined;
          }
          if (partner !== undefined) {
            if (data.role === 'tank') {
              if (partner.role === 'dps' || partner.role === 'tank') { // 탱탱일 경우 상대방이 이동
                data.p3ApocSwap = false;
                return { infoText: output.stand!({ role: role, with: partner.nick }) };
              }
              data.p3ApocSwap = true;
              return { alertText: output.move!({ role: role, with: partner.nick }) };
            } else if (data.role === 'healer') {
              if (partner.role !== 'healer') {
                data.p3ApocSwap = false;
                return { infoText: output.stand!({ role: role, with: partner.nick }) };
              }
              if (data.moks !== 'H2') {
                data.p3ApocSwap = false;
                return { infoText: output.stand!({ role: role, with: partner.nick }) };
              }
              data.p3ApocSwap = true;
              return { alertText: output.move!({ role: role, with: partner.nick }) };
            } else if (data.role === 'dps') {
              if (partner.job === 'PCT' || partner.job === 'BLM') { // 다른 캐스터는 일단 패스
                data.p3ApocSwap = true;
                return { alertText: output.move!({ role: role, with: partner.nick }) };
              }
              data.p3ApocSwap = false;
              return { infoText: output.stand!({ role: role, with: partner.nick }) };
            }
          }
        }
        let res;
        if (data.p3MyDark === undefined) {
          const names = data.p3DarkWater.map((d) => d.dest.name);
          const f = data.party.partyNames.filter((d) => !names.includes(d) && d !== data.me);
          const p = f.length !== 0 && f[0] !== undefined ? data.party.member(f[0]) : undefined;
          res = output.none!({ with: p !== undefined ? p.nick : output.unknown!() });
        } else {
          const my = data.p3MyDark;
          const s = data.p3DarkWater.filter((d) => d.time === my.time && d.dest !== my.dest);
          const p = s.length !== 0 && s[0] !== undefined ? s[0].dest : undefined;
          res = output.pot!({ time: my.time, with: p !== undefined ? p.nick : output.unknown!() });
        }
        return { infoText: res };
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
      durationSeconds: 11.2,
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
        const rot = rotationDir === 1 ? 'ccw' : 'cw'; // 반대임!

        if (data.options.AutumnOnly) {
          const dps = [2, 3, 4, 5];
          const supp = [0, 1, 6, 7];
          const grp = data.role === 'dps'
            ? (data.p3ApocSwap ? supp : dps)
            : (data.p3ApocSwap ? dps : supp);
          const dir = grp.includes(safe[0]!) ? safe[0] : safe[1];
          const mrk = AutumnDir.dirFromNum(dir ?? -1);
          return output.safe!({ dir1: output[mrk]!(), rot: output[rot]!() });
        }

        const safeStr = safe
          .map((dir) => output[AutumnDir.dirFromNum(dir ?? -1)]!()).join('');
        return output.safe!({ dir1: safeStr, rot: output[rot]!() });
      },
      tts: null,
      outputStrings: {
        safe: {
          en: '(Apoc safe: ${dir1}, ${rot})',
          ja: '(Apoc safe: ${dir1}, ${rot})',
          ko: '(아포: ${dir1} ${rot})',
        },
        cw: {
          en: 'cw',
          ja: 'cw',
          ko: '🡸왼쪽', // '시계⤾',
        },
        ccw: {
          en: 'ccw',
          ja: 'ccw',
          ko: '오른쪽🡺', // '반시계⤿',
        },
        ...AutumnDir.stringsAim,
      },
    },
    {
      // Displays during Spirit Taker
      id: 'FRU P3 Apoc Safe',
      type: 'CombatantMemory',
      netRegex: { change: 'Add', pair: [{ key: 'BNpcID', value: '1EB0FF' }], capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 12.2,
      durationSeconds: 8,
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

        safeStr = output[AutumnDir.dirFromNum(safeDir)]!();
        towardStr = output[AutumnDir.dirFromNum(towardDir)]!();
        if (data.p3ApocRot !== 1)
          return output.safe!({ dir1: towardStr, dir2: safeStr });
        return output.safe!({ dir1: safeStr, dir2: towardStr });
      },
      outputStrings: {
        safe: {
          en: 'Safe: ${dir1} (lean ${dir2})',
          ja: 'Safe: ${dir1} (lean ${dir2})',
          ko: '${dir1} ▶ ${dir2}',
        },
        ...AutumnDir.stringsAim,
      },
    },
    {
      id: 'FRU P3 Apoc1 Stack',
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
      id: 'FRU P3 Apoc2 Spirit Taker',
      type: 'GainsEffect',
      netRegex: { effectId: '99D', capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 9.8, // first Dark Water Debuffs expire at 10.0s
      durationSeconds: 2,
      suppressSeconds: 1,
      response: Responses.spread('alert'),
    },
    {
      id: 'FRU P3 Apoc3 Dark Eruption',
      type: 'StartsUsing',
      netRegex: { id: '9D51', source: 'Oracle of Darkness', capture: false },
      condition: (data) => data.phase === 'p3ap',
      delaySeconds: 4.3, // 4.7초
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        const startNum = data.p3ApocNo;
        const rotationDir = data.p3ApocRot;
        if (startNum === undefined || rotationDir === undefined)
          return;
        const safe = ((startNum - rotationDir + 8) % 8) % 2 === 0 ? 'cardinals' : 'intercards';
        return output.mesg!({ safe: output[safe]!() });
      },
      outputStrings: {
        mesg: {
          en: '${safe} => Stacks',
          ja: '${safe} => Stacks',
          ko: '${safe}뭉쳐요',
        },
        cardinals: {
          en: 'Cardinals',
          ja: 'Cardinals',
          ko: '➕',
        },
        intercards: {
          en: 'Intercards',
          ja: 'Intercards',
          ko: '❌',
        },
      },
    },
    {
      id: 'FRU P3 Apoc4 Darkest Dance',
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
      run: (data) => {
        delete data.p3Role;
        data.p3Strat = [];
        data.p3NoranJul = [];
        data.p3DarkWater = [];
        delete data.p3MyDark;
        delete data.p3ApocSwap;
        delete data.p3ApocNo;
        delete data.p3ApocRot;
      },
    },
    // //////////////// PHASE 4 //////////////////
    {
      id: 'FRU P4 Fragment of Fate',
      type: 'AddedCombatant',
      netRegex: { npcBaseId: '17841' },
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        data.p4Fragment = parseFloat(matches.y) < centerY ? true : false;
        return output.text!({ dir: data.p4Fragment ? output.north!() : output.south!() });
      },
      outputStrings: {
        text: {
          en: '(Fragment of Fate: ${dir})',
          ja: '(Fragment of Fate: ${dir})',
          ko: '(구슬이: ${dir})',
        },
        north: Outputs.north,
        south: Outputs.south,
      },
    },
    {
      id: 'FRU P4 Akh Rhai',
      type: 'GainsEffect',
      netRegex: { effectId: '8E1', capture: false },
      condition: (data) => data.phase === 'p4dd',
      delaySeconds: 4.9,
      durationSeconds: 2.5,
      suppressSeconds: 1,
      response: Responses.moveAway('alert'),
    },
    {
      id: 'FRU P4 Ark Mon',
      type: 'StartsUsing',
      netRegex: { id: '9D6E', source: 'Oracle of Darkness', capture: false },
      infoText: (data, _matches, output) => {
        if (
          (data.phase === 'p4dd' && data.moks === 'ST') ||
          (data.phase === 'p4ct' && data.moks === 'MT')
        )
          return output.tank!();
        return output.party!();
      },
      outputStrings: {
        tank: {
          en: 'Out of center + Akh Mon',
          ja: 'Out of center + Akh Mon',
          ko: '혼자 바깥쪽 + 램파트',
        },
        party: {
          en: 'Get Under + Share',
          ja: 'Get Under + Share',
          ko: '보스 밑 + 뭉쳐요',
        },
      },
    },
    {
      id: 'FRU P4 Morn Afah',
      type: 'StartsUsing',
      netRegex: { id: '9D70', source: 'Oracle of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.getTogether(),
    },
    {
      id: 'FRU P4 Spirit Taker',
      type: 'StartsUsing',
      netRegex: { id: '9D60', source: 'Oracle of Darkness', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 2,
      response: Responses.spread('alert'),
    },
    {
      id: 'FRU P4 Darklit Dragonsong',
      type: 'StartsUsing',
      netRegex: { id: '9D6D', source: 'Oracle of Darkness', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'FRU P4 Darklit Stacks Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '99D' }, // Spell-in-Waiting: Dark Water III
      condition: (data) => data.phase === 'p4dd',
      run: (data, matches) => data.p4AyStacks.push(matches.target),
    },
    {
      id: 'FRU P4 Darklit Tether + Cleave Collect',
      type: 'Tether',
      netRegex: { id: '006E' }, // Refulgent Chain
      condition: (data) => data.phase === 'p4dd',
      run: (data, matches) => {
        data.p4AyTetherCount++;
        (data.p4AyTethers[matches.source] ??= []).push(matches.target);
        (data.p4AyTethers[matches.target] ??= []).push(matches.source);

        if (data.p4AyTetherCount === 4)
          data.p4AyCleaves = data.party.partyNames.filter(
            (name) => !(Object.keys(data.p4AyTethers).includes(name)),
          );
      },
    },
    // The logic for tether swaps, bait swaps, and possible stack swaps is fairly concise.
    // It's not comprehensive (specifically, we can't determine which DPS need to flex
    // and when for the cone baits), but otherwise it's accurate.  See inline comments.
    {
      id: 'FRU P4 Darklit Tower / Bait',
      type: 'Tether',
      netRegex: { id: '006E', capture: false }, // Refulgent Chain
      condition: (data) => data.phase === 'p4dd' && data.p4AyTetherCount === 4,
      durationSeconds: 9,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          towerNoSwap: {
            en: 'Tower (no swaps)',
            ko: '타워 밟아요',
          },
          towerOtherSwap: {
            en: 'Tower (${p1} + ${p2} swap)',
            ko: '타워 밟아요 (${p1}, ${p2})',
          },
          towerYouSwap: {
            en: 'Tower (swap w/${player})',
            ko: '자리 바꾸고 타워로! (${player})',
          },
          tower: { // if no strat set, or cannot determine
            en: 'Tower',
            ko: '타워 밟아요',
          },
          bait: { // for supports in healerPlantNW, or no strat
            en: 'Bait Cone',
            ko: '▲부채꼴 유도',
          },
          baitDPS: { // for DPS in healerPlantNW
            en: 'Bait Cone (w/ ${otherDps})',
            ko: '▲부채꼴 유도 (${otherDps})',
          },
        };

        const isHealerPlantNW = data.triggerSetConfig.darklit === 'healerPlantNW';

        const baitPlayers = data.p4AyCleaves;
        const towerPlayers = Object.keys(data.p4AyTethers);
        const myMech = baitPlayers.includes(data.me)
          ? 'bait'
          : (towerPlayers.includes(data.me) ? 'tower' : 'none');

        if (myMech === 'none')
          return;
        else if (baitPlayers.length !== 4 || towerPlayers.length !== 4)
          return { alertText: output[myMech]!() };
        else if (!isHealerPlantNW)
          return { alertText: output[myMech]!() };

        // Identify the tethered player with the stack marker.
        const towerStackPlayer = data.p4AyStacks.filter((p) => towerPlayers.includes(p))[0];

        const defaultOutput = { alertText: output[myMech]!() };

        // Map out roles and sanity check that we have 1 tank, 1 healer, and 2 dps in each group
        // (for the inevitable TankFRU, SoloHealerFRU, etc.)
        let towerTank = '';
        let towerHealer = '';
        const towerDps: string[] = [];
        for (const player of towerPlayers) {
          const role = (data.party.member(player)).role_;
          if (role === 'tank')
            towerTank = player;
          else if (role === 'healer')
            towerHealer = player;
          else if (role === 'dps')
            towerDps.push(player);
          else
            return defaultOutput;
        }
        if (towerTank === '' || towerHealer === '' || towerDps.length !== 2)
          return defaultOutput;

        let baitTank = '';
        let baitHealer = '';
        const baitDps: string[] = [];
        for (const player of baitPlayers) {
          const role = (data.party.member(player)).role_;
          if (role === 'tank')
            baitTank = player;
          else if (role === 'healer')
            baitHealer = player;
          else if (role === 'dps')
            baitDps.push(player);
          else
            return defaultOutput;
        }
        if (baitTank === '' || baitHealer === '' || baitDps.length !== 2)
          return defaultOutput;

        // Handle tower stuff first.
        // Figuring out the pattern (bowtie, box, hourglass) to determine who should swap would
        // (a) require knowing which DPS is which role (M1, M2, R1, R2), or (b) trying to infer
        // roles + swaps based on player positions when tethers go out. Both options are messy.
        // But we can make this simple, because tethers always connect 1 tank, 1 healer, and 2 DPS:
        //   - If a dps is tethered to both a tank & healer, it's bowtie - no swaps.
        //   - If not, the dps tethered to the tank swaps with the tank (true for hourglass + box).
        // Once we know this, we also now know whether the tower player with the stack marker
        // will be in the north or south group (for healerPlantNW).

        // Check if a dps has tank + healer tethers; if so, bowtie. Done.
        const towerDps1 = towerDps[0] ?? '';
        const towerDps1Tethers = data.p4AyTethers[towerDps1];
        if (towerDps1Tethers?.includes(towerTank) && towerDps1Tethers?.includes(towerHealer)) {
          if (isHealerPlantNW && [towerTank, towerHealer].includes(towerStackPlayer ?? ''))
            data.p4AyTowerLoc = 'north';
          else if (isHealerPlantNW)
            data.p4AyTowerLoc = 'south';

          if (myMech === 'tower')
            return { infoText: output.towerNoSwap!() };
        } else {
          // Not bowtie, so find the DPS that's tethered to the tank.
          const dpsWithTank = towerDps.find((dps) => data.p4AyTethers[dps]?.includes(towerTank));
          if (dpsWithTank === undefined)
            return defaultOutput;

          if (isHealerPlantNW && [towerHealer, dpsWithTank].includes(towerStackPlayer ?? ''))
            data.p4AyTowerLoc = 'north';
          else if (isHealerPlantNW)
            data.p4AyTowerLoc = 'south';

          if (myMech === 'tower') {
            if (dpsWithTank === data.me)
              return {
                alertText: output.towerYouSwap!({
                  player: data.party.member(towerTank),
                }),
              };
            else if (towerTank === data.me)
              return {
                alertText: output.towerYouSwap!({
                  player: data.party.member(dpsWithTank),
                }),
              };
            return {
              infoText: output.towerOtherSwap!({
                p1: data.party.member(dpsWithTank),
                p2: data.party.member(towerTank),
              }),
            };
          }
        }

        // Bait players last.
        // To properly figure out side-flexing (e.g. M1 and M2 are both baiting), again, we'd need
        // to know who was in what role or infer it from positions, and no clean solution.
        // So, instead, we can tell the tank and healer to bait, and we can tell the DPS
        // who the other DPS baiter is, and let them figure out if that requires a swap. /shrug
        if ([baitTank, baitHealer].includes(data.me))
          return { infoText: output.bait!() };
        else if (baitDps.includes(data.me)) {
          const otherDps = baitDps.find((dps) => dps !== data.me);
          if (otherDps === undefined)
            return defaultOutput;
          return {
            alertText: output.baitDPS!({
              otherDps: data.party.member(otherDps),
            }),
          };
        }

        return defaultOutput;
      },
    },
    {
      id: 'FRU P4 Darklit Cleave Stack',
      type: 'Tether',
      netRegex: { id: '006E', capture: false }, // Refulgent Chain
      condition: (data) => data.phase === 'p4dd' && data.p4AyTetherCount === 4,
      delaySeconds: 2, // a little breathing room to process the tower/bait call
      durationSeconds: 7,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          stackOnYou: { // default/fallthrough
            en: '(stack on you later)',
            ko: '(나랑 뭉쳐요)',
          },
          // stack is on you
          stackOnYouNoSwap: {
            en: '(stack on you later - no swap)',
            ko: '(그대로 나랑 뭉쳐요)',
          },
          stackOnYouSwap: {
            en: '(stacks: You swap)',
            ko: '(뭉치기 자리 조정)',
          },
          // stack on someone else (not your role), so you may be required to swap
          stackOnYouSwapWith: {
            en: '(stacks: swap w/ ${other})',
            ko: '(뭉치기 조정: ${other})',
          },
        };
        const isHealerPlantNW = data.triggerSetConfig.darklit === 'healerPlantNW';

        // Only bother with output if the player is baiting, and if we can tell which baiter has the stack
        const baitPlayers = data.p4AyCleaves;
        const baitStackPlayer = data.p4AyStacks.find((p) => baitPlayers.includes(p));
        if (baitStackPlayer === undefined || !baitPlayers.includes(data.me))
          return {};
        const stackName = data.party.member(baitStackPlayer);

        const isStackOnMe = data.me === baitStackPlayer;
        const defaultOutput = isStackOnMe ? { infoText: output.stackOnYou!() } : {};
        const myRole = data.role;
        const stackRole = (data.party.member(baitStackPlayer)).role_;
        if (stackRole === undefined)
          return defaultOutput;

        // Sanity check for non-standard party comp, or this trigger won't work
        const tankCount = baitPlayers.filter((p) => data.party.member(p)?.role === 'tank').length;
        const healerCount =
          baitPlayers.filter((p) => data.party.member(p)?.role === 'healer').length;
        const dpsCount = baitPlayers.filter((p) => data.party.member(p)?.role === 'dps').length;
        if (tankCount !== 1 || healerCount !== 1 || dpsCount !== 2)
          return defaultOutput;

        const baitStackLoc = stackRole === 'dps' ? 'south' : 'north';
        if (data.p4AyTowerLoc === undefined || !isHealerPlantNW)
          return defaultOutput;
        const towerStackLoc = data.p4AyTowerLoc;

        // if stacks are already split N/S, no swaps required
        // TODO: Could return an infoText indicating the baiter with the stack doesn't need to swap?
        if (baitStackLoc !== towerStackLoc)
          return isStackOnMe
            ? { infoText: output.stackOnYouNoSwap!() }
            : defaultOutput; // could return a infoText indicating no swaps are needed?

        // stacks are together, so we need to call for a swap
        if (isStackOnMe)
          return { alertText: output.stackOnYouSwap!() };

        // if the stack is on the other dps/support, player doesn't have to do anything
        // TODO: Could return an infoTexts indicating the bait with the stack needs to swap?
        if (
          (myRole === 'dps' && stackRole === 'dps') ||
          (myRole === 'healer' && stackRole === 'tank') ||
          (myRole === 'tank' && stackRole === 'healer')
        )
          return defaultOutput;

        // if the stack is on the other role, the player may have to swap
        // but we don't know which DPS is the melee (for tank swap) or ranged (for healer swap)
        // so we have to leave it up to the player to figure out
        if (myRole === 'healer' || myRole === 'tank')
          return { alertText: output.stackOnYouSwapWith!({ other: stackName }) };
        else if (myRole === 'dps' && stackRole === 'healer')
          return { alertText: output.stackOnYouSwapWith!({ other: stackName }) };
        else if (myRole === 'dps' && stackRole === 'tank')
          return { alertText: output.stackOnYouSwapWith!({ other: stackName }) };

        return defaultOutput;
      },
    },
    {
      id: 'FRU P4 Hallowed Wings',
      type: 'StartsUsing',
      netRegex: { id: ['9D23', '9D24'], source: 'Usurper of Frost' },
      condition: (data) => data.phase === 'p4dd',
      delaySeconds: 1,
      infoText: (_data, matches, output) => {
        // 구슬이 위치도 판단해야 하능가?
        const dir = matches.id === '9D23' ? 'east' : 'west';
        return output.combo!({ dir: output[dir]!() });
      },
      outputStrings: {
        combo: {
          en: '${dir} => Stacks',
          ja: '${dir} => Stacks',
          ko: '${dir} 🔜 뭉쳐욧',
        },
        east: Outputs.east,
        west: Outputs.west,
      },
    },
    {
      id: 'FRU P4 Somber Dance',
      type: 'Ability',
      // 9D23 할로우드 윙 (Usurper of Frost)
      // 9D5B 이게 원래 소머 댄스 (Oracle of Darkness)
      netRegex: { id: '9D23', capture: false },
      condition: (data) => data.phase === 'p4dd' && data.moks === 'MT',
      durationSeconds: 3,
      alertText: (_data, _matches, output) => output.tank!(),
      outputStrings: {
        tank: {
          en: 'Bait far + Tank buster',
          ja: 'Bait far + Tank buster',
          ko: '멀리 유도 + 무적!',
        },
      },
    },
    {
      id: 'FRU P4 Somber Dance Follow',
      type: 'Ability',
      netRegex: { id: '9D5B', capture: false },
      condition: (data) => data.phase === 'p4dd' && data.moks === 'MT',
      durationSeconds: 2,
      alertText: (_data, _matches, output) => output.tank!(),
      outputStrings: {
        tank: {
          en: 'Close to Oracle',
          ja: 'Close to Oracle',
          ko: '가이아 밑으로!',
        },
      },
    },
    {
      id: 'FRU P4 Crystallize Time',
      type: 'StartsUsing',
      netRegex: { id: '9D6A', source: 'Oracle of Darkness', capture: false },
      durationSeconds: 7,
      response: Responses.bigAoe(),
      run: (data) => data.hourglasses = {},
    },
    {
      id: 'FRU P4 Crystallize Time Hourglasses Collect',
      type: 'AddedCombatant',
      netRegex: { npcBaseId: '17837' },
      condition: (data) => data.phase === 'p4ct',
      run: (data, matches) => data.hourglasses[matches.id] = matches,
    },
    {
      id: 'FRU P4 Crystallize Time Debuff Collect',
      type: 'GainsEffect',
      netRegex: { effectId: ['CBF', 'CC0', '996', '99C', '99D', '99E', '99F'] },
      condition: (data) => data.phase === 'p4ct',
      run: (data, matches) => {
        let target = data.p4Crystallize.find((x) => x.dest.name === matches.target);
        if (target === undefined) {
          data.p4Crystallize.push({
            debuf: undefined,
            color: undefined,
            action: 'unknown',
            dest: data.party.member(matches.target),
          });
          target = data.p4Crystallize[data.p4Crystallize.length - 1];
          if (target === undefined)
            return;
        }
        switch (matches.effectId) {
          case 'CBF': // Wyrmclaw 빨강
            target.color = 'red';
            break;
          case 'CC0': // Wyrmfang 파랑
            target.color = 'blue';
            break;
          case '996': // Unholy Darkness
          case '99C': // Dark Eruption
          case '99D': // Dark Water III
          case '99E': // Dark Blizzard III
          case '99F': // Dark Aero III
            target.debuf = matches.effectId;
            break;
        }
      },
    },
    {
      id: 'FRU P4 CT1',
      type: 'Tether',
      netRegex: { id: '0085' },
      condition: (data) => data.phase === 'p4ct' && data.p4Parun === undefined,
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        const id = matches.sourceId;
        // 시계 먼저
        const hg = data.hourglasses[id];
        if (hg === undefined)
          return;
        const x = parseFloat(hg.x);
        const y = parseFloat(hg.y);
        if (data.p4Fragment && y < centerY)
          data.p4Parun = x < centerX ? 'left' : 'right';
        if (!data.p4Fragment && y > centerY)
          data.p4Parun = x > centerX ? 'left' : 'right';
        if (data.p4Parun === undefined)
          return;

        // 그담에 크리스탈라이즈
        const my = data.p4Crystallize.find((x) => x.dest.name === data.me);
        if (my === undefined || my.color === undefined || my.debuf === undefined)
          return;
        data.p4MyCrystallize = my;
        let arrow = '';
        if (my.debuf === '99C') {
          // 이럽션
          my.action = 'eruption';
          arrow = data.p4Parun === 'left' ? output.arrowNW!() : output.arrowNE!();
        } else if (my.debuf === '996') {
          // 언홀리
          my.action = 'unholy';
          arrow = data.p4Parun === 'left' ? output.arrowSE!() : output.arrowSW!();
        } else if (my.debuf === '99D') {
          // 워터
          my.action = 'water';
          arrow = data.p4Parun === 'left' ? output.arrowSE!() : output.arrowSW!();
        } else if (my.debuf === '99E') {
          // 블리자드
          if (my.color === 'blue') {
            my.action = 'bice';
            arrow = data.p4Parun === 'left' ? output.arrowSE!() : output.arrowSW!();
          } else {
            const o = data.p4Crystallize.find((x) =>
              x.debuf === '99E' && x.color === 'red' && x.dest.name !== data.me
            );
            my.action = calcRolePriority(data.triggerSetConfig.ctPriority, data, o?.dest)
              ? 'lrice'
              : 'rrice';
          }
        } else if (my.debuf === '99F') {
          // 에어로
          const o = data.p4Crystallize.find((x) => x.debuf === '99F' && x.dest.name !== data.me);
          my.action = calcRolePriority(data.triggerSetConfig.ctPriority, data, o?.dest)
            ? 'laero'
            : 'raero';
        }
        return output[my.action]!({ arrow: arrow });
      },
      outputStrings: {
        eruption: {
          en: '${arrow} Eruption',
          ja: '${arrow} Eruption',
          ko: '${arrow} 🫂이럽션',
        },
        unholy: {
          en: '${arrow} Unholy',
          ja: '${arrow} Unholy',
          ko: '${arrow} 🪜언홀리',
        },
        water: {
          en: '${arrow} Water',
          ja: '${arrow} Water',
          ko: '${arrow} 💧워터',
        },
        bice: {
          en: '${arrow} Blizzard',
          ja: '${arrow} Blizzard',
          ko: '${arrow} ❄️블리자드',
        },
        lrice: {
          en: 'Left Blizzard${arrow}',
          ja: 'Left Blizzard${arrow}',
          ko: '🡸 ❄️블리자드${arrow}',
        },
        rrice: {
          en: 'Right Blizzard${arrow}',
          ja: 'Right Blizzard${arrow}',
          ko: '🡺 ❄️블리자드${arrow}',
        },
        laero: {
          en: 'Left Aero${arrow}',
          ja: 'Left Aero${arrow}',
          ko: '🡿 🍃에어로${arrow}',
        },
        raero: {
          en: 'Right Aero${arrow}',
          ja: 'Right Aero${arrow}',
          ko: '🡾 🍃에어로${arrow}',
        },
        arrowNW: Outputs.arrowNW,
        arrowNE: Outputs.arrowNE,
        arrowSW: Outputs.arrowSW,
        arrowSE: Outputs.arrowSE,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'FRU P4 CT2',
      type: 'GainsEffect',
      // 워터
      netRegex: { effectId: '99D' },
      condition: (data) => data.phase === 'p4ct',
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      durationSeconds: 2,
      infoText: (data, _matches, output) => {
        if (data.p4MyCrystallize === undefined)
          return;
        return output[data.p4MyCrystallize.action]!();
      },
      outputStrings: {
        eruption: {
          en: '(Stay)',
          ja: '(Stay)',
          ko: '(그대로)',
        },
        unholy: {
          en: 'Stacks => Knockback',
          ja: 'Stacks => Knockback',
          ko: '에어로 뭉치고 🔜 넉백',
        },
        water: {
          en: 'Stacks => Knockback',
          ja: 'Stacks => Knockback',
          ko: '에어로 뭉치고 🔜 넉백',
        },
        bice: {
          en: 'Stacks => Knockback',
          ja: 'Stacks => Knockback',
          ko: '에어로 뭉치고 🔜 넉백',
        },
        lrice: {
          en: 'Dragon head',
          ja: 'Dragon head',
          ko: '용머리',
        },
        rrice: {
          en: 'Dragon head',
          ja: 'Dragon head',
          ko: '용머리',
        },
        laero: {
          en: 'Cross point',
          ja: 'Cross point',
          ko: '럭비공 모서리',
        },
        raero: {
          en: 'Cross point',
          ja: 'Cross point',
          ko: '럭비공 모서리',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'FRU P4 CT3',
      type: 'GainsEffect',
      // 블리자가
      netRegex: { effectId: '99E' },
      condition: (data) => data.phase === 'p4ct',
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      durationSeconds: 5,
      suppressSeconds: 0.5,
      infoText: (data, _matches, output) => {
        if (data.p4MyCrystallize === undefined)
          return;
        return output[data.p4MyCrystallize.action]!();
      },
      outputStrings: {
        eruption: {
          en: 'Stacks',
          ja: 'Stacks',
          ko: '뭉치고 🔜 피해요',
        },
        unholy: {
          en: 'Stacks',
          ja: 'Stacks',
          ko: '이럽션 뭉치고 🔜 피해요',
        },
        water: {
          en: 'Stacks',
          ja: 'Stacks',
          ko: '이럽션 뭉치고 🔜 피해요',
        },
        bice: {
          en: 'Stacks',
          ja: 'Stacks',
          ko: '이럽션 뭉치고 🔜 피해요',
        },
        lrice: {
          en: 'North',
          ja: 'North',
          ko: '북쪽으로 🔜 피해요',
        },
        rrice: {
          en: 'North',
          ja: 'North',
          ko: '북쪽으로 🔜 피해요',
        },
        laero: {
          en: 'Dragon head',
          ja: 'Dragon head',
          ko: '피하면서 + 용머리',
        },
        raero: {
          en: 'Dragon head',
          ja: 'Dragon head',
          ko: '피하면서 + 용머리',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'FRU P4 CT Blue SignMarker',
      type: 'NetworkTargetMarker',
      netRegex: { operation: 'Add' },
      condition: (data, matches) => data.phase === 'p4ct' && data.myId === matches.targetId,
      run: (data, matches) => {
        if (data.p4MyMarker !== undefined)
          return;
        const mkmap: { [id: string]: string } = {
          '0': 'mark1',
          '1': 'mark2',
          '2': 'mark3',
          '3': 'mark4',
        };
        data.p4MyMarker = mkmap[matches.waymark];
      },
    },
    {
      id: 'FRU P4 CT Blue Cleanse',
      type: 'Ability',
      netRegex: { id: '9D55', capture: false }, // Unholy Darkness
      condition: (data) => data.phase === 'p4ct',
      delaySeconds: 2,
      durationSeconds: 7,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.p4MyCrystallize === undefined)
          return;
        if (data.p4MyCrystallize.color !== 'blue')
          return;
        if (data.p4MyMarker !== undefined)
          return output.pick!({ num: output[data.p4MyMarker]!() });
        return output.cleanse!();
      },
      outputStrings: {
        cleanse: {
          en: 'Cleanse',
          ja: 'Cleanse',
          ko: '용머리 줏어요',
        },
        pick: {
          en: 'Cleanse ${num}',
          ja: 'Cleanse ${num}',
          ko: '용머리 줏어요 ${num}',
        },
        mark1: Outputs.aimNE,
        mark2: Outputs.aimSE,
        mark3: Outputs.aimSW,
        mark4: Outputs.aimNW,
      },
    },
    {
      id: 'FRU P4 CT Blue Direction',
      type: 'Ability',
      netRegex: { id: '9D55', capture: false }, // Unholy Darkness
      condition: (data) => data.options.AutumnOnly && data.phase === 'p4ct',
      delaySeconds: 2,
      durationSeconds: 7,
      suppressSeconds: 1,
      soundVolume: 0,
      infoText: (data, _matches, output) => {
        if (data.p4MyCrystallize === undefined)
          return;
        if (data.p4MyCrystallize.color !== 'blue')
          return;
        if (data.p4MyMarker !== undefined)
          return output[data.p4MyMarker]!();
      },
      outputStrings: {
        mark1: {
          en: 'left',
          ja: 'left',
          ko: '🡸🡸🡸🡸🡸🡸',
        },
        mark2: {
          en: 'left-top',
          ja: 'left-top',
          ko: '🡼🡼🡼🡼🡼🡼',
        },
        mark3: {
          en: 'right-top',
          ja: 'right-top',
          ko: '🡽🡽🡽🡽🡽🡽',
        },
        mark4: {
          en: 'right',
          ja: 'right',
          ko: '🡺🡺🡺🡺🡺🡺',
        },
      },
    },
    {
      id: 'FRU P4 Tidal Light Collect',
      type: 'StartsUsing',
      netRegex: { id: '9D3B' },
      condition: (data) => data.phase === 'p4ct',
      run: (data, matches) => {
        const dir = AutumnDir.posConv8(matches.x, matches.y, centerX, centerY);
        data.p4Tidals.push(dir);
      },
    },
    {
      id: 'FRU P4 CT Drop Rewind',
      type: 'GainsEffect',
      netRegex: { effectId: '1070' }, // Spell-in-Waiting: Return
      condition: (data, matches) => data.phase === 'p4ct' && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      countdownSeconds: 6,
      infoText: (data, _matches, output) => {
        const unknownStr = output.rewind!({ spot: output.unknown!() });
        if (data.p4Tidals.length !== 2)
          return unknownStr;

        // re-use findURNorthDirNum() to find the intercard between the two starting Tidal spots
        const intersectDirNum = findNorthDirNum(data.p4Tidals);
        if (intersectDirNum === -1)
          return unknownStr;

        if (data.options.AutumnOnly) {
          const north = [0, 1, 7];
          const mk = output[north.includes(intersectDirNum) ? 'dirN' : 'dirS']!();
          return output.arewind!({ spot: mk });
        }

        const dir = AutumnDir.dirFromNum(intersectDirNum);
        if (dir === undefined)
          return unknownStr;

        return output.rewind!({ spot: output[dir]!() });
      },
      outputStrings: {
        rewind: {
          en: 'Drop Rewind: ${spot}',
          ja: 'Drop Rewind: ${spot}',
          ko: '리턴 설치 ${spot}',
        },
        arewind: {
          en: 'Drop Rewind: near ${spot}',
          ja: 'Drop Rewind: near ${spot}',
          ko: '리턴 설치 ${spot}기준',
        },
        unknown: Outputs.unknown,
        ...AutumnDir.stringsAim,
      },
    },
    {
      id: 'FRU P4 CT Return',
      type: 'GainsEffect',
      netRegex: { effectId: '994' },
      condition: (data, matches) => data.phase === 'p4ct' && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      countdownSeconds: 3,
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tank!() : output.party!(),
      outputStrings: {
        tank: {
          en: 'Buf + Knockback',
          ja: 'Buf + Knockback',
          ko: '경감 + 암렝!',
        },
        party: {
          en: 'Knockback',
          ja: 'Knockback',
          ko: '암렝!',
        },
      },
    },
    {
      id: 'FRU P4 Clean',
      type: 'StartsUsing',
      netRegex: { id: '9D71', source: 'Oracle of Darkness', capture: false },
      run: (data) => {
        delete data.p4Fragment;
        data.p4AyTethers = {};
        data.p4AyCleaves = [];
        data.p4AyStacks = [];
        delete data.p4AyTowerLoc;
        data.p4Crystallize = [];
        delete data.p4MyCrystallize;
        delete data.p4MyMarker;
        delete data.p4Parun;
        data.p4Tidals = [];
      },
    },
    // //////////////// PHASE 5 //////////////////
    {
      id: 'FRU P5 Fulgent Blade',
      type: 'StartsUsing',
      netRegex: { id: '9D72', source: 'Pandora', capture: false },
      durationSeconds: 6,
      response: Responses.bigAoe(),
    },
    {
      id: 'FRU P5 Ark Morn',
      type: 'StartsUsing',
      netRegex: { id: '9D76', source: 'Pandora', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    },
    {
      id: 'FRU P5 Wings #1',
      type: 'StartsUsing',
      netRegex: { id: ['9D29', '9D79'] },
      // 9D29 DARK
      // 9D79 LIGHT
      durationSeconds: 5,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          dark: {
            en: 'Dark (right safe)',
            ko: '어두운 날개 (왼쪽 안전)',
          },
          light: {
            en: 'Light (left safe)',
            ko: '밝은 날개 (오른쪽 안전)',
          },
          mdark: {
            en: 'Outside',
            ko: '[다크] 밖으로!',
          },
          mlight: {
            en: 'Inside',
            ko: '[라이트] 안으로',
          },
          sdark: {
            en: 'Close to boss',
            ko: '[🡸다크] 보스 발 밑으로!',
          },
          slight: {
            en: 'Far from boss',
            ko: '[라이트🡺] 멀리 멀리!',
          },
          provoke: {
            en: 'Provoke!',
            ko: '프로보크!',
          },
        };
        data.p5IsDark = matches.id === '9D29';
        if (data.options.AutumnOnly && data.role === 'tank') {
          if (data.moks === 'MT')
            return { alertText: data.p5IsDark ? output.mdark!() : output.mlight!() };
          const msg = data.p5IsDark ? output.sdark!() : output.slight!();
          return { alertText: msg, infoText: output.provoke!() };
        }
        return { infoText: data.p5IsDark ? output.dark!() : output.light!() };
      },
    },
    {
      id: 'FRU P5 Wings #2',
      type: 'StartsUsing',
      netRegex: { id: ['9D29', '9D79'], capture: false },
      condition: (data) => data.options.AutumnOnly && data.role === 'tank',
      delaySeconds: 6.8,
      durationSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          mdark: {
            en: 'Far from boss',
            ko: '멀리 떨어져욧!',
          },
          mlight: {
            en: 'Close to boss',
            ko: '보스 발 밑으로!',
          },
          sdark: {
            en: 'Inside',
            ko: '안으로!',
          },
          slight: {
            en: 'Outside',
            ko: '밖으로!',
          },
          provoke: {
            en: 'Provoke!',
            ko: '프로보크!',
          },
        };
        if (data.moks !== 'MT')
          return { alertText: data.p5IsDark ? output.sdark!() : output.slight!() };
        const msg = data.p5IsDark ? output.mdark!() : output.mlight!();
        return { alertText: msg, infoText: output.provoke!() };
      },
      run: (data) => delete data.p5IsDark,
    },
    {
      id: 'FRU P5 Pandora\'s Box',
      type: 'StartsUsing',
      netRegex: { id: '9D86', source: 'Pandora', capture: false },
      delaySeconds: 7,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tank LB!',
          ja: 'Tank LB!',
          ko: '탱크 리미트브레이크!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Axe Kick/Scythe Kick': 'Axe/Scythe Kick',
        'Cruel Path of Darkness + Cruel Path of Light': 'Polarizing Paths',
        'Dark Blizzard III + Dark Eruption + Dark Aero III': '(donut + spread + KBs)',
        'Dark Fire III/Dark Blizzard III/Unholy Darkness': '(spreads/donut/stack)',
        'Dark Fire III/Unholy Darkness': '(spreads/stack)',
        'Dark Water III + Hallowed Wings': '(cleave + stacks)',
        'Shadoweye/Dark Water III/Dark Eruption': '(gazes/stack/spreads)',
        'Shining Armor + Frost Armor': 'Shining + Frost Armor',
        'Sinbound Fire III/Sinbound Thunder III': 'Sinbound Fire/Thunder',
        'The Path of Darkness + The Path of Light': '(exa-lines)',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Crystal of Darkness': 'Kristall der Dunkelheit',
        'Crystal of Light': 'Kristall des Lichts',
        'Delight\'s Hourglass': 'Sanduhr der Freude',
        'Drachen Wanderer': 'Seele des heiligen Drachen',
        'Fatebreaker\'s Image': 'Abbild des Banns der Hoffnung',
        'Fatebreaker(?!\')': 'Bann der Hoffnung',
        'Fragment of Fate': 'Splitter des Schicksals',
        'Frozen Mirror': 'Eisspiegel',
        'Holy Light': 'heilig(?:e|er|es|en) Licht',
        'Ice Veil': 'Immerfrost-Kristall',
        'Oracle of Darkness': 'Orakel der Dunkelheit',
        'Oracle\'s Reflection': 'Spiegelbild des Orakels',
        'Pandora': 'Pandora-Mitron',
        'Sorrow\'s Hourglass': 'Sanduhr der Sorge',
        'Usurper of Frost': 'Shiva-Mitron',
      },
      'replaceText': {
        ' drop\\)': ' abgelegt)',
        '--Oracle center--': '--Orakel mitte--',
        '--Oracle targetable--': '--Orakel anvisierbar--',
        '--Oracle untargetable--': '--Orakel nicht anvisierbar--',
        '--Usurper untargetable--': '--Usurper nicht anvisierbar--',
        '--jump south--': '--Sprung Süden--',
        '--reposition--': '--Repositionierung--',
        'Absolute Zero': 'Absoluter Nullpunkt',
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Apocalypse': 'Apokalypse',
        'Axe Kick': 'Axttritt',
        'Banish III': 'Verbannga',
        'Black Halo': 'Geschwärzter Schein',
        'Blastburn': 'Brandstoß',
        'Blasting Zone': 'Erda-Detonation',
        'Bright Hunger': 'Erosionslicht',
        'Burn Mark': 'Brandmal',
        'Burnished Glory': 'Leuchtende Aureole',
        'Burnout': 'Brandentladung',
        'Burnt Strike': 'Brandschlag',
        'Burst': 'Explosion',
        'Cruel Path of Darkness': 'Umbrales Prisma',
        'Cruel Path of Light': 'Lichtprisma',
        'Crystallize Time': 'Chronokristall',
        'Cyclonic Break': 'Zyklon-Brecher',
        'Dark Aero III': 'Dunkel-Windga',
        'Dark Blizzard III': 'Dunkel-Eisga',
        'Dark Eruption': 'Dunkle Eruption',
        'Dark Fire III': 'Dunkel-Feuga',
        'Dark Water III': 'Dunkel-Aquaga',
        'Darkest Dance': 'Finsterer Tanz',
        'Darklit Dragonsong': 'Drachenlied von Licht und Schatten',
        'Diamond Dust': 'Diamantenstaub',
        'Drachen Armor': 'Drachenrüstung',
        'Edge of Oblivion': 'Nahendes Vergessen',
        'Endless Ice Age': 'Lichtflut',
        'Explosion': 'Explosion',
        'Fall Of Faith': 'Sünden-Erdspaltung',
        'Floating Fetters': 'Schwebende Fesseln',
        'Frigid Needle': 'Eisnadel',
        'Frigid Stone': 'Eisstein',
        'Frost Armor': 'Frostrüstung',
        'Fulgent Blade': 'Staublichtschwert',
        'Hallowed Ray': 'Heiliger Strahl',
        'Hallowed Wings': 'Heilige Schwingen',
        'Heavenly Strike': 'Himmelszorn',
        'Hell\'s Judgment': 'Höllenurteil',
        'Hiemal Storm': 'Hiemaler Sturm',
        'Icicle Impact': 'Eiszapfen-Schlag',
        'Junction': 'Kopplung',
        'Light Rampant': 'Überflutendes Licht',
        'Longing of the Lost': 'Heiliger Drache',
        'Luminous Hammer': 'Gleißende Erosion',
        'Maelstrom': 'Mahlstrom',
        'Materialization': 'Konkretion',
        'Memory\'s End': 'Ende der Erinnerungen',
        'Mirror Image': 'Spiegelbild',
        'Mirror, Mirror': 'Spiegelland',
        'Morn Afah': 'Morn Afah',
        'Pandora\'s Box': 'Pandoras Saat',
        'Paradise Lost': 'Verlorenes Paradies',
        'Paradise Regained': 'Wiedergewonnenes Paradies',
        'Polarizing Paths': 'Sternschattenschwert',
        'Polarizing Strikes': 'Sternschattenschwert',
        'Powder Mark Trail': 'Stetes Pulvermal',
        'Powerful Light': 'Entladenes Licht',
        'Quadruple Slap': 'Vierfachschlag',
        'Quicken': 'Schnell',
        'Quietus': 'Quietus',
        'Reflected Scythe Kick': 'Spiegelung: Abwehrtritt',
        'Rewind': 'Zurückspringen',
        '(?<! )Scythe Kick': 'Abwehrtritt',
        'Shadoweye': 'Schattenauge',
        'Shell Crusher': 'Hüllenbrecher',
        'Shining Armor': 'Funkelnde Rüstung',
        'Shockwave Pulsar': 'Schockwellenpulsar',
        'Sinblaze': 'Sündenglut',
        'Sinbound Blizzard III': 'Sünden-Eisga',
        'Sinbound Fire III': 'Sünden-Feuga',
        'Sinbound Holy': 'Sünden-Sanctus',
        'Sinbound Meltdown': 'Sündenschmelze',
        'Sinbound Thunder III': 'Sünden-Blitzga',
        'Sinsmite': 'Sündenblitz',
        'Sinsmoke': 'Sündenflamme',
        '(?<! \\()Slow': 'Gemach',
        'Somber Dance': 'Düsterer Tanz',
        'Speed': 'Geschwindigkeit',
        'Spell-in-Waiting Refrain': 'Inkantatische Verzögerung',
        'Spirit Taker': 'Geistesdieb',
        'Stun(?!\\w)': 'Betäubung',
        'Swelling Frost': 'Frostwoge',
        'The House of Light': 'Tsunami des Lichts',
        'The Path of Darkness': 'Pfad der Dunkelheit',
        'The Path of Light': 'Pfad des Lichts',
        'Tidal Light': 'Welle des Lichts',
        'Turn Of The Heavens': 'Kreislauf der Wiedergeburt',
        'Twin Silence': 'Zwillingsschwerter der Ruhe',
        'Twin Stillness': 'Zwillingsschwerter der Stille',
        'Ultimate Relativity': 'Fatale Relativität',
        'Unholy Darkness': 'Unheiliges Dunkel',
        'Utopian Sky': 'Paradiestrennung',
        'Wings Dark and Light': 'Schwinge von Licht und Schatten',
        '\\(cast\\)': '(wirken)',
        '\\(close\\)': '(nah)',
        '\\(damage\\)': '(Schaden)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(far\\)': '(fern)',
        '\\(fast\\)': '(schnell)',
        '\\(fire\\)': '(Feuer)',
        '\\(follow-up\\)': '(folgend)',
        '\\(group tower\\)': '(Gruppen-Türme)',
        '\\(jump\\)': '(Sprung)',
        '\\(knockback\\)': '(Rückstoß)',
        '\\(lightning\\)': '(Blitz)',
        '\\(normal\\)': '(normal)',
        '\\(puddles\\)': '(Flächen)',
        '\\(slow\\)': '(langsam)',
        '\\(solo towers\\)': '(Solo-Turm)',
        '\\(targeted\\)': '(anvisiert)',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Crystal of Darkness': 'cristal de Ténèbres',
        'Crystal of Light': 'cristal de Lumière',
        'Delight\'s Hourglass': 'sablier de plaisir',
        'Drachen Wanderer': 'esprit du Dragon divin',
        'Fatebreaker\'s Image': 'double du Sabreur de destins',
        'Fatebreaker(?!\')': 'Sabreur de destins',
        'Fragment of Fate': 'fragment du futur',
        'Frozen Mirror': 'miroir de glace',
        'Holy Light': 'lumière sacrée',
        'Ice Veil': 'bloc de glaces éternelles',
        'Oracle of Darkness': 'prêtresse des Ténèbres',
        'Oracle\'s Reflection': 'reflet de la prêtresse',
        'Pandora': 'Pandora-Mitron',
        'Sorrow\'s Hourglass': 'sablier de chagrin',
        'Usurper of Frost': 'Shiva-Mitron',
      },
      'replaceText': {
        'Absolute Zero': 'Zéro absolu',
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Apocalypse': 'Apocalypse',
        'Axe Kick': 'Jambe pourfendeuse',
        'Banish III': 'Méga Bannissement',
        'Black Halo': 'Halo de noirceur',
        'Blastburn': 'Explosion brûlante',
        'Blasting Zone': 'Zone de destruction',
        'Bright Hunger': 'Lumière dévorante',
        'Burn Mark': 'Marque explosive',
        'Burnished Glory': 'Halo luminescent',
        'Burnout': 'Combustion totale',
        'Burnt Strike': 'Frappe brûlante',
        'Burst': 'Explosion',
        'Cruel Path of Darkness': 'Voie intense de Ténèbres',
        'Cruel Path of Light': 'Voie intense de Lumière',
        'Crystallize Time': 'Cristallisation temporelle',
        'Cyclonic Break': 'Brisement cyclonique',
        'Dark Aero III': 'Méga Vent ténébreux',
        'Dark Blizzard III': 'Méga Glace ténébreuse',
        'Dark Eruption': 'Éruption ténébreuse',
        'Dark Fire III': 'Méga Feu ténébreux',
        'Dark Water III': 'Méga Eau ténébreuse',
        'Darkest Dance': 'Danse de la nuit profonde',
        'Darklit Dragonsong': 'Chant de Lumière et de Ténèbres',
        'Diamond Dust': 'Poussière de diamant',
        'Drachen Armor': 'Armure des dragons',
        'Edge of Oblivion': 'Oubli proche',
        'Endless Ice Age': 'Déluge de Lumière',
        'Explosion': 'Explosion',
        'Fall Of Faith': 'Section illuminée',
        'Floating Fetters': 'Entraves flottantes',
        'Frigid Needle': 'Dards de glace',
        'Frigid Stone': 'Rocher de glace',
        'Frost Armor': 'Armure de givre',
        'Fulgent Blade': 'Épées rémanentes',
        'Hallowed Ray': 'Rayon Miracle',
        'Hallowed Wings': 'Aile sacrée',
        'Heavenly Strike': 'Frappe céleste',
        'Hell\'s Judgment': 'Jugement dernier',
        'Hiemal Storm': 'Tempête hiémale',
        'Icicle Impact': 'Impact de stalactite',
        'Junction': 'Jonction',
        'Light Rampant': 'Débordement de Lumière',
        'Longing of the Lost': 'Esprit du Dragon divin',
        'Luminous Hammer': 'Érosion lumineuse',
        'Maelstrom': 'Maelström',
        'Materialization': 'Concrétisation',
        'Memory\'s End': 'Mort des souvenirs',
        'Mirror Image': 'Double dans le miroir',
        'Mirror, Mirror': 'Monde des miroirs',
        'Morn Afah': 'Morn Afah',
        'Pandora\'s Box': 'Boîte de Pandore',
        'Paradise Lost': 'Paradis perdu',
        'Paradise Regained': 'Paradis retrouvé',
        'Polarizing Paths': 'Épée astro-ombrale',
        'Polarizing Strikes': 'Épée astro-ombrale',
        'Powder Mark Trail': 'Marquage fatal enchaîné',
        'Powerful Light': 'Explosion sacrée',
        'Quadruple Slap': 'Quadruple gifle',
        'Quicken': 'Accélération',
        'Quietus': 'Quietus',
        'Reflected Scythe Kick': 'Réverbération : Jambe faucheuse',
        '(?<! )Scythe Kick': 'Jambe faucheuse',
        'Shadoweye': 'Œil de l\'ombre',
        'Shell Crusher': 'Broyeur de carapace',
        'Shining Armor': 'Armure scintillante',
        'Shockwave Pulsar': 'Pulsar à onde de choc',
        'Sinblaze': 'Embrasement authentique',
        'Sinbound Blizzard III': 'Méga Glace authentique',
        'Sinbound Fire III': 'Méga Feu authentique',
        'Sinbound Holy': 'Miracle authentique',
        'Sinbound Meltdown': 'Fusion authentique',
        'Sinbound Thunder III': 'Méga Foudre authentique',
        'Sinsmite': 'Éclair du péché',
        'Sinsmoke': 'Flammes du péché',
        '(?<! \\()Slow': 'Lenteur',
        'Somber Dance': 'Danse du crépuscule',
        'Speed': 'Vitesse',
        'Spell-in-Waiting Refrain': 'Déphasage incantatoire',
        'Spirit Taker': 'Arracheur d\'esprit',
        'Stun(?!\\w)': 'Étourdissement',
        'Swelling Frost': 'Vague de glace',
        'The House of Light': 'Raz-de-lumière',
        'The Path of Darkness': 'Voie de Ténèbres',
        'The Path of Light': 'Voie de Lumière',
        'Tidal Light': 'Grand torrent de Lumière',
        'Turn Of The Heavens': 'Cercles rituels',
        'Twin Silence': 'Entaille de la tranquilité',
        'Twin Stillness': 'Entaille de la quiétude',
        'Ultimate Relativity': 'Compression temporelle fatale',
        'Unholy Darkness': 'Miracle ténébreux',
        'Utopian Sky': 'Ultime paradis',
        'Wings Dark and Light': 'Ailes de Lumière et de Ténèbres',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Crystal of Darkness': '闇水晶',
        'Crystal of Light': '光水晶',
        'Delight\'s Hourglass': '楽しみの砂時計',
        'Drachen Wanderer': '聖竜気',
        'Fatebreaker\'s Image': 'フェイトブレイカーの幻影',
        'Fatebreaker(?!\')': 'フェイトブレイカー',
        'Fragment of Fate': '未来の欠片',
        'Frozen Mirror': '氷面鏡',
        'Holy Light': '聖なる光',
        'Ice Veil': '永久氷晶',
        'Oracle of Darkness': '闇の巫女',
        'Oracle\'s Reflection': '巫女の鏡像',
        'Pandora': 'パンドラ・ミトロン',
        'Sorrow\'s Hourglass': '悲しみの砂時計',
        'Usurper of Frost': 'シヴァ・ミトロン',
      },
      'replaceText': {
        'Absolute Zero': '絶対零度',
        'Akh Morn': 'アク・モーン',
        'Akh Rhai': 'アク・ラーイ',
        'Apocalypse': 'アポカリプス',
        'Axe Kick': 'アクスキック',
        'Banish III': 'バニシュガ',
        'Black Halo': 'ブラックヘイロー',
        'Blastburn': 'バーンブラスト',
        'Blasting Zone': 'ブラスティングゾーン',
        'Bright Hunger': '浸食光',
        'Burn Mark': '爆印',
        'Burnished Glory': '光焔光背',
        'Burnout': 'バーンアウト',
        'Burnt Strike': 'バーンストライク',
        'Burst': '爆発',
        'Cruel Path of Darkness': '闇の重波動',
        'Cruel Path of Light': '光の重波動',
        'Crystallize Time': '時間結晶',
        'Cyclonic Break': 'サイクロニックブレイク',
        'Dark Aero III': 'ダークエアロガ',
        'Dark Blizzard III': 'ダークブリザガ',
        'Dark Eruption': 'ダークエラプション',
        'Dark Fire III': 'ダークファイガ',
        'Dark Water III': 'ダークウォタガ',
        'Darkest Dance': '暗夜の舞踏技',
        'Darklit Dragonsong': '光と闇の竜詩',
        'Diamond Dust': 'ダイアモンドダスト',
        'Drachen Armor': 'ドラゴンアーマー',
        'Edge of Oblivion': '忘却の此方',
        'Endless Ice Age': '光の氾濫',
        'Explosion': '爆発',
        'Fall Of Faith': 'シンソイルセヴァー',
        'Floating Fetters': '浮遊拘束',
        'Frigid Needle': 'アイスニードル',
        'Frigid Stone': 'アイスストーン',
        'Frost Armor': 'フロストアーマー',
        'Fulgent Blade': '光塵の剣',
        'Hallowed Ray': 'ホーリーレイ',
        'Hallowed Wings': 'ホーリーウィング',
        'Heavenly Strike': 'ヘヴンリーストライク',
        'Hell\'s Judgment': 'ヘル・ジャッジメント',
        'Hiemal Storm': 'ハイマルストーム',
        'Icicle Impact': 'アイシクルインパクト',
        'Junction': 'ジャンクション',
        'Light Rampant': '光の暴走',
        'Longing of the Lost': '聖竜気',
        'Luminous Hammer': 'ルミナスイロード',
        'Maelstrom': 'メイルシュトローム',
        'Materialization': '具象化',
        'Memory\'s End': 'エンド・オブ・メモリーズ',
        'Mirror Image': '鏡写し',
        'Mirror, Mirror': '鏡の国',
        'Morn Afah': 'モーン・アファー',
        'Pandora\'s Box': 'パンドラの櫃',
        'Paradise Lost': 'パラダイスロスト',
        'Paradise Regained': 'パラダイスリゲイン',
        'Polarizing Paths': '星霊の剣',
        'Polarizing Strikes': '星霊の剣',
        'Powder Mark Trail': '連鎖爆印刻',
        'Powerful Light': '光爆',
        'Quadruple Slap': 'クアドラスラップ',
        'Quicken': 'クイック',
        'Quietus': 'クワイタス',
        'Reflected Scythe Kick': 'ミラーリング・サイスキック',
        '(?<! )Scythe Kick': 'サイスキック',
        'Shadoweye': 'シャドウアイ',
        'Shell Crusher': 'シェルクラッシャー',
        'Shining Armor': 'ブライトアーマー',
        'Shockwave Pulsar': 'ショックウェーブ・パルサー',
        'Sinblaze': 'シンブレイズ',
        'Sinbound Blizzard III': 'シンブリザガ',
        'Sinbound Fire III': 'シンファイガ',
        'Sinbound Holy': 'シンホーリー',
        'Sinbound Meltdown': 'シンメルトン',
        'Sinbound Thunder III': 'シンサンダガ',
        'Sinsmite': 'シンボルト',
        'Sinsmoke': 'シンフレイム',
        '(?<! \\()Slow': 'スロウ',
        'Somber Dance': '宵闇の舞踏技',
        'Speed': 'スピード',
        'Spell-in-Waiting Refrain': 'ディレイスペル・リフレイン',
        'Spirit Taker': 'スピリットテイカー',
        'Stun(?!\\w)': 'スタン',
        'Swelling Frost': '凍波',
        'The House of Light': '光の津波',
        'The Path of Darkness': '闇の波動',
        'The Path of Light': '光の波動',
        'Tidal Light': '光の大波',
        'Turn Of The Heavens': '転輪召',
        'Twin Silence': '閑寂の双剣技',
        'Twin Stillness': '静寂の双剣技',
        'Ultimate Relativity': '時間圧縮・絶',
        'Unholy Darkness': 'ダークホーリー',
        'Utopian Sky': '楽園絶技',
        'Wings Dark and Light': '光と闇の片翼',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Crystal of Darkness': '暗水晶',
        'Crystal of Light': '光水晶',
        'Delight\'s Hourglass': '愉快的沙漏',
        'Drachen Wanderer': '圣龙气息',
        'Fatebreaker\'s Image': '绝命战士的幻影',
        'Fatebreaker(?!\')': '绝命战士',
        'Fragment of Fate': '未来的碎片',
        'Frozen Mirror': '冰面镜',
        'Holy Light': '圣光',
        'Ice Veil': '永久冰晶',
        'Oracle of Darkness': '暗之巫女',
        'Oracle\'s Reflection': '巫女的镜像',
        'Pandora': '潘多拉·米特隆',
        'Sorrow\'s Hourglass': '悲伤的沙漏',
        'Usurper of Frost': '希瓦·米特隆',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(close\\)': '(近)',
        '\\(damage\\)': '(伤害)',
        '\\(far\\)': '(远)',
        '\\(fast\\)': '(快)',
        '\\(fire\\)': '(火)',
        '\\(follow-up\\)': '(后续)',
        '\\(group tower\\)': '(小队塔)',
        '\\(jump\\)': '(跳)',
        '\\(knockback\\)': '(击退)',
        '\\(lightning\\)': '(雷)',
        '\\(normal\\)': '(正常)',
        '\\(puddles\\)': '(圈)',
        '\\(rewind drop\\)': '(放置回返)',
        '\\(slow\\)': '(慢)',
        '\\(solo towers\\)': '(单人塔)',
        '\\(stun \\+ cutscene\\)': '(眩晕 + 动画)',
        '\\(stun \\+ rewind\\)': '(眩晕 + 回返)',
        '\\(targeted\\)': '(定向)',
        '--jump south--': '--跳南--',
        '--Oracle center--': '--巫女中央--',
        '--Oracle targetable--': '--巫女可选中--',
        '--Oracle untargetable--': '--巫女不可选中--',
        '--reposition--': '--归位--',
        '--Usurper untargetable--': '--希瓦·米特隆不可选中--',
        'Absolute Zero': '绝对零度',
        'Akh Morn': '死亡轮回',
        'Akh Rhai': '天光轮回',
        'Apocalypse': '启示',
        'Axe Kick': '阔斧回旋踢',
        'Banish III Divided': '分裂强放逐',
        'Banish III(?! )': '强放逐',
        'Black Halo': '黑色光环',
        'Blastburn': '火燃爆',
        'Blasting Zone': '爆破领域',
        'Bound of Faith': '罪壤刺',
        'Bow Shock': '弓形冲波',
        'Bright Hunger': '侵蚀光',
        'Brightfire': '光炎',
        'Burn Mark': '爆印',
        'Burnished Glory': '光焰圆光',
        'Burnout': '雷燃爆',
        'Burnt Strike': '燃烧击',
        'Burst': '爆炸',
        'Cruel Path of Darkness': '暗之波涛',
        'Cruel Path of Light': '光之波涛',
        'Crystallize Time': '时间结晶',
        'Cyckonic Break': '暴风破',
        'Cyclonic Break': '暴风破',
        'Dark Aero III': '黑暗暴风',
        'Dark Blizzard III': '黑暗冰封',
        'Dark Eruption': '暗炎喷发',
        'Dark Fire III': '黑暗爆炎',
        'Dark Water III': '黑暗狂水',
        'Darkest Dance': '暗夜舞蹈',
        'Darklit Dragonsong': '光与暗的龙诗',
        'Depths of Oblivion': '忘却的彼岸',
        'Diamond Dust': '钻石星尘',
        'Drachen Armor': '圣龙护甲',
        'Edge of Oblivion': '忘却的此岸',
        'Endless Ice Age': '光之泛滥',
        'Explosion': '爆炸',
        'Fall Of Faith': '罪壤断',
        'Fated Burn Mark': '死爆印',
        'Floating Fetters': '浮游拘束',
        'Frigid Needle': '冰针',
        'Frigid Stone': '冰石',
        'Frost Armor': '冰霜护甲',
        'Fulgent Blade': '光尘之剑',
        'Hallowed Ray': '神圣射线',
        'Hallowed Wings': '神圣之翼',
        'Hell\'s Judgment': '地狱审判',
        'Heavenly Strike': '天降一击',
        'Hiemal Ray': '严冬射线',
        'Hiemal Storm': '严冬风暴',
        'Icecrusher': '碎冰击',
        'Icicle Impact': '冰柱冲击',
        'Inescapable Illumination': '曝露光',
        'Junction': '融合',
        'Joyless Dragonsong': '绝望龙诗',
        'Light Rampant': '光之失控',
        'Lightsteep': '过量光',
        'Longing of the Lost': '圣龙气息',
        'Luminous Hammer': '光流侵蚀',
        'Maelstrom': '巨漩涡',
        'Materialization': '赋形',
        'Memory Paradox': '记忆悖论',
        'Memory\'s End': '记忆终结',
        'Mirror Image': '镜中显影',
        'Mirror, Mirror': '镜中奇遇',
        'Morn Afah': '无尽顿悟',
        'Pandora\'s Box': '潘多拉魔盒',
        'Paradise Lost': '失乐园',
        'Paradise Regained': '复乐园',
        'Polarizing Paths': '星灵之剑',
        'Polarizing Strikes': '星灵之剑',
        'Powder Mark Trail': '连锁爆印铭刻',
        'Powerful Light': '光爆',
        'Quadruple Slap': '四剑斩',
        'Quicken': '神速',
        'Quietus': '寂灭',
        'Reflected Scythe Kick': '连锁反射：镰形回旋踢',
        '(?<!Reflected )Scythe Kick': '镰形回旋踢',
        'Refulgent Fate': '光之束缚',
        'Return IV': '强回返',
        'Return': '回返',
        'Shadoweye': '暗影之眼',
        'Shell Crusher': '破盾一击',
        'Shining Armor': '闪光护甲',
        'Shockwave Pulsar': '脉冲星震波',
        'Sinblaze': '罪冰焰',
        'Sinbound Blizzard III': '罪冰封',
        'Sinbound Fire III': '罪爆炎',
        'Sinbound Fire(?! )': '罪火炎',
        'Sinbound Holy': '罪神圣',
        'Sinbound Meltdown': '罪熔毁',
        'Sinbound Thunder III': '罪暴雷',
        'Sinsmite': '罪雷',
        'Sinsmoke': '罪炎',
        '(?<!\\()Slow(?<!\\))': '减速',
        'Solemn Charge': '急冲刺',
        'Somber Dance': '真夜舞蹈',
        'Speed': '限速',
        'Spell-in-Waiting Refrain': '延迟咏唱·递进',
        'Spirit Taker': '碎灵一击',
        'Swelling Frost': '寒波',
        'The House of Light': '光之海啸',
        'The Path of Darkness': '暗之波动',
        'The Path of Light': '光之波动',
        'Tidal Light': '光之巨浪',
        'Turn Of The Heavens': '光轮召唤',
        'Twin Poles': '光与暗的双剑技',
        'Twin Silence': '闲寂的双剑技',
        'Twin Stillness': '静寂的双剑技',
        'Ultimate Relativity': '时间压缩·绝',
        'Unholy Darkness': '黑暗神圣',
        'Unmitigated Explosion': '大爆炸',
        'Utopian Sky': '乐园绝技',
        'Wings Dark and Light': '光与暗的孤翼',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        // 'Crystal of Darkness': '', // FIXME '暗水晶'
        // 'Crystal of Light': '', // FIXME '光水晶'
        'Delight\'s Hourglass': '愉快的沙漏',
        'Drachen Wanderer': '聖龍氣息',
        'Fatebreaker\'s Image': '絕命戰士的幻影',
        'Fatebreaker(?!\')': '絕命戰士',
        // 'Fragment of Fate': '', // FIXME '未来的碎片'
        'Frozen Mirror': '冰面鏡',
        'Holy Light': '聖光',
        'Ice Veil': '永久冰晶',
        'Oracle of Darkness': '暗之巫女',
        // 'Oracle\'s Reflection': '', // FIXME '巫女的镜像'
        // 'Pandora': '', // FIXME '潘多拉·米特隆'
        'Sorrow\'s Hourglass': '悲傷的沙漏',
        // 'Usurper of Frost': '', // FIXME '希瓦·米特隆'
      },
      'replaceText': {
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        // '\\(close\\)': '', // FIXME '(近)'
        // '\\(damage\\)': '', // FIXME '(伤害)'
        // '\\(far\\)': '', // FIXME '(远)'
        // '\\(fast\\)': '', // FIXME '(快)'
        // '\\(fire\\)': '', // FIXME '(火)'
        // '\\(follow-up\\)': '', // FIXME '(后续)'
        // '\\(group tower\\)': '', // FIXME '(小队塔)'
        // '\\(jump\\)': '', // FIXME '(跳)'
        // '\\(knockback\\)': '', // FIXME '(击退)'
        // '\\(lightning\\)': '', // FIXME '(雷)'
        // '\\(normal\\)': '', // FIXME '(正常)'
        // '\\(puddles\\)': '', // FIXME '(圈)'
        // '\\(rewind drop\\)': '', // FIXME '(放置回返)'
        // '\\(slow\\)': '', // FIXME '(慢)'
        // '\\(solo towers\\)': '', // FIXME '(单人塔)'
        // '\\(stun \\+ cutscene\\)': '', // FIXME '(眩晕 + 动画)'
        // '\\(stun \\+ rewind\\)': '', // FIXME '(眩晕 + 回返)'
        // '\\(targeted\\)': '', // FIXME '(定向)'
        // '--jump south--': '', // FIXME '--跳南--'
        // '--Oracle center--': '', // FIXME '--巫女中央--'
        // '--Oracle targetable--': '', // FIXME '--巫女可选中--'
        // '--Oracle untargetable--': '', // FIXME '--巫女不可选中--'
        // '--reposition--': '', // FIXME '--归位--'
        // '--Usurper untargetable--': '', // FIXME '--希瓦·米特隆不可选中--'
        'Absolute Zero': '絕對零度',
        'Akh Morn': '死亡輪迴',
        'Akh Rhai': '天光輪迴',
        'Apocalypse': '啟示',
        'Axe Kick': '闊斧迴旋踢',
        'Banish III Divided': '分裂強放逐',
        'Banish III(?! )': '強放逐',
        'Black Halo': '黑色光環',
        'Blastburn': '火燃爆',
        'Blasting Zone': '爆破領域',
        'Bound of Faith': '罪壤刺',
        'Bow Shock': '弓形衝波',
        'Bright Hunger': '侵蝕光',
        'Brightfire': '光炎',
        'Burn Mark': '爆印',
        'Burnished Glory': '光焰圓光',
        'Burnout': '雷燃爆',
        'Burnt Strike': '燃燒擊',
        'Burst': '爆炸',
        // 'Cruel Path of Darkness': '', // FIXME '暗之波涛'
        // 'Cruel Path of Light': '', // FIXME '光之波涛'
        // 'Crystallize Time': '', // FIXME '时间结晶'
        // 'Cyckonic Break': '', // FIXME '暴风破'
        // 'Cyclonic Break': '', // FIXME '暴风破'
        'Dark Aero III': '黑暗大勁風',
        'Dark Blizzard III': '黑暗大暴雪',
        'Dark Eruption': '暗炎噴發',
        'Dark Fire III': '黑暗大火焰',
        'Dark Water III': '黑暗大水花',
        'Darkest Dance': '暗夜舞蹈',
        // 'Darklit Dragonsong': '', // FIXME '光与暗的龙诗'
        // 'Depths of Oblivion': '', // FIXME '忘却的彼岸'
        'Diamond Dust': '鑽石星塵',
        'Drachen Armor': '聖龍護甲',
        // 'Edge of Oblivion': '', // FIXME '忘却的此岸'
        'Endless Ice Age': '光之氾濫',
        'Explosion': '爆炸',
        // 'Fall Of Faith': '', // FIXME '罪壤断'
        // 'Fated Burn Mark': '', // FIXME '死爆印'
        'Floating Fetters': '浮游拘束',
        'Frigid Needle': '冰針',
        'Frigid Stone': '冰石',
        'Frost Armor': '冰霜護甲',
        // 'Fulgent Blade': '', // FIXME '光尘之剑'
        // 'Hallowed Ray': '', // FIXME '神圣射线'
        'Hallowed Wings': '神聖之翼',
        'Hell\'s Judgment': '地獄審判',
        'Heavenly Strike': '極樂冰柱',
        // 'Hiemal Ray': '', // FIXME '严冬射线'
        'Hiemal Storm': '嚴冬風暴',
        // 'Icecrusher': '', // FIXME '碎冰击'
        'Icicle Impact': '冰柱衝擊',
        'Inescapable Illumination': '曝露光',
        // 'Junction': '', // FIXME '融合'
        'Joyless Dragonsong': '絕望龍詩',
        'Light Rampant': '光之失控',
        'Lightsteep': '過量光',
        'Longing of the Lost': '聖龍氣息',
        // 'Luminous Hammer': '', // FIXME '光流侵蚀'
        'Maelstrom': '巨漩渦',
        // 'Materialization': '', // FIXME '赋形'
        // 'Memory Paradox': '', // FIXME '记忆悖论'
        'Memory\'s End': '記憶終結',
        // 'Mirror Image': '', // FIXME '镜中显影'
        'Mirror, Mirror': '鏡中奇遇',
        'Morn Afah': '無盡頓悟',
        // 'Pandora\'s Box': '', // FIXME '潘多拉魔盒'
        'Paradise Lost': '失樂園',
        'Paradise Regained': '複樂園',
        // 'Polarizing Paths': '', // FIXME '星灵之剑'
        // 'Polarizing Strikes': '', // FIXME '星灵之剑'
        // 'Powder Mark Trail': '', // FIXME '连锁爆印铭刻'
        'Powerful Light': '光爆',
        // 'Quadruple Slap': '', // FIXME '四剑斩'
        'Quicken': '神速',
        'Quietus': '寂滅',
        'Reflected Scythe Kick': '連鎖反射：鐮形迴旋踢',
        '(?<!Reflected )Scythe Kick': '鐮形迴旋踢',
        'Refulgent Fate': '光之束縛',
        'Return IV': '強回返',
        'Return': '回返',
        'Shadoweye': '暗影之眼',
        'Shell Crusher': '破盾一擊',
        'Shining Armor': '閃光護甲',
        'Shockwave Pulsar': '脈衝星震波',
        // 'Sinblaze': '', // FIXME '罪冰焰'
        // 'Sinbound Blizzard III': '', // FIXME '罪冰封'
        // 'Sinbound Fire III': '', // FIXME '罪爆炎'
        // 'Sinbound Fire(?! )': '', // FIXME '罪火炎'
        // 'Sinbound Holy': '', // FIXME '罪神圣'
        // 'Sinbound Meltdown': '', // FIXME '罪熔毁'
        // 'Sinbound Thunder III': '', // FIXME '罪暴雷'
        'Sinsmite': '罪雷',
        'Sinsmoke': '罪炎',
        // '(?<!\\()Slow(?<!\\))': '', // FIXME '减速'
        'Solemn Charge': '急衝刺',
        'Somber Dance': '真夜舞蹈',
        'Speed': '限速',
        // 'Spell-in-Waiting Refrain': '', // FIXME '延迟咏唱·递进'
        'Spirit Taker': '碎靈一擊',
        // 'Swelling Frost': '', // FIXME '寒波'
        'The House of Light': '光之海嘯',
        // 'The Path of Darkness': '', // FIXME '暗之波动'
        'The Path of Light': '光之波動',
        // 'Tidal Light': '', // FIXME '光之巨浪'
        'Turn Of The Heavens': '光輪召喚',
        // 'Twin Poles': '', // FIXME '光与暗的双剑技'
        'Twin Silence': '閒寂的雙劍技',
        'Twin Stillness': '寂靜的雙劍技',
        // 'Ultimate Relativity': '', // FIXME '时间压缩·绝'
        'Unholy Darkness': '黑暗神聖',
        'Unmitigated Explosion': '大爆炸',
        // 'Utopian Sky': '', // FIXME '乐园绝技'
        // 'Wings Dark and Light': '', // FIXME '光与暗的孤翼'
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Fatebreaker(?!\')': '페이트브레이커',
        'Fatebreaker\'s Image': '페이트브레이커의 환영',
        'Usurper of Frost': '시바 미트론',
        'Oracle\'s Reflection': '무녀의 거울상',
        'Ice Veil': '영구빙정',
        'Frozen Mirror': '얼음 거울',
        'Holy Light': '성스러운 빛',
        'Crystal of Darkness': '어둠의 수정',
        'Crystal of Light': '빛의 수정',
        'Oracle of Darkness': '어둠의 무녀',
        'Fragment of Fate': '미래의 조각',
        'Sorrow\'s Hourglass': '슬픔의 모래시계',
        'Drachen Wanderer': '성룡의 기운',
        'Pandora': '판도라 미트론',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(close\\)': '(가까이)',
        '\\(damage\\)': '(피해)',
        '\\(far\\)': '(멀리)',
        '\\(fast\\)': '(빠른)',
        '\\(fire\\)': '(불)',
        '\\(follow-up\\)': '(후속타)',
        '\\(group tower\\)': '(4인 탑)',
        '\\(jump\\)': '(점프)',
        '\\(knockback\\)': '(넉백)',
        '\\(lightning\\)': '(번개)',
        '\\(normal\\)': '(중간)',
        '\\(puddles\\)': '(장판)',
        '\\(rewind drop\\)': '(리턴 설치)',
        '\\(slow\\)': '(느린)',
        '\\(solo towers\\)': '(1인 탑)',
        '\\(stun \\+ cutscene\\)': '(기절 + 컷신)',
        '\\(stun \\+ rewind\\)': '(기절 + 리턴)',
        '\\(targeted\\)': '(대상지정)',
        '--jump south--': '--남쪽으로 점프--',
        '--Oracle center--': '--가이아 중앙--',
        '--Oracle targetable--': '--가이아 타겟가능--',
        '--Oracle untargetable--': '--가이아 타겟불가능--',
        '--reposition--': '--재배치--',
        '--Usurper untargetable--': '--시바 타겟불가능--',
        'Blastburn': '연소 폭발',
        'Blasting Zone': '발파 지대',
        'Burn Mark': '폭인',
        'Burnished Glory': '광염광배',
        'Burnout': '완전 연소',
        'Burnt Strike': '연소 공격',
        'Cyclonic Break': '풍속 파괴',
        'Explosion': '폭발',
        'Fall Of Faith': '죄의 소일 참격',
        'Floating Fetters': '부유 구속',
        'Powder Mark Trail': '연쇄 폭인각',
        'Sinblaze': '죄의 불꽃',
        'Sinbound Fire III': '죄의 파이가',
        'Sinbound Thunder III': '죄의 선더가',
        'Sinsmite': '죄의 번개',
        'Sinsmoke': '죄의 화염',
        'Turn Of The Heavens': '빛무리 소환',
        'Utopian Sky': '낙원절기',
        'the Path of Darkness': '어둠의 파동',
        'Cruel Path of Light': '빛의 겹파동',
        'Cruel Path of Darkness': '어둠의 겹파동',
        'Icecrusher': '쇄빙격',
        'Unmitigated Explosion': '대폭발',
        'Solemn Charge': '돌진격',
        'Bow Shock': '원형충격파',
        'Brightfire': '광염',
        'Bound of Faith': '죄의 소일 일격',
        'Edge of Oblivion': '망각의 이편',
        'Mirror, Mirror': '거울 나라',
        'Mirror Image': '거울 비추기',
        'Darkest Dance': '암야의 무도기',
        'Frost Armor': '서리 갑옷',
        'Shining Armor': '빛의 갑옷',
        'Drachen Armor': '용의 갑옷',
        'the Path of Light': '빛의 파동',
        'the House of Light': '빛의 해일',
        'Quadruple Slap': '사중 타격',
        'Twin Stillness': '정적의 쌍검기',
        'Twin Silence': '고요의 쌍검기',
        'Diamond Dust': '다이아몬드 더스트',
        'Icicle Impact': '고드름 낙하',
        'Frigid Stone': '얼음돌',
        'Frigid Needle': '얼음바늘',
        'Axe Kick': '도끼차기',
        '(?<!Reflected )Scythe Kick': '낫차기',
        'Reflected Scythe Kick': '반사된 낫차기',
        'Heavenly Strike': '천상의 일격',
        'Sinbound Holy': '죄의 홀리',
        'Hallowed Ray': '신성한 광선',
        'Light Rampant': '빛의 폭주',
        'Bright Hunger': '침식광',
        'Inescapable Illumination': '폭로광',
        'Refulgent Fate': '빛의 저주',
        'Lightsteep': '과잉광',
        'Powerful Light': '빛의 폭발',
        'Luminous Hammer': '빛의 마멸',
        'Burst': '폭발',
        'Banish III(?! )': '배니시가',
        'Banish III Divided': '분열된 배니시가',
        'Absolute Zero': '절대영도',
        'Swelling Frost': '서리 파동',
        'Junction': '접속',
        'Hallowed Wings': '신성한 날개',
        'Wings Dark and Light': '빛과 어둠의 날개',
        'Polarizing Paths': '극성의 검',
        'Sinbound Meltdown': '죄의 멜튼',
        'Sinbound Fire(?! )': '죄의 파이어',
        'Akh Rhai': '아크 라이',
        'Darklit Dragonsong': '빛과 어둠의 용시',
        'Crystallize Time': '시간의 결정체',
        'Longing of the Lost': '성룡의 기운',
        'Joyless Dragonsong': '절망의 용시',
        'Materialization': '형상화',
        'Akh Morn': '아크 몬',
        'Morn Afah': '몬 아파',
        'Tidal Light': '빛의 너울',
        'Hiemal Storm': '동장군 폭풍',
        'Hiemal Ray': '동장군 광선',
        'Sinbound Blizzard III': '죄의 블리자가',
        'Endless Ice Age': '빛의 범람',
        'Depths of Oblivion': '망각의 저편',
        'Memory Paradox': '기억의 역설',
        'Paradise Lost': '실낙원',
        'Hell\'s Judgment': '황천의 심판',
        'Ultimate Relativity': '시간 압축: 절',
        'Return': '리턴',
        'Return IV': '리턴쟈',
        'Spell-in-Waiting Refrain': '단계적 지연술',
        'Dark Water III': '다크 워터가',
        'Dark Eruption': '어둠의 불기둥',
        'Dark Fire III': '다크 파이가',
        'Unholy Darkness': '다크 홀리',
        'Shadoweye': '그림자 시선',
        'Dark Blizzard III': '다크 블리자가',
        'Dark Aero III': '다크 에어로가',
        'Quietus': '종지부',
        'Shockwave Pulsar': '맥동 충격파',
        'Somber Dance': '어스름 무도기',
        'Shell Crusher': '외피 파쇄',
        'Spirit Taker': '영혼 탈취',
        'Black Halo': '검은 빛무리',
        'Speed': '속도 조절',
        'Quicken': '가속',
        '(?<!\\()Slow(?<!\\))': '감속',
        'Apocalypse': '대재앙',
        'Maelstrom': '대격동',
        'Memory\'s End': '기억의 끝',
        'Fulgent Blade': '빛먼지 검',
        'Polarizing Strikes': '극성의 검',
        'Paradise Regained': '복낙원',
        'Twin Poles': '빛과 어둠의 쌍검기',
        'Pandora\'s Box': '판도라의 상자',
        'Fated Burn Mark': '사폭인',
      },
    },
  ],
};

export default triggerSet;

// FRU / FUTURES REWRITTEN (Ultimate) / 絶エデン / 絶もうひとつの未来
