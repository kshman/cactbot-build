import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  decOffset?: number;
  pathogenicCellsNumber?: number;
  pathogenicCellsDelay?: number;
  secondExocleavers?: boolean;
  aetheronecrosisDuration: number;
  predationCount: number;
  predationDebuff?: string;
}

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
// The first 1B marker in the encounter is an Unholy Darkness stack marker (013E).
const firstHeadmarker = parseInt('013E', 16);
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 013E.
  // (This makes the offset 0, and !0 is true.)
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AbyssosTheSixthCircleSavage,
  timelineFile: 'p6s.txt',
  initData: () => {
    return {
      aetheronecrosisDuration: 0,
      predationCount: 0,
    };
  },
  triggers: [
    {
      id: 'P6S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => {
        getHeadmarkerId(data, matches);
      },
    },
    {
      id: 'P6S Hemitheos\'s Dark IV',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7860', source: 'Hegemone', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'P6S Chelic Synergy',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '788A', source: 'Hegemone' }),
      response: Responses.sharedOrInvinTankBuster(),
    },
    {
      id: 'P6S Synergy',
      type: 'StartsUsing',
      // There are 7889 individual starts using casts on the two tanks as well,
      // if this trigger wanted to be more complicated.
      netRegex: NetRegexes.startsUsing({ id: '7887', source: 'Hegemone', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '따로 따로 탱크버스터',
          de: 'Geteilter Tankbuster',
          fr: 'Séparez les Tankbusters',
        },
      },
    },
    {
      id: 'P6S Exocleaver Healer Groups',
      // Unholy Darkness stack headmarkers are same time as first Exocleaver
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7869', '786B'], source: 'Hegemone', capture: false }),
      condition: (data) => !data.secondExocleavers,
      alertText: (_data, _matches, output) => output.healerGroups!(),
      run: (data) => data.secondExocleavers = true,
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'P6S Exocleaver Move',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['7869', '786B'], source: 'Hegemone', capture: false }),
      // Supress until after second Exocleaver in the set
      suppressSeconds: 4,
      response: Responses.moveAway(),
    },
    {
      id: 'P6S Choros Ixou Front Back',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7883', source: 'Hegemone', capture: false }),
      response: Responses.goFrontBack(),
    },
    {
      id: 'P6S Choros Ixou Sides',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7881', source: 'Hegemone', capture: false }),
      response: Responses.goSides(),
    },
    {
      id: 'P6S Pathogenic Cells Numbers',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: (data, matches) => {
        return data.me === matches.target && (/00(?:4F|5[0-6])/).test(getHeadmarkerId(data, matches));
      },
      preRun: (data, matches) => {
        const correctedMatch = getHeadmarkerId(data, matches);
        const pathogenicCellsNumberMap: { [id: string]: number } = {
          '004F': 1,
          '0050': 2,
          '0051': 3,
          '0052': 4,
          '0053': 5,
          '0054': 6,
          '0055': 7,
          '0056': 8,
        };
        data.pathogenicCellsNumber = pathogenicCellsNumberMap[correctedMatch];

        const pathogenicCellsDelayMap: { [id: string]: number } = {
          '004F': 8.6,
          '0050': 10.6,
          '0051': 12.5,
          '0052': 14.4,
          '0053': 16.4,
          '0054': 18.3,
          '0055': 20.2,
          '0056': 22.2,
        };
        data.pathogenicCellsDelay = pathogenicCellsDelayMap[correctedMatch];
      },
      durationSeconds: (data) => {
        // Because people are very forgetful,
        // show the number until you are done.
        return data.pathogenicCellsDelay;
      },
      infoText: (data, _matches, output) => output.text!({ num: data.pathogenicCellsNumber }),
      outputStrings: {
        text: {
          en: '주사위 ${num}번',
          de: '#${num}',
          fr: '#${num}',
          ja: '${num}番',
          cn: '#${num}',
          ko: '${num}번째',
        },
      },
    },
    {
      id: 'P6S Exchange of Agonies Markers',
      type: 'HeadMarker',
      netRegex: NetRegexes.headMarker({}),
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        const correctedMatch = getHeadmarkerId(data, matches);
        switch (correctedMatch) {
          case '0163': // stack
          case '0167': // spread exchanged to stack
          case '0169': // donut exchanged to stack
            return output.stackOnYou!();
          case '0164': // spread
          case '0165': // stack exchanged to spread
          case '016A': // donut exchanged to spread
            return output.spreadCorner!();
          case '0166': // stack exchanged to donut
          case '0168': // spread exchanged to donut
          case '016E': // donut
            return output.donut!();
        }
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        donut: {
          en: '도넛! 뭉쳐욧!',
          de: 'Sammeln Donut',
          fr: 'Packez-vous, donut',
          ja: '頭割り',
          cn: '集合放月环',
          ko: '도넛 장판, 쉐어',
        },
        spreadCorner: {
          en: '구석으로 가욧!',
          de: 'In Ecken Verteilen',
          fr: 'Écartez-vous dans le coin',
          ja: 'コーナーへ',
        },
      },
    },
    {
      id: 'P6S Dark Dome Bait',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '788B', source: 'Hegemone', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '돔 장판 유도예욧!',
          de: 'Kreise ködern',
          fr: 'Attirez les cercles',
        },
      },
    },
    {
      id: 'P6S Dark Dome Move',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '788B', source: 'Hegemone', capture: false }),
      response: Responses.moveAway(),
    },
    {
      id: 'P6S Predation Debuff Collect',
      // CF7 Glossal Resistance Down (Snake Icon)
      // CF8 Chelic Resistance Down (Wing Icon)
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: ['CF7', 'CF8'] }),
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.predationDebuff = matches.effectId,
    },
    {
      id: 'P6S Predation Bait Order',
      // Using Aetheronecrosis (CF9)
      // These come out as 20s, 16s, 12s, or 8s
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CF9' }),
      condition: Conditions.targetIsYou(),
      preRun: (data, matches) => data.aetheronecrosisDuration = parseFloat(matches.duration),
      delaySeconds: 0.1,
      durationSeconds: (_data, matches) => {
        const duration = parseFloat(matches.duration);
        // First Dual Predation is 3.7s before expiration
        // Remaining Dual Predations are 12.3s (second), 12.4s (third/fourth)
        return duration > 16 ? duration - 3.8 : duration + 12.3;
      },
      infoText: (data, matches, output) => {
        const duration = parseFloat(matches.duration);
        const dir = data.predationDebuff === 'CF7' ? output.left!() : output.right!();
        let numBait;

        // Allow for slight variation in duration
        if (duration <= 8) {
          numBait = output.secondBait!();
        } else if (duration <= 12) {
          numBait = output.thirdBait!();
        } else if (duration <= 16) {
          numBait = output.fourthBait!();
        } else {
          // 20s
          numBait = output.firstBait!();
        }

        return output.text!({ dir: dir, bait: numBait });
      },
      outputStrings: {
        text: {
          en: '${dir}, ${bait}',
        },
        left: {
          en: '왼쪽 (날개)',
        },
        right: {
          en: '오른쪽 (뱀)',
        },
        firstBait: {
          en: '첫번째/20초',
        },
        secondBait: {
          en: '두번째/8초',
        },
        thirdBait: {
          en: '세번째/12초',
        },
        fourthBait: {
          en: '네번째/16초',
        },
      },
    },
    {
      id: 'P6S Predation In First Bait Reminder',
      // Using Dual Predation (7878)
      // Delayed to give roughly same notice interval as other bait reminders
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7878', source: 'Hegemone' }),
      condition: (data) => data.aetheronecrosisDuration > 16,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 4,
      infoText: (_data, _matches, output) => output.inFirstBait!(),
      outputStrings: {
        inFirstBait: {
          en: '안으로, 첫번째예욧',
        },
      },
    },
    {
      id: 'P6S Predation In Bait Reminder',
      // Using Chelic Predation (787B) and Glossal Predation (787A)
      // Player could get hit at wrong time and still get this trigger
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['787A', '787B'], source: 'Hegemone', capture: false }),
      durationSeconds: 4,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        data.predationCount = data.predationCount + 1;
        let countMap;

        // Allow for slight variation in duration
        if (data.aetheronecrosisDuration <= 8) {
          countMap = 1;
        } else if (data.aetheronecrosisDuration <= 12) {
          countMap = 2;
        } else if (data.aetheronecrosisDuration <= 16) {
          countMap = 3;
        } else {
          // 20s
          countMap = 0;
        }

        // Output for in players
        if (countMap === data.predationCount) {
          const inBaitMap: { [duration: number]: string } = {
            1: output.inSecondBait!(),
            2: output.inThirdBait!(),
            3: output.inFourthBait!(),
          };
          return inBaitMap[data.predationCount];
        }
      },
      outputStrings: {
        inSecondBait: {
          en: '안으로, 두번째예욧',
        },
        inThirdBait: {
          en: '안으로, 세번째예욧',
        },
        inFourthBait: {
          en: '안으로, 마지막이예욧',
        },
      },
    },
    {
      id: 'P6S Predation Out',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: ['787A', '787B'], source: 'Hegemone' }),
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.out!(),
      outputStrings: {
        out: Outputs.out,
      },
    },
    {
      id: 'P6S Ptera Ixou',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '787C', source: 'Hegemone', capture: false }),
      infoText: (data, _matches, output) => data.predationDebuff === 'CF7' ? output.left!() : output.right!(),
      outputStrings: {
        left: {
          en: '왼쪽 (날개)',
        },
        right: {
          en: '오른쪽 (뱀)',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Hegemone': 'Hegemone',
        'Parasitos': 'Parasit',
      },
      'replaceText': {
        'Aetherial Exchange': 'Ätherwechsel',
        'Aetheric Polyominoid': 'Äther-Polyomino',
        'Aetheronecrosis': 'Explozelle',
        'Cachexia': 'Cachexia',
        'Chelic Claw': 'Chelische Kralle',
        'Choros Ixou': 'Choros Ixou',
        'Dark Ashes': 'Dunkle Asche',
        'Dark Dome': 'Dunkles Gewölbe',
        'Dark Sphere': 'Dunkle Kugel',
        'Dual Predation': 'Doppelte Prädation',
        'Exchange Of Agonies': 'Wechselschub',
        'Exocleaver': 'Exospalter',
        'Hemitheos\'s Dark IV': 'Hemitheisches Nachtka',
        'Pathogenic Cells': 'Pathogene Zellen',
        'Polyominoid Sigma': 'Äther-Polyomino Σ',
        'Polyominous Dark IV': 'Neka-Polyomino',
        '(?<!Dual )Predation': 'Prädation',
        'Ptera Ixou': 'Ptera Ixou',
        'Reek Havoc': 'Gasausstoß',
        'Synergy': 'Synergie',
        'Transmission': 'Parasitismus',
        'Unholy Darkness': 'Unheiliges Dunkel',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Hegemone': 'Hégémone',
        'Parasitos': 'créature parasite',
      },
      'replaceText': {
        'Aetherial Exchange': 'Changement éthéréen',
        'Aetheric Polyominoid': 'Polyomino éthéré',
        'Chelic Claw': 'Griffe chélique',
        'Choros Ixou': 'Choros Ixou',
        'Dark Ashes': 'Cendres ténébreuses',
        'Dark Dome': 'Dôme ténébreux',
        'Dark Sphere': 'Sphère sombre',
        'Exocleaver': 'Exo-couperet',
        'Hemitheos\'s Dark IV': 'Giga Ténèbres d\'hémithéos',
        'Pathogenic Cells': 'Souffle de cellules parasites',
        'Polyominoid Sigma': 'Polyomino éthéré Σ',
        'Polyominous Dark IV': 'Polyomino Giga Ténèbres',
        'Reek Havoc': 'Exhalaison',
        'Synergy': 'Synergie',
        'Transmission': 'Parasitage',
        'Unholy Darkness': 'Miracle ténébreux',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Hegemone': 'ヘーゲモネー',
        'Parasitos': '寄生生物',
      },
      'replaceText': {
        'Aetherial Exchange': 'エーテルチェンジ',
        'Aetheric Polyominoid': 'エーテル・ポリオミノ',
        'Chelic Claw': '爪撃',
        'Choros Ixou': 'ホロス・イクソス',
        'Dark Ashes': 'ダークアッシュ',
        'Dark Dome': 'ダークドーム',
        'Dark Sphere': 'ダークスフィア',
        'Exocleaver': 'エクソークリーバー',
        'Hemitheos\'s Dark IV': 'ヘーミテオス・ダージャ',
        'Pathogenic Cells': '軟体細胞流',
        'Polyominoid Sigma': 'エーテル・ポリオミノΣ',
        'Polyominous Dark IV': 'ダージャ・ポリオミノ',
        'Reek Havoc': '噴気',
        'Synergy': 'シュネルギア',
        'Transmission': '寄生',
        'Unholy Darkness': 'ダークホーリー',
      },
    },
  ],
};

export default triggerSet;