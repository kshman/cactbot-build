import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: north / south laser add call for first Paradeigma
// TODO: second paradeigma tether/tower debuff?
// TODO: laser add call (inner west / inner east?) for second Paradeigma
// TODO: glaukopis tank swap call
// TODO: glaukopis tank swap after 2nd hit (if different person took both)
// TODO: tether/tower/saltire/cross debuffs for third Paradeigma (and partners for towers?)
// TODO: light/dark tower call for third Paradeigma (+ taking towers, baiting adds, etc)
// TODO: add phase dash calls?? (maybe this is overkill)
// TODO: Superchain 1 debuff triggers (maybe combine with existing triggers?)
// TODO: Superchain 2A
// TODO: Superchain 2B
// TODO: final Sample safe spot

const centerX = 100;
const centerY = 100;

const distSqr = (a: NetMatches['AddedCombatant'], b: NetMatches['AddedCombatant']): number => {
  const dX = parseFloat(a.x) - parseFloat(b.x);
  const dY = parseFloat(a.y) - parseFloat(b.y);
  return dX * dX + dY * dY;
};

const wings = {
  // vfx/lockon/eff/m0829_cst19_9s_c0v.avfx
  topLeftFirst: '01A5', // 82E2 cast and damage
  // vfx/lockon/eff/m0829_cst20_9s_c0v.avfx
  topRightFirst: '01A6', // 82E1 cast and damage
  // vfx/lockon/eff/m0829_cst21_6s_c0v.avfx
  middleLeftSecond: '01A7', // 82E4 damage (top down), 82EA damage (bottom up)
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  middleRightSecond: '01A8', // 82E3 damage (top down), 82E9 damage (bottom up)
  // vfx/lockon/eff/m0829_cst23_9s_c0v.avfx
  bottomLeftFirst: '01A9', // 82E8 cast and damage
  // vfx/lockon/eff/m0829_cst24_9s_c0v.avfx
  bottomRightFirst: '01AA', // 82E7 cast and damage
  // vfx/lockon/eff/m0829_cst19_3s_c0v.avfx
  topLeftThird: '01AF', // 82EC damage
  // vfx/lockon/eff/m0829_cst20_3s_c0v.avfx
  topRightThird: '01B0', // 82EB damage
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  bottomLeftThird: '01B1', // 82E6 damage
  // vfx/lockon/eff/m0829_cst23_3s_c0v.avfx
  bottomRightThird: '01B2', // 82E5 damage
} as const;

type SuperchainMechanic = 'destination' | 'out' | 'in' | 'protean' | 'partners';
const superchainNpcNameId = '12377';
const superchainNpcBaseIdMap: Record<SuperchainMechanic, string> = {
  destination: '16176',
  out: '16177',
  in: '16178',
  protean: '16179',
  partners: '16180',
} as const;

const headmarkers = {
  ...wings,
  // vfx/lockon/eff/tank_laser_5sec_lockon_c0a1.avfx
  glaukopis: '01D7',

  // vfx/lockon/eff/sph_lockon2_num01_s8p.avfx (through sph_lockon2_num04_s8p)
  limitCut1: '0150',
  limitCut2: '0151',
  limitCut3: '0152',
  limitCut4: '0153',
  // vfx/lockon/eff/sph_lockon2_num05_s8t.avfx (through sph_lockon2_num08_s8t)
  limitCut5: '01B5',
  limitCut6: '01B6',
  limitCut7: '01B7',
  limitCut8: '01B8',

  // vfx/lockon/eff/tank_lockonae_0m_5s_01t.avfx
  palladianGrasp: '01D4',
  // vfx/lockon/eff/m0376trg_fire3_a0p.avfx
  chains: '0061',
} as const;

