import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

const wings = {
  // vfx/lockon/eff/m0829_cst19_9s_c0v.avfx
  topLeft: '01A5', // 82C2 cast and damage
  // vfx/lockon/eff/m0829_cst20_9s_c0v.avfx
  topRight: '01A6', // 82C1 cast and damage
  // vfx/lockon/eff/m0829_cst21_6s_c0v.avfx
  middleLeft: '01A7', // 82C4 damage
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  middleRight: '01A8', // 82C3 damage
  // vfx/lockon/eff/m0829_cst22_6s_c0v.avfx
  bottomLeft: '01B1', // 82C6 damage
  // vfx/lockon/eff/m0829_cst23_3s_c0v.avfx
  bottomRight: '01B2', // 82C5 damage
  // vfx/lockon/eff/m0829_cst24_3s_c0v.avfx
} as const;

const wingIds = Object.values(wings);

const wingOutputStrings = {
  // Sure, we could say "left" and "right" here, but folks are going to be mad
  // when the boss is (probably) facing the party during Unnatural Enchainment.
  // Personally, I think it's better to be consistent than to switch the
  // meaning of right and left mid-raid.  To make it more clear what this means,
  // these say "Left Flank" (i.e. the boss's left flank) vs "Left" which could
  // mean your left or the boss's left or that you've left off reading this.
  leftFlank: {
    en: 'Left Flank',
    de: 'Linke Flanke',
    fr: 'Flanc gauche',
    ja: '左',
    cn: '左翅膀',
    ko: '왼쪽',
  },
  rightFlank: {
    en: 'Right Flank',
    de: 'Rechte Flanke',
    fr: 'Flanc droit',
    ja: '右',
    cn: '右翅膀',
    ko: '오른쪽',
  },
} as const;

