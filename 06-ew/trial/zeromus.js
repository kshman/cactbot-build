Options.Triggers.push({
  id: 'TheAbyssalFracture',
  zoneId: ZoneId.TheAbyssalFracture,
  timelineFile: 'zeromus.txt',
  triggers: [
    {
      id: 'Zeromus Abyssal Nox',
      type: 'Ability',
      netRegex: { id: '8AF7', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Heal to full',
          de: 'Voll heilen',
          fr: 'Soignez complètement',
          ja: 'HPを全回復する',
          cn: '奶满全队',
          ko: 'HP 만땅으로',
        },
      },
    },
    {
      id: 'Zeromus Abyssal Echoes',
      type: 'Ability',
      netRegex: { id: '8AF9', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away from glowing circles',
          de: 'Weg von den leuchtenden Kreisen',
          fr: 'Loin des cercles brillants',
          ja: '光っている円から離れる',
          cn: '远离黑洞',
          ko: '바닥 동그라미 피해요',
        },
      },
    },
    {
      id: 'Zeromus Sable Thread',
      type: 'Ability',
      netRegex: { id: '8AEF', source: 'Zeromus' },
      alertText: (data, matches, output) => {
        return output.lineStackOn({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        lineStackOn: {
          en: '5x line stack on ${player}',
          de: '5x in einer Linie Sammeln auf ${player}',
          fr: 'Package en ligne x5 sur ${player}',
          ja: '${player}に5回の直線頭割り',
          cn: '${player} 直线分摊 (5次)',
          ko: '5연속 한줄 뭉치기: ${player}',
        },
      },
    },
    {
      id: 'Zeromus Visceral Whirl NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8AFB', capture: false },
      infoText: (_data, _matches, output) => {
        return output.text({ dir1: output.ne(), dir2: output.sw() });
      },
      outputStrings: {
        text: {
          en: '${dir1} / ${dir2}',
          de: '${dir1} / ${dir2}',
          fr: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          cn: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        ne: Outputs.northeast,
        sw: Outputs.southwest,
      },
    },
    {
      id: 'Zeromus Visceral Whirl NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8AFE', source: 'Zeromus', capture: false },
      infoText: (_data, _matches, output) => {
        return output.text({ dir1: output.nw(), dir2: output.se() });
      },
      outputStrings: {
        text: {
          en: '${dir1} / ${dir2}',
          de: '${dir1} / ${dir2}',
          fr: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          cn: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        nw: Outputs.northwest,
        se: Outputs.southeast,
      },
    },
    {
      id: 'Zeromus Dark Matter',
      type: 'HeadMarker',
      netRegex: { id: '016C' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Zeromus Nox',
      type: 'HeadMarker',
      netRegex: { id: '00C5' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Zeromus Fractured Eventide NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8AF3', source: 'Zeromus', capture: false },
      alertText: (_data, _matches, output) => output.ne(),
      outputStrings: {
        ne: Outputs.northeast,
      },
    },
    {
      id: 'Zeromus Fractured Eventide NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8AF4', source: 'Zeromus', capture: false },
      alertText: (_data, _matches, output) => output.nw(),
      outputStrings: {
        nw: Outputs.northwest,
      },
    },
    {
      id: 'Zeromus Flare',
      type: 'StartsUsing',
      netRegex: { id: '8B12', source: 'Zeromus', capture: false },
      alertText: (_data, _matches, output) => output.tower(),
      outputStrings: {
        tower: {
          en: 'Stand in Tower',
          de: 'Steh im Turm',
          fr: 'Restez dans une tour',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '타워 밟아요',
        },
      },
    },
    {
      id: 'Zeromus Flare Hit',
      type: 'Ability',
      netRegex: { id: '8B12', source: 'Zeromus', capture: false },
      suppressSeconds: 5,
      response: Responses.getOut('info'),
    },
    {
      id: 'Zeromus Big Bang',
      type: 'StartsUsing',
      netRegex: { id: '8B03', source: 'Zeromus', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zeromus Acceleration Bomb',
      type: 'GainsEffect',
      netRegex: { effectId: 'A61' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      response: Responses.stopEverything(),
    },
    {
      id: 'Zeromus The Dark Divides',
      type: 'HeadMarker',
      netRegex: { id: '0178' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Zeromus The Dark Beckons',
      type: 'HeadMarker',
      netRegex: { id: '0064' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Zeromus Big Crunch',
      type: 'StartsUsing',
      netRegex: { id: '8B04', source: 'Zeromus', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zeromus Nostalgia',
      type: 'StartsUsing',
      netRegex: { id: '8B1A', source: 'Zeromus', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Zeromus Akh Rhai',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread + Stay Out',
          de: 'Verteilen + Draußen stehen',
          fr: 'Écartez-vous + Extérieur',
          ja: '散開 + 範囲から離れる',
          cn: '分散 + 远离',
          ko: '아크라이: 흩어져서 + 그대로 밖으로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Comet': 'Komet',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        '\\(cast\\)': '(Wirken)',
        '\\(proximity\\)': '(Distanz',
        'Abyssal Echoes': 'Abyssal-Echos',
        'Abyssal Nox': 'Abyssal-Nox',
        'Big Bang': 'Großer Knall',
        'Big Crunch': 'Großer Quetscher',
        'Black Hole': 'Schwarzes Loch',
        'Bury': 'Impakt',
        'Chasmic Nails': 'Abyssal-Nagel',
        'Dark Matter': 'Dunkelmaterie',
        'Dimensional Surge': 'Dimensionsschwall',
        'Explosion': 'Explosion',
        'Flare': 'Flare',
        'Flow of the Abyss': 'Abyssaler Strom',
        'Fractured Eventide': 'Abendglut',
        'Meteor Impact': 'Meteoreinschlag',
        'Nostalgia': 'Heimweh',
        '(?<! )Nox': 'Nox',
        'Primal Roar': 'Lautes Gebrüll',
        'Prominence Spine': 'Ossale Protuberanz',
        'Rend the Rift': 'Dimensionsstörung',
        '(?<! )Roar': 'Brüllen',
        'Sable Thread': 'Pechschwarzer Pfad',
        'The Dark Beckons': 'Fressende Finsternis: Last',
        'The Dark Divides': 'Fressende Finsternis: Zerschmetterung',
        'Visceral Whirl': 'Viszerale Schürfwunden',
        'Void Bio': 'Nichts-Bio',
        'Void Meteor': 'Nichts-Meteo',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Comet': 'comète',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        'Abyssal Echoes': 'Écho abyssal',
        'Abyssal Nox': 'Nox abyssal',
        'Big Bang': 'Big bang',
        'Big Crunch': 'Big crunch',
        'Black Hole': 'Trou noir',
        'Bury': 'Impact',
        'Chasmic Nails': 'Clous abyssaux',
        'Dark Matter': 'Matière sombre',
        'Dimensional Surge': 'Déferlante dimensionnelle',
        'Explosion': 'Explosion',
        'Flare': 'Brasier',
        'Flow of the Abyss': 'Flot abyssal',
        'Fractured Eventide': 'Éclat crépusculaire',
        'Meteor Impact': 'Impact de météore',
        'Nostalgia': 'Nostalgie',
        '(?<! )Nox': 'Nox',
        'Primal Roar': 'Rugissement furieux',
        'Prominence Spine': 'Évidence ossuaire',
        'Rend the Rift': 'Déchirure dimensionnelle',
        '(?<! )Roar': 'Rugissement',
        'Sable Thread': 'Rayon sombre',
        'The Dark Beckons': 'Ténèbres rongeuses : Gravité',
        'The Dark Divides': 'Ténèbres rongeuses : Pulvérisation',
        'Visceral Whirl': 'Écorchure viscérale',
        'Void Bio': 'Bactéries du néant',
        'Void Meteor': 'Météores du néant',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Comet': 'コメット',
        'Zeromus': 'ゼロムス',
      },
      'replaceText': {
        'Abyssal Echoes': 'アビサルエコー',
        'Abyssal Nox': 'アビサルノックス',
        'Big Bang': 'ビッグバーン',
        'Big Crunch': 'ビッグクランチ',
        'Black Hole': 'ブラックホール',
        'Bury': '衝撃',
        'Chasmic Nails': 'アビサルネイル',
        'Dark Matter': 'ダークマター',
        'Dimensional Surge': 'ディメンションサージ',
        'Explosion': '爆発',
        'Flare': 'フレア',
        'Flow of the Abyss': 'アビサルフロウ',
        'Fractured Eventide': '黒竜閃',
        'Meteor Impact': 'メテオインパクト',
        'Nostalgia': '望郷',
        '(?<! )Nox': 'ノックス',
        'Primal Roar': '大咆哮',
        'Prominence Spine': 'プロミネンススパイン',
        'Rend the Rift': '次元干渉',
        '(?<! )Roar': '咆哮',
        'Sable Thread': '漆黒の熱線',
        'The Dark Beckons': '闇の侵食：重',
        'The Dark Divides': '闇の侵食：砕',
        'Visceral Whirl': 'ヴィセラルワール',
        'Void Bio': 'ヴォイド・バイオ',
        'Void Meteor': 'ヴォイド・メテオ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Comet': '彗星',
        'Zeromus': '泽罗姆斯',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(proximity\\)': '(接近)',
        'Abyssal Echoes': '深渊回声',
        'Abyssal Nox': '深渊之夜',
        'Big Bang': '宇宙大爆炸',
        'Big Crunch': '宇宙大挤压',
        'Black Hole': '黑洞',
        'Bury': '塌方',
        'Chasmic Nails': '深渊连爪',
        'Dark Matter': '暗物质',
        'Dimensional Surge': '次元涌动',
        'Explosion': '爆炸',
        'Flare': '核爆',
        'Flow of the Abyss': '深渊激流',
        'Fractured Eventide': '黑龙闪',
        'Meteor Impact': '陨石冲击',
        'Nostalgia': '望乡',
        '(?<! )Nox': '夜',
        'Primal Roar': '大咆哮',
        'Prominence Spine': '日珥焰棘',
        'Rend the Rift': '次元干涉',
        '(?<! )Roar': '咆哮',
        'Sable Thread': '漆黑射线',
        'The Dark Beckons': '黑暗侵蚀：重击',
        'The Dark Divides': '黑暗侵蚀：飞散',
        'Visceral Whirl': '旋骨利爪',
        'Void Bio': '虚空毒菌',
        'Void Meteor': '虚空陨石',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Comet': '혜성',
        'Zeromus': '제로무스',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        '\\(proximity\\)': '(거리감쇠)',
        'Abyssal Echoes': '심연의 메아리',
        'Abyssal Nox': '심연의 암야',
        'Big Bang': '빅뱅',
        'Big Crunch': '빅 크런치',
        'Black Hole': '블랙홀',
        'Bury': '충격',
        'Chasmic Nails': '심연의 손톱',
        'Dark Matter': '암흑물질',
        'Dimensional Surge': '차원 쇄도',
        'Explosion': '폭발',
        'Flare': '플레어',
        'Flow of the Abyss': '심연의 흐름',
        'Fractured Eventide': '흑룡섬',
        'Meteor Impact': '운석 낙하',
        'Nostalgia': '망향',
        '(?<! )Nox': '암야',
        'Primal Roar': '대포효',
        'Prominence Spine': '홍염의 가시',
        'Rend the Rift': '차원 간섭',
        '(?<! )Roar': '포효',
        'Sable Thread': '칠흑의 열선',
        'The Dark Beckons': '어둠의 침식: 집중',
        'The Dark Divides': '어둠의 침식: 분산',
        'Visceral Whirl': '본능의 상흔',
        'Void Bio': '보이드 바이오',
        'Void Meteor': '보이드 메테오',
      },
    },
  ],
});