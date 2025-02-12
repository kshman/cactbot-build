import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  charges: string[];
  seenBrighteyes?: boolean;
}

// Notes:
// Ignoring Gobsway Rumblerocks (1AA0) aoe trigger, as it is small and frequent.

const chargeOutputStrings = {
  getIn: Outputs.in,
  getOut: {
    en: 'Out',
    de: 'Raus',
    fr: 'Exterieur',
    ja: '外へ',
    cn: '远离',
    ko: '밖으로',
  },
  spread: Outputs.spread,
  stackMarker: Outputs.stackMarker,
  unknown: Outputs.unknown,
};

const triggerSet: TriggerSet<Data> = {
  id: 'AlexanderTheBreathOfTheCreatorSavage',
  zoneId: ZoneId.AlexanderTheBreathOfTheCreatorSavage,
  timelineFile: 'a10s.txt',
  initData: () => {
    return {
      charges: [],
    };
  },
  timelineTriggers: [
    {
      id: 'A10S Goblin Rush',
      regex: /Goblin Rush/,
      beforeSeconds: 5,
      suppressSeconds: 1,
      response: Responses.miniBuster(),
    },
    {
      id: 'A10S Gobbie Adds',
      regex: /Gobbie Adds/,
      beforeSeconds: 0,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hit Adds With Weight Trap',
          de: 'Adds mit Gewichtsfalle treffen',
          fr: 'Frappez les Adds avec le Piège à poids',
          ja: '鉄球ギミックを使って雑魚を倒す',
          cn: '使用铁球陷阱击中小怪',
          ko: '철퇴 함정으로 쫄 맞추기',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'A10S Floor Spike Trap',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AB2', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Floor Spikes',
          de: 'Boden-Stachel',
          fr: 'Pics au sol',
          ja: '罠: 棘',
          cn: '地刺陷阱',
          ko: '가시 함정',
        },
      },
    },
    {
      id: 'A10S Frost Laser Trap',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AB1', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Frost Lasers',
          de: 'Eislaser',
          fr: 'Lasers de glace',
          ja: '罠: 氷',
          cn: '冰晶陷阱',
          ko: '얼음화살 함정',
        },
      },
    },
    {
      id: 'A10S Ceiling Weight Trap',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AB0', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Ceiling Weight',
          de: 'Gewichte von der Decke',
          fr: 'Poids du plafond',
          ja: '罠: 鉄球',
          cn: '铁球陷阱',
          ko: '철퇴 함정',
        },
      },
    },
    {
      id: 'A10S Charge Marker',
      type: 'Ability',
      // This also handles the "single charge" call.
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AB[89AB]' },
      preRun: (data, matches) => {
        const chargeMap: { [abilityId: string]: string } = {
          '1AB8': 'getIn',
          '1AB9': 'getOut',
          '1ABA': 'spread',
          '1ABB': 'stackMarker',
        };
        data.charges.push(chargeMap[matches.id] ?? 'unknown');
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = chargeOutputStrings;

        // Call the first one out with alert, the other two with info.
        const severity = data.charges.length > 1 ? 'infoText' : 'alertText';
        const charge = data.charges[data.charges.length - 1] ?? 'unknown';
        return { [severity]: output[charge]!() };
      },
    },
    {
      id: 'A10S Charge 1',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A9[789]', capture: false },
      run: (data) => data.charges.shift(),
    },
    {
      id: 'A10S Charge Double Triple',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A9[ABCE]', capture: false },
      suppressSeconds: 0.5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = chargeOutputStrings;

        if (data.charges.length === 0)
          return;

        const charge = data.charges.shift();
        if (charge !== undefined)
          return { alertText: output[charge]!() };
      },
    },
    {
      id: 'A10S Charge Clear',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A9[789]', capture: false },
      delaySeconds: 10,
      run: (data) => {
        // Cleanup just in case.
        data.charges = [];
      },
    },
    {
      id: 'A10S Gobrush Rushgob',
      type: 'StartsUsing',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A9F' },
      response: Responses.tankBuster(),
    },
    {
      id: 'A10S Slicetops Tether',
      type: 'Tether',
      netRegex: { source: 'Lamebrix Strikebocks', id: '0039' },
      alarmText: (data, matches, output) => {
        if (data.me !== matches.target)
          return;
        return output.tankSwapGetAway!();
      },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return;
        if (data.role === 'tank')
          return output.tankSwap!();

        if (data.role === 'healer' || data.job === 'BLU')
          return output.shieldPlayer!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        tankSwap: Outputs.tankSwap,
        shieldPlayer: {
          en: 'Shield ${player}',
          de: 'Schild ${player}',
          fr: 'Bouclier ${player}',
          ja: '${player}にバリア',
          cn: '单盾${player}',
          ko: '"${player}" 보호막',
        },
        tankSwapGetAway: {
          en: 'Tank Swap, Get Away',
          de: 'Tankwechsel, geh weg',
          fr: 'Tank swap, éloignez-vous',
          ja: 'タンクスイッチ、離れる',
          cn: '换T并且远离',
          ko: '탱 교대, 멀리가기',
        },
      },
    },
    {
      id: 'A10S Gobsnick Leghops',
      type: 'StartsUsing',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AA4', capture: false },
      response: Responses.stopEverything(),
    },
    {
      id: 'A10S Brighteyes Tracker',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AA9', capture: false },
      run: (data) => {
        // This comes out 0.1s before every '0029' prey marker.
        data.seenBrighteyes = true;
      },
    },
    {
      id: 'A10S Brighteyes Cleanup',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1AA9', capture: false },
      delaySeconds: 20,
      suppressSeconds: 20,
      run: (data) => delete data.seenBrighteyes,
    },
    {
      id: 'A10S Brighteyes Prey Marker',
      type: 'HeadMarker',
      netRegex: { id: '0029' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Prey on YOU',
          de: 'Makierung auf DIR',
          fr: 'Marquage sur VOUS',
          ja: '自分に狙い目',
          cn: '火圈点名',
          ko: '징 대상자',
        },
      },
    },
    {
      id: 'A10S Brighteyes Prey Marker Pass',
      type: 'HeadMarker',
      netRegex: { id: '0029' },
      condition: (data, matches) => {
        // Only need to pass on the first one.
        return data.me === matches.target && !data.seenBrighteyes;
      },
      delaySeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Pass Prey',
          de: 'Makierung weitergeben',
          fr: 'Passez la marque',
          ja: '狙い目を渡す',
          cn: '传递点名',
          ko: '징 넘김',
        },
      },
    },
    {
      id: 'A10S Gobslice Mooncrops',
      type: 'StartsUsing',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A92', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hit Floor Trap',
          de: 'Aktiviere Bodenfalle',
          fr: 'Activez le Piège au sol',
          ja: '棘を踏む',
          cn: '踩地刺陷阱',
          ko: '가시함정 밟아요',
        },
      },
    },
    {
      id: 'A10S Gobslice Mooncrops Cast',
      type: 'StartsUsing',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A8F', capture: false },
      response: Responses.getOut('info'),
    },
    {
      id: 'A10S Gobspin Zoomdrops',
      type: 'Ability',
      netRegex: { source: 'Lamebrix Strikebocks', id: '1A8F', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hit Boss With Ice',
          de: 'Boss mit Eis treffen',
          fr: 'Frappez le boss avec la Glace',
          ja: '氷を踏んでボスを打つ',
          cn: '使用冰晶陷阱击中boss',
          ko: '보스에게 얼음함정 맞히기',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Buzzsaw': 'Rotorsäge',
        'Gobpress R-VI': 'Gob-Roller VI',
        'Lamebrix Strikebocks': 'Wüterix (?:der|die|das) Söldner',
        'Lameprix Strikedocks': 'Wüterix (?:der|die|das) Trickser',
        'The Excruciationator': 'Multi-Martyrium',
        'Weight Of The World': 'Schwere der Erde',
      },
      'replaceText': {
        '(?!--)mechanic': 'Mechanik',
        '--in/out--': '--Rein/Raus--',
        '--out/in--': '--Raus/Rein--',
        '--spread/stack--': '--Verteilen/Sammeln--',
        '--stack/spread--': '--Sammeln/Verteilen--',
        '\\(Stack/Spread\\)': '(Sammeln/Verteilen)',
        'Brighteyes(?! Markers)': 'Zielheften Auge',
        'Brighteyes Markers': 'Zielheften Auge Markierungen',
        'Clone Add': 'Klon Add',
        'Discharge': 'Abfeuern',
        'Double Charge': 'Doppelaufladung',
        'Floor Trap': 'Boden-Falle',
        'Frost Trap': 'Eisstrahl-Falle',
        'Frostbite': 'Abfrieren',
        'Gobbie Adds': 'Gobbie Adds',
        'Goblin Rush': 'Goblin-Rausch',
        'Gobrush Rushgob': 'Indigoblin-Rausch ',
        'Gobslash Slicetops': 'Indigo-Vakuumhieb',
        'Gobslice Mooncrops': 'Schlitzensichel',
        'Gobsnick Leghops': 'Gob am Berg',
        'Gobspin Zoomdrops': 'Große Gobwirbel',
        'Gobsway Rumblerocks': 'Riesengroße Schüttern',
        'Gobswish Spraymops': 'Fährliche Fächer',
        'Illuminati Hand Cannon': 'Indigohandkanone',
        'Impact': 'Impakt',
        'Laceration': 'Zerreißen',
        'Single Charge': 'Einzelaufladung',
        'Steam Roller': 'Dampfwalze',
        'Stoneskin': 'Steinhaut',
        'Triple Charge': 'Dreifachaufladung',
        'Weight Trap': 'Gewichts-Falle',
        'Leghops\\?/Charge': 'Gob am Berg?/Aufladung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Buzzsaw': 'Scie mécanique',
        'Gobpress R-VI': 'Gobrouleau compresseur G-VI',
        'Lamebrix Strikebocks': 'Lamebrix le Mercenaire',
        'Lameprix Strikedocks': 'Lamebrix le Diversif',
        'The Excruciationator': 'la plate-forme de torture polyvalente',
        'Weight Of The World': 'Poids du monde',
      },
      'replaceText': {
        '(?!--)mechanic': 'Mécanique',
        '--in/out--': '--intérieur/extérieur--',
        '--out/in--': '--extérieur/intérieur--',
        '--spread/stack--': '--dispersion/package--',
        '--stack/spread--': '--package/dispersion--',
        '\\(Stack/Spread\\)': '(Package/Dispersion)',
        'Brighteyes Markers': 'Marquage Œil vif',
        'Brighteyes(?! Markers)': 'Œil vif',
        'Clone Add': 'Add Clone',
        'Discharge': 'Mitraillage',
        'Double Charge': 'Rechargement double',
        'Floor Trap': 'Piège au sol',
        'Frost Trap': 'Piège de glace',
        'Frostbite': 'Gelure',
        'Gobbie Adds x3': 'Adds x3 Gob',
        'Goblin Rush': 'Charge gobeline',
        'Gobrush Rushgob': 'Gobcharge gobeline',
        'Gobslash Slicetops': 'Gobtranchant du vide',
        'Gobslice Mooncrops': 'Gobcroissant lacérant',
        'Gobsnick Leghops': 'Gobfeinte mortelle',
        'Gobspin Zoomdrops': 'Gobtoupie mégatranchante',
        'Gobsway Rumblerocks': 'Gobbouleversement',
        'Gobswish Spraymops': 'Gobdécoupage brutal',
        'Illuminati Hand Cannon': 'Main-canon indigo',
        'Impact': 'Impact',
        'Laceration': 'Lacération',
        'Leghops\\?/Charge': 'Mortelle ?/Charge',
        'Single Charge': 'Rechargement simple',
        'Steam Roller': 'Compression',
        'Stoneskin': 'Cuirasse',
        'Triple Charge': 'Rechargement triple',
        'Weight Trap': 'Piège à poids',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Buzzsaw': '回転ノコギリ',
        'Gobpress R-VI': 'VI号ゴブリローラー',
        'Lamebrix Strikebocks': '傭兵のレイムプリクス',
        'Lameprix Strikedocks': '偽兵のレイムプリクス',
        'The Excruciationator': '科学的万能処刑場',
        'Weight Of The World': '大陸の重み',
      },
      'replaceText': {
        '(?!--)mechanic': 'ギミック',
        '--in/out--': '--中/外--',
        '--out/in--': '--外/中--',
        '--spread/stack--': '--散開/集合--',
        '--stack/spread--': '--集合/散開--',
        '\\(Stack/Spread\\)': '(集合/散開)',
        '\\)\\?': ') ?',
        'Brighteyes Markers': '狙い目マーキング',
        'Brighteyes(?! Markers)': '狙い目',
        'Clone Add': '雑魚: ミラージュ',
        'Discharge': '銃撃',
        'Double Charge': '二連充填',
        'Floor Trap': '罠ギミック',
        'Frost Trap': '罠: 氷',
        'Frostbite': 'フロストバイト',
        'Gobbie Adds x3': '雑魚: 3 ゴブ',
        'Goblin Rush': 'ゴブリンラッシュ',
        'Gobrush Rushgob': 'ゴブ流ゴブリンラッシュ',
        'Gobslash Slicetops': 'ゴブ流真空斬り',
        'Gobslice Mooncrops': 'ゴブ流三日月斬り',
        'Gobsnick Leghops': 'ゴブ流後の先',
        'Gobspin Zoomdrops': 'ゴブ流大回転斬り',
        'Gobsway Rumblerocks': 'ゴブ流大激震',
        'Gobswish Spraymops': 'ゴブ流飛水断ち',
        'Illuminati Hand Cannon': 'イルミナティ・ハンドカノン',
        'Impact': '衝撃',
        'Laceration': '斬撃',
        'Leghops\\?/Charge': 'ゴブ流後の先?/充填',
        'Single Charge': '単発充填',
        'Steam Roller': 'ローラープレス',
        'Stoneskin': 'ストンスキン',
        'Triple Charge': '三連充填',
        'Weight Trap': '罠: 鉄球',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Buzzsaw': '旋转链锯',
        'Gobpress R-VI': '6号哥布林压路机',
        'Lamebrix Strikebocks': '佣兵雷姆普里克斯',
        'Lameprix Strikedocks': '虚兵雷姆普里克斯',
        'The Excruciationator': '科学万能处刑场',
        'Weight Of The World': '大陆之重',
      },
      'replaceText': {
        '(?!--)mechanic': '机制',
        '--in/out--': '--内/外--',
        '--out/in--': '--外/内--',
        '--spread/stack--': '--分散/集合--',
        '--stack/spread--': '--集合/分散--',
        '\\)\\?': ') ?',
        'Brighteyes': '目标',
        'Clone Add': '分身出现',
        'Discharge': '枪击',
        'Double Charge': '二连填充',
        'Floor Trap': '地刺陷阱',
        'Frost Trap': '冰晶陷阱',
        'Frostbite': '寒冰箭',
        'Gobbie Adds': '哥布林出现',
        'Goblin Rush': '哥布林冲锋',
        'Gobrush Rushgob': '哥布流哥布林冲锋',
        'Gobslash Slicetops': '哥布流真空斩',
        'Gobslice Mooncrops': '哥布流月牙斩',
        'Gobsnick Leghops': '哥布流后之先',
        'Gobspin Zoomdrops': '哥布流大回旋斩',
        'Gobsway Rumblerocks': '哥布流大怒震',
        'Gobswish Spraymops': '哥布流断瀑斩',
        'Illuminati Hand Cannon': '青蓝手炮',
        'Impact': '锤击',
        'Laceration': '斩击',
        'Single Charge': '单发填充',
        'Steam Roller': '蒸汽滚轮',
        'Stoneskin': '石肤',
        'Triple Charge': '三连填充',
        'Weight Trap': '铁球陷阱',
        'Leghops\\?/Charge': '哥布流后之先?/冲锋',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Buzzsaw': '회전톱',
        'Gobpress R-VI': 'VI호 고블린롤러',
        'Lamebrix Strikebocks': '용병 레임브릭스',
        'Lameprix Strikedocks': '가짜 용병 레임프릭스',
        'The Excruciationator': '과학적 만능처형장',
        'Weight Of The World': '쇠구슬',
      },
      'replaceText': {
        '(?!--)mechanic': '기믹',
        '--in/out--': '--안/밖--',
        '--out/in--': '--밖/안--',
        '--spread/stack--': '--산개/쉐어--',
        '--stack/spread--': '--쉐어/산개--',
        'Brighteyes': '표적',
        'Clone Add': '분신 등장',
        'Discharge': '총격',

        'Double Charge': '2연속 충전',
        'Floor Trap': '가시 함정',
        'Frost Trap': '얼음화살 함정',
        'Frostbite': '동상',
        'Gobbie Adds': '고블린 등장',
        'Goblin Rush': '고블린 돌진',
        'Gobrush Rushgob': '고브류 고블린 돌진',
        'Gobslash Slicetops': '고브류 진공베기',
        'Gobslice Mooncrops': '고브류 초승달베기',
        'Gobsnick Leghops': '고브류 되받아치기',
        'Gobspin Zoomdrops': '고브류 대회전베기',
        'Gobsway Rumblerocks': '고브류 대격진',
        'Gobswish Spraymops': '고브류 물보라베기',
        'Illuminati Hand Cannon': '푸른손 화포',
        'Impact': '충격',
        'Laceration': '참격',
        'Single Charge': '단발 충전',
        'Steam Roller': '롤러 프레스',
        'Stoneskin': '스톤스킨',
        'Triple Charge': '3연속 충전',
        'Weight Trap': '철퇴 함정',
        'Leghops\\?/Charge': '되받아치기?/충전',
      },
    },
  ],
};

export default triggerSet;
