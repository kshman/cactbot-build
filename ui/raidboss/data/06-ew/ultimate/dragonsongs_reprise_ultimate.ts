import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { LocaleObject, LocaleText, TriggerSet } from '../../../../../types/trigger';

// TODO: Ser Adelphel left/right movement after initial charge
// TODO: Meteor "run" call?
// TODO: Wyrmsbreath 2 cardinal positions for Cauterize and adjust delay
// TODO: Trigger for Hallowed Wings with Hot Tail/Hot Wings
// TODO: Phase 6 Resentment callout?

/* 멤버 처리:
사용자 데이터에 아래 예처럼 넣어야 해요. 단, 토르당(P2) 시작할 때 넣어야 해요
보통 사용자 파일은 [cactbot디렉토리]/user/raidboss.js 를 쓰면 되요
예)
Options.Triggers.push({
    zoneId: ZoneId.DragonsongsRepriseUltimate,
    timelineTriggers: [{
      id: 'DSR PR 데이터 설정',
      regex: /--setup--/,
      run: (data) => data.prsParty = [여기서 값],
    },],
});
형식)
  data.prsParty = [
    { r: 'MT', j: 'WAR', sp: 'ST', sc: 1, li: 9, ni: 0, nt: '🡼', wi: 0, n: '전사' },
    { r: 'ST', j: 'DRK', sp: 'MT', sc: 2, li: 9, ni: 1, nt: '🡽', wi: 1, n: '다크 나이트' },
    { r: 'H1', j: 'WHM', sp: 'H2', sc: 1, li: 0, ni: 2, nt: '🡿', wi: 2, n: '뱅마' },
    { r: 'H2', j: 'SCH', sp: 'H1', sc: 2, li: 1, ni: 3, nt: '🡾', wi: 3, n: '스콜라' },
    { r: 'D1', j: 'MNK', sp: 'D2', sc: 1, li: 2, ni: 4, nt: '🡿', wi: 7, n: '몽크' },
    { r: 'D2', j: 'RPR', sp: 'D1', sc: 2, li: 3, ni: 5, nt: '🡾', wi: 6, n: '낫쟁이' },
    { r: 'D3', j: 'DNC', sp: 'D4', sc: 1, li: 4, ni: 6, nt: '🡼', wi: 5, n: '춤꾼' },
    { r: 'D4', j: 'SMN', sp: 'D3', sc: 2, li: 5, ni: 7, nt: '🡽', wi: 4, n: '서모너' },
  ];
설명)
r: 역할
j: 잡 (사용안함)
sp: Sanctity of the Ward에서 칼일 경우 바꿀 사람
sc: Sanctity of the Ward에서 갖고 있을 칼 개수
li: Skyward Leaps 우선 순위
ni: 니드호그 1-2-3 타워 왼쪽 기준 우선 순서
nt: 니드호그 4 타워 위치
wi: Wrath of the Heavens 우선 순위
n: 게임 내 캐릭터 이름
*/
type PrsMember = {
  r: string;
  j: string;
  sp: string;
  sc: number;
  li: number;
  ni: number;
  nt: string;
  wi: number;
  n: string;
  // internal
  i: number;
  f?: boolean;
};

type Phase =
  | 'doorboss'
  | 'thordan'
  | 'nidhogg'
  | 'haurchefant'
  | 'thordan2'
  | 'nidhogg2'
  | 'dragon-king';

const playstationMarkers = ['circle', 'cross', 'triangle', 'square'] as const;
type PlaystationMarker = typeof playstationMarkers[number];

export interface Data extends RaidbossData {
  readonly triggerSetConfig: { markerStyle: number };
  combatantData: PluginCombatantState[];
  phase: Phase;
  decOffset?: number;
  seenEmptyDimension?: boolean;
  adelphelId?: string;
  firstAdelphelJump: boolean;
  adelphelDir?: number;
  brightwingCounter: number;
  spiralThrustSafeZones?: number[];
  sanctityWardDir?: string;
  sanctitySword1?: string;
  sanctitySword2?: string;
  thordanMeteorMarkers: string[];
  // mapping of player name to 1, 2, 3 dot.
  diveFromGraceNum: { [name: string]: number };
  // mapping of 1, 2, 3 to whether that group has seen an arrow.
  diveFromGraceHasArrow: { [num: number]: boolean };
  diveFromGraceDir: { [name: string]: 'circle' | 'up' | 'down' };
  diveFromGraceLashGnashKey: 'in' | 'out' | 'unknown';
  // mapping of player name to x coordinate
  diveFromGracePositions: { [name: string]: number };
  diveFromGraceTowerCounter?: number;
  eyeOfTheTyrantCounter: number;
  diveFromGracePreviousPosition: { [num: string]: 'middle' | 'west' | 'east' };
  waitingForGeirskogul?: boolean;
  stackAfterGeirskogul?: boolean;
  diveCounter: number;
  // names of players with chain lightning during wrath.
  thunderstruck: string[];
  hasDoom: { [name: string]: boolean };
  deathMarker: { [name: string]: PlaystationMarker };
  addsPhaseNidhoggId?: string;
  hraesvelgrGlowing?: boolean;
  nidhoggGlowing?: boolean;
  hallowedWingsCount: number;
  spreadingFlame: string[];
  entangledFlame: string[];
  mortalVowPlayer?: string;
  firstGigaflare?: number[];
  secondGigaflare?: number[];
  centerGigaflare?: number[];
  // PRs
  prsParty?: PrsMember[];
  prsMe?: PrsMember;
  prsHolyHallow: number;
  prsTethers: string[];
  prsTetherId?: number;
  prsTetherTarget?: string;
  prsSeenNidTether?: boolean;
  prsSeenTwister?: boolean;
  prsLog?: string;
}

// Due to changes introduced in patch 5.2, overhead markers now have a random offset
// added to their ID. This offset currently appears to be set per instance, so
// we can determine what it is from the first overhead marker we see.
const headmarkers = {
  // vfx/lockon/eff/lockon6_t0t.avfx
  'hyperdimensionalSlash': '00EA',
  // vfx/lockon/eff/r1fz_firechain_01x.avfx through 04x
  'firechainCircle': '0119',
  'firechainTriangle': '011A',
  'firechainSquare': '011B',
  'firechainX': '011C',
  // vfx/lockon/eff/r1fz_skywl_s9x.avfx
  'skywardTriple': '014A',
  // vfx/lockon/eff/m0244trg_a1t.avfx and a2t
  'sword1': '0032',
  'sword2': '0033',
  // vfx/lockon/eff/r1fz_holymeteo_s12x.avfx
  'meteor': '011D',
  // vfx/lockon/eff/r1fz_lockon_num01_s5x.avfx through num03
  'dot1': '013F',
  'dot2': '0140',
  'dot3': '0141',
  // vfx/lockon/eff/m0005sp_19o0t.avfx
  'skywardSingle': '000E',
  // vfx/lockon/eff/bahamut_wyvn_glider_target_02tm.avfx
  'cauterize': '0014',
} as const;

const playstationHeadmarkerIds: readonly string[] = [
  headmarkers.firechainCircle,
  headmarkers.firechainTriangle,
  headmarkers.firechainSquare,
  headmarkers.firechainX,
] as const;

const playstationMarkerMap: { [id: string]: PlaystationMarker } = {
  [headmarkers.firechainCircle]: 'circle',
  [headmarkers.firechainTriangle]: 'triangle',
  [headmarkers.firechainSquare]: 'square',
  [headmarkers.firechainX]: 'cross',
} as const;

const firstMarker = (phase: Phase) => {
  return phase === 'doorboss' ? headmarkers.hyperdimensionalSlash : headmarkers.skywardTriple;
};

