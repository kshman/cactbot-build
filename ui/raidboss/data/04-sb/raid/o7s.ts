import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  rot?: boolean;
  seenVirus?: boolean;
  first?: string;
  second?: string;
  loadCount?: number;
  runCount?: number;
}

// O7S - Sigmascape 3.0 Savage
const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.SigmascapeV30Savage,
  timelineFile: 'o7s.txt',
  triggers: [
    // State
    {
      id: 'O7S Aether Rot Gain',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '5C3' }),
      condition: Conditions.targetIsYou(),
      run: (data) => data.rot = true,
    },
    {
      id: 'O7S Aether Rot Lose',
      type: 'LosesEffect',
      netRegex: NetRegexes.losesEffect({ effectId: '5C3' }),
      condition: Conditions.targetIsYou(),
      run: (data) => data.rot = false,
    },
    {
      id: 'O7S Dadaluma Simulation',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ target: 'Guardian', effectId: '5D3', capture: false }),
      condition: (data) => !data.first || data.seenVirus && !data.second,
      run: (data) => {
        if (data.seenVirus)
          data.second = 'dada';
        else
          data.first = 'dada';
      },
    },
    {
      id: 'O7S Bibliotaph Simulation',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ target: 'Guardian', effectId: '5D4', capture: false }),
      condition: (data) => !data.first || data.seenVirus && !data.second,
      run: (data) => {
        if (data.seenVirus)
          data.second = 'biblio';
        else
          data.first = 'biblio';
      },
    },
    {
      id: 'O7S Virus Tracker',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ target: 'Guardian', effectId: '5D5', capture: false }),
      run: (data) => data.seenVirus = true,
    },
    {
      id: 'O7S Magitek Ray',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '2788', source: 'Guardian', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Magitek Ray',
          de: 'Magitek-Laser',
          fr: 'Rayon Magitek',
          ja: '??????????????????',
          cn: '??????AOE',
          ko: '?????? ?????????',
        },
      },
    },
    {
      id: 'O7S Arm And Hammer',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '2789', source: 'Guardian' }),
      response: Responses.tankBuster(),
    },
    {
      id: 'O7S Orb Marker',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '0017' }),
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Orb Marker',
          de: 'Orb Marker',
          fr: 'Orbe',
          ja: '????????????',
          cn: '????????????',
          ko: '?????? ?????? ???',
        },
      },
    },
    {
      id: 'O7S Blue Marker',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '000E' }),
      alarmText: (data, matches, output) => {
        if (data.me !== matches.target)
          return;
        return output.blueMarkerOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return;
        return output.blueMarkerOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        blueMarkerOn: {
          en: 'Blue Marker on ${player}',
          de: 'Aura-Kanone auf ${player}',
          fr: 'Marque Bleue sur ${player}',
          ja: '${player}?????????',
          cn: '????????????${player}',
          ko: '"${player}" ?????????',
        },
        blueMarkerOnYou: {
          en: 'Blue Marker on YOU',
          de: 'Aura-Kanone auf DIR',
          fr: 'Marque Bleue sur VOUS',
          ja: '???????????????',
          cn: '????????????',
          ko: '????????? ?????????',
        },
      },
    },
    {
      id: 'O7S Prey',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({ id: '001E' }),
      response: Responses.preyOn('info'),
    },
    {
      id: 'O7S Searing Wind',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '178' }),
      condition: Conditions.targetIsYou(),
      response: Responses.getOut(),
    },
    {
      id: 'O7S Abandonment',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '58A' }),
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Abandonment: stay middle',
          de: 'Verlassen: Bleib mittig',
          fr: 'Isolement : restez au milieu',
          ja: '??????: ?????????',
          cn: '????????????',
          ko: '?????????: ????????? ??????',
        },
      },
    },
    {
      // Aether Rot
      id: 'O7S Rot',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '5C3' }),
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.rotOnYou!();

        return output.rotOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        rotOnYou: {
          en: 'Rot on you',
          de: 'F??ule auf DIR',
          fr: 'Pourriture sur VOUS',
          ja: '??????????????????',
          cn: '??????????????????',
          ko: '????????? ?????????',
        },
        rotOn: {
          en: 'Rot on ${player}',
          de: 'F??ule auf ${player}',
          fr: 'Pourriture sur ${player}',
          ja: '${player}????????????',
          cn: '??????????????????${player}',
          ko: '"${player}" ?????????',
        },
      },
    },
    {
      id: 'O7S Stoneskin',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '2AB5', source: 'Ultros' }),
      response: Responses.interrupt('alarm'),
    },
    {
      id: 'O7S Load',
      type: 'StartsUsing',
      // Load: 275C
      // Skip: 2773
      // Retrieve: 2774
      // Paste: 2776
      netRegex: NetRegexes.startsUsing({ id: ['275C', '2773', '2774', '2776'], source: 'Guardian', capture: false }),
      alertText: (data, _matches, output) => {
        data.loadCount = (data.loadCount ?? 0) + 1;

        if (data.loadCount === 1) {
          // First load is unknown.
          return output.screen!();
        } else if (data.loadCount === 2) {
          return data.first === 'biblio' ? output.dada!() : output.biblio!();
        } else if (data.loadCount === 3) {
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        } else if (data.loadCount === 4) {
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
        } else if (data.loadCount === 5) {
          return output.virus!();
        } else if (data.loadCount === 6) {
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        } else if (data.loadCount === 7) {
          // This is the post-virus Load/Skip divergence.
          return output.screen!();
        } else if (data.loadCount === 8) {
          return data.first === 'biblio' ? output.dada!() : output.biblio!();
        } else if (data.loadCount === 9) {
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
        }

        console.error(`Unknown load: ${data.loadCount}`);
      },
      outputStrings: {
        screen: {
          en: 'Biblio?/Knockback?',
          de: 'Biblio?/R??cksto???',
          fr: 'Biblio ?/Pouss??e ?',
          ja: '???????????????????/???????????????????',
          cn: '?????????/?????????',
          ko: '?????????????/???????',
        },
        biblio: {
          en: 'Biblio: Positions',
          de: 'Biblio: Positionen',
          fr: 'Biblio : Positions',
          ja: '??????????????????: ??????????????????',
          cn: '???????????????',
          ko: '????????????: ?????? ?????????',
        },
        dada: {
          en: 'Dada: Knockback',
          de: 'Dada: R??cksto??',
          fr: 'Dada : Pouss??e',
          ja: '???????????????: ??????????????????',
          cn: '???????????????',
          ko: '????????????: ??????',
        },
        ships: {
          en: 'Ships: Out of Melee',
          de: 'Flieger: Raus aus Nahkampf-Reichweite',
          fr: 'Vaisseaux : Sortez de la m??l??e',
          ja: '??????????????????: ?????????',
          cn: '???????????????????????????',
          ko: '????????????: ?????? ?????? ?????????',
        },
        ultros: {
          en: 'Ultros: Ink Spread',
          de: 'Ultros: Tine - Verteilen',
          fr: 'Orthros : Encre, dispersez-vous',
          ja: '???????????????: ????????? ??????',
          cn: '????????????????????????',
          ko: '???????????????: ?????? ??????',
        },
        virus: {
          en: 'VIRUS',
          de: 'VIRUS',
          fr: 'VIRUS',
          ja: '????????????',
          cn: '??????',
          ko: '????????????',
        },
      },
    },
    {
      id: 'O7S Run',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '276F', source: 'Guardian', capture: false }),
      infoText: (data, _matches, output) => {
        data.runCount = (data.runCount ?? 0) + 1;

        if (data.runCount === 1)
          return output.dada!();
        else if (data.runCount === 2)
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        else if (data.runCount === 3)
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
        else if (data.runCount === 4)
          return data.first === 'biblio' ? output.ultros!() : output.ships!();
        else if (data.runCount === 5)
          return output.biblio!();
        else if (data.runCount === 6)
          return data.first === 'biblio' ? output.ships!() : output.ultros!();
      },
      outputStrings: {
        biblio: {
          en: 'Biblio Add',
          de: 'Biblio Add',
          fr: 'Add Biblio',
          ja: '??????: ??????????????????',
          cn: '????????????',
          ko: '???????????? ??????',
        },
        dada: {
          en: 'Dada Add',
          de: 'Dada Add',
          fr: 'Add Dada',
          ja: '??????: ???????????????',
          cn: '????????????',
          ko: '???????????? ??????',
        },
        ships: {
          en: 'Ship Add',
          de: 'Flieger Add',
          fr: 'Add Vaisseau',
          ja: '??????: ??????????????????',
          cn: '????????????',
          ko: '???????????? ??????',
        },
        ultros: {
          en: 'Ultros Add',
          de: 'Ultros Add',
          fr: 'Add Orthros',
          ja: '??????: ???????????????',
          cn: '????????????',
          ko: '??????????????? ??????',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Fire Control System': 'Feuerleitsystem',
        'Guardian': 'W??chter',
        'Ultros': 'Ultros',
        'WEAPON SYSTEMS ONLINE': 'Feuerkontrollsystem aktiviert',
      },
      'replaceText': {
        'Aether Rot': '??therf??ule',
        'Arm And Hammer': 'Arm-Hammer',
        'Atomic Ray': 'Atomstrahlung',
        'Aura Cannon': 'Aura-Kanone',
        'Biblio': 'Bibliotaph',
        'Bomb Deployment': 'Bombeneinsatz',
        'Chain Cannon': 'Kettenkanone',
        'Chakra Burst': 'Chakra-Ausbruch',
        'Copy(?! Program)': 'Kopieren:',
        'Dada': 'Dadarma',
        'Demon Simulation': 'D??monensimulation',
        'Diffractive Laser': 'Diffusionslaser',
        'Diffractive Plasma': 'Diffusionsplasma',
        'Ink': 'Tinte',
        'Interrupt Stoneskin': 'Steinhaut unterbrechen',
        'Load': 'Laden:',
        'Magitek Ray': 'Magitek-Laser',
        'Magnetism': 'Magnetismus',
        'Main Cannon': 'Hauptkanone',
        'Missile Simulation': 'Raketensimulation',
        'Paste(?! Program)': 'Einf??gen:',
        'Plane Laser': 'Luftwaffe Add Laser',
        'Prey': 'Beute',
        'Radar': 'Radar',
        'Repel': 'Absto??ung',
        'Run(?! Program)': 'Start:',
        'Shockwave': 'Schockwelle',
        'Skip(?! Program)': '??berspringen:',
        'Temporary Misdirection': 'Pl??tzliche Panik',
        'Tentacle(?! )': 'Tentakel',
        'Tentacle Simulation': 'Tentakelsimulation',
        'Viral Weapon': 'Panikvirus',
        '(?<!\\w)Virus': 'Virus',
        'Wallop': 'Tentakelklatsche',
        'Air Force': 'Luftwaffe',
        'Ultros': 'Ultros',
        'Retrieve': 'Wiederherstellen:',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Dadaluma': 'Dadaluma',
        'Fire Control System': 'syst??me de contr??le',
        'Guardian': 'gardien',
        'Ultros': 'Orthros',
        'WEAPON SYSTEMS ONLINE': 'D??marrage du syst??me de contr??le',
      },
      'replaceText': {
        '\\?': ' ?',
        'Aether Rot': 'Pourriture ??th??r??enne',
        'Air Force': 'Force a??rienne',
        'Arm And Hammer': 'Marteau strat??gique',
        'Atomic Ray': 'Rayon atomique',
        'Aura Cannon': 'Rayon d\'aura',
        'Biblio': 'Bibliotaphe',
        'Bomb Deployment': 'D??ploiement de bombes',
        'Chain Cannon': 'Canon automatique',
        'Chakra Burst': 'Explosion d\'aura',
        'Copy': 'Copie',
        'Dada': 'Dadaluma',
        'Demon Simulation': 'Chargement : d??mon',
        'Diffractive Laser': 'Laser diffracteur',
        'Diffractive Plasma': 'Plasma diffracteur',
        'Ink': 'Encre',
        'Interrupt Stoneskin': 'Interrompre Cuirasse',
        'Load': 'Chargement',
        'Magitek Ray': 'Rayon magitek',
        'Magnetism': 'Magn??tisme',
        'Main Cannon': 'Canon principal',
        'Missile Simulation': 'Chargement : missiles',
        'Paste': 'Collage',
        'Plane Laser': 'Laser force a??rienne',
        'Prey': 'Proie',
        'Radar': 'Radar',
        'Repel': 'R??pulsion',
        'Retrieve': 'Programme Pr??c??dent',
        'Run': 'Programme',
        'Shockwave': 'Onde de choc',
        'Skip': 'Saut',
        'Temporary Misdirection': 'D??mence',
        'Tentacle(?! Simulation)': 'Tentacule',
        'Tentacle Simulation': 'Chargement : tentacule',
        'Ultros': 'Orthros',
        'Viral Weapon': 'Arme virologique',
        '(?<!\\w)Virus': 'Virus',
        'Wallop': 'Taloche tentaculaire',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Bibliotaph Simulation': '????????????????????????????????????',
        'Dadaluma Simulation': '?????????????????????????????????',
        'Fire Control System': '??????????????????????????????????????????',
        'Guardian': '??????????????????',
        'Ultros': '???????????????',
        'WEAPON SYSTEMS ONLINE': '????????????????????????????????????????????????',
      },
      'replaceText': {
        '\\(H\\)': '(??????)',
        'Aether Rot': '?????????????????????',
        'Air Force': '??????????????????',
        'Arm And Hammer': '?????????????????????',
        'Atomic Ray': '?????????????????????',
        'Aura Cannon': '?????????????????????',
        'Biblio': '??????????????????',
        'Bomb Deployment': '????????????',
        'Chain Cannon': '??????????????????',
        'Chakra Burst': '????????????????????????',
        'Copy(?! Program)': '?????????',
        'Dada': '???????????????',
        'Demon Simulation': '?????????????????????????????????',
        'Diffractive Laser': '??????????????????',
        'Diffractive Plasma': '??????????????????',
        'Ink': '???',
        'Interrupt Stoneskin': '??????: ?????????????????????',
        'Load': '??????????????????',
        'Magitek Ray': '??????????????????',
        'Magnetism': '??????',
        'Main Cannon': '??????????????????',
        'Missile Simulation': '?????????????????????????????????',
        'Paste(?! Program)': '????????????',
        'Plane Laser': '?????????????????? ?????????',
        'Prey': '?????????',
        'Radar': '????????????',
        'Repel': '??????',
        'Retrieve': '????????????',
        'Run(?! Program)': '?????????',
        'Shockwave': '?????????',
        'Skip(?! Program)': '????????????',
        'Temporary Misdirection': '????????????',
        'Tentacle(?! )': '????????????',
        'Tentacle Simulation': '?????????????????????????????????',
        'Ultros': '???????????????',
        'Viral Weapon': '??????????????????',
        '(?<!\\w)Virus': '????????????',
        'Wallop': '????????????',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Dadaluma': '????????????',
        'Fire Control System': '??????????????????',
        'Guardian': '?????????',
        'Ultros': '???????????????',
        'WEAPON SYSTEMS ONLINE': '????????????????????????',
      },
      'replaceText': {
        'Aether Rot': '????????????',
        'Arm And Hammer': '??????',
        'Atomic Ray': '????????????',
        'Aura Cannon': '?????????',
        'Biblio': '????????????',
        'Bomb Deployment': '????????????',
        'Chain Cannon': '???????????????',
        'Chakra Burst': '????????????',
        'Copy(?! Program)': '??????',
        'Dada': '????????????',
        'Demon Simulation': '????????????????????????',
        'Diffractive Laser': '????????????',
        'Diffractive Plasma': '????????????',
        'Ink': '??????',
        'Interrupt Stoneskin': '????????????',
        'Load': '??????',
        'Magitek Ray': '????????????',
        'Magnetism': '??????',
        'Main Cannon': '????????????',
        'Missile Simulation': '????????????????????????',
        'Paste(?! Program)': '??????',
        'Plane Laser': '????????????',
        'Prey': '??????',
        'Radar': '??????',
        'Repel': '??????',
        'Retrieve Air Force': '????????????',
        'Retrieve Ultros': '??????????????????',
        'Run(?! Program)': '???',
        'Shockwave': '?????????',
        'Skip(?! Program)': '??????',
        'Temporary Misdirection': '????????????',
        'Tentacle(?! )': '??????',
        'Tentacle Simulation': '????????????????????????',
        'Viral Weapon': '????????????',
        '(?<!\\w)Virus': '??????',
        'Wallop': '??????',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Dadaluma': '????????????',
        'Fire Control System': '?????? ?????? ?????????',
        'Guardian': '?????????',
        'Ultros': '???????????????',
        'WEAPON SYSTEMS ONLINE': '?????? ?????? ????????? ????????????',
      },
      'replaceText': {
        '\\(H\\)': '(??????)',
        '\\(DPS\\)': '(??????)',
        'Aether Rot': '????????? ??????',
        'Air Force': '????????????',
        'Arm And Hammer': '?????? ????????????',
        'Atomic Ray': '?????? ??????',
        'Aura Cannon': '?????? ??????',
        'Biblio': '????????????',
        'Bomb Deployment': '?????? ??????',
        'Chain Cannon': '?????????',
        'Chakra Burst': '????????? ??????',
        'Copy(?! Program)': '??????',
        'Dada': '??????',
        'Demon Simulation': '????????????: ??????',
        'Diffractive Laser': '?????? ?????????',
        'Diffractive Plasma': '?????? ????????????',
        'Ink': '??????',
        'Interrupt Stoneskin': '???????????? ????????????',
        'Load': '????????????',
        'Magitek Ray': '?????? ?????????',
        'Magnetism': '??????',
        'Main Cannon': '??????',
        'Missile Simulation': '????????????: ?????????',
        'Paste(?! Program)': '????????????',
        'Plane Laser': '???????????? ?????????',
        'Prey': '??????',
        'Radar': '?????????',
        'Repel': '??????',
        'Run(?! Program)': '?????????',
        'Shockwave': '?????????',
        'Skip(?! Program)': '????????????',
        'Temporary Misdirection': '????????????',
        'Tentacle(?! )': '?????????',
        'Tentacle Simulation': '????????????: ?????????',
        'Retrieve Ultros': '?????? ????????????: ???????????????',
        'Viral Weapon': '???????????? ??????',
        '(?<!\\w)Virus': '????????????',
        'Wallop': '??????',
      },
    },
  ],
};

export default triggerSet;
