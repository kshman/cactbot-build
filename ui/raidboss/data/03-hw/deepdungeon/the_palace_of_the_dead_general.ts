import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Triggers applicable to all Palace of the Dead floors.

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'ThePalaceOfTheDeadGeneral',
  zoneId: [
    ZoneId.ThePalaceOfTheDeadFloors1_10,
    ZoneId.ThePalaceOfTheDeadFloors11_20,
    ZoneId.ThePalaceOfTheDeadFloors21_30,
    ZoneId.ThePalaceOfTheDeadFloors31_40,
    ZoneId.ThePalaceOfTheDeadFloors41_50,
    ZoneId.ThePalaceOfTheDeadFloors51_60,
    ZoneId.ThePalaceOfTheDeadFloors61_70,
    ZoneId.ThePalaceOfTheDeadFloors71_80,
    ZoneId.ThePalaceOfTheDeadFloors81_90,
    ZoneId.ThePalaceOfTheDeadFloors91_100,
    ZoneId.ThePalaceOfTheDeadFloors101_110,
    ZoneId.ThePalaceOfTheDeadFloors111_120,
    ZoneId.ThePalaceOfTheDeadFloors121_130,
    ZoneId.ThePalaceOfTheDeadFloors131_140,
    ZoneId.ThePalaceOfTheDeadFloors141_150,
    ZoneId.ThePalaceOfTheDeadFloors151_160,
    ZoneId.ThePalaceOfTheDeadFloors161_170,
    ZoneId.ThePalaceOfTheDeadFloors171_180,
    ZoneId.ThePalaceOfTheDeadFloors181_190,
    ZoneId.ThePalaceOfTheDeadFloors191_200,
  ],
  zoneLabel: {
    en: 'The Palace of the Dead (All Floors)',
    de: 'Palast der Toten (Alle Ebenen)',
    fr: 'Le palais des morts (Tous les étages)',
    ja: '死者の宮殿 (全階層)',
    cn: '死者宫殿 (全楼层)',
    ko: '망자의 궁전 (전체 층)',
  },

  triggers: [
    // ---------------- Mimics ----------------
    {
      id: 'PotD General Mimic Spawn',
      // 2566 = Mimic (appears to be same npcNameId all floors)
      // floor 1-30 bronze chests, can stun or interrupt
      // floor 31-40 silver chests, can stun or interrupt
      // floor 41+ gold chests, can interrupt, immune to stun
      // TODO: some Mimics may spawn after transference between floors and get called early before being found
      type: 'AddedCombatant',
      netRegex: { npcNameId: '2566', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mimic spawned!',
          ja: 'ミミック！',
          ko: '미믹 등장!',
        },
      },
    },
    {
      id: 'PotD General Mimic Infatuation',
      // inflicts Accursed Pox (43F) if not interrupted
      type: 'StartsUsing',
      netRegex: { id: '18FD', source: 'Mimic' },
      response: Responses.interruptIfPossible(),
    },
    // ---------------- Pomanders ----------------
    {
      id: 'PotD General Pomander Duplicate',
      // duplicate pomander message: https://v2.xivapi.com/api/sheet/LogMessage/7222
      // en: You return the pomander of ${pomander} to the coffer. You cannot carry any more of that item.
      type: 'SystemLogMessage',
      netRegex: { id: '1C36' },
      infoText: (_data, matches, output) => {
        switch (parseInt(matches.param1, 16)) {
          case 1:
            return output.duplicate!({ pomander: output.safety!() });
          case 2:
            return output.duplicate!({ pomander: output.sight!() });
          case 3:
            return output.duplicate!({ pomander: output.strength!() });
          case 4:
            return output.duplicate!({ pomander: output.steel!() });
          case 5:
            return output.duplicate!({ pomander: output.affluence!() });
          case 6:
            return output.duplicate!({ pomander: output.flight!() });
          case 7:
            return output.duplicate!({ pomander: output.alteration!() });
          case 8:
            return output.duplicate!({ pomander: output.purity!() });
          case 9:
            return output.duplicate!({ pomander: output.fortune!() });
          case 10:
            return output.duplicate!({ pomander: output.witching!() });
          case 11:
            return output.duplicate!({ pomander: output.serenity!() });
          case 12:
            return output.duplicate!({ pomander: output.rage!() });
          case 13:
            return output.duplicate!({ pomander: output.lust!() });
          case 14:
            return output.duplicate!({ pomander: output.intuition!() });
          case 15:
            return output.duplicate!({ pomander: output.raising!() });
          case 16:
            return output.duplicate!({ pomander: output.resolution!() });
          default:
            return output.duplicate!({ pomander: output.unknown!() });
        }
      },
      outputStrings: {
        duplicate: {
          en: '${pomander} duplicate',
          ja: '${pomander} 被り',
          ko: '${pomander} 중복',
        },
        // pomanders: https://v2.xivapi.com/api/sheet/DeepDungeonItem
        safety: {
          en: 'Safety',
          ja: '呪印解除',
          ko: '함정 해제',
        },
        sight: {
          en: 'Sight',
          ja: 'サイトロ',
          ko: '사이트로',
        },
        strength: {
          en: 'Strength',
          ja: '自己強化',
          ko: '자기 강화',
        },
        steel: {
          en: 'Steel',
          ja: '防御強化',
          ko: '방어 강화',
        },
        affluence: {
          en: 'Affluence',
          ja: '宝箱増加',
          ko: '보물상자 증가',
        },
        flight: {
          en: 'Flight',
          ja: '敵排除',
          ko: '적 감소',
        },
        alteration: {
          en: 'Alteration',
          ja: '敵変化',
          ko: '적 대체',
        },
        purity: {
          en: 'Purity',
          ja: '解呪',
          ko: '저주 해제',
        },
        fortune: {
          en: 'Fortune',
          ja: '運気上昇',
          ko: '운 상승',
        },
        witching: {
          en: 'Witching',
          ja: '形態変化',
          ko: '적 변형',
        },
        serenity: {
          en: 'Serenity',
          ja: '魔法効果解除',
          ko: '마법 효과 해제',
        },
        rage: {
          en: 'Rage',
          ja: 'マンティコア化',
          ko: '만티코어 변신',
        },
        lust: {
          en: 'Lust',
          ja: 'サキュバス化',
          ko: '서큐버스 변신',
        },
        intuition: {
          en: 'Intuition',
          ja: '財宝感知',
          ko: '보물 탐지',
        },
        raising: {
          en: 'Raising',
          ja: 'リレイズ',
          ko: '리레이즈',
        },
        resolution: {
          en: 'Resolution',
          ja: 'クリブ化',
          ko: '쿠리부 변신',
        },
        unknown: Outputs.unknown,
      },
    },
    // ---------------- Floor Notifications ----------------
    {
      id: 'PotD General Cairn of Passage',
      // portal to transfer between floors
      // Cairn of Passage activation message: https://v2.xivapi.com/api/sheet/LogMessage/7245
      // en: The Cairn of Passage is activated!
      type: 'SystemLogMessage',
      netRegex: { id: '1C4D', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Cairn of Passage activated',
          ja: '転移が出来ます',
          ko: '전송 석탑 활성화',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Mimic': 'Nachahmung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Mimic': 'Mime',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Mimic': 'ものまね',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Mimic': '模仿',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Mimic': '模仿',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Mimic': '흉내',
      },
    },
  ],
};

export default triggerSet;
