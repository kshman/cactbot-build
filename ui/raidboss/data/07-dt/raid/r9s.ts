import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type TeamName = 'MT' | 'ST';

export interface Data extends RaidbossData {
  team?: TeamName;
  brutalRain: number;
  cellTeam?: TeamName;
}

const headMarkers = {
  'fourHitStack': '0131',
  'hardCore': '01D4',
  'brutalRain': '0131', // 안씀
  'aetherletting': '028C', // 안씀
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacHeavyweightM1Savage',
  zoneId: ZoneId.AacHeavyweightM1Savage,
  timelineFile: 'r9s.txt',
  initData: () => ({
    brutalRain: 2,
  }),
  triggers: [
    {
      id: 'R9S 시작!',
      type: 'InCombat',
      netRegex: { inGameCombat: '1', capture: false },
      durationSeconds: 2,
      infoText: (data, _matches, output) => {
        const sts = ['ST', 'H2', 'D2', 'D4'];
        data.team = sts.includes(data.moks) ? 'ST' : 'MT';
        return output.ok!({ moks: data.moks, team: data.team });
      },
      outputStrings: {
        ok: {
          en: 'Combat: ${moks}/${team}',
          ja: '1層開始: ${moks}/${team}組',
          ko: 'R9S 시작: ${moks}/${team}팀',
        },
      },
    },
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
      response: Responses.aoe(),
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
        // Determine which team is assigned for adds on this cast based on
        // the current `cellTeam` (before `run` toggles it).
        let assigned: TeamName | undefined;
        if (data.cellTeam === undefined)
          assigned = 'MT';
        else if (data.cellTeam === 'MT')
          assigned = 'ST';
        else
          assigned = undefined;

        // If we don't know the player's team, show explicit assignment to all.
        if (data.team === undefined) {
          if (assigned === 'MT')
            return output.mt!();
          if (assigned === 'ST')
            return output.st!();
          return;
        }

        // When player's team matches the assigned team, show adds to them only.
        if (assigned && data.team === assigned)
          return output.adds!();
        return;
      },
      run: (data) => {
        if (data.cellTeam === undefined)
          data.cellTeam = 'MT';
        else if (data.cellTeam === 'MT')
          data.cellTeam = 'ST';
        else
          data.cellTeam = undefined;
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
        adds: {
          en: 'Adds',
          ja: '雑魚処理',
          ko: '맡은 쫄 쳐요',
        },
      },
    },
    {
      id: 'R9S Split Sonic',
      type: 'StartsUsing',
      netRegex: { id: 'B39C', source: 'Vamp Fatale', capture: false },
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        if (data.team === undefined || data.cellTeam !== data.team)
          return output.spread!();
      },
      outputStrings: {
        spread: {
          en: 'Role spread for boss',
          ja: 'ロール散会して扇誘導',
          ko: '롤끼리 모여 꼬깔 유도',
        },
      },
    },
    {
      id: 'R9S Agree Gate Sonic',
      type: 'StartsUsing',
      netRegex: { id: 'B39D', source: 'Vamp Fatale', capture: false },
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        if (data.team === undefined || data.cellTeam !== data.team)
          return output.stack!();
      },
      outputStrings: {
        stack: {
          en: 'Stack for boss',
          ja: '集まって扇誘導',
          ko: '모두 뭉쳐서 꼬깔 유도',
        },
      },
    },
    {
      id: 'R9S Undead Deathmatch',
      type: 'StartsUsing',
      netRegex: { id: 'B3A0', source: 'Vamp Fatale', capture: false },
      infoText: (data, _matches, output) => {
        if (data.team === undefined)
          return output.tower!();
        if (data.team === 'MT')
          return output.left!();
        return output.right!();
      },
      outputStrings: {
        tower: {
          en: 'Tower',
          ja: '塔踏み',
          ko: '타워 밟아요',
        },
        left: {
          en: 'Left tower',
          ja: '左塔踏み',
          ko: '🡸타워 밟아요',
        },
        right: {
          en: 'Right tower',
          ja: '右塔踏み',
          ko: '타워🡺 밟아요',
        },
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
