import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  brutalRain: number;
  hells: number;
  hellAdds: boolean;
}

const headMarkers = {
  'fourHitStack': '0131',
  'hardCore': '01D4',
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM1Savage',
  zoneId: ZoneId.AacHeavyweightM1Savage,
  timelineFile: 'r9s.txt',
  initData: () => ({
    brutalRain: 2,
    hells: 0,
    hellAdds: false,
  }),
  triggers: [
    {
      id: 'R9S Headmarker Party Multi Stack',
      type: 'HeadMarker',
      netRegex: { id: headMarkers['fourHitStack'], capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R9S Headmarker Hard Core',
      type: 'HeadMarker',
      netRegex: { id: headMarkers['hardCore'], capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'R9S Killer Voice',
      type: 'StartsUsing',
      netRegex: { id: 'B384', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R9S Vamp Stomp',
      type: 'StartsUsing',
      netRegex: { id: 'B34A', source: 'Vamp Fatale', capture: false },
      response: Responses.getOut(),
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
      id: 'R9S Crowd Kill',
      type: 'StartsUsing',
      netRegex: { id: 'B33E', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R9S Finale Fatale',
      type: 'StartsUsing',
      netRegex: { id: ['B340', 'B341'], source: 'Vamp Fatale', capture: false },
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.aoe!(),
      outputStrings: {
        aoe: {
          en: 'Raidwide AoE',
          ja: '全体攻撃 + 黒ゆか',
          ko: '전체 공격 + 깜장 장판',
        },
      },
    },
    {
      id: 'R9S Aetherletting',
      type: 'StartsUsing',
      netRegex: { id: 'B392', source: 'Vamp Fatale', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.bait!(),
      outputStrings: {
        bait: {
          en: 'Bait aetherletting',
          ja: '外側にゆか誘導！',
          ko: '뒤로 빠져서 장판 설치!',
        },
      },
    },
    {
      id: 'R9S Sadistic Screech',
      type: 'StartsUsing',
      netRegex: { id: 'B333', source: 'Vamp Fatale', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R9S Insatiable Thirst',
      type: 'StartsUsing',
      netRegex: { id: 'B344', source: 'Vamp Fatale', capture: false },
      response: Responses.aoe(),
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
          ko: 'MT팀 쫄 쳐요',
        },
        st: {
          en: 'Adds for ST team',
          ja: 'ST組雑魚処理',
          ko: 'ST팀 쫄 쳐요',
        },
      },
    },
    {
      id: 'R9S Hell Adds Gain',
      type: 'GainsEffect',
      netRegex: { effectId: '127A', capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.hellAdds = true,
    },
    {
      id: 'R9S Hell Adds Lost',
      type: 'GainsEffect',
      netRegex: { effectId: '127A', capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: 13,
      run: (data) => data.hellAdds = false,
    },
    {
      id: 'R9S Ultrasonic Spread',
      type: 'StartsUsing',
      netRegex: { id: 'B39C', source: 'Vamp Fatale', capture: false },
      condition: (data) => !data.hellAdds,
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
      condition: (data) => !data.hellAdds,
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
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'replaceSync': {
        'Coffinmaker': 'コフィンメーカー',
        'Fatal Flail': 'フェイタルフレイル',
        'Vamp Fatale': 'ヴァンプ・ファタール',
        'Vampette Fatale': 'ファタールバット',
      },
    },
  ],
};

export default triggerSet;
