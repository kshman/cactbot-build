import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  wraithCount?: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheForbiddenLandEurekaAnemos',
  zoneId: ZoneId.TheForbiddenLandEurekaAnemos,
  resetWhenOutOfCombat: false,
  triggers: [
    {
      id: 'Eureka Garm Dragon Voice',
      type: 'StartsUsing',
      netRegex: { id: '2AD5', source: 'Void Garm', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dragon\'s Voice',
          ja: '雷電の咆哮',
          ko: '드래곤즈 보이스 (안으로)',
        },
      },
    },
    {
      id: 'Eureka Sabotender Stack Marker',
      type: 'StartsUsing',
      netRegex: { id: '29EB', source: 'Sabotender Corrido' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Eureka Poly Swipe',
      type: 'StartsUsing',
      netRegex: { id: '2A71', source: 'Polyphemus', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Swipe',
          ja: 'スワイプ',
          ko: '스와이프',
        },
      },
    },
    {
      id: 'Eureka Poly Swing',
      type: 'StartsUsing',
      netRegex: { id: '2A6E', source: 'Polyphemus', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Eureka Poly Eye',
      type: 'StartsUsing',
      netRegex: { id: '2A73', source: 'Polyphemus', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Eye Donut',
          ja: 'アイ・オブ・ビホルダー',
          ko: '아이 오브 비홀더 (도넛)',
        },
      },
    },
    {
      id: 'Eureka Poly Glower',
      type: 'StartsUsing',
      netRegex: { id: '2A72', source: 'Polyphemus', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Glower Laser',
          ja: 'グラワー',
          ko: '글로워 레이저',
        },
      },
    },
    {
      id: 'Eureka Caym Eye',
      type: 'StartsUsing',
      netRegex: { id: '2A64', source: 'Caym', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'Eureka Fafnir Terror',
      type: 'StartsUsing',
      netRegex: { id: '29B7', source: 'Fafnir', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'Eureka Voidscale Ice',
      type: 'StartsUsing',
      netRegex: { id: '29C3', source: 'Voidscale' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Ice ball on you!',
          ja: '自分に氷玉',
          ko: '내게 얼음 구슬!',
        },
      },
    },
    {
      id: 'Eureka Pazuzu Dread Wind',
      type: 'StartsUsing',
      netRegex: { id: '2899', source: 'Pazuzu', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Eureka Pazuzu Camisado',
      type: 'StartsUsing',
      netRegex: { id: '289F', source: 'Pazuzu' },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Eureka Pazuzu Cloud of Locust',
      type: 'StartsUsing',
      netRegex: { id: '2897', source: 'Pazuzu', capture: false },
      response: Responses.outOfMelee(),
    },
    {
      id: 'Eureka Pazuzu Plague of Locust',
      type: 'StartsUsing',
      netRegex: { id: '2896', source: 'Pazuzu', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Plague Donut',
          ja: 'ローカストプレイグ',
          ko: '로커스트 프레이그 (도넛)',
        },
      },
    },
    {
      id: 'Eureka Wraith Count',
      type: 'WasDefeated',
      netRegex: { target: 'Shadow Wraith', capture: false },
      soundVolume: 0,
      infoText: (data, _matches, output) => {
        data.wraithCount = (data.wraithCount ?? 0) + 1;
        return output.text!({ num: data.wraithCount });
      },
      outputStrings: {
        text: {
          en: 'wraiths: ${num}',
          ja: 'レイス: ${num}',
          ko: '레이스: ${num}',
        },
      },
    },
    {
      id: 'Eureka Pazuzu Pop',
      type: 'AddedCombatant',
      netRegex: { name: 'Pazuzu', capture: false },
      run: (data) => data.wraithCount = 0,
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Caym': 'Caym',
        'Fafnir': 'Fafnir',
        'Pazuzu': 'Pazuzu',
        'Polyphemus': 'Polyphemus',
        'Sabotender Corrido': 'Sabotender Corrido',
        'Shadow Wraith': 'Schatten-Geist',
        'Void Garm': 'Nichts-Garm',
        'Voidscale': 'Nichtsschuppe',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Caym': 'Caym',
        'Fafnir': 'Fafnir',
        'Pazuzu': 'Pazuzu',
        'Polyphemus': 'Polyphemus',
        'Sabotender Corrido': 'pampa corrido',
        'Shadow Wraith': 'spectre des ombres',
        'Void Garm': 'garm du néant',
        'Voidscale': 'vidécailles',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Caym': 'カイム',
        'Fafnir': 'ファヴニル',
        'Pazuzu': 'パズズ',
        'Polyphemus': 'ポリュペモス',
        'Sabotender Corrido': '賞金首：サボテンダー・コリード',
        'Shadow Wraith': 'シャドウ・レイス',
        'Void Garm': 'ヴォイドガルム',
        'Voidscale': 'ヴォイドスケイル',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Caym': '盖因',
        'Fafnir': '法夫纳',
        'Pazuzu': '帕祖祖',
        'Polyphemus': '波吕斐摩斯',
        'Sabotender Corrido': '悬赏魔物：科里多仙人刺',
        'Shadow Wraith': '暗影幽灵',
        'Void Garm': '虚无加姆',
        'Voidscale': '虚无鳞龙',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Caym': '蓋因',
        'Fafnir': '法夫納',
        'Pazuzu': '帕祖祖',
        'Polyphemus': '波呂斐摩斯',
        'Sabotender Corrido': '懸賞魔物：寇里多仙人掌',
        'Shadow Wraith': '暗影幽靈',
        'Void Garm': '虛無加姆',
        'Voidscale': '虛無鱗龍',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Caym': '카임',
        'Fafnir': '파프니르',
        'Pazuzu': '파주주',
        'Polyphemus': '폴리페모스',
        'Sabotender Corrido': '현상수배: 사보텐더 코리도',
        'Shadow Wraith': '그림자 망령',
        'Void Garm': '보이드 가름',
        'Voidscale': '보이드비늘',
      },
    },
  ],
};

export default triggerSet;
