// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
// The first 1B marker in the encounter is the #1 Bright Fire marker (004F).
const firstHeadmarker = parseInt('004F', 16);
const getHeadmarkerId = (data, matches) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 00DA.
  // (This makes the offset 0, and !0 is true.)
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};
Options.Triggers.push({
  id: 'AsphodelosTheThirdCircleSavage',
  zoneId: ZoneId.AsphodelosTheThirdCircleSavage,
  timelineFile: 'p3s.txt',
  initData: () => {
    return {
      sunbirds: [],
      sunbirdTethers: [],
    };
  },
  triggers: [
    {
      id: 'P3S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => getHeadmarkerId(data, matches),
    },
    {
      id: 'P3S Scorched Exaltation',
      type: 'StartsUsing',
      netRegex: { id: '6706', source: 'Phoinix', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P3S Darkened Fire',
      type: 'StartsUsing',
      netRegex: { id: '66B9', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Fire Positions',
          de: 'Feuer-Positionen',
          fr: 'Positions pour les flammes',
          ja: '黒い炎の位置に散開',
          cn: '暗炎站位',
          ko: '불꽃 산개',
        },
      },
    },
    {
      id: 'P3S Heat of Condemnation',
      type: 'StartsUsing',
      netRegex: { id: '6700', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Tank Tethers',
          de: 'Tank-Verbindungen',
          fr: 'Liens Tank',
          ja: 'タンク線取り',
          cn: '坦克截线',
          ko: '탱커가 선 가로채기',
        },
      },
    },
    {
      id: 'P3S Experimental Fireplume Rotating Cast',
      type: 'StartsUsing',
      netRegex: { id: '66C0', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Middle (then rotate)',
          de: 'Geh in die Mitte (und rotiere dann)',
          fr: 'Placez-vous au milieu (puis tournez)',
          ja: '中央 → 小玉・ぐるぐる',
          cn: '中间集合, 九连环',
          ko: '가운데 → 작은 구슬, 바깥 회전 장판',
        },
      },
    },
    {
      id: 'P3S Experimental Fireplume Out Cast',
      type: 'StartsUsing',
      netRegex: { id: '66BE', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Middle (then out)',
          de: 'Geh in die Mitte (und dann raus)',
          fr: 'Placez-vous au milieu (puis sortez)',
          ja: '中央 → 大玉・離れる',
          cn: '中间集合, 然后远离',
          ko: '가운데 → 큰 구슬, 밖으로',
        },
      },
    },
    {
      id: 'P3S Experimental Fireplume Out Marker',
      type: 'Ability',
      netRegex: { id: '66BE', source: 'Phoinix', capture: false },
      // goldfish brain needs an extra "get out" call
      response: Responses.getOut(),
    },
    {
      id: 'P3S Right Cinderwing',
      type: 'StartsUsing',
      netRegex: { id: '6702', source: 'Phoinix', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'P3S Left Cinderwing',
      type: 'StartsUsing',
      netRegex: { id: '6703', source: 'Phoinix', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'P3S Flare of Condemnation',
      type: 'StartsUsing',
      netRegex: { id: '66FB', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Sides + Spread',
          de: 'Seiten + Verteilen',
          fr: 'Côtés + Dispersez-vous',
          ja: '横側安置：散開',
          cn: '两侧 + 分散',
          ko: '바깥쪽에서 산개',
        },
      },
    },
    {
      id: 'P3S Spark of Condemnation',
      type: 'StartsUsing',
      netRegex: { id: '66FC', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Middle Pairs',
          de: 'Mittlere Paare',
          fr: 'Paires au milieu',
          ja: '中央直線安置：二人組で頭割り',
          cn: '中间 两人分摊',
          ko: '가운데서 2명씩 산개',
        },
      },
    },
    {
      id: 'P3S Bright Fire Marker and Fledgling Flights',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        return {
          '004F': output.num1(),
          '0050': output.num2(),
          '0051': output.num3(),
          '0052': output.num4(),
          '0053': output.num5(),
          '0054': output.num6(),
          '0055': output.num7(),
          '0056': output.num8(),
          '006B': data.deathsToll ? output.west() : output.east(),
          '006C': data.deathsToll ? output.east() : output.west(),
          '006D': data.deathsToll ? output.north() : output.south(),
          '006E': data.deathsToll ? output.south() : output.north(),
        }[id];
      },
      outputStrings: {
        num1: Outputs.num1,
        num2: Outputs.num2,
        num3: Outputs.num3,
        num4: Outputs.num4,
        num5: Outputs.num5,
        num6: Outputs.num6,
        num7: Outputs.num7,
        num8: Outputs.num8,
        east: Outputs.east,
        west: Outputs.west,
        south: Outputs.south,
        north: Outputs.north,
      },
    },
    {
      id: 'P3S Sunbird Tether Collector',
      type: 'Tether',
      // 0039 when pink, 0001 when stretched purple.
      // TODO: in general, it seems like the tethers are picked to start unstretched,
      // but plausibly you could create a scenario where one starts stretched?
      netRegex: { source: 'Sunbird', id: ['0039', '0001'] },
      run: (data, matches) => data.sunbirdTethers.push(matches),
    },
    {
      id: 'P3S Sunbird Collector',
      type: 'AddedCombatant',
      // Small birds are 13633, and big birds are 13635.
      netRegex: { npcBaseId: '13635' },
      run: (data, matches) => data.sunbirds.push(matches),
    },
    {
      id: 'P3S Sunbird Tether',
      type: 'Tether',
      // There is no need for a delay here, because all of the tethers are ordered:
      //   SunbirdA => Player1
      //   Player1 => Player2
      //   SunbirdB => Player3
      //   Player3 => Player4
      // ...therefore if this tether has the current player as a target, then we
      // will have seen the Sunbird => Player tether previously if it exists in the
      // Sunbird Tether Collector line.
      netRegex: { id: ['0039', '0001'] },
      condition: Conditions.targetIsYou(),
      // There are additional tether lines when you stretch/unstretch the tether, and
      // adds will re-tether somebody new if somebody dies right before dashing.  Only call once.
      suppressSeconds: 9999,
      alertText: (data, matches, output) => {
        const myTether = matches;
        const parentTether = data.sunbirdTethers.find((x) => x.targetId === myTether.sourceId);
        const birdId = parentTether?.sourceId ?? myTether.sourceId;
        const bird = data.sunbirds.find((x) => x.id === birdId);
        if (!bird) {
          // Note: 0001 tethers happen later with the Sunshadow birds during the Fountain of Fire
          // section.  In most cases, a player will get a tether during add phase and then this
          // will be suppressed in the fountain section.  In the rare case they don't, they
          // may get this error, but nothing will be printed on screen.
          console.error(`SunbirdTether: no bird ${birdId}`);
          return;
        }
        const centerX = 100;
        const centerY = 100;
        const x = parseFloat(bird.x) - centerX;
        const y = parseFloat(bird.y) - centerY;
        const birdDir = Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
        const adjustedDir = (birdDir + (parentTether === undefined ? 4 : 0)) % 8;
        const outputDir = {
          0: output.north(),
          1: output.northeast(),
          2: output.east(),
          3: output.southeast(),
          4: output.south(),
          5: output.southwest(),
          6: output.west(),
          7: output.northwest(),
        }[adjustedDir];
        if (outputDir === undefined)
          throw new UnreachableCode();
        if (parentTether) {
          return output.playerTether({
            dir: outputDir,
            player: data.party.member(myTether.source),
          });
        }
        return output.birdTether({ dir: outputDir });
      },
      outputStrings: {
        playerTether: {
          en: '${dir} (away from ${player})',
          de: '${dir} (weg von ${player})',
          fr: '${dir} (éloignez-vous de ${player})',
          ja: '${dir} (${player}と繋がる)',
          cn: '${dir} (远离${player})',
          ko: '${dir} (${player}에게서 멀리 떨어지기)',
        },
        birdTether: {
          en: '${dir} (away from bird)',
          de: '${dir} (weg vom Vogel)',
          fr: '${dir} (éloignez-vous de l\'oiseau)',
          ja: '${dir} (鳥と繋がる)',
          cn: '${dir} (远离鸟)',
          ko: '${dir} (새와 멀리 떨어지기)',
        },
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
      },
    },
    {
      id: 'P3S Dead Rebirth',
      type: 'StartsUsing',
      netRegex: { id: '66E4', source: 'Phoinix', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'P3S Experimental Gloryplume Rotate Cast',
      type: 'StartsUsing',
      // 66CA (self) -> 66CB (rotating) -> etc
      netRegex: { id: '66CA', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Middle (then rotate)',
          de: 'Geh in die Mitte (und rotiere dann)',
          fr: 'Placez-vous au milieu (puis tournez)',
          ja: '中央 → 小玉・ぐるぐる',
          cn: '中间集合, 九连环',
          ko: '가운데 → 작은 구슬, 바깥 회전 장판',
        },
      },
    },
    {
      id: 'P3S Experimental Gloryplume Out Cast',
      type: 'StartsUsing',
      // 66C6 (self) -> 66C7 (middle) -> etc
      netRegex: { id: '66C6', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Middle (then out)',
          de: 'Geh in die Mitte (und dann raus)',
          fr: 'Placez-vous au milieu (puis sortez)',
          ja: '中央 → 大玉・離れる',
          cn: '中间集合, 然后远离',
          ko: '가운데 → 큰 구슬, 밖으로',
        },
      },
    },
    {
      id: 'P3S Experimental Gloryplume Out',
      type: 'Ability',
      // 66C6 (self) -> 66C7 (middle) -> etc
      netRegex: { id: '66C6', source: 'Phoinix', capture: false },
      // If you hang around to wait for the spread/stack, you will get killed.
      // It's easy to get complacement by the end of the fight, so make this loud.
      response: Responses.getOut('alarm'),
    },
    {
      id: 'P3S Experimental Gloryplume Stack',
      type: 'Ability',
      // 66CA (self) -> 66CB (rotating) -> 66CC (instant) -> 66CD (stacks)
      // 66C6 (self) -> 66C7 (middle) -> 66CC (instant) -> 66CD (stacks)
      netRegex: { id: '66CC', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stacks After',
          de: 'Danach sammeln',
          fr: 'Packez-vous après',
          ja: 'あとは頭割り',
          cn: '然后分摊',
          ko: '그 다음 쉐어',
        },
      },
    },
    {
      id: 'P3S Experimental Gloryplume Spread',
      type: 'Ability',
      // 66CA (self) -> 66CB (rotating) -> 66C8 (instant) -> 66C9 (spread)
      // 66C6 (self) -> 66C7 (middle) -> 66C8 (instant) -> 66C9 (spread)
      netRegex: { id: '66C8', source: 'Phoinix', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread After',
          de: 'Danach verteilen',
          fr: 'Dispersez-vous après',
          ja: 'あとは散開',
          cn: '然后分散',
          ko: '그 다음 산개',
        },
      },
    },
    {
      id: 'P3S Sun\'s Pinion',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) =>
        data.me === matches.target && getHeadmarkerId(data, matches) === '007A',
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread => Bird Tether',
          de: 'Verteilen => Vogel-Verbindungen',
          fr: 'Dispersez-vous => Liens oiseaux',
          ja: '散開 => 鳥の線',
          cn: '散开 => 鸟连线',
          ko: '산개 🔜 새 줄 연결',
        },
      },
    },
    {
      id: 'P3S Firestorms of Asphodelos',
      type: 'StartsUsing',
      netRegex: { id: '66F0', source: 'Phoinix', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'P3S Experimental Ashplume Stacks',
      type: 'Ability',
      // 66C2 cast -> 66C3 stacks damage
      netRegex: { id: '66C2', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stacks',
          de: 'Sammeln',
          fr: 'Packez-vous',
          ja: '頭割り',
          cn: '分摊',
          ko: '쉐어',
        },
      },
    },
    {
      id: 'P3S Experimental Ashplume Spread',
      type: 'Ability',
      // 66C4 cast -> 66C5 spread damage
      netRegex: { id: '66C4', source: 'Phoinix', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Spread',
          de: 'Verteilen',
          fr: 'Dispersez-vous',
          ja: '散開',
          cn: '分散',
          ko: '산개',
        },
      },
    },
    {
      id: 'P3S Death\'s Toll Number',
      type: 'GainsEffect',
      netRegex: { effectId: ['ACA'], capture: true },
      // Force this to only run once without Conditions.targetIsYou()
      // in case user is dead but needs to place fledgling flight properly
      preRun: (data) => data.deathsToll = true,
      // Delay callout until Ashen Eye start's casting
      delaySeconds: 15.5,
      infoText: (data, matches, output) => {
        if (matches.target === data.me && !data.deathsTollPending) {
          data.deathsTollPending = true;
          return {
            '01': output.outCardinals(),
            '02': output.outIntercards(),
            '04': output.middle(),
          }[matches.count];
        }
      },
      outputStrings: {
        middle: Outputs.middle,
        outIntercards: {
          en: 'Intercards + Out',
          de: 'Interkardinal + Raus',
          fr: 'Intercadinal + Extérieur',
          ja: '斜め + 外側',
          cn: '斜角 + 外侧',
          ko: '대각선 + 바깥',
        },
        outCardinals: {
          en: 'Out + Cardinals',
          de: 'Raus + Kardinal',
          fr: 'Extérieur + Cardinal',
          ja: '外側 + 十字',
          cn: '外侧 + 十字',
          ko: '바깥 + 십자',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Left Cinderwing/Right Cinderwing': 'Left/Right Cinderwing',
        'Flare of Condemnation/Sparks of Condemnation': 'Flare/Sparks of Condemnation',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Darkblaze Twister': 'Schwarzlohensturm',
        'Fountain of Fire': 'Quell des Feuers',
        'Phoinix': 'Phoinix',
        'Sparkfledged': 'Saat des Phoinix',
        'Sunbird': 'Spross des Phoinix',
      },
      'replaceText': {
        '--fire expands--': '--Feuer breitet sich aus--',
        '--giant fireplume\\?--': '--riesige Feuerfieder?--',
        'Ashen Eye': 'Aschener Blick',
        '(?<!\\w )Ashplume': 'Aschenfieder',
        'Beacons of Asphodelos': 'Asphodeische Flamme',
        'Blazing Rain': 'Flammender Regen',
        'Brightened Fire': 'Lichte Lohe',
        'Burning Twister': 'Lohenwinde',
        'Dark Twister': 'Schwarze Winde',
        'Darkblaze Twister': 'Schwarzlohensturm',
        'Darkened Fire': 'Schwarze Lohe',
        'Dead Rebirth': 'Melaphoinix',
        'Death\'s Toll': 'Eid des Abschieds',
        'Devouring Brand': 'Kreuzbrand',
        'Experimental Ashplume': 'Experimentelle Aschenfieder',
        'Experimental Fireplume': 'Experimentelle Feuerfieder',
        'Experimental Gloryplume': 'Experimentelle Prachtfieder',
        'Final Exaltation': 'Ewige Asche',
        'Fireglide Sweep': 'Gleitjagd',
        'Firestorms of Asphodelos': 'Asphodeischer Feuersturm',
        'Flames of Asphodelos': 'Asphodeisches Feuer',
        'Flames of Undeath': 'Totenflamme',
        'Flare of Condemnation': 'Limbische Flamme',
        'Fledgling Flight': 'Flüggewerden',
        'Fountain of Death': 'Quell des Todes',
        'Fountain of Fire': 'Quell des Feuers',
        '(?<!\\w )Gloryplume': 'Prachtfieder',
        'Great Whirlwind': 'Windhose',
        'Heat of Condemnation': 'Limbisches Lodern',
        'Joint Pyre': 'Gemeinschaft des Feuers',
        'Left Cinderwing': 'Linke Aschenschwinge',
        'Life\'s Agonies': 'Lohen des Lebens',
        'Right Cinderwing': 'Rechte Aschenschwinge',
        'Scorched Exaltation': 'Aschenlohe',
        'Searing Breeze': 'Sengender Hauch',
        'Sparks of Condemnation': 'Limbische Glut',
        '(?<!fire)Storms of Asphodelos': 'Asphodeischer Sturm',
        'Sun\'s Pinion': 'Schwelende Schwinge',
        'Trail of Condemnation': 'Limbischer Odem',
        'Winds of Asphodelos': 'Asphodeische Winde',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Darkblaze Twister': 'Tourbillon enflammé des Limbes',
        'Fountain of Fire': 'Flamme de la vie',
        'Phoinix': 'protophénix',
        'Sparkfledged': 'oiselet de feu',
        'Sunbird': 'oiselet étincelant',
      },
      'replaceText': {
        '\\?': ' ?',
        '--fire expands--': '--élargissement du feu--',
        '--giant fireplume': '--immolation de feu géant',
        'Ashen Eye': 'Œil sombre',
        '(?<!\\w )Ashplume': 'Immolation de feu ténébreux',
        'Beacons of Asphodelos': 'Feu des Limbes',
        'Blazing Rain': 'Pluie brûlante',
        'Brightened Fire': 'Flamme de lumière',
        'Burning Twister': 'Tourbillon enflammé',
        'Dark Twister': 'Tourbillon sombre',
        'Darkblaze Twister': 'Tourbillon enflammé des Limbes',
        'Darkened Fire': 'Flamme sombre',
        'Dead Rebirth': 'Phénix noir',
        'Death\'s Toll': 'Destin mortel',
        'Devouring Brand': 'Croix enflammée',
        'Experimental Ashplume': 'Synthèse de mana : immolation de feu ténébreux',
        'Experimental Fireplume': 'Synthèse de mana : immolation de feu',
        'Experimental Gloryplume': 'Synthèse de mana : feu des profondeurs',
        'Final Exaltation': 'Conflagration calcinante',
        'Fireglide Sweep': 'Plongeons en chaîne',
        'Firestorms of Asphodelos': 'Volcan des Limbes',
        'Flames of Asphodelos': 'Flamme des Limbes',
        'Flames of Undeath': 'Feu réincarné',
        'Flare of Condemnation/Sparks of Condemnation': 'Souffle/Artifice infernal',
        'Fledgling Flight': 'Nuée ailée',
        'Fountain of Death': 'Onde de la vie',
        'Fountain of Fire': 'Flamme de la vie',
        '(?<!\\w )Gloryplume': 'Feu des profondeurs',
        'Great Whirlwind': 'Grand tourbillon',
        'Heat of Condemnation': 'Bourrasque infernale',
        'Joint Pyre': 'Combustion résonnante',
        'Left Cinderwing/Right Cinderwing': 'Incinération senestre/dextre',
        'Life\'s Agonies': 'Flamme de souffrance',
        'Scorched Exaltation': 'Flamme calcinante',
        'Searing Breeze': 'Jet incandescent',
        '(?<!fire)Storms of Asphodelos': 'Tempête des Limbes',
        'Sun\'s Pinion': 'Ailes étincelantes',
        'Trail of Condemnation': 'Embrasement infernal',
        'Winds of Asphodelos': 'Tempête des Limbes',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Darkblaze Twister': '辺獄の闇炎旋風',
        'Fountain of Fire': '霊泉の炎',
        'Phoinix': 'フェネクス',
        'Sparkfledged': '火霊鳥',
        'Sunbird': '陽炎鳥',
      },
      'replaceText': {
        'Ashen Eye': '闇の瞳',
        '(?<!\\w )Ashplume': '暗闇の劫火天焦',
        'Beacons of Asphodelos': '辺獄の火',
        'Blazing Rain': '炎の雨',
        'Brightened Fire': '光の炎',
        'Burning Twister': '炎旋風',
        'Dark Twister': '闇旋風',
        'Darkblaze Twister': '辺獄の闇炎旋風',
        'Darkened Fire': '闇の炎',
        'Dead Rebirth': '黒き不死鳥',
        'Death\'s Toll': '死の運命',
        'Devouring Brand': '十字走火',
        'Experimental Ashplume': '魔力錬成：暗闇の劫火天焦',
        'Experimental Fireplume': '魔力錬成：劫火天焦',
        'Experimental Gloryplume': '魔力錬成：炎闇劫火',
        'Final Exaltation': '灰燼の豪炎',
        'Fireglide Sweep': '連続強襲滑空',
        'Firestorms of Asphodelos': '辺獄の炎嵐',
        'Flames of Asphodelos': '辺獄の炎',
        'Flames of Undeath': '反魂の炎',
        'Flare of Condemnation': '獄炎の火撃',
        'Fledgling Flight': '群鳥飛翔',
        'Fountain of Death': '霊泉の波動',
        'Fountain of Fire': '霊泉の炎',
        '(?<!\\w )Gloryplume': '炎闇劫火',
        'Great Whirlwind': '大旋風',
        'Heat of Condemnation': '獄炎の炎撃',
        'Joint Pyre': '共燃',
        'Left Cinderwing': '左翼焼却',
        'Life\'s Agonies': '生苦の炎',
        'Right Cinderwing': '右翼焼却',
        'Scorched Exaltation': '灰燼の炎',
        'Searing Breeze': '熱噴射',
        'Sparks of Condemnation': '獄炎の火花',
        '(?<!fire)Storms of Asphodelos': '辺獄の嵐',
        'Sun\'s Pinion': '陽炎の翼',
        'Trail of Condemnation': '獄炎の焔',
        'Winds of Asphodelos': '辺獄の風',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Darkblaze Twister': '边境暗炎旋风',
        'Fountain of Fire': '灵泉之炎',
        'Phoinix': '菲尼克司',
        'Sparkfledged': '火灵鸟',
        'Sunbird': '阳炎鸟',
      },
      'replaceText': {
        '--fire expands--': '--火焰扩大--',
        '--giant fireplume\\?--': '--巨大火柱?--',
        'Ashen Eye': '暗之瞳',
        '(?<!\\w )Ashplume': '暗黑劫火焚天',
        'Beacons of Asphodelos': '边境之火',
        'Blazing Rain': '炎之雨',
        'Brightened Fire': '光之炎',
        'Burning Twister': '炎旋风',
        'Dark Twister': '暗旋风',
        'Darkblaze Twister': '边境暗炎旋风',
        'Darkened Fire': '暗之炎',
        'Dead Rebirth': '黑暗不死鸟',
        'Death\'s Toll': '死亡的命运',
        'Devouring Brand': '十字地火',
        'Experimental Ashplume': '魔力炼成：暗黑劫火焚天',
        'Experimental Fireplume': '魔力炼成：劫火焚天',
        'Experimental Gloryplume': '魔力炼成：炎暗劫火',
        'Final Exaltation': '灰烬豪焰',
        'Fireglide Sweep': '连续滑空强袭',
        'Firestorms of Asphodelos': '边境火焰风暴',
        'Flames of Asphodelos': '边境火焰',
        'Flames of Undeath': '返魂之炎',
        'Flare of Condemnation': '狱炎火击',
        'Fledgling Flight': '群鸟飞翔',
        'Fountain of Death': '灵泉之波动',
        'Fountain of Fire': '灵泉之炎',
        '(?<!\\w )Gloryplume': '炎暗劫火',
        'Great Whirlwind': '大旋风',
        'Heat of Condemnation': '狱炎炎击',
        'Joint Pyre': '共燃',
        'Left Cinderwing': '左翼焚烧',
        'Life\'s Agonies': '生苦之炎',
        'Right Cinderwing': '右翼焚烧',
        'Scorched Exaltation': '灰烬火焰',
        'Searing Breeze': '热喷射',
        'Sparks of Condemnation': '狱炎火花',
        '(?<!fire)Storms of Asphodelos': '边境风暴',
        'Sun\'s Pinion': '阳炎之翼',
        'Trail of Condemnation': '狱炎之焰',
        'Winds of Asphodelos': '边境之风',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Darkblaze Twister': '어둠불꽃 회오리',
        'Fountain of Fire': '영검의 불꽃',
        'Phoinix': '페넥스',
        'Sparkfledged': '화령조',
        'Sunbird': '양염조',
      },
      'replaceText': {
        '--fire expands--': '--불장판 커짐--',
        '--giant fireplume\\?--': '--특대 장판?--',
        'Ashen Eye': '어둠의 눈동자',
        '(?<!\\w )Ashplume': '암흑의 겁화천초',
        'Beacons of Asphodelos': '변옥의 불',
        'Blazing Rain': '불비',
        'Brightened Fire': '빛의 불꽃',
        'Burning Twister': '불꽃 회오리',
        'Dark Twister': '어둠 회오리',
        'Darkblaze Twister': '변옥의 어둠불꽃 회오리',
        'Darkened Fire': '어둠의 불꽃',
        'Dead Rebirth': '검은 불사조',
        'Death\'s Toll': '죽음의 운명',
        'Devouring Brand': '십자 불길',
        'Experimental Ashplume': '마력 연성: 암흑의 겁화천초',
        'Experimental Fireplume': '마력 연성: 겁화천초',
        'Experimental Gloryplume': '마력 연성: 염암겁화',
        'Final Exaltation': '잿더미 대화염',
        'Fireglide Sweep': '연속 강습 활공',
        'Firestorms of Asphodelos': '변옥의 화염 폭풍',
        'Flames of Asphodelos': '변옥의 화염',
        'Flames of Undeath': '반혼의 불꽃',
        'Flare of Condemnation/Sparks of Condemnation': '지옥불 화격/불똥',
        'Fledgling Flight': '새떼 비상',
        'Fountain of Death': '영검의 파동',
        'Fountain of Fire': '영검의 불꽃',
        '(?<!\\w )Gloryplume': '염암겁화',
        'Great Whirlwind': '대선풍',
        'Heat of Condemnation': '지옥불 염격',
        'Joint Pyre': '동반 연소',
        'Left Cinderwing/Right Cinderwing': '왼/오른날개 소각',
        'Life\'s Agonies': '생고의 불꽃',
        'Scorched Exaltation': '잿더미 화염',
        'Searing Breeze': '열 분사',
        '(?<!fire)Storms of Asphodelos': '변옥의 폭풍',
        'Sun\'s Pinion': '양염의 날개',
        'Trail of Condemnation': '지옥불 불길',
        'Winds of Asphodelos': '변옥의 바람',
      },
    },
  ],
});
