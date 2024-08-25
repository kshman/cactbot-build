const mtFireIdToSafeMap = {
  '900D': 'rightWedgeSafe',
  '900E': 'leftWedgeSafe',
  '900F': 'middleWedgeSafe',
  '9010': 'leftWedgeSafe',
  '9011': 'middleWedgeSafe',
  '9012': 'rightWedgeSafe',
};
const mtFireIds = Object.keys(mtFireIdToSafeMap);
const mtFireOutputStrings = {
  leftWedgeSafe: {
    en: '<= Left Wedge Safe',
    ja: '<= 左が安地',
    ko: '❰❰❰왼쪽',
  },
  middleWedgeSafe: {
    en: 'Middle Wedge Safe',
    ja: '中央が安地',
    ko: '◎가운데◎',
  },
  rightWedgeSafe: {
    en: 'Right Wedge Safe =>',
    ja: '右が安地 =>',
    ko: '오른쪽❱❱❱',
  },
};
const bigAoeOutputStrings = {
  cone: {
    en: 'Front Corner',
    ja: '前方の角へ',
    ko: '🡼🡽앞 구석',
  },
  donut: {
    en: 'Donut (In)',
    ja: 'ドーナツの中へ',
    ko: '도넛 안',
  },
  out: Outputs.outOfMelee,
};
const stormDebuffMap = {
  'EEC': 'ice',
  'EF0': 'lightning',
};
const stormDebuffIds = Object.keys(stormDebuffMap);
const arcaneLanesConst = [
  'northFront',
  'northBack',
  'middleFront',
  'middleBack',
  'southFront',
  'southBack',
];
Options.Triggers.push({
  id: 'WorquorLarDorExtreme',
  zoneId: ZoneId.WorqorLarDorExtreme,
  timelineFile: 'valigarmanda-ex.txt',
  initData: () => {
    return {
      arcaneLaneSafe: [...arcaneLanesConst],
      phase: 'start',
      iceSphereAttackCount: 0,
    };
  },
  triggers: [
    {
      id: 'Valigarmanda Ex Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['95C3', '8FD1'], source: 'Valigarmanda' },
      run: (data, matches) => data.phase = matches.id === '95C3' ? 'storm' : 'ice',
    },
    {
      // The first Spikecicle MapEffect line comes shortly before Spikecicle starts casting.
      // The locations are [04, 06, 08, 0A, 0C] (starting center curving east, moving outward),
      // or [05, 07, 09, 0B, 0D] (starting center curving west, moving outward).
      // Vali always starts with '04' or '05', followed by the entire opposite sequence,
      // before resuming the original sequence, e.g., 05 -> 04 thru 0C -> 07 thru 0D.
      id: 'Valigarmanda Ex Spikesicle',
      type: 'MapEffect',
      netRegex: { flags: '00020004', location: ['04', '05'] },
      suppressSeconds: 5,
      alertText: (_data, matches, output) =>
        matches.location === '04' ? output.westSafe() : output.eastSafe(),
      outputStrings: {
        westSafe: {
          en: '<= Get Left/West',
          ja: '<= 左/西へ',
          ko: '❰❰❰왼쪽부터 시작',
        },
        eastSafe: {
          en: 'Get Right/East =>',
          ja: '右/東へ =>',
          ko: '오른쪽부터 시작❱❱❱',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Skyruin Fire',
      type: 'StartsUsing',
      netRegex: { id: '95C4', source: 'Valigarmanda', capture: false },
      // This is a long (~11s) cast bar, although logs show a 5.7s cast time,
      // followed by a 4.2 cast of '8FD4' (Skyruin) which is the actual damage.
      // Use the original cast + a delay so people can change the alert timing.
      delaySeconds: 6,
      response: Responses.bleedAoe(),
    },
    {
      id: 'Valigarmanda Ex Triscourge',
      type: 'StartsUsing',
      netRegex: { id: '8FE7', source: 'Valigarmanda', capture: false },
      response: Responses.aoe(),
    },
    {
      // 0E: east volcano, 0F: west volcano
      id: 'Valigarmanda Ex Volcano',
      type: 'MapEffect',
      netRegex: { flags: '00200010', location: ['0E', '0F'] },
      alertText: (_data, matches, output) =>
        matches.location === '0E' ? output.westSafe() : output.eastSafe(),
      outputStrings: {
        westSafe: Outputs.getLeftAndWest,
        eastSafe: Outputs.getRightAndEast,
      },
    },
    {
      id: 'Valigarmanda Ex Big AOE + Partners',
      type: 'StartsUsing',
      // no cast bar, and partner stacks follow
      // 8FC7: Susurrant Breath (conal)
      // 8FCB: Slithering Strike (out)
      // 8FCF: Strangling Coil (donut)
      netRegex: { id: ['8FC7', '8FCB', '8FCF'], source: 'Valigarmanda' },
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '8FC7') {
          return output.combo({ type: output.cone() });
        } else if (matches.id === '8FCB') {
          return output.combo({ type: output.out() });
        }
        return output.combo({ type: output.donut() });
      },
      outputStrings: {
        ...bigAoeOutputStrings,
        combo: {
          en: '${type} => Stack w/Partner',
          ja: '${type} => ペアで頭割り',
          ko: '${type} 🔜 페어',
        },
      },
    },
    {
      // When this effect expires, players gain 'DC3' (Freezing Up) for 2s (the actual move-check).
      // Use a longer duration to keep the reminder up until the debuff falls off.
      id: 'Valigarmanda Ex Calamity\'s Chill',
      type: 'GainsEffect',
      netRegex: { effectId: 'EEE' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      durationSeconds: 6,
      response: Responses.moveAround('alert'),
    },
    {
      id: 'Valigarmanda Ex Calamity\'s Bolt',
      type: 'GainsEffect',
      netRegex: { effectId: 'EEF' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 6,
      response: Responses.spread(),
    },
    {
      id: 'Valigarmanda Ex Calamity\'s Inferno',
      type: 'GainsEffect',
      netRegex: { effectId: 'EEA' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.healerGroups(),
      outputStrings: {
        healerGroups: {
          en: 'Healer Groups',
          ja: 'ヒラに頭割り',
          ko: '4:4 힐러 🔜 장판 세개',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Mountain Fire Tank',
      type: 'Ability',
      netRegex: { id: '900C', source: 'Valigarmanda', capture: false },
      condition: (data) => data.role === 'tank',
      // There's ~5.5s between the end of the cast and damage applied from first tower soak.
      // The tower soak/damage happens six times; use a long duration to keep this reminder up.
      durationSeconds: 30.5,
      // use infoText to distinguish from wedge direction alert calls at the same time
      infoText: (_data, _matches, output) => output.soakSwap(),
      outputStrings: {
        soakSwap: {
          en: 'Tank Tower (soak/swap)',
          ja: 'タンク塔 (踏む/スイッチ)',
          ko: '탱크 타워로 (교대로)',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Mountain Fire First Wedge',
      type: 'Ability',
      netRegex: { id: '900C', source: 'Valigarmanda', capture: false },
      // slight delay so as not to overlap with the tank tower call
      delaySeconds: 1,
      alertText: (_data, _matches, output) => output.firstFire(),
      outputStrings: {
        firstFire: mtFireOutputStrings.middleWedgeSafe,
      },
    },
    {
      id: 'Valigarmanda Ex Mountain Fire Subsequent Wedge',
      type: 'Ability',
      netRegex: { id: mtFireIds, source: 'Valigarmanda' },
      alertText: (_data, matches, output) => {
        const safe = mtFireIdToSafeMap[matches.id];
        if (safe === undefined)
          return;
        return output[safe]();
      },
      outputStrings: mtFireOutputStrings,
    },
    {
      id: 'Valigarmanda Ex Disaster Zone',
      type: 'StartsUsing',
      netRegex: { id: ['8FD5', '8FD7', '8FD9'], source: 'Valigarmanda', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Valigarmanda Ex Ruin Foretold',
      type: 'StartsUsing',
      netRegex: { id: '9692', source: 'Valigarmanda', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Valigarmanda Ex Adds + Wild Charge Stacks',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7B', capture: false },
      // This effect is continuously re-applied during the phase, so big suppress needed
      suppressSeconds: 99999,
      alertText: (data, _matches, output) => {
        const roleOutput = data.role === 'tank' ? output.tank() : output.nonTank();
        return output.combo({ role: roleOutput });
      },
      outputStrings: {
        combo: {
          en: 'Kill Adds + Healer Groups ${role}',
          ja: '雑魚を倒して + ヒラグループ ${role}',
          ko: '쫄 + 4:4 힐러 ${role}',
        },
        tank: {
          en: '(be in front)',
          ja: '(前へ)',
          ko: '(맨 앞으로)',
        },
        nonTank: {
          en: '(behind tank)',
          ja: '(タンクの後ろへ)',
          ko: '(탱크 뒤로)',
        },
      },
    },
    // 3-hit AOE. First damage applied ~3.1s after cast finishes, then ~8.5s & ~16.5 thereafter.
    // Time these alerts so that warnings go out ~5s before each hit.
    {
      id: 'Valigarmanda Ex Tulidisaster 1',
      type: 'StartsUsing',
      netRegex: { id: '9008', capture: false },
      delaySeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'Valigarmanda Ex Tulidisaster 2',
      type: 'StartsUsing',
      netRegex: { id: '9008', capture: false },
      delaySeconds: 13.5,
      response: Responses.aoe(),
    },
    {
      id: 'Valigarmanda Ex Tulidisaster 3',
      type: 'StartsUsing',
      netRegex: { id: '9008', capture: false },
      delaySeconds: 21.5,
      response: Responses.aoe(),
    },
    //
    // ------------- STORM PHASE -------------
    //
    {
      id: 'Valigarmanda Ex Skyruin Storm',
      type: 'StartsUsing',
      netRegex: { id: '95C3', source: 'Valigarmanda', capture: false },
      // This is a long (~11s) cast bar, although logs show a 5.7s cast time,
      // followed by a 4.2 cast of '8FD3' (Skyruin) which is the actual damage.
      // Use the original cast + delay so people can change the alert timing.
      delaySeconds: 6,
      response: Responses.bleedAoe(),
    },
    {
      id: 'Valigarmanda Ex Storm Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: stormDebuffIds },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const debuff = stormDebuffMap[matches.effectId];
        const duration = parseFloat(matches.duration);
        // each player receives both debuffs - one is 59s, the other 99s
        if (debuff === undefined || duration > 60)
          return;
        data.firstStormDebuff = debuff;
      },
    },
    {
      id: 'Valigarmanda Ex Calamity\'s Flames',
      type: 'GainsEffect',
      netRegex: { effectId: 'EE9' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 6,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.healerGroups(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    // 901D is the 'Hail of Feathers' cast from the first feather to drop
    // Use 'StartsUsingExtra', as 'StartsUsing' positions can be stale.
    {
      //
      id: 'Valigarmanda Ex Hail of Feathers',
      type: 'StartsUsingExtra',
      netRegex: { id: '901D' },
      alertText: (data, matches, output) => {
        const posX = parseFloat(matches.x);
        if (posX < 100) {
          data.prFeatureLocation = 'right';
          return output.startEast();
        }
        data.prFeatureLocation = 'left';
        return output.startWest();
      },
      outputStrings: {
        startEast: Outputs.getRightAndEast,
        startWest: Outputs.getLeftAndWest,
      },
    },
    {
      id: 'Valigarmanda Ex Feather of Ruin',
      type: 'Ability',
      netRegex: { id: '8FDE', source: 'Feather of Ruin', capture: false },
      // only need to capture one, but delay the alert for people to rotate
      delaySeconds: 5,
      durationSeconds: 8,
      suppressSeconds: 99999,
      infoText: (data, _matches, output) => {
        if (data.prFeatureLocation === 'left')
          return output.killLeft();
        else if (data.prFeatureLocation === 'right')
          return output.killRight();
        return output.killFeather();
      },
      outputStrings: {
        killFeather: {
          en: 'Kill Feather + Stand in safe tile',
          ja: '羽を壊す => 安全な床へ',
          ko: '깃털 잡으면서 + 안전 타일로',
        },
        killLeft: {
          en: 'Kill Left Feather',
          ja: '羽を壊す',
          ko: '오른쪽 깃털 잡아요',
        },
        killRight: {
          en: 'Kill Right Feather',
          ja: '羽を壊す',
          ko: '왼쪽 깃털 잡아요',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Post-Feather Spread',
      type: 'Ability',
      // as soon as the feathers explode, people can spread
      // use a longer duration to better align to the mechanic
      netRegex: { id: '8FDF', source: 'Valigarmanda', capture: false },
      durationSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.firstStormDebuff === undefined)
          return;
        return output[data.firstStormDebuff]();
      },
      outputStrings: {
        ice: {
          en: 'Spread - elevated tile',
          ja: '散開 - 高台',
          ko: '흩어져요 ▲뜨는 타일',
        },
        lightning: {
          en: 'Spread - ground tile',
          ja: '散開 - 地面',
          ko: '흩어져요 ▼바닥 타일',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Storm Big AOEs + Bait',
      type: 'StartsUsing',
      // no cast bar, and baited AOE puddles follow
      // 8FC5: Susurrant Breath (conal)
      // 8FC9: Slithering Strike (out)
      // 8FCD: Strangling Coil (donut)
      netRegex: { id: ['8FC5', '8FC9', '8FCD'], source: 'Valigarmanda' },
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '8FC5') {
          return output.combo({ type: output.cone() });
        } else if (matches.id === '8FC9') {
          return output.combo({ type: output.out() });
        }
        return output.combo({ type: output.donut() });
      },
      outputStrings: {
        ...bigAoeOutputStrings,
        combo: {
          en: '${type} => Bait Puddles',
          ja: '${type} => 捨てて',
          ko: '${type} + 모여있다 🔜 바로 이동(장판)',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Crackling Cataclysm',
      type: 'StartsUsing',
      netRegex: { id: '8FC1', source: 'Valigarmanda', capture: false },
      suppressSeconds: 2,
      response: Responses.moveAway('alarm'),
    },
    {
      // NOTE: Have not seen any logs with stale position data, but if its an issue,
      // this can be changed to a `getCombatants` call.
      id: 'Valigarmanda Ex Storm Arcane Sphere Collect',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Sphere' },
      durationSeconds: 6,
      run: (data, matches) => {
        const posY = parseFloat(matches.y);
        // 5 spheres will spawn in 6 possible y positions: 87.5, 92.5, 97.5, 102.5, 107.5, 112.5
        if (posY < 88)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'northFront');
        else if (posY < 93)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'northBack');
        else if (posY < 98)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'middleFront');
        else if (posY < 103)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'middleBack');
        else if (posY < 108)
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'southFront');
        else
          data.arcaneLaneSafe = data.arcaneLaneSafe.filter((lane) => lane !== 'southBack');
      },
    },
    {
      id: 'Valigarmanda Ex Storm Arcane Sphere Safe',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Sphere', capture: false },
      condition: (data) => data.phase === 'storm',
      delaySeconds: 1,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        const safeStr = data.arcaneLaneSafe[0];
        if (data.arcaneLaneSafe.length !== 1 || safeStr === undefined)
          return output.avoid();
        return output.combo({ dir: output[safeStr]() });
      },
      outputStrings: {
        avoid: {
          en: 'Dodge spheres - elevated tile',
          ja: '玉を避ける - 高台',
          ko: '(어딘지 모름) 동글 피하면서 ▲뜨는 타일로',
        },
        combo: {
          en: '${dir} - elevated tile',
          ja: '${dir} - 高台',
          ko: '${dir} ▲뜨는 타일',
        },
        northFront: {
          en: 'North Row, Front Half',
          ja: '北側の前方へ',
          ko: '북쪽 앞열',
        },
        northBack: {
          en: 'North Row, Back Half',
          ja: '北側の後方へ',
          ko: '북쪽 뒷열',
        },
        middleFront: {
          en: 'Middle Row, Front Half',
          ja: '中央の前方へ',
          ko: '가운데 앞열',
        },
        middleBack: {
          en: 'Middle Row, Back Half',
          ja: '中央の後方へ',
          ko: '가운데 뒷열',
        },
        southFront: {
          en: 'South Row, Front Half',
          ja: '南側の前方へ',
          ko: '남쪽 앞열',
        },
        southBack: {
          en: 'South Row, Back Half',
          ja: '南側の後方へ',
          ko: '남쪽 뒷열',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Post-Arcane Sphere Spread',
      type: 'Ability',
      // as soon as the arcane spheres go off, people can spread
      netRegex: { id: '985A', source: 'Arcane Sphere', capture: false },
      durationSeconds: 9,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        // This is the opposite of firstStormDebuff (as it's the second one)
        if (data.firstStormDebuff === undefined)
          return;
        if (data.firstStormDebuff === 'ice')
          return output.lightning();
        return output.ice();
      },
      outputStrings: {
        ice: {
          en: 'Spread - elevated tile',
          ja: '散開 - 高台',
          ko: '흩어져요 ▲뜨는 타일',
        },
        lightning: {
          en: 'Spread - ground tile',
          ja: '散開 - 地面',
          ko: '흩어져요 ▼바닥 타일',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Ruinfall Tower',
      type: 'StartsUsing',
      netRegex: { id: '8FFD', source: 'Valigarmanda', capture: false },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.soakTower();
        return output.avoidTower();
      },
      outputStrings: {
        soakTower: {
          en: 'Soak Tower',
          ja: '塔を踏む',
          ko: '타워 밟아요',
        },
        avoidTower: {
          en: 'Avoid Tower',
          ja: '塔を避ける',
          ko: '타워 피해요',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Ruinfall Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8FFF', source: 'Valigarmanda', capture: false },
      // 8s between cast start and knockback applied
      delaySeconds: 3,
      response: Responses.knockback(),
    },
    //
    // ------------- ICE PHASE -------------
    //
    {
      id: 'Valigarmanda Ex Skyruin Ice',
      type: 'StartsUsing',
      netRegex: { id: '8FD1', source: 'Valigarmanda', capture: false },
      // This is a long (~11s) cast bar, although logs show a 5.7s cast time,
      // followed by a 4.2 cast of '8FD2' (Skyruin) which is the actual damage.
      // Use the original cast + delay so people can change the alert timing.
      delaySeconds: 6,
      response: Responses.bleedAoe(),
    },
    {
      // George R.R. Martin, don't sue us.
      id: 'Valigarmanda Ex Scourge of Ice and Fire',
      type: 'GainsEffect',
      // EEB - Calamity's Embers (Fire), EED - Calamity's Bite (ice)
      // We only need one, since alerts are entirely role-based.
      netRegex: { effectId: 'EEB', capture: false },
      delaySeconds: 5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.away();
        return output.healerGroups();
      },
      outputStrings: {
        away: {
          en: 'Away from Group',
          ja: '外へ',
          ko: '구석으로! 혼자!',
        },
        healerGroups: {
          en: 'Healer Groups',
          ja: '3:3ヒラに頭割り',
          ko: '3:3 힐러',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Avalanche Collect',
      type: 'MapEffect',
      // 00020001 - cleaves SW half (front/right safe)
      // 00200010 - cleaves NE half (back/left safe)
      netRegex: { flags: ['00020001', '00200010'], location: '03' },
      run: (data, matches) => {
        if (matches.flags === '00020001')
          data.avalancheSafe = 'frontRight';
        else
          data.avalancheSafe = 'backLeft';
      },
    },
    {
      id: 'Valigarmanda Ex Big AOE + Avalanche',
      type: 'StartsUsing',
      // no cast bar, paired with an avalanche
      // 8FC6: Susurrant Breath (conal)
      // 8FCA: Slithering Strike (out)
      // 8FCE: Strangling Coil (donut)
      netRegex: { id: ['8FC6', '8FCA', '8FCE'], source: 'Valigarmanda' },
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        // these casts also happen in the final (no-avalanche) aoe mechanic
        // so use data.avalancheSafe to prevent this trigger from mis-firing
        if (data.avalancheSafe === undefined)
          return;
        // we can use backLeft/frontRight output as/is for donut and out,
        // but for cone, we'll need to tweak it
        let safe;
        if (matches.id === '8FC6')
          safe = data.avalancheSafe === 'backLeft' ? 'coneNWSafe' : 'coneNESafe';
        else
          safe = data.avalancheSafe;
        const safeOutput = output[safe]();
        let typeOutput;
        if (matches.id === '8FC6')
          typeOutput = output.cone();
        else if (matches.id === '8FCA')
          typeOutput = output.out();
        else
          typeOutput = output.donut();
        return output.combo({ type: typeOutput, safe: safeOutput });
      },
      run: (data) => delete data.avalancheSafe,
      outputStrings: {
        ...bigAoeOutputStrings,
        backLeft: {
          en: 'Be Back/Left',
          ja: '後ろ/左へ',
          ko: '🡿뒤/왼쪽으로',
        },
        frontRight: {
          en: 'Be Front/Right',
          ja: '前/右へ',
          ko: '🡽앞/오른쪽으로',
        },
        coneNWSafe: {
          en: 'NW Safe',
          ja: '左上(北西) 安地',
          ko: '🡼북서 안전',
        },
        coneNESafe: {
          en: 'NE Safe',
          ja: '右上(北東) 安地',
          ko: '🡽북동 안전',
        },
        unknown: {
          en: 'Dodge Avalanche',
          ja: '雪崩を避けて',
          ko: '(눈사태 피해요)',
        },
        combo: {
          en: '${type} - ${safe}',
          ja: '${type} - ${safe}',
          ko: '${type} ${safe}',
        },
      },
    },
    {
      // Safe corner is opposite the northmost sphere
      // NOTE: Have not seen any logs with stale position data, but if its an issue,
      // this can be changed to a `getCombatants` call.
      id: 'Valigarmanda Ex Ice Arcane Sphere Safe',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Sphere' },
      condition: (data) => data.phase === 'ice',
      alertText: (data, matches, output) => {
        const posY = parseFloat(matches.y);
        if (posY > 90)
          return;
        // this part of the trigger only gets reached once per set of spheres,
        // so we can increment the counter
        data.iceSphereAttackCount++;
        const posX = parseFloat(matches.x);
        if (posX > 100)
          return output.nwSafe();
        return output.neSafe();
      },
      outputStrings: {
        nwSafe: {
          en: 'Northwest',
          ja: '北西',
          ko: '🡼북서쪽에 안전지대!',
        },
        neSafe: {
          en: 'Northeast',
          ja: '北東',
          ko: '🡽북동쪽에 안전지대!',
        },
      },
    },
    {
      id: 'Valigarmanda Spikecicle + Avalanche',
      type: 'Ability',
      // Use the cast of Spikesicle during ice phase, but allow 5 seconds for Collect
      netRegex: { id: '8FF2', source: 'Valigarmanda', capture: false },
      condition: (data) => data.phase === 'ice',
      delaySeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.avalancheSafe === undefined)
          return output.unknown();
        else if (data.avalancheSafe === 'backLeft')
          return output.dodgeLeft();
        return output.dodgeRight();
      },
      run: (data) => delete data.avalancheSafe,
      outputStrings: {
        dodgeLeft: {
          en: '<= Go Left (Dodge Avalanche)',
          ja: '<= 左へ (雪崩を避けて)',
          ko: '❰❰❰왼쪽으로 (눈사태)',
        },
        dodgeRight: {
          en: 'Go Right (Dodge Avalanche) =>',
          ja: '右へ => (雪崩を避けて)',
          ko: '오른쪽으로 (눈사태)❱❱❱',
        },
        unknown: {
          en: 'Dodge Avalanche',
          ja: '雪崩を避けて',
          ko: '눈사태 피해요',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Ice Big AOE',
      type: 'StartsUsing',
      // no cast bar, and no paired mechanic for this one
      // 8FC8: Susurrant Breath (conal)
      // 8FCC: Slithering Strike (out)
      // 8FD0: Strangling Coil (donut)
      netRegex: { id: ['8FC8', '8FCC', '8FD0'], source: 'Valigarmanda' },
      // since these casts also accompany the same cast ids used for avalanche, use a condition
      condition: (data) => data.phase === 'ice' && data.avalancheSafe === undefined,
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '8FC8')
          return output.cone();
        else if (matches.id === '8FCC')
          return output.out();
        return output.donut();
      },
      outputStrings: bigAoeOutputStrings,
    },
    {
      id: 'Valigarmanda Ex Ice Arcane Sphere + Avalanche',
      type: 'Ability',
      netRegex: { id: '8FC2', source: 'Arcane Sphere', capture: false },
      // Avalanche only happens on the second set of Spheres during ice phase
      condition: (data) => data.phase === 'ice' && data.iceSphereAttackCount === 2,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.avalancheSafe === undefined)
          return output.unknown();
        else if (data.avalancheSafe === 'backLeft')
          return output.dodgeLeft();
        return output.dodgeRight();
      },
      run: (data) => delete data.avalancheSafe,
      outputStrings: {
        dodgeLeft: {
          en: '<= Go Left (Dodge Avalanche)',
          ja: '<= 左へ (雪崩を避けて)',
          ko: '❰❰❰왼쪽으로 (눈사태)',
        },
        dodgeRight: {
          en: 'Go Right (Dodge Avalanche) =>',
          ja: '右へ => (雪崩を避けて)',
          ko: '오른쪽으로 (눈사태)❱❱❱',
        },
        unknown: {
          en: 'Dodge Avalanche',
          ja: '雪崩を避けて',
          ko: '눈사태 피해요',
        },
      },
    },
    {
      id: 'Valigarmanda Ex Freezing Dust',
      type: 'StartsUsing',
      netRegex: { id: '8FF0', source: 'Valigarmanda', capture: false },
      response: Responses.moveAround('alert'),
    },
    {
      id: 'Valigarmanda Ex Freezing Dust Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8FF1', source: 'Valigarmanda', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Valigarmanda Ex Freezing Dust Spread',
      type: 'StartsUsing',
      netRegex: { id: '8FF3', source: 'Valigarmanda', capture: false },
      response: Responses.spread(),
    },
    {
      id: 'Valigarmanda Ex Freezing Dust Stack',
      type: 'StartsUsing',
      netRegex: { id: '8FF4', source: 'Valigarmanda', capture: false },
      response: Responses.stackMarker(),
    },
    // Don't need a trigger for Ice Talon -- it's very obvious and not fast
    //
    // ------------- FINAL PHASE -------------
    //
    {
      id: 'Valigarmanda Ex Wrath Unfurled',
      type: 'StartsUsing',
      netRegex: { id: '9945', source: 'Valigarmanda', capture: false },
      response: Responses.aoe(),
    },
    // All other mechanics are repeats of earlier mechanics and handled by those triggers.
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Strangling Coil/Slithering Strike/Susurrant Breath': 'Middle/Away/Front Corners',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Arcane Sphere': 'arkan(?:e|er|es|en) Sphäre',
        'Feather of Ruin': 'Feder der Geißel',
        'Flame-kissed Beacon': 'flammend(?:e|er|es|en) Omen',
        'Ice Boulder': 'Eisbrocken',
        'Thunderous Beacon': 'blitzend(?:e|er|es|en) Omen',
        'Valigarmanda': 'Valigarmanda',
      },
      'replaceText': {
        'Blighted Bolt': 'Unheilvoller Blitzschlag',
        'Calamitous Cry': 'Unheilvoller Schrei',
        'Charring Cataclysm': 'Infernales Desaster',
        'Chilling Cataclysm': 'Gefrorenes Desaster',
        'Crackling Cataclysm': 'Donnerndes Desaster',
        'Disaster Zone': 'Katastrophengebiet',
        'Freezing Dust': 'Froststaub',
        'Hail of Feathers': 'Federhagel',
        'Ice Boulder': 'Eisbrocken',
        'Ice Talon': 'Eiskralle',
        'Mountain Fire': 'Bergfeuer',
        'Northern Cross': 'Kreuz des Nordens',
        'Ruin Foretold': 'Katastrophenwarnung',
        'Ruinfall': 'Ruinsturz',
        'Scourge of Fire': 'Geißel des Feuers',
        'Scourge of Ice/Fire': 'Geißel des Eises/Feuers',
        'Scourge of Thunder': 'Geißel des Donners',
        'Skyruin': 'Geißel der Himmel',
        'Slithering Strike': 'Schlängelnder Hieb',
        'Sphere Shatter': 'Sphärensplitterung',
        'Spikesicle': 'Eislanze',
        'Strangling Coil': 'Würgewickel',
        'Susurrant Breath': 'Zischender Atem',
        'Thunderous Breath': 'Gewitteratem',
        'Triscourge': 'Dreifache Geißel',
        'Tulidisaster': 'Turalisaster',
        'Valigarmanda': 'Valigarmanda',
        'Volcanic Drop': 'Feuerbergbombe',
        'Wrath Unfurled': 'Entfalteter Zorn',
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(fire phase\\)': '(Feuer Phase)',
        '\\(ice phase\\)': '(Eis Phase)',
        '\\(ice or storm phase?\\)': '(Eis oder Blitz Phase)',
        '\\(knockback\\)': '(Rückstoß)',
        '\\(storm phase\\)': '(Blitz Phase)',
        '\\(tower\\)': '(Turm)',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Arcane Sphere': 'sphère arcanique',
        'Feather of Ruin': 'plume de Valigarmanda',
        'Flame-kissed Beacon': 'pylône de feu',
        'Ice Boulder': 'amas de glace',
        'Thunderous Beacon': 'pylône de foudre',
        'Valigarmanda': 'Valigarmanda',
      },
      'replaceText': {
        'Blighted Bolt': 'Éclairs de foudre catastrophiques',
        'Calamitous Cry': 'Cri calamiteux',
        'Charring Cataclysm': 'Désastre brûlant',
        'Chilling Cataclysm': 'Désastre glaçant',
        'Crackling Cataclysm': 'Désastre foudroyant',
        'Disaster Zone': 'Zone de désastre',
        'Freezing Dust': 'Poussière glaçante',
        'Hail of Feathers': 'Déluge de plumes',
        'Ice Boulder': 'amas de glace',
        'Ice Talon': 'Serres de glace',
        'Mountain Fire': 'Feu de montagne',
        'Northern Cross': 'Croix du nord',
        'Ruin Foretold': 'Signe de désastre',
        'Ruinfall': 'Plongeon calamiteux',
        'Scourge of Fire': 'Fléau brûlant',
        'Scourge of Ice': 'Fléau glaçant',
        'Scourge of Thunder': 'Fléau foudroyant',
        'Skyruin': 'Désastre vivant',
        'Slithering Strike': 'Frappe sinueuse',
        'Sphere Shatter': 'Rupture glacée',
        'Spikesicle': 'Stalactopointe',
        'Strangling Coil': 'Enroulement sinueux',
        'Susurrant Breath': 'Souffle sinueux',
        'Thunderous Breath': 'Souffle du dragon',
        'Triscourge': 'Tri-fléau',
        'Tulidisaster': 'Désastre du Tural',
        'Valigarmanda': 'Valigarmanda',
        'Volcanic Drop': 'Obus volcanique',
        'Wrath Unfurled': 'Rage déployée',
        '\\(cast\\)': '(Incante)',
        '\\(damage\\)': '(Dommage)',
        '\\(enrage\\)': '(Enrage)',
        '\\(fire phase\\)': '(Phase de Feu)',
        '\\(ice phase\\)': '(Phase de Glace)',
        '\\(ice or storm phase?\\)': '(Phase de Feu ou de Glace)',
        '\\(knockback\\)': '(Poussée)',
        '\\(storm phase\\)': '(Phase Orageuse)',
        '\\(tower\\)': '(Tour)',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Arcane Sphere': '立体魔法陣',
        'Feather of Ruin': 'ヴァリガルマンダの羽根',
        'Flame-kissed Beacon': '火の徴',
        'Ice Boulder': '氷塊',
        'Thunderous Beacon': '雷の徴',
        'Valigarmanda': 'ヴァリガルマンダ',
      },
      'replaceText': {
        'Blighted Bolt': '災厄の落雷',
        'Calamitous Cry': 'カラミティクライ',
        'Charring Cataclysm': 'ファイアディザスター',
        'Chilling Cataclysm': 'コールドディザスター',
        'Crackling Cataclysm': 'ライトニングディザスター',
        'Disaster Zone': 'ディザスターゾーン',
        'Freezing Dust': 'フリジングダスト',
        'Hail of Feathers': 'フェザーヘイル',
        'Ice Boulder': '氷塊',
        'Ice Talon': 'アイスタロン',
        'Mountain Fire': 'マウンテンファイア',
        'Northern Cross': 'ノーザンクロス',
        'Ruin Foretold': 'ディザスターサイン',
        'Ruinfall': 'カラミティダイヴ',
        'Scourge of Fire': 'スカージ・オフ・ファイア',
        'Scourge of Ice': 'スカージ・オブ・アイス',
        'Scourge of Thunder': 'スカージ・オブ・サンダー',
        'Skyruin': 'リビングディザスター',
        'Slithering Strike': 'スリザーストライク',
        'Sphere Shatter': '破裂',
        'Spikesicle': 'アイシクルスパイク',
        'Strangling Coil': 'スリザーコイル',
        'Susurrant Breath': 'スリザーブレス',
        'Thunderous Breath': 'サンダーブレス',
        'Triscourge': 'トライスカージ',
        'Tulidisaster': 'トラルディザスター',
        'Valigarmanda': 'ヴァリガルマンダ',
        'Volcanic Drop': '火山弾',
        'Wrath Unfurled': 'ラース・アンファールド',
      },
    },
  ],
});
