import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import PartyTracker from '../../../../../resources/party';
import { Responses } from '../../../../../resources/responses';
import Util from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { Job } from '../../../../../types/job';
import { NetMatches } from '../../../../../types/net_matches';
import { Output, ResponseOutput, TriggerSet } from '../../../../../types/trigger';

type OdderTower = {
  blue?: string;
  orange?: string;
};

const headmarkers = {
  // vfx/lockon/eff/sph_lockon2_num01_s8p.avfx (through sph_lockon2_num04_s8p)
  limitCut1: '0150',
  limitCut2: '0151',
  limitCut3: '0152',
  limitCut4: '0153',
} as const;

const limitCutIds: readonly string[] = Object.values(headmarkers);

export interface Data extends RaidbossData {
  prPhase?: 'vengence' | 'moonless' | 'none';
  prHaunting?: number;
  prStornmclod?: number;
  prStackFirst?: boolean;
  prGainCollect: NetMatches['GainsEffect'][];
  prFlag: boolean;
  prSourceId?: string;
  prMoonTether: string[];
  prGiri: number;
  prTripleDir: number[];
  prTripleColor: boolean[];
  prShadowGiri: string[];
  //
  combatantData: PluginCombatantState[];
  wailingCollect: NetMatches['GainsEffect'][];
  wailCount: number;
  sparksCollect: NetMatches['GainsEffect'][];
  sparksCount: number;
  reincarnationCollect: [OdderTower, OdderTower, OdderTower, OdderTower];
  towerCount: number;
}

const giriAngles: { [effectId: string]: number } = {
  '85B0': 0,
  '85B1': 90,
  '85B2': 180,
  '85B3': 270,
  '85B4': 0,
  '85B5': 90,
  '85B6': 180,
  '85B7': 270,
  // '85B8': Unbound Spirit
  // '85B9': Azure Coil
  '85BA': 0,
  '85BB': 90,
  '85BC': 180,
  '85BD': 270,
  '85BE': 0,
  '85BF': 90,
  '85C0': 180,
  '85C1': 270,
};
const giriIds: readonly string[] = Object.keys(giriAngles);
const calcGiri = (giri: number, rot: number): number => {
  let add = giri + rot;
  if (add < 0)
    add += 360;
  else if (add > 360)
    add -= 360;
  return add;
};
const giriToSafe = (giri: number): string | undefined => {
  if (giri === 0 || giri === 360)
    return 'C';
  if (giri === 90)
    return 'D';
  if (giri === 180)
    return 'A';
  if (giri === 270)
    return 'B';
  return undefined;
};

const countJob = (job1: Job, job2: Job, func: (x: Job) => boolean): number => {
  return (func(job1) ? 1 : 0) + (func(job2) ? 1 : 0);
};

// For a given criteria func, if there's exactly one person who matches in the stack group
// and exactly one person who matches in the unmarked group, then they can stack together.
// This also filters out weird party comps naturally.
const couldStackLooseFunc = (
  stackJob1: Job,
  stackJob2: Job,
  unmarkedJob1: Job,
  unmarkedJob2: Job,
  func: (x: Job) => boolean,
): boolean => {
  const stackCount = countJob(stackJob1, stackJob2, func);
  const unmarkedCount = countJob(unmarkedJob1, unmarkedJob2, func);
  return stackCount === 1 && unmarkedCount === 1;
};
const isMeleeOrTank = (x: Job) => Util.isMeleeDpsJob(x) || Util.isTankJob(x);
const isSupport = (x: Job) => Util.isHealerJob(x) || Util.isTankJob(x);

type StackPartners = 'melee' | 'role' | 'mixed' | 'unknown';
const findStackPartners = (
  party: PartyTracker,
  stack1?: string,
  stack2?: string,
): StackPartners => {
  if (stack1 === undefined || stack2 === undefined)
    return 'unknown';

  const stacks = [stack1, stack2];
  const unmarked = party.partyNames.filter((x) => !stacks.includes(x));
  if (unmarked.length !== 2 || party.partyNames.length !== 4)
    return 'unknown';

  const [stackJob1, stackJob2] = stacks.map((x) => party.jobName(x));
  if (stackJob1 === undefined || stackJob2 === undefined)
    return 'unknown';
  const [unmarkedJob1, unmarkedJob2] = unmarked.map((x) => party.jobName(x));
  if (unmarkedJob1 === undefined || unmarkedJob2 === undefined)
    return 'unknown';

  const couldStack = (func: (x: Job) => boolean): boolean => {
    return couldStackLooseFunc(stackJob1, stackJob2, unmarkedJob1, unmarkedJob2, func);
  };

  if (couldStack(isMeleeOrTank))
    return 'melee';
  if (couldStack(isSupport))
    return 'role';

  // if we get here, then you have a not normal light party comp, e.g. two ranged.
  // For a tank/healer/ranged/ranged comp, this condition will always be true
  // when the role stack check above fails, but make it anyway in case the party
  // comp is something else entirely.
  const stackCount = countJob(stackJob1, stackJob2, isSupport);
  const unmarkedCount = countJob(unmarkedJob1, unmarkedJob2, isSupport);
  if (stackCount === 2 && unmarkedCount === 0 || stackCount === 0 && unmarkedCount === 2)
    return 'mixed';

  // if something has gone incredibly awry, then just return the default
  return 'unknown';
};

