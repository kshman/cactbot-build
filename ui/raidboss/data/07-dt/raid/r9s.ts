import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutput16, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

type CoffinfillerPosition =
  | 'outerWest'
  | 'innerWest'
  | 'innerEast'
  | 'outerEast'
  | 'inside'
  | 'outside';

export interface Data extends RaidbossData {
  flailPositions: NetMatches['StartsUsingExtra'][];
  coffinfillers: CoffinfillerPosition[];
  actorPositions: { [id: string]: { x: number; y: number; heading: number } };
  bats: {
    inner: DirectionOutput16[];
    middle: DirectionOutput16[];
    outer: DirectionOutput16[];
  };
  satisfiedCount: number;
  hasHellAwaits: boolean;
  brutalRain: number;
  hells: number;
}

const headMarkerData = {
  // Vfx Path: com_share4a1
  'multiHitStack': '0131',
  // Vfx Path: tank_lockonae_0m_5s_01t
  'tankbuster': '01D4',
  // Vfx Path: lockon5_line_1p
  'aetherletting': '028C',
  // Tethers used in Hell in a Cell and Undead Deathmatch
  'tetherClose': '0161',
  'tetherFar': '0162',
} as const;

const center = {
  x: 100,
  y: 100,
};

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM1Savage',
  zoneId: ZoneId.AacHeavyweightM1Savage,
  timelineFile: 'r9s.txt',
  initData: () => ({
    flailPositions: [],
    coffinfillers: [],
    actorPositions: {},
    bats: { inner: [], middle: [], outer: [] },
    satisfiedCount: 0,
    hasHellAwaits: false,
    brutalRain: 2,
    hells: 0,
  }),
  triggers: [
    {
      id: 'R9S ActorSetPos Tracker',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R9S ActorMove Tracker',
      type: 'ActorMove',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      run: (data, matches) =>
        data.actorPositions[matches.id] = {
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          heading: parseFloat(matches.heading),
        },
    },
    {
      id: 'R9S Killer Voice',
      type: 'StartsUsing',
      netRegex: { id: 'B384', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R9S Satisfied Counter',
      type: 'GainsEffect',
      netRegex: { effectId: '1277', capture: true },
      run: (data, matches) => data.satisfiedCount = parseInt(matches.count),
    },
    {
      id: 'R9S Headmarker Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['tankbuster'], capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.satisfiedCount >= 8)
          return output.bigTankCleave!();
        return output.tankCleaveOnYou!();
      },
      outputStrings: {
        tankCleaveOnYou: Outputs.tankCleaveOnYou,
        bigTankCleave: {
          en: 'Tank Cleave on YOU (Big)',
          ja: '大タンク頭割り来るよ！',
          ko: '내게 엄청 큰 탱크버스터',
        },
      },
    },
    {
      id: 'R9S Vamp Stomp',
      type: 'StartsUsing',
      netRegex: { id: 'B34A', source: 'Vamp Fatale', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'R9S Headmarker Party Multi Stack',
      // TODO: Add boss debuff tracker and indicate count
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['multiHitStack'], capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R9S Bat Tracker',
      type: 'ActorControlExtra',
      netRegex: { id: '4[0-9A-Fa-f]{7}', category: '0197', param1: '11D1', capture: true },
      run: (data, matches) => {
        const moveRads = {
          'inner': 1.5128,
          'middle': 1.5513,
          'outer': 1.5608,
        } as const;
        const actor = data.actorPositions[matches.id];
        if (actor === undefined)
          return;
        const dist = Math.hypot(actor.x - center.x, actor.y - center.y);
        const dLen = dist < 16 ? (dist < 8 ? 'inner' : 'middle') : 'outer';

        const angle = Math.atan2(actor.x - center.x, actor.y - center.y);
        let angleCW = angle - (Math.PI / 2);
        if (angleCW < -Math.PI)
          angleCW += Math.PI * 2;
        let angleDiff = Math.abs(angleCW - actor.heading);
        if (angleDiff > Math.PI * 1.75)
          angleDiff = Math.abs(angleDiff - (Math.PI * 2));

        const cw = angleDiff < (Math.PI / 2) ? 'cw' : 'ccw';
        const adjustRads = moveRads[dLen];
        let endAngle = angle + (adjustRads * ((cw === 'cw') ? -1 : 1));
        if (endAngle < -Math.PI)
          endAngle += Math.PI * 2;
        else if (endAngle > Math.PI)
          endAngle -= Math.PI * 2;

        data.bats[dLen].push(
          Directions.output16Dir[Directions.hdgTo16DirNum(endAngle)] ?? 'unknown',
        );
      },
    },
    {
      id: 'R9S Blast Beat Inner',
      type: 'ActorControlExtra',
      netRegex: { id: '4[0-9A-Fa-f]{7}', category: '0197', param1: '11D1', capture: false },
      delaySeconds: 4.1,
      durationSeconds: 5.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const [dir1, dir2] = data.bats.inner.sort(Directions.compareDirectionOutput);

        return output.away!({
          dir1: output[dir1 ?? 'unknown']!(),
          dir2: output[dir2 ?? 'unknown']!(),
        });
      },
      run: (data, _matches) => {
        data.bats.inner = [];
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        away: {
          en: 'Away from bats ${dir1}/${dir2}',
          ja: 'ゴモリー: ${dir1} ${dir2}',
          ko: '박쥐: ${dir1} ${dir2}',
        },
      },
    },
    {
      id: 'R9S Blast Beat Middle',
      type: 'ActorControlExtra',
      netRegex: { id: '4[0-9A-Fa-f]{7}', category: '0197', param1: '11D1', capture: false },
      delaySeconds: 9.7,
      durationSeconds: 3.4,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const [dir1, dir2, dir3] = data.bats.middle.sort(Directions.compareDirectionOutput);

        return output.away!({
          dir1: output[dir1 ?? 'unknown']!(),
          dir2: output[dir2 ?? 'unknown']!(),
          dir3: output[dir3 ?? 'unknown']!(),
        });
      },
      run: (data, _matches) => {
        data.bats.middle = [];
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        away: {
          en: 'Away from bats ${dir1}/${dir2}/${dir3}',
          ja: 'ゴモリー: ${dir1} ${dir2} ${dir3}',
          ko: '박쥐: ${dir1} ${dir2} ${dir3}',
        },
      },
    },
    {
      id: 'R9S Blast Beat Outer',
      type: 'ActorControlExtra',
      netRegex: { id: '4[0-9A-Fa-f]{7}', category: '0197', param1: '11D1', capture: false },
      delaySeconds: 13.2,
      durationSeconds: 3.4,
      suppressSeconds: 1,
      response: Responses.goMiddle(),
      run: (data, _matches) => {
        data.bats.outer = [];
      },
    },
    {
      id: 'R9S Sadistic Screech',
      type: 'StartsUsing',
      netRegex: { id: 'B333', source: 'Vamp Fatale', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R9S Coffinfiller',
      type: 'StartsUsingExtra',
      netRegex: { id: ['B368', 'B369', 'B36A'], capture: true },
      suppressSeconds: (data) => data.coffinfillers.length === 0 ? 0 : 5,
      run: (data, matches) => {
        let danger: CoffinfillerPosition;
        const xPos = parseFloat(matches.x);
        if (xPos < 95)
          danger = 'outerWest';
        else if (xPos < 100)
          danger = 'innerWest';
        else if (xPos < 105)
          danger = 'innerEast';
        else
          danger = 'outerEast';
        data.coffinfillers.push(danger);
      },
    },
    {
      id: 'R9S Half Moon',
      type: 'StartsUsingExtra',
      netRegex: { id: ['B377', 'B379', 'B37B', 'B37D'], capture: true },
      delaySeconds: 0.3,
      alertText: (data, matches, output) => {
        if (data.coffinfillers.length < 2) {
          if (matches.id === 'B377')
            return output.rightThenLeft!();
          if (matches.id === 'B37B')
            return output.leftThenRight!();
          return output.bigHalfmoonNoCoffin!({
            dir1: output[matches.id === 'B379' ? 'right' : 'left']!(),
            dir2: output[matches.id === 'B379' ? 'left' : 'right']!(),
          });
        }

        const attackDirNum = Directions.hdgTo4DirNum(parseFloat(matches.heading));
        const dirNum1 = (attackDirNum + 2) % 4;
        const dir1 = Directions.outputFromCardinalNum(dirNum1);
        const dirNum2 = attackDirNum;
        const dir2 = Directions.outputFromCardinalNum(dirNum2);
        const bigCleave = matches.id === 'B379' || matches.id === 'B37D';

        const insidePositions: CoffinfillerPosition[] = [
          'innerWest',
          'innerEast',
        ];

        const outsidePositions: CoffinfillerPosition[] = [
          'outerWest',
          'outerEast',
        ];

        const westPositions: CoffinfillerPosition[] = [
          'innerWest',
          'outerWest',
        ];

        const eastPositions: CoffinfillerPosition[] = [
          'innerEast',
          'outerEast',
        ];

        let coffinSafe1: CoffinfillerPosition[] = [
          'outerWest',
          'innerWest',
          'innerEast',
          'outerEast',
        ];
        coffinSafe1 = coffinSafe1.filter((pos) => !data.coffinfillers.includes(pos));

        let coffinSafe2: CoffinfillerPosition[] = [
          'outerWest',
          'innerWest',
          'innerEast',
          'outerEast',
        ];
        // Whatever gets hit first round will be safe second round
        coffinSafe2 = coffinSafe2.filter((pos) => data.coffinfillers.includes(pos));

        data.coffinfillers = [];

        let dir1Text = output[dir1]!();
        let dir2Text = output[dir2]!();

        if (dir1 === 'dirW') {
          coffinSafe1 = coffinSafe1.filter((pos) => westPositions.includes(pos));
          dir1Text = output.leftWest!();
        }

        if (dir1 === 'dirE') {
          coffinSafe1 = coffinSafe1.filter((pos) => eastPositions.includes(pos));
          dir1Text = output.rightEast!();
        }

        if (dir2 === 'dirW') {
          coffinSafe2 = coffinSafe2.filter((pos) => westPositions.includes(pos));
          dir2Text = output.leftWest!();
        }

        if (dir2 === 'dirE') {
          coffinSafe2 = coffinSafe2.filter((pos) => eastPositions.includes(pos));
          dir2Text = output.rightEast!();
        }

        let coffin1: CoffinfillerPosition | 'unknown';
        let coffin2: CoffinfillerPosition | 'unknown';

        if (coffinSafe1.every((pos) => insidePositions.includes(pos)))
          coffin1 = 'inside';
        else if (coffinSafe1.every((pos) => outsidePositions.includes(pos)))
          coffin1 = 'outside';
        else
          coffin1 = coffinSafe1.find((pos) => insidePositions.includes(pos)) ?? 'unknown';

        if (coffinSafe2.every((pos) => insidePositions.includes(pos)))
          coffin2 = 'inside';
        else if (coffinSafe2.every((pos) => outsidePositions.includes(pos)))
          coffin2 = 'outside';
        else
          coffin2 = coffinSafe2.find((pos) => insidePositions.includes(pos)) ?? 'unknown';

        if (bigCleave) {
          return output.bigHalfmoonCombined!({
            coffin1: output[coffin1]!(),
            dir1: dir1Text,
            coffin2: output[coffin2]!(),
            dir2: dir2Text,
          });
        }

        return output.combined!({
          coffin1: output[coffin1]!(),
          dir1: dir1Text,
          coffin2: output[coffin2]!(),
          dir2: dir2Text,
        });
      },
      outputStrings: {
        dirN: Outputs.dirN,
        dirE: Outputs.dirE,
        dirS: Outputs.dirS,
        dirW: Outputs.dirW,
        unknown: Outputs.unknown,
        text: {
          en: '${first} => ${second}',
          ja: '${first} 🔜 ${second}',
          ko: '${first} 🔜 ${second}',
        },
        combined: {
          en: '${coffin1} + ${dir1} => ${coffin2} + ${dir2}',
          ja: '${coffin1} + ${dir1} 🔜 ${coffin2} + ${dir2}',
          ko: '${coffin1} + ${dir1} 🔜 ${coffin2} + ${dir2}',
        },
        bigHalfmoonCombined: {
          en: '${coffin1} + ${dir1} (big) => ${coffin2} + ${dir2} (big)',
          ja: '[大範囲] ${coffin1} + ${dir1} 🔜 ${coffin2} + ${dir2}',
          ko: '${coffin1} + ${dir1} 🔜 ${coffin2} + ${dir2}',
        },
        rightThenLeft: Outputs.rightThenLeft,
        leftThenRight: Outputs.leftThenRight,
        left: Outputs.left,
        leftWest: Outputs.leftWest,
        right: Outputs.right,
        rightEast: Outputs.rightEast,
        inside: {
          en: 'Inside',
          ja: '内側',
          ko: '안',
        },
        outside: {
          en: 'Outside',
          ja: '外側',
          ko: '밖',
        },
        outerWest: {
          en: 'Outer West',
          ja: '外側西',
          ko: '1열',
        },
        innerWest: {
          en: 'Inner West',
          ja: '内側西',
          ko: '2열',
        },
        innerEast: {
          en: 'Inner East',
          ja: '内側東',
          ko: '3열',
        },
        outerEast: {
          en: 'Outer East',
          ja: '外側東',
          ko: '4열',
        },
        bigHalfmoonNoCoffin: {
          en: '${dir1} max melee => ${dir2} max melee',
          ja: '${dir1} 最大近接 => ${dir2} 最大近接',
          ko: '${dir1} 🔜 ${dir2}',
        },
      },
    },
    {
      id: 'R9S Crowd Kill',
      type: 'StartsUsing',
      netRegex: { id: 'B33E', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R9S Insatiable Thirst',
      type: 'StartsUsing',
      netRegex: { id: 'B344', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R9S Finale Fatale (Small)',
      type: 'StartsUsing',
      netRegex: { id: 'B340', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R9S Finale Fatale (Big)',
      type: 'StartsUsing',
      netRegex: { id: 'B341', source: 'Vamp Fatale', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R9S Headmarker Aetherletting',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData['aetherletting'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.aetherlettingOnYou!(),
      outputStrings: {
        aetherlettingOnYou: {
          en: 'Aetherletting on YOU',
          ja: '外側にゆか誘導！',
          ko: '뒤로 빠져서 장판 설치!',
        },
      },
    },
    {
      id: 'R9S Plummet',
      type: 'StartsUsingExtra',
      netRegex: { id: 'B38B', capture: true },
      preRun: (data, matches) => {
        data.flailPositions.push(matches);
      },
      infoText: (data, _matches, output) => {
        const [flail1Match, flail2Match] = data.flailPositions;

        if (flail1Match === undefined || flail2Match === undefined)
          return;

        const flail1X = parseFloat(flail1Match.x);
        const flail1Y = parseFloat(flail1Match.y);
        const flail2X = parseFloat(flail2Match.x);
        const flail2Y = parseFloat(flail2Match.y);

        const flail1Dir = Directions.xyToIntercardDirOutput(flail1X, flail1Y, center.x, center.y);
        const flail2Dir = Directions.xyToIntercardDirOutput(flail2X, flail2Y, center.x, center.y);

        const flail1Dist = Math.abs(flail1Y - center.y) < 10 ? 'near' : 'far';
        const flail2Dist = Math.abs(flail1Y - center.y) < 10 ? 'near' : 'far';

        return output.text!({
          flail1Dir: output[flail1Dir]!(),
          flail2Dir: output[flail2Dir]!(),
          flail1Dist: output[flail1Dist]!(),
          flail2Dist: output[flail2Dist]!(),
        });
      },
      run: (data) => {
        if (data.flailPositions.length < 2)
          return;
        data.flailPositions = [];
      },
      outputStrings: {
        text: {
          en: 'Flails ${flail1Dist} ${flail1Dir}/${flail2Dist} ${flail2Dir}',
          ja: '鉄球 ${flail1Dist}${flail1Dir} / ${flail2Dist}${flail2Dir}',
          ko: '철퇴: ${flail1Dist}${flail1Dir} / ${flail2Dist}${flail2Dir}',
        },
        near: {
          en: 'Near',
          ja: '近く',
          ko: '근처',
        },
        far: {
          en: 'Far',
          ja: '遠く',
          ko: '먼쪽',
        },
        ...Directions.outputStringsIntercardDir,
      },
    },
    {
      id: 'R9S Hell Awaits Gain Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: '127A', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => {
        data.hasHellAwaits = true;
      },
    },
    {
      id: 'R9S Hell Awaits Lose Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: '127A', capture: true },
      condition: Conditions.targetIsYou(),
      // Can't use the actual lose line, since it's after cast for 3rd spread/stack
      delaySeconds: 13,
      run: (data) => {
        data.hasHellAwaits = false;
      },
    },
    {
      id: 'R9S Ultrasonic Spread',
      type: 'StartsUsing',
      netRegex: { id: 'B39C', source: 'Vamp Fatale', capture: false },
      condition: (data) => !data.hasHellAwaits,
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.rolePositions!(),
      outputStrings: {
        rolePositions: Outputs.rolePositions,
      },
    },
    {
      id: 'R9S Ultrasonic Amp',
      type: 'StartsUsing',
      netRegex: { id: 'B39D', source: 'Vamp Fatale', capture: false },
      condition: (data) => !data.hasHellAwaits,
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.stack!(),
      outputStrings: {
        stack: {
          en: 'Stack',
          ja: 'タンクと頭割り',
          ko: '탱크랑 뭉쳐요',
        },
      },
    },
    {
      id: 'R9S Undead Deathmatch',
      type: 'StartsUsing',
      netRegex: { id: 'B3A0', source: 'Vamp Fatale', capture: false },
      infoText: (_data, _matches, output) => output.tower!(),
      outputStrings: {
        tower: Outputs.stackInTower,
      },
    },
    // /////////////
    {
      id: 'R9S Brutal Rain',
      type: 'StartsUsing',
      netRegex: { id: 'B35D', source: 'Vamp Fatale', capture: false },
      infoText: (data, _matches, output) => {
        data.brutalRain++;
        return output.rain!({ num: data.brutalRain });
      },
      outputStrings: {
        rain: {
          en: 'Stack for Rain x${num}',
          ja: '全体攻撃 x${num}',
          ko: '전체 공격 x${num}',
        },
      },
    },
    {
      id: 'R9S Hell in a Cell',
      type: 'StartsUsing',
      netRegex: { id: 'B395', source: 'Vamp Fatale', capture: false },
      infoText: (data, _matches, output) => {
        data.hells++;
        if (data.hells === 1)
          return output.mt!();
        if (data.hells === 2)
          return output.st!();
      },
      outputStrings: {
        mt: {
          en: 'Adds for MT team',
          ja: 'MT組: 雑魚処理',
          ko: 'MT팀이 타워로!',
        },
        st: {
          en: 'Adds for ST team',
          ja: 'ST組: 雑魚処理',
          ko: 'ST팀이 타워로!',
        },
      },
    },
    /* {
      id: 'R9S Half Moon Small',
      type: 'StartsUsing',
      netRegex: { id: ['B34E', 'B350'], source: 'Vamp Fatale', capture: true },
      infoText: (_data, matches, output) =>
        output[matches.id === 'B34E' ? 'rightThenLeft' : 'leftThenRight']!(),
      outputStrings: {
        rightThenLeft: Outputs.rightThenLeft,
        leftThenRight: Outputs.leftThenRight,
      },
    },
    {
      id: 'R9S Half Moon Large',
      type: 'StartsUsing',
      netRegex: { id: ['B34F', 'B351'], source: 'Vamp Fatale', capture: true },
      infoText: (_data, matches, output) =>
        output.text!({
          dir1: output[matches.id === 'B34F' ? 'right' : 'left']!(),
          dir2: output[matches.id === 'B34F' ? 'left' : 'right']!(),
        }),
      outputStrings: {
        text: {
          en: '${dir1} max melee => ${dir2} max melee',
          ja: '${dir1} 最大近接 => ${dir2} 最大近接',
          ko: '${dir1} 🔜 ${dir2}',
        },
        left: Outputs.left,
        right: Outputs.right,
      },
    }, */
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Ultrasonic Spread/Ultrasonic Amp': 'Ultrasonic Spread/Amp',
        'Ultrasonic Amp/Ultrasonic Spread': 'Ultrasonic Amp/Spread',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Coffinmaker': 'fatal(?:e|er|es|en) Säge',
        'Fatal Flail': 'fatal(?:e|er|es|en) Stachelbombe',
        'Vamp Fatale': 'Vamp Fatale',
        'Vampette Fatale': 'fatal(?:e|er|es|en) Fledermaus',
      },
      'replaceText': {
        '--coffinmaker--': '--Säge--',
        '--cell': '--Zelle',
        '--flail': '--Stachelbombe',
        '--nail--': '--Blitzableiter--',
        'Blast Beat': 'Resonanzwelle',
        'Bloody Bondage': 'Blutige Fesseln',
        'Breakdown Drop': 'Gebrochene Melodie',
        'Breakwing Beat': 'Gebrochener Rhythmus',
        'Coffinfiller': 'Sägenstich',
        'Crowd Kill': 'Massenmeuchelei',
        'Dead Wake': 'Sägenmarsch',
        'Finale Fatale': 'Finale Fatale',
        'Half Moon': 'Blutiger Halbmond',
        'Hardcore': 'Dominanz',
        'Hell in a Cell': 'Höllenkäfig',
        'Insatiable Thirst': 'Unstillbarer Durst',
        'Killer Voice': 'Todesecho',
        'Plummet': 'Abfallen',
        'Pulping Pulse': 'Zermalmender Puls',
        'Sadistic Screech': 'Henkersmahl',
        'Ultrasonic Amp': 'Fokusschall',
        'Ultrasonic Spread': 'Streuschall',
        'Undead Deathmatch': 'Fledermaus-Todeskampf',
        'Vamp Stomp': 'Vampirstampfer',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Coffinmaker': 'torture fatale',
        'Fatal Flail': 'fléau fatal',
        'Vamp Fatale': 'Vamp Fatale',
        'Vampette Fatale': 'chauve-souris fatale',
      },
      'replaceText': {
        'Blast Beat': 'Vague de résonance',
        'Bloody Bondage': 'Bondage sanglant',
        'Breakdown Drop': 'Fracas dévastateur',
        'Breakwing Beat': 'Rythme dévastateur',
        'Coffinfiller': 'Entaille funèbre',
        'Crowd Kill': 'Fauchage du public',
        'Dead Wake': 'Avancée',
        'Finale Fatale': 'Final fatal',
        'Half Moon': 'Demi-lunes',
        'Hardcore': 'Attaque extrême',
        'Hell in a Cell': 'Enfer carcéral',
        'Insatiable Thirst': 'Soif insatiable',
        'Killer Voice': 'Voix mortelle',
        'Plummet': 'Chute',
        'Pulping Pulse': 'Pulsation pulvérisante',
        'Sadistic Screech': 'Crissement sadique',
        'Ultrasonic Amp': '',
        'Ultrasonic Spread': '',
        'Undead Deathmatch': 'Chiroptère mortel',
        'Vamp Stomp': 'Piétinement fatal',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Coffinmaker': 'トーチャー・ファタール',
        'Fatal Flail': 'スパイク・ファタール',
        'Vamp Fatale': 'ヴァンプ・ファタール',
        'Vampette Fatale': 'ファタールバット',
      },
      'replaceText': {
        'Aetherletting(?! Proteans)': 'エーテルレッティング',
        'Aetherletting Proteans': 'エーテルレッティング 扇形',
        'Blast Beat': '共振波',
        'Bloody Bondage': 'ブラッディボンテージ',
        'Breakdown Drop': 'ブレイクダウン',
        'Breakwing Beat': 'ブレイクビーツ',
        'Coffinfiller': '突き出る',
        'Crowd Kill': 'クラウドキリング',
        'Dead Wake': '前進',
        'Finale Fatale': 'フィナーレ・ファターレ',
        'Half Moon': 'ハーフムーン',
        'Hardcore': 'ハードコア',
        'Hell in a Cell': 'ヘル・イン・ア・セル',
        'Insatiable Thirst': 'インセーシャブル・サースト',
        'Killer Voice': 'キラーボイス',
        'Plummet': '落下',
        'Pulping Pulse': 'パルピングパルス',
        'Sadistic Screech': 'サディスティック・スクリーチ',
        'Ultrasonic Amp': '',
        'Ultrasonic Spread': '',
        'Undead Deathmatch': 'バット・デスマッチ',
        'Vamp Stomp': 'ヴァンプストンプ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Charnel Cell': '致命棘狱',
        'Coffinmaker': '致命刑锯',
        'Deadly Doornail': '致命电杖',
        'Fatal Flail': '致命刺锤',
        'Vamp Fatale': '致命美人',
        'Vampette Fatale': '致命蝙蝠',
      },
      'replaceText': {
        '--coffinmaker--': '--致命刑锯--',
        '--cell': '--致命棘狱',
        '--flail': '--致命刺锤',
        '--nail--': '--致命电杖--',
        'Aetherletting(?! Proteans)': '以太流失',
        'Aetherletting Proteans': '以太流失扇形',
        'Blast Beat': '共振波',
        'Bloody Bondage': '血锁牢狱',
        'Breakdown Drop': '以太碎击',
        'Breakwing Beat': '以太碎拍',
        'Brutal Rain': '粗暴之雨',
        'Coffinfiller': '冲出',
        'Crowd Kill': '全场杀伤',
        'Dead Wake': '前进',
        'Finale Fatale': '致命的闭幕曲',
        'Half Moon': '月之半相',
        'Hardcore': '硬核之声',
        'Hell in a Cell': '笼中地狱',
        'Insatiable Thirst': '贪欲无厌',
        'Killer Voice': '魅亡之音',
        'Plummet': '掉落',
        'Pulping Pulse': '碎烂脉冲',
        'Sadistic Screech': '施虐的尖啸',
        'Sanguine Scratch': '嗜血抓挠',
        'Ultrasonic Amp': '音速集聚',
        'Ultrasonic Spread': '音速流散',
        'Undead Deathmatch': '血蝠死斗',
        'Vamp Stomp': '血魅的靴踏音',
      },
    },
    {
      'locale': 'ko',
      'missingTranslations': true,
      'replaceSync': {
        'Charnel Cell': '파탈 감옥',
        'Coffinmaker': '파탈 톱',
        'Deadly Doornail': '파탈 지팡이',
        'Fatal Flail': '파탈 철퇴',
        'Vamp Fatale': '뱀프 파탈',
        'Vampette Fatale': '파탈 박쥐',
      },
      'replaceText': {
        '--coffinmaker--': '--파탈 톱--',
        '--cell': '--감옥',
        '--flail': '--철퇴',
        '--nail--': '--지팡이--',
        'Aetherletting(?! Proteans)': '에테르 해방',
        'Aetherletting Proteans': '에테르 해방 부채꼴',
        'Blast Beat': '공진파',
        'Bloody Bondage': '피의 결박',
        'Breakdown Drop': '파괴 선율',
        'Breakwing Beat': '파괴 박자',
        'Brutal Rain': '잔혹한 비',
        'Coffinfiller': '톱날 돌출',
        'Crowd Kill': '생명력 갈취',
        'Dead Wake': '전진',
        'Finale Fatale': '파멸적 최후',
        'Half Moon': '반달차기',
        'Hardcore': '과격성',
        'Hell in a Cell': '헬 인 어 셀',
        'Insatiable Thirst': '채워지지 않는 갈증',
        'Killer Voice': '뇌쇄적인 목소리',
        'Plummet': '낙하',
        'Pulping Pulse': '분쇄 파동',
        'Sadistic Screech': '가학적인 웃음',
        'Sanguine Scratch': '붉은 생채기',
        // 'Ultrasonic Amp': 'Ultrasonic Amp',
        // 'Ultrasonic Spread': 'Ultrasonic Spread',
        'Undead Deathmatch': '박쥐 데스매치',
        'Vamp Stomp': '요염한 짓밟기',
      },
    },
  ],
};

export default triggerSet;
