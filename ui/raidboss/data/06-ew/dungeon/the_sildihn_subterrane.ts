import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';
// 🡸🡺🔵🔴🟢

export type CatapultMech =
  | 'standOnBlue'
  | 'knockback'
  | 'launch'
  | 'charge'
  | 'gigantomill'
  | 'launchOrSwing'
  | 'boulders'
  | 'loopStart';

export interface Data extends RaidbossData {
  catapultCount: number;
  catapultMechs: CatapultMech[];
  barrelActive: boolean;
}

// TODO: path 10 Gladiator static visage safe quadrant
// TODO: path 11 Gladiator rotating visage safe quadrant
// TODO: map effects for Geryon Intake / Boulder / Suddenly Sewage locations/directions
// TODO: lots of missing stuff for Shadowcaster and Thorne Knight

const leftDoorYesPump: CatapultMech[] = [
  'standOnBlue',
  'standOnBlue',
  'knockback',
  'launch',
  'loopStart',
  'charge',
  'gigantomill',
  'knockback',
  'launchOrSwing',
];

const leftDoorNoPump: CatapultMech[] = [
  'standOnBlue',
  'standOnBlue',
  'launch',
  'loopStart',
  'charge',
  'launchOrSwing',
];

const middleDoorLeftHandle: CatapultMech[] = [
  'standOnBlue',
  'standOnBlue',
  'knockback',
  'launch',
  'loopStart',
  'gigantomill',
  'charge',
  'knockback',
  'launchOrSwing',
];

const middleDoorRightHandle: CatapultMech[] = [
  'standOnBlue',
  'standOnBlue',
  'boulders',
  'launch',
  'loopStart',
  'charge',
  'gigantomill',
  'boulders',
  'launchOrSwing',
];

const rightDoorYesCeruleum: CatapultMech[] = [
  'standOnBlue',
  'standOnBlue',
  'launch',
  'loopStart',
  'gigantomill',
  'charge',
  'launchOrSwing',
];

