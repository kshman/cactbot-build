import Autumn, { AutumnDir } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

type Styles = 'mbol' | 'succ' | 'bomb' | 'wing';
type StyleItem = { l: Styles; r: Styles; c: number };
const styleMap: { [id: string]: StyleItem } = {
  '93CA': { l: 'mbol', r: 'succ', c: 2 },
  '9408': { l: 'succ', r: 'mbol', c: 2 },
  'A67D': { l: 'mbol', r: 'mbol', c: 2 },
  'A67E': { l: 'succ', r: 'succ', c: 2 },
  'A67F': { l: 'bomb', r: 'succ', c: 4 },
  'A680': { l: 'wing', r: 'succ', c: 4 },
  'A681': { l: 'bomb', r: 'mbol', c: 4 },
  'A682': { l: 'wing', r: 'mbol', c: 4 },
};
const styleFlags = {
  'mbol': 0x1,
  'succ': 0x2,
  'bomb': 0x4,
  'wing': 0x8,
} as const;
const styleCorner: { [dir: number]: [number, number] } = {
  0: [1, 7],
  2: [1, 3],
  4: [3, 5],
  6: [5, 7],
};
const getStyleConer = (dir: number): number[] => styleCorner[dir] ?? [];

export interface Data extends RaidbossData {
  hate?: string;
  riot?: 'cold' | 'warm';
  isCrush?: boolean;
  crushMech?: 'pair' | 'light';
  styleItem?: StyleItem;
  styleActors: { [id: string]: NetMatches['ActorSetPos'] };
  styleTethers: { [id: string]: NetMatches['Tether'] };
  sandDebuffs: { name: string; count: number }[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM2Savage',
  zoneId: ZoneId.AacCruiserweightM2Savage,
  timelineFile: 'r6s.txt',
  initData: () => ({
    styleActors: {},
    styleTethers: {},
    sandDebuffs: [],
  }),
  triggers: [
    {
      id: 'R6S Auto Attack',
      type: 'Ability',
      netRegex: { id: 'A7B4', source: 'Sugar Riot' },
      run: (data, matches) => data.hate = matches.target,
    },
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
            ja: 'タンク範囲誘導',
            ko: '첫 탱크 클레브',
          },
          cold: {
            en: 'Bait cold ${act}',
            ja: '${act} 🔵誘導',
            ko: '${act} 🔵유도해욧',
          },
          warm: {
            en: 'Bait warm ${act}',
            ja: '${act} 🔴誘導',
            ko: '${act} 🔴유도해욧',
          },
          in: Outputs.in,
          out: Outputs.out,
          avoidCleave: Outputs.avoidTankCleave,
        };
        if (!Autumn.isTank(data.moks))
          return { infoText: output.avoidCleave!() };
        if (data.riot === 'cold') {
          // 웜 유도할 것
          const act = matches.id === 'A691' ? output.out!() : output.in!();
          return { alertText: output.warm!({ act: act }) };
        } else if (data.riot === 'warm') {
          // 콜드 유도할 것
          const act = matches.id === 'A692' ? output.out!() : output.in!();
          return { alertText: output.cold!({ act: act }) };
        }
        return { alertText: output.bait!() };
      },
    },
    {
      id: 'R6S Cold/Warm Collect',
      type: 'Ability',
      netRegex: { id: ['A693', 'A694'], source: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.target,
      run: (data, matches) => data.riot = matches.id === 'A693' ? 'cold' : 'warm',
    },
    {
      id: 'R6S Color Crash Collect',
      type: 'StartsUsing',
      netRegex: { id: ['A68B', 'A68D'], source: 'Sugar Riot' },
      run: (data, matches) => {
        data.isCrush = true;
        data.crushMech = matches.id === 'A68B' ? 'light' : 'pair';
        data.styleActors = {};
        data.styleTethers = {};
        delete data.styleItem;
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
        if (data.crushMech === undefined)
          return output.text!();
        return output.combo!({ act: output[data.crushMech]!() });
      },
      outputStrings: {
        text: {
          en: 'Warp',
          ja: 'ワープ',
          ko: '나르샤!',
        },
        combo: {
          en: 'Warp => ${act}',
          ja: 'ワープ (${act})',
          ko: '나르샤! (${act})',
        },
        pair: Outputs.stackPartner,
        light: Outputs.healerGroups,
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
        if (data.crushMech !== undefined)
          return output[data.crushMech]!();
      },
      run: (data) => {
        delete data.isCrush;
        delete data.crushMech;
      },
      outputStrings: {
        pair: Outputs.stackPartner,
        light: Outputs.healerGroups,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Double Actors Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}' },
      condition: (data) => data.isCrush,
      run: (data, matches) => data.styleActors[matches.id] = matches,
    },
    {
      id: 'R6S Double Style Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(styleMap), source: 'Sugar Riot' },
      condition: (data) => data.isCrush,
      run: (data, matches) => data.styleItem = styleMap[matches.id],
    },
    {
      // #650
      id: 'R6S Double Style',
      type: 'Tether',
      netRegex: { sourceId: '4[0-9A-Fa-f]{7}', id: ['013F', '0140'] },
      condition: (data) => data.isCrush && data.styleItem !== undefined,
      preRun: (data, matches) => data.styleTethers[matches.sourceId] = matches,
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.styleItem === undefined)
          return;
        if (Object.keys(data.styleTethers).length < data.styleItem.c)
          return;

        let comb = 0;
        let safes = [1, 3, 5, 7];
        const tethers = Object.entries(data.styleTethers);
        data.styleTethers = {};

        for (const [id, tether] of tethers) {
          const a = data.styleActors[id];
          if (a === undefined)
            return;

          const x = parseFloat(a.x);
          const y = parseFloat(a.y);
          const mx = ((x - 100) * -1) + 100;
          const adir = Directions.xyTo8DirNum(x, y, 100, 100);
          const mdir = Directions.xyTo8DirNum(mx, y, 100, 100);
          const corners = getStyleConer(adir);
          const mob = data.styleItem[tether.id === '013F' ? 'l' : 'r'];
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
            case 'mbol':
              safes = safes.filter((dir) => corners.includes(dir));
              break;
          }
          comb |= styleFlags[mob];
        }

        const [dir] = safes;
        if (safes.length !== 1 || dir === undefined)
          return;

        const diags: { [id: number]: number } = { 1: 5, 3: 7, 5: 1, 7: 3 } as const;
        const start = diags[dir];
        if (start === undefined)
          return output.unknown!();

        let mesg = output.unknown!();
        if (comb === styleFlags.succ) // 서큐버스 2
          mesg = output.succ!();
        else if (comb === styleFlags.mbol)
          mesg = output.mbol!(); // 몰볼 2
        else if (comb === (styleFlags.succ | styleFlags.mbol))
          mesg = output.succmbol!(); // 서큐버스 + 몰볼
        else if ((comb & styleFlags.bomb) !== 0) {
          if ((comb & styleFlags.succ) !== 0)
            mesg = output.bombsucc!(); // 폭탄 + 서큐버스
          if ((comb & styleFlags.mbol) !== 0)
            mesg = output.bombmbol!(); // 폭탄 + 몰볼
        } else if ((comb & styleFlags.wing) !== 0) {
          if ((comb & styleFlags.succ) !== 0)
            mesg = output.wingsucc!(); // 날개 + 서큐버스
          if ((comb & styleFlags.mbol) !== 0)
            mesg = output.wingmbol!(); // 날개 + 몰볼
        }
        return output.text!({ dir: output[AutumnDir.dirFromNum(start)]!(), mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${dir} ${mesg}',
          ja: '${dir} (${mesg})',
          ko: '${dir} (${mesg})',
        },
        succ: {
          en: 'Succubus x2',
          ja: 'サキュバス x2',
          ko: '서큐쪽',
        },
        mbol: {
          en: 'Molbol x2',
          ja: 'モルボル x2',
          ko: '몰볼 안됨',
        },
        succmbol: {
          en: 'Succubus + Molbol',
          ja: 'サキュバス + モルボル',
          ko: '서큐 + 몰볼 안됨',
        },
        bombsucc: {
          en: 'Painted + Succubus',
          ja: '爆誕 + サキュバス',
          ko: '폭탄 + 서큐',
        },
        bombmbol: {
          en: 'Painted + Molbol',
          ja: '爆誕 + モルボル',
          ko: '폭탄 + 몰볼 안됨',
        },
        wingsucc: {
          en: 'Heaven + Succubus',
          ja: '羽根つき + サキュバス',
          ko: '날개 안됨 + 서큐',
        },
        wingmbol: {
          en: 'Heaven + Molbol',
          ja: '羽根つき + モルボル',
          ko: '날개 안됨 + 몰볼 안됨',
        },
        unknown: Outputs.unknown,
        ...AutumnDir.stringsAimCross,
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
      run: (data) => data.sandDebuffs = [],
    },
    {
      id: 'R6S Sand Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      infoText: (data, matches, output) => {
        const count = parseFloat(matches.duration);
        data.sandDebuffs.push({ name: matches.target, count: count });
        if (data.sandDebuffs.length < 4 || !Autumn.isTank(data.moks))
          return;
        const itsme = data.sandDebuffs.findIndex((x) => x.name === data.me);
        if (itsme === -1) {
          if (data.hate !== data.me)
            return output.provoke!();
          return;
        }
        if (data.hate === data.me)
          return output.shirk!();
      },
      outputStrings: {
        shirk: {
          en: '(shirk)',
          ja: '(シャク)',
          ko: '(헤이트 넘겨줘요)',
        },
        provoke: {
          en: '(provoke)',
          ja: '(挑発)',
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
      alertText: (_data, _matches, output) => output.defamation!(),
      outputStrings: {
        defamation: Outputs.defamationOnYou,
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
          ja: '羽根爆弾、砂へ',
          ko: '날개 폭탄, 모래로',
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
          ja: '爆弾、流砂へ',
          ko: '그냥 폭탄, 늪으로!',
        },
      },
    },
    {
      id: 'R6S Manxome Windersnatch',
      type: 'Ability',
      netRegex: { id: 'A6AD', source: 'Jabberwock' },
      durationSeconds: 3,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          wock: {
            en: 'Jabberwock appears',
            ja: 'ジャバウォック出現',
            ko: '재버워크 나왔어요',
          },
          bind: {
            en: 'Jabberwock binds YOU',
            ja: 'ジャバウォックがわたしに！',
            ko: '내게 재버워크 바인드!',
          },
        };
        if (data.me === matches.target)
          return { alertText: output.bind!() };
        return { infoText: output.wock!() };
      },
    },
    {
      id: 'R6S Ready Ore Not',
      type: 'StartsUsing',
      netRegex: { id: 'A6AA', source: 'Sugar Riot', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R6S Single Style',
      type: 'StartsUsing',
      netRegex: { id: '9A3D', source: 'Sugar Riot', capture: false },
      durationSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Avoid arrows grid',
          ja: '矢印のグリッド',
          ko: '화살 격자 장판',
        },
      },
    },
    {
      id: 'R6S Double Style Arrows',
      type: 'StartsUsing',
      netRegex: { id: ['A687', 'A689'], source: 'Sugar Riot' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        const act = matches.id === 'A687' ? 'group' : 'spread';
        return output.text!({ act: output[act]!() });
      },
      outputStrings: {
        text: {
          en: '${act} + Arrows grid',
          ja: '${act} + 矢印のグリッド',
          ko: '${act} + 화살 격자 장판',
        },
        group: Outputs.healerGroups,
        spread: Outputs.spread,
      },
    },
    {
      id: 'R6S Taste of Thunder',
      type: 'StartsUsing',
      netRegex: { id: 'A69D', source: 'Sugar Riot', capture: false },
      durationSeconds: 3,
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
    {
      id: 'R6S Thunder Target',
      type: 'HeadMarker',
      netRegex: { id: '025A' },
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          left: {
            en: 'Thunder on YOU',
            ja: '自分に雷！左の島へ',
            ko: '내게 번개! 왼쪽 섬으로',
          },
          right: {
            en: 'Thunder on YOU',
            ja: '自分に雷！右の島へ',
            ko: '내게 번개! 오른쪽 섬으로',
          },
          provoke: {
            en: '(provoke)',
            ja: '(挑発)',
            ko: '(프로보크)',
          },
        };
        if (data.me !== matches.target) {
          if (data.role !== 'tank')
            return;
          const m = data.party.member(matches.target);
          if (m.role !== 'tank')
            return;
          return { infoText: output.provoke!() };
        }
        if (data.role === 'dps')
          return { alertText: output.right!() };
        return { alertText: output.left!() };
      },
    },
    {
      id: 'R6S Pudding Party',
      type: 'StartsUsing',
      netRegex: { id: 'A66D', source: 'Sugar Riot', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.fiveAOE!(),
      outputStrings: {
        fiveAOE: {
          en: 'Raidwide x5',
          ja: '頭割り x5',
          ko: '뭉쳐욧 x5',
        },
      },
    },
    {
      id: 'R6S Last Layer',
      type: 'StartsUsing',
      netRegex: { id: 'A66D', source: 'Sugar Riot', capture: false },
      delaySeconds: 8.7,
      infoText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: {
          en: 'Go to island',
          ja: '担当の島へ',
          ko: '맡은 섬으로!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Mouthwatering Morbol': 'Zucker-Morbol',
        'Sugar Riot': 'Zuckerschock',
        'Sweet Shot': 'Zuckerpfeil',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(snapshot\\)': '(Speichern)',
        '--2x Feather Ray targetable--': '--2x Federrochen anvisierbar--',
        '--2x Mu targetable--': '--2x Mu anvisierbar--',
        '--Gimme Cat targetable--': '--Bettelcat anvisierbar--',
        '--Jabberwock targetable--': '--Brabbelback anvisierbar--',
        '--Yan targetable--': '--Putschi anvisierbar--',
        '--jump\\?--': '--Sprung?--',
        'Artistic Anarchy': 'Artistische Anarchie',
        'Bad Breath': 'Schlechter Atem',
        'Brûlée': 'Wärmeentladung',
        'Burst': 'Explosion',
        'Color Clash': 'Farbbruch',
        'Color Riot': 'Farbenschock',
        'Cool Bomb': 'Kalte Farbbombe',
        'Crowd Brûlée': 'Hitzeentladung',
        'Dark Mist': 'Schattenhauch',
        'Double Style': 'Doppel-Graffiti',
        'Explosion': 'Explosion',
        'Layer': 'Feinschliff',
        'Levin Drop': 'Stromfluss',
        'Lightning Bolt': 'Blitzschlag',
        'Lightning Storm': 'Blitzsturm',
        'Live Painting': 'Sofortkunst',
        'Moussacre': 'Mousse-Marsch',
        'Mousse Drip': 'Mousse-Spritzer',
        'Mousse Mural': 'Mousse-Regen',
        'Pudding Graf': 'Pudding-Platzer',
        'Pudding Party': 'Pudding-Party',
        'Ready Ore Not': 'Edelstein-Regen',
        'Rush': 'Stürmen',
        'Single Style': 'Einzel-Graffiti',
        'Soul Sugar': 'Zuckerseele',
        'Spray Pain': 'Nadelschuss',
        'Sticky Mousse': 'Klebriges Mousse',
        'Sugarscape': 'Landschaftsmalerei',
        'Taste of Fire': 'Zuckerfeuer',
        'Taste of Thunder': 'Zuckerblitz',
        'Warm Bomb': 'Warme Farbbombe',
        'Wingmark': 'Flügelzeichen',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Mouthwatering Morbol': 'Morbol mielleux',
        'Sugar Riot': 'Sugar Riot',
        'Sweet Shot': 'Flèche sirupeuse',
      },
      'replaceText': {
        '\\(cast\\)': '(Incantation)',
        '\\(snapshot\\)': '(Enregistré)',
        '--2x Feather Ray targetable--': '-- 2x Manta ciblable--',
        '--2x Mu targetable--': '-- 2x Mu ciblable --',
        '--Gimme Cat targetable--': '-- Chat-pardeur ciblable --',
        '--Jabberwock targetable--': '-- Jabberwocky ciblable --',
        '--Yan targetable--': '-- Belhamel ciblable --',
        '--jump\\?--': '-- Saut --',
        'Artistic Anarchy': 'Anarchie artistique',
        'Bad Breath': 'Mauvaise haleine',
        'Brûlée': 'Dissipation thermique',
        'Burst': 'Explosion',
        'Color Clash': 'Impact chromatique',
        'Color Riot': 'Révolte chromatique',
        'Cool Bomb': 'Bombe de couleurs froides',
        'Crowd Brûlée': 'Dissipation enflammée',
        'Dark Mist': 'Brume funèbre',
        'Double Style': 'Double graffiti',
        'Explosion': 'Explosion',
        'Layer': 'Retouche',
        'Levin Drop': 'Courant électrique',
        'Lightning Bolt': 'Fulguration',
        'Lightning Storm': 'Pluie d\'éclairs',
        'Live Painting': 'Peinture vivante',
        'Moussacre': 'Défilé de mousse',
        'Mousse Drip': 'Mousse éclaboussante',
        'Mousse Mural': 'Averse de mousse',
        'Pudding Graf': 'Pudding pétulent',
        'Pudding Party': 'Fête du flan',
        'Ready Ore Not': 'Gemmes la pluie !',
        'Rush': 'Ruée',
        'Single Style': 'Graffiti simple',
        'Soul Sugar': 'Âme en sucre',
        'Spray Pain': 'Aiguilles foudroyantes',
        'Sticky Mousse': 'Mousse collante',
        'Sugarscape': 'Nature morte',
        'Taste of Fire': 'Feu sirupeux',
        'Taste of Thunder': 'Foudre sucrée',
        'Warm Bomb': 'Bombe de couleurs chaudes',
        'Wingmark': 'Emblème ailé',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Mouthwatering Morbol': 'シュガーズモルボル',
        'Sugar Riot': 'シュガーライオット',
        'Sweet Shot': 'シュガーズアロー',
      },
      'replaceText': {
        'Artistic Anarchy': 'アーティスティック・アナーキー',
        'Bad Breath': '臭い息',
        'Brûlée': '熱放散',
        'Burst': '爆発',
        'Color Clash': 'カラークラッシュ',
        'Color Riot': 'カラーライオット',
        'Cool Bomb': 'コールドペイントボム',
        'Crowd Brûlée': '重熱放散',
        'Dark Mist': 'ダークミスト',
        'Double Style': 'ダブル・グラフィティ',
        'Layer': 'アレンジ',
        'Levin Drop': '雷流',
        'Lightning Bolt': 'いなずま',
        'Lightning Storm': '百雷',
        'Live Painting': 'ライブペインティング',
        'Moussacre': 'ムース大行進',
        'Mousse Drip': 'びちゃっとムース',
        'Mousse Mural': 'ムースシャワー',
        'Pudding Graf': 'ぼっかんプリン',
        'Pudding Party': 'プリンパーティー',
        'Ready Ore Not': '原石あげる',
        'Rush': '突進',
        'Single Style': 'シングル・グラフィティ',
        'Soul Sugar': 'シュガーソウル',
        'Spray Pain': '針飛ばし',
        'Sticky Mousse': 'ねばねばムース',
        'Sugarscape': 'ランドスケープ',
        'Taste of Fire': 'シュガーファイア',
        'Taste of Thunder': 'シュガーサンダー',
        'Warm Bomb': 'ウォームペイントボム',
        'Wingmark': 'ウイングマーク',
      },
    },
    {
      'locale': 'cn',
      'missingTranslations': true,
      'replaceSync': {
        'Mouthwatering Morbol': '糖糖魔界花',
        'Sugar Riot': '狂热糖潮',
        'Sweet Shot': '糖糖箭',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(snapshot\\)': '(快照)',
        '--2x Feather Ray targetable--': '--2x 羽环鳐 可选中--',
        '--2x Mu targetable--': '--2x 亩鼠 可选中--',
        '--Gimme Cat targetable--': '--索取猫 可选中--',
        '--Jabberwock targetable--': '--炸脖龙 可选中--',
        '--Yan targetable--': '--羊 可选中--',
        '--jump\\?--': '--跳?--',
        'Artistic Anarchy': '艺术大乱斗',
        'Bad Breath': '臭气',
        'Brûlée': '热扩散',
        'Burst': '爆炸',
        'Color Clash': '色彩冲击',
        'Color Riot': '色彩狂热',
        'Cool Bomb': '冷色爆弹怪',
        'Crowd Brûlée': '重热扩散',
        'Dark Mist': '暗黑雾',
        'Double Style': '双手涂鸦',
        'Explosion': '爆炸',
        'Layer': '添笔',
        'Levin Drop': '雷流',
        'Lightning Bolt': '落雷',
        'Lightning Storm': '百雷',
        'Live Painting': '即兴绘画',
        'Moussacre': '慕斯慕斯冲',
        'Mousse Drip': '啪叽慕斯怪',
        'Mousse Mural': '慕斯怪大雨',
        'Pudding Graf': '咣当软糊怪',
        'Pudding Party': '软糊怪派对',
        'Ready Ore Not': '给你原石',
        'Rush': '突进',
        'Single Style': '单手涂鸦',
        'Soul Sugar': '糖糖之魂',
        'Spray Pain': '飞针',
        'Sticky Mousse': '黏黏慕斯怪',
        'Sugarscape': '糖心绘景',
        'Taste of Fire': '糖糖火炎',
        'Taste of Thunder': '糖糖闪雷',
        'Warm Bomb': '暖色爆弹怪',
        'Wingmark': '翅膀标记',
      },
    },
  ],
};

export default triggerSet;
