const centerX = 100;
const centerY = 100;
const phases = {
  'A3C8': 'pack',
  'A3CB': 'saber',
  'A3C1': 'beckon', // Beckon Moonlight
};
const fangPairs = {
  'A39D': 'windPlus',
  'A39E': 'windCross',
  'A3A1': 'stonePlus',
  'A3A2': 'stoneCross',
};
const swStrings = {
  combo: {
    en: '${debuff} ${num}',
    ja: '(${debuff} ${num}番目)',
    ko: '(${debuff} ${num}번째)',
  },
  now: {
    en: '${debuff} Now!',
    ja: '今 ${debuff}',
    ko: '지금 문대요: ${debuff}',
  },
  stone: {
    en: 'Stone',
    ja: '🟡石',
    ko: '🟡돌멩이',
  },
  wind: {
    en: 'Wind',
    ja: '🟢風',
    ko: '🟢바람',
  },
  unknown: Outputs.unknown,
};
Options.Triggers.push({
  id: 'AacCruiserweightM4Savage',
  zoneId: ZoneId.AacCruiserweightM4Savage,
  timelineFile: 'r8s.txt',
  initData: () => ({
    phase: 'door',
    decays: 0,
    gales: 0,
    tpcount: 0,
    tpsurge: 0,
    bmcleaves: 0,
    bmbites: [],
    heroes: 0,
    enrage: 5,
  }),
  timelineTriggers: [
    {
      id: 'R8S Light Party Platform',
      regex: /Quake III/,
      beforeSeconds: 7,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Light Party Platform',
          ko: '(담당 플랫폼으로)',
        },
      },
    },
    {
      id: 'R8S Avoid Twinbite',
      regex: /Twinbite/,
      beforeSeconds: 9,
      infoText: (data, _matches, output) => {
        if (Autumn.isTank(data.moks))
          return output.tank();
        return output.other();
      },
      outputStrings: {
        tank: {
          en: 'Tank Buster Platform',
          ko: '(탱크 버스터 플랫폼으로)',
        },
        other: {
          en: 'Avoid Tank Buster Platform',
          ko: '(버스터 플랫폼 피해요)',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Positions',
      regex: /Ultraviolent Ray [123]/,
      beforeSeconds: 7,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: '(나란히 나란히)',
        },
      },
    },
    {
      id: 'R8S Ultraviolent 4 Positions',
      regex: /Ultraviolent Ray 4/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: '(나란히 나란히)',
        },
      },
    },
    {
      id: 'R8S Mooncleaver Bait',
      regex: /Mooncleaver$/,
      beforeSeconds: 11,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait Mooncleaver',
          ko: '(처음 플랫폼으로)',
        },
      },
    },
    {
      id: 'R8S Rise of the Positions',
      regex: /Rise of the Hunter\'s Blade/,
      beforeSeconds: 14,
      infoText: (data, _matches, output) => {
        const extra = Autumn.isTank(data.moks)
          ? output.tank()
          : Autumn.isHealer(data.moks)
          ? output.healer()
          : output.dps();
        return output.text({ extra: extra });
      },
      outputStrings: {
        text: {
          en: 'Rise Positions - ${extra}',
          ko: '(줄다리기 ${extra} 플랫폼으로)',
        },
        tank: {
          en: 'Left top',
          ko: '왼쪽 위🡼',
        },
        healer: {
          en: 'Base',
          ko: '처음🡻',
        },
        dps: {
          en: 'Right',
          ko: '오른쪽🡺',
        },
      },
    },
    {
      id: 'R8S Howling Eight Initial Position',
      regex: /Ultraviolent Ray 4/,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Howling Eight Position',
          ko: '(처음 플랫폼으로)',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'R8S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Howling Blade' },
      suppressSeconds: 1,
      run: (data, matches) => data.phase = phases[matches.id] ?? 'unknown',
    },
    {
      id: 'R8S Phase Tracker 2',
      type: 'Ability',
      netRegex: { id: 'A82D', source: 'Howling Blade', capture: false },
      suppressSeconds: 1,
      run: (data) => data.phase = '2nd',
    },
    // //////////////////// 전반부 ////////////////////
    {
      id: 'R8S Extraplanar Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3DA', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Fangs',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(fangPairs), source: 'Howling Blade', capture: true },
      durationSeconds: 4.5,
      infoText: (_data, matches, output) => {
        const fang = fangPairs[matches.id];
        if (fang !== undefined)
          return output[fang]();
      },
      outputStrings: {
        windPlus: {
          en: 'In + Cardinal + Partners',
          ja: '➕内側 + ペア',
          ko: '➕안으로 + 둘이 페어',
        },
        windCross: {
          en: 'In + Intercards + Partners',
          ja: '❌内側 + ペア',
          ko: '❌안으로 + 둘이 페어',
        },
        stonePlus: {
          en: 'Out + Cardinal + Protean',
          ja: '➕外側 + 散会',
          ko: '➕바깥으로 + 맡은 자리로',
        },
        stoneCross: {
          en: 'Out + InterCards + Protean',
          ja: '❌外側 + 散会',
          ko: '❌바깥으로 + 맡은 자리로',
        },
      },
    },
    {
      id: 'R8S Reigns',
      type: 'StartsUsing',
      netRegex: { id: ['A911', 'A912', 'A913', 'A914'], source: 'Howling Blade', capture: true },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime) + 3,
      infoText: (_data, matches, output) => {
        if (matches.id === 'A911' || matches.id === 'A912')
          return output.in();
        return output.out();
      },
      outputStrings: {
        in: {
          en: 'In',
          ja: 'ボスに近づく',
          ko: '보스랑 붙어요',
        },
        out: {
          en: 'Out',
          ja: 'ボスから離れる',
          ko: '보스 멀리멀리',
        },
      },
    },
    {
      id: 'R8S Millenial Decay',
      type: 'StartsUsing',
      netRegex: { id: 'A3B2', source: 'Howling Blade', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Breath of Decay Rotation',
      type: 'StartsUsing',
      netRegex: { id: 'A3B4', source: 'Wolf of Wind', capture: true },
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        data.decays++;
        if (data.decays !== 2)
          return;
        const dir = AutumnDir.posConv8(matches.x, matches.y, centerX, centerY);
        return dir === 1 || dir === 5 ? output.left() : output.right();
      },
      outputStrings: {
        left: {
          en: '<== Clockwise',
          ja: '❰❰❰時計回り',
          ko: '❰❰❰왼쪽으로',
        },
        right: {
          en: 'Counterclockwise ==>',
          ja: '反時計回り❱❱❱',
          ko: '오른쪽으로❱❱❱',
        },
      },
    },
    {
      id: 'R8S Aero III',
      type: 'StartsUsing',
      netRegex: { id: 'A3B7', source: 'Howling Blade', capture: false },
      condition: AutumnCond.notOnlyAutumn(),
      suppressSeconds: 16,
      response: Responses.knockback(),
    },
    {
      id: 'R8S Decay Spread',
      type: 'HeadMarker',
      netRegex: { id: '0178' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.puddle(),
      outputStrings: {
        puddle: {
          en: 'Puddle on YOU',
          ja: '自分にAOE',
          ko: '내게 장판!',
        },
      },
    },
    {
      id: 'R8S Prowling Gale Tower/Tether',
      type: 'Tether',
      netRegex: { id: '0039', capture: true },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.knockbackTether();
        data.gales++;
        if (data.gales === 4)
          return output.knockbackTowers();
      },
      outputStrings: {
        knockbackTether: {
          en: 'Knockback Tether',
          ja: 'ノックバック + 扇',
          ko: '줄처리 넉백',
        },
        knockbackTowers: {
          en: 'Knockback Towers',
          ja: 'ノックバック + 塔踏み',
          ko: '타워 밟기 넉백',
        },
      },
    },
    {
      id: 'R8S Titanic Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3C7', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Tracking Tremors',
      type: 'StartsUsing',
      netRegex: { id: 'A3B9', source: 'Howling Blade', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          ja: '頭割り x8',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Great Divide',
      type: 'HeadMarker',
      netRegex: { id: '0256', capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R8S Howling Havoc',
      type: 'StartsUsing',
      netRegex: { id: 'A3DD', source: 'Wolf Of Stone', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      response: Responses.aoe(),
    },
    {
      id: 'R8S Tactical Pack Tethers',
      type: 'Tether',
      netRegex: { id: ['014F', '0150'], capture: true },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, matches, output) => matches.id === '014F' ? output.wind() : output.stone(),
      outputStrings: {
        wind: {
          en: 'Green side',
          ja: '🟩風の方',
          ko: '🟩바람으로',
        },
        stone: {
          en: 'Yellow side',
          ja: '🟨石の方',
          ko: '🟨돌멩이로',
        },
      },
    },
    {
      id: 'R8S Tactical Pack',
      // Durations could be 21s, 37s, or 54s
      type: 'GainsEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: (data, matches) => data.me === matches.target && data.phase === 'pack',
      preRun: (data, matches) => {
        // 1127 = Stone (Yellow Cube) Debuff
        // 1128 = Wind (Green Sphere) Debuff
        const time = parseFloat(matches.duration);
        data.tpnum = time < 22 ? 1 : time < 38 ? 2 : 3;
        data.tpvalue = matches.effectId === '1127' ? 'stone' : 'wind';
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        const debuff = output[data.tpvalue ?? 'unknown']();
        return output.combo({ debuff: debuff, num: data.tpnum });
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Predation',
      type: 'HeadMarker',
      netRegex: { id: '0017', capture: false },
      condition: (data) => data.phase === 'pack',
      suppressSeconds: 1,
      run: (data) => data.tpcount++,
    },
    {
      id: 'R8S Tactical Pack Wind',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      // Magic Vulnerabilities from Pack Predation and Alpha Wind are 0.96s
      condition: (data, matches) =>
        data.phase === 'pack' && data.tpvalue === 'wind' && parseFloat(matches.duration) < 2,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.tpnum === data.tpcount)
          return output.now({ debuff: output.wind() });
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Stone',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      // Timing based on Tether and Magic Vulnerability (3.96s)
      condition: (data, matches) =>
        data.phase === 'pack' && data.tpvalue === 'stone' && parseFloat(matches.duration) > 2,
      preRun: (data) => data.tpsurge++,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.tpnum === data.tpcount && (data.tpsurge % 2) === 1)
          return output.now({ debuff: output.stone() });
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.tpnum = undefined,
    },
    {
      id: 'R8S Ravenous Saber',
      type: 'StartsUsing',
      netRegex: { id: 'A749', source: 'Howling Blade', capture: false },
      durationSeconds: 7,
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Terrestrial Rage Spread Collect',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.phase === 'saber' && data.me === matches.target,
      run: (data) => data.spread = true,
    },
    {
      id: 'R8S Terrestrial Rage Stack',
      type: 'HeadMarker',
      netRegex: { id: '005D', capture: false },
      condition: (data) => data.phase === 'saber',
      delaySeconds: 0.1,
      durationSeconds: 4.5,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => data.spread ? output.spread() : output.stack(),
      outputStrings: {
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Shadowchase',
      type: 'StartsUsing',
      netRegex: { id: 'A3BC', source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      durationSeconds: 5.5,
      alertText: (data, _matches, output) => {
        const mech = data.spread ? output.stack() : output.spread();
        return output.move({ mech: mech });
      },
      outputStrings: {
        move: {
          en: 'Move! => ${mech}',
          ja: '回避! 🔜 ${mech}',
          ko: '피해요! 🔜 ${mech}',
        },
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Weal of Stone',
      type: 'StartsUsing',
      netRegex: { id: 'A78E', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.lines(),
      run: (data) => data.spread = undefined,
      outputStrings: {
        lines: {
          en: 'Lines',
          ja: '直線AOE',
          ko: '직선 장판',
        },
      },
    },
    {
      id: 'R8S Beckon Moonlight',
      type: 'Ability',
      netRegex: { id: ['A3E0', 'A3E1'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: 0.1,
      // durationSeconds: (data) => data.bmbites.length < 2 ? 2 : 10,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;
        const num = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        if (matches.id === 'A3E0') {
          const ccw = num === 0 ? 6 : num - 2;
          data.bmbites.push(ccw);
        } else {
          const cw = (num + 2) % 8;
          data.bmbites.push(cw);
        }
      },
      infoText: (data, _matches, output) => {
        if (data.bmbites.length !== 2)
          return;
        const b1 = data.bmbites[0] ?? -1;
        const b2 = data.bmbites[1] ?? -1;
        let safe = [1, 3, 5, 7].filter((q) => q !== b1 + 1);
        safe = safe.filter((q) => q !== (b1 === 0 ? 7 : b1 - 1));
        safe = safe.filter((q) => q !== b2 + 1);
        safe = safe.filter((q) => q !== (b2 === 0 ? 7 : b2 - 1));
        if (safe.length !== 1 || safe[0] === undefined)
          return;
        const q = AutumnDir.dirFromNum(safe[0] ?? -1);
        return output.safe({ quad: output[q]() });
      },
      outputStrings: {
        safe: {
          en: '${quad}',
          ja: '${quad}',
          ko: '${quad}',
        },
        ...AutumnDir.stringsAimCross,
      },
    },
    {
      id: 'R8S Beckon Moonlight Spread',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.phase === 'beckon' && data.me === matches.target,
      run: (data) => data.spread = true,
    },
    {
      id: 'R8S Beckon Moonlight Stack',
      type: 'HeadMarker',
      netRegex: { id: '005D', capture: false },
      condition: (data) => data.phase === 'beckon',
      delaySeconds: 0.1,
      durationSeconds: 4.5,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => data.spread ? output.spread() : output.stack(),
      run: (data) => data.spread = undefined,
      outputStrings: {
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Beckon Moonlight Cleave',
      type: 'StartsUsing',
      netRegex: { id: ['A3C2', 'A3C3'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        data.bmcleaves++;
        if (data.bmcleaves === 3)
          return data.spread ? output.spread() : output.stack();
      },
      outputStrings: {
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Weal of Stone Cardinals',
      type: 'StartsUsing',
      netRegex: { id: 'A792', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cardinals',
          ja: '竜の頭、十字回避',
          ko: '용머리! 십자로',
        },
      },
    },
    // //////////////////// 후반부 ////////////////////
    {
      id: 'R8S Quake III',
      type: 'StartsUsing',
      netRegex: { id: 'A45A', source: 'Howling Blade', capture: false },
      alertText: (_data, _matches, output) => output.healerGroups(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'R8S Mooncleaver',
      type: 'StartsUsing',
      netRegex: { id: 'A465', source: 'Howling Blade', capture: false },
      infoText: (_data, _matches, output) => output.changePlatform(),
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ja: '別のプラットフォームへ',
          ko: '다른 플랫폼으로',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Ray Target',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 3,
      alertText: (_data, _matches, output) => {
        return output.uvRayOnYou();
      },
      outputStrings: {
        uvRayOnYou: {
          en: 'UV Ray on YOU',
          ja: '自分に❄️レイ',
          ko: '내게 ❄️레이저가!',
        },
      },
    },
    {
      id: 'R8S Twinbite',
      type: 'StartsUsing',
      netRegex: { id: 'A4CD', source: 'Howling Blade', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R8S Fanged Maw/Perimeter Collect',
      type: 'StartsUsing',
      netRegex: { id: ['A463', 'A464'], source: 'Gleaming Fang', capture: true },
      run: (data, matches) => data.hfang = matches.id === 'A463' ? 'out' : 'in',
    },
    {
      id: 'R8S Hero\'s Blow',
      type: 'StartsUsing',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      infoText: (data, matches, output) => {
        const inout = output[data.hfang ?? 'unknown']();
        const dir = matches.id === 'A45F' ? 'right' : 'left';
        return output.text({ inout: inout, dir: output[dir]() });
      },
      run: (data) => data.hsafe = undefined,
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        left: Outputs.arrowW,
        right: Outputs.arrowE,
        text: {
          en: '${inout} + ${dir}',
          ja: '${dir}${inout}',
          ko: '${dir}${inout}',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Ray 4',
      type: 'Ability',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: false },
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        data.heroes++;
        if (data.heroes === 2)
          return output.text();
      },
      outputStrings: {
        text: {
          en: 'UV Positions',
          ja: '担当プラットフォームへ',
          ko: '담당 플랫폼으로! (곧 나란히)',
        },
      },
    },
    {
      id: 'R8S Elemental Purge Tank',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: (data) => data.phase === '2nd',
      infoText: (data, matches, output) => {
        // 블루메 친화적이지 않음
        const m = data.party.member(matches.target);
        if (m.role_ !== 'tank')
          return;
        if (!Autumn.isTank(data.moks))
          return output.purge({ target: m });
        if (data.me === matches.target)
          return output.itsme();
        return output.provoke();
      },
      outputStrings: {
        purge: {
          en: 'Purge: ${target}',
          ja: 'パージ: ${target}',
          ko: '퍼지: ${target}',
        },
        itsme: {
          en: 'Purge on YOU',
          ja: '(自分にパージ、シャク)',
          ko: '(내게 퍼지! 헤이트 넘겨요)',
        },
        provoke: {
          en: '(Provoke)',
          ja: '(挑発)',
          ko: '(프로보크)',
        },
      },
    },
    {
      id: 'R8S Prowling Gale Pair',
      type: 'StartsUsing',
      netRegex: { id: 'A46E', source: 'Howling Blade', capture: false },
      condition: (data) => data.phase === '2nd',
      infoText: (_data, _matches, output) => output.towers(),
      outputStrings: {
        towers: {
          en: 'Towers',
          ja: 'まもなくペア',
          ko: '페어 준비! 위치로',
        },
      },
    },
    {
      id: 'R8S Twofold Preparation',
      type: 'StartsUsing',
      netRegex: { id: 'A46F', source: 'Howling Blade' },
      condition: (data) => data.phase === '2nd',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1.5,
      durationSeconds: 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.move(),
      outputStrings: {
        move: {
          en: 'Light Party Platforms',
          ja: '担当プラットフォームへ',
          ko: '담당 플랫폼으로!',
        },
      },
    },
    {
      id: 'R8S Lone Wolf\'s Lament Tethers',
      type: 'Tether',
      netRegex: { id: ['013E', '013D'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      infoText: (_data, matches, output) => matches.id === '013E' ? output.far() : output.close(),
      outputStrings: {
        close: {
          en: 'Close Tether on YOU',
          ja: '自分に🟩近づく線',
          ko: '내게 🟩붙어 줄',
        },
        far: {
          en: 'Far Tether on YOU',
          ja: '自分に🟦離れる線',
          ko: '내게 🟦떨어져 줄',
        },
      },
    },
    {
      id: 'R8S Howling Eight',
      type: 'StartsUsing',
      netRegex: { id: ['AA02', 'A494'], source: 'Howling Blade', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          ja: '頭割り x8',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Mooncleaver (Enrage Sequence)',
      type: 'StartsUsing',
      netRegex: { id: 'A74C', source: 'Howling Blade', capture: false },
      condition: (data) => {
        data.enrage--;
        return data.enrage !== 0;
      },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.enrage > 1)
          return output.changePlatform();
        if (data.enrage === 1)
          return output.finalPlatform();
      },
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ja: '別のプラットフォームへ',
          ko: '플랫폼 옮겨요 ',
        },
        finalPlatform: {
          en: 'Change Platform (Final)',
          ja: '最後のプラットフォームへ',
          ko: '마지막 플랫폼으로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Howling Blade': 'ハウリングブレード',
        'Moonlit Shadow': 'ハウリングブレードの幻影',
        'Wolf of Stone': '土の狼頭',
        'Wolf of Wind': '風の狼頭',
        'Gleaming Fang': '光の牙',
      },
    },
  ],
});
