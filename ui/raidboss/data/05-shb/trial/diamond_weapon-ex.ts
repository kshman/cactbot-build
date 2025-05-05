import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Auri Arts can now be done with MapEffect lines if somebody wanted.

export interface Data extends RaidbossData {
  decOffset?: number;
  phase?: number;
}

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
// The first 1B markers in the encounter are flares, ID 0057.
// The lowest 1B marker in the encounter is LC #1, ID 004F.
// P2 buster is 00F3
// P3 Shrapnal tracking AoE is 00C5
const firstHeadmarker = parseInt('0057', 16);
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 0057.
  // (This makes the offset 0, and !0 is true.)
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const triggerSet: TriggerSet<Data> = {
  id: 'TheCloudDeckExtreme',
  zoneId: ZoneId.TheCloudDeckExtreme,
  timelineFile: 'diamond_weapon-ex.txt',
  triggers: [
    // Phase 1&3
    {
      id: 'DiamondEx Diamond Rain',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FA7', capture: false },
      response: Responses.aoe(),
      run: (data) => data.phase = data.phase ?? 1,
    },
    // @TODO: Phase transition tethers and KB
    {
      id: 'DiamondEx Code Chi-Xi-Stigma',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FAD', capture: false },
      run: (data) => data.phase = 2,
    },
    // Phase 2
    {
      id: 'DiamondEx Outrage',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FBC', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'DiamondEx Auri Doomstead',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FBD' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'DiamondEx Headmarker',
      type: 'HeadMarker',
      netRegex: {},
      durationSeconds: 25,
      infoText: (data, matches, output) => {
        // Always get the headmarker ID, so that decOffset can be defined properly
        const idHex = getHeadmarkerId(data, matches);
        if (matches.target !== data.me)
          return;

        const id = parseInt(idHex, 16);
        const firstLCMarker = parseInt('004F', 16);
        const lastLCMarker = parseInt('0056', 16);

        if (id >= firstLCMarker && id <= lastLCMarker) {
          const decOffset = id - firstLCMarker;
          return output[decOffset + 1]!();
        }
      },
      outputStrings: {
        1: Outputs.num1,
        2: Outputs.num2,
        3: Outputs.num3,
        4: Outputs.num4,
        5: Outputs.num5,
        6: Outputs.num6,
        7: Outputs.num7,
        8: Outputs.num8,
      },
    },
    // Phase 3
    // ---------------------------------
    {
      // 5FC2이 손톱 휘두르기
      // 5FA2 오른쪽(산개)
      // 5FA4 오른쪽(같이맞기)
      // 5F9A 오른쪽(없음)?
      id: 'DiamondEx 어듬이 Adamant Purge Right',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: ['5FA4', '5FA2', '5F9A'], capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '◁◀◁ Left',
          ko: '◁◀◁ 왼쪽으로',
        },
      },
    },
    {
      // 5FC3이 손톱 휘두르기
      // 5FA3 왼쪽(산개)
      // 5FA5 왼쪽(같이맞기)?
      // 5F9B 왼쪽(없음)
      id: 'DiamondEx 어듬이 Adamant Purge Left',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: ['5FA5', '5FA3', '5F9B'], capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '▷▶▷ Right',
          ko: '▷▶▷ 오른쪽으로',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Adamant Purge After Spread',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: ['5FA3', '5FA2'], capture: false },
      delaySeconds: 7,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread!',
          ko: '흩어져욧!',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Adamant Purge After Stack',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: ['5FA5', '5FA4'], capture: false },
      delaySeconds: 7,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack!',
          ko: '모두 뭉쳐욧!',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Photon Burst',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FCA' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          itsme: {
            en: 'Photon on YOU',
            ko: '내게 포톤',
          },
          photon: {
            en: 'Photon: ${player}',
            ko: '포톤: ${player}',
          },
        };
        if (data.me === matches.target)
          return { alertText: output.itsme!() };
        return { infoText: output.photon!({ player: data.party.member(matches.target) }) };
      },
    },
    {
      id: 'DiamondEx 어듬이 Code Chi-Xi-Stigma',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FAD', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Jump soon',
          ko: '가운데서 점프준비',
        },
      },
    },
    {
      // 5FFE 왼쪽에 장판 (5FD3 후속)
      id: 'DiamondEx 어듬이 Airship\'s Bane',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FFE', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid puddles',
          ko: '장판 피해욧',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Moving',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: ['5FAF', '5FB2', '5FB5'], capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to safe zone',
          ko: '안전한 곳으로 피해욧',
        },
      },
    },
    {
      // 5FB7 -> 5FD0 왼쪽을 보고 달려듬
      id: 'DiamondEx 어듬이 Vertical Cleave',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FB7', capture: false },
      durationSeconds: 5,
      response: Responses.knockback(),
    },
    {
      id: 'DiamondEx 어듬이 Articulated Bits',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: ['5FC1', '5FA9'], capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bits',
          ko: '때가 쏙 비트',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Flood Ray',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FA6', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Dice Tower',
          ko: '주사위 들어감요',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Diamond Shrapnel',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FAC', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Drop puddles',
          ko: '장판깔고 튀어욧',
        },
      },
    },
    {
      id: 'DiamondEx 어듬이 Diamond Shrapnel Burst',
      type: 'StartsUsing',
      netRegex: { source: 'The Diamond Weapon', id: '5FAC', capture: false },
      delaySeconds: 15,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Tower',
          ko: '탑에 들어가세욧',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Articulated Bit': 'Satellitenarm',
        'The Diamond Weapon': 'Diamant-Waffe',
      },
      'replaceText': {
        '\\(Jump\\)': '(Sprung)',
        'Adamant Purge': 'Diamantpanzer',
        'Aetherial Bullet': 'Ätherreigen',
        'Articulated Bits': 'Satellitenarme',
        'Auri Arts': 'Aurische Kunst',
        'Auri Cyclone': 'Aurischer Zyklon',
        'Auri Doomstead': 'Aurisches Verderben',
        '(?<!Photon )Burst': 'Einschlag',
        'Claw Swipe': 'Klauensturm',
        'Code Chi-Xi-Stigma': 'Code 666',
        'Diamond Flash': 'Diamantblitz',
        'Diamond Rain': 'Dominanz der Diamanten',
        'Diamond Shot': 'Diamantschuss',
        'Diamond Shrapnel': 'Diamantschub',
        'Flood Ray': 'Flutstrahl',
        'Homing Laser': 'Leitlaser',
        'Outrage': 'Diamantwut',
        'Photon Burst': 'Photonenknall',
        'Vertical Cleave': 'Vertikalspalter',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Articulated Bit': 'bras autonome',
        'The Diamond Weapon': 'Arme Diamant',
      },
      'replaceText': {
        '\\?': ' ?',
        '\\(Jump\\)': '(Saut)',
        'Adamant Purge': 'Armure adaptative',
        'Aetherial Bullet': 'Rayon éthéré',
        'Articulated Bits': 'Bras autonome',
        'Auri Arts': 'Art martial aoran',
        'Auri Cyclone': 'Tornade aoranne',
        'Auri Doomstead': 'Calamité aoranne',
        '(?<!Photon )Burst': 'Explosion',
        'Claw Swipe': 'Ruée de griffes',
        'Code Chi-Xi-Stigma': 'Code Chi-Xi-Stigma',
        'Diamond Flash': 'Éclair de diamant',
        'Diamond Rain': 'Bombardement adamantin',
        'Diamond Shot': 'Tir diamantaire',
        'Diamond Shrapnel': 'Salve adamantine',
        'Flood Ray': 'Déluge de rayons',
        'Homing Laser': 'Laser auto-guidé',
        'Outrage': 'Indignation',
        'Photon Burst': 'Salve photonique',
        'Vertical Cleave': 'Fente verticale',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Articulated Bit': 'アームビット',
        'The Diamond Weapon': 'ダイヤウェポン',
      },
      'replaceText': {
        'Adamant Purge': '装甲展開',
        'Aetherial Bullet': 'エーテルバレット',
        'Articulated Bits': 'アームビット',
        'Auri Arts': 'アウリアーツ',
        'Auri Cyclone': 'アウリサイクロン',
        'Auri Doomstead': 'アウリドゥーム',
        '(?<!Photon )Burst': '大爆発',
        'Claw Swipe': 'クロースラッシュ',
        'Code Chi-Xi-Stigma': 'コード666',
        'Diamond Flash': 'ダイヤフラッシュ',
        'Diamond Rain': 'ダイヤレイン',
        'Diamond Shot': 'ダイヤショット',
        'Diamond Shrapnel': 'ダイヤバースト',
        'Flood Ray': 'フラッドレイ',
        'Homing Laser': 'ホーミングレーザー',
        'Outrage': 'アウトレイジ',
        'Photon Burst': 'フォトンバースト',
        'Vertical Cleave': 'バーチカルクリーヴ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Articulated Bit': '飞手浮游炮',
        'The Diamond Weapon': '钻石神兵',
      },
      'replaceText': {
        '\\(Jump\\)': '(跳)',
        '\\(Cleave\\)': '(冲锋)',
        'Adamant Purge': '装甲展开',
        'Aetherial Bullet': '以太炮',
        'Articulated Bits': '飞手浮游炮',
        'Auri Arts': '敖龙技巧',
        'Auri Cyclone': '敖龙旋风',
        'Auri Doomstead': '敖龙厄运',
        '(?<!Photon )Burst': '大爆炸',
        'Claw Swipe': '利爪突进',
        'Code Chi-Xi-Stigma': '代号666',
        'Diamond Flash': '钻石闪光',
        'Diamond Rain': '钻石雨',
        'Diamond Shot': '钻石射击',
        'Diamond Shrapnel': '钻石爆发',
        'Flood Ray': '泛光射线',
        'Homing Laser': '自控导弹',
        'Outrage': '震怒',
        'Photon Burst': '光子爆发',
        'Vertical Cleave': '纵劈',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Articulated Bit': '암 비트',
        'The Diamond Weapon': '다이아몬드 웨폰',
      },
      'replaceText': {
        '\\(Jump\\)': '(점프)',
        '\\(Cleave\\)': '(광역 탱버)',
        'Adamant Purge': '장갑 전개',
        'Aetherial Bullet': '에테르 탄환',
        'Articulated Bits': '암 비트',
        'Auri Arts': '아우라의 무예',
        'Auri Cyclone': '아우라의 선풍',
        'Auri Doomstead': '아우라의 파멸',
        '(?<!Photon )Burst': '대폭발',
        'Claw Swipe': '발톱 휘두르기',
        'Code Chi-Xi-Stigma': '코드 666',
        'Diamond Flash': '다이아몬드 섬광',
        'Diamond Rain': '다이아몬드 비',
        'Diamond Shot': '다이아몬드 발사',
        'Diamond Shrapnel': '다이아몬드 유산탄',
        'Flood Ray': '침수광',
        'Homing Laser': '추적 레이저',
        'Outrage': '격노',
        'Photon Burst': '광자 폭발',
        'Vertical Cleave': '수직 쪼개기',
      },
    },
  ],
};

export default triggerSet;
