import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  lastPawprintTarget?: string;
  actorSetPosTracker: { [id: string]: NetMatches['ActorSetPos'] };
  mouserMatchedTile?: (typeof mapEffectData)[keyof typeof mapEffectData]['location'];
  //
  seenLeapJump: boolean;
  leapTetherCount: number;
  lastLeapDir?: 'left' | 'right';
  leapInfo: {
    id: string;
    dir: 'left' | 'right';
  }[];
}

const headmarkers = {
  tankswap: '00DA',
  quadaoe: '00F4',
  spread: '0178',
  pawprint: '021A',
};

// MapEffect tile map:
// 00 01 02 03
// 04 05 06 07
// 08 09 0A 0B
// 0C 0D 0E 0F

const mapEffectTileState = {
  'cracked': '00020001',
  'clear': '00040004',
  'broken': '00200010',
  'refreshing': '00800004', // refreshing from cracked
  'rebuilding': '01000004', // rebuilding from broken
} as const;

const mapEffectData = {
  '00': {
    'location': '00',
    'centerX': 85,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '01': {
    'location': '01',
    'centerX': 95,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '02': {
    'location': '02',
    'centerX': 105,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '03': {
    'location': '03',
    'centerX': 115,
    'centerY': 85,
    ...mapEffectTileState,
  },
  '04': {
    'location': '04',
    'centerX': 85,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '05': {
    'location': '05',
    'centerX': 95,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '06': {
    'location': '06',
    'centerX': 105,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '07': {
    'location': '07',
    'centerX': 115,
    'centerY': 95,
    ...mapEffectTileState,
  },
  '08': {
    'location': '08',
    'centerX': 85,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '09': {
    'location': '09',
    'centerX': 95,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0A': {
    'location': '0A',
    'centerX': 105,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0B': {
    'location': '0B',
    'centerX': 115,
    'centerY': 105,
    ...mapEffectTileState,
  },
  '0C': {
    'location': '0C',
    'centerX': 85,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '0D': {
    'location': '0D',
    'centerX': 95,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '0E': {
    'location': '0E',
    'centerX': 105,
    'centerY': 115,
    ...mapEffectTileState,
  },
  '0F': {
    'location': '0F',
    'centerX': 115,
    'centerY': 115,
    ...mapEffectTileState,
  },
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM1Savage',
  zoneId: ZoneId.AacLightHeavyweightM1Savage,
  timelineFile: 'r1s.txt',
  initData: () => ({
    actorSetPosTracker: {},
    //
    seenLeapJump: false,
    leapTetherCount: 0,
    leapInfo: [],
  }),
  triggers: [
    {
      id: 'R1S One-two Paw Right Left',
      type: 'StartsUsing',
      netRegex: { id: '9436', source: 'Black Cat', capture: false },
      durationSeconds: 9.5,
      response: Responses.goLeftThenRight(),
    },
    {
      id: 'R1S One-two Paw Left Right',
      type: 'StartsUsing',
      netRegex: { id: '9439', source: 'Black Cat', capture: false },
      durationSeconds: 9.5,
      response: Responses.goRightThenLeft(),
    },
    {
      id: 'R1S Biscuit Maker',
      type: 'StartsUsing',
      netRegex: { id: '9495', source: 'Black Cat', capture: true },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'R1S Bloody Scratch',
      type: 'StartsUsing',
      netRegex: { id: '9494', source: 'Black Cat', capture: false },
      response: Responses.aoe(),
      run: (data) => data.seenLeapJump = false,
    },
    // ================== 테스트 ==================
    {
      id: 'R1S ActorSetPos Collector',
      type: 'ActorSetPos',
      netRegex: { id: '4[0-9A-F]{7}', capture: true },
      run: (data, matches) => {
        data.actorSetPosTracker[matches.id] = matches;
      },
    },
    {
      id: 'R1S Mouser',
      type: 'StartsUsing',
      netRegex: { id: '996C', capture: true },
      condition: (data, matches) => {
        const actorSetPosLine = data.actorSetPosTracker[matches.sourceId];
        if (actorSetPosLine === undefined)
          return false;
        const x = parseFloat(actorSetPosLine.x);
        const y = parseFloat(actorSetPosLine.y);

        const loc = Object.values(mapEffectData)
          .find((tile) => Math.abs(tile.centerX - x) < 1 && Math.abs(tile.centerY - y) < 1);
        if (loc === undefined)
          return false;

        const tile = loc.location;

        if (tile !== '09' && tile !== '0A')
          return false;

        data.mouserMatchedTile = tile;
        return true;
      },
      // We don't need a suppressSeconds since only one of the SW/SE tiles will get hit twice
      durationSeconds: 11,
      infoText: (data, _matches, output) => {
        const dangerTile = data.mouserMatchedTile;
        if (dangerTile === undefined)
          return false;

        // Danger tile is SW, so safe movement is SW => SE (Stay)
        if (dangerTile === '09') {
          return output.swSeStay!({
            dir1: output['dirSW']!(),
            sep: output.separator!(),
            dir2: output['dirSE']!(),
          });
        }

        const dirs = ['dirSW', 'dirSE', 'dirSW'].map((e) => output[e]!());

        return output.combo!({ dirs: dirs.join(output.separator!()) });
      },
      run: (data) => delete data.mouserMatchedTile,
      outputStrings: {
        ...Directions.outputStrings8Dir,
        swSeStay: {
          en: '${dir1} ${sep} ${dir2} (Stay)',
          ko: '${dir1} ${sep} ${dir2} (그대로)',
        },
        separator: {
          en: ' => ',
          ko: ' 🔜 ',
        },
        combo: {
          en: '${dirs}',
          ko: '${dirs}',
        },
      },
    },
    {
      id: 'R1S Headmarker Spread Markers',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.spread, capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'R1S Headmarker Pawprint Collector',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.pawprint, capture: true },
      run: (data, matches) => data.lastPawprintTarget = matches.target,
    },
    {
      id: 'R1S Elevate and Eviscerate Launch Self',
      type: 'StartsUsing',
      netRegex: { id: '9446', source: 'Copy Cat', capture: false },
      condition: (data) => data.me === data.lastPawprintTarget,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Launch Forward (Aim for uncracked tile)',
          ko: '내게 어퍼컷 넉백!',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Launch Other',
      type: 'StartsUsing',
      netRegex: { id: '9446', source: 'Copy Cat', capture: false },
      condition: (data) => data.me !== data.lastPawprintTarget,
      infoText: (data, _matches, output) => output.text!({ target: data.lastPawprintTarget }),
      outputStrings: {
        text: {
          en: '${target} Launch',
          ko: '어퍼컷: ${target}',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Stun Self',
      type: 'StartsUsing',
      netRegex: { id: '9448', source: 'Copy Cat', capture: false },
      condition: (data) => data.me === data.lastPawprintTarget,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stand on uncracked tile',
          ko: '내게 내려 찍기!',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Stun Other',
      type: 'StartsUsing',
      netRegex: { id: '9448', source: 'Copy Cat', capture: false },
      condition: (data) => data.me !== data.lastPawprintTarget,
      infoText: (data, _matches, output) => output.text!({ target: data.lastPawprintTarget }),
      outputStrings: {
        text: {
          en: '${target} Stun',
          ko: '내려 찍기: ${target}',
        },
      },
    },
    {
      id: 'R1S Quadruple Swipe',
      type: 'StartsUsing',
      netRegex: { id: '945D', source: 'Black Cat', capture: false },
      alertText: (_data, _matches, output) => output.partner!(),
      outputStrings: {
        partner: {
          en: 'Partner Stacks',
          ko: '십자로 둘씩!',
        },
      },
    },
    {
      id: 'R1S Double Swipe',
      type: 'StartsUsing',
      netRegex: { id: '945F', source: 'Black Cat', capture: false },
      alertText: (_data, _matches, output) => output.healerStacks!(),
      outputStrings: {
        healerStacks: Outputs.healerGroups,
      },
    },
    {
      id: 'R1S Overshadow',
      type: 'StartsUsing',
      netRegex: { id: '9497', source: 'Black Cat', capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R1S Splintering Nails',
      type: 'StartsUsing',
      netRegex: { id: '9499', source: 'Black Cat', capture: false },
      infoText: (_data, _matches, output) => output.rolePositions!(),
      outputStrings: {
        rolePositions: {
          en: 'Role positions',
          ko: '같은 롤끼리 뭉쳐요',
        },
      },
    },
    // ================== PRS ==================
    {
      id: 'R1S PRS Quadruple Crossing',
      type: 'StartsUsing',
      // '9457', '982F'은 Leaping Quadruple Crossing
      netRegex: { id: ['943C', '9457', '982F'], source: 'Black Cat', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread',
          ko: '자기 자리로! 부채꼴 유도',
        },
      },
    },
    {
      id: 'R1S PRS Quadruple Swipe Soulshade',
      type: 'StartsUsing',
      netRegex: { id: '9480', source: 'Soulshade', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Pair',
          ko: '십자로 둘씩!',
        },
      },
    },
    {
      id: 'R1S PRS Double Swipe Soulshade',
      type: 'StartsUsing',
      netRegex: { id: '9482', source: 'Soulshade', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: Outputs.healerGroups,
      },
    },
    {
      id: 'R1S PRS Grimalkin Gale',
      type: 'StartsUsing',
      netRegex: { id: '9B84', source: 'Black Cat', capture: false },
      suppressSeconds: 5,
      run: (data) => {
        data.seenLeapJump = true;
        data.leapTetherCount = 0;
        data.leapInfo = [];
      },
    },
    {
      id: 'R1S PRS Leftward Memory',
      type: 'GainsEffect',
      netRegex: { effectId: 'FD3', target: 'Black Cat', capture: false },
      condition: (data) => data.seenLeapJump,
      run: (data) => data.lastLeapDir = 'left',
    },
    {
      id: 'R1S PRS Rightward Memory',
      type: 'GainsEffect',
      netRegex: { effectId: 'FD2', target: 'Black Cat', capture: false },
      condition: (data) => data.seenLeapJump,
      run: (data) => data.lastLeapDir = 'right',
    },
    {
      id: 'R1S PRS Tether for wards',
      type: 'Tether',
      netRegex: { id: '0066', source: 'Soulshade', capture: true },
      condition: (data) => data.seenLeapJump,
      durationSeconds: 8,
      infoText: (data, matches, output) => {
        data.leapTetherCount++;
        if (data.leapTetherCount <= 2 && data.lastLeapDir !== undefined) {
          data.leapInfo.push({ id: matches.sourceId, dir: data.lastLeapDir });
          // found: '찾음: ${id}, ${dir}',
          // return output.found!({ id: matches.sourceId, dir: data.lastLeapDir });
          return;
        }
        const leap = data.leapInfo.find((e) => e.id === matches.sourceId);
        if (leap === undefined)
          return output.unknown!();
        const other = data.leapInfo.find((e) => e.id !== matches.sourceId);
        if (other !== undefined) {
          data.leapInfo = data.leapInfo.filter((e) => e.id !== matches.sourceId);
          const dir1 = leap.dir === 'left' ? output.left!() : output.right!();
          const dir2 = other.dir === 'left' ? output.left!() : output.right!();
          return output.baitBait!({ dir1: dir1, dir2: dir2 });
        }
        const dir = leap.dir === 'left' ? output.left!() : output.right!();
        return output.bait!({ dir: dir });
      },
      outputStrings: {
        bait: {
          en: 'Bait: ${dir}',
          ko: '유도: ${dir}으로',
        },
        baitBait: {
          en: 'Bait: ${dir1} => ${dir2}',
          ko: '유도: ${dir1} 🔜 ${dir2}',
        },
        left: Outputs.left,
        right: Outputs.right,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R1S PRS headmarker quad aoe',
      type: 'HeadMarker',
      netRegex: { id: headmarkers.quadaoe, capture: true },
      condition: (data, matches) => data.me === matches.target,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spead',
          ko: '내게 장판! 밖으로!',
        },
      },
    },
    /*
    {
      id: 'R1S PRS headmarker test',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, matches, output) => {
        const id = getHeadmarkerId(data, matches);
        const dest = matches.target;
        return output.text!({ marker: id, dest: dest });
      },
      outputStrings: {
        text: {
          en: '[marker: ${marker} -> ${dest}]',
        },
      },
    },
    */
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        // 'Black Cat': 'ブラックキャット',
        'Copy Cat': 'コピーキャット',
        'Soulshade': 'ソウルシェード',
      },
    },
  ],
};

export default triggerSet;
