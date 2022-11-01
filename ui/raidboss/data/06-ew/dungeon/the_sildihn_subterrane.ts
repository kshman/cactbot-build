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
        },
        avoidBoulders: {
          en: '파란통🔵으로: (돌 피해요)',
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
      netRegex: { id: ['7656', '764C'], source: 'Gladiator of Sil\'dih', capture: false },
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
  ],
};

export default triggerSet;
