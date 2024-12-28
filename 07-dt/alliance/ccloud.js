Options.Triggers.push({
  id: 'TheCloudOfDarknessChaotic',
  zoneId: ZoneId.TheCloudOfDarknessChaotic,
  timelineFile: 'ccloud.txt',
  initData: () => {
    return {
      blades: 0,
      grim: 'unknown',
      scast: 'unknown',
      type: 'unknown',
      targets: [],
    };
  },
  timelineTriggers: [],
  triggers: [
    {
      id: 'CCloud Blade of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9DFB', '9DFD', '9DFF'], source: 'Cloud of Darkness' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        switch (matches.id) {
          case '9DFB':
            return output.right();
          case '9DFD':
            return output.left();
          case '9DFF':
            return output.out();
        }
      },
      outputStrings: {
        out: Outputs.out,
        left: Outputs.getLeftAndWest,
        right: Outputs.getRightAndEast,
      },
    },
    {
      id: 'CCloud Deluge of Darkness',
      type: 'StartsUsing',
      netRegex: { id: ['9E3D', '9E01'], source: 'Cloud of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.bleedAoe(),
      run: (data) => data.targets = [],
    },
    {
      // 012C 뒤에서 앞으로
      // 012D 앞에서 뒤로
      id: 'CCloud Grim Tether',
      type: 'Tether',
      netRegex: { id: ['012C', '012D'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      infoText: (data, matches, output) => {
        if (matches.id === '012C') {
          data.grim = 'back';
          return output.back();
        }
        data.grim = 'front';
        return output.front();
      },
      outputStrings: {
        front: {
          en: '(Move forward, later)',
          ko: '(앞에서 주먹 🔜 앞으로)',
        },
        back: {
          en: '(Move backward, later)',
          ko: '(뒤에서 주먹 🔜 뒤로)',
        },
      },
    },
    {
      id: 'CCloud Death IV',
      type: 'StartsUsing',
      netRegex: { id: '9E43', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 4,
      response: Responses.getOutThenIn(),
    },
    {
      id: 'CCloud Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '9E4C', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 4,
      response: Responses.knockback(),
    },
    {
      id: 'CCloud Endeath IV',
      type: 'StartsUsing',
      netRegex: { id: '9E53', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.scast = 'endeath',
    },
    {
      id: 'CCloud Unaero IV',
      type: 'StartsUsing',
      netRegex: { id: '9E54', source: 'Cloud of Darkness', capture: false },
      run: (data) => data.scast = 'unaero',
    },
    {
      id: 'CCloud En&Un',
      type: 'StartsUsing',
      netRegex: { id: ['9DFB', '9DFD', '9DFF'], source: 'Cloud of Darkness' },
      condition: (data) => {
        data.blades++;
        return data.blades === 4;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        data.blades = 0;
        return output[data.scast]();
      },
      outputStrings: {
        endeath: Outputs.outThenIn,
        unaero: Outputs.knockback,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'CCloud Target Premove',
      type: 'GainsEffect',
      netRegex: { effectId: '1055' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 5.5,
      countdownSeconds: 5.5,
      infoText: (data, _matches, output) => output[data.grim](),
      outputStrings: {
        front: {
          en: '(Forward soon)',
          ko: '(곧 앞으로, 보스 봐요)',
        },
        back: {
          en: '(Backward soon)',
          ko: '(곧 뒤로, 벽 봐요)',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'CCloud Target Move',
      type: 'GainsEffect',
      netRegex: { effectId: '1055' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      durationSeconds: 1.5,
      alarmText: (data, _matches, output) => output[data.grim](),
      outputStrings: {
        front: {
          en: 'Move forward!',
          ko: '앞으로!',
        },
        back: {
          en: 'Move backward!',
          ko: '뒤로!',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'CCloud Flare',
      type: 'HeadMarker',
      netRegex: { id: '015A' },
      condition: (data, matches) => {
        data.targets.push(matches.target);
        return data.targets.length === 3;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          flare: {
            en: 'Flare on YOU',
            ko: '내게 플레어!',
          },
          none: {
            en: 'No Flare',
            ko: '플레어 피해욧',
          },
        };
        if (data.targets.includes(data.me))
          return { alertText: output.flare() };
        return { infoText: output.none() };
      },
    },
    {
      id: 'CCloud Rapid-sequence Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E40', source: 'Cloud of Darkness', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Charge beams',
          ko: '연속 레이저',
        },
      },
    },
    {
      id: 'CCloud Unholy Stack',
      type: 'HeadMarker',
      netRegex: { id: '0064', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    },
    {
      id: 'CCloud Break IV',
      type: 'StartsUsing',
      netRegex: { id: '9E51', source: 'Sinister Eye', capture: false },
      durationSeconds: 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Gaze',
          ko: '시선 조심!',
        },
      },
    },
    {
      id: 'CCloud Atomos Spawn',
      type: 'AddedCombatant',
      // 13626 = Atomos
      netRegex: { npcNameId: '13626', capture: false },
      suppressSeconds: 1,
      response: Responses.killAdds(),
    },
    {
      id: 'CCloud Darkness Gain',
      type: 'GainsEffect',
      netRegex: { effectId: ['1051', '1052'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.type = matches.effectId === '1051' ? 'in' : 'out',
    },
    {
      id: 'CCloud Darkness Lose',
      type: 'LosesEffect',
      netRegex: { effectId: ['1051', '1052'] },
      condition: Conditions.targetIsYou(),
      run: (data) => data.type = 'unknown',
    },
    {
      id: 'CCloud Dark Dominion',
      type: 'StartsUsing',
      netRegex: { id: '9E08', source: 'Cloud of Darkness', capture: false },
      durationSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'CCloud Ghastly Gloom',
      type: 'StartsUsing',
      netRegex: { id: ['9E09', '9E0B'], source: 'Cloud of Darkness' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '9E09')
          return output.out();
        return output.in();
      },
      outputStrings: {
        in: {
          en: 'In',
          ko: '도넛, 안으로!',
        },
        out: {
          en: 'Out',
          ko: '십자, 모서리로!',
        },
      },
    },
    {
      id: 'CCloud Flood of Darkness Interrupt',
      type: 'StartsUsing',
      netRegex: { id: '9E37', source: 'Stygian Shadow', capture: true },
      condition: (data) => data.type === 'out',
      suppressSeconds: 1,
      response: Responses.interruptIfPossible(),
    },
    {
      id: 'CCloud Evil Seed',
      type: 'GainsEffect',
      netRegex: { effectId: '953' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Beam',
          ko: '바깥 봐요!',
        },
      },
    },
    {
      id: 'CCloud Bait Bramble',
      type: 'HeadMarker',
      netRegex: { id: '0227', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Place Bramble',
          ko: '씨앗 장판 버려요',
        },
      },
    },
    {
      id: 'CCloud Bramble Tether',
      type: 'HeadMarker',
      netRegex: { id: '000C' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Tether on YOU',
          ko: '내게 덩쿨! 곧 끊어요!',
        },
      },
    },
    {
      id: 'CCloud Excruciate',
      type: 'StartsUsing',
      netRegex: { id: '9E36', source: 'Stygian Shadow', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'CCloud Diffusive-force Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E10', source: 'Cloud of Darkness', capture: false },
      response: Responses.spread('alert'),
    },
    {
      id: 'CCloud Chaos-condensed Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: '9E0D', source: 'Cloud of Darkness', capture: false },
      response: Responses.stackMarker(),
    },
    {
      id: 'CCloud Active-pivot Particle Beam',
      type: 'StartsUsing',
      netRegex: { id: ['9E13', '9E15'], source: 'Cloud of Darkness', capture: true },
      infoText: (_data, matches, output) => {
        return matches.id === '9E13' ? output.clockwise() : output.counterClockwise();
      },
      outputStrings: {
        clockwise: Outputs.clockwise,
        counterClockwise: Outputs.counterclockwise,
      },
    },
    {
      id: 'CCloud Looming Chaos',
      type: 'StartsUsing',
      netRegex: { id: 'A2C9', source: 'Stygian Shadow', capture: false },
      condition: (data) => data.type === 'out',
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Align',
          ko: '자리 정렬, 줄 준비',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Cloud of Darkness': '暗闇の雲',
        'Sinister Eye': '邪眼',
        'Stygian Shadow': '闇より出づる者',
      },
    },
  ],
});
