import { LocaleText, OutputStrings } from '../types/trigger';

import { Lang } from './languages';
import Outputs from './outputs';
import { Directions } from './util';

// 어듬이 뱡향 표시
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
const outputStringsMarker8: { [outputString: string]: OutputStrings } = {
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
const outputStringsMarkerCardinal: { [outputString: string]: OutputStrings } = {
  markerN: Outputs.cmarkA,
  markerE: Outputs.cmarkB,
  markerS: Outputs.cmarkC,
  markerW: Outputs.cmarkD,
  unknown: Outputs.unknown,
};
const outputStringsMarkerIntercard: { [outputString: string]: OutputStrings } = {
  markerNE: Outputs.cnum1,
  markerSE: Outputs.cnum2,
  markerSW: Outputs.cnum3,
  markerNW: Outputs.cnum4,
  unknown: Outputs.unknown,
};
const outputFromMarker8Num = (dirNum: number): MarkerOutput8 => {
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
const outputStringsArrow8: { [outputString: string]: OutputStrings } = {
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
const outputStringsArrowCardinal: { [outputString: string]: OutputStrings } = {
  arrowN: Outputs.arrowN,
  arrowE: Outputs.arrowE,
  arrowS: Outputs.arrowS,
  arrowW: Outputs.arrowW,
  unknown: Outputs.unknown,
};
const outputStringsArrowIntercard: { [outputString: string]: OutputStrings } = {
  arrowNE: Outputs.arrowNE,
  arrowSE: Outputs.arrowSE,
  arrowSW: Outputs.arrowSW,
  arrowNW: Outputs.arrowNW,
  unknown: Outputs.unknown,
};

const outputFromArrow8Num = (dirNum: number): ArrowOutput8 => {
  return outputArrow8[dirNum] ?? 'unknown';
};

// 어듬이 뱡향 지시
export const AutumnIndicators = {
  outputMarker8: outputMarker8,
  outputMarkerCardinal: outputMarkerCardinal,
  outputMarkerIntercard: outputMarkerIntercard,
  outputStringsMarker8: outputStringsMarker8,
  outputStringsMarkerCardinal: outputStringsMarkerCardinal,
  outputStringsMarkerIntercard: outputStringsMarkerIntercard,
  outputFromMarker8Num: outputFromMarker8Num,
  xyToMarker8Output: (x: number, y: number, cx: number, cy: number): MarkerOutput8 => {
    const n = Directions.xyTo8DirNum(x, y, cx, cy);
    return outputFromMarker8Num(n);
  },

  outputArrow8: outputArrow8,
  outputArrowCardinal: outputArrowCardinal,
  outputArrowIntercard: outputArrowIntercard,
  outputStringsArrow8: outputStringsArrow8,
  outputStringsArrowCardinal: outputStringsArrowCardinal,
  outputStringsArrowIntercard: outputStringsArrowIntercard,
  outputFromArrow8Num: outputFromArrow8Num,
  xyToArrow8Output: (x: number, y: number, cx: number, cy: number): ArrowOutput8 => {
    const n = Directions.xyTo8DirNum(x, y, cx, cy);
    return outputFromArrow8Num(n);
  },
};

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
} as const;

// 직업 순위를 이름으로
const jobPriorityToName: Record<number, LocaleText> = {
  0: {
    en: 'ADV',
    ja: '冒険者',
    ko: '모험가',
  },
  101: {
    en: 'DRK',
    ja: '暗黒騎士',
    ko: '암흑기사',
  },
  102: {
    en: 'WAR',
    ja: '戦士',
    ko: '전사',
  },
  103: {
    en: 'GNB',
    ja: 'ガンブレ',
    ko: '총칼이',
  },
  104: {
    en: 'PLD',
    ja: 'ナイト',
    ko: '팔라딘',
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
    ko: '사무라이',
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
  401: {
    en: 'MCH',
    ja: '機工士',
    ko: '기공사',
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
    ko: '',
  },
  502: {
    en: 'RDM',
    ja: '赤魔道士',
    ko: '레드메',
  },
  503: {
    en: 'SMN',
    ja: '召喚士',
    ko: '소환사',
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
    ko: '검술사',
  },
  8201: {
    en: 'CNH',
    ja: '幻術士',
    ko: '',
  },
  8302: {
    en: 'PGL',
    ja: '格闘士',
    ko: '환술사',
  },
  8304: {
    en: 'LNC',
    ja: '槍術士',
    ko: '랜서',
  },
  8305: {
    en: 'ROG',
    ja: '双剣士',
    ko: '쌍검사',
  },
  8402: {
    en: 'ARC',
    ja: '弓術士',
    ko: '활쟁이',
  },
  8501: {
    en: 'THM',
    ja: '呪術士',
    ko: '주술사',
  },
  8503: {
    en: 'ACN',
    ja: '巴術士',
    ko: '비술사',
  },
  9101: {
    en: 'CRP',
    ja: '木工師',
    ko: '목수',
  },
  9102: {
    en: 'BSM',
    ja: '鍛冶師',
    ko: '대장장이',
  },
  9103: {
    en: 'ARM',
    ja: '甲冑師',
    ko: '갑주장인',
  },
  9104: {
    en: 'GSM',
    ja: '彫金師',
    ko: '보석장인',
  },
  9105: {
    en: 'LTW',
    ja: '革細工師',
    ko: '가죽장인',
  },
  9106: {
    en: 'WVR',
    ja: '裁縫師',
    ko: '재봉사',
  },
  9107: {
    en: 'ALC',
    ja: '錬金術師',
    ko: '연금술사',
  },
  9108: {
    en: 'CUL',
    ja: '調理師',
    ko: '요리사',
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
} as const;

// 롤 이름
const roleTanks: readonly string[] = ['MT', 'ST', 'OT'] as const;
const roleHealers: readonly string[] = ['H1', 'H2'] as const;
const roleDps: readonly string[] = ['D1', 'D2', 'D3', 'D4', 'M1', 'M2', 'R1', 'R2'] as const;
const roleNames: readonly string[] = [...roleTanks, ...roleHealers, ...roleDps] as const;
const roleTanksAndHealers: readonly string[] = [...roleTanks, ...roleHealers] as const;

// 어듬이 유틸
const Autumn = {
  jobPriority: (jobindex: number): number => jobIndexToPriority[jobindex] ?? 9999,
  jobPriorityName: (jobindex: number, lang: Lang) => jobPriorityToName[jobindex]?.[lang] ?? '???',
  jobPriorityList: (jobindices: readonly number[], lang: Lang): string[] => {
    const priors = jobindices.map((x) => jobIndexToPriority[x] ?? 9999).sort((a, b) => a - b);
    const jobs = priors.map((x) => jobPriorityToName[x]?.[lang] ?? '???');
    return jobs;
  },
  isRoleName: (name: string) => roleNames.includes(name),
  isTankName: (name: string) => roleTanks.includes(name),
  isHealerName: (name: string) => roleHealers.includes(name),
  isTankHealerName: (name: string) => roleTanksAndHealers.includes(name),
  isDpsName: (name: string) => roleDps.includes(name),
} as const;

export default Autumn;
