import Autumn, { AutumnDirections } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

type Styles = 'molb' | 'succ' | 'bomb' | 'wing';
type StyleItem = { l: Styles; r: Styles; c: number };
const styleMap: { [id: string]: StyleItem } = {
  '93CA': { l: 'molb', r: 'succ', c: 2 },
  '9408': { l: 'succ', r: 'molb', c: 2 },
  'A67D': { l: 'molb', r: 'molb', c: 2 },
  'A67E': { l: 'succ', r: 'succ', c: 2 },
  'A67F': { l: 'bomb', r: 'succ', c: 4 },
  'A680': { l: 'wing', r: 'succ', c: 4 },
  'A681': { l: 'bomb', r: 'molb', c: 4 },
  'A682': { l: 'wing', r: 'molb', c: 4 },
};
const styleFlags = {
  'bomb': 0x1,
  'wing': 0x2,
  'molb': 0x4,
  'succ': 0x8,
} as const;
const getStyleConer = (dir: number): number[] => {
  const map: { [dir: number]: [number, number] } = {
    0: [1, 7],
    2: [1, 3],
    4: [3, 5],
    6: [5, 7],
  };
  return map[dir] ?? [];
};

export interface Data extends RaidbossData {
  mode: 'none' | 'crash';
  bomb?: 'cold' | 'warm' | 'unknown';
  crush?: 'pair' | 'light' | 'unknown';
  style?: StyleItem;
  target?: string;
  debuffs: { name: string; count: number }[];
  actors: { [id: string]: NetMatches['ActorSetPos'] };
  tethers: { [id: string]: NetMatches['Tether'] };
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM2Savage',
  zoneId: ZoneId.AacCruiserweightM2Savage,
  timelineFile: 'r6s.txt',
  initData: () => ({
    mode: 'none',
    stether: 0,
    debuffs: [],
    actors: {},
    tethers: {},
  }),
  triggers: [
    {
      id: 'R6S Mousse Mural',
      type: 'StartsUsing',
      netRegex: { id: 'A6BC', source: 'Sugar Riot', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R6S Color Riot',
      type: 'StartsUsing',
      // A691 웜 아래, 콜드 위
      // A692 웜 위, 콜드 아래
      netRegex: { id: ['A691', 'A692'], source: 'Sugar Riot' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          bait: {
            en: 'Bait Tank Cleave',
            ko: '첫 탱크 클레브',
          },
          cold: {
            en: 'Bait cold ${act}',
            ko: '${act} 🔵유도해욧',
          },
          warm: {
            en: 'Bait warm ${act}',
            ko: '${act} 🔴유도해욧',
          },
          in: Outputs.in,
          out: Outputs.out,
          avoidCleave: Outputs.avoidTankCleave,
        };
        if (!Autumn.isTank(data.moks))
          return { infoText: output.avoidCleave!() };
        if (data.bomb === 'cold') {
          // 웜 유도할 것
          const act = matches.id === 'A691' ? output.out!() : output.in!();
          return { alertText: output.warm!({ act: act }) };
        } else if (data.bomb === 'warm') {
          // 콜드 유도할 것
          const act = matches.id === 'A692' ? output.out!() : output.in!();
          return { alertText: output.cold!({ act: act }) };
        }
        return { alertText: output.bait!() };
      },
    },
    {
      id: 'R6S Cold/Warm Bomb Collect',
      type: 'Ability',
      netRegex: { id: ['A693', 'A694'], source: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.target,
      run: (data, matches) => data.bomb = matches.id === 'A693' ? 'cold' : 'warm',
    },
    {
      id: 'R6S Color Crash Collect',
      type: 'StartsUsing',
      netRegex: { id: ['A68B', 'A68D'], source: 'Sugar Riot' },
      run: (data, matches) => {
        data.mode = 'crash';
        data.crush = matches.id === 'A68B' ? 'light' : 'pair';
        data.actors = {};
        data.tethers = {};
        delete data.style;
      },
    },
    {
      id: 'R6S Wingmark',
      type: 'GainsEffect',
      netRegex: { effectId: '1162' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      durationSeconds: 4,
      countdownSeconds: 4,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.crush === undefined)
          return output.text!();
        return output.combo!({ act: output[data.crush]!() });
      },
      outputStrings: {
        text: {
          en: 'Warp',
          ko: '나르샤!',
        },
        combo: {
          en: 'Warp => ${act}',
          ko: '나르샤! (${act})',
        },
        pair: Outputs.stackPartner,
        light: Outputs.stackGroup,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Color Crash',
      type: 'GainsEffect',
      netRegex: { effectId: '1162' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 5,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        if (data.crush !== undefined)
          return output[data.crush]!();
      },
      run: (data) => {
        data.mode = 'none';
        delete data.crush;
      },
      outputStrings: {
        pair: Outputs.stackPartner,
        light: Outputs.stackGroup,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Double Actors Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      condition: (data) => data.mode === 'crash',
      run: (data, matches) => data.actors[matches.id] = matches,
    },
    {
      id: 'R6S Double Style Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(styleMap), source: 'Sugar Riot', capture: true },
      condition: (data) => data.mode === 'crash',
      run: (data, matches) => data.style = styleMap[matches.id],
    },
    {
      // #650
      id: 'R6S Double Style',
      type: 'Tether',
      netRegex: { targetId: '4[0-9A-Fa-f]{7}', id: ['013F', '0140'], capture: true },
      condition: (data) => data.mode === 'crash' && data.style !== undefined,
      preRun: (data, matches) => data.tethers[matches.sourceId] = matches,
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.style === undefined)
          return;
        if (Object.keys(data.tethers).length < data.style.c)
          return;

        let comb = 0;
        let safes = [1, 3, 5, 7];
        const tethers = Object.entries(data.tethers);
        data.tethers = {};

        for (const [id, tether] of tethers) {
          const a = data.actors[id];
          if (a === undefined)
            return;

          const x = parseFloat(a.x);
          const y = parseFloat(a.y);
          const mx = ((x - 100) * -1) + 100;
          const adir = Directions.xyTo8DirNum(x, y, 100, 100);
          const mdir = Directions.xyTo8DirNum(mx, y, 100, 100);
          const corners = getStyleConer(adir);
          const mob = data.style[tether.id === '013F' ? 'l' : 'r'];
          switch (mob) {
            case 'bomb':
              safes = safes.filter((dir) => dir !== adir);
              break;
            case 'wing':
              safes = safes.filter((dir) => dir !== mdir);
              break;
            case 'succ':
              safes = safes.filter((dir) => !corners.includes(dir));
              break;
            case 'molb':
              safes = safes.filter((dir) => corners.includes(dir));
              break;
          }
          comb |= styleFlags[mob];
        }

        const [dir] = safes;
        if (safes.length !== 1 || dir === undefined) {
          console.log(`R6S Double Style - 헐랭 데이터가 잘못됨`);
          return;
        }

        const diags: { [id: number]: number } = { 1: 5, 3: 7, 5: 1, 7: 3 } as const;
        const start = diags[dir];
        if (start === undefined)
          return output.unknown!();

        if (data.options.AutumnStyle) {
          let mesg = output.unknown!();
          if (comb === styleFlags.succ) // 서큐버스 2
            mesg = output.succ!();
          else if (comb === styleFlags.molb)
            mesg = output.molb!(); // 몰볼 2
          else if (comb === (styleFlags.succ | styleFlags.molb))
            mesg = output.succmolb!(); // 서큐버스 + 몰볼
          else if ((comb & styleFlags.bomb) !== 0) {
            if ((comb & styleFlags.succ) !== 0)
              mesg = output.bombsucc!(); // 폭탄 + 서큐버스
            if ((comb & styleFlags.molb) !== 0)
              mesg = output.bombmolb!(); // 폭탄 + 몰볼
          } else if ((comb & styleFlags.wing) !== 0) {
            if ((comb & styleFlags.succ) !== 0)
              mesg = output.wingsucc!(); // 날개 + 서큐버스
            if ((comb & styleFlags.molb) !== 0)
              mesg = output.wingmolb!(); // 날개 + 몰볼
          }
          const jpmap: { [id: number]: number } = { 1: 3, 3: 5, 5: 7, 7: 1 } as const;
          const jpstart = jpmap[start]!;
          const ar = AutumnDirections.outputFromArrow8Num(start);
          const mk = AutumnDirections.outputFromMarker8Num(jpstart);
          return output.atext!({
            arrow: output[ar]!(),
            mark: output[mk]!(),
            mesg: mesg,
          });
        }

        const dir1 = Directions.outputFrom8DirNum(start);
        const dir2 = Directions.outputFrom8DirNum(dir);
        return output.text!({ dir1: output[dir1]!(), dir2: output[dir2]!() });
      },
      outputStrings: {
        text: {
          en: 'Start ${dir1}, launch towards ${dir2}',
          cn: '从 ${dir1}, 向 ${dir2} 发射',
          ko: '${dir1} 시작, ${dir2}로',
        },
        atext: {
          en: '${arrow}${mark} ${mesg}',
          ko: '${arrow}${mark} ${mesg}',
        },
        succ: {
          en: 'Succubus x2',
          ko: '서큐쪽',
        },
        molb: {
          en: 'Molbol x2',
          ko: '몰볼 안됨',
        },
        succmolb: {
          en: 'Succubus + Molbol',
          ko: '서큐 + 몰볼 안됨',
        },
        bombsucc: {
          en: 'Painted + Succubus',
          ko: '폭탄 + 서큐',
        },
        bombmolb: {
          en: 'Painted + Molbol',
          ko: '폭탄 + 몰볼 안됨',
        },
        wingsucc: {
          en: 'Heaven + Succubus',
          ko: '날개 안됨 + 서큐',
        },
        wingmolb: {
          en: 'Heaven + Molbol',
          ko: '날개 안됨 + 몰볼 안됨',
        },
        ...AutumnDirections.outputStringsArrowIntercard,
        ...AutumnDirections.outputStringsMarkerIntercard,
        ...Directions.outputStringsIntercardDir,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Sticky Mousse',
      type: 'StartsUsing',
      netRegex: { id: 'A695', source: 'Sugar Riot', capture: false },
      response: Responses.protean(),
    },
    {
      id: 'R6S Sugarscape',
      type: 'StartsUsing',
      netRegex: { id: 'A668', source: 'Sugar Riot', capture: false },
      run: (data) => data.debuffs = [],
    },
    {
      id: 'R6S Sand Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      infoText: (data, matches, output) => {
        const count = parseFloat(matches.duration);
        data.debuffs.push({ name: matches.target, count: count });
        if (data.debuffs.length < 4 || !Autumn.isTank(data.moks))
          return;
        const itsme = data.debuffs.findIndex((x) => x.name === data.me);
        return itsme === -1 ? output.provoke!() : output.shirk!();
      },
      outputStrings: {
        shirk: {
          en: '(shirk)',
          ko: '(헤이트 넘겨줘요)',
        },
        provoke: {
          en: '(provoke)',
          ko: '(프로보크)',
        },
      },
    },
    {
      id: 'R6S Sand Defamation',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      countdownSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Defamation on YOU',
          ko: '내게 대폭발',
        },
      },
    },
    {
      id: 'R6S Tether Heaven Bomb',
      type: 'Tether',
      netRegex: { id: '013F', target: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Wing bomb',
          ko: '날개 폭탄, 그냥 모래로',
        },
      },
    },
    {
      id: 'R6S Tether Painted Bomb',
      type: 'Tether',
      netRegex: { id: '0140', target: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Painted bomb',
          ko: '폭탄, 흐르는 모래로',
        },
      },
    },
    /*
    {
      id: 'R6S Sweet Shot',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '13826', capture: false },
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Arrows grid',
          ko: '화살 격자 장판',
        },
      },
    },
    */
    {
      id: 'R6S Double Style Arrows',
      type: 'StartsUsing',
      netRegex: { id: 'A689', target: 'Sugar Riot', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Arrows grid',
          ko: '화살 격자 장판',
        },
      },
    },
    {
      id: 'R6S Thunder Target',
      type: 'HeadMarker',
      netRegex: { id: '025A' },
      condition: (data, matches) => data.me === matches.target,
      alertText: (data, _matches, output) => {
        if (data.role === 'dps')
          return output.right!();
        return output.left!();
      },
      outputStrings: {
        left: {
          en: 'Thunder on YOU',
          ko: '내게 번개! 왼쪽 섬으로',
        },
        right: {
          en: 'Thunder on YOU',
          ko: '내게 번개! 오른쪽 섬으로',
        },
      },
    },
    {
      id: 'R6S Pudding Party',
      type: 'StartsUsing',
      netRegex: { id: 'A66D', source: 'Sugar Riot', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.fiveAOE!(),
      outputStrings: {
        fiveAOE: {
          en: '5x AoEs',
          ko: '5x 전체공격',
        },
      },
    },
    // Taste of Thunder/Fire 알 방법을 모르겠다
    /* 이게 아닌데
    {
      id: 'R6S Moussacre',
      type: 'Ability',
      // A6BA 한번만
      // A6BB 사람한테 4명
      netRegex: { id: 'A6BA', target: 'Sugar Riot' },
      suppressSeconds: 1,
      // response: Responses.getTowers('alert'),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Towers',
          ko: '번개 터지면 타워로',
        },
      },
    },
    */
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Sugar Riot': 'シュガーライオット',
        // フェザーサークル
        // シュガーズプリン
        // シュガーズアロー
        // グラフィティボム
        // シュガーズモルボル
        // シュガーズサキュバス
      },
    },
  ],
};

export default triggerSet;
