// MapEffect tile map:
// 00 01 02 03
// 04 05 06 07
// 08 09 0A 0B
// 0C 0D 0E 0F
// +0x10 is a duplicate used for E&E knockback display
const mapEffectTileState = {
  'cracked': '00020001',
  'clear': '00040004',
  'quickRebuid': '00080004',
  'broken': '00200010',
  'refreshing': '00800004',
  'rebuilding': '01000004', // rebuilding from broken
};
const mapEffectData = {
  '00': {
    'location': '00',
    'centerX': 85,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '03': {
    'location': '03',
    'centerX': 115,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '09': {
    'location': '09',
    'centerX': 95,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0A': {
    'location': '0A',
    'centerX': 105,
    'centerY': 105,
    ...mapEffectTileState,
  },
};
const headMarkerData = {
  // Vfx Path: tank_lockon02k1
  tankbuster: '00DA',
  // Vfx Path: lockon8_t0w
  spreadMarker1: '00F4',
  // Vfx Path: loc05sp_05a_se_p
  spreadMarker2: '0178',
  // Vfx Path: m0884_vanish_7sec_p1
  pawprint: '021A',
};
Options.Triggers.push({
  id: 'AacLightHeavyweightM1Savage',
  zoneId: ZoneId.AacLightHeavyweightM1Savage,
  timelineFile: 'r1s.txt',
  initData: () => ({
    actorSetPosTracker: {},
    storedLeaps: {
      oneTwoPaw: {},
      quadCross: {},
    },
    //
    seenLeapJump: false,
    leapTetherCount: 0,
    leapInfo: [],
  }),
  triggers: [
    {
      id: 'R1S Shockwave Knockback Safe Directions',
      type: 'MapEffect',
      netRegex: { location: ['00', '03'], flags: mapEffectTileState.quickRebuid, capture: true },
      infoText: (_data, matches, output) => {
        if (matches.location === '00')
          return output.nwSE();
        return output.neSW();
      },
      outputStrings: {
        nwSE: {
          en: 'Knockback (NW/SE Safe)',
          ko: '넉백! 🡼🡾',
        },
        neSW: {
          en: 'Knockback (NE/SW Safe)',
          ko: '넉백! 🡿🡽',
        },
      },
    },
    {
      id: 'R1S One-two Paw Right Left',
      type: 'StartsUsing',
      netRegex: { id: '9436', source: 'Black Cat', capture: false },
      durationSeconds: 9.5,
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'R1S One-two Paw Left Right',
      type: 'StartsUsing',
      netRegex: { id: '9439', source: 'Black Cat', capture: false },
      durationSeconds: 9.5,
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'R1S Biscuit Maker',
      type: 'StartsUsing',
      netRegex: { id: '9495', source: 'Black Cat', capture: true },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'R1S Bloody Scratch',
      type: 'StartsUsing',
      netRegex: { id: '9494', source: 'Black Cat', capture: false },
      response: Responses.bigAoe(),
      run: (data) => data.seenLeapJump = false,
    },
    {
      id: 'R1S ActorSetPos Collector',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}', capture: true },
      run: (data, matches) => {
        data.actorSetPosTracker[matches.id] = matches;
      },
    },
    {
      id: 'R1S Mouser',
      type: 'StartsUsing',
      netRegex: { id: '996C', capture: true },
      condition: (data, matches) => {
        const actorSetPosLine = data.actorSetPosTracker[matches.sourceId];
        if (actorSetPosLine === undefined)
          return false;
        const x = parseFloat(actorSetPosLine.x);
        const y = parseFloat(actorSetPosLine.y);
        const loc = Object.values(mapEffectData)
          .find((tile) =>
            tile.location.startsWith('0') && Math.abs(tile.centerX - x) < 1 &&
            Math.abs(tile.centerY - y) < 1
          );
        if (loc === undefined)
          return false;
        const tile = loc.location;
        if (tile !== '09' && tile !== '0A')
          return false;
        data.mouserMatchedTile = tile;
        return true;
      },
      // We don't need a suppressSeconds since only one of the SW/SE tiles will get hit twice
      durationSeconds: 11,
      infoText: (data, _matches, output) => {
        const dangerTile = data.mouserMatchedTile;
        if (dangerTile === undefined)
          return false;
        // Danger tile is SW, so safe movement is SW => SE (Stay)
        if (dangerTile === '09') {
          return output.swSeStay({
            dir1: output['dirSW'](),
            sep: output.separator(),
            dir2: output['dirSE'](),
          });
        }
        const dirs = ['dirSW', 'dirSE', 'dirSW'].map((e) => output[e]());
        return output.combo({ dirs: dirs.join(output.separator()) });
      },
      run: (data) => delete data.mouserMatchedTile,
      outputStrings: {
        ...Directions.outputStrings8Dir,
        swSeStay: {
          en: '${dir1} ${sep} ${dir2} (Stay)',
          ja: '${dir1} ${sep} ${dir2} (そのまま)',
          ko: '${dir1} ${sep} ${dir2} (그대로)',
        },
        separator: {
          en: ' => ',
          ja: ' => ',
          ko: ' 🔜 ',
        },
        combo: {
          en: '${dirs}',
          ja: '${dirs}',
          ko: '${dirs}',
        },
      },
    },
    {
      id: 'R1S Headmarker Nailchipper Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker1, capture: true },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.outSpread(),
      outputStrings: {
        outSpread: {
          en: 'Out + Spread',
          ko: '내게 장판! 흩어져요',
        },
      },
    },
    {
      id: 'R1S Headmarker Grimalkin Gale',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker2, capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'R1S Headmarker Pawprint Collector',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.pawprint, capture: true },
      run: (data, matches) => data.lastPawprintTarget = matches.target,
    },
    {
      id: 'R1S Elevate and Eviscerate Launch Self',
      type: 'StartsUsing',
      netRegex: { id: '9446', source: 'Copy Cat', capture: false },
      condition: (data) => data.me === data.lastPawprintTarget,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Launch Forward (Aim for uncracked tile)',
          ja: '前方吹き飛ばし (割れていない床を狙って)',
          ko: '내게 어퍼컷 넉백!',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Launch Other',
      type: 'StartsUsing',
      netRegex: { id: '9446', source: 'Copy Cat', capture: false },
      condition: (data) => data.me !== data.lastPawprintTarget,
      infoText: (data, _matches, output) => {
        const target = data.party.member(data.lastPawprintTarget);
        return output.text({ target: target.jobAbbr, name: target.nick });
      },
      outputStrings: {
        text: {
          en: '${name} (${target}) Launch',
          ja: '${name} (${target}) に吹き飛ばし',
          ko: '어퍼컷: ${name} (${target})',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Stun Self',
      type: 'StartsUsing',
      netRegex: { id: '9448', source: 'Copy Cat', capture: false },
      condition: (data) => data.me === data.lastPawprintTarget,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stand on uncracked tile',
          ja: '割れてない床に立って',
          ko: '내게 내려 찍기!',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Stun Other',
      type: 'StartsUsing',
      netRegex: { id: '9448', source: 'Copy Cat', capture: false },
      condition: (data) => data.me !== data.lastPawprintTarget,
      infoText: (data, _matches, output) => {
        const target = data.party.member(data.lastPawprintTarget);
        return output.text({ target: target.jobAbbr, name: target.nick });
      },
      outputStrings: {
        text: {
          en: '${name} (${target}) Stun',
          ja: '${name} (${target}) にスタン',
          ko: '내려 찍기: ${name} (${target})',
        },
      },
    },
    {
      id: 'R1S Quadruple Swipe',
      type: 'StartsUsing',
      netRegex: { id: '945D', source: 'Black Cat', capture: false },
      alertText: (_data, _matches, output) => output.partner(),
      outputStrings: {
        partner: {
          en: 'Partner Stacks',
          ja: 'ペア',
          ko: '십자로 둘씩!',
        },
      },
    },
    {
      id: 'R1S Double Swipe',
      type: 'StartsUsing',
      netRegex: { id: '945F', source: 'Black Cat', capture: false },
      alertText: (_data, _matches, output) => output.healerStacks(),
      outputStrings: {
        healerStacks: Outputs.healerGroups,
      },
    },
    {
      id: 'R1S Overshadow',
      type: 'StartsUsing',
      netRegex: { id: '9497', source: 'Black Cat', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R1S Splintering Nails',
      type: 'StartsUsing',
      netRegex: { id: '9499', source: 'Black Cat', capture: false },
      infoText: (_data, _matches, output) => output.rolePositions(),
      outputStrings: {
        rolePositions: {
          en: 'Role positions',
          ja: 'ロールの担当位置へ',
          ko: '같은 롤끼리 뭉쳐요',
        },
      },
    },
    {
      id: 'R1S Leaping One-two Paw',
      type: 'StartsUsing',
      netRegex: { id: ['944D', '944E', '944F', '9450'], source: 'Black Cat', capture: true },
      infoText: (data, matches, output) => {
        if (data.options.AutumnStyle) {
          if (matches.id === '944D' || matches.id === '9450')
            return output.outsideIn();
          else if (matches.id === '944E' || matches.id === '944F')
            return output.insideOut();
          return output.unknown();
        }
        if (matches.id === '944D') {
          return output.combo({ dir: output.dirW(), cleaves: output.outsideIn() });
        } else if (matches.id === '944E') {
          return output.combo({ dir: output.dirW(), cleaves: output.insideOut() });
        } else if (matches.id === '944F') {
          return output.combo({ dir: output.dirE(), cleaves: output.insideOut() });
        } else if (matches.id === '9450') {
          return output.combo({ dir: output.dirE(), cleaves: output.outsideIn() });
        }
        return output.unknown();
      },
      run: (data, matches) => {
        if (matches.id === '944D') {
          data.storedLeaps.oneTwoPaw.leftRight = 'left';
          data.storedLeaps.oneTwoPaw.firstCleaveSide = 'right';
        } else if (matches.id === '944E') {
          data.storedLeaps.oneTwoPaw.leftRight = 'left';
          data.storedLeaps.oneTwoPaw.firstCleaveSide = 'left';
        } else if (matches.id === '944F') {
          data.storedLeaps.oneTwoPaw.leftRight = 'right';
          data.storedLeaps.oneTwoPaw.firstCleaveSide = 'right';
        } else if (matches.id === '9450') {
          data.storedLeaps.oneTwoPaw.leftRight = 'right';
          data.storedLeaps.oneTwoPaw.firstCleaveSide = 'left';
        }
      },
      outputStrings: {
        dirE: Outputs.dirE,
        dirW: Outputs.dirW,
        insideOut: {
          en: 'Inside => Outside',
          ko: '안에서 🔜 밖으로',
        },
        outsideIn: {
          en: 'Outside => Inside',
          ko: '밖에서 🔜 안으로',
        },
        combo: {
          en: '${dir}, ${cleaves}',
          ko: '${dir}쪽 🔜 ${cleaves}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R1S Leaping Quadruple Crossing',
      type: 'StartsUsing',
      netRegex: { id: ['9457', '982F'], source: 'Black Cat', capture: true },
      condition: (data) => data.storedLeaps.oneTwoPaw.leftRight !== undefined,
      infoText: (_data, _matches, output) => {
        return output.proximity();
      },
      run: (data, matches) => {
        if (matches.id === '9457') {
          data.storedLeaps.quadCross.leftRight = 'left';
        } else if (matches.id === '982F') {
          data.storedLeaps.quadCross.leftRight = 'right';
        }
      },
      outputStrings: {
        proximity: {
          en: 'Proximity baits at target',
          ko: '자기 자리로! 부채꼴 유도',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R1S Leaping clone collector',
      type: 'Tether',
      netRegex: { id: '0066', capture: true },
      infoText: (data, matches, output) => {
        const actorSetPosEntry = data.actorSetPosTracker[matches.sourceId];
        if (actorSetPosEntry === undefined) {
          console.error(
            `R1S Leaping clone collector: Missing ActorSetPos line for actor ID ${matches.sourceId}`,
          );
          return;
        }
        const cloneNorthSouth = parseFloat(actorSetPosEntry.y) < 100 ? 'north' : 'south';
        if (data.storedLeaps.oneTwoPaw.firstCleaveSide !== undefined) {
          if (data.storedLeaps.oneTwoPaw.northSouth === undefined) {
            data.storedLeaps.oneTwoPaw.northSouth = cloneNorthSouth;
            return;
          }
        }
        if (data.storedLeaps.quadCross.leftRight !== undefined) {
          if (data.storedLeaps.quadCross.northSouth === undefined) {
            data.storedLeaps.quadCross.northSouth = cloneNorthSouth;
            return;
          }
        }
        if (
          data.storedLeaps.oneTwoPaw.northSouth !== undefined &&
          data.storedLeaps.quadCross.northSouth !== undefined
        ) {
          if (
            data.storedLeaps.oneTwoPaw.resolved !== true &&
            data.storedLeaps.oneTwoPaw.northSouth === cloneNorthSouth
          ) {
            data.storedLeaps.oneTwoPaw.resolved = true;
            let dir;
            if (data.storedLeaps.oneTwoPaw.northSouth === 'north') {
              if (data.storedLeaps.oneTwoPaw.leftRight === 'left')
                dir = 'dirE';
              else
                dir = 'dirW';
            } else {
              if (data.storedLeaps.oneTwoPaw.leftRight === 'left')
                dir = 'dirW';
              else
                dir = 'dirE';
            }
            let inOut = 'in';
            if (data.storedLeaps.oneTwoPaw.leftRight !== data.storedLeaps.oneTwoPaw.firstCleaveSide)
              inOut = 'out';
            if (data.options.AutumnStyle)
              return output.aHealerStacks({ inOut: output[inOut]() });
            return output.healerStacks({ dir: output[dir](), inOut: output[inOut]() });
          }
          if (
            data.storedLeaps.quadCross.resolved !== true &&
            data.storedLeaps.quadCross.northSouth === cloneNorthSouth
          ) {
            data.storedLeaps.quadCross.resolved = true;
            let dir;
            if (data.storedLeaps.oneTwoPaw.northSouth === 'north') {
              if (data.storedLeaps.oneTwoPaw.leftRight === 'left')
                dir = 'dirE';
              else
                dir = 'dirW';
            } else {
              if (data.storedLeaps.oneTwoPaw.leftRight === 'left')
                dir = 'dirW';
              else
                dir = 'dirE';
            }
            if (data.options.AutumnStyle)
              return output.aProximity();
            return output.proximity({ dir: output[dir]() });
          }
        }
      },
      outputStrings: {
        dirE: Outputs.dirE,
        dirW: Outputs.dirW,
        in: {
          en: 'In + Healer Stacks => Out',
          ko: '안에서 4:4힐러 🔜 밖으로',
        },
        out: {
          en: 'Out + Healer Stacks => In',
          ko: '밖에서 4:4힐러🔜 안으로',
        },
        healerStacks: {
          en: 'Go ${dir} => ${inOut}',
          ko: '${dir}쪽 🔜 ${inOut}',
        },
        proximity: {
          en: 'Go ${dir} => Proximity Baits + Spreads',
          ko: '${dir}쪽 🔜 부채꼴 유도!',
        },
        aHealerStacks: {
          en: '${inOut}',
          ko: '${inOut}',
        },
        aProximity: {
          en: 'Proximity Baits/Spreads',
          ko: '자기 자리로! 부채꼴 유도',
        },
      },
    },
    // ================== PRS ==================
    {
      id: 'R1S PRS Quadruple Crossing',
      type: 'StartsUsing',
      netRegex: { id: '943C', source: 'Black Cat', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Proximity baits at target',
          ko: '자기 자리로! 부채꼴 유도',
        },
      },
    },
    {
      id: 'R1S PRS Quadruple Swipe Soulshade',
      type: 'StartsUsing',
      netRegex: { id: '9480', source: 'Soulshade', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Pair',
          ko: '십자로 둘씩!',
        },
      },
    },
    {
      id: 'R1S PRS Double Swipe Soulshade',
      type: 'StartsUsing',
      netRegex: { id: '9482', source: 'Soulshade', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    },
    {
      id: 'R1S PRS Grimalkin Gale',
      type: 'StartsUsing',
      netRegex: { id: '9B84', source: 'Black Cat', capture: false },
      suppressSeconds: 5,
      run: (data) => {
        data.seenLeapJump = true;
        data.leapTetherCount = 0;
        data.leapInfo = [];
      },
    },
    {
      id: 'R1S PRS Leftward Memory',
      type: 'GainsEffect',
      netRegex: { effectId: 'FD3', target: 'Black Cat', capture: false },
      condition: (data) => data.seenLeapJump,
      run: (data) => data.lastLeapDir = 'left',
    },
    {
      id: 'R1S PRS Rightward Memory',
      type: 'GainsEffect',
      netRegex: { effectId: 'FD2', target: 'Black Cat', capture: false },
      condition: (data) => data.seenLeapJump,
      run: (data) => data.lastLeapDir = 'right',
    },
    {
      id: 'R1S PRS Tether for wards',
      type: 'Tether',
      netRegex: { id: '0066', source: 'Soulshade', capture: true },
      condition: (data) => data.seenLeapJump,
      durationSeconds: 8,
      alertText: (data, matches, output) => {
        data.leapTetherCount++;
        if (data.leapTetherCount <= 2 && data.lastLeapDir !== undefined) {
          data.leapInfo.push({ id: matches.sourceId, dir: data.lastLeapDir });
          // found: '찾음: ${id}, ${dir}',
          // return output.found!({ id: matches.sourceId, dir: data.lastLeapDir });
          return;
        }
        const leap = data.leapInfo.find((e) => e.id === matches.sourceId);
        if (leap === undefined)
          return output.unknown();
        const other = data.leapInfo.find((e) => e.id !== matches.sourceId);
        if (other !== undefined) {
          data.leapInfo = data.leapInfo.filter((e) => e.id !== matches.sourceId);
          const dir1 = leap.dir === 'left' ? output.left() : output.right();
          const dir2 = other.dir === 'left' ? output.left() : output.right();
          return output.baitBait({ dir1: dir1, dir2: dir2 });
        }
        const dir = leap.dir === 'left' ? output.left() : output.right();
        return output.bait({ dir: dir });
      },
      outputStrings: {
        bait: {
          en: 'Bait: ${dir}',
          ko: '유도: ${dir}으로',
        },
        baitBait: {
          en: 'Bait: ${dir1} => ${dir2}',
          ko: '유도: ${dir1} 🔜 ${dir2}',
        },
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    /*
        {
          id: 'R1S PRS headmarker test',
          type: 'HeadMarker',
          netRegex: {},
          condition: (data, matches) => data.me === matches.target,
          infoText: (data, matches, output) => {
            const id = getHeadmarkerId(data, matches);
            const dest = matches.target;
            return output.text!({ marker: id, dest: dest });
          },
          outputStrings: {
            text: {
              en: '[marker: ${marker} -> ${dest}]',
            },
          },
        },
        */
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Black Cat': 'Schwarze Katze',
        'Copy Cat': 'felin(?:e|er|es|en) Nachahmung',
        'Soulshade': 'Seelenschatten',
      },
      'replaceText': {
        '\\(First\\)': '(Erster)',
        '\\(Second\\)': '(Zweiter)',
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(hit\\)': '(Treffer)',
        '\\(hits\\)': '(Treffer)',
        '\\(jump\\)': '(Sprung)',
        '\\(knockback\\)': '(Rückstoß)',
        '\\(stacks\\)': '(Sammeln)',
        '\\(telegraphs\\)': '(Anzeige)',
        '\\(tethers\\)': '(Verbindungen)',
        'Biscuit Maker': 'Milchtritt',
        'Bloody Scratch': 'Blutiger Rundumkratzer',
        'Copycat': 'Feline Nachahmung',
        'Double Swipe': 'Doppelte Kralle',
        'Elevate and Eviscerate': 'Präziser Höhenflug',
        'Grimalkin Gale': 'Katerstrophaler Wind',
        'Impact': 'Impakt',
        'Leaping One-two Paw': 'Doppelklauensprung',
        'Leaping Quadruple Crossing': 'Vierfachklauensprung',
        'Mouser': 'Mäusejagd',
        'Nailchipper': 'Krallenschneider',
        'Nine Lives': 'Sieben Leben',
        '(?<! )One-two Paw': 'Doppelklaue',
        'Overshadow': 'Überschattung',
        'Predaceous Pounce': 'Feliner Beutezug',
        '(?<! )Quadruple Crossing': 'Vierfachklaue',
        'Quadruple Swipe': 'Vierfache Kralle',
        'Raining Cats': 'Katzenterror',
        'Shockwave': 'Schockwelle',
        'Soulshade': 'Seelenschatten',
        'Splintering Nails': 'Spreizklaue',
        'Tempestuous Tear': 'Stürmischer Schlitzer',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Black Cat': 'Black Cat',
        'Copy Cat': 'double félin',
        'Soulshade': 'ombre d\'âme',
      },
      'replaceText': {
        'Biscuit Maker': 'Coup de tatane',
        'Bloody Scratch': 'Griffure sanglante',
        'Copycat': 'Double félin',
        'Double Swipe': 'Double fauchage',
        'Elevate and Eviscerate': 'Élévation éviscérante',
        'Grimalkin Gale': 'Rafale féline',
        'Impact': 'Impact',
        'Leaping One-two Paw': 'Griffade un-deux bondissante',
        'Leaping Quadruple Crossing': 'Quadruple griffade bondissante',
        'Mouser': 'Carnage dératiseur',
        'Nailchipper': 'Charcutage félin',
        'Nine Lives': 'Neuf-Vies',
        '(?<! )One-two Paw': 'Griffade un-deux',
        'Overshadow': 'Ombragement',
        'Predaceous Pounce': 'Prédation preste',
        '(?<! )Quadruple Crossing': 'Quadruple griffade',
        'Quadruple Swipe': 'Quadruple fauchage',
        'Raining Cats': 'Chataclysme',
        'Shockwave': 'Onde de choc',
        'Soulshade': 'ombre d\'âme',
        'Splintering Nails': 'Griffade brisante',
        'Tempestuous Tear': 'Déchiquetage diluvien',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Black Cat': 'ブラックキャット',
        'Copy Cat': 'コピーキャット',
        'Soulshade': 'ソウルシェード',
      },
      'replaceText': {
        'Biscuit Maker': 'ビスケットメーカー',
        'Bloody Scratch': 'ブラッディースクラッチ',
        'Copycat': 'コピーキャット',
        'Double Swipe': 'ダブルクロウ',
        'Elevate and Eviscerate': 'エレベート・エビセレート',
        'Grimalkin Gale': 'キャッタクリスム・ゲイル',
        'Impact': '衝撃',
        'Leaping One-two Paw': 'リーピング・デュアルネイル',
        'Leaping Quadruple Crossing': 'リーピング・クアドラプルネイル',
        'Mouser': 'マウサーラッシュ',
        'Nailchipper': 'ネイルチッパー',
        'Nine Lives': 'ナインライヴス',
        '(?<! )One-two Paw': 'デュアルネイル',
        'Overshadow': 'オーバーシャドウ',
        'Predaceous Pounce': 'キャッツレイド',
        '(?<! )Quadruple Crossing': 'クアドラプルネイル',
        'Quadruple Swipe': 'クァッドクロウ',
        'Raining Cats': 'レイニングキャッツ',
        'Shockwave': '衝撃波',
        'Soulshade': 'ソウルシェード',
        'Splintering Nails': 'スプレッドネイル',
        'Tempestuous Tear': 'テンペストテアー',
      },
    },
  ],
});
