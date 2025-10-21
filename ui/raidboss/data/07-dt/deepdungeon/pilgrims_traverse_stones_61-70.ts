import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import { Directions } from '../../../../../resources/util';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type DirectionOutputCardinalRelative =
  | 'front'
  | 'right'
  | 'back'
  | 'left'
  | 'unknown';

const outputCardinalRelativeDir: DirectionOutputCardinalRelative[] = [
  'front',
  'right',
  'back',
  'left',
];

const outputRelativeFrom4DirNum = (dirNum: number): DirectionOutputCardinalRelative => {
  return outputCardinalRelativeDir[dirNum] ?? 'unknown';
};

export interface Data extends RaidbossData {
  octupleSwipes?: number[];
  calledOctupleSwipes?: boolean;
}

const triggerSet: TriggerSet<Data> = {
  id: 'PilgrimsTraverseStones61_70',
  zoneId: ZoneId.PilgrimsTraverseStones61_70,
  triggers: [
    // ---------------- Stone 70 Boss: Forgiven Zeal ----------------
    // A993 = Zealous Glower dummy self-cast, back-to-front line
    // A98E = Zealous Glower dummy self-cast, front-to-back line
    // A99A = Ardorous Eye dummy self-cast, clockwise ring
    // A99F = Ardorous Eye dummy self-cast, counterclockwise ring
    // A9A5 = 2000-mina Swing damage cast
    // A9A7 = Disorienting Groan damage cast
    // --- Octuple Swipe ---
    // A9A8 = dummy self-cast for castbar
    // A9A9 = instant, final damage cast
    // A9AA = instant, damage cast
    // A9AB = instant, damage cast
    // A9AC = instant, damage cast
    // A9AD = dummy cast showing telegraph
    {
      id: 'PT 61-70 Forgiven Zeal Zealous Glower',
      type: 'StartsUsing',
      netRegex: { id: ['A993', 'A98E'], source: 'Forgiven Zeal', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'PT 61-70 Forgiven Zeal Zealous Glower Dodge Direction',
      type: 'Ability',
      netRegex: { id: ['A993', 'A98E'], source: 'Forgiven Zeal', capture: true },
      durationSeconds: 15,
      infoText: (_data, matches, output) => {
        const dir = matches.id === 'A993' ? output.backFront!() : output.frontBack!();
        return output.text!({ dir: dir });
      },
      outputStrings: {
        text: {
          en: 'Dodge ${dir}',
          ko: '${dir} 피해요!',
        },
        backFront: {
          en: 'Back-to-front',
          ko: '앞에서 뒤로',
        },
        frontBack: {
          en: 'Front-to-back',
          ko: '뒤에서 앞으로',
        },
      },
    },
    {
      id: 'PT 61-70 Forgiven Zeal Ardorous Eye',
      type: 'StartsUsing',
      netRegex: { id: ['A99A', 'A99F'], source: 'Forgiven Zeal', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'PT 61-70 Forgiven Zeal Ardorous Eye Dodge Direction',
      type: 'Ability',
      netRegex: { id: ['A99A', 'A99F'], source: 'Forgiven Zeal', capture: true },
      durationSeconds: 20,
      infoText: (_data, matches, output) => {
        const dir = matches.id === 'A99A' ? output.clockwise!() : output.counterclockwise!();
        return output.text!({ dir: dir });
      },
      outputStrings: {
        text: {
          en: 'Dodge ${dir}',
          ko: '${dir}으로 피해요!',
        },
        clockwise: Outputs.clockwise,
        counterclockwise: Outputs.counterclockwise,
      },
    },
    {
      id: 'PT 61-70 Forgiven Zeal Disorienting Groan',
      type: 'StartsUsing',
      netRegex: { id: 'A9A7', source: 'Forgiven Zeal', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'PT 61-70 Forgiven Zeal 2000-mina Swing',
      type: 'StartsUsing',
      netRegex: { id: 'A9A5', source: 'Forgiven Zeal', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'PT 61-70 Forgiven Zeal Octuple Swipe Cleanup',
      type: 'Ability',
      netRegex: { id: 'A9A9', source: 'Forgiven Zeal', capture: false },
      run: (data) => {
        delete data.octupleSwipes;
        delete data.calledOctupleSwipes;
      },
    },
    {
      id: 'PT 61-70 Forgiven Zeal Octuple Swipe',
      type: 'StartsUsingExtra',
      netRegex: { id: 'A9AD', capture: true },
      condition: (data) => !data.calledOctupleSwipes,
      durationSeconds: 18,
      alertText: (data, matches, output) => {
        const heading = Directions.hdgTo4DirNum(parseFloat(matches.heading));
        data.octupleSwipes ??= [];
        data.octupleSwipes.push(heading);

        if (data.octupleSwipes.length < 8)
          return;

        data.calledOctupleSwipes = true;
        const [swipe1, swipe4, swipe5, swipe8] = [
          data.octupleSwipes[0],
          data.octupleSwipes[3],
          data.octupleSwipes[4],
          data.octupleSwipes[7],
        ];

        if (
          swipe1 === undefined ||
          swipe4 === undefined ||
          swipe5 === undefined ||
          swipe8 === undefined
        )
          return output.avoid!();

        const dir1 = outputRelativeFrom4DirNum(swipe1);
        const dir4 = outputRelativeFrom4DirNum(swipe4);
        const dir5 = outputRelativeFrom4DirNum(swipe5);
        const dir8 = outputRelativeFrom4DirNum(swipe8);

        if (swipe1 === swipe8)
          // swipe order is 1 > 2 > 3 > 4 > 5 > 6 > 7 > 1
          // dodge order is 4 > 1 > 1 > 1 > 1 > 1 > 1 > 4
          return output.rewind!({ dir4: output[dir4]!(), dir1: output[dir1]!() });

        // swipe order is 1 > 2 > 3 > 4 > 5 > 6 > 7 > 8
        // dodge order is 4 > 1 > 1 > 1 > 8 > 5 > 5 > 5
        return output.repeat!({
          dir1: output[dir1]!(),
          dir4: output[dir4]!(),
          dir5: output[dir5]!(),
          dir8: output[dir8]!(),
        });
      },
      outputStrings: {
        repeat: {
          en: '${dir4} => ${dir1} x3 => ${dir8} => ${dir5} x3',
          ko: '${dir4} 🔜 ${dir1}x3 🔜 ${dir8} 🔜 ${dir5}x3',
        },
        rewind: {
          en: '${dir4} => ${dir1} x6 => ${dir4}',
          ko: '${dir4} 🔜 ${dir1}x6 🔜 ${dir4}',
        },
        avoid: {
          en: 'Avoid swipes x8',
          ko: '스와이프x8 피해요!',
        },
        left: Outputs.left,
        right: Outputs.right,
        front: Outputs.front,
        back: Outputs.back,
      },
    },
  ],
};

export default triggerSet;
