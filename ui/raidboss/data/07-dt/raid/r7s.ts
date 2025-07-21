import Autumn, { AutumnCond } from '../../../../../resources/autumn';
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
    ja: 'ドーナツ、ボスに近づいて！',
    ko: '도넛, 보스랑 붙어요!',
  },
  club: {
    en: 'Far from boss',
    ja: 'ゆか、ボスから離れる',
    ko: '장판, 보스 멀리멀리!',
  },
  unknown: Outputs.unknown,
};

export interface Data extends RaidbossData {
  phase: Phase;
  hate?: string;
  sr?: 'club' | 'blade' | 'unknown';
  smashes: number;
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
    smashes: 0,
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
      id: 'R7S Auto Attack',
      type: 'Ability',
      netRegex: { id: 'A55A', source: 'Brute Abombinator' },
      run: (data, matches) => data.hate = matches.target,
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
          ja: '連続全体攻撃',
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
            ja: '${sr} 🔜 ${smash}',
            ko: '${sr} 🔜 ${smash}',
          },
          htank: {
            en: 'Closest Tank Share',
            ja: 'タンク近いシェア',
            ko: '가까이 버스터',
          },
          hother: {
            en: 'Far from boss',
            ja: 'ボスから離れる',
            ko: '보스 멀리',
          },
          ttank: {
            en: 'Far Tank Share',
            ja: 'タンク遠いシェア',
            ko: '멀리 버스터',
          },
          tother: {
            en: 'Close to boss',
            ja: 'ボスに近づく',
            ko: '보스 가까이',
          },
          blade: Outputs.in,
          club: Outputs.out,
          unknown: Outputs.unknown,
        };
        data.smashes++;
        const sr = data.sr ?? 'unknown';
        let tank = Autumn.isTank(data.moks);
        if (tank) {
          // 1번은 MT가 2번은 ST가
          // 3,4번은 둘이 함께
          if (data.smashes === 1 && data.hate !== data.me)
            tank = false;
          if (data.smashes === 2 && data.hate === data.me)
            tank = false;
        }
        const smash = matches.id === 'A55F'
          ? (tank ? 'htank' : 'hother')
          : (tank ? 'ttank' : 'tother');
        if (tank)
          return { alertText: output.text!({ sr: output[sr]!(), smash: output[smash]!() }) };
        return { infoText: output.text!({ sr: output[sr]!(), smash: output[smash]!() }) };
      },
    },
    {
      id: 'R7S Seeds',
      type: 'HeadMarker',
      netRegex: { id: '0177' },
      durationSeconds: 5,
      alertText: (data, matches, output) => {
        data.collect.push(matches.target);
        if (data.me === matches.target)
          return output.seed!();
      },
      outputStrings: {
        seed: {
          en: 'Bait seed',
          ja: '自分に種',
          ko: '내게 씨앗!',
        },
      },
    },
    {
      id: 'R7S Seeds Puddle',
      type: 'HeadMarker',
      netRegex: { id: '0177', capture: false },
      delaySeconds: 0.1,
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.collect.includes(data.me))
          return output.puddle!();
      },
      run: (data) => data.collect = [],
      outputStrings: {
        puddle: {
          en: 'Bait puddles',
          ja: '自分にゆかx3',
          ko: '내게 장판x3',
        },
      },
    },

    {
      id: 'R7S Winding Wildwinds',
      type: 'StartsUsing',
      netRegex: { id: 'A90D', source: 'Blooming Abomination', capture: false },
      condition: AutumnCond.onlyAutumn(),
      durationSeconds: 5,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (Autumn.isTank(data.moks))
          return output.winding!();
      },
      outputStrings: {
        winding: {
          en: 'Interrupt',
          ja: 'インタラプト',
          ko: 'Winding Wildwinds 인터럽트!!',
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
          ja: '雑魚の後ろに隠れる',
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
          ja: '頭割り 🔜 散会',
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
          ja: '北へ！',
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
        return delay === undefined ? 0 : delay;
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (swingDelay[data.srcnt] === undefined)
          return;
        return output[data.sr ?? 'unknown']!();
      },
      run: (data) => data.srcnt++,
      outputStrings: swingStrings,
    },
    {
      id: 'R7S Glower Power',
      type: 'StartsUsing',
      netRegex: { id: ['A585', 'A94A'], source: 'Brute Abombinator' },
      durationSeconds: (_data, matches) => matches.id === 'A585' ? 5 : 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line AOE + Spread',
          ja: '直線範囲攻撃 + 散会',
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
          flare: {
            en: 'Flare on YOU',
            ja: '自分にフレア',
            ko: '내게 플레어!',
          },
          provoke: {
            en: '(Provoke)',
            ja: '(挑発)',
            ko: '(프로보크)',
          },
        };
        if (data.me === matches.target)
          return { alertText: output.flare!() };
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
          ja: '自分に線',
          ko: '내게 가시덤불 줄',
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
          ja: '自分に${num}番目の種',
          ko: '내게 ${num}번째 씨앗!',
        },
      },
    },
    {
      id: 'R7S Killer Seeds',
      type: 'StartsUsing',
      netRegex: { id: 'A59B', source: 'Brute Abombinator', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.stackPartner,
      },
    },
    {
      id: 'R7S Powerslam',
      type: 'StartsUsing',
      netRegex: { id: 'A59E', source: 'Brute Abombinator', capture: false },
      durationSeconds: 5,
      response: Responses.bigAoe('alert'),
    },
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
      outputStrings: swingStrings,
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
          ja: '左へ',
          ko: '왼쪽으로!',
        },
        right: {
          en: 'Right',
          ja: '右へ',
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
            ja: '塔避ける！',
            ko: '타워 피해욧!',
          },
          tank: {
            en: 'Tank tower',
            ja: 'タンク塔踏み',
            ko: '탱크 무적으로 타워!',
          },
          tower: {
            en: 'Get tower',
            ja: '塔踏み',
            ko: '내가 무적으로 타워!',
          },
        };
        if (Autumn.isTank(data.moks)) {
          if (data.slaminator === undefined) {
            if (data.hate === data.me)
              return { alertText: output.tower!() };
            return { infoText: output.tank!() };
          }
          if (data.slaminator !== data.me)
            return { alertText: output.tower!() };
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
      countdownSeconds: 4.5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Cardinal Pair',
          ja: '十字にペア',
          ko: '십자로 둘이 페어',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Smash Here/Smash There': 'Smash Here/There',
        'Winding Wildwinds/Crossing Crosswinds': 'Wildwinds/Crosswinds',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Blooming Abomination': 'Biestinator-Spross',
        'Brute Abombinator': 'Brutalo Biestinator',
      },
      'replaceText': {
        '--middile--': '--mitte--',
        '\\(adds': '(Adds',
        'cast\\)': 'Wirken)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(puddles\\)': '(Flächen)',
        '\\(seeds drop\\)': '(Saaten ablegen)',
        'Abominable Blink': 'Brutalo-Funken',
        'Brutal Impact': 'Knallender Impakt',
        'Brutal Smash': 'Brutalo-Schlag',
        'Brutish Swing': 'Brutalo-Schwung',
        'Crossing Crosswinds': 'Kreuzwind',
        'Debris Deathmatch': 'Dornenwand-Todeskampf',
        'Demolition Deathmatch': 'Dornengebäude-Todeskampf',
        'Electrogenetic Force': 'Blitzschlag',
        'Explosion': 'Explosion',
        'Glower Power': 'Brutalo-Blick',
        'Grappling Ivy': 'Efeuhaken',
        'Hurricane Force': 'Sturmgewalt',
        '(?<! )Impact': 'Impakt',
        'Killer Seeds': 'Schwerer Samen',
        'Lashing Lariat': 'Efeu-Lariat',
        'Neo Bombarian Special': 'Neo-Brutalo-Spezial',
        'Pollen': 'Pollen',
        'Powerslam': 'Bombensturz',
        'Pulp Smash': 'Dornenschlag',
        'Quarry Swamp': 'Versteinernde Welle',
        'Revenge of the Vines': 'Welt der Dornen',
        'Roots of Evil': 'Dornenglühen',
        'Sinister Seeds': 'Streusamen',
        'Slaminator': 'Brutalo-Sturz',
        'Smash Here': 'Naher Schlag',
        'Smash There': 'Ferner Schlag',
        'Special Bombarian Special': 'Ultimativer Brutalo-Spezial',
        'Spore Sac': 'Sporensack',
        'Sporesplosion': 'Sporenwolke',
        'Stoneringer(?![s ])': 'Steinwaffe',
        'Stoneringer 2: Stoneringers': 'Steinwaffen-Kombo',
        'Strange Seeds': 'Verwehte Samen',
        'Tendrils of Terror': 'Dornenzaun',
        'The Unpotted': 'Dornenwelle',
        'Thorny Deathmatch': 'Dornen-Todeskampf',
        'Winding Wildwinds': 'Kreiswind',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Blooming Abomination': 'Germe de Bombinator',
        'Brute Abombinator': 'Brute Bombinator',
      },
      'replaceText': {
        '--middile--': '-- Millieu --',
        '\\(adds': '(Adds',
        'cast\\)': 'incantation)',
        '\\(enrage\\)': '(Enrage)',
        '\\(puddles\\)': '(Puddles)',
        '\\(seeds drop\\)': '(Dépose des graines)',
        'Abominable Blink': 'Étincelle brutale',
        'Brutal Impact': 'Impact brutal',
        'Brutal Smash': 'Impact brutal',
        'Brutish Swing': 'Swing brutal',
        'Crossing Crosswinds': 'Bourrasque croisée',
        'Debris Deathmatch': 'Mise à mort épineuse emprisonnée',
        'Demolition Deathmatch': 'Mise à mort épineuse gigantesque',
        'Electrogenetic Force': 'Doigt filiforme',
        'Explosion': 'Explosion',
        'Glower Power': 'Regard brutal',
        'Grappling Ivy': 'Projection spinescente',
        'Hurricane Force': 'Grande tempête de vent',
        '(?<! )Impact(?! )': 'Ensevelissement',
        'Killer Seeds': 'Grosse graine',
        'Lashing Lariat': 'Lariat épineux',
        'Neo Bombarian Special': 'Néo-spéciale brutale',
        'Pollen': 'Pollen',
        'Powerslam': 'Explongeon',
        'Pulp Smash': 'Impact épineux',
        'Quarry Swamp': 'Vague de pétrification',
        'Revenge of the Vines': 'Règne des épines',
        'Roots of Evil': 'Poussée d\'épines',
        'Sinister Seeds': 'Éparpillement des graines',
        'Slaminator': 'Plongeon brutal',
        'Smash Here': 'Balayage proche',
        'Smash There': 'Balayage éloigné',
        'Special Bombarian Special': 'Spéciale brutale ultime',
        'Spore Sac': 'Sac de spores',
        'Sporesplosion': 'Nuage de spores',
        'Stoneringer(?![s ])': 'Arme de pierre',
        'Stoneringer 2: Stoneringers': 'Armes de pierre jumelles',
        'Strange Seeds': 'Dissémination de graines',
        'Tendrils of Terror': 'Grille épineuse',
        'The Unpotted': 'Onde épineuse',
        'Thorny Deathmatch': 'Mise à mort épineuse',
        'Winding Wildwinds': 'Bourrasque circulaire',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Blooming Abomination': 'アボミネータースプラウト',
        'Brute Abombinator': 'ブルートアボミネーター',
      },
      'replaceText': {
        'Abominable Blink': 'ブルートスパーク',
        'Brutal Impact': 'スマッシュインパクト',
        'Brutal Smash': 'ブルートスマッシュ',
        'Brutish Swing': 'ブルートスイング',
        'Crossing Crosswinds': 'クロッシングゲイル',
        'Debris Deathmatch': 'ソーンデスマッチ・ウォール',
        'Demolition Deathmatch': 'ソーンデスマッチ・ビルディング',
        'Electrogenetic Force': '雷撃',
        'Explosion': '爆発',
        'Glower Power': 'ブルートグラワー',
        'Grappling Ivy': 'アイビーグラップル',
        'Hurricane Force': '大暴風',
        '(?<! )Impact': '衝撃',
        'Killer Seeds': 'ヘビーシード',
        'Lashing Lariat': 'アイビーラリアット',
        'Neo Bombarian Special': 'ネオ・ボンバリアンスペシャル',
        'Pollen': '花粉',
        'Powerslam': 'パワーダイブ',
        'Pulp Smash': 'ソーンスマッシュ',
        'Quarry Swamp': '石化の波動',
        'Revenge of the Vines': 'ソーンワールド',
        'Roots of Evil': 'ソーングロウ',
        'Sinister Seeds': 'スキャッターシード',
        'Slaminator': 'ブルートダイブ',
        'Smash Here': 'ニア・スマッシュ',
        'Smash There': 'ファー・スマッシュ',
        'Special Bombarian Special': 'アルティメット・ボンバリアンスペシャル',
        'Spore Sac': 'スポアサック',
        'Sporesplosion': 'スポアクラウド',
        'Stoneringer(?![s ])': 'ストーンウェポン',
        'Stoneringer 2: Stoneringers': 'ストーンウェポン：ツイン',
        'Strange Seeds': 'ブロウシード',
        'Tendrils of Terror': 'ソーンフェンス',
        'The Unpotted': 'ソーンウェーブ',
        'Thorny Deathmatch': 'ソーンデスマッチ',
        'Winding Wildwinds': 'リングゲイル',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Blooming Abomination': '恨心花芽',
        'Brute Abombinator': '野蛮恨心',
      },
      'replaceText': {
        '--middile--': '--中间--',
        '\\(adds': '(小怪',
        'cast\\)': '咏唱)',
        '\\(enrage\\)': '(狂暴)',
        '\\(puddles': '(圈',
        '\\(seeds drop\\)': '(种子落下)',
        'Abominable Blink': '野蛮电火花',
        'Brutal Impact': '野蛮碎击',
        'Brutal Smash': '野蛮挥打',
        'Brutish Swing': '野蛮横扫',
        'Crossing Crosswinds': '交叉突风',
        'Debris Deathmatch': '荆棘生死战：墙面',
        'Demolition Deathmatch': '荆棘生死战：楼体',
        'Electrogenetic Force': '雷击',
        'Explosion': '爆炸',
        'Glower Power': '野蛮怒视',
        'Grappling Ivy': '藤蔓攀附',
        'Hurricane Force': '飓风',
        '(?<! )Impact': '冲击',
        'Killer Seeds': '种弹重击',
        'Lashing Lariat': '藤蔓碎颈臂',
        'Neo Bombarian Special': '新式超豪华野蛮大乱击',
        'Pollen': '花粉',
        'Powerslam': '强震冲',
        'Pulp Smash': '荆棘挥打',
        'Quarry Swamp': '石化波动',
        'Revenge of the Vines': '荆棘领域',
        'Roots of Evil': '荆棘蔓延',
        'Sinister Seeds': '种弹播撒',
        'Slaminator': '野蛮冲',
        'Smash Here': '近侧挥打',
        'Smash There': '远侧挥打',
        'Special Bombarian Special': '究极超豪华野蛮大乱击',
        'Spore Sac': '孢囊',
        'Sporesplosion': '孢子云',
        'Stoneringer(?![s ])': '石制武器',
        'Stoneringer 2: Stoneringers': '双持石制武器',
        'Strange Seeds': '种弹炸裂',
        'Tendrils of Terror': '荆棘缠缚',
        'The Unpotted': '荆棘波',
        'Thorny Deathmatch': '荆棘生死战',
        'Winding Wildwinds': '环形突风',
      },
    },
  ],
};

export default triggerSet;