const stackSpreadResponse = (
  data: Data,
  output: Output,
  collect: NetMatches['GainsEffect'][],
  stackId: string,
  spreadId: string,
): ResponseOutput<Data, NetMatches['GainsEffect']> => {
  // cactbot-builtin-response
  output.responseOutputStrings = {
    // In a 4 person party with two randomly assigned stacks,
    // there are a couple of different "kinds of pairs" that make sense to call.
    //
    // You can have two melees together and two ranged together,
    // or you can have two supports together and two dps together (role stacks)
    // or you have no melee in your comp, and you could have mixed support and range.
    // Arguably things like "tank+ranged, melee+healer" are possible but are harder to call.
    //
    // Prefer "melee/ranged" stacks here and elsewhere because it keeps
    // the tank and melee together for uptime.
    spreadThenMeleeStack: {
      en: '흩어졌다 => 뭉쳐요',
    },
    spreadThenRoleStack: {
      en: '흩어졌다 => 롤 뭉쳐요',
    },
    spreadThenMixedStack: {
      en: '흩어졌다 => DPS 뭉쳐요',
    },
    meleeStackThenSpread: {
      en: '뭉쳤다 => 흩어져요',
    },
    roleStackThenSpread: {
      en: '롤 뭉쳤다 => 흩어져요',
    },
    mixedStackThenSpread: {
      en: 'DPS 뮹쳤다 => 흩어져요',
    },
    spreadThenStack: Outputs.spreadThenStack,
    stackThenSpread: Outputs.stackThenSpread,
    stacks: {
      en: '(${player1}, ${player2})',
    },
  };

  const [stack1, stack2] = collect.filter((x) => x.effectId === stackId);
  const spread = collect.find((x) => x.effectId === spreadId);
  if (stack1 === undefined || stack2 === undefined || spread === undefined)
    return;
  const stackTime = parseFloat(stack1.duration);
  const spreadTime = parseFloat(spread.duration);
  const isStackFirst = stackTime < spreadTime;

  const stackType = findStackPartners(data.party, stack1.target, stack2.target);

  if (data.options.AutumnStyle) {
    data.prStackFirst = isStackFirst;
    const teams = [data.party.aJobIndex(stack1.target), data.party.aJobIndex(stack2.target)];
    const [player1, player2] = data.party.aJobSortedArray(teams);
    const stackInfo = { infoText: output.stacks!({ player1: player1, player2: player2 }) };

    if (stackType === 'melee') {
      if (isStackFirst)
        return { alertText: output.meleeStackThenSpread!(), ...stackInfo };
      return { alertText: output.spreadThenMeleeStack!(), ...stackInfo };
    } else if (stackType === 'role') {
      if (isStackFirst)
        return { alertText: output.roleStackThenSpread!(), ...stackInfo };
      return { alertText: output.spreadThenRoleStack!(), ...stackInfo };
    } else if (stackType === 'mixed') {
      if (isStackFirst)
        return { alertText: output.mixedStackThenSpread!(), ...stackInfo };
      return { alertText: output.spreadThenMixedStack!(), ...stackInfo };
    }

    // 'unknown' catch-all
    if (isStackFirst)
      return { alertText: output.stackThenSpread!(), ...stackInfo };
    return { alertText: output.spreadThenStack!(), ...stackInfo };
  }

  const stacks = [stack1, stack2].map((x) => x.target).sort();
  const [player1, player2] = stacks.map((x) => data.party.aJobName(x));
  const stackInfo = { infoText: output.stacks!({ player1: player1, player2: player2 }) };

  if (stackType === 'melee') {
    if (isStackFirst)
      return { alertText: output.meleeStackThenSpread!(), ...stackInfo };
    return { alertText: output.spreadThenMeleeStack!(), ...stackInfo };
  } else if (stackType === 'role') {
    if (isStackFirst)
      return { alertText: output.roleStackThenSpread!(), ...stackInfo };
    return { alertText: output.spreadThenRoleStack!(), ...stackInfo };
  } else if (stackType === 'mixed') {
    if (isStackFirst)
      return { alertText: output.mixedStackThenSpread!(), ...stackInfo };
    return { alertText: output.spreadThenMixedStack!(), ...stackInfo };
  }

  // 'unknown' catch-all
  if (isStackFirst)
    return { alertText: output.stackThenSpread!(), ...stackInfo };
  return { alertText: output.spreadThenStack!(), ...stackInfo };
};

const towerResponse = (
  data: Data,
  output: Output,
): ResponseOutput<Data, NetMatches['None']> => {
  // cactbot-builtin-response
  output.responseOutputStrings = {
    tetherThenBlueTower: {
      en: '줄채고#${num1} => 🔵타워로#${num2}',
    },
    tetherThenOrangeTower: {
      en: '줄채고#${num1} => 🔴타워로#${num2}',
    },
    tether: {
      en: '줄채요#${num}',
    },
    blueTower: {
      en: '🔵타워로#${num}',
    },
    orangeTower: {
      en: '🔴타워로#${num}',
    },
    num1: Outputs.num1,
    num2: Outputs.num2,
    num3: Outputs.num3,
    num4: Outputs.num4,
  };

  // data.towerCount is 0-indexed
  // towerNum for display is 1-indexed
  const theseTowers = data.reincarnationCollect[data.towerCount];
  const towerNum = data.towerCount + 1;
  data.towerCount++;

  if (theseTowers === undefined)
    return;

  const numMap: { [towerNum: number]: string } = {
    1: output.num1!(),
    2: output.num2!(),
    3: output.num3!(),
    4: output.num4!(),
  } as const;

  const numStr = numMap[towerNum];
  if (numStr === undefined)
    return;

  if (data.me === theseTowers.blue)
    return { alertText: output.blueTower!({ num: numStr }) };
  if (data.me === theseTowers.orange)
    return { alertText: output.orangeTower!({ num: numStr }) };
  const nextTowers = data.reincarnationCollect[towerNum + 1];
  const nextNumStr = numMap[towerNum + 1];
  if (towerNum === 4 || nextTowers === undefined || nextNumStr === undefined)
    return { alertText: output.tether!({ num: numStr }) };

  if (data.me === nextTowers.blue)
    return { alertText: output.tetherThenBlueTower!({ num1: numStr, num2: nextNumStr }) };
  if (data.me === nextTowers.orange)
    return { alertText: output.tetherThenOrangeTower!({ num1: numStr, num2: nextNumStr }) };

  // Just in case...
  return { alertText: output.tether!({ num: numStr }) };
};

