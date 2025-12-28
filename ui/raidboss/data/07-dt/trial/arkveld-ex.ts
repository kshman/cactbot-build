import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  wildEnergy?: boolean;
  resonance: number;
  dice?: number;
  chaseDir?: 'cw' | 'ccw';
  chases: number;
}

const diceMap: { [id: string]: number } = {
  '0194': 1,
  '0195': 2,
  '0196': 3,
  '0197': 4,
  '0198': 5,
  '0199': 6,
  '019A': 7,
  '019B': 8,
} as const;

// the Windward Wilds (Extreme)
const triggerSet: TriggerSet<Data> = {
  id: 'TheWindwardWildsExtreme',
  zoneId: ZoneId.TheWindwardWildsExtreme,
  timelineFile: 'arkveld-ex.txt',
  initData: () => ({
    resonance: 0,
    chases: 0,
  }),
  triggers: [
    {
      id: 'ArkveldEx Roar',
      type: 'StartsUsing',
      netRegex: { id: 'ABAE', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ArkveldEx 날개짓',
      type: 'StartsUsing',
      netRegex: { id: ['AB73', 'AB74', 'B019', 'B020'] },
      durationSeconds: 3,
      infoText: (_data, matches, output) => {
        const dir = matches.id === 'AB74' || matches.id === 'B020'
          ? output.left!()
          : output.right!();
        return output.text!({ direction: dir });
      },
      outputStrings: {
        text: {
          en: 'Go ${direction}',
          ja: 'Go ${direction}',
          ko: '보스 ${direction}으로',
        },
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'ArkveldEx 빨간 돌진',
      type: 'StartsUsing',
      netRegex: { id: ['B030', 'B037'], capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => Middle',
          ja: 'Sides => Middle',
          ko: '돌진 피하고 🔜 가운데로',
        },
      },
    },
    {
      id: 'ArkveldEx 하얀 돌진',
      type: 'StartsUsing',
      netRegex: { id: ['B02B', 'B045'], capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stay sides',
          ja: 'Stay sides',
          ko: '돌진 피하고 🔜 그대로 옆으로',
        },
      },
    },
    /* {
      id: 'ArkveldEx White Flash',
      type: 'StartsUsing',
      netRegex: { id: 'AB82', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    }, */
    {
      id: 'ArkveldEx Rush',
      type: 'StartsUsing',
      // AB85가 전체 돌진이고
      // AB84은 진짜 돌진 (3번 발생)
      netRegex: { id: 'AB85' },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      countdownSeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Boss Rush',
          ja: 'Boss Rush',
          ko: '3단 도넛 돌진!',
        },
      },
    },
    {
      id: 'ArkveldEx Wild Energy',
      type: 'HeadMarker',
      netRegex: { id: '0065', capture: false },
      suppressSeconds: 1,
      run: (data) => data.wildEnergy = true,
    },
    {
      id: 'ArkveldEx Wyvern\'s Ouroblade',
      type: 'StartsUsing',
      netRegex: { id: ['AB8C', 'AB8E', 'B031', 'B032'] },
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: 'Go ${direction}',
            ko: '보스의 ${direction}으로',
          },
          spread: {
            en: 'Spread on ${direction}',
            ko: '보스 ${direction}에서 흩어져요',
          },
          left: Outputs.left,
          right: Outputs.right,
        };
        const dir = matches.id === 'AB8E' || matches.id === 'B032'
          ? output.left!()
          : output.right!();
        if (data.wildEnergy)
          return { alertText: output.spread!({ direction: dir }) };
        return { infoText: output.text!({ direction: dir }) };
      },
      run: (data) => data.wildEnergy = false,
    },
    {
      id: 'ArkveldEx Steeltail Thrust',
      type: 'StartsUsing',
      netRegex: { id: ['ABAD', 'B035'], capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Front / Sides',
          ja: 'Go Front / Sides',
          ko: '꼬리치기 피해요',
        },
      },
    },
    {
      id: 'ArkveldEx Chainblade Charge',
      type: 'StartsUsing',
      netRegex: { id: 'ABAB', capture: false },
      response: Responses.getTogether(),
    },
    {
      id: 'ArkveldEx Aetheric Resonance',
      type: 'StartsUsing',
      netRegex: { id: 'AB8F', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.resonance = 0,
      outputStrings: {
        text: {
          en: 'Spread for towers',
          ja: 'Spread for towers',
          ko: '타워 위치로!',
        },
      },
    },
    {
      id: 'ArkveldEx Guardian Resonance',
      type: 'StartsUsing',
      netRegex: { id: 'AB93', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        data.resonance++;
        if (data.resonance !== 3)
          return;
        return output.tower!();
      },
      outputStrings: {
        tower: {
          en: 'Get towers',
          ja: 'Get towers',
          ko: '타워 밟아요!',
        },
      },
    },
    {
      id: 'ArkveldEx Forged Fury',
      type: 'StartsUsing',
      netRegex: { id: 'AB9E', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'ArkveldEx Dice',
      type: 'HeadMarker',
      netRegex: { id: Object.keys(diceMap) },
      condition: (data, matches) => data.me === matches.target,
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        data.dice = diceMap[matches.id];
        if (!data.dice)
          return;
        if (data.dice < 5)
          return output.lower!({ num: data.dice });
        const lower = data.dice - 4;
        return output.upper!({ num: data.dice, lower: lower });
      },
      outputStrings: {
        lower: {
          en: 'Dice ${num}',
          ja: 'Dice ${num}',
          ko: '주사위 ${num}',
        },
        upper: {
          en: 'Dice ${num} (${lower})',
          ja: 'Dice ${num} (${lower})',
          ko: '주사위 ${num} (${lower})',
        },
      },
    },
    {
      id: 'ArkveldEx Clamorous Chase',
      type: 'StartsUsing',
      // ABB3 정시계, 1이 오른쪽
      // ABB6 반시계, 1이 왼쪽
      netRegex: { id: ['ABB3', 'ABB6'] },
      delaySeconds: 0.5,
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cw1: { en: 'East', ko: '오른쪽🡆으로' },
          cw2: { en: 'South', ko: '남쪽🡇으로' },
          cw3: { en: 'West', ko: '왼쪽🡄으로' },
          cw4: { en: 'North', ko: '북쪽🡅으로' },
          ccw1: { en: 'West', ko: '왼쪽🡄으로' },
          ccw2: { en: 'South', ko: '남쪽🡇으로' },
          ccw3: { en: 'East', ko: '오른쪽🡆으로' },
          ccw4: { en: 'North', ko: '북쪽🡅으로' },
          others: { en: 'Go center', ko: '한가운데서 대기' },
        };
        if (data.dice === undefined)
          return;
        data.chaseDir = matches.id === 'ABB3' ? 'cw' : 'ccw';
        if (data.dice > 4)
          return { infoText: output.others!() };
        const res = `${data.chaseDir}${data.dice}` as const;
        return { alertText: output[res]!() };
      },
      run: (data) => data.chases = 0,
    },
    {
      id: 'ArkveldEx Chase Dice',
      type: 'StartsUsing',
      netRegex: { id: ['ABB5', 'ABB8'], capture: false },
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cw5: { en: 'East', ko: '오른쪽🡆으로' },
          cw6: { en: 'South', ko: '남쪽🡇으로' },
          cw7: { en: 'West', ko: '왼쪽🡄으로' },
          cw8: { en: 'North', ko: '북쪽🡅으로' },
          ccw5: { en: 'West', ko: '왼쪽🡄으로' },
          ccw6: { en: 'South', ko: '남쪽🡇으로' },
          ccw7: { en: 'East', ko: '오른쪽🡆으로' },
          ccw8: { en: 'North', ko: '북쪽🡅으로' },
          avoid: {
            en: 'Avoid!',
            ko: '한가운데로 피해욧!',
          },
        };
        if (data.dice === undefined)
          return;
        data.chases++;
        if (data.chases === data.dice)
          return { infoText: output.avoid!() };
        if ((data.chases + 4) === data.dice) {
          const res = `${data.chaseDir}${data.dice}` as const;
          return { alertText: output[res]!() };
        }
      },
    },
    {
      id: 'ArkveldEx Weal Beam',
      type: 'HeadMarker',
      netRegex: { id: '01D6' },
      durationSeconds: 5,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          beamMe: {
            en: 'Beam on YOU',
            ko: '나에게 빔!',
          },
          partyMove: {
            en: '(Avoid beam)',
            ko: '(빔 피해요)',
          },
        };
        if (data.me === matches.target) {
          return { alertText: output.beamMe!() };
        }
        return { infoText: output.partyMove!() };
      },
    },
    {
      id: 'ArkveldEx Wrathful Rattle',
      type: 'StartsUsing',
      netRegex: { id: 'ABA7', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Waves',
          ja: 'Waves',
          ko: '연속 물결 장판',
        },
      },
    },
    {
      id: 'ArkveldEx Roar + Exaflare',
      type: 'StartsUsing',
      netRegex: { id: 'ABAF', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'AoE + Exaflare',
          ja: 'AoE + Exaflare',
          ko: '전체 공격 🔜 엑사플레어',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Guardian Arkveld': 'Wächter-Arkveld',
      },
      'replaceText': {
        '\\(aoes\\)': '(AoEs)',
        '\\(dash\\)': '(Ansturm)',
        '\\(raidwide\\)': '(Raidweit)',
        '\\(wing\\)': '(Flügel)',
        'Aetheric Resonance': 'Ätherische Resonanz',
        'Chainblade Blow': 'Klingenpeitsche',
        'Chainblade Charge': 'Klingenschlag',
        'Clamorous Chase': 'Jähzornige Jagd',
        'Dragonspark': 'Drakonischer Funke',
        'Forged Fury': 'Rasselnde Raserei',
        'Greater Resonance': 'Perfekte Resonanz',
        'Guardian Resonance': 'Wächter-Resonanz',
        'Roar': 'Brüllen',
        'Rush': 'Ansturm',
        'Steeltail Thrust': 'Stachel',
        'White Flash': 'Weißes Leuchten',
        'Wild Energy': 'Energie der Wildnis',
        'Wrathful Rattle': 'Zornige Klingen',
        'Wyvern\'s Ouroblade': 'Wyvern-Klingenfeger',
        'Wyvern\'s Rattle': 'Klagende Klingen',
        'Wyvern\'s Weal': 'Wyvernkanone',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Guardian Arkveld': 'Arkveld Gardien',
      },
      'replaceText': {
        'Aetheric Resonance': 'Résonance éthérée',
        'Chainblade Blow': 'Chaîne écrasante',
        'Chainblade Charge': 'Chaîne oppressante',
        'Clamorous Chase': 'Chasse vociférante',
        'Dragonspark': 'Étincelle draconique',
        'Forged Fury': 'Fureur du Gardien',
        'Greater Resonance': 'Grande résonance du Gardien',
        'Guardian Resonance': 'Résonance du Gardien',
        'Roar': 'Rugissement',
        'Rush': 'Ruée',
        'Steeltail Thrust': 'Queue d\'acier',
        'White Flash': 'Éclair blanc',
        'Wild Energy': 'Énergie sauvage',
        'Wrathful Rattle': 'Grondement de la wyverne',
        'Wyvern\'s Ouroblade': 'Tourbillon de la wyverne',
        'Wyvern\'s Rattle': 'Râle de la wyverne',
        'Wyvern\'s Weal': 'Euphorie de la wyverne',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Guardian Arkveld': '護竜アルシュベルド',
      },
      'replaceText': {
        'Aetheric Resonance': '地脈共振',
        'Chainblade Blow': '鎖刃叩きつけ',
        'Chainblade Charge': '鎖刃振り下ろし',
        'Clamorous Chase': '鎖刃躍動',
        'Dragonspark': '龍光',
        'Forged Fury': '護竜乱撃',
        'Greater Resonance': '護竜共振：大',
        'Guardian Resonance': '護竜共振',
        'Roar': '咆哮',
        'Rush': '突進',
        'Steeltail Thrust': '尻尾突き上げ',
        'White Flash': '白光',
        'Wild Energy': '龍光放散',
        'Wrathful Rattle': '鎖哭龍閃・改',
        'Wyvern\'s Ouroblade': '回転鎖刃【龍閃】',
        'Wyvern\'s Rattle': '鎖哭龍閃',
        'Wyvern\'s Weal': '龍閃砲',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Guardian Arkveld': '护锁刃龙',
      },
      'replaceText': {
        '\\(aoes\\)': '(圆形AOE)',
        '\\(dash\\)': '(冲锋)',
        '\\(raidwide\\)': '(全屏)',
        '\\(wing\\)': '(翅膀)',
        'Aetheric Resonance': '地脉共振',
        'Chainblade Blow': '锁刃敲打',
        'Chainblade Charge': '锁刃下挥',
        'Clamorous Chase': '锁刃跃动',
        'Dragonspark': '龙光',
        'Forged Fury': '护龙乱击',
        'Greater Resonance': '护龙大共振',
        'Guardian Resonance': '护龙共振',
        'Roar': '咆哮',
        'Rush': '突进',
        'Siegeflight': '锁刃飞翔突进',
        'Steeltail Thrust': '龙尾突刺',
        'White Flash': '白光',
        'Wild Energy': '龙光扩散',
        'Wrathful Rattle': '锁哭龙闪·改',
        'Wyvern\'s Ouroblade': '回旋锁刃【龙闪】',
        'Wyvern\'s Radiance': '龙闪',
        'Wyvern\'s Rattle': '锁哭龙闪',
        'Wyvern\'s Vengeance': '波状龙闪',
        'Wyvern\'s Weal': '龙闪炮',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        // 'Guardian Arkveld': '', // FIXME '护锁刃龙'
      },
      'replaceText': {
        // '\\(aoes\\)': '', // FIXME '(圆形AOE)'
        // '\\(dash\\)': '', // FIXME '(冲锋)'
        // '\\(raidwide\\)': '', // FIXME '(全屏)'
        // '\\(wing\\)': '', // FIXME '(翅膀)'
        // 'Aetheric Resonance': '', // FIXME '地脉共振'
        // 'Chainblade Blow': '', // FIXME '锁刃敲打'
        // 'Chainblade Charge': '', // FIXME '锁刃下挥'
        // 'Clamorous Chase': '', // FIXME '锁刃跃动'
        // 'Dragonspark': '', // FIXME '龙光'
        // 'Forged Fury': '', // FIXME '护龙乱击'
        // 'Greater Resonance': '', // FIXME '护龙大共振'
        // 'Guardian Resonance': '', // FIXME '护龙共振'
        'Roar': '咆哮',
        'Rush': '突進',
        // 'Siegeflight': '', // FIXME '锁刃飞翔突进'
        // 'Steeltail Thrust': '', // FIXME '龙尾突刺'
        // 'White Flash': '', // FIXME '白光'
        // 'Wild Energy': '', // FIXME '龙光扩散'
        // 'Wrathful Rattle': '', // FIXME '锁哭龙闪·改'
        // 'Wyvern\'s Ouroblade': '', // FIXME '回旋锁刃【龙闪】'
        // 'Wyvern\'s Radiance': '', // FIXME '龙闪'
        // 'Wyvern\'s Rattle': '', // FIXME '锁哭龙闪'
        // 'Wyvern\'s Vengeance': '', // FIXME '波状龙闪'
        // 'Wyvern\'s Weal': '', // FIXME '龙闪炮'
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Guardian Arkveld': '수호룡 알슈베르도',
      },
      'replaceText': {
        '\\(aoes\\)': '(장판)',
        '\\(dash\\)': '(돌진)',
        '\\(raidwide\\)': '(전체공격)',
        '\\(wing\\)': '(날개)',
        'Aetheric Resonance': '지맥 공명',
        'Chainblade Blow': '사슬날 매질',
        'Chainblade Charge': '사슬날 내리찍기',
        'Clamorous Chase': '사슬날 약동',
        'Dragonspark': '용빛',
        'Forged Fury': '수호룡 난격',
        'Greater Resonance': '수호룡 대공명',
        'Guardian Resonance': '수호룡 공명',
        'Roar': '포효',
        'Rush': '돌진',
        'Siegeflight': '사슬날 비상 돌진',
        'Steeltail Thrust': '꼬리 내려치기',
        'White Flash': '백광',
        'Wild Energy': '용빛 발산',
        'Wrathful Rattle': '강화 쇄곡용섬',
        'Wyvern\'s Ouroblade': '회전 사슬날: 용의 섬광',
        'Wyvern\'s Radiance': '용의 섬광',
        'Wyvern\'s Rattle': '쇄곡용섬',
        'Wyvern\'s Vengeance': '파상 용섬',
        'Wyvern\'s Weal': '용섬포',
      },
    },
  ],
};

export default triggerSet;

// 추출: StartsCasting 14:([^:]*):Guardian Arkveld:([^:]*)
