import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import Util from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { Role } from '../../../../../types/job';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export type StackSpread = 'stack' | 'spread';

export interface Data extends RaidbossData {
  prsStackFirst?: boolean;
  prsPartner?: string;
  prsHydroCount: number;
  prsHydroCollect: NetMatches['GainsEffect'][];
  prsKetuCount: number;
  prsKetuMyDebuff?: 'bubble' | 'bind';
  //
  readonly triggerSetConfig: {
    stackOrder: 'meleeRolesPartners' | 'rolesPartners';
  };
  combatantData: PluginCombatantState[];
}

// 메소드
const aPlayerByRole = (role: Role, data: Data): string => {
  const collect = role === 'tank'
    ? data.party.tankNames
    : role === 'healer'
    ? data.party.healerNames
    : data.party.dpsNames;
  const [target] = collect.filter((x) => x !== data.me);
  return target === undefined ? 'unknown' : target;
};
const aDpsWithPrior = (prior: boolean, data: Data): string => {
  const party = data.party;
  const [target1, target2] = party.dpsNames;
  const [job1, job2] = party.dpsNames.map((x) => party.jobName(x));
  if (target1 === undefined || target2 === undefined || job1 === undefined || job2 === undefined)
    return 'unknown';
  if (prior) {
    if (Util.isMeleeDpsJob(job1)) {
      if (Util.isMeleeDpsJob(job2))
        return job1 > job2 ? target1 : target2;
      return target1;
    }
    if (Util.isRangedDpsJob(job1)) {
      if (Util.isMeleeDpsJob(job2))
        return target2;
      if (Util.isRangedDpsJob(job2))
        return job1 > job2 ? target1 : target2;
      return target1;
    }
    if (Util.isCasterDpsJob(job1)) {
      if (Util.isMeleeDpsJob(job2) || Util.isRangedDpsJob(job2))
        return target2;
      if (Util.isCasterDpsJob(job2))
        return job1 > job2 ? target1 : target2;
    }
    return 'unknown';
  }
  if (Util.isMeleeDpsJob(job1)) {
    if (Util.isMeleeDpsJob(job2))
      return job1 > job2 ? target2 : target1;
    return target2;
  }
  if (Util.isRangedDpsJob(job1)) {
    if (Util.isMeleeDpsJob(job2))
      return target1;
    if (Util.isRangedDpsJob(job2))
      return job1 > job2 ? target2 : target1;
    return target2;
  }
  if (Util.isCasterDpsJob(job1)) {
    if (Util.isMeleeDpsJob(job2) || Util.isRangedDpsJob(job2))
      return target1;
    if (Util.isCasterDpsJob(job2))
      return job1 > job2 ? target2 : target1;
  }
  return 'unknown';
};
const aStackPartner = (data: Data, stack1: string, stack2: string): string | undefined => {
  const stacks = [stack1, stack2];
  const nomark = data.party.partyNames.filter((x) => !stacks.includes(x));
  if (nomark.length !== 2 || data.party.partyNames.length !== 4)
    return;

  const index = stack1 === data.me ? 0 : stack2 === data.me ? 1 : -1;
  let same;
  if (index < 0) {
    // 대상이 내가 아님
    const [notme] = nomark.filter((x) => x !== data.me);
    same = notme;
  } else {
    // 내가 대상
    same = index === 0 ? stack2 : stack1;
  }
  if (same === undefined)
    return;

  // 파트너 찾기. 블루메는 어찌할 것인가. 블루메로 여길 오게 될 것인가
  if (data.role === 'tank') {
    if (data.party.isHealer(same))
      return aDpsWithPrior(true, data);
    return aPlayerByRole('healer', data);
  } else if (data.role === 'healer') {
    if (data.party.isTank(same))
      return aDpsWithPrior(false, data);
    return aPlayerByRole('tank', data);
  }
  if (data.party.isTank(same) || data.party.isHealer(same))
    return aPlayerByRole('dps', data);
  const prior = aDpsWithPrior(true, data);
  if (prior === data.me)
    return aPlayerByRole('tank', data);
  return aPlayerByRole('healer', data);
};
const aBuildStackPartner = (
  data: Data,
  collect: NetMatches['GainsEffect'][],
  stackId: string,
  spreadId: string,
) => {
  const [stack1, stack2] = collect.filter((x) => x.effectId === stackId);
  const spread = collect.find((x) => x.effectId === spreadId);
  if (stack1 === undefined || stack2 === undefined || spread === undefined)
    return;
  const stackTime = parseFloat(stack1.duration);
  const spreadTime = parseFloat(spread.duration);
  data.prsStackFirst = stackTime < spreadTime;
  data.prsPartner = aStackPartner(data, stack1.target, stack2.target);
};

