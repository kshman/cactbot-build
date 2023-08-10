import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import PartyTracker from '../../../../../resources/party';
import { Responses } from '../../../../../resources/responses';
import Util, { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { Role } from '../../../../../types/job';
import { NetMatches } from '../../../../../types/net_matches';
import { Output, ResponseOutput, TriggerSet } from '../../../../../types/trigger';

const headmarkers = {
  // vfx/lockon/eff/sph_lockon2_num01_s8p.avfx (through sph_lockon2_num04_s8p)
  limitCut1: '0150',
  limitCut2: '0151',
  limitCut3: '0152',
  limitCut4: '0153',
} as const;
const limitCutIds: readonly string[] = Object.values(headmarkers);

type OdderTower = {
  blue?: string;
  orange?: string;
};

type MalformedInfo = {
  d1?: boolean;
  d3?: boolean;
};

const kasumiGiriMap: { [count: string]: number } = {
  '24C': 0,
  '24D': 90,
  '24E': 180,
  '24F': 270,
  '250': 0,
  '251': 90,
  '252': 180,
  '253': 270,
} as const;
const kasumiGiriMapCounts: readonly string[] = Object.keys(kasumiGiriMap);

type KasumiGiriInfo = {
  mark: string;
  outside: boolean;
};

type ShadowGiriInfo = {
  id: string;
  cnt: string;
  mesg: string;
};

export interface Data extends RaidbossData {
  prHaunting?: number;
  prStormclouds?: number;
  prSmokeater?: number;
  prStackFirst?: boolean;
  prPartner?: string;
  prDevilishCount: number;
  prMalformed: { [name: string]: MalformedInfo };
  prVengefulCollect: NetMatches['GainsEffect'][];
  prTetherCollect: string[];
  prTetherFrom?: string;
  prHaveTether?: boolean;
  prKasumiCount: number;
  prKasumiAngle: number;
  prKasumiGiri: KasumiGiriInfo[];
  prShadowTether: number;
  prShadowGiri: ShadowGiriInfo[];
  readonly triggerSetConfig: {
    prGoraiTower: 'hamukatsu' | 'poshiume';
  };
  //
  combatantData: PluginCombatantState[];
  wailingCollect: NetMatches['GainsEffect'][];
  wailCount: number;
  sparksCollect: NetMatches['GainsEffect'][];
  sparksCount: number;
  reincarnationCollect: [OdderTower, OdderTower, OdderTower, OdderTower];
  towerCount: number;
  devilishThrallCollect: NetMatches['StartsUsing'][];
}

const findPlayerByRole = (role: Role, data: Data): string => {
  const collect = role === 'tank'
    ? data.party.tankNames
    : role === 'healer'
    ? data.party.healerNames
    : data.party.dpsNames;
  const [target] = collect.filter((x) => x !== data.me);
  return target === undefined ? 'unknown' : target;
};
const findDpsWithPrior = (prior: boolean, party: PartyTracker): string => {
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
const findStackPartner = (data: Data, stack1: string, stack2: string): string | undefined => {
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
      return findDpsWithPrior(true, data.party);
    return findPlayerByRole('healer', data);
  } else if (data.role === 'healer') {
    if (data.party.isTank(same))
      return findDpsWithPrior(false, data.party);
    return findPlayerByRole('tank', data);
  }
  if (data.party.isTank(same) || data.party.isHealer(same))
    return findPlayerByRole('dps', data);
  const prior = findDpsWithPrior(true, data.party);
  if (prior === data.me)
    return findPlayerByRole('tank', data);
  return findPlayerByRole('healer', data);
};
const buildStackPartner = (
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
  data.prStackFirst = stackTime < spreadTime;
  data.prPartner = findStackPartner(data, stack1.target, stack2.target);
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
  id: 'AnotherMountRokkonSavage',
  zoneId: ZoneId.AnotherMountRokkonSavage,
  config: [
    {
      id: 'prGoraiTower',
      name: {
        en: '고라이 탑 설치',
      },
      type: 'select',
      options: {
        en: {
          '하므까스(맵기준)': 'hamukatsu',
          '포시우메(보스기준)': 'poshiume',
        },
      },
      default: 'poshiume',
    },
  ],
  timelineFile: 'another_mount_rokkon-savage.txt',
  initData: () => {
    return {
      prDevilishCount: 0,
      prMalformed: {},
      prVengefulCollect: [],
      prTetherCollect: [],
      prKasumiCount: 0,
      prKasumiAngle: 0,
      prKasumiGiri: [],
      prShadowTether: 0,
      prShadowGiri: [],
      //
      combatantData: [],
      wailingCollect: [],
      wailCount: 0,
      sparksCollect: [],
      sparksCount: 0,
      reincarnationCollect: [{}, {}, {}, {}],
      towerCount: 0,
      devilishThrallCollect: [],
    };
  },
  triggers: [
    // ---------------- first trash ----------------
    {
      id: 'AMRS Shishu Raiko Disciples of Levin',
      type: 'StartsUsing',
      netRegex: { id: '8668', source: 'Shishu Raiko', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'AMRS Shishu Furutsubaki Bloody Caress',
      type: 'StartsUsing',
      netRegex: { id: '8669', source: 'Shishu Furutsubaki', capture: false },
      suppressSeconds: 5,
      response: Responses.getBehind('info'),
    },
    {
      id: 'AMRS Shishu Raiko Barreling Smash',
      type: 'StartsUsing',
      netRegex: { id: '8665', source: 'Shishu Raiko' },
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
      id: 'AMRS Shishu Raiko Howl',
      type: 'StartsUsing',
      netRegex: { id: '8666', source: 'Shishu Raiko', capture: false },
      response: Responses.bleedAoe('info'),
    },
    {
      id: 'AMRS Shishu Raiko Master of Levin',
      type: 'StartsUsing',
      netRegex: { id: '8667', source: 'Shishu Raiko', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'AMRS Shishu Fuko Scythe Tail',
      type: 'StartsUsing',
      netRegex: { id: '866C', source: 'Shishu Raiko', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'AMRS Shishu Fuko Twister',
      type: 'StartsUsing',
      netRegex: { id: '866A', source: 'Shishu Raiko' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'AMRS Shishu Fuko Crosswind',
      type: 'StartsUsing',
      netRegex: { id: '866B', source: 'Shishu Raiko', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'AMRS Shishu Yuki Right Swipe',
      type: 'StartsUsing',
      netRegex: { id: '8688', source: 'Shishu Yuki', capture: false },
      response: Responses.goLeft('info'),
    },
    {
      id: 'AMRS Shishu Yuki Left Swipe',
      type: 'StartsUsing',
      netRegex: { id: '8689', source: 'Shishu Yuki', capture: false },
      response: Responses.goRight('info'),
    },
    // ---------------- Shishio ----------------
    {
      id: 'AMRS Shishio Enkyo',
      type: 'StartsUsing',
      netRegex: { id: '8441', source: 'Shishio', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'AMRS Shishio Stormcloud Summons',
      type: 'StartsUsing',
      netRegex: { id: '841F', source: 'Shishio', capture: false },
      alertText: (data, _matches, output) => {
        data.prStormclouds = (data.prStormclouds ?? 0) + 1;
        data.prSmokeater = 0;
        if (data.prStormclouds === 2)
          return output.line1!();
        if (data.prStormclouds === 4)
          return output.line2!();
      },
      outputStrings: {
        line1: {
          en: '빠른 빔 피해요!',
        },
        line2: {
          en: '굵은 빔 피해요!',
        },
      },
    },
    {
      id: 'AMRS Shishio Smokeater',
      type: 'Ability',
      netRegex: { id: ['8420', '8421'], source: 'Shishio', capture: false },
      run: (data) => data.prSmokeater = (data.prSmokeater ?? 0) + 1,
    },
    {
      id: 'AMRS Shishio Rokujo Revel',
      type: 'StartsUsing',
      netRegex: { id: '8423', source: 'Shishio', capture: false },
      durationSeconds: 7,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          c1: {
            en: '구름 없는 장판쪽 => 돌면서 한가운데',
          },
          c2: {
            en: '구름 없는 첫 장판쪽 => 돌면서 한가운데',
          },
          c3: {
            en: '구름 한개 반대족 => 오른쪽 달려',
          },
          cs: {
            en: '구름 ${num}번 먹었네',
          },
        };
        const smokes = { alertText: output.cs!({ num: data.prSmokeater }) };
        if (data.prSmokeater === 1)
          return { ...smokes, infoText: output.c1!() };
        if (data.prSmokeater === 2)
          return { ...smokes, infoText: output.c2!() };
        if (data.prSmokeater === 3)
          return { ...smokes, infoText: output.c3!() };
        return smokes;
      },
    },
    {
      id: 'AMRS Shishio Noble Pursuit',
      type: 'StartsUsing',
      netRegex: { id: '842E', source: 'Shishio', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '돌진: 안전한 곳 찾아요',
        },
      },
    },
    {
      id: 'AMRS Shishio Splitting Cry',
      type: 'StartsUsing',
      netRegex: { id: '8442', source: 'Shishio' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AMRS Shishio Splitter',
      type: 'Ability',
      // This comes out ~4s after Splitting Cry.
      netRegex: { id: '8442', source: 'Shishio', capture: false },
      condition: (data) => data.role !== 'tank',
      suppressSeconds: 5,
      response: Responses.goFrontOrSides('info'),
    },
    {
      id: 'AMRS Shishio Unnatural Wail',
      type: 'StartsUsing',
      netRegex: { id: '843E', source: 'Shishio', capture: false },
      run: (data) => {
        data.wailCount++;
        data.wailingCollect = [];
        delete data.prStackFirst;
        delete data.prPartner;
      },
    },
    {
      id: 'AMRS Shishio Wailing Collect',
      type: 'GainsEffect',
      // DEB = Scattered Wailing (spread)
      // DEC = Intensified Wailing (stack)
      netRegex: { effectId: ['DEB', 'DEC'], source: 'Shishio' },
      run: (data, matches) => data.wailingCollect.push(matches),
    },
    {
      id: 'AMRS Shishio Unnatural Wailing 1',
      type: 'GainsEffect',
      netRegex: { effectId: ['DEB', 'DEC'], source: 'Shishio', capture: false },
      condition: (data) => data.wailCount === 1,
      delaySeconds: 0.5,
      suppressSeconds: 999999,
      alertText: (data, _matches, output) => {
        buildStackPartner(data, data.wailingCollect, 'DEC', 'DEB');
        return data.prStackFirst ? output.stack!() : output.spread!();
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
      id: 'AMRS Shishio Devilish Thrall Collect',
      type: 'StartsUsing',
      // 8432 = Right Swipe
      // 8433 = Left Swipe
      netRegex: { id: ['8432', '8433'], source: 'Devilish Thrall' },
      run: (data, matches) => data.devilishThrallCollect.push(matches),
    },
    {
      id: 'AMRS Shishio Devilish Thrall Safe Spot',
      type: 'StartsUsing',
      netRegex: { id: ['8432', '8433'], source: 'Devilish Thrall', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 7,
      suppressSeconds: 1,
      promise: async (data: Data) => {
        data.combatantData = [];

        const ids = data.devilishThrallCollect.map((x) => parseInt(x.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length !== 4)
          return;
        const centerX = 0;
        const centerY = -100;

        // Intercard thralls:
        //   x = 0 +/- 10
        //   y = -100 +/- 10
        //   heading = intercards (pi/4 + pi/2 * n)
        // Cardinal thralls:
        //   x = 0 +/- 12
        //   y = -100 +/- 12
        //   heading = cardinals (pi/2 * n)

        // One is a set of four on cardinals, the others a set of 4 on intercards.
        // There seems to be only one pattern of thralls, rotated.
        // Two are pointed inward (direct opposite to their position)
        // and two are pointed outward (perpendicular to their position).
        // Because of this, no need to check left/right cleave as position and directions tell all.
        const states = data.combatantData.map((combatant) => {
          return {
            dir: Directions.combatantStatePosTo8Dir(combatant, centerX, centerY),
            heading: Directions.combatantStateHdgTo8Dir(combatant),
          };
        });
        const outwardStates = states.filter((state) => state.dir !== (state.heading + 4) % 8);
        const [pos1, pos2] = outwardStates.map((x) => x.dir).sort();
        if (pos1 === undefined || pos2 === undefined || outwardStates.length !== 2)
          return;

        // The one case where the difference is 6 instead of 2.
        const averagePos = (pos1 === 0 && pos2 === 6) ? 7 : Math.floor((pos2 + pos1) / 2);
        const args = {
          position: {
            0: output.north!(),
            1: output.northeast!(),
            2: output.east!(),
            3: output.southeast!(),
            4: output.south!(),
            5: output.southwest!(),
            6: output.west!(),
            7: output.northwest!(),
          }[averagePos],
          partner: data.party.aJobName(data.prPartner),
        };
        if (data.prDevilishCount === 0) {
          if (data.prStackFirst)
            return output.stack!(args);
          return output.spread!(args);
        }
        if (data.prStackFirst)
          return output.spread!(args);
        return output.stack!(args);
      },
      run: (data) => {
        data.prDevilishCount++;
        data.devilishThrallCollect = [];
      },
      outputStrings: {
        north: {
          en: 'Ⓐ',
        },
        east: {
          en: 'Ⓑ',
        },
        south: {
          en: 'Ⓒ',
        },
        west: {
          en: 'Ⓓ',
        },
        northeast: {
          en: '①',
        },
        southeast: {
          en: '②',
        },
        southwest: {
          en: '③',
        },
        northwest: {
          en: '④',
        },
        spread: {
          en: '${position} 흩어져요(${partner})',
        },
        stack: {
          en: '${position} 뭉쳐요(${partner})',
        },
      },
    },
    {
      id: 'AMRS Shishio Vortex of the Thunder Eye',
      type: 'StartsUsing',
      // 843A = Eye of the Thunder Vortex (out)
      // 843C = Vortex of the Thnder Eye (in)
      netRegex: { id: ['843A', '843C'], source: 'Shishio' },
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        buildStackPartner(data, data.wailingCollect, 'DEC', 'DEB');
        const isInFirst = matches.id === '843C';
        const inOut = isInFirst ? output.in!() : output.out!();
        const outIn = isInFirst ? output.out!() : output.in!();
        const args = { inOut: inOut, outIn: outIn, partner: data.party.aJobName(data.prPartner) };
        if (data.prStackFirst)
          return output.stack!(args);
        return output.spread!(args);
      },
      outputStrings: {
        out: '[밖]', // Outputs.out,
        in: '[안]', // Outputs.in,
        stack: {
          en: '${inOut} 뭉쳤다(${partner}) => ${outIn} 흩어져요',
        },
        spread: {
          en: '${inOut} 흩어졌다 => ${outIn} 뭉쳐요(${partner})',
        },
      },
    },
    {
      id: 'AMRS Shishio Thunder Vortex',
      type: 'StartsUsing',
      netRegex: { id: '8439', source: 'Shishio', capture: false },
      response: Responses.getUnder(),
    },
    // ---------------- second trash ----------------
    {
      id: 'AMRS Shishu Kotengu Backward Blows',
      type: 'StartsUsing',
      netRegex: { id: '866E', source: 'Shishu Kotengu', capture: false },
      durationSeconds: 5.7,
      response: Responses.goSides(),
    },
    {
      id: 'AMRS Shishu Kotengu Leftward Blows',
      type: 'StartsUsing',
      netRegex: { id: '866F', source: 'Shishu Kotengu', capture: false },
      durationSeconds: 5.7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '오른쪽 + 뒤로',
        },
      },
    },
    {
      id: 'AMRS Shishu Kotengu Rightward Blows',
      type: 'StartsUsing',
      netRegex: { id: '8670', source: 'Shishu Kotengu', capture: false },
      durationSeconds: 5.7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽 + 뒤로',
        },
      },
    },
    {
      id: 'AMRS Shishu Kotengu Wrath of the Tengu',
      type: 'StartsUsing',
      netRegex: { id: '8672', source: 'Shishu Kotengu', capture: false },
      response: Responses.bleedAoe('alert'),
    },
    {
      id: 'AMRS Shishu Kotengu Gaze of the Tengu',
      type: 'StartsUsing',
      netRegex: { id: '8673', source: 'Shishu Kotengu', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'AMRS Shishu Onmitsugashira Juji Shuriken',
      type: 'StartsUsing',
      netRegex: { id: '8676', source: 'Shishu Onmitsugashira', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'AMRS Shishu Onmitsugashira Issen',
      type: 'StartsUsing',
      netRegex: { id: '8674', source: 'Shishu Onmitsugashira' },
      response: Responses.tankBuster(),
    },
    // ---------------- Gorai the Uncaged ----------------
    {
      id: 'AMRS Gorai Unenlightenment',
      type: 'StartsUsing',
      netRegex: { id: '8534', source: 'Gorai the Uncaged', capture: false },
      response: Responses.bleedAoe('info'),
      run: (data) => {
        delete data.prStackFirst;
        delete data.prPartner;
      },
    },
    {
      id: 'AMRS Gorai Sparks Count',
      type: 'StartsUsing',
      netRegex: { id: '8503', source: 'Gorai the Uncaged', capture: false },
      run: (data) => {
        data.sparksCount++;
        data.sparksCollect = [];
      },
    },
    {
      id: 'AMRS Gorai Sparks Collect',
      type: 'GainsEffect',
      // E17 = Live Brazier (stack)
      // E18 = Live Candle (spread)
      netRegex: { effectId: ['E17', 'E18'] },
      run: (data, matches) => data.sparksCollect.push(matches),
    },
    {
      id: 'AMRS Gorai Seal of Scurrying Sparks Odd',
      type: 'GainsEffect',
      netRegex: { effectId: ['E17', 'E18'], capture: false },
      condition: (data) => data.sparksCount % 2 === 1,
      delaySeconds: 0.5,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        const [stack1, stack2] = data.sparksCollect.filter((x) => x.effectId === 'E17');
        if (stack1 === undefined || stack2 === undefined)
          return;
        const partner = findStackPartner(data, stack1.target, stack2.target);
        if (partner === undefined) {
          if (data.role === 'tank')
            return output.stackHealer!();
          if (data.role === 'healer')
            return output.stackTank!();
          return output.stackDps!();
        }
        return output.stack!({ partner: data.party.aJobName(partner) });
      },
      outputStrings: {
        stack: {
          en: '뭉쳐요(${partner})',
        },
        stackTank: {
          en: '탱크랑 뭉쳐요',
        },
        stackHealer: {
          en: '힐러랑 뭉쳐요',
        },
        stackDps: {
          en: 'DPS랑 뭉쳐요',
        },
      },
    },
    {
      id: 'AMRS Gorai Brazen Ballad',
      type: 'StartsUsing',
      netRegex: { id: ['8509', '850A'], source: 'Gorai the Uncaged', capture: true },
      durationSeconds: 4,
      alertText: (_data, matches, output) => {
        if (matches.id === '850A')
          return output.blue!();
        return output.red!();
      },
      outputStrings: {
        blue: {
          en: '🟦파랑: 즉, 가짜',
        },
        red: {
          en: '🟥빨강: 즉, 진짜',
        },
      },
    },
    {
      id: 'AMRS Gorai Seal of Scurrying Sparks 2',
      type: 'GainsEffect',
      netRegex: { effectId: ['E17', 'E18'], capture: false },
      condition: (data) => data.sparksCount === 2,
      delaySeconds: 0.5,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        buildStackPartner(data, data.sparksCollect, 'E17', 'E18');
        if (data.prStackFirst)
          return output.stack!({ partner: data.party.aJobName(data.prPartner) });
        return output.spread!({ partner: data.party.aJobName(data.prPartner) });
      },
      outputStrings: {
        stack: {
          en: '뭉쳤다(${partner}) => 흩어져요',
        },
        spread: {
          en: '흩어졌다 => 뭉쳐요(${partner})',
        },
      },
    },
    {
      id: 'AMRS Gorai Live Brazier Stack',
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
      id: 'AMRS Gorai Live Candle Spread',
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
      id: 'AMRS Gorai Torching Torment',
      type: 'StartsUsing',
      netRegex: { id: '8532', source: 'Gorai the Uncaged' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AMRS Gorai Impure Purgation First Hit',
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
      id: 'AMRS Gorai Impure Purgation Second Hit',
      type: 'StartsUsing',
      netRegex: { id: '8553', source: 'Gorai the Uncaged', capture: false },
      durationSeconds: 3,
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
    {
      id: 'AMRS Gorai Thundercall',
      type: 'StartsUsing',
      netRegex: { id: '8520', source: 'Gorai the Uncaged', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '번개 구슬',
        },
      },
    },
    {
      id: 'AMRS Gorai Humble Hammer',
      type: 'StartsUsing',
      netRegex: { id: '854B', source: 'Gorai the Uncaged' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '모서리 번개 구슬 몸통 박치기',
        },
      },
    },
    {
      id: 'AMRS Gorai Flintlock',
      type: 'Ability',
      // Trigger this on Humble Hammer damage
      netRegex: { id: '854B', source: 'Gorai the Uncaged', capture: false },
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
      id: 'AMRS Gorai Rousing Reincarnation',
      type: 'StartsUsing',
      netRegex: { id: '8512', source: 'Gorai the Uncaged', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '엉덩이로, 줄과 타워처리',
        },
      },
    },
    {
      id: 'AMRS Gorai Rousing Reincarnation Collect',
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
      id: 'AMRS Gorai Rousing Reincarnation First Tower',
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
      id: 'AMRS Gorai Rousing Reincarnation Other Towers',
      type: 'Ability',
      // Technically 851F Pointed Purgation protean happens ~0.2s beforehand,
      // but wait on the tower burst to call things out.
      // 8546 = Burst (blue tower)
      // 8544 = Burst (orange tower)
      // 8545 = Dramatic Burst (missed tower)
      // 8548 = Pointed Purgation (tether)
      netRegex: { id: '8546', source: 'Gorai the Uncaged', capture: false },
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        return towerResponse(data, output);
      },
    },
    {
      id: 'AMRS Gorai Fighting Spirits',
      type: 'StartsUsing',
      netRegex: { id: '852B', source: 'Gorai the Uncaged', capture: false },
      // this is also a light aoe but knockback is more important
      response: Responses.knockback('info'),
    },
    {
      id: 'AMRS Gorai Fighting Spirits Limit Cut',
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
    {
      id: 'AMRS Gorai Fighting Spirits Limit Cut 4',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.limitCut4 },
      condition: (data, matches) => matches.target === data.me,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'D로 먼저 가야해',
        },
      },
    },
    {
      id: 'AMRS Gorai Malformed Reincarnation',
      type: 'StartsUsing',
      netRegex: { id: '8514', source: 'Gorai the Uncaged', capture: false },
      run: (data) => data.prMalformed = {}, // 굳이 필요할까? 한번만 하는데
    },
    {
      id: 'AMRS Gorai Malformed Reincarnation Debuff',
      type: 'GainsEffect',
      // E0D = Rodential Rebirth#1 / 빨강
      // E0E = Rodential Rebirth#2 / 빨강
      // E0F = Rodential Rebirth#3 / 빨강
      // E11 = Odder Incarnation#1 / 파랑
      // E12 = Odder Incarnation#2 / 파랑
      // E13 = Odder Incarnation#3 / 파랑
      netRegex: { effectId: ['E0D', 'E0F', 'E11', 'E13'] },
      condition: (data) => data.options.AutumnStyle,
      run: (data, matches) => {
        if (data.prMalformed[matches.target] === undefined)
          data.prMalformed[matches.target] = {};
        switch (matches.effectId) {
          case 'E0D':
            data.prMalformed[matches.target]!.d1 = true;
            break;
          case 'E0F':
            data.prMalformed[matches.target]!.d3 = true;
            break;
          case 'E11':
            data.prMalformed[matches.target]!.d1 = false;
            break;
          case 'E13':
            data.prMalformed[matches.target]!.d3 = false;
            break;
        }
      },
    },
    {
      id: 'AMRS Gorai Malformed Reincarnation Action',
      type: 'GainsEffect',
      // E15 = Squirrelly Prayer / 빨강 다람쥐
      // E16 = Odder Prayer / 파랑 버섯
      netRegex: { effectId: ['E15', 'E16'], capture: false },
      delaySeconds: 3,
      durationSeconds: (data) => {
        if (data.triggerSetConfig.prGoraiTower === 'hamukatsu')
          return 13;
        if (data.triggerSetConfig.prGoraiTower === 'poshiume')
          return 13;
        return 8;
      },
      suppressSeconds: 99999,
      infoText: (data, _matches, output) => {
        const me = data.prMalformed[data.me];
        if (me === undefined || me.d1 === undefined || me.d3 === undefined)
          return;
        const issame = me.d1 === me.d3; // 세개가 같은거임
        if (data.triggerSetConfig.prGoraiTower === 'hamukatsu') {
          // 하므까스
          if (issame) {
            if (me.d1)
              return output.sameRight!();
            return output.sameLeft!();
          }
          const hassame = Object.entries(data.prMalformed)
            .find((x) => x[1].d1 === x[1].d3) !== undefined;
          if (hassame) {
            if (me.d1)
              return output.southRight!();
            return output.southLeft!();
          }
          if (me.d1)
            return output.right!();
          return output.left!();
        } else if (data.triggerSetConfig.prGoraiTower === 'poshiume') {
          // 포시우메
          const isred = me.d1;
          if (issame)
            return isred ? output.sameBlue!() : output.sameRed!();
          const hassame = Object.entries(data.prMalformed)
            .find((x) => x[1].d1 === x[1].d3) !== undefined;
          if (hassame)
            return isred ? output.diffBlue!() : output.diffRed!();
          return isred ? output.blue!() : output.red!();
        }
        // 멍미
        return '오노';
      },
      outputStrings: {
        left: {
          en: '모두 다른🟦: 왼쪽으로',
        },
        right: {
          en: '모두 다른🟥: 오른쪽으로',
        },
        sameLeft: {
          en: '[북] 같은🟦: 왼쪽으로',
        },
        sameRight: {
          en: '[북] 같은🟥: 오른쪽으로',
        },
        southLeft: {
          en: '[남] 다른🟦: 왼쪽으로',
        },
        southRight: {
          en: '[남] 다른🟥: 오른쪽으로',
        },
        blue: {
          en: '모두 다름: 🟦으로',
        },
        red: {
          en: '모두 다름: 🟥으로',
        },
        diffBlue: {
          en: '다름: 🟦오른쪽으로',
        },
        diffRed: {
          en: '다름: 🟥왼쪽으로',
        },
        sameBlue: {
          en: '같음: 🟦왼쪽으로',
        },
        sameRed: {
          en: '같음: 🟥오른쪽으로',
        },
        unknown: Outputs.unknown,
      },
    },
    // ---------------- Moko ----------------
    {
      id: 'AMRS Moko Kenki Release',
      type: 'StartsUsing',
      netRegex: { id: '860C', source: 'Moko the Restless', capture: false },
      response: Responses.aoe('alert'),
    },
    {
      id: 'AMRS Moko Lateral Slice',
      type: 'StartsUsing',
      netRegex: { id: '860D', source: 'Moko the Restless' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AMRS Moko Scarlet Auspice',
      type: 'StartsUsing',
      netRegex: { id: '8600', source: 'Moko the Restless', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'AMRS Moko Invocation of Vengeance',
      type: 'StartsUsing',
      netRegex: { id: '85DB', source: 'Moko the Restless', capture: false },
      run: (data, _matches) => {
        delete data.prStackFirst;
        data.prVengefulCollect = []; // 사실 할 필요 없다
      },
    },
    {
      id: 'AMRS Moko Vengeful Collect',
      type: 'GainsEffect',
      // E1A = spread
      // E1B = stack
      netRegex: { effectId: ['E1A', 'E1B'] },
      run: (data, matches) => data.prVengefulCollect.push(matches),
    },
    {
      id: 'AMRS Moko Vengeful',
      type: 'GainsEffect',
      netRegex: { effectId: ['E1A', 'E1B'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: 10,
      suppressSeconds: 999999,
      infoText: (data, _matches, output) => {
        const stack = data.prVengefulCollect.find((x) => x.effectId === 'E1B');
        const spread = data.prVengefulCollect.find((x) => x.effectId === 'E1A');
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
          en: '먼저 뭉쳐요 (외곽 조심)',
        },
        spst: {
          en: '먼저 흩어져요 (외곽 조심)',
        },
      },
    },
    {
      id: 'AMRS Moko Vengeful Flame',
      type: 'GainsEffect',
      netRegex: { effectId: 'E1A' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 7,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.prStackFirst)
          return;
        if (data.role === 'tank')
          return output.tank!();
        if (data.role === 'healer')
          return output.healer!();
        return output.dps!();
      },
      run: (data) => data.prVengefulCollect = [],
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
      id: 'AMRS Moko Vengeful Pyre',
      type: 'GainsEffect',
      netRegex: { effectId: 'E1B' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 7,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.prStackFirst)
          return output.text!();
      },
      run: (data) => data.prVengefulCollect = [],
      outputStrings: {
        text: {
          en: '흩어져요!',
        },
      },
    },
    {
      id: 'AMRS Moko Vengeance Tether',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Moko the Restless' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tether: {
            en: '내게 줄! 칼 방향 확인!',
          },
          notether: {
            en: '줄없음 (${target})',
          },
        };

        if (matches.target === data.me) {
          data.prHaveTether = true;
          return { alertText: output.tether!() };
        }
        const target = data.party.aJobName(matches.target);
        return { infoText: output.notether!({ target: target }) };
      },
    },
    {
      id: 'AMRS Moko Azure Auspice',
      type: 'StartsUsing',
      netRegex: { id: '8603', source: 'Moko the Restless', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안으로 => 옆으로',
        },
      },
    },
    {
      id: 'AMRS Moko Boundless Azure',
      type: 'StartsUsing',
      netRegex: { id: '859D', source: 'Moko the Restless', capture: false },
      response: Responses.goSides(),
    },
    {
      // 테스트 안됨
      id: 'AMRS Moko Soldiers of Death',
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
      id: 'AMRS Moko Moonless Night',
      type: 'StartsUsing',
      netRegex: { id: '860A', source: 'Moko the Restless', capture: false },
      run: (data) => {
        // 뒤에 나올꺼 초기화
        data.prTetherCollect = [];
        delete data.prHaveTether;
      },
    },
    {
      id: 'AMRS Moko Near/Far Edge',
      type: 'StartsUsing',
      // 85D8 NEAR
      // 85D9 FAR
      netRegex: { id: ['85D8', '85D9'], source: 'Moko the Restless' },
      alertText: (data, matches, output) => {
        if (matches.id === '85D8') {
          if (data.prHaveTether)
            return output.farin!();
          return output.farout!();
        }
        if (data.prHaveTether)
          return output.nearout!();
        return output.nearin!();
      },
      run: (data) => {
        data.prTetherCollect = [];
      },
      outputStrings: {
        nearin: {
          en: '안쪽으로',
        },
        nearout: {
          en: '바깥쪽/바깥보기',
        },
        farin: {
          en: '안쪽/안쪽보기',
        },
        farout: {
          en: '바깥쪽으로',
        },
      },
    },
    {
      // 테스트 안됨
      id: 'AMRS Moko Ashigaru Kyuhei',
      type: 'StartsUsing',
      // 85D0 => 87A8 멀리(확실)
      // 85FF => 87AA 가까이 일듯
      netRegex: { id: ['85D0', '85FF'], source: 'Ashigaru Kyuhei' },
      infoText: (data, matches, output) => {
        if (data.role === 'dps')
          return output.oppo!();
        if (matches.id === '85D0')
          return output.far!();
        return output.near!();
      },
      outputStrings: {
        near: {
          en: '파랭이 먼 쪽',
        },
        far: {
          en: '파랭이 가까운 쪽',
        },
        oppo: {
          en: '파랭이 대각',
        },
      },
    },
    {
      id: 'AMRS Moko 샤도 줄다리기 리셋',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Moko\'s Shadow', capture: false },
      suppressSeconds: 10,
      run: (data) => {
        data.prShadowTether++;
        data.prShadowGiri = [];
      },
    },
    {
      id: 'AMRS Moko 샤도 줄다리기 확인',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Moko\'s Shadow' },
      run: (data, matches) => {
        const target = matches.target;
        if (data.prShadowTether <= 2) {
          // Shadow-twin 첫번째, Moonless
          data.prTetherCollect.push(target);
          if (data.me === target) {
            data.prHaveTether = true;
            data.prTetherFrom = matches.sourceId;
          } else {
            if (data.role === 'tank' && data.party.isHealer(target))
              data.prTetherFrom = matches.sourceId;
            else if (data.role === 'healer' && data.party.isTank(target))
              data.prTetherFrom = matches.sourceId;
            else if (data.role === 'dps' && data.party.isDPS(target))
              data.prTetherFrom = matches.sourceId;
          }
        } else if (data.prShadowTether === 3) {
          // Shadow-twin 두번째, 파랭이
          if (data.me === target)
            data.prTetherFrom = matches.sourceId;
        }
      },
    },
    {
      id: 'AMRS Moko 샤도 줄다리기 알림',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Moko\'s Shadow', capture: false },
      condition: (data) => data.prShadowTether <= 2,
      delaySeconds: 0.5,
      suppressSeconds: 10,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tether: {
            en: '내게 줄! (${player})',
          },
          tetheronly: {
            en: '내게 줄!',
          },
          notether: {
            en: '줄 없음 (${players})',
          },
          notetheronly: {
            en: '줄 없음',
          },
        };

        if (data.prHaveTether) {
          const left = data.prTetherCollect.filter((x) => data.me !== x);
          if (left.length === 1)
            return { alertText: output.tether!({ player: data.party.aJobName(left[0]) }) };
          return { alertText: output.tetheronly!() };
        }
        if (data.prTetherCollect.length === 2) {
          const indices = data.prTetherCollect.map((x) => data.party.aJobIndex(x));
          const tethers = data.party.aJobSortedString(indices);
          return { infoText: output.notether!({ players: tethers }) };
        }
        return { infoText: output.notetheronly!() };
      },
    },
    {
      id: 'AMRS Moko Giris',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', target: 'Moko the Restless' },
      durationSeconds: (data, matches) => {
        if (kasumiGiriMapCounts.includes(matches.count))
          return data.prKasumiGiri.length < 2 ? 3.5 : 10;
        return 5;
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          unbound: {
            en: '(${mark}밖)',
          },
          azure: {
            en: '(${mark}안)',
          },
          vengeful: {
            en: '${dir} 봐요!',
          },
          text: {
            en: '${mesg}',
          },
          dontknow: {
            en: '모르는 방향: ${id}',
          },
          slashForward: {
            en: '바깥',
          },
          slashRight: {
            en: '왼쪽',
          },
          slashBackward: {
            en: '안쪽',
          },
          slashLeft: {
            en: '오른쪽',
          },
          north: {
            en: 'A',
          },
          east: {
            en: 'B',
          },
          south: {
            en: 'C',
          },
          west: {
            en: 'D',
          },
        };

        const cnt = matches.count;
        const angle = kasumiGiriMap[cnt];
        if (angle === undefined) {
          if (data.prHaveTether) {
            // Vengeful 방향
            const vengefulGiriMap: { [count: string]: string } = {
              '248': output.slashForward!(), // 앞쪽 베기
              '249': output.slashRight!(), // 오른쪽 베기
              '24A': output.slashBackward!(), // 뒤쪽 베기
              '24B': output.slashLeft!(), // 왼쪽 베기
            };
            const vengeful = vengefulGiriMap[cnt];
            if (vengeful !== undefined)
              return { alertText: output.vengeful!({ dir: vengeful }) };
            return { infoText: output.dontknow!({ id: cnt }) };
          }
          return;
        }

        const kasumiOuts = ['24C', '24D', '24E', '24F'];
        const kasumiMark: { [angle: number]: string } = {
          0: output.south!(),
          90: output.west!(),
          180: output.north!(),
          270: output.east!(),
          360: output.south!(),
        };

        const rotate = data.prKasumiAngle + angle;
        data.prKasumiAngle = rotate >= 360 ? rotate - 360 : rotate;
        const giri: KasumiGiriInfo = {
          mark: kasumiMark[data.prKasumiAngle] ?? '물?루',
          outside: kasumiOuts.includes(cnt),
        };
        data.prKasumiGiri.push(giri);

        if (data.prKasumiGiri.length < 3) {
          if (giri.outside)
            return { infoText: output.unbound!({ mark: giri.mark }) };
          return { infoText: output.azure!({ mark: giri.mark }) };
        }

        const out: string[] = [];
        for (const i of data.prKasumiGiri)
          out.push(`${i.mark}${i.outside ? '밖' : '안'}`);

        data.prKasumiCount++;
        data.prKasumiGiri = [];
        if (data.prKasumiCount > 1)
          data.prKasumiAngle = 0;

        return { infoText: output.text!({ mesg: out.join(' => ') }) };
      },
    },
    {
      id: 'AMRS Moko Moko\'s Shadow',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', target: 'Moko\'s Shadow', capture: true },
      durationSeconds: 11,
      infoText: (data, matches, output) => {
        const shadowGiriMap: { [count: string]: string } = {
          '248': output.slashForward!(), // 앞쪽 베기
          '249': output.slashRight!(), // 오른쪽 베기
          '24A': output.slashBackward!(), // 뒤쪽 베기
          '24B': output.slashLeft!(), // 왼쪽 베기
        };
        const giri: ShadowGiriInfo = {
          id: matches.targetId,
          cnt: matches.count,
          mesg: shadowGiriMap[matches.count] ?? output.unknown!(),
        };
        data.prShadowGiri.push(giri);

        if (data.prTetherFrom === undefined)
          return;

        if (data.prShadowTether <= 2) {
          // 첫번째 줄다리기
          if (data.prShadowGiri.length !== 4)
            return;
          const mygiri = data.prShadowGiri.filter((x) => x.id === data.prTetherFrom);
          const out = mygiri.map((x) => x.mesg);
          return output.text!({ mesg: out.join(' => ') });
        } else if (data.prShadowTether === 3) {
          // 파랭이 다음 줄다리기
          if (data.prShadowGiri.length !== 8)
            return;
          const mygiri = data.prShadowGiri.filter((x) => x.id === data.prTetherFrom);
          const out = mygiri.map((x) => x.mesg);
          const last = mygiri.pop();
          if (last !== undefined) {
            if (last.cnt === '24B')
              return output.left!({ mesg: out.join(' => ') });
            if (last.cnt === '249')
              return output.right!({ mesg: out.join(' => ') });
          }
          return output.text!({ mesg: out.join(' => ') });
        }
      },
      outputStrings: {
        text: {
          en: '${mesg}',
        },
        left: {
          en: '[왼쪽] ${mesg}',
        },
        right: {
          en: '[오른쪽] ${mesg}',
        },
        slashForward: {
          en: '뒤로',
        },
        slashRight: {
          en: '왼쪽',
        },
        slashBackward: {
          en: '앞으로',
        },
        slashLeft: {
          en: '오른쪽',
        },
        unknown: Outputs.unknown,
      },
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
    {
      locale: 'ja',
      missingTranslations: true,
      replaceSync: {
        'Ancient Katana': '古刀',
        'Ashigaru Kyuhei': '足軽弓兵',
        'Devilish Thrall': '惑わされた屍鬼',
        'Gorai The Uncaged': '鉄鼠ゴウライ',
        'Moko the Restless': '怨霊モウコ',
        'Moko\'s Shadow': 'モウコの幻影',
        'Shishio': '獅子王',
        'Shishu Fuko': 'シシュウ・フウコウ',
        'Shishu Furutsubaki': 'シシュウ・フルツバキ',
        'Shishu Kotengu': 'シシュウ・コテング',
        'Shishu Onmitsugashira': 'シシュウ・オンミガシラ',
        'Shishu Raiko': 'シシュウ・ライコウ',
        'Shishu Yuki': 'シシュウ・ユウキ',
      },
      replaceText: {
        'Accursed Edge': 'なぎ払い',
        'Azure Auspice': '青帝剣気',
        'Boundless Azure': '青帝空閃刃',
        'Boundless Scarlet': '赤帝空閃刃',
        // 'Brazen Ballad': '',
        // 'Burst': '',
        'Cloud to Ground': '襲雷',
        'Double Iai-giri': '居合二段',
        'Enkyo': '猿叫',
        'Explosion': '爆発',
        'Eye of the Thunder Vortex/Vortex of the Thunder Eye': '渦雷の連舞：円輪/輪円',
        'Falling Rock': '落石',
        'Far/Near Edge': '遠間/近間当て',
        'Fighting Spirits': '般若湯',
        'Fire Spread': '放火',
        'Flame and Sulphur': '岩火招来',
        'Fleeting Iai-giri': '俊足居合斬り',
        'Flickering Flame': '怪火招来',
        // 'Flintlock': '',
        // 'Great Ball of Fire/Greater Ball of Fire': '',
        // 'Greater Ball of Fire': '',
        // 'Greater Ball of Fire/Great Ball of Fire': '',
        'Haunting Cry': '不気味な鳴声',
        'Humble Hammer': '打ち出の小槌',
        'Impure Purgation': '炎流',
        'Invocation of Vengeance': '怨呪の祈請',
        'Iron Rain': '矢の雨',
        'Kenki Release': '剣気解放',
        'Lateral Slice': '胴薙ぎ',
        'Left Swipe': '左爪薙ぎ払い',
        'Levinburst': '発雷',
        'Malformed Prayer': '呪珠印',
        'Malformed Reincarnation': '変現呪珠の印',
        'Moonless Night': '闇夜斬り',
        'Noble Pursuit': '獅子王牙',
        // 'Pointed Purgation': '',
        'Right Swipe': '右爪薙ぎ払い',
        'Rousing Reincarnation': '変現の呪い',
        'Scarlet Auspice': '赤帝剣気',
        'Seal of Scurrying Sparks': '乱火の印',
        'Shadow Kasumi-giri': '',
        'Shadow-twin': '幻影呼び',
        '(?<! )Shock': '放電',
        'Slither': '蛇尾薙ぎ',
        'Smokeater': '霞喰い',
        'Soldiers of Death': '屍兵呼び',
        'Splitting Cry': '霊鳴砲',
        'Stormcloud Summons': '雷雲生成',
        // 'Stygian Aura': '',
        '(?<! )Thunder Vortex': '輪転渦雷',
        'Thundercall': '招雷',
        'Torching Torment': '煩熱',
        'Triple Kasumi-giri': '霞三段',
        'Unenlightenment': '煩悩熾盛',
        // 'Unnatural Ailment/Unnatural Force': '',
        'Unnatural Wail': '不気味な呪声',
        'Upwell': '水流',
        // 'Vengeful Flame': '',
        // 'Vengeful Pyre': '',
        // 'Vengeful Souls': '',
        // 'Vermilion Aura': '',
        'Vortex of the Thunder Eye/Eye of the Thunder Vortex': '渦雷の連舞：輪円/円輪',
        'Worldly Pursuit': '跳鼠痛撃',
      },
    },
  ],
};

export default triggerSet;
