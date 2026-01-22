import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Phase = 'doorboss' | 'curtainCall' | 'slaughtershed' | 'two';

export interface Data extends RaidbossData {
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
  // prt
  mortals: string[];
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
} as const;

const center = {
  x: 100,
  y: 100,
} as const;

const phaseMap: { [id: string]: Phase } = {
  'BEC0': 'curtainCall',
  'B4C6': 'slaughtershed',
};

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM4Savage',
  zoneId: ZoneId.AacHeavyweightM4Savage,
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
    // prt
    mortals: [],
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
        data.mortals = [];
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

        const player = data.party.member(target);
        const isDPS = data.party.isDPS(target);
        if (isDPS && data.role === 'dps') {
          if (cleave === undefined)
            return output.baitThenStack!({
              stack: output.stackOnPlayer!({ player: player }),
            });
          return output.baitThenStackCleave!({
            stack: output.stackOnPlayer!({ player: player }),
            cleave: output[cleave]!(),
          });
        }
        if (!isDPS && data.role !== 'dps') {
          if (cleave === undefined)
            return output.baitThenStack!({
              stack: output.stackOnPlayer!({ player: player }),
            });
          return output.baitThenStackCleave!({
            stack: output.stackOnPlayer!({ player: player }),
            cleave: output[cleave]!(),
          });
        }
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOnPlayer: Outputs.stackOnPlayer,
        frontCleave: {
          en: 'Front Cleave',
          ja: '前方',
          ko: '앞쪽',
        },
        rearCleave: {
          en: 'Rear Cleave',
          ja: '後方',
          ko: '뒷쪽',
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
          ja: 'AOE誘導 x4 🔜 ${stack} (+${cleave})',
          ko: '장판 x4 🔜 ${stack} (+${cleave})',
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
          ko: '앞쪽',
        },
        rearCleave: {
          en: 'Rear Cleave',
          ja: '後方',
          ko: '뒷쪽',
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
          ja: 'AOE誘導 x4 🔜 散開 (+${cleave})',
          ko: '장판 x4 🔜 흩어져요 (+${cleave})',
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
      infoText: (_data, matches, output) => {
        if (matches.id === 'B49A')
          return output.goWest!();
        return output.goEast!();
      },
      outputStrings: {
        goEast: Outputs.east,
        goWest: Outputs.west,
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
          ko: '1α: 줄 대기 #1',
        },
        alpha2: {
          en: '2α: Wait for Tether 2',
          ko: '2α: 줄 대기 #2',
        },
        alpha3: {
          en: '3α: Blob Tower 1',
          ko: '3α: 살덩이 타워 #1',
        },
        alpha4: {
          en: '4α: Blob Tower 2',
          ko: '4α: 살덩이 타워 #2',
        },
        beta1: {
          en: '1β: Wait for Tether 1',
          ko: '1β: 줄 대기 #1',
        },
        beta2: {
          en: '2β: Wait for Tether 2',
          ko: '2β: 줄 대기 #2',
        },
        beta3: {
          en: '3β: Chain Tower 1',
          ko: '3β: 연쇄 타워 #1',
        },
        beta4: {
          en: '4β: Chain Tower 2',
          ko: '4β: 연쇄 타워 #2',
        },
        order: {
          en: '${num}',
          ja: '${num}',
          ko: '${num}',
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
        ...Directions.outputStringsIntercardDir,
        innerBlobTower: {
          en: 'Blob Tower ${num} Inner ${dir} (later)',
          ko: '(나중에, 살덩이 타워 #${num} ${dir}안쪽)',
        },
        outerBlobTower: {
          en: 'Blob Tower ${num} Outer ${dir} (later)',
          ko: '(나중에, 살덩이 타워 #${num} ${dir}바깥)',
        },
      },
    },
    {
      id: 'R12S Cursed Coil Bind Knocbkack',
      // Using Phagocyte Spotlight, 1st one happens 7s before bind
      // Delayed additionally to reduce overlap with alpha tower location calls
      type: 'Ability',
      netRegex: { id: 'B4B6', capture: false },
      delaySeconds: 3, // 5s warning
      suppressSeconds: 10,
      response: Responses.knockback(),
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
      id: 'R12S Cell Chain Tether Number',
      // Helpful for players to keep track of which chain tower is next
      // Does not output when it is their turn to break the tether
      type: 'Tether',
      netRegex: { id: headMarkerData['cellChainTether'], capture: false },
      condition: (data) => {
        if (data.phase === 'doorboss' && data.myFleshBonds === 'beta')
          return true;
        return false;
      },
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        const num = data.cellChainCount;
        if (myNum !== num) {
          if (myNum === 1 && num === 3)
            return output.beta1Tower!({
              tether: output.tether!({ num: num }),
            });
          if (myNum === 2 && num === 4)
            return output.beta2Tower!({
              tether: output.tether!({ num: num }),
            });
          if (myNum === 3 && num === 1)
            return output.beta3Tower!({
              tether: output.tether!({ num: num }),
            });
          if (myNum === 4 && num === 2)
            return output.beta4Tower!({
              tether: output.tether!({ num: num }),
            });

          return output.tether!({ num: num });
        }

        if (myNum === undefined)
          return output.tether!({ num: num });
      },
      outputStrings: {
        tether: {
          en: 'Tether ${num}',
          ja: '線 ${num}',
          ko: '줄 #${num}',
        },
        beta1Tower: {
          en: '${tether} => Chain Tower 3',
          ko: '${tether} 🔜 연쇄 타워 #3',
        },
        beta2Tower: {
          en: '${tether} => Chain Tower 4',
          ko: '${tether} 🔜 연쇄 타워 #4',
        },
        beta3Tower: {
          en: '${tether} => Chain Tower 1',
          ko: '${tether} 🔜 연쇄 타워 #1',
        },
        beta4Tower: {
          en: '${tether} => Chain Tower 2',
          ko: '${tether} 🔜 연쇄 타워 #2',
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
          ko: '연쇄 타워 #${num} 밟아요',
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
        ...Directions.outputStringsIntercardDir,
        alpha3: {
          en: 'Get Blob Tower 1',
          ko: '살덩이 타워 #1 밟아요',
        },
        alpha4: {
          en: 'Get Blob Tower 2',
          ko: '살덩이 타워 #2 밟아요',
        },
        alpha3Dir: {
          en: 'Get Blob Tower 1 (Inner ${dir})',
          ko: '살덩이 타워 #1 밟아요 (${dir}안쪽)',
        },
        alpha4Dir: {
          en: 'Get Blob Tower 2 (Inner ${dir})',
          ko: '살덩이 타워 #2 밟아요 (${dir}안쪽)',
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
              return output.alpha1Dir!({
                chains: output.breakChains!(),
                dir: output[dir]!(),
              });
          }
          if (myNum === 2) {
            const dir = data.blobTowerDirs[3];
            if (dir !== undefined)
              return output.alpha2Dir!({
                chains: output.breakChains!(),
                dir: output[dir]!(),
              });
          }

          // dir undefined or 3rd/4rth in line
          switch (myNum) {
            case 1:
              return output.alpha1!({ chains: output.breakChains!() });
            case 2:
              return output.alpha2!({ chains: output.breakChains!() });
            case 3:
              return output.alpha3!({ chains: output.breakChains!() });
            case 4:
              return output.alpha4!({ chains: output.breakChains!() });
          }
        }
        switch (myNum) {
          case 1:
            return output.beta1!({ chains: output.breakChains!() });
          case 2:
            return output.beta2!({ chains: output.breakChains!() });
          case 3:
            return output.beta3!({ chains: output.breakChains!() });
          case 4:
            return output.beta4!({ chains: output.breakChains!() });
        }
        return output.getTowers!();
      },
      outputStrings: {
        ...Directions.outputStringsIntercardDir,
        breakChains: Outputs.breakChains,
        getTowers: Outputs.getTowers,
        alpha1: {
          en: '${chains} 1 + Blob Tower 3 (Outer)',
          ko: '${chains} #1 + 살덩이 타워 #3 (바깥)',
        },
        alpha1Dir: {
          en: '${chains} 1 + Blob Tower 3 (Outer ${dir})',
          ko: '${chains} #1 + 살덩이 타워 #3 (${dir}바깥)',
        },
        alpha2: {
          en: '${chains} 2 + Blob Tower 4 (Outer)',
          ko: '${chains} #2 + 살덩이 타워 #4 (바깥)',
        },
        alpha2Dir: {
          en: '${chains} 2 + Blob Tower 4 (Outer ${dir})',
          ko: '${chains} #2 + 살덩이 타워 #4 (${dir}바깥)',
        },
        alpha3: {
          en: '${chains} 3 + Get Out',
          ko: '${chains} #3 + 바깥으로',
        },
        alpha4: {
          en: '${chains} 4 + Get Out',
          ko: '${chains} #4 + 바깥으로',
        },
        beta1: {
          en: '${chains} 1 => Get Middle',
          ko: '${chains} #1 🔜 가운데로',
        },
        beta2: {
          en: '${chains} 2 => Get Middle',
          ko: '${chains} #2 🔜 가운데로',
        },
        beta3: {
          en: '${chains} 3 => Wait for last pair',
          ko: '${chains} #3 🔜 마지막 페어 기다려요',
        },
        beta4: {
          en: '${chains} 4 => Get Out',
          ko: '${chains} #4 🔜 바깥으로',
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
          ko: '바깥으로',
        },
        goIntoMiddle: Outputs.goIntoMiddle,
        beta1Middle: Outputs.goIntoMiddle,
        beta2Middle: Outputs.goIntoMiddle, // Should not happen under ideal situation
        beta3Middle: Outputs.goIntoMiddle,
        beta4Middle: Outputs.goIntoMiddle,
        beta1Out: { // Should not happen under ideal situation
          en: 'Get Out',
          ja: '外へ',
          ko: '바깥으로',
        },
        beta2Out: {
          en: 'Get Out',
          ja: '外へ',
          ko: '바깥으로',
        },
        beta3Out: { // Should not happen under ideal situation
          en: 'Get Out',
          ja: '外へ',
          ko: '바깥으로',
        },
        beta4Out: { // Should not happen under ideal situation
          en: 'Get Out',
          ja: '外へ',
          ko: '바깥으로',
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
          ko: '타워 (🡻남/🡿남서)',
        },
        rearTower: {
          en: 'Tower (N/NE)',
          ko: '타워 (🡹북/🡽북동)',
        },
        leftTower: {
          en: 'Tower (E/SE)',
          ko: '타워 (🡺동/🡾남동)',
        },
        rightTower: {
          en: 'Tower (W/NW)',
          ko: '타워 (🡸서/🡼북서)',
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
        if (matches.id === 'B4A1') {
          switch (count) {
            case '436':
              return output.frontCardinals!();
            case '437':
              return output.rightCardinals!();
            case '438':
              return output.rearCardinals!();
            case '439':
              return output.leftCardinals!();
          }
        }
        switch (count) {
          case '436':
            return output.frontIntercards!();
          case '437':
            return output.rightIntercards!();
          case '438':
            return output.rearIntercards!();
          case '439':
            return output.leftIntercards!();
        }
      },
      outputStrings: {
        frontIntercards: Outputs.southwest,
        rearIntercards: Outputs.northeast,
        leftIntercards: Outputs.southeast,
        rightIntercards: Outputs.northwest,
        frontCardinals: Outputs.south,
        rearCardinals: Outputs.north,
        leftCardinals: Outputs.east,
        rightCardinals: Outputs.west,
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
          ko: '서쪽 공간에서 흩어져요',
        },
        getHitEast: {
          en: 'Spread in East Cleave',
          ko: '동쪽 공간에서 흩어져요',
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
          ko: '흩어져요 (머리와 먼 곳으로)',
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
          return output.alphaChains!({
            chains: output.breakChains!(),
            safe: output.safeSpots!(),
          });
        if (flesh === 'beta')
          return output.betaChains!({
            chains: output.breakChains!(),
            safe: output.breakChains!(),
          });
        return output.unknownChains!({
          chains: output.breakChains!(),
          safe: output.breakChains!(),
        });
      },
      outputStrings: {
        breakChains: Outputs.breakChains,
        safeSpots: {
          en: 'Avoid Blobs',
          ko: '살덩이 피해요',
        },
        alphaChains: {
          en: '${chains} => ${safe}',
          ko: '${chains} 🔜 ${safe}',
        },
        betaChains: {
          en: '${chains} => ${safe}',
          ko: '${chains} 🔜 ${safe}',
        },
        unknownChains: {
          en: '${chains} => ${safe}',
          ko: '${chains} 🔜 ${safe}',
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
          ko: '🡼북서로: 넉백 받아 북동으로',
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
          ko: '🡽북동으로: 넉백 받아 북서로',
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
      id: 'R12S Snaking Kick',
      type: 'StartsUsing',
      netRegex: { id: 'B527', source: 'Lindwurm', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'R12S Double Sobat',
      type: 'StartsUsing',
      netRegex: { id: 'B520', source: 'Lindwurm', capture: true },
      response: Responses.tankCleave(),
    },
    // ////////////////////////////////
    {
      id: 'R12S Mortal Slayer',
      type: 'AddedCombatant',
      // 19200 보라 탱크용
      // 19201 초록 힐딜용
      netRegex: { name: 'Lindwurm', npcNameId: ['19200', '19201'], capture: true },
      run: (data, matches) => {
        // 일단 저장만
        data.mortals.push(matches.npcNameId);
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
