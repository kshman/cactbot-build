Options.Triggers.push({
  id: 'TheSunkenTempleOfQarn71',
  zoneId: ZoneId.TheSunkenTempleOfQarn71,
  triggers: [
    {
      id: 'Sunken Quarn71 Doom',
      type: 'GainsEffect',
      netRegex: { effectId: 'D2' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Step on Glowing Plate',
          ja: '光る床に乗る',
          ko: '빛나는 발판 밟아요',
        },
      },
    },
  ],
});