export interface Data extends RaidbossData {
  superchainCount: number;
  wingCollect: NetMatches['HeadMarker'][];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheTwelfthCircle',
  zoneId: ZoneId.AnabaseiosTheTwelfthCircle,
  timelineFile: 'p12n.txt',
  initData: () => {
    return {
      superchainCount: 0,
      wingCollect: [],
    };
  },
  triggers: [
    {
      id: 'P12N On the Soul',
      type: 'StartsUsing',
      netRegex: { id: '82D9', source: 'Athena', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P12N Wing Cleanup',
      type: 'StartsUsing',
      netRegex: { id: ['82C1', '82C2'], source: 'Athena', capture: false },
      run: (data) => data.wingCollect = [],
    },
    {
      id: 'P12N Wing Collect',
      type: 'HeadMarker',
      netRegex: { id: wingIds },
      durationSeconds: 5.5,
      infoText: (data, matches, output) => {
        data.wingCollect.push(matches);
        if (data.wingCollect.length !== 3)
          return;

        const [first, second, third] = data.wingCollect.map((x) => x.id);
        if (first === undefined || second === undefined || third === undefined)
          return;

        const firstStr = first === wings.topLeft ? output.right!() : output.left!();
        const secondStr = second === wings.middleLeft ? output.right!() : output.left!();
        const thirdStr = third === wings.bottomLeft ? output.right!() : output.left!();

        return output.text!({ first: firstStr, second: secondStr, third: thirdStr });
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        text: {
          en: '${first} => ${second} => ${third}',
          ja: '${first} => ${second} => ${third}',
          ko: '${first} 🔜 ${second} 🔜 ${third}',
        },
      },
    },
    {
      id: 'P12N First Wing',
      type: 'HeadMarker',
      netRegex: { id: [wings.topLeft, wings.topRight], capture: false },
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        const first = data.wingCollect[0]?.id;
        if (first === undefined)
          return;
        if (first === wings.topLeft)
          return output.rightFlank!();
        return output.leftFlank!();
      },
      outputStrings: wingOutputStrings,
    },
    {
      id: 'P12N Second Wing',
      type: 'Ability',
      netRegex: { id: ['82C1', '82C2'], source: 'Athena', capture: false },
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        const second = data.wingCollect[1]?.id;
        if (second === undefined)
          return;
        if (second === wings.middleLeft)
          return output.rightFlank!();
        return output.leftFlank!();
      },
      outputStrings: wingOutputStrings,
    },
    {
      id: 'P12N Third Wing',
      type: 'Ability',
      netRegex: { id: ['82C3', '82C4'], source: 'Athena', capture: false },
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        const third = data.wingCollect[2]?.id;
        if (third === undefined)
          return;
        if (third === wings.bottomLeft)
          return output.rightFlank!();
        return output.leftFlank!();
      },
      outputStrings: wingOutputStrings,
    },
    {
      id: 'P12N Glaukopis',
      type: 'StartsUsing',
      netRegex: { id: '82D5', source: 'Athena' },
      response: Responses.tankCleave('alert'),
    },
    {
      id: 'P12N Superchain Theory',
      type: 'StartsUsing',
      netRegex: { id: '82BC', source: 'Athena', capture: false },
      infoText: (data, _matches, output) => {
        data.superchainCount++;

        // 1, 2, 3, 4, 3, 4, 3, 4, etc
        const count = data.superchainCount > 3
          ? (data.superchainCount - 3) % 2 + 3
          : data.superchainCount;
        return {
          1: output.superchain1!(),
          2: output.superchain2!(),
          3: output.superchain3!(),
          4: output.superchain4!(),
        }[count];
      },
      outputStrings: {
        superchain1: {
          en: 'Follow Donut',
          ja: 'ドーナツへ',
          ko: '도넛 따라가요',
        },
        superchain2: {
          en: 'Short Donut => Long Donut',
          ja: '早ドーナツ => 遅ドーナツ',
          ko: '짧은 도넛 🔜 긴 도넛',
        },
        superchain3: {
          en: 'Follow Donut (avoid cleave)',
          ja: 'ボスの横からドーナツへ',
          ko: '도넛 따라가요 (가운데 공격 피해요)',
        },
        superchain4: {
          en: 'Avoid Spheres',
          ja: 'オブ回避',
          ko: '동글이들 피해요',
        },
      },
    },
    {
      id: 'P12N Parthenos',
      type: 'StartsUsing',
      netRegex: { id: '82D8', source: 'Athena', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'P12N Unnatural Enchainment',
      type: 'StartsUsing',
      netRegex: { id: '82BF', source: 'Athena', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid Chained Platforms',
          ja: '壊れそうなマス回避',
          ko: '연결된 장소 피해요',
        },
      },
    },
    {
      id: 'P12N Spread',
      // Used for both Palladion during add phase (no cast) and Dialogos (82D7).
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'P12N Dialogos Stack',
      type: 'StartsUsing',
      netRegex: { id: '82D6', source: 'Athena' },
      response: Responses.stackMarkerOn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Anthropos': 'Anthropos',
        'Athena': 'Athena',
        'Thymou Idea': 'Thymos',
      },
      'replaceText': {
        '\\(spread\\)': '(Verteilen)',
        '\\(stack\\)': '(Sammeln)',
        'Clear Cut': 'Klarer Schnitt',
        'Dialogos': 'Dialogos',
        'Glaukopis': 'Glaukopis',
        'On the Soul': 'Auf der Seele',
        'Palladion': 'Palladion',
        'Paradeigma': 'Paradigma',
        'Parthenos': 'Parthenos',
        'Ray of Light': 'Lichtstrahl',
        'Sample': 'Vielfraß',
        'Superchain Burst': 'Superkette - Ausbruch',
        'Superchain Coil': 'Superkette - Kreis',
        'Superchain Theory': 'Superkette - Theorie',
        'Theos\'s Ultima': 'Theos Ultima',
        'Trinity of Souls': 'Dreifaltigkeit der Seelen',
        'Ultima Blade': 'Ultima-Klinge',
        'Unnatural Enchainment': 'Seelenfessel',
        'White Flame': 'Weißes Feuer',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Anthropos': 'anthropos',
        'Athena': 'Athéna',
        'Thymou Idea': 'thymou idea',
      },
      'replaceText': {
        'Clear Cut': 'Tranchage balayant',
        'Dialogos': 'Dialogos',
        'Glaukopis': 'Glaukopis',
        'On the Soul': 'Sur les âmes',
        'Palladion': 'Palladion',
        'Paradeigma': 'Paradeigma',
        'Parthenos': 'Parthénon',
        'Ray of Light': 'Onde de lumière',
        'Sample': 'Voracité',
        'Superchain Burst': 'Salve des superchaînes',
        'Superchain Coil': 'Cercle des superchaînes',
        'Superchain Theory': 'Théorie des superchaînes',
        'Theos\'s Ultima': 'Ultima de théos',
        'Trinity of Souls': 'Âmes trinité',
        'Ultima Blade': 'Lames Ultima',
        'Unnatural Enchainment': 'Enchaînement d\'âmes',
        'White Flame': 'Feu blanc',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Anthropos': 'アンスロポス',
        'Athena': 'アテナ',
        'Thymou Idea': 'テューモス・イデア',
      },
      'replaceText': {
        'Clear Cut': '斬り払い',
        'Dialogos': 'ディアロゴス',
        'Glaukopis': 'グラウコピス',
        'On the Soul': 'オン・ザ・ソウル',
        'Palladion': 'パラディオン',
        'Paradeigma': 'パラデイグマ',
        'Parthenos': 'パルテノン',
        'Ray of Light': '光波',
        'Sample': '貪食',
        'Superchain Burst': 'スーパーチェイン・バースト',
        'Superchain Coil': 'スーパーチェイン・サークル',
        'Superchain Theory': 'スーパーチェイン・セオリー',
        'Theos\'s Ultima': 'テオス・アルテマ',
        'Trinity of Souls': 'トリニティ・ソウル',
        'Ultima Blade': 'アルテマブレイド',
        'Unnatural Enchainment': '魂の鎖',
        'White Flame': '白火',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Anthropos': '人',
        'Athena': '雅典娜',
        'Thymou Idea': '激情理念',
      },
      'replaceText': {
        '\\(spread\\)': '(分散)',
        '\\(stack\\)': '(分摊)',
        'Clear Cut': '横斩',
        'Dialogos': '对话',
        'Glaukopis': '明眸',
        'On the Soul': '论灵魂',
        'Palladion': '女神的护佑',
        'Paradeigma': '范式',
        'Parthenos': '贞女',
        'Ray of Light': '光波',
        'Sample': '贪食',
        'Superchain Burst': '超链爆发',
        'Superchain Coil': '超链回环',
        'Superchain Theory': '超链理论',
        'Theos\'s Ultima': '神之究极',
        'Trinity of Souls': '三魂一体',
        'Ultima Blade': '究极之刃',
        'Unnatural Enchainment': '灵魂链',
        'White Flame': '白火',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Anthropos': '人',
        'Athena': '雅典娜',
        'Thymou Idea': '激情理念',
      },
      'replaceText': {
        // '\\(spread\\)': '', // FIXME '(分散)'
        // '\\(stack\\)': '', // FIXME '(分摊)'
        'Clear Cut': '橫斬',
        'Dialogos': '對話',
        'Glaukopis': '明眸',
        'On the Soul': '論靈魂',
        'Palladion': '女神的護佑',
        'Paradeigma': '範式',
        'Parthenos': '貞女',
        'Ray of Light': '光波',
        'Sample': '貪食',
        'Superchain Burst': '超鏈爆發',
        'Superchain Coil': '超鏈回環',
        'Superchain Theory': '超鏈理論',
        'Theos\'s Ultima': '神之究極',
        'Trinity of Souls': '三魂一體',
        'Ultima Blade': '究極之刃',
        'Unnatural Enchainment': '靈魂鏈',
        'White Flame': '白火',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Anthropos': '안트로포스',
        'Athena': '아테나',
        'Thymou Idea': '기개의 이데아',
      },
      'replaceText': {
        '\\(spread\\)': '(산개)',
        '\\(stack\\)': '(쉐어)',
        'Clear Cut': '후려베기',
        'Dialogos': '디아로고스',
        'Glaukopis': '글라우코피스',
        'On the Soul': '영혼에 관하여',
        'Palladion': '팔라디온',
        'Paradeigma': '파라데이그마',
        'Parthenos': '파르테노스',
        'Ray of Light': '빛살',
        'Sample': '남식',
        'Superchain Burst': '초사슬 폭발',
        'Superchain Coil': '초사슬 고리',
        'Superchain Theory': '초사슬 이론',
        'Theos\'s Ultima': '테오스 알테마',
        'Trinity of Souls': '삼위일혼',
        'Ultima Blade': '알테마 블레이드',
        'Unnatural Enchainment': '영혼의 사슬',
        'White Flame': '하얀 불꽃',
      },
    },
  ],
};

export default triggerSet;
