Options.Triggers.push({
  id: 'TheMaskedCarnivale',
  zoneId: ZoneId.TheMaskedCarnivale,
  zoneLabel: {
    en: 'The Masked Carnivale',
    de: 'Die Große Maskerade',
    fr: 'Le carnaval masqué',
    ja: 'マスクド・カーニバル',
    cn: '假面狂欢',
    ko: '가면 무투회',
  },
  comments: {
    en: 'BLU Masked Carnivale Stages 1-32',
    de: 'BLU Große Maskerade Stufe 1-32',
    fr: 'MBU Carnival masqué Niveau 1-32',
    cn: '青魔法师假面狂欢关卡 1-32',
    ko: '청마도사 가면 무투회 스테이지 1-32',
  },
  triggers: [
    // ================ Stage 01 Act 1 ================
    // intentionally blank
    // ================ Stage 02 Act 1 ================
    // intentionally blank
    // ---------------- Stage 02 Act 2 ----------------
    // intentionally blank
    // ================ Stage 03 Act 1 ================
    {
      id: 'Carnivale S03 A1 Zipacna Obliterate',
      type: 'StartsUsing',
      netRegex: { id: '381D', source: 'Zipacna' },
      response: Responses.interrupt(),
    },
    // ================ Stage 04 Act 1 ================
    // intentionally blank
    // ---------------- Stage 04 Act 2 ----------------
    {
      id: 'Carnivale S04 A2 Kreios Magitek Field',
      type: 'StartsUsing',
      netRegex: { id: '3821', source: 'Kreios' },
      response: Responses.interrupt(),
    },
    // ================ Stage 05 Act 1 ================
    // intentionally blank
    // ================ Stage 06 Act 1 ================
    {
      id: 'Carnivale S06 A1-2 Blind Gain',
      // 23B = Blind (can't be hit by gaze attacks)
      type: 'GainsEffect',
      netRegex: { effectId: '23B' },
      condition: Conditions.targetIsYou(),
      preRun: (data) => data.blind = true,
    },
    {
      id: 'Carnivale S06 A1-2 Blind Lose',
      // 23B = Blind (can't be hit by gaze attacks)
      type: 'LosesEffect',
      netRegex: { effectId: '23B' },
      condition: Conditions.targetIsYou(),
      run: (data) => delete data.blind,
    },
    {
      id: 'Carnivale S06 A1-2 Arena Catoblepas Demon Eye',
      // if Blind then can't be hit by gaze attacks
      type: 'StartsUsing',
      netRegex: { id: '3963', source: 'Arena Catoblepas', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.blind)
          return output.lookAway();
      },
      outputStrings: {
        lookAway: Outputs.lookAway,
      },
    },
    // ---------------- Stage 06 Act 2 ----------------
    {
      id: 'Carnivale S06 A2 Arena Eye Dread Gaze',
      // if Blind then can't be hit by gaze attacks
      type: 'StartsUsing',
      netRegex: { id: '3966', source: 'Arena Eye', capture: false },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.blind)
          return output.lookAway();
      },
      outputStrings: {
        lookAway: Outputs.lookAway,
      },
    },
    // ================ Stage 07 Act 1 ================
    // intentionally blank
    // ---------------- Stage 07 Act 2 ----------------
    // intentionally blank
    // ---------------- Stage 07 Act 3 ----------------
    {
      id: 'Carnivale S07 A3 Gladiatorial Node Low Voltage',
      type: 'StartsUsing',
      netRegex: { id: '3976', source: 'Gladiatorial Node' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hide Behind Barricade',
          de: 'Hinter den Barrikaden verstecken',
          fr: 'Cachez-vous derrière la barricade',
          ja: '柵の後ろに',
          cn: '躲在墙后',
          ko: '울타리 뒤에 숨어요',
        },
      },
    },
    // ================ Stage 08 Act 1 ================
    // intentionally blank
    // ---------------- Stage 08 Act 2 ----------------
    {
      id: 'Carnivale S08 A2 Arena Progenitrix Burst',
      type: 'StartsUsing',
      netRegex: { id: '3958', source: 'Arena Progenitrix' },
      response: Responses.interrupt(),
    },
    // ================ Stage 09 Act 1 ================
    {
      id: 'Carnivale S09 A1 Guimauve Golden Tongue',
      type: 'StartsUsing',
      netRegex: { id: '37B9', source: 'Guimauve' },
      response: Responses.interrupt(),
    },
    // ================ Stage 10 Act 1 ================
    {
      id: 'Carnivale S10 A1 Crom Dubh King\'s Will',
      // if attempting The Harder They Fall achievement, do not interrupt this cast
      type: 'StartsUsing',
      netRegex: { id: '397F', source: 'Crom Dubh' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S10 A1 Crom Dubh Black Nebula',
      type: 'StartsUsing',
      netRegex: { id: '3984', source: 'Crom Dubh' },
      response: Responses.interrupt(),
    },
    // ================ Stage 11 Act 1 ================
    {
      id: 'Carnivale S11 A1-2 Arena Gas Bomb Fulmination',
      // Arena Gas Bombs (x2 Act 1, x4 Act 2) channel a long cast (22.7s) which is lethal if completed
      // this cast can be interrupted (immediate re-cast) by doing any damage to them; warn when this cast is about to finish
      // TODO: this trigger is janky; trigger can overlap from multiple targets in unintended ways,
      //   and trigger still fires if target dies
      type: 'StartsUsing',
      netRegex: { id: '38F7', source: 'Arena Gas Bomb' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      suppressSeconds: 5,
      response: Responses.stunOrInterruptIfPossible(),
    },
    // ---------------- Stage 11 Act 2 ----------------
    // intentionally blank
    // ================ Stage 12 Act 1 ================
    // intentionally blank
    // ---------------- Stage 12 Act 2 ----------------
    {
      id: 'Carnivale S12 A2 Hydnora Inflammable Fumes',
      type: 'StartsUsing',
      netRegex: { id: '39A1', source: 'Hydnora' },
      response: Responses.stun(),
    },
    {
      id: 'Carnivale S12 A2 Hydnora Spore Sac',
      // spawns several Arena Roselets which can be killed individually
      // or can use Ice Spikes to reflect their attacks and kill them all at once
      type: 'StartsUsing',
      netRegex: { id: '39A0', source: 'Hydnora', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Arena Roselets spawning!',
          de: 'Arena-Röslinge erscheinen!',
          fr: 'Roses d\'arène vient d\'apparaitre !',
          ja: 'アリーナ・ローズレットが出現！',
          cn: '正在生成 斗场小红花!',
          ko: '아레나 넝쿨장미가 나타났어요!',
        },
      },
    },
    // ================ Stage 13 Act 1 ================
    // intentionally blank
    // ---------------- Stage 13 Act 2 ----------------
    {
      id: 'Carnivale S13 A2 Carmilla Dark Sabbath',
      type: 'StartsUsing',
      netRegex: { id: '3A67', source: 'Carmilla', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'Carnivale S13 A2 Carmilla Summon Darkness',
      // add needs to be killed before Carmilla consumes it
      // if not killed in time, Carmilla gains a Damage Up buff and kills the player
      type: 'AddedCombatant',
      netRegex: { name: 'Arena Succubus' },
      infoText: (_data, matches, output) => output.kill({ name: matches.name }),
      outputStrings: {
        kill: {
          en: 'Kill ${name}',
          de: 'Besiege ${name}',
          fr: 'Tuez ${name}',
          ja: '${name}を倒す',
          cn: '击杀 ${name}',
          ko: '잡아요: ${name}',
        },
      },
    },
    {
      id: 'Carnivale S13 A2 Arena Succubus Beguiling Mist',
      type: 'StartsUsing',
      netRegex: { id: '3AC5', source: 'Arena Succubus' },
      response: Responses.interrupt(),
    },
    // ================ Stage 14 Act 1 ================
    {
      id: 'Carnivale S14 A1-2 Arena Jam The Last Song',
      type: 'StartsUsing',
      netRegex: { id: '39A4', source: 'Arena Jam' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Hide Behind Barricade',
          de: 'Hinter den Barrikaden verstecken',
          fr: 'Cachez-vous derrière la barricade',
          ja: '柵の後ろに',
          cn: '躲在墙后',
          ko: '울타리 뒤에 숨어요',
        },
      },
    },
    // ---------------- Stage 14 Act 2 ----------------
    // intentionally blank
    // ================ Stage 15 Act 1 ================
    {
      id: 'Carnivale S15 A1 Bestial Node High Voltage',
      type: 'StartsUsing',
      netRegex: { id: '3A2A', source: 'Bestial Node' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S15 A1 Arena Shabti Spawn',
      // Arena Shabti spawns with a Damage Up buff that makes its attacks very dangerous
      // can Sleep the Arena Shabti until the buff expires
      type: 'AddedCombatant',
      netRegex: { name: 'Arena Shabti' },
      alertText: (_data, matches, output) => output.sleep({ name: matches.name }),
      outputStrings: {
        sleep: Outputs.sleepTarget,
      },
    },
    {
      id: 'Carnivale S15 A1 Bestial Node Superstorm',
      type: 'StartsUsing',
      netRegex: { id: '3A7B', source: 'Bestial Node', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Carnivale S15 A1 Bestial Node Repelling Cannons',
      type: 'StartsUsing',
      netRegex: { id: '3A2C', source: 'Bestial Node', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Carnivale S15 A1 Bestial Node Ballast',
      type: 'StartsUsing',
      netRegex: { id: '3A2D', source: 'Bestial Node', capture: false },
      response: Responses.getBehind(),
    },
    // ================ Stage 16 Act 1 ================
    // intentionally blank
    // ---------------- Stage 16 Act 2 ----------------
    {
      id: 'Carnivale S16 A2 Tikbalang 10-tonze Slash',
      type: 'StartsUsing',
      netRegex: { id: '3A17', source: 'Tikbalang', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Carnivale S16 A2 Tikbalang 111-tonze Swing',
      type: 'StartsUsing',
      netRegex: { id: '3A18', source: 'Tikbalang', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Carnivale S16 A2 Tikbalang Cry of Rage',
      type: 'StartsUsing',
      netRegex: { id: '3A1B', source: 'Tikbalang', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'Carnivale S16 A2 Tikbalang 1111-tonze Swing',
      // Tikbalang casts The Bull's Voice (39BB) to give himself a Damage Up (122) buff,
      // then uses Predatorial Instinct (395D) to give the player an uncleansable Heavy (F0) and draw them in,
      // then begins casting 1111-tonze Swing (395E) which is lethal if not mitigated
      type: 'StartsUsing',
      netRegex: { id: '395E', source: 'Tikbalang', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Diamondback',
          de: 'Diamantrücken',
          fr: 'Dos de diamant',
          ja: '超硬化',
          cn: '超硬化',
          ko: '🔷다이아몬드백!',
        },
      },
    },
    {
      id: 'Carnivale S16 A2 Tikbalang Zoom In',
      type: 'StartsUsing',
      netRegex: { id: '3A19', source: 'Tikbalang', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Charge + knockback',
          de: 'Ansturm + Rückstoß',
          fr: 'Charge + Poussée',
          ja: '突進 + ノックバック',
          cn: '冲锋 + 击退',
          ko: '돌진 + 넉백',
        },
      },
    },
    {
      id: 'Carnivale S16 A2 Tikbalang 10-tonze Wave',
      // front cleave with donut aoe
      type: 'StartsUsing',
      netRegex: { id: '3A1C', source: 'Tikbalang', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away from front + in',
          de: 'Weg von Vorne + Rein',
          fr: 'Loin de l\'avant + intérieur',
          ja: '前方から離れて + 中へ',
          cn: '避开正面 + 去下方',
          ko: '앞은 피하고 + 안쪽으로',
        },
      },
    },
    // ================ Stage 17 Act 1 ================
    // intentionally blank
    // ---------------- Stage 17 Act 2 ----------------
    {
      id: 'Carnivale S17 A2 Kreios Magitek Field',
      // same name, different id from S04 A2
      type: 'StartsUsing',
      netRegex: { id: '3AC9', source: 'Kreios' },
      response: Responses.interrupt(),
    },
    // ================ Stage 18 Act 1 ================
    {
      id: 'Carnivale S18 A1-2 Arena Manticore Wild Charge',
      // non-telegraphed charge + knockback
      type: 'StartsUsing',
      netRegex: { id: '3ACF', source: 'Arena Manticore', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Charge + knockback',
          de: 'Ansturm + Rückstoß',
          fr: 'Ruée + Poussée',
          ja: '突進 + ノックバック',
          cn: '冲锋 + 击退',
          ko: '돌진 + 넉백',
        },
      },
    },
    {
      id: 'Carnivale S18 A1-2 Arena Manticore Ripper Claw',
      // non-telegraphed front cleave
      type: 'StartsUsing',
      netRegex: { id: '3ACA', source: 'Arena Manticore', capture: false },
      suppressSeconds: 1,
      response: Responses.awayFromFront(),
    },
    {
      id: 'Carnivale S18 A1-2 Arena Manticore Fireball',
      // non-telegraphed ranged aoe
      type: 'StartsUsing',
      netRegex: { id: '3ACB', source: 'Arena Manticore', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Fireball',
          de: 'Feuerball',
          fr: 'Boule de feu',
          ja: '火球',
          cn: '火球',
          ko: '파이어볼',
        },
      },
    },
    // ---------------- Stage 18 Act 2 ----------------
    // intentionally blank
    // ================ Stage 19 Act 1 ================
    {
      id: 'Carnivale S19 A1-2 Reflective Rebekkah Reflect',
      // reflects all magic attacks
      type: 'StartsUsing',
      netRegex: { id: '3AE1', source: 'Reflective Rebekkah', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Magic reflect',
          de: 'Magische Reflektion',
          fr: 'Réflexion magique',
          ja: '魔法攻撃反射',
          cn: '反弹魔法攻击',
          ko: '마법 반사',
        },
      },
    },
    {
      id: 'Carnivale S19 A1-2 Reflective Rebekkah Offal Breath',
      type: 'StartsUsing',
      netRegex: { id: '3AE4', source: 'Reflective Rebekkah' },
      response: Responses.interrupt(),
    },
    // ---------------- Stage 19 Act 2 ----------------
    {
      id: 'Carnivale S19 A2 Reflective Rebekkah Schizocarps',
      // spawns 8x Hot Hips around the arena that do a simultaneous gaze attack
      // can either look away from all Hot Hips or Blind yourself to dodge the gazes
      type: 'StartsUsing',
      netRegex: { id: '3AE5', source: 'Reflective Rebekkah', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Blind yourself or Look Away',
          de: 'Erblinden oder schau weg',
          fr: 'Aveuglez-vous ou regardez ailleurs',
          ja: '自分に暗黙、または背を向ける',
          cn: '致盲自己或看向其他方向',
          ko: '뒤돌아 봐요, 또는 내게 블라인드를',
        },
      },
    },
    // ================ Stage 20 Act 1 ================
    {
      id: 'Carnivale S20 A1,3 Typhon Snort',
      // Typhon casts Snort to knock the player back,
      // then uses 3x un-telegraphed Fireballs that do very high damage if not mitigated
      type: 'StartsUsing',
      netRegex: { id: '3970', source: 'Typhon', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Diamondback',
          de: 'Diamantrücken',
          fr: 'Dos de diamant',
          ja: '超硬化',
          cn: '超硬化',
          ko: '🔷다이아써욧!',
        },
      },
    },
    // ---------------- Stage 20 Act 2 ----------------
    {
      id: 'Carnivale S20 A2 Ultros Imp Song',
      type: 'StartsUsing',
      netRegex: { id: '3978', source: 'Ultros' },
      response: Responses.interrupt(),
    },
    // ---------------- Stage 20 Act 3 ----------------
    {
      id: 'Carnivale S20 A3 Ultros Imp Song',
      // same name, different id from S20 A2
      type: 'StartsUsing',
      netRegex: { id: '3998', source: 'Ultros' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S20 A3 Stylish Tentacle Clearout',
      type: 'Ability',
      netRegex: { id: '399D', source: 'Stylish Tentacle', capture: false },
      response: Responses.knockback(),
    },
    // ================ Stage 21 Act 1 ================
    {
      id: 'Carnivale S21 A1-2 Arena Imp Void Blizzard',
      type: 'StartsUsing',
      netRegex: { id: '3AD7', source: 'Arena Imp' },
      response: Responses.interrupt(),
    },
    // ---------------- Stage 21 Act 2 ----------------
    {
      id: 'Carnivale S21 A2 Act Start',
      // triggers off of the first autoattack in S21 A2
      type: 'Ability',
      netRegex: { id: '1961', source: 'Apademak', capture: false },
      preRun: (data) => data.act2 = true,
      suppressSeconds: 999999,
    },
    {
      id: 'Carnivale S21 A2 Apademak The Ram\'s Voice',
      type: 'StartsUsing',
      netRegex: { id: '3AE7', source: 'Apademak', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Carnivale S21 A2 Apademak The Dragon\'s Voice',
      type: 'StartsUsing',
      netRegex: { id: '3AE8', source: 'Apademak', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Carnivale S21 A2 Apademak The Ram\'s Keeper',
      type: 'StartsUsing',
      netRegex: { id: '3AE9', source: 'Apademak' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S21 A2 Arena Imp Spawn',
      type: 'AddedCombatant',
      netRegex: { name: 'Arena Imp', capture: false },
      infoText: (data, _matches, output) => {
        if (data.act2)
          return output.killAdds();
      },
      outputStrings: {
        killAdds: Outputs.killAdds,
      },
    },
    // ================ Stage 22 Act 1 ================
    // intentionally blank
    // ---------------- Stage 22 Act 2 ----------------
    {
      id: 'Carnivale S22 A2 Act Start',
      // triggers off of the first autoattack in S22 A2
      type: 'Ability',
      netRegex: { id: '1963', source: 'The Forefather', capture: false },
      preRun: (data) => data.act2 = true,
      suppressSeconds: 999999,
    },
    {
      id: 'Carnivale S22 A2 The Forefather Sap',
      // aoe under the player, followed by several aoes around the room with one safe spot
      type: 'Ability',
      netRegex: { id: '3A3A', source: 'The Forefather', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get to Safe Spot',
          de: 'Geh zur sicheren Stelle',
          fr: 'Allez dans la zone sûre',
          ja: '安地へ',
          cn: '去安全区',
          ko: '안전한 곳 찾아요',
        },
      },
    },
    {
      id: 'Carnivale S22 A2 Arena Grenade Spawn',
      // Arena Grenades spawn with Sleep; if they wake up they will do lethal damage
      // Arena Grenades can be killed with a single standard (220p) attack spell
      // Arena Grenades need to be killed before the boss casts Ignition (3AC0, light roomwide attack, wakes Grenades)
      type: 'AddedCombatant',
      netRegex: { name: 'Arena Grenade' },
      alertText: (data, matches, output) => {
        if (data.act2)
          return output.kill({ name: matches.name });
      },
      outputStrings: {
        kill: {
          en: 'Kill ${name}',
          de: 'Besiege ${name}',
          fr: 'Tuez ${name}',
          ja: '${name}を倒す',
          cn: '击杀 ${name}',
          ko: '잡아요: ${name}',
        },
      },
    },
    {
      id: 'Carnivale S22 A2 Arena Gas Bomb Spawn',
      // The Forefather will cast Burst (3A38), a non-interruptable, lethal roomwide attack
      // Arena Gas Bombs cast Flashthoom (3A36), a small aoe which will interrupt Burst
      // Arena Gas Bombs spawn on the edge of the arena and need to be pulled in range of the boss
      type: 'AddedCombatant',
      netRegex: { name: 'Arena Gas Bomb' },
      alertText: (data, matches, output) => {
        if (data.act2)
          return output.pullToBoss({ name: matches.name });
      },
      outputStrings: {
        pullToBoss: {
          en: 'Pull ${name} to boss',
          de: 'Ziehe ${name} zum Boss',
          fr: 'Attirez ${name} vers le boss',
          ja: '${name}をボスに引き寄せる',
          cn: '将 ${name} 拉到BOSS处',
          ko: '보스에게 데려가요: ${name}',
        },
      },
    },
    // ================ Stage 23 Act 1 ================
    {
      id: 'Carnivale S23 A1 Kronprinz Behemoth Ecliptic Meteor',
      // Ecliptic Meteor (9.7s cast) is lethal if not mitigated
      // delay slightly so Diamondback doesn't run out too fast
      type: 'StartsUsing',
      netRegex: { id: '3B99', source: 'Kronprinz Behemoth', capture: false },
      delaySeconds: 1,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Diamondback',
          de: 'Diamantrücken',
          fr: 'Dos de diamant',
          ja: '超硬化',
          cn: '超硬化',
          ko: '🔷다이아써욧!',
        },
      },
    },
    // ================ Stage 24 Act 1 ================
    // intentionally blank
    // ---------------- Stage 24 Act 2 ----------------
    {
      id: 'Carnivale S24 A2 Arena Scribe Silence',
      type: 'StartsUsing',
      netRegex: { id: '3BD9', source: 'Arena Scribe' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S24 A2 Arena Scribe Condensed Libra',
      // 38 = Physical Vulnerability Up
      // will make next attack (Triple Hit, 3BD8) lethal
      // can cleanse the debuff or mitigate the attack
      type: 'GainsEffect',
      netRegex: { effectId: '38', source: 'Arena Scribe' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleanse debuff or mitigate',
          de: 'Debuff entfernen oder mitigieren',
          fr: 'Guérissez les débuffs ou mitigez',
          ja: 'デバフを解除するかダメージ軽減',
          cn: '驱散DEBUFF或减伤',
          ko: '에스나 아니면 방어 버프 써욧',
        },
      },
    },
    // ---------------- Stage 24 Act 3 ----------------
    {
      id: 'Carnivale S24 A3 Epilogi Page Tear',
      type: 'StartsUsing',
      netRegex: { id: '3BDC', source: 'Epilogi', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Carnivale S24 A3 Epilogi Head Down',
      type: 'StartsUsing',
      netRegex: { id: '3BDD', source: 'Epilogi', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback into Safe Spot',
          de: 'Rückstoß zur sicheren Stelle',
          fr: 'Poussée vers la zone sûre',
          ja: '安地へノックバック',
          cn: '击退到安全区',
          ko: '안전한 곳으로 넉백',
        },
      },
    },
    {
      id: 'Carnivale S24 A3 Epilogi Bone Shaker',
      // aoe + spawns adds
      type: 'Ability',
      netRegex: { id: '3BDE', source: 'Epilogi', capture: false },
      response: Responses.killAdds(),
    },
    // ================ Stage 25 Act 1 ================
    {
      id: 'Carnivale S25 A1,3 Azulmagia Ice Spikes',
      // reflects physical damage
      type: 'StartsUsing',
      netRegex: { id: '39AA', source: 'Azulmagia', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Physical reflect',
          de: 'Physische Reflektion',
          fr: 'Réflexion physique',
          ja: '物理攻撃反射',
          cn: '反弹物理伤害',
          ko: '물리 반사',
        },
      },
    },
    {
      id: 'Carnivale S25 A1-3 Azulmagia The Ram\'s Voice',
      type: 'StartsUsing',
      netRegex: { id: '39AB', source: 'Azulmagia', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Carnivale S25 A1-3 Azulmagia The Dragon\'s Voice',
      type: 'StartsUsing',
      netRegex: { id: '39AC', source: 'Azulmagia', capture: false },
      response: Responses.getIn(),
    },
    // ---------------- Stage 25 Act 2 ----------------
    {
      id: 'Carnivale S25 A2-3 Azulmagia Repelling Spray',
      // reflects magic damage
      type: 'StartsUsing',
      netRegex: { id: '39B0', source: 'Azulmagia', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Magic reflect',
          de: 'Magische Reflektion',
          fr: 'Réflexion magique',
          ja: '魔法攻撃反射',
          cn: '反弹魔法伤害',
          ko: '마법 반사',
        },
      },
    },
    {
      id: 'Carnivale S25 A2 Azulmagia Blazing Angon',
      type: 'AddedCombatant',
      netRegex: { name: 'Blazing Angon', capture: false },
      response: Responses.killAdds(),
    },
    // ---------------- Stage 25 Act 3 ----------------
    // intentionally blank
    // ================ Stage 26 Act 1 ================
    {
      id: 'Carnivale S26 A1 Arena Mirrorknight Alternate Plumage',
      // 3F = Vulnerability Down, can be dispelled
      type: 'GainsEffect',
      netRegex: { effectId: '3F', target: 'Arena Mirrorknight' },
      infoText: (_data, matches, output) => output.dispel({ name: matches.target }),
      outputStrings: {
        dispel: {
          en: 'Dispel ${name}',
          de: 'Entferne ${name}',
          fr: 'Dissipez ${name}',
          ja: '${name}にバフ解除',
          cn: '驱散 ${name} 的BUFF',
          ko: '디스펠: ${name}',
        },
      },
    },
    {
      id: 'Carnivale S26 A1 Arena Mirrorknight Caber Toss',
      type: 'StartsUsing',
      netRegex: { id: '4900', source: 'Arena Mirrorknight' },
      response: Responses.interrupt(),
    },
    // ---------------- Stage 26 Act 2 ----------------
    {
      id: 'Carnivale S26 A2 Papa Humbaba Raw Instinct',
      // 705 = Critical Strikes, can be dispelled
      type: 'GainsEffect',
      netRegex: { effectId: '705', target: 'Papa Humbaba' },
      infoText: (_data, matches, output) => output.dispel({ name: matches.target }),
      outputStrings: {
        dispel: {
          en: 'Dispel ${name}',
          de: 'Entferne ${name}',
          fr: 'Dissipez ${name}',
          ja: '${name}にバフ解除',
          cn: '驱散 ${name} 的BUFF',
          ko: '디스펠: ${name}',
        },
      },
    },
    {
      id: 'Carnivale S26 A2 Papa Humbaba Dad Joke',
      // attack has a headmarker warning but no castbar
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: Conditions.targetIsYou(),
      response: Responses.knockback(),
    },
    {
      id: 'Carnivale S26 A2 Papa Humbaba Void Thunder III',
      // 10F = Electrocution, can be cleansed
      type: 'GainsEffect',
      netRegex: { effectId: '10F', source: 'Papa Humbaba' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleanse debuff',
          de: 'Debuff entfernen',
          fr: 'Guérissez le débuff',
          ja: 'デバフを解除',
          cn: '驱散DEBUFF',
          ko: '에스나~',
        },
      },
    },
    // ================ Stage 27 Act 1 ================
    // intentionally blank
    // ================ Stage 28 Act 1 ================
    {
      id: 'Carnivale S28 A1 Durinn Doom Impending',
      // gives Doom (6E9) and Incurable (5D0)
      // if not healed to full before debuffs applied, player will die
      type: 'StartsUsing',
      netRegex: { id: '4A6B', source: 'Durinn', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Heal To Full',
          de: 'Vollheilen',
          fr: 'Soignez complètement',
          ja: '全員のHPを全回復',
          cn: '奶满自己',
          ko: '만피 채워욧',
        },
      },
    },
    {
      id: 'Carnivale S28 A1 Durinn March of the Draugar',
      // summons different adds each wave
      type: 'Ability',
      netRegex: { id: '4A71', source: 'Durinn', capture: false },
      response: Responses.killAdds(),
    },
    {
      id: 'Carnivale S28 A1 Durinn Cackle',
      type: 'StartsUsing',
      netRegex: { id: '4A6D', source: 'Durinn' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S28 A1 Durinn Mega Death',
      // if player does not have the Death Becomes You (895) debuff when cast finishes, they will die
      type: 'StartsUsing',
      netRegex: { id: '4A6F', source: 'Durinn', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stand in one puddle',
          de: 'In einer Fläche stehen',
          fr: 'Placez-vous dans une zone au sol',
          ja: '範囲に入る',
          cn: '站在圈里',
          ko: '장판 하나만 들어가요',
        },
      },
    },
    {
      id: 'Carnivale S28 A1 Durinn Funeral Pyre',
      // all undead in this stage take increased damage from fire attacks
      // player counts as undead if they have the Death Becomes You (895) debuff
      type: 'StartsUsing',
      netRegex: { id: '4A70', source: 'Durinn', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Avoid puddles',
          de: 'Vermeide Flächen',
          fr: 'Évitez les flaques',
          ja: '範囲を避ける',
          cn: '躲避圈圈',
          ko: '장판 피해요',
        },
      },
    },
    {
      id: 'Carnivale S28 A1 Durinn Brainstorm',
      // Mindhack with ground aoes, single safe spot
      type: 'GainsEffect',
      // 7A6 = Forward March
      // 7A7 = About Face
      // 7A8 = Left Face
      // 7A9 = Right Face
      netRegex: { effectId: '7A[6-9]', source: 'Durinn' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, matches, output) => {
        const effectId = matches.effectId.toUpperCase();
        if (effectId === '7A6')
          return output.forward();
        if (effectId === '7A7')
          return output.backward();
        if (effectId === '7A8')
          return output.left();
        if (effectId === '7A9')
          return output.right();
      },
      outputStrings: {
        forward: {
          en: 'March Forward into Safe Spot',
          de: 'marschiere Vorwärts in die sichere Stelle',
          fr: 'Marche avant forcée en zone sûre',
          ja: '強制移動: 前',
          cn: '向前强制移动到安全区',
          ko: '강제이동 🔜 안전지대: 앞',
        },
        backward: {
          en: 'March Backward into Safe Spot',
          de: 'marschiere Rückwärts in die sichere Stelle',
          fr: 'Marche arrière forcée en zone sûre',
          ja: '強制移動: 後ろ',
          cn: '向后强制移动到安全区',
          ko: '강제이동 🔜 안전지대: 뒤',
        },
        left: {
          en: 'March Left into Safe Spot',
          de: 'marschiere Links in die sichere Stelle',
          fr: 'Marche à gauche forcée en zone sûre',
          ja: '強制移動: 左',
          cn: '向左强制移动到安全区',
          ko: '강제이동 🔜 안전지대: 왼쪽',
        },
        right: {
          en: 'March Right into Safe Spot',
          de: 'marschiere Rechts in die sichere Stelle',
          fr: 'Marche à droite forcée en zone sûre',
          ja: '強制移動: 右',
          cn: '向右强制移动到安全区',
          ko: '강제이동 🔜 안전지대: 오른쪽',
        },
      },
    },
    // ================ Stage 29 Act 1 ================
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Fluid Swing',
      // cleave + knockback if not interrupted
      type: 'StartsUsing',
      netRegex: { id: '4901', source: 'Shikigami of the Pyre' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Sea of Flames',
      type: 'StartsUsing',
      netRegex: { id: '4905', source: 'Shikigami of the Pyre', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait two Eruptions',
          de: 'Köder 2 Eruptionen',
          fr: 'Attirez 2 éruptions',
          ja: '2つのエラプションを誘導',
          cn: '诱导2个地火',
          ko: '이럽션 2개 유도',
        },
      },
    },
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Pyretic',
      // the Pyretic cast (4903) gives the Pyretic debuff (3C0)
      type: 'StartsUsing',
      netRegex: { id: '4903', source: 'Shikigami of the Pyre', capture: false },
      response: Responses.stopEverything(),
    },
    {
      id: 'Carnivale S29 A1 Pyretic Lose',
      // 3C0 = Pyretic
      // Shikigami of the Pyre casts Fire II (4904) to bait the player into moving early
      type: 'LosesEffect',
      netRegex: { effectId: '3C0', source: 'Shikigami of the Pyre' },
      condition: Conditions.targetIsYou(),
      response: Responses.moveAway(),
    },
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Pillar of Flame 1',
      // out-then-in pattern
      // TODO: is this always out-then-in, can it ever be in-then-out?
      type: 'StartsUsing',
      netRegex: { id: '4907', source: 'Shikigami of the Pyre', capture: false },
      response: Responses.getOutThenIn(),
    },
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Pillar of Flame 2',
      // single safe spot pattern
      type: 'StartsUsing',
      netRegex: { id: '49CE', source: 'Shikigami of the Pyre', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get to Safe Spot',
          de: 'Geh zur sicheren Stelle',
          fr: 'Allez en zone sûre',
          ja: '安地へ',
          cn: '去安全区',
          ko: '안전한 곳 찾아가요',
        },
      },
    },
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Flare Star',
      // proximity damage from center of the arena
      type: 'StartsUsing',
      netRegex: { id: '4909', source: 'Shikigami of the Pyre', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get to edge',
          de: 'Geh zu einem Rand',
          fr: 'Allez sur le bord',
          ja: '端へ',
          cn: '去场边',
          ko: '모서리로',
        },
      },
    },
    {
      id: 'Carnivale S29 A1 Shikigami of the Pyre Rush',
      // charge from boss that deals proximity-based damage
      type: 'StartsUsing',
      netRegex: { id: '4902', source: 'Shikigami of the Pyre', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Run Away From Boss',
          de: 'Renn weg vom Boss',
          fr: 'Éloignez-vous du boss',
          ja: 'ボスから離れる',
          cn: '远离Boss',
          ko: '보스랑 멀리 떨어져요',
        },
      },
    },
    // ---------------- Stage 29 Act 2 ----------------
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Fluid Swing',
      // cleave + knockback if not interrupted
      type: 'StartsUsing',
      netRegex: { id: '4A11', source: 'Shikigami of the Undertow' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Protean Wave',
      // cone from front of boss then cone baited on player
      type: 'StartsUsing',
      netRegex: { id: '4A1B', source: 'Shikigami of the Undertow', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Throttle',
      // 2BC = Throttle, lethal if not cleansed
      type: 'GainsEffect',
      netRegex: { effectId: '2BC', source: 'Shikigami of the Undertow' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleanse debuff',
          de: 'Debuff entfernen',
          fr: 'Guérissez le débuff',
          ja: 'デバフを解除',
          cn: '驱散DEBUFF',
          ko: '에스나~',
        },
      },
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Ferrofluid',
      // 4A12 magnets with different polarity (will get pulled into boss + point-blank aoe under boss)
      // 4A13 magnets with same polarity (will get pushed away from boss + donut aoe around boss)
      type: 'StartsUsing',
      netRegex: { id: '4A1[23]', source: 'Shikigami of the Undertow' },
      infoText: (_data, matches, output) => {
        if (matches.id === '4A12')
          return output.far();
        return output.close();
      },
      outputStrings: {
        close: {
          en: 'Close to boss',
          de: 'Nahe am Boss',
          fr: 'Allez près du boss',
          ja: 'ボスに近づく',
          cn: '靠近boss',
          ko: '보스에게 붙어요',
        },
        far: {
          en: 'Away from boss',
          de: 'Weg am Boss',
          fr: 'Éloignez-vous du boss',
          ja: 'ボスから離れる',
          cn: '远离boss',
          ko: '보스랑 멀리 떨어져요',
        },
      },
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Fluid Ball',
      type: 'StartsUsing',
      netRegex: { id: '4A18', source: 'Shikigami of the Undertow', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait two aoes',
          de: 'Köder 2 AoEs',
          fr: 'Attirez 2 AoEs',
          ja: '2つの範囲攻撃を誘導',
          cn: '诱导2个AOE',
          ko: '장판 2개 유도',
        },
      },
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Watery Grasp Warning',
      type: 'StartsUsing',
      netRegex: { id: '4A54', source: 'Shikigami of the Undertow', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Adds soon',
          de: 'Bald Adds',
          fr: 'Adds bientôt',
          ja: 'まもなく雑魚出現',
          cn: '小怪即将出现',
          ko: '곧 쫄',
        },
      },
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Watery Grasp Adds',
      type: 'Ability',
      netRegex: { id: '4A54', source: 'Shikigami of the Undertow', capture: false },
      response: Responses.killAdds(),
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Big Splash',
      // Big Splash (7.7s cast) is lethal if not mitigated
      type: 'StartsUsing',
      netRegex: { id: '4A15', source: 'Shikigami of the Undertow', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Diamondback',
          de: 'Diamantrücken',
          fr: 'Dos de diamant',
          ja: '超硬化',
          cn: '超硬化',
          ko: '🔷다이아써욧!',
        },
      },
    },
    {
      id: 'Carnivale S29 A2 Shikigami of the Undertow Unwind',
      // proximity damage from 3x water tornadoes
      type: 'StartsUsing',
      netRegex: { id: '4A29', source: 'Shikigami of the Undertow', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away from water tornadoes',
          de: 'Weg von den Wassertornados',
          fr: 'Éloignez-vous des tornades d\'eau',
          ja: '水柱から離れる',
          cn: '远离水龙卷',
          ko: '물 토네이도에서 멀리 떨어져요',
        },
      },
    },
    // ================ Stage 30 Act 1 ================
    {
      id: 'Carnivale S30 A1,3 Siegfried Magic Drain',
      // reflects all magic attacks
      type: 'StartsUsing',
      netRegex: { id: '49CA', source: 'Siegfried', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Magic reflect',
          de: 'Magische Reflektion',
          fr: 'Réflexion magique',
          ja: '魔法攻撃反射',
          cn: '反弹魔法伤害',
          ko: '마법 반사',
        },
      },
    },
    {
      id: 'Carnivale S30 A1,3 Siegfried Ankle Graze',
      // 234 = Bind
      type: 'GainsEffect',
      netRegex: { effectId: '234', source: 'Siegfried' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleanse debuff',
          de: 'Debuff entfernen',
          fr: 'Guérissez le débuff',
          ja: 'デバフを解除',
          cn: '驱散DEBUFF',
          ko: '에스나~',
        },
      },
    },
    {
      id: 'Carnivale S30 A1,3 Siegfried Hyperdrive',
      type: 'Ability',
      netRegex: { id: '4994', source: 'Siegfried', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait three aoes',
          de: 'Köder 3 AoEs',
          fr: 'Attirez 3 AoEs',
          ja: '3つの範囲攻撃を誘導',
          cn: '诱导3个AOE',
          ko: '장판 3개 유도',
        },
      },
    },
    {
      id: 'Carnivale S30 A1 Siegfried Rubber Bullet',
      // TODO: is back-right from boss always safe?
      type: 'StartsUsing',
      netRegex: { id: '499F', source: 'Siegfried', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Knockback into Safe Spot',
          de: 'Rückstoß zur sicheren Stelle',
          fr: 'Poussée vers la zone sûre',
          ja: '安地へノックバック',
          cn: '击退到安全区',
          ko: '안전한 곳으로 넉백',
        },
      },
    },
    // ---------------- Stage 30 Act 2 ----------------
    {
      id: 'Carnivale S30 A2-3 Siegfried Swiftsteel',
      // donut aoe with knockback
      type: 'StartsUsing',
      netRegex: { id: '499A', source: 'Siegfried', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get in + Knockback',
          de: 'Geh rein + Rückstoß',
          fr: 'Intérieur + Poussée',
          ja: '中へ + ノックバック',
          cn: '去脚下 + 击退',
          ko: '안으로 + 넉백',
        },
      },
    },
    {
      id: 'Carnivale S30 A2-3 Siegfried Shattersteel',
      // single safe spot in gap between two ice blocks
      type: 'StartsUsing',
      netRegex: { id: '4A53', source: 'Siegfried', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Get to Safe Spot (between two ice)',
          de: 'Geh zur sicheren Stelle (zwischen 2 Eis)',
          fr: 'Allez en zone sûre (entre deux glaces)',
          ja: '安地へ (2つの氷の間)',
          cn: '去安全区 (两个冰之间)',
          ko: '안전한 곳 찾아가요 (두 얼음 사이)',
        },
      },
    },
    // ---------------- Stage 30 Act 3 ----------------
    // intentionally blank
    // ================ Stage 31 Act 1 ================
    {
      id: 'Carnivale S31 A1 Gogo, Master of Mimicry Mimic',
      // Gogo counterattacks all attacks while Mimicry (992) is active
      type: 'StartsUsing',
      netRegex: { id: '5A39', source: 'Gogo, Master of Mimicry' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Stop attacking',
          de: 'Angriffe stoppen',
          fr: 'Arrêtez d\'attaquer',
          ja: '攻撃禁止',
          cn: '停止攻击',
          ko: '공격 금지',
        },
      },
    },
    {
      id: 'Carnivale S31 A1 Gogo, Master of Mimicry Mimicked Sap',
      // casts 3x, second and third casts are faster
      // 5A40 = 3.2s, 5A41 = 1.2s
      type: 'Ability',
      netRegex: { id: '5A40', source: 'Gogo, Master of Mimicry', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait two aoes',
          de: 'Köder 2 AoEs',
          fr: 'Attirez 2 AoEs',
          ja: '2つの範囲攻撃を誘導',
          cn: '诱导2个AOE',
          ko: '장판 2개 유도',
        },
      },
    },
    {
      id: 'Carnivale S31 A1 Gogo, Master of Mimicry Mimicked Imp Song',
      type: 'StartsUsing',
      netRegex: { id: '5A4A', source: 'Gogo, Master of Mimicry' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S31 A1 Gogo, Master of Mimicry Mimicked Doom Impending',
      // gives Doom (6E9) and Incurable (5D0)
      // if not healed to full before debuffs applied, player will die
      type: 'StartsUsing',
      netRegex: { id: '5A49', source: 'Gogo, Master of Mimicry', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Heal To Full',
          de: 'Vollheilen',
          fr: 'Soignez complètement',
          ja: '全員のHPを全回復',
          cn: '奶满自己',
          ko: '만피 채워욧',
        },
      },
    },
    {
      id: 'Carnivale S31 A1 Gogo, Master of Mimicry Mimicked Bunshin',
      // spawns a clone that does a double cone while Gogo does a line aoe
      type: 'StartsUsing',
      netRegex: { id: '5A43', source: 'Gogo, Master of Mimicry', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Add soon',
          de: 'Bald Add',
          fr: 'Add bientôt',
          ja: 'まもなく雑魚出現',
          cn: '小怪即将出现',
          ko: '분신 등장',
        },
      },
    },
    {
      id: 'Carnivale S31 A1 Gogo, Master of Mimicry Mimicked Raw Instinct',
      // 705 = Critical Strikes, can be dispelled
      type: 'GainsEffect',
      netRegex: { effectId: '705', target: 'Gogo, Master of Mimicry' },
      infoText: (_data, matches, output) => output.dispel({ name: matches.target }),
      outputStrings: {
        dispel: {
          en: 'Dispel ${name}',
          de: 'Entferne ${name}',
          fr: 'Dissipez ${name}',
          ja: '${name}にバフ解除',
          cn: '驱散 ${name} 的BUFF',
          ko: '디스펠: ${name}',
        },
      },
    },
    // ---------------- Stage 31 Act 2 ----------------
    {
      id: 'Carnivale S31 A2 Gogo, Master of Mimicry Gogo Fire III',
      // gives the Pyretic debuff (3C0)
      // followed by Gogo Blizzard III (5A4E), a point-blank aoe around the boss
      type: 'StartsUsing',
      netRegex: { id: '5A4D', source: 'Gogo, Master of Mimicry', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Away from boss => Stop Everything',
          de: 'Weg vom Boss => Stoppe alles',
          fr: 'Éloignez-vous du boss => Arrêtez tout',
          ja: 'ボスから離れる => 動くな',
          cn: '远离BOSS => 停停停',
          ko: '보스와 멀리 떨어지고 🔜 아무짓도 하면 안되요!',
        },
      },
    },
    {
      id: 'Carnivale S31 A2 Gogo, Master of Mimicry Gogo Meteor',
      // Gogo Meteor is a clusterfuck of random, baited, and proximity-damage aoes
      // followed by one giant, roomwide meteor that is lethal if not mitigated
      // multiple ids: 5A50, 5A51, 5A52, 5A53, 5A54, 5A59, 5A5B
      // 5A54 is the giant, roomwide, lethal meteor at the end
      type: 'StartsUsing',
      netRegex: { id: '5A54', source: 'Gogo, Master of Mimicry' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) / 2,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Diamondback',
          de: 'Diamantrücken',
          fr: 'Dos de diamant',
          ja: '超硬化',
          cn: '超硬化',
          ko: '🔷다이아써욧!',
        },
      },
    },
    {
      id: 'Carnivale S31 A2 Gogo, Master of Mimicry Icestorm',
      // Icestorm gives two debuffs: Frostbite (10C) and Heavy (453)
      // both need to be cleansed so the following mechanics can be dodged
      type: 'GainsEffect',
      netRegex: { effectId: ['10C', '453'], source: 'Gogo, Master of Mimicry' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleanse both debuffs',
          de: 'Entferne beide Debuffs',
          fr: 'Guérissez les deux débuffs',
          ja: 'デバフを両方解除',
          cn: '驱散两个DEBUFF',
          ko: '에스나: 2개 모두',
        },
      },
    },
    // ================ Stage 32 Act 1 ================
    {
      id: 'Carnivale S32 A1-2 Goldor Goldor Blizzard III',
      type: 'StartsUsing',
      netRegex: { id: '871D', source: 'Goldor' },
      response: Responses.interrupt(),
    },
    {
      id: 'Carnivale S32 A1-2 Goldor Goldor Aero III',
      type: 'StartsUsing',
      netRegex: { id: '869C', source: 'Goldor', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Carnivale S32 A1-2 Goldor Goldor Thunder III',
      // 10F = Electrocution, can be cleansed
      type: 'GainsEffect',
      netRegex: { effectId: '10F', source: 'Goldor' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Cleanse debuff',
          de: 'Debuff entfernen',
          fr: 'Guérissez le débuff',
          ja: 'デバフを解除',
          cn: '驱散DEBUFF',
          ko: '에스나',
        },
      },
    },
    // ---------------- Stage 32 Act 2 ----------------
    {
      id: 'Carnivale S32 A2 Gilded Cyclops 24-carat Swing',
      type: 'StartsUsing',
      netRegex: { id: '86A3', source: 'Gilded Cyclops', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Carnivale S32 A2 Goldor Goldor Rush',
      type: 'StartsUsing',
      netRegex: { id: '86A4', source: 'Goldor', capture: false },
      response: Responses.knockback(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Apademak': 'Apademak',
        'Arena Catoblepas': 'Arena-Catblepus',
        'Arena Eye': 'Arena-Auge',
        'Arena Gas Bomb': 'Arena-Gasbomber',
        'Arena Grenade': 'Arena-Granate',
        'Arena Imp': 'Arena-Imp',
        'Arena Jam': 'Arena-Marmelade',
        'Arena Manticore': 'Arena-Manticore',
        'Arena Mirrorknight': 'Arena-Speglidae',
        'Arena Progenitrix': 'Arena-Progenitrix',
        'Arena Scribe': 'Arena-Scholar',
        'Arena Shabti': 'Arena-Shabti',
        'Arena Succubus': 'Arena-Sukkubus',
        'Azulmagia': 'Azulmagia',
        'Bestial Node': 'bestialisch(?:e|er|es|en) System',
        'Blazing Angon': 'Glühender Ango',
        'Carmilla': 'Carmilla',
        'Crom Dubh': 'Crom Dubh',
        'Durinn': 'Durinn',
        'Epilogi': 'Epilogi',
        'Gilded Cyclops': 'gülden(?:e|er|es|en) Zyklop',
        'Gladiatorial Node': 'kämpferisch(?:e|er|es|en) System',
        'Gogo, Master of Mimicry': 'Gogo (?:der|die|das) Mime',
        'Goldor': 'Goldor',
        'Guimauve': 'Guimauve',
        'Hydnora': 'Hydnora',
        'Kreios': 'Kreios',
        'Kronprinz Behemoth': 'Kronprinz-Behemoth',
        'Papa Humbaba': 'Hunbabas Papa',
        'Reflective Rebekkah': 'Rebekkah Rotzeranke',
        'Shikigami of the Pyre': 'Shikigami des Feuers',
        'Shikigami of the Undertow': 'Shikigami des Wassers',
        'Siegfried': 'Siegfried',
        'Stylish Tentacle': 'elegant(?:e|er|es|en) Tentakel',
        'The Forefather': 'Urgroßbomber',
        'Tikbalang': 'Tikbalang',
        'Typhon': 'Typhon',
        'Ultros': 'Ultros',
        'Zipacna': 'Zipacna',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Apademak': 'Apademak',
        'Arena Catoblepas': 'catoblépas de l\'arène',
        'Arena Eye': 'œil de l\'arène',
        'Arena Gas Bomb': 'bombo à gaz de l\'arène',
        'Arena Grenade': 'grenado de l\'arène',
        'Arena Imp': 'imp de l\'arène',
        'Arena Jam': 'confiture aigre',
        'Arena Manticore': 'manticore de l\'arène',
        'Arena Mirrorknight': 'chevalier miroir de l\'arène',
        'Arena Progenitrix': 'maman bombo de l\'arène',
        'Arena Scribe': 'scribe de l\'arène',
        'Arena Shabti': 'chaouabti de l\'arène',
        'Arena Succubus': 'succube de l\'arène',
        'Azulmagia': 'Azulmagia',
        'Bestial Node': 'sphère bestiale',
        'Blazing Angon': 'Angon flamboyant',
        'Carmilla': 'Carmilla',
        'Crom Dubh': 'Crom Dubh',
        'Durinn': 'Durinn',
        'Epilogi': 'Epilogi',
        'Gilded Cyclops': 'cyclope de Goldor',
        'Gladiatorial Node': 'sphère gladiatrice',
        'Gogo, Master of Mimicry': 'Gogo le mime',
        'Goldor': 'Goldor',
        'Guimauve': 'Guimauve',
        'Hydnora': 'Hydnora',
        'Kreios': 'Kreios',
        'Kronprinz Behemoth': 'Kronprinz béhémoth',
        'Papa Humbaba': 'Papa Humbaba',
        'Reflective Rebekkah': 'Rebekkah l\'égocentrique',
        'Shikigami of the Pyre': 'shikigami de feu',
        'Shikigami of the Undertow': 'shikigami d\'eau',
        'Siegfried': 'Siegfried',
        'Stylish Tentacle': 'tentacule',
        'The Forefather': 'Papi bombo',
        'Tikbalang': 'Tikbalang',
        'Typhon': 'Typhon',
        'Ultros': 'Orthros',
        'Zipacna': 'Zipacna',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Apademak': 'アペデマク',
        'Arena Catoblepas': 'アリーナ・カトブレパス',
        'Arena Eye': 'アリーナ・アイ',
        'Arena Gas Bomb': 'アリーナ・ガスボム',
        'Arena Grenade': 'アリーナ・グレネード',
        'Arena Imp': 'アリーナ・インプ',
        'Arena Jam': 'アリーナ・ポイズンジャム',
        'Arena Manticore': 'アリーナ・マンティコア',
        'Arena Mirrorknight': 'アリーナ・ミラーナイト',
        'Arena Progenitrix': 'アリーナ・マザーボム',
        'Arena Scribe': 'アリーナ・スクライブ',
        'Arena Shabti': 'アリーナ・シュワブチ',
        'Arena Succubus': 'アリーナ・サキュバス',
        'Azulmagia': 'アポカリョープス',
        'Bestial Node': '闘獣システム',
        'Blazing Angon': 'ブレージングアンゴン',
        'Carmilla': 'カーミラ',
        'Crom Dubh': 'クロムドゥーブ',
        'Durinn': 'ドゥリン',
        'Epilogi': 'エペロギ',
        'Gilded Cyclops': 'ゴールドル・サイクロプス',
        'Gladiatorial Node': '闘技システム',
        'Gogo, Master of Mimicry': 'ものまね士ゴゴ',
        'Goldor': 'ゴールドル',
        'Guimauve': 'ギモーヴ',
        'Hydnora': 'ヒドノラ',
        'Kreios': 'クレイオス',
        'Kronprinz Behemoth': 'クロンプリンツ・ベヒーモス',
        'Papa Humbaba': 'フンババ・パパ',
        'Reflective Rebekkah': 'リフレクティブ・レベッカ',
        'Shikigami of the Pyre': '火のシキガミ',
        'Shikigami of the Undertow': '水のシキガミ',
        'Siegfried': 'ジークフリード',
        'Stylish Tentacle': 'タコ足',
        'The Forefather': 'グランパボム',
        'Tikbalang': 'ティクバラン',
        'Typhon': 'テュポーン',
        'Ultros': 'オルトロス',
        'Zipacna': 'シパクナー',
      },
    },
    {
      'locale': 'cn',
      'missingTranslations': true,
      'replaceSync': {
        'Apademak': '阿帕德马克',
        'Arena Catoblepas': '斗场卡托布莱帕斯',
        'Arena Eye': '斗场之眼',
        'Arena Gas Bomb': '斗场瓦斯弹怪',
        'Arena Grenade': '斗场榴弹怪',
        'Arena Imp': '斗场小魔精',
        'Arena Jam': '斗场剧毒果酱怪',
        'Arena Manticore': '斗场曼提克',
        'Arena Mirrorknight': '斗场镜骑士',
        'Arena Progenitrix': '斗场爆弹之母',
        'Arena Scribe': '斗场抄写员',
        'Arena Shabti': '斗场沙布提',
        'Arena Succubus': '斗场梦魔',
        'Azulmagia': '启示者',
        'Bestial Node': '斗兽系统',
        'Blazing Angon': '烈火投枪',
        'Carmilla': '卡蜜拉',
        'Crom Dubh': '幽黑曲偶',
        'Durinn': '都灵',
        'Epilogi': '艾匹罗基',
        'Gladiatorial Node': '斗技系统',
        'Gogo, Master of Mimicry': '模仿师 格格',
        'Guimauve': '棉花软糖',
        'Hydnora': '火花草',
        'Kreios': '克利俄斯',
        'Kronprinz Behemoth': '贝希摩斯太子',
        'Papa Humbaba': '洪巴巴之父',
        'Reflective Rebekkah': '反射魔花瑞贝卡',
        'Shikigami of the Pyre': '火之式神',
        'Shikigami of the Undertow': '水之式神',
        'Siegfried': '齐格弗里德',
        'Stylish Tentacle': '章鱼触手',
        'The Forefather': '爆弹之祖',
        'Tikbalang': '迪克巴朗',
        'Typhon': '提丰',
        'Ultros': '奥尔特罗斯',
        'Zipacna': '希帕克纳',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Apademak': '아페데마크',
        'Arena Catoblepas': '투기장 카토블레파스',
        'Arena Eye': '투기장 눈알',
        'Arena Gas Bomb': '투기장 가스봄',
        'Arena Grenade': '투기장 그레네이드',
        'Arena Imp': '투기장 임프',
        'Arena Jam': '투기장 독잼',
        'Arena Manticore': '투기장 만티코어',
        'Arena Mirrorknight': '투기장 거울기사',
        'Arena Progenitrix': '투기장 엄마 봄',
        'Arena Scribe': '투기장 서기',
        'Arena Shabti': '투기장 샤브티',
        'Arena Succubus': '투기장 서큐버스',
        'Azulmagia': '아포칼리옵스',
        'Bestial Node': '투기야수 시스템',
        'Blazing Angon': '폭염 투창',
        'Carmilla': '카밀라',
        'Crom Dubh': '크롬 두브',
        'Durinn': '두린',
        'Epilogi': '에필로기',
        'Gilded Cyclops': '골도르 사이클롭스',
        'Gladiatorial Node': '투기 시스템',
        'Gogo, Master of Mimicry': '흉내쟁이 고고',
        'Goldor': '골도르',
        'Guimauve': '기모브',
        'Hydnora': '히드노라',
        'Kreios': '크레이오스',
        'Kronprinz Behemoth': '황태자 베히모스',
        'Papa Humbaba': '아빠 훔바바',
        'Reflective Rebekkah': '사색하는 레베카',
        'Shikigami of the Pyre': '불의 사역귀',
        'Shikigami of the Undertow': '물의 사역귀',
        'Siegfried': '지크프리드',
        'Stylish Tentacle': '문어발',
        'The Forefather': '할아봄',
        'Tikbalang': '틱발랑',
        'Typhon': '티폰',
        'Ultros': '오르트로스',
        'Zipacna': '시파크나',
      },
    },
  ],
});
