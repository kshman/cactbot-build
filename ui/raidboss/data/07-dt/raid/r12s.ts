import Autumn, { AutumnDir, AutumnNumDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutput8, Directions } from '../../../../../resources/util';
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

type CardinalFacing = 'front' | 'rear' | 'left' | 'right';
type SphereType = 'lightning' | 'fire' | 'water' | 'wind' | 'blackHole';
type MortalInfo = {
  purple: boolean;
  left: boolean;
  moks: string;
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
    uptimeKnockbackStrat: true | false;
  };
  phase: Phase;
  // Phase 1
  grotesquerieCleave?: CardinalFacing;
  myFleshBonds?: 'alpha' | 'beta';
  inLine: { [name: string]: number };
  blobTowerDirs: string[];
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
  replication2DirNumAbility: { [dirNum: number]: string };
  replication2PlayerAbilities: { [player: string]: string };
  replication2BossId?: string;
  // replication2PlayerOrder: string[];
  // replication2AbilityOrder: string[];
  myMutation?: 'alpha' | 'beta';
  manaSpheres: { [id: string]: SphereType };
  westManaSpheres: { [id: string]: { x: number; y: number } };
  eastManaSpheres: { [id: string]: { x: number; y: number } };
  closeManaSphereIds: string[];
  firstBlackHole?: 'east' | 'west';
  manaSpherePopSide?: 'east' | 'west';
  twistedVisionCounter: number;
  replication3CloneOrder: number[];
  replication3CloneDirNumPlayers: { [dirNum: number]: string };
  idyllicVision2NorthSouthCleaveSpot?: 'north' | 'south';
  idyllicDreamActorEW?: string;
  idyllicDreamActorNS?: string;
  idyllicDreamActorSnaking?: string;
  replication4DirNumAbility: { [dirNum: number]: string };
  replication4PlayerAbilities: { [player: string]: string };
  replication4BossCloneDirNumPlayers: { [dirNum: number]: string };
  hasLightResistanceDown: boolean;
  twistedVision4MechCounter: number;
  doomPlayers: string[];
  hasDoom: boolean;
  hasPyretic: boolean;
  idyllicVision8SafeSides?: 'frontBack' | 'sides';
  idyllicVision7SafeSides?: 'frontBack' | 'sides';
  idyllicVision7SafePlatform?: 'east' | 'west';
  // prt
  mortalList: MortalInfo[];
  snakings: number;
  clonePos: number;
  isLeft: boolean;
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

const markerStrings = {
  dirN: {
    en: '🡹North',
    ja: '🄰🡹',
    ko: '🄰🡹',
  },
  dirE: {
    en: '🡺East',
    ja: '🄱🡺',
    ko: '🄱🡺',
  },
  dirS: {
    en: '🡻South',
    ja: '🄲🡻',
    ko: '🄲🡻',
  },
  dirW: {
    en: '🡸West',
    ja: '🄳🡸',
    ko: '🄳🡸',
  },
  dirNW: {
    en: '🡼NW',
    ja: '➊🡼',
    ko: '➊🡼',
  },
  dirNE: {
    en: '🡽NE',
    ja: '➋🡽',
    ko: '➋🡽',
  },
  dirSE: {
    en: '🡾SE',
    ja: '➌🡾',
    ko: '➌🡾',
  },
  dirSW: {
    en: '🡿SW',
    ja: '➍🡿',
    ko: '➍🡿',
  },
  unknown: Outputs.unknown,
} as const;

const twistedVisionStrings = {
  stackLeft: {
    en: 'Left',
    ko: '➍',
  },
  stackRight: {
    en: 'Right',
    ko: '➌',
  },
  defaLeft: {
    en: 'Left',
    ko: '➊',
  },
  defaRight: {
    en: 'Right',
    ko: '➋',
  },
  stackDefa: {
    en: 'Stack ${pos1} => Defamation ${pos2}',
    ko: '${pos1} 뭉쳤다 🔜 ${pos2} 큰폭발 버려요',
  },
  stackAvoid: {
    en: 'Stack ${pos} => Avoid Defamations',
    ko: '${pos} 뭉쳤다 🔜 🄲 큰폭발 피해요',
  },
  stackTower: {
    en: 'Stack ${pos} => Tower Position',
    ko: '${pos} 뭉쳤다 🔜 자기 섬 타워로',
  },
  defaStack: {
    en: 'Defamation ${pos1} => Stack ${pos2}',
    ko: '${pos1} 큰폭발 버리고 🔜 ${pos2} 뭉쳐요',
  },
  avoidStack: {
    en: 'Avoid Defamations => Stack ${pos}',
    ko: '🄲 큰폭발 피하고 🔜 ${pos} 뭉쳐요',
  },
  defaTower: {
    en: 'Defamation ${pos} => Tower Position',
    ko: '${pos} 큰폭발 버리고 🔜 자기 섬 타워로',
  },
  avoidTower: {
    en: 'Avoid Defamations => Tower Position',
    ko: '🄲 큰폭발 피하고 🔜 자기 섬 타워로',
  },
} as const;

const isCardinalDir = (dir: DirectionOutput8) => {
  return (Directions.outputCardinalDir as string[]).includes(dir);
};

