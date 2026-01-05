import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  lastSpinWasHorizontal?: boolean;
}

// O10N - Alphascape 2.0
const triggerSet: TriggerSet<Data> = {
  id: 'AlphascapeV20',
  zoneId: ZoneId.AlphascapeV20,
  timelineFile: 'o10n.txt',
  triggers: [
    {
      // Spin Table
      // 31C7 + 31C9 = 31CD (horiz + horiz = out)
      // 31C7 + 31CB = 31CF (horiz + vert = in)
      // 31C8 + 31CB = 31D0 (vert + vert = +)
      id: 'O10N Spin Cleanup',
      type: 'Ability',
      netRegex: { id: '31C[78]', source: 'Midgardsormr', capture: false },
      delaySeconds: 10,
      run: (data) => delete data.lastSpinWasHorizontal,
    },
    {
      id: 'O10N Horizontal Spin 1',
      type: 'Ability',
      netRegex: { id: '31C7', source: 'Midgardsormr', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.lastSpinWasHorizontal = true,
      outputStrings: {
        text: {
          en: 'Next Spin: In or Out',
          ja: '次: 中/外',
          ko: '다음 스핀: 안 또는 밖으로',
        },
      },
    },
    {
      id: 'O10N Vertical Spin 1',
      type: 'Ability',
      netRegex: { id: '31C8', source: 'Midgardsormr', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.lastSpinWasHorizontal = false,
      outputStrings: {
        text: {
          en: 'Next Spin: Corners',
          ja: '次: コーナー',
          ko: '다음 스핀: 구석',
        },
      },
    },
    {
      id: 'O10N Horizontal Spin 2',
      type: 'Ability',
      netRegex: { id: '31C9', source: 'Midgardsormr', capture: false },
      condition: (data) => data.lastSpinWasHorizontal !== undefined,
      alertText: (data, _matches, output) => {
        if (data.lastSpinWasHorizontal)
          return output.getOut!();

        // This shouldn't happen.
        return output.goToCardinals!();
      },
      outputStrings: {
        getOut: {
          en: 'Get Out',
          ja: '外へ',
          ko: '밖으로',
        },
        goToCardinals: {
          en: 'Go To Cardinals',
          ja: '横や縦へ',
          ko: '십자로',
        },
      },
    },
    {
      id: 'O10N Vertical Spin 2',
      type: 'Ability',
      netRegex: { id: '31CB', source: 'Midgardsormr', capture: false },
      condition: (data) => data.lastSpinWasHorizontal !== undefined,
      alertText: (data, _matches, output) => {
        if (data.lastSpinWasHorizontal)
          return output.getIn!();

        return output.goToCorners!();
      },
      outputStrings: {
        getIn: {
          en: 'Get In',
          ja: '中へ',
          ko: '안으로',
        },
        goToCorners: {
          en: 'Go To Corners',
          ja: '角へ',
          ko: '구석으로',
        },
      },
    },
    {
      id: 'O10N Earth Shaker',
      type: 'HeadMarker',
      netRegex: { id: '0028' },
      condition: Conditions.targetIsYou(),
      response: Responses.earthshaker(),
    },
    {
      id: 'O10N Akh Morn',
      type: 'HeadMarker',
      // This corresponds with 316C ability cast (for initial hit).
      netRegex: { id: '003E' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'O10N Thunderstorm',
      type: 'HeadMarker',
      // This corresponds with the 31D2 ability cast.
      netRegex: { id: '00A0' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'O10N Dry Ice',
      type: 'HeadMarker',
      netRegex: { id: '0043' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Drop Ice Outside',
          ja: 'Drop Ice Outside',
          ko: '얼음! 바깥쪽에 버려요',
        },
      },
    },
    {
      id: 'O10N Tail End',
      type: 'StartsUsing',
      netRegex: { id: '31C5', source: 'Midgardsormr' },
      response: Responses.tankBuster(),
    },
    {
      id: 'O10N Rime Wreath',
      type: 'StartsUsing',
      netRegex: { id: '33EF', source: 'Ancient Dragon', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'O10N Akh Rhai',
      type: 'Ability',
      // Damage starts hitting ~2s after this ability.
      // Assuming that it locks in on cast and not on starts casting.
      // Technically this is only on DPS, but it's not targeted, so just tell everybody.
      netRegex: { id: '3622', source: 'Midgardsormr', capture: false },
      response: Responses.moveAway(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Ancient Dragon': 'antik(?:e|er|es|en) Drache',
        'Midgardsormr': 'Midgardsormr',
      },
      'replaceText': {
        '(?<!/)Out': 'Raus',
        '(?<!\\w)In(?!/)': 'Rein',
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Cauterize': 'Kauterisieren',
        'Corners': 'Ecken',
        'Dry Ice': 'Trockeneis',
        'Earth Shaker': 'Erdstoß',
        'Exaflare': 'Exaflare',
        'Flip': 'Rolle',
        'Frost Breath': 'Frostiger Atem',
        'Horrid Roar': 'Entsetzliches Brüllen',
        'In/Out': 'Rein/Raus',
        'Northern Cross': 'Kreuz des Nordens',
        'Protostar': 'Protostern',
        'Spin': 'Drehung',
        'Tail End': 'Schweifspitze',
        'Thunderstorm': 'Gewitter',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Ancient Dragon': 'dragon ancien',
        'Midgardsormr': 'Midgardsormr',
      },
      'replaceText': {
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Cauterize': 'Cautérisation',
        'Corners': 'Coins',
        'Dry Ice': 'Poussière glaçante',
        'Earth Shaker': 'Secousse',
        'Exaflare': 'ExaBrasier',
        'Flip(?!/)': 'Tour vertical',
        'Flip/Spin': 'Tour vertical/horizontal',
        'Frost Breath': 'Souffle glacé',
        'Horrid Roar': 'Rugissement horrible',
        '(?<!\\w)In(?!\\w)': 'Intérieur',
        'Northern Cross': 'Croix du nord',
        '(?<!\\w)Out(?!\\w)': 'Extérieur',
        'Protostar': 'Proto-étoile',
        'ready': 'prêt',
        '(?<!/)Spin': 'Tour horizontal',
        'Tail End': 'Pointe de queue',
        'Thunderstorm': 'Tempête de foudre',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Ancient Dragon': 'エンシェントドラゴン',
        'Midgardsormr': 'ミドガルズオルム',
      },
      'replaceText': {
        '(?<!/)Out': '外',
        '(?<!\\w)In(?!/)': '中',
        'Akh Morn': 'アク・モーン',
        'Akh Rhai': 'アク・ラーイ',
        'Cauterize': 'カータライズ',
        'Corners': '角',
        'Dry Ice': 'フリージングダスト',
        'Earth Shaker': 'アースシェイカー',
        'Exaflare': 'エクサフレア',
        'Flip': '回転',
        'Frost Breath': 'フロストブレス',
        'Horrid Roar': 'ホリッドロア',
        'In/Out': '中/外',
        'Northern Cross': 'ノーザンクロス',
        'Protostar': 'プロトスター',
        'Spin': 'ぶん回す',
        'Tail End': 'テイルエンド',
        'Thunderstorm': 'サンダーストーム',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Ancient Dragon': '远古之龙',
        'Midgardsormr': '尘世幻龙',
      },
      'replaceText': {
        'ready': '准备',
        'Akh Morn': '死亡轮回',
        'Akh Rhai': '天光轮回',
        'Cauterize': '低温俯冲',
        'Corners': '角',
        'Dry Ice': '冰尘',
        'Earth Shaker': '大地摇动',
        'Exaflare': '百京核爆',
        'Flip': '竖转',
        'Frost Breath': '寒霜吐息',
        'Horrid Roar': '恐惧咆哮',
        '(?<!\\w)In(?!/)': '靠近',
        'In/Out': '靠近/远离',
        '(?<!/)Out': '远离',
        'Northern Cross': '北十字星',
        'Protostar': '原恒星',
        'Spin': '横转',
        'Tail End': '煞尾',
        'Thunderstorm': '雷暴',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Ancient Dragon': '遠古之龍',
        'Midgardsormr': '幻龍米德加爾特',
      },
      'replaceText': {
        'ready': '準備',
        'Akh Morn': '死亡輪迴',
        'Akh Rhai': '天光輪迴',
        'Cauterize': '灼熱俯衝',
        'Corners': '角落',
        'Dry Ice': '冰塵',
        'Earth Shaker': '大地搖動',
        'Exaflare': '百京火光',
        'Flip': '垂直轉',
        'Frost Breath': '寒霜吐息',
        'Horrid Roar': '恐懼咆哮',
        '(?<!\\w)In(?!/)': '靠近',
        'In/Out': '靠近/遠離',
        '(?<!/)Out': '遠離',
        'Northern Cross': '北十字星',
        'Protostar': '原恆星',
        'Spin': '橫轉',
        'Tail End': '煞尾',
        'Thunderstorm': '雷暴',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Ancient Dragon': '고룡',
        'Midgardsormr': '미드가르드오름',
      },
      'replaceText': {
        'Out': '밖으로',
        '(?<!Sp)In': '안으로',
        'Flip': '미드가르드오름 앞구르기',
        'Corners': '모서리',
        'Akh Morn': '아크 몬',
        'Akh Rhai': '아크 라이',
        'Cauterize': '인두질',
        'Dry Ice': '지면 동결',
        'Earth Shaker': '요동치는 대지',
        'Exaflare': '엑사플레어',
        'Frost Breath': '서리 숨결',
        'Horrid Roar': '소름끼치는 포효',
        'Northern Cross': '북십자성',
        'Protostar': '원시별',
        'Spin': '회전',
        'Tail End': '꼬리 쓸기',
        'Thunderstorm': '번개 폭풍',
      },
    },
  ],
};

export default triggerSet;
