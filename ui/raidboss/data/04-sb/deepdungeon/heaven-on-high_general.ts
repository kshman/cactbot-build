import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Triggers applicable to all Heaven-on-High floors.

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'HeavenOnHighGeneral',
  zoneId: [
    ZoneId.HeavenOnHighFloors1_10,
    ZoneId.HeavenOnHighFloors11_20,
    ZoneId.HeavenOnHighFloors21_30,
    ZoneId.HeavenOnHighFloors31_40,
    ZoneId.HeavenOnHighFloors41_50,
    ZoneId.HeavenOnHighFloors51_60,
    ZoneId.HeavenOnHighFloors61_70,
    ZoneId.HeavenOnHighFloors71_80,
    ZoneId.HeavenOnHighFloors81_90,
    ZoneId.HeavenOnHighFloors91_100,
  ],
  zoneLabel: {
    en: 'Heaven-on-High (All Floors)',
    de: 'Himmelssäule (Alle Ebenen)',
    fr: 'Pilier des cieux (Tous niveaux)',
    ja: 'アメノミハシラ (全階層)',
    cn: '天之御柱 (全楼层)',
    ko: '천궁탑 (전체 층)',
    tc: '天之御柱 (全樓層)',
  },

  triggers: [
    // ---------------- Quivering Coffers ----------------
    {
      id: 'HoH General Quivering Coffer Spawn',
      // 7392 = Quivering Coffer (floor 1-30 bronze chests, can stun or interrupt)
      // 7393 = Quivering Coffer (floor 31-60 silver chests, can stun or interrupt)
      // 7394 = Quivering Coffer (floor 61+ gold chests, can interrupt, immune to stun)
      // TODO: some Quivering Coffers may spawn after transference between floors and get called early before being found
      type: 'AddedCombatant',
      netRegex: { npcNameId: '739[2-4]', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Quivering Coffer spawned!',
          ja: 'ミミック！',
          ko: '꿈틀거리는 보물상자 등장!',
        },
      },
    },
    {
      id: 'HoH General Quivering Coffer Malice',
      // same id regardless of which "type" of Quivering Coffer
      // inflicts Accursed Pox (43F) if not interrupted
      type: 'StartsUsing',
      netRegex: { id: '3019', source: 'Quivering Coffer' },
      response: Responses.interruptIfPossible(),
    },
    // ---------------- Pomanders and Magicite ----------------
    {
      id: 'HoH General Pomander Duplicate',
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
          case 14:
            return output.duplicate!({ pomander: output.intuition!() });
          case 15:
            return output.duplicate!({ pomander: output.raising!() });
          case 17:
            return output.duplicate!({ pomander: output.frailty!() });
          case 18:
            return output.duplicate!({ pomander: output.concealment!() });
          case 19:
            return output.duplicate!({ pomander: output.petrification!() });
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
        frailty: {
          en: 'Frailty',
          ja: '敵弱体',
          ko: '적 약화',
        },
        concealment: {
          en: 'Concealment',
          ja: 'バニシュ',
          ko: '배니시',
        },
        petrification: {
          en: 'Petrification',
          ja: '敵石化',
          ko: '적 석화',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'HoH General Magicite Duplicate',
      // duplicate magicite message: https://v2.xivapi.com/api/sheet/LogMessage/9208
      // en: You return the splinter of ${magicite} magicite to the coffer. You cannot carry any more of that item.
      type: 'SystemLogMessage',
      netRegex: { id: '23F8' },
      infoText: (_data, matches, output) => {
        switch (parseInt(matches.param1, 16)) {
          case 1:
            return output.duplicate!({ magicite: output.inferno!() });
          case 2:
            return output.duplicate!({ magicite: output.crag!() });
          case 3:
            return output.duplicate!({ magicite: output.vortex!() });
          case 4:
            return output.duplicate!({ magicite: output.elder!() });
          default:
            return output.duplicate!({ magicite: output.unknown!() });
        }
      },
      outputStrings: {
        duplicate: {
          en: '${magicite} duplicate',
          ja: '${magicite} 被り',
          ko: '${magicite} 중복',
        },
        // magicite: https://v2.xivapi.com/api/sheet/DeepDungeonMagicStone
        inferno: {
          en: 'Inferno',
          ja: 'イフリート',
          ko: '이프리트',
        },
        crag: {
          en: 'Crag',
          ja: 'タイタン',
          ko: '타이탄',
        },
        vortex: {
          en: 'Vortex',
          ja: 'ガルーダ',
          ko: '가루다',
        },
        elder: {
          en: 'Elder',
          ja: 'オーディン',
          ko: '오딘',
        },
        unknown: Outputs.unknown,
      },
    },
    // ---------------- Floor Notifications ----------------
    {
      id: 'HoH General Beacon of Passage',
      // portal to transfer between floors
      // Beacon of Passage activation message: https://v2.xivapi.com/api/sheet/LogMessage/7245
      // en: The Beacon of Passage is activated!
      type: 'SystemLogMessage',
      netRegex: { id: '1C4D', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Beacon of Passage activated',
          ja: '転移が出来ます',
          ko: '전송 등불 활성화',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Quivering Coffer': 'zuckend(?:e|er|es|en) Schnapptruhe',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Quivering Coffer': 'Coffre gigotant',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Quivering Coffer': 'うごめく宝箱',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Quivering Coffer': '抖动的宝箱',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Quivering Coffer': '抖動的寶箱',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Quivering Coffer': '꿈틀거리는 보물상자',
      },
    },
  ],
};

export default triggerSet;
