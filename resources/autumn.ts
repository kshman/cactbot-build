import { Job, Role } from '../types/job';
import { LocaleText, OutputStrings } from '../types/trigger';

import { Lang } from './languages';
import Outputs from './outputs';
import Util, { Directions } from './util';

// 어듬이 뱡향 표시
const posConv16 = (sx: string, sy: string, cx: number, cy: number): number => {
  const x = parseFloat(sx) - cx;
  const y = parseFloat(sy) - cy;
  return Math.round(8 - 8 * Math.atan2(x, y) / Math.PI) % 16;
};
const posConv8 = (sx: string, sy: string, cx: number, cy: number): number => {
  const x = parseFloat(sx) - cx;
  const y = parseFloat(sy) - cy;
  return Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
};
const posConv4 = (sx: string, sy: string, cx: number, cy: number): number => {
  const x = parseFloat(sx) - cx;
  const y = parseFloat(sy) - cy;
  return Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;
};

const hdgConv8 = (heading: string): number => {
  return (Math.round(4 - 4 * parseFloat(heading) / Math.PI) % 8 + 8) % 8;
};

const hdgConv4 = (heading: string): number => {
  return (Math.round(2 - parseFloat(heading) * 2 / Math.PI) % 4 + 4) % 4;
};

const outputNumber8: number[] = [0, 1, 2, 3, 4, 5, 6, 7];
const outputNumberCardinal: number[] = [0, 1, 2, 3];
const outputNumberIntercard: number[] = [0, 1, 2, 3];

export type MarkerOutput8 =
  | 'markerN'
  | 'markerNE'
  | 'markerE'
  | 'markerSE'
  | 'markerS'
  | 'markerSW'
  | 'markerW'
  | 'markerNW'
  | 'unknown';
export type MarkerOutputCardinal =
  | 'markerN'
  | 'markerE'
  | 'markerS'
  | 'markerW'
  | 'unknown';
export type MarkerOutputIntercard =
  | 'markerNE'
  | 'markerSE'
  | 'markerSW'
  | 'markerNW'
  | 'unknown';

const outputMarker8: MarkerOutput8[] = [
  'markerN',
  'markerNE',
  'markerE',
  'markerSE',
  'markerS',
  'markerSW',
  'markerW',
  'markerNW',
];
const outputMarkerCardinal: MarkerOutputCardinal[] = [
  'markerN',
  'markerE',
  'markerS',
  'markerW',
];
const outputMarkerIntercard: MarkerOutputIntercard[] = [
  'markerNE',
  'markerSE',
  'markerSW',
  'markerNW',
];
const outputStringsMarker8: OutputStrings = {
  markerN: Outputs.cmarkA,
  markerNE: Outputs.cnum1,
  markerE: Outputs.cmarkB,
  markerSE: Outputs.cnum2,
  markerS: Outputs.cmarkC,
  markerSW: Outputs.cnum3,
  markerW: Outputs.cmarkD,
  markerNW: Outputs.cnum4,
  unknown: Outputs.unknown,
};
const outputStringsMarkerCardinal: OutputStrings = {
  markerN: Outputs.cmarkA,
  markerE: Outputs.cmarkB,
  markerS: Outputs.cmarkC,
  markerW: Outputs.cmarkD,
  unknown: Outputs.unknown,
};
const outputStringsMarkerIntercard: OutputStrings = {
  markerNE: Outputs.cnum1,
  markerSE: Outputs.cnum2,
  markerSW: Outputs.cnum3,
  markerNW: Outputs.cnum4,
  unknown: Outputs.unknown,
};
const outputFromMarker8NumFunc = (dirNum: number): MarkerOutput8 => {
  return outputMarker8[dirNum] ?? 'unknown';
};

export type ArrowOutput8 =
  | 'arrowN'
  | 'arrowNE'
  | 'arrowE'
  | 'arrowSE'
  | 'arrowS'
  | 'arrowSW'
  | 'arrowW'
  | 'arrowNW'
  | 'unknown';
export type ArrowOutputCardinal =
  | 'arrowN'
  | 'arrowE'
  | 'arrowS'
  | 'arrowW'
  | 'unknown';
export type ArrowOutputIntercard =
  | 'arrowNE'
  | 'arrowSE'
  | 'arrowSW'
  | 'arrowNW'
  | 'unknown';
