import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  silkieSuds?: 'green' | 'blue' | 'yellow';
  gladRushes: number[];
  gladMyEcho: number;
  gladLingWho?: string;
  gladThunWho?: string;
}

export const vaStrings = {
  unknown: Outputs.unknown,
  num1: '①',
  num2: '②',
  num3: '③',
} as const;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AnotherSildihnSubterrane,
  initData: () => {
    return {
      gladRushes: [],
      gladMyEcho: 0,
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
      netRegex: NetRegexes.startsUsing({ id: '7962' }),
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
      netRegex: NetRegexes.startsUsing({ id: '7959' }),
      infoText: (data, matches, output) => {
        if (matches.target !== undefined)
          return output.aoewho!({ who: data.ShortName(matches.target) });
        return output.aoecmn!();
      },
      outputStrings: {
        aoewho: '장판 깔았네: ${who}',
        aoecmn: '아무에게 장판 깔았네',
      },
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
      netRegex: NetRegexes.startsUsing({ id: '774F', source: 'Silkie' }),
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
      netRegex: NetRegexes.startsUsing({ id: '7757', source: 'Silkie' }),
      infoText: '초록🟢 꼬리',
      run: (data) => data.silkieSuds = 'green',
    },
    // 실키: Chilling Suds
    {
      id: 'AS+ 실키 Chilling Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7758', source: 'Silkie' }),
      infoText: '파랑🔵 꼬리',
      run: (data) => data.silkieSuds = 'blue',
    },
    // 실키: Fizzling Suds
    {
      id: 'AS+ 실키 Fizzling Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7759', source: 'Silkie' }),
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
      netRegex: NetRegexes.startsUsing({ id: '776D', source: 'Silkie' }),
      infoText: '물 항아리 나오는 곳 확인해요',
    },
    // 실키: Soap's Up <- Fizzling Suds (775Dx4가 부채꼴)
    {
      id: 'AS+ 실키 Fizzling:Soaps',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775A', source: 'Silkie' }),
      alertText: '비스듬히 부채꼴🟡',
    },
    // 실키: Slippery Soap
    {
      id: 'AS+ 실키 Slippery Soap',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775E', source: 'Silkie' }),
      alertText: (data, _matches, outputs) => {
        if (data.silkieSuds === 'blue')
          return outputs.blue!();
        return outputs.text!();
      },
      outputStrings: {
        text: '한줄로 서요',
        blue: '한줄로 서고, 계속 움직여요!',
      },
    },
    // 실키: Slippery Soap Run
    {
      id: 'AS+ 실키 Slippery Soap Run',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775E', source: 'Silkie' }),
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
        yellow: '비스듬 부채꼴 → 위치로!',
        none: '색깔 기믹 처리해요',
      },
    },
    // 실키: Soaping Spree -> 앞꼬리 먼지 확인해야하나
    {
      id: 'AS+ 실키 Soaping Spree',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7767', source: 'Silkie', capture: false }),
      alertText: '곧 터져요! 위치 확인',
    },
    // 실키: Bracing Duster
    {
      id: 'AS+ 실키 Bracing Duster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7769', source: 'Silkie', capture: false }),
      response: Responses.getUnder(),
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 그라디아토르: Flash of Steel
    {
      id: 'AS++ 그라디아토르 Flash of Steel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7671', source: 'Gladiator of Sil\'dih', capture: false }),
      response: Responses.aoe(),
    },
    // 그라디아토르: Sculptor's Passion
    {
      id: 'AS++ 그라디아토르 Sculptor\'s Passion',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '766C', source: 'Gladiator of Sil\'dih', capture: false }),
      alertText: '보스 엉댕이에 한줄로 서욧',
    },
    // 그라디아토르: Mighty Smite
    {
      id: 'AS++ 그라디아토르 Mighty Smite',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7672', source: 'Gladiator of Sil\'dih' }),
      response: Responses.tankBuster(),
    },
    // 그라디아토르: Specter of Might
    {
      id: 'AS++ 그라디아토르 Specter of Might',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7673', source: 'Gladiator of Sil\'dih', capture: false }),
      infoText: '러시 미라쥬 순번 확인 하셈!',
      run: (data) => data.gladRushes = [],
    },
    // 그라디아토르: Rush of Might
    {
      id: 'AS+ 그라디아토르 Rush of Might',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7658', '7659', '765A'], source: 'Gladiator Mirage' }),
      durationSeconds: 8,
      infoText: (data, matches, output) => {
        const i2n: { [id: string]: number } = {
          '7658': 1,
          '7659': 2,
          '765A': 3,
        };
        data.gladRushes.push(i2n[matches.id] ?? 0);
        if (data.gladRushes.length !== 2)
          return;

        if (data.gladRushes[0] === undefined || data.gladRushes[1] === undefined)
          return output.unknown!();

        const n2s: { [id: number]: string } = {
          1: output.num1!(),
          2: output.num2!(),
          3: output.num3!(),
        };
        return output.rush!({ num1: n2s[data.gladRushes[0]], num2: n2s[data.gladRushes[1]] });
      },
      outputStrings: {
        rush: '${num1} + ${num2}',
        num1: vaStrings.num1,
        num2: vaStrings.num2,
        num3: vaStrings.num3,
        unknown: vaStrings.unknown,
      },
    },
    /* // 그라디아토르: Curse of the Fallen
    {
      id: 'AS+ 그라디아토르 Curse of the Fallen',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7674', source: 'Gladiator of Sil\'dih', capture: false }),
      infoText: '저주 확인',
    },*/
    //
    {
      id: 'AS+ 그라디아토르: Lingering Echoes',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDC' }),
      run: (data, matches) => data.gladLingWho = matches.target,
    },
    //
    {
      id: 'AS+ 그라디아토르: Thunderous Echo',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDD' }),
      delaySeconds: 0.2,
      run: (data, matches) => data.gladThunWho = matches.target,
    },
    //
    {
      id: 'AS+ 그라디아토르: Thunderous Echo Stack',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDD' }),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      infoText: (data, _matches, output) => {
        if (data.gladLingWho === data.me)
          return;
        if (data.gladThunWho === data.me)
          return output.itsme!();
        return output.text!({ who: data.ShortName(data.gladThunWho) });
      },
      outputStrings: {
        text: '뭉쳐요: ${who}',
        itsme: '내게 뭉쳐요',
      },
    },
    //
    {
      id: 'AS+ 그라디아토르: Echo of the Fallen',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDA' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.4,
      durationSeconds: 17,
      alertText: (data, matches, output) => {
        if (data.gladLingWho === data.me)
          return output.spread!();
        const thun = (data.gladThunWho === data.me) ? output.itsme!() : data.ShortName(data.gladThunWho);
        data.gladMyEcho = parseInt(matches.duration);
        if (data.gladMyEcho > 16) // 정확히는 17초
          return output.s17!({ who: thun });
        if (data.gladMyEcho > 13) // 정확히는 14초
          return output.s14!({ who: thun });
        return output.unknown!();
      },
      outputStrings: {
        s17: '🡸뭉쳤다 → 흩어져요 (${who})',
        s14: '흩어졌다 → 뭉쳐요🡸 (${who})',
        itsme: '내가 뭉치기',
        spread: '내가 링거, 🡺오른쪽에서 홀로',
        unknown: vaStrings.unknown,
      },
    },
    //
    {
      id: 'AS+ 그라디아토르: Echo of the Fallen Spread',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDA' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      infoText: (data, _matches, output) => {
        if (data.gladLingWho !== data.me)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    // 그라디아토르: Ring of Might
    {
      id: 'AS+ 그라디아토르 Ring of Might',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '765[D-F]', source: 'Gladiator of Sil\'dih' }),
      durationSeconds: 7,
      infoText: (_data, matches, output) => {
        const i2s: { [id: string]: string } = {
          '765D': output.num1!(),
          '765E': output.num2!(),
          '765F': output.num2!(),
        };
        return output.ring!({ num: i2s[matches.id] });
      },
      outputStrings: {
        ring: '링 차지 ${num}',
        num1: vaStrings.num1,
        num2: vaStrings.num2,
        num3: vaStrings.num3,
      },
    },
    /* // 그라디아토르: Hateful Visage
    {
      id: 'AS++ 그라디아토르 Hateful Visage',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '766E', source: 'Gladiator of Sil\'dih', capture: false }),
      infoText: '얼굴들 나와요',
    },*/
    // 그라디아토르: Wrath of Ruin
    {
      id: 'AS++ 그라디아토르 Wrath of Ruin',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7663', source: 'Gladiator of Sil\'dih', capture: false }),
      alertText: '얼굴 빔 + ▦ 피해요',
    },
    // [19:37:17.096] StartsCasting 14:4000F858:Gladiator of Sil'dih:768B:Nothing beside Remains:4000F858:Gladiator of Sil'dih:4.700:-35.02:-271.02:521.00:3.14
    // [19:37:17.096] StartsCasting 14:4000F86A:Gladiator of Sil'dih:768C:Nothing beside Remains:1034C993:Pu Ru:4.700:-35.00:-271.00:521.00:-3.14
  ],
};

export default triggerSet;
