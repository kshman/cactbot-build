import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type RedBlue = 'red' | 'blue';

export interface Data extends RaidbossData {
  fateColor?: RedBlue;
  fateBurnished?: boolean;
  fateFallIndex: number;
  fateFallMyIndex: number;
  fateFallColors: RedBlue[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'FuturesRewrittenUltimate',
  zoneId: ZoneId.FuturesRewrittenUltimate,
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    fateFallIndex: 0,
    fateFallMyIndex: 0,
    fateFallColors: [],
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'Flu P1 Cyclonic Break',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9CD4'], source: 'Fatebreaker' },
      infoText: (_data, matches, output) => {
        if (matches.id === '9CD0')
          return output.pair!();
        return output.spread!();
      },
      outputStrings: {
        pair: {
          en: 'Pair',
          ko: '왓다갔다 페어',
        },
        spread: {
          en: 'Spread',
          ko: '왔다갔다 흩어져요',
        },
      },
    },
    {
      id: 'Flu P1 Powder Mark Trail',
      type: 'StartsUsing',
      netRegex: { id: '9CE8', source: 'Fatebreaker' },
      durationSeconds: 5,
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'Flu P1 Utopian Sky',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker' },
      durationSeconds: 5,
      infoText: (data, matches, output) => {
        if (matches.id === '9CDA') {
          data.fateColor = 'red';
          return output.stack!();
        }
        data.fateColor = 'blue';
        return output.spread!();
      },
      outputStrings: {
        stack: {
          en: 'Stack later (red)',
          ko: '나중에 뭉쳐요 (🔴빨강)',
        },
        spread: {
          en: 'Spread later (blue)',
          ko: '나중에 흩어져요 (🔵파랑)',
        },
      },
    },
    {
      id: 'Flu P1 Blasting Zone',
      type: 'StartsUsing',
      netRegex: { id: '9CDE', source: 'Fatebreaker\'s Image', capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.fateColor === 'red')
          return output.stack!();
        return output.spread!();
      },
      outputStrings: {
        stack: Outputs.stacks,
        spread: Outputs.spread,
      },
    },
    {
      id: 'Flu P1 Image\'s Cyclonic Break',
      type: 'StartsUsing',
      netRegex: { id: ['9D89', '9D8A'], source: 'Fatebreaker\'s Image' },
      delaySeconds: 2,
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '9D89')
          return output.pair!();
        return output.spread!();
      },
      outputStrings: {
        pair: {
          en: 'Stack',
          ko: '자기 자리로 🔜 페어',
        },
        spread: {
          en: 'Spread',
          ko: '자기 자리로 🔜 흩어져요',
        },
      },
    },
    {
      id: 'Flu P1 Burnished Glory',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      durationSeconds: 5,
      response: Responses.bleedAoe(),
    },
    {
      id: 'Flu P1 Fall of Faith',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      delaySeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.fateBurnished)
          return;
        data.fateBurnished = true;
        data.fateFallIndex = 0;
        data.fateFallMyIndex = 0;
        data.fateFallColors = [];
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Check tethers',
          ko: '줄다리기 순서 확인',
        },
      },
    },
    {
      id: 'Flu P1 Fall Tether',
      type: 'Tether',
      netRegex: { id: ['00F9', '011F'] },
      condition: (data, _matches) => data.fateBurnished,
      durationSeconds: 4,
      alertText: (data, matches, output) => {
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.fateFallColors[data.fateFallIndex] = color;
        data.fateFallIndex++;
        if (matches.target === data.me) {
          data.fateFallMyIndex = data.fateFallIndex;
          const colorName = color === 'red' ? output.red!() : output.blue!();
          return output.text!({ num: data.fateFallIndex, color: colorName });
        }
      },
      outputStrings: {
        text: {
          en: '${num} ${color}',
          ko: '내가 ${num}번째 ${color}',
        },
        red: {
          en: 'Red',
          ko: '🔴빨강',
        },
        blue: {
          en: 'Blue',
          ko: '🔵파랑',
        },
      },
    },
    {
      id: 'Flu P1 Fall of Faith Alert',
      type: 'Ability',
      netRegex: { id: ['9CC9', '9CCC'], source: 'Fatebreaker', capture: false },
      condition: (data) => data.fateFallColors.length === 4,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        let colors = data.fateFallColors.map((c) => c === 'red' ? output.red!() : output.blue!());
        if (data.options.OnlyAutumn) {
          const aclrs = [];
          if (data.fateFallMyIndex % 2 === 0) {
            aclrs.push(data.fateFallColors[1]);
            aclrs.push(data.fateFallColors[3]);
          } else {
            aclrs.push(data.fateFallColors[0]);
            aclrs.push(data.fateFallColors[2]);
          }
          colors = aclrs.map((c) => c === 'red' ? output.red!() : output.blue!());
        }
        return output.text!({ res: colors.join(output.next!()) });
      },
      outputStrings: {
        next: Outputs.next,
        text: {
          en: '${res}',
          ko: '${res}',
        },
        red: {
          en: 'Red',
          ko: '🔴빨강',
        },
        blue: {
          en: 'Blue',
          ko: '🔵파랑',
        },
      },
    },
    {
      id: 'Flu P1 Burnt Strike',
      type: 'StartsUsing',
      netRegex: { id: ['9CC1', '9CC5'], source: 'Fatebreaker' },
      durationSeconds: 5,
      infoText: (data, matches, output) => {
        const act = data.role === 'tank' ? output.buster!() : output.tower!();
        if (matches.id === '9CC1')
          return output.red!({ act: act });
        return output.blue!({ act: act });
      },
      outputStrings: {
        red: {
          en: 'Knockback => ${act}',
          ko: '장판 넉백 🔜 ${act} (🔴빨강)',
        },
        blue: {
          en: 'Go position => ${act}',
          ko: '담당 위치로 🔜 ${act} (🔵파랑)',
        },
        tower: {
          en: 'Tower',
          ko: '타워 밟아요',
        },
        buster: {
          en: 'Buster',
          ko: '폭발 처리',
        },
      },
    },
  ],
  timelineReplace: [
    {
      locale: 'en',
      replaceText: {
        'Sinbound Fire III/Sinbound Thunder III': 'Sinbound Fire/Thunder',
      },
    },
  ],
};

export default triggerSet;
