import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Pilgrim's Traverse Stones 21-30

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones21_30',
  zoneId: ZoneId.PilgrimsTraverseStones21_30,

  triggers: [
    // ---------------- Stone 21-29 Mobs ----------------
    {
      id: 'PT 21-30 Traverse Clionid Parasitism',
      // enrage on targeted player
      type: 'StartsUsing',
      netRegex: { id: 'AE89', source: 'Traverse Clionid', capture: true },
      alertText: (data, matches, output) => {
        const target = matches.target;
        if (target === undefined)
          return output.enrage!();
        if (target === data.me)
          return output.enrageOnYou!();
        return output.enrageOnPlayer!({ player: data.party.member(target) });
      },
      outputStrings: {
        enrage: {
          en: 'Parasitism',
          ja: 'Parasitism',
          ko: '포식',
        },
        enrageOnYou: {
          en: 'Parasitism on YOU',
          ja: 'Parasitism on YOU',
          ko: '내게 포식!',
        },
        enrageOnPlayer: {
          en: 'Parasitism on ${player}',
          ja: 'Parasitism on ${player}',
          ko: '포식: ${player}',
        },
      },
    },
    {
      id: 'PT 21-30 Forgiven Intolerance Swinge',
      type: 'StartsUsing',
      netRegex: { id: 'AE8C', source: 'Forgiven Intolerance', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'PT 21-30 Forgiven Ambition Ripper Claw',
      type: 'StartsUsing',
      netRegex: { id: 'AE7D', source: 'Forgiven Ambition', capture: false },
      response: Responses.awayFromFront(),
    },
    // ---------------- Stone 30 Boss: Forgiven Treachery ----------------
    // 9A3F = Liturgy of Light dummy self-cast
    // 9ADA = Brutal Halo inner ring
    // 9ADB = Brutal Halo inner-middle ring
    // 9AFA = Brutal Halo outer-middle ring
    // 9B3F = Brutal Halo outer ring
    // 9BC4 = Bounds of Indulgence spinning discs?
    // 9DD1 = Grip of Salvation dummy self-cast
    // 9E67 = Grip of Salvation damage cast
    // 9E65 = Grip of Salvation dummy self-cast
    // AF7F = Grip of Salvation damage cast
    // 9E66 = Salvation's Reach instant dummy self-cast
    // 9DDB = Salvation's Reach instant dummy self-cast
    // 9E68 = Salvation's Reach damage cast (very short)
    // 9E69 = Salvation's Reach damage cast (very short)
    // AF75 = Divine Favor dummy self-cast
    // AF76 = Divine Favor environment-targeted telegraph cast
    // AF77 = Divine Favor environment-targeted damage cast
    {
      id: 'PT 21-30 Forgiven Treachery Brutal Halo',
      type: 'StartsUsing',
      netRegex: {
        id: ['9ADA', '9ADB', '9AFA', '9B3F'],
        source: 'Forgiven Treachery',
        capture: true,
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      durationSeconds: 4,
      countdownSeconds: 4,
      infoText: (_data, matches, output) => {
        const id = matches.id;
        switch (id) {
          case '9ADA':
            return output.middleOrOuter!();
          case '9ADB':
            return output.innerOrOuter!();
          case '9AFA':
            return output.innerOrMiddle!();
          case '9B3F':
            return output.innerOrMiddle!();
        }
      },
      outputStrings: {
        middleOrOuter: {
          en: 'Get Middle or Outer ring',
          ja: 'Get Middle or Outer ring',
          ko: '중간 / 바깥 링으로',
        },
        innerOrOuter: {
          en: 'Get Inner or Outer ring',
          ja: 'Get Inner or Outer ring',
          ko: '안쪽 / 바깥 링으로',
        },
        innerOrMiddle: {
          en: 'Get Inner or Middle ring',
          ja: 'Get Inner or Middle ring',
          ko: '안쪽 / 중간 링으로',
        },
      },
    },
    {
      id: 'PT 21-30 Forgiven Treachery Grip of Salvation',
      type: 'StartsUsing',
      netRegex: { id: ['9E67', 'AF7F'], source: 'Forgiven Treachery', capture: true },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      alertText: (_data, matches, output) => {
        const id = matches.id;
        if (id === '9E67')
          return output.left!();
        return output.right!();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'PT 21-30 Forgiven Treachery Salvation\'s Reach',
      // damage cast is too short to give a useful notification; use cleave cast as a proxy
      type: 'Ability',
      netRegex: { id: ['9E67', 'AF7F'], source: 'Forgiven Treachery', capture: true },
      durationSeconds: 8,
      alertText: (_data, matches, output) => {
        const id = matches.id;
        if (id === '9E67')
          return output.text!({ dir: output.right!() });
        return output.text!({ dir: output.left!() });
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        text: {
          en: '${dir}, Behind Hand',
          ja: '${dir}, Behind Hand',
          ko: '${dir}, 손 뒤로',
        },
      },
    },
    {
      id: 'PT 21-30 Forgiven Treachery Divine Favor',
      type: 'HeadMarker',
      netRegex: { id: '00C5', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: 12,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chasing AoE on YOU',
          ja: '追跡AOE',
          ko: '내게 따라오는 장판',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Forgiven Ambition': 'geläutert(?:e|er|es|en) Begierde',
        'Forgiven Intolerance': 'geläutert(?:e|er|es|en) Intoleranz',
        'Forgiven Treachery': 'geläutert(?:e|er|es|en) Verrat',
        'Traverse Clionid': 'Wallfahrt-Clionid',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Forgiven Ambition': 'ambition pardonnée',
        'Forgiven Intolerance': 'intolérance pardonnée',
        'Forgiven Treachery': 'traîtrise pardonnée',
        'Traverse Clionid': 'clionide du pèlerinage',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Forgiven Ambition': 'フォーギヴン・アンビション',
        'Forgiven Intolerance': 'フォーギヴン・イントーラランス',
        'Forgiven Treachery': 'フォーギヴン・トレチャリー',
        'Traverse Clionid': 'トラバース・クリオニッド',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Forgiven Ambition': '면죄된 야망',
        'Forgiven Intolerance': '면죄된 편협',
        'Forgiven Treachery': '면죄된 배반',
        'Traverse Clionid': '순례길 클리오니드',
      },
    },
  ],
};

export default triggerSet;
