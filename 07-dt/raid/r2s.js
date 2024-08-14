const headMarkerData = {
  // Vfx Path: lockon6_t0t
  spreadMarker1: '00EA',
  // Vfx Path: m0676trg_tw_d0t1p
  sharedBuster: '0103',
  // Vfx Path: tank_laser_5sec_lockon_c0a1
  tankLaser: '01D7',
  // Vfx Path: m0906_tgae_s701k2
  spreadMarker2: '0203',
  // Vfx Path: m0906_share4_7s0k2
  heartStackMarker: '0205',
};
Options.Triggers.push({
  id: 'AacLightHeavyweightM2Savage',
  zoneId: ZoneId.AacLightHeavyweightM2Savage,
  timelineFile: 'r2s.txt',
  initData: () => ({
    partnersSpreadCounter: 0,
    myHearts: 0,
    heartShed: [],
  }),
  triggers: [
    {
      id: 'R2S Beat Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['9C24', '9C25', '9C26'], capture: true },
      run: (data, matches) => {
        if (matches.id === '9C24')
          data.beat = 1;
        else if (matches.id === '9C25')
          data.beat = 2;
        else
          data.beat = 3;
        data.heartShed = [];
      },
    },
    {
      id: 'R2S Headmarker Shared Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.sharedBuster, capture: true },
      suppressSeconds: 5,
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R2S Headmarker Cone Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.tankLaser, capture: true },
      suppressSeconds: 5,
      response: Responses.tankCleave(),
    },
    {
      id: 'R2S Headmarker Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker2, capture: true },
      condition: (data, matches) => {
        if (data.myHearts !== 1)
          return false;
        data.heartShed.push(matches.target);
        return data.heartShed.length === 2;
      },
      infoText: (data, _matches, output) => {
        const dps = data.party.isDPS(data.me);
        if (data.heartShed.includes(data.me))
          return dps ? output.bairDps() : output.baitTh();
        return dps ? output.towerDps() : output.towerTh();
      },
      run: (data) => data.heartShed = [],
      outputStrings: {
        baitTh: {
          en: 'Drop AOE',
          ko: '서쪽 바깥에 장판 버려요!',
        },
        bairDps: {
          en: 'Drop AOE',
          ko: '동쪽 바깥에 장판 버려요!',
        },
        towerTh: {
          en: 'Soak Tower',
          ko: '북/서 타워 밟아요',
        },
        towerDps: {
          en: 'Soak Tower',
          ko: '남/동 타워 밟아요',
        },
      },
    },
    {
      id: 'R2S Headmarker Alarm Pheromones Puddle',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker1, capture: true },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Drop Puddle Outside',
          ko: '바깥에 장판 버려요!',
        },
      },
    },
    {
      id: 'R2S Headmarker Party Stacks',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.heartStackMarker, capture: true },
      condition: (data, matches) => {
        if (data.beat === 1)
          return true;
        if (data.beat === 2 && data.myHearts === 0) {
          data.heartShed.push(matches.target);
          return data.heartShed.length === 2;
        }
        return false;
      },
      infoText: (data, matches, output) => {
        if (data.beat === 1) {
          const target = data.party.member(matches.target);
          return output.stacks1({ target: target.nick });
        }
        if (data.beat === 2 && data.heartShed.length === 2) {
          const target1 = data.party.member(data.heartShed[0]);
          const target2 = data.party.member(data.heartShed[1]);
          return output.stacks2({ target1: target1.nick, target2: target2.nick });
        }
      },
      run: (data) => data.heartShed = [],
      outputStrings: {
        stacks1: {
          en: 'Stacks: ${target}',
          ko: '뭉쳐요: ${target}',
        },
        stacks2: {
          en: 'Stacks: ${target1}/${target2}',
          ko: '뭉쳐요: ${target1}/${target2}',
        },
      },
    },
    {
      id: 'R2S Call Me Honey',
      type: 'StartsUsing',
      netRegex: { id: '9183', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Partners/Spread Counter',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9185', '9B08', '9B09'], source: 'Honey B. Lovely', capture: false },
      run: (data) => data.partnersSpreadCounter++,
    },
    {
      id: 'R2S Drop of Venom/Love',
      type: 'StartsUsing',
      netRegex: { id: ['9185', '9B09'], source: 'Honey B. Lovely', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.storedPartnersSpread = 'partners',
      outputStrings: {
        text: {
          en: 'Stored Partners',
          ja: 'あとでペア',
          ko: '(나중에 둘이 페어)',
        },
      },
    },
    {
      id: 'R2S Splash of Venom/Love',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9B08'], source: 'Honey B. Lovely', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.storedPartnersSpread = 'spread',
      outputStrings: {
        text: {
          en: 'Stored Spread',
          ja: 'あとで散開',
          ko: '(나중에 흩어져요)',
        },
      },
    },
    {
      id: 'R2S Delayed Partners/Spread Callout',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9185', '9B08', '9B09'], source: 'Honey B. Lovely', capture: false },
      delaySeconds: (data) => {
        // TODO: Review these delay timings
        switch (data.partnersSpreadCounter) {
          case 1:
            return 14;
          case 2:
            return 11;
          case 3:
            return 37;
          case 4:
            return 62;
          case 5:
            return 55;
        }
        return 0;
      },
      durationSeconds: 7,
      infoText: (data, _matches, output) => output[data.storedPartnersSpread ?? 'unknown'](),
      outputStrings: {
        spread: {
          en: 'Spread',
          ja: '散開',
          ko: '흩어져요',
        },
        partners: {
          en: 'Partners',
          ja: 'ペア',
          ko: '둘이 페어',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R2S Honey Beeline',
      type: 'StartsUsing',
      netRegex: { id: ['9186', '9B0C'], source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notOnlyAutumn(),
      response: Responses.goSides(),
    },
    {
      id: 'R2S Tempting Twist',
      type: 'StartsUsing',
      netRegex: { id: ['9187', '9B0D'], source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notOnlyAutumn(),
      response: Responses.getUnder(),
    },
    {
      id: 'R2S Honey B. Live Beats',
      type: 'StartsUsing',
      netRegex: { id: ['9C24', '9C25', '9C26'], source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Loveseeker',
      type: 'StartsUsing',
      netRegex: { id: '9B7D', source: 'Honey B. Lovely', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'R2S Centerstage Combo',
      type: 'StartsUsing',
      netRegex: { id: '91AC', source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notOnlyAutumn(),
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Under Intercards => Out => Cards',
          ja: '斜め内側 => 外側 => 十字',
          ko: '밑❌ 🔜 바깥❌ 🔜 바깥➕',
        },
      },
    },
    {
      id: 'R2S Outerstage Combo',
      type: 'StartsUsing',
      netRegex: { id: '91AD', source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notOnlyAutumn(),
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out Cards => Intercards => Under',
          ja: '外十字 => 外斜め => 内側',
          ko: '바깥➕ 🔜 바깥❌ 🔜 밑❌',
        },
      },
    },
    {
      id: 'R2S Honey B. Finale',
      type: 'StartsUsing',
      netRegex: { id: '918F', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Rotten Heart',
      type: 'StartsUsing',
      netRegex: { id: '91AA', source: 'Honey B. Lovely', capture: false },
      response: Responses.bigAoe(),
    },
    // ====== PRS ======
    {
      id: 'R2S Bee Sting',
      type: 'StartsUsing',
      netRegex: { id: '91A8', source: 'Honey B. Lovely', capture: false },
      condition: Conditions.notOnlyAutumn(),
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bee Sting',
          ko: '4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'R2S Poison \'n\' Pop',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5E' },
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        const len = parseFloat(matches.duration);
        if (len < 30) { // 26초
          data.poisonPop = 26;
          return output.s26();
        }
        data.poisonPop = 46;
        return output.s46();
      },
      outputStrings: {
        s26: {
          en: '(Bait AOE outside later)',
          ko: '(바깥쪽에 장판 버릴거예요)',
        },
        s46: {
          en: '(Soak Tower later)',
          ko: '(한가운데 🔜 탑 밟을거예요)',
        },
      },
    },
    {
      id: 'R2S Laceration',
      type: 'Ability',
      netRegex: { id: '91B2', source: 'Honey B. Lovely', capture: false },
      condition: (data) => data.poisonPop !== undefined,
      delaySeconds: 2.5,
      infoText: (data, _matches, output) => {
        if (data.poisonPop === 26) {
          data.poisonPop = 46;
          return output.aoe();
        }
        data.poisonPop = 26;
        return output.puddle();
      },
      outputStrings: {
        aoe: {
          en: 'Bait AOE',
          ko: '바깥쪽에 장판 버려요',
        },
        puddle: {
          en: 'Soak Tower',
          ko: '한가운데 🔜 탑 밟아요',
        },
      },
    },
    {
      id: 'R2S Beeloved Venom',
      type: 'GainsEffect',
      netRegex: { effectId: ['F5C', 'F5D'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go Center!',
          ko: '한가운데서 터쳐요!',
        },
      },
    },
    {
      id: 'R2S no Heart',
      type: 'GainsEffect',
      netRegex: { effectId: 'F52' },
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, _matches, output) => {
        if (data.beat === 2)
          return output.live2();
      },
      run: (data) => data.myHearts = 0,
      outputStrings: {
        live2: {
          en: 'Bait AOE',
          ko: '한가운데로 🔜 장판 유도',
        },
      },
    },
    {
      id: 'R2S Infatuated Heart',
      type: 'GainsEffect',
      netRegex: { effectId: 'F53' },
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, _matches, output) => {
        if (data.beat === 2)
          return output.live2();
      },
      run: (data) => data.myHearts = 1,
      outputStrings: {
        live2: {
          en: 'Tower or bait AOE',
          ko: '남쪽으로 🔜 타워 또는 장판',
        },
      },
    },
    {
      id: 'R2S Head Over Heels Heart',
      type: 'GainsEffect',
      netRegex: { effectId: 'F54' },
      condition: (data, matches) => data.me === matches.target,
      run: (data) => data.myHearts = 2,
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Honey B. Lovely': 'Suzie Summ Honigsüß',
        'Sweetheart': 'honigsüß(?:e|er|es|en) Herz',
      },
      'replaceText': {
        'Alarm Pheromones': 'Alarmpheromon',
        'Bee Sting': 'Bienenstich',
        'Big Burst': 'Detonation',
        'Blinding Love': 'Blinde Liebe',
        'Call Me Honey': 'Lieblicher Ruf',
        'Centerstage Combo': 'Innere Bühnenkombination',
        'Drop of Love': 'Liebestropfen',
        'Drop of Venom': 'Gifttropfen',
        'Fracture': 'Sprengung',
        'Heart-Struck': 'Herzschock',
        'Heartsick': 'Herzschmerz',
        'Heartsore': 'Herzqual',
        'Honey B. Finale': 'Honigsüßes Finale',
        'Honey B. Live: 1st Beat': 'Suzie Summ Solo: Auftakt',
        'Honey B. Live: 2nd Beat': 'Suzie Summ Solo: Refrain',
        'Honey B. Live: 3rd Beat': 'Suzie Summ Solo: Zugabe',
        'Honey Beeline': 'Honigschuss',
        'Killer Sting': 'Tödlicher Stich',
        'Laceration': 'Zerreißen',
        'Love Me Tender': 'Ein bisschen Liebe',
        'Loveseeker': 'Umwerben',
        'Outerstage Combo': 'Äußere Bühnenkombination',
        'Poison Sting': 'Giftstachel',
        'Rotten Heart': 'Schwarzes Herz',
        'Sheer Heart Attack': 'Herz ist Trumpf',
        'Splash of Venom': 'Giftregen',
        'Splinter': 'Platzen',
        'Spread Love': 'Liebesregen',
        'Stinging Slash': 'Tödlicher Schnitt',
        'Tempting Twist': 'Honigdreher',
        '\\(cast\\)': '(wirken)',
        '\\(damage\\)': '(Schaden)',
        '\\(drop\\)': '(Tropfen)',
        '\\(enrage\\)': '(Finalangriff)',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Honey B. Lovely': 'Honey B. Lovely',
        'Sweetheart': 'cœur chaleureux',
      },
      'replaceText': {
        'Alarm Pheromones': 'Phéromones d\'alerte',
        'Bee Sting': 'Dard d\'abeille',
        'Big Burst': 'Grosse explosion',
        'Blinding Love': 'Amour aveuglant',
        'Call Me Honey': 'Appelez-moi Lovely',
        'Centerstage Combo': 'Combo d\'amour central',
        'Drop of Love': 'Gouttes d\'amour',
        'Drop of Venom': 'Chute de venin',
        'Fracture': 'Fracture',
        'Heart-Struck': 'Choc de cœur',
        'Heartsick': 'Mal de cœur',
        'Heartsore': 'Peine de cœur',
        'Honey B. Finale': 'Honey B. Final',
        'Honey B. Live: 1st Beat': 'Honey B. Live - Ouverture',
        'Honey B. Live: 2nd Beat': 'Honey B. Live - Spectacle',
        'Honey B. Live: 3rd Beat': 'Honey B. Live - Conclusion',
        'Honey Beeline': 'Rayon mielleux',
        'Killer Sting': 'Dard tueur',
        'Laceration': 'Lacération',
        'Love Me Tender': 'Effusion d\'amour',
        'Loveseeker': 'Amour persistant',
        'Outerstage Combo': 'Combo d\'amour extérieur',
        'Poison Sting': 'Dard empoisonné',
        'Rotten Heart': 'Cœur cruel',
        'Sheer Heart Attack': 'Attaque au cœur pur',
        'Splash of Venom': 'Pluie de venin',
        'Splinter': 'Rupture',
        'Spread Love': 'Pluie d\'amour',
        'Stinging Slash': 'Taillade tueuse',
        'Tempting Twist': 'Tourbillon tentateur',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Honey B. Lovely': 'ハニー・B・ラブリー',
        'Sweetheart': 'ラブリーハート',
      },
      'replaceText': {
        'Alarm Pheromones': 'アラームフェロモン',
        'Bee Sting': 'ビースティング',
        'Big Burst': '大爆発',
        'Blinding Love': 'ラブ・イズ・ブラインド',
        'Call Me Honey': 'ラブリーコール',
        'Centerstage Combo': 'リング・ラブコンビネーション',
        'Drop of Love': 'ラブドロップ',
        'Drop of Venom': 'ベノムドロップ',
        'Fracture': '炸裂',
        'Heart-Struck': 'ハートショック',
        'Heartsick': 'ハートシック',
        'Heartsore': 'ハートソゥ',
        'Honey B. Finale': 'ハニー・B・フィナーレ',
        'Honey B. Live: 1st Beat': 'ハニー・B・ライヴ【1st】',
        'Honey B. Live: 2nd Beat': 'ハニー・B・ライヴ【2nd】',
        'Honey B. Live: 3rd Beat': 'ハニー・B・ライヴ【3rd】',
        'Honey Beeline': 'ハニーブラスト',
        'Killer Sting': 'キラースティング',
        'Laceration': '斬撃',
        'Love Me Tender': 'ラブ・ミー・テンダー',
        'Loveseeker': 'ラブシーカー',
        'Outerstage Combo': 'ラウンド・ラブコンビネーション',
        'Poison Sting': 'ポイズンスティング',
        'Rotten Heart': 'ブラックハート',
        'Sheer Heart Attack': 'シアー・ハート・アタック',
        'Splash of Venom': 'ベノムレイン',
        'Splinter': '破裂',
        'Spread Love': 'ラブレイン',
        'Stinging Slash': 'キラースラッシュ',
        'Tempting Twist': 'ハニーツイスター',
      },
    },
  ],
});
