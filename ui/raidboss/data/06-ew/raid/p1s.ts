import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Fixup Intemperance callouts
// TODO: Add Aetherflail callouts to Powerful Light/Fire

export interface Data extends RaidbossData {
  companionship?: string;
  loneliness?: string;
  safeColor?: 'light' | 'fire';
}

const flailDirections = {
  l: Outputs.left,
  r: Outputs.right,
  combo: {
    en: '${first} => ${second}',
    de: '${first} => ${second}',
    fr: '${first} => ${second}',
    ja: '${first} => ${second}',
    cn: '${first} => ${second}',
    ko: '${first} 🔜 ${second}',
  },
};

const fireLightOutputStrings = {
  fire: {
    en: 'Stand on fire',
    de: 'Auf der Feuerfläche stehen',
    fr: 'Placez-vous sur le feu',
    ja: '炎の床へ',
    cn: '站在火',
    ko: '빨간 바닥으로',
  },
  light: {
    en: 'Stand on light',
    de: 'Auf der Lichtfläche stehen',
    fr: 'Placez-vous sur la lumière',
    ja: '光の床へ',
    cn: '站在光',
    ko: '흰 바닥으로',
  },
};

const triggerSet: TriggerSet<Data> = {
  id: 'AsphodelosTheFirstCircleSavage',
  zoneId: ZoneId.AsphodelosTheFirstCircleSavage,
  timelineFile: 'p1s.txt',
  timelineTriggers: [
    {
      id: 'P1S Tile Positions',
      regex: /(?:First|Second|Third) Element/,
      beforeSeconds: 3,
      infoText: (_data, _matches, output) => output.positions!(),
      outputStrings: {
        positions: {
          en: 'Tile Positions',
          ja: '自分の担当マスへ',
          ko: '담당 타일로',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'P1S Warder\'s Wrath',
      type: 'StartsUsing',
      netRegex: { id: '662A', source: 'Erichthonios', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P1S Shackles of Companionship',
      type: 'GainsEffect',
      netRegex: { effectId: 'AB6' },
      preRun: (data, matches) => data.companionship = matches.target,
      durationSeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.closeShacklesOnYou!();
      },
      outputStrings: {
        closeShacklesOnYou: {
          en: 'Close Shackles on YOU',
          ja: '紫鎖（近い方）',
          ko: '안쪽 쇠사슬(보라색)',
        },
      },
    },
    {
      id: 'P1S Shackles of Loneliness',
      type: 'GainsEffect',
      netRegex: { effectId: 'AB7' },
      preRun: (data, matches) => data.loneliness = matches.target,
      durationSeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.farShacklesOnYou!();
      },
      outputStrings: {
        farShacklesOnYou: {
          en: 'Far Shackles on YOU',
          ja: '赤鎖（遠い方）',
          ko: '바깥쪽 쇠사슬(빨간색)',
        },
      },
    },
    {
      // Callout the other shackle(s) at info level
      id: 'P1S Aetherial Shackles Callout',
      type: 'GainsEffect',
      netRegex: { effectId: 'AB[67]' },
      condition: (data) => data.companionship !== undefined && data.loneliness !== undefined,
      durationSeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      infoText: (data, _matches, output) => {
        if (data.companionship === data.me)
          return output.farShacklesOn!({ far: data.party.member(data.loneliness) });
        if (data.loneliness === data.me)
          return output.closeShacklesOn!({ close: data.party.member(data.companionship) });
        return output.shacklesOn!({
          close: data.party.member(data.companionship),
          far: data.party.member(data.loneliness),
        });
      },
      tts: (data, _matches, output) => {
        if (data.companionship === data.me || data.loneliness === data.me)
          return null;
        return output.shacklesOn!({
          close: data.party.member(data.companionship),
          far: data.party.member(data.loneliness),
        });
      },
      run: (data) => {
        delete data.companionship;
        delete data.loneliness;
      },
      outputStrings: {
        closeShacklesOn: {
          en: 'Close Shackles on ${close}',
          ja: '紫鎖（近い方）：${close}',
          ko: '안쪽 쇠사슬: ${close}',
        },
        farShacklesOn: {
          en: 'Far Shackles on ${far}',
          ja: '赤鎖（遠い方）：${far}',
          ko: '바깥쪽 쇠사슬: ${far}',
        },
        shacklesOn: {
          en: 'Close: ${close}, Far: ${far}',
          ja: '紫鎖（近い方）：${close}、赤鎖（遠い方）：${far}',
          ko: '안쪽: ${close}, 바깥쪽: ${far}',
        },
      },
    },
    {
      id: 'P1S Shining Cells',
      type: 'StartsUsing',
      netRegex: { id: '6616', source: 'Erichthonios', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P1S Slam Shut',
      type: 'StartsUsing',
      netRegex: { id: '6617', source: 'Erichthonios', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P1S Gaoler\'s Flail Left => Right',
      type: 'StartsUsing',
      netRegex: { id: '65F6', source: 'Erichthonios', capture: false },
      alertText: (_data, _matches, output) =>
        output.combo!({ first: output.l!(), second: output.r!() }),
      outputStrings: flailDirections,
    },
    {
      id: 'P1S Gaoler\'s Flail Right => Left',
      type: 'StartsUsing',
      netRegex: { id: '65F7', source: 'Erichthonios', capture: false },
      alertText: (_data, _matches, output) =>
        output.combo!({ first: output.r!(), second: output.l!() }),
      outputStrings: flailDirections,
    },
    {
      id: 'P1S Gaoler\'s Flail Out => In',
      type: 'StartsUsing',
      netRegex: { id: ['65F8', '65F9'], source: 'Erichthonios', capture: false },
      alertText: (_data, _matches, output) => output.outThenIn!(),
      outputStrings: {
        outThenIn: Outputs.outThenIn,
      },
    },
    {
      id: 'P1S Gaoler\'s Flail In => Out',
      type: 'StartsUsing',
      netRegex: { id: ['65FA', '65FB'], source: 'Erichthonios', capture: false },
      alertText: (_data, _matches, output) => output.inThenOut!(),
      outputStrings: {
        inThenOut: Outputs.inThenOut,
      },
    },
    {
      id: 'P1S Heavy Hand',
      type: 'StartsUsing',
      netRegex: { id: '6629', source: 'Erichthonios' },
      condition: Conditions.caresAboutPhysical(),
      response: Responses.tankBuster(),
    },
    {
      id: 'P1S Pitiless Flail of Grace',
      type: 'StartsUsing',
      netRegex: { id: '660E', source: 'Erichthonios', capture: false },
      alertText: (_data, _matches, output) => output.directions!(),
      outputStrings: {
        directions: {
          en: 'Tankbuster+Knockback => Stack',
          ja: 'タンクバスター+ノックバック => 頭割り',
          ko: '탱버 + 넉백 🔜 쉐어',
        },
      },
    },
    {
      id: 'P1S Pitiless Flail of Purgation',
      type: 'StartsUsing',
      netRegex: { id: '660F', source: 'Erichthonios', capture: false },
      alertText: (_data, _matches, output) => output.directions!(),
      outputStrings: {
        directions: {
          en: 'Tankbuster+Knockback => Flare',
          ja: 'タンクバスター+ノックバック => フレア',
          ko: '탱버 + 넉백 🔜 플레어',
        },
      },
    },
    {
      id: 'P1S Intemperate Torment Bottom',
      type: 'StartsUsing',
      netRegex: { id: '661F', source: 'Erichthonios', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bottom First',
          ja: '下から',
          ko: '아래부터',
        },
      },
    },
    {
      id: 'P1S Intemperate Torment Top',
      type: 'StartsUsing',
      netRegex: { id: '6620', source: 'Erichthonios', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Top First',
          ja: '上から',
          ko: '위부터',
        },
      },
    },
    // Copy/paste from normal, seems to be the same
    {
      id: 'P1S Hot/Cold Spell',
      type: 'GainsEffect',
      netRegex: { effectId: ['AB3', 'AB4'] },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        return matches.effectId === 'AB3' ? output.red!() : output.blue!();
      },
      outputStrings: {
        red: {
          en: 'Get hit by red',
          ja: '炎に当たる',
          ko: '빨간색 맞기',
        },
        blue: {
          en: 'Get hit by blue',
          ja: '氷に当たる',
          ko: '파란색 맞기',
        },
      },
    },
    {
      id: 'P1S Powerful Light/Fire',
      type: 'GainsEffect',
      netRegex: { effectId: '893' },
      preRun: (data, matches) => {
        data.safeColor = matches.count === '14C' ? 'light' : 'fire';
      },
      alertText: (data, _matches, output) => data.safeColor && output[data.safeColor]!(),
      outputStrings: fireLightOutputStrings,
    },
    {
      id: 'P1S Shackles of Time',
      type: 'GainsEffect',
      netRegex: { effectId: 'AB5' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.oppositeParty!();
        return output.oppositePlayer!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        oppositePlayer: {
          en: 'Opposite color of ${player}',
          ja: '${player}と反対の色へ',
          ko: '${player}의 반대 색으로',
        },
        oppositeParty: {
          en: 'Opposite color of Party',
          ja: '他のメンバーと反対の色へ',
          ko: '혼자 반대 색으로',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Companionship 1',
      type: 'GainsEffect',
      netRegex: { effectId: 'B45' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Close (3s)',
          ja: '紫鎖（近い方） (3s)',
          ko: '안쪽#1 (3초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Companionship 2',
      type: 'GainsEffect',
      netRegex: { effectId: 'B46' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Close (8s)',
          ja: '紫鎖（近い方） (8s)',
          ko: '안쪽#2 (8초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Companionship 3',
      type: 'GainsEffect',
      netRegex: { effectId: 'B47' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Close (13s)',
          ja: '紫鎖（近い方） (13s)',
          ko: '안쪽#3 (13초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Companionship 4',
      type: 'GainsEffect',
      netRegex: { effectId: 'B6B' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Close (18s)',
          ja: '紫鎖（近い方） (18s)',
          ko: '안쪽#4 (18초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Loneliness 1',
      type: 'GainsEffect',
      netRegex: { effectId: 'B48' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Far (3s)',
          ja: '赤鎖（遠い方） (3s)',
          ko: '바깥쪽#1 (3초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Loneliness 2',
      type: 'GainsEffect',
      netRegex: { effectId: 'B49' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Far (8s)',
          ja: '赤鎖（遠い方） (8s)',
          ko: '바깥쪽#2 (8초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Loneliness 3',
      type: 'GainsEffect',
      netRegex: { effectId: 'B4A' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Far (13s)',
          ja: '赤鎖（遠い方） (13s)',
          ko: '바깥쪽#3 (13초)',
        },
      },
    },
    {
      id: 'P1S Fourfold Shackles of Loneliness 4',
      type: 'GainsEffect',
      netRegex: { effectId: 'B6C' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Far (18s)',
          ja: '赤鎖（遠い方） (18s)',
          ko: '바깥쪽#4 (18초)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Pitiless Flail of Grace/Pitiless Flail of Purgation': 'Flail of Grace/Purgation',
        'True Flare/True Holy': 'True Flare/Holy',
        'Powerful Fire/Powerful Light': 'Powerful Fire/Light',
        'Inevitable Flame/Inevitable Light': 'Inevitable Flame/Light',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Erichthonios': 'Erichthonios',
      },
      'replaceText': {
        'Aetherchain': 'Berstende Ketten',
        'Aetherial Shackles': 'Fluchesketten',
        'Chain Pain': 'Verfluchte Vollstreckung',
        'First Element': 'Erstes Element',
        'Fourfold Shackles': 'Vierfache Fluchesketten',
        'Gaoler\'s Flail(?! [IO])': 'Eiserne Zucht',
        'Gaoler\'s Flail In/Out': 'Eiserne Zucht Rein/Raus',
        'Gaoler\'s Flail Out/In': 'Eiserne Zucht Raus/Rein',
        'Heavy Hand': 'Marter',
        'Inevitable Flame': 'Aspektiertes Feuer',
        'Inevitable Light': 'Aspektiertes Licht',
        'Intemperance': 'Zehrende Elemente',
        'Intemperate Torment': 'Zehrende Vollstreckung',
        'Lethe': 'Schloss und Riegel',
        'Pitiless Flail of Grace': 'Heilige Zucht und Ordnung',
        'Pitiless Flail of Purgation': 'Feurige Zucht und Ordnung',
        'Powerful Fire': 'Entladenes Feuer',
        'Powerful Light': 'Entladenes Licht',
        'Second Element': 'Zweites Element',
        'Shackles of Time': 'Aspektierende Ketten',
        'Shining Cells': 'Ätherzwinger',
        'Slam Shut': 'Freigang',
        'Third Element': 'Drittes Element',
        'True Flare': 'Vollkommenes Flare',
        'True Holy': 'Vollkommenes Sanctus',
        'Warder\'s Wrath': 'Kettenmagie',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Erichthonios': 'Érichthonios',
      },
      'replaceText': {
        '\\?': ' ?',
        'Aetherchain': 'Chaînes explosives',
        '(?<!/)Aetherial Shackles': 'Chaîne de malédiction',
        'Chain Pain': 'Exécution maudite',
        'First Element': 'Premier élément',
        'Fourfold Shackles': 'Chaîne de malédiction quadruple',
        'Gaoler\'s Flail(?! [IO])': 'Chaîne punitive',
        'Gaoler\'s Flail In/Out': 'Chaîne intérieur/extérieur',
        'Gaoler\'s Flail Out/In': 'Chaîne extérieur/intérieur',
        'Heavy Hand': 'Chaîne de supplice',
        'Inevitable Flame/Inevitable Light': 'Explosion à retardement',
        'Intemperance': 'Corrosion élémentaire',
        'Intemperate Torment': 'Exécution corrosive',
        'Lethe': 'Descente aux limbes',
        'Pitiless Flail of Grace(?!/)': 'Chaîne transperçante sacrée',
        'Pitiless Flail of Grace/Pitiless Flail of Purgation': 'Chaîne sacrée/infernale',
        'Powerful Fire/Powerful Light': 'Explosion infernale/sacrée',
        'Second Element': 'Deuxième élément',
        'Shackles of Time(?!/)': 'Chaîne à retardement',
        'Shackles of Time/Aetherial Shackles': 'Chaîne à retardement/malédiction',
        'Shining Cells': 'Geôle limbique',
        'Slam Shut': 'Occlusion terminale',
        'Third Element': 'Troisième élément',
        'True Flare/True Holy': 'Brasier/Miracle véritable',
        'Warder\'s Wrath': 'Chaînes torrentielles',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Erichthonios': 'エリクトニオス',
      },
      'replaceText': {
        'Aetherchain': '爆鎖',
        'Aetherial Shackles': '結呪の魔鎖',
        'Chain Pain': '結呪執行',
        'Fourfold Shackles': '結呪の四連魔鎖',
        'Gaoler\'s Flail': '懲罰撃',
        'Heavy Hand': '痛撃',
        'Inevitable Flame': '時限炎爆',
        'Inevitable Light': '時限光爆',
        'Intemperance': '氷火の侵食',
        'Intemperate Torment': '侵食執行',
        'Lethe': '辺獄送り',
        'Pitiless Flail of Grace': '懲罰連撃・聖',
        'Pitiless Flail of Purgation': '懲罰連撃・炎',
        'Powerful Fire': '炎爆',
        'Powerful Light': '光爆',
        'Shackles of Time': '時限の魔鎖',
        'Shining Cells': '光炎監獄',
        'Slam Shut': '監獄閉塞',
        'True Flare': 'トゥルー・フレア',
        'True Holy': 'トゥルー・ホーリー',
        'Warder\'s Wrath': '魔鎖乱流',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Erichthonios': '埃里克特翁尼亚斯',
      },
      'replaceText': {
        'Aetherchain': '爆锁',
        'Aetherial Shackles': '结咒魔锁',
        'Chain Pain': '结咒发动',
        'First Element': '第一元素',
        'Fourfold Shackles': '结咒四连魔锁',
        'Gaoler\'s Flail(?! [IO])': '惩罚抽击',
        'Gaoler\'s Flail In/Out': '惩罚抽击 内/外',
        'Gaoler\'s Flail Out/In': '惩罚抽击 外/内',
        'Heavy Hand': '掌掴',
        'Inevitable Flame': '限时炎爆',
        'Inevitable Light': '限时光爆',
        'Intemperance': '冰火侵蚀',
        'Intemperate Torment': '侵蚀发动',
        'Lethe': '边境流刑',
        'Pitiless Flail of Grace': '惩罚连击·圣',
        'Pitiless Flail of Purgation': '惩罚连击·炎',
        'Powerful Fire': '炎爆',
        'Powerful Light': '光爆',
        'Second Element': '第二元素',
        'Shackles of Time': '限时魔锁',
        'Shining Cells': '光炎监狱',
        'Slam Shut': '监狱封闭',
        'Third Element': '第三元素',
        'True Flare': '纯正核爆',
        'True Holy': '纯正神圣',
        'Warder\'s Wrath': '魔锁乱流',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Erichthonios': '艾里克托尼奧斯',
      },
      'replaceText': {
        'Aetherchain': '爆鎖',
        'Aetherial Shackles': '結咒魔鎖',
        'Chain Pain': '結咒發動',
        'First Element': '魔力解放·火',
        'Fourfold Shackles': '結咒四連魔鎖',
        'Gaoler\'s Flail(?! [IO])': '懲罰抽擊',
        // 'Gaoler\'s Flail In/Out': '', // FIXME '惩罚抽击 内/外'
        // 'Gaoler\'s Flail Out/In': '', // FIXME '惩罚抽击 外/内'
        'Heavy Hand': '掌摑',
        'Inevitable Flame': '限時炎爆',
        'Inevitable Light': '限時光爆',
        'Intemperance': '冰火侵蝕',
        'Intemperate Torment': '侵蝕發動',
        'Lethe': '邊境流刑',
        'Pitiless Flail of Grace': '懲罰連擊·聖',
        'Pitiless Flail of Purgation': '懲罰連擊·炎',
        'Powerful Fire': '炎爆',
        'Powerful Light': '光爆',
        'Second Element': '魔力解放·火',
        'Shackles of Time': '限時魔鎖',
        'Shining Cells': '光炎監獄',
        'Slam Shut': '監獄封閉',
        'Third Element': '魔力解放·火',
        'True Flare': '純正火光',
        'True Holy': '純正神聖',
        'Warder\'s Wrath': '魔鎖亂流',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Erichthonios': '에리크토니오스',
      },
      'replaceText': {
        'Aetherchain': '폭쇄',
        'Aetherial Shackles': '결박 사슬',
        'Chain Pain': '결박 집행',
        'First Element': '큐브 폭발 #1',
        'Fourfold Shackles': '4연속 결박 사슬',
        'Gaoler\'s Flail(?! [IO])': '징벌격',
        'Gaoler\'s Flail In/Out': '징벌격 안/밖',
        'Gaoler\'s Flail Out/In': '징벌격 밖/안',
        'Heavy Hand': '통격',
        'Inevitable Flame/Inevitable Light': '시한 염폭/광폭',
        'Intemperance': '얼음불 침식',
        'Intemperate Torment': '침식 집행',
        'Lethe': '변옥 수감',
        'Pitiless Flail of Grace(?!/)': '징벌 연격: 신성',
        'Pitiless Flail of Grace/Pitiless Flail of Purgation': '징벌 연격: 신성/화염',
        'Powerful Fire': '염폭',
        'Powerful Light': '광폭',
        'Second Element': '큐브 폭발 #2',
        'Shackles of Time(?!/)': '시한부 사슬',
        'Shackles of Time/Aetherial Shackles': '시한부/결박 사슬',
        'Shining Cells': '광염 감옥',
        'Slam Shut': '감옥 폐쇄',
        'Third Element': '큐브 폭발 #3',
        'True Flare/True Holy': '진 플레어/홀리',
        'Warder\'s Wrath': '사슬난류',
      },
    },
  ],
};

export default triggerSet;
