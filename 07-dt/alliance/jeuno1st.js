// Jeuno: The First Walk
Options.Triggers.push({
  id: 'JeunoTheFirstWalk',
  zoneId: ZoneId.JeunoTheFirstWalk,
  timelineFile: 'jeuno1st.txt',
  initData: () => {
    return {
      cleaves: [],
    };
  },
  timelineTriggers: [],
  triggers: [
    // Prishe
    {
      id: 'Jeuno1 Prishe Banishga',
      type: 'StartsUsing',
      netRegex: { id: '9FE7', source: 'Prishe Of The Distant Chains', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Prishe Knuckle Sandwich',
      type: 'StartsUsing',
      netRegex: { id: ['9FE8', '9FE9', '9FEA'], source: 'Prishe Of The Distant Chains' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '9FE8')
          return output.text1();
        if (matches.id === '9FE9')
          return output.text2();
        if (matches.id === '9FEA')
          return output.text3();
      },
      outputStrings: {
        text1: {
          en: 'Punch x1',
          ko: '한 칸짜리 펀치',
        },
        text2: {
          en: 'Punch x2',
          ko: '두 칸짜리 펀치',
        },
        text3: {
          en: 'Punch x3',
          ko: '세 칸짜리 펀치',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Nullifying Dropkick',
      type: 'HeadMarker',
      netRegex: { id: '023A' },
      response: Responses.sharedTankBuster('alert'),
    },
    // 9FF2 Banish Storm
    {
      id: 'Jeuno1 Preshe Banishga IV',
      type: 'StartsUsing',
      netRegex: { id: '9FFA', source: 'Prishe of the Distant Chains', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Preshe Tabris Divinevalley',
      type: 'HeadMarker',
      netRegex: { id: '00D7' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'AOE on YOU',
          ko: '내게 장판! 바깥에 버려요',
        },
      },
    },
    {
      id: 'Jeuno1 Prishe Auroral Uppercut',
      type: 'StartsUsing',
      netRegex: { id: ['9FF6', '9FF7', '9FF8'], source: 'Prishe Of The Distant Chains' },
      durationSeconds: 5,
      infoText: (_data, matches, output) => {
        if (matches.id === '9FF6')
          return output.text1();
        if (matches.id === '9FF7')
          return output.text2();
        if (matches.id === '9FF8')
          return output.text3();
      },
      outputStrings: {
        text1: {
          en: 'Knuckback x1',
          ko: '한 칸짜리 넉백',
        },
        text2: {
          en: 'Knuckback x2',
          ko: '두 칸짜리 넉백',
        },
        text3: {
          en: 'Knuckback x3',
          ko: '세 칸짜리 넉백',
        },
      },
    },
    {
      id: 'Jeuno1 Preshe Asuran Fists',
      type: 'StartsUsing',
      netRegex: { id: '9FFC', source: 'Prishe of the Distant Chains', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack on Tower',
          ko: '타워 🔜 연속 전체 공격',
        },
      },
    },
    // fafnir
    {
      id: 'Jeuno1 Fafnir Dark Matter Blast',
      type: 'StartsUsing',
      netRegex: { id: '9F96', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Fafnir Spike Flail',
      type: 'StartsUsing',
      netRegex: { id: '9F6B', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Tail',
          ko: '꼬리치기, 앞으로',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Touchdown Windup',
      type: 'StartsUsing',
      netRegex: { id: '9F70', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Touchdown',
          ko: '내려찍기, 밖으로',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Dragon Breath Call',
      type: 'StartsUsing',
      netRegex: { id: '9F6E', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Breath',
          ko: '브레스, 안으로',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Baleful Breath',
      type: 'StartsUsing',
      netRegex: { id: '9BF2', source: 'Fafnir the Forgotten', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stack',
          ko: '전체 공격, 뭉쳐요',
        },
      },
    },
    {
      id: 'Jeuno1 Fafnir Sharp Spike Collect',
      type: 'HeadMarker',
      netRegex: { id: '0156' },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno1 Fafnir Sharp Spike',
      type: 'StartsUsing',
      netRegex: { id: '9F97', source: 'Fafnir the Forgotten', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleave: Outputs.tankCleaveOnYou,
          avoid: Outputs.avoidTankCleaves,
        };
        if (data.cleaves.includes(data.me))
          return { alertText: output.cleave() };
        return { infoText: output.avoid() };
      },
      run: (data) => data.cleaves = [],
    },
    {
      id: 'Jeuno1 Fafnir Horrid Roar Spread',
      type: 'HeadMarker',
      netRegex: { id: '01F3' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Jeuno1 Fafnir Hurricane Wing',
      type: 'StartsUsing',
      netRegex: { id: '9F71', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'Jeuno1 Fafnir Absolute Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8D', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'Jeuno1 Fafnir Winged Terror',
      type: 'StartsUsing',
      netRegex: { id: '9F8F', source: 'Fafnir the Forgotten', capture: false },
      response: Responses.getIn(),
    },
    // Ark Angel
    {
      id: 'Jeuno1 Ark Angel MR CloudSplitter Collect',
      type: 'HeadMarker',
      netRegex: { id: '01D0' },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno1 Ark Angel MR CloudSplitter',
      type: 'StartsUsing',
      netRegex: { id: 'A077', source: 'Ark Angel MR', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cleave: Outputs.tankCleaveOnYou,
          avoid: Outputs.avoidTankCleaves,
        };
        if (data.cleaves.includes(data.me))
          return { alertText: output.cleave() };
        return { infoText: output.avoid() };
      },
      run: (data) => data.cleaves = [],
    },
    {
      id: 'Jeuno1 Ark Angel MR Spiral Finish',
      type: 'StartsUsing',
      netRegex: { id: 'A06C', source: 'Ark Angel MR', capture: false },
      delaySeconds: 5.5,
      response: Responses.knockback(),
    },
    {
      id: 'Jeuno1 Ark Angel GK Gekko',
      type: 'StartsUsing',
      netRegex: { id: 'A07A', source: 'Ark Angel GK' },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      response: Responses.lookAwayFromSource(),
    },
    {
      id: 'Jeuno1 Ark Angel GK Dragonfall',
      type: 'StartsUsing',
      netRegex: { id: 'A07E', source: 'Ark Angel GK', capture: false },
      alertText: (_data, _matches, output) => output.stacks(),
      outputStrings: {
        stacks: Outputs.stacks,
      },
    },
    {
      id: 'Jeuno1 Ark Angel GK Arrogance Incarnate',
      type: 'HeadMarker',
      netRegex: { id: '0131' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Jeuno1 Ark Angel TT Meteor',
      type: 'StartsUsing',
      netRegex: { id: 'A08A', source: 'Ark Angel TT' },
      response: Responses.interruptIfPossible('alert'),
    },
    {
      id: 'Jeuno1 Ark Angel TT Guillotine',
      type: 'StartsUsing',
      netRegex: { id: 'A067', source: 'Ark Angel TT', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Behind TT',
          ko: '기요틴! TT 뒤로!',
        },
      },
    },
    {
      id: 'Jeuno1 Ark Angel EV Dominion Slash',
      type: 'StartsUsing',
      netRegex: { id: 'A085', source: 'Ark Angel EV', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Ark Angel EV Holy',
      type: 'StartsUsing',
      netRegex: { id: 'A089', source: 'Ark Angel EV', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 4M Critical Reaver',
      type: 'StartsUsing',
      netRegex: { id: 'A13B', source: 'Ark Angel HM' },
      durationSeconds: 5,
      response: Responses.interruptIfPossible('alert'),
    },
    {
      id: 'Jeuno1 Ark Angel Chasing Tether',
      type: 'Tether',
      netRegex: { id: '0125' },
      condition: (data, matches) => [matches.source, matches.target].includes(data.me),
      durationSeconds: 8,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Chasing tether -- run away!',
          ko: '도망쳐요! 줄 달렸네!',
        },
      },
    },
    // Shadow Lord
    {
      id: 'Jeuno1 Shadow Lord Giga Slash',
      type: 'StartsUsing',
      netRegex: { id: ['9F3E', '9F3F'], source: 'Shadow Lord' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F3E')
          return output.rl();
        return output.lr();
      },
      outputStrings: {
        lr: {
          en: 'Left => Right',
          ja: '左 => 右',
          ko: '왼쪽 🔜 오른쪽',
        },
        rl: {
          en: 'Right => Left',
          ja: '右 => 左',
          ko: '오른쪽 🔜 왼쪽',
        },
      },
    },
    {
      id: 'Jeuno1 Lordly Shadow Giga Slash',
      type: 'StartsUsing',
      netRegex: { id: ['9F3E', '9F3F'], source: 'Lordly Shadow' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F3E')
          return output.rl();
        return output.lr();
      },
      outputStrings: {
        lr: {
          en: 'Left => Right on shadow',
          ja: '(影) 左 => 右',
          ko: '(그림자) 왼쪽 🔜 오른쪽',
        },
        rl: {
          en: 'Right => Left on shadow',
          ja: '(影) 右 => 左',
          ko: '(그림자) 오른쪽 🔜 왼쪽',
        },
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Implosion',
      type: 'StartsUsing',
      netRegex: { id: ['9F44', '9F45'], source: 'Shadow Lord' },
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F44')
          return output.right();
        return output.left();
      },
      outputStrings: {
        left: {
          en: 'Go left + get out',
          ko: '왼쪽 + 밖으로',
        },
        right: {
          en: 'Go right + get out',
          ko: '오른쪽 + 밖으로',
        },
      },
    },
    {
      id: 'Jeuno1 Lordly Shadow Implosion',
      type: 'StartsUsing',
      netRegex: { id: ['9F44', '9F45'], source: 'Lordly Shadow' },
      delaySeconds: 3,
      durationSeconds: 7,
      alertText: (_data, matches, output) => {
        if (matches.id === '9F44')
          return output.right();
        return output.left();
      },
      outputStrings: {
        left: {
          en: 'Left of add + get out',
          ko: '(쫄) 왼쪽 + 밖으로',
        },
        right: {
          en: 'Right of add + get out',
          ko: '(쫄) 오른쪽 + 밖으로',
        },
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Flames Of Hatred',
      type: 'StartsUsing',
      netRegex: { id: '9F69', source: 'Shadow Lord', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Shadow Lord Cthonic Fury',
      type: 'StartsUsing',
      netRegex: { id: '9F4A', source: 'Shadow Lord', capture: false },
      durationSeconds: 6,
      response: Responses.aoe(),
    },
    {
      id: 'Jeuno1 Shadow Lord Burning Battlements',
      type: 'StartsUsing',
      netRegex: { id: '9F4F', source: 'Shadow Lord', capture: false },
      run: (data) => data.burning = 'battle',
    },
    {
      id: 'Jeuno1 Shadow Lord Burning Keep',
      type: 'StartsUsing',
      netRegex: { id: '9F4E', source: 'Shadow Lord', capture: false },
      run: (data) => data.burning = 'keep',
    },
    {
      id: 'Jeuno1 Shadow Lord Burning Moat',
      type: 'StartsUsing',
      netRegex: { id: '9F4D', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.3,
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.burning === 'battle')
          return output.close();
        if (data.burning === 'keep')
          return output.away();
        return output.none();
      },
      outputStrings: {
        none: {
          en: 'In circles',
          ko: '동그라미 안으로',
        },
        close: {
          en: 'In circles + Close to boss',
          ko: '동그라미 안으로 + 보스 가까이',
        },
        away: {
          en: 'In circles + Away from boss',
          ko: '동그라미 안으로 + 보스 멀리',
        },
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Burning Court',
      type: 'StartsUsing',
      netRegex: { id: '9F4C', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.3,
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.burning === 'battle')
          return output.close();
        if (data.burning === 'keep')
          return output.away();
        return output.none();
      },
      outputStrings: {
        none: {
          en: 'Out of circles',
          ko: '동그라미 밖으로',
        },
        close: {
          en: 'Out of circles + close to boss',
          ko: '동그라미 밖으로 + 보스 가까이',
        },
        away: {
          en: 'Out of circles + away from boss',
          ko: '동그라미 밖으로 + 보스 멀리',
        },
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Echoes Of Agony',
      type: 'HeadMarker',
      netRegex: { id: '0221' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Jeuno1 Shadow Lord Tera Slash',
      type: 'SystemLogMessage',
      netRegex: { id: '29AB', capture: false },
      durationSeconds: 10,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'Jeuno1 Shadow Lord Unbridled Rage Collect',
      type: 'HeadMarker',
      netRegex: { id: '01D7' },
      run: (data, matches) => data.cleaves.push(matches.target),
    },
    {
      id: 'Jeuno1 Shadow Lord Unbridled Rage',
      type: 'StartsUsing',
      netRegex: { id: '9F67', source: 'Shadow Lord', capture: false },
      delaySeconds: 0.5,
      alertText: (data, _matches, output) => {
        if (data.cleaves.includes(data.me))
          return output.cleave();
        return output.avoid();
      },
      run: (data) => data.cleaves = [],
      outputStrings: {
        cleave: Outputs.tankCleaveOnYou,
        avoid: Outputs.avoidTankCleaves,
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Dark Nova',
      type: 'HeadMarker',
      netRegex: { id: '0137' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Jeuno1 Shadow Lord Binding Sigil',
      type: 'StartsUsing',
      netRegex: { id: '9F55', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.sigilDodge(),
      outputStrings: {
        sigilDodge: {
          en: 'Dodge puddles 3 to 1',
          ko: '장판 세번째▶첫번째로 피하기',
        },
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Damning Strikes',
      type: 'StartsUsing',
      netRegex: { id: '9F57', capture: false },
      durationSeconds: 5,
      response: Responses.getTowers(),
    },
    {
      id: 'Jeuno1 Shadow Lord Nightfall Slash',
      type: 'StartsUsing',
      netRegex: { id: ['A424', 'A425', 'A426', 'A427'], source: 'Shadow Lord' },
      durationSeconds: 10,
      alertText: (_data, matches, output) => {
        if (matches.id === 'A424')
          return output.rlb();
        if (matches.id === 'A425')
          return output.rlf();
        if (matches.id === 'A426')
          return output.lrb();
        return output.lrf();
      },
      outputStrings: {
        rlb: {
          en: 'Right => Left => Back',
          ko: '오른쪽 🔜 왼쪽 🔜 뒤로',
        },
        rlf: {
          en: 'Right => Left => Front',
          ko: '오른쪽 🔜 왼쪽 🔜 앞으로',
        },
        lrb: {
          en: 'Left => Right => Back',
          ko: '왼쪽 🔜 오른쪽 🔜 뒤로',
        },
        lrf: {
          en: 'Left => Right => Front',
          ko: '왼쪽 🔜 오른쪽 🔜 앞으로',
        },
      },
    },
    {
      id: 'Jeuno1 Shadow Lord Doom Arc',
      type: 'StartsUsing',
      netRegex: { id: '9F66', source: 'Shadow Lord', capture: false },
      durationSeconds: 14,
      response: Responses.bleedAoe(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Prishe of the Distant Chains': 'Prishe of the Distant Chains',
        'Fafnir the Forgotten': 'Fafnir',
        'Ark Angel TT': 'Ark Angel TT',
        'Ark Angel EV': 'Ark Angel EV',
        'Ark Angel MR': 'Ark Angel MR',
        'Ark Angel HM': 'Ark Angel MM',
        'Shadow Lord': 'Shadow Lord',
        'Lordly Shadow': 'Lordly Shadow',
      },
    },
  ],
});
