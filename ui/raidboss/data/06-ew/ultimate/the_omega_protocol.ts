import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// [PRS BEGIN]
// 다시 돌아온 멤버 처리: 만들어 보자고!!! 😭
type PrsMember = {
  r: string; // 롤
  j: string; // 잡
  t: number; // 팀
  pp: number; // Program loop -> 프로그램 루프 우선순위
  pk: number; // Pantokrator -> 판크 우선 순위
  sm: number; // Synergy marker -> PS 마커 우선순위
  n: string; // 이름
  // 내부
  i: number;
  p?: PrsMember;
  f?: boolean;
};
export const getMemberByName = (data: Data, name: string) =>
  data.members?.find((e) => e.n === name);
export const getMemberRole = (data: Data, name: string) => {
  const m = getMemberByName(data, name);
  return m ? m.r : data.ShortName(name);
};
export const testSynergyMarkerMove = (my: PrsMember, ot: PrsMember) => {
  if (my.sm < 5)
    return my.sm > ot.sm;
  return my.sm < ot.sm;
};
// [PRS END]

export const playstationMarkers = ['circle', 'cross', 'triangle', 'square'] as const;
export type PlaystationMarker = typeof playstationMarkers[number];

export type Glitch = 'mid' | 'remote';
export type Cannon = 'spread' | 'stack';
export type RotColor = 'blue' | 'red';

export interface Data extends RaidbossData {
  members?: PrsMember[];
  my?: PrsMember;
  simple?: boolean;
  prsPank?: boolean;
  //
  combatantData: PluginCombatantState[];
  decOffset?: number;
  inLine: { [name: string]: number };
  loopBlasterCount: number;
  pantoMissileCount: number;
  solarRayTargets: string[];
  glitch?: Glitch;
  synergyMarker: { [name: string]: PlaystationMarker };
  spotlightStacks: string[];
  meteorTargets: string[];
  cannonFodder: { [name: string]: Cannon };
  smellDefamation: string[];
  smellRot: { [name: string]: RotColor };
  defamationColor?: RotColor;
}

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
export const headmarkers = {
  // vfx/lockon/eff/lockon5_t0h.avfx
  spread: '0017',
  // vfx/lockon/eff/tank_lockonae_5m_5s_01k1.avfx
  buster: '0157',
  // vfx/lockon/eff/z3oz_firechain_01c.avfx through 04c
  firechainCircle: '01A0',
  firechainTriangle: '01A1',
  firechainSquare: '01A2',
  firechainX: '01A3',
  // vfx/lockon/eff/com_share2i.avfx
  stack: '0064',
  // vfx/lockon/eff/all_at8s_0v.avfx
  meteor: '015A',
} as const;

export const playstationHeadmarkerIds: readonly string[] = [
  headmarkers.firechainCircle,
  headmarkers.firechainTriangle,
  headmarkers.firechainSquare,
  headmarkers.firechainX,
] as const;

export const playstationMarkerMap: { [id: string]: PlaystationMarker } = {
  [headmarkers.firechainCircle]: 'circle',
  [headmarkers.firechainTriangle]: 'triangle',
  [headmarkers.firechainSquare]: 'square',
  [headmarkers.firechainX]: 'cross',
} as const;

export const firstMarker = parseInt('0017', 16);

