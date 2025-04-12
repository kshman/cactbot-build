import Autumn from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const phases = {
  A588: 'thorny', // Thorny Deathmatch
  A596: 'demolition', // Demolition Deathmatch
  A5B0: 'debris', // Debris Deathmatch
} as const;
type Phase = (typeof phases)[keyof typeof phases] | 'door' | 'unknown';

const swingDelay = [8, 30.5, 28] as const;
const swingStrings = {
  blade: {
    en: 'Close to boss',
    ko: '도넛, 보스랑 붙어요!',
  },
  club: {
    en: 'Far from boss',
    ko: '장판, 보스와 멀리!',
  },
  unknown: Outputs.unknown,
};

export interface Data extends RaidbossData {
  phase: Phase;
  sr?: 'club' | 'blade' | 'unknown';
  seeds: number;
  srcnt: number;
  thorny?: string;
  slaminator?: string;
  collect: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM3Savage',
  zoneId: ZoneId.AacCruiserweightM3Savage,
  timelineFile: 'r7s.txt',
  initData: () => ({
    phase: 'door',
    seeds: 0,
    srcnt: 0,
    collect: [],
  }),
  triggers: [
    {
      id: 'R7S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Brute Abombinator' },
      suppressSeconds: 1,
      run: (data, matches) => data.phase = phases[matches.id as keyof typeof phases] ?? 'unknown',
    },
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
      durationSeconds: 2,
      run: (data, matches) => data.sr = matches.id === 'A55D' ? 'club' : 'blade',
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
      id: 'R7S Seeds Collect',
      type: 'HeadMarker',
      netRegex: { id: '0177' },
      run: (data, matches) => data.collect.push(matches.target),
    },
    {
      id: 'R7S Seeds',
      type: 'HeadMarker',
      netRegex: { id: '0177', capture: false },
      delaySeconds: 0.1,
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
      id: 'R7S Blooming Abomination',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '13755', capture: false },
      condition: (data) => Autumn.isTank(data.moks),
      delaySeconds: 2,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Catch adds',
          ko: '쫄 헤이트!',
        },
      },
    },
    {
      id: 'R7S Winding Wildwinds',
      type: 'StartsUsing',
      netRegex: { id: 'A90D', source: 'Blooming Abomination', capture: false },
      condition: (data) => data.CanSilence(),
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Interrupt',
          ko: '와인딩 쫄에 인터럽드!!',
        },
      },
    },
    {
      id: 'R7S Quarry Swamp',
      type: 'StartsUsing',
      netRegex: { id: 'A575', source: 'Brute Abombinator', capture: false },
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Hide behind adds',
          ko: '쫄 뒤로 숨어욧',
        },
      },
    },
    {
      id: 'R7S Pulp Smash Stack',
      type: 'StartsUsing',
      netRegex: { id: 'A577', source: 'Brute Abombinator', capture: false },
      durationSeconds: 3.1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack => Protean',
          ko: '뭉쳤다 🔜 맡은 자리로',
        },
      },
    },
    {
      id: 'R7S Pulp Smash Protean',
      type: 'StartsUsing',
      netRegex: { id: 'A577', source: 'Brute Abombinator', capture: false },
      delaySeconds: 3.1,
      response: Responses.protean('alert'),
    },
    {
      id: 'R7S Neo Bombarian Special',
      type: 'StartsUsing',
      netRegex: { id: 'A57C', source: 'Brute Abombinator', capture: false },
      delaySeconds: 2,
      durationSeconds: 5.5,
      countdownSeconds: 5.5,
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
      run: (data, matches) => data.sr = matches.id === 'A57F' ? 'club' : 'blade',
    },
    {
      id: 'R7S Stoneringer Brutish Swing',
      type: 'StartsUsing',
      netRegex: { id: ['A57F', 'A580'], source: 'Brute Abombinator', capture: false },
      delaySeconds: (data) => {
        const delay = swingDelay[data.srcnt];
        if (delay === undefined)
          return 0;
        return delay;
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        const delay = swingDelay[data.srcnt];
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
      netRegex: { id: ['A585', 'A94A'], source: 'Brute Abombinator' },
      durationSeconds: (_data, matches) => matches.id === 'A585' ? 5 : 2.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line AOE + Spread',
          ko: '직선 장판 + 흩어져요',
        },
      },
    },
    {
      id: 'R7S Revenge of the Vines',
      type: 'StartsUsing',
      netRegex: { id: 'A587', source: 'Brute Abombinator', capture: false },
      durationSeconds: 4,
      response: Responses.aoe(),
    },
    {
      id: 'R7S Abominable Blink',
      type: 'HeadMarker',
      netRegex: { id: '0147' },
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          bait: {
            en: 'Bait explosion',
            ko: '내게 플레어, 멀리멀리!',
          },
          provoke: {
            en: '(Provoke)',
            ko: '(프로보크)',
          },
        };
        if (data.me === matches.target)
          return { alertText: output.bait!() };
        if (Autumn.isTank(data.moks) && data.thorny !== data.me)
          return { infoText: output.provoke!() };
      },
    },
    {
      id: 'R7S Tank Deathmatch I',
      type: 'GainsEffect',
      netRegex: { effectId: '1193' },
      run: (data, matches) => data.thorny = matches.target,
    },
    {
      id: 'R7S Deathmatch I',
      type: 'GainsEffect',
      netRegex: { effectId: '1172' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 30,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tether on YOU',
          ko: '내게 가시덤불 줄',
        },
      },
    },
    {
      id: 'R7S Sporesplosion',
      type: 'StartsUsing',
      netRegex: { id: 'A58A', source: 'Brute Abombinator', capture: false },
      durationSeconds: 10,
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
      run: (data) => data.seeds = 0,
    },
    {
      id: 'R7S Strange Seeds Index',
      type: 'StartsUsing',
      netRegex: { id: 'A598', source: 'Brute Abombinator', capture: false },
      suppressSeconds: 1,
      run: (data) => data.seeds++,
    },
    {
      id: 'R7S Strange Seeds',
      type: 'HeadMarker',
      netRegex: { id: '01D2' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.1,
      durationSeconds: 3,
      alertText: (data, _matches, output) => output.text!({ num: data.seeds }),
      outputStrings: {
        text: {
          en: 'Seed #${num} on YOU',
          ko: '내게 ${num}번째 씨앗!',
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
    /*
    {
      id: 'R7S Stoneringer 2',
      type: 'StartsUsing',
      netRegex: { id: ['A5A0', 'A5A1'], source: 'Brute Abombinator' },
    },
    */
    {
      id: 'R7S Stoneringer 2 Brutish Swing',
      type: 'StartsUsing',
      netRegex: { id: ['A5A3', 'A5A5'], source: 'Brute Abombinator' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === 'A5A3')
          return output.club!();
        return output.blade!();
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
          ko: '왼쪽으로!',
        },
        right: {
          en: 'Right',
          ko: '오른쪽으로!',
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
        if (Autumn.isTank(data.moks)) {
          if (data.slaminator === undefined)
            return { alertText: output.tank!() };
          if (data.slaminator !== data.me)
            return { alertText: output.mine!() };
        }
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
      id: 'R7S Debris Pair',
      type: 'HeadMarker',
      netRegex: { id: '005D', capture: false },
      condition: (data) => data.phase === 'debris',
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Cardinal Pair',
          ko: '십자로 모서리 둘이 페어',
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
