import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'p1' | 'p2';
type RedBlue = 'red' | 'blue';

export interface Data extends RaidbossData {
  phase: Phase;
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
    phase: 'p1',
    fateFallIndex: 0,
    fateFallMyIndex: 0,
    fateFallColors: [],
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'Flu Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9CD4', '9CFF'], capture: true },
      run: (data, matches) => {
        switch (matches.id) {
          case '9CD0':
          case '9CD4':
            data.phase = 'p1';
            break;
          case '9CFF':
            data.phase = 'p2';
            break;
        }
      },
    },
    // //////////////// PHASE 1 //////////////////
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
        pair: Outputs.pair,
        spread: Outputs.spread,
      },
    },
    {
      id: 'Flu P1 Powder Mark Trail',
      type: 'StartsUsing',
      netRegex: { id: '9CE8', source: 'Fatebreaker' },
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
          en: 'Stack later',
          ko: '나중에 🔴뭉쳐요',
        },
        spread: {
          en: 'Spread later',
          ko: '나중에 🔵흩어져요',
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
          ko: '자기 자리로 🔜 🔴페어',
        },
        spread: {
          en: 'Spread',
          ko: '자기 자리로 🔜 🔵흩어져요',
        },
      },
    },
    {
      id: 'Flu P1 Image\'s Blastburn',
      type: 'StartsUsing',
      netRegex: { id: '9CE2', source: 'Fatebreaker\'s Image' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      durationSeconds: 3,
      response: Responses.knockback(),
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
      condition: (data, _matches) => data.phase === 'p1' && data.fateBurnished,
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
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
          move: {
            en: 'Go position',
            ko: '맡은 위치로!',
          },
        };
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.fateFallColors[data.fateFallIndex] = color;
        data.fateFallIndex++;
        if (matches.target === data.me) {
          data.fateFallMyIndex = data.fateFallIndex;
          const colorName = color === 'red' ? output.red!() : output.blue!();
          return { alertText: output.text!({ num: data.fateFallIndex, color: colorName }) };
        }
        if (data.fateFallMyIndex === 0 && data.fateFallIndex === 4)
          return { infoText: output.move!() };
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
          if (data.fateFallMyIndex === 2 || data.fateFallMyIndex === 4) {
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
      id: 'Flu P1 Blastburn',
      type: 'StartsUsing',
      netRegex: { id: '9CC2', source: 'Fatebreaker' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      durationSeconds: 3,
      response: Responses.knockback(),
    },
    {
      id: 'Flu P1 Burnout',
      type: 'StartsUsing',
      netRegex: { id: '9CC6', source: 'Fatebreaker' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2.5,
      durationSeconds: 3,
      response: Responses.getOut(),
    },
    // //////////////// PHASE 2 //////////////////
    {
      id: 'Flu P2 Quadruple Slap',
      type: 'StartsUsing',
      netRegex: { id: '9CFF', source: 'Usurper of Frost' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'Flu P2 Diamond Dust',
      type: 'StartsUsing',
      netRegex: { id: '9D05', source: 'Usurper of Frost', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Flu P2 Axe Kick',
      type: 'StartsUsing',
      netRegex: { id: '9D0A', source: 'Oracle\'s Reflection', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Flu P2 Scythe Kick',
      type: 'StartsUsing',
      netRegex: { id: '9D0B', source: 'Oracle\'s Reflection', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Flu P2 Flower Target',
      type: 'HeadMarker',
      netRegex: { id: '0159' },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        const target = data.party.member(matches.target);
        if (data.role === 'dps') {
          if (target.role === 'dps')
            return output.flower!();
          return output.bait!();
        }
        if (target.role === 'dps')
          return output.bait!();
        return output.flower!();
      },
      outputStrings: {
        flower: {
          en: 'Flower on YOU',
          ko: '내게 얼음꽃 (먼쪽)',
        },
        bait: {
          en: 'Bait cone',
          ko: '원뿔 유도 (가까운쪽)',
        },
      },
    },
    {
      id: 'Flu P2 DD Knockback',
      type: 'StartsUsing',
      netRegex: { id: '9D10', source: 'Oracle\'s Reflection', capture: false },
      // 9D10 Sinbound Holy
      delaySeconds: 1,
      durationSeconds: 3,
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Sinbound Fire III/Sinbound Thunder III': 'Sinbound Fire/Thunder',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker': 'フェイトブレイカー',
        '\'s Image': 'の幻影',
        'Usurper of Frost': 'シヴァ・ミトロン',
        'Oracle\'s Reflection': '巫女の鏡像',
      },
    },
  ],
};

export default triggerSet;

// FLU / FUTURES REWRITTEN / 絶エデン / 絶もうひとつの未来
