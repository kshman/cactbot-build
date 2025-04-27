import { AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const phases = {
  'A3C8': 'pack', // Tactical Pack
  'A3CB': 'saber', // Ravenous Saber
  'A3C1': 'moonlight', // Beckon Moonlight
} as const;
type Phase = (typeof phases)[keyof typeof phases] | 'door' | '2nd' | 'unknown';

const fangPairs: { [id: string]: string } = {
  'A39D': 'windPlus',
  'A39E': 'windCross',
  'A3A1': 'stonePlus',
  'A3A2': 'stoneCross',
} as const;

const swStrings = {
  combo: {
    en: '${debuff} ${num}',
    ko: '(${debuff} ${num}번째)',
  },
  now: {
    en: '${debuff} Now!',
    ko: '지금 문대요: ${debuff}',
  },
  stone: {
    en: 'Stone',
    ko: '🟡돌멩이',
  },
  wind: {
    en: 'Wind',
    ko: '🟢바람',
  },
  unknown: Outputs.unknown,
} as const;
const moonStrings = {
  safe: {
    en: '${arrow}${quad}',
    ko: '${arrow}${quad}',
  },
  saves: {
    en: '${arrow1}${quad1} => ${arrow2}${quad2}',
    ko: '${arrow1}${quad1} 🔜 ${arrow2}${quad2}',
  },
  ...AutumnDir.stringsArrowCross,
  ...Directions.outputStringsIntercardDir,
} as const;
const championStrings = {
  cw: Outputs.clockwise,
  ccw: Outputs.counterclockwise,
  in: Outputs.in,
  out: Outputs.out,
  donut: {
    en: 'Donut',
    ko: '도넛',
  },
  sides: Outputs.sides,
  mechanics: {
    en: '(${dir}) ${mech1} => ${mech2} => ${mech3} => ${mech4} => ${mech5}',
    ko: '(${dir}) ${mech1} 🔜 ${mech2} 🔜 ${mech3} 🔜 ${mech4} 🔜 ${mech5}',
  },
  left: Outputs.left,
  right: Outputs.right,
  leftSide: {
    en: 'Left Side',
    ko: '왼쪽으로',
  },
  rightSide: {
    en: 'Right Side',
    ko: '오른쪽으로',
  },
  dirMechanic: {
    en: '${dir} ${mech}',
    ko: '${dir} ${mech}',
  },
} as const;

const centerX = 100;
const centerY = 100;

export interface Data extends RaidbossData {
  phase: Phase;
  // Phase 1
  decays: number;
  gales: number;
  tpnum?: number;
  tpswv?: 'stone' | 'wind';
  tpsurge: number;
  tpcount: number;
  bmindex: number;
  bmbites: number[];
  bmquad?: number;
  // Phase 2
  hblow?: 'in' | 'out';
  hsafe?: number;
  twofold?: boolean;
  tfdir?: string;
  tfindex: number;
  chclock?: 'cw' | 'ccw';
  chdonut?: number;
  chfang?: number;
  chorder?: string[];
  chindex: number;
  platforms: number;
  //
  spread?: boolean;
  collect: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM4Savage',
  zoneId: ZoneId.AacCruiserweightM4Savage,
  timelineFile: 'r8s.txt',
  initData: () => ({
    phase: 'door',
    decays: 0,
    gales: 0,
    tpcount: 0,
    tpsurge: 0,
    bmindex: 0,
    bmbites: [],
    tfindex: 0,
    chindex: 0,
    platforms: 5,
    collect: [],
  }),
  timelineTriggers: [
    {
      id: 'R8S Light Party Platform',
      regex: /Quake III/,
      beforeSeconds: 7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Light Party Platform',
          ko: '플랫폼에서 4:4',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Positions',
      regex: /Ultraviolent Ray [123]/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: 'UV 자리로',
        },
      },
    },
    {
      id: 'R8S Ultraviolent 4 Positions',
      regex: /Ultraviolent Ray 4/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: 'UV 자리로',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'R8S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(phases), source: 'Howling Blade' },
      suppressSeconds: 1,
      run: (data, matches) => data.phase = phases[matches.id as keyof typeof phases] ?? 'unknown',
    },
    {
      id: 'R8S Phase Tracker 2',
      type: 'Ability',
      netRegex: { id: 'A82D', source: 'Howling Blade', capture: false },
      suppressSeconds: 1,
      run: (data) => {
        data.phase = '2nd';
        data.collect = [];
      },
    },
    {
      id: 'R8S Extraplanar Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3DA', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Fangs',
      type: 'StartsUsing',
      netRegex: { id: Object.keys(fangPairs), source: 'Howling Blade', capture: true },
      durationSeconds: 4.5,
      infoText: (_data, matches, output) => {
        const fang = fangPairs[matches.id];
        if (fang !== undefined)
          return output[fang]!();
      },
      outputStrings: {
        windPlus: {
          en: 'In + Cardinal + Partners',
          ko: '➕안으로 + 둘이 페어',
        },
        windCross: {
          en: 'In + Intercards + Partners',
          ko: '❌안으로 + 둘이 페어',
        },
        stonePlus: {
          en: 'Out + Cardinal + Protean',
          ko: '➕바깥으로 + 맡은 자리로',
        },
        stoneCross: {
          en: 'Out + InterCards + Protean',
          ko: '❌바깥으로 + 맡은 자리로',
        },
      },
    },
    {
      id: 'R8S Reigns',
      type: 'StartsUsing',
      netRegex: { id: ['A911', 'A912', 'A913', 'A914'], source: 'Howling Blade', capture: true },
      durationSeconds: (_data, matches) => parseFloat(matches.castTime) + 3,
      infoText: (_data, matches, output) => {
        if (matches.id === 'A911' || matches.id === 'A912')
          return output.in!();
        return output.out!();
      },
      outputStrings: {
        in: {
          en: 'In',
          ko: '보스랑 붙어요',
        },
        out: {
          en: 'Out',
          ko: '보스 멀리멀리',
        },
      },
    },
    {
      id: 'R8S Millenial Decay',
      type: 'StartsUsing',
      netRegex: { id: 'A3B2', source: 'Howling Blade', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Breath of Decay Rotation',
      type: 'StartsUsing',
      netRegex: { id: 'A3B4', source: 'Wolf of Wind', capture: true },
      durationSeconds: 6,
      infoText: (data, matches, output) => {
        data.decays++;
        if (data.decays !== 2)
          return;
        const dir = AutumnDir.posConv8(matches.x, matches.y, centerX, centerY);
        return dir === 1 || dir === 5 ? output.left!() : output.right!();
      },
      outputStrings: {
        left: {
          en: '<== Clockwise',
          ko: '❰❰❰왼쪽으로',
        },
        right: {
          en: 'Counterclockwise ==>',
          ko: '오른쪽으로❱❱❱',
        },
      },
    },
    {
      id: 'R8S Aero III',
      // Happens twice, but Prowling Gale occurs simultaneously on the second one
      type: 'StartsUsing',
      netRegex: { id: 'A3B7', source: 'Howling Blade', capture: false },
      condition: Conditions.notAutumnOnly(),
      suppressSeconds: 16,
      response: Responses.knockback(),
    },
    {
      id: 'R8S Decay Spread',
      type: 'HeadMarker',
      netRegex: { id: '0178' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 4,
      alertText: (_data, _matches, output) => output.puddle!(),
      outputStrings: {
        puddle: {
          en: 'Puddle on YOU',
          ko: '내게 장판!',
        },
      },
    },
    {
      id: 'R8S Prowling Gale Tower/Tether',
      type: 'Tether',
      netRegex: { id: '0039', capture: true },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.knockbackTether!();
        data.gales++;
        if (data.gales === 4)
          return output.knockbackTowers!();
      },
      outputStrings: {
        knockbackTether: {
          en: 'Knockback Tether',
          ko: '줄 당겨요',
        },
        knockbackTowers: {
          en: 'Knockback Towers',
          ko: '타워로 넉백',
        },
      },
    },
    {
      id: 'R8S Titanic Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A3C7', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8S Tracking Tremors',
      type: 'StartsUsing',
      netRegex: { id: 'A3B9', source: 'Howling Blade', capture: false },
      durationSeconds: 9,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          ja: '頭割り x8',
          cn: '8次分摊',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Great Divide',
      type: 'HeadMarker',
      netRegex: { id: '0256', capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R8S Howling Havoc',
      // There are two additional casts, but only the Wolf Of Stone cast one (A3DD) does damage
      // A3DC Howling Havoc from Wolf of Stone self-cast
      // A3DB Howling Havoc from Wolf of Wind self-cast
      type: 'StartsUsing',
      netRegex: { id: 'A3DD', source: 'Wolf Of Stone', capture: true },
      // 4.7s castTime
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 2,
      response: Responses.aoe(),
    },
    {
      id: 'R8S Tactical Pack Tethers',
      type: 'Tether',
      netRegex: { id: ['014F', '0150'], capture: true },
      condition: (data, matches) => data.me === matches.source,
      infoText: (_data, matches, output) =>
        matches.id === '014F' ? output.wind!() : output.stone!(),
      outputStrings: {
        wind: {
          en: 'Green side',
          ko: '🟩바람으로',
        },
        stone: {
          en: 'Yellow side',
          ko: '🟨돌멩이로',
        },
      },
    },
    {
      id: 'R8S Tactical Pack',
      // Durations could be 21s, 37s, or 54s
      type: 'GainsEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: (data, matches) => data.me === matches.target && data.phase === 'pack',
      preRun: (data, matches) => {
        // 1127 = Stone (Yellow Cube) Debuff
        // 1128 = Wind (Green Sphere) Debuff
        const time = parseFloat(matches.duration);
        data.tpnum = time < 22 ? 1 : time < 38 ? 2 : 3;
        data.tpswv = matches.effectId === '1127' ? 'stone' : 'wind';
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        const debuff = output[data.tpswv ?? 'unknown']!();
        return output.combo!({ debuff: debuff, num: data.tpnum });
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Predation',
      type: 'HeadMarker',
      netRegex: { id: '0017', capture: false },
      condition: (data) => data.phase === 'pack',
      suppressSeconds: 1,
      run: (data) => data.tpcount++,
    },
    {
      id: 'R8S Tactical Pack Wind',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      // Magic Vulnerabilities from Pack Predation and Alpha Wind are 0.96s
      condition: (data, matches) =>
        data.phase === 'pack' && data.tpswv === 'wind' && parseFloat(matches.duration) < 2,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.tpnum === data.tpcount)
          return output.now!({ debuff: output.wind!() });
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Stone',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      // Timing based on Tether and Magic Vulnerability (3.96s)
      condition: (data, matches) =>
        data.phase === 'pack' && data.tpswv === 'stone' && parseFloat(matches.duration) > 2,
      preRun: (data) => data.tpsurge = data.tpsurge + 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.tpnum === data.tpcount && (data.tpsurge % 2) === 1)
          return output.now!({ debuff: output.stone!() });
      },
      outputStrings: swStrings,
    },
    {
      id: 'R8S Tactical Pack Cleanup',
      type: 'LosesEffect',
      netRegex: { effectId: ['1127', '1128'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data) => data.tpnum = undefined,
    },
    {
      id: 'R8S Ravenous Saber',
      type: 'StartsUsing',
      netRegex: { id: 'A749', source: 'Howling Blade', capture: false },
      durationSeconds: 7,
      response: Responses.bigAoe(),
    },
    {
      id: 'R8S Terrestrial Rage Spread Collect',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.phase === 'saber' && data.me === matches.target,
      run: (data) => data.spread = true,
    },
    {
      id: 'R8S Terrestrial Rage Spread/Stack',
      type: 'HeadMarker',
      netRegex: { id: '005D', capture: false },
      condition: (data) => data.phase === 'saber',
      delaySeconds: 0.1,
      durationSeconds: 4.5,
      suppressSeconds: 10,
      alertText: (data, _matches, output) => data.spread ? output.spread!() : output.stack!(),
      outputStrings: {
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Shadowchase',
      type: 'StartsUsing',
      netRegex: { id: 'A3BC', source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 0.5,
      durationSeconds: 5.5,
      alertText: (data, _matches, output) => {
        const mech = data.spread ? output.stack!() : output.spread!();
        return output.move!({ mech: mech });
      },
      outputStrings: {
        move: {
          en: 'Move! => ${mech}',
          ko: '피해요! 🔜 ${mech}',
        },
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Shadowchase Rotate',
      // Call to move behind Dragon Head after clones dash
      type: 'StartsUsing',
      netRegex: { id: 'A3BD', source: 'Howling Blade', capture: true },
      condition: Conditions.notAutumnOnly(),
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => {
        return output.rotate!();
      },
      outputStrings: {
        rotate: {
          en: 'Rotate',
          ko: '옆에 용머리쪽으로',
        },
      },
    },
    {
      id: 'R8S Weal of Stone',
      // TODO: Call direction that the heads are firing from, needs OverlayPlugin
      type: 'StartsUsing',
      netRegex: { id: 'A78E', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.lines!(),
      run: (data) => data.spread = undefined,
      outputStrings: {
        lines: {
          en: 'Lines',
          ko: '직선 장판',
        },
      },
    },
    {
      id: 'R8S Beckon Moonlight Quadrants',
      type: 'Ability',
      // A3E0 => Right cleave self-cast
      // A3E1 => Left cleave self-cast
      netRegex: { id: ['A3E0', 'A3E1'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: 0.1,
      durationSeconds: (data) => data.bmbites.length < 2 ? 2 : 10,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;

        const num = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        // Moonbeam's Bite (A3C2 Left / A3C3 Right) half-room cleaves
        // Defining the cleaved side
        if (matches.id === 'A3E0') {
          const ccw = num === 0 ? 6 : num - 2;
          data.bmbites.push(ccw);
        } else {
          const cw = (num + 2) % 8;
          data.bmbites.push(cw);
        }
      },
      infoText: (data, _matches, output) => {
        if (data.bmbites.length === 1 || data.bmbites.length === 3)
          return;

        const cquad = [1, 3, 5, 7];
        const beam1 = data.bmbites[0] ?? -1;
        const beam2 = data.bmbites[1] ?? -1;
        let safe1 = cquad.filter((q) => q !== beam1 + 1);
        safe1 = safe1.filter((q) => q !== (beam1 === 0 ? 7 : beam1 - 1));
        safe1 = safe1.filter((q) => q !== beam2 + 1);
        safe1 = safe1.filter((q) => q !== (beam2 === 0 ? 7 : beam2 - 1));

        // Early output for first two
        if (data.bmbites.length === 2) {
          if (safe1.length !== 1 || safe1[0] === undefined)
            return;

          const v = safe1[0] ?? -1;
          const q = output[Directions.outputFrom8DirNum(v)]!();
          const a = output[AutumnDir.arrowFromNum(v)]!();
          return output.safe!({ arrow: a, quad: q });
        }

        const beam3 = data.bmbites[2] ?? -1;
        const beam4 = data.bmbites[3] ?? -1;
        let safe2 = cquad.filter((q) => q !== beam3 + 1);
        safe2 = safe2.filter((q) => q !== (beam3 === 0 ? 7 : beam3 - 1));
        safe2 = safe2.filter((q) => q !== beam4 + 1);
        safe2 = safe2.filter((q) => q !== (beam4 === 0 ? 7 : beam4 - 1));

        if (safe1[0] === undefined || safe2[0] === undefined)
          return;
        if (safe1.length !== 1)
          return;
        if (safe2.length !== 1)
          return;

        const [v1, v2] = [safe1[0] ?? -1, safe2[0] ?? -1];
        const q1 = output[Directions.outputFrom8DirNum(v1)]!();
        const q2 = output[Directions.outputFrom8DirNum(v2)]!();
        const a1 = output[AutumnDir.arrowFromNum(v1)]!();
        const a2 = output[AutumnDir.arrowFromNum(v2)]!();
        data.bmquad = v2;
        return output.saves!({ arrow1: a1, quad1: q1, arrow2: a2, quad2: q2 });
      },
      outputStrings: moonStrings,
    },
    {
      id: 'R8S Beckon Moonlight Spread Collect',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.phase === 'moonlight' && data.me === matches.target,
      run: (data) => data.spread = true,
    },
    {
      id: 'R8S Beckon Moonlight Spread/Stack',
      type: 'HeadMarker',
      netRegex: { id: '005D', capture: false },
      condition: (data) => data.phase === 'moonlight',
      delaySeconds: 0.1,
      durationSeconds: 4.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => data.spread ? output.spread!() : output.stack!(),
      run: (data) => data.spread = undefined,
      outputStrings: {
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Beckon Moonlight Quadrant Two',
      type: 'StartsUsing',
      // A3C2 => Moonbeam's Bite dash with Left cleave
      // A3C3 => Moonbeam's Bite dash with Right cleave
      netRegex: { id: ['A3C2', 'A3C3'], source: 'Moonlit Shadow', capture: true },
      condition: (data) => {
        data.bmindex++;
        return data.bmindex === 2;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (data, _matches, output) => {
        const v = data.bmquad ?? -1;
        const q = output[Directions.outputFrom8DirNum(v)]!();
        const a = output[AutumnDir.arrowFromNum(v)]!();
        return output.safe!({ arrow: a, quad: q });
      },
      outputStrings: moonStrings,
    },
    {
      id: 'R8S Weal of Stone Cardinals',
      // This appears to always be cardinals safe
      type: 'StartsUsing',
      netRegex: { id: 'A792', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.cardinals!(),
      outputStrings: {
        cardinals: Outputs.cardinals,
      },
    },
    // Phase 2
    // TODO: Timeline based callout for light parties for Quake III
    // TODO: Timeline base callout for mooncleaver bait
    {
      id: 'R8S Quake III',
      type: 'StartsUsing',
      netRegex: { id: 'A45A', source: 'Howling Blade', capture: false },
      alertText: (_data, _matches, output) => output.healerGroups!(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      // headmarkers with casts:
      // A45D (Ultraviolent Ray)
      // TODO: Determine platform to move to based on player positions/role?
      id: 'R8S Ultraviolent Ray Target',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => {
        return output.uvRayOnYou!();
      },
      outputStrings: {
        uvRayOnYou: {
          en: 'UV Ray on YOU',
          ko: '내게 UV레이',
        },
      },
    },
    {
      id: 'R8S Twinbite',
      type: 'StartsUsing',
      netRegex: { id: 'A4CD', source: 'Howling Blade', capture: true },
      response: Responses.tankBuster(),
    },
    {
      id: 'R8S Fanged Maw/Perimeter Collect',
      // A463 Fanged Maw (In cleave)
      // A464 Fanged Perimeter (Out cleave)
      type: 'StartsUsing',
      netRegex: { id: ['A463', 'A464'], source: 'Gleaming Fang', capture: true },
      run: (data, matches) => data.hblow = matches.id === 'A463' ? 'out' : 'in',
    },
    {
      id: 'R8S Hero\'s Blow',
      // Has two casts
      // A45F for Hero's Blow Left cleave
      // A460 for Hero's Blow Left cleave damage
      // A461 Hero's Blow Right cleave
      // A462 Hero's Blow Right cleave damage
      // Hero's Blow targets a player, the player could be anywhere
      // Call relative to boss facing
      type: 'StartsUsing',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;

        data.hsafe = matches.id === 'A45F'
          ? Math.abs(AutumnDir.hdgNum8(actor.Heading) - 4) % 16
          : (AutumnDir.hdgNum8(actor.Heading) + 4) % 16;
      },
      infoText: (data, _matches, output) => {
        const inout = output[data.hblow ?? 'unknown']!();
        const dir = output[AutumnDir.arrowFromNum(data.hsafe ?? -1)]!();
        return output.text!({ inout: inout, dir: dir });
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        text: {
          en: '${inout} + ${dir}',
          ko: '${inout} + ${dir}',
        },
        unknown: Outputs.unknown,
        ...AutumnDir.stringsArrow,
      },
    },
    {
      // headmarkers with casts:
      // A467 (Elemental Purge)
      // A468 (Aerotemporal Blast) on one random non-tank
      // A469 (Geotemporal Blast) on one Tank
      id: 'R8S Elemental Purge Targets',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: (data) => data.phase === '2nd',
      infoText: (data, matches, output) => {
        data.collect.push(matches.target);
        if (data.collect.length < 2)
          return;

        const name1 = data.party.member(data.collect[0]);
        const name2 = data.party.member(data.collect[1]);

        return output.purgeOnPlayers!({ player1: name1.jobAbbr, player2: name2.jobAbbr });
      },
      run: (data) => {
        if (data.collect.length >= 2)
          data.collect = [];
      },
      outputStrings: {
        purgeOnPlayers: {
          en: 'Elemental Purge on ${player1} and ${player2}',
          ko: '퍼지: ${player1}, ${player2}',
        },
      },
    },
    {
      id: 'R8S Twofold Tempest Initial Tether',
      type: 'Tether',
      netRegex: { id: '0054', capture: true },
      suppressSeconds: 50, // Duration of mechanic
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;

        const northTwoPlatforms = 94;
        const dirNS = actor.PosY < northTwoPlatforms ? 'N' : 'S';
        const dirEW = actor.PosX > centerX ? 'E' : 'W';

        if (dirNS === 'N' && dirEW === 'E')
          data.tfdir = 'dirNE';
        else if (dirNS === 'S' && dirEW === 'E')
          data.tfdir = 'dirSE';
        else if (dirNS === 'S' && dirEW === 'W')
          data.tfdir = 'dirSW';
        else if (dirNS === 'N' && dirEW === 'W')
          data.tfdir = 'dirNW';
      },
      infoText: (data, _matches, output) => {
        // Default starting tether locations
        const startingDir1 = 'dirSE';
        const startingDir2 = 'dirSW';

        const initialDir = data.tfdir ?? 'unknown';

        switch (initialDir) {
          case startingDir1:
          case startingDir2:
            if (data.twofold)
              return output.tetherOnYou!();
            return output.tetherOnDir!({ dir: output[initialDir]!() });
          case 'dirNE':
            if (data.twofold)
              return output.passTetherDir!({ dir: output[startingDir1]!() });
            return output.tetherOnDir!({ dir: output[startingDir1]!() });
          case 'dirNW':
            if (data.twofold)
              return output.passTetherDir!({ dir: output[startingDir2]!() });
            return output.tetherOnDir!({ dir: output[startingDir2]!() });
          case 'unknown':
            return output.tetherOnDir!({ dir: output['unknown']!() });
        }
      },
      run: (data) => {
        // Set initialDir if pass was needed
        if (data.tfdir === 'dirNE')
          data.tfdir = 'dirSE';
        if (data.tfdir === 'dirNW')
          data.tfdir = 'dirSW';
      },
      outputStrings: {
        passTetherDir: {
          en: 'Pass Tether to ${dir}',
          ko: '줄 넘겨요: ${dir}${dir}',
        },
        tetherOnYou: {
          en: 'Tether on YOU',
          ko: '내게 줄',
        },
        tetherOnDir: {
          en: 'Tether on ${dir}',
          ko: '줄: ${dir}${dir}',
        },
        ...AutumnDir.stringsDirArrowCross,
      },
    },
    {
      id: 'R8S Twofold Tempest Tether Pass',
      // Call pass after the puddle has been dropped
      type: 'Ability',
      netRegex: { id: 'A472', source: 'Howling Blade', capture: false },
      condition: (data) => data.twofold,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.twofold) {
          if (data.tfdir === 'unknown')
            return output.passTether!();
          if (data.tfindex === 1) {
            const passDir = data.tfdir === 'dirSE' ? 'dirNE' : 'dirNW';
            return output.passTetherDir!({ dir: output[passDir]!() });
          }
          if (data.tfindex === 2) {
            const passDir = data.tfdir === 'dirSE' ? 'dirNW' : 'dirNE';
            return output.passTetherDir!({ dir: output[passDir]!() });
          }
          if (data.tfindex === 3) {
            const passDir = data.tfdir === 'dirSE' ? 'dirSW' : 'dirSE';
            return output.passTetherDir!({ dir: output[passDir]!() });
          }
        }
        if (data.tfdir === 'unknown')
          return output.tetherOnDir!({ dir: Outputs.unknown });
        if (data.tfindex === 1) {
          const passDir = data.tfdir === 'dirSE' ? 'dirNE' : 'dirNW';
          return output.tetherOnDir!({ dir: output[passDir]!() });
        }
        if (data.tfindex === 2) {
          const passDir = data.tfdir === 'dirSE' ? 'dirNW' : 'dirNE';
          return output.tetherOnDir!({ dir: output[passDir]!() });
        }
        if (data.tfindex === 3) {
          const passDir = data.tfdir === 'dirSE' ? 'dirSW' : 'dirSE';
          return output.tetherOnDir!({ dir: output[passDir]!() });
        }
      },
      outputStrings: {
        passTether: {
          en: 'Pass Tether',
          ko: '줄 넘겨요',
        },
        passTetherDir: {
          en: 'Pass Tether ${dir}',
          ko: '줄 넘겨요: ${dir}${dir}',
        },
        tetherOnDir: {
          en: 'Tether On ${dir}',
          ko: '줄: ${dir}${dir}',
        },
        ...AutumnDir.stringsDirArrowCross,
      },
    },
    {
      // headmarker on boss with casts:
      // A477 Champion's Circuit (clockwise)
      // A478 Champion's Circuit (counterclockwise)
      // Followed by instant cast turns:
      // A4A1 Champion's Circuit (clockwise)
      // A4A2 Champion's Circuit (counterclockwise)
      // TODO: Have starting direction?
      id: 'R8S Champion\'s Circuit Direction',
      type: 'HeadMarker',
      netRegex: { id: ['01F5', '01F6'] },
      infoText: (_data, matches, output) => {
        if (matches.id === '01F5')
          return output.cw!();
        return output.ccw!();
      },
      outputStrings: {
        cw: {
          en: '<== Clockwise',
          ko: '❰❰❰왼쪽으로',
        },
        ccw: {
          en: 'Counterclockwise ==>',
          ko: '오른쪽으로❱❱❱',
        },
      },
    },
    {
      id: 'R8S Champion\'s Circuit Mechanic Order',
      // First Casts:
      // A479 Champion's Circuit Sides safe (middle cleave)
      // A47A Champion's Circuit Donut
      // A47B Champion's Circuit In safe (halfmoon cleave)
      // A47C Champion's Circuit Out safe (in circle)
      // A47D Champion's Circuit In safe (halfmoon cleave)
      // Subsequent Casts:
      // A47E Champion's Circuit Sides (middle cleave)
      // A47F Champion's Circuit Donut
      // A480 Champion's Circuit In safe (halfmoon cleave)
      // A481 Champion's Circuit Out safe (in circle)
      // A482 Champion's Circuit In safe (halfmoon cleave)
      // Actor casting the donut is trackable to center of its platform
      // 100,    117.5  Center of S platform
      // 83.36,  105.41 Center of SW platform
      // 89.71,  85.84  Center of NW platform
      // 110.29, 85.84  Center of NE platform
      // 116.64, 105.41 Center of SE platform
      type: 'StartsUsing',
      netRegex: { id: 'A47A', source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      durationSeconds: 26,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;

        data.chdonut = actor.PosX;
      },
      infoText: (data, _matches, output) => {
        if (data.chclock === undefined || data.chdonut === undefined)
          return;

        // Static orders
        const order = ['donut', 'in', 'out', 'in', 'sides'];
        const order1 = ['in', 'out', 'in', 'sides', 'donut'];
        const order2 = ['out', 'in', 'sides', 'donut', 'in'];
        const order3 = ['in', 'sides', 'donut', 'in', 'out'];
        const order4 = ['sides', 'donut', 'in', 'out', 'in'];

        let newOrder;
        const x = data.chdonut;
        if (x > 99 && x < 101) {
          // S Platform
          newOrder = order;
        } else if (x > 82 && x < 85) {
          // SW Platform
          newOrder = order1;
        } else if (x > 88 && x < 91) {
          // NW Platform
          newOrder = order2;
        } else if (x > 109 && x < 112) {
          // NE Platform
          newOrder = order3;
        } else if (x > 115 && x < 118) {
          // SE Platform
          newOrder = order4;
        }

        // Failed to get clock or matching x coords
        if (
          newOrder === undefined || newOrder[0] === undefined ||
          newOrder[1] === undefined || newOrder[2] === undefined ||
          newOrder[3] === undefined || newOrder[4] === undefined
        )
          return;

        data.chorder = newOrder;

        return output.mechanics!({
          dir: output[data.chclock]!(),
          mech1: output[newOrder[0]]!(),
          mech2: output[newOrder[1]]!(),
          mech3: output[newOrder[2]]!(),
          mech4: output[newOrder[3]]!(),
          mech5: output[newOrder[4]]!(),
        });
      },
      outputStrings: championStrings,
    },
    {
      id: 'R8S Champion\'s Circuit Safe Spot',
      // Gleaming Fang for the South Platform is at 96, 126.5 or 104, 126.5
      // A476 Gleaming Barrage
      type: 'StartsUsing',
      netRegex: { id: 'A476', source: 'Gleaming Fang', capture: true },
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;

        const dirNum = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        if (dirNum === 4)
          data.chfang = actor.PosX;
      },
      infoText: (data, _matches, output) => {
        // Have not found the south fang yet
        if (data.chfang === undefined)
          return;
        const dir = data.chfang < 100 ? output.right!() : output.left!();

        if (
          data.chorder === undefined ||
          data.chorder[data.chindex] === undefined
        )
          return;

        if (data.chorder[data.chindex] === 'sides')
          return data.chfang < 100 ? output.rightSide!() : output.leftSide!();

        const mech = data.chorder[data.chindex];
        if (mech === undefined)
          return;
        return output.dirMechanic!({ dir: dir, mech: output[mech]!() });
      },
      run: (data) => {
        if (data.chfang !== undefined) {
          data.chindex = data.chindex + 1;
          data.chfang = undefined;
        }
      },
      outputStrings: championStrings,
    },
    {
      id: 'R8S Lone Wolf\'s Lament Tethers',
      type: 'Tether',
      netRegex: { id: ['013E', '013D'] },
      condition: (data, matches) => {
        if (data.me === matches.target || data.me === matches.source)
          return true;
        return false;
      },
      infoText: (_data, matches, output) => {
        if (matches.id === '013E')
          return output.farTetherOnYou!();
        return output.closeTetherOnYou!();
      },
      outputStrings: {
        closeTetherOnYou: {
          en: 'Close Tether on YOU',
          ko: '내게 가까운 줄',
        },
        farTetherOnYou: {
          en: 'Far Tether on YOU',
          ko: '내게 멀리 줄',
        },
      },
    },
    {
      id: 'R8S Howling Eight',
      type: 'StartsUsing',
      netRegex: { id: 'A494', source: 'Howling Blade', capture: false },
      durationSeconds: 15,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack x8',
          ja: '頭割り x8',
          cn: '8次分摊',
          ko: '뭉쳐욧 x8',
        },
      },
    },
    {
      id: 'R8S Mooncleaver Platform',
      // Trigger on last hit of Howling Eight (AA0A for first set, A494 others)
      type: 'Ability',
      netRegex: { id: ['A494', 'AA0A'], source: 'Howling Blade', capture: false },
      condition: (data) => {
        // Tracking how many platforms will remain
        data.platforms--;
        return data.platforms !== 0;
      },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.changePlatform!(),
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ko: '다른 플랫폼으로!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Howling Blade': 'ハウリングブレード',
        'Moonlit Shadow': 'ハウリングブレードの幻影',
        'Wolf of Stone': '土の狼頭',
        'Wolf of Wind': '風の狼頭',
        'Gleaming Fang': '光の牙',
      },
    },
  ],
};

export default triggerSet;
