import { OopsyData } from '../types/data';
import { OopsyMistakeType, OopsyTrigger } from '../types/oopsy';

import NetRegexes from './netregexes';

// begin [oopsy_common.ts]
// const kFieldFlags = 8;
// const kFieldDamage = 9;

// const kShiftFlagValues = ['3E', '113', '213', '313'];
const kFlagInstantDeath = '36'; // Always 36 ?
const kAttackFlags = ['01', '03', '05', '06', kFlagInstantDeath];
// const kHealFlags = ['04'];

const playerDamageFields = {
  targetId: '[^4].......',
  flags: `[^|]*(?:${kAttackFlags.join('|')})(?=\\|)`,
} as const;
// end [oopsy_common.ts]

const AutumnOopsy = {
  pushedIntoWall: (
    triggerId: string,
    abilityId: string | string[],
  ): OopsyTrigger<OopsyData> => {
    return {
      id: triggerId,
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: abilityId, ...playerDamageFields }),
      condition: (data, matches) => data.DamageFromMatches(matches) > 0,
      deathReason: (_data, matches) => {
        return {
          id: matches.targetId,
          name: matches.target,
          text: {
            en: 'Pushed into wall',
            de: 'Rückstoß in die Wand',
            fr: 'Poussé(e) dans le mur',
            ja: '壁へノックバック',
            cn: '击退至墙',
            ko: '벽으로 넉백',
          },
        };
      },
    };
  },

  nonzeroDamageMistake: (
    triggerId: string,
    abilityId: string | string[],
    type: OopsyMistakeType,
  ): OopsyTrigger<OopsyData> => {
    return {
      id: triggerId,
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: abilityId }),
      condition: (data, matches) => data.DamageFromMatches(matches) > 0,
      mistake: (_data, matches) => {
        return {
          type: type,
          blame: matches.target,
          reportId: matches.targetId,
          text: matches.ability,
        };
      },
    };
  },
} as const;

export default AutumnOopsy;
