import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Intemperance calls out a 4th time; should only call out three
// TODO: Right/Left + Fire/Light happen at the same time later; collect these together

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'AsphodelosTheFirstCircle',
  zoneId: ZoneId.AsphodelosTheFirstCircle,
  timelineFile: 'p1n.txt',
  triggers: [
    {
      // Also happens during Aetherflail Right (65DF)
      id: 'P1N Gaoler\'s Flail Right',
      type: 'StartsUsing',
      netRegex: { id: '6DA2', source: 'Erichthonios', capture: false },
      response: Responses.goLeft(),
    },
    {
      // Also happens during Aetherflail Left (65E0)
      id: 'P1N Gaoler\'s Flail Left',
      type: 'StartsUsing',
      netRegex: { id: '6DA3', source: 'Erichthonios', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'P1N Warder\'s Wrath',
      type: 'StartsUsing',
      netRegex: { id: '65F4', source: 'Erichthonios', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P1N Shining Cells',
      type: 'StartsUsing',
      netRegex: { id: '65E9', source: 'Erichthonios', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P1N Slam Shut',
      type: 'StartsUsing',
      netRegex: { id: '65EA', source: 'Erichthonios', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P1N Pitiless Flail KB',
      type: 'HeadMarker',
      netRegex: { id: '0001' },
      condition: Conditions.targetIsYou(),
      response: Responses.knockback(),
    },
    {
      id: 'P1N Pitiless Flail Stack',
      type: 'HeadMarker',
      netRegex: { id: '003E', capture: false },
      response: Responses.stackMarker(),
    },
    {
      id: 'P1N Intemperance',
      type: 'GainsEffect',
      netRegex: { effectId: ['AB3', 'AB4'], capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => {
        return _matches.effectId === 'AB3' ? output.red!() : output.blue!();
      },
      outputStrings: {
        red: {
          en: 'Get hit by red',
          ja: '炎に当たる',
          ko: '🟥빨강으로',
        },
        blue: {
          en: 'Get hit by blue',
          ja: '氷に当たる',
          ko: '🟦파랑으로',
        },
      },
    },
    {
      id: 'P1N Heavy Hand',
      type: 'StartsUsing',
      netRegex: { id: '65F3', source: 'Erichthonios' },
      condition: Conditions.caresAboutPhysical(),
      response: Responses.tankBuster(),
    },
    {
      id: 'P1N Powerful Light',
      type: 'GainsEffect',
      netRegex: { effectId: '893', capture: true },
      alertText: (_data, matches, output) => {
        if (matches.count === '14C')
          return output.light!();
        return output.fire!();
      },
      outputStrings: {
        fire: {
          en: 'Stand on fire',
          ja: '炎の床へ',
          ko: '🟥빨강 위로',
        },
        light: {
          en: 'Stand on light',
          ja: '光の床へ',
          ko: '⬜하양 위로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Gaoler\'s Flail Left/Gaoler\'s Flail Right': 'Gaoler\'s Flail Left/Right',
        'Gaoler\'s Flail Right/Gaoler\'s Flail Left': 'Gaoler\'s Flail Right/Left',
        'Hot Spell/Cold Spell': 'Hot/Cold Spell',
        'Powerful Fire/Powerful Light': 'Powerful Fire/Light',
        'Aetherflail Left/Aetherflail Right': 'Aetherflail Left/Right',
        'Aetherflail Right/Aetherflail Left': 'Aetherflail Right/Left',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Erichthonios': 'Erichthonios',
      },
      'replaceText': {
        '--knockback stack--': '--Rückstoß sammeln--',
        'Aetherchain': 'Berstende Ketten',
        'Aetherflail Left': 'Apodiktische Zucht Links',
        'Aetherflail Right': 'Apodiktische Zucht Rechts',
        'Cold Spell': 'Entfesselter Frost',
        'Gaoler\'s Flail Left': 'Eiserne Zucht Links',
        'Gaoler\'s Flail Right': 'Eiserne Zucht Rechts',
        'Heavy Hand': 'Marter',
        'Hot Spell': 'Entfesseltes Feuer',
        'Intemperance': 'Zehrende Elemente',
        'Intemperate Torment': 'Zehrende Vollstreckung',
        'Pitiless Flail': 'Zucht und Ordnung',
        'Powerful Fire': 'Entladenes Feuer',
        'Powerful Light': 'Entladenes Licht',
        'Shining Cells': 'Ätherzwinger',
        'Slam Shut': 'Freigang',
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
        '--knockback stack--': '--package poussée--',
        'Aetherchain': 'Chaînes explosives',
        'Aetherflail Left/Aetherflail Right': 'Chaîne de rétribution gauche/droite',
        'Aetherflail Right/Aetherflail Left': 'Chaîne de rétribution droite/gauche',
        'Gaoler\'s Flail Left/Gaoler\'s Flail Right': 'Chaîne punitive gauche/droite',
        'Gaoler\'s Flail Right/Gaoler\'s Flail Left': 'Chaîne punitive droite/gauche',
        'Heavy Hand': 'Chaîne de supplice',
        'Hot Spell/Cold Spell': 'Déchaînement de feu/glace',
        'Intemperance': 'Corrosion élémentaire',
        'Intemperate Torment': 'Exécution corrosive',
        'Pitiless Flail': 'Chaîne transperçante',
        'Powerful Fire/Powerful Light': 'Explosion infernale/sacrée',
        'Shining Cells': 'Geôle limbique',
        'Slam Shut': 'Occlusion terminale',
        'True Holy': 'Miracle véritable',
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
        'Aetherflail': '懲罰爆鎖',
        'Cold Spell': '魔力解放・氷',
        'Gaoler\'s Flail': '懲罰撃',
        'Heavy Hand': '痛撃',
        'Hot Spell': '魔力解放・火',
        'Intemperance': '氷火の侵食',
        'Intemperate Torment': '侵食執行',
        'Pitiless Flail': '懲罰連撃',
        'Powerful Fire': '炎爆',
        'Powerful Light': '光爆',
        'Shining Cells': '光炎監獄',
        'Slam Shut': '監獄閉塞',
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
        '--knockback stack--': '--集合击退--',
        'Aetherchain': '爆锁',
        'Aetherflail Left': '左惩罚爆锁',
        'Aetherflail Right': '右惩罚爆锁',
        'Cold Spell': '魔力解放·冰',
        'Gaoler\'s Flail Left': '左惩罚抽击',
        'Gaoler\'s Flail Right': '右惩罚抽击',
        'Heavy Hand': '掌掴',
        'Hot Spell': '魔力解放·火',
        'Intemperance': '冰火侵蚀',
        'Intemperate Torment': '侵蚀发动',
        'Pitiless Flail': '惩罚连击',
        'Powerful Fire': '炎爆',
        'Powerful Light': '光爆',
        'Shining Cells': '光炎监狱',
        'Slam Shut': '监狱封闭',
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
        // '--knockback stack--': '', // FIXME '--集合击退--'
        'Aetherchain': '爆鎖',
        // 'Aetherflail Left': '', // FIXME '左惩罚爆锁'
        // 'Aetherflail Right': '', // FIXME '右惩罚爆锁'
        'Cold Spell': '魔力解放·冰',
        // 'Gaoler\'s Flail Left': '', // FIXME '左惩罚抽击'
        // 'Gaoler\'s Flail Right': '', // FIXME '右惩罚抽击'
        'Heavy Hand': '掌摑',
        'Hot Spell': '魔力解放·火',
        'Intemperance': '冰火侵蝕',
        'Intemperate Torment': '侵蝕發動',
        'Pitiless Flail': '懲罰連擊',
        'Powerful Fire': '炎爆',
        'Powerful Light': '光爆',
        'Shining Cells': '光炎監獄',
        'Slam Shut': '監獄封閉',
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
        '--knockback stack--': '--넉백 쉐어--',
        'Aetherchain': '폭쇄',
        'Aetherflail Left/Aetherflail Right': '징벌 폭쇄 왼쪽/오른쪽',
        'Aetherflail Right/Aetherflail Left': '징벌 폭쇄 오른쪽/왼쪽',
        'Gaoler\'s Flail Left/Gaoler\'s Flail Right': '징벌격 왼쪽/오른쪽',
        'Gaoler\'s Flail Right/Gaoler\'s Flail Left': '징벌격 오른쪽/왼쪽',
        'Heavy Hand': '통격',
        'Hot Spell/Cold Spell': '마력 해방: 불/얼음',
        'Intemperance': '얼음불 침식',
        'Intemperate Torment': '침식 집행',
        'Pitiless Flail': '징벌 연격',
        'Powerful Fire': '염폭',
        'Powerful Light': '광폭',
        'Shining Cells': '광염 감옥',
        'Slam Shut': '감옥 폐쇄',
        'True Holy': '진 홀리',
        'Warder\'s Wrath': '사슬난류',
      },
    },
  ],
};

export default triggerSet;