const outputArrow8: ArrowOutput8[] = [
  'arrowN',
  'arrowNE',
  'arrowE',
  'arrowSE',
  'arrowS',
  'arrowSW',
  'arrowW',
  'arrowNW',
];
const outputArrowCardinal: ArrowOutputCardinal[] = [
  'arrowN',
  'arrowE',
  'arrowS',
  'arrowW',
];
const outputArrowIntercard: ArrowOutputIntercard[] = [
  'arrowNE',
  'arrowSE',
  'arrowSW',
  'arrowNW',
];
const outputStringsArrow8: OutputStrings = {
  arrowN: Outputs.arrowN,
  arrowNE: Outputs.arrowNE,
  arrowE: Outputs.arrowE,
  arrowSE: Outputs.arrowSE,
  arrowS: Outputs.arrowS,
  arrowSW: Outputs.arrowSW,
  arrowW: Outputs.arrowW,
  arrowNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};
const outputStringsArrowCardinal: OutputStrings = {
  arrowN: Outputs.arrowN,
  arrowE: Outputs.arrowE,
  arrowS: Outputs.arrowS,
  arrowW: Outputs.arrowW,
  unknown: Outputs.unknown,
};
const outputStringsArrowIntercard: OutputStrings = {
  arrowNE: Outputs.arrowNE,
  arrowSE: Outputs.arrowSE,
  arrowSW: Outputs.arrowSW,
  arrowNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};
