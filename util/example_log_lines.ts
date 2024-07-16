// Contains example log lines used for LogGuide.md.
// Use `npm run generate-log-guide` after updating this file.
// Also make sure to add unit tests in /test/helper/example_log_lines_test_data.ts.

// cactbot-ignore-all-missing-translations

import { Lang } from '../resources/languages';
import { LogDefinitionName } from '../resources/netlog_defs';
import NetRegexes from '../resources/netregexes';
import Regexes from '../resources/regexes';

// Exclude these types since examples are not included in LogGuide.md, and we
// don't specifically unit test them.
type ExcludedLineName =
  | 'None'
  // | 'NetworkAOEAbility' - not included in LogGuide.md, but we do unit test it.
  | 'NetworkWorld'
  | 'ParserInfo'
  | 'ProcessInfo'
  | 'Debug'
  | 'PacketDump'
  | 'Version'
  | 'Error';

export type ExampleLineName = Exclude<LogDefinitionName, ExcludedLineName>;

export type ExampleRegex<T> = {
  network: T;
  logLine: T;
};

type LangStrings =
  & {
    en: readonly string[];
  }
  & {
    [lang in Exclude<Lang, 'en'>]?: readonly string[];
  };

export type ExampleLineDef = {
  // regexes is optional: LogGuide.md will build default regexes if not provided.
  regexes?: Partial<ExampleRegex<string>>;
  examples: LangStrings;
};

type ExampleLines = {
  [T in ExampleLineName]: ExampleLineDef;
};

