import NetRegexes from '../../../../../resources/netregexes';
import ZoneId from '../../../../../resources/zone_id';
import { OopsyData } from '../../../../../types/data';
import { OopsyTriggerSet } from '../../../../../types/oopsy';
import { playerDamageFields } from '../../../oopsy_common';

export interface Data extends OopsyData {
  assault?: string[];
}

const triggerSet: OopsyTriggerSet<Data> = {
  zoneId: ZoneId.AlexanderTheSoulOfTheCreator,
  damageWarn: {
    'A12N Sacrament': '1AE6', // Cross Lasers
    'A12N Gravitational Anomaly': '1AEB', // Gravity Puddles
  },
  shareWarn: {
    'A12N Divine Spear': '1AE3', // Instant conal tank cleave
    'A12N Blazing Scourge': '1AE9', // Orange head marker splash damage
    'A12N Plaint Of Severity': '1AF1', // Aggravated Assault splash damage
    'A12N Communion': '1AFC', // Tether Puddles
  },
  triggers: [
    {
      id: 'A12N Assault Collect',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '461' }),
      run: (data, matches) => {
        data.assault ??= [];
        data.assault.push(matches.target);
      },
    },
    {
      // It is a failure for a Severity marker to stack with the Solidarity group.
      id: 'A12N Assault Failure',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '1AF2', ...playerDamageFields }),
      condition: (data, matches) => data.assault?.includes(matches.target),
      mistake: (_data, matches) => {
        return {
          type: 'fail',
          blame: matches.target,
          reportId: matches.targetId,
          text: {
            en: 'Didn\'t Spread!',
            de: 'Nicht verteilt!',
            fr: 'Ne s\'est pas dispersé(e) !',
            ja: '散開しなかった!',
            cn: '没有散开!',
            ko: '산개하지 않았음!',
          },
        };
      },
    },
    {
      id: 'A12N Assault Cleanup',
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: '461' }),
      delaySeconds: 20,
      suppressSeconds: 5,
      run: (data) => {
        delete data.assault;
      },
    },
  ],
};

export default triggerSet;
