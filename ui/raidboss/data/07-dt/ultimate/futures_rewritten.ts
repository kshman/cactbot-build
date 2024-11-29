import { AutumnDirections, MarkerOutput8 } from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { Role } from '../../../../../types/job';
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
  p1FallRoles: Role[];
  p2Knockback?: number;
  p2Frosted?: boolean;
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
    p1FallRoles: [],
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
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.pair!(),
      outputStrings: {
        pair: Outputs.stackPartner,
      },
    },
    {
      id: 'FRU P1 Cyclonic Break Lightning',
      type: 'StartsUsing',
      netRegex: { id: ['9CD4', '9D8A'], capture: false },
      durationSeconds: 7,
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
      id: 'FRU P1 Utopian Sky Collector',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker' },
      run: (data, matches) => data.p1Color = matches.id === '9CDA' ? 'red' : 'blue',
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
      durationSeconds: 11,
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
      durationSeconds: 11,
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
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      durationSeconds: 3,
      response: Responses.knockback(),
    },
    {
      id: 'FRU P1 Burnout',
      type: 'StartsUsing',
      netRegex: { id: ['9CC6', '9CE4'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3.5,
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
      condition: (data) => !data.p1Falled,
      run: (data, _matches) => {
        data.p1Falled = true;
        data.p1FallColors = [];
        data.p1FallRoles = [];
      },
    },
    {
      id: 'FRU P1 Fall of Faith Collector',
      type: 'Tether',
      netRegex: { id: ['00F9', '011F'] },
      condition: (data, _matches) => data.phase === 'p1' && data.p1Falled,
      durationSeconds: 3,
      alertText: (data, matches, output) => {
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.p1FallColors.push(color);
        if (matches.target === data.me) {
          data.p1FallRoles = [];
          return output.mine!({ num: data.p1FallColors.length, color: output[color]!() });
        }

        if (data.options.OnlyAutumn) {
          // 힐러 둘 다 안걸리면 어듬이는 오른쪽으로
          const member = data.party.member(matches.target);
          data.p1FallRoles.push(member.role ?? 'none');
          if (data.p1FallRoles.length === 4) {
            const healers = data.p1FallRoles.filter((r) => r === 'healer').length;
            return healers === 0 ? output.getRightAndEast!() : output.getLeftAndWest!();
          }
        }
      },
      outputStrings: {
        mine: {
          en: '${num} ${color}',
          ko: '내가 ${num}번째 ${color}',
        },
        red: Outputs.red,
        blue: Outputs.blue,
        getLeftAndWest: Outputs.getLeftAndWest,
        getRightAndEast: Outputs.getRightAndEast,
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
      id: 'FRU P2 Icicle Impact',
      type: 'StartsUsing',
      netRegex: { id: '9D06', source: 'Usurper of Frost', capture: false },
      suppressSeconds: 1,
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
      /*
      alertText: (data, _matches, output) => {
        if (data.p2Frosted && data.role !== 'tank' && !data.CanFeint())
          return;
        return output.in!();
      },
      outputStrings: {
        in: Outputs.in,
      },
      */
    },
    {
      id: 'FRU P2 Flower Target',
      type: 'HeadMarker',
      netRegex: { id: '0159' },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        let cardinal = false;
        const actors = Object.values(data.actors);
        if (actors.length >= 3 && actors[1] !== undefined) {
          data.p2Knockback = Directions.hdgTo8DirNum(parseFloat(actors[1].heading));
          if (data.p2Knockback % 2 === 0)
            cardinal = true;
        }
        const [rf, rb] = cardinal ? ['intercard', 'cardinal'] : ['cardinal', 'intercard'];

        const target = data.party.member(matches.target);
        if (data.role === 'dps') {
          if (target.role === 'dps')
            return output.flower!({ ind: output[rf]!() });
          return output.bait!({ ind: output[rb]!() });
        }
        if (target.role === 'dps')
          return output.bait!({ ind: output[rb]!() });
        return output.flower!({ ind: output[rf]!() });
      },
      run: (data, _matches) => data.actors = {},
      outputStrings: {
        flower: {
          en: '${ind} => Bait Flower',
          ko: '${ind} 🔜 얼음꽃 설치',
        },
        bait: {
          en: '${ind} => Bait Cone',
          ko: '${ind} 🔜 원뿔 유도',
        },
        cardinal: {
          en: 'cardinal',
          ko: '십자로',
        },
        intercard: {
          en: 'intercard',
          ko: '비스듬히',
        },
      },
    },
    {
      id: 'FRU P2 DD Knockback',
      type: 'StartsUsing',
      netRegex: { id: ['9D0A', '9D0B'], source: 'Oracle\'s Reflection', capture: false },
      condition: (data) => !data.p2Frosted,
      delaySeconds: 9,
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.p2Knockback === undefined)
          return output.knockback!({ dir1: output.unknown!(), dir2: output.unknown!() });
        let values = [data.p2Knockback, (data.p2Knockback + 4) % 8];
        if (values[0]! > values[1]!)
          values = values.reverse();
        const dir1 = AutumnDirections.outputFromMarker8Num(values[0]!);
        const dir2 = AutumnDirections.outputFromMarker8Num(values[1]!);
        if (data.options.OnlyAutumn) {
          // 어듬이는 MT팀이예여
          const autumnDir: MarkerOutput8[] = ['markerN', 'markerNE', 'markerW', 'markerNW'];
          const dir = autumnDir.includes(dir1) ? dir1 : dir2;
          return output.autumn!({
            dir: output[dir]!(),
            dir1: output[dir1]!(),
            dir2: output[dir2]!(),
          });
        }
        return output.knockback!({ dir1: output[dir1]!(), dir2: output[dir2]!() });
      },
      run: (data, _matches) => data.p2Knockback = undefined,
      outputStrings: {
        knockback: {
          en: 'Knockback ${dir1} / ${dir2}',
          ko: '넉백 ${dir1}${dir2}',
        },
        autumn: {
          en: 'Knockback ${dir} (${dir1} / ${dir2})',
          ko: '넉백 ${dir} (${dir1}${dir2})',
        },
        unknown: Outputs.unknown,
        ...AutumnDirections.outputStringsMarker8,
      },
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
    {
      // 이거 대체할 수 있는 방법이 있을까? p2Frosted 변수를 안쓰는 쪽으로
      id: 'FRU P2 Frosted',
      type: 'Ability',
      netRegex: { id: '9CF8', source: 'Oracle\'s Reflection', capture: false },
      run: (data) => data.p2Frosted = true,
    },
    {
      id: 'FRU P2 Hallowed Ray',
      type: 'StartsUsing',
      netRegex: { id: '9D12', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'FRU P2 Mirror Mirror',
      type: 'StartsUsing',
      netRegex: { id: '9CF3', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' || data.CanFeint())
          return output.oppose!();
        return output.mirror!();
      },
      outputStrings: {
        oppose: {
          en: 'Opposition White Mirror',
          ko: '흰 거울 반대쪽으로',
        },
        mirror: {
          en: 'Go White Mirror',
          ko: '흰 거울 쪽으로',
        },
      },
    },
    {
      id: 'FRU P2 Banish III Pair',
      type: 'StartsUsing',
      netRegex: { id: '9D1C', capture: false },
      response: Responses.stackPartner('info'),
    },
    {
      id: 'FRU P2 Banish III Spread',
      type: 'StartsUsing',
      netRegex: { id: '9D1D', capture: false },
      response: Responses.spread(),
    },
    // //////////////// PHASE 3 //////////////////
    // //////////////// PHASE 4 //////////////////
    // //////////////// PHASE 5 //////////////////
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

// FRU / FUTURES REWRITTEN (Ultimate) / 絶エデン / 絶もうひとつの未来
