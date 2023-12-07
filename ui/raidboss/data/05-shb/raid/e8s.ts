import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { ConfigValue } from '../../../../../resources/user_config';
import Util from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Mirror Mirror 5
// TODO: Icelit Dragonsong callouts
// TODO: Wyrm's Lament 2, maybe print who your partner is for BLU

// Note: for BLU, there's not much you can do for Diamond Frost.
// The people who get flares are not necessarily the people with the Freezing debuff.
// The people who drop puddles can be anybody. For non-BLU, we could call out
// who has puddles or not or who is going to get flares, but not for BLU.

export type ConfigIds = 'uptimeKnockbackStrat';

export type MirrorColor = 'blue' | 'red' | 'green';
export type MirrorLoc = 'dirN' | 'dirNE' | 'dirE' | 'dirSE' | 'dirS' | 'dirSW' | 'dirW' | 'dirNW';
export type MirrorInfo = { color: MirrorColor; location: MirrorLoc };

const mirrorFlags: { [flags: string]: MirrorColor } = {
  '00020001': 'blue',
  '00200010': 'green',
  '02000100': 'red',
} as const;

const mirrorLocs: { [loc: string]: MirrorLoc } = {
  // Mirror Mirror 1 + 2
  '03': 'dirN',
  '05': 'dirE',
  '07': 'dirS',
  '09': 'dirW',
  // unsure on these
  '04': 'dirNE',
  '06': 'dirSE',
  '08': 'dirSW',
  '0A': 'dirNW',

  // Mirror Mirror 3 + 4
  '0B': 'dirN',
  '0D': 'dirE',
  '0F': 'dirS',
  '11': 'dirW',
  // unsure on these
  '0C': 'dirNE',
  '0E': 'dirSE',
  '10': 'dirSW',
  '12': 'dirNW',
} as const;

type MirrorThreeDir = 'dirNW' | 'dirNE' | 'dirSW' | 'dirSE';

