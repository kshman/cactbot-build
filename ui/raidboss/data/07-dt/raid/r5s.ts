import { AutumnDir } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutputCardinal } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

type News = 'north' | 'east' | 'south' | 'west' | 'unknown';

const snapTwistIds: { [id: string]: [number, News] } = {
  'A728': [2, 'west'],
  'A729': [2, 'west'],
  'A72A': [2, 'west'],
  'A4DB': [2, 'west'],
  'A72B': [2, 'east'],
  'A72C': [2, 'east'],
  'A72D': [2, 'east'],
  'A4DC': [2, 'east'],
  'A730': [3, 'west'],
  'A731': [3, 'west'],
  'A732': [3, 'west'],
  'A4DE': [3, 'west'],
  'A733': [3, 'east'],
  'A734': [3, 'east'],
  'A735': [3, 'east'],
  'A4DD': [3, 'east'],
  'A739': [4, 'west'],
  'A73A': [4, 'west'],
  'A73B': [4, 'west'],
  'A4DF': [4, 'west'],
  'A73C': [4, 'east'],
  'A73D': [4, 'east'],
  'A73E': [4, 'east'],
  'A4E0': [4, 'east'],
};
const frogIds: { [id: string]: News } = {
  'A70A': 'north',
  'A70B': 'south',
  'A70C': 'west',
  'A70D': 'east',
};
const dthIds: { [id: string]: 'left' | 'right' } = {
  'A775': 'right',
  'A776': 'left',
  'A724': 'right',
  'A725': 'left',
};
const dancedIds = [
  '9BE2',
  '9BE3',
  'A36C',
  'A36D',
  'A36E',
  'A36F',
] as const;

const getHustleDir = (matches: NetMatches['StartsUsing']): DirectionOutputCardinal[] => {
  const left = dthIds[matches.id] === 'left';
  const headingAdjust = left ? -(Math.PI / 8) : (Math.PI / 8);
  let snappedHeading = (parseFloat(matches.heading) + headingAdjust) % Math.PI;
  if (snappedHeading < -Math.PI)
    snappedHeading = Math.PI - snappedHeading;
  snappedHeading %= Math.PI;
  const snapped = AutumnDir.hdgNum4(snappedHeading);
  const other = ((snapped + 4) + (left ? 1 : -1)) % 4;
  return [
    AutumnDir.outputDirPlus[snapped] ?? 'unknown',
    AutumnDir.outputDirPlus[other] ?? 'unknown',
  ];
};

