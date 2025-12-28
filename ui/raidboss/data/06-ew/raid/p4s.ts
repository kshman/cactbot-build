import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// Part Two
// TODO: Better Dark Design/tether break callouts
// TODO: Wreath of Thorns 3 strategy (1 = melee, 2 = ranged) or
//       something more intelligent such as tracking the vulnerabilities?
// TODO: Heart Stake is tankbuster with DoT, does it need to be output differrently?
// TODO: Curtain Call tank swap

export interface Data extends RaidbossData {
  actingRole?: string;
  decOffset?: number;
  hasRoleCall?: boolean;
  pinaxCount?: number;
  wellShiftKnockback?: boolean;
  bloodrakeCounter?: number;
  act?: string;
  actHeadmarkers: { [name: string]: string };
  actFourThorn?: PluginCombatantState;
  thornIds?: number[];
  jumpDir1?: string;
  kickTwo?: boolean;
  fleetingImpulseCounter?: number;
  curtainCallGroup?: number;
  curtainCallTracker?: number;
  // YPP
  yppTetherRole?: string;
  yppDebuffRole?: string;
  yppBeloneCoilsCounter?: number;
}

const roleOutputStrings = {
  tankHealer: {
    en: 'Tank/Healer',
    ja: 'タンク＆ヒーラ',
    ko: '탱&힐',
  },
  dps: {
    en: 'DPS',
    ja: 'DPS',
    ko: 'DPS',
  },
  roleTethers: {
    en: '${role} Tethers',
    ja: '線もらう: ${role}',
    ko: '줄 받기: ${role}',
  },
  roleDebuffs: {
    en: '${role} Role Calls',
    ja: 'デバフもらう: ${role}',
    ko: '점박이 받기: ${role}',
  },
  roleEverything: {
    en: '${role} Everything',
    ja: '${role} 全てもらう',
    ko: '${role} 전부예욧!',
  },
  roleTowers: {
    en: '${role} Towers',
    ja: '塔: ${role}',
    ko: '타워: ${role}',
  },
  unknown: Outputs.unknown,
  // YPP
  getTether: {
    en: 'Get tether!!!',
    ko: '줄 받아욧!!!',
  },
  getRoleCall: {
    en: 'Get debuff!!!',
    ko: '점박이 받아욧!!!',
  },
  passRoleCall: {
    en: 'Pass debuff!!!',
    ko: '점박이 건네욧!!!',
  },
  haveRoleCall: {
    en: 'No debuffs!!!',
    ko: '점박이 안 받아도 되욧!!!',
  },
  stackTankHealer: {
    en: 'Stack in north!',
    ko: '북쪽에서 뭉쳐욧!',
  },
  stackDps: {
    en: 'Stack in south!',
    ko: '남쪽에서 뭉쳐욧!',
  },
  getTower: {
    en: 'Get tower!',
    ko: '타워로!',
  },
};

const curtainCallOutputStrings = {
  group: {
    en: 'Group ${num}',
    ja: '${num} 組',
    ko: '그룹: ${num}',
  },
};

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
// The first 1B marker in the encounter is an Elegant Evisceration (00DA).
// The first 1B marker in the phase 2 encounter is the Act 2 fire headmarker (012F).
const eviscerationMarker = parseInt('00DA', 16);
const orangeMarker = parseInt('012F', 16);

