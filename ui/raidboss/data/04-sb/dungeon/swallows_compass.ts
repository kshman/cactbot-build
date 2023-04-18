import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  dynamo?: boolean;
  seenIntermission?: boolean;
  tethers?: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheSwallowsCompass',
  zoneId: ZoneId.TheSwallowsCompass,
  timelineFile: 'swallows_compass.txt',
  triggers: [
    {
      id: 'Swallows Compass Tengu Clout',
      type: 'StartsUsing',
      netRegex: { id: '2B95', source: 'Otengu', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Swallows Compass Tengu Might',
      type: 'StartsUsing',
      netRegex: { id: '2B94', source: 'Otengu' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Swallows Compass Tengu Wile',
      type: 'StartsUsing',
      netRegex: { id: '2B97', source: 'Otengu', capture: false },
      response: Responses.lookAway(),
    },
    {
      // 7201 is Tengu Ember.
      id: 'Swallows Compass Ember Spawn',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '7201', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '불 구슬 피래요',
          de: 'Weiche den Feuerorbs aus',
          fr: 'Évitez les orbes de feu',
          ja: '火の玉を避ける',
          cn: '躲避小火球',
          ko: '불구슬 피하기',
        },
      },
    },
    {
      id: 'Swallows Compass Flames Of Hate',
      type: 'StartsUsing',
      netRegex: { id: '2898', source: 'Tengu Ember', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '파이어볼 피해요',
          de: 'Weg von den Feuerkugeln',
          fr: 'Éloignez-vous des boules de feu',
          ja: '(大きい)火の玉を避ける',
          cn: '远离大火球',
          ko: '불구슬 피하기',
        },
      },
    },
    {
      id: 'Swallows Compass Right Palm',
      type: 'StartsUsing',
      netRegex: { id: '2B9D', source: 'Daidarabotchi', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Swallows Compass Left Palm',
      type: 'StartsUsing',
      netRegex: { id: '2B9E', source: 'Daidarabotchi', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Swallows Compass Mountain Falls',
      type: 'HeadMarker',
      netRegex: { id: '0087' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Swallows Compass Mirage',
      type: 'HeadMarker',
      netRegex: { id: '0001' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 5x 장판이',
          de: '5x Flächen auf DIR',
          fr: '5x Zones au sol sur VOUS',
          ja: '自分に追尾AoE',
          cn: '5连追踪AOE点名',
          ko: '5회 장판 대상자',
        },
      },
    },
    {
      id: 'Swallows Compass Mythmaker',
      type: 'Ability',
      netRegex: { id: '2BA3', source: 'Daidarabotchi', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Swallows Compass Six Fulms Under',
      type: 'GainsEffect',
      netRegex: { effectId: '237' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 2, // If the user stays in, they will get more reminders.
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '호수 영역 밖으로',
          de: 'RAUS AUS DEM SEE',
          fr: 'SORTEZ DU LAC',
          ja: '青いエリアを踏まない',
          cn: '不要踩进水坑',
          ko: '물웅덩이에서 벗어나기',
        },
      },
    },
    {
      id: 'Swallows Compass Short End',
      type: 'StartsUsing',
      netRegex: { id: ['2BA6', '2D07'], source: ['Qitian Dasheng', 'Shadow Of The Sage'] },
      suppressSeconds: 5,
      response: Responses.tankBuster(),
    },
    {
      id: 'Swallows Compass Mount Huaguo',
      type: 'StartsUsing',
      netRegex: {
        id: ['2BAA', '2D08'],
        source: ['Qitian Dasheng', 'Shadow Of The Sage'],
        capture: false,
      },
      suppressSeconds: 5,
      response: Responses.aoe(),
    },
    {
      // Both Ends has a number of different possibilities for how it's used.
      // It can be alone, or it can be accompanied by the other form,
      // or it can be alongside Five-Fingered Punishment.
      // If there's a blue one on the field, we want to be in, no matter what.
      // If there's no blue, we want to be away from red.
      // In order to avoid collisions and confusion, we collect first.
      id: 'Swallows Compass Both Ends Collect',
      type: 'StartsUsing',
      netRegex: {
        id: ['2BA9', '2BAF'],
        source: ['Qitian Dasheng', 'Shadow Of The Sage'],
        capture: false,
      },
      run: (data) => data.dynamo = true,
    },
    {
      // 2BA8,2BAE is red, chariot, 2BA9,2BAF is blue, dynamo.
      id: 'Swallows Compass Both Ends Call',
      type: 'StartsUsing',
      netRegex: {
        id: ['2BA8', '2BA9', '2BAE', '2BAF'],
        source: ['Qitian Dasheng', 'Shadow Of The Sage'],
        capture: false,
      },
      delaySeconds: 0.5,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.dynamo)
          return output.dynamo!();
        return output.chariot!();
      },
      run: (data) => delete data.dynamo,
      outputStrings: {
        dynamo: {
          en: '여의봉🟦 가까이로',
          de: 'Nahe am blauen Stab',
          fr: 'Rapprochez-vous du bâton bleu',
          ja: '如意棒に近づく',
          cn: '靠近蓝色大圣',
          ko: '파랑 지팡이 근처로',
        },
        chariot: {
          en: '여의봉🟥에게서 멀어져요',
          de: 'Weg vom roten Stab',
          fr: 'Éloignez-vous du bâton rouge',
          ja: '如意棒から離れる',
          cn: '远离红色大圣',
          ko: '빨강 지팡이에서 떨어지기',
        },
      },
    },
    {
      id: 'Swallows Compass Five Fingered Punishment',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      response: Responses.stackMarkerOn('info'), // Info rather than alert to avoid collision with Both Ends.
    },
    {
      // The Long end is a knockback in phase 1, but not in phase 2.
      // Using the source name for tethers runs into localizing issues,
      // so we just track the phase instead.
      // The ability use here is unnamed, the teleport to the center to begin the intermission.
      id: 'Swallows Compass Intermission Tracking',
      type: 'Ability',
      netRegex: { id: '2CC7', source: 'Qitian Dasheng', capture: false },
      run: (data) => data.seenIntermission = true,
    },
    {
      // Either one or two tethers can be present for Long End.
      // We have to handle both possibilities, so we collect targets first for later analysis.
      id: 'Swallows Compass Long End Collect',
      type: 'Tether',
      netRegex: { id: '0029' },
      run: (data, matches) => {
        data.tethers ??= [];
        data.tethers.push(matches.target);
      },
    },
    {
      id: 'Swallows Compass Long End Call',
      type: 'Tether',
      netRegex: { id: '0029', capture: false },
      delaySeconds: 0.5,
      alertText: (data, _matches, output) => {
        if (data.tethers?.includes(data.me)) {
          if (data.seenIntermission)
            return output.target!();
          return output.knockback!();
        }
        return output.avoid!();
      },
      run: (data) => delete data.tethers,
      outputStrings: {
        target: {
          en: '내게 레이저',
          de: 'Laser auf DIR',
          fr: 'Laser sur VOUS',
          ja: '自分にレーザー',
          cn: '直线激光点名',
          ko: '레이저 대상자',
        },
        knockback: {
          en: '내게 넉백 레이저',
          de: 'Rückstoßlaser auf DIR',
          fr: 'Poussée laser sur VOUS',
          ja: '自分にノックバックレーザー',
          cn: '击退激光点名',
          ko: '넉백 레이저 대상자',
        },
        avoid: {
          en: '선 피해요',
          de: 'Vermeide die Verbindungen',
          fr: 'Évitez les liens',
          ja: '線から離れる',
          cn: '远离连线',
          ko: '선 피하기',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Daidarabotchi': 'Daidarabotchi',
        'Otengu': 'Otengu',
        'Qitian Dasheng': 'Qitian Dasheng',
        'Serenity': 'Die Stille',
        'Shadow Of The Sage': 'Schatten des Weisen',
        'Tengu Ember': 'Tengu-Glut',
        'The Dragon\'s Mouth': 'Maul des Drachen',
        'The Heart Of The Dragon': 'Herz des Drachen',
      },
      'replaceText': {
        'Both Ends': 'Beide Enden',
        'Clout Of The Tengu': 'Atem des Tengu',
        'Equal Of Heaven': 'Dem Himmel gleich',
        'Five-Fingered Punishment': 'Strafende Finger',
        'Flames Of Hate': 'Flammen des Hasses',
        'Greater Palm': 'Große Handfläche',
        'Might Of The Tengu': 'Fäuste des Tengu',
        'Mirage': 'Mirage',
        'Mount Huaguo': 'Huaguo',
        'Mountain Falls': 'Bergrutsch',
        'Mythmaker': 'Erdrütteln',
        'Second Heaven': 'Dreiunddreißig Himmel',
        'Splitting Hairs': 'Haarspalterei',
        'The Long End': 'Langes Ende',
        'The Short End': 'Kurzes Ende',
        'Tributary': 'Großer Fall',
        'Wile Of The Tengu': 'Tricks des Tengu',
        'Yama-Kagura': 'Yamakagura',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Daidarabotchi': 'Daidarabotchi',
        'Otengu': 'ô-tengu',
        'Qitian Dasheng': 'Qitian Dasheng',
        'Serenity': 'Sanctuaire de Jade',
        'Shadow Of The Sage': 'ombre de Qitian Dasheng',
        'Tengu Ember': 'tengu-bi',
        'The Dragon\'s Mouth': 'Porte de Dairyu',
        'The Heart Of The Dragon': 'Salle des Alignements',
      },
      'replaceText': {
        '\\?': ' ?',
        'Both Ends': 'Coup de bâton tournicotant',
        'Clout Of The Tengu': 'Tengu-kaze',
        'Equal Of Heaven': 'Égal des Cieux',
        'Five-Fingered Punishment': 'Mont Wuxing',
        'Flames Of Hate': 'Rancune furieuse',
        'Greater Palm': 'Paume colossale',
        'Might Of The Tengu': 'Tengu-tsubute',
        'Mirage': 'Mirage',
        'Mount Huaguo': 'Mont Haguo',
        'Mountain Falls': 'Raz-de-montagne',
        'Mythmaker': 'Grand bouleversement',
        'Second Heaven': 'Trayastrimsha',
        'Splitting Hairs': 'Dédoublement',
        'The Long End': 'Coup de bâton long',
        'The Short End': 'Coup de bâton court',
        'Tributary': 'Cascade colossale',
        'Wile Of The Tengu': 'Malice de tengu',
        'Yama-Kagura': 'Yama-kagura',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Daidarabotchi': 'ダイダラボッチ',
        'Otengu': 'オオテング',
        'Qitian Dasheng': 'セイテンタイセイ',
        'Serenity': '玉聖祠',
        'Shadow Of The Sage': 'セイテンタイセイの影',
        'Tengu Ember': '天狗火',
        'The Dragon\'s Mouth': '大龍関門',
        'The Heart Of The Dragon': '龍脈之間',
      },
      'replaceText': {
        'Both Ends': '如意大旋風',
        'Clout Of The Tengu': '天狗風',
        'Equal Of Heaven': '斉天撃',
        'Five-Fingered Punishment': '五行山',
        'Flames Of Hate': '怨念の炎',
        'Greater Palm': '大掌底',
        'Might Of The Tengu': '天狗礫',
        'Mirage': '蜃気楼',
        'Mount Huaguo': '花果山',
        'Mountain Falls': '山津波',
        'Mythmaker': '驚天動地',
        'Second Heaven': '三十三天',
        'Splitting Hairs': '地サツ数',
        'The Long End': '如意剛力突',
        'The Short End': '如意烈風突',
        'Tributary': '大瀑布',
        'Wile Of The Tengu': '天狗の仕業',
        'Yama-Kagura': '山神楽',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Daidarabotchi': '大太法师',
        'Otengu': '大天狗',
        'Qitian Dasheng': '齐天大圣',
        'Serenity': '玉圣祠',
        'Shadow Of The Sage': '齐天大圣的幻影',
        'Tengu Ember': '天狗火',
        'The Dragon\'s Mouth': '大龙关门',
        'The Heart Of The Dragon': '龙脉之间',
      },
      'replaceText': {
        'Both Ends': '如意大旋风',
        'Clout Of The Tengu': '天狗风',
        'Equal Of Heaven': '齐天击',
        'Five-Fingered Punishment': '五行山',
        'Flames Of Hate': '怨念之火',
        'Greater Palm': '掌击',
        'Might Of The Tengu': '天狗碾',
        'Mirage': 'Mirage',
        'Mount Huaguo': '花果山',
        'Mountain Falls': '泥石流',
        'Mythmaker': '惊天动地',
        'Second Heaven': '三十三天',
        'Splitting Hairs': '地煞数',
        'The Long End': '如意刚力突',
        'The Short End': '如意烈风突',
        'Tributary': '大瀑布',
        'Wile Of The Tengu': '天狗妙计',
        'Yama-Kagura': '山神乐',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Daidarabotchi': '다이다라봇치',
        'Otengu': '대텐구',
        'Qitian Dasheng': '제천대성',
        'Serenity': '옥성 사당',
        'Shadow Of The Sage': '제천대성의 분신',
        'Tengu Ember': '텐구불',
        'The Dragon\'s Mouth': '대룡 관문',
        'The Heart Of The Dragon': '용맥의 방',
      },
      'replaceText': {
        'Both Ends': '여의 대선풍',
        'Clout Of The Tengu': '회오리바람',
        'Equal Of Heaven': '제천격',
        'Five-Fingered Punishment': '오행산',
        'Flames Of Hate': '원념의 불꽃',
        'Greater Palm': '큰 손바닥',
        'Might Of The Tengu': '돌팔매',
        'Mirage': 'Mirage',
        'Mount Huaguo': '화과산',
        'Mountain Falls': '산해일',
        'Mythmaker': '경천동지',
        'Second Heaven': '삼십삼천',
        'Splitting Hairs': '분신술',
        'The Long End': '여의 강력 찌르기',
        'The Short End': '여의 열풍 찌르기',
        'Tributary': '대폭포',
        'Wile Of The Tengu': '텐구의 소행',
        'Yama-Kagura': '산타령',
      },
    },
  ],
};

export default triggerSet;