const isIntercardDir = (dir: DirectionOutput8) => {
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
        ja: '正確なタイミングノックバック回避攻略を使用',
        ko: '정확한 타이밍 넉백방지 공략 사용',
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
    cellChainCount: 0,
    hasRot: false,
    // Phase 2
    actorPositions: {},
    replicationCounter: 0,
    replication1FollowUp: false,
    replication2DirNumAbility: {},
    replication2PlayerAbilities: {},
    manaSpheres: {},
    westManaSpheres: {},
    eastManaSpheres: {},
    closeManaSphereIds: [],
    twistedVisionCounter: 0,
    replication3CloneOrder: [],
    replication3CloneDirNumPlayers: {},
    replication4DirNumAbility: {},
    replication4PlayerAbilities: {},
    replication4BossCloneDirNumPlayers: {},
    hasLightResistanceDown: false,
    twistedVision4MechCounter: 0,
    doomPlayers: [],
    hasDoom: false,
    hasPyretic: false,
    // prt
    mortalList: [],
    snakings: 0,
    clonePos: -1,
    isLeft: false,
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
        if (data.phase === 'replication2') {
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
      type: 'GainsEffect',
      netRegex: { effectId: 'DE6', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const cleaveMap: { [key: string]: CardinalFacing } = {
          '40C': 'front',
          '40D': 'right',
          '40E': 'rear',
          '40F': 'left',
        };
        data.grotesquerieCleave = cleaveMap[matches.count];
      },
    },
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
        data.mortalList.push({
          purple: matches.npcBaseId === '19200',
          left: parseFloat(matches.x) < 101,
          moks: '', // 나중에 할당
        });
        if (data.mortalList.length < 8)
          return false;

        const leftPurpleCount = data.mortalList.filter((m) => m.purple && m.left).length;

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
          // 왼쪽, 오른쪽에 각각 보라 1개. 근데 이 패턴은 없는거 같다. 혹시나 하고 냅둠
          leftTanks = ['MT'];
          leftOthers = ['H1', 'D1', 'D3'];
          rightTanks = ['ST'];
          rightOthers = ['H2', 'D2', 'D4'];
        }

        for (const orb of data.mortalList) {
          orb.moks = orb.purple
            ? (orb.left ? leftTanks : rightTanks).shift()!
            : (orb.left ? leftOthers : rightOthers).shift()!;
        }
        return true;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          left: {
            en: 'Go left side',
            ja: '🡸左側へ',
            ko: '🡸왼쪽으로 들어가요',
          },
          right: {
            en: 'Go right side',
            ja: '🡺右側へ',
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
            en: 'Go left side',
            ja: '🡸左側へ',
            ko: '🡸왼쪽으로 들어가요',
          },
          right: {
            en: 'Go right side',
            ja: '🡺右側へ',
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
      id: 'R12S Grotesquerie 뭉쳐/흩어져',
      type: 'GainsEffect',
      netRegex: { effectId: ['1299', '129A'], capture: true },
      delaySeconds: 0.2,
      durationSeconds: 17,
      infoText: (data, matches, output) => {
        const cleave = data.grotesquerieCleave;
        const target = matches.target;
        const face = cleave === undefined ? output.unknown!() : output[cleave]!();

        // Spread debuff (1299)
        if (matches.effectId === '1299') {
          if (target !== data.me)
            return;
          if (cleave === undefined)
            return data.phase === 'doorboss'
              ? output.baitSpread!({ cleave: face })
              : output.curtainSpread!();
          return data.phase === 'doorboss'
            ? output.baitSpread!({ cleave: face })
            : output.curtainSpread!();
        }

        // Stack debuff (129A)
        if (target === data.me)
          return output.baitStack!({ cleave: face });

        const isDPS = data.party.isDPS(target);
        if (isDPS && data.role === 'dps')
          return output.baitStack!({ cleave: face });
        if (!isDPS && data.role !== 'dps')
          return output.baitStack!({ cleave: face });
      },
      outputStrings: {
        front: {
          en: 'Front Cleave',
          ja: '🡹前扇',
          ko: '🡹앞 꼬깔',
        },
        rear: {
          en: 'Rear Cleave',
          ja: '🡻後ろ扇',
          ko: '🡻뒤 꼬깔',
        },
        left: {
          en: 'Left Cleave',
          ja: '🡸左扇',
          ko: '🡸왼쪽 꼬깔',
        },
        right: {
          en: 'Right Cleave',
          ja: '🡺右扇',
          ko: '🡺오른쪽 꼬깔',
        },
        baitStack: {
          en: 'Bait 4x Puddles => Stack + ${cleave}',
          ja: 'AOE誘導 x4 🔜 頭割り + ${cleave}',
          ko: '장판 x4 🔜 뭉쳐요 + ${cleave}',
        },
        baitSpread: {
          en: 'Bait 4x Puddles => Spread + ${cleave}',
          ja: 'AOE誘導 x4 🔜 散開 + ${cleave}',
          ko: '장판 x4 🔜 흩어져요 + ${cleave}',
        },
        curtainSpread: {
          en: 'Spread Debuff on YOU',
          ja: '(自分に散開)',
          ko: '(내게 흩어져요)',
        },
        unknown: Outputs.unknown,
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
      // 1st - 26s
      // 2nd - 31s
      // 3rd - 36s
      // 4th - 41s
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
        if (myNum === undefined || myNum < 1 || myNum > 4)
          return;
        const flesh = data.myFleshBonds;
        if (flesh === undefined)
          return output.order!({ num: myNum });
        return output[`${flesh}${myNum}`]!();
      },
      outputStrings: {
        alpha1: {
          en: '1α: Wait for Tether 1',
          ja: '1α: 線待ち #1',
          ko: '1α: 줄 #1',
        },
        alpha2: {
          en: '2α: Wait for Tether 2',
          ja: '2α: 線待ち #2',
          ko: '2α: 줄 #2',
        },
        alpha3: {
          en: '3α: Blob Tower 1',
          ja: '3α: 肉塔 #1',
          ko: '3α: 살덩이 #1',
        },
        alpha4: {
          en: '4α: Blob Tower 2',
          ja: '4α: 肉塔 #2',
          ko: '4α: 살덩이 #2',
        },
        beta1: {
          en: '1β: Wait for Tether 1',
          ja: '1β: 線待ち #1',
          ko: '1β: 줄 #1',
        },
        beta2: {
          en: '2β: Wait for Tether 2',
          ja: '2β: 線待ち #2',
          ko: '2β: 줄 #2',
        },
        beta3: {
          en: '3β: Chain Tower 1',
          ja: '3β: 出現塔 #1',
          ko: '3β: 돌출 타워 #1',
        },
        beta4: {
          en: '4β: Chain Tower 2',
          ja: '4β: 出現塔 #2',
          ko: '4β: 돌출 타워 #2',
        },
        order: {
          en: '${num}',
          ja: '#${num}',
          ko: '#${num}',
        },
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
        if (myNum === undefined)
          return 0;
        const numMap: { [key: number]: number } = { 1: 17, 2: 22, 3: 18, 4: 18 };
        return numMap[myNum] ?? 0;
      },
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;

        const numIndexMap: { [key: number]: number } = { 1: 2, 2: 3, 3: 0, 4: 1 };
        const dirIndex = numIndexMap[myNum];
        if (dirIndex === undefined)
          return;
        const towerNum = dirIndex + 1;

        const dir = data.blobTowerDirs[dirIndex];
        if (dir === undefined)
          return;

        if (myNum > 2)
          return output.innerBlobTower!({ num: towerNum, dir: output[dir]!() });
        return output.outerBlobTower!({ num: towerNum, dir: output[dir]!() });
      },
      outputStrings: {
        ...AutumnDir.stringsAimCross,
        innerBlobTower: {
          en: 'Blob Tower ${num} Inner ${dir} (later)',
          ja: '(後で肉塔 #${num}、内側 ${dir})',
          ko: '(나중에 살덩이 #${num}, 안쪽 ${dir})',
        },
        outerBlobTower: {
          en: 'Blob Tower ${num} Outer ${dir} (later)',
          ja: '(後で肉塔 #${num}、外側 ${dir})',
          ko: '(나중에 살덩이 #${num}, 바깥쪽 ${dir})',
        },
      },
    },
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

        const numOrderMap: { [key: number]: number } = { 1: 3, 2: 4, 3: 1, 4: 2 };
        const myOrder = numOrderMap[myNum];
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
        ...AutumnDir.stringsAimCross,
        alpha3: {
          en: 'Get Blob Tower 1',
          ja: '肉塔踏み #1',
          ko: '밟아요: 살덩이 #1',
        },
        alpha4: {
          en: 'Get Blob Tower 2',
          ja: '肉塔踏み #2',
          ko: '밟아요: 살덩이 #2',
        },
        alpha3Dir: {
          en: 'Get Blob Tower 1 (Inner ${dir})',
          ja: '肉塔踏み #1 (${dir}内側)',
          ko: '밟아요: ${dir}쪽 살덩이 #1',
        },
        alpha4Dir: {
          en: 'Get Blob Tower 2 (Inner ${dir})',
          ja: '肉塔踏み #2 (${dir}内側)',
          ko: '밟아요: ${dir}쪽 살덩이 #2',
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
        if (myNum === undefined || myNum < 1 || myNum > 4)
          return output.getTowers!();

        const isAlpha = matches.effectId === '1291';
        if (isAlpha) {
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
          return output[`alpha${myNum}`]!();
        }

        return output[`beta${myNum}`]!();
      },
      outputStrings: {
        ...AutumnDir.stringsAimCross,
        getTowers: Outputs.getTowers,
        alpha1: {
          en: 'Break Chains 1 + Blob Tower 3 (Outer)',
          ja: '線切り #1 🔜 肉塔 #3',
          ko: '나가요: 줄 #1 🔜 살덩이 #3',
        },
        alpha1Dir: {
          en: 'Break Chains 1 + Blob Tower 3 (Outer ${dir})',
          ja: '線切り #1 🔜 肉塔 #3 (${dir}外側)',
          ko: '나가요: 줄 #1 🔜 ${dir}쪽 살덩이 #3',
        },
        alpha2: {
          en: 'Break Chains 2 + Blob Tower 4 (Outer)',
          ja: '線切り #2 🔜 肉塔 #4',
          ko: '나가요: 줄 #2 🔜 살덩이 #4',
        },
        alpha2Dir: {
          en: 'Break Chains 2 + Blob Tower 4 (Outer ${dir})',
          ja: '線切り #2 🔜 肉塔 #4 (${dir}外側)',
          ko: '나가요: 줄 #2 🔜 ${dir}쪽 살덩이 #4',
        },
        alpha3: {
          en: 'Break Chains 3 + Get Out',
          ja: '線切り #3 🔜 外へ',
          ko: '나가요: 줄 #3',
        },
        alpha4: {
          en: 'Break Chains 4 + Get Out',
          ja: '線切り #4 🔜 外へ',
          ko: '나가요: 줄 #4',
        },
        beta1: {
          en: 'Break Chains 1 => Get Middle',
          ja: '線切り #1 🔜 中央へ',
          ko: '끊어요: 줄 #1 🔜 가운데로',
        },
        beta2: {
          en: 'Break Chains 2 => Get Middle',
          ja: '線切り #2 🔜 中央へ',
          ko: '끊어요: 줄 #2 🔜 가운데로',
        },
        beta3: {
          en: 'Break Chains 3 => Wait for last pair',
          ja: '線切り #3 🔜 最後のペア待ち',
          ko: '끊어요: 줄 #3 🔜 마지막에 탈출',
        },
        beta4: {
          en: 'Break Chains 4 => Get Out',
          ja: '線切り #4 🔜 外へ',
          ko: '끊어요: 줄 #4 🔜 탈출해요!',
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
        if (mechanicNum < 5)
          return output.goIntoMiddle!();
        return output.getOut!();
      },
      outputStrings: {
        getOut: {
          en: 'Get Out',
          ja: '外へ',
          ko: '나가요',
        },
        goIntoMiddle: Outputs.goIntoMiddle,
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
        const cntMap: { [cnt: string]: CardinalFacing } = {
          '436': 'front',
          '437': 'right',
          '438': 'rear',
          '439': 'left',
        };
        const dir = cntMap[matches.count];
        if (dir === undefined)
          return;
        return output[dir]!();
      },
      outputStrings: {
        front: {
          en: 'Tower (S/SW)',
          ja: '🡻南または🡿南西',
          ko: '🡻남쪽 또는 🡿남서쪽',
        },
        rear: {
          en: 'Tower (N/NE)',
          ja: '🡹北または🡽北東',
          ko: '🡹북쪽 또는 🡽북동쪽',
        },
        left: {
          en: 'Tower (E/SE)',
          ja: '🡺東または🡾南東',
          ko: '🡺동쪽 또는 🡾남동쪽',
        },
        right: {
          en: 'Tower (W/NW)',
          ja: '🡸西または🡼北西',
          ko: '🡸서쪽 또는 🡼북서쪽',
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
        const cntMap: { [id: string]: CardinalFacing } = {
          '436': 'front',
          '437': 'right',
          '438': 'rear',
          '439': 'left',
        };
        const dir = cntMap[count];
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
          ja: '➕十字: ${dir}',
          ko: '➕십자: ${dir}쪽',
        },
        typeIntercards: {
          en: 'Intercardinal: ${dir}',
          ja: '❌斜め: ${dir}',
          ko: '❌비스듬: ${dir}쪽',
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
          ja: '(🟣扇へ)',
          ko: '(🟣 꼬깔 맞아요)',
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
        if (matches.id === 'B49A')
          return data.hasRot ? output.getHitEast!() : output.safeWest!();
        return data.hasRot ? output.getHitWest!() : output.safeEast!();
      },
      outputStrings: {
        getHitWest: {
          en: 'Spread in West Cleave',
          ja: '🡸西で散開 + 扇当たる',
          ko: '🡸서쪽에서 흩어지고 + 꼬깔 맞아요',
        },
        getHitEast: {
          en: 'Spread in East Cleave',
          ja: '🡺東で散開 + 扇当たる',
          ko: '🡺동쪽에서 흩어지고 + 꼬깔 맞아요',
        },
        safeEast: {
          en: 'Spread East + Avoid Cleave',
          ja: '🡺東で散開',
          ko: '🡺동쪽에서 흩어져요',
        },
        safeWest: {
          en: 'Spread West + Avoid Cleave',
          ja: '🡸西で散開',
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
        const moksMap: { [moks: string]: DirectionOutput8 } = {
          'D1': 'dirW',
          'D2': 'dirE',
          'D3': 'dirSW',
          'D4': 'dirSE',
        };
        const dir = moksMap[data.moks];
        if (dir === undefined)
          return output.party!();
        return output.dps!({ dir: output[dir]!() });
      },
      outputStrings: {
        tank: {
          en: 'Bait Line AoE from heads',
          ja: '無敵でビーム誘導',
          ko: '무적으로 빔 유도',
        },
        healer: Outputs.goIntoMiddle,
        party: {
          en: 'Spread, Away from heads',
          ja: '散開、頭から離れて',
          ko: '맡은 자리로',
        },
        dps: {
          en: 'Spread to ${dir}',
          ja: '散開: ${dir}',
          ko: '맡은 자리로: ${dir}',
        },
        dirW: markerStrings.dirW,
        dirE: markerStrings.dirE,
        dirSW: markerStrings.dirSW,
        dirSE: markerStrings.dirSE,
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
          ja: 'AoE誘導 x5',
          ko: '장판 유도 x5',
        },
      },
    },
    {
      id: 'R12S Curtain Call: Chain Soon',
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
          ja: '線切り 🔜 安置へ',
          ko: '줄 끊고 🔜 안전한 곳으로',
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
      response: Responses.spread('alert'),
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
          ja: '➊🡼北西ノックバック 🔜 北東ノックバック',
          ko: '➊🡼북서 넉백 🔜 북동 넉백',
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
          ja: '➋🡽北東ノックバック 🔜 北西ノックバック',
          ko: '➋🡽북동 넉백 🔜 북서 넉백',
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
      response: Responses.knockback('alarm'),
    },
    {
      id: 'R12S Refreshing Overkill',
      // 10s castTime that could end with enrage or raidwide
      type: 'StartsUsing',
      netRegex: { id: 'B538', source: 'Lindwurm', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      durationSeconds: 4.7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Prepare for Enrage',
          ja: 'まもなく時間切れです、頑張って！',
          ko: '이게 끝이야! 힘내!',
        },
      },
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
            return output.northSouthCleaves!();
          return output.northSouthCleaves!();
        }
        if (data.replication1FollowUp)
          return output.eastWestCleaves!();
        return output.eastWestCleaves!();
      },
      outputStrings: {
        northSouthCleaves: {
          en: 'North/South Cleaves',
          ja: '安置: ↔️東西',
          ko: '안전: ↔️동서',
        },
        eastWestCleaves: {
          en: 'East/West Cleaves',
          ja: '安置: ↕️南北',
          ko: '안전: ↕️남북',
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
          ja: '火: 🟣闇 一人',
          ko: '불: 🟣어둠 홀로',
        },
        dark: {
          en: 'Dark Debuff: Stack near Fire (later)',
          ja: '闇: 🔥火 ペア',
          ko: '어둠: 🔥불 페어',
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
          ja: '無職: 🟣闇 一人',
          ko: '무직: 🟣어둠 홀로',
        },
      },
    },
    {
      id: 'R12S Snaking Kick',
      // Targets random player
      type: 'StartsUsing',
      netRegex: { id: 'B527', source: 'Lindwurm', capture: true },
      delaySeconds: 0.1, // Need to delay for actor position update
      suppressSeconds: 9999,
      alertText: (data, matches, output) => {
        data.snakings++;
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.getBehind!();

        const dirNum = (Directions.hdgTo16DirNum(actor.heading) + 8) % 16;
        const dir = Directions.output16Dir[dirNum] ?? 'unknown';
        return output.getBehindDir!({ dir: output[dir]!() });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        getBehind: Outputs.getBehind,
        getBehindDir: {
          en: '${dir}',
          ja: '安全: ${dir}',
          ko: '안전: ${dir}쪽',
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
      // For first set there are two patterns that use these coordinates:
      //           (100, 86)
      // (86, 100)           (114, 100)
      //           (100, 114)
      // Either N/S are clones casting Winged Scourge, or the E/W clones cast Winged Scourge
      // Each pattern has its own pattern for IDs of the clones, in order
      // N/S will have Fire -5 and -6 of its original
      // E/W will have Fire -6 and -7 of its original
      // Could use -6 to cover both cases, but that doesn't determine which add jumps first
      type: 'Ability',
      netRegex: { id: 'B4D9', source: 'Lindschrat', capture: true },
      condition: (data, matches) => {
        if (data.replication1FollowUp) {
          const pos = data.actorPositions[matches.sourceId];
          if (pos === undefined)
            return false;
          // These values should be 0 when x or y coord has non-zero decimal values
          // Heading is also checked as the non fire clones all face a perfect heading
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
        const dn1 = Directions.xyTo8DirNum(x, actor.y, center.x, center.y);
        const dn2 = (dn1 + 4) % 8;
        const isIn = (x > 94 && x < 106);
        const dark1 = isIn ? dn2 : dn1; // 안이라고 하지만 안이 아니었다
        const dark2 = isIn ? dn1 : dn2; // 밖이라고 하지만 밖이 아니었다
        const [an1, an2] = AutumnDir.alignDir(dark1, dark2);
        const dir1 = Directions.output8Dir[an1] ?? 'unknown';
        const dir2 = Directions.output8Dir[an2] ?? 'unknown';

        return output.dark!({
          dir1: output[dir1]!(),
          dir2: output[dir2]!(),
        });
      },
      outputStrings: {
        ...markerStrings, // Cardinals should result in '???'
        dark: {
          en: 'Dark In ${dir1}/Out ${dir2}',
          ja: '🟣闇: ${dir1} ${dir2}',
          ko: '🟣어둠: ${dir1} ${dir2}',
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
        return output.getBehindDir!({ dir: output[dir]!() });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        getBehind: Outputs.getBehind,
        getBehindDir: {
          en: '${dir}',
          ja: '安全: ${dir}',
          ko: '안전: ${dir}쪽',
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
      id: 'R12S Staging 1 Tethered Clone',
      // Combatants are added ~4s before Staging starts casting
      // Same tether ID is used for "locked" ability tethers
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 17.5,
      suppressSeconds: 9999,
      infoText: (data, matches, output) => {
        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return output.cloneTether!();

        data.clonePos = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        const dir = Directions.output8Dir[data.clonePos] ?? 'unknown';
        return output.cloneTetherDir!({ dir: output[dir]!() });
      },
      outputStrings: {
        unknown: Outputs.unknown,
        dirN: {
          en: 'West Cone',
          ja: '扇 (🄰🡸 ↪反時計)',
          ko: '꼬깔 (🄰🡸 ↪반시계)',
        },
        dirE: {
          en: 'North Boss',
          ja: 'ボス (🄱🡹)',
          ko: '보스 (🄱🡹)',
        },
        dirS: {
          en: 'East Cone',
          ja: '扇 (🄲🡺 時計↩)',
          ko: '꼬깔 (🄲🡺 시계↩)',
        },
        dirW: {
          en: 'South None',
          ja: '無職 (🄳🡻)',
          ko: '무직 (🄳🡻)',
        },
        dirNW: {
          en: 'Southwest Defamation',
          ja: '◉︎大爆発 (➊🡿 ↪反時計)',
          ko: '◉︎큰폭발 (➊🡿 ↪반시계)',
        },
        dirNE: {
          en: 'Northwest Stack',
          ja: '🀜頭割り (➋🡼 時計↩)',
          ko: '🀜뭉쳐요 (➋🡼 ↪반시계)',
        },
        dirSE: {
          en: 'Northeast Stack',
          ja: '🀜頭割り (➌🡽 ↪反時計)',
          ko: '🀜뭉쳐요 (➌🡽 시계↩)',
        },
        dirSW: {
          en: 'Southeast Defamation',
          ja: '◉︎大爆発 (➍🡾 時計↩)',
          ko: '◉︎큰폭발 (➍🡾 시계↩)',
        },
        cloneTether: {
          en: 'Tethered to Clone',
          ja: '自分の分身へ',
          ko: '내 분신 쪽으로',
        },
        cloneTetherDir: {
          en: 'Tethered to ${dir} Clone',
          ja: '${dir}',
          ko: '${dir}',
        },
      },
    },
    {
      id: 'R12S Replication 2 빡딜 금지',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data, matches) => data.options.AutumnOnly && data.me === matches.target,
      delaySeconds: 5,
      durationSeconds: 5,
      suppressSeconds: 9999,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Do NOT HIT Boss until Snaking',
          ja: '🚫キックまでボス攻撃禁止🚫',
          ko: '🚫킥까지 빡딜 금지🚫',
        },
      },
    },
    {
      id: 'R12S Replication 2 and Replication 4 Ability Tethers Collect',
      // Record and store a map of where the tethers come from and what they do for later
      type: 'Tether',
      netRegex: {
        id: [
          headMarkerData['projectionTether'],
          headMarkerData['manaBurstTether'],
          headMarkerData['heavySlamTether'],
          headMarkerData['fireballSplashTether'],
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
        if (data.phase === 'replication2') {
          // Handle boss tether separately as its direction location is unimportant
          if (matches.id !== headMarkerData['fireballSplashTether'])
            data.replication2DirNumAbility[dirNum] = matches.id;
        }
        if (data.phase === 'idyllic')
          data.replication4DirNumAbility[dirNum] = matches.id;
      },
    },
    {
      id: 'R12S Replication 2 Locked Tether Collect',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data) => {
        if (
          data.phase === 'replication2' &&
          data.replicationCounter === 2
        )
          return true;
        return false;
      },
      run: (data, matches) => {
        const target = matches.target;
        const sourceId = matches.sourceId;
        // Check if boss tether
        if (data.replication2BossId === sourceId)
          data.replication2PlayerAbilities[target] = headMarkerData['fireballSplashTether'];
        else if (data.replication2BossId !== sourceId) {
          const actor = data.actorPositions[sourceId];
          if (actor === undefined) {
            // Setting to use that we know we have a tether but couldn't determine what ability it is
            data.replication2PlayerAbilities[target] = 'unknown';
            return;
          }

          const dirNum = Directions.xyTo8DirNum(
            actor.x,
            actor.y,
            center.x,
            center.y,
          );

          // Lookup what the tether was at the same location
          const ability = data.replication2DirNumAbility[dirNum];
          if (ability === undefined) {
            // Setting to use that we know we have a tether but couldn't determine what ability it is
            data.replication2PlayerAbilities[target] = 'unknown';
            return;
          }
          data.replication2PlayerAbilities[target] = ability;
        }
      },
    },
    {
      id: 'R12S Replication 2 Locked Tether',
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
      durationSeconds: 4.5,
      alertText: (data, matches, output) => {
        // Check if it's the boss
        if (data.replication2BossId === matches.sourceId)
          return output.fireballSplashTether!();

        const ability = data.replication2PlayerAbilities[data.me];
        switch (ability) {
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
          ja: '端扇誘導: 外側',
          ko: '끝단 꼬깔 유도: 바깥쪽',
        },
        manaBurstTether: {
          en: 'Defamation Tether',
          ja: '大爆発誘導',
          ko: '큰폭발 유도',
        },
        heavySlamTether: {
          en: 'Cone Tether: Bait Protean from Boss',
          ja: '端扇誘導: 内側',
          ko: '끝단 꼬깔 유도: 안쪽',
        },
        fireballSplashTether: {
          en: 'Boss Tether: Bait Jump',
          ja: '🄱 ボス誘導',
          ko: '🄱 안쪽 보스 유도',
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
      durationSeconds: 4.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.replication2PlayerAbilities[data.me] !== undefined)
          return;
        return output.noTether!();
      },
      outputStrings: {
        noTether: {
          en: 'Bait Defamation => Stack Groups',
          ja: '🄳 大爆発 🔜 ➋ 頭割り',
          ko: '🄳 큰폭발 🔜 ➋ 뭉쳐요',
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
        let cone = output.checkCone!();
        const ability = data.replication2PlayerAbilities[data.me];
        switch (ability) {
          case headMarkerData['projectionTether']:
            cone = output.haveCone!();
            if (data.clonePos === AutumnNumDir.S)
              side = output.mark3!();
            else if (data.clonePos === AutumnNumDir.N)
              side = output.mark2!();
            break;
          case headMarkerData['manaBurstTether']:
            if (data.clonePos === AutumnNumDir.SW)
              side = output.mark3!();
            else if (data.clonePos === AutumnNumDir.NW)
              side = output.mark2!();
            break;
          case headMarkerData['heavySlamTether']:
            if (data.clonePos === AutumnNumDir.SE)
              side = output.mark3!();
            else if (data.clonePos === AutumnNumDir.NE)
              side = output.mark2!();
            break;
          case headMarkerData['fireballSplashTether']:
            side = output.mark3!();
            break;
          default: // 무직
            side = output.mark2!();
            break;
        }
        if (data.options.AutumnOnly)
          return output.burst!({ cone: cone, side: side });
        return output.text!({ cone: cone, side: side });
      },
      outputStrings: {
        mark2: {
          en: 'North Side',
          ja: '➋',
          ko: '➋',
        },
        mark3: {
          en: 'South Side',
          ja: '➌',
          ko: '➌',
        },
        checkCone: {
          en: 'Stack Groups',
          ja: '扇確認',
          ko: '꼬깔 보고',
        },
        haveCone: {
          en: 'Front Stack Groups',
          ja: '自分に扇、先頭へ',
          ko: '내게 꼬깔, 선두로',
        },
        text: {
          en: '${side} ${cone} => Get Behind',
          ja: '${side} ${cone} 🔜 ボス背面へ',
          ko: '${side} ${cone} 🔜 엉댕이로',
        },
        burst: {
          en: '${side} ${cone} => Get Behind',
          ja: '${side} ${cone} 🔜 ボス背面へ',
          ko: '${side} ${cone} 🔜 💥빡딜💥 + 엉댕이로',
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
      netRegex: { id: 'B4EA', source: 'Lindwurm', capture: false },
      suppressSeconds: 9999,
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
        return output.getBehindDir!({ dir: output[dir]!() });
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        getBehind: Outputs.getBehind,
        getBehindDir: {
          en: '${dir}',
          ja: '安全: ${dir}',
          ko: '안전: ${dir}쪽',
        },
      },
    },
    {
      id: 'R12S Netherwrath Near/Far',
      type: 'Ability',
      netRegex: { id: 'B4EA', source: 'Lindwurm', capture: false },
      delaySeconds: 6,
      durationSeconds: 8,
      suppressSeconds: 9999,
      alertText: (data, _matches, output) => {
        const ability = data.replication2PlayerAbilities[data.me];
        switch (ability) {
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
          ja: '端扇ペア: サークル外側',
          ko: '끝단 페어: 서클 바깥',
        },
        heavySlamTether: {
          en: 'Pair',
          ja: '端扇ペア: サークル内側',
          ko: '끝단 페어: 서클 안',
        },
        others: {
          en: 'Inner',
          ko: '안쪽 넷이 뭉쳐요',
        },
      },
    },
    {
      id: 'R12S Netherwrath After',
      type: 'Ability',
      netRegex: { id: ['B52E', 'B52F'], source: 'Lindwurm', capture: false },
      delaySeconds: 2,
      durationSeconds: 6,
      alertText: (data, _matches, output) => {
        const ability = data.replication2PlayerAbilities[data.me];
        switch (ability) {
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
          ja: '端扇誘導: 外側',
          ko: '끝단 꼬깔 유도: 바깥쪽',
        },
        heavySlamTether: {
          en: 'Cone Tether: Bait Protean from Boss',
          ja: '端扇誘導: 内側',
          ko: '끝단 꼬깔 유도: 안쪽',
        },
        others: {
          en: 'Inner',
          ja: '➋ 頭割り 🔜 ➌ 頭割り',
          ko: '➋ 뭉쳤다 🔜 ➌ 뭉쳐요',
        },
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
        const sphereMap: { [id: number]: SphereType } = {
          19205: 'blackHole',
          19206: 'water',
          19207: 'wind',
          19208: 'lightning',
          19209: 'fire',
        };
        const npcBaseId = parseInt(matches.npcBaseId);
        const sphere = sphereMap[npcBaseId];
        if (sphere !== undefined)
          data.manaSpheres[id] = sphere;
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
          ja: '変異: α',
          ko: '변이: α',
        },
        beta: {
          en: 'Mutation β on YOU',
          ja: '変異: β',
          ko: '변이: β',
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
          return output.alphaDir!({ dir: output[blackHole]!() });

        const y1 = data.eastManaSpheres[sphereId1]?.y ?? data.westManaSpheres[sphereId1]?.y;
        const y2 = data.eastManaSpheres[sphereId2]?.y ?? data.westManaSpheres[sphereId2]?.y;
        if (y1 === undefined || y2 === undefined) {
          return output.betaDir!({
            dir: output[popSide]!(),
            shape1: output[sphereType1]!(),
            shape2: output[sphereType2]!(),
          });
        }

        const selectedSphere = data.role === 'tank'
          ? (y1 < y2 ? sphereId2 : sphereId1)
          : (y1 > y2 ? sphereId2 : sphereId1);
        return output.betaAct!({
          dir: output[popSide]!(),
          shape: output[data.manaSpheres[selectedSphere]!]!(),
        });
      },
      outputStrings: {
        east: markerStrings.dirE,
        west: markerStrings.dirW,
        water: {
          en: 'Orb',
          ja: '💧水',
          ko: '💧물',
        },
        lightning: {
          en: 'Lightning',
          ja: '🟪雷',
          ko: '🟪번개',
        },
        fire: {
          en: 'Fire',
          ja: '🔥火',
          ko: '🔥불',
        },
        wind: {
          en: 'Donut',
          ja: '🟢風',
          ko: '🟢바람',
        },
        alpha: {
          en: 'Avoid Shape AoEs, Wait by Black Hole',
          ja: '形状回避',
          ko: '물체 피해요',
        },
        beta: {
          en: 'Shared Shape Soak => Get by Black Hole',
          ja: '形状へ',
          ko: '물체 문대요',
        },
        alphaDir: {
          en: 'Avoid Shape AoEs (Black Hole: ${dir})',
          ja: '形状回避 (ブラックホール: ${dir})',
          ko: '물체 피해요 (블랙홀: ${dir}쪽)',
        },
        betaDir: {
          en: 'Share ${dir} ${shape1}/${shape2}',
          ja: '${dir}${shape1}/${shape2}へ',
          ko: '${dir} ${shape1} ${shape2} 문대요',
        },
        betaAct: {
          en: 'Share ${dir} ${shape}',
          ja: '${dir}${shape}へ',
          ko: '${dir} ${shape} 문대요',
        },
      },
    },
    {
      id: 'R12S Dramatic Lysis Black Hole 1 Reminder',
      // This may not happen if all shapes are failed
      type: 'Ability',
      netRegex: { id: ['B507'], source: 'Lindwurm', capture: false },
      durationSeconds: 6.5,
      suppressSeconds: 9999,
      alertText: (data, _matches, output) => {
        const blackHole = data.firstBlackHole;
        if (blackHole === undefined)
          return output.safe!();
        return output.safeDir!({ dir: output[blackHole]!() });
      },
      outputStrings: {
        east: markerStrings.dirE,
        west: markerStrings.dirW,
        safe: {
          en: 'Get by Black Hole',
          ja: 'ブラックホールへ',
          ko: '블랙홀 쪽으로',
        },
        safeDir: {
          en: '${dir} Black Hole + N/S',
          ja: '安全: ${dir}',
          ko: '안전: ${dir}',
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
      durationSeconds: 3.5,
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
        east: markerStrings.dirE,
        west: markerStrings.dirW,
        move: {
          en: 'Move to other Black Hole',
          ja: '反対側のブラックホールへ',
          ko: '반대쪽 블랙홀로',
        },
        moveDir: {
          en: '${dir} Black Hole + N/S',
          ja: '安全: ${dir}',
          ko: '안전: ${dir}',
        },
      },
    },
    {
      id: 'R12S Netherworld Near/Far',
      type: 'StartsUsing',
      netRegex: { id: ['B52B', 'B52C'], source: 'Lindwurm', capture: true },
      durationSeconds: 8,
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
          ja: '近接最大',
          ko: '센터 서클 바깥',
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
      id: 'R12S Dream',
      type: 'StartsUsing',
      netRegex: { id: 'B509', source: 'Lindwurm', capture: false },
      durationSeconds: 4.7,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'R12S Dream Staging 2 Clone Order Collect',
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
      id: 'R12S Dream Staging 2 First Clone Cardinal/Intercardinal',
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
          ja: '(予告: ${cards})',
          ko: '(예고: ${cards})',
        },
      },
    },
    {
      id: 'R12S Dream Staging 2 Tethered Clone Collect',
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
      id: 'R12S Dream Staging 2 Tethered Clone',
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
      durationSeconds: 7,
      suppressSeconds: 9999,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...markerStrings,
          position: {
            en: 'Tethered to ${dir} (Position)',
            ja: 'その場で: ${dir}',
            ko: '맡은 자리로: ${dir}',
          },
          swap: {
            en: 'Tethered to ${dir} (Swap)',
            ja: '入れ替え: ${dir}',
            ko: '자리 바꿔요: ${dir}',
          },
        };

        const actor = data.actorPositions[matches.sourceId];
        if (actor === undefined)
          return { infoText: output.position!({ dir: output.unknown!() }) };

        const dirNum = Directions.xyTo8DirNum(actor.x, actor.y, center.x, center.y);
        let swap;
        switch (dirNum) {
          case AutumnNumDir.NW:
            data.clonePos = AutumnNumDir.E;
            swap = true;
            break;
          case AutumnNumDir.E:
            data.clonePos = AutumnNumDir.NW;
            swap = true;
            break;
          case AutumnNumDir.SW:
            data.clonePos = AutumnNumDir.S;
            swap = true;
            break;
          case AutumnNumDir.S:
            data.clonePos = AutumnNumDir.SW;
            swap = true;
            break;
          default:
            data.clonePos = dirNum;
            swap = false;
            break;
        }
        data.isLeft = data.clonePos >= AutumnNumDir.S && data.clonePos <= AutumnNumDir.NW;
        const dir = Directions.output8Dir[data.clonePos] ?? 'unknown';
        if (swap)
          return { alertText: output.swap!({ dir: output[dir]!() }) };
        return { infoText: output.position!({ dir: output[dir]!() }) };
      },
    },
    {
      id: 'R12S Dream Staging 2 Markers',
      type: 'Ability',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: false },
      condition: (data) => data.twistedVisionCounter === 1,
      infoText: (_data, _matches, output) => output.markers!(),
      outputStrings: {
        markers: {
          en: 'Marking yourself',
          ja: 'マーカー付けて',
          ko: '마커 달아요',
        },
      },
    },
    {
      id: 'R12S Dream Power Gusher and Snaking Kick Collect',
      // Need to know these for later
      // B511 Snaking Kick
      // B512 from boss is the VFX and has headings that show directions for B50F and B510
      // B50F Power Gusher is the East/West caster
      // B510 Power Gusher is the North/South caster
      // Right now just the B510 caster is needed to resolve
      type: 'StartsUsing',
      netRegex: { id: ['B50F', 'B510', 'B511'], source: 'Lindschrat', capture: true },
      run: (data, matches) => {
        // Temporal Curtain can have early calls based on matching the id for which add went where
        switch (matches.id) {
          case 'B510': {
            const y = parseFloat(matches.y);
            data.idyllicVision2NorthSouthCleaveSpot = y < center.y ? 'north' : 'south';
            data.idyllicDreamActorEW = matches.sourceId;
            return;
          }
          case 'B511':
            data.idyllicDreamActorSnaking = matches.sourceId;
            return;
          case 'B50F':
            data.idyllicDreamActorNS = matches.sourceId;
            return;
        }
      },
    },
    {
      id: 'R12S Dream Power Gusher Vision',
      // Call where the E/W safe spots will be later
      type: 'StartsUsing',
      netRegex: { id: 'B510', source: 'Lindschrat', capture: true },
      infoText: (_data, matches, output) => {
        const y = parseFloat(matches.y);
        const dir = y < center.y ? 'north' : 'south';
        return output.text!({ dir: output[dir]!(), sides: output.sides!() });
      },
      outputStrings: {
        north: {
          en: 'North',
          ja: '北➊➋',
          ko: '북쪽➊➋',
        },
        south: {
          en: 'South',
          ja: '南➌➍',
          ko: '남쪽➌➍',
        },
        sides: Outputs.sides,
        text: {
          en: '${dir} + ${sides} (later)',
          ja: '(予告: ${dir} ${sides})',
          ko: '(예고: ${dir} ${sides})',
        },
      },
    },
    {
      id: 'R12S Replication 4 Ability Tethers',
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
      delaySeconds: 0.1,
      suppressSeconds: 9999,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          getTether: {
            en: 'Get Tether',
            ja: '線取り',
            ko: '줄 채요',
          },
          stay: {
            en: 'Stay in Position',
            ja: '🀜その場で線取り',
            ko: '🀜그대로 줄 채요',
          },
          switchPosition: {
            en: 'Switch Position',
            ja: '🀝入れ替えして線取り',
            ko: '◉︎자리 바꿔 줄 채요',
          },
        };

        // 여기 부근에 드림 순서 처리
        const first = data.replication4DirNumAbility[0];
        if (first === undefined)
          return { infoText: output.getTether!() };
        if (first !== headMarkerData['manaBurstTether'])
          return { infoText: output.stay!() };
        return { alertText: output.switchPosition!() };
      },
    },
    {
      id: 'R12S Replication 4 Locked Collect',
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

        // Store the player at each dirNum
        data.replication4BossCloneDirNumPlayers[dirNum] = target;

        // Lookup what the tether was at the same location
        const ability = data.replication4DirNumAbility[dirNum];
        if (ability === undefined) {
          // Setting to use that we know we have a tether but couldn't determine what ability it is
          data.replication4PlayerAbilities[target] = 'unknown';
          return;
        }
        data.replication4PlayerAbilities[target] = ability;
      },
    },
    {
      id: 'R12S Replication 4 Locked',
      type: 'Tether',
      netRegex: { id: headMarkerData['lockedTether'], capture: true },
      condition: (data, matches) =>
        data.phase === 'idyllic' &&
        data.twistedVisionCounter === 3 &&
        data.me === matches.target,
      delaySeconds: 0.1,
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        const spot = data.idyllicVision2NorthSouthCleaveSpot;
        const dir = spot === undefined ? 'unknown' : spot;
        return output.text!({ dir: output[dir]!() });
      },
      outputStrings: {
        unknown: Outputs.unknown,
        north: {
          en: 'North',
          ja: '北➊➋',
          ko: '북쪽➊➋',
        },
        south: {
          en: 'South',
          ja: '南➌➍',
          ko: '남쪽➌➍',
        },
        text: {
          en: '${dir} => 4:4 + Big AoE',
          ja: '${dir} 🔜 分断 + 全体攻撃',
          ko: '${dir} 바깥 🔜 분단 + 전체 공격',
        },
      },
    },
    {
      id: 'R12S Arcadian Arcanum',
      type: 'StartsUsing',
      netRegex: { id: 'B529', source: 'Lindwurm', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Look for Towers',
          ja: '塔を確認',
          ko: '맡은 타워로',
        },
      },
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
      condition: (data, matches) => {
        if (data.twistedVisionCounter === 3 && data.me === matches.target)
          return true;
        return false;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Soak Fire/Earth Meteor (later)',
          ja: '(予告: 🔥火または🟤土の塔)',
          ko: '(예고: 🔥불 또는 🟤땅 타워)',
        },
      },
    },
    {
      id: 'R12S No Light Resistance Down II',
      type: 'GainsEffect',
      netRegex: { effectId: '1044', capture: false },
      condition: (data) => data.twistedVisionCounter === 3,
      delaySeconds: 0.1,
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        if (!data.hasLightResistanceDown)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Soak a White/Star Meteor (later)',
          ja: '(予告: ⚪白または⭐星の塔)',
          ko: '(예고: ⚪빛 또는 ⭐별 타워)',
        },
      },
    },
    {
      id: 'R12S Vision 4 Enter',
      type: 'StartsUsing',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: false },
      condition: (data) => data.twistedVisionCounter === 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = twistedVisionStrings;

        const abilityId = data.replication4DirNumAbility[0]; // Only need to know one
        if (abilityId === undefined)
          return;

        const ability = abilityId === headMarkerData['manaBurstTether']
          ? 'defamations'
          : abilityId === headMarkerData['heavySlamTether']
          ? 'stacks'
          : 'unknown';
        const stacks = data.isLeft ? output.stackLeft!() : output.stackRight!();

        if (ability === 'stacks') {
          // p3, p4가 두번째 기믹인 큰폭발을 처리, 널처리는 안함
          const p3 = data.replication4BossCloneDirNumPlayers[1];
          const p4 = data.replication4BossCloneDirNumPlayers[5];
          if (p3 === undefined || p4 === undefined)
            return;

          if (data.me === p3 || data.me === p4) {
            const defa = data.isLeft ? output.defaLeft!() : output.defaRight!();
            return { infoText: output.stackDefa!({ pos1: stacks, pos2: defa }) };
          }
          return { infoText: output.stackAvoid!({ pos: stacks }) };
        }

        if (ability === 'defamations') {
          // p1, p2가 첫번째 기믹인 큰폭발을 처리, 널처리는 안함
          const p1 = data.replication4BossCloneDirNumPlayers[0];
          const p2 = data.replication4BossCloneDirNumPlayers[4];
          if (p1 === undefined || p2 === undefined)
            return;

          if (data.me === p1 || data.me === p2) {
            const defa = data.isLeft ? output.defaLeft!() : output.defaRight!();
            return { alertText: output.defaStack!({ pos1: defa, pos2: stacks }) };
          }
          return { infoText: output.avoidStack!({ pos: stacks }) };
        }
      },
    },
    {
      id: 'R12S Vision 4 Left',
      type: 'Ability',
      netRegex: { id: ['B519', 'B517'], source: 'Lindschrat', capture: false },
      condition: (data) => data.twistedVisionCounter === 4 && data.twistedVision4MechCounter < 6,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = twistedVisionStrings;

        data.twistedVision4MechCounter = data.twistedVision4MechCounter + 2;
        if (data.twistedVision4MechCounter < 2)
          return;

        const count = data.twistedVision4MechCounter;
        const players = data.replication4BossCloneDirNumPlayers;
        const abilityIds = data.replication4DirNumAbility;
        const p1 = count === 2 ? players[1] : count === 4 ? players[2] : players[3];
        const p2 = count === 2 ? players[5] : count === 4 ? players[6] : players[7];
        const abilityId = count === 2 ? abilityIds[1] : count === 4 ? abilityIds[2] : abilityIds[3];
        if (abilityId === undefined || p1 === undefined || p2 === undefined)
          return;

        const ability = abilityId === headMarkerData['manaBurstTether']
          ? 'defamations'
          : abilityId === headMarkerData['heavySlamTether']
          ? 'stacks'
          : 'unknown';
        const stacks = data.isLeft ? output.stackLeft!() : output.stackRight!();

        if (count < 6) {
          if (ability === 'stacks') {
            const p3 = count === 2 ? players[2] : players[3];
            const p4 = count === 2 ? players[6] : players[7];
            if (p3 === undefined || p4 === undefined)
              return;

            // p1, p2가 뭉쳐
            if (data.me === p1 || data.me === p2)
              return { alertText: output.stackAvoid!({ pos: stacks }) };
            if (data.me === p3 || data.me === p4) {
              const defa = data.isLeft ? output.defaLeft!() : output.defaRight!();
              return { infoText: output.stackDefa!({ pos1: stacks, pos2: defa }) };
            }
            return { infoText: output.stackAvoid!({ pos: stacks }) };
          }

          if (ability === 'defamations') {
            // p1, p2가 큰폭발
            if (data.me === p1 || data.me === p2) {
              const defa = data.isLeft ? output.defaLeft!() : output.defaRight!();
              return { alertText: output.defaStack!({ pos1: defa, pos2: stacks }) };
            }
            return { infoText: output.avoidStack!({ pos: stacks }) };
          }
        }

        if (ability === 'stacks') {
          // p1, p2가 뭉쳐
          if (data.me === p1 || data.me === p2)
            return { alertText: output.stackTower!({ pos: stacks }) };
          return { infoText: output.stackTower!({ pos: stacks }) };
        }

        if (ability === 'defamations') {
          if (data.me === p1 || data.me === p2) {
            const defa = data.isLeft ? output.defaLeft!() : output.defaRight!();
            return { alertText: output.defaTower!({ pos: defa }) };
          }
          return { infoText: output.avoidTower!() };
        }
      },
    },
    {
      id: 'R12S Vision 5 Towers',
      // TODO: Get Position of the towers and player side and state the front/left back/right
      // Towers aren't visible until after cast, but you would have 4.4s to adjust if the trigger was delayed
      // 4s castTime
      type: 'StartsUsing',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: true },
      condition: (data) => data.twistedVisionCounter === 5,
      durationSeconds: (_data, matches) => parseFloat(matches.castTime) + 4.1,
      alertText: (data, _matches, output) => {
        if (data.hasLightResistanceDown)
          return output.fireEarthTower!();
        return output.holyTower!();
      },
      outputStrings: {
        fireEarthTower: {
          en: 'Soak Fire/Earth Meteor',
          ja: '🔥火または🟤土の塔へ',
          ko: '🔥불 또는 🟤땅 타워로',
        },
        holyTower: {
          en: 'Soak a White/Star Meteor',
          ja: '⚪白または⭐星の塔へ',
          ko: '⚪빛 또는 ⭐별 타워로',
        },
      },
    },
    {
      id: 'R12S Hot-blooded',
      // Player can still cast, but shouldn't move for 5s duration
      type: 'GainsEffect',
      netRegex: { effectId: '12A0', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      response: (_data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: 'DO NOT MOVE',
            ja: '移動禁止！',
            ko: '움직이면 죽어욧!',
          },
        };
        return {
          alarmText: output.text!(),
          alertText: output.text!(),
          infoText: output.text!(),
        };
      },
      run: (data) => data.hasPyretic = true,
    },
    {
      id: 'R12S Dream Lindwurm\'s Stone III',
      // 5s castTime
      type: 'StartsUsing',
      netRegex: { id: 'B4F7', source: 'Lindwurm', capture: true },
      delaySeconds: 0.1,
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.hasPyretic)
          return output.avoidEarthTower!();
      },
      outputStrings: {
        avoidEarthTower: {
          en: 'Avoid Earth Tower',
          ja: '土の塔を回避',
          ko: '곧 땅 기둥, 피해요',
        },
      },
    },
    {
      id: 'R12S Doom Collect',
      // Happens about 1.3s after Dark Tower when it casts B4F6 Lindwurm's Dark II
      type: 'GainsEffect',
      netRegex: { effectId: 'D24', capture: true },
      run: (data, matches) => {
        data.doomPlayers.push(matches.target);
        if (data.me === matches.target)
          data.hasDoom = true;
      },
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
          ja: 'エスナ: ${target}',
          ko: '에스나: ${target}',
        },
        cleanseDoom2: {
          en: 'Cleanse ${target1}/${target2}',
          ja: 'エスナ: ${target1}/${target2}',
          ko: '에스나: ${target1}, ${target2}',
        },
      },
    },
    {
      id: 'R12S Nearby and Faraway Portent',
      // 129D Lindwurm's Portent prevents stacking the portents
      // 129E Farwaway Portent
      // 129F Nearby Portent
      // 10s duration, need to delay to avoid earth + doom trigger overlap
      // This would go out to players that soaked white/holy meteors
      type: 'GainsEffect',
      netRegex: { effectId: ['129E', '129F'], capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5.3,
      alertText: (data, matches, output) => {
        if (matches.id === '129E') {
          if (data.hasDoom)
            return output.farOnYouDark!();
          return output.farOnYouWind!();
        }
        if (data.hasDoom)
          return output.nearOnYouDark!();
        return output.nearOnYouWind!();
      },
      outputStrings: {
        nearOnYouWind: {
          en: 'Wind: Near on YOU',
          ja: 'ニア🟢風: 数字の端に',
          ko: '니어 🟢바람: 숫자 모서리',
        },
        nearOnYouDark: {
          en: 'Dark: Near on YOU',
          ja: 'ニア🟣闇: 数字の端に',
          ko: '니어 🟣어둠: 숫자 모서리',
        },
        farOnYouWind: {
          en: 'Wind: Far on YOU',
          ja: 'ファー🟢風: サークル内へ',
          ko: '파 🟢바람: 남쪽 서클 안으로',
        },
        farOnYouDark: {
          en: 'Dark: Far on YOU',
          ja: 'ファー🟣闇: サークル内へ',
          ko: '파 🟣어둠: 남쪽 서클 안으로',
        },
      },
    },
    {
      id: 'R12S Nearby and Faraway Portent Baits',
      // This would go out on players that soaked fire/earth meteors
      type: 'GainsEffect',
      netRegex: { effectId: ['129E', '129F'], capture: true },
      condition: (data) => data.hasLightResistanceDown,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5.3,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.hasPyretic)
          return output.baitFire!();
        return output.baitEarth!();
      },
      outputStrings: {
        baitFire: {
          en: 'Fire: Bait Cone',
          ja: '無職 🔥火: 北扇誘導',
          ko: '무직 🔥불: 북쪽 꼬깔 유도',
        },
        baitEarth: {
          en: 'Earth: Bait Cone',
          ja: '無職 🟤土: 南扇誘導',
          ko: '무직 🟤땅: 남쪽 꼬깔 유도',
        },
      },
    },
    {
      id: 'R12S Curtain Part 1 Collect',
      // Describe actor going into portal
      type: 'Ability',
      netRegex: { id: 'B51D', source: 'Lindschrat', capture: true },
      run: (data, matches) => {
        switch (matches.sourceId) {
          case data.idyllicDreamActorEW:
            data.idyllicVision8SafeSides = 'frontBack';
            return;
          case data.idyllicDreamActorNS:
            data.idyllicVision8SafeSides = 'sides';
        }
      },
    },
    {
      id: 'R12S Curtain Part 1',
      // Describe actor going into portal
      type: 'Ability',
      netRegex: { id: 'B51D', source: 'Lindschrat', capture: true },
      infoText: (data, matches, output) => {
        switch (matches.sourceId) {
          case data.idyllicDreamActorEW:
            return output.frontBackLater!();
          case data.idyllicDreamActorNS:
            return output.sidesLater!();
        }
      },
      outputStrings: {
        frontBackLater: {
          en: 'Portal + Front/Back Clone (later)',
          ja: '(予告: ポータル + ↔️東西安全)',
          ko: '(예고: 포탈 + ↔️동서 안전)',
        },
        sidesLater: {
          en: 'Portal + Sides Clone (later)',
          ja: '(予告: ポータル + ↕️南北安全)',
          ko: '(예고: 포탈 + ↕️남북 안전)',
        },
      },
    },
    {
      id: 'R12S Curtain Part 2 Collect',
      // Describe actor going into portal
      type: 'AbilityExtra',
      netRegex: { id: 'B4D9', capture: true },
      run: (data, matches) => {
        switch (matches.sourceId) {
          case data.idyllicDreamActorEW:
            data.idyllicVision7SafeSides = 'frontBack';
            return;
          case data.idyllicDreamActorNS:
            data.idyllicVision7SafeSides = 'sides';
            return;
          case data.idyllicDreamActorSnaking: {
            const x = parseFloat(matches.x);
            data.idyllicVision7SafePlatform = x < 100 ? 'east' : 'west';
          }
        }
      },
    },
    {
      id: 'R12S Curtain Part 2',
      // Describe actor going into portal
      type: 'AbilityExtra',
      netRegex: { id: 'B4D9', capture: false },
      infoText: (data, _matches, output) => {
        if (data.idyllicVision7SafeSides === 'frontBack') {
          if (data.idyllicVision7SafePlatform === 'east')
            return output.frontBackEastLater!();
          if (data.idyllicVision7SafePlatform === 'west')
            return output.frontBackWestLater!();
        }
        if (data.idyllicVision7SafeSides === 'sides') {
          if (data.idyllicVision7SafePlatform === 'east')
            return output.sidesEastLater!();
          if (data.idyllicVision7SafePlatform === 'west')
            return output.sidesWestLater!();
        }
      },
      outputStrings: {
        frontBackWestLater: {
          en: 'West Platform => Front/Back Clone (later)',
          ja: '(予告: 🄳🡸 島 🔜 ↔️東西安全)',
          ko: '(예고: 🄳🡸 섬 🔜 ↔️동서 안전)',
        },
        sidesWestLater: {
          en: 'West Platform => Sides Clone (later)',
          ja: '(予告: 🄳🡸 島 🔜 ↕️南北安全)',
          ko: '(예고: 🄳🡸 섬 🔜 ↕️남북 안전)',
        },
        frontBackEastLater: {
          en: 'East Platform => Front/Back Clone (later)',
          ja: '(予告: 🄱🡺 島 🔜 ↔️東西安全)',
          ko: '(예고: 🄱🡺 섬 🔜 ↔️동서 안전)',
        },
        sidesEastLater: {
          en: 'East Platform => Sides Clone (later)',
          ja: '(予告: 🄱🡺 島 🔜 ↕️南北安全)',
          ko: '(예고: 🄱🡺 섬 🔜 ↕️남북 안전)',
        },
      },
    },
    {
      id: 'R12S Vision 6 Light Party Stacks',
      type: 'Ability',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: false },
      condition: (data) => data.twistedVisionCounter === 6,
      alertText: (data, _matches, output) => {
        const dir = Autumn.inMainTeam(data.moks) ? output.left!() : output.right!();
        return output.stack!({ dir: dir });
      },
      outputStrings: {
        left: {
          en: 'Left',
          ja: '➊🡼',
          ko: '➊🡼',
        },
        right: {
          en: 'Right',
          ja: '➍🡿',
          ko: '➍🡿',
        },
        stack: {
          en: 'Stack ${dir} + Lean Middle Out',
          ja: '頭割り: ${dir}外側へ',
          ko: '뭉쳐요: ${dir} 바깥',
        },
      },
    },
    {
      id: 'R12S Vision 7 Safe Platform',
      type: 'StartsUsing',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: true },
      condition: (data) => data.twistedVisionCounter === 7,
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (data, _matches, output) => {
        if (data.idyllicVision7SafeSides === 'frontBack') {
          if (data.idyllicVision7SafePlatform === 'east')
            return output.frontBackEastPlatform!();
          if (data.idyllicVision7SafePlatform === 'west')
            return output.frontBackWestPlatform!();
        }
        if (data.idyllicVision7SafeSides === 'sides') {
          if (data.idyllicVision7SafePlatform === 'east')
            return output.sidesEastPlatform!();
          if (data.idyllicVision7SafePlatform === 'west')
            return output.sidesWestPlatform!();
        }
        return output.safePlatform!();
      },
      outputStrings: {
        safePlatform: {
          en: 'Move to Safe Platform Side => Dodge Cleaves',
          ja: '安全な島へ 🔜 攻撃を避ける',
          ko: '안전한 섬으로 🔜 공격 피해요',
        },
        sidesWestPlatform: {
          en: 'West Platform => Sides of Clone',
          ja: '🄳🡸 島 🔜 ↕️南北安全',
          ko: '🄳🡸 섬 🔜 ↕️남북 안전',
        },
        sidesEastPlatform: {
          en: 'East Platform => Sides of Clone',
          ja: '🄱🡺 島 🔜 ↕️南北安全',
          ko: '🄱🡺 섬 🔜 ↕️남북 안전',
        },
        frontBackEastPlatform: {
          en: 'East Platform => Front/Back of Clone',
          ja: '🄱🡺 島 🔜 ↔️東西安全',
          ko: '🄱🡺 섬 🔜 ↔️동서 안전',
        },
        frontBackWestPlatform: {
          en: 'West Platform => Front/Back of Clone',
          ja: '🄳🡸 島 🔜 ↔️東西安全',
          ko: '🄳🡸 섬 🔜 ↔️동서 안전',
        },
      },
    },
    {
      id: 'R12S Vision 8 Light Party Stacks',
      // At end of cast it's cardinal or intercard
      type: 'StartsUsing',
      netRegex: { id: 'BBE2', source: 'Lindwurm', capture: false },
      condition: (data) => data.twistedVisionCounter === 8,
      alertText: (data, _matches, output) => {
        const dir = Autumn.inMainTeam(data.moks) ? output.left!() : output.right!();
        return output.stack!({ dir: dir });
      },
      outputStrings: {
        left: {
          en: 'Left',
          ja: '🄰🡹',
          ko: '🄰🡹',
        },
        right: {
          en: 'Right',
          ja: '🄳🡸',
          ko: '🄳🡸',
        },
        stack: {
          en: 'Stack ${dir} + Lean Middle Out',
          ja: '頭割り: ${dir}外側へ',
          ko: '뭉쳐요: ${dir} 바깥',
        },
      },
    },
    {
      id: 'R12S Vision 8 Dodge Cleaves',
      // Trigger on Clone's BE5D Heavy Slam
      type: 'Ability',
      netRegex: { id: 'BE5D', source: 'Lindwurm', capture: false },
      alertText: (data, _matches, output) => {
        if (data.idyllicVision8SafeSides === 'sides')
          return output.sides!();
        if (data.idyllicVision8SafeSides === 'frontBack')
          return output.frontBack!();
      },
      run: (data) => {
        // Prevent re-execution of output
        delete data.idyllicVision8SafeSides;
      },
      outputStrings: {
        sides: {
          en: 'Sides of Clone',
          ja: '安全: ↕️南北',
          ko: '안전: ↕️남북',
        },
        frontBack: {
          en: 'Front/Back of Clone',
          ja: '安全: ↔️東西',
          ko: '안전: ↔️동서',
        },
      },
    },
    {
      id: 'R12S Arcadian Hell',
      type: 'StartsUsing',
      netRegex: { id: 'B533', source: 'Lindwurm', capture: false },
      durationSeconds: 4.7,
      response: Responses.bigAoe(),
    },
    {
      id: 'R12S Arcadian Hell Enrage',
      type: 'StartsUsing',
      netRegex: { id: 'B537', source: 'Lindwurm', capture: true },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Prepare for Enrage',
          ja: 'まもなく時間切れです、頑張って！',
          ko: '이게 끝이야! 힘내!',
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
        'Netherwrath Near/Netherwrath Far': 'ネザーレイジ 近/遠',
        'Netherworld Near/Netherwworld Far': 'ネザーワールド 近/遠',
      },
    },
  ],
};

export default triggerSet;
