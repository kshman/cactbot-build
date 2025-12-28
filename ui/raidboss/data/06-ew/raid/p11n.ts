import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  busterTargets?: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheEleventhCircle',
  zoneId: ZoneId.AnabaseiosTheEleventhCircle,
  timelineFile: 'p11n.txt',
  triggers: [
    {
      id: 'P11N Eunomia',
      type: 'StartsUsing',
      netRegex: { id: '81E2', source: 'Themis', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'P11N Divisive Ruling In',
      type: 'StartsUsing',
      netRegex: { id: '81B4', source: 'Themis', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line Cleave -> In',
          ja: '直線AOE -> 内側へ',
          ko: '가운데 장판 -> 안으로',
        },
      },
    },
    {
      id: 'P11N Divisive Ruling Out',
      type: 'StartsUsing',
      netRegex: { id: '81B3', source: 'Themis', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line Cleave -> Out',
          ja: '直線AOE -> 離れる',
          ko: '가운데 장판 -> 밖으로',
        },
      },
    },
    {
      id: 'P11N Dark Discord',
      type: 'GainsEffect',
      netRegex: { effectId: 'DE4' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get in light puddle',
          ja: 'ひかりの内側へ',
          ko: '노란 장판으로',
        },
      },
    },
    {
      id: 'P11N Light Discord',
      type: 'GainsEffect',
      netRegex: { effectId: 'DE3' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get in dark puddle',
          ja: 'やみの内側へ',
          ko: '보라 장판으로',
        },
      },
    },
    {
      id: 'P11N Dineis',
      type: 'StartsUsing',
      netRegex: { id: '8725', source: 'Themis', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait puddles x2',
          ja: 'AOE誘導 x2',
          ko: '장판 두번 깔아요',
        },
      },
    },
    {
      id: 'P11N Dismissal Ruling Dynamo',
      type: 'StartsUsing',
      netRegex: { id: '81FB', source: 'Themis', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback -> get in',
          ja: 'ノックバック => 内側へ',
          ko: '넉백 -> 안으로',
        },
      },
    },
    {
      id: 'P11N Dismissal Ruling Chariot',
      type: 'StartsUsing',
      netRegex: { id: '81FA', source: 'Themis', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback -> stay out',
          ja: 'ノックバック => そのまま',
          ko: '넉백 -> 그대로 밖에서',
        },
      },
    },
    {
      id: 'P11N Dike Collect',
      type: 'HeadMarker',
      netRegex: { id: '00DA' },
      run: (data, matches) => {
        data.busterTargets ??= [];
        data.busterTargets.push(matches.target);
      },
    },
    {
      id: 'P11N Dike Call',
      type: 'HeadMarker',
      netRegex: { id: '00DA', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        if (data.busterTargets?.includes(data.me))
          return output.busterOnYou!();
        return output.busterOthers!();
      },
      run: (data) => delete data.busterTargets,
      outputStrings: {
        busterOnYou: Outputs.tankBusterOnYou,
        busterOthers: Outputs.tankBusters,
      },
    },
    {
      id: 'P11N Upheld Ruling Dynamo',
      type: 'HeadMarker',
      netRegex: { id: '01CF' },
      infoText: (data, matches, output) => {
        if (data.me !== matches.target)
          return output.avoidCleave!({ target: data.party.member(matches.target) });
        return output.cleaveOnYou!();
      },
      outputStrings: {
        avoidCleave: {
          en: 'Cleaving ${target} -> get in',
          ja: '${target}が対象 => 内側へ',
          ko: '쪼개기: ${target} -> 안으로',
        },
        cleaveOnYou: {
          en: 'Cleave on YOU -> stay in',
          ja: '自分が対象 => 内側へ',
          ko: '내게 쪼개기 -> 그대로 안으로',
        },
      },
    },
    {
      id: 'P11N Upheld Ruling Chariot',
      type: 'HeadMarker',
      netRegex: { id: '013E' },
      infoText: (data, matches, output) => {
        return output.text!({ target: data.party.member(matches.target) });
      },
      outputStrings: {
        text: {
          en: 'Stack on ${target} -> get out',
          ja: '${target}とあたまわり => 外側へ',
          ko: '뭉쳐요: ${target} -> 밖으로',
        },
      },
    },
    {
      id: 'P11N Styx',
      type: 'HeadMarker',
      netRegex: { id: '0131' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'P11N Blinding Light',
      type: 'HeadMarker',
      netRegex: { id: '01D2' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'P11N Divisive Ruling Double',
      type: 'StartsUsing',
      netRegex: { id: '81D7', source: 'Illusory Themis', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line Cleave -> In on dark adds',
          ja: '直線AOE -> やみ回避',
          ko: '가운데 장판 -> 보라 쪽으로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Illusory Themis': 'Phantom-Themis',
        '(?<!(-| ))Themis': 'Themis',
      },
      'replaceText': {
        '\\(random\\)': '(Zufall)',
        '\\(cast\\)': '(Ausführen)',
        '\\(puddle': '(Fläche',
        '\\(in/out\\)': '(rein/raus)',
        'dynamo\\)': 'Donut)',
        'chariot\\)': 'AoE-Fläche)',
        '\\(cleave': '(Cleave',
        '\\(stack': '(Sammeln',
        'Blinding Light': 'Blendendes Licht',
        'Dark Perimeter': 'Dunkler Kreis',
        'Dark and Light': 'Licht-Dunkel-Schlichtung',
        'Dike': 'Dike',
        'Dineis': 'Dine',
        'Dismissal Ruling': 'Verweisungsbeschluss',
        'Divine Ruination': 'Lichtbombe',
        'Divisive Ruling': 'Auflösungsbeschluss',
        'Emissary\'s Will': 'Schlichtung',
        'Eunomia': 'Eunomia',
        'Inner Light': 'Gleißendes Inneres',
        'Lightburst': 'Lichtstoß',
        'Outer Dark': 'Dunkles Äußeres',
        'Ripples of Gloom': 'Wellen der Betrübung',
        'Shadowed Messengers': 'Boten des Schattens',
        'Sigils of Discord': 'Siegel der Uneinigkeit',
        'Styx': 'Styx',
        'Upheld Ruling': 'Erhebungsbeschluss',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Illusory Themis': 'spectre de Thémis',
        '(?<! )Themis': 'Thémis',
      },
      'replaceText': {
        'Blinding Light': 'Lumière aveuglante',
        'Dark Perimeter': 'Cercle ténébreux',
        'Dark and Light': 'Médiation Lumière-Ténèbres',
        'Dike': 'Diké',
        'Dineis': 'Diné',
        'Dismissal Ruling': 'Rejet et décision',
        'Divine Ruination': 'Explosion sacrée',
        'Divisive Ruling': 'Partage et décision',
        'Emissary\'s Will': 'Médiation',
        'Eunomia': 'Eunomia',
        'Inner Light': 'Chatoiement interne',
        'Lightburst': 'Éclat de lumière',
        'Outer Dark': 'Obscurité externe',
        'Ripples of Gloom': 'Onde des ténèbres',
        'Shadowed Messengers': 'Fantasmagorie des préceptes',
        'Sigils of Discord': 'Pentacles de dissonance',
        'Styx': 'Styx',
        'Upheld Ruling': 'Maintien et décision',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Illusory Themis': 'テミスの幻影',
        '(?<! )Themis': 'テミス',
      },
      'replaceText': {
        'Blinding Light': '光弾',
        'Dark Perimeter': 'ダークサークル',
        'Dark and Light': '光と闇の調停',
        'Dike': 'ディケー',
        'Dineis': 'ディーネ',
        'Dismissal Ruling': 'ディスミサル＆ルーリング',
        'Divine Ruination': '光爆',
        'Divisive Ruling': 'ディバイド＆ルーリング',
        'Emissary\'s Will': '調停',
        'Eunomia': 'エウノミアー',
        'Inner Light': 'インナーグレア',
        'Lightburst': 'ライトバースト',
        'Outer Dark': 'アウターダーク',
        'Ripples of Gloom': '闇の衝撃',
        'Shadowed Messengers': '戒律の幻奏',
        'Sigils of Discord': '不和の判紋',
        'Styx': 'ステュクス',
        'Upheld Ruling': 'アップヘルド＆ルーリング',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Illusory Themis': '特弥斯的幻影',
        '(?<!(-| ))Themis': '特弥斯',
      },
      'replaceText': {
        '\\(random\\)': '(随机)',
        '\\(cast\\)': '(咏唱)',
        '\\(puddle': '(圈',
        '\\(in/out\\)': '(内/外)',
        'dynamo\\)': '月环)',
        'chariot\\)': '钢铁)',
        '\\(cleave': '(跳劈',
        '\\(stack': '(分摊',
        'Blinding Light': '光弹',
        'Dark Perimeter': '黑暗回环',
        'Dark and Light': '光与暗的调停',
        'Dike': '正义',
        'Dineis': '旋涡',
        'Dismissal Ruling': '驳回判决',
        'Divine Ruination': '光爆',
        'Divisive Ruling': '分歧判决',
        'Emissary\'s Will': '调停者之意',
        'Eunomia': '秩序',
        'Inner Light': '内光',
        'Lightburst': '光爆破',
        'Outer Dark': '外暗',
        'Ripples of Gloom': '暗黑冲击',
        'Shadowed Messengers': '戒律幻奏',
        'Sigils of Discord': '失调的判纹',
        'Styx': '仇恨',
        'Upheld Ruling': '维持判决',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Illusory Themis': '特彌斯的幻影',
        // '(?<!(-| ))Themis': '', // FIXME '特弥斯'
      },
      'replaceText': {
        // '\\(random\\)': '', // FIXME '(随机)'
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        // '\\(puddle': '', // FIXME '(圈'
        // '\\(in/out\\)': '', // FIXME '(内/外)'
        // 'dynamo\\)': '', // FIXME '月环)'
        // 'chariot\\)': '', // FIXME '钢铁)'
        // '\\(cleave': '', // FIXME '(跳劈'
        // '\\(stack': '', // FIXME '(分摊'
        'Blinding Light': '光彈',
        'Dark Perimeter': '黑暗回環',
        'Dark and Light': '光與暗的調停',
        'Dike': '正義',
        'Dineis': '旋渦',
        'Dismissal Ruling': '駁回判決',
        'Divine Ruination': '光爆',
        'Divisive Ruling': '分歧判決',
        'Emissary\'s Will': '調停者之意',
        'Eunomia': '秩序',
        'Inner Light': '內光',
        'Lightburst': '光爆破',
        'Outer Dark': '外暗',
        'Ripples of Gloom': '暗黑衝擊',
        'Shadowed Messengers': '戒律幻奏',
        'Sigils of Discord': '失調的判紋',
        'Styx': '仇恨',
        'Upheld Ruling': '維持判決',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Illusory Themis': '테미스의 환영',
        '(?<!(-| ))Themis': '테미스',
      },
      'replaceText': {
        '\\(random\\)': '(랜덤)',
        '\\(cast\\)': '(시전)',
        '\\(puddle': '(장판',
        '\\(in/out\\)': '(안/밖)',
        'dynamo\\)': '도넛)',
        'chariot\\)': '원형)',
        '\\(cleave': '(탱버',
        '\\(stack': '(쉐어',
        'Blinding Light': '빛 폭탄',
        'Dark Perimeter': '어둠의 둘레',
        'Dark and Light': '빛과 어둠의 조정',
        'Dike': '디케',
        'Dineis': '디네',
        'Dismissal Ruling': '퇴거 집행',
        'Divine Ruination': '빛의 폭발',
        'Divisive Ruling': '분할 집행',
        'Emissary\'s Will': '조정',
        'Eunomia': '에우노미아',
        'Inner Light': '내면의 빛',
        'Lightburst': '빛 분출',
        'Outer Dark': '외면의 어둠',
        'Ripples of Gloom': '어둠의 충격',
        'Shadowed Messengers': '계율의 환영',
        'Sigils of Discord': '부조화의 인장',
        'Styx': '스틱스',
        'Upheld Ruling': '확정 집행',
      },
    },
  ],
};

export default triggerSet;
