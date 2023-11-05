import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { PartyMemberParamObject } from '../../../../../types/party';
import { TriggerSet } from '../../../../../types/trigger';

export type Phase = 'ketuduke' | 'lala' | 'statice';
export type ClockRotate = 'cw' | 'ccw' | 'unknown';
export type MarchDirection = 'front' | 'back' | 'left' | 'right';

export interface Data extends RaidbossData {
  phase?: Phase;
  ketuSpringCrystalCount: number;
  ketuCrystalAdd: NetMatches['AddedCombatant'][];
  ketuHydroCount: number;
  ketuHydroStack?: NetMatches['GainsEffect'];
  ketuHydroSpread?: NetMatches['GainsEffect'];
  ketuEffectId?: string;
  lalaBlight?: MarchDirection;
  lalaRotate?: ClockRotate;
  lalaNumber?: number;
  lalaArcanePlot?: boolean;
  lalaSubtractive?: number;
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
  myMarch?: MarchDirection;
  myRotate?: ClockRotate;
  myNumber?: number;
  gainList: NetMatches['GainsEffect'][];
  isStackFirst?: boolean;
  //
  readonly triggerSetConfig: {
    stackOrder: 'meleeRolesPartners' | 'rolesPartners';
  };
  combatantData: PluginCombatantState[];
}

// Horizontal crystals have a heading of 0, vertical crystals are -pi/2.
const isHorizontalCrystal = (line: NetMatches['AddedCombatant']) => {
  const epsilon = 0.1;
  return Math.abs(parseFloat(line.heading)) < epsilon;
};

// 스택 먼저?
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

// 리버스?
const isReverseRotate = (rot: ClockRotate, num?: number): boolean => {
  if (rot === 'cw' && num === 3)
    return true;
  if (rot === 'ccw' && (num === undefined || num === 5))
    return true;
  return false;
};

