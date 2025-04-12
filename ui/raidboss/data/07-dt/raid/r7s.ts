import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const srSwingDelay = [8, 30.5, 28] as const;
const sr2SwingDelay = [8.2, 24.2, 17.7, 32.1] as const;
const stoneStrings = {
  blade: {
    en: '(blade)',
    ko: '(칼, 도넛)',
  },
  club: {
    en: '(club)',
    ko: '(곤봉, 장판)',
  },
  unknown: Outputs.unknown,
};
const swingStrings = {
  blade: {
    en: 'Close to boss',
    ko: '도넛, 보스랑 붙어요!',
  },
  club: {
    en: 'Far from boss',
    ko: '장판, 보스랑 떨어져요!',
  },
  unknown: Outputs.unknown,
};

export interface Data extends RaidbossData {
  sr?: 'club' | 'blade' | 'unknown';
  srcnt: number;
  sr2cnt: number;
  slaminator?: string;
  quarrys: number;
  collect: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM3Savage',
  zoneId: ZoneId.AacCruiserweightM3Savage,
  timelineFile: 'r7s.txt',
  initData: () => ({
    srcnt: 0,
    sr2cnt: 0,
    quarrys: 0,
    collect: [],
  }),
  triggers: [
    {
      id: 'R7S Brutal Impact',
      type: 'StartsUsing',
      netRegex: { id: 'A55B', source: 'Brute Abombinator', capture: false },
      durationSeconds: 8,
      infoText: (_data, _match, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Raidwide',
          ko: '연속 전체 공격',
        },
      },
    },
    {
      id: 'R7S Stoneringer',
      type: 'StartsUsing',
      netRegex: { id: ['A55D', 'A55E'], source: 'Brute Abombinator' },
      infoText: (data, matches, output) => {
        // 칼 -> 도넛, 안으로
        // 곤봉 -> 보스장판, 밖으로
        data.sr = matches.id === 'A55D' ? 'club' : 'blade';
        return output[data.sr]!();
      },
      outputStrings: {
        ...stoneStrings,
      },
    },
    {
      id: 'R7S Smash Here/There',
      type: 'StartsUsing',
      netRegex: { id: ['A55F', 'A560'], source: 'Brute Abombinator' },
      durationSeconds: 6.5,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: '${sr} => ${smash}',
            ko: '${sr} 🔜 ${smash}',
          },
          htank: {
            en: 'Closest Tank Share',
            ko: '가까이 버스터',
          },
          hother: {
            en: 'Far from boss',
            ko: '보스 멀리',
          },
          ttank: {
            en: 'Far Tank Share',
            ko: '멀리 버스터',
          },
          tother: {
            en: 'Close to boss',
            ko: '보스 가까이',
          },
          blade: Outputs.in,
          club: Outputs.out,
          unknown: Outputs.unknown,
        };
        const sr = data.sr ?? 'unknown';
        const tank = Autumn.isTank(data.moks);
        const smash = matches.id === 'A55F'
          ? (tank ? 'htank' : 'hother')
          : (tank ? 'ttank' : 'tother');
        if (tank)
          return { alertText: output.text!({ sr: output[sr]!(), smash: output[smash]!() }) };
        return { infoText: output.text!({ sr: output[sr]!(), smash: output[smash]!() }) };
      },
    },
    {
      id: 'R7S Sinister Seeds',
      type: 'StartsUsing',
      netRegex: { id: ['A56D', 'A56E'], source: 'Brute Abombinator', capture: false },
      suppressSeconds: 10,
      response: Responses.protean(),
    },
    {
      id: 'R7S Seeds Collect',
      type: 'HeadMarker',
      netRegex: { id: '0177' },
      run: (data, matches) => data.collect.push(matches.target),
    },
    {
      id: 'R7S Seeds',
      type: 'HeadMarker',
      netRegex: { id: '0177', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const mech = data.collect.includes(data.me) ? 'seed' : 'puddle';
        return output[mech]!();
      },
      run: (data) => data.collect = [],
      outputStrings: {
        seed: {
          en: 'Bait seed',
          ko: '내게 씨앗!',
        },
        puddle: {
          en: 'Bait puddles',
          ko: '내게 장판x3',
        },
      },
    },
    {
      id: 'R7S Quarry Swamp',
      type: 'StartsUsing',
      netRegex: { id: 'A575', source: 'Brute Abombinator', capture: false },
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        data.quarrys++;
        if (data.quarrys === 1)
          return output.first!();
        return output.second!();
      },
      outputStrings: {
        first: {
          en: 'Hide behind the add',
          ko: '쫄 뒤로 숨고 🔜 전체쿵x3',
        },
        second: {
          en: 'Hide behind the add',
          ko: '쫄 뒤로 숨어욧',
        },
      },
    },
    {
      id: 'R7S Pulp Smash',
      type: 'StartsUsing',
      netRegex: { id: 'A577', source: 'Brute Abombinator', capture: false },
      durationSeconds: 2.6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack => Protean',
          ko: '뭉쳤다 🔜 맡은 자리로',
        },
      },
    },
    {
      id: 'R7S Pulp Smash Follow',
      type: 'StartsUsing',
      netRegex: { id: 'A577', source: 'Brute Abombinator', capture: false },
      delaySeconds: 2.6,
      response: Responses.protean('alert'),
    },
    {
      id: 'R7S Neo Bombarian Special',
      type: 'StartsUsing',
      netRegex: { id: 'A57C', source: 'Brute Abombinator', capture: false },
      delaySeconds: 2,
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go North!',
          ko: '북으로! 쿵해욧!',
        },
      },
    },
    {
      id: 'R7S Stoneringer Neo',
      type: 'StartsUsing',
      netRegex: { id: ['A57F', 'A580'], source: 'Brute Abombinator' },
      infoText: (data, matches, output) => {
        data.sr = matches.id === 'A57F' ? 'club' : 'blade';
        return output[data.sr]!();
      },
      outputStrings: {
        ...stoneStrings,
      },
    },
    {
      id: 'R7S Stoneringer Brutish Swing',
      type: 'StartsUsing',
      netRegex: { id: ['A57F', 'A580'], source: 'Brute Abombinator', capture: false },
      delaySeconds: (data) => {
        const delay = srSwingDelay[data.srcnt];
        if (delay === undefined)
          return 0;
        return delay;
      },
      infoText: (data, _matches, output) => {
        const delay = srSwingDelay[data.srcnt];
        if (delay !== undefined) {
          const sr = data.sr ?? 'unknown';
          return output[sr]!();
        }
      },
      run: (data) => data.srcnt++,
      outputStrings: {
        ...swingStrings,
      },
    },
    {
      id: 'R7S Glower Power',
      type: 'StartsUsing',
      netRegex: { id: ['A585', 'A94A'], source: 'Brute Abombinator', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line AOE in front + Spread',
          ko: '앞쪽 직선 장판 + 흩어져요',
        },
      },
    },
    {
      id: 'R7S Revenge of the Vines',
      type: 'StartsUsing',
      netRegex: { id: 'A587', source: 'Brute Abombinator', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'R7S Abominable Blink',
      type: 'HeadMarker',
      netRegex: { id: '0147' },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.bait!();
        if (Autumn.isTank(data.moks))
          return output.provoke!();
      },
      outputStrings: {
        bait: {
          en: 'Bait explosion',
          ko: '내게 플레어, 멀리멀리!',
        },
        provoke: {
          en: '(Provoke)',
          ko: '(프로보크)',
        },
      },
    },
    {
      id: 'R7S Thorny Deathmatch',
      type: 'StartsUsing',
      netRegex: { id: 'A588', source: 'Brute Abombinator', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Thorny Deathmatch',
          ko: '(가시 데스매치)',
        },
      },
    },
    {
      // 1193은 탱크
      // 1172는 그 밖에
      id: 'R7S Deathmatch I',
      type: 'GainsEffect',
      netRegex: { effectId: '1172' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 30,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Thorny Deathmatch I on YOU',
          ko: '내게 가시덤불 줄',
        },
      },
    },
    {
      id: 'R7S Strange Seeds',
      type: 'StartsUsing',
      netRegex: { id: 'A598', source: 'Brute Abombinator' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.seed!(),
      outputStrings: {
        seed: {
          en: 'Seed on YOU',
          ko: '내게 씨앗!',
        },
      },
    },
    {
      id: 'R7S Sporesplosion',
      type: 'StartsUsing',
      netRegex: { id: 'A58A', source: 'Brute Abombinator', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '3 => 1',
          ko: '3 🔜 1',
        },
      },
    },
    {
      id: 'R7S Demolition Deathmatch',
      type: 'StartsUsing',
      netRegex: { id: 'A596', source: 'Brute Abombinator', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Demolition Deathmatch',
          ko: '(데몰리션: 줄채고 연속 덤불)',
        },
      },
    },
    {
      id: 'R7S Powerslam',
      type: 'StartsUsing',
      netRegex: { id: 'A59E', source: 'Brute Abombinator', capture: false },
      durationSeconds: 5,
      response: Responses.bigAoe(),
    },
    {
      id: 'R7S Stoneringer 2',
      type: 'StartsUsing',
      netRegex: { id: ['A5A0', 'A5A1'], source: 'Brute Abombinator' },
      infoText: (data, matches, output) => {
        data.sr = matches.id === 'A5A0' ? 'club' : 'blade';
        return output[data.sr]!();
      },
      outputStrings: {
        ...stoneStrings,
      },
    },
    {
      id: 'R7S Stoneringer 2 Brutish Swing 1',
      type: 'StartsUsing',
      netRegex: { id: ['A5A0', 'A5A1'], source: 'Brute Abombinator', capture: false },
      delaySeconds: (data) => {
        const n = sr2SwingDelay[data.sr2cnt++];
        if (n !== undefined)
          return n;
        return 0;
      },
      infoText: (data, _matches, output) => {
        const sr = data.sr ?? 'unknown';
        return output[sr]!();
      },
      outputStrings: {
        ...swingStrings,
      },
    },
    {
      id: 'R7S Stoneringer 2 Brutish Swing 2',
      type: 'StartsUsing',
      netRegex: { id: ['A5A0', 'A5A1'], source: 'Brute Abombinator', capture: false },
      delaySeconds: (data) => {
        const n = sr2SwingDelay[data.sr2cnt++];
        if (n !== undefined)
          return n;
        return 0;
      },
      infoText: (data, _matches, output) => {
        let sr = 'unknown';
        if (data.sr === 'club')
          sr = 'blade';
        else if (data.sr === 'blade')
          sr = 'club';
        return output[sr]!();
      },
      outputStrings: {
        ...swingStrings,
      },
    },
    {
      id: 'R7S Lashing Lariat',
      type: 'StartsUsing',
      netRegex: { id: ['A5A7', 'A5A9'], source: 'Brute Abombinator' },
      alertText: (_data, matches, output) => {
        if (matches.id === 'A5A7')
          return output.right!();
        return output.left!();
      },
      outputStrings: {
        left: {
          en: 'Left',
          ko: '래리엇 왼쪽으로!',
        },
        right: {
          en: 'Right',
          ko: '래리엇 오른쪽으로!',
        },
      },
    },
    {
      id: 'R7S Slaminator',
      type: 'StartsUsing',
      netRegex: { id: 'A5AD', source: 'Brute Abombinator', capture: false },
      durationSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          avoid: {
            en: 'Avoid tower!',
            ko: '타워 피해욧!',
          },
          tank: {
            en: 'MT get tower',
            ko: 'MT 무적으로 타워!',
          },
          mine: {
            en: 'Get tower',
            ko: '내가 무적으로 타워!',
          },
        };
        if (!Autumn.isTank(data.moks))
          return { infoText: output.avoid!() };
        if (data.slaminator === undefined)
          return { alertText: output.tank!() };
        if (data.slaminator !== data.me)
          return { alertText: output.mine!() };
        return { infoText: output.avoid!() };
      },
    },
    {
      id: 'R7S Slaminator Effect',
      type: 'Ability',
      netRegex: { id: 'A5AE', source: 'Brute Abombinator' },
      run: (data, matches) => {
        const dest = data.party.member(matches.target);
        if (dest === undefined || dest.role !== 'tank')
          return;
        data.slaminator = matches.target;
      },
    },
    {
      id: 'R7S Debris Deathmatch',
      type: 'StartsUsing',
      netRegex: { id: 'A5B0', source: 'Brute Abombinator', capture: false },
      infoText: (data, _matches, output) => {
        if (Autumn.isTank(data.moks))
          return output.tank!();
        if (Autumn.isMelee(data.moks))
          return output.melee!();
        return output.range!();
      },
      outputStrings: {
        tank: {
          en: 'Debris Deathmatch',
          ko: '(데브리스: 쫄 헤이트)',
        },
        melee: {
          en: 'Debris Deathmatch',
          ko: '(데브리스: 장판+덤불)',
        },
        range: {
          en: 'Debris Deathmatch',
          ko: '(데브리스: 줄채고 장판+덤불)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Brute Abombinator': 'ブルートアボミネーター',
        'Blooming Abombinator': 'アボミネータースプラウト',
      },
    },
  ],
};

export default triggerSet;
