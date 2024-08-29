const effectIdToForcedMarchDir = {
  871: 'forward',
  872: 'backward',
  873: 'left',
  874: 'right', // Right Face
};
Options.Triggers.push({
  id: 'Urqopacha',
  zoneId: ZoneId.Urqopacha,
  triggers: [
    // ****** A-RANK: Nechuciho ****** //
    {
      id: 'Hunt Nechuciho Word of the Wood Single',
      type: 'StartsUsing',
      netRegex: { id: '9BC0', source: 'Nechuciho', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Hunt Nechuciho Whisper of the Wood',
      type: 'StartsUsing',
      netRegex: { id: ['9A45', '9A46', '9A47'], source: 'Nechuciho' },
      run: (data, matches) => {
        // There are three possible cast ids, each of which correspond to a fixed cleave order.
        // We can differentiate using the first safe side for each cast id.
        if (matches.id === '9A45')
          data.nechuWhisperStart = 'behind';
        else if (matches.id === '9A46')
          data.nechuWhisperStart = 'right';
        else if (matches.id === '9A47')
          data.nechuWhisperStart = 'front';
      },
    },
    {
      id: 'Hunt Nechuciho Whisper of the Wood Combo',
      type: 'StartsUsing',
      netRegex: { id: '9A48', source: 'Nechuciho', capture: false },
      durationSeconds: 14,
      infoText: (data, _matches, output) => {
        if (data.nechuWhisperStart !== undefined)
          return output[data.nechuWhisperStart]();
        return output.dodge();
      },
      outputStrings: {
        dodge: {
          en: 'Dodge cleaves x4',
          ko: '휘두르기 피해요 (4번)',
        },
        behind: {
          en: 'Behind + Left (for 3) => Go Front',
          ko: '뒤로 + 왼쪽 (3번) 🔜 앞으로',
        },
        right: {
          en: 'Right (for 2) => Left => Front',
          ko: '오른쪽 (2번) 🔜 왼쪽 🔜 앞으로',
        },
        front: {
          en: 'Front + Left (stay)',
          ko: '앞으로 + 왼쪽 (그대로)',
        },
      },
    },
    {
      id: 'Hunt Nechuciho Whisper of the Wood Behind Reminder',
      type: 'Ability',
      netRegex: { id: '9A48', source: 'Nechuciho', capture: false },
      condition: (data) => data.nechuWhisperStart === 'behind',
      delaySeconds: 4.1,
      alertText: (_data, _matches, output) => output.front(),
      outputStrings: {
        front: Outputs.front,
      },
    },
    {
      id: 'Hunt Nechuciho Whisper of the Wood Right Reminder',
      type: 'Ability',
      netRegex: { id: '9A48', source: 'Nechuciho', capture: false },
      condition: (data) => data.nechuWhisperStart === 'right',
      delaySeconds: 2.1,
      alertText: (_data, _matches, output) => output.leftFront(),
      outputStrings: {
        leftFront: {
          en: 'Left => Front',
          ko: '왼쪽 🔜 앞으로',
        },
      },
    },
    {
      id: 'Hunt Nechuciho Level 5 Death Sentence',
      type: 'StartsUsing',
      netRegex: { id: '9A44', source: 'Nechuciho' },
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt(),
    },
    {
      id: 'Hunt Nechuciho Sentinel Roar',
      type: 'StartsUsing',
      netRegex: { id: '9A43', source: 'Nechuciho', capture: false },
      response: Responses.aoe(),
    },
    // ****** A-RANK: Queen Hawk ****** //
    {
      id: 'Hunt Queen Hawk Bee Be Gone',
      type: 'StartsUsing',
      netRegex: { id: '9A3A', source: 'Queen Hawk', capture: false },
      durationSeconds: 13,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out + Stay Out',
          ko: '밖으로 + 그대로',
        },
      },
    },
    {
      id: 'Hunt Queen Hawk Bee Be Here',
      type: 'StartsUsing',
      netRegex: { id: '9A3B', source: 'Queen Hawk', capture: false },
      durationSeconds: 13,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In + Stay In',
          ko: '안으로 + 그대로',
        },
      },
    },
    {
      id: 'Hunt Queen Hawk Resonant Buzz',
      type: 'StartsUsing',
      netRegex: { id: '9A3E', source: 'Queen Hawk', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Queen Hawk Forced March',
      type: 'GainsEffect',
      netRegex: { effectId: ['871', '872', '873', '874'], source: 'Queen Hawk' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 8,
      infoText: (_data, matches, output) => {
        const dir = effectIdToForcedMarchDir[matches.effectId];
        if (dir !== undefined)
          return output[dir]();
      },
      outputStrings: {
        forward: {
          en: 'Forced March: Forward',
          ko: '강제이동: 앞으로',
        },
        backward: {
          en: 'Forced March: Backward',
          ko: '강제이동: 뒤로',
        },
        left: {
          en: 'Forced March: Left',
          ko: '강제이동: 왼쪽',
        },
        right: {
          en: 'Forced March: Right',
          ko: '강제이동: 오른쪽',
        },
      },
    },
    {
      id: 'Hunt Queen Hawk Straight Spindle',
      type: 'StartsUsing',
      netRegex: { id: '9A42', source: 'Queen Hawk', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Hunt Queen Hawk Frenzied Sting',
      type: 'StartsUsing',
      netRegex: { id: '9A41', source: 'Queen Hawk' },
      response: Responses.tankBuster(),
    },
    // ****** S-RANK: Kirlirger the Abhorrent ****** //
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Nechuciho': 'Nechuciho',
        'Queen Hawk': 'Falkenkönigin',
        'Kirlirger the Abhorrent': 'Kirlirger (?:der|die|das) Abscheuliche[rs]?',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Nechuciho': 'Nechukiho',
        'Queen Hawk': 'reine des guêpes',
        'Kirlirger the Abhorrent': 'Kirlirger l\'abominable',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Nechuciho': 'ネチュキホ',
        'Queen Hawk': 'クイーンホーク',
        'Kirlirger the Abhorrent': '厭忌のキーリーゲー',
      },
    },
  ],
});
