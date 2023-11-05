import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import Util from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Dark Elf tell people where to go for hidden staves
// TODO: Antlion tell people which row to be in for landslip + towerfall
// TODO: Durante initial Forsaken Fount with orbs
// TODO: Durante Forsaken Fount+Contrapasso explosions (looks to be one pattern rotated?)

export type Data = RaidbossData;

const triggerSet: TriggerSet<Data> = {
  id: 'TheLunarSubteranne',
  zoneId: ZoneId.TheLunarSubterrane,
  timelineFile: 'the_lunar_subterrane.txt',
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
          en: '안전: 🟦사각',
          de: 'Blaues Viereck sicher',
          ko: '파란색 네모 안전',
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
          en: '안전: 🟣삼각',
          de: 'Pinkes Dreieck sicher',
          ko: '분홍색 삼각형 안전',
        },
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
          en: '에스나: ${player}',
          de: 'Reinige ${player}\'s Verhängnis',
          ko: '${player} 선고 해제하기',
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
          en: '보스 옆으로!',
          de: 'Geh seitlich an die Wand',
          ko: '옆쪽 벽에 붙기',
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
          en: '보스 뒷쪽 바깥으로',
          de: 'Geh nach Hinten und Raus',
          fr: 'Passez derrière et extérieur',
          ja: '後ろの外側へ',
          cn: '去背后远离',
          ko: '보스 뒤 바깥쪽으로',
        },
      },
    },
    {
      id: 'Lunar Subterrane Durante Arcane Edge',
      type: 'StartsUsing',
      netRegex: { id: '88C2', source: 'Durante' },
      response: Responses.tankBuster(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
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
