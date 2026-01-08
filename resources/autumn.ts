import { RaidbossData } from '../types/data';
import { Job, Role } from '../types/job';
import { OutputStrings } from '../types/trigger';

import Outputs from './outputs';
import Util, {
  DirectionOutput8,
  DirectionOutputCardinal,
  DirectionOutputIntercard,
  Directions,
} from './util';

// 어듬이 조건
export const AutumnCond = {
  onlyAutumn(): (data: RaidbossData) => boolean {
    return (data: RaidbossData) => data.options.AutumnOnly;
  },
  notOnlyAutumn(): (data: RaidbossData) => boolean {
    return (data: RaidbossData) => !data.options.AutumnOnly;
  },
  testParam(param: string): (data: RaidbossData) => boolean {
    return (data: RaidbossData) => testParam(param, data.options.AutumnParam);
  },
};

// 어듬이 뱡향 표시
const checkOpDir8 = (dir: number, test: boolean): number => {
  return test ? (dir + 4) % 8 : dir;
};
const checkOpDir4 = (dir: number, test: boolean): number => {
  return test ? (dir + 2) % 4 : dir;
};

const posConv8 = (sx: string, sy: string, cx: number, cy: number, cop = false): number => {
  const x = parseFloat(sx) - cx;
  const y = parseFloat(sy) - cy;
  const n = Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
  return checkOpDir8(n, cop);
};
const posConv4 = (sx: string, sy: string, cx: number, cy: number, cop = false): number => {
  const x = parseFloat(sx) - cx;
  const y = parseFloat(sy) - cy;
  const n = Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;
  return checkOpDir4(n, cop);
};

const hdgConv8 = (heading: string, cop = false): number => {
  const n = (Math.round(4 - 4 * parseFloat(heading) / Math.PI) % 8 + 8) % 8;
  return checkOpDir8(n, cop);
};
const hdgConv4 = (heading: string, cop = false): number => {
  const n = (Math.round(2 - parseFloat(heading) * 2 / Math.PI) % 4 + 4) % 4;
  return checkOpDir4(n, cop);
};

const hdgNum8 = (heading: number, cop = false): number => {
  const n = (Math.round(4 - 4 * heading / Math.PI) % 8 + 8) % 8;
  return checkOpDir8(n, cop);
};
const hdgNum4 = (heading: number, cop = false): number => {
  const n = (Math.round(2 - heading * 2 / Math.PI) % 4 + 4) % 4;
  return checkOpDir4(n, cop);
};

const xyToNum8 = (x: number, y: number, centerX: number, centerY: number): number => {
  x = x - centerX;
  y = y - centerY;
  return Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
};
const xyToNum4 = (x: number, y: number, centerX: number, centerY: number): number => {
  x = x - centerX;
  y = y - centerY;
  return Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;
};

const xyToDir = (x: number, y: number, cx: number, cy: number): DirectionOutput8 => {
  const n = xyToNum8(x, y, cx, cy);
  return Directions.output8Dir[n] ?? 'unknown';
};
const dirFromNum = (num: number): DirectionOutput8 => {
  return Directions.output8Dir[num] ?? 'unknown';
};

// 방향 지정
const outputNum: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
const outputNumPlus: number[] = [0, 1, 2, 3];
const outputNumCross: number[] = [0, 1, 2, 3];

const outputDir: DirectionOutput8[] = [
  'dirN',
  'dirNE',
  'dirE',
  'dirSE',
  'dirS',
  'dirSW',
  'dirW',
  'dirNW',
];
const outputDirPlus: DirectionOutputCardinal[] = [
  'dirN',
  'dirE',
  'dirS',
  'dirW',
];
const outputDirCross: DirectionOutputIntercard[] = [
  'dirNE',
  'dirSE',
  'dirSW',
  'dirNW',
];

// 화살표
const stringsArrow: OutputStrings = {
  dirN: Outputs.arrowN,
  dirNE: Outputs.arrowNE,
  dirE: Outputs.arrowE,
  dirSE: Outputs.arrowSE,
  dirS: Outputs.arrowS,
  dirSW: Outputs.arrowSW,
  dirW: Outputs.arrowW,
  dirNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};
const stringsArrowPlus: OutputStrings = {
  dirN: Outputs.arrowN,
  dirE: Outputs.arrowE,
  dirS: Outputs.arrowS,
  dirW: Outputs.arrowW,
  unknown: Outputs.unknown,
};
const stringsArrowCross: OutputStrings = {
  dirNE: Outputs.arrowNE,
  dirSE: Outputs.arrowSE,
  dirSW: Outputs.arrowSW,
  dirNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};

// 과녁 (화살표 + 방향)
const stringsAim: OutputStrings = {
  dirN: Outputs.aimN,
  dirNE: Outputs.aimNE,
  dirE: Outputs.aimE,
  dirSE: Outputs.aimSE,
  dirS: Outputs.aimS,
  dirSW: Outputs.aimSW,
  dirW: Outputs.aimW,
  dirNW: Outputs.aimNW,
  unknown: Outputs.unknown,
};
const stringsAimPlus: OutputStrings = {
  dirN: Outputs.aimN,
  dirE: Outputs.aimE,
  dirS: Outputs.aimS,
  dirW: Outputs.aimW,
  unknown: Outputs.unknown,
};
const stringsAimCross: OutputStrings = {
  dirNE: Outputs.aimNE,
  dirSE: Outputs.aimSE,
  dirSW: Outputs.aimSW,
  dirNW: Outputs.aimNW,
  unknown: Outputs.unknown,
};

