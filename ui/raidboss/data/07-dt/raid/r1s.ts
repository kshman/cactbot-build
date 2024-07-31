import outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

const headmarkers = {
  elev: '0140',
  // 아마 산개: '009E',
  quadAoe: '001A',
};

// 첫마커는 탱크버스터(Biscuit Marker)
const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (data.decOffset === undefined)
    data.decOffset = parseInt(matches.id, 16);
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

export interface Data extends RaidbossData {
  decOffset?: number;
  elevDest?: string;
  elevType: 'upper' | 'push' | 'unknown';
  leapJump: 'left' | 'right' | 'unknown';
  seenLeapJump: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM1Savage',
  zoneId: ZoneId.AacLightHeavyweightM1Savage,
  timelineFile: 'r1s.txt',
  initData: () => ({
    elevType: 'unknown',
    leapJump: 'unknown',
    seenLeapJump: false,
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
    },
    // ================== PRS ==================
    {
      id: 'R1S Quadruple Crossing',
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
      id: 'R1S Quadruple Swipe',
      type: 'StartsUsing',
      netRegex: { id: '945D', source: 'Black Cat', capture: false },
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
      id: 'R1S Double Swipe',
      type: 'StartsUsing',
      netRegex: { id: '945F', source: 'Black Cat', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: outputs.healerGroups,
      },
    },
    {
      id: 'R1S Quadruple Swipe Soulshade',
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
      id: 'R1S Double Swipe Soulshade',
      type: 'StartsUsing',
      netRegex: { id: '9482', source: 'Soulshade', capture: false },
      suppressSeconds: 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: outputs.healerGroups,
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Upper',
      type: 'StartsUsing',
      netRegex: { id: '9446', source: 'Copy Cat', capture: false },
      condition: (data) => data.elevDest === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Upper',
          ko: '내게 어퍼컷 넉백!',
        },
      },
    },
    {
      id: 'R1S Elevate and Eviscerate Push',
      type: 'StartsUsing',
      netRegex: { id: '9448', source: 'Copy Cat', capture: false },
      condition: (data) => data.elevDest === data.me,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Push',
          ko: '내게 내려 찍기!',
        },
      },
    },
    {
      id: 'R1S Leaping Jump',
      type: 'Ability',
      netRegex: { id: ['9451', '9454'], source: 'Black Cat', capture: true },
      run: (data, matches) => {
        data.leapJump = matches.id === '9451' ? 'left' : 'right';
        data.seenLeapJump = true;
      },
    },
    /*
    {
      id: 'R1S Leaping Half Room',
      type: 'Ability',
      netRegex: { id: '87A2', source: 'Black Cat', capture: false },
      condition: (data) => data.seenLeapJump,
      alertText: (data, _matches, output) => {
        if (data.leapJump === 'left')
          return output.left!();
        if (data.leapJump === 'right')
          return output.right!();
        return output.unknown!();
      },
      run: (data) => data.seenLeapJump = false,
      outputStrings: {
        left: {
          en: 'Left',
          ko: '왼쪽으로!',
        },
        right: {
          en: 'Right',
          ko: '오른쪽으로!',
        },
        unknown: outputs.unknown,
      },
    },
    {
      id: 'R1S Leaping Prox Bait',
      type: 'Ability',
      netRegex: { id: '9463', source: 'Black Cat', capture: false },
      condition: (data) => data.seenLeapJump,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.seenLeapJump = false,
      outputStrings: {
        text: {
          en: 'Right',
          ko: '오른쪽으로!',
        },
      },
    },
    */
    {
      id: 'R1S headmarker elev',
      type: 'HeadMarker',
      netRegex: {},
      run: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id === headmarkers.elev)
          data.elevDest = matches.target;
      },
    },
    {
      id: 'R1S headmarker quad aoe',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        return id === headmarkers.quadAoe && data.me === matches.target;
      },
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
      id: 'R1S headmarker test',
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
        'Black Cat': 'ブラックキャット',
        'Copy Cat': 'コピーキャット',
      },
    },
  ],
};

export default triggerSet;
