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
        return output.cleanse!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        cleanse: {
          en: '에스나: ${player}',
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
};

export default triggerSet;