const exampleLogLines = {
  GameLog: {
    regexes: {
      network: NetRegexes.gameLog({ capture: true }).source,
      logLine: Regexes.gameLog({ capture: true }).source,
    },
    examples: {
      en: [
        '00|2021-04-26T14:12:30.0000000-04:00|0839||You change to warrior.|d8c450105ea12854e26eb687579564df',
        '00|2021-04-26T16:57:41.0000000-04:00|0840||You can now summon the antelope stag mount.|caa3526e9f127887766e9211e87e0e8f',
        '00|2021-04-26T14:17:11.0000000-04:00|0B3A||You defeat the embodiment.|ef3b7b7f1e980f2c08e903edd51c70c7',
        '00|2021-04-26T14:12:30.0000000-04:00|302B||The gravity node uses Forked Lightning.|45d50c5f5322adf787db2bd00d85493d',
        '00|2021-04-26T14:12:30.0000000-04:00|322A||The attack misses.|f9f57724eb396a6a94232e9159175e8c',
        '00|2021-07-05T18:01:21.0000000-04:00|0044|Tsukuyomi|Oh...it\'s going to be a long night.|1a81d186fd4d19255f2e01a1694c7607',
        '00|2020-02-26T18:59:23.0000000-08:00|0038||cactbot wipe|77364412c17033eb8c87dafe7ce3c665',
        '00|2020-03-10T18:29:02.0000000-07:00|001D|Tini Poutini|Tini Poutini straightens her spectacles for you.|05ca458b4d400d1f878d3c420f962b99',
      ],
    },
  },
  ChangeZone: {
    regexes: {
      network: NetRegexes.changeZone({ capture: true }).source,
      logLine: Regexes.changeZone({ capture: true }).source,
    },
    examples: {
      en: [
        '01|2021-04-26T14:13:17.9930000-04:00|326|Kugane Ohashi|b9f401c0aa0b8bc454b239b201abc1b8',
        '01|2021-04-26T14:22:04.5490000-04:00|31F|Alphascape (V2.0)|8299b97fa36500118fc3a174ed208fe4',
      ],
    },
  },
  ChangedPlayer: {
    examples: {
      en: [
        '02|2021-04-26T14:11:31.0200000-04:00|10FF0001|Tini Poutini|5b0a5800460045f29db38676e0c3f79a',
        '02|2021-04-26T14:13:17.9930000-04:00|10FF0002|Potato Chippy|34b657d75218545f5a49970cce218ce6',
      ],
    },
  },
  AddedCombatant: {
    regexes: {
      network: NetRegexes.addedCombatant({ capture: true }).source,
      logLine: Regexes.addedCombatant({ capture: true }).source,
    },
    examples: {
      en: [
        '03|2021-06-16T20:46:38.5450000-07:00|10FF0001|Tini Poutini|24|46|0000|28|Jenova|0|0|30460|30460|10000|10000|0|0|-0.76|15.896|0|-3.141593|c0e6f1c201e7285884fb6bf107c533ee',
        '03|2021-06-16T21:35:11.3060000-07:00|4000B364|Catastrophe|00|46|0000|00||5631|6358|57250|57250|0|10000|0|0|0|0|0|-4.792213E-05|9c22c852e1995ed63ff4b71c09b7d1a7',
        '03|2021-06-16T21:35:11.3060000-07:00|4000B363|Catastrophe|00|46|0000|00||5631|6358|57250|57250|0|10000|0|0|0|0|0|-4.792213E-05|9438b02195d9b785e07383bc84b2bf37',
        '03|2021-06-16T21:35:11.3060000-07:00|4000B362|Catastrophe|00|46|0000|00||5631|7305|13165210|13165210|10000|10000|0|0|0|-15|0|-4.792213E-05|1c4bc8f27640fab6897dc90c02bba79d',
        '03|2021-06-16T21:35:11.4020000-07:00|4000B365|Catastrophe|00|46|0000|00||5631|6358|57250|57250|0|10000|0|0|0|0|0|-4.792213E-05|8b3f6cf1939428dd9ab0a319aba44910',
        '03|2021-06-16T21:35:11.4020000-07:00|4000B36a|Catastrophe|00|46|0000|00||5631|6358|57250|57250|0|10000|0|0|0|0|0|-4.792213E-05|b3b3b4f926bcadd8b6ef008232d58922',
      ],
    },
  },
  RemovedCombatant: {
    regexes: {
      network: NetRegexes.removingCombatant({ capture: true }).source,
      logLine: Regexes.removingCombatant({ capture: true }).source,
    },
    examples: {
      en: [
        '04|2021-07-23T23:01:27.5480000-07:00|10FF0001|Tini Poutini|05|1E|0000|35|Jenova|0|0|816|816|10000|10000|0|0|-66.24337|-292.0904|20.06466|1.789943|4fbfc851937873eacf94f1f69e0e2ba9',
        '04|2021-06-16T21:37:36.0740000-07:00|4000B39C|Petrosphere|00|46|0000|00||6712|7308|0|57250|0|10000|0|0|-16.00671|-0.01531982|0|1.53875|980552ad636f06249f1b5c7a6e675aad',
      ],
    },
  },
  PartyList: {
    examples: {
      en: [
        '11|2021-06-16T20:46:38.5450000-07:00|8|10FF0002|10FF0003|10FF0004|10FF0001|10FF0005|10FF0006|10FF0007|10FF0008|',
        '11|2021-06-16T21:47:56.7170000-07:00|4|10FF0002|10FF0001|10FF0003|10FF0004|',
      ],
    },
  },
  PlayerStats: {
    regexes: {
      network: NetRegexes.statChange({ capture: true }).source,
      logLine: Regexes.statChange({ capture: true }).source,
    },
    examples: {
      en: [
        '12|2021-04-26T14:30:07.4910000-04:00|21|5456|326|6259|135|186|340|5456|380|3863|135|186|2628|1530|380|0|1260|4000174AE14AB6|3c03ce9ee4afccfaae74695376047054',
        '12|2021-04-26T14:31:25.5080000-04:00|24|189|360|5610|356|5549|1431|189|1340|3651|5549|5549|1661|380|1547|0|380|4000174AE14AB6|53b98d383806c5a29dfe33720f514288',
        '12|2021-08-06T10:29:35.3400000-04:00|38|308|4272|4443|288|271|340|4272|1210|2655|288|271|2002|1192|380|0|380|4000174AE14AB6|4ce3eac3dbd0eb1d6e0044425d9e091d',
      ],
    },
  },
  StartsUsing: {
    regexes: {
      network: NetRegexes.startsUsing({ capture: true }).source,
      logLine: Regexes.startsUsing({ capture: true }).source,
    },
    examples: {
      en: [
        '20|2021-07-27T12:47:23.1740000-04:00|40024FC4|The Manipulator|F63|Carnage|40024FC4|The Manipulator|4.70|-0.01531982|-13.86256|10.59466|-4.792213E-05|488abf3044202807c62fa32c2e36ee81',
        '20|2021-07-27T12:48:33.5420000-04:00|10FF0001|Tini Poutini|DF0|Stone III|40024FC4|The Manipulator|2.35|-0.06491255|-9.72675|10.54466|-3.141591|2a24845eab5ed48d4f043f7b6269ef70',
        '20|2021-07-27T12:48:36.0460000-04:00|10FF0002|Potato Chippy|BA|Succor|10FF0002|Potato Chippy|1.93|-0.7477417|-5.416992|10.54466|2.604979|99a70e6f12f3fcb012e59b3f098fd69b',
        '20|2021-07-27T12:48:29.7830000-04:00|40024FD0|The Manipulator|13BE|Judgment Nisi|10FF0001|Tini Poutini|3.20|8.055649|-17.03842|10.58736|-4.792213E-05|bc1c3d72782de2199bfa90637dbfa9b8',
        '20|2021-07-27T12:48:36.1310000-04:00|40024FCE|The Manipulator|13D0|Seed Of The Sky|E0000000||2.70|8.055649|-17.03842|10.58736|-4.792213E-05|5377da9551e7ca470709dc08e996bb75',
      ],
    },
  },
  Ability: {
    regexes: {
      network: NetRegexes.ability({ capture: true }).source,
      logLine: Regexes.ability({ capture: true }).source,
    },
    examples: {
      en: [
        '21|2021-07-27T12:48:22.4630000-04:00|40024FD1|Steam Bit|F67|Aetherochemical Laser|10FF0001|Tini Poutini|750003|4620000|1B|F678000|0|0|0|0|0|0|0|0|0|0|0|0|36022|36022|5200|10000|0|1000|1.846313|-12.31409|10.60608|-2.264526|16000|16000|8840|10000|0|1000|-9.079163|-14.02307|18.7095|1.416605|0000DE1F|0|1|5d60825d70bb46d7fcc8fc0339849e8e',
        '21|2021-07-27T12:46:22.9530000-04:00|10FF0002|Potato Chippy|07|Attack|40024FC5|Right Foreleg|710003|3910000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|378341|380640|8840|10000|0|1000|-6.37015|-7.477235|10.54466|0.02791069|26396|26396|10000|10000|0|1000|-5.443688|-1.163282|10.54466|-2.9113|0000DB6E|0|1|58206bdd1d0bd8d70f27f3fb2523912b',
        '21|2021-07-27T12:46:21.5820000-04:00|10FF0001|Tini Poutini|03|Sprint|10FF0001|Tini Poutini|1E00000E|320000|0|0|0|0|0|0|0|0|0|0|0|0|0|0|19053|26706|10000|10000|0|1000|-1.210526|17.15058|10.69944|-2.88047|19053|26706|10000|10000|0|1000|-1.210526|17.15058|10.69944|-2.88047|0000DB68|0|1|29301d52854712315e0951abff146adc',
        '21|2021-07-27T12:47:28.4670000-04:00|40025026|Steam Bit|F6F|Laser Absorption|40024FC4|The Manipulator|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|685814|872320|8840|10000|0|1000|-0.01531982|-13.86256|10.59466|-4.792213E-05|16000|16000|8840|10000|0|1000|0|22.5|10.64999|-3.141593|0000DCEC|0|1|0f3be60aec05333aae73a042edb7edb4',
        '21|2021-07-27T12:48:39.1260000-04:00|40024FCE|The Manipulator|13D0|Seed Of The Sky|E0000000||0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|0|||||||||||16000|16000|8840|10000|0|1000|8.055649|-17.03842|10.58736|-4.792213E-05|0000DE92|0|1|ca5594611cf4ca4e276f64f2cfba5ffa',
      ],
    },
  },
  // Note: `NetworkAOEAbility` examples are not included in LogGuide.md because they have the same
  // structure as `Ability`, but they are included here for unit testing.
  NetworkAOEAbility: {
    examples: {
      en: [
        '22|2024-06-07T15:35:31.6490000-07:00|4004DA6A|Hulder|69C1|Lay of Mislaid Memory|10FF0001|Tini Poutini|750003|36C60000|1001E0E|6FD0000|4100000E|AFA0000|1B|69C18000|0|0|0|0|0|0|0|0|56269|56269|10000|10000|||412.38|-642.76|168.66|-2.85|5642456|11048472|10000|10000|||410.42|-650.11|170.72|-0.51|00346744|5|17|6ac9f2ba4e359b93',
        '22|2024-06-09T08:19:23.0170000-07:00|400D8D19|Demi-Phoenix|4085|Everlasting Flight|10FF0002|Potato Chippy|D1050E|74C0000|1B|40858000|0|0|0|0|0|0|0|0|0|0|0|0|120871|120871|10000|10000|||77.07|376.12|-1.60|2.76|73688|73688|10000|10000|||90.42|373.92|-1.60|-1.76|00ADE8DA|3|4|ae450d05eb2a216a',
      ],
    },
  },
  NetworkCancelAbility: {
    examples: {
      en: [
        '23|2021-07-27T13:04:38.7790000-04:00|10FF0002|Potato Chippy|408D|Veraero II|Cancelled|dbce3801c08020cb8ae7da9102034131',
        '23|2021-07-27T13:04:39.0930000-04:00|40000132|Garm|D10|The Dragon\'s Voice|Interrupted|bd936fde66bab0e8cf2874ebd75df77c',
        '23|2021-07-27T13:04:39.1370000-04:00|4000012F||D52|Unknown_D52|Cancelled|8a15bad31745426d65cc13b8e0d50005',
      ],
    },
  },
  NetworkDoT: {
    regexes: {
      network: NetRegexes.networkDoT({ capture: true }).source,
      logLine: Regexes.networkDoT({ capture: true }).source,
    },
    examples: {
      en: [
        '24|2022-07-07T21:59:30.6210000-07:00|10FF0001|Tini Poutini|DoT|3C0|9920|32134|63300|10000|10000|||90.44|87.60|0.00|-3.07|4000F123|Shikigami of the Pyre|5|7328307|7439000|10000|10000|||99.78|104.81|0.00|2.95|549a72f2e53a9dea',
        '24|2023-07-05T20:05:54.6070000-07:00|10FF0006|French Fry|HoT|0|2824|91002|91002|10000|10000|||97.46|101.98|0.00|3.13|10FF0007|Mimite Mite|0|81541|81541|9600|10000|||100.04|110.55|0.00|-3.08|1ea68a0cb73843c7bb51808eeb8e80f8',
        '24|2023-07-05T20:05:55.9400000-07:00|4001AAAF|Pandæmonium|DoT|0|1D1B|43502881|43656896|10000|10000|||100.00|65.00|0.00|0.00|10FF0003|Papas Fritas|FFFFFFFF|77094|77094|9200|10000|||100.16|99.85|0.00|-2.84|5b77b8e553b0ee5797caa1ab87b5a910',
      ],
    },
  },
  WasDefeated: {
    regexes: {
      network: NetRegexes.wasDefeated({ capture: true }).source,
      logLine: Regexes.wasDefeated({ capture: true }).source,
    },
    examples: {
      en: [
        '25|2021-07-27T13:11:08.6990000-04:00|10FF0002|Potato Chippy|4000016E|Angra Mainyu|fd3760add061a5d2e23f63003cd7101d',
        '25|2021-07-27T13:11:09.4110000-04:00|10FF0001|Tini Poutini|4000016E|Angra Mainyu|933d5e946659aa9cc493079d4f6934b3',
        '25|2021-07-27T13:11:11.6840000-04:00|4000016E|Angra Mainyu|10FF0002|Potato Chippy|0b79669140c20f9aa92ad5559be75022',
        '25|2021-07-27T13:13:10.6310000-04:00|400001D1|Queen Scylla|10FF0001|Tini Poutini|8798f2cb87c42fde4601258ae94ffb7f',
      ],
    },
  },
  GainsEffect: {
    regexes: {
      network: NetRegexes.gainsEffect({ capture: true }).source,
      logLine: Regexes.gainsEffect({ capture: true }).source,
    },
    examples: {
      en: [
        '26|2021-04-26T14:36:09.4340000-04:00|35|Physical Damage Up|15.00|400009D5|Dark General|400009D5|Dark General|00|48865|48865|cbcfac4df1554b8f59f343f017ebd793',
        '26|2021-04-26T14:23:38.7560000-04:00|13B|Whispering Dawn|21.00|4000B283|Selene|10FF0002|Potato Chippy|4000016E|00|51893|49487|c7400f0eed1fe9d29834369affc22d3b',
        '26|2021-07-02T21:57:07.9110000-04:00|D2|Doom|9.97|40003D9F||10FF0001|Tini Poutini|00|26396|26396|86ff6bf4cfdd68491274fce1db5677e8',
        '26|2020-04-24T10:00:03.1370000-08:00|8D1|Lightsteeped|39.95|E0000000||10FF0001|Tini Poutini|01|103650|||ba7a8b1ffce9f0f57974de250e9da307',
      ],
    },
  },
  HeadMarker: {
    regexes: {
      network: NetRegexes.headMarker({ capture: true }).source,
      logLine: Regexes.headMarker({ capture: true }).source,
    },
    examples: {
      en: [
        '27|2021-04-26T14:17:31.6980000-04:00|10FF0001|Tini Poutini|0000|A9B9|0057|0000|0000|0000|4fb326d8899ffbd4cbfeb29bbc3080f8',
        '27|2021-05-11T13:48:45.3370000-04:00|40000950|Copied Knave|0000|0000|0117|0000|0000|0000|fa2e93fccf397a41aac73a3a38aa7410',
      ],
    },
  },
  NetworkRaidMarker: {
    examples: {
      en: [
        '28|2021-04-26T19:04:39.1920000-04:00|Delete|7|10FF0001|Tini Poutini|0|0|0|b714a8b5b34ea60f8bf9f480508dc427',
        '28|2021-04-26T19:27:23.5340000-04:00|Add|4|10FF0001|Tini Poutini|76.073|110.588|0|bcf81fb146fe88230333bbfd649eb240',
      ],
    },
  },
  NetworkTargetMarker: {
    examples: {
      en: [
        '29|2021-06-10T20:15:15.1000000-04:00|Delete|0|10FF0001|Tini Poutini|4000641D||50460af5ff3f8ec9ad03e6953d3d1ba9',
        '29|2021-05-25T22:54:32.5660000-04:00|Add|6|10FF0001|Tini Poutini|10FF0002|Potato Chippy|70a8c8a728d09af83e0a486e8271cc57',
      ],
    },
  },
  LosesEffect: {
    regexes: {
      network: NetRegexes.losesEffect({ capture: true }).source,
      logLine: Regexes.losesEffect({ capture: true }).source,
    },
    examples: {
      en: [
        '30|2021-04-26T14:38:09.6990000-04:00|13A|Inferno|0.00|400009FF|Ifrit-Egi|400009FD|Scylla|00|941742|4933|19164478551c91375dc13d0998365130',
        '30|2021-04-26T14:37:12.8740000-04:00|77B|Summon Order|0.00|400009E8|Eos|400009E8|Eos|01|5810|5810|b1736ae2cf65864623f9779635c361cd',
        '30|2021-04-26T14:23:38.8440000-04:00|BD|Bio II|0.00|10FF0001|Tini Poutini|4000B262|Midgardsormr|00|10851737|51654|e34ec8d3a8db783fe34f152178775804',
      ],
    },
  },
  NetworkGauge: {
    examples: {
      en: [
        '31|2019-11-27T23:22:40.6960000-05:00|10FF0001|FA753019|FD37|E9A55201|7F47|f17ea56b26ff020d1c0580207f6f4673',
        '31|2021-04-28T00:26:19.1320000-04:00|10FF0002|BF000018|10035|40006600|00|f31bf7667388ce9b11bd5dd2626c7b99',
      ],
    },
  },
  ActorControl: {
    regexes: {
      network: NetRegexes.network6d({ capture: true }).source,
      logLine: Regexes.network6d({ capture: true }).source,
    },
    examples: {
      en: [
        '33|2021-04-26T17:23:28.6780000-04:00|80034E6C|4000000F|B5D|00|00|00|f777621829447c53c82c9a24aa25348f',
        '33|2021-04-26T14:17:31.6980000-04:00|80034E5B|8000000C|16|FFFFFFFF|00|00|b543f3c5c715e93d9de2aa65b8fe83ad',
        '33|2021-04-26T14:18:39.0120000-04:00|80034E5B|40000007|00|01|00|00|7a2b827bbc7a58ecc0c5edbdf14a2c14',
      ],
    },
  },
  NameToggle: {
    regexes: {
      network: NetRegexes.nameToggle({ capture: true }).source,
      logLine: NetRegexes.nameToggle({ capture: true }).source,
    },
    examples: {
      en: [
        '34|2021-04-26T14:19:48.0400000-04:00|4001C51C|Dragon\'s Head|4001C51C|Dragon\'s Head|00|a7248aab1da528bf94faf2f4b1728fc3',
        '34|2021-04-26T14:22:19.1960000-04:00|4000B283|Selene|4000B283|Selene|01|734eef0f5b1b10810af8f7257d738c67',
      ],
    },
  },
  Tether: {
    regexes: {
      network: NetRegexes.tether({ capture: true }).source,
      logLine: Regexes.tether({ capture: true }).source,
    },
    examples: {
      en: [
        '35|2021-04-26T17:27:07.0310000-04:00|40003202|Articulated Bit|10FF0001|Tini Poutini|0000|0000|0001|10029769|000F|0000|ad71d456437e6792f68b19dbef9507d5',
        '35|2021-04-27T22:36:58.1060000-04:00|10FF0001|Tini Poutini|4000943B|Bomb Boulder|0000|0000|0007|4000943B|000F|0000|a6adfcdf5dad0ef891deeade4d285eb2',
        '35|2021-06-13T17:41:34.2230000-04:00|10FF0001|Tini Poutini|10FF0002|Potato Chippy|0000|0000|006E|1068E3EF|000F|0000|c022382c6803d1d6c1f84681b7d8db20',
      ],
    },
  },
  LimitBreak: {
    examples: {
      en: [
        '36|2021-04-26T14:20:09.6880000-04:00|6A90|3|88ce578cb8f05d74feb3a7fa155bedc5',
        '36|2021-04-26T14:20:19.6580000-04:00|4E20|2|a3bf154ba550e147d4fbbd4266db4eb9',
        '36|2021-04-26T14:20:23.9040000-04:00|0000|0|703872b50849730773f7b21897698d00',
        '36|2021-04-26T14:22:03.8370000-04:00|0000|1|c85f02ac4780e208357383afb6cbc232',
      ],
    },
  },
  NetworkEffectResult: {
    examples: {
      en: [
        '37|2023-10-31T10:08:51.4080000-07:00|10FF0001|Tini Poutini|0000003A|117941|117941|10000|10000|0||-660.17|-842.23|29.75|-1.61|1500|0|0|01|5B|0|0|10755CA3|19aff167ea86b371',
        '37|2023-10-31T22:11:04.8350000-07:00|10FF0002|Potato Chippy|00005AE1|0|88095|0|10000|0||8.61|15.22|0.00|2.69|1E00|0|0|01|0400002C|0|0|E0000000|ef1e0399980c0f47',
        '37|2023-10-31T22:10:49.5860000-07:00|4000C5B2|Ketuduke|00005AD6|7452804||||||-0.02|-0.02|0.00|1.98|27ee18f38f377d5d',
      ],
    },
  },
  StatusEffect: {
    regexes: {
      network: NetRegexes.statusEffectExplicit({ capture: true }).source,
      logLine: Regexes.statusEffectExplicit({ capture: true }).source,
    },
    examples: {
      en: [
        '38|2021-04-26T14:13:16.2760000-04:00|10FF0001|Tini Poutini|46504615|75407|75407|10000|10000|24|0|-645.238|-802.7854|8|1.091302|1500|3C|0|0A016D|41F00000|E0000000|1E016C|41F00000|E0000000|c1b3e1d63f03a265ffa85f1517c1501e',
        '38|2021-04-26T14:13:16.2760000-04:00|10FF0001||46504621|49890|49890|10000|10000|24|0|||||1500|3C|0|f62dbda5c947fa4c11b63c90c6ee4cd9',
        '38|2021-04-26T14:13:44.5020000-04:00|10FF0002|Potato Chippy|46504621|52418|52418|10000|10000|32|0|99.93127|113.8475|-1.862645E-09|3.141593|200F|20|0|0A016D|41F00000|E0000000|1E016C|41F00000|E0000000|0345|41E8D4FC|10FF0001|0347|80000000|10FF0002|d57fd29c6c4856c091557968667da39d',
      ],
    },
  },
  NetworkUpdateHP: {
    examples: {
      en: [
        '39|2021-04-26T14:12:38.5160000-04:00|10FF0001|Tini Poutini|178669|191948|10000|10000|0|0|-648.3234|-804.5252|8.570148|1.010669|7ebe348673aa2a11e4036274becabc81',
        '39|2021-04-26T14:13:21.6370000-04:00|10592642|Senor Esteban|54792|54792|10000|10000|0|0|100.268|114.22|-1.837917E-09|3.141593|883da0db11a9c950eefdbcbc50e86eca',
        '39|2021-04-26T14:13:21.6370000-04:00|106F5D49|O\'ndanya Voupin|79075|79075|10000|10000|0|0|99.93127|114.2443|-1.862645E-09|-3.141593|8ed73ee57c4ab7159628584e2f4d5243',
      ],
    },
  },
  Map: {
    regexes: {
      network: NetRegexes.map({ capture: true }).source,
      logLine: Regexes.map({ capture: true }).source,
    },
    examples: {
      en: [
        '40|2021-07-30T19:43:08.6270000-07:00|578|Norvrandt|The Copied Factory|Upper Stratum|ee5b5fc06ab4610ef6b4f030fc95c90c',
        '40|2021-07-30T19:46:49.3830000-07:00|575|Norvrandt|Excavation Tunnels||41e6dae1ab1a3fe18ce3754d7c45a5d0',
        '40|2021-07-30T19:49:19.8180000-07:00|192|La Noscea|Mist|Mist Subdivision|f3506f063945500b5e7df2172e2ca4d3',
      ],
    },
  },
  SystemLogMessage: {
    regexes: {
      network: NetRegexes.systemLogMessage({ capture: true }).source,
      logLine: Regexes.systemLogMessage({ capture: true }).source,
    },
    examples: {
      en: [
        '41|2021-11-21T10:38:40.0660000-08:00|00|901|619A9200|00|3C|c6fcd8a8b198a5da28b9cfe6a3f544f4',
        '41|2021-11-21T10:50:13.5650000-08:00|8004001E|7DD|FF5FDA02|E1B|00|4eeb89399fce54820eb19e06b4d6d95a',
        '41|2021-11-21T10:55:06.7070000-08:00|8004001E|B3A|00|00|E0000000|1f600f85ec8d36d2b04d233e19f93d39',
      ],
    },
  },
  StatusList3: {
    examples: {
      en: [
        '42|2022-06-06T21:57:14.8920000+08:00|10FF0001|Tini Poutini|0A0168|41F00000|E0000000|14016A|41F00000|E0000000|29310030|44835452|10FF0001|4361fffcb50708dd',
        '42|2022-06-06T10:04:52.3370000-07:00|10FF0002|Potato Chippy|037F|0|E0000000|ee5bd3e5dbb46f59',
        '42|2022-06-06T10:09:06.2140000-07:00|10FF0002|Potato Chippy|0|0|0|f988f962f9c768e3',
      ],
    },
  },
  LineRegistration: {
    examples: {
      en: [
        '256|2022-10-02T10:15:31.5635165-07:00|257|OverlayPlugin|MapEffect|1|594b867ee2199369',
        '256|2022-10-02T10:15:31.5645159-07:00|258|OverlayPlugin|FateDirector|1|102a238b2495bfd0',
        '256|2022-10-02T10:15:31.5655143-07:00|259|OverlayPlugin|CEDirector|1|35546b48906c41b2',
      ],
    },
  },
  MapEffect: {
    regexes: {
      network: NetRegexes.mapEffect({ capture: true }).source,
      logLine: Regexes.mapEffect({ capture: true }).source,
    },
    examples: {
      en: [
        '257|2022-09-27T18:03:45.2834013-07:00|800375A9|00020001|09|F3|0000|de00c57494e85e79',
        '257|2022-09-27T18:06:07.7744035-07:00|800375A9|00400020|01|00|0000|72933fe583158786',
        '257|2022-09-29T20:07:48.7330170-07:00|800375A5|00020001|05|00|0000|28c0449a8d0efa7d',
      ],
    },
  },
  FateDirector: {
    examples: {
      en: [
        '258|2022-09-19T17:25:59.5582137-07:00|Add|E601|000000DE|00000000|00000000|00000000|00000000|00000000|00000000|c7fd9f9aa7f56d4d',
        '258|2022-08-13T19:46:54.6179420-04:00|Update|203A|00000287|00000000|00000000|00000000|00000000|00000000|6E756F63|bd60bac0189b571e',
        '258|2022-09-24T12:51:47.5867309-07:00|Remove|0000|000000E2|00000000|00000000|00000000|00000000|00000000|00007FF9|043b821dbfe608c5',
      ],
    },
  },
  CEDirector: {
    examples: {
      en: [
        '259|2022-09-19T18:09:35.7012951-07:00|632912D5|0000|0000|07|01|02|00|00|7F|00|00|4965d513cc7a6dd3',
        '259|2022-09-19T18:09:39.9541413-07:00|63291786|04B0|0000|07|01|03|00|00|00|00|00|6c18aa16678911ca',
        '259|2022-09-19T18:09:46.7556709-07:00|63291786|04AA|0000|07|01|03|00|02|7F|00|00|5bf224d56535513a',
      ],
    },
  },
  InCombat: {
    examples: {
      en: [
        '260|2023-01-03T10:17:15.8240000-08:00|0|0|1|1|7da9e0cfed11abfe',
        '260|2023-01-03T17:51:42.9680000-08:00|1|0|0|1|ae12d0898d923251',
        '260|2023-01-03T17:54:50.0680000-08:00|1|1|1|0|3ba06c97a4cbbf42',
      ],
    },
  },
  CombatantMemory: {
    examples: {
      en: [
        '261|2023-05-26T21:37:40.5600000-04:00|Add|40008953|BNpcID|3F5A|BNpcNameID|304E|CastTargetID|E0000000|CurrentMP|10000|CurrentWorldID|65535|Heading|-3.1416|Level|90|MaxHP|69200|MaxMP|10000|ModelStatus|18432|Name|Golbez\'s Shadow|NPCTargetID|E0000000|PosX|100.0000|PosY|100.0000|PosZ|0.0300|Radius|7.5000|Type|2|WorldID|65535|9d9028a8e087e4c3',
        '261|2023-05-26T21:39:41.2920000-04:00|Change|10001234|CurrentMP|2400|Heading|-2.3613|2f5ff0a91385050a',
        '261|2023-05-26T21:39:42.7380000-04:00|Remove|40008AA0|f4b30f181245b5da',
      ],
    },
  },
  RSVData: {
    examples: {
      en: [
        '262|2023-04-21T23:24:05.8320000-04:00|en|0000001C|_rsv_32789_-1_1_0_1_SE2DC5B04_EE2DC5B04|Run: ****mi* (Omega Version)|34159b6f2093e889',
        '262|2023-04-21T23:24:05.9210000-04:00|en|00000031|_rsv_3448_-1_1_1_0_S74CFC3B0_E74CFC3B0|Burning with dynamis inspired by Omega\'s passion.|ce9d03bb211d894f',
        '262|2023-04-21T23:24:06.0630000-04:00|en|00000051|_rsv_35827_-1_1_0_0_S13095D61_E13095D61|Further testing is required.�����, ���)������ ��, assist me with this evaluation.|38151741aad7fe51',
      ],
    },
  },
  // These examples are pairs of 263/264 lines showing the three cases
  StartsUsingExtra: {
    examples: {
      en: [
        // Case 1, no actual ground target info, so the values sent in the packet correspond
        // to the actor's position and heading
        '263|2023-11-02T20:53:52.1900000-04:00|10001234|0005|-98.697|-102.359|10.010|1.524|dd76513d3dd59f5a',
        // Case 2, no actual ground target info, but has a heading for some reason
        '263|2023-11-02T21:39:18.6200000-04:00|10001234|0085|-6.653|747.154|130.009|2.920|39e0326a5ee47b77',
        // Case 3, valid position and heading
        '263|2023-11-02T21:39:12.6940000-04:00|40000D6E|8C45|-14.344|748.558|130.009|-3.142|9c7e421d4e93de7c',
      ],
    },
  },
  AbilityExtra: {
    examples: {
      en: [
        // Case 1, because there was no ground target info and no heading,
        // the ability target info is blank
        '264|2023-11-02T20:53:56.6450000-04:00|10001234|0005|000003EF|0|||||9f7371fa0e3a42c8',
        // Case 2, because the ability has a heading, `0` gets sent for x/y/z with a proper heading
        '264|2023-11-02T21:39:20.0910000-04:00|10001234|0085|0000533E|1|0.000|0.000|0.000|2.920|2e9ae29c1b65f930',
        // Case 3, valid position and heading
        '264|2023-11-02T21:39:15.6790000-04:00|40000D6E|8C45|000052DD|1|-14.344|748.558|130.009|2.483|f6b3ffa6c97f0540',
      ],
    },
  },
  ContentFinderSettings: {
    examples: {
      en: [
        // Case 1, Content Finder settings not supported in zone
        '265|2024-01-04T21:11:46.6810000-05:00|86|Middle La Noscea|False|0|0|0|0|0|00eaa235236e5121',
        // Case 2, Content Finder settings supported, Explorer mode set
        '265|2024-01-04T21:12:02.4720000-05:00|40C|Sastasha|True|0|0|0|1|0|2ff0a9f6e1a54176',
        // Case 3, Unrestricted Party, Level Sync, Minimum IL, and Silence Echo set
        '265|2024-01-04T21:12:35.0540000-05:00|415|the Bowl of Embers|True|1|1|1|0|1|55fdf5241f168a5e',
      ],
    },
  },
  NpcYell: {
    examples: {
      en: [
        '266|2024-02-29T15:15:40.5850000-08:00|4001F001|02D2|07AF|8f731e1760bdcfc9',
        '266|2024-02-29T15:15:54.5570000-08:00|4001F002|02D4|07BE|ae0674ec1e496642',
        '266|2024-02-25T16:02:15.0300000-05:00|E0000000|6B10|2B29|65aa9c0faa3d0e16',
      ],
    },
  },
  BattleTalk2: {
    examples: {
      en: [
        '267|2024-02-29T16:22:41.4210000-08:00|00000000|80034E2B|02CE|840C|5000|0|2|0|0|6f6ccb784c36e978',
        '267|2024-02-29T16:22:17.9230000-08:00|00000000|80034E2B|02D2|8411|7000|0|2|0|0|be1dee98cdcd67a4',
        '267|2024-02-29T16:23:00.6680000-08:00|4001FFC4|80034E2B|02D5|840F|3000|0|2|0|0|cffef89907b5345b',
      ],
    },
  },
  Countdown: {
    examples: {
      en: [
        '268|2024-02-29T15:19:48.6250000-08:00|10FF0001|0036|13|00|Tini Poutini|0ab734bdbcb55902',
        '268|2024-02-29T15:34:16.4280000-08:00|10FF0002|0036|20|00|Potato Chippy|0ab734bdbcb55902',
      ],
    },
  },
  CountdownCancel: {
    examples: {
      en: [
        '269|2024-02-29T15:19:55.3490000-08:00|10FF0001|0036|Tini Poutini|e17efb9d120adea0',
        '269|2024-02-29T15:34:22.8940000-08:00|10FF0002|0036|Potato Chippy|e17efb9d120adea0',
      ],
    },
  },
  ActorMove: {
    examples: {
      en: [
        '270|2024-03-02T13:14:37.0430000-08:00|4000F1D3|-2.2034|0002|0014|102.0539|118.1982|0.2136|4601ae28c0b481d8',
        '270|2024-03-02T13:18:30.2960000-08:00|4000F44E|2.8366|0002|0014|98.2391|101.9623|0.2136|2eed500a1505cb03',
        '270|2024-03-02T13:18:30.6070000-08:00|4000F44E|-2.5710|0002|0014|98.2391|101.9318|0.2136|51bc63077eb489f3',
      ],
    },
  },
  ActorSetPos: {
    examples: {
      en: [
        '271|2024-03-02T13:20:50.9620000-08:00|4000F3B7|-2.3563|00|00|116.2635|116.2635|0.0000|e3fa606a5d0b5d57',
        '271|2024-03-02T13:20:50.9620000-08:00|4000F3B5|-1.5709|00|00|107.0000|100.0000|0.0000|5630c8f4e2ffac77',
        '271|2024-03-02T13:20:50.9620000-08:00|4000F3BB|0.2617|00|00|97.4118|90.3407|0.0000|01d53a3800c6238f',
      ],
    },
  },
  SpawnNpcExtra: {
    examples: {
      en: [
        '272|2024-03-02T15:45:44.2260000-05:00|4000226B|E0000000|0000|01|89d2d9b95839548f',
        '272|2024-03-02T15:45:44.2260000-05:00|4000226D|E0000000|0000|01|b5e6a59cc0b2c1f3',
        '272|2024-03-03T01:44:39.5570000-08:00|400838F4|E0000000|0000|00|32d8c0e768aeb0e7',
      ],
    },
  },
  ActorControlExtra: {
    examples: {
      en: [
        '273|2023-12-05T10:57:43.4770000-08:00|4000A145|003E|1|0|0|0|06e7eff4a949812c',
        '273|2023-12-05T10:58:00.3460000-08:00|4000A144|003E|1|1|0|0|a4af9f90928636a3',
        '273|2024-03-18T20:33:22.7130000-04:00|400058CA|0834|0|848|FA0|0|c862c35712ed4122',
      ],
    },
  },
  ActorControlSelfExtra: {
    examples: {
      en: [
        '274|2024-01-10T19:28:37.5000000-05:00|10001234|020F|04D0|0|93E0|0|0|0|d274429622d0c27e',
        '274|2024-02-15T19:35:41.9950000-05:00|10001234|020F|236D|0|669|0|0|0|d274429622d0c27e',
        '274|2024-03-21T20:45:41.3680000-04:00|10001234|0210|129D|10001234|F|0|0|0|d274429622d0c27e',
      ],
    },
  },
} as const;

// Verify typing (e.g. required line types are present), but export `as const`.
const assertExampleLogLines: ExampleLines = exampleLogLines;
console.assert(assertExampleLogLines);

export default exampleLogLines;
