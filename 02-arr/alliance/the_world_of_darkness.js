Options.Triggers.push({
  id: 'TheWorldOfDarkness',
  zoneId: ZoneId.TheWorldOfDarkness,
  triggers: [
    {
      id: 'Angra Mainyu Gain Sullen',
      type: 'GainsEffect',
      netRegex: { effectId: '27c' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.sullenDebuff = true,
    },
    {
      id: 'Angra Mainyu Lose Sullen',
      type: 'LosesEffect',
      netRegex: { effectId: '27c' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.sullenDebuff = false,
    },
    {
      id: 'Angra Mainyu Gain Ireful',
      type: 'GainsEffect',
      netRegex: { effectId: '27d' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.irefulDebuff = true,
    },
    {
      id: 'Angra Mainyu Lose Ireful',
      type: 'LosesEffect',
      netRegex: { effectId: '27d' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.irefulDebuff = false,
    },
    {
      id: 'Angra Mainyu Double Vision',
      type: 'StartsUsing',
      netRegex: { id: 'CC8', source: 'Angra Mainyu', capture: false },
      alertText: (data, _matches, output) => {
        if (data.sullenDebuff)
          return output.red();
        if (data.irefulDebuff)
          return output.white();
      },
      outputStrings: {
        red: {
          en: 'Get Behind (Red)',
          ja: '後ろ🔴赤',
          ko: '뒷쪽 🔴빨강',
        },
        white: {
          en: 'Get in Front (White)',
          ja: '前⚪白',
          ko: '앞쪽 ⚪하양',
        },
      },
    },
    {
      id: 'Angra Mainyu Mortal Gaze',
      type: 'StartsUsing',
      netRegex: { id: ['CD1', 'DAB'], source: 'Angra Mainyu', capture: false },
      suppressSeconds: 0.1,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'Angra Mainyu Gain Doom',
      type: 'GainsEffect',
      netRegex: { effectId: 'd2' },
      condition: Conditions.targetIsYou(),
      alarmText: (_data, _matches, output) => output.cleanse(),
      outputStrings: {
        cleanse: {
          en: 'Run to Cleanse Circle',
          ja: '床の光っている円範囲へ',
          ko: '둠: 동글이 밟아욧욧',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Angra Mainyu': 'Angra Mainyu',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Angra Mainyu': 'Angra Mainyu',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Angra Mainyu': 'アンラ・マンユ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Angra Mainyu': '安哥拉·曼纽',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Angra Mainyu': '앙그라 마이뉴',
      },
    },
  ],
});
