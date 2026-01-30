import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import {
  DirectionOutput8,
  DirectionOutputCardinal,
  DirectionOutputIntercard,
  Directions,
} from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Phase =
  | 'doorboss'
  | 'curtainCall'
  | 'slaughtershed'
  | 'replication1'
  | 'replication2'
  | 'reenactment1'
  | 'idyllic'
  | 'reenactment2';

type DirectionCardinal = Exclude<DirectionOutputCardinal, 'unknown'>;
type DirectionIntercard = Exclude<DirectionOutputIntercard, 'unknown'>;

type MortalInfo = {
  purple: boolean;
  left: boolean;
  moks: string;
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    uptimeKnockbackStrat: true | false;
    showGrotesquerieAct2Progress: boolean;
  };
  phase: Phase;
  // Phase 1
  grotesquerieCleave?:
    | 'rightCleave'
    | 'leftCleave'
    | 'frontCleave'
    | 'rearCleave';
  myFleshBonds?: 'alpha' | 'beta';
  inLine: { [name: string]: number };
  blobTowerDirs: string[];
  fleshBondsCount: number;
  skinsplitterCount: number;
  cellChainCount: number;
  myMitoticPhase?: string;
  hasRot: boolean;
  // Phase 2
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  replicationCounter: number;
  replication1Debuff?: 'fire' | 'dark';
  replication1FireActor?: string;
  replication1FollowUp: boolean;
  replication2TetherMap: { [dirNum: string]: string };
  replication2BossId?: string;
  myReplication2Tether?: string;
  netherwrathFollowup: boolean;
  myMutation?: 'alpha' | 'beta';
  manaSpheres: {
    [id: string]: 'lightning' | 'fire' | 'water' | 'wind' | 'blackHole';
  };
  westManaSpheres: { [id: string]: { x: number; y: number } };
  eastManaSpheres: { [id: string]: { x: number; y: number } };
  closeManaSphereIds: string[];
  firstBlackHole?: 'east' | 'west';
  manaSpherePopSide?: 'east' | 'west';
  twistedVisionCounter: number;
  replication3CloneOrder: number[];
  replication3CloneDirNumPlayers: { [dirNum: number]: string };
  idyllicVision2NorthSouthCleaveSpot?: 'north' | 'south';
  replication4DirNumAbility: { [dirNum: number]: string };
  replication4PlayerAbilities: { [player: string]: string };
  replication4PlayerOrder: string[];
  replication4AbilityOrder: string[];
  myReplication4Tether?: string;
  hasLightResistanceDown: boolean;
  doomPlayers: string[];
  // prt
  mortalList: MortalInfo[];
  ushikoDir: DirectionOutput8;
}

const headMarkerData = {
  // Phase 1
  // VFX: com_share3t
  'stack': '00A1',
  // VFX: tank_lockonae_6m_5s_01t
  'tankbuster': '0158',
  // VFX: VFX: x6rc_cellchain_01x
  'cellChain': '0291',
  // VFX: com_share3_7s0p
  'slaughterStack': '013D',
  // VFX: target_ae_s7k1
  'slaughterSpread': '0177',
  'cellChainTether': '016E',
  // Phase 2
  // VFX: sharelaser2tank5sec_c0k1, used by Double Sobat (B520)
  'sharedTankbuster': '0256',
  // Replication 2 Tethers
  'lockedTether': '0175', // Clone tethers
  'projectionTether': '016F', // Comes from Lindschrat, B4EA Grotesquerie + B4EB Hemorrhagic Projection cleave based on player facing
  'manaBurstTether': '0170', // Comes from Lindschrat, B4E7 Mana Burst defamation
  'heavySlamTether': '0171', // Comes from Lindschrat, B4E8 Heavy Slam stack with projection followup
  'fireballSplashTether': '0176', // Comes from the boss, B4E4 Fireball Splash baited jump
} as const;

const center = {
  x: 100,
  y: 100,
} as const;

const phaseMap: { [id: string]: Phase } = {
  'BEC0': 'curtainCall',
  'B4C6': 'slaughtershed',
  'B509': 'idyllic',
};

const grandCountMap: { [id: string]: string } = {
  '436': 'front',
  '437': 'right',
  '438': 'rear',
  '439': 'left',
};

const dirAimStrings = {
  dirN: Outputs.aimN,
  dirS: Outputs.aimS,
  dirE: Outputs.aimE,
  dirW: Outputs.aimW,
  dirNE: Outputs.aimNE,
  dirSE: Outputs.aimSE,
  dirSW: Outputs.aimSW,
  dirNW: Outputs.aimNW,
  unknown: Outputs.unknown,
} as const;

const markerStrings = {
  dirN: {
    en: '🡹North',
    ja: '🄰🡹北',
    ko: '🄰🡹북',
  },
  dirE: {
    en: '🡺East',
    ja: '🄱🡺東',
    ko: '🄱🡺동',
  },
  dirS: {
    en: '🡻South',
    ja: '🄲🡻南',
    ko: '🄲🡻남',
  },
  dirW: {
    en: '🡸West',
    ja: '🄳🡸西',
    ko: '🄳🡸서',
  },
  dirNW: {
    en: '🡼NW',
    ja: '➊🡼北西',
    ko: '➊🡼북서',
  },
  dirNE: {
    en: '🡽NE',
    ja: '➋🡽北東',
    ko: '➋🡽북동',
  },
  dirSE: {
    en: '🡾SE',
    ja: '➌🡾南東',
    ko: '➌🡾남동',
  },
  dirSW: {
    en: '🡿SW',
    ja: '➍🡿南西',
    ko: '➍🡿남서',
  },
  unknown: Outputs.unknown,
} as const;

const isCardinalDir = (dir: DirectionOutput8): dir is DirectionCardinal => {
  return (Directions.outputCardinalDir as string[]).includes(dir);
};

