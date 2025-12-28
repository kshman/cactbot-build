import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Pilgrim's Traverse Stones 31-40
// TODO: Forgiven Naivety Blown Blessing add order

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones31_40',
  zoneId: ZoneId.PilgrimsTraverseStones31_40,

  triggers: [
    // ---------------- Stone 31-39 Mobs ----------------
    {
      id: 'PT 31-40 Traverse Pegasus Gallop',
      type: 'StartsUsing',
      netRegex: { id: 'AE9E', source: 'Traverse Pegasus', capture: true },
      response: Responses.knockbackOn(),
    },
    {
      id: 'PT 31-40 Traverse Pegasus Nicker',
      type: 'StartsUsing',
      netRegex: { id: 'AE9F', source: 'Traverse Pegasus', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'PT 31-40 Traverse Inquisitor Death\'s Door',
      type: 'StartsUsing',
      netRegex: { id: 'AE96', source: 'Traverse Inquisitor', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 31-40 Forgiven Petulance Left Tentacle',
      type: 'StartsUsing',
      netRegex: { id: 'AE92', source: 'Forgiven Petulance', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'PT 31-40 Forgiven Petulance Right Tentacle',
      type: 'StartsUsing',
      netRegex: { id: 'AE93', source: 'Forgiven Petulance', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'PT 31-40 Traverse Soldierstone Hand of Judgment',
      type: 'StartsUsing',
      netRegex: { id: '9E6D', source: 'Traverse Soldierstone', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      response: Responses.outOfMelee(),
    },
    {
      id: 'PT 31-40 Traverse Soldierstone Moatmaker',
      // follows-up with 9E6F Buster Knuckles instant medium AoE
      type: 'StartsUsing',
      netRegex: { id: '9E6E', source: 'Traverse Soldierstone', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid jump => Out',
          ja: 'Avoid jump => Out',
          ko: '점프 피하고 🔜 밖으로',
        },
      },
    },
    {
      id: 'PT 31-40 Traverse Soldierstone Buster Knuckles',
      type: 'StartsUsing',
      netRegex: { id: '9E6F', source: 'Traverse Soldierstone', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'PT 31-40 Forgiven Plague Poison Pollen Pair',
      type: 'StartsUsing',
      netRegex: { id: 'A180', source: 'Forgiven Plague', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'PT 31-40 Forgiven Prejudice Petrifying Light',
      type: 'StartsUsing',
      netRegex: { id: 'AE8F', source: 'Forgiven Prejudice', capture: true },
      response: Responses.lookAwayFromSource(),
    },
    // ---------------- Stone 40 Boss: Forgiven Naivety ----------------
    {
      id: 'PT 31-40 Forgiven Naivety Blown Blessing',
      type: 'StartsUsing',
      netRegex: { id: ['A48B', 'A48C'], source: 'Forgiven Naivety', capture: true },
      durationSeconds: 18,
      infoText: (_data, matches, output) => {
        const mech = matches.id === 'A48B' ? output.knockback!() : output.aoe!();
        return output.text!({ mech: mech });
      },
      outputStrings: {
        text: {
          en: '${mech} x3',
          ja: '${mech} x3',
          ko: '${mech}x3',
        },
        knockback: Outputs.knockback,
        aoe: Outputs.aoe,
      },
    },
    {
      id: 'PT 31-40 Forgiven Naivety Near Tide',
      type: 'StartsUsing',
      netRegex: { id: 'B041', source: 'Forgiven Naivety', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'PT 31-40 Forgiven Naivety Far Tide',
      type: 'StartsUsing',
      netRegex: { id: 'B042', source: 'Forgiven Naivety', capture: false },
      response: Responses.getIn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Forgiven Naivety': 'geläutert(?:e|er|es|en) Naivität',
        'Forgiven Petulance': 'geläutert(?:e|er|es|en) Launenhaftigkeit',
        'Forgiven Plague': 'geläutert(?:e|er|es|en) Plage',
        'Forgiven Prejudice': 'geläutert(?:e|er|es|en) Voreingenommenheit',
        'Traverse Inquisitor': 'Wallfahrt-Inquisitor',
        'Traverse Pegasus': 'Wallfahrt-Pegasus',
        'Traverse Soldierstone': 'Wallfahrt-Steinsoldat',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Forgiven Naivety': 'naïveté pardonnée',
        'Forgiven Petulance': 'irascibilité pardonnée',
        'Forgiven Plague': 'peste pardonnée',
        'Forgiven Prejudice': 'préjugé pardonné',
        'Traverse Inquisitor': 'inquisiteur du pèlerinage',
        'Traverse Pegasus': 'pégase du pèlerinage',
        'Traverse Soldierstone': 'soldat de pierre du pèlerinage',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Forgiven Naivety': 'フォーギヴン・ナイヴテイ',
        'Forgiven Petulance': 'フォーギヴン・ペチュランス',
        'Forgiven Plague': 'フォーギヴン・プレイグ',
        'Forgiven Prejudice': 'フォーギヴン・プレジュディス',
        'Traverse Inquisitor': 'トラバース・インクイジター',
        'Traverse Pegasus': 'トラバース・ペガサス',
        'Traverse Soldierstone': 'トラバース・ストーンソルジャー',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Forgiven Naivety': '면죄된 순진',
        'Forgiven Petulance': '면죄된 심술',
        'Forgiven Plague': '면죄된 역병',
        'Forgiven Prejudice': '면죄된 편견',
        'Traverse Inquisitor': '순례길 심문관',
        'Traverse Pegasus': '순례길 페가수스',
        'Traverse Soldierstone': '순례길 석병',
      },
    },
  ],
};

export default triggerSet;
