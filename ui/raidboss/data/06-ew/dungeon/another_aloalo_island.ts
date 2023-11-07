import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { PartyMemberParamObject } from '../../../../../types/party';
import { Output, TriggerSet } from '../../../../../types/trigger';

type ClockRotate = 'cw' | 'ccw' | 'unknown';
type MarchDirection = 'front' | 'back' | 'left' | 'right' | 'unknown';

const ForceMoveStrings = {
  stack: Outputs.getTogether,
  spread: Outputs.spread,
  forward: {
    en: '강제이동: 앞 🡺 ${aim}',
    ja: '強制移動 : 前 => ${aim}',
  },
  backward: {
    en: '강제이동: 뒤 🡺 ${aim}',
    ja: '強制移動 : 後ろ => ${aim}',
  },
  left: {
    en: '강제이동: 왼쪽 🡺 ${aim}',
    ja: '強制移動 : 左 => ${aim}',
  },
  right: {
    en: '강제이동: 오른쪽 🡺 ${aim}',
    ja: '強制移動 : 右 => ${aim}',
  },
  move: {
    en: '강제이동 🡺 ${aim}',
    ja: '強制移動 => ${aim}',
  },
  safety: {
    en: '안전한 곳',
    ja: '安置へ',
  },
} as const;

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    stackOrder: 'meleeRolesPartners' | 'rolesPartners';
    lalaPlanarTacticsType: 'poshiume' | 'hamukatsu';
  };
  combatantData: PluginCombatantState[];
  ketuCrystalAdd: NetMatches['AddedCombatant'][];
  ketuSpringCrystalCount: number;
  ketuHydroCount: number;
  ketuHydroStack?: NetMatches['GainsEffect'];
  ketuHydroSpread?: NetMatches['GainsEffect'];
  ketuMyBubbleFetters?: string;
  lalaBlight: MarchDirection;
  lalaRotate: ClockRotate;
  lalaTimes: number;
  lalaSubtractive: number;
  lalaMyMarch: MarchDirection;
  lalaMyRotate: ClockRotate;
  lalaMyTimes: number;
  stcReloadCount: number;
  stcReloadFailed: number;
  stcRingRing: number;
  stcBullsEyes: PartyMemberParamObject[];
  stcClaws: string[];
  stcMissiles: string[];
  stcSeenPinwheeling: boolean;
  stcAdjustBullsEye: boolean;
  stcTether: boolean;
  stcChains: string[];
  stcBallFire?: number;
  stcPop: number;
  stcMyMarch: MarchDirection;
  stcMyDuration: number;
  gainList: NetMatches['GainsEffect'][];
  isStackFirst: boolean;
}

// Horizontal crystals have a heading of 0, vertical crystals are -pi/2.
const isHorizontalCrystal = (line: NetMatches['AddedCombatant']) => {
  const epsilon = 0.1;
  return Math.abs(parseFloat(line.heading)) < epsilon;
};

// test stack first
const isStackFirst = (
  stack?: NetMatches['GainsEffect'],
  spread?: NetMatches['GainsEffect'],
): boolean => {
  if (stack === undefined)
    return false;
  const stackTime = parseFloat(stack.duration);
  if (spread === undefined)
    return true;
  const spreadTime = parseFloat(spread.duration);
  return stackTime < spreadTime;
};

// test reverse rotation
const isReverseRotate = (rot: ClockRotate, count: number): boolean => {
  if (rot === 'cw' && count === 3)
    return true;
  if (rot === 'ccw' && (count === 0 || count === 5))
    return true;
  return false;
};

//
const forceMove = (
  output: Output,
  march: MarchDirection,
  stackFirst?: boolean,
  safezone?: string,
): string => {
  if (march !== undefined) {
    const move = {
      'front': output.forward,
      'back': output.backward,
      'left': output.left,
      'right': output.right,
      'unknown': output.move,
    }[march];
    if (safezone !== undefined)
      return move!({ aim: safezone });
    return move!({ aim: stackFirst ? output.stack!() : output.spread!() });
  }
  if (safezone !== undefined)
    return safezone;
  if (stackFirst)
    return output.stack!();
  return output.spread!();
};

// 스타티스 나눔
const stcBallOfFire = (combatant: NetMatches['AddedCombatant']): number => {
  const hg = parseFloat(combatant.heading);
  return (Math.round(6 - 6 * (2 * Math.PI - hg) / Math.PI) % 12 + 12) % 12;
};

// 주사위를 마커로
const diceToMarker = (no: number): string => {
  const diceMap: { [dice: number]: string } = {
    1: 'Ⓐ',
    2: '①',
    3: '②',
    4: 'Ⓒ',
    5: '③',
    6: '④',
  } as const;
  const ret = diceMap[no];
  return ret === undefined ? '몰?루' : ret;
};

