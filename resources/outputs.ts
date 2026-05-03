import { FullLocaleText } from '../types/trigger';

// Output strings for now require a field for every language, so this is a
// helper function to generate one for literal numbers.
const numberToOutputString = function(n: number): FullLocaleText {
  const str = n.toString();
  return {
    en: str,
    de: str,
    fr: str,
    ja: str,
    cn: str,
    ko: str,
    tc: str,
  };
};

// General guidelines:
// * property names should closely match English text
// * use OnPlayer suffix for things with `${player}`
// * use OnTarget suffix for things with `${name}`
// * any other parameters (of which there are none, currently) should use consistent suffixes.
// * the value of each property should be a single object with localized keys
export default {
  aoe: {
    en: 'AoE',
    ja: '全体攻撃',
    ko: '전체 공격',
  },
  bigAoe: {
    en: 'big AoE!',
    ja: '強力な全体攻撃',
    ko: '아주 아픈 전체 공격!',
  },
  bleedAoe: {
    en: 'AoE + Bleed',
    ja: '全体攻撃 + DoT',
    ko: '전체 공격 + 출혈',
  },
  hpTo1Aoe: {
    en: 'HP to 1',
    ja: '体力１!',
    ko: '체력이 1이 됐어요',
  },
  tankBuster: {
    en: 'Tank Buster',
    ja: 'タンク強攻撃',
    ko: '탱크버스터',
  },
  miniBuster: {
    en: 'Mini Buster',
    ja: 'タンク攻撃',
    ko: '약한 버스터',
  },
  tankBusterOnPlayer: {
    en: 'Tank Buster on ${player}',
    ja: '${player}に強攻撃',
    ko: '탱크버스터: ${player}',
  },
  tankBusterOnYou: {
    en: 'Tank Buster on YOU',
    ja: '自分に強攻撃',
    ko: '내게 탱크버스터',
  },
  // when there are multiple tankbusters going out
  tankBusters: {
    en: 'Tank Busters',
    ja: 'タンク強攻撃',
    ko: '탱크버스터',
  },
  tetherBusters: {
    en: 'Tank Tethers',
    ja: 'タンク線取り',
    ko: '줄채고 버스터',
  },
  avoidTetherBusters: {
    en: 'Avoid Tank Tethers',
    ja: 'タンクの線を避けて',
    ko: '탱크 줄 피해요',
  },
  tankCleave: {
    en: 'Tank Cleave',
    ja: 'タンク範囲攻撃',
    ko: '탱크 쪼개기',
  },
  tankBusterCleaves: {
    en: 'Tank Buster Cleaves',
    ja: 'MT・ST同時範囲攻撃',
    ko: '탱크 둘에게 동시 쪼개기 공격',
  },
  tankBusterCleavesOnYou: {
    en: 'Tank Cleaves on YOU',
    ja: 'MT・ST同時範囲攻撃(自分対象)',
    ko: '내게 탱크 쪼개기',
  },
  avoidTankCleave: {
    en: 'Avoid Tank Cleave',
    ja: 'タンク範囲攻撃を避ける',
    ko: '탱크 쪼개기 피해욧',
  },
  avoidTankCleaves: {
    en: 'Avoid Tank Cleaves',
    ja: '範囲攻撃を避けて',
    ko: '탱크 쪽으로 가면 안되욧',
  },
  tankCleaveOnYou: {
    en: 'Tank Cleave on YOU',
    ja: '自分に範囲攻撃',
    ko: '내게 탱크 쪼개기',
  },
  sharedTankbuster: {
    en: 'Shared Tank Buster',
    ja: 'タンク頭割り',
    ko: '둘이 맞는 탱크버스터',
  },
  sharedTankbusterOnYou: {
    en: 'Shared Tank Buster on YOU',
    ja: '自分にタンク頭割り',
    ko: '내게 둘이 맞는 탱크버스터',
  },
  sharedTankbusterOnPlayer: {
    en: 'Shared Tank Buster on ${player}',
    ja: '${player} にタンク頭割り',
    ko: '둘이 맞는 탱크버스터: ${player}',
  },
  tankSwap: {
    en: 'Tank Swap!',
    ja: 'タンクスイッチ!',
    ko: '탱크 스위치!',
  },
  spread: {
    en: 'Spread',
    ja: 'さんかい',
    ko: '흩어져요',
  },
  defamationOnYou: {
    en: 'Defamation on YOU',
    ja: '自分に巨大な爆発',
    ko: '내게 큰폭발',
  },
  protean: {
    en: 'Protean',
    ja: '基本さんかい',
    ko: '맡은 자리로',
  },
  stackMarker: {
    // for stack marker situations
    en: 'Stack',
    ja: '頭割り',
    ko: '뭉쳐요',
  },
  getTogether: {
    // for getting together without stack marker
    en: 'Stack',
    ja: '集合',
    ko: '모두 뭉쳐요',
  },
  healerGroups: {
    en: 'Healer Groups',
    ja: 'ヒラに頭割り',
    ko: '4:4 힐러',
  },
  rolePositions: {
    en: 'Role Positions',
    ja: 'ロールさんかい',
    ko: '롤 뭉쳐요',
  },
  stackOnYou: {
    en: 'Stack on YOU',
    ja: '自分に頭割り',
    ko: '내게 뭉쳐욧',
  },
  stackOnPlayer: {
    en: 'Stack on ${player}',
    ja: '${player}に頭割り',
    ko: '뭉쳐욧: ${player}',
  },
  stackPartner: {
    en: 'Stack With Partner',
    ja: 'ペア',
    ko: '둘이 페어',
  },
  stackMiddle: {
    en: 'Stack in Middle',
    ja: '中央で頭割り',
    ko: '한가운데서 뭉쳐요',
  },
  stackInTower: {
    en: 'Stack in Tower',
    ja: '塔で頭割り',
    ko: '타워에서 뭉쳐요',
  },
  baitPuddles: {
    en: 'Bait Puddles',
    ja: 'AOE誘導',
    ko: '장판 유도',
  },
  // For general more-than-one-stack-at-a-time situations
  stacks: {
    en: 'Stacks',
    ja: '頭割り',
    ko: '뭉쳐욧',
  },
  doritoStack: {
    en: 'Dorito Stack',
    ja: 'マーカー同士で頭割り',
    ko: '마커끼리 뭉쳐욧',
  },
  spreadThenStack: {
    en: 'Spread => Stack',
    ja: 'さんかい => 頭割り',
    ko: '흩어졌다 🔜 뭉쳐요',
  },
  stackThenSpread: {
    en: 'Stack => Spread',
    ja: '頭割り => さんかい',
    ko: '뭉쳤다 🔜 흩어져요',
  },
  drawIn: {
    // Opposite of a knockback.
    en: 'Draw In',
    ja: '吸込み',
    ko: '빨려가욧',
  },
  knockback: {
    en: 'Knockback',
    ja: 'ノックバック',
    ko: '넉백',
  },
  knockbackOnYou: {
    en: 'Knockback on YOU',
    ja: '自分にノックバック',
    ko: '내게 넉백',
  },
  knockbackOnPlayer: {
    en: 'Knockback on ${player}',
    ja: '${player}にノックバック',
    ko: '넉백: ${player}',
  },
  lookTowardsBoss: {
    en: 'Look Towards Boss',
    ja: 'ボスを見る',
    ko: '보스 봐욧',
  },
  lookAway: {
    en: 'Look Away',
    ja: 'ボスを見ない',
    ko: '쳐다 보면 안되욧',
  },
  lookAwayFromPlayer: {
    en: 'Look Away from ${player}',
    ja: '${player}を見ない',
    ko: '쳐다 보면 안되욧: ${player}',
  },
  lookAwayFromTarget: {
    en: 'Look Away from ${name}',
    ja: '${name}を見ない',
    ko: '쳐다 보면 안되욧: ${name}',
  },
  getBehind: {
    en: 'Get Behind',
    ja: '背面へ',
    ko: '엉댕이로',
  },
  goFrontOrSides: {
    en: 'Go Front / Sides',
    ja: '前／横へ',
    ko: '엉댕이 쪽은 피해요',
  },
  goFront: {
    en: 'Go Front',
    ja: '前へ',
    ko: '앞으로',
  },
  // getUnder is used when you have to get into the bosses hitbox
  getUnder: {
    en: 'Get Under',
    ja: 'ボスに貼り付く',
    ko: '보스 밑으로',
  },
  // in is more like "get close but maybe even melee range is fine"
  in: {
    en: 'In',
    ja: '中へ',
    ko: '안으로',
  },
  // out means get far away
  out: {
    en: 'Out',
    ja: '外へ',
    ko: '바깥으로',
  },
  outOfMelee: {
    en: 'Out of Melee',
    ja: '近接の範囲から離れる',
    ko: '칼끝 범위',
  },
  // be just outside the boss's target circle
  outOfHitbox: {
    en: 'Out of Hitbox',
    ja: 'ボスから少し離れる',
    ko: '센터 밖으로',
  },
  inThenOut: {
    en: 'In => Out',
    ja: '中 => 外',
    ko: '안에서 🔜 밖으로',
  },
  outThenIn: {
    en: 'Out => In',
    ja: '外 => 中',
    ko: '밖에서 🔜 안으로',
  },
  backThenFront: {
    en: 'Back => Front',
    ja: '後ろ => 前',
    ko: '뒤에서 🔜 앞으로',
  },
  frontThenBack: {
    en: 'Front => Back',
    ja: '前 => 後ろ',
    ko: '앞에서 🔜 뒤로',
  },
  sidesThenFrontBack: {
    en: 'Sides => Front/Back',
    ko: '옆에서 🔜 앞뒤로',
  },
  frontBackThenSides: {
    en: 'Front/Back => Sides',
    ko: '앞뒤에서 🔜 옆으로',
  },
  goIntoMiddle: {
    en: 'Get Middle',
    ja: '中へ',
    ko: '한가운데로',
  },
  front: {
    en: 'Front',
    ja: '前',
    ko: '앞',
  },
  back: {
    en: 'Back',
    ja: '後ろ',
    ko: '뒤',
  },
  right: {
    en: 'Right',
    ja: '右へ',
    ko: '오른쪽',
  },
  rightEast: {
    en: 'Right/East',
    ja: '右/東へ',
    ko: '오른쪽/동쪽',
  },
  left: {
    en: 'Left',
    ja: '左へ',
    ko: '왼쪽',
  },
  leftWest: {
    en: 'Left/West',
    ja: '左/西へ',
    ko: '왼쪽/서쪽',
  },
  getLeftAndWest: {
    en: '<= Get Left/West',
    ja: '<= 左/西へ',
    ko: '🡸왼쪽으로',
  },
  getRightAndEast: {
    en: 'Get Right/East =>',
    ja: '右/東へ =>',
    ko: '오른쪽으로🡺',
  },
  leftThenRight: {
    en: 'Left => Right',
    ja: '左 => 右',
    ko: '왼쪽 🔜 오른쪽',
  },
  rightThenLeft: {
    en: 'Right => Left',
    ja: '右 => 左',
    ko: '오른쪽 🔜 왼쪽',
  },
  goFrontBack: {
    en: 'Go Front/Back',
    ja: '縦へ',
    ko: '앞⇅뒤로',
  },
  sides: {
    en: 'Sides',
    ja: '横へ',
    ko: '옆으로',
  },
  middle: {
    en: 'Middle',
    ja: '中へ',
    ko: '가운데로',
  },
  clockwise: {
    en: 'Clockwise',
    ja: '時計回り',
    ko: '시계방향',
  },
  counterclockwise: {
    en: 'Counter-Clockwise',
    ja: '反時計回り',
    ko: '반시계방향',
  },
  // killAdds is used for adds that will always be available
  killAdds: {
    en: 'Kill Adds',
    ja: '雑魚から倒して',
    ko: '쫄 처리해욧',
  },
  // killExtraAdd is used for adds that appear if a mechanic was not played correctly
  killExtraAdd: {
    en: 'Kill Extra Add',
    ja: '雑魚から倒して',
    ko: '쫄 잡아욧',
  },
  awayFromFront: {
    en: 'Away From Front',
    ja: '前方から離れる',
    ko: '앞쪽에 있으면 안되욧',
  },
  sleepTarget: {
    en: 'Sleep ${name}',
    ja: '${name} にスリプル',
    ko: '재워요: ${name}',
  },
  stunTarget: {
    en: 'Stun ${name}',
    ja: '${name} にスタン',
    ko: '스턴: ${name}',
  },
  interruptTarget: {
    en: 'Interrupt ${name}',
    ja: '${name} に沈黙',
    ko: '인터럽트: ${name}',
  },
  preyOnYou: {
    en: 'Prey on YOU',
    ja: '自分にマーキング',
    ko: '내게 프레이',
  },
  preyOnPlayer: {
    en: 'Prey on ${player}',
    ja: '${player}にマーキング',
    ko: '프레이: ${player}',
  },
  awayFromGroup: {
    en: 'Away from Group',
    ja: '外へ',
    ko: '홀로 떨어져욧',
  },
  awayFromPlayer: {
    en: 'Away from ${player}',
    ja: '${player}から離れる',
    ko: '멀어져욧: ${player}',
  },
  meteorOnYou: {
    en: 'Meteor on YOU',
    ja: '自分にメテオ',
    ko: '내게 메테오',
  },
  stopMoving: {
    en: 'Stop Moving!',
    ja: '移動禁止！',
    ko: '움직이지마욧!',
  },
  stopEverything: {
    en: 'Stop Everything!',
    ja: '行動禁止！',
    ko: '그냥 멈춰욧!',
  },
  moveAway: {
    // move away to dodge aoes
    en: 'Move!',
    ja: '避けて！',
    ko: '피해욧!',
  },
  moveAround: {
    // move around (e.g. jumping) to avoid being frozen
    en: 'Move!',
    ja: '動く！',
    ko: '움직여욧!',
  },
  breakChains: {
    en: 'Break Chains',
    ja: '線を切る',
    ko: '줄 끊어욧',
  },
  moveChainsTogether: {
    en: 'Move Chains Together',
    ja: '線同士で一緒に移動',
    ko: '줄 달린채 움직여욧',
  },
  earthshakerOnYou: {
    en: 'Earth Shaker on YOU',
    ja: '自分にアースシェイカー',
    ko: '내게 어스세이커',
  },
  wakeUp: {
    en: 'WAKE UP',
    ja: '目を覚まして！',
    ko: '일어나~~~~ 일어놔아~~~~',
  },
  closeTethersWithPlayer: {
    en: 'Close Tethers (${player})',
    ja: '${player}に近づく',
    ko: '붙는 줄: (${player})',
  },
  farTethersWithPlayer: {
    en: 'Far Tethers (${player})',
    ja: ' (${player})から離れる',
    ko: '떨어지는 줄: (${player})',
  },
  getTowers: {
    en: 'Get Towers',
    ja: '塔を踏む',
    ko: '타워로',
  },
  unknown: {
    en: '???',
    ja: '???',
    ko: '몰?루',
  },
  cardinals: {
    en: 'Cardinals',
    ja: '十字回避',
    ko: '십자로➕',
  },
  intercards: {
    en: 'Intercards',
    ja: '斜めへ',
    ko: '비스듬히❌',
  },
  north: {
    en: 'North',
    ja: '北',
    ko: '북쪽',
  },
  south: {
    en: 'South',
    ja: '南',
    ko: '남쪽',
  },
  east: {
    en: 'East',
    ja: '東',
    ko: '동쪽',
  },
  west: {
    en: 'West',
    ja: '西',
    ko: '서쪽',
  },
  northwest: {
    en: 'Northwest',
    ja: '北西',
    ko: '북서쪽',
  },
  northeast: {
    en: 'Northeast',
    ja: '北東',
    ko: '북동쪽',
  },
  southwest: {
    en: 'Southwest',
    ja: '南西',
    ko: '남서쪽',
  },
  southeast: {
    en: 'Southeast',
    ja: '南東',
    ko: '남동쪽',
  },
  dirN: {
    en: 'N',
    ja: '北',
    ko: '북',
  },
  dirS: {
    en: 'S',
    ja: '南',
    ko: '남',
  },
  dirE: {
    en: 'E',
    ja: '東',
    ko: '동',
  },
  dirW: {
    en: 'W',
    ja: '西',
    ko: '서',
  },
  dirNW: {
    en: 'NW',
    ja: '北西',
    ko: '북서',
  },
  dirNE: {
    en: 'NE',
    ja: '北東',
    ko: '북동',
  },
  dirSW: {
    en: 'SW',
    ja: '南西',
    ko: '남서',
  },
  dirSE: {
    en: 'SE',
    ja: '南東',
    ko: '남동',
  },
  dirNNE: {
    en: 'NNE',
    ja: '北北東(1時)',
    ko: '1시',
  },
  dirENE: {
    en: 'ENE',
    ja: '東北東(2時)',
    ko: '2시',
  },
  dirESE: {
    en: 'ESE',
    ja: '東南東(4時)',
    ko: '4시',
  },
  dirSSE: {
    en: 'SSE',
    ja: '南南東(5時)',
    ko: '5시',
  },
  dirSSW: {
    en: 'SSW',
    ja: '南南西(7時)',
    ko: '7시',
  },
  dirWSW: {
    en: 'WSW',
    ja: '西南西(8時)',
    ko: '8시',
  },
  dirWNW: {
    en: 'WNW',
    ja: '西北西(10時)',
    ko: '10시',
  },
  dirNNW: {
    en: 'NNW',
    ja: '北北西(11時)',
    ko: '11시',
  },
  tank: {
    en: 'Tank',
    ja: 'タンク',
    ko: '탱크',
  },
  healer: {
    en: 'Healer',
    ja: 'ヒーラー',
    ko: '힐러',
  },
  melee: {
    en: 'Melee',
    ja: '近接',
    ko: '근접',
  },
  ranged: {
    en: 'Ranged',
    ja: '遠隔',
    ko: '원거리',
  },
  dps: {
    en: 'DPS',
    ja: 'DPS',
    ko: 'DPS',
  },
  // for sequenced mechanics
  next: {
    en: ' => ',
    ja: ' => ',
    ko: ' 🔜 ',
  },
  // for combo mechanics/names
  and: {
    en: ' + ',
    ja: ' + ',
    ko: ' + ',
  },
  // for either/or directions or mechanics
  or: {
    en: ' / ',
    ja: ' / ',
    ko: ' / ',
  },
  // Literal numbers.
  num0: numberToOutputString(0),
  num1: numberToOutputString(1),
  num2: numberToOutputString(2),
  num3: numberToOutputString(3),
  num4: numberToOutputString(4),
  num5: numberToOutputString(5),
  num6: numberToOutputString(6),
  num7: numberToOutputString(7),
  num8: numberToOutputString(8),
  num9: numberToOutputString(9),

  // 어듬이 추가
  test: {
    en: 'test',
    ja: 'テスト',
    ko: '테스트',
  },
  sharedOrInvinTankbusterOnYou: {
    en: 'Share Tank Buster',
    ja: '自分にタンクシェア',
    ko: '내게 탱크버스터, 무적 또는 둘이서',
  },
  sharedOrInvinTankbusterOnPlayer: {
    en: 'Share Tank Buster on ${player}',
    ja: '${player} にタンクシェア',
    ko: '탱크버스터, 무적 또는 둘이서: ${player}',
  },
  positions: {
    en: 'Positions',
    ja: '散会',
    ko: '맡은 자리로',
  },
  // 화살표
  arrowN: {
    en: '🡹',
    ja: '🡹',
    ko: '🡹',
  },
  arrowNE: {
    en: '🡽',
    ja: '🡽',
    ko: '🡽',
  },
  arrowE: {
    en: '🡺',
    ja: '🡺',
    ko: '🡺',
  },
  arrowSE: {
    en: '🡾',
    ja: '🡾',
    ko: '🡾',
  },
  arrowS: {
    en: '🡻',
    ja: '🡻',
    ko: '🡻',
  },
  arrowSW: {
    en: '🡿',
    ja: '🡿',
    ko: '🡿',
  },
  arrowW: {
    en: '🡸',
    ja: '🡸',
    ko: '🡸',
  },
  arrowNW: {
    en: '🡼',
    ja: '🡼',
    ko: '🡼',
  },
  // 화살표 + 방향
  aimN: {
    en: '🡹N',
    ja: '🡹北',
    ko: '🡹북',
  },
  aimNE: {
    en: '🡽NE',
    ja: '🡽北東',
    ko: '🡽북동',
  },
  aimE: {
    en: '🡺E',
    ja: '🡺東',
    ko: '🡺동',
  },
  aimSE: {
    en: '🡾SE',
    ja: '🡾南東',
    ko: '🡾남동',
  },
  aimS: {
    en: '🡻S',
    ja: '🡻南',
    ko: '🡻남',
  },
  aimSW: {
    en: '🡿SW',
    ja: '🡿南西',
    ko: '🡿남서',
  },
  aimW: {
    en: '🡸W',
    ja: '🡸西',
    ko: '🡸서',
  },
  aimNW: {
    en: '🡼NW',
    ja: '🡼北西',
    ko: '🡼북서',
  },
  // 색깔
  red: {
    en: 'Red',
    ja: '赤',
    ko: '🔴빨강',
  },
  blue: {
    en: 'Blue',
    ja: '青',
    ko: '🔵파랑',
  },
  m1A2N: {
    en: '🄰North',
    ja: '🄰北',
    ko: '🄰북',
  },
  m1A2E: {
    en: '🄱East',
    ja: '🄱東',
    ko: '🄱동',
  },
  m1A2S: {
    en: '🄲South',
    ja: '🄲南',
    ko: '🄲남',
  },
  m1A2W: {
    en: '🄳West',
    ja: '🄳西',
    ko: '🄳서',
  },
  m1A2NW: {
    en: '➊NW',
    ja: '➊北西',
    ko: '➊북서',
  },
  m1A2NE: {
    en: '➋NE',
    ja: '➋北東',
    ko: '➋북동',
  },
  m1A2SE: {
    en: '➌SE',
    ja: '➌南東',
    ko: '➌남동',
  },
  m1A2SW: {
    en: '➍SW',
    ja: '➍南西',
    ko: '➍남서',
  },
  yellow: {
    en: 'Yellow',
    ja: '黄',
    ko: '🟡노랑',
  },
  green: {
    en: 'Green',
    ja: '緑',
    ko: '🟢초록',
  },
  purple: {
    en: 'Purple',
    ja: '紫',
    ko: '🟣보라',
  },
  white: {
    en: 'White',
    ja: '白',
    ko: '⚪하양',
  },
  black: {
    en: 'Black',
    ja: '黒',
    ko: '⚫검정',
  },
} as const;