const triggerSet: TriggerSet<Data> = {
  id: 'AnotherAloaloIsland',
  zoneId: ZoneId.AnotherAloaloIsland,
  timelineFile: 'another_aloalo_island.txt',
  initData: () => {
    return {
      ketuSpringCrystalCount: 0,
      ketuCrystalAdd: [],
      ketuHydroCount: 0,
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
      gainList: [],
      //
      combatantData: [],
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
          },
          tankBusterOnPlayer: {
            en: '3연속 탱크버스터: ${player}',
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
      response: Responses.getBackThenFront(),
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
      id: 'AAI Ray Electric Whorl',
      type: 'StartsUsing',
      netRegex: { id: '8BBE', source: 'Aloalo Ray', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'AAI Monk Hydroshot',
      type: 'StartsUsing',
      netRegex: { id: '8BBE', source: 'Aloalo Monk' },
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
      run: (data) => data.phase = 'ketuduke',
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
      id: 'AAI Ketuduke Spring Crystal Collect',
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
        data.ketuEffectId = matches.effectId;
        if (matches.effectId === 'E9F')
          return output.bubble!();
        return output.bind!();
      },
      run: (data, matches) => data.gainList.push(matches),
      outputStrings: {
        bubble: '🔵버블',
        bind: '🟡바인드',
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
          return output.stack!();
        return output.spread!();
      },
      run: (data) => data.ketuHydroCount++,
      outputStrings: {
        spread: Outputs.spread,
        stack: Outputs.pairStack,
      },
    },
    {
      id: 'AAI Ketuduke Fluke Gale',
      type: 'Ability',
      netRegex: { id: '8AB1', source: 'Ketuduke', capture: false },
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        data.isStackFirst = isStackFirst(data.ketuHydroStack, data.ketuHydroSpread);
        if (data.ketuEffectId !== 'E9F' && !data.isStackFirst)
          return output.go2!();
        return output.go1!();
      },
      run: (data) => delete data.ketuEffectId,
      outputStrings: {
        go1: {
          en: '1번 칸으로',
        },
        go2: {
          en: '2번 칸으로',
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
        stacks: {
          en: '뭉쳤다 => 흩어져요',
        },
        spread: {
          en: '흩어졌다 => 뭉쳐요',
        },
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
          return output.pairStack!();
      },
      outputStrings: {
        pairStack: Outputs.pairStack,
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
        data.gainList = []; // Roar용 사람 찾기 리셋
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
        },
        eastWestSafe: {
          en: '안전: 동서',
        },
        cornersSafe: {
          en: '안전: 모서리',
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
          x.effectId === data.ketuEffectId && x.target !== data.me
        ).map((x) => data.party.member(x.target).ajob);
        if (data.ketuEffectId === 'E9F')
          return output.bubble!({ player: player });
        return output.bind!({ player: player });
      },
      run: (data) => {
        delete data.ketuEffectId;
        data.ketuHydroCount = 4;
        data.gainList = [];
      },
      outputStrings: {
        bubble: '바닥 쫄(${player}) => 자기 자리로',
        bind: '버블로(${player}) => 자기 자리로',
      },
    },
    {
      id: 'AAI Ketuduke Roar Move',
      type: 'StartsUsing',
      netRegex: { id: '8AAC', source: 'Spring Crystal', capture: false },
      condition: (data) => data.ketuHydroCount === 4, // 3이 아닐껄
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '쫄 뒤로!',
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
        stack: {
          en: '뭉쳤다 => 흩어져요',
        },
        spread: {
          en: '흩어졌다 => 뭉쳐요',
        },
      },
    },
    {
      id: 'AAI Ketuduke Angry Seas',
      type: 'StartsUsing',
      netRegex: { id: '8AC1', source: 'Ketuduke', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백! 저항하라!!!',
        },
      },
    },
    {
      id: 'AAI Ketuduke Fluke Typhoon',
      type: 'Ability',
      netRegex: { id: '8AB0', source: 'Ketuduke', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 피하면서 타워 밟아요',
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
        return output.text!({ player: data.party.member(matches.target).ajob });
      },
      outputStrings: {
        itsme: '내게 토네이도',
        text: '토네이도: ${player}',
      },
    },
    {
      id: 'AAI Wood Golem Tornado Esuna',
      type: 'Ability',
      netRegex: { id: '8C4D', source: 'Aloalo Wood Golem' },
      condition: (data) => data.role === 'healer' || data.job === 'BRD',
      alertText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.target).ajob }),
      outputStrings: {
        text: '에스나: ${player}',
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
        return output.text!({ player: data.party.member(matches.target).ajob });
      },
      outputStrings: {
        itsme: '내게 중력, 모여있다가',
        text: '중력, 모여있다가 (${player})',
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
      run: (data) => data.phase = 'lala',
    },
    {
      id: 'AAI Lala Lala Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['01E4', '01E5'], target: 'Lala' },
      run: (data, matches) => data.lalaRotate = matches.id === '01E4' ? 'cw' : 'ccw',
    },
    {
      id: 'AAI Lala Lala Times',
      type: 'GainsEffect',
      // F62 = Times Three
      // F63 = Times Five
      netRegex: { effectId: ['F62', 'ECE'], source: 'Lala', target: 'Lala' },
      run: (data, matches) => data.lalaNumber = matches.effectId === 'F62' ? 3 : 5,
    },
    {
      id: 'AAI Lala Player Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['01ED', '01EE'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.myRotate = matches.id === '01ED' ? 'cw' : 'ccw',
    },
    {
      id: 'AAI Lala Player Times',
      type: 'GainsEffect',
      // E89 = Times Three
      // ECE = Times Five
      netRegex: { effectId: ['E89', 'ECE'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.myNumber = matches.effectId === 'E89' ? 3 : 5,
    },
    {
      id: 'AAI LaLa Arcane Blight Open',
      type: 'StartsUsing',
      netRegex: { id: '888[B-E]', source: 'Lala' },
      run: (data, matches) => {
        const blightMap: { [count: string]: MarchDirection } = {
          '888D': 'right',
          '888E': 'left',
          '888B': 'back',
          '888C': 'front',
        } as const;
        data.lalaBlight = blightMap[matches.id.toUpperCase()];
      },
    },
    {
      id: 'AAI Lala Arcane Blight',
      type: 'StartsUsing',
      netRegex: { id: '888F', source: 'Lala', capture: false },
      delaySeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.lalaBlight === undefined)
          return output.text!();
        if (data.lalaRotate === undefined)
          return output[data.lalaBlight]!();
        if (isReverseRotate(data.lalaRotate, data.lalaNumber)) {
          return {
            'front': output.left!(),
            'back': output.right!(),
            'left': output.back!(),
            'right': output.front!(),
          }[data.lalaBlight];
        }
        return {
          'front': output.right!(),
          'back': output.left!(),
          'left': output.front!(),
          'right': output.back!(),
        }[data.lalaBlight];
      },
      run: (data) => {
        delete data.lalaBlight;
        delete data.lalaRotate;
        delete data.lalaNumber;
      },
      outputStrings: {
        text: {
          en: '빈 곳으로~',
          de: 'Geh in den sicheren Bereich',
          ja: '安置へ移動',
        },
        front: Outputs.goFront,
        back: Outputs.getBehind,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'AAI Lala Analysis Direction',
      type: 'GainsEffect',
      netRegex: { effectId: ['E8E', 'E8F', 'E90', 'E91'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const blightMap: { [count: string]: MarchDirection } = {
          'E8E': 'front',
          'E8F': 'back',
          'E90': 'right',
          'E91': 'left',
        } as const;
        data.myMarch = blightMap[matches.effectId];
      },
    },
    {
      id: 'AAI Lala Arcane Array',
      type: 'Ability',
      netRegex: { id: '8890', source: 'Lala', capture: false },
      durationSeconds: 15,
      infoText: (data, _matches, output) => {
        if (data.myMarch === undefined)
          return output.text!();
        return output.orbs!({ dir: output[data.myMarch]!() });
      },
      outputStrings: {
        text: '구멍을 구슬 쪽 잊지마셈',
        orbs: '뚤린 곳 구슬: ${dir}',
        front: '앞',
        back: '뒤',
        left: '왼쪽',
        right: '오른쪽',
      },
    },
    {
      id: 'AAI Lala Targeted Light',
      type: 'StartsUsing',
      netRegex: { id: '8CDF', source: 'Lala' },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.myMarch === undefined)
          return output.text!();
        if (data.myRotate === undefined)
          return output[data.myMarch]!();
        if (isReverseRotate(data.myRotate, data.myNumber))
          return {
            'front': output.left!(),
            'back': output.right!(),
            'left': output.back!(),
            'right': output.front!(),
          }[data.myMarch];
        return {
          'front': output.right!(),
          'back': output.left!(),
          'left': output.front!(),
          'right': output.back!(),
        }[data.myMarch];
      },
      run: (data) => {
        delete data.myMarch;
        delete data.myRotate;
        delete data.myNumber;
      },
      outputStrings: {
        front: Outputs.lookTowardsBoss,
        back: {
          en: '뒤돌아 봐요',
          de: 'Schau nach Hinten',
          ja: '後ろ見て',
        },
        left: {
          en: '오른쪽 봐요',
          de: 'Schau nach Rechts',
          ja: '右見て',
        },
        right: {
          en: '왼쪽 봐요',
          de: 'Schau nach Links',
          ja: '左見て',
        },
        text: {
          en: '열린 곳을 보스로',
          de: 'Zeige Öffnung zum Boss',
          fr: 'Pointez l\'ouverture vers Boss', // FIXME
          ja: '未解析の方角をボスに向ける',
          cn: '脚下光环缺口对准boss',
          ko: '문양이 빈 쪽을 보스쪽으로 향하게 하기', // FIXME
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

        const list = data.gainList;
        const [s1, s2] = list.filter((x) => x.effectId === 'E8B').map((x) => x.target);
        let issame;
        if (s1 === undefined || s2 === undefined)
          issame = false;
        else {
          const dps1 = data.party.isDPS(s1);
          const dps2 = data.party.isDPS(s2);
          issame = (dps1 && dps2) || (!dps1 && !dps2);
        }

        const mysub = data.lalaSubtractive;
        if (mysub === 1) {
          if (issame)
            return output.no1in!();
          const [pair] = list.filter((x) => parseInt(x.count) === 3);
          const name = pair === undefined ? output.unknown!() : data.party.member(pair.target).ajob;
          return output.no1out!({ name: name });
        }
        if (mysub === 2) {
          if (issame)
            return output.no2out!();
          const [pair] = list.filter((x) => parseInt(x.count) === 2 && x.target !== data.me);
          const name = pair === undefined ? output.unknown!() : data.party.member(pair.target).ajob;
          return output.no2in!({ name: name });
        }
        if (mysub === 3) {
          if (issame)
            return output.no3right!();
          const [pair] = list.filter((x) => parseInt(x.count) === 1);
          const name = pair === undefined ? output.unknown!() : data.party.member(pair.target).ajob;
          return output.no3left!({ name: name });
        }
      },
      run: (data) => {
        delete data.lalaSubtractive;
        data.gainList = [];
      },
      outputStrings: {
        no1out: '[1] 빈칸 위 바깥 (${name})',
        no1in: '[1] 빈칸 위 안쪽 (2번과 페어)',
        no2out: '[2] 1,2열 바깥쪽 (1,3번과 페어)',
        no2in: '[2] 1,2열 안쪽 (${name})',
        no3left: '[3] 아래줄 왼쪽으로 (${name})',
        no3right: '[3] 아래줄 오른쪽으로 (2번과 페어)',
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Lala March',
      type: 'GainsEffect',
      netRegex: { effectId: 'E8[3-6]', source: 'Lala' },
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
          return output.text!();
        if (data.myRotate === undefined)
          return output[map]!();
        if (isReverseRotate(data.myRotate, data.myNumber)) {
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
      run: (data) => {
        delete data.myRotate;
        delete data.myNumber;
      },
      outputStrings: {
        text: {
          en: '강제이동',
          de: 'Geistlenkung',
          fr: 'Piratage mental', // FIXME
          ja: '強制移動',
          cn: '强制移动', // FIXME
          ko: '강제이동', // FIXME
        },
        front: {
          en: '강제이동: 앞으로',
          de: 'Geistlenkung: Vorwärts',
          fr: 'Piratage mental : Vers l\'avant',
          ja: '強制移動 : 前',
          cn: '强制移动 : 前',
          ko: '강제이동: 앞',
        },
        back: {
          en: '강제이동: 뒤로',
          de: 'Geistlenkung: Rückwärts',
          fr: 'Piratage mental : Vers l\'arrière',
          ja: '強制移動 : 後ろ',
          cn: '强制移动 : 后',
          ko: '강제이동: 뒤',
        },
        left: {
          en: '강제이동: 왼쪽',
          de: 'Geistlenkung: Links',
          fr: 'Piratage mental : Vers la gauche',
          ja: '強制移動 : 左',
          cn: '强制移动 : 左',
          ko: '강제이동: 왼쪽',
        },
        right: {
          en: '강제이동: 오른쪽',
          de: 'Geistlenkung: Rechts',
          fr: 'Piratage mental : Vers la droite',
          ja: '強制移動 : 右',
          cn: '强制移动 : 右',
          ko: '강제이동: 오른쪽',
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
      run: (data) => delete data.lalaSubtractive,
      outputStrings: {
        no1: '[1] 구슬 쪽 => 다 피해욧',
        no2: '[2] 구슬 쪽 => 1번 맞아요',
        no3: '[3] 구슬 없는쪽 => 2번 맞아요',
        no4: '[4] 구슬 없는쪽 => 3번 맞아요',
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
        swap: '뭉칠 파트너 자리 바꿔요!',
      },
    },
    {
      id: 'AAI Lala Symmetric Surge',
      type: 'Ability',
      netRegex: { id: '88A1', source: 'Lala', capture: false },
      delaySeconds: 31,
      durationSeconds: 5,
      response: Responses.pairStack(),
      run: (data) => {
        delete data.lalaSubtractive;
        data.gainList = [];
      },
    },
    {
      id: 'AAI Lala Arcane Plot',
      type: 'StartsUsing',
      netRegex: { id: '88A2', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.lalaArcanePlot = true,
      outputStrings: {
        text: '바깥쪽 쫄 있는 곳 기준으로 흩어져요!',
      },
    },
    {
      id: 'AAI Lala Arcane Plot Spread',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', source: 'Lala' },
      condition: (data, matches) => data.lalaArcanePlot && data.me === matches.target,
      response: Responses.spread('alert'),
      run: (data) => delete data.lalaArcanePlot,
    },
    // ---------------- statice ----------------
    {
      id: 'AAI Statice Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '8949', source: 'Statice', capture: false },
      response: Responses.aoe('alert'),
      run: (data) => data.phase = 'statice',
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
        spread: '(먼저 흩어져요)',
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
        if (data.stcReloadCount < 8)
          return output.text!({ safe: data.stcReloadCount - 1 });
      },
      outputStrings: {
        text: '(안전: ${safe})',
        stacks: '(먼저 뭉쳐요)',
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
        const prev = data.isStackFirst;
        data.isStackFirst = !data.isStackFirst;
        if (data.myMarch !== undefined) {
          if (prev)
            return {
              'front': output.inForwards!(),
              'back': output.inBackwards!(),
              'left': output.inLeft!(),
              'right': output.inRight!(),
            }[data.myMarch];
          return {
            'front': output.outForwards!(),
            'back': output.outBackwards!(),
            'left': output.outLeft!(),
            'right': output.outRight!(),
          }[data.myMarch];
        }
        if (prev)
          return output.stack!();
        return output.spread!();
      },
      outputStrings: {
        stack: Outputs.getTogether,
        spread: Outputs.spread,
        outForwards: '강제이동: 앞 🡺 밖으로 ',
        outBackwards: '강제이동: 뒤 🡺 밖으로',
        outLeft: '강제이동: 왼쪽 🡺 밖으로',
        outRight: '강제이동: 오른쪽 🡺 밖으로',
        inForwards: '강제이동: 앞 🡺 한가운데',
        inBackwards: '강제이동: 뒤 🡺 한가운데',
        inLeft: '강제이동: 왼쪽 🡺 한가운데',
        inRight: '강제이동: 오른쪽 🡺 한가운데',
      },
    },
    {
      id: 'AAI Statice Trigger Happy',
      type: 'StartsUsing',
      netRegex: { id: '894B', source: 'Statice', capture: false },
      infoText: (data, _matches, output) => output.text!({ safe: data.stcReloadFailed }),
      outputStrings: {
        text: {
          en: '안전: ${safe}',
          de: 'Sicher: ${safe}',
          ja: '安置: ${safe}',
        },
      },
    },
    {
      id: 'AAI Statice Ring a Ring o\' Explosions',
      type: 'StartsUsing',
      netRegex: { id: '895C', source: 'Statice', capture: false },
      alertText: (data, _matches, output) => {
        data.stcRingRing++;
        if (data.stcRingRing === 1)
          return output.first!();
        if (data.stcRingRing === 2)
          return output.second!();
        if (data.stcRingRing === 3)
          return output.third!();
      },
      outputStrings: {
        first: '폭탄 피해요!',
        second: '폭탄 위치 기억! 빙글빙글!',
        third: '폭탄없는 안전한 곳 찾아요!',
      },
    },
    {
      id: 'AAI Statice Dartboard of Dancing Explosives',
      type: 'Ability',
      netRegex: { id: '8CBD', source: 'Statice', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => {
        delete data.myMarch;
        data.gainList = [];
      },
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

        const mi = data.party.ajobId(data.me);
        const oi = data.party.ajobId(other);
        if (mi === undefined || oi === undefined || mi < oi)
          return output.red!();

        const roles = data.stcBullsEyes.map((x) => x.role);
        if (roles.includes('healer'))
          return output.blue!();
        return output.yellow!();
      },
      run: (data) => data.stcBullsEyes = [],
      outputStrings: {
        blue: '🟦파랑 밟아요',
        yellow: '🟨노랑 밟아요',
        red: '🟥빨강 밟아요',
      },
    },
    {
      id: 'AAI Statice Beguiling Glitter',
      type: 'Ability',
      netRegex: { id: '8963', source: 'Statice', capture: false },
      delaySeconds: 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백! 저항하라!!!',
        },
      },
    },
    {
      id: 'AAI Statice Beguiling Glitter In/Out',
      type: 'Ability',
      netRegex: { id: '8963', source: 'Statice', capture: false },
      delaySeconds: 8.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.isStackFirst)
          return output.out!();
        return output.in!();
      },
      outputStrings: {
        in: '한가운데 => 바깥에서 흩어져요',
        out: '바깥 => 한가운데서 뭉쳐요',
      },
    },
    {
      id: 'AAI Statice March',
      type: 'GainsEffect',
      netRegex: { effectId: 'DD[2-5]' },
      run: (data, matches) => {
        const marchMap: { [count: string]: MarchDirection } = {
          'DD2': 'front',
          'DD3': 'back',
          'DD4': 'left',
          'DD5': 'right',
        } as const;
        data.myMarch = marchMap[matches.effectId.toUpperCase()];
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
            ? data.party.member(data.stcClaws[0]).ajob
            : data.party.member(data.stcClaws[1]).ajob;
        if (partner === undefined)
          partner = output.unknown!();
        return output.text!({ partner: partner });
      },
      run: (data) => data.stcClaws = [],
      outputStrings: {
        text: '내게 데스 손톱이! (${partner})',
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
            ? data.party.member(data.stcMissiles[0]).ajob
            : data.party.member(data.stcMissiles[1]).ajob;
        if (partner === undefined)
          partner = output.unknown!();
        return output.text!({ partner: partner });
      },
      run: (data) => data.stcMissiles = [],
      outputStrings: {
        text: '미사일 + 체인, 한가운데로! (${partner})',
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
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.stcSeenPinwheeling = true,
      outputStrings: {
        text: '꼭지점 찾고 => 한가운데로',
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
        return output.chainWith!({ partner: data.party.member(partner).ajob });
      },
      outputStrings: {
        chain: '내게 체인!',
        chainWith: '내게 체인! (${partner})',
      },
    },
    {
      id: 'AAI Statice Burning Chains Tether',
      type: 'Tether',
      netRegex: { id: '0009' },
      condition: (data) => data.phase === 'statice',
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cutchain: {
            en: '체인 끊어요!',
          },
          deathclaw: {
            en: '데스 손톱 유도 => 뭉쳐요',
          },
          adjustbullseye: {
            en: '북으로! 자리 조정 페어!',
          },
          bullseye: {
            en: '북으로! 페어',
          },
        };
        if (data.me === matches.source || data.me === matches.target)
          return { alarmText: output.cutchain!() };
        if (data.stcSeenPinwheeling) {
          if (data.stcAdjustBullsEye)
            return { alertText: output.adjustbullseye!() };
          return { infoText: output.bullseye!() };
        }
        return { alertText: output.deathclaw!() }; // 이건 데스 손톱 밖에 없다
      },
      run: (data) => data.stcChains = [],
    },
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
  ],
};

export default triggerSet;
