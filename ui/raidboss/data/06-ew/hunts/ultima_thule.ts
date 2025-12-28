import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type Data = RaidbossData;

// TODO: Narrow-rift Continual Meddling
// Continual Meddling = 6AC0, applies two of these, one 7 one 10 second, about ~1s before Empty Refrain cast:
//   7A6 = Forward March
//   7A7 = About Face
//   7A8 = Left Face
//   7A9 = Right Face
// TODO: Chi Bunker Buster
// TODO: Chi Bouncing Bomb

const triggerSet: TriggerSet<Data> = {
  id: 'UltimaThule',
  zoneId: ZoneId.UltimaThule,
  comments: {
    en: 'A Rank Hunts and Chi boss FATE',
  },
  triggers: [
    {
      id: 'Hunt Arch-Eta Energy Wave',
      type: 'StartsUsing',
      netRegex: { id: '6A85', source: 'Arch-Eta', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.awayFromFront(),
    },
    {
      id: 'Hunt Arch-Eta Sonic Howl',
      type: 'StartsUsing',
      netRegex: { id: '6A88', source: 'Arch-Eta', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Arch-Eta Tail Swipe',
      type: 'StartsUsing',
      netRegex: { id: '6A86', source: 'Arch-Eta', capture: false },
      condition: (data) => data.inCombat,
      alertText: (_data, _matches, output) => output.getFront!(),
      outputStrings: {
        getFront: {
          en: 'Get Front',
          ja: '前へ',
          ko: '꼬리치기! 앞으로',
        },
      },
    },
    {
      id: 'Hunt Arch-Eta Fanged Lunge',
      type: 'Ability',
      // Before Heavy Stomp (6A87) cast.
      netRegex: { id: '6A8A', source: 'Arch-Eta', capture: false },
      condition: (data) => data.inCombat,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Away from jump',
          ja: '着地点から離れる',
          ko: '착지점에서 멀리가욧',
        },
      },
    },
    {
      id: 'Hunt Arch-Eta Steel Fang',
      type: 'StartsUsing',
      netRegex: { id: '6A89', source: 'Arch-Eta' },
      condition: (data) => data.inCombat,
      response: Responses.tankBuster('info'),
    },
    {
      id: 'Hunt Fan Ail Cyclone Wing',
      type: 'StartsUsing',
      netRegex: { id: '6AF4', source: 'Fan Ail', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Fan Ail Plummet',
      type: 'StartsUsing',
      netRegex: { id: '6AF2', source: 'Fan Ail', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.awayFromFront(),
    },
    {
      id: 'Hunt Fan Ail Divebomb',
      type: 'StartsUsing',
      netRegex: { id: '6AED', source: 'Fan Ail', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.awayFromFront(),
    },
    {
      id: 'Hunt Fan Ail Death Sentence',
      type: 'StartsUsing',
      netRegex: { id: '6AF3', source: 'Fan Ail' },
      condition: (data) => data.inCombat,
      response: Responses.tankBuster('info'),
    },
    {
      id: 'Hunt Narrow-rift Empty Promise Donut',
      type: 'StartsUsing',
      netRegex: { id: '6B60', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getIn(),
    },
    {
      id: 'Hunt Narrow-rift Empty Promise Circle',
      type: 'StartsUsing',
      netRegex: { id: '6B5F', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getOut(),
    },
    {
      id: 'Hunt Narrow-rift Vanishing Ray',
      type: 'Ability',
      // An unknown single-target ability that preceeds Vanishing Ray with no cast bar.
      netRegex: { id: '6AC5', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt Narrow-rift Empty Refrain Out First',
      type: 'StartsUsing',
      // This is followed by a very short 6AC9 castbar.
      netRegex: { id: '6AC3', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getOutThenIn(),
    },
    {
      id: 'Hunt Narrow-rift Empty Refrain In Second',
      type: 'Ability',
      netRegex: { id: '6AC3', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      suppressSeconds: 1,
      response: Responses.getIn('info'),
    },
    {
      id: 'Hunt Narrow-rift Empty Refrain In First',
      type: 'StartsUsing',
      // This is followed by a very short 6AC7 castbar.
      netRegex: { id: '6AC4', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getInThenOut(),
    },
    {
      id: 'Hunt Narrow-rift Empty Refrain Out Second',
      type: 'Ability',
      netRegex: { id: '6AC4', source: 'Narrow-rift', capture: false },
      condition: (data) => data.inCombat,
      suppressSeconds: 1,
      response: Responses.getOut('info'),
    },
    // ---------------- Chi Boss FATE ----------------
    {
      id: 'Hunt Chi Assault Carapace (Donut)',
      // 6561 = 4.7s cast
      // 6254 = 7.7s cast (during Bunker Buster)
      type: 'StartsUsing',
      netRegex: { id: ['6561', '6254'], source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getUnder(),
    },
    {
      id: 'Hunt Chi Assault Carapace (Line)',
      // 6562 = 4.7s cast
      // 6255 = 7.7s cast (during Bunker Buster)
      type: 'StartsUsing',
      netRegex: { id: ['6562', '6255'], source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.goSides(),
    },
    {
      id: 'Hunt Chi Rear Guns',
      type: 'StartsUsing',
      netRegex: { id: '656A', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.goFront(),
    },
    {
      id: 'Hunt Chi Fore Arms',
      type: 'StartsUsing',
      netRegex: { id: '6567', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt Chi Rear Guns > Fore Arms 2.0',
      type: 'StartsUsing',
      netRegex: { id: '656B', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getFrontThenBack(),
    },
    {
      id: 'Hunt Chi Fore Arms > Rear Guns 2.0',
      type: 'StartsUsing',
      netRegex: { id: '6568', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getBackThenFront(),
    },
    {
      id: 'Hunt Chi Carapace > Fore Arms 2.0 (Donut)',
      type: 'StartsUsing',
      netRegex: { id: '6563', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Under => Back',
          ja: '下 => 後ろ',
          ko: '◎바로 밑에서 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'Hunt Chi Carapace > Fore Arms 2.0 (Line)',
      type: 'StartsUsing',
      netRegex: { id: '6565', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => Back',
          ja: '横 => 後ろ',
          ko: '↔옆에 있다가 🔜 엉댕이로',
        },
      },
    },
    {
      id: 'Hunt Chi Carapace > Rear Guns 2.0 (Donut)',
      type: 'StartsUsing',
      netRegex: { id: '6564', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Under => Front',
          ja: '下 => 前',
          ko: '◎바로 밑에서 🔜 앞으로',
        },
      },
    },
    {
      id: 'Hunt Chi Carapace > Rear Guns 2.0 (Line)',
      type: 'StartsUsing',
      netRegex: { id: '6566', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => Front',
          ja: '横 => 前',
          ko: '↔옆에 있다가 🔜 앞으로',
        },
      },
    },
    {
      id: 'Hunt Chi Missile Shower',
      type: 'StartsUsing',
      netRegex: { id: '6571', source: 'Chi', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Chi Hellburner',
      // tankbuster aoe around marked target (primary threat)
      type: 'StartsUsing',
      netRegex: { id: '6574', source: 'Chi' },
      condition: (data) => data.inCombat,
      response: Responses.tankCleave('alert'),
    },
    {
      id: 'Hunt Chi Thermobaric Explosive',
      // dual proximity aoes either N/S or E/W targeting the environment (E0000000)
      // proximity aoe locations (x, y):
      //   N: (650.00, 15.00)
      //   S: (650.00, -15.00)
      //   E: (665.00, 0.00)
      //   W: (635.00, 0.00)
      type: 'StartsUsing',
      netRegex: { id: '656E', source: 'Chi' },
      condition: (data) => data.inCombat,
      suppressSeconds: 1,
      infoText: (_data, matches, output) => {
        if (Math.abs(parseFloat(matches.x) - 650) < 0.1)
          return output.eastWest!();
        return output.northSouth!();
      },
      outputStrings: {
        northSouth: {
          en: 'Go North / South edge',
          ja: '南北の隅へ',
          ko: '남북 끝으로 (앞뒤 확인해야해요)',
        },
        eastWest: {
          en: 'Go East / West edge',
          ja: '東西の隅へ',
          ko: '동서 끝으로 (앞뒤 확인해야해요)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Arch-Eta': 'Erz-Eta',
        'Chi': 'Chi',
        'Fan Ail': 'Fan Ail',
        'Narrow-rift': 'Enger Riss',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Arch-Eta': 'Arch-Êta',
        'Chi': 'Chi',
        'Fan Ail': 'Fan Ail',
        'Narrow-rift': 'Rift-étroit',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Arch-Eta': 'アーチイータ',
        'Chi': 'カイ',
        'Fan Ail': 'ファン・アイル',
        'Narrow-rift': 'ナロー＝リフト',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Arch-Eta': '伊塔总领',
        'Chi': '希',
        'Fan Ail': '凡·艾尔',
        'Narrow-rift': '狭缝',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Arch-Eta': '伊塔總領',
        'Chi': '希',
        'Fan Ail': '凡·艾爾',
        'Narrow-rift': '狹縫',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Arch-Eta': '아치 에타',
        'Chi': '키',
        'Fan Ail': '판 아일',
        'Narrow-rift': '내로 리프트',
      },
    },
  ],
};

export default triggerSet;
