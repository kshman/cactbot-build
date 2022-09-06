import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  conceptual?: 'octa' | 'tetra' | 'di';
  combatantData: PluginCombatantState[];
  torches: NetMatches['StartsUsing'][];
  flareTargets: string[];
  upliftCounter: number;
  ventIds: string[];
  illusory?: 'bird' | 'snake';
}

const centerX = 100;
const centerY = 100;

const positionTo8Dir = (combatant: PluginCombatantState) => {
  const x = combatant.PosX - centerX;
  const y = combatant.PosY - centerY;

  // Dirs: N = 0, NE = 1, ..., NW = 7
  return Math.round(4 - 4 * Math.atan2(x, y) / Math.PI) % 8;
};

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AbyssosTheEighthCircleSavage,
  timelineFile: 'p8s.txt',
  initData: () => {
    return {
      combatantData: [],
      torches: [],
      flareTargets: [],
      upliftCounter: 0,
      ventIds: [],
    };
  },
  triggers: [
    // ---------------- Part 1 ----------------
    {
      id: 'P8S Genesis of Flame',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7944', source: 'Hephaistos', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'P8S Scorching Fang',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7912', source: 'Hephaistos', capture: false }),
      alertText: (data, _matches, output) => {
        if (data.conceptual === 'octa')
          return output.outAndSpread!();
        if (data.conceptual === 'tetra')
          return output.outAndStacks!();
        return output.out!();
      },
      run: (data) => delete data.conceptual,
      outputStrings: {
        out: Outputs.out,
        outAndSpread: {
          en: '밖으로 + 흩어져욧',
        },
        outAndStacks: {
          en: '밖에서 + 뭉쳐욧',
        },
      },
    },
    {
      id: 'P8S Sun\'s Pinion',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7913', source: 'Hephaistos', capture: false }),
      // There are two casts, one for each side.
      suppressSeconds: 1,
      alertText: (data, _matches, output) => {
        if (data.conceptual === 'octa')
          return output.inAndSpread!();
        if (data.conceptual === 'tetra')
          return output.inAndStacks!();
        return output.in!();
      },
      run: (data) => delete data.conceptual,
      outputStrings: {
        in: Outputs.in,
        inAndSpread: {
          en: '안에서 + 흩어져욧',
        },
        inAndStacks: {
          en: '안에서 + 뭉쳐욧',
        },
      },
    },
    {
      id: 'P8S Flameviper',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7945', source: 'Hephaistos' }),
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'P8S Conceptual Diflare Quadruped',
      type: 'StartsUsing',
      // 7915 normally
      // 7916 during Blazing Footfalls
      netRegex: NetRegexes.startsUsing({ id: '7917', source: 'Hephaistos', capture: false }),
      durationSeconds: 20,
      infoText: (_data, _matches, output) => output.healerGroups!(),
      outputStrings: {
        healerGroups: Outputs.healerGroups,
      },
    },
    {
      id: 'P8S Conceptual Tetraflare Quadruped',
      type: 'StartsUsing',
      // 7915 normally
      // 7916 during Blazing Footfalls
      netRegex: NetRegexes.startsUsing({ id: '7916', source: 'Hephaistos', capture: false }),
      durationSeconds: 20,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '파트너랑 뭉쳐욧',
        },
      },
    },
    {
      id: 'P8S Conceptual Tetraflare',
      type: 'StartsUsing',
      // 7915 normally
      // 7916 during Blazing Footfalls
      netRegex: NetRegexes.startsUsing({ id: '7915', source: 'Hephaistos', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.conceptual = 'tetra',
      outputStrings: {
        text: {
          en: '(나중에 파트너랑 뭉쳐욧)',
          de: '(Partner-Stacks, für später)',
        },
      },
    },
    {
      id: 'P8S Conceptual Octaflare',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7914', source: 'Hephaistos', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.conceptual = 'octa',
      outputStrings: {
        text: {
          en: '(나중에 흩어져욧)',
          de: '(Verteilen, für später)',
        },
      },
    },
    {
      id: 'P8S Octaflare',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '791D', source: 'Hephaistos', capture: false }),
      response: Responses.spread('alarm'),
    },
    {
      id: 'P8S Tetraflare',
      type: 'StartsUsing',
      // During vents and also during clones.
      netRegex: NetRegexes.startsUsing({ id: '791E', source: 'Hephaistos', capture: false }),
      alertText: (data, _matches, output) => {
        if (data.illusory === 'bird')
          return output.inAndStacks!();
        if (data.illusory === 'snake')
          return output.outAndStacks!();
        return output.stacks!();
      },
      run: (data) => delete data.illusory,
      outputStrings: {
        inAndStacks: {
          en: '안에서 + 뭉쳐욧',
        },
        outAndStacks: {
          en: '밖에서 + 뭉쳐욧',
        },
        stacks: {
          en: '파트너랑 뭉쳐욧',
        },
      },
    },
    {
      id: 'P8S Nest of Flamevipers',
      type: 'StartsUsing',
      // During clones.
      netRegex: NetRegexes.startsUsing({ id: '791F', source: 'Hephaistos', capture: false }),
      alertText: (data, _matches, output) => {
        if (data.illusory === 'bird')
          return output.inAndProtean!();
        if (data.illusory === 'snake')
          return output.outAndProtean!();
        // This shouldn't happen, but just in case.
        return output.protean!();
      },
      run: (data) => delete data.illusory,
      outputStrings: {
        inAndProtean: {
          en: '안에서 + 프로틴',
        },
        outAndProtean: {
          en: '밖으로 + 프로틴',
        },
        protean: {
          en: '프로틴',
        },
      },
    },
    {
      id: 'P8S Torch Flame Collect',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7927', source: 'Hephaistos' }),
      run: (data, matches) => data.torches.push(matches),
    },
    {
      id: 'P8S Torch Flame',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7927', source: 'Hephaistos', capture: false }),
      delaySeconds: 0.5,
      suppressSeconds: 1,
      promise: async (data) => {
        data.combatantData = [];
        const ids = data.torches.map((torch) => parseInt(torch.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
        data.torches = [];
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length === 0)
          return;

        const safe = {
          cornerNW: true,
          cornerNE: true,
          cornerSE: true,
          cornerSW: true,
          // Unlike normal mode, these "outside" are two tiles and not 4,
          // e.g. "outsideNorth" = NNW/NNE tiles.
          // The ordering here matters.
          outsideNorth: true,
          insideNorth: true,
          outsideWest: true,
          insideWest: true,
          outsideEast: true,
          insideEast: true,
          outsideSouth: true,
          insideSouth: true,
        };

        // idx = x + y * 4
        // This map is the tile index mapped to the keys that any
        // torch exploding on that square would make unsafe.
        const unsafeMap: { [idx: number]: (keyof typeof safe)[] } = {
          0: ['cornerNW'],
          1: ['outsideNorth'],
          2: ['outsideNorth'],
          3: ['cornerNE'],

          4: ['outsideWest'],
          5: ['insideWest', 'insideNorth'],
          6: ['insideEast', 'insideNorth'],
          7: ['outsideEast'],

          8: ['outsideWest'],
          9: ['insideWest', 'insideSouth'],
          10: ['insideEast', 'insideSouth'],
          11: ['outsideEast'],

          12: ['cornerSW'],
          13: ['outsideSouth'],
          14: ['outsideSouth'],
          15: ['cornerSE'],
        };

        // Loop through all torches, remove any rows/columns it intersects with
        // to find safe lanes.
        for (const torch of data.combatantData) {
          // x, y = 85, 95, 105, 115
          // map to ([0, 3], [0, 3])
          const x = Math.floor((torch.PosX - 85) / 10);
          const y = Math.floor((torch.PosY - 85) / 10);

          const idx = x + y * 4;
          const unsafeArr = unsafeMap[idx];
          for (const entry of unsafeArr ?? [])
            delete safe[entry];
        }

        const safeKeys = Object.keys(safe);
        const [safe0, safe1, safe2, safe3] = safeKeys;

        // Unexpectedly zero safe zones.
        if (safe0 === undefined)
          return;

        // Special case inner four squares.
        if (
          safeKeys.length === 4 &&
          // Ordered same as keys above.
          safe0 === 'insideNorth' &&
          safe1 === 'insideWest' &&
          safe2 === 'insideEast' &&
          safe3 === 'insideSouth'
        )
          return output.insideSquare!();

        // Not set up to handle more than two safe zones.
        if (safe2 !== undefined)
          return;
        if (safe1 === undefined)
          return output[safe0]!();

        const dir1 = output[safe0]!();
        const dir2 = output[safe1]!();
        return output.combo!({ dir1: dir1, dir2: dir2 });
      },
      outputStrings: {
        combo: {
          en: '${dir1} / ${dir2}',
          de: '${dir1} / ${dir2}',
          ja: '${dir1} / ${dir2}',
          ko: '${dir1} / ${dir2}',
        },
        insideSquare: {
          en: '안쪽 사각형',
          de: 'Inneres Viereck',
          ja: '内側の四角',
        },
        cornerNW: {
          en: '① 왼쪽위',
          de: 'NW Ecke',
          ja: '① 左上',
        },
        cornerNE: {
          en: '② 오른쪽위',
          de: 'NO Ecke',
          ja: '② 右上',
        },
        cornerSE: {
          en: '③ 오른쪽아래',
          de: 'SO Ecke',
          ja: '③ 右下',
        },
        cornerSW: {
          en: '④ 왼쪽아래',
          de: 'SW Ecke',
          ja: '④ 左下',
        },
        outsideNorth: {
          en: '▲▲ 바깥',
          de: 'Im Norden raus',
          fr: 'Nord Extérieur',
          ja: '北の外側',
          ko: '북쪽, 바깥',
        },
        insideNorth: {
          en: '▲▲ 안',
          de: 'Im Norden rein',
          fr: 'Nord Intérieur',
          ja: '北の内側',
          ko: '북쪽, 안',
        },
        outsideEast: {
          en: '▶▶ 바깥',
          de: 'Im Osten raus',
          fr: 'Est Extérieur',
          ja: '東の外側',
          ko: '동쪽, 바깥',
        },
        insideEast: {
          en: '▶▶ 안',
          de: 'Im Osten rein',
          fr: 'Est Intérieur',
          ja: '東の内側',
          ko: '동쪽, 안',
        },
        outsideSouth: {
          en: '▼▼ 바깥',
          de: 'Im Süden raus',
          fr: 'Sud Extérieur',
          ja: '南の外側',
          ko: '남쪽, 바깥',
        },
        insideSouth: {
          en: '▼▼ 안',
          de: 'Im Süden rein',
          fr: 'Sud Intérieur',
          ja: '南の内側',
          ko: '남쪽, 안',
        },
        outsideWest: {
          en: '◀◀ 바깥',
          de: 'Im Westen raus',
          fr: 'Ouest Extérieur',
          ja: '西の外側',
          ko: '서쪽, 바깥',
        },
        insideWest: {
          en: '◀◀ 안',
          de: 'Im Westen rein',
          fr: 'Ouest Intérieur',
          ja: '西の内側',
          ko: '서쪽, 안',
        },
      },
    },
    {
      id: 'P8S Ektothermos',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '79EA', source: 'Hephaistos', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'P8S Footprint',
      type: 'Ability',
      // There is 6.4 seconds between this Reforged Reflection ability and the Footprint (7109) ability.
      netRegex: NetRegexes.ability({ id: '794B', source: 'Hephaistos', capture: false }),
      delaySeconds: 1.5,
      alertText: (_data, _matches, output) => output.knockback!(),
      outputStrings: {
        knockback: {
          en: '넉백! 그리고 4연속 돌!',
          ja: 'ノックバック => 4足歩行',
        },
      },
    },
    {
      id: 'P8S Snaking Kick',
      type: 'StartsUsing',
      // This is the Reforged Reflection cast.
      netRegex: NetRegexes.startsUsing({ id: '794C', source: 'Hephaistos', capture: false }),
      alertText: (_data, _matches, output) => output.out!(),
      outputStrings: {
        out: {
          en: '밖으로! 그리고 비암!',
          ja: '外へ => 蛇腕',
        },
      },
    },
    {
      id: 'P8S Uplift Counter',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7935', source: 'Hephaistos', capture: false }),
      // Count in a separate trigger so that we can suppress it, but still call out for
      // both people hit.
      preRun: (data, _matches) => data.upliftCounter++,
      suppressSeconds: 1,
      sound: '',
      infoText: (data, _matches, output) => output.text!({ num: data.upliftCounter }),
      tts: null,
      outputStrings: {
        text: {
          en: '${num}번째',
          de: '${num}',
          fr: '${num}',
          ja: '${num}',
          cn: '${num}',
          ko: '${num}',
        },
      },
    },
    {
      id: 'P8S Uplift Number',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7935', source: 'Hephaistos' }),
      condition: Conditions.targetIsYou(),
      // ~12.8 seconds between #1 Uplift (7935) to #1 Stomp Dead (7937)
      // ~13.8 seconds between #4 Uplift (7935) to #4 Stomp Dead (7937).
      // Split the difference with 13.3 seconds.
      durationSeconds: 13.3,
      alertText: (data, _matches, output) => output.text!({ num: data.upliftCounter }),
      outputStrings: {
        text: {
          en: '나는 ${num}번째',
          de: '${num}',
          fr: '${num}',
          ja: '${num}',
          cn: '${num}',
          ko: '${num}',
        },
      },
    },
    {
      id: 'P8S Quadrupedal Impact',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7A04', source: 'Hephaistos', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '점프 따라가욧',
        },
      },
    },
    {
      id: 'P8S Quadrupedal Crush',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7A05', source: 'Hephaistos', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '점프에서 멀어져욧',
        },
      },
    },
    {
      id: 'P8S Illusory Hephaistos Scorched Pinion First',
      type: 'StartsUsing',
      // This is "Illusory Hephaistos" but sometimes it says "Gorgon".
      netRegex: NetRegexes.startsUsing({ id: '7953' }),
      condition: (data) => data.flareTargets.length === 0,
      suppressSeconds: 1,
      promise: async (data, matches) => {
        data.combatantData = [];

        const id = parseInt(matches.sourceId, 16);
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [id],
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        const combatant = data.combatantData[0];
        if (combatant === undefined || data.combatantData.length !== 1)
          return;

        const dir = positionTo8Dir(combatant);
        if (dir === 0 || dir === 4)
          return output.northSouth!();
        if (dir === 2 || dir === 6)
          return output.eastWest!();
      },
      outputStrings: {
        northSouth: {
          en: '남북에 새 → 위아래 깜선 바깥으로',
        },
        eastWest: {
          en: '동서에 새 → 옆 깜선 바깥으로',
        },
      },
    },
    {
      id: 'P8S Illusory Hephaistos Scorched Pinion Second',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7953', source: 'Illusory Hephaistos', capture: false }),
      condition: (data) => data.flareTargets.length > 0,
      suppressSeconds: 1,
      run: (data) => data.illusory = 'bird',
    },
    {
      id: 'P8S Illusory Hephaistos Scorching Fang Second',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7952', source: 'Illusory Hephaistos', capture: false }),
      condition: (data) => data.flareTargets.length > 0,
      suppressSeconds: 1,
      run: (data) => data.illusory = 'snake',
    },
    {
      id: 'P8S Hemitheos\'s Flare Hit',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '72CE', source: 'Hephaistos' }),
      preRun: (data, matches) => data.flareTargets.push(matches.target),
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.text!();
      },
      outputStrings: {
        text: {
          en: '(프로틴 피하기)',
          de: '(weiche Himmelsrichtungen aus)',
        },
      },
    },
    {
      id: 'P8S Hemitheos\'s Flare Not Hit',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '72CE', source: 'Hephaistos', capture: false }),
      delaySeconds: 0.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (!data.flareTargets.includes(data.me))
          return output.text!();
      },
      outputStrings: {
        text: {
          en: '안으로, 곧 프로틴',
          de: 'rein für Himmelsrichtungen',
        },
      },
    },
    {
      id: 'P8S Suneater Cthonic Vent Add',
      type: 'AddedCombatant',
      netRegex: NetRegexes.addedCombatantFull({ npcNameId: '11404' }),
      run: (data, matches) => data.ventIds.push(matches.id),
    },
    {
      id: 'P8S Suneater Cthonic Vent Initial',
      type: 'StartsUsing',
      // TODO: vents #2 and #3 are hard, but the first vent cast has a ~5s cast time.
      netRegex: NetRegexes.startsUsing({ id: '7925', source: 'Suneater', capture: false }),
      suppressSeconds: 1,
      promise: async (data: Data) => {
        data.combatantData = [];
        if (data.ventIds.length !== 2)
          return;

        const ids = data.ventIds.map((id) => parseInt(id, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length === 0)
          return;

        const unsafeSpots = data.combatantData.map((c) => positionTo8Dir(c)).sort();

        const [unsafe0, unsafe1] = unsafeSpots;
        if (unsafe0 === undefined || unsafe1 === undefined)
          throw new UnreachableCode();

        // edge case wraparound
        if (unsafe0 === 1 && unsafe1 === 7)
          return output.south!();

        // adjacent unsafe spots, cardinal is safe
        if (unsafe1 - unsafe0 === 2) {
          // this average is safe to do because wraparound was taken care of above.
          const unsafeCard = Math.floor((unsafe0 + unsafe1) / 2);

          const safeDirMap: { [dir: number]: string } = {
            0: output.south!(), // this won't happen, but here for completeness
            2: output.west!(),
            4: output.north!(),
            6: output.east!(),
          } as const;
          return safeDirMap[unsafeCard] ?? output.unknown!();
        }

        // two intercards are safe, they are opposite each other,
        // so we can pick the intercard counterclock of each unsafe spot.
        // e.g. 1/5 are unsafe (NE and SW), so SE and NW are safe.
        const safeIntercardMap: { [dir: number]: string } = {
          1: output.dirNW!(),
          3: output.dirNE!(),
          5: output.dirSE!(),
          7: output.dirSW!(),
        } as const;

        const safeStr0 = safeIntercardMap[unsafe0] ?? output.unknown!();
        const safeStr1 = safeIntercardMap[unsafe1] ?? output.unknown!();
        return output.comboDir!({ dir1: safeStr0, dir2: safeStr1 });
      },
      outputStrings: {
        comboDir: {
          en: '${dir1} / ${dir2}',
        },
        north: {
          en: '▲▲ 윗쪽',
          ja: '北',
          ko: '북쪽',
        },
        east: {
          en: '▶▶ 오른쪽',
          ja: '東',
          ko: '동쪽',
        },
        south: {
          en: '▼▼ 아래쪽',
          ja: '南',
          ko: '남쪽',
        },
        west: {
          en: '◀◀ 왼쪽',
          ja: '西',
          ko: '서쪽',
        },
        dirNE: {
          en: '② 오른쪽위',
          ja: '北東',
          ko: '북동',
        },
        dirSE: {
          en: '③ 오른쪽아래',
          ja: '南東',
          ko: '남동',
        },
        dirSW: {
          en: '④ 왼쪽아래',
          ja: '南西',
          ko: '남서',
        },
        dirNW: {
          en: '① 왼쪽위',
          ja: '北西',
          ko: '북서',
        },
        unknown: Outputs.unknown,
      },
    },
    // ---------------- Part 2 ----------------
    {
      id: 'P8S Aioniopyr',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '79DF', source: 'Hephaistos', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체공격 + 출혈',
        },
      },
    },
    {
      id: 'P8S Tyrant\'s Unholy Darkness',
      type: 'StartsUsing',
      // Untargeted, with 79DE damage after.
      netRegex: NetRegexes.startsUsing({ id: '79DD', source: 'Hephaistos', capture: false }),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '따로 따로 탱크버스터',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Conceptual Octaflare/Conceptual Tetraflare': 'Conceptual Octa/Tetraflare',
        'Emergent Octaflare/Emergent Tetraflare': 'Emergent Octa/Tetraflare',
        'Tetraflare/Octaflare': 'Tetra/Octaflare',
        'Scorching Fang/Scorched Pinion': 'Fang/Pinion',
        'Scorching Fang/Sun\'s Pinion': 'Fang/Pinion',
        'Tetraflare/Nest of Flamevipers': 'Tetraflare/Flamevipers',
        'Quadrupedal Impact/Quadrupedal Crush': 'Quadrupedal Impact/Crush',
        'Quadrupedal Crush/Quadrupedal Impact': 'Quadrupedal Crush/Impact',
        'Emergent Diflare/Emergent Tetraflare': 'Emergent Di/Tetraflare',
        'Forcible Trifire/Forcible Difreeze': 'Forcible Trifire/Difreeze',
        'Forcible Difreeze/Forcible Trifire': 'Forcible Difreeze/Trifire',
        'Forcible Fire III/Forcible Fire II': 'Forcible Fire III/II',
        'Forcible Fire II/Forcible Fire III': 'Forcible Fire II/III',
      },
    },
    {
      'locale': 'de',
      'missingTranslations': true,
      'replaceSync': {
        'Gorgon': 'gorgone',
        '(?<!Illusory )Hephaistos': 'Héphaïstos',
        'Illusory Hephaistos': 'spectre d\'Héphaïstos',
        'Suneater': 'serpent en flammes',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
      'replaceSync': {
        'Gorgon': 'gorgone',
        '(?<!Illusory )Hephaistos': 'Héphaïstos',
        'Illusory Hephaistos': 'spectre d\'Héphaïstos',
        'Suneater': 'serpent en flammes',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Gorgon': 'ゴルゴン',
        '(?<!Illusory )Hephaistos': 'ヘファイストス',
        'Illusory Hephaistos': 'ヘファイストスの幻影',
        'Suneater': '炎霊蛇',
      },
    },
  ],
};

export default triggerSet;
