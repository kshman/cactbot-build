import { AutumnDirections, MarkerOutput8 } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

type Phase = 'p1' | 'p2';
type RedBlue = 'red' | 'blue';

export interface Data extends RaidbossData {
  phase: Phase;
  actors: { [id: string]: NetMatches['ActorSetPos'] };
  safeMarkers: MarkerOutput8[];
  p1Color?: RedBlue;
  p1Falled?: boolean;
  p1FallColors: RedBlue[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'FuturesRewrittenUltimate',
  zoneId: ZoneId.FuturesRewrittenUltimate,
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    actors: {},
    safeMarkers: [],
    p1FallColors: [],
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'FRU Phase Tracker',
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
        data.actors = {};
        data.safeMarkers = [...AutumnDirections.outputMarker8];
      },
    },
    {
      id: 'FRU Actor Collector',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}', capture: true },
      run: (data, matches) => data.actors[matches.id] = matches,
    },
    // //////////////// PHASE 1 //////////////////
    {
      id: 'FRU P1 Cyclonic Break Fire',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9D89'], capture: false },
      infoText: (_data, _matches, output) => output.pair!(),
      outputStrings: {
        pair: Outputs.pair,
      },
    },
    {
      id: 'FRU P1 Cyclonic Break Lightning',
      type: 'StartsUsing',
      netRegex: { id: ['9CD4', '9D8A'], capture: false },
      infoText: (_data, _matches, output) => output.spread!(),
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'FRU P1 Powder Mark Trail',
      type: 'StartsUsing',
      netRegex: { id: '9CE8', source: 'Fatebreaker' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'FRU P1 Utopian Sky',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker' },
      infoText: (data, matches, output) => {
        if (matches.id === '9CDA') {
          data.p1Color = 'red';
          return output.stack!();
        }
        data.p1Color = 'blue';
        return output.spread!();
      },
      outputStrings: {
        stack: {
          en: '(Stack later)',
          ko: '(나중에 🔴뭉쳐요)',
        },
        spread: {
          en: '(Spread later)',
          ko: '(나중에 🔵흩어져요)',
        },
      },
    },
    {
      id: 'FRU P1 Concealed Safe Zone',
      type: 'ActorControlExtra',
      netRegex: { category: '003F', param1: '4', capture: true },
      condition: (data) => data.p1Color !== undefined,
      durationSeconds: 7,
      infoText: (data, matches, output) => {
        const image = data.actors[matches.id];
        if (image === undefined)
          return;
        const dir1 = Directions.hdgTo8DirNum(parseFloat(image.heading));
        const dir2 = (dir1 + 4) % 8;
        data.safeMarkers = data.safeMarkers.filter((dir) =>
          dir !== AutumnDirections.outputFromMarker8Num(dir1) &&
          dir !== AutumnDirections.outputFromMarker8Num(dir2)
        );
        if (data.safeMarkers.length !== 2)
          return;
        const [m1, m2] = data.safeMarkers;
        if (m1 === undefined || m2 === undefined)
          return;
        return output.text!({
          dir1: output[m1]!(),
          dir2: output[m2]!(),
          action: data.p1Color === 'red' ? output.stack!() : output.spread!(),
        });
      },
      outputStrings: {
        text: {
          en: '${dir1} / ${dir2} => ${action}',
          ko: '${dir1}${dir2} 🔜 ${action}',
        },
        stack: Outputs.stacks,
        spread: Outputs.spread,
        ...AutumnDirections.outputStringsMarker8,
      },
    },
    {
      id: 'FRU P1 Turn of the Heavens Fire',
      type: 'StartsUsing',
      netRegex: { id: '9CD6', source: 'Fatebreaker\'s Image', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.blueSafe!(),
      outputStrings: {
        blueSafe: {
          en: 'Blue Safe',
          ko: '🔵파랑 안전',
        },
      },
    },
    {
      id: 'FRU P1 Turn of the Heavens Lightning',
      type: 'StartsUsing',
      netRegex: { id: '9CD7', source: 'Fatebreaker\'s Image', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.redSafe!(),
      outputStrings: {
        redSafe: {
          en: 'Red Safe',
          ko: '🔴빨강 안전',
        },
      },
    },
    {
      id: 'FRU P1 Blastburn',
      type: 'StartsUsing',
      netRegex: { id: ['9CC2', '9CE2'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      durationSeconds: 3,
      response: Responses.knockback(),
    },
    {
      id: 'FRU P1 Burnout',
      type: 'StartsUsing',
      netRegex: { id: ['9CC6', '9CE4'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2.5,
      durationSeconds: 3,
      response: Responses.getOut(),
    },
    {
      id: 'FRU P1 Burnished Glory',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      durationSeconds: 5,
      response: Responses.bleedAoe(),
    },
    {
      id: 'FRU P1 Fall of Faith',
      type: 'StartsUsing',
      netRegex: { id: '9CEA', source: 'Fatebreaker', capture: false },
      delaySeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.p1Falled)
          return;
        data.p1Falled = true;
        data.p1FallColors = [];
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
      id: 'FRU P1 Fall of Faith Collector',
      type: 'Tether',
      netRegex: { id: ['00F9', '011F'] },
      condition: (data, _matches) => data.phase === 'p1' && data.p1Falled,
      durationSeconds: 4,
      alertText: (data, matches, output) => {
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.p1FallColors.push(color);
        if (matches.target === data.me)
          return output.mine!({ num: data.p1FallColors.length, color: output[color]!() });
      },
      outputStrings: {
        red: Outputs.red,
        blue: Outputs.blue,
        mine: {
          en: '${num} ${color}',
          ko: '내가 ${num}번째 ${color}',
        },
      },
    },
    {
      id: 'FRU P1 Fall of Faith Order',
      type: 'Ability',
      netRegex: { id: ['9CC9', '9CCC'], source: 'Fatebreaker', capture: false },
      condition: (data) => data.p1FallColors.length === 4,
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        const colors = data.p1FallColors.map((c) => output[c]!());
        return output.res!({ res: colors.join(output.next!()) });
      },
      outputStrings: {
        red: Outputs.red,
        blue: Outputs.blue,
        next: Outputs.next,
        res: {
          en: '${res}',
          ko: '${res}',
        },
      },
    },
    // //////////////// PHASE 2 //////////////////
    {
      id: 'FRU P2 Quadruple Slap',
      type: 'StartsUsing',
      netRegex: { id: '9CFF', source: 'Usurper of Frost' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'FRU P2 Diamond Dust',
      type: 'StartsUsing',
      netRegex: { id: '9D05', source: 'Usurper of Frost', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'FRU P2 Axe Kick',
      type: 'StartsUsing',
      netRegex: { id: '9D0A', source: 'Oracle\'s Reflection', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'FRU P2 Scythe Kick',
      type: 'StartsUsing',
      netRegex: { id: '9D0B', source: 'Oracle\'s Reflection', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'FRU P2 Flower Target',
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
          ko: '원뿔 유도 (가까운쪽, 유도하고 움직이지마)',
        },
      },
    },
    {
      id: 'FRU P2 DD Knockback',
      type: 'StartsUsing',
      netRegex: { id: '9D10', source: 'Oracle\'s Reflection', capture: false },
      // 9D10 Sinbound Holy
      delaySeconds: 1,
      durationSeconds: 3,
      response: Responses.knockback(),
    },
    {
      id: 'FRU P2 Twin Stillness',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle\'s Reflection', id: '9D01', capture: false },
      response: Responses.getBackThenFront('alert'),
    },
    {
      id: 'FRU P2 Twin Silence',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle\'s Reflection', id: '9D02', capture: false },
      response: Responses.getFrontThenBack('alert'),
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

// FRU / FUTURES REWRITTEN / 絶エデン / 絶もうひとつの未来
