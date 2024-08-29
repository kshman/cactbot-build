Options.Triggers.push({
  id: 'YakTel',
  zoneId: ZoneId.YakTel,
  initData: () => ({
    rraxTriplicateSafe: [],
  }),
  triggers: [
    // ****** A-RANK: Starcrier ****** //
    {
      id: 'Hunt Starcrier Wingsbreadth Winds',
      type: 'StartsUsing',
      netRegex: { id: '90AE', source: 'Starcrier', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Hunt Starcrier Stormwall Winds',
      type: 'StartsUsing',
      netRegex: { id: '90AF', source: 'Starcrier', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Hunt Starcrier Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '912B', source: 'Starcrier', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Starcrier Swiftwind Serenade',
      type: 'StartsUsing',
      netRegex: { id: '91B9', source: 'Starcrier', capture: false },
      response: Responses.awayFromFront(),
    },
    // ****** A-RANK: Rrax Yity'a ****** //
    {
      id: 'Hunt Rrax Laughing Leap',
      type: 'StartsUsing',
      netRegex: { id: '91FC', source: 'Rrax Yity\'a', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Hunt Rrax Right Wingblade',
      type: 'StartsUsing',
      netRegex: { id: ['912C', '912E'], source: 'Rrax Yity\'a', capture: false },
      alertText: (_data, _matches, output) => output.left(),
      run: (data) => data.rraxTriplicateSafe.push('left'),
      outputStrings: {
        left: Outputs.left,
      },
    },
    {
      id: 'Hunt Rrax Left Wingblade',
      type: 'StartsUsing',
      netRegex: { id: ['912D', '912F'], source: 'Rrax Yity\'a', capture: false },
      alertText: (_data, _matches, output) => output.right(),
      run: (data) => data.rraxTriplicateSafe.push('right'),
      outputStrings: {
        right: Outputs.right,
      },
    },
    {
      id: 'Hunt Rrax Triplicate Reflex',
      type: 'StartsUsing',
      netRegex: { id: '9132', source: 'Rrax Yity\'a', capture: false },
      durationSeconds: 11.5,
      alertText: (data, _matches, output) => {
        const safe = data.rraxTriplicateSafe;
        if (safe.length !== 3)
          return output.unknown();
        return safe.map((spot) => output[spot]()).join(output.next());
      },
      run: (data) => data.rraxTriplicateSafe = [],
      outputStrings: {
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
        next: Outputs.next,
      },
    },
    // ****** S-RANK: Neyoozoteel ****** //
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Starcrier': 'Sternschreier',
        'Rrax Yity\'a': 'Rrax Yity\'a',
        'Neyoozoteel': 'Neyoozoteel',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Starcrier': 'furopluminescent',
        'Rrax Yity\'a': 'Rrax Yity\'a',
        'Neyoozoteel': 'Neyozzoteel',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Starcrier': '幻煌鳥',
        'Rrax Yity\'a': 'ラシュイチャ',
        'Neyoozoteel': 'ネヨーゾテール',
      },
    },
  ],
});