const triggerSet: TriggerSet<Data> = {
  id: 'AnotherAloaloIsland',
  zoneId: ZoneId.AnotherAloaloIsland,
  timelineFile: 'another_aloalo_island.txt',
  initData: () => {
    return {
      prsHydroCount: 1,
      prsHydroCollect: [],
      prsKetuCount: 0,
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
        const target = data.ShortName(matches.target);
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
      response: Responses.aoe(),
    },
    {
      id: 'AAI Ketuduke Bubble Net',
      type: 'StartsUsing',
      netRegex: { id: '8AAD', source: 'Ketuduke', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'AAI Ketuduke Bubble Weave/Foamy Fetters',
      type: 'GainsEffect',
      netRegex: { effectId: ['E9F', 'ECC'] },
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        data.prsKetuMyDebuff = matches.effectId === 'E9F' ? 'bubble' : 'bind';
        data.prsKetuCount++;
        return output[data.prsKetuMyDebuff]!();
      },
      outputStrings: {
        bubble: '🔵버블',
        bind: '🟡바인드',
      },
    },
    {
      id: 'AAI Ketuduke Hydro Collect Reset',
      type: 'Ability',
      netRegex: { id: ['8AB7', '8ABA'], capture: false }, // Hyper의 AOEActionEffect
      suppressSeconds: 2,
      run: (data) => {
        data.prsHydroCount++;
        data.prsHydroCollect = [];
      },
    },
    {
      id: 'AAI Ketuduke Hydro Collect',
      type: 'GainsEffect',
      // EA3 = Hydrofall Target (stack)
      // EA4 = Hydrobullet Target (spread)
      netRegex: { effectId: ['EA3', 'EA4'] },
      run: (data, matches) => data.prsHydroCollect.push(matches),
    },
    {
      id: 'AAI Ketuduke Hydro Collect 1',
      type: 'GainsEffect',
      netRegex: { effectId: ['EA3', 'EA4'] },
      condition: (data) => data.prsHydroCount === 1,
      delaySeconds: 0.5,
      suppressSeconds: 2,
      infoText: (_data, matches, output) => {
        if (matches.effectId === 'EA3')
          return output.stack!();
        return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
        stack: Outputs.pairStack,
      },
    },
    {
      id: 'AAI Ketuduke Hydro Collect 2',
      type: 'GainsEffect',
      netRegex: { effectId: ['EA3', 'EA4'], capture: false },
      condition: (data) => data.prsHydroCount === 2,
      delaySeconds: 4,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        aBuildStackPartner(data, data.prsHydroCollect, 'EA3', 'EA4');
        return data.prsStackFirst ? output.stack!() : output.spread!();
      },
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
      id: 'AAI Ketuduke Hydro Collect 2 Stack',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA3' },
      condition: (data) => data.prsHydroCount === 2,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        // data.ShortName(data.prsPartner)로 대상을 알 수 있다. 그렇지만 여긴 고정
        if (!data.prsStackFirst)
          return output.pairStack!();
      },
      outputStrings: {
        pairStack: Outputs.pairStack,
      },
    },
    {
      id: 'AAI Ketuduke Hydro Collect 2 Spread',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA4' },
      condition: (data) => data.prsHydroCount === 2,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        if (data.prsStackFirst)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'AAI Ketuduke Hydro Collect 5 Spread', // Roar 쫄 때 산개 고정
      type: 'GainsEffect',
      netRegex: { effectId: 'EA4' },
      condition: (data) => data.prsHydroCount === 5,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      durationSeconds: 10,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        if (data.prsKetuMyDebuff === 'bubble')
          return output.bubble!();
        return output.bind!();
      },
      outputStrings: {
        bubble: '바닥 쫄 찾고 => 흩어졌다 => 쫄로!',
        bind: '버블 찾고 => 흩어졌다 => 버블로!',
      },
    },
    {
      id: 'AAI Ketuduke Hydro Collect 6', // 앵그리 씨
      type: 'GainsEffect',
      netRegex: { effectId: ['EA3', 'EA4'], capture: false },
      condition: (data) => data.prsHydroCount === 6,
      delaySeconds: 4.5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        aBuildStackPartner(data, data.prsHydroCollect, 'EA3', 'EA4');
        return data.prsStackFirst ? output.stack!() : output.spread!();
      },
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
      id: 'AAI Ketuduke Fluke Gale',
      type: 'Ability',
      netRegex: { id: '8AB1', source: 'Ketuduke', capture: false },
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        if (data.prsHydroCollect.length === 0 || data.prsHydroCollect[0] === undefined)
          return;
        if (data.prsKetuMyDebuff === 'bind' && data.prsHydroCollect[0].effectId === 'EA4')
          return output.go2!();
        return output.go1!();
      },
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
      id: 'AAI Ketuduke Hydrobomb',
      type: 'StartsUsing',
      netRegex: { id: '8AD0', source: 'Ketuduke', capture: false },
      delaySeconds: 1.5,
      durationSeconds: 3.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '3x 장판!',
        },
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
      id: 'AAI Ketuduke Angry Seas',
      type: 'StartsUsing',
      netRegex: { id: '8AC1', source: 'Ketuduke' },
      condition: (_data, matches) => parseFloat(matches.castTime) > 4.5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백! 저항해욧!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      locale: 'en',
      replaceText: {
        'Hydrobullet/Hydrofall': 'Hydrobullet/fall',
        'Hydrofall/Hydrobullet': 'Hydrofall/bullet',
        'Receding Twintides/Encroaching Twintides': 'Receding/Encroaching Twintides',
        'Far Tide/Near Tide': 'Far/Near Tide',
      },
    },
  ],
};

export default triggerSet;
