import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

// MapEffect slots 01 - 08 are for the four towers.
// MapEffect slot 09 is something to do with the referee, not important

// Including headmarker data for savage reference
const headMarkerData = {
  // Vfx Path: com_share3t
  stack: 'A1',
  // Vfx Path: d1004turning_right_c0p
  rotateClockwise: 'A7',
  // Vfx Path: d1004turning_left_c0p
  rotateCounterClockwise: 'A8',
  // Vfx Path: m0676trg_tw_d0t1p
  dualTankbuster: '103',
} as const;
console.assert(headMarkerData);

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM3',
  zoneId: ZoneId.AacLightHeavyweightM3,
  timelineFile: 'r3n.txt',
  triggers: [
    {
      id: 'R3N Brutal Burn',
      type: 'StartsUsing',
      netRegex: { id: '9429', source: 'Brute Bomber', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R3N Brutal Impact',
      type: 'StartsUsing',
      netRegex: { id: '93D6', source: 'Brute Bomber', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R3N Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: { id: '93D5', source: 'Brute Bomber', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R3N Brutal Lariat 9AD4',
      type: 'StartsUsing',
      netRegex: { id: '9AD4', source: 'Brute Bomber', capture: false },
      response: Responses.goEast(),
    },
    {
      id: 'R3N Brutal Lariat 9AD5',
      type: 'StartsUsing',
      netRegex: { id: '9AD5', source: 'Brute Bomber', capture: false },
      response: Responses.goWest(),
    },
    {
      id: 'R3N Murderous Mist',
      type: 'StartsUsing',
      netRegex: { id: '93B5', source: 'Brute Bomber', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'R3N Barbarous Barrage',
      type: 'StartsUsing',
      netRegex: { id: '93B2', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback Towers',
          ja: 'ノックバック 塔',
          ko: '타워 넉백',
        },
      },
    },
    {
      id: 'R3N Fire Spin Clockwise',
      type: 'StartsUsing',
      netRegex: { id: '93D0', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.clockwise,
      },
    },
    {
      id: 'R3N Fire Spin Counterclockwise',
      type: 'StartsUsing',
      netRegex: { id: '93D1', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.counterclockwise,
      },
    },
    {
      id: 'R3N Fuses of Fury',
      type: 'StartsUsing',
      netRegex: { id: '93B6', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Long => Short',
          ja: '導火線の長い方 => 短い方',
          ko: '긴거 🔜 짧은거',
        },
      },
    },
    {
      id: 'R3N Lariat Combo East to West',
      type: 'StartsUsing',
      netRegex: { id: '9ADC', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East, then West',
          ja: '東、そして西',
          ko: '동쪽갔다, 서쪽으로',
        },
      },
    },
    {
      id: 'R3N Lariat Combo East to East',
      type: 'StartsUsing',
      netRegex: { id: '9ADD', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East, stay East',
          ja: '東にそのまま',
          ko: '동쪽가서, 그대로',
        },
      },
    },
    {
      id: 'R3N Lariat Combo West to East',
      type: 'StartsUsing',
      netRegex: { id: '9ADE', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West, then East',
          ja: '西、そして東',
          ko: '서쪽갔다, 동쪽으로',
        },
      },
    },
    {
      id: 'R3N Lariat Combo West to West',
      type: 'StartsUsing',
      netRegex: { id: '9ADF', source: 'Brute Bomber', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West, stay West',
          ja: '西にそのまま',
          ko: '서쪽가서, 그대로',
        },
      },
    },
    {
      id: 'R3N Infernal Spin Clockwise',
      type: 'StartsUsing',
      netRegex: { id: '9B42', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.clockwise,
      },
    },
    {
      id: 'R3N Infernal Spin Counterclockwise',
      type: 'StartsUsing',
      netRegex: { id: '9B43', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.counterclockwise,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Brute Bomber': 'Brutalo Bomber',
        'Lit Fuse': 'Zündschnurbombe',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(cones\\)': '(kegel)',
        '\\(damage\\)': '(Schaden)',
        '\\(long\\)': '(lange)',
        '\\(short\\)': '(kurz)',
        'Barbarous Barrage': 'Brutalo-Bomben',
        'Brutal Burn': 'Brutalo-Feuer',
        'Brutal Impact': 'Knallender Impakt',
        'Brutal Lariat': 'Brutalo-Lariat',
        'Doping Draught': 'Aufputschen',
        'Explosion': 'Explosion',
        'Explosive Rain': 'Bombenregen',
        'Fire Spin': 'Feuertornado',
        'Fuses of Fury': 'Zündschnurbomben',
        'Infernal Spin': 'Ultimativer Feuertornado',
        'Knuckle Sandwich': 'Knöchelschlag',
        'Lariat Combo': 'Lariat-Kombination',
        'Murderous Mist': 'Grüner Nebel',
        'Self-destruct': 'Selbstzerstörung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Brute Bomber': 'Brute Bomber',
        'Lit Fuse': 'bombo à mèche',
      },
      'replaceText': {
        '\\(cast\\)': '(Incantation)',
        '\\(cones\\)': '(Cônes)',
        '\\(damage\\)': '(Dommages)',
        '\\(long\\)': '(Long)',
        '\\(short\\)': '(Court)',
        'Barbarous Barrage': 'Bombardement brutal',
        'Brutal Burn': 'Brûlure brutale',
        'Brutal Impact': 'Impact brutal',
        'Brutal Lariat': 'Lariat brutal',
        'Doping Draught': 'Dopage',
        'Explosion': 'Explosion',
        'Explosive Rain': 'Pluie explosive',
        'Fire Spin': 'Toupie enflammée',
        'Fuses of Fury': 'Bombos à mèche',
        'Infernal Spin': 'Toupie infernale',
        'Knuckle Sandwich': 'Sandwich de poings',
        'Lariat Combo': 'Combo de lariats',
        'Murderous Mist': 'Vapeur venimeuse',
        'Self-destruct': 'Auto-destruction',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Brute Bomber': 'ブルートボンバー',
        'Lit Fuse': 'フューズボム',
      },
      'replaceText': {
        'Barbarous Barrage': 'ボンバリアンボム',
        'Brutal Burn': 'ブルートファイヤー',
        'Brutal Impact': 'スマッシュインパクト',
        'Brutal Lariat': 'ブルートラリアット',
        'Doping Draught': 'ドーピング',
        'Explosion': '爆発',
        'Explosive Rain': 'ボムレイン',
        'Fire Spin': 'スピニングファイヤー',
        'Fuses of Fury': 'フューズボム',
        'Infernal Spin': '極盛り式スピニングファイヤー',
        'Knuckle Sandwich': 'ナックルパート',
        'Lariat Combo': 'ラリアットコンビネーション',
        'Murderous Mist': 'グリーンミスト',
        'Self-destruct': '自爆',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Brute Bomber': '野蛮爆弹',
        'Lit Fuse': '引线爆弹怪',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(cones\\)': '(锥形)',
        '\\(damage\\)': '(伤害)',
        '\\(long\\)': '(长)',
        '\\(short\\)': '(短)',
        'Barbarous Barrage': '野蛮爆炸',
        'Brutal Burn': '野蛮灼烧',
        'Brutal Impact': '野蛮碎击',
        'Brutal Lariat': '野蛮碎颈臂',
        'Doping Draught': '打药',
        'Explosion': '爆炸',
        'Explosive Rain': '爆弹雨',
        'Fire Spin': '野蛮旋火',
        'Fuses of Fury': '引线爆弹',
        'Infernal Spin': '超华丽野蛮旋火',
        'Knuckle Sandwich': '拳面猛击',
        'Lariat Combo': '碎颈臂连击',
        'Murderous Mist': '致命毒雾',
        'Self-destruct': '自爆',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        // 'Brute Bomber': '', // FIXME '野蛮爆弹'
        // 'Lit Fuse': '', // FIXME '引线爆弹怪'
      },
      'replaceText': {
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        // '\\(cones\\)': '', // FIXME '(锥形)'
        // '\\(damage\\)': '', // FIXME '(伤害)'
        // '\\(long\\)': '', // FIXME '(长)'
        // '\\(short\\)': '', // FIXME '(短)'
        // 'Barbarous Barrage': '', // FIXME '野蛮爆炸'
        // 'Brutal Burn': '', // FIXME '野蛮灼烧'
        'Brutal Impact': '野蠻碎擊',
        // 'Brutal Lariat': '', // FIXME '野蛮碎颈臂'
        // 'Doping Draught': '', // FIXME '打药'
        'Explosion': '爆炸',
        // 'Explosive Rain': '', // FIXME '爆弹雨'
        // 'Fire Spin': '', // FIXME '野蛮旋火'
        // 'Fuses of Fury': '', // FIXME '引线爆弹'
        // 'Infernal Spin': '', // FIXME '超华丽野蛮旋火'
        // 'Knuckle Sandwich': '', // FIXME '拳面猛击'
        // 'Lariat Combo': '', // FIXME '碎颈臂连击'
        // 'Murderous Mist': '', // FIXME '致命毒雾'
        'Self-destruct': '自爆',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Brute Bomber': '브루트 봄버',
        'Lit Fuse': '불붙은 봄',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(cones\\)': '(장판)',
        '\\(damage\\)': '(피해)',
        '\\(long\\)': '(긴)',
        '\\(short\\)': '(짧은)',
        'Barbarous Barrage': '봄버리안 봄',
        'Brutal Burn': '비열한 화염',
        'Brutal Impact': '비열한 내리치기',
        'Brutal Lariat': '비열한 후려갈기기',
        'Doping Draught': '도핑',
        'Explosion': '폭발',
        'Explosive Rain': '봄 세례',
        'Fire Spin': '회전 불 뿜기',
        'Fuses of Fury': '불붙은 봄',
        'Infernal Spin': '회전 지옥불 뿜기',
        'Knuckle Sandwich': '비열한 주먹질',
        'Lariat Combo': '연속 후려갈기기',
        'Murderous Mist': '녹색 안개',
        'Self-destruct': '자폭',
      },
    },
  ],
};

export default triggerSet;
