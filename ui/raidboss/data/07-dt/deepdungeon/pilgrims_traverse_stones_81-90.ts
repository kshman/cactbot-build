import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Pilgrim's Traverse Stones 81-90
// TODO: Malacoda Arcane Beacon safespots

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones81_90',
  zoneId: ZoneId.PilgrimsTraverseStones81_90,

  triggers: [
    // ---------------- Stone 81-89 Mobs ----------------
    {
      id: 'PT 81-90 Traverse Cubus Dark II',
      type: 'StartsUsing',
      netRegex: { id: 'AEE7', source: 'Traverse Cubus', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 81-90 Traverse Gnoll Nox Blast',
      type: 'StartsUsing',
      netRegex: { id: 'AEE6', source: 'Traverse Gnoll', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 81-90 Traverse Gnoll Maul',
      // enrage on targeted player, goes through walls
      type: 'StartsUsing',
      netRegex: { id: 'AEE5', source: 'Traverse Gnoll', capture: true },
      alertText: (data, matches, output) => {
        const target = matches.target;
        if (target === undefined)
          return output.maul!();
        if (target === data.me)
          return output.maulOnYou!();
        return output.maulOnPlayer!({ player: data.party.member(target) });
      },
      outputStrings: {
        maul: {
          en: 'Maul',
          ja: 'Maul',
          ko: '물어 죽이기',
        },
        maulOnYou: {
          en: 'Maul on YOU',
          ja: 'Maul on YOU',
          ko: '내게 물어 죽이기',
        },
        maulOnPlayer: {
          en: 'Maul on ${player}',
          ja: 'Maul on ${player}',
          ko: '물어 죽이기: ${player}',
        },
      },
    },
    {
      id: 'PT 81-90 Invoked Gremlin Claw',
      type: 'StartsUsing',
      netRegex: { id: 'AEE2', source: 'Invoked Gremlin', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 81-90 Traverse Rider Valfodr',
      type: 'StartsUsing',
      netRegex: { id: 'A937', source: 'Traverse Rider', capture: true },
      response: Responses.knockbackOn(),
    },
    {
      id: 'PT 81-90 Traverse Rider Storm Slash',
      type: 'StartsUsing',
      netRegex: { id: 'A939', source: 'Traverse Rider', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 81-90 Invoked Arch Demon Abyssal Swing',
      type: 'StartsUsing',
      netRegex: { id: 'AEEC', source: 'Invoked Arch Demon', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 81-90 Invoked Satana Blizzard Trap',
      type: 'StartsUsing',
      netRegex: { id: 'AEEB', source: 'Invoked Satana', capture: false },
      response: Responses.outOfMelee(),
    },
    {
      id: 'PT 81-90 Invoked Succubus Passions\' Heat',
      // applies 3C0 Pyretic in an AoE for 3s, lethal damage if doing anything
      type: 'StartsUsing',
      netRegex: { id: 'A93A', source: 'Invoked Succubus', capture: true },
      alarmText: (data, matches, output) => {
        const target = matches.target;
        if (target === undefined)
          return output.heat!();
        if (target === data.me)
          return output.heatOnYou!();
        return output.heatOnPlayer!({ player: data.party.member(target) });
      },
      outputStrings: {
        heat: {
          en: 'Pyretic, Avoid AoE',
          ja: 'Pyretic, Avoid AoE',
          ko: '파이레틱, 장판 피해욧',
        },
        heatOnYou: {
          en: 'Pyretic on YOU, Away from Group => Stop Everything!',
          ja: 'Pyretic on YOU, Away from Group => Stop Everything!',
          ko: '내게 파이레틱, 혼자 멀리 🔜 그대로 멈춰욧!',
        },
        heatOnPlayer: {
          en: 'Pyretic on ${player}, Avoid AoE',
          ja: 'Pyretic on ${player}, Avoid AoE',
          ko: '파이레틱: ${player}, 장판 피해욧',
        },
      },
    },
    {
      id: 'PT 81-90 Invoked Succubus Passions\' Heat Pyretic',
      // 3C0 = Pyretic, lethal damage if doing anything
      type: 'GainsEffect',
      netRegex: { effectId: '3C0', capture: true },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      countdownSeconds: (_data, matches) => parseFloat(matches.duration),
      response: Responses.stopEverything(),
    },
    {
      id: 'PT 81-90 Invoked Troubadour Dark II',
      type: 'StartsUsing',
      netRegex: { id: 'AEF3', source: 'Invoked Troubadour', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 81-90 Invoked Troubadour Inner Demons',
      type: 'StartsUsing',
      netRegex: { id: 'AEF4', source: 'Invoked Troubadour', capture: false },
      response: Responses.outOfMelee(),
    },
    {
      id: 'PT 81-90 Invoked Cerberus Lightning Bolt',
      // medium-sized AoE, locks-on to a player ground position at start of cast
      type: 'StartsUsing',
      netRegex: { id: 'AEF0', source: 'Invoked Cerberus', capture: false },
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
      id: 'PT 81-90 Invoked Cerberus Hellclaw',
      type: 'StartsUsing',
      netRegex: { id: 'AEF1', source: 'Invoked Cerberus', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'PT 81-90 Invoked Cerberus Tail Blow',
      type: 'StartsUsing',
      netRegex: { id: 'AEF2', source: 'Invoked Cerberus', capture: false },
      response: Responses.goFront(),
    },
    {
      id: 'PT 81-90 Invoked Humbaba Triple/Quadruple Blow',
      type: 'StartsUsing',
      netRegex: { id: ['A93B', 'A93C'], source: 'Invoked Humbaba', capture: true },
      infoText: (_data, matches, output) => {
        const blows = matches.id === 'A93B' ? 3 : 4;
        return output.text!({ count: blows });
      },
      outputStrings: {
        text: {
          en: '${count}x attacks => Get Behind',
          ja: '${count}x attacks => Get Behind',
          ko: '공격x${count} 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'PT 81-90 Invoked Humbaba Bellows',
      type: 'StartsUsing',
      netRegex: { id: 'AD05', source: 'Invoked Humbaba', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 81-90 Invoked Caym Double Hex Eye',
      type: 'StartsUsing',
      netRegex: { id: 'AEEE', source: 'Invoked Caym', capture: true },
      response: Responses.lookAwayFromSource(),
    },
    {
      id: 'PT 81-90 Invoked Baal Incinerating Lahar',
      type: 'StartsUsing',
      netRegex: { id: 'A87D', source: 'Invoked Baal', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
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
      id: 'PT 81-90 Invoked Baal Abyssal Ray',
      // goes through walls
      type: 'StartsUsing',
      netRegex: { id: 'A87E', source: 'Invoked Baal', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'PT 81-90 Traverse Cama Claw and Tail',
      type: 'StartsUsing',
      netRegex: { id: 'A87C', source: 'Traverse Cama', capture: false },
      response: Responses.goSides(),
    },
    // ---------------- Stone 90 Boss: Malacoda ----------------
    {
      id: 'PT 81-90 Malacoda Backhand Right',
      type: 'StartsUsing',
      netRegex: { id: 'ACDA', source: 'Malacoda', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Behind + Left',
          ja: 'Get Behind + Left',
          ko: '뒤+왼쪽으로',
        },
      },
    },
    {
      id: 'PT 81-90 Malacoda Backhand Left',
      type: 'StartsUsing',
      netRegex: { id: 'ACDB', source: 'Malacoda', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Behind + Right',
          ja: 'Get Behind + Right',
          ko: '뒤+오른쪽으로',
        },
      },
    },
    {
      id: 'PT 81-90 Malacoda Fore-hind Folly',
      type: 'StartsUsing',
      netRegex: { id: 'ACE2', source: 'Malacoda', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'PT 81-90 Malacoda Twin-winged Treachery',
      type: 'StartsUsing',
      netRegex: { id: 'ACE3', source: 'Malacoda', capture: false },
      response: Responses.goFrontBack(),
    },
    {
      id: 'PT 81-90 Malacoda Skinflayer',
      type: 'StartsUsing',
      netRegex: { id: 'ACEA', source: 'Malacoda', capture: false },
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Invoked Arch Demon': 'gerufen(?:e|er|es|en) Erzdämon',
        'Invoked Baal': 'gerufen(?:e|er|es|en) Bael',
        'Invoked Caym': 'gerufen(?:e|er|es|en) Caym',
        'Invoked Cerberus': 'gerufen(?:e|er|es|en) Cerberus',
        'Invoked Gremlin': 'gerufen(?:e|er|es|en) Gremlin',
        'Invoked Humbaba': 'gerufen(?:e|er|es|en) Hunbaba',
        'Invoked Satana': 'gerufen(?:e|er|es|en) Satana',
        'Invoked Succubus': 'gerufen(?:e|er|es|en) Sukkubus',
        'Invoked Troubadour': 'gerufen(?:e|er|es|en) Troubadour',
        'Malacoda': 'Malacoda',
        'Traverse Cama': 'Wallfahrt-Cama',
        'Traverse Cubus': 'Wallfahrt-Lunte',
        'Traverse Gnoll': 'Wallfahrt-Gnoll',
        'Traverse Rider': 'Wallfahrt-Reiter',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Invoked Arch Demon': 'archidémon invoqué',
        'Invoked Baal': 'baël invoqué',
        'Invoked Caym': 'caym invoqué',
        'Invoked Cerberus': 'cerbère invoqué',
        'Invoked Gremlin': 'gremlin invoqué',
        'Invoked Humbaba': 'humbaba invoqué',
        'Invoked Satana': 'minisatana invoqué',
        'Invoked Succubus': 'succube invoqué',
        'Invoked Troubadour': 'troubadour invoqué',
        'Malacoda': 'Malacoda',
        'Traverse Cama': 'chama du pèlerinage',
        'Traverse Cubus': 'oléofuror du pèlerinage',
        'Traverse Gnoll': 'gnole du pèlerinage',
        'Traverse Rider': 'cavalier du pèlerinage',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Invoked Arch Demon': 'インヴォークド・アークデーモン',
        'Invoked Baal': 'インヴォークド・バエル',
        'Invoked Caym': 'インヴォークド・カイム',
        'Invoked Cerberus': 'インヴォークド・ケルベロス',
        'Invoked Gremlin': 'インヴォークド・グレムリン',
        'Invoked Humbaba': 'インヴォークド・フンババ',
        'Invoked Satana': 'インヴォークド・サタナジュニア',
        'Invoked Succubus': 'インヴォークド・サキュバス',
        'Invoked Troubadour': 'インヴォークド・トルバドゥール',
        'Malacoda': 'マラコーダ',
        'Traverse Cama': 'トラバース・キャマ',
        'Traverse Cubus': 'トラバース・カブス',
        'Traverse Gnoll': 'トラバース・ノール',
        'Traverse Rider': 'トラバース・ライダー',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Invoked Arch Demon': '부름받은 아크데몬',
        'Invoked Baal': '부름받은 바엘',
        'Invoked Caym': '부름받은 카임',
        'Invoked Cerberus': '부름받은 케르베로스',
        'Invoked Gremlin': '부름받은 그렘린',
        'Invoked Humbaba': '부름받은 훔바바',
        'Invoked Satana': '부름받은 소악마',
        'Invoked Succubus': '부름받은 서큐버스',
        'Invoked Troubadour': '부름받은 방랑음악가',
        'Malacoda': '말라코다',
        'Traverse Cama': '순례길 카마',
        'Traverse Cubus': '순례길 컵푸딩',
        'Traverse Gnoll': '순례길 놀',
        'Traverse Rider': '순례길 기수',
      },
    },
  ],
};

export default triggerSet;
