import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  wildEnergy?: boolean;
  resonance: number;
  dice?: number;
  chaseDir?: 'cw' | 'ccw';
  chases: number;
}

const diceMap: { [id: string]: number } = {
  '0194': 1,
  '0195': 2,
  '0196': 3,
  '0197': 4,
  '0198': 5,
  '0199': 6,
  '019A': 7,
  '019B': 8,
} as const;

// the Windward Wilds (Extreme)
const triggerSet: TriggerSet<Data> = {
  id: 'ArkveldEx',
  zoneId: ZoneId.TheWindwardWildsExtreme,
  timelineFile: 'arkveld-ex.txt',
  initData: () => ({
    resonance: 0,
    chases: 0,
  }),
  triggers: [
    {
      id: 'ArkveldEx Roar',
      type: 'StartsUsing',
      netRegex: { id: 'ABAE', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ArkveldEx 날개짓',
      type: 'StartsUsing',
      netRegex: { id: ['AB73', 'AB74', 'B019', 'B020'] },
      durationSeconds: 3,
      infoText: (_data, matches, output) => {
        const dir = matches.id === 'AB74' || matches.id === 'B020'
          ? output.left!()
          : output.right!();
        return output.text!({ direction: dir });
      },
      outputStrings: {
        text: {
          en: 'Go ${direction}',
          ko: '보스 ${direction}으로',
        },
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    /* {
      id: 'ArkveldEx 날개짓 이동',
      type: 'StartsUsing',
      netRegex: { id: ['AB73', 'AB74', 'B019', 'B020'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.2,
      durationSeconds: 2,
      alertText: (_data, _matches, output) => output.move!(),
      outputStrings: {
        move: {
          en: 'Move',
          ko: '움직여요!',
        },
      },
    }, */
    {
      id: 'ArkveldEx 빨간 돌진',
      type: 'StartsUsing',
      netRegex: { id: ['B030', 'B037'], capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => Middle',
          ko: '돌진 피하고 🔜 가운데로',
        },
      },
    },
    {
      id: 'ArkveldEx 하얀 돌진',
      type: 'StartsUsing',
      netRegex: { id: ['B02B', 'B045'], capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stay sides',
          ko: '돌진 피하고 🔜 그대로 옆으로',
        },
      },
    },
    /* {
      id: 'ArkveldEx White Flash',
      type: 'StartsUsing',
      netRegex: { id: 'AB82', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    }, */
    {
      id: 'ArkveldEx Rush',
      type: 'StartsUsing',
      // AB85가 전체 돌진이고
      // AB84은 진짜 돌진 (3번 발생)
      netRegex: { id: 'AB85' },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      countdownSeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Boss Rush',
          ko: '3단 도넛 돌진!',
        },
      },
    },
    {
      id: 'ArkveldEx Wild Energy',
      type: 'HeadMarker',
      netRegex: { id: '0065', capture: false },
      suppressSeconds: 1,
      run: (data) => data.wildEnergy = true,
    },
    {
      id: 'ArkveldEx Wyvern\'s Ouroblade',
      type: 'StartsUsing',
      netRegex: { id: ['AB8C', 'AB8E', 'B031', 'B032'] },
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: 'Go ${direction}',
            ko: '보스의 ${direction}으로',
          },
          spread: {
            en: 'Spread on ${direction}',
            ko: '보스 ${direction}에서 흩어져요',
          },
          left: Outputs.left,
          right: Outputs.right,
        };
        const dir = matches.id === 'AB8E' || matches.id === 'B032'
          ? output.left!()
          : output.right!();
        if (data.wildEnergy)
          return { alertText: output.spread!({ direction: dir }) };
        return { infoText: output.text!({ direction: dir }) };
      },
      run: (data) => data.wildEnergy = false,
    },
    {
      id: 'ArkveldEx Steeltail Thrust',
      type: 'StartsUsing',
      netRegex: { id: ['ABAD', 'B035'], capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Front / Sides',
          ko: '꼬리치기 피해요',
        },
      },
    },
    {
      id: 'ArkveldEx Chainblade Charge',
      type: 'StartsUsing',
      netRegex: { id: 'ABAB', capture: false },
      response: Responses.getTogether(),
    },
    {
      id: 'ArkveldEx Aetheric Resonance',
      type: 'StartsUsing',
      netRegex: { id: 'AB8F', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.resonance = 0,
      outputStrings: {
        text: {
          en: 'Spread for towers',
          ko: '타워 위치로!',
        },
      },
    },
    {
      id: 'ArkveldEx Guardian Resonance',
      type: 'StartsUsing',
      netRegex: { id: 'AB93', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        data.resonance++;
        if (data.resonance !== 3)
          return;
        return output.tower!();
      },
      outputStrings: {
        tower: {
          en: 'Get towers',
          ko: '타워 밟아요!',
        },
      },
    },
    {
      id: 'ArkveldEx Forged Fury',
      type: 'StartsUsing',
      netRegex: { id: 'AB9E', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'ArkveldEx Dice',
      type: 'HeadMarker',
      netRegex: { id: Object.keys(diceMap) },
      condition: (data, matches) => data.me === matches.target,
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        data.dice = diceMap[matches.id];
        if (!data.dice)
          return;
        if (data.dice < 5)
          return output.lower!({ num: data.dice });
        const lower = data.dice - 4;
        return output.upper!({ num: data.dice, lower: lower });
      },
      outputStrings: {
        lower: {
          en: 'Dice ${num}',
          ko: '주사위 ${num}',
        },
        upper: {
          en: 'Dice ${num} (${lower})',
          ko: '주사위 ${num} (${lower})',
        },
      },
    },
    {
      id: 'ArkveldEx Clamorous Chase',
      type: 'StartsUsing',
      // ABB3 정시계, 1이 오른쪽
      // ABB6 반시계, 1이 왼쪽
      netRegex: { id: ['ABB3', 'ABB6'] },
      delaySeconds: 0.5,
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cw1: { en: 'East', ko: '오른쪽🡆으로' },
          cw2: { en: 'South', ko: '남쪽🡇으로' },
          cw3: { en: 'West', ko: '왼쪽🡄으로' },
          cw4: { en: 'North', ko: '북쪽🡅으로' },
          ccw1: { en: 'West', ko: '왼쪽🡄으로' },
          ccw2: { en: 'South', ko: '남쪽🡇으로' },
          ccw3: { en: 'East', ko: '오른쪽🡆으로' },
          ccw4: { en: 'North', ko: '북쪽🡅으로' },
          others: { en: 'Go center', ko: '한가운데서 대기' },
        };
        if (data.dice === undefined)
          return;
        data.chaseDir = matches.id === 'ABB3' ? 'cw' : 'ccw';
        if (data.dice > 4)
          return { infoText: output.others!() };
        const res = `${data.chaseDir}${data.dice}` as const;
        return { alertText: output[res]!() };
      },
      run: (data) => data.chases = 0,
    },
    {
      id: 'ArkveldEx Chase Dice',
      type: 'StartsUsing',
      netRegex: { id: ['ABB5', 'ABB8'], capture: false },
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cw5: { en: 'East', ko: '오른쪽🡆으로' },
          cw6: { en: 'South', ko: '남쪽🡇으로' },
          cw7: { en: 'West', ko: '왼쪽🡄으로' },
          cw8: { en: 'North', ko: '북쪽🡅으로' },
          ccw5: { en: 'West', ko: '왼쪽🡄으로' },
          ccw6: { en: 'South', ko: '남쪽🡇으로' },
          ccw7: { en: 'East', ko: '오른쪽🡆으로' },
          ccw8: { en: 'North', ko: '북쪽🡅으로' },
          avoid: {
            en: 'Avoid!',
            ko: '한가운데로 피해욧!',
          },
        };
        if (data.dice === undefined)
          return;
        data.chases++;
        if (data.chases === data.dice)
          return { infoText: output.avoid!() };
        if ((data.chases + 4) === data.dice) {
          const res = `${data.chaseDir}${data.dice}` as const;
          return { alertText: output[res]!() };
        }
      },
    },
    {
      id: 'ArkveldEx Weal Beam',
      type: 'HeadMarker',
      netRegex: { id: '01D6' },
      durationSeconds: 5,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          beamMe: {
            en: 'Beam on YOU',
            ko: '나에게 빔!',
          },
          partyMove: {
            en: '(Avoid beam)',
            ko: '(빔 피해요)',
          },
        };
        if (data.me === matches.target) {
          return { alertText: output.beamMe!() };
        }
        return { infoText: output.partyMove!() };
      },
    },
    {
      id: 'ArkveldEx Wrathful Rattle',
      type: 'StartsUsing',
      netRegex: { id: 'ABA7', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Waves',
          ko: '연속 물결 장판',
        },
      },
    },
    {
      id: 'ArkveldEx Roar + Exaflare',
      type: 'StartsUsing',
      netRegex: { id: 'ABAF', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'AoE + Exaflare',
          ko: '전체 공격 🔜 엑사플레어',
        },
      },
    },
  ],
};

export default triggerSet;

// 추출: StartsCasting 14:([^:]*):Guardian Arkveld:([^:]*)
