import Autumn from '../../../../../resources/autumn';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

type Marks = 'wing' | 'unknown';
type DebuffType = { name: string; count: number };

/* 너무 많아서 다른 방법으로
const doubleIds = [
  'A67D', 'A67E', 'A67F', 'A680', 'A681', 'A682', 'A68D',
  'A68E', 'A68F', 'A690', 'A691', 'A692', 'A693', 'A697',
  'A699',
];
*/

const doubleFlags = {
  'painted': 0x1,
  'heaven': 0x2,
  'molbol': 0x4,
  'succubus': 0x8,
};

export interface Data extends RaidbossData {
  bomb?: 'cold' | 'warm';
  mark?: Marks;
  crush?: 'pair' | 'light';
  style: number;
  target?: string;
  debuffs: DebuffType[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'AacCruiserweightM2Savage',
  zoneId: ZoneId.AacCruiserweightM2Savage,
  timelineFile: 'r6s.txt',
  initData: () => ({
    debuffs: [],
    style: 0,
  }),
  triggers: [
    {
      id: 'R6S Mousse Mural',
      type: 'StartsUsing',
      netRegex: { id: 'A6BC', source: 'Sugar Riot', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R6S Color Riot',
      type: 'StartsUsing',
      // A691 웜 아래, 콜드 위
      // A692 웜 위, 콜드 아래
      netRegex: { id: ['A691', 'A692'], source: 'Sugar Riot' },
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          bait: {
            en: 'Bait Tank Cleave',
            ko: '탱크 클레브 유도해욧',
          },
          cold: {
            en: 'Bait cold ${act}',
            ko: '${act} 🔵유도해욧',
          },
          warm: {
            en: 'Bait warm ${act}',
            ko: '${act} 🔴유도해욧',
          },
          in: Outputs.in,
          out: Outputs.out,
          avoidCleave: Outputs.avoidTankCleave,
        };
        if (!Autumn.isTank(data.moks))
          return { infoText: output.avoidCleave!() };
        if (data.bomb === 'cold') {
          // 웜 유도할 것
          const act = matches.id === 'A691' ? output.out!() : output.in!();
          return { alertText: output.warm!({ act: act }) };
        } else if (data.bomb === 'warm') {
          // 콜드 유도할 것
          const act = matches.id === 'A692' ? output.out!() : output.in!();
          return { alertText: output.cold!({ act: act }) };
        }
        return { alertText: output.bait!() };
      },
    },
    {
      id: 'R6S Cold Bomb',
      type: 'Ability',
      netRegex: { id: 'A693', source: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.target,
      run: (data) => data.bomb = 'cold',
    },
    {
      id: 'R6S Warm Bomb',
      type: 'Ability',
      netRegex: { id: 'A694', source: 'Sugar Riot' },
      condition: (data, matches) => data.me === matches.target,
      run: (data) => data.bomb = 'warm',
    },
    {
      id: 'R6S Wingmark Collect',
      type: 'StartsUsing',
      netRegex: { id: 'A676', source: 'Sugar Riot', capture: false },
      run: (data) => data.mark = 'wing',
    },
    {
      id: 'R6S Wingmark',
      type: 'GainsEffect',
      netRegex: { effectId: '1162' },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 8.5,
      infoText: (data, _matches, output) => {
        const act = output[data.crush ?? 'unknown']!();
        return output.text!({ act: act });
      },
      outputStrings: {
        text: {
          en: 'Wing => ${act}',
          ko: '날라서 🔜 ${act}',
        },
        pair: Outputs.stackPartner,
        light: Outputs.stackGroup,
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R6S Color Crash',
      type: 'StartsUsing',
      netRegex: { id: ['A68B', 'A68D'], source: 'Sugar Riot' },
      run: (data, matches) => {
        data.crush = matches.id === 'A68B' ? 'light' : 'pair';
        data.style = 0;
      },
    },
    {
      id: 'R6S Double Tether Succubus',
      type: 'Tether',
      netRegex: { source: 'Candied Succubus', capture: false },
      run: (data) => data.style |= doubleFlags.succubus,
    },
    {
      id: 'R6S Double Tether Morbol',
      type: 'Tether',
      netRegex: { source: 'Mouthwatering Morbol', capture: false },
      run: (data) => data.style |= doubleFlags.molbol,
    },
    {
      id: 'R6S Double Tether Paint Bomb',
      type: 'Tether',
      netRegex: { source: 'Paint Bomb', capture: false },
      run: (data) => data.style |= doubleFlags.painted,
    },
    {
      id: 'R6S Double Tether Heaven Bomb',
      type: 'Tether',
      netRegex: { source: 'Heaven Bomb', capture: false },
      run: (data) => data.style |= doubleFlags.heaven,
    },
    {
      id: 'R6S Sticky Mousse',
      type: 'StartsUsing',
      netRegex: { id: 'A695', source: 'Sugar Riot', capture: false },
      response: Responses.protean(),
    },
    {
      id: 'R6S Sticky Groups',
      type: 'Ability',
      netRegex: { id: 'A695', source: 'Sugar Riot', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Light party',
          ko: '4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'R6S Sugarscape',
      type: 'StartsUsing',
      netRegex: { id: 'A668', source: 'Sugar Riot', capture: false },
      run: (data) => data.debuffs = [],
    },
    {
      id: 'R6S Sand Defamation Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      infoText: (data, matches, output) => {
        const count = parseFloat(matches.duration);
        data.debuffs.push({ name: matches.target, count: count });
        if (data.debuffs.length < 4 || !Autumn.isTank(data.moks))
          return;
        const itsme = data.debuffs.findIndex((x) => x.name === data.me);
        return itsme === -1 ? output.provoke!() : output.shirk!();
      },
      outputStrings: {
        shirk: {
          en: '(shirk)',
          ko: '(헤이트 넘겨줘요)',
        },
        provoke: {
          en: '(provoke)',
          ko: '(프로보크)',
        },
      },
    },
    {
      id: 'R6S Sand Defamation',
      type: 'GainsEffect',
      netRegex: { effectId: '1166' },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 10,
      countdownSeconds: 10,
      infoText: (data, matches, output) => {
        const count = parseFloat(matches.duration);
        const p = data.debuffs.find((x) => x.name !== data.me && x.count === count);
        if (p === undefined)
          return;
        const m = data.party.member(p.name);
        if (data.options.AutumnStyle)
          return output.text!({ partner: m.jobFull });
        return output.text!({ partner: m });
      },
      outputStrings: {
        text: {
          en: 'Defamation (w/ ${partner})',
          ko: '내게 대폭발 (${partner})',
        },
      },
    },
  ],
};

export default triggerSet;
