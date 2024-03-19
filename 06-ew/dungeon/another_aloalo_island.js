const MarchMoveStrings = {
  stacks: Outputs.getTogether,
  spread: Outputs.spread,
  forward: {
    en: 'Move: Forward => ${dest}',
    ja: '強制移動 : 前 => ${dest}',
    ko: '강제이동: 앞 🔜 ${dest}',
  },
  backward: {
    en: 'Move: Back => ${dest}',
    ja: '強制移動 : 後ろ => ${dest}',
    ko: '강제이동: 뒤 🔜 ${dest}',
  },
  left: {
    en: 'Move: Left => ${dest}',
    ja: '強制移動 : 左 => ${dest}',
    ko: '강제이동: 왼쪽 🔜 ${dest}',
  },
  right: {
    en: 'Move: Right => ${dest}',
    ja: '強制移動 : 右 => ${dest}',
    ko: '강제이동: 오른쪽 🔜 ${dest}',
  },
};
// Horizontal crystals have a heading of 0, vertical crystals are -pi/2.
const isHorizontalCrystal = (line) => {
  const epsilon = 0.1;
  return Math.abs(parseFloat(line.heading)) < epsilon;
};
// test reverse rotation
const isReverseRotate = (rot, times) => {
  if (rot === 'cw' && times === 3)
    return true;
  if (rot === 'ccw' && times === 5)
    return true;
  return false;
};
//
const marchMove = (output, march, stackFirst, safezone) => {
  const move = {
    'front': output.forward,
    'back': output.backward,
    'left': output.left,
    'right': output.right,
  }[march];
  if (safezone !== undefined)
    return move({ dest: safezone });
  return move({ dest: stackFirst ? output.stacks() : output.spread() });
};
// 주사위를 방향으로
const diceToArrow = (no) => {
  const arrowMap = {
    1: '🡹',
    2: '🡽',
    3: '🡾',
    4: '🡻',
    5: '🡿',
    6: '🡼',
  };
  const ret = arrowMap[no];
  return ret === undefined ? 'ꔫ' : ret;
};
Options.Triggers.push({
  id: 'AnotherAloaloIsland',
  zoneId: ZoneId.AnotherAloaloIsland,
  config: [
    {
      id: 'flukeGaleType',
      name: {
        en: 'Fluke Gale Strat',
        ja: 'Fluke Gale タイプ',
        ko: 'Fluke Gale 형식',
      },
      type: 'select',
      options: {
        en: {
          'Message only': 'spread',
          'Pylene: Brainless': 'pylene',
          'Hamukasu: North/South static': 'hamukatsu',
        },
        ja: {
          'メッセージ': 'spread',
          'ぴれん: 脳死法': 'pylene',
          'ハムカツ: 南北': 'hamukatsu',
        },
        ko: {
          '메시지': 'spread',
          '피렌: 뇌사': 'pylene',
          '하므까스: 남북고정': 'hamukatsu',
        },
      },
      default: 'hamukatsu',
    },
    {
      id: 'planarTacticsType',
      name: {
        en: 'Planar Tactics Strat',
        ja: 'Planar Tactics タイプ',
        ko: 'Planar Tactics 형식',
      },
      type: 'select',
      options: {
        en: {
          'Count only': 'count',
          'Poshiume: 3 left or right': 'poshiume',
          'Hamukatsu: 3 right only': 'hamukatsu',
        },
        ja: {
          'カウント表示': 'count',
          'ぽしうめ: 3番左右': 'poshiume',
          'ハムカツ: 3番右': 'hamukatsu',
        },
        ko: {
          '카운트 표시': 'count',
          '포시우메: 3번 좌우 사용': 'poshiume',
          '하므까스: 3번 한쪽만 사용': 'hamukatsu',
        },
      },
      default: 'hamukatsu',
    },
    {
      id: 'pinwheelingType',
      name: {
        en: 'Pinwheeling Strat',
        ja: 'ダート＆ウィル タイプ',
        ko: 'Pinwheeling 형식',
      },
      type: 'select',
      options: {
        en: {
          'Message only': 'stack',
          'Pino': 'pino',
          'Spell': 'spell',
        },
        ja: {
          'メッセージ': 'stack',
          'ぴの(ハムカツ)': 'pino',
          'spell(Game8)': 'spell',
        },
        ko: {
          '메시지': 'stack',
          '피노': 'pino',
          '스펠': 'spell',
        },
      },
      default: 'pino',
    },
  ],
  timelineFile: 'another_aloalo_island.txt',
  initData: () => {
    return {
      ketuCrystalAdd: [],
      ketuSpringCrystalCount: 0,
      ketuHydroCount: 0,
      ketuBuffCollect: [],
      lalaAlphaGains: [],
      stcReloads: 0,
      stcMisload: 0,
      stcStackSpread: false,
      stcRingRing: 0,
      stcBullsEyes: [],
      stcClaws: [],
      stcMissiles: [],
      stcChains: [],
      stcSeenPinwheeling: false,
      stcDuration: 0,
      settled: false,
    };
  },
  timelineTriggers: [
    {
      id: 'AAI Options',
      regex: /--setup--/,
      infoText: (data, _matches, output) => {
        if (data.settled)
          return output.settled();
        data.settled = true;
        if (data.options.AutumnParameter !== undefined) {
          const ss = data.options.AutumnParameter.split(',');
          if (ss.length === 1 && ss[0] === 'hm') {
            data.triggerSetConfig.flukeGaleType = 'hamukatsu';
            data.triggerSetConfig.planarTacticsType = 'hamukatsu';
            data.triggerSetConfig.pinwheelingType = 'pino';
          }
          if (ss.length === 2) {
            data.triggerSetConfig.flukeGaleType = ss[0] === 'hm' ? 'hamukatsu' : 'pylene';
            data.triggerSetConfig.planarTacticsType = ss[1] === 'hm' ? 'hamukatsu' : 'poshiume';
            data.triggerSetConfig.pinwheelingType = 'pino';
          }
          if (ss.length === 3) {
            data.triggerSetConfig.flukeGaleType = ss[0] === 'hm' ? 'hamukatsu' : 'pylene';
            data.triggerSetConfig.planarTacticsType = ss[1] === 'hm' ? 'hamukatsu' : 'poshiume';
            data.triggerSetConfig.pinwheelingType = ss[2] === 'sp' ? 'spell' : 'pino';
          }
        }
        const param = output.options({
          fluke: {
            'spread': output.spread(),
            'pylene': output.pylene(),
            'hamukatsu': output.flukeNs(),
          }[data.triggerSetConfig.flukeGaleType],
          planar: {
            'count': output.count(),
            'poshiume': output.planar13(),
            'hamukatsu': output.planar3(),
          }[data.triggerSetConfig.planarTacticsType],
          pin: {
            'stack': output.stack(),
            'pino': output.pino(),
            'spell': output.spell(),
          }[data.triggerSetConfig.pinwheelingType],
        });
        return output.mesg({ param: param });
      },
      outputStrings: {
        settled: {
          en: '(Option already settled)',
          ja: '(設定されています)',
          ko: '(설정이 있어요)',
        },
        mesg: {
          en: 'Option: ${param}',
          ja: 'オプション: ${param}',
          ko: '옵션: ${param}',
        },
        options: {
          en: '${fluke}/${planar}/${pin}',
          ja: '${fluke}/${planar}/${pin}',
          ko: '${fluke}/${planar}/${pin}',
        },
        spread: {
          en: '(spread)',
          ja: '(なし)',
          ko: '(없음)',
        },
        pylene: {
          en: 'pylene',
          ja: 'ぴれん',
          ko: '피렌',
        },
        flukeNs: {
          en: 'N-S',
          ja: '南北',
          ko: '남북',
        },
        count: {
          en: '(count)',
          ja: '(カウント)',
          ko: '(카운트)',
        },
        planar13: {
          en: '1&3',
          ja: '両方',
          ko: '양쪽',
        },
        planar3: {
          en: '3',
          ja: '片方',
          ko: '한쪽',
        },
        stack: {
          en: '(stack)',
          ja: '(なし)',
          ko: '(없음)',
        },
        pino: {
          en: 'pino',
          ja: 'ぴの',
          ko: '피노',
        },
        spell: {
          en: 'spell',
          ja: 'spell',
          ko: '스펠',
        },
      },
    },
  ],
  triggers: [
    // ---------------- first trash ----------------
    {
      id: 'AAI Kiwakin Lead Hook',
      type: 'StartsUsing',
      netRegex: { id: '8C6E', source: 'Aloalo Kiwakin' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankBusterOnYou: {
            en: '3x Tankbuster on YOU',
            de: '3x Tankbuster auf DIR',
            ja: '自分に3xタン強',
            ko: '내게 3연속 탱크버스터',
          },
          tankBusterOnPlayer: {
            en: '3x Tankbuster on ${player}',
            de: '3x Tankbuster auf ${player}',
            ja: '3xタン強: ${player}',
            ko: '3연속 탱크버스터: ${player}',
          },
        };
        if (matches.target === data.me)
          return { alertText: output.tankBusterOnYou() };
        const target = data.party.jobAbbr(matches.target);
        return { infoText: output.tankBusterOnPlayer({ player: target }) };
      },
    },
    {
      id: 'AAI Kiwakin Sharp Strike',
      type: 'StartsUsing',
      netRegex: { id: '8C63', source: 'Aloalo Kiwakin' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AAI Kiwakin Sharp Strike Cleanse',
      type: 'Ability',
      netRegex: { id: '8C63', source: 'Aloalo Kiwakin' },
      condition: (data) => data.CanCleanse(),
      alertText: (data, matches, output) =>
        output.text({ player: data.party.jobAbbr(matches.target) }),
      outputStrings: {
        text: {
          en: 'Cleanse ${player}',
          ja: 'エスナ: ${player}',
          ko: '에스나: ${player}',
        },
      },
    },
    {
      id: 'AAI Kiwakin Tail Screw',
      type: 'StartsUsing',
      // This is a baited targeted circle.
      netRegex: { id: '8BB8', source: 'Aloalo Kiwakin', capture: false },
      response: Responses.moveAway(),
    },
    {
      id: 'AAI Snipper Water III',
      type: 'StartsUsing',
      netRegex: { id: '8C64', source: 'Aloalo Snipper' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'AAI Snipper Bubble Shower',
      type: 'StartsUsing',
      netRegex: { id: '8BB9', source: 'Aloalo Snipper', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'AAI Snipper Crab Dribble',
      type: 'Ability',
      // Crab Dribble 8BBA has a fast cast, so trigger on Bubble Shower ability
      netRegex: { id: '8BB9', source: 'Aloalo Snipper', capture: false },
      suppressSeconds: 5,
      response: Responses.goFront('info'),
    },
    {
      id: 'AAI Ray Hydrocannon',
      type: 'StartsUsing',
      netRegex: { id: '8BBD', source: 'Aloalo Ray', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'AAI Ray Expulsion',
      type: 'StartsUsing',
      netRegex: { id: '8BBF', source: 'Aloalo Ray', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'AAI Ray Electric Whorl',
      type: 'StartsUsing',
      netRegex: { id: '8BBE', source: 'Aloalo Ray', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'AAI Monk Hydroshot',
      type: 'StartsUsing',
      netRegex: { id: '8BBE', source: 'Aloalo Monk' },
      condition: Conditions.targetIsYou(),
      response: Responses.knockbackOn(),
    },
    {
      id: 'AAI Monk Cross Attack',
      type: 'StartsUsing',
      netRegex: { id: '8BBB', source: 'Aloalo Monk' },
      response: Responses.tankBuster(),
    },
    // ---------------- Ketuduke ----------------
    {
      id: 'AAI Ketuduke Tidal Roar',
      type: 'StartsUsing',
      netRegex: { id: '8AD4', source: 'Ketuduke', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'AAI Ketuduke Spring Crystals',
      type: 'StartsUsing',
      netRegex: { id: '8AA8', source: 'Ketuduke', capture: false },
      run: (data) => {
        data.ketuSpringCrystalCount++;
        data.ketuCrystalAdd = [];
      },
    },
    {
      id: 'AAI Ketuduke Spring Crystal 1 Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12606' },
      run: (data, matches) => data.ketuCrystalAdd.push(matches),
    },
    {
      id: 'AAI Ketuduke Spring Crystal 2 Collect',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12607' },
      run: (data, matches) => data.ketuCrystalAdd.push(matches),
    },
    {
      id: 'AAI Ketuduke Bubble Net',
      type: 'StartsUsing',
      netRegex: { id: ['8AC5', '8AAD'], source: 'Ketuduke', capture: false },
      response: Responses.aoe(),
      run: (data) => data.ketuBuffCollect = [],
    },
    {
      id: 'AAI Ketuduke Bubble Weave/Foamy Fetters',
      type: 'GainsEffect',
      // ECC = Foamy Fetters
      // E9F = Bubble Weave
      netRegex: { effectId: ['ECC', 'E9F'] },
      condition: (data, matches) => {
        data.ketuBuffCollect.push(matches);
        return data.ketuBuffCollect.length === 4;
      },
      durationSeconds: 6,
      alertText: (data, _matches, output) => {
        const myid = data.ketuBuffCollect.find((x) => x.target === data.me)?.effectId;
        if (myid === undefined)
          return;
        data.ketuBuff = myid === 'E9F' ? 'bubble' : 'fetters';
        const partner = data.party.jobAbbr(
          data.ketuBuffCollect.find((x) => x.effectId === myid && x.target !== data.me)?.target,
        ) ?? output.unknown();
        return output[data.ketuBuff]({ partner: partner });
      },
      run: (data) => data.ketuBuffCollect,
      outputStrings: {
        bubble: {
          en: 'Bubble (w/ ${partner})',
          ja: 'バブル (${partner})',
          ko: '🔵버블 (${partner})',
        },
        fetters: {
          en: 'Fetters (w/ ${partner})',
          ja: 'バインド (${partner})',
          ko: '🟡바인드 (${partner})',
        },
        safe: {
          en: 'Safe: ${safe}',
          ja: '安置: ${safe}',
          ko: '안전: ${safe}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Ketuduke Hydro Counter',
      type: 'StartsUsing',
      // 8AB8 = Hydrobullet (spread)
      // 8AB4 = Hydrofall (stack)
      netRegex: { id: ['8AB8', '8AB4'], source: 'Ketuduke', capture: false },
      run: (data) => data.ketuHydroCount++,
    },
    {
      id: 'AAI Ketuduke Hydrobullet Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA3' },
      condition: (data) => [2, 4, 5].includes(data.ketuHydroCount),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      durationSeconds: 4,
      suppressSeconds: 5,
      response: Responses.pairStack('info'),
    },
    {
      id: 'AAI Ketuduke Hydrofall Reminder',
      type: 'GainsEffect',
      netRegex: { effectId: 'EA4' },
      condition: (data) => [2, 3, 5].includes(data.ketuHydroCount),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      durationSeconds: 4,
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    // Pylene: https://twitter.com/ff14_pylene99/status/1719665676745650610
    // Hamukatu Nanboku: https://ffxiv.link/0102424
    {
      id: 'AAI Ketuduke Hydro 1',
      type: 'StartsUsing',
      netRegex: { id: ['8AB8', '8AB4'], source: 'Ketuduke' },
      condition: (data) => data.ketuHydroCount === 1 || data.ketuHydroCount === 6,
      delaySeconds: 8,
      durationSeconds: 12,
      alertText: (data, matches, output) => {
        const mech = matches.id === '8AB4' ? output.stacks() : output.spread();
        if (data.triggerSetConfig.flukeGaleType === 'spread')
          return output.mesg({ mech: mech });
        if (data.triggerSetConfig.flukeGaleType === 'pylene') {
          if (data.ketuBuff === 'fetters' && matches.id === '8AB8')
            return output.pylene2({ mech: mech });
          return output.pylene1({ mech: mech });
        }
        if (data.triggerSetConfig.flukeGaleType === 'hamukatsu') {
          if (data.ketuBuff === 'bubble')
            return output.hamukatsuBubble({ mech: mech });
          if (matches.id === '8AB4')
            return output.hamukatsu1({ mech: mech });
          return output.hamukatsu2({ mech: mech });
        }
      },
      run: (data) => delete data.ketuBuff,
      outputStrings: {
        spread: Outputs.spread,
        stacks: Outputs.pairStack,
        mesg: {
          en: 'Go to safe tile => ${mech}',
          ja: '安置マスへ => ${mech}',
          ko: '안전 칸으로 🔜 ${mech}',
        },
        pylene1: {
          en: 'Go to 1 => ${mech}',
          ja: '第1区域へ => ${mech}',
          ko: '피렌 [1] 🔜 ${mech}',
        },
        pylene2: {
          en: 'Go to 2 => ${mech}',
          ja: '第2区域へ => ${mech}',
          ko: '피렌 [2] 🔜 ${mech}',
        },
        hamukatsu1: {
          en: 'Go to 1 => ${mech}',
          ja: '第1区域の安置マスへ => ${mech}',
          ko: '[1] 안전 칸 🔜 ${mech}',
        },
        hamukatsu2: {
          en: 'Go to 2 safe tile  => ${mech}',
          ja: '第2区域の安置マスへ => ${mech}',
          ko: '[2] 안전 칸 🔜 ${mech}',
        },
        hamukatsuBubble: {
          en: 'Go to 2 safe tile (after knockback) => ${mech}',
          ja: '第2区域の安置マスへ => ${mech}',
          ko: '[2] (넉백후)안전 칸 🔜 ${mech}',
        },
      },
    },
    {
      id: 'AAI Ketuduke Hydro 2',
      type: 'StartsUsing',
      netRegex: { id: ['8AB8', '8AB4'], source: 'Ketuduke' },
      condition: (data) => data.ketuHydroCount === 2 || data.ketuHydroCount === 5,
      durationSeconds: 8,
      alertText: (_data, matches, output) =>
        matches.id === '8AB4' ? output.stacks() : output.spread(),
      outputStrings: {
        stacks: Outputs.pairThenSpread,
        spread: Outputs.spreadThenPair,
      },
    },
    {
      id: 'AAI Ketuduke Receding Twintides',
      type: 'StartsUsing',
      netRegex: { id: '8ACC', source: 'Ketuduke', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Out => Stack inside',
          ja: '外 => 内側でペア',
          ko: '밖에 있다 🔜 안에서 페어',
        },
      },
    },
    {
      id: 'AAI Ketuduke Encroaching Twintides',
      type: 'StartsUsing',
      netRegex: { id: '8ACE', source: 'Ketuduke', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'In => Stack outside',
          ja: 'ボスの下 => 外側でペア',
          ko: '안에 있다 🔜 밖에서 페어',
        },
      },
    },
    {
      id: 'AAI Ketuduke Spring Crystals 2',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12607', capture: false },
      condition: (data) => data.ketuSpringCrystalCount === 2 && data.ketuCrystalAdd.length === 4,
      delaySeconds: 2,
      durationSeconds: 18,
      infoText: (data, _matches, output) => {
        const horizontal = data.ketuCrystalAdd.filter((x) => isHorizontalCrystal(x));
        const vertical = data.ketuCrystalAdd.filter((x) => !isHorizontalCrystal(x));
        if (horizontal.length !== 2 || vertical.length !== 2)
          return;
        // Crystal positions are always -15, -5, 5, 15.
        // Check if any verticals are on the outer vertical edges.
        for (const line of vertical) {
          const y = parseFloat(line.y);
          if (y < -10 || y > 10) {
            return output.text({ safe: output.eastWestSafe() });
          }
        }
        // Check if any horizontals are on the outer horizontal edges.
        for (const line of horizontal) {
          const x = parseFloat(line.x);
          if (x < -10 || x > 10) {
            return output.text({ safe: output.northSouthSafe() });
          }
        }
        return output.text({ safe: output.cornersSafe() });
      },
      outputStrings: {
        northSouthSafe: {
          en: 'North/South',
          ja: '南・北',
          ko: '⇅남북',
        },
        eastWestSafe: {
          en: 'East/West',
          ja: '東・西',
          ko: '⇆동서',
        },
        cornersSafe: {
          en: 'Corners',
          ja: '隅へ',
          ko: '❌구석',
        },
        text: {
          en: 'Safe: ${safe}',
          ja: '安置: ${safe}',
          ko: '안전: ${safe}',
        },
      },
    },
    {
      id: 'AAI Ketuduke Roar Move',
      type: 'StartsUsing',
      netRegex: { id: '8AAC', source: 'Spring Crystal', capture: false },
      condition: (data) => data.ketuHydroCount === 4,
      durationSeconds: 4,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        if (data.ketuBuff === undefined)
          return output.text();
        return output[data.ketuBuff]();
      },
      run: (data) => delete data.ketuBuff,
      outputStrings: {
        text: {
          en: 'Behind add',
          ja: 'ざこの後ろに',
          ko: '쫄 뒤로!',
        },
        bubble: {
          en: 'Behind Fetters',
          ja: 'バインドのざこの後ろに',
          ko: '바인드🟡 쫄 뒤로!',
        },
        fetters: {
          en: 'Behind Bubble',
          ja: 'バブルのざこの後ろに',
          ko: '버블🔵 쫄 뒤로!',
        },
      },
    },
    {
      id: 'AAI Ketuduke Angry Seas Knockback',
      type: 'StartsUsing',
      netRegex: { id: '8AC1', source: 'Ketuduke', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'AAI Ketuduke Fluke Typhoon Bubble',
      type: 'StartsUsing',
      netRegex: { id: '8AAF', source: 'Ketuduke', capture: false },
      infoText: (data, _matches, output) => {
        if (data.ketuCrystalAdd.length !== 4 || data.ketuCrystalAdd[0] === undefined)
          return output.text();
        if (data.options.AutumnStyle) {
          if (parseFloat(data.ketuCrystalAdd[0].x) < 0) {
            if (data.role === 'tank' || data.role === 'dps')
              return output.left();
            return;
          }
          if (data.role === 'healer' || data.role === 'dps')
            return output.right();
          return;
        }
        if (data.role === 'dps') {
          if (parseFloat(data.ketuCrystalAdd[0].x) < 0)
            return output.left();
          return output.right();
        }
      },
      run: (data) => data.ketuCrystalAdd = [],
      outputStrings: {
        text: {
          en: '(Ready to Bubble!)',
          ja: '(そろそろバブル！)',
          ko: '(슬슬 버블!)',
        },
        left: {
          en: '(Bubble: Left)',
          ja: '(左からバブル！)',
          ko: '(왼쪽에서 버블!)',
        },
        right: {
          en: '(Bubble: Right)',
          ja: '(右からバブル！)',
          ko: '(오른쪽에서 버블!)',
        },
      },
    },
    {
      id: 'AAI Ketuduke Fluke Typhoon Tower',
      type: 'Ability',
      netRegex: { id: '8AB0', source: 'Ketuduke', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get Tower',
          ja: '塔踏み',
          ko: '장판 피하면서 타워 밟아요',
        },
      },
    },
    // ---------------- second trash ----------------
    {
      id: 'AAI Wood Golem Ancient Aero III',
      type: 'StartsUsing',
      netRegex: { id: '8C4C', source: 'Aloalo Wood Golem' },
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt(),
    },
    {
      id: 'AAI Wood Golem Tornado',
      type: 'StartsUsing',
      netRegex: { id: '8C4D', source: 'Aloalo Wood Golem' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tornadoOn: {
            en: 'Away from ${player}',
            de: 'Weg von ${player}',
            ja: 'トルネド: ${player}',
            ko: '토네이도: ${player}',
          },
          tornadoOnYou: {
            en: 'Tornado on YOU',
            de: 'Tornado auf DIR',
            ja: '自分にトルネド',
            ko: '내게 토네이도',
          },
        };
        if (data.me === matches.target)
          return { alertText: output.tornadoOnYou() };
        return { infoText: output.tornadoOn({ player: data.party.jobAbbr(matches.target) }) };
      },
    },
    {
      id: 'AAI Wood Golem Tornado Bind',
      type: 'GainsEffect',
      netRegex: { effectId: 'EC0' },
      condition: (data) => data.CanCleanse(),
      alertText: (data, matches, output) =>
        output.text({ player: data.party.jobAbbr(matches.target) }),
      outputStrings: {
        text: {
          en: 'Cleanse ${player}',
          de: 'Reinige ${player}',
          ja: 'エスナ: ${player}',
          ko: '에스나: ${player}',
        },
      },
    },
    {
      id: 'AAI Wood Golem Ovation',
      type: 'StartsUsing',
      netRegex: { id: '8BC1', source: 'Aloalo Wood Golem', capture: false },
      response: Responses.getBehind('info'),
    },
    {
      id: 'AAI Islekeeper Gravity Force',
      type: 'StartsUsing',
      netRegex: { id: '8BC5', source: 'Aloalo Islekeeper' },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.itsme();
        return output.text({ player: data.party.jobAbbr(matches.target) });
      },
      outputStrings: {
        itsme: {
          en: 'Stack on YOU',
          ja: '自分にグラビデフォース',
          ko: '내게 중력',
        },
        text: {
          en: 'Stack on ${player}',
          ja: 'グラビデフォース: ${player}',
          ko: '중력: ${player}',
        },
      },
    },
    {
      id: 'AAI Islekeeper Isle Drop',
      type: 'StartsUsing',
      netRegex: { id: '8C6F', source: 'Aloalo Islekeeper', capture: false },
      response: Responses.moveAway('alert'),
    },
    {
      id: 'AAI Islekeeper Ancient Quaga',
      type: 'StartsUsing',
      netRegex: { id: '8C4E', source: 'Aloalo Islekeeper', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'AAI Islekeeper Ancient Quaga Enrage',
      type: 'StartsUsing',
      netRegex: { id: '8C2F', source: 'Aloalo Islekeeper', capture: false },
      alarmText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Kill Islekeeper!',
          de: 'Wächter besiegen!',
          ja: '倒して！',
          ko: '죽여야해!',
        },
      },
    },
    // ---------------- lala ----------------
    {
      id: 'AAI Lala Inferno Theorem',
      type: 'StartsUsing',
      netRegex: { id: '88AE', source: 'Lala', capture: false },
      response: Responses.aoe('alert'),
    },
    {
      id: 'AAI Lala Rotation Tracker',
      type: 'HeadMarker',
      netRegex: { id: ['01E4', '01E5'], target: 'Lala' },
      run: (data, matches) => data.lalaRotation = matches.id === '01E4' ? 'cw' : 'ccw',
    },
    {
      id: 'AAI Lala Angular Addition Tracker',
      type: 'GainsEffect',
      netRegex: { effectId: ['F62', 'F63'], source: 'Lala' },
      run: (data, matches) => data.lalaTimes = matches.effectId === 'F62' ? 3 : 5,
    },
    {
      id: 'AAI LaLa Arcane Blight',
      type: 'StartsUsing',
      netRegex: { id: ['888B', '888C', '888D', '888E'], source: 'Lala' },
      delaySeconds: 0.5,
      alertText: (data, matches, output) => {
        const blightMap = {
          '888B': 'back',
          '888C': 'front',
          '888D': 'right',
          '888E': 'left',
        };
        const blight = blightMap[matches.id.toUpperCase()];
        if (data.lalaRotation === undefined || data.lalaTimes === undefined)
          return output[blight]();
        if (isReverseRotate(data.lalaRotation, data.lalaTimes)) {
          return {
            'front': output.left(),
            'back': output.right(),
            'left': output.back(),
            'right': output.front(),
          }[blight];
        }
        return {
          'front': output.right(),
          'back': output.left(),
          'left': output.front(),
          'right': output.back(),
        }[blight];
      },
      run: (data) => {
        delete data.lalaTimes;
        delete data.lalaRotation;
      },
      outputStrings: {
        front: {
          en: 'Ⓐ Front',
          ja: 'Ⓐ 前へ',
          ko: 'Ⓐ 앞으로',
        },
        back: {
          en: 'Ⓒ Behind',
          ja: 'Ⓒ 背面へ',
          ko: 'Ⓒ 엉댕이로',
        },
        left: {
          en: 'Ⓓ Left',
          ja: 'Ⓓ 左へ',
          ko: 'Ⓓ 왼쪽',
        },
        right: {
          en: 'Ⓑ Right',
          ja: 'Ⓑ 右へ',
          ko: 'Ⓑ 오른쪽',
        },
      },
    },
    {
      id: 'AAI Lala My Rotation Collect',
      type: 'HeadMarker',
      netRegex: { id: ['01ED', '01EE'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.lalaMyRotation = matches.id === '01ED' ? 'cw' : 'ccw',
    },
    {
      id: 'AAI Lala My Times Collect',
      type: 'GainsEffect',
      netRegex: { effectId: ['E89', 'ECE'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => data.lalaMyTimes = matches.effectId === 'E89' ? 3 : 5,
    },
    {
      id: 'AAI Lala Unseen',
      type: 'GainsEffect',
      netRegex: { effectId: ['E8E', 'E8F', 'E90', 'E91'], source: 'Lala' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 15,
      infoText: (data, matches, output) => {
        const unseenMap = {
          E8E: 'front',
          E8F: 'back',
          E90: 'right',
          E91: 'left',
        };
        data.lalaUnseen = unseenMap[matches.effectId];
        const unseen = data.lalaUnseen ?? 'unknown';
        return output.open({ unseen: output[unseen]() });
      },
      outputStrings: {
        open: {
          en: 'Open: ${unseen}',
          ja: '開: ${unseen}',
          ko: '뚤린 곳: ${unseen}',
        },
        front: Outputs.front,
        back: Outputs.back,
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Lala Targeted Light',
      type: 'StartsUsing',
      netRegex: { id: '8CDF', source: 'Lala' },
      condition: Conditions.targetIsYou(),
      alertText: (data, _matches, output) => {
        if (data.lalaUnseen === undefined)
          return;
        if (data.lalaMyRotation === undefined || data.lalaMyTimes === undefined)
          return output[data.lalaUnseen]();
        if (isReverseRotate(data.lalaMyRotation, data.lalaMyTimes))
          return {
            'front': output.left(),
            'back': output.right(),
            'left': output.back(),
            'right': output.front(),
          }[data.lalaUnseen];
        return {
          'front': output.right(),
          'back': output.left(),
          'left': output.front(),
          'right': output.back(),
        }[data.lalaUnseen];
      },
      run: (data) => {
        delete data.lalaUnseen;
        delete data.lalaMyTimes;
        delete data.lalaMyRotation;
      },
      outputStrings: {
        front: {
          en: 'Face Towards Lala',
          de: 'Lala anschauen',
          ja: 'ボスを見て',
          ko: '보스 봐욧',
        },
        back: {
          en: 'Look Away from Lala',
          de: 'Von Lala weg schauen',
          ja: '後ろ見て',
          ko: '뒤돌아 봐요',
        },
        left: {
          en: 'Left Flank towards Lala',
          de: 'Linke Seite zu Lala zeigen',
          ja: '右見て',
          ko: '오른쪽 봐요',
        },
        right: {
          en: 'Right Flank towards Lala',
          de: 'Rechte Seite zu Lala zeigen',
          ja: '左見て',
          ko: '왼쪽 봐요',
        },
      },
    },
    {
      id: 'AAI Lala Strategic Strike',
      type: 'StartsUsing',
      netRegex: { id: '88AD', source: 'Lala' },
      response: Responses.tankBuster(),
    },
    // Poshiume: https://twitter.com/posiumesan/status/1719545249302008122
    // Hamukatsu: https://youtu.be/QqLg3DXxCVA?t=298
    {
      id: 'AAI Lala Planar Tactics',
      type: 'GainsEffect',
      // E8B Surge Vector
      // E8C Subtractive Suppressor Alpha
      netRegex: { effectId: ['E8B', 'E8C'], source: 'Lala' },
      condition: (data, matches) => {
        data.lalaAlphaGains.push(matches);
        return data.lalaAlphaGains.length === 6;
      },
      durationSeconds: 10,
      suppressSeconds: 999999,
      infoText: (data, _matches, output) => {
        const strat = data.triggerSetConfig.planarTacticsType;
        const stacks = data.lalaAlphaGains.filter((x) => x.effectId === 'E8B').map((x) => x.target);
        const nums = data.lalaAlphaGains.filter((x) => x.effectId === 'E8C');
        const mystr = nums.find((x) => x.target === data.me)?.count;
        if (mystr === undefined)
          return;
        const mycnt = parseInt(mystr);
        if (stacks.length !== 2 || nums.length !== 4 || strat === 'count')
          return output.count({ num: mycnt });
        if (data.triggerSetConfig.planarTacticsType === 'poshiume') {
          const [s1, s2] = stacks;
          let issame;
          if (s1 === undefined || s2 === undefined)
            issame = false;
          else {
            const dps1 = data.party.isDPS(s1);
            const dps2 = data.party.isDPS(s2);
            issame = (dps1 && dps2) || (!dps1 && !dps2);
          }
          if (mycnt === 1)
            return issame ? output.poshiume1in() : output.poshiume1out();
          if (mycnt === 2) {
            if (issame)
              return output.poshiume2out();
            const pair = nums.find((x) => parseInt(x.count) === 2 && x.target !== data.me);
            const name = pair === undefined ? output.unknown() : data.party.jobAbbr(pair.target);
            return output.poshiume2in({ name: name });
          }
          if (mycnt === 3)
            return issame ? output.poshiume3right() : output.poshiume3left();
        }
        if (data.triggerSetConfig.planarTacticsType === 'hamukatsu') {
          if (mycnt === 1)
            return output.hamukatsu1();
          if (mycnt === 3)
            return output.hamukatsu3();
          const partner = nums.find((x) => x.target !== data.me && parseInt(x.count) === 2);
          if (partner === undefined)
            return output.hamukatsu2({ partner: output.unknown() });
          const pname = data.party.jobAbbr(partner.target);
          const [s1, s2] = stacks;
          if (s1 === undefined || s2 === undefined)
            return output.hamukatsu2({ partner: pname });
          if (stacks.includes(data.me)) {
            const other = s1 === data.me ? s2 : s1;
            const surge = nums.find((x) => x.target === other);
            if (surge === undefined)
              return output.hamukatsu2({ partner: pname });
            const count = parseInt(surge.count);
            if (count === 1)
              return output.hamukatsu2left({ partner: pname });
            if (count === 3)
              return output.hamukatsu2right({ partner: pname });
          } else if (stacks.includes(partner.target)) {
            const other = s1 === partner.target ? s2 : s1;
            const surge = nums.find((x) => x.target === other);
            if (surge === undefined)
              return output.hamukatsu2({ partner: pname });
            const count = parseInt(surge.count);
            if (count === 1)
              return output.hamukatsu2right({ partner: pname });
            if (count === 3)
              return output.hamukatsu2left({ partner: pname });
          }
          const my = data.party.member(data.me);
          const pm = data.party.member(partner.target);
          return Autumn.jobPriority(my.jobIndex) < Autumn.jobPriority(pm.jobIndex)
            ? output.hamukatsu2left({ partner: pname })
            : output.hamukatsu2right({ partner: pname });
        }
      },
      run: (data) => data.lalaAlphaGains = [],
      outputStrings: {
        count: {
          en: '${num}',
          ja: 'カウント: ${num}',
          ko: '번호: ${num}',
        },
        poshiume1out: {
          en: '1 Outside',
          ja: '1外、3とペア',
          ko: '[1/바깥] 3번과 페어',
        },
        poshiume1in: {
          en: '1 Inside',
          ja: '1内、2とペア',
          ko: '[1/안쪽] 2번과 페어',
        },
        poshiume2out: {
          en: '2 Outside',
          ja: '2外、1・3とペア',
          ko: '[2/바깥] 1,3번과 페어',
        },
        poshiume2in: {
          en: '2 Inside (w/ ${name})',
          ja: '2内、2とペア (${name})',
          ko: '[2/안쪽] 2번과 페어 (${name})',
        },
        poshiume3left: {
          en: '3 Left',
          ja: '3左から、1とペア',
          ko: '[3/아래줄 왼쪽] 1번과 페어',
        },
        poshiume3right: {
          en: '3 Right',
          ja: '3右から、2とペア',
          ko: '[3/아래줄 오른쪽] 2번과 페어',
        },
        hamukatsu1: {
          en: '1',
          ja: '1、2とペア',
          ko: '[1] 2번과 페어',
        },
        hamukatsu2: {
          en: '2 (${partner})',
          ja: '2、1・3とペア (${partner})',
          ko: '[2] 1,3번과 페어 (${partner})',
        },
        hamukatsu2left: {
          en: '2 Left (${partner})',
          ja: '2左、3とペア (${partner})',
          ko: '[❰❰🡸2] 3번과 페어 (${partner})',
        },
        hamukatsu2right: {
          en: '2 Right (${partner})',
          ja: '2右、1とペア (${partner})',
          ko: '[2🡺❱❱] 1번과 페어 (${partner})',
        },
        hamukatsu3: {
          en: '3',
          ja: '3、2とペア',
          ko: '[3] 2번과 페어',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Lala Forward March',
      type: 'GainsEffect',
      // E83 = Forward March
      netRegex: { effectId: 'E83', source: 'Lala' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 7,
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.lalaMyRotation === undefined || data.lalaMyTimes === undefined)
          return;
        if (isReverseRotate(data.lalaMyRotation, data.lalaMyTimes))
          return output.left();
        return output.right();
      },
      run: (data) => {
        delete data.lalaMyRotation;
        delete data.lalaMyTimes;
      },
      outputStrings: {
        left: {
          en: 'Leftward March',
          de: 'Linker March',
          ja: '強制移動 : 左',
          ko: '강제이동: 왼쪽',
        },
        right: {
          en: 'Rightward March',
          de: 'Rechter March',
          ja: '強制移動 : 右',
          ko: '강제이동: 오른쪽',
        },
      },
    },
    {
      id: 'AAI Lala Spatial Tactics',
      type: 'GainsEffect',
      // E8D Subtractive Suppressor Beta
      netRegex: { effectId: 'E8D', source: 'Lala' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 20,
      infoText: (_data, matches, output) => {
        const num = parseInt(matches.count);
        if (num < 1 || num > 4)
          return;
        return output[`num${num}`]();
      },
      outputStrings: {
        num1: {
          en: 'One (avoid all)',
          de: 'Eins (alles ausweichen)',
          ja: '[1]',
          ko: '[1] 구슬 쪽 🔜 다 피해욧',
        },
        num2: {
          en: 'Two (stay middle)',
          de: 'Zwei (steh in der Mitte)',
          ja: '[2]',
          ko: '[2] 구슬 쪽 🔜 한번 맞아요',
        },
        num3: {
          en: 'Three (adjacent to middle)',
          de: 'Drei (steh neben der Mitte)',
          ja: '[3]',
          ko: '[3] 구슬 없는쪽 🔜 두번 맞아요',
        },
        num4: {
          en: 'Four',
          de: 'Vier',
          ja: '[4]',
          ko: '[4] 구슬 없는쪽 🔜 세번 맞아요',
        },
      },
    },
    {
      id: 'AAI Lala Arcane Plot',
      type: 'StartsUsing',
      netRegex: { id: '88A2', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Find outside adds!',
          ja: 'マップの外にウッドゴーレム！',
          ko: '바깥 쫄 있는데가 북쪽!',
        },
      },
    },
    {
      id: 'AAI Lala Arcane Point',
      type: 'StartsUsing',
      netRegex: { id: '88A5', source: 'Lala', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.lalaAlphaGains = [],
      outputStrings: {
        text: {
          en: 'Spread!',
          ja: '散会！',
          ko: '자기 자리로 흩어져요!',
        },
      },
    },
    {
      id: 'AAI Lala Arcane Point Spread',
      type: 'GainsEffect',
      // B7D Magic Vulnerability Up (여기서는 1.96임)
      netRegex: { effectId: 'B7D', source: 'Lala' },
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return;
        return parseFloat(matches.duration) > 1.9;
      },
      response: Responses.spread('alert'),
    },
    {
      id: 'AAI Lala Arcane Point Stack',
      type: 'GainsEffect',
      // B7D Magic Vulnerability Up (여기서는 1.0임)
      netRegex: { effectId: 'B7D', source: 'Lala' },
      condition: (data, matches) => {
        if (data.me !== matches.target)
          return;
        const duration = parseFloat(matches.duration);
        return duration > 0.99 && duration < 1.9;
      },
      response: Responses.pairStack(),
    },
    // ---------------- statice ----------------
    {
      id: 'AAI Statice Aero IV',
      type: 'StartsUsing',
      netRegex: { id: '8949', source: 'Statice', capture: false },
      response: Responses.aoe('alert'),
    },
    {
      id: 'AAI Statice Trick Reload',
      type: 'StartsUsing',
      netRegex: { id: '894A', source: 'Statice', capture: false },
      run: (data) => {
        data.stcReloads = 0;
        data.stcMisload = 0;
      },
    },
    {
      id: 'AAI Statice Locked and Loaded',
      type: 'Ability',
      netRegex: { id: '8925', source: 'Statice', capture: false },
      preRun: (data) => {
        if (data.stcReloads === 0)
          data.stcStackSpread = false;
        data.stcReloads++;
      },
      infoText: (data, _matches, output) => {
        if (data.stcReloads === 1)
          return output.spread();
      },
      outputStrings: {
        spread: {
          en: '(Spread, for later)',
          ja: '(後で散会)',
          ko: '(먼저 흩어져요)',
        },
      },
    },
    {
      id: 'AAI Statice Misload',
      type: 'Ability',
      netRegex: { id: '8926', source: 'Statice', capture: false },
      preRun: (data) => {
        if (data.stcReloads === 0)
          data.stcStackSpread = true;
        if (data.stcReloads < 7)
          data.stcMisload = data.stcReloads;
        data.stcReloads++;
      },
      infoText: (data, _matches, output) => {
        if (data.stcReloads === 1)
          return output.stacks();
        if (data.stcReloads < 8) {
          const arrow = diceToArrow(data.stcMisload);
          return output.text({ safe: data.stcMisload, arrow: arrow });
        }
      },
      outputStrings: {
        text: {
          en: '(${safe}${arrow}, for later)',
          ja: '(安置: ${safe}${arrow})',
          ko: '(안전: ${safe}${arrow})',
        },
        stacks: {
          en: '(Stack, for later)',
          ja: '(後で頭割り)',
          ko: '(먼저 뭉쳐요)',
        },
      },
    },
    {
      id: 'AAI Statice Trapshooting 1',
      type: 'StartsUsing',
      netRegex: { id: '8D1A', source: 'Statice', capture: false },
      alertText: (data, _matches, output) => {
        if (data.stcStackSpread)
          return output.stacks();
        return output.spread();
      },
      run: (data) => data.stcStackSpread = !data.stcStackSpread,
      outputStrings: {
        stacks: Outputs.getTogether,
        spread: Outputs.spread,
      },
    },
    {
      id: 'AAI Statice Trapshooting 2',
      type: 'StartsUsing',
      netRegex: { id: '8959', source: 'Statice', capture: false },
      alertText: (data, _matches, output) => {
        if (data.stcMarch !== undefined) {
          const march = marchMove(output, data.stcMarch, data.stcStackSpread);
          delete data.stcMarch;
          return march;
        }
        return data.stcStackSpread ? output.stacks() : output.spread();
      },
      run: (data) => data.stcStackSpread = !data.stcStackSpread,
      outputStrings: {
        ...MarchMoveStrings,
      },
    },
    {
      id: 'AAI Statice Trigger Happy',
      type: 'StartsUsing',
      netRegex: { id: '894B', source: 'Statice', capture: false },
      infoText: (data, _matches, output) => {
        const arrow = diceToArrow(data.stcMisload);
        return output.text({ safe: data.stcMisload, arrow: arrow });
      },
      outputStrings: {
        text: {
          en: 'Safe: ${safe}${arrow}',
          ja: '安置: ${safe}${arrow}',
          ko: '안전: ${safe}${arrow}',
        },
      },
    },
    {
      id: 'AAI Statice Ring a Ring o\' Explosions',
      type: 'StartsUsing',
      netRegex: { id: '895C', source: 'Statice', capture: false },
      durationSeconds: 6,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          move1: {
            en: 'Avoid Bomb!',
            ja: '爆弾回避！',
            ko: '폭탄 피해요!',
          },
          move2: {
            en: 'Remember Bomb position!',
            ja: '爆弾の位置をおぼえて！',
            ko: '폭탄 위치 기억! 빙글빙글!',
          },
          move3: {
            en: 'Avoid Bomb!',
            ja: '爆弾回避！',
            ko: '폭탄없는 안전한 곳 찾아요!',
          },
          move4: {
            en: 'Safe: ${mesg}',
            ja: '安置: ${mesg}',
            ko: '안전: ${mesg}',
          },
          mesg4: {
            en: '${safe}${arrow}, avoid donuts',
            ja: '${safe}${arrow}へ、ドーナツ回避',
            ko: '${safe}${arrow}, 도넛 조심!',
          },
          ...MarchMoveStrings,
        };
        data.stcRingRing++;
        if (data.stcRingRing === 1)
          return { infoText: output.move1() };
        if (data.stcRingRing === 2)
          return { infoText: output.move2() };
        if (data.stcRingRing === 3)
          return { infoText: output.move3() };
        if (data.stcRingRing === 4) {
          const arrow = diceToArrow(data.stcMisload);
          const mesg4 = output.mesg4({ safe: data.stcMisload, arrow: arrow });
          if (data.stcMarch === undefined || data.stcDuration > 40) // 51초는 나중에 트랩슈팅2
            return { alertText: output.move4({ mesg: mesg4 }) };
          const march = marchMove(output, data.stcMarch, false, mesg4);
          delete data.stcMarch;
          return { alertText: march };
        }
      },
    },
    {
      id: 'AAI Statice Dartboard of Dancing Explosives',
      type: 'Ability',
      netRegex: { id: '8CBD', source: 'Statice', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Go to safe zone',
          ja: 'ボムを回避しに安置へ',
          ko: '폭탄 피해서 안전한 곳으로',
        },
      },
    },
    {
      id: 'AAI Statice Bull\'s-eye Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'E9E' },
      run: (data, matches) => data.stcBullsEyes.push(matches.target),
    },
    {
      id: 'AAI Statice Bull\'s-eye 1',
      type: 'GainsEffect',
      netRegex: { effectId: 'E9E' },
      condition: (data) => !data.stcSeenPinwheeling,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.blue();
        if (data.role === 'healer')
          return output.yellow();
        const members = data.party.members(data.stcBullsEyes);
        const dps = members.filter((x) => x.role === 'dps');
        if (dps.length === 1)
          return output.red();
        const roles = members.map((x) => x.role);
        if (roles.includes('healer'))
          return output.redBlue();
        return output.redYellow();
      },
      run: (data) => data.stcBullsEyes = [],
      outputStrings: {
        blue: {
          en: 'Go to Blue',
          ja: '青へ',
          ko: '🟦파랑 밟아요',
        },
        yellow: {
          en: 'Go to Yellow',
          ja: '黄色へ',
          ko: '🟨노랑 밟아요',
        },
        red: {
          en: 'Go to Red',
          ja: '赤へ',
          ko: '🟥빨강 밟아요',
        },
        redBlue: {
          en: 'Go to Red (or Blue)',
          ja: '赤へ (または青)',
          ko: '🟥빨강(아니면 🟦파랑) 밟아요',
        },
        redYellow: {
          en: 'Go to Red (or Yellow)',
          ja: '赤へ (または黄色)',
          ko: '🟥빨강(아니면 🟨노랑) 밟아요',
        },
      },
    },
    {
      id: 'AAI Statice Pop',
      type: 'StartsUsing',
      netRegex: { id: '894E', source: 'Statice', capture: false },
      suppressSeconds: 10,
      alertText: (data, _matches, output) => {
        const safe = data.stcMisload;
        if (safe === 0)
          return output.knockback();
        const arrow = diceToArrow(data.stcMisload);
        return output.knockbackSafe({ safe: safe, arrow: arrow });
      },
      outputStrings: {
        knockback: Outputs.knockback,
        knockbackSafe: {
          en: 'Knockback to ${safe}${arrow}',
          ja: 'へノックバック (${safe}${arrow})',
          ko: '넉백! (${safe}${arrow})',
        },
      },
    },
    {
      id: 'AAI Statice Pop Trapshooting',
      type: 'StartsUsing',
      netRegex: { id: '894E', source: 'Statice', capture: false },
      delaySeconds: 3,
      durationSeconds: 8,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        if (data.stcStackSpread)
          return output.out();
        return output.in();
      },
      outputStrings: {
        in: {
          en: 'Middle => Spread outside',
          ja: '真ん中 => 外側で散会',
          ko: '한가운데로 (바깥으로 흩어질꺼임)',
        },
        out: {
          en: 'Out => Stack in middle',
          ja: '外 => 真ん中で頭割り',
          ko: '바깥으로 (한가운데서 뭉칠꺼임)',
        },
      },
    },
    {
      id: 'AAI Statice Face',
      type: 'GainsEffect',
      netRegex: { effectId: ['DD2', 'DD3', 'DD4', 'DD5'] },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        const marchMap = {
          DD2: 'front',
          DD3: 'back',
          DD4: 'left',
          DD5: 'right',
        };
        data.stcMarch = marchMap[matches.effectId];
        data.stcDuration = parseFloat(matches.duration);
      },
    },
    {
      id: 'AAI Statice Surprising Claw',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Surprising Claw' },
      condition: (data, matches) => {
        data.stcClaws.push(matches.target);
        return data.stcClaws.length === 2;
      },
      infoText: (data, _matches, output) => {
        if (!data.stcClaws.includes(data.me))
          return;
        const partner = data.stcClaws[data.stcClaws[0] !== data.me ? 0 : 1];
        return output.text({
          partner: partner !== undefined ? data.party.jobAbbr(partner) : output.unknown(),
        });
      },
      run: (data) => data.stcClaws = [],
      outputStrings: {
        text: {
          en: 'Death Claw on YOU! (w/ ${partner})',
          ja: '自分にクロウ (${partner})',
          ko: '내게 데스 손톱이! (${partner})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Statice Surprising Missile',
      type: 'Tether',
      netRegex: { id: '0011', source: 'Surprising Missile' },
      condition: (data, matches) => {
        data.stcMissiles.push(matches.target);
        return data.stcMissiles.length === 2;
      },
      infoText: (data, _matches, output) => {
        if (!data.stcMissiles.includes(data.me))
          return;
        const partner = data.stcMissiles[data.stcMissiles[0] !== data.me ? 0 : 1];
        return output.text({
          partner: partner !== undefined ? data.party.jobAbbr(partner) : output.unknown(),
        });
      },
      run: (data) => data.stcMissiles = [],
      outputStrings: {
        text: {
          en: 'Missile + Tether on YOU! (w/ ${partner})',
          ja: '自分にミサイル+チェイン (${partner})',
          ko: '미사일 + 체인, 한가운데로! (${partner})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'AAI Statice Shocking Abandon',
      type: 'StartsUsing',
      netRegex: { id: '8948', source: 'Statice' },
      response: Responses.tankBuster(),
    },
    {
      id: 'AAI Statice Pinwheeling Dartboard',
      type: 'Ability',
      netRegex: { id: '8CBC', source: 'Statice', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      run: (data) => data.stcSeenPinwheeling = true,
      outputStrings: {
        text: {
          en: 'Find the angular point!',
          ja: '北を特定して！',
          ko: '꼭지점 찾아요!',
        },
      },
    },
    {
      id: 'AAI Statice Pinwheeling Dartboard Color',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '12507' },
      infoText: (_data, matches, output) => {
        const centerX = -200;
        const centerY = 0;
        const x = parseFloat(matches.x) - centerX;
        const y = parseFloat(matches.y) - centerY;
        // 12 pie slices, the edge of the first one is directly north.
        // It goes in B R Y order repeating 4 times.
        // The 0.5 subtraction (12 - 0.5 = 11.5) is because the Homing Pattern
        // lands directly in the middle of a slice.
        const dir12 = Math.round(6 - 6 * Math.atan2(x, y) / Math.PI + 11.5) % 12;
        const colorOffset = dir12 % 3;
        const colorMap = {
          0: 'blue',
          1: 'red',
          2: 'yellow',
        };
        const color = colorMap[colorOffset];
        if (color !== undefined)
          return output[color]();
      },
      outputStrings: {
        blue: {
          en: 'Avoid Blue',
          ja: '玉は青',
          ko: '🟦파랑에 구슬',
        },
        red: {
          en: 'Avoid Red',
          ja: '玉は赤',
          ko: '🟥빨강에 구슬',
        },
        yellow: {
          en: 'Avoid Yellow',
          ja: '玉は黄色',
          ko: '🟨노랑에 구슬',
        },
      },
    },
    {
      id: 'AAI Statice Ball of Fire Rotation',
      type: 'HeadMarker',
      netRegex: { id: ['009C', '009D'] },
      durationSeconds: 13,
      infoText: (_data, matches, output) => {
        if (matches.id === '009C')
          return output.clock();
        return output.counter();
      },
      outputStrings: {
        clock: {
          en: '⤾Clockwise',
          ja: '⤾時計',
          ko: '⤾시계 회전',
        },
        counter: {
          en: '⤿Counter Clockwise',
          ja: '⤿反時計',
          ko: '⤿반시계 회전',
        },
      },
    },
    {
      id: 'AAI Statice Burning Chains',
      type: 'HeadMarker',
      netRegex: { id: '0061' },
      condition: (data, matches) => {
        data.stcChains.push(matches.target);
        return data.stcChains.length === 2;
      },
      alertText: (data, _matches, output) => {
        if (!data.stcChains.includes(data.me))
          return;
        const partner = data.stcChains[data.stcChains[0] !== data.me ? 0 : 1];
        return output.text({
          partner: partner !== undefined ? data.party.jobAbbr(partner) : output.unknown(),
        });
      },
      run: (data) => data.stcChains = [],
      outputStrings: {
        text: {
          en: 'Tether on YOU! (w/ ${partner})',
          ja: '自分にチェイン (${partner})',
          ko: '내게 체인! (${partner})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      // Pino: https://twitter.com/pino_mujuuryoku/status/1720127076190306359
      // Spell: https://twitter.com/spell_ff14/status/1720068760068120970
      id: 'AAI Statice Break Burning Chains',
      type: 'Tether',
      netRegex: { id: '0009' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cutchain: {
            en: 'Break Tether!',
            ja: 'チェイン切る',
            ko: '체인 끊어요!',
          },
          deathclaw: {
            en: 'Bait Claw => Stack',
            ja: 'クロウ誘導 => 頭割り',
            ko: '데스 손톱 유도 🔜 뭉쳐요',
          },
          pinoAdjust: {
            en: 'Pair! (Adjust)',
            ja: '北へ！ 席入れ替え',
            ko: '북으로! 자리 조정 페어!',
          },
          pinoStacks: {
            en: 'Pair!',
            ja: '北へ',
            ko: '북으로! 조정없이 페어',
          },
          spellStacks: {
            en: 'Pair!',
            ja: '北へ',
            ko: '북으로! 페어',
          },
          spellLeft: {
            en: 'Pair and left (w/ ${partner})',
            ja: '北の左へ (${partner})',
            ko: '북으로! 페어 왼쪽 (${partner})',
          },
          spellRight: {
            en: 'Pair and right (w/ ${partner})',
            ja: '北の右へ (${partner})',
            ko: '북으로! 페어 오른쪽 (${partner})',
          },
          stacks: Outputs.pairStack,
          unknown: Outputs.unknown,
        };
        if (data.me === matches.source || data.me === matches.target)
          return { alarmText: output.cutchain() };
        if (!data.stcSeenPinwheeling)
          return { alertText: output.deathclaw() };
        if (data.triggerSetConfig.pinwheelingType === 'stack')
          return { infoText: output.stacks() };
        if (data.triggerSetConfig.pinwheelingType === 'pino') {
          const members = data.party.members(data.stcBullsEyes);
          const roles = members.map((x) => x.role);
          const dps = roles.filter((x) => x === 'dps');
          if (dps.length === 2)
            return { alertText: output.pinoAdjust() };
          const th = roles.filter((x) => x === 'tank' || x === 'healer');
          if (th.length === 2)
            return { alertText: output.pinoAdjust() };
          return { infoText: output.pinoStacks() };
        }
        if (data.triggerSetConfig.pinwheelingType === 'spell') {
          if (data.stcBullsEyes.length !== 2)
            return { infoText: output.spellStacks() };
          const members = data.party.members(data.stcBullsEyes);
          const other = members[members[0]?.name === data.me ? 1 : 0];
          if (other === undefined)
            return { infoText: output.spellStacks() };
          const chains = data.stcChains;
          if (chains.includes(other.name)) {
            const partner = data.party.partyNames.find((x) => x !== data.me && !chains.includes(x));
            if (partner === undefined)
              return { alertText: output.spellLeft({ partner: output.unknown() }) };
            return { alertText: output.spellLeft({ partner: data.party.jobAbbr(partner) }) };
          }
          const myprior = Autumn.jobPriority(data.party.jobIndex(data.me));
          const otherprior = Autumn.jobPriority(other.jobIndex);
          return myprior < otherprior
            ? { alertText: output.spellLeft({ partner: data.party.jobAbbr(other.name) }) }
            : { alertText: output.spellRight({ partner: data.party.jobAbbr(other.name) }) };
        }
      },
      run: (data) => {
        data.stcChains = [];
        data.stcBullsEyes = [];
      },
    },
  ],
  timelineReplace: [
    {
      locale: 'en',
      replaceText: {
        'Far Tide/Near Tide': 'Far/Near Tide',
        'Hydrobullet/Hydrofall': 'Hydrobullet/fall',
        'Hydrofall/Hydrobullet': 'Hydrofall/bullet',
        'Receding Twintides/Encroaching Twintides': 'Receding/Encroaching Twintides',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Aloalo Golem': 'Aloalo-Holzgolem',
        'Aloalo Islekeeper': 'Aloalo-Wächter',
        'Aloalo Kiwakin': 'Aloalo-Kiwakin',
        'Aloalo Monk': 'Aloalo-Mönch',
        'Aloalo Ray': 'Aloalo-Rochen',
        'Aloalo Snipper': 'Aloalo-Schnippler',
        'Aloalo Wood Golem': 'Aloalo-Holzgolem',
        'Aloalo Zaratan': 'Aloalo-Zaratan',
        'Arcane Font': 'arkan(?:e|er|es|en) Körper',
        'Arcane Globe': 'arkan(?:e|er|es|en) Kugel',
        'Ball of Fire': 'Feuerkugel',
        'Bomb': 'Bombe',
        'Ketuduke': 'Ketuduke',
        'Lala': 'Lala',
        'Needle': 'Nadel',
        'Spring Crystal': 'Wasserquell-Kristall',
        'Statice': 'Statice',
        'Surprising Claw': 'Überraschungsklaue',
        'Surprising Missile': 'Überraschungsrakete',
        'Surprising Staff': 'Überraschungsstab',
        'The Dawn Trial': 'Morgenrot-Probe',
        'The Dusk Trial': 'Abendrot-Probe',
        'The Midnight Trial': 'Vollmond-Probe',
      },
      'replaceText': {
        '\\(buff\\)': '(Statusveränderung)',
        '\\(cast\\)': '(wirken)',
        'Aero II': 'Windra',
        'Aero IV': 'Windka',
        'Analysis': 'Analyse',
        'Angry Seas': 'Zornige Fluten',
        'Angular Addition': 'Winkeladdition',
        'Arcane Array': 'Arkanes Spektrum',
        'Arcane Blight': 'Arkane Fäule',
        'Arcane Mine': 'Arkane Mine',
        'Arcane Plot': 'Arkane Flur',
        'Arcane Point': 'Arkane Stätte',
        'Beguiling Glitter': 'Irrleuchten',
        'Blowing Bubbles': 'Pusteblasen',
        'Bright Pulse': 'Glühen',
        'Bubble Net': 'Blasennetz',
        'Burning Chains': 'Brennende Ketten',
        'Burst': 'Explosion',
        'Constructive Figure': 'Ruf der Schöpfer',
        'Dartboard of Dancing Explosives': 'Darts und Drehung',
        'Encroaching Twintides': 'Ring der Zwiegezeiten',
        'Explosive Theorem': 'Arkane Fäule',
        'Faerie Ring': 'Feenring',
        'Far Tide': 'Ring der Gezeiten',
        'Fire Spread': 'Brandstiftung',
        'Fireworks': 'Feuerwerk',
        'Fluke Gale': 'Flossensturm',
        'Fluke Typhoon': 'Flossentaifun',
        'Hundred Lashings': 'Auspeitschung',
        'Hydrobomb': 'Hydro-Bombe',
        'Hydrobullet': 'Hydro-Kugel',
        'Hydrofall': 'Hydro-Sturz',
        'Inferno Divide': 'Infernale Teilung',
        'Inferno Theorem': 'Infernales Theorem',
        'Locked and Loaded': 'Geladen und entsichert',
        'Misload': 'Fehlladung',
        'Near Tide': 'Kreis der Gezeiten',
        'Pinwheeling Dartboard': 'Darts und Rad',
        'Planar Tactics': 'Flächentaktiken',
        'Pop': 'Platzen',
        'Powerful Light': 'Entladenes Licht',
        'Present Box': 'Geschenkschachtel',
        'Radiance': 'Radiation',
        'Receding Twintides': 'Kreis der Zwiegezeiten',
        'Ring a Ring o\' Explosions': 'Ringel-Ringel-Bombe',
        '(?<! )Roar': 'Brüllen',
        'Saturate': 'Wasserfontäne',
        'Shocking Abandon': 'Schockende Hingabe',
        'Spatial Tactics': 'Raumtaktiken',
        'Sphere Shatter': 'Sphärensplitterung',
        'Spring Crystals': 'Quellkristalle',
        'Strategic Strike': 'Schwere Attacke',
        'Strewn Bubbles': 'Streublasen',
        'Surprise Balloon': 'Überraschungsballon',
        'Surprise Needle': 'Überraschungsnadel',
        'Symmetric Surge': 'Symmetrischer Schub',
        'Targeted Light': 'Gezieltes Licht',
        'Telluric Theorem': 'Tellurisches Theorem',
        'Tidal Roar': 'Schrei der Gezeiten',
        'Trapshooting': 'Tontaubenschuss',
        'Trick Reload': 'Trickladung',
        'Trigger Happy': 'Schießwut',
        'Uncommon Ground': 'Voll ins Schwarze',
        'Updraft': 'Aufwind',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Aloalo Golem': 'golem sylvestre d\'Aloalo',
        'Aloalo Islekeeper': 'gardien d\'Aloalo',
        'Aloalo Kiwakin': 'kiwakin d\'Aloalo',
        'Aloalo Monk': 'moine d\'Aloalo',
        'Aloalo Ray': 'raie rayée d\'Aloalo',
        'Aloalo Snipper': 'cisailleur d\'Aloalo',
        'Aloalo Wood Golem': 'golem sylvestre d\'Aloalo',
        'Aloalo Zaratan': 'zaratan d\'Aloalo',
        'Arcane Font': 'sphère arcanique',
        'Arcane Globe': 'globe arcanique',
        'Ball of Fire': 'orbe de feu',
        'Bomb': 'bombe',
        'Ketuduke': 'Ketuduke',
        'Lala': 'Lala',
        'Needle': 'aiguille',
        'Spring Crystal': 'cristal de source',
        'Statice': 'Statice',
        'Surprising Claw': 'griffe surprise',
        'Surprising Missile': 'missile surprise',
        'Surprising Staff': 'sceptre surprise',
        'The Dawn Trial': 'Épreuve de Dilumu',
        'The Dusk Trial': 'Épreuve de Qurupe',
        'The Midnight Trial': 'Épreuve de Nokosero',
      },
      'replaceText': {
        '\\(buff\\)': '(Buff)',
        '\\(cast\\)': '(Incantation)',
        'Aero II': 'Extra Vent',
        'Aero IV': 'Giga Vent',
        'Analysis': 'Analyse',
        'Angry Seas': 'Mer agitée',
        'Angular Addition': 'Calcul angulaire',
        'Arcane Array': 'Assemblement arcanique',
        'Arcane Blight': 'Canon arcanique',
        'Arcane Mine': 'Mine arcanique',
        'Arcane Plot': 'Modulateur arcanique',
        'Arcane Point': 'Pointe arcanique',
        'Beguiling Glitter': 'Paillettes aveuglantes',
        'Blowing Bubbles': 'Bulles soufflées',
        'Bright Pulse': 'Éclat',
        'Bubble Net': 'Filet de bulles',
        'Burning Chains': 'Chaînes brûlantes',
        'Burst': 'Explosion',
        'Constructive Figure': 'Icône articulée',
        'Dartboard of Dancing Explosives': 'Duo fléchettes-tourbillon',
        'Encroaching Twintides': 'Double marée débordante',
        'Explosive Theorem': 'Théorème explosif',
        'Faerie Ring': 'Cercle féérique',
        'Far Tide': 'Marée lointaine',
        'Fire Spread': 'Nappe de feu',
        'Fireworks': 'Feu d\'artifice',
        'Fluke Gale': 'Bourrasque hasardeuse',
        'Fluke Typhoon': 'Typhon hasardeux',
        'Hundred Lashings': 'Cent coups de fouet',
        'Hydrobomb': 'Hydrobombe',
        'Hydrobullet': 'Barillet hydrique',
        'Hydrofall': 'Pilonnage hydrique',
        'Inferno Divide': 'Division infernale',
        'Inferno Theorem': 'Théorème infernal',
        'Locked and Loaded': 'Rechargement réussi',
        'Misload': 'Rechargement raté',
        'Near Tide': 'Marée proche',
        'Pinwheeling Dartboard': 'Duo fléchettes-moulinette',
        'Planar Tactics': 'Tactique planaire',
        'Pop': 'Rupture',
        'Powerful Light': 'Explosion sacrée',
        'Present Box': 'Boîtes cadeaux',
        'Radiance': 'Irradiation',
        'Receding Twintides': 'Double marée fuyante',
        'Ring a Ring o\' Explosions': 'Tempérament explosif',
        '(?<! )Roar': 'Rugissement',
        'Saturate': 'Jet d\'eau',
        'Shocking Abandon': 'Choc renonciateur',
        'Spatial Tactics': 'Tactique spatiale',
        'Sphere Shatter': 'Rupture glacée',
        'Spring Crystals': 'Cristaux de source',
        'Strategic Strike': 'Coup violent',
        'Strewn Bubbles': 'Bulles éparpillées',
        'Surprise Balloon': 'Ballons surprises',
        'Surprise Needle': 'Aiguille surprise',
        'Symmetric Surge': 'Déferlement symétrique',
        'Targeted Light': 'Rayon ciblé',
        'Telluric Theorem': 'Théorème tellurique',
        'Tidal Roar': 'Vague rugissante',
        'Trapshooting': 'Tir au pigeon',
        'Trick Reload': 'Rechargement habile',
        'Trigger Happy': 'Gâchette impulsive',
        'Uncommon Ground': 'Terrain de mésentente',
        'Updraft': 'Courants ascendants',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Aloalo Golem': 'アロアロ・ウッドゴーレム',
        'Aloalo Islekeeper': 'アロアロ・キーパー',
        'Aloalo Kiwakin': 'アロアロ・キワキン',
        'Aloalo Monk': 'アロアロ・モンク',
        'Aloalo Ray': 'アロアロ・ストライプレイ',
        'Aloalo Snipper': 'アロアロ・スニッパー',
        'Aloalo Wood Golem': 'アロアロ・ウッドゴーレム',
        'Aloalo Zaratan': 'アロアロ・ザラタン',
        'Arcane Font': '立体魔法陣',
        'Arcane Globe': '球体魔法陣',
        'Ball of Fire': '火球',
        'Bomb': '爆弾',
        'Ketuduke': 'ケトゥドゥケ',
        'Lala': 'ララ',
        'Needle': 'ニードル',
        'Spring Crystal': '湧水のクリスタル',
        'Statice': 'スターチス',
        'Surprising Claw': 'サプライズ・クロー',
        'Surprising Missile': 'サプライズ・ミサイル',
        'Surprising Staff': 'サプライズ・ロッド',
        'The Dawn Trial': 'ディルムの試練',
        'The Dusk Trial': 'クルペの試練',
        'The Midnight Trial': 'ノコセロの試練',
      },
      'replaceText': {
        '\\(buff\\)': '(バフ)',
        '\\(cast\\)': '(詠唱)',
        'Aero II': 'エアロラ',
        'Aero IV': 'エアロジャ',
        'Analysis': 'アナライズ',
        'Angry Seas': 'アングリーシーズ',
        'Angular Addition': '回転角乗算',
        'Arcane Array': '複合魔紋',
        'Arcane Blight': '魔紋砲',
        'Arcane Mine': '地雷魔紋',
        'Arcane Plot': '変光魔紋',
        'Arcane Point': '変光起爆',
        'Beguiling Glitter': '惑わしの光',
        'Blowing Bubbles': 'バブルブロワー',
        'Bright Pulse': '閃光',
        'Bubble Net': 'バブルネットフィーディング',
        'Burning Chains': '炎の鎖',
        'Burst': '爆発',
        'Constructive Figure': '人形召喚',
        'Dartboard of Dancing Explosives': 'ダーツ＆ローテーション',
        'Encroaching Twintides': 'リング・ダブルタイド',
        'Explosive Theorem': '魔爆法',
        'Faerie Ring': 'フェアリーリング',
        'Far Tide': 'リングタイド',
        'Fire Spread': '放火',
        'Fireworks': 'ファイアワークフェスティバル',
        'Fluke Gale': 'フリッパーゲイル',
        'Fluke Typhoon': 'フリッパータイフーン',
        'Hundred Lashings': 'めった打ち',
        'Hydrobomb': 'ハイドロボム',
        'Hydrobullet': 'ハイドロバレット',
        'Hydrofall': 'ハイドロフォール',
        'Inferno Divide': '十火法',
        'Inferno Theorem': '散火法',
        'Locked and Loaded': 'リロード成功',
        'Misload': 'リロード失敗',
        'Near Tide': 'ラウンドタイド',
        'Pinwheeling Dartboard': 'ダーツ＆ウィール',
        'Planar Tactics': '爆雷戦術：面',
        'Pop': '破裂',
        'Powerful Light': '光爆',
        'Present Box': 'プレゼントボックス',
        'Radiance': '光球爆散',
        'Receding Twintides': 'ラウンド・ダブルタイド',
        'Ring a Ring o\' Explosions': 'リンクリンクボム',
        '(?<! )Roar': '咆哮',
        'Saturate': '放水',
        'Shocking Abandon': 'アバンドンショック',
        'Spatial Tactics': '爆雷戦術：立体',
        'Sphere Shatter': '破裂',
        'Spring Crystals': '湧水のクリスタル',
        'Strategic Strike': '強撃',
        'Strewn Bubbles': 'バブルストゥルー',
        'Surprise Balloon': 'サプライズバルーン',
        'Surprise Needle': 'サプライズニードル',
        'Symmetric Surge': '双数爆撃',
        'Targeted Light': '高精度光弾',
        'Telluric Theorem': '地隆法',
        'Tidal Roar': 'タイダルロア',
        'Trapshooting': 'トラップシューティング',
        'Trick Reload': 'トリックリロード',
        'Trigger Happy': 'トリガーハッピー',
        'Uncommon Ground': 'グラウンドシアー',
        'Updraft': '上昇気流',
      },
    },
  ],
});
