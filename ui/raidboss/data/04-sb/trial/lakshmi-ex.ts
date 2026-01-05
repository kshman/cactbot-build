import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  chanchala?: boolean;
}

// Lakshmi Extreme
const triggerSet: TriggerSet<Data> = {
  id: 'EmanationExtreme',
  zoneId: ZoneId.EmanationExtreme,
  timelineFile: 'lakshmi-ex.txt',
  timelineTriggers: [
    {
      id: 'LakshmiEx Path of Light',
      regex: /Path of Light/,
      beforeSeconds: 5,
      response: Responses.tankCleave(),
    },
  ],
  triggers: [
    {
      id: 'LakshmiEx Chanchala Gain',
      type: 'StartsUsing',
      netRegex: { id: '2148', source: 'Lakshmi', capture: false },
      run: (data) => data.chanchala = true,
    },
    {
      id: 'LakshmiEx Chanchala Lose',
      type: 'LosesEffect',
      netRegex: { target: 'Lakshmi', effectId: '582', capture: false },
      run: (data) => data.chanchala = false,
    },
    {
      id: 'LakshmiEx Pull of Light Tank',
      type: 'StartsUsing',
      netRegex: { id: '215E', source: 'Lakshmi' },
      response: Responses.tankBuster('info'),
    },
    {
      id: 'LakshmiEx Pull of Light Unexpected',
      type: 'StartsUsing',
      netRegex: { id: '215E', source: 'Lakshmi' },
      condition: (data) => data.role !== 'tank' && data.role !== 'healer',
      response: Responses.tankBuster('alarm'),
    },
    {
      id: 'LakshmiEx Divine Denial',
      type: 'StartsUsing',
      netRegex: { id: '2149', source: 'Lakshmi', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Vrill + Knockback',
          ja: 'エーテル + 完全なる拒絶',
          ko: '브릴 + 넉백',
        },
      },
    },
    {
      id: 'LakshmiEx Divine Desire',
      type: 'StartsUsing',
      netRegex: { id: '214B', source: 'Lakshmi', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Vrill + Be Outside',
          ja: 'エーテル + 完全なる誘引',
          ko: '브릴 + 바깥으로 (끌어당김)',
        },
      },
    },
    {
      id: 'LakshmiEx Divine Doubt',
      type: 'StartsUsing',
      netRegex: { id: '214A', source: 'Lakshmi', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Vrill + Pair Up',
          ja: 'エーテル + 完全なる惑乱',
          ko: '브릴 + 페어',
        },
      },
    },
    { // Stack marker
      id: 'LakshmiEx Pall of Light',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      alertText: (data, matches, output) => {
        if (!data.chanchala)
          return;

        if (data.me === matches.target)
          return output.vrillStackOnYou!();

        return output.vrillStack!();
      },
      infoText: (data, matches, output) => {
        if (data.chanchala)
          return;

        if (data.me === matches.target)
          return output.stackOnYou!();

        return output.stack!();
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stack: {
          en: 'Stack',
          ja: '頭割り',
          ko: '뭉쳐요',
        },
        vrillStackOnYou: {
          en: 'Vrill + Stack on YOU',
          ja: '自分に頭割り (エーテル)',
          ko: '브릴 + 내게 뭉쳐요',
        },
        vrillStack: {
          en: 'Vrill + Stack',
          ja: 'エーテル と 頭割り',
          ko: '브릴 + 뭉쳐요',
        },
      },
    },
    {
      id: 'LakshmiEx Stotram',
      type: 'StartsUsing',
      netRegex: { id: '2147', source: 'Lakshmi', capture: false },
      condition: (data) => data.chanchala,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Vrill for AOE',
          ja: 'ストトラム (エーテル)',
          ko: '브릴 스토트람 전체 공격',
        },
      },
    },
    {
      // Offtank cleave
      id: 'LakshmiEx Path of Light Marker',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      condition: Conditions.targetIsYou(),
      alarmText: (data, _matches, output) => {
        if (data.chanchala)
          return output.vrillCleaveOnYou!();

        return output.cleaveOnYou!();
      },
      outputStrings: {
        vrillCleaveOnYou: {
          en: 'Vrill + Cleave on YOU',
          ja: '自分に波動 (エーテル)',
          ko: '브릴 + 내게 탱크 쪼개기',
        },
        cleaveOnYou: {
          en: 'Cleave on YOU',
          ja: '自分に波動',
          ko: '내게 탱크 쪼개기',
        },
      },
    },
    {
      // Cross aoe
      id: 'LakshmiEx Hand of Grace',
      type: 'HeadMarker',
      netRegex: { id: '006B' },
      condition: Conditions.targetIsYou(),
      infoText: (data, _matches, output) => {
        if (data.chanchala)
          return output.vrillCrossMarker!();

        return output.crossMarker!();
      },
      outputStrings: {
        vrillCrossMarker: {
          en: 'Vrill + Cross Marker',
          ja: '自分に右手 (エーテル)',
          ko: '브릴 + 십자 장판',
        },
        crossMarker: {
          en: 'Cross Marker',
          ja: '自分に右手',
          ko: '십자 장판',
        },
      },
    },
    {
      // Flower marker (healers)
      id: 'LakshmiEx Hand of Beauty',
      type: 'HeadMarker',
      netRegex: { id: '006D' },
      condition: Conditions.targetIsYou(),
      infoText: (data, _matches, output) => {
        if (data.chanchala)
          return output.vrillFlowerMarker!();

        return output.flowerMarker!();
      },
      outputStrings: {
        vrillFlowerMarker: {
          en: 'Vrill + Flower Marker',
          ja: '自分に左手 (エーテル)',
          ko: '브릴 + 동글 장판',
        },
        flowerMarker: {
          en: 'Flower Marker',
          ja: '自分に左手',
          ko: '동글 장판',
        },
      },
    },
    {
      // Red marker during add phase
      id: 'LakshmiEx Water III',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      // Soloing can get you two of these.
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move Away',
          ja: '離れる',
          ko: '피해욧',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Blissful Arrow': 'Blissful Arrow (cross)',
        'Blissful Hammer': 'Blissful Hammer (circle)',
        'The Pall Of Light': 'Pall Of Light (stack)',
        'The Path Of Light': 'Path Of Light (OT cleave)',
        'The Pull Of Light': 'Pull Of Light (MT buster)',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Dreaming Kshatriya': 'verträumt(?:e|er|es|en) Kshatriya',
        'Lakshmi': 'Lakshmi',
      },
      'replaceText': {
        '--chanchala end--': '--Chanchala endet--',
        '\\(mid\\)': '(Mitte)',
        '/dance': '/tanz',
        'Alluring Arm': 'Anziehender Arm',
        'Blissful Spear': 'Speer der Gnade',
        'Chanchala': 'Chanchala',
        'Divine Denial': 'Göttliche Leugnung',
        'Divine Desire': 'Göttliche Lockung',
        'Divine Doubt': 'Göttliche Bestürzung',
        'Hand Of Beauty': 'Hand der Schönheit',
        'Hand Of Grace': 'Hand der Anmut',
        'Inner Demons': 'Dämonen in dir',
        'Stotram': 'Stotram',
        'The Pall Of Light': 'Flut des Lichts',
        'The Path Of Light': 'Pfad des Lichts',
        'The Pull Of Light': 'Strom des Lichts',
        'Vril': 'Vril',
        'Tail Slap': 'Schwanzklapser',
        'Blissful Arrow': 'Heiliger Pfeil',
        'Blissful Hammer': 'Hammer der Gnade',
        'Jagadishwari': 'Jagadishwari',
        'Alluring Embrace': 'Lockende Umarmung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Dreaming Kshatriya': 'kshatriya rêveuse',
        'Lakshmi': 'Lakshmi',
      },
      'replaceText': {
        '--chanchala end--': '--fin de chanchala--',
        '/dance': '/danse',
        '\\(mid\\)': '(milieu)',
        'Alluring Arm': 'Bras séduisants',
        'Blissful Spear': 'Épieu béatifiant',
        '(?<! )Chanchala': 'Chanchala',
        'Divine Denial': 'Refus divin',
        'Divine Desire': 'Désir divin',
        'Divine Doubt': 'Doute divin',
        'Hand Of Beauty': 'Main de la beauté',
        'Hand Of Grace': 'Main de la grâce',
        'Inner Demons': 'Démons intérieurs',
        'Stotram': 'Stotram',
        'The Pall Of Light': 'Voile de lumière (package)',
        'The Path Of Light': 'Voie de lumière (OT cleave)',
        'The Pull Of Light': 'Flot de lumière (MT buster)',
        'Vril': 'Vril',
        'Tail Slap': 'Gifle caudale',
        'Blissful Arrow': 'Flèche béatifiante (croix)',
        'Blissful Hammer': 'Marteau béatifiant (cercle)',
        'Jagadishwari': 'Jagadishwari',
        'Alluring Embrace': 'Étreinte séduisante',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Dreaming Kshatriya': 'テンパード・クシャトリア',
        'Lakshmi': 'ラクシュミ',
      },
      'replaceText': {
        '/dance': '/dance',
        '\\(mid\\)': '(中央)',
        'Alluring Arm': '魅惑の腕',
        'Blissful Spear': '聖なる槍',
        'Chanchala': 'チャンチャラー',
        'Divine Denial': '完全なる拒絶',
        'Divine Desire': '完全なる誘引',
        'Divine Doubt': '完全なる惑乱',
        'Hand Of Beauty': '優美なる左手',
        'Hand Of Grace': '優雅なる右手',
        'Inner Demons': 'イナーデーモン',
        'Stotram': 'ストトラム',
        'The Pall Of Light': '光の瀑布',
        'The Path Of Light': '光の波動',
        'The Pull Of Light': '光の奔流',
        'Vril': 'ラクシュミエーテル',
        'Tail Slap': 'テールスラップ',
        'Blissful Arrow': '聖なる矢',
        'Blissful Hammer': '聖なる槌',
        'Jagadishwari': 'ジャガディッシュワリ',
        'Alluring Embrace': '魅惑の抱擁',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Dreaming Kshatriya': '梦寐的刹帝利',
        'Lakshmi': '吉祥天女',
      },
      'replaceText': {
        '--chanchala end--': '--反复无常结束--',
        '\\(mid\\)': '(中)',
        '\\(out\\)': '(外)',
        '/dance': '/跳舞',
        'Alluring Arm': '魅惑之臂',
        'Blissful Spear': '圣枪',
        '(?<!-)Chanchala': '反复无常',
        'Divine Denial': '完全拒绝',
        'Divine Desire': '完全引诱',
        'Divine Doubt': '完全惑乱',
        'Hand Of Beauty': '优美的左手',
        'Hand Of Grace': '优雅的右手',
        'Inner Demons': '心魔',
        'Stotram': '赞歌',
        'The Pall Of Light': '光之瀑布',
        'The Path Of Light': '光之波动',
        'The Pull Of Light': '光之奔流',
        'Vril': '元气',
        'Tail Slap': '尾部猛击',
        'Blissful Arrow': '圣箭',
        'Blissful Hammer': '圣锤',
        'Jagadishwari': '至上天母',
        'Alluring Embrace': '魅惑拥抱',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Dreaming Kshatriya': '夢寐的剎帝利',
        'Lakshmi': '吉祥天女',
      },
      'replaceText': {
        '--chanchala end--': '--反覆無常結束--',
        '\\(mid\\)': '(中)',
        '\\(out\\)': '(外)',
        '/dance': '/跳舞 (/dance)',
        'Alluring Arm': '魅惑之臂',
        'Blissful Spear': '聖槍',
        '(?<!-)Chanchala': '反覆無常',
        'Divine Denial': '完全拒絕',
        'Divine Desire': '完全引誘',
        'Divine Doubt': '完全惑亂',
        'Hand Of Beauty': '優美的左手',
        'Hand Of Grace': '優雅的右手',
        'Inner Demons': '心魔',
        'Stotram': '讚歌',
        'The Pall Of Light': '光之瀑布',
        'The Path Of Light': '光之波動',
        'The Pull Of Light': '光之奔流',
        'Vril': '元氣',
        'Tail Slap': '尾部猛擊',
        'Blissful Arrow': '聖箭',
        'Blissful Hammer': '聖錘',
        'Jagadishwari': '至上天母',
        'Alluring Embrace': '魅惑擁抱',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Dreaming Kshatriya': '신도화된 크샤트리아',
        'Lakshmi': '락슈미',
      },
      'replaceText': {
        '/dance': '/춤',
        'Alluring Arm': '매혹적인 팔',
        'Blissful Spear': '성스러운 창',
        'Chanchala': '찬찰라',
        'Divine Denial': '완전한 거절',
        'Divine Desire': '완전한 유인',
        'Divine Doubt': '완전한 혼란',
        'Hand Of Beauty': '아름다운 왼손',
        'Hand Of Grace': '우아한 오른손',
        'Inner Demons': '내면의 악마',
        'Stotram': '스토트람',
        'The Pall Of Light': '빛의 폭포',
        'The Path Of Light': '빛의 파동',
        'The Pull Of Light': '빛의 급류',
        'Vril': '락슈미 에테르',
        'Tail Slap': '꼬리치기',
        'Blissful Arrow': '성스러운 화살',
        'Blissful Hammer': '성스러운 망치',
        'Jagadishwari': '자가디슈와리',
        'Alluring Embrace': '매혹적인 포옹',
      },
    },
  ],
};

export default triggerSet;
