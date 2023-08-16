import { LocaleText, OutputStrings } from '../types/trigger';

import { Lang } from './languages';
import Outputs from './outputs';
import { Directions } from './util';

// 직업 인덱스를 이름으로
const jobIndexToName: Record<number, LocaleText> = {
  0: { en: '몰?루' },
  1: { en: '검술사' },
  2: { en: '격투사' },
  3: { en: '도끼맨' },
  4: { en: '랜서' },
  5: { en: '활쟁이' },
  6: { en: '환술사' },
  7: { en: '주술사' },
  8: { en: '목수' },
  9: { en: '대장장이' },
  10: { en: '갑옷장인' },
  11: { en: '보석장인' },
  12: { en: '가죽장인' },
  13: { en: '재봉사' },
  14: { en: '연금술사' },
  15: { en: '요리사' },
  16: { en: '광부' },
  17: { en: '원예사' },
  18: { en: '어부' },
  19: { en: '나이트' },
  20: { en: '몽크' },
  21: { en: '전사' },
  22: { en: '류상' },
  23: { en: '바드' },
  24: { en: '뱅마' },
  25: { en: '흥마' },
  26: { en: '비술사' },
  27: { en: '소환사' },
  28: { en: '학자' },
  29: { en: '로그' },
  30: { en: '닌자' },
  31: { en: '기공사' },
  32: { en: '암흑기사' },
  33: { en: '점쟁이' },
  34: { en: '사무라이' },
  35: { en: '레드메' },
  36: { en: '블루메' },
  37: { en: '총칼이' },
  38: { en: '춤꾼' },
  39: { en: '리퍼' },
  40: { en: '현자' },
};
// 직업 인덱스를 우선 순위로
const jobIndexToPriority: Record<number, number> = {
  0: 9999, // 몰?루
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
  17: 9202, // 원예사
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
};
// 직업 순위를 이름으로
const jobPriorityToName: Record<number, LocaleText> = {
  101: { en: '암흑기사' },
  102: { en: '전사' },
  103: { en: '총칼이' },
  104: { en: '나이트' },
  201: { en: '뱅마' },
  202: { en: '점쟁이' },
  203: { en: '현자' },
  204: { en: '학자' },
  301: { en: '사무라이' },
  302: { en: '몽크' },
  303: { en: '리퍼' },
  304: { en: '류상' },
  305: { en: '닌자' },
  401: { en: '기공사' },
  402: { en: '바드' },
  403: { en: '춤꾼' },
  501: { en: '흥마' },
  502: { en: '레드메' },
  503: { en: '소환사' },
  599: { en: '블루메' },
  8102: { en: '도끼맨' },
  8104: { en: '검술사' },
  8201: { en: '환술사' },
  8302: { en: '격투사' },
  8304: { en: '랜서' },
  8305: { en: '로그' },
  8402: { en: '활쟁이' },
  8501: { en: '주술사' },
  8503: { en: '비술사' },
  9101: { en: '목수' },
  9102: { en: '대장장이' },
  9103: { en: '갑옷장인' },
  9104: { en: '보석장인' },
  9105: { en: '가죽장인' },
  9106: { en: '재봉사' },
  9107: { en: '연금술사' },
  9108: { en: '요리사' },
  9201: { en: '광부' },
  9202: { en: '원예사' },
  9203: { en: '어부' },
  9999: { en: '몰?루' },
};

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

export const AutumnIndicator = {
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

const Autumns = {
  JobName: (id: number, lang: Lang) => {
    const job = jobIndexToName[id]?.[lang];
    return job ?? '몰?루';
  },
  JobPriority: (id: number) => {
    const prior = jobIndexToPriority[id];
    return prior ?? 9999;
  },
  BuildJobPriority: (ids: number[], lang: Lang) => {
    const priors = ids.map((x) => jobIndexToPriority[x] ?? 9999).sort((a, b) => a - b);
    const jobs = priors.map((x) => jobPriorityToName[x]?.[lang]);
    return jobs;
  },
} as const;

export default Autumns;
