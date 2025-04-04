const doubleFlags = {
  'painted': 0x1,
  'heaven': 0x2,
  'molbol': 0x4,
  'succubus': 0x8,
};
Options.Triggers.push({
  id: 'AacCruiserweightM2Savage',
  zoneId: ZoneId.AacCruiserweightM2Savage,
  timelineFile: 'r6s.txt',
  initData: () => ({
    style: 0,
    debuffs: [],
  }),
  triggers: [
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
        if (data.bomb === 'cold') {
          // 웜 유도할 것
          const act = matches.id === 'A691' ? output.out() : output.in();
          return { alertText: output.warm({ act: act }) };
        } else if (data.bomb === 'warm') {
          // 콜드 유도할 것
          const act = matches.id === 'A692' ? output.out() : output.in();
          return { alertText: output.cold({ act: act }) };
        }
        return { alertText: output.bait() };
      },
    },
    {
      id: 'R6S Cold/Warm Bomb Collect',
      type: 'Ability',
      netRegex: { id: ['A693', 'A694'], source: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.target,
      run: (data, matches) => data.bomb = matches.id === 'A693' ? 'cold' : 'warm',
    },
    {
      id: 'R6S Color Crash Collect',
      type: 'StartsUsing',
      netRegex: { id: ['A68B', 'A68D'], source: 'Sugar Riot' },
      run: (data, matches) => data.crush = matches.id === 'A68B' ? 'light' : 'pair',
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
        if (data.crush === undefined)
          return output.text();
        return output.combo({ act: output[data.crush]() });
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
        if (data.crush !== undefined)
          return output[data.crush]();
      },
      run: (data) => delete data.crush,
      outputStrings: {
        pair: Outputs.stackPartner,
        light: Outputs.stackGroup,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Double Tether Succubus',
      type: 'Tether',
      netRegex: { source: 'Candied Succubus', capture: false },
      run: (data) => data.style |= doubleFlags.succubus,
    },
    {
      id: 'R6S Double Tether Morbol',
      type: 'Tether',
      netRegex: { source: 'Mouthwatering Morbol', capture: false },
      run: (data) => data.style |= doubleFlags.molbol,
    },
    {
      id: 'R6S Double Tether Paint Bomb',
      type: 'Tether',
      netRegex: { source: 'Paint Bomb', capture: false },
      run: (data) => data.style |= doubleFlags.painted,
    },
    {
      id: 'R6S Double Tether Heaven Bomb',
      type: 'Tether',
      netRegex: { source: 'Heaven Bomb', capture: false },
      run: (data) => data.style |= doubleFlags.heaven,
    },
    {
      id: 'R6S Double Style',
      type: 'StartsUsing',
      // 아이디는 컬러 크래시
      netRegex: { id: ['A68B', 'A68D'], source: 'Sugar Riot', capture: false },
      delaySeconds: 12,
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        if (data.style === doubleFlags.succubus) // 서큐버스 2
          return output.succubus();
        else if (data.style === doubleFlags.molbol)
          return output.molbol(); // 모르볼 2
        else if (data.style === (doubleFlags.succubus | doubleFlags.molbol))
          return output.succubusMolbol(); // 서큐버스 + 모르볼
        else if ((data.style & doubleFlags.painted) !== 0) {
          // 폭탄도 있음
          if ((data.style & doubleFlags.succubus) !== 0)
            return output.paintedSuccubus(); // 서큐버스와 함께
          if ((data.style & doubleFlags.molbol) !== 0)
            return output.paintedMolbol(); // 몰볼과 함께
        } else if ((data.style & doubleFlags.heaven) !== 0) {
          // 날개 폭탄도 있음
          if ((data.style & doubleFlags.succubus) !== 0)
            return output.heavenSuccubus(); // 서큐버스와 함께
          if ((data.style & doubleFlags.molbol) !== 0)
            return output.heavenMolbol(); // 몰볼과 함께
        }
        return output.unknown(); // 몰?루
      },
      run: (data) => data.style = 0,
      outputStrings: {
        unknown: {
          en: 'Unknown',
          ko: '(몰?루 알아서 피해욧!)',
        },
        succubus: {
          en: 'Succubus x2',
          ko: '(서큐 있는곳)',
        },
        molbol: {
          en: 'Molbol x2',
          ko: '(몰볼 없는곳)',
        },
        succubusMolbol: {
          en: 'Succubus + Molbol',
          ko: '(서큐 있는 + 몰볼 없는)',
        },
        paintedSuccubus: {
          en: 'Painted + Succubus',
          ko: '(폭탄 쪽 + 서큐 있는)',
        },
        paintedMolbol: {
          en: 'Painted + Molbol',
          ko: '(폭탄 쪽 + 몰볼 없는)',
        },
        heavenSuccubus: {
          en: 'Heaven + Succubus',
          ko: '(날개 없고 + 서큐 있는)',
        },
        heavenMolbol: {
          en: 'Heaven + Molbol',
          ko: '(날개 없고 + 몰볼 없는)',
        },
      },
    },
    {
      id: 'R6S Sticky Mousse',
      type: 'StartsUsing',
      netRegex: { id: 'A695', source: 'Sugar Riot', capture: false },
      response: Responses.protean(),
    },
    {
      id: 'R6S Sticky Groups',
      type: 'Ability',
      netRegex: { id: 'A695', source: 'Sugar Riot', capture: false },
      infoText: (_data, _matches, output) => output.light(),
      outputStrings: {
        light: Outputs.stackGroup,
      },
    },
    {
      id: 'R6S Sugarscape',
      type: 'StartsUsing',
      netRegex: { id: 'A668', source: 'Sugar Riot', capture: false },
      run: (data) => data.debuffs = [],
    },
    {
      id: 'R6S Sand Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      infoText: (data, matches, output) => {
        const count = parseFloat(matches.duration);
        data.debuffs.push({ name: matches.target, count: count });
        if (data.debuffs.length < 4 || !Autumn.isTank(data.moks))
          return;
        const itsme = data.debuffs.findIndex((x) => x.name === data.me);
        return itsme === -1 ? output.provoke() : output.shirk();
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
          ko: '날개 폭탄, 바깥 모래로',
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
    // 아래를 참고로 안전지대 만들 수도 있을듯
    // [21:05:56.654] AddCombatant 03:40028A71:Mouthwatering Morbol:00:64:0000:00::13828:18340:188300:188300:10000:10000:::100.00:100.00:0.00:0.00
    // [21:06:12.420] 271 10F:40028A71:-1.5709:00:00:120.0000:100.0000:0.0000 이거 ActorSetPos
    // [21:06:15.443] Tether 23:40028A71:Mouthwatering Morbol:400289A1:Sugar Riot:0000:0000:0140:400289A1:000F:0000
  ],
});
