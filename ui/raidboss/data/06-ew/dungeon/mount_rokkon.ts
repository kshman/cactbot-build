import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: find network lines for Yozakura Seal of Riotous Bloom arrows (nothing in network logs)
// TODO: find network lines for Enenra Out of the Smoke (nothing in network logs)
// TODO: Yozakura Seasons of the Fleeting
//       you would need to track 8384 (pinwheel) and 8383 (line) *abilities* (not incorrect casts)
//       and use their positions and rotations to know whether to say front/back/card/intercard
//       she repositions beforehand, so front/back of her is a known safe position.
// TODO: Moko safe spots for Iron Rain
// TODO: Gorai path 06 Humble Hammer safe spots for which Ball of Levin hit by Humble Hammer
// TODO: Shishio Rokujo calls ("go SW, clockwise") kinda thing

const sealMap = {
  '837A': 'fire',
  '837B': 'wind',
  '837C': 'thunder',
  '837D': 'rain',
} as const;

type Seal = typeof sealMap[keyof typeof sealMap];

const sealDamageMap: { [id: string]: Seal } = {
  '8375': 'fire',
  '8376': 'wind',
  '8377': 'rain',
  '8378': 'thunder',
} as const;

const sealIds = Object.keys(sealMap);
const sealDamageIds = Object.keys(sealDamageMap);

const mokoVfxMap = {
  '248': 'back',
  '249': 'left',
  '24A': 'front',
  '24B': 'right',
} as const;

type KasumiGiri = typeof mokoVfxMap[keyof typeof mokoVfxMap];

export interface Data extends RaidbossData {
  combatantData: PluginCombatantState[];
  yozakuraSeal: Seal[];
  yozakuraTatami: string[];
  isDoubleKasumiGiri?: boolean;
  firstKasumiGiri?: KasumiGiri;
  goraiSummon?: NetMatches['StartsUsing'];
  enenraPipeCleanerCollect: string[];
  devilishThrallCollect: NetMatches['StartsUsing'][];
}

