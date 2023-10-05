import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  miasmicBlastPositions?: ({ x: number; y: number })[];
  decOffset?: number;
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

const triggerSet: TriggerSet<Data> = {
  id: 'TheAbyssalFractureExtreme',
  zoneId: ZoneId.TheAbyssalFractureExtreme,
  timelineFile: 'zeromus-ex.txt',
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
      id: 'ZeromusEx Miasmic Blast',
      type: 'StartsUsing',
      netRegex: { id: '8B49', capture: true },
      delaySeconds: 0.5,
      promise: async (data, matches) => {
        // TODO: This trigger does not work 100% of the time in raidemulator and needs more testing in-zone
        data.miasmicBlastPositions ??= [];

        const combatants = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;

        if (combatants === undefined || combatants.length !== 1) {
          console.error(
            `Miasmic Blast: unexpected response to getCombatants, got ${
              JSON.stringify(combatants)
            }`,
          );
          return;
        }

        const combatant = combatants[0];

        if (combatant === undefined)
          return;

        data.miasmicBlastPositions.push({
          x: combatant.PosX,
          y: combatant.PosY,
        });
      },
      infoText: (data, _matches, output) => {
        if (data.miasmicBlastPositions === undefined || data.miasmicBlastPositions.length < 3)
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
        // There's probably a better way to handle this rather than an exhaustive check
        let safeSpots: safeSpotType[] = [
          'WNW',
          'NW',
          'NNW',
          'NNE',
          'NE',
          'ENE',
        ];

        // From the center, Xs always spawn 0y, 7y, or 14y on either axis away from middle
        // So treat safe spots as half way between those possible points, on the edge
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

        for (const pos of data.miasmicBlastPositions) {
          const removeSpots: safeSpotType[] = [];
          for (const spot of safeSpots) {
            // If this blast is at a 45º angle to the safe spot, remove the safe spot
            const angle =
              ((Math.atan2(pos.y - safeSpotMap[spot].y, pos.x - safeSpotMap[spot].x) * 180 /
                Math.PI) + 180) % 90;
            if (Math.abs(angle - 45) < Number.EPSILON) {
              removeSpots.push(spot);
            }
          }
          safeSpots = safeSpots.filter((spot) => !removeSpots.includes(spot));
        }

        delete data.miasmicBlastPositions;

        if (safeSpots.length !== 1) {
          console.error(`Miasmic Blast: Could not find safe spot`, safeSpots);
          return output.unknown!();
        }

        if (data.options.AutumnStyle) {
          if (safeSpots[0] === undefined)
            return output.unknown!();
          return output[`a${safeSpots[0]}`]!();
        }

        const safeSpot = safeSpots[0] ?? 'unknown';

        return output[safeSpot]!();
      },
      outputStrings: {
        WNW: Outputs.dirWNW,
        NW: Outputs.dirNW,
        NNW: Outputs.dirNNW,
        NNE: Outputs.dirNNE,
        NE: Outputs.dirNE,
        ENE: Outputs.dirENE,
        unknown: Outputs.unknown,
        atext: {
          en: '안전: ${safe}',
        },
        aWNW: Outputs.dirWNW,
        aNW: Outputs.arrowNW,
        aNNW: Outputs.dirNNW,
        aNNE: Outputs.dirNNE,
        aNE: Outputs.arrowNE,
        aENE: Outputs.dirENE,
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
      type: 'Ability',
      netRegex: { id: '8B5F', capture: false },
      condition: (data) => data.options.AutumnStyle,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '페어! 둘이 뭉쳐요!',
        },
      },
    },
    {
      id: 'ZeromusEx PR Sparking Flare',
      type: 'Ability',
      netRegex: { id: '8B5E', capture: false },
      condition: (data) => data.options.AutumnStyle,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요!',
        },
      },
    },
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