export interface Data extends RaidbossData {
  triggerSetConfig: { [key in ConfigIds]: ConfigValue };
  combatantData: PluginCombatantState[];
  lightsteepedCount: { [name: string]: number };
  mirrorMirrorCount: number;
  mirrors: MirrorInfo[];
  mirrorMap: { [loc in MirrorLoc]?: MirrorColor };
  firstFrost?: 'biting' | 'driving';
  firstKick?: 'scythe' | 'axe';
  diamondFrostFreezeTargets: string[];
  diamondFrostStars: string[];
  calledIcicleImpact?: boolean;
  pathOfLightCounter: number;
  asunderSide?: 'east' | 'west';
  asunderCount: number;
  rushCount: number;
  akhMornTargets: string[];
  wyrmsLament: number;
  wyrmclawNumber?: number;
  wyrmfangNumber?: number;
  wyrmsLamentMirrorCount: number;
  mirrorThreeDirs: MirrorThreeDir[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'EdensVerseRefulgenceSavage',
  zoneId: ZoneId.EdensVerseRefulgenceSavage,
  config: [
    {
      id: 'uptimeKnockbackStrat',
      name: {
        en: 'Enable uptime knockback strat',
        de: 'Aktiviere Uptime Rückstoß Strategie',
        fr: 'e8s : activer cactbot pour la strat Uptime Knockback', // FIXME
        ja: 'エデン零式共鳴編４層：cactbot「ヘヴンリーストライク (ノックバック)」ギミック', // FIXME
        cn: '启用 cactbot 精确计时防击退策略',
        ko: '정확한 타이밍 넉백방지 공략 사용',
      },
      comment: {
        en: `If you want cactbot to callout Mirror Mirror 4's double knockback, enable this option.
             Callout happens during/after boss turns and requires <1.4s reaction time
             to avoid both Green and Read Mirror knockbacks.
             Example: https://clips.twitch.tv/CreativeDreamyAsparagusKlappa
             Group splits into two groups behind boss after the jump.
             Tanks adjust to where the Red and Green Mirror are located.
             One tank must be inbetween the party, the other closest to Greem Mirror.
             Once Green Mirror goes off, the tanks adjust for Red Mirror.`,
      },
      type: 'checkbox',
      default: (options) => {
        const oldSetting = options['cactbote8sUptimeKnockbackStrat'];
        return typeof oldSetting === 'boolean' ? oldSetting : false;
      },
    },
  ],
  timelineFile: 'e8s.txt',
  initData: () => {
    return {
      combatantData: [],
      lightsteepedCount: {},
      mirrorMirrorCount: 0,
      mirrors: [],
      mirrorMap: {},
      diamondFrostFreezeTargets: [],
      diamondFrostStars: [],
      pathOfLightCounter: 0,
      bonusLightSteeped: {},
      asunderCount: 0,
      rushCount: 0,
      akhMornTargets: [],
      wyrmsLament: 0,
      wyrmsLamentMirrorCount: 0,
      mirrorThreeDirs: [],
    };
  },
  timelineTriggers: [
    {
      id: 'E8S Shining Armor',
      regex: /(?<!Reflected )Shining Armor/,
      beforeSeconds: 2,
      suppressSeconds: 15,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'E8S Reflected Armor',
      regex: /Reflected Armor/,
      beforeSeconds: 2,
      suppressSeconds: 15,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'E8S Frost Armor',
      // Not the reflected one, as we want the "move" call there
      // which will happen naturally from `Reflected Drachen Armor`.
      regex: /^Frost Armor$/,
      beforeSeconds: 2,
      suppressSeconds: 15,
      response: Responses.stopMoving('alert'),
    },
    {
      id: 'E8S Rush',
      regex: /Rush \d/,
      beforeSeconds: 5,
      suppressSeconds: 15,
      infoText: (data, _matches, output) => {
        data.rushCount = data.rushCount + 1;
        return output.text!({ num: data.rushCount });
      },
      outputStrings: {
        text: {
          en: 'Tether ${num}',
          de: 'Verbindung ${num}',
          fr: 'Lien ${num}',
          ja: '線 ${num}',
          cn: '和${num}连线',
          ko: '선: ${num}',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'E8S Lightsteeped Gain Tracker',
      type: 'GainsEffect',
      netRegex: { effectId: '8D1' },
      run: (data, matches) => data.lightsteepedCount[matches.target] = parseInt(matches.count),
    },
    {
      id: 'E8S Lightsteeped Lose Tracker',
      type: 'LosesEffect',
      netRegex: { effectId: '8D1' },
      run: (data, matches) => data.lightsteepedCount[matches.target] = 0,
    },
    {
      id: 'E8S Absolute Zero',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4DCC', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'E8S Mirror Mirror',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D5A', capture: false },
      infoText: (data, _matches, output) => {
        data.mirrorMirrorCount++;
        data.mirrors = [];
        data.mirrorMap = {};

        if (data.mirrorMirrorCount === 2) {
          if (data.firstKick === 'axe')
            return output.scytheNext!();
          if (data.firstKick === 'scythe')
            return output.axeNext!();
        }
      },
      outputStrings: {
        scytheNext: {
          en: '(under boss => under mirrors soon)',
          ja: '(ボスの下 => まもなく鏡の下)',
          ko: '(보스 밑 🔜 곧 거울 아래)',
        },
        axeNext: {
          en: '(out => middle soon)',
          ja: '(外 => まもなく真ん中)',
          ko: '(밖에서 => 곧 한가운데로)',
        },
      },
    },
    {
      id: 'E8S Mirror Collect',
      type: 'MapEffect',
      netRegex: { flags: Object.keys(mirrorFlags), location: Object.keys(mirrorLocs) },
      run: (data, matches) => {
        const color = mirrorFlags[matches.flags];
        const location = mirrorLocs[matches.location];
        if (color === undefined || location === undefined)
          return;
        data.mirrors.push({ color, location });
        data.mirrorMap[location] = color;
      },
    },
    {
      id: 'E8S Biting Frost First Mirror',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D66', capture: false },
      condition: (data) => data.firstFrost === undefined,
      alertText: (data, _matches, output) => {
        if (data.mirrorMap['dirW'] === 'red')
          return output.redMirrorWest!();
        if (data.mirrorMap['dirE'] === 'red')
          return output.redMirrorEast!();
        return output.getBehind!();
      },
      outputStrings: {
        redMirrorWest: {
          en: 'Behind => SW',
          ja: '後ろ => 南西',
          ko: '뒤에 있다 🔜 🡿남서쪽으로',
        },
        redMirrorEast: {
          en: 'Behind => SE',
          ja: '後ろ => 南東',
          ko: '뒤에 있다 🔜 남동쪽으로🡾',
        },
        getBehind: Outputs.getBehind,
      },
    },
    {
      id: 'E8S Driving Frost First Mirror',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D67', capture: false },
      condition: (data) => data.firstFrost === undefined,
      alertText: (data, _matches, output) => {
        if (data.mirrorMap['dirE'] === 'red')
          return output.redMirrorEast!();
        if (data.mirrorMap['dirW'] === 'red')
          return output.redMirrorWest!();
        return output.goFront!();
      },
      outputStrings: {
        redMirrorEast: {
          en: 'Front => NW',
          ja: '前 => 北西',
          ko: '앞에 있다 🔜 🡼북서쪽으로',
        },
        redMirrorWest: {
          en: 'Front => NE',
          ja: '前 => 北東',
          ko: '앞에 있다 🔜 북동쪽으로🡽',
        },
        goFront: Outputs.goFront,
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
          en: 'Swap Sides',
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
      alertText: (data, _matches, output) => {
        // The first one is part of Mirror Mirror 1.
        if (data.firstFrost !== undefined)
          return output.getBehind!();
      },
      run: (data) => data.firstFrost ??= 'biting',
      outputStrings: {
        getBehind: Outputs.getBehind,
      },
    },
    {
      id: 'E8S Driving Frost',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D67', capture: false },
      alertText: (data, _matches, output) => {
        // The first one is part of Mirror Mirror 1.
        if (data.firstFrost !== undefined)
          return output.goFront!();
      },
      run: (data) => data.firstFrost ??= 'driving',
      outputStrings: {
        goFront: Outputs.goFront,
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
          en: 'Biting Next (face outward)',
          de: 'Frosthieb als nächstes', // FIXME
          fr: 'Taillade de givre bientôt', // FIXME
          ja: '次はフロストスラッシュ', // FIXME
          cn: '下次攻击前侧面', // FIXME
          ko: '다음: 서리 참격', // FIXME
        },
        drivingFrostNext: {
          en: 'Driving Next (face inward)',
          de: 'Froststoß als nächstes', // FIXME
          fr: 'Percée de givre bientôt', // FIXME
          ja: '次はフロストスラスト', // FIXME
          cn: '下次攻击后面', // FIXME
          ko: '다음: 서리 일격', // FIXME
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
      id: 'E8S Diamond Frost Freezing',
      type: 'GainsEffect',
      netRegex: { effectId: '8CB' },
      condition: (data, matches) => {
        // Ignore Icelit Dragonsong.
        if (data.mirrorMirrorCount !== 1)
          return false;
        data.diamondFrostFreezeTargets.push(matches.target);
        return data.diamondFrostFreezeTargets.length === 2;
      },
      infoText: (data, _matches, output) => {
        if (!Util.canCleanse(data.job))
          return;
        const players = data.diamondFrostFreezeTargets.sort().map((x) => data.party.member(x));
        return output.cleanse!({ players: players });
      },
      outputStrings: {
        cleanse: {
          en: 'Cleanse: ${players}',
          ja: 'エスナ: ${players}',
          ko: '에스나: ${players}',
        },
      },
    },
    {
      id: 'E8S Diamond Frost Frigid Needle Star',
      type: 'HeadMarker',
      netRegex: { id: '0060' },
      condition: (data, matches) => data.mirrorMirrorCount === 1 && matches.target === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Star on YOU',
          ja: '自分に星が！',
          ko: '내게 별이!',
        },
      },
    },
    {
      id: 'E8S Icicle Impact',
      type: 'StartsUsingExtra',
      netRegex: { id: '4DA0' },
      condition: (data) => !data.calledIcicleImpact,
      durationSeconds: 6,
      suppressSeconds: 20,
      infoText: (_data, matches, output) => {
        const x = parseFloat(matches.x);
        if (x >= 99 && x <= 101)
          return output.northSouth!();
        return output.eastWest!();
      },
      run: (data) => data.calledIcicleImpact = true,
      outputStrings: {
        northSouth: {
          en: 'North / South',
          de: 'Norden / Süden',
          fr: 'Nord / Sud',
          ja: '南 / 北',
          cn: '南北站位',
          ko: '남 / 북',
        },
        eastWest: {
          en: 'East / West',
          de: 'Osten / Westen',
          fr: 'Est / Ouest',
          ja: '東 / 西',
          cn: '东西站位',
          ko: '동 / 서',
        },
      },
    },
    {
      id: 'E8S Icicle Impact Backup',
      type: 'Ability',
      // In case the OP 263/0x107 lines are missing, here's a late backup based on
      // when the first circles go off.
      netRegex: { source: 'Shiva', id: '4DA0' },
      condition: (data) => !data.calledIcicleImpact,
      suppressSeconds: 20,
      infoText: (_data, matches, output) => {
        const x = parseFloat(matches.x);
        if (x >= 99 && x <= 101)
          return output.northSouth!();
        return output.eastWest!();
      },
      run: (data) => data.calledIcicleImpact = true,
      outputStrings: {
        northSouth: {
          en: 'North / South',
          de: 'Norden / Süden',
          fr: 'Nord / Sud',
          ja: '南 / 北',
          cn: '南北站位',
          ko: '남 / 북',
        },
        eastWest: {
          en: 'East / West',
          de: 'Osten / Westen',
          fr: 'Est / Ouest',
          ja: '東 / 西',
          cn: '东西站位',
          ko: '동 / 서',
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
      alertText: (data, _matches, output) => {
        if (data.firstKick !== undefined) {
          return output.outThenMiddle!();
        }
        data.firstKick = 'axe';
        return output.out!();
      },
      outputStrings: {
        outThenMiddle: {
          en: 'Out => Middle',
          ja: '外 => 真ん中',
          ko: '밖에 있다 🔜 한가운데로',
        },
        out: Outputs.out,
      },
    },
    {
      id: 'E8S Scythe Kick',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D6E', capture: false },
      alertText: (data, _matches, output) => {
        if (data.firstKick !== undefined) {
          if (data.mirrorMap['dirN'] === 'green')
            return output.getUnderCards!();
          if (data.mirrorMap['dirNE'] === 'green')
            return output.getUnderIntercards!();
          return output.getUnderUnknown!();
        }
        data.firstKick = 'scythe';
        return output.getUnder!();
      },
      outputStrings: {
        getUnderCards: {
          en: 'Under => Under Cardinal Mirrors',
          ja: 'ボスの下 => 十字の鏡の下',
          ko: '보스 밑 🔜 ➕거울 밑으로',
        },
        getUnderIntercards: {
          en: 'Under => Under Intercard Mirrors',
          ja: 'ボスの下 => 斜め鏡の下',
          ko: '보스 밑 🔜 ❌거울 밑으로',
        },
        getUnderUnknown: {
          en: 'Under Boss => Under Mirrors',
          ja: 'ボスの下 => 鏡の下',
          ko: '보스 밑 🔜 거울 밑으로',
        },
        getUnder: Outputs.getUnder,
      },
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
          en: 'Chain on YOU',
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
          en: 'Orb on YOU',
          de: 'Orb auf DIR',
          fr: 'Orbe sur VOUS',
          ja: '自分に玉',
          cn: '拉球点名',
          ko: '구슬 대상자',
        },
      },
    },
    {
      id: 'E8S Path of Light Counter',
      type: 'Ability',
      // 4D63 = self-targeted path of light ability
      netRegex: { source: 'Shiva', id: '4D63', capture: false },
      run: (data) => data.pathOfLightCounter++,
    },
    {
      id: 'E8S Light Rampant Final Tower',
      type: 'GainsEffect',
      // Wait until lightsteeped has been collected after the final path of light.
      netRegex: { effectId: '8D1', capture: false },
      condition: (data) => data.pathOfLightCounter === 2,
      delaySeconds: 0.5,
      suppressSeconds: 9999999,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          getFinalTower: {
            en: 'Get Final Tower',
            ja: '最後の塔踏み',
            ko: '마지막 타워 밟아요',
          },
          avoidFinalTower: {
            en: 'Avoid Final Tower',
            ja: '最後の塔回避',
            ko: '마지막 타워 피해요',
          },
        };

        const light = data.lightsteepedCount[data.me];
        if (light !== undefined && light >= 4)
          return { infoText: output.avoidFinalTower!() };
        return { alertText: output.getFinalTower!() };
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
      id: 'E8S Heart Asunder Side Tracker',
      type: 'Ability',
      netRegex: { id: '4DAC', source: 'MotherCrystal' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 999999,
      run: (data, matches) => {
        // The two sides are at roughly x=~70 and x=~130.
        const x = parseFloat(matches.x);
        data.asunderSide ??= x > 100 ? 'east' : 'west';
      },
    },
    {
      id: 'E8S Aqueous Aether',
      type: 'Ability',
      // On 4DAC Heart Asunder; both sides have Aqueuous on 1 + 3
      netRegex: { id: '4DAC', source: 'MotherCrystal', capture: false },
      preRun: (data) => data.asunderCount++,
      suppressSeconds: 5,
      alertText: (data, _matches, output) => {
        if (!Util.canStun(data.job))
          return;
        if (data.asunderCount === 1 || data.asunderCount === 3)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Stun Aqueous Aether',
          ja: 'ウォーターにスタン',
          ko: '스턴: 워터(아쿠에오스)',
        },
      },
    },
    {
      id: 'E8S Earthen Aether Stoneskin',
      type: 'StartsUsing',
      netRegex: { source: 'Earthen Aether', id: '4D85' },
      condition: (data, matches) => {
        if (!Util.canSilence(data.job))
          return false;
        const x = parseFloat(matches.x);
        const side = x > 100 ? 'east' : 'west';
        return side === data.asunderSide;
      },
      response: Responses.interrupt(),
    },
    {
      id: 'E8S Akh Morn',
      type: 'StartsUsing',
      netRegex: { source: ['Shiva', 'Great Wyrm'], id: ['4D98', '4D79'] },
      preRun: (data, matches) => {
        data.akhMornTargets.push(matches.target);
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          akhMornOnYou: {
            en: 'Akh Morn on YOU',
            de: 'Akh Morn auf DIR',
            fr: 'Akh Morn sur VOUS',
            ja: '自分にアク・モーン',
            cn: '死亡轮回点名',
            ko: '아크몬 대상자',
          },
          akhMornOn: {
            en: 'Akh Morn: ${players}',
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
        if (data.akhMornTargets.length !== 2)
          return;
        if (data.akhMornTargets.includes(data.me))
          return;
        const players = data.akhMornTargets.map((x) => data.party.member(x));
        return { infoText: output.akhMornOn!({ players: players }) };
      },
    },
    {
      id: 'E8S Akh Morn Cleanup',
      type: 'StartsUsing',
      netRegex: { source: ['Shiva', 'Great Wyrm'], id: ['4D98', '4D79'], capture: false },
      delaySeconds: 15,
      run: (data) => data.akhMornTargets = [],
    },
    {
      id: 'E8S Morn Afah',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7B' },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.mornAfahOnYou!();

        return output.mornAfahOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        mornAfahOnYou: {
          en: 'Morn Afah on YOU',
          de: 'Morn Afah auf DIR',
          fr: 'Morn Afah sur VOUS',
          ja: '自分にモーン・アファー',
          cn: '无尽顿悟点名',
          ko: '몬아파 대상자',
        },
        mornAfahOn: {
          en: 'Morn Afah on ${player}',
          de: 'Morn Afah auf ${player}',
          fr: 'Morn Afah sur ${player}',
          ja: '${player}にモーン・アファー',
          cn: '无尽顿悟点 ${player}',
          ko: '"${player}" 몬 아파',
        },
      },
    },
    {
      id: 'E8S Mirror Mirror 3 Directions',
      comment: {
        en: `Fast means you can go from the 1st to the 3rd safe spot directly.
             Slow means you need to go 1 => 2 => 3 without skipping 2.
             This is for casters who may not want to move as much.`,
      },
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: ['4D75', '4D76'] },
      condition: (data) => data.wyrmsLament === 0,
      // She teleports to face north, then turns when she starts the cast.
      delaySeconds: 0.5,
      durationSeconds: 10,
      suppressSeconds: 15,
      promise: async (data, matches) => {
        data.combatantData = [];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
      },
      // sound: '',
      infoText: (data, matches, output) => {
        const isLeftCleave = matches.id === '4D75';
        const [shiva] = data.combatantData;
        if (shiva === undefined || data.combatantData.length !== 1)
          return;

        // north = pi or -pi, and anywhere else consider her turned/turning south
        const isFacingNorth = Math.abs(shiva.Heading) > 3;

        // There are three mirrors. Green is north. Blue/Red are east/west.
        // The order the mirrors go off is Shiva Cleave 1 + Blue -> Green -> Shiva Cleave 2 + Red.
        // If the Blue mirror is west, we are rotating clockwise.
        const isClockwise = data.mirrorMap['dirW'] === 'blue';

        const isFirstSafeWest = isFacingNorth && !isLeftCleave || !isFacingNorth && isLeftCleave;
        const isFirstSafeNorth = isClockwise && !isLeftCleave || !isClockwise && isLeftCleave;

        const dirClock: readonly MirrorThreeDir[] = ['dirNW', 'dirNE', 'dirSE', 'dirSW'] as const;
        const dir1 = isFirstSafeNorth
          ? (isFirstSafeWest ? 'dirNW' : 'dirNE')
          : (isFirstSafeWest ? 'dirSW' : 'dirSE');

        // Find next two directions by rotating.
        const rotAdjust = isClockwise ? 1 : -1;
        const idx1 = dirClock.indexOf(dir1);
        const idx2 = (idx1 + rotAdjust + 4) % 4;
        const idx3 = (idx2 + rotAdjust + 4) % 4;
        const dir2 = dirClock[idx2];
        const dir3 = dirClock[idx3];

        if (dir2 === undefined || dir3 === undefined)
          return;

        data.mirrorThreeDirs = [dir1, dir2, dir3];

        const isFast = dir1 === 'dirNW' && isClockwise || dir1 === 'dirNE' && !isClockwise ||
          dir1 === 'dirSE' && isClockwise || dir1 === 'dirSW' && !isClockwise;
        const params = { dir1: output[dir1]!(), dir2: output[dir2]!(), dir3: output[dir3]!() };
        return isFast ? output.fastText!(params) : output.slowText!(params);
      },
      outputStrings: {
        slowText: {
          en: '${dir1} => ${dir2} => ${dir3} (slow)',
          ja: '${dir1} => ${dir2} => ${dir3} (遅)',
          ko: '${dir1} => ${dir2} => ${dir3} (느린)',
        },
        fastText: {
          en: '${dir1} => ${dir2} => ${dir3} (fast)',
          ja: '${dir1} => ${dir2} => ${dir3} (早)',
          ko: '${dir1} => ${dir2} => ${dir3} (빠른)',
        },
        dirNW: Outputs.dirNW,
        dirNE: Outputs.dirNE,
        dirSE: Outputs.dirSE,
        dirSW: Outputs.dirSW,
      },
    },
    {
      id: 'E8S Mirror Mirror 3 Dir 1',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: ['4D75', '4D76'] },
      condition: (data) => data.wyrmsLament === 0,
      // TODO: this is maybe one case where having one trigger cause two outputs would be helpful
      // as this can't be a response as you want different durations on the initial alert and
      // the infotext that stays up.
      delaySeconds: 0.6,
      suppressSeconds: 15,
      alertText: (data, matches, output) => {
        const dir = data.mirrorThreeDirs.shift();
        if (dir === undefined) {
          const isLeftCleave = matches.id === '4D75';
          return isLeftCleave ? output.right!() : output.left!();
        }
        return output[dir]!();
      },
      outputStrings: {
        dirNW: Outputs.dirNW,
        dirNE: Outputs.dirNE,
        dirSE: Outputs.dirSE,
        dirSW: Outputs.dirSW,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'E8S Mirror Mirror 3 Dir 2',
      type: 'Ability',
      netRegex: { source: 'Frozen Mirror', id: ['4D90', '4D91'], capture: false },
      condition: (data) => data.wyrmsLament === 0,
      alertText: (data, _matches, output) => {
        const dir = data.mirrorThreeDirs.shift();
        if (dir === undefined)
          return;
        return output[dir]!();
      },
      outputStrings: {
        dirNW: Outputs.dirNW,
        dirNE: Outputs.dirNE,
        dirSE: Outputs.dirSE,
        dirSW: Outputs.dirSW,
      },
    },
    {
      id: 'E8S Mirror Mirror 3 Dir 3',
      type: 'Ability',
      netRegex: { source: 'Frozen Mirror', id: ['4DBB', '4DBC'], capture: false },
      condition: (data) => data.wyrmsLament === 0,
      alertText: (data, _matches, output) => {
        const dir = data.mirrorThreeDirs.shift();
        if (dir === undefined)
          return;
        return output[dir]!();
      },
      outputStrings: {
        dirNW: Outputs.dirNW,
        dirNE: Outputs.dirNE,
        dirSE: Outputs.dirSE,
        dirSW: Outputs.dirSW,
      },
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
      run: (data) => data.wyrmsLament++,
    },
    {
      id: 'E8S Wyrm\'s Lament Mirror',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: ['4D75', '4D76'] },
      condition: (data) => data.wyrmsLament === 1,
      infoText: (_data, matches, output) => {
        const isLeftCleave = matches.id === '4D75';
        return isLeftCleave ? output.right!() : output.left!();
      },
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
      },
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
          en: 'Red #${num}',
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
          en: 'Blue #${num}',
          de: 'Blau #${num}',
          fr: 'Bleu #${num}',
          ja: '青 #${num}',
          cn: '蓝色 #${num}',
          ko: '파랑 ${num}번',
        },
      },
    },
    {
      id: 'E8S Wyrm\'s Lament Buff Reminder',
      type: 'Ability',
      netRegex: { source: 'Shiva', id: ['4D75', '4D76'], targetIndex: '0', capture: false },
      condition: (data) => data.wyrmsLament === 1,
      preRun: (data) => data.wyrmsLamentMirrorCount++,
      alertText: (data, _matches, output) => {
        console.log(data.wyrmsLamentMirrorCount);
        if (data.wyrmclawNumber === data.wyrmsLamentMirrorCount + 1)
          return output.redDragonHead!({ num: data.wyrmclawNumber });
        if (data.wyrmfangNumber === data.wyrmsLamentMirrorCount)
          return output.bluePuddle!({ num: data.wyrmfangNumber });
      },
      outputStrings: {
        redDragonHead: {
          en: 'Pop Head #${num}',
          ja: '${num}番目の竜の頭',
          ko: '용머리: ${num}번째',
        },
        bluePuddle: {
          en: 'Get Puddle #${num}',
          ja: '${num}番目の踏み',
          ko: '줍줍: ${num}번째',
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
      condition: (data) => Util.canCleanse(data.job),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.job === 'BLU')
          return output.bluCleanse!();
        return output.cleanseOnlyDPS!();
      },
      outputStrings: {
        cleanseOnlyDPS: {
          en: 'Cleanse DPS Only',
          de: 'Nur DPS reinigen',
          fr: 'Guérison => DPS seulement',
          ja: 'エスナ (DPSのみ)',
          cn: '驱散DPS',
          ko: '딜러만 에스나',
        },
        bluCleanse: {
          en: 'Exuviation',
          ja: 'エスナ',
          ko: '에스나',
        },
      },
    },
    {
      id: 'E8S Banish',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D7E', capture: false },
      condition: (data) => data.role === 'tank',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tank Stack in Tower',
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
      condition: (data) => data.role === 'tank',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tank Spread in Tower',
          de: 'Tank im Turm verteilen',
          fr: 'Dispersion tanks dans la tour',
          ja: 'タンクは塔に散開',
          cn: '坦克塔内分散',
          ko: '탱커 산개',
        },
      },
    },
    {
      id: 'E8S The House of Light',
      type: 'StartsUsing',
      netRegex: { source: 'Shiva', id: '4D64', capture: false },
      alertText: (data, _matches, output) => {
        const light = data.lightsteepedCount[data.me];
        if (light !== undefined && light >= 4)
          return output.proteanAvoidFinalTower!();
        return output.proteanGetFinalTower!();
      },
      outputStrings: {
        proteanGetFinalTower: {
          en: 'Protean => Get Final Tower',
          ja: '散会 => 最後の塔踏み',
          ko: '프로틴 🔜 마지막 타워 밟아요',
        },
        proteanAvoidFinalTower: {
          en: 'Protean => Avoid Final Tower',
          ja: '散会 => 最後の塔回避',
          ko: '프로틴 🔜 마지막 타워 피해욧',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'missingTranslations': true,
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
      'missingTranslations': true,
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
      'missingTranslations': true,
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
      'missingTranslations': true,
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
      'missingTranslations': true,
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
