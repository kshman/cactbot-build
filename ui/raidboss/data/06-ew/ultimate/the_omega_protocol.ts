import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// 다시 돌아온 멤버 처리: 만들어 보자고!!! 😭
type PrsMember = {
  r: string; // 롤
  j: string; // 잡
  pp: number; // Program loop -> 프로그램 루프 우선순위
  sm: number; // Synergy marker -> PS 마커 우선순위
  n: string; // 이름
  // 내부
  i: number;
  p?: PrsMember;
  f?: boolean;
};
export const getMemberByName = (data: Data, name: string) =>
  data.prsParty?.find((e) => e.n === name);
export const getMemberRole = (data: Data, name: string) => {
  const m = getMemberByName(data, name);
  return m !== undefined ? m.r : data.ShortName(name);
};
//
export const prsStrings = {
  tower: {
    en: '塔を踏み',
  },
  tether: {
    en: '線取り',
  },
  out: {
    en: '外へ',
  },
} as const;

export const playstationMarkers = ['circle', 'cross', 'triangle', 'square'] as const;
export type PlaystationMarker = typeof playstationMarkers[number];

export type Glitch = 'mid' | 'remote';

export interface Data extends RaidbossData {
  prsParty?: PrsMember[];
  prsMe?: PrsMember;
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
    };
  },
  timelineTriggers: [
    {
      id: 'TOP+ 데이터 확인',
      regex: /--setup--/,
      delaySeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.prsParty === undefined)
          return output.nodata!();
        for (let i = 0; i < data.prsParty.length; i++) {
          const m = data.prsParty[i];
          if (m !== undefined)
            m.i = i;
        }
        data.prsMe = data.prsParty.find((e) => e.n === data.me);
        if (data.prsMe === undefined)
          return output.nome!();
        return output.itsme!({ role: data.prsMe.r });
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
          en: '내 역할: ${role}',
          ja: 'ロール:  ${role}',
        },
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
      netRegex: { id: ['7B03', '7B0B'], source: 'Omega', capture: false },
      // Don't clean up when the buff is lost, as that happens after taking a tower.
      run: (data) => data.inLine = {},
    },
    {
      id: 'TOP In Line Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: ['BBC', 'BBD', 'BBE', 'D7B'], capture: false },
      preRun: (data) => {
        if (data.prsMe !== undefined)
          data.prsMe.p = undefined;
      },
      delaySeconds: 0.5,
      durationSeconds: 5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        let partner = output.unknown!();
        for (const [name, num] of Object.entries(data.inLine)) {
          if (num === myNum && name !== data.me) {
            partner = name;
            if (data.prsMe !== undefined)
              data.prsMe.p = getMemberByName(data, name);
            break;
          }
        }
        return output.text!({ num: myNum, player: getMemberRole(data, partner) });
      },
      outputStrings: {
        text: {
          en: '${num}번, 파트너: ${player}',
          de: '${num} (mit ${player})',
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
            en: '타워로! #1',
            de: 'Turm 1',
          },
          tether: {
            en: '줄받아요! #1',
            de: 'Verbindung 1',
          },
          numNoMechanic: {
            en: '1',
            de: '1',
          },
          towerWith: {
            en: '타워로! #1, 파트너: ${player}',
            de: 'Turm 1',
          },
          tetherWith: {
            en: '줄받아요! #1, 파트너: ${player}',
            de: 'Verbindung 1',
          },
        };

        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        if (data.prsMe?.p !== undefined) {
          if (myNum === 1)
            return { alertText: output.towerWith!({ player: data.prsMe.p.r }) };
          if (myNum === 3)
            return { alertText: output.tetherWith!({ player: data.prsMe.p.r }) };
          return { infoText: output.numNoMechanic!() };
        }
        if (myNum === 1)
          return { alertText: output.tower!() };
        if (myNum === 3)
          return { alertText: output.tether!() };
        return { infoText: output.numNoMechanic!() };
      },
      tts: (data, _matches, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        if (myNum === 1)
          return output.ttsTower!();
        if (myNum === 3)
          return output.ttsTether!();
      },
      outputStrings: {
        ttsTower: prsStrings.tower,
        ttsTether: prsStrings.tether,
      }
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
            en: '타워로! #${num}',
            de: 'Turm ${num}',
          },
          tether: {
            en: '줄받아요! #${num}',
            de: 'Verbindung ${num}',
          },
          numNoMechanic: {
            en: '${num}',
            de: '${num}',
          },
          towerWith: {
            en: '타워로! #${num}, 파트너: ${player}',
            de: 'Turm 1',
          },
          tetherWith: {
            en: '줄받아요! #${num}, 파트너: ${player}',
            de: 'Verbindung 1',
          },
        };

        const mechanicNum = data.loopBlasterCount + 1;
        if (mechanicNum >= 5)
          return;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return { infoText: output.numNoMechanic!({ num: mechanicNum }) };

        if (data.prsMe?.p !== undefined) {
          if (myNum === mechanicNum)
            return { alertText: output.towerWith!({ num: mechanicNum, player: data.prsMe.p.r }) };
          if (mechanicNum === myNum + 2 || mechanicNum === myNum - 2)
            return { alertText: output.tetherWith!({ num: mechanicNum, player: data.prsMe.p.r }) };
          return { infoText: output.numNoMechanic!({ num: mechanicNum }) };
        }

        if (myNum === mechanicNum)
          return { alertText: output.tower!({ num: mechanicNum }) };
        if (mechanicNum === myNum + 2 || mechanicNum === myNum - 2)
          return { alertText: output.tether!({ num: mechanicNum }) };
        return { infoText: output.numNoMechanic!({ num: mechanicNum }) };
      },
      tts: (data, _matches, output) => {
        const mechanicNum = data.loopBlasterCount + 1;
        if (mechanicNum >= 5)
          return;
        const myNum = data.inLine[data.me];
        if (myNum === undefined)
          return;
        if (myNum === mechanicNum)
          return output.ttsTower!();
        if (mechanicNum === myNum + 2 || mechanicNum === myNum - 2)
          return output.ttsTether!();
      },
      outputStrings: {
        ttsTower: prsStrings.tower,
        ttsTether: prsStrings.tether,
      }
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
            en: '밖으로 가요! #1',
            de: '1 Raus (auf Dir)',
          },
        };

        const myNum = data.inLine[data.me];
        if (myNum === 1)
          return { alertText: output.spread!() };
        return { infoText: output.lineStack!() };
      },
      tts: (data, _match, output) => {
        const myNum = data.inLine[data.me];
        if (myNum === 1)
          return output.out!();
      },
      outputStrings: {
        out: prsStrings.out,
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
            en: '밖으로 가요! #${num}',
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
      tts: (data, _match, output) => {
        const mechanicNum = data.pantoMissileCount + 1;
        const myNum = data.inLine[data.me];
        if (myNum === mechanicNum)
          return output.out!();
      },
      outputStrings: {
        out: prsStrings.out,
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
      id: 'TOP Synergy Marker',
      type: 'GainsEffect',
      // In practice, glitch1 glitch2 marker1 marker2 glitch3 glitch4 etc ordering.
      netRegex: { effectId: ['D63', 'D64'], capture: false },
      preRun: (data) => {
        if (data.prsMe !== undefined)
          data.prsMe.p = undefined;
      },
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
            if (data.prsMe !== undefined)
              data.prsMe.p = getMemberByName(data, name);
            break;
          }
        }

        const side = data.prsMe === undefined || data.prsMe.p === undefined ? ''
          : data.prsMe.sm < data.prsMe.p.sm ? output.left!() : output.right!();

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
        },
        remoteGlitch: {
          en: '멀리',
        },
        circle: {
          en: '${side} 🔴 ${glitch}, 파트너: ${player}',
        },
        triangle: {
          en: '${side} ▲ ${glitch}, 파트너: ${player}',
        },
        square: {
          en: '${side} 🟪 ${glitch}, 파트너: ${player}',
        },
        cross: {
          en: '${side} ➕ ${glitch}, 파트너: ${player}',
        },
        left: Outputs.arrowW,
        right: Outputs.arrowE,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'TOP Spotlight',
      type: 'HeadMarker',
      netRegex: {},
      preRun: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.stack)
          data.spotlightStacks.push(matches.target);
      },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          midGlitch: {
            en: '중간',
          },
          remoteGlitch: {
            en: '멀리',
          },
          stacksOn: {
            en: '${glitch}서 뭉쳐요 (${player1}, ${player2})',
          },
          // TODO: say who your tether partner is to swap??
          // TODO: tell the tether partner they are tethered to a stack?
          stackOnYou: {
            en: '내게 뭉칠거예요!',
          },
          unknown: Outputs.unknown,
        };

        const glitch = data.glitch
          ? {
            mid: output.midGlitch!(),
            remote: output.remoteGlitch!(),
          }[data.glitch]
          : output.unknown!();

        const [p1, p2] = data.spotlightStacks.sort();
        if (data.spotlightStacks.length !== 2 || p1 === undefined || p2 === undefined)
          return;

        const stacksOn = output.stacksOn!({
          glitch: glitch,
          player1: getMemberRole(data, p1),
          player2: getMemberRole(data, p2),
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
      condition: Conditions.targetIsYou(),
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.meteor)
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
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '뭉치면 안되요!',
          de: 'Nicht stacken!',
          fr: 'Ne vous packez pas !',
          ja: 'スタックするな！',
          cn: '分散站位！',
          ko: '쉐어 맞지 말것',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Omega': 'Omega',
      },
      'replaceText': {
        'Atomic Ray': 'Atomstrahlung',
        'Blaster': 'Blaster',
        'Condensed Wave Cannon Kyrios': 'Hochleistungswellenkanone P',
        'Diffuse Wave Cannon Kyrios': 'Streuende Wellenkanone P',
        'Flame Thrower': 'Flammensturm',
        'Guided Missile Kyrios': 'Lenkrakete P',
        'Pantokrator': 'Pantokrator',
        'Program Loop': 'Programmschleife',
        'Storage Violation': 'Speicherverletzung S',
        '(?<! )Wave Cannon Kyrios': 'Wellenkanone P',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Omega': 'Oméga',
      },
      'replaceText': {
        'Atomic Ray': 'Rayon atomique',
        'Blaster': 'Électrochoc',
        'Condensed Wave Cannon Kyrios': 'Canon plasma surchargé P',
        'Diffuse Wave Cannon Kyrios': 'Canon plasma diffuseur P',
        'Flame Thrower': 'Crache-flammes',
        'Guided Missile Kyrios': 'Missile guidé P',
        'Pantokrator': 'Pantokrator',
        'Program Loop': 'Boucle de programme',
        'Storage Violation': 'Corruption de données S',
        '(?<! )Wave Cannon Kyrios': 'Canon plasma P',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Omega': 'オメガ',
      },
      'replaceText': {
        'Atomic Ray': 'アトミックレイ',
        'Blaster': 'ブラスター',
        'Condensed Wave Cannon Kyrios': '高出力波動砲P',
        'Diffuse Wave Cannon Kyrios': '拡散波動砲P',
        'Flame Thrower': '火炎放射',
        'Guided Missile Kyrios': '誘導ミサイルP',
        'Pantokrator': 'パントクラトル',
        'Program Loop': 'サークルプログラム',
        'Storage Violation': '記憶汚染除去S',
        '(?<! )Wave Cannon Kyrios': '波動砲P',
      },
    },
  ],
};

export default triggerSet;
