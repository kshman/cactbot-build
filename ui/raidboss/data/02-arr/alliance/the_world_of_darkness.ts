import Conditions from '../../../../../resources/conditions';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  sullenDebuff?: boolean;
  irefulDebuff?: boolean;
}

// TODO:
//  Angra Mainyu
//    Add Level 100 Flare
//    Add Level 150 Doom
//    Add Roulette?
//    Add info text for add spawns?
//  Five-Headed Dragon
//  Howling Atomos
//  Cerberus
//  Cloud of Darkness

const triggerSet: TriggerSet<Data> = {
  id: 'TheWorldOfDarkness',
  zoneId: ZoneId.TheWorldOfDarkness,
  comments: {
    en: 'Mostly incomplete',
    de: 'Größtenteils unvollständig',
    fr: 'Majoritairement incomplet',
    cn: '大部分未完成',
    ko: '대부분 미완성',
    tc: '大部分未完成',
  },
  triggers: [
    {
      id: 'Angra Mainyu Gain Sullen',
      type: 'GainsEffect',
      netRegex: { effectId: '27c' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.sullenDebuff = true,
    },
    {
      id: 'Angra Mainyu Lose Sullen',
      type: 'LosesEffect',
      netRegex: { effectId: '27c' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.sullenDebuff = false,
    },
    {
      id: 'Angra Mainyu Gain Ireful',
      type: 'GainsEffect',
      netRegex: { effectId: '27d' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.irefulDebuff = true,
    },
    {
      id: 'Angra Mainyu Lose Ireful',
      type: 'LosesEffect',
      netRegex: { effectId: '27d' },
      condition: Conditions.targetIsYou(),
      run: (data) => data.irefulDebuff = false,
    },
    {
      id: 'Angra Mainyu Double Vision',
      type: 'StartsUsing',
      netRegex: { id: 'CC8', source: 'Angra Mainyu', capture: false },
      alertText: (data, _matches, output) => {
        if (data.sullenDebuff) {
          // Stand behind boss in the red half to switch to Ireful
          return output.red!();
        } else if (data.irefulDebuff) {
          // Stand in front of boss in the white half to switch to Sullen
          return output.white!();
        }
      },
      outputStrings: {
        red: {
          en: 'Get Behind (Red)',
          ja: '後ろ🔴赤',
          ko: '뒷쪽 🔴빨강으로',
        },
        white: {
          en: 'Get in Front (White)',
          ja: '前⚪白',
          ko: '앞쪽 ⚪하양으로',
        },
      },
    },
    {
      id: 'Angra Mainyu Mortal Gaze',
      type: 'StartsUsing',
      netRegex: { id: ['CD1', 'DAB'], source: 'Angra Mainyu', capture: false },
      suppressSeconds: 0.1,
      response: Responses.lookAway('alert'),
    },
    {
      id: 'Angra Mainyu Gain Doom',
      type: 'GainsEffect',
      netRegex: { effectId: 'd2' },
      condition: Conditions.targetIsYou(),
      alarmText: (_data, _matches, output) => output.cleanse!(),
      outputStrings: {
        cleanse: {
          en: 'Run to Cleanse Circle',
          ja: '床の光っている円範囲へ',
          ko: '둠: 동글이 밟아욧!',
        },
      },
    },
    {
      id: 'Angra Mainyu Level 100 Flare Marker',
      type: 'HeadMarker',
      netRegex: { id: '002C' },
      condition: Conditions.targetIsNotYou(),
      response: Responses.awayFrom(),
    },
    {
      id: 'Angra Mainyu Level 150 Death Marker',
      type: 'HeadMarker',
      netRegex: { id: '002D' },
      condition: Conditions.targetIsNotYou(),
      response: Responses.awayFrom(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Angra Mainyu': 'Angra Mainyu',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Angra Mainyu': 'Angra Mainyu',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Angra Mainyu': 'アンラ・マンユ',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Angra Mainyu': '安哥拉·曼纽',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Angra Mainyu': '安格拉·曼紐',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Angra Mainyu': '앙그라 마이뉴',
      },
    },
  ],
};

export default triggerSet;