const limitCutMap: { [id: string]: number } = {
  [headmarkers.limitCut1]: 1,
  [headmarkers.limitCut2]: 2,
  [headmarkers.limitCut3]: 3,
  [headmarkers.limitCut4]: 4,
  [headmarkers.limitCut5]: 5,
  [headmarkers.limitCut6]: 6,
  [headmarkers.limitCut7]: 7,
  [headmarkers.limitCut8]: 8,
} as const;

const limitCutIds: readonly string[] = Object.keys(limitCutMap);
const wingIds: readonly string[] = Object.values(wings);
const superchainNpcBaseIds: readonly string[] = Object.values(superchainNpcBaseIdMap);

const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (data.decOffset === undefined) {
    if (data.expectedFirstHeadmarker === undefined) {
      console.error('missing expected first headmarker');
      return 'OOPS';
    }
    data.decOffset = parseInt(matches.id, 16) - parseInt(data.expectedFirstHeadmarker, 16);
  }
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

export interface Data extends RaidbossData {
  prsPrdms?: number;
  prsPrdmTower?: 'umbral' | 'astral' | 'unknown';
  //
  decOffset?: number;
  expectedFirstHeadmarker?: string;
  isDoorBoss: boolean;
  phase?: 'superchain1' | 'palladion' | 'superchain2a' | 'superchain2b';
  wingCollect: string[];
  wingCalls: ('swap' | 'stay')[];
  superchainCollect: NetMatches['AddedCombatant'][];
  superchain1FirstDest?: NetMatches['AddedCombatant'];
  limitCutNumber?: number;
  whiteFlameCounter: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheTwelfthCircleSavage',
  zoneId: ZoneId.AnabaseiosTheTwelfthCircleSavage,
  timelineFile: 'p12s.txt',
  initData: () => {
    return {
      isDoorBoss: true,
      wingCollect: [],
      wingCalls: [],
      superchainCollect: [],
      whiteFlameCounter: 0,
    };
  },
  triggers: [
    {
      id: 'P12S Phase Tracker 1',
      type: 'StartsUsing',
      netRegex: { id: ['82DA', '82F5', '86FA', '86FB'], source: 'Athena' },
      infoText: (_data, matches, output) => {
        const pms: { [id: string]: string } = {
          '82DA': output.superChain1!(),
          '82F5': output.palladion!(),
          '86FA': output.superChain2a!(),
          '86FB': output.superChain2b!(),
        } as const;
        return pms[matches.id];
      },
      run: (data, matches) => {
        data.whiteFlameCounter = 0;
        data.superchainCollect = [];

        const phaseMap: { [id: string]: Data['phase'] } = {
          '82DA': 'superchain1',
          '82F5': 'palladion',
          '86FA': 'superchain2a',
          '86FB': 'superchain2b',
        } as const;
        data.phase = phaseMap[matches.id];

        data.prsPrdmTower = 'unknown';
      },
      outputStrings: {
        superChain1: '슈퍼 체인 시어리 I',
        palladion: '팔라디온',
        superChain2a: '슈퍼 체인 시어리 II-A',
        superChain2b: '슈퍼 체인 시어리 II-B',
      }
    },
    {
      id: 'P12S Phase Tracker 2',
      type: 'StartsUsing',
      // 8682 = Ultima cast
      netRegex: { id: '8682', source: 'Pallas Athena', capture: false },
      run: (data) => {
        data.isDoorBoss = false;
        data.expectedFirstHeadmarker = headmarkers.palladianGrasp;
      },
    },
    {
      id: 'P12S Door Boss Headmarker Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['82E7', '82E8'], source: 'Athena' },
      suppressSeconds: 99999,
      run: (data, matches) => {
        // The first headmarker in the door boss is EITHER the bottom left or bottom right wing.
        const isBottomLeft = matches.id === '82E8';
        const first = isBottomLeft ? headmarkers.bottomLeftFirst : headmarkers.bottomRightFirst;
        data.expectedFirstHeadmarker = first;
      },
    },
    // --------------------- Phase 1 ------------------------
    {
      id: 'P12S On the Soul',
      type: 'StartsUsing',
      netRegex: { id: '8304', source: 'Athena', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P12S First Wing',
      type: 'StartsUsing',
      netRegex: { id: ['82E7', '82E8', '82E1', '82E2'], source: 'Athena' },
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        data.wingCollect = [];
        data.wingCalls = [];
        const isLeft = matches.id === '82E8' || matches.id === '82E2';
        return isLeft ? output.right!() : output.left!();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'P12S Wing Collect',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (!wingIds.includes(id))
          return false;
        data.wingCollect.push(id);
        return true;
      },
      delaySeconds: (data) => data.decOffset === undefined ? 1 : 0,
      durationSeconds: (data) => data.wingCollect.length === 3 ? 7 : 2,
      infoText: (data, _matches, output) => {
        if (data.wingCollect.length !== 3 && data.wingCollect.length !== 2)
          return;

        const [first, second, third] = data.wingCollect;
        if (first === undefined || second === undefined)
          return;

        const isFirstLeft = first === wings.topLeftFirst || first === wings.bottomLeftFirst;
        const isSecondLeft = second === wings.middleLeftSecond;
        const isThirdLeft = third === wings.topLeftThird || third === wings.bottomLeftThird;

        const firstStr = isFirstLeft ? output.right!() : output.left!();

        const isFirstTop = first === wings.topLeftFirst || first === wings.topRightFirst;
        let secondCall: 'swap' | 'stay';
        let thirdCall: 'swap' | 'stay';
        if (isFirstTop) {
          secondCall = isFirstLeft === isSecondLeft ? 'stay' : 'swap';
          thirdCall = isSecondLeft === isThirdLeft ? 'stay' : 'swap';
        } else {
          secondCall = isFirstLeft === isSecondLeft ? 'swap' : 'stay';
          thirdCall = isSecondLeft === isThirdLeft ? 'swap' : 'stay';
        }

        data.wingCalls = [secondCall, thirdCall];

        // This is the second call only.
        if (third === undefined) {
          if (secondCall === 'stay')
            return output.secondWingCallStay!();
          return output.secondWingCallSwap!();
        }

        return output.allThreeWings!({
          first: firstStr,
          second: output[secondCall]!(),
          third: output[thirdCall]!(),
        });
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        swap: {
          en: '자리바꿈',
          de: 'Wechseln',
          fr: 'Swap',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          ko: '가만히',
        },
        secondWingCallStay: {
          en: '(그대로)',
          de: '(bleib Stehen)',
          fr: '(restez)',
          ko: '(가만히)',
        },
        secondWingCallSwap: {
          en: '(자리바꿈)',
          de: '(Wechseln)',
          fr: '(swap)',
          ko: '(이동)',
        },
        allThreeWings: {
          en: '${first} => ${second} => ${third}',
          de: '${first} => ${second} => ${third}',
          fr: '${first} => ${second} => ${third}',
          ko: '${first} => ${second} => ${third}',
        },
      },
    },
    {
      id: 'P12S Wing Followup',
      type: 'Ability',
      netRegex: {
        id: ['82E1', '82E2', '82E3', '82E4', '82E7', '82E8', '82E9', '82EA'],
        source: 'Athena',
        capture: false,
      },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const call = data.wingCalls.shift();
        if (call === 'swap')
          return output.swap!();
        if (call === 'stay')
          return output.stay!();
      },
      outputStrings: {
        swap: {
          en: '자리바꿔요',
          de: 'Wechseln',
          fr: 'Swap',
          ko: '이동',
        },
        stay: {
          en: '그대로',
          de: 'bleib Stehen',
          fr: 'Restez',
          ko: '가만히',
        },
      },
    },
    {
      id: 'P12S Peridialogos',
      type: 'StartsUsing',
      netRegex: { id: '82FF', source: 'Athena', capture: false },
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tanksInPartyOut!() : output.partyOutTanksIn!(),
      outputStrings: {
        partyOutTanksIn: {
          en: '바깥으로 (탱크가 안쪽)',
          de: 'Gruppe Raus (Tanks Rein)',
          fr: 'Équipe à l\'extérieur (Tanks à l\'intérieur)',
          ko: '본대 밖 (탱커 안)',
        },
        tanksInPartyOut: {
          en: '안쪽으로 (파티가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Tanks à l\'intérieur (Équipe à l\'extérieur',
          ko: '탱커 안 (본대 밖)',
        },
      },
    },
    {
      id: 'P12S Apodialogos',
      type: 'StartsUsing',
      netRegex: { id: '82FE', source: 'Athena', capture: false },
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tanksInPartyOut!() : output.partyInTanksOut!(),
      outputStrings: {
        partyInTanksOut: {
          en: '안쪽으로 (탱크가 바깥쪽)',
          de: 'Gruppe Rein (Tanks Raus)',
          fr: 'Équipe à l\'intérieur (Tanks à l\'extérieur)',
          ko: '본대 안 (탱커 밖)',
        },
        tanksInPartyOut: {
          en: '바깥으로 (파티가 안쪽)',
          de: 'Tanks Raus (Gruppe Rein)',
          fr: 'Tanks à l\'extérieur (Équipe à l\'intérieur',
          ko: '탱커 밖 (본대 안)',
        },
      },
    },
    {
      id: 'P12S Limit Cut',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      durationSeconds: 20,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (!limitCutIds.includes(id))
          return;
        const num = limitCutMap[id];
        if (num === undefined)
          return;
        data.limitCutNumber = num;
        return output.text!({ num: num });
      },
      outputStrings: {
        text: {
          en: '${num}번',
          de: '${num}',
          fr: '${num}',
          ja: '${num}',
          cn: '${num}',
          ko: '${num}',
        },
      },
    },
    {
      id: 'P12S Palladion White Flame Initial',
      type: 'StartsUsing',
      // 82F5 = Palladion cast
      netRegex: { id: '82F5', source: 'Athena', capture: false },
      // Don't collide with number callout.
      delaySeconds: 2,
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: '레이저 유도',
            ko: '레이저 유도',
          },
          firstWhiteFlame: {
            en: '(5, 7 유도)',
            ko: '(5, 7 레이저)',
          },
        };
        const infoText = output.firstWhiteFlame!();
        if (data.limitCutNumber === 5 || data.limitCutNumber === 7)
          return { alert: output.baitLaser!(), infoText: infoText };
        return { infoText: infoText };
      },
    },
    {
      id: 'P12S Palladion White Flame Followup',
      type: 'Ability',
      netRegex: { id: '82EF', source: 'Anthropos', capture: false },
      condition: (data) => data.phase === 'palladion',
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          baitLaser: {
            en: '레이저 유도',
            ko: '레이저 유도',
          },
          secondWhiteFlame: {
            en: '(6, 8 유도)',
            ko: '(6, 8 레이저)',
          },
          thirdWhiteFlame: {
            en: '(1, 3 유도)',
            ko: '(1, 3 레이저)',
          },
          fourthWhiteFlame: {
            en: '(2, 4 유도)',
            ko: '(2, 4 레이저)',
          },
        };

        data.whiteFlameCounter++;

        const baitLaser = output.baitLaser!();

        if (data.whiteFlameCounter === 1) {
          const infoText = output.secondWhiteFlame!();
          if (data.limitCutNumber === 6 || data.limitCutNumber === 8)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
        if (data.whiteFlameCounter === 2) {
          const infoText = output.thirdWhiteFlame!();
          if (data.limitCutNumber === 1 || data.limitCutNumber === 3)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
        if (data.whiteFlameCounter === 3) {
          const infoText = output.fourthWhiteFlame!();
          if (data.limitCutNumber === 2 || data.limitCutNumber === 4)
            return { alertText: baitLaser, infoText: infoText };
          return { infoText: infoText };
        }
      },
    },
    {
      id: 'P12S Superchain Theory Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds },
      // Note: do not modify or clear this in any trigger but phase reset.
      run: (data, matches) => data.superchainCollect.push(matches),
    },
    {
      id: 'P12S Superchain Theory I First Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain1' && data.superchainCollect.length === 3,
      alertText: (data, _matches, output) => {
        const ids = data.superchainCollect.slice(0, 3).map((x) => x.npcBaseId).sort();
        const [destMatches] = data.superchainCollect.filter((x) =>
          x.npcBaseId === superchainNpcBaseIdMap.destination
        );

        // Based on id sorting (see: superchainNpcBaseIdMap), they will always be in this order.
        const [, inOut, proteanPartner] = ids;
        if (destMatches === undefined || inOut === undefined || proteanPartner === undefined)
          return;

        // TODO: technically this is just intercardinals and we don't need all outputs here.
        // Do we need another helper for this?
        const dirStr = Directions.addedCombatantPosTo8DirOutput(destMatches, centerX, centerY);
        const dir = output[dirStr]!();
        data.superchain1FirstDest = destMatches;

        if (inOut === superchainNpcBaseIdMap.in) {
          if (proteanPartner === superchainNpcBaseIdMap.protean)
            return output.inAndProtean!({ dir: dir });
          return output.inAndPartners!({ dir: dir });
        }

        if (proteanPartner === superchainNpcBaseIdMap.protean)
          return output.outAndProtean!({ dir: dir });
        return output.outAndPartners!({ dir: dir });
      },
      outputStrings: {
        inAndProtean: {
          en: '안으로 프로틴: (${dir})',
          ko: '안 + 8방향 산개 (${dir})',
        },
        inAndPartners: {
          en: '안으로 페어: (${dir})',
          ko: '안 + 파트너 (${dir})',
        },
        outAndProtean: {
          en: '밖에서 프로틴: (${dir})',
          ko: '밖 + 8방향 산개 (${dir})',
        },
        outAndPartners: {
          en: '밖에서 페어: (${dir})',
          ko: '밖 + 파트너 (${dir})',
        },
        ...Directions.outputStrings8Dir,
      },
    },
    {
      id: 'P12S Superchain Theory I Second Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain1' && data.superchainCollect.length === 7,
      // TODO: should we base this off of the first coil/burst instead?
      // 7.2 seconds is the time until the second mechanic finishes, so call early.
      delaySeconds: 6.2,
      alertText: (data, _matches, output) => {
        // Sort ascending.
        const collect = data.superchainCollect.slice(3, 7).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );

        const firstMechDest = data.superchain1FirstDest;
        if (firstMechDest === undefined)
          return;
        const [dest1, dest2, donut, sphere] = collect;
        if (
          dest1 === undefined || dest2 === undefined || donut === undefined || sphere === undefined
        )
          return;

        // TODO: it'd sure be nice if we had more info about what is tethered to what
        // as part of AddedCombatant, but for now we can heuristic our way out of this.
        const expectedDistanceSqr = 561.3101;
        const dest1Donut = Math.abs(distSqr(dest1, donut) - expectedDistanceSqr);
        const dest2Donut = Math.abs(distSqr(dest2, donut) - expectedDistanceSqr);
        const dest1Sphere = Math.abs(distSqr(dest1, sphere) - expectedDistanceSqr);
        const dest2Sphere = Math.abs(distSqr(dest2, sphere) - expectedDistanceSqr);

        let donutDest;
        // Extra checks just in case??
        if (dest1Donut < dest1Sphere && dest2Donut > dest2Sphere)
          donutDest = dest1;
        else if (dest1Donut > dest1Sphere && dest2Donut < dest2Sphere)
          donutDest = dest2;

        if (donutDest === undefined)
          return;

        const prevDir = Directions.addedCombatantPosTo8Dir(firstMechDest, centerX, centerY);
        const thisDir = Directions.addedCombatantPosTo8Dir(donutDest, centerX, centerY);

        const rotation = (thisDir - prevDir + 8) % 8;
        if (rotation === 2)
          return output.leftClockwise!();
        if (rotation === 6)
          return output.rightCounterclockwise!();
      },
      outputStrings: {
        // This is left and right facing the boss.
        // TODO: this should probably also say your debuff,
        // e.g. "Left (Dark Laser)" or "Right (Light Tower)" or something?
        leftClockwise: {
          en: '왼쪽 (시계방향)',
          ko: '왼쪽 (시계방향)',
        },
        rightCounterclockwise: {
          en: '오른쪽 (반시계방향)',
          ko: '오른쪽 (반시계방향)',
        },
      },
    },
    {
      id: 'P12S Superchain Theory I Third Mechanic',
      type: 'AddedCombatant',
      netRegex: { npcNameId: superchainNpcNameId, npcBaseId: superchainNpcBaseIds, capture: false },
      condition: (data) => data.phase === 'superchain1' && data.superchainCollect.length === 10,
      // TODO: should we base this off of the first coil/burst instead?
      // 10.6 seconds is the time until the second mechanic finishes, so call early.
      delaySeconds: 9.1,
      alertText: (data, _matches, output) => {
        // Sort ascending.
        const collect = data.superchainCollect.slice(7, 10).sort((a, b) =>
          parseInt(a.npcBaseId) - parseInt(b.npcBaseId)
        );

        // Based on id sorting (see: superchainNpcBaseIdMap), they will always be in this order.
        const [dest, donut, sphere] = collect;
        if (dest === undefined || donut === undefined || sphere === undefined)
          return;

        const donutDistSqr = distSqr(donut, dest);
        const sphereDistSqr = distSqr(sphere, dest);
        if (donutDistSqr > sphereDistSqr)
          return output.inThenOut!();
        return output.outThenIn!();
      },
      outputStrings: {
        // TODO: this should also say to spread / place tower / take tower
        // TODO: maybe we need separate calls for these ^ after initial donut/sphere goes off?
        inThenOut: Outputs.inThenOut,
        outThenIn: Outputs.outThenIn,
      },
    },
    // --------------------- Phase 2 ------------------------
    {
      id: 'P12S Geocentrism Vertical',
      type: 'StartsUsing',
      netRegex: { id: '8329', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '세로로',
        },
      },
    },
    {
      id: 'P12S Geocentrism Circle',
      type: 'StartsUsing',
      netRegex: { id: '832A', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '이니 스피니(Inny Spinny)',
        },
      },
    },
    {
      id: 'P12S Geocentrism Horizontal',
      type: 'StartsUsing',
      netRegex: { id: '832B', source: 'Pallas Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '가로로',
        },
      },
    },
    // -- PRT --
    {
      id: 'P12S 글라우코피스',
      type: 'StartsUsing',
      netRegex: { id: '82FC', capture: false },
      condition: (data) => data.role === 'tank',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '탱크 스위치!',
      },
    },
    {
      id: 'P12S 파라데이그마',
      type: 'StartsUsing',
      netRegex: { id: '82ED', capture: false },
      run: (data) => data.prsPrdms = (data.prsPrdms ?? 0) + 1,
    },
    {
      id: 'P12S 개인별 체인 이펙트',
      type: 'GainsEffect',
      // DF8:Umbral Tilt 하얀 동글
      // DF9:Astral Tilt 보라 동글
      // DFA:Heavensflame Soul
      // DFB:Umbralbright Soul
      // DFC:Astralbright Soul
      // DFD:Umbralstrong Soul
      // DFE:Astralstrong Soul
      netRegex: { effectId: ['DF8', 'DF9', 'DFB', 'DFC', 'DFD', 'DFE'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (data) => {
        if (data.phase === 'superchain1' && data.prsPrdms === 2)
          return 4;
        if (data.prsPrdms === 3)
          return 0.5;
        return 0;
      },
      durationSeconds: (data) => {
        if (data.phase === undefined)
          return 7;
        if (data.phase === 'superchain1') {
          if (data.prsPrdms === 2)
            return 18;
          if (data.prsPrdms === 3)
            return 9;
        }
        return 5;
      },
      suppressSeconds: (data) => {
        if (data.phase === 'superchain1' && data.prsPrdms === 2)
          return 23;
        return 20;
      },
      infoText: (data, matches, output) => {
        if (data.phase === undefined) {
          if (matches.effectId === 'DFB')
            return output.twUbSoul!();
          if (matches.effectId === 'DFC')
            return output.twAbSoul!();
        } else if (data.phase === 'superchain1') {
          if (data.prsPrdms === 2) {
            const mesgs: { [eid: string]: string } = {
              'DF8': output.sc1UmbTilt!(),
              'DF9': output.sc1AstTilt!(),
              // 'DFA': output.heavenSoul!(),
              'DFB': output.sc1UbSoul!(),
              'DFC': output.sc1AbSoul!(),
              'DFD': output.sc1UsSoul!(),
              'DFE': output.sc1AsSoul!()
            };
            return mesgs[matches.effectId] ?? output.unknown!();
          } else if (data.prsPrdms === 3) {
            if (matches.effectId === 'DFB')
              return output.pd3UbSoul!();
            if (matches.effectId === 'DFC')
              return output.pd3AbSoul!();

            // 타워 또는 레이저
            if (matches.effectId === 'DF8')
              return data.prsPrdmTower === 'astral' ? output.pd3UmbTilt!() : output.pd3Bait!();
            if (matches.effectId === 'DF9')
              return data.prsPrdmTower === 'umbral' ? output.pd3AstTilt!() : output.pd3Bait!();
          }
        }
      },
      outputStrings: {
        // 그냥 타워
        twUbSoul: '🟡타워',
        twAbSoul: '🟣타워',
        // 슈퍼체인1
        sc1UmbTilt: '❰❰❰왼쪽 🡺 흩어져요',
        sc1AstTilt: '오른쪽❱❱❱ 🡺 흩어져요',
        heavenSoul: '',
        sc1UbSoul: '❰❰❰왼쪽 🡺 🟡타워 설치',
        sc1AbSoul: '오른쪽❱❱❱ 🡺 🟣타워 설치',
        sc1UsSoul: '오른쪽❱❱❱ 🡺 🟣 밟아요',
        sc1AsSoul: '❰❰❰왼쪽 🡺 🟡 밟아요',
        // 파라데이그3
        pd3UbSoul: '타워 밟고 🡺 보라 쪽에 🟡타워 설치', // 노랑
        pd3AbSoul: '타워 밟고 🡺 노랑 쪽에 🟣타워 설치', // 보라
        pd3UmbTilt: '🟣 타워 밟아요',
        pd3AstTilt: '🟡 타워 밟아요',
        pd3Bait: '레이저 유도',
        //
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P12S 파라데이그마3 이펙트 얻기',
      type: 'GainsEffect',
      netRegex: { effectId: ['DFB', 'DFC'] },
      condition: (data) => data.prsPrdms === 3,
      run: (data, matches) => {
        if (matches.effectId === 'DFB')
          data.prsPrdmTower = 'umbral'; // 노랑 타워
        else if (matches.effectId === 'DFC')
          data.prsPrdmTower = 'astral'; // 보라 타워
        else
          data.prsPrdmTower = 'unknown';
      },
    },
    {
      id: 'P12S 줄다리기 보라',
      type: 'Tether',
      netRegex: { id: ['00FB', '00EA'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      suppressSeconds: 20,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '🟪 줄 땡겨요',
      }
    },
    {
      id: 'P12S 줄다리기 노랑',
      type: 'Tether',
      netRegex: { id: '00E9' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 7,
      suppressSeconds: 20,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '🟨 줄 땡겨요',
      }
    },
    {
      id: 'P12S 파라데이그마 더하기',
      type: 'GainsEffect',
      netRegex: { effectId: 'DFF' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '북쪽  🡺 타워 밟고 🡺 모서리➕'
      },
    },
    {
      id: 'P12S 파라데이그마 곱하기',
      type: 'GainsEffect',
      netRegex: { effectId: 'E00' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: '남쪽 🡺 타워 밟고 🡺 가운데❌'
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceSync': {
        'Apodialogos/Peridialogos': 'Apodia/Peridia',
        'Astral Advance/Umbral Advance': 'Astral/Umbral Advance',
        'Astral Advent/Umbral Advent': 'Astral/Umbral Advent',
        'Astral Glow/Umbral Glow': 'Astral/Umbral Glow',
        'Astral Impact/Umbral Impact': 'Astral/Umbral Impact',
        'Superchain Coil/Superchain Burst': 'Superchain Coil/Burst',
        'Theos\'s Saltire/Theos\'s Cross': 'Saltire/Cross',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Anthropos': 'Anthropos',
        'Athena': 'Athena',
      },
      'replaceText': {
        '\\(cast\\)': '(Wirken)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(proximity\\)': '(Entfernung)',
        '\\(spread\\)': '(Verteilen)',
        'Dialogos': 'Dialogos',
        'Engravement of Souls': 'Seelensiegel',
        'Glaukopis': 'Glaukopis',
        'On the Soul': 'Auf der Seele',
        'Palladion': 'Palladion',
        'Paradeigma': 'Paradigma',
        'Parthenos': 'Parthenos',
        'Ray of Light': 'Lichtstrahl',
        'Sample': 'Vielfraß',
        'Superchain Burst': 'Superkette - Ausbruch',
        'Superchain Coil': 'Superkette - Kreis',
        'Theos\'s Ultima': 'Theos Ultima',
        'Trinity of Souls': 'Dreifaltigkeit der Seelen',
        'Ultima Blade': 'Ultima-Klinge',
        'Unnatural Enchainment': 'Seelenfessel',
        'White Flame': 'Weißes Feuer',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Anthropos': 'anthropos',
        'Athena': 'Athéna',
      },
      'replaceText': {
        'Dialogos': 'Dialogos',
        'Engravement of Souls': 'Marquage d\'âme',
        'Glaukopis': 'Glaukopis',
        'On the Soul': 'Sur les âmes',
        'Palladion': 'Palladion',
        'Paradeigma': 'Paradeigma',
        'Parthenos': 'Parthénon',
        'Ray of Light': 'Onde de lumière',
        'Sample': 'Voracité',
        'Superchain Burst': 'Salve des superchaînes',
        'Superchain Coil': 'Cercle des superchaînes',
        'Theos\'s Ultima': 'Ultima de théos',
        'Trinity of Souls': 'Âmes trinité',
        'Ultima Blade': 'Lames Ultima',
        'Unnatural Enchainment': 'Enchaînement d\'âmes',
        'White Flame': 'Feu blanc',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Anthropos': 'アンスロポス',
        'Athena': 'アテナ',
      },
      'replaceText': {
        'Dialogos': 'ディアロゴス',
        'Engravement of Souls': '魂の刻印',
        'Glaukopis': 'グラウコピス',
        'On the Soul': 'オン・ザ・ソウル',
        'Palladion': 'パラディオン',
        'Paradeigma': 'パラデイグマ',
        'Parthenos': 'パルテノン',
        'Ray of Light': '光波',
        'Sample': '貪食',
        'Superchain Burst': 'スーパーチェイン・バースト',
        'Superchain Coil': 'スーパーチェイン・サークル',
        'Theos\'s Ultima': 'テオス・アルテマ',
        'Trinity of Souls': 'トリニティ・ソウル',
        'Ultima Blade': 'アルテマブレイド',
        'Unnatural Enchainment': '魂の鎖',
        'White Flame': '白火',
      },
    },
  ],
};

export default triggerSet;
