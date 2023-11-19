Options.Triggers.push({
  id: 'Garlemald',
  zoneId: ZoneId.Garlemald,
  triggers: [
    {
      id: 'Hunt Aegeiros Leafstorm',
      type: 'StartsUsing',
      // This always precedes Rimestorm (6C3D).
      netRegex: { id: '6C3C', source: 'Aegeiros', capture: false },
      condition: (data) => data.inCombat,
      // Alarm text mostly because this one kills so many people.
      alarmText: (_data, _matches, output) => output.outAndBehind(),
      outputStrings: {
        outAndBehind: {
          en: 'Get Behind and Out',
          de: 'Geh hinter ihn und dann raus',
          fr: 'Passez derrière et à l\'extérieur',
          ja: '後ろの外側へ',
          cn: '去背后',
          ko: '보스 뒤쪽 바깥으로',
        },
      },
    },
    {
      id: 'Hunt Aegeiros Backhand Blow',
      type: 'StartsUsing',
      netRegex: { id: '6C40', source: 'Aegeiros', capture: false },
      condition: (data) => data.inCombat,
      alertText: (_data, _matches, output) => output.getFront(),
      outputStrings: {
        getFront: {
          en: 'Get Front',
          de: 'Geh nach Vorne',
          fr: 'Allez devant',
          ja: '前へ',
          cn: '去正面',
          ko: '앞쪽으로',
        },
      },
    },
    {
      id: 'Hunt Minerva Anti-personnel Build Ballistic Missile',
      type: 'StartsUsing',
      netRegex: { id: '6B7D', source: 'Minerva' },
      condition: (data) => data.inCombat,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          missleOnYou: {
            en: 'GTFO with marker',
            de: 'Geh raus mit dem Marker',
            fr: 'Partez avec le marquage',
            ja: 'ボスから離れる',
            cn: '快躲开标记',
            ko: '범위 달렷네, 도망가욧',
          },
          missleMarker: {
            en: 'Away from marker',
            de: 'Weg vom Marker',
            fr: 'Éloignez-vous du marquage',
            ja: 'マーカー付きから離れる',
            cn: '躲开标记',
            ko: '범위 달린 사람 피해욧',
          },
        };
        if (data.me === matches.target)
          return { alarmText: output.missleOnYou() };
        return { alertText: output.missleMarker() };
      },
    },
    {
      id: 'Hunt Minerva Ring Build Ballistic Missile',
      type: 'StartsUsing',
      netRegex: { id: '6B7E', source: 'Minerva' },
      condition: (data) => data.inCombat,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          missleOnYou: {
            en: 'Place donut marker under',
            de: 'Platziere Donut-Marker unter ihm',
            fr: 'En dessous le marquage du donut',
            ja: 'ボスから離れる',
            cn: '放置环形标记',
            ko: '도넛 범위가 달렸네, 걍 도망가욧!',
          },
          missleMarker: {
            en: 'Stack on marker',
            de: 'Auf dem Marker sammeln',
            fr: 'Packez-vous sur les marquages',
            ja: 'マーカー付きから離れる',
            cn: '标记处集合',
            ko: '도넛 달린 사람 피해욧 (원래 뭉쳐야하지만)',
          },
        };
        if (data.me === matches.target)
          return { alarmText: output.missleOnYou() };
        return { alertText: output.missleMarker() };
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Aegeiros': 'Aegeiros',
        'Minerva': 'Minerva',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Aegeiros': 'ægeiros',
        'Minerva': 'Minerva',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Aegeiros': 'アイゲイロス',
        'Minerva': 'ミネルウァ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Aegeiros': '黑杨树精',
        'Minerva': '密涅瓦',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Aegeiros': '아이게이로스',
        'Minerva': '미네르바',
      },
    },
  ],
});
