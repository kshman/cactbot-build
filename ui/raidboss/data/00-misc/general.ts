import { Responses } from '../../../../resources/responses';
import ZoneId from '../../../../resources/zone_id';
import { RaidbossData } from '../../../../types/data';
import { TriggerSet } from '../../../../types/trigger';

export type Data = RaidbossData;

const caresAboutTankStuff = (data: RaidbossData) => {
  return data.role === 'tank' || data.role === 'healer' || data.job === 'BLU';
};

// Triggers for all occasions and zones.
const triggerSet: TriggerSet<Data> = {
  id: 'CactbotGeneral',
  zoneId: ZoneId.MatchAll,
  comments: {
    en: 'General triggers for all occasions and zones',
    de: 'Allgemeine Trigger für alle Anlässe und Zonen',
    fr: 'Triggers généraux pour toutes les occasions et zones',
    ja: '全ての状況、全てのエリアに共通するトリガー',
    cn: '适用于所有场合和区域的通用触发器',
  },
  triggers: [
    {
      id: 'General Provoke',
      comment: {
        cn: '仅在自身或团队成员释放“挑衅”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: '1D6D' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) => {
        return output.text!({ player: data.party.member(matches.source) });
      },
      outputStrings: {
        text: {
          en: 'Provoke: ${player}',
          de: 'Herausforderung: ${player}',
          fr: 'Provocation : ${player}',
          ja: '挑発: ${player}',
          cn: '挑衅: ${player}',
          ko: '프로보크: ${player}',
        },
      },
    },
    {
      id: 'General Frog Legs',
      comment: {
        cn: '仅在自身或团队成员释放“蛙腿”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: '4783' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      suppressSeconds: 0.5,
      infoText: (data, matches, output) => {
        if (matches.targetId === 'E0000000')
          return output.noTarget!({ player: data.party.member(matches.source) });
        return output.text!({ player: data.party.member(matches.source) });
      },
      outputStrings: {
        text: {
          en: 'Provoke: ${player}',
          de: 'Herausforderung: ${player}',
          fr: 'Provocation : ${player}',
          ja: '挑発: ${player}',
          cn: '挑衅: ${player}',
          ko: '개구리: ${player}',
        },
        noTarget: {
          en: 'Provoke: ${player} (missed)',
          de: 'Herausforderung: ${player} (verfehlt)',
          fr: 'Provocation : ${player} (manquée)',
          ja: '挑発: ${player} (タゲなし)',
          cn: '挑衅: ${player} (无目标)',
          ko: '개구리: ${player} (빗나갔네!)',
        },
      },
    },
    {
      id: 'General Shirk',
      comment: {
        cn: '仅在自身或团队成员释放“退避”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: '1D71' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.source) }),
      outputStrings: {
        text: {
          en: 'Shirk: ${player}',
          de: 'Geteiltes Leid: ${player}',
          fr: 'Dérobade : ${player}',
          ja: 'シャーク: ${player}',
          cn: '退避: ${player}',
          ko: '셔크: ${player}',
        },
      },
    },
    {
      id: 'General Holmgang',
      comment: {
        cn: '仅在自身或团队成员释放“死斗”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: '2B' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.source) }),
      outputStrings: {
        text: {
          en: 'Holmgang: ${player}',
          de: 'Holmgang: ${player}',
          fr: 'Holmgang : ${player}',
          ja: 'ホルムギャング: ${player}',
          cn: '死斗: ${player}',
          ko: '홀름갱: ${player}',
        },
      },
    },
    {
      id: 'General Hallowed',
      comment: {
        cn: '仅在自身或团队成员释放“神圣领域”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: '1E' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.source) }),
      outputStrings: {
        text: {
          en: 'Hallowed: ${player}',
          de: 'Heiliger Boden: ${player}',
          fr: 'Invincible : ${player}',
          ja: 'インビンシブル: ${player}',
          cn: '神圣领域: ${player}',
          ko: '인빈시블 할로우드: ${player}',
        },
      },
    },
    {
      id: 'General Superbolide',
      comment: {
        cn: '仅在自身或团队成员释放“超火流星”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: '3F18' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.source) }),
      outputStrings: {
        text: {
          en: 'Bolide: ${player}',
          de: 'Meteoritenfall: ${player}',
          fr: 'Bolide : ${player}',
          ja: 'ボーライド: ${player}',
          cn: '超火流星: ${player}',
          ko: '슈퍼 볼라이드: ${player}',
        },
      },
    },
    {
      id: 'General Living',
      comment: {
        cn: '仅在自身或团队成员释放“行尸走肉”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'Ability',
      netRegex: { id: 'E36' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.source) }),
      outputStrings: {
        text: {
          en: 'Living: ${player}',
          de: 'Totenerweckung: ${player}',
          fr: 'Mort-vivant : ${player}',
          ja: 'リビングデッド: ${player}',
          cn: '行尸走肉: ${player}',
          ko: '리빙 데드: ${player}',
        },
      },
    },
    {
      id: 'General Walking',
      comment: {
        cn: '仅在自身或团队成员获得“死而不僵”且自身为坦克/治疗/青魔法师时触发。',
      },
      type: 'GainsEffect',
      netRegex: { effectId: '32B' },
      condition: (data, matches) => {
        if (matches.source !== data.me && !data.party.inAlliance(matches.source))
          return false;
        return caresAboutTankStuff(data);
      },
      infoText: (data, matches, output) =>
        output.text!({ player: data.party.member(matches.source) }),
      outputStrings: {
        text: {
          en: 'Walking: ${player}',
          de: 'Erweckter: ${player}',
          fr: 'Marcheur des limbes : ${player}',
          ja: 'ウォーキングデッド: ${player}',
          cn: '死而不僵: ${player}',
          ko: '워킹 데드: ${player}',
        },
      },
    },
    {
      // 0039 is the system message channel, when the current player commences a ready check,
      // the message is sent to this channel; when a ready check is invoked by others, then it
      // would be sent to the 0239 channel.  (Sometimes this is also sent to 0139, unknown why?)
      id: 'General Ready Check',
      comment: {
        cn: '在队友发起准备确认时，播放D.Va的“Game on”音效(^-^)V',
      },
      type: 'GameLog',
      netRegex: {
        line: '(?:You have commenced a ready check|\\y{Name} has initiated a ready check).*?',
        code: ['0039', '0139', '0239'],
        capture: false,
      },
      sound: '../../resources/sounds/Overwatch/D.Va_-_Game_on.webm',
      soundVolume: 0.6,
    },
    {
      // https://xivapi.com/LogMessage/916
      // en: 7 minutes have elapsed since your last activity. [...]
      // There is no network packet for these log lines; so have to use GameLog.
      id: 'General Falling Asleep',
      type: 'GameLog',
      netRegex: { line: '7 minutes have elapsed since your last activity..*?', capture: false },
      response: Responses.wakeUp(),
    },
  ],
  timelineReplace: [
    {
      locale: 'de',
      replaceSync: {
        'has initiated a ready check': 'eine Bereitschaftsanfrage gestellt',
        'You have commenced a ready check': 'Du hast eine Bereitschaftsanfrage gestellt',
        'You poke the striking dummy': 'Du stupst die Trainingspuppe an',
        'You psych yourself up alongside the striking dummy':
          'Du willst wahren Kampfgeist in der Trainingspuppe entfachen',
        'You burst out laughing at the striking dummy': 'Du lachst herzlich mit der Trainingspuppe',
        'You clap for the striking dummy': 'Du klatschst begeistert Beifall für die Trainingspuppe',
        '7 minutes have elapsed since your last activity..*?':
          'Seit deiner letzten Aktivität sind 7 Minuten vergangen.',
      },
    },
    {
      locale: 'fr',
      replaceSync: {
        ' has initiated a ready check': '',
        'You have commenced a ready check\\|': 'Un appel de préparation a été lancé par ',
        'You poke the striking dummy':
          'Vous touchez légèrement le mannequin d\'entraînement du doigt',
        'You psych yourself up alongside the striking dummy':
          'Vous vous motivez devant le mannequin d\'entraînement',
        'You burst out laughing at the striking dummy':
          'Vous vous esclaffez devant le mannequin d\'entraînement',
        'You clap for the striking dummy': 'Vous applaudissez le mannequin d\'entraînement',
        '7 minutes have elapsed since your last activity.':
          'Votre personnage est inactif depuis 7 minutes',
      },
    },
    {
      locale: 'ja',
      replaceSync: {
        ' has initiated a ready check': 'がレディチェックを開始しました',
        'You have commenced a ready check': 'レディチェックを開始しました',
        'You poke the striking dummy': '.*は木人をつついた',
        'You psych yourself up alongside the striking dummy': '.*は木人に活を入れた',
        'You burst out laughing at the striking dummy': '.*は木人のことを大笑いした',
        'You clap for the striking dummy': '.*は木人に拍手した',
        '7 minutes have elapsed since your last activity.': '操作がない状態になってから7分が経過しました。',
      },
    },
    {
      locale: 'cn',
      replaceSync: {
        ' has initiated a ready check': '发起了准备确认',
        'You have commenced a ready check': '发起了准备确认',
        'You poke the striking dummy': '.*用手指戳向木',
        'You psych yourself up alongside the striking dummy': '.*激励木人',
        'You burst out laughing at the striking dummy': '.*看着木人高声大笑',
        'You clap for the striking dummy': '.*向木人送上掌声',
        '7 minutes have elapsed since your last activity.': '已经7分钟没有进行任何操作',
      },
    },
    {
      locale: 'ko',
      replaceSync: {
        'has initiated a ready check': '님이 준비 확인을 시작했습니다',
        'You have commenced a ready check': '준비 확인을 시작합니다',
        'You poke the striking dummy': '.*나무인형을 쿡쿡 찌릅니다',
        'You psych yourself up alongside the striking dummy': '.*나무인형에게 힘을 불어넣습니다',
        'You burst out laughing at the striking dummy': '.*나무인형을 보고 폭소를 터뜨립니다',
        'You clap for the striking dummy': '.*나무인형에게 박수를 보냅니다',
        '7 minutes have elapsed since your last activity..*?': '7분 동안 아무 조작을 하지 않았습니다',
      },
    },
  ],
};

export default triggerSet;
