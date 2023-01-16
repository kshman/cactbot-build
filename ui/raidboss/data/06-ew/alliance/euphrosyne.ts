import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Nophica Blueblossoms/Giltblossoms; they get 018E/018F/0190/0191/0192/0193 markers, but how to know colors?
//       No map effects, and getCombatants has the combatants, but OverlayPlugin info all the same.
// TODO: Nymeia & Althyk Hydrostasis have inconsistent positions? should this be getCombatants??
// TODO: Halone Cheimon counter-clock is 7D6B, is clock 7D6A??
// TODO: Halone Lochos positions
// TODO: Menphina could use map effects for Love's Light + Full Bright 4x moon locations

// TODO: Menphina Midnight Frost + Waxing Claw + Playful Orbit
// 7BCB Midnight Frost = front cleave (7BCD damage) [first phase only]
// 7BCC Midnight Frost = back cleave (7BCE damage) [first phase only]
// 7BCF Midnight Frost = ??? (7BD1 damage)
// 7BD0 Midnight Frost = back cleave (7BD2 damage) [dog attached, during 4x Love's Light, facing west]
// 7BD7 Midnight Frost = front cleave (7BDD damage) [dog attached, facing southeast or north?]
// 7BD8 Midnight Frost = front cleave (7BDD damage) [dog attached, facing south or northwest?]
// 7BD9 Midnight Frost = back cleave (7BDE damage) [dog attached, facing south]
// 7BDA Midnight Frost = back cleave (7BDE damage) [dog attached, facing southeast or north?]
// 7BE4 Midnight Frost = ??? (7BDA damage)
// 7BE5 Midnight Frost = ??? (7BDA damage)
// 7BE6 Midnight Frost = back cleave (7BDB damage) [dog unattached, facing north]
// 7BE7 Midnight Frost = back cleave (7BDB damage) [dog unattached, facing north]
// 7F0A Midnight Frost = front cleave (7BDA damage) [dog unattached, facing north]
// 7F0B Midnight Frost = ??? (7BDA damage)
// 7F0C Midnight Frost = back cleave (7BDB damage) [dog unattached, facing south]
// 7F0D Midnight Frost = back cleave (7BDB damage) [dog unattached, facing south]
// 7BE0 Waxing Claw = right claw [both attached and unattached]
// 7BE1 Waxing Claw = left claw [both attached and unattached]
// 7BE2 Playful Orbit = jump NE
// 7BE3 Playful Orbit = jump NW / jump SE?

export type NophicaMarch = 'front' | 'back' | 'left' | 'right';
export type HaloneTetra = 'out' | 'in' | 'left' | 'right' | 'unknown';

export interface Data extends RaidbossData {
  nophicaMarch?: NophicaMarch;
  nophicaHeavensEarthTargets: string[];
  nymeiaSpinnerOutput?: string;
  nymeiaHydrostasis: NetMatches['StartsUsing'][];
  haloneTetrapagos: HaloneTetra[];
  haloneSpearsThreeTargets: string[];
  haloneIceDartTargets: string[];
  menphinaLunarKissTargets: string[];
}

