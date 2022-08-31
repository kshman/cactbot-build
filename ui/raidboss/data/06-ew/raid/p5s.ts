import NetRegexes from '../../../../../resources/netregexes';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const directions = {
  'NE': true,
  'SE': true,
  'SW': true,
  'NW': true,
};

export interface Data extends RaidbossData {
  target?: string;
  topazRays: { [time: number]: (keyof typeof directions | undefined)[] };
  //
  prsRays: string[];
}

const convertAbilityIdToTopazRayIndex = (id: string): number => {
  // 7703 is the Topaz Ray cast with the lowest cast time
  return parseInt(id, 16) - parseInt('7703', 16);
};

const convertCoordinatesToDirection = (x: number, y: number): keyof typeof directions | undefined => {
  if (x > 100)
    return y < 100 ? 'NE' : 'SE';
  if (x < 100)
    return y < 100 ? 'NW' : 'SW';
  return undefined;
};

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AbyssosTheFifthCircleSavage,
  timelineFile: 'p5s.txt',
  initData: () => {
    return {
      topazRays: {},
      //
      prsRays: [],
    };
  },
  triggers: [
    {
      // The tank busters are not cast on a target,
      // keep track of who the boss is auto attacking.
      id: 'P5S Attack',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7A0E', source: 'Proto-Carbuncle' }),
      run: (data, matches) => data.target = matches.target,
    },
    {
      // Update target whenever Provoke is used.
      id: 'P5S Provoke',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '1D6D' }),
      run: (data, matches) => data.target = matches.source,
    },
    {
      id: 'P5S Sonic Howl',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7720', source: 'Proto-Carbuncle', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'P5S Venomous Mass',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '771D', source: 'Proto-Carbuncle', capture: false }),
      alarmText: (data, _matches, output) => {
        if (data.role === 'tank' && data.target !== data.me)
          return output.tankSwap!();
      },
      alertText: (data, _matches, output) => {
        if (data.role === 'tank' && data.target !== data.me)
          return;

        if (data.target === data.me)
          return output.busterOnYou!();
        return output.busterOnTarget!({ player: data.ShortName(data.target) });
      },
      outputStrings: {
        busterOnYou: Outputs.tankBusterOnYou,
        busterOnTarget: Outputs.tankBusterOnPlayer,
        tankSwap: Outputs.tankSwap,
      },
    },
    {
      id: 'P5S Toxic Crunch',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '784A', source: 'Proto-Carbuncle', capture: false }),
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' && data.target !== data.me)
          return;

        if (data.target === data.me)
          return output.busterOnYou!();
        return output.tankBuster!();
      },
      outputStrings: {
        busterOnYou: Outputs.tankBusterOnYou,
        tankBuster: Outputs.tankBuster,
      },
    },
    {
      id: 'P5S Double Rush',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '771B', source: 'Proto-Carbuncle', capture: false }),
      delaySeconds: 3,
      response: Responses.knockback(),
    },
    {
      id: 'P5S Venom Squall/Surge',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '771[67]', source: 'Proto-Carbuncle' }),
      durationSeconds: 5,
      alertText: (_data, matches, output) => {
        // Venom Squall
        if (matches.id === '7716')
          return output.spreadToHeal!();
        return output.healToSpread!();
      },
      outputStrings: {
        spreadToHeal: {
          en: '흩어졌다 -> 장판깔고 -> 힐러랑 붙어욧',
          ja: '散会 -> 真ん中 -> ヒーラと頭割り',
        },
        healToSpread: {
          en: '힐러랑 있다가 -> 장판깔고 -> 흩어져욧',
          ja: 'ヒーラと頭割り -> 真ん中 -> 散会',
        },
      },
    },
    {
      id: 'P5S Tail to Claw',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7712', source: 'Proto-Carbuncle', capture: false }),
      durationSeconds: 5,
      response: Responses.getFrontThenBack(),
    },
    {
      id: 'P5S Claw to Tail',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '770E', source: 'Proto-Carbuncle', capture: false }),
      durationSeconds: 5,
      response: Responses.getBackThenFront(),
    },
    {
      id: 'P5S Topaz Ray Collect',
      type: 'StartsUsing',
      // 7703: 3.7s, 7704: 6.2s, 7705: 8.7s, 7706: 11.2s
      netRegex: NetRegexes.startsUsing({ id: '770[3456]', source: 'Proto-Carbuncle' }),
      run: (data, matches) => {
        const index = convertAbilityIdToTopazRayIndex(matches.id);
        if (data.topazRays[index] === undefined)
          data.topazRays[index] = [];
        const direction = convertCoordinatesToDirection(parseFloat(matches.x), parseFloat(matches.y));
        data.topazRays[index]?.push(direction);
      },
    },
    {
      id: 'P5S Topaz Ray',
      type: 'StartsUsing',
      // 7703: 3.7s, 7704: 6.2s, 7705: 8.7s, 7706: 11.2s
      netRegex: NetRegexes.startsUsing({ id: '770[3456]', source: 'Proto-Carbuncle' }),
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2.5,
      alertText: (data, matches, output) => {
        // 770[34] cast 2 times, 770[56] cast 3 times
        const expectedArrayLength = ['7705', '7706'].includes(matches.id) ? 3 : 2;
        const index = convertAbilityIdToTopazRayIndex(matches.id);
        if (data.topazRays[index]?.length !== expectedArrayLength)
          return;
        const safeDirs = new Set<keyof typeof directions | undefined>(['NE', 'SE', 'SW', 'NW']);
        for (const dir of data.topazRays[index] ?? [])
          safeDirs.delete(dir);
        const dirs = [...safeDirs];
        if (dirs.length !== (4 - expectedArrayLength))
          return;
        if (!dirs[0])
          return;

        const dirStr = `dir${dirs[0]}`;
        data.prsRays.push(output[dirStr]!());

        if (data.prsRays.length === 4)
          return data.prsRays.slice(1).join(' - ');
        if (data.prsRays.length !== 1 || dirs.length === 1 || !dirs[1])
          return;

        const dirMap = {
          'NE': output.dirNE!(),
          'SE': output.dirSE!(),
          'SW': output.dirSW!(),
          'NW': output.dirNW!(),
        };
        return output.two!({ dir1: dirMap[dirs[0]], dir2: dirMap[dirs[1]] });
      },
      run: (data, matches) => delete data.topazRays[convertAbilityIdToTopazRayIndex(matches.id)],
      outputStrings: {
        dirNE: {
          en: '↗↗',
        },
        dirSE: {
          en: '↘↘',
        },
        dirSW: {
          en: '↙↙',
        },
        dirNW: {
          en: '↖↖',
        },
        two: {
          en: '${dir1} 또는 ${dir2}',
          ja: '${dir1} まだは ${dir2}',
        },
      },
    },
    {
      id: 'P5S Topaz Ray Cleanup',
      type: 'Ability',
      // Topaz Cluster
      netRegex: NetRegexes.ability({ id: '7702', source: 'Proto-Carbuncle', capture: false }),
      delaySeconds: 10,
      run: (data) => {
        data.topazRays = {};
        data.prsRays = [];
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Lively Bait': 'zappelnd(?:e|er|es|en) Köder',
        'Proto-Carbuncle': 'Proto-Karfunkel',
      },
      'replaceText': {
        '--towers--': '--Türme--',
        'Acidic Slaver': 'Säurespeichel',
        'Claw to Tail': 'Kralle und Schwanz',
        'Devour': 'Verschlingen',
        'Double Rush': 'Doppelsturm',
        'Impact': 'Impakt',
        'Raging Claw': 'Wütende Kralle',
        'Raging Tail': 'Wütender Schwanz',
        'Ruby Glow': 'Rubinlicht',
        'Ruby Reflection': 'Rubinspiegelung',
        'Scatterbait': 'Streuköder',
        'Sonic Howl': 'Schallheuler',
        'Sonic Shatter': 'Schallbrecher',
        'Spit': 'Hypersekretion',
        'Starving Stampede': 'Hungerstampede',
        'Tail to Claw': 'Schwanz und Kralle',
        'Topaz Cluster': 'Topasbündel',
        'Topaz Ray': 'Topasstrahl',
        'Topaz Stones': 'Topasstein',
        'Toxic Crunch': 'Giftquetscher',
        'Venom(?!( |ous))': 'Toxinspray',
        'Venom Drops': 'Gifttropfen',
        'Venom Pool': 'Giftschwall',
        'Venom Rain': 'Giftregen',
        'Venom Squall': 'Giftwelle',
        'Venom Surge': 'Giftwallung',
        'Venomous Mass': 'Giftmasse',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Lively Bait': 'amuse-gueule',
        'Proto-Carbuncle': 'Proto-Carbuncle',
      },
      'replaceText': {
        'Acidic Slaver': 'Salive acide',
        'Devour': 'Dévoration',
        'Impact': 'Impact',
        'Raging Claw': 'Griffes enragées',
        'Raging Tail': 'Queue enragée',
        'Ruby Glow': 'Lumière rubis',
        'Ruby Reflection': 'Réflexion rubis',
        'Scatterbait': 'Éclate-appât',
        'Sonic Howl': 'Hurlement sonique',
        'Sonic Shatter': 'Pulvérisation sonique',
        'Spit': 'Crachat',
        'Starving Stampede': 'Charge affamée',
        'Topaz Cluster': 'Chaîne de topazes',
        'Topaz Ray': 'Rayon topaze',
        'Topaz Stones': 'Topazes',
        'Toxic Crunch': 'Croqueur venimeux',
        'Venom(?!( |ous))': 'Venin',
        'Venom Drops': 'Crachin de venin',
        'Venom Pool': 'Giclée de venin',
        'Venom Rain': 'Pluie de venin',
        'Venom Squall': 'Crachat de venin',
        'Venom Surge': 'Déferlante de venin',
        'Venomous Mass': 'Masse venimeuse',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Lively Bait': 'ライブリー・ベイト',
        'Proto-Carbuncle': 'プロトカーバンクル',
      },
      'replaceText': {
        'Acidic Slaver': 'アシッドスレイバー',
        'Devour': '捕食',
        'Impact': '衝撃',
        'Raging Claw': 'レイジングクロウ',
        'Raging Tail': 'レイジングテイル',
        'Ruby Glow': 'ルビーの光',
        'Ruby Reflection': 'ルビーリフレクション',
        'Scatterbait': 'スキャッターベイト',
        'Sonic Howl': 'ソニックハウル',
        'Sonic Shatter': 'ソニックシャッター',
        'Spit': '放出',
        'Starving Stampede': 'スターヴィング・スタンピード',
        'Topaz Cluster': 'トパーズクラスター',
        'Topaz Ray': 'トパーズレイ',
        'Topaz Stones': 'トパーズストーン',
        'Toxic Crunch': 'ベノムクランチ',
        'Venom(?!( |ous))': '毒液',
        'Venom Drops': 'ベノムドロップ',
        'Venom Pool': 'ベノムスプラッシュ',
        'Venom Rain': 'ベノムレイン',
        'Venom Squall': 'ベノムスコール',
        'Venom Surge': 'ベノムサージ',
        'Venomous Mass': 'ベノムマス',
      },
    },
  ],
};

export default triggerSet;
