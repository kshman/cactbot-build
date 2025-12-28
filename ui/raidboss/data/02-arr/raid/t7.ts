import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import Util from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  hpThresholds: number[];
  monitoringHP: boolean;
  currentPhase: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheSecondCoilOfBahamutTurn2',
  zoneId: ZoneId.TheSecondCoilOfBahamutTurn2,
  timelineFile: 't7.txt',
  initData: () => {
    return {
      monitoringHP: false,
      hpThresholds: [0.79, 0.59, 0.34],
      currentPhase: 0,
    };
  },
  triggers: [
    {
      id: 'T7 Meluseine Phase Change Watcher',
      type: 'Ability',
      // On Tail Slap.
      netRegex: { id: '7A8', source: 'Melusine' },
      condition: (data) => !data.monitoringHP && data.hpThresholds[data.currentPhase] !== undefined,
      preRun: (data) => data.monitoringHP = true,
      promise: (data, matches) =>
        Util.watchCombatant({
          ids: [parseInt(matches.sourceId, 16)],
        }, (ret) => {
          return ret.combatants.some((c) => {
            const currentHPCheck = data.hpThresholds[data.currentPhase] ?? -1;
            return c.CurrentHP / c.MaxHP <= currentHPCheck;
          });
        }),
      sound: 'Long',
      run: (data) => {
        data.currentPhase++;
        data.monitoringHP = false;
      },
    },
    {
      id: 'T7 Ram',
      type: 'StartsUsing',
      netRegex: { id: '860', source: 'Proto-Chimera', capture: false },
      // TODO: is this silenceable in 5.0?
      condition: (data) => data.CanStun() || data.CanSilence(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Silence Ram\'s Voice',
          ja: '沈黙: 氷結の咆哮',
          ko: '빙결의 포효 침묵시키기',
        },
      },
    },
    {
      id: 'T7 Dragon',
      type: 'StartsUsing',
      netRegex: { id: '861', source: 'Proto-Chimera', capture: false },
      // TODO: is this silenceable in 5.0?
      condition: (data) => data.CanStun() || data.CanSilence(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Silence Dragon\'s Voice',
          ja: '沈黙: 雷電の咆哮',
          ko: '뇌전의 포효 침묵시키기',
        },
      },
    },
    {
      id: 'T7 Tail Slap',
      type: 'Ability',
      netRegex: { id: '7A8', source: 'Melusine' },
      condition: (data, matches) => data.me === matches.target && data.job === 'BLU',
      delaySeconds: 6,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tail Slap in 10',
          ja: 'まもなくテールスラップ',
          ko: '10초 안에 꼬리치기',
        },
      },
    },
    {
      id: 'T7 Renaud',
      type: 'AddedCombatant',
      netRegex: { name: 'Renaud', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Renaud Add',
          ja: '雑魚：ルノー',
          ko: '르노 쫄',
        },
      },
    },
    {
      id: 'T7 Cursed Voice',
      type: 'GainsEffect',
      netRegex: { effectId: '1C3' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Voice Soon',
          ja: 'まもなく呪詛の声',
          ko: '곧 저주의 목소리',
        },
      },
    },
    {
      id: 'T7 Cursed Shriek',
      type: 'GainsEffect',
      netRegex: { effectId: '1C4' },
      durationSeconds: 3,
      alarmText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.shriekOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me !== matches.target)
          return output.shriekOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        shriekOn: {
          en: 'Shriek on ${player}',
          ja: '${player}に呪詛の叫声',
          ko: '"${player}" 저주의 외침 대상',
        },
        shriekOnYou: {
          en: 'Shriek on YOU',
          ja: '自分に呪詛の叫声',
          ko: '저주의 외침 대상자',
        },
      },
    },
    {
      id: 'T7 Cursed Shriek Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: '1C4' },
      delaySeconds: 7,
      durationSeconds: 3,
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.shriekSoon!();

        return output.dodgeShriek!();
      },
      outputStrings: {
        shriekSoon: {
          en: 'Shriek Soon',
          ja: 'まもなく呪詛の叫声',
          ko: '곧 저주의 외침 발동',
        },
        dodgeShriek: {
          en: 'Dodge Shriek',
          ja: '呪詛の叫声を避ける',
          ko: '저주의 외침 피해요',
        },
      },
    },
    {
      id: 'T7 Petrifaction 1',
      type: 'StartsUsing',
      netRegex: { id: '7BB', source: 'Lamia Prosector', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'T7 Petrifaction 2',
      type: 'StartsUsing',
      netRegex: { id: '7B1', source: 'Melusine', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'T7 Tail',
      type: 'StartsUsing',
      netRegex: { id: '7B2', source: 'Melusine', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Venomous Tail',
          ja: 'ベノモステール',
          ko: '맹독 꼬리',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Bioweapon Storage': 'Biowaffen-Magazin',
        'Lamia Prosector': 'Lamia-Prosektorin',
        'Melusine': 'Melusine',
        'Proto-Chimera': 'Proto-Chimära',
        'Renaud': 'Renaud',
      },
      'replaceText': {
        'Circle Blade': 'Kreisklinge',
        'Circle Of Flames': 'Feuerkreis',
        'Cursed Shriek': 'Schrei der Verwünschung',
        'Cursed Voice': 'Stimme der Verwünschung',
        'Deathdancer': 'Todestänzerin',
        'Frenzy': 'Verve',
        'Petrifaction': 'Versteinerung',
        'Red Lotus Blade': 'Rote Lotosklinge',
        'Sacrifice': 'Aufopferung',
        'Tail Slap': 'Schweifklapser',
        'Venomous Tail': 'Venomschweif',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Bioweapon Storage': 'l\'entrepôt d\'armes biologiques',
        'Lamia Prosector': 'Lamia Dissectrice',
        'Melusine': 'Mélusine',
        'Proto-Chimera': 'Protochimère',
        'Renaud': 'Renaud',
      },
      'replaceText': {
        'Circle Blade': 'Lame circulaire',
        'Circle Of Flames': 'Cercle de flammes',
        'Cursed Shriek': 'Cri maudit',
        'Cursed Voice': 'Voix maudite',
        'Deathdancer Add': 'Add Danseuse de mort',
        'Frenzy': 'Frénésie',
        'Petrifaction': 'Pétrification',
        'Red Lotus Blade': 'Lame lotus rouge',
        'Sacrifice': 'Sacrifice',
        'Tail Slap': 'Gifle caudale',
        'Venomous Tail': 'Queue venimeuse',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Bioweapon Storage': '生体管理区',
        'Lamia Prosector': 'ラミア・プロセクター',
        'Melusine': 'メリュジーヌ',
        'Proto-Chimera': 'プロトキマイラ',
        'Renaud': 'ルノー',
      },
      'replaceText': {
        '(.*) Adds?': '雑魚: $1',
        'Circle Blade': 'サークルブレード',
        'Circle Of Flames': 'サークル・オブ・フレイム',
        'Cursed Shriek': '呪詛の叫声',
        'Cursed Voice': '呪詛の声',
        'Deathdancer': 'デスダンサー',
        'Frenzy': '熱狂',
        'Petrifaction': 'ペトリファクション',
        'Red Lotus Blade': 'レッドロータス',
        'Sacrifice': 'サクリファイス',
        'Tail Slap': 'テールスラップ',
        'Venomous Tail': 'ベノモステール',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Bioweapon Storage': '生体管理区',
        'Lamia Prosector': '拉米亚解剖女王',
        'Melusine': '美瑠姬奴',
        'Proto-Chimera': '原型奇美拉',
        'Renaud': '雷诺',
      },
      'replaceText': {
        'Circle Blade': '回旋斩',
        'Circle Of Flames': '地层断裂',
        'Cursed Shriek': '诅咒之嚎',
        'Cursed Voice': '诅咒之声',
        'Deathdancer': '死亡舞师',
        'Frenzy': '狂热',
        'Petrifaction': '石化',
        'Red Lotus Blade': '红莲',
        'Sacrifice': '献祭',
        'Tail Slap': '尾部猛击',
        'Venomous Tail': '猛毒之尾',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Bioweapon Storage': '生體管理區',
        'Lamia Prosector': '拉米亞解剖女王',
        'Melusine': '美瑠姬奴',
        'Proto-Chimera': '原型奇美拉',
        'Renaud': '雷諾',
      },
      'replaceText': {
        'Circle Blade': '迴旋斬',
        // 'Circle Of Flames': '', // FIXME '地层断裂'
        'Cursed Shriek': '詛咒之嚎',
        'Cursed Voice': '詛咒之聲',
        // 'Deathdancer': '', // FIXME '死亡舞师'
        'Frenzy': '狂熱',
        'Petrifaction': '石化',
        'Red Lotus Blade': '紅蓮',
        'Sacrifice': '獻祭',
        'Tail Slap': '尾部猛擊',
        'Venomous Tail': '猛毒之尾',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Bioweapon Storage': '생체 관리 구역',
        'Lamia Prosector': '라미아 시체해부자',
        'Melusine': '멜뤼진',
        'Proto-Chimera': '프로토 키마이라',
        'Renaud': '르노',
      },
      'replaceText': {
        'Circle Blade': '회전 베기',
        'Circle Of Flames': '화염의 원',
        'Cursed Shriek': '저주의 외침',
        'Cursed Voice': '저주의 목소리',
        'Deathdancer': '죽음무용수',
        'Frenzy': '열광',
        'Petrifaction': '석화',
        'Red Lotus Blade': '홍련의 칼날',
        'Sacrifice': '희생',
        'Tail Slap': '꼬리치기',
        'Venomous Tail': '맹독 꼬리',
      },
    },
  ],
};

export default triggerSet;