const tetraMap: { [id: string]: HaloneTetra } = {
  '7D46': 'out',
  '7D47': 'in',
  '7D48': 'left',
  '7D49': 'right',
} as const;

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.Euphrosyne,
  timelineFile: 'euphrosyne.txt',
  initData: () => {
    return {
      nophicaHeavensEarthTargets: [],
      nymeiaHydrostasis: [],
      haloneTetrapagos: [],
      haloneSpearsThreeTargets: [],
      haloneIceDartTargets: [],
      menphinaLunarKissTargets: [],
    };
  },
  triggers: [
    {
      id: 'Euphrosyne Nophica Abundance',
      type: 'StartsUsing',
      netRegex: { id: '7C24', source: 'Nophica', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Nophica The Giving Land Spring Flowers',
      type: 'StartsUsing',
      netRegex: { id: '801A', source: 'Nophica', capture: false },
      alertText: (data, _matches, output) => {
        if (data.nophicaMarch === undefined)
          return output.out!();
        return {
          'front': output.outWithForwards!(),
          'back': output.outWithBackwards!(),
          'left': output.outWithLeft!(),
          'right': output.outWithRight!(),
        }[data.nophicaMarch];
      },
      outputStrings: {
        out: Outputs.out,
        outWithForwards: {
          en: '강제이동: 앞 🡺 밖으로',
          de: 'Geisterlenkung Vorwärts Raus',
        },
        outWithBackwards: {
          en: '강제이동: 뒤 🡺 밖으로',
          de: 'Geisterlenkung Rückwärts Raus',
        },
        outWithLeft: {
          en: '강제이동: 왼쪽 🡺 밖으로',
          de: 'Geisterlenkung Links Raus',
        },
        outWithRight: {
          en: '강제이동: 오른쪽 🡺 밖으로',
          de: 'Geisterlenkung Rechts Raus',
        },
      },
    },
    {
      id: 'Euphrosyne Nophica The Giving Land Summer Shade',
      type: 'StartsUsing',
      netRegex: { id: '8018', source: 'Nophica', capture: false },
      alertText: (data, _matches, output) => {
        if (data.nophicaMarch === undefined)
          return output.in!();
        return {
          'front': output.inWithForwards!(),
          'back': output.inWithBackwards!(),
          'left': output.inWithLeft!(),
          'right': output.inWithRight!(),
        }[data.nophicaMarch];
      },
      outputStrings: {
        in: Outputs.in,
        inWithForwards: {
          en: '강제이동: 앞 🡺 안으로',
          de: 'Geisterlenkung Vorwärts Rein',
        },
        inWithBackwards: {
          en: '강제이동: 뒤 🡺 안으로',
          de: 'Geisterlenkung Rückwärts Rein',
        },
        inWithLeft: {
          en: '강제이동: 왼쪽 🡺 안으로',
          de: 'Geisterlenkung Links Rein',
        },
        inWithRight: {
          en: '강제이동: 오른쪽 🡺 안으로',
          de: 'Geisterlenkung Rechts Rein',
        },
      },
    },
    {
      id: 'Euphrosyne Nophica Matron\'s Harvest',
      type: 'StartsUsing',
      netRegex: { id: '7C1[DE]', source: 'Nophica', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Nophica Floral Haze Debuffs',
      type: 'GainsEffect',
      netRegex: { effectId: 'DD[2-5]' },
      condition: Conditions.targetIsYou(),
      // Initial Floral Haze is 16s.  The next Floral Haze is 18 or 35s.
      // Add a delay so that this only applies when it is "close" so that
      // it will only add to the Giving Land callout it needs to.
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      run: (data, matches) => {
        const faceMap: { [effectId: string]: NophicaMarch } = {
          DD2: 'front',
          DD3: 'back',
          DD4: 'left',
          DD5: 'right',
        } as const;
        data.nophicaMarch = faceMap[matches.effectId];
      },
    },
    {
      id: 'Euphrosyne Nophica Floral Haze Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: 'DD[2-5]', capture: false },
      suppressSeconds: 5,
      run: (data) => delete data.nophicaMarch,
    },
    {
      id: 'Euphrosyne Nophica Landwaker',
      type: 'StartsUsing',
      netRegex: { id: '7C19', source: 'Nophica', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Nophica Furrow',
      type: 'StartsUsing',
      netRegex: { id: '7C16', source: 'Nophica' },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Euphrosyne Nophica Heavens\' Earth',
      type: 'StartsUsing',
      netRegex: { id: '7C23', source: 'Nophica' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.tankBusterOnYou!();
      },
      run: (data, matches) => data.nophicaHeavensEarthTargets.push(matches.target),
      outputStrings: {
        tankBusterOnYou: Outputs.tankBusterOnYou,
      },
    },
    {
      id: 'Euphrosyne Nophica Heavens\' Earth Not You',
      type: 'StartsUsing',
      netRegex: { id: '7C23', source: 'Nophica', capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.nophicaHeavensEarthTargets.includes(data.me))
          return;
        return output.tankBusters!();
      },
      run: (data) => data.nophicaHeavensEarthTargets = [],
      outputStrings: {
        tankBusters: Outputs.tankBusters,
      },
    },
    {
      id: 'Euphrosyne Ktenos Roaring Rumble',
      type: 'StartsUsing',
      netRegex: { id: '7D3B', source: 'Euphrosynos Ktenos', capture: false },
      suppressSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Ktenos Sweeping Gouge',
      type: 'StartsUsing',
      netRegex: { id: '7D39', source: 'Euphrosynos Ktenos' },
      // This is trash and so three tankbuster callouts might be noisy here?
      condition: Conditions.targetIsYou(),
      response: Responses.tankBuster(),
    },
    {
      id: 'Euphrosyne Behemoth Localized Maelstrom',
      type: 'StartsUsing',
      netRegex: { id: '7D37', source: 'Euphrosynos Behemoth' },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'Euphrosyne Behemoth Trounce',
      type: 'StartsUsing',
      netRegex: { id: '7D38', source: 'Euphrosynos Behemoth', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'Euphrosyne Nymeia Spinner\'s Wheel Initial',
      type: 'GainsEffect',
      netRegex: { effectId: ['D39', 'D3A', 'D3B', 'D3C'] },
      condition: Conditions.targetIsYou(),
      // Reapplied with Time and Tide.
      suppressSeconds: 20,
      sound: '',
      infoText: (_data, matches, output) => {
        return {
          // Arcane Attraction
          'D39': output.lookAway!(),
          // Attraction Reversed
          'D3A': output.lookTowards!(),
          // Arcane Fever
          'D3B': output.pyretic!(),
          // Fever Reversed
          'D3C': output.freeze!(),
        }[matches.effectId];
      },
      outputStrings: {
        lookAway: {
          en: '(곧 뒤를 봐요)',
          de: '(bald wegschauen)',
        },
        lookTowards: {
          en: '(곧 앞만 봐요)',
          de: '(bald hinschauen)',
        },
        pyretic: {
          en: '(곧 불덩이)',
          de: '(bald Pyretisch)',
        },
        freeze: {
          en: '(곧 얼음)',
          de: '(bald Kühlung)',
        },
      },
    },
    {
      id: 'Euphrosyne Nymeia Spinner\'s Wheel',
      type: 'GainsEffect',
      netRegex: { effectId: ['D39', 'D3A', 'D3B', 'D3C'] },
      condition: Conditions.targetIsYou(),
      preRun: (data, matches, output) => {
        // This is somewhat unusual, but to avoid duplicating output strings,
        // we are going to store the output here, but it may get called via
        //
        data.nymeiaSpinnerOutput = {
          // Arcane Attraction
          'D39': output.lookAway!(),
          // Attraction Reversed
          'D3A': output.lookTowards!(),
          // Arcane Fever
          'D3B': output.stopEverything!(),
          // Fever Reversed
          'D3C': output.keepMoving!(),
        }[matches.effectId];
      },
      // 10 seconds first time, 20 seconds other times, possibly sped up (for ~13.4 s)
      // The Spinner Wheel Tether trigger will take care of speed ups.
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      // Reapplied with Time and Tide.
      suppressSeconds: 5,
      // This will be cleared if called earlier.
      alertText: (data) => data.nymeiaSpinnerOutput,
      run: (data) => delete data.nymeiaSpinnerOutput,
      outputStrings: {
        lookAway: {
          en: '니메이아 보면 안되요',
          de: 'Schau weg von Nymeia',
        },
        lookTowards: {
          en: '니메이아 바라봐요',
          de: 'Schau zu Nymeia',
        },
        stopEverything: Outputs.stopEverything,
        keepMoving: Outputs.moveAround,
      },
    },
    {
      id: 'Euphrosyne Nymeia Spinner\'s Wheel Tether',
      type: 'Tether',
      netRegex: { id: '00DF', target: 'Althyk' },
      condition: (data, matches) => data.me === matches.source,
      delaySeconds: 11.5,
      alertText: (data) => data.nymeiaSpinnerOutput,
      run: (data) => delete data.nymeiaSpinnerOutput,
      // For simplicity, this trigger uses the stored output from the Spinner's Wheel trigger.
      // If it calls it early, it will clear it so that the other trigger doesn't use it.
      outputStrings: {},
    },
    {
      id: 'Euphrosyne Althyk Axioma',
      type: 'StartsUsing',
      netRegex: { id: '7A47', source: 'Althyk', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Nymeia Hydroptosis',
      type: 'StartsUsing',
      // Technically there's a 7A45 cast on everybody, and 7A44 is self-casted.
      netRegex: { id: '7A44', source: 'Nymeia', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '흩어져요 (보라🟣 피해요)',
          de: 'Verteilen (vermeide den lilanen Riss)',
        },
      },
    },
    {
      id: 'Euphrosyne Althyk Inexorable Pull',
      type: 'StartsUsing',
      netRegex: { id: '7A42', source: 'Althyk', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '보라🟣 균열 위로',
          de: 'Im lilanen Riss stehen',
        },
      },
    },
    {
      id: 'Euphrosyne Althyk Petrai',
      type: 'StartsUsing',
      // With 7A49 damage
      netRegex: { id: '7A48', source: 'Althyk' },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'Euphrosyne Nymeia Hydrostasis Collect',
      type: 'StartsUsing',
      netRegex: { id: ['7A3B', '7A3C', '7A3D', '7A3E'], source: 'Nymeia' },
      run: (data, matches) => data.nymeiaHydrostasis.push(matches),
    },
    {
      id: 'Euphrosyne Nymeia Hydrostasis',
      type: 'StartsUsing',
      // TODO: this only appears to have valid positions the first time around (sometimes).
      // TODO: try using getCombatantants.
      netRegex: { id: ['7A3B', '7A3C', '7A3D', '7A3E'], source: 'Nymeia', capture: false },
      // First time around is BCD all simultaneous, with 16,19,22s cast times.
      // Other times are BC instantly and then E ~11s later with a 2s cast time.
      delaySeconds: 0.5,
      durationSeconds: 18,
      suppressSeconds: 20,
      infoText: (data, _matches, output) => {
        type HydrostasisDir = 'N' | 'SW' | 'SE';

        const lines = data.nymeiaHydrostasis.sort((a, b) => a.id.localeCompare(b.id));
        const dirs: HydrostasisDir[] = lines.map((line) => {
          const centerX = 50;
          const centerY = -741;

          const x = parseFloat(line.x);
          const y = parseFloat(line.y);
          if (y < centerY)
            return 'N';
          return x < centerX ? 'SW' : 'SE';
        });

        const [first, second, third] = dirs;
        if (first === undefined || second === undefined)
          return;

        if (third === undefined) {
          const dirSet = new Set<HydrostasisDir>(['N', 'SW', 'SE']);
          dirSet.delete(first);
          dirSet.delete(second);
          if (dirSet.size !== 1)
            return;
          for (const dir of dirSet.keys())
            dirs.unshift(dir);
        }

        const [dir1, dir2, dir3] = dirs.map((x) => {
          return {
            N: output.dirN!(),
            SW: output.dirSW!(),
            SE: output.dirSE!(),
          }[x] ?? output.unknown!();
        });
        return output.knockback!({ dir1: dir1, dir2: dir2, dir3: dir3 });
      },
      run: (data) => data.nymeiaHydrostasis = [],
      outputStrings: {
        knockback: {
          en: '넉백: ${dir1} => ${dir2} => ${dir3}',
          de: 'Rückstoß ${dir1} => ${dir2} => ${dir3}',
        },
        dirSW: Outputs.dirSW,
        dirSE: Outputs.dirSE,
        dirN: Outputs.dirN,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Euphrosyne Colossus Rapid Sever',
      type: 'StartsUsing',
      netRegex: { id: '7D3C', source: 'Euphrosynos Ktenos' },
      // This is trash and so three tankbuster callouts might be noisy here?
      condition: Conditions.targetIsYou(),
      // These three also tend to cast at the same time, so could be on one person.
      suppressSeconds: 5,
      response: Responses.tankBuster(),
    },
    {
      id: 'Euphrosyne Halone Rain of Spears',
      type: 'StartsUsing',
      netRegex: { id: '7D79', source: 'Halone', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Halone Tetrapagos Cleanup',
      type: 'StartsUsing',
      // This should be unnecessary, but for safety reset the data each round.
      netRegex: { id: ['7D45', '7D59'], source: 'Halone', capture: false },
      run: (data) => data.haloneTetrapagos = [],
    },
    {
      id: 'Euphrosyne Halone Tetrapagos Summary',
      type: 'StartsUsing',
      netRegex: { id: ['7D46', '7D47', '7D48', '7D49'], source: 'Halone' },
      preRun: (data, matches) => {
        const tetra: HaloneTetra | undefined = tetraMap[matches.id];
        data.haloneTetrapagos.push(tetra ?? 'unknown');
      },
      durationSeconds: 7.5,
      sound: '',
      alertText: (data, _matches, output) => {
        if (data.haloneTetrapagos.length !== 4)
          return;

        const [dir1, dir2, dir3, dir4] = data.haloneTetrapagos.map((x) =>
          output[x ?? 'unknown']!()
        );
        return output.text!({ dir1: dir1, dir2: dir2, dir3: dir3, dir4: dir4 });
      },
      outputStrings: {
        text: {
          en: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
          de: '${dir1} > ${dir2} > ${dir3} > ${dir4}',
        },
        out: Outputs.out,
        in: Outputs.in,
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Euphrosyne Halone Tetrapagos Initial',
      type: 'StartsUsing',
      netRegex: { id: ['7D46', '7D47', '7D48', '7D49'], source: 'Halone' },
      durationSeconds: 7,
      suppressSeconds: 20,
      infoText: (_data, matches, output) => output[tetraMap[matches.id] ?? 'unknown']!(),
      outputStrings: {
        out: Outputs.out,
        in: Outputs.in,
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'Euphrosyne Halone Tetrapagos Followup',
      type: 'Ability',
      // Self-targeted abilities:
      // 7D4A = donut
      // 7D4B = circle
      // 7D4C = right cleave
      // 7D4D = left cleave
      netRegex: { id: ['7D4A', '7D4B', '7D4C', '7D4D'], source: 'Halone', capture: false },
      durationSeconds: 1.5,
      infoText: (data, _matches, output) => {
        if (data.haloneTetrapagos.length === 4)
          data.haloneTetrapagos.shift();
        const dir = data.haloneTetrapagos.shift();
        if (dir === undefined)
          return;
        return output[dir]!();
      },
      outputStrings: {
        out: Outputs.out,
        in: Outputs.in,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'Euphrosyne Halone Doom Spear',
      type: 'StartsUsing',
      netRegex: { id: '80AD', source: 'Halone', capture: false },
      infoText: (_data, _matches, output) => output.getTowers!(),
      outputStrings: {
        getTowers: {
          en: '타워 밟아요',
          de: 'Türme nehmen',
          fr: 'Prenez les tours',
          ja: '塔を踏む',
          cn: '踩塔',
          ko: '장판 하나씩 들어가기',
        },
      },
    },
    {
      id: 'Euphrosyne Halone Spears Three',
      type: 'StartsUsing',
      netRegex: { id: '7D78', source: 'Halone' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.tankBusterOnYou!();
      },
      run: (data, matches) => data.haloneSpearsThreeTargets.push(matches.target),
      outputStrings: {
        tankBusterOnYou: Outputs.tankBusterOnYou,
      },
    },
    {
      id: 'Euphrosyne Halone Spears Three Not You',
      type: 'StartsUsing',
      netRegex: { id: '7D78', source: 'Halone', capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.haloneSpearsThreeTargets.includes(data.me))
          return;
        return output.tankBusters!();
      },
      run: (data) => data.haloneSpearsThreeTargets = [],
      outputStrings: {
        tankBusters: Outputs.tankBusters,
      },
    },
    {
      id: 'Euphrosyne Halone Thousandfold Thruust',
      type: 'HeadMarker',
      netRegex: { id: ['0182', '0183', '0184', '0185'], target: 'Halone' },
      alertText: (_data, matches, output) => {
        return {
          '0182': output.back!(),
          '0183': output.front!(),
          '0184': output.left!(),
          '0185': output.right!(),
        }[matches.id];
      },
      outputStrings: {
        front: Outputs.front,
        back: Outputs.back,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'Euphrosyne Halone Wrath of Halone',
      type: 'StartsUsing',
      netRegex: { id: '7D63', source: 'Halone', capture: false },
      alertText: (_data, _matches, output) => output.out!(),
      outputStrings: {
        out: {
          en: '⊗밖으로 (링◎ 피해요)',
          de: 'Geh raus (vermeide den Ring)',
        },
      },
    },
    {
      id: 'Euphrosyne Halone Ice Dart',
      type: 'StartsUsing',
      netRegex: { id: '7D66', source: 'Halone' },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.spread!();
      },
      run: (data, matches) => data.haloneIceDartTargets.push(matches.target),
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'Euphrosyne Halone Ice Dart Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '7D66', source: 'Halone', capture: false },
      delaySeconds: 10,
      suppressSeconds: 5,
      run: (data) => data.haloneIceDartTargets = [],
    },
    {
      id: 'Euphrosyne Halone Ice Rondel',
      type: 'StartsUsing',
      netRegex: { id: '7D67', source: 'Halone' },
      condition: (data) => !data.haloneIceDartTargets.includes(data.me),
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'Euphrosyne Menphina Blue Moon',
      type: 'StartsUsing',
      netRegex: { id: ['7BFA', '7BFB'], source: 'Menphina', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Euphrosyne Menphina Love\'s Light Single Moon',
      type: 'Ability',
      netRegex: { id: ['7BB8', '7BC2'], source: 'Menphina', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '달 옆으로',
          de: 'Geh raus (vermeide den Ring)',
        },
      },
    },
    {
      id: 'Euphrosyne Menphina Love\'s Light Quadruple Moon',
      type: 'Ability',
      netRegex: { id: ['7BB9', '7BC3'], source: 'Menphina', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '어두운 달로',
          de: 'Geh zum dunklen Mond',
        },
      },
    },
    {
      id: 'Euphrosyne Menphina Midnight Frost Front Initial',
      type: 'StartsUsing',
      netRegex: { id: '7BCC', source: 'Menphina', capture: false },
      response: Responses.goFront(),
    },
    {
      id: 'Euphrosyne Menphina Midnight Frost Back Initial',
      type: 'StartsUsing',
      netRegex: { id: '7BCB', source: 'Menphina', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'Euphrosyne Menphina Lunar Kiss',
      type: 'HeadMarker',
      netRegex: { id: '019C' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.tankLaserOnYou!();
      },
      run: (data, matches) => data.menphinaLunarKissTargets.push(matches.target),
      outputStrings: {
        tankLaserOnYou: {
          en: '내게 탱크 레이저가!',
          de: 'Tank Laser auf DIR',
          fr: 'Tank laser sur VOUS',
          ja: '自分にタンクレーザー',
          cn: '坦克激光点名',
          ko: '탱 레이저 대상자',
        },
      },
    },
    {
      id: 'Euphrosyne Menphina Lunar Kiss Not You',
      type: 'HeadMarker',
      netRegex: { id: '019C', capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.menphinaLunarKissTargets.includes(data.me))
          return;
        return output.avoidTankLaser!();
      },
      run: (data) => data.menphinaLunarKissTargets = [],
      outputStrings: {
        avoidTankLaser: {
          en: '탱크 레이저 피해요',
          de: 'Weiche dem Tanklaser aus',
          fr: 'Évitez le tank laser',
          cn: '躲避坦克激光',
          ko: '탱 레이저 피하기',
        },
      },
    },
    {
      id: 'Euphrosyne Menphina Winter Halo',
      type: 'StartsUsing',
      netRegex: {
        id: ['7BC6', '7BE8', '7BE9', '7F0E', '7F0F', '7BDB', '7BDC'],
        source: 'Menphina',
        capture: false,
      },
      response: Responses.getIn(),
    },
    {
      id: 'Euphrosyne Menphina Keen Moonbeam',
      type: 'StartsUsing',
      netRegex: { id: '7BF4', source: 'Menphina' },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'Euphrosyne Menphina Moonset Rays',
      type: 'StartsUsing',
      netRegex: { id: '80FA', source: 'Menphina' },
      response: Responses.stackMarkerOn(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Blueblossoms/Giltblossoms': 'Blossoms',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Althyk(?! &)': 'Althyk',
        'Althyk & Nymeia': 'Althyk & Nymeia',
        'Euphrosynos Behemoth': 'Euphrosyne-Behemoth',
        'Euphrosynos Ktenos': 'Euphrosyne-Ktenos',
        'Glacial Spear': 'Eis-Speer',
        'Halone': 'Halone',
        'Menphina': 'Menphina',
        '(?<!& )Nophica': 'Nophica',
        'Nymeia': 'Nymeia',
        'The Barbs': 'Domäne der Furie',
        'The Bole': 'Eiche',
        'The Chamber Of Revolutions': 'Kammer der Zwillingsmonde',
        'The Fertile Plains': 'Land der Fruchtbarkeit',
      },
      'replaceText': {
        'Abundance': 'Blütensturm',
        'Ancient Blizzard': 'Antikes Eis',
        'Axioma': 'Axioma',
        'Blue Moon': 'Blauer Mond',
        'Blueblossoms': 'Blaublüten',
        'Chalaza': 'Khalaza',
        'Cheimon': 'Cheimon',
        'Cratering Chill': 'Frostkrater',
        'Doom Spear': 'Schicksalsspeer',
        'First Blush': 'Lunarer Schuss',
        'Floral Haze': 'Florale Faszination',
        'Full Bright': 'Voller Glanz',
        'Furrow': 'Sommerfurche',
        'Fury\'s Aegis': 'Aegis der Furie',
        'Giltblossoms': 'Goldblüten',
        'Heavens\' Earth': 'Himmlische Erde',
        'Hydroptosis': 'Hydroptosis',
        'Hydrorythmos': 'Hydrorhythmus',
        'Hydrostasis': 'Hydrostase',
        'Ice Dart': 'Eispfeil',
        'Ice Rondel': 'Eisrondell',
        'Inexorable Pull': 'Unerbittliche Gravitation',
        'Keen Moonbeam': 'Heftiger Mondstrahl',
        'Landwaker': 'Erwachen der göttlichen Erde',
        'Lochos': 'Lochos',
        'Love\'s Light': 'Licht der Liebe',
        'Lovers\' Bridge': 'Brücke der Liebenden',
        'Lunar Kiss': 'Mondkuss',
        'Matron\'s Breath': 'Nophicas Atem',
        'Matron\'s Harvest': 'Nophicas Ernte',
        'Matron\'s Plenty': 'Nophicas Überfluss',
        'Midnight Frost': 'Mitternachtsfrost',
        'Moonset(?! Rays)': 'Monduntergang',
        'Moonset Rays': 'Dämmerungsstrahl',
        'Mythril Greataxe': 'Mithril-Großaxt',
        'Neikos': 'Neikos',
        'Niphas': 'Niphas',
        'Petrai': 'Petrai',
        'Philotes': 'Philotes',
        'Playful Orbit': 'Verspielter Orbit',
        'Rain of Spears': 'Speerregen',
        'Reaper\'s Gale': 'Todessturm',
        'Rise of the Twin Moons': 'Aufgang der Zwillingsmonde',
        'Season\'s Passing': 'Lauf der Jahreszeiten',
        'Selenain Mysteria': 'Zeremonie der Zwillingsmonde',
        'Shockwave': 'Schockwelle',
        'Silver Mirror': 'Silberner Spiegel',
        'Sowing Circle': 'Sommer-Aussaat',
        'Spears Three': 'Drei Speere',
        'Spinner\'s Wheel': 'Spinnrad',
        'Spring Flowers': 'Frühlingssturm',
        'Tetrapagos': 'Tetrapagos',
        'The Giving Land': 'Geschenk der Erde',
        'Thousandfold Thrust': 'Tausendfacher Stoß',
        'Time and Tide': 'Zeit und Gezeiten',
        'Waxing Claw': 'Wachsende Klaue',
        'Will of the Fury': 'Wille von Halone',
        'Winter Halo': 'Silberner Spiegel',
        'Winter Solstice': 'Wintersonnenwende',
        'Wrath of Halone': 'Wille von Halone',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Althyk(?! &)': 'Althyk',
        'Althyk & Nymeia': 'duo Althyk et Nymeia',
        'Euphrosynos Behemoth': 'béhémoth d\'Euphrosyne',
        'Euphrosynos Ktenos': 'kténos d\'Euphrosyne',
        'Glacial Spear': 'lance de glace',
        'Halone': 'Halone',
        'Menphina': 'Menphina',
        'Nophica': 'Nophica',
        '(?<!& )Nymeia': 'Nymeia',
        'The Barbs': 'Quartiers de la Conquérante',
        'The Bole': 'Le Tronc',
        'The Chamber Of Revolutions': 'Chambre des lunes jumelles',
        'The Fertile Plains': 'Terre d\'abondance',
      },
      'replaceText': {
        'Abundance': 'Profusion de pétales',
        'Ancient Blizzard': 'Glace ancienne',
        'Axioma': 'Axiome',
        'Blue Moon': 'Lune bleue',
        'Blueblossoms': 'Pétales d\'azur',
        'Chalaza': 'Khalaza',
        'Cheimon': 'Cheimon',
        'Cratering Chill': 'Frisson cratérisant',
        'Doom Spear': 'Lance du destin',
        'First Blush': 'Scintillement sélénien',
        'Floral Haze': 'Fascination florale',
        'Full Bright': 'Nuit de pleine lune',
        'Furrow': 'Sillon sidérant',
        'Fury\'s Aegis': 'Égide de la Conquérante',
        'Giltblossoms': 'Pétales dorés',
        'Heavens\' Earth': 'Terre des cieux',
        'Hydroptosis': 'Hydroptôse',
        'Hydrorythmos': 'Hydrorythme',
        'Hydrostasis': 'Hydrostase',
        'Ice Dart': 'Dard glacé',
        'Ice Rondel': 'Rondelle glacée',
        'Inexorable Pull': 'Manipulation gravitationnelle',
        'Keen Moonbeam': 'Sillon sélénite',
        'Landwaker': 'Éveil de la terre divine',
        'Lochos': 'Lochos',
        'Love\'s Light': 'Brillance de l\'amour',
        'Lovers\' Bridge': 'Lueur lunaire',
        'Lunar Kiss': 'Scintillement glaçant',
        'Matron\'s Breath': 'Souffle de la Mère',
        'Matron\'s Harvest': 'Fête des récoltes',
        'Matron\'s Plenty': 'Abondance maternelle',
        'Midnight Frost': 'Gibbosités givrées',
        'Moonset(?! Rays)': 'Coucher de lune',
        'Moonset Rays': 'Rayon crépusculaire',
        'Mythril Greataxe': 'Grande hache de mythril',
        'Neikos': 'Neikos',
        'Niphas': 'Niphas',
        'Petrai': 'Pétra',
        'Philotes': 'Philotès',
        'Playful Orbit': 'Commando complice',
        'Rain of Spears': 'Déluge de lances',
        'Reaper\'s Gale': 'Fauche rafale',
        'Rise of the Twin Moons': 'Lever des lunes jumelles',
        'Season\'s Passing': 'Cycle des saisons',
        'Selenain Mysteria': 'Mystères séléniens',
        'Shockwave': 'Onde de choc',
        'Silver Mirror': 'Reflet glacé',
        'Sowing Circle': 'Cercles des semences',
        'Spears Three': 'Trinité de lances',
        'Spinner\'s Wheel': 'Rouet du destin',
        'Spring Flowers': 'Épanouissement printanier',
        'Tetrapagos': 'Tetrapagos',
        'The Giving Land': 'Bénédiction de la nature',
        'Thousandfold Thrust': 'Transpercement millénaire',
        'Time and Tide': 'Manipulation temporelle',
        'Waxing Claw': 'Griffes gardiennes',
        'Will of the Fury': 'Volonté de Halone',
        'Winter Halo': 'Halo hivernal',
        'Winter Solstice': 'Solstice d\'hiver',
        'Wrath of Halone': 'Courroux de la Conquérante',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Althyk(?! &)': 'アルジク',
        'Althyk & Nymeia': 'アルジク＆ニメーヤ',
        'Euphrosynos Behemoth': 'エウプロシュネ・ベヒーモス',
        'Euphrosynos Ktenos': 'エウプロシュネ・クティノス',
        'Glacial Spear': '氷の数槍',
        'Halone': 'ハルオーネ',
        'Menphina': 'メネフィナ',
        'Nophica': 'ノフィカ',
        '(?<!& )Nymeia': 'ニメーヤ',
        'The Barbs': '戦神の間',
        'The Bole': '世界樹の幹',
        'The Chamber Of Revolutions': '双月の間',
        'The Fertile Plains': '豊穣の地',
      },
      'replaceText': {
        'Abundance': '神力の花嵐',
        'Ancient Blizzard': 'エンシェントブリザド',
        'Axioma': 'アクシオマー',
        'Blue Moon': '月神光',
        'Blueblossoms': '青花散',
        'Chalaza': 'ハラーザ',
        'Cheimon': 'ヘイモン',
        'Cratering Chill': '月氷撃',
        'Doom Spear': 'ドゥームスピアー',
        'First Blush': '月閃',
        'Floral Haze': '惑いの葉花',
        'Full Bright': '月夜の巡り',
        'Furrow': '地突き',
        'Fury\'s Aegis': 'イージス・オブ・ハルオーネ',
        'Giltblossoms': '黄花散',
        'Heavens\' Earth': '神界石',
        'Hydroptosis': 'ヒュドルピトシス',
        'Hydrorythmos': 'ヒュドルリュトモス',
        'Hydrostasis': 'ヒュドルスタシス',
        'Ice Dart': '氷塊',
        'Ice Rondel': '大氷塊',
        'Inexorable Pull': '重力操作',
        'Keen Moonbeam': '月光槍',
        'Landwaker': '神地の目覚め',
        'Lochos': 'ロコス',
        'Love\'s Light': '慈愛の月',
        'Lovers\' Bridge': '月輝',
        'Lunar Kiss': '冷月閃',
        'Matron\'s Breath': '豊穣の息吹',
        'Matron\'s Harvest': '収穫の祭典',
        'Matron\'s Plenty': '豊穣の神光',
        'Midnight Frost': '月地氷霜',
        'Moonset(?! Rays)': '落月蹴',
        'Moonset Rays': '月の階',
        'Mythril Greataxe': '霊銀の大斧',
        'Neikos': 'ネイコス',
        'Niphas': 'ニファス',
        'Petrai': 'ペトゥライ',
        'Philotes': 'フィロテス',
        'Playful Orbit': '遊撃機動',
        'Rain of Spears': 'レイン・オブ・スピアーズ',
        'Reaper\'s Gale': '鎌風',
        'Rise of the Twin Moons': '双月の導き',
        'Season\'s Passing': '春夏の移ろい',
        'Selenain Mysteria': '双月の儀',
        'Shockwave': '衝撃波',
        'Silver Mirror': '月霜',
        'Sowing Circle': '耕起輪転',
        'Spears Three': 'スリースピアーズ',
        'Spinner\'s Wheel': '運命の紡車',
        'Spring Flowers': '春の花茨',
        'Tetrapagos': 'テトラパゴス',
        'The Giving Land': '大地の恵み',
        'Thousandfold Thrust': 'サウザンスラスト',
        'Time and Tide': '時間操作',
        'Waxing Claw': '番犬の爪',
        'Will of the Fury': 'ウィル・オブ・ハルオーネ',
        'Winter Halo': '月暈',
        'Winter Solstice': '寒月',
        'Wrath of Halone': 'ラース・オブ・ハルオーネ',
      },
    },
  ],
};

export default triggerSet;
