import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { LocaleText, Output, TriggerSet } from '../../../../../types/trigger';

// TODO: Delta green tether break calls
// TODO: Sigma say if you are unmarked / marked with unmarked / double mark pair
// TODO: Sigma can we find towers and tell people where north tower is?
// TODO: Sigma staff/feet call
// TODO: Omega tell people they must be a monitor (alarm) if they are Second in Line + two Quickening Dynamis
// TODO: Adjust Omega dodge locations
// TODO: p6 magic number tank lb / healer lb triggers
// TODO: p6 exasquare "wait" calls

// [PRS BEGIN]
// 다시 돌아온 멤버 처리: 만들어 보자고!!! 😭
type PrsMember = {
  r: string; // 롤
  j: string; // 잡
  t: number; // 팀
  pp: number; // Program loop -> 프로그램 루프 우선순위
  pk: number; // Pantokrator -> 판크 우선 순위
  sm: number; // Synergy marker -> PS 마커 우선순위
  oc: number; // canon
  n: string; // 이름
  // 내부
  i: number; // 순번
  ip?: PrsMember; // 파트너
  imn?: number; // p3 모니터 산개
  idyn?: number; // p5 다이너미스
};
export const getMemberByName = (data: Data, name: string) =>
  data.members?.find((e) => e.n === name);
export const getMemberRole = (data: Data, name: string) => {
  const m = getMemberByName(data, name);
  return m ? m.r : data.party.member(name);
};
export const testSynergyMarkerMove = (my: PrsMember, ot: PrsMember) => {
  if (my.sm < 5)
    return my.sm > ot.sm;
  return my.sm < ot.sm;
};
// [PRS END]

export type Phase =
  | 'p1'
  | 'p2'
  | 'p3'
  | 'p4'
  | 'delta'
  | 'sigma'
  | 'omega'
  | 'p6';

export const playstationMarkers = ['circle', 'cross', 'triangle', 'square'] as const;
export type PlaystationMarker = typeof playstationMarkers[number];

export type Glitch = 'mid' | 'remote';
export type Cannon = 'spread' | 'stack';
export type RotColor = 'blue' | 'red';
export type Regression = 'local' | 'remote';
export type TetherColor = 'blue' | 'green';
export type TrioDebuff = 'near' | 'distant';

export interface Data extends RaidbossData {
  members?: PrsMember[];
  my?: PrsMember;
  simple?: boolean;
  panked?: boolean;
  lastmode?: number;
  omegaMonitors?: string[];
  //
  readonly triggerSetConfig: { staffSwordDodge: 'mid' | 'far' };
  combatantData: PluginCombatantState[];
  phase: Phase;
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
  bugRot: { [name: string]: RotColor };
  defamationColor?: RotColor;
  regression: { [name: string]: Regression };
  latentDefectCount: number;
  patchVulnCount: number;
  waveCannonStacks: NetMatches['Ability'][];
  monitorPlayers: NetMatches['GainsEffect'][];
  deltaTethers: { [name: string]: TetherColor };
  trioDebuff: { [name: string]: TrioDebuff };
  omegaDodgeRotation?: 'right' | 'left';
  seenOmegaTethers?: boolean;
  cosmoArrowCount: number;
  cosmoArrowIn?: boolean;
  cosmoArrowExaCount: number;
  waveCannonFlares: number[];
}

const phaseReset = (data: Data) => {
  data.monitorPlayers = [];
  data.trioDebuff = {};
  //
  if (data.my)
    data.my.ip = undefined;
};

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

const nearDistantOutputStrings: { [label: string]: LocaleText } = {
  near: {
    en: 'Near World',
    de: 'Hallo Welt: Nah',
    ja: 'ニア',
    cn: '近处世界',
    ko: '[니어 월드]',
  },
  distant: {
    en: 'Distant World',
    de: 'Hallo Welt: Fern',
    ja: 'ファー',
    cn: '远处世界',
    ko: '[파 월드]',
  },
} as const;

const staffSwordMidHelper = (isEastWest: boolean, posX: number, posY: number, output: Output) => {
  if (isEastWest) {
    // East/West Safe
    if (posX < 100 && posY < 100) {
      // NW
      return output.dirWSW!();
    } else if (posX < 100 && posY > 100) {
      // SW
      return output.dirWNW!();
    } else if (posX > 100 && posY < 100) {
      // NE
      return output.dirESE!();
    }
    // SE
    return output.dirENE!();
  }

  // North/South Safe
  if (posX < 100 && posY < 100) {
    // NW
    return output.dirNNE!();
  } else if (posX < 100 && posY > 100) {
    // SW
    return output.dirSSE!();
  } else if (posX > 100 && posY < 100) {
    // NE
    return output.dirNNW!();
  }

  // SE
  return output.dirSSW!();
};

