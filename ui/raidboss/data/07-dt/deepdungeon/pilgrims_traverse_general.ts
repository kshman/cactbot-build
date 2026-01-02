import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Triggers applicable to all Pilgrim's Traverse floors.

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseGeneral',
  zoneId: [
    ZoneId.PilgrimsTraverseStones1_10,
    ZoneId.PilgrimsTraverseStones11_20,
    ZoneId.PilgrimsTraverseStones21_30,
    ZoneId.PilgrimsTraverseStones31_40,
    ZoneId.PilgrimsTraverseStones41_50,
    ZoneId.PilgrimsTraverseStones51_60,
    ZoneId.PilgrimsTraverseStones61_70,
    ZoneId.PilgrimsTraverseStones71_80,
    ZoneId.PilgrimsTraverseStones81_90,
    ZoneId.PilgrimsTraverseStones91_100,
  ],
  zoneLabel: {
    en: 'Pilgrim\'s Traverse (All Stones)',
    de: 'Pilgers Pfad (Alle Steine)',
    cn: '朝圣交错路 (全朝圣路)',
    ko: '노르브란트 순례길 (전 구간)',
    tc: '朝聖交錯路 (全朝聖路)',
  },

  triggers: [
    // ---------------- Mimics ----------------
    {
      id: 'PT General Mimic Spawn',
      // 14264 = Mimic (floor 1-30 bronze chests, can stun or interrupt)
      // 14265 = Mimic (floor 31-60 silver chests, can stun or interrupt)
      // 14266 = Mimic (floor 61+ gold chests, can interrupt, immune to stun)
      // TODO: some Mimics may spawn after transference between floors and get called early before being found
      type: 'AddedCombatant',
      netRegex: { npcNameId: ['14264', '14265', '14266'], capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mimic spawned!',
          ja: 'ミミック！',
          ko: '미믹이 나왔어요!',
        },
      },
    },
    {
      id: 'PT General Mimic Malice',
      // inflicts Accursed Pox (43F) if not interrupted
      type: 'StartsUsing',
      netRegex: { id: 'AF34', source: 'Mimic' },
      response: Responses.interruptIfPossible(),
    },
    // ---------------- Pomanders and Juniper Incense ----------------
    {
      id: 'PT General Pomander Duplicate',
      // duplicate item message: https://v2.xivapi.com/api/sheet/LogMessage/7222
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
          case 14:
            return output.duplicate!({ pomander: output.intuition!() });
          case 15:
            return output.duplicate!({ pomander: output.raising!() });
          case 36:
            return output.duplicate!({ pomander: output.haste!() });
          case 37:
            return output.duplicate!({ pomander: output.purification!() });
          case 38:
            return output.duplicate!({ pomander: output.devotion!() });
          default:
            return output.duplicate!({ pomander: output.unknown!() });
        }
      },
      outputStrings: {
        duplicate: {
          en: '${pomander} duplicate',
          ja: '${pomander} 被り',
          ko: '${pomander} 또 나옴',
        },
        // pomanders: https://v2.xivapi.com/api/sheet/DeepDungeonItem
        safety: {
          en: 'Safety',
          ja: '呪印解除',
          ko: '함정 해제(Safety)',
        },
        sight: {
          en: 'Sight',
          ja: 'サイトロ',
          ko: '사이트로(Sight)',
        },
        strength: {
          en: 'Strength',
          ja: '自己強化',
          ko: '자기 강화(Strength)',
        },
        steel: {
          en: 'Steel',
          ja: '防御強化',
          ko: '방어 강화(Steel)',
        },
        affluence: {
          en: 'Affluence',
          ja: '宝箱増加',
          ko: '보물상자 증가(Affluence)',
        },
        flight: {
          en: 'Flight',
          ja: '敵排除',
          ko: '적 감소(Flight)',
        },
        alteration: {
          en: 'Alteration',
          ja: '敵変化',
          ko: '적 변화(Alteration)',
        },
        purity: {
          en: 'Purity',
          ja: '解呪',
          ko: '저주 해제(Purity)',
        },
        fortune: {
          en: 'Fortune',
          ja: '運気上昇',
          ko: '운 상승(Fortune)',
        },
        witching: {
          en: 'Witching',
          ja: '形態変化',
          ko: '적 변형(Witching)',
        },
        serenity: {
          en: 'Serenity',
          ja: '魔法効果解除',
          ko: '마법 효과 해제(Serenity)',
        },
        intuition: {
          en: 'Intuition',
          ja: '財宝感知',
          ko: '보물 탐지(Intuition)',
        },
        raising: {
          en: 'Raising',
          ja: 'リレイズ',
          ko: '리레이즈(Raising)',
        },
        haste: {
          en: 'Haste',
          ja: 'ヘイスト',
          ko: '헤이스트(Haste)',
        },
        purification: {
          en: 'Purification',
          ja: '浄化の守り',
          ko: '이상 현상 바리어(Purification)',
        },
        devotion: {
          en: 'Devotion',
          ja: '巡礼の導き',
          ko: '헌신(Devotion)',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'PT General Incense Duplicate',
      // two different SystemLogMessage depending on which incense
      // duplicate incense message 1: https://v2.xivapi.com/api/sheet/LogMessage/9208
      // duplicate incense message 2: https://v2.xivapi.com/api/sheet/LogMessage/10287
      // en: You return the piece of ${incense} incense to the coffer. You cannot carry any more of that item.
      type: 'SystemLogMessage',
      netRegex: { id: ['23F8', '282F'] },
      infoText: (_data, matches, output) => {
        const id = matches.id;
        const param1 = parseInt(matches.param1, 16);

        // incense items are in two different tables: DeepDungeonDemiclone and DeepDungeonMagicStone
        // https://v2.xivapi.com/api/sheet/DeepDungeonDemiclone
        // https://v2.xivapi.com/api/sheet/DeepDungeonMagicStone
        if (id === '23F8' && param1 === 5) {
          // incense is from DeepDungeonMagicStone
          return output.duplicate!({ incense: output.poisonfruit!() });
        }

        if (id === '282F') {
          // incense is from DeepDungeonDemiclone
          switch (param1) {
            case 4:
              return output.duplicate!({ incense: output.mazeroot!() });
            case 5:
              return output.duplicate!({ incense: output.barkbalm!() });
          }
        }

        return output.duplicate!({ incense: output.unknown!() });
      },
      outputStrings: {
        duplicate: {
          en: '${incense} duplicate',
          ja: '${incense} 被り',
          ko: '${incense} 또 나옴',
        },
        mazeroot: {
          en: 'Mazeroot',
          ja: '明敏',
          ko: '미로뿌리(Mazeroot)',
        },
        barkbalm: {
          en: 'Barkbalm',
          ja: '安寧',
          ko: '나무껍질연고(Barkbalm)',
        },
        poisonfruit: {
          en: 'Poisonfruit',
          ja: '宿命',
          ko: '독과일(Poisonfruit)',
        },
        unknown: Outputs.unknown,
      },
    },
    // ---------------- Floor Notifications ----------------
    {
      id: 'PT General Pylon of Passage',
      // portal to transfer between floors
      // Pylon of Passage activation message: https://v2.xivapi.com/api/sheet/LogMessage/7245
      // en: The Pylon of Passage is activated!
      type: 'SystemLogMessage',
      netRegex: { id: '1C4D', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Pylon of Passage activated',
          ja: '転移が出来ます',
          ko: '다음 층으로 갈 수 있어요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Mimic': 'Mimik',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Mimic': 'Mimic',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Mimic': 'ミミック',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Mimic': '拟态怪',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Mimic': '擬態怪',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Mimic': '미믹',
      },
    },
  ],
};

export default triggerSet;