const rightDoorNoCeruleum: CatapultMech[] = [
  'standOnBlue',
  'standOnBlue',
  'launch',
  'loopStart',
  'charge',
  'launchOrSwing',
];

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheSildihnSubterrane,
  timelineFile: 'the_sildihn_subterrane.txt',
  initData: () => {
    return {
      catapultCount: 0,
      catapultMechs: ['standOnBlue', 'standOnBlue'],
      barrelActive: false,
    };
  },
  timelineTriggers: [
    {
      id: 'Sildihn Geryon Intake',
      regex: /Intake/,
      beforeSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백: 파란통🔵으로',
          de: 'Rückstoß auf Blau',
          ja: '青🔵にノックバック',
          ko: '파란색쪽으로 넉백',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'Sildihn Geryon Seal Left Mechs',
      type: 'GameLog',
      netRegex: NetRegexes.message({ line: 'The Silt Pump will be sealed off.*?', capture: false }),
      // May be overwritten by Runaway Sludge below.
      run: (data) => data.catapultMechs = leftDoorYesPump,
    },
    {
      id: 'Sildihn Geryon Runaway Sludge Mechs',
      type: 'StartsUsing',
      netRegex: { id: '74D6', source: 'Geryon the Steer', capture: false },
      suppressSeconds: 9999,
      run: (data) => data.catapultMechs = leftDoorNoPump,
    },
    {
      id: 'Sildihn Geryon Intake Mechs',
      type: 'MapEffect',
      netRegex: { flags: '00020001', location: '09', capture: false },
      suppressSeconds: 9999,
      run: (data) => data.catapultMechs = middleDoorLeftHandle,
    },
    {
      id: 'Sildihn Geryon Boulder Mechs',
      type: 'MapEffect',
      netRegex: { flags: '20000004', location: '0A', capture: false },
      suppressSeconds: 9999,
      run: (data) => data.catapultMechs = middleDoorRightHandle,
    },
    {
      id: 'Sildihn Geryon Seal Right Mechs',
      type: 'GameLog',
      netRegex: NetRegexes.message({
        line: 'The Settling Basin will be sealed off.*?',
        capture: false,
      }),
      // May be overwritten by Suddenly Sewage below.
      run: (data) => data.catapultMechs = rightDoorNoCeruleum,
    },
    {
      id: 'Sildihn Geryon Suddenly Sewage Mechs',
      type: 'Ability',
      netRegex: { id: '74D8', source: 'Geryon the Steer', capture: false },
      suppressSeconds: 9999,
      run: (data) => data.catapultMechs = rightDoorYesCeruleum,
    },
    {
      id: 'Sildihn Geryon Colossal Strike',
      type: 'StartsUsing',
      netRegex: { id: '74CF', source: 'Geryon the Steer' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Sildihn Geryon Subterranean Shudder',
      type: 'StartsUsing',
      netRegex: { id: '74D2', source: 'Geryon the Steer', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Sildihn Geryon Exploding Catapult',
      type: 'StartsUsing',
      netRegex: { id: '74C7', source: 'Geryon the Steer', capture: false },
      response: Responses.aoe(),
      run: (data) => data.barrelActive = true,
    },
    {
      id: 'Sildihn Geryon Exploding Catapult Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '74C7', source: 'Geryon the Steer', capture: false },
      delaySeconds: 17,
      run: (data) => data.barrelActive = false,
    },
    {
      id: 'Sildihn Geryon Exploding Catapult Barrels',
      type: 'StartsUsing',
      netRegex: { id: '74C7', source: 'Geryon the Steer', capture: false },
      delaySeconds: 6.5,
      infoText: (data, _matches, output) => {
        let mech = data.catapultMechs[data.catapultCount];
        // loopStart is a fake entry to know where to loop back to
        if (mech === 'loopStart') {
          data.catapultCount++;
          mech = data.catapultMechs[data.catapultCount];
        }

        // Increment for next time, unless something has gone awry.
        if (data.catapultCount >= 0)
          data.catapultCount++;
        // If we run off the end of mechanics, loop back to the "loopStart" entry for next time.
        if (data.catapultCount >= data.catapultMechs.length)
          data.catapultCount = data.catapultMechs.indexOf('loopStart');

        if (mech === undefined)
          return;

        // These are all handled elsewhere in other triggers.
        if (
          mech === 'launch' || mech === 'charge' || mech === 'launchOrSwing' || mech === 'knockback'
        )
          return;

        if (mech === 'standOnBlue' || mech === 'gigantomill')
          return output.standOnBlue!();

        if (mech === 'boulders')
          return output.avoidBoulders!();
      },
      outputStrings: {
        standOnBlue: {
          en: '파란통🔵으로',
          de: 'Bei Blau stehen',
          ja: '青🔵へ',
          ko: '파란색쪽으로',
        },
        avoidBoulders: {
          en: '파란통🔵으로: (돌 피해요)',
          de: 'Bei Blau stehen (vermeide Steine)',
          ja: '青🔵へ (岩回避)',
          ko: '파란색쪽으로 (바위 피하기)',
        },
      },
    },
    {
      id: 'Sildihn Geryon Shockwave',
      type: 'StartsUsing',
      netRegex: { id: '74CE', source: 'Geryon the Steer', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Sildihn Geryon Runaway Runoff',
      type: 'StartsUsing',
      netRegex: { id: '74D7', source: 'Geryon the Steer', capture: false },
      delaySeconds: 3, // 8 second cast
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백: 파란통🔵으로',
          de: 'Rückstoß zu Blau',
          ja: '青🔵へノックバック',
          ko: '파란색쪽으로 넉백',
        },
      },
    },
    {
      id: 'Sildihn Geryon Colossal Swing',
      type: 'StartsUsing',
      netRegex: { id: '74D1', source: 'Geryon the Steer', capture: false },
      alertText: (data, _matches, output) => {
        return data.barrelActive ? output.getBehindOnBlue!() : output.getBehind!();
      },
      outputStrings: {
        getBehind: Outputs.getBehind,
        getBehindOnBlue: {
          en: '파란통🔵 뒤로',
          de: 'Geh hinter Blau',
          ja: 'ボスの後ろの青🔵へ',
          ko: '보스 뒤 파란색쪽으로',
        },
      },
    },
    {
      id: 'Sildihn Geryon Colossal Launch',
      type: 'StartsUsing',
      netRegex: { id: '74C8', source: 'Geryon the Steer', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '빨간통🔴으로: 전체 공격 + 뒤집기',
          de: 'Bei Rot stehen',
          ja: '赤🔴へ',
          ko: '빨간색쪽으로',
        },
      },
    },
    {
      id: 'Sildihn Geryon Colossal Charge Left',
      type: 'StartsUsing',
      netRegex: { id: '74CD', source: 'Geryon the Steer', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '오른쪽🡺 파란통🔵으로',
          de: 'Steh bei dem rechten Blau',
          ja: '右の青🔵へ',
          ko: '오른쪽 파란색쪽으로',
        },
      },
    },
    {
      id: 'Sildihn Geryon Colossal Charge Right',
      type: 'StartsUsing',
      netRegex: { id: '74CC', source: 'Geryon the Steer', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡸왼쪽 파란통🔵으로',
          de: 'Steh bei dem linken Blau',
          ja: '左の青🔵へ',
          ko: '왼쪽 파란색쪽으로',
        },
      },
    },
    {
      id: 'Sildihn Geryon Gigantomill Left',
      type: 'StartsUsing',
      netRegex: { id: '74CA', source: 'Geryon the Steer', capture: false },
      response: Responses.goLeft('info'),
    },
    {
      id: 'Sildihn Geryon Gigantomill Right',
      type: 'StartsUsing',
      netRegex: { id: '74C9', source: 'Geryon the Steer', capture: false },
      response: Responses.goRight('info'),
    },
    {
      id: 'Sildihn Silkie Total Wash',
      type: 'StartsUsing',
      netRegex: { id: '772C', source: 'Silkie', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Sildihn Silkie Squeaky Right',
      type: 'StartsUsing',
      netRegex: { id: '772D', source: 'Silkie', capture: false },
      // netRegex: { id: '772F', source: 'Silkie', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'Sildihn Silkie Squeaky Left',
      type: 'StartsUsing',
      netRegex: { id: '772E', source: 'Silkie', capture: false },
      // netRegex: { id: '7732', source: 'Silkie', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'Sildihn Silkie Carpet Buster',
      type: 'StartsUsing',
      netRegex: { id: '772B', source: 'Silkie' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Sildihn Silkie Dust Bluster',
      type: 'StartsUsing',
      netRegex: { id: '7744', source: 'Silkie', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Sildihn Silkie Wash Out',
      type: 'StartsUsing',
      netRegex: { id: '7745', source: 'Silkie', capture: false },
      delaySeconds: 3, // 8 second cast
      response: Responses.knockback(),
    },
    {
      id: 'Sildihn Silkie Chilling Duster',
      type: 'StartsUsing',
      netRegex: { id: '7738', source: 'Silkie', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🔵십자 장판',
          de: 'Interkardinal',
          ja: '🔵斜め',
          ko: '대각선 쪽으로',
        },
      },
    },
    {
      id: 'Sildihn Silkie Chilling Duster Slippery',
      type: 'StartsUsing',
      netRegex: { id: '773B', source: 'Silkie', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '따라가서 => 🔵십자 장판',
          de: 'Folgen => Interkardinal',
          ja: '近づく => 🔵斜め',
          ko: '따라가기 => 대각선 쪽으로',
        },
      },
    },
    {
      id: 'Sildihn Silkie Chilling Duster Puffs',
      type: 'StartsUsing',
      netRegex: { id: '773F', source: 'Silkie', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // TODO: how do you word this???
          // "Do the mechanic <se.6>"
          en: '🔵십자 장판: 보스와 솜털',
          de: 'Weiche den "+" von Silkie und den Puscheln aus',
          ja: '🔵ボスとたまの斜め',
          ko: '보스와 구슬의 십자방향 피하기',
        },
      },
    },
    {
      id: 'Sildihn Silkie Bracing Duster',
      type: 'StartsUsing',
      netRegex: { id: '7739', source: 'Silkie', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Sildihn Silkie Bracing Duster Slippery',
      type: 'StartsUsing',
      // No source here as sometimes the mob name is stale (!!) during the bridge section of the timeline.
      netRegex: { id: '773C', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '따라가서 => 🟢바로 밑으로',
          de: 'Folgen => Unter Ihn',
          ja: '近づく => 🟢下へ',
          ko: '따라가기 => 밑으로',
        },
      },
    },
    // 실키: Chilling Suds
    {
      id: 'SS+ 실키 Chilling Suds',
      type: 'StartsUsing',
      netRegex: { id: '7736', source: 'Silkie', capture: false },
      infoText: '파랑🔵 꼬리',
    },

    // 실키: Bracing Suds
    {
      id: 'SS+ 실키 Bracing Suds',
      type: 'StartsUsing',
      netRegex: { id: '7735', source: 'Silkie', capture: false },
      infoText: '초록🟢 꼬리',
    },
    {
      id: 'Sildihn Gladiator Flash of Steel',
      type: 'StartsUsing',
      netRegex: { id: '7656', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Sildihn Gladiator Sculptor\'s Passion',
      type: 'StartsUsing',
      netRegex: { id: '764A', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Sildihn Gladiator Mighty Smite',
      type: 'StartsUsing',
      netRegex: { id: '7657', source: 'Gladiator of Sil\'dih' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Sildihn Gladiator Shattering Steel',
      type: 'StartsUsing',
      netRegex: { id: '764B', source: 'Gladiator of Sil\'dih', capture: false },
      // Cast is 12s, Liftoff debuff is 5s
      delaySeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '올라가는 기둥 타세요',
          de: 'Geh in den großen Wind-Kreis',
          ja: '風ゆかの中へ',
          ko: '큰 바람장판 안으로',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Ring of Might 1',
      type: 'StartsUsing',
      netRegex: { id: '763F', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '링 차지 ①',
          de: 'Außerhalb des inneren Ringes (1)',
          ja: 'リングチャージ１',
          ko: '안쪽 고리 밖으로 (1)',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Ring of Might 2',
      type: 'StartsUsing',
      netRegex: { id: '7640', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '링 차지 ②',
          de: 'Außerhalb des mittleren Ringes (2)',
          ja: 'リングチャージ２',
          ko: '중간 고리 밖으로 (2)',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Ring of Might 3',
      type: 'StartsUsing',
      netRegex: { id: '7641', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '링 차지 ③',
          de: 'Außerhalb des äußeren Ringes (3)',
          ja: 'リングチャージ３',
          ko: '바깥쪽 고리 밖으로 (3)',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Ring of Might Followup',
      type: 'Ability',
      netRegex: { id: ['763F', '7640', '7641'], source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      response: Responses.getIn('info'),
    },
    {
      id: 'Sildihn Gladiator Rush of Might 1',
      type: 'StartsUsing',
      netRegex: { id: '763A', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '러시 차지 ①',
          de: 'Hinter der nächsten Markierung (1)',
          ja: '1番目',
          ko: '첫번째 선 뒤 (1)',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Rush of Might 2',
      type: 'StartsUsing',
      netRegex: { id: '763B', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '러시 차지 ②',
          de: 'Hinter der mittleren Markierung (2)',
          ja: '2番目',
          ko: '두번째 선 뒤 (2)',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Rush of Might 3',
      type: 'StartsUsing',
      netRegex: { id: '763C', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '러시 차지 ③',
          de: 'Hinter der entfernten Markierung (3)',
          ja: '3番目',
          ko: '세번째 선 뒤 (3)',
        },
      },
    },
    {
      id: 'Sildihn Gladiator Rush of Might Followup',
      type: 'Ability',
      netRegex: { id: '763D', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '움직여요',
          de: 'Durchlaufen',
          ja: 'ボスをまたいて移動',
          ko: '보스 통과하기',
        },
      },
    },
    {
      id: 'Sildihn Shadowcaster Show of Strength',
      type: 'StartsUsing',
      netRegex: { id: '74AE', source: 'Shadowcaster Zeless Gah', capture: false },
      response: Responses.aoe(),
    },
    // 글라디에이터: Wrath of Ruin
    {
      id: 'SS+ 그라디아토르 Wrath of Ruin',
      type: 'StartsUsing',
      netRegex: { id: '7645', source: 'Gladiator of Sil\'dih', capture: false },
      infoText: '바깥에 구슬 나와요',
    },
    // 글라디에이터: Sundered Remains
    //   7648이 첨, 7649가 이어서 여러개
    {
      id: 'SS+ 그라디아토르 Sundered Remains',
      type: 'StartsUsing',
      netRegex: { id: '7648', source: 'Gladiator of Sil\'dih', capture: false },
      infoText: '바닥에 연속 장판이 깔려요~',
    },
    {
      id: 'Sildihn Shadowcaster Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: { id: '74AC', source: 'Shadowcaster Zeless Gah' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Sildihn Shadowcaster Infern Gale',
      type: 'Ability',
      netRegex: { id: '74A2', source: 'Shadowcaster Zeless Gah', capture: false },
      // 6.4s between 74A2 and 74A3 knockback (no cast)
      delaySeconds: 1.4,
      response: Responses.knockback(),
    },
    {
      id: 'Sildihn Shadowcaster Infern Wellw',
      type: 'Ability',
      netRegex: { id: '74A7', source: 'Shadowcaster Zeless Gah', capture: false },
      // 10s between 74A7 and 74AA draw-in (no cast)
      delaySeconds: 5,
      response: Responses.drawIn(),
    },
    {
      id: 'Sildihn Thorne Cogwheel',
      type: 'StartsUsing',
      netRegex: { id: '70EB', source: 'Thorne Knight', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Sildihn Thorne Blistering Blow',
      type: 'StartsUsing',
      netRegex: { id: '70EA', source: 'Thorne Knight' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Sildihn Fore Honor',
      type: 'StartsUsing',
      netRegex: { id: '70EC', source: 'Thorne Knight', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Sildihn Slashburn Reversed',
      type: 'HeadMarker',
      netRegex: { id: '016B', target: 'Thorne Knight', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[반대쪽] 안전지대로',
          de: 'Umgekehrter Brandschlitzer',
          ja: 'ゆか反転',
          ko: '장판 반전',
        },
      },
    },
    // 쏜: Spring to Life
    {
      id: 'SS+ 쏜나이트 Spring to Life',
      type: 'StartsUsing',
      netRegex: { id: '70ED', source: 'Thorne Knight', capture: false },
      durationSeconds: 7,
      infoText: '그리드▦ 나와요',
    },
    // 쏜: Spring to Life + Blaze of Glory
    {
      id: 'SS+ 쏜나이트 Spring to Life:Glory',
      type: 'StartsUsing',
      netRegex: { id: '70EE', source: 'Thorne Knight', capture: false },
      durationSeconds: 7,
      infoText: '구슬 십자 + 그리드▦ 나와요',
    },
    // 쏜: Signal Flare
    {
      id: 'SS+ 쏜나이트 Signal Flare',
      type: 'StartsUsing',
      netRegex: { id: '70F5', source: 'Thorne Knight', capture: false },
      durationSeconds: 7,
      infoText: '세번째 있다가 → 첫번째 사라지면 들어가요',
    },
    // 쏜: Blaze of Glory
    {
      id: 'SS+ 쏜나이트 Blaze of Glory',
      type: 'StartsUsing',
      netRegex: { id: '70F4', source: 'Thorne Knight', capture: false },
      durationSeconds: 3,
      infoText: '구슬 두개 나와요',
    },
    // Slashburn(70EF)
    // Reverse Slashburn(70F0, 70F1)
    // Slashburn + Glory(7102)
  ],
  timelineReplace: [
    {
      locale: 'en',
      replaceText: {
        'Colossal Launch / Colossal Swing': 'Colossal Launch/Swing',
        'Squeaky Left/Squeaky Right': 'Squeaky Left/Right',
        'Bracing Suds / Chilling Suds': 'Bracing/Chilling Suds',
        'Bracing Duster / Chilling Duster': 'Bracing/Chilling Duster',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Amalj\'aa Artillery Carriage': 'Amalj\'aa-Artillerie',
        'Antique Boulder': 'locker(?:e|er|es|en) Felsen',
        'Arcane Font': 'arkan(?:e|er|es|en) Tafel',
        'Ball of Fire': 'Feuerball',
        'Cold Arms\' Quietus': 'Haus der kalten Waffen',
        'Eastern Ewer': 'Waschkrug',
        'Eternal Ease': 'Ewiger Einklang',
        'Geryon the Steer': 'Geryon (?:der|die|das) Gewaltsam(?:e|er|es|en)',
        'Gladiator of Sil\'dih': 'Gladiator von Sil\'dih',
        'Hateful Visage': 'Hassendes Haupt',
        'Infern Brand': 'Infernales Mal',
        'Magicked Puppet': 'magisch(?:e|er|es|en) Marionette',
        'Powder Keg': 'Pulverfass',
        'Regret': 'Bedauern',
        'Shadowcaster Zeless Gah': 'Schattenwirker Zeless Gah',
        'Silken Puff': 'weich(?:e|er|es|en) Puschel',
        'Silkie': 'Silkie',
        'The Cornice Of Favor': 'Kranz der Gunst',
        'The Forgotten Forecourt': 'Vergessener Vorhof',
        'The Settling Basin': 'Absatzbecken',
        'The Sifting Site': 'Siebstätte',
        'The Silt Pump': 'Schlickpumpe',
        'Thorne Knight': 'Ritter der Thorne',
      },
      'replaceText': {
        '--draw in--': '--Ranziehen',
        '\\(in\\)': '(Rein)',
        '\\(out\\)': '(Raus)',
        '\\(far\\)': '(Weit weg)',
        '\\(near\\)': '(Nah ran)',
        '\\(mid\\)': '(Mitte)',
        'Amalj\'aa Artillery': 'Amalj\'aa-Artillerie',
        'Biting Wind': 'Heftiger Wind',
        'Blaze of Glory': 'Heilige Kreuzflamme',
        'Blazing Benifice': 'Heiliger Feuereifer',
        'Blistering Blow': 'Schwelender Schlag',
        'Bracing Duster': 'Spritziger Wedel',
        'Bracing Suds': 'Spritziger Schaum',
        'Brim Over': 'Hundert Flüsse',
        '(?<!Slash)Burn': 'Verbrennung',
        'Carpet Beater': 'Teppichklopfer',
        'Cast Shadow': 'Schattenfall',
        'Chilling Duster': 'Kalter Wedel',
        'Chilling Suds': 'Kalter Schaum',
        'Cogwheel': 'Glutwind',
        'Colossal Charge': 'Kolossale Rage',
        'Colossal Launch': 'Kolossaler Schuss',
        'Colossal Slam': 'Kolossaler Schlag',
        'Colossal Strike': 'Kolossaler Streich',
        'Colossal Swing': 'Kolossaler Schwung',
        'Cryptic Portal': 'Kryptisches Portal',
        'Deep Clean': 'Großes Reinemachen',
        'Dust Bluster': 'Staubbläser',
        'Eastern Ewers': 'Waschkrug',
        'Exploding Catapult': 'Berstendes Katapult',
        'Explosion': 'Explosion',
        'Firesteel Fracture': 'Feuerstahl-Brecher',
        'Flash of Steel': 'Blitzender Stahl',
        'Fore Honor': 'Vorfeuer',
        'Fresh Puff': 'Frischer Puschel',
        'Gigantomill': 'Titanomühle',
        'Gladiator of Sil\'dih': 'Gladiator von Sil\'dih',
        'Golden Flame': 'Goldene Flamme',
        'Hateful Visage': 'Hassendes Haupt',
        'Infern Brand': 'Infernales Mal',
        'Infern Gale': 'Infernaler Wind',
        'Infern Ward': 'Infernale Wehr',
        'Infern Well': 'Infernaler Brunnen',
        'Intake': 'Einsaugen',
        'Landing': 'Schnelle Landung',
        'Magic Cannon': 'Magische Kanone',
        'Mighty Smite': 'Mächtiger Streich',
        'Puff and Tumble': 'Puschelputz',
        'Pure Fire': 'Reines Feuer',
        'Rack and Ruin': 'Düster Gram',
        'Ring of Might': 'Rausch der Macht',
        'Rinse': 'Spülung',
        'Rolling Boulder': 'Rollender Fels',
        'Runaway Runoff': 'Entfesselter Guss',
        'Runaway Sludge': 'Entfesselter Schlamm',
        'Rush of Might': 'Rausch der Macht',
        'Sculptor\'s Passion': 'Bildners Hohn',
        'Shattering Steel': 'Schmetternder Stahl',
        'Shockwave': 'Schockwelle',
        'Show of Strength': 'Kraftakt',
        'Signal Flare': 'Signalfeuer',
        'Silver Flame': 'Silberne Flamme',
        'Slashburn': 'Brandschlitzer',
        'Slippery Soap': 'Schmierige Seife',
        'Soap\'s Up': 'Einseifen',
        'Soaping Spree': 'Seifentaumel',
        'Spot Remover': 'Fleckweg',
        'Spring to Life': 'Zum Leben erwacht',
        'Squeaky Left': 'Blitzelinks',
        'Squeaky Right': 'Blitzerechts',
        'Subterranean Shudder': 'Schauder der Unterstadt',
        'Suddenly Sewage': 'Entfesseltes Abwasser',
        'Sundered Remains': 'Tote Trümmer',
        'Total Wash': 'Vollwäsche',
        'Wash Out': 'Abwasch',
        'Wrath of Ruin': 'Düster Zorn',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Amalj\'aa Artillery Carriage': 'canon de campagne amalj\'aa',
        'Antique Boulder': 'roche instable',
        'Arcane Font': 'sphère arcanique',
        'Ball of Fire': 'Boule de flammes',
        'Cold Arms\' Quietus': 'Entrepôt des armes sacrées',
        'Eastern Ewer': 'cruche orientale',
        'Eternal Ease': 'Tombe du héros trépassé',
        'Geryon the Steer': 'Géryon le Dominateur',
        'Gladiator of Sil\'dih': 'gladiateur sildien',
        'Hateful Visage': 'Visage de haine',
        'Infern Brand': 'Étendard sacré',
        'Magicked Puppet': 'soldat-mage des Thorne',
        'Powder Keg': 'tonneau de poudre',
        'Regret': 'Regret',
        'Shadowcaster Zeless Gah': 'Zeless Gah la Flamme ombrée',
        'Silken Puff': 'pompon de Silkie',
        'Silkie': 'Silkie',
        'The Cornice Of Favor': 'Arène des Faveurs',
        'The Forgotten Forecourt': 'Avant-cour abandonnée',
        'The Settling Basin': 'Bassin de sédiments',
        'The Sifting Site': 'Site de filtrage',
        'The Silt Pump': 'Salle des pompes à limon',
        'Thorne Knight': 'chevalier-mage des Thorne',
      },
      'replaceText': {
        'Amalj\'aa Artillery': 'Artillerie amalj\'aa',
        'Biting Wind': 'Tornade',
        'Blaze of Glory': 'Croix des flammes sacrées',
        'Blazing Benifice': 'Canon des flammes sacrées',
        'Blistering Blow': 'Coup fulgurant',
        'Bracing Duster': 'Plumeau tonifiant',
        'Bracing Suds': 'Mousse tonifiante',
        'Brim Over': 'Ras-le-bord',
        '(?<!Slash)Burn': 'Combustion',
        'Carpet Beater': 'Tapette à tapis',
        'Cast Shadow': 'Ombre crépitante',
        'Chilling Duster': 'Plumeau givré',
        'Chilling Suds': 'Mousse givrée',
        'Cogwheel': 'Souffle ardent',
        'Colossal Charge': 'Ruée colossale',
        'Colossal Launch': 'Lancer colossal',
        'Colossal Slam': 'Coup colossal',
        'Colossal Strike': 'Frappe colossale',
        'Colossal Swing': 'Swing colossal',
        'Cryptic Portal': 'Portail cryptique',
        'Deep Clean': 'Grand nettoyage',
        'Dust Bluster': 'Dépoussiérage',
        'Eastern Ewers': 'Aiguière aqueuse',
        'Exploding Catapult': 'Catapulte explosive',
        'Explosion': 'Explosion',
        'Firesteel Fracture': 'Choc brasero',
        'Flash of Steel': 'Éclair d\'acier',
        'Fore Honor': 'Lueur ardente',
        'Fresh Puff': 'Pompon lustré',
        'Gigantomill': 'Broyage colossal',
        'Gladiator of Sil\'dih': 'gladiateur sildien',
        'Golden Flame': 'Flamme dorée',
        'Hateful Visage': 'Visage de haine',
        'Infern Brand': 'Étendard sacré',
        'Infern Gale': 'Brise infernale',
        'Infern Ward': 'Barrière infernale',
        'Infern Well': 'Fourneau infernal',
        'Intake': 'Aspiration',
        'Landing': 'Atterrissage rapide',
        'Magic Cannon': 'Canon magique',
        'Mighty Smite': 'Taillade belliqueuse',
        'Puff and Tumble': 'Pompon culbuteur',
        'Pure Fire': 'Feu immaculé',
        'Rack and Ruin': 'Dévastation immémoriale',
        'Ring of Might': 'Rafale de puissance',
        'Rinse': 'Rinçage',
        'Rolling Boulder': 'Rocher roulant',
        'Runaway Runoff': 'Éruption boueuse',
        'Runaway Sludge': 'Éruption fangeuse',
        'Rush of Might': 'Déferlement de puissance',
        'Sculptor\'s Passion': 'Canon belliqueux',
        'Shattering Steel': 'Ravage d\'acier',
        'Shockwave': 'Onde de choc',
        'Show of Strength': 'Cri du guerrier',
        'Signal Flare': 'Brasier du tocsin',
        'Silver Flame': 'Flamme argentée',
        'Slashburn': 'Taillade enflammée',
        'Slippery Soap': 'Bain moussant glissant',
        'Soap\'s Up': 'Bain moussant explosif',
        'Soaping Spree': 'Bain moussant public',
        'Spot Remover': 'Antitaches',
        'Spring to Life': 'Source de vie',
        'Squeaky Left': 'Frottage gauche',
        'Squeaky Right': 'Frottage droit',
        'Subterranean Shudder': 'Frémissement souterrain',
        'Suddenly Sewage': 'Éruption crasseuse',
        'Sundered Remains': 'Soulèvement belliqueux',
        'Total Wash': 'Lavage intégral',
        'Wash Out': 'Essorage',
        'Wrath of Ruin': 'Colère immémoriale',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Amalj\'aa Artillery Carriage': 'アマルジャ式野砲',
        'Antique Boulder': '岩石',
        'Arcane Font': '立体魔法陣',
        'Ball of Fire': '火炎球',
        'Cold Arms\' Quietus': '聖火兵器安置場',
        'Eastern Ewer': '洗い壺',
        'Eternal Ease': '勇士たちの寝所',
        'Geryon the Steer': '覇道のゲーリュオン',
        'Gladiator of Sil\'dih': 'シラディハ・グラディアトル',
        'Hateful Visage': '呪像起動',
        'Infern Brand': '呪具設置',
        'Magicked Puppet': 'ソーン・マジックソルジャー',
        'Powder Keg': '樽爆弾',
        'Regret': '後悔',
        'Shadowcaster Zeless Gah': '影火のゼレズ・ガー',
        'Silken Puff': 'シルキーズ・ポンポン',
        'Silkie': 'シルキー',
        'The Cornice Of Favor': '御前闘技台',
        'The Forgotten Forecourt': '花園の前庭',
        'The Settling Basin': '汚泥処理池',
        'The Sifting Site': '沈石搬出施設',
        'The Silt Pump': '泥水ポンプ棟',
        'Thorne Knight': 'ソーン・マジックナイト',
      },
      'replaceText': {
        'Amalj\'aa Artillery': 'アマルジャ式野砲',
        'Biting Wind': '烈風',
        'Blaze of Glory': '十字聖火',
        'Blazing Benifice': '聖火砲',
        'Blistering Blow': '乱斬り',
        'Bracing Duster': 'そよそよダスター',
        'Bracing Suds': 'そよそよシャンプー',
        'Brim Over': '現出',
        '(?<!Slash)Burn': '燃焼',
        'Carpet Beater': 'カーペットビーター',
        'Cast Shadow': '影火呪式',
        'Chilling Duster': 'ひえひえダスター',
        'Chilling Suds': 'ひえひえシャンプー',
        'Cogwheel': '焔剣熱風斬',
        'Colossal Charge': 'コロッサスチャージ',
        'Colossal Launch': 'コロッサスローンチ',
        'Colossal Slam': 'コロッサススラム',
        'Colossal Strike': 'コロッサスストライク',
        'Colossal Swing': 'コロッサススイング',
        'Cryptic Portal': '転移の呪印',
        'Deep Clean': '大掃除',
        'Dust Bluster': 'ダストブロワー',
        'Eastern Ewers': '洗い壺',
        'Exploding Catapult': '爆弾ブン投げ',
        'Explosion': '爆発',
        'Firesteel Fracture': '石火豪打',
        'Flash of Steel': '闘人の波動',
        'Fore Honor': '前方焔剣閃',
        'Fresh Puff': 'ポンポン創出',
        'Gigantomill': 'コロッサスミル',
        'Gladiator of Sil\'dih': 'シラディハ・グラディアトル',
        'Golden Flame': '黄金の閃火',
        'Hateful Visage': '呪像起動',
        'Infern Brand': '呪具設置',
        'Infern Gale': '呪具暴風',
        'Infern Ward': '呪具警陣',
        'Infern Well': '呪具吸炎',
        'Intake': '吸引',
        'Landing': '落着',
        'Magic Cannon': '魔力砲',
        'Mighty Smite': '闘人の斬撃',
        'Puff and Tumble': 'ポンポンはたきがけ',
        'Pure Fire': '劫火',
        'Rack and Ruin': '亡念弾',
        'Ring of Might': '大剛の旋撃',
        'Rinse': 'すすぎ洗い',
        'Rolling Boulder': '転石',
        'Runaway Runoff': '水塊噴出',
        'Runaway Sludge': '泥塊噴出',
        'Rush of Might': '大剛の突撃',
        'Sculptor\'s Passion': '闘人砲',
        'Shattering Steel': '激発の波動',
        'Shockwave': '衝撃波',
        'Show of Strength': '勇士の咆哮',
        'Signal Flare': '烽火連天',
        'Silver Flame': '白銀の閃火',
        'Slashburn': '刀撃火種',
        'Slippery Soap': 'すべってシャンプーボム',
        'Soap\'s Up': 'シャンプーボム',
        'Soaping Spree': 'みんなでシャンプーボム',
        'Spot Remover': '水撒き',
        'Spring to Life': '兵装発動',
        'Squeaky Left': '左水拭き',
        'Squeaky Right': '右水拭き',
        'Subterranean Shudder': '連鎖振動波',
        'Suddenly Sewage': '汚水噴出',
        'Sundered Remains': '闘場隆起',
        'Total Wash': '水洗い',
        'Wash Out': '洗い流す',
        'Wrath of Ruin': '亡念励起',
      },
    },
  ],
};

export default triggerSet;