// 방향지시
const stringsDir: OutputStrings = {
  dirN: Outputs.dirN,
  dirNE: Outputs.dirNE,
  dirE: Outputs.dirE,
  dirSE: Outputs.dirSE,
  dirS: Outputs.dirS,
  dirSW: Outputs.dirSW,
  dirW: Outputs.dirW,
  dirNW: Outputs.dirNW,
  unknown: Outputs.unknown,
};
const stringsDirPlus: OutputStrings = {
  dirN: Outputs.dirN,
  dirE: Outputs.dirE,
  dirS: Outputs.dirS,
  dirW: Outputs.dirW,
  unknown: Outputs.unknown,
};
const stringsDirCross: OutputStrings = {
  dirNE: Outputs.dirNE,
  dirSE: Outputs.dirSE,
  dirSW: Outputs.dirSW,
  dirNW: Outputs.dirNW,
  unknown: Outputs.unknown,
};

// 어듬이 뱡향 지시
export const AutumnDir = {
  posConv8: posConv8,
  posConv4: posConv4,
  hdgConv8: hdgConv8,
  hdgConv4: hdgConv4,
  hdgNum8: hdgNum8,
  hdgNum4: hdgNum4,
  xyToNum8: xyToNum8,
  xyToNum4: xyToNum4,
  xyToDir: xyToDir,
  dirFromNum: dirFromNum,

  outputNum: outputNum,
  outputNumPlus: outputNumPlus,
  outputNumCross: outputNumCross,

  outputDir: outputDir,
  outputDirPlus: outputDirPlus,
  outputDirCross: outputDirCross,

  stringsArrow: stringsArrow,
  stringsArrowPlus: stringsArrowPlus,
  stringsArrowCross: stringsArrowCross,

  stringsAim: stringsAim,
  stringsAimPlus: stringsAimPlus,
  stringsAimCross: stringsAimCross,

  stringsDir: stringsDir,
  stringsDirPlus: stringsDirPlus,
  stringsDirCross: stringsDirCross,
};

// 파라미터
const getParam = (param: string): string[] => param.split(',');
const testParam = (find: string, param?: string): boolean => {
  if (param === undefined)
    return false;
  const ss = getParam(param);
  return ss.includes(find);
};

// 잡 도움
const healerPureJobs: Job[] = ['CNJ', 'WHM', 'AST'];
const healerBarrierJobs: Job[] = ['SCH', 'SGE'];

// 몫 이름
const moksTanks: readonly string[] = ['MT', 'ST'] as const;
const moksHealers: readonly string[] = ['H1', 'H2'] as const;
const moksMelees: readonly string[] = ['D1', 'D2'];
const moksRanges: readonly string[] = ['D3', 'D4'];
const moksDps: readonly string[] = [...moksMelees, ...moksRanges] as const;
const moksTanksAndHealers: readonly string[] = [...moksTanks, ...moksHealers] as const;
const moksNames: readonly string[] = [...moksTanks, ...moksHealers, ...moksDps] as const;
const teamMtMoks: readonly string[] = ['MT', 'H1', 'D1', 'D3'];
const teamStMoks: readonly string[] = ['ST', 'H2', 'D2', 'D4'];

// 몫 타입
export type AutumnMoks = 'MT' | 'ST' | 'H1' | 'H2' | 'D1' | 'D2' | 'D3' | 'D4' | 'none';
export type AutumnTeams = 'MT' | 'ST';

// 어듬이 유틸
const Autumn = {
  isPureHealerJob: (job: Job) => healerPureJobs.includes(job),
  isBarrierHealerJob: (job: Job) => healerBarrierJobs.includes(job),

  isMoksName: (moksName: string) => moksNames.includes(moksName),
  isTank: (moksName: string) => moksTanks.includes(moksName),
  isHealer: (moksName: string) => moksHealers.includes(moksName),
  isSupport: (moksName: string) => moksTanksAndHealers.includes(moksName),
  isDps: (moksName: string) => moksDps.includes(moksName),
  isMelee: (moksName: string) => moksMelees.includes(moksName),
  isRange: (moksName: string) => moksRanges.includes(moksName),
  inMainTeam: (moksName: string) => teamMtMoks.includes(moksName),
  inSubTeam: (moksName: string) => teamStMoks.includes(moksName),
  getTeam: (moks: AutumnMoks): AutumnTeams => teamMtMoks.includes(moks) ? 'MT' : 'ST',

  getParams: getParam,
  testParam: testParam,

  parseMoks: (job: Job, param?: string): AutumnMoks => {
    // BLU는 어디까지나 인수로만
    if (param !== undefined) {
      // 몫은 인수 0번 고정
      const ss = getParam(param);
      if (ss.length > 0 && ss[0] !== undefined && moksNames.includes(ss[0]))
        return ss[0] as AutumnMoks;
    }
    if (Util.isTankJob(job))
      return 'MT'; // 기본 탱크는 MT, ST는 지정 전용
    if (Autumn.isPureHealerJob(job))
      return 'H1'; // 퓨어 힐러는 H1
    if (Autumn.isBarrierHealerJob(job))
      return 'H2'; // 바리어 힐러는 H2
    if (Util.isMeleeDpsJob(job))
      return 'D1'; // 밀리는 D1, D2는 지정 전용
    if (Util.isRangedDpsJob(job))
      return 'D3'; // 렌지는 D3
    if (Util.isCasterDpsJob(job))
      return 'D4'; // 캐슷은 D4
    return 'none';
  },
  moksToRole: (moks: AutumnMoks): Role => {
    if (moksTanks.includes(moks))
      return 'tank';
    if (moksHealers.includes(moks))
      return 'healer';
    if (moksDps.includes(moks))
      return 'dps';
    return 'none';
  },
} as const;

export default Autumn;
