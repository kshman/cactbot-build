import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  seenFirstThunder?: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'Kholusia',
  zoneId: ZoneId.Kholusia,
  comments: {
    en: 'A Rank Hunts, missing Formidable boss FATE',
    de: 'A Rang Hohe Jagd, Ein formidabler Kampf Boss FATE fehlt',
    fr: 'Chasse de rang A, ALÉA boss Formidable manquant',
    cn: 'A级狩猎怪, 缺失特殊FATE',
    ko: 'A급 마물, 특수돌발 누락.',
    tc: 'A級狩獵怪, 缺失特殊FATE',
  },
  triggers: [
    {
      id: 'Hunt Lil Murderer Goblin Punch',
      type: 'StartsUsing',
      netRegex: { id: '4450', source: 'Li\'l Murderer' },
      condition: (data) => data.inCombat,
      response: Responses.tankBuster(),
    },
    {
      id: 'Hunt Lil Murderer Gobthunder III',
      type: 'StartsUsing',
      netRegex: { id: '4455', source: 'Li\'l Murderer' },
      condition: (data) => data.inCombat,
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'Hunt Lil Murderer Goblin Slash',
      type: 'Ability',
      // This is for Goblin Thunder II
      netRegex: { id: '4454', source: 'Li\'l Murderer', capture: false },
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        // TODO: there is an uncasted/untelegraphed Goblin Slash "get out"
        // after some Gobthunder II (the self-targeted one?) but it's
        // unclear from logs which is which.  Since hunts die quickly,
        // just simplify and call this only after the first one until
        // somebody knows better.
        if (!data.inCombat || data.seenFirstThunder)
          return;
        return output.out!();
      },
      run: (data) => data.seenFirstThunder = true,
      outputStrings: {
        out: Outputs.out,
      },
    },
    {
      id: 'Hunt Huracan Winter Rain',
      type: 'StartsUsing',
      netRegex: { id: '4459', source: 'Huracan', capture: false },
      condition: (data) => data.inCombat,
      // This is a targeted circle aoe followed by a line aoe through the middle.
      response: Responses.goSides(),
    },
    {
      id: 'Hunt Huracan Summer Heat',
      type: 'StartsUsing',
      netRegex: { id: '445B', source: 'Huracan', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Huracan Spring Breeze',
      type: 'StartsUsing',
      netRegex: { id: '4458', source: 'Huracan', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.goSides(),
    },
    {
      id: 'Hunt Huracan Autumn Wreath',
      type: 'StartsUsing',
      netRegex: { id: '445A', source: 'Huracan', capture: false },
      condition: (data) => data.inCombat,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In => Sides',
          ja: 'In => Sides',
          ko: '안으로 🔜 옆으로',
        },
      },
    },
    {
      id: 'Hunt Huracan Dawn\'s Edge',
      type: 'StartsUsing',
      netRegex: { id: '4457', source: 'Huracan', capture: false },
      condition: (data) => data.inCombat,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => Sides (again)',
          ja: 'Sides => Sides (again)',
          ko: '옆으로 🔜 옆으로 (반복)',
        },
      },
    },
    {
      id: 'Hunt Pedantry Right Cheek',
      type: 'StartsUsing',
      netRegex: { id: '4428', source: 'Forgiven Pedantry', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'Hunt Pedantry Left Cheek',
      type: 'StartsUsing',
      netRegex: { id: '4426', source: 'Forgiven Pedantry', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'Hunt Pedantry Terrifying Glance',
      type: 'StartsUsing',
      netRegex: { id: '4623', source: 'Forgiven Pedantry', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.lookAway(),
    },
    {
      id: 'Hunt Pedantry Cleansing Fire',
      type: 'StartsUsing',
      netRegex: { id: '4422', source: 'Forgiven Pedantry', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Pedantry The Stake',
      type: 'StartsUsing',
      netRegex: { id: '4423', source: 'Forgiven Pedantry', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getOut(),
    },
    {
      id: 'Hunt Pedantry Fevered Flagellation',
      type: 'StartsUsing',
      netRegex: { id: '4420', source: 'Forgiven Pedantry' },
      condition: (data) => data.inCombat,
      response: Responses.tankCleave(),
    },
    {
      id: 'Hunt Pedantry Second Circle',
      type: 'StartsUsing',
      netRegex: { id: '4421', source: 'Forgiven Pedantry', capture: false },
      condition: (data) => data.inCombat,
      response: Responses.getBehind(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Forgiven Pedantry': 'geläutert(?:e|er|es|en) Pedanterie',
        'Huracan': 'Huracan',
        'Li\'l Murderer': 'Klein(?:e|er|es|en) Mörder',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Forgiven Pedantry': 'pédanterie pardonnée',
        'Huracan': 'Huracan',
        'Li\'l Murderer': 'Traître',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Forgiven Pedantry': 'フォーギヴン・ペダントリー',
        'Huracan': 'フラカン',
        'Li\'l Murderer': 'リルマーダー',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Forgiven Pedantry': '得到宽恕的炫学',
        'Huracan': '乌拉坎',
        'Li\'l Murderer': '小小杀手',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Forgiven Pedantry': '得到寬恕的炫學',
        'Huracan': '烏拉坎',
        'Li\'l Murderer': '小小殺手',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Forgiven Pedantry': '면죄된 현학',
        'Huracan': '후라칸',
        'Li\'l Murderer': '작은 살인자',
      },
    },
  ],
};

export default triggerSet;