export interface Data extends RaidbossData {
  deepcs: string[];
  side?: 'role' | 'light';
  infernal: number;
  frogs: News[];
  waves: { alpha: number; beta: number };
  order?: number;
  hustles: NetMatches['StartsUsing'][];
  hustlecnt: number;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM1Savage',
  zoneId: ZoneId.AacCruiserweightM1Savage,
  timelineFile: 'r5s.txt',
  initData: () => ({
    deepcs: [],
    infernal: 0,
    frogs: [],
    waves: { alpha: 0, beta: 0 },
    hustles: [],
    hustlecnt: 0,
  }),
  triggers: [
    {
      id: 'R5S Deep Cut',
      type: 'HeadMarker',
      netRegex: { id: '01D7' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleaveOnYou: Outputs.tankCleaveOnYou,
          avoidCleave: Outputs.avoidTankCleave,
        };
        data.deepcs.push(matches.target);
        if (data.deepcs.length < 2)
          return;
        if (data.deepcs.includes(data.me))
          return { alertText: output.cleaveOnYou!() };
        return { infoText: output.avoidCleave!() };
      },
      run: (data) => {
        if (data.deepcs.length >= 2)
          data.deepcs = [];
      },
    },
    {
      id: 'R5S Flip to Side',
      type: 'StartsUsing',
      netRegex: { id: ['A780', 'A781'], source: 'Dancing Green' },
      run: (data, matches) => data.side = matches.id === 'A780' ? 'role' : 'light',
    },
    {
      id: 'R5S Snap Twist',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(snapTwistIds), source: 'Dancing Green' },
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        const st = snapTwistIds[matches.id];
        if (st === undefined)
          return;
        const cnt = st[0];
        const dir = output[st[1]]!();
        const mech = output[data.side ?? 'unknown']!();
        return output.text!({ dir: dir, cnt: cnt, mech: mech });
      },
      run: (data) => delete data.side,
      outputStrings: {
        text: {
          en: '${dir} (${cnt} hits) => ${mech}',
          ja: '${dir}x${cnt} 🔜 ${mech}',
          ko: '${dir}x${cnt} 🔜 ${mech}',
        },
        east: Outputs.east,
        west: Outputs.west,
        role: Outputs.rolePositions,
        light: Outputs.healerGroups,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Celebrate Good Times',
      type: 'StartsUsing',
      netRegex: { id: 'A723', source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'R5S Disco Infernal',
      type: 'StartsUsing',
      netRegex: { id: 'A756', source: 'Dancing Green', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
      run: (data) => data.infernal++,
    },
    {
      id: 'R5S Burn Baby Burn 1',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 1 && data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      countdownSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to spotlight',
          ja: 'スポットライトへ',
          ko: '조명 밟아요',
        },
      },
    },
    {
      id: 'R5S Burn Baby Burn 2-1',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 2 && data.me === matches.target,
      durationSeconds: 9,
      countdownSeconds: 9,
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) < 14)
          return output.spot!();
        return output.bait!();
      },
      outputStrings: {
        spot: {
          en: 'Go to spotlight',
          ja: 'スポットライトへ',
          ko: '조명 밟아요',
        },
        bait: {
          en: 'Bait Frog',
          ja: 'カエルの扇誘導',
          ko: '개굴 부채 유도',
        },
        card: Outputs.cardinals,
        inter: Outputs.intercards,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Burn Baby Burn 2-2',
      type: 'GainsEffect',
      netRegex: { effectId: '116D' },
      condition: (data, matches) => data.infernal === 2 && data.me === matches.target,
      delaySeconds: 11,
      durationSeconds: 8,
      countdownSeconds: 8,
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) < 14)
          return output.bait!();
        return output.spot!();
      },
      outputStrings: {
        spot: {
          en: 'Go to spotlight',
          ja: 'スポットライトへ',
          ko: '조명 밟아요',
        },
        bait: {
          en: 'Bait Frog',
          ja: 'カエルの扇誘導',
          ko: '개굴 부채 유도',
        },
      },
    },
    {
      id: 'R5S Inside Out',
      type: 'StartsUsing',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      durationSeconds: 4.9,
      countdownSeconds: 4.9,
      response: Responses.getOutThenIn(),
    },
    {
      id: 'R5S Inside Get Out',
      type: 'Ability',
      netRegex: { id: 'A77C', source: 'Dancing Green', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'R5S Outside In',
      type: 'StartsUsing',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      durationSeconds: 4.9,
      countdownSeconds: 4.9,
      response: Responses.getInThenOut(),
    },
    {
      id: 'R5S Outside Get In',
      type: 'Ability',
      netRegex: { id: 'A77E', source: 'Dancing Green', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'R5S Arcady Night Fever', // +Arcady Night Encore
      type: 'StartsUsing',
      netRegex: { id: ['A760', 'A370'], source: 'Dancing Green', capture: false },
      run: (data) => {
        data.frogs = [];
        delete data.order;
      },
    },
    {
      id: 'R5S Wavelength Merge Order',
      type: 'GainsEffect',
      netRegex: { effectId: ['116E', '116F'] },
      run: (data, matches) => {
        matches.effectId === '116E' ? data.waves.alpha++ : data.waves.beta++;
        if (data.me !== matches.target)
          return;
        if (matches.effectId === '116E') {
          const alphas: { [num: number]: number } = { 1: 3, 2: 1, 3: 2, 4: 4 } as const;
          data.order = alphas[data.waves.alpha];
        } else {
          const betas: { [num: number]: number } = { 1: 4, 2: 2, 3: 1, 4: 3 } as const;
          data.order = betas[data.waves.beta];
        }
      },
    },
    {
      id: 'R5S Frog Dance Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(frogIds), source: 'Frogtourage' },
      run: (data, matches) => data.frogs.push(frogIds[matches.id] ?? 'unknown'),
    },
    {
      id: 'R5S Let\'s Dance!', // +Let's Dance Remix
      type: 'StartsUsing',
      netRegex: { id: ['A76A', 'A390'], source: 'Dancing Green', capture: false },
      delaySeconds: 2,
      durationSeconds: 4,
      infoText: (data, _matches, output) => {
        const curr = data.frogs[0];
        if (curr === undefined) // 이게 없을리가 있나
          return output.unknown!();
        if (data.order !== undefined)
          return output.combo!({ dir: output[curr]!(), order: data.order });
        return output.text!({ dir: output[curr]!() });
      },
      outputStrings: {
        text: {
          en: '${dir}',
          ja: '${dir}へ',
          ko: '${dir}으로',
        },
        combo: {
          en: '${dir} (${order})',
          ja: '${dir} (${order}番目)',
          ko: '${dir}으로 (${order}번째)',
        },
        east: Outputs.east,
        west: Outputs.west,
        north: Outputs.north,
        south: Outputs.south,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R5S Frog Dance',
      type: 'Ability',
      netRegex: { id: dancedIds, capture: false },
      durationSeconds: 2,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: '${dir}',
            ja: '${dir}へ',
            ko: '${dir}으로',
          },
          stay: {
            en: '(Stay)',
            ja: '(そのまま)',
            ko: '(그대로)',
          },
          east: Outputs.east,
          west: Outputs.west,
          north: Outputs.north,
          south: Outputs.south,
        };
        const prev = data.frogs.shift();
        const curr = data.frogs[0];
        if (curr === undefined)
          return;
        if (prev === curr)
          return { infoText: output.stay!() };
        return { alertText: output.text!({ dir: output[curr]!() }) };
      },
    },
    {
      id: 'R5S Beats',
      type: 'StartsUsing',
      netRegex: { id: ['A75B', 'A75D'], source: 'Dancing Green' },
      infoText: (_data, matches, output) => matches.id === 'A75B' ? output.b4!() : output.b8!(),
      outputStrings: {
        b4: Outputs.stackPartner,
        b8: Outputs.protean,
      },
    },
    {
      id: 'R5S Do the Hustle',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(dthIds) },
      preRun: (data, matches) => data.hustles.push(matches),
      infoText: (data, _matches, output) => {
        // Order is double cleave, double cleave, single cleave, triple cleave
        const expected = [2, 2, 1, 3] as const;
        if (data.hustles.length < (expected[data.hustlecnt] ?? 0))
          return;

        const cleaves = data.hustles;
        const count = data.hustlecnt;
        data.hustles = [];
        data.hustlecnt++;

        // Double cleaves from clones
        if (count === 0 || count === 1) {
          const [cleave1, cleave2] = cleaves;
          if (cleave1 === undefined || cleave2 === undefined)
            return;
          const safe1 = getHustleDir(cleave1);
          const safe2 = getHustleDir(cleave2);
          for (const dir of safe1) {
            if (safe2.includes(dir))
              return output[dir]!();
          }
          return output['unknown']!();
        }

        // Single boss cleave
        if (count === 2) {
          const [cleave1] = cleaves;
          if (cleave1 === undefined)
            return;
          return dthIds[cleave1.id] === 'left' ? output['dirE']!() : output['dirW']!();
        }

        // Double cleaves from clones plus boss cleave
        if (count === 3) {
          const cleave3 = cleaves.find((cleave) => ['A724', 'A725'].includes(cleave.id));
          const [cleave1, cleave2] = cleaves.filter((c) => c !== cleave3);
          if (cleave1 === undefined || cleave2 === undefined || cleave3 === undefined)
            return;
          const safe1 = getHustleDir(cleave1);
          const safe2 = getHustleDir(cleave2);
          let safe: DirectionOutputCardinal = 'unknown';
          for (const dir of safe1) {
            if (safe2.includes(dir))
              safe = dir;
          }
          return output[safe]!();
        }
        return output['unknown']!();
      },
      outputStrings: AutumnDir.stringsAimPlus,
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        '2-snap Twist & Drop the Needle/3-snap Twist & Drop the Needle/4-snap Twist & Drop the Needle':
          '2/3/4-snap Twist',
        'Flip to A-side/Flip to B-side': 'Flip to A/B-side',
        'Play A-side/Play B-side': 'Play A/B-side',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Dancing Green': 'Springhis Khan',
        'Frogtourage': 'Schenkelschwinger',
      },
      'replaceText': {
        '\\(Cleave\\)': '(Cleave)',
        '\\(Echo\\)': '(Echo)',
        '\\(In\\+Protean\\+Echo\\)': '(Rein+Himmelsrichtungen+Echo)',
        '\\(Out\\+Protean\\+Echo\\)': '(Raus+Himmelsrichtungen+Echo)',
        '\\(Out\\+Protean\\)': '(Raus+Himmelsrichtungen)',
        '\\(all\\)': '(Alle)',
        '\\(boss\\)': '(Boss)',
        '\\(dancers\\)': '(Tänzer)',
        '\\(enrage\\)': '(Finalangriff)',
        '2-snap Twist & Drop the Needle/3-snap Twist & Drop the Needle/4-snap Twist & Drop the Needle':
          '2/3/4-fachzeig, Pose, Musik ab!',
        'Arcady Night Encore': 'Tanzfieber-Zugabe',
        'Arcady Night Encore Starts': 'Tanzfieber-Zugabe startet',
        'Arcady Night Fever': 'Arkadion-Tanzfieber',
        'Back-up Dance': 'Wilde Welle',
        'Celebrate Good Times': 'Völlig losgelöst',
        'Deep Cut': 'Tiefschnitt',
        'Disco Infernal': 'Disco Pogo',
        'Do the Hustle': 'Schüttel deinen Speck',
        '(?<!& )Drop the Needle': 'Musik ab!',
        'Eighth Beats': 'Achteltakt',
        'Ensemble Assemble': 'Gruppen-Groove',
        'Fire': '',
        'Flip to A-side': 'A-Seite auflegen',
        'Flip to B-side': 'B-Seite auflegen',
        'Freak Out': 'Schallexplosion',
        'Frogtourage Finale': 'Finaler Groove',
        'Frogtourage(?! )': 'Schenkelschwinger',
        'Funky Floor': 'Tanzflächen-Tango',
        'Get Down!': 'Hoch die Hände!',
        'Hi-NRG Fever': 'Totales Tanzfieber',
        'Inside Out': 'Innerer Rhythmus',
        'Let\'s Dance!(?! )': 'Fühl\' dich Disco!',
        'Let\'s Dance! Remix': 'Fühl\' dich Disco, Disco, Disco!',
        'Let\'s Pose!': 'Perfekte Pose',
        'Moonburn': 'Mondglühen',
        'Outside In': 'Äußerer Rhythmus',
        'Play A-side': 'Spiele A-Seite',
        'Play B-side': 'Spiele B-Seite',
        'Quarter Beats': 'Vierteltakt',
        'Ride the Waves': 'Perfekte Welle',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Dancing Green': 'Dancing Green',
        'Frogtourage': 'Danceur batracien',
      },
      'replaceText': {
        '\\(Cleave\\)': '(Cleave)',
        '\\(Echo\\)': '(Echo)',
        '\\(In\\+Protean\\+Echo\\)': '(Intérieur + Position + Echo)',
        '\\(Out\\+Protean\\+Echo\\)': '(Extérieur + Position + Echo)',
        '\\(Out\\+Protean\\)': '(Extérieur + Positions)',
        '\\(all\\)': '(Tous)',
        '\\(boss\\)': '(Boss)',
        '\\(dancers\\)': '(Danceurs)',
        '\\(enrage\\)': '(Enrage)',
        '2-snap Twist & Drop the Needle': 'Doublé pointé, pose & NUIT DE FOLIE !',
        '3-snap Twist & Drop the Needle': 'Triple pointé, pose & NUIT DE FOLIE !',
        '4-snap Twist & Drop the Needle': 'Quadruple pointé, pose & NUIT DE FOLIE !',
        'Arcady Night Encore': 'Fièvre de l\'Arcadion : rappel',
        'Arcady Night Fever': 'Fièvre de l\'Arcadion',
        'Back-up Dance': 'Vague dansante',
        'Celebrate Good Times': 'Lève les bras, balance-toi !',
        'Debuffs': 'Debuffs',
        'Deep Cut': 'Entaille profonde',
        'Disco Infernal': 'Enfer du disco',
        'Do the Hustle': 'Danse le Mia !',
        '(?<!& )Drop the Needle': 'NUIT DE FOLIE !',
        'Eighth Beats': 'Tempo octuple',
        'Ensemble Assemble': 'Rassemblement des danseurs',
        'Fire': '',
        'Flip to A-side': 'Programmation : face A',
        'Flip to B-side': 'Programmation : face B',
        'Freak Out': 'Déflagration acoustique',
        'Frogtourage Finale': 'Rassemblement final',
        'Frogtourage(?! )': 'danceur batracien',
        'Funky Floor': 'Terrain de danse',
        'Get Down!': 'Bouge de là !',
        'Hi-NRG Fever': 'Fièvre de la nuit survoltée',
        'Inside Out': 'Pas extérieur',
        'Let\'s Dance!(?! )': 'Alors on danse !',
        'Let\'s Dance! Remix': 'Alors on danse, danse, danse !',
        'Let\'s Pose!': 'Prends la pose !',
        'Moonburn': 'Flambée lunaire',
        'Outside In': 'Pas intérieur',
        'Play A-side': 'Jingle fracassant A',
        'Play B-side': 'Jingle fracassant B',
        'Quarter Beats': 'Tempo quadruple',
        'Ride the Waves': 'Roulement de vagues',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Dancing Green': 'ダンシング・グリーン',
        'Frogtourage': 'フロッグダンサー',
      },
      'replaceText': {
        '2-snap Twist & Drop the Needle': '2ポイント、ポーズ＆ジングル',
        '3-snap Twist & Drop the Needle': '3ポイント、ポーズ＆ジングル',
        '4-snap Twist & Drop the Needle': '4ポイント、ポーズ＆ジングル',
        'Arcady Night Encore': 'ナイトフィーバー・アンコール',
        'Arcady Night Encore Starts': 'ナイトフィーバー・アンコール',
        'Arcady Night Fever': 'アルカディア・ナイトフィーバー',
        'Back-up Dance': 'ダンシングウェーブ',
        'Celebrate Good Times': 'セレブレート・グッドタイムズ',
        'Deep Cut': 'ディープカット',
        'Disco Infernal': 'ディスコインファーナル',
        'Do the Hustle': 'ドゥ・ザ・ハッスル',
        'Eighth Beats': '8ビート',
        'Ensemble Assemble': 'ダンサーズ・アッセンブル',
        'Flip to A-side': 'ジングル予約A',
        'Flip to B-side': 'ジングル予約B',
        'Freak Out': '音響爆発',
        'Frogtourage Finale': 'ファイナル・アッセンブル',
        'Frogtourage(?! )': 'フロッグダンサー',
        'Funky Floor': 'ダンシングフィールド',
        'Get Down!': 'ゲットダウン！',
        'Hi-NRG Fever': 'ハイエナジー・ナイトフィーバー',
        'Inside Out': 'インサイドアウト',
        'Let\'s Dance!(?! )': 'レッツダンス！',
        'Let\'s Dance! Remix': 'レッツダンス・ダンス・ダンス！',
        'Let\'s Pose!': 'レッツポーズ！',
        'Moonburn': 'ムーンバーン',
        'Outside In': 'アウトサイドイン',
        'Play A-side': 'ラウドジングルA',
        'Play B-side': 'ラウドジングルB',
        'Quarter Beats': '4ビート',
        'Ride the Waves': 'ウェーブ・オン・ウェーブ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Dancing Green': '热舞绿光',
        'Frogtourage': '青蛙舞者',
      },
      'replaceText': {
        '\\(Cleave\\)': '(半场)',
        '\\(Echo\\)': '(重复)',
        '\\(In\\+Protean\\+Echo\\)': '(内+八方+重复)',
        '\\(Out\\+Protean\\+Echo\\)': '(外+八方+重复)',
        '\\(Out\\+Protean\\)': '(外+八方)',
        '\\(all\\)': '(全体)',
        '\\(boss\\)': '(BOSS)',
        '\\(dancers\\)': '(分身)',
        '\\(enrage\\)': '(狂暴)',
        '2-snap Twist & Drop the Needle/3-snap Twist & Drop the Needle/4-snap Twist & Drop the Needle':
          '二/三/四连指向、定格＆播放',
        'Arcady Night Encore': '返场夜狂热',
        'Arcady Night Fever': '登天夜狂热',
        'Back-up Dance': '伴舞波动',
        'Celebrate Good Times': '欢庆时刻',
        'Deep Cut': '经典铭心',
        'Debuffs': '毒',
        'Disco Infernal': '激热跳舞街',
        'Do the Hustle': '摇摆哈娑',
        '(?<!& )Drop the Needle': '播放',
        'Eighth Beats': '8拍节奏',
        'Ensemble Assemble': '伴舞团',
        'Fire': '',
        'Flip to A-side': '放入A面',
        'Flip to B-side': '放入B面',
        'Freak Out': '音频爆炸',
        'Frogtourage Finale': '舞团终演',
        'Frogtourage(?! )': '来吧！青蛙舞者！',
        'Funky Floor': '热舞场地',
        'Get Down!': '尽情舞蹈！',
        'Hi-NRG Fever': '高能夜狂热',
        'Inside Out': '内翻外转',
        'Let\'s Dance!(?! )': '放纵劲舞！',
        'Let\'s Dance! Remix': '彻夜狂欢，放纵劲舞！',
        'Let\'s Pose!': '在这停顿！',
        'Moonburn': '太空热步',
        'Outside In': '外翻内转',
        'Play A-side': '播放A面',
        'Play B-side': '播放B面',
        'Quarter Beats': '4拍节奏',
        'Ride the Waves': '舞浪全开',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Dancing Green': '댄싱 그린',
        'Frogtourage': '개구리 댄서',
      },
      'replaceText': {
        '\\(Cleave\\)': '(장판)',
        '\\(Echo\\)': '(반복)',
        '\\(In\\+Protean\\+Echo\\)': '(안+8방향+반복)',
        '\\(Out\\+Protean\\+Echo\\)': '(밖+8방향+반복)',
        '\\(Out\\+Protean\\)': '(밖+8방향)',
        '\\(all\\)': '(모두)',
        '\\(boss\\)': '(보스)',
        '\\(dancers\\)': '(분신)',
        '\\(enrage\\)': '(전멸기)',
        '2-snap Twist & Drop the Needle/3-snap Twist & Drop the Needle/4-snap Twist & Drop the Needle':
          '두/세/네 번 흔들고 포즈 후 신청곡',
        'Arcady Night Encore': '밤의 열기 앙코르',
        'Arcady Night Fever': '아르카디아의 밤의 열기',
        'Back-up Dance': '백업 댄스',
        'Celebrate Good Times': '이 순간을 즐기자',
        'Deep Cut': '숨은 명곡',
        'Debuffs': '디버프',
        'Disco Infernal': '디스코 지옥',
        'Do the Hustle': '신나게 춤추자',
        '(?<!& )Drop the Needle': '신청곡',
        'Eighth Beats': '8비트',
        'Ensemble Assemble': '댄서 집합',
        'Fire': '파이어',
        'Flip to A-side': '신청곡 A 예약',
        'Flip to B-side': '신청곡 B 예약',
        'Freak Out': '음향 폭발',
        'Frogtourage Finale': '최종 집합',
        'Frogtourage(?! )': '컴 온! 개구리 댄서',
        'Funky Floor': '댄싱 필드',
        'Get Down!': '겟 다운!',
        'Hi-NRG Fever': '광적인 밤의 열기',
        'Inside Out': '안에서 밖으로',
        'Let\'s Dance!(?! Remix)': '레츠 댄스!',
        'Let\'s Dance! Remix': '레츠 댄스, 댄스, 댄스!',
        'Let\'s Pose!': '레츠 포즈!',
        'Moonburn': '달볕 걸음',
        'Outside In': '밖에서 안으로',
        'Play A-side': '신청곡 A',
        'Play B-side': '신청곡 B',
        'Quarter Beats': '4비트',
        'Ride the Waves': '박자 타기',
      },
    },
  ],
};

export default triggerSet;
