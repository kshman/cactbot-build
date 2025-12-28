import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// Triggers applicable to all Eureka Orthos floors.

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'EurekaOrthosGeneral',
  zoneId: [
    ZoneId.EurekaOrthosFloors1_10,
    ZoneId.EurekaOrthosFloors11_20,
    ZoneId.EurekaOrthosFloors21_30,
    ZoneId.EurekaOrthosFloors31_40,
    ZoneId.EurekaOrthosFloors41_50,
    ZoneId.EurekaOrthosFloors51_60,
    ZoneId.EurekaOrthosFloors61_70,
    ZoneId.EurekaOrthosFloors71_80,
    ZoneId.EurekaOrthosFloors81_90,
    ZoneId.EurekaOrthosFloors91_100,
  ],
  zoneLabel: {
    en: 'Eureka Orthos (All Floors)',
    de: 'Eureka Orthos (Alle Ebenen)',
    fr: 'Eureka Orthos (Tout les étages)',
    ja: 'オルト・エウレカ (全層)',
    cn: '正统优雷卡 (全楼层)',
    ko: '에우레카 오르토스 (전체 층)',
  },

  triggers: [
    // ---------------- Mimics ----------------
    {
      id: 'EO General Mimic Spawn',
      // 2566 = Mimic (appears to be same npcNameId all floors)
      // floor 1-30 bronze chests, can stun or interrupt
      // floor 31-60 silver chests, can stun or interrupt
      // floor 61+ gold chests, can interrupt, immune to stun
      // TODO: some Mimics may spawn after transference between floors and get called early before being found
      type: 'AddedCombatant',
      netRegex: { npcNameId: '2566', capture: false },
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
      id: 'EO General Mimic Infatuation',
      // inflicts Accursed Pox (43F) if not interrupted
      type: 'StartsUsing',
      netRegex: { id: '801E', source: 'Mimic' },
      response: Responses.interruptIfPossible(),
    },
    // ---------------- Protomanders and Demiclones ----------------
    {
      id: 'EO General Protomander Duplicate',
      // duplicate protomander message: https://v2.xivapi.com/api/sheet/LogMessage/7222
      // en: You return the protomander of ${protomander} to the coffer. You cannot carry any more of that item.
      type: 'SystemLogMessage',
      netRegex: { id: '1C36' },
      infoText: (_data, matches, output) => {
        switch (parseInt(matches.param1, 16)) {
          case 20:
            return output.duplicate!({ protomander: output.lethargy!() });
          case 21:
            return output.duplicate!({ protomander: output.storms!() });
          case 22:
            return output.duplicate!({ protomander: output.dread!() });
          case 23:
            return output.duplicate!({ protomander: output.safety!() });
          case 24:
            return output.duplicate!({ protomander: output.sight!() });
          case 25:
            return output.duplicate!({ protomander: output.strength!() });
          case 26:
            return output.duplicate!({ protomander: output.steel!() });
          case 27:
            return output.duplicate!({ protomander: output.affluence!() });
          case 28:
            return output.duplicate!({ protomander: output.flight!() });
          case 29:
            return output.duplicate!({ protomander: output.alteration!() });
          case 30:
            return output.duplicate!({ protomander: output.purity!() });
          case 31:
            return output.duplicate!({ protomander: output.fortune!() });
          case 32:
            return output.duplicate!({ protomander: output.witching!() });
          case 33:
            return output.duplicate!({ protomander: output.serenity!() });
          case 34:
            return output.duplicate!({ protomander: output.intuition!() });
          case 35:
            return output.duplicate!({ protomander: output.raising!() });
          default:
            return output.duplicate!({ protomander: output.unknown!() });
        }
      },
      outputStrings: {
        duplicate: {
          en: '${protomander} duplicate',
          ja: '${protomander} 被り',
          ko: '${protomander} 또 나옴',
        },
        // protomanders: https://v2.xivapi.com/api/sheet/DeepDungeonItem
        lethargy: {
          en: 'Lethargy',
          ja: 'スロウガ',
          ko: '캐스팅 늦춤(슬로우가)',
        },
        storms: {
          en: 'Storms',
          ja: 'ミールストーム',
          ko: 'HP줄임(밀스톰)',
        },
        dread: {
          en: 'Dread',
          ja: 'ドレッドノート化',
          ko: '드레드노트 변신(Dread)',
        },
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
          ko: '적 대체(Alteration)',
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
          ko: '보물 탐(Intuition)지',
        },
        raising: {
          en: 'Raising',
          ja: 'リレイズ',
          ko: '리레이즈(Raising)',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'EO General Demiclone Duplicate',
      // duplicate demiclone message: https://v2.xivapi.com/api/sheet/LogMessage/10287
      // en: You return the ${demiclone} demiclone to the coffer. You cannot carry any more of that item.
      type: 'SystemLogMessage',
      netRegex: { id: '282F' },
      infoText: (_data, matches, output) => {
        switch (parseInt(matches.param1, 16)) {
          case 1:
            return output.duplicate!({ demiclone: output.unei!() });
          case 2:
            return output.duplicate!({ demiclone: output.doga!() });
          case 3:
            return output.duplicate!({ demiclone: output.onion!() });
          default:
            return output.duplicate!({ demiclone: output.unknown!() });
        }
      },
      outputStrings: {
        duplicate: {
          en: '${demiclone} duplicate',
          ja: '${demiclone} 被り',
          ko: '${demiclone} 또 나옴',
        },
        // demiclones: https://v2.xivapi.com/api/sheet/DeepDungeonDemiclone
        unei: {
          en: 'Unei',
          ja: 'ウネ',
          ko: '우네',
        },
        doga: {
          en: 'Doga',
          ja: 'ドーガ',
          ko: '도가',
        },
        onion: {
          en: 'Onion Knight',
          ja: 'オニオンナイト',
          ko: '양파 기사',
        },
        unknown: Outputs.unknown,
      },
    },
    // ---------------- Floor Notifications ----------------
    {
      id: 'EO General Pylon of Passage',
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
    // ---------------- Dread Beasts ----------------
    // 12322 = Lamia Queen
    // 12323 = Meracydian Clone
    // 12324 = Demi-Cochma
    {
      id: 'EO General Lamia Queen Petrifaction',
      // gaze, inflicts Stone Curse (1B5)
      type: 'StartsUsing',
      netRegex: { id: '7FD1', source: 'Lamia Queen', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'EO General Meracydian Clone Berserk',
      // gains Damage Up (1BB)
      type: 'StartsUsing',
      netRegex: { id: '7FCB', source: 'Meracydian Clone' },
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'EO General Meracydian Clone Allagan Meteor',
      // gaze, inflicts Stone Curse (1B5)
      type: 'StartsUsing',
      netRegex: { id: '7FCE', source: 'Meracydian Clone', capture: false },
      response: Responses.getOut(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Lamia Queen': 'Lamia-Königin',
        'Meracydian Clone': 'meracydisch(?:e|er|es|en) Klon',
        'Mimic': 'Mimik',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Lamia Queen': 'Reine lamia',
        'Meracydian Clone': 'Clone de Méracydien',
        'Mimic': 'Mimic',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Lamia Queen': 'ラミアクィーン',
        'Meracydian Clone': 'メラシディアン・クローン',
        'Mimic': 'ミミック',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Lamia Queen': '拉米亚女王',
        'Meracydian Clone': '美拉西迪亚复制体',
        'Mimic': '拟态怪',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Lamia Queen': '拉米亞女王',
        'Meracydian Clone': '美拉西迪亞複製體',
        'Mimic': '擬態怪',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Lamia Queen': '라미아 여왕',
        'Meracydian Clone': '메라시디안 클론',
        'Mimic': '미믹',
      },
    },
  ],
};

export default triggerSet;
