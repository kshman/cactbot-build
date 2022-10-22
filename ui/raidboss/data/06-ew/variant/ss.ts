import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// 검색: StartsCasting 14:([^:]*):Geryon the Steer:([^:]*)
// 검색: StartsCasting 14:([^:]*):Silkie:([^:]*)
// 검색: StartsCasting 14:([^:]*):Gladiator of Sil'dih:([^:]*)
// 검색: StartsCasting 14:([^:]*):Shadowcaster Zeless Gah:([^:]*)
// 검색: StartsCasting 14:([^:]*):Thorne Knight:([^:]*)

export interface Data extends RaidbossData {
  geryonBarrel: 'red' | 'blue' | 'unknown';
}

export const vaStrings = {
  unknown: Outputs.unknown,
  num1: '❶',
  num2: '❷',
  num3: '❸',
} as const;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheSildihnSubterrane,
  initData: () => {
    return {
      geryonBarrel: 'unknown',
    };
  },
  triggers: [
    // 게룡: Colossal Strike
    {
      id: 'SS+ 게룡 Colossal Strike',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74CF', source: 'Geryon the Steer', capture: false }),
      response: Responses.tankBuster(),
    },
    // 게룡: Colossal Slam
    {
      id: 'SS+ 게룡 Colossal Slam',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74D0', source: 'Geryon the Steer', capture: false }),
      infoText: '누군가에게 부채꼴 공격',
    },
    // 게룡: Colossal Launch
    {
      id: 'SS+ 게룡 Colossal Launch',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74C8', source: 'Geryon the Steer', capture: false }),
      infoText: '빨간 통으로: 전체 공격 + 뒤집기',
    },
    // 게룡: Colossal Charge
    {
      id: 'SS+ 게룡 Colossal Charge',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74CC', source: 'Geryon the Steer', capture: false }),
      infoText: '파란 통으로: 좌우 살피면서',
    },
    // 게룡: Colossal Swing
    {
      id: 'SS+ 게룡 Colossal Swing',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74D1', source: 'Geryon the Steer', capture: false }),
      infoText: '안전지대로 가세요',
    },
    // 게룡: Gigantomill
    {
      id: 'SS+ 게룡 Gigantomill',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['74C9', '74CA'], source: 'Geryon the Steer', capture: false }),
      infoText: '장판(➕) 피해요',
    },
    // 게룡: Exploding Catapult
    {
      id: 'SS+ 게룡 Exploding Catapult',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74C7', source: 'Geryon the Steer', capture: false }),
      infoText: '전체 폭죽',
    },
    // 게룡: Subterranean Shudder
    {
      id: 'SS+ 게룡 Subterranean Shudder',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74D2', source: 'Geryon the Steer', capture: false }),
      infoText: '맵 기믹 나와요~',
    },

    // ////
    // 실키: Squeaky Right
    {
      id: 'SS+ 실키 Squeaky Right',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '772F', source: 'Silkie', capture: false }),
      response: Responses.goLeft(),
    },
    // 실키: Squeaky Left
    {
      id: 'SS+ 실키 Squeaky Left',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7732', source: 'Silkie', capture: false }),
      response: Responses.goRight(),
    },
    // 실키: Carpet Beater
    {
      id: 'SS+ 실키 Carpet Beater',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '772B', source: 'Silkie', capture: false }),
      response: Responses.tankBuster(),
    },
    // 실키: Chilling Suds
    {
      id: 'SS+ 실키 Chilling Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7736', source: 'Silkie', capture: false }),
      infoText: '파랑🔵 꼬리',
    },
    // 실키: Chilling Duster (773B은 Soap's Up, 773F는 Soaping Spree)
    {
      id: 'SS+ 실키 Chilling Duster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '773[BF]', source: 'Silkie', capture: false }),
      infoText: '십자➕ 장판',
    },
    // 실키: Bracing Suds
    {
      id: 'SS+ 실키 Bracing Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7735', source: 'Silkie', capture: false }),
      infoText: '초록🟢 꼬리',
    },
    // 실키: Bracing Duster
    {
      id: 'SS+ 실키 Bracing Duster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7739', source: 'Silkie', capture: false }),
      response: Responses.getUnder(),
    },
    // 실키: Dust Bluster
    {
      id: 'SS+ 실키 Dust Bluster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7744', source: 'Silkie', capture: false }),
      response: Responses.knockback(),
    },
    // 실키: Total Wash
    {
      id: 'SS+ 실키 Total Wash',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '772C', source: 'Silkie', capture: false }),
      response: Responses.aoe(),
    },

    // ////
    // 글라디에이터: Flash of Steel
    {
      id: 'SS+ 그라디아토르 Flash of Steel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7656', '764C'], source: 'Gladiator of Sil\'dih', capture: false }),
      response: Responses.aoe(),
    },
    // 글라디에이터: Sculptor's Passion
    {
      id: 'SS+ 그라디아토르 Sculptor\'s Passion',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '764A', source: 'Gladiator of Sil\'dih', capture: false }),
      response: Responses.getBehind(),
    },
    // 글라디에이터: Mighty Smite
    {
      id: 'SS+ 그라디아토르 Mighty Smite',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7657', source: 'Gladiator of Sil\'dih', capture: false }),
      response: Responses.tankBuster(),
    },
    // 글라디에이터: Ring of Might 1
    {
      id: 'SS+ 그라디아토르 Ring of Might 1',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7642', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '링 차지 ❶',
    },
    // 글라디에이터: Ring of Might 2
    {
      id: 'SS+ 그라디아토르 Ring of Might 2',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7643', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '링 차지 ❷',
    },
    // 글라디에이터: Ring of Might 3
    {
      id: 'SS+ 그라디아토르 Ring of Might 3',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7644', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '링 차지 ❸',
    },
    // 글라디에이터: Rush of Might 1
    {
      id: 'SS+ 그라디아토르 Rush of Might 1',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '763A', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '러시 차지 ❶',
    },
    // 글라디에이터: Rush of Might 2
    {
      id: 'SS+ 그라디아토르 Rush of Might 2',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '763B', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '러시 차지 ❷',
    },
    // 글라디에이터: Rush of Might 3
    {
      id: 'SS+ 그라디아토르 Rush of Might 3',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '763C', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '러시 차지 ❸',
    },
    // 글라디에이터: Shattering Steel
    //   Biting Wind(764D-뜨는 기둥, 79F6x3-그냥 기둥): 바닥에 바람장판 깔음 -> 전체 공격 하므로 떠야함
    {
      id: 'SS+ 그라디아토르 Shattering Steel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '764B', source: 'Gladiator of Sil\'dih', capture: false }),
      // delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      alertText: '올라가는 기둥 타세요',
    },
    // 글라디에이터: Wrath of Ruin
    {
      id: 'SS+ 그라디아토르 Wrath of Ruin',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7645', source: 'Gladiator of Sil\'dih', capture: false }),
      infoText: '바깥에 구슬 나와요',
    },
    // 글라디에이터: Sundered Remains
    //   7648이 첨, 7649가 이어서 여러개
    {
      id: 'SS+ 그라디아토르 Sundered Remains',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7648', source: 'Gladiator of Sil\'dih', capture: false }),
      infoText: '바닥에 연속 장판이 깔려요~',
    },

    // ////
    // 젤레스 가:Show of Strength
    {
      id: 'SS+ 젤레스 가 Show of Strength',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74AE', source: 'Shadowcaster Zeless Gah', capture: false }),
      response: Responses.aoe(),
    },
    // 젤레스 가:Firesteel Fracture
    {
      id: 'SS+ 젤레스 가 Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74AC', source: 'Shadowcaster Zeless Gah', capture: false }),
      response: Responses.tankBuster(),
    },
    // 젤레스 가:Infern Brand
    {
      id: 'SS+ 젤레스 가 Infern Brand',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7491', source: 'Shadowcaster Zeless Gah', capture: false }),
      infoText: '맵에 뭐가 나와요~',
    },
    // 젤레스 가:Cryptic Portal
    {
      id: 'SS+ 젤레스 가 Cryptic Portal',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7492', source: 'Shadowcaster Zeless Gah', capture: false }),
      infoText: '크립틱 포탈',
    },

    // ////
    // 쏜: Cogwheel
    {
      id: 'SS+ 쏜나이트 Cogwheel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70EB', source: 'Thorne Knight', capture: false }),
      response: Responses.aoe(),
    },
    // 쏜: Blistering Blow
    {
      id: 'SS+ 쏜나이트 Blistering Blow',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70EA', source: 'Thorne Knight', capture: false }),
      response: Responses.tankBuster(),
    },
    // 쏜: Fore Honor
    {
      id: 'SS+ 쏜나이트 Fore Honor',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70EC', source: 'Thorne Knight', capture: false }),
      response: Responses.getBehind(),
    },
    // 쏜: Spring to Life
    {
      id: 'SS+ 쏜나이트 Spring to Life',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70ED', source: 'Thorne Knight', capture: false }),
      durationSeconds: 7,
      infoText: '그리드▦ 나와요',
    },
    // 쏜: Spring to Life + Blaze of Glory
    {
      id: 'SS+ 쏜나이트 Spring to Life:Glory',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70EE', source: 'Thorne Knight', capture: false }),
      durationSeconds: 7,
      infoText: '구슬 십자 + 그리드▦ 나와요',
    },
    // 쏜: Slashburn
    {
      id: 'SS+ 쏜나이트 Slashburn',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70EF', source: 'Thorne Knight', capture: false }),
      infoText: '🔵🔴🔵: 파랑 사이',
    },
    // 쏜: 리버스 Slashburn
    {
      id: 'SS+ 쏜나이트 Reverse Slashburn',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['70F0', '70F1'], source: 'Thorne Knight', capture: false }),
      infoText: '🔵🔵🔴: [반대쪽]으로',
    },
    // 쏜: Slashburn + Glory
    {
      id: 'SS+ 쏜나이트 Slashburn:Glory',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7102', source: 'Thorne Knight', capture: false }),
      infoText: '구슬 십자 + 🔵🔴🔵: 파랑 사이',
    },
    // 쏜: Signal Flare
    {
      id: 'SS+ 쏜나이트 Signal Flare',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70F5', source: 'Thorne Knight', capture: false }),
      durationSeconds: 7,
      infoText: '세번째 있다가 → 첫번째 사라지면 들어가요',
    },
    // 쏜: Blaze of Glory
    {
      id: 'SS+ 쏜나이트 Blaze of Glory',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '70F4', source: 'Thorne Knight', capture: false }),
      durationSeconds: 3,
      infoText: '구슬 두개 나와요',
    },
  ],
};

export default triggerSet;
