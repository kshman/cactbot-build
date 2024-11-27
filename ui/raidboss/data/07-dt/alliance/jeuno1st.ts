import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  roarCount?: number;
  stakeCount?: number;
  flareMarker?: string;
}

// Jeuno: The First Walk
const triggerSet: TriggerSet<Data> = {
  id: 'JeunoTheFirstWalk',
  zoneId: ZoneId.JeunoTheFirstWalk,
  timelineFile: 'jeuno1st.txt',
  timelineTriggers: [],
  triggers: [
    // Prishe
    {
      id: 'Jeuno1 Preshe Knuckle Sandwich 1',
      type: 'StartsUsing',
      netRegex: { id: '9FE8', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knuckle Sandwich x1',
          ko: '한 칸짜리 펀치',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Knuckle Sandwich 2',
      type: 'StartsUsing',
      netRegex: { id: '9FE9', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knuckle Sandwich x2',
          ko: '두 칸짜리 펀치',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Knuckle Sandwich 3',
      type: 'StartsUsing',
      netRegex: { id: '9FEA', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knuckle Sandwich x3',
          ko: '세 칸짜리 펀치',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Nullifying Dropkick',
      type: 'StartsUsing',
      netRegex: { id: ['9FF1', '9FFD'], source: 'Prishe of the Distant Chains' },
      suppressSeconds: 1,
      response: Responses.sharedTankBuster('alert'),
    },
    {
      id: 'Jeuno1 Preshe Banishga IV',
      // 9FF2 Banish Storm
      // 9FFA Banishga IV
      type: 'StartsUsing',
      netRegex: { id: '9FFA', source: 'Prishe of the Distant Chains', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Preshe Tabris Divinevalley',
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
      id: 'Jeuno1 Preshe Auroral Uppercut 1',
      type: 'StartsUsing',
      netRegex: { id: '9FF6', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knuckback x1',
          ko: '한 칸짜리 넉백',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Auroral Uppercut 2',
      type: 'StartsUsing',
      netRegex: { id: '9FF7', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knuckback x2',
          ko: '두 칸짜리 넉백',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Auroral Uppercut 3',
      type: 'StartsUsing',
      netRegex: { id: '9FF8', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knuckback x3',
          ko: '세 칸짜리 넉백',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Asuran Fists',
      type: 'StartsUsing',
      netRegex: { id: '9FFC', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack on Tower',
          ko: '타워 🔜 연속 전체 공격',
        },
      },
    },
    // fafnir
    {
      id: 'Jeuno1 Fafnir Dark Matter Blast',
      type: 'StartsUsing',
      netRegex: { id: '9F96', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Fafnir Offensive Posture Tail',
      type: 'StartsUsing',
      netRegex: { id: '9F6B', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tail',
          ko: '꼬리치기, 앞으로',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Offensive Posture Touchdown',
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
      id: 'Jeuno1 Fafnir Offensive Posture Breath',
      type: 'StartsUsing',
      netRegex: { id: '9F6E', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Breath',
          ko: '브레스, 안으로',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Baleful Breath',
      type: 'StartsUsing',
      netRegex: { id: '9BF2', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack',
          ko: '전체 공격, 뭉쳐요',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Sharp Spike',
      type: 'StartsUsing',
      netRegex: { id: '9F97', source: 'Fafnir the Forgotten' },
      suppressSeconds: 1,
      response: Responses.tankBuster(),
    },
    {
      id: 'Jeuno1 Fafnir Hurricane Wing',
      type: 'StartsUsing',
      netRegex: { id: '9F71', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Jeuno1 Fafnir Winged Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8F', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.getIn(),
    },
    // Ark Angel
    // 명궁 지수: 장판 커짐 -> 장판 피함 -> 안으로 3단 콤보가 잇음
    // 스파이럴 피니시: 뱅글 돌다 -> 넉백
    {
      id: 'Jeuno1 Ark Angel TT Guillotine',
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
      id: 'Jeuno1 Ark Angel TT Meteor',
      type: 'StartsUsing',
      netRegex: { id: 'A08A', source: 'Ark Angel TT', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Interrupt TT',
          ko: '미티어! TT 인터럽트!',
        },
      },
    },
    {
      id: 'Jeuno1 Ark Angel EV Holy',
      type: 'StartsUsing',
      netRegex: { id: 'A089', source: 'Ark Angel EV', capture: false },
      response: Responses.aoe(),
    },
  ],
  timelineReplace: [],
};

export default triggerSet;
