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
  19: '팔라딘',
  20: '몽크',
  21: '전사',
  22: '류상',
  23: '바드',
  24: '뱅마',
  25: '흥마',
  26: '비술사',
  27: '서모너',
  28: '스콜라',
  29: '로그',
  30: '닌자',
  31: '기공사',
  32: '다크나이트',
  33: '점쟁이',
  34: '사무라이',
  35: '레드메',
  36: '블루메',
  37: '총칼이',
  38: '춤꾼',
  39: '리퍼',
  40: '현자',
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
const outputArrowCardinal: ArrowOutputCardinal[] = ['arrowN', 'arrowE', 'arrowS', 'arrowW'];
const outputArrowIntercard: ArrowOutputIntercard[] = ['arrowNE', 'arrowSE', 'arrowSW', 'arrowNW'];

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

const outputFromArrow8Num = (arrowNum: number): ArrowOutput8 => {
  return outputArrow8[arrowNum] ?? 'unknown';
};

export const Arrows = {
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
} as const;

export default Autumns;
