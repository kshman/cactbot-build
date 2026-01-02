import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { LocaleText, TriggerSet } from '../../../../../types/trigger';

// Eureka Orthos Floors 81-90

export type salvoEgg = {
  location: number;
  heading: number;
};

export interface Data extends RaidbossData {
  interception?: boolean;
  interceptionSequence?: string[];
  salvo?: boolean;
  salvoEggs?: salvoEgg[];
  near?: number;
  far?: number;
}

export const firstHeadmarker = parseInt('0186', 16);

const interceptionOutputStrings: { [label: string]: LocaleText } = {
  egg: {
    en: 'egg',
    de: 'Ei',
    fr: 'Œuf',
    ja: 'たまご',
    cn: '蛋',
    ko: '알',
    tc: '蛋',
  },
  cube: {
    en: 'cubes',
    de: 'Würfel',
    fr: 'Cube',
    ja: '四角',
    cn: '方块',
    ko: '큐브',
    tc: '方塊',
  },
  ball: {
    en: 'ball',
    de: 'Ball',
    fr: 'Balle',
    ja: '円', // 〇
    // 〇
    cn: '球',
    ko: '동글',
    tc: '球',
  },
} as const;

const triggerSet: TriggerSet<Data> = {
  id: 'EurekaOrthosFloors81_90',
  zoneId: ZoneId.EurekaOrthosFloors81_90,

  triggers: [
    // ---------------- Floor 81-89 Mobs ----------------
    {
      id: 'EO 81-90 Orthoiron Corse Glass Punch',
      type: 'StartsUsing',
      netRegex: { id: '7FF7', source: 'Orthoiron Corse', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'EO 81-90 Orthos Gourmand Moldy Sneeze',
      type: 'StartsUsing',
      netRegex: { id: '7FED', source: 'Orthos Gourmand', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'EO 81-90 Orthos Catoblepas Demon Eye',
      // roomwide AoE, gives 20s stun
      // 7FFA is the same attack, used out-of-combat
      type: 'StartsUsing',
      netRegex: { id: '7FF9', source: 'Orthos Catoblepas', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'EO 81-90 Orthos Hecteyes Hex Eye',
      type: 'StartsUsing',
      netRegex: { id: '7FDB', source: 'Orthos Hecteyes', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'EO 81-90 Orthos Deepeye Hypnotize',
      type: 'StartsUsing',
      netRegex: { id: '7FE1', source: 'Orthos Deepeye', capture: false },
      response: Responses.lookAway('alert'),
    },
    {
      id: 'EO 81-90 Orthos Spartoi Triple Trial',
      type: 'StartsUsing',
      netRegex: { id: '7FE4', source: 'Orthos Spartoi', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'EO 81-90 Orthos Specter Left Sweep',
      type: 'StartsUsing',
      netRegex: { id: '8008', source: 'Orthos Specter', capture: false },
      response: Responses.goRight(),
    },
    {
      id: 'EO 81-90 Orthos Specter Right Sweep',
      type: 'StartsUsing',
      netRegex: { id: '8009', source: 'Orthos Specter', capture: false },
      response: Responses.goLeft(),
    },
    {
      id: 'EO 81-90 Orthos Specter Ringing Burst',
      type: 'StartsUsing',
      netRegex: { id: '8007', source: 'Orthos Specter', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'EO 81-90 Orthos Specter Surrounding Burst',
      type: 'StartsUsing',
      netRegex: { id: '8006', source: 'Orthos Specter', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'EO 81-90 Orthos Wraith Scream',
      type: 'StartsUsing',
      netRegex: { id: '8004', source: 'Orthos Wraith', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'EO 81-90 Orthos Ahriman Blustering Blink',
      type: 'StartsUsing',
      netRegex: { id: '7FF4', source: 'Orthos Ahriman', capture: false },
      response: Responses.awayFromFront(),
    },
    {
      id: 'EO 81-90 Orthos Pegasus Nicker',
      type: 'StartsUsing',
      netRegex: { id: '8000', source: 'Orthos Pegasus', capture: false },
      response: Responses.getOut(),
    },
    // ---------------- Floor 90 Boss: Administrator ----------------
    {
      id: 'EO 81-90 Administrator Peripheral Lasers',
      type: 'StartsUsing',
      netRegex: { id: '7AD7', source: 'Administrator', capture: false },
      response: Responses.getUnder('alert'),
    },
    {
      id: 'EO 81-90 Administrator Cross Lasers',
      type: 'StartsUsing',
      netRegex: { id: '7AD8', source: 'Administrator', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          // "Intercardinals" may confuse people between absolute and relative,
          // so add in the "of boss" just to be extra clear.
          en: 'Go Intercardinal of Boss',
          ja: 'ボスの斜めへ',
          ko: '보스 비스듬히 피해요',
        },
      },
    },
    {
      id: 'EO 81-90 Administrator Laserstream',
      type: 'StartsUsing',
      netRegex: { id: '7AE0', source: 'Administrator', capture: false },
      response: Responses.bigAoe(),
    },
    {
      id: 'EO 81-90 Administrator Support Systems Cleanup',
      type: 'StartsUsing',
      netRegex: { id: '7AD9', source: 'Administrator', capture: false },
      run: (data) => {
        delete data.interception;
        delete data.interceptionSequence;
        delete data.salvo;
        delete data.salvoEggs;
        delete data.near;
        delete data.far;
      },
    },
    {
      id: 'EO 81-90 Administrator Interception Sequence Collect',
      type: 'StartsUsing',
      netRegex: { id: '7ADA', source: 'Administrator', capture: false },
      run: (data) => {
        data.interception = true;
      },
    },
    {
      id: 'EO 81-90 Administrator Interception Sequence Interceptor α Collect',
      // HeadMarker ids do not appear to have random offsets in Eureka Orthos
      // 0186 = first
      // 0187 = second
      // 0188 = third
      type: 'HeadMarker',
      netRegex: { id: '018[6-8]', target: 'Interceptor α' },
      run: (data, matches, output) => {
        const num = parseInt(matches.id, 16) - firstHeadmarker;
        data.interceptionSequence ??= [];
        data.interceptionSequence[num] = output.egg!();
      },
      outputStrings: interceptionOutputStrings,
    },
    {
      id: 'EO 81-90 Administrator Interception Sequence Interceptor β Collect',
      // HeadMarker ids do not appear to have random offsets in Eureka Orthos
      // 0186 = first
      // 0187 = second
      // 0188 = third
      type: 'HeadMarker',
      netRegex: { id: '018[6-8]', target: 'Interceptor β' },
      suppressSeconds: 1,
      run: (data, matches, output) => {
        const num = parseInt(matches.id, 16) - firstHeadmarker;
        data.interceptionSequence ??= [];
        data.interceptionSequence[num] = output.cube!();
      },
      outputStrings: interceptionOutputStrings,
    },
    {
      id: 'EO 81-90 Administrator Interception Sequence Interceptor γ Collect',
      // HeadMarker ids do not appear to have random offsets in Eureka Orthos
      // 0186 = first
      // 0187 = second
      // 0188 = third
      type: 'HeadMarker',
      netRegex: { id: '018[6-8]', target: 'Interceptor γ' },
      run: (data, matches, output) => {
        const num = parseInt(matches.id, 16) - firstHeadmarker;
        data.interceptionSequence ??= [];
        data.interceptionSequence[num] = output.ball!();
      },
      outputStrings: interceptionOutputStrings,
    },
    {
      id: 'EO 81-90 Administrator Interception Sequence',
      // 7ADB = Interceptor α (egg) large cone AoE
      // 7ADC = Interceptor β (cube) line AoE
      // 7ADD = Interceptor γ (ball) donut AoE
      type: 'StartsUsing',
      netRegex: { id: '7AD[B-D]', capture: false },
      condition: (data) => (data.interception),
      durationSeconds: 12,
      suppressSeconds: 8,
      infoText: (data, _matches, output) => {
        if (data.interceptionSequence === undefined || data.interceptionSequence.length < 3) {
          console.error(`Administrator Interception Sequence: array error`);
          return;
        }
        return output.text!({
          first: data.interceptionSequence[0],
          second: data.interceptionSequence[1],
          third: data.interceptionSequence[2],
        });
      },
      outputStrings: {
        text: {
          en: '${first} => ${second} => ${third}',
          ja: '${first} => ${second} => ${third}',
          ko: '${first} 🔜 ${second} 🔜 ${third}',
        },
      },
    },
    {
      id: 'EO 81-90 Administrator Salvo Script Start Collect',
      type: 'StartsUsing',
      netRegex: { id: '7ADF', source: 'Administrator', capture: false },
      run: (data) => {
        data.salvo = true;
      },
    },
    {
      id: 'EO 81-90 Administrator Salvo Script',
      type: 'StartsUsing',
      netRegex: { id: '8040', source: 'Interceptor α' },
      condition: (data) => (data.salvo),
      durationSeconds: 8,
      infoText: (data, matches, output) => {
        // convert heading into 0=N, 1=E, 2=S, 3=W
        const heading = Math.round(2 - 2 * parseFloat(matches.heading) / Math.PI) % 4;

        // convert (x,y) location into 0=N, 1=E, 2=S, 3=W
        // center is (-300,-300)
        const x = parseFloat(matches.x) + 300;
        const y = parseFloat(matches.y) + 300;
        const location = Math.round(2 - 2 * Math.atan2(x, y) / Math.PI) % 4;

        data.salvoEggs ??= [];
        data.salvoEggs.push({ 'location': location, 'heading': heading });

        if (data.salvoEggs.length < 2)
          return;

        const egg1 = data.salvoEggs.pop();
        const egg2 = data.salvoEggs.pop();
        if (egg1 === undefined || egg2 === undefined) {
          console.error(`Administrator Salvo Script: eggs undefined`);
          return;
        }

        if (
          Math.abs(egg1.location - egg1.heading) === 2 &&
          Math.abs(egg2.location - egg2.heading) === 2
        ) {
          // both eggs are facing towards the center; safespot is the corner between the eggs
          // 0=N, 1=NE, 2=E, 3=SE, 4=S, 5=SW, 6=W, 7=NW
          const safeSpot = Math.abs(egg1.location - egg2.location) === 3
            ? 7
            : (egg1.location + egg2.location);

          const safeMap: { [safeSpot: number]: string } = {
            1: output.between!({ safe: output.northEast!() }),
            3: output.between!({ safe: output.southEast!() }),
            5: output.between!({ safe: output.southWest!() }),
            7: output.between!({ safe: output.northWest!() }),
          };
          return safeMap[safeSpot];
        }

        if (Math.abs(egg1.heading - egg2.heading) === 2) {
          // both eggs are facing each other; safespot is the corner perpendicular to the heading of the eggs
          if (Math.abs(egg1.location - egg1.heading) === 2) {
            // egg1 is adjacent to the safespot, egg2 is opposite the safespot
            data.near = egg1.location;
            data.far = (egg2.location + 2) % 4;
          } else {
            // egg1 is opposite the safespot, egg2 is adjacent to the safespot
            data.near = egg2.location;
            data.far = (egg1.location + 2) % 4;
          }

          const safeSpot = Math.abs(data.near - data.far) === 3 ? 7 : (data.near + data.far);

          const safeMap: { [safeSpot: number]: string } = {
            1: output.safe!({ safe: output.northEast!() }),
            3: output.safe!({ safe: output.southEast!() }),
            5: output.safe!({ safe: output.southWest!() }),
            7: output.safe!({ safe: output.northWest!() }),
          };
          return safeMap[safeSpot];
        }
      },
      outputStrings: {
        between: {
          en: '${safe}, between eggs',
          ja: '${safe}, たまごの間',
          ko: '${safe}, 알 사이',
        },
        safe: {
          en: '${safe}',
          ja: '${safe}',
          ko: '${safe}',
        },
        northEast: Outputs.northeast,
        southEast: Outputs.southeast,
        southWest: Outputs.southwest,
        northWest: Outputs.northwest,
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Administrator': 'Administrator',
        'Interceptor α': 'Hilfssystem α',
        'Interceptor β': 'Hilfssystem β',
        'Interceptor γ': 'Hilfssystem γ',
        'Orthoiron Corse': 'Orthos-Eisenleichnam',
        'Orthos Ahriman': 'Orthos-Ahriman',
        'Orthos Catoblepas': 'Orthos-Catblepus',
        'Orthos Deepeye': 'Orthos-Glotzauge',
        'Orthos Gourmand': 'Orthos-Gourmet',
        'Orthos Hecteyes': 'Orthos-Hektokulus',
        'Orthos Pegasus': 'schwarz(?:e|er|es|en) Orthos-Pegasus',
        'Orthos Spartoi': 'Orthos-Spartoi',
        'Orthos Specter': 'Orthos-Schemen',
        'Orthos Wraith': 'Orthos-Geist',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Administrator': 'Administrateur',
        'Interceptor α': 'intercepteur α',
        'Interceptor β': 'intercepteur β',
        'Interceptor γ': 'intercepteur γ',
        'Orthoiron Corse': 'cors de fer Orthos',
        'Orthos Ahriman': 'ahriman Orthos',
        'Orthos Catoblepas': 'catoblépas Orthos',
        'Orthos Deepeye': 'oculus Orthos',
        'Orthos Gourmand': 'gourmand Orthos',
        'Orthos Hecteyes': 'hectoculus Orthos',
        'Orthos Pegasus': 'pégase sombre Orthos',
        'Orthos Spartoi': 'spartoi Orthos',
        'Orthos Specter': 'spector Orthos',
        'Orthos Wraith': 'spectre Orthos',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Administrator': 'アドミニストレーター',
        'Interceptor α': '要撃システムα',
        'Interceptor β': '要撃システムβ',
        'Interceptor γ': '要撃システムγ',
        'Orthoiron Corse': 'オルト・アイアンコース',
        'Orthos Ahriman': 'オルト・アーリマン',
        'Orthos Catoblepas': 'オルト・カトブレパス',
        'Orthos Deepeye': 'オルト・ディープアイ',
        'Orthos Gourmand': 'オルト・グルマン',
        'Orthos Hecteyes': 'オルト・ヘクトアイズ',
        'Orthos Pegasus': 'オルト・ブラックペガサス',
        'Orthos Spartoi': 'オルト・スパルトイ',
        'Orthos Specter': 'オルト・スペクター',
        'Orthos Wraith': 'オルト・レイス',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Administrator': '管理者',
        'Interceptor α': '截击系统α',
        'Interceptor β': '截击系统β',
        'Interceptor γ': '截击系统γ',
        'Orthoiron Corse': '正统铁面腐尸',
        'Orthos Ahriman': '正统冥鬼之眼',
        'Orthos Catoblepas': '正统卡托布莱帕斯',
        'Orthos Deepeye': '正统深瞳',
        'Orthos Gourmand': '正统贪吃鬼',
        'Orthos Hecteyes': '正统百目妖',
        'Orthos Pegasus': '正统黑天马',
        'Orthos Spartoi': '正统地生人',
        'Orthos Specter': '正统妖影',
        'Orthos Wraith': '正统幽灵',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Administrator': '管理者',
        'Interceptor α': '截擊系統α',
        'Interceptor β': '截擊系統β',
        'Interceptor γ': '截擊系統γ',
        'Orthoiron Corse': '正統鐵面腐屍',
        'Orthos Ahriman': '正統惡精靈',
        'Orthos Catoblepas': '正統卡托佈雷帕斯',
        'Orthos Deepeye': '正統深瞳',
        'Orthos Gourmand': '正統貪吃鬼',
        'Orthos Hecteyes': '正統百目妖',
        'Orthos Pegasus': '正統黑天馬',
        'Orthos Spartoi': '正統地生人',
        'Orthos Specter': '正統妖影',
        'Orthos Wraith': '正統幽靈',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Administrator': '관리자',
        'Interceptor α': '요격 시스템 α',
        'Interceptor β': '요격 시스템 β',
        'Interceptor γ': '요격 시스템 γ',
        'Orthoiron Corse': '오르토스 강철송장',
        'Orthos Ahriman': '오르토스 아리만',
        'Orthos Catoblepas': '오르토스 카토블레파스',
        'Orthos Deepeye': '오르토스 볼록눈',
        'Orthos Gourmand': '오르토스 대식가',
        'Orthos Hecteyes': '오르토스 백눈깔이',
        'Orthos Pegasus': '오르토스 검은 페가수스',
        'Orthos Spartoi': '오르토스 스파르토이',
        'Orthos Specter': '오르토스 그림자요괴',
        'Orthos Wraith': '오르토스 망령',
      },
    },
  ],
};

export default triggerSet;
