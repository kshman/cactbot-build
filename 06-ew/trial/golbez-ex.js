// These don't seem to be randomized.
// Listing them all in case future BLU players want to call out who the stacks are on.
const headmarkers = {
  voidMeteor: '0158',
  spread: '0178',
  knockback: '01DA',
  flare: '01D9',
  cauterize: '0001',
  partnerStackAbyssalQuasar: '015B',
  healerStackImmolatingShade: '00A1',
  healerStackVoidBlizzardIII: '013E',
  partnerStackVoidAeroIII: '01C3',
};
const arcticAssaultQuadrants = {
  '00': 'nw',
  '01': 'ne',
  '02': 'ne',
  '03': 'se',
  '04': 'sw',
  '05': 'se',
  '06': 'nw',
  '07': 'sw',
};
const galeSphereOutputStrings = {
  middle: Outputs.middle,
  n: Outputs.north,
  e: Outputs.east,
  s: Outputs.south,
  w: Outputs.west,
  unknown: Outputs.unknown,
  dirAndMechanic: {
    en: '${dir} + ${mechanic}',
    de: '${dir} + ${mechanic}',
    fr: '${dir} + ${mechanic}',
    ja: '${dir} + ${mechanic}',
    cn: '${dir} + ${mechanic}',
    ko: '${dir} + ${mechanic}',
  },
  healerGroups: Outputs.healerGroups,
  partnerStack: Outputs.pairStack,
  an: Outputs.arrowS,
  ae: Outputs.arrowW,
  as: Outputs.arrowN,
  aw: Outputs.arrowE,
  amiddle: Outputs.middle,
};
Options.Triggers.push({
  id: 'TheVoidcastDaisExtreme',
  zoneId: ZoneId.TheVoidcastDaisExtreme,
  timelineFile: 'golbez-ex.txt',
  initData: () => {
    return {
      terrastormCount: 0,
      terrastormCombatantDirs: [],
      galeSphereShadows: [],
      galeSphereCasts: [],
      galeSafeSpots: [],
      arcticAssaultMapEffects: [],
      arcticAssaultCount: 0,
      dragonsDescentMarker: [],
    };
  },
  timelineTriggers: [
    {
      id: 'GolbezEx Flames of Eventide 1',
      regex: /Flames of Eventide 1/,
      beforeSeconds: 5,
      suppressSeconds: 5,
      response: Responses.tankCleave(),
    },
  ],
  triggers: [
    {
      id: 'GolbezEx Flames of Eventide Swap',
      type: 'GainsEffect',
      netRegex: { effectId: 'DF5', count: '01' },
      condition: (data, matches) => {
        if (data.me === matches.target)
          return false;
        return data.role === 'tank' || data.job === 'BLU';
      },
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.tankSwap,
      },
    },
    {
      id: 'GolbezEx Terrastorm 1',
      type: 'MapEffect',
      netRegex: { location: '0[89]', flags: '00010004', capture: true },
      alertText: (data, matches, output) => {
        data.terrastormCount++;
        data.terrastormDir = matches.location === '08' ? 'nw' : 'ne';
        // We'll handle this elsewhere to combine with arctic assault.
        if (data.terrastormCount === 2)
          return;
        if (data.options.AutumnStyle) {
          if (data.terrastormDir === 'nw')
            return output.arrowNESW();
          return output.arrowNWSE();
        }
        if (data.terrastormDir === 'nw')
          return output.dirNESW();
        return output.dirNWSE();
      },
      outputStrings: {
        dirNWSE: {
          en: 'NW / SE',
          de: 'NW / SO',
          fr: 'NO / SE',
          ja: '北西 / 南東',
          cn: '左上 (西北) / 右下 (东南)',
          ko: '북서 / 남동',
        },
        dirNESW: {
          en: 'NE / SW',
          de: 'NO / SW',
          fr: 'NE / SO',
          ja: '北東 / 南西',
          cn: '右上 (东北) / 左下 (西南)',
          ko: '북동 / 남서',
        },
        arrowNWSE: {
          en: '🡼🡾',
          ja: '🡼🡾',
          ko: '🡼🡾',
        },
        arrowNESW: {
          en: '🡿🡽',
          ja: '🡿🡽',
          ko: '🡿🡽',
        },
      },
    },
    {
      id: 'GolbezEx Lingering Spark Bait',
      type: 'StartsUsing',
      netRegex: { id: '8468', source: 'Golbez', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Bait Circles',
          de: 'Kreise ködern',
          fr: 'Déposez les cercles',
          ja: 'AOE誘導',
          cn: '集合放圈',
          ko: '장판 모여 깔아요!',
        },
      },
    },
    {
      id: 'GolbezEx Lingering Spark Move',
      type: 'StartsUsing',
      netRegex: { id: '846A', source: 'Golbez', capture: false },
      suppressSeconds: 3,
      response: Responses.moveAway(),
    },
    {
      id: 'GolbezEx Phases of the Blade',
      type: 'StartsUsing',
      netRegex: { id: '86DB', source: 'Golbez', capture: false },
      durationSeconds: 4,
      response: Responses.getBackThenFront('alert'),
    },
    {
      id: 'GolbezEx Phases of the Blade Followup',
      type: 'Ability',
      netRegex: { id: '86DB', source: 'Golbez', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.front(),
      outputStrings: {
        front: Outputs.front,
      },
    },
    {
      id: 'GolbezEx Phases of the Shadow',
      type: 'StartsUsing',
      netRegex: { id: '86E7', source: 'Golbez', capture: false },
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        if (data.recordedShadowMechanic === 'spread')
          return output.backThenFrontThenSpread();
        if (data.recordedShadowMechanic === 'stack')
          return output.backThenFrontThenHealerGroups();
        return output.backThenFront();
      },
      outputStrings: {
        backThenFront: Outputs.backThenFront,
        backThenFrontThenHealerGroups: {
          en: 'Back => Front => Out => Stacks',
          de: 'Hinten => Vorne => Raus => Sammeln',
          fr: 'Derrière => Devant => Extérieur => Package',
          ja: '後ろ => 前 => 外側 => ペア',
          cn: '后 => 前 => 钢铁 => 集合',
          ko: '뒤에서 🔜 앞으로 🔜 밖으로 🔜 뭉쳐요',
        },
        backThenFrontThenSpread: {
          en: 'Back => Front => Under => Spread',
          de: 'Hinten => Vorne => Unter ihn => Verteilen',
          fr: 'Derrière => Devant => Dessous => Écartez-vous',
          ja: '後ろ => 前 => 内側 => 散会',
          cn: '后 => 前 => 月环 => 分散',
          ko: '뒤에서 🔜 앞으로 🔜 밑으로 🔜 흩어져요',
        },
      },
    },
    {
      id: 'GolbezEx Phases of the Shadow Followup',
      type: 'Ability',
      netRegex: { id: '86E7', source: 'Golbez', capture: false },
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.recordedShadowMechanic === 'spread')
          return output.frontThenSpread();
        if (data.recordedShadowMechanic === 'stack')
          return output.frontThenHealerGroups();
        return output.front();
      },
      run: (data) => delete data.recordedShadowMechanic,
      outputStrings: {
        front: Outputs.front,
        frontThenHealerGroups: {
          en: 'Front => Out => Stacks',
          de: 'Vorne => Raus => Sammeln',
          fr: 'Devant => Extérieur => Package',
          ja: '前 => 外側 => ペア',
          cn: '前 => 钢铁 => 集合',
          ko: '앞에서 🔜 밖으로 🔜 뭉쳐요',
        },
        frontThenSpread: {
          en: 'Front => Under',
          de: 'Vorne => Unter ihn',
          fr: 'Devant => Dessous',
          ja: '前 => 内側',
          cn: '前 => 月环',
          ko: '앞에서 🔜 밑으로',
        },
      },
    },
    {
      id: 'GolbezEx Rising Ring Followup',
      type: 'Ability',
      netRegex: { id: '86ED', source: 'Golbez', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.outAndSpread(),
      outputStrings: {
        outAndSpread: {
          en: 'Spread Out',
          de: 'Außen verteilen',
          fr: 'Écartez-vous',
          ja: '散会',
          cn: '分散',
          ko: '흩어져요',
        },
      },
    },
    {
      id: 'GolbezEx Binding Cold',
      type: 'StartsUsing',
      netRegex: { id: '84B3', source: 'Golbez', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'GolbezEx Void Meteor',
      type: 'StartsUsing',
      netRegex: { id: '84AD', source: 'Golbez', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: Outputs.tankBusters,
      },
    },
    {
      id: 'GolbezEx Black Fang',
      type: 'StartsUsing',
      netRegex: { id: '8471', source: 'Golbez', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'GolbezEx Abyssal Quasar',
      type: 'StartsUsing',
      netRegex: { id: '84AB', source: 'Golbez', capture: false },
      suppressSeconds: 3,
      alertText: (_data, _matches, output) => output.partnerStack(),
      outputStrings: {
        partnerStack: Outputs.pairStack,
      },
    },
    {
      id: 'GolbezEx Eventide Triad',
      type: 'StartsUsing',
      netRegex: { id: '8480', source: 'Golbez', capture: false },
      alertText: (_data, _matches, output) => output.rolePositions(),
      outputStrings: {
        rolePositions: {
          en: 'Role positions',
          de: 'Rollenposition',
          fr: 'Positions par rôle',
          ja: 'ロール散会',
          cn: '去指定位置',
          ko: '롤 포지션으로',
        },
      },
    },
    {
      id: 'GolbezEx Eventide Fall',
      type: 'StartsUsing',
      netRegex: { id: '8485', source: 'Golbez', capture: false },
      suppressSeconds: 3,
      alertText: (_data, _matches, output) => output.healerGroups(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'GolbezEx Azdaja\'s Shadow Out Tell',
      type: 'StartsUsing',
      netRegex: { id: '8478', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.recordedShadowMechanic = 'stack',
      outputStrings: {
        text: {
          en: '(out + healer groups, for later)',
          de: '(raus + Heiler Gruppen, für später)',
          fr: '(extérieur + groupes sur les heals, pour après)',
          ja: '(外 + 後でヒーラと4:4頭割り)',
          cn: '(钢铁 + 稍后治疗分组分摊)',
          ko: '(밖에서 + 4:4힐러)',
        },
      },
    },
    {
      id: 'GolbezEx Azdaja\'s Shadow In Tell',
      type: 'StartsUsing',
      netRegex: { id: '8479', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.recordedShadowMechanic = 'spread',
      outputStrings: {
        text: {
          en: '(in + spread, for later)',
          de: '(rein + verteilen, für später)',
          fr: '(intérieur + dispersion, pour après)',
          ja: '(中 + 後で散会)',
          cn: '(月环 + 稍后分散)',
          ko: '(안으로 + 흩어져요)',
        },
      },
    },
    {
      id: 'GolbezEx Void Tornado / Void Aero III',
      type: 'StartsUsing',
      // 845C = Void Aero III (partner stacks)
      // 845D = Void Tornado (healer stacks)
      netRegex: { id: '845[CD]', source: 'Golbez' },
      suppressSeconds: 30,
      run: (data, matches) => {
        if (matches.id === '845D') {
          data.firstGaleMechanic = 'healer';
          data.secondGaleMechanic = 'partner';
        } else {
          data.firstGaleMechanic = 'partner';
          data.secondGaleMechanic = 'healer';
        }
      },
    },
    {
      id: 'GolbezEx Gale Sphere Collector',
      type: 'StartsUsing',
      netRegex: { id: '845[89AB]', source: 'Gale Sphere', capture: true },
      run: (data, matches) => {
        data.galeSafeSpots = [];
        data.galeSphereCasts.push({
          x: parseFloat(matches.x),
          y: parseFloat(matches.y),
          castTime: parseFloat(matches.castTime),
        });
      },
    },
    {
      id: 'GolbezEx Gale Sphere Directions',
      type: 'Ability',
      netRegex: { id: '84(?:4F|50|51|52)', source: 'Golbez\'s Shadow', capture: true },
      infoText: (data, matches, output) => {
        if (data.options.AutumnStyle) {
          switch (matches.id) {
            case '844F':
              data.galeSphereShadows.push('an');
              break;
            case '8450':
              data.galeSphereShadows.push('ae');
              break;
            case '8451':
              data.galeSphereShadows.push('aw');
              break;
            case '8452':
              data.galeSphereShadows.push('as');
              break;
          }
          if (data.galeSphereShadows.length < 4)
            return;
          const [d1, d2, d3, d4] = data.galeSphereShadows;
          return output.aclones({ d1: d1, d2: d2, d3: d3, d4: d4 });
        }
        switch (matches.id) {
          case '844F':
            data.galeSphereShadows.push('n');
            break;
          case '8450':
            data.galeSphereShadows.push('e');
            break;
          case '8451':
            data.galeSphereShadows.push('w');
            break;
          case '8452':
            data.galeSphereShadows.push('s');
            break;
        }
        if (data.galeSphereShadows.length < 4)
          return;
        const [dir1, dir2, dir3, dir4] = data.galeSphereShadows;
        return output.clones({
          dir1: dir1,
          dir2: dir2,
          dir3: dir3,
          dir4: dir4,
        });
      },
      run: (data) => data.galeSphereShadows = [],
      outputStrings: {
        n: Outputs.dirN,
        e: Outputs.dirE,
        s: Outputs.dirS,
        w: Outputs.dirW,
        unknown: Outputs.unknown,
        clones: {
          en: 'Clones: ${dir1}->${dir2}->${dir3}->${dir4}',
          de: 'Klone: ${dir1}->${dir2}->${dir3}->${dir4}',
          fr: 'Clones : ${dir1}->${dir2}->${dir3}->${dir4}',
          ja: '分身: ${dir1}->${dir2}->${dir3}->${dir4}',
          cn: '分身：${dir1}->${dir2}->${dir3}->${dir4}',
          ko: '분신: ${dir1}->${dir2}->${dir3}->${dir4}',
        },
        an: Outputs.arrowN,
        ae: Outputs.arrowE,
        as: Outputs.arrowS,
        aw: Outputs.arrowW,
        aclones: {
          en: '${d1} ${d2} ${d3} ${d4}',
          ja: '${d1} ${d2} ${d3} ${d4}',
          ko: '${d1} ${d2} ${d3} ${d4}',
        },
      },
    },
    {
      id: 'GolbezEx Gale Safe Spots',
      type: 'StartsUsing',
      netRegex: { id: '845[89AB]', source: 'Gale Sphere', capture: false },
      condition: (data) => data.galeSphereCasts.length === 16,
      durationSeconds: 15,
      infoText: (data, _matches, output) => {
        const order = [];
        const safeSpots = {
          n: 'unknown',
          e: 'unknown',
          s: 'unknown',
          w: 'unknown',
        };
        data.galeSphereCasts.sort((left, right) => {
          return left.castTime - right.castTime;
        });
        data.galeSphereCasts.forEach((sphere) => {
          let dir;
          if (sphere.x > 113)
            dir = 'e';
          else if (sphere.y > 113)
            dir = 's';
          else if (sphere.x < 87)
            dir = 'w';
          else
            dir = 'n';
          if (!order.includes(dir))
            order.push(dir);
        });
        const sphereDirections = {
          n: data.galeSphereCasts.filter((sphere) => sphere.y < 87),
          e: data.galeSphereCasts.filter((sphere) => sphere.x > 113),
          s: data.galeSphereCasts.filter((sphere) => sphere.y > 113),
          w: data.galeSphereCasts.filter((sphere) => sphere.x < 87),
        };
        const possibleDirs = ['n', 'e', 's', 'w'];
        for (const dir of possibleDirs) {
          const spheres = sphereDirections[dir];
          const key = ['n', 's'].includes(dir) ? 'x' : 'y';
          // For these, there are 6 possible cast locations, of which 4 will be present
          // We only need to check three of the six to determine the safe spot
          // All of these coordinates are 0.50 higher. To avoid floating point issues
          // we're just using the floor'd coordinates.
          const possibleSpots = {
            112: ['s', 'e'],
            102: ['middle'],
            87: ['n', 'w'],
          };
          for (const sphere of spheres) {
            delete possibleSpots[Math.floor(sphere[key])];
          }
          const remainingSpots = Object.values(possibleSpots);
          const spot = remainingSpots[0];
          if (remainingSpots.length > 1 || !spot)
            continue;
          let finalSpot = 'unknown';
          if (spot[0] === 'middle')
            finalSpot = 'middle';
          else
            finalSpot = key === 'y' ? spot[0] : spot[1];
          safeSpots[dir] = finalSpot ?? 'unknown';
        }
        data.galeSafeSpots = [];
        for (const dir of order)
          data.galeSafeSpots.push(safeSpots[dir]);
        data.galeSphereCasts = [];
        if (data.options.AutumnStyle) {
          const dirs = data.galeSafeSpots.map((x) => output[`a${x}`]());
          return dirs.join(' ');
        }
        const [dir1, dir2, dir3, dir4] = data.galeSafeSpots.map((x) => output[x]());
        if (dir1 === undefined || dir2 === undefined || dir3 === undefined || dir4 === undefined)
          return;
        return output.safeSpotList({ dir1: dir1, dir2: dir2, dir3: dir3, dir4: dir4 });
      },
      outputStrings: {
        safeSpotList: {
          en: '${dir1} => ${dir2} => ${dir3} => ${dir4}',
          de: '${dir1} => ${dir2} => ${dir3} => ${dir4}',
          fr: '${dir1} => ${dir2} => ${dir3} => ${dir4}',
          ja: '${dir1} => ${dir2} => ${dir3} => ${dir4}',
          cn: '${dir1} => ${dir2} => ${dir3} => ${dir4}',
          ko: '${dir1} 🔜 ${dir2} 🔜 ${dir3} 🔜 ${dir4}',
        },
        ...galeSphereOutputStrings,
      },
    },
    {
      id: 'GolbezEx Gale Initial Safe Spot',
      type: 'StartsUsing',
      netRegex: { id: '845[89AB]', source: 'Gale Sphere', capture: false },
      condition: (data) => data.galeSafeSpots.length === 4,
      alertText: (data, _matches, output) => {
        const spot = data.galeSafeSpots.shift();
        if (spot === undefined)
          return;
        const dir = output[spot]();
        const mech = data.firstGaleMechanic;
        delete data.firstGaleMechanic;
        if (mech === undefined)
          return dir;
        const mechanicStr = mech === 'partner' ? output.partnerStack() : output.healerGroups();
        return output.dirAndMechanic({ dir: dir, mechanic: mechanicStr });
      },
      outputStrings: galeSphereOutputStrings,
    },
    {
      id: 'GolbezEx Arctic Assault Collector',
      type: 'MapEffect',
      netRegex: { location: '0[0-7]', flags: '00020001' },
      run: (data, matches) => {
        delete data.arcticAssaultSafeSpots;
        data.arcticAssaultMapEffects.push(matches.location);
        if (data.arcticAssaultMapEffects.length < 2)
          return;
        // 1 = Gale Sphere 1
        // 2 = Terrastorm 2
        // 3 = Gale Sphere 2
        // 4 = Gale Sphere 3
        data.arcticAssaultCount++;
        const safe = ['nw', 'ne', 'sw', 'se'];
        data.arcticAssaultSafeSpots = safe.filter((quadrant) => {
          for (const slot of data.arcticAssaultMapEffects) {
            if (arcticAssaultQuadrants[slot] === quadrant)
              return false;
          }
          return true;
        });
        data.arcticAssaultMapEffects = [];
      },
    },
    {
      id: 'GolbezEx Terrastorm 2',
      // The terrastorm meteors come out before the arctic assault, and so wait for them.
      type: 'MapEffect',
      netRegex: { location: '0[0-7]', flags: '00020001', capture: false },
      condition: (data) => {
        return data.arcticAssaultCount === 2 && data.arcticAssaultSafeSpots !== undefined;
      },
      alertText: (data, _matches, output) => {
        const [safe1, safe2] = data.arcticAssaultSafeSpots ?? [];
        const terrastormDir = data.terrastormDir;
        if (terrastormDir === undefined || safe1 === undefined || safe2 === undefined)
          return;
        const isSafe1Safe = terrastormDir === 'nw' && safe1 !== 'nw' && safe1 !== 'se' ||
          terrastormDir === 'ne' && safe1 !== 'ne' && safe1 !== 'sw';
        const isSafe2Safe = terrastormDir === 'nw' && safe2 !== 'nw' && safe2 !== 'se' ||
          terrastormDir === 'ne' && safe2 !== 'ne' && safe2 !== 'sw';
        if (isSafe1Safe && isSafe2Safe || !isSafe1Safe && !isSafe2Safe)
          return;
        if (data.options.AutumnStyle) {
          const arr = {
            ne: output.ane(),
            se: output.ase(),
            sw: output.asw(),
            nw: output.anw(),
          }[isSafe1Safe ? safe1 : safe2];
          return output.atext({ dir: arr });
        }
        const dir = {
          ne: output.northeast(),
          se: output.southeast(),
          sw: output.southwest(),
          nw: output.northwest(),
        }[isSafe1Safe ? safe1 : safe2];
        return output.text({ dir: dir });
      },
      outputStrings: {
        text: {
          en: '${dir} => Healer Groups',
          de: '${dir} => Heiler Gruppen',
          fr: '${dir} => Groupe sur les heals',
          ja: '${dir} => ヒーラと4:4頭割り',
          cn: '${dir} => 治疗分组分摊',
          ko: '${dir} 🔜 4:4 힐러',
        },
        northeast: Outputs.northeast,
        southeast: Outputs.southeast,
        southwest: Outputs.southwest,
        northwest: Outputs.northwest,
        ane: Outputs.arrowNE,
        ase: Outputs.arrowSE,
        asw: Outputs.arrowSW,
        anw: Outputs.arrowNW,
        atext: {
          en: '${dir} Healer Groups',
          ko: '${dir} 4:4 힐러',
        },
      },
    },
    {
      id: 'GolbezEx Gale Sphere Followup Safe Spots',
      type: 'Ability',
      netRegex: { id: '845[89AB]', source: 'Gale Sphere', capture: false },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const spot = data.galeSafeSpots.shift();
        if (spot === undefined)
          return;
        const nextSpot = data.galeSafeSpots[0] ?? 'unknown';
        // Safe spot 2 with arctic assault.
        if (data.galeSafeSpots.length === 2 && data.arcticAssaultSafeSpots !== undefined) {
          if (spot === 'w' && data.arcticAssaultSafeSpots.includes('nw'))
            return output.northwest();
          if (spot === 'w' && data.arcticAssaultSafeSpots.includes('sw'))
            return output.southwest();
          if (spot === 'e' && data.arcticAssaultSafeSpots.includes('ne'))
            return output.northeast();
          if (spot === 'e' && data.arcticAssaultSafeSpots.includes('se'))
            return output.southeast();
          // If in the middle, try to steer people towards the next safe spot.
          if (spot === 'middle') {
            if (nextSpot === 'n') {
              if (data.arcticAssaultSafeSpots.includes('nw'))
                return output.middleLean({ dir: output.dirNW() });
              if (data.arcticAssaultSafeSpots.includes('ne'))
                return output.middleLean({ dir: output.dirNE() });
            } else if (nextSpot === 's') {
              if (data.arcticAssaultSafeSpots.includes('sw'))
                return output.middleLean({ dir: output.dirSW() });
              if (data.arcticAssaultSafeSpots.includes('se'))
                return output.middleLean({ dir: output.dirSE() });
            }
          }
        }
        // Safe spot 3.
        const dir = output[spot]();
        if (data.galeSafeSpots.length > 0)
          return dir;
        // Safe spot 4
        const mech = data.secondGaleMechanic;
        delete data.secondGaleMechanic;
        if (mech === undefined)
          return dir;
        const mechanicStr = mech === 'partner' ? output.partnerStack() : output.healerGroups();
        return output.dirAndMechanic({ dir: dir, mechanic: mechanicStr });
      },
      outputStrings: {
        ...galeSphereOutputStrings,
        northwest: Outputs.northwest,
        northeast: Outputs.northeast,
        southwest: Outputs.southwest,
        southeast: Outputs.southeast,
        dirNW: Outputs.dirNW,
        dirNE: Outputs.dirNE,
        dirSW: Outputs.dirSW,
        dirSE: Outputs.dirSE,
        middleLean: {
          en: 'Middle (lean ${dir})',
          de: 'Mitte (${dir} halten)',
          fr: 'Milieu (côté ${dir})',
          ja: '真ん中 (すこし${dir})',
          cn: '中间 (偏 ${dir})',
          ko: '한가운데 (약간 ${dir})',
        },
      },
    },
    {
      id: 'GolbezEx Knockback Headmarker',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.knockback },
      alarmText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text();
      },
      run: (data, matches) => data.dragonsDescentMarker.push(matches.target),
      outputStrings: {
        text: {
          en: 'Knockback on YOU',
          de: 'Rückstoß auf DIR',
          fr: 'Poussée sur VOUS',
          ja: '自分にノックバック',
          cn: '击退点名',
          ko: '내게 넉백!',
        },
      },
    },
    {
      id: 'GolbezEx Flare Headmarker',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.flare },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text();
      },
      run: (data, matches) => data.dragonsDescentMarker.push(matches.target),
      outputStrings: {
        text: {
          en: 'Flare on YOU',
          de: 'Flare auf DIR',
          fr: 'Brasier sur VOUS',
          ja: '自分にフレア',
          cn: '陨石点名',
          ko: '내게 플레어!',
        },
      },
    },
    {
      id: 'GolbezEx No Headmarker',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.flare, capture: false },
      condition: (data) => data.dragonsDescentMarker.length === 3,
      infoText: (data, _matches, output) => {
        if (!data.dragonsDescentMarker.includes(data.me))
          return output.text();
      },
      run: (data) => data.dragonsDescentMarker = [],
      outputStrings: {
        text: {
          en: 'Get Tower',
          de: 'Nimm Turm',
          fr: 'Prenez une tour',
          ja: '塔踏み',
          cn: '踩塔',
          ko: '타워 밟아요',
        },
      },
    },
    {
      id: 'GolbezEx PR 아즈그림자 페이크',
      type: 'StartsUsing',
      netRegex: { id: '86FF', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.prsShadow = 'none',
      outputStrings: {
        text: {
          en: '(Fake)',
          ko: '(이거 페이크)',
        },
      },
    },
    {
      id: 'GolbezEx PR 아즈그림자 끗',
      type: 'StartsUsing',
      netRegex: { id: '84B9', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.prsShadow = 'none',
      outputStrings: {
        text: {
          en: '(Enrage soon)',
          ko: '(이제 곧 끝)',
        },
      },
    },
    {
      id: 'GolbezEx PR 아즈그림자 밖힐러',
      type: 'StartsUsing',
      netRegex: { id: '8478', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.prsShadow = 'out',
      outputStrings: {
        text: {
          en: 'Out 🡺 Healer Groups',
          ko: '밖으로 🡺 4:4 힐러',
        },
      },
    },
    {
      id: 'GolbezEx PR 아즈그림자 안흩어',
      type: 'StartsUsing',
      netRegex: { id: '8479', source: 'Golbez', capture: false },
      infoText: (_data, _matches, output) => output.text(),
      run: (data) => data.prsShadow = 'in',
      outputStrings: {
        text: {
          en: 'In 🡺 Protean',
          ko: '안으로 🡺 프로틴',
        },
      },
    },
    {
      id: 'GolbezEx PR Phases of the Shadow',
      type: 'StartsUsing',
      netRegex: { id: '86E7', source: 'Golbez', capture: false },
      alertText: (data, _matches, output) => {
        if (data.prsShadow === 'in')
          return output.pin();
        if (data.prsShadow === 'out')
          return output.pout();
        return output.text();
      },
      outputStrings: {
        text: {
          en: 'Behind 🡺 Front',
          ko: '뒤로 갔다 🡺 앞으로',
        },
        pin: {
          en: 'Behind 🡺 In+Front 🡺 Protean',
          ko: '뒤에서 🡺 안쪽+앞으로 🡺 프로틴',
        },
        pout: {
          en: 'Behind 🡺 Out+Front 🡺 Healer Groups',
          ko: '뒤에서 🡺 밖으로+앞으로 🡺 4:4 힐러',
        },
      },
    },
    {
      id: 'GolbezEx PR Void Stardust',
      type: 'StartsUsing',
      netRegex: { id: '84A4', source: 'Golbez', capture: false },
      alertText: (_data, _matches, output) => output.text(),
      outputStrings: {
        text: {
          en: 'Meteors',
          ko: '돌 떨어져요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Eventide Fall/Eventide Triad': 'Eventide Fall/Triad',
        'Void Aero III/Void Tornado': 'Void Aero III/Tornado',
        'Void Tornado/Void Aero III': 'Void Tornado/Aero III',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Gale Sphere': 'Windsphäre',
        'Golbez': 'Golbez',
        'Shadow Dragon': 'Schattendrache',
      },
      'replaceText': {
        '\\(Enrage\\)': '(Finalangriff)',
        '\\(big\\)': '(Groß)',
        '\\(small\\)': '(Klein)',
        '\\(light parties\\)': '(Leichter Trupp)',
        '\\(spread\\)': '(Verteilen)',
        '\\(explode\\)': '(Explodieren)',
        '\\(snapshot\\)': '(Speichern)',
        '\\(back\\)': '(Hinten)',
        '\\(cast\\)': '(Aktivierung)',
        '\\(front\\)': '(Vorne)',
        '\\(out\\)': '(Raus)',
        '\\(record\\)': '(Merken)',
        '\\(under\\)': '(Unter)',
        '\\(hit\\)': '(Treffer)',
        '\\(preview\\)': '(Vorschau)',
        'Abyssal Quasar': 'Abyssus-Nova',
        'Arctic Assault': 'Frostschuss',
        'Azdaja\'s Shadow': 'Azdajas Schatten',
        'Binding Cold': 'Eisfessel',
        'Black Fang': 'Schwarze Fänge',
        'Cauterize': 'Kauterisieren',
        'Double Meteor': 'Doppel-Meteo',
        'Dragon\'s Descent': 'Fallender Drache',
        'Eventide Fall': 'Gebündelte Abendglut',
        'Eventide Triad': 'Dreifache Abendglut',
        'Explosion': 'Explosion',
        'Flames of Eventide': 'Flammen des Abendrots',
        'Gale Sphere': 'Windsphäre',
        'Immolating Shade': 'Äschernder Schatten',
        'Lingering Spark': 'Lauernder Funke',
        'Phases of the Blade': 'Sichelsturm',
        'Phases of the Shadow': 'Schwarzer Sichelsturm',
        'Rising Beacon': 'Hohes Fanal',
        'Rising Ring': 'Hoher Zirkel',
        'Terrastorm': 'Irdene Breitseite',
        'Void Aero III': 'Nichts-Windga',
        'Void Blizzard III': 'Nichts-Eisga',
        'Void Comet': 'Nichts-Komet',
        'Void Meteor': 'Nichts-Meteo',
        'Void Stardust': 'Nichts-Sternenstaub',
        'Void Tornado': 'Nichtstornado',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Gale Sphere': 'Sphères de vent ténébreux',
        'Golbez': 'Golbez',
        'Shadow Dragon': 'dragonne obscure',
      },
      'replaceText': {
        '\\(Enrage\\)': '(Enrage)',
        '\\(big\\)': '(Gros)',
        '\\(small\\)': '(Petit)',
        '\\(light parties\\)': '(Petit groupe)',
        '\\(spread\\)': '(Écartement)',
        '\\(explode\\)': '(Explosion)',
        '\\(snapshot\\)': '(Sauvegarde)',
        '\\(back\\)': '(Arrière)',
        '\\(cast\\)': '(Incantation)',
        '\\(front\\)': '(Devant)',
        '\\(out\\)': '(Extérieur)',
        '\\(record\\)': '(Enregistrement)',
        '\\(under\\)': '(Dessous)',
        '\\(hit\\)': '(Frappe)',
        '\\(preview\\)': '(Aperçu)',
        'Abyssal Quasar': 'Quasar abyssal',
        'Arctic Assault': 'Assaut arctique',
        'Azdaja\'s Shadow': 'Ombre d\'Azdaja',
        'Binding Cold': 'Geôle glaciale',
        'Black Fang': 'Croc obscur',
        'Cauterize': 'Cautérisation',
        'Double Meteor': 'Météore double',
        'Dragon\'s Descent': 'Descente draconique',
        'Eventide Fall': 'Éclat crépusculaire concentré',
        'Eventide Triad': 'Triple éclat crépusculaire',
        'Explosion': 'Explosion',
        'Flames of Eventide': 'Flammes du crépuscule',
        'Gale Sphere': 'Sphères de vent ténébreux',
        'Immolating Shade': 'Ombre incandescente',
        'Lingering Spark': 'Étincelle persistante',
        'Phases of the Blade': 'Taillade demi-lune',
        'Phases of the Shadow': 'Taillade demi-lune obscure',
        'Rising Beacon': 'Flambeau ascendant',
        'Rising Ring': 'Anneau ascendant',
        'Terrastorm': 'Aérolithe flottant',
        'Void Aero III': 'Méga Vent du néant',
        'Void Blizzard III': 'Méga Glace du néant',
        'Void Comet': 'Comète du néant',
        'Void Meteor': 'Météore du néant',
        'Void Stardust': 'Pluie de comètes du néant',
        'Void Tornado': 'Tornade du néant',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Gale Sphere': 'ウィンドスフィア',
        'Golbez': 'ゴルベーザ',
        'Shadow Dragon': '黒竜',
      },
      'replaceText': {
        'Abyssal Quasar': 'アビスクエーサー',
        'Arctic Assault': 'コールドブラスト',
        'Azdaja\'s Shadow': '黒竜剣アジュダヤ',
        'Binding Cold': '呪縛の冷気',
        'Black Fang': '黒い牙',
        'Cauterize': 'カータライズ',
        'Double Meteor': 'ダブルメテオ',
        'Dragon\'s Descent': '降竜爆火',
        'Eventide Fall': '集束黒竜閃',
        'Eventide Triad': '三連黒竜閃',
        'Explosion': '爆発',
        'Flames of Eventide': '黒竜炎',
        'Gale Sphere': 'ウィンドスフィア',
        'Immolating Shade': '重黒炎',
        'Lingering Spark': 'ディレイスパーク',
        'Phases of the Blade': '弦月連剣',
        'Phases of the Shadow': '弦月黒竜連剣',
        'Rising Beacon': '昇竜烽火',
        'Rising Ring': '昇竜輪火',
        'Terrastorm': 'ディレイアース',
        'Void Aero III': 'ヴォイド・エアロガ',
        'Void Blizzard III': 'ヴォイド・ブリザガ',
        'Void Comet': 'ヴォイド・コメット',
        'Void Meteor': 'ヴォイド・メテオ',
        'Void Stardust': 'ヴォイド・コメットレイン',
        'Void Tornado': 'ヴォイド・トルネド',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Gale Sphere': '风球',
        'Golbez': '高贝扎',
        'Shadow Dragon': '黑龙',
      },
      'replaceText': {
        '\\(Enrage\\)': '(狂暴)',
        '\\(big\\)': '(大)',
        '\\(small\\)': '(小)',
        '\\(light parties\\)': '(四四分组)',
        '\\(spread\\)': '(分散)',
        '\\(explode\\)': '(爆炸)',
        '\\(snapshot\\)': '(快照)',
        '\\(back\\)': '(后)',
        '\\(cast\\)': '(咏唱)',
        '\\(front\\)': '(前)',
        '\\(out\\)': '(外)',
        '\\(record\\)': '(记录)',
        '\\(under\\)': '(下方)',
        '\\(hit\\)': '(打击)',
        '\\(preview\\)': '(预览)',
        'Abyssal Quasar': '深渊类星体',
        'Arctic Assault': '极寒突袭',
        'Azdaja\'s Shadow': '黑龙剑阿珠达雅',
        'Binding Cold': '咒缚寒气',
        'Black Fang': '黑牙',
        'Burning Shade': '黑炎',
        'Cauterize': '黑炎俯冲',
        'Double Meteor': '双重陨石',
        'Dragon\'s Descent': '降龙爆火',
        'Eventide Fall': '集束黑龙闪',
        'Eventide Triad': '三连黑龙闪',
        'Explosion': '爆炸',
        'Flames of Eventide': '黑龙炎',
        'Gale Sphere': '风晶球',
        'Immolating Shade': '重黑炎',
        'Lingering Spark': '迟缓电火花',
        'Phases of the Blade': '弦月连剑',
        'Phases of the Shadow': '弦月黑龙连剑',
        'Rising Beacon': '升龙烽火',
        'Rising Ring': '升龙环火',
        'Terrastorm': '迟缓地暴',
        'Void Aero III': '虚空暴风',
        'Void Blizzard III': '虚空冰封',
        'Void Comet': '虚空彗星',
        'Void Meteor': '虚空陨石',
        'Void Stardust': '虚空彗星雨',
        'Void Tornado': '虚空龙卷',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Gale Sphere': '바람 구체',
        'Golbez': '골베자',
        'Shadow Dragon': '흑룡',
      },
      'replaceText': {
        '\\(big\\)': '(큰)',
        '\\(small\\)': '(작은)',
        '\\(light parties\\)': '(4-4 쉐어)',
        '\\(spread\\)': '(산개)',
        '\\(explode\\)': '(폭발)',
        '\\(snapshot\\)': '(시전)',
        '\\(back\\)': '(뒤)',
        '\\(cast\\)': '(시전)',
        '\\(front\\)': '(앞)',
        '\\(out\\)': '(밖)',
        '\\(under\\)': '(밑)',
        '\\(hit\\)': '(폭발)',
        '\\(preview\\)': '(예고)',
        'Abyssal Quasar': '심연의 퀘이사',
        'Arctic Assault': '냉기 작렬',
        'Azdaja\'s Shadow': '흑룡검 아주다야',
        'Binding Cold': '주박의 냉기',
        'Black Fang': '검은 이빨',
        'Burning Shade': '흑염',
        'Burning/Immolating Shade': '흑염/중흑염',
        'Cauterize': '인두질',
        'Double Meteor': '더블 메테오',
        'Dragon\'s Descent': '강룡폭화',
        'Eventide Fall': '집속 흑룡섬',
        'Eventide Triad': '삼연속 흑룡섬',
        'Explosion': '폭발',
        'Flames of Eventide': '흑룡염',
        'Gale Sphere': '바람 구체',
        '(?<!/)Immolating Shade': '중흑염',
        'Lingering Spark': '잔존 벼락',
        'Phases of the Blade': '연속 현월검',
        'Phases of the Shadow': '연속 현월 흑룡검',
        'Rising Beacon': '승룡봉화',
        'Rising Ring': '승룡륜화',
        'Terrastorm': '잔존 암석',
        'Void Aero III': '보이드 에어로가',
        'Void Blizzard III': '보이드 블리자가',
        'Void Comet': '보이드 혜성',
        'Void Meteor': '보이드 메테오',
        'Void Stardust': '보이드 혜성우',
        'Void Tornado': '보이드 토네이도',
      },
    },
  ],
});
