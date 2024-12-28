// TODO: Determine whether Regalia targeting is anywhere in the log data.
// TODO: Determine whether the Brutal Crown position is anywhere usable
// in the log data.
// TODO: Determine whether Downburst/Powerful Gust positions are anywhere
// in the log data.
// TODO: Determine whether the Castellation layout is anywhere in the log data.
// Numerous MapEffects are used throughout the encounter.
// 02000100: Floor windw gusts before Aethertithe
// 00080004: Return floow to normal after Aethertithe
// 00020001: Floor swap to X pattern
Options.Triggers.push({
  id: 'Queen EternalNormal',
  zoneId: ZoneId.TheInterphos,
  timelineFile: 'queen-eternal.txt',
  initData: () => {
    return {
      shriekTargets: [],
      seenFirstCastellation: false,
      playerFloating: false,
    };
  },
  triggers: [
    {
      // Sphene has six total Legitimate Force casts.
      // Four of them are from high hands and are the first in line.
      // 8F22 and 8F23 are from her low hands, and are always the second in line.
      // (Hand height is irrelevant for mechanical resolution,
      // it's just a visual distinguisher for first cast vs second.)
      // The first cast in line is chosen based on what the overall mechanic will be:
      // 8F1E: Left cleave from high hand, low left follow-up
      // 8F1F: Left cleave from high hand, low right follow-up
      // 8F20: Right cleave from high hand, low right follow-up
      // 8F21: Right cleave from high hand, low left follow-up
      id: 'Queen Eternal Legitimate Force',
      type: 'StartsUsing',
      netRegex: { id: ['8F1E', '8F1F', '8F20', '8F21'], source: 'Queen Eternal', capture: true },
      alertText: (_data, matches, output) => {
        if (matches.id === '8F1E')
          return output.stayRight();
        else if (matches.id === '8F1F')
          return output.rightThenLeft();
        else if (matches.id === '8F20')
          return output.stayLeft();
        else if (matches.id === '8F21')
          return output.leftThenRight();
        return output.unknown();
      },
      outputStrings: {
        stayRight: Outputs.right,
        rightThenLeft: Outputs.rightThenLeft,
        stayLeft: Outputs.left,
        leftThenRight: Outputs.leftThenRight,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Queen Eternal Aethertithe Light Repeated AOE',
      type: 'StartsUsing',
      netRegex: { id: '8EFC', source: 'Queen Eternal', capture: false },
      durationSeconds: 30,
      infoText: (_data, _matches, output) => output.repeatedAOE(),
      outputStrings: {
        repeatedAOE: {
          en: 'Continuous light AoE',
          ko: '연속 빛 장판',
        },
      },
    },
    {
      // There aren't any StartsUsing lines for the Aethertithe cones,
      // only MapEffects.
      // 04000100 -- Left cone
      // 08000100 -- Center cone
      // 10000100 -- Right cone
      id: 'Queen Eternal Aethertithe Cones',
      type: 'MapEffect',
      netRegex: { flags: ['04000100', '08000100', '10000100'], capture: true },
      alertText: (_data, matches, output) => {
        if (matches.flags === '04000100')
          return output.goRight();
        else if (matches.flags === '08000100')
          return output.frontCorners();
        else if (matches.flags === '10000100')
          return output.goLeft();
        return output.unknown();
      },
      outputStrings: {
        frontCorners: {
          en: 'Front Corner',
          ja: '前方の角へ',
          ko: '앞쪽 구석으로',
        },
        goLeft: Outputs.left,
        goRight: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Queen Eternal Prosecution Of War',
      type: 'HeadMarker',
      netRegex: { id: '00DA', capture: true },
      response: Responses.tankBuster(), // Non-splashing
    },
    {
      id: 'Queen Eternal Ruthless Regalia Prey',
      type: 'HeadMarker',
      netRegex: { id: '0001', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.regaliaYou(),
      outputStrings: {
        regaliaYou: {
          en: 'Laser tether on YOU',
          ko: '내게 레이저 줄',
        },
      },
    },
    {
      id: 'Queen Eternal Downburst',
      type: 'StartsUsing',
      netRegex: { id: '8F01', source: 'Queen Eternal', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Queen Eternal Powerful Gust',
      type: 'StartsUsing',
      netRegex: { id: '8F03', source: 'Queen Eternal', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Queen Eternal Gravitational Anomaly Gain',
      type: 'GainsEffect',
      netRegex: { effectId: 'EE6', capture: true },
      condition: (data, matches) => {
        return !data.seenFirstCastellation && data.me === matches.target;
      },
      infoText: (_data, _matches, output) => output.floating(),
      run: (data) => data.playerFloating = true,
      outputStrings: {
        floating: {
          en: 'Gravitation -- Levitating',
          ko: '올라가욧!',
        },
      },
    },
    {
      // On all but the first Castellation, it is earlier
      // to use the red instance warning rather than gains/losesEffect.
      // "Gravity increases, making you fall."
      id: 'Queen Eternal Gravity Increase',
      type: 'SystemLogMessage',
      netRegex: { id: '2940', capture: false },
      condition: (data) => data.seenFirstCastellation,
      infoText: (_data, _matches, output) => output.falling(),
      run: (data) => data.playerFloating = false,
      outputStrings: {
        falling: {
          en: 'Gravitation -- Falling',
          ko: '내려가욧!',
        },
      },
    },
    {
      // On all but the first Castellation, it is earlier
      // to use the red instance warning rather than gains/losesEffect.
      // "Gravity decreases, making you float."
      id: 'Queen Eternal Gravity Decrease',
      type: 'SystemLogMessage',
      netRegex: { id: '2941', capture: false },
      condition: (data) => data.seenFirstCastellation,
      infoText: (_data, _matches, output) => output.floating(),
      run: (data) => data.playerFloating = true,
      outputStrings: {
        floating: {
          en: 'Gravitation -- Levitating',
          ko: '올라가욧!',
        },
      },
    },
    {
      id: 'Queen Eternal Castellation',
      type: 'Ability',
      netRegex: { id: '8F05', capture: false },
      alertText: (data, _matches, output) => {
        if (data.playerFloating)
          return output.floatCastle();
        return output.fallCastle();
      },
      run: (data) => {
        // Conditionalize in the unlikely event we run this through the raid emulator.
        if (!data.seenFirstCastellation)
          data.seenFirstCastellation = true;
      },
      outputStrings: {
        fallCastle: {
          en: 'In front of ground windows',
          ko: '바닥 구멍 앞으로',
        },
        floatCastle: {
          en: 'In front of middle windows',
          ko: '중간 구멍 앞으로',
        },
      },
    },
    {
      id: 'Queen Eternal Brutal Crown',
      type: 'StartsUsing',
      netRegex: { id: '8F19', source: 'Queen Eternal', capture: false },
      alertText: (_data, _matches, output) => output.getInDonut(),
      outputStrings: {
        getInDonut: {
          en: 'Get in robot circle',
          ko: '로봇 동그라미 안으로',
        },
      },
    },
    {
      id: 'Queen Eternal Authoritys Gaze Store',
      type: 'GainsEffect',
      netRegex: { effectId: 'EE7', capture: true },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.gazeLater();
      },
      run: (data, matches) => data.shriekTargets.push(matches.target),
      outputStrings: {
        gazeLater: {
          en: 'Gaze on you soon',
          ko: '내게 곧 눈깔',
        },
      },
    },
    {
      id: 'Queen Eternal Authoritys Gaze Resolve',
      type: 'GainsEffect',
      netRegex: { effectId: 'EE7', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 5,
      alarmText: (data, _matches, output) => {
        if (data.shriekTargets.includes(data.me)) {
          const otherShriek = data.shriekTargets.filter((target) => target !== data.me)[0];
          return output.shriekYou({ otherTarget: otherShriek });
        }
        const joinedTargets = data.shriekTargets.join(', ');
        return output.shriekOthers({ comboTargets: joinedTargets });
      },
      run: (data) => data.shriekTargets = [],
      outputStrings: {
        shriekYou: {
          en: 'Gaze -- look away from ${otherTarget}',
          ko: '눈깔! 피해욧: ${otherTarget}',
        },
        shriekOthers: {
          en: 'Look away from ${comboTargets}',
          ko: '보면 안되요: ${comboTargets}',
        },
      },
    },
    {
      id: 'Queen Eternal Authoritys Hold Store',
      type: 'GainsEffect',
      netRegex: { effectId: '1022', capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.bombLater(),
      outputStrings: {
        bombLater: {
          en: 'Acceleration Bomb soon',
          ko: '곧 가속 폭탄',
        },
      },
    },
    {
      id: 'Queen Eternal Authoritys Hold Resolve',
      type: 'GainsEffect',
      netRegex: { effectId: '1022', capture: true },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      response: Responses.stopEverything(),
    },
    {
      id: 'Queen Eternal Absolute Authority Flares',
      type: 'HeadMarker',
      netRegex: { id: '0147', capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.flareMarker(),
      outputStrings: {
        flareMarker: {
          en: 'Flare on YOU',
          ko: '내게 플레어',
        },
      },
    },
    {
      id: 'Queen Eternal Absolute Authority Doritos',
      type: 'HeadMarker',
      netRegex: { id: '0037', capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.doritoStack(),
    },
  ],
});
