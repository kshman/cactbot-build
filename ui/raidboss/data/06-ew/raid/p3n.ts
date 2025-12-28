import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  ashenEyeDirections?: number[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AsphodelosTheThirdCircle',
  zoneId: ZoneId.AsphodelosTheThirdCircle,
  timelineFile: 'p3n.txt',
  triggers: [
    {
      id: 'P3N Experimental Fireplume Rotating',
      type: 'StartsUsing',
      netRegex: { id: '6698', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.startMiddle!(),
      outputStrings: {
        startMiddle: {
          en: 'Start Middle',
          ja: '中央から',
          ko: '한가운데부터',
        },
      },
    },
    {
      id: 'P3N Experimental Fireplume Out',
      type: 'StartsUsing',
      // This is Experimental Fireplume (6696) into Fireplume (6697), which is an 11s warning.
      netRegex: { id: '6696', source: 'Phoinix', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.outOfMiddle!(),
      outputStrings: {
        outOfMiddle: {
          en: 'Out Of Middle Soon',
          ja: '中央から離れて',
          ko: '곧 바깥으로',
        },
      },
    },
    {
      id: 'P3N Scorched Exaltation',
      type: 'StartsUsing',
      netRegex: { id: '66B8', source: 'Phoinix', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P3N Heat of Condemnation',
      type: 'StartsUsing',
      netRegex: { id: '66B2', source: 'Phoinix' },
      suppressSeconds: 1,
      response: Responses.tankCleave('alert'),
    },
    {
      id: 'P3N Darkened Fire Aoe',
      type: 'HeadMarker',
      netRegex: { id: '010[C-F]' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => {
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Stand on Darkened Fire',
          ja: '黒い炎の上へ',
          ko: '검은 불꽃 위로',
        },
      },
    },
    {
      id: 'P3N Right Cinderwing',
      type: 'StartsUsing',
      netRegex: { id: '66B4', source: 'Phoinix', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'P3N Left Cinderwing',
      type: 'StartsUsing',
      netRegex: { id: '66B5', source: 'Phoinix', capture: false },
      response: Responses.goRight(),
    },
    {
      // Could check the log line's x y coordinate to determine from where to where it charges, npc at charge target casts 66AF?
      id: 'P3N Trail of Condemnation',
      type: 'StartsUsing',
      netRegex: { id: '66AD', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => {
        return output.avoidCharge!();
      },
      outputStrings: {
        avoidCharge: {
          en: 'Avoid Charge',
          ja: '突進避けて',
          ko: '돌진 피해요',
        },
      },
    },
    {
      id: 'P3N Sunbird Spawn',
      type: 'AddedCombatant',
      netRegex: { name: 'Sunbird', capture: false },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank' || data.job === 'BLU')
          return output.tank!();
        return output.text!();
      },
      outputStrings: {
        tank: {
          en: 'Pull add circles apart',
          ja: '雑魚を離れさせる',
          ko: '동그라미 안겹치게 떨어져요',
        },
        text: Outputs.killAdds,
      },
    },
    {
      id: 'P3N Dead Rebirth',
      type: 'StartsUsing',
      netRegex: { id: '66A9', source: 'Phoinix', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P3N Ashen Eye',
      type: 'StartsUsing',
      netRegex: { id: '66AB', source: 'Sparkfledged' },
      alertText: (data, matches, output) => {
        if (!data.ashenEyeDirections)
          data.ashenEyeDirections = [];
        // Convert radians into 4 quarters N = 0, E = 1, S = 2, W = 3
        const heading = Math.round(2 - 2 * parseFloat(matches.heading) / Math.PI) % 4;
        data.ashenEyeDirections.push(heading);
        if (data.ashenEyeDirections.length === 2) {
          let safeSpot = '';
          let first = '';
          const dir1 = data.ashenEyeDirections[0];
          const dir2 = data.ashenEyeDirections[1];
          switch (dir1) {
            case 0:
              safeSpot = output.n!();
              break;
            case 1:
              safeSpot = output.e!();
              break;
            case 2:
              safeSpot = output.s!();
              break;
            case 3:
              safeSpot = output.w!();
              break;
          }
          switch (dir2) {
            case 0:
              first = output.s!();
              break;
            case 1:
              first = output.w!();
              break;
            case 2:
              first = output.n!();
              break;
            case 3:
              first = output.e!();
              break;
          }
          return output.combo!({ first: first, second: safeSpot });
        } else if (data.ashenEyeDirections.length > 3) {
          data.ashenEyeDirections = [];
        }
      },
      outputStrings: {
        n: Outputs.north,
        e: Outputs.east,
        w: Outputs.west,
        s: Outputs.south,
        combo: {
          en: '${first} => ${second}',
          ja: '${first} => ${second}',
          ko: '${first} 🔜 ${second}',
        },
      },
    },
    {
      id: 'P3N Devouring Brand',
      type: 'StartsUsing',
      netRegex: { id: '669E', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => {
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Split Intercardinals',
          ja: 'フィールド十字分断',
          ko: '비스듬하게 흩어져요',
        },
      },
    },
    {
      id: 'P3N Spread Marker',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Left Cinderwing/Right Cinderwing': 'Left/Right Cinderwing',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Phoinix': 'Phoinix',
        'Sparkfledged': 'Saat des Phoinix',
        'Sunbird': 'Spross Des Phoinix',
      },
      'replaceText': {
        '--fire expands--': '--Feuer breitet sich aus--',
        '--giant fireplume\\?--': '--riesige Feuerfieder?--',
        'Ashen Eye': 'Aschener Blick',
        'Blazing Rain': 'Flammender Regen',
        'Brightened Fire': 'Lichte Lohe',
        '(?<!\\w )Charplume': 'Aschenfieder',
        'Darkened Fire': 'Schwarze Lohe',
        'Dead Rebirth': 'Melaphoinix',
        'Devouring Brand': 'Kreuzbrand',
        'Experimental Charplume': 'Experimentelle Schwarzfieder',
        'Experimental Fireplume': 'Experimentelle Feuerfieder',
        'Flames of Undeath': 'Totenflamme',
        'Flare of Condemnation': 'Limbische Flamme',
        'Fledgling Flight': 'Flüggewerden',
        'Heat of Condemnation': 'Limbisches Lodern',
        'Joint Pyre': 'Gemeinschaft des Feuers',
        'Left Cinderwing': 'Linke Aschenschwinge',
        'Right Cinderwing': 'Rechte Aschenschwinge',
        'Scorched Exaltation': 'Aschenlohe',
        'Searing Breeze': 'Sengender Hauch',
        'Trail of Condemnation': 'Limbischer Odem',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Phoinix': 'protophénix',
        'Sparkfledged': 'oiselet de feu',
        'Sunbird': 'oiselet étincelant',
      },
      'replaceText': {
        '--fire expands--': '--élargissement du feu--',
        '--giant fireplume\\?--': '--immolation de feu géant ?--',
        'Ashen Eye': 'Œil sombre',
        'Blazing Rain': 'Pluie brûlante',
        'Brightened Fire': 'Flamme de lumière',
        '(?<!\\w )Charplume': 'Immolation de feu sombre',
        'Darkened Fire': 'Flamme sombre',
        'Dead Rebirth': 'Phénix noir',
        'Devouring Brand': 'Croix enflammée',
        'Experimental Charplume': 'Synthèse de mana : immolation de feu sombre',
        'Experimental Fireplume': 'Synthèse de mana : immolation de feu',
        'Flames of Undeath': 'Feu réincarné',
        'Flare of Condemnation': 'Souffle infernal',
        'Fledgling Flight': 'Nuée ailée',
        'Heat of Condemnation': 'Bourrasque infernale',
        'Joint Pyre': 'Combustion résonnante',
        'Left Cinderwing/Right Cinderwing': 'Incinération senestre/dextre',
        'Scorched Exaltation': 'Flamme calcinante',
        'Searing Breeze': 'Jet incandescent',
        'Trail of Condemnation': 'Embrasement infernal',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Phoinix': 'フェネクス',
        'Sparkfledged': '火霊鳥',
        'Sunbird': '陽炎鳥',
      },
      'replaceText': {
        'Ashen Eye': '闇の瞳',
        'Blazing Rain': '炎の雨',
        'Brightened Fire': '光の炎',
        '(?<!\\w )Charplume': '闇の劫火天焦',
        'Darkened Fire': '闇の炎',
        'Dead Rebirth': '黒き不死鳥',
        'Devouring Brand': '十字走火',
        'Experimental Charplume': '魔力錬成：闇の劫火天焦',
        'Experimental Fireplume': '魔力錬成：劫火天焦',
        'Flames of Undeath': '反魂の炎',
        'Flare of Condemnation': '獄炎の火撃',
        'Fledgling Flight': '群鳥飛翔',
        'Heat of Condemnation': '獄炎の炎撃',
        'Joint Pyre': '共燃',
        'Left Cinderwing': '左翼焼却',
        'Right Cinderwing': '右翼焼却',
        'Scorched Exaltation': '灰燼の炎',
        'Searing Breeze': '熱噴射',
        'Trail of Condemnation': '獄炎の焔',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Phoinix': '菲尼克司',
        'Sparkfledged': '火灵鸟',
        'Sunbird': '阳炎鸟',
      },
      'replaceText': {
        '--fire expands--': '--火焰扩大--',
        '--giant fireplume\\?--': '--巨大火柱?--',
        'Ashen Eye': '暗之瞳',
        'Blazing Rain': '炎之雨',
        'Brightened Fire': '光之炎',
        '(?<!\\w )Charplume': '暗之劫火焚天',
        'Darkened Fire': '暗之炎',
        'Dead Rebirth': '黑暗不死鸟',
        'Devouring Brand': '十字地火',
        'Experimental Charplume': '魔力炼成：暗之劫火焚天',
        'Experimental Fireplume': '魔力炼成：劫火焚天',
        'Flames of Undeath': '返魂之炎',
        'Flare of Condemnation': '狱炎火击',
        'Fledgling Flight': '群鸟飞翔',
        'Heat of Condemnation': '狱炎炎击',
        'Joint Pyre': '共燃',
        'Left Cinderwing': '左翼焚烧',
        'Right Cinderwing': '右翼焚烧',
        'Scorched Exaltation': '灰烬火焰',
        'Searing Breeze': '热喷射',
        'Trail of Condemnation': '狱炎之焰',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Phoinix': '菲尼克斯',
        'Sparkfledged': '火靈鳥',
        'Sunbird': '陽炎鳥',
      },
      'replaceText': {
        '--fire expands--': '十字地火',
        // '--giant fireplume\\?--': '', // FIXME '--巨大火柱?--'
        'Ashen Eye': '暗之瞳',
        'Blazing Rain': '炎之雨',
        'Brightened Fire': '光之炎',
        '(?<!\\w )Charplume': '暗之劫火焚天',
        'Darkened Fire': '暗之炎',
        'Dead Rebirth': '黑暗不死鳥',
        'Devouring Brand': '十字地火',
        'Experimental Charplume': '魔力煉成：暗之劫火焚天',
        'Experimental Fireplume': '魔力煉成：劫火焚天',
        'Flames of Undeath': '返魂之炎',
        'Flare of Condemnation': '獄炎火擊',
        'Fledgling Flight': '群鳥飛翔',
        'Heat of Condemnation': '獄炎炎擊',
        'Joint Pyre': '共燃',
        'Left Cinderwing': '左翼焚燒',
        'Right Cinderwing': '右翼焚燒',
        'Scorched Exaltation': '灰燼火焰',
        'Searing Breeze': '熱噴射',
        'Trail of Condemnation': '獄炎之焰',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Phoinix': '페넥스',
        'Sparkfledged': '화령조',
        'Sunbird': '양염조',
      },
      'replaceText': {
        '--fire expands--': '--불장판 커짐--',
        '--giant fireplume\\?--': '--특대 장판?--',
        'Ashen Eye': '어둠의 눈동자',
        'Blazing Rain': '불비',
        'Brightened Fire': '빛의 불꽃',
        '(?<!\\w )Charplume': '어둠의 겁화천초',
        'Darkened Fire': '어둠의 불꽃',
        'Dead Rebirth': '검은 불사조',
        'Devouring Brand': '십자 불길',
        'Experimental Charplume': '마력 연성: 어둠의 겁화천초',
        'Experimental Fireplume': '마력 연성: 겁화천초',
        'Flames of Undeath': '반혼의 불꽃',
        'Flare of Condemnation': '지옥불 화격',
        'Fledgling Flight': '새떼 비상',
        'Heat of Condemnation': '지옥불 염격',
        'Joint Pyre': '동반 연소',
        'Left Cinderwing/Right Cinderwing': '왼/오른날개 소각',
        'Scorched Exaltation': '잿더미 화염',
        'Searing Breeze': '열 분사',
        'Trail of Condemnation': '지옥불 불길',
      },
    },
  ],
};

export default triggerSet;
