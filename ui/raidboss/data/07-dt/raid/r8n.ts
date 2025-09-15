import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { callOverlayHandler } from '../../../../../resources/overlay_plugin_api';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  reignDir?: number;
  moonbeamBites: number[];
  moonbeamBitesTracker: number;
  moonlightQuadrant2?: string;
}

const centerX = 100;
const centerY = 100;

const headMarkerData = {
  // Shared tankbuster marker used for Great Divide
  'tankbuster': '0256',
  // Stack marker used for first two Heavensearths
  'stack': '003E',
  // Stack marker used for Heavensearth in Tactical Pack
  'stackAdds': '005D',
  // Spread marker used for Gust in Tactical Pack
  'spread': '0178',
  // Big, pulsing, 4-arrow stack marker for Tracking Tremors
  'eightHitStack': '013C',
} as const;

const moonlightOutputStrings = {
  ...Directions.outputStrings8Dir,
  safeQuad: {
    en: '${quad}',
    de: '${quad}',
    ja: '${quad}',
    cn: '${quad}',
    ko: '${quad}',
  },
  safeQuadrants: {
    en: '${quad1} => ${quad2}',
    de: '${quad1} => ${quad2}',
    ja: '${quad1} => ${quad2}',
    cn: '${quad1} => ${quad2}',
    ko: '${quad1} => ${quad2}',
  },
};

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM4',
  zoneId: ZoneId.AacCruiserweightM4,
  timelineFile: 'r8n.txt',
  initData: () => ({
    moonbeamBites: [],
    moonbeamBitesTracker: 0,
  }),
  triggers: [
    {
      id: 'R8N Extraplanar Pursuit',
      type: 'StartsUsing',
      netRegex: { id: 'A38E', source: 'Howling Blade', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R8N Great Divide',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.tankbuster], capture: true },
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R8N Wolves\' Reign',
      type: 'StartsUsing',
      // A96D and A96E are used in first part of fight
      // A90F or A910 is used after adds
      // Normal mode is always in
      netRegex: { id: ['A96D', 'A96E', 'A90F', 'A910'], source: 'Howling Blade', capture: false },
      infoText: (_data, _matches, output) => {
        return output.inLater!();
      },
      outputStrings: {
        inLater: {
          en: '(In Later)',
          de: '(spater Rein)',
          ja: '(���Ȫ�?��)',
          cn: '(����??)',
          ko: '(���߿� ��)',
        },
      },
    },
    {
      id: 'R8N Wolves\' Reign Direction',
      type: 'StartsUsing',
      netRegex: { id: ['A96D', 'A96E', 'A90F', 'A910'], source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) + 1.2,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined) {
          console.error(
            `R8N Wolves' Reign Direction: Wrong actor count ${actors.length}`,
          );
          return;
        }

        data.reignDir = (Directions.hdgTo16DirNum(actor.Heading) + 8) % 16;
      },
      infoText: (data, _matches, output) => {
        const dir = output[Directions.output16Dir[data.reignDir ?? -1] ?? 'unknown']!();
        return output.inDir!({ dir: dir });
      },
      run: (data) => {
        data.reignDir = undefined;
      },
      outputStrings: {
        ...Directions.outputStrings16Dir,
        inDir: {
          en: 'In ${dir}',
          de: 'Rein ${dir}',
          ja: '?�� ${dir}',
          cn: '?? ${dir}',
          ko: '${dir} ��',
        },
      },
    },
    {
      id: 'R8N Heavensearth',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.stack, headMarkerData.stackAdds], capture: true },
      response: Responses.stackMarkerOn(),
    },
    {
      id: 'R8N Beckon Moonlight Quadrants',
      type: 'Ability',
      // First set is constant, later sets use different spell ids
      // A97E/A3DE => Right cleave self-cast
      // A97F/A3DF => Left cleave self-cast
      netRegex: { id: ['A97E', 'A3DE', 'A97F', 'A3DF'], source: 'Moonlit Shadow', capture: true },
      delaySeconds: 0.1,
      durationSeconds: 10,
      promise: async (data, matches) => {
        const actors = (await callOverlayHandler({
          call: 'getCombatants',
          ids: [parseInt(matches.sourceId, 16)],
        })).combatants;
        const actor = actors[0];
        if (actors.length !== 1 || actor === undefined) {
          console.error(
            `R8N Beckon Moonlight Quadrants: Wrong actor count ${actors.length}`,
          );
          return;
        }

        const dirNum = Directions.xyTo8DirNum(actor.PosX, actor.PosY, centerX, centerY);
        // Moonbeam's Bite (A97C/A376 Left / A97D/A377 Right) half-room cleaves
        // Defining the cleaved side
        if (matches.id === 'A97E' || matches.id === 'A3DE') {
          const counterclock = dirNum === 0 ? 6 : dirNum - 2;
          data.moonbeamBites.push(counterclock);
        }
        if (matches.id === 'A97F' || matches.id === 'A3DF') {
          const clockwise = (dirNum + 2) % 8;
          data.moonbeamBites.push(clockwise);
        }
      },
      infoText: (data, _matches, output) => {
        if (data.moonbeamBites.length === 1 || data.moonbeamBites.length === 3)
          return;

        const quadrants = [1, 3, 5, 7];
        const moonbeam1 = data.moonbeamBites[0] ?? -1;
        const moonbeam2 = data.moonbeamBites[1] ?? -1;
        let safeQuads1 = quadrants.filter((quadrant) => {
          return quadrant !== moonbeam1 + 1;
        });
        safeQuads1 = safeQuads1.filter((quadrant) => {
          return quadrant !== (moonbeam1 === 0 ? 7 : moonbeam1 - 1);
        });
        safeQuads1 = safeQuads1.filter((quadrant) => {
          return quadrant !== moonbeam2 + 1;
        });
        safeQuads1 = safeQuads1.filter((quadrant) => {
          return quadrant !== (moonbeam2 === 0 ? 7 : moonbeam2 - 1);
        });

        // Early output for first two
        if (data.moonbeamBites.length === 2) {
          if (safeQuads1.length !== 1 || safeQuads1[0] === undefined) {
            console.error(
              `R8N Beckon Moonlight Quadrants: Invalid safeQuads1, length of ${safeQuads1.length}.`,
            );
            return;
          }
          const quad = output[Directions.outputFrom8DirNum(safeQuads1[0] ?? -1)]!();
          return output.safeQuad!({ quad: quad });
        }

        const moonbeam3 = data.moonbeamBites[2] ?? -1;
        const moonbeam4 = data.moonbeamBites[3] ?? -1;
        let safeQuads2 = quadrants.filter((quadrant) => {
          return quadrant !== moonbeam3 + 1;
        });
        safeQuads2 = safeQuads2.filter((quadrant) => {
          return quadrant !== (moonbeam3 === 0 ? 7 : moonbeam3 - 1);
        });
        safeQuads2 = safeQuads2.filter((quadrant) => {
          return quadrant !== moonbeam4 + 1;
        });
        safeQuads2 = safeQuads2.filter((quadrant) => {
          return quadrant !== (moonbeam4 === 0 ? 7 : moonbeam4 - 1);
        });

        if (safeQuads1[0] === undefined || safeQuads2[0] === undefined) {
          console.error(
            `R8N Beckon Moonlight Quadrants: First safeQuads missing`,
          );
          return;
        }
        if (safeQuads1.length !== 1) {
          console.error(
            `R8N Beckon Moonlight Quadrants: Invalid safeQuads1, length of ${safeQuads1.length}`,
          );
          return;
        }
        if (safeQuads2.length !== 1) {
          console.error(
            `R8N Beckon Moonlight Quadrants: Invalid safeQuads2, length of ${safeQuads2.length}`,
          );
          return;
        }

        // Store quadrant for move call
        data.moonlightQuadrant2 = output[Directions.outputFrom8DirNum(safeQuads2[0] ?? -1)]!();

        const quad1 = output[Directions.outputFrom8DirNum(safeQuads1[0] ?? -1)]!();
        return output.safeQuadrants!({ quad1: quad1, quad2: data.moonlightQuadrant2 });
      },
      outputStrings: moonlightOutputStrings,
    },
    {
      id: 'R8N Beckon Moonlight Quadrant Two',
      type: 'StartsUsing',
      // A97C/A376 => Moonbeam's Bite dash with Left cleave
      // A97D/A377 => Moonbeam's Bite dash with Right cleave
      netRegex: { id: ['A97C', 'A376', 'A97D', 'A377'], source: 'Moonlit Shadow', capture: true },
      condition: (data) => {
        data.moonbeamBitesTracker = data.moonbeamBitesTracker + 1;
        if (data.moonbeamBitesTracker === 2)
          return true;
        return false;
      },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      infoText: (data, _matches, output) => {
        return output.safeQuad!({ quad: data.moonlightQuadrant2 });
      },
      run: (data) => {
        // Reset for additional Beckon Moonlights
        if (data.moonbeamBitesTracker === 4) {
          data.moonbeamBites = [];
          delete data.moonlightQuadrant2;
          data.moonbeamBitesTracker = 0;
        }
      },
      outputStrings: moonlightOutputStrings,
    },
    {
      id: 'R8N Shadowchase',
      // A981 cast before adds
      // A374 cast after adds
      type: 'StartsUsing',
      netRegex: { id: ['A981', 'A374'], source: 'Howling Blade', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => {
        return output.behindClones!();
      },
      outputStrings: {
        behindClones: {
          en: 'Behind Clones',
          cn: '��������',
        },
      },
    },
    {
      id: 'R8N Gust',
      type: 'HeadMarker',
      netRegex: { id: [headMarkerData.spread], capture: true },
      condition: Conditions.targetIsYou(),
      response: Responses.spread(),
    },
    {
      id: 'R8N Ravenous Saber',
      type: 'StartsUsing',
      netRegex: { id: 'A743', source: 'Howling Blade', capture: false },
      durationSeconds: 7,
      response: Responses.bigAoe(),
    },
    {
      id: 'R8N Weal of Stone',
      // TODO: Add direction such as Avoid lines from ${dir}
      // There are two casts: A989 and A988
      type: 'StartsUsing',
      netRegex: { id: 'A989', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => {
        return output.lines!();
      },
      outputStrings: {
        lines: {
          en: 'Avoid Lines',
          de: 'Vermeide Linien',
          ja: '������?��������',
          cn: '?����? AoE',
          ko: '�������� ���ϱ�',
        },
      },
    },
    {
      id: 'R8N Shadowchase Rotate',
      // Call to move behind Dragon Head after clones dash
      // These only spawn after adds
      // Dragon Heads cast Roaring Wind (A984 and A985)
      type: 'StartsUsing',
      netRegex: { id: 'A374', source: 'Howling Blade', capture: true },
      delaySeconds: (_data, matches) => parseFloat(matches.castTime),
      suppressSeconds: 1,
      infoText: (_data, _matches, output) => {
        return output.rotate!();
      },
      outputStrings: {
        rotate: {
          en: 'Rotate',
          de: 'Rotieren',
          ja: '��?',
          cn: '��?',
          ko: 'ȸ��',
        },
      },
    },
    {
      id: 'R8N Tracking Tremors',
      type: 'StartsUsing',
      netRegex: { id: 'A4E2', source: 'Howling Blade', capture: false },
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack x5',
          de: 'Sammeln x5',
          fr: 'Package x5',
          ja: '���ܪ� x5',
          cn: '5���?',
          ko: '���� 5��',
        },
      },
    },
    {
      id: 'R8N Weal of Stone Cardinals',
      // There are two casts and cardinals is always safe:
      // A98C Weal of Stone
      // A98D Weal of Stone
      type: 'StartsUsing',
      netRegex: { id: 'A98D', source: 'Wolf of Stone', capture: false },
      suppressSeconds: 1,
      alertText: (_data, _matches, output) => {
        return output.cardinals!();
      },
      outputStrings: {
        cardinals: Outputs.cardinals,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'cn',
      'replaceSync': {
        'Gleaming Fang': '���',
        'Howling Blade': '??',
        'Moonlit Shadow': '??�����',
        'Wolf of Stone': '������',
        'Wolf of Wind': '?����',
      },
      'replaceText': {
        '\\(castbar\\)': '(?��?)',
        '\\(circles\\)': '(?��)',
        '\\(cone\\)': '(���)',
        '\\(line\\)': '(��?)',
        'Bare Fangs': '����?',
        'Beckon Moonlight': '�����?',
        'Extraplanar Pursuit': '��??',
        'Fanged Charge': '��?���',
        'Great Divide': '����??',
        'Growling Wind': '?��?',
        'Gust': '��?',
        'Heavensearth': '����?',
        'Moonbeam\'s Bite': '����?',
        'Ravenous Saber': '??����?',
        'Roaring Wind': '?������',
        'Shadowchase': '?�?',
        'Tactical Pack': '�����?',
        'Targeted Quake': '��ݻ���',
        'Terrestrial Rage': '�������',
        'Terrestrial Titans': '�������?',
        'Titanic Pursuit': '?��?',
        'Towerfall': '��?',
        'Tracking Tremors': '?��?',
        'Weal of Stone': '�֭��',
        'Wolves\' Reign': '����?',
      },
    },
  ],
};

export default triggerSet;