const triggerSet: TriggerSet<Data> = {
  id: 'MountRokkon',
  zoneId: ZoneId.MountRokkon,
  timelineFile: 'mount_rokkon.txt',
  initData: () => {
    return {
      combatantData: [],
      yozakuraSeal: [],
      yozakuraTatami: [],
      enenraPipeCleanerCollect: [],
      devilishThrallCollect: [],
    };
  },
  triggers: [
    // --------- Yozakura the Fleeting ----------
    {
      id: 'Rokkon Yozakura Glory Neverlasting',
      type: 'StartsUsing',
      netRegex: { id: '83A9', source: 'Yozakura the Fleeting' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Rokkon Yozakura Art of the Windblossom',
      type: 'StartsUsing',
      netRegex: { id: '8369', source: 'Yozakura the Fleeting', capture: false },
      response: Responses.getIn('info'),
    },
    {
      id: 'Rokkon Yozakura Art of the Fireblossom',
      type: 'StartsUsing',
      netRegex: { id: '8368', source: 'Yozakura the Fleeting', capture: false },
      response: Responses.getOut('info'),
    },
    {
      id: 'Rokkon Yozakura Shadowflight',
      type: 'StartsUsing',
      netRegex: { id: '8380', source: 'Mirrored Yozakura', capture: false },
      response: Responses.moveAway(),
    },
    {
      id: 'Rokkon Yozakura Kuge Rantsui',
      type: 'StartsUsing',
      netRegex: { id: '83AA', source: 'Yozakura the Fleeting', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Yozakura Drifting Petals',
      type: 'StartsUsing',
      netRegex: { id: '8393', source: 'Yozakura the Fleeting', capture: false },
      alertText: (_data, _matches, output) => output.knockback!(),
      outputStrings: {
        knockback: {
          en: 'Unavoidable Knockback',
          ja: '避けないノックバック',
          ko: '넉백 못 막음',
        },
      },
    },
    {
      id: 'Rokkon Yozakura Seal Collect',
      type: 'Ability',
      netRegex: { id: sealIds, source: 'Yozakura the Fleeting' },
      run: (data, matches) => {
        // Collect flowers as they appear.
        // TODO: there are no network lines for which ones are active.
        // So we do the best we can, which is:
        // * show an alert for the first set (with only two)
        // * show nothing on the first pair of further sets (this is probably confusing to players)
        // * by process of elimination show the second pair on further sets
        const looseSealMap: { [id: string]: Seal } = sealMap;
        const seal = looseSealMap[matches.id];
        if (seal !== undefined)
          data.yozakuraSeal.push(seal);
      },
    },
    {
      id: 'Rokkon Yozakura Seal of Riotous Bloom',
      type: 'StartsUsing',
      netRegex: { id: '8374', source: 'Yozakura the Fleeting', capture: false },
      alertText: (data, _matches, output) => {
        // If we know what this is, show something. Otherwise, sorry.
        if (data.yozakuraSeal.length !== 2)
          return;
        const isIn = data.yozakuraSeal.includes('wind');
        const isCardinals = data.yozakuraSeal.includes('rain');
        if (isIn && isCardinals)
          return output.inAndCards!();
        if (isIn && !isCardinals)
          return output.inAndIntercards!();
        if (!isIn && isCardinals)
          return output.outAndCards!();
        if (!isIn && !isCardinals)
          return output.outAndIntercards!();
      },
      outputStrings: {
        inAndCards: {
          en: 'In + Cardinals',
          ja: 'In + Cardinals',
          ko: '안에서 + ➕회피',
        },
        outAndCards: {
          en: 'Out + Cardinals',
          ja: 'Out + Cardinals',
          ko: '밖으로 + ➕회피',
        },
        inAndIntercards: {
          en: 'In + Intercards',
          ja: 'In + Intercards',
          ko: '안에서 + ❌회피',
        },
        outAndIntercards: {
          en: 'Out + Intercards',
          ja: 'Out + Intercards',
          ko: '밖으로 + ❌회피',
        },
      },
    },
    {
      id: 'Rokkon Yozakura Seal Damage Collect',
      type: 'StartsUsing',
      netRegex: { id: sealDamageIds, source: 'Yozakura the Fleeting' },
      run: (data, matches) => {
        // Remove abilities that have happened so we can know the second pair.
        const seal = sealDamageMap[matches.id];
        data.yozakuraSeal = data.yozakuraSeal.filter((x) => x !== seal);
      },
    },
    {
      id: 'Rokkon Yozakura Art of the Fluff',
      type: 'StartsUsing',
      netRegex: { id: '839E', source: 'Shiromaru' },
      alertText: (_data, matches, output) => {
        const xPos = parseFloat(matches.x);
        // center = 737
        // east = 765
        // west = 709
        if (xPos > 737)
          return output.lookWest!();
        return output.lookEast!();
      },
      outputStrings: {
        lookWest: {
          en: 'Look West',
          ja: 'Look West',
          ko: '서쪽 봐요',
        },
        lookEast: {
          en: 'Look East',
          ja: 'Look East',
          ko: '동쪽 봐요',
        },
      },
    },
    {
      id: 'Rokkon Yozakura Tatami Collect',
      type: 'MapEffect',
      // 00020001 = shake
      // 00080004 = go back to normal
      // 80038CA2 = flip
      netRegex: { flags: '00020001' },
      run: (data, matches) => data.yozakuraTatami.push(matches.location),
    },
    {
      id: 'Rokkon Yozakura Tatami-gaeshi',
      type: 'StartsUsing',
      netRegex: { id: '8395', source: 'Yozakura the Fleeting', capture: false },
      alertText: (data, _matches, output) => {
        const map: { [location: string]: string } = {
          '37': 'outsideNorth',
          '38': 'insideNorth',
          '39': 'insideSouth',
          '3A': 'outsideSouth',
        };

        for (const location of data.yozakuraTatami)
          delete map[location];

        // Call inside before outside.
        const callOrder = ['38', '39', '37', '3A'];

        for (const key of callOrder) {
          const outputKey = map[key];
          if (outputKey !== undefined)
            return output[outputKey]!();
        }
      },
      run: (data) => data.yozakuraTatami = [],
      outputStrings: {
        outsideNorth: {
          en: 'Outside North',
          ja: 'Outside North',
          ko: '[북] 바깥',
        },
        insideNorth: {
          en: 'Inside North',
          ja: 'Inside North',
          ko: '[북] 안쪽',
        },
        insideSouth: {
          en: 'Inside South',
          ja: 'Inside South',
          ko: '[남] 안쪽',
        },
        outsideSouth: {
          en: 'Outside South',
          ja: 'Outside South',
          ko: '[남] 바깥',
        },
      },
    },
    {
      id: 'Rokkon Yozakura Root Arrangement',
      type: 'HeadMarker',
      netRegex: { id: '00C5' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '4x Chasing AOE on YOU',
          ja: '4x Chasing AOE on YOU',
          ko: '장판 4개가 따라와요',
        },
      },
    },
    // --------- Moko the Restless ----------
    {
      id: 'Rokkon Moko Kenki Release',
      type: 'StartsUsing',
      netRegex: { id: '85AD', source: 'Moko the Restless', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Moko Scarlet Auspice',
      type: 'StartsUsing',
      netRegex: { id: '8598', source: 'Moko the Restless', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Rokkon Moko Azure Auspice',
      type: 'StartsUsing',
      netRegex: { id: '859C', source: 'Moko the Restless', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'Rokkon Moko Double Kasumi-Giri Checker',
      type: 'StartsUsing',
      // This cast comes out prior to the BA9 vfx.
      netRegex: { id: '858[BCDE]', source: 'Moko the Restless', capture: false },
      run: (data) => data.isDoubleKasumiGiri = true,
    },
    {
      id: 'Rokkon Moko Iai-kasumi-giri',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: Object.keys(mokoVfxMap) },
      condition: (data) => !data.isDoubleKasumiGiri,
      alertText: (_data, matches, output) => {
        const map: { [name: string]: KasumiGiri } = mokoVfxMap;
        const thisAbility = map[matches.count];
        if (thisAbility === undefined)
          return;
        return output[thisAbility]!();
      },
      outputStrings: {
        back: Outputs.back,
        front: Outputs.front,
        left: Outputs.left,
        right: Outputs.right,
      },
    },
    {
      id: 'Rokkon Moko Double Kasumi-giri Second',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: Object.keys(mokoVfxMap) },
      condition: (data) => data.isDoubleKasumiGiri && data.firstKasumiGiri !== undefined,
      durationSeconds: 6,
      alertText: (data, matches, output) => {
        const map: { [name: string]: KasumiGiri } = mokoVfxMap;
        const thisAbility = map[matches.count];
        if (thisAbility === undefined)
          return;

        const firstDir = data.firstKasumiGiri;
        if (firstDir === undefined)
          return;

        const dir1 = output[firstDir]!();

        const secondMap: Record<KasumiGiri, string> = {
          front: output.through!(),
          back: output.stay!(),
          left: output.rotateLeft!(),
          right: output.rotateRight!(),
        } as const;
        const dir2 = secondMap[thisAbility];
        return output.combo!({ dir1: dir1, dir2: dir2 });
      },
      run: (data) => {
        delete data.firstKasumiGiri;
        delete data.isDoubleKasumiGiri;
      },
      outputStrings: {
        back: Outputs.back,
        front: Outputs.front,
        left: Outputs.left,
        right: Outputs.right,
        through: {
          en: 'Run Through',
          ja: 'Run Through',
          ko: '지나쳐 이동',
        },
        stay: {
          en: 'Stay',
          ja: 'Stay',
          ko: '그대로',
        },
        rotateLeft: {
          en: 'Rotate Left',
          ja: 'Rotate Left',
          ko: '왼쪽으로',
        },
        rotateRight: {
          en: 'Rotate Right',
          ja: 'Rotate Right',
          ko: '오른쪽으로',
        },
        combo: {
          en: '${dir1} => ${dir2}',
          ja: '${dir1} => ${dir2}',
          ko: '${dir1} 🔜 ${dir2}',
        },
      },
    },
    {
      id: 'Rokkon Moko Double Kasumi-giri First',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A', count: Object.keys(mokoVfxMap) },
      condition: (data) => data.isDoubleKasumiGiri && data.firstKasumiGiri === undefined,
      infoText: (data, matches, output) => {
        const map: { [name: string]: KasumiGiri } = mokoVfxMap;
        const thisAbility = map[matches.count];
        if (thisAbility === undefined)
          return;
        data.firstKasumiGiri = thisAbility;
        return output.text!({ dir: output[thisAbility]!() });
      },
      outputStrings: {
        text: {
          en: '(${dir} First)',
          ja: '(${dir} First)',
          ko: '(${dir} 먼저)',
        },
        back: Outputs.back,
        front: Outputs.front,
        left: Outputs.left,
        right: Outputs.right,
        combo: {
          en: '${dir1} => ${dir2}',
          ja: '${dir1} => ${dir2}',
          ko: '${dir1} 🔜 ${dir2}',
        },
      },
    },
    // --------- Gorai the Uncaged ----------
    {
      id: 'Rokkon Gorai Unenlightemnment',
      type: 'StartsUsing',
      netRegex: { id: '8500', source: 'Gorai the Uncaged', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Gorai Fighting Spirits',
      type: 'StartsUsing',
      netRegex: { id: '84F8', source: 'Gorai the Uncaged', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Gorai Biwa Breaker',
      type: 'StartsUsing',
      netRegex: { id: '84FD', source: 'Gorai the Uncaged', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Gorai Torching Torment',
      type: 'StartsUsing',
      netRegex: { id: '84FE', source: 'Gorai the Uncaged' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Rokkon Gorai Summon Collect',
      type: 'StartsUsing',
      // 84D5 = Flickering Flame
      // 84D6 = Sulphuric Stone
      // 84D7 = Flame and Sulphur
      netRegex: { id: ['84D5', '84D6', '84D7'], source: 'Gorai the Uncaged' },
      run: (data, matches) => data.goraiSummon = matches,
    },
    {
      id: 'Rokkon Gorai Plectrum of Power',
      type: 'StartsUsing',
      netRegex: { id: '84D8', source: 'Gorai the Uncaged', capture: false },
      alertText: (data, _matches, output) => {
        const id = data.goraiSummon?.id;
        if (id === '84D5')
          return output.lines!();
        if (id === '84D6')
          return output.rocks!();
        if (id === '84D7')
          return output.both!();
      },
      run: (data) => delete data.goraiSummon,
      outputStrings: {
        lines: {
          en: 'Avoid Expanding Lines',
          ja: 'Avoid Expanding Lines',
          ko: '넓어지는 줄 피해요',
        },
        rocks: {
          en: 'Avoid Expanding Rocks',
          ja: 'Avoid Expanding Rocks',
          ko: '넓어지는 돌맹이 피해요',
        },
        both: {
          en: 'Avoid Expanding Rocks/Lines',
          ja: 'Avoid Expanding Rocks/Lines',
          ko: '넓어지는 줄/돎맹이 피해요',
        },
      },
    },
    {
      id: 'Rokkon Gorai Morphic Melody',
      type: 'StartsUsing',
      netRegex: { id: '84D9', source: 'Gorai the Uncaged', capture: false },
      alertText: (data, _matches, output) => {
        const id = data.goraiSummon?.id;
        if (id === '84D5')
          return output.lines!();
        if (id === '84D6')
          return output.rocks!();
        if (id === '84D7')
          return output.both!();
      },
      run: (data) => delete data.goraiSummon,
      outputStrings: {
        lines: Outputs.goIntoMiddle,
        rocks: {
          en: 'Stand on Rock',
          ja: 'Stand on Rock',
          ko: '돌 위로',
        },
        both: {
          en: 'Stand on Rock + Line',
          ja: 'Stand on Rock + Line',
          ko: '돌 + 줄 위로',
        },
      },
    },
    {
      id: 'Rokkon Gorai Malformed Prayer',
      type: 'StartsUsing',
      netRegex: { id: '84E1', source: 'Gorai the Uncaged', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stand in All Towers',
          ja: 'Stand in All Towers',
          ko: '모든 타워에 밟아요',
        },
      },
    },
    // --------- Shishio ----------
    {
      id: 'Rokkon Shishio Enkyo',
      type: 'StartsUsing',
      netRegex: { id: '83F5', source: 'Shishio', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Shishio Splitting Cry',
      type: 'StartsUsing',
      netRegex: { id: '83F6', source: 'Shishio' },
      response: Responses.tankBuster(),
    },
    {
      id: 'Rokkon Shishio Noble Pursuit',
      type: 'StartsUsing',
      netRegex: { id: '83E6', source: 'Shishio', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Between Rings + Outside Line',
          ja: 'Between Rings + Outside Line',
          ko: '동글동글 사이 + 바깥',
        },
      },
    },
    {
      id: 'Rokkon Shishio Thunder Vortex',
      type: 'StartsUsing',
      netRegex: { id: '83F4', source: 'Shishio', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'Rokkon Shishio Devilish Thrall Collect',
      type: 'StartsUsing',
      // 83F0 = Right Swipe
      // 83F1 = Left Swipe
      netRegex: { id: ['83F0', '83F1'], source: 'Devilish Thrall' },
      run: (data, matches) => data.devilishThrallCollect.push(matches),
    },
    {
      id: 'Rokkon Shishio Devilish Thrall Safe Spot',
      type: 'StartsUsing',
      netRegex: { id: ['83F0', '83F1'], source: 'Devilish Thrall', capture: false },
      delaySeconds: 0.5,
      suppressSeconds: 1,
      promise: async (data: Data) => {
        data.combatantData = [];

        const ids = data.devilishThrallCollect.map((x) => parseInt(x.sourceId, 16));
        data.combatantData = (await callOverlayHandler({
          call: 'getCombatants',
          ids: ids,
        })).combatants;
      },
      alertText: (data, _matches, output) => {
        if (data.combatantData.length !== 4)
          return;
        const centerX = -40;
        const centerY = -300;

        // Cardinal thralls:
        //   x = -40 +/- 12
        //   y = -300 +/- 12
        //   heading = cardinals (pi/2 * n)

        // Variant Dungeon seems (at least in two pulls) to only have thralls
        // on cardinals, however handle a potential intercard thralls just in case.
        // There seems to be only one pattern of thralls, rotated.
        // Two are pointed inward (direct opposite to their position)
        // and two are pointed outward (perpendicular to their position).
        // Because of this, no need to check left/right cleave as position and directions tell all.
        const states = data.combatantData.map((combatant) => {
          return {
            dir: Directions.combatantStatePosTo8Dir(combatant, centerX, centerY),
            heading: Directions.combatantStateHdgTo8Dir(combatant),
          };
        });
        const outwardStates = states.filter((state) => state.dir !== (state.heading + 4) % 8);
        const [pos1, pos2] = outwardStates.map((x) => x.dir).sort();
        if (pos1 === undefined || pos2 === undefined || outwardStates.length !== 2)
          return;

        // The one case where the difference is 6 instead of 2.
        const averagePos = (pos1 === 0 && pos2 === 6) ? 7 : Math.floor((pos2 + pos1) / 2);
        return {
          0: output.north!(),
          1: output.northeast!(),
          2: output.east!(),
          3: output.southeast!(),
          4: output.south!(),
          5: output.southwest!(),
          6: output.west!(),
          7: output.northwest!(),
        }[averagePos];
      },
      run: (data) => data.devilishThrallCollect = [],
      outputStrings: {
        north: Outputs.north,
        east: Outputs.east,
        south: Outputs.south,
        west: Outputs.west,
        northeast: Outputs.northeast,
        southeast: Outputs.southeast,
        southwest: Outputs.southwest,
        northwest: Outputs.northwest,
      },
    },
    // --------- Enenra ----------
    {
      id: 'Rokkon Enenra Flagrant Combustion',
      type: 'StartsUsing',
      netRegex: { id: '8042', source: 'Enenra', capture: false },
      // Can be used during Smoke and Mirrors clone phase
      suppressSeconds: 5,
      response: Responses.aoe(),
    },
    {
      id: 'Rokkon Enenra Smoke Rings',
      type: 'StartsUsing',
      netRegex: { id: '8053', source: 'Enenra', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'Rokkon Enenra Clearing Smoke',
      type: 'StartsUsing',
      netRegex: { id: '8052', source: 'Enenra', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'Rokkon Enenra Pipe Cleaner Collect',
      type: 'Tether',
      netRegex: { id: '0011' },
      run: (data, matches) => data.enenraPipeCleanerCollect.push(matches.source),
    },
    {
      id: 'Rokkon Enenra Pipe Cleaner',
      type: 'StartsUsing',
      netRegex: { id: '8054', source: 'Enenra', capture: false },
      condition: (data) => data.enenraPipeCleanerCollect.includes(data.me),
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.enenraPipeCleanerCollect = [],
      outputStrings: {
        text: Outputs.earthshakerOnYou,
      },
    },
    {
      id: 'Rokkon Enenra Snuff',
      type: 'StartsUsing',
      netRegex: { id: '8056', source: 'Enenra' },
      response: Responses.tankCleave(),
    },
    {
      id: 'Rokkon Enenra Uplift',
      type: 'Ability',
      // If hit by Snuff, move away from uplift.
      netRegex: { id: '8056', source: 'Enenra' },
      condition: Conditions.targetIsYou(),
      response: Responses.moveAway(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Clearing Smoke/Smoke Rings': 'Clearing Smoke/Rings',
        'Morphic Melody/Plectrum of Power': 'Morphic/Plectrum',
        'Plectrum of Power/Morphic Melody': 'Plectrum/Morphic',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Ancient Katana': 'antik(?:e|er|es|en) Katana',
        'Ashigaru Kyuhei': 'Ashigaru Kyuhei',
        'Autumn Rivers\' End': 'Ufer des Herbstflusses',
        'Ball of Levin': 'Elektrosphäre',
        'Devilish Thrall': 'hörig(?:e|er|es|en) Shiki',
        'Enenra': 'Enenra',
        'Feral Thrall': 'hörig(?:e|er|es|en) Moko',
        'Gorai the Uncaged': 'Gorai (?:der|die|das) Entfesselt(?:e|er|es|en)',
        'Haunting Thrall': 'hörig(?:e|er|es|en) Shiryo',
        'Ill-come Tengu': 'ungebeten(?:e|er|es|en) Tengu',
        'Last Glimpse': 'Letzter Blick',
        'Mirrored Yozakura': 'gedoppelt(?:e|er|es|en) Yozakura',
        'Moko the Restless': 'Moko (?:der|die|das) Rastlos(?:e|er|es|en)',
        'Oni\'s Claw': 'Oni-Klaue',
        'Rairin': 'Rairin',
        'Shiromaru': 'Shiromaru',
        'Shishio': 'Shishio',
        'Shishu White Baboon': 'weiß(?:e|er|es|en) Shishu-Pavian',
        'Stone\'s Silence': 'Steines Schweigen',
        'The Hall Of Becoming': 'Halle des Werdens',
        'The Hall Of Temptation': 'Halle der Versuchungen',
        'The Hall Of The Unseen': 'Halle der Verhüllung',
        'The Pond Of Spring Rain': 'Teich des Frühlingsregens',
        'Venomous Thrall': 'hörig(?:e|er|es|en) Daija',
        'Yozakura the Fleeting': 'Yozakura (?:der|die|das) Vergänglich(?:e|er|es|en)',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        'Art of the Fireblossom': 'Kunst der Feuerblüte',
        'Art of the Fluff': 'Kunst der Flauschigkeit',
        'Art of the Windblossom': 'Kunst der Windblüte',
        'Azure Auspice': 'Azurblauer Kenki-Fokus',
        'Biwa Breaker': 'Biwa-Brecher',
        'Boundless Azure': 'Grenzenloses Azurblau',
        'Boundless Scarlet': 'Grenzenloses Scharlachrot',
        'Bunshin': 'Doppeltes Ich',
        '(?<!Levin)Burst': 'Explosion',
        'Clearing Smoke': 'Rauchauflösung',
        'Clearout': 'Ausräumung',
        'Donden-gaeshi': 'Donden-gaeshi',
        'Double Kasumi-giri': 'Doppeltes Kasumi-giri',
        'Drifting Petals': 'Blütenblätterregen',
        'Enkyo': 'Enkyo',
        'Explosion': 'Explosion',
        'Falling Rock': 'Steinschlag',
        'Fighting Spirits': 'Kräftigender Schluck',
        'Fire Spread': 'Brandstiftung',
        'Fireblossom Flare': 'Auflodern der Feuerblüte',
        'Flagrant Combustion': 'Abscheuliches Anfackeln',
        'Flame and Sulphur': 'Flamme und Schwefel',
        'Flickering Flame': 'Flackernde Flamme',
        'Focused Tremor': 'Kontrolliertes Beben',
        'Ghastly Grasp': 'Gruselgriff',
        'Glory Neverlasting': 'Trichterwinde',
        'Haunting Cry': 'Klagender Schrei',
        'Humble Hammer': 'Entehrender Hammer',
        'Iai-kasumi-giri': 'Iai-kasumi-giri',
        'Icebloom': 'Eisblüte',
        'Impure Purgation': 'Flammenwind',
        'Into the Fire': 'Blutgrätsche',
        'Iron Rain': 'Eisenregen',
        'Kenki Release': 'Kenki-Entfesselung',
        'Kiseru Clamor': 'Blutschwaden-Klatsche',
        'Kuge Rantsui': 'Kuge Rantsui',
        'Left Swipe': 'Linker Feger',
        'Levinblossom Lance': 'Blitz der Gewitterblüte',
        'Levinblossom Strike': 'Grollen der Gewitterblüte',
        'Levinburst': 'Blitzgang',
        'Malformed Prayer': 'Unheil des Perlenkranzes',
        'Moonless Night': 'Mondlose Nacht',
        'Morphic Melody': 'Morphende Melodie',
        'Mud Pie': 'Schlammklumpen',
        'Mudrain': 'Schlammblüte',
        'Noble Pursuit': 'Reißzahn des Löwen',
        'Nubuki': 'Nubuki',
        'Oka Ranman': 'Oka Ranman',
        'Once on Rokujo': 'Sechs Alleen: Einfach',
        'Out of the Smoke': 'Rauchwolke',
        'Pipe Cleaner': 'Klärende Aktion',
        'Plectrum of Power': 'Plektron der Macht',
        'Pure Shock': 'Elektrische Entladung',
        'Reisho': 'Reisho',
        'Right Swipe': 'Rechter Feger',
        'Root Arrangement': 'Wurzelwachstum',
        'Rousing Reincarnation': 'Fluch der Verwandlung',
        'Rush': 'Stürmen',
        'Scarlet Auspice': 'Scharlachroter Kenki-Fokus',
        'Seal Marker': 'Siegel Marker',
        'Seal of Riotous Bloom': 'Siegel des Wildblühens',
        'Seal of the Blossom': 'Siegel der Blüte',
        'Seal of the Fleeting': 'Kunst des Blütensiegels',
        'Season Indicator': 'Shikunshi Indikator',
        'Season of Element': 'Shikunshi des Elements',
        'Seasons of the Fleeting': 'Shikunshi',
        'Self-destruct': 'Selbstzerstörung',
        'Shadowflight': 'Schattenschlag',
        '(?<! )Shock': 'Entladung',
        'Silent Whistle': 'Hasenmedium',
        'Smoke Rings': 'Rauchringe',
        'Smoke Stack': 'Rauchschwade',
        'Smoke and Mirrors': 'Viel Rauch um nichts',
        'Smokeater': 'Dunstfresser',
        'Smoldering(?! Damnation)': 'Schwelendes Feuer',
        'Smoldering Damnation': 'Schwelende Verdammnis',
        'Snuff': 'Klatsche',
        'Soldiers of Death': 'Soldaten des Todes',
        'Spearman\'s Orders': 'Lanze vor!',
        'Spike of Flame': 'Flammenstachel',
        'Spiritflame': 'Geisterflamme',
        'Spiritspark': 'Geisterfunke',
        'Splitting Cry': 'Schrecklicher Schrei',
        'Stormcloud Summons': 'Elektrizitätsgenerierung',
        'String Snap': 'Bebende Erde',
        'Sulphuric Stone': 'Schwefliger Stein',
        'Tatami Trap': 'Fallenstellen',
        'Tatami-gaeshi': 'Tatami-gaeshi',
        'Tengu-yobi': 'Tengu-yobi',
        'Thunder Onefold': 'Blitzschlag: Einfach',
        'Thunder Threefold': 'Blitzschlag: Dreifach',
        'Thunder Twofold': 'Blitzschlag: Zweifach',
        'Thunder Vortex': 'Sturmwirbel',
        'Thundercall': 'Donnerruf',
        'Torching Torment': 'Höllische Hitze',
        'Unenlightenment': 'Glühende Geißel',
        'Unsheathing': 'Ziehen des Schwertes',
        'Untempered Sword': 'Zügelloses Schwert',
        'Uplift': 'Erhöhung',
        'Upwell': 'Strömung',
        'Vasoconstrictor': 'Vasokonstriktor',
        'Veil Sever': 'Schleierdurchtrennung',
        'Wily Wall': 'Missliche Mauerung',
        'Windblossom Whirl': 'Wirbel der Windblüte',
        'Witherwind': 'Blütenwirbel',
        'Worldly Pursuit': 'Springender Schmerzschlag',
        'Yama-kagura': 'Yama-kagura',
        'Yoki(?!-uzu)': 'Yoki',
        'Yoki-uzu': 'Yoki-uzu',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Ancient Katana': 'katana ancien',
        'Ashigaru Kyuhei': 'ashigaru kyûhei',
        'Autumn Rivers\' End': 'Clairière de l\'Équinoxe',
        'Ball of Levin': 'orbe de foudre',
        'Devilish Thrall': 'ilote malicieux',
        'Enenra': 'Enenra',
        'Feral Thrall': 'ilote féroce',
        'Gorai the Uncaged': 'Gôrai le fureteur',
        'Haunting Thrall': 'ilote envoûtant',
        'Ill-come Tengu': 'tengu du Rokkon',
        'Last Glimpse': 'Clairière du Discernement',
        'Mirrored Yozakura': 'double de Yozakura',
        'Moko the Restless': 'Môko le tourmenté',
        'Oni\'s Claw': 'griffe d\'oni',
        'Rairin': 'cercle de foudre',
        'Shiromaru': 'Shiromaru',
        'Shishio': 'Shishiô',
        'Shishu White Baboon': 'babouin de Shishû',
        'Stone\'s Silence': 'Jardin des pierres silencieuses',
        'The Hall Of Becoming': 'Salle des trésors du Shôjôin',
        'The Hall Of Temptation': 'Vestibule doré',
        'The Pond Of Spring Rain': 'Bassin de la Pureté absolue',
        'Venomous Thrall': 'ilote venimeux',
        'Yozakura the Fleeting': 'Yozakura l\'élusive',
      },
      'replaceText': {
        'Art of the Fireblossom': 'Art floral de feu',
        'Art of the Fluff': 'Art molletonné',
        'Art of the Windblossom': 'Art floral de vent',
        'Azure Auspice': 'Auspice azuré',
        'Biwa Breaker': 'Biwa désaccordé',
        'Boundless Azure': 'Lueur azurée',
        'Boundless Scarlet': 'Lueur écarlate',
        'Bunshin': 'Bunshin',
        '(?<!Levin)Burst': 'Explosion',
        'Clearing Smoke': 'Fumée dissipante',
        'Clearout': 'Fauchage',
        'Donden-gaeshi': 'Donden-gaeshi',
        'Double Kasumi-giri': 'Kasumi-giri double',
        'Drifting Petals': 'Pétales faillissants',
        'Enkyo': 'Enkyô',
        'Explosion': 'Explosion',
        'Falling Rock': 'Chute de pierre',
        'Fighting Spirits': 'Esprits spiritueux',
        'Fire Spread': 'Nappe de feu',
        'Fireblossom Flare': 'Éruption en fleur',
        'Flagrant Combustion': 'Combustion incandescente',
        'Flame and Sulphur': 'Soufre enflammé',
        'Flickering Flame': 'Flamme vacillante',
        'Focused Tremor': 'Séisme localisé',
        'Ghastly Grasp': 'Étreinte funeste',
        'Glory Neverlasting': 'Gloire éphémère',
        'Haunting Cry': 'Cri de tourmente',
        'Humble Hammer': 'Marteau d\'humilité',
        'Iai-kasumi-giri': 'Iai-kasumi-giri',
        'Icebloom': 'Floraison de givre',
        'Impure Purgation': 'Purgation impure',
        'Into the Fire': 'Onde sanglante',
        'Iron Rain': 'Pluie de fer',
        'Kenki Release': 'Décharge Kenki',
        'Kiseru Clamor': 'Pipe sanglante',
        'Kuge Rantsui': 'Kuge Rantsui',
        'Left Swipe': 'Tranchage gauche',
        'Levinblossom Lance': 'Lumière en fleur',
        'Levinblossom Strike': 'Tonnerre en fleur',
        'Levinburst': 'Éclat de foudre',
        'Malformed Prayer': 'Prière difforme',
        'Moonless Night': 'Nuit noire',
        'Morphic Melody': 'Mélodie mutante',
        'Mud Pie': 'Boule de boue',
        'Mudrain': 'Lotus de boue',
        'Noble Pursuit': 'Noble ambition',
        'Nubuki': 'Nubuki',
        'Oka Ranman': 'Oka Ranman',
        'Once on Rokujo': 'Rokujô simple',
        'Out of the Smoke': 'Nuée de fumée',
        'Pipe Cleaner': 'Onde fumeuse',
        'Plectrum of Power': 'Plectre du pouvoir',
        'Pure Shock': 'Choc électrisant',
        'Reisho': 'Reishô',
        'Right Swipe': 'Tranchage droit',
        'Root Arrangement': 'Bouquet de racines',
        'Rousing Reincarnation': 'Réincarnation vibrante',
        'Rush': 'Ruée',
        'Scarlet Auspice': 'Auspice écarlate',
        'Seal of Riotous Bloom': 'Sceau de floraison vivace',
        'Seal of the Blossom': 'Sceau de floraison',
        'Seal of the Fleeting': 'Sceau des quatre saisons',
        'Seasons of the Fleeting': 'Quatre saisons',
        'Season of Element': 'Saison de l\'élément',
        'Self-destruct': 'Auto-destruction',
        'Shadowflight': 'Vol ombrageux',
        '(?<! )Shock': 'Décharge électrostatique',
        'Silent Whistle': 'Kuchiyose',
        'Smoke Rings': 'Ronds de fumée',
        'Smoke Stack': 'Signaux de fumée',
        'Smoke and Mirrors': 'Fumée sans feu',
        'Smokeater': 'Dévoreur de brouillard',
        'Smoldering(?! Damnation)': 'Combustion consumante',
        'Smoldering Damnation': 'Damnation consumante',
        'Snuff': 'Pipe écrasante',
        'Soldiers of Death': 'Guerriers de la mort',
        'Spearman\'s Orders': 'Ordre d\'attaque',
        'Spike of Flame': 'Explosion de feu',
        'Spiritflame': 'Flamme spirituelle',
        'Spiritspark': 'Étincelle spirituelle',
        'Splitting Cry': 'Cri d\'horreur',
        'Stormcloud Summons': 'Nuage d\'orage',
        'String Snap': 'Corde cassée',
        'Sulphuric Stone': 'Soufre rocheux',
        'Tatami Trap': 'Piège de paille',
        'Tatami-gaeshi': 'Tatami-gaeshi',
        'Tengu-yobi': 'Tengu-yobi',
        'Thunder Onefold': 'Éclair simple',
        'Thunder Threefold': 'Éclair triple',
        'Thunder Twofold': 'Éclair double',
        'Thunder Vortex': 'Spirale de foudre',
        'Thundercall': 'Drain fulminant',
        'Torching Torment': 'Brasier de tourments',
        'Unenlightenment': 'Sommeil spirituel',
        'Unsheathing': 'Défouraillage',
        'Untempered Sword': 'Lame impulsive',
        'Uplift': 'Exhaussement',
        'Upwell': 'Torrent violent',
        'Vasoconstrictor': 'Vasoconstricteur',
        'Veil Sever': 'Voile déchiré',
        'Wily Wall': 'Mur retors',
        'Windblossom Whirl': 'Pétales tournoyants',
        'Witherwind': 'Vent fanant',
        'Worldly Pursuit': 'Matérialisme',
        'Yama-kagura': 'Yama-kagura',
        'Yoki(?!-uzu)': 'Yôki',
        'Yoki-uzu': 'Yôki-uzu',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Ancient Katana': '古刀',
        'Ashigaru Kyuhei': '足軽弓兵',
        'Autumn Rivers\' End': '落葉川河畔',
        'Ball of Levin': '雷球',
        'Devilish Thrall': '惑わされた屍鬼',
        'Enenra': '煙々羅',
        'Feral Thrall': '惑わされた猛虎',
        'Gorai the Uncaged': '鉄鼠ゴウライ',
        'Haunting Thrall': '惑わされた屍霊',
        'Ill-come Tengu': '六根天狗',
        'Last Glimpse': '眼根の木間',
        'Mirrored Yozakura': 'ヨザクラの分身',
        'Moko the Restless': '怨霊モウコ',
        'Oni\'s Claw': '鬼腕',
        'Rairin': '雷輪',
        'Shiromaru': '忍犬シロマル',
        'Shishio': '獅子王',
        'Shishu White Baboon': 'シシュウ・ヒヒ',
        'Stone\'s Silence': '怪鳴石の磐座',
        'The Hall Of Becoming': '宝蔵の間',
        'The Hall Of Temptation': '金堂',
        'The Pond Of Spring Rain': '浄桜湖',
        'Venomous Thrall': '惑わされた大蛇',
        'Yozakura the Fleeting': '花遁のヨザクラ',
      },
      'replaceText': {
        'Art of the Fireblossom': '火花の術',
        'Art of the Fluff': 'もふもふの術',
        'Art of the Windblossom': '風花の術',
        'Azure Auspice': '青帝剣気',
        'Biwa Breaker': '琵琶誅撃',
        'Boundless Azure': '青帝空閃刃',
        'Boundless Scarlet': '赤帝空閃刃',
        'Bunshin': '分身の術',
        '(?<!Levin)Burst': '爆発',
        'Clearing Smoke': '衝撃煙管打ち',
        'Clearout': 'なぎ払い',
        'Donden-gaeshi': 'どんでん返しの術',
        'Double Kasumi-giri': '霞二段',
        'Drifting Petals': '落花流水の術',
        'Enkyo': '猿叫',
        'Explosion': '爆発',
        'Falling Rock': '落石',
        'Fighting Spirits': '般若湯',
        'Fire Spread': '放火',
        'Fireblossom Flare': '火花上騰の術',
        'Flagrant Combustion': '赤熱爆煙',
        'Flame and Sulphur': '岩火招来',
        'Flickering Flame': '怪火招来',
        'Focused Tremor': '局所地震',
        'Ghastly Grasp': '妖気刃',
        'Glory Neverlasting': '槿花一朝',
        'Haunting Cry': '不気味な鳴声',
        'Humble Hammer': '打ち出の小槌',
        'Iai-kasumi-giri': '居合霞斬り',
        'Icebloom': '氷花満開の術',
        'Impure Purgation': '炎流',
        'Into the Fire': '血煙重波撃',
        'Iron Rain': '矢の雨',
        'Kenki Release': '剣気解放',
        'Kiseru Clamor': '血煙重打撃',
        'Kuge Rantsui': '空花乱墜',
        'Left Swipe': '左爪薙ぎ払い',
        'Levinblossom Lance': '雷花閃光の術',
        'Levinblossom Strike': '雷花鳴響の術',
        'Levinburst': '発雷',
        'Malformed Prayer': '呪珠印',
        'Moonless Night': '闇夜斬り',
        'Morphic Melody': '変剋の旋律',
        'Mud Pie': '泥団子',
        'Mudrain': '泥中蓮花の術',
        'Noble Pursuit': '獅子王牙',
        'Nubuki': '芽吹きの術',
        'Oka Ranman': '桜花爛漫',
        'Once on Rokujo': '六条放雷：壱式',
        'Out of the Smoke': '雲煙飛動',
        'Pipe Cleaner': '重波撃',
        'Plectrum of Power': '強勢の旋律',
        'Pure Shock': '放雷衝',
        'Reisho': '霊障',
        'Right Swipe': '右爪薙ぎ払い',
        'Root Arrangement': '枯樹生花の術',
        'Rousing Reincarnation': '変現の呪い',
        'Rush': '突進',
        'Scarlet Auspice': '赤帝剣気',
        'Seal of Riotous Bloom': '花押印・乱咲',
        'Seal of the Fleeting': '花押印の術',
        'Seasons of the Fleeting': '四君子の術',
        'Self-destruct': '自爆',
        'Shadowflight': '影討ち',
        '(?<! )Shock': '放電',
        'Silent Whistle': '口寄せの術',
        'Smoke Rings': '円撃煙管打ち',
        'Smoke Stack': '集煙法',
        'Smoke and Mirrors': '分煙法',
        'Smokeater': '霞喰い',
        'Smoldering(?! Damnation)': '噴煙燃焼',
        'Smoldering Damnation': '噴煙地獄',
        'Snuff': '重打撃',
        'Soldiers of Death': '屍兵呼び',
        'Spearman\'s Orders': '突撃命令',
        'Spike of Flame': '爆炎',
        'Spiritflame': '怪火',
        'Spiritspark': '怪火呼び',
        'Splitting Cry': '霊鳴砲',
        'Stormcloud Summons': '雷雲生成',
        'String Snap': '鳴弦震動波',
        'Sulphuric Stone': '霊岩招来',
        'Tatami Trap': '罠仕込み',
        'Tatami-gaeshi': '畳返しの術',
        'Tengu-yobi': '天狗呼び',
        'Thunder Onefold': '落雷：壱式',
        'Thunder Threefold': '落雷：参式',
        'Thunder Twofold': '落雷：弐式',
        'Thunder Vortex': '輪転渦雷',
        'Thundercall': '招雷',
        'Torching Torment': '煩熱',
        'Unenlightenment': '煩悩熾盛',
        'Unsheathing': '妖刀具現',
        'Untempered Sword': '有構無構',
        'Uplift': '隆起',
        'Upwell': '水流',
        'Vasoconstrictor': '毒液噴射',
        'Veil Sever': '血地裂き',
        'Wily Wall': '法力障壁',
        'Windblossom Whirl': '風花旋回の術',
        'Witherwind': '風花落葉の術',
        'Worldly Pursuit': '跳鼠痛撃',
        'Yama-kagura': '山神楽',
        'Yoki(?!-uzu)': '妖気',
        'Yoki-uzu': '妖気渦',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Ancient Katana': '古刀',
        'Ashigaru Kyuhei': '足轻弓兵',
        'Autumn Rivers\' End': '落叶川河畔',
        'Ball of Levin': '闪电球',
        'Devilish Thrall': '被迷惑的尸鬼',
        'Enenra': '烟烟罗',
        'Feral Thrall': '被迷惑的猛虎',
        'Gorai the Uncaged': '铁鼠豪雷',
        'Haunting Thrall': '被迷惑的尸灵',
        'Ill-come Tengu': '六根天狗',
        'Last Glimpse': '眼根树间地',
        'Mirrored Yozakura': '夜樱的分身',
        'Moko the Restless': '怨灵猛虎',
        'Oni\'s Claw': '鬼腕',
        'Rairin': '雷环',
        'Shiromaru': '忍犬白丸',
        'Shishio': '狮子王',
        'Shishu White Baboon': '紫州狒狒',
        'Stone\'s Silence': '怪鸣石磐座',
        'The Hall Of Becoming': '藏宝间',
        'The Hall Of Temptation': '金堂',
        'The Hall Of The Unseen': '眼根大堂',
        'The Pond Of Spring Rain': '净樱湖',
        'Venomous Thrall': '被迷惑的大蛇',
        'Yozakura the Fleeting': '花遁之夜樱',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        'Art of the Fireblossom': '火花之术',
        'Art of the Fluff': '茸茸之术',
        'Art of the Windblossom': '风花之术',
        'Azure Auspice': '青帝剑气',
        'Biwa Breaker': '琵琶诛击',
        'Boundless Azure': '青帝空闪刃',
        'Boundless Scarlet': '赤帝空闪刃',
        'Bunshin': '分身之术',
        '(?<!Levin)Burst': '爆炸',
        'Clearing Smoke': '烟管冲击',
        'Clearout': '横扫',
        'Donden-gaeshi': '翻转之术',
        'Double Kasumi-giri': '二段霞斩',
        'Drifting Petals': '落花流水之术',
        'Enkyo': '猿啼',
        'Explosion': '爆炸',
        'Falling Rock': '落石',
        'Fighting Spirits': '般若汤',
        'Fire Spread': '喷火',
        'Fireblossom Flare': '火花升腾之术',
        'Flagrant Combustion': '赤热爆烟',
        'Flame and Sulphur': '岩火招来',
        'Flickering Flame': '怪火招来',
        'Focused Tremor': '局部地震',
        'Ghastly Grasp': '妖气刃',
        'Glory Neverlasting': '槿花一日',
        'Haunting Cry': '诡异的叫声',
        'Humble Hammer': '万宝槌',
        'Iai-kasumi-giri': '居合霞斩',
        'Icebloom': '冰花满开之术',
        'Impure Purgation': '炎流',
        'Into the Fire': '血烟重波击',
        'Iron Rain': '钢铁箭雨',
        'Kenki Release': '剑气解放',
        'Kiseru Clamor': '血烟重打击',
        'Kuge Rantsui': '空花乱坠',
        'Left Swipe': '左爪横扫',
        'Levinblossom Lance': '雷花闪光之术',
        'Levinblossom Strike': '雷花鸣响之术',
        'Levinburst': '放雷',
        'Malformed Prayer': '咒珠印',
        'Moonless Night': '暗夜斩',
        'Morphic Melody': '变克的旋律',
        'Mud Pie': '泥球',
        'Mudrain': '泥中莲花之术',
        'Noble Pursuit': '狮子王牙',
        'Nubuki': '萌芽之术',
        'Oka Ranman': '樱花烂漫',
        'Once on Rokujo': '六条奔雷一式',
        'Out of the Smoke': '云烟飞动',
        'Pipe Cleaner': '重波击',
        'Plectrum of Power': '强势的旋律',
        'Pure Shock': '奔雷冲',
        'Reisho': '灵障',
        'Right Swipe': '右爪横扫',
        'Root Arrangement': '枯树生花之术',
        'Rousing Reincarnation': '变见的诅咒',
        'Rush': '突进',
        'Scarlet Auspice': '赤帝剑气',
        'Seal Marker': '花印标记',
        'Seal of Riotous Bloom': '花印齐放',
        'Seal of the Blossom': '花印开放',
        'Seal of the Fleeting': '花印之术',
        'Season Indicator': '四君子指示',
        'Season of Element': '四君子元素',
        'Seasons of the Fleeting': '四君子之术',
        'Self-destruct': '自爆',
        'Shadowflight': '影袭',
        '(?<! )Shock': '放电',
        'Silent Whistle': '通灵之术',
        'Smoke Rings': '烟管圆击',
        'Smoke Stack': '集烟法',
        'Smoke and Mirrors': '分烟法',
        'Smokeater': '噬霞',
        'Smoldering(?! Damnation)': '喷烟燃烧',
        'Smoldering Damnation': '喷烟地狱',
        'Snuff': '重打击',
        'Soldiers of Death': '召唤阴兵',
        'Spearman\'s Orders': '突击命令',
        'Spike of Flame': '爆炎柱',
        'Spiritflame': '怪火',
        'Spiritspark': '召唤怪火',
        'Splitting Cry': '灵鸣炮',
        'Stormcloud Summons': '生成雷暴云',
        'String Snap': '鸣弦震动波',
        'Sulphuric Stone': '灵岩招来',
        'Tatami Trap': '设置陷阱',
        'Tatami-gaeshi': '掀地板之术',
        'Tengu-yobi': '召唤天狗',
        'Thunder Onefold': '落雷一式',
        'Thunder Threefold': '落雷三式',
        'Thunder Twofold': '落雷二式',
        'Thunder Vortex': '回环涡雷',
        'Thundercall': '招雷',
        'Torching Torment': '烦热',
        'Unenlightenment': '烦恼炽盛',
        'Unsheathing': '妖刀具现',
        'Untempered Sword': '无势架势',
        'Uplift': '隆起',
        'Upwell': '水流',
        'Vasoconstrictor': '毒液喷射',
        'Veil Sever': '血地裂',
        'Wily Wall': '法力障壁',
        'Windblossom Whirl': '风花旋回之术',
        'Witherwind': '风花落叶之术',
        'Worldly Pursuit': '跳鼠痛击',
        'Yama-kagura': '山神乐',
        'Yoki(?!-uzu)': '妖气',
        'Yoki-uzu': '妖气涡',
      },
    },
    {
      'locale': 'tc',
      'missingTranslations': true,
      'replaceSync': {
        'Ancient Katana': '古刀',
        'Ashigaru Kyuhei': '足輕弓兵',
        'Autumn Rivers\' End': '落葉川河畔',
        'Ball of Levin': '閃電球',
        'Devilish Thrall': '被迷惑的屍鬼',
        'Enenra': '煙煙羅',
        'Feral Thrall': '被迷惑的猛虎',
        'Gorai the Uncaged': '鐵鼠豪雷',
        'Haunting Thrall': '被迷惑的屍靈',
        'Ill-come Tengu': '六根天狗',
        'Last Glimpse': '眼根樹間地',
        'Mirrored Yozakura': '夜櫻的分身',
        'Moko the Restless': '怨靈猛虎',
        'Oni\'s Claw': '鬼腕',
        'Rairin': '雷環',
        'Shiromaru': '忍犬白丸',
        'Shishio': '獅子王',
        'Shishu White Baboon': '紫州狒狒',
        'Stone\'s Silence': '怪鳴石磐座',
        'The Hall Of Becoming': '藏寶間',
        'The Hall Of Temptation': '金堂',
        'The Hall Of The Unseen': '眼根大堂',
        'The Pond Of Spring Rain': '淨櫻湖',
        'Venomous Thrall': '被迷惑的大蛇',
        'Yozakura the Fleeting': '花遁之夜櫻',
      },
      'replaceText': {
        // '\\(cast\\)': '', // FIXME '(咏唱)'
        'Art of the Fireblossom': '火花之術',
        'Art of the Fluff': '茸茸之術',
        'Art of the Windblossom': '風花之術',
        'Azure Auspice': '青帝劍氣',
        'Biwa Breaker': '琵琶誅擊',
        'Boundless Azure': '青帝空閃刃',
        'Boundless Scarlet': '赤帝空閃刃',
        'Bunshin': '分身術',
        '(?<!Levin)Burst': '爆炸',
        'Clearing Smoke': '煙管衝擊',
        'Clearout': '橫掃',
        'Donden-gaeshi': '翻轉之術',
        'Double Kasumi-giri': '二段霞斬',
        'Drifting Petals': '落花流水之術',
        'Enkyo': '猿啼',
        'Explosion': '爆炸',
        'Falling Rock': '落石',
        'Fighting Spirits': '般若湯',
        'Fire Spread': '噴火',
        'Fireblossom Flare': '火花升騰之術',
        'Flagrant Combustion': '赤熱爆煙',
        'Flame and Sulphur': '岩火招來',
        'Flickering Flame': '怪火招來',
        'Focused Tremor': '局部地震',
        'Ghastly Grasp': '妖氣刃',
        'Glory Neverlasting': '槿花一日',
        'Haunting Cry': '詭異的叫聲',
        'Humble Hammer': '萬寶槌',
        'Iai-kasumi-giri': '居合霞斬',
        'Icebloom': '冰花滿開之術',
        'Impure Purgation': '炎流',
        'Into the Fire': '血煙重波擊',
        'Iron Rain': '鋼鐵箭雨',
        'Kenki Release': '劍氣解放',
        'Kiseru Clamor': '血煙重打擊',
        'Kuge Rantsui': '空花亂墜',
        'Left Swipe': '左爪橫掃',
        'Levinblossom Lance': '雷花閃光之術',
        'Levinblossom Strike': '雷花鳴響之術',
        'Levinburst': '放雷',
        'Malformed Prayer': '咒珠印',
        'Moonless Night': '暗夜斬',
        'Morphic Melody': '變克的旋律',
        'Mud Pie': '泥球',
        'Mudrain': '泥中蓮花之術',
        'Noble Pursuit': '獅子王牙',
        'Nubuki': '萌芽之術',
        'Oka Ranman': '櫻花爛漫',
        'Once on Rokujo': '六條奔雷一式',
        'Out of the Smoke': '雲煙飛動',
        'Pipe Cleaner': '重波擊',
        'Plectrum of Power': '強勢的旋律',
        'Pure Shock': '奔雷衝',
        'Reisho': '靈障',
        'Right Swipe': '右爪橫掃',
        'Root Arrangement': '枯樹生花之術',
        'Rousing Reincarnation': '變見的詛咒',
        'Rush': '突進',
        'Scarlet Auspice': '赤帝劍氣',
        // 'Seal Marker': '', // FIXME '花印标记'
        'Seal of Riotous Bloom': '花印齊放',
        // 'Seal of the Blossom': '', // FIXME '花印开放'
        'Seal of the Fleeting': '花印之術',
        // 'Season Indicator': '', // FIXME '四君子指示'
        // 'Season of Element': '', // FIXME '四君子元素'
        'Seasons of the Fleeting': '四君子之術',
        'Self-destruct': '自爆',
        'Shadowflight': '影襲',
        '(?<! )Shock': '放電',
        'Silent Whistle': '通靈之術',
        'Smoke Rings': '煙管圓擊',
        'Smoke Stack': '集煙法',
        'Smoke and Mirrors': '分煙法',
        'Smokeater': '噬霞',
        'Smoldering(?! Damnation)': '噴煙燃燒',
        'Smoldering Damnation': '噴煙地獄',
        'Snuff': '重打擊',
        'Soldiers of Death': '召喚陰兵',
        'Spearman\'s Orders': '突擊命令',
        'Spike of Flame': '大火焰柱',
        'Spiritflame': '怪火',
        'Spiritspark': '召喚怪火',
        'Splitting Cry': '靈鳴砲',
        'Stormcloud Summons': '生成雷暴雲',
        'String Snap': '鳴弦震動波',
        'Sulphuric Stone': '靈岩招來',
        'Tatami Trap': '設置陷阱',
        'Tatami-gaeshi': '掀地板之術',
        'Tengu-yobi': '召喚天狗',
        'Thunder Onefold': '落雷一式',
        'Thunder Threefold': '落雷三式',
        'Thunder Twofold': '落雷二式',
        'Thunder Vortex': '回環渦雷',
        'Thundercall': '招雷',
        'Torching Torment': '煩熱',
        'Unenlightenment': '煩惱熾盛',
        'Unsheathing': '妖刀具現',
        'Untempered Sword': '無勢架勢',
        'Uplift': '隆起',
        'Upwell': '水流',
        'Vasoconstrictor': '毒液噴射',
        'Veil Sever': '血地裂',
        'Wily Wall': '法力障壁',
        'Windblossom Whirl': '風花旋回之術',
        'Witherwind': '風花落葉之術',
        'Worldly Pursuit': '跳鼠痛擊',
        'Yama-kagura': '山神樂',
        'Yoki(?!-uzu)': '妖氣',
        'Yoki-uzu': '妖氣渦',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Ancient Katana': '오래된 칼',
        'Ashigaru Kyuhei': '하급 궁병',
        'Autumn Rivers\' End': '낙엽강 기슭',
        'Ball of Levin': '번개 구체',
        'Devilish Thrall': '현혹된 시체귀신',
        'Enenra': '엔엔라',
        'Feral Thrall': '현혹된 호랑이',
        'Gorai the Uncaged': '무쇠쥐 고우라이',
        'Haunting Thrall': '현혹된 사령',
        'Ill-come Tengu': '육근산 텐구',
        'Last Glimpse': '안근의 나무 사이',
        'Mirrored Yozakura': '요자쿠라의 분신',
        'Moko the Restless': '원령 모우코',
        'Oni\'s Claw': '악귀의 팔',
        'Rairin': '번개고리',
        'Shiromaru': '닌자개 시로마루',
        'Shishio': '사자왕',
        'Shishu White Baboon': '시슈 개코원숭이',
        'Stone\'s Silence': '괴성의 너러반석',
        'The Hall Of Becoming': '보물의 방',
        'The Hall Of Temptation': '금당',
        'The Hall Of The Unseen': '안근의 사당',
        'The Pond Of Spring Rain': '맑은벚꽃 호수',
        'Venomous Thrall': '현혹된 구렁이',
        'Yozakura the Fleeting': '벛꽃의 요자쿠라',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        'Art of the Fireblossom': '벚꽃 화둔술',
        'Art of the Fluff': '복슬복슬 인술',
        'Art of the Windblossom': '벚꽃 풍둔술',
        'Azure Auspice': '청제 검기',
        'Biwa Breaker': '비파 징벌격',
        'Boundless Azure': '청제 공섬도',
        'Boundless Scarlet': '적제 공섬도',
        'Bunshin': '분신',
        '(?<!Levin)Burst': '폭발',
        'Clearing Smoke': '방사형 곰방대 충돌',
        'Clearout': '휩쓸기',
        'Donden-gaeshi': '창호 회전술',
        'Double Kasumi-giri': '이단 안개베기',
        'Drifting Petals': '낙화유수술',
        'Enkyo': '원숭이 포효',
        'Explosion': '폭발',
        'Falling Rock': '낙석',
        'Fighting Spirits': '반야탕',
        'Fire Spread': '방화',
        'Fireblossom Flare': '치솟는 불꽃',
        'Flagrant Combustion': '붉은 폭연',
        'Flame and Sulphur': '바위불 소환',
        'Flickering Flame': '귀신불 소환',
        'Focused Tremor': '국소 지진',
        'Ghastly Grasp': '요기 칼날',
        'Glory Neverlasting': '근화일조',
        'Haunting Cry': '섬뜩한 괴성',
        'Humble Hammer': '요술 망치',
        'Iai-kasumi-giri': '거합 안개베기',
        'Icebloom': '활짝 피는 얼음꽃',
        'Impure Purgation': '염류',
        'Into the Fire': '핏빛 곰방대 털기',
        'Iron Rain': '화살비',
        'Kenki Release': '검기 해방',
        'Kiseru Clamor': '핏빛 곰방대 찍기',
        'Kuge Rantsui': '공화란추',
        'Left Swipe': '좌측 할퀴기',
        'Levinblossom Lance': '번쩍이는 번개꽃',
        'Levinblossom Strike': '내리치는 번개꽃',
        'Levinburst': '번개 발산',
        'Malformed Prayer': '염주 각인',
        'Moonless Night': '암야 베기',
        'Morphic Melody': '변형의 선율',
        'Mud Pie': '질퍽파이',
        'Mudrain': '진흙 속 연꽃',
        'Noble Pursuit': '사자왕의 송곳니',
        'Nubuki': '움트는 새싹',
        'Oka Ranman': '벚꽃 만개',
        'Once on Rokujo': '육조방뢰 1',
        'Out of the Smoke': '운연비동',
        'Pipe Cleaner': '곰방대 털기',
        'Plectrum of Power': '강세의 선율',
        'Pure Shock': '방뢰격',
        'Reisho': '영력장',
        'Right Swipe': '우측 할퀴기',
        'Root Arrangement': '피어나는 고목',
        'Rousing Reincarnation': '변신 저주',
        'Rush': '돌진',
        'Scarlet Auspice': '적제 검기',
        'Seal Marker': '꽃도장 속성 부여',
        'Seal of Riotous Bloom': '꽃도장 만개',
        'Seal of the Blossom': '꽃도장',
        'Seal of the Fleeting': '꽃도장 인술',
        'Season Indicator': '사군자 예고',
        'Season of Element': '사군자',
        'Seasons of the Fleeting': '사군자 인술',
        'Self-destruct': '자폭',
        'Shadowflight': '그림자 공격',
        '(?<! )Shock': '방전',
        'Silent Whistle': '소환술',
        'Smoke Rings': '원형 곰방대 충돌',
        'Smoke Stack': '연기 합체',
        'Smoke and Mirrors': '연기 분열',
        'Smokeater': '안개 흡입',
        'Smoldering(?! Damnation)': '연기 연소',
        'Smoldering Damnation': '연기 지옥',
        'Snuff': '곰방대 찍기',
        'Soldiers of Death': '시체병 부르기',
        'Spearman\'s Orders': '돌격 명령',
        'Spike of Flame': '폭염',
        'Spiritflame': '귀신불',
        'Spiritspark': '귀신불 부르기',
        'Splitting Cry': '영명포',
        'Stormcloud Summons': '번개구름 생성',
        'String Snap': '명현진동파',
        'Sulphuric Stone': '바위 소환',
        'Tatami Trap': '함정 설치',
        'Tatami-gaeshi': '장판 뒤집기',
        'Tengu-yobi': '텐구 부르기',
        'Thunder Onefold': '낙뢰 1',
        'Thunder Threefold': '낙뢰 3',
        'Thunder Twofold': '낙뢰 2',
        'Thunder Vortex': '외측 와뢰',
        'Thundercall': '초뢰',
        'Torching Torment': '번열',
        'Unenlightenment': '번뇌치성',
        'Unsheathing': '요도 구현',
        'Untempered Sword': '무초식',
        'Uplift': '융기',
        'Upwell': '물길',
        'Vasoconstrictor': '독액 분사',
        'Veil Sever': '핏빛 절단',
        'Wily Wall': '법력 장벽',
        'Windblossom Whirl': '휘도는 바람꽃',
        'Witherwind': '낙엽 바람꽃',
        'Worldly Pursuit': '쥐 도약격',
        'Yama-kagura': '산타령',
        'Yoki(?!-uzu)': '요기',
        'Yoki-uzu': '요기 소용돌이',
      },
    },
  ],
};

export default triggerSet;