const getHeadmarkerId = (
  data: Data,
  matches: NetMatches['HeadMarker'],
  firstDecimalMarker?: number,
) => {
  // If we naively just check !data.decOffset and leave it, it breaks if the first marker is 00DA.
  // (This makes the offset 0, and !0 is true.)
  if (data.decOffset === undefined) {
    // This must be set the first time this function is called in DSR Headmarker Tracker.
    if (firstDecimalMarker === undefined)
      throw new UnreachableCode();
    data.decOffset = parseInt(matches.id, 16) - firstDecimalMarker;
  }
  // The leading zeroes are stripped when converting back to string, so we re-add them here.
  // Fortunately, we don't have to worry about whether or not this is robust,
  // since we know all the IDs that will be present in the encounter.
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

// Calculate combatant position in an all 8 cards/intercards
const matchedPositionTo8Dir = (combatant: PluginCombatantState) => {
  // Positions are moved up 100 and right 100
  const y = combatant.PosY - 100;
  const x = combatant.PosX - 100;

  // During Thordan, knight dives start at the 8 cardinals + numerical
  // slop on a radius=23 circle.
  // N = (100, 77), E = (123, 100), S = (100, 123), W = (77, 100)
  // NE = (116.26, 83.74), SE = (116.26, 116.26), SW = (83.74, 116.26), NW = (83.74, 83.74)
  //
  // Map NW = 0, N = 1, ..., W = 7

  return Math.round(5 - 4 * Math.atan2(x, y) / Math.PI) % 8;
};

// Calculate combatant position in 4 cardinals
const matchedPositionTo4Dir = (combatant: PluginCombatantState) => {
  // Positions are moved up 100 and right 100
  const y = combatant.PosY - 100;
  const x = combatant.PosX - 100;

  // During the vault knights, Adelphel will jump to one of the 4 cardinals
  // N = (100, 78), E = (122, 100), S = (100, 122), W = (78, 100)
  //
  // N = 0, E = 1, S = 2, W = 3

  return Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;
};

const triggerSet: TriggerSet<Data> = {
  id: 'DragonsongsRepriseUltimate',
  zoneId: ZoneId.DragonsongsRepriseUltimate,
  config: [
    {
      id: 'markerStyle',
      name: {
        en: 'DSR: Marker type 0=default, 1=for static, 2=for party',
        ja: '絶竜詩戦争: マーカー 0=デフォルト, 1=固定用, 2=野良用',
        ko: '절용시전쟁: 마커 방식 0=기본, 1=고정팀용, 2=일반파티용',
      },
      type: 'integer',
      default: 0,
    },
  ],
  timelineFile: 'dragonsongs_reprise_ultimate.txt',
  initData: () => {
    return {
      combatantData: [],
      phase: 'doorboss',
      firstAdelphelJump: true,
      brightwingCounter: 1,
      thordanMeteorMarkers: [],
      diveFromGraceNum: {},
      diveFromGraceHasArrow: { 1: false, 2: false, 3: false },
      diveFromGraceLashGnashKey: 'unknown',
      diveFromGracePositions: {},
      diveFromGraceDir: {},
      eyeOfTheTyrantCounter: 0,
      diveFromGracePreviousPosition: {},
      diveCounter: 1,
      thunderstruck: [],
      hasDoom: {},
      deathMarker: {},
      hallowedWingsCount: 0,
      spreadingFlame: [],
      entangledFlame: [],
      // PRs
      prsHolyHallow: 0,
      prsTethers: [],
    };
  },
  timelineTriggers: [
    {
      id: 'DSR Eye of the Tyrant Counter',
      regex: /Eye of the Tyrant/,
      beforeSeconds: 1,
      run: (data) => data.eyeOfTheTyrantCounter++,
    },
    {
      id: 'DSR Resentment',
      regex: /Resentment/,
      beforeSeconds: 5,
      condition: (data) => data.phase === 'nidhogg',
      response: Responses.bleedAoe(),
    },
    {
      id: 'DSR Mortal Vow',
      regex: /Mortal Vow/,
      // 3.7s to avoid early movement at Touchdown and last Mortal Vow
      beforeSeconds: 3.7,
      durationSeconds: 3.7,
      infoText: (data, _matches, output) => {
        if (data.me === data.mortalVowPlayer)
          return output.vowOnYou!();
        if (data.mortalVowPlayer !== undefined)
          return output.vowOn!({ player: data.party.member(data.mortalVowPlayer) });
        return output.vowSoon!();
      },
      outputStrings: {
        vowOnYou: {
          en: 'Vow on you',
          ja: '自分に滅殺',
          ko: '내가 멸살이네!',
        },
        vowOn: {
          en: 'Vow on ${player}',
          ja: '${player}に滅殺',
          ko: '멸살: ${player}',
        },
        vowSoon: {
          en: 'Vow soon (Spread)',
          ja: 'まもなく滅殺 (散会)',
          ko: '곧 멸살! 흩어져!',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'DSR Phase Tracker',
      type: 'StartsUsing',
      // 62D4 = Holiest of Holy
      // 63C8 = Ascalon's Mercy Concealed
      // 6708 = Final Chorus
      // 62E2 = Spear of the Fury
      // 6B86 = Incarnation
      netRegex: { id: ['62D4', '63C8', '6708', '62E2', '6B86'], capture: true },
      run: (data, matches) => {
        // On the unlikely chance that somebody proceeds directly from the checkpoint into the next phase.
        data.brightwingCounter = 1;

        switch (matches.id) {
          case '62D4':
            data.phase = 'doorboss';
            break;
          case '63C8':
            data.phase = 'thordan';
            break;
          case '6708':
            data.phase = 'nidhogg';
            break;
          case '62E2':
            // This ability is used in both doorboss and haurchefant.
            if (data.phase !== 'doorboss')
              data.phase = 'haurchefant';
            break;
          case '6B86':
            data.phase = 'thordan2';
            break;
        }
      },
    },
    {
      id: 'DSR Phase Tracker P6 and P7',
      type: 'Ability',
      // 6667 = unknown_6667
      // 71E4 = Shockwave
      netRegex: { id: ['6667', '71E4'] },
      suppressSeconds: 1,
      run: (data, matches) => {
        switch (matches.id) {
          case '6667':
            data.phase = 'nidhogg2';
            break;
          case '71E4':
            data.phase = 'dragon-king';
            break;
        }
      },
    },
    {
      id: 'DSR Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => {
        const firstHeadmarker: number = parseInt(firstMarker(data.phase), 16);
        getHeadmarkerId(data, matches, firstHeadmarker);
      },
    },
    {
      id: 'DSR Holiest of Holy',
      type: 'StartsUsing',
      netRegex: { id: '62D4', source: 'Ser Adelphel', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'DSR Holiest Hallowing',
      type: 'StartsUsing',
      netRegex: { id: '62D0', source: 'Ser Adelphel', capture: false },
      condition: (data) => data.CanSilence(),
      alertText: (data, _matches, output) => output.intrs!({ num: ++data.prsHolyHallow }),
      outputStrings: {
        intrs: {
          en: 'Interrupt ${num}',
          ja: '${num}番目のインタラプト',
          ko: '${num}번째 아델펠 인터럽트',
        },
      },
    },
    {
      id: 'DSR Empty Dimension',
      type: 'StartsUsing',
      netRegex: { id: '62DA', source: 'Ser Grinnaux', capture: false },
      alertText: (data, _matches, output) => {
        return data.phase !== 'doorboss' || data.seenEmptyDimension
          ? output.in!()
          : output.inAndTether!();
      },
      run: (data) => data.seenEmptyDimension = true,
      outputStrings: {
        inAndTether: {
          en: 'In + Tank Tether',
          ja: '中へ + タンク線取り',
          ko: '안으로 + 탱크줄!',
        },
        in: Outputs.in,
      },
    },
    {
      id: 'DSR Full Dimension',
      type: 'StartsUsing',
      netRegex: { id: '62DB', source: 'Ser Grinnaux', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'DSR Faith Unmoving',
      type: 'StartsUsing',
      netRegex: { id: '62DC', source: 'Ser Grinnaux', capture: false },
      condition: (data) => {
        // Drop the knockback call during Playstation2 as there is too much going on.
        if (data.phase === 'thordan2')
          return false;
        return data.phase !== 'doorboss' || data.adelphelDir === undefined;
      },
      response: Responses.knockback(),
    },
    {
      id: 'DSR Hyperdimensional Slash Headmarker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.phase === 'doorboss' && data.me === matches.target,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.hyperdimensionalSlash)
          return output.slashOnYou!();
      },
      outputStrings: {
        slashOnYou: {
          en: 'Slash on YOU',
          ja: '自分にハイパーディメンション',
          ko: '슬래시! 흩어져!',
        },
      },
    },
    {
      id: 'DSR Adelphel ID Tracker',
      // 62D2 Is Ser Adelphel's Holy Bladedance, casted once during the encounter
      type: 'Ability',
      netRegex: { id: '62D2', source: 'Ser Adelphel' },
      run: (data, matches) => data.adelphelId = matches.sourceId,
    },
    {
      id: 'DSR Adelphel KB Direction',
      type: 'NameToggle',
      netRegex: { toggle: '01' },
      condition: (data, matches) =>
        data.phase === 'doorboss' && matches.id === data.adelphelId && data.firstAdelphelJump,
      // Delay 0.1s here to prevent any race condition issues with getCombatants
      delaySeconds: 0.1,
      promise: async (data, matches) => {
        data.firstAdelphelJump = false;
        // Select Ser Adelphel
        let adelphelData = null;
        adelphelData = await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.id, 16)],
        });

        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (adelphelData === null) {
          console.error(`Ser Adelphel: null data`);
          return;
        }
        const adelphelDataLength = adelphelData.combatants.length;
        if (adelphelDataLength !== 1) {
          console.error(`Ser Adelphel: expected 1 combatants got ${adelphelDataLength}`);
          return;
        }

        // Add the combatant's position
        const adelphel = adelphelData.combatants.pop();
        if (!adelphel)
          throw new UnreachableCode();
        data.adelphelDir = matchedPositionTo4Dir(adelphel);
      },
      infoText: (data, _matches, output) => {
        // Map of directions, reversed to call out KB direction
        const dirs: { [dir: number]: string } = {
          0: output.south!(),
          1: output.west!(),
          2: output.north!(),
          3: output.east!(),
          4: output.unknown!(),
        };
        return output.adelphelLocation!({
          dir: dirs[data.adelphelDir ?? 4],
        });
      },
      run: (data) => delete data.adelphelDir,
      outputStrings: {
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
        unknown: Outputs.unknown,
        adelphelLocation: {
          en: 'Go ${dir} (knockback)',
          ja: '${dir}へ (ノックバック)',
          ko: '${dir}으로!',
        },
      },
    },
    {
      id: 'DSR Playstation Fire Chains',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.phase === 'doorboss' && data.me === matches.target,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.firechainCircle)
          return output.circle!();
        if (id === headmarkers.firechainTriangle)
          return output.triangle!();
        if (id === headmarkers.firechainSquare)
          return output.square!();
        if (id === headmarkers.firechainX)
          return output.cross!();
      },
      outputStrings: {
        circle: {
          en: 'Red Circle',
          ja: '赤まる',
          ko: '🔴빨강',
        },
        triangle: {
          en: 'Green Triangle',
          ja: '緑さんかく',
          ko: '▲초록',
        },
        square: {
          en: 'Purple Square',
          ja: '紫しかく',
          ko: '🟪보라 (➕왼쪽으로)',
        },
        cross: {
          en: 'Blue X',
          ja: '青バツ',
          ko: '➕파랑 (북으로)',
        },
      },
    },
    {
      id: 'DSR Brightwing Counter',
      type: 'Ability',
      // Visually, this comes from Ser Charibert.  However, ~30% of the time
      // the first set of Brightwing cleaves come from King Thordan/Ser Hermonst
      // entities.  This is likely just stale combatant data from the ffxiv plugin.
      netRegex: { id: '6319', capture: false },
      // One ability for each player hit (hopefully only two??)
      suppressSeconds: 1,
      infoText: (data, _matches, output) => output[`dive${data.brightwingCounter}`]!(),
      run: (data) => data.brightwingCounter++,
      outputStrings: {
        // Ideally folks can customize this with who needs to run in.
        dive1: Outputs.num1,
        dive2: Outputs.num2,
        dive3: Outputs.num3,
        dive4: Outputs.num4,
      },
    },
    {
      id: 'DSR Brightwing Move',
      type: 'Ability',
      netRegex: { id: '6319', source: 'Ser Charibert' },
      condition: Conditions.targetIsYou(),
      // Once hit, drop your Skyblind puddle somewhere else.
      response: Responses.moveAway('alert'),
    },
    {
      id: 'DSR Skyblind',
      // 631A Skyblind (2.2s cast) is a targeted ground aoe where A65 Skyblind
      // effect expired on the player.
      type: 'GainsEffect',
      netRegex: { effectId: 'A65' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration),
      response: Responses.moveAway(),
    },
    {
      id: 'DSR Ascalon\'s Mercy Concealed',
      type: 'StartsUsing',
      netRegex: { id: '63C8', source: 'King Thordan', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      response: Responses.moveAway(),
    },
    {
      id: 'DSR PR 사용자 데이터 설정 (뇌창)',
      type: 'Ability',
      netRegex: { id: '63D3', source: 'King Thordan', capture: false },
      delaySeconds: 1,
      durationSeconds: 2,
      infoText: (data, _matches, output) => {
        if (data.prsParty === undefined)
          return;
        for (let i = 0; i < data.prsParty.length; i++) {
          const m = data.prsParty[i];
          if (m !== undefined)
            m.i = i;
        }
        data.prsMe = data.prsParty.find((e) => e.n === data.me);
        if (data.prsMe === undefined)
          return output.nodata!();
        return output.text!({ role: data.prsMe.r });
      },
      outputStrings: {
        nodata: {
          en: 'No user data found',
          ja: 'データの設定が見つかりません',
          ko: '데이터를 설정하지 않았네요',
        },
        text: {
          en: 'Your role: ${role}',
          ja: 'ロール:  ${role}',
          ko: '내 역할: ${role}',
        },
      },
    },
    {
      id: 'DSR PR 줄 (0054)',
      type: 'Tether',
      netRegex: { id: '0054' },
      condition: (data) => data.phase === 'thordan' || data.phase === 'nidhogg',
      run: (data, matches, _output) => {
        data.prsTethers.push(matches.target);

        const sid = parseInt(matches.sourceId, 16);
        if (data.prsMe?.r === 'MT') {
          const lid = data.prsTetherId ?? 0xFFFFFFFF;
          if (sid <= lid) {
            data.prsTetherId = sid;
            data.prsTetherTarget = matches.target;
          }
        } else {
          const lid = data.prsTetherId ?? 0;
          if (sid >= lid) {
            data.prsTetherId = sid;
            data.prsTetherTarget = matches.target;
          }
        }
      },
    },
    {
      id: 'DSR Spiral Thrust Safe Spots',
      // 63D3 Strength of the Ward
      type: 'Ability',
      netRegex: { id: '63D3', source: 'King Thordan', capture: false },
      condition: (data) => data.phase === 'thordan',
      // It appears that these adds can be in place at ~4.5s, but with latency this may fail for some.
      delaySeconds: 5,
      promise: async (data) => {
        // Collect Ser Vellguine (3636), Ser Paulecrain (3637), Ser Ignasse (3638) entities
        const vellguineLocaleNames: LocaleText = {
          en: 'Ser Vellguine',
          de: 'Vellguine',
          fr: 'Sire Vellguine',
          ja: '聖騎士ヴェルギーン',
          cn: '圣骑士韦尔吉纳',
          ko: '성기사 벨긴',
        };

        const paulecrainLocaleNames: LocaleText = {
          en: 'Ser Paulecrain',
          de: 'Paulecrain',
          fr: 'Sire Paulecrain',
          ja: '聖騎士ポールクラン',
          cn: '圣骑士波勒克兰',
          ko: '성기사 폴르크랭',
        };

        const ignasseLocaleNames: LocaleText = {
          en: 'Ser Ignasse',
          de: 'Ignasse',
          fr: 'Sire Ignassel',
          ja: '聖騎士イニアセル',
          cn: '圣骑士伊尼亚斯',
          ko: '성기사 이냐스',
        };

        // Select the knights
        const combatantNameKnights: string[] = [];
        combatantNameKnights.push(
          vellguineLocaleNames[data.parserLang] ?? vellguineLocaleNames['en'],
        );
        combatantNameKnights.push(
          paulecrainLocaleNames[data.parserLang] ?? paulecrainLocaleNames['en'],
        );
        combatantNameKnights.push(ignasseLocaleNames[data.parserLang] ?? ignasseLocaleNames['en']);

        const spiralThrusts = [];

        const knightCombatantData = await callOverlayHandler({
          call: 'getCombatants',
          names: combatantNameKnights,
        });

        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (knightCombatantData === null) {
          console.error(`Spiral Thrust: null data`);
          return;
        }
        const combatantDataLength = knightCombatantData.combatants.length;
        if (combatantDataLength !== 3) {
          console.error(`Spiral Thrust: expected 3 combatants got ${combatantDataLength}`);
          return;
        }

        for (const combatant of knightCombatantData.combatants)
          spiralThrusts.push(matchedPositionTo8Dir(combatant));

        const [thrust0, thrust1, thrust2] = spiralThrusts;
        if (thrust0 === undefined || thrust1 === undefined || thrust2 === undefined)
          return;

        // Array of dirNums
        const dirNums = [0, 1, 2, 3, 4, 5, 6, 7];

        // Remove where the knights are at and where they will go to
        delete dirNums[(thrust0 + 4) % 8];
        delete dirNums[thrust0];
        delete dirNums[(thrust1 + 4) % 8];
        delete dirNums[thrust1];
        delete dirNums[(thrust2 + 4) % 8];
        delete dirNums[thrust2];

        // Remove null elements from the array to get remaining two dirNums
        dirNums.forEach((dirNum) => {
          if (dirNum !== null)
            (data.spiralThrustSafeZones ??= []).push(dirNum);
        });
      },
      infoText: (data, _matches, output) => {
        data.spiralThrustSafeZones ??= [];
        if (data.spiralThrustSafeZones.length !== 2) {
          console.error(
            `Spiral Thrusts: expected 2 safe zones got ${data.spiralThrustSafeZones.length}`,
          );
          return;
        }
        // PRs / 색깔로 콜링콜링
        if (data.triggerSetConfig.markerStyle === 1) {
          const clrs: { [clr: number]: string } = {
            0: '보라',
            1: '빨강',
            2: '노랑',
            3: '파랑',
            4: '보라',
            5: '빨강',
            6: '노랑',
            7: '파랑',
            8: output.unknown!(),
          };
          return output.safeSpotsColor!({ clr: clrs[data.spiralThrustSafeZones[0] ?? 8] });
        }
        // PRs / 일반 파티용 A 1 B 2...
        if (data.triggerSetConfig.markerStyle === 2) {
          const pfms: { [pfm: number]: string } = {
            0: '4',
            1: 'A',
            2: '1',
            3: 'Ⓑ',
            4: '②',
            5: 'ⓒ',
            6: '③',
            7: 'D',
            8: output.unknown!(),
          };
          const s1 = pfms[data.spiralThrustSafeZones[0] ?? 8] ?? '';
          const s2 = pfms[data.spiralThrustSafeZones[1] ?? 8] ?? '';
          if (s1 < s2)
            return output.safeSpots!({ dir1: s1, dir2: s2 });
          return output.safeSpots!({ dir1: s2, dir2: s1 });
        }
        // Map of directions
        const dirs: { [dir: number]: string } = {
          0: output.northwest!(),
          1: output.north!(),
          2: output.northeast!(),
          3: output.east!(),
          4: output.southeast!(),
          5: output.south!(),
          6: output.southwest!(),
          7: output.west!(),
          8: output.unknown!(),
        };
        return output.safeSpots!({
          dir1: dirs[data.spiralThrustSafeZones[0] ?? 8],
          dir2: dirs[data.spiralThrustSafeZones[1] ?? 8],
        });
      },
      run: (data) => delete data.spiralThrustSafeZones,
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
        safeSpots: {
          en: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        safeSpotsColor: {
          en: '${clr}',
          ja: '${clr}',
          ko: '${clr}',
        },
      },
    },
    {
      id: 'DSR Dragon\'s Rage',
      type: 'Ability',
      netRegex: { id: '63D7', source: 'Ser Guerrique', capture: false },
      durationSeconds: 7,
      promise: async (data) => {
        // These are the first actions these actors take, so can't easily get their ids earlier.
        // Therefore, use names.  There should be exactly one of each.
        // TODO: maybe we need data function to do this sort of translating so it's
        // not duplicating the timelineReplace section below.
        const names: LocaleObject<string[]> = {
          en: ['Ser Adelphel', 'Ser Janlenoux'],
          de: ['Adelphel', 'Janlenoux'],
          fr: ['Sire Adelphel', 'Sire Janlenoux'],
          ja: ['聖騎士アデルフェル', '聖騎士ジャンルヌ'],
          cn: ['圣骑士阿代尔斐尔', '圣骑士让勒努'],
          ko: ['성기사 아델펠', '성기사 장르누'],
        };

        const combatantNames = names[data.parserLang] ?? names['en'];
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          names: combatantNames,
        })).combatants;
      },
      // Deliberately don't play a sound here, because there's also a sound for the
      // Ascalon's Mercy Concealed and you don't want people to be jumpy.
      sound: '',
      infoText: (data, _matches, output) => {
        const [c1, c2] = data.combatantData;
        if (data.combatantData.length !== 2 || c1 === undefined || c2 === undefined) {
          console.error(`DragonsRage: wrong length: ${JSON.stringify(data.combatantData)}`);
          return;
        }

        // Ser Adelphel and Ser Janlenoux appear on the field in two spots.  It is random which
        // side they are on.  Thordan appears opposite of them.  If they are SW and SE, then
        // Thordan is N.  They will always be two spaces apart.
        let d1 = matchedPositionTo8Dir(c1);
        let d2 = matchedPositionTo8Dir(c2);

        // Adjust for wrapping around n=0/8 so that we can average the two points below.
        if (d2 === 6 && d1 === 0 || d2 === 7 && d1 === 1)
          d1 += 8;
        if (d1 === 6 && d2 === 0 || d1 === 7 && d2 === 1)
          d2 += 8;

        // After the above adjustment to handle modular math wrapping,
        // d1 and d2 should be exactly two spaces apart.
        if (d2 - d1 !== 2 && d1 - d2 !== 2) {
          console.error(
            `DragonsRage: bad dirs: ${d1}, ${d2}, ${JSON.stringify(data.combatantData)}`,
          );
          return;
        }

        // Average to find the point between d1 and d2, then add 4 to find its opposite.
        const thordanDir = (Math.floor((d1 + d2) / 2) + 4) % 8;

        // PRs / 알파벳-숫자 콜링콜링
        if (data.triggerSetConfig.markerStyle === 1) {
          const mrks: { [mrk: number]: string } = {
            0: '4',
            1: 'A',
            2: 'B',
            3: 'C',
            4: 'D',
            5: '1',
            6: '2',
            7: '3',
          };
          return output.thordanLocation!({
            dir: mrks[thordanDir] ?? output.unknown!(),
          });
        }
        // PRs / A 1 B 2...
        if (data.triggerSetConfig.markerStyle === 2) {
          const pfms: { [pfm: number]: string } = {
            0: '4',
            1: 'A',
            2: '1',
            3: 'B',
            4: '2',
            5: 'C',
            6: '3',
            7: 'D',
          };
          return output.thordanLocation!({
            dir: pfms[thordanDir] ?? output.unknown!(),
          });
        }
        // Map of directions
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
        return output.thordanLocation!({
          dir: dirs[thordanDir] ?? output.unknown!(),
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
        thordanLocation: {
          en: '${dir} Thordan',
          ja: 'トールダン ${dir}',
          ko: '${dir}에 토르당',
        },
      },
    },
    {
      id: 'DSR Skyward Leap',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, _matches) => data.phase === 'thordan',
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.skywardTriple) {
          if (data.prsParty !== undefined) {
            const find = data.prsParty.find((e) => e.n === matches.target);
            if (find !== undefined)
              find.f = true;
          }
          if (data.me === matches.target)
            return output.leapOnYou!();
        }
      },
      outputStrings: {
        leapOnYou: {
          en: 'Leap on YOU',
          ja: '自分に青マーカー',
          ko: '🟦파란거네!',
        },
      },
    },
    {
      id: 'DSR PR Skyward Leap 동료 확인',
      type: 'Ability',
      netRegex: { id: '63DA', source: 'Ser Guerrique', capture: false },
      alertText: (data, _matches, output) => {
        if (data.prsParty === undefined || !data.prsMe?.f)
          return;
        const blues = data.prsParty.filter((e) => e.f);
        const sorted = blues.sort((a, b) => a.li - b.li).map((e) => e.r);
        return output.leaps!({ leaps: sorted.join(', ') });
      },
      run: (data) => data.prsParty?.forEach((e) => delete e.f),
      outputStrings: {
        leaps: {
          en: '${leaps}',
          ja: '${leaps}',
          ko: '${leaps}',
        },
      },
    },
    {
      id: 'DSR PR 배시 줄은 어디에',
      type: 'Ability',
      // Heavy Impact 5
      netRegex: { id: '63DA', source: 'Ser Guerrique', capture: false },
      condition: (data) => data.role === 'tank',
      delaySeconds: 4,
      infoText: (data, _matches, output) => {
        if (data.prsTethers.length < 2)
          return;
        if (data.prsParty !== undefined) {
          const [t1, t2] = data.prsTethers.splice(-2);
          const [m1, m2] = data.prsParty.filter((e) => e.n === t1 || e.n === t2)
            .sort((a, b) => a.i - b.i);
          return output.tether!({ tether1: m1?.r, tether2: m2?.r });
        }
        const [s1, s2] = data.prsTethers.slice(-2).map((e) => data.party.member(e));
        return output.tether!({ tether1: s1, tether2: s2 });
      },
      run: (data) => {
        data.prsTethers = [];
        delete data.prsTetherId;
        delete data.prsTetherTarget;
      },
      outputStrings: {
        tether: {
          en: '${tether1}, ${tether2}',
          ja: '${tether1}, ${tether2}',
          ko: '${tether1}, ${tether2}',
        },
      },
    },
    {
      id: 'DSR Ancient Quaga',
      type: 'StartsUsing',
      netRegex: { id: '63C6', source: 'King Thordan', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'DSR Heavenly Heel',
      type: 'StartsUsing',
      netRegex: { id: '63C7', source: 'King Thordan' },
      response: Responses.tankBusterSwap('alert', 'alert'),
    },
    {
      id: 'DSR Sanctity of the Ward Direction',
      type: 'Ability',
      netRegex: { id: '63E1', source: 'King Thordan', capture: false },
      condition: (data) => data.phase === 'thordan',
      delaySeconds: 4.7,
      // Keep message up until knights are done dashing
      durationSeconds: 13,
      promise: async (data, _matches, output) => {
        // The two gladiators spawn in one of two positions: West (95, 100) or East (105, 100).
        // This triggers uses east/west location of the white knight, Ser Janlennoux (3635) to
        // determine where both knights will dash as they each only look in two directions.
        // Ser Janlenoux only looks towards the north (northeast or northwest).
        // Ser Adelphel only looks towards the south (southwest or southeast).
        // Thus we can just use one knight and get whether it is east or west for location.
        // Callout assumes starting from DRK position, but for east/west (two-movement strategy)
        // you can reverse the cw/ccw callout.
        const janlenouxLocaleNames: LocaleText = {
          en: 'Ser Janlenoux',
          de: 'Janlenoux',
          fr: 'Sire Janlenoux',
          ja: '聖騎士ジャンルヌ',
          cn: '圣骑士让勒努',
          ko: '성기사 장르누',
        };

        // Select Ser Janlenoux
        let combatantNameJanlenoux = null;
        combatantNameJanlenoux = janlenouxLocaleNames[data.parserLang];

        let combatantDataJanlenoux = null;
        if (combatantNameJanlenoux !== undefined) {
          combatantDataJanlenoux = await callOverlayHandler({
            call: 'getCombatants',
            names: [combatantNameJanlenoux],
          });
        }

        // if we could not retrieve combatant data, the
        // trigger will not work, so just resume promise here
        if (combatantDataJanlenoux === null) {
          console.error(`Ser Janlenoux: null data`);
          return;
        }
        const combatantDataJanlenouxLength = combatantDataJanlenoux.combatants.length;
        if (combatantDataJanlenouxLength < 1) {
          console.error(
            `Ser Janlenoux: expected at least 1 combatants got ${combatantDataJanlenouxLength}`,
          );
          return;
        }

        // Sort to retreive last combatant in list
        const sortCombatants = (a: PluginCombatantState, b: PluginCombatantState) =>
          (a.ID ?? 0) - (b.ID ?? 0);
        const combatantJanlenoux = combatantDataJanlenoux.combatants.sort(sortCombatants).shift();
        if (!combatantJanlenoux)
          throw new UnreachableCode();

        // West (95, 100) or East (105, 100).
        if (combatantJanlenoux.PosX < 100)
          data.sanctityWardDir = output.clockwise!();
        if (combatantJanlenoux.PosX > 100)
          data.sanctityWardDir = output.counterclock!();
      },
      infoText: (data, _matches, output) => {
        return data.sanctityWardDir ?? output.unknown!();
      },
      run: (data) => delete data.sanctityWardDir,
      outputStrings: {
        clockwise: {
          en: 'Clockwise',
          ja: '時計回り',
          ko: '시계❰❰❰',
        },
        counterclock: {
          en: 'Counterclockwise',
          ja: '反時計回り',
          ko: '❱❱❱반시계',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'DSR Sanctity of the Ward Swords',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.phase === 'thordan' && data.me === matches.target,
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.sword1)
          return output.sword1!();
        if (id === headmarkers.sword2)
          return output.sword2!();
      },
      outputStrings: {
        sword1: {
          en: '1',
          ja: '1',
          ko: '칼 한개!',
        },
        sword2: {
          en: '2',
          ja: '2',
          ko: '칼 두개!',
        },
      },
    },
    /* 여기 어디에 도달하지 않는게 있는가 싶다
    {
      id: 'DSR Sanctity of the Ward Sword Names',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.phase === 'thordan',
      sound: '',
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.sword1)
          data.sanctitySword1 = matches.target;
        else if (id === headmarkers.sword2)
          data.sanctitySword2 = matches.target;
        else
          return;

        if (data.sanctitySword1 === undefined || data.sanctitySword2 === undefined)
          return;

        if (data.prsParty !== undefined && data.prsMe !== undefined) {
          const m1 = data.prsParty.find((e) => e.n === data.sanctitySword1);
          if (m1 !== undefined) {
            if (m1 === data.prsMe && data.prsMe.sc === 2)
              return { alertText: output.swap!({ role: m1.sp }) };
            if (m1.sp === data.prsMe.r && m1.sc === 2)
              return { alertText: output.swap!({ role: m1.r }) };
          }
          const m2 = data.prsParty.find((e) => e.n === data.sanctitySword2);
          if (m2 !== undefined) {
            if (m2 === data.prsMe && data.prsMe.sc === 1)
              return { alertText: output.swap!({ role: m2.sp }) };
            if (m2.sp === data.prsMe.r && m2.sc === 1)
              return { alertText: output.swap!({ role: m2.r }) };
          }
          return { infoText: output.keep!() };
        }

        const name1 = data.party.member(data.sanctitySword1);
        const name2 = data.party.member(data.sanctitySword2);
        return output.text!({ name1: name1, name2: name2 });
      },
      // Don't collide with the more important 1/2 call.
      tts: '',
      outputStrings: {
        text: {
          en: 'Swords: ${name1}, ${name2}',
          ja: '剣：${name1}, ${name2}',
          ko: '내게 돌진: ${name1}, ${name2}',
        },
      },
    },
    */
    {
      id: 'DSR Dragon\'s Gaze',
      type: 'StartsUsing',
      netRegex: { id: '63D0', source: 'King Thordan', capture: false },
      durationSeconds: 5,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'DSR Sanctity of the Ward Meteor Role',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.phase === 'thordan',
      // Keep this up through the first tower.
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.meteor)
          return;
        data.thordanMeteorMarkers.push(matches.target);
        const [p1, p2] = data.thordanMeteorMarkers.sort();
        if (data.thordanMeteorMarkers.length !== 2 || p1 === undefined || p2 === undefined)
          return;

        if (data.prsParty !== undefined) {
          const [m1, m2] = data.prsParty.filter((e) => e.n === p1 || e.n === p2);
          if (m1 !== undefined && m2 !== undefined) {
            if (m1.i < m2.i)
              return output.meteors!({ player1: m1.r, player2: m2.r });
            return output.meteors!({ player1: m2.r, player2: m1.r });
          }
        }

        const p1dps = data.party.isDPS(p1);
        const p2dps = data.party.isDPS(p2);

        if (p1dps && p2dps)
          return output.dpsMeteors!({
            player1: data.party.member(p1),
            player2: data.party.member(p2),
          });
        if (!p1dps && !p2dps)
          return output.tankHealerMeteors!({
            player1: data.party.member(p1),
            player2: data.party.member(p2),
          });
        return output.unknownMeteors!({
          player1: data.party.member(p1),
          player2: data.party.member(p2),
        });
      },
      outputStrings: {
        tankHealerMeteors: {
          en: 'Tank/Healer Meteors (${player1}, ${player2})',
          ja: 'タンヒラ 隕石 (${player1}, ${player2})',
          ko: '탱힐: ${player1}, ${player2}',
        },
        dpsMeteors: {
          en: 'DPS Meteors (${player1}, ${player2})',
          ja: 'DPS 隕石 (${player1}, ${player2})',
          ko: 'DPS: ${player1}, ${player2}',
        },
        unknownMeteors: {
          en: '??? Meteors (${player1}, ${player2})',
          ja: '??? 隕石 (${player1}, ${player2})',
          ko: '??? 메테오 (${player1}, ${player2})',
        },
        meteors: {
          en: 'Meteors: ${player1}, ${player2}',
          ja: '隕石: ${player1}, ${player2}',
          ko: '메테오: ${player1}, ${player2}',
        },
      },
    },
    {
      id: 'DSR Sanctity of the Ward Meteor You',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.phase === 'thordan' && data.me === matches.target,
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
      id: 'DSR Broad Swing Right',
      type: 'StartsUsing',
      netRegex: { id: '63C0', source: 'King Thordan', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'DSR Broad Swing Left',
      type: 'StartsUsing',
      netRegex: { id: '63C1', source: 'King Thordan', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'DSR Dive From Grace Number',
      // This comes out ~5s before symbols.
      type: 'HeadMarker',
      netRegex: {},
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.dot1) {
          data.diveFromGraceNum[matches.target] = 1;
          if (matches.target === data.me)
            return output.num1!();
        } else if (id === headmarkers.dot2) {
          data.diveFromGraceNum[matches.target] = 2;
          if (matches.target === data.me)
            return output.stackNorthNum!({ num: output.num2!() });
        } else if (id === headmarkers.dot3) {
          data.diveFromGraceNum[matches.target] = 3;
          if (matches.target === data.me)
            return output.stackNorthNum!({ num: output.num3!() });
        }
      },
      outputStrings: {
        num1: Outputs.num1,
        num2: Outputs.num2,
        num3: Outputs.num3,
        stackNorthNum: {
          en: '${num} (stack North)',
          ja: '${num} (北で頭割り)',
          ko: '${num}번, 북으로',
        },
      },
    },
    {
      id: 'DSR Dive From Grace Dir Collect',
      type: 'GainsEffect',
      // AC3 = High Jump Target
      // AC4 = Spineshatter Dive Target
      // AC5 = Elusive Jump Target
      netRegex: { effectId: ['AC3', 'AC4', 'AC5'] },
      run: (data, matches) => {
        if (matches.effectId === 'AC4' || matches.effectId === 'AC5') {
          const duration = parseFloat(matches.duration);
          // These come out in 9, 19, 30 seconds.
          if (duration < 15)
            data.diveFromGraceHasArrow[1] = true;
          else if (duration < 25)
            data.diveFromGraceHasArrow[2] = true;
          else
            data.diveFromGraceHasArrow[3] = true;
        }
        // Store result for position callout
        switch (matches.effectId) {
          case 'AC3':
            data.diveFromGraceDir[matches.target] = 'circle';
            break;
          case 'AC4':
            data.diveFromGraceDir[matches.target] = 'up';
            break;
          case 'AC5':
            data.diveFromGraceDir[matches.target] = 'down';
            break;
        }
      },
    },
    {
      id: 'DSR Dive From Grace Dir You',
      type: 'GainsEffect',
      // AC3 = High Jump Target
      // AC4 = Spineshatter Dive Target
      // AC5 = Elusive Jump Target
      netRegex: { effectId: ['AC3', 'AC4', 'AC5'] },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.5,
      durationSeconds: 5,
      alertText: (data, _matches, output) => {
        const num = data.diveFromGraceNum[data.me];
        if (!num) {
          console.error(`DFGYou: missing number: ${JSON.stringify(data.diveFromGraceNum)}`);
          return;
        }

        if (data.diveFromGraceDir[data.me] === 'up')
          return output.upArrow!({ num: num });
        else if (data.diveFromGraceDir[data.me] === 'down')
          return output.downArrow!({ num: num });

        if (data.diveFromGraceHasArrow[num])
          return output.circleWithArrows!({ num: num });

        const circles: string[] = [];
        Object.entries(data.diveFromGraceNum).forEach(([kn, vn]) => {
          if (vn === num)
            circles.push(kn);
        });

        if (data.prsParty !== undefined) {
          const members = data.prsParty.filter((e) => circles.includes(e.n));
          const sorted = members.sort((a, b) => a.ni - b.ni).map((e) => e.r);
          return output.circleAllCircles!({ num: num, circles: sorted.join(', ') });
        }

        const ss = circles.map((e) => data.party.member(e));
        return output.circleAllCircles!({ num: num, circles: ss.join(', ') });
      },
      outputStrings: {
        circleAllCircles: {
          en: '#${num} All Circles (${circles})',
          ja: '#${num} みんなハイジャンプ (${circles})',
          ko: '#${num} 모두🟢 (${circles})',
        },
        circleWithArrows: {
          en: '#${num} Circle (with arrows)',
          ja: '#${num} 自分のみハイジャンプ',
          ko: '#${num} 나만🔴',
        },
        upArrow: {
          en: '#${num} Up Arrow',
          ja: '#${num} 上矢印 / スパインダイブ',
          ko: '#${num} 🡹/동쪽',
        },
        downArrow: {
          en: '#${num} Down Arrow',
          ja: '#${num} 下矢印 / イルーシヴジャンプ',
          ko: '#${num} 🡻/서쪽',
        },
      },
    },
    {
      id: 'DSR Gnash and Lash',
      type: 'StartsUsing',
      // 6712 = Gnash and Lash (out then in)
      // 6713 = Lash and Gnash (in then out)
      netRegex: { id: ['6712', '6713'], source: 'Nidhogg' },
      durationSeconds: 5,
      alertText: (data, matches, output) => {
        const key = matches.id === '6712' ? 'out' : 'in';
        const inout = output[key]!();
        data.diveFromGraceLashGnashKey = key;

        const num = data.diveFromGraceNum[data.me];
        if (num !== 1 && num !== 2 && num !== 3) {
          console.error(
            `DSR Gnash and Lash: missing number: ${JSON.stringify(data.diveFromGraceNum)}`,
          );
          return inout;
        }

        // Special case for side ones baiting the two towers.
        if (
          data.eyeOfTheTyrantCounter === 1 && num === 1 &&
          data.diveFromGracePreviousPosition[data.me] !== 'middle'
        )
          return output.baitStackInOut!({ inout: inout });

        // Filter out anybody who needs to be stacking.
        const firstStack = data.eyeOfTheTyrantCounter === 0 && num !== 1;
        const secondStack = data.eyeOfTheTyrantCounter === 1 && num !== 3;
        if (firstStack || secondStack)
          return output.stackInOut!({ inout: inout });

        // Call out all circles.
        if (!data.diveFromGraceHasArrow[num]) {
          return {
            1: output.circlesDive1!({ inout: inout }),
            2: inout, // this shouldn't happen, but TypeScript wants this key
            3: output.circlesDive3!({ inout: inout }),
          }[num];
        }

        // Remaining people are arrow dives.
        if (num === 1) {
          if (data.diveFromGraceDir[data.me] === 'circle')
            return output.southDive1!({ inout: inout });
          if (data.diveFromGraceDir[data.me] === 'up')
            return output.upArrowDive1!({ inout: inout });
          if (data.diveFromGraceDir[data.me] === 'down')
            return output.downArrowDive1!({ inout: inout });
        } else if (num === 3) {
          if (data.diveFromGraceDir[data.me] === 'circle')
            return output.southDive3!({ inout: inout });
          if (data.diveFromGraceDir[data.me] === 'up')
            return output.upArrowDive3!({ inout: inout });
          if (data.diveFromGraceDir[data.me] === 'down')
            return output.downArrowDive3!({ inout: inout });
        }

        // If things have gone awry, at least output something.
        return inout;
      },
      // The 2 dives are called after the in/out occurs.
      // The 1+3 dives get separate output strings here in case somebody has a weird strat
      // that does different things for them and want better output strings.
      // The idea here is that folks can rename "Up Arrow Dive" to "East Dive" depending on
      // which way their strat wants them to look.
      // TODO: should we warn the south tower here? e.g. Stack => Out => South Tower?
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        stackInOut: {
          en: 'Stack => ${inout}',
          ja: '頭割り => ${inout}',
          ko: '뭉쳤다 → ${inout}',
        },
        baitStackInOut: {
          en: 'Bait => Stack => ${inout}',
          ja: '誘導 => 頭割り => ${inout}',
          ko: '게이른 미끼 → 뭉치고 → ${inout}',
        },
        circlesDive1: {
          en: 'Dive (all circles) => ${inout}',
          ja: 'ダイブ (みんなハイジャ) => ${inout}',
          ko: '모두🟢 다이브 → ${inout}',
        },
        circlesDive3: {
          en: 'Dive (all circles) => ${inout}',
          ja: 'ダイブ (みんなハイジャ) => ${inout}',
          ko: '모두🟢 다이브 → ${inout}',
        },
        southDive1: {
          en: 'South Dive => ${inout}',
          ja: '南ダイブ => ${inout}',
          ko: '남쪽 다이브 → ${inout}',
        },
        southDive3: {
          en: 'South Dive => ${inout}',
          ja: '南ダイブ => ${inout}',
          ko: '남쪽 다이브 → ${inout}',
        },
        upArrowDive1: {
          en: 'Up Arrow Dive => ${inout}',
          ja: '上矢印 => ${inout}',
          ko: '🡹 다이브 → ${inout}',
        },
        upArrowDive3: {
          en: 'Up Arrow Dive => ${inout}',
          ja: '上矢印 => ${inout}',
          ko: '🡹 다이브 → ${inout}',
        },
        downArrowDive1: {
          en: 'Down Arrow Dive => ${inout}',
          ja: '下矢印 => ${inout}',
          ko: '🡻 다이브 → ${inout}',
        },
        downArrowDive3: {
          en: 'Down Arrow Dive => ${inout}',
          ja: '下矢印 => ${inout}',
          ko: '🡻 다이브 → ${inout}',
        },
      },
    },
    {
      id: 'DSR Lash Gnash Followup',
      type: 'Ability',
      // 6715 = Gnashing Wheel
      // 6716 = Lashing Wheel
      netRegex: { id: ['6715', '6716'], source: 'Nidhogg' },
      // These are ~3s apart.  Only call after the first (and ignore multiple people getting hit).
      suppressSeconds: 6,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          out: Outputs.out,
          in: Outputs.in,
          inOutAndBait: {
            en: '${inout} + Bait',
            ja: '${inout} + 誘導',
            ko: '${inout} + 게이른 미끼',
          },
          circlesDive2: {
            en: '${inout} => Dive (all circles)',
            ja: '${inout} => ダイブ (みんなハイジャ)',
            ko: '${inout} → 모두🟢 다이브',
          },
          upArrowDive2: {
            en: '${inout} => Up Arrow Dive',
            ja: '${inout} => 上矢印',
            ko: '${inout} → 🡹 다이브',
          },
          downArrowDive2: {
            en: '${inout} => Down Arrow Dive',
            ja: '${inout} => 下矢印',
            ko: '${inout} → 🡻 다이브',
          },
        };

        const key = matches.id === '6715' ? 'in' : 'out';
        const inout = output[key]!();
        data.diveFromGraceLashGnashKey = key;

        const num = data.diveFromGraceNum[data.me];
        if (num === undefined) {
          // Don't print a console error here because this response gets eval'd as part
          // of the config ui and testing.  We'll get errors elsewhere if needed.
          // TODO: maybe have a better way to know if we're in the middle of testing?
          return { infoText: inout };
        }

        if (data.eyeOfTheTyrantCounter === 1) {
          if (num === 2) {
            if (!data.diveFromGraceHasArrow[num])
              return { alertText: output.circlesDive2!({ inout: inout }) };
            if (data.diveFromGraceDir[data.me] === 'up')
              return { alertText: output.upArrowDive2!({ inout: inout }) };
            if (data.diveFromGraceDir[data.me] === 'down')
              return { alertText: output.downArrowDive2!({ inout: inout }) };
          } else if (num === 3) {
            return { alertText: output.inOutAndBait!({ inout: inout }) };
          }
        } else if (data.eyeOfTheTyrantCounter === 2) {
          if (num === 2 || num === 1 && data.diveFromGracePreviousPosition[data.me] === 'middle')
            return { alertText: output.inOutAndBait!({ inout: inout }) };
        }

        // Otherwise, just tell the remaining people the dodge.
        return { infoText: inout };
      },
    },
    {
      id: 'DSR Dive From Grace Dive Collect',
      // 670E Dark High Jump
      // 670F Dark Spineshatter Dive
      // 6710 Dark Elusive Jump
      // Collect players hit by dive
      type: 'Ability',
      netRegex: { id: ['670E', '670F', '6710'], source: 'Nidhogg' },
      run: (data, matches) => {
        const posX = parseFloat(matches.targetX);
        data.diveFromGracePositions[matches.target] = posX;
      },
    },
    {
      id: 'DSR Dive From Grace Post Stack',
      // Triggered on first instance of Eye of the Tyrant (6714)
      type: 'Ability',
      netRegex: { id: '6714', source: 'Nidhogg', capture: false },
      // Ignore targetIsYou() incase player misses stack
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const num = data.diveFromGraceNum[data.me];
        if (!num) {
          console.error(
            `DFG Tower 1 Reminder: missing number: ${JSON.stringify(data.diveFromGraceNum)}`,
          );
          return;
        }

        const inout = output[data.diveFromGraceLashGnashKey]!();

        if (data.eyeOfTheTyrantCounter === 1) {
          // Tower 1 soaks only based on debuffs.
          if (num === 3) {
            if (data.diveFromGraceDir[data.me] === 'circle') {
              if (data.diveFromGraceHasArrow[3])
                return output.southTower1!({ inout: inout });
              return output.circleTowers1!({ inout: inout });
            } else if (data.diveFromGraceDir[data.me] === 'up') {
              return output.upArrowTower1!({ inout: inout });
            } else if (data.diveFromGraceDir[data.me] === 'down') {
              return output.downArrowTower1!({ inout: inout });
            }
            return output.unknownTower!({ inout: inout });
          }
          // Folks who could be placing a two tower here just get
          // the normal "in" or "out" below, and the Lash Gnash Followup
          // will say "In => Up Arrow Tower" as a reminder.
        } else if (data.eyeOfTheTyrantCounter === 2) {
          // Tower 3 soaks based on debuffs and previous positions.
          const pos = data.diveFromGracePreviousPosition[data.me];
          if (num === 1) {
            if (pos === 'middle')
              return output.southTower3!({ inout: inout });
            // Already soaked the number two towers.
            if (pos === 'east' || pos === 'west')
              return;
          } else if (num === 2) {
            if (pos === 'west')
              return output.westTower3!({ inout: inout });
            if (pos === 'east')
              return output.eastTower3!({ inout: inout });
          } else if (num === 3) {
            return;
          }
          return output.unknownTower!({ inout: inout });
        }

        // Anybody who isn't placing or taking a tower here just gets a "in/out" reminder.
        return inout;
      },
      outputStrings: {
        unknown: Outputs.unknown,
        in: Outputs.in,
        out: Outputs.out,
        unknownTower: {
          en: 'Tower (${inout})',
          ja: '塔 (${inout})',
          ko: '타워 (${inout})',
        },
        southTower1: {
          en: 'South Tower (${inout})',
          ja: '南塔 (${inout})',
          ko: '남쪽 타워 (${inout})',
        },
        southTower3: {
          en: 'South Tower (${inout})',
          ja: '南塔 (${inout})',
          ko: '남쪽 타워 (${inout})',
        },
        circleTowers1: {
          en: 'Tower (all circles, ${inout})',
          ja: '塔 (みんなハイジャ、${inout})',
          ko: '타워 (모두🟢, ${inout})',
        },
        circleTowers3: {
          en: 'Tower (all circles, ${inout})',
          ja: '塔 (みんなハイジャ、${inout})',
          ko: '타워 (모두🟢, ${inout})',
        },
        upArrowTower1: {
          en: 'Up Arrow Tower (${inout})',
          ja: '上矢印の塔 (${inout})',
          ko: '🡹 타워 (${inout})',
        },
        downArrowTower1: {
          en: 'Down Arrow Tower (${inout})',
          ja: '下矢印の塔 (${inout})',
          ko: '🡻 타워 ( ${inout})',
        },
        upArrowTower3: {
          en: 'Up Arrow Tower (${inout})',
          ja: '上矢印の塔 (${inout})',
          ko: '🡹 타워 (${inout})',
        },
        downArrowTower3: {
          en: 'Down Arrow Tower (${inout})',
          ja: '下矢印の塔 (${inout})',
          ko: '🡻 타워 ( ${inout})',
        },
        westTower3: {
          en: 'West Tower (${inout})',
          ja: '東塔 (${inout})',
          ko: '동쪽 타워 (${inout})',
        },
        eastTower3: {
          en: 'East Tower (${inout})',
          ja: '西塔 (${inout})',
          ko: '서쪽 타워 (${inout})',
        },
      },
    },
    {
      id: 'DSR Dive From Grace Post Dive',
      // 670E Dark High Jump
      // 670F Dark Spineshatter Dive
      // 6710 Dark Elusive Jump
      // Defaults:
      //   High Jump South if solo, no assignment if all circle
      //   Assumes North Party Stack
      type: 'Ability',
      netRegex: { id: ['670E', '670F', '6710'], source: 'Nidhogg', capture: false },
      preRun: (data) => data.diveFromGraceTowerCounter = (data.diveFromGraceTowerCounter ?? 0) + 1,
      delaySeconds: 0.2,
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        const num = data.diveFromGraceNum[data.me];
        if (!num) {
          console.error(
            `DFG Tower 1 and 2: missing number: ${JSON.stringify(data.diveFromGraceNum)}`,
          );
          return;
        }

        // Sorted from west to east, and filled in with unknown if missing.
        const [nameA, nameB, nameC] = [
          ...Object.keys(data.diveFromGracePositions).sort((keyA, keyB) => {
            const posA = data.diveFromGracePositions[keyA];
            const posB = data.diveFromGracePositions[keyB];
            if (posA === undefined || posB === undefined)
              return 0;
            return posA - posB;
          }),
          output.unknown!(),
          output.unknown!(),
          output.unknown!(),
        ];

        // Dive 1 and Dive 3 have 3 players
        if (data.diveFromGraceTowerCounter !== 2) {
          data.diveFromGracePreviousPosition[nameA] = 'west';
          data.diveFromGracePreviousPosition[nameB] = 'middle';
          data.diveFromGracePreviousPosition[nameC] = 'east';
        } else {
          data.diveFromGracePreviousPosition[nameA] = 'west';
          data.diveFromGracePreviousPosition[nameB] = 'east';
        }

        if (num === 1 && data.diveFromGraceTowerCounter === 2) {
          if (data.diveFromGracePreviousPosition[data.me] === 'west')
            return output.northwestTower2!();
          if (data.diveFromGracePreviousPosition[data.me] === 'east')
            return output.northeastTower2!();
          if (data.diveFromGracePreviousPosition[data.me] === 'middle')
            return;
          return output.unknownTower!();
        }
      },
      run: (data) => data.diveFromGracePositions = {},
      outputStrings: {
        unknown: Outputs.unknown,
        unknownTower: {
          en: 'Tower',
          ja: '塔',
          ko: '타워',
        },
        northwestTower2: {
          en: 'Northwest Tower',
          ja: '北東塔',
          ko: '북동 타워',
        },
        northeastTower2: {
          en: 'Northeast Tower',
          ja: '北西塔',
          ko: '북서 타워',
        },
      },
    },
    {
      id: 'DSR Darkdragon Dive Single Tower',
      type: 'Ability',
      netRegex: { id: '6711', source: 'Nidhogg' },
      condition: Conditions.targetIsYou(),
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        const num = data.diveFromGraceNum[data.me];
        if (!num) {
          console.error(
            `DFG Dive Single Tower: missing number: ${JSON.stringify(data.diveFromGraceNum)}`,
          );
          return output.text!();
        }
        // To condense messages, two tower baiters get this call during the gnash and lash.
        if (data.diveFromGraceTowerCounter === 2) {
          data.stackAfterGeirskogul = true;
          return;
        }
        return output.text!();
      },
      run: (data) => data.waitingForGeirskogul = true,
      outputStrings: {
        text: {
          en: 'Bait',
          ja: '誘導',
          ko: '게이른 미끼!',
        },
      },
    },
    {
      id: 'DSR Geirskogul',
      type: 'StartsUsing',
      netRegex: { id: '670A', source: 'Nidhogg', capture: false },
      condition: (data) => data.waitingForGeirskogul,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.waitingForGeirskogul)
          return;
        // Two tower baiters need to quickly get to the stack here.
        if (data.stackAfterGeirskogul) {
          const inout = output[data.diveFromGraceLashGnashKey]!();
          return output.stackInOut!({ inout: inout });
        }
        return output.move!();
      },
      run: (data) => {
        delete data.waitingForGeirskogul;
        delete data.stackAfterGeirskogul;
      },
      outputStrings: {
        in: Outputs.in,
        out: Outputs.out,
        unknown: Outputs.unknown,
        stackInOut: {
          en: 'Stack => ${inout}',
          ja: '頭割り => ${inout}',
          ko: '뭉치고 → ${inout}',
        },
        move: Outputs.moveAway,
      },
    },
    {
      id: 'DSR Drachenlance',
      type: 'StartsUsing',
      netRegex: { id: '670C', source: 'Nidhogg', capture: false },
      // This could be "out of front" as sides are safe but this is urgent, so be more clear.
      response: Responses.getBehind(),
    },
    {
      id: 'DSR PR 니드 줄을 채야해',
      type: 'StartsUsing',
      netRegex: { id: '670C', source: 'Nidhogg', capture: false },
      condition: (data) => data.role === 'tank' && !data.prsSeenNidTether,
      delaySeconds: 10.3,
      durationSeconds: 6,
      alertText: (data, _matches, output) => {
        if (data.prsParty === undefined || data.prsTetherTarget === undefined)
          return;
        if (data.me === data.prsTetherTarget)
          return output.itsmine!();
        for (const i of data.prsParty) {
          if (i.n === data.prsTetherTarget)
            return output.wheremine!({ pos: i.nt, role: i.r });
        }
      },
      outputStrings: {
        wheremine: {
          en: 'Catch tether: ${pos} (${role})',
          ja: '線取り: ${pos} (${role})',
          ko: '줄 채기: ${pos} (${role})',
        },
        itsmine: {
          en: 'Tether on YOU!',
          ja: '線持っている!',
          ko: '줄 갖고 있네!',
        },
      },
    },
    {
      id: 'DSR PR 니드 줄은 어디에',
      type: 'StartsUsing',
      netRegex: { id: '670C', source: 'Nidhogg', capture: false },
      condition: (data) => data.role === 'tank' && !data.prsSeenNidTether,
      delaySeconds: 10.5,
      durationSeconds: 4,
      infoText: (data, _matches, output) => {
        if (data.prsTethers.length < 2)
          return;
        if (data.prsParty !== undefined) {
          const [t1, t2] = data.prsTethers.splice(-2);
          const [m1, m2] = data.prsParty.filter((e) => e.n === t1 || e.n === t2)
            .sort((a, b) => a.i - b.i);
          return output.tether!({ tether1: m1?.r, tether2: m2?.r });
        }
        const [s1, s2] = data.prsTethers.slice(-2).map((e) => data.party.member(e));
        return output.tether!({ tether1: s1, tether2: s2 });
      },
      run: (data) => data.prsSeenNidTether = true,
      outputStrings: {
        tether: {
          en: '${tether1}, ${tether2}',
          ja: '${tether1}, ${tether2}',
          ko: '${tether1}, ${tether2}',
        },
      },
    },
    {
      id: 'DSR PR 니드 줄 처리 종료',
      type: 'StartsUsing',
      netRegex: { id: '7436', source: 'Nidhogg', capture: false },
      run: (data, _matches, _output) => {
        data.prsTethers = [];
        delete data.prsTetherId;
        delete data.prsTetherTarget;
      },
    },
    {
      id: 'DSR Right Eye Blue Tether',
      type: 'Tether',
      netRegex: { id: '0033' },
      condition: (data, matches) => matches.source === data.me,
      // Have blue/red be different alert/info to differentiate.
      // Since dives are usually blue people dropping off their blue tether
      // to a red person (who needs to run in), make the blue tether
      // the higher severity one.
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Blue',
          ja: '青',
          ko: '파란🟦줄',
        },
      },
    },
    {
      id: 'DSR Left Eye Red tether',
      type: 'Tether',
      netRegex: { id: '0034' },
      condition: (data, matches) => matches.source === data.me,
      // See note above on Right Eye Blue Tether.
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Red',
          ja: '赤',
          ko: '빨간🟥줄',
        },
      },
    },
    {
      id: 'DSR Eyes Dive Cast',
      type: 'StartsUsing',
      netRegex: { id: '68C3', source: ['Right Eye', 'Left Eye'], capture: false },
      // One cast for each dive.  68C3 is the initial cast/self-targeted ability.
      // 68C4 is the damage on players.
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Dives Soon',
          ja: 'まもなくダイブ',
          ko: '곧 다이브!',
        },
      },
    },
    {
      id: 'DSR Eyes Dive Counter',
      type: 'Ability',
      // TODO: should this call out who it was on? some strats involve the
      // first dive targets swapping with the third dive targets.
      netRegex: { id: '68C4', source: 'Nidhogg', capture: false },
      // One ability for each player hit.
      suppressSeconds: 1,
      infoText: (data, _matches, output) => output[`dive${data.diveCounter}`]!(),
      run: (data) => data.diveCounter++,
      outputStrings: {
        dive1: Outputs.num1,
        dive2: Outputs.num2,
        dive3: Outputs.num3,
        dive4: Outputs.num4,
      },
    },
    {
      id: 'DSR Eyes Steep in Rage',
      type: 'StartsUsing',
      netRegex: { id: '68BD', source: ['Right Eye', 'Left Eye'], capture: false },
      // Each of the eyes (if alive) will start this aoe.  It has the same id from each eye.
      suppressSeconds: 1,
      response: Responses.bigAoe('alert'),
    },
    {
      id: 'DSR Right Eye Reminder',
      type: 'StartsUsing',
      // If the Right Eye is dead and the Left Eye gets the aoe off, then the Right Eye
      // will be revived and you shouldn't forget about it.
      netRegex: { id: '68BD', source: 'Left Eye' },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill Right Eye',
          ja: '右目を攻撃',
          ko: '오른쪽 눈깔 잡아요',
        },
      },
    },
    {
      id: 'DSR Spear of the Fury Limit Break',
      type: 'StartsUsing',
      netRegex: { id: '62E2', source: 'Ser Zephirin', capture: false },
      // This ability also happens in doorboss phase.
      condition: (data) => data.role === 'tank' && data.phase === 'haurchefant',
      // This is a 10 second cast, and (from video) my understanding is to
      // hit tank LB when the cast bar gets to the "F" in "Fury", which is
      // roughly 2.8 seconds before it ends.
      delaySeconds: 10 - 2.8,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'TANK LB!!',
          ja: 'タンクLB!!',
          ko: '탱크 리미트브레이크!!',
        },
      },
    },
    {
      id: 'DSR Twisting Dive',
      type: 'Ability',
      netRegex: { id: '6B8B', source: 'Vedrfolnir', capture: false },
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (!data.prsSeenTwister) {
          data.prsSeenTwister = true;
          return output.withAscalon!();
        }
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Twisters',
          ja: 'ツイスター',
          ko: '🌪트위스터!',
        },
        withAscalon: {
          en: 'Twisters + Ascalon',
          ja: 'ツイスター + アスカロン',
          ko: '🌪트위스터 + 아스칼론!',
        },
      },
    },
    {
      id: 'DSR Wrath Spiral Pierce',
      type: 'Tether',
      netRegex: { id: '0005' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Tether on YOU',
          ja: '自分に線',
          ko: '내게 줄이!',
        },
      },
    },
    {
      id: 'DSR Wrath Skyward Leap',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        // The Wrath of the Heavens skyward leap is a different headmarker.
        if (id === headmarkers.skywardSingle)
          return output.leapOnYou!();
      },
      outputStrings: {
        leapOnYou: {
          en: 'Leap on YOU',
          ja: '自分に青マーカー',
          ko: '🟦파란거네!',
        },
      },
    },
    {
      id: 'DSR Wrath Thunderstruck',
      // This is effectId B11, but the timing is somewhat inconsistent based on statuses rolling out.
      // Use the Chain Lightning ability instead.
      type: 'Ability',
      netRegex: { id: '6B8F', source: 'Darkscale' },
      // Call this after, which is ~2.3s after this ability.
      // This avoids people with itchy feet running when they hear something.
      delaySeconds: 2.5,
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text!();
      },
      run: (data, matches) => data.thunderstruck.push(matches.target),
      outputStrings: {
        text: {
          en: 'Thunder on YOU',
          ja: '自分に雷',
          ko: '내게 ⚡번개가!',
        },
      },
    },
    {
      id: 'DSR Wrath Thunderstruck Targets',
      type: 'Ability',
      netRegex: { id: '6B8F', source: 'Darkscale', capture: false },
      delaySeconds: 2.8,
      suppressSeconds: 1,
      // This is just pure extra info, no need to make noise for people.
      sound: '',
      infoText: (data, _matches, output) => {
        // In case somebody wants to do some "go in the order cactbot tells you" sort of strat.
        const [fullName1, fullName2] = data.thunderstruck.sort();
        if (data.prsParty !== undefined) {
          const [m1, m2] = data.prsParty.filter((e) => e.n === fullName1 || e.n === fullName2);
          if (m1 !== undefined && m2 !== undefined) {
            if (m1.i < m2.i)
              return output.text!({ name1: m1.r, name2: m2.r });
            return output.text!({ name1: m2.r, name2: m1.r });
          }
        }
        const name1 = data.party.member(fullName1);
        const name2 = data.party.member(fullName2);
        return output.text!({ name1: name1, name2: name2 });
      },
      // Sorry tts players, but "Thunder on YOU" and "Thunder: names" are too similar.
      tts: null,
      outputStrings: {
        text: {
          en: 'Thunder: ${name1}, ${name2}',
          ja: '雷: ${name1}, ${name2}',
          ko: '⚡: ${name1}, ${name2}',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'DSR Wrath Cauterize Marker',
      type: 'HeadMarker',
      netRegex: {},
      condition: Conditions.targetIsYou(),
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.cauterize)
          return output.diveOnYou!();
      },
      outputStrings: {
        diveOnYou: {
          en: 'Divebomb (opposite warrior)',
          ja: '自分にダイブ (杖の後ろ)',
          ko: '내게 💥카탈라이즈! 지팡이 뒤로!',
        },
      },
    },
    {
      id: 'DSR Doom Gain',
      type: 'GainsEffect',
      netRegex: { effectId: 'BA0' },
      preRun: (data, matches) => data.hasDoom[matches.target] = true,
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.doomOnYou!();
      },
      infoText: (data, _matches, output) => {
        const dooms = Object.keys(data.hasDoom).filter((x) => data.hasDoom[x]);
        if (dooms.length !== 4 || dooms.includes(data.me))
          return;
        return output.noDoom!();
      },
      outputStrings: {
        doomOnYou: {
          en: 'Doom on YOU',
          ja: '自分に死の宣告',
          ko: '내게 💀둠이!',
        },
        noDoom: {
          en: 'No Doom',
          ja: '自分は無職',
          ko: '둠 없어욧!',
        },
      },
    },
    {
      id: 'DSR PR 헤븐데스 순번 찾기',
      type: 'Ability',
      netRegex: { id: '6B92', source: 'King Thordan', capture: false },
      // Death of the Heavens + 12초
      delaySeconds: 9,
      infoText: (data, _matches, output) => {
        if (data.prsParty === undefined || data.prsMe === undefined)
          return;

        let dests: PrsMember[];
        let pos: string;
        if (data.hasDoom[data.me]) {
          dests = data.prsParty.filter((x) => data.hasDoom[x.n]);
          pos = output.doom!();
        } else {
          dests = data.prsParty.filter((x) => !data.hasDoom[x.n]);
          pos = output.nodoom!();
        }
        if (dests.length !== 4)
          return;

        const sorted = dests.sort((a, b) => a.wi - b.wi);
        const num = sorted.indexOf(data.prsMe) + 1;
        if (num > 0)
          return output.mynum!({ pos: pos, num: num });

        const teams = sorted.map((e) => e.r);
        return output.teams!({ pos: pos, teams: teams.join(', ') });
      },
      outputStrings: {
        teams: {
          en: '${pos}: ${teams}',
          ja: '${pos}: ${teams}',
          ko: '${pos}: ${teams}',
        },
        mynum: {
          en: '${pos}: ${num}',
          ja: '${pos}: ${num}',
          ko: '${pos}: ${num}번',
        },
        doom: {
          en: 'Doom',
          ja: '💀死',
          ko: '💀둠',
        },
        nodoom: {
          en: 'Safe',
          ja: '安全',
          ko: '안전',
        },
      },
    },
    {
      id: 'DSR Playstation2 Fire Chains',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.phase === 'thordan2',
      alertText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        const marker = playstationMarkerMap[id];
        if (marker === undefined)
          return;

        data.deathMarker[matches.target] = marker;

        if (data.me !== matches.target)
          return;

        // Note: in general, both circles should always have Doom and both crosses
        // should not have Doom.  If one doom dies, it seems that crosses are
        // removed and there's a double triangle non-doom.  If enough people die,
        // anything can happen.  For example, in P1 tanks can get circles if enough people are dead.

        if (data.hasDoom[data.me]) {
          if (marker === 'circle')
            return output.circleWithDoom!();
          else if (marker === 'triangle')
            return output.triangleWithDoom!();
          else if (marker === 'square')
            return output.squareWithDoom!();
          else if (marker === 'cross')
            return output.crossWithDoom!();
        } else {
          if (marker === 'circle')
            return output.circle!();
          else if (marker === 'triangle')
            return output.triangle!();
          else if (marker === 'square')
            return output.square!();
          else if (marker === 'cross')
            return output.cross!();
        }
      },
      outputStrings: {
        circle: {
          en: 'Red Circle',
          ja: '赤まる',
          ko: '🔴빨강',
        },
        triangle: {
          en: 'Green Triangle',
          ja: '緑さんかく',
          ko: '▲초록',
        },
        square: {
          en: 'Purple Square',
          ja: '紫しかく',
          ko: '🟪보라',
        },
        cross: {
          en: 'Blue X',
          ja: '青バツ',
          ko: '➕파랑',
        },
        circleWithDoom: {
          en: 'Red Circle (Doom)',
          ja: '赤まる (死の宣告)',
          ko: '🔴빨강 + 💀',
        },
        triangleWithDoom: {
          en: 'Green Triangle (Doom)',
          ja: '緑さんかく (死の宣告)',
          ko: '▲초록 + 💀',
        },
        squareWithDoom: {
          en: 'Purple Square (Doom)',
          ja: '紫しかく (死の宣告)',
          ko: '🟪보라 + 💀',
        },
        crossWithDoom: {
          en: 'Blue X (Doom)',
          ja: '青バツ(死の宣告)',
          ko: '➕파랑 + 💀',
        },
      },
    },
    {
      // If one doom person dies, then there will be an unmarked non-doom player (cross)
      // and two non-doom players who will get the same symbol (triangle OR square).
      // If there's more than two symbols missing this is probably a wipe,
      // so don't bother trying to call out "unmarked circle or square".
      // TODO: should we run this on Playstation1 as well (and consolidate triggers?)
      id: 'DSR Playstation2 Fire Chains No Marker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) =>
        data.phase === 'thordan2' &&
        playstationHeadmarkerIds.includes(getHeadmarkerId(data, matches)),
      delaySeconds: 0.5,
      suppressSeconds: 5,
      alarmText: (data, _matches, output) => {
        if (data.deathMarker[data.me] !== undefined)
          return;

        const seenMarkers = Object.values(data.deathMarker);
        const markers = [...playstationMarkers].filter((x) => !seenMarkers.includes(x));

        const [marker] = markers;
        if (marker === undefined || markers.length !== 1)
          return;

        // Note: this will still call out for the dead doom person, but it seems better
        // in case they somehow got insta-raised.
        if (data.hasDoom[data.me]) {
          if (marker === 'circle')
            return output.circleWithDoom!();
          else if (marker === 'triangle')
            return output.triangleWithDoom!();
          else if (marker === 'square')
            return output.squareWithDoom!();
          else if (marker === 'cross')
            return output.crossWithDoom!();
        } else {
          if (marker === 'circle')
            return output.circle!();
          else if (marker === 'triangle')
            return output.triangle!();
          else if (marker === 'square')
            return output.square!();
          else if (marker === 'cross')
            return output.cross!();
        }
      },
      outputStrings: {
        circle: {
          en: 'Unmarked Red Circle',
          ja: '無職で赤まる',
          ko: '(🔴빨강)',
        },
        triangle: {
          en: 'Unmarked Green Triangle',
          ja: '無職で緑さんかく',
          ko: '(▲초록)',
        },
        square: {
          en: 'Unmarked Purple Square',
          ja: '無職で紫しかく',
          ko: '(🟪보라)',
        },
        cross: {
          en: 'Unmarked Blue X',
          ja: '無職で青バツ',
          ko: '(➕파랑)',
        },
        circleWithDoom: {
          en: 'Unmarked Red Circle (Doom)',
          ja: '無職で赤まる (死の宣告)',
          ko: '(🔴빨강) + 💀',
        },
        triangleWithDoom: {
          en: 'Unmarked Green Triangle (Doom)',
          ja: '無職で緑さんかく (死の宣告)',
          ko: '(▲초록) + 💀',
        },
        squareWithDoom: {
          en: 'Unmarked Purple Square (Doom)',
          ja: '無職で紫しかく (死の宣告)',
          ko: '(🟪보라) + 💀',
        },
        crossWithDoom: {
          en: 'Unmarked Blue X (Doom)',
          ja: '無職で青バツ (死の宣告)',
          ko: '(➕파랑) + 💀',
        },
      },
    },
    {
      // This will only fire if you got a marker, so that it's mutually exclusive
      // with the "No Marker" trigger above.
      id: 'DSR Playstation2 Fire Chains Unexpected Pair',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        if (data.phase !== 'thordan2')
          return false;
        if (data.me !== matches.target)
          return false;
        return playstationHeadmarkerIds.includes(getHeadmarkerId(data, matches));
      },
      delaySeconds: 0.5,
      alarmText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        const myMarker = playstationMarkerMap[id];
        if (myMarker === undefined)
          return;

        // Find person with the same mark.
        let partner: string | undefined = undefined;
        for (const [player, marker] of Object.entries(data.deathMarker)) {
          if (player !== data.me && marker === myMarker) {
            partner = player;
            break;
          }
        }
        if (partner === undefined)
          return;

        // If a circle ends up with a non-doom or a cross ends up with a doom,
        // I think you're in serious unrecoverable trouble.  These people also
        // already need to look and adjust to the other person, vs the triangle
        // and square which can have a fixed position based on doom vs non-doom.
        if (myMarker === 'circle' || myMarker === 'cross')
          return;

        // I think circles fill out with doom first, so it should be impossible
        // to have two doom triangles or two doom squares as well.
        if (data.hasDoom[data.me] || data.hasDoom[partner])
          return;

        if (myMarker === 'triangle')
          return output.doubleTriangle!({ player: data.party.member(partner) });
        if (myMarker === 'square')
          return output.doubleSquare!({ player: data.party.member(partner) });
      },
      outputStrings: {
        // In case users want to have triangle vs square say something different.
        doubleTriangle: {
          en: 'Double Non-Doom (${player})',
          ja: '自分と相棒は死の宣告なし (${player})',
          ko: '둠 없음: ${player}',
        },
        doubleSquare: {
          en: 'Double Non-Doom (${player})',
          ja: '自分と相棒は死の宣告なし (${player})',
          ko: '둠 없음: ${player}',
        },
      },
    },
    {
      id: 'DSR Great Wyrmsbreath Hraesvelgr Not Glowing',
      type: 'StartsUsing',
      netRegex: { id: '6D34', source: 'Hraesvelgr', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tanksApart: {
            en: 'Apart (Hrae buster)',
            ja: '離れる (フレスから攻撃)',
            ko: '탱크 위치로! 흐레스벨그 버스터!',
          },
          hraesvelgrTankbuster: {
            en: 'Hrae Tankbuster',
            ja: 'フレスから攻撃',
            ko: '흐레스벨그 버스터',
          },
        };

        if (data.role === 'tank')
          return { alertText: output.tanksApart!() };
        return { infoText: output.hraesvelgrTankbuster!() };
      },
    },
    {
      id: 'DSR Great Wyrmsbreath Hraesvelgr Glowing',
      type: 'StartsUsing',
      netRegex: { id: '6D35', source: 'Hraesvelgr', capture: false },
      condition: (data) => data.role === 'tank',
      run: (data) => data.hraesvelgrGlowing = true,
    },
    {
      id: 'DSR Great Wyrmsbreath Nidhogg Not Glowing',
      type: 'StartsUsing',
      netRegex: { id: '6D32', source: 'Nidhogg', capture: false },
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tanksApart: {
            en: 'Apart (Nid buster)',
            ja: '離れる (ニーズから攻撃)',
            ko: '탱크 위치로! 니드호그 버스터!',
          },
          nidTankbuster: {
            en: 'Nid Tankbuster',
            ja: 'ニーズから攻撃',
            ko: '니드호그 버스터',
          },
        };

        if (data.role === 'tank')
          return { alertText: output.tanksApart!() };
        return { infoText: output.nidTankbuster!() };
      },
    },
    {
      id: 'DSR Great Wyrmsbreath Nidhogg Glowing',
      type: 'StartsUsing',
      netRegex: { id: '6D33', source: 'Nidhogg', capture: false },
      condition: (data) => data.role === 'tank',
      run: (data) => data.nidhoggGlowing = true,
    },
    {
      // Great Wyrmsbreath ids
      //   6D32 Nidhogg not glowing
      //   6D33 Nidhogg glowing
      //   6D34 Hraesvelgr not glowing
      //   6D35 Hraesvelgr glowing
      // Hraesvelger and Nidhogg are different actors so can go in either order.
      id: 'DSR Great Wyrmsbreath Both Glowing',
      type: 'StartsUsing',
      netRegex: { id: ['6D33', '6D35'], source: ['Hraesvelgr', 'Nidhogg'], capture: false },
      delaySeconds: 0.3,
      suppressSeconds: 1,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          sharedBuster: {
            en: 'Shared Buster',
            ja: 'タンク二人で頭割り',
            ko: '탱크 뭉쳐 버스터!',
          },
        };

        if (!data.hraesvelgrGlowing || !data.nidhoggGlowing)
          return;
        if (data.role === 'tank')
          return { alertText: output.sharedBuster!() };
        return { infoText: output.sharedBuster!() };
      },
      run: (data) => {
        delete data.hraesvelgrGlowing;
        delete data.nidhoggGlowing;
      },
    },
    {
      id: 'DSR Mortal Vow Collect',
      type: 'GainsEffect',
      netRegex: { effectId: 'B50' },
      suppressSeconds: 1,
      run: (data, matches) => data.mortalVowPlayer = matches.target,
    },
    {
      id: 'DSR Akh Afah',
      // 6D41 Akh Afah from Hraesvelgr, and 64D2 is immediately after
      // 6D43 Akh Afah from Nidhogg, and 6D44 is immediately after
      // Hits the two healers.  If a healer is dead, then the target is random.
      type: 'StartsUsing',
      netRegex: { id: ['6D41', '6D43'], source: ['Hraesvelgr', 'Nidhogg'], capture: false },
      suppressSeconds: 2,
      alertText: (_data, _matches, output) => output.groups!(),
      outputStrings: {
        groups: {
          en: 'Healer Groups',
          ja: 'ヒラに頭割り',
          ko: '아크아파! 힐러랑 뭉쳐욧!',
        },
      },
    },
    {
      id: 'DSR Adds Phase Nidhogg',
      type: 'AddedCombatant',
      // There are many Nidhoggs, but the real one (and the one that moves for cauterize) is npcBaseId=12612.
      netRegex: { npcNameId: '3458', npcBaseId: '12612' },
      run: (data, matches) => data.addsPhaseNidhoggId = matches.id,
    },
    {
      id: 'DSR Hallowed Wings and Plume',
      // Calls left and right while looking at Hraesvelgr.
      // 6D23 Head Down, Left Wing
      // 6D24 Head Up, Left Wing
      // 6D26 Head Down, Right Wing
      // 6D27 Head Up, Right Wing
      // Head Up = Tanks Far
      // Head Down = Tanks Near
      type: 'StartsUsing',
      netRegex: { id: ['6D23', '6D24', '6D26', '6D27'], source: 'Hraesvelgr' },
      preRun: (data) => data.hallowedWingsCount++,
      durationSeconds: 6,
      promise: async (data) => {
        data.combatantData = [];

        // TODO: implement Hot Tail/Hot Wing combination here
        if (data.hallowedWingsCount !== 1)
          return;

        // If we have missed the Nidhogg id (somehow?), we'll handle it later.
        const id = data.addsPhaseNidhoggId;
        if (id === undefined)
          return;

        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(id, 16)],
        })).combatants;

        if (data.combatantData.length === 0)
          console.error(`Hallowed: no Nidhoggs found`);
        else if (data.combatantData.length > 1)
          console.error(
            `Hallowed: unexpected number of Nidhoggs: ${JSON.stringify(data.combatantData)}`,
          );
      },
      alertText: (data, matches, output) => {
        const wings = matches.id === '6D23' || matches.id === '6D24'
          ? output.left!()
          : output.right!();
        let head;
        const isHeadDown = matches.id === '6D23' || matches.id === '6D26';
        if (isHeadDown)
          head = data.role === 'tank' ? output.tanksNear!() : output.partyFar!();
        else
          head = data.role === 'tank' ? output.tanksFar!() : output.partyNear!();

        const [nidhogg] = data.combatantData;
        if (nidhogg !== undefined && data.combatantData.length === 1) {
          // Nidhogg is at x = 100 +/- 11, y = 100 +/- 34
          const dive = nidhogg.PosX < 100 ? output.forward!() : output.backward!();
          return output.wingsDiveHead!({ wings: wings, dive: dive, head: head });
        }

        // If something has gone awry (or this is the second hallowed), call out what we can.
        if (data.hallowedWingsCount === 2) {
          if (data.role === 'tank')
            head = isHeadDown ? output.tanksFront!() : output.tanksBehind!();
          return output.wingsHeadLine!({ wings: wings, head: head });
        }
        return output.wingsHead!({ wings: wings, head: head });
      },
      outputStrings: {
        // The calls here assume that all players are looking at Hraesvelgr, and thus
        // "Forward" means east and "Backward" means west, and "Left" means
        // north and "Right" means south.  The cactbot UI could rename them if this
        // wording is awkward to some people.
        //
        // Also, in case somebody is raid calling, differentiate "Party Near" vs "Tanks Near".
        // This will also help in a rare edge case bug where sometimes people don't have the
        // right job, see: https://github.com/quisquous/cactbot/issues/4237.
        //
        // Yes, these are also tank busters, but there's too many things to call out here,
        // and this is a case of "tanks and healers need to know what's going on ahead of time".
        left: Outputs.left,
        right: Outputs.right,
        forward: Outputs.front,
        backward: Outputs.back,
        partyNear: {
          en: 'Party Near',
          ja: 'パーティが前へ',
          ko: '파티 가까이',
        },
        tanksNear: {
          en: 'Tanks Near',
          ja: 'タンクが前へ',
          ko: '가까이서 나란히',
        },
        partyFar: {
          en: 'Party Far',
          ja: 'パーティが後ろへ',
          ko: '파티 멀리',
        },
        tanksFar: {
          en: 'Tanks Far',
          ja: 'タンクが後ろへ',
          ko: '멀리서 나란히',
        },
        tanksFront: {
          en: 'Front party',
          ja: '一番前へ',
          ko: '맨 🡹앞으로',
        },
        tanksBehind: {
          en: 'Behind party',
          ja: '一番後ろへ',
          ko: '맨 뒤로🡻',
        },
        wingsHead: {
          en: '${wings}, ${head}',
          ja: '${wings}, ${head}',
          ko: '${wings}, ${head}',
        },
        wingsDiveHead: {
          en: '${wings} + ${dive}, ${head}',
          ja: '${wings} + ${dive}, ${head}',
          ko: '${wings}/${dive}, ${head}',
        },
        wingsHeadLine: {
          en: '${wings}, ${head}',
          ja: '${wings}, ${head}',
          ko: '한줄: ${wings}, ${head}',
        },
      },
    },
    {
      id: 'DSR Nidhogg Hot Wing',
      type: 'StartsUsing',
      netRegex: { id: '6D2B', source: 'Nidhogg', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Inside',
          ja: '内側へ',
          ko: '안으로! 날개!',
        },
      },
    },
    {
      id: 'DSR Nidhogg Hot Tail',
      type: 'StartsUsing',
      netRegex: { id: '6D2D', source: 'Nidhogg', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Outside',
          ja: '外側へ',
          ko: '바깥으로! 꼬리!',
        },
      },
    },
    {
      id: 'DSR Wyrmsbreath 2 Boiling and Freezing',
      type: 'GainsEffect',
      // B52 = Boiling
      // B53 = Freezing
      // TODO: Get cardinal of the dragon to stand in
      // TODO: Adjust delay to when the bosses jump to cardinal
      netRegex: { effectId: ['B52', 'B53'] },
      condition: Conditions.targetIsYou(),
      // Lasts 10.96s, but bosses do not cast Cauterize until 7.5s after debuff
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      infoText: (_data, matches, output) => {
        if (matches.effectId === 'B52')
          return output.hraesvelgr!();
        return output.nidhogg!();
      },
      outputStrings: {
        nidhogg: {
          en: 'Get hit by Nidhogg',
          ja: 'ニーズヘッグに当たる',
          ko: '니드호그 쪽으로',
        },
        hraesvelgr: {
          en: 'Get hit by Hraesvelgr',
          ja: 'フレースヴェルグに当たる',
          ko: '흐레스 쪽으로',
        },
      },
    },
    {
      id: 'DSR Wyrmsbreath 2 Pyretic',
      type: 'GainsEffect',
      // B52 = Boiling
      // When Boiling expires, Pyretic (3C0) will apply
      // Pyretic will cause damage on movement
      netRegex: { effectId: ['B52'] },
      condition: Conditions.targetIsYou(),
      // Boiling lasts 10.96s, after which Pyretic is applied provide warning
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 1,
      // Player will have Pyretic for about 3s before hit by Cauterize
      durationSeconds: 4,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stop',
          ja: '動かない',
          ko: '멈췃!!!',
        },
      },
    },
    {
      id: 'DSR Spreading/Entangled Flame',
      type: 'GainsEffect',
      netRegex: { effectId: ['AC6', 'AC7'] },
      preRun: (data, matches) => {
        if (matches.effectId === 'AC6')
          data.spreadingFlame.push(matches.target);

        if (matches.effectId === 'AC7')
          data.entangledFlame.push(matches.target);
      },
      alarmText: (data, _matches, output) => {
        if (data.spreadingFlame.length < 4)
          return;
        if (data.entangledFlame.length < 2)
          return;

        if (data.spreadingFlame.includes(data.me))
          return output.spread!();
        if (data.entangledFlame.includes(data.me))
          return output.stack!();
        return output.nodebuff!();
      },
      outputStrings: {
        spread: {
          en: 'Spread',
          ja: '散会',
          ko: '검정⬛ 혼자!',
        },
        stack: {
          en: 'Stack',
          ja: '頭割り',
          ko: '흰색⬜ 둘이 함께!',
        },
        nodebuff: {
          en: 'No debuff (Stack)',
          ja: 'バフなし (頭割り)',
          ko: '무직! 흰색⬜과 함께!',
        },
      },
    },
    {
      id: 'DSR Flames of Ascalon',
      type: 'GainsEffect',
      netRegex: { effectId: '808', count: '12A', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'DSR Ice of Ascalon',
      type: 'GainsEffect',
      netRegex: { effectId: '808', count: '12B', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'DSR Trinity Tank Dark Resistance',
      type: 'GainsEffect',
      // C40 = Dark Resistance Down, highest enmity target
      netRegex: {
        effectId: 'C40',
        count: '02',
      },
      condition: (data, matches) => data.me === matches.target && data.role === 'tank',
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) > 10)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Get 2nd enmity',
          ja: 'スタンスオフ',
          ko: '스탠스 OFF! 다크⬛!',
        },
      },
    },
    {
      id: 'DSR Trinity Tank Light Resistance',
      type: 'GainsEffect',
      // C3F = Light Resistance Down, 2nd highest enmity target
      netRegex: {
        effectId: 'C3F',
        count: '02',
      },
      condition: (data, matches) => data.me === matches.target && data.role === 'tank',
      // To prevent boss rotating around before Exaflare
      delaySeconds: 2.5,
      // 원래 alert
      alarmText: (_data, matches, output) => {
        if (parseFloat(matches.duration) > 10)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Provoke',
          ja: '挑発',
          ko: '프로보크! 라이트⬜!',
        },
      },
    },
    {
      id: 'DSR Gigaflare',
      // 6D9A fires first, followed by 6DD2, then 6DD3
      // 6D99 is cast by boss at the center
      // Only need to compare the rotation of 6D9A to 6DD2
      type: 'StartsUsing',
      netRegex: { id: ['6D99', '6D9A', '6DD2'], source: 'Dragon-king Thordan' },
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        // Positions are moved up 100 and right 100
        const x = parseFloat(matches.x) - 100;
        const y = parseFloat(matches.y) - 100;

        // Collect Gigaflare position
        switch (matches.id) {
          case '6D99':
            data.centerGigaflare = [x, y, parseFloat(matches.heading)];
            break;
          case '6D9A':
            data.firstGigaflare = [x, y];
            break;
          case '6DD2':
            data.secondGigaflare = [x, y];
            break;
        }

        if (
          data.firstGigaflare !== undefined && data.secondGigaflare !== undefined &&
          data.centerGigaflare !== undefined
        ) {
          // Store temporary copies and remove data for next run
          const first = data.firstGigaflare;
          const second = data.secondGigaflare;
          const center = data.centerGigaflare;
          delete data.firstGigaflare;
          delete data.secondGigaflare;
          delete data.centerGigaflare;

          if (
            first[0] === undefined || first[1] === undefined ||
            second[0] === undefined || second[1] === undefined ||
            center[0] === undefined || center[1] === undefined || center[2] === undefined
          ) {
            console.error(`Gigaflare: missing coordinates`);
            return;
          }

          // Compute atan2 of determinant and dot product to get rotational direction
          // Note: X and Y are flipped due to Y axis being reversed
          const getRotation = (x1: number, y1: number, x2: number, y2: number) => {
            return Math.atan2(y1 * x2 - x1 * y2, y1 * y2 + x1 * x2);
          };

          // Get rotation of first and second gigaflares
          const rotation = getRotation(first[0], first[1], second[0], second[1]);

          // Get rotation of first gigaflare relative to boss
          let start;

          // Case for if front since data for heading is not exact
          // To detect if front, added angles must match 180 degrees
          const thetaFirstGigaflare = Math.abs(Math.atan2(first[0], first[1]));
          const thetaCenterGigaflare = Math.abs(center[2]);
          const thetaCenterPlusFirst = thetaFirstGigaflare + thetaCenterGigaflare;
          if (Math.round(thetaCenterPlusFirst * 180 / Math.PI) % 180 === 0) {
            start = output.front!();
          } else {
            // Gigaflare was not in line with boss facing,
            // Compute initial location relative to boss by
            // calculating point on circle where boss is facing
            const radius = Math.sqrt((center[0] - first[0]) ** 2 + (center[1] - first[1]) ** 2);
            const relX = Math.round(radius * Math.sin(center[2]));
            const relY = Math.round(radius * Math.cos(center[2]));

            // Check rotation of boss facing to first gigaflare:
            const startNum = getRotation(relX, relY, first[0], first[1]);
            if (startNum < 0)
              start = output.backLeft!();
            else if (startNum > 0)
              start = output.backRight!();
            else
              start = output.unknown!();
          }

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
        }
      },
      outputStrings: {
        directions: {
          en: '${start} => ${rotation}',
          ja: '${start} => ${rotation}',
          ko: '${start} 🔜 ${rotation}',
        },
        backLeft: {
          en: 'Back left',
          ja: '左後ろ',
          ko: '🡿왼쪽뒤',
        },
        backRight: {
          en: 'Back right',
          ja: '右後ろ',
          ko: '🡾오른쪽뒤',
        },
        front: {
          en: 'Front',
          ja: '前',
          ko: '🡹앞',
        },
        unknown: Outputs.unknown,
        clockwise: {
          en: 'Clockwise',
          ja: '時計回り',
          ko: '시계❰❰❰',
        },
        counterclock: {
          en: 'Counterclockwise',
          ja: '反時計回り',
          ko: '❱❱❱반시계',
        },
      },
    },
    {
      id: 'DSR PR Trinity 스탠스 켜기',
      type: 'GainsEffect',
      netRegex: { effectId: 'C3F', count: '02' },
      condition: (data, matches) => data.me === matches.target && data.role === 'tank',
      alertText: (_data, matches, output) => {
        if (parseFloat(matches.duration) > 10)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Stance ON!',
          ja: 'スタンスオン',
          ko: '스탠스 ON!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Empty Dimension/Full Dimension': 'Empty/Full Dimension',
        'Lash and Gnash/Gnash and Lash': 'Lash and Gnash',
        'Ice of Ascalon/Flames of Ascalon': 'Ice/Flames of Ascalon',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Darkscale': 'Dunkelschuppe',
        'Dragon-king Thordan': 'König Thordan',
        'Estinien': 'Estinien',
        'Haurchefant': 'Haurchefant',
        'Hraesvelgr': 'Hraesvelgr',
        '(?<!Dragon-)King Thordan': 'Thordan',
        'Left Eye': 'link(?:e|er|es|en) Auge',
        'Meteor Circle': 'Meteorsiegel',
        'Nidhogg': 'Nidhogg',
        'Right Eye': 'recht(?:e|er|es|en) Auge',
        'Ser Adelphel': 'Adelphel',
        'Ser Charibert': 'Charibert',
        'Ser Grinnaux': 'Grinnaux',
        'Ser Guerrique': 'Guerrique',
        'Ser Haumeric': 'Haumeric',
        'Ser Hermenost': 'Hermenost',
        'Ser Ignasse': 'Ignasse',
        'Ser Janlenoux': 'Janlenoux',
        'Ser Noudenet': 'Noudenet',
        'Ser Zephirin': 'Zephirin',
        'Spear of the Fury': 'Speer der Furie',
        'Vedrfolnir': 'Vedrfölnir',
        'Ysayle': 'Ysayle',
      },
      'replaceText': {
        'Aetheric Burst': 'Ätherschub',
        'Akh Afah': 'Akh Afah',
        'Akh Morn(?!\'s Edge)': 'Akh Morn',
        'Akh Morn\'s Edge': 'Akh Morns Klinge',
        'Ancient Quaga': 'Seisga Antiqua',
        'Alternative End': 'Ein neues Ende',
        'Altar Flare': 'Altar-Flare',
        'Ascalon\'s Mercy Concealed': 'Askalons geheime Gnade',
        'Ascalon\'s Mercy Revealed': 'Askalons enthüllte Gnade',
        'Ascalon\'s Might': 'Macht von Askalon',
        'Brightblade\'s Steel': 'Schimmernder Stahl',
        'Brightwing(?!ed)': 'Lichtschwinge',
        'Brightwinged Flight': 'Flug der Lichtschwingen',
        'Broad Swing': 'Ausladender Schwung',
        'Cauterize': 'Kauterisieren',
        'Chain Lightning': 'Kettenblitz',
        'Conviction': 'Konviktion',
        'Dark Orb': 'Dunkler Orbis',
        'Darkdragon Dive': 'Dunkeldrachensturz',
        'Death of the Heavens': 'Himmel des Todes',
        'Deathstorm': 'Todessturm',
        'Dimensional Collapse': 'Dimensionskollaps',
        'Dive from Grace': 'Gefallener Drache ',
        'Drachenlance': 'Drachenlanze',
        'Dread Wyrmsbreath': 'Dunkler Drachenodem',
        'Empty Dimension': 'Dimension der Leere',
        'Entangled Flames': 'Verwobene Flammen',
        'Exaflare\'s Edge': 'Exaflare-Klinge',
        'Execution': 'Exekution',
        'Eye of the Tyrant': 'Auge des Tyrannen',
        'Faith Unmoving': 'Fester Glaube',
        'Final Chorus': 'Endchoral',
        'Flame Breath': 'Flammenatem',
        'Flames of Ascalon': 'Flamme von Askalon',
        'Flare Nova': 'Flare Nova',
        'Flare Star': 'Flare-Stern',
        'Full Dimension': 'Dimension der Weite',
        'Geirskogul': 'Geirskogul',
        'Gigaflare\'s Edge': 'Gigaflare-Klinge',
        'Gnash and Lash': 'Reißen und Beißen',
        'Great Wyrmsbreath': 'Heller Drachenodem',
        'Hallowed Plume': 'Geweihte Feder',
        'Hallowed Wings': 'Heilige Schwingen',
        'Hatebound': 'Nidhoggs Hass',
        'Heavenly Heel': 'Himmelsschritt',
        'Heavens\' Stake': 'Himmelslanze',
        'Heavensblaze': 'Himmlisches Lodern',
        'Heavensflame': 'Himmlische Flamme',
        'Heavy Impact': 'Heftiger Einschlag',
        'Hiemal Storm': 'Hiemaler Sturm',
        'Holiest of Holy': 'Quell der Heiligkeit',
        'Holy Bladedance': 'Geweihter Schwerttanz',
        'Holy Breath': 'Heiliger Atem',
        'Holy Comet': 'Heiliger Komet',
        'Holy Meteor': 'Heiliger Meteor',
        'Holy Orb': 'Heiliger Orbis',
        'Holy Shield Bash': 'Heiliger Schildschlag',
        'Hot Tail': 'Schwelender Schweif',
        'Hot Wing': 'Flirrender Flügel',
        'Hyperdimensional Slash': 'Hyperdimensionsschlag',
        'Ice Breath': 'Eisatem',
        'Ice of Ascalon': 'Eis von Askalon',
        'Incarnation': 'Inkarnation',
        'Knights of the Round': 'Ritter der Runde',
        'Lash and Gnash': 'Beißen und Reißen',
        'Lightning Storm': 'Blitzsturm',
        'Liquid Heaven': 'Himmlisches Fluid',
        'Meteor Impact': 'Meteoreinschlag',
        'Mirage Dive': 'Illusionssprung',
        'Mortal Vow': 'Schwur der Vergeltung',
        'Morn Afah\'s Edge': 'Morn Afahs Klinge',
        'Planar Prison': 'Dimensionsfalle',
        'Pure of Heart': 'Reines Herz',
        'Resentment': 'Bitterer Groll',
        'Revenge of the Horde': 'Rache der Horde',
        'Sacred Sever': 'Sakralschnitt',
        'Sanctity of the Ward': 'Erhabenheit der Königsschar',
        'Shockwave': 'Schockwelle',
        'Skyblind': 'Lichtblind',
        'Skyward Leap': 'Luftsprung',
        'Soul Tether': 'Seelenstrick',
        'Soul of Devotion': 'Essenz der Tugend',
        'Soul of Friendship': 'Essenz der Freundschaft',
        'Spear of the Fury': 'Speer der Furie',
        'Spiral Pierce': 'Spiralstich',
        'Spiral Thrust': 'Spiralstoß',
        'Spreading Flames': 'Flammende Rache',
        'Staggering Breath': 'Stoßender Atem',
        'Steep in Rage': 'Welle des Zorns',
        'Strength of the Ward': 'Übermacht der Königsschar',
        'Swirling Blizzard': 'Blizzardwirbel',
        'The Bull\'s Steel': 'Unbändiger Stahl',
        'The Dragon\'s Eye': 'Auge des Drachen',
        'The Dragon\'s Gaze': 'Blick des Drachen',
        'The Dragon\'s Glory': 'Ruhm des Drachen',
        'The Dragon\'s Rage': 'Zorn des Drachen',
        'Tower': 'Turm',
        'Touchdown': 'Himmelssturz',
        'Trinity': 'Trinität',
        'Twisting Dive': 'Spiralschwinge',
        'Ultimate End': 'Ultimatives Ende',
        'Wrath of the Heavens': 'Himmel des Zorns',
        'Wroth Flames': 'Flammender Zorn',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Darkscale': 'Sombrécaille',
        'Dragon-king Thordan': 'Thordan le Dieu Dragon',
        'Estinien': 'Estinien',
        'Haurchefant': 'Haurchefant',
        'Hraesvelgr': 'Hraesvelgr',
        '(?<!Dragon-)King Thordan': 'roi Thordan',
        'Left Eye': 'Œil gauche de Nidhogg',
        'Meteor Circle': 'sceau du météore',
        'Nidhogg': 'Nidhogg',
        'Right Eye': 'Œil droit de Nidhogg',
        'Ser Adelphel': 'sire Adelphel',
        'Ser Charibert': 'sire Charibert',
        'Ser Grinnaux': 'sire Grinnaux',
        'Ser Guerrique': 'sire Guerrique',
        'Ser Haumeric': 'sire Haumeric',
        'Ser Hermenost': 'sire Hermenoist',
        'Ser Ignasse': 'sire Ignassel',
        'Ser Janlenoux': 'sire Janlenoux',
        'Ser Noudenet': 'sire Noudenet',
        'Ser Zephirin': 'sire Zéphirin',
        'Spear of the Fury': 'Lance de la Conquérante',
        'Vedrfolnir': 'Vedrfolnir',
        'Ysayle': 'Ysayle',
      },
      'replaceText': {
        'Aetheric Burst': 'Explosion éthérée',
        'Akh Afah': 'Akh Afah',
        'Akh Morn(?!\'s Edge)': 'Akh Morn',
        'Akh Morn\'s Edge': 'Lame d\'Akh Morn',
        'Ancient Quaga': 'Méga Séisme ancien',
        'Alternative End': 'Fin alternative',
        'Altar Flare': 'Brasier de l\'autel',
        'Ascalon\'s Mercy Concealed': 'Grâce d\'Ascalon dissimulée',
        'Ascalon\'s Mercy Revealed': 'Grâce d\'Ascalon révélée',
        'Ascalon\'s Might': 'Puissance d\'Ascalon',
        'Brightblade\'s Steel': 'Résolution radiante',
        'Brightwing(?!ed)': 'Aile lumineuse',
        'Brightwinged Flight': 'Vol céleste',
        'Broad Swing': 'Grand balayage',
        'Cauterize': 'Cautérisation',
        'Chain Lightning': 'Chaîne d\'éclairs',
        'Conviction': 'Conviction',
        'Dark Orb': 'Orbe ténébreux',
        'Darkdragon Dive': 'Piqué du dragon sombre',
        'Death of the Heavens': 'Condamnation d\'azur',
        'Deathstorm': 'Tempête de la mort',
        'Dimensional Collapse': 'Effondrement dimensionnel',
        'Dive from Grace': 'Dragon déchu',
        'Drachenlance': 'Drachenlance',
        'Dread Wyrmsbreath': 'Souffle de Nidhogg',
        'Empty Dimension': 'Vide dimensionnel',
        'Entangled Flames': 'Flammes enchevêtrées',
        'Exaflare\'s Edge': 'Lame d\'ExaBrasier',
        'Execution': 'Exécution',
        'Eye of the Tyrant': 'Œil du tyran',
        'Faith Unmoving': 'Foi immuable',
        'Final Chorus': 'Chant ultime',
        'Flame Breath': 'Pyrosouffle',
        'Flames of Ascalon': 'Feu d\'Ascalon',
        'Flare Nova': 'Désastre flamboyant',
        'Flare Star': 'Astre flamboyant',
        'Full Dimension': 'Plénitude dimensionnelle',
        'Geirskogul': 'Geirskögul',
        'Gigaflare\'s Edge': 'Lame de GigaBrasier',
        'Gnash and Lash': 'Grincement tordu',
        'Great Wyrmsbreath': 'Souffle de Hraesvelgr',
        'Hallowed Plume': 'Écaille sacrée',
        'Hallowed Wings': 'Aile sacrée',
        'Hatebound': 'Lacération de Nidhogg',
        'Heavenly Heel': 'Estoc céleste',
        'Heavens\' Stake': 'Pal d\'azur',
        'Heavensblaze': 'Embrasement céleste',
        'Heavensflame': 'Flamme céleste',
        'Heavy Impact': 'Impact violent',
        'Hiemal Storm': 'Tempête hiémale',
        'Holiest of Holy': 'Saint des saints',
        'Holy Bladedance': 'Danse de la lame céleste',
        'Holy Breath': 'Souffle miraculeux',
        'Holy Comet': 'Comète miraculeuse',
        'Holy Meteor': 'Météore sacré',
        'Holy Orb': 'Orbe miraculeux',
        'Holy Shield Bash': 'Coup de bouclier saint',
        'Hot Tail': 'Queue calorifique',
        'Hot Wing': 'Aile calorifique',
        'Hyperdimensional Slash': 'Lacération hyperdimensionnelle',
        'Ice Breath': 'Givrosouffle',
        'Ice of Ascalon': 'Glace d\'Ascalon',
        'Incarnation': 'Incarnation sacrée',
        'Knights of the Round': 'Chevaliers de la Table ronde',
        'Lash and Gnash': 'Torsion grinçante',
        'Lightning Storm': 'Pluie d\'éclairs',
        'Liquid Heaven': 'Paradis liquide',
        'Meteor Impact': 'Impact de météore',
        'Mirage Dive': 'Piqué mirage',
        'Mortal Vow': 'Vœu d\'anéantissement',
        'Morn Afah\'s Edge': 'Lame de Morn Afah',
        'Planar Prison': 'Prison dimensionnelle',
        'Pure of Heart': 'Pureté du cœur',
        'Resentment': 'Râle d\'agonie',
        'Revenge of the Horde': 'Chant pour l\'avenir',
        'Sacred Sever': 'Scission sacrée',
        'Sanctity of the Ward': 'Béatitude du Saint-Siège',
        'Shockwave': 'Onde de choc',
        'Skyblind': 'Sceau céleste',
        'Skyward Leap': 'Bond céleste',
        'Soul Tether': 'Bride de l\'âme',
        'Soul of Devotion': 'Dévotion éternelle',
        'Soul of Friendship': 'Amitié éternelle',
        'Spear of the Fury': 'Lance de la Conquérante',
        'Spiral Pierce': 'Empalement tournoyant',
        'Spiral Thrust': 'Transpercement tournoyant',
        'Spreading Flames': 'Vengeance consumante',
        'Staggering Breath': 'Souffle ébranlant',
        'Steep in Rage': 'Onde de fureur',
        'Strength of the Ward': 'Force du Saint-Siège',
        'Swirling Blizzard': 'Blizzard tourbillonnant',
        'The Bull\'s Steel': 'Résolution rueuse',
        'The Dragon\'s Eye': 'Œil du dragon',
        'The Dragon\'s Gaze': 'Regard du dragon',
        'The Dragon\'s Glory': 'Gloire du dragon',
        'The Dragon\'s Rage': 'Colère du dragon',
        'Touchdown': 'Atterrissage',
        'Tower': 'Tour',
        'Trinity': 'Trinité',
        'Twisting Dive': 'Plongeon-trombe',
        'Ultimate End': 'Fin ultime',
        'Wrath of the Heavens': 'Colère d\'azur',
        'Wroth Flames': 'Haine enflammée',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Darkscale': 'ダークスケール',
        'Dragon-king Thordan': '騎竜神トールダン',
        'Estinien': 'エスティニアン',
        'Haurchefant': 'オルシュファン',
        'Hraesvelgr': 'フレースヴェルグ',
        '(?<!Dragon-)King Thordan': '騎神トールダン',
        'Left Eye': '邪竜の左眼',
        'Meteor Circle': '流星の聖紋',
        'Nidhogg': 'ニーズヘッグ',
        'Right Eye': '邪竜の右眼',
        'Ser Adelphel': '聖騎士アデルフェル',
        'Ser Charibert': '聖騎士シャリベル',
        'Ser Grinnaux': '聖騎士グリノー',
        'Ser Guerrique': '聖騎士ゲリック',
        'Ser Haumeric': '聖騎士オムリク',
        'Ser Hermenost': '聖騎士エルムノスト',
        'Ser Ignasse': '聖騎士イニアセル',
        'Ser Janlenoux': '聖騎士ジャンルヌ',
        'Ser Noudenet': '聖騎士ヌドゥネー',
        'Ser Zephirin': '聖騎士ゼフィラン',
        'Spear of the Fury': 'スピア・オブ・ハルオーネ',
        'Vedrfolnir': 'ヴェズルフェルニル',
        'Ysayle': 'イゼル',
      },
      'replaceText': {
        'Aetheric Burst': 'エーテルバースト',
        'Akh Afah': 'アク・アファー',
        'Akh Morn(?!\'s Edge)': 'アク・モーン',
        'Akh Morn\'s Edge': '騎竜剣アク・モーン',
        'Ancient Quaga': 'エンシェントクエイガ',
        'Alternative End': 'アルティメットエンド・オルタナ',
        'Altar Flare': 'アルターフレア',
        'Ascalon\'s Mercy Concealed': 'インビジブル・アスカロンメルシー',
        'Ascalon\'s Mercy Revealed': 'レベレーション・アスカロンメルシー',
        'Ascalon\'s Might': 'アスカロンマイト',
        'Brightblade\'s Steel': '美剣の覚悟',
        'Brightwing(?!ed)': '光翼閃',
        'Brightwinged Flight': '蒼天の光翼',
        'Broad Swing': '大振り',
        'Cauterize': 'カータライズ',
        'Chain Lightning': 'チェインライトニング',
        'Conviction': 'コンヴィクション',
        'Dark Orb': 'ダークオーブ',
        'Darkdragon Dive': 'ダークドラゴンダイブ',
        'Death of the Heavens': '至天の陣：死刻',
        'Deathstorm': 'デスストーム',
        'Dimensional Collapse': 'ディメンションクラッシュ',
        'Dive from Grace': '堕天のドラゴンダイブ',
        'Drachenlance': 'ドラッケンランス',
        'Dread Wyrmsbreath': '邪竜の息吹',
        'Empty Dimension': 'エンプティディメンション',
        'Entangled Flames': '道連れの炎',
        'Exaflare\'s Edge': '騎竜剣エクサフレア',
        'Execution': 'エクスキューション',
        'Eye of the Tyrant': 'アイ・オブ・タイラント',
        'Faith Unmoving': 'フェイスアンムーブ',
        'Final Chorus': '終焉の竜詩',
        'Flame Breath': 'フレイムブレス',
        'Flames of Ascalon': 'フレイム・オブ・アスカロン',
        'Flare Nova': 'フレアディザスター',
        'Flare Star': 'フレアスター',
        'Full Dimension': 'フルディメンション',
        'Geirskogul': 'ゲイルスコグル',
        'Gigaflare\'s Edge': '騎竜剣ギガフレア',
        'Gnash and Lash': '牙尾の連旋',
        'Great Wyrmsbreath': '聖竜の息吹',
        'Hallowed Plume': 'ホーリーフェザー',
        'Hallowed Wings': 'ホーリーウィング',
        'Hatebound': '邪竜爪牙',
        'Heavenly Heel': 'ヘヴンリーヒール',
        'Heavens\' Stake': 'ヘヴンステイク',
        'Heavensblaze': 'ヘヴンブレイズ',
        'Heavensflame': 'ヘヴンフレイム',
        'Heavy Impact': 'ヘヴィインパクト',
        'Hiemal Storm': 'ハイマルストーム',
        'Holiest of Holy': 'ホリエストホーリー',
        'Holy Bladedance': 'ホーリーブレードダンス',
        'Holy Breath': 'ホーリーブレス',
        'Holy Comet': 'ホーリーコメット',
        'Holy Meteor': 'ホーリーメテオ',
        'Holy Orb': 'ホーリーオーブ',
        'Holy Shield Bash': 'ホーリーシールドバッシュ',
        'Hot Tail': 'ヒートテイル',
        'Hot Wing': 'ヒートウィング',
        'Hyperdimensional Slash': 'ハイパーディメンション',
        'Ice Breath': 'コールドブレス',
        'Ice of Ascalon': 'アイス・オブ・アスカロン',
        'Incarnation': '聖徒化',
        'Knights of the Round': 'ナイツ・オブ・ラウンド',
        'Lash and Gnash': '尾牙の連旋',
        'Lightning Storm': '百雷',
        'Liquid Heaven': 'ヘブンリキッド',
        'Meteor Impact': 'メテオインパクト',
        'Mirage Dive': 'ミラージュダイブ',
        'Mortal Vow': '滅殺の誓い',
        'Morn Afah\'s Edge': '騎竜剣モーン・アファー',
        'Planar Prison': 'ディメンションジェイル',
        'Pure of Heart': 'ピュア・オブ・ハート',
        'Resentment': '苦悶の咆哮',
        'Revenge of the Horde': '最期の咆哮',
        'Sacred Sever': 'セイクリッドカット',
        'Sanctity of the Ward': '蒼天の陣：聖杖',
        'Shockwave': '衝撃波',
        'Skyblind': '蒼天の刻印',
        'Skyward Leap': 'スカイワードリープ',
        'Soul Tether': 'ソウルテザー',
        'Soul of Devotion': '巫女の想い',
        'Soul of Friendship': '盟友の想い',
        'Spear of the Fury': 'スピア・オブ・ハルオーネ',
        'Spiral Pierce': 'スパイラルピアス',
        'Spiral Thrust': 'スパイラルスラスト',
        'Spreading Flames': '復讐の炎',
        'Staggering Breath': 'スタッガーブレス',
        'Steep in Rage': '憤怒の波動',
        'Strength of the Ward': '蒼天の陣：雷槍',
        'Swirling Blizzard': 'ブリザードサークル',
        'The Bull\'s Steel': '戦狂の覚悟',
        'The Dragon\'s Eye': '竜の眼',
        'The Dragon\'s Gaze': '竜の邪眼',
        'The Dragon\'s Glory': '邪竜の眼光',
        'The Dragon\'s Rage': '邪竜の魔炎',
        'Tower': '塔',
        'Touchdown': 'タッチダウン',
        'Trinity': 'トリニティ',
        'Twisting Dive': 'ツイスターダイブ',
        'Ultimate End': 'アルティメットエンド',
        'Wrath of the Heavens': '至天の陣：風槍',
        'Wroth Flames': '邪念の炎',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Darkscale': '暗鳞黑龙',
        'Dragon-king Thordan': '龙威骑神托尔丹',
        'Estinien': '埃斯蒂尼安',
        'Haurchefant': '奥尔什方',
        'Hraesvelgr': '赫拉斯瓦尔格',
        '(?<!Dragon-)King Thordan': '骑神托尔丹',
        'Left Eye': '邪龙的左眼',
        'Meteor Circle': '流星圣纹',
        'Nidhogg': '尼德霍格',
        'Right Eye': '邪龙的右眼',
        'Ser Adelphel': '圣骑士阿代尔斐尔',
        'Ser Charibert': '圣骑士沙里贝尔',
        'Ser Grinnaux': '圣骑士格里诺',
        'Ser Guerrique': '圣骑士盖里克',
        'Ser Haumeric': '圣骑士奥默里克',
        'Ser Hermenost': '圣骑士埃尔姆诺斯特',
        'Ser Ignasse': '圣骑士伊尼亚斯',
        'Ser Janlenoux': '圣骑士让勒努',
        'Ser Noudenet': '圣骑士努德内',
        'Ser Zephirin': '圣骑士泽菲兰',
        'Spear of the Fury': '战女神之枪',
        'Vedrfolnir': '维德佛尔尼尔',
        'Ysayle': '伊塞勒',
      },
      'replaceText': {
        'Aetheric Burst': '以太爆发',
        'Akh Afah': '无尽轮回',
        'Akh Morn(?!\'s Edge)': '死亡轮回',
        'Akh Morn\'s Edge': '死亡轮回剑',
        'Ancient Quaga': '古代爆震',
        'Alternative End': '异史终结',
        'Altar Flare': '圣坛核爆',
        'Ascalon\'s Mercy Concealed': '阿斯卡隆之仁·隐秘',
        'Ascalon\'s Mercy Revealed': '阿斯卡隆之仁·揭示',
        'Ascalon\'s Might': '阿斯卡隆之威',
        'Brightblade\'s Steel': '光辉剑的决意',
        'Brightwing(?!ed)': '光翼闪',
        'Brightwinged Flight': '苍穹光翼',
        'Broad Swing': '奋力一挥',
        'Cauterize': '洁白俯冲',
        'Chain Lightning': '雷光链',
        'Conviction': '信仰',
        'Dark Orb': '暗天球',
        'Darkdragon Dive': '黑暗龙炎冲',
        'Death of the Heavens': '至天之阵：死刻',
        'Deathstorm': '死亡风暴',
        'Dimensional Collapse': '空间破碎',
        'Dive from Grace': '堕天龙炎冲',
        'Drachenlance': '腾龙枪',
        'Dread Wyrmsbreath': '邪龙的吐息',
        'Empty Dimension': '无维空间',
        'Entangled Flames': '同归于尽之炎',
        'Exaflare\'s Edge': '百京核爆剑',
        'Execution': '处刑',
        'Eye of the Tyrant': '暴君之瞳',
        'Faith Unmoving': '坚定信仰',
        'Final Chorus': '灭绝之诗',
        'Flame Breath': '火焰吐息',
        'Flames of Ascalon': '阿斯卡隆之焰',
        'Flare Nova': '核爆灾祸',
        'Flare Star': '耀星',
        'Full Dimension': '全维空间',
        'Geirskogul': '武神枪',
        'Gigaflare\'s Edge': '十亿核爆剑',
        'Gnash and Lash': '牙尾连旋',
        'Great Wyrmsbreath': '圣龙的吐息',
        'Hallowed Plume': '神圣之羽',
        'Hallowed Wings': '神圣之翼',
        'Hatebound': '邪龙爪牙',
        'Heavenly Heel': '天踵',
        'Heavens\' Stake': '苍穹火刑',
        'Heavensblaze': '苍穹炽焰',
        'Heavensflame': '天火',
        'Heavy Impact': '沉重冲击',
        'Hiemal Storm': '严冬风暴',
        'Holiest of Holy': '至圣',
        'Holy Bladedance': '圣光剑舞',
        'Holy Breath': '神圣吐息',
        'Holy Comet': '神圣彗星',
        'Holy Meteor': '陨石圣星',
        'Holy Orb': '神圣球',
        'Holy Shield Bash': '圣盾猛击',
        'Hot Tail': '燃烧之尾',
        'Hot Wing': '燃烧之翼',
        'Hyperdimensional Slash': '多维空间斩',
        'Ice Breath': '寒冰吐息',
        'Ice of Ascalon': '阿斯卡隆之冰',
        'Incarnation': '圣徒洗礼',
        'Knights of the Round': '圆桌骑士',
        'Lash and Gnash': '尾牙连旋',
        'Lightning Storm': '百雷',
        'Liquid Heaven': '苍天火液',
        'Meteor Impact': '陨石冲击',
        'Mirage Dive': '幻象冲',
        'Mortal Vow': '灭杀的誓言',
        'Morn Afah\'s Edge': '无尽顿悟剑',
        '(?<! )Pierce': '贯穿',
        'Planar Prison': '空间牢狱',
        'Pure of Heart': '纯洁心灵',
        'Resentment': '苦闷怒嚎',
        'Revenge of the Horde': '绝命怒嚎',
        'Sacred Sever': '神圣裂斩',
        'Sanctity of the Ward': '苍穹之阵：圣杖',
        'Shockwave': '冲击波',
        'Skyblind': '苍穹刻印',
        'Skyward Leap': '穿天',
        'Soul Tether': '追魂炮',
        'Soul of Devotion': '巫女的思念',
        'Soul of Friendship': '盟友的思念',
        'Spear of the Fury': '战女神之枪',
        'Spiral Pierce': '螺旋枪',
        'Spiral Thrust': '螺旋刺',
        'Spreading Flames': '复仇之炎',
        'Staggering Breath': '交错吐息',
        'Steep in Rage': '愤怒波动',
        'Strength of the Ward': '苍穹之阵：雷枪',
        'Swirling Blizzard': '冰结环',
        'The Bull\'s Steel': '战争狂的决意',
        'The Dragon\'s Eye': '龙眼之光',
        'The Dragon\'s Gaze': '龙眼之邪',
        'The Dragon\'s Glory': '邪龙目光',
        'The Dragon\'s Rage': '邪龙魔炎',
        'Tower': '塔',
        'Touchdown': '空降',
        'Trinity': '三剑一体',
        'Twisting Dive': '旋风冲',
        'Ultimate End': '万物终结',
        'Wrath of the Heavens': '至天之阵：风枪',
        'Wroth Flames': '邪念之炎',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Darkscale': '暗鱗黑龍',
        'Dragon-king Thordan': '龍威騎神托爾丹',
        'Estinien': '艾斯蒂尼安',
        'Haurchefant': '奧爾什方',
        'Hraesvelgr': '赫拉斯瓦爾格',
        '(?<!Dragon-)King Thordan': '騎神托爾丹',
        'Left Eye': '邪龍的左眼',
        'Meteor Circle': '流星聖紋',
        'Nidhogg': '尼德霍格',
        'Right Eye': '邪龍的右眼',
        'Ser Adelphel': '聖騎士阿代爾斐爾',
        'Ser Charibert': '聖騎士沙里貝爾',
        'Ser Grinnaux': '聖騎士格里諾',
        'Ser Guerrique': '聖騎士蓋里克',
        'Ser Haumeric': '聖騎士奧默里克',
        'Ser Hermenost': '聖騎士艾爾姆諾斯特',
        'Ser Ignasse': '聖騎士伊尼亞斯',
        'Ser Janlenoux': '聖騎士讓勒努',
        'Ser Noudenet': '聖騎士努德內',
        'Ser Zephirin': '聖騎士澤菲蘭',
        'Spear of the Fury': '戰女神之槍',
        'Vedrfolnir': '維茲爾弗尼爾',
        'Ysayle': '伊塞勒',
      },
      'replaceText': {
        'Aetheric Burst': '乙太爆發',
        'Akh Afah': '無盡輪迴',
        'Akh Morn(?!\'s Edge)': '死亡輪迴',
        'Akh Morn\'s Edge': '死亡輪迴劍',
        'Ancient Quaga': '古代爆震',
        'Alternative End': '異史終結',
        'Altar Flare': '聖壇火光',
        'Ascalon\'s Mercy Concealed': '阿斯卡隆之仁·隱秘',
        'Ascalon\'s Mercy Revealed': '阿斯卡隆之仁·揭示',
        'Ascalon\'s Might': '阿斯卡隆之威',
        'Brightblade\'s Steel': '光輝劍的決意',
        'Brightwing(?!ed)': '光翼閃',
        'Brightwinged Flight': '蒼天光翼',
        'Broad Swing': '奮力一揮',
        'Cauterize': '漆黑俯衝',
        'Chain Lightning': '雷光鏈',
        'Conviction': '信仰',
        'Dark Orb': '暗天球',
        'Darkdragon Dive': '黑暗龍炎衝',
        'Death of the Heavens': '至天之陣：死刻',
        'Deathstorm': '死亡風暴',
        'Dimensional Collapse': '空間破碎',
        'Dive from Grace': '墮天龍炎衝',
        'Drachenlance': '騰龍槍',
        'Dread Wyrmsbreath': '邪龍的吐息',
        'Empty Dimension': '無維空間',
        'Entangled Flames': '同歸於盡之炎',
        'Exaflare\'s Edge': '百京火光劍',
        'Execution': '處刑',
        'Eye of the Tyrant': '暴君之瞳',
        'Faith Unmoving': '堅定信仰',
        'Final Chorus': '滅絕之詩',
        'Flame Breath': '烈焰吐息',
        'Flames of Ascalon': '阿斯卡隆之焰',
        'Flare Nova': '火光災禍',
        'Flare Star': '耀星',
        'Full Dimension': '全維空間',
        'Geirskogul': '武神槍',
        'Gigaflare\'s Edge': '十億火光劍',
        'Gnash and Lash': '牙尾連旋',
        'Great Wyrmsbreath': '聖龍的吐息',
        'Hallowed Plume': '神聖之羽',
        'Hallowed Wings': '神聖之翼',
        'Hatebound': '邪龍爪牙',
        'Heavenly Heel': '天踵',
        'Heavens\' Stake': '蒼天火刑',
        'Heavensblaze': '蒼天熾焰',
        'Heavensflame': '天火',
        'Heavy Impact': '沉重衝擊',
        'Hiemal Storm': '嚴冬風暴',
        'Holiest of Holy': '至聖',
        'Holy Bladedance': '聖光劍舞',
        'Holy Breath': '神聖吐息',
        'Holy Comet': '神聖隕星',
        'Holy Meteor': '隕石聖星',
        'Holy Orb': '神聖球',
        'Holy Shield Bash': '聖盾猛擊',
        'Hot Tail': '燃燒之尾',
        'Hot Wing': '燃燒之翼',
        'Hyperdimensional Slash': '多維空間斬',
        'Ice Breath': '寒冰吐息',
        'Ice of Ascalon': '阿斯卡隆之冰',
        'Incarnation': '聖徒洗禮',
        'Knights of the Round': '圓桌騎士',
        'Lash and Gnash': '尾牙連旋',
        'Lightning Storm': '百雷',
        'Liquid Heaven': '蒼天火液',
        'Meteor Impact': '隕石衝擊',
        'Mirage Dive': '幻象衝',
        'Mortal Vow': '滅殺的誓言',
        'Morn Afah\'s Edge': '無盡頓悟劍',
        '(?<! )Pierce': '貫穿',
        'Planar Prison': '空間牢獄',
        'Pure of Heart': '純潔心靈',
        'Resentment': '苦悶怒嚎',
        'Revenge of the Horde': '絕命怒嚎',
        'Sacred Sever': '神聖裂斬',
        'Sanctity of the Ward': '蒼天之陣：聖杖',
        'Shockwave': '衝擊波',
        'Skyblind': '蒼天刻印',
        'Skyward Leap': '穿天',
        'Soul Tether': '追魂砲',
        'Soul of Devotion': '巫女的思念',
        'Soul of Friendship': '盟友的思念',
        'Spear of the Fury': '戰女神之槍',
        'Spiral Pierce': '螺旋槍',
        'Spiral Thrust': '螺旋刺',
        'Spreading Flames': '復仇之炎',
        'Staggering Breath': '交錯吐息',
        'Steep in Rage': '憤怒波動',
        'Strength of the Ward': '蒼天之陣：雷槍',
        'Swirling Blizzard': '暴雪環',
        'The Bull\'s Steel': '戰爭狂的決意',
        'The Dragon\'s Eye': '龍眼之光',
        'The Dragon\'s Gaze': '龍眼之邪',
        'The Dragon\'s Glory': '邪龍目光',
        'The Dragon\'s Rage': '邪龍魔炎',
        // 'Tower': '', // FIXME '塔'
        'Touchdown': '空降',
        'Trinity': '三劍一體',
        'Twisting Dive': '旋風衝',
        'Ultimate End': '萬物終結',
        'Wrath of the Heavens': '至天之陣：風槍',
        'Wroth Flames': '邪念之炎',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Darkscale': '검은미늘',
        'Dragon-king Thordan': '기룡신 토르당',
        'Estinien': '에스티니앙',
        'Haurchefant': '오르슈팡',
        'Hraesvelgr': '흐레스벨그',
        '(?<!Dragon-)King Thordan': '기사신 토르당',
        'Left Eye': '사룡의 왼눈',
        'Meteor Circle': '성스러운 별똥별 문양',
        'Nidhogg': '니드호그',
        'Right Eye': '사룡의 오른눈',
        'Ser Adelphel': '성기사 아델펠',
        'Ser Charibert': '성기사 샤리베르',
        'Ser Grinnaux': '성기사 그리노',
        'Ser Guerrique': '성기사 게리크',
        'Ser Haumeric': '성기사 오메리크',
        'Ser Hermenost': '성기사 에르메노',
        'Ser Ignasse': '성기사 이냐스',
        'Ser Janlenoux': '성기사 장르누',
        'Ser Noudenet': '성기사 누데네',
        'Ser Zephirin': '성기사 제피랭',
        'Spear of the Fury': '할로네의 창',
        'Vedrfolnir': '베드르폴니르',
        'Ysayle': '이젤',
      },
      'replaceText': {
        'Empty Dimension/Full Dimension': '공허한/충만한 차원',
        'Lash and Gnash/Gnash and Lash': '꼬리이빨/이빨꼬리 연속 회전',
        'Ice of Ascalon/Flames of Ascalon': '아스칼론의 불꽃/얼음',
        'Aetheric Burst': '에테르 분출',
        'Akh Afah': '아크 아파',
        'Akh Morn(?!\'s Edge)': '아크 몬',
        'Akh Morn\'s Edge': '기룡검 아크 몬',
        'Ancient Quaga': '에인션트 퀘이가',
        'Alternative End': '또 다른 궁극의 종말',
        'Altar Flare': '제단의 불길',
        'Ascalon\'s Mercy Concealed': '아스칼론의 자비: 불가시',
        'Ascalon\'s Mercy Revealed': '아스칼론의 자비: 계시',
        'Ascalon\'s Might': '아스칼론의 권능',
        'Brightblade\'s Steel': '미검의 각오',
        'Brightwing(?!ed)': '광익섬',
        'Brightwinged Flight': '창천의 광익',
        'Broad Swing': '휘두르기',
        'Cauterize': '인두질',
        'Chain Lightning': '번개 사슬',
        'Conviction': '눈보라 절벽',
        'Dark Orb': '암흑 구체',
        'Darkdragon Dive': '암룡 강타',
        'Death of the Heavens': '지천의 진: 죽음',
        'Deathstorm': '죽음의 폭풍',
        'Dimensional Collapse': '차원 파괴',
        'Dive from Grace': '타락한 천룡 강타',
        'Drachenlance': '용창 가르기',
        'Dread Wyrmsbreath': '사룡의 숨결',
        'Empty Dimension(?!/)': '공허한 차원',
        'Entangled Flames': '길동무 불꽃',
        'Exaflare\'s Edge': '기룡검 엑사플레어',
        'Execution': '집행',
        'Eye of the Tyrant': '폭군의 눈동자',
        'Faith Unmoving': '굳건한 신앙',
        'Final Chorus': '종언의 용시',
        'Flame Breath': '화염 숨결',
        'Flare Nova': '타오르는 샛별',
        'Flare Star': '타오르는 별',
        '(?<!/)Full Dimension': '충만한 차원',
        'Geirskogul': '게이르스코굴',
        'Gigaflare\'s Edge': '기룡검 기가플레어',
        'Great Wyrmsbreath': '성룡의 숨결',
        'Hallowed Plume': '신성한 깃털',
        'Hallowed Wings': '신성한 날개',
        'Hatebound': '사룡의 발톱이빨',
        'Heavenly Heel': '천상의 발꿈치',
        'Heavens\' Stake': '천상의 화형',
        'Heavensblaze': '천상의 불',
        'Heavensflame': '천상의 불꽃',
        'Heavy Impact': '무거운 충격',
        'Hiemal Storm': '동장군 폭풍',
        'Holiest of Holy': '지고한 신성',
        'Holy Bladedance': '신성한 검무',
        'Holy Breath': '신성 숨결',
        'Holy Comet': '신성한 혜성',
        'Holy Meteor': '홀리 메테오',
        'Holy Orb': '신성 구체',
        'Holy Shield Bash': '성스러운 방패 강타',
        'Hot Tail': '뜨거운 꼬리',
        'Hot Wing': '뜨거운 날개',
        'Hyperdimensional Slash': '고차원',
        'Ice Breath': '냉기 숨결',
        'Incarnation': '성스러운 신도화',
        'Knights of the Round': '나이츠 오브 라운드',
        'Lightning Storm': '백뢰',
        'Liquid Heaven': '천국의 늪',
        'Meteor Impact': '운석 낙하',
        'Mirage Dive': '환영 강타',
        'Mortal Vow': '멸살의 맹세',
        'Morn Afah\'s Edge': '기룡검 몬 아파',
        '(?<!Spiral )Pierce': '관통',
        'Planar Prison': '차원 감옥',
        'Pure of Heart': '정결한 마음',
        'Resentment': '고통의 포효',
        'Revenge of the Horde': '최후의 포효',
        'Sacred Sever': '신성한 돌진',
        'Sanctity of the Ward': '창천의 진: 지팡이',
        'Shockwave': '충격파',
        'Skyblind': '창천의 각인',
        'Skyward Leap': '공중 도약',
        'Soul Tether': '혼의 사슬',
        'Soul of Devotion': '무녀의 넋',
        'Soul of Friendship': '맹우의 넋',
        'Spear of the Fury': '할로네의 창',
        'Spiral Pierce': '나선 관통',
        'Spiral Thrust': '나선 찌르기',
        'Spreading Flames': '복수의 불꽃',
        'Staggering Breath': '제압의 숨결',
        'Steep in Rage': '분노의 파동',
        'Strength of the Ward': '창천의 진: 번개창',
        'Swirling Blizzard': '환형 눈보라',
        'The Bull\'s Steel': '전쟁광의 각오',
        'The Dragon\'s Eye': '용의 눈',
        'The Dragon\'s Gaze': '용의 마안',
        'The Dragon\'s Glory': '사룡의 눈빛',
        'The Dragon\'s Rage': '사룡의 마염',
        'Tower': '타워',
        'Touchdown': '착지',
        'Trinity': '삼위일체',
        'Twisting Dive': '회오리 강하',
        'Ultimate End': '궁극의 종말',
        'Wrath of the Heavens': '지천의 진: 바람창',
        'Wroth Flames': '사념의 불꽃',
      },
    },
  ],
};

export default triggerSet;
