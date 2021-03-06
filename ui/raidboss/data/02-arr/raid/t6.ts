import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import Util from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  beganMonitoringHp?: boolean;
  thornMap?: { [name: string]: string[] };
  honey?: boolean;
  seenLeafstorm?: boolean;
}

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheSecondCoilOfBahamutTurn1,
  timelineFile: 't6.txt',
  triggers: [
    {
      id: 'T6 Phase 2',
      type: 'Ability',
      // Bloody Caress.
      netRegex: NetRegexes.ability({ id: '797', source: 'Rafflesia' }),
      condition: (data) => !data.beganMonitoringHp,
      preRun: (data) => data.beganMonitoringHp = true,
      promise: (_data, matches) =>
        Util.watchCombatant({
          ids: [parseInt(matches.sourceId, 16)],
        }, (ret) => {
          return ret.combatants.some((c) => {
            return c.CurrentHP / c.MaxHP <= 0.7;
          });
        }),
      sound: 'Long',
    },
    {
      id: 'T6 Thorn Whip Collect',
      type: 'Tether',
      netRegex: NetRegexes.tether({ id: '0012' }),
      run: (data, matches) => {
        data.thornMap ??= {};
        (data.thornMap[matches.source] ??= []).push(matches.target);
        (data.thornMap[matches.target] ??= []).push(matches.source);
      },
    },
    {
      id: 'T6 Thorn Whip',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '879', source: 'Rafflesia' }),
      condition: Conditions.targetIsYou(),
      infoText: (data, _matches, output) => {
        const partners = data.thornMap?.[data.me] ?? [];
        if (partners.length === 0)
          return output.thornsOnYou!();

        if (partners.length === 1)
          return output.oneTether!({ player: data.ShortName(partners[0]) });

        if (partners.length === 2) {
          return output.twoTethers!({
            player1: data.ShortName(partners[0]),
            player2: data.ShortName(partners[1]),
          });
        }

        return output.threeOrMoreTethers!({ num: partners.length });
      },
      run: (data) => delete data.thornMap,
      outputStrings: {
        thornsOnYou: {
          en: 'Thorns on YOU',
          de: 'Dornenpeitsche auf DIR',
          fr: 'Ronces sur VOUS',
          ja: '??????????????????????????????',
          cn: '????????????',
        },
        oneTether: {
          en: 'Thorns w/ (${player})',
          de: 'Dornenpeitsche mit (${player})',
          fr: 'Ronces avec (${player})',
          ja: '????????? (${player}) ????????????????????????',
          cn: '?????????(${player})',
        },
        twoTethers: {
          en: 'Thorns w/ (${player1}, ${player2})',
          de: 'Dornenpeitsche mit (${player1}, ${player2})',
          fr: 'Ronces avec (${player1}, ${player2})',
          ja: '????????? (${player1}, ${player2}) ????????????????????????',
          cn: '?????????(${player1}, ${player2})',
        },
        threeOrMoreTethers: {
          en: 'Thorns (${num} people)',
          de: 'Dornenpeitsche mit (${num} Personen)',
          fr: 'Ronces (${num} personne)',
          ja: '????????????????????? (${num}???)',
          cn: '??????(${num} people)',
        },
      },
    },
    {
      // Honey-Glazed
      id: 'T6 Honey On',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '1BE' }),
      condition: Conditions.targetIsYou(),
      run: (data) => data.honey = true,
    },
    {
      id: 'T6 Honey Off',
      type: 'LosesEffect',
      netRegex: NetRegexes.losesEffect({ effectId: '1BE' }),
      condition: Conditions.targetIsYou(),
      run: (data) => delete data.honey,
    },
    {
      id: 'T6 Flower',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '000D' }),
      alarmText: (data, _matches, output) => {
        if (data.honey)
          return output.getEaten!();
      },
      alertText: (data, matches, output) => {
        if (data.honey)
          return;

        if (data.me === matches.target)
          return output.jumpInNewThorns!();
      },
      infoText: (data, matches, output) => {
        if (data.honey || data.me === matches.target)
          return;

        return output.avoidDevour!();
      },
      outputStrings: {
        avoidDevour: {
          en: 'Avoid Devour',
          de: 'Weiche Verschlingen aus',
          fr: '??vitez D??voration',
          ja: '??????????????????',
          cn: '????????????',
        },
        jumpInNewThorns: {
          en: 'Devour: Jump In New Thorns',
          de: 'Verschlingen: Spring in die neuen Dornen',
          fr: 'D??voration : Sautez dans les ronces',
          ja: '??????: ???????????????',
          cn: '????????????',
        },
        getEaten: {
          en: 'Devour: Get Eaten',
          de: 'Verschlingen: Gefressen werden',
          fr: 'D??voration : Faites-vous manger',
          ja: '??????: ???????????????',
          cn: '????????????',
        },
      },
    },
    {
      id: 'T6 Blighted',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '79D', source: 'Rafflesia', capture: false }),
      response: Responses.stopEverything(),
    },
    {
      id: 'T6 Phase 3',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '79E', source: 'Rafflesia', capture: false }),
      condition: (data) => !data.seenLeafstorm,
      sound: 'Long',
      run: (data) => data.seenLeafstorm = true,
    },
    {
      id: 'T6 Swarm Stack',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '86C', source: 'Rafflesia', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack for Acid',
          de: 'Sammeln f??r S??ure-Blubberblase',
          fr: 'Packez-vous pour Pluie acide',
          ja: '???????????????????????????????????????',
          cn: '??????????????????',
        },
      },
    },
    {
      id: 'T6 Swarm',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7A0', source: 'Rafflesia' }),
      condition: (data, matches) => data.me === matches.target || data.role === 'healer' || data.job === 'BLU',
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.swarmOnYou!();
      },
      infoText: (data, matches, output) => {
        if (matches.target !== data.me)
          return output.swarmOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        swarmOn: {
          en: 'Swarm on ${player}',
          de: 'F??henfurz auf ${player}',
          fr: 'Nu??e sur ${player}',
          ja: '${player}??????????????????',
          cn: '?????????${player}',
        },
        swarmOnYou: {
          en: 'Swarm on YOU',
          de: 'F??henfurz auf DIR',
          fr: 'Nu??e sur VOUS',
          ja: '????????????????????????',
          cn: '????????????',
        },
      },
    },
    {
      id: 'T6 Rotten Stench',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '000E' }),
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.shareLaserOnYou!();

        return output.shareLaserOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        shareLaserOnYou: {
          en: 'Share Laser (on YOU)',
          de: 'Geteilter Laser (auf DIR)',
          fr: 'Partagez le laser (sur VOUS)',
          ja: '(?????????)?????????????????????',
          cn: '??????????????????',
        },
        shareLaserOn: {
          en: 'Share Laser (on ${player})',
          de: 'Geteilter Laser (auf ${player})',
          fr: 'Partage de laser (sur ${player})',
          ja: '(${player})????????????????????????',
          cn: '???????????????(on ${player})',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Rafflesia': 'Rafflesia',
        'Scar\'s Edge': 'Narbenrand',
      },
      'replaceText': {
        'Acid Rain': 'S??ureregen',
        'Blighted Bouquet': 'Mehltau-Bouquet',
        'Bloody Caress': 'Vampirranke',
        'Briary Growth': 'Wuchernde Dornen',
        'Devour': 'Verschlingen',
        'Floral Trap': 'Saugfalle',
        'Leafstorm': 'Bl??ttersturm',
        'Rotten Stench': 'Fauler Gestank',
        'Spit': 'Hypersekretion',
        'Swarm': 'F??henfurz',
        'Thorn Whip': 'Dornenpeitsche',
        'Viscid Emission': 'Klebsporen',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Rafflesia': 'Rafflesia',
        'Scar\'s Edge': 'l\'Huis de la Marque',
      },
      'replaceText': {
        'Acid Rain': 'Pluie acide',
        'Blighted Bouquet': 'Bouquet mildious??',
        'Bloody Caress': 'Caresse sanglante',
        'Briary Growth': 'Pouss??e de tige',
        'Devour': 'D??voration',
        'Floral Trap': 'Pi??ge floral',
        'Leafstorm': 'Temp??te de feuilles',
        'Rotten Stench': 'Pestilence naus??abonde',
        'Spit': 'Crachat',
        'Swarm': 'Nu??e',
        'Thorn Whip': 'Fouet de ronces',
        'Viscid Emission': '??mission visqueuse',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Rafflesia': '???????????????',
        'Scar\'s Edge': '???????????????',
      },
      'replaceText': {
        'Acid Rain': '?????????',
        'Blighted Bouquet': '???????????????????????????',
        'Bloody Caress': '????????????????????????',
        'Briary Growth': '??????????????????????????????',
        'Devour': '??????',
        'Floral Trap': '???????????????????????????',
        'Leafstorm': '?????????????????????',
        'Rotten Stench': '?????????????????????',
        'Spit': '?????????',
        'Swarm': '???????????????',
        'Thorn Whip': '?????????????????????',
        'Viscid Emission': '??????????????????????????????',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Rafflesia': '?????????',
        'Scar\'s Edge': '???????????????',
      },
      'replaceText': {
        'Acid Rain': '??????',
        'Blighted Bouquet': '???????????????',
        'Bloody Caress': '???????????????',
        'Briary Growth': '????????????',
        'Devour': '??????',
        'Floral Trap': '????????????',
        'Leafstorm': '????????????',
        'Rotten Stench': '????????????',
        'Spit': '??????',
        'Swarm': '????????????',
        'Thorn Whip': '?????????',
        'Viscid Emission': '???????????????',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Rafflesia': '???????????????',
        'Scar\'s Edge': '????????? ??????',
      },
      'replaceText': {
        'Acid Rain': '?????????',
        'Blighted Bouquet': '?????? ?????????',
        'Bloody Caress': '?????? ??????',
        'Briary Growth': '????????? ????????????',
        'Devour': '??????',
        'Floral Trap': '????????? ???',
        'Leafstorm': '????????? ??????',
        'Rotten Stench': '?????? ??????',
        'Spit': '??????',
        'Swarm': '?????? ???',
        'Thorn Whip': '????????????',
        'Viscid Emission': '?????? ??????',
      },
    },
  ],
};

export default triggerSet;
