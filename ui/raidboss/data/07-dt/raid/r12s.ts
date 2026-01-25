import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Phase =
  | 'doorboss'
  | 'curtainCall'
  | 'slaughtershed'
  | 'replication1'
  | 'replication2'
  | 'idyllic';

type MortalInfo = {
  purple: boolean;
  left: boolean;
  moks: string;
};

export interface Data extends RaidbossData {
  readonly triggerSetConfig: {
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
  replication1Debuff?: 'fire' | 'dark';
  replication1FireActor?: string;
  replication1FollowUp: boolean;
  // prt
  mortalList: MortalInfo[];
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
} as const;

const center = {
  x: 100,
  y: 100,
} as const;

const phaseMap: { [id: string]: Phase } = {
  'BEC0': 'curtainCall',
  'B4C6': 'slaughtershed',
};

const grandCountMap: { [id: string]: string } = {
  '436': 'front',
  '437': 'right',
  '438': 'rear',
  '439': 'left',
};

const dirAimStrings = {
  dirNE: Outputs.aimNE,
  dirSE: Outputs.aimSE,
  dirSW: Outputs.aimSW,
  dirNW: Outputs.aimNW,
  unknown: Outputs.unknown,
};

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM4Savage',
  zoneId: ZoneId.AacHeavyweightM4Savage,
  config: [
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
    replication1FollowUp: false,
    // prt
    mortalList: [],
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
      id: 'R12S Phase Two Replication Tracker',
      // B4D8 Replication happens more than once, only track the first one
      type: 'StartsUsing',
      netRegex: { id: 'B4D8', source: 'Lindwurm', capture: false },
      suppressSeconds: 9999,
      run: (data) => data.phase = 'replication1',
    },
    {
      id: 'R12S Phase Two Staging Tracker',
      // B4E1 Staging happens more than once, only track the first one
      type: 'StartsUsing',
      netRegex: { id: 'B4E1', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'replication1',
      suppressSeconds: 9999,
      run: (data) => data.phase = 'replication2',
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
      id: 'R12S Cursed Coil Bind Knocbkack',
      // Using Phagocyte Spotlight, 1st one happens 7s before bind
      // Delayed additionally to reduce overlap with alpha tower location calls
      type: 'Ability',
      netRegex: { id: 'B4B6', capture: false },
      delaySeconds: 3, // 5s warning
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.knockback!(),
      outputStrings: {
        knockback: {
          en: 'Knockback',
          ko: '강제로 한가운데',
        },
      },
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
          ko: '십자➕: ${dir}쪽으로',
        },
        typeIntercards: {
          en: 'Intercardinal: ${dir}',
          ko: '비스듬히✖️: ${dir}쪽으로',
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
          ko: '내게 썩은 살덩이',
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
          ko: '서쪽 안전한 곳에서 흩어져요',
        },
        getHitEast: {
          en: 'Spread in East Cleave',
          ko: '동쪽 안전한 곳에서 흩어져요',
        },
        safeEast: {
          en: 'Spread East',
          ko: '동쪽에서 흩어져요',
        },
        safeWest: {
          en: 'Spread West',
          ko: '서쪽에서 흩어져요',
        },
      },
    },
    {
      id: 'R12S Split Scourge and Venomous Scourge',
      // B4AB Split Scourge and B4A8 Venomous Scourge are instant casts
      // This actor control happens along with boss becoming targetable
      type: 'ActorControl',
      netRegex: { command: '8000000D', data0: '1E01', capture: false },
      durationSeconds: 9,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tank!();
        return output.party!();
      },
      outputStrings: {
        tank: {
          en: 'Bait Line AoE from heads',
          ko: '머리 빔 유도',
        },
        party: {
          en: 'Spread, Away from heads',
          ko: '흩어져요 (머리쪽은 안되요)',
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
      id: 'R12S Curtain Call: Unbreakable Flesh α/β Chains',
      // TODO: Find safe spots
      type: 'GainsEffect',
      netRegex: { effectId: ['1291', '1293'], capture: true },
      condition: (data, matches) => {
        if (matches.target === data.me && data.phase === 'curtainCall')
          return true;
        return false;
      },
      infoText: (_data, matches, output) => {
        const flesh = matches.effectId === '1291' ? 'alpha' : 'beta';
        if (flesh === 'alpha')
          return output.alphaChains!();
        if (flesh === 'beta')
          return output.betaChains!();
        return output.unknownChains!();
      },
      outputStrings: {
        alphaChains: {
          en: 'Break Chains => Avoid Blobs',
          ko: '줄 끊고 🔜 살덩이 피해요',
        },
        betaChains: {
          en: 'Break Chains => Avoid Blobs',
          ko: '줄 끊고 🔜 살덩이 피해요',
        },
        unknownChains: {
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
      durationSeconds: 5.1,
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R12S Slaughtershed Spread',
      // TODO: Get Safe spot
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['slaughterSpread'], capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 5.1,
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    {
      id: 'R12S Serpintine Scourge Right Hand First',
      // Left Hand first, then Right Hand
      type: 'Ability',
      netRegex: { id: 'B4CB', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'slaughtershed',
      durationSeconds: 12,
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
      durationSeconds: 12,
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
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Northwest: Knockback to Northeast',
          ko: '🡼북서로: 넉백 당하고 북동으로',
        },
      },
    },
    {
      id: 'R12S Raptor Knuckles Left Hand First',
      // Left Hand first, then Right Hand
      type: 'Ability',
      netRegex: { id: 'B4CE', source: 'Lindwurm', capture: false },
      condition: (data) => data.phase === 'slaughtershed',
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Northeast: Knockback to Northwest',
          ko: '🡽북동으로: 넉백 당하고 북서로',
        },
      },
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
          en: 'Fire Debuff: Spread near Dark Clone (later)',
          ko: '(불 디버프: 나중에 어둠 클론 부근에서 흩어져요)',
        },
        dark: {
          en: 'Dark Debuff: Stack near Fire Clone (later)',
          ko: '(어둠 디버프: 나중에 불 클론 부근에서 뭉쳐요)',
        },
      },
    },
    {
      id: 'R12S Fake Fire Resistance Down II',
      // Two players will not receive a debuff, they will need to act as if they had
      type: 'GainsEffect',
      netRegex: { effectId: ['CFB', 'B79'], capture: false },
      condition: (data) => !data.replication1FollowUp,
      delaySeconds: 0.3, // Delay for debuff/damage propagation
      suppressSeconds: 9999,
      infoText: (data, _matches, output) => {
        if (data.replication1Debuff === undefined)
          return output.noDebuff!();
      },
      outputStrings: {
        noDebuff: {
          en: 'No Debuff: Spread near Dark Clone (later)',
          ko: '(디버프 없음: 나중에 어둠 클론 부근에서 흩어져요)',
        },
      },
    },
    {
      id: 'R12S Snaking Kick',
      type: 'StartsUsing',
      netRegex: { id: 'B527', source: 'Lindwurm', capture: false },
      response: Responses.getBehind(),
      run: (data) => data.replication1FollowUp = true,
    },
    {
      id: 'R12S Replication 1 Follow-up Tracker',
      // Tracking from B527 Snaking Kick
      type: 'StartsUsing',
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

        if (data.replication1Debuff === 'dark')
          return output.fire!({
            dir1: output[fireIn]!(),
            dir2: output[fireOut]!(),
          });

        // Dark will be opposite pattern of Fire
        const darkIn = isIn ? dir2 : dir1;
        const darkOut = isIn ? dir1 : dir2;

        // Fire debuff players and unmarked bait Dark
        return output.dark!({
          dir1: output[darkIn]!(),
          dir2: output[darkOut]!(),
        });
      },
      outputStrings: {
        ...dirAimStrings, // Cardinals should result in '???'
        fire: {
          en: 'Bait Fire near In ${dir1}/Out ${dir2} (Partners)',
          ko: '불 유도: 안쪽 ${dir1}, 바깥쪽 ${dir2} (페어)',
        },
        dark: {
          en: 'Bait Dark near In ${dir1}/Out ${dir2} (Solo)',
          ko: '어둠 유도: 안쪽 ${dir1}, 바깥쪽 ${dir2} (홀로)',
        },
      },
    },
    {
      id: 'R12S Double Sobat',
      // Two half-room cleaves
      // First hit targets highest emnity target, second targets second highest
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['sharedTankbuster'], capture: true },
      response: Responses.sharedOrInvinTankBuster(),
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
          left: parseFloat(matches.x) < center.x,
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
            ko: '🡸왼쪽으로 들어가요',
          },
          right: {
            en: 'Go right side of front',
            ko: '🡺오른쪽으로 들어가요',
          },
          text: {
            en: '${left} / ${right}',
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
            ko: '🡸왼쪽으로 들어가요',
          },
          right: {
            en: 'Go right side of front',
            ko: '🡺오른쪽으로 들어가요',
          },
          text: {
            en: '${left} / ${right}',
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
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'replaceSync': {
        'Lindwurm': 'リンドブルム',
      },
    },
  ],
};

export default triggerSet;