const triggerSet: TriggerSet<Data> = {
  id: 'AnotherMountRokkon',
  zoneId: ZoneId.AnotherMountRokkon,
  timelineFile: 'another_mount_rokkon.txt',
  initData: () => {
    return {
      prGainCollect: [],
      prFlag: false,
      prMoonTether: [],
      prGiri: 0,
      prTripleDir: [],
      prTripleColor: [],
      prShadowGiri: [],
      //
      combatantData: [],
      wailingCollect: [],
      wailCount: 0,
      sparksCollect: [],
      sparksCount: 0,
      reincarnationCollect: [{}, {}, {}, {}],
      towerCount: 0,
    };
  },
  triggers: [
    // ---------------- first trash ----------------
    {
      id: 'AMR Shishu Raiko Disciples of Levin',
      type: 'StartsUsing',
      netRegex: { id: '8656', source: 'Shishu Raiko', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'AMR Shishu Furutsubaki Bloody Caress',
      type: 'StartsUsing',
      netRegex: { id: '8657', source: 'Shishu Furutsubaki', capture: false },
      suppressSeconds: 5,
      response: Responses.getBehind('info'),
    },
    {
      id: 'AMR Shishu Raiko Barreling Smash',
      type: 'StartsUsing',
      netRegex: { id: '8653', source: 'Shishu Raiko' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          chargeOnYou: {
            en: '내게 돌진',
          },
          chargeOn: {
            en: '돌진: ${player}',
          },
        };

        if (matches.target === data.me)
          return { alarmText: output.chargeOnYou!() };
        return { alertText: output.chargeOn!({ player: data.party.aJobName(matches.target) }) };
      },
    },
    {
      id: 'AMR Shishu Raiko Howl',
      type: 'StartsUsing',
      netRegex: { id: '8654', source: 'Shishu Raiko', capture: false },
      response: Responses.bleedAoe('info'),
    },
    {
      id: 'AMR Shishu Raiko Master of Levin',
      type: 'StartsUsing',
      netRegex: { id: '8655', source: 'Shishu Raiko', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'AMR Shishu Fuko Scythe Tail',
      type: 'StartsUsing',
      netRegex: { id: '865A', source: 'Shishu Raiko', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'AMR Shishu Fuko Twister',
      type: 'StartsUsing',
      netRegex: { id: '8658', source: 'Shishu Raiko' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'AMR Shishu Fuko Crosswind',
      type: 'StartsUsing',
      netRegex: { id: '8659', source: 'Shishu Raiko', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'AMR Shishu Yuki Right Swipe',
      type: 'StartsUsing',
      netRegex: { id: '8685', source: 'Shishu Yuki', capture: false },
      response: Responses.goLeft('info'),
    },
    {
      id: 'AMR Shishu Yuki Left Swipe',
      type: 'StartsUsing',
      netRegex: { id: '8686', source: 'Shishu Yuki', capture: false },
      response: Responses.goRight('info'),
    },
    // ---------------- Shishio ----------------
    {
      id: 'AMR Shishio Enkyo',
      type: 'StartsUsing',
      netRegex: { id: '841A', source: 'Shishio', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'AMR Shishio Splitting Cry',
      type: 'StartsUsing',
      netRegex: { id: '841B', source: 'Shishio' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AMR Shishio Splitter',
      type: 'Ability',
      // This comes out ~4s after Splitting Cry.
      netRegex: { id: '841B', source: 'Shishio', capture: false },
      suppressSeconds: 5,
      response: Responses.goFrontOrSides('info'),
    },
    {
      id: 'AMR Shishio Unnatural Wail Count',
      type: 'StartsUsing',
      netRegex: { id: '8417', source: 'Shishio', capture: false },
      run: (data) => {
        data.wailCount++;
        data.wailingCollect = [];
      },
    },
    {
      id: 'AMR Shishio Wailing Collect',
      type: 'GainsEffect',
      // DEB = Scattered Wailing (spread)
      // DEC = Intensified Wailing (stack)
      netRegex: { effectId: ['DEB', 'DEC'], source: 'Shishio' },
      run: (data, matches) => data.wailingCollect.push(matches),
    },
    {
      id: 'AMR Shishio Unnatural Wailing 1',
      type: 'GainsEffect',
      netRegex: { effectId: ['DEB', 'DEC'], source: 'Shishio', capture: false },
      condition: (data) => data.wailCount === 1,
      delaySeconds: 0.5,
      suppressSeconds: 999999,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        return stackSpreadResponse(data, output, data.wailingCollect, 'DEC', 'DEB');
      },
    },
    {
      id: 'AMR Shishio Vortex of the Thunder Eye',
      type: 'StartsUsing',
      // 8413 = Eye of the Thunder Vortex (out)
      // 8415 = Vortex of the Thnder Eye (in)
      netRegex: { id: ['8413', '8415'], source: 'Shishio' },
      durationSeconds: 7,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          out: Outputs.out,
          in: Outputs.in,
          spreadThenMeleeStack: {
            en: '${inOut} 흩어졌다 => ${outIn} 뭉쳐요',
          },
          spreadThenRoleStack: {
            en: '${inOut} 흩어졌다 => ${outIn} 롤 뭉쳐요',
          },
          spreadThenMixedStack: {
            en: '${inOut} 흩어졌다 => ${outIn} DPS 뭉쳐요',
          },
          meleeStackThenSpread: {
            en: '${inOut} 뭉쳣다 => ${outIn} 흩어져요',
          },
          roleStackThenSpread: {
            en: '${inOut} 롤 뭉쳤다 => ${outIn} 흩어져요',
          },
          mixedStackThenSpread: {
            en: '${inOut} DPS 뭉쳤다 => ${outIn} 흩어져요',
          },
          spreadThenStack: {
            en: '${inOut} 흩어졌다 => ${outIn} 뭉쳐요',
          },
          stackThenSpread: {
            en: '${inOut} 뭉쳤다 => ${outIn} 흩어져요',
          },
          stacks: {
            en: '(${player1}, ${player2})',
          },
          out1: {
            en: '밖에서',
          },
          out2: {
            en: '밖으로',
          },
          in1: {
            en: '안에서',
          },
          in2: {
            en: '안으로',
          },
        };

        const [stack1, stack2] = data.wailingCollect.filter((x) => x.effectId === 'DEC');
        const spread = data.wailingCollect.find((x) => x.effectId === 'DEB');
        if (stack1 === undefined || stack2 === undefined || spread === undefined)
          return;
        const stackTime = parseFloat(stack1.duration);
        const spreadTime = parseFloat(spread.duration);
        const isStackFirst = stackTime < spreadTime;

        const stackType = findStackPartners(data.party, stack1.target, stack2.target);

        const isInFirst = matches.id === '8415';

        if (data.options.AutumnStyle) {
          const inOut = isInFirst ? output.in1!() : output.out1!();
          const outIn = isInFirst ? output.out2!() : output.in2!();
          const args = { inOut: inOut, outIn: outIn };

          const teams = [data.party.aJobIndex(stack1.target), data.party.aJobIndex(stack2.target)];
          const [player1, player2] = data.party.aJobSortedArray(teams);
          const stackInfo = { infoText: output.stacks!({ player1: player1, player2: player2 }) };

          if (stackType === 'melee') {
            if (isStackFirst)
              return { alertText: output.meleeStackThenSpread!(args), ...stackInfo };
            return { alertText: output.spreadThenMeleeStack!(args), ...stackInfo };
          } else if (stackType === 'role') {
            if (isStackFirst)
              return { alertText: output.roleStackThenSpread!(args), ...stackInfo };
            return { alertText: output.spreadThenRoleStack!(args), ...stackInfo };
          } else if (stackType === 'mixed') {
            if (isStackFirst)
              return { alertText: output.mixedStackThenSpread!(args), ...stackInfo };
            return { alertText: output.spreadThenMixedStack!(args), ...stackInfo };
          }

          // 'unknown' catch-all
          if (isStackFirst)
            return { alertText: output.stackThenSpread!(args), ...stackInfo };
          return { alertText: output.spreadThenStack!(args), ...stackInfo };
        }

        const inOut = isInFirst ? output.in!() : output.out!();
        const outIn = isInFirst ? output.out!() : output.in!();
        const args = { inOut: inOut, outIn: outIn };

        const stacks = [stack1, stack2].map((x) => x.target).sort();
        const [player1, player2] = stacks.map((x) => data.party.aJobName(x));
        const stackInfo = { infoText: output.stacks!({ player1: player1, player2: player2 }) };

        if (stackType === 'melee') {
          if (isStackFirst)
            return { alertText: output.meleeStackThenSpread!(args), ...stackInfo };
          return { alertText: output.spreadThenMeleeStack!(args), ...stackInfo };
        } else if (stackType === 'role') {
          if (isStackFirst)
            return { alertText: output.roleStackThenSpread!(args), ...stackInfo };
          return { alertText: output.spreadThenRoleStack!(args), ...stackInfo };
        } else if (stackType === 'mixed') {
          if (isStackFirst)
            return { alertText: output.mixedStackThenSpread!(args), ...stackInfo };
          return { alertText: output.spreadThenMixedStack!(args), ...stackInfo };
        }

        // 'unknown' catch-all
        if (isStackFirst)
          return { alertText: output.stackThenSpread!(args), ...stackInfo };
        return { alertText: output.spreadThenStack!(args), ...stackInfo };
      },
    },
    {
      id: 'AMR Shishio Thunder Vortex',
      type: 'StartsUsing',
      netRegex: { id: '8412', source: 'Shishio', capture: false },
      response: Responses.getUnder(),
    },
    // ---------------- second trash ----------------
    {
      id: 'AMR Shishu Kotengu Backward Blows',
      type: 'StartsUsing',
      netRegex: { id: '865C', source: 'Shishu Kotengu', capture: false },
      durationSeconds: 5.7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '옆으로 (앞🡺뒤 더블 어택)',
        },
      },
    },
    {
      id: 'AMR Shishu Kotengu Leftward Blows',
      type: 'StartsUsing',
      netRegex: { id: '865D', source: 'Shishu Kotengu', capture: false },
      durationSeconds: 5.7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '오른쪽 + 뒤로',
        },
      },
    },
    {
      id: 'AMR Shishu Kotengu Rightward Blows',
      type: 'StartsUsing',
      netRegex: { id: '865E', source: 'Shishu Kotengu', capture: false },
      durationSeconds: 5.7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽 + 뒤로',
        },
      },
    },
    {
      id: 'AMR Shishu Kotengu Wrath of the Tengu',
      type: 'StartsUsing',
      netRegex: { id: '8660', source: 'Shishu Kotengu', capture: false },
      response: Responses.bleedAoe('alert'),
    },
    {
      id: 'AMR Shishu Kotengu Gaze of the Tengu',
      type: 'StartsUsing',
      netRegex: { id: '8661', source: 'Shishu Kotengu', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'AMR Shishu Onmitsugashira Juji Shuriken',
      type: 'StartsUsing',
      netRegex: { id: '8664', source: 'Shishu Onmitsugashira', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'AMR Shishu Onmitsugashira Issen',
      type: 'StartsUsing',
      netRegex: { id: '8662', source: 'Shishu Onmitsugashira' },
      response: Responses.tankBuster(),
    },
    // ---------------- Gorai the Uncaged ----------------
    {
      id: 'AMR Gorai Unenlightenment',
      type: 'StartsUsing',
      netRegex: { id: '8534', source: 'Gorai the Uncaged', capture: false },
      response: Responses.bleedAoe('info'),
    },
    {
      id: 'AMR Gorai Sparks Count',
      type: 'StartsUsing',
      netRegex: { id: '8503', source: 'Gorai the Uncaged', capture: false },
      run: (data) => {
        data.sparksCount++;
        data.sparksCollect = [];
      },
    },
    {
      id: 'AMR Gorai Sparks Collect',
      type: 'GainsEffect',
      // E17 = Live Brazier (stack)
      // E18 = Live Candle (spread)
      netRegex: { effectId: ['E17', 'E18'] },
      run: (data, matches) => data.sparksCollect.push(matches),
    },
    {
      id: 'AMR Gorai Seal of Scurrying Sparks 1',
      type: 'GainsEffect',
      netRegex: { effectId: ['E17', 'E18'], capture: false },
      condition: (data) => data.sparksCount === 1,
      delaySeconds: 0.5,
      suppressSeconds: 10,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          meleeStack: {
            en: '뭉쳐요',
          },
          roleStack: {
            en: '롤 뭉쳐요',
          },
          mixedStack: {
            en: 'DPS와 뭉쳐요',
          },
          stacks: {
            en: '(${player1}, ${player2})',
          },
        };

        const [stack1, stack2] = data.sparksCollect.filter((x) => x.effectId === 'E17');
        if (stack1 === undefined || stack2 === undefined)
          return;

        const stackType = findStackPartners(data.party, stack1.target, stack2.target);

        if (data.options.AutumnStyle) {
          const teams = [data.party.aJobIndex(stack1.target), data.party.aJobIndex(stack2.target)];
          const [player1, player2] = data.party.aJobSortedArray(teams);
          const stackInfo = { infoText: output.stacks!({ player1: player1, player2: player2 }) };
          if (stackType === 'melee') {
            return { alertText: output.meleeStack!(), ...stackInfo };
          } else if (stackType === 'role') {
            return { alertText: output.roleStack!(), ...stackInfo };
          } else if (stackType === 'mixed') {
            return { alertText: output.mixedStack!(), ...stackInfo };
          }
          return stackInfo;
        }

        const stacks = [stack1, stack2].map((x) => x.target).sort();
        const [player1, player2] = stacks.map((x) => data.party.aJobName(x));
        const stackInfo = { infoText: output.stacks!({ player1: player1, player2: player2 }) };

        if (stackType === 'melee') {
          return { alertText: output.meleeStack!(), ...stackInfo };
        } else if (stackType === 'role') {
          return { alertText: output.roleStack!(), ...stackInfo };
        } else if (stackType === 'mixed') {
          return { alertText: output.mixedStack!(), ...stackInfo };
        }

        // 'unknown' catch-all
        return stackInfo;
      },
    },
    {
      id: 'AMR Gorai Seal of Scurrying Sparks 2',
      type: 'GainsEffect',
      netRegex: { effectId: ['E17', 'E18'], capture: false },
      condition: (data) => data.sparksCount === 2,
      delaySeconds: 0.5,
      suppressSeconds: 10,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        return stackSpreadResponse(data, output, data.sparksCollect, 'E17', 'E18');
      },
    },
    {
      id: 'AMR Gorai Torching Torment',
      type: 'StartsUsing',
      netRegex: { id: '8532', source: 'Gorai the Uncaged' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AMR Gorai Impure Purgation First Hit',
      type: 'StartsUsing',
      netRegex: { id: '852F', source: 'Gorai the Uncaged', capture: false },
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '부채꼴, 흩어져요',
          de: 'Um den Boss verteilen',
          fr: 'Changement',
          ja: 'ボスを基準として散開',
          cn: '和队友分散路径',
          ko: '산개',
        },
      },
    },
    {
      id: 'AMR Gorai Impure Purgation Second Hit',
      type: 'StartsUsing',
      netRegex: { id: '8531', source: 'Gorai the Uncaged', capture: false },
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
    {
      id: 'AMR Gorai Humble Hammer',
      type: 'StartsUsing',
      netRegex: { id: '8525', source: 'Gorai the Uncaged' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '모서리 번개 구슬 몸통 박치기',
        },
      },
    },
    {
      id: 'AMR Gorai Flintlock',
      type: 'Ability',
      // Trigger this on Humble Hammer damage
      netRegex: { id: '8525', source: 'Gorai the Uncaged', capture: false },
      // This cleaves and should hit the orb and the player.
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '한 줄 뭉쳐요',
          de: 'Sammeln in einer Linie',
          fr: 'Packez-vous en ligne',
          ja: '頭割り',
          cn: '直线分摊',
          ko: '직선 쉐어',
        },
      },
    },
    {
      id: 'AMR Gorai Rousing Reincarnation Collect',
      type: 'GainsEffect',
      netRegex: { effectId: ['E0D', 'E0E', 'E0F', 'E10', 'E11', 'E12', 'E13', 'E14'] },
      run: (data, matches) => {
        // Odder Incarnation = blue towers
        // Rodential Rebirth = orange towers
        // durations: I = 20s, II = 26s, III = 32s, IV = 38s
        const id = matches.effectId;
        if (id === 'E11')
          data.reincarnationCollect[0].blue = matches.target;
        else if (id === 'E0D')
          data.reincarnationCollect[0].orange = matches.target;
        else if (id === 'E12')
          data.reincarnationCollect[1].blue = matches.target;
        else if (id === 'E0E')
          data.reincarnationCollect[1].orange = matches.target;
        else if (id === 'E13')
          data.reincarnationCollect[2].blue = matches.target;
        else if (id === 'E0F')
          data.reincarnationCollect[2].orange = matches.target;
        else if (id === 'E14')
          data.reincarnationCollect[3].blue = matches.target;
        else if (id === 'E10')
          data.reincarnationCollect[3].orange = matches.target;
      },
    },
    {
      id: 'AMR Gorai Rousing Reincarnation First Tower',
      type: 'StartsUsing',
      // Malformed Prayer cast
      netRegex: { id: '8518', source: 'Gorai the Uncaged', capture: false },
      durationSeconds: 15,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        return towerResponse(data, output);
      },
    },
    {
      id: 'AMR Gorai Rousing Reincarnation Other Towers',
      type: 'Ability',
      // Technically 851F Pointed Purgation protean happens ~0.2s beforehand,
      // but wait on the tower burst to call things out.
      // 851B = Burst (blue tower)
      // 8519 = Burst (orange tower)
      // 851C = Dramatic Burst (missed tower)
      netRegex: { id: '851B', source: 'Gorai the Uncaged', capture: false },
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        return towerResponse(data, output);
      },
    },
    /*
    {
      id: 'AMR Gorai Fighting Spirits',
      type: 'StartsUsing',
      netRegex: { id: '852B', source: 'Gorai the Uncaged', capture: false },
      // this is also a light aoe but knockback is more important
      response: Responses.knockback('info'),
    },
    */
    {
      id: 'AMR Gorai Fighting Spirits Limit Cut',
      type: 'HeadMarker',
      netRegex: { id: limitCutIds },
      durationSeconds: 10, // FIXME
      alertText: (data, matches, output) => {
        if (matches.target !== data.me)
          return;
        let num = undefined;
        if (matches.id === headmarkers.limitCut1)
          num = output.num1!();
        else if (matches.id === headmarkers.limitCut2)
          num = output.num2!();
        else if (matches.id === headmarkers.limitCut3)
          num = output.num3!();
        else if (matches.id === headmarkers.limitCut4)
          num = output.num4!();
        else
          return;
        return output.text!({ num: num });
      },
      outputStrings: {
        num1: Outputs.num1,
        num2: Outputs.num2,
        num3: Outputs.num3,
        num4: Outputs.num4,
        text: {
          en: '${num}번',
        },
      },
    },
    // ---------------- 어드미 ----------------
    {
      id: 'AMR 사자 Stormcloud Summons',
      type: 'StartsUsing',
      netRegex: { id: '83F8', source: 'Shishio', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          check: {
            en: '구름 먹는거 확인!',
          },
          line1: {
            en: '빠른 빔 피해요!',
          },
          line2: {
            en: '굵은 빔 피해요!',
          },
        };

        data.prStornmclod = (data.prStornmclod ?? 0) + 1;
        if (data.prStornmclod === 1 || data.prStornmclod === 3)
          return { infoText: output.check!() };
        if (data.prStornmclod === 2)
          return { alertText: output.line1!() };
        if (data.prStornmclod === 4)
          return { alertText: output.line2!() };
      },
    },
    {
      id: 'AMR 사자 Noble Pursuit',
      type: 'StartsUsing',
      netRegex: { id: '8407', source: 'Shishio', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '돌진 안전한 곳 찾아요',
        },
      },
    },
    {
      id: 'AMR 사자 Unnatural Wail',
      type: 'StartsUsing',
      netRegex: { id: '8417', source: 'Shishio', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자기 자리로',
        },
      },
    },
    {
      id: 'AMR 사자 Haunting Cry',
      type: 'StartsUsing',
      netRegex: { id: '840A', source: 'Shishio', capture: false },
      infoText: (data, _matches, output) => {
        data.prHaunting = (data.prHaunting ?? 0) + 1;
        if (data.prHaunting === 1)
          return output.blue4!();
        else if (data.prHaunting === 2)
          return output.ghost!();
      },
      outputStrings: {
        blue4: {
          en: '파란색 네마리 나와요',
        },
        ghost: {
          en: '유령 나와요',
        },
      },
    },
    {
      id: 'AMR Gorai Thundercall',
      type: 'StartsUsing',
      netRegex: { id: '8520', source: 'Gorai the Uncaged', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '번개 구슬 처리',
        },
      },
    },
    {
      id: 'AMR Gorai Rousing Reincarnation',
      type: 'StartsUsing',
      netRegex: { id: '8512', source: 'Gorai the Uncaged', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '줄과 타워처리, 엉덩이로',
        },
      },
    },
    {
      id: 'AMR Gorai Fighting Spirits 넉백',
      type: 'StartsUsing',
      netRegex: { id: '852B', source: 'Gorai the Uncaged', capture: false },
      delaySeconds: 3,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백 조심!',
        },
      },
    },
    {
      id: 'AMR Gorai Fighting Spirits 스프린트',
      type: 'Ability',
      netRegex: { id: '852B', source: 'Gorai the Uncaged', capture: false },
      delaySeconds: 2,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '스프린트!',
        },
      },
    },
    {
      id: 'AMR Gorai 뭉쳐',
      type: 'GainsEffect',
      // E17 = Live Brazier (stack)
      netRegex: { effectId: 'E17' },
      condition: (data) => data.options.AutumnStyle,
      delaySeconds: (data, matches) => {
        if (data.sparksCount === 1)
          return parseFloat(matches.duration) - 3;
        if (data.sparksCount === 2)
          return parseFloat(matches.duration);
        return 0;
      },
      durationSeconds: 3,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.sparksCount === 1)
          return output.explosion!();
        if (data.sparksCount === 2 && data.prStackFirst)
          return output.spread!();
      },
      outputStrings: {
        explosion: {
          en: '곧 뭉치기가 터져요!',
        },
        spread: {
          en: '흩어져요! (엑사 피하면서)',
        },
      },
    },
    {
      id: 'AMR Gorai 흩어져',
      type: 'GainsEffect',
      // E18 = Live Candle (spread)
      netRegex: { effectId: 'E18' },
      condition: (data) => data.options.AutumnStyle,
      delaySeconds: (data, matches) => {
        if (data.sparksCount === 2)
          return parseFloat(matches.duration);
        return 0;
      },
      durationSeconds: 3,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.sparksCount === 2 && !data.prStackFirst)
          return output.stack!();
      },
      outputStrings: {
        stack: {
          en: '뭉쳐요! (엑사 피하면서)',
        },
      },
    },
    {
      id: 'AMR Moko Kenki Release',
      type: 'StartsUsing',
      netRegex: { id: '85E0', source: 'Moko the Restless', capture: false },
      response: Responses.aoe('alert'),
      run: (data) => {
        data.prGiri = 0;
        data.prTripleDir = [];
        data.prTripleColor = [];
      },
    },
    {
      id: 'AMR Moko Lateral Slice',
      type: 'StartsUsing',
      netRegex: { id: '85E3', source: 'Moko the Restless' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AMR Moko Scarlet Auspice',
      type: 'StartsUsing',
      netRegex: { id: '85D1', source: 'Moko the Restless', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'AMR Moko Invocation of Vengeance',
      type: 'StartsUsing',
      netRegex: { id: '85DB', source: 'Moko the Restless', capture: false },
      run: (data, _matches) => {
        data.prPhase = 'vengence';
        data.prGainCollect = [];
      },
    },
    {
      id: 'AMR Moko Vengeful Collect',
      type: 'GainsEffect',
      // E1A = spread
      // E1B = stack
      netRegex: { effectId: ['E1A', 'E1B'] },
      run: (data, matches) => data.prGainCollect.push(matches),
    },
    {
      id: 'AMR Moko Vengeful',
      type: 'GainsEffect',
      netRegex: { effectId: ['E1A', 'E1B'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: 10,
      suppressSeconds: 999999,
      infoText: (data, _matches, output) => {
        const stack = data.prGainCollect.find((x) => x.effectId === 'E1B');
        const spread = data.prGainCollect.find((x) => x.effectId === 'E1A');
        if (stack === undefined || spread === undefined)
          return;
        const stackTime = parseFloat(stack.duration);
        const spreadTime = parseFloat(spread.duration);
        data.prStackFirst = stackTime < spreadTime;

        if (data.prStackFirst)
          return output.stsp!();
        return output.spst!();
      },
      outputStrings: {
        stsp: {
          en: '먼저 뭉쳐요',
        },
        spst: {
          en: '먼저 흩어져요',
        },
      },
    },
    {
      id: 'AMR Moko Vengeful Flame',
      type: 'GainsEffect',
      netRegex: { effectId: 'E1A' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 7,
      suppressSeconds: 10,
      alarmText: (data, _matches, output) => {
        if (data.prStackFirst)
          return;
        if (data.role === 'tank')
          return output.tank!();
        if (data.role === 'healer')
          return output.healer!();
        return output.dps!();
      },
      outputStrings: {
        tank: {
          en: '힐러랑 뭉쳐요!',
        },
        healer: {
          en: '탱크랑 뭉쳐요!',
        },
        dps: {
          en: 'DPS끼리 뭉쳐요!',
        },
      },
    },
    {
      id: 'AMR Moko Vengeful Pyre',
      type: 'GainsEffect',
      netRegex: { effectId: 'E1B' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 7,
      suppressSeconds: 10,
      alarmText: (data, _matches, output) => {
        if (data.prStackFirst)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: '흩어져요!',
        },
      },
    },
    {
      id: 'AMR Moko Vengeance Rat and Mouse',
      type: 'GainsEffect',
      netRegex: { effectId: 'E19' },
      condition: (data, matches) => data.prPhase === 'vengence' && matches.target === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 줄! 칼 방향 확인!',
        },
      },
    },
    {
      id: 'AMR Moko Fleeting Iai-giri',
      type: 'StartsUsing',
      netRegex: { id: ['85C2', '85C6'], source: 'Moko the Restless', capture: false },
      suppressSeconds: 20,
      infoText: (_data, _matches, output) => {
        return output.findsafe!();
      },
      outputStrings: {
        findsafe: {
          en: '안전한 곳 찾아 이동',
        },
      },
    },
    {
      id: 'AMR Moko Shadow-twin',
      type: 'StartsUsing',
      netRegex: { id: '85C7', source: 'Moko the Restless', capture: false },
      infoText: (data, _matches, output) => {
        data.prShadowGiri = [];
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '쫄 두마리',
        },
      },
    },
    {
      id: 'AMR Moko Moonless Night',
      type: 'StartsUsing',
      netRegex: { id: '85DE', source: 'Moko the Restless', capture: false },
      run: (data) => {
        data.prPhase = 'moonless';
        data.prGainCollect = [];
        data.prFlag = false;
        data.prMoonTether = [];
      },
    },
    {
      id: 'AMR Moko Moonless 줄다리기',
      type: 'Tether',
      netRegex: { id: '0011' },
      condition: (data) => data.prPhase === 'moonless',
      run: (data, matches) => {
        const target = matches.target;
        data.prMoonTether.push(target);
        if (data.me === target) {
          data.prFlag = true;
          data.prSourceId = matches.sourceId;
        } else {
          if (data.role === 'tank' && data.party.isHealer(target))
            data.prSourceId = matches.sourceId;
          else if (data.role === 'healer' && data.party.isTank(target))
            data.prSourceId = matches.sourceId;
          else if (data.role === 'dps' && data.party.isDPS(target))
            data.prSourceId = matches.sourceId;
          /*
          else if (data.prSourceId === undefined)
            data.prSourceId = matches.sourceId;
          else if (!data.prFlag && parseInt(data.prSourceId, 16) < parseInt(matches.sourceId, 16))
            data.prSourceId = matches.sourceId;
          */
        }
      },
    },
    {
      id: 'AMR Moko Moonless 줄다리기 알림',
      type: 'Tether',
      netRegex: { id: '0011', capture: false },
      condition: (data) => data.prPhase === 'moonless',
      delaySeconds: 0.5,
      suppressSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tether: {
            en: '내게 줄! (${dest})',
          },
          tetheronly: {
            en: '내게 줄!',
          },
          notether: {
            en: '줄 없음',
          },
        };

        if (data.prFlag) {
          const left = data.prMoonTether.filter((x) => data.me !== x);
          if (left.length === 1)
            return { alertText: output.tether!({ dest: data.party.aJobName(left[0]) }) };
          return { alertText: output.tetheronly!() };
        }
        return { infoText: output.notether!() };
      },
    },
    {
      id: 'AMR Moko Near Edge',
      type: 'StartsUsing',
      netRegex: { id: '85D9', source: 'Moko the Restless', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          in: {
            en: '안쪽으로 (${giri})',
          },
          out: {
            en: '바깥쪽/바깥보기 (${giri})',
          },
          unknown: Outputs.unknown,
        };
        if (data.prShadowGiri.length === 0)
          data.prShadowGiri.push(output.unknown!());
        else if (data.prShadowGiri.length === 1)
          data.prShadowGiri.push('반대로');
        const giri = data.prShadowGiri.join(' => ');
        if (data.prFlag)
          return { alertText: output.out!({ giri: giri }) };
        return { infoText: output.in!({ giri: giri }) };
      },
      run: (data) => {
        data.prFlag = false;
        data.prMoonTether = [];
        data.prSourceId = undefined;
        data.prShadowGiri = [];
      },
    },
    {
      id: 'AMR Moko Far Edge',
      type: 'StartsUsing',
      netRegex: { id: '85D8', source: 'Moko the Restless', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          in: {
            en: '안쪽/안쪽보기 (${giri})',
          },
          out: {
            en: '바깥쪽으로 (${giri})',
          },
          unknown: Outputs.unknown,
        };
        if (data.prShadowGiri.length === 0)
          data.prShadowGiri.push(output.unknown!());
        else if (data.prShadowGiri.length === 1)
          data.prShadowGiri.push('반대로');
        const giri = data.prShadowGiri.join(' => ');
        if (data.prFlag)
          return { alertText: output.in!({ giri: giri }) };
        return { infoText: output.out!({ giri: giri }) };
      },
      run: (data) => {
        data.prFlag = false;
        data.prMoonTether = [];
        data.prSourceId = undefined;
        data.prShadowGiri = [];
      },
    },
    {
      id: 'AMR Moko Moko\'s Shadow',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', capture: true },
      durationSeconds: 1,
      infoText: (data, matches, output) => {
        if (matches.targetId !== data.prSourceId)
          return;
        const cCount: { [id: string]: string } = {
          '248': output.front!(),
          '249': output.right!(),
          '24A': output.left!(),
          '24B': output.left!(),
        };
        const where = cCount[matches.count];
        if (where !== undefined && !data.prShadowGiri.includes(where)) {
          data.prShadowGiri.push(where);
          return;
        }
        return output.unk!({ num: matches.count });
      },
      outputStrings: {
        front: {
          en: '뒤로',
        },
        back: {
          en: '앞으로',
        },
        left: {
          en: '오른쪽',
        },
        right: {
          en: '왼쪽',
        },
        unk: {
          en: '모르는 방향: ${num}',
        },
      },
    },
    {
      id: 'AMR Moko Azure Auspice',
      type: 'StartsUsing',
      netRegex: { id: '85D4', source: 'Moko the Restless', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'AMR Moko Soldiers of Death',
      type: 'StartsUsing',
      netRegex: { id: '8593', source: 'Moko the Restless', capture: false },
      alertText: (_data, _matches, output) => {
        // 선 달린 사람이 바깥쪽
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '파란 쫄 찾아요',
        },
      },
    },
    {
      id: 'AMR Moko Triple Kasumi-giri',
      type: 'StartsUsing',
      netRegex: { id: giriIds, source: 'Moko the Restless' },
      run: (data, matches) => {
        const angle = giriAngles[matches.id];
        if (angle === undefined)
          return;
        data.prGiri = calcGiri(data.prGiri, angle);
        data.prTripleDir.push(data.prGiri);
      },
    },
    {
      id: 'AMR Moko Unbound Spirit',
      type: 'Ability',
      netRegex: { id: '85B8', source: 'Moko the Restless', capture: false },
      infoText: (data, _matches, output) => {
        data.prTripleColor.push(true);
        if (data.prTripleDir.length < 3) {
          const mark = giriToSafe(data.prGiri);
          if (mark !== undefined)
            return output.text!({ mark: mark });
          return output.unk!({ angle: data.prGiri });
        }
        const mark = data.prTripleDir.map((x) => giriToSafe(x));
        const safe = data.prTripleColor.map((x) => x ? '밖' : '안');
        const mesg = output.whole!({
          m1: mark[0],
          s1: safe[0],
          m2: mark[1],
          s2: safe[1],
          m3: mark[2],
          s3: safe[2],
        });
        data.prTripleDir = [];
        data.prTripleColor = [];
        return mesg;
      },
      outputStrings: {
        text: {
          en: '(${mark}밖)',
        },
        whole: {
          en: '${m1}${s1} => ${m2}${s2} => ${m3}${s3}',
        },
        unk: {
          en: '(몰루: ${angle}도)',
        },
      },
    },
    {
      id: 'AMR Moko Azure Coil',
      type: 'Ability',
      netRegex: { id: '85B9', source: 'Moko the Restless', capture: false },
      infoText: (data, _matches, output) => {
        data.prTripleColor.push(false);
        if (data.prTripleDir.length < 3) {
          const mark = giriToSafe(data.prGiri);
          if (mark !== undefined)
            return output.text!({ mark: mark });
          return output.unk!({ angle: data.prGiri });
        }
        const mark = data.prTripleDir.map((x) => giriToSafe(x));
        const safe = data.prTripleColor.map((x) => x ? '밖' : '안');
        const mesg = output.whole!({
          m1: mark[0],
          s1: safe[0],
          m2: mark[1],
          s2: safe[1],
          m3: mark[2],
          s3: safe[2],
        });
        data.prTripleDir = [];
        data.prTripleColor = [];
        return mesg;
      },
      outputStrings: {
        text: {
          en: '(${mark}안)',
        },
        whole: {
          en: '${m1}${s1} => ${m2}${s2} => ${m3}${s3}',
        },
        unk: {
          en: '(몰루: ${angle}도)',
        },
      },
    },
    {
      id: 'AMR Moko Boundless Azure',
      type: 'StartsUsing',
      netRegex: { id: '859D', source: 'Moko the Restless', capture: false },
      response: Responses.goSides(),
    },
  ],
  timelineReplace: [
    {
      locale: 'en',
      replaceText: {
        'Unnatural Ailment/Unnatural Force': 'Unnatural Ailment/Force',
        'Unnatural Force/Unnatural Ailment': 'Unnatural Force/Ailment',
        'Eye of the Thunder Vortex/Vortex of the Thunder Eye': 'Thunder Eye/Vortex',
        'Vortex of the Thunder Eye/Eye of the Thunder Vortex': 'Thunder Vortex/Eye',
        'Greater Ball of Fire/Great Ball of Fire': 'Great/Greater Ball of Fire',
        'Great Ball of Fire/Greater Ball of Fire': 'Greater/Great Ball of Fire',
      },
    },
  ],
};

export default triggerSet;
