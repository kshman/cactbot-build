import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import { ConfigValue } from '../../../../../resources/user_config';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export type ConfigIds = 'uptimeKnockbackStrat';

export interface Data extends RaidbossData {
  prTank?: string;
  prMyRush?: number;
  //
  triggerSetConfig: { [key in ConfigIds]: ConfigValue };
  firstFrost?: string;
  rushCount?: number;
  akhMornTargets?: string[];
  wyrmsLament?: number;
  wyrmclawNumber?: number;
  wyrmfangNumber?: number;
}

// TODO: figure out *anything* with mirrors and mirror colors
// TODO: yell at you to take the last tower for Light Rampant if needed
// TODO: yell at you to take the last tower for Icelit Dragonsong if needed
// TODO: House of light clock position callout
// TODO: Light Rampant early callouts (who has prox marker, who gets aoes)
// TODO: reflected scythe kick callout (stand by mirror)
// TODO: reflected axe kick callout (get under)
// TODO: callouts for initial Hallowed Wings mirrors?
// TODO: callouts for the stack group mirrors?
// TODO: icelit dragonsong callouts?

const triggerSet: TriggerSet<Data> = {
  id: 'EdensVerseRefulgenceSavage',
  zoneId: ZoneId.EdensVerseRefulgenceSavage,
  config: [
    {
      // If you want cactbot to callout Mirror Mirror 4's double knockback, enable this option.
      // Callout happens during/after boss turns and requires <1.4s reaction time
      // to avoid both Green and Read Mirror knockbacks.
      // Example: https://clips.twitch.tv/CreativeDreamyAsparagusKlappa
      // Group splits into two groups behind boss after the jump.
      // Tanks adjust to where the Red and Green Mirror are located.
      // One tank must be inbetween the party, the other closest to Greem Mirror.
      // Once Green Mirror goes off, the tanks adjust for Red Mirror.
      id: 'uptimeKnockbackStrat',
      name: {
        en: 'Enable uptime knockback strat',
        de: 'Aktiviere Uptime Rückstoß Strategie',
        fr: 'e8s : activer cactbot pour la strat Uptime Knockback', // FIXME
        ja: 'エデン零式共鳴編４層：cactbot「ヘヴンリーストライク (ノックバック)」ギミック', // FIXME
        cn: '启用 cactbot 精确计时防击退策略',
        ko: '정확한 타이밍 넉백방지 공략 사용',
      },
      type: 'checkbox',
      default: (options) => {
        const oldSetting = options['cactbote8sUptimeKnockbackStrat'];
        return typeof oldSetting === 'boolean' ? oldSetting : false;
      },
    },
  ],
  timelineFile: 'e8s.txt',
  timelineTriggers: [
    {
      id: 'E8S Shining Armor',
      regex: /(?<!Reflected )Shining Armor/,
      beforeSeconds: 2,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'E8S Reflected Armor',
      regex: /Reflected Armor/,
      beforeSeconds: 2,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'E8S Frost Armor',
      // Not the reflected one, as we want the "move" call there
      // which will happen naturally from `Reflected Drachen Armor`.
      regex: /^Frost Armor$/,
      beforeSeconds: 2,
      response: Responses.stopMoving('alert'),
    },
    {
      id: 'E8S Rush',
      regex: /Rush \d/,
      beforeSeconds: 5,
      infoText: (data, _matches, output) => {
        data.rushCount = (data.rushCount ?? 0) + 1;
        if (data.rushCount === data.prMyRush)
          return output.my!({ num: data.rushCount });
        return output.text!({ num: data.rushCount });
      },
      outputStrings: {
        text: {
          en: '줄 ${num}번',
          de: 'Verbindung ${num}',
          fr: 'Lien ${num}',
          ja: '線 ${num}',
          cn: '和${num}连线',
          ko: '선: ${num}',
        },
        my: {
          en: '줄 채욧! ${num}번',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'E8S 자동공격',
      type: 'Ability',
      netRegex: { id: '4D59', source: 'Shiva' },
      suppressSeconds: 5,
      run: (data, matches) => data.prTank = matches.target,
    },
    {
      id: 'E8S Absolute Zero',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4DCC', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'E8S Biting Frost First Mirror',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D66', capture: false },
      condition: (data) => {
        // Have not seen any frost yet.
        return !data.firstFrost;
      },
      // This cast is 5 seconds, so don't muddy the back/front call.
      // But also don't wait too long to give directions?
      delaySeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // Sorry, there are no mirror colors in the logs (YET),
          // and so this is the best that can be done.
          en: '뒤로, 🟥 거울 쪽으로',
          de: 'Nach Hinten gehen, Seite des roten Spiegels',
          fr: 'Allez derrière, côté miroir rouge',
          ja: '後ろに、赤い鏡の横へ',
          cn: '去后面，红镜子侧',
          ko: '빨간 거울 방향 구석으로 이동',
        },
      },
    },
    {
      id: 'E8S Driving Frost First Mirror',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D67', capture: false },
      condition: (data) => !data.firstFrost,
      // See comments on Biting Frost First Mirror above.
      delaySeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '앞으로, 🟩 거울 쪽으로',
          de: 'Nach Vorne gehen, Seite des grünen Spiegels',
          fr: 'Allez devant, côté miroir vert',
          ja: '前に、赤い鏡の横へ',
          cn: '去前面，绿镜子侧',
          ko: '초록 거울 방향 구석으로 이동',
        },
      },
    },
    {
      id: 'E8S Reflected Frost 1',
      type: 'Ability',
      netRegex: { source: 'Frozen Mirror', id: '4DB[78]', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '반대편으로',
          de: 'Seiten wechseln',
          fr: 'Changez de côté',
          ja: '反対側へ',
          cn: '换边',
          ko: '반대로 이동',
        },
      },
    },
    {
      id: 'E8S Biting Frost',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D66', capture: false },
      response: Responses.getBehind(),
      run: (data) => data.firstFrost = data.firstFrost || 'biting',
    },
    {
      id: 'E8S Driving Frost',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D67', capture: false },
      response: Responses.goFrontOrSides(),
      run: (data) => {
        data.firstFrost ??= 'driving';
      },
    },
    {
      id: 'E8S Forgetful Tank Second Frost',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D6[67]', capture: false },
      condition: (data) => data.role === 'tank' || data.job === 'BLU',
      delaySeconds: 43,
      suppressSeconds: 80,
      infoText: (data, _matches, output) => {
        if (data.firstFrost === 'driving')
          return output.bitingFrostNext!();

        return output.drivingFrostNext!();
      },
      outputStrings: {
        bitingFrostNext: {
          en: '다음 Biting Frost',
          de: 'Frosthieb als nächstes',
          fr: 'Taillade de givre bientôt',
          ja: '次はフロストスラッシュ',
          cn: '下次攻击前侧面',
          ko: '다음: 서리 참격',
        },
        drivingFrostNext: {
          en: '다음 Driving Frost',
          de: 'Froststoß als nächstes',
          fr: 'Percée de givre bientôt',
          ja: '次はフロストスラスト',
          cn: '下次攻击后面',
          ko: '다음: 서리 일격',
        },
      },
    },
    {
      id: 'E8S Diamond Frost',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D6C', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'E8S Icicle Impact',
      type: 'Ability',
      netRegex: { source: 'Shiva', id: '4DA0' },
      suppressSeconds: 20,
      infoText: (_data, matches, output) => {
        const x = parseFloat(matches.x);
        if (x >= 99 && x <= 101)
          return output.northSouth!();

        return output.eastWest!();
      },
      outputStrings: {
        northSouth: {
          en: '남북으로',
          de: 'Norden / Süden',
          fr: 'Nord / Sud',
          ja: '南 / 北',
          cn: '南北站位',
          ko: '남 / 북',
        },
        eastWest: {
          en: '동서로',
          de: 'Osten / Westen',
          fr: 'Est / Ouest',
          ja: '東 / 西',
          cn: '东西站位',
          ko: '동 / 서',
        },
      },
    },
    {
      id: 'E8S Diamond Frost Cleanse',
      type: 'Ability',
      netRegex: { source: 'Shiva', id: '4D6C', capture: false },
      condition: (data) => data.CanCleanse(),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '에스나',
          de: 'Reinigen',
          fr: 'Guérison',
          ja: 'エスナ',
          cn: '驱散',
          ko: '에스나',
        },
      },
    },
    {
      id: 'E8S Double Slap',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D65' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'E8S Axe Kick',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D6D', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'E8S Scythe Kick',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D6E', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'E8S Light Rampant',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D73', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'E8S Refulgent Chain',
      type: 'GainsEffect',
      netRegex: { effectId: '8CD' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 사슬',
          de: 'Kette auf DIR',
          fr: 'Chaîne sur VOUS',
          ja: '自分に鎖',
          cn: '连线点名',
          ko: '사슬 대상자',
        },
      },
    },
    {
      id: 'E8S Holy Light',
      type: 'Tether',
      netRegex: { id: '0002' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 구슬',
          de: 'Orb auf DIR',
          fr: 'Orbe sur VOUS',
          ja: '自分に玉',
          cn: '拉球点名',
          ko: '구슬 대상자',
        },
      },
    },
    {
      id: 'E8S Banish III',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D80', capture: false },
      response: Responses.stackMarker('info'),
    },
    {
      id: 'E8S Banish III Divided',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D81', capture: false },
      response: Responses.spread('alert'),
    },
    {
      id: 'E8S Akh Morn',
      type: 'StartsUsing',
      netRegex: { source: ['Shiva', 'Great Wyrm'], id: ['4D98', '4D79'] },
      preRun: (data, matches) => {
        data.akhMornTargets ??= [];
        data.akhMornTargets.push(matches.target);
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          akhMornOnYou: {
            en: '내게 아크몬!!!',
            de: 'Akh Morn auf DIR',
            fr: 'Akh Morn sur VOUS',
            ja: '自分にアク・モーン',
            cn: '死亡轮回点名',
            ko: '아크몬 대상자',
          },
          akhMornOn: {
            en: '아크몬: ${players}',
            de: 'Akh Morn: ${players}',
            fr: 'Akh Morn : ${players}',
            ja: 'アク・モーン: ${players}',
            cn: '死亡轮回: ${players}',
            ko: '아크몬 : ${players}',
          },
        };
        if (data.me === matches.target) {
          // It'd be nice to have this be an alert, but it mixes with a lot of
          // other alerts (akh rhai "move" and worm's lament numbers).
          return { [data.role === 'tank' ? 'infoText' : 'alarmText']: output.akhMornOnYou!() };
        }
        if (data.akhMornTargets?.length !== 2)
          return;
        if (data.akhMornTargets.includes(data.me))
          return;
        const players = data.akhMornTargets.map((x) => data.ShortName(x)).join(', ');
        return { infoText: output.akhMornOn!({ players: players }) };
      },
    },
    {
      id: 'E8S Akh Morn Cleanup',
      type: 'StartsUsing',
      netRegex: { source: ['Shiva', 'Great Wyrm'], id: ['4D98', '4D79'], capture: false },
      delaySeconds: 15,
      run: (data) => delete data.akhMornTargets,
    },
    {
      id: 'E8S Morn Afah',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7B' },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.mornAfahOnYou!();

        return output.mornAfahOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        mornAfahOnYou: {
          en: '내게 몬아파!!!',
          de: 'Morn Afah auf DIR',
          fr: 'Morn Afah sur VOUS',
          ja: '自分にモーン・アファー',
          cn: '无尽顿悟点名',
          ko: '몬아파 대상자',
        },
        mornAfahOn: {
          en: '몬아파: ${player}',
          de: 'Morn Afah auf ${player}',
          fr: 'Morn Afah sur ${player}',
          ja: '${player}にモーン・アファー',
          cn: '无尽顿悟点 ${player}',
          ko: '"${player}" 몬 아파',
        },
      },
    },
    {
      id: 'E8S Hallowed Wings Left',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D75', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'E8S Hallowed Wings Right',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D76', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'E8S Hallowed Wings Knockback',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D77', capture: false },
      condition: (data) => data.triggerSetConfig.uptimeKnockbackStrat === true,
      // This gives a warning within 1.4 seconds, so you can hit arm's length.
      delaySeconds: 8.6,
      durationSeconds: 1.4,
      response: Responses.knockback(),
    },
    {
      id: 'E8S Wyrm\'s Lament',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7C', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'E8S Wyrm\'s Lament Counter',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7C', capture: false },
      run: (data) => data.wyrmsLament = (data.wyrmsLament ?? 0) + 1,
    },
    {
      id: 'E8S Wyrmclaw',
      type: 'GainsEffect',
      netRegex: { effectId: '8D2' },
      condition: Conditions.targetIsYou(),
      preRun: (data, matches) => {
        if (data.wyrmsLament === 1) {
          const clawNumber: { [time: string]: number } = {
            '14': 1,
            '22': 2,
            '30': 3,
            '38': 4,
          };
          data.wyrmclawNumber = clawNumber[Math.ceil(parseFloat(matches.duration))];
        } else {
          const clawNumber: { [time: string]: number } = {
            '22': 1,
            '38': 2,
          };
          data.wyrmclawNumber = clawNumber[Math.ceil(parseFloat(matches.duration))];
        }
      },
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (data, _matches, output) => output.text!({ num: data.wyrmclawNumber }),
      outputStrings: {
        text: {
          en: '🔴#${num}번',
          de: 'Rot #${num}',
          fr: 'Rouge #${num}',
          ja: '赤 #${num}',
          cn: '红色 #${num}',
          ko: '빨강 ${num}번',
        },
      },
    },
    {
      id: 'E8S Wyrmfang',
      type: 'GainsEffect',
      netRegex: { effectId: '8D3' },
      condition: Conditions.targetIsYou(),
      preRun: (data, matches) => {
        if (data.wyrmsLament === 1) {
          const fangNumber: { [time: string]: number } = {
            '20': 1,
            '28': 2,
            '36': 3,
            '44': 4,
          };
          data.wyrmfangNumber = fangNumber[Math.ceil(parseFloat(matches.duration))];
        } else {
          const fangNumber: { [time: string]: number } = {
            '28': 1,
            '44': 2,
          };
          data.wyrmfangNumber = fangNumber[Math.ceil(parseFloat(matches.duration))];
        }
      },
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      alertText: (data, _matches, output) => output.text!({ num: data.wyrmfangNumber }),
      outputStrings: {
        text: {
          en: '🔵#${num}번',
          de: 'Blau #${num}',
          fr: 'Bleu #${num}',
          ja: '青 #${num}',
          cn: '蓝色 #${num}',
          ko: '파랑 ${num}번',
        },
      },
    },
    {
      id: 'E8S Drachen Armor',
      type: 'Ability',
      netRegex: { source: 'Shiva', id: '4DD2', capture: false },
      response: Responses.moveAway('alert'),
    },
    {
      id: 'E8S Reflected Drachen Armor',
      type: 'Ability',
      netRegex: { source: 'Frozen Mirror', id: '4DC2', capture: false },
      response: Responses.moveAway('alert'),
    },
    {
      id: 'E8S Holy',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D82', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'E8S Holy Divided',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D83', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'E8S Twin Stillness',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D68', capture: false },
      response: Responses.getBackThenFront('alert'),
    },
    {
      id: 'E8S Twin Silence',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D69', capture: false },
      response: Responses.getFrontThenBack('alert'),
    },
    {
      id: 'E8S Spiteful Dance',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D6F', capture: false },
      response: Responses.getOutThenIn(),
    },
    {
      id: 'E8S Embittered Dance',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D70', capture: false },
      response: Responses.getInThenOut(),
    },
    {
      id: 'E8S Icelit Dragonsong Cleanse',
      type: 'Ability',
      netRegex: { source: 'Shiva', id: '4D7D', capture: false },
      condition: (data) => data.CanCleanse(),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'DPS 에스나!',
          de: 'Nur DPS reinigen',
          fr: 'Guérison => DPS seulement',
          ja: 'エスナ (DPSのみ)',
          cn: '驱散DPS',
          ko: '딜러만 에스나',
        },
      },
    },
    {
      id: 'E8S Banish',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7E', capture: false },
      condition: (data) => data.role === 'tank' || data.job === 'BLU',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '타워! 탱크 둘이 함께!!!',
          de: 'Auf Tank im Turm sammeln',
          fr: 'Package tanks dans la tour',
          ja: 'タンクは塔に頭割り',
          cn: '坦克塔内分摊',
          ko: '탱커 쉐어',
        },
      },
    },
    {
      id: 'E8S Banish Divided',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7F', capture: false },
      condition: (data) => data.role === 'tank' || data.job === 'BLU',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '타워! 탱크 흩어져요!!!',
          de: 'Tank im Turm verteilen',
          fr: 'Dispersion tanks dans la tour',
          ja: 'タンクは塔に散開',
          cn: '坦克塔内分散',
          ko: '탱커 산개',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Frozen Mirror': 'Eisspiegel',
        'great wyrm': 'Körper des heiligen Drachen',
        'Luminous Aether': 'Lichtäther',
        'Mothercrystal': 'Urkristall',
        'Shiva': 'Shiva',
      },
      'replaceText': {
        'Absolute Zero': 'Absoluter Nullpunkt',
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Axe/Scythe Kick': 'Axttritt/Abwehrtritt',
        'Banish(?! )': 'Verbannen',
        'Banish III': 'Verbannga',
        'Biting/Driving Frost': 'Frostshieb/Froststoß',
        'Bright Hunger': 'Erosionslicht',
        'Diamond Frost': 'Diamantstaub',
        'Double Slap': 'Doppelschlag',
        'Drachen Armor': 'Drachenrüstung',
        'Draconic Strike': 'Drakonischer Schlag',
        'Driving/Biting Frost': 'Froststoß/Frostshieb',
        'Embittered/Spiteful Dance': 'Strenger/Kalter Tanz',
        'Frigid Eruption': 'Eiseruption',
        'Frigid Needle': 'Eisnadel',
        'Frigid Stone': 'Eisstein',
        'Frigid Water': 'Eisfrost',
        'Frost Armor(?! )': 'Frostrüstung',
        'Hallowed Wings': 'Heilige Schwingen',
        'Heart Asunder': 'Herzensbrecher',
        'Heavenly Strike': 'Elysischer Schlag',
        'Holy': 'Sanctus',
        'Icelit Dragonsong': 'Lied von Eis und Licht',
        'Icicle Impact': 'Eiszapfen-Schlag',
        'Inescapable Illumination': 'Expositionslicht',
        'Light Rampant': 'Überflutendes Licht',
        'Mirror, Mirror': 'Spiegelland',
        'Morn Afah': 'Morn Afah',
        'Reflected Armor \\(B\\)': 'Spiegelung Rüstung (B)',
        'Reflected Armor \\(G\\)': 'Spiegelung Rüstung (G)',
        'Reflected Armor \\(R\\)': 'Spiegelung Rüstung (R)',
        'Reflected Drachen': 'Spiegelung Drachen',
        'Reflected Frost \\(G\\)': 'Spiegelung Frost (G)',
        'Reflected Frost \\(R\\)': 'Spiegelung Frost (R)',
        'Reflected Frost Armor': 'Spiegelung: Frostrüstung',
        'Reflected Kick \\(G\\)': 'Spiegelung Tritt (G)',
        'Reflected Wings \\(B\\)': 'Spiegelung Schwingen (B)',
        'Reflected Wings \\(G\\)': 'Spiegelung Schwingen (G)',
        'Reflected Wings \\(R\\)': 'Spiegelung Schwingen (R)',
        'Rush': 'Sturm',
        'Scythe/Axe Kick': 'Abwehrtritt/Axttritt',
        'Shattered World': 'Zersplitterte Welt',
        'Shining Armor': 'Funkelnde Rüstung',
        'Skyfall': 'Vernichtung der Welt',
        'Spiteful/Embittered Dance': 'Kalter/Strenger Tanz',
        'The Path Of Light': 'Pfad des Lichts',
        'The House Of Light': 'Tsunami des Lichts',
        'Twin Silence/Stillness': 'Zwillingsschwerter der Ruhe/Stille',
        'Twin Stillness/Silence': 'Zwillingsschwerter der Stille/Ruhe',
        'Wyrm\'s Lament': 'Brüllen des heiligen Drachen',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'frozen mirror': 'Miroir de glace',
        'great wyrm': 'Dragon divin',
        'luminous Aether': 'Éther de lumière',
        'Mothercrystal': 'Cristal-mère',
        'Shiva': 'Shiva',
      },
      'replaceText': {
        '\\?': ' ?',
        'Absolute Zero': 'Zéro absolu',
        'Akh Morn': 'Akh Morn',
        'Akh Rhai': 'Akh Rhai',
        'Axe/Scythe Kick': 'Jambe pourfendeuse/faucheuse',
        'Banish(?! )': 'Bannissement',
        'Banish III': 'Méga Bannissement',
        'Biting/Driving Frost': 'Taillade/Percée de givre',
        'Bright Hunger': 'Lumière dévorante',
        'Diamond Frost': 'Poussière de diamant',
        'Double Slap': 'Gifle redoublée',
        'Drachen Armor': 'Armure des dragons',
        'Draconic Strike': 'Frappe draconique',
        'Driving/Biting Frost': 'Percée/taillade de givre',
        'Embittered/Spiteful Dance': 'Danse de la sévérité/froideur',
        'Frigid Eruption': 'Éruption de glace',
        'Frigid Needle': 'Dards de glace',
        'Frigid Stone': 'Rocher de glace',
        'Frigid Water': 'Cataracte gelée',
        'Frost Armor(?! )': 'Armure de givre',
        'Hallowed Wings': 'Aile sacrée',
        'Heart Asunder': 'Cœur déchiré',
        'Icelit Dragonsong': 'Chant de Glace et de Lumière',
        'Icicle Impact': 'Impact de stalactite',
        'Inescapable Illumination': 'Lumière révélatrice',
        'Heavenly Strike': 'Frappe céleste',
        'Holy': 'Miracle',
        'Light Rampant': 'Débordement de Lumière',
        'Mirror, Mirror': 'Monde des miroirs',
        'Morn Afah': 'Morn Afah',
        'Reflected Armor \\(B\\)': 'Armure réverbérée (B)',
        'Reflected Armor \\(G\\)': 'Armure réverbérée (V)',
        'Reflected Armor \\(R\\)': 'Armure réverbérée (R)',
        'Reflected Drachen': 'Dragon réverbéré',
        'Reflected Frost \\(G\\)': 'Givre réverbéré (V)',
        'Reflected Frost \\(R\\)': 'Givre réverbéré (R)',
        'Reflected Frost Armor': 'Réverbération : Armure de givre',
        'Reflected Kick \\(G\\)': 'Jambe réverbérée (V)',
        'Reflected Wings \\(B\\)': 'Aile réverbérée (B)',
        'Reflected Wings \\(G\\)': 'Aile réverbérée (V)',
        'Reflected Wings \\(R\\)': 'Aile réverbérée (R)',
        'Rush': 'Jaillissement',
        'Scythe/Axe Kick': 'Jambe faucheuse/pourfendeuse',
        'Shattered World': 'Monde fracassé',
        'Shining Armor': 'Armure scintillante',
        'Skyfall': 'Anéantissement',
        'Spiteful/Embittered Dance': 'Danse de la froideur/sévérité',
        'The Path Of Light': 'Voie de lumière',
        'The House Of Light': 'Raz-de-lumière',
        'Twin Silence/Stillness': 'Entaille de la tranquilité/quiétude',
        'Twin Stillness/Silence': 'Entaille de la quiétude/tranquilité',
        'Wyrm\'s Lament': 'Rugissement du Dragon divin',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'frozen mirror': '氷面鏡',
        'great wyrm': '聖竜',
        'luminous Aether': 'ライト・エーテル',
        'Mothercrystal': 'マザークリスタル',
        'Shiva': 'シヴァ',
      },
      'replaceText': {
        'Absolute Zero': '絶対零度',
        'Akh Morn': 'アク・モーン',
        'Akh Rhai': 'アク・ラーイ',
        'Axe/Scythe Kick': 'アクスキック/サイスキック',
        'Banish(?! )': 'バニシュ',
        'Banish III': 'バニシュガ',
        'Biting/Driving Frost': 'フロストスラッシュ/フロストスラスト',
        'Bright Hunger': '浸食光',
        'Diamond Frost': 'ダイヤモンドダスト',
        'Double Slap': 'ダブルスラップ',
        'Drachen Armor': 'ドラゴンアーマー',
        'Draconic Strike': 'ドラコニックストライク',
        'Driving/Biting Frost': 'フロストスラスト/フロストスラッシュ',
        'Embittered/Spiteful Dance': '峻厳の舞踏技 / 冷厳の舞踏技',
        'Frigid Eruption': 'アイスエラプション',
        'Frigid Needle': 'アイスニードル',
        'Frigid Stone': 'アイスストーン',
        'Frigid Water': 'アイスフロスト',
        'Frost Armor(?! )': 'フロストアーマー',
        'Hallowed Wings': 'ホーリーウィング',
        'Heart Asunder': 'ハートアサンダー',
        'Heavenly Strike': 'ヘヴンリーストライク',
        'Holy': 'ホーリー',
        'Icelit Dragonsong': '氷と光の竜詩',
        'Icicle Impact': 'アイシクルインパクト',
        'Inescapable Illumination': '曝露光',
        'Light Rampant': '光の暴走',
        'Mirror, Mirror': '鏡の国',
        'Morn Afah': 'モーン・アファー',
        'Reflected Armor \\(B\\)': '反射アーマー（青）',
        'Reflected Armor \\(G\\)': '反射アーマー（緑）',
        'Reflected Armor \\(R\\)': '反射アーマー（赤）',
        'Reflected Drachen': '反射ドラゴンアーマー',
        'Reflected Frost \\(G\\)': '反射フロスト（緑）',
        'Reflected Frost \\(R\\)': '反射フロスト（赤）',
        'Reflected Frost Armor': 'ミラーリング・フロストアーマー',
        'Reflected Kick \\(G\\)': '反射キック',
        'Reflected Wings \\(B\\)': '反射ホーリーウィング（青)',
        'Reflected Wings \\(G\\)': '反射ホーリーウィング（緑）',
        'Reflected Wings \\(R\\)': '反射ホーリーウィング（赤）',
        'Rush': 'ラッシュ',
        'Scythe/Axe Kick': 'サイスキック/アクスキック',
        'Shattered World': 'シャッタード・ワールド',
        'Shining Armor': 'ブライトアーマー',
        'Skyfall': '世界消滅',
        'Spiteful/Embittered Dance': '冷厳の舞踏技 / 峻厳の舞踏技',
        'the Path of Light': '光の波動',
        'the House of Light': '光の津波',
        'Twin Silence/Stillness': '閑寂の双剣技／静寂の双剣技',
        'Twin Stillness/Silence': '静寂の双剣技／閑寂の双剣技',
        'Wyrm\'s Lament': '聖竜の咆哮',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Shiva': '希瓦',
        'Frozen Mirror': '冰面镜',
        'Mothercrystal': '母水晶',
        'Luminous Aether': '光以太',
        'great wyrm': '圣龙',
      },
      'replaceText': {
        'Absolute Zero': '绝对零度',
        'Mirror, Mirror': '镜中奇遇',
        'Biting/Driving Frost': '冰霜斩/刺',
        'Reflected Frost \\(G\\)': '连锁反斩(绿)',
        'Reflected Frost \\(R\\)': '连锁反斩(红)',
        'Diamond Frost': '钻石星尘',
        'Frigid Stone': '冰石',
        'Icicle Impact': '冰柱冲击',
        'Heavenly Strike': '天降一击',
        'Frigid Needle': '冰针',
        'Frigid Water': '冰霜',
        'Frigid Eruption': '极冰喷发',
        'Driving/Biting Frost': '冰霜刺/斩',
        'Double Slap': '双剑斩',
        'Shining Armor': '闪光护甲',
        'Axe/Scythe Kick': '阔斧/镰形回旋踢',
        'Light Rampant': '光之失控',
        'Bright Hunger': '侵蚀光',
        'The Path Of Light': '光之波动',
        'Scythe/Axe Kick': '镰形/阔斧回旋踢',
        'Reflected Kick \\(G\\)': '连锁反踢(绿)',
        'Banish III': '强放逐',
        'Shattered World': '世界分断',
        'Heart Asunder': '心碎',
        'Rush': '蓄势冲撞',
        'Skyfall': '世界消亡',
        'Akh Morn': '死亡轮回',
        'Morn Afah': '无尽顿悟',
        'Hallowed Wings': '神圣之翼',
        'Reflected Wings \\(B\\)': '连锁反翼(蓝)',
        'Reflected Wings \\(G\\)': '连锁反翼(绿)',
        'Reflected Wings \\(R\\)': '连锁反翼(红)',
        'Wyrm\'s Lament': '圣龙咆哮',
        '(?<! )Frost Armor': '冰霜护甲',
        'Twin Silence/Stillness': '闲寂/静寂的双剑技',
        'Twin Stillness/Silence': '静寂/闲寂的双剑技',
        'Drachen Armor': '圣龙护甲',
        'Akh Rhai': '天光轮回',
        'Reflected Armor \\(B\\)': '连锁反甲(蓝)',
        'Reflected Armor \\(G\\)': '连锁反甲(绿)',
        'Reflected Armor \\(R\\)': '连锁反甲(红)',
        'Holy': '神圣',
        'Embittered/Spiteful Dance': '严峻/冷峻之舞',
        'Spiteful/Embittered Dance': '冷峻/严峻之舞',
        'Reflected Drachen': '连锁反射：圣龙护甲',
        'Icelit Dragonsong': '冰与光的龙诗',
        'Draconic Strike': '圣龙一击',
        'Banish(?! )': '放逐',
        'Inescapable Illumination': '曝露光',
        'The House Of Light': '光之海啸',
        'Reflected Frost Armor \\(R\\)': '连锁反冰甲(红)',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Shiva': '시바',
        'Frozen Mirror': '얼음 거울',
        'Mothercrystal': '어머니 크리스탈',
        'Luminous Aether': '빛 에테르',
        'great wyrm': '성룡',
      },
      'replaceText': {
        'Absolute Zero': '절대영도',
        'Mirror, Mirror': '거울 나라',
        'Biting/Driving Frost': '서리 참격/일격',
        'Reflected Frost \\(G\\)': '반사된 참격/일격 (초록)',
        'Reflected Frost \\(R\\)': '반사된 참격/일격 (빨강)',
        'Diamond Frost': '다이아몬드 더스트',
        'Frigid Stone': '얼음돌',
        'Icicle Impact': '고드름 낙하',
        'Heavenly Strike': '천상의 일격',
        'Frigid Needle': '얼음바늘',
        'Frigid Water': '얼음서리',
        'Frigid Eruption': '얼음 분출',
        'Driving/Biting Frost': '서리 일격/참격',
        'Double Slap': '이중 타격',
        'Shining Armor': '빛의 갑옷',
        'Axe/Scythe Kick': '도끼차기/낫차기',
        'Light Rampant': '빛의 폭주',
        'Bright Hunger': '침식광',
        'The Path Of Light': '빛의 파동',
        'Scythe/Axe Kick': '낫차기/도끼차기',
        'Reflected Kick \\(G\\)': '반사된 낫/도끼차기 (초록)',
        'Banish III': '배니시가',
        'Shattered World': '분단된 세계',
        'Heart Asunder': '조각난 마음',
        'Rush': '부딪기',
        'Skyfall': '세계 소멸',
        'Akh Morn': '아크 몬',
        'Morn Afah': '몬 아파',
        'Hallowed Wings': '신성한 날개',
        'Reflected Wings \\(B\\)': '반사된 신성한 날개 (파랑)',
        'Reflected Wings \\(G\\)': '반사된 신성한 날개 (초록)',
        'Reflected Wings \\(R\\)': '반사된 신성한 날개 (빨강)',
        'Wyrm\'s Lament': '성룡의 포효',
        '(?<! )Frost Armor': '서리 갑옷',
        'Twin Silence/Stillness': '고요/정적의 쌍검기',
        'Twin Stillness/Silence': '정적/고요의 쌍검기',
        'Drachen Armor': '용의 갑옷',
        'Akh Rhai': '아크 라이',
        'Reflected Armor \\(B\\)': '반사된 빛의 갑옷 (파랑)',
        'Reflected Armor \\(G\\)': '반사된 빛의 갑옷 (초록)',
        'Reflected Armor \\(R\\)': '반사된 빛의 갑옷 (빨강)',
        'Holy': '홀리',
        'Embittered/Spiteful Dance': '준엄/냉엄의 무도기',
        'Spiteful/Embittered Dance': '냉엄/준엄의 무도기',
        'Reflected Drachen': '반사된 용의 갑옷',
        'Icelit Dragonsong': '얼음과 빛의 용시',
        'Draconic Strike': '용의 일격',
        'Banish(?! )': '배니시',
        'Inescapable Illumination': '폭로광',
        'The House Of Light': '빛의 해일',
        'Reflected Frost Armor \\(R\\)': '반사된 서리 갑옷 (빨강)',
      },
    },
  ],
};

export default triggerSet;
