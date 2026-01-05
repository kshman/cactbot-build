import Autumn, { AutumnCond, AutumnDir } from '../../../../../resources/autumn';
import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

const centerX = 100;
const centerY = 100;

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
    ja: '(${debuff} ${num}番目)',
    ko: '(${debuff} ${num}번째)',
  },
  now: {
    en: '${debuff} Now!',
    ja: '今 ${debuff}',
    ko: '지금 문대요: ${debuff}',
  },
  stone: {
    en: 'Stone',
    ja: '🟡石',
    ko: '🟡돌멩이',
  },
  wind: {
    en: 'Wind',
    ja: '🟢風',
    ko: '🟢바람',
  },
  unknown: Outputs.unknown,
} as const;

export interface Data extends RaidbossData {
  phase: Phase;
  // 전반부
  decays: number;
  gales: number;
  tpnum?: number;
  tpvalue?: 'stone' | 'wind';
  tpcount: number;
  tpsurge: number;
  bmcleaves: number;
  bmbites: number[];
  // 후반부
  heroes: number;
  hsafe?: number;
  hfang?: 'in' | 'out';
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
    tpcount: 0,
    tpsurge: 0,
    bmcleaves: 0,
    bmbites: [],
    heroes: 0,
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
          ja: 'Light Party Platform',
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
          ja: 'Tank Buster Platform',
          ko: '(탱크 버스터 플랫폼으로)',
        },
        other: {
          en: 'Avoid Tank Buster Platform',
          ja: 'Avoid Tank Buster Platform',
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
          ja: 'UV Positions',
          ko: '(나란히 나란히)',
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
          ja: 'UV Positions',
          ko: '(나란히 나란히)',
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
          ja: 'Bait Mooncleaver',
          ko: '(처음 플랫폼으로)',
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
          ja: 'Rise Positions - ${extra}',
          ko: '(줄다리기 ${extra} 플랫폼으로)',
        },
        tank: {
          en: 'Left top',
          ja: 'Left top',
          ko: '왼쪽 위🡼',
        },
        healer: {
          en: 'Base',
          ja: 'Base',
          ko: '처음🡻',
        },
        dps: {
          en: 'Right',
          ja: 'Right',
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
          ja: 'Howling Eight Position',
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
          ja: 'ノックバック + 扇',
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
          ja: '🟩風の方',
          ko: '🟩바람으로',
        },
        stone: {
          en: 'Yellow side',
          ja: '🟨石の方',
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
        data.tpvalue = matches.effectId === '1127' ? 'stone' : 'wind';
      },
      durationSeconds: 5,
      infoText: (data, _matches, output) => {
        const debuff = output[data.tpvalue ?? 'unknown']!();
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
        data.phase === 'pack' && data.tpvalue === 'wind' && parseFloat(matches.duration) < 2,
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
        data.phase === 'pack' && data.tpvalue === 'stone' && parseFloat(matches.duration) > 2,
      preRun: (data) => data.tpsurge++,
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
      id: 'R8S Terrestrial Rage Stack',
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
          ja: '回避! 🔜 ${mech}',
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
      infoText: (_data, _matches, output) => output.lines!(),
      run: (data) => data.spread = undefined,
      outputStrings: {
        lines: {
          en: 'Lines',
          ja: '直線AOE',
          ko: '직선 장판',
        },
      },
    },
    {
      id: 'R8S Beckon Moonlight',
      type: 'Ability',
      netRegex: { id: ['A3E0', 'A3E1'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: 0.1,
      // durationSeconds: (data) => data.bmbites.length < 2 ? 2 : 10,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined)
          return;

        const num = AutumnDir.xyToNum8(actor.PosX, actor.PosY, centerX, centerY);
        if (matches.id === 'A3E0') {
          const ccw = num === 0 ? 6 : num - 2;
          data.bmbites.push(ccw);
        } else {
          const cw = (num + 2) % 8;
          data.bmbites.push(cw);
        }
      },
      infoText: (data, _matches, output) => {
        if (data.bmbites.length !== 2)
          return;

        const b1 = data.bmbites[0] ?? -1;
        const b2 = data.bmbites[1] ?? -1;
        let safe = [1, 3, 5, 7].filter((q) => q !== b1 + 1);
        safe = safe.filter((q) => q !== (b1 === 0 ? 7 : b1 - 1));
        safe = safe.filter((q) => q !== b2 + 1);
        safe = safe.filter((q) => q !== (b2 === 0 ? 7 : b2 - 1));
        if (safe.length !== 1 || safe[0] === undefined)
          return;

        const q = AutumnDir.dirFromNum(safe[0] ?? -1);
        return output.safe!({ quad: output[q]!() });
      },
      outputStrings: {
        safe: {
          en: '${quad}',
          ja: '${quad}',
          ko: '${quad}',
        },
        ...AutumnDir.stringsAimCross,
      },
    },
    {
      id: 'R8S Beckon Moonlight Spread',
      type: 'HeadMarker',
      netRegex: { id: '008B' },
      condition: (data, matches) => data.phase === 'beckon' && data.me === matches.target,
      run: (data) => data.spread = true,
    },
    {
      id: 'R8S Beckon Moonlight Stack',
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
      id: 'R8S Beckon Moonlight Cleave',
      type: 'StartsUsing',
      netRegex: { id: ['A3C2', 'A3C3'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      durationSeconds: 3,
      alertText: (data, _matches, output) => {
        data.bmcleaves++;
        if (data.bmcleaves === 3)
          return data.spread ? output.spread!() : output.stack!();
      },
      outputStrings: {
        spread: Outputs.positions,
        stack: Outputs.stacks,
      },
    },
    {
      id: 'R8S Weal of Stone Cardinals',
      type: 'StartsUsing',
      netRegex: { id: 'A792', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Cardinals',
          ja: '竜の頭、十字回避',
          ko: '용머리! 십자로',
        },
      },
    },
    // //////////////////// 후반부 ////////////////////
    {
      id: 'R8S Quake III',
      type: 'StartsUsing',
      netRegex: { id: 'A45A', source: 'Howling Blade', capture: false },
      response: Responses.healerGroups('alert'),
    },
    {
      id: 'R8S Mooncleaver',
      type: 'StartsUsing',
      netRegex: { id: 'A465', source: 'Howling Blade', capture: false },
      infoText: (_data, _matches, output) => output.changePlatform!(),
      outputStrings: {
        changePlatform: {
          en: 'Change Platform',
          ja: '別のプラットフォームへ',
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
          ja: '自分に❄️レイ',
          ko: '내게 ❄️레이저가!',
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
      run: (data, matches) => data.hfang = matches.id === 'A463' ? 'out' : 'in',
    },
    {
      id: 'R8S Hero\'s Blow',
      type: 'StartsUsing',
      netRegex: { id: ['A45F', 'A461'], source: 'Howling Blade', capture: true },
      delaySeconds: 0.3,
      infoText: (data, matches, output) => {
        const inout = output[data.hfang ?? 'unknown']!();
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
          ja: '${dir}${inout}',
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
          ja: '担当プラットフォームへ',
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
        // 블루메 친화적이지 않음
        const m = data.party.member(matches.target);
        if (m.role_ !== 'tank')
          return;
        if (!Autumn.isTank(data.moks))
          return output.purge!({ target: m });
        if (data.me === matches.target)
          return output.itsme!();
        return output.provoke!();
      },
      outputStrings: {
        purge: {
          en: 'Purge: ${target}',
          ja: 'パージ: ${target}',
          ko: '퍼지: ${target}',
        },
        itsme: {
          en: 'Purge on YOU',
          ja: '(自分にパージ、シャク)',
          ko: '(내게 퍼지! 헤이트 넘겨요)',
        },
        provoke: {
          en: '(Provoke)',
          ja: '(挑発)',
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
          ja: 'まもなくペア',
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
          ja: '担当プラットフォームへ',
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
          ja: '自分に🟩近づく線',
          ko: '내게 🟩붙어 줄',
        },
        far: {
          en: 'Far Tether on YOU',
          ja: '自分に🟦離れる線',
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
          ja: '別のプラットフォームへ',
          ko: '플랫폼 옮겨요 ',
        },
        finalPlatform: {
          en: 'Change Platform (Final)',
          ja: '最後のプラットフォームへ',
          ko: '마지막 플랫폼으로',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Eminent Reign/Revolutionary Reign': 'Eminent/Revolutionary Reign',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Gleaming Fang': 'Lichtreißer',
        'Howling Blade': 'Heulende Klinge',
        'Moonlit Shadow': 'heulend(?:e|er|es|en) Phantom',
        'Wolf Of Stone': 'Wolf der Erde',
        'Wolf of Stone': 'Wolf der Erde',
        'Wolf of Wind': 'Wolf des Windes',
      },
      'replaceText': {
        '--adds-targetable--': '--Adds-anvisierbar--',
        '--shadow ': '--Schatten ',
        '--tank/line aoes--': '--Tank/Linien AoEs--',
        '\\(circles\\)': '(Kreise)',
        '\\(cones\\)': '(Kegel)',
        '\\(enrage\\)': '(Finalangriff)',
        '\\(Platform\\)': '(Plattform)',
        '\\(Towers\\)': '(Türme)',
        'Aero III': 'Windga',
        'Aerotemporal Blast': 'Temporärer Wind',
        'Alpha Stone': 'Erde des Lichtwolfs',
        'Alpha Wind': 'Wind des Lichtwolfs',
        'Bare Fangs': 'Lichtreißer-Beschwörung',
        'Beckon Moonlight': 'Phantomwolf-Beschwörung',
        'Breath of Decay': 'Milleniumssäuseln',
        'Champion\'s Circuit': 'Himmelsreigen',
        'Elemental Purge': 'Siegel des Windes',
        'Extraplanar Feast': 'Radikaler Raumspalter',
        'Extraplanar Pursuit': 'Raumspalter',
        'Fanged Charge': 'Lichtreißersturm',
        'Forlorn Stone': 'Heulende Erde',
        'Forlorn Wind': 'Heulender Wind',
        'Geotemporal Blast': 'Temporäres Beben',
        'Gleaming Barrage': 'Multiblitzkanone',
        'Gleaming Beam': 'Blitzartillerie',
        'Great Divide': 'Lichtspalter',
        'Gust': 'Böe',
        'Heavensearth': 'Großes Beben',
        'Hero\'s Blow': 'Leichte Beute',
        'Howling Eight': 'Achtfache Lichtkugel',
        'Howling Havoc': 'Ruf des Sturms',
        'Hunter\'s Harvest': 'Gierige Wolfsklinge',
        'Lone Wolf\'s Lament': 'Fluch des Wolfes',
        'Millennial Decay': 'Milleniumsverwitterung',
        'Moonbeam\'s Bite': 'Phantomwolfsklinge',
        'Mooncleaver': 'Klingensturz',
        'Pack Predation': 'Lichtwolfszirkel',
        'Prowling Gale': 'Windwolfszirkel',
        'Quake III': 'Seisga',
        'Ravenous Saber': 'Wirbellichtklinge',
        'Revolutionary Reign': 'Kreisendes Wolfsrudel',
        'Rise of the Howling Wind': 'Dämonenwolf: Himmelsturm',
        'Rise of the Hunter\'s Blade': 'Dämonenwolf: Klingenfluch',
        'Roaring Wind': 'Jaulender Wind',
        'Shadowchase': 'Echoklinge',
        'Stalking Stone': 'Leuchtende Erde',
        'Stalking Wind': 'Leuchtender Wind',
        'Starcleaver': 'Finaler Klingensturz',
        'Stonefang': 'Kunst der Erde',
        'Suspended Stone': 'Felsen',
        'Tactical Pack': 'Lichtwolf-Beschwörung',
        'Terrestrial Rage': 'Gaias Zorn',
        'Terrestrial Titans': 'Ruf der Erde',
        'Titanic Pursuit': 'Himmelschneider',
        'Towerfall': 'Turmsturz',
        'Tracking Tremors': 'Multi-Beben',
        'Twinbite': 'Doppelreißer',
        'Twofold Tempest': 'Orkanreißer',
        'Ultraviolent Ray': 'Ätherlicht',
        'Weal of Stone': 'Erdspalter',
        'Wind Surge': 'Windbombe',
        'Windfang': 'Kunst des Windes',
        'Winds of Decay': 'Milleniumstaifun',
        'Wolves\' Reign': 'Wolfsrudel',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Gleaming Fang': 'croc de lumière',
        'Howling Blade': 'Howling Blade',
        'Moonlit Shadow': 'double de Howling Blade',
        'Wolf Of Stone': 'loup de la terre',
        'Wolf of Stone': 'loup de la terre',
        'Wolf of Wind': 'loup du vent',
      },
      'replaceText': {
        '--adds-targetable--': '--Adds ciblables--',
        '--shadow ': '--Ombre ',
        '--tank/line aoes--': '--AOE Tank/En ligne--',
        '\\(circles\\)': '(Cercles)',
        '\\(cones\\)': '(Cônes)',
        '\\(enrage\\)': '(Enrage)',
        '\\(Platform\\)': '(Plateforme)',
        '\\(Towers\\)': '(Tours)',
        'Aero III': 'Méga Vent',
        'Aerotemporal Blast': 'Assaut tempétueux à retardement',
        'Alpha Stone': 'Terre du loup radieux',
        'Alpha Wind': 'Souffle du loup radieux',
        'Bare Fangs': 'Invocation des crocs radieux',
        'Beckon Moonlight': 'Invocation du loup spectral',
        'Breath of Decay': 'Souffle millénaire',
        'Champion\'s Circuit': 'Secousse cosmique',
        'Elemental Purge': 'Sceau du vent et de la terre',
        'Extraplanar Feast': 'Tranchage funeste du vide',
        'Extraplanar Pursuit': 'Tranchage du vide',
        'Fanged Charge': 'Assaut des crocs radieux',
        'Forlorn Stone': 'Hurlement de la terre',
        'Forlorn Wind': 'Hurlement du vent',
        'Geotemporal Blast': 'Assaut tellurique à retardement',
        'Gleaming Barrage': 'Rafale d\'artillerie éclair',
        'Gleaming Beam': 'Artillerie éclair',
        'Great Divide': 'Tranchage net',
        'Gust': 'Bourrasque',
        'Heavensearth': 'Secousse ciblée',
        'Hero\'s Blow': 'Frappe du manche',
        'Howling Eight': 'Octorayon',
        'Howling Havoc': 'Hurlement tempétueux',
        'Hunter\'s Harvest': 'Lame du loup vorace',
        'Lone Wolf\'s Lament': 'Malédiction du loup solitaire',
        'Millennial Decay': 'Érosion millénaire',
        'Moonbeam\'s Bite': 'Lame du loup spectral',
        'Mooncleaver': 'Tranchage éclair',
        'Pack Predation': 'Meute du loup radieux',
        'Prowling Gale': 'Meute des loups du vent',
        'Quake III': 'Méga Séisme',
        'Ravenous Saber': 'Rafale du loup radieux',
        'Revolutionary Reign': 'Lame de la meute tourbillonnante',
        'Rise of the Howling Wind': 'Tempête divine du loup mystique',
        'Rise of the Hunter\'s Blade': 'Lame maudite du loup mystique',
        'Roaring Wind': 'Déferlante du loup tempétueux',
        'Shadowchase': 'Tranchage mirage',
        'Stalking Stone': 'Onde du loup radieux',
        'Stalking Wind': 'Autan du loup radieux',
        'Starcleaver': 'Tranchage éclair final',
        'Stonefang': 'Magie tellurique',
        'Suspended Stone': 'Piliers rocheux',
        'Tactical Pack': 'Invocation du loup radieux',
        'Terrestrial Rage': 'Fureur tellurique',
        'Terrestrial Titans': 'Invocation tellurique',
        'Titanic Pursuit': 'Tranchage du loup spectral',
        'Towerfall': 'Écroulement',
        'Tracking Tremors': 'Secousses en cascade',
        'Twinbite': 'Frappe des crocs jumeaux',
        'Twofold Tempest': 'Tempête de crocs',
        'Ultraviolent Ray': 'Rayon mystique',
        'Weal of Stone': 'Fracas terrestre',
        'Wind Surge': 'Déflagration aérienne',
        'Windfang': 'Magie des tempêtes',
        'Winds of Decay': 'Tempête millénaire',
        'Wolves\' Reign': 'Lame de la meute',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Gleaming Fang': '光の牙',
        'Howling Blade': 'ハウリングブレード',
        'Moonlit Shadow': 'ハウリングブレードの幻影',
        'Wolf Of Stone': '土の狼頭',
        'Wolf of Stone': '土の狼頭',
        'Wolf of Wind': '風の狼頭',
      },
      'replaceText': {
        'Aero III': 'エアロガ',
        'Aerotemporal Blast': '時限風撃',
        'Alpha Stone': '光狼の土',
        'Alpha Wind': '光狼の風',
        'Bare Fangs': '光牙招来',
        'Beckon Moonlight': '幻狼招来',
        'Breath of Decay': '千年の風声',
        'Champion\'s Circuit': '廻天動地',
        'Elemental Purge': '風震の魔印',
        'Extraplanar Feast': '空間斬り・滅',
        'Extraplanar Pursuit': '空間斬り',
        'Fanged Charge': '突進光牙',
        'Forlorn Stone': '土の狼吼',
        'Forlorn Wind': '風の狼吼',
        'Geotemporal Blast': '時限震撃',
        'Gleaming Barrage': '連撃閃光砲',
        'Gleaming Beam': '閃光砲',
        'Great Divide': '一刀両断',
        'Gust': '旋風',
        'Heavensearth': '大震撃',
        'Hero\'s Blow': '鎧袖一触',
        'Howling Eight': '八連光弾',
        'Howling Havoc': '風塵の咆哮',
        'Hunter\'s Harvest': '貪狼の剣',
        'Lone Wolf\'s Lament': '孤狼の呪い',
        'Millennial Decay': '千年の風化',
        'Moonbeam\'s Bite': '幻狼剣',
        'Mooncleaver': '剛刃一閃',
        'Pack Predation': '光狼陣',
        'Prowling Gale': '風狼陣',
        'Quake III': 'クエイガ',
        'Ravenous Saber': '風塵光狼斬',
        'Revolutionary Reign': '廻の群狼剣',
        'Rise of the Howling Wind': '魔狼戦型・天嵐の相',
        'Rise of the Hunter\'s Blade': '魔狼戦型・呪刃の相',
        'Roaring Wind': '風狼豪波',
        'Shadowchase': '残影剣',
        'Stalking Stone': '光狼地烈波',
        'Stalking Wind': '光狼風烈波',
        'Starcleaver': '剛刃一閃・終',
        'Stonefang': '土の魔技',
        'Suspended Stone': '大岩石',
        'Tactical Pack': '光狼招来',
        'Terrestrial Rage': '大地の怒り',
        'Terrestrial Titans': '大地の呼び声',
        'Titanic Pursuit': '斬空剣',
        'Towerfall': '倒壊',
        'Tracking Tremors': '連震撃',
        'Twinbite': '双牙撃',
        'Twofold Tempest': '双牙暴風撃',
        'Ultraviolent Ray': '魔光',
        'Weal of Stone': '地烈波',
        'Wind Surge': '風爆',
        'Windfang': '風の魔技',
        'Winds of Decay': '千年の大風',
        'Wolves\' Reign': '群狼剣',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Gleaming Fang': '光牙',
        'Howling Blade': '剑嚎',
        'Moonlit Shadow': '剑嚎的幻影',
        'Wolf Of Stone': '土狼首',
        'Wolf of Stone': '土狼首',
        'Wolf of Wind': '风狼首',
      },
      'replaceText': {
        '--adds-targetable--': '--小怪可选中--',
        '--shadow ': '--幻影 ',
        '--tank/line aoes--': '--坦克/直线 AOE--',
        '\\(circles\\)': '(圆形)',
        '\\(cones\\)': '(扇形)',
        '\\(enrage\\)': '(狂暴)',
        '\\(Platform\\)': '(平台)',
        '\\(Towers\\)': '(塔)',
        'Aero III': '暴风',
        'Aerotemporal Blast': '定时风击',
        'Alpha Stone': '光狼之土',
        'Alpha Wind': '光狼之风',
        'Bare Fangs': '光牙召唤',
        'Beckon Moonlight': '幻狼召唤',
        'Breath of Decay': '千年风啸',
        'Champion\'s Circuit': '回天动地',
        'Elemental Purge': '风震魔印',
        'Eminent Reign': '扫击群狼剑',
        'Extraplanar Feast': '空间灭斩',
        'Extraplanar Pursuit': '空间斩',
        'Fanged Charge': '突进光牙',
        'Forlorn Stone': '土之狼吼',
        'Forlorn Wind': '风之狼吼',
        'Geotemporal Blast': '定时震击',
        'Gleaming Barrage': '连击闪光炮',
        'Gleaming Beam': '闪光炮',
        'Great Divide': '一刀两断',
        'Gust': '狂风',
        'Heavensearth': '大震击',
        'Hero\'s Blow': '铠袖一触',
        'Howling Eight': '八连光弹',
        'Howling Havoc': '风尘咆哮',
        'Hunter\'s Harvest': '贪狼之剑',
        'Lone Wolf\'s Lament': '独狼的诅咒',
        'Millennial Decay': '千年风化',
        'Moonbeam\'s Bite': '幻狼剑',
        'Mooncleaver': '刚刃一闪',
        'Pack Predation': '光狼阵',
        'Prowling Gale': '风狼阵',
        'Quake III': '爆震',
        'Ravenous Saber': '风尘光狼斩',
        'Revolutionary Reign': '旋击群狼剑',
        'Rise of the Howling Wind': '魔狼战形·飓风之相',
        'Rise of the Hunter\'s Blade': '魔狼战形·咒刃之相',
        'Roaring Wind': '风狼豪波',
        'Shadowchase': '残影剑',
        'Stalking Stone': '光狼地烈波',
        'Stalking Wind': '光狼风烈波',
        'Starcleaver': '刚刃一闪・终',
        'Stonefang': '土之魔技',
        'Suspended Stone': '巨岩',
        'Tactical Pack': '光狼召唤',
        'Terrestrial Rage': '大地之怒',
        'Terrestrial Titans': '大地的呼唤',
        'Titanic Pursuit': '斩空剑',
        'Towerfall': '崩塌',
        'Tracking Tremors': '连震击',
        'Twinbite': '双牙击',
        'Twofold Tempest': '双牙暴风击',
        'Ultraviolent Ray': '魔光',
        'Weal of Stone': '地烈波',
        'Wind Surge': '风爆',
        'Windfang': '风之魔技',
        'Winds of Decay': '千年狂风',
        'Wolves\' Reign': '群狼剑',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Gleaming Fang': '光の牙',
        'Howling Blade': 'ハウリングブレード',
        'Moonlit Shadow': 'ハウリングブレードの幻影',
        'Wolf Of Stone': '土の狼頭',
        'Wolf of Stone': '土の狼頭',
        'Wolf of Wind': '風の狼頭',
      },
      'replaceText': {
        // '--adds-targetable--': '', // FIXME '--小怪可选中--'
        // '--shadow ': '', // FIXME '--幻影 '
        // '--tank/line aoes--': '', // FIXME '--坦克/直线 AOE--'
        // '\\(circles\\)': '', // FIXME '(圆形)'
        // '\\(cones\\)': '', // FIXME '(扇形)'
        // '\\(enrage\\)': '', // FIXME '(狂暴)'
        // '\\(Platform\\)': '', // FIXME '(平台)'
        // '\\(Towers\\)': '', // FIXME '(塔)'
        'Aero III': '大勁風',
        // 'Aerotemporal Blast': '', // FIXME '定时风击' (RSV ID: 42088)
        // 'Alpha Stone': '', // FIXME '光狼之土'
        // 'Alpha Wind': '', // FIXME '光狼之风'
        'Bare Fangs': '光牙召喚',
        'Beckon Moonlight': '幻狼召喚',
        // 'Breath of Decay': '', // FIXME '千年风啸'
        // 'Champion\'s Circuit': '', // FIXME '回天动地'
        // 'Elemental Purge': '', // FIXME '风震魔印' (RSV ID: 42087)
        // 'Eminent Reign': '', // FIXME '扫击群狼剑'
        // 'Extraplanar Feast': '', // FIXME '空间灭斩'
        'Extraplanar Pursuit': '空間斬',
        'Fanged Charge': '突進光牙',
        // 'Forlorn Stone': '', // FIXME '土之狼吼'
        // 'Forlorn Wind': '', // FIXME '风之狼吼'
        // 'Geotemporal Blast': '', // FIXME '定时震击' (RSV ID: 42089)
        // 'Gleaming Barrage': '', // FIXME '连击闪光炮' (RSV ID: 42102)
        // 'Gleaming Beam': '', // FIXME '闪光炮' (RSV ID: 42078)
        'Great Divide': '一刀兩斷',
        'Gust': '狂風',
        'Heavensearth': '大震擊',
        // 'Hero\'s Blow': '', // FIXME '铠袖一触'
        // 'Howling Eight': '', // FIXME '八连光弹' (RSV ID: 42132)
        // 'Howling Havoc': '', // FIXME '风尘咆哮' (RSV ID: 41948)
        // 'Hunter\'s Harvest': '', // FIXME '贪狼之剑'
        // 'Lone Wolf\'s Lament': '', // FIXME '独狼的诅咒'
        // 'Millennial Decay': '', // FIXME '千年风化' (RSV ID: 41906)
        'Moonbeam\'s Bite': '幻狼劍',
        // 'Mooncleaver': '', // FIXME '刚刃一闪' (RSV ID: 42085)
        // 'Pack Predation': '', // FIXME '光狼阵' (RSV ID: 41932)
        // 'Prowling Gale': '', // FIXME '风狼阵' (RSV ID: 42117)
        'Quake III': '魔光',
        'Ravenous Saber': '風塵光狼斬',
        // 'Revolutionary Reign': '', // FIXME '旋击群狼剑'
        // 'Rise of the Howling Wind': '', // FIXME '魔狼战形·飓风之相' (RSV ID: 43050)
        // 'Rise of the Hunter\'s Blade': '', // FIXME '魔狼战形·咒刃之相'
        'Roaring Wind': '風狼豪波',
        'Shadowchase': '殘影劍',
        // 'Stalking Stone': '', // FIXME '光狼地烈波'
        // 'Stalking Wind': '', // FIXME '光狼风烈波'
        // 'Starcleaver': '', // FIXME '刚刃一闪・终' (RSV ID: 42141)
        // 'Stonefang': '', // FIXME '土之魔技'
        'Suspended Stone': '大岩石',
        'Tactical Pack': '光狼召喚',
        'Terrestrial Rage': '大地之怒',
        'Terrestrial Titans': '大地之喚',
        'Titanic Pursuit': '斬空劍',
        'Towerfall': '崩塌',
        'Tracking Tremors': '連震擊',
        // 'Twinbite': '', // FIXME '双牙击' (RSV ID: 42189)
        // 'Twofold Tempest': '', // FIXME '双牙暴风击' (RSV ID: 42100)
        // 'Ultraviolent Ray': '', // FIXME '魔光'
        'Weal of Stone': '地烈波',
        'Wind Surge': '風爆',
        // 'Windfang': '', // FIXME '风之魔技'
        // 'Winds of Decay': '', // FIXME '千年狂风' (RSV ID: 41909)
        'Wolves\' Reign': '群狼劍',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Gleaming Fang': '빛송곳니',
        'Howling Blade': '하울링 블레이드',
        'Moonlit Shadow': '하울링 블레이드의 환영',
        'Wolf Of Stone': '땅의 늑대머리',
        'Wolf of Stone': '땅의 늑대머리',
        'Wolf of Wind': '바람의 늑대머리',
      },
      'replaceText': {
        '--adds-targetable--': '--쫄 타겟가능--',
        '--shadow ': '--환영 ',
        '--tank/line aoes--': '--탱커/직선 장판--',
        '\\(circles\\)': '(원형)',
        '\\(cones\\)': '(부채꼴)',
        '\\(enrage\\)': '(전멸기)',
        '\\(Platform\\)': '(플랫폼)',
        '\\(Towers\\)': '(탑)',
        'Aero III': '에어로가',
        'Aerotemporal Blast': '시한 바람 공격',
        'Alpha Stone': '광랑토',
        'Alpha Wind': '광랑풍',
        'Bare Fangs': '빛송곳니 소환',
        'Beckon Moonlight': '환영 늑대 소환',
        'Breath of Decay': '천년의 바람소리',
        'Champion\'s Circuit': '회천동지',
        'Elemental Purge': '바람지진 각인',
        'Eminent Reign': '절단 군랑검',
        'Extraplanar Feast': '공간 베기: 멸절',
        'Extraplanar Pursuit': '공간 베기',
        'Fanged Charge': '돌진 빛송곳니',
        'Forlorn Stone': '땅의 늑대울음',
        'Forlorn Wind': '바람의 늑대울음',
        'Geotemporal Blast': '시한 지진 공격',
        'Gleaming Barrage': '연속 섬광포',
        'Gleaming Beam': '섬광포',
        'Great Divide': '일도양단',
        'Gust': '선풍',
        'Heavensearth': '대지진 공격',
        'Hero\'s Blow': '개수일촉',
        'Howling Eight': '8연속 빛 폭탄',
        'Howling Havoc': '풍진의 포효',
        'Hunter\'s Harvest': '탐랑검',
        'Lone Wolf\'s Lament': '고고한 늑대의 저주',
        'Millennial Decay': '천년의 풍화',
        'Moonbeam\'s Bite': '환랑검',
        'Mooncleaver': '강인일섬',
        'Pack Predation': '광랑진',
        'Prowling Gale': '풍랑진',
        'Quake III': '퀘이가',
        'Ravenous Saber': '풍진광랑참',
        'Revolutionary Reign': '회전 군랑검',
        'Rise of the Howling Wind': '마법 늑대 전법: 하늘바람',
        'Rise of the Hunter\'s Blade': '마법 늑대 전법: 저주칼날',
        'Roaring Wind': '풍랑호파',
        'Shadowchase': '잔영검',
        'Stalking Stone': '광랑지열파',
        'Stalking Wind': '광랑풍렬파',
        'Starcleaver': '강인일섬: 종결',
        'Stonefang': '땅의 마기술',
        'Suspended Stone': '거대한 암석',
        'Tactical Pack': '빛 늑대 소환',
        'Terrestrial Rage': '대지의 분노',
        'Terrestrial Titans': '대지의 부름',
        'Titanic Pursuit': '참공검',
        'Towerfall': '무너짐',
        'Tracking Tremors': '연속 지진 공격',
        'Twinbite': '쌍아격',
        'Twofold Tempest': '쌍아폭풍격',
        'Ultraviolent Ray': '마광',
        'Weal of Stone': '지열파',
        'Wind Surge': '바람 폭발',
        'Windfang': '바람의 마기술',
        'Winds of Decay': '천년의 태풍',
        'Wolves\' Reign': '군랑검',
      },
    },
  ],
};

export default triggerSet;
