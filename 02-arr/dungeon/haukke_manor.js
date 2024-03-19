Options.Triggers.push({
  id: 'HaukkeManor',
  zoneId: ZoneId.HaukkeManor,
  triggers: [
    {
      id: 'Haukke Normal Dark Mist Stun',
      type: 'StartsUsing',
      netRegex: { id: '2C1', source: ['Manor Maidservant', 'Manor Claviger', 'Lady Amandine'] },
      condition: (data) => data.CanStun(),
      suppressSeconds: 2,
      response: Responses.stun('info'),
    },
    {
      id: 'Haukke Normal Steward Soul Drain Stun',
      type: 'StartsUsing',
      netRegex: { id: '35C', source: 'Manor Steward' },
      condition: (data) => data.CanStun(),
      response: Responses.stun('info'),
    },
    {
      // Particle and spell effects make this particular Dark Mist hard to see.
      id: 'Haukke Normal Amandine Dark Mist Dodge',
      type: 'StartsUsing',
      netRegex: { id: '2C1', source: 'Lady Amandine', capture: false },
      condition: (data) => !data.CanStun(),
      response: Responses.outOfMelee('alert'),
    },
    {
      id: 'Haukke Normal Amandine Void Fire III',
      type: 'StartsUsing',
      netRegex: { id: '356', source: 'Lady Amandine' },
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt('info'),
    },
    {
      id: 'Haukke Normal Amandine Void Thunder III',
      type: 'StartsUsing',
      netRegex: { id: '358', source: 'Lady Amandine' },
      condition: Conditions.targetIsYou(),
      response: Responses.getBehind('info'),
    },
    {
      // 2 Lady's Handmaiden and 1 Manor Sentry Spawn
      // The sentry outside the bosses room loads when you enter the zone.
      // This causes the trigger to go off early, parsing for the Handmaiden fixes the problem.
      // Suppression included since 2 Handmaiden's spawn at the same time
      id: 'Haukke Normal Ladys Handmaiden',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '424', capture: false },
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Kill Sentry',
          de: 'Wachposten besiegen',
          fr: 'Tuez la sentinelle',
          ja: '守衛を倒す',
          cn: '击杀守卫',
          ko: '센트리 잡아요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Manor Maidservant': 'Hausmädchen',
        'Manor Claviger': 'Herrenhaus-Schlüsselträgerin',
        'Lady Amandine': 'Lady Amandine',
        'Manor Steward': 'Seneschall',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Manor Maidservant': 'soubrette du manoir',
        'Manor Claviger': 'clavière du manoir',
        'Lady Amandine': 'dame Amandine',
        'Manor Steward': 'intendant du manoir',
        'The void lamps have begun emitting an eerie glow':
          'La lanterne sinistre luit d\'un éclat lugubre',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Manor Maidservant': '御用邸のメイド',
        'Manor Claviger': '夫人付きクラヴィジャー',
        'Lady Amandine': 'レディ・アマンディヌ',
        'Manor Steward': '御用邸の執事長',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Manor Maidservant': '庄园的女仆',
        'Manor Claviger': '随从女工',
        'Lady Amandine': '阿芒迪娜女士',
        'Manor Steward': '庄园的总管',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Manor Maidservant': '별궁의 하녀',
        'Manor Claviger': '부인의 청지기',
        'Lady Amandine': '레이디 아망딘',
        'Manor Steward': '별궁의 집사장',
      },
    },
  ],
});