const isIntercardDir = (dir: DirectionOutput8): dir is DirectionIntercard => {
  return (Directions.outputIntercardDir as string[]).includes(dir);
};

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM4Savage',
  zoneId: ZoneId.AacHeavyweightM4Savage,
  config: [
    {
      id: 'uptimeKnockbackStrat',
      name: {
        en: 'Enable uptime knockback strat',
        ja: 'エデン零式共鳴編４層：cactbot「ヘヴンリーストライク (ノックバック)」ギミック', // FIXME
        ko: '정확한 타이밍 넉백방지 공략 사용',
      },
      comment: {
        en: `If you want cactbot to callout Raptor Knuckles double knockback, enable this option.
             Callout happens during/after first animation and requires <1.8s reaction time
             to avoid both Northwest and Northeast knockbacks.
             NOTE: This will call for each set.`,
      },
      type: 'checkbox',
      default: false,
    },
    {
      id: 'showGrotesquerieAct2Progress',
      name: {
        en: 'Display Grotesquerie Act 2 Progress',
        ja: '細胞付着・中期進行状況表示',
        ko: '세포부착 중기 진행 상황 표시',
      },
      type: 'checkbox',
      default: false,
    },
  ],
  timelineFile: 'r12s.txt',
  initData: () => ({
    phase: 'doorboss',
    // Phase 1
    inLine: {},
    blobTowerDirs: [],
    skinsplitterCount: 0,
    fleshBondsCount: 0,
    cellChainCount: 0,
    hasRot: false,
    // Phase 2
    actorPositions: {},
    replicationCounter: 0,
    replication1FollowUp: false,
    replication2TetherMap: {},
    netherwrathFollowup: false,
    manaSpheres: {},
    westManaSpheres: {},
    eastManaSpheres: {},
    closeManaSphereIds: [],
    twistedVisionCounter: 0,
    replication3CloneOrder: [],
    replication3CloneDirNumPlayers: {},
    replication4DirNumAbility: {},
    replication4PlayerAbilities: {},
    replication4PlayerOrder: [],
    replication4AbilityOrder: [],
    hasLightResistanceDown: false,
    doomPlayers: [],
    // prt
    mortalList: [],
    ushikoDir: 'unknown',
  }),
  triggers: [
    {
      id: 'R12S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phaseMap), source: 'Lindwurm' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const phase = phaseMap[matches.id];
        if (phase === undefined)
          throw new UnreachableCode();

        data.phase = phase;
      },
    },
    {
      id: 'R12S Phase Two Staging Tracker',
      // Due to the way the combatants are added in prior to the cast of Staging, this is used to set the phase
      type: 'AddedCombatant',
      netRegex: { name: 'Understudy', capture: false },
      condition: (data) => data.phase === 'replication1',
      run: (data) => data.phase = 'replication2',
    },
    {
      id: 'R12S Phase Two Replication Tracker',
      type: 'StartsUsing',
      netRegex: { id: 'B4D8', source: 'Lindwurm', capture: false },
      run: (data) => {
        if (data.replicationCounter === 0)
          data.phase = 'replication1';
        data.replicationCounter = data.replicationCounter + 1;
      },
    },
    {
      id: 'R12S Phase Two Boss ID Collect',
      // Store the boss' id later for checking against tether
      // Using first B4E1 Staging
      type: 'StartsUsing',
      netRegex: { id: 'B4E1', source: 'Lindwurm', capture: true },
      condition: (data) => data.phase === 'replication2',
      suppressSeconds: 9999,
      run: (data, matches) => data.replication2BossId = matches.sourceId,
    },
    {
      id: 'R12S Phase Two Reenactment Tracker',
      type: 'StartsUsing',
      netRegex: { id: 'B4EC', source: 'Lindwurm', capture: false },
      run: (data) => {
        if (data.phase === 'replication1') {
          data.phase = 'reenactment1';
          return;
        }
        data.phase = 'reenactment2';
      },
    },
    {
      id: 'R12S Phase Two Twisted Vision Tracker',
      // Used for keeping track of phases in idyllic
      type: 'StartsUsing',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: false },
      run: (data) => {
        data.twistedVisionCounter = data.twistedVisionCounter + 1;
      },
    },
    {
      id: 'R12S Phase Two ActorSetPos Tracker',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      condition: (data) => {
        if (
          data.phase === 'replication1' ||
          data.phase === 'replication2' ||
          data.phase === 'idyllic'
        )
          return true;
        return false;
      },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R12S Phase Two ActorMove Tracker',
      type: 'ActorMove',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      condition: (data) => {
        if (
          data.phase === 'replication1' ||
          data.phase === 'replication2' ||
          data.phase === 'idyllic'
        )
          return true;
        return false;
      },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R12S Phase Two AddedCombatant Tracker',
      type: 'AddedCombatant',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      condition: (data) => {
        if (
          data.phase === 'replication1' ||
          data.phase === 'replication2' ||
          data.phase === 'idyllic'
        )
          return true;
        return false;
      },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R12S The Fixer',
      type: 'StartsUsing',
      netRegex: { id: 'B4D7', source: 'Lindwurm', capture: false },
      durationSeconds: 4.7,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'R12S Directed Grotesquerie Direction Collect',
      // Unknown_DE6 spell contains data in its count:
      // 40C, Front Cone
      // 40D, Right Cone
      // 40E, Rear Cone
      // 40F, Left Cone
      type: 'GainsEffect',
      netRegex: { effectId: 'DE6', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        switch (matches.count) {
          case '40C':
            data.grotesquerieCleave = 'frontCleave';
            return;
          case '40D':
            data.grotesquerieCleave = 'rightCleave';
            return;
          case '40E':
            data.grotesquerieCleave = 'rearCleave';
            return;
          case '40F':
            data.grotesquerieCleave = 'leftCleave';
            return;
        }
      },
    },
    {
      id: 'R12S Shared Grotesquerie',
      type: 'GainsEffect',
      netRegex: { effectId: '129A', capture: true },
      delaySeconds: 0.2,
      durationSeconds: 17,
      infoText: (data, matches, output) => {
        const cleave = data.grotesquerieCleave;
        const target = matches.target;
        if (target === data.me) {
          if (cleave === undefined)
            return output.baitThenStack!({ stack: output.stackOnYou!() });
          return output.baitThenStackCleave!({
            stack: output.stackOnYou!(),
            cleave: output[cleave]!(),
          });
        }

        const isDPS = data.party.isDPS(target);
        if (isDPS && data.role === 'dps') {
          if (cleave === undefined)
            return output.baitThenStack!({
              stack: output.stack!(),
            });
          return output.baitThenStackCleave!({
            stack: output.stack!(),
            cleave: output[cleave]!(),
          });
        }
        if (!isDPS && data.role !== 'dps') {
          if (cleave === undefined)
            return output.baitThenStack!({
              stack: output.stack!(),
            });
          return output.baitThenStackCleave!({
            stack: output.stack!(),
            cleave: output[cleave]!(),
          });
        }
      },
      outputStrings: {
        stack: Outputs.stacks,
        stackOnYou: Outputs.stackOnYou,
        frontCleave: {
          en: 'Front Cleave',
          ja: '前方',
          ko: '앞',
        },
        rearCleave: {
          en: 'Rear Cleave',
          ja: '後方',
          ko: '뒤',
        },
        leftCleave: {
          en: 'Left Cleave',
          ja: '左方',
          ko: '왼쪽',
        },
        rightCleave: {
          en: 'Right Cleave',
          ja: '右方',
          ko: '오른쪽',
        },
        baitThenStack: {
          en: 'Bait 4x Puddles => ${stack}',
          ja: 'AOE誘導 x4 🔜 ${stack}',
          ko: '장판 x4 🔜 ${stack}',
        },
        baitThenStackCleave: {
          en: 'Bait 4x Puddles => ${stack} + ${cleave}',
          ja: 'AOE誘導 x4 🔜 ${stack} + ${cleave}扇',
          ko: '장판 x4 🔜 ${stack} + ${cleave} 꼬깔',
        },
      },
    },
    {
      id: 'R12S Bursting Grotesquerie',
      type: 'GainsEffect',
      netRegex: { effectId: '1299', capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.2,
      durationSeconds: 17,
      infoText: (data, _matches, output) => {
        const cleave = data.grotesquerieCleave;
        if (cleave === undefined)
          return data.phase === 'doorboss'
            ? output.baitThenSpread!()
            : output.spreadCurtain!();
        return data.phase === 'doorboss'
          ? output.baitThenSpreadCleave!({ cleave: output[cleave]!() })
          : output.spreadCurtain!();
      },
      outputStrings: {
        frontCleave: {
          en: 'Front Cleave',
          ja: '前方',
          ko: '앞',
        },
        rearCleave: {
          en: 'Rear Cleave',
          ja: '後方',
          ko: '뒤',
        },
        leftCleave: {
          en: 'Left Cleave',
          ja: '左方',
          ko: '왼쪽',
        },
        rightCleave: {
          en: 'Right Cleave',
          ja: '右方',
          ko: '오른쪽',
        },
        baitThenSpread: {
          en: 'Bait 4x Puddles => Spread',
          ja: 'AOE誘導 x4 🔜 散開',
          ko: '장판 x4 🔜 흩어져요',
        },
        baitThenSpreadCleave: {
          en: 'Bait 4x Puddles => Spread + ${cleave}',
          ja: 'AOE誘導 x4 🔜 散開 + ${cleave}扇',
          ko: '장판 x4 🔜 흩어져요 + ${cleave} 꼬깔',
        },
        spreadCurtain: {
          en: 'Spread Debuff on YOU',
          ja: '自分に散開デバフ',
          ko: '내게 흩어져요',
        },
      },
    },
    {
      id: 'R12S Ravenous Reach 1 Safe Side',
      // These two syncs indicate the animation of where the head will go to cleave
      // B49A => West Safe
      // B49B => East Safe
      type: 'Ability',
      netRegex: { id: ['B49A', 'B49B'], source: 'Lindwurm', capture: true },
      condition: (data) => data.phase === 'doorboss',
      durationSeconds: 6,
      infoText: (_data, matches, output) => {
        if (matches.id === 'B49A')
          return output.goWest!();
        return output.goEast!();
      },
      outputStrings: {
        goEast: {
          en: 'East',
          ja: '安置: 🡺東',
          ko: '안전: 🡺동쪽',
        },
        goWest: {
          en: 'West',
          ja: '安置: 🡸西',
          ko: '안전: 🡸서쪽',
        },
      },
    },
    {
      id: 'R12S Fourth-wall Fusion Stack',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['stack'], capture: true },
      condition: (data) => {
        if (data.role === 'tank')
          return false;
        return true;
      },
      durationSeconds: 5.1,
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R12S Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['tankbuster'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 5.1,
      response: Responses.tankBuster(),
    },
    {
      id: 'R12S In Line Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: ['BBC', 'BBD', 'BBE', 'D7B'] },
      run: (data, matches) => {
        const effectToNum: { [effectId: string]: number } = {
          BBC: 1,
          BBD: 2,
          BBE: 3,
          D7B: 4,
        } as const;
        const num = effectToNum[matches.effectId];
        if (num === undefined)
          return;
        data.inLine[matches.target] = num;
      },
    },
    {
      id: 'R12S Bonds of Flesh Flesh α/β Collect',
      // Bonds of Flesh has the following timings:
      // 1st -  26s
      // 2nd - 31s
      // 3rd - 36s
      // 4rth - 41s
      type: 'GainsEffect',
      netRegex: { effectId: ['1290', '1292'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        data.myFleshBonds = matches.effectId === '1290' ? 'alpha' : 'beta';
      },
    },
    {
      id: 'R12S In Line Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: ['BBC', 'BBD', 'BBE', 'D7B'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: 10,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        const flesh = data.myFleshBonds;
        if (flesh === undefined)
          return output.order!({ num: myNum });
        if (flesh === 'alpha') {
          switch (myNum) {
            case 1:
              return output.alpha1!();
            case 2:
              return output.alpha2!();
            case 3:
              return output.alpha3!();
            case 4:
              return output.alpha4!();
          }
        }
        switch (myNum) {
          case 1:
            return output.beta1!();
          case 2:
            return output.beta2!();
          case 3:
            return output.beta3!();
          case 4:
            return output.beta4!();
        }
      },
      outputStrings: {
        alpha1: {
          en: '1α: Wait for Tether 1',
          ko: '1α: 줄 #1',
        },
        alpha2: {
          en: '2α: Wait for Tether 2',
          ko: '2α: 줄 #2',
        },
        alpha3: {
          en: '3α: Blob Tower 1',
          ko: '3α: 안쪽 살덩이 #1',
        },
        alpha4: {
          en: '4α: Blob Tower 2',
          ko: '4α: 안쪽 살덩이 #2',
        },
        beta1: {
          en: '1β: Wait for Tether 1',
          ko: '1β: 줄 #1',
        },
        beta2: {
          en: '2β: Wait for Tether 2',
          ko: '2β: 줄 #2',
        },
        beta3: {
          en: '3β: Chain Tower 1',
          ko: '3β: 돌출 타워 #1',
        },
        beta4: {
          en: '4β: Chain Tower 2',
          ko: '4β: 돌출 타워 #2',
        },
        order: {
          en: '${num}',
          ja: '${num}',
          ko: '#${num}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R12S Phagocyte Spotlight Blob Tower Location Collect',
      // StartsUsing and StartsUsingExtra can have bad data, there is enough time that Ability is sufficient
      // Pattern 1
      // Blob 1: (104, 104) SE Inner
      // Blob 2: (96, 96) NW Inner
      // Blob 3: (85, 110) SW Outer
      // Blob 4: (115, 90) NE Outer
      // Pattern 2
      // Blob 1: (104, 96) NE Inner
      // Blob 2: (96, 104) SW Inner
      // Blob 3: (85, 90) NW Outer
      // Blob 4: (115, 110) SE Outer
      // Pattern 3
      // Blob 1: (96, 96) NW Inner
      // Blob 2: (104, 104) SE Inner
      // Blob 3: (115, 90) NE Outer
      // Blob 4: (85, 110) SW Outer
      // Pattern 4
      // Blob 1: (96, 104) SW Inner
      // Blob 2: (104, 96) NE Inner
      // Blob 3: (115, 110) SE Outer
      // Blob 4: (86, 90) NW Outer
      type: 'Ability',
      netRegex: { id: 'B4B6', capture: true },
      suppressSeconds: 10,
      run: (data, matches) => {
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const dir = Directions.xyToIntercardDirOutput(x, y, center.x, center.y);
        data.blobTowerDirs.push(dir);

        if (dir === 'dirSE') {
          data.blobTowerDirs.push('dirNW');
          data.blobTowerDirs.push('dirSW');
          data.blobTowerDirs.push('dirNE');
        } else if (dir === 'dirNE') {
          data.blobTowerDirs.push('dirSW');
          data.blobTowerDirs.push('dirNW');
          data.blobTowerDirs.push('dirSE');
        } else if (dir === 'dirNW') {
          data.blobTowerDirs.push('dirSE');
          data.blobTowerDirs.push('dirNE');
          data.blobTowerDirs.push('dirSW');
        } else if (dir === 'dirSW') {
          data.blobTowerDirs.push('dirNE');
          data.blobTowerDirs.push('dirSE');
          data.blobTowerDirs.push('dirNW');
        }
      },
    },
    {
      id: 'R12S Phagocyte Spotlight Blob Tower Location (Early)',
      // 23.8s until B4B7 Rolling Mass Blob Tower Hit
      // Only need to know first blob location
      type: 'Ability',
      netRegex: { id: 'B4B6', capture: false },
      condition: (data) => data.myFleshBonds === 'alpha',
      delaySeconds: 0.1,
      durationSeconds: (data) => {
        const myNum = data.inLine[data.me];
        // Timings based on next trigger
        switch (myNum) {
          case 1:
            return 17;
          case 2:
            return 22;
          case 3:
            return 18;
          case 4:
            return 18;
        }
      },
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;

        type index = {
          [key: number]: number;
        };
        const myNumToDirIndex: index = {
          1: 2,
          2: 3,
          3: 0,
          4: 1,
        };
        const dirIndex = myNumToDirIndex[myNum];
        if (dirIndex === undefined)
          return;
        const towerNum = dirIndex + 1;

        const dir = data.blobTowerDirs[dirIndex];
        if (dir === undefined)
          return;

        if (myNum > 2)
          return output.innerBlobTower!({
            num: towerNum,
            dir: output[dir]!(),
          });
        return output.outerBlobTower!({ num: towerNum, dir: output[dir]!() });
      },
      outputStrings: {
        ...dirAimStrings,
        innerBlobTower: {
          en: 'Blob Tower ${num} Inner ${dir} (later)',
          ko: '(나중에 살덩이 #${num}, 안쪽 ${dir})',
        },
        outerBlobTower: {
          en: 'Blob Tower ${num} Outer ${dir} (later)',
          ko: '(나중에 살덩이 #${num}, 바깥쪽 ${dir})',
        },
      },
    },
    /* 이거 필요없을거 같은데
    {
      id: 'R12S Cursed Coil Bind Draw-in',
      // Using Phagocyte Spotlight, 1st one happens 7s before bind
      // Delayed additionally to reduce overlap with alpha tower location calls
      type: 'Ability',
      netRegex: { id: 'B4B6', capture: false },
      delaySeconds: 3, // 5s warning
      suppressSeconds: 10,
      response: Responses.drawIn(),
    }, */
    {
      id: 'R12S Skinsplitter Counter',
      // These occur every 5s
      // Useful for blob tower tracking that happen 2s after
      // 2: Tether 1
      // 3: Tether 2 + Blob Tower 1
      // 4: Tether 3 + Blob Tower 2
      // 5: Tether 4 + Blob Tower 3
      // 6: Blob Tower 4
      // 7: Last time to exit
      type: 'Ability',
      netRegex: { id: 'B4BC', capture: false },
      suppressSeconds: 1,
      run: (data) => data.skinsplitterCount = data.skinsplitterCount + 1,
    },
    {
      id: 'R12S Cell Chain Counter',
      type: 'Tether',
      netRegex: { id: headMarkerData['cellChainTether'], capture: false },
      condition: (data) => data.phase === 'doorboss',
      run: (data) => data.cellChainCount = data.cellChainCount + 1,
    },
    {
      id: 'R12S Cell Chain Tether Number',
      // Helpful for players to keep track of which chain tower is next
      // Does not output when it is their turn to break the tether
      type: 'Tether',
      netRegex: { id: headMarkerData['cellChainTether'], capture: false },
      condition: (data) => {
        if (data.phase === 'doorboss' && data.myFleshBonds === 'beta')
          return data.triggerSetConfig.showGrotesquerieAct2Progress;
        return false;
      },
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        const num = data.cellChainCount;
        if (myNum !== num) {
          if (myNum === 1 && num === 3)
            return output.beta1Tower!({ num: num });
          if (myNum === 2 && num === 4)
            return output.beta2Tower!({ num: num });
          if (myNum === 3 && num === 1)
            return output.beta3Tower!({ num: num });
          if (myNum === 4 && num === 2)
            return output.beta4Tower!({ num: num });
          return output.tether!({ num: num });
        }

        if (myNum === undefined)
          return output.tether!({ num: num });
      },
      outputStrings: {
        tether: {
          en: 'Tether ${num}',
          ja: '線 ${num}',
          ko: '(줄 #${num})',
        },
        beta1Tower: {
          en: 'Tether ${num} => Chain Tower 3',
          ko: '(줄 #${num} 🔜 돌출 타워 #3)',
        },
        beta2Tower: {
          en: 'Tether ${num} => Chain Tower 4',
          ko: '(줄 #${num} 🔜 돌출 타워 #4)',
        },
        beta3Tower: {
          en: 'Tether ${num} => Chain Tower 1',
          ko: '(줄 #${num} 🔜 돌출 타워 #1)',
        },
        beta4Tower: {
          en: 'Tether ${num} => Chain Tower 2',
          ko: '(줄 #${num} 🔜 돌출 타워 #2)',
        },
      },
    },
    {
      id: 'R12S Chain Tower Number',
      // Using B4B4 Dramatic Lysis to detect chain broken
      type: 'Ability',
      netRegex: { id: 'B4B4', capture: false },
      condition: (data) => {
        if (data.phase === 'doorboss' && data.myFleshBonds === 'beta')
          return true;
        return false;
      },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const mechanicNum = data.cellChainCount;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;

        type index = {
          [key: number]: number;
        };
        const myNumToOrder: index = {
          1: 3,
          2: 4,
          3: 1,
          4: 2,
        };

        const myOrder = myNumToOrder[myNum];
        if (myOrder === undefined)
          return;

        if (myOrder === mechanicNum)
          return output.tower!({ num: mechanicNum });
      },
      outputStrings: {
        tower: {
          en: 'Get Chain Tower ${num}',
          ko: '밟아요: 돌출 타워 #${num}',
        },
      },
    },
    {
      id: 'R12S Bonds of Flesh Flesh α First Two Towers',
      // These are not dependent on player timings and so can be hard coded by duration
      type: 'GainsEffect',
      netRegex: { effectId: '1290', capture: true },
      condition: (data, matches) => {
        if (matches.target === data.me) {
          const duration = parseFloat(matches.duration);
          if (duration < 35)
            return false;
          return true;
        }
        return false;
      },
      delaySeconds: (_data, matches) => {
        const duration = parseFloat(matches.duration);
        // The following gives 5s warning to take tower
        if (duration > 37)
          return 31; // Alpha4 Time
        return 26; // Alpha3 Time
      },
      alertText: (data, matches, output) => {
        const duration = parseFloat(matches.duration);
        const dir = data.blobTowerDirs[duration > 40 ? 1 : 0];
        if (duration > 40) {
          if (dir !== undefined)
            return output.alpha4Dir!({ dir: output[dir]!() });
          return output.alpha4!();
        }
        if (dir !== undefined)
          return output.alpha3Dir!({ dir: output[dir]!() });
        return output.alpha3!();
      },
      outputStrings: {
        ...dirAimStrings,
        alpha3: {
          en: 'Get Blob Tower 1',
          ko: '밟아요: 살덩이 #1',
        },
        alpha4: {
          en: 'Get Blob Tower 2',
          ko: '밟아요: 살덩이 #2',
        },
        alpha3Dir: {
          en: 'Get Blob Tower 1 (Inner ${dir})',
          ko: '밟아요: 안쪽 살덩이 #1 (${dir})',
        },
        alpha4Dir: {
          en: 'Get Blob Tower 2 (Inner ${dir})',
          ko: '밟아요: 안쪽 살덩이 #2 (${dir})',
        },
      },
    },
    {
      id: 'R12S Unbreakable Flesh α/β Chains and Last Two Towers',
      type: 'GainsEffect',
      netRegex: { effectId: ['1291', '1293'], capture: true },
      condition: (data, matches) => {
        if (matches.target === data.me && data.phase === 'doorboss')
          return true;
        return false;
      },
      alertText: (data, matches, output) => {
        const myNum = data.inLine[data.me];
        const flesh = matches.effectId === '1291' ? 'alpha' : 'beta';
        if (flesh === 'alpha') {
          if (myNum === 1) {
            const dir = data.blobTowerDirs[2];
            if (dir !== undefined)
              return output.alpha1Dir!({ dir: output[dir]!() });
          }
          if (myNum === 2) {
            const dir = data.blobTowerDirs[3];
            if (dir !== undefined)
              return output.alpha2Dir!({ dir: output[dir]!() });
          }

          // dir undefined or 3rd/4rth in line
          switch (myNum) {
            case 1:
              return output.alpha1!();
            case 2:
              return output.alpha2!();
            case 3:
              return output.alpha3!();
            case 4:
              return output.alpha4!();
          }
        }
        switch (myNum) {
          case 1:
            return output.beta1!();
          case 2:
            return output.beta2!();
          case 3:
            return output.beta3!();
          case 4:
            return output.beta4!();
        }
        return output.getTowers!();
      },
      outputStrings: {
        ...dirAimStrings,
        getTowers: Outputs.getTowers,
        alpha1: {
          en: 'Break Chains 1 + Blob Tower 3 (Outer)',
          ko: '나가면서 끊어요: 줄 #1 🔜 살덩이 #3',
        },
        alpha1Dir: {
          en: 'Break Chains 1 + Blob Tower 3 (Outer ${dir})',
          ko: '나가면서 끊어요: 줄 #1 🔜 살덩이 #3 (${dir})',
        },
        alpha2: {
          en: 'Break Chains 2 + Blob Tower 4 (Outer)',
          ko: '나가면서 끊어요: 줄 #2 🔜 살덩이 #4',
        },
        alpha2Dir: {
          en: 'Break Chains 2 + Blob Tower 4 (Outer ${dir})',
          ko: '나가면서 끊어요: 줄 #2 🔜 살덩이 #4 (${dir})',
        },
        alpha3: {
          en: 'Break Chains 3 + Get Out',
          ko: '나가면서 끊어요: 줄 #3',
        },
        alpha4: {
          en: 'Break Chains 4 + Get Out',
          ko: '나가면서 끊어요: 줄 #4',
        },
        beta1: {
          en: 'Break Chains 1 => Get Middle',
          ko: '안에서 끊어요: 줄 #1 🔜 가운데로',
        },
        beta2: {
          en: 'Break Chains 2 => Get Middle',
          ko: '안에서 끊어요: 줄 #2 🔜 가운데로',
        },
        beta3: {
          en: 'Break Chains 3 => Wait for last pair',
          ko: '안에서 끊어요: 줄 #3 🔜 마지막에 탈출',
        },
        beta4: {
          en: 'Break Chains 4 => Get Out',
          ko: '안에서 끊어요: 줄 #4 🔜 탈출해요!',
        },
      },
    },
    {
      id: 'R12S Chain Tower Followup',
      // Using B4B3 Roiling Mass to detect chain tower soak
      // Beta player leaving early may get hit by alpha's chain break aoe
      type: 'Ability',
      netRegex: { id: 'B4B3', capture: true },
      condition: (data, matches) => {
        if (data.myFleshBonds === 'beta' && data.me === matches.target)
          return true;
        return false;
      },
      infoText: (data, _matches, output) => {
        // Possibly the count could be off if break late (giving damage and damage down)
        // Ideal towers are soaked:
        // Beta 1 at 5th Skinsplitter
        // Beta 2 at 6th Skinsplitter
        // Beta 3 at 3rd Skinsplitter
        // Beta 4 at 4rth Skinsplitter
        const mechanicNum = data.skinsplitterCount;
        const myNum = data.inLine[data.me];
        if (myNum === undefined) {
          // This can be corrected by the player later
          if (mechanicNum < 5)
            return output.goIntoMiddle!();
          return output.getOut!();
        }

        if (mechanicNum < 5) {
          if (myNum === 1)
            return output.beta1Middle!();
          if (myNum === 2)
            return output.beta2Middle!();
          if (myNum === 3)
            return output.beta3Middle!();
          if (myNum === 4)
            return output.beta4Middle!();
        }
        if (myNum === 1)
          return output.beta1Out!();
        if (myNum === 2)
          return output.beta2Out!();
        if (myNum === 3)
          return output.beta3Out!();
        if (myNum === 4)
          return output.beta4Out!();
      },
      outputStrings: {
        getOut: {
          en: 'Get Out',
          ja: '外へ',
          ko: '밖으로 나가요',
        },
        goIntoMiddle: Outputs.goIntoMiddle,
        beta1Middle: Outputs.goIntoMiddle,
        beta2Middle: Outputs.goIntoMiddle, // Should not happen under ideal situation
        beta3Middle: Outputs.goIntoMiddle,
        beta4Middle: Outputs.goIntoMiddle,
        beta1Out: { // Should not happen under ideal situation
          en: 'Get Out',
          ja: '外へ',
          ko: '밖으로 나가요',
        },
        beta2Out: {
          en: 'Get Out',
          ja: '外へ',
          ko: '밖으로 나가요',
        },
        beta3Out: { // Should not happen under ideal situation
          en: 'Get Out',
          ja: '外へ',
          ko: '밖으로 나가요',
        },
        beta4Out: { // Should not happen under ideal situation
          en: 'Get Out',
          ja: '外へ',
          ko: '밖으로 나가요',
        },
      },
    },
    {
      id: 'R12S Blob Tower Followup',
      // Using B4B7 Roiling Mass to detect chain tower soak
      // Alpha 3 and Alpha 4 get the inner towers before their chains
      type: 'Ability',
      netRegex: { id: 'B4B7', capture: true },
      condition: (data, matches) => {
        if (data.myFleshBonds === 'alpha' && data.me === matches.target)
          return true;
        return false;
      },
      infoText: (data, _matches, output) => {
        const mechanicNum = data.skinsplitterCount;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;

        if (myNum === mechanicNum)
          return output.goIntoMiddle!();
      },
      outputStrings: {
        goIntoMiddle: Outputs.goIntoMiddle,
      },
    },
    {
      id: 'R12S Splattershed',
      type: 'StartsUsing',
      netRegex: { id: ['B9C3', 'B9C4'], source: 'Lindwurm', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R12S Mitotic Phase Direction Collect',
      // Unknown_DE6 spell contains data in its count
      type: 'GainsEffect',
      netRegex: { effectId: 'DE6', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        data.myMitoticPhase = matches.count;
        switch (matches.count) {
          case '436':
            return output.frontTower!();
          case '437':
            return output.rightTower!();
          case '438':
            return output.rearTower!();
          case '439':
            return output.leftTower!();
        }
      },
      outputStrings: {
        frontTower: {
          en: 'Tower (S/SW)',
          ko: '내 바닥: 🡻남/🡿남서',
        },
        rearTower: {
          en: 'Tower (N/NE)',
          ko: '내 바닥: 🡹북/🡽북동',
        },
        leftTower: {
          en: 'Tower (E/SE)',
          ko: '내 바닥: 🡺동/🡾남동',
        },
        rightTower: {
          en: 'Tower (W/NW)',
          ko: '내 바닥: 🡸서/🡼북서',
        },
      },
    },
    {
      id: 'R12S Grand Entrance Intercards/Cardinals',
      // B4A1 is only cast when cardinals are safe
      // B4A2 is only cast when intercardinals are safe
      // These casts more than once, so just capture first event
      type: 'StartsUsing',
      netRegex: { id: ['B4A1', 'B4A2'], capture: true },
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        const count = data.myMitoticPhase;
        if (count === undefined)
          return;
        const dir = grandCountMap[count];
        if (dir === undefined)
          return output.unknown!();
        const type = matches.id === 'B4A1' ? 'Cardinals' : 'Intercards';
        const res = output[`${dir}${type}`]!();
        return output[`type${type}`]!({ dir: res });
      },
      outputStrings: {
        frontIntercards: Outputs.aimSW,
        rearIntercards: Outputs.aimNE,
        leftIntercards: Outputs.aimSE,
        rightIntercards: Outputs.aimNW,
        frontCardinals: Outputs.aimS,
        rearCardinals: Outputs.aimN,
        leftCardinals: Outputs.aimE,
        rightCardinals: Outputs.aimW,
        typeCardinals: {
          en: 'Cardinal: ${dir}',
          ko: '➕십자 ${dir}쪽으로',
        },
        typeIntercards: {
          en: 'Intercardinal: ${dir}',
          ko: '❌비스듬히 ${dir}쪽으로',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R12S Rotting Flesh',
      type: 'GainsEffect',
      netRegex: { effectId: '129B', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Rotting Flesh on YOU',
          ko: '🟣보라, 공격 맞아요!',
        },
      },
    },
    {
      id: 'R12S Rotting Flesh Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '129B', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.hasRot = true,
    },
    {
      id: 'R12S Ravenous Reach 2',
      // These two syncs indicate the animation of where the head will go to cleave
      // B49A => West Safe
      // B49B => East Safe
      type: 'Ability',
      netRegex: { id: ['B49A', 'B49B'], source: 'Lindwurm', capture: true },
      condition: (data) => data.phase === 'curtainCall',
      alertText: (data, matches, output) => {
        if (matches.id === 'B49A') {
          return data.hasRot ? output.getHitEast!() : output.safeWest!();
        }
        return data.hasRot ? output.getHitWest!() : output.safeEast!();
      },
      outputStrings: {
        getHitWest: {
          en: 'Spread in West Cleave',
          ko: '🡸서쪽에서 흩어져요 + 공격 맞아요',
        },
        getHitEast: {
          en: 'Spread in East Cleave',
          ko: '🡺동쪽에서 흩어져요 + 공격 맞아요',
        },
        safeEast: {
          en: 'Spread East + Avoid Cleave',
          ko: '🡺동쪽에서 흩어져요',
        },
        safeWest: {
          en: 'Spread West + Avoid Cleave',
          ko: '🡸서쪽에서 흩어져요',
        },
      },
    },
    {
      id: 'R12S Split Scourge and Venomous Scourge',
      // B4AB Split Scourge and B4A8 Venomous Scourge are instant casts
      // This actor control happens along with boss becoming targetable
      // Seems there are two different data0 values possible:
      // 1E01: Coming back from Cardinal platforms
      // 1E001: Coming back from Intercardinal platforms
      type: 'ActorControl',
      netRegex: { command: '8000000D', data0: ['1E01', '1E001'], capture: false },
      durationSeconds: 9,
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tank!();
        if (data.role === 'healer')
          return output.healer!();
        return output.party!();
      },
      outputStrings: {
        tank: {
          en: 'Bait Line AoE from heads',
          ko: '맨 앞에서 머리 빔 무적',
        },
        healer: Outputs.goIntoMiddle,
        party: {
          en: 'Spread, Away from heads',
          ko: '맡은 자리로 흩어져요',
        },
      },
    },
    {
      id: 'R12S Grotesquerie: Curtain Call Spreads',
      type: 'StartsUsing',
      netRegex: { id: 'BEC0', source: 'Lindwurm', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait 5x Puddles',
          ko: '장판 유도 x5',
        },
      },
    },
    {
      id: 'R12S Curtain Call: Unbreakable Flesh α Chains',
      // All players, including dead, receive α debuffs
      // TODO: Find safe spots
      type: 'GainsEffect',
      netRegex: { effectId: '1291', capture: true },
      condition: (data, matches) => {
        if (matches.target === data.me && data.phase === 'curtainCall')
          return true;
        return false;
      },
      infoText: (_data, _matches, output) => {
        return output.alphaChains!();
      },
      outputStrings: {
        alphaChains: {
          en: 'Break Chains => Avoid Blobs',
          ko: '줄 끊고 🔜 살덩이 피해요',
        },
      },
    },
    {
      id: 'R12S Slaughtershed',
      type: 'StartsUsing',
      netRegex: { id: ['B4C6', 'B4C3'], source: 'Lindwurm', capture: false },
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'R12S Slaughtershed Stack',
      // TODO: Get Safe spot
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['slaughterStack'], capture: true },
      condition: (data, matches) => {
        const isDPS = data.party.isDPS(matches.target);
        if (isDPS && data.role === 'dps')
          return true;
        if (!isDPS && data.role !== 'dps')
          return true;
        return false;
      },
      durationSeconds: 4.5,
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R12S Slaughtershed Spread',
      // TODO: Get Safe spot
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['slaughterSpread'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 4.5,
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    {
      id: 'R12S Serpintine Scourge Right Hand First',
      // Left Hand first, then Right Hand
      type: 'Ability',
      netRegex: { id: 'B4CB', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'slaughtershed',
      delaySeconds: 6.5,
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.rightThenLeft!(),
      outputStrings: {
        rightThenLeft: Outputs.rightThenLeft,
      },
    },
    {
      id: 'R12S Serpintine Scourge Left Hand First',
      // Right Hand first, then Left Hand
      type: 'Ability',
      netRegex: { id: 'B4CD', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'slaughtershed',
      delaySeconds: 6.5,
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.leftThenRight!(),
      outputStrings: {
        leftThenRight: Outputs.leftThenRight,
      },
    },
    {
      id: 'R12S Raptor Knuckles Right Hand First',
      // Right Hand first, then Left Hand
      type: 'Ability',
      netRegex: { id: 'B4CC', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'slaughtershed',
      delaySeconds: 5,
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback from Northwest => Knockback from Northeast',
          ko: '🡼북서 넉백 🔜 🡽북동 넉백',
        },
      },
    },
    {
      id: 'R12S Raptor Knuckles Left Hand First',
      // Left Hand first, then Right Hand
      type: 'Ability',
      netRegex: { id: 'B4CE', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'slaughtershed',
      delaySeconds: 5,
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback from Northeast => Knockback from Northwest',
          ko: '🡽북동 넉백 🔜 🡼북서 넉백',
        },
      },
    },
    {
      id: 'R12S Raptor Knuckles Uptime Knockback',
      // First knockback is at ~13.374s
      // Second knockback is at ~17.964s
      // Use knockback at ~11.5s to hit both with ~1.8s leniency
      // ~11.457s before is too late as it comes off the same time as hit
      // ~11.554s before works (surecast ends ~0.134 after hit)
      type: 'Ability',
      netRegex: { id: ['B4CC', 'B4CE'], source: 'Lindwurm', capture: false },
      condition: (data) => {
        if (data.phase === 'slaughtershed' && data.triggerSetConfig.uptimeKnockbackStrat)
          return true;
        return false;
      },
      delaySeconds: 11.5,
      durationSeconds: 1.8,
      response: Responses.knockback(),
    },
    {
      id: 'R12S Refreshing Overkill',
      // 10s castTime that could end with enrage or raidwide
      type: 'StartsUsing',
      netRegex: { id: 'B538', source: 'Lindwurm', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      durationSeconds: 4.7,
      response: Responses.bigAoe('alert'),
    },
    // Phase 2
    {
      id: 'R12S Arcadia Aflame',
      type: 'StartsUsing',
      netRegex: { id: 'B528', source: 'Lindwurm', capture: false },
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'R12S Winged Scourge',
      // B4DA E/W clones Facing S, Cleaving Front/Back (North/South)
      // B4DB N/S clones Facing W, Cleaving Front/Back (East/West)
      type: 'StartsUsing',
      netRegex: { id: ['B4DA', 'B4DB'], source: 'Lindschrat', capture: true },
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        if (matches.id === 'B4DA') {
          if (data.replication1FollowUp)
            return output.northSouthCleaves2!();
          return output.northSouthCleaves!();
        }
        if (data.replication1FollowUp)
          return output.eastWestCleaves2!();
        return output.eastWestCleaves!();
      },
      outputStrings: {
        northSouthCleaves: {
          en: 'North/South Cleaves',
          ko: '남북으로 쪼개기',
        },
        eastWestCleaves: {
          en: 'East/West Cleaves',
          ko: '동서로 쪼개기',
        },
        northSouthCleaves2: {
          en: 'North/South Cleaves',
          ko: '남북으로 쪼개기',
        },
        eastWestCleaves2: {
          en: 'East/West Cleaves',
          ko: '동서로 쪼개기',
        },
      },
    },
    {
      id: 'R12S Fire and Dark Resistance Down II Collector',
      // CFB Dark Resistance Down II
      // B79 Fire Resistance Down II
      type: 'GainsEffect',
      netRegex: { effectId: ['CFB', 'B79'], capture: true },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 9999,
      run: (data, matches) => {
        data.replication1Debuff = matches.effectId === 'CFB' ? 'dark' : 'fire';
      },
    },
    {
      id: 'R12S Fire and Dark Resistance Down II',
      // CFB Dark Resistance Down II
      // B79 Fire Resistance Down II
      type: 'GainsEffect',
      netRegex: { effectId: ['CFB', 'B79'], capture: true },
      condition: (data, matches) => {
        if (data.me === matches.target)
          return !data.replication1FollowUp;
        return false;
      },
      suppressSeconds: 9999,
      infoText: (_data, matches, output) => {
        return matches.effectId === 'CFB' ? output.dark!() : output.fire!();
      },
      outputStrings: {
        fire: {
          en: 'Fire Debuff: Spread near Dark (later)',
          ko: '(🔥불: 어둠에서 흩어져요)',
        },
        dark: {
          en: 'Dark Debuff: Stack near Fire (later)',
          ko: '(🟣어둠: 불에서 페어)',
        },
      },
    },
    {
      id: 'R12S Fake Fire Resistance Down II',
      // Two players will not receive a debuff, they will need to act as if they had
      // Mechanics happen across 1.1s
      type: 'GainsEffect',
      netRegex: { effectId: ['CFB', 'B79'], capture: false },
      condition: (data) => !data.replication1FollowUp,
      delaySeconds: 1.2, // +0.1s Delay for debuff/damage propagation
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        if (data.replication1Debuff === undefined)
          return output.noDebuff!();
      },
      outputStrings: {
        noDebuff: {
          en: 'No Debuff: Spread near Dark (later)',
          ko: '(무직: 어둠에서 흩어져요)',
        },
      },
    },
    {
      id: 'R12S Snaking Kick',
      // Targets random player
      type: 'StartsUsing',
      netRegex: { id: 'B527', source: 'Lindwurm', capture: true },
      condition: (data) => {
        // Use Grotesquerie trigger for projection tethered players
        const ability = data.myReplication2Tether;
        if (ability === headMarkerData['projectionTether'])
          return false;
        return true;
      },
      delaySeconds: 0.1, // Need to delay for actor position update
      alertText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.getBehind!();

        const dirNum = (Directions.hdgTo16DirNum(actor.heading) + 8) % 16;
        const dir = Directions.output16Dir[dirNum] ?? 'unknown';
        return output.getBehindDir!({
          dir: output[dir]!(),
          mech: output.getBehind!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        getBehind: Outputs.getBehind,
        getBehindDir: {
          en: '${dir}: ${mech}',
          ko: '${dir} ${mech}',
        },
      },
    },
    {
      id: 'R12S Replication 1 Follow-up Tracker',
      // Tracking from B527 Snaking Kick
      type: 'Ability',
      netRegex: { id: 'B527', source: 'Lindwurm', capture: false },
      suppressSeconds: 9999,
      run: (data) => data.replication1FollowUp = true,
    },
    {
      id: 'R12S Top-Tier Slam Actor Collect',
      // Fire NPCs always move in the first Set
      // Locations are static
      // Fire => Dark => Fire => Dark
      // Dark => Fire => Dark => Fire
      // The other 4 cleave in a line
      // (90, 90)           (110, 90)
      //      (95, 95)  (105, 95)
      //             Boss
      //      (95, 100) (105, 105)
      // (90, 110)          (110, 110)
      // ActorMove ~0.3s later will have the data
      // ActorSet from the clones splitting we can infer the fire entities since their positions and headings are not perfect
      type: 'Ability',
      netRegex: { id: 'B4D9', source: 'Lindschrat', capture: true },
      condition: (data, matches) => {
        if (data.replication1FollowUp) {
          const pos = data.actorPositions[matches.sourceId];
          if (pos === undefined)
            return false;
          // These values should be 0 if coords are x.0000
          const xFilter = pos.x % 1;
          const yFilter = pos.y % 1;
          if (xFilter === 0 && yFilter === 0 && pos.heading === -0.0001)
            return false;
          return true;
        }
        return false;
      },
      suppressSeconds: 9999, // Only need one of the two
      run: (data, matches) => data.replication1FireActor = matches.sourceId,
    },
    {
      id: 'R12S Top-Tier Slam/Mighty Magic Locations',
      type: 'Ability',
      netRegex: { id: 'B4D9', source: 'Lindschrat', capture: false },
      condition: (data) => {
        if (data.replication1FollowUp && data.replication1FireActor !== undefined)
          return true;
        return false;
      },
      delaySeconds: 1, // Data is sometimes not available right away
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        const fireId = data.replication1FireActor;
        if (fireId === undefined)
          return;

        const actor = data.actorPositions[fireId];
        if (actor === undefined)
          return;

        const x = actor.x;
        const dirNum = Directions.xyTo8DirNum(x, actor.y, center.x, center.y);
        const dir1 = Directions.output8Dir[dirNum] ?? 'unknown';
        const dirNum2 = (dirNum + 4) % 8;
        const dir2 = Directions.output8Dir[dirNum2] ?? 'unknown';

        // Check if combatant moved to inner or outer
        const isIn = (x > 94 && x < 106);
        const fireIn = isIn ? dir1 : dir2;
        const fireOut = isIn ? dir2 : dir1;

        if (data.replication1Debuff === 'dark') {
          if (Autumn.inMelee(data.moks))
            return output.fireAt!({ dir: output[fireIn]!() });
          if (Autumn.inRange(data.moks))
            return output.fireAt!({ dir: output[fireOut]!() });
          return output.fire!({
            dir1: output[fireIn]!(),
            dir2: output[fireOut]!(),
          });
        }

        // Dark will be opposite pattern of Fire
        const darkIn = isIn ? dir2 : dir1;
        const darkOut = isIn ? dir1 : dir2;

        // Fire debuff players and unmarked bait Dark
        if (Autumn.inMelee(data.moks))
          return output.darkAt!({ dir: output[darkIn]!() });
        if (Autumn.inRange(data.moks))
          return output.darkAt!({ dir: output[darkOut]!() });
        return output.dark!({
          dir1: output[darkIn]!(),
          dir2: output[darkOut]!(),
        });
      },
      outputStrings: {
        ...markerStrings, // Cardinals should result in '???'
        fire: {
          en: 'Bait Fire In ${dir1}/Out ${dir2} (Partners)',
          ko: '🔥불 페어: ${dir1} ${dir2}',
        },
        dark: {
          en: 'Bait Dark In ${dir1}/Out ${dir2} (Solo)',
          ko: '🟣어둠 홀로: ${dir1} ${dir2}',
        },
        fireAt: {
          en: 'Bait Fire ${dir}',
          ko: '🔥불 페어: ${dir}쪽',
        },
        darkAt: {
          en: 'Bait Dark ${dir}',
          ko: '🟣어둠 홀로: ${dir}쪽',
        },
      },
    },
    {
      id: 'R12S Double Sobat',
      // Shared half-room cleave on tank => random turn half-room cleave =>
      // Esoteric Finisher big circle aoes that hits two highest emnity targets
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['sharedTankbuster'], capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R12S Double Sobat 2',
      // Followup half-room cleave:
      // B521 Double Sobat: 0 degree left turn then B525
      // B522 Double Sobat: 90 degree left turn then B525
      // B523 Double Sobat: 180 degree left turn then B525
      // B524 Double Sobat: 270 degree left turn (this ends up 90 degrees to the right)
      type: 'Ability',
      netRegex: { id: ['B521', 'B522', 'B523', 'B524'], source: 'Lindwurm', capture: true },
      suppressSeconds: 1,
      alertText: (_data, matches, output) => {
        const hdg = parseFloat(matches.heading);
        const dirNum = Directions.hdgTo16DirNum(hdg);
        const getNewDirNum = (
          dirNum: number,
          id: string,
        ): number => {
          switch (id) {
            case 'B521':
              return dirNum;
            case 'B522':
              return dirNum - 4;
            case 'B523':
              return dirNum - 8;
            case 'B524':
              return dirNum - 12;
          }
          throw new UnreachableCode();
        };

        // Adding 16 incase of negative values
        const newDirNum = (getNewDirNum(dirNum, matches.id) + 16 + 8) % 16;

        const dir = Directions.output16Dir[newDirNum] ?? 'unknown';
        return output.getBehindDir!({
          dir: output[dir]!(),
          mech: output.getBehind!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        getBehind: Outputs.getBehind,
        getBehindDir: {
          en: '${dir}: ${mech}',
          ko: '${dir} ${mech}',
        },
      },
    },
    {
      id: 'R12S Esoteric Finisher',
      // After Double Sobat 2, boss hits targets highest emnity target, second targets second highest
      type: 'StartsUsing',
      netRegex: { id: 'B525', source: 'Lindwurm', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankBusterCleaves: Outputs.tankBusterCleaves,
          avoidTankCleaves: Outputs.avoidTankCleaves,
        };

        if (data.role === 'tank' || data.role === 'healer') {
          if (data.role === 'healer')
            return { infoText: output.tankBusterCleaves!() };
          return { alertText: output.tankBusterCleaves!() };
        }
        return { infoText: output.avoidTankCleaves!() };
      },
    },
    {
      id: 'R12S Replication 2 Tethered Clone',
      // Combatants are added ~4s before Staging starts casting
      // Same tether ID is used for "locked" ability tethers
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.cloneTether!();

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        data.ushikoDir = Directions.output8Dir[dirNum] ?? 'unknown';
        return output.cloneTetherDir!({ dir: output[data.ushikoDir]!() });
      },
      outputStrings: {
        unknown: Outputs.unknown,
        dirN: {
          en: 'West Cone',
          ko: '🄰🡸 꼬깔 (반시계)',
        },
        dirE: {
          en: 'North Boss',
          ko: '🄱🡹 보스',
        },
        dirS: {
          en: 'East Cone',
          ko: '🄲🡺 꼬깔 (시계)',
        },
        dirW: {
          en: 'South None',
          ko: '🄳🡻 무직',
        },
        dirNW: {
          en: 'Southwest Defamation',
          ko: '➊🡿 큰폭발 (반시계◉︎)',
        },
        dirNE: {
          en: 'Northwest Stack',
          ko: '➋🡼 뭉쳐요 (반시계🀜)',
        },
        dirSE: {
          en: 'Northeast Stack',
          ko: '➌🡽 뭉쳐요 (시계🀜)',
        },
        dirSW: {
          en: 'Southeast Defamation',
          ko: '➍🡾 큰폭발 (시계◉︎)',
        },
        cloneTether: {
          en: 'Tethered to Clone',
          ko: '내 분신 쪽으로',
        },
        cloneTetherDir: {
          en: 'Tethered to ${dir} Clone',
          ko: '${dir}',
        },
      },
    },
    {
      id: 'R12S Replication 2 and Replication 4 Ability Tethers Collect',
      // Record and store a map of where the tethers come from and what they do for later
      // Boss tether handled separately since boss can move around
      type: 'Tether',
      netRegex: {
        id: [
          headMarkerData['projectionTether'],
          headMarkerData['manaBurstTether'],
          headMarkerData['heavySlamTether'],
        ],
        capture: true,
      },
      condition: (data) => {
        if (data.phase === 'replication2' || data.phase === 'idyllic')
          return true;
        return false;
      },
      run: (data, matches) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return;
        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        if (data.phase === 'replication2')
          data.replication2TetherMap[dirNum] = matches.id;
        if (data.phase === 'idyllic')
          data.replication4DirNumAbility[dirNum] = matches.id;
      },
    },
    /* {
      id: 'R12S Replication 2 Ability Tethers Initial Call',
      이거는 써봣자 혼란만 올뿐.
    }, */
    {
      id: 'R12S Replication 2 Locked Tether 2 Collect',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data, matches) => {
        if (
          data.phase === 'replication2' &&
          data.replicationCounter === 2 &&
          data.me === matches.target
        )
          return true;
        return false;
      },
      run: (data, matches) => {
        // Check if boss tether
        if (data.replication2BossId === matches.sourceId) {
          data.myReplication2Tether = headMarkerData['fireballSplashTether'];
          return;
        }

        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined) {
          // Setting to use that we know we have a tether but couldn't determine what ability it is
          data.myReplication2Tether = 'unknown';
          return;
        }

        const dirNum = Directions.xyTo8DirNum(
          actor.x,
          actor.y,
          center.x,
          center.y,
        );

        // Lookup what the tether was at the same location
        const ability = data.replication2TetherMap[dirNum];
        if (ability === undefined) {
          // Setting to use that we know we have a tether but couldn't determine what ability it is
          data.myReplication2Tether = 'unknown';
          return;
        }
        data.myReplication2Tether = ability;
      },
    },
    {
      id: 'R12S Replication 2 Locked Tether 2',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data, matches) => {
        if (
          data.phase === 'replication2' &&
          data.replicationCounter === 2 &&
          data.me === matches.target
        )
          return true;
        return false;
      },
      delaySeconds: 0.1,
      infoText: (data, matches, output) => {
        // Check if it's the boss
        if (data.replication2BossId === matches.sourceId)
          return output.fireballSplashTether!();

        switch (data.myReplication2Tether) {
          case headMarkerData['projectionTether']:
            return output.projectionTether!();
          case headMarkerData['manaBurstTether']:
            return output.manaBurstTether!();
          case headMarkerData['heavySlamTether']:
            return output.heavySlamTether!();
        }
      },
      outputStrings: {
        projectionTether: {
          en: 'Cone Tether: Bait Protean from Boss',
          ko: '바깥 꼬깔 유도: 외측',
        },
        manaBurstTether: {
          en: 'Defamation Tether',
          ko: '큰폭발 유도',
        },
        heavySlamTether: {
          en: 'Cone Tether: Bait Protean from Boss',
          ko: '바깥 꼬깔 유도: 내측',
        },
        fireballSplashTether: {
          en: 'Boss Tether: Bait Jump',
          ko: '보스 줄: 점프 유도',
        },
      },
    },
    {
      id: 'R12S Replication 2 Mana Burst Target',
      // A player without a tether will be target for defamation
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: false },
      condition: (data) => {
        if (data.phase === 'replication2' && data.replicationCounter === 2)
          return true;
        return false;
      },
      delaySeconds: 0.2,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.myReplication2Tether !== undefined)
          return;
        return output.noTether!();
      },
      outputStrings: {
        noTether: {
          en: 'Bait Defamation => Stack Groups',
          ko: '🄳🡻 큰폭발 유도 🔜 ➋ 뭉쳐요',
        },
      },
    },
    {
      id: 'R12S Heavy Slam',
      // After B4E7 Mana Burst, Groups must stack up on the heavy slam targetted players
      type: 'Ability',
      netRegex: { id: 'B4E7', source: 'Lindwurm', capture: false },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        let side = '';
        const ability = data.myReplication2Tether;
        switch (ability) {
          case headMarkerData['projectionTether']:
            if (data.ushikoDir === 'dirS')
              side = output.mark3!();
            else if (data.ushikoDir === 'dirN')
              side = output.mark2!();
            break;
          case headMarkerData['manaBurstTether']:
            if (data.ushikoDir === 'dirSW')
              side = output.mark3!();
            else if (data.ushikoDir === 'dirNW')
              side = output.mark2!();
            break;
          case headMarkerData['heavySlamTether']:
            if (data.ushikoDir === 'dirSE')
              side = output.mark3!();
            else if (data.ushikoDir === 'dirNE')
              side = output.mark2!();
            break;
          case headMarkerData['fireballSplashTether']:
            side = output.mark3!();
            break;
          default: // 무직
            side = output.mark2!();
            break;
        }
        return output.text!({ side: side });
      },
      outputStrings: {
        mark2: {
          en: 'Left Side',
          ko: '➋',
        },
        mark3: {
          en: 'Right Side',
          ko: '➌',
        },
        text: {
          en: '${side} Stack Groups => Get Behind',
          ko: '${side} 뭉쳤다 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'R12S Grotesquerie',
      // This seems to be the point at which the look for the Snaking Kick is snapshot
      // The VFX B4E9 happens ~0.6s before Snaking Kick
      // B4EA has the targetted player in it
      // B4EB Hemorrhagic Projection conal aoe goes off ~0.5s after in the direction the player was facing
      type: 'Ability',
      netRegex: { id: 'B4EA', source: 'Lindwurm', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        // Get Boss facing
        const bossId = data.replication2BossId;
        if (bossId === undefined)
          return output.getBehind!();

        const actor = data.actorPositions[bossId];
        if (actor === undefined)
          return output.getBehind!();

        const dirNum = (Directions.hdgTo16DirNum(actor.heading) + 8) % 16;
        const dir = Directions.output16Dir[dirNum] ?? 'unknown';
        return output.getBehindDir!({
          dir: output[dir]!(),
          mech: output.getBehind!(),
        });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        getBehind: Outputs.getBehind,
        getBehindDir: {
          en: '${dir}: ${mech}',
          ko: '${dir} ${mech}',
        },
      },
    },
    {
      id: 'R12S Netherwrath Near/Far',
      // Boss jumps onto clone of player that took Firefall Splash, there is an aoe around the clone + proteans
      type: 'StartsUsing',
      netRegex: { id: ['B52E', 'B52F'], source: 'Lindwurm', capture: false },
      infoText: (data, _matches, output) => {
        switch (data.myReplication2Tether) {
          case headMarkerData['projectionTether']:
            return output.projectionTether!();
          case headMarkerData['heavySlamTether']:
            return output.heavySlamTether!();
        }
        return output.others!();
      },
      outputStrings: {
        projectionTether: {
          en: 'Bait Cone',
          ko: '바깥 페어: 서클 바깥',
        },
        heavySlamTether: {
          en: 'Pair',
          ko: '바깥 페어: 서클 안',
        },
        others: {
          en: 'Inner',
          ko: '안쪽 넷이 뭉쳐요',
        },
      },
    },
    {
      id: 'R12S Reenactment 1 Scalding Waves Collect',
      // Players need to wait for BBE3 Mana Burst Defamations on the clones to complete before next mechanic
      // NOTE: This is used with DN Strategy
      type: 'Ability',
      netRegex: { id: 'B8E1', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'reenactment1',
      suppressSeconds: 9999,
      run: (data) => data.netherwrathFollowup = true,
    },
    {
      id: 'R12S Reenactment 1 Clone Stacks',
      // Players need to wait for BBE3 Mana Burst defamations on clones to complete
      // This happens three times during reenactment and the third one (which is after the proteans) is the trigger
      // NOTE: This is used with DN Strategy
      type: 'Ability',
      netRegex: { id: 'BBE3', source: 'Lindwurm', capture: false },
      condition: (data) => data.netherwrathFollowup,
      suppressSeconds: 9999,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East/West Clone Stacks',
          ko: '동서 분신 뭉쳐요',
        },
      },
    },
    {
      id: 'R12S Reenactment 1 Final Defamation Dodge Reminder',
      // Players need to run back to north after clone stacks (BE5D Heavy Slam)
      // The clone stacks become a defamation and the other a cleave going East or West through the room
      // NOTE: This is used with DN Strategy
      type: 'Ability',
      netRegex: { id: 'BE5D', source: 'Lindwurm', capture: false },
      condition: (data) => data.netherwrathFollowup,
      suppressSeconds: 9999,
      alertText: (_data, _matches, output) => output.north!(),
      outputStrings: {
        north: Outputs.north,
      },
    },
    {
      id: 'R12S Mana Sphere Collect and Label',
      // Combatants Spawn ~3s before B505 Mutating Cells startsUsing
      // Their positions are available at B4FD in the 264 AbilityExtra lines and updated periodically after with 270 lines
      // 19208 => Lightning Bowtie (N/S Cleave)
      // 19209 => Fire Bowtie (E/W Cleave)
      // 19205 => Black Hole
      // 19206 => Water Sphere/Chariot
      // 19207 => Wind Donut
      // Position at add is center, so not useful here yet
      type: 'AddedCombatant',
      netRegex: { name: 'Mana Sphere', capture: true },
      run: (data, matches) => {
        const id = matches.id;
        const npcBaseId = parseInt(matches.npcBaseId);
        switch (npcBaseId) {
          case 19205:
            data.manaSpheres[id] = 'blackHole';
            return;
          case 19206:
            data.manaSpheres[id] = 'water';
            return;
          case 19207:
            data.manaSpheres[id] = 'wind';
            return;
          case 19208:
            data.manaSpheres[id] = 'lightning';
            return;
          case 19209:
            data.manaSpheres[id] = 'fire';
            return;
        }
      },
    },
    {
      id: 'R12S Mutation α/β Collect',
      // Used in Blood Mana / Blood Awakening Mechanics
      // 12A1 Mutation α: Don't get hit
      // 12A3 Mutation β: Get Hit
      // Players will get opposite debuff after Blood Mana
      type: 'GainsEffect',
      netRegex: { effectId: ['12A1', '12A3'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        data.myMutation = matches.effectId === '12A1' ? 'alpha' : 'beta';
      },
    },
    {
      id: 'R12S Mutation α/β',
      type: 'GainsEffect',
      netRegex: { effectId: ['12A1', '12A3'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, matches, output) => {
        if (matches.effectId === '12A1')
          return output.alpha!();
        return output.beta!();
      },
      outputStrings: {
        alpha: {
          en: 'Mutation α on YOU',
          ko: '변이 α',
        },
        beta: {
          en: 'Mutation β on YOU',
          ko: '변이 β',
        },
      },
    },
    {
      id: 'R12S Mana Sphere Position Collect',
      // BCB0 Black Holes:
      // These are (90, 100) and (110, 100)
      // B4FD Shapes
      // Side that needs to be exploded will have pairs with 2 of the same x or y coords
      // Side to get the shapes to explode will be closest distance to black hole
      type: 'AbilityExtra',
      netRegex: { id: 'B4FD', capture: true },
      run: (data, matches) => {
        // Calculate Distance to Black Hole
        const getDistance = (
          x: number,
          y: number,
        ): number => {
          const blackHoleX = x < 100 ? 90 : 110;
          const dx = x - blackHoleX;
          const dy = y - 100;
          return Math.round(Math.sqrt(dx * dx + dy * dy));
        };
        const x = parseFloat(matches.x);
        const y = parseFloat(matches.y);
        const d = getDistance(x, y);
        const id = matches.sourceId;

        // Put into different objects for easier lookup
        if (x < 100) {
          data.westManaSpheres[id] = { x: x, y: y };
        }
        data.eastManaSpheres[id] = { x: x, y: y };

        // Shapes with 6 distance are close, Shapes with 12 are far
        if (d < 7) {
          data.closeManaSphereIds.push(id);

          // Have enough data to solve at this point
          if (data.closeManaSphereIds.length === 2) {
            const popSide = x < 100 ? 'east' : 'west';
            data.manaSpherePopSide = popSide;

            const sphereId1 = data.closeManaSphereIds[0];
            const sphereId2 = id;
            if (sphereId1 === undefined)
              return;

            const sphereType1 = data.manaSpheres[sphereId1];
            const sphereType2 = data.manaSpheres[sphereId2];
            if (sphereType1 === undefined || sphereType2 === undefined)
              return;

            // If you see Water, pop side first
            // If you see Wind, non-pop side
            // Can't be Lightning + Wind because Fire hits the donut
            // Fire + Lightning would hit whole room
            // Water + Wind would hit whole room
            const nonPopSide = popSide === 'east' ? 'west' : 'east';
            const first = [sphereType1, sphereType2];
            const dir2 = first.includes('water') ? popSide : nonPopSide;
            data.firstBlackHole = dir2;
          }
        }
      },
    },
    {
      id: 'R12S Black Hole and Shapes',
      // Black Holes and shapes
      type: 'Ability',
      netRegex: { id: 'B4FD', source: 'Mana Sphere', capture: false },
      delaySeconds: 0.1,
      durationSeconds: 8.3,
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        const popSide = data.manaSpherePopSide;
        const blackHole = data.firstBlackHole;
        const sphereId1 = data.closeManaSphereIds[0];
        const sphereId2 = data.closeManaSphereIds[1];
        if (
          popSide === undefined ||
          blackHole === undefined ||
          sphereId1 === undefined ||
          sphereId2 === undefined
        )
          return data.myMutation === 'alpha' ? output.alpha!() : output.beta!();

        const sphereType1 = data.manaSpheres[sphereId1];
        const sphereType2 = data.manaSpheres[sphereId2];
        if (sphereType1 === undefined || sphereType2 === undefined)
          return data.myMutation === 'alpha' ? output.alpha!() : output.beta!();

        if (data.myMutation === 'alpha')
          return output.alphaDir!({
            dir1: output[popSide]!(),
            dir2: output[blackHole]!(),
          });
        return output.betaDir!({
          dir1: output[popSide]!(),
          shape1: output[sphereType1]!(),
          shape2: output[sphereType2]!(),
          dir2: output[blackHole]!(),
        });
      },
      outputStrings: {
        east: Outputs.aimE,
        west: Outputs.aimW,
        water: {
          en: 'Orb',
          ko: '구슬',
        },
        lightning: {
          en: 'Lightning',
          ko: '번개',
        },
        fire: {
          en: 'Fire',
          ko: '불',
        },
        wind: {
          en: 'Donut',
          ko: '도넛',
        },
        alpha: {
          en: 'Avoid Shape AoEs, Wait by Black Hole',
          ko: '피하고, 블랙홀 대기',
        },
        beta: {
          en: 'Shared Shape Soak => Get by Black Hole',
          ko: '물체 문대고 🔜 블랙홀로',
        },
        alphaDir: {
          en: 'Avoid ${dir1} Shape AoEs => ${dir2} Black Hole',
          ko: '${dir1}쪽 피하서 🔜 ${dir2}쪽 블랙홀 남북',
        },
        betaDir: {
          en: 'Share ${dir1} ${shape1}/${shape2} => ${dir2} Black Hole',
          ko: '${dir1}쪽 ${shape1}/${shape2} 문대고 🔜 ${dir2}쪽 블랙홀 남북',
        },
      },
    },
    {
      id: 'R12S Dramatic Lysis Black Hole 1 Reminder',
      // This may not happen if all shapes are failed
      type: 'Ability',
      netRegex: { id: ['B507'], source: 'Lindwurm', capture: false },
      suppressSeconds: 9999,
      alertText: (data, _matches, output) => {
        const blackHole = data.firstBlackHole;
        if (blackHole === undefined)
          return data.myMutation === 'alpha' ? output.alpha!() : output.beta!();
        return data.myMutation === 'alpha'
          ? output.alphaDir!({
            dir2: output[blackHole]!(),
          })
          : output.betaDir!({
            dir2: output[blackHole]!(),
          });
      },
      outputStrings: {
        east: Outputs.aimE,
        west: Outputs.aimW,
        alpha: {
          en: 'Get by Black Hole',
          ko: '블랙홀 쪽으로',
        },
        beta: {
          en: 'Get by Black Hole',
          ko: '블랙홀 쪽으로',
        },
        alphaDir: {
          en: '${dir2} Black Hole + N/S',
          ko: '${dir2}쪽 블랙홀 남북으로',
        },
        betaDir: {
          en: '${dir2} Black Hole + N/S',
          ko: '${dir2}쪽 블랙홀 남북으로',
        },
      },
    },
    {
      id: 'R12S Blood Wakening Followup',
      // Run to the other Black Hole after abilities go off
      // B501 Lindwurm's Water III
      // B502 Lindwurm's Aero III
      // B503 Straightforward Thunder II
      // B504 Sideways Fire II
      type: 'Ability',
      netRegex: { id: ['B501', 'B502', 'B503', 'B504'], source: 'Lindwurm', capture: false },
      suppressSeconds: 9999,
      alertText: (data, _matches, output) => {
        const blackHole = data.firstBlackHole;
        if (blackHole === undefined)
          return output.move!();
        const next = blackHole === 'east' ? 'west' : 'east';
        return output.moveDir!({
          dir: output[next]!(),
        });
      },
      outputStrings: {
        east: Outputs.aimE,
        west: Outputs.aimW,
        move: {
          en: 'Move to other Black Hole',
          ko: '다른 블랙홀로 이동',
        },
        moveDir: {
          en: '${dir} Black Hole + N/S',
          ko: '${dir}쪽 블랙홀 남북으로',
        },
      },
    },
    {
      id: 'R12S Netherworld Near/Far',
      type: 'StartsUsing',
      netRegex: { id: ['B52B', 'B52C'], source: 'Lindwurm', capture: true },
      alertText: (data, matches, output) => {
        if (matches.id === 'B52B')
          return data.myMutation === 'beta'
            ? output.betaNear!({ mech: output.getUnder!() })
            : output.alphaNear!({ mech: output.maxMelee!() });
        return data.myMutation === 'beta'
          ? output.betaFar!({ mech: output.maxMelee!() })
          : output.alphaFar!({ mech: output.getUnder!() });
      },
      outputStrings: {
        getUnder: Outputs.getUnder,
        maxMelee: {
          en: 'Max Melee',
          ko: '근접 최대',
        },
        alphaNear: {
          en: '${mech} (Avoid Near Stack)',
          ja: '${mech} (近い頭割りを避ける)',
          ko: '${mech} (니어 피해요)',
        },
        alphaFar: {
          en: '${mech} (Avoid Far Stack)',
          ja: '${mech} (遠い頭割りを避ける)',
          ko: '${mech} (파 피해요)',
        },
        betaNear: {
          en: 'Near β Stack: ${mech}',
          ja: '近いβ頭割り: ${mech}',
          ko: '니어β 뭉쳐요: ${mech}',
        },
        betaFar: {
          en: 'Far β Stack: ${mech}',
          ja: '遠いβ頭割り: ${mech}',
          ko: '파β 뭉쳐요: ${mech}',
        },
      },
    },
    {
      id: 'R12S Idyllic Dream',
      type: 'StartsUsing',
      netRegex: { id: 'B509', source: 'Lindwurm', capture: false },
      durationSeconds: 4.7,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'R12S Idyllic Dream Replication Clone Order Collect',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: '11D2', capture: true },
      condition: (data) => {
        if (data.phase === 'idyllic' && data.replicationCounter === 2)
          return true;
        return false;
      },
      run: (data, matches) => {
        const actor = data.actorPositions[matches.id];
        if (actor === undefined)
          return;
        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        data.replication3CloneOrder.push(dirNum);
      },
    },
    {
      id: 'R12S Idyllic Dream Replication First Clone Cardinal/Intercardinal',
      type: 'ActorControlExtra',
      netRegex: { category: '0197', param1: '11D2', capture: true },
      condition: (data) => {
        if (data.phase === 'idyllic' && data.replicationCounter === 2)
          return true;
        return false;
      },
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.id];
        if (actor === undefined)
          return;

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const dir = Directions.output8Dir[dirNum] ?? 'unknown';

        if (isCardinalDir(dir))
          return output.firstClone!({ cards: output.cardinals!() });
        if (isIntercardDir(dir))
          return output.firstClone!({ cards: output.intercards!() });
        return output.firstClone!({ cards: output.unknown!() });
      },
      outputStrings: {
        unknown: Outputs.unknown,
        cardinals: Outputs.cardinals,
        intercards: Outputs.intercards,
        firstClone: {
          en: 'First Clone: ${cards}',
          ko: '첫 번째 분신: ${cards}',
        },
      },
    },
    {
      id: 'R12S Idyllic Dream Staging 2 Tethered Clone Collect',
      // Map the locations to a player name
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data) => {
        if (
          data.phase === 'idyllic' &&
          data.replicationCounter === 2
        )
          return true;
        return false;
      },
      run: (data, matches) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return;

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        data.replication3CloneDirNumPlayers[dirNum] = matches.target;
      },
    },
    {
      id: 'R12S Idyllic Dream Staging 2 Tethered Clone',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data, matches) => {
        if (
          data.phase === 'idyllic' &&
          data.replicationCounter === 2 &&
          data.me === matches.target
        )
          return true;
        return false;
      },
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.cloneTether!();

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const dir = Directions.output8Dir[dirNum] ?? 'unknown';
        return output.cloneTetherDir!({ dir: output[dir]!() });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        cloneTether: {
          en: 'Tethered to Clone',
          ko: '내 분신 쪽으로',
        },
        cloneTetherDir: {
          en: 'Tethered to ${dir} Clone',
          ko: '${dir}쪽으로',
        },
      },
    },
    {
      id: 'R12S Idyllic Dream Power Gusher Collect',
      // Need to know this for later
      // B511 Snaking Kick
      // B512 from boss is the VFX and has headings that show directions for B50F and B510
      // B50F Power Gusher is the East/West caster
      // B510 Power Gusher is the North/South caster
      // Right now just the B510 caster is needed to resolve
      type: 'StartsUsing',
      netRegex: { id: 'B510', source: 'Lindschrat', capture: true },
      run: (data, matches) => {
        const y = parseFloat(matches.y);
        data.idyllicVision2NorthSouthCleaveSpot = y < center.y ? 'north' : 'south';
      },
    },
    {
      id: 'R12S Idyllic Dream Power Gusher Vision',
      // Call where the E/W safe spots will be later
      type: 'StartsUsing',
      netRegex: { id: 'B510', source: 'Lindschrat', capture: true },
      infoText: (_data, matches, output) => {
        const y = parseFloat(matches.y);
        const dir = y < center.y ? 'north' : 'south';
        return output.text!({ dir: output[dir]!(), sides: output.sides!() });
      },
      outputStrings: {
        north: Outputs.north,
        south: Outputs.south,
        sides: Outputs.sides,
        text: {
          en: '${dir} + ${sides} (later)',
          ko: '(나중에 ${dir} ${sides})',
        },
      },
    },
    {
      id: 'R12S Replication 4 Ability Tethers Initial Call',
      type: 'Tether',
      netRegex: {
        id: [
          headMarkerData['manaBurstTether'],
          headMarkerData['heavySlamTether'],
        ],
        capture: true,
      },
      condition: (data, matches) => {
        if (data.me === matches.target && data.phase === 'idyllic')
          return true;
        return false;
      },
      suppressSeconds: 9999, // Can get spammy if players have more than 1 tether or swap a lot
      infoText: (data, matches, output) => {
        // Get direction of the tether
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined) {
          switch (matches.id) {
            case headMarkerData['manaBurstTether']:
              return output.manaBurstTether!();
            case headMarkerData['heavySlamTether']:
              return output.heavySlamTether!();
          }
          return;
        }

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const dir = Directions.output8Dir[dirNum] ?? 'unknown';

        switch (matches.id) {
          case headMarkerData['manaBurstTether']:
            return output.manaBurstTetherDir!({ dir: output[dir]!() });
          case headMarkerData['heavySlamTether']:
            return output.heavySlamTetherDir!({ dir: output[dir]!() });
        }
      },
      outputStrings: {
        ...markerStrings,
        manaBurstTether: {
          en: 'Defamation Tether on YOU',
          ko: '큰폭발 줄 채요',
        },
        manaBurstTetherDir: {
          en: '${dir} Defamation Tether on YOU',
          ko: '${dir}쪽 큰폭발 줄 채요',
        },
        heavySlamTether: {
          en: 'Stack Tether on YOU',
          ko: '뭉쳐 줄 채요',
        },
        heavySlamTetherDir: {
          en: '${dir} Stack Tether on YOU',
          ko: '${dir}쪽 뭉쳐 줄 채요',
        },
      },
    },
    {
      id: 'R12S Replication 4 Locked Tether 2 Collect',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data) => {
        if (
          data.phase === 'idyllic' &&
          data.replicationCounter === 4
        )
          return true;
        return false;
      },
      run: (data, matches) => {
        const actor = data.actorPositions[matches.sourceId];
        const target = matches.target;
        if (actor === undefined) {
          // Setting to use that we know we have a tether but couldn't determine what ability it is
          if (data.me === target)
            data.replication4PlayerAbilities[target] = 'unknown';
          return;
        }

        const dirNum = Directions.xyTo8DirNum(
          actor.x,
          actor.y,
          center.x,
          center.y,
        );

        // Lookup what the tether was at the same location
        const ability = data.replication4DirNumAbility[dirNum];
        if (ability === undefined) {
          // Setting to use that we know we have a tether but couldn't determine what ability it is
          data.replication4PlayerAbilities[target] = 'unknown';
          return;
        }
        data.replication4PlayerAbilities[target] = ability;

        // Create ability order once we have all 8 players
        // If players had more than one tether previously, the extra tethers are randomly assigned
        if (Object.keys(data.replication4PlayerAbilities).length === 8) {
          const abilities = data.replication4PlayerAbilities;
          const order = data.replication3CloneOrder; // Order in which clones spawned
          const players = data.replication3CloneDirNumPlayers; // Direction of player's clone

          // Mechanics are resolved clockwise, get create order based on cards/inters
          const first = order[0];
          if (first === undefined)
            return;
          const dirNumOrder = first % 2 === 0 ? [0, 2, 4, 6, 1, 3, 5, 7] : [1, 3, 5, 7, 0, 2, 4, 6];
          for (const dirNum of dirNumOrder) {
            const player = players[dirNum] ?? 'unknown';
            const ability = abilities[player] ?? 'unknown';
            data.replication4PlayerOrder.push(player);
            data.replication4AbilityOrder.push(ability);
          }
        }
      },
    },
    {
      id: 'R12S Replication 4 Locked Tether 2',
      // At this point the player needs to dodge the north/south cleaves + chariot
      // Simultaneously there will be a B4F2 Lindwurm's Meteor bigAoe that ends with room split
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data, matches) => {
        if (
          data.phase === 'idyllic' &&
          data.twistedVisionCounter === 3 &&
          data.me === matches.target
        )
          return true;
        return false;
      },
      delaySeconds: 0.1,
      durationSeconds: 8,
      alertText: (data, matches, output) => {
        const meteorAoe = output.meteorAoe!();
        const cleaveOrigin = data.idyllicVision2NorthSouthCleaveSpot;
        const myAbility = data.replication4PlayerAbilities[data.me];
        // Get direction of the tether
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined || cleaveOrigin === undefined) {
          switch (myAbility) {
            case headMarkerData['manaBurstTether']:
              return output.manaBurstTether!({ meteorAoe: meteorAoe });
            case headMarkerData['heavySlamTether']:
              return output.heavySlamTether!({ meteorAoe: meteorAoe });
          }
          return;
        }

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const dir = Directions.output8Dir[dirNum] ?? 'unknown';

        const dodge = output.dodgeCleaves!({
          dir: output[cleaveOrigin]!(),
        });

        switch (myAbility) {
          case headMarkerData['manaBurstTether']:
            return output.manaBurstTetherDir!({
              dir: output[dir]!(),
              dodgeCleaves: dodge,
              meteorAoe: meteorAoe,
            });
          case headMarkerData['heavySlamTether']:
            return output.heavySlamTetherDir!({
              dir: output[dir]!(),
              dodgeCleaves: dodge,
              meteorAoe: meteorAoe,
            });
        }
      },
      outputStrings: {
        ...markerStrings,
        north: Outputs.aimN,
        south: Outputs.aimS,
        meteorAoe: {
          en: 'big AoE + Healer Groups',
          ko: '4:4 + 전체 공격',
        },
        dodgeCleaves: {
          en: '${dir} + Sides',
          ko: '${dir}쪽 옆으로',
        },
        manaBurstTetherDir: {
          en: '${dodgeCleaves} (${dir} Defamation Tether)  => ${meteorAoe}',
          ko: '${dodgeCleaves} (${dir}쪽 큰폭발 줄) 🔜 ${meteorAoe}',
        },
        manaBurstTether: {
          en: ' N/S Clone (Defamation Tether) => ${meteorAoe}',
          ko: '남북 분신 (큰폭발 줄) 🔜 ${meteorAoe}',
        },
        heavySlamTetherDir: {
          en: '${dodgeCleaves} (${dir} Stack Tether)  => ${meteorAoe}',
          ko: '${dodgeCleaves} (${dir}쪽 뭉쳐 줄) 🔜 ${meteorAoe}',
        },
        heavySlamTether: {
          en: ' N/S Clone (Stack Tether) => ${meteorAoe}',
          ja: '南北分身 (頭割り線) => ${meteorAoe}',
          ko: '남북 분신 (뭉쳐 줄) 🔜 ${meteorAoe}',
        },
      },
    },
    {
      id: 'R12S Arcadian Arcanum',
      // Players hit will receive 1044 Light Resistance Down II debuff
      type: 'StartsUsing',
      netRegex: { id: 'B529', source: 'Lindwurm', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'R12S Light Resistance Down II Collect',
      // Players cannot soak a tower that has holy (triple element towers)
      type: 'GainsEffect',
      netRegex: { effectId: '1044', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.hasLightResistanceDown = true,
    },
    {
      id: 'R12S Light Resistance Down II',
      type: 'GainsEffect',
      netRegex: { effectId: '1044', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Soak Fire/Earth Meteor (later)',
          ko: '(나중에 불/땅 밟아요)',
        },
      },
    },
    {
      id: 'R12S No Light Resistance Down II',
      type: 'GainsEffect',
      netRegex: { effectId: '1044', capture: false },
      delaySeconds: 0.1,
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        if (!data.hasLightResistanceDown)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Soak a White/Star Meteor (later)',
          ko: '(나중에 하양/별 밟아요)',
        },
      },
    },
    {
      id: 'R12S Twisted Vision 4 Stack/Defamation 1',
      // Used for keeping track of phases in idyllic
      type: 'StartsUsing',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: false },
      condition: (data) => data.twistedVisionCounter === 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...markerStrings,
          stacks: Outputs.stacks,
          avoidDefamation: {
            en: 'Avoid Defamation',
            ko: '큰폭발 피해요',
          },
          avoidStack: {
            en: 'Avoid Stack',
            ko: '뭉치면 안되요',
          },
          defamationOnYou: Outputs.defamationOnYou,
          stackOnYou: Outputs.stackOnYou,
          defamations: {
            en: 'Defamations',
            ja: '巨大な爆発',
            ko: '큰폭발',
          },
          oneMechThenOne: {
            en: '${mech1} => ${mech2}',
            ko: '${mech1} 🔜 ${mech2}',
          },
          oneMechThenTwo: {
            en: '${mech1} => ${mech2} + ${mech3}',
            ko: '${mech1} 🔜 ${mech2} + ${mech3}',
          },
          twoMechsThenOne: {
            en: '${mech1} + ${mech2} => ${mech3}',
            ko: '${mech1} + ${mech2} 🔜 ${mech3}',
          },
          twoMechsThenTwo: {
            en: '${mech1} + ${mech2} => ${mech3} + ${mech4}',
            ko: '${mech1} + ${mech2} 🔜 ${mech3} + ${mech4}',
          },
        };
        const abilityOrder = data.replication4AbilityOrder;
        const playerOrder = data.replication4PlayerOrder;
        if (
          abilityOrder === undefined ||
          playerOrder === undefined
        )
          return;

        const ability1 = abilityOrder[0];
        const ability2 = abilityOrder[1];
        const player1 = playerOrder[0];
        const player2 = playerOrder[1];

        // Get Stack/Defamation #2 details
        const ability3 = abilityOrder[2];
        const ability4 = abilityOrder[3];
        const player3 = playerOrder[2];
        const player4 = playerOrder[3];

        // Handle some obscure strategies or mistakes
        const isThisSame = ability1 === ability2;
        const isNextSame = ability3 === ability4;
        const defamation = headMarkerData['manaBurstTether'];
        let this1;
        let this2;
        let next1;
        let next2;
        // Handle This Set
        if (player1 === data.me) {
          this1 = ability1 === defamation ? 'defamationOnYou' : 'stackOnYou';
          if (!isThisSame)
            this2 = ability2 === defamation ? 'avoidDefamation' : 'avoidStack';
        } else if (player2 === data.me) {
          if (!isThisSame) {
            this1 = ability1 === defamation ? 'avoidDefamation' : 'avoidStack';
            this2 = ability2 === defamation ? 'defamationOnYou' : 'stackOnYou';
          } else {
            this1 = ability1 === defamation ? 'defamationOnYou' : 'stackOnYou';
          }
        } else if (isThisSame) {
          this1 = ability1 === defamation ? 'defamations' : 'stacks';
        } else if (!isThisSame) {
          this1 = ability1 === defamation ? 'avoidDefamation' : 'stack';
          this2 = ability2 === defamation ? 'avoidDefamation' : 'stack';
        }

        // Handle Next Set
        if (player3 === data.me) {
          next1 = ability3 === defamation ? 'defamationOnYou' : 'stackOnYou';
          if (!isThisSame)
            next2 = ability4 === defamation ? 'avoidDefamation' : 'avoidStack';
        } else if (player4 === data.me) {
          if (!isThisSame) {
            next1 = ability4 === defamation ? 'avoidDefamation' : 'avoidStack';
            next2 = ability4 === defamation ? 'defamationOnYou' : 'stackOnYou';
          } else {
            next1 = ability4 === defamation ? 'defamationOnYou' : 'stackOnYou';
          }
        } else if (isNextSame) {
          next1 = ability3 === defamation ? 'defamations' : 'stacks';
        } else if (!isNextSame) {
          next1 = ability3 === defamation ? 'avoidDefamation' : 'stack';
          next2 = ability4 === defamation ? 'avoidDefamation' : 'stack';
        }

        // Build output
        if (this1 === undefined || next1 === undefined)
          return;
        const text = (player1 === data.me || player2 === data.me) ? 'alertText' : 'infoText';
        if (isThisSame && isNextSame) {
          return {
            [text]: output.oneMechThenOne!({
              mech1: output[this1]!(),
              mech2: output[next1]!(),
            }),
          };
        }

        if (isThisSame && !isNextSame) {
          if (next2 === undefined)
            return;
          return {
            [text]: output.oneMechThenTwo!({
              mech1: output[this1]!(),
              mech2: next1 === 'stack'
                ? output.stacks!()
                : output[next1]!(),
              mech3: next2 === 'stack'
                ? output.stacks!()
                : output[next2]!(),
            }),
          };
        }

        if (!isThisSame && isNextSame) {
          if (this2 === undefined)
            return;
          return {
            [text]: output.twoMechsThenOne!({
              mech1: this1 === 'stack'
                ? output.stacks!()
                : output[this1]!(),
              mech2: this2 === 'stack'
                ? output.stacks!()
                : output[this2]!(),
              mech3: output[next1]!(),
            }),
          };
        }

        if (this2 === undefined || next2 === undefined)
          return;
        return {
          [text]: output.twoMechsThenTwo!({
            mech1: this1 === 'stack'
              ? output.stacks!()
              : output[this1]!(),
            mech2: this2 === 'stack'
              ? output.stacks!()
              : output[this2]!(),
            mech3: next1 === 'stack'
              ? output.stacks!()
              : output[next1]!(),
            mech4: next2 === 'stack'
              ? output.stacks!()
              : output[next2]!(),
          }),
        };
      },
    },
    {
      id: 'R12S Doom Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'D24', capture: true },
      run: (data, matches) => data.doomPlayers.push(matches.target),
    },
    {
      id: 'R12S Doom Cleanse',
      type: 'GainsEffect',
      netRegex: { effectId: 'D24', capture: false },
      condition: (data) => data.CanCleanse(),
      delaySeconds: 0.1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const players = data.doomPlayers;
        if (players.length === 2) {
          const target1 = data.party.member(data.doomPlayers[0]);
          const target2 = data.party.member(data.doomPlayers[1]);
          return output.cleanseDoom2!({ target1: target1, target2: target2 });
        }
        if (players.length === 1) {
          const target1 = data.party.member(data.doomPlayers[0]);
          return output.cleanseDoom!({ target: target1 });
        }
      },
      outputStrings: {
        cleanseDoom: {
          en: 'Cleanse ${target}',
          ko: '에스나: ${target}',
        },
        cleanseDoom2: {
          en: 'Cleanse ${target1}/${target2}',
          ko: '에스나: ${target1}, ${target2}',
        },
      },
    },
    {
      id: 'R12S Doom Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: 'D24', capture: true },
      run: (data, matches) => {
        data.doomPlayers = data.doomPlayers.filter(
          (player) => player === matches.target,
        );
      },
    },
    {
      id: 'R12S Hot-blooded',
      // Player can still cast, but shouldn't move for 5s duration
      type: 'GainsEffect',
      netRegex: { effectId: '12A0', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      response: Responses.stopMoving(),
    },
    {
      id: 'R12S Idyllic Dream Replication Clone Cardinal/Intercardinal Reminder',
      // Using Temporal Curtain
      type: 'StartsUsing',
      netRegex: { id: 'B51C', source: 'Lindwurm', capture: false },
      infoText: (data, _matches, output) => {
        const firstClone = data.replication3CloneOrder[0];
        if (firstClone === undefined)
          return;
        const actor = data.actorPositions[firstClone];
        if (actor === undefined)
          return;

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const dir = Directions.output8Dir[dirNum] ?? 'unknown';

        if (isCardinalDir(dir))
          return output.cardinals!();
        if (isIntercardDir(dir))
          return output.intercards!();
      },
      outputStrings: {
        cardinals: Outputs.cardinals,
        intercards: Outputs.intercards,
      },
    },
    // ////////////////////////////////
    {
      id: 'R12S Mortal Slayer',
      type: 'StartsUsing',
      netRegex: { id: 'B495', source: 'Lindwurm', capture: false },
      run: (data) => {
        data.mortalList = [];
      },
    },
    {
      id: 'R12S Mortal Slayer 모으기',
      type: 'AddedCombatant',
      // 19200 보라 탱크용
      // 19201 초록 힐딜용
      netRegex: { npcBaseId: ['19200', '19201'], capture: true },
      condition: (data, matches) => {
        // 구슬 모으기 (순서 추적)
        data.mortalList.push({
          purple: matches.npcBaseId === '19200',
          // 한가운데는 100으로 추정되는데 100이 왼쪽에 뜬다. 그래서 101을 기준으로 해봄
          left: parseFloat(matches.x) < 101,
          moks: '', // 나중에 할당
        });
        if (data.mortalList.length < 8)
          return false;

        // 왼쪽 보라 개수 확인 (전체 패턴 판단용)
        const leftPurpleCount = data.mortalList.filter((m) => m.purple && m.left).length;

        // 역할 큐 준비
        let leftTanks: string[];
        let leftOthers: string[];
        let rightTanks: string[];
        let rightOthers: string[];

        if (leftPurpleCount === 2) {
          // 왼쪽에 보라 2개 패턴
          leftTanks = ['MT', 'ST'];
          leftOthers = ['H1', 'D1'];
          rightTanks = [];
          rightOthers = ['H2', 'D2', 'D4', 'D3'];
        } else if (leftPurpleCount === 0) {
          // 오른쪽에 보라 2개 패턴
          leftTanks = [];
          leftOthers = ['H1', 'D1', 'D3', 'D4'];
          rightTanks = ['ST', 'MT'];
          rightOthers = ['H2', 'D2'];
        } else {
          // 왼쪽, 오른쪽에 각각 보라 1개
          leftTanks = ['MT'];
          leftOthers = ['H1', 'D1', 'D3'];
          rightTanks = ['ST'];
          rightOthers = ['H2', 'D2', 'D4'];
        }

        // 각 구슬에 역할 할당 (보라/녹색에 따라 다른 큐 사용)
        for (const orb of data.mortalList) {
          if (orb.purple) {
            // 보라 구슬 - 탱크
            if (orb.left)
              orb.moks = leftTanks.shift()!;
            else
              orb.moks = rightTanks.shift()!;
          } else {
            // 녹색 구슬 - 힐딜
            if (orb.left)
              orb.moks = leftOthers.shift()!;
            else
              orb.moks = rightOthers.shift()!;
          }
        }
        return true;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          left: {
            en: 'Go left side of front',
            ja: '前方左側へ',
            ko: '🡸왼쪽으로 들어가요',
          },
          right: {
            en: 'Go right side of front',
            ja: '前方右側へ',
            ko: '🡺오른쪽으로 들어가요',
          },
          text: {
            en: '${left} / ${right}',
            ja: '${left} / ${right}',
            ko: '${left} / ${right}',
          },
          unknown: Outputs.unknown,
        };

        const orb1 = data.mortalList.shift();
        const orb2 = data.mortalList.shift();
        if (orb1 === undefined || orb2 === undefined)
          return;

        if (orb1.moks === data.moks)
          return { alertText: orb1.left ? output.left!() : output.right!() };
        if (orb2.moks === data.moks)
          return { alertText: orb2.left ? output.left!() : output.right!() };

        return { infoText: output.text!({ left: orb1.moks, right: orb2.moks }) };
      },
    },
    {
      id: 'R12S Mortal Slayer 다음',
      type: 'Ability',
      // B496 녹색
      // B498 보라
      netRegex: { id: ['B496', 'B498'], source: 'Lindwurm', capture: false },
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          left: {
            en: 'Go left side of front',
            ja: '前方左側へ',
            ko: '🡸왼쪽으로 들어가요',
          },
          right: {
            en: 'Go right side of front',
            ja: '前方右側へ',
            ko: '🡺오른쪽으로 들어가요',
          },
          text: {
            en: '${left} / ${right}',
            ja: '${left} / ${right}',
            ko: '${left} / ${right}',
          },
        };

        const orb1 = data.mortalList.shift();
        const orb2 = data.mortalList.shift();
        if (orb1 === undefined || orb2 === undefined)
          return;

        if (orb1.moks === data.moks)
          return { alertText: orb1.left ? output.left!() : output.right!() };
        if (orb2.moks === data.moks)
          return { alertText: orb2.left ? output.left!() : output.right!() };

        return { infoText: output.text!({ left: orb1.moks, right: orb2.moks }) };
      },
    },
    {
      id: 'R12S Burst 2',
      type: 'Ability',
      netRegex: { id: ['B49A', 'B49B'], source: 'Lindwurm', capture: true },
      condition: (data) => data.phase === 'curtainCall',
      delaySeconds: 10,
      infoText: (_data, _matches, output) => output.middle!(),
      outputStrings: {
        middle: {
          en: 'Get Middle',
          ja: '中へ',
          ko: '(한가운데서 줄 끊을 준비)',
        },
      },
    },
    {
      id: 'R12S Netherwrath After',
      type: 'Ability',
      netRegex: { id: ['B52E', 'B52F'], source: 'Lindwurm', capture: false },
      delaySeconds: 2,
      infoText: (data, _matches, output) => {
        switch (data.myReplication2Tether) {
          case headMarkerData['projectionTether']:
            return output.projectionTether!();
          case headMarkerData['heavySlamTether']:
            return output.heavySlamTether!();
        }
        return output.others!();
      },
      outputStrings: {
        projectionTether: {
          en: 'Cone Tether: Bait Protean from Boss',
          ko: '바깥 꼬깔 유도: 외측',
        },
        heavySlamTether: {
          en: 'Cone Tether: Bait Protean from Boss',
          ko: '바깥 꼬깔 유도: 내측',
        },
        others: {
          en: 'Inner',
          ko: '➋ 뭉쳤다 🔜 ➌ 뭉쳐요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Netherwrath Near/Netherwrath Far': 'Netherwrath Near/Far',
        'Netherworld Near/Netherwworld Far': 'Netherworld Near/Far',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Lindwurm': 'リンドブルム',
      },
      'replaceText': {
        'Netherwrath Near/Netherwrath Far': 'ネザーラス 近/遠',
        'Netherworld Near/Netherwworld Far': 'Netherworld Near/Far',
      },
    },
  ],
};

export default triggerSet;
