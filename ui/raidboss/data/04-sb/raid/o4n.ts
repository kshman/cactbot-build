import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  battleCount?: number;
}

// O4N - Deltascape 4.0 Normal
const triggerSet: TriggerSet<Data> = {
  id: 'DeltascapeV40',
  zoneId: ZoneId.DeltascapeV40,
  timelineFile: 'o4n.txt',
  triggers: [
    {
      id: 'O4N Doom',
      type: 'StartsUsing',
      netRegex: { id: '24B7', source: 'Exdeath', capture: false },
      condition: (data) => data.CanCleanse(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Cleanse Doom soon',
          ja: '死の宣告にエスナ',
          ko: '곧 둠, 에스나',
        },
      },
    },
    {
      id: 'O4N Standard Thunder',
      type: 'StartsUsing',
      netRegex: { id: '24BD', source: 'Exdeath' },
      response: Responses.tankCleave(),
    },
    {
      id: 'O4N Standard Fire',
      type: 'StartsUsing',
      netRegex: { id: '24BA', source: 'Exdeath', capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'O4N Empowered Blizzard',
      type: 'StartsUsing',
      netRegex: { id: '24C0', source: 'Exdeath', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move around',
          ja: '動き続ける',
          ko: '얼음: 계속 움직여요',
        },
      },
    },
    {
      id: 'O4N Empowered Fire',
      type: 'StartsUsing',
      netRegex: { id: '24BF', source: 'Exdeath', capture: false },
      response: Responses.stopEverything(),
    },
    {
      id: 'O4N Empowered Thunder',
      type: 'StartsUsing',
      netRegex: { id: '24C1', source: 'Exdeath', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'O4N Decisive Battle ',
      type: 'StartsUsing',
      netRegex: { id: '2408', source: 'Exdeath', capture: false },
      condition: (data) => {
        // Without a condition, this notifies on the first one, where it's meaningless.
        data.battleCount = (data.battleCount ?? 0) + 1;
        return data.battleCount > 1;
      },
      delaySeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stand in the gap',
          ja: '狭間に',
          ko: '빈 틈으로',
        },
      },
    },
    {
      id: 'O4N Zombie Breath',
      type: 'StartsUsing',
      netRegex: { id: '240A', source: 'Exdeath', capture: false },
      delaySeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Behind head--Avoid zombie breath',
          ja: '頭の後ろに - ゾンビブレス来るぞ',
          ko: '머리 뒤로 - 좀비 트름 피해요',
        },
      },
    },
    {
      id: 'O4N Black Hole',
      type: 'StartsUsing',
      netRegex: { id: '24C8', source: 'Exdeath', target: 'Exdeath', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid black holes',
          ja: 'ブラックホールから離れる',
          ko: '블랙홀 피해요',
        },
      },
    },
    {
      id: 'O4N Vacuum Wave',
      type: 'StartsUsing',
      netRegex: { id: '24B8', source: 'Exdeath', target: 'Exdeath', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'O4N Flare',
      type: 'HeadMarker',
      netRegex: { id: '0057' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Flare on YOU',
          ja: '自分にフレア',
          ko: '내게 플레어',
        },
      },
    },
    {
      id: 'O4N Holy',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'O4N Meteor',
      type: 'StartsUsing',
      netRegex: { id: '24C6', source: 'Exdeath', capture: false },
      response: Responses.bigAoe(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Deathly Vine': 'Seelenbaumranke',
        'Exdeath': 'Exdeath',
      },
      'replaceText': {
        '\\(Buster\\)': '(Tankbuster)',
        'Black Hole': 'Schwarzes Loch',
        'Blizzard/Fire III': 'Eisga/Feuga',
        'Clearout': 'Kreisfeger',
        'Collision': 'Aufprall',
        'Doom': 'Verhängnis',
        'Flare': 'Flare',
        'Holy': 'Sanctus',
        'Mega Blizzard/Fire/Thunder': 'Eisga/Feuga/Blitzga ++',
        'Meteor': 'Meteor',
        'The Decisive Battle': 'Entscheidungsschlacht',
        '(?<!/)Thunder III': 'Blitzga',
        'Vacuum Wave': 'Vakuumwelle',
        'Zombie Breath': 'Zombie-Atem',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Deathly Vine': 'Lierre mortuaire',
        'Exdeath': 'Exdeath',
      },
      'replaceText': {
        '\\?': ' ?',
        '\\(Buster\\)': '(Tank buster)',
        'Black Hole': 'Trou noir',
        'Blizzard/Fire III': 'Méga Glace/Feu',
        'Clearout': 'Fauchage',
        'Collision': 'Impact',
        'Doom': 'Glas',
        'Flare': 'Brasier',
        'Holy': 'Miracle',
        'Mega Blizzard/Fire/Thunder': 'Extra Glace/Feu/Foudre',
        'Meteor': 'Météore',
        'The Decisive Battle': 'Combat décisif',
        '(?<!/)Thunder III': 'Méga Foudre',
        'Vacuum Wave': 'Vague de vide',
        'Zombie Breath': 'Haleine zombie',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Deathly Vine': '霊樹の蔦',
        'Exdeath': 'エクスデス',
      },
      'replaceText': {
        'Black Hole': 'ブラックホール',
        'Blizzard/Fire III': 'ブリザガ/ファイガ',
        'Clearout': 'なぎ払い',
        'Collision': '衝撃',
        'Doom': '死の宣告',
        'Flare': 'フレア',
        'Holy': 'ホーリー',
        'Mega Blizzard/Fire/Thunder': 'ブリザガ/ファイガ/サンダガ ++',
        'Meteor': 'メテオ',
        'The Decisive Battle': '決戦',
        '(?<!/)Thunder III': 'サンダガ',
        'Vacuum Wave': '真空波',
        'Zombie Breath': 'ゾンビブレス',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Deathly Vine': '灵树藤',
        'Exdeath': '艾克斯迪司',
      },
      'replaceText': {
        'Black Hole': '黑洞',
        'Blizzard/Fire III': '冰封/爆炎',
        'Clearout': '横扫',
        'Collision': '冲击',
        'Doom': '死亡宣告',
        'Flare': '核爆',
        'Holy': '神圣',
        'Mega Blizzard/Fire/Thunder': '冰封/爆炎/暴雷（强化）',
        'Meteor': '陨石',
        'The Decisive Battle': '决战',
        '(?<!/)Thunder III': '暴雷',
        'Vacuum Wave': '真空波',
        'Zombie Breath': '死亡吐息',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Deathly Vine': '靈樹藤',
        'Exdeath': '艾克斯迪司',
      },
      'replaceText': {
        'Black Hole': '黑洞',
        'Blizzard/Fire III': '大暴雪/大火焰',
        'Clearout': '橫掃',
        'Collision': '衝擊',
        'Doom': '死亡宣告',
        'Flare': '火光',
        'Holy': '神聖',
        'Mega Blizzard/Fire/Thunder': '大暴雪/大火焰/大雷電（強化）',
        'Meteor': '隕石',
        'The Decisive Battle': '決戰',
        '(?<!/)Thunder III': '大雷電',
        'Vacuum Wave': '真空波',
        'Zombie Breath': '殭屍吐息',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Deathly Vine': '영목 덩굴',
        'Exdeath': '엑스데스',
      },
      'replaceText': {
        'Black Hole': '블랙홀',
        'Blizzard/Fire III': '블리자가/파이가',
        'Clearout': '휩쓸기',
        'Collision': '충격',
        'Doom': '죽음의 선고',
        'Flare': '플레어',
        'Holy': '홀리',
        'Mega Blizzard/Fire/Thunder': '블리자가/파이가/선더가 ++',
        'Meteor': '메테오',
        'The Decisive Battle': '결전',
        '(?<!/)Thunder III': '선더가',
        'Vacuum Wave': '진공파',
        'Zombie Breath': '좀비 숨결',
      },
    },
  ],
};

export default triggerSet;