const triggerSet: TriggerSet<Data> = {
  id: 'TheOmegaProtocolUltimate',
  zoneId: ZoneId.TheOmegaProtocolUltimate,
  config: [
    {
      id: 'staffSwordDodge',
      comment: {
        en:
          '<a href="https://github.com/quisquous/cactbot/releases/tag/v0.28.19" target="_blank">Read Notes</a>',
        de:
          '<a href="https://github.com/quisquous/cactbot/releases/tag/v0.28.19" target="_blank">Notizen lesen</a>',
        cn:
          '<a href="https://github.com/quisquous/cactbot/releases/tag/v0.28.19" target="_blank">阅读笔记</a>',
        ko:
          '<a href="https://github.com/quisquous/cactbot/releases/tag/v0.28.19" target="_blank">참고</a>',
      },
      name: {
        en: 'Run: Omega Staff Sword Dodge Direction',
        de: 'Renn: Omega Stab Schwert Ausweich-Richtung',
        ja: 'オメガの杖の回避方向',
        cn: '欧米茄运动会杖剑躲避方向',
        ko: '코드: 오메가 지팡이 칼 회피 방향',
      },
      type: 'select',
      options: {
        en: {
          'Dodge Far (by Omega-M)': 'far',
          'Dodge Mid (by Omega-F)': 'mid',
        },
        de: {
          'Ausweichen Fern (von Omega-M)': 'far',
          'Ausweichen Mitte (von Omega-F)': 'mid',
        },
        cn: {
          '躲远 (by Omega-M)': 'far',
          '躲中 (by Omega-F)': 'mid',
        },
        ko: {
          '멀리 (Omega-M)': 'far',
          '중간 (Omega-F)': 'mid',
        },
      },
      default: 'far',
    },
  ],
  timelineFile: 'the_omega_protocol.txt',
  initData: () => {
    return {
      combatantData: [],
      phase: 'p1',
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
      regression: {},
      bugRot: {},
      latentDefectCount: 0,
      patchVulnCount: 0,
      waveCannonStacks: [],
      monitorPlayers: [],
      deltaTethers: {},
      trioDebuff: {},
      cosmoArrowCount: 0,
      cosmoArrowExaCount: 0,
      waveCannonFlares: [],
    };
  },
  timelineTriggers: [
    {
      id: 'TOP PR 데이터 확인',
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
          en: 'No user data found',
          ja: 'データの設定が見つかりません',
          ko: '데이터를 설정하지 않았네요',
        },
        nome: {
          en: 'No my data found',
          ja: 'わたしのデータが見つかりません',
          ko: '내 데이터를 찾을 수 없어요',
        },
        itsme: {
          en: 'Your role: ${role} ${simple}',
          ja: 'ロール:  ${role} ${simple}',
          ko: '내 역할: ${role} ${simple}',
        },
        simple: {
          en: '(Simple mode)',
          ja: '(簡略モード)',
          ko: '(심플 모드)',
        },
      },
    },
    {
      id: 'TOP Flash Gale Tank Auto',
      regex: /Flash Gale 1/,
      beforeSeconds: 5.5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tank Autos',
          de: 'Tank Autos',
          ja: 'タンクへのオートアタック',
          cn: '坦克平A',
          ko: '탱크 오토 어택',
        },
      },
    },
    {
      id: 'TOP Wave Cannon Protean',
      regex: /Wave Cannon 1/,
      beforeSeconds: 6,
      durationSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Protean',
          de: 'Himmelsrichtungen',
          ja: '基本散会',
          cn: '八方分散',
          ko: '프로틴, 흩어져욧',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'TOP Phase Tracker',
      type: 'StartsUsing',
      // 7B40 = Firewall
      // 8014 = Run ****mi* (Sigma Version)
      // 8015 = Run ****mi* (Omega Version)
      netRegex: { id: ['7B40', '8014', '8015'], capture: true },
      run: (data, matches) => {
        phaseReset(data);
        switch (matches.id) {
          case '7B40':
            data.phase = 'p2';
            break;
          case '8014':
            data.phase = 'sigma';
            break;
          case '8015':
            data.phase = 'omega';
            break;
        }
      },
    },
    {
      id: 'TOP Phase Ability Tracker',
      type: 'Ability',
      // 7BFD = attack (Omega)
      // 7B13 = self-cast on omega
      // 7B47 = self-cast on omega
      // 7B7C = self-cast on omega
      // 7F72 = Blind Faith (non-enrage)
      netRegex: { id: ['7BFD', '7B13', '7B47', '7B7C', '7F72'], capture: true },
      suppressSeconds: 20, // Ignore multiple delta/omega captures
      run: (data, matches) => {
        phaseReset(data);
        switch (matches.id) {
          case '7BFD':
            data.phase = 'p1';
            break;
          case '7B13':
            data.phase = 'p3';
            break;
          case '7B47':
            data.phase = 'p4';
            break;
          case '7B7C':
            data.phase = 'delta';
            data.inLine = {}; // 오메가에서 쓸거지만 여기서 리셋해둠
            break;
          case '7F72':
            data.phase = 'p6';
            break;
        }
      },
    },
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
          data.my.ip = undefined;
        if (matches.id === '7B0B')
          data.panked = true;
      },
    },
    {
      id: 'TOP In Line Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: ['BBC', 'BBD', 'BBE', 'D7B'], capture: false },
      condition: (data) => data.phase === 'p1',
      delaySeconds: 0.5,
      durationSeconds: (data) => data.panked ? 5 : 38, // 원래 5초
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
              data.my.ip = getMemberByName(data, name);
            break;
          }
        }

        if (data.my && data.my.ip) {
          if (data.panked) {
            const cm = Math.floor(data.my.pk / 10);
            const cp = Math.floor(data.my.ip.pk / 10);
            if (cm === cp && data.my.pk < data.my.ip.pk) {
              if (data.simple)
                return output.simpleSwitch!({ player: data.my.ip.r });
              return output.switch!({ num: myNum, player: data.my.ip.r });
            }
            if (data.simple)
              return output.simple!({ player: data.my.ip.r });
            return output.text!({ num: myNum, player: data.my.ip.r });
          }
          if (data.simple) {
            if (data.my.pp < data.my.ip.pp)
              return output.simpleCw!({ player: data.my.ip.r });
            return output.simpleCcw!({ player: data.my.ip.r });
          }
          if (data.my.pp < data.my.ip.pp)
            return output.cw!({ num: myNum, player: data.my.ip.r });
          return output.ccw!({ num: myNum, player: data.my.ip.r });
        }

        return output.text!({ num: myNum, player: data.party.member(partner) });
      },
      outputStrings: {
        text: {
          en: '${num} (with ${player})',
          de: '${num} (mit ${player})',
          ja: '${num} (${player})',
          cn: '${num} (与 ${player})',
          ko: '${num}번 (${player})',
        },
        cw: {
          en: 'Clockwise ${num} (${player})',
          ko: '${num}번 (${player}) ❱❱❱❱❱',
        },
        ccw: {
          en: 'Counter-Clockwise ${num} (${player})',
          ko: '❰❰❰❰❰ ${num}번 (${player})',
        },
        switch: {
          en: 'Switch ${num} (${player})',
          ko: '${num}번 스위치! (${player})',
        },
        simple: {
          en: '(${player})',
          ko: '(${player})',
        },
        simpleCw: {
          en: 'Clock (${player})',
          ko: '(${player}) ❱❱❱❱❱',
        },
        simpleCcw: {
          en: 'Counter Clock (${player})',
          ko: '❰❰❰❰❰ (${player})',
        },
        simpleSwitch: {
          en: 'Switch! (${player})',
          ko: '스위치! (${player})',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'TOP Program Loop First Debuffs',
      type: 'StartsUsing',
      // 7B07 = Blaster cast (only one cast, but 4 abilities)
      netRegex: { id: '7B07', source: 'Omega', capture: false },
      durationSeconds: (data) => {
        const myNum = data.inLine[data.me];
        if (myNum === 1 || myNum === 3)
          return 7;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tower: {
            en: 'Tower 1',
            de: 'Turm 1',
            ja: '塔1',
            cn: '塔 1',
            ko: '타워로!',
          },
          tether: {
            en: 'Tether 1',
            de: 'Verbindung 1',
            ja: '線1',
            cn: '线 1',
            ko: '줄채요!',
          },
          numNoMechanic: {
            en: '1',
            de: '1',
            ja: '1',
            cn: '1',
            ko: '1',
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
      durationSeconds: (data) => {
        const mechanicNum = data.loopBlasterCount + 1;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        if (mechanicNum === myNum || mechanicNum === myNum + 2 || mechanicNum === myNum - 2)
          return 7;
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tower: {
            en: 'Tower ${num}',
            de: 'Turm ${num}',
            ja: '塔 ${num}',
            cn: '塔 ${num}',
            ko: '타워로! ${num}',
          },
          tether: {
            en: 'Tether ${num}',
            de: 'Verbindung ${num}',
            ja: '線 ${num}',
            cn: '线 ${num}',
            ko: '줄채요! ${num}',
          },
          numNoMechanic: {
            en: '${num}',
            de: '${num}',
            ja: '${num}',
            cn: '${num}',
            ko: '${num}',
          },
          simpleTower: {
            en: 'Tower!',
            ja: '塔へ！',
            ko: '타워로!',
          },
          simpleTether: {
            en: 'Tether!',
            ja: '線取り！',
            ko: '줄채요!',
          },
        };

        const mechanicNum = data.loopBlasterCount + 1;
        if (mechanicNum >= 5)
          return;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return { infoText: output.numNoMechanic!({ num: mechanicNum }) };

        if (data.options.AutumnStyle) {
          if (myNum === mechanicNum)
            return { alertText: output.simpleTower!() };
          if (mechanicNum === myNum + 2 || mechanicNum === myNum - 2)
            return { alertText: output.simpleTether!() };
          return { infoText: output.numNoMechanic!({ num: mechanicNum }) };
        }

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
            ja: '1',
            cn: '1',
            ko: '1',
          },
          spread: {
            en: '1 Out (on YOU)',
            de: '1 Raus (auf Dir)',
            ja: '1 外へ',
            cn: '1 出 (点名)',
            ko: '밖으로!',
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
            ja: '${num}',
            cn: '${num}',
            ko: '${num}',
          },
          spread: {
            en: '${num} Out (on YOU)',
            de: '${num} Raus (auf Dir)',
            ja: '${num} 外へ',
            cn: '${num} 出 (点名)',
            ko: '${num} 밖으로!',
          },
          spreadMesg: {
            en: 'Out!',
            ja: '外へ',
            ko: '밖으로!',
          },
        };

        const mechanicNum = data.pantoMissileCount + 1;
        if (mechanicNum >= 5)
          return;
        const myNum = data.inLine[data.me];
        if (myNum === mechanicNum) {
          if (!data.options.AutumnStyle)
            return { alertText: output.spread!({ num: mechanicNum }) };
          return { alertText: output.spreadMesg!() };
        }
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
          en: 'Tank Cleaves',
          de: 'Tank Cleaves',
          ja: 'タンク前方攻撃',
          cn: '坦克顺劈',
          ko: '탱크클레브',
        },
      },
    },
    {
      id: 'TOP Wave Cannon Kyrios',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        if (data.simple)
          return;
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.spread)
          return output.laserOnYou!();
      },
      outputStrings: {
        laserOnYou: {
          en: 'Laser on YOU',
          de: 'Laser auf DIR',
          ja: '自分のレーザー',
          cn: '激光点名',
          ko: '내게 레이저',
        },
      },
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
      id: 'TOP Party Synergy',
      type: 'Ability',
      netRegex: { id: '7B3E', source: 'Omega', capture: false },
      // Untargetable 3s after this, things appear ~2 after this, 2.5 for safety.
      delaySeconds: 5.5,
      promise: async (data) => {
        data.combatantData = [];
        // TODO: filter this by the combatants added right before Party Synergy???
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        const omegaMNPCId = 15714;
        const omegaFNPCId = 15715;
        let countM = 0;
        let countF = 0;
        let isFIn = false;
        let isMIn = false;
        for (const c of data.combatantData) {
          if (c.BNpcID === omegaMNPCId) {
            countM++;
            if (c.WeaponId === 4)
              isMIn = true;
          }
          if (c.BNpcID === omegaFNPCId) {
            countF++;
            if (c.WeaponId === 4)
              isFIn = true;
          }
        }

        if (countM === 0 || countF === 0) {
          console.error(`PartySynergy: missing m/f: ${JSON.stringify(data.combatantData)}`);
          return;
        }
        if (isFIn && isMIn)
          return output.superliminalStrength!();
        if (isFIn && !isMIn)
          return output.superliminalBladework!();
        if (!isFIn && isMIn)
          return output.blizzardStrength!();
        if (!isFIn && !isMIn)
          return output.blizzardBladework!();
      },
      outputStrings: {
        blizzardBladework: {
          en: 'Out Out',
          de: 'Raus Raus',
          ja: '外 外',
          cn: '远离男女',
          ko: '남자 바깥 (밖 + 밖)',
        },
        superliminalStrength: {
          en: 'In In on M',
          de: 'Rein Rein auf M',
          ja: '内 内(男)',
          cn: '靠近男人',
          ko: '남자 밑 (안 + 안)',
        },
        superliminalBladework: {
          en: 'Under F',
          de: 'Unter W',
          ja: '女の下',
          cn: '靠近女人',
          ko: '언니 밑',
        },
        blizzardStrength: {
          en: 'M Sides',
          de: 'Seitlich von M',
          ja: '男の横',
          cn: '男人两侧',
          ko: '남자 바로 옆 (언니 발차기)',
        },
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
              data.my.ip = getMemberByName(data, name);
            break;
          }
        }

        const mark = output[myMarker]!();
        const index = { circle: 1, cross: 2, triangle: 3, square: 4 }[myMarker];

        if (data.my && data.my.ip) {
          if (data.phase === 'p2') {
            // P2 일때
            const left = data.my.sm < data.my.ip.sm;
            // 왼쪽
            if (left) {
              const num = output[`num${index}`]!();
              return output.left!({ glitch: glitch, mark: mark, num: num, player: data.my.ip.r });
            }
            // 오른쪽
            if (data.glitch === 'mid') {
              const num = output[`num${index}`]!();
              return output.right!({ glitch: glitch, mark: mark, num: num, player: data.my.ip.r });
            }
            const num = output[`num${5 - index}`]!();
            return output.right!({ glitch: glitch, mark: mark, num: num, player: data.my.ip.r });
          } else if (data.phase === 'sigma') {
            // 시그마 일때
            return output.text!({ glitch: glitch, mark: mark, player: data.my.ip.r });
          }
        }

        // 기본
        return output.text!({ glitch: glitch, mark: mark, player: getMemberRole(data, partner) });
      },
      outputStrings: {
        midGlitch: {
          en: 'Mid',
          de: 'Mittel',
          ja: 'ミドル',
          cn: '中',
          ko: '[미들]',
        },
        remoteGlitch: {
          en: 'Far',
          de: 'Fern',
          cn: '远',
          ko: '[파]',
        },
        circle: {
          en: 'Circle',
          ko: '동글',
        },
        triangle: {
          en: 'Triangle',
          ko: '삼각',
        },
        square: {
          en: 'Square',
          ko: '사각',
        },
        cross: {
          en: 'Cross',
          ko: '엑스',
        },
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        num4: Outputs.cnum4,
        text: {
          en: '${glitch} ${mark} (${player})',
          ko: '${glitch} ${mark} (${player})',
        },
        left: {
          en: 'Left ${glitch} ${num}${mark} (${player})',
          ko: '❰❰❰❰❰ ${glitch} ${num}${mark} (${player})',
        },
        right: {
          en: 'Right ${glitch} ${num}${mark} (${player})',
          ko: '${glitch} ${num}${mark} (${player}) ❱❱❱❱❱',
        },
        unknown: Outputs.unknown,
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
            en: 'Mid',
            de: 'Mittel',
            ja: 'ミドル',
            cn: '中',
            ko: '[미들]',
          },
          remoteGlitch: {
            en: 'Far',
            de: 'Fern',
            ja: 'ファー',
            cn: '远',
            ko: '[파]',
          },
          circle: {
            en: 'Circle',
            ko: '동글',
          },
          triangle: {
            en: 'Triangle',
            ko: '삼각',
          },
          square: {
            en: 'Square',
            ko: '사각',
          },
          cross: {
            en: 'Cross',
            ko: '엑스',
          },
          stacksOn: {
            en: '${glitch} Stacks (${player1}, ${player2})',
            de: '${glitch} Sammeln (${player1}, ${player2})',
            cn: '${glitch} 分摊 (${player1}, ${player2})',
            ko: '${glitch} (${player1}, ${player2})',
          },
          markerOn: {
            en: '${glitch} ${marker} (${player1}, ${player2})',
            ja: '${glitch} ${marker} (${player1}, ${player2})',
            ko: '${glitch} ${marker} (${player1}, ${player2})',
          },
          // TODO: say who your tether partner is to swap??
          // TODO: tell the tether partner they are tethered to a stack?
          stackOnYou: Outputs.stackOnYou,
          unknown: Outputs.unknown,
          stackSwitch: {
            en: 'Swap & Stack (${player})',
            ko: '자리 바꿔 뭉쳐요 (${player})',
          },
          knockback: {
            en: '${glitch} Knockback',
            ko: '${glitch} 넉백',
          },
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

        const myMarker = data.synergyMarker[data.me];
        const marker = myMarker === undefined ? '' : output[myMarker]!();

        if (data.my && data.my.ip) {
          let m1 = getMemberByName(data, p1)!;
          let m2 = getMemberByName(data, p2)!;
          if (m1.sm > m2.sm)
            [m1, m2] = [m2, m1];
          /* if (m1.t === m2.t) { // 둘이 팀이 같으면
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
          } */
          // 그냥 알랴줌
          const ouch = !data.options.AutumnStyle
            ? output.stacksOn!({ glitch: glitch, player1: m1.r, player2: m2.r })
            : output.markerOn!({ glitch: glitch, marker: marker, player1: m1.r, player2: m2.r });
          return { infoText: ouch };
        }

        const stacksOn = !data.options.AutumnStyle
          ? output.stacksOn!({
            glitch: glitch,
            player1: data.party.jobAbbr(p1),
            player2: data.party.jobAbbr(p2),
          })
          : output.markerOn!({
            glitch: glitch,
            marker: marker,
            player1: data.party.jobAbbr(p1),
            player2: data.party.jobAbbr(p2),
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
            en: 'Don\'t Stack!',
            de: 'Nicht stacken!',
            fr: 'Ne vous packez pas !',
            ja: 'スタックするな！',
            cn: '分散站位！',
            ko: '뭉치면 안돼요!',
          },
          stack: Outputs.stackMarker,
        };

        if (matches.target === data.me)
          return { alarmText: output.dontStack!() };
        // Note: if you are doing uptime meteors then everybody stacks.
        // If you are not, then you'll need to ignore this as needed.
        // Note2: For P5 Delta, all remaining blues will stack for pile pitch
        if (data.deltaTethers[data.me] !== 'green')
          return { infoText: output.stack!() };
      },
    },
    {
      id: 'TOP P2 Cosmo Memory',
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
        spread: {
          en: 'Spread to your position',
          ko: '흩어져서 내 자리로',
        },
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
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          stack: {
            en: 'Stack (w/ ${player1} or ${player2})',
            de: 'Sammeln (mit ${player1} oder ${player2})',
            ja: 'あたまわり (${player1}, ${player2})',
            cn: '分摊 (与 ${player1} 或 ${player2})',
            ko: '뭉쳐요 (${player1}, ${player2})',
          },
          unmarkedStack: {
            en: 'Unmarked Stack (w/ ${player1} or ${player2})',
            de: 'Nicht markiertes Sammeln (mit ${player1} oder ${player2})',
            ja: '無職のあたまわり (${player1}, ${player2})',
            cn: '无点名分摊 (与 ${player1} 或 ${player2})',
            ko: '노 디버프, 뭉쳐요 (${player1}, ${player2})',
          },
          sameDebuffPartner: {
            en: '(same debuff as ${player})',
            de: '(selber Debuff wie ${player})',
            ja: '(${player}と同じデバフ)',
            cn: '(与 ${player} 相同 debuff)',
            ko: '(같은 디버프: ${player})',
          },
          unknown: Outputs.unknown,
        };

        const myBuff = data.cannonFodder[data.me];
        if (myBuff === 'spread')
          return;

        const oppositeBuff: Cannon | undefined = myBuff === 'stack' ? undefined : 'stack';
        const opposites = [];
        let partner: string = output.unknown!();
        for (const name of data.party?.partyNames ?? []) {
          if (name === data.me)
            continue;
          if (data.cannonFodder[name] === myBuff)
            partner = name;
          if (data.cannonFodder[name] === oppositeBuff)
            opposites.push(name);
        }

        const partnerText = output.sameDebuffPartner!({ player: getMemberRole(data, partner) });

        if (data.members) {
          let m1 = getMemberByName(data, opposites[0]!);
          let m2 = getMemberByName(data, opposites[0]!);
          if (m1 && m2) {
            if (m1.i > m2.i)
              [m1, m2] = [m2, m1];
            if (myBuff === 'stack')
              return {
                alertText: output.stack!({ player1: m1.r, player2: m2.r }),
                infoText: partnerText,
              };
            return {
              alertText: output.unmarkedStack!({ player1: m1.r, player2: m2.r }),
              infoText: partnerText,
            };
          }
        }

        const [p1, p2] = opposites.sort().map((x) => getMemberRole(data, x));
        if (myBuff === 'stack')
          return { alertText: output.stack!({ player1: p1, player2: p2 }), infoText: partnerText };
        return {
          alertText: output.unmarkedStack!({ player1: p1, player2: p2 }),
          infoText: partnerText,
        };
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
      durationSeconds: 10,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
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
          en: 'Red is Defamation',
          de: 'Rot hat Ehrenstrafe',
          ja: '赤',
          cn: '红毒大圈',
          ko: '서클 색깔: 🔴',
        },
        blue: {
          en: 'Blue is Defamation',
          de: 'Blau hat Ehrenstrafe',
          ja: '青',
          cn: '蓝毒大圈',
          ko: '서클 색깔: 🔵',
        },
        unknown: {
          en: '??? is Defamation',
          de: '??? Ehrenstrafe',
          ja: '???',
          cn: '???大圈',
          ko: '서클 색깔: ???',
        },
      },
    },
    {
      id: 'TOP Latent Defect Tower',
      type: 'StartsUsing',
      netRegex: { id: '7B6F', source: 'Omega', capture: false },
      durationSeconds: 10,
      infoText: (data, _matches, output) => {
        const myColor = data.bugRot[data.me];
        if (myColor === undefined)
          return;
        if (data.defamationColor === myColor)
          return output.colorTowerDefamation!({ color: output[myColor]!() });
        else if (myColor)
          return output.colorTower!({ color: output[myColor]!() });
      },
      outputStrings: {
        colorTower: {
          en: '${color} Tower Stack',
          de: '${color} Turm versammeln',
          ja: '${color}塔',
          cn: '${color} 塔分摊',
          ko: '${color} 타워 밟은채 🡺 뭉쳐요',
        },
        colorTowerDefamation: {
          en: '${color} Tower Defamation',
          de: '${color} Turm Ehrenstrafe',
          ja: '${color}塔',
          cn: '${color} 塔大圈',
          ko: '${color} 타워 밟은채 모서리 / 서클',
        },
        red: {
          en: 'Red',
          de: 'Rot',
          ja: '赤',
          cn: '红',
          ko: '🔴',
        },
        blue: {
          en: 'Blue',
          de: 'Blau',
          ja: '青',
          cn: '蓝',
          ko: '🔵',
        },
      },
    },
    {
      id: 'TOP Rot Collect',
      type: 'GainsEffect',
      // D65 Critical Performance Bug (blue)
      // DC6 Critical Underflow Bug (red)
      // Debuffs last 27s
      netRegex: { effectId: ['D65', 'DC6'] },
      condition: (data, matches) => {
        data.bugRot[matches.target] = matches.effectId === 'D65' ? 'blue' : 'red';
        return (matches.target === data.me) && data.latentDefectCount !== 3;
      },
    },
    {
      id: 'TOP Rot Pass/Get',
      type: 'Ability',
      // 7B5F Cascading Latent Defect (Red Tower)
      // 7B60 Latent Performance Defect (Blue Tower)
      // These casts go off 1 second after Latent Defect and go off regardless if someone soaks it
      netRegex: { id: ['7B5F', '7B60'], source: 'Omega', capture: false },
      condition: (data) => data.latentDefectCount < 3,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          passRot: {
            en: 'Pass Rot',
            de: 'Bug weitergeben',
            ja: '受け渡し',
            cn: '不接毒',
            ko: 'ROT 넘겨요',
          },
          getRot: {
            en: 'Get Rot',
            de: 'Bug nehmen',
            ja: 'デバフもらう',
            cn: '接毒',
            ko: 'ROT 받아요',
          },
        };
        if (data.bugRot[data.me])
          return { infoText: output.passRot!() };
        return { alertText: output.getRot!() };
      },
      run: (data) => {
        data.bugRot = {};
        data.latentDefectCount = data.latentDefectCount + 1;
      },
    },
    {
      id: 'TOP Latent Defect Tether Towers',
      type: 'GainsEffect',
      // D71 Remote Code Smell (blue)
      // DAF Local Code Smell(red/green)
      // Using Code Smell as the regressions come ~8.75s after Latent Defect
      // Debuffs are 23, 44, 65, and 86s
      // TODO: Possibly include direction?
      netRegex: { effectId: ['D71', 'DAF'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 8.75,
      durationSeconds: 10,
      alertText: (data, matches, output) => {
        const regression = matches.effectId === 'DAF' ? 'local' : 'remote';
        const defamation = data.defamationColor;
        if (defamation === undefined)
          return;

        const defamationTowerColor = defamation === 'red' ? output.red!() : output.blue!();
        const stackTowerColor = defamation === 'red' ? output.blue!() : output.red!();
        if (regression === 'remote')
          return output.farTether!({ color: stackTowerColor });

        if (parseFloat(matches.duration) < 80)
          return output.nearTether!({ color: defamationTowerColor });

        return output.finalTowerNear!({ color: stackTowerColor });
      },
      outputStrings: {
        farTether: {
          en: 'Stack by ${color} Tower',
          de: 'Beim ${color}en Turm versammeln',
          ja: '${color}の間でペア',
          cn: '在 ${color} 塔分摊',
          ko: '뭉쳐요: ${color} 타워 사이',
        },
        nearTether: {
          en: 'Outside ${color} Towers',
          de: 'Auserhalb vom ${color}en Turm',
          ja: '${color}の外へ',
          cn: '站 ${color} 塔外',
          ko: '얻어요: ${color} 타워 바깥 / 서클',
        },
        finalTowerNear: {
          en: 'Between ${color} Towers',
          de: 'Zwischen den ${color}en Türmen',
          ja: '${color}の間へ',
          cn: '站 ${color} 塔之间',
          ko: '마지막: ${color} 타워 사이',
        },
        red: {
          en: 'Red',
          de: 'Rot',
          ja: '赤',
          cn: '红',
          ko: '🔴',
        },
        blue: {
          en: 'Blue',
          de: 'Blau',
          ja: '青',
          cn: '蓝',
          ko: '🔵',
        },
      },
    },
    {
      id: 'TOP P3 Regression Collect',
      type: 'GainsEffect',
      // DC9 Local Regression (red/green)
      // DCA Remote Regression (blue)
      netRegex: { effectId: ['DC9', 'DCA'] },
      run: (data, matches) => {
        data.regression[matches.target] = matches.effectId === 'DC9' ? 'local' : 'remote';
      },
    },
    {
      id: 'TOP P3 Second Regression Break Tether',
      type: 'GainsEffect',
      // DC9 Local Regression (red/green)
      // DCA Remote Regression (blue)
      // Debuffs last 10s
      // Ideally first patch that breaks is blue, else this will not work
      // Will call out if has not broken yet and it is safe to break, if by end
      // of delay and first tether has not broken, it will not call
      netRegex: { effectId: ['DC9', 'DCA'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        if (
          (data.patchVulnCount % 2 === 1 && data.regression[data.me] === 'local') ||
          (data.patchVulnCount === 7 && data.regression[data.me] === 'remote')
        ) {
          if (data.regression[data.me] === 'local')
            return output.breakClose!();
          if (data.regression[data.me] === 'remote')
            return output.breakFar!();
          return output.breakTether!();
        }
      },
      outputStrings: {
        breakTether: {
          en: 'Break Tether',
          de: 'Verbindung brechen',
          ja: '線切る',
          cn: '扯断连线',
          ko: '줄 끊어요',
        },
        breakClose: {
          en: 'Close to Break Tether',
          ko: '붙어서 줄 끊어요',
        },
        breakFar: {
          en: 'Go Far to Break Tether',
          ko: '멀어져서 줄 끊어요',
        },
      },
    },
    {
      id: 'TOP P3 Regression Cleanup',
      type: 'LosesEffect',
      // DC9 Local Regression (red/green)
      // DCA Remote Regression (blue)
      netRegex: { effectId: ['DC9', 'DCA'] },
      run: (data, matches) => delete data.regression[matches.target],
    },
    {
      id: 'TOP Regression Break Counter',
      type: 'GainsEffect',
      // DBC Magic Vulnerability Up from Patch, lasts 0.96s
      // TODO: Clean this up for P5 Tethers?
      netRegex: { effectId: 'DBC' },
      preRun: (data) => data.patchVulnCount = data.patchVulnCount + 1,
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      suppressSeconds: 1,
      run: (data) => {
        // Clear count for later phases
        if (data.patchVulnCount === 8)
          data.patchVulnCount = 0;
      },
    },
    {
      id: 'TOP Rot Spread',
      type: 'GainsEffect',
      // D65 Critical Performance Bug (blue)
      // DC6 Critical Underflow Bug (red)
      // Debuffs last 27s
      netRegex: { effectId: ['D65', 'DC6'] },
      // TODO: should we have a "Watch Rot" call if you don't get it?
      // (with some suppression due to inconsistent rot pickup timings etc)
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      infoText: (_data, _matches, output) => output.spread!(),
      run: (data, matches) => delete data.bugRot[matches.target],
      outputStrings: {
        spread: {
          en: 'Spread',
          ko: '흩어져요, 서로 안 부딪게',
        },
      },
    },
    {
      id: 'TOP Oversampled Wave Cannon East',
      type: 'StartsUsing',
      netRegex: { id: '7B6B', source: 'Omega', capture: false },
      delaySeconds: 1.2,
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        if (!data.my?.imn)
          return output.text!();
        const mo = {
          21: output.m1!(),
          22: output.m2!(),
          23: output.m3!(),
          11: output.o1!(),
          12: output.o2!(),
          13: output.o3!(),
          14: output.o4!(),
          15: output.o5!(),
        }[data.my.imn];
        delete data.my.imn;
        return mo;
      },
      outputStrings: {
        text: {
          en: 'East Monitors',
          de: 'Östliche Bildschirme',
          ja: '検知左',
          cn: '左 (西) 小电视',
          ko: '모니터: 동쪽❱❱❱',
        },
        m1: {
          en: '④ North / ❰❰❰❰Monitor',
          ko: '④ 위 / ❰❰❰❰모니터',
        },
        m2: {
          en: 'Ⓓ North / 🡹🡹Monitor',
          ko: 'Ⓓ 위 / 🡹🡹모니터',
        },
        m3: {
          en: 'Ⓓ South / 🡻🡻Monitor',
          ko: 'Ⓓ 아래 / 🡻🡻모니터',
        },
        o1: {
          en: 'Ⓐ 🡼',
          ko: 'Ⓐ 🡼',
        },
        o2: {
          en: 'Boss ❱❱❱❱',
          ko: '보스 ❱❱❱❱',
        },
        o3: {
          en: 'Ⓑ 🡺',
          ko: 'Ⓑ 🡺',
        },
        o4: {
          en: 'Ⓒ 🡼',
          ko: 'Ⓒ 🡼',
        },
        o5: {
          en: '③ 🡻',
          ko: '③ 🡻',
        },
      },
    },
    {
      id: 'TOP Oversampled Wave Cannon West',
      type: 'StartsUsing',
      netRegex: { id: '7B6C', source: 'Omega', capture: false },
      delaySeconds: 1.2,
      durationSeconds: 8,
      alertText: (data, _matches, output) => {
        if (!data.my?.imn)
          return output.text!();
        const mo = {
          21: output.m1!(),
          22: output.m2!(),
          23: output.m3!(),
          11: output.o1!(),
          12: output.o2!(),
          13: output.o3!(),
          14: output.o4!(),
          15: output.o5!(),
        }[data.my.imn];
        delete data.my.imn;
        return mo;
      },
      outputStrings: {
        text: {
          en: 'West Monitors',
          de: 'Westliche Bildschirme',
          ja: '検知右',
          cn: '右 (东) 小电视',
          ko: '모니터: ❰❰❰서쪽',
        },
        m1: {
          en: '① North / Monitor❱❱❱❱',
          ko: '① 위 / 모니터❱❱❱❱',
        },
        m2: {
          en: 'Ⓑ North / 🡹🡹Monitor',
          ko: 'Ⓑ 위 / 🡹🡹모니터',
        },
        m3: {
          en: 'Ⓑ South / 🡻🡻Monitor',
          ko: 'Ⓑ 아래 / 🡻🡻모니터',
        },
        o1: {
          en: 'Ⓐ 🡽',
          ko: 'Ⓐ 🡽',
        },
        o2: {
          en: '❰❰❰❰ Boss',
          ko: '❰❰❰❰ 보스',
        },
        o3: {
          en: 'Ⓓ 🡸',
          ko: 'Ⓓ 🡸',
        },
        o4: {
          en: 'Ⓒ 🡽',
          ko: 'Ⓒ 🡽',
        },
        o5: {
          en: '② 🡻',
          ko: '② 🡻',
        },
      },
    },
    {
      id: 'TOP Oversampled Wave Cannon Loading',
      type: 'GainsEffect',
      // D7C = Oversampled Wave Cannon Loading (facing right)
      // D7D = Oversampled Wave Cannon Loading (facing left)
      netRegex: { effectId: ['D7C', 'D7D'] },
      preRun: (data, matches) => data.monitorPlayers.push(matches),
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          // TODO: should we get all of these player's positions,
          // assuming there's a N/S conga line?
          monitorOnYou: {
            en: 'Monitor (w/${player1}, ${player2})',
            de: 'Bildschirm (w/${player1}, ${player2})',
            ja: '検知 (${player1}, ${player2})',
            cn: '小电视点名 (与 ${player1}, ${player2})',
            ko: '내가 모니터 (${player1}, ${player2})',
          },
          unmarked: {
            en: 'Unmarked',
            de: 'Unmarkiert',
            ja: '無職',
            cn: '无点名',
            ko: '안붙었네',
          },
          monitorNum: {
            en: 'Monitor: ${num}',
            ko: '내가 모니터: ${num}번',
          },
          noMonitor: {
            en: 'Unmarked: ${num}번',
            ko: '안붙었네: ${num}번',
          },
        };

        if (data.monitorPlayers.length !== 3)
          return;

        if (data.members && data.my) {
          const ms = data.monitorPlayers.map((x) => getMemberByName(data, x.target));
          data.monitorPlayers = [];

          if (ms.includes(data.my)) {
            const mm = ms.sort((a, b) => a!.oc - b!.oc);
            for (let i = 0; i < mm.length; i++)
              mm[i]!.imn = i + 21;
            return { alertText: output.monitorNum!({ num: data.my.imn! - 20 }) };
          }

          const mn = data.members.filter((x) => !ms.includes(x));
          const mm = mn.sort((a, b) => a.oc - b.oc);
          for (let i = 0; i < mm.length; i++)
            mm[i]!.imn = i + 11;
          return { alertText: output.noMonitor!({ num: data.my.imn! - 10 }) };
        }

        const players = data.monitorPlayers.map((x) => x.target).sort();
        data.monitorPlayers = [];

        if (players.includes(data.me)) {
          const [p1, p2] = players.filter((x) => x !== data.me).map((x) => data.party.member(x));
          return { alertText: output.monitorOnYou!({ player1: p1, player2: p2 }) };
        }
        return { infoText: output.unmarked!() };
      },
    },
    {
      id: 'TOP Wave Cannon Stack Collector',
      type: 'Ability',
      netRegex: { id: '5779', source: 'Omega' },
      // Store full matches here in case somebody has a N/S priority system
      // they want to implement themselves in the stack trigger.
      run: (data, matches) => data.waveCannonStacks.push(matches),
    },
    {
      id: 'TOP Wave Cannon Stack',
      type: 'Ability',
      netRegex: { id: '5779', source: 'Omega', capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          stacks: {
            en: 'Stacks (${player1}, ${player2})',
            de: 'Sammeln (${player1}, ${player2})',
            ja: 'あたまわり (${player1}, ${player2})',
            cn: '分摊 (${player1}, ${player2})',
            ko: '뭉쳐요 (${player1}, ${player2})',
          },
          stackOnYou: {
            en: 'Stack on You (w/${player})',
            de: 'Auf DIR sammeln (w/${player})',
            ja: '自分にマーカー (${player})',
            cn: '分摊点名 (与 ${player})',
            ko: '내게 뭉쳐요 (${player})',
          },
        };
        const [m1, m2] = data.waveCannonStacks;
        if (data.waveCannonStacks.length !== 2 || m1 === undefined || m2 === undefined)
          return;

        const [p1, p2] = [m1.target, m2.target].sort();
        const onYou = p1 === data.me || p2 === data.me;
        if (onYou) {
          const otherPerson = p1 === data.me ? p2 : p1;
          if (data.members) {
            const m = getMemberByName(data, otherPerson!);
            if (m)
              return { alertText: output.stackOnYou!({ player: m.r }) };
          }
          return { alertText: output.stackOnYou!({ player: data.party.member(otherPerson) }) };
        }

        if (data.members) {
          const m1 = getMemberByName(data, p1!);
          const m2 = getMemberByName(data, p2!);
          if (m1 && m2)
            return { infoText: output.stacks!({ player1: m1.r, player2: m2.r }) };
        }
        return {
          infoText: output.stacks!({
            player1: data.party.member(p1),
            player2: data.party.member(p2),
          }),
        };
      },
      run: (data, _matches) => data.waveCannonStacks = [],
    },
    {
      id: 'TOP Delta Tethers',
      type: 'GainsEffect',
      // D70 Local Code Smell (red/green)
      // DB0 Remote Code Smell (blue)
      netRegex: { effectId: ['D70', 'DB0'] },
      preRun: (data, matches) => {
        data.deltaTethers[matches.target] = matches.effectId === 'D70' ? 'green' : 'blue';
      },
      infoText: (data, matches, output) => {
        if (matches.target !== data.me)
          return;
        if (matches.effectId === 'D70')
          return output.nearTether!();
        return output.farTether!();
      },
      outputStrings: {
        farTether: {
          en: 'Blue Tether',
          de: 'Blaue Verbindung',
          ja: '青線',
          cn: '蓝线',
          ko: '파란 줄 🡺 개똥벌레로',
        },
        nearTether: {
          en: 'Green Tether',
          de: 'Grüne Verbindung',
          ja: '緑線',
          cn: '绿线',
          ko: '초록 줄 🡺 파이널',
        },
      },
    },
    {
      id: 'TOP Swivel Cannon',
      // 7B95 Swivel Cannon Left-ish
      // 7B94 Swivel Cannon Right-ish
      // 9.7s cast
      type: 'StartsUsing',
      netRegex: { id: ['7B94', '7B95'], source: 'Omega' },
      condition: (data) => !data.simple,
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (_data, matches, output) => {
        const isLeft = matches.id === '7B95';
        // The eye is always clockwise to the beetle
        return isLeft ? output.awayFromEye!() : output.towardsEye!();
      },
      outputStrings: {
        awayFromEye: {
          en: 'Away from Eye',
          de: 'Weg vom Auge',
          ja: '目から離れる',
          cn: '远离眼睛',
          ko: '눈깔 반대쪽에서 처리',
        },
        towardsEye: {
          en: 'Towards Eye',
          de: 'Geh zu dem Auge',
          ja: '目に近づく',
          cn: '靠近眼睛',
          ko: '눈깔쪽에서 처리',
        },
      },
    },
    {
      id: 'TOP P5 Trio Debuff Collector',
      type: 'GainsEffect',
      netRegex: { effectId: ['D72', 'D73'] },
      run: (data, matches) => {
        // This is cleaned up on phase change.
        if (matches.effectId === 'D72')
          data.trioDebuff[matches.target] = 'near';
        if (matches.effectId === 'D73')
          data.trioDebuff[matches.target] = 'distant';
      },
    },
    {
      id: 'TOP P5 Delta Debuffs',
      type: 'Ability',
      // This is on the Oversampled Wave Cannon ability when there is roughly ~13s left on debuffs.
      netRegex: { id: '7B6D', capture: false },
      condition: (data) => data.phase === 'delta',
      durationSeconds: 8,
      suppressSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...nearDistantOutputStrings,
          unmarkedBlue: {
            // Probably near baits, but you never know.
            en: 'Unmarked Blue',
            de: 'Blau ohne Debuff',
            ja: 'デバフなしの青線',
            cn: '无点名蓝',
            ko: '할 일 없는 🥶파랑',
          },
        };

        const myDebuff = data.trioDebuff[data.me];
        if (myDebuff === 'near')
          return { alertText: output.near!() };
        if (myDebuff === 'distant')
          return { alertText: output.distant!() };

        const myColor = data.deltaTethers[data.me];
        if (myColor === undefined)
          return;

        // TODO: should we call anything out for greens here??
        if (myColor === 'blue')
          return { infoText: output.unmarkedBlue!() };
      },
    },
    {
      id: 'TOP Sigma Omega-M Location',
      // Same NPC that casts Sigma Version teleports to card/intercard
      type: 'Ability',
      netRegex: { id: '8014', source: 'Omega-M' },
      condition: (data) => !data.simple,
      delaySeconds: 5.4,
      durationSeconds: 26, // Display until Discharger
      suppressSeconds: 1,
      promise: async (data, matches) => {
        data.combatantData = [];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        const m = data.combatantData.pop();
        if (m === undefined) {
          console.error(
            `Sigma Omega-M Location: missing m: ${JSON.stringify(data.combatantData)}`,
          );
          return;
        }
        // Calculate combatant position in an all 8 cards/intercards
        const matchedPositionTo8Dir = (combatant: PluginCombatantState) => {
          // Positions are moved up 100 and right 100
          const y = combatant.PosY - 100;
          const x = combatant.PosX - 100;

          // During Sigma, Omega-M teleports to one of the 8 cardinals + numerical
          // slop on a radius=20 circle.
          // N = (100, 80), E = (120, 100), S = (100, 120), W = (80, 100)
          // NE = (114.14, 85.86), SE = (114.14, 114.14), SW = (85.86, 114.14), NW = (85.86, 85.86)
          //
          // Map NW = 0, N = 1, ..., W = 7

          return Math.round(5 - 4 * Math.atan2(x, y) / Math.PI) % 8;
        };

        const dir = matchedPositionTo8Dir(m);
        const dirs: { [dir: number]: string } = {
          0: output.northwest!(),
          1: output.north!(),
          2: output.northeast!(),
          3: output.east!(),
          4: output.southeast!(),
          5: output.south!(),
          6: output.southwest!(),
          7: output.west!(),
        };
        return output.mLocation!({
          dir: dirs[dir] ?? output.unknown!(),
        });
      },
      outputStrings: {
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
        unknown: Outputs.unknown,
        mLocation: {
          en: '${dir} M',
          de: '${dir} M',
          ja: '${dir} 男',
          cn: '${dir} 男人',
          ko: '남자: ${dir}',
        },
      },
    },
    {
      id: 'TOP P5 Sigma Debuffs',
      type: 'Ability',
      // This is on the Storage Violation damage, with roughly ~24s on debuffs.
      netRegex: { id: '7B04', capture: false },
      condition: (data) => data.phase === 'sigma',
      durationSeconds: (data) => data.trioDebuff[data.me] === undefined ? 5 : 16,
      suppressSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...nearDistantOutputStrings,
          noDebuff: {
            en: '(no debuff)',
            de: '(kein Debuff)',
            ja: '(デバフなし)',
            cn: '(无 Debuff)',
            ko: '(디버프 없음)',
          },
        };

        const myDebuff = data.trioDebuff[data.me];
        if (myDebuff === 'near')
          return { alertText: output.near!() };
        if (myDebuff === 'distant')
          return { alertText: output.distant!() };
        if (!data.simple)
          return { infoText: output.noDebuff!() };
      },
    },
    {
      id: 'TOP Sigma Superliminal/Blizzard',
      // Omega-M casts Superliminal/Blizzard
      // Track from Discharger (7B2E)
      type: 'Ability',
      netRegex: { id: '7B2E', source: 'Omega-M' },
      // TODO: temporarily disabled as it is returning inconsistent results even with longer delay.
      // See: https://github.com/quisquous/cactbot/issues/5335
      condition: (data) => false && data.phase === 'sigma',
      delaySeconds: 6.2,
      suppressSeconds: 1,
      promise: async (data, matches) => {
        data.combatantData = [];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        const f = data.combatantData.pop();
        if (f === undefined) {
          console.error(
            `Sigma Superliminal/Blizzard: missing f: ${JSON.stringify(data.combatantData)}`,
          );
          return;
        }
        if (f.WeaponId === 4)
          return output.superliminalSteel!();
        return output.optimizedBlizzard!();
      },
      outputStrings: {
        superliminalSteel: {
          en: 'Follow Laser, Move In',
          de: 'Laser folgen, rein gehen',
          ja: 'レーザー方面の中へ',
          cn: '跟随激光，穿进辣翅',
          ko: '레이저 따라 바로 ㄱㄱ',
        },
        optimizedBlizzard: {
          en: 'Wait First',
          de: 'Zuerst warten',
          ja: 'まってから移動',
          cn: '先等十字',
          ko: '멈춰서 언니 발차기 보고 ㄱㄱ',
        },
      },
    },
    {
      id: 'TOP P5 Omega Debuffs',
      // First In Line: ~32s duration, ~12s left after 2nd dodge
      // Second In Line: ~50s duration, ~15s left after final bounce
      type: 'GainsEffect',
      netRegex: { effectId: ['D72', 'D73'] },
      condition: (data, matches) =>
        data.members === undefined && data.phase === 'omega' && matches.target === data.me,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) > 40 ? 35 : 20,
      durationSeconds: 8,
      alertText: (_data, matches, output) => {
        if (matches.effectId === 'D72')
          return output.near!();
        if (matches.effectId === 'D73')
          return output.distant!();
      },
      outputStrings: nearDistantOutputStrings,
    },
    {
      id: 'TOP P5 Omega Tether Detector',
      type: 'Tether',
      netRegex: { id: '0059', capture: false },
      condition: (data) => data.phase === 'omega',
      suppressSeconds: 30,
      run: (data) => data.seenOmegaTethers = true,
    },
    {
      id: 'TOP P5 Omega Tether Bait',
      type: 'GainsEffect',
      // Quickening Dynamis
      netRegex: { effectId: 'D74', count: '03' },
      condition: (data, matches) => {
        if (data.phase !== 'omega' || data.seenOmegaTethers)
          return false;
        return matches.target === data.me;
      },
      durationSeconds: 8,
      alarmText: (_data, _matches, output) => output.baitTethers!(),
      outputStrings: {
        baitTethers: {
          en: 'Bait Tethers',
          de: 'Verbindung ködern',
          ja: '線取り',
          cn: '接线',
          ko: '줄 채서 북으로!',
        },
      },
    },
    {
      id: 'TOP Omega Pre-Safe Spot',
      // The combatants appear around the start of this cast, but the WeaponIds
      // don't switch until ~2.7s after the ability goes off.
      type: 'Ability',
      netRegex: { id: '8015', source: 'Omega-M', capture: false },
      condition: (data) => !data.simple,
      delaySeconds: 4,
      durationSeconds: 5.5,
      suppressSeconds: 1,
      promise: async (data) => {
        data.combatantData = [];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
        })).combatants;
        // Sort highest ID to lowest ID
        const sortCombatants = (a: PluginCombatantState, b: PluginCombatantState) =>
          (b.ID ?? 0) - (a.ID ?? 0);
        data.combatantData = data.combatantData.sort(sortCombatants);
      },
      infoText: (data, _matches, output) => {
        // The higher id is first set
        const omegaMNPCId = 15721;
        const omegaFNPCId = 15722;
        const findOmegaF = (combatant: PluginCombatantState) => combatant.BNpcID === omegaFNPCId;
        const findOmegaM = (combatant: PluginCombatantState) => combatant.BNpcID === omegaMNPCId;

        const f = data.combatantData.filter(findOmegaF).shift();
        const m = data.combatantData.filter(findOmegaM).shift();

        if (f === undefined || m === undefined) {
          console.error(`Omega Safe Spots: missing m/f: ${JSON.stringify(data.combatantData)}`);
          return;
        }

        const isFIn = f.WeaponId === 4;
        const isMIn = m.WeaponId === 4;

        // The combatants only spawn in these intercards:
        // 92.93, 92.93 (NW)      107.07, 92.93 (NE)
        // 92.93, 107.07 (SW)     107.07, 107.07 (SE)
        // They will either spawn NW/SE first or NE/SW
        // Boss cleave is unknown at this time, so call both sides
        const pos1 = (!isMIn && isFIn) ? f.PosY : m.PosY;
        const pos2 = (!isMIn && isFIn) ? f.PosX : m.PosX;
        const northSouthDir = pos1 < 100 ? output.dirN!() : output.dirS!();
        const eastWestDir = pos2 < 100 ? output.dirW!() : output.dirE!();

        if (isFIn) {
          if (isMIn)
            return output.legsShield!({ northSouth: northSouthDir, eastWest: eastWestDir });
          return output.legsSword!({ northSouth: northSouthDir, eastWest: eastWestDir });
        }
        if (isMIn)
          return output.staffShield!({ northSouth: northSouthDir, eastWest: eastWestDir });

        const staffSwordFar = output.staffSwordFar!({
          northSouth: northSouthDir,
          eastWest: eastWestDir,
        });
        const eastWestSwordStaffDir = staffSwordMidHelper(true, f.PosX, f.PosY, output);
        const northSouthSwordStaffDir = staffSwordMidHelper(false, f.PosX, f.PosY, output);
        const staffSwordMid = output.staffSwordMid!({
          northSouth: northSouthSwordStaffDir,
          eastWest: eastWestSwordStaffDir,
        });
        return output.staffSwordCombo!({ farText: staffSwordFar, midText: staffSwordMid });
      },
      outputStrings: {
        legsSword: {
          en: 'Close ${northSouth} or ${eastWest}',
          de: 'Nahe ${northSouth} oder ${eastWest}',
          ja: '内 ${northSouth}/${eastWest}',
          cn: '靠近 ${northSouth} 或 ${eastWest}',
          ko: '가까운 ${northSouth}${eastWest}',
        },
        legsShield: {
          en: 'Close ${northSouth} or ${eastWest}',
          de: 'Nahe ${northSouth} oder ${eastWest}',
          ja: '内 ${northSouth}/${eastWest}',
          cn: '靠近 ${northSouth} 或 ${eastWest}',
          ko: '가까운 ${northSouth}${eastWest}',
        },
        staffShield: {
          en: 'In ${northSouth} or ${eastWest}',
          de: 'Rein ${northSouth} oder ${eastWest}',
          ja: '外 ${northSouth}/${eastWest}',
          cn: '进 ${northSouth} 或 ${eastWest}',
          ko: '안쪽 ${northSouth}${eastWest}',
        },
        staffSwordCombo: {
          en: '${farText} / ${midText}',
        },
        staffSwordFar: {
          en: 'Far ${northSouth} or ${eastWest}',
          de: 'Entfernt von ${northSouth} oder ${eastWest}',
          ja: '遠 ${northSouth}/${eastWest}',
          cn: '远 ${northSouth} 或 ${eastWest}',
          ko: '멀리 ${northSouth}${eastWest}',
        },
        staffSwordMid: {
          en: 'Mid ${northSouth} or ${eastWest}',
          de: 'Mittig ${northSouth} oder ${eastWest}',
          ja: '外 ${northSouth}/${eastWest}',
          cn: '中 ${northSouth} 或 ${eastWest}',
          ko: '중간 ${northSouth}${eastWest}',
        },
        dirN: Outputs.arrowN,
        dirE: Outputs.arrowE,
        dirS: Outputs.arrowS,
        dirW: Outputs.arrowW,
        dirNNW: Outputs.cnum4,
        dirNNE: Outputs.cnum1,
        dirENE: Outputs.cnum1,
        dirESE: Outputs.cnum2,
        dirSSE: Outputs.cnum2,
        dirSSW: Outputs.cnum3,
        dirWSW: Outputs.cnum4,
        dirWNW: Outputs.cnum5,
      },
    },
    {
      id: 'TOP Omega Safe Spots',
      // 7B9B Diffuse Wave Cannon (North/South), is followed up with 7B78
      // 7B9C Diffuse Wave Cannon (East/West), is followed up with 7B77
      type: 'StartsUsing',
      netRegex: { id: ['7B9B', '7B9C'], source: 'Omega' },
      condition: (data) => !data.simple,
      durationSeconds: (_data, matches) => parseFloat(matches.castTime),
      alertText: (data, matches, output) => {
        // The higher id is first set
        const omegaMNPCId = 15721;
        const omegaFNPCId = 15722;
        const findOmegaF = (combatant: PluginCombatantState) => combatant.BNpcID === omegaFNPCId;
        const findOmegaM = (combatant: PluginCombatantState) => combatant.BNpcID === omegaMNPCId;

        const [f1, f2] = data.combatantData.filter(findOmegaF);
        const [m1, m2] = data.combatantData.filter(findOmegaM);

        if (f1 === undefined || f2 === undefined || m1 === undefined || m2 === undefined) {
          console.error(`Omega Safe Spots: missing m/f: ${JSON.stringify(data.combatantData)}`);
          return;
        }

        const isF1In = f1.WeaponId === 4;
        const isF2In = f2.WeaponId === 4;
        const isM1In = m1.WeaponId === 4;
        const isM2In = m2.WeaponId === 4;
        const isFirstEastWest = matches.id === '7B9B';
        const isSecondEastWest = !isFirstEastWest;

        let pos1: number;
        let pos2: number;
        if (data.triggerSetConfig.staffSwordDodge === 'far') {
          if (isFirstEastWest) {
            // Dodge by Omega-M for everything except sword + legs.
            pos1 = (!isM1In && isF1In) ? f1.PosX : m1.PosX;
            pos2 = (!isM2In && isF2In) ? f2.PosY : m2.PosY;
          } else {
            pos1 = (!isM1In && isF1In) ? f1.PosY : m1.PosY;
            pos2 = (!isM2In && isF2In) ? f2.PosX : m2.PosX;
          }
        } else {
          if (isFirstEastWest) {
            // Dodge by Omega-F for sword and Omega-M for shield.
            pos1 = !isM1In ? f1.PosX : m1.PosX;
            pos2 = !isM2In ? f2.PosY : m2.PosY;
          } else {
            pos1 = !isM1In ? f1.PosY : m1.PosY;
            pos2 = !isM2In ? f2.PosX : m2.PosX;
          }
        }

        // The combatants only spawn in these intercards:
        // 92.93, 92.93 (NW)      107.07, 92.93 (NE)
        // 92.93, 107.07 (SW)     107.07, 107.07 (SE)
        // They will either spawn NW/SE first or NE/SW
        // Boss cleave tells if it is actually east/west or north/south
        let dir1: string;
        let dir2: string;
        let rotate: NonNullable<typeof data.omegaDodgeRotation>;

        if (isFirstEastWest) {
          dir1 = pos1 < 100 ? output.dirW!() : output.dirE!();
          dir2 = pos2 < 100 ? output.dirN!() : output.dirS!();
          const isLeftRotation = pos1 < 100 && pos2 < 100 || pos1 > 100 && pos2 > 100;
          rotate = isLeftRotation ? 'left' : 'right';
        } else {
          dir1 = pos1 < 100 ? output.dirN!() : output.dirS!();
          dir2 = pos2 < 100 ? output.dirW!() : output.dirE!();
          const isRightRotation = pos1 < 100 && pos2 < 100 || pos1 > 100 && pos2 > 100;
          rotate = isRightRotation ? 'right' : 'left';
        }
        data.omegaDodgeRotation = rotate;

        let firstSpot;
        if (isF1In) {
          if (isM1In)
            firstSpot = output.legsShield!({ dir: dir1 });
          else
            firstSpot = output.legsSword!({ dir: dir1 });
        } else {
          if (isM1In) {
            firstSpot = output.staffShield!({ dir: dir1 });
          } else if (data.triggerSetConfig.staffSwordDodge === 'far') {
            firstSpot = output.staffSwordFar!({ dir: dir1 });
          } else {
            const staffMidDir1 = staffSwordMidHelper(isFirstEastWest, f1.PosX, f1.PosY, output);
            firstSpot = output.staffSwordMid!({ dir: staffMidDir1 });
          }
        }

        let secondSpot;
        if (isF2In) {
          if (isM2In)
            secondSpot = output.legsShield!({ dir: dir2 });
          else
            secondSpot = output.legsSword!({ dir: dir2 });
        } else {
          if (isM2In) {
            secondSpot = output.staffShield!({ dir: dir2 });
          } else if (data.triggerSetConfig.staffSwordDodge === 'far') {
            secondSpot = output.staffSwordFar!({ dir: dir2 });
          } else {
            const staffMidDir2 = staffSwordMidHelper(isSecondEastWest, f2.PosX, f2.PosY, output);
            secondSpot = output.staffSwordMid!({ dir: staffMidDir2 });
          }
        }

        const rotateStr = rotate === 'right' ? output.rotateRight!() : output.rotateLeft!();
        return output.safeSpots!({ first: firstSpot, rotate: rotateStr, second: secondSpot });
      },
      outputStrings: {
        safeSpots: {
          en: '${first} => ${rotate} => ${second}',
          de: '${first} => ${rotate} => ${second}',
          ja: '${first} => ${rotate} => ${second}',
          cn: '${first} => ${rotate} => ${second}',
          ko: '${first} 🔜 ${rotate} 🔜 ${second}',
        },
        rotateRight: {
          en: 'Right',
          de: 'Rechts',
          ja: '右',
          cn: '右',
          ko: '오른쪽',
        },
        rotateLeft: {
          en: 'Left',
          de: 'Links',
          ja: '左',
          cn: '左',
          ko: '왼쪽',
        },
        // The two legs are split in case somebody wants a "go to M" or "go to F" style call.
        legsSword: {
          en: 'Close ${dir}',
          de: 'Nahe ${dir}',
          ja: '内 ${dir}',
          cn: '靠近 ${dir}',
          ko: '가까운 ${dir}',
        },
        legsShield: {
          en: 'Close ${dir}',
          de: 'Nahe ${dir}',
          ja: '内 ${dir}',
          cn: '靠近 ${dir}',
          ko: '가까운 ${dir}',
        },
        staffShield: {
          en: 'Mid ${dir}',
          de: 'Mittig ${dir}',
          ja: '外 ${dir}',
          cn: '中 ${dir}',
          ko: '중간 ${dir}',
        },
        staffSwordCombo: {
          en: '${farText} / ${midText}',
        },
        staffSwordFar: {
          en: 'Far ${dir}',
          de: 'Entfernt von ${dir}',
          ja: '遠 ${dir}',
          cn: '远 ${dir}',
          ko: '멀리 ${dir}',
        },
        staffSwordMid: {
          en: 'Mid ${dir}',
          de: 'Mittig ${dir}',
          ja: '外 ${dir}',
          cn: '中 ${dir}',
          ko: '중간 ${dir}',
        },
        staffSwordSimple: {
          en: '${text}',
        },
        dirN: Outputs.arrowN,
        dirE: Outputs.arrowE,
        dirS: Outputs.arrowS,
        dirW: Outputs.arrowW,
        dirNNW: '④-Ⓐ',
        dirNNE: 'Ⓐ-①',
        dirENE: '①-Ⓑ',
        dirESE: 'Ⓑ-②',
        dirSSE: '②-Ⓒ',
        dirSSW: 'Ⓒ-③',
        dirWSW: '③-Ⓓ',
        dirWNW: 'Ⓓ-④',
      },
    },
    {
      id: 'TOP Omega Safe Spot 2 Reminder',
      // 7B9B Diffuse Wave Cannon (North/South), is followed up with 7B78
      // 7B9C Diffuse Wave Cannon (East/West), is followed up with 7B77
      type: 'StartsUsing',
      netRegex: { id: ['7B9B', '7B9C'], source: 'Omega' },
      condition: (data) => !data.simple,
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      alertText: (data, matches, output) => {
        // The lower id is second set
        const omegaMNPCId = 15721;
        const omegaFNPCId = 15722;
        const findOmegaF = (combatant: PluginCombatantState) => combatant.BNpcID === omegaFNPCId;
        const findOmegaM = (combatant: PluginCombatantState) => combatant.BNpcID === omegaMNPCId;

        const f = data.combatantData.filter(findOmegaF).pop();
        const m = data.combatantData.filter(findOmegaM).pop();

        if (f === undefined || m === undefined) {
          console.error(
            `Omega Safe Spot 2 Reminder: missing m/f: ${JSON.stringify(data.combatantData)}`,
          );
          return;
        }

        const isFIn = f.WeaponId === 4;
        const isMIn = m.WeaponId === 4;
        const isFirstEastWest = matches.id === '7B9B';
        const isSecondEastWest = !isFirstEastWest;

        // The combatants only spawn in these intercards:
        // 92.93, 92.93 (NW)      107.07, 92.93 (NE)
        // 92.93, 107.07 (SW)     107.07, 107.07 (SE)
        // They will either spawn NW/SE first or NE/SW
        // Boss cleave tells if it is actually east/west or north/south
        let dir1;
        if (isSecondEastWest) {
          // East or West Safe, look for male side
          // Check for Sword/Shield to know if to go to Male or Female
          const pos = (!isMIn && isFIn) ? f.PosX : m.PosX;
          dir1 = pos < 100 ? output.dirW!() : output.dirE!();
        } else {
          // North or South Safe
          const pos = (!isMIn && isFIn) ? f.PosY : m.PosY;
          dir1 = pos < 100 ? output.dirN!() : output.dirS!();
        }

        if (isFIn) {
          if (isMIn)
            return output.legsShield!({ dir: dir1 });
          return output.legsSword!({ dir: dir1 });
        }
        if (isMIn)
          return output.staffShield!({ dir: dir1 });

        if (data.simple)
          return output.staffSwordSimple!({ text: output.staffSwordFar!({ dir: dir1 }) });

        const staffMidDir1 = staffSwordMidHelper(isSecondEastWest, f.PosX, f.PosY, output);
        return output.staffSwordCombo!({
          farText: output.staffSwordFar!({ dir: dir1 }),
          midText: output.staffSwordMid!({ dir: staffMidDir1 }),
        });
      },
      outputStrings: {
        legsSword: {
          en: 'Close ${dir}',
          ko: '가까운 ${dir}',
        },
        legsShield: {
          en: 'Close ${dir}',
          ko: '가까운 ${dir}',
        },
        staffShield: {
          en: 'Mid ${dir}',
          ko: '중간 ${dir}',
        },
        staffSwordCombo: {
          en: '${farText} / ${midText}',
        },
        staffSwordFar: {
          en: 'Far ${dir}',
          ko: '멀리 ${dir}',
        },
        staffSwordMid: {
          en: 'Mid ${dir}',
          ko: '중간 ${dir}',
        },
        staffSwordSimple: {
          en: '${text}',
        },
        dirN: Outputs.arrowN,
        dirE: Outputs.arrowE,
        dirS: Outputs.arrowS,
        dirW: Outputs.arrowW,
        dirNNW: '④-Ⓐ',
        dirNNE: 'Ⓐ-①',
        dirENE: '①-Ⓑ',
        dirESE: 'Ⓑ-②',
        dirSSE: '②-Ⓒ',
        dirSSW: 'Ⓒ-③',
        dirWSW: '③-Ⓓ',
        dirWNW: 'Ⓓ-④',
      },
    },
    {
      id: 'TOP P6 Cosmo Memory',
      type: 'StartsUsing',
      netRegex: { id: '7BA1', source: 'Alpha Omega', capture: false },
      condition: (data) => data.role === 'tank',
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'TANK LB!!',
          de: 'TANK LB!!',
          fr: 'LB TANK !!',
          ja: 'タンクLB!!',
          cn: '坦克LB！！',
          ko: '탱크 LB!!',
        },
      },
    },
    {
      id: 'TOP Cosmo Arrow In/Out Collect',
      type: 'StartsUsing',
      // Sometimes cast by Omega, sometimes by Alpha Omega
      netRegex: { id: '7BA3', capture: false },
      run: (data) => {
        // This will overcount but get reset after
        data.cosmoArrowCount = data.cosmoArrowCount + 1;
      },
    },
    {
      id: 'TOP Cosmo Arrow In/Out First',
      type: 'StartsUsing',
      // Sometimes cast by Omega, sometimes by Alpha Omega
      netRegex: { id: '7BA3', capture: false },
      delaySeconds: 0.1,
      durationSeconds: 7,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        data.cosmoArrowExaCount = 1;
        if (data.cosmoArrowCount === 2) {
          data.cosmoArrowIn = true;
          return output.inFirst!();
        }
        data.cosmoArrowIn = false;
        return output.outFirst!();
      },
      outputStrings: {
        inFirst: {
          en: 'In First',
          de: 'Zuerst rein',
          ja: '内側から',
          cn: '先进',
          ko: '먼저 안으로',
        },
        outFirst: {
          en: 'Out First',
          de: 'Zuerst raus',
          ja: '外側から',
          cn: '先出',
          ko: '먼저 밖으로',
        },
      },
    },
    {
      id: 'TOP Cosmo Arrow In/Out Wait',
      type: 'Ability',
      // Sometimes cast by Omega, sometimes by Alpha Omega
      netRegex: { id: '7BA3', capture: false },
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.cosmoArrowIn)
          return output.inWait2!();
        return output.outWait2!();
      },
      outputStrings: {
        inWait2: {
          en: 'In => Wait 2',
          de: 'Rein => Warte 2',
          ja: '内 => 待機 2',
          cn: '进 => 等 2',
          ko: '안으로 🔜 두번 기둘',
        },
        outWait2: {
          en: 'Out => Wait 2',
          de: 'Raus => Warte 2',
          ja: '外 => 待機 2',
          cn: '出 => 等 2',
          ko: '밖으로 🔜 두번 기둘',
        },
      },
    },
    {
      id: 'TOP Cosmo Arrow Dodges',
      type: 'Ability',
      netRegex: { id: '7BA4', source: 'Alpha Omega', capture: false },
      preRun: (data) => data.cosmoArrowExaCount = data.cosmoArrowExaCount + 1,
      durationSeconds: (data) => {
        if (data.cosmoArrowExaCount === 3 && data.cosmoArrowIn)
          return 5;
        return 3;
      },
      suppressSeconds: 1, // Only capture 1 in the set of casts
      infoText: (data, _matches, output) => {
        if (data.cosmoArrowIn) {
          switch (data.cosmoArrowExaCount) {
            case 3:
              return output.outWait2!();
            case 5:
              return output.SidesIn!();
            case 6:
              return output.in!();
          }
          // No callout
          return;
        }

        switch (data.cosmoArrowExaCount) {
          case 3:
          case 5:
            return output.in!();
          case 4:
            return output.SidesOut!();
        }
      },
      run: (data) => {
        if (data.cosmoArrowExaCount === 7) {
          data.cosmoArrowExaCount = 0;
          data.cosmoArrowCount = 0;
        }
      },
      outputStrings: {
        in: Outputs.in,
        inWait2: {
          en: 'In => Wait 2',
          de: 'Rein => Warte 2',
          ja: '内 => 待機 2',
          cn: '进 => 等 2',
          ko: '안으로 🔜 두번 기둘',
        },
        outWait2: {
          en: 'Out => Wait 2',
          de: 'Raus => Warte 2',
          ja: '外 => 待機 2',
          cn: '出 => 等 2',
          ko: '밖으로 🔜 두번 기둘',
        },
        SidesIn: Outputs.moveAway,
        SidesOut: {
          en: 'Sides + Out',
          de: 'Seien + Raus',
          ja: '横 + 外へ',
          cn: '两侧 + 出',
          ko: '옆으로 + 밖으로',
        },
      },
    },
    {
      id: 'TOP Cosmo Dive',
      type: 'StartsUsing',
      netRegex: { id: '7BA6', source: 'Alpha Omega', capture: false },
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank')
          return output.cosmoDiveTank!();
        return output.cosmoDiveParty!();
      },
      outputStrings: {
        // Yes, these are also tankbusters, but mit is so tight in this phase
        // that everybody needs to know that already, and so just call positioning.
        cosmoDiveTank: {
          en: 'Tanks Near (party far)',
          de: 'Tanks nahe (Gruppe entfernt)',
          ja: 'タンク内側 (パーティー離れる)',
          cn: '坦克靠近 (人群远离)',
          ko: '탱크 안으로 (파티는 밖으로)',
        },
        cosmoDiveParty: {
          en: 'Party Far (tanks near)',
          de: 'Gruppe entfernt (Tanks nahe)',
          ja: 'パーティー離れる (タンク内側)',
          cn: '人群远离 (坦克靠近)',
          ko: '파티 밖으로 (탱크가 안으로)',
        },
      },
    },
    {
      id: 'TOP Unlimited Wave Cannon',
      type: 'StartsUsing',
      netRegex: { id: '7BAC', source: 'Alpha Omega', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Middle',
          de: 'Mitte ködern',
          ja: '真ん中',
          cn: '中间诱导',
          ko: '한가운데로 유도',
        },
      },
    },
    {
      id: 'TOP Unlimited Wave Cannon Collect',
      // Invisible NPCs cast Wave Cannon from starting position of the Exaflares
      // Data from ACT can be innacurate, use OverlayPlugin
      // These casts start 1 second after each other
      type: 'StartsUsing',
      netRegex: { id: '7BAD', source: 'Alpha Omega' },
      run: (data, matches) => {
        // Cleanup collector if second set
        if (data.waveCannonFlares.length === 4)
          data.waveCannonFlares = [];
        data.waveCannonFlares.push(parseInt(matches.sourceId, 16));
      },
    },
    {
      id: 'TOP Unlimited Wave Cannon Dodges',
      // As low as 1.2s delay works consistently on low latency, but 1.5s works for more players
      type: 'StartsUsing',
      netRegex: { id: '7BAC', source: 'Alpha Omega', capture: false },
      delaySeconds: 1.5,
      durationSeconds: 10.6, // Time until 3rd puddle
      promise: async (data) => {
        if (data.waveCannonFlares.length < 2) {
          console.error(
            `TOP Unlimited Wave Cannon Dodge: Expected at least 2 casts, Got: ${
              JSON.stringify(data.waveCannonFlares.length)
            }`,
          );
        }
        data.combatantData = [];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [...data.waveCannonFlares],
        })).combatants;
      },
      infoText: (data, _matches, output) => {
        if (data.combatantData.length < 2) {
          console.error(
            `TOP Unlimited Wave Cannon Dodge: Expected at least 2 Wave Cannons, Got: ${
              JSON.stringify(data.combatantData)
            }`,
          );
          return;
        }
        const firstWaveCannon =
          data.combatantData.filter((combatant) => combatant.ID === data.waveCannonFlares[0])[0];
        const secondWaveCannon =
          data.combatantData.filter((combatant) => combatant.ID === data.waveCannonFlares[1])[0];

        if (firstWaveCannon === undefined || secondWaveCannon === undefined) {
          console.error(
            `TOP Unlimited Wave Cannon Dodge: Failed to retreive combatant Data: ${
              JSON.stringify(data.combatantData)
            }`,
          );
          return;
        }

        // Collect Exaflare position
        const first = [firstWaveCannon.PosX - 100, firstWaveCannon.PosY - 100];
        const second = [secondWaveCannon.PosX - 100, secondWaveCannon.PosY - 100];
        if (
          first[0] === undefined || first[1] === undefined ||
          second[0] === undefined || second[1] === undefined
        ) {
          console.error(`TOP Unlimited Wave Cannon Dodge: missing coordinates`);
          return;
        }

        // Compute atan2 of determinant and dot product to get rotational direction
        // Note: X and Y are flipped due to Y axis being reversed
        const getRotation = (x1: number, y1: number, x2: number, y2: number) => {
          return Math.atan2(y1 * x2 - x1 * y2, y1 * y2 + x1 * x2);
        };

        // Get rotation of first and second exaflares
        const rotation = getRotation(first[0], first[1], second[0], second[1]);

        // Get location to dodge to by looking at first exaflare position
        // Calculate combatant position in an all 8 cards/intercards
        const matchedPositionTo8Dir = (combatant: PluginCombatantState) => {
          // Positions are moved up 100 and right 100
          const y = combatant.PosY - 100;
          const x = combatant.PosX - 100;

          // During Unlimited Wave Cannon, 4 Wave Cannons spawn in order around the map
          // N = (100, 76), E = (124, 100), S = (100, 124), W = (76, 100)
          // NE = (116.97, 83.03), SE = (116.97, 116.97), SW = (83.03, 116.97), NW = (83.03, 83.03)
          //
          // Map NW = 0, N = 1, ..., W = 7

          return Math.round(5 - 4 * Math.atan2(x, y) / Math.PI) % 8;
        };

        const dir = matchedPositionTo8Dir(firstWaveCannon);
        const dirs: { [dir: number]: string } = {
          0: output.northwest!(),
          1: output.north!(),
          2: output.northeast!(),
          3: output.east!(),
          4: output.southeast!(),
          5: output.south!(),
          6: output.southwest!(),
          7: output.west!(),
        };

        const startDir = rotation < 0 ? (dir - 1 + 8) % 8 : (dir + 1) % 8;
        const start = dirs[startDir] ?? output.unknown!();

        if (rotation < 0) {
          return output.directions!({
            start: start,
            rotation: output.clockwise!(),
          });
        }
        if (rotation > 0) {
          return output.directions!({
            start: start,
            rotation: output.counterclock!(),
          });
        }
      },
      outputStrings: {
        directions: {
          en: '${start} => ${rotation}',
          de: '${start} => ${rotation}',
          ja: '${start} => ${rotation}',
          cn: '${start} => ${rotation}',
          ko: '${start} 🔜 ${rotation}',
        },
        north: Outputs.north,
        northeast: Outputs.northeast,
        east: Outputs.east,
        southeast: Outputs.southeast,
        south: Outputs.south,
        southwest: Outputs.southwest,
        west: Outputs.west,
        northwest: Outputs.northwest,
        unknown: Outputs.unknown,
        clockwise: {
          en: 'Clockwise',
          de: 'Im Uhrzeigersinn',
          ja: '時計回り',
          cn: '顺时针',
          ko: '시계',
        },
        counterclock: {
          en: 'Counterclockwise',
          de: 'Gegen den Uhrzeigersinn',
          ja: '反時計回り',
          cn: '逆时针',
          ko: '반시계',
        },
      },
    },
    {
      id: 'TOP Wave Cannon Wild Charge',
      type: 'StartsUsing',
      netRegex: { id: '7BA9', source: 'Alpha Omega', capture: false },
      delaySeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Line Charge',
          de: 'Linien Ansturm',
          ja: '直線あたまわり',
          cn: '直线分摊',
          ko: '한줄로 뭉쳐요',
        },
      },
    },
    {
      id: 'TOP Cosmo Meteor',
      type: 'StartsUsing',
      netRegex: { id: '7BB0', source: 'Alpha Omega', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '한가운데로 유도',
          de: 'Mitte ködern',
          ja: '真ん中',
          cn: '中间诱导',
          ko: '한가운데로 유도',
        },
      },
    },
    {
      id: 'TOP P5 다이너미스 저장',
      type: 'GainsEffect',
      netRegex: { effectId: 'D74' },
      run: (data, matches) => {
        const mm = getMemberByName(data, matches.target);
        if (mm)
          mm.idyn = parseInt(matches.count);
      },
    },
    {
      id: 'TOP P5 시그마 런 듀나미스',
      type: 'StartsUsing',
      netRegex: { id: '8014', source: 'Omega-M', capture: false },
      condition: (data, _matches) => data.my?.idyn === 1,
      delaySeconds: 29,
      durationSeconds: 10,
      alarmText: (data, _matches, output) => {
        if (data.trioDebuff[data.me] === undefined) {
          data.lastmode = 1;
          return output.text!();
        }
        data.lastmode = undefined;
      },
      outputStrings: {
        text: {
          en: 'Number marker',
          ko: '숫자 마커 달아요',
        },
      },
    },
    {
      id: 'TOP P5 오메가 런 듀나미스 모니터 찾기',
      type: 'StartsUsing',
      netRegex: { id: '8015', source: 'Omega-M', capture: false },
      delaySeconds: 8.5,
      durationSeconds: 7,
      infoText: (data, _matches, output) => {
        if (!data.members)
          return;

        for (const m of data.members)
          m.imn = data.inLine[m.n];
        const mm = data.members.filter((x) => x.idyn === 2 && x.imn !== 1).map((x) => {
          return { p: x.imn === undefined ? 100 : 0 + x.idyn! * 10 + x.i, m: x.n };
        }).sort((a, b) => a.p - b.p);

        const ms = mm.map((x) => x.m);
        data.omegaMonitors = ms;

        if (ms.length === 0)
          return output.noTarget!();
        if (ms.length === 1)
          return output.onlyOne!({ target: data.party.jobAbbr(ms[0]) });
        return output.okTwo!({ t1: data.party.jobAbbr(ms[0]), t2: data.party.jobAbbr(ms[1]) });
      },
      outputStrings: {
        noTarget: {
          en: 'Monitor: No target?',
          ko: '검지: 대상자가 없네?',
        },
        onlyOne: {
          en: 'Monitor: ${target} (Alone?)',
          ko: '검지: ${target} (혼자?)',
        },
        okTwo: {
          en: 'Monitor: ${t1}, ${t2}',
          ko: '검지: ${t1}, ${t2}',
        },
      },
    },
    {
      id: 'TOP P5 오메가 런 듀나미스 나는 어디로',
      type: 'StartsUsing',
      netRegex: { id: '8015', source: 'Omega-M', capture: false },
      delaySeconds: 15.5,
      durationSeconds: 8,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...nearDistantOutputStrings,
          unknown: {
            en: '(Have check buff)',
            ko: '(버프 확인해야해요)',
          },
          stopMe: {
            en: 'Ignore marker!',
            ko: '금지 마커 달아요!',
          },
          attackMe: {
            en: 'Number marker!',
            ko: '숫자 마커 달아요!',
          },
        };

        data.lastmode = undefined;

        if (!data.members || !data.my)
          return;

        if (data.my.imn === 1) {
          const myDebuff = data.trioDebuff[data.me];
          if (myDebuff === 'near')
            return { infoText: output.near!() };
          if (myDebuff === 'distant')
            return { infoText: output.distant!() };
        }

        if (data.omegaMonitors) {
          const nth = data.omegaMonitors.indexOf(data.me);
          if (nth < 0 || nth >= 2) {
            data.lastmode = 1;
            return { alarmText: output.attackMe!() };
          }
          data.lastmode = 2;
          return { alarmText: output.stopMe!() };
        }

        return { infoText: output.unknown!() };
      },
    },
    {
      id: 'TOP P5 오메가 모니터',
      type: 'StartsUsing',
      // 6=오른쪽, 7=왼쪽
      netRegex: { id: ['7B96', '7B97'], source: 'Omega' },
      condition: (data, _matches) => data.members !== undefined && data.phase === 'omega',
      durationSeconds: 10,
      alertText: (data, matches, output) => {
        // 니어파 먼저 확인
        if (data.my?.imn === 1) {
          const myDebuff = data.trioDebuff[data.me];
          if (myDebuff === 'near')
            return matches.id === '7B96' ? output.nearL!() : output.nearR!();
          if (myDebuff === 'distant')
            return matches.id === '7B96' ? output.farL!() : output.farR!();
        }

        return matches.id === '7B96' ? output.monR!() : output.monL!();
      },
      outputStrings: {
        nearL: {
          en: '[Near world] ③🡿🡿🡿',
          ko: '[니어 월드] ③🡿🡿🡿',
        },
        nearR: {
          en: '[Near world] ②🡾🡾🡾',
          ko: '[니어 월드] ②🡾🡾🡾',
        },
        farL: {
          en: '[Distance world] ④🡼🡼🡼',
          ko: '[파 월드] ④🡼🡼🡼',
        },
        farR: {
          en: '[Distance world] ①🡽🡽🡽',
          ko: '[파 월드] ①🡽🡽🡽',
        },
        monL: {
          en: 'Monitor: 🡸🡸🡸',
          ko: '모니터: 🡸🡸🡸',
        },
        monR: {
          en: 'Monitor: 🡺🡺🡺',
          ko: '모니터: 🡺🡺🡺',
        },
      },
    },
    {
      id: 'TOP P5 오메가 마지막 나는 어디로',
      type: 'Ability',
      netRegex: { id: '7B6D', capture: false },
      condition: (data) => data.phase === 'omega',
      delaySeconds: 2,
      durationSeconds: 8,
      suppressSeconds: 5,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          ...nearDistantOutputStrings,
          attackMe: {
            en: '숫자 마커 달아요!',
            ko: 'Number marker!',
          },
          tether: {
            en: '줄 채서 북으로!',
            ko: 'Get tether to North!',
          },
          mesg: {
            en: '2: Spread, 3: Tether, Else WHAT??',
            ko: '2: 흩어지고, 3: 줄채고, 아니면 응??',
          },
        };

        data.lastmode = undefined;

        if (data.my) {
          if (data.my.imn === 2) {
            const myDebuff = data.trioDebuff[data.me];
            if (myDebuff === 'near')
              return { alertText: output.near!() };
            if (myDebuff === 'distant')
              return { alertText: output.distant!() };
          }

          if (data.my.idyn === 1 || data.my.idyn === 2) {
            data.lastmode = 1;
            return { alarmText: output.attackMe!() };
          }
          if (data.my.idyn === 3) {
            // 위에서 한번 alarm으로 출력하기 땜시 여기선 그냥 info
            return { infoText: output.tether!() };
          }
        }

        return { infoText: output.mesg!() };
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Alpha Omega': 'Alpha-Omega',
        'Cosmo Meteor': 'Kosmosmeteor',
        '(?<!Alpha )Omega(?!-)': 'Omega',
        'Omega-F': 'Omega-W',
        'Omega-M': 'Omega-M',
        'Optical Unit': 'Optikmodul',
        'Rear Power Unit': 'hinter(?:e|er|es|en) Antriebseinheit',
        'Left Arm Unit': 'link(?:e|er|es|en) Arm',
        'Right Arm Unit': 'recht(?:e|er|es|en) Arm',
        'Rocket Punch': 'Raketenschlag',
      },
      'replaceText': {
        'Archive Peripheral': 'Archiv-Peripherie',
        'Atomic Ray': 'Atomstrahlung',
        'Beyond Defense': 'Schildkombo S',
        'Beyond Strength': 'Schildkombo G',
        'Blaster': 'Blaster',
        'Blind Faith': 'Blindes Vertrauen',
        'Colossal Blow': 'Kolossaler Hieb',
        'Condensed Wave Cannon Kyrios': 'Hochleistungswellenkanone P',
        'Cosmo Arrow': 'Kosmospfeil',
        'Cosmo Dive': 'Kosmossturz',
        'Cosmo Memory': 'Kosmosspeicher',
        'Cosmo Meteor': 'Kosmosmeteor',
        'Critical Error': 'Schwerer Ausnahmefehler',
        'Diffuse Wave Cannon(?! Kyrios)': 'Streuende Wellenkanone',
        'Diffuse Wave Cannon Kyrios': 'Streuende Wellenkanone P',
        'Discharger': 'Entlader',
        'Efficient Bladework': 'Effiziente Klingenführung',
        'Explosion': 'Explosion',
        'Firewall': 'Sicherungssystem',
        'Flame Thrower': 'Flammensturm',
        'Flash Gale': 'Blitzwind',
        'Guided Missile Kyrios': 'Lenkrakete P',
        'Hello, Distant World': 'Hallo, Welt: Fern',
        'Hello, Near World': 'Hallo, Welt: Nah',
        'Hello, World': 'Hallo, Welt!',
        'High-powered Sniper Cannon': 'Wellengeschütz „Pfeil +”',
        'Hyper Pulse': 'Hyper-Impuls',
        'Ion Efflux': 'Ionenstrom',
        'Laser Shower': 'Laserschauer',
        'Latent Defect': 'Latenter Bug',
        'Left Arm Unit': 'link(?:e|er|es|en) Arm',
        'Limitless Synergy': 'Synergieprogramm LB',
        'Magic Number': 'Magische Zahl',
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
        'Peripheral Synthesis': 'Ausdruck',
        'Pile Pitch': 'Neigungsstoß',
        'Program Loop': 'Programmschleife',
        'Rear Lasers': 'Hintere Laser',
        'Right Arm Unit': 'recht(?:e|er|es|en) Arm',
        'Run: \\*\\*\\*\\*mi\\* \\(Delta Version\\)': 'Ausführen: XXXXmiX (Delta)',
        'Run: \\*\\*\\*\\*mi\\* \\(Omega Version\\)': 'Ausführen: XXXXmiX (Omega)',
        'Run: \\*\\*\\*\\*mi\\* \\(Sigma Version\\)': 'Ausführen: XXXXmiX (Sigma)',
        '(?<! )Sniper Cannon': 'Wellengeschütz „Pfeil”',
        'Solar Ray': 'Sonnenstrahl',
        'Spotlight': 'Scheinwerfer',
        'Storage Violation': 'Speicherverletzung S',
        'Subject Simulation F': 'Transformation W',
        'Superliminal Steel': 'Klingenkombo B',
        'Swivel Cannon': 'Rotierende Wellenkanone',
        'Synthetic Shield': 'Synthetischer Schild', // This is currently a mistranslated in German as 'Effiziente Klingenführung'
        'Unlimited Wave Cannon': 'Wellenkanone: Grenzwertüberschreitung',
        '(?<! )Wave Cannon(?! Kyrios)': 'Wellenkanone',
        '(?<! )Wave Cannon Kyrios': 'Wellenkanone P',
        'Wave Repeater': 'Schnellfeuer-Wellenkanone',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Alpha Omega': 'Alpha-Oméga',
        'Cosmo Meteor': 'Cosmométéore',
        '(?<!Alpha )Omega(?!-)': 'Oméga',
        'Omega-F': 'Oméga-F',
        'Omega-M': 'Oméga-M',
        'Optical Unit': 'unité optique',
        'Rear Power Unit': 'unité arrière',
        'Left Arm Unit': 'unité bras gauche',
        'Right Arm Unit': 'unité bras droit',
        'Rocket Punch': 'Astéropoing',
      },
      'replaceText': {
        'Archive Peripheral': 'Périphérique d\'archivage',
        'Atomic Ray': 'Rayon atomique',
        'Beyond Defense': 'Combo bouclier S',
        'Beyond Strength': 'Combo bouclier G',
        'Blaster': 'Électrochoc',
        'Blind Faith': 'Confiance aveugle',
        'Colossal Blow': 'Coup colossal',
        'Condensed Wave Cannon Kyrios': 'Canon plasma surchargé P',
        'Cosmo Arrow': 'Cosmoflèche',
        'Cosmo Dive': 'Cosmoplongeon',
        'Cosmo Memory': 'Cosmomémoire',
        'Cosmo Meteor': 'Cosmométéore',
        'Critical Error': 'Erreur critique',
        'Diffuse Wave Cannon(?! Kyrios)': 'Canon plasma diffuseur',
        'Diffuse Wave Cannon Kyrios': 'Canon plasma diffuseur P',
        'Discharger': 'Déchargeur',
        'Efficient Bladework': 'Lame active',
        'Explosion': 'Explosion',
        'Firewall': 'Programme protecteur',
        'Flame Thrower': 'Crache-flammes',
        'Flash Gale': 'Vent subit',
        'Guided Missile Kyrios': 'Missile guidé P',
        'Hello, Distant World': 'Bonjour, le monde : distance',
        'Hello, Near World': 'Bonjour, le monde : proximité',
        'Hello, World': 'Bonjour, le monde',
        'High-powered Sniper Cannon': 'Canon plasma longue portée surchargé',
        'Hyper Pulse': 'Hyperpulsion',
        'Ion Efflux': 'Fuite d\'ions',
        'Laser Shower': 'Pluie de lasers',
        'Latent Defect': 'Bogue latent',
        'Left Arm Unit': 'unité bras gauche',
        'Limitless Synergy': 'Programme synergique LB',
        'Magic Number': 'Nombre magique',
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
        'Peripheral Synthesis': 'Impression',
        'Pile Pitch': 'Lancement de pieu',
        'Program Loop': 'Boucle de programme',
        'Rear Lasers': 'Lasers arrière',
        'Right Arm Unit': 'unité bras droit',
        'Run: \\*\\*\\*\\*mi\\* \\(Delta Version\\)': 'Exécution : ****mi* Delta',
        'Run: \\*\\*\\*\\*mi\\* \\(Omega Version\\)': 'Exécution : ****mi* Oméga',
        'Run: \\*\\*\\*\\*mi\\* \\(Sigma Version\\)': 'Exécution : ****mi* Sigma',
        '(?<! )Sniper Cannon': 'Canon plasma longue portée',
        'Solar Ray': 'Rayon solaire',
        'Spotlight': 'Phare',
        'Storage Violation': 'Corruption de données S',
        'Subject Simulation F': 'Transformation F',
        'Superliminal Steel': 'Combo lame B',
        'Swivel Cannon': 'Canon plasma rotatif',
        'Synthetic Shield': 'Bouclier optionnel',
        'Unlimited Wave Cannon': 'Canon plasma : Dépassement de limites',
        '(?<! )Wave Cannon(?! Kyrios)': 'Canon plasma',
        '(?<! )Wave Cannon Kyrios': 'Canon plasma P',
        'Wave Repeater': 'Canon plasma automatique',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Alpha Omega': 'アルファオメガ',
        'Cosmo Meteor': 'コスモメテオ',
        '(?<!Alpha )Omega(?!-)': 'オメガ',
        'Omega-F': 'オメガF',
        'Omega-M': 'オメガM',
        'Optical Unit': 'オプチカルユニット',
        'Rear Power Unit': 'リアユニット',
        'Left Arm Unit': 'レフトアームユニット',
        'Right Arm Unit': 'ライトアームユニット',
        'Rocket Punch': 'ロケットパンチ',
      },
      'replaceText': {
        'Archive Peripheral': 'アーカイブアーム',
        'Atomic Ray': 'アトミックレイ',
        'Beyond Defense': 'シールドコンボS',
        'Beyond Strength': 'シールドコンボG',
        'Blaster': 'ブラスター',
        'Blind Faith': 'ブラインド・フェイス',
        'Colossal Blow': 'コロッサスブロー',
        'Condensed Wave Cannon Kyrios': '高出力波動砲P',
        'Cosmo Arrow': 'コスモアロー',
        'Cosmo Dive': 'コスモダイブ',
        'Cosmo Memory': 'コスモメモリー',
        'Cosmo Meteor': 'コスモメテオ',
        'Critical Error': 'クリティカルエラー',
        'Diffuse Wave Cannon(?! Kyrios)': '拡散波動砲',
        'Diffuse Wave Cannon Kyrios': '拡散波動砲P',
        'Discharger': 'ディスチャージャー',
        'Efficient Bladework': 'ソードアクション',
        'Explosion': '爆発',
        'Firewall': 'ガードプログラム',
        'Flame Thrower': '火炎放射',
        'Flash Gale': 'フラッシュウィンド',
        'Guided Missile Kyrios': '誘導ミサイルP',
        'Hello, Distant World': 'ハロー・ワールド：ファー',
        'Hello, Near World': 'ハロー・ワールド：ニア',
        'Hello, World': 'ハロー・ワールド',
        'High-powered Sniper Cannon': '狙撃式高出力波動砲',
        'Hyper Pulse': 'ハイパーパルス',
        'Ion Efflux': 'イオンエフラクス',
        'Laser Shower': 'レーザーシャワー',
        'Latent Defect': 'レイテントバグ',
        'Left Arm Unit': 'レフトアームユニット',
        'Limitless Synergy': '連携プログラムLB',
        'Magic Number': 'マジックナンバー',
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
        'Peripheral Synthesis': 'プリントアウト',
        'Pile Pitch': 'パイルピッチ',
        'Program Loop': 'サークルプログラム',
        'Rear Lasers': 'リアレーザー',
        'Right Arm Unit': 'ライトアームユニット',
        'Run: \\*\\*\\*\\*mi\\* \\(Delta Version\\)': 'コード：＊＊＊ミ＊【デルタ】',
        'Run: \\*\\*\\*\\*mi\\* \\(Omega Version\\)': 'コード：＊＊＊ミ＊【オメガ】',
        'Run: \\*\\*\\*\\*mi\\* \\(Sigma Version\\)': 'コード：＊＊＊ミ＊【シグマ】',
        '(?<! )Sniper Cannon': '狙撃式波動砲',
        'Solar Ray': 'ソーラレイ',
        'Spotlight': 'スポットライト',
        'Storage Violation': '記憶汚染除去S',
        'Subject Simulation F': 'トランスフォームF',
        'Superliminal Steel': 'ブレードコンボB',
        'Swivel Cannon': '旋回式波動砲',
        'Synthetic Shield': 'シールドオプション',
        'Unlimited Wave Cannon': '波動砲：リミッターカット',
        '(?<! )Wave Cannon(?! Kyrios)': '波動砲',
        '(?<! )Wave Cannon Kyrios': '波動砲P',
        'Wave Repeater': '速射式波動砲',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Alpha Omega': '阿尔法欧米茄',
        'Cosmo Meteor': '宇宙流星',
        '(?<!Alpha )Omega(?!-)': '欧米茄',
        'Omega-F': '欧米茄F',
        'Omega-M': '欧米茄M',
        'Optical Unit': '视觉组',
        'Rear Power Unit': '尾部组',
        'Left Arm Unit': '左臂组',
        'Right Arm Unit': '右臂组',
        'Rocket Punch': '火箭飞拳',
      },
      'replaceText': {
        'Archive Peripheral': '手臂归档',
        'Atomic Ray': '原子射线',
        'Beyond Defense': '盾连击S',
        'Beyond Strength': '盾连击G',
        'Blaster': '冲击波',
        'Blind Faith': '盲信',
        'Colossal Blow': '巨能爆散',
        'Condensed Wave Cannon Kyrios': '大功率波动炮P',
        'Cosmo Arrow': '宇宙天箭',
        'Cosmo Dive': '宇宙龙炎',
        'Cosmo Memory': '宇宙记忆',
        'Cosmo Meteor': '宇宙流星',
        'Critical Error': '严重错误',
        'Diffuse Wave Cannon(?! Kyrios)': '扩散波动炮',
        'Diffuse Wave Cannon Kyrios': '扩散波动炮P',
        'Discharger': '能量放出',
        'Efficient Bladework': '剑击',
        'Explosion': '爆炸',
        'Firewall': '防御程序',
        'Flame Thrower': '火炎放射',
        'Flash Gale': '闪光风',
        'Guided Missile Kyrios': '跟踪导弹P',
        'Hello, Distant World': '你好，远处世界',
        'Hello, Near World': '你好，近处世界',
        'Hello, World': '你好，世界',
        'High-powered Sniper Cannon': '狙击式大功率波动炮”',
        'Hyper Pulse': '超能脉冲',
        'Ion Efflux': '离子流出',
        'Laser Shower': '激光骤雨',
        'Latent Defect': '潜在错误',
        'Left Arm Unit': '左臂组',
        'Limitless Synergy': '协作程序LB',
        'Magic Number': '魔数',
        'Optical Laser': '光学射线F',
        'Optimized Bladedance': '欧米茄刀光剑舞',
        'Optimized Blizzard III': '欧米茄冰封',
        'Optimized Fire III': '欧米茄烈炎',
        'Optimized Meteor': '欧米茄陨石流星',
        'Optimized Passage of Arms': '欧米茄武装戍卫',
        'Optimized Sagittarius Arrow': '欧米茄射手天箭',
        'Oversampled Wave Cannon': '探测式波动炮',
        'Pantokrator': '全能之主',
        'Party Synergy': '协作程序PT',
        'Patch': '补丁',
        'Peripheral Synthesis': '生成外设',
        'Pile Pitch': '能量投射',
        'Program Loop': '循环程序',
        'Rear Lasers': '背环激光',
        'Right Arm Unit': '右臂组',
        'Run: \\*\\*\\*\\*mi\\* \\(Delta Version\\)': '代码：＊能＊（德尔塔）',
        'Run: \\*\\*\\*\\*mi\\* \\(Omega Version\\)': '代码：＊能＊（欧米茄）',
        'Run: \\*\\*\\*\\*mi\\* \\(Sigma Version\\)': '代码：＊能＊（西格玛）',
        '(?<! )Sniper Cannon': '狙击式波动炮”',
        'Solar Ray': '太阳射线',
        'Spotlight': '聚光灯',
        'Storage Violation': '清除记忆污染S',
        'Subject Simulation F': '变形F',
        'Superliminal Steel': '剑连击B',
        'Swivel Cannon': '回旋式波动炮',
        'Synthetic Shield': '合成盾',
        'Unlimited Wave Cannon': '波动炮：限制解除',
        '(?<! )Wave Cannon(?! Kyrios)': '波动炮',
        '(?<! )Wave Cannon Kyrios': '波动炮P',
        'Wave Repeater': '速射式波动炮',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Alpha Omega': '알파 오메가',
        'Cosmo Meteor': '세계의 메테오',
        '(?<!Alpha )Omega(?!-)': '오메가',
        'Omega-F': '오메가 F',
        'Omega-M': '오메가 M',
        'Optical Unit': '광학 유닛',
        'Rear Power Unit': '후면 유닛',
        'Left Arm Unit': '왼팔 유닛',
        'Right Arm Unit': '오른팔 유닛',
        'Rocket Punch': '로켓 주먹',
      },
      'replaceText': {
        '\\(stacks\\)': '(쉐어)',
        '\\(Wild Charge\\)': '(쉐어)',
        'Baits': '유도',
        'Far': '멀리',
        'Near(?! World)': '가까이',
        'Flare': '플레어',
        'Puddle': '장판',
        'Stack(?!s)': '쉐어',
        'Archive Peripheral': '기록 보존 장치',
        'Atomic Ray': '원자 파동',
        'Beyond Defense': '방패 연격 S',
        'Beyond Strength': '방패 연격 G',
        'Blaster': '블래스터',
        'Blind Faith': '맹목적인 믿음',
        'Blue Screen': '블루 스크린',
        'Colossal Blow': '광역 폭파',
        'Condensed Wave Cannon Kyrios': '고출력 파동포 P',
        'Cosmo Arrow': '세계의 화살',
        'Cosmo Dive': '세계의 강하',
        'Cosmo Memory': '세계의 기억',
        'Cosmo Meteor': '세계의 메테오',
        'Critical Error': '치명적인 오류',
        'Diffuse Wave Cannon(?! Kyrios)': '확산 파동포',
        'Diffuse Wave Cannon Kyrios': '확산 파동포 P',
        'Discharger': '방출',
        'Efficient Bladework': '검격',
        'Explosion': '폭발',
        'Firewall': '방어 프로그램',
        'Flame Thrower': '화염방사',
        'Flash Gale': '순간 강풍',
        'Guided Missile Kyrios': '유도 미사일 P',
        'Hello, Distant World': '헬로 월드: 원거리',
        'Hello, Near World': '헬로 월드: 근거리',
        'Hello, World': '헬로 월드',
        'High-powered Sniper Cannon': '저격식 고출력 파동포',
        'Hyper Pulse': '초파동 광선',
        'Ion Efflux': '이온 유출',
        'Laser Shower': '레이저 세례',
        'Latent Defect': '잠재적 오류',
        'Left Arm Unit': '왼팔 유닛',
        'Limitless Synergy': '연계 프로그램[리미트]',
        'Magic Number': '매직 넘버',
        'Optical Laser': '광학 레이저 F',
        'Optimized Bladedance': '쾌검난무: 오메가',
        'Optimized Blizzard III': '블리자가: 오메가',
        'Optimized Fire III': '파이라: 오메가',
        'Optimized Meteor': '메테오: 오메가',
        'Optimized Passage of Arms': '오메가의 결의',
        'Optimized Sagittarius Arrow': '궁수자리 화살: 오메가',
        'Oversampled Wave Cannon': '감지식 파동포',
        'Pantokrator': '전지전능',
        'Party Synergy': '연계 프로그램[파티]',
        'Patch': '연쇄 오류',
        'Peripheral Synthesis': '출력',
        'Pile Pitch': '에너지 투사',
        'Program Loop': '순환 프로그램',
        'Rear Lasers': '후면 레이저',
        'Right Arm Unit': '오른팔 유닛',
        'Run: \\*\\*\\*\\*mi\\*(?! \\()': '코드: ＊＊미＊',
        'Run: \\*\\*\\*\\*mi\\* \\(Delta Version\\)': '코드: ＊＊미＊[델타]',
        'Run: \\*\\*\\*\\*mi\\* \\(Omega Version\\)': '코드: ＊＊미＊[오메가]',
        'Run: \\*\\*\\*\\*mi\\* \\(Sigma Version\\)': '코드: ＊＊미＊[시그마]',
        '(?<! )Sniper Cannon': '저격식 파동포',
        'Solar Ray': '태양 광선',
        'Spotlight': '집중 조명',
        'Storage Violation': '기억 오염 제거 S',
        'Subject Simulation F': '형태 변경 F',
        'Superliminal Steel': '칼날 연격 B',
        'Swivel Cannon': '선회식 파동포',
        'Synthetic Shield': '방패 장착',
        'Unlimited Wave Cannon': '파동포: 리미터 해제',
        '(?<! )Wave Cannon(?! Kyrios)': '파동포',
        '(?<! )Wave Cannon Kyrios': '파동포 P',
        'Wave Repeater': '속사식 파동포',
      },
    },
  ],
};

export default triggerSet;
