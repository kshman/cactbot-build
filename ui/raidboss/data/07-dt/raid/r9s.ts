import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { DirectionOutput16, Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  flailPositions: NetMatches['StartsUsingExtra'][];
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
        const [dir1, dir2] = data.bats.inner;

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
        const [dir1, dir2, dir3] = data.bats.middle;

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
          ja: 'MT組雑魚処理',
          ko: 'MT팀이 타워로!',
        },
        st: {
          en: 'Adds for ST team',
          ja: 'ST組雑魚処理',
          ko: 'ST팀이 타워로!',
        },
      },
    },
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
      'locale': 'ja',
      'replaceSync': {
        'Coffinmaker': 'コフィンメーカー',
        'Fatal Flail': 'フェイタルフレイル',
        'Vamp Fatale': 'ヴァンプ・ファタール',
        'Vampette Fatale': 'ファタールバット',
      },
      'replaceText': {
        'Ultrasonic Spread/Ultrasonic Amp': 'スプレッド/アグリゲートソニック',
        'Ultrasonic Amp/Ultrasonic Spread': 'アグリゲート/スプレッドソニック',
      },
    },
  ],
};

export default triggerSet;
