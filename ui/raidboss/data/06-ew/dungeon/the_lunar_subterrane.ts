import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import Util, { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { Matches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Dark Elf tell people where to go for hidden staves
// TODO: Antlion tell people which row to be in for landslip + towerfall

export interface Data extends RaidbossData {
  fountsSeen: number;
  fountX: number[];
  fountY: number[];
  staffMatches: Matches[];
}

const elfCenterX = -401.02;
const elfCenterY = -231.01;

const getSafeDirNumberFromMatch = (match: Matches): number | undefined => {
  if (match.x === undefined || match.y === undefined)
    return;
  const x = parseFloat(match.x);
  const y = parseFloat(match.y);
  const dangerNumber = Directions.xyTo8DirNum(x, y, elfCenterX, elfCenterY);
  return (dangerNumber + 4) % 8;
};

const dirNumberToOutput: { [number: number]: string } = {
  1: 'northeast',
  3: 'southeast',
  5: 'southwest',
  7: 'northwest',
};

const triggerSet: TriggerSet<Data> = {
  id: 'TheLunarSubteranne',
  zoneId: ZoneId.TheLunarSubterrane,
  timelineFile: 'the_lunar_subterrane.txt',
  initData: () => {
    return {
      fountsSeen: 0,
      fountX: [],
      fountY: [],
      staffMatches: [],
    };
  },
  triggers: [
    {
      id: 'Lunar Subterrane Dark Elf Abyssal Outburst',
      type: 'StartsUsing',
      netRegex: { id: '87DE', source: 'Dark Elf', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Lunar Subterrane Dark Elf Void Dark II',
      type: 'StartsUsing',
      netRegex: { id: '87E4', source: 'Dark Elf' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Lunar Subterrane Dark Elf Staff Smite',
      type: 'StartsUsing',
      netRegex: { id: '8984', source: 'Dark Elf' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Lunar Subterrane Dark Elf Shadow Sigil Pink Triangle',
      type: 'StartsUsing',
      netRegex: { id: '87DB', source: 'Dark Elf', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Blue Square Safe',
          de: 'Blaues Viereck sicher',
          ja: '安置: 青四角',
          ko: '안전: 🟦사각',
        },
      },
    },
    {
      id: 'Lunar Subterrane Dark Elf Shadow Sigil Blue Square',
      type: 'StartsUsing',
      netRegex: { id: '87DC', source: 'Dark Elf', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Pink Triangle Safe',
          de: 'Pinkes Dreieck sicher',
          ja: '安置: 赤三角',
          ko: '분홍색 삼각',
        },
      },
    },
    {
      id: 'Lunar Subterrane Dark Elf Ruinous Hex Collect',
      type: 'StartsUsing',
      netRegex: { id: ['89B6', '87DF'], source: 'Hexing Staff' }, // Ruinous Hex cast
      run: (data, matches) => data.staffMatches.push(matches),
    },
    {
      id: 'Lunar Subterrane Dark Elf Ruinous Hex Call',
      type: 'StartsUsing',
      netRegex: { id: '8985', source: 'Dark Elf', capture: false }, // Cue off Ruinous Confluence
      delaySeconds: 0.5,
      alertText: (data, _matches, output) => {
        // The origin for this encounter is -401.02,-231.01
        // On rounds 1/2, there is almost always a staff in a close square.
        // The safespot in this situation is always diagonally opposite this close square.
        // If there's no close staff, the pattern is always south safe or (assumedly) west safe.
        // On round 3 and later, there is always one staff in a far corner,
        // while two spawn framing the close square opposite this far one:

        //      |-413|-405|-397|-389|
        //      |----|----|----|----|
        // -243 |0000|    |    |    |
        //      |----|----|----|----|
        // -235 |    |    |    |0000|
        //      |----|----|----|----|
        // -227 |    |    |    |    |
        //      |----|----|----|----|
        // -219 |    |0000|    |    |
        //      |----|----|----|----|

        // (This can also be rotated 180 degrees.)

        // To date, only some squares have been observed to be populated.
        // Blank squares here indicate locations that never have a staff:

        //      |-413|-405|-397|-389|
        //      |----|----|----|----|
        // -243 |0000|    |0000|0000|
        //      |----|----|----|----|
        // -235 |    |    |0000|0000|
        //      |----|----|----|----|
        // -227 |0000|0000|0000|    |
        //      |----|----|----|----|
        // -219 |0000|0000|    |0000|
        //      |----|----|----|----|

        let safeNumber: number | undefined;

        const closeMatch = data.staffMatches.filter((match) => {
          if (match.x === undefined || match.y === undefined)
            return false;
          const absX = Math.abs(Math.round(parseFloat(match.x)));
          const absY = Math.abs(Math.round(parseFloat(match.y)));
          return absX > 395 && absX < 410 && absY > 225 && absY < 240;
        })[0];

        const farMatch = data.staffMatches.filter((match) => {
          if (match.x === undefined || match.y === undefined)
            return false;
          const absX = Math.abs(Math.round(parseFloat(match.x)));
          const absY = Math.abs(Math.round(parseFloat(match.y)));
          return (absX < 395 || absX > 410) && (absY < 225 || absY > 240);
        })[0];

        // If there's a close staff, check which direction it is,
        // then call opposite.
        // If there isn't a close staff, find the one that's far,
        // determine its direction, then call the close square opposite.
        // Note that there is one pattern that doesn't fit this!
        if (closeMatch !== undefined)
          safeNumber = getSafeDirNumberFromMatch(closeMatch);
        else if (farMatch !== undefined) {
          // If there are only two staves and there isn't a close one,
          // the southwest square will always be safe.
          // (The far staff always seems to be southwest for this pattern,
          // with the other next to the opposite corner,
          // and regardless of whether the other staff is in  row 1 column 3 or row 2 column 4,
          // this will call it correctly.)
          if (data.staffMatches.length === 2)
            return output.southwest!();
          safeNumber = getSafeDirNumberFromMatch(farMatch);
        }

        // If we don't have a number, we don't know where to go.
        if (safeNumber === undefined)
          return output.unknown!();
        const outputSelect = dirNumberToOutput[safeNumber];
        if (outputSelect === undefined)
          return output.unknown!();
        return output[outputSelect]!();
      },
      run: (data) => data.staffMatches = [],
      outputStrings: {
        northeast: {
          en: 'Inner northeast safe',
          ja: '安置: 🡼',
          ko: '안전: 🡼',
        },
        northwest: {
          en: 'Inner northwest safe',
          ja: '安置: 🡽',
          ko: '안전: 🡽',
        },
        southeast: {
          en: 'Inner southeast safe',
          ja: '安置: 🡿',
          ko: '안전: 🡿',
        },
        southwest: {
          en: 'Inner southwest safe',
          ja: '安置: 🡾',
          ko: '안전: 🡾',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Lunar Subterrane Dark Elf Doom',
      type: 'GainsEffect',
      // Doom comes from being hit by Ruinous Hex (the staves).
      // Dark Whispers stacks from being hit by staves decrease the time on this debuff
      // from 15 -> 7 -> 3. The Dark Whispers stacks top out at 2.
      netRegex: { effectId: 'D24' },
      condition: (data) => Util.canCleanse(data.job),
      alertText: (data, matches, output) => {
        return output.cleanse!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        cleanse: {
          en: 'Cleanse ${player}\'s Doom',
          de: 'Reinige ${player}\'s Verhängnis',
          ja: 'エスナ: ${player}',
          ko: '에스나: ${player}',
        },
      },
    },
    {
      id: 'Lunar Subterrane Antlion Sandblast',
      type: 'StartsUsing',
      netRegex: { id: '87FD', source: 'Damcyan Antlion', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Lunar Subterrane Antlion Earthen Geyser',
      type: 'StartsUsing',
      netRegex: { id: '8806', source: 'Damcyan Antlion' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Lunar Subterrane Antlion Pound Sand',
      type: 'Ability',
      // This is on the Earthen Geyser hit.
      netRegex: { id: '8806', source: 'Damcyan Antlion' },
      condition: Conditions.targetIsYou(),
      response: Responses.getOut(),
    },
    {
      id: 'Lunar Subterrane Durante Old Magic',
      type: 'StartsUsing',
      netRegex: { id: '88C3', source: 'Durante', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Lunar Subterrane Durante Fallen Grace',
      type: 'StartsUsing',
      netRegex: { id: '8C2A', source: 'Durante' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Lunar Subterrane Durante Antipodal Assault',
      type: 'Ability',
      netRegex: { id: '38FC', source: 'Durante' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Lunar Subterrane Durante Hard Slash',
      type: 'Ability',
      netRegex: { id: '88C0', source: 'Durante', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go Sides on Wall',
          de: 'Geh seitlich an die Wand',
          ja: '壁の方へ',
          ko: '보스 옆으로!',
        },
      },
    },
    {
      id: 'Lunar Subterrane Durante Twilight Phase',
      type: 'StartsUsing',
      netRegex: { id: '8CD8', source: 'Durante', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Lunar Subterrane Durante Dark Impact',
      type: 'StartsUsing',
      netRegex: { id: '88BA', source: 'Durante', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Behind and Out',
          de: 'Geh nach Hinten und Raus',
          fr: 'Passez derrière et extérieur',
          ja: '後ろの外側へ',
          cn: '去背后远离',
          ko: '보스 뒷쪽 바깥으로',
        },
      },
    },
    {
      id: 'Lunar Subterrane Durante Arcane Edge',
      type: 'StartsUsing',
      netRegex: { id: '88C2', source: 'Durante' },
      response: Responses.tankBuster(),
    },
    {
      // Round 1 is always a non-splitting line of orbs.
      id: 'Lunar Subterrane Durante Forsaken Fount 1',
      type: 'Ability',
      netRegex: { id: '88BB', source: 'Durante', capture: false },
      condition: (data) => data.fountsSeen === 0,
      delaySeconds: 1, // This collides with Fount 2 if we don't delay. ???
      infoText: (_data, _matches, output) => output.avoid!(),
      run: (data) => data.fountsSeen += 1,
      outputStrings: {
        avoid: {
          en: 'Away from orbs',
          ja: '玉から離れて',
          ko: '구슬 피해요',
        },
      },
    },
    {
      // Round 2 is always a splitting line. Center is always safe.
      id: 'Lunar Subterrane Durante Forsaken Fount 2',
      type: 'Ability',
      netRegex: { id: '88BB', source: 'Durante', capture: false },
      condition: (data) => data.fountsSeen === 1,
      delaySeconds: 1,
      response: Responses.goMiddle('info'),
      run: (data) => data.fountsSeen += 1,
    },
    {
      // On round three and subsequently, known  spawn locations for the Aetheric Charge orbs are:
      // (0,-422)
      // (0, -434.8)
      // (0, -409.2)
      // (3.65, -412.9)
      // (-3.65, -412.95)
      // (9.05, -412.8)
      // (-9.05, -418.35)
      // (9.15, -425.55)
      // (9.15, -431.1)
      // (-9.25, -431.1)
      // (12.8, -422)
      // (-12.8, -422)
      // (Other spawn locations exist for rounds 1/2, but we can ignore those.)

      // The primary known configurations for round three onward are:
      // West Safe
      // (-12.80,-422.00), (0.00,-422.00), (12.80,-422.00)
      // (9.15,-431.10)
      // (3.65,-412.90)

      // North Safe
      // (0.00,-409.20), (0.00,-422.00), (0.00,-434.80)
      // (9.05,-412.80)
      // (-9.05,-418.35)

      // East Safe
      // (-12.80,-422.00),  (0.00,-422.00), (12.80,-422.00)
      // (-9.25,-431.05)
      // (-3.65,-412.95)

      // Hourglass
      // (0.00,-409.20), (0.00,-422.00), (0.00,-434.80)
      // (-9.05,-418.35)
      // (9.15,-425.55)
      // So far nobody has seen a configuration with South being safe.

      // When the Y axis is normalized to 0, the sets look like this:
      // West Safe
      // (-12.80,0), (0,0), (12.8,0)
      // (9.15,-9.1)
      // (3.65,9.1)

      // North Safe
      // (0,12.8), (0,0), (0,-12.8)
      // (9.05,9.2)
      // (-9.05,3.65)

      // East Safe
      // (-12.8,0),  (0,0), (12.8,0)
      // (-9.25,-9.05)
      // (-3.65,9.05)

      // Hourglass
      // (0,12.8), (0,0), (0,-12.8)
      // (-9.05,3.65)
      // (9.15,-3.55)
      id: 'Lunar Subterrane Durante Forsaken Fount 3 Collect',
      type: 'AddedCombatant',
      netRegex: { name: 'Aetheric Charge' },
      condition: (data) => data.fountsSeen === 2,
      run: (data, matches) => {
        // Because the positions are relatively fixed, we don't need a reliable order for coordinates.
        // Only the values and the count of those values really is important here.
        data.fountX.push(Math.round(parseFloat(matches.x)));
        data.fountY.push(Math.round(parseFloat(matches.y)) + 422); // Normalize the Y axis to 0
      },
    },
    {
      id: 'Lunar Subterrane Durante Forsaken Fount 3 Call',
      type: 'AddedCombatant',
      netRegex: { name: 'Aetheric Charge', capture: false },
      condition: (data) => data.fountsSeen === 2,
      delaySeconds: 0.5,
      infoText: (data, _matches, output) => {
        if (data.fountX.length < 5 || data.fountY.length < 5)
          return;
        // If there are five orbs on the field, three of them will, guaranteed,
        // have the same X or Y value. Those three are in a straight line.
        const hCount = data.fountY.filter((n) => Math.abs(n) < 1).length;
        const vCount = data.fountX.filter((n) => Math.abs(n) < 1).length;

        if (hCount === 3) {
          // Horizontal lines are always east/west safe hammer patterns.
          const xSum = data.fountX.reduce((a, b) => a + b, 0);

          // Don't rely on the rounded sum to be precise, but the sign will be reliable.
          if (xSum > 5)
            return output.west!();
          if (xSum < 5)
            return output.east!();
          return output.unknown!();
        }
        if (vCount === 3) {
          // Remember that we're working with 0-normalized Y values here!
          // Positive Y values are south.

          // Vertical lines have two possible patterns, one hammer and one hourglass.
          // If it's hourglass, the rounded  Y positions sum to 0.
          // If it's hammer, the absolute value of rounded sums totals 13.
          // (So far we haven't seen a situation where the rounded total is -13,
          // but handle it anyway just in case.)
          const ySum = data.fountY.reduce((a, b) => a + b, 0);
          if (ySum > 10) // Multiple non-line orbs south.
            return output.north!();
          if (ySum < -10) // Multiple non-line orbs north. THIS DOES NOT NECESSARILY EXIST.
            return output.south!();
          return output.center!(); // An hourglass configuration.
        }
        return output.unknown!();
      },
      run: (data) => {
        data.fountX = [];
        data.fountY = [];
      },
      outputStrings: {
        west: Outputs.west,
        east: Outputs.east,
        north: Outputs.north,
        south: Outputs.south,
        center: Outputs.goIntoMiddle,
        unknown: '???',
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Aetheric Charge': 'magisch(?:e|er|es|en) Sphäre',
        'Damcyan Antlion': 'damcyanisch(?:e|er|es|en) Ameisenlöwe',
        'Dark Elf': 'Dunkelelf',
        'Durante': 'Durante',
        'Stone Pillar': 'Steinsäule',
        'The Bloodied Barbican': 'Schlosspforte',
        'The Carnelian Courtyard': 'Schlossgarten',
        'The Cloven Crystal Square': 'Kristall-Platz',
      },
      'replaceText': {
        '\\(cast\\)': '(Wirken)',
        '\\(spread\\)': '(Verteilen)',
        'Abyssal Outburst': 'Finsterschwall',
        'Antipodal Assault': 'Antipodischer Stoß',
        'Antlion March': 'Mächtiger Marsch',
        'Arcane Edge': 'Arkane Schneide',
        'Contrapasso': 'Contrapasso',
        'Dark Impact': 'Dunkler Einschlag',
        'Death\'s Journey': 'Ende des Weges',
        'Duplicitous Battery': 'Doppelte Barrage',
        'Earthen Geyser': 'Staubiger Geysir',
        'Explosion': 'Explosion',
        'Fallen Grace': 'Banngeschoß',
        'Forsaken Fount': 'Magische Sphären',
        'Hard Slash': 'Harter Schlitzer',
        'Hexing Staves': 'Stäbe der Dunkelheit',
        'Landslip': 'Einsturz',
        'Old Magic': 'Magiefeuer',
        'Pound Sand': 'Sandhammer',
        'Ruinous Confluence': 'Verheerender Fluch',
        'Sandblast': 'Sandschwall',
        'Shadowy Sigil': 'Wappen der Dunkelheit',
        'Sorcerous Shroud': 'Vorhang der Dunkelheit',
        'Splinter': 'Sphärensplitterung',
        'Staff Smite': 'Stabschlag',
        'Towerfall': 'Turmsturz',
        'Twilight Phase': 'Zwielichtschnitt',
        'Void Dark II': 'Nichts-Negra',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Aetheric Charge': 'globe magique',
        'Damcyan Antlion': 'fourmilion de Damcyan',
        'Dark Elf': 'Elfe noir',
        'Durante': 'Durante',
        'Stone Pillar': 'colonne',
        'The Bloodied Barbican': 'Portes du château de Baron',
        'The Carnelian Courtyard': 'Cour du château de Baron',
        'The Cloven Crystal Square': 'Place du cristal',
      },
      'replaceText': {
        'Abyssal Outburst': 'Onde noire',
        'Antipodal Assault': 'Percée antipodale',
        'Antlion March': 'Marche des fourmilions',
        'Arcane Edge': 'Oblitérateur magique',
        'Contrapasso': 'Contrapasso',
        'Dark Impact': 'Décharge obscure',
        'Death\'s Journey': 'Cortège funèbre',
        'Duplicitous Battery': 'Multi-décharges',
        'Earthen Geyser': 'Geyser terrestre',
        'Explosion': 'Explosion',
        'Fallen Grace': 'Descente obscure',
        'Forsaken Fount': 'Globes magiques',
        'Hard Slash': 'Taillade violente',
        'Hexing Staves': 'Cannes des ténèbres',
        'Landslip': 'Sol mouvant',
        'Old Magic': 'Déferlante magique',
        'Pound Sand': 'Martèlement terrestre',
        'Ruinous Confluence': 'Cruci-cannes',
        'Sandblast': 'Explosion sableuse',
        'Shadowy Sigil': 'Sceau des ténèbres',
        'Sorcerous Shroud': 'Disparition ténébreuse',
        'Splinter': 'Rupture',
        'Staff Smite': 'Coup de canne',
        'Towerfall': 'Écroulement',
        'Twilight Phase': 'Ombre du crépuscule',
        'Void Dark II': 'Extra Ténèbres du néant',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Aetheric Charge': '魔力球',
        'Damcyan Antlion': 'ダムシアン・アントリオン',
        'Dark Elf': 'ダークエルフ',
        'Durante': 'ドゥランテ',
        'Stone Pillar': '石柱',
        'The Bloodied Barbican': 'バロン城正門',
        'The Carnelian Courtyard': 'バロン城中庭',
        'The Cloven Crystal Square': 'クリスタル広場',
      },
      'replaceText': {
        'Abyssal Outburst': '暗黒波動',
        'Antipodal Assault': 'アンティポディース・スラスト',
        'Antlion March': 'アントリオンマーチ',
        'Arcane Edge': '魔針弾',
        'Contrapasso': 'コントラパッソ',
        'Dark Impact': '暗黒魔弾',
        'Death\'s Journey': 'ジャーニー・オブ・デス',
        'Duplicitous Battery': '双魔連弾',
        'Earthen Geyser': 'アースゲイザー',
        'Explosion': '爆発',
        'Fallen Grace': '降魔弾',
        'Forsaken Fount': '魔力球',
        'Hard Slash': 'ハードスラッシュ',
        'Hexing Staves': '闇の杖',
        'Landslip': '地滑り',
        'Old Magic': '魔力放出',
        'Pound Sand': 'アースパウンド',
        'Ruinous Confluence': '十字魔操',
        'Sandblast': 'サンドブラスト',
        'Shadowy Sigil': '闇の紋章',
        'Sorcerous Shroud': '闇の帳',
        'Splinter': '破裂',
        'Staff Smite': '杖撃',
        'Towerfall': '倒壊',
        'Twilight Phase': 'トワイライトフェイズ',
        'Void Dark II': 'ヴォイド・ダーラ',
      },
    },
  ],
};

export default triggerSet;
