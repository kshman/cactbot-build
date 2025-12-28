import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  orbCount: number;
  orbs: Map<'Fire' | 'Bio', number>;
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheTowerOfZot',
  zoneId: ZoneId.TheTowerOfZot,
  timelineFile: 'the_tower_of_zot.txt',
  initData: () => {
    return {
      orbCount: 0,
      orbs: new Map<'Fire' | 'Bio', number>(),
    };
  },
  triggers: [
    {
      id: 'Zot Minduruva Bio',
      type: 'StartsUsing',
      // 62CA in the final phase.
      netRegex: { id: ['62A9', '62CA'], source: 'Minduruva' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Zot Minduruva Transmute Counter',
      type: 'StartsUsing',
      // 629A = Transmute Fire III
      // 631B = Transmute Blizzard III
      // 631C = Transmute Thunder III
      // 631D = Transmute Bio III
      netRegex: { id: ['629A', '631[BCD]'], source: 'Minduruva' },
      run: (data, matches) => {
        const transmuteFire = '629A';
        const transmuteBio = '631D';

        data.orbCount++;

        // We only expect one of these at once
        if (matches.id === transmuteFire)
          data.orbs.set('Fire', data.orbCount);
        else if (matches.id === transmuteBio)
          data.orbs.set('Bio', data.orbCount);
      },
    },
    {
      id: 'Zot Minduruva Manusya III',
      type: 'StartsUsing',
      // 6291 = Manusya Fire III
      // 6292 = Manusya Blizzard III
      // 6293 = Manusya Thunder III
      // 6294 = Manusya Bio III
      netRegex: { id: ['629[1-4]'], source: 'Minduruva' },
      durationSeconds: (data) => {
        // Based on network log data analysis, the first orb will finish
        // 8 seconds after this cast started, while the second orb will
        // finish 12 seconds after this cast started.
        //
        // For simplicity, if we have an overlapping mechanic, use a
        // duration of 12 to keep this alert up long enough to cover all
        // cases.
        if (data.orbs.size > 0)
          return 12;
      },
      alertText: (data, matches, output) => {
        const fire = '6291';
        const blizzard = '6292';
        const thunder = '6293';
        const bio = '6294';

        if (matches.id === blizzard || matches.id === thunder) {
          if (data.orbs.has('Fire'))
            return output.fireOrb!({ num: data.orbs.get('Fire') });
          else if (data.orbs.has('Bio'))
            return output.bioOrb!({ num: data.orbs.get('Bio') });
        } else if (matches.id === fire) {
          if (data.orbs.has('Bio'))
            return output.fireThenBio!({ num: data.orbs.get('Bio') });

          return output.getUnder!();
        } else if (matches.id === bio) {
          if (data.orbs.has('Fire'))
            return output.bioThenFire!({ num: data.orbs.get('Fire') });

          return output.getBehind!();
        }
      },
      outputStrings: {
        fireOrb: {
          en: 'Under Orb ${num}',
          ja: '${num}番目の玉へ',
          ko: '${num}번 구슬 아래로',
        },
        bioOrb: {
          en: 'Behind Orb ${num}',
          ja: '${num}番目の玉の後ろへ',
          ko: '${num}번 구슬 뒤로',
        },
        fireThenBio: {
          en: 'Get Under => Behind Orb ${num}',
          ja: 'ボスに貼り付く=> ${num}番目の玉の後ろへ',
          ko: '밑에 있다가 🔜 ${num}번 구슬 뒤로',
        },
        bioThenFire: {
          en: 'Get Behind => Under Orb ${num}',
          ja: '背面へ => ${num}番目の玉へ',
          ko: '뒤에 있다가 🔜 ${num}번 구슬 밑으로',
        },
        getUnder: Outputs.getUnder,
        getBehind: Outputs.getBehind,
      },
    },
    {
      id: 'Zot Minduruva Dhrupad Reset',
      type: 'StartsUsing',
      netRegex: { id: '629C', source: 'Minduruva', capture: false },
      // There's a Dhrupad cast after every transmute sequence.
      run: (data) => {
        data.orbCount = 0;
        data.orbs = new Map<'Fire' | 'Bio', number>();
      },
    },
    {
      id: 'Zot Sanduruva Isitva Siddhi',
      type: 'StartsUsing',
      // 62A9 is 2nd boss, 62C0 is 3rd boss.
      netRegex: { id: ['62A9', '62C0'], source: 'Sanduruva' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Zot Sanduruva Manusya Berserk',
      type: 'Ability',
      // 62A1 is 2nd boss, 62BC in the 3rd boss.
      netRegex: { id: ['62A1', '62BC'], source: 'Sanduruva', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go behind empty spot',
          ja: '玉のない箇所へ',
          ko: '빈 스팟 벽쪽으로',
        },
      },
    },
    {
      id: 'Zot Sanduruva Manusya Confuse',
      type: 'StartsUsing',
      netRegex: { id: '62A5', source: 'Sanduruva', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go behind still clone',
          ja: '動いていないドグの後ろへ',
          ko: '움직이지 않는 클론 뒤로',
        },
      },
    },
    {
      id: 'Zot Cinduruva Samsara',
      type: 'StartsUsing',
      netRegex: { id: '62B9', source: 'Cinduruva', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Zot Cinduruva Isitva Siddhi',
      type: 'StartsUsing',
      netRegex: { id: '62A9', source: 'Cinduruva' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Zot Cinduruva Delta Thunder III Stack',
      type: 'StartsUsing',
      netRegex: { id: '62B8', source: 'Cinduruva' },
      response: Responses.stackMarkerOn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Berserker Sphere': 'Tollwutssphäre',
        'Cinduruva': 'Mug',
        'Ingenuity\'s Ingress': 'Gelass der Finesse',
        'Minduruva': 'Rug',
        'Prosperity\'S Promise': 'Gelass des Reichtums',
        'Sanduruva': 'Dug',
        'Wisdom\'S Ward': 'Gelass der Weisheit',
      },
      'replaceText': {
        'Cinduruva': 'Mug',
        'Sanduruva': 'Dug',
        'Delayed Element III': 'Verzögertes Element-ga',
        'Delayed Thunder III': 'Verzögertes Blitzga',
        'Delta Attack': 'Delta-Attacke',
        'Delta Blizzard/Fire/Thunder III': 'DeltaEisga/Feuga/Blitzga',
        'Dhrupad': 'Dhrupad',
        'Explosive Force': 'Zündung',
        'Isitva Siddhi': 'Isitva Siddhi',
        'Manusya Berserk': 'Manusya-Tollwut',
        'Manusya Bio(?! )': 'Manusya-Bio',
        'Manusya Bio III': 'Manusya-Bioga',
        'Manusya Blizzard(?! )': 'Manusya-Eis',
        'Manusya Blizzard III': 'Manusya-Eisga',
        'Manusya Confuse': 'Manusya-Konfus',
        'Manusya Element III': 'Manusya Element-ga',
        'Manusya Faith': 'Manusya-Ener',
        'Manusya Fire(?! )': 'Manusya-Feuer',
        'Manusya Fire III': 'Manusya-Feuga',
        'Manusya Reflect': 'Manusya-Reflektion',
        'Manusya Stop': 'Manusya-Stopp',
        'Manusya Thunder(?! )': 'Manusya-Blitz',
        'Manusya Thunder III': 'Manusya-Blitzga',
        'Prakamya Siddhi': 'Prakamya Siddhi',
        'Prapti Siddhi': 'Prapti Siddhi',
        'Samsara': 'Samsara',
        'Sphere Shatter': 'Sphärensplitterung',
        'Transmute Thunder III': 'Manipuliertes Blitzga',
        'Transmute Element III': 'Manipuliertes Element-ga',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Berserker Sphere': 'sphère berserk',
        'Cinduruva': 'Maria',
        'Ingenuity\'s Ingress': 'Chambre de l\'habileté',
        'Minduruva': 'Anabella',
        'Prosperity\'S Promise': 'Chambre de la fortune',
        'Sanduruva': 'Samanta',
        'Wisdom\'S Ward': 'Chambre de la sagesse',
      },
      'replaceText': {
        'Cinduruva': 'Maria',
        'Delayed Element III': 'Méga Élément retardé',
        'Delayed Thunder III': 'Méga Foudre retardé',
        'Delta Attack': 'Attaque Delta',
        'Delta Blizzard/Fire/Thunder III': 'Méga Glace/Feu/Foudre delta',
        'Dhrupad': 'Dhrupad',
        'Explosive Force': 'Détonation',
        'Isitva Siddhi': 'Isitva Siddhi',
        'Manusya Berserk': 'Berserk manusya',
        'Manusya Bio(?! )': 'Bactérie manusya',
        'Manusya Bio III': 'Méga Bactérie manusya',
        'Manusya Blizzard(?! )': 'Glace manusya',
        'Manusya Blizzard III': 'Méga Glace manusya',
        'Manusya Confuse': 'Confusion manusya',
        'Manusya Element III': 'Méga Élément manusya',
        'Manusya Faith': 'Foi manusya',
        'Manusya Fire(?! )': 'Feu manusya',
        'Manusya Fire III': 'Méga Feu manusya',
        'Manusya Reflect': 'Reflet manusya',
        'Manusya Stop': 'Stop manusya',
        'Manusya Thunder(?! )': 'Foudre manusya',
        'Manusya Thunder III': 'Méga Foudre manusya',
        'Prakamya Siddhi': 'Prakamya Siddhi',
        'Prapti Siddhi': 'Prapti Siddhi',
        'Samsara': 'Samsara',
        'Sanduruva': 'Samanta',
        'Sphere Shatter': 'Rupture',
        'Transmute Element III': 'Manipulation magique : Méga Élément',
        'Transmute Thunder III': 'Manipulation magique : Méga Foudre',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Berserker Sphere': 'バーサクスフィア',
        'Cinduruva': 'マグ',
        'Ingenuity\'s Ingress': '技巧の間',
        'Minduruva': 'ラグ',
        'Prosperity\'S Promise': '富の間',
        'Sanduruva': 'ドグ',
        'Wisdom\'S Ward': '知恵の間',
      },
      'replaceText': {
        'Delayed Element III': '玉：？？？ガ',
        'Delta Attack': 'デルタアタック',
        'Delta Blizzard/Fire/Thunder III': 'デルタ・ブリザガ/ファイガ/サンダガ',
        'Dhrupad': 'ドゥルパド',
        'Explosive Force': '起爆',
        'Isitva Siddhi': 'イシトヴァシッディ',
        'Manusya Berserk': 'マヌシャ・バーサク',
        'Manusya Bio(?! )': 'マヌシャ・バイオ',
        'Manusya Bio III': 'マヌシャ・バイオガ',
        'Manusya Blizzard(?! )': 'マヌシャ・ブリザド',
        'Manusya Blizzard III': 'マヌシャ・ブリザガ',
        'Manusya Confuse': 'マヌシャ・コンフュ',
        'Manusya Element III': 'マヌシャ・？？？ガ',
        'Manusya Faith': 'マヌシャ・フェイス',
        'Manusya Fire(?! )': 'マヌシャ・ファイア',
        'Manusya Fire III': 'マヌシャ・ファイガ',
        'Manusya Reflect': 'マヌシャ・リフレク',
        'Manusya Stop': 'マヌシャ・ストップ',
        'Manusya Thunder(?! )': 'マヌシャ・サンダー',
        'Manusya Thunder III': 'マヌシャ・サンダガ',
        'Prakamya Siddhi': 'プラカーミャシッディ',
        'Prapti Siddhi': 'プラプティシッディ',
        'Samsara': 'サンサーラ',
        'Sphere Shatter': '破裂',
        'Transmute Element III': '魔力操作：？？？ガ',
        'Transmute Thunder III': '魔力操作：サンダガ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Berserker Sphere': '狂暴晶球',
        'Cinduruva': '马格',
        'Ingenuity\'s Ingress': '技巧之间',
        'Minduruva': '拉格',
        'Prosperity\'S Promise': '财富之间',
        'Prosperity\'s Promise': '财富之间',
        'Sanduruva': '多格',
        'Wisdom\'S Ward': '智慧之间',
        'Wisdom\'s Ward': '智慧之间',
      },
      'replaceText': {
        'Cinduruva': '马格',
        'Delayed Element III': '延迟元素',
        'Delayed Thunder III': '延迟暴雷',
        'Delta Attack': '三角攻击',
        'Delta Blizzard/Fire/Thunder III': '三角冰封/爆炎/暴雷',
        'Dhrupad': '德鲁帕德',
        'Explosive Force': '起爆',
        'Isitva Siddhi': '物创灭',
        'Manusya Berserk': '人趣狂暴',
        'Manusya Bio(?! )': '人趣毒菌',
        'Manusya Bio III': '人趣剧毒菌',
        'Manusya Blizzard(?! )': '人趣冰结',
        'Manusya Blizzard III': '人趣冰封',
        'Manusya Confuse': '人趣混乱',
        'Manusya Element III': '人趣元素',
        'Manusya Faith': '人趣信念',
        'Manusya Fire(?! )': '人趣火炎',
        'Manusya Fire III': '人趣爆炎',
        'Manusya Reflect': '人趣反射',
        'Manusya Stop': '人趣停止',
        'Manusya Thunder(?! )': '人趣闪雷',
        'Manusya Thunder III': '人趣暴雷',
        'Prakamya Siddhi': '大愿成',
        'Prapti Siddhi': '身所达',
        'Samsara': '轮回',
        'Sanduruva': '多格',
        'Sphere Shatter': '碎裂',
        'Transmute Element III': '魔力操纵：元素',
        'Transmute Thunder III': '魔力操纵：暴雷',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Berserker Sphere': '狂暴晶球',
        'Cinduruva': '馬格',
        'Ingenuity\'s Ingress': '技巧之間',
        'Minduruva': '拉格',
        'Prosperity\'S Promise': '財富之間',
        'Prosperity\'s Promise': '財富之間',
        'Sanduruva': '多格',
        'Wisdom\'S Ward': '智慧之間',
        'Wisdom\'s Ward': '智慧之間',
      },
      'replaceText': {
        'Cinduruva': '馬格',
        'Delayed Element III': '人趣大火焰',
        // 'Delayed Thunder III': '', // FIXME '延迟暴雷'
        'Delta Attack': '三角攻擊',
        // 'Delta Blizzard/Fire/Thunder III': '', // FIXME '三角冰封/爆炎/暴雷'
        'Dhrupad': '德魯帕德',
        'Explosive Force': '起爆',
        'Isitva Siddhi': '物創滅',
        'Manusya Berserk': '人趣狂暴',
        'Manusya Bio(?! )': '人趣毒化',
        'Manusya Bio III': '人趣重度毒化',
        'Manusya Blizzard(?! )': '人趣暴雪',
        'Manusya Blizzard III': '人趣大暴雪',
        'Manusya Confuse': '人趣混亂',
        'Manusya Element III': '人趣大火焰',
        'Manusya Faith': '人趣信念',
        'Manusya Fire(?! )': '人趣火焰',
        'Manusya Fire III': '人趣大火焰',
        'Manusya Reflect': '人趣反射',
        'Manusya Stop': '人趣停止',
        'Manusya Thunder(?! )': '人趣雷電',
        'Manusya Thunder III': '人趣大雷電',
        'Prakamya Siddhi': '大願成',
        'Prapti Siddhi': '身所達',
        'Samsara': '輪迴',
        'Sanduruva': '多格',
        'Sphere Shatter': '碎裂',
        // 'Transmute Element III': '', // FIXME '魔力操纵：元素'
        'Transmute Thunder III': '魔力操縱：大雷電',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Berserker Sphere': '광폭화 구체',
        'Cinduruva': '마그',
        'Ingenuity\'s Ingress': '기교의 방',
        'Minduruva': '라그',
        'Prosperity\'S Promise': '부의 방',
        'Sanduruva': '도그',
        'Wisdom\'S Ward': '지혜의 방',
        'Prosperity\'s Promise': '부의 방',
        'Wisdom\'s Ward': '지혜의 방',
      },
      'replaceText': {
        'Cinduruva': '마그',
        'Sanduruva': '도그',
        'Delayed Element III': '지연 랜덤 마법',
        'Delayed Thunder III': '지연 선더가',
        'Delta Attack': '델타 공격',
        'Delta Blizzard/Fire/Thunder III': '델타 블리자가/파이가/선더가',
        'Dhrupad': '드루파드',
        'Explosive Force': '기폭',
        'Isitva Siddhi': '이시트바 싯디',
        'Manusya Berserk': '마누샤 광폭화',
        'Manusya Bio(?! )': '마누샤 바이오',
        'Manusya Bio III': '마누샤 바이오가',
        'Manusya Blizzard(?! )': '마누샤 블리자드',
        'Manusya Blizzard III': '마누샤 블리자가',
        'Manusya Confuse': '마누샤 혼란',
        'Manusya Element III': '마누샤 랜덤 마법',
        'Manusya Faith': '마누샤 신앙',
        'Manusya Fire(?! )': '마누샤 파이어',
        'Manusya Fire III': '마누샤 파이가',
        'Manusya Reflect': '마누샤 리플렉트',
        'Manusya Stop': '마누샤 정지',
        'Manusya Thunder(?! )': '마누샤 선더',
        'Manusya Thunder III': '마누샤 선더가',
        'Prakamya Siddhi': '프라카먀 싯디',
        'Prapti Siddhi': '프랍티 싯디',
        'Samsara': '삼사라',
        'Sphere Shatter': '파열',
        'Transmute Element III': '마력 조작: 랜덤 마법',
        'Transmute Thunder III': '마력 조작: 선더가',
      },
    },
  ],
};

export default triggerSet;