const outputStringsDirToArrow8: OutputStrings = {
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
const outputStringsDirToArrowCardinal: OutputStrings = {
  dirN: Outputs.arrowN,
  dirE: Outputs.arrowE,
  dirS: Outputs.arrowS,
  dirW: Outputs.arrowW,
  unknown: Outputs.unknown,
};
const outputStringsDirToArrowIntercard: OutputStrings = {
  dirNE: Outputs.arrowNE,
  dirSE: Outputs.arrowSE,
  dirSW: Outputs.arrowSW,
  dirNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};

const outputFromArrow8NumFunc = (dirNum: number): ArrowOutput8 => {
  return outputArrow8[dirNum] ?? 'unknown';
};

// 어듬이 뱡향 지시
export const AutumnDirections = {
  posConv16: posConv16,
  posConv8: posConv8,
  posConv4: posConv4,
  hdgConv8: hdgConv8,
  hdgConv4: hdgConv4,

  outputNumber8: outputNumber8,
  outputNumberCardinal: outputNumberCardinal,
  outputNumberIntercard: outputNumberIntercard,

  outputMarker8: outputMarker8,
  outputMarkerCardinal: outputMarkerCardinal,
  outputMarkerIntercard: outputMarkerIntercard,
  outputStringsMarker8: outputStringsMarker8,
  outputStringsMarkerCardinal: outputStringsMarkerCardinal,
  outputStringsMarkerIntercard: outputStringsMarkerIntercard,
  outputFromMarker8Num: outputFromMarker8NumFunc,
  xyToMarker8Output: (x: number, y: number, cx: number, cy: number): MarkerOutput8 => {
    const n = Directions.xyTo8DirNum(x, y, cx, cy);
    return outputFromMarker8NumFunc(n);
  },

  outputArrow8: outputArrow8,
  outputArrowCardinal: outputArrowCardinal,
  outputArrowIntercard: outputArrowIntercard,
  outputStringsArrow8: outputStringsArrow8,
  outputStringsArrowCardinal: outputStringsArrowCardinal,
  outputStringsArrowIntercard: outputStringsArrowIntercard,
  outputStringsDirToArrow8: outputStringsDirToArrow8,
  outputStringsDirToArrowCardinal: outputStringsDirToArrowCardinal,
  outputStringsDirToArrowIntercard: outputStringsDirToArrowIntercard,
  outputFromArrow8Num: outputFromArrow8NumFunc,
  xyToArrow8Output: (x: number, y: number, cx: number, cy: number): ArrowOutput8 => {
    const n = Directions.xyTo8DirNum(x, y, cx, cy);
    return outputFromArrow8NumFunc(n);
  },
};

// 파라미터
const getParam = (param: string): string[] => param.split(',');

// 직업 인덱스를 우선 순위로
const jobIndexToPriority: Record<number, number> = {
  0: 0, // 모험가
  1: 104, // 검술사
  2: 302, // 격투사
  3: 102, // 도끼맨
  4: 304, // 랜서
  5: 402, // 활쟁이
  6: 201, // 환술사
  7: 501, // 주술사
  8: 9101, // 목수
  9: 9102, // 대장장이
  10: 9103, // 갑옷장인
  11: 9104, // 보석장인
  12: 9105, // 가죽장인
  13: 9106, // 재봉사
  14: 9107, // 연금술사
  15: 9108, // 요리사
  16: 9201, // 광부
  17: 9202, // 농부
  18: 9203, // 어부
  19: 104, // 팔라딘
  20: 302, // 몽크
  21: 102, // 전사
  22: 304, // 류상
  23: 402, // 바드
  24: 201, // 뱅마
  25: 501, // 흥마
  26: 503, // 비술사
  27: 503, // 서모너
  28: 204, // 스콜라
  29: 305, // 로그
  30: 305, // 닌자
  31: 401, // 기공사
  32: 101, // 다크나이트
  33: 202, // 점쟁이
  34: 301, // 사무라이
  35: 502, // 레드메
  36: 599, // 블루메
  37: 103, // 총칼이
  38: 403, // 춤꾼
  39: 303, // 리퍼
  40: 203, // 현자
  41: 306, // 바이퍼
  42: 504, // 붓쟁이
} as const;

// 직업 순위를 이름으로
const jobPriorityToName: Record<number, LocaleText> = {
  /* 초기화가 안된대서 못쓴다
  0: LocalizedJobAbbr.NONE,
  101: LocalizedJobAbbr.DRK,
  102: LocalizedJobAbbr.WAR,
  103: LocalizedJobAbbr.GNB,
  104: LocalizedJobAbbr.PLD,
  201: LocalizedJobAbbr.WHM,
  202: LocalizedJobAbbr.AST,
  203: LocalizedJobAbbr.SGE,
  204: LocalizedJobAbbr.SCH,
  301: LocalizedJobAbbr.SAM,
  302: LocalizedJobAbbr.MNK,
  303: LocalizedJobAbbr.RPR,
  304: LocalizedJobAbbr.DRG,
  305: LocalizedJobAbbr.NIN,
  401: LocalizedJobAbbr.MCH,
  402: LocalizedJobAbbr.BRD,
  403: LocalizedJobAbbr.DNC,
  501: LocalizedJobAbbr.BLM,
  502: LocalizedJobAbbr.RDM,
  503: LocalizedJobAbbr.SMN,
  599: LocalizedJobAbbr.BLU,
  8102: LocalizedJobAbbr.MRD,
  8104: LocalizedJobAbbr.GLA,
  8201: LocalizedJobAbbr.CNJ,
  8302: LocalizedJobAbbr.PGL,
  8304: LocalizedJobAbbr.LNC,
  8305: LocalizedJobAbbr.ROG,
  8402: LocalizedJobAbbr.ARC,
  8501: LocalizedJobAbbr.THM,
  8503: LocalizedJobAbbr.ACN,
  9101: LocalizedJobAbbr.CRP,
  9102: LocalizedJobAbbr.BSM,
  9103: LocalizedJobAbbr.ARM,
  9104: LocalizedJobAbbr.GSM,
  9105: LocalizedJobAbbr.LTW,
  9106: LocalizedJobAbbr.WVR,
  9107: LocalizedJobAbbr.ALC,
  9108: LocalizedJobAbbr.CUL,
  9201: LocalizedJobAbbr.MIN,
  9202: LocalizedJobAbbr.BTN,
  9203: LocalizedJobAbbr.FSH, */
  0: {
    en: 'ADV',
    ja: '冒険者',
    ko: '모험가',
  },
  101: {
    en: 'DRK',
    ja: '暗黒騎士',
    ko: '암흑',
  },
  102: {
    en: 'WAR',
    ja: '戦士',
    ko: '전사',
  },
  103: {
    en: 'GNB',
    ja: 'ガンブレ',
    ko: '총칼',
  },
  104: {
    en: 'PLD',
    ja: 'ナイト',
    ko: '팔라',
  },
  201: {
    en: 'WHM',
    ja: '白魔道士',
    ko: '뱅마',
  },
  202: {
    en: 'AST',
    ja: '占星術師',
    ko: '점쟁이',
  },
  203: {
    en: 'SGE',
    ja: '賢者',
    ko: '현자',
  },
  204: {
    en: 'SCH',
    ja: '学者',
    ko: '학자',
  },
  301: {
    en: 'SAM',
    ja: '侍',
    ko: '사무',
  },
  302: {
    en: 'MNK',
    ja: 'モンク',
    ko: '몽크',
  },
  303: {
    en: 'RPR',
    ja: 'リーパー ',
    ko: '리퍼',
  },
  304: {
    en: 'DRG',
    ja: '竜騎士',
    ko: '류상',
  },
  305: {
    en: 'NIN',
    ja: '忍者',
    ko: '닌자',
  },
  306: {
    en: 'VPR',
    ja: 'ヴァイパー',
    ko: '바이퍼',
  },
  401: {
    en: 'MCH',
    ja: '機工士',
    ko: '기공',
  },
  402: {
    en: 'BRD',
    ja: '吟遊詩人',
    ko: '바드',
  },
  403: {
    en: 'DNC',
    ja: '踊り子',
    ko: '춤꾼',
  },
  501: {
    en: 'BLM',
    ja: '黒魔道士',
    ko: '흥마',
  },
  502: {
    en: 'RDM',
    ja: '赤魔道士',
    ko: '레드메',
  },
  503: {
    en: 'SMN',
    ja: '召喚士',
    ko: '서모너',
  },
  504: {
    en: 'PCT',
    ja: 'ピクトマンサー',
    ko: '붓쟁이',
  },
  599: {
    en: 'BLU',
    ja: '青魔道士',
    ko: '블루메',
  },
  8102: {
    en: 'MRD',
    ja: '斧術士',
    ko: '도끼맨',
  },
  8104: {
    en: 'GLA',
    ja: '剣術士',
    ko: '검술',
  },
  8201: {
    en: 'CNH',
    ja: '幻術士',
    ko: '환술',
  },
  8302: {
    en: 'PGL',
    ja: '格闘士',
    ko: '격투',
  },
  8304: {
    en: 'LNC',
    ja: '槍術士',
    ko: '랜서',
  },
  8305: {
    en: 'ROG',
    ja: '双剣士',
    ko: '쌍검',
  },
  8402: {
    en: 'ARC',
    ja: '弓術士',
    ko: '활쟁이',
  },
  8501: {
    en: 'THM',
    ja: '呪術士',
    ko: '주술',
  },
  8503: {
    en: 'ACN',
    ja: '巴術士',
    ko: '비술',
  },
  9101: {
    en: 'CRP',
    ja: '木工師',
    ko: '목수',
  },
  9102: {
    en: 'BSM',
    ja: '鍛冶師',
    ko: '대장',
  },
  9103: {
    en: 'ARM',
    ja: '甲冑師',
    ko: '갑주',
  },
  9104: {
    en: 'GSM',
    ja: '彫金師',
    ko: '보석',
  },
  9105: {
    en: 'LTW',
    ja: '革細工師',
    ko: '가죽',
  },
  9106: {
    en: 'WVR',
    ja: '裁縫師',
    ko: '재봉',
  },
  9107: {
    en: 'ALC',
    ja: '錬金術師',
    ko: '연금',
  },
  9108: {
    en: 'CUL',
    ja: '調理師',
    ko: '요리',
  },
  9201: {
    en: 'MIN',
    ja: '採掘師',
    ko: '광부',
  },
  9202: {
    en: 'BTN',
    ja: '園芸師',
    ko: '농부',
  },
  9203: {
    en: 'FSH',
    ja: '漁師',
    ko: '어부',
  },
};

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

// 어듬이 유틸
const Autumn = {
  jobPriority: (jobindex: number): number => jobIndexToPriority[jobindex] ?? 9999,
  jobPriorityName: (jobindex: number, lang: Lang) => jobPriorityToName[jobindex]?.[lang] ?? '???',
  jobPriorityList: (jobindices: readonly number[], lang: Lang): string[] => {
    const priors = jobindices.map((x) => jobIndexToPriority[x] ?? 9999).sort((a, b) => a - b);
    const jobs = priors.map((x) => jobPriorityToName[x]?.[lang] ?? '???');
    return jobs;
  },

  isMoksName: (moksName: string) => moksNames.includes(moksName),
  isTank: (moksName: string) => moksTanks.includes(moksName),
  isHealer: (moksName: string) => moksHealers.includes(moksName),
  isSupport: (moksName: string) => moksTanksAndHealers.includes(moksName),
  isDps: (moksName: string) => moksDps.includes(moksName),
  isMelee: (moksName: string) => moksMelees.includes(moksName),
  isRange: (moksName: string) => moksRanges.includes(moksName),
  inMainTeam: (moksName: string) => teamMtMoks.includes(moksName),
  inSubTeam: (moksName: string) => teamStMoks.includes(moksName),

  getParams: getParam,
  hasParam: (find: string, param?: string): boolean => {
    if (param === undefined)
      return false;
    const ss = getParam(param);
    return ss.includes(find);
  },

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
    if (Util.isPureHealerJob(job))
      return 'H1'; // 퓨어 힐러는 H1
    if (Util.isBarrierHealerJob(job))
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
