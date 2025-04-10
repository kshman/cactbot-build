const styleMap = {
  '93CA': { l: 'mbol', r: 'succ', c: 2 },
  '9408': { l: 'succ', r: 'mbol', c: 2 },
  'A67D': { l: 'mbol', r: 'mbol', c: 2 },
  'A67E': { l: 'succ', r: 'succ', c: 2 },
  'A67F': { l: 'bomb', r: 'succ', c: 4 },
  'A680': { l: 'wing', r: 'succ', c: 4 },
  'A681': { l: 'bomb', r: 'mbol', c: 4 },
  'A682': { l: 'wing', r: 'mbol', c: 4 },
};
const styleFlags = {
  'mbol': 0x1,
  'succ': 0x2,
  'bomb': 0x4,
  'wing': 0x8,
};
const styleCorner = {
  0: [1, 7],
  2: [1, 3],
  4: [3, 5],
  6: [5, 7],
};
const getStyleConer = (dir) => styleCorner[dir] ?? [];
Options.Triggers.push({
  id: 'AacCruiserweightM2Savage',
  zoneId: ZoneId.AacCruiserweightM2Savage,
  timelineFile: 'r6s.txt',
  initData: () => ({
    styleActors: {},
    styleTethers: {},
    sandDebuffs: [],
  }),
  triggers: [
    {
      id: 'R6S Auto Attack',
      type: 'Ability',
      netRegex: { id: 'A7B4', source: 'Sugar Riot' },
      run: (data, matches) => data.hate = matches.target,
    },
    {
      id: 'R6S Mousse Mural',
      type: 'StartsUsing',
      netRegex: { id: 'A6BC', source: 'Sugar Riot', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R6S Color Riot',
      type: 'StartsUsing',
      // A691 웜 아래, 콜드 위
      // A692 웜 위, 콜드 아래
      netRegex: { id: ['A691', 'A692'], source: 'Sugar Riot' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          bait: {
            en: 'Bait Tank Cleave',
            ko: '첫 탱크 클레브',
          },
          cold: {
            en: 'Bait cold ${act}',
            ko: '${act} 🔵유도해욧',
          },
          warm: {
            en: 'Bait warm ${act}',
            ko: '${act} 🔴유도해욧',
          },
          in: Outputs.in,
          out: Outputs.out,
          avoidCleave: Outputs.avoidTankCleave,
        };
        if (!Autumn.isTank(data.moks))
          return { infoText: output.avoidCleave() };
        if (data.riot === 'cold') {
          // 웜 유도할 것
          const act = matches.id === 'A691' ? output.out() : output.in();
          return { alertText: output.warm({ act: act }) };
        } else if (data.riot === 'warm') {
          // 콜드 유도할 것
          const act = matches.id === 'A692' ? output.out() : output.in();
          return { alertText: output.cold({ act: act }) };
        }
        return { alertText: output.bait() };
      },
    },
    {
      id: 'R6S Cold/Warm Collect',
      type: 'Ability',
      netRegex: { id: ['A693', 'A694'], source: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.target,
      run: (data, matches) => data.riot = matches.id === 'A693' ? 'cold' : 'warm',
    },
    {
      id: 'R6S Color Crash Collect',
      type: 'StartsUsing',
      netRegex: { id: ['A68B', 'A68D'], source: 'Sugar Riot' },
      run: (data, matches) => {
        data.isCrush = true;
        data.crushAction = matches.id === 'A68B' ? 'light' : 'pair';
        data.styleActors = {};
        data.styleTethers = {};
        delete data.styleItem;
      },
    },
    {
      id: 'R6S Wingmark',
      type: 'GainsEffect',
      netRegex: { effectId: '1162' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      durationSeconds: 4,
      countdownSeconds: 4,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.crushAction === undefined)
          return output.text();
        return output.combo({ act: output[data.crushAction]() });
      },
      outputStrings: {
        text: {
          en: 'Warp',
          ko: '나르샤!',
        },
        combo: {
          en: 'Warp => ${act}',
          ko: '나르샤! (${act})',
        },
        pair: Outputs.stackPartner,
        light: Outputs.stackGroup,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Color Crash',
      type: 'GainsEffect',
      netRegex: { effectId: '1162' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      durationSeconds: 5,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        if (data.crushAction !== undefined)
          return output[data.crushAction]();
      },
      run: (data) => {
        delete data.isCrush;
        delete data.crushAction;
      },
      outputStrings: {
        pair: Outputs.stackPartner,
        light: Outputs.stackGroup,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Double Actors Collect',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-Fa-f]{7}', capture: true },
      condition: (data) => data.isCrush,
      run: (data, matches) => data.styleActors[matches.id] = matches,
    },
    {
      id: 'R6S Double Style Collect',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(styleMap), source: 'Sugar Riot', capture: true },
      condition: (data) => data.isCrush,
      run: (data, matches) => data.styleItem = styleMap[matches.id],
    },
    {
      // #650
      id: 'R6S Double Style',
      type: 'Tether',
      netRegex: { targetId: '4[0-9A-Fa-f]{7}', id: ['013F', '0140'], capture: true },
      condition: (data) => data.isCrush && data.styleItem !== undefined,
      preRun: (data, matches) => data.styleTethers[matches.sourceId] = matches,
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.styleItem === undefined)
          return;
        if (Object.keys(data.styleTethers).length < data.styleItem.c)
          return;
        let comb = 0;
        let safes = [1, 3, 5, 7];
        const tethers = Object.entries(data.styleTethers);
        data.styleTethers = {};
        for (const [id, tether] of tethers) {
          const a = data.styleActors[id];
          if (a === undefined)
            return;
          const x = parseFloat(a.x);
          const y = parseFloat(a.y);
          const mx = ((x - 100) * -1) + 100;
          const adir = Directions.xyTo8DirNum(x, y, 100, 100);
          const mdir = Directions.xyTo8DirNum(mx, y, 100, 100);
          const corners = getStyleConer(adir);
          const mob = data.styleItem[tether.id === '013F' ? 'l' : 'r'];
          switch (mob) {
            case 'bomb':
              safes = safes.filter((dir) => dir !== adir);
              break;
            case 'wing':
              safes = safes.filter((dir) => dir !== mdir);
              break;
            case 'succ':
              safes = safes.filter((dir) => !corners.includes(dir));
              break;
            case 'mbol':
              safes = safes.filter((dir) => corners.includes(dir));
              break;
          }
          comb |= styleFlags[mob];
        }
        const [dir] = safes;
        if (safes.length !== 1 || dir === undefined) {
          console.log(`R6S Double Style - 헐랭 데이터가 잘못됨`);
          return;
        }
        const diags = { 1: 5, 3: 7, 5: 1, 7: 3 };
        const start = diags[dir];
        if (start === undefined)
          return output.unknown();
        if (data.options.AutumnStyle) {
          let mesg = output.unknown();
          if (comb === styleFlags.succ) // 서큐버스 2
            mesg = output.succ();
          else if (comb === styleFlags.mbol)
            mesg = output.molb(); // 몰볼 2
          else if (comb === (styleFlags.succ | styleFlags.mbol))
            mesg = output.succmolb(); // 서큐버스 + 몰볼
          else if ((comb & styleFlags.bomb) !== 0) {
            if ((comb & styleFlags.succ) !== 0)
              mesg = output.bombsucc(); // 폭탄 + 서큐버스
            if ((comb & styleFlags.mbol) !== 0)
              mesg = output.bombmolb(); // 폭탄 + 몰볼
          } else if ((comb & styleFlags.wing) !== 0) {
            if ((comb & styleFlags.succ) !== 0)
              mesg = output.wingsucc(); // 날개 + 서큐버스
            if ((comb & styleFlags.mbol) !== 0)
              mesg = output.wingmolb(); // 날개 + 몰볼
          }
          let omk = start;
          if (!Autumn.hasParam('markex', data.options.AutumnParameter)) {
            const exmap = { 1: 3, 3: 5, 5: 7, 7: 1 };
            omk = exmap[start];
          }
          const ar = AutumnDirections.outputFromArrow8Num(start);
          const mk = AutumnDirections.outputFromMarker8Num(omk);
          return output.atext({
            arrow: output[ar](),
            mark: output[mk](),
            mesg: mesg,
          });
        }
        const dir1 = Directions.outputFrom8DirNum(start);
        const dir2 = Directions.outputFrom8DirNum(dir);
        return output.text({ dir1: output[dir1](), dir2: output[dir2]() });
      },
      outputStrings: {
        text: {
          en: 'Start ${dir1}, launch towards ${dir2}',
          cn: '从 ${dir1}, 向 ${dir2} 发射',
          ko: '${dir1} 시작, ${dir2}로',
        },
        atext: {
          en: '${arrow}${mark} ${mesg}',
          ko: '${arrow}${mark} ${mesg}',
        },
        succ: {
          en: 'Succubus x2',
          ko: '서큐쪽',
        },
        molb: {
          en: 'Molbol x2',
          ko: '몰볼 안됨',
        },
        succmolb: {
          en: 'Succubus + Molbol',
          ko: '서큐 + 몰볼 안됨',
        },
        bombsucc: {
          en: 'Painted + Succubus',
          ko: '폭탄 + 서큐',
        },
        bombmolb: {
          en: 'Painted + Molbol',
          ko: '폭탄 + 몰볼 안됨',
        },
        wingsucc: {
          en: 'Heaven + Succubus',
          ko: '날개 안됨 + 서큐',
        },
        wingmolb: {
          en: 'Heaven + Molbol',
          ko: '날개 안됨 + 몰볼 안됨',
        },
        ...AutumnDirections.outputStringsArrowIntercard,
        ...AutumnDirections.outputStringsMarkerIntercard,
        ...Directions.outputStringsIntercardDir,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Sticky Mousse',
      type: 'StartsUsing',
      netRegex: { id: 'A695', source: 'Sugar Riot', capture: false },
      response: Responses.protean(),
    },
    {
      id: 'R6S Sugarscape',
      type: 'StartsUsing',
      netRegex: { id: 'A668', source: 'Sugar Riot', capture: false },
      run: (data) => data.sandDebuffs = [],
    },
    {
      id: 'R6S Sand Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      infoText: (data, matches, output) => {
        const count = parseFloat(matches.duration);
        data.sandDebuffs.push({ name: matches.target, count: count });
        if (data.sandDebuffs.length < 4 || !Autumn.isTank(data.moks))
          return;
        const itsme = data.sandDebuffs.findIndex((x) => x.name === data.me);
        if (itsme === -1) {
          if (data.hate !== data.me)
            return output.provoke();
          return;
        }
        if (data.hate === data.me)
          return output.shirk();
      },
      outputStrings: {
        shirk: {
          en: '(shirk)',
          ko: '(헤이트 넘겨줘요)',
        },
        provoke: {
          en: '(provoke)',
          ko: '(프로보크)',
        },
      },
    },
    {
      id: 'R6S Sand Defamation',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      countdownSeconds: 6,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Defamation on YOU',
          ko: '내게 대폭발',
        },
      },
    },
    {
      id: 'R6S Tether Heaven Bomb',
      type: 'Tether',
      netRegex: { id: '013F', target: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Wing bomb',
          ko: '날개 폭탄, 그냥 모래로',
        },
      },
    },
    {
      id: 'R6S Tether Painted Bomb',
      type: 'Tether',
      netRegex: { id: '0140', target: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Painted bomb',
          ko: '폭탄, 흐르는 모래로',
        },
      },
    },
    {
      id: 'R6S Manxome Windersnatch',
      type: 'Ability',
      netRegex: { id: 'A6AD', source: 'Jabberwock' },
      durationSeconds: 3,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          wock: {
            en: 'Jabberwock appears',
            ko: '재버워크 나왔어요',
          },
          bind: {
            en: 'Jabberwock binds YOU',
            ko: '내게 재버워크 바인드!',
          },
        };
        if (data.me === matches.target)
          return { alertText: output.bind() };
        return { infoText: output.wock() };
      },
    },
    {
      id: 'R6S Ready Ore Not',
      type: 'StartsUsing',
      netRegex: { id: 'A6AA', source: 'Sugar Riot', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R6S Double Style Arrows',
      type: 'StartsUsing',
      netRegex: { id: ['A687', 'A689'], source: 'Sugar Riot' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        const act = matches.id === 'A687' ? 'group' : 'spread';
        return output.text({ act: output[act]() });
      },
      outputStrings: {
        text: {
          en: '${act} + Arrows grid',
          ko: '${act} + 화살 격자 장판',
        },
        group: Outputs.healerGroups,
        spread: Outputs.spread,
      },
    },
    {
      id: 'R6S Thunder Target',
      type: 'HeadMarker',
      netRegex: { id: '025A' },
      durationSeconds: 4,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          left: {
            en: 'Thunder on YOU',
            ko: '내게 번개! 왼쪽 섬으로',
          },
          right: {
            en: 'Thunder on YOU',
            ko: '내게 번개! 오른쪽 섬으로',
          },
          provoke: {
            en: '(provoke)',
            ko: '(프로보크)',
          },
        };
        if (data.me !== matches.target) {
          if (data.role !== 'tank')
            return;
          const m = data.party.member(matches.target);
          if (m.role !== 'tank')
            return;
          return { infoText: output.provoke() };
        }
        if (data.role === 'dps')
          return { alertText: output.right() };
        return { alertText: output.left() };
      },
    },
    {
      id: 'R6S Pudding Party',
      type: 'StartsUsing',
      netRegex: { id: 'A66D', source: 'Sugar Riot', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.fiveAOE(),
      outputStrings: {
        fiveAOE: {
          en: '5x AoEs',
          ko: '5x 전체공격',
        },
      },
    },
    {
      id: 'R6S Last Layer',
      type: 'StartsUsing',
      netRegex: { id: 'A66D', source: 'Sugar Riot', capture: false },
      delaySeconds: 8.7,
      infoText: (_data, _matches, output) => output.spread(),
      outputStrings: {
        spread: {
          en: 'Go to island',
          ko: '맡은 섬으로!',
        },
      },
    },
    {
      id: 'R6S Taste of Thunder',
      type: 'StartsUsing',
      netRegex: { id: 'A69D', source: 'Sugar Riot', capture: false },
      durationSeconds: 3,
      suppressSeconds: 5,
      response: Responses.moveAway(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Jabberwock': 'ジャバウォック',
        'Sugar Riot': 'シュガーライオット',
      },
    },
  ],
});