const getHeadmarkerId = (
  data: Data,
  matches: NetMatches['HeadMarker'],
  firstDecimalMarker: number,
) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 00DA.
  // (This makes the offset 0, and !0 is true.)
  if (typeof data.decOffset === 'undefined')
    data.decOffset = parseInt(matches.id, 16) - firstDecimalMarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const triggerSet: TriggerSet<Data> = {
  id: 'AsphodelosTheFourthCircleSavage',
  zoneId: ZoneId.AsphodelosTheFourthCircleSavage,
  timelineFile: 'p4s.txt',
  initData: () => {
    return {
      actHeadmarkers: {},
    };
  },
  timelineTriggers: [
    {
      id: 'P4S Dark Design',
      regex: /Dark Design/,
      beforeSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack for Puddle AOEs',
          ja: 'AoEを誘導',
          ko: '메테오 기다려요',
        },
      },
    },
    {
      id: 'P4S Kothornos Kick',
      regex: /Kothornos Kick/,
      beforeSeconds: 5.3,
      infoText: (data, _matches, output) => {
        let jumpDir = '';
        if (data.jumpDir1 === 'east')
          jumpDir = !data.kickTwo ? output.west!() : output.east!();
        else if (data.jumpDir1 === 'west')
          jumpDir = !data.kickTwo ? output.east!() : output.west!();
        else
          return output.baitJump!();

        return output.baitJumpDir!({ dir: jumpDir });
      },
      run: (data) => data.kickTwo = true,
      outputStrings: {
        baitJumpDir: {
          en: 'Bait Jump ${dir}?',
          ja: 'ジャンプ誘導?: ${dir}',
          ko: 'MT 점프 유도: ${dir}?',
        },
        baitJump: {
          en: 'Bait Jump?',
          ja: 'ジャンプ誘導?',
          ko: 'MT 점프 유도',
        },
        east: Outputs.east,
        west: Outputs.west,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P4S Kothornos Quake',
      regex: /Kothornos Quake/,
      beforeSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Earthshakers?',
          ja: 'アスシェイカー誘導?',
          ko: '어스세이커 유도',
        },
      },
    },
    {
      id: 'P4S Hemitheos\'s Water IV',
      regex: /Hemitheos's Water IV/,
      beforeSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Middle Knockback',
          ja: '真ん中でノックバック',
          ko: '물 넉백! 저항해욧!!!',
        },
      },
    },
    //
    {
      id: 'P4S Akanthai Act 1',
      regex: /Akanthai: Act 1/,
      beforeSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[Act 1]',
          ja: '[Act 1]',
          ko: '[제 1막: 덤불을 헤치며]',
        },
      },
    },
    //
    {
      id: 'P4S Akanthai Act 2',
      regex: /Akanthai: Act 2/,
      beforeSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[Act 2]',
          ja: '[Act 2]',
          ko: '[제 2막: 탑찾아 돌고돌기]',
        },
      },
    },
    //
    {
      id: 'P4S Akanthai Act 3',
      regex: /Akanthai: Act 3/,
      beforeSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[Act 3]',
          ja: '[Act 3]',
          ko: '[제 3막: 점프점프 레볼루션]',
        },
      },
    },
    //
    {
      id: 'P4S Akanthai Act 4',
      regex: /Akanthai: Act 4/,
      beforeSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[Act 4]',
          ja: '[Act 4]',
          ko: '[제 4막: 줄다리기, 그리고 남서로]',
        },
      },
    },
    //
    {
      id: 'P4S Akanthai Finale',
      regex: /Akanthai: Finale/,
      beforeSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[Finale]',
          ja: '[Finale]',
          ko: '[종막: 순서대로 타워에 들어가기]',
        },
      },
    },
    //
    {
      id: 'P4S Akanthai Curtain Call',
      regex: /Akanthai: Curtain Call/,
      beforeSeconds: 2,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '[Curtain Call]',
          ja: '[Curtain Call]',
          ko: '[커튼콜: 탱힐 6초전, DPS 11초전]',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'P4S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => {
        const isDoorBoss = data.act === undefined;
        const first = isDoorBoss ? eviscerationMarker : orangeMarker;
        getHeadmarkerId(data, matches, first);
      },
    },
    {
      id: 'P4S Decollation',
      type: 'StartsUsing',
      netRegex: { id: '6A09', source: 'Hesperos', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P4S Bloodrake',
      // AoE hits tethered players in first one, the non-tethered in second
      type: 'StartsUsing',
      netRegex: { id: '69D8', source: 'Hesperos', capture: false },
      preRun: (data) => data.bloodrakeCounter = (data.bloodrakeCounter ?? 0) + 1,
      response: Responses.aoe(),
    },
    {
      id: 'P4S Bloodrake Store',
      type: 'Ability',
      netRegex: { id: '69D8', source: 'Hesperos' },
      condition: (data) => (data.bloodrakeCounter ?? 0) < 3,
      suppressSeconds: 1,
      infoText: (data, matches, output) => {
        const roles: { [role: string]: string } = {
          'dps': output.dps!(),
          'tank/healer': output.tankHealer!(),
        };

        const roleOther = data.party.isDPS(matches.target) ? 'tank/healer' : 'dps';
        const counter = data.bloodrakeCounter ?? 0;

        // Second bloodrake = Debuffs later
        if (counter === 2) {
          data.yppDebuffRole = roleOther;

          // May end up needing both tether and debuff
          if (data.yppTetherRole === data.yppDebuffRole)
            return output.roleEverything!({ role: roles[roleOther] });
          return output.roleDebuffs!({ role: roles[roleOther] });
        }

        // First bloodrake = Tethers later
        if (counter === 1) {
          data.yppTetherRole = roleOther;
          return output.roleTethers!({ role: roles[roleOther] });
        }
      },
      outputStrings: roleOutputStrings,
    },
    {
      id: 'P4S Belone Coils',
      // 69DE is No Tank/Healer Belone Coils
      // 69DF is No DPS Belone Coils
      type: 'StartsUsing',
      netRegex: { id: ['69DE', '69DF', '69E0', '69E1'], source: 'Hesperos' },
      preRun: (data) => data.yppBeloneCoilsCounter = (data.yppBeloneCoilsCounter ?? 0) + 1,
      suppressSeconds: 1,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = roleOutputStrings;

        const roles: { [role: string]: string } = {
          'dps': output.dps!(),
          'tank/healer': output.tankHealer!(),
        };

        const roleTowers = matches.id === '69DE' ? 'dps' : 'tank/healer';
        const roleOther = matches.id === '69DE' ? 'tank/healer' : 'dps';
        const counter = data.yppBeloneCoilsCounter ?? 0;

        // Second Coils = Debuffs later
        if (counter === 2) {
          data.yppDebuffRole = roleOther;

          // For second coils, if you are not in the debuff list here you are tower
          if (!(data.yppDebuffRole ?? '').includes(data.role))
            return { alertText: output.roleTowers!({ role: roles[roleTowers] }) };

          // If you have tethers and debuff, you need everything
          if (data.yppTetherRole === data.yppDebuffRole)
            return { infoText: output.roleEverything!({ role: roles[roleOther] }) };
          return { alertText: output.roleDebuffs!({ role: roles[roleOther] }) };
        }

        // First Coils = Tethers later
        if (counter === 1) {
          data.yppTetherRole = roleOther;

          // For first coils, there are tower and tethers
          if ((data.yppTetherRole ?? '').includes(data.role))
            return { alertText: output.roleTethers!({ role: roles[roleOther] }) };
          return { alertText: output.roleTowers!({ role: roles[roleTowers] }) };
        }

        // 디버그
        return { infoText: `beloneCoilsCounter: ${String(data.yppBeloneCoilsCounter)}` };
      },
    },
    {
      id: 'P4S Role Call',
      type: 'GainsEffect',
      netRegex: { effectId: ['AF2', 'AF3'], capture: true },
      condition: Conditions.targetIsYou(),
      run: (data, matches) => {
        if (matches.effectId === 'AF2')
          data.hasRoleCall = true;
        if (matches.effectId === 'AF3')
          data.hasRoleCall = false;
      },
    },
    {
      id: 'P4S Director\'s Belone',
      type: 'Ability',
      netRegex: { id: '69E6', source: 'Hesperos', capture: false },
      // Delay callout until debuffs are out
      delaySeconds: 1.4,
      alertText: (data, _matches, output) => {
        if ((data.yppDebuffRole ?? '').includes(data.role)) {
          if (data.hasRoleCall)
            return; // output.haveRoleCall!();
          return output.getRoleCall!();
        }

        if ((data.bloodrakeCounter ?? 0) < 3) {
          if (data.role === 'dps')
            return output.stackDps!();
          return output.stackTankHealer!();
        }
      },
      outputStrings: roleOutputStrings,
    },
    {
      id: 'P4S Inversive Chlamys',
      // Possible a player still has not yet passed debuff
      type: 'StartsUsing',
      netRegex: { id: '69ED', source: 'Hesperos', capture: false },
      alertText: (data, _matches, output) => {
        const tetherRole = data.yppTetherRole ?? '???';
        if (tetherRole.includes(data.role))
          return output.getTether!();
        if (tetherRole === '???')
          return output.unknown!();
        if ((data.yppBeloneCoilsCounter ?? 0) === 1)
          return output.getTower!();
        if (data.role === 'dps')
          return output.stackDps!();
        return output.stackTankHealer!();
      },
      outputStrings: roleOutputStrings,
    },
    {
      id: 'P4S Elegant Evisceration',
      // This one does an aoe around the tank
      type: 'StartsUsing',
      netRegex: { id: '6A08', source: 'Hesperos' },
      response: Responses.tankBusterSwap('alert'),
    },
    {
      id: 'P4S Levinstrike Pinax',
      // Strong proximity Aoe
      type: 'StartsUsing',
      netRegex: { id: '69D7', source: 'Hesperos', capture: false },
      preRun: (data) => data.pinaxCount = (data.pinaxCount ?? 0) + 1,
      durationSeconds: 6,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Thunder',
          ja: '雷',
          ko: '[번개] 멀리멀리!',
        },
      },
    },
    {
      id: 'P4S Well Pinax',
      type: 'StartsUsing',
      netRegex: { id: '69D6', source: 'Hesperos', capture: false },
      preRun: (data) => data.pinaxCount = (data.pinaxCount ?? 0) + 1,
      infoText: (data, _matches, output) => {
        if ((data.pinaxCount ?? 0) % 2)
          return output.text!();
        data.wellShiftKnockback = true;
        return output.shiftWell!();
      },
      outputStrings: {
        text: {
          en: 'Well Pinax',
          ja: '水',
          ko: '[물] 넉백!',
        },
        shiftWell: {
          en: 'Well => Shift',
          ja: '水 => シフティング',
          ko: '[물] 🔜 동서남북',
        },
      },
    },
    {
      id: 'P4S Well Pinax Knockback',
      type: 'StartsUsing',
      netRegex: { id: '69D6', source: 'Hesperos' },
      delaySeconds: (data, matches) => {
        // Delay for for Directional Shift on Even Well/Levinstrike Pinax Count
        if ((data.pinaxCount ?? 0) % 2)
          return parseFloat(matches.castTime) - 5;
        return parseFloat(matches.castTime) - 2.4;
      },
      durationSeconds: (data) => data.wellShiftKnockback ? 2.4 : 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          knockback: Outputs.knockback,
          middleKnockback: {
            en: 'Middle Knockback',
            ja: '真ん中でノックバック',
            ko: '가운데서 걍 넉백 당해욧!',
          },
        };

        if (data.wellShiftKnockback)
          return { ['alertText']: output.knockback!() };
        return { ['infoText']: output.middleKnockback!() };
      },
    },
    {
      id: 'P4S Acid Pinax',
      type: 'StartsUsing',
      netRegex: { id: '69D4', source: 'Hesperos', capture: false },
      response: Responses.spread('alert'),
    },
    {
      id: 'P4S Lava Pinax',
      type: 'StartsUsing',
      netRegex: { id: '69D5', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.groups!(),
      outputStrings: {
        groups: {
          en: 'Healer Groups',
          ja: 'ヒラに頭割り',
          ko: '[불] 4:4 힐러',
        },
      },
    },
    {
      id: 'P4S Northerly Shift Slash',
      type: 'StartsUsing',
      netRegex: { id: '6A02', source: 'Hesperos', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'North Cleave',
          ja: '北の横',
          ko: '[북/A] 칼질 쪼개기!',
        },
      },
    },
    {
      id: 'P4S Easterly Shift Slash',
      type: 'StartsUsing',
      netRegex: { id: '6A04', source: 'Hesperos', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East Cleave',
          ja: '東の横',
          ko: '[동/B] 칼질 쪼개기!',
        },
      },
    },
    {
      id: 'P4S Southerly Shift Slash',
      type: 'StartsUsing',
      netRegex: { id: '6A03', source: 'Hesperos', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'South Cleave',
          ja: '南の横',
          ko: '[남/C] 칼질 쪼개기!',
        },
      },
    },
    {
      id: 'P4S Westerly Shift Slash',
      type: 'StartsUsing',
      netRegex: { id: '6A05', source: 'Hesperos', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West Cleave',
          ja: '西の横',
          ko: '[서/D] 칼질 쪼개기!',
        },
      },
    },
    {
      id: 'P4S Northerly Shift Cape',
      type: 'StartsUsing',
      netRegex: { id: '69FD', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'North Cape',
          ja: '北でノックバック',
          ko: '[북/A] 망토 넉백!',
        },
      },
    },
    {
      id: 'P4S Easterly Shift Cape',
      type: 'StartsUsing',
      netRegex: { id: '69FF', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'East Cape',
          ja: '東でノックバック',
          ko: '[동/B] 망토 넉백!',
        },
      },
    },
    {
      id: 'P4S Southerly Shift Cape',
      type: 'StartsUsing',
      netRegex: { id: '69FE', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'South Cape',
          ja: '南でノックバック',
          ko: '[남/C] 망토 넉백!',
        },
      },
    },
    {
      id: 'P4S Westerly Shift Cape',
      type: 'StartsUsing',
      netRegex: { id: '6A00', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'West Cape',
          ja: '西でノックバック',
          ko: '[서/D] 망토 넉백!',
        },
      },
    },
    {
      id: 'P4S Directional Shift Knockback',
      // Callout Knockback during Levinstrike + Shift
      type: 'StartsUsing',
      netRegex: { id: ['69FD', '69FE', '69FF', '6A00'], source: 'Hesperos' },
      condition: (data) => !data.wellShiftKnockback,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 5,
      response: Responses.knockback(),
      run: (data) => data.wellShiftKnockback = false,
    },
    {
      id: 'P4S Acting Role',
      type: 'GainsEffect',
      netRegex: { effectId: ['B6D', 'B6E', 'B6F'], capture: true },
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        const actingRoles: { [effectId: string]: string } = {
          'B6D': output.dps!(),
          'B6E': output.healer!(),
          'B6F': output.tank!(),
        };
        return output.text!({ actingRole: data.actingRole = actingRoles[matches.effectId] });
      },
      outputStrings: {
        text: {
          en: 'Acting ${actingRole}',
          ja: 'ロール: ${actingRole}',
          ko: '역할: ${actingRole}',
        },
        dps: roleOutputStrings.dps,
        healer: {
          en: 'Healer',
          ja: 'ヒーラ',
          ko: '힐러',
        },
        tank: {
          en: 'Tank',
          ja: 'タンク',
          ko: '탱크',
        },
      },
    },
    {
      id: 'P4S Belone Bursts',
      type: 'StartsUsing',
      netRegex: { id: '69D9', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.rolePositions!(),
      outputStrings: {
        rolePositions: {
          en: 'Orb role positions',
          ja: '玉、ロール散開',
          ko: '구슬처리 위치로 가욧!',
        },
      },
    },
    {
      id: 'P4S Periaktoi',
      type: 'StartsUsing',
      netRegex: { id: ['69F5', '69F6', '69F7', '69F8'], source: 'Hesperos' },
      alertText: (_data, matches, output) => {
        const pinax: { [id: string]: string } = {
          '69F5': output.acid!(),
          '69F6': output.lava!(),
          '69F7': output.well!(),
          '69F8': output.thunder!(),
        };
        return output.text!({ pinax: pinax[matches.id] });
      },
      outputStrings: {
        text: {
          en: '${pinax} safe',
          ja: '安置: ${pinax}',
          ko: '안전: ${pinax}',
        },
        acid: {
          en: 'Acid',
          ja: '毒/緑',
          ko: '독/녹색',
        },
        lava: {
          en: 'Lava',
          ja: '炎/赤',
          ko: '불/빨강',
        },
        well: {
          en: 'Well',
          ja: '水/白',
          ko: '물/하양',
        },
        thunder: {
          en: 'Thunder',
          ja: '雷/青',
          ko: '번개/파랑',
        },
      },
    },
    {
      id: 'P4S Searing Stream',
      type: 'StartsUsing',
      netRegex: { id: '6A2D', source: 'Hesperos', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'P4S Act Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['6A0C', '6EB[4-7]', '6A36'], source: 'Hesperos' },
      run: (data, matches) => {
        const actMap: { [id: string]: string } = {
          '6A0C': '1',
          '6EB4': '2',
          '6EB5': '3',
          '6EB6': '4',
          '6EB7': 'finale',
          '6A36': 'curtain',
        };
        data.act = actMap[matches.id];
        data.actHeadmarkers = {};
      },
    },
    {
      id: 'P4S Thorns Collector',
      type: 'StartsUsing',
      netRegex: { id: '6A0C', source: 'Hesperos' },
      promise: async (data, matches, _output) => {
        // Collect all Hesperos entities up front
        let combatantName = null;
        combatantName = matches.source;

        let combatantData = null;
        if (combatantName) {
          combatantData = await callOverlayHandler({
            call: 'getCombatants',
            names: [combatantName],
          });
        }

        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (combatantData === null) {
          console.error(`Hesperos: null data`);
          return;
        }
        const combatantDataLength = combatantData.combatants.length;
        if (combatantDataLength < 8) {
          console.error(`Hesperos: expected at least 8 combatants got ${combatantDataLength}`);
          return;
        }

        // the lowest eight Hesperos IDs are the thorns that tether the boss
        const sortCombatants = (a: PluginCombatantState, b: PluginCombatantState) =>
          (a.ID ?? 0) - (b.ID ?? 0);
        const sortedCombatantData = combatantData.combatants.sort(sortCombatants).splice(
          combatantDataLength - 8,
          combatantDataLength,
        );

        sortedCombatantData.forEach((combatant: PluginCombatantState) => {
          (data.thornIds ??= []).push(combatant.ID ?? 0);
        });
      },
    },
    {
      id: 'P4S Act One Safe Spots',
      type: 'Tether',
      netRegex: { id: '00AD', source: 'Hesperos' },
      condition: (data) => data.act === '1',
      // Tethers come out Cardinals (0 seconds), (3s) Towers, (6s) Other Cardinals
      suppressSeconds: 7,
      alertText: (data, matches, output) => {
        const thorn = (data.thornIds ??= []).indexOf(parseInt(matches.sourceId, 16));
        const thornMap: { [thorn: number]: string } = {
          4: output.text!({ dir1: output.south!(), dir2: output.north!() }),
          5: output.text!({ dir1: output.south!(), dir2: output.north!() }),
          6: output.text!({ dir1: output.east!(), dir2: output.west!() }),
          7: output.text!({ dir1: output.east!(), dir2: output.west!() }),
        };
        return thornMap[thorn];
      },
      outputStrings: {
        text: {
          en: '${dir1}/${dir2} first',
          ja: '${dir1}/${dir2}から',
          ko: '${dir1}/${dir2} 먼저예욧!',
        },
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
      },
    },
    {
      id: 'P4S Nearsight',
      type: 'StartsUsing',
      netRegex: { id: '6A26', source: 'Hesperos', capture: false },
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tanksInPartyOut!() : output.partyOutTanksIn!(),
      outputStrings: {
        partyOutTanksIn: {
          en: 'Party Out (Tanks In)',
          ja: 'ボスから離れる (タンクが内側)',
          ko: '안쪽에서 탱크버스터!!!',
        },
        tanksInPartyOut: {
          en: 'Tanks In (Party Out)',
          ja: 'ボスに足元へ (パーティーは離れる)',
          ko: '바깥으로 (탱크 안쪽)',
        },
      },
    },
    {
      id: 'P4S Farsight',
      type: 'StartsUsing',
      netRegex: { id: '6A27', source: 'Hesperos', capture: false },
      alertText: (data, _matches, output) =>
        data.role === 'tank' ? output.tankbustersOut!() : output.getIn!(),
      outputStrings: {
        tankbustersOut: {
          en: 'Tanks Out (Party In)',
          ja: 'ボスからはなれる (パーティーが内側)',
          ko: '바깥쪽에서 탱크버스터!!!',
        },
        getIn: Outputs.in,
      },
    },
    {
      id: 'P4S Demigod Double',
      type: 'StartsUsing',
      netRegex: { id: '6E78', source: 'Hesperos' },
      condition: Conditions.caresAboutPhysical(),
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankBuster: Outputs.tankBuster,
          tankBusterOnPlayer: Outputs.tankBusterOnPlayer,
          invulnerable: {
            en: 'Tank Buster! Invulnerable!!!',
            ko: '내게 탱크버스터! 무적을 써욧!!!',
          },
        };
        // response: Responses.sharedTankBuster(),
        if (matches.target === data.me)
          return { alertText: output.invulnerable!() };
        if (!matches.target)
          return { infoText: output.tankBuster!() };
        return {
          infoText: output.tankBusterOnPlayer!({ player: data.party.member(matches.target) }),
        };
      },
    },
    {
      id: 'P4S Act Two Safe Spots',
      type: 'Tether',
      netRegex: { id: '00AD', source: 'Hesperos' },
      condition: (data) => data.act === '2',
      // Tethers come out Cardinals (0 seconds), (3s) Other Cardinals
      suppressSeconds: 4,
      alertText: (data, matches, output) => {
        const thorn = (data.thornIds ??= []).indexOf(parseInt(matches.sourceId, 16));
        const thornMap: { [thorn: number]: string } = {
          0: output.text!({ dir1: output.south!(), dir2: output.north!() }),
          1: output.text!({ dir1: output.south!(), dir2: output.north!() }),
          2: output.text!({ dir1: output.south!(), dir2: output.north!() }),
          3: output.text!({ dir1: output.south!(), dir2: output.north!() }),
          4: output.text!({ dir1: output.east!(), dir2: output.west!() }),
          5: output.text!({ dir1: output.east!(), dir2: output.west!() }),
          6: output.text!({ dir1: output.east!(), dir2: output.west!() }),
          7: output.text!({ dir1: output.east!(), dir2: output.west!() }),
        };
        return thornMap[thorn];
      },
      outputStrings: {
        text: {
          en: '${dir1}/${dir2} first',
          ja: '${dir1}/${dir2}から',
          ko: '${dir1}/${dir2} 먼저예욧!',
        },
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
      },
    },
    {
      id: 'P4S Act Headmarker Collector',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.act !== undefined,
      run: (data, matches) => {
        data.actHeadmarkers[matches.target] = getHeadmarkerId(data, matches, orangeMarker);
      },
    },
    {
      id: 'P4S Act 2 Color Tether',
      type: 'Tether',
      netRegex: { id: '00AC' },
      condition: (data) => data.act === '2',
      alertText: (data, matches, output) => {
        if (matches.target !== data.me && matches.source !== data.me)
          return;

        // Only the healer gets a purple headmarker, and the tethered tank does not.
        const id = data.actHeadmarkers[matches.source] ?? data.actHeadmarkers[matches.target];

        if (id === undefined) {
          console.error(`Act 2 Tether: missing headmarker: ${JSON.stringify(data.actHeadmarkers)}`);
          return;
        }

        const other = data.party.member(
          matches.target === data.me ? matches.source : matches.target,
        );
        return {
          '012D': output.purpleTether!({ player: other }),
          '012E': output.greenTether!({ player: other }),
          '012F': output.orangeTether!({ player: other }),
        }[id];
      },
      outputStrings: {
        purpleTether: {
          en: 'Purple (with ${player})',
          ja: 'ダージャ (${player})',
          ko: '다쟈: ${player}',
        },
        orangeTether: {
          en: 'Fire (with ${player})',
          ja: 'ファイガ (${player})',
          ko: '파이가: ${player}',
        },
        greenTether: {
          en: 'Air (with ${player})',
          ja: 'エアロガ (${player})',
          ko: '에어로가: ${player}',
        },
      },
    },
    {
      id: 'P4S Act 4 Color Tether',
      type: 'Tether',
      // Tether comes after the headmarker color.
      netRegex: { id: '00A[CD]', source: 'Hesperos' },
      condition: (data, matches) => data.act === '4' && matches.target === data.me,
      durationSeconds: (data, matches) => data.actHeadmarkers[matches.target] === '012D' ? 12 : 9,
      suppressSeconds: 9999,
      promise: async (data, matches) => {
        const result = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        });
        const myThorn = result.combatants[0];
        if (!myThorn) {
          console.error(`Act 4 Tether: null data`);
          return;
        }

        data.actFourThorn = myThorn;
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          blueTether: {
            en: 'Blue Tether',
            ja: 'ワタガ (青)',
            ko: '워터가, 파랑',
          },
          purpleTether: {
            en: 'Purple Tether',
            ja: 'ダージャ(紫)',
            ko: '다쟈, 보라',
          },
          blueTetherDir: {
            en: 'Blue Tether (${dir})',
            ko: '파란줄 (${dir})',
          },
          purpleTetherDir: {
            en: 'Purple Tether (${dir})',
            ko: '보라줄 (${dir})',
          },
          dirN: Outputs.dirN,
          dirNE: Outputs.dirNE,
          dirE: Outputs.dirE,
          dirSE: Outputs.dirSE,
          dirS: Outputs.dirS,
          dirSW: Outputs.dirSW,
          dirW: Outputs.dirW,
          dirNW: Outputs.dirNW,
          unknown: Outputs.unknown,
        };

        const id = data.actHeadmarkers[matches.target];
        if (id === undefined)
          return;

        if (data.actFourThorn === undefined) {
          if (id === '012C')
            return { infoText: output.blueTether!() };
          if (id === '012D')
            return { alertText: output.purpleTether!() };
          return;
        }

        const centerX = 100;
        const centerY = 100;
        const x = data.actFourThorn.PosX - centerX;
        const y = data.actFourThorn.PosY - centerY;
        // Dirs: N = 0, NE = 1, ..., NW = 7
        const thornDir = Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;

        const dirStr: string = {
          0: output.dirN!(),
          1: output.dirNE!(),
          2: output.dirE!(),
          3: output.dirSE!(),
          4: output.dirS!(),
          5: output.dirSW!(),
          6: output.dirW!(),
          7: output.dirNW!(),
        }[thornDir] ?? output.unknown!();

        if (id === '012C')
          return { infoText: output.blueTetherDir!({ dir: dirStr }) };
        if (id === '012D')
          return { alertText: output.purpleTetherDir!({ dir: dirStr }) };
      },
    },
    {
      id: 'P4S Ultimate Impulse',
      type: 'StartsUsing',
      netRegex: { id: '6A2C', source: 'Hesperos', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'P4S Act Three Bait Order',
      type: 'Tether',
      netRegex: { id: '00AD', source: 'Hesperos' },
      condition: (data) => data.act === '3',
      // Tethers come out East or West (0 seconds), (3s) Middle knockack, (6) Opposite Cardinal
      suppressSeconds: 7,
      alertText: (data, matches, output) => {
        const thorn = (data.thornIds ??= []).indexOf(parseInt(matches.sourceId, 16));

        const thornMapDirs: { [thorn: number]: string } = {
          0: 'east',
          1: 'east',
          2: 'east',
          3: 'east',
          4: 'west',
          5: 'west',
          6: 'west',
          7: 'west',
        };

        data.jumpDir1 = thornMapDirs[thorn];
        return output[thornMapDirs[thorn] ??= 'unknown']!();
      },
      outputStrings: {
        text: {
          en: 'Bait Jump ${dir1} first',
          ja: 'ジャンプ誘導: ${dir1}',
          ko: '${dir1}으로 점프시켜욧!',
        },
        east: Outputs.east,
        west: Outputs.west,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P4S Heart Stake',
      type: 'StartsUsing',
      netRegex: { id: '6A2B', source: 'Hesperos' },
      condition: Conditions.caresAboutPhysical(),
      response: Responses.tankBuster(),
    },
    {
      id: 'P4S Wreath of Thorns 5',
      type: 'StartsUsing',
      netRegex: { id: '6A34', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread at tethered thorn',
          ja: '結ばれた羽の方で散開',
          ko: '연결된 깃털 부근에서 흩어지기',
        },
      },
    },
    {
      id: 'P4S Fleeting Impulse',
      type: 'Ability',
      netRegex: { id: '6A1C', source: 'Hesperos' },
      preRun: (data, _matches) => {
        data.fleetingImpulseCounter = (data.fleetingImpulseCounter ?? 0) + 1;
      },
      // ~22.3 seconds between #1 Fleeting Impulse (6A1C) to #1 Hemitheos's Thunder III (6A0E)
      // ~21.2 seconds between #8 Fleeting Impulse (6A1C) to #8 Hemitheos's Thunder III (6A0E).
      // Split the difference with 22 seconds.
      durationSeconds: 22,
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.text!({ num: data.fleetingImpulseCounter });
      },
      outputStrings: {
        text: {
          en: '${num}',
          ja: '羽: ${num}番目',
          ko: '깃털 ${num}번째',
        },
      },
    },
    {
      id: 'P4S Curtain Call Debuffs',
      // Durations could be 12s, 22s, 32s, and 42s
      type: 'GainsEffect',
      netRegex: { effectId: 'AF4', capture: true },
      condition: (data, matches) => {
        return data.me === matches.target && data.act === 'curtain';
      },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = curtainCallOutputStrings;

        data.curtainCallGroup = Math.ceil((parseFloat(matches.duration) - 2) / 10);

        if (data.curtainCallGroup === 1)
          return { alertText: output.group!({ num: data.curtainCallGroup }) };
        return { infoText: output.group!({ num: data.curtainCallGroup }) };
      },
    },
    {
      id: 'P4S Curtain Call Reminders',
      // Alarms for the other groups
      type: 'GainsEffect',
      netRegex: { effectId: 'B7D', capture: true },
      condition: (data) => data.act === 'curtain',
      preRun: (data) => data.curtainCallTracker = (data.curtainCallTracker ?? 0) + 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (
          data.curtainCallGroup === 2 && data.curtainCallTracker === 2 ||
          data.curtainCallGroup === 3 && data.curtainCallTracker === 4 ||
          data.curtainCallGroup === 4 && data.curtainCallTracker === 6
        )
          return output.group!({ num: data.curtainCallGroup });
      },
      run: (data) => {
        // Clear once 8 tethers have been broken
        if (data.curtainCallTracker === 8) {
          data.curtainCallTracker = 0;
          data.curtainCallGroup = 0;
        }
      },
      outputStrings: curtainCallOutputStrings,
    },
    {
      id: 'P4S Hell\'s Sting',
      type: 'StartsUsing',
      netRegex: { id: '6A1E', source: 'Hesperos', capture: false },
      infoText: (_data, _matches, output) => output.protean!(),
      outputStrings: {
        protean: {
          en: 'Protean',
          ja: '8方向散開',
          ko: '하데스 비-임!!!!',
        },
      },
    },
    {
      id: 'P4S Wreath of Thorns 4',
      type: 'StartsUsing',
      netRegex: { id: '6A32', source: 'Hesperos', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Blue: Opposite, Purple: Closed',
          ja: 'Blue: Opposite, Purple: Closed',
          ko: '파랑: 반대편 한칸, 보라: 가까이 한칸',
        },
      },
    },
    {
      id: 'P4S Curtain Call Debuffs Original',
      type: 'GainsEffect',
      netRegex: { effectId: 'AF4', capture: true },
      condition: (data, matches) => data.me === matches?.target && data.act === 'curtain',
      delaySeconds: (data, matches) => {
        const duration = parseFloat(matches.duration);
        return data.role === 'dps' ? duration - 12 : duration - 6;
      },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Break Tether!',
          ja: 'Break Tether!',
          ko: '뒤로 당겨서 줄 끊어욧!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Well Pinax/Levinstrike Pinax': 'Well/Levinstrike Pinax',
        'Levinstrike Pinax/Well Pinax': 'Levinstrike/Well Pinax',
        'Acid Pinax/Lava Pinax': 'Acid/Lava Pinax',
        'Lava Pinax/Acid Pinax': 'Lava/Acid Pinax',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Hesperos': 'Hesperos',
      },
      'replaceText': {
        '--debuffs--': '--Debuffs--',
        '--element debuffs--': '--Elementar-Debuffs--',
        '--role debuffs--': '--Rollen-Debuffs--',
        'Acid Pinax': 'Säure-Pinax',
        'Aetheric Chlamys': 'Ätherische Chlamys',
        'Akanthai: Act 1': 'Akanthai: Erster Akt',
        'Akanthai: Act 2': 'Akanthai: Zweiter Akt',
        'Akanthai: Act 3': 'Akanthai: Dritter Akt',
        'Akanthai: Act 4': 'Akanthai: Vierter Akt',
        'Akanthai: Curtain Call': 'Akanthai: Vorhang',
        'Akanthai: Finale': 'Akanthai: Finale',
        'Belone Bursts': 'Berstendes Belone',
        'Belone Coils': 'Gewundenes Belone',
        'Bloodrake': 'Blutharke',
        '(?<!Belone )Burst': 'Explosion',
        'Cursed Casting': 'Fluches Frucht',
        'Dark Design': 'Finsteres Formen',
        'Decollation': 'Enthauptung',
        'Demigod Double': 'Hemitheischer Hieb',
        'Director\'s Belone': 'Maskiertes Belone',
        'Directional Shift': 'Himmelsrichtung-Schwingen',
        'Elegant Evisceration': 'Adrette Ausweidung',
        'Elemental Belone': 'Elementares Belone',
        'Farsight': 'Blick in die Ferne',
        'Fleeting Impulse': 'Flüchtiger Impuls',
        'Heart Stake': 'Herzenspfahl',
        'Hell\'s Sting': 'Höllenstich',
        'Hemitheos\'s Aero III': 'Hemitheisches Windga',
        'Hemitheos\'s Dark IV': 'Hemitheisches Nachtka',
        'Hemitheos\'s Fire III': 'Hemitheisches Feuga',
        'Hemitheos\'s Fire IV': 'Hemitheisches Feuka',
        'Hemitheos\'s Thunder III': 'Hemitheisches Blitzga',
        'Hemitheos\'s Water IV': 'Hemitheisches Aquaka',
        'Inversive Chlamys': 'Invertierte Chlamys',
        'Kothornos Kick': 'Kothornoi-Tritt',
        'Kothornos Quake': 'Kothornoi-Beben',
        'Lava Pinax': 'Lava-Pinax',
        'Levinstrike Pinax': 'Donner-Pinax',
        'Nearsight': 'Blick nach innen',
        'Periaktoi': 'Periaktoi',
        '(?<!\\w )Pinax': 'Pinax',
        'Searing Stream': 'Sengender Strom',
        'Setting the Scene': 'Vorhang auf',
        'Shifting Strike': 'Schwingenschlag',
        'Ultimate Impulse': 'Ultimativer Impuls',
        'Vengeful Belone': 'Rachsüchtiges Belone',
        'Well Pinax': 'Brunnen-Pinax',
        'Wreath of Thorns': 'Dornenhecke',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Hesperos': 'Hespéros',
      },
      'replaceText': {
        '--debuffs--': '--debuffs--',
        '--element debuffs--': '--debuffs d\'éléments--',
        '--role debuffs--': '--debuffs de rôles--',
        '(?<!/)Acid Pinax(?!/)': 'Pinax de poison',
        'Acid Pinax/Lava Pinax': 'Pinax de poison/feu',
        'Aetheric Chlamys': 'Chlamyde d\'éther',
        'Akanthai: Act 1': 'La Tragédie des épines : acte I',
        'Akanthai: Act 2': 'La Tragédie des épines : acte II',
        'Akanthai: Act 3': 'La Tragédie des épines : acte III',
        'Akanthai: Act 4': 'La Tragédie des épines : acte IV',
        'Akanthai: Curtain Call': 'La Tragédie des épines : rappel',
        'Akanthai: Finale': 'La Tragédie des épines : acte final',
        'Belone Bursts': 'Bélos enchanté : explosion',
        'Belone Coils': 'Bélos enchanté : rotation',
        'Bloodrake': 'Racle de sang',
        '(?<!Belone )Burst': 'Explosion',
        'Cursed Casting': 'Malédiction immortelle',
        'Dark Design': 'Dessein noir',
        'Decollation': 'Décollation',
        'Demigod Double': 'Gémellité du demi-dieu',
        'Directional Shift': 'Frappe mouvante vers un cardinal',
        'Director\'s Belone': 'Bélos enchanté : persona',
        'Elegant Evisceration': 'Éviscération élégante',
        'Elemental Belone': 'Bélos enchanté : élémentaire',
        'Fleeting Impulse': 'Impulsion fugace',
        'Heart Stake': 'Pieu dans le cœur',
        'Hell\'s Sting': 'Pointe infernale',
        'Hemitheos\'s Aero III': 'Méga Vent de l\'hémithéos',
        'Hemitheos\'s Dark IV': 'Giga Ténèbres de l\'hémithéos',
        'Hemitheos\'s Fire III': 'Méga Feu de l\'hémithéos',
        'Hemitheos\'s Fire IV': 'Giga Feu de l\'hémithéos',
        'Hemitheos\'s Thunder III': 'Méga Foudre de l\'hémithéos',
        'Hemitheos\'s Water IV': 'Giga Eau de l\'hémithéos',
        'Inversive Chlamys': 'Chlamyde retournée',
        'Kothornos Kick': 'Coup de cothurne',
        'Kothornos Quake': 'Piétinement de cothurne',
        '(?<!/)Lava Pinax(?!/)': 'Pinax de feu',
        'Lava Pinax/Acid Pinax': 'Pinax de feu/poison',
        '(?<!/)Levinstrike Pinax(?!/)': 'Pinax de foudre',
        'Levinstrike Pinax/Well Pinax': 'Pinax de foudre/eau',
        'Nearsight/Farsight': 'Frappe introspéctive/visionnaire',
        'Periaktoi': 'Périacte',
        '(?<!\\w )Pinax': 'Pinax',
        'Searing Stream': 'Flux ardent',
        'Setting the Scene': 'Lever de rideau',
        'Shifting Strike': 'Frappe mouvante',
        'Ultimate Impulse': 'Impulsion ultime',
        'Vengeful Belone': 'Bélos enchanté : vengeance',
        '(?<!/)Well Pinax(?!/)': 'Pinax d\'eau',
        'Well Pinax/Levinstrike Pinax': 'Pinax d\'eau/foudre',
        'Wreath of Thorns': 'Haie d\'épines',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Hesperos': 'ヘスペロス',
      },
      'replaceText': {
        'Acid Pinax': 'ピナクスポイズン',
        'Aetheric Chlamys': 'エーテルクラミュス',
        'Akanthai: Act 1': '茨の悲劇：序幕',
        'Akanthai: Act 2': '茨の悲劇：第ニ幕',
        'Akanthai: Act 3': '茨の悲劇：第三幕',
        'Akanthai: Act 4': '茨の悲劇：第四幕',
        'Akanthai: Curtain Call': '茨の悲劇：カーテンコール',
        'Akanthai: Finale': '茨の悲劇：終幕',
        'Belone Bursts': 'エンチャンテッドペロネー：エクスプロージョン',
        'Belone Coils': 'エンチャンテッドペロネー：ラウンド',
        'Bloodrake': 'ブラッドレイク',
        '(?<!Belone )Burst': '爆発',
        'Cursed Casting': '呪詛発動',
        'Dark Design': 'ダークデザイン',
        'Decollation': 'デコレーション',
        'Director\'s Belone': 'エンチャンテッドペロネー：ペルソナ',
        'Elegant Evisceration': 'エレガントイヴィセレーション',
        'Elemental Belone': 'エンチャンテッドペロネー：エレメンタル',
        'Fleeting Impulse': 'フリーティングインパルス',
        'Heart Stake': 'ハートステイク',
        'Hell\'s Sting': 'ヘルスティング',
        'Hemitheos\'s Aero III': 'ヘーミテオス・エアロガ',
        'Hemitheos\'s Dark IV': 'ヘーミテオス・ダージャ',
        'Hemitheos\'s Fire III': 'ヘーミテオス・ファイガ',
        'Hemitheos\'s Fire IV': 'ヘーミテオス・ファイジャ',
        'Hemitheos\'s Thunder III': 'ヘーミテオス・サンダガ',
        'Hemitheos\'s Water IV': 'ヘーミテオス・ウォタジャ',
        'Inversive Chlamys': 'インヴァースクラミュス',
        'Kothornos Kick': 'コトルヌスキック',
        'Kothornos Quake': 'コトルヌスクエイク',
        'Lava Pinax': 'ピナクスラーヴァ',
        'Levinstrike Pinax': 'ピナクスサンダー',
        'Periaktoi': 'ペリアクトイ',
        '(?<!\\w )Pinax': 'ピナクス',
        'Searing Stream': 'シアリングストリーム',
        'Setting the Scene': '劇場創造',
        'Shifting Strike': 'シフティングストライク',
        'Ultimate Impulse': 'アルティメットインパルス',
        'Vengeful Belone': 'エンチャンテッドペロネー：リベンジ',
        'Well Pinax': 'ピナクススプラッシュ',
        'Wreath of Thorns': 'ソーンヘッジ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Hesperos': '赫斯珀洛斯',
      },
      'replaceText': {
        '--debuffs--': '--Debuff--',
        '--element debuffs--': '--元素Debuff--',
        '--role debuffs--': '--职能Debuff--',
        'Acid Pinax': '剧毒板画',
        'Aetheric Chlamys': '以太斗篷',
        'Akanthai: Act 1': '荆棘悲剧：序幕',
        'Akanthai: Act 2': '荆棘悲剧：第二幕',
        'Akanthai: Act 3': '荆棘悲剧：第三幕',
        'Akanthai: Act 4': '荆棘悲剧：第四幕',
        'Akanthai: Curtain Call': '荆棘悲剧：谢幕',
        'Akanthai: Finale': '荆棘悲剧：结幕',
        'Belone Bursts': '附魔佩罗涅·爆炸',
        'Belone Coils': '附魔佩罗涅·场地',
        'Bloodrake': '聚血',
        '(?<!Belone )Burst': '爆炸',
        'Cursed Casting': '诅咒发动',
        'Dark Design': '黑暗设计',
        'Decollation': '断头',
        'Demigod Double': '半神双击',
        'Director\'s Belone': '附魔佩罗涅·职责',
        'Directional Shift': '换位强袭·方位',
        'Elegant Evisceration': '优雅除脏',
        'Elemental Belone': '附魔佩罗涅·元素',
        'Farsight': '远见的魔击',
        'Fleeting Impulse': '闪现脉冲',
        'Heart Stake': '刺心桩',
        'Hell\'s Sting': '地狱苦痛',
        'Hemitheos\'s Aero III': '半神暴风',
        'Hemitheos\'s Dark IV': '半神冥暗',
        'Hemitheos\'s Fire III': '半神爆炎',
        'Hemitheos\'s Fire IV': '半神炽炎',
        'Hemitheos\'s Thunder III': '半神暴雷',
        'Hemitheos\'s Water IV': '半神骇水',
        'Inversive Chlamys': '翻转斗篷',
        'Kothornos Kick': '舞台靴重踢',
        'Kothornos Quake': '舞台靴踏地',
        'Lava Pinax': '熔岩板画',
        'Levinstrike Pinax': '雷电板画',
        'Nearsight': '近思的魔击',
        'Periaktoi': '场景旋转',
        '(?<!\\w )Pinax': '板画',
        'Searing Stream': '灼热流',
        'Setting the Scene': '布置剧场',
        'Shifting Strike': '换位强袭',
        'Ultimate Impulse': '究极脉冲',
        'Vengeful Belone': '附魔佩罗涅·复仇',
        'Well Pinax': '喷水板画',
        'Wreath of Thorns': '荆棘缠绕',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Hesperos': '赫斯珀洛斯',
      },
      'replaceText': {
        // '--debuffs--': '', // FIXME '--Debuff--'
        // '--element debuffs--': '', // FIXME '--元素Debuff--'
        // '--role debuffs--': '', // FIXME '--职能Debuff--'
        'Acid Pinax': '劇毒板畫',
        'Aetheric Chlamys': '乙太斗篷',
        'Akanthai: Act 1': '荊棘悲劇：序幕',
        'Akanthai: Act 2': '荊棘悲劇：第二幕',
        'Akanthai: Act 3': '荊棘悲劇：第三幕',
        'Akanthai: Act 4': '荊棘悲劇：第四幕',
        'Akanthai: Curtain Call': '荊棘悲劇：謝幕',
        'Akanthai: Finale': '荊棘悲劇：結幕',
        'Belone Bursts': '附魔佩羅涅·爆炸',
        'Belone Coils': '附魔佩羅涅·場地',
        'Bloodrake': '聚血',
        '(?<!Belone )Burst': '爆炸',
        'Cursed Casting': '詛咒發動',
        'Dark Design': '黑暗設計',
        'Decollation': '斷頭',
        'Demigod Double': '半神雙擊',
        'Director\'s Belone': '附魔佩羅涅·職責',
        'Directional Shift': '換位強襲·北',
        'Elegant Evisceration': '優雅除髒',
        'Elemental Belone': '附魔佩羅涅·元素',
        'Farsight': '遠見的魔擊',
        'Fleeting Impulse': '閃現脈衝',
        'Heart Stake': '刺心樁',
        'Hell\'s Sting': '地獄苦痛',
        'Hemitheos\'s Aero III': '半神大勁風',
        'Hemitheos\'s Dark IV': '半神冥暗',
        'Hemitheos\'s Fire III': '半神大火焰',
        'Hemitheos\'s Fire IV': '半神超火焰',
        'Hemitheos\'s Thunder III': '半神大雷電',
        'Hemitheos\'s Water IV': '半神超水花',
        'Inversive Chlamys': '翻轉斗篷',
        'Kothornos Kick': '舞臺靴重踢',
        'Kothornos Quake': '舞臺靴踏地',
        'Lava Pinax': '熔岩板畫',
        'Levinstrike Pinax': '雷電板畫',
        'Nearsight': '近思的魔擊',
        'Periaktoi': '場景旋轉',
        '(?<!\\w )Pinax': '板畫',
        'Searing Stream': '灼熱流',
        'Setting the Scene': '佈置劇場',
        'Shifting Strike': '換位強襲',
        'Ultimate Impulse': '究極脈衝',
        'Vengeful Belone': '附魔佩羅涅·復仇',
        'Well Pinax': '噴水板畫',
        'Wreath of Thorns': '荊棘纏繞',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Hesperos': '헤스페로스',
      },
      'replaceText': {
        '--debuffs--': '--디버프--',
        '--element debuffs--': '--속성 디버프--',
        '--role debuffs--': '--역할 디버프--',
        '(?<!/)Acid Pinax(?!/)': '독 배경판',
        'Acid Pinax/Lava Pinax': '독/용암 배경판',
        'Aetheric Chlamys': '에테르 망토',
        'Akanthai: Act 1': '가시의 비극: 서막',
        'Akanthai: Act 2': '가시의 비극: 제2막',
        'Akanthai: Act 3': '가시의 비극: 제3막',
        'Akanthai: Act 4': '가시의 비극: 제4막',
        'Akanthai: Curtain Call': '가시의 비극: 커튼콜',
        'Akanthai: Finale': '가시의 비극: 종막',
        'Belone Bursts': '마법검 벨로네: 폭발',
        'Belone Coils': '마법검 벨로네: 원형',
        'Bloodrake': '피갈퀴',
        '(?<!Belone )Burst': '폭발',
        'Cursed Casting': '저주 발동',
        'Dark Design': '어둠 설계',
        'Decollation': '집단 참수',
        'Demigod Double': '반신의 쌍격',
        'Director\'s Belone': '마법검 벨로네: 역할',
        'Directional Shift': '이동 공격: 동서남북',
        'Elegant Evisceration': '우아한 적출',
        'Elemental Belone': '마법검 벨로네: 속성',
        'Fleeting Impulse': '순간 충격',
        'Heart Stake(?! )': '심장 말뚝',
        'Heart Stake OT': '심장 말뚝 2타',
        'Hell\'s Sting': '지옥 할퀴기',
        'Hemitheos\'s Aero III': '헤미테오스 에어로가',
        'Hemitheos\'s Dark IV': '헤미테오스 다쟈',
        'Hemitheos\'s Fire III': '헤미테오스 파이가',
        'Hemitheos\'s Fire IV': '헤미테오스 파이쟈',
        'Hemitheos\'s Thunder III': '헤미테오스 선더가',
        'Hemitheos\'s Water IV': '헤미테오스 워터쟈',
        'Inversive Chlamys': '망토 휘두르기',
        'Kothornos Kick': '무대신 발길질',
        'Kothornos Quake': '무대신 땅울림',
        '(?<!/)Lava Pinax(?!/)': '용암 배경판',
        'Lava Pinax/Acid Pinax': '용암/독 배경판',
        '(?<!/)Levinstrike Pinax(?!/)': '번개 배경판',
        'Levinstrike Pinax/Well Pinax': '번개/물기둥 배경판',
        'Nearsight/Farsight': '근거리/원거리 마격',
        'Periaktoi': '삼면 배경',
        '(?<!\\w )Pinax': '배경판',
        'Searing Stream': '작열 기류',
        'Setting the Scene': '극장 창조',
        'Shifting Strike': '이동 공격',
        'Ultimate Impulse': '극한 충격',
        'Vengeful Belone': '마법검 벨로네: 복수',
        '(?<!/)Well Pinax(?!/)': '물기둥 배경판',
        'Well Pinax/Levinstrike Pinax': '물기둥/번개 배경판',
        'Wreath of Thorns': '가시 울타리',
      },
    },
  ],
};

export default triggerSet;
