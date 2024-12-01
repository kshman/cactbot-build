import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO:
//   - Callout for Battery Circuit (rotating cleave + exploding circles)?
//   - Callout for Zander's Soulbane Saber (line cleave + expanding aoe)?
//   - Quadrant (directional) call for Zander's Foreguard/Rearguard?

export interface Data extends RaidbossData {
  seenFirstRush: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'Vanguard',
  zoneId: ZoneId.Vanguard,
  timelineFile: 'vanguard.txt',
  initData: () => ({
    seenFirstRush: false,
  }),
  triggers: [
    // ** Vanguard Commander R8 ** //
    {
      id: 'Vanguard VC-R8 Electrowave',
      type: 'StartsUsing',
      netRegex: { id: '8EDB', source: 'Vanguard Commander R8', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Vanguard VC-R8 Enhanced Mobility Inside',
      type: 'StartsUsing',
      // 8ECF - clockwise, blade right
      // 98E5 - counterclock, blade left
      netRegex: { id: ['8ECF', '98E5'], source: 'Vanguard Commander R8', capture: false },
      durationSeconds: 11,
      infoText: (_data, _matches, output) => output.corners!(),
      outputStrings: {
        corners: {
          en: 'Go outside (corners)',
          ko: '바깥으로 (모서리)',
        },
      },
    },
    {
      id: 'Vanguard VC-R8 Enhanced Mobility Outside',
      type: 'StartsUsing',
      // 8ED0 - counterclock, blade right
      // 98E4 - clockwise, blade left
      netRegex: { id: ['8ED0', '98E4'], source: 'Vanguard Commander R8', capture: false },
      durationSeconds: 11,
      infoText: (_data, _matches, output) => output.inside!(),
      outputStrings: {
        inside: {
          en: 'Go inside',
          ko: '안으로',
        },
      },
    },
    {
      id: 'Vanguard VC-R8 Rush',
      type: 'StartsUsing',
      netRegex: { id: '8ED9', source: 'Vanguard Sentry R8', capture: false },
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (data, _matches, output) =>
        data.seenFirstRush ? output.grid!() : output.northSouth!(),
      run: (data) => data.seenFirstRush = true,
      outputStrings: {
        northSouth: {
          en: 'Dodge North/South line cleaves',
          ko: '남북 쪼개기 줄 피해요',
        },
        grid: {
          en: 'Spread + dodge grid cleaves',
          ko: '흩어졌다 🔜 격자 쪼개기 피해요',
        },
      },
    },

    // ** Protector ** //
    {
      id: 'Vanguard Protector Electrowave',
      type: 'StartsUsing',
      netRegex: { id: '9129', source: 'Protector', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Vanguard Protector Rapid Thunder',
      type: 'StartsUsing',
      netRegex: { id: '912A', source: 'Protector' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Vanguard Protector Acceleration Bomb',
      type: 'GainsEffect',
      netRegex: { effectId: 'EDA' },
      condition: Conditions.targetIsYou(),
      // 15s duration - countdown ends at 14s for safety (game lag)
      delaySeconds: 10,
      durationSeconds: 5,
      countdownSeconds: 14, // with 10s delay, countdown will not appear until 4s remaining
      response: Responses.stopMoving(),
    },
    {
      id: 'Vanguard Protector Tracking Bolt',
      type: 'StartsUsing',
      netRegex: { id: '91E4', source: 'Protector', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'Vanguard Protector Heavy Blast Cannon',
      type: 'StartsUsing',
      netRegex: { id: '91E1', source: 'Protector' },
      response: Responses.stackMarkerOn(),
    },

    // ** Zander the Snakeskinner ** //
    {
      id: 'Vanguard Zander Electrothermia',
      type: 'StartsUsing',
      netRegex: { id: '8EF2', source: 'Zander the Snakeskinner', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Vanguard Zander Saber Rush',
      type: 'StartsUsing',
      netRegex: { id: '8EF3', source: 'Zander the Snakeskinner' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Vanguard Zander Soulbane Shock',
      type: 'StartsUsing',
      netRegex: { id: '9422', source: 'Zander the Snakeskinner' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Vanguard Zander Shade Shot',
      type: 'StartsUsing',
      netRegex: { id: '8EF5', source: 'Zander the Snakeskinner' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Vanguard Zander Screech',
      type: 'StartsUsing',
      netRegex: { id: '8EF4', source: 'Zander the Snakeskinner', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Vanguard Zander Slitherbane Foreguard',
      type: 'StartsUsing',
      netRegex: { id: '8EED', source: 'Zander the Snakeskinner', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Vanguard Zander Slitherbane Rearguard',
      type: 'StartsUsing',
      netRegex: { id: '8EEE', source: 'Zander the Snakeskinner', capture: false },
      response: Responses.goFront('alert'),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Slitherbane Foreguard/Slitherbane Rearguard': 'Foreguard / Rearguard',
        'Tracking Bolt/Heavy Blast Cannon': '(spread/stack)',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Protector': 'Protektor',
        'Vanguard Commander R8': 'Außenposten-Kommandant R8',
        'Vanguard Sentry R8': 'Außenposten-Einheit R8',
        'Zander the Snakeskinner': 'Zander Schlangenhäuter',
      },
      'replaceText': {
        '\\(corners\\)': '(Ecken)',
        '\\(ground AoEs\\)': '(Boden AoEs)',
        '\\(sides\\)': '(Seiten)',
        '(?<! )Rush': 'Stürmen',
        'Aerial Offensive': 'Luftangriff',
        'Battery Circuit': 'Kreisel-Strahlenkanone',
        '(?<! )Blast Cannon': 'Strahlenkanone',
        'Bombardment': 'Bombardement',
        'Burst': 'Explosion',
        'Dispatch': 'Aussenden',
        'Electrosurge': 'Elektroschwall',
        'Electrothermia': 'Elektrothermia',
        'Electrowave': 'Elektrowelle',
        'Electrowhirl': 'Elektrostrudel',
        'Enhanced Mobility': 'Schnellstart',
        'Fulminous Fence': 'Elektrobarriere',
        'Heavy Blast Cannon': 'Schwere Strahlenkanone',
        'Motion Sensor': 'Bewegungssensor',
        'Rapid Rotary': 'Rapiddrehung',
        'Rapid Thunder': 'Donnerregen',
        'Saber Rush': 'Schnittsturm',
        'Screech': 'Kreischen',
        'Search and Destroy': 'Suchen und Zerstören',
        'Shade Shot': 'Finsterstoß',
        'Slitherbane Foreguard': 'Frontschwanzhieb',
        'Slitherbane Rearguard': 'Rückschwanzhieb',
        'Soulbane Saber': 'Verfluchte Seelenschneide',
        'Soulbane Shock': 'Verfluchter Seelenschock',
        'Syntheslean': 'Synthetstoß',
        'Syntheslither': 'Synthetschlag',
        'Tracking Bolt': 'Verfolgungssblitz',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Protector': 'Protecteur',
        'Vanguard Commander R8': 'commandant de L\'Avant-garde R8',
        'Vanguard Sentry R8': 'sentinelle de L\'Avant-garde R8',
        'Zander the Snakeskinner': 'Zander le constricteur',
      },
      'replaceText': {
        '(?<! )Rush': 'Ruée',
        'Aerial Offensive': 'Attaque aérienne',
        'Battery Circuit': 'Fulgurocanon rotatif',
        '(?<! )Blast Cannon': 'Fulgurocanon',
        'Bombardment': 'Bombardement',
        'Burst': 'Explosion',
        'Dispatch': 'Déploiement',
        'Electrosurge': 'Électrotir',
        'Electrothermia': 'Électrothermie',
        'Electrowave': 'Électrovague',
        'Electrowhirl': 'Électrotourbillon',
        'Enhanced Mobility': 'Déplacement rapide',
        'Fulminous Fence': 'barrière de brouillage',
        'Heavy Blast Cannon': 'Méga Fulgurocanon',
        'Motion Sensor': 'Tir de bombe accélératrice',
        'Rapid Rotary': 'Virage rapide',
        'Rapid Thunder': 'Foudre rapide',
        'Saber Rush': 'Sabrage rapide',
        'Screech': 'Cri reptilien',
        'Search and Destroy': 'Système de détection',
        'Shade Shot': 'Tir d\'ombre',
        'Slitherbane Foreguard': 'Sabrage caudal avant',
        'Slitherbane Rearguard': 'Sabrage caudal arrière',
        'Soulbane Saber': 'Sabre de souffrance',
        'Soulbane Shock': 'Choc de souffrance',
        'Syntheslean': 'Serpentotranchage',
        'Syntheslither': 'Serpentosabrage',
        'Tracking Bolt': 'Foudre traqueuse',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Protector': 'プロテクター',
        'Vanguard Commander R8': 'ヴァンガード・コマンダーR8',
        'Vanguard Sentry R8': 'ヴァンガード・セントリーR8',
        'Zander the Snakeskinner': '蟒蛇のザンダー',
      },
      'replaceText': {
        '(?<! )Rush': '突進',
        'Aerial Offensive': '空襲',
        'Battery Circuit': 'ターニングブラスターキャノン',
        '(?<! )Blast Cannon': 'ブラスターキャノン',
        'Bombardment': '爆撃',
        'Burst': '爆発',
        'Dispatch': '小隊招集',
        'Electrosurge': 'エレクトロショット',
        'Electrothermia': 'エレクトロサーミア',
        'Electrowave': 'エレクトロウェーブ',
        'Electrowhirl': 'エレクトロワール',
        'Enhanced Mobility': '高速機動',
        'Fulminous Fence': 'ジャマーフェンス',
        'Heavy Blast Cannon': 'ハイブラスターキャノン',
        'Motion Sensor': '加速度爆弾付与',
        'Rapid Rotary': '高速旋回',
        'Rapid Thunder': 'ラピッドサンダー',
        'Saber Rush': 'セイバーラッシュ',
        'Screech': '叫声',
        'Search and Destroy': '検知照射',
        'Shade Shot': 'シェイドショット',
        'Slitherbane Foreguard': 'フロントテイル・セイバー',
        'Slitherbane Rearguard': 'バックテイル・セイバー',
        'Soulbane Saber': 'ベインセイバー',
        'Soulbane Shock': 'ベインショック',
        'Syntheslean': 'シンセスレイン',
        'Syntheslither': 'シンセスリザー',
        'Tracking Bolt': 'トラッキングサンダー',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Protector': '保护者',
        'Vanguard Commander R8': '先锋营指挥官R8',
        'Vanguard Sentry R8': '先锋营哨兵R8',
        'Zander the Snakeskinner': '蟒蛇将 詹德',
      },
      'replaceText': {
        '\\(corners\\)': '(四角)',
        '\\(ground AoEs\\)': '(地面 AoE)',
        '\\(sides\\)': '(四边)',
        '(?<! )Rush': '突进',
        'Aerial Offensive': '空袭',
        'Battery Circuit': '旋回式冲击炮',
        '(?<! )Blast Cannon': '冲击炮',
        'Bombardment': '轰炸',
        'Burst': '爆炸',
        'Dispatch': '召集小队',
        'Electrosurge': '雷转质激射',
        'Electrothermia': '雷转质升温',
        'Electrowave': '雷转质波动',
        'Electrowhirl': '雷转质回旋',
        'Enhanced Mobility': '高速机动',
        'Fulminous Fence': '拦截电网',
        'Heavy Blast Cannon': '重击式冲击炮',
        'Motion Sensor': '赋予加速度炸弹',
        'Rapid Rotary': '高速回旋',
        'Rapid Thunder': '湍雷',
        'Saber Rush': '利剑斩',
        'Screech': '嘶嚎',
        'Search and Destroy': '照射检测',
        'Shade Shot': '暗影弹',
        'Slitherbane Foreguard': '前尾祸剑击',
        'Slitherbane Rearguard': '后尾祸剑击',
        'Soulbane Saber': '祸魂剑',
        'Soulbane Shock': '祸魂冲击',
        'Syntheslean': '融魂前倾斩',
        'Syntheslither': '曲蛇融魂斩',
        'Tracking Bolt': '追踪式闪雷',
      },
    },
  ],
};

export default triggerSet;
