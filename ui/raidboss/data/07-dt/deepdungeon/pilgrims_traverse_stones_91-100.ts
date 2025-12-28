import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Pilgrim's Traverse Stones 91-100

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones91_100',
  zoneId: ZoneId.PilgrimsTraverseStones91_100,

  triggers: [
    // ---------------- Stone 91-98 Mobs ----------------
    {
      id: 'PT 91-100 Invoked Dreamer Dark Vision',
      // goes through walls
      type: 'StartsUsing',
      netRegex: { id: 'AD3D', source: 'Invoked Dreamer', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Invoked Dreamer Endless Nightmare',
      type: 'StartsUsing',
      netRegex: { id: 'AD3E', source: 'Invoked Dreamer', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'PT 91-100 Traverse Ya-te-veo Rotten Stench',
      // goes through walls
      type: 'StartsUsing',
      netRegex: { id: 'ADD4', source: 'Traverse Ya-te-veo', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Traverse Violet Triffid Creeping Ivy',
      type: 'StartsUsing',
      netRegex: { id: 'ADD3', source: 'Traverse Violet Triffid', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 91-100 Invoked Poppet Whinge',
      type: 'StartsUsing',
      netRegex: { id: 'ADE0', source: 'Invoked Poppet', capture: false },
      response: Responses.outOfMelee(),
    },
    {
      id: 'PT 91-100 Invoked Sawtooth Honeyed Front',
      type: 'StartsUsing',
      netRegex: { id: 'AD44', source: 'Invoked Sawtooth', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Invoked Sawtooth Honeyed Left',
      type: 'StartsUsing',
      netRegex: { id: 'AD45', source: 'Invoked Sawtooth', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Front + Right',
          ja: 'Go Front + Right',
          ko: '앞+오른쪽으로',
        },
      },
    },
    {
      id: 'PT 91-100 Invoked Sawtooth Honeyed Right',
      type: 'StartsUsing',
      netRegex: { id: 'AD46', source: 'Invoked Sawtooth', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Front + Left',
          ja: 'Go Front + Left',
          ko: '앞+왼쪽으로',
        },
      },
    },
    {
      id: 'PT 91-100 Invoked Bachelor Arachne Web',
      type: 'StartsUsing',
      netRegex: { id: 'AD41', source: 'Invoked Bachelor', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => output.breakLOS!({ name: matches.source }),
      outputStrings: {
        breakLOS: {
          en: 'Break line-of-sight to ${name}',
          ja: '${name}の視線から隠れる',
          ko: '시선 잘라요: ${name}',
        },
      },
    },
    {
      id: 'PT 91-100 Traverse Warg Triple/Quadruple Skull Dasher',
      type: 'StartsUsing',
      netRegex: { id: ['AD33', 'AD34'], source: 'Traverse Warg', capture: true },
      infoText: (_data, matches, output) => {
        const blows = matches.id === 'AD33' ? 3 : 4;
        return output.text!({ count: blows });
      },
      outputStrings: {
        text: {
          en: '${count}x attacks => Out of Melee',
          ja: '${count}x attacks => Out of Melee',
          ko: '공격x${count} 🔜 근접 피해요',
        },
      },
    },
    {
      id: 'PT 91-100 Traverse Warg Heavy Smash',
      type: 'StartsUsing',
      netRegex: { id: 'AD36', source: 'Traverse Warg', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Invoked Dahak Tail Drive',
      type: 'StartsUsing',
      netRegex: { id: 'ADDB', source: 'Invoked Dahak', capture: false },
      response: Responses.goFront(),
    },
    {
      id: 'PT 91-100 Invoked Dahak Lithic Breath',
      // might bait Tail Drive if you dodge behind
      type: 'StartsUsing',
      netRegex: { id: 'ADDC', source: 'Invoked Dahak', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'PT 91-100 Invoked Archaeodemon Unholy Darkness',
      // ground-targeted medium AoE with late telegraph
      type: 'StartsUsing',
      netRegex: { id: 'ADE2', source: 'Invoked Archaeodemon', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid AoE',
          ja: 'Avoid AoE',
          ko: '장판 피해욧',
        },
      },
    },
    {
      id: 'PT 91-100 Invoked Archaeodemon Karma',
      type: 'StartsUsing',
      netRegex: { id: 'ADE3', source: 'Invoked Archaeodemon', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Traverse Malevolence Smashing Blow',
      type: 'StartsUsing',
      netRegex: { id: 'ADE1', source: 'Traverse Malevolence', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Invoked Gusion Right Smite',
      type: 'StartsUsing',
      netRegex: { id: 'AD39', source: 'Invoked Gusion', capture: false },
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'PT 91-100 Invoked Gusion Left Smite',
      type: 'StartsUsing',
      netRegex: { id: 'AD3B', source: 'Invoked Gusion', capture: false },
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'PT 91-100 Invoked Acheron Authority\'s Edge Right',
      type: 'StartsUsing',
      netRegex: { id: 'ADDD', source: 'Invoked Acheron', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'PT 91-100 Invoked Acheron Authority\'s Edge Left',
      type: 'StartsUsing',
      netRegex: { id: 'ADDE', source: 'Invoked Acheron', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'PT 91-100 Invoked Destrudo Stare',
      // goes through walls
      type: 'StartsUsing',
      netRegex: { id: 'AD42', source: 'Invoked Destrudo', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 91-100 Invoked Destrudo Mortal Gaze',
      type: 'StartsUsing',
      netRegex: { id: 'AD43', source: 'Invoked Destrudo', capture: true },
      response: Responses.lookAwayFromSource(),
    },
    // ---------------- Stone 99 Boss: Eminent Grief/Devoured Eater ----------------
    // triggers in The Final Verse: pilgrims_traverse_the_final_verse.ts
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Invoked Acheron': 'gerufen(?:e|er|es|en) Acheron',
        'Invoked Archaeodemon': 'gerufen(?:e|er|es|en) Archaeodämon',
        'Invoked Bachelor': 'gerufen(?:e|er|es|en) Spinnrich',
        'Invoked Dahak': 'gerufen(?:e|er|es|en) Dahak',
        'Invoked Destrudo': 'gerufen(?:e|er|es|en) Destrudo',
        'Invoked Dreamer': 'gerufen(?:e|er|es|en) bös(?:e|er|es|en) Träumer',
        'Invoked Gusion': 'gerufen(?:e|er|es|en) Gusion',
        'Invoked Poppet': 'gerufen(?:e|er|es|en) Puppe',
        'Invoked Sawtooth': 'gerufen(?:e|er|es|en) Sägezahn',
        'Traverse Malevolence': 'Wallfahrt-Böswilligkeit',
        'Traverse Violet Triffid': 'violett(?:e|er|es|en) Wallfahrt-Triffid',
        'Traverse Warg': 'Wallfahrt-Warg',
        'Traverse Ya-te-veo': 'Wallfahrt-Yateveo',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Invoked Acheron': 'achéron invoqué',
        'Invoked Archaeodemon': 'archéodémon invoqué',
        'Invoked Bachelor': 'aranéide invoqué',
        'Invoked Dahak': 'dahaka invoqué',
        'Invoked Destrudo': 'destrudo invoqué',
        'Invoked Dreamer': 'rêveur maudit invoqué',
        'Invoked Gusion': 'gusion invoqué',
        'Invoked Poppet': 'poupée invoquée',
        'Invoked Sawtooth': 'dentata invoqué',
        'Traverse Malevolence': 'malveillance du pèlerinage',
        'Traverse Violet Triffid': 'triffide violet du pèlerinage',
        'Traverse Warg': 'warg du pèlerinage',
        'Traverse Ya-te-veo': 'yateveo du pèlerinage',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Invoked Acheron': 'インヴォークド・アケローン',
        'Invoked Archaeodemon': 'インヴォークド・アルケオデーモン',
        'Invoked Bachelor': 'インヴォークド・バチェラー',
        'Invoked Dahak': 'インヴォークド・ダハーカ',
        'Invoked Destrudo': 'インヴォークド・デストルドー',
        'Invoked Dreamer': 'インヴォークド・ドリームエビル',
        'Invoked Gusion': 'インヴォークド・グシオン',
        'Invoked Poppet': 'インヴォークド・パペット',
        'Invoked Sawtooth': 'インヴォークド・ソウトゥース',
        'Traverse Malevolence': 'トラバース・マレヴォレンス',
        'Traverse Violet Triffid': 'トラバース・ヴァイオレットトリフィド',
        'Traverse Warg': 'トラバース・ワーグ',
        'Traverse Ya-te-veo': 'トラバース・ヤテベオ',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Invoked Acheron': '부름받은 아케론',
        'Invoked Archaeodemon': '부름받은 원시 악마',
        'Invoked Bachelor': '부름받은 총각거미',
        'Invoked Dahak': '부름받은 다하카',
        'Invoked Destrudo': '부름받은 데스트루도',
        'Invoked Dreamer': '부름받은 몽마',
        'Invoked Gusion': '부름받은 구시온',
        'Invoked Poppet': '부름받은 꼭두각시',
        'Invoked Sawtooth': '부름받은 톱날이빨',
        'Traverse Malevolence': '순례길 악의',
        'Traverse Violet Triffid': '순례길 보라 트리피드',
        'Traverse Warg': '순례길 바르그',
        'Traverse Ya-te-veo': '순례길 야테베오',
      },
    },
  ],
};

export default triggerSet;
