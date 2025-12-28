import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  dragonBreathFacingNumber?: number;
  cleaves: string[];
  burning?: 'battle' | 'keep';
}

const prishePunchDelays: string[] = [
  '9FE8',
  '9FF6',
];

const triggerSet: TriggerSet<Data> = {
  id: 'Jeuno: The First Walk',
  zoneId: ZoneId.JeunoTheFirstWalk,
  timelineFile: 'jeuno-first-walk.txt',
  initData: () => {
    return {
      cleaves: [],
    };
  },
  triggers: [
    {
      id: 'Jeuno First Walk Prishe Banishga',
      type: 'StartsUsing',
      netRegex: { id: '9FE7', source: 'Prishe Of The Distant Chains', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Prishe Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: {
        id: ['9FE8', '9FE9', '9FEA'],
        source: 'Prishe Of The Distant Chains',
        capture: true,
      },
      // The player is intended to count the number of "wait for it" emotes from Prishe.
      // Delay to match how many she would call per ability.
      // (It's not necessary to delay past 6 seconds,
      // as at that point the player knows it's 2/3 emotes)

      // 9FE8: Inner circle, 1x emote
      // 9FE9: Mid circle, 2x emote
      // 9FEA: Big circle, 3x emote, but its delay is the same as
      delaySeconds: (_data, matches) => {
        const delay = prishePunchDelays.includes(matches.id) ? 4 : 6;
        return delay;
      },
      durationSeconds: (_data, matches) => {
        // The total cast time is 11.7 seconds
        const duration = prishePunchDelays.includes(matches.id) ? 7.7 : 5.7;
        return duration;
      },
      infoText: (_data, matches, output) => {
        if (matches.id === '9FE8')
          return output.smallCircle!();
        if (matches.id === '9FE9')
          return output.midCircle!();
        if (matches.id === '9FEA')
          return output.bigCircle!();
        return output.unknownCircle!();
      },
      outputStrings: {
        smallCircle: {
          en: 'Outside small circle => in',
          ja: '円内側 外から中',
          ko: '한 칸짜리 펀치',
        },
        midCircle: {
          en: 'Outside mid circle => in',
          ja: '円真ん中 外から中',
          ko: '두 칸짜리 펀치',
        },
        bigCircle: {
          en: 'Outside big circle => in',
          ja: '円外側 外から中',
          ko: '세 칸짜리 펀치',
        },
        unknownCircle: Outputs.unknown,
      },
    },
    {
      id: 'Jeuno First Walk Prishe Nullifying Dropkick',
      type: 'HeadMarker',
      netRegex: { id: '023A', capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'Jeuno First Walk Prishe Banish Storm',
      type: 'Ability', // This resolves before the AoEs even appear
      netRegex: { id: '9FF2', source: 'Prishe Of The Distant Chains', capture: false },
      alertText: (_data, _matches, output) => output.avoidCircles!(),
      outputStrings: {
        avoidCircles: {
          en: 'Avoid radiating circles',
          ja: '放射矢印をよける',
          ko: '퍼지는 동글이 피해요',
        },
      },
    },
    {
      id: 'Jeuno First Walk Prishe Holy',
      type: 'HeadMarker',
      netRegex: { id: '00D7', capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Jeuno First Walk Prishe Auroral Uppercut',
      type: 'StartsUsing',
      netRegex: {
        id: ['9FF6', '9FF7', '9FF8'],
        source: 'Prishe Of The Distant Chains',
        capture: true,
      },
      // The player is intended to count the number of "wait for it" emotes from Prishe.
      // Delay to match how many she would call per ability.
      // (It's not necessary to delay past 6 seconds,
      // as at that point the player knows it's 2/3 emotes)

      // 9FF6: Short knockback, 1x emote
      // 9FF7: Mid knockback, 2x emote
      // 9FF8: Big knockback, 3x emote
      delaySeconds: (_data, matches) => {
        const delay = prishePunchDelays.includes(matches.id) ? 4 : 6;
        return delay;
      },
      durationSeconds: (_data, matches) => {
        // The total cast time is 11.7 seconds
        const duration = prishePunchDelays.includes(matches.id) ? 7.7 : 5.7;
        return duration;
      },
      infoText: (_data, matches, output) => {
        if (matches.id === '9FF6')
          return output.shortKnockback!();
        if (matches.id === '9FF7')
          return output.midKnockback!();
        if (matches.id === '9FF8')
          return output.bigKnockback!();
        return output.unknownKnockback!();
      },
      outputStrings: {
        shortKnockback: {
          en: 'Knockback (short)',
          ja: '近い ノックバック',
          ko: '한 칸짜리 넉백',
        },
        midKnockback: {
          en: 'Knockback (mid)',
          ja: '真ん中 ノックバック',
          ko: '두 칸짜리 넉백',
        },
        bigKnockback: {
          en: 'Knockback (big)',
          ja: '遠い ノックバック',
          ko: '세 칸짜리 넉백',
        },
        unknownKnockback: Outputs.unknown,
      },
    },
    {
      id: 'Jeuno First Walk Prishe Banishga IV',
      type: 'StartsUsing',
      netRegex: { id: '9FFA', source: 'Prishe Of The Distant Chains', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Prishe Banishga IV Orbs',
      type: 'Ability',
      netRegex: { id: '9FFA', source: 'Prishe Of The Distant Chains', capture: false },
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.avoidOrbs!(),
      outputStrings: {
        avoidOrbs: {
          en: 'Avoid exploding orbs',
          ja: '爆発する玉をよける',
          ko: '폭파 동글이 피해요',
        },
      },
    },
    {
      // This is self-targeted and the stack point is a tower in the center.
      id: 'Jeuno First Walk Prishe Asuran Fists',
      type: 'StartsUsing',
      netRegex: { id: '9FFC', source: 'Prishe Of The Distant Chains', capture: false },
      durationSeconds: 6,
      response: Responses.stackMarker(),
    },
    {
      id: 'Jeuno First Walk Aquarius Hundred Fists',
      type: 'StartsUsing',
      netRegex: { id: '9EC8', source: 'Aquarius', capture: true },
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'Jeuno First Walk Fafnir Dark Matter Blast',
      type: 'StartsUsing',
      netRegex: { id: '9F96', source: 'Fafnir The Forgotten', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Fafnir Spike Flail',
      type: 'StartsUsing',
      netRegex: { id: 'A09A', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 7,
      response: Responses.goFront(),
    },
    {
      // The cast used here is Offensive Posture.
      id: 'Jeuno First Walk Fafnir Dragon Breath Call',
      type: 'StartsUsing',
      netRegex: { id: '9F6E', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 7,
      response: Responses.getUnder(),
    },
    {
      // The cast used here is Offensive Posture.
      // Heading data can be stale on StartsUsing lines,
      // so store off the actual cast instead.
      id: 'Jeuno First Walk Fafnir Dragon Breath Store',
      type: 'Ability',
      netRegex: { id: '9F6E', source: 'Fafnir The Forgotten', capture: true },
      run: (data, matches) => {
        const headingNumber = Directions.hdgTo8DirNum(parseFloat(matches.heading));
        data.dragonBreathFacingNumber = headingNumber;
      },
    },
    {
      id: 'Jeuno First Walk Fafnir Touchdown',
      type: 'StartsUsing',
      netRegex: { id: 'A09C', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.dragonBreathFacingNumber !== undefined) {
          const dirOutputIndex = Directions.outputFrom8DirNum(data.dragonBreathFacingNumber);
          return output.outAtDirection!({ safeDir: output[dirOutputIndex]!() });
        }
        return output.getOut!();
      },
      outputStrings: {
        getOut: Outputs.out,
        outAtDirection: {
          en: 'Get out toward ${safeDir}',
          ja: '${safeDir} 安置',
          ko: '바깥으로: ${safeDir}',
        },
        dirN: Outputs.north,
        dirE: Outputs.east,
        dirS: Outputs.south,
        dirW: Outputs.west,
        dirNE: Outputs.dirNE,
        dirSE: Outputs.dirSE,
        dirSW: Outputs.dirSW,
        dirNW: Outputs.dirNW,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Jeuno First Walk Fafnir Baleful Breath',
      type: 'StartsUsing',
      netRegex: { id: '9BF2', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 7,
      response: Responses.stackMarker(),
    },
    {
      id: 'Jeuno First Walk Fafnir Sharp Spike Collect',
      type: 'HeadMarker',
      netRegex: { id: '0156', capture: true },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno First Walk Fafnir Sharp Spike Call',
      type: 'StartsUsing',
      netRegex: { id: '9F97', source: 'Fafnir The Forgotten', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 6.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleave: Outputs.tankCleaveOnYou,
          avoid: Outputs.avoidTankCleaves,
        };
        if (data.cleaves?.includes(data.me))
          return { alertText: output.cleave!() };
        return { infoText: output.avoid!() };
      },
      run: (data) => {
        data.cleaves = [];
        delete data.dragonBreathFacingNumber;
      },
    },
    {
      id: 'Jeuno First Walk Fafnir Horrid Roar Spread',
      type: 'HeadMarker',
      netRegex: { id: '01F3', capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Jeuno First Walk Fafnir Absolute Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8D', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 5,
      response: Responses.goSides(),
    },
    {
      id: 'Jeuno First Walk Fafnir Winged Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8F', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 5,
      response: Responses.goMiddle(),
    },
    {
      id: 'Jeuno First Walk Fafnir Hurricane Wing Raidwide',
      type: 'StartsUsing',
      netRegex: { id: '9F71', source: 'Fafnir The Forgotten', capture: false },
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.outerFirst!(),
      outputStrings: {
        outerFirst: {
          en: 'AoE x10',
          ja: 'AoE 10回',
          ko: '전체 공격 x10',
        },
      },
    },
    {
      id: 'Jeuno First Walk Sprinkler Mysterious Light',
      type: 'StartsUsing',
      netRegex: { id: 'A2C3', source: 'Sprinkler', capture: true },
      suppressSeconds: 1, // These can overlap, so make sure there's a bit of separation.
      response: Responses.lookAwayFromSource(),
    },
    {
      id: 'Jeuno First Walk Despot Scrapline Storm',
      type: 'StartsUsing',
      netRegex: { id: '9ECA', source: 'Despot', capture: false },
      response: Responses.getOutThenIn(),
    },
    {
      id: 'Jeuno First Walk Despot Panzerfaust',
      type: 'StartsUsing',
      netRegex: { id: 'A2E2', source: 'Despot', capture: true },
      response: Responses.interruptIfPossible(),
    },
    {
      // We could call this more easily with the Hero debuffs,
      // but those are delayed by about four seconds compared to the initial tethers.
      id: 'Jeuno First Walk Angels Decisive Battle',
      type: 'Tether',
      netRegex: { id: '012B', capture: true },
      condition: (data, matches) => {
        return matches.source === data.me || matches.target === data.me;
      },
      alertText: (_data, matches, output) => {
        if (matches.sourceId.startsWith('4'))
          return output.attackAngel!({ angel: matches.source });
        if (matches.targetId.startsWith('4'))
          return output.attackAngel!({ angel: matches.target });
        return output.unknownAngel!();
      },
      outputStrings: {
        attackAngel: {
          en: 'Attack ${angel}',
          ja: '${angel} を殴る',
          ko: '공격: ${angel}',
        },
        unknownAngel: {
          en: 'Attack angel with matching buff',
          ja: 'バフのついた敵を殴る',
          ko: '엔젤 공격!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Angels CloudSplitter Collect',
      type: 'HeadMarker',
      netRegex: { id: '01D0', capture: true },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno First Walk Angels CloudSplitter Call',
      type: 'StartsUsing',
      netRegex: { id: 'A076', source: 'Ark Angel MR', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleave: Outputs.tankCleaveOnYou,
          avoid: Outputs.avoidTankCleaves,
        };
        if (data.cleaves?.includes(data.me))
          return { alertText: output.cleave!() };
        return { infoText: output.avoid!() };
      },
      run: (data) => data.cleaves = [],
    },
    {
      id: 'Jeuno First Walk Angels Gekko',
      type: 'StartsUsing',
      netRegex: { id: 'A07A', source: 'Ark Angel GK', capture: true },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      response: Responses.lookAwayFromSource(),
    },
    {
      id: 'Jeuno First Walk Angels Meteor',
      type: 'StartsUsing',
      netRegex: { id: 'A08A', source: 'Ark Angel TT', capture: true },
      durationSeconds: 5,
      response: Responses.interruptIfPossible('alert'),
    },
    {
      id: 'Jeuno First Walk Spiral Finish',
      type: 'StartsUsing',
      netRegex: { id: 'A06C', source: 'Ark Angel MR', capture: false },
      delaySeconds: 5.5,
      response: Responses.knockback(),
    },
    {
      id: 'Jeuno First Walk Angels Dragonfall',
      type: 'StartsUsing',
      netRegex: { id: 'A07E', source: 'Ark Angel GK', capture: false },
      alertText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: Outputs.stacks,
      },
    },
    {
      id: 'Jeuno First Walk Angels Arrogance Incarnate',
      type: 'HeadMarker',
      netRegex: { id: '0131', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Jeuno First Walk Angels Guillotine',
      type: 'StartsUsing',
      netRegex: { id: 'A067', source: 'Ark Angel TT', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Behind TT',
          ja: 'Behind TT',
          ko: '기요틴! TT 뒤로!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Angels Dominion Slash',
      type: 'StartsUsing',
      netRegex: { id: 'A085', source: 'Ark Angel EV', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Angels Holy',
      type: 'StartsUsing',
      netRegex: { id: 'A089', source: 'Ark Angel EV', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Angels Proud Palisade',
      type: 'AddedCombatant',
      netRegex: { npcBaseId: '18260', capture: false }, // Ark Shield
      alertText: (_data, _matches, output) => output.killShield!(),
      outputStrings: {
        killShield: {
          en: 'Kill Ark Shield',
          ja: '盾持ちを殴る',
          ko: '방패 부셔요!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Angels Mijin Gakure',
      type: 'LosesEffect',
      netRegex: { effectId: '1140', capture: false }, // Uninterrupted
      condition: (data) => data.CanSilence(),
      alarmText: (_data, _matches, output) => output.interruptHM!(),
      outputStrings: {
        interruptHM: {
          en: 'Interrupt HM',
          ja: 'HMへ中断',
          ko: 'HM에게 인터럽트!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Angels Chasing Tether',
      type: 'Tether',
      netRegex: { id: '0125', capture: true },
      condition: (data, matches) => [matches.source, matches.target].includes(data.me),
      durationSeconds: 8,
      alertText: (_data, _matches, output) => output.runFromTether!(),
      outputStrings: {
        runFromTether: {
          en: 'Chasing tether -- run away!',
          ja: '線が付いた敵から逃げる',
          ko: '도망쳐요! 줄 달렸네!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Angels Critical Reaver',
      type: 'StartsUsing',
      netRegex: { id: 'A13B', source: 'Ark Angel HM', capture: true },
      durationSeconds: 5,
      response: Responses.interruptIfPossible('alert'),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Giga Slash',
      type: 'StartsUsing',
      netRegex: { id: ['9F3E', '9F3F'], source: 'Shadow Lord', capture: true },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F3E')
          return output.rightThenLeft!();
        return output.leftThenRight!();
      },
      outputStrings: {
        leftThenRight: Outputs.leftThenRight,
        rightThenLeft: Outputs.rightThenLeft,
      },
    },
    {
      id: 'Jeuno First Walk Lordly Shadow Giga Slash',
      type: 'StartsUsing',
      netRegex: { id: ['9F3E', '9F3F'], source: 'Lordly Shadow', capture: true },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F3E')
          return output.rightThenLeftShadow!();
        return output.leftThenRightShadow!();
      },
      outputStrings: {
        leftThenRightShadow: {
          en: 'Left => right of shadow',
          ja: '分身 左 => 右',
          ko: '(그림자) 왼쪽 🔜 오른쪽',
        },
        rightThenLeftShadow: {
          en: 'Right => left of shadow',
          ja: '分身 右 => 左',
          ko: '(그림자) 오른쪽 🔜 왼쪽',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Flames Of Hatred',
      type: 'StartsUsing',
      netRegex: { id: '9F69', source: 'Shadow Lord', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Cthonic Fury',
      type: 'StartsUsing',
      netRegex: { id: ['9F4A', '9F4B'], source: 'Shadow Lord', capture: false },
      durationSeconds: 6,
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Burning Battlements',
      type: 'StartsUsing',
      netRegex: { id: '9F4F', source: 'Shadow Lord', capture: false },
      run: (data) => data.burning = 'battle',
    },
    {
      id: 'Jeuno First Walk Shadow Lord Burning Keep',
      type: 'StartsUsing',
      netRegex: { id: '9F4E', source: 'Shadow Lord', capture: false },
      run: (data) => data.burning = 'keep',
    },
    {
      id: 'Jeuno First Walk Shadow Lord Burning Moat',
      type: 'StartsUsing',
      netRegex: { id: '9F4D', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.2,
      durationSeconds: 6,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.burning === 'battle')
          return output.close!();
        if (data.burning === 'keep')
          return output.away!();
        return output.none!();
      },
      outputStrings: {
        none: {
          en: 'Get in circles',
          ja: '円の内側',
          ko: '동그라미로',
        },
        close: {
          en: 'In circles + Close to boss',
          ja: '円の内側 + ボスの近く',
          ko: '동그라미 + 가까운쪽으로',
        },
        away: {
          en: 'In circles + Away from boss',
          ja: '円の内側 + ボスから離れて',
          ko: '동그라미 + 먼곳으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Burning Court',
      type: 'StartsUsing',
      netRegex: { id: '9F4C', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.2,
      durationSeconds: 6,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.burning === 'battle')
          return output.close!();
        if (data.burning === 'keep')
          return output.away!();
        return output.none!();
      },
      outputStrings: {
        none: {
          en: 'Out of circles',
          ja: '円の外側',
          ko: '복도로',
        },
        close: {
          en: 'Out of circles + close to boss',
          ja: '円の外側 + ボスの近く',
          ko: '복도 + 안쪽으로',
        },
        away: {
          en: 'Out of circles + away from boss',
          ja: '円の外側 + ボスから離れて',
          ko: '복도 + 바깥으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Implosion',
      type: 'StartsUsing',
      netRegex: { id: ['9F44', '9F45'], source: 'Shadow Lord', capture: true },
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F44')
          return output.rightAndOut!();
        return output.leftAndOut!();
      },
      outputStrings: {
        leftAndOut: {
          en: 'Go left + get out',
          ja: '離れて 左',
          ko: '왼쪽 + 밖으로',
        },
        rightAndOut: {
          en: 'Go right + get out',
          ja: '離れて 右',
          ko: '오른쪽 + 밖으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Lordly Shadow Implosion',
      type: 'StartsUsing',
      netRegex: { id: ['9F44', '9F45'], source: 'Lordly Shadow', capture: true },
      delaySeconds: 3,
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F44')
          return output.rightAndOut!();
        return output.leftAndOut!();
      },
      outputStrings: {
        leftAndOut: {
          en: 'Left of shadow + get out',
          ja: '分身 離れて 左',
          ko: '(쫄) 왼쪽 + 밖으로',
        },
        rightAndOut: {
          en: 'Right of shadow + get out',
          ja: '分身 離れて 右',
          ko: '(쫄) 오른쪽 + 밖으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Echoes Of Agony',
      type: 'HeadMarker',
      netRegex: { id: '0221', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Tera Slash',
      type: 'SystemLogMessage',
      netRegex: { id: '29AB', capture: false },
      durationSeconds: 10,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Unbridled Rage Collect',
      type: 'HeadMarker',
      netRegex: { id: '01D7', capture: true },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Unbridled Rage Call',
      type: 'StartsUsing',
      netRegex: { id: '9F67', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.5,
      alertText: (data, _matches, output) => {
        if (data.cleaves?.includes(data.me))
          return output.cleaveOnYou!();
        return output.avoidCleave!();
      },
      run: (data) => data.cleaves = [],
      outputStrings: {
        cleaveOnYou: Outputs.tankCleaveOnYou,
        avoidCleave: Outputs.avoidTankCleaves,
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Dark Nova',
      type: 'HeadMarker',
      netRegex: { id: '0137', capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Binding Sigil',
      type: 'StartsUsing',
      netRegex: { id: '9F55', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.sigilDodge!(),
      outputStrings: {
        sigilDodge: {
          en: 'Dodge puddles 3 to 1',
          ja: '最初の予兆へ駆け込む',
          ko: '장판 세번째▶첫번째로 피하기',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Damning Strikes',
      type: 'StartsUsing',
      netRegex: { id: '9F57', capture: false },
      durationSeconds: 7,
      response: Responses.getTowers(),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Nightfall Slash',
      type: 'StartsUsing',
      netRegex: { id: ['A424', 'A425', 'A426', 'A427'], source: 'Shadow Lord', capture: true },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === 'A424')
          return output.rightLeftBack!();
        if (matches.id === 'A425')
          return output.rightLeftFront!();
        if (matches.id === 'A426')
          return output.leftRightBack!();
        return output.leftRightFront!();
      },
      outputStrings: {
        rightLeftBack: {
          en: 'Start right => left => back',
          ja: '右 => 左 => 後ろ',
          ko: '오른쪽 🔜 왼쪽 🔜 뒤로',
        },
        rightLeftFront: {
          en: 'Start right => left => front',
          ja: '右 => 左 => 前',
          ko: '오른쪽 🔜 왼쪽 🔜 앞으로',
        },
        leftRightBack: {
          en: 'Start left => right => back',
          ja: '左 => 右 => 後ろ',
          ko: '왼쪽 🔜 오른쪽 🔜 뒤로',
        },
        leftRightFront: {
          en: 'Start left => right => front',
          ja: '左 => 右 => 前',
          ko: '왼쪽 🔜 오른쪽 🔜 앞으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Doom Arc',
      type: 'StartsUsing',
      netRegex: { id: '9F66', source: 'Shadow Lord', capture: false },
      durationSeconds: 14,
      response: Responses.bleedAoe(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Absolute Terror/Winged Terror': 'Absolute/Winged Terror',
        'Tachi: Gekko': 'Gekko',
        'Tachi: Kasha': 'Kasha',
        'Tachi: Yukikaze': 'Yukikaze',
        'Winged Terror/Absolute Terror': 'Winged/Absolute Terror',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Aquarius': 'Aquarius',
        'Ark Angel EV': 'Erzengel EV',
        'Ark Angel GK': 'Erzengel GK',
        'Ark Angel HM': 'Erzengel HM',
        'Ark Angel MR': 'Erzengel MR',
        'Ark Angel TT': 'Erzengel TT',
        'Despot': 'Despot',
        'Fafnir The Forgotten': 'Fafnir',
        'Fafnir the Forgotten': 'Fafnir',
        'Lordly Shadow': 'erhaben(?:e|er|es|en) Schatten',
        'Luminous Remnant': 'leuchtend(?:e|er|es|en) Erinnerung',
        'Prishe Of The Distant Chains': 'Prishe von den Fernen Ketten',
        'Prishe of the Distant Chains': 'Prishe von den Fernen Ketten',
        'Shadow Lord': 'Schattenlord',
        'Sprinkler': 'Sprinkler',
      },
      'replaceText': {
        '--all untargetable--': '--Alle nicht anvisierbar--',
        '--Binding Indicator': '--Fessel-Anzeige',
        '--Darters spawn--': '--Brummer erscheinen--',
        '--EV \\+ HM center--': '--EV + HM Mitte--',
        '--EV \\+ HM targetable--': '--EV + HM anvisierbar--',
        '--EV untargetable--': '--EV nicht anvisierbar--',
        '--HM center--': '--HM Mitte--',
        '--MR center--': '--MR Mitte--',
        '--MR targetable--': '--MR anvisierbar--',
        '--GK targetable--': '--GK anvisierbar--',
        '--MR jump--': '--MR Sprung--',
        '--TT jump--': '--TT Sprung--',
        '\\(add\\)': '(Adds)',
        '\\(boss\\)': '(Boss)',
        '\\(cast\\)': '(wirken)',
        '\\(castbar\\)': '()',
        '\\(circle AoE\\)': '(Kreis AoE)',
        '\\(circle indicator\\)': '(Kreis Anzeige)',
        '\\(circle\\)': '(Kreis)',
        '\\(exalines\\)': '(Exa-Linien)',
        '\\(explode\\)': '(Explodieren)',
        '\\(gaze\\)': '(Blick)',
        '\\(grid\\)': '(Raster)',
        '\\(knockback\\)': '(Rückstoß)',
        '\\(line AoE\\)': '(Linien AoE)',
        '\\(line indicators\\)': '(Lienien Anzeige)',
        '\\(puddles\\)': '(Flächen)',
        '\\(raidwide\\)': '(Raidweit)',
        '\\(raidwides\\)': '(mehrere Raidweit)',
        '\\(rings\\)': '(Ringe)',
        '\\(single lines\\)': '(einzelne Linie)',
        '\\(spread\\)': '(verteilen)',
        '\\(spreads explode\\)': '(verteilt explodieren)',
        '\\(stack\\)': '(sammeln)',
        'Absolute Terror': 'Absoluter Terror',
        'Arrogance Incarnate': 'Verkörperte Arroganz',
        'Asuran Fists': 'Asura-Fäuste',
        'Auroral Uppercut': 'Rosiger Kinnhaken',
        'Baleful Breath': 'Unheilvoller Atem',
        'Banish(?!(ga| Storm))': 'Verbannen',
        'Banish Storm': 'Bannsturm',
        'Banishga(?! )': 'Verbannga',
        'Banishga IV': 'Verbannga IV',
        'Binding Sigil': 'Kettensiegel',
        'Brittle Impact': 'Einschlag',
        'Burning Battlements': 'Lodernde Zinnen',
        'Burning Court': 'Lodernder Hof',
        'Burning Keep': 'Lodernder Turm',
        'Burning Moat': 'Lodernder Graben',
        'Burst': 'Explosion',
        'Cloudsplitter': 'Wolkenspalter',
        'Concerted Dissolution': 'Dissoziationskette',
        'Critical Reaver': 'Kritischer Spalter',
        'Critical Strikes': 'Macht der Vernichtung',
        'Cross Reaver': 'Kreuzplünderer',
        'Crystalline Thorns': 'Adamantdornen',
        'Cthonic Fury': 'Chthonischer Zorn',
        'Damning Strikes': 'Verdammende Hiebe',
        'Dark Matter Blast': 'Dunkelmaterienschlag',
        'Dark Nebula': 'Berstende Nova',
        'Dark Nova': 'Dunkle Nova',
        'Divine Dominion': 'Göttlicher Hieb',
        'Dominion Slash': 'Fleischerhaken des Dominions',
        'Doom Arc': 'Verdammnisbogen',
        'Dragon Breath': 'Drachenatem',
        'Dragonfall': 'Drachenfall',
        'Echoes of Agony': 'Echo der Qual',
        'Explosion': 'Explosion',
        'Flames of Hatred': 'Flamme des Hasses',
        'Giga Slash(?!:)': 'Giga-Schlag',
        'Giga Slash: Nightfall': 'Giga-Schlag des Abendlichts',
        'Guillotine': 'Guillotine',
        'Havoc Spiral': 'Chaosspirale',
        'Holy': 'Sanctus',
        'Horrid Roar': 'Entsetzliches Gebrüll',
        'Hurricane Wing': 'Hurrikanschwinge',
        '(?<!Brittle )Impact': 'Impakt',
        'Implosion': 'Implosion',
        'Knuckle Sandwich': 'Maulstopfer',
        'Light\'s Chain': 'Leuchtkette',
        'Meikyo Shisui': 'Meikyo Shisui',
        'Meteor': 'Meteor',
        'Mighty Strikes': 'Mächtiger Schlag',
        'Mijin Gakure': 'Mijin Gakure',
        '(?<! )Nightfall': 'Abendlicht',
        'Nullifying Dropkick': 'Annullierender Doppelkick',
        'Offensive Posture': 'Offensivhaltung',
        'Proud Palisade': 'Heilige Wacht',
        'Raiton': 'Raiton',
        'Rampage': 'Amok',
        'Shadow Spawn': 'Schattenschöpfung',
        'Sharp Spike': 'Scharfer Stachel',
        'Soul Binding': 'Seelenfessel',
        'Spike Flail': 'Dornendresche',
        'Spiral Finish': 'Spiralschlag',
        'Tachi: Gekko': 'Tachi: Gekko',
        'Tachi: Kasha': 'Tachi: Kasha',
        'Tachi: Yukikaze': 'Tachi: Yukikaze',
        'Tera Slash': 'Tera-Schlag',
        'Touchdown': 'Himmelssturz',
        'Umbra Smash': 'Nachtschlag',
        'Unbridled Rage': 'Zügelloser Zorn',
        'Utsusemi': 'Utsusemi',
        'Winged Terror': 'Terrorschwinge',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Aquarius': 'Aquarius',
        'Ark Angel EV': 'Ark Angel EV',
        'Ark Angel GK': 'Ark Angel GK',
        'Ark Angel HM': 'Ark Angel HM',
        'Ark Angel MR': 'Ark Angel MR',
        'Ark Angel TT': 'Ark Angel TT',
        'Despot': 'Despot',
        'Fafnir the Forgotten': 'Fafnir',
        'Lordly Shadow': 'lordly shadow',
        'Luminous Remnant': 'luminous remnant',
        'Prishe of the Distant Chains': 'Prishe of the Distant Chains',
        'Shadow Lord': 'Shadow Lord',
        'Sprinkler': 'Sprinkler',
      },
      'replaceText': {
        '--all untargetable--': '--Tous non ciblable--',
        '--Binding Indicator': '--Indicateur de liaison',
        '--Darters spawn--': '--Apparition des dards--',
        '--EV \\+ HM center--': '--EV + HM Centre--',
        '--EV \\+ HM targetable--': '--EV + HM ciblable--',
        '--EV untargetable--': '--EV non ciblable--',
        '--HM center--': '--HM Centre--',
        '--MR center--': '--MR Centre--',
        '--MR targetable--': '--MR Ciblable--',
        '--GK targetable--': '--GK Ciblable--',
        '--MR jump--': '--MR Saut--',
        '--TT jump--': '--TT Saut--',
        '\\(add\\)': '(Adds)',
        '\\(boss\\)': '(Boss)',
        '\\(cast\\)': '(incante)',
        '\\(castbar\\)': '(barre d\'incantation)',
        '\\(circle AoE\\)': '(AoE Circulaire)',
        '\\(circle indicator\\)': '(Indicateur circulaire)',
        '\\(circle\\)': '(Cercle)',
        '\\(exalines\\)': '(Exalignes)',
        '\\(explode\\)': '(Explostion)',
        '\\(gaze\\)': '(Regard)',
        '\\(grid\\)': '(Grille)',
        '\\(knockback\\)': '(Poussée)',
        '\\(line AoE\\)': '(AoE en ligne)',
        '\\(line indicators\\)': '(Indicateur de ligne)',
        '\\(puddles\\)': '(Puddle)',
        '\\(raidwide\\)': '(Raidwide)',
        '\\(raidwides\\)': '(Raidwides)',
        '\\(rings\\)': '(Anneaux)',
        '\\(single lines\\)': '(Ligne simple)',
        '\\(spread\\)': '(Dispersion)',
        '\\(spreads explode\\)': '(Explosition dispersion)',
        '\\(stack\\)': '(Package)',
        'Absolute Terror': 'Terreur absolue',
        'Arrogance Incarnate': 'Arrogance incarnée',
        'Asuran Fists': 'Poings d\'Asura',
        'Auroral Uppercut': 'Uppercut auroral',
        'Baleful Breath': 'Souffle maléfique',
        'Banish(?!(ga| Storm))': 'Bannissement',
        'Banish Storm': 'Tempête bannissante',
        'Banishga(?! )': 'OmniBannissement',
        'Banishga IV': 'OmniBannissement IV',
        'Binding Sigil': 'Cercle entravant',
        'Brittle Impact': 'Atterrissage rapide',
        'Burning Battlements': 'Rempart ardent',
        'Burning Court': 'Manteau ardent',
        'Burning Keep': 'Donjon ardent',
        'Burning Moat': 'Fossé ardent',
        'Burst': 'Explosion',
        'Cloudsplitter': 'Brise-nuage',
        'Concerted Dissolution': 'Chaîne dissociatrice',
        'Critical Reaver': 'Scission critique',
        'Critical Strikes': 'Destruction critique',
        'Cross Reaver': 'Double tranchant',
        'Crystalline Thorns': 'Épines adamantines',
        'Cthonic Fury': 'Fureur sonique',
        'Damning Strikes': 'Frappe accablante',
        'Dark Matter Blast': 'Souffle de matière noire',
        'Dark Nebula': 'Rafale nova',
        'Dark Nova': 'Nova noire',
        'Divine Dominion': 'Entaille d\'Ark',
        'Dominion Slash': 'Entaille de domination',
        'Doom Arc': 'Arc fatal',
        'Dragon Breath': 'Souffle de dragon',
        'Dragonfall': 'Chute du dragon',
        'Echoes of Agony': 'Écho d\'agonie',
        'Explosion': 'Explosion',
        'Flames of Hatred': 'Haine de feu',
        'Giga Slash(?!:)': 'Giga-entaille',
        'Giga Slash: Nightfall': 'Giga-entaille crépusculaire',
        'Guillotine': 'Guillotine',
        'Havoc Spiral': 'Tourbillon de dégâts',
        'Holy': 'Miracle',
        'Horrid Roar': 'Rugissement ignoble',
        'Hurricane Wing': 'Aile d\'hurricane',
        '(?<!Brittle )Impact': 'Impact',
        'Implosion': 'Implosion',
        'Knuckle Sandwich': 'Bourre-pif',
        'Light\'s Chain': 'Chaîne lumineuse',
        'Meikyo Shisui': 'Meikyô Shisui',
        'Meteor': 'Météore',
        'Mighty Strikes': 'Destro-frappes',
        'Mijin Gakure': 'Mijin Gakure',
        '(?<! )Nightfall': 'Crépuscule',
        'Nullifying Dropkick': 'Super coup de pied pulvérisant',
        'Offensive Posture': 'Posture offensive',
        'Proud Palisade': 'Blocage stratégique',
        'Raiton': 'Raiton',
        'Rampage': 'Ravage',
        'Shadow Spawn': 'Alter ego',
        'Sharp Spike': 'Pointe acérée',
        'Soul Binding': 'Entrave de l\'âme',
        'Spike Flail': 'Fléau pointu',
        'Spiral Finish': 'Charge en spirale',
        'Tachi: Gekko': 'Tachi : Gekkô',
        'Tachi: Kasha': 'Tachi : Kasha',
        'Tachi: Yukikaze': 'Tachi : Yukikaze',
        'Tera Slash': 'Fracas de tera',
        'Touchdown': 'Atterrissage',
        'Umbra Smash': 'Fracas dans l\'ombre',
        'Unbridled Rage': 'Rage débridée',
        'Utsusemi': 'Utsusemi',
        'Winged Terror': 'Aile de terreur',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Aquarius': 'Aquarius',
        'Ark Angel EV': 'Ark Angel EV',
        'Ark Angel GK': 'Ark Angel GK',
        'Ark Angel HM': 'Ark Angel HM',
        'Ark Angel MR': 'Ark Angel MR',
        'Ark Angel TT': 'Ark Angel TT',
        'Despot': 'Despot',
        'Fafnir the Forgotten': 'Fafnir',
        'Lordly Shadow': 'lordly shadow',
        'Luminous Remnant': 'luminous remnant',
        'Prishe of the Distant Chains': 'Prishe of the Distant Chains',
        'Shadow Lord': 'Shadow Lord',
        'Sprinkler': 'Sprinkler',
      },
      'replaceText': {
        'Absolute Terror': 'アブソルートテラー',
        'Arrogance Incarnate': 'アロガンズインカーネイト',
        'Asuran Fists': '夢想阿修羅拳',
        'Auroral Uppercut': '羅刹七星拳',
        'Baleful Breath': 'ベイルフルブレス',
        'Banish(?![\\w| ])': 'バニシュ',
        'Banish Storm': 'バニシュストーム',
        'Banishga(?! )': 'バニシュガ',
        'Banishga IV': 'バニシュガIV',
        'Binding Sigil': 'バインドサークル',
        'Brittle Impact': '落着',
        'Burning Battlements': 'バーニングバトルメント',
        'Burning Court': 'バーニングコート',
        'Burning Keep': 'バーニングキープ',
        'Burning Moat': 'バーニングモート',
        'Burst': '爆発',
        'Cloudsplitter': 'クラウドスプリッタ',
        'Concerted Dissolution': '分解連携',
        'Critical Reaver': 'クリティカルディバイド',
        'Critical Strikes': 'クリティカルマイト',
        'Cross Reaver': '絶双十悶刃',
        'Crystalline Thorns': '金剛棘',
        'Cthonic Fury': 'ソーニックフューリー',
        'Damning Strikes': 'ダミングストライク',
        'Dark Matter Blast': 'ダークマターブラスト',
        'Dark Nebula': 'ノヴァブラスト',
        'Dark Nova': 'ダークノヴァ',
        'Divine Dominion': 'アークスラッシュ',
        'Dominion Slash': 'ドミニオンスラッシュ',
        'Doom Arc': 'ドゥームアーク',
        'Dragon Breath': 'ドラゴンブレス',
        'Dragonfall': '亢竜天鎚落',
        'Echoes of Agony': 'アゴニーズエコー',
        'Explosion': '爆発',
        'Flames of Hatred': 'フレイム・オブ・ヘイトレッド',
        'Giga Slash(?!:)': 'ギガスラッシュ',
        'Giga Slash: Nightfall': 'ギガスラッシュ・ナイトフォール',
        'Guillotine': 'ギロティン',
        'Havoc Spiral': 'ハボックスパイラル',
        'Holy': 'ホーリー',
        'Horrid Roar': 'ホリッドロア',
        'Hurricane Wing': 'ハリケーンウィング',
        '(?<!Brittle )Impact': '衝撃',
        'Implosion': 'インプロージョン',
        'Knuckle Sandwich': 'ナックルサンドイッチ',
        'Light\'s Chain': '光連携',
        'Meikyo Shisui': '明鏡止水',
        'Meteor': 'メテオ',
        'Mighty Strikes': 'マイティストライク',
        'Mijin Gakure': '微塵がくれ',
        '(?<! )Nightfall': 'ナイトフォール',
        'Nullifying Dropkick': '崑崙八象脚・改',
        'Offensive Posture': '攻撃態勢',
        'Proud Palisade': 'エクストリームガード',
        'Raiton': '雷遁の術',
        'Rampage': 'ランページ',
        'Shadow Spawn': 'スポーンシャドウズ',
        'Sharp Spike': 'シャープスパイク',
        'Soul Binding': 'ソウルバインド',
        'Spike Flail': 'スパイクフレイル',
        'Spiral Finish': 'スパイラルエンド',
        'Tachi: Gekko': '八之太刀・月光',
        'Tachi: Kasha': '九之太刀・花車',
        'Tachi: Yukikaze': '七之太刀・雪風',
        'Tera Slash': 'テラスラッシュ',
        'Touchdown': 'タッチダウン',
        'Umbra Smash': 'アンブラスマッシュ',
        'Unbridled Rage': 'アンブライドルレイジ',
        'Utsusemi': '空蝉の術',
        'Winged Terror': 'テラーウィング',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Aquarius': '宝瓶蟹',
        'Ark Angel EV': '方舟天使EV',
        'Ark Angel GK': '方舟天使GK',
        'Ark Angel HM': '方舟天使HM',
        'Ark Angel MR': '方舟天使MR',
        'Ark Angel TT': '方舟天使TT',
        'Despot': '专制者',
        'Fafnir The Forgotten': '法芙尼尔',
        'Fafnir the Forgotten': '法芙尼尔',
        'Lordly Shadow': '王之暗影',
        'Luminous Remnant': '光流残滓',
        'Prishe Of The Distant Chains': '遥远的咒缚 普利修',
        'Prishe of the Distant Chains': '遥远的咒缚 普利修',
        'Shadow Lord': '暗之王',
        'Sprinkler': '喷淋器',
        'The Dragon\'s Aery': '龙巢',
        'The grand dais': '斗舞台',
        'The La\'loff Amphitheater': '拉·洛弗剧场',
        'The Throne Room': '王座大殿',
      },
      'replaceText': {
        '--all untargetable--': '--全体不可选中--',
        '--Binding Indicator': '--绑定指示',
        '--Darters spawn--': '--赤蜻生成--',
        '--EV \\+ HM center--': '--EV + HM 中央--',
        '--EV \\+ HM targetable--': '--EV + HM 可选中--',
        '--EV untargetable--': '--EV 不可选中--',
        '--HM center--': '--HM 中央--',
        '--MR center--': '--MR 中央--',
        '--MR targetable--': '--MR 可选中--',
        '--GK targetable--': '--GK 可选中--',
        '--MR jump--': '--MR 跳--',
        '--TT jump--': '--TT 跳--',
        '\\(add\\)': '(小怪)',
        '\\(big raidwide\\)': '(超大全域)',
        '\\(boss\\)': '(BOSS)',
        '\\(cast\\)': '(咏唱)',
        '\\(castbar\\)': '(咏唱栏)',
        '\\(circle\\)': '(圆)',
        '\\(circle AoE\\)': '(圆形AOE)',
        '\\(circle indicator\\)': '(圆形指示)',
        '\\(exalines\\)': '(扩展直线)',
        '\\(explode\\)': '(爆炸)',
        '\\(gaze\\)': '(石化光)',
        '\\(grid\\)': '(网格)',
        '\\(knockback\\)': '(击退)',
        '\\(line AoE\\)': '(直线AOE)',
        '\\(line indicators\\)': '(直线指示)',
        '\\(puddles\\)': '(圈)',
        '\\(raidwide\\)': '(全域)',
        '\\(raidwides\\)': '(全域)',
        '\\(rings\\)': '(环)',
        '\\(single lines\\)': '(单独直线)',
        '\\(spread\\)': '(分散)',
        '\\(spreads explode\\)': '(分散爆炸)',
        '\\(stack\\)': '(集合)',
        'Absolute Terror': '绝对恐惧',
        'Arrogance Incarnate': '骄慢化身',
        'Asuran Fists': '梦想阿修罗拳',
        'Auroral Uppercut': '罗刹七星拳',
        'Baleful Breath': '凶恶吐息',
        'Banish(?!(ga| Storm))': '放逐',
        'Banish Storm': '放逐风暴',
        'Banishga(?! )': '强放逐',
        'Banishga IV': '强放逐IV',
        'Binding Sigil': '束缚咒',
        'Brittle Impact': '落地',
        'Burning Battlements': '暗火燎堞',
        'Burning Court': '暗火燎庭',
        'Burning Keep': '暗火燎城',
        'Burning Moat': '暗火燎壕',
        'Burst': '爆炸',
        'Cloudsplitter': '劈云斩',
        'Concerted Dissolution': '分解连技',
        'Critical Reaver': '暴击分断',
        'Critical Strikes': '暴击威震',
        'Cross Reaver': '绝双十闷刃',
        'Crystalline Thorns': '金刚棘',
        'Cthonic Fury': '冥界之怒',
        'Damning Strikes': '诅咒强袭',
        'Dark Matter Blast': '暗物质冲击',
        'Dark Nebula': '新星爆发',
        'Dark Nova': '黑暗新星',
        'Divine Dominion': '方舟支配',
        'Dominion Slash': '支配斩',
        'Doom Arc': '厄运弧光',
        'Dragon Breath': '巨龙吐息',
        'Dragonfall': '亢龙天锤落',
        'Echoes of Agony': '惨痛的回响',
        'Explosion': '爆炸',
        'Flames of Hatred': '憎恶之火',
        'Giga Slash(?!:)': '十亿斩击',
        'Giga Slash: Nightfall': '十亿斩击·入夜',
        'Guillotine': '断首',
        'Havoc Spiral': '灾乱螺旋',
        'Holy': '神圣',
        'Horrid Roar': '恐惧咆哮',
        'Hurricane Wing': '飓风之翼',
        '(?<!Brittle )Impact': '冲击',
        'Implosion': '向心聚爆',
        'Knuckle Sandwich': '迎面重拳',
        'Light\'s Chain': '光连技',
        'Meikyo Shisui': '明镜止水',
        'Meteor': '陨石流星',
        'Mighty Strikes': '强力冲击',
        'Mijin Gakure': '隐于微尘',
        '(?<! )Nightfall': '入夜',
        'Nullifying Dropkick': '昆仑八象脚·改',
        'Offensive Posture': '攻击姿态',
        'Proud Palisade': '极致防御',
        'Raiton': '雷遁之术',
        'Rampage': '暴怒',
        'Shadow Spawn': '影之增殖',
        'Sharp Spike': '锋刺',
        'Soul Binding': '灵魂束缚',
        'Spike Flail': '刃尾横扫',
        'Spiral Finish': '螺旋终结',
        'Tachi: Gekko': '八之太刀·月光',
        'Tachi: Kasha': '九之太刀·花车',
        'Tachi: Yukikaze': '七之太刀·雪风',
        'Tera Slash': '万亿斩击',
        'Touchdown': '空降',
        'Umbra Smash': '本影爆碎',
        'Unbridled Rage': '无拘暴怒',
        'Utsusemi': '空蝉之术',
        'Winged Terror': '恐慌之翼',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Aquarius': 'Aquarius',
        'Ark Angel EV': 'Ark Angel EV',
        'Ark Angel GK': 'Ark Angel GK',
        'Ark Angel HM': 'Ark Angel HM',
        'Ark Angel MR': 'Ark Angel MR',
        'Ark Angel TT': 'Ark Angel TT',
        'Despot': 'Despot',
        'Fafnir The Forgotten': 'Fafnir',
        'Fafnir the Forgotten': 'Fafnir',
        'Lordly Shadow': 'Lordly Shadow',
        'Luminous Remnant': '光流殘滓',
        'Prishe Of The Distant Chains': '遙遠的咒縛 普利修',
        'Prishe of the Distant Chains': '遙遠的咒縛 普利修',
        'Shadow Lord': 'Shadow Lord',
        'Sprinkler': 'Sprinkler',
        // 'The Dragon\'s Aery': '', // FIXME '龙巢'
        // 'The grand dais': '', // FIXME '斗舞台'
        // 'The La\'loff Amphitheater': '', // FIXME '拉·洛弗剧场'
        // 'The Throne Room': '', // FIXME '王座大殿'
      },
      'replaceText': {
        // '--all untargetable--': '', // FIXME '--全体不可选中--'
        // '--Binding Indicator': '', // FIXME '--绑定指示'
        // '--Darters spawn--': '', // FIXME '--赤蜻生成--'
        // '--EV \\+ HM center--': '', // FIXME '--EV + HM 中央--'
        // '--EV \\+ HM targetable--': '', // FIXME '--EV + HM 可选中--'
        // '--EV untargetable--': '', // FIXME '--EV 不可选中--'
        // '--HM center--': '', // FIXME '--HM 中央--'
        // '--MR center--': '', // FIXME '--MR 中央--'
        // '--MR targetable--': '', // FIXME '--MR 可选中--'
        // '--GK targetable--': '', // FIXME '--GK 可选中--'
        // '--MR jump--': '', // FIXME '--MR 跳--'
        // '--TT jump--': '', // FIXME '--TT 跳--'
        // '\\(add\\)': '', // FIXME '(小怪)'
        // '\\(big raidwide\\)': '', // FIXME '(超大全域)'
        // '\\(boss\\)': '', // FIXME '(BOSS)'
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        // '\\(castbar\\)': '', // FIXME '(咏唱栏)'
        // '\\(circle\\)': '', // FIXME '(圆)'
        // '\\(circle AoE\\)': '', // FIXME '(圆形AOE)'
        // '\\(circle indicator\\)': '', // FIXME '(圆形指示)'
        // '\\(exalines\\)': '', // FIXME '(扩展直线)'
        // '\\(explode\\)': '', // FIXME '(爆炸)'
        // '\\(gaze\\)': '', // FIXME '(石化光)'
        // '\\(grid\\)': '', // FIXME '(网格)'
        // '\\(knockback\\)': '', // FIXME '(击退)'
        // '\\(line AoE\\)': '', // FIXME '(直线AOE)'
        // '\\(line indicators\\)': '', // FIXME '(直线指示)'
        // '\\(puddles\\)': '', // FIXME '(圈)'
        // '\\(raidwide\\)': '', // FIXME '(全域)'
        // '\\(raidwides\\)': '', // FIXME '(全域)'
        // '\\(rings\\)': '', // FIXME '(环)'
        // '\\(single lines\\)': '', // FIXME '(单独直线)'
        // '\\(spread\\)': '', // FIXME '(分散)'
        // '\\(spreads explode\\)': '', // FIXME '(分散爆炸)'
        // '\\(stack\\)': '', // FIXME '(集合)'
        'Absolute Terror': '絕對恐懼',
        'Arrogance Incarnate': '驕慢化身',
        'Asuran Fists': '夢想阿修羅拳',
        'Auroral Uppercut': '羅剎七星拳',
        'Baleful Breath': '兇惡吐息',
        // 'Banish(?!(ga| Storm))': '', // FIXME '放逐'
        'Banish Storm': '放逐風暴',
        'Banishga(?! )': '強放逐',
        'Banishga IV': '強放逐IV',
        'Binding Sigil': '束縛咒',
        'Brittle Impact': '落地',
        'Burning Battlements': '暗火燎堞',
        'Burning Court': '暗火燎庭',
        'Burning Keep': '暗火燎城',
        'Burning Moat': '暗火燎壕',
        'Burst': '爆炸',
        'Cloudsplitter': '劈雲斬',
        'Concerted Dissolution': '分解連技',
        'Critical Reaver': '暴擊分斷',
        'Critical Strikes': '暴擊威震',
        'Cross Reaver': '絕雙十悶刃',
        'Crystalline Thorns': '金剛棘',
        'Cthonic Fury': '冥界之怒',
        'Damning Strikes': '詛咒強襲',
        'Dark Matter Blast': '黑暗物質衝擊',
        'Dark Nebula': '新星爆發',
        'Dark Nova': '黑暗新星',
        'Divine Dominion': '方舟支配',
        'Dominion Slash': '支配斬',
        'Doom Arc': '毀滅之弧',
        'Dragon Breath': '巨龍吐息',
        'Dragonfall': '亢龍天錘落',
        'Echoes of Agony': '慘痛的回響',
        'Explosion': '爆炸',
        'Flames of Hatred': '憎惡之火',
        'Giga Slash(?!:)': '十億斬擊',
        'Giga Slash: Nightfall': '十億斬擊·入夜',
        'Guillotine': '斷首',
        'Havoc Spiral': '災亂螺旋',
        'Holy': '神聖',
        'Horrid Roar': '恐懼咆哮',
        'Hurricane Wing': '颶風之翼',
        '(?<!Brittle )Impact': '衝擊',
        'Implosion': '向心聚爆',
        'Knuckle Sandwich': '迎面重拳',
        'Light\'s Chain': '光連技',
        'Meikyo Shisui': '明鏡止水',
        'Meteor': '隕石流星',
        'Mighty Strikes': '強力衝擊',
        'Mijin Gakure': '隱於微塵',
        '(?<! )Nightfall': '入夜',
        'Nullifying Dropkick': '崑崙八象腳·改',
        'Offensive Posture': '攻擊姿態',
        'Proud Palisade': '極致防禦',
        'Raiton': '雷遁之術',
        'Rampage': '暴怒',
        'Shadow Spawn': '影之增殖',
        'Sharp Spike': '鋒刺',
        'Soul Binding': '靈魂束縛',
        'Spike Flail': '刃尾橫掃',
        'Spiral Finish': '螺旋終結',
        'Tachi: Gekko': '八之太刀·月光',
        'Tachi: Kasha': '九之太刀·花車',
        'Tachi: Yukikaze': '七之太刀·雪風',
        'Tera Slash': '萬億斬擊',
        'Touchdown': '空降',
        'Umbra Smash': '本影爆碎',
        'Unbridled Rage': '無拘暴怒',
        'Utsusemi': '空蟬之術',
        'Winged Terror': '恐慌之翼',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Aquarius': '아쿠아리우스',
        'Ark Angel EV': '아크 엔젤 EV',
        'Ark Angel GK': '아크 엔젤 GK',
        'Ark Angel HM': '아크 엔젤 HM',
        'Ark Angel MR': '아크 엔젤 MR',
        'Ark Angel TT': '아크 엔젤 TT',
        'Despot': '독재자',
        'Fafnir The Forgotten': '파프니르',
        'Lordly Shadow': '왕의 어둠',
        'Luminous Remnant': '빛나는 잔해',
        'Prishe Of The Distant Chains': '아득한 주박의 프리슈',
        'Shadow Lord': '어둠의 왕',
        'Sprinkler': '물뿌리개',
        'The Dragon\'s Aery': '용의 보금자리',
        'The grand dais': '격투 무대',
        'The La\'loff Amphitheater': '라로프 극장',
        'The Throne Room': '왕관의 방',
      },
      'replaceText': {
        '\\(add\\)': '(쫄)',
        '\\(big raidwide\\)': '(강력한 전체공격)',
        '\\(boss\\)': '(보스)',
        '\\(cast\\)': '(시전)',
        '\\(castbar\\)': '(시전바)',
        '\\(circle\\)': '(원)',
        '\\(circle AoE\\)': '(원형 장판)',
        '\\(circle indicator\\)': '(원형 예고)',
        '\\(exalines\\)': '(퍼지는 장판)',
        '\\(explode\\)': '(폭발)',
        '\\(gaze\\)': '(석화징)',
        '\\(grid\\)': '(격자)',
        '\\(knockback\\)': '(넉백)',
        '\\(line AoE\\)': '(직선 장판)',
        '\\(line indicators\\)': '(직선 예고)',
        '\\(puddles\\)': '(장판)',
        '\\(raidwide\\)': '(전체공격)',
        '\\(raidwides\\)': '(전체공격)',
        '\\(rings\\)': '(도넛)',
        '\\(single lines\\)': '(직선 장판)',
        '\\(spread\\)': '(산개)',
        '\\(spreads explode\\)': '(산개 징)',
        '\\(stack\\)': '(쉐어)',
        '--all untargetable--': '--모두 타겟 불가능--',
        '--Binding Indicator': '--속박의 진 예고',
        '--Darters spawn--': '--쫄 등장--',
        '(?<!-)center--': '중앙--',
        'jump--': '점프--',
        '(?<!un)targetable--': '타겟 가능--',
        '(?<!all )untargetable--': '타겟 불가능--',
        'Absolute Terror': '압도적 공포',
        'Arrogance Incarnate': '오만의 화신',
        'Asuran Fists': '몽상아수라권',
        'Auroral Uppercut': '나찰칠성권',
        'Baleful Breath': '해로운 숨결',
        'Banish(?!( S|ga))': '배니시',
        'Banish Storm': '배니시 폭풍',
        'Banishga(?! )': '배니시가',
        'Banishga IV': '배니시가 IV',
        'Binding Sigil': '속박의 진',
        'Brittle Impact': '착륙',
        'Burning Battlements': '불타는 외벽',
        'Burning Court': '불타는 뜰',
        'Burning Keep': '불타는 내벽',
        'Burning Moat': '불타는 해자',
        'Burst': '폭발',
        'Cloudsplitter': '구름 가르기',
        'Concerted Dissolution': '분해 연계',
        'Critical Reaver': '치명적인 분할',
        'Critical Strikes': '치명적인 타격',
        'Cross Reaver': '십자 절단검',
        'Crystalline Thorns': '금강 가시',
        'Cthonic Fury': '저승의 분노',
        'Damning Strikes': '파멸 강타',
        'Dark Matter Blast': '암흑물질 폭발',
        'Dark Nebula': '신성 폭발',
        'Dark Nova': '암흑 신성',
        'Divine Dominion': '대지 참격',
        'Dominion Slash': '지배의 참격',
        'Doom Arc': '멸망의 궤도',
        'Dragon Breath': '용의 숨결',
        'Dragonfall': '항용천추락',
        'Echoes of Agony': '고통의 반향',
        'Explosion': '폭발',
        'Flames of Hatred': '증오의 화염',
        'Giga Slash(?!:)': '기가 슬래시',
        'Giga Slash: Nightfall': '기가 슬래시: 황혼',
        'Guillotine': '참수형',
        'Havoc Spiral': '파괴의 소용돌이',
        'Holy': '홀리',
        'Horrid Roar': '소름 끼치는 포효',
        'Hurricane Wing': '폭풍 날개',
        '(?<! )Impact': '충격',
        'Implosion': '내파',
        'Knuckle Sandwich': '너클 샌드위치',
        'Light\'s Chain': '빛의 연계',
        'Meikyo Shisui': '명경지수',
        'Meteor': '메테오',
        'Mighty Strikes': '강력한 타격',
        'Mijin Gakure': '자폭 은신술',
        '(?<! )Nightfall': '황혼',
        'Nullifying Dropkick': '개량 곤륜팔상각',
        'Offensive Posture': '공격 태세',
        'Proud Palisade': '극한 방어',
        'Raiton': '뇌둔술',
        'Rampage': '광란',
        'Shadow Spawn': '그림자 소환',
        'Sharp Spike': '날카로운 돌말뚝',
        'Soul Binding': '영혼 속박',
        'Spike Flail': '가시 매타작',
        'Spiral Finish': '소용돌이 종결',
        'Tachi: Gekko': '팔지태도: 월광',
        'Tachi: Kasha': '구지태도: 화차',
        'Tachi: Yukikaze': '칠지태도: 설풍',
        'Tera Slash': '테라 슬래시',
        'Touchdown': '착지',
        'Umbra Smash': '그림자 타격',
        'Unbridled Rage': '불승분노',
        'Utsusemi': '허물술',
        'Winged Terror': '공포의 날개',
      },
    },
  ],
};

export default triggerSet;