export const getHeadmarkerId = (
  data: Data,
  matches: NetMatches['HeadMarker'],
) => {
  if (data.decOffset === undefined)
    data.decOffset = parseInt(matches.id, 16) - firstMarker;
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.TheOmegaProtocolUltimate,
  timelineFile: 'the_omega_protocol.txt',
  initData: () => {
    return {
      combatantData: [],
      inLine: {},
      loopBlasterCount: 0,
      pantoMissileCount: 0,
      solarRayTargets: [],
      synergyMarker: {},
      spotlightStacks: [],
      meteorTargets: [],
      cannonFodder: {},
      smellDefamation: [],
      smellRot: {},
    };
  },
  timelineTriggers: [
    {
      id: 'TOP+ 데이터 확인',
      regex: /--setup--/,
      delaySeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.members)
          return output.nodata!();
        for (let i = 0; i < data.members.length; i++) {
          const m = data.members[i];
          if (m)
            m.i = i;
        }
        data.my = data.members.find((e) => e.n === data.me);
        if (!data.my)
          return output.nome!();
        const simple = data.simple ? output.simple!() : '';
        return output.itsme!({ role: data.my.r, simple: simple });
      },
      outputStrings: {
        nodata: {
          en: '데이터를 설정하지 않았네요',
          ja: 'データの設定が見つかりません',
        },
        nome: {
          en: '내 데이터를 찾을 수 없어요',
          ja: 'わたしのデータが見つかりません',
        },
        itsme: {
          en: '내 역할: ${role} ${simple}',
          ja: 'ロール:  ${role} ${simple}',
        },
        simple: {
          en: '(심플 모드)',
          ja: '(簡略モード)',
        }
      }
    },
  ],
  triggers: [
    {
      id: 'TOP Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => getHeadmarkerId(data, matches),
    },
    {
      id: 'TOP In Line Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: ['BBC', 'BBD', 'BBE', 'D7B'] },
      run: (data, matches) => {
        const effectToNum: { [effectId: string]: number } = {
          BBC: 1,
          BBD: 2,
          BBE: 3,
          D7B: 4,
        } as const;
        const num = effectToNum[matches.effectId];
        if (num === undefined)
          return;
        data.inLine[matches.target] = num;
      },
    },
    {
      id: 'TOP In Line Debuff Cleanup',
      type: 'StartsUsing',
      // 7B03 = Program Loop
      // 7B0B = Pantokrator
      netRegex: { id: ['7B03', '7B0B'], source: 'Omega' },
      // Don't clean up when the buff is lost, as that happens after taking a tower.
      run: (data, matches) => {
        data.inLine = {};
        if (data.my)
          data.my.p = undefined;
        if (matches.id === '7B0B')
          data.prsPank = true;
      }
    },
    {
      id: 'TOP In Line Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: ['BBC', 'BBD', 'BBE', 'D7B'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: (data) => data.prsPank ? 5 : 38, // 원래 5초
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        let partner = output.unknown!();
        for (const [name, num] of Object.entries(data.inLine)) {
          if (num === myNum && name !== data.me) {
            partner = name;
            if (data.my)
              data.my.p = getMemberByName(data, name);
            break;
          }
        }

        if (data.my && data.my.p) {
          if (data.prsPank) {
            const cm = Math.floor(data.my.pk / 10);
            const cp = Math.floor(data.my.p.pk / 10);
            if (cm === cp && data.my.pk < data.my.p.pk) {
              if (data.simple)
                return output.simpleSwitch!({ player: data.my.p.r });
              return output.switch!({ num: myNum, player: data.my.p.r });
            }
            if (data.simple)
              return output.simple!({ player: data.my.p.r });
            return output.text!({ num: myNum, player: data.my.p.r });
          }
          if (data.simple) {
            if (data.my.pp < data.my.p.pp)
              return output.simpleCw!({ player: data.my.p.r });
            return output.simpleCcw!({ player: data.my.p.r });
          }
          if (data.my.pp < data.my.p.pp)
            return output.cw!({ num: myNum, player: data.my.p.r });
          return output.ccw!({ num: myNum, player: data.my.p.r });
        }

        return output.text!({ num: myNum, player: data.ShortName(partner) });
      },
      outputStrings: {
        text: {
          en: '${num}번 (${player})',
          de: '${num} (mit ${player})',
        },
        cw: {
          en: '${num}번 (${player}) ❱❱❱',
          de: '${num} (mit ${player})',
        },
        ccw: {
          en: '❰❰❰ ${num}번 (${player})',
          de: '${num} (mit ${player})',
        },
        switch: {
          en: '${num}번 스위치! (${player})',
        },
        simple: {
          en: '(${player})',
        },
        simpleCw: {
          en: '❱❱❱ (${player}) ❱❱❱',
        },
        simpleCcw: {
          en: '❰❰❰ (${player}) ❰❰❰',
        },
        simpleSwitch: {
          en: '스위치! (${player})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'TOP Program Loop First Debuffs',
      type: 'StartsUsing',
      // 7B07 = Blaster cast (only one cast, but 4 abilities)
      netRegex: { id: '7B07', source: 'Omega', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tower: {
            en: '타워로!',
            de: 'Turm 1',
          },
          tether: {
            en: '줄채요!',
            de: 'Verbindung 1',
          },
          numNoMechanic: {
            en: '1',
            de: '1',
          },
        };

        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        if (myNum === 1)
          return { alertText: output.tower!() };
        if (myNum === 3)
          return { alertText: output.tether!() };
        return { infoText: output.numNoMechanic!() };
      },
    },
    {
      id: 'TOP Program Loop Other Debuffs',
      type: 'Ability',
      netRegex: { id: '7B08', source: 'Omega', capture: false },
      preRun: (data) => data.loopBlasterCount++,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tower: {
            en: '타워로!',
            de: 'Turm ${num}',
          },
          tether: {
            en: '줄채요!',
            de: 'Verbindung ${num}',
          },
          numNoMechanic: {
            en: '${num}',
            de: '${num}',
          },
        };

        const mechanicNum = data.loopBlasterCount + 1;
        if (mechanicNum >= 5)
          return;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return { infoText: output.numNoMechanic!({ num: mechanicNum }) };

        if (myNum === mechanicNum)
          return { alertText: output.tower!({ num: mechanicNum }) };
        if (mechanicNum === myNum + 2 || mechanicNum === myNum - 2)
          return { alertText: output.tether!({ num: mechanicNum }) };
        return { infoText: output.numNoMechanic!({ num: mechanicNum }) };
      },
    },
    {
      id: 'TOP Pantokrator First Debuffs',
      type: 'StartsUsing',
      // 7B0D = initial Flame Thrower cast, 7E70 = later ones
      netRegex: { id: '7B0D', source: 'Omega', capture: false },
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          lineStack: {
            en: '1',
            de: '1',
          },
          spread: {
            en: '밖으로!',
            de: '1 Raus (auf Dir)',
          },
        };

        const myNum = data.inLine[data.me];
        if (myNum === 1)
          return { alertText: output.spread!() };
        return { infoText: output.lineStack!() };
      },
    },
    {
      id: 'TOP Pantokrator Other Debuffs',
      type: 'Ability',
      // 7B0E = Guided Missile Kyrios spread damage
      netRegex: { id: '7B0E', source: 'Omega', capture: false },
      preRun: (data) => data.pantoMissileCount++,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          lineStack: {
            en: '${num}',
            de: '${num}',
          },
          spread: {
            en: '밖으로!',
            de: '${num} Raus (auf Dir)',
          },
        };

        const mechanicNum = data.pantoMissileCount + 1;
        if (mechanicNum >= 5)
          return;
        const myNum = data.inLine[data.me];
        if (myNum === mechanicNum)
          return { alertText: output.spread!({ num: mechanicNum }) };
        return { infoText: output.lineStack!({ num: mechanicNum }) };
      },
    },
    {
      id: 'TOP Diffuse Wave Cannon Kyrios',
      type: 'HeadMarker',
      netRegex: {},
      // We normally call this stuff out for other roles, but tanks often invuln this.
      condition: (data) => data.role === 'tank',
      suppressSeconds: 20,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.spread)
          return output.tankCleaves!();
      },
      outputStrings: {
        tankCleaves: {
          en: '탱크 클레브',
          de: 'Tank Cleaves',
        },
      },
    },
    {
      id: 'TOP Wave Cannon Kyrios',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.spread)
          return output.laserOnYou!();
      },
      outputStrings: {
        laserOnYou: {
          en: '내게 레이저',
          de: 'Laser auf DIR',
        },
      },
    },
    {
      id: 'TOP+ Firewall / 클린업용',
      type: 'StartsUsing',
      netRegex: { id: '7B40', source: 'Omega', capture: false },
      run: (data) => {
        if (data.my)
          data.my.p = undefined;
      }
    },
    {
      id: 'TOP Solar Ray You',
      type: 'StartsUsing',
      netRegex: { id: ['7E6A', '7E6B'], source: 'Omega' },
      preRun: (data, matches) => data.solarRayTargets.push(matches.target),
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankBusterOnYou: Outputs.tankBusterOnYou,
          tankBusters: Outputs.tankBusters,
        };

        if (matches.target === data.me)
          return { alertText: output.tankBusterOnYou!() };

        if (data.solarRayTargets.length === 2 && !data.solarRayTargets.includes(data.me))
          return { infoText: output.tankBusters!() };
      },
    },
    {
      id: 'TOP Mid Remote Glitch',
      type: 'GainsEffect',
      // D63 = Mid Glitch
      // D64 = Remote Glitch
      netRegex: { effectId: ['D63', 'D64'] },
      suppressSeconds: 10,
      run: (data, matches) => data.glitch = matches.effectId === 'D63' ? 'mid' : 'remote',
    },
    {
      id: 'TOP Synergy Marker Collect',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        const marker = playstationMarkerMap[id];
        if (marker === undefined)
          return;
        data.synergyMarker[matches.target] = marker;
      },
    },
    {
      id: 'TOP Synergy Marker',
      type: 'GainsEffect',
      // In practice, glitch1 glitch2 marker1 marker2 glitch3 glitch4 etc ordering.
      netRegex: { effectId: ['D63', 'D64'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: 14,
      suppressSeconds: 10,
      infoText: (data, _matches, output) => {
        const glitch = data.glitch
          ? {
            mid: output.midGlitch!(),
            remote: output.remoteGlitch!(),
          }[data.glitch]
          : output.unknown!();

        const myMarker = data.synergyMarker[data.me];
        // If something has gone awry, at least return something here.
        if (myMarker === undefined)
          return glitch;

        let partner = output.unknown!();
        for (const [name, marker] of Object.entries(data.synergyMarker)) {
          if (marker === myMarker && name !== data.me) {
            partner = name;
            if (data.my)
              data.my.p = getMemberByName(data, name);
            break;
          }
        }

        let side = '';
        if (data.my && data.my.p) {
          const left = data.my.sm < data.my.p.sm;
          if (data.simple) {
            return left
              ? output.simpleLeft!({ player: data.my.p.r })
              : output.simpleRight!({ player: data.my.p.r });
          }
          side = left ? output.left!() : output.right!();
        }

        return {
          circle: output.circle!({ glitch: glitch, player: getMemberRole(data, partner), side: side }),
          triangle: output.triangle!({ glitch: glitch, player: getMemberRole(data, partner), side: side }),
          square: output.square!({ glitch: glitch, player: getMemberRole(data, partner), side: side }),
          cross: output.cross!({ glitch: glitch, player: getMemberRole(data, partner), side: side }),
        }[myMarker];
      },
      outputStrings: {
        midGlitch: {
          en: '중간',
          de: 'Mittel',
        },
        remoteGlitch: {
          en: '멀리',
          de: 'Fern',
        },
        circle: {
          en: '${side}🔴 (${player}) [${glitch}]',
          de: '${glitch} Kreis (mit ${player})',
        },
        triangle: {
          en: '${side}⟁ (${player}) [${glitch}]',
          de: '${glitch} Dreieck (mit ${player})',
        },
        square: {
          en: '${side}🟪 (${player}) [${glitch}]',
          de: '${glitch} Viereck (mit ${player})',
        },
        cross: {
          en: '${side}❌ (${player}) [${glitch}]',
          de: '${glitch} Kreuz (mit ${player})',
        },
        left: Outputs.arrowW,
        right: Outputs.arrowE,
        simpleLeft: {
          en: '❰❰❰❰❰ (${player}) ❰❰❰❰❰',
        },
        simpleRight: {
          en: '❱❱❱❱❱ (${player}) ❱❱❱❱❱',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'TOP Optical Unit Location',
      type: 'MapEffect',
      netRegex: { location: '0[1-8]', flags: '00020001' },
      condition: (data) => !data.simple,
      // This comes out right with playstation debuffs.
      // Let players resolve Superliminal Steel/etc first.
      delaySeconds: 4,
      durationSeconds: 4,
      alertText: (_data, matches, output) => {
        const dir = {
          '01': output.dirN!(),
          '02': output.dirNE!(),
          '03': output.dirE!(),
          '04': output.dirSE!(),
          '05': output.dirS!(),
          '06': output.dirSW!(),
          '07': output.dirW!(),
          '08': output.dirNW!(),
        }[matches.location];
        return output.text!({ dir: dir });
      },
      outputStrings: {
        text: {
          en: '눈: ${dir}',
        },
        dirN: 'A',
        dirNE: '1',
        dirE: 'B',
        dirSE: '2',
        dirS: 'C',
        dirSW: '3',
        dirW: 'D',
        dirNW: '4',
      },
    },
    {
      id: 'TOP Spotlight',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarkers.stack,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          midGlitch: {
            en: '중간',
            de: 'Mittel',
          },
          remoteGlitch: {
            en: '멀리',
            de: 'Fern',
          },
          stacksOn: {
            en: '${glitch} 넉백, 뭉쳐요 (${player1}, ${player2})',
            de: '${glitch} Sammeln (${player1}, ${player2}',
          },
          // TODO: say who your tether partner is to swap??
          // TODO: tell the tether partner they are tethered to a stack?
          stackOnYou: Outputs.stackOnYou,
          unknown: Outputs.unknown,
          stackSwitch: {
            en: '자리 바꿔 뭉쳐요 (${player})',
          },
          knockback: {
            en: '${glitch} 넉백',
          }
        };

        data.spotlightStacks.push(matches.target);
        const [p1, p2] = data.spotlightStacks.sort();
        if (data.spotlightStacks.length !== 2 || p1 === undefined || p2 === undefined)
          return;

        const glitch = data.glitch
          ? {
            mid: output.midGlitch!(),
            remote: output.remoteGlitch!(),
          }[data.glitch]
          : output.unknown!();

        if (data.my && data.my.p) {
          let m1 = getMemberByName(data, p1)!;
          let m2 = getMemberByName(data, p2)!;
          if (m1.sm > m2.sm)
            [m1, m2] = [m2, m1];
          if (m1.t === m2.t) { // 둘이 팀이 같으면
            if (data.spotlightStacks.includes(data.me)) { // 내가 그 중 하나면
              const om = m1 === data.my ? m2 : m1;
              const kp = output.knockback!({ glitch: glitch });
              if (data.my.p === om) // 파트너였다면, 이미 나눠져있겠지
                return { alertText: output.stackOnYou!(), infoText: kp };
              return testSynergyMarkerMove(data.my, om)
                ? { alertText: output.stackSwitch!({ player: data.my.p.r }), infoText: kp }
                : { alertText: output.stackOnYou!(), infoText: kp };
            }
            if (data.spotlightStacks.includes(data.my.p.n)) { // 파트너라면
              const om = m1 === data.my.p ? m2 : m1;
              if (testSynergyMarkerMove(data.my.p, om)) {
               return {
                  alertText: output.stackSwitch!({ player: data.my.p.r }),
                  infoText: output.knockback!({ glitch: glitch }),
                };
              }
            }
          }
          // 그냥 알랴줌
          return { infoText: output.stacksOn!({ glitch: glitch, player1: m1.r, player2: m2.r }) };
        }

        const stacksOn = output.stacksOn!({
          glitch: glitch,
          player1: data.ShortName(p1),
          player2: data.ShortName(p2),
        });
        if (!data.spotlightStacks.includes(data.me))
          return { infoText: stacksOn };
        return {
          alertText: output.stackOnYou!(),
          infoText: stacksOn,
        };
      },
    },
    {
      id: 'TOP Optimized Meteor',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => getHeadmarkerId(data, matches) === headmarkers.meteor,
      alertText: (data, matches, output) => {
        data.meteorTargets.push(matches.target);
        if (data.me === matches.target)
          return output.meteorOnYou!();
      },
      outputStrings: {
        meteorOnYou: Outputs.meteorOnYou,
      },
    },
    {
      id: 'TOP Beyond Defense',
      type: 'Ability',
      netRegex: { id: '7B28' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          dontStack: {
            en: '뭉치면 안돼요!',
            de: 'Nicht stacken!',
            fr: 'Ne vous packez pas !',
            ja: 'スタックするな！',
            cn: '分散站位！',
            ko: '쉐어 맞지 말것',
          },
          stack: Outputs.stackMarker,
        };

        if (matches.target === data.me)
          return { alarmText: output.dontStack!() };
        if (!data.meteorTargets.includes(data.me))
          return { infoText: output.stack!() };
      },
    },
    {
      id: 'TOP Cosmo Memory',
      type: 'StartsUsing',
      netRegex: { id: '7B22', source: 'Omega-M', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'TOP Sniper Cannon Fodder',
      type: 'GainsEffect',
      netRegex: { effectId: 'D61' },
      preRun: (data, matches) => data.cannonFodder[matches.target] = 'spread',
      durationSeconds: 15,
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.spread!();
      },
      outputStrings: {
        spread: Outputs.spread,
      },
    },
    {
      id: 'TOP High-Powered Sniper Cannon Fodder Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'D62' },
      run: (data, matches) => data.cannonFodder[matches.target] = 'stack',
    },
    {
      id: 'TOP High-Powered Sniper Cannon Fodder',
      type: 'GainsEffect',
      netRegex: { effectId: 'D62', capture: false },
      delaySeconds: 0.5,
      durationSeconds: 15,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const myBuff = data.cannonFodder[data.me];
        if (myBuff === 'spread')
          return;

        const partnerBuff: Cannon | undefined = myBuff === 'stack' ? undefined : 'stack';
        const partners = [];
        for (const name of data.party.partyNames) {
          if (name === data.me)
            continue;
          if (data.cannonFodder[name] === partnerBuff)
            partners.push(name);
        }

        if (data.members) {
          let m1 = getMemberByName(data, partners[0]!);
          let m2 = getMemberByName(data, partners[1]!);
          if (m1 && m2) {
            if (m1.i > m2.i)
              [m1, m2] = [m2, m1];
            if (myBuff === 'stack')
              return output.stack!({ player1: m1.r, player2: m2.r });
            return output.unmarkedStack!({ player1: m1.r, player2: m2.r });
          }
        }

        const [p1, p2] = partners.sort().map((x) => getMemberRole(data, x));
        if (myBuff === 'stack')
          return output.stack!({ player1: p1, player2: p2 });
        return output.unmarkedStack!({ player1: p1, player2: p2 });
      },
      outputStrings: {
        stack: {
          en: '뭉쳐요 (${player1}, ${player2})',
          de: 'Sammeln (mit ${player1} oder ${player2})',
        },
        unmarkedStack: {
          en: '노마커 뭉쳐요 (${player1}, ${player2})',
          de: 'Nicht markiertes Sammeln (mit ${player1} oder ${player2})',
        },
      },
    },
    {
      id: 'TOP Code Smell Collector',
      type: 'GainsEffect',
      // D6C Synchronization Code Smell (stack)
      // D6D Overflow Code Smell (defamation)
      // D6E Underflow Code Smell (red)
      // D6F Performance Code Smell (blue)
      // D71 Remote Code Smell (far tethers)
      // DAF Local Code Smell (near tethers)
      // DC9 Local Regression (near tethers)
      // DCA Remote Regression (far tethers)
      // DC4 Critical Synchronization Bug (stack)
      // DC5 Critical Overflow Bug (defamation)
      // DC6 Critical Underflow Bug (red)
      // D65 Critical Performance Bug (blue)
      netRegex: { effectId: ['D6D', 'D6E', 'D6F'] },
      run: (data, matches) => {
        const isDefamation = matches.effectId === 'D6D';
        const isRed = matches.effectId === 'D6E';
        const isBlue = matches.effectId === 'D6F';
        if (isDefamation)
          data.smellDefamation.push(matches.target);
        else if (isRed)
          data.smellRot[matches.target] = 'red';
        else if (isBlue)
          data.smellRot[matches.target] = 'blue';
      },
    },
    {
      id: 'TOP Code Smell Defamation Color',
      type: 'GainsEffect',
      netRegex: { effectId: 'D6D', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        let rotColor: RotColor | undefined;

        if (data.smellDefamation.length !== 2) {
          console.error(
            `Defamation: missing person: ${JSON.stringify(data.smellDefamation)}, ${
              JSON.stringify(data.smellRot)
            }`,
          );
        }

        for (const target of data.smellDefamation) {
          const color = data.smellRot[target];
          if (color === undefined) {
            console.error(
              `Defamation: missing color: ${JSON.stringify(data.smellDefamation)}, ${
                JSON.stringify(data.smellRot)
              }`,
            );
            continue;
          }
          if (rotColor === undefined) {
            rotColor = color;
            continue;
          }
          if (rotColor !== color) {
            console.error(
              `Defamation: conflicting color: ${JSON.stringify(data.smellDefamation)}, ${
                JSON.stringify(data.smellRot)
              }`,
            );
            rotColor = undefined;
            break;
          }
        }

        data.defamationColor = rotColor;

        if (rotColor === 'red')
          return output.red!();
        else if (rotColor === 'blue')
          return output.blue!();
        return output.unknown!();
      },
      outputStrings: {
        red: {
          en: '🟥 데파',
          de: 'Rote Ehrenstrafe',
        },
        blue: {
          en: '🟦 데파',
          de: 'Blaue Ehrenstrafe',
        },
        unknown: {
          en: '??? 데파메이션',
          de: '??? Ehrenstrafe',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Omega(?!-)': 'Omega',
        'Omega-F': 'Omega-W',
        'Omega-M': 'Omega-M',
        'Optical Unit': 'Optikmodul',
        'Right Arm Unit': 'recht(?:e|er|es|en) Arm',
      },
      'replaceText': {
        'Atomic Ray': 'Atomstrahlung',
        'Beyond Defense': 'Schildkombo S',
        'Beyond Strength': 'Schildkombo G',
        'Blaster': 'Blaster',
        'Colossal Blow': 'Kolossaler Hieb',
        'Condensed Wave Cannon Kyrios': 'Hochleistungswellenkanone P',
        'Cosmo Memory': 'Kosmosspeicher',
        'Critical Error': 'Schwerer Ausnahmefehler',
        'Diffuse Wave Cannon Kyrios': 'Streuende Wellenkanone P',
        'Discharger': 'Entlader',
        'Efficient Bladework': 'Effiziente Klingenführung',
        'Firewall': 'Sicherungssystem',
        'Flame Thrower': 'Flammensturm',
        'Guided Missile Kyrios': 'Lenkrakete P',
        'Hello, World': 'Hallo, Welt!',
        'High-powered Sniper Cannon': 'Wellengeschütz „Pfeil +”',
        'Ion Efflux': 'Ionenstrom',
        'Laser Shower': 'Laserschauer',
        'Latent Defect': 'Latenter Bug',
        'Left Arm Unit': 'link(?:e|er|es|en) Arm',
        'Limitless Synergy': 'Synergieprogramm LB',
        'Optical Laser': 'Optischer Laser F',
        'Optimized Bladedance': 'Omega-Schwertertanz',
        'Optimized Blizzard III': 'Omega-Eisga',
        'Optimized Fire III': 'Omega-Feuga',
        'Optimized Meteor': 'Omega-Meteor',
        'Optimized Passage of Arms': 'Optimierter Waffengang',
        'Optimized Sagittarius Arrow': 'Omega-Choral der Pfeile',
        'Oversampled Wave Cannon': 'Fokussierte Wellenkanone',
        'Pantokrator': 'Pantokrator',
        'Party Synergy': 'Synergieprogramm PT',
        'Patch': 'Regression',
        'Pile Pitch': 'Neigungsstoß',
        'Program Loop': 'Programmschleife',
        'Right Arm Unit': 'recht(?:e|er|es|en) Arm',
        '(?<! )Sniper Cannon': 'Wellengeschütz „Pfeil”',
        'Solar Ray': 'Sonnenstrahl',
        'Spotlight': 'Scheinwerfer',
        'Storage Violation': 'Speicherverletzung S',
        'Superliminal Steel': 'Klingenkombo B',
        'Synthetic Shield': 'Effiziente Klingenführung',
        '(?<! )Wave Cannon Kyrios': 'Wellenkanone P',
        'Wave Repeater': 'Schnellfeuer-Wellenkanone',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Omega(?!-)': 'Oméga',
        'Omega-F': 'Oméga-F',
        'Omega-M': 'Oméga-M',
        'Optical Unit': 'unité optique',
        'Right Arm Unit': 'unité bras droit',
      },
      'replaceText': {
        'Atomic Ray': 'Rayon atomique',
        'Beyond Defense': 'Combo bouclier S',
        'Beyond Strength': 'Combo bouclier G',
        'Blaster': 'Électrochoc',
        'Colossal Blow': 'Coup colossal',
        'Condensed Wave Cannon Kyrios': 'Canon plasma surchargé P',
        'Cosmo Memory': 'Cosmomémoire',
        'Critical Error': 'Erreur critique',
        'Diffuse Wave Cannon Kyrios': 'Canon plasma diffuseur P',
        'Discharger': 'Déchargeur',
        'Efficient Bladework': 'Lame active',
        'Firewall': 'Programme protecteur',
        'Flame Thrower': 'Crache-flammes',
        'Guided Missile Kyrios': 'Missile guidé P',
        'Hello, World': 'Bonjour, le monde',
        'High-powered Sniper Cannon': 'Canon plasma longue portée surchargé',
        'Ion Efflux': 'Fuite d\'ions',
        'Laser Shower': 'Pluie de lasers',
        'Latent Defect': 'Bogue latent',
        'Left Arm Unit': 'unité bras gauche',
        'Limitless Synergy': 'Programme synergique LB',
        'Optical Laser': 'Laser optique F',
        'Optimized Bladedance': 'Danse de la lame Oméga',
        'Optimized Blizzard III': 'Méga Glace Oméga',
        'Optimized Fire III': 'Méga Feu Oméga',
        'Optimized Meteor': 'Météore Oméga',
        'Optimized Passage of Arms': 'Passe d\'armes Oméga',
        'Optimized Sagittarius Arrow': 'Flèche du sagittaire Oméga',
        'Oversampled Wave Cannon': 'Canon plasma chercheur',
        'Pantokrator': 'Pantokrator',
        'Party Synergy': 'Programme synergique PT',
        'Patch': 'Bogue intentionnel',
        'Pile Pitch': 'Lancement de pieu',
        'Program Loop': 'Boucle de programme',
        'Right Arm Unit': 'unité bras droit',
        '(?<! )Sniper Cannon': 'Canon plasma longue portée',
        'Solar Ray': 'Rayon solaire',
        'Spotlight': 'Phare',
        'Storage Violation': 'Corruption de données S',
        'Superliminal Steel': 'Combo lame B',
        'Synthetic Shield': 'Bouclier optionnel',
        '(?<! )Wave Cannon Kyrios': 'Canon plasma P',
        'Wave Repeater': 'Canon plasma automatique',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Omega(?!-)': 'オメガ',
        'Omega-F': 'オメガF',
        'Omega-M': 'オメガM',
        'Optical Unit': 'オプチカルユニット',
        'Right Arm Unit': 'ライトアームユニット',
      },
      'replaceText': {
        'Atomic Ray': 'アトミックレイ',
        'Beyond Defense': 'シールドコンボS',
        'Beyond Strength': 'シールドコンボG',
        'Blaster': 'ブラスター',
        'Colossal Blow': 'コロッサスブロー',
        'Condensed Wave Cannon Kyrios': '高出力波動砲P',
        'Cosmo Memory': 'コスモメモリー',
        'Critical Error': 'クリティカルエラー',
        'Diffuse Wave Cannon Kyrios': '拡散波動砲P',
        'Discharger': 'ディスチャージャー',
        'Efficient Bladework': 'ソードアクション',
        'Firewall': 'ガードプログラム',
        'Flame Thrower': '火炎放射',
        'Guided Missile Kyrios': '誘導ミサイルP',
        'Hello, World': 'ハロー・ワールド',
        'High-powered Sniper Cannon': '狙撃式高出力波動砲',
        'Ion Efflux': 'イオンエフラクス',
        'Laser Shower': 'レーザーシャワー',
        'Latent Defect': 'レイテントバグ',
        'Left Arm Unit': 'レフトアームユニット',
        'Limitless Synergy': '連携プログラムLB',
        'Optical Laser': 'オプチカルレーザーF',
        'Optimized Bladedance': 'ブレードダンス・オメガ',
        'Optimized Blizzard III': 'ブリザガ・オメガ',
        'Optimized Fire III': 'ファイラ・オメガ',
        'Optimized Meteor': 'メテオ・オメガ',
        'Optimized Passage of Arms': 'パッセージ・オブ・オメガ',
        'Optimized Sagittarius Arrow': 'サジタリウスアロー・オメガ',
        'Oversampled Wave Cannon': '検知式波動砲',
        'Pantokrator': 'パントクラトル',
        'Party Synergy': '連携プログラムPT',
        'Patch': 'エンバグ',
        'Pile Pitch': 'パイルピッチ',
        'Program Loop': 'サークルプログラム',
        'Right Arm Unit': 'ライトアームユニット',
        '(?<! )Sniper Cannon': '狙撃式波動砲',
        'Solar Ray': 'ソーラレイ',
        'Spotlight': 'スポットライト',
        'Storage Violation': '記憶汚染除去S',
        'Superliminal Steel': 'ブレードコンボB',
        'Synthetic Shield': 'シールドオプション',
        '(?<! )Wave Cannon Kyrios': '波動砲P',
        'Wave Repeater': '速射式波動砲',
      },
    },
  ],
};

export default triggerSet;
