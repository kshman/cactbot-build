import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  // The in/out comes before the stacks/spread markers, this value is the
  // "current" mechanic so that we can call "spread out" after hair raid finishes.
  barberyMechanic?: 'stack' | 'spread';
  // This value records once we've seen a given savage barbery mechanic,
  // what the next one is going to be to call out slightly earlier.
  nextBarberyMechanic?: 'stack' | 'spread';
  secretBreezeCount: number;
  boulderBreakCount: number;
  boldBoulderTargets: string[];
  hairFlayUpbraidTargets: string[];
  blowAwayCount: number;
  blowAwayPuddleCount: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'StormsCrownExtreme',
  zoneId: ZoneId.StormsCrownExtreme,
  timelineFile: 'barbariccia-ex.txt',
  initData: () => {
    return {
      secretBreezeCount: 0,
      boldBoulderTargets: [],
      boulderBreakCount: 0,
      hairFlayUpbraidTargets: [],
      blowAwayCount: 0,
      blowAwayPuddleCount: 0,
    };
  },
  timelineTriggers: [
    {
      id: 'BarbaricciaEx Knuckle Drum',
      regex: /Knuckle Drum/,
      beforeSeconds: 5,
      suppressSeconds: 15,
      response: Responses.bigAoe(),
    },
    {
      id: 'BarbaricciaEx Blow Away',
      regex: /Blow Away/,
      beforeSeconds: 10,
      durationSeconds: 5,
      suppressSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack to Bait Puddles',
          ja: 'AOE誘導のために頭割り',
          ko: '장판 유도하러 뭉쳐요',
        },
      },
    },
    // 남쪽에 모여 도는 그것
    {
      id: 'BarbaricciaEx 어듬이 돌아라 물레야',
      regex: /Blow Away/,
      beforeSeconds: 7,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack South! Roll & Rolling!',
          ja: 'Stack South! Roll & Rolling!',
          ko: '남쪽에서 뭉쳐욧! 뱅글뱅글!',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'BarbaricciaEx Curling Iron Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '75B2', source: 'Barbariccia', capture: false },
      suppressSeconds: 5,
      run: (data) => {
        // This is mostly to clean up the rogue "Hair Spray" that happens
        // not during Savage Barbery.
        delete data.barberyMechanic;
        delete data.nextBarberyMechanic;
      },
    },
    {
      id: 'BarbaricciaEx Void Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '7570', source: 'Barbariccia', capture: false },
      response: Responses.aoe(),
    },
    {
      // Savage Barbery has 3 casts that all start at the same time.
      // 5.7 duration: 7464, 7465, 7466, 7489, 748B, 7573 (all actual cast bar, unknown how to differentiate)
      // 6.7 duration: 7574 (donut), 757A (line)
      // 8.8 duration: 7575 (out, paired with donut), 757B (out, paired with line)
      id: 'BarbaricciaEx Savage Barbery Donut',
      type: 'StartsUsing',
      netRegex: { id: '7574', source: 'Barbariccia', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'BarbaricciaEx Savage Barbery Line',
      type: 'StartsUsing',
      netRegex: { id: '757A', source: 'Barbariccia', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out and Away',
          ja: '外へ',
          ko: '밖으로 좀 떨어져요',
        },
      },
    },
    {
      // Hair Raid has 2 casts that start at the same time, then a slight delay for stack/spread.
      // 5.7 duration: 757C (wall), 757E (donut)
      // 7.7 duration: 757D (paired with wall), 757F (paired with donut)
      //
      // ~2.2s delay, and then:
      // 7.7 duration (Hair Spray): 75A6
      // 7.7 duration (Deadly Twist): 75A7
      id: 'BarbaricciaEx Hair Raid Donut',
      type: 'StartsUsing',
      netRegex: { id: '757E', source: 'Barbariccia', capture: false },
      durationSeconds: (data) => data.nextBarberyMechanic === undefined ? undefined : 5,
      alertText: (data, _matches, output) => {
        if (data.nextBarberyMechanic === 'stack')
          return output.inAndHealerGroups!();
        if (data.nextBarberyMechanic === 'spread')
          return output.inThenSpread!();
        return output.in!();
      },
      outputStrings: {
        in: Outputs.in,
        inThenSpread: {
          en: 'In => Spread',
          ja: '中 => 散会',
          ko: '안으로 🔜 흩어져요',
        },
        inAndHealerGroups: {
          en: 'In => Healer Groups',
          ja: '中 => ヒーラと4:4頭割り',
          ko: '안으로 🔜 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'BarbaricciaEx Hair Raid Donut Move',
      type: 'Ability',
      netRegex: { id: '757F', source: 'Barbariccia', capture: false },
      condition: (data) => data.barberyMechanic === 'spread',
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread Out',
          ja: '散会',
          ko: '흩어져요',
        },
      },
    },
    {
      id: 'BarbaricciaEx Hair Raid Wall',
      type: 'StartsUsing',
      netRegex: { id: '757C', source: 'Barbariccia', capture: false },
      durationSeconds: (data) => data.nextBarberyMechanic === undefined ? undefined : 5,
      alertText: (data, _matches, output) => {
        if (data.nextBarberyMechanic === 'stack')
          return output.wallAndHealerGroups!();
        if (data.nextBarberyMechanic === 'spread')
          return output.wallThenSpread!();
        return output.wall!();
      },
      outputStrings: {
        wall: {
          en: 'Wall',
          ja: '壁へ',
          ko: '벽으로',
        },
        wallAndHealerGroups: {
          en: 'Wall + Healer Groups',
          ja: '壁へ + ヒーラと4:4頭割り',
          ko: '벽으로 + 4:4 뭉쳐요',
        },
        wallThenSpread: {
          en: 'Wall => Spread',
          ja: '壁へ => 散会',
          ko: '벽으로 + 흩어져요',
        },
      },
    },
    {
      id: 'BarbaricciaEx Hair Raid Wall Move',
      type: 'Ability',
      netRegex: { id: '757D', source: 'Barbariccia', capture: false },
      condition: (data) => data.barberyMechanic === 'spread',
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread Out',
          ja: '散会',
          ko: '흩어져요!',
        },
      },
    },
    {
      id: 'BarbaricciaEx Hair Spray',
      type: 'StartsUsing',
      netRegex: { id: '75A6', source: 'Barbariccia', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        // This spread mechanic is used later in other phases of the fight as well.
        // However, that extra usage is fixed in the Curling Iron Cleanup trigger.
        data.barberyMechanic = 'spread';
        data.nextBarberyMechanic ??= 'stack';

        // Suppress extra "spread" if we handled it in Hair Raid.
        if (data.nextBarberyMechanic === 'spread') {
          delete data.nextBarberyMechanic;
          return;
        }
        return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'BarbaricciaEx Deadly Twist',
      type: 'StartsUsing',
      netRegex: { id: '75A7', source: 'Barbariccia', capture: false },
      suppressSeconds: 2,
      infoText: (data, _matches, output) => {
        data.barberyMechanic = 'stack';
        data.nextBarberyMechanic ??= 'spread';

        // Suppress extra "stack" if we handled it in Hair Raid.
        if (data.nextBarberyMechanic === 'stack') {
          delete data.nextBarberyMechanic;
          return;
        }
        return output.groups!();
      },
      outputStrings: {
        groups: Outputs.healerGroups,
      },
    },
    {
      id: 'BarbaricciaEx Void Aero III',
      type: 'StartsUsing',
      netRegex: { id: '7571', source: 'Barbariccia' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'BarbaricciaEx Secret Breeze 1',
      type: 'Ability',
      // Trigger on 7413 Hair Flay (large spreads during partner stacks)
      netRegex: { id: '7413', source: 'Barbariccia', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.protean!(),
      outputStrings: {
        protean: {
          en: 'Protean Spread',
          ja: '散会',
          ko: '프로틴, 흩어져요',
        },
      },
    },
    {
      id: 'BarbaricciaEx Secret Breeze Others',
      type: 'StartsUsing',
      netRegex: { id: '7580', source: 'Barbariccia', capture: false },
      preRun: (data) => data.secretBreezeCount++,
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        // On the first one, don't call too early. Call after the spread/partner stacks go off.
        if (data.secretBreezeCount !== 1)
          return output.protean!();
      },
      outputStrings: {
        protean: {
          en: 'Protean',
          ja: '散開',
          ko: '프로틴, 흩어져요',
        },
      },
    },
    {
      id: 'BarbaricciaEx Boulder Break',
      type: 'StartsUsing',
      netRegex: { id: '7383', source: 'Barbariccia' },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'BarbaricciaEx Brittle Boulder 1',
      type: 'Ability',
      netRegex: { id: '7383', source: 'Barbariccia', capture: false },
      durationSeconds: 8,
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Middle => Out + Spread',
          ja: '真ん中で誘導 => 散開',
          ko: '한가운데 모였다 🔜 밖으로 + 흩어져요',
        },
      },
    },
    {
      id: 'BarbaricciaEx Boulder',
      type: 'HeadMarker',
      netRegex: { id: '0173', capture: false },
      suppressSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Spread',
          ja: '外へ + 散会',
          ko: '밖으로 + 흩어져요',
        },
      },
    },
    {
      // These also favor a certain order of Tank/Healer for first set then DPS second set,
      // but if people are dead anybody can get these.
      id: 'BarbaricciaEx Brutal Rush',
      type: 'Tether',
      netRegex: { id: '0011' },
      condition: (data, matches) => matches.source === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Brutal Rush tether on You',
          ja: '自分に突進',
          ko: '내게 돌진 줄!',
        },
      },
    },
    {
      id: 'BarbaricciaEx Brutal Rush Move',
      type: 'Ability',
      // When the Brutal Rush hits you, the follow-up Brutal Gust has locked in.
      netRegex: { id: ['7583', '7584'], source: 'Barbariccia' },
      condition: (data, matches) => {
        // Suppress during the middle of puddles where these are (usually) naturally dodged.
        if (data.blowAwayPuddleCount !== 0 && data.blowAwayPuddleCount !== 4)
          return false;
        return matches.target === data.me;
      },
      response: Responses.moveAway(),
    },
    {
      id: 'BarbaricciaEx Hair Flay',
      type: 'StartsUsing',
      netRegex: { id: '7413', source: 'Barbariccia' },
      alertText: (data, matches, output) => {
        data.hairFlayUpbraidTargets.push(matches.target);
        if (data.me === matches.target)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'BarbaricciaEx Upbraid',
      type: 'StartsUsing',
      netRegex: { id: '75A8', source: 'Barbariccia' },
      alertText: (data, matches, output) => {
        data.hairFlayUpbraidTargets.push(matches.target);
        if (data.me === matches.target)
          return output.partnerStack!();
      },
      outputStrings: {
        partnerStack: Outputs.stackPartner,
      },
    },
    {
      id: 'BarbaricciaEx Upbraid Untargeted',
      type: 'StartsUsing',
      netRegex: { id: '75A8', source: 'Barbariccia', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.hairFlayUpbraidTargets.includes(data.me))
          return;
        return output.partnerStack!();
      },
      run: (data) => data.hairFlayUpbraidTargets = [],
      outputStrings: {
        partnerStack: {
          en: 'Partner Stack (unmarked)',
          ja: 'ペア (マーカーなし)',
          ko: '페어, 둘이 함께 (근데 마커가 없네)',
        },
      },
    },
    {
      id: 'BarbaricciaEx Bold Boulder',
      type: 'StartsUsing',
      netRegex: { id: '759B', source: 'Barbariccia' },
      infoText: (data, matches, output) => {
        data.boldBoulderTargets.push(matches.target);
        if (data.me === matches.target)
          return output.flareOnYou!();
      },
      outputStrings: {
        flareOnYou: {
          en: 'Flare on YOU',
          ja: '自分にフレア',
          ko: '내게 플레어',
        },
      },
    },
    {
      id: 'BarbaricciaEx Trample',
      type: 'StartsUsing',
      // There's no castbar for Trample, so use Bold Boulder and collect flares.
      // There's also an 0064 stack headmarker, but that's used elsewhere.
      netRegex: { id: '759B', source: 'Barbariccia', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      // info to match spread and flare to not conflict during knockback
      infoText: (data, _matches, output) => {
        if (data.boldBoulderTargets.includes(data.me))
          return;
        return output.stackMarker!();
      },
      run: (data) => data.boldBoulderTargets = [],
      outputStrings: {
        stackMarker: Outputs.stackMarker,
      },
    },
    {
      id: 'BarbaricciaEx Blow Away Reset',
      type: 'Ability',
      netRegex: { id: '7595', source: 'Barbariccia', capture: false },
      run: (data) => {
        data.blowAwayCount++;
        data.blowAwayPuddleCount = 0;
      },
    },
    {
      id: 'BarbaricciaEx Blow Away Puddle Count',
      type: 'StartsUsing',
      netRegex: { id: '7596', source: 'Barbariccia', capture: false },
      preRun: (data) => data.blowAwayPuddleCount++,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        // This handles Brittle Boulder 2 as well.
        if (data.blowAwayCount === 2 && data.blowAwayPuddleCount === 4)
          return output.stackMiddle!();
      },
      infoText: (data, _matches, output) => {
        return output[`num${data.blowAwayPuddleCount}`]!();
      },
      outputStrings: {
        num1: Outputs.num1,
        num2: Outputs.num2,
        num3: Outputs.num3,
        num4: Outputs.num4,
        stackMiddle: {
          en: 'Bait Middle',
          ja: '真ん中で誘導',
          ko: '한가운데로 유도',
        },
      },
    },
    {
      id: 'BarbaricciaEx Impact',
      type: 'StartsUsing',
      netRegex: { id: '75A0', source: 'Barbariccia' },
      // Could also have used 75A1, full cast time is 5.9s
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      response: Responses.knockback(),
    },
    {
      id: 'BarbaricciaEx Playstation Hair Chains',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      alertText: (_data, matches, output) => {
        switch (matches.id) {
          case '016F':
            return output.circle!();
          case '0170':
            return output.triangle!();
          case '0171':
            return output.square!();
          case '0172':
            return output.cross!();
        }
      },
      outputStrings: {
        circle: {
          en: 'Red Circle',
          ja: '赤まる',
          ko: '빨강○',
        },
        triangle: {
          en: 'Green Triangle',
          ja: '緑さんかく',
          ko: '초록△',
        },
        square: {
          en: 'Purple Square',
          ja: '紫しかく',
          ko: '보라□',
        },
        cross: {
          en: 'Blue X',
          ja: '青バツ',
          ko: '파랑✖',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Barbariccia': 'Barbarizia',
        'Stiff Breeze': 'Föhn',
      },
      'replaceText': {
        'ground': 'Boden',
        'line': 'Linie',
        'donut': 'Donut',
        'protean': 'Himmelsrichtungen',
        'Blow Away': 'Hauerwelle',
        'Blustery Ruler': 'Tosende Herrin',
        'Bold Boulder': 'Feister Fels',
        '(?<!(Brittle|Bold) )Boulder(?! Break)': 'Fels',
        'Boulder Break': 'Felsbruch',
        'Brittle Boulder': 'Feiner Fels',
        'Brush with Death': 'Haaresbreite',
        'Brutal Gust': 'Grausame Bö',
        'Brutal Rush': 'Grausame Hatz',
        'Catabasis': 'Katabasis',
        'Curling Iron': 'In Schale',
        'Deadly Twist': 'Flechtfolter',
        'Dry Blows': 'Haue',
        'Entanglement': 'Fesselnde Strähnen',
        'Fetters': 'Fesselung',
        'Hair Raid': 'Haarstreich',
        'Hair Spray': 'Wildwuchs',
        'Impact': 'Impakt',
        'Iron Out': 'Coiffure',
        'Knuckle Drum': 'Kahlhieb',
        'Maelstrom': 'Charybdis',
        'Raging Storm': 'Tobender Sturm',
        'Savage Barbery': 'Brutale Barbierei',
        'Secret Breeze': 'Heimlicher Hauch',
        '(?<!(Teasing |En))Tangle': 'Strähne',
        'Teasing Tangles': 'Sinistre Strähnen',
        'Tornado Chain': 'Kettenorkan',
        'Tousle': 'Föhn',
        'Trample': 'Trampeln',
        'Upbraid': 'Sturmfrisur',
        'Void Aero III': 'Nichts-Windga',
        'Void Aero IV': 'Nichts-Windka',
        'Voidstrom': 'Nichtssturm',
        'Winding Gale': 'Windende Winde',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Barbariccia': 'Barbariccia',
        'Stiff Breeze': 'rafale de vent',
      },
      'replaceText': {
        'ground': 'Sol',
        'line': 'Ligne',
        'donut': 'Donut',
        'protean': 'Positions',
        'Blow Away': 'Coups convulsifs',
        'Blustery Ruler': 'Despote venteux',
        'Bold Boulder': 'Grand conglomérat',
        '(?<!(Brittle|Bold) )Boulder(?! Break)': 'Conglomérat',
        'Boulder Break': 'Conglomérat pesant',
        'Brittle Boulder': 'Petit conglomérat',
        'Brush with Death': 'Brossage mortel',
        'Brutal Gust': 'Rafale brutale',
        'Brutal Rush': 'Ruée brutale',
        'Catabasis': 'Catabase',
        'Curling Iron': 'Boucle de fer',
        'Deadly Twist': 'Nœud fatal',
        'Dry Blows': 'Coups secs',
        'Entanglement': 'Enchevêtrement',
        'Fetters': 'Attache',
        'Hair Raid': 'Raid capillaire',
        'Hair Spray': 'Tresse laquée',
        'Impact': 'Impact',
        'Iron Out': 'Repassage capillaire',
        'Knuckle Drum': 'Batterie de poings',
        'Maelstrom': 'Charybde',
        'Raging Storm': 'Tempête enragée',
        'Savage Barbery': 'Barbarie sauvage',
        'Secret Breeze': 'Brise secrète',
        '(?<!(Teasing |En))Tangle': 'Emmêlement',
        'Teasing Tangles': 'Emmêlement railleur',
        'Tornado Chain': 'Chaîne de tornades',
        'Tousle': 'Ébourrifage',
        'Trample': 'Martèlement',
        'Upbraid': 'Natte sermonneuse',
        'Void Aero III': 'Méga Vent du néant',
        'Void Aero IV': 'Giga Vent du néant',
        'Voidstrom': 'Tempête du néant',
        'Winding Gale': 'Vent sinueux',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Barbariccia': 'バルバリシア',
        'Stiff Breeze': '荒風',
      },
      'replaceText': {
        'Blow Away': '拳震動地',
        'Blustery Ruler': 'ブロウルーラー',
        'Bold Boulder': '大岩礫',
        '(?<!(Brittle|Bold) )Boulder(?! Break)': '岩礫',
        'Boulder Break': '重岩礫',
        'Brittle Boulder': '小岩礫',
        'Brush with Death': '呪髪操作',
        'Brutal Gust': 'ブルータルガスト',
        'Brutal Rush': 'ブルータルラッシュ',
        'Catabasis': 'カタバシス',
        'Curling Iron': '呪髪装衣',
        'Deadly Twist': '呪髪穿',
        'Dry Blows': '拳震',
        'Entanglement': '呪髪呪縛',
        'Fetters': '拘束',
        'Hair Raid': 'ヘアレイド',
        'Hair Spray': '呪髪針',
        'Impact': '衝撃',
        'Iron Out': '髪衣還元',
        'Knuckle Drum': 'ナックルビート',
        'Maelstrom': 'ミールストーム',
        'Raging Storm': 'レイジングストーム',
        'Savage Barbery': 'サベッジバルバリー',
        'Secret Breeze': 'シークレットブリーズ',
        '(?<!(Teasing |En))Tangle': '呪髪',
        'Teasing Tangles': '呪髪拘束',
        'Tornado Chain': 'チェイントルネード',
        'Tousle': '荒風',
        'Trample': '踏みつけ',
        'Upbraid': '呪髪嵐',
        'Void Aero III': 'ヴォイド・エアロガ',
        'Void Aero IV': 'ヴォイド・エアロジャ',
        'Voidstrom': 'ヴォイドストーム',
        'Winding Gale': 'ウィンディングゲイル',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Barbariccia': '巴尔巴莉希娅',
        'Stiff Breeze': '荒风',
      },
      'replaceText': {
        'ground': '地面',
        'line': '直线',
        'donut': '月环',
        'protean': '八方',
        'Blow Away': '重拳激震',
        'Blustery Ruler': '天风主宰',
        'Bold Boulder': '巨岩砾',
        '(?<!(Brittle|Bold) )Boulder(?! Break)': '岩砾',
        'Boulder Break': '砾岩碎',
        'Brittle Boulder': '小岩砾',
        'Brush with Death': '咒发操控',
        'Brutal Gust': '残暴突风',
        'Brutal Rush': '残暴冲锋',
        'Catabasis': '落狱煞',
        'Curling Iron': '咒发武装',
        'Deadly Twist': '咒发刺',
        'Dry Blows': '拳震',
        'Entanglement': '咒发束缚',
        'Fetters': '拘束',
        'Hair Raid': '咒发突袭',
        'Hair Spray': '咒发针',
        'Impact': '冲击',
        'Iron Out': '咒发卸甲',
        'Knuckle Drum': '怒拳连震',
        'Maelstrom': '大漩涡',
        'Raging Storm': '愤怒风暴',
        'Savage Barbery': '野蛮剃',
        'Secret Breeze': '隐秘之风',
        '(?<!(Teasing |En))Tangle': '咒发',
        'Teasing Tangles': '咒发拘束',
        'Tornado Chain': '龙卷连风',
        'Tousle': '荒风',
        'Trample': '踩踏',
        'Upbraid': '咒发突',
        'Void Aero III': '虚空暴风',
        'Void Aero IV': '虚空飙风',
        'Voidstrom': '虚无风暴',
        'Winding Gale': '追命狂风',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Barbariccia': '巴爾巴莉希亞',
        'Stiff Breeze': '荒風',
      },
      'replaceText': {
        // 'ground': '', // FIXME '地面'
        // 'line': '', // FIXME '直线'
        // 'donut': '', // FIXME '月环'
        // 'protean': '', // FIXME '八方'
        'Blow Away': '重拳激震',
        'Blustery Ruler': '天風主宰',
        'Bold Boulder': '巨岩礫',
        // '(?<!(Brittle|Bold) )Boulder(?! Break)': '', // FIXME '岩砾'
        'Boulder Break': '礫岩碎',
        'Brittle Boulder': '小岩礫',
        'Brush with Death': '咒髮操控',
        'Brutal Gust': '殘暴突風',
        'Brutal Rush': '殘暴衝鋒',
        'Catabasis': '落獄煞',
        'Curling Iron': '咒髮武裝',
        'Deadly Twist': '咒髮刺',
        'Dry Blows': '拳震',
        'Entanglement': '咒髮束縛',
        'Fetters': '拘束',
        'Hair Raid': '咒髮突襲',
        'Hair Spray': '咒髮針',
        'Impact': '衝擊',
        'Iron Out': '咒髮卸甲',
        'Knuckle Drum': '怒拳連震',
        'Maelstrom': '大漩渦',
        'Raging Storm': '憤怒風暴',
        'Savage Barbery': '野蠻剃',
        'Secret Breeze': '隱秘之風',
        // '(?<!(Teasing |En))Tangle': '', // FIXME '咒发'
        'Teasing Tangles': '咒髮拘束',
        'Tornado Chain': '龍捲連風',
        'Tousle': '荒風',
        'Trample': '踩踏',
        'Upbraid': '咒髮突',
        'Void Aero III': '虛空大勁風',
        'Void Aero IV': '虛空超勁風',
        'Voidstrom': '虛無風暴',
        'Winding Gale': '追命狂風',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Barbariccia': '바르바리차',
        'Stiff Breeze': '바람타래',
      },
      'replaceText': {
        'ground': '바닥',
        'line': '직선',
        'donut': '도넛',
        'protean': '8방',
        'Blow Away': '융기격',
        'Blustery Ruler': '바람의 지배자',
        'Bold Boulder': '큰 바윗덩이',
        '(?<!(Brittle|Bold) )Boulder(?! Break)': '바윗덩이',
        'Boulder Break': '무거운 바윗덩이',
        'Brittle Boulder': '작은 바윗덩이',
        'Brush with Death': '머리털 조작',
        'Brutal Gust': '사나운 돌풍',
        'Brutal Rush': '사나운 돌격',
        'Catabasis': '카타바시스',
        'Curling Iron': '머리털 갑옷',
        'Deadly Twist': '머리털 송곳',
        'Dry Blows': '지진격',
        'Entanglement': '머리카락 포박',
        'Fetters': '구속',
        'Hair Raid': '머리칼 급습',
        'Hair Spray': '머리털 바늘',
        'Impact': '충격',
        'Iron Out': '머리털 복원',
        'Knuckle Drum': '주먹 연타',
        'Maelstrom': '흑와 투기장',
        'Raging Storm': '성난 폭풍',
        'Savage Barbery': '난폭한 이발',
        'Secret Breeze': '은밀한 바람',
        '(?<!(Teasing |En))Tangle': '요술 머리털',
        'Teasing Tangles': '머리털 구속',
        'Tornado Chain': '연속 회오리',
        'Tousle': '바람타래',
        'Trample': '짓밟기',
        'Upbraid': '머리털 용오름',
        'Void Aero III': '보이드 에어로가',
        'Void Aero IV': '보이드 에어로쟈',
        'Voidstrom': '보이드의 폭풍',
        'Winding Gale': '휘도는 큰바람',
      },
    },
  ],
};

export default triggerSet;
