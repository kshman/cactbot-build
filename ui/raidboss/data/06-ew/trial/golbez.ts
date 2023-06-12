import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutputCardinal, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  galeSphereShadows: DirectionOutputCardinal[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'TheVoidcastDais',
  zoneId: ZoneId.TheVoidcastDais,
  timelineFile: 'golbez.txt',
  initData: () => {
    return {
      galeSphereShadows: [],
    };
  },
  triggers: [
    {
      id: 'Golbez Terrastorm',
      type: 'Ability',
      netRegex: { id: '8463', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '¸ÞÅ×¿À ÇÇÇØ',
          de: 'Vermeide Meteor',
        },
      },
    },
    {
      id: 'Golbez Crescent Blade',
      type: 'StartsUsing',
      netRegex: { id: '846B', source: 'Golbez', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Golbez Void Meteor',
      type: 'StartsUsing',
      netRegex: { id: '84AC', source: 'Golbez', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'Golbez Binding Cold',
      type: 'StartsUsing',
      netRegex: { id: '84B2', source: 'Golbez', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'Golbez Black Fang',
      type: 'StartsUsing',
      netRegex: { id: '8471', source: 'Golbez', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Golbez Shadow Crescent',
      type: 'StartsUsing',
      netRegex: { id: '8487', source: 'Golbez', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '¸ÕÀú µÚ·Î, ±×¸®°í ¹ÛÀ¸·Î',
          de: 'Geh hinter, dann raus',
        },
      },
    },
    {
      id: 'Golbez Gale Sphere Directions',
      type: 'Ability',
      netRegex: { id: '84(?:4F|50|51|52)', source: 'Golbez\'s Shadow', capture: true },
      infoText: (data, matches, output) => {
        switch (matches.id) {
          case '844F':
            data.galeSphereShadows.push('dirN');
            break;
          case '8450':
            data.galeSphereShadows.push('dirE');
            break;
          case '8451':
            data.galeSphereShadows.push('dirW');
            break;
          case '8452':
            data.galeSphereShadows.push('dirS');
            break;
        }

        if (data.galeSphereShadows.length < 4)
          return;

        const [dir1, dir2, dir3, dir4] = data.galeSphereShadows;
        if (dir1 === undefined || dir2 === undefined || dir3 === undefined || dir4 === undefined)
          return;

        data.galeSphereShadows = [];

        return output.clones!({
          dir1: output[dir1]!() ?? output.unknown!(),
          dir2: output[dir2]!() ?? output.unknown!(),
          dir3: output[dir3]!() ?? output.unknown!(),
          dir4: output[dir4]!() ?? output.unknown!(),
        });
      },
      outputStrings: {
        clones: {
          en: '${dir1}${dir2}${dir3}${dir4}',
          de: 'Klone: ${dir1}->${dir2}->${dir3}->${dir4}',
        },
        unknown: Outputs.unknown,
        ...Directions.outputStringsCardinalDir,
      },
    },
    {
      id: 'Golbez Eventide Fall',
      type: 'StartsUsing',
      netRegex: { id: '8482', source: 'Golbez', capture: false },
      response: Responses.stackMarker(),
    },
    {
      id: 'Golbez Immolating Shade',
      type: 'StartsUsing',
      netRegex: { id: '8495', source: 'Golbez' },
      alertText: (data, matches, output) => {
        const target = data.ShortName(matches.target) ?? '??';
        return output.text!({ player: target });
      },
      outputStrings: {
        text: {
          en: '¸ÕÀú ¹ÛÀ¸·Î => ¹¶ÃÄ¿ä: ${player}',
          de: 'Zuerst Raus => Sammeln mit ${player}',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Golbez': 'Golbez',
        'Golbez\'s Shadow': 'Phantom-Golbez',
      },
      'replaceText': {
        '\\(preview\\)': '(Vorschau)',
        'Arctic Assault': 'Frostschuss',
        'Azdaja\'s Shadow': 'Azdajas Schatten',
        'Binding Cold': 'Eisfessel',
        'Black Fang': 'Schwarze Fange',
        'Burning Shade': 'Brennender Schatten',
        'Crescent Blade': 'Sichelstreich',
        'Double Meteor': 'Doppel-Meteo',
        'Eventide Fall': 'Gebundelte Abendglut',
        'Explosion': 'Explosion',
        'Gale Sphere': 'Windsphare',
        'Immolating Shade': 'Aschernder Schatten',
        'Lingering Spark': 'Lauernder Funke',
        'Rising Beacon': 'Hohes Fanal',
        'Shadow Crescent': 'Schwarzer Sichelstreich',
        'Terrastorm': 'Irdene Breitseite',
        'Void Meteor': 'Nichts-Meteo',
        'Void Stardust': 'Nichts-Sternenstaub',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Golbez': 'Golbez',
        'Golbez\'s Shadow': 'spectre de Golbez',
      },
      'replaceText': {
        'Arctic Assault': 'Assaut arctique',
        'Azdaja\'s Shadow': 'Ombre d\'Azdaja',
        'Binding Cold': 'Geole glaciale',
        'Black Fang': 'Croc obscur',
        'Burning Shade': 'Ombre brulante',
        'Crescent Blade': 'Lame demi-lune',
        'Double Meteor': 'Meteore double',
        'Eventide Fall': 'Eclat crepusculaire concentre',
        'Explosion': 'Explosion',
        'Gale Sphere': 'Spheres de vent tenebreux',
        'Immolating Shade': 'Ombre incandescente',
        'Lingering Spark': 'Etincelle persistante',
        'Rising Beacon': 'Flambeau ascendant',
        'Shadow Crescent': 'Lame demi-lune obscure',
        'Terrastorm': 'Aerolithe flottant',
        'Void Meteor': 'Meteore du neant',
        'Void Stardust': 'Pluie de cometes du neant',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Golbez': '«´«ë«Ù?«¶',
        'Golbez\'s Shadow': '«´«ë«Ù?«¶ªÎü³ç¯',
      },
      'replaceText': {
        'Arctic Assault': '«³?«ë«É«Ö«é«¹«È',
        'Azdaja\'s Shadow': '???«¢«¸«å«À«ä',
        'Binding Cold': 'ñ±ÚÚªÎÕÒ?',
        'Black Fang': '?ª¤ä³',
        'Burning Shade': '?æú',
        'Crescent Blade': 'ú×êÅ?',
        'Double Meteor': '«À«Ö«ë«á«Æ«ª',
        'Eventide Fall': 'ó¢áÖ??àì',
        'Explosion': 'øï?',
        'Gale Sphere': '«¦«£«ó«É«¹«Õ«£«¢',
        'Immolating Shade': 'ñì?æú',
        'Lingering Spark': '«Ç«£«ì«¤«¹«Ñ?«¯',
        'Rising Beacon': 'ã°?Üëûý',
        'Shadow Crescent': 'ú×êÅ???',
        'Terrastorm': '«Ç«£«ì«¤«¢?«¹',
        'Void Meteor': '«ô«©«¤«É?«á«Æ«ª',
        'Void Stardust': '«ô«©«¤«É?«³«á«Ã«È«ì«¤«ó',
      },
    },
  ],
};

export default triggerSet;
