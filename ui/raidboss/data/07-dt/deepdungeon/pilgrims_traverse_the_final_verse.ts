import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Pilgrim's Traverse Stone 99/The Final Verse
// TODO: Bounds of Sin dodge direction
// TODO: Abysal Blaze left/right safe spots
// TODO: timeline

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'TheFinalVerse',
  zoneId: [
    ZoneId.PilgrimsTraverseStones91_100,
    ZoneId.TheFinalVerse,
  ],
  zoneLabel: {
    en: 'Pilgrim\'s Traverse Stone 99/The Final Verse',
  },

  triggers: [
    // ---------------- Stone 99/The Final Verse Boss: Eminent Grief/Devoured Eater ----------------
    {
      id: 'PT 99 Devoured Eater Blade of First Light',
      type: 'StartsUsing',
      netRegex: { id: ['AC21', 'AC22', 'AC27', 'AC28'], source: 'Devoured Eater', capture: true },
      alertText: (_data, matches, output) => {
        const id = matches.id;
        if (id === 'AC21' || id === 'AC27')
          return output.sides!();
        return output.middle!();
      },
      outputStrings: {
        sides: Outputs.sides,
        middle: Outputs.goIntoMiddle,
      },
    },
    {
      id: 'PT 99 Eminent Grief Ball of Fire',
      type: 'Ability',
      netRegex: { id: ['AC1D', 'AC24'], source: 'Eminent Grief', capture: false },
      response: Responses.moveAway('alarm'),
    },
    {
      id: 'PT 99 Eminent Grief Chains of Condemnation',
      // raidwide + applies 11D2 Chains of Condemnation for 3s; heavy damage if moving
      type: 'StartsUsing',
      netRegex: { id: ['AC20', 'AC26'], source: 'Eminent Grief', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      countdownSeconds: 5,
      durationSeconds: 8,
      alertText: (_data, _matches, outputs) => outputs.text!(),
      outputStrings: {
        text: {
          en: 'AoE + Stop Moving!',
          ko: '전체 공격 + 동작 그만!',
        },
      },
    },
    {
      id: 'PT 99 Devoured Eater Bounds of Sin',
      // applies 119E Bind for 3s
      // AC33 = sequential damage cast, may have good position data for dodge direction
      type: 'Ability',
      netRegex: { id: 'AC32', source: 'Devoured Eater', capture: false },
      delaySeconds: 3,
      response: Responses.moveAway('alert'),
    },
    {
      id: 'PT 99 Eminent Grief Spinelash Bait',
      // laser will break glass + summon add if it hits a window
      type: 'HeadMarker',
      netRegex: { id: '00EA', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Laser on YOU',
          ko: '내게 레이저!',
        },
      },
    },
    {
      id: 'PT 99 Eminent Grief Spinelash',
      type: 'StartsUsing',
      netRegex: { id: 'B03E', source: 'Eminent Grief', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid laser',
          ko: '레이저 피해요',
        },
      },
    },
    {
      id: 'PT 99 Vodoriga Minion Spawn',
      // 14039 = Vodoriga Minion
      type: 'AddedCombatant',
      netRegex: { npcNameId: '14039', capture: false },
      response: Responses.killExtraAdd(),
    },
    {
      id: 'PT 99 Eminent Grief Drain Aether',
      // AC38 = short cast
      // AC39 = long cast
      // [AC3B, AC3D] = failstate casts?
      type: 'StartsUsing',
      netRegex: { id: ['AC38', 'AC39'], source: 'Eminent Grief', capture: true },
      delaySeconds: (_data, matches) =>
        matches.id === 'AC38' ? 0 : parseFloat(matches.castTime) - 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Light debuff',
          ko: '빛🟡 받아요',
        },
      },
    },
    {
      id: 'PT 99 Devoured Eater Drain Aether',
      // AC3A = short cast
      // AC3C = long cast
      type: 'StartsUsing',
      netRegex: { id: ['AC3A', 'AC3C'], source: 'Devoured Eater', capture: true },
      delaySeconds: (_data, matches) =>
        matches.id === 'AC3A' ? 0 : parseFloat(matches.castTime) - 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Dark debuff',
          ko: '어둠⚫️ 받아요',
        },
      },
    },
    {
      id: 'PT 99 Eminent Grief Abyssal Blaze Safe Spots',
      // AC2A = first cast, horizontal exaflares, front safe
      // AC2B = first cast, vertical exaflares, left or right safe
      // AC2C = second instant cast, horizontal exaflares, back safe
      // AC2D = second instant cast, vertical exaflares, left or right safe
      // AC2E = used approximately 7s after each horizontal/vertical indicator, may have good data for starting positions
      // AC2F = diamonds glow, exaflares start at end of cast
      // AC30 = instant, exaflare explosion/damage
      type: 'Ability',
      netRegex: { id: ['AC2A', 'AC2B', 'AC2C', 'AC2D'], source: 'Eminent Grief', capture: true },
      durationSeconds: 10,
      infoText: (_data, matches, outputs) => {
        const id = matches.id;
        switch (id) {
          case 'AC2A':
            return outputs.text!({ safe: outputs.frontSafe!() });
          case 'AC2B':
            return outputs.text!({ safe: outputs.leftRightSafe!() });
          case 'AC2C':
            return outputs.text!({ safe: outputs.backSafe!() });
          case 'AC2D':
            return outputs.text!({ safe: outputs.leftRightSafe!() });
        }
      },
      outputStrings: {
        text: {
          en: '${safe}, for later',
          ko: '(나중에 ${safe})',
        },
        frontSafe: {
          en: 'Front safe',
          ko: '앞쪽이 안전',
        },
        backSafe: {
          en: 'Back safe',
          ko: '뒤쪽이 안전',
        },
        leftRightSafe: {
          en: 'Check safe side',
          ko: '좌우 안전한 곳 찾아봐요',
        },
      },
    },
    {
      id: 'PT 99 Eminent Grief Abyssal Blaze',
      type: 'StartsUsing',
      netRegex: { id: 'AC2F', source: 'Eminent Grief', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, outputs) => outputs.text!(),
      outputStrings: {
        text: {
          en: 'Avoid Exaflares',
          ko: '엑사플레어 피해요',
        },
      },
    },
    {
      id: 'PT 99 Eminent Grief 불의 알',
      type: 'StartsUsing',
      netRegex: { id: 'AC2F', source: 'Eminent Grief', capture: false },
      delaySeconds: 20,
      durationSeconds: 4,
      suppressSeconds: 1,
      alertText: (_data, _matches, outputs) => outputs.text!(),
      outputStrings: {
        text: {
          en: '(Spread, later)',
          ko: '(곧 구슬, 흩어져요)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Devoured Eater': 'erodiert(?:e|er|es|en) Sündenvertilger',
        'Eminent Grief': 'Eminent(?:e|er|es|en) Trauer',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Devoured Eater': 'purgateur dévoré',
        'Eminent Grief': 'Pontife du Chagrin',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Devoured Eater': '侵蝕された罪喰い',
        'Eminent Grief': 'エミネントグリーフ',
      },
    },
  ],
};

export default triggerSet;
