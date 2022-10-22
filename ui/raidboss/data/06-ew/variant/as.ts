import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  dummy: boolean;
  silkieSuds?: 'green' | 'blue' | 'yellow';
}

export const vaStrings = {
  unknown: Outputs.unknown,
  num1: '❶',
  num2: '❷',
  num3: '❸',
} as const;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AnotherSildihnSubterrane,
  initData: () => {
    return {
      dummy: true,
    };
  },
  triggers: [
    // ///////////////////////////////////////////////////////////////////////////////
    // 쫄: 왼쪽으로
    {
      id: 'AS+ 쫄 왼쪽으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7963', '795C'], capture: false }),
      infoText: '왼쪽🡸',
    },
    // 쫄: 오른쪽으로
    {
      id: 'AS+ 쫄 오른쪽으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7964', '795B'], capture: false }),
      infoText: '🡺오른쪽',
    },
    // 쫄: 전방 범위
    {
      id: 'AS+ 쫄 전방범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7965', '795D'], capture: false }),
      infoText: '앞쪽 범위 공격',
    },
    // 쫄: 발밑으로
    {
      id: 'AS+ 쫄 발밑으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7960', capture: false }),
      infoText: '발 밑으로',
    },
    // 쫄: 시선 주의
    {
      id: 'AS+ 쫄 시선주의',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7961', capture: false }),
      alertText: '시선 조심!',
    },
    // 쫄: 버스터
    {
      id: 'AS+ 쫄 버스터',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7962', capture: false }),
      response: Responses.tankBuster(),
    },
    // 쫄: 원형범위
    {
      id: 'AS+ 쫄 원형범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7957', '7966'], capture: false }),
      response: Responses.getOut(),
    },
    // 쫄: 란타게범위
    {
      id: 'AS+ 쫄 란타게 범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7959', capture: false }),
      infoText: '아무나 찝어 장판',
    },
    // 쫄: 범위
    {
      id: 'AS+ 쫄 범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795A', capture: false }),
      infoText: '쫄 범위 공격',
    },
    // 쫄: 자기 강화
    {
      id: 'AS+ 쫄 자기 강화',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7968', capture: false }),
      infoText: '자기 강화',
    },
    // 쫄: 전체 페인
    {
      id: 'AS+ 쫄 전체 페인',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7969', capture: false }),
      alertText: '전체 아픈 도트',
    },
    // 쫄:
    {
      id: 'AS+ 쫄 헤비',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796B', capture: false }),
      alertText: '헤비',
    },
    // 쫄: 체력 1로
    {
      id: 'AS+ 쫄 HP1로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796C', capture: false }),
      alarmText: '체력을 1로!',
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 실키: 왼쪽으로
    {
      id: 'AS+ 실키 Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7755', source: 'Silkie', capture: false }),
      infoText: '왼쪽🡸',
    },
    // 실키: 오른쪽으로
    {
      id: 'AS+ 실키 Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7756', source: 'Silkie', capture: false }),
      infoText: '🡺오른쪽',
    },
    // 실키: Dust Bluster
    {
      id: 'AS+ 실키 Dust Bluster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '776C', source: 'Silkie', capture: false }),
      response: Responses.knockback(),
    },
    // 실키: Carpet Beater
    {
      id: 'AS+ 실키 Carpet Beater',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '774F', source: 'Silkie', capture: false }),
      response: Responses.tankBuster(),
    },
    // 실키: Total Wash
    {
      id: 'AS+ 실키 Total Wash',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7750', source: 'Silkie', capture: false }),
      response: Responses.aoe(),
    },
    // 실키: Bracing Suds
    {
      id: 'AS+ 실키 Bracing Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7757', source: 'Silkie', capture: false }),
      infoText: '초록🟢 꼬리',
      run: (data) => data.silkieSuds = 'green',
    },
    // 실키: Chilling Suds
    {
      id: 'AS+ 실키 Chilling Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7758', source: 'Silkie', capture: false }),
      infoText: '파랑🔵 꼬리',
      run: (data) => data.silkieSuds = 'blue',
    },
    // 실키: Fizzling Suds
    {
      id: 'AS+ 실키 Fizzling Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7759', source: 'Silkie', capture: false }),
      infoText: '노랑🟡 꼬리',
      run: (data) => data.silkieSuds = 'yellow',
    },
    // 실키: Fresh Puff
    // 1=3, 2=4, 3=8, 4=4
    {
      id: 'AS+ 실키 Fresh Puff',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7766', source: 'Silkie', capture: false }),
      infoText: '솜털 나와요~',
    },
    // 실키: Eastern Ewers
    {
      id: 'AS+ 실키 Eastern Ewers',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '776D', source: 'Silkie', capture: false }),
      infoText: '물 항아리 나오는 곳 확인해요',
    },
    // 실키: Soap's Up <- Fizzling Suds (775Dx4가 부채꼴)
    {
      id: 'AS+ 실키 Fizzling:Soaps',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775A', source: 'Silkie', capture: false }),
      infoText: '비스듬히 부채꼴🟡',
    },
    // 실키: Slippery Soap
    {
      id: 'AS+ 실키 Slippery Soap',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775E', source: 'Silkie', capture: false }),
      infoText: (data, _matches, outputs) => {
        if (data.silkieSuds === 'blue')
          return outputs.blue!();
        return outputs.text!();
      },
      outputStrings: {
        text: '한줄로 서요 (걸린사람 맨뒤)',
        blue: '한줄로 서고, 계속 움직여요!',
      },
    },
    // 실키: Slippery Soap Run
    {
      id: 'AS+ 실키 Slippery Soap Run',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775E', source: 'Silkie', capture: false }),
      delaySeconds: 7,
      alertText: (data, _matches, outputs) => {
        if (data.silkieSuds === 'blue')
          return outputs.blue!();
        else if (data.silkieSuds === 'green')
          return outputs.green!();
        else if (data.silkieSuds === 'yellow')
          return outputs.yellow!();
        return outputs.none!();
      },
      run: (data) => delete data.silkieSuds,
      outputStrings: {
        blue: '십자 장판 피해요',
        green: '보스 아래로 들어가요',
        yellow: '비스듬 부채꼴 피해요',
        none: '색깔 기믹 처리해요',
      },
    },
    // 실키: Soaping Spree -> 앞꼬리 먼지 확인해야하나
    {
      id: 'AS+ 실키 Soaping Spree',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7767', source: 'Silkie', capture: false }),
      infoText: '곧 터져요! 위치 확인',
    },
    // 실키: Bracing Duster
    {
      id: 'AS+ 실키 Bracing Duster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7769', source: 'Silkie', capture: false }),
      response: Responses.getUnder(),
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 그라디아토르: 차지
    /* {
        id: 'AS+ 그라디아토르 차지123',
        type: 'StartsUsing',
        netRegex: NetRegexes.startsUsing({ id: '765[89AD-F]', source: 'Gladiator of Sil\'dih', capture: false }),
        durationSeconds: 8,
        alertText: (data, _matches) => {
          const id = data.id;
          if (id === '7658' || id === '765D')
            return '차지 ❶';
          else if (id === '7659' || id === '765E')
            return '차지 ❷';
          else if (id === '765A' || id === '765F')
            return '차지 ❸';
          else
            return '차지인데 몇일까?!';
        },
    },*/
    // 그라디아토르: Ring of Might 1
    {
      id: 'AS+ 그라디아토르 Ring of Might 1',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7658', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '링 차지 ❶',
    },
    // 그라디아토르: Ring of Might 2
    {
      id: 'AS+ 그라디아토르 Ring of Might 2',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7659', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '링 차지 ❷',
    },
    // 그라디아토르: Ring of Might 3
    {
      id: 'AS+ 그라디아토르 Ring of Might 3',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '765A', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '링 차지 ❸',
    },
    // 그라디아토르: Rush of Might 1
    {
      id: 'AS+ 그라디아토르 Rush of Might 1',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '765D', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '러시 차지 ❶',
    },
    // 그라디아토르: Rush of Might 2
    {
      id: 'AS+ 그라디아토르 Rush of Might 2',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '765E', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '러시 차지 ❷',
    },
    // 그라디아토르: Rush of Might 3
    {
      id: 'AS+ 그라디아토르 Rush of Might 3',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '765F', source: 'Gladiator of Sil\'dih', capture: false }),
      durationSeconds: 8,
      infoText: '러시 차지 ❸',
    },
  ],
};

export default triggerSet;
