import Conditions from '../../../../../resources/conditions';
// import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  phaseTracker: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM3Savage',
  zoneId: ZoneId.AacLightHeavyweightM3Savage,
  timelineFile: 'r3s.txt',
  initData: () => ({
    phaseTracker: 0,
  }),
  triggers: [
    {
      id: 'R3S Phase Tracker',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB6', capture: true },
      run: (data, matches) => data.phaseTracker = parseInt(matches.count, 16),
    },
    {
      id: 'R3S Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: { id: '9423', source: 'Brute Bomber' },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R3S Brutal Impact',
      type: 'StartsUsing',
      netRegex: { id: '9425', source: 'Brute Bomber', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R3S Octuple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93D8', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Spread',
          ko: '밖으로 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octuple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93D9', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Spread',
          ko: '안으로 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93DE', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away + Spread',
          ko: '멀리갔다 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93DF', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback + Spread',
          ko: '넉백 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Murderous Mist',
      type: 'StartsUsing',
      netRegex: { id: '93FE', source: 'Brute Bomber', capture: false },
      infoText: (data, _matches, output) => {
        if (data.phaseTracker > 0)
          return output.getHit!();
        return output.getBehind!();
      },
      outputStrings: {
        getBehind: {
          en: 'Get Behind',
          ko: '엉댕이로 넉백',
        },
        getHit: {
          en: 'Get hit by mist',
          ko: '안개에 맞아요',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93E0', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away + Partners',
          ko: '멀리갔다 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93E1', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback + Partners',
          ko: '넉백 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93DA', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Partners',
          ko: '밖으로 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93DB', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Partners',
          ko: '안으로 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Short Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB8', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Short Fuse',
          ko: '내게 짧은 도화선',
        },
      },
    },
    {
      id: 'R3S Long Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB9', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Long Fuse',
          ko: '내게 긴 도화선',
        },
      },
    },
    {
      id: 'R3S Fuse Field',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB4' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) < 30)
          return output.short!();
        return output.long!();
      },
      outputStrings: {
        short: {
          en: 'Short Fuse',
          ko: '내게 짧은 도화선',
        },
        long: {
          en: 'Long Fuse',
          ko: '내게 긴 도화선',
        },
      },
    },
    {
      id: 'R3S Octoboom Bombarian Special',
      type: 'StartsUsing',
      netRegex: { id: '9752', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out => In => Knockback => Spread',
          ko: '밖에서 🔜 안으로 🔜 넉백 🔜 흩어져요',
        },
      },
    },
    {
      id: 'R3S Quadroboom Bombarian Special',
      type: 'StartsUsing',
      netRegex: { id: '940A', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out => In => Knockback => Partners',
          ko: '밖에서 🔜 안으로 🔜 넉백 🔜 둘이 함께',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Brute Bomber': 'Brutalo Bomber',
        'Brute Distortion': 'Brutalo Bomber-Phantom',
        'Lit Fuse': 'Zündschnurbombe',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(enrage\\)': '(Finalangriff)',
        'Barbarous Barrage': 'Brutalo-Bomben',
        'Blazing Lariat': 'Flammende Lariat',
        'Bombarian Flame': 'Bomben-Feuer',
        '(?<! )Bombarian Special': 'Brutalo-Spezial',
        'Bombariboom': 'Brutalo-Schockwelle',
        'Brutal Impact': 'Knallender Impakt',
        'Chain Deathmatch': 'Ketten-Todeskampf',
        'Diveboom': 'Bombensturz',
        'Doping Draught': 'Aufputschen',
        'Explosion': 'Explosion',
        'Explosive Rain': 'Bombenregen',
        'Final Fusedown': 'Epische Zündschnurbomben',
        'Fuse or Foe': 'Klebrige Bombe',
        'Fusefield': 'Luntenfeld',
        'Fuses of Fury': 'Zündschnurbomben',
        'Infernal Spin': 'Ultimativer Feuertornado',
        'Knuckle Sandwich': 'Knöchelschlag',
        'Lariat Combo': 'Lariat-Kombination',
        'Murderous Mist': 'Grüner Nebel',
        'Octoboom Bombarian Special': 'Okto-Brutalo-Spezial',
        'Octoboom Dive': 'Okto-Bombensturz',
        'Octuple Lariat': 'Okto-Lariat',
        'Quadroboom Dive': 'Quattro-Bombensturz',
        'Quadruple Lariat': 'Quattro-Lariat',
        'Self-Destruct': 'Selbstzerstörung',
        'Special Bombarian Special': 'Ultimativer Brutalo-Spezial',
        'Tag Team': 'Wechselspiel',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Brute Bomber': 'Brute Bomber',
        'Brute Distortion': 'double de Brute Bomber',
        'Lit Fuse': 'bombo à mèche',
      },
      'replaceText': {
        'Barbarous Barrage': 'Bombardement brutal',
        'Blazing Lariat': 'Lariat embrasé',
        'Bombarian Flame': 'Feu brutal',
        '(?<! )Bombarian Special': 'Spéciale brutale',
        'Bombariboom': 'Onde de choc brutale',
        'Brutal Impact': 'Impact brutal',
        'Chain Deathmatch': 'Chaîne de la mort',
        'Diveboom': 'Explongeon',
        'Doping Draught': 'Dopage',
        'Explosion': 'Explosion',
        'Explosive Rain': 'Pluie explosive',
        'Final Fusedown': 'Bombos à méche sadiques',
        'Fuse or Foe': 'Fixation de bombo à mèche',
        'Fusefield': 'Champs de mèches',
        'Fuses of Fury': 'Bombos à mèche',
        'Infernal Spin': 'Toupie infernale',
        'Knuckle Sandwich': 'Sandwich de poings',
        'Lariat Combo': 'Combo de lariats',
        'Murderous Mist': 'Vapeur venimeuse',
        'Octoboom Bombarian Special': 'Octuple spéciale brutale',
        'Octoboom Dive': 'Octuple explongeon',
        'Octuple Lariat': 'Octuple lariat',
        'Quadroboom Dive': 'Quadruple explongeon',
        'Quadruple Lariat': 'Quadruple lariat',
        'Self-Destruct': 'Auto-destruction',
        'Special Bombarian Special': 'Spéciale brutale ultime',
        'Tag Team': 'Combat d\'équipe',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Brute Bomber': 'ブルートボンバー',
        'Brute Distortion': 'ブルートボンバーの幻影',
        'Lit Fuse': 'フューズボム',
      },
      'replaceText': {
        'Barbarous Barrage': 'ボンバリアンボム',
        'Blazing Lariat': 'ラリアット・ブレイザー',
        'Bombarian Flame': 'ボンバリアンファイヤー',
        '(?<! )Bombarian Special': 'ボンバリアンスペシャル',
        'Bombariboom': 'ボンバリアン・ショック',
        'Brutal Impact': 'スマッシュインパクト',
        'Chain Deathmatch': 'チェーンデスマッチ',
        'Diveboom': 'パワーダイブ・ショック',
        'Doping Draught': 'ドーピング',
        'Explosion': '爆発',
        'Explosive Rain': 'ボムレイン',
        'Final Fusedown': '零式フューズボム',
        'Fuse or Foe': 'アタッチ・フューズボム',
        'Fusefield': 'フューズフィールド',
        'Fuses of Fury': 'フューズボム',
        'Infernal Spin': '極盛り式スピニングファイヤー',
        'Knuckle Sandwich': 'ナックルパート',
        'Lariat Combo': 'ラリアットコンビネーション',
        'Murderous Mist': 'グリーンミスト',
        'Octoboom Bombarian Special': '8ショック・ボンバリアンスペシャル',
        'Octoboom Dive': '8ショック・パワーダイブ',
        'Octuple Lariat': '8ウェイ・ダブルラリアット',
        'Quadroboom Dive': '4ショック・パワーダイブ',
        'Quadruple Lariat': '4ウェイ・ダブルラリアット',
        'Self-Destruct': '自爆',
        'Special Bombarian Special': 'アルティメット・ボンバリアンスペシャル',
        'Tag Team': 'タッグマッチ',
      },
    },
  ],
};

export default triggerSet;
