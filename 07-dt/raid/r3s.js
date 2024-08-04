// import Outputs from '../../../../../resources/outputs';
// TODO: Lariat Combo during second KB towers?
// TODO: <foo>boom Special delayed in/out triggers?
Options.Triggers.push({
  id: 'AacLightHeavyweightM3Savage',
  zoneId: ZoneId.AacLightHeavyweightM3Savage,
  timelineFile: 'r3s.txt',
  initData: () => ({
    phaseTracker: 0,
    myFuse: undefined,
    fieldList: [],
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
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'AoE',
          ja: '連続全体攻撃',
          ko: '연속 전체 공격',
        },
      },
    },
    {
      id: 'R3S Octuple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93D8', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out + Spread',
          ja: '外側 + 散開',
          ko: '밖으로 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octuple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93D9', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In + Spread',
          ja: '内側 + 散開',
          ko: '안으로 + 흩어져요',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93DE', source: 'Brute Bomber', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away + Spread',
          ja: '離れて + 散開',
          ko: '멀리가서 + 흩어져요 (보스점프)',
        },
      },
    },
    {
      id: 'R3S Octoboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93DF', source: 'Brute Bomber', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback + Spread',
          ja: 'ノックバック + 散開',
          ko: '넉백 + 흩어져요 (보스점프)',
        },
      },
    },
    {
      id: 'R3S Murderous Mist',
      type: 'StartsUsing',
      netRegex: { id: '93FE', source: 'Brute Bomber', capture: false },
      infoText: (data, _matches, output) => {
        if (data.phaseTracker > 0)
          return output.getHit();
        return output.getBehind();
      },
      outputStrings: {
        getBehind: {
          en: 'Get Behind',
          ko: '엉댕이로 넉백',
        },
        getHit: {
          en: 'Get hit by mist',
          ja: 'ミストに当たって',
          ko: '안개에 맞아요',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Proximity',
      type: 'StartsUsing',
      netRegex: { id: '93E0', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away + Partners',
          ja: '離れて + ペア',
          ko: '멀리가서 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadroboom Dive Knockback',
      type: 'StartsUsing',
      netRegex: { id: '93E1', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback + Partners',
          ja: 'ノックバック + ペア',
          ko: '넉백 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat Out',
      type: 'StartsUsing',
      netRegex: { id: '93DA', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out + Partners',
          ja: '外側 + ペア',
          ko: '밖으로 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Quadruple Lariat In',
      type: 'StartsUsing',
      netRegex: { id: '93DB', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In + Partners',
          ja: '内側 + ペア',
          ko: '안으로 + 둘이 함께',
        },
      },
    },
    {
      id: 'R3S Octoboom Bombarian Special',
      type: 'StartsUsing',
      netRegex: { id: '9752', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out => In => Knockback => Spread',
          ja: '外側 => 内側 => ノックバック => 散開',
          ko: '밖에서 🔜 안으로 🔜 넉백 🔜 흩어져요',
        },
      },
    },
    {
      id: 'R3S Quadroboom Bombarian Special',
      type: 'StartsUsing',
      netRegex: { id: '940A', source: 'Brute Bomber', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out => In => Knockback => Partners',
          ja: '外側 => 内側 => ノックバック => ペア',
          ko: '밖에서 🔜 안으로 🔜 넉백 🔜 둘이 함께',
        },
      },
    },
    // ========== PRS ==========
    {
      id: 'R3S PRS Phase',
      type: 'StartsUsing',
      netRegex: { id: ['9406', '93EE'], source: 'Brute Bomber' },
      run: (data, matches) => {
        const map = {
          '9406': 'final',
          '93EE': 'field',
        };
        data.phase = map[matches.id];
      },
    },
    {
      id: 'R3S PRS Fuse Job',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB8', capture: true },
      suppressSeconds: 5,
      infoText: (data, matches, output) => {
        if (data.party.isDPS(matches.target))
          return output.dps();
        return output.th();
      },
      outputStrings: {
        th: {
          en: 'DPS long fuse',
          ko: 'DPS가 긴 도화선',
        },
        dps: {
          en: 'TH long fuse',
          ko: '탱힐이 긴 도화선',
        },
      },
    },
    {
      id: 'R3S PRS Short Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB8', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        data.myFuse = 'short';
        return output.text();
      },
      outputStrings: {
        text: {
          en: 'Short Fuse',
          ja: '短い導火線',
          ko: '내게 짧은 도화선 🔜 먼저 폭탄 처리',
        },
      },
    },
    {
      id: 'R3S PRS Long Fuse',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB9', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        data.myFuse = 'long';
        return output.text();
      },
      outputStrings: {
        text: {
          en: 'Long Fuse',
          ja: '長い導火線',
          ko: '내게 긴 도화선 🔜 먼저 모여 피해요',
        },
      },
    },
    {
      id: 'R3S PRS Fuse Magic Vulnerability',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: false },
      condition: (data) => data.phase === 'final' && data.myFuse !== undefined,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.myFuse === 'short')
          return output.short();
        return output.long();
      },
      run: (data) => data.myFuse = undefined,
      outputStrings: {
        short: {
          en: 'Spread for evade bomb',
          ko: '모여서 폭탄 피해요!',
        },
        long: {
          en: 'Spread for bomb',
          ko: '폭탄 처리하러 자기 자리로!',
        },
      },
    },
    {
      id: 'R3S PRS Fuse Field',
      type: 'GainsEffect',
      netRegex: { effectId: 'FB4' },
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        // MT>ST>H1>H2／D1>D2>D3>D4
        const thFirst = ['ST', 'H1', 'H2', 'D1', 'D2', 'D3', 'D4'];
        const dpsFirst = ['D2', 'D3', 'D4', 'MT', 'ST', 'H1', 'H2'];
        if (parseFloat(matches.duration) < 30) {
          if (data.party.isDPS(data.me)) {
            data.fieldList = dpsFirst;
            return output.shortDps();
          }
          data.fieldList = thFirst;
          return data.party.isTank(data.me) ? output.shortTank() : output.short();
        }
        data.fieldList = data.party.isDPS(data.me) ? thFirst : dpsFirst;
        return output.long();
      },
      outputStrings: {
        long: {
          en: 'Long Fuse',
          ja: '長い導火線',
          ko: '내게 긴 도화선',
        },
        short: {
          en: 'Short Fuse',
          ja: '短い導火線',
          ko: '내게 짧은 도화선',
        },
        shortTank: {
          en: 'Short Fuse (Tank)',
          ja: '短い導火線 (タンク)',
          ko: '내게 짧은 도화선 (MT면 바로 터쳐요)',
        },
        shortDps: {
          en: 'Short Fuse (DPS)',
          ja: '短い導火線 (DPS)',
          ko: '내게 짧은 도화선 (D1이면 바로 터쳐요)',
        },
      },
    },
    {
      id: 'R3S PRS Field Magic Vulnerability',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: false },
      condition: (data) => data.phase === 'field' && data.fieldList.length > 0,
      delaySeconds: 2,
      durationSeconds: 2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const target = data.fieldList.shift();
        return output.text({ target: target });
      },
      outputStrings: {
        text: {
          en: '${target}',
          ja: '${target}',
          ko: '${target}',
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
});
