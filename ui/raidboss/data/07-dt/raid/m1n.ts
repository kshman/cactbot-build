import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// MapEffect tile map:
// 00 01 02 03
// 04 05 06 07
// 08 09 0A 0B
// 0C 0D 0E 0F
// +0x10 is a duplicate used for E&E knockback display

const mapEffectTileState = {
  'cracked': '00020001',
  'clear': '00040004',
  'broken': '00200010',
  'refreshing': '00800004', // refreshing from cracked
  'rebuilding': '01000004', // rebuilding from broken
} as const;

const mapEffectTileOverlay = {
  'clear': '00040004',
  'willBreak': '00080010',
  'willCrack': '00200004',
} as const;

const mapEffectData = {
  '00': {
    'location': '00',
    'centerX': 85,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '01': {
    'location': '01',
    'centerX': 95,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '02': {
    'location': '02',
    'centerX': 105,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '03': {
    'location': '03',
    'centerX': 115,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '04': {
    'location': '04',
    'centerX': 85,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '05': {
    'location': '05',
    'centerX': 95,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '06': {
    'location': '06',
    'centerX': 105,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '07': {
    'location': '07',
    'centerX': 115,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '08': {
    'location': '08',
    'centerX': 85,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '09': {
    'location': '09',
    'centerX': 95,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0A': {
    'location': '0A',
    'centerX': 105,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0B': {
    'location': '0B',
    'centerX': 115,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0C': {
    'location': '0C',
    'centerX': 85,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '0D': {
    'location': '0D',
    'centerX': 95,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '0E': {
    'location': '0E',
    'centerX': 105,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '0F': {
    'location': '0F',
    'centerX': 115,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '10': {
    'location': '10',
    'centerX': 85,
    'centerY': 85,
    ...mapEffectTileOverlay,
  },
  '11': {
    'location': '11',
    'centerX': 95,
    'centerY': 85,
    ...mapEffectTileOverlay,
  },
  '12': {
    'location': '12',
    'centerX': 105,
    'centerY': 85,
    ...mapEffectTileOverlay,
  },
  '13': {
    'location': '13',
    'centerX': 115,
    'centerY': 85,
    ...mapEffectTileOverlay,
  },
  '14': {
    'location': '14',
    'centerX': 85,
    'centerY': 95,
    ...mapEffectTileOverlay,
  },
  '15': {
    'location': '15',
    'centerX': 95,
    'centerY': 95,
    ...mapEffectTileOverlay,
  },
  '16': {
    'location': '16',
    'centerX': 105,
    'centerY': 95,
    ...mapEffectTileOverlay,
  },
  '17': {
    'location': '17',
    'centerX': 115,
    'centerY': 95,
    ...mapEffectTileOverlay,
  },
  '18': {
    'location': '18',
    'centerX': 85,
    'centerY': 105,
    ...mapEffectTileOverlay,
  },
  '19': {
    'location': '19',
    'centerX': 95,
    'centerY': 105,
    ...mapEffectTileOverlay,
  },
  '1A': {
    'location': '1A',
    'centerX': 105,
    'centerY': 105,
    ...mapEffectTileOverlay,
  },
  '1B': {
    'location': '1B',
    'centerX': 115,
    'centerY': 105,
    ...mapEffectTileOverlay,
  },
  '1C': {
    'location': '1C',
    'centerX': 85,
    'centerY': 115,
    ...mapEffectTileOverlay,
  },
  '1D': {
    'location': '1D',
    'centerX': 95,
    'centerY': 115,
    ...mapEffectTileOverlay,
  },
  '1E': {
    'location': '1E',
    'centerX': 105,
    'centerY': 115,
    ...mapEffectTileOverlay,
  },
  '1F': {
    'location': '1F',
    'centerX': 115,
    'centerY': 115,
    ...mapEffectTileOverlay,
  },
} as const;
console.assert(mapEffectData);

const headMarkerData = {
  // Vfx Path: com_share1f
  stack: '5D',
  // Vfx Path: tank_lockon02k1
  tankBuster: 'DA',
  // Vfx Path: loc05sp_05a_se_p
  lineStack: '178',
} as const;
console.assert(headMarkerData);

export interface Data extends RaidbossData {
  actorSetPosTracker: { [id: string]: NetMatches['ActorSetPos'] };
  mouserDangerSquares: (typeof mapEffectData)[keyof typeof mapEffectData]['location'][];
}

// TODO:
// Mouser
// Predaceous Pounce
// Leaping Black Cat Crossing

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM1',
  zoneId: ZoneId.AacLightHeavyweightM1,
  timelineFile: 'm1n.txt',
  initData: () => ({
    actorSetPosTracker: {},
    mouserDangerSquares: [],
  }),
  triggers: [
    {
      id: 'M1N ActorSetPos Collector',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}', capture: true },
      run: (data, matches) => {
        data.actorSetPosTracker[matches.id] = matches;
      },
    },
    {
      id: 'M1N Mouser',
      type: 'StartsUsing',
      netRegex: { id: ['9315', '996B'], capture: true },
      condition: (data, matches) => {
        const actorSetPosLine = data.actorSetPosTracker[matches.sourceId];
        if (actorSetPosLine === undefined)
          return false;
        const x = parseFloat(actorSetPosLine.x);
        const y = parseFloat(actorSetPosLine.y);
        /*
        Exmaple lines:
        ActorSetPos to middle of danger square
        271|2024-07-16T21:52:30.1570000-04:00|40011591|-0.0001|00|00|85.0000|115.0000|0.0000|568c67125874f71f
        StartsUsing, 9315 = first hit, 996B = second hit
        20|2024-07-16T21:52:30.2340000-04:00|40011591|Black Cat|9315|unknown_9315|40011591|Black Cat|0.700|85.00|115.00|0.00|0.00|64ce76ea56417e29
        Rest of lines not relevant for trigger, but show cast target is north middle edge of square, facing south
        263|2024-07-16T21:52:30.2340000-04:00|40011591|9315|84.994|109.989|0.000|0.000|dc062eb396f50364
        21|2024-07-16T21:52:31.2130000-04:00|40011591|Black Cat|9315|unknown_9315|40011591|Black Cat|1B|93158000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|44|44|0|10000|||85.00|115.00|0.00|0.00|44|44|0|10000|||85.00|115.00|0.00|0.00|00008530|0|1|00||01|9315|9315|0.200|7FFF|9ed19cd6e527be66
        264|2024-07-16T21:52:31.2130000-04:00|40011591|9315|00008530|0|||||9177fd99528a2344
         */
        const loc = Object.values(mapEffectData)
          .find((tile) =>
            tile.location.startsWith('0') && Math.abs(tile.centerX - x) < 1 &&
            Math.abs(tile.centerY - y) < 1
          );
        if (loc === undefined)
          return false;

        data.mouserDangerSquares.push(loc.location);
        // If we have one or three matches for sw/se inner squares, and this was one of those squares
        // give the player a callout
        const swseEntries = data.mouserDangerSquares
          .filter((square) => ['09', '0A'].includes(square)).length;
        if ((swseEntries === 1 || swseEntries === 3) && ['09', '0A'].includes(loc.location))
          return true;

        return false;
      },
      durationSeconds: (data) => {
        const swseEntries = data.mouserDangerSquares
          .filter((square) => ['09', '0A'].includes(square)).length;
        if (swseEntries === 1)
          return 9;
        return 11;
      },
      infoText: (data, _matches, output) => {
        const entries = data.mouserDangerSquares.filter((square) => ['09', '0A'].includes(square));
        const dirs = entries.map((e) => e === '09' ? 'dirSE' : 'dirSW')
          .map((e) => output[e]!());

        return output.combo!({ dirs: dirs.join(output.separator!()) });
      },
      outputStrings: {
        ...Directions.outputStrings8Dir,
        separator: {
          en: ' => ',
          de: ' => ',
          ja: ' => ',
          cn: ' => ',
          ko: ' 🔜 ',
        },
        combo: {
          en: '${dirs}',
          de: '${dirs}',
          ja: '${dirs}',
          cn: '${dirs}',
          ko: '${dirs}',
        },
      },
    },
    {
      id: 'M1N Mouser Cleanup',
      type: 'StartsUsing',
      netRegex: { id: ['9315', '996B'], capture: false },
      delaySeconds: 15,
      suppressSeconds: 15,
      run: (data) => data.mouserDangerSquares = [],
    },
    {
      id: 'M1N One-two Paw Right Left',
      type: 'StartsUsing',
      netRegex: { id: '9309', source: 'Black Cat', capture: false },
      durationSeconds: 9.5,
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'M1N One-two Paw Left Right',
      type: 'StartsUsing',
      netRegex: { id: '930C', source: 'Black Cat', capture: false },
      durationSeconds: 9.5,
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'M1N Black Cat Crossing',
      type: 'StartsUsingExtra',
      netRegex: { id: '9311', capture: true },
      suppressSeconds: 5,
      infoText: (_data, matches, output) => {
        const heading = parseFloat(matches.heading);
        const dir = Directions.hdgTo8DirNum(heading);
        if (dir % 2 === 0)
          // `dir % 2 === 0` = this is aimed at a cardinal, so intercards safe first
          return output.cardsIntercards!();
        return output.intercardsCards!();
      },
      outputStrings: {
        cardsIntercards: {
          en: 'Cards => Intercards',
          de: 'Karten => Interkardinal',
          ko: '비스듬 🔜 십자로',
        },
        intercardsCards: {
          en: 'Intercards => Cards',
          de: 'Interkardinal => Karten',
          ko: '십자 🔜 비스듬히',
        },
      },
    },
    {
      id: 'M1N Elevate and Eviscerate',
      type: 'StartsUsing',
      netRegex: { id: '9317', source: ['Black Cat', 'Copy Cat'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Aim for uncracked tile',
          de: 'Ziehle auf nich gerissene Fläche',
          ko: '안부셔진 타일로 튕겨요',
        },
      },
    },
    {
      id: 'M1N Bloody Scratch',
      type: 'StartsUsing',
      netRegex: { id: '9340', source: 'Black Cat', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'M1N Biscuit Maker',
      type: 'StartsUsing',
      netRegex: { id: '934A', source: 'Black Cat', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'M1N Clawful',
      type: 'StartsUsing',
      netRegex: { id: '933C', source: 'Black Cat', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'M1N Overshadow',
      type: 'StartsUsing',
      netRegex: { id: '9319', source: 'Black Cat', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'M1N Leaping One-two Paw West West East',
      type: 'StartsUsing',
      netRegex: { id: '931F', source: 'Black Cat', capture: false },
      durationSeconds: 10.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West => East at marker',
          de: 'Westen => Osten bei der Markierung',
          ko: '서쪽 🔜 마커의 동쪽',
        },
      },
    },
    {
      id: 'M1N Leaping One-two Paw West East West',
      type: 'StartsUsing',
      netRegex: { id: '9320', source: 'Black Cat', capture: false },
      durationSeconds: 10.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East => West at marker',
          de: 'Osten => Westen bei der Markierung',
          ko: '동쪽 🔜 마커의 서쪽',
        },
      },
    },
    {
      id: 'M1N Leaping One-two Paw East West East',
      type: 'StartsUsing',
      netRegex: { id: '9321', source: 'Black Cat', capture: false },
      durationSeconds: 10.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West => East at marker',
          de: 'Westen => Osten bei der Markierung',
          ko: '서쪽 🔜 마커의 동쪽',
        },
      },
    },
    {
      id: 'M1N Leaping One-two Paw East East West',
      type: 'StartsUsing',
      netRegex: { id: '9322', source: 'Black Cat', capture: false },
      durationSeconds: 10.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East => West at marker',
          de: 'Osten => Westen bei der Markierung',
          ko: '동쪽 🔜 마커의 서쪽',
        },
      },
    },
    {
      id: 'M1N Shockwave 931D',
      type: 'StartsUsing',
      netRegex: { id: '931D', source: 'Black Cat', capture: false },
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Black Cat': 'Schwarze Katze',
        'Copy Cat': 'felin(?:e|er|es|en) Nachahmung',
      },
      'replaceText': {
        '(?<! )Black Cat Crossing': 'Kreuzklaue',
        '(?<! )One-two Paw': 'Doppelklaue',
        'Biscuit Maker': 'Milchtritt',
        'Bloody Scratch': 'Blutiger Rundumkratzer',
        'Clawful': 'Volle Kralle',
        'Copycat': 'Feline Nachahmung',
        'Elevate and Eviscerate': 'Präziser Höhenflug',
        'Grimalkin Gale': 'Katerstrophaler Wind',
        'Impact': 'Impakt',
        'Leaping Black Cat Crossing': 'Kreuzklauensprung',
        'Leaping One-two Paw': 'Doppelklauensprung',
        'Mouser': 'Mäusejagd',
        'Overshadow': 'Überschattung',
        'Predaceous Pounce': 'Feliner Beutezug',
        'Shockwave': 'Schockwelle',
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(hits\\)': '(Treffer)',
        '\\(jump\\)': '(Sprung)',
        '\\(telegraphs\\)': '(angezeigt)',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Black Cat': 'Black Cat',
        'Copy Cat': 'double félin',
      },
      'replaceText': {
        '(?<! )Black Cat Crossing': 'Griffade croisée',
        '(?<! )One-two Paw': 'Griffade un-deux',
        'Biscuit Maker': 'Coup de tatane',
        'Bloody Scratch': 'Griffure sanglante',
        'Clawful': 'Lacération lourde',
        'Copycat': 'Double félin',
        'Elevate and Eviscerate': 'Élévation éviscérante',
        'Grimalkin Gale': 'Rafale féline',
        'Impact': 'Impact',
        'Leaping Black Cat Crossing': 'Griffade croisée bondissante',
        'Leaping One-two Paw': 'Griffade un-deux bondissante',
        'Mouser': 'Carnage dératiseur',
        'Overshadow': 'Ombragement',
        'Predaceous Pounce': 'Prédation preste',
        'Shockwave': 'Onde de choc',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Black Cat': 'ブラックキャット',
        'Copy Cat': 'コピーキャット',
      },
      'replaceText': {
        '(?<! )Black Cat Crossing': 'クロスネイル',
        '(?<! )One-two Paw': 'デュアルネイル',
        'Biscuit Maker': 'ビスケットメーカー',
        'Bloody Scratch': 'ブラッディースクラッチ',
        'Clawful': 'マッシブ・クロウフル',
        'Copycat': 'コピーキャット',
        'Elevate and Eviscerate': 'エレベート・エビセレート',
        'Grimalkin Gale': 'キャッタクリスム・ゲイル',
        'Impact': '衝撃',
        'Leaping Black Cat Crossing': 'リーピング・クロスネイル',
        'Leaping One-two Paw': 'リーピング・デュアルネイル',
        'Mouser': 'マウサーラッシュ',
        'Overshadow': 'オーバーシャドウ',
        'Predaceous Pounce': 'キャッツレイド',
        'Shockwave': '衝撃波',
      },
    },
  ],
};

export default triggerSet;