const triggerSet: TriggerSet<Data> = {
  id: 'AnotherAloaloIsland',
  zoneId: ZoneId.AnotherAloaloIsland,
  config: [
    {
      id: 'lalaPlanarTacticsType',
      name: {
        en: 'Planar Tactics 형식',
      },
      type: 'select',
      options: {
        en: {
          '포시우메: 3번 좌우 사용': 'poshiume',
          '하므까스: 3번 한쪽만 사용': 'hamukatsu',
        },
      },
      default: 'poshiume',
    },
  ],
  timelineFile: 'another_aloalo_island.txt',
  initData: () => {
    return {
      combatantData: [],
      ketuCrystalAdd: [],
      ketuSpringCrystalCount: 0,
      ketuHydroCount: 0,
      lalaBlight: 'unknown',
      lalaRotate: 'unknown',
      lalaTimes: 0,
      lalaSubtractive: 0,
      lalaMyMarch: 'unknown',
      lalaMyRotate: 'unknown',
      lalaMyTimes: 0,
      stcReloadCount: 0,
      stcReloadFailed: 0,
      stcRingRing: 0,
      stcBullsEyes: [],
      stcClaws: [],
      stcMissiles: [],
      stcSeenPinwheeling: false,
      stcAdjustBullsEye: false,
      stcTether: false,
      stcChains: [],
      stcPop: 0,
      stcMyMarch: 'unknown',
      stcMyDuration: 0,
      gainList: [],
      isStackFirst: false,
    };
  },
  triggers: [
    // ---------------- first trash ----------------
    {
      id: 'AAI Kiwakin Lead Hook',
      type: 'StartsUsing',
      netRegex: { id: '8C6E', source: 'Aloalo Kiwakin' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankBusterOnYou: {
            en: '내게 3연속 탱크버스터',
            ja: '自分に3xタン強',
          },
          tankBusterOnPlayer: {
            en: '3연속 탱크버스터: ${player}',
            ja: '3xタン強: ${player}',
          },
        };

        if (matches.target === data.me)
          return { alertText: output.tankBusterOnYou!() };
        const target = data.party.member(matches.target);
        return { infoText: output.tankBusterOnPlayer!({ player: target }) };
      },
    },
    {
      id: 'AAI Kiwakin Sharp Strike',
      type: 'StartsUsing',
      netRegex: { id: '8C63', source: 'Aloalo Kiwakin' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AAI Kiwakin Tail Screw',
      type: 'StartsUsing',
      // This is a baited targeted circle.
      netRegex: { id: '8BB8', source: 'Aloalo Kiwakin', capture: false },
      response: Responses.moveAway(),
    },
    {
      id: 'AAI Snipper Water III',
      type: 'StartsUsing',
      netRegex: { id: '8C64', source: 'Aloalo Snipper' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'AAI Snipper Bubble Shower',
      type: 'StartsUsing',
      netRegex: { id: '8BB9', source: 'Aloalo Snipper', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '옆으로 (앞🡺뒤 공격)',
      },
    },
    {
      id: 'AAI Snipper Crab Dribble',
      type: 'Ability',
      // Crab Dribble 8BBA has a fast cast, so trigger on Bubble Shower ability
      netRegex: { id: '8BB9', source: 'Aloalo Snipper', capture: false },
      response: Responses.goFront('info'),
    },
    {
      id: 'AAI Ray Hydrocannon',
      type: 'StartsUsing',
      netRegex: { id: '8BBD', source: 'Aloalo Ray', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'AAI Ray Expulsion',
      type: 'StartsUsing',
      netRegex: { id: '8BBF', source: 'Aloalo Ray', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'AAI Ray Electric Whorl',
      type: 'StartsUsing',
      netRegex: { id: '8BBE', source: 'Aloalo Ray', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'AAI Monk Hydroshot',
      type: 'StartsUsing',
      netRegex: { id: '8C65', source: 'Aloalo Monk' },
      condition: Conditions.targetIsYou(),
      response: Responses.knockbackOn(),
    },
    {
      id: 'AAI Monk Cross Attack',
      type: 'StartsUsing',
      netRegex: { id: '8BBB', source: 'Aloalo Monk' },
      response: Responses.tankBuster(),
    },
    // ---------------- Ketuduke ----------------
    {
      id: 'AAI Ketuduke Tidal Roar',
      type: 'StartsUsing',
      netRegex: { id: '8AD4', source: 'Ketuduke', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'AAI Ketuduke Bubble Net',
      type: 'StartsUsing',
      netRegex: { id: '8AAD', source: 'Ketuduke', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'AAI Ketuduke Spring Crystals',
      type: 'StartsUsing',
      netRegex: { id: '8AA8', source: 'Ketuduke', capture: false },
      run: (data) => {
        data.ketuSpringCrystalCount++;
        data.ketuCrystalAdd = [];
      },
    },
    {
      id: 'AAI Ketuduke Spring Crystal 1 Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12606' },
      run: (data, matches) => data.ketuCrystalAdd.push(matches),
    },
    {
      id: 'AAI Ketuduke Spring Crystal 2 Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12607' },
      run: (data, matches) => data.ketuCrystalAdd.push(matches),
    },
    {
      id: 'AAI Ketuduke Bubble Weave/Foamy Fetters',
      type: 'GainsEffect',
      netRegex: { effectId: ['E9F', 'ECC'] },
      infoText: (data, matches, output) => {
        if (data.me !== matches.target)
          return;
        data.ketuMyBubbleFetters = matches.effectId;
        if (matches.effectId === 'E9F')
          return output.bubble!();
        return output.bind!();
      },
      run: (data, matches) => data.gainList.push(matches),
      outputStrings: {
        bubble: {
          en: '🔵버블',
          ja: 'バブル',
        },
        bind: {
          en: '🟡바인드',
          ja: 'バインド',
        },
      },
    },
    {
      id: 'AAI Ketuduke Hydrofall Target',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA3' },
      run: (data, matches) => data.ketuHydroStack = matches,
    },
    {
      id: 'AAI Ketuduke Hydrobullet Target',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA4' },
      run: (data, matches) => data.ketuHydroSpread = matches,
    },
    {
      id: 'AAI Ketuduke Fluke Gale Hydro',
      type: 'GainsEffect',
      netRegex: { effectId: ['EA3', 'EA4'] },
      condition: (data) => data.ketuHydroCount === 0 || data.ketuHydroCount === 5,
      delaySeconds: 0.5,
      suppressSeconds: 2,
      infoText: (_data, matches, output) => {
        if (matches.effectId === 'EA3')
          return output.stacks!();
        return output.spread!();
      },
      run: (data) => data.ketuHydroCount++,
      outputStrings: {
        spread: Outputs.spread,
        stacks: Outputs.getTogether,
      },
    },
    {
      // Pylene Strat: https://twitter.com/ff14_pylene99/status/1719665676745650610
      id: 'AAI Ketuduke Fluke Gale',
      type: 'Ability',
      netRegex: { id: '8AB1', source: 'Ketuduke', capture: false },
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        data.isStackFirst = isStackFirst(data.ketuHydroStack, data.ketuHydroSpread);
        if (data.ketuMyBubbleFetters !== 'E9F' && !data.isStackFirst)
          return output.go2!();
        return output.go1!();
      },
      run: (data) => delete data.ketuMyBubbleFetters,
      outputStrings: {
        go1: {
          en: '1번 칸으로',
          ja: '第1区域へ',
        },
        go2: {
          en: '2번 칸으로',
          ja: '第2区域へ',
        },
      },
    },
    {
      id: 'AAI Ketuduke Blowing Bubbles',
      type: 'GainsEffect',
      netRegex: { effectId: ['EA3', 'EA4'], capture: false },
      condition: (data) => data.ketuHydroCount === 1,
      delaySeconds: 4,
      durationSeconds: 8,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        data.isStackFirst = isStackFirst(data.ketuHydroStack, data.ketuHydroSpread);
        return data.isStackFirst ? output.stacks!() : output.spread!();
      },
      run: (data) => data.ketuHydroCount = 2,
      outputStrings: {
        stacks: Outputs.stackThenSpread,
        spread: Outputs.spreadThenStack,
      },
    },
    {
      id: 'AAI Ketuduke Blowing Bubbles Stack Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA3' },
      condition: (data) => data.ketuHydroCount === 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        if (!data.isStackFirst)
          return output.stacks!();
      },
      outputStrings: {
        stacks: Outputs.pairStack,
      },
    },
    {
      id: 'AAI Ketuduke Blowing Bubbles Spread Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA4' },
      condition: (data) => data.ketuHydroCount === 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        if (data.isStackFirst)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'AAI Ketuduke Twintides Hydrofall Target',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA3', capture: false },
      condition: (data) => data.ketuHydroCount === 2,
      run: (data) => {
        data.ketuHydroCount = 3;
        data.gainList = [];
      },
    },
    {
      id: 'AAI Ketuduke Receding Twintides',
      type: 'StartsUsing',
      netRegex: { id: '8ACC', source: 'Ketuduke', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '밖에 있다 => 안에서 페어',
          ja: '外 => ボスの下で頭割り',
        },
      },
    },
    {
      id: 'AAI Ketuduke Encroaching Twintides',
      type: 'StartsUsing',
      netRegex: { id: '8ACE', source: 'Ketuduke', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안에 있다 => 밖에서 페어',
          ja: 'ボスの下 => 外側で頭割り',
        },
      },
    },
    {
      id: 'AAI Ketuduke Spring Crystals 2',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12607', capture: false },
      condition: (data) => data.ketuSpringCrystalCount === 2 && data.ketuCrystalAdd.length === 4,
      alertText: (data, _matches, output) => {
        const horizontal = data.ketuCrystalAdd.filter((x) => isHorizontalCrystal(x));
        const vertical = data.ketuCrystalAdd.filter((x) => !isHorizontalCrystal(x));
        if (horizontal.length !== 2 || vertical.length !== 2)
          return;

        // Crystal positions are always -15, -5, 5, 15.

        // Check if any verticals are on the outer vertical edges.
        for (const line of vertical) {
          const y = parseFloat(line.y);
          if (y < -10 || y > 10)
            return output.eastWestSafe!();
        }

        // Check if any horizontals are on the outer horizontal edges.
        for (const line of horizontal) {
          const x = parseFloat(line.x);
          if (x < -10 || x > 10)
            return output.northSouthSafe!();
        }

        return output.cornersSafe!();
      },
      outputStrings: {
        northSouthSafe: {
          en: '안전: 남북',
          ja: '南・北',
        },
        eastWestSafe: {
          en: '안전: 동서',
          ja: '東・西',
        },
        cornersSafe: {
          en: '안전: 모서리',
          ja: '隅へ',
        },
      },
    },
    {
      id: 'AAI Ketuduke Roar Search',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA4' },
      condition: (data) => data.ketuHydroCount === 3,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      durationSeconds: 8,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        const [player] = data.gainList.filter((x) =>
          x.effectId === data.ketuMyBubbleFetters && x.target !== data.me
        ).map((x) => data.party.aJobName(x.target));
        if (player === undefined)
          return output.spread!();
        if (data.ketuMyBubbleFetters === 'E9F')
          return output.bubble!({ player: player });
        return output.bind!({ player: player });
      },
      run: (data) => {
        delete data.ketuMyBubbleFetters;
        data.ketuHydroCount = 4;
        data.gainList = [];
      },
      outputStrings: {
        bubble: {
          en: '흩어져요 (🔵버블: ${player})',
          ja: '散会 (バブル: ${player})',
        },
        bind: {
          en: '흩어져요 (🟡바인드: ${player})',
          ja: '散会 (バインド: ${player})',
        },
        spread: Outputs.spread,
      },
    },
    {
      id: 'AAI Ketuduke Roar Move',
      type: 'StartsUsing',
      netRegex: { id: '8AAC', source: 'Spring Crystal', capture: false },
      condition: (data) => data.ketuHydroCount === 4,
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '담당 쫄 뒤로!',
          ja: 'ざこの後ろに',
        },
      },
    },
    {
      id: 'AAI Ketuduke Angry Seas Hydro',
      type: 'GainsEffect',
      netRegex: { effectId: ['EA3', 'EA4'], capture: false },
      condition: (data) => data.ketuHydroCount === 4,
      delaySeconds: 4.5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        data.isStackFirst = isStackFirst(data.ketuHydroStack, data.ketuHydroSpread);
        return data.isStackFirst ? output.stack!() : output.spread!();
      },
      run: (data) => data.ketuHydroCount = 5,
      outputStrings: {
        stack: Outputs.stackThenSpread,
        spread: Outputs.spreadThenStack,
      },
    },
    {
      id: 'AAI Ketuduke Angry Seas',
      type: 'StartsUsing',
      netRegex: { id: '8AC1', source: 'Ketuduke', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'AAI Ketuduke Fluke Typhoon Bubble',
      type: 'StartsUsing',
      netRegex: { id: '8AAF', source: 'Ketuduke', capture: false },
      condition: (data) => data.role === 'dps',
      infoText: (data, _matches, output) => {
        if (data.ketuCrystalAdd.length !== 4 || data.ketuCrystalAdd[0] === undefined)
          return output.text!();
        if (parseFloat(data.ketuCrystalAdd[0].x) < 0)
          return output.left!();
        return output.right!();
      },
      run: (data) => data.ketuCrystalAdd = [],
      outputStrings: {
        text: '(슬슬 버블 타야 함)',
        left: '(왼쪽 DPS가 버블 타야 함)',
        right: '(오른쪽 DPS가 버블 타야 함)',
      },
    },
    {
      id: 'AAI Ketuduke Fluke Typhoon Tower',
      type: 'Ability',
      netRegex: { id: '8AB0', source: 'Ketuduke', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 피하면서 타워 밟아요',
          ja: '塔踏み',
        },
      },
    },
    // ---------------- second trash ----------------
    {
      id: 'AAI Wood Golem Ancient Aero III',
      type: 'StartsUsing',
      netRegex: { id: '8C4C', source: 'Aloalo Wood Golem' },
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'AAI Wood Golem Tornado',
      type: 'StartsUsing',
      netRegex: { id: '8C4D', source: 'Aloalo Wood Golem' },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.itsme!();
        return output.text!({ player: data.party.aJobName(matches.target) });
      },
      outputStrings: {
        itsme: {
          en: '내게 토네이도',
          ja: '自分にトルネド',
        },
        text: {
          en: '토네이도: ${player}',
          ja: 'トルネド: ${player}',
        },
      },
    },
    {
      id: 'AAI Wood Golem Tornado Esuna',
      type: 'Ability',
      netRegex: { id: '8C4D', source: 'Aloalo Wood Golem' },
      condition: (data) => data.role === 'healer' || data.job === 'BRD',
      alertText: (data, matches, output) =>
        output.text!({ player: data.party.aJobName(matches.target) }),
      outputStrings: {
        text: {
          en: '에스나: ${player}',
          ja: 'エスナ: ${player}',
        },
      },
    },
    {
      id: 'AAI Wood Golem Ovation',
      type: 'StartsUsing',
      netRegex: { id: '8BC1', source: 'Aloalo Wood Golem', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '옆이나 뒤로',
      },
    },
    {
      id: 'AAI Islekeeper Ancient Quaga',
      type: 'StartsUsing',
      netRegex: { id: '8C4E', source: 'Aloalo Islekeeper', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'AAI Islekeeper Gravity Force',
      type: 'StartsUsing',
      netRegex: { id: '8BC5', source: 'Aloalo Islekeeper' },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.itsme!();
        return output.text!({ player: data.party.aJobName(matches.target) });
      },
      outputStrings: {
        itsme: {
          en: '내게 중력',
          ja: '自分にグラビデフォース',
        },
        text: {
          en: '중력: ${player}',
          ja: 'グラビデフォース: ${player}',
        },
      },
    },
    {
      id: 'AAI Islekeeper Isle Drop',
      type: 'StartsUsing',
      netRegex: { id: '8C6F', source: 'Aloalo Islekeeper', capture: false },
      response: Responses.moveAway('alert'),
    },
    // ---------------- lala ----------------
    {
      id: 'AAI Lala Inferno Theorem',
      type: 'StartsUsing',
      netRegex: { id: '88AE', source: 'Lala', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'AAI Lala Lala Rotate',
      type: 'HeadMarker',
      netRegex: { id: ['01E4', '01E5'], target: 'Lala' },
      run: (data, matches) => data.lalaRotate = matches.id === '01E4' ? 'cw' : 'ccw',
    },
    {
      id: 'AAI Lala Lala Times',
      type: 'GainsEffect',
      // F62 = Times Three
      // F63 = Times Five
      netRegex: { effectId: ['F62', 'F63'], source: 'Lala', target: 'Lala' },
      run: (data, matches) => data.lalaTimes = matches.effectId === 'F62' ? 3 : 5,
    },
    {
      id: 'AAI Lala Player Rotate',
      type: 'HeadMarker',
      netRegex: { id: ['01ED', '01EE'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.lalaMyRotate = matches.id === '01ED' ? 'cw' : 'ccw',
    },
    {
      id: 'AAI Lala Player Times',
      type: 'GainsEffect',
      // E89 = Times Three
      // ECE = Times Five
      netRegex: { effectId: ['E89', 'ECE'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.lalaMyTimes = matches.effectId === 'E89' ? 3 : 5,
    },
    {
      id: 'AAI LaLa Arcane Blight Drection',
      type: 'StartsUsing',
      netRegex: { id: ['888B', '888C', '888D', '888E]'], source: 'Lala' },
      run: (data, matches) => {
        const blightMap: { [count: string]: MarchDirection } = {
          '888B': 'back',
          '888C': 'front',
          '888D': 'right',
          '888E': 'left',
        } as const;
        data.lalaBlight = blightMap[matches.id.toUpperCase()] ?? 'unknown';
      },
    },
    {
      id: 'AAI Lala Arcane Blight',
      type: 'StartsUsing',
      netRegex: { id: '888F', source: 'Lala', capture: false },
      delaySeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.lalaBlight === 'unknown')
          return output.text!();
        if (data.lalaRotate === 'unknown')
          return output[data.lalaBlight]!();
        if (isReverseRotate(data.lalaRotate, data.lalaTimes)) {
          return {
            'front': output.left!(),
            'back': output.right!(),
            'left': output.back!(),
            'right': output.front!(),
            'unknown': output.text!(),
          }[data.lalaBlight];
        }
        return {
          'front': output.right!(),
          'back': output.left!(),
          'left': output.front!(),
          'right': output.back!(),
          'unknown': output.text!(),
        }[data.lalaBlight];
      },
      outputStrings: {
        text: {
          en: '빈 곳으로~',
          ja: '安置へ移動',
        },
        front: Outputs.goFront,
        back: Outputs.getBehind,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'AAI Lala Analysis Unseen',
      type: 'GainsEffect',
      netRegex: { effectId: ['E8E', 'E8F', 'E90', 'E91'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const unseenMap: { [count: string]: MarchDirection } = {
          'E8E': 'front',
          'E8F': 'back',
          'E90': 'right',
          'E91': 'left',
        } as const;
        data.lalaMyMarch = unseenMap[matches.effectId] ?? 'unknown';
      },
    },
    {
      id: 'AAI Lala Arcane Array',
      type: 'Ability',
      netRegex: { id: '8890', source: 'Lala', capture: false },
      durationSeconds: 15,
      infoText: (data, _matches, output) => {
        const unseen = output[data.lalaMyMarch]!();
        return output.open!({ unseen: unseen });
      },
      outputStrings: {
        open: {
          en: '뚤린 곳: ${unseen}',
          ja: '開: ${unseen}',
        },
        front: Outputs.front,
        back: Outputs.back,
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Lala Targeted Light!',
      type: 'StartsUsing',
      netRegex: { id: '8CDF', source: 'Lala' },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.lalaMyMarch === 'unknown')
          return output.text!();
        if (data.lalaMyRotate === 'unknown')
          return output[data.lalaMyMarch]!();
        if (isReverseRotate(data.lalaMyRotate, data.lalaMyTimes))
          return {
            'front': output.left!(),
            'back': output.right!(),
            'left': output.back!(),
            'right': output.front!(),
          }[data.lalaMyMarch];
        return {
          'front': output.right!(),
          'back': output.left!(),
          'left': output.front!(),
          'right': output.back!(),
        }[data.lalaMyMarch];
      },
      outputStrings: {
        front: Outputs.lookTowardsBoss,
        back: {
          en: '뒤돌아 봐요',
          ja: '後ろ見て',
        },
        left: {
          en: '오른쪽 봐요',
          ja: '右見て',
        },
        right: {
          en: '왼쪽 봐요',
          ja: '左見て',
        },
        text: {
          en: '열린 곳을 보스로',
          ja: '未解析の方角をボスに向ける',
        },
      },
    },
    {
      id: 'AAI Lala Strategic Strike',
      type: 'StartsUsing',
      netRegex: { id: '88AD', source: 'Lala' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AAI Lala Subtractive Suppressor Alpha',
      type: 'GainsEffect',
      netRegex: { effectId: 'E8C', source: 'Lala' },
      run: (data, matches) => {
        if (data.me === matches.target)
          data.lalaSubtractive = parseInt(matches.count);
        data.gainList.push(matches);
      },
    },
    {
      id: 'AAI Lala Subtractive Suppressor Beta',
      type: 'GainsEffect',
      netRegex: { effectId: 'E8D', source: 'Lala' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.lalaSubtractive = parseInt(matches.count),
    },
    {
      id: 'AAI Lala Surge Vector',
      type: 'GainsEffect',
      netRegex: { effectId: 'E8B', source: 'Lala' },
      run: (data, matches) => data.gainList.push(matches),
    },
    {
      id: 'AAI Lala Planar Tactics',
      type: 'Ability',
      netRegex: { id: '8898', source: 'Lala', capture: false },
      delaySeconds: 1.2,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        if (data.lalaSubtractive === undefined)
          return;

        const mysub = data.lalaSubtractive;
        const list = data.gainList;

        if (data.triggerSetConfig.lalaPlanarTacticsType === 'poshiume') {
          const [s1, s2] = list.filter((x) => x.effectId === 'E8B').map((x) => x.target);
          let issame;
          if (s1 === undefined || s2 === undefined)
            issame = false;
          else {
            const dps1 = data.party.isDPS(s1);
            const dps2 = data.party.isDPS(s2);
            issame = (dps1 && dps2) || (!dps1 && !dps2);
          }

          if (mysub === 1) {
            if (issame)
              return output.ps1in!();
            const [pair] = list.filter((x) => parseInt(x.count) === 3);
            const name = pair === undefined ? output.unknown!() : data.party.aJobName(pair.target);
            return output.ps1out!({ name: name });
          }
          if (mysub === 2) {
            if (issame)
              return output.ps2out!();
            const [pair] = list.filter((x) => parseInt(x.count) === 2 && x.target !== data.me);
            const name = pair === undefined ? output.unknown!() : data.party.aJobName(pair.target);
            return output.ps2in!({ name: name });
          }
          if (mysub === 3) {
            if (issame)
              return output.ps3right!();
            const [pair] = list.filter((x) => parseInt(x.count) === 1);
            const name = pair === undefined ? output.unknown!() : data.party.aJobName(pair.target);
            return output.ps3left!({ name: name });
          }
        } else if (data.triggerSetConfig.lalaPlanarTacticsType === 'hamukatsu') {
          if (mysub === 1)
            return output.hm1!();
          if (mysub === 3)
            return output.hm3!();

          const mym = data.party.member(data.me);
          const [ptm] = list.filter((x) => x.target !== data.me && parseInt(x.count) === 2)
            .map((x) => data.party.member(x.target));
          if (mym === undefined || ptm === undefined)
            return output.hm2!();
          if (mym.jindex < ptm.jindex)
            return output.hm2left!();
          return output.hm2right!();
        }

        // 옵션이 이상하면 그냥
        return output.num!({ num: mysub });
      },
      run: (data) => data.gainList = [],
      outputStrings: {
        ps1out: '[1/바깥] 3번과 페어: ${name}',
        ps1in: '[1/안쪽] 2번과 페어',
        ps2out: '[2/바깥] 1,3번과 페어',
        ps2in: '[2/안쪽] 2번과 페어: ${name}',
        ps3left: '[3/아래줄 왼쪽] 1번과 페어: ${name}',
        ps3right: '[3/아래줄 오른쪽] 2번과 페어',
        hm1: '[1] 2번 페어',
        hm2: '[2] 1,3번과 페어',
        hm2left: '[2/왼쪽] 3번과 페어',
        hm2right: '[2/오른쪽] 1번과 페어',
        hm3: '[3] 2번 페어',
        num: '카운트: ${num}',
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Lala March',
      type: 'GainsEffect',
      netRegex: { effectId: ['E83', 'E84', 'E85', 'E86'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 7,
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        const map = {
          'E83': 'front',
          'E84': 'back',
          'E85': 'left',
          'E86': 'right',
        }[matches.effectId];
        if (map === undefined)
          return;
        if (data.lalaMyRotate === 'unknown')
          return output[map]!();
        if (isReverseRotate(data.lalaMyRotate, data.lalaMyTimes)) {
          return {
            'front': output.left!(),
            'back': output.right!(),
            'left': output.back!(),
            'right': output.front!(),
          }[map];
        }
        return {
          'front': output.right!(),
          'back': output.left!(),
          'left': output.front!(),
          'right': output.back!(),
        }[map];
      },
      outputStrings: {
        text: {
          en: '강제이동',
          ja: '強制移動',
        },
        front: {
          en: '강제이동: 앞으로',
          ja: '強制移動 : 前',
        },
        back: {
          en: '강제이동: 뒤로',
          ja: '強制移動 : 後ろ',
        },
        left: {
          en: '강제이동: 왼쪽',
          ja: '強制移動 : 左',
        },
        right: {
          en: '강제이동: 오른쪽',
          ja: '強制移動 : 右',
        },
      },
    },
    {
      id: 'AAI Lala Spatial Tactics',
      type: 'Ability',
      netRegex: { id: '88A0', source: 'Lala', capture: false },
      delaySeconds: 1.2,
      durationSeconds: 20,
      infoText: (data, _matches, output) => {
        if (data.lalaSubtractive === undefined)
          return;
        return output[`no${data.lalaSubtractive}`]!();
      },
      outputStrings: {
        no1: '[1] 구슬 쪽 => 다 피해욧',
        no2: '[2] 구슬 쪽 => 한번 맞아요',
        no3: '[3] 구슬 없는쪽 => 두번 맞아요',
        no4: '[4] 구슬 없는쪽 => 세번 맞아요',
      },
    },
    {
      id: 'AAI Lala Symmetric Surge Partner',
      type: 'Ability',
      netRegex: { id: '88A1', source: 'Lala', capture: false },
      delaySeconds: 1.2,
      alertText: (data, _matches, output) => {
        const [s1, s2] = data.gainList.filter((x) => x.effectId === 'E8B').map((x) => x.target);
        if (s1 === undefined || s2 === undefined)
          return;

        const dps1 = data.party.isDPS(s1);
        const dps2 = data.party.isDPS(s2);
        const same = (dps1 && dps2) || (!dps1 && !dps2);
        if (same)
          return;

        if (data.role === 'dps')
          return output.swap!();
      },
      outputStrings: {
        swap: {
          en: 'DPS 자리 바꿔요!',
          ja: 'DPS同志に入れ替え！',
        },
      },
    },
    {
      id: 'AAI Lala Symmetric Surge',
      type: 'Ability',
      netRegex: { id: '88A1', source: 'Lala', capture: false },
      delaySeconds: 31,
      durationSeconds: 5,
      response: Responses.pairStack(),
      run: (data) => data.gainList = [],
    },
    {
      id: 'AAI Lala Arcane Plot',
      type: 'StartsUsing',
      netRegex: { id: '88A2', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '바깥쪽 쫄 있는 곳이 북쪽!',
      },
    },
    {
      id: 'AAI Lala Arcane Plot Spread',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', source: 'Lala' },
      condition: (data, matches) =>
        data.me === matches.target && parseFloat(matches.duration) > 1.5,
      response: Responses.spread('alert'),
    },
    // ---------------- statice ----------------
    {
      id: 'AAI Statice Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '8949', source: 'Statice', capture: false },
      response: Responses.aoe('alert'),
    },
    {
      id: 'AAI Statice Trick Reload',
      type: 'StartsUsing',
      netRegex: { id: '894A', source: 'Statice', capture: false },
      run: (data) => {
        data.stcReloadCount = 0;
        data.stcReloadFailed = 0;
      },
    },
    {
      id: 'AAI Statice Locked and Loaded',
      type: 'Ability',
      netRegex: { id: '8925', source: 'Statice', capture: false },
      preRun: (data) => {
        if (data.stcReloadCount === 0)
          data.isStackFirst = false;
        data.stcReloadCount++;
      },
      infoText: (data, _matches, output) => {
        if (data.stcReloadCount === 1)
          return output.spread!();
      },
      outputStrings: {
        spread: {
          en: '(먼저 흩어져요)',
          ja: '(後で散会)',
        },
      },
    },
    {
      id: 'AAI Statice Misload',
      type: 'Ability',
      netRegex: { id: '8926', source: 'Statice', capture: false },
      preRun: (data) => {
        if (data.stcReloadCount === 0)
          data.isStackFirst = true;
        if (data.stcReloadCount < 7)
          data.stcReloadFailed = data.stcReloadCount;
        data.stcReloadCount++;
      },
      infoText: (data, _matches, output) => {
        if (data.stcReloadCount === 1)
          return output.stacks!();
        if (data.stcReloadCount < 8) {
          const mark = diceToMarker(data.stcReloadFailed);
          return output.text!({ safe: data.stcReloadFailed, mark: mark });
        }
      },
      outputStrings: {
        text: {
          en: '(안전: ${safe}번${mark})',
          ja: '(後で${safe}${mark})',
        },
        stacks: {
          en: '(먼저 뭉쳐요)',
          ja: '(後で頭割り)',
        },
      },
    },
    {
      id: 'AAI Statice Trapshooting 1',
      type: 'StartsUsing',
      netRegex: { id: '8D1A', source: 'Statice', capture: false },
      alertText: (data, _matches, output) => {
        const prev = data.isStackFirst;
        data.isStackFirst = !data.isStackFirst;
        if (prev)
          return output.stack!();
        return output.spread!();
      },
      outputStrings: {
        stack: Outputs.getTogether,
        spread: Outputs.spread,
      },
    },
    {
      id: 'AAI Statice Trapshooting 2',
      type: 'StartsUsing',
      netRegex: { id: '8959', source: 'Statice', capture: false },
      alertText: (data, _matches, output) => {
        let ret;
        if (data.stcMyDuration < 10)
          ret = data.isStackFirst ? output.stack!() : output.spread!();
        else if (data.stcMyDuration < 20)
          ret = forceMove(output, data.stcMyMarch, data.isStackFirst);
        else if (data.stcMyDuration > 50)
          ret = forceMove(output, data.stcMyMarch, data.isStackFirst);
        else
          ret = data.isStackFirst ? output.stack!() : output.spread!();
        data.isStackFirst = !data.isStackFirst;
        return ret;
      },
      run: (data) => data.stcMyDuration = 0,
      outputStrings: {
        ...ForceMoveStrings,
      },
    },
    {
      id: 'AAI Statice Trigger Happy',
      type: 'StartsUsing',
      netRegex: { id: '894B', source: 'Statice', capture: false },
      infoText: (data, _matches, output) => {
        const mark = diceToMarker(data.stcReloadFailed);
        return output.text!({ safe: data.stcReloadFailed, mark: mark });
      },
      outputStrings: {
        text: {
          en: '안전: ${safe}번${mark}',
          ja: '${safe}${mark}へ',
        },
      },
    },
    {
      id: 'AAI Statice Ring a Ring o\' Explosions',
      type: 'StartsUsing',
      netRegex: { id: '895C', source: 'Statice', capture: false },
      durationSeconds: 8,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          first: {
            en: '폭탄 피해요!',
            ja: '爆弾回避！',
          },
          second: {
            en: '폭탄 위치 기억! 빙글빙글!',
            ja: '爆弾の位置をおぼえて！',
          },
          third: {
            en: '폭탄없는 안전한 곳 찾아요!',
            ja: '爆弾回避！',
          },
          fourth: {
            en: '${safe}번${mark} 쪽 안전한 곳으로! 도넛 조심!',
            ja: '${safe}${mark}へ、ドーナツ回避',
          },
          forthMove: {
            en: '${safe}번${mark}',
            ja: '${safe}${mark}へ',
          },
          ...ForceMoveStrings,
        };
        data.stcRingRing++;
        if (data.stcRingRing === 1)
          return { infoText: output.first!() };
        if (data.stcRingRing === 2)
          return { infoText: output.second!() };
        if (data.stcRingRing === 3)
          return { infoText: output.third!() };
        if (data.stcRingRing === 4) {
          const mark = diceToMarker(data.stcReloadFailed);
          const fourth = output.fourth!({ safe: data.stcReloadFailed, mark: mark });
          if (data.stcMyDuration > 39 && data.stcMyDuration < 50) {
            const aim = output.forthMove!({ safe: data.stcReloadFailed, mark: mark });
            const move = forceMove(output, data.stcMyMarch, undefined, aim);
            return { infoText: fourth, alertText: move };
          }
          return { infoText: fourth };
        }
      },
    },
    {
      id: 'AAI Statice Dartboard of Dancing Explosives',
      type: 'Ability',
      netRegex: { id: '8CBD', source: 'Statice', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.gainList = [],
      outputStrings: {
        text: '폭탄 피해서 안전한 곳으로',
      },
    },
    {
      id: 'AAI Statice Bull\'s-eye Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'E9E' },
      run: (data, matches) => data.stcBullsEyes.push(data.party.member(matches.target)),
    },
    {
      id: 'AAI Statice Bull\'s-eye 1',
      type: 'GainsEffect',
      netRegex: { effectId: 'E9E' },
      condition: (data) => !data.stcSeenPinwheeling,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.blue!();
        if (data.role === 'healer')
          return output.yellow!();

        const dps = data.stcBullsEyes.filter((x) => x.role === 'dps');
        if (dps.length === 1)
          return output.red!();

        const other = dps[0]?.name !== data.me ? dps[0]?.name : dps[1]?.name;
        if (other === undefined)
          return output.red!();

        const mi = data.party.aJobIndex(data.me);
        const oi = data.party.aJobIndex(other);
        if (mi === undefined || oi === undefined)
          return output.redCheck!();
        if (mi < oi)
          return output.red!();

        const roles = data.stcBullsEyes.map((x) => x.role);
        if (roles.includes('healer'))
          return output.blue!();
        return output.yellow!();
      },
      run: (data) => data.stcBullsEyes = [],
      outputStrings: {
        blue: {
          en: '🟦파랑 밟아요',
          ja: '青へ',
        },
        yellow: {
          en: '🟨노랑 밟아요',
          ja: '黄色へ',
        },
        red: {
          en: '🟥빨강 밟아요',
          ja: '赤へ',
        },
        redCheck: {
          en: '🟥빨강 밟아요 (탱&힐 디버프 봐야되요)',
          ja: '赤へ (ただしタンクとヒーラの色確認)',
        },
      },
    },
    {
      id: 'AAI Statice Beguiling Glitter',
      type: 'Ability',
      netRegex: { id: '8963', source: 'Statice', capture: false },
      condition: (data) => data.stcPop < 2,
      delaySeconds: 3,
      suppressSeconds: 1,
      response: Responses.knockback(),
    },
    {
      id: 'AAI Statice Beguiling Glitter In/Out',
      type: 'Ability',
      netRegex: { id: '8963', source: 'Statice', capture: false },
      condition: (data) => data.stcPop < 2,
      delaySeconds: 8.5,
      durationSeconds: 8,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.isStackFirst)
          return output.out!();
        return output.in!();
      },
      outputStrings: {
        in: {
          en: '한가운데 => 바깥에서 흩어져요',
          ja: '真ん中 => 外側で散会',
        },
        out: {
          en: '바깥 => 한가운데서 뭉쳐요',
          ja: '外 => 真ん中で頭割り',
        },
      },
    },
    {
      id: 'AAI Statice Pop',
      type: 'StartsUsing',
      netRegex: { id: '894E', source: 'Statice', capture: false },
      run: (data) => data.stcPop++,
    },
    {
      id: 'AAI Statice March',
      type: 'GainsEffect',
      netRegex: { effectId: ['DD2', 'DD3', 'DD4', 'DD5'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const marchMap: { [count: string]: MarchDirection } = {
          'DD2': 'front',
          'DD3': 'back',
          'DD4': 'left',
          'DD5': 'right',
        } as const;
        data.stcMyMarch = marchMap[matches.effectId.toUpperCase()] ?? 'unknown';
        data.stcMyDuration = parseFloat(matches.duration);
      },
    },
    {
      id: 'AAI Statice Surprising Claw Collect',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Surprising Claw' },
      run: (data, matches) => data.stcClaws.push(matches.target),
    },
    {
      id: 'AAI Statice Surprising Claw',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Surprising Claw', capture: false },
      delaySeconds: 0.5,
      infoText: (data, _matches, output) => {
        if (!data.stcClaws.includes(data.me))
          return;
        let partner = undefined;
        if (data.stcClaws.length === 2)
          partner = data.stcClaws[0] !== data.me
            ? data.party.aJobName(data.stcClaws[0])
            : data.party.aJobName(data.stcClaws[1]);
        if (partner === undefined)
          partner = output.unknown!();
        return output.text!({ partner: partner });
      },
      run: (data) => data.stcClaws = [],
      outputStrings: {
        text: {
          en: '내게 데스 손톱이! (${partner})',
          ja: '自分にクロウ (${partner})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Statice Surprising Missile Collect',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Surprising Missile' },
      run: (data, matches) => data.stcMissiles.push(matches.target),
    },
    {
      id: 'AAI Statice Surprising Missile',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Surprising Missile', capture: false },
      delaySeconds: 0.5,
      infoText: (data, _matches, output) => {
        if (!data.stcMissiles.includes(data.me))
          return;
        let partner = undefined;
        if (data.stcMissiles.length === 2)
          partner = data.stcMissiles[0] !== data.me
            ? data.party.aJobName(data.stcMissiles[0])
            : data.party.aJobName(data.stcMissiles[1]);
        if (partner === undefined)
          partner = output.unknown!();
        return output.text!({ partner: partner });
      },
      run: (data) => data.stcMissiles = [],
      outputStrings: {
        text: {
          en: '미사일 + 체인, 한가운데로! (${partner})',
          ja: '自分にミサイル+チェイン (${partner})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Statice Shocking Abandon',
      type: 'StartsUsing',
      netRegex: { id: '8948', source: 'Statice' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AAI Statice Pinwheeling Dartboard',
      type: 'Ability',
      netRegex: { id: '8CBC', source: 'Statice', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.stcSeenPinwheeling = true,
      outputStrings: {
        text: '꼭지점 찾고 => 한가운데로',
      },
    },
    {
      id: 'AAI Statice Ball of Fire',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12511' }, // 동글
      infoText: (data, matches, output) => {
        data.stcBallFire = stcBallOfFire(matches);
        if (data.stcBallFire > 1000)
          return output.text!({ mesg: `${data.stcBallFire}/${matches.heading}` });
      },
      outputStrings: {
        text: '후: ${mesg}',
      },
    },
    {
      id: 'AAI Statice Bull\'s-eye 2',
      type: 'GainsEffect',
      netRegex: { effectId: 'E9E', capture: false },
      condition: (data) => data.stcSeenPinwheeling,
      delaySeconds: 1,
      suppressSeconds: 1,
      run: (data) => {
        const roles = data.stcBullsEyes.map((x) => x.role);
        data.stcBullsEyes = [];
        const dps = roles.filter((x) => x === 'dps');
        if (dps.length === 2) {
          data.stcAdjustBullsEye = true;
          return;
        }
        const th = roles.filter((x) => x === 'tank' || x === 'healer');
        if (th.length === 2) {
          data.stcAdjustBullsEye = true;
          return;
        }
        data.stcAdjustBullsEye = false;
      },
    },
    {
      id: 'AAI Statice Burning Chains Collect',
      type: 'HeadMarker',
      netRegex: { id: '0061' },
      run: (data, matches) => data.stcChains.push(matches.target),
    },
    {
      id: 'AAI Statice Burning Chains Alert',
      type: 'HeadMarker',
      netRegex: { id: '0061' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.1,
      alertText: (data, _matches, output) => {
        if (data.stcChains.length !== 2)
          return output.chain!();
        const partner = data.stcChains[0] !== data.me ? data.stcChains[0] : data.stcChains[1];
        return output.chainWith!({ partner: data.party.aJobName(partner) });
      },
      outputStrings: {
        chain: {
          en: '내게 체인!',
          ja: '自分にチェイン',
        },
        chainWith: {
          en: '내게 체인! (${partner})',
          ja: '自分にチェイン (${partner})',
        },
      },
    },
    {
      // Pino Strat: https://twitter.com/pino_mujuuryoku/status/1720127076190306359
      id: 'AAI Statice Burning Chains Tether',
      type: 'Tether',
      netRegex: { id: '0009' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cutchain: {
            en: '체인 끊어요!',
            ja: 'チェイン切る',
          },
          deathclaw: {
            en: '데스 손톱 유도 => 뭉쳐요',
            ja: 'クロウ誘導 => 頭割り',
          },
          adjustbullseye: {
            en: '북으로! 자리 조정 페어!',
            ja: '北へ！ 席入れ替え',
          },
          bullseye: {
            en: '북으로! 페어',
            ja: '北へ',
          },
        };
        if (data.me === matches.source || data.me === matches.target)
          return { alarmText: output.cutchain!() };
        if (data.stcSeenPinwheeling) {
          if (data.stcAdjustBullsEye)
            return { alertText: output.adjustbullseye!() };
          return { infoText: output.bullseye!() };
        }
        return { alertText: output.deathclaw!() };
      },
      run: (data) => data.stcChains = [],
    },
    // ---------------------------------------------- 테스트
    /*
    {
      id: 'AAI marker test',
      type: 'HeadMarker',
      netRegex: {},
      infoText: (_data, matches, output) => {
        const tested: string[] = [
          '0017', // 흩어져요
          '003E', // 뭉쳐요
          '0061', // 체인
          '00A1', // 뭉쳐 대상에게 옴
          '00C6', // 쫄이 씀. 따라오는 머시기
          '00DC', // 체인 끊김? 아무튼 Burning Chains 다음 나옴
          '00E5', // 흩어져/뭉쳐/매직업 셋중 하나일거 같음...
          '0150', // 케투 1번 휩쓸림
          '0151', // 케투 2번
          '01E4', // 라라 보스 시계
          '01E5', // 라라 보스 반시계
          '01ED', // 라라 플레이어 시계
          '01EE', // 라라 플레이어 반시계
          '01F7', // 라라 플레이어 모르겟다. 방향 관련 같은데
          '01F8', // 라라 플레이어 모르겟다. 방향 관련 같은데
          '00F3', // 라라 버스터 Strategic Strike
          '0186', // 186~18B 주사위 모양
          '0187',
          '0188',
          '0189',
          '018A',
          '018B',
          '015B', // 스타 페어. 기믹 처리하면서 해결됨
          '00DA', // 스타 버스터 Socking Abandon
          '009C', // 스타 Ball of Fire. 문제는 이거 어디 있는지만 알면...
        ];
        if (tested.includes(matches.id))
          return;
        return output.text!({ id: matches.id, dest: matches.target });
      },
      outputStrings: {
        text: '헤드마커: ${id} (${dest})',
      },
    },
    */
  ],
  timelineReplace: [
    {
      locale: 'en',
      replaceText: {
        'Hydrobullet/Hydrofall': 'Hydrobullet/fall',
        'Hydrofall/Hydrobullet': 'Hydrofall/bullet',
        'Locked and Loaded/Misload': '탄알 장전',
        'Receding Twintides/Encroaching Twintides': 'Receding/Encroaching Twintides',
        'Far Tide/Near Tide': 'Far/Near Tide',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Aloalo Islekeeper': 'アロアロ・キーパー',
        'Aloalo Kiwakin': 'アロアロ・キワキン',
        'Aloalo Monk': 'アロアロ・モンク',
        'Aloalo Ray': 'アロアロ・ストライプレイ',
        'Aloalo Snipper': 'アロアロ・スニッパー',
        'Aloalo Wood Golem': 'アロアロ・ウッドゴーレム',
        'Ketuduke': 'ケトゥドゥケ',
        'Lala': 'ララ',
        'Spring Crystal': '湧水のクリスタル',
        'Statice': 'スターチス',
        'Surprising Claw': 'サプライズ・クロー',
        'Surprising Missile': 'サプライズ・ミサイル',
        'The Dawn Trial': 'ディルムの試練',
        'The Dusk Trial': 'クルペの試練',
        'The Midnight Trial': 'ノコセロの試練',
      },
    },
  ],
};

export default triggerSet;
