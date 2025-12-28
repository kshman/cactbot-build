import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  seenMistRune?: boolean;
  seenFlameRune?: boolean;
  pummelCount?: number;
  bomb?: { [name: string]: boolean };
  thunderCount?: number;
}

// Titania Extreme
const triggerSet: TriggerSet<Data> = {
  id: 'TheDancingPlagueExtreme',
  zoneId: ZoneId.TheDancingPlagueExtreme,
  timelineFile: 'titania-ex.txt',
  triggers: [
    {
      id: 'TitaniaEx Bright Sabbath',
      type: 'StartsUsing',
      netRegex: { id: '3D4B', source: 'Titania', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'TitaniaEx Phantom Out',
      type: 'StartsUsing',
      netRegex: { id: '3D4C', source: 'Titania', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'TitaniaEx Phantom In',
      type: 'StartsUsing',
      netRegex: { id: '3D4D', source: 'Titania', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'TitaniaEx Mist Failure',
      type: 'AddedCombatant',
      netRegex: { name: 'Spirit Of Dew', capture: false },
      suppressSeconds: 3,
      response: Responses.killExtraAdd(),
    },
    {
      id: 'TitaniaEx Mist',
      type: 'StartsUsing',
      netRegex: { id: '3D45', source: 'Titania', capture: false },
      infoText: (data, _matches, output) => {
        if (data.seenMistRune)
          return output.inOutThenWaterPositions!();

        return output.waterPositions!();
      },
      run: (data) => data.seenMistRune = true,
      outputStrings: {
        inOutThenWaterPositions: {
          en: 'In/Out, then Water Positions',
          ja: '中/外避けてポジションへ',
          ko: '안밖 🔜 물 타워로',
        },
        waterPositions: {
          en: 'Water Positions',
          ja: 'ポジションへ',
          ko: '물 타워',
        },
      },
    },
    {
      id: 'TitaniaEx Flame',
      type: 'StartsUsing',
      netRegex: { id: '3D47', source: 'Titania', capture: false },
      // You have 16.5 seconds until the first stack damage.
      delaySeconds: 8.5,
      alertText: (data, _matches, output) => {
        if (data.seenFlameRune)
          return output.stackMaybeRotate!();

        return output.stackPositions!();
      },
      run: (data) => data.seenFlameRune = true,
      outputStrings: {
        stackMaybeRotate: {
          en: 'Stack (maybe rotate?)',
          ja: '集合 (多分時計回り?)',
          ko: '뭉쳐요 (아마 돌아야하나?)',
        },
        stackPositions: {
          en: 'Stack Positions',
          ja: '頭割り集合',
          ko: '뭉쳐요',
        },
      },
    },
    {
      id: 'TitaniaEx Divination',
      type: 'StartsUsing',
      netRegex: { id: '3D4A', source: 'Titania' },
      response: Responses.tankCleave(),
    },
    {
      id: 'TitaniaEx Bramble 1',
      type: 'StartsUsing',
      netRegex: { id: '42D7', source: 'Titania', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Wait For Tethers In Center',
          ja: '中央で待機',
          ko: '한가운데서 줄 기다려요',
        },
      },
    },
    {
      id: 'TitaniaEx Bramble 2',
      type: 'Tether',
      netRegex: { id: '0012' },
      alertText: (data, matches, output) => {
        const partner = matches.target === data.me ? matches.source : matches.target;
        return output.breakTether!({ player: data.party.member(partner) });
      },
      outputStrings: {
        breakTether: {
          en: 'Break Tether (w/${player})',
          ja: 'Break Tether (w/${player})',
          ko: '줄 끊어요 (${player})',
        },
      },
    },
    {
      id: 'TitaniaEx Bramble Knockback',
      type: 'Ability',
      netRegex: { id: '3D42', source: 'Puck', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Diagonal Knockback Soon',
          ja: '対角に飛ぶ',
          ko: '곧 비스듬히 넉백',
        },
      },
    },
    {
      id: 'TitaniaEx Fae Light',
      type: 'StartsUsing',
      netRegex: { id: '3D2C', source: 'Titania' },
      response: Responses.tankBuster(),
    },
    {
      id: 'TitaniaEx Fae Light Cleave',
      type: 'StartsUsing',
      netRegex: { id: '3D2C', source: 'Titania' },
      condition: (data) => data.role !== 'tank' && data.role !== 'healer',
      response: Responses.tankCleave(),
    },
    {
      id: 'TitaniaEx Frost Rune 1',
      type: 'StartsUsing',
      netRegex: { id: '3D2A', source: 'Titania', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Middle, Shiva Circles',
          ja: 'シヴァの輪っか',
          ko: '시바 얼음 장판',
        },
      },
    },
    {
      id: 'TitaniaEx Frost Rune 2',
      type: 'StartsUsing',
      netRegex: { id: '3D2A', source: 'Titania', capture: false },
      delaySeconds: 6.5,
      response: Responses.getOut('info'),
    },
    {
      id: 'TitaniaEx Frost Rune 3',
      type: 'Ability',
      netRegex: { id: '3D2B', source: 'Titania', capture: false },
      suppressSeconds: 60,
      response: Responses.getIn('info'),
    },
    {
      id: 'TitaniaEx Growth Rune',
      type: 'StartsUsing',
      netRegex: { id: '3D2E', source: 'Titania', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Roots',
          ja: '根のルーン',
          ko: '뿌리 나와요',
        },
      },
    },
    {
      id: 'TitaniaEx Uplift Markers',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'TitaniaEx Hard Swipe',
      type: 'StartsUsing',
      netRegex: { id: '3D36', source: 'Peaseblossom' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster('info'),
    },
    {
      id: 'TitaniaEx Pummel',
      type: 'StartsUsing',
      netRegex: { id: '3D37', source: 'Puck', capture: false },
      condition: (data) => data.role === 'tank' || data.job === 'BLU',
      preRun: (data) => {
        data.pummelCount ??= 0;
        data.pummelCount++;
      },
      infoText: (data, _matches, output) => output.text!({ num: data.pummelCount }),
      outputStrings: {
        text: {
          en: 'Pummel ${num}',
          ja: '殴打 ${num}',
          ko: '구타 ${num}',
        },
      },
    },
    {
      id: 'TitaniaEx Peasebomb',
      type: 'HeadMarker',
      netRegex: { id: '008D' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
      run: (data) => {
        data.bomb ??= {};
        data.bomb[data.me] = true;
      },
    },
    {
      id: 'TitaniaEx Peasebomb Use',
      type: 'Ability',
      netRegex: { id: '3D3F', source: 'Peaseblossom', capture: false },
      run: (data) => delete data.bomb,
    },
    {
      id: 'TitaniaEx Adds Stack',
      type: 'HeadMarker',
      netRegex: { id: '00A1' },
      delaySeconds: 0.25,
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.stackOnYou!();

        if (data.bomb && data.bomb[data.me])
          return;

        return output.stackOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOn: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'TitaniaEx Thunder Tether',
      type: 'Tether',
      netRegex: { id: '0054', source: 'Titania', capture: false },
      suppressSeconds: 60,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Initial Thunder Tether',
          ja: '線一人目',
          ko: '내게 첫 번개',
        },
      },
    },
    {
      id: 'TitaniaEx Thunder Rune',
      type: 'Ability',
      netRegex: { id: '3D29', source: 'Titania', capture: false },
      preRun: (data) => data.thunderCount = (data.thunderCount ?? 0) + 1,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => output.text!({ num: data.thunderCount }),
      outputStrings: {
        text: {
          en: 'Thunder ${num}',
          ja: '線${num}人目',
          ko: '${num}번째 번개',
        },
      },
    },
    {
      id: 'TitaniaEx Thunder Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '3D32', source: 'Titania', capture: false },
      run: (data) => delete data.thunderCount,
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Spirit of Flame': 'Feuerfee',
        'Spirit of Wood': 'Holzfee',
        'Spirit Of Dew': 'Wasserfee',
        'Titania': 'Titania',
        'Puck': 'Puck',
        'Peaseblossom': 'Bohnenblüte',
        'Mustardseed': 'Senfsamen',
      },
      'replaceText': {
        'Whispering Wind': 'Flüsternde Winde',
        'Wallop': 'Eindreschen',
        'Uplift': 'Feenring',
        'Thunder Rune': 'Donnerrune',
        'Pummel': 'Deftige Dachtel',
        'Puck\'s Rebuke': 'Pucks Tadel',
        'Puck\'s Caprice': 'Pucks Laune',
        'Puck\'s Breath': 'Pucks Atem',
        'Phantom Rune(?! )': 'Phantomrune',
        'Peasebomb': 'Bohnenbombe',
        '(?<! )Pease(?!\\w)': 'Bohne',
        'Mist Rune': 'Nebelrune',
        'Midsummer Night\'s Dream': 'Mittsommernachtstraum',
        'Leafstorm': 'Blättersturm',
        'Hard Swipe': 'Harter Hieb',
        'Growth Rune': 'Wachstumsrune',
        'Gentle Breeze': 'Sanfte Brise',
        'Frost Rune': 'Frostrune',
        'Flame Rune': 'Flammenrune',
        'Flame Hammer': 'Flammenhammer',
        'Fae Light': 'Feenlicht',
        'Divination Rune': 'Prophezeiungsrune',
        'Chain Of Brambles': 'Dornenfessel',
        'Bright Sabbath': 'Leuchtender Sabbat',
        'Being Mortal': 'Sterblichkeit',
        'Love-In-Idleness': 'Liebevoller Müßiggang',
        'War And Pease': 'Bohnenkrieg',
        'Phantom Rune In': 'Phantomrune Rein',
        'Phantom Rune Out': 'Phantomrune Raus',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Spirit Of Dew': 'Esprit Des Rosées',
        'spirit of flame': 'Esprit Des Flammes',
        'Spirit of Wood': 'Esprit Des Bois',
        'Titania': 'Titania',
        'Puck': 'Puck',
        'Peaseblossom': 'Fleur-de-pois',
        'Mustardseed': 'Pousse-de-moutarde',
      },
      'replaceText': {
        'Whispering Wind': 'Vent susurrant',
        'War And Pease': 'La fin des haricots',
        'Wallop': 'Rossée',
        'Uplift': 'Exhaussement',
        'Thunder Rune': 'Rune de foudre',
        'Pummel': 'Torgnole',
        'Puck\'s Rebuke': 'Réprimande de Puck',
        'Puck\'s Caprice': 'Toquade de Puck',
        'Puck\'s Breath': 'Haleine de Puck',
        'Phantom Rune(?! )': 'Rune d\'illusion',
        'Phantom Rune In': 'Rune d\'illusion intérieur',
        'Phantom Rune Out': 'Rune d\'illusion extérieur',
        'Peasebomb': 'Haricot explosif',
        '(?<! )Pease(?!\\w)': 'Explosion de haricot',
        'Mist Rune': 'Rune d\'eau',
        'Midsummer Night\'s Dream': 'Songe d\'une nuit d\'été',
        'Love-In-Idleness': 'Pensées sauvages',
        'Leafstorm': 'Tempête de feuilles',
        'Hard Swipe': 'Fauchage brutal',
        'Growth Rune': 'Rune de racine',
        'Gentle Breeze': 'Douce brise',
        'Frost Rune(?! )': 'Rune de gel',
        'Frost Rune Middle': 'Rune de gel au milieu',
        'Flame Rune': 'Rune de feu',
        'Flame Hammer': 'Marteau de feu',
        'Fae Light': 'Lueur féérique',
        'Divination Rune': 'Rune de malice',
        'Chain Of Brambles': 'Chaînes de ronces',
        'Bright Sabbath': 'Sabbat en plein jour',
        'Being Mortal': 'Deuil des vivants',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Spirit Of Dew': '水の精',
        'Spirit of Flame': '火の精',
        'Spirit of Wood': '木の精',
        'Titania': 'ティターニア',
        'Puck': 'パック',
        'Peaseblossom': 'ピーズブロッサム',
        'Mustardseed': 'マスタードシード',
      },
      'replaceText': {
        'Whispering Wind': 'ウィスパリング・ウィンド',
        'War And Pease': '大豆爆発',
        'Wallop': '叩きつけ',
        'Uplift': '隆起',
        'Thunder Rune': '雷のルーン',
        'Pummel': '殴打',
        'Puck\'s Rebuke': 'パックレビューク',
        'Puck\'s Caprice': 'パック・カプリース',
        'Puck\'s Breath': 'パック・ブレス',
        'Phantom Rune In': '幻のルーン（中央）',
        'Phantom Rune Out': '幻のルーン（外）',
        'Phantom Rune(?! )': '幻のルーン',
        'Peasebomb': 'ビーズボム',
        '(?<! )Pease(?!\\w)': '豆爆発',
        'Mist Rune': '水のルーン',
        'Midsummer Night\'s Dream': 'ミッドサマー・ナイツドリーム',
        'Love-In-Idleness': 'ラブ・イン・アイドルネス',
        'Leafstorm': 'リーフストーム',
        'Hard Swipe': 'ハードスワイプ',
        'Growth Rune': '根のルーン',
        'Gentle Breeze': '上風',
        'Frost Rune': '氷のルーン',
        'Flame Rune': '火のルーン',
        'Flame Hammer': 'フレイムハンマー',
        'Fae Light': '妖精光',
        'Divination Rune': '魔のルーン',
        'Chain Of Brambles': 'ブランブルチェーン',
        'Bright Sabbath': 'ブライトサバト',
        'Being Mortal': '死すべき定め',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Spirit Of Dew': '水精',
        'Spirit of Flame': '炎精',
        'Spirit of Wood': '木精',
        'Titania': '缇坦妮雅',
        'Puck': '帕克',
        'Peaseblossom': '豌豆花',
        'Mustardseed': '芥子',
      },
      'replaceText': {
        'Whispering Wind': '细语微风',
        'War And Pease': '豌豆大爆炸',
        'Wallop': '敲击',
        'Uplift': '隆起',
        'Thunder Rune': '雷之符文',
        'Pummel': '殴打',
        'Puck\'s Rebuke': '帕克的指责',
        'Puck\'s Caprice': '帕克的随想',
        'Puck\'s Breath': '帕克的吐息',
        'Phantom Rune In': '幻之符文 (靠近)',
        'Phantom Rune Out': '幻之符文 (远离)',
        'Phantom Rune(?! )': '幻之符文',
        'Peasebomb': '豌豆炸弹',
        '(?<! )Pease(?!\\w)': '豌豆爆炸',
        'Mist Rune': '水之符文',
        'Midsummer Night\'s Dream': '仲夏夜之梦',
        'Love-In-Idleness': '爱懒花',
        'Leafstorm': '绿叶风暴',
        'Hard Swipe': '强烈重击',
        'Growth Rune': '根之符文',
        'Gentle Breeze': '青翠柔风',
        'Frost Rune': '冰之符文',
        'Flame Rune': '火之符文',
        'Flame Hammer': '烈火锤',
        'Fae Light': '妖灵光',
        'Divination Rune': '魔之符文',
        'Chain Of Brambles': '荆棘链',
        'Bright Sabbath': '欢快的安息日',
        'Being Mortal': '终有一死',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Spirit Of Dew': '水精',
        'Spirit of Flame': '炎精',
        'Spirit of Wood': '木精',
        'Titania': '緹坦妮雅',
        'Puck': '派克',
        'Peaseblossom': '豌豆花',
        'Mustardseed': '芥子',
      },
      'replaceText': {
        'Whispering Wind': '細語微風',
        'War And Pease': '豌豆大爆炸',
        'Wallop': '打擊',
        'Uplift': '隆起',
        'Thunder Rune': '雷之符文',
        'Pummel': '毆打',
        'Puck\'s Rebuke': '派克的指責',
        'Puck\'s Caprice': '派克的隨想',
        'Puck\'s Breath': '派克的吐息',
        'Phantom Rune In': '幻之符文',
        'Phantom Rune Out': '幻之符文',
        'Phantom Rune(?! )': '幻之符文',
        'Peasebomb': '豌豆炸彈',
        '(?<! )Pease(?!\\w)': '豌豆爆炸',
        'Mist Rune': '水之符文',
        'Midsummer Night\'s Dream': '仲夏夜之夢',
        'Love-In-Idleness': '愛懶花',
        'Leafstorm': '綠葉風暴',
        'Hard Swipe': '強烈重擊',
        'Growth Rune': '根之符文',
        'Gentle Breeze': '青翠柔風',
        'Frost Rune': '冰之符文',
        'Flame Rune': '火之符文',
        'Flame Hammer': '烈火錘',
        'Fae Light': '妖精光',
        'Divination Rune': '魔之符文',
        'Chain Of Brambles': '荊棘鏈',
        'Bright Sabbath': '歡快的安息日',
        'Being Mortal': '終有一死',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Spirit Of Dew': '물의 정령',
        'Spirit of Flame': '불의 정령',
        'Spirit of Wood': '나무의 정령',
        'Titania': '티타니아',
        'Puck': '요정의 권속',
        'Peaseblossom': '콩나무',
        'Mustardseed': '겨자씨',
      },
      'replaceText': {
        'Whispering Wind': '속삭이는 바람',
        'War And Pease': '큰콩 폭발',
        'Wallop': '매질',
        'Uplift': '융기',
        'Thunder Rune': '번개의 룬',
        'Pummel': '구타',
        'Puck\'s Rebuke': '요정의 꾸지람',
        'Puck\'s Caprice': '요정의 변덕',
        'Puck\'s Breath': '요정의 숨결',
        'Phantom Rune(?! )': '환상의 룬',
        'Phantom Rune In': '환상의 룬 안으로',
        'Phantom Rune Out': '환상의 룬 밖으로',
        'Peasebomb': '콩폭탄',
        '(?<! )Pease(?!\\w)': '콩 폭발',
        'Mist Rune': '물의 룬',
        'Midsummer Night\'s Dream': '한여름 밤의 꿈',
        'Love-In-Idleness': '삼색제비꽃',
        'Leafstorm': '잎사귀 폭풍',
        'Hard Swipe': '강력한 후려치기',
        'Growth Rune': '뿌리의 룬',
        'Gentle Breeze': '윗바람',
        'Frost Rune': '얼음의 룬',
        'Flame Rune': '불의 룬',
        'Flame Hammer': '불꽃 망치',
        'Fae Light': '요정광',
        'Divination Rune': '마법의 룬',
        'Chain Of Brambles': '나무딸기 사슬',
        'Bright Sabbath': '빛나는 안식',
        'Being Mortal': '죽어야 할 운명',
        ' Middle': ' (중앙)',
      },
    },
  ],
};

export default triggerSet;
