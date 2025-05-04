import Autumn, { AutumnCond, AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const phases = {
  'A3C8': 'pack', // Tactical Pack
  'A3CB': 'saber', // Ravenous Saber
  'A3C1': 'beckon', // Beckon Moonlight
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
    en: '${quad}',
    ko: '${quad}',
  },
  saves: {
    en: '${quad1} => ${quad2}',
    ko: '${quad1} 🔜 ${quad2}',
  },
  ...AutumnDir.stringsAimCross,
} as const;

const centerX = 100;
const centerY = 100;

export interface Data extends RaidbossData {
  phase: Phase;
  // 전반부
  decays: number;
  gales: number;
  tpnum?: number;
  tpvsw?: 'stone' | 'wind';
  tpcnt: number;
  tpsgm: number;
  bmcnt: number;
  bmbts: number[];
  bmquad?: string;
  // 후반부
  heroes: number;
  hsafe?: number;
  hblow?: 'in' | 'out';
  enrage: number;
  //
  spread?: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM4Savage',
  zoneId: ZoneId.AacCruiserweightM4Savage,
  timelineFile: 'r8s.txt',
  initData: () => ({
    phase: 'door',
    decays: 0,
    gales: 0,
    tpcnt: 0,
    tpsgm: 0,
    bmcnt: 0,
    bmbts: [],
    heroes: 0,
    chindex: 0,
    enrage: 5,
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
          ko: '(담당 플랫폼으로)',
        },
      },
    },
    {
      id: 'R8S Avoid Twinbite',
      regex: /Twinbite/,
      beforeSeconds: 9,
      infoText: (data, _matches, output) => {
        if (Autumn.isTank(data.moks))
          return output.tank!();
        return output.other!();
      },
      outputStrings: {
        tank: {
          en: 'Tank Buster Platform',
          ko: '(탱크 버스터 플랫폼으로)',
        },
        other: {
          en: 'Avoid Tank Buster Platform',
          ko: '(버스터 플랫폼 피해요)',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Positions',
      regex: /Ultraviolent Ray [123]/,
      beforeSeconds: 7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: '(나란히 정렬)',
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
          ko: '(나란히 정렬)',
        },
      },
    },
    {
      id: 'R8S Mooncleaver Bait',
      regex: /Mooncleaver$/,
      beforeSeconds: 11, // 3.7s castTime
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Mooncleaver',
          ko: '(문클레버, 처음 플랫폼으로)',
        },
      },
    },
    {
      id: 'R8S Rise of the Positions',
      regex: /Rise of the Hunter\'s Blade/,
      beforeSeconds: 14,
      infoText: (data, _matches, output) => {
        const extra = Autumn.isTank(data.moks)
          ? output.tank!()
          : Autumn.isHealer(data.moks)
          ? output.healer!()
          : output.dps!();
        return output.text!({ extra: extra });
      },
      outputStrings: {
        text: {
          en: 'Rise Positions - ${extra}',
          ko: '(줄다리기 ${extra} 플랫폼으로)',
        },
        tank: {
          en: 'Left top',
          ko: '왼쪽 위🡼',
        },
        healer: {
          en: 'Base',
          ko: '처음🡻',
        },
        dps: {
          en: 'Right',
          ko: '오른쪽🡺',
        },
      },
    },
    {
      id: 'R8S Howling Eight Initial Position',
      regex: /Ultraviolent Ray 4/,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Howling Eight Position',
          ko: '(처음 플랫폼으로)',
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
      run: (data) => data.phase = '2nd',
    },
    // //////////////////// 전반부 ////////////////////
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
          ja: '➕内側 + ペア',
          ko: '➕안으로 + 둘이 페어',
        },
        windCross: {
          en: 'In + Intercards + Partners',
          ja: '❌内側 + ペア',
          ko: '❌안으로 + 둘이 페어',
        },
        stonePlus: {
          en: 'Out + Cardinal + Protean',
          ja: '➕外側 + 散会',
          ko: '➕바깥으로 + 맡은 자리로',
        },
        stoneCross: {
          en: 'Out + InterCards + Protean',
          ja: '❌外側 + 散会',
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
          ja: 'ボスに近づく',
          ko: '보스랑 붙어요',
        },
        out: {
          en: 'Out',
          ja: 'ボスから離れる',
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
          ja: '❰❰❰時計回り',
          ko: '❰❰❰왼쪽으로',
        },
        right: {
          en: 'Counterclockwise ==>',
          ja: '反時計回り❱❱❱',
          ko: '오른쪽으로❱❱❱',
        },
      },
    },
    {
      id: 'R8S Aero III',
      type: 'StartsUsing',
      netRegex: { id: 'A3B7', source: 'Howling Blade', capture: false },
      condition: AutumnCond.notOnlyAutumn(),
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
          ja: '自分にAOE',
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
          ja: 'ノックバック + 線誘導',
          ko: '줄처리 넉백',
        },
        knockbackTowers: {
          en: 'Knockback Towers',
          ja: 'ノックバック + 塔踏み',
          ko: '타워 밟기 넉백',
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
      type: 'StartsUsing',
      netRegex: { id: 'A3DD', source: 'Wolf Of Stone', capture: true },
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
        data.tpvsw = matches.effectId === '1127' ? 'stone' : 'wind';
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        const debuff = output[data.tpvsw ?? 'unknown']!();
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
      run: (data) => data.tpcnt++,
    },
    {
      id: 'R8S Tactical Pack Wind',
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      // Magic Vulnerabilities from Pack Predation and Alpha Wind are 0.96s
      condition: (data, matches) =>
        data.phase === 'pack' && data.tpvsw === 'wind' && parseFloat(matches.duration) < 2,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.tpnum === data.tpcnt)
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
        data.phase === 'pack' && data.tpvsw === 'stone' && parseFloat(matches.duration) > 2,
      preRun: (data) => data.tpsgm++,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.tpnum === data.tpcnt && (data.tpsgm % 2) === 1)
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
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
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
      id: 'R8S Weal of Stone',
      type: 'StartsUsing',
      netRegex: { id: 'A78E', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          lines: {
            en: 'Lines',
            ko: '직선 장판',
          },
          tank: {
            en: 'Lines',
            ko: '직선 장판 + 탱크 스위치',
          },
        };
        if (Autumn.isTank(data.moks))
          return { alertText: output.tank!() };
        return { infoText: output.lines!() };
      },
      run: (data) => data.spread = undefined,
    },
    {
      id: 'R8S Beckon Moonlight Quadrants',
      type: 'Ability',
      // A3E0 => Right cleave self-cast
      // A3E1 => Left cleave self-cast
      netRegex: { id: ['A3E0', 'A3E1'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: 0.1,
      durationSeconds: (data) => data.bmbts.length < 2 ? 2 : 10,
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
          data.bmbts.push(ccw);
        } else {
          const cw = (num + 2) % 8;
          data.bmbts.push(cw);
        }
      },
      infoText: (data, _matches, output) => {
        if (data.bmbts.length === 1 || data.bmbts.length === 3)
          return;

        const cquad = [1, 3, 5, 7];
        const beam1 = data.bmbts[0] ?? -1;
        const beam2 = data.bmbts[1] ?? -1;
        let safe1 = cquad.filter((q) => q !== beam1 + 1);
        safe1 = safe1.filter((q) => q !== (beam1 === 0 ? 7 : beam1 - 1));
        safe1 = safe1.filter((q) => q !== beam2 + 1);
        safe1 = safe1.filter((q) => q !== (beam2 === 0 ? 7 : beam2 - 1));

        // Early output for first two
        if (data.bmbts.length === 2) {
          if (safe1.length !== 1 || safe1[0] === undefined)
            return;

          const q = AutumnDir.dirFromNum(safe1[0] ?? -1);
          return output.safe!({ quad: output[q]!() });
        }

        const beam3 = data.bmbts[2] ?? -1;
        const beam4 = data.bmbts[3] ?? -1;
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

        const q1 = output[AutumnDir.dirFromNum(safe1[0] ?? -1)]!();
        data.bmquad = output[AutumnDir.dirFromNum(safe2[0] ?? -1)]!();
        return output.saves!({ quad1: q1, quad2: data.bmquad });
      },
      outputStrings: moonStrings,
    },
    {
      id: 'R8S Beckon Moonlight Spread Collect',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.phase === 'beckon' && data.me === matches.target,
      run: (data) => data.spread = true,
    },
    {
      id: 'R8S Beckon Moonlight Spread/Stack',
      type: 'HeadMarker',
      netRegex: { id: '005D', capture: false },
      condition: (data) => data.phase === 'beckon',
      delaySeconds: 0.1,
      durationSeconds: 4.5,
      suppressSeconds: 10,
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
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      durationSeconds: 4,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          spread: Outputs.positions,
          stack: Outputs.stacks,
          ...moonStrings,
        };
        data.bmcnt++;
        if (data.bmcnt === 2)
          return { infoText: output.safe!({ quad: data.bmquad }) };
        if (data.bmcnt === 3)
          return { alertText: data.spread ? output.spread!() : output.stack!() };
      },
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
    // //////////////////// 후반부 ////////////////////
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
      id: 'R8S Mooncleaver',
      type: 'StartsUsing',
      netRegex: { id: 'A465', source: 'Howling Blade', capture: false },
      infoText: (_data, _matches, output) => output.changePlatform!(),
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ko: '다른 플랫폼으로',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Ray Target',
      type: 'HeadMarker',
      netRegex: { id: '000E' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 3,
      alertText: (_data, _matches, output) => {
        return output.uvRayOnYou!();
      },
      outputStrings: {
        uvRayOnYou: {
          en: 'UV Ray on YOU',
          ko: '내게 레이저가!',
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
      type: 'StartsUsing',
      netRegex: { id: ['A463', 'A464'], source: 'Gleaming Fang', capture: true },
      run: (data, matches) => data.hblow = matches.id === 'A463' ? 'out' : 'in',
    },
    {
      id: 'R8S Hero\'s Blow',
      type: 'StartsUsing',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      infoText: (data, matches, output) => {
        const inout = output[data.hblow ?? 'unknown']!();
        const dir = matches.id === 'A45F' ? 'right' : 'left';
        return output.text!({ inout: inout, dir: output[dir]!() });
      },
      run: (data) => data.hsafe = undefined,
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        left: Outputs.arrowW,
        right: Outputs.arrowE,
        text: {
          en: '${inout} + ${dir}',
          ko: '${dir}${inout}',
        },
      },
    },
    {
      id: 'R8S Ultraviolent Ray 4',
      type: 'Ability',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: false },
      durationSeconds: 4,
      alertText: (data, _matches, output) => {
        data.heroes++;
        if (data.heroes === 2)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'UV Positions',
          ko: '담당 플랫폼으로! (곧 나란히)',
        },
      },
    },
    {
      id: 'R8S Elemental Purge Tank',
      type: 'HeadMarker',
      netRegex: { id: '0017' },
      condition: (data) => data.phase === '2nd',
      infoText: (data, matches, output) => {
        const m = data.party.member(matches.target);
        if (m.role_ !== 'tank')
          return;
        if (!Autumn.isTank(data.moks))
          return output.purge!({ name: m, job: m.job });
        if (data.me === matches.target)
          return output.itsme!();
        return output.provoke!();
      },
      outputStrings: {
        purge: {
          en: 'Purge: ${name} (${job})',
          ko: '퍼지: ${name} (${job})',
        },
        itsme: {
          en: 'Purge on YOU',
          ko: '(내게 퍼지! 헤이트 넘겨요)',
        },
        provoke: {
          en: '(Provoke)',
          ko: '(프로보크)',
        },
      },
    },
    {
      id: 'R8S Prowling Gale Pair',
      type: 'StartsUsing',
      netRegex: { id: 'A46E', source: 'Howling Blade', capture: false },
      condition: (data) => data.phase === '2nd',
      infoText: (_data, _matches, output) => output.towers!(),
      outputStrings: {
        towers: {
          en: 'Towers',
          ko: '페어 준비! 위치로',
        },
      },
    },
    {
      id: 'R8S Twofold Preparation',
      type: 'StartsUsing',
      netRegex: { id: 'A46F', source: 'Howling Blade' },
      condition: (data) => data.phase === '2nd',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1.5,
      durationSeconds: 3,
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => output.move!(),
      outputStrings: {
        move: {
          en: 'Light Party Platforms',
          ko: '담당 플랫폼으로!',
        },
      },
    },
    {
      id: 'R8S Lone Wolf\'s Lament Tethers',
      type: 'Tether',
      netRegex: { id: ['013E', '013D'] },
      condition: (data, matches) => data.me === matches.target || data.me === matches.source,
      infoText: (_data, matches, output) => matches.id === '013E' ? output.far!() : output.close!(),
      outputStrings: {
        close: {
          en: 'Close Tether on YOU',
          ko: '내게 🟩붙어 줄',
        },
        far: {
          en: 'Far Tether on YOU',
          ko: '내게 🟦떨어져 줄',
        },
      },
    },
    {
      id: 'R8S Howling Eight',
      type: 'StartsUsing',
      netRegex: { id: ['AA02', 'A494'], source: 'Howling Blade', capture: false },
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
      id: 'R8S Mooncleaver (Enrage Sequence)',
      type: 'StartsUsing',
      netRegex: { id: 'A74C', source: 'Howling Blade', capture: false },
      condition: (data) => {
        data.enrage--;
        return data.enrage !== 0;
      },
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.enrage > 1)
          return output.changePlatform!();
        if (data.enrage === 1)
          return output.finalPlatform!();
      },
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ko: '플랫폼 옮겨요 ',
        },
        finalPlatform: {
          en: 'Change Platform (Final)',
          ko: '마지막 플랫폼으로',
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
