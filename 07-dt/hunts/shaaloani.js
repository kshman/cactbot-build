const effectIdToForcedMarchDir = {
  871: 'forward',
  872: 'backward',
  873: 'left',
  874: 'right', // Right Face
};
// For Yehehe's directional debuffs and attacks, use 0-3 for relative direction
// e.g. 0=front, 1=right, 2=back, 3=left
// Then use that array index to map to the safe dir for that cleave:
const yeheheCleaveToSafe = ['back', 'left', 'front', 'right'];
const yeheheOutputStrings = {
  front: Outputs.front,
  back: Outputs.back,
  right: Outputs.right,
  left: Outputs.left,
  unknown: Outputs.unknown,
  next: Outputs.next,
};
//     SOUTH
// -------------
// OFL OF- OFR |Outer
// IFL IF- IFR |Inner
// IBL IB- IBR |Inner
// OBL OB- OBR |Outer
//   OF  IF  IB  OB
//   L-R L-R L-R L-R
// 0b000_000_000_000
var TtokSafeSpots;
(function(TtokSafeSpots) {
  TtokSafeSpots[TtokSafeSpots['None'] = 0] = 'None';
  TtokSafeSpots[TtokSafeSpots['All'] = 4095] = 'All';
  TtokSafeSpots[TtokSafeSpots['Left'] = 2340] = 'Left';
  TtokSafeSpots[TtokSafeSpots['Right'] = 585] = 'Right';
  TtokSafeSpots[TtokSafeSpots['Middle'] = 1170] = 'Middle';
  TtokSafeSpots[TtokSafeSpots['In'] = 504] = 'In';
  TtokSafeSpots[TtokSafeSpots['Out'] = 3591] = 'Out';
  TtokSafeSpots[TtokSafeSpots['Front'] = 4032] = 'Front';
  TtokSafeSpots[TtokSafeSpots['Back'] = 63] = 'Back';
  TtokSafeSpots[TtokSafeSpots['FrontCleave'] = 3071] = 'FrontCleave';
  TtokSafeSpots[TtokSafeSpots['BackCleave'] = 4093] = 'BackCleave';
  TtokSafeSpots[TtokSafeSpots['FR_BL'] = 612] = 'FR_BL';
  TtokSafeSpots[TtokSafeSpots['FL_BR'] = 2313] = 'FL_BR';
  TtokSafeSpots[TtokSafeSpots['InRight'] = 72] = 'InRight';
  TtokSafeSpots[TtokSafeSpots['InLeft'] = 288] = 'InLeft';
})(TtokSafeSpots || (TtokSafeSpots = {}));
const ttokrroneTempestSandspoutOutputStrings = {
  unknown: Outputs.unknown,
  in: Outputs.getUnder,
  out: Outputs.outOfMelee,
  outOfHitbox: Outputs.outOfHitbox,
  right: Outputs.right,
  left: Outputs.left,
  back: Outputs.back,
  front: Outputs.front,
  rear: {
    en: 'rear',
    de: 'hinten',
    fr: 'arrière',
    cn: '后',
    ko: '뒤로',
  },
  rightFlank: {
    en: 'right flank',
    de: 'rechte Flanke',
    fr: 'flanc gauche',
    cn: '右侧',
    ko: '오른쪽 옆으로',
  },
  leftFlank: {
    en: 'left flank',
    de: 'linke Flanke',
    fr: 'flanc droit',
    cn: '左侧',
    ko: '왼쪽 옆으로',
  },
  triple: {
    en: '${inOut} + ${dir2} + ${dir3}',
    de: '${inOut} + ${dir2} + ${dir3}',
    fr: '${inOut} + ${dir2} + ${dir3}',
    cn: '${inOut} + ${dir2} + ${dir3}',
    ko: '${inOut} + ${dir2} + ${dir3}',
  },
  double: {
    en: '${inOut} + ${dir2}',
    de: '${inOut} + ${dir2}',
    fr: '${inOut} + ${dir2}',
    cn: '${inOut} + ${dir2}',
    ko: '${inOut} + ${dir2}',
  },
  awayFrom: {
    en: '${out} + avoid ${dir}',
    de: '${out} + vermeide ${dir}',
    fr: '${out} + évitez ${dir}',
    cn: '${out} + 躲避 ${dir}',
    ko: '${out} + ${dir} 피해요',
  },
};
const ttokrroneDesertTempest = {
  '91D3': TtokSafeSpots.Out,
  '91D4': TtokSafeSpots.In,
  '91D5': TtokSafeSpots.InRight,
  '91D6': TtokSafeSpots.InLeft,
};
const ttokrroneDesertTempestIds = Object.keys(ttokrroneDesertTempest);
const ttokrroneDustdevilOutputStrings = {
  outOfHitbox: {
    en: 'Out of hitbox + stay out',
    de: 'Raus aus der Hitbox + bleib drausen',
    fr: 'Extérieur de la hitbox + restez à l\'extérieur',
    cn: '判定圈外 + 待在外面',
    ko: '히트박스 밖으로 + 그대로 바깥',
  },
  rotateFront: {
    en: 'Rotating frontal cleave',
    de: 'Rotierende Frontal-Cleaves',
    fr: 'Cleave frontal tournant',
    cn: '旋转正面顺劈',
    ko: '전방 회전 쪼개기', // ${dir}'
  },
  rotateRear: {
    en: 'Rotating rear cleave',
    de: 'Rotierende Hinten-Cleaves',
    fr: 'Cleave arrière tournant',
    cn: '旋转背后顺劈',
    ko: '후방 회전 쪼개기', // ${dir}'
  },
};
const identifyOrbSafeSpots = (pattern) => {
  // Each time Ttokrrone summons sand orbs either 7 or 8 are spawned in 4 patterns.
  // (these are relative to where the boss faces, which is south)
  // 7 covering all rel. north
  // 7 covering all rel. south
  // 8 covering the rel. NE and SW quadrants with some overlap in the middle
  // 8 covering the rel. NW and SE quadrants with some overlap in the middle
  // since each pattern is composed of a quadrant of AOEs we can check for any orbs in each quadrant
  // (centered around the arena center) and then check the final result to determine the pattern.
  let topRight = false;
  let topLeft = false;
  let bottomRight = false;
  let bottomLeft = false;
  for (const point of pattern) {
    const xGt = point.x > 53.0;
    const yGt = point.y > -825.0;
    topLeft = !topLeft ? !xGt && !yGt : topLeft;
    topRight = !topRight ? xGt && !yGt : topRight;
    bottomLeft = !bottomLeft ? !xGt && yGt : bottomLeft;
    bottomRight = !bottomRight ? xGt && yGt : bottomRight;
  }
  // Returns the SAFE SPOTS so opposite of what is detected
  if (topLeft && topRight) { // AOEs all bottom
    return TtokSafeSpots.Front;
  }
  if (bottomLeft && bottomRight) { // AOEs all top
    return TtokSafeSpots.Back;
  }
  if (topLeft && bottomRight) { // AOEs are front left, back right
    return TtokSafeSpots.FR_BL;
  }
  if (topRight && bottomLeft) { // AOEs are front right, back left
    return TtokSafeSpots.FL_BR;
  }
  console.error('sand sphere pattern not recognized');
  return TtokSafeSpots.None;
};
Options.Triggers.push({
  id: 'Shaaloani',
  zoneId: ZoneId.Shaaloani,
  comments: {
    en: 'A Rank Hunts and Ttokrrone boss FATE',
    de: 'A Rang Hohe Jagd und Ttokrrone Boss FATE',
    fr: 'Chasse de rang A et ALÉA Boss Ttokrrone',
    cn: 'A级狩猎怪和得酷热涅特殊FATE',
    ko: 'A급 마물, 토크로네 특수돌발',
  },
  initData: () => ({
    yeheheTurnBuffs: [],
    ttokSandOrbs: [],
    ttokSandOrbPatterns: [],
    ttokSandOrbsLastSeenTimestamp: -1,
    ttokSandOrbSets: 0,
    ttokSandOrbOnSet: 0,
    ttokRotated: 0,
  }),
  triggers: [
    // ****** A-RANK: Keheniheyamewi ****** //
    {
      id: 'Hunt Keheni Scatterscourge',
      type: 'StartsUsing',
      netRegex: { id: '9B7F', source: 'Keheniheyamewi', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Hunt Keheni Body Press',
      type: 'StartsUsing',
      // Unclear why there are two ids for this, but both are used.
      netRegex: { id: ['9C7F', '96FB'], source: 'Keheniheyamewi', capture: false },
      response: Responses.outOfMelee('alert'),
    },
    {
      id: 'Hunt Keheni Slippery Scatterscourge',
      type: 'StartsUsing',
      netRegex: { id: '96F8', source: 'Keheniheyamewi', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Follow dash (in after)',
          de: 'Folge dem Ansturm (danach Rein)',
          fr: 'Suivez la ruée (intérieur ensuite)',
          cn: '跟随冲锋',
          ko: '돌진 따라가요 🔜 안으로',
        },
      },
    },
    // Note: Because Forced March overlaps with two abilities that already have triggers,
    // and because it applies right before the second resolves, it gets messy to combine
    // the callouts. This would really benefit from a countdown on the Forced March info trigger.
    {
      id: 'Hunt Keheni Forced March Early',
      type: 'GainsEffect',
      netRegex: { effectId: Object.keys(effectIdToForcedMarchDir), source: 'Keheniheyamewi' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, matches, output) => {
        const dir = effectIdToForcedMarchDir[matches.effectId];
        if (dir !== undefined)
          return output[dir]();
      },
      outputStrings: {
        forward: {
          en: 'Forced March: Forward (later)',
          de: 'Geistlenkung: vorwärts (später)',
          fr: 'Marche forcée : Avant (après)',
          cn: '(稍后 强制移动: 前)',
          ko: '(나중에 강제이동: 앞으로)',
        },
        backward: {
          en: 'Forced March: Backward (later)',
          de: 'Geistlenkung: rückwärts (später)',
          fr: 'Marche forcée : Arrière (après)',
          cn: '(稍后 强制移动: 后)',
          ko: '(나중에 강제이동: 뒤로)',
        },
        left: {
          en: 'Forced March: Left (later)',
          de: 'Geistlenkung: links (später)',
          fr: 'Marche forcée : Gauche (après)',
          cn: '(稍后 强制移动: 左)',
          ko: '(나중에 강제이동: 왼쪽으로)',
        },
        right: {
          en: 'Forced March: Right (later)',
          de: 'Geistlenkung: rechts (später)',
          fr: 'Marche forcée : Droite (après)',
          cn: '(稍后 强制移动: 右)',
          ko: '(나중에 강제이동: 오른쪽으로)',
        },
      },
    },
    {
      id: 'Hunt Keheni Forced March Now',
      type: 'GainsEffect',
      netRegex: { effectId: Object.keys(effectIdToForcedMarchDir), source: 'Keheniheyamewi' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 4,
      infoText: (_data, matches, output) => {
        const dir = effectIdToForcedMarchDir[matches.effectId];
        if (dir !== undefined)
          return output[dir]();
      },
      outputStrings: {
        forward: {
          en: 'Forced March: Forward',
          de: 'Geistlenkung: vorwärts',
          fr: 'Marche forcée : Avant',
          cn: '强制移动: 前',
          ko: '강제이동: 앞으로',
        },
        backward: {
          en: 'Forced March: Backward',
          de: 'Geistlenkung: rückwärts',
          fr: 'Marche forcée : Arrière',
          cn: '强制移动: 后',
          ko: '강제이동: 뒤로',
        },
        left: {
          en: 'Forced March: Left',
          de: 'Geistlenkung: links',
          fr: 'Marche forcée : Gauche',
          cn: '强制移动: 左',
          ko: '강제이동: 왼쪽으로',
        },
        right: {
          en: 'Forced March: Right',
          de: 'Geistlenkung: rechts',
          fr: 'Marche forcée : Droite',
          cn: '强制移动: 右',
          ko: '강제이동: 오른쪽으로',
        },
      },
    },
    {
      id: 'Hunt Keheni Malignant Mucus',
      type: 'StartsUsing',
      netRegex: { id: '96FD', source: 'Keheniheyamewi' },
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt(),
    },
    // ****** A-RANK: Yehehetoaua'pyo ****** //
    // There are a bunch of ability ids that correspond to Whirling Omen.
    // Most just apply Left/Right Windup buffs, but there is one that doesn't apply buffs
    // and instead does a raidwide.
    {
      id: 'Hunt Yehehe Whirling Omen',
      type: 'StartsUsing',
      netRegex: { id: '9BC6', source: 'Yehehetoaua\'pyo', capture: false },
      response: Responses.aoe(),
    },
    // Collect and push the Left/Right Windup buffs, and let each trigger that consumes one
    // shift the array.  We have to do it this way because Whirling Omen can apply multiple
    // Windup buffs, and each of Yehehe's casts only consume one.
    {
      id: 'Hunt Yehehe Left Windup Collect',
      type: 'GainsEffect',
      netRegex: { effectId: ['FBD', 'FBF'], target: 'Yehehetoaua\'pyo', capture: false },
      run: (data) => data.yeheheTurnBuffs.push(3), // 3 = left turn
    },
    {
      id: 'Hunt Yehehe Right Windup Collect',
      type: 'GainsEffect',
      netRegex: { effectId: ['FBE', 'FC0'], target: 'Yehehetoaua\'pyo', capture: false },
      run: (data) => data.yeheheTurnBuffs.push(1), // 1 = right turn
    },
    {
      id: 'Hunt Yehehe Pteraspit to Turntail',
      type: 'StartsUsing',
      netRegex: { id: '96E8', source: 'Yehehetoaua\'pyo', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const safeDirs = [];
        const firstDir = yeheheCleaveToSafe[0]; // front cleave
        if (firstDir === undefined)
          return output.unknown();
        safeDirs.push(firstDir);
        let secondDir = 'unknown';
        const turn = data.yeheheTurnBuffs.shift();
        if (turn !== undefined) {
          const calcDir = (turn + 2) % 4; // 2 = back cleave
          secondDir = yeheheCleaveToSafe[calcDir] ?? 'unknown';
          data.yeheheSecondSafeDir = secondDir;
        }
        safeDirs.push(secondDir);
        return safeDirs.map((dir) => output[dir]()).join(output.next());
      },
      outputStrings: yeheheOutputStrings,
    },
    {
      id: 'Hunt Yehehe Turntail to Pteraspit',
      type: 'StartsUsing',
      netRegex: { id: '96EB', source: 'Yehehetoaua\'pyo', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const turn = data.yeheheTurnBuffs.shift();
        if (turn === undefined)
          return output.unknown();
        const safeDirs = [];
        const calcDir = (turn + 2) % 4; // 2 = back cleave
        const firstDir = yeheheCleaveToSafe[calcDir] ?? 'unknown';
        safeDirs.push(firstDir);
        const secondCalcDir = (calcDir + 2) % 4; // 2 = front cleave relative to prior back cleave
        const secondDir = yeheheCleaveToSafe[secondCalcDir] ?? 'unknown';
        data.yeheheSecondSafeDir = secondDir;
        safeDirs.push(secondDir);
        return safeDirs.map((dir) => output[dir]()).join(output.next());
      },
      outputStrings: yeheheOutputStrings,
    },
    {
      id: 'Hunt Yehehe Dactail to Turnspit',
      type: 'StartsUsing',
      netRegex: { id: '96E9', source: 'Yehehetoaua\'pyo', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const safeDirs = [];
        const firstDir = yeheheCleaveToSafe[2]; // back cleave
        if (firstDir === undefined)
          return output.unknown();
        safeDirs.push(firstDir);
        let secondDir = 'unknown';
        const turn = data.yeheheTurnBuffs.shift();
        if (turn !== undefined) {
          secondDir = yeheheCleaveToSafe[turn] ?? 'unknown'; // turn = direction of spit cleave
          data.yeheheSecondSafeDir = secondDir;
        }
        safeDirs.push(secondDir);
        return safeDirs.map((dir) => output[dir]()).join(output.next());
      },
      outputStrings: yeheheOutputStrings,
    },
    {
      id: 'Hunt Yehehe Turnspit to Dactail',
      type: 'StartsUsing',
      netRegex: { id: '96EA', source: 'Yehehetoaua\'pyo', capture: false },
      durationSeconds: 6,
      infoText: (data, _matches, output) => {
        const turn = data.yeheheTurnBuffs.shift();
        if (turn === undefined)
          return output.unknown();
        const safeDirs = [];
        const firstDir = yeheheCleaveToSafe[turn] ?? 'unknown';
        safeDirs.push(firstDir);
        const secondCalcDir = (turn + 2) % 4; // 2 = back cleave relative to prior front cleave
        const secondDir = yeheheCleaveToSafe[secondCalcDir] ?? 'unknown';
        data.yeheheSecondSafeDir = secondDir;
        safeDirs.push(secondDir);
        return safeDirs.map((dir) => output[dir]()).join(output.next());
      },
      outputStrings: yeheheOutputStrings,
    },
    {
      id: 'Hunt Yehehe Spit-Tail Followup',
      type: 'Ability',
      netRegex: {
        id: ['96E8', '96E9', '96EA', '96EB'],
        source: 'Yehehetoaua\'pyo',
        capture: false,
      },
      delaySeconds: 1,
      alertText: (data, _matches, output) => {
        const safeDir = data.yeheheSecondSafeDir;
        if (safeDir !== undefined && safeDir !== 'unknown')
          return output[safeDir]();
      },
      outputStrings: yeheheOutputStrings,
    },
    // ****** S-RANK: Sansheya ****** //
    {
      id: 'Hunt Sansheya Veil of Heat',
      type: 'StartsUsing',
      netRegex: { id: '9973', source: 'Sansheya', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Hunt Sansheya Halo of Heat',
      type: 'StartsUsing',
      netRegex: { id: '9974', source: 'Sansheya', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Hunt Sansheya Fire\'s Domain',
      type: 'StartsUsing',
      netRegex: { id: '9975', source: 'Sansheya', capture: false },
      infoText: (_data, _matches, output) => output.avoid(),
      outputStrings: {
        avoid: {
          en: 'Avoid Tethered Cleave',
          de: 'Vermeide Verbundene-Kegelangriff',
          fr: 'Évitez le cleave du lien',
          cn: '躲避连线冲锋',
          ko: '돌진 장판 피해요',
        },
      },
    },
    {
      id: 'Hunt Sansheya Twinscorch Left',
      type: 'StartsUsing',
      netRegex: { id: '9AB1', source: 'Sansheya', capture: false },
      durationSeconds: 6.7,
      response: Responses.goRightThenLeft('alert'),
    },
    {
      id: 'Hunt Sansheya Twinscorch Right',
      type: 'StartsUsing',
      netRegex: { id: '9AB2', source: 'Sansheya', capture: false },
      durationSeconds: 6.7,
      response: Responses.goLeftThenRight('alert'),
    },
    {
      id: 'Hunt Sansheya Captive Bolt',
      type: 'StartsUsing',
      netRegex: { id: '9980', source: 'Sansheya' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Hunt Sansheya Culling Blade',
      type: 'StartsUsing',
      netRegex: { id: '997F', source: 'Sansheya', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Hunt Sansheya Pyre of Rebirth',
      type: 'GainsEffect',
      // 102C: Boiling (18s) - applies 3s Pyretic debuff on expiration
      netRegex: { effectId: '102C', source: 'Sansheya' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 6,
      response: Responses.stopMoving(),
    },
    {
      id: 'Hunt Sansheya Twinscorched Halo Left',
      type: 'StartsUsing',
      netRegex: { id: '9979', source: 'Sansheya', capture: false },
      durationSeconds: 7.3,
      alertText: (_data, _matches, output) => output.haloLeft(),
      outputStrings: {
        haloLeft: {
          en: 'Right => Left + In',
          de: 'Rechts => Links + Rein',
          fr: 'Droite => Gauche + Intérieur',
          cn: '右 => 左 + 内',
          ko: '오른쪽 🔜 왼쪽 + 안으로',
        },
      },
    },
    {
      id: 'Hunt Sansheya Twinscorched Halo Right',
      type: 'StartsUsing',
      netRegex: { id: '997B', source: 'Sansheya', capture: false },
      durationSeconds: 7.3,
      alertText: (_data, _matches, output) => output.haloRight(),
      outputStrings: {
        haloRight: {
          en: 'Left => Right + In',
          de: 'Links => Rechts + Rein',
          fr: 'Gauche => Droite + Intérieur',
          cn: '左 => 右 + 内',
          ko: '왼쪽 🔜 오른쪽 + 안으로',
        },
      },
    },
    {
      id: 'Hunt Sansheya Twinscorched Veil Left',
      type: 'StartsUsing',
      netRegex: { id: '997A', source: 'Sansheya', capture: false },
      durationSeconds: 7.3,
      alertText: (_data, _matches, output) => output.veilLeft(),
      outputStrings: {
        veilLeft: {
          en: 'Right => Left + Out',
          de: 'Rechts => Links + Raus',
          fr: 'Droite => Gauche + Extérieur',
          cn: '右 => 左 + 外',
          ko: '오른쪽 🔜 왼쪽 + 바깥으로',
        },
      },
    },
    {
      id: 'Hunt Sansheya Twinscorched Veil Right',
      type: 'StartsUsing',
      netRegex: { id: '997C', source: 'Sansheya', capture: false },
      durationSeconds: 7.3,
      alertText: (_data, _matches, output) => output.veilRight(),
      outputStrings: {
        veilRight: {
          en: 'Left => Right + Out',
          de: 'Links => Rechts + Raus',
          fr: 'Gauche => Droite + Extérieur',
          cn: '左 => 右 + 外',
          ko: '왼쪽 🔜 오른쪽 + 바깥으로',
        },
      },
    },
    // ****** Boss Fate: Ttokrrone ****** //
    // Casts fang/right/left/tail-ward sandspout then turns that way to cleave.
    // This unfortunately rotates the boss if there happens to be a Tempest after...
    {
      id: 'Hunt Ttokrrone Sandspout',
      type: 'StartsUsing',
      netRegex: { id: ['91C1', '91C2', '91C3', '91C4'], source: 'Ttokrrone', capture: true },
      durationSeconds: 6,
      response: (data, matches, output) => {
        const pattern = data.ttokSandOrbPatterns[data.ttokSandOrbOnSet];
        let sandspoutPattern = TtokSafeSpots.Out;
        let awaySide;
        let rotation;
        let dir1 = 'unknown';
        let dir2 = 'unknown';
        // cactbot-builtin-response
        output.responseOutputStrings = ttokrroneTempestSandspoutOutputStrings;
        if (matches.id === '91C1') { // front cleave
          sandspoutPattern = sandspoutPattern & TtokSafeSpots.FrontCleave; // also avoid front
          awaySide = output.front();
          rotation = 0;
        } else if (matches.id === '91C2') { // back cleave
          sandspoutPattern = sandspoutPattern & TtokSafeSpots.BackCleave; // also avoid behind
          awaySide = output.rear();
          rotation = 2;
        } else if (matches.id === '91C3') { // right cleave
          awaySide = output.rightFlank();
          rotation = 1;
        } else { // matches.id === '91C4' - left cleave
          awaySide = output.leftFlank();
          rotation = 3;
        }
        if (pattern === undefined) {
          return {
            infoText: output.awayFrom({ out: output.outOfHitbox(), dir: awaySide }),
          };
        }
        const safeSpot = sandspoutPattern & pattern;
        let backFrontSpot = TtokSafeSpots.All;
        if (safeSpot & TtokSafeSpots.Back) {
          backFrontSpot = TtokSafeSpots.Back;
          dir1 = 'back';
        } else if (safeSpot & TtokSafeSpots.Front) {
          backFrontSpot = TtokSafeSpots.Front;
          dir1 = 'front';
        }
        if (safeSpot & backFrontSpot & TtokSafeSpots.Right) {
          dir2 = 'right';
        } else if (safeSpot & backFrontSpot & TtokSafeSpots.Left) {
          dir2 = 'left';
        }
        data.ttokSandOrbOnSet++;
        data.ttokRotated = rotation;
        return {
          alertText: output.triple({
            inOut: output.outOfHitbox(),
            dir2: output[dir1](),
            dir3: output[dir2](),
          }),
        };
      },
    },
    // The boss does either in; out; in-right + out-left; or out-right + in-left
    // can be combined with sand orbs explosions.
    {
      id: 'Hunt Ttokrrone Desert Tempest',
      type: 'StartsUsing',
      netRegex: { id: ttokrroneDesertTempestIds, source: 'Ttokrrone', capture: true },
      durationSeconds: 7,
      alertText: (data, matches, output) => {
        const tempest = ttokrroneDesertTempest[matches.id];
        if (tempest === undefined)
          throw new UnreachableCode();
        const pattern = data.ttokSandOrbPatterns[data.ttokSandOrbOnSet];
        let inOut = 'unknown';
        let rightLeft = null;
        let backFront = null;
        let backFrontSpot = TtokSafeSpots.All;
        if (tempest & TtokSafeSpots.In) {
          inOut = 'in';
        } else if (tempest & TtokSafeSpots.Out) {
          inOut = 'out';
        }
        // must always be incremented even if the boss rotates
        data.ttokSandOrbOnSet++;
        if (pattern === undefined) {
          return output[inOut]();
        }
        if (tempest === TtokSafeSpots.InRight) {
          rightLeft = 'right';
        } else if (tempest === TtokSafeSpots.InLeft) {
          rightLeft = 'left';
        }
        // if the boss rotates we give up and only call out the Tempest portion.
        if (data.ttokRotated === 0) {
          const safeSpot = tempest & pattern;
          if (safeSpot & TtokSafeSpots.Back) {
            backFrontSpot = TtokSafeSpots.Back;
            backFront = 'back';
          } else if (safeSpot & TtokSafeSpots.Front) {
            backFrontSpot = TtokSafeSpots.Front;
            backFront = 'front';
          }
          // if the tempest was only in or out, but the sand pattern needs right or left
          if (rightLeft === null && !(safeSpot & TtokSafeSpots.Middle)) {
            // we also need to check the other selected direction (front/back)
            if (safeSpot & backFrontSpot & TtokSafeSpots.Right) {
              rightLeft = 'right';
            } else if (safeSpot & backFrontSpot & TtokSafeSpots.Left) {
              rightLeft = 'left';
            }
          }
        }
        if (rightLeft && backFront) {
          return output.triple({
            inOut: output[inOut](),
            dir2: output[rightLeft](),
            dir3: output[backFront](),
          });
        }
        if (rightLeft) {
          return output.double({ inOut: output[inOut](), dir2: output[rightLeft]() });
        }
        if (backFront) {
          return output.double({ inOut: output[inOut](), dir2: output[backFront]() });
        }
        return output[inOut]();
      },
      outputStrings: ttokrroneTempestSandspoutOutputStrings,
    },
    // Aoe
    {
      id: 'Hunt Ttokrrone Touchdown',
      type: 'StartsUsing',
      netRegex: { id: '91DB', source: 'Ttokrrone', capture: false },
      response: Responses.aoe(),
      run: (data) => {
        // Reset everything as orb sequences start with a touchdown.
        data.ttokSandOrbSets = 0;
        data.ttokSandOrbOnSet = 0;
        data.ttokSandOrbs = [];
        data.ttokSandOrbPatterns = [];
        data.ttokRotated = 0;
      },
    },
    // Front cleave, rotates C or CCW and cleaves 4 or 7 times (maybe health dependent?)
    {
      id: 'Hunt Ttokrrone Fangward Dustdevil',
      type: 'StartsUsing',
      netRegex: { id: ['91C9', '91C5'], source: 'Ttokrrone', capture: false },
      durationSeconds: 16,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.outOfHitbox(),
      infoText: (_data, _matches, output) => {
        return output.rotateFront();
      },
      outputStrings: ttokrroneDustdevilOutputStrings,
    },
    // Rear cleave (boss turns to do front cleaves) then rotates C or CCW and cleaves 4 or 7 times (?)
    {
      id: 'Hunt Ttokrrone Tailward Dustdevil',
      type: 'StartsUsing',
      netRegex: { id: ['91CA', '91C6'], source: 'Ttokrrone', capture: false },
      durationSeconds: 16,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.outOfHitbox(),
      infoText: (_data, _matches, output) => {
        return output.rotateRear();
      },
      outputStrings: ttokrroneDustdevilOutputStrings,
    },
    // Dashes around 6 times
    {
      id: 'Hunt Ttokrrone Landswallow',
      type: 'StartsUsing',
      netRegex: { id: '96F2', source: 'Ttokrrone', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.dodge(),
      outputStrings: {
        dodge: {
          en: 'Go to safe side of first dash => move in after',
          de: 'Gehe auf die sichere Seite des ersten Ansturms => geh danach Rein',
          fr: 'Allez du côté sûr après le 1er dash => allez à l\'intérieur ensuite',
          cn: '前往首次冲锋两侧 => 躲进去',
          ko: '첫 돌진의 안전한 곳으로 (나중에 안으로)',
        },
      },
    },
    // The sand spheres cast "Sandburst" to explode. 994E is 2 seconds shorter cast (5.7s)
    {
      id: 'Hunt Ttokrrone Sand Spheres Sandburst',
      type: 'StartsUsing',
      netRegex: { id: ['994D', '994E'], source: 'Sand Sphere', capture: true },
      delaySeconds: (_data, matches) => matches.id === '994E' ? 0 : 2,
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.avoidSpheres(),
      outputStrings: {
        avoidSpheres: {
          en: 'Avoid exploding sand spheres',
          de: 'Weiche explodierenden Sand-Sphären aus',
          fr: 'Évitez les sphères de sables explosives',
          cn: '躲避沙球爆炸',
          ko: '폭발 모래 덩어리 피해요',
        },
      },
    },
    // Orbs summon themselves with "Summoning Sands", is also a smallish ground AOE
    {
      id: 'Hunt Ttokrrone Sand Spheres Summon Collect',
      type: 'StartsUsingExtra',
      netRegex: { id: '96F7', capture: true },
      run: (data, matches) => {
        const tsNow = Date.parse(matches.timestamp);
        const enoughOrbs = data.ttokSandOrbs.length >= 6;
        if (enoughOrbs && Math.abs(tsNow - data.ttokSandOrbsLastSeenTimestamp) >= 1000) {
          // orb sets all spawn at once, if time is not within a second this is the next set.
          data.ttokSandOrbSets++;
          data.ttokSandOrbs = [{ x: parseFloat(matches.x), y: parseFloat(matches.y) }];
        } else {
          if (
            enoughOrbs &&
            data.ttokSandOrbPatterns[data.ttokSandOrbSets] === undefined
          ) {
            data.ttokSandOrbPatterns[data.ttokSandOrbSets] = identifyOrbSafeSpots(
              data.ttokSandOrbs,
            );
          } else if (!enoughOrbs) {
            data.ttokSandOrbs.push({ x: parseFloat(matches.x), y: parseFloat(matches.y) });
          }
        }
        data.ttokSandOrbsLastSeenTimestamp = tsNow;
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Keheniheyamewi': 'Keheniheyamewi',
        'Yehehetoaua\'pyo': 'Yehehetoaua\'pyo',
        'Sansheya': 'Sansheya',
        'Ttokrrone': 'Ttokrrone',
        'Sand Sphere': 'Sandwirbel',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Keheniheyamewi': 'Keheniheyamewi',
        'Yehehetoaua\'pyo': 'Yehehetoaua\'pyo',
        'Sansheya': 'Sansheya',
        'Ttokrrone': 'Ttokrrone',
        'Sand Sphere': 'Sphère de Sable',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Keheniheyamewi': 'ケヘニヘヤメウィ',
        'Yehehetoaua\'pyo': 'エヘヘトーワポ',
        'Sansheya': 'サンシェヤ',
        'Ttokrrone': 'トクローネ',
        'Sand Sphere': '砂球',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Keheniheyamewi': '凯海尼海亚麦尤伊',
        'Yehehetoaua\'pyo': '艾海海陶瓦泡',
        'Sansheya': '山谢亚',
        'Ttokrrone': '得酷热涅',
        'Sand Sphere': '沙球',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Keheniheyamewi': '케헤니헤야메위',
        'Yehehetoaua\'pyo': '예헤헤토와포',
        'Sansheya': '산셰야',
        'Ttokrrone': '토크로네',
        'Sand Sphere': '모래 구체',
      },
    },
  ],
});
