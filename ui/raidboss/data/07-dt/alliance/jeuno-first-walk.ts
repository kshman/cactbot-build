import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  cleaves: string[];
  burning?: 'battle' | 'keep';
}

// Jeuno: The First Walk
const triggerSet: TriggerSet<Data> = {
  id: 'JeunoTheFirstWalk',
  zoneId: ZoneId.JeunoTheFirstWalk,
  timelineFile: 'jeuno-first-walk.txt',
  initData: () => {
    return {
      cleaves: [],
    };
  },
  timelineTriggers: [],
  triggers: [
    // Prishe
    {
      id: 'Jeuno First Walk Prishe Banishga',
      type: 'StartsUsing',
      netRegex: { id: '9FE7', source: 'Prishe Of The Distant Chains', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Prishe Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: { id: ['9FE8', '9FE9', '9FEA'], source: 'Prishe Of The Distant Chains' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '9FE8')
          return output.text1!();
        if (matches.id === '9FE9')
          return output.text2!();
        if (matches.id === '9FEA')
          return output.text3!();
      },
      outputStrings: {
        text1: {
          en: 'Punch x1',
          ko: '한 칸짜리 펀치',
        },
        text2: {
          en: 'Punch x2',
          ko: '두 칸짜리 펀치',
        },
        text3: {
          en: 'Punch x3',
          ko: '세 칸짜리 펀치',
        },
      },
    },
    {
      id: 'Jeuno First Walk Preshe Nullifying Dropkick',
      type: 'HeadMarker',
      netRegex: { id: '023A' },
      response: Responses.sharedTankBuster('alert'),
    },
    {
      id: 'Jeuno First Walk Prishe Banish Storm',
      type: 'Ability', // This resolves before the AoEs even appear
      netRegex: { id: '9FF2', source: 'Prishe Of The Distant Chains', capture: false },
      alertText: (_data, _matches, output) => output.avoidCircles!(),
      outputStrings: {
        avoidCircles: {
          en: 'Avoid radiating circles',
          ko: '방사원 피해요',
        },
      },
    },
    {
      id: 'Jeuno First Walk Preshe Holy',
      type: 'HeadMarker',
      netRegex: { id: '00D7' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'AOE on YOU',
          ko: '내게 장판! 바깥에 버려요',
        },
      },
    },
    {
      id: 'Jeuno First Walk Prishe Auroral Uppercut',
      type: 'StartsUsing',
      netRegex: { id: ['9FF6', '9FF7', '9FF8'], source: 'Prishe Of The Distant Chains' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '9FF6')
          return output.text1!();
        if (matches.id === '9FF7')
          return output.text2!();
        if (matches.id === '9FF8')
          return output.text3!();
      },
      outputStrings: {
        text1: {
          en: 'Knuckback x1',
          ko: '한 칸짜리 넉백',
        },
        text2: {
          en: 'Knuckback x2',
          ko: '두 칸짜리 넉백',
        },
        text3: {
          en: 'Knuckback x3',
          ko: '세 칸짜리 넉백',
        },
      },
    },
    {
      id: 'Jeuno First Walk Preshe Banishga IV',
      type: 'StartsUsing',
      netRegex: { id: '9FFA', source: 'Prishe of the Distant Chains', capture: false },
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
          ko: '폭파 동글이 피해요',
        },
      },
    },
    {
      id: 'Jeuno First Walk Preshe Asuran Fists',
      type: 'StartsUsing',
      netRegex: { id: '9FFC', source: 'Prishe of the Distant Chains', capture: false },
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
      netRegex: { id: '9F96', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Fafnir Spike Flail',
      type: 'StartsUsing',
      netRegex: { id: '9F6B', source: 'Fafnir the Forgotten', capture: false },
      durationSeconds: 7,
      response: Responses.goFront('info'),
    },
    {
      id: 'Jeuno First Walk Fafnir Dragon Breath Call',
      type: 'StartsUsing',
      netRegex: { id: '9F6E', source: 'Fafnir the Forgotten', capture: false },
      durationSeconds: 7,
      response: Responses.getUnder(),
    },
    {
      id: 'Jeuno First Walk Fafnir Touchdown Windup',
      type: 'StartsUsing',
      netRegex: { id: '9F70', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Touchdown',
          ko: '내려찍기, 밖으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Fafnir Baleful Breath',
      type: 'StartsUsing',
      netRegex: { id: '9BF2', source: 'Fafnir the Forgotten', capture: false },
      durationSeconds: 7,
      response: Responses.stackMarker(),
    },
    {
      id: 'Jeuno First Walk Fafnir Sharp Spike Collect',
      type: 'HeadMarker',
      netRegex: { id: '0156' },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno First Walk Fafnir Sharp Spike',
      type: 'StartsUsing',
      netRegex: { id: '9F97', source: 'Fafnir the Forgotten', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleave: Outputs.tankCleaveOnYou,
          avoid: Outputs.avoidTankCleaves,
        };
        if (data.cleaves.includes(data.me))
          return { alertText: output.cleave!() };
        return { infoText: output.avoid!() };
      },
      run: (data) => data.cleaves = [],
    },
    {
      id: 'Jeuno First Walk Fafnir Horrid Roar Spread',
      type: 'HeadMarker',
      netRegex: { id: '01F3' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Jeuno First Walk Fafnir Absolute Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8D', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Jeuno First Walk Fafnir Winged Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8F', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.goMiddle(),
    },
    {
      id: 'Jeuno First Walk Fafnir Hurricane Wing',
      type: 'StartsUsing',
      netRegex: { id: '9F71', source: 'Fafnir the Forgotten', capture: false },
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.outerFirst!(),
      outputStrings: {
        outerFirst: {
          en: 'AoE x10',
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
      },
      outputStrings: {
        attackAngel: {
          en: 'Attack ${angel}',
          cn: '공격: ${angel}',
        },
      },
    },
    {
      id: 'Jeuno First Walk Ark Angel MR CloudSplitter Collect',
      type: 'HeadMarker',
      netRegex: { id: '01D0' },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno First Walk Ark Angel MR CloudSplitter',
      type: 'StartsUsing',
      netRegex: { id: 'A077', source: 'Ark Angel MR', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleave: Outputs.tankCleaveOnYou,
          avoid: Outputs.avoidTankCleaves,
        };
        if (data.cleaves.includes(data.me))
          return { alertText: output.cleave!() };
        return { infoText: output.avoid!() };
      },
      run: (data) => data.cleaves = [],
    },
    {
      id: 'Jeuno First Walk Ark Angel GK Gekko',
      type: 'StartsUsing',
      netRegex: { id: 'A07A', source: 'Ark Angel GK' },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      response: Responses.lookAwayFromSource(),
    },
    {
      id: 'Jeuno First Walk Ark Angel TT Meteor',
      type: 'StartsUsing',
      netRegex: { id: 'A08A', source: 'Ark Angel TT' },
      response: Responses.interruptIfPossible('alert'),
    },
    {
      id: 'Jeuno First Walk Ark Angel MR Spiral Finish',
      type: 'StartsUsing',
      netRegex: { id: 'A06C', source: 'Ark Angel MR', capture: false },
      delaySeconds: 5.5,
      response: Responses.knockback(),
    },
    {
      id: 'Jeuno First Walk Ark Angel GK Dragonfall',
      type: 'StartsUsing',
      netRegex: { id: 'A07E', source: 'Ark Angel GK', capture: false },
      alertText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: Outputs.stacks,
      },
    },
    {
      id: 'Jeuno First Walk Ark Angel GK Arrogance Incarnate',
      type: 'HeadMarker',
      netRegex: { id: '0131' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Jeuno First Walk Ark Angel TT Guillotine',
      type: 'StartsUsing',
      netRegex: { id: 'A067', source: 'Ark Angel TT', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Behind TT',
          ko: '기요틴! TT 뒤로!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Ark Angel EV Dominion Slash',
      type: 'StartsUsing',
      netRegex: { id: 'A085', source: 'Ark Angel EV', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno First Walk Ark Angel EV Holy',
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
          ko: 'HM에게 인터럽트!',
        },
      },
    },
    {
      id: 'Jeuno First Walk Ark Angel Chasing Tether',
      type: 'Tether',
      netRegex: { id: '0125' },
      condition: (data, matches) => [matches.source, matches.target].includes(data.me),
      durationSeconds: 8,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Chasing tether -- run away!',
          ko: '도망쳐요! 줄 달렸네!',
        },
      },
    },
    {
      id: 'Jeuno First Walk 4M Critical Reaver',
      type: 'StartsUsing',
      netRegex: { id: 'A13B', source: 'Ark Angel HM' },
      durationSeconds: 5,
      response: Responses.interruptIfPossible('alert'),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Giga Slash',
      type: 'StartsUsing',
      netRegex: { id: ['9F3E', '9F3F'], source: 'Shadow Lord' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F3E')
          return output.rl!();
        return output.lr!();
      },
      outputStrings: {
        lr: Outputs.leftThenRight,
        rl: Outputs.rightThenLeft,
      },
    },
    {
      id: 'Jeuno First Walk Lordly Shadow Giga Slash',
      type: 'StartsUsing',
      netRegex: { id: ['9F3E', '9F3F'], source: 'Lordly Shadow' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F3E')
          return output.rl!();
        return output.lr!();
      },
      outputStrings: {
        lr: {
          en: 'Left => Right on shadow',
          ja: '(影) 左 => 右',
          ko: '(그림자) 왼쪽 🔜 오른쪽',
        },
        rl: {
          en: 'Right => Left on shadow',
          ja: '(影) 右 => 左',
          ko: '(그림자) 오른쪽 🔜 왼쪽',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Implosion',
      type: 'StartsUsing',
      netRegex: { id: ['9F44', '9F45'], source: 'Shadow Lord' },
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F44')
          return output.right!();
        return output.left!();
      },
      outputStrings: {
        left: {
          en: 'Go left + get out',
          ko: '왼쪽 + 밖으로',
        },
        right: {
          en: 'Go right + get out',
          ko: '오른쪽 + 밖으로',
        },
      },
    },
    {
      id: 'Jeuno First Walk Lordly Shadow Implosion',
      type: 'StartsUsing',
      netRegex: { id: ['9F44', '9F45'], source: 'Lordly Shadow' },
      delaySeconds: 3,
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F44')
          return output.right!();
        return output.left!();
      },
      outputStrings: {
        left: {
          en: 'Left of add + get out',
          ko: '(쫄) 왼쪽 + 밖으로',
        },
        right: {
          en: 'Right of add + get out',
          ko: '(쫄) 오른쪽 + 밖으로',
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
      netRegex: { id: '9F4A', source: 'Shadow Lord', capture: false },
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
      delaySeconds: 0.3,
      durationSeconds: 5,
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
          en: 'In circles',
          ko: '동그라미 안으로',
        },
        close: {
          en: 'In circles + Close to boss',
          ko: '동그라미 안으로 + 보스 가까이',
        },
        away: {
          en: 'In circles + Away from boss',
          ko: '동그라미 안으로 + 보스 멀리',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Burning Court',
      type: 'StartsUsing',
      netRegex: { id: '9F4C', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.3,
      durationSeconds: 5,
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
          ko: '동그라미 밖으로',
        },
        close: {
          en: 'Out of circles + close to boss',
          ko: '동그라미 밖으로 + 보스 가까이',
        },
        away: {
          en: 'Out of circles + away from boss',
          ko: '동그라미 밖으로 + 보스 멀리',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Echoes Of Agony',
      type: 'HeadMarker',
      netRegex: { id: '0221' },
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
      netRegex: { id: '01D7' },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Unbridled Rage',
      type: 'StartsUsing',
      netRegex: { id: '9F67', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.5,
      alertText: (data, _matches, output) => {
        if (data.cleaves.includes(data.me))
          return output.cleave!();
        return output.avoid!();
      },
      run: (data) => data.cleaves = [],
      outputStrings: {
        cleave: Outputs.tankCleaveOnYou,
        avoid: Outputs.avoidTankCleaves,
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Dark Nova',
      type: 'HeadMarker',
      netRegex: { id: '0137' },
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
          ko: '장판 세번째▶첫번째로 피하기',
        },
      },
    },
    {
      id: 'Jeuno First Walk Shadow Lord Damning Strikes',
      type: 'StartsUsing',
      netRegex: { id: '9F57', capture: false },
      durationSeconds: 5,
      response: Responses.getTowers(),
    },
    {
      id: 'Jeuno First Walk Shadow Lord Nightfall Slash',
      type: 'StartsUsing',
      netRegex: { id: ['A424', 'A425', 'A426', 'A427'], source: 'Shadow Lord' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === 'A424')
          return output.rlb!();
        if (matches.id === 'A425')
          return output.rlf!();
        if (matches.id === 'A426')
          return output.lrb!();
        return output.lrf!();
      },
      outputStrings: {
        rlb: {
          en: 'Right => Left => Back',
          ko: '오른쪽 🔜 왼쪽 🔜 뒤로',
        },
        rlf: {
          en: 'Right => Left => Front',
          ko: '오른쪽 🔜 왼쪽 🔜 앞으로',
        },
        lrb: {
          en: 'Left => Right => Back',
          ko: '왼쪽 🔜 오른쪽 🔜 뒤로',
        },
        lrf: {
          en: 'Left => Right => Front',
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
        'Winged Terror/Absolute Terror': 'Winged/Absolute Terror',
        'Tachi: Yukikaze': 'Yukikaze',
        'Tachi: Gekko': 'Gekko',
        'Tachi: Kasha': 'Kasha',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Prishe of the Distant Chains': 'Prishe of the Distant Chains',
        'Fafnir the Forgotten': 'Fafnir',
        'Ark Angel TT': 'Ark Angel TT',
        'Ark Angel EV': 'Ark Angel EV',
        'Ark Angel MR': 'Ark Angel MR',
        'Ark Angel HM': 'Ark Angel MM',
        'Shadow Lord': 'Shadow Lord',
        'Lordly Shadow': 'Lordly Shadow',
      },
    },
  ],
};

export default triggerSet;
