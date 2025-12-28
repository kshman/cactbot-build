import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  holyTargets?: string[];
  holyCounter: number;
  gameCount: number;

  // Indexing phases at 1 so as to make phases match what humans expect.
  // 1: We start here.
  // 2: Cave phase with Uplifts.
  // 3: Post-intermission, with good and bad frogs.
  phaseNumber: number;
}

// O3 - Deltascape 3.0 Normal
const triggerSet: TriggerSet<Data> = {
  id: 'DeltascapeV30',
  zoneId: ZoneId.DeltascapeV30,
  timelineFile: 'o3n.txt',
  initData: () => {
    return {
      holyCounter: 0,
      gameCount: 0,
      phaseNumber: 1,
    };
  },
  timelineTriggers: [
    {
      id: 'O3N Frost Breath',
      regex: /Frost Breath/,
      beforeSeconds: 4,
      response: Responses.tankCleave('alert'),
    },
  ],
  triggers: [
    {
      id: 'O3N Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: '2304', source: 'Halicarnassus', capture: false },
      run: (data) => data.phaseNumber += 1,
    },
    {
      // Normal spellblade holy with one stack point.
      // "64" is a stack marker.  "65" is the prey marker.
      // The debuff order in the logs is:
      //   (1) stack marker
      //   (2) prey marker
      //   (3) prey marker
      id: 'O3N Spellblade Holy Standard',
      type: 'HeadMarker',
      netRegex: { id: ['0064', '0065'] },
      condition: (data, matches) => {
        // Cave phase has no stack markers.
        if (data.phaseNumber === 2)
          return false;

        data.holyTargets ??= [];
        data.holyTargets.push(matches.target);
        return data.holyTargets.length === 3;
      },
      alertText: (data, _matches, output) => {
        if (data.holyTargets?.[0] === data.me)
          return output.stackOnYou!();

        for (let i = 1; i < 3; i++) {
          if (data.holyTargets?.[i] === data.me)
            return output.out!();
        }
        return output.stackOnHolytargets!({ player: data.holyTargets?.[0] });
      },
      run: (data) => delete data.holyTargets,
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        out: {
          en: 'Out',
          ja: '外へ',
          ko: '밖으로',
        },
        stackOnHolytargets: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'O3N Spellblade Holy Cave',
      type: 'HeadMarker',
      netRegex: { id: '0065' },
      condition: (data, matches) => data.phaseNumber === 2 && data.me === matches.target,
      response: Responses.spread(),
    },
    {
      id: 'O3N Spellblade Holy Mindjack',
      type: 'HeadMarker',
      netRegex: { id: '0064' },
      condition: (data) => {
        if (data.phaseNumber < 3)
          return false;
        return data.holyCounter % 2 === 0;
      },
      response: Responses.stackMarkerOn(),
      run: (data) => {
        data.holyCounter += 1;
        delete data.holyTargets;
      },
    },
    {
      id: 'O3N The Queen\'s Waltz: Crystal Square',
      type: 'StartsUsing',
      netRegex: { id: '2471', source: 'Halicarnassus', capture: false },
      infoText: (_data, _matches, output) => output.getOnCrystalSquare!(),
      tts: (_data, _matches, output) => output.blueSquare!(),
      outputStrings: {
        getOnCrystalSquare: {
          en: 'Get on crystal square',
          ja: '青い床に',
          ko: '🟦파란 크리스탈 장판으로',
        },
        blueSquare: {
          en: 'blue square',
          ja: '青い床',
          ko: '🟦파란 장판',
        },
      },
    },
    {
      id: 'O3N Great Dragon',
      type: 'AddedCombatant',
      netRegex: { name: 'Great Dragon', capture: false },
      condition: (data) => data.role === 'tank',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Grab dragon',
          ja: 'ドラゴンを取って',
          ko: '용부터 잡아요',
        },
      },
    },
    {
      id: 'O3N Game Counter Initialize',
      type: 'StartsUsing',
      netRegex: { id: '2304', source: 'Halicarnassus', capture: false },
      run: (data) => data.gameCount = 1,
    },
    {
      id: 'O3N Good Ribbit',
      type: 'StartsUsing',
      netRegex: { id: '2466', source: 'Halicarnassus', capture: false },
      condition: (data) => data.phaseNumber === 3 && data.gameCount % 2 === 0,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get hit by Ribbit',
          ja: 'クルルルルを受ける',
          ko: '개굴 맞아요',
        },
      },
    },
    {
      id: 'O3N Bad Ribbit',
      type: 'StartsUsing',
      netRegex: { id: '2466', source: 'Halicarnassus', capture: false },
      condition: (data) => !(data.phaseNumber === 3 && data.gameCount % 2 === 0),
      response: Responses.awayFromFront(),
    },
    {
      id: 'O3N The Game',
      type: 'StartsUsing',
      netRegex: { id: '246D', source: 'Halicarnassus', capture: false },
      // No point in checking whether the user has the frog debuff,
      // if they didn't get it, or got it when they shouldn't have, there's no fixing things.
      infoText: (data, _matches, output) => {
        if (data.phaseNumber === 3 && data.gameCount % 2 === 0)
          return output.standOnFrogTile!();

        // Maybe there's a cleaner way to do this than just enumerating roles?
        if (data.role === 'tank')
          return output.standOnShield!();

        if (data.role === 'healer')
          return output.standOnCross!();

        if (data.role === 'dps')
          return output.standOnSword!();
      },
      run: (data) => data.gameCount += 1,
      outputStrings: {
        standOnFrogTile: {
          en: 'Stand on frog tile',
          ja: 'カエルパネルを踏む',
          ko: '개굴 타일 밟아요',
        },
        standOnShield: {
          en: 'Stand on shield',
          ja: 'タンクパネルを踏む',
          ko: '탱크 방패 밟아요',
        },
        standOnCross: {
          en: 'Stand on cross',
          ja: 'ヒーラーパネルを踏む',
          ko: '힐러 십자 밟아요',
        },
        standOnSword: {
          en: 'Stand on sword',
          ja: 'DPSパネルを踏む',
          ko: 'DPS 칼 밟아요',
        },
      },
    },
    {
      id: 'O3N Mindjack Forward',
      type: 'StartsUsing',
      netRegex: { id: '2467', source: 'Halicarnassus', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mindjack: Forward',
          ja: 'マインドジャック: 前進',
          ko: '강제이동: 앞쪽',
        },
      },
    },
    {
      id: 'O3N Mindjack Backward',
      type: 'StartsUsing',
      netRegex: { id: '2468', source: 'Halicarnassus', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mindjack: Back',
          ja: 'マインドジャック: 後退',
          ko: '강제이동: 뒤쪽',
        },
      },
    },
    {
      id: 'O3N Mindjack Left',
      type: 'StartsUsing',
      netRegex: { id: '2469', source: 'Halicarnassus', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mindjack: Left',
          ja: 'マインドジャック: 左折',
          ko: '강제이동: 왼쪽',
        },
      },
    },
    {
      id: 'O3N Mindjack Right',
      type: 'StartsUsing',
      netRegex: { id: '246A', source: 'Halicarnassus', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mindjack: Right',
          ja: 'マインドジャック: 右折',
          ko: '강제이동: 오른쪽',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Aetherial Tear': 'Ätherspalt',
        'Great Dragon': 'Riesendrache',
        'Halicarnassus': 'Halikarnassos',
        'Soul Reaper': 'Seelenschnitter',
      },
      'replaceText': {
        '\\(avoid\\)': '(ausweichen)',
        '\\(Starry End\\)': '(Sternhimmel Ende)',
        '\\(symbols\\)': '(Symbole)',
        '\\(take\\)': '(drin stehen)',
        '\\(toad\\)': '(Frosch)',
        'Aetherial Pull': 'Einsaugen',
        'Aetherial Tear': 'Ätherspalt',
        'Cross Reaper': 'Sensenschwung',
        'Dimensional Wave': 'Dimensionswelle',
        'Frost Breath': 'Frostiger Atem',
        'Gusting Gouge': 'Meißelstoß',
        'Holy Blur': 'Heiliger Nebel',
        'Holy Edge': 'Heiliger Grat',
        'Mindjack': 'Geistlenkung',
        'Panel Swap': 'Neuaufstellung',
        'Place Dark Token': 'Todesspielstein',
        'Place Token': 'Spielstein',
        'Ribbit': 'Quaaak',
        'Spellblade Blizzard III': 'Magieklinge Eisga',
        'Spellblade Fire III': 'Magieklinge Feuga',
        'Spellblade Holy': 'Magieklinge Sanctus',
        'Spellblade Thunder III': 'Magieklinge Blitzga',
        'Sword Dance': 'Schwerttanz',
        'The Game': 'Spielbeginn',
        'The Playing Field': 'Spielfeld',
        'The Queen\'s Waltz': 'Tanz der Königin',
        'Ultimum': 'Ende der Dimension',
        'Uplift': 'Erhöhung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Aetherial Tear': 'Déchirure dimensionnelle',
        'Great Dragon': 'dragon suprême',
        'Halicarnassus': 'Halicarnasse',
        'Soul Reaper': 'faucheur d\'âmes',
      },
      'replaceText': {
        '\\(avoid\\)': '(éviter)',
        '\\(Starry End\\)': '(Fin étoilée)',
        '\\(Sword Dance\\)': '(Danse du sabre)',
        '\\(symbols\\)': '(symboles)',
        '\\(take\\)': '(prendre)',
        '\\(toad\\)': '(crapaud)',
        '\\(Uplift\\)': '(Exhaussement)',
        'Aetherial Pull': 'Aspiration',
        'Aetherial Tear': 'Déchirure dimensionnelle',
        'Cross Reaper': 'Fauchaison',
        'Dimensional Wave': 'Onde dimensionnelle',
        'Frost Breath\\?': 'Souffle glacé ?',
        'Gusting Gouge': 'Gouge cisaillante',
        'Holy Blur': 'Brume sacrée',
        'Holy Edge': 'Taille sacrée',
        'Mindjack': 'Contrainte mentale',
        'Panel Swap': 'Remplacement des cases',
        'Place Dark Token': 'Pions obscurs en jeu',
        'Place Token': 'Pion en jeu',
        'Ribbit': 'Coâââ',
        'Spellblade Blizzard III': 'Magilame Méga Glace',
        'Spellblade Fire III': 'Magilame Méga Feu',
        'Spellblade Holy': 'Magilame Miracle',
        'Spellblade Thunder III': 'Magilame Méga Foudre',
        'Sword Dance': 'Danse du sabre',
        'The Game': 'Début de partie',
        'The Playing Field': 'Plateau de jeu',
        'The Queen\'s Waltz': 'Danse de la reine',
        'Ultimum': 'Déclin dimensionnel',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Aetherial Tear': '次元の裂け目',
        'Great Dragon': 'ドラゴングレイト',
        'Halicarnassus': 'ハリカルナッソス',
        'Soul Reaper': 'ソウルリーパー',
      },
      'replaceText': {
        'Aetherial Pull': '吸引',
        'Aetherial Tear': '次元の裂け目',
        'Cross Reaper': 'クロスリーパー',
        'Dimensional Wave': '次元波動',
        'Frost Breath': 'フロストブレス',
        'Gusting Gouge': 'ガスティンググージ',
        'Holy Blur': 'ホーリーミスト',
        'Holy Edge': 'ホーリーエッジ',
        'Mindjack': 'マインドジャック',
        'Panel Swap': 'パネルシャッフル',
        'Place Dark Token': 'サモンデストークン',
        'Place Token': 'サモントークン',
        'Ribbit': 'クルルルル！',
        'Spellblade Blizzard III': '魔法剣ブリザガ',
        'Spellblade Fire III': '魔法剣ファイガ',
        'Spellblade Holy': '魔法剣ホーリー',
        'Spellblade Thunder III': '魔法剣サンダガ',
        'Sword Dance': '剣の舞い',
        'The Game': 'ゲームスタート',
        'The Playing Field': 'ゲームボード',
        'The Queen\'s Waltz': '女王の舞い',
        'Ultimum': '次元の終焉',
        'Uplift': '隆起',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Aetherial Tear': '次元裂缝',
        'Great Dragon': '巨龙',
        'Halicarnassus': '哈利卡纳苏斯',
        'Soul Reaper': '灵魂收割者',
      },
      'replaceText': {
        'Aetherial Pull': '吸引',
        'Aetherial Tear': '次元裂缝',
        'Cross Reaper': '交叉斩击',
        'Dimensional Wave': '次元波动',
        'Frost Breath': '寒霜吐息',
        'Gusting Gouge': '削风',
        'Holy Blur': '神圣雾',
        'Holy Edge': '神圣刃',
        'Mindjack': '精神控制',
        'Panel Swap': '刷新盘面',
        'Place Dark Token': '召唤死形',
        'Place Token': '召唤魔形',
        'Ribbit': '呱呱呱呱呱！',
        'Spellblade Blizzard III': '魔法剑·冰封',
        'Spellblade Fire III': '魔法剑·爆炎',
        'Spellblade Holy': '魔法剑·神圣',
        'Spellblade Thunder III': '魔法剑·暴雷',
        'Sword Dance': '剑舞',
        'The Game': '游戏开始',
        'The Playing Field': '游戏盘面',
        'The Queen\'s Waltz': '女王之舞',
        'Ultimum': '次元终结',
        'Uplift': '隆起',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Aetherial Tear': '次元裂縫',
        'Great Dragon': '巨龍',
        'Halicarnassus': '哈利卡納蘇斯',
        'Soul Reaper': '靈魂收割者',
      },
      'replaceText': {
        'Aetherial Pull': '吸引',
        'Aetherial Tear': '次元裂縫',
        'Cross Reaper': '交錯收割',
        'Dimensional Wave': '次元波動',
        'Frost Breath': '寒霜吐息',
        'Gusting Gouge': '削風',
        'Holy Blur': '神聖霧',
        'Holy Edge': '神聖刃',
        'Mindjack': '精神控制',
        'Panel Swap': '刷新面板',
        'Place Dark Token': '召喚死形',
        'Place Token': '召喚魔形',
        'Ribbit': '呱呱呱呱呱！',
        'Spellblade Blizzard III': '魔法劍·大暴雪',
        'Spellblade Fire III': '魔法劍·大火焰',
        'Spellblade Holy': '魔法劍·神聖',
        'Spellblade Thunder III': '魔法劍·大雷電',
        'Sword Dance': '劍舞',
        'The Game': '遊戲開始',
        'The Playing Field': '遊戲面板',
        'The Queen\'s Waltz': '女王之舞',
        'Ultimum': '次元終結',
        'Uplift': '隆起',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Aetherial Tear': '차원의 틈새',
        'Great Dragon': '거대 드래곤',
        'Halicarnassus': '할리카르나소스',
        'Soul Reaper': '영혼 수확자',
      },
      'replaceText': {
        'Aetherial Pull': '흡인',
        'Aetherial Tear': '차원의 틈새',
        'Cross Reaper': '사신의 낫',
        'Dimensional Wave': '차원 파동',
        'Frost Breath': '서리 숨결',
        'Gusting Gouge': '칼날 돌풍',
        'Holy Blur': '성스러운 안개',
        'Holy Edge': '성스러운 칼날',
        'Mindjack': '정신 장악',
        'Panel Swap': '판 바꾸기',
        'Place Dark Token': '죽음의 토큰 소환',
        'Place Token': '토큰 소환',
        'Ribbit': '개굴개굴!',
        'Spellblade Blizzard III': '마법검 블리자가',
        'Spellblade Fire III': '마법검 파이가',
        'Spellblade Holy': '마법검 홀리',
        'Spellblade Thunder III': '마법검 선더가',
        'Sword Dance': '칼춤',
        'The Game': '게임 시작',
        'The Playing Field': '게임판',
        'The Queen\'s Waltz': '여왕의 춤',
        'Ultimum': '차원의 종언',
        'Uplift': '융기',
      },
    },
  ],
};

export default triggerSet;
