import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export type Banishment = 'redLeft' | 'redRight' | 'blueLeft' | 'blueRight';

export interface Data extends RaidbossData {
  silkieSuds?: 'green' | 'blue' | 'yellow';
  silkieSoap: number;
  silkieClean: number;
  silkieFreshPuff: number;
  gladMyTime: number;
  gladRushCount: number;
  gladRushNum: number[];
  gladRushCast: (NetMatches['StartsUsing'])[];
  gladLinger?: string;
  gladThunder?: string;
  gladVisage?: 'hateful' | 'accursed';
  gladExplosion: number;
  gahBrandPhase: number;
  gahMyBrand: number;
  gahMagicv: string[];
  gahBanishment?: Banishment;
}

export const getRushOffset = (x: number) => {
  if ((x > -46 && x < -43) || (x > -27 && x < -24))
    return 3;
  if ((x > -41 && x < -38) || (x > -32 && x < -29))
    return 2;
  if (x > -37 && x < -33)
    return 1;
  return x;
};

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AnotherSildihnSubterrane,
  timelineFile: 'as.txt',
  initData: () => {
    return {
      silkieSoap: 0,
      silkieFreshPuff: 0,
      silkieClean: 0,
      gladMyTime: 0,
      gladRushCount: 0,
      gladRushNum: [],
      gladRushCast: [],
      gladExplosion: 0,
      gahBrandPhase: 0,
      gahMyBrand: 0,
      gahMagicv: [],
    };
  },
  triggers: [
    // ///////////////////////////////////////////////////////////////////////////////
    // Aqueduct Kaluk: 왼쪽으로
    {
      id: 'AS+ Aqueduct Kaluk 왼쪽으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7963', source: 'Aqueduct Kaluk', capture: false }),
      infoText: '왼쪽🡸',
    },
    // Aqueduct Kaluk: 오른쪽으로
    {
      id: 'AS+ Aqueduct Kaluk 오른쪽으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7964', source: 'Aqueduct Kaluk', capture: false }),
      infoText: '🡺오른쪽',
    },
    // Aqueduct Kaluk: 전방 범위
    {
      id: 'AS+ Aqueduct Kaluk 전방범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7965', source: 'Aqueduct Kaluk', capture: false }),
      infoText: '앞쪽 범위 공격',
    },
    // Aqueduct Udumbara: 왼쪽으로
    {
      id: 'AS+ Aqueduct Udumbara 왼쪽으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795C', source: 'Aqueduct Udumbara', capture: false }),
      infoText: '왼쪽🡸',
    },
    // Aqueduct Udumbara: 오른쪽으로
    {
      id: 'AS+ Aqueduct Udumbara 오른쪽으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795B', source: 'Aqueduct Udumbara', capture: false }),
      infoText: '🡺오른쪽',
    },
    // Aqueduct Udumbara: 전방 범위
    {
      id: 'AS+ Aqueduct Udumbara 전방범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795D', source: 'Aqueduct Udumbara', capture: false }),
      infoText: '앞쪽 범위 공격',
    },
    // Aqueduct Belladonna: 발밑으로
    {
      id: 'AS+ Aqueduct Belladonna 발밑으로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7960', source: 'Aqueduct Belladonna', capture: false }),
      response: Responses.getIn(),
    },
    // Aqueduct Belladonna: 시선 주의
    {
      id: 'AS+ Aqueduct Belladonna 시선주의',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7961', source: 'Aqueduct Belladonna', capture: false }),
      response: Responses.lookAway(),
    },
    // Aqueduct Belladonna: 버스터
    {
      id: 'AS+ Aqueduct Belladonna 버스터',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7962', source: 'Aqueduct Belladonna' }),
      response: Responses.tankBuster(),
    },
    // Aqueduct Dryad: 원형범위
    {
      id: 'AS+ Aqueduct Dryad 원형범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7957', source: 'Aqueduct Dryad', capture: false }),
      response: Responses.getOut(),
    },
    // Sil'dihn Dullahan 원형범위
    {
      id: 'AS+ Sil\'dihn Dullahan 원형범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7966', source: 'Sil\'dihn Dullahan', capture: false }),
      response: Responses.getOut(),
    },
    // Sil'dihn Dullahan: 전체 페인
    {
      id: 'AS+ Sil\'dihn Dullahan 전체 페인',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7969', source: 'Sil\'dihn Dullahan', capture: false }),
      alertText: '전체 공격 + 출혈',
    },
    // Sil'dihn Dullahan: 자기 강화
    {
      id: 'AS+ Sil\'dihn Dullahan 자기 강화',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7968', source: 'Sil\'dihn Dullahan', capture: false }),
      infoText: '자기 강화',
    },
    // Aqueduct Armor: 헤비
    {
      id: 'AS+ Aqueduct Armor 헤비',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796B', source: 'Aqueduct Armor', capture: false }),
      alertText: '헤비, 발 밑으로',
    },
    // Aqueduct Armor: 체력 1로
    {
      id: 'AS+ Aqueduct Armor HP1로',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796C', source: 'Aqueduct Armor', capture: false }),
      alarmText: '체력을 1로!',
    },
    // Aqueduct Armor: 슬래시
    {
      id: 'AS+ Aqueduct Armor 슬래시',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796A', source: 'Aqueduct Armor', capture: false }),
      response: Responses.getBehind(),
    },
    // 쫄: 란타게범위
    {
      id: 'AS+ 쫄 란타게 범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7959', capture: false }),
      infoText: '아무에게 장판 깔았네',
    },
    // 쫄: 범위
    {
      id: 'AS+ 쫄 범위',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795A', capture: false }),
      infoText: '쫄 범위 공격',
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 실키: 왼쪽으로
    {
      id: 'AS+ 실키 Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7751', '7755'], source: 'Silkie', capture: false }),
      infoText: (data, _matches, output) => {
        data.silkieClean++;
        if (data.silkieClean === 1)
          return output.left!();
      },
      outputStrings: {
        left: '왼쪽🡸',
      },
    },
    // 실키: 오른쪽으로
    {
      id: 'AS+ 실키 Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7752', '7756'], source: 'Silkie', capture: false }),
      infoText: (data, _matches, output) => {
        data.silkieClean++;
        if (data.silkieClean === 1)
          return output.right!();
      },
      outputStrings: {
        right: '🡺오른쪽',
      },
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
      infoText: '전체 공격 + 출혈',
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
      netRegex: NetRegexes.startsUsing({ id: '7766', source: 'Silkie' }),
      preRun: (data) => {
        data.silkieClean = 0;
        data.silkieFreshPuff++;
      },
      infoText: (data, _matches, output) => {
        if (data.silkieFreshPuff === 1)
          return output.p1!();
        else if (data.silkieFreshPuff === 2)
          return output.p2!();
        else if (data.silkieFreshPuff === 3)
          return output.p3!();
        else if (data.silkieFreshPuff === 4)
          return output.p4!();
        return output.px!();
      },
      outputStrings: {
        p1: '솜털 세개 → 꼬리치기',
        p2: '솜털 네개, 안전지대 만들어요',
        p3: '솜털 여덟개, 화이팅이요',
        p4: '솜털 네개 → 꼬리 방향으로 유도',
        px: '솜털 나와요',
      },
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
      alertText: '🟡비스듬한 부채꼴',
    },
    // 실키: Slippery Soap
    {
      id: 'AS+ 실키 Slippery Soap',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '79FB', source: 'Silkie' }),
      preRun: (data) => data.silkieSoap++,
      alertText: (data, matches, output) => {
        if (data.silkieSuds === 'green') {
          if (matches.target === data.me)
            return output.kbBack!();
          return output.kbFront!({ player: data.ShortName(matches.target) });
        }
        if (matches.target === data.me) {
          if (data.silkieSoap === 1)
            return output.puff!();
          if (data.silkieSoap === 3)
            return output.puffEw!();
          return output.behind!();
        }
        return output.front!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        kbFront: '넉백! ${player} 앞에 서주세요',
        kbBack: '넉백! 맨 뒤에 서주세요',
        puff: '구슬과 맨 뒤에 서주세요',
        puffEw: '구슬과 맨 뒤에 서주세요 (동서)',
        behind: '맨 뒤에 서주세요',
        front: '${player} 앞에 서주세요',
      },
    },
    // 실키: Slippery Soap Blue
    {
      id: 'AS+ 실키 Slippery Soap Blue',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775E', source: 'Silkie' }),
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      alertText: (data, _matches, outputs) => {
        if (data.silkieSuds === 'blue')
          return outputs.blue!();
        return outputs.text!();
      },
      outputStrings: {
        text: '한줄로 서요',
        blue: '한줄로 서고, 🔵계속 움직여요!',
      },
    },
    // 실키: Slippery Soap Run
    {
      id: 'AS+ 실키 Slippery Soap Run',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '775E', source: 'Silkie', capture: false }),
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
        blue: '🔵십자 장판 피해요',
        green: '🟢보스 아래로 들어가요',
        yellow: '🟡비스듬 부채꼴 → 위치로!',
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
    // 그라디아토르: Sculptor's Passion(766C), 대상자(6854)
    {
      id: 'AS++ 그라디아토르 Sculptor\'s Passion',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '6854', source: 'Gladiator of Sil\'dih' }),
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.itsme!();
        return output.target!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        target: '${player}에게 돌진! 보스 엉댕이에 한줄로',
        itsme: '내게 돌진! 보스 엉댕이에 한줄로',
      },
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
      // infoText: '러시 미라쥬 순번 확인 하셈!',
      run: (data) => data.gladRushNum = [],
    },
    // 그라디아토르: Rush of Might
    {
      id: 'AS+ 그라디아토르 Rush of Might',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7658', '7659', '765A'], source: 'Gladiator Mirage' }),
      preRun: (data) => data.gladRushCount++,
      durationSeconds: 9.4,
      infoText: (data, matches, output) => {
        const i2n: { [id: string]: number } = {
          '7658': 1,
          '7659': 2,
          '765A': 3,
        };
        data.gladRushNum.push(i2n[matches.id] ?? 0);
        if (data.gladRushNum.length !== 2)
          return;

        if (data.gladRushNum[0] === undefined || data.gladRushNum[1] === undefined)
          return output.unknown!();

        const n2s: { [id: number]: string } = {
          0: output.unknown!(),
          1: output.num1!(),
          2: output.num2!(),
          3: output.num3!(),
        };
        return output.rush!({ num1: n2s[data.gladRushNum[0]], num2: n2s[data.gladRushNum[1]] });
      },
      outputStrings: {
        rush: '${num1} + ${num2}',
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        unknown: Outputs.unknown,
      },
    },
    // 그라디아토르: Rush of Might 위치
    {
      id: 'AS+ 그라디아토르 Rush of Might Collect',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['765C', '765B'], source: 'Gladiator of Sil\'dih' }),
      preRun: (data, matches) => data.gladRushCast.push(matches),
    },
    // 그라디아토르: Rush of Might 1
    {
      id: 'AS+ 그라디아토르 Rush of Might 1',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['765C', '765B'], source: 'Gladiator of Sil\'dih', capture: false }),
      delaySeconds: 0.1,
      durationSeconds: 9.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.gladRushCast.length !== 4)
          return;

        const mirage1 = data.gladRushCast[0];
        const unkmir1 = data.gladRushCast[1];
        const unkmir2 = data.gladRushCast[2];
        if (mirage1 === undefined || unkmir1 === undefined || unkmir2 === undefined)
          throw new UnreachableCode();
        const mirage2 = (mirage1.x === unkmir1.x && mirage1.y === unkmir1.y) ? unkmir2 : unkmir1;

        const x1 = parseFloat(mirage1.x);
        const y1 = parseFloat(mirage1.y);
        const x2 = parseFloat(mirage2.x);
        const y2 = parseFloat(mirage2.y);
        const o1 = getRushOffset(x1);
        const o2 = getRushOffset(x2);
        const line = o1 > o2 ? o1 : o2;

        let dir;
        if (y1 < -271) {
          const x = y1 < y2 ? x1 : x2;
          dir = x < -35 ? 'west' : 'east';
        } else {
          const x = y1 > y2 ? x1 : x2;
          dir = x < -35 ? 'west' : 'east';
        }

        const dir2left: { [id: number]: string } = {
          1: output.l1!(),
          2: output.l2!(),
          3: output.l3!(),
        };
        const dir2right: { [id: number]: string } = {
          1: output.r1!(),
          2: output.r2!(),
          3: output.r3!(),
        };
        const even = (data.gladRushCount % 4) === 0;

        let arrow;
        let side;
        if ((o1 === 2 && o2 === 3) || (o1 === 3 && o2 === 2)) {
          if (dir === 'west') {
            side = 'east';
            arrow = even ? dir2right[line] : dir2left[line];
          } else {
            side = 'west';
            arrow = even ? dir2left[line] : dir2right[line];
          }
        } else {
          if (dir === 'west') {
            side = 'west';
            arrow = even ? dir2right[line] : dir2left[line];
          } else {
            side = 'east';
            arrow = even ? dir2left[line] : dir2right[line];
          }
        }

        if (even)
          return output.rushrev!({ arrow: arrow, side: output[side]!() });
        return output.rush!({ arrow: arrow, side: output[side]!() });
      },
      run: (data) => data.gladRushCast = [],
      outputStrings: {
        rush: '${arrow} ${side}',
        rushrev: '${arrow} ${side} (남쪽보고)',
        east: Outputs.right,
        west: Outputs.left,
        l1: '🡸',
        l2: '🡸🡸',
        l3: '🡸🡸🡸',
        r1: '🡺',
        r2: '🡺🡺',
        r3: '🡺🡺🡺',
      },
    },
    // 그라디아토르: Rush of Might 2
    {
      id: 'AS+ 그라디아토르 Rush of Might 2',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '765B', source: 'Gladiator of Sil\'dih', capture: false }),
      suppressSeconds: 1,
      response: Responses.moveAway(),
    },
    //
    {
      id: 'AS+ 그라디아토르 Lingering Echoes Collect',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDC' }),
      run: (data, matches) => data.gladLinger = matches.target,
    },
    //
    {
      id: 'AS+ 그라디아토르 Thunderous Echo Collect',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDD' }),
      run: (data, matches) => data.gladThunder = matches.target,
    },
    //
    {
      id: 'AS+ 그라디아토르 Thunderous Echo Stack',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDD' }),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      infoText: (data, matches, output) => {
        if (data.gladLinger === data.me)
          return output.spread!();
        if (matches.target === data.me)
          return output.itsme!();
        return output.stack!({ player: data.ShortName(data.gladThunder) });
      },
      outputStrings: {
        stack: Outputs.stackOnPlayer,
        itsme: Outputs.stackOnYou,
        spread: Outputs.spread,
      },
    },
    //
    {
      id: 'AS+ 그라디아토르 Echo of the Fallen',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDA' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.2,
      durationSeconds: 17,
      alertText: (data, matches, output) => {
        if (data.gladLinger === data.me)
          return output.spread!();
        const thun = (data.gladThunder === data.me) ? output.itsme!() : data.ShortName(data.gladThunder);
        data.gladMyTime = parseInt(matches.duration);
        if (data.gladMyTime === 17)
          return output.s17!({ player: thun });
        if (data.gladMyTime === 14)
          return output.s14!({ player: thun });
        return output.unknown!();
      },
      outputStrings: {
        s17: '뭉쳤다 → 흩어져요 (${player})',
        s14: '흩어졌다 → 뭉쳐요 (${player})',
        itsme: '내가 뭉치기',
        spread: '내가 링거, 홀로 있어야 해요',
        unknown: Outputs.unknown,
      },
    },
    //
    {
      id: 'AS+ 그라디아토르 Echo of the Fallen Spread',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDA' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      response: Responses.spread(),
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
          '765F': output.num3!(),
        };
        return output.ring!({ num: i2s[matches.id] });
      },
      outputStrings: {
        ring: '링 차지 ${num}',
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
      },
    },
    // 그라디아토르: Hateful Visage
    {
      id: 'AS++ 그라디아토르 Hateful Visage',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '766E', source: 'Gladiator of Sil\'dih', capture: false }),
      preRun: (data) => data.gladVisage = 'hateful',
      infoText: '얼굴들 나와요 (▦만)',
    },
    // 그라디아토르: Accursed Visage
    {
      id: 'AS++ 그라디아토르 Accursed Visage',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '768D', source: 'Gladiator of Sil\'dih', capture: false }),
      preRun: (data) => {
        data.gladVisage = 'accursed';
        data.gladMyTime = 0;
      },
      infoText: '얼굴들 나와요 (▦와 금은 디버프)',
    },
    // 그라디아토르: Wrath of Ruin
    {
      id: 'AS++ 그라디아토르 Wrath of Ruin',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7663', source: 'Gladiator of Sil\'dih', capture: false }),
      alertText: (data, _matches, output) => {
        if (data.gladVisage === 'hateful')
          return output.hateful!();
        else if (data.gladVisage === 'accursed')
          return output.accursed!();
      },
      outputStrings: {
        hateful: '얼굴 빔 피해요',
        accursed: '얼굴 빔 맞을 위치 찾아요',
      },
    },
    // 그라디아토르: Gilded/Silvered Fate
    {
      id: 'AS+ 그라디아토르 Gilded/Silvered Fate',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: ['CDF', 'CE0'] }),
      condition: Conditions.targetIsYou(),
      durationSeconds: 8,
      infoText: (data, matches, output) => {
        data.gladMyTime++;
        if (data.gladMyTime > 1)
          return;

        // 금
        if (matches.effectId === 'CDF') {
          if (matches.count === '02')
            return output.g2!();
          return output.gs!();
        }

        // 은
        if (matches.count === '02')
          return output.s2!();
        return output.gs!();
      },
      outputStrings: {
        g2: '은🥈 두개 맞아요',
        s2: '금🥇 두개 맞아요',
        gs: '금🥇은🥈 하나씩 맞아요',
      },
    },
    // 그라디아토르: Curse of the Monument(7666)
    {
      id: 'AS+ 그라디아토르 Curse of the Monument',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7666', source: 'Gladiator of Sil\'dih' }),
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' || data.CanFeint())
          return output.east!();
        else if (data.role === 'healer' || data.CanAddle() || data.CanSilence())
          return output.west!();
        return output.move!();
      },
      run: (data) => {
        data.gladMyTime = 0;
        data.gladExplosion = 0;
      },
      outputStrings: {
        east: '🡺오른쪽에서 줄 기다려요',
        west: '왼쪽🡸에서 줄 기다려요',
        move: '옆에서 둘씩 뭉쳐 줄 기다려요',
      },
    },
    // 그라디아토르: Curse of the Monument 줄
    {
      id: 'AS++ 그라디아토르 Curse of the Monument Tether',
      type: 'Tether',
      netRegex: NetRegexes.tether({ id: '00A3' }),
      condition: (data, matches) => matches.source === data.me || matches.target === data.me,
      alertText: (data, matches, output) => {
        const who = matches.source === data.me ? matches.target : matches.source;
        return output.run!({ player: data.ShortName(who) });
      },
      outputStrings: {
        run: '줄 끊어요 (+${player})',
      },
    },
    //
    {
      id: 'AS+ 그라디아토르 Scream of the Fallen',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDB' }),
      condition: Conditions.targetIsYou(),
      durationSeconds: 12.5,
      infoText: (data, matches, output) => {
        data.gladMyTime = parseInt(matches.duration); // 19초와 23초
        return data.gladMyTime === 19 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: '먼저 폭파',
        tower: '먼저 타워',
      },
    },
    // 그라디아토르: Explosion(766A)
    // Colossal Wreck(7669)도 여기서 표시
    {
      id: 'AS+ 그라디아토르 Explosion',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '766A', source: 'Gladiator of Sil\'dih' }),
      preRun: (data) => data.gladExplosion++,
      infoText: (data, _matches, output) => {
        if (data.gladExplosion === 1)
          return data.gladMyTime === 19 ? output.boom!() : output.tower!();
        else if (data.gladExplosion === 3)
          return data.gladMyTime === 23 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: '벽쪽에 붙어 폭파시켜요',
        tower: '타워 밟아요',
      },
    },

    // ///////////////////////////////////////////////////////////////////////////////
    //
    {
      id: 'AS+ 젤레스가 Show of Strength',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74AF', source: 'Shadowcaster Zeless Gah', capture: false }),
      response: Responses.aoe(),
    },
    //
    {
      id: 'AS+ 젤레스가 Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74AD', source: 'Shadowcaster Zeless Gah' }),
      response: Responses.tankCleave(),
    },
    //
    {
      id: 'AS+ 젤레스가 Infern Brand',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7491', source: 'Shadowcaster Zeless Gah' }),
      infoText: (data, _matches, output) => {
        data.gahBrandPhase++;
        if (data.gahBrandPhase === 1)
          return output.p1!();
        if (data.gahBrandPhase === 2)
          return output.p2!();
        if (data.gahBrandPhase === 3)
          return output.p3!();
        if (data.gahBrandPhase === 4)
          return output.p4!();
        if (data.gahBrandPhase === 5)
          return output.p5!();
      },
      outputStrings: {
        p1: '돌아가는 기둥, 안전지대 찾아요',
        p2: '마법진 위치 → 북:🟥 / 서:🟦',
        p3: '전이 기둥에서 놀아요',
        p4: '카드 전이, 안전지대를 찾아요',
        p5: '12번→가운데, 34번→파란선 지팡',
      },
    },
    /* //
    {
      id: 'AS+ 젤레스가 Cryptic Portal',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7494', source: 'Shadowcaster Zeless Gah' }),
    },*/
    //
    {
      id: 'AS+ 젤레스가 Firesteel Strike',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74B0', source: 'Shadowcaster Zeless Gah' }),
      response: Responses.spread(),
      run: (data) => data.gahMagicv = [],
    },
    //
    {
      id: 'AS+ 젤레스가 Firesteel Strike Collect',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['74B1', '74B2'], source: 'Shadowcaster Zeless Gah' }),
      run: (data, matches) => data.gahMagicv.push(matches.target),
    },
    //
    {
      id: 'AS+ 젤레스가 Blessed Beacon',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74B3', source: 'Shadowcaster Zeless Gah' }),
      infoText: (data, _matches, output) => {
        if (data.gahMagicv.length === 0)
          return output.text!();

        if (data.gahMagicv.includes(data.me))
          return output.behind!();

        const players: string[] = [];
        data.gahMagicv.forEach((value) => players.push(data.ShortName(value)));
        return output.front!({ players: players.join(', ') });
      },
      outputStrings: {
        text: '두 번 내려치기',
        front: '앞에서 막아줘요 (${players})',
        behind: '뒤에 숨어요',
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Brands',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CC[4-7]' }),
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      infoText: (data, matches, output) => {
        if (matches.effectId === 'CC4')
          data.gahMyBrand = 1;
        else if (matches.effectId === 'CC5')
          data.gahMyBrand = 2;
        else if (matches.effectId === 'CC6')
          data.gahMyBrand = 3;
        else if (matches.effectId === 'CC7')
          data.gahMyBrand = 4;
        else
          throw new UnreachableCode();
        return output.text!({ num: output['num' + data.gahMyBrand.toString()]!() });
      },
      outputStrings: {
        text: '내 브랜드: ${num}',
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        num4: Outputs.cnum4,
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Frames',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CC[89AB]' }),
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      infoText: (data, matches, output) => {
        if (matches.effectId === 'CC8')
          data.gahMyBrand = 1;
        else if (matches.effectId === 'CC9')
          data.gahMyBrand = 2;
        else if (matches.effectId === 'CCA')
          data.gahMyBrand = 3;
        else if (matches.effectId === 'CCB')
          data.gahMyBrand = 4;
        else
          throw new UnreachableCode();
        return output.text!({ num: output['num' + data.gahMyBrand.toString()]!() });
      },
      outputStrings: {
        text: '내 플레임: ${num}',
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        num4: Outputs.cnum4,
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Frames Over',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CC[89AB]' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      alertText: '안전 지대로 찾아 가욧',
    },
    /* 당장 안끊어도 된다 위에 플레임되면 끊기기 시작함
    //
    {
      id: 'AS+ 젤레스가 Cryptic Flames',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '74B6', source: 'Shadowcaster Zeless Gah' }),
      alertText: (data, _matches, output) => output.text!({ num: data.gahMyBrand }),
      outputStrings: {
        text: '선 끊어요. 내 번호는 ${num}번',
      },
    },*/
    // 캐스트 샤도 (749Ax1, 749Ex6, 749Cx6) 이중에 뭘 골라야하지
    {
      id: 'AS+ 젤레스가 Cast Shadow',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '749A', source: 'Shadowcaster Zeless Gah' }),
      alertText: '방사 장판 피하면서, 안전지대로',
    },
    //
    {
      id: 'AS+ 젤레스가 Banishment',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '74BC', source: 'Shadowcaster Zeless Gah' }),
      delaySeconds: 4,
      infoText: '안쪽으로 회전하는 곳에 위치하세요',
    },
    //
    {
      id: 'AS+ 젤레스가 Call of the Portal Collect',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CCC' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) + 1,
      alertText: '포탈 전이: 같은 줄의 마커로 가욧',
    },
    //
    {
      id: 'AS+ 젤레스가 Rite of Passage Collect',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CCD' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) + 1,
      alertText: '자가 전이: 같은 줄의 마커로 가욧',
    },
    //
    {
      id: 'AS+ 젤레스가 빨강파랑/왼쪽오른쪽',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'B9A' }),
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        if (matches.count === '1D2')
          data.gahBanishment = 'redRight';
        else if (matches.count === '1D3')
          data.gahBanishment = 'blueLeft';
        else if (matches.count === '1CD')
          data.gahBanishment = 'blueRight';
        else if (matches.count === '1CE')
          data.gahBanishment = 'redLeft';
        else
          throw new UnreachableCode();

        return output[data.gahBanishment]!();
      },
      outputStrings: {
        redLeft: '🡸 첫째줄',
        redRight: '둘째줄 🡺',
        blueRight: '셋째줄 🡺',
        blueLeft: '🡸 맨아랫줄',
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Brands P5',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CC[4-7]' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 11,
      infoText: (data, _matches, output) => {
        if (data.gahBrandPhase !== 5)
          return;
        if (data.gahMyBrand === 1 || data.gahMyBrand === 1)
          return output.f12!();
        if (data.gahMyBrand === 3 || data.gahMyBrand === 4)
          return output.f34!();
      },
      outputStrings: {
        f12: '줄끊고 → 34번 줄 보고 → 지팡이 불꽃 → 장판깔기',
        f34: '지팡이 불꽃 → 줄끊고 → 원위치 → 장판깔기',
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {},
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Gladiator of Sil\'dih': 'シラディハ・グラディアトル',
        'Gladiator Mirage': 'ミラージュ・グラディアトル',
        'Infern Brand': 'アマルジャの呪具',
        'Silkie': 'シルキー',
        'Shadowcaster Zeless Gah': '影火のゼレズ・ガー',
      },
      'replaceText': {},
    },
  ],
};

export default triggerSet;
