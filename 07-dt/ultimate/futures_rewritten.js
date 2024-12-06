// import Conditions from '../../../../../resources/conditions';
const centerX = 100;
const centerY = 100;
const p1ConcealedStrings = {
  concealed: {
    en: '${action} ${dir1} / ${dir2}',
    ko: '${action} ${dir1}${dir2}',
  },
  autumn: {
    en: '${action} ${dir}',
    ko: '${action} ${dir}',
  },
  stack: Outputs.stacks,
  spread: Outputs.spreadOwn,
  front: {
    en: '(Go Front)',
    ja: '(前へ)',
    ko: '(앞으로, 내자리 아님)',
  },
  stay: {
    en: '(Stay)',
    ja: '(そのまま待機)',
    ko: '(당첨, 그대로 대기)',
  },
  ...AutumnDirections.outputStringsMarker8,
};
const p3UltimateIdKey = {
  '996': 'stack',
  '997': 'fire',
  '998': 'shadoweye',
  '99C': 'eruption',
  '99B': 'beam',
  '99D': 'water',
  '99E': 'blizzard',
  '9A0': 'return',
};
const p3UltimateStrings = {
  stack: Outputs.stacks,
  fire: {
    en: 'Fire',
    ko: '파이가',
  },
  shadoweye: {
    en: 'Gaze',
    ko: '시선',
  },
  eruption: Outputs.spread,
  beam: {
    en: 'Beam',
    ko: '빔유도',
  },
  water: {
    en: 'Water',
    ko: '워터가',
  },
  blizzard: {
    en: 'Blizzard',
    ko: '블리자가',
  },
  return: {
    en: 'Return',
    ko: '회귀',
  },
};
Options.Triggers.push({
  id: 'FuturesRewrittenUltimate',
  zoneId: ZoneId.FuturesRewrittenUltimate,
  config: [
    {
      id: 'consealedSafeType',
      name: {
        en: 'Consealed Safe Type',
        ko: '숨겨진 안전 위치',
      },
      type: 'select',
      options: {
        en: {
          'Normal': 'normal',
          'Autumn': 'autumn',
        },
        ko: {
          '그냥 알림': 'normal',
          '어듬이 전용': 'autumn',
        },
      },
      default: 'autumn',
    },
  ],
  timelineFile: 'futures_rewritten.txt',
  initData: () => ({
    phase: 'p1',
    actors: {},
    p1SafeMarkers: [...AutumnDirections.outputMarker8],
    p1FallColors: [],
    p1FallRoles: [],
    p2Curses: [],
    p2Ultimate: {},
    p2UltimateAutumn: [],
  }),
  timelineTriggers: [],
  triggers: [
    {
      id: 'FRU Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9CD4', '9CFF', '9D49'], capture: true },
      run: (data, matches) => {
        switch (matches.id) {
          case '9CD0':
          case '9CD4':
            data.phase = 'p1';
            break;
          case '9CFF':
            data.phase = 'p2';
            break;
          case '9D49': // hell judgement
            data.phase = 'p3';
            break;
        }
        data.actors = {};
      },
    },
    {
      id: 'FRU Actor Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}', capture: true },
      condition: (data) => data.phase === 'p1',
      run: (data, matches) => data.actors[matches.id] = matches,
    },
    // //////////////// PHASE 1 //////////////////
    {
      id: 'FRU P1 Cyclonic Break Fire',
      type: 'StartsUsing',
      netRegex: { id: ['9CD0', '9D89'], capture: false },
      durationSeconds: 7,
      response: Responses.stackPartner(),
    },
    {
      id: 'FRU P1 Cyclonic Break Lightning',
      type: 'StartsUsing',
      netRegex: { id: ['9CD4', '9D8A'], capture: false },
      durationSeconds: 7,
      response: Responses.spread(),
    },
    {
      id: 'FRU P1 Powder Mark Trail',
      type: 'StartsUsing',
      netRegex: { id: '9CE8', source: 'Fatebreaker' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'FRU P1 Utopian Sky Collect',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker' },
      run: (data, matches) => data.p1UtopianColor = matches.id === '9CDA' ? 'red' : 'blue',
    },
    {
      id: 'FRU P1 Concealed Safe',
      type: 'ActorControlExtra',
      netRegex: { category: '003F', param1: '4', capture: true },
      condition: (data) => data.phase === 'p1' && data.p1UtopianColor !== undefined,
      delaySeconds: 0.5,
      durationSeconds: (data) => data.triggerSetConfig.consealedSafeType === 'autumn' ? 2.5 : 7,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...p1ConcealedStrings,
        };
        const image = data.actors[matches.id];
        if (image === undefined)
          return;
        const dir = Directions.hdgTo8DirNum(parseFloat(image.heading));
        const dir1 = AutumnDirections.outputFromMarker8Num(dir);
        const dir2 = AutumnDirections.outputFromMarker8Num((dir + 4) % 8);
        data.p1SafeMarkers = data.p1SafeMarkers.filter((d) => d !== dir1 && d !== dir2);
        if (data.p1SafeMarkers.length !== 2)
          return;
        const [m1, m2] = data.p1SafeMarkers;
        if (data.triggerSetConfig.consealedSafeType === 'autumn') {
          // 어듬이 전용
          const autumnDir = ['markerN', 'markerNW', 'markerW', 'markerSW'];
          data.p1SafeAutumn = autumnDir.includes(m1) ? m1 : m2;
          if (data.p1SafeAutumn === 'markerN')
            return { alertText: output.stay() };
          return { alertText: output.front() };
        }
        const action = data.p1UtopianColor === 'red' ? output.stack() : output.spread();
        return {
          infoText: output.concealed({
            dir1: output[m1](),
            dir2: output[m2](),
            action: action,
          }),
        };
      },
    },
    {
      id: 'FRU P1 Concealed Autumn',
      type: 'StartsUsing',
      netRegex: { id: ['9CDA', '9CDB'], source: 'Fatebreaker', capture: false },
      condition: (data) => data.triggerSetConfig.consealedSafeType === 'autumn',
      delaySeconds: 11.5,
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.p1SafeAutumn === undefined)
          return;
        const action = data.p1UtopianColor === 'red' ? output.stack() : output.spread();
        return output.autumn({ dir: output[data.p1SafeAutumn](), action: action });
      },
      run: (data) => delete data.p1SafeAutumn,
      outputStrings: {
        ...p1ConcealedStrings,
      },
    },
    {
      id: 'FRU P1 Turn of the Heavens',
      type: 'StartsUsing',
      netRegex: { id: ['9CD6', '9CD7'], source: 'Fatebreaker\'s Image' },
      durationSeconds: 11,
      infoText: (_data, matches, output) => {
        const safe = matches.id === '9CD6' ? 'blue' : 'red';
        return output.text({ safe: output[safe]() });
      },
      outputStrings: {
        text: {
          en: '${safe} Safe',
          ko: '${safe} 안전',
        },
        blue: Outputs.blue,
        red: Outputs.red,
      },
    },
    {
      id: 'FRU P1 Blastburn',
      type: 'StartsUsing',
      netRegex: { id: ['9CC2', '9CE2'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1.5,
      durationSeconds: 2.5,
      response: Responses.knockback(),
    },
    {
      id: 'FRU P1 Burnout',
      type: 'StartsUsing',
      netRegex: { id: ['9CC6', '9CE4'] },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2.5,
      durationSeconds: 2.5,
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
      id: 'FRU P1 Fall of Faith Collect',
      type: 'Tether',
      netRegex: { id: ['00F9', '011F'] },
      condition: (data, _matches) => data.phase === 'p1' && data.p1Falled,
      durationSeconds: 3,
      alertText: (data, matches, output) => {
        const color = matches.id === '00F9' ? 'red' : 'blue';
        data.p1FallColors.push(color);
        const index = data.p1FallColors.length;
        if (matches.target === data.me) {
          data.p1FallRoles = [];
          data.p1FallSide = index % 2 === 0 ? 'right' : 'left';
          return output.mine({ num: index, color: output[color]() });
        }
        if (data.options.OnlyAutumn) {
          // 힐러 둘 다 안걸리면 어듬이는 오른쪽으로
          const member = data.party.member(matches.target);
          data.p1FallRoles.push(member.role ?? 'none');
          if (data.p1FallRoles.length === 4) {
            const healers = data.p1FallRoles.filter((r) => r === 'healer').length;
            if (healers === 0) {
              data.p1FallSide = 'right';
              return output.getRightAndEast();
            }
            data.p1FallSide = 'left';
            return output.getLeftAndWest();
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
        let colors;
        if (data.p1FallSide === undefined)
          colors = data.p1FallColors.map((c) => output[c]());
        else if (data.p1FallSide === 'left')
          colors = [data.p1FallColors[0], data.p1FallColors[2]].map((c) => output[c]());
        else
          colors = [data.p1FallColors[1], data.p1FallColors[3]].map((c) => output[c]());
        return output.res({ res: colors.join(output.next()) });
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
      id: 'FRU P2 Axe/Scythe Kick Collect',
      type: 'StartsUsing',
      netRegex: { id: ['9D0A', '9D0B'], source: 'Oracle\'s Reflection' },
      run: (data, matches) => data.p2Kick = matches.id === '9D0A' ? 'axe' : 'scythe',
    },
    {
      id: 'FRU P2 Icicle Impact Initial Collect',
      type: 'StartsUsing',
      netRegex: { id: '9D06' },
      suppressSeconds: 1,
      run: (data, matches) => {
        const x = parseInt(matches.x);
        const y = parseInt(matches.y);
        data.p2Knockback = Directions.xyTo8DirNum(x, y, centerX, centerY);
      },
    },
    {
      id: 'FRU P2 Frigid Stone',
      type: 'HeadMarker',
      netRegex: { id: '0159' },
      durationSeconds: 5,
      suppressSeconds: 1,
      alertText: (data, matches, output) => {
        const cardinal = data.p2Knockback !== undefined && data.p2Knockback % 2 === 0;
        const [rf, rb] = cardinal ? ['intercard', 'cardinal'] : ['cardinal', 'intercard'];
        const kick = data.p2Kick === undefined ? '' : output[data.p2Kick]();
        const target = data.party.member(matches.target);
        if (data.options.OnlyAutumn) {
          // 어듬이는 TH팀이예여
          data.p2Flower = target.role === 'dps' ? false : true;
        }
        if (data.role === 'dps') {
          if (target.role === 'dps')
            return output.flower({ kick: kick, ind: output[rf]() });
          return output.cone({ kick: kick, ind: output[rb]() });
        }
        if (target.role === 'dps')
          return output.cone({ kick: kick, ind: output[rb]() });
        return output.flower({ kick: kick, ind: output[rf]() });
      },
      run: (data, _matches) => data.actors = {},
      outputStrings: {
        flower: {
          en: '${kick} + ${ind} => Bait Flower',
          ko: '${kick} + ${ind} (얼음꽃 설치)',
        },
        cone: {
          en: '${kick} + ${ind} => Bait Cone',
          ko: '${kick} + ${ind} (원뿔 유도)',
        },
        cardinal: {
          en: 'Cardinal',
          ko: '십자',
        },
        intercard: {
          en: 'Intercard',
          ko: '비스듬',
        },
        axe: Outputs.out,
        scythe: Outputs.in,
      },
    },
    {
      id: 'FRU P2 Axe Kick Frigid Needle',
      type: 'StartsUsing',
      netRegex: { id: '9D0A', source: 'Oracle\'s Reflection' },
      condition: (data, _matches) => data.options.OnlyAutumn,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.5,
      alarmText: (data, _matches, output) => {
        if (data.p2Flower !== undefined && !data.p2Flower)
          return output.text();
      },
      outputStrings: {
        text: {
          en: 'Go center',
          ko: '움직여요! 한가운데로!',
        },
      },
    },
    {
      id: 'FRU P2 Heavenly Strike',
      type: 'Ability',
      netRegex: { id: '9D07', source: 'Usurper of Frost', capture: false },
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.p2Knockback === undefined)
          return output.autumn({ dir: output.unknown() });
        const dir = data.p2Knockback;
        const m1 = AutumnDirections.outputFromMarker8Num(dir < 4 ? dir : dir - 4);
        const m2 = AutumnDirections.outputFromMarker8Num(dir < 4 ? dir + 4 : dir);
        if (data.options.OnlyAutumn) {
          // 어듬이는 MT팀이예여
          const autumnDir = ['markerN', 'markerNE', 'markerW', 'markerNW'];
          const dir = autumnDir.includes(m1) ? m1 : m2;
          return output.autumn({ dir: output[dir]() });
        }
        return output.knockback({ dir1: output[m1](), dir2: output[m2]() });
      },
      run: (data, _matches) => data.p2Knockback = undefined,
      outputStrings: {
        knockback: {
          en: 'Knockback ${dir1} / ${dir2}',
          ko: '넉백 ${dir1}${dir2}',
        },
        autumn: {
          en: 'Knockback ${dir}',
          ko: '넉백 ${dir}',
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
      id: 'FRU P2 Twin Slip',
      type: 'StartsUsing',
      netRegex: { id: ['9D01', '9D02'], source: 'Oracle\'s Reflection', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.5,
      alarmText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Slip',
          ko: '미끄러져요!',
        },
      },
    },
    {
      id: 'FRU P2 Hallowed Ray',
      type: 'StartsUsing',
      netRegex: { id: '9D12', capture: false },
      response: Responses.aoe(),
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
    {
      id: 'FRU P2 Chains of Evelasting Light',
      type: 'GainsEffect',
      netRegex: { effectId: '103D' },
      condition: (data, matches) => !data.options.OnlyAutumn && data.me === matches.target,
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Chain',
          ko: '내게 체인, 맡은 자리로',
        },
      },
    },
    {
      id: 'FRU P2 Curse of Everlasting Light',
      type: 'HeadMarker',
      netRegex: { id: '0177' },
      condition: (data, matches) => {
        if (data.phase !== 'p2')
          return;
        data.p2Curses.push(matches.target);
        return data.p2Curses.length === 2;
      },
      durationSeconds: 6,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          text: {
            en: 'AOE on YOU (${player})',
            ko: '내게 장판! (${player})',
          },
          chain: {
            en: 'Chain ${mark}',
            ko: '내게 체인! ${mark} 마커로!',
          },
          cnum4: Outputs.cnum4,
          cmarkC: Outputs.cmarkC,
          left: Outputs.getLeftAndWest,
          right: Outputs.getRightAndEast,
          unknown: Outputs.unknown,
        };
        if (!data.p2Curses.includes(data.me)) {
          if (data.options.OnlyAutumn) {
            // 어듬이 전용
            const p1 = data.party.member(data.p2Curses.shift());
            const p2 = data.party.member(data.p2Curses.shift());
            if (p1 === undefined || p2 === undefined)
              return;
            if (p1.job === 'AST' || p2.job === 'AST' || p1.job === 'WHM' || p2.job === 'WHM')
              return { alertText: output.chain({ mark: output.cnum4() }) };
            return { alertText: output.chain({ mark: output.cmarkC() }) };
          }
          return;
        }
        const partner = data.party.member(data.p2Curses.find((p) => p !== data.me));
        if (partner === undefined)
          return { infoText: output.text({ player: output.unknown() }) };
        return { infoText: output.text({ player: partner.nick }) };
      },
    },
    {
      id: 'FRU P2 the House of Light',
      type: 'StartsUsing',
      netRegex: { source: 'Usurper of Frost', id: '9CFD', capture: false },
      infoText: (_data, _matches, output) => output.spread(),
      outputStrings: {
        spread: Outputs.spreadOwn,
      },
    },
    // //////////////// PHASE 3 //////////////////
    {
      id: 'FRU P3 Ultimate Relativity',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      response: Responses.bigAoe(),
      run: (data) => data.p2Relativity = 'ultimate',
    },
    {
      id: 'FRU P3 Ultimate Relativity Debuff Collect',
      type: 'GainsEffect',
      // 996 Spell-in-Waiting: Unholy Darkness
      // 997 Spell-in-Waiting: Dark Fire III
      // 998 Spell-in-Waiting: Shadoweye
      // 99C Spell-in-Waiting: Dark Eruption
      // 99B 빔 유도?
      // 99D Spell-in-Waiting: Dark Water III
      // 99E Spell-in-Waiting: Dark Blizzard III
      // 9A0 Spell-in-Waiting: Return
      netRegex: { effectId: ['99[678BCDE]', '9A0'] },
      condition: (data, matches) => data.p2Relativity === 'ultimate' && matches.target === data.me,
      run: (data, matches) => {
        data.p2Ultimate[matches.effectId.toUpperCase()] = parseFloat(matches.duration);
      },
    },
    {
      id: 'FRU P3 Ultimate Relativity Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: '99B', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 0.1,
      durationSeconds: (data) => data.options.OnlyAutumn ? 6 : 41,
      suppressSeconds: 0.1,
      infoText: (data, _matches, output) => {
        const ids = Object.keys(data.p2Ultimate).sort((a, b) =>
          (data.p2Ultimate[a] ?? 0) - (data.p2Ultimate[b] ?? 0)
        );
        const keys = ids.map((id) => p3UltimateIdKey[id]);
        if (keys === undefined || keys.length === 0)
          return;
        for (const key of keys) {
          if (key === undefined)
            throw new UnreachableCode();
        }
        if (data.options.OnlyAutumn) {
          // 어듬이는 TH팀이예여
          let role;
          if (data.p2Ultimate['99E'] !== undefined)
            role = 'blizzard';
          else {
            const fire = data.p2Ultimate['997'];
            if (fire === undefined)
              role = 'none';
            else if (fire > 30)
              role = 'fire31';
            else if (fire > 20)
              role = 'fire21';
            else
              role = 'fire11';
          }
          if (role === undefined)
            throw new UnreachableCode();
          switch (role) {
            case 'blizzard': // attack3
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('🡻블리자가 버려요');
              data.p2UltimateAutumn.push('🡻빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻블리자가 (attack3)';
            case 'fire11': // attack3
              data.p2UltimateAutumn.push('🡻파이가 버려요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡻빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻빠른 파이가 (attack3)';
            case 'fire21': // stop1
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('🡸파이가 버려요');
              data.p2UltimateAutumn.push('(기둘려요)');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡸빔 유도 🔜 피하면서 바깥봐요');
              return '🡸중간 파이가 (stop1)';
            case 'fire31': // bind1 또는 bind2
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡿빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데 리턴 설치');
              data.p2UltimateAutumn.push('🡿파이가 버려요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡿느린 파이가 (바인드 마커 달아!!!)';
            case 'none': // attack3
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('모래시계 리턴 설치');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('🡻빔 유도');
              data.p2UltimateAutumn.push('한가운데서 뭉쳐요');
              data.p2UltimateAutumn.push('한가운데서 바깥봐요');
              return '🡻무직 (attack3)';
          }
        }
        const res = keys.map((key) => output[key]());
        return res.join(output.next());
      },
      outputStrings: {
        ...p3UltimateStrings,
        next: Outputs.next,
      },
    },
    {
      id: 'FRU P3 절 시간압축 #1',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 5 + 11,
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text({ mesg: mesg });
        return '응?';
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #2',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 6 + 16,
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #3',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 6 + 21,
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #4',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 6 + 26,
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #5',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 6 + 31,
      durationSeconds: 3.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 절 시간압축 #6',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle of Darkness', id: '9D4A', capture: false },
      condition: (data) => data.p2Relativity === 'ultimate',
      delaySeconds: 5 + 42,
      durationSeconds: 4.5,
      alertText: (data, _matches, output) => {
        const mesg = data.p2UltimateAutumn.shift();
        if (mesg !== undefined)
          return output.text({ mesg: mesg });
      },
      outputStrings: {
        text: {
          en: '${mesg}',
          ko: '${mesg}',
        },
      },
    },
    {
      id: 'FRU P3 Darkest Dance',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9CF5', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tanksOutPartyIn();
        return output.partyInTanksOut();
      },
      outputStrings: {
        partyInTanksOut: {
          en: 'Party In (Tanks Out)',
          ko: '안으로 (탱크가 밖으로)',
        },
        tanksOutPartyIn: {
          en: 'Tanks Out (Party In)',
          ko: '바깥으로 (파티는 안)',
        },
      },
    },
    {
      id: 'FRU P3 Somber Dance',
      type: 'Ability',
      netRegex: { source: 'Oracle Of Darkness', id: '9D5B', capture: false },
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.tanksInPartyOut();
        return output.partyOutTanksIn();
      },
      outputStrings: {
        partyOutTanksIn: {
          en: 'Party Out (Tanks In)',
          ko: '밖으로 (탱크가 안으로)',
        },
        tanksInPartyOut: {
          en: 'Tanks In (Party Out)',
          ko: '보스 밑으로 (파티는 바깥)',
        },
      },
    },
    {
      id: 'FRU P3 Shell Crusher',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9D5E', capture: false },
      response: Responses.getTogether(),
    },
    {
      id: 'FRU P3 Spirit Taker',
      type: 'Ability',
      netRegex: { source: 'Oracle Of Darkness', id: '9D60', capture: false },
      suppressSeconds: 1,
      response: Responses.spread(),
    },
    {
      id: 'FRU P3 Black Halo',
      type: 'StartsUsing',
      netRegex: { source: 'Oracle Of Darkness', id: '9D62' },
      response: Responses.sharedOrInvinTankBuster(),
    },
    // //////////////// PHASE 4 //////////////////
    // //////////////// PHASE 5 //////////////////
    // CFB Dark Registance Down II
    // 9A1 Ice Resistance Down II
    // 1044 Light Registance Down II
    // 111F Fire Resistance Down II
    // 99F Spell-in-Waiting: Dark Aero III
    // 995 Return IV
    // 104E Spell-in-Waiting: Quietus
    // 1070 Spell-in-Waiting: Return
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Sinbound Fire III/Sinbound Thunder III': 'Sinbound Fire/Thunder',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker(?!\')': 'fusioniert(?:e|er|es|en) Ascian',
        'Fatebreaker\'s Image': 'Abbild des fusionierten Ascians',
      },
      'replaceText': {
        'Blastburn': 'Brandstoß',
        'Blasting Zone': 'Erda-Detonation',
        'Burn Mark': 'Brandmal',
        'Burnished Glory': 'Leuchtende Aureole',
        'Burnout': 'Brandentladung',
        'Burnt Strike': 'Brandschlag',
        'Cyclonic Break': 'Zyklon-Brecher',
        'Explosion': 'Explosion',
        'Fall Of Faith': 'Sünden-Erdspaltung',
        'Floating Fetters': 'Schwebende Fesseln',
        'Powder Mark Trail': 'Stetes Pulvermal',
        'Sinblaze': 'Sündenglut',
        'Sinbound Fire III': 'Sünden-Feuga',
        'Sinbound Thunder III': 'Sünden-Blitzga',
        'Sinsmite': 'Sündenblitz',
        'Sinsmoke': 'Sündenflamme',
        'Turn Of The Heavens': 'Kreislauf der Wiedergeburt',
        'Utopian Sky': 'Paradiestrennung',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker(?!\')': 'Sabreur de destins',
        'Fatebreaker\'s Image': 'double du Sabreur de destins',
      },
      'replaceText': {
        'Blastburn': 'Explosion brûlante',
        'Blasting Zone': 'Zone de destruction',
        'Burn Mark': 'Marque explosive',
        'Burnished Glory': 'Halo luminescent',
        'Burnout': 'Combustion totale',
        'Burnt Strike': 'Frappe brûlante',
        'Cyclonic Break': 'Brisement cyclonique',
        'Explosion': 'Explosion',
        'Fall Of Faith': 'Section illuminée',
        'Floating Fetters': 'Entraves flottantes',
        'Powder Mark Trail': 'Marquage fatal enchaîné',
        'Sinblaze': 'Embrasement authentique',
        'Sinbound Fire III': 'Méga Feu authentique',
        'Sinbound Thunder III': 'Méga Foudre authentique',
        'Sinsmite': 'Éclair du péché',
        'Sinsmoke': 'Flammes du péché',
        'Turn Of The Heavens': 'Cercles rituels',
        'Utopian Sky': 'Ultime paradis',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Fatebreaker(?!\')': 'フェイトブレイカー',
        'Fatebreaker\'s Image': 'フェイトブレイカーの幻影',
        'Usurper of Frost': 'シヴァ・ミトロン',
        'Oracle\'s Reflection': '巫女の鏡像',
        'Frozen Mirror': '氷面鏡',
        'Oracle of Darkness': '闇の巫女',
        'Pandora': 'パンドラ・ミトロン',
      },
      'replaceText': {
        'Blastburn': 'バーンブラスト',
        'Blasting Zone': 'ブラスティングゾーン',
        'Burn Mark': '爆印',
        'Burnished Glory': '光焔光背',
        'Burnout': 'バーンアウト',
        'Burnt Strike': 'バーンストライク',
        'Cyclonic Break': 'サイクロニックブレイク',
        'Explosion': '爆発',
        'Fall Of Faith': 'シンソイルセヴァー',
        'Floating Fetters': '浮遊拘束',
        'Powder Mark Trail': '連鎖爆印刻',
        'Sinblaze': 'シンブレイズ',
        'Sinbound Fire III': 'シンファイガ',
        'Sinbound Thunder III': 'シンサンダガ',
        'Sinsmite': 'シンボルト',
        'Sinsmoke': 'シンフレイム',
        'Turn Of The Heavens': '転輪召',
        'Utopian Sky': '楽園絶技',
      },
    },
  ],
});
// FRU / FUTURES REWRITTEN (Ultimate) / 絶エデン / 絶もうひとつの未来
