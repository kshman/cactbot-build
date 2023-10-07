import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  decOffset?: number;
  miasmicBlasts: PluginCombatantState[];
}

const headmarkerMap = {
  'tankbuster': '016C',
  'blackHole': '014A',
  'spread': '0017',
  'enums': '00D3',
  'stack': '003E',
} as const;

const firstHeadmarker = parseInt(headmarkerMap.tankbuster, 16);
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const centerX = 100;
const centerY = 100;

const triggerSet: TriggerSet<Data> = {
  id: 'TheAbyssalFractureExtreme',
  zoneId: ZoneId.TheAbyssalFractureExtreme,
  timelineFile: 'zeromus-ex.txt',
  initData: () => {
    return {
      miasmicBlasts: [],
    };
  },
  triggers: [
    {
      id: 'ZeromusEx Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => getHeadmarkerId(data, matches),
    },
    {
      id: 'ZeromusEx Visceral Whirl NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B43', capture: false },
      infoText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.atext!();
        return output.text!({ dir1: output.ne!(), dir2: output.sw!() });
      },
      outputStrings: {
        text: {
          en: '${dir1}/${dir2}',
          de: '${dir1}/${dir2}',
        },
        ne: Outputs.northeast,
        sw: Outputs.southwest,
        atext: {
          en: '안전: 🡿🡽',
        },
      },
    },
    {
      id: 'ZeromusEx Visceral Whirl NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B46', capture: false },
      infoText: (data, _matches, output) => {
        if (data.options.AutumnStyle)
          return output.atext!();
        return output.text!({ dir1: output.nw!(), dir2: output.se!() });
      },
      outputStrings: {
        text: {
          en: '${dir1}/${dir2}',
          de: '${dir1}/${dir2}',
        },
        nw: Outputs.northwest,
        se: Outputs.southeast,
        atext: {
          en: '안전: 🡼🡾',
        },
      },
    },
    {
      id: 'ZeromusEx Fractured Eventide NE Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B3C', capture: false },
      alertText: (data, _matches, output) =>
        data.options.AutumnStyle ? output.ane!() : output.ne!(),
      outputStrings: {
        ne: Outputs.northeast,
        ane: {
          en: '안전: 🡽',
        },
      },
    },
    {
      id: 'ZeromusEx Fractured Eventide NW Safe',
      type: 'StartsUsing',
      netRegex: { id: '8B3D', capture: false },
      alertText: (data, _matches, output) =>
        data.options.AutumnStyle ? output.anw!() : output.nw!(),
      outputStrings: {
        nw: Outputs.northwest,
        anw: {
          en: '안전: 🡼',
        },
      },
    },
    {
      id: 'ZeromusEx Black Hole Headmarker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.role === 'tank',
      suppressSeconds: 20,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkerMap.blackHole)
          return output.blackHole!();
      },
      outputStrings: {
        blackHole: {
          en: '내게 블랙홀! 모서리로!',
          de: 'Schwarzes Loch auf DIR',
        },
      },
    },
    {
      id: 'ZeromusEx Spread Headmarker',
      type: 'HeadMarker',
      netRegex: { capture: true },
      condition: (data, matches) =>
        data.decOffset !== undefined && getHeadmarkerId(data, matches) === headmarkerMap.spread,
      suppressSeconds: 2,
      response: Responses.spread(),
    },
    {
      id: 'ZeromusEx Enum Headmarker',
      type: 'HeadMarker',
      netRegex: { capture: true },
      condition: (data, matches) =>
        data.decOffset !== undefined && getHeadmarkerId(data, matches) === headmarkerMap.enums,
      suppressSeconds: 2,
      infoText: (_data, _matches, output) => output.enumeration!(),
      outputStrings: {
        enumeration: {
          en: '페어! 둘이 뭉쳐요',
          de: 'Enumeration',
          fr: 'Énumération',
          ja: 'エアーバンプ',
          cn: '蓝圈分摊',
          ko: '2인 장판',
        },
      },
    },
    {
      id: 'ZeromusEx Stack Headmarker',
      type: 'HeadMarker',
      netRegex: { capture: true },
      condition: (data, matches) =>
        data.decOffset !== undefined && getHeadmarkerId(data, matches) === headmarkerMap.stack,
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'ZeromusEx Miasmic Blasts Reset',
      type: 'StartsUsing',
      // reset Blasts combatant data when the preceding Visceral Whirl is used
      netRegex: { id: '8B4[36]', source: 'Zeromus', capture: false },
      run: (data) => data.miasmicBlasts = [],
    },
    {
      id: 'ZeromusEx Miasmic Blast Safe Spots',
      type: 'StartsUsing',
      netRegex: { id: '8B49', capture: true },
      condition: (data) => !data.options.AutumnStyle,
      delaySeconds: 0.5,
      promise: async (data, matches) => {
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;

        if (combatants.length !== 1)
          return;

        const combatant = combatants[0];
        if (combatant === undefined)
          return;

        data.miasmicBlasts.push(combatant);
      },
      alertText: (data, _matches, output) => {
        if (data.miasmicBlasts.length !== 3) {
          return;
        }
        // Blasts can spawn center, on cardinals (+/-14 from center), or on intercards (+/-7 from center).
        // Unsafe spots vary for each of the 9 possible spawn points, but are always the same *relative* to that type.
        // So apply a fixed set of modifiers based on type, regardless of spawn point, to eliminate unsafe spots.
        const cardinal16Dirs = [0, 4, 8, 12];
        const intercard16Dirs = [2, 6, 10, 14];
        const unsafe16DirModifiers = {
          cardinal: [-1, 0, 1, 4, 5, 11, 12],
          intercard: [-2, 0, 2, 3, 8, 13],
        };

        let possibleSafeSpots = Directions.output16Dir;

        for (const blast of data.miasmicBlasts) {
          // special case for center - don't need to find relative dirs, just remove all intercards
          if (Math.round(blast.PosX) === 100 && Math.round(blast.PosY) === 100)
            intercard16Dirs.forEach((intercard) =>
              possibleSafeSpots = possibleSafeSpots.filter((dir) =>
                dir !== Directions.output16Dir[intercard]
              )
            );
          else {
            const blastPos16Dir = Directions.xyTo16DirNum(blast.PosX, blast.PosY, centerX, centerY);
            const relativeUnsafeDirs = cardinal16Dirs.includes(blastPos16Dir)
              ? unsafe16DirModifiers.cardinal
              : unsafe16DirModifiers.intercard;
            for (const relativeUnsafeDir of relativeUnsafeDirs) {
              const actualUnsafeDir = (16 + blastPos16Dir + relativeUnsafeDir) % 16;
              possibleSafeSpots = possibleSafeSpots.filter((dir) =>
                dir !== Directions.output16Dir[actualUnsafeDir]
              );
            }
          }
        }

        if (possibleSafeSpots.length !== 2)
          return output.avoidUnknown!();

        const [safeDir1, safeDir2] = possibleSafeSpots;
        if (safeDir1 === undefined || safeDir2 === undefined)
          return output.avoidUnknown!();

        return output.combo!({ dir1: output[safeDir1]!(), dir2: output[safeDir2]!() });
      },
      outputStrings: {
        combo: {
          en: '${dir1} / ${dir2}',
        },
        avoidUnknown: {
          en: 'Avoid Line Cleaves',
        },
        ...Directions.outputStrings16Dir,
      },
    },
    {
      id: 'ZeromusEx Acceleration Bomb',
      type: 'GainsEffect',
      netRegex: { effectId: 'A61' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      response: Responses.stopMoving(),
    },
    {
      id: 'ZeromusEx PR Miasmic Blast',
      type: 'StartsUsing',
      netRegex: { id: '8B49', capture: true },
      condition: (data) => data.options.AutumnStyle,
      delaySeconds: 0.5,
      promise: async (data, matches) => {
        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;

        if (combatants === undefined || combatants.length !== 1)
          return;

        const combatant = combatants[0];
        if (combatant === undefined)
          return;

        data.miasmicBlasts.push(combatant);
      },
      infoText: (data, _matches, output) => {
        if (data.miasmicBlasts.length !== 3)
          return;
        const possibleSafeSpots = [
          'WNW',
          'NW',
          'NNW',
          'NNE',
          'NE',
          'ENE',
        ] as const;
        type safeSpotType = typeof possibleSafeSpots[number];
        let safeSpots: safeSpotType[] = [
          'WNW',
          'NW',
          'NNW',
          'NNE',
          'NE',
          'ENE',
        ];
        const safeSpotMap: {
          [key in safeSpotType]: { x: number; y: number };
        } = {
          'WNW': { x: 80, y: 94 },
          'NW': { x: 80, y: 80 },
          'NNW': { x: 94, y: 80 },
          'NNE': { x: 106, y: 80 },
          'NE': { x: 120, y: 80 },
          'ENE': { x: 120, y: 94 },
        };

        for (const mi of data.miasmicBlasts) {
          const removeSpots: safeSpotType[] = [];
          for (const spot of safeSpots) {
            const angle =
              ((Math.atan2(mi.PosY - safeSpotMap[spot].y, mi.PosX - safeSpotMap[spot].x) * 180 /
                Math.PI) + 180) % 90;
            if (Math.abs(angle - 45) < Number.EPSILON) {
              removeSpots.push(spot);
            }
          }
          safeSpots = safeSpots.filter((spot) => !removeSpots.includes(spot));
        }

        if (safeSpots.length !== 1 || safeSpots[0] === undefined)
          return output.unknown!();

        const where = output[safeSpots[0]]!();
        return output.text!({ safe: where });
      },
      outputStrings: {
        text: {
          en: '안전: ${safe}',
        },
        WNW: {
          en: '③',
        },
        NW: Outputs.arrowNW,
        NNW: {
          en: 'Ⓐ',
        },
        NNE: {
          en: 'Ⓑ',
        },
        NE: Outputs.arrowNE,
        ENE: {
          en: '④',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'ZeromusEx PR Big Bang/Crunch',
      type: 'StartsUsing',
      netRegex: { id: ['8B4C', '8B4D'], capture: false },
      condition: (data) => data.options.AutumnStyle,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '장판 피하다 => 전체 공격',
        },
      },
    },
    {
      id: 'ZeromusEx PR Rend the Rift',
      type: 'StartsUsing',
      netRegex: { id: '8C0D', capture: false },
      condition: (data) => data.options.AutumnStyle,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 => 장판 피해요',
        },
      },
    },
    {
      id: 'ZeromusEx PR Big Bang Enrage',
      type: 'StartsUsing',
      netRegex: { id: '8C1E', capture: false },
      condition: (data) => data.options.AutumnStyle,
      durationSeconds: 9.7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전멸 공격!',
        },
      },
    },
    {
      id: 'ZeromusEx PR Branding Flare',
      type: 'StartsUsing',
      netRegex: { id: '8B5F' },
      condition: (data) => data.options.AutumnStyle,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '페어! 둘이 뭉쳐요!',
        },
      },
    },
    {
      id: 'ZeromusEx PR Sparking Flare',
      type: 'StartsUsing',
      netRegex: { id: '8B5E' },
      condition: (data) => data.options.AutumnStyle,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요!',
        },
      },
    },
    {
      id: 'ZeromusEx PR Forked Lightning',
      type: 'GainsEffect',
      netRegex: { effectId: 'ED7' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '내게 번개! 홀로 떨어져요',
        },
      },
    },
    // 441: HP Penalty
    // A61: Acceleration Bomb(오피샬)
    // EB2: Divisive Dark
    // ED7: Forked Lightning (이쪽)
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Branding Flare/Sparking Flare': 'Branding/Sparking Flare',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Comet': 'Komet',
        'Toxic Bubble': 'Giftblase',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        'Abyssal Echoes': 'Abyssal-Echos',
        'Abyssal Nox': 'Abyssal-Nox',
        'Akh Rhai': 'Akh Rhai',
        'Big Bang': 'Großer Knall',
        'Big Crunch': 'Großer Quetscher',
        'Black Hole': 'Schwarzes Loch',
        'Branding Flare': 'Flare-Brand',
        'Burst': 'Kosmos-Splitter',
        'Bury': 'Impakt',
        'Chasmic Nails': 'Abyssal-Nagel',
        'Dark Matter': 'Dunkelmaterie',
        'Dimensional Surge': 'Dimensionsschwall',
        'Explosion': 'Explosion',
        '(?<! )Flare': 'Flare',
        'Flow of the Abyss': 'Abyssaler Strom',
        'Forked Lightning': 'Gabelblitz',
        'Fractured Eventide': 'Abendglut',
        'Meteor Impact': 'Meteoreinschlag',
        'Miasmic Blast': 'Miasma-Detonation',
        'Nostalgia': 'Heimweh',
        'Primal Roar': 'Lautes Gebrüll',
        'Prominence Spine': 'Ossale Protuberanz',
        'Rend the Rift': 'Dimensionsstörung',
        'Sable Thread': 'Pechschwarzer Pfad',
        'Sparking Flare': 'Flare-Funken',
        'Umbral Prism': 'Umbrales Prisma',
        'Umbral Rays': 'Pfad der Dunkelheit',
        'Visceral Whirl': 'Viszerale Schürfwunden',
        'Void Bio': 'Nichts-Bio',
        'Void Meteor': 'Nichts-Meteo',
        'the Dark Beckons': 'Fressende Finsternis: Last',
        'the Dark Binds': 'Fressende Finsternis: Kette',
        'the Dark Divides': 'Fressende Finsternis: Zerschmetterung',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Comet': 'comète',
        'Toxic Bubble': 'bulle empoisonnée',
        'Zeromus': 'Zeromus',
      },
      'replaceText': {
        'Abyssal Echoes': 'Écho abyssal',
        'Abyssal Nox': 'Nox abyssal',
        'Akh Rhai': 'Akh Rhai',
        'Big Bang': 'Big bang',
        'Big Crunch': 'Big crunch',
        'Black Hole': 'Trou noir',
        'Branding Flare': 'Marque de brasier',
        'Burst': 'Éclatement',
        'Bury': 'Impact',
        'Chasmic Nails': 'Clous abyssaux',
        'Dark Matter': 'Matière sombre',
        'Dimensional Surge': 'Déferlante dimensionnelle',
        'Explosion': 'Explosion',
        '(?<! )Flare': 'Brasier',
        'Flow of the Abyss': 'Flot abyssal',
        'Forked Lightning': 'Éclair ramifié',
        'Fractured Eventide': 'Éclat crépusculaire',
        'Meteor Impact': 'Impact de météore',
        'Miasmic Blast': 'Explosion miasmatique',
        'Nostalgia': 'Nostalgie',
        'Primal Roar': 'Rugissement furieux',
        'Prominence Spine': 'Évidence ossuaire',
        'Rend the Rift': 'Déchirure dimensionnelle',
        'Sable Thread': 'Rayon sombre',
        'Sparking Flare': 'Étincelle de brasier',
        'Umbral Prism': 'Déluge de Ténèbres',
        'Umbral Rays': 'Voie de ténèbres',
        'Visceral Whirl': 'Écorchure viscérale',
        'Void Bio': 'Bactéries du néant',
        'Void Meteor': 'Météores du néant',
        'the Dark Beckons': 'Ténèbres rongeuses : Gravité',
        'the Dark Binds': 'Ténèbres rongeuses : Chaînes',
        'the Dark Divides': 'Ténèbres rongeuses : Pulvérisation',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Comet': 'コメット',
        'Toxic Bubble': 'ポイズナスバブル',
        'Zeromus': 'ゼロムス',
      },
      'replaceText': {
        'Abyssal Echoes': 'アビサルエコー',
        'Abyssal Nox': 'アビサルノックス',
        'Akh Rhai': 'アク・ラーイ',
        'Big Bang': 'ビッグバーン',
        'Big Crunch': 'ビッグクランチ',
        'Black Hole': 'ブラックホール',
        'Branding Flare': 'フレアブランド',
        'Burst': '飛散',
        'Bury': '衝撃',
        'Chasmic Nails': 'アビサルネイル',
        'Dark Matter': 'ダークマター',
        'Dimensional Surge': 'ディメンションサージ',
        'Explosion': '爆発',
        '(?<! )Flare': 'フレア',
        'Flow of the Abyss': 'アビサルフロウ',
        'Forked Lightning': 'フォークライトニング',
        'Fractured Eventide': '黒竜閃',
        'Meteor Impact': 'メテオインパクト',
        'Miasmic Blast': '瘴気爆発',
        'Nostalgia': '望郷',
        'Primal Roar': '大咆哮',
        'Prominence Spine': 'プロミネンススパイン',
        'Rend the Rift': '次元干渉',
        'Sable Thread': '漆黒の熱線',
        'Sparking Flare': 'フレアスパーク',
        'Umbral Prism': '闇の重波動',
        'Umbral Rays': '闇の波動',
        'Visceral Whirl': 'ヴィセラルワール',
        'Void Bio': 'ヴォイド・バイオ',
        'Void Meteor': 'ヴォイド・メテオ',
        'the Dark Beckons': '闇の侵食：重',
        'the Dark Binds': '闇の侵食：鎖',
        'the Dark Divides': '闇の侵食：砕',
      },
    },
  ],
};

export default triggerSet;
