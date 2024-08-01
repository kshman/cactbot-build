import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  partnersSpreadCounter: number;
  storedPartnersSpread?: 'partners' | 'spread';
  //
  alaramPheromones: number;
  poisonPop?: number;
}

const headMarkerData = {
  // Vfx Path: lockon6_t0t
  alarumSpread: '00EA',
  // Vfx Path: m0676trg_tw_d0t1p
  sharedBuster: '0103',
  // Vfx Path: tank_laser_5sec_lockon_c0a1
  tankLaser: '01D7',
  // Vfx Path: m0906_tgae_s701k2
  spreadMarker2: '0203',
  // Vfx Path: m0906_share4_7s0k2
  heartStackMarker: '0205',
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'AacLightHeavyweightM2Savage',
  zoneId: ZoneId.AacLightHeavyweightM2Savage,
  timelineFile: 'r2s.txt',
  initData: () => ({
    partnersSpreadCounter: 0,
    alaramPheromones: 0,
  }),
  triggers: [
    {
      id: 'R2S Headmarker Shared Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.sharedBuster, capture: true },
      suppressSeconds: 5,
      response: Responses.sharedTankBuster(),
    },
    {
      id: 'R2S Headmarker Cone Tankbuster',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.tankLaser, capture: true },
      suppressSeconds: 5,
      response: Responses.tankCleave(),
    },
    {
      id: 'R2S Headmarker Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.spreadMarker2, capture: false },
      suppressSeconds: 5,
      response: Responses.spread(),
    },
    {
      id: 'R2S Headmarker Party Stacks',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.heartStackMarker, capture: false },
      infoText: (_data, _matches, output) => output.stacks!(),
      outputStrings: {
        stacks: Outputs.stacks,
      },
    },
    {
      id: 'R2S Call Me Honey',
      type: 'StartsUsing',
      netRegex: { id: '9183', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Partners/Spread Counter',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9185', '9B08', '9B09'], source: 'Honey B. Lovely', capture: false },
      run: (data) => data.partnersSpreadCounter++,
    },
    {
      id: 'R2S Drop of Venom',
      type: 'StartsUsing',
      netRegex: { id: '9185', source: 'Honey B. Lovely', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      run: (data) => data.storedPartnersSpread = 'partners',
      outputStrings: {
        text: {
          en: 'Stored Partners',
          ko: '나중에 둘이 페어',
        },
      },
    },
    {
      id: 'R2S Splash of Venom',
      type: 'StartsUsing',
      netRegex: { id: '9184', source: 'Honey B. Lovely', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      run: (data) => data.storedPartnersSpread = 'spread',
      outputStrings: {
        text: {
          en: 'Stored Spread',
          ko: '나중에 흩어져요',
        },
      },
    },
    {
      id: 'R2S Drop of Love',
      type: 'StartsUsing',
      netRegex: { id: '9B09', source: 'Honey B. Lovely', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      run: (data) => data.storedPartnersSpread = 'partners',
      outputStrings: {
        text: {
          en: 'Stored Partners',
          ko: '나중에 둘이 페어',
        },
      },
    },
    {
      id: 'R2S Spread Love',
      type: 'StartsUsing',
      netRegex: { id: '9B08', source: 'Honey B. Lovely', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      run: (data) => data.storedPartnersSpread = 'spread',
      outputStrings: {
        text: {
          en: 'Stored Spread',
          ko: '나중에 흩어져요',
        },
      },
    },
    {
      id: 'R2S Delayed Partners/Spread Callout',
      type: 'StartsUsing',
      netRegex: { id: ['9184', '9185', '9B08', '9B09'], source: 'Honey B. Lovely', capture: false },
      delaySeconds: (data) => {
        // TODO: Review these delay timings
        switch (data.partnersSpreadCounter) {
          case 1:
            return 14;
          case 2:
            return 11;
          case 3:
            return 37;
          case 4:
            return 62;
          case 5:
            return 55;
        }
        return 0;
      },
      durationSeconds: 7,
      infoText: (data, _matches, output) => output[data.storedPartnersSpread ?? 'unknown']!(),
      outputStrings: {
        spread: {
          en: 'Spread',
          ko: '흩어져요',
        },
        partners: {
          en: 'Partners',
          ko: '둘이 페어',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'R2S Honey Beeline',
      type: 'StartsUsing',
      netRegex: { id: ['9186', '9B0C'], source: 'Honey B. Lovely', capture: false },
      response: Responses.goSides(),
    },
    {
      id: 'R2S Tempting Twist',
      type: 'StartsUsing',
      netRegex: { id: ['9187', '9B0D'], source: 'Honey B. Lovely', capture: false },
      response: Responses.getUnder(),
    },
    {
      id: 'R2S Honey B. Live: 1st Beat',
      type: 'StartsUsing',
      netRegex: { id: '9C24', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Honey B. Live: 2nd Beat',
      type: 'StartsUsing',
      netRegex: { id: '9C25', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Honey B. Live: 3rd Beat',
      type: 'StartsUsing',
      netRegex: { id: '9C26', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Loveseeker',
      type: 'StartsUsing',
      netRegex: { id: '9B7D', source: 'Honey B. Lovely', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'R2S Centerstage Combo',
      type: 'StartsUsing',
      netRegex: { id: '91AC', source: 'Honey B. Lovely', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Under Intercards => Out => Cards',
          ko: '밑❌ 🔜 바깥❌ 🔜 바깥➕',
        },
      },
    },
    {
      id: 'R2S Outerstage Combo',
      type: 'StartsUsing',
      netRegex: { id: '91AD', source: 'Honey B. Lovely', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out Cards => Intercards => Under',
          ko: '바깥➕ 🔜 바깥❌ 🔜 밑❌',
        },
      },
    },
    {
      id: 'R2S Honey B. Finale',
      type: 'StartsUsing',
      netRegex: { id: '918F', source: 'Honey B. Lovely', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'R2S Rotten Heart',
      type: 'StartsUsing',
      netRegex: { id: '91AA', source: 'Honey B. Lovely', capture: false },
      response: Responses.bigAoe(),
    },
    // ====== PRS ======
    {
      id: 'R2S PRS Alarum Pheromones',
      type: 'StartsUsing',
      netRegex: { id: '917D', source: 'Honey B. Lovely', capture: false },
      run: (data) => data.alaramPheromones++,
      /*
      infoText: (data, _matches, output) => {
        data.alaramPheromones++;
        if (data.alaramPheromones === 1)
          return output.first!();
        if (data.alaramPheromones === 2)
          return output.second!();
      },
      outputStrings: {
        first: {
          en: 'Alarum Pheromones (1)',
          ko: '알람 페로몬 #1',
        },
        second: {
          en: 'Alarum Pheromones (2)',
          ko: '알람 페로몬 #2',
        },
      },
      */
    },
    {
      id: 'R2S PRS Alarum Spread',
      type: 'HeadMarker',
      netRegex: { id: headMarkerData.alarumSpread, capture: true },
      condition: (data, matches) => data.me === matches.target,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread Marker on YOU',
          ko: '바깥에 장판 버려요!',
        },
      },
    },
    {
      id: 'R2S PRS Bee Sting',
      type: 'StartsUsing',
      netRegex: { id: '91A8', source: 'Honey B. Lovely', capture: false },
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bee Sting',
          ko: '4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'R2S PRS Poison \'n\' Pop',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5E', capture: true },
      condition: (data, matches) => data.me === matches.target,
      infoText: (data, matches, output) => {
        const len = parseFloat(matches.duration);
        if (len < 30) { // 26초
          data.poisonPop = 26;
          return output.s26!();
        }
        data.poisonPop = 46;
        return output.s46!();
      },
      outputStrings: {
        s26: {
          en: '26s Poison',
          ko: '(장판 먼저 버려요)',
        },
        s46: {
          en: '46s Poison',
          ko: '(탑 먼저 밟아요)',
        },
      },
    },
    {
      id: 'R2S PRS Laceration',
      type: 'Ability',
      netRegex: { id: '91B2', source: 'Honey B. Lovely', capture: false },
      condition: (data) => data.poisonPop !== undefined,
      delaySeconds: 2.5,
      alertText: (data, _matches, output) => {
        if (data.poisonPop === 26) {
          data.poisonPop = 46;
          return output.aoe!();
        }
        data.poisonPop = 26;
        return output.puddle!();
      },
      outputStrings: {
        aoe: {
          en: 'Drop AOE',
          ko: '바깥쪽에 장판 버려요',
        },
        puddle: {
          en: 'Puddle',
          ko: '한가운데 🔜 탑 밟아요',
        },
      },
    },
    {
      id: 'R2S PRS Beeloved Venom: α',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5C', capture: true },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Beeloved Venom: α',
          ko: '알파 독! 한가운데서 터쳐요!',
        },
      },
    },
    {
      id: 'R2S PRS Beeloved Venom: β',
      type: 'GainsEffect',
      netRegex: { effectId: 'F5D', capture: true },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Beeloved Venom: β',
          ko: '베타 독! 한가운데서 터쳐요!',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Honey B. Lovely': 'ハニー・B・ラブリー',
      },
    },
  ],
};

export default triggerSet;
