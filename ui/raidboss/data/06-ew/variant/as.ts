import Conditions from '../../../../../resources/conditions';
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

// https://github.com/quisquous/cactbot/pull/4967
export const getRushOffset = (x: number) => {
  if (x > -46 && x < -43 || x > -27 && x < -24)
    return 3;
  if (x > -41 && x < -38 || x > -32 && x < -29)
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
      netRegex: { id: '7963', source: 'Aqueduct Kaluk', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    // Aqueduct Kaluk: 오른쪽으로
    {
      id: 'AS+ Aqueduct Kaluk 오른쪽으로',
      type: 'StartsUsing',
      netRegex: { id: '7964', source: 'Aqueduct Kaluk', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    // Aqueduct Kaluk: 전방 범위
    {
      id: 'AS+ Aqueduct Kaluk 전방범위',
      type: 'StartsUsing',
      netRegex: { id: '7965', source: 'Aqueduct Kaluk', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '앞쪽 범위 공격',
          ja: '前方範囲攻撃',
        },
      },
    },
    // Aqueduct Udumbara: 왼쪽으로
    {
      id: 'AS+ Aqueduct Udumbara 왼쪽으로',
      type: 'StartsUsing',
      netRegex: { id: '795C', source: 'Aqueduct Udumbara', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    // Aqueduct Udumbara: 오른쪽으로
    {
      id: 'AS+ Aqueduct Udumbara 오른쪽으로',
      type: 'StartsUsing',
      netRegex: { id: '795B', source: 'Aqueduct Udumbara', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    // Aqueduct Udumbara: 전방 범위
    {
      id: 'AS+ Aqueduct Udumbara 전방범위',
      type: 'StartsUsing',
      netRegex: { id: '795D', source: 'Aqueduct Udumbara', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '앞쪽 범위 공격',
          ja: '前方範囲攻撃',
        },
      },
    },
    // Aqueduct Belladonna: 발밑으로
    {
      id: 'AS+ Aqueduct Belladonna 발밑으로',
      type: 'StartsUsing',
      netRegex: { id: '7960', source: 'Aqueduct Belladonna', capture: false },
      response: Responses.getIn(),
    },
    // Aqueduct Belladonna: 시선 주의
    {
      id: 'AS+ Aqueduct Belladonna 시선주의',
      type: 'StartsUsing',
      netRegex: { id: '7961', source: 'Aqueduct Belladonna', capture: false },
      response: Responses.lookAway(),
    },
    // Aqueduct Belladonna: 버스터
    {
      id: 'AS+ Aqueduct Belladonna 버스터',
      type: 'StartsUsing',
      netRegex: { id: '7962', source: 'Aqueduct Belladonna' },
      response: Responses.tankBuster(),
    },
    // Aqueduct Dryad: 원형범위
    {
      id: 'AS+ Aqueduct Dryad 원형범위',
      type: 'StartsUsing',
      netRegex: { id: '7957', source: 'Aqueduct Dryad', capture: false },
      response: Responses.getOut(),
    },
    // Sil'dihn Dullahan 원형범위
    {
      id: 'AS+ Sil\'dihn Dullahan 원형범위',
      type: 'StartsUsing',
      netRegex: { id: '7966', source: 'Sil\'dihn Dullahan', capture: false },
      response: Responses.getOut(),
    },
    // Sil'dihn Dullahan: 전체 페인
    {
      id: 'AS+ Sil\'dihn Dullahan 전체 페인',
      type: 'StartsUsing',
      netRegex: { id: '7969', source: 'Sil\'dihn Dullahan', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 + 출혈',
          ja: '全体攻撃 + 出血',
        },
      },
    },
    // Sil'dihn Dullahan: 자기 강화
    {
      id: 'AS+ Sil\'dihn Dullahan 자기 강화',
      type: 'StartsUsing',
      netRegex: { id: '7968', source: 'Sil\'dihn Dullahan', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자기 강화',
          ja: '自己強化',
        },
      },
    },
    // Aqueduct Armor: 헤비
    {
      id: 'AS+ Aqueduct Armor 헤비',
      type: 'StartsUsing',
      netRegex: { id: '796B', source: 'Aqueduct Armor', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '헤비, 발 밑으로',
          ja: 'ヘビィ, 足元へ',
        },
      },
    },
    // Aqueduct Armor: 체력 1로
    {
      id: 'AS+ Aqueduct Armor HP1로',
      type: 'StartsUsing',
      netRegex: { id: '796C', source: 'Aqueduct Armor', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '체력이 1이네!',
          ja: '体力１!',
        },
      },
    },
    // Aqueduct Armor: 슬래시
    {
      id: 'AS+ Aqueduct Armor 슬래시',
      type: 'StartsUsing',
      netRegex: { id: '796A', source: 'Aqueduct Armor', capture: false },
      response: Responses.getBehind(),
    },
    // 쫄: 란타게범위
    {
      id: 'AS+ 쫄 랜덤 장판',
      type: 'StartsUsing',
      netRegex: { id: '7959', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '랜덤 장판',
          ja: 'ランタゲ範囲',
        },
      },
    },
    // 쫄: 범위
    {
      id: 'AS+ 쫄 범위',
      type: 'StartsUsing',
      netRegex: { id: '795A', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '범위 공격',
          ja: '範囲攻撃',
        },
      },
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 실키: 왼쪽으로
    {
      id: 'AS+ 실키 Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: { id: ['7751', '7755'], source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        // 왼쪽도 그렇지만 엄청 패다보면(!) 기믹이 스킵되는데 7755, 7756이 스킵되버린다.
        // 두번 나오게하기 싫어서 이런짓...
        data.silkieClean++;
        if (data.silkieClean === 1)
          return output.left!();
      },
      outputStrings: {
        left: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    // 실키: 오른쪽으로
    {
      id: 'AS+ 실키 Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: { id: ['7752', '7756'], source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        data.silkieClean++;
        if (data.silkieClean === 1)
          return output.right!();
      },
      outputStrings: {
        right: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    // 실키: Dust Bluster
    {
      id: 'AS+ 실키 Dust Bluster',
      type: 'StartsUsing',
      netRegex: { id: '776C', source: 'Silkie', capture: false },
      response: Responses.knockback(),
    },
    // 실키: Carpet Beater
    {
      id: 'AS+ 실키 Carpet Beater',
      type: 'StartsUsing',
      netRegex: { id: '774F', source: 'Silkie' },
      response: Responses.tankBuster(),
    },
    // 실키: Total Wash
    {
      id: 'AS+ 실키 Total Wash',
      type: 'StartsUsing',
      netRegex: { id: '7750', source: 'Silkie', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 + 출혈',
          ja: '全体攻撃 + 出血',
        },
      },
    },
    // 실키: Bracing Suds
    {
      id: 'AS+ 실키 Bracing Suds',
      type: 'StartsUsing',
      netRegex: { id: '7757', source: 'Silkie' },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.silkieSuds = 'green',
      outputStrings: {
        text: {
          en: '초록🟢꼬리',
          ja: '緑🟢しっぽ',
        },
      },
    },
    // 실키: Chilling Suds
    {
      id: 'AS+ 실키 Chilling Suds',
      type: 'StartsUsing',
      netRegex: { id: '7758', source: 'Silkie' },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.silkieSuds = 'blue',
      outputStrings: {
        text: {
          en: '파랑🔵꼬리',
          ja: '青🔵しっぽ',
        },
      },
    },
    // 실키: Fizzling Suds
    {
      id: 'AS+ 실키 Fizzling Suds',
      type: 'StartsUsing',
      netRegex: { id: '7759', source: 'Silkie' },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.silkieSuds = 'yellow',
      outputStrings: {
        text: {
          en: '노랑🟡꼬리',
          ja: '黄🟡しっぽ',
        },
      },
    },
    // 실키: Fresh Puff
    {
      id: 'AS+ 실키 Fresh Puff',
      type: 'StartsUsing',
      netRegex: { id: '7766', source: 'Silkie' },
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
        p1: {
          en: '솜털 세개 → 꼬리치기',
          ja: 'たま3個 → 水拭き',
        },
        p2: {
          en: '솜털 네개, 안전지대 만들어요',
          ja: 'たま4個, 安置を作りましょう',
        },
        p3: {
          en: '솜털 여덟개, 화이팅이요',
          ja: 'たま8個, がんばれ！！',
        },
        p4: {
          en: '솜털 네개 → 꼬리 방향으로 유도',
          ja: 'たま4個 → しっぽ誘導',
        },
        px: {
          en: '솜털 나와요',
          ja: 'たま出ます',
        },
      },
    },
    // 실키: Eastern Ewers
    {
      id: 'AS+ 실키 Eastern Ewers',
      type: 'StartsUsing',
      netRegex: { id: '776D', source: 'Silkie' },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '물 항아리는 어딧냐!',
          ja: '洗い壺はどこじゃ',
        },
      },
    },
    // 실키: Soap's Up <- Fizzling Suds (775Dx4가 부채꼴)
    {
      id: 'AS+ 실키 Fizzling:Soaps',
      type: 'StartsUsing',
      netRegex: { id: '775A', source: 'Silkie' },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟡비스듬 → 십자➕로',
          ja: '🟡斜め → 十字➕で',
        },
      },
    },
    // 실키: Slippery Soap
    {
      id: 'AS+ 실키 Slippery Soap',
      type: 'Ability',
      netRegex: { id: '79FB', source: 'Silkie' },
      preRun: (data) => data.silkieSoap++,
      alertText: (data, matches, output) => {
        if (data.silkieSuds === 'green') {
          if (matches.target === data.me)
            return output.kbBack!();
          return output.kbFront!({ player: data.ShortName(matches.target) });
        }
        if (matches.target === data.me) {
          if (data.silkieSoap === 1)
            return output.behindPuff!();
          if (data.silkieSoap === 3)
            return output.behindPuffEw!();
          return output.mostBehind!();
        }
        return output.frontOf!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        kbFront: {
          en: '넉백! ${player} 앞으로',
          ja: 'ノックバック! ${player}の前へ',
        },
        kbBack: {
          en: '넉백! 맨 뒤로',
          ja: 'ノックバック! 一番後ろへ',
        },
        behindPuff: {
          en: '구슬의 맨 뒤로',
          ja: 'たまの一番後ろへ',
        },
        behindPuffEw: {
          en: '구슬의 맨 뒤로 (동서)',
          ja: 'たまの一番後ろへ (東西)',
        },
        mostBehind: {
          en: '맨 뒤로',
          ja: '一番後ろへ',
        },
        frontOf: {
          en: '${player} 앞으로',
          ja: '${player}の前へ',
        },
      },
    },
    // 실키: Slippery Soap Blue
    {
      id: 'AS+ 실키 Slippery Soap Blue',
      type: 'StartsUsing',
      netRegex: { id: '775E', source: 'Silkie' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      alertText: (data, _matches, output) => {
        if (data.silkieSuds === 'blue')
          return output.blue!();
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '한줄로 나란히',
          ja: '一列で並んで',
        },
        blue: {
          en: '한줄로 나란히, 🔵움직여요!',
          ja: '一列で並んで、🔵うごいて！',
        },
      },
    },
    // 실키: Slippery Soap Run
    {
      id: 'AS+ 실키 Slippery Soap Run',
      type: 'Ability',
      netRegex: { id: '775E', source: 'Silkie', capture: false },
      alertText: (data, _matches, output) => {
        if (data.silkieSuds === 'blue')
          return output.blue!();
        if (data.silkieSuds === 'green')
          return output.green!();
        if (data.silkieSuds === 'yellow')
          return output.yellow!();
        return output.none!();
      },
      run: (data) => delete data.silkieSuds,
      outputStrings: {
        blue: {
          en: '🔵십자 장판',
          ja: '🔵十字, 避けて',
        },
        green: {
          en: '🟢아래로',
          ja: '🟢貼り付く',
        },
        yellow: {
          en: '🟡비스듬 → 흩어져요➕',
          ja: '🟡斜め → 散会➕',
        },
        none: {
          en: '색깔 기믹 처리해요',
          ja: '色ギミック処理',
        },
      },
    },
    // 실키: Soaping Spree
    {
      id: 'AS+ 실키 Soaping Spree',
      type: 'StartsUsing',
      netRegex: { id: '7767', source: 'Silkie', capture: false },
      alertText: (data, _matches, output) => {
        if (data.silkieSuds === 'blue')
          return output.blue!();
        if (data.silkieSuds === 'green')
          return output.green!();
        return output.none!();
      },
      outputStrings: {
        blue: {
          en: '🔵십자 장판',
          ja: '🔵十字, 避けて',
        },
        green: {
          en: '🟢아래로',
          ja: '🟢貼り付く',
        },
        none: {
          en: '곧 샴푸가 터져요!',
          ja: 'まもなくシャンプー',
        },
      },
    },
    // 실키: Bracing Duster
    {
      id: 'AS+ 실키 Bracing Duster',
      type: 'StartsUsing',
      netRegex: { id: '7769', source: 'Silkie', capture: false },
      response: Responses.getUnder(),
    },

    // ///////////////////////////////////////////////////////////////////////////////
    // 그라디아토르: Flash of Steel
    {
      id: 'AS++ 그라디아토르 Flash of Steel',
      type: 'StartsUsing',
      netRegex: { id: '7671', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.aoe(),
    },
    // 그라디아토르: Sculptor's Passion(766C), 대상자(6854)
    {
      id: 'AS++ 그라디아토르 Sculptor\'s Passion',
      type: 'Ability',
      netRegex: { id: '6854', source: 'Gladiator of Sil\'dih' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.itsme!();
        return output.rush!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        rush: {
          en: '${player}에게 돌진! 보스 방댕이에 한줄로',
          ja: '${player}に突進！ボスの後ろに並んで',
        },
        itsme: {
          en: '내게 돌진! 보스 방댕이에 한줄로',
          ja: '自分に突進！ボスの後ろに並んで',
        },
      },
    },
    // 그라디아토르: Mighty Smite
    {
      id: 'AS++ 그라디아토르 Mighty Smite',
      type: 'StartsUsing',
      netRegex: { id: '7672', source: 'Gladiator of Sil\'dih' },
      response: Responses.tankBuster(),
    },
    // 그라디아토르: Specter of Might
    {
      id: 'AS++ 그라디아토르 Specter of Might Collect',
      type: 'StartsUsing',
      netRegex: { id: '7673', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => data.gladRushNum = [],
    },
    // 그라디아토르: Rush of Might
    {
      id: 'AS+ 그라디아토르 Rush of Might',
      type: 'StartsUsing',
      netRegex: { id: ['7658', '7659', '765A'], source: 'Gladiator Mirage' },
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
        rush: {
          en: '${num1} + ${num2}',
          ja: '${num1} + ${num2}',
        },
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
      netRegex: { id: ['765C', '765B'], source: 'Gladiator of Sil\'dih' },
      preRun: (data, matches) => data.gladRushCast.push(matches),
    },
    // 그라디아토르: Rush of Might
    {
      id: 'AS+ 그라디아토르 Rush of Might',
      type: 'StartsUsing',
      netRegex: { id: ['765C', '765B'], source: 'Gladiator of Sil\'dih', capture: false },
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
        const mirage2 = mirage1.x === unkmir1.x && mirage1.y === unkmir1.y ? unkmir2 : unkmir1;

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
        const even = data.gladRushCount % 4 === 0;

        let arrow;
        let side;
        if (o1 === 2 && o2 === 3 || o1 === 3 && o2 === 2) {
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
        rush: {
          en: '${arrow} ${side}',
          ja: '${arrow} ${side}',
        },
        rushrev: {
          en: '${arrow} ${side} (남쪽 보고)',
          ja: '${arrow} ${side} (南向き)',
        },
        east: Outputs.right,
        west: Outputs.left,
        l1: {
          en: '🡸',
          ja: '🡸',
        },
        l2: {
          en: '🡸🡸',
          ja: '🡸🡸',
        },
        l3: {
          en: '🡸🡸🡸',
          ja: '🡸🡸🡸',
        },
        r1: {
          en: '🡺',
          ja: '🡺',
        },
        r2: {
          en: '🡺🡺',
          ja: '🡺🡺',
        },
        r3: {
          en: '🡺🡺🡺',
          ja: '🡺🡺🡺',
        },
      },
    },
    // 그라디아토르: Rush of Might Move
    {
      id: 'AS+ 그라디아토르 Rush of Might Move',
      type: 'Ability',
      netRegex: { id: '765B', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      response: Responses.moveAway(),
    },
    //
    {
      id: 'AS+ 그라디아토르 Lingering Echoes Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDC' },
      run: (data, matches) => data.gladLinger = matches.target,
    },
    //
    {
      id: 'AS+ 그라디아토르 Thunderous Echo Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDD' },
      run: (data, matches) => data.gladThunder = matches.target,
    },
    //
    {
      id: 'AS+ 그라디아토르 Thunderous Echo Stack',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDD' },
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
      netRegex: { effectId: 'CDA' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.2,
      durationSeconds: 17,
      alertText: (data, matches, output) => {
        if (data.gladLinger === data.me)
          return output.spread!();
        const thun = data.gladThunder === data.me ? output.itsme!() : data.ShortName(data.gladThunder);
        data.gladMyTime = parseInt(matches.duration);
        if (data.gladMyTime === 17)
          return output.s17!({ player: thun });
        if (data.gladMyTime === 14)
          return output.s14!({ player: thun });
        return output.unknown!();
      },
      outputStrings: {
        s17: {
          en: '뭉쳤다 → 흩어져요 (${player})',
          ja: '頭割り → 散会 (${player})',
        },
        s14: {
          en: '흩어졌다 → 뭉쳐요 (${player})',
          ja: '散会 → 頭割り (${player})',
        },
        itsme: {
          en: '내가 뭉치기',
          ja: '自分の頭割り',
        },
        spread: {
          en: '내가 링거, 홀로 있어야 해요',
          ja: '自分に連呪、ひとりぼっちでずっと',
        },
        unknown: Outputs.unknown,
      },
    },
    //
    {
      id: 'AS+ 그라디아토르 Echo of the Fallen Spread',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDA' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      response: Responses.spread(),
    },
    // 그라디아토르: Ring of Might
    {
      id: 'AS+ 그라디아토르 Ring of Might',
      type: 'StartsUsing',
      netRegex: { id: '765[D-F]', source: 'Gladiator of Sil\'dih' },
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
      netRegex: { id: '766E', source: 'Gladiator of Sil\'dih', capture: false },
      preRun: (data) => data.gladVisage = 'hateful',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '얼굴 나와요 (▦만)',
          ja: '顔がいっぱい (▦)',
        },
      },
    },
    // 그라디아토르: Accursed Visage
    {
      id: 'AS++ 그라디아토르 Accursed Visage',
      type: 'StartsUsing',
      netRegex: { id: '768D', source: 'Gladiator of Sil\'dih', capture: false },
      preRun: (data) => {
        data.gladVisage = 'accursed';
        data.gladMyTime = 0;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '얼굴 나와요 (▦와 금은)',
          ja: '顔がいっぱい (▦と金銀)',
        },
      },
    },
    // 그라디아토르: Wrath of Ruin
    {
      id: 'AS++ 그라디아토르 Wrath of Ruin',
      type: 'StartsUsing',
      netRegex: { id: '7663', source: 'Gladiator of Sil\'dih', capture: false },
      alertText: (data, _matches, output) => {
        if (data.gladVisage === 'hateful')
          return output.hateful!();
        else if (data.gladVisage === 'accursed')
          return output.accursed!();
      },
      outputStrings: {
        hateful: {
          en: '얼굴 빔 피해요',
          ja: '顔からビーム',
        },
        accursed: {
          en: '얼굴 빔 맞아야죠',
          ja: '顔からのビームに当たって',
        },
      },
    },
    // 그라디아토르: Gilded/Silvered Fate
    {
      id: 'AS+ 그라디아토르 Gilded/Silvered Fate',
      type: 'GainsEffect',
      netRegex: { effectId: ['CDF', 'CE0'] },
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
        g2: {
          en: '은🥈 두개',
          ja: '銀🥈 二つ',
        },
        s2: {
          en: '금🥇 두개',
          ja: '金🥇 二つ',
        },
        gs: {
          en: '금🥇은🥈 하나씩',
          ja: '金🥇銀🥈 一個ずつ',
        },
      },
    },
    // 그라디아토르: Curse of the Monument(7666)
    {
      id: 'AS+ 그라디아토르 Curse of the Monument',
      type: 'StartsUsing',
      netRegex: { id: '7666', source: 'Gladiator of Sil\'dih' },
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
        east: {
          en: '🡺오른쪽에서 기둘',
          ja: '🡺右で線待つ',
        },
        west: {
          en: '왼쪽🡸에서 기둘',
          ja: '左🡸で線待つ',
        },
        move: {
          en: '옆에서 기둘',
          ja: '横でで線待つ',
        },
      },
    },
    // 그라디아토르: Curse of the Monument 줄
    {
      id: 'AS++ 그라디아토르 Curse of the Monument Tether',
      type: 'Tether',
      netRegex: { id: '00A3' },
      condition: (data, matches) => matches.source === data.me || matches.target === data.me,
      alertText: (data, matches, output) => {
        const who = matches.source === data.me ? matches.target : matches.source;
        return output.run!({ player: data.ShortName(who) });
      },
      outputStrings: {
        run: {
          en: '줄 끊어요 (+${player})',
          ja: '線切 (+${player})',
        },
      },
    },
    //
    {
      id: 'AS+ 그라디아토르 Scream of the Fallen',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDB' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 12.5,
      infoText: (data, matches, output) => {
        data.gladMyTime = parseInt(matches.duration); // 19초와 23초
        return data.gladMyTime === 19 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: {
          en: '먼저 폭파',
          ja: '先に爆発',
        },
        tower: {
          en: '먼저 타워',
          ja: '先に塔',
        },
      },
    },
    // 그라디아토르: Explosion(766A)
    // Colossal Wreck(7669)도 여기서 표시
    {
      id: 'AS+ 그라디아토르 Explosion',
      type: 'StartsUsing',
      netRegex: { id: '766A', source: 'Gladiator of Sil\'dih' },
      preRun: (data) => data.gladExplosion++,
      infoText: (data, _matches, output) => {
        if (data.gladExplosion === 1)
          return data.gladMyTime === 19 ? output.boom!() : output.tower!();
        else if (data.gladExplosion === 3)
          return data.gladMyTime === 23 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: {
          en: '벽쪽에 붙어 폭파시켜요',
          ja: '外側で爆発',
        },
        tower: {
          en: '타워 밟아요',
          ja: '塔踏み',
        },
      },
    },

    // ///////////////////////////////////////////////////////////////////////////////
    //
    {
      id: 'AS+ 젤레스가 Show of Strength',
      type: 'StartsUsing',
      netRegex: { id: '74AF', source: 'Shadowcaster Zeless Gah', capture: false },
      response: Responses.aoe(),
    },
    //
    {
      id: 'AS+ 젤레스가 Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: { id: '74AD', source: 'Shadowcaster Zeless Gah' },
      response: Responses.tankCleave(),
    },
    //
    {
      id: 'AS+ 젤레스가 Infern Brand',
      type: 'StartsUsing',
      netRegex: { id: '7491', source: 'Shadowcaster Zeless Gah' },
      preRun: (data) => data.gahBrandPhase++,
      infoText: (data, _matches, output) => {
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
        p1: {
          en: '돌고도네, 안전지대 찾아요',
          ja: '回る杖、安置探せ',
        },
        p2: {
          en: '마법진 → 북:🟥 / 서:🟦',
          ja: '魔法陣 → 北:🟥 / 西:🟦',
        },
        p3: {
          en: '전이 기둥과 놀아요',
          ja: '転移と遊びましょう',
        },
        p4: {
          en: '카드 전이, 안전지대를 찾아요',
          ja: 'カード転移、安置探せ',
        },
        p5: {
          en: '1/2→가운데, 3/4→파란선 지팡이',
          ja: '1/2→真ん中, 3/4→青線つき杖',
        },
      },
    },
    /* //
    {
      id: 'AS+ 젤레스가 Cryptic Portal',
      type: 'StartsUsing',
      netRegex: { id: '7494', source: 'Shadowcaster Zeless Gah' },
    },*/
    //
    {
      id: 'AS+ 젤레스가 Firesteel Strike',
      type: 'StartsUsing',
      netRegex: { id: '74B0', source: 'Shadowcaster Zeless Gah' },
      response: Responses.spread(),
      run: (data) => data.gahMagicv = [],
    },
    //
    {
      id: 'AS+ 젤레스가 Firesteel Strike Collect',
      type: 'Ability',
      netRegex: { id: ['74B1', '74B2'], source: 'Shadowcaster Zeless Gah' },
      run: (data, matches) => data.gahMagicv.push(matches.target),
    },
    //
    {
      id: 'AS+ 젤레스가 Blessed Beacon',
      type: 'StartsUsing',
      netRegex: { id: '74B3', source: 'Shadowcaster Zeless Gah' },
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
        text: {
          en: '두 번 내려치기',
          ja: '2回打ち下ろし',
        },
        front: {
          en: '앞에서 막아요 (${players})',
          ja: '前でカーバ (${players})',
        },
        behind: {
          en: '뒤로 숨어요',
          ja: '後ろに隠れる',
        },
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Brands',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[4-7]' },
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
        text: {
          en: '내 브랜드: ${num}',
          ja: '自分のブランド: ${num}',
        },
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
      netRegex: { effectId: 'CC[89AB]' },
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
        text: {
          en: '내 플레임: ${num}',
          ja: '自分の火炎: ${num}',
        },
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
      netRegex: { effectId: 'CC[89AB]' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전 지대로 찾아 가욧',
          ja: '安置探して移動',
        },
      },
    },
    /* 당장 안끊어도 된다 위에 플레임되면 끊기기 시작함
    //
    {
      id: 'AS+ 젤레스가 Cryptic Flames',
      type: 'Ability',
      netRegex: { id: '74B6', source: 'Shadowcaster Zeless Gah' },
      alertText: (data, _matches, output) => output.text!({ num: data.gahMyBrand }),
      outputStrings: {
        text: '선 끊어요. 내 번호는 ${num}번',
      },
    },*/
    // 캐스트 샤도 (749Ax1, 749Ex6, 749Cx6) 이중에 뭘 골라야하지
    {
      id: 'AS+ 젤레스가 Cast Shadow',
      type: 'StartsUsing',
      netRegex: { id: '749A', source: 'Shadowcaster Zeless Gah' },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '방사 장판 피하면서, 안전지대로',
          ja: 'ゆか回避しながら安置へ',
        },
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Banishment',
      type: 'Ability',
      netRegex: { id: '74BC', source: 'Shadowcaster Zeless Gah' },
      delaySeconds: 4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안쪽으로 회전하는 곳으로',
          ja: '内側に回転するどころへ行け',
        },
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Call of the Portal Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'CCC' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) + 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '포탈 전이: 옆에 마커로 가욧',
          ja: 'ポータル転移: となりのマーカーへ',
        },
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Rite of Passage Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'CCD' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) + 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자가 전이: 옆에 마커로 가욧',
          ja: '自己転移: となりのマーカーへ',
        },
      },
    },
    //
    {
      id: 'AS+ 젤레스가 빨강파랑/왼쪽오른쪽',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A' },
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
        redLeft: {
          en: '🡸 첫째줄',
          ja: '🡸 1列',
        },
        redRight: {
          en: '둘째줄 🡺',
          ja: '2列 🡺',
        },
        blueRight: {
          en: '셋째줄 🡺',
          ja: '3列 🡺',
        },
        blueLeft: {
          en: '🡸 맨아랫줄',
          ja: '🡸 一番下列',
        },
      },
    },
    //
    {
      id: 'AS+ 젤레스가 Brands P5',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[4-7]' },
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
        f12: {
          en: '줄끊고 → 3/4 기둘 → 지팡이 불꽃 → 장판깔기',
          ja: '線切 → 3/4待つ → 杖の炎 → ゆか',
        },
        f34: {
          en: '지팡이 불꽃 → 줄끊고 → 원위치 → 장판깔기',
          ja: '杖の炎 → 線切 → 戻る → ゆか',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        '(?<!/ )Chilling Duster / Fizzling Duster': 'Chilling/Fizzling Duster',
        'Bracing Suds / Chilling Suds(?! )': 'Bracing/Chilling Suds',
        'Bracing Duster / Chilling Duster(?! )': 'Bracing/Chilling Duster',
        'Bracing Suds / Fizzling Suds': 'Bracing/Fizzling Suds',
        'Bracing Duster / Fizzling Duster': 'Bracing/Fizzling Duster',
        'Bracing Duster / Chilling Duster / Fizzling Duster': 'Duster',
        'Bracing Suds / Chilling Suds / Fizzling Suds': 'Suds',
      },
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
        'Thunderous Echo': '重怨の残響',
        'Lingering Echoes': '連呪の残響',
        'Echo of the Fallen': '呪怨の残響',
        'Gilded Fate': '黄金の呪い',
        'Silvered Fate': '白銀の呪い',
        'Golden Flame': '黄金の閃火',
        'Silver Flame': '白銀の閃火',
        'Scream of the Fallen': '呪怨の大残響',
      },
      'replaceText': {
        '(?<!/ )Chilling Duster / Fizzling Duster': 'ひえひえ/ぱちぱちダスター',
        'Accursed Visage': '呪怨呪像',
        'Banishment': '強制転移の呪',
        'Blazing Benifice': '聖火砲',
        'Blessed Beacon': '天の聖火',
        'Bracing Suds / Chilling Suds(?! )': 'そよそよ/ひえひえシャンプー',
        'Bracing Duster / Chilling Duster(?! )': 'そよそよ/ひえひえダスター',
        'Bracing Suds / Fizzling Suds': 'そよそよ/ぱちぱちシャンプー',
        'Bracing Duster / Fizzling Duster': 'そよそよ/ぱちぱちダスター',
        'Bracing Duster / Chilling Duster / Fizzling Duster': 'ダスター',
        'Bracing Suds / Chilling Suds / Fizzling Suds': 'シャンプー',
        'Bracing Suds': 'そよそよシャンプー',
        'Burn': '火球',
        'Carpet Beater': 'カーペットビーター',
        'Cast Shadow': '影火呪式',
        'Chilling Suds': 'ひえひえシャンプー',
        'Colossal Wreck': '亡国の霊塔',
        'Cryptic Flames': '火焔の呪印',
        'Cryptic Portal': '転移の呪印',
        'Curse of the Fallen': '呪怨の咆哮',
        'Curse of the Monument': '呪怨の連撃',
        'Dust Bluster': 'ダストブロワー',
        'Eastern Ewers': '洗い壺',
        'Echo of the Fallen': '呪怨の咆哮',
        'Explosion': '爆発',
        'Firesteel Fracture': '石火豪打',
        'Firesteel Strike': '石火豪衝',
        'Fizzling Suds': 'ぱちぱちシャンプー',
        'Flash of Steel': '闘人の波動',
        'Fresh Puff': 'ポンポン創出',
        'Gold Flame': '黄金の閃火',
        'Hateful Visage': '呪像起動',
        'Infern Brand': '呪具設置',
        'Infern Ward': '呪具警陣',
        'Infern Wave': '呪具流火',
        'Mighty Smite': '闘人の斬撃',
        'Nothing beside Remains': '座下隆起',
        'Pure Fire': '劫火',
        'Ring of Might': '大剛の旋撃',
        'Rush of Might': '大剛の突撃',
        'Scream of the Fallen': '呪怨の大残響',
        'Sculptor\'s Passion': '闘人砲',
        'Show of Strength': '勇士の咆哮',
        'Silver Flame': '白銀の閃火',
        'Slippery Soap': 'すべってシャンプーボム',
        'Soap\'s Up': 'シャンプーボム',
        'Soaping Spree': 'みんなでシャンプーボム',
        'Specter of Might': '亡念幻身',
        'Total Wash': '水拭き',
        'Wrath of Ruin': '亡念励起',
        /*
        실키
        'Bracing Duster': '',
        'Chilling Duster': '',
        'Fizzling Duster': '',
        'Puff and Tumble': '',
        'Rinse': '',
        'Soapsud Static': '',
        'Squeaky Clean': '',
        그라
        'Sundered Remains': '',
        */
      },
    },
  ],
};

export default triggerSet;
