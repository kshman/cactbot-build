import { OutputStrings } from '../types/trigger';

import Outputs from './outputs';

// 직업 인덱스를 이름으로
const jobIndexToName: Record<number, string> = {
  0: '몰?루',
  1: '검술사',
  2: '격투사',
  3: '도끼맨',
  4: '랜서',
  5: '활쟁이',
  6: '환술사',
  7: '주술사',
  8: '목수',
  9: '대장장이',
  10: '갑옷장인',
  11: '보석장인',
  12: '가죽장인',
  13: '재봉사',
  14: '연금술사',
  15: '요리사',
  16: '광부',
  17: '원예사',
  18: '어부',
  19: '나이트',
  20: '몽크',
  21: '전사',
  22: '류상',
  23: '바드',
  24: '뱅마',
  25: '흥마',
  26: '비술사',
  27: '소환사',
  28: '학자',
  29: '로그',
  30: '닌자',
  31: '기공사',
  32: '암흑기사',
  33: '점쟁이',
  34: '사무라이',
  35: '레드메',
  36: '블루메',
  37: '총칼이',
  38: '춤꾼',
  39: '리퍼',
  40: '현자',
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
const jobPriorityToName: Record<number, string> = {
  101: '암흑기사',
  102: '전사',
  103: '총칼이',
  104: '나이트',
  201: '뱅마',
  202: '점쟁이',
  203: '현자',
  204: '학자',
  301: '사무라이',
  302: '몽크',
  303: '리퍼',
  304: '류상',
  305: '닌자',
  401: '기공사',
  402: '바드',
  403: '춤꾼',
  501: '흥마',
  502: '레드메',
  503: '소환사',
  599: '블루메',
  8102: '도끼맨',
  8104: '검술사',
  8201: '환술사',
  8302: '격투사',
  8304: '랜서',
  8305: '로그',
  8402: '활쟁이',
  8501: '주술사',
  8503: '비술사',
  9101: '목수',
  9102: '대장장이',
  9103: '갑옷장인',
  9104: '보석장인',
  9105: '가죽장인',
  9106: '재봉사',
  9107: '연금술사',
  9108: '요리사',
  9201: '광부',
  9202: '원예사',
  9203: '어부',
  9999: '몰?루',
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
  outputArrow8: outputArrow8,
  outputArrowCardinal: outputArrowCardinal,
  outputArrowIntercard: outputArrowIntercard,
  outputStringsArrow8: outputStringsArrow8,
  outputStringsArrowCardinal: outputStringsArrowCardinal,
  outputStringsArrowIntercard: outputStringsArrowIntercard,
  outputFromArrow8Num: outputFromArrow8Num,
};

const Autumns = {
  JobName: (id: number) => {
    const job = jobIndexToName[id];
    return job ?? '몰?루';
  },
  JobPriority: (id: number) => {
    const prior = jobIndexToPriority[id];
    return prior ?? 9999;
  },
  BuildJobPriorities: (ids: number[], separator?: string) => {
    const priors = ids.map((x) => jobIndexToPriority[x] ?? 9999).sort((a, b) => a - b);
    const jobs = priors.map((x) => jobPriorityToName[x]);
    return jobs.join(separator === undefined ? ', ' : separator);
  },
} as const;

export default Autumns;
