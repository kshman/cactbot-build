import { Lang, NonEnLang } from '../resources/languages';
import { NamedConfigEntry } from '../resources/user_config';
import { TimelineReplacement, TimelineStyle } from '../ui/raidboss/timeline_parser';

import { RaidbossData } from './data';
import { NetAnyMatches, NetMatches } from './net_matches';
import { NetParams } from './net_props';
import type { CactbotBaseRegExp, TriggerTypes } from './net_trigger';

// TargetedMatches can be used for generic functions in responses or conditions
// that use matches from any number of Regex or NetRegex functions.
export type TargetedParams = 'sourceId' | 'source' | 'targetId' | 'target';
export type TargetedMatches =
  | NetMatches['StartsUsing']
  | NetMatches['Ability']
  | NetMatches['GainsEffect']
  | NetMatches['LosesEffect']
  | NetMatches['Tether']
  | NetMatches['WasDefeated']
  | NetMatches['None'];

export type FullLocaleText = Record<Lang, string>;

export type LocaleObject<T> =
  & {
    en: T;
  }
  & {
    [s in NonEnLang]?: T;
  };

export type LocaleText = LocaleObject<string>;

export type ZoneIdType = number | null;

export type OutputStrings = { [outputKey: string]: LocaleText | string };

export type OutputStringsParamObject = {
  // The indexer type requires that `() => string` be a possible value, or else `toString` can't be
  // defined. Effectively, typescript sees it as `someParamObject['toString']()`, not as a direct
  // function call of `someParamObject.toString()`.
  [key: string]: undefined | string | number | (() => string);
  toString: () => string;
};

export type OutputStringsParam = string | number | OutputStringsParamObject;
export type OutputStringsParams = {
  [param: string]: OutputStringsParam | OutputStringsParam[] | undefined;
};

// TODO: is it awkward to have Outputs the static class and Output the unrelated type?
// This type corresponds to TriggerOutputProxy.
export type Output = {
  responseOutputStrings: OutputStrings;
} & {
  [key: string]: (params?: OutputStringsParams) => string;
};

// The output of any non-response raidboss trigger function.
export type TriggerOutput<Data extends RaidbossData, MatchType extends NetAnyMatches> =
  | undefined
  | null
  | LocaleText
  | string
  | number
  | boolean
  | ((d: Data, m: MatchType, o: Output) => TriggerOutput<Data, MatchType>);

// Used if the function doesn't need to return an en key
export type PartialTriggerOutput<Data extends RaidbossData, MatchType extends NetAnyMatches> =
  | undefined
  | null
  | Partial<LocaleText>
  | string
  | number
  | boolean
  | ((d: Data, m: MatchType, o: Output) => PartialTriggerOutput<Data, MatchType>);

// The type of a non-response trigger field.
export type TriggerFunc<Data extends RaidbossData, MatchType extends NetAnyMatches, Return> = (
  data: Data,
  matches: MatchType,
  output: Output,
) => Return;

// The output from a response function (different from other TriggerOutput functions).
export type ResponseOutput<Data extends RaidbossData, MatchType extends NetAnyMatches> = {
  infoText?: TriggerField<Data, MatchType, TriggerOutput<Data, MatchType>>;
  alertText?: TriggerField<Data, MatchType, TriggerOutput<Data, MatchType>>;
  alarmText?: TriggerField<Data, MatchType, TriggerOutput<Data, MatchType>>;
  tts?: TriggerField<Data, MatchType, PartialTriggerOutput<Data, MatchType>>;
} | undefined;
// The type of a response trigger field.
export type ResponseFunc<Data extends RaidbossData, MatchType extends NetAnyMatches> = (
  data: Data,
  matches: MatchType,
  output: Output,
) => ResponseOutput<Data, MatchType> | ResponseFunc<Data, MatchType>;

export type ResponseField<Data extends RaidbossData, MatchType extends NetAnyMatches> =
  | ResponseFunc<Data, MatchType>
  | ResponseOutput<Data, MatchType>;

// Config UI options that apply to an individual trigger (by id).
export type TriggerAutoConfig = {
  Output?: Output;
  Duration?: number;
  BeforeSeconds?: number;
  DelayAdjust?: number;
  OutputStrings?: OutputStrings;
  TextAlertsEnabled?: boolean;
  SoundAlertsEnabled?: boolean;
  SpokenAlertsEnabled?: boolean;
  AutumnOnly?: boolean;
};

// Config UI options that apply to an entire trigger set.
// TODO: this doesn't apply to literal timeline alerts (not timeline triggers but
// ancient timeline code that specifies alerts directly).
export type TriggerSetAutoConfig = {
  TextAlertsEnabled?: boolean;
  SoundAlertsEnabled?: boolean;
  SpokenAlertsEnabled?: boolean;
};

// Note: functions like run or preRun need to be defined as void-only as (confusingly)
// it is not possible to assign `(d: Data) => boolean` to a void | undefined, only to void.
export type TriggerField<Data extends RaidbossData, MatchType extends NetAnyMatches, Return> =
  [Return] extends [void] ? TriggerFunc<Data, MatchType, void>
    : TriggerFunc<Data, MatchType, Return> | Return;

// This trigger type is what we expect cactbot triggers to be written as,
// in other words `id` is not technically required for triggers but for
// built-in triggers it is.
export type BaseTrigger<
  Data extends RaidbossData,
  Type extends TriggerTypes,
> = Omit<BaseNetTrigger<Data, Type>, 'type' | 'netRegex'>;

type BaseNetTrigger<Data extends RaidbossData, Type extends TriggerTypes> = {
  id: string;
  comment?: Partial<LocaleText>;
  type: Type;
  netRegex: NetParams[Type];
  disabled?: boolean;
  condition?: TriggerField<Data, NetMatches[Type], boolean | undefined>;
  preRun?: TriggerField<Data, NetMatches[Type], void>;
  delaySeconds?: TriggerField<Data, NetMatches[Type], number>;
  // Leave undefined to preserve defaults and default overrides
  durationSeconds?: TriggerField<Data, NetMatches[Type], number | undefined>;
  suppressSeconds?: TriggerField<Data, NetMatches[Type], number>;
  countdownSeconds?: TriggerField<Data, NetMatches[Type], number>;
  promise?: TriggerField<Data, NetMatches[Type], Promise<void>>;
  // Leave undefined to preserve defaults and default overrides
  sound?: TriggerField<Data, NetMatches[Type], string | undefined>;
  soundVolume?: TriggerField<Data, NetMatches[Type], number>;
  response?: ResponseField<Data, NetMatches[Type]>;
  alarmText?: TriggerField<Data, NetMatches[Type], TriggerOutput<Data, NetMatches[Type]>>;
  alertText?: TriggerField<Data, NetMatches[Type], TriggerOutput<Data, NetMatches[Type]>>;
  infoText?: TriggerField<Data, NetMatches[Type], TriggerOutput<Data, NetMatches[Type]>>;
  tts?: TriggerField<Data, NetMatches[Type], PartialTriggerOutput<Data, NetMatches[Type]>>;
  run?: TriggerField<Data, NetMatches[Type], void>;
  outputStrings?: OutputStrings;
};

export type NetRegexTrigger<Data extends RaidbossData> = TriggerTypes extends infer T
  ? T extends TriggerTypes ? BaseNetTrigger<Data, T>
  : never
  : never;

export type GeneralNetRegexTrigger<Data extends RaidbossData, T extends TriggerTypes> =
  BaseNetTrigger<Data, T>;

type PartialRegexTrigger = {
  regex: RegExp;
};

export type RegexTrigger<Data extends RaidbossData> =
  & BaseTrigger<Data, 'None'>
  & PartialRegexTrigger;

export type TimelineTrigger<Data extends RaidbossData> = BaseTrigger<Data, 'None'> & {
  regex: RegExp;
  beforeSeconds?: number;
};

// Because timeline functions run during loading, they only support the base RaidbossData.
export type TimelineFunc = (data: RaidbossData) => TimelineField;
export type TimelineField = string | TimelineFunc | undefined | TimelineField[];

export type DataInitializeFunc<Data extends RaidbossData> = () => Omit<Data, keyof RaidbossData>;

// This helper takes all of the properties in Type and checks to see if they can be assigned to a
// blank object, and if so excludes them from the returned union. The `-?` syntax removes the
// optional modifier from the attribute which prevents `undefined` from being included in the union
// See also: https://www.typescriptlang.org/docs/handbook/2/mapped-types.html#mapping-modifiers
type RequiredFieldsAsUnion<Type> = {
  [key in keyof Type]-?: Record<string, never> extends Pick<Type, key> ? never : key;
}[keyof Type];

export type BaseTriggerSet<Data extends RaidbossData> = {
  // Unique string for this trigger set.
  id: string;
  // ZoneId.MatchAll (aka null) is not supported in array form.
  zoneId: ZoneIdType | number[];
  // useful if the zoneId is an array or zone name is otherwise non-descriptive
  zoneLabel?: LocaleText;
  // trigger set ids to load configs from (this trigger set is loaded implicitly).
  loadConfigs?: string[];
  config?: NamedConfigEntry<Extract<keyof Data['triggerSetConfig'], string>>[];
  // If the timeline exists, but needs significant improvements and a rewrite.
  timelineNeedsFixing?: boolean;
  // If no timeline is possible for this zone, e.g. t3.
  hasNoTimeline?: boolean;
  resetWhenOutOfCombat?: boolean;
  overrideTimelineFile?: boolean;
  timelineFile?: string;
  timeline?: TimelineField;
  triggers?: NetRegexTrigger<Data>[];
  timelineTriggers?: TimelineTrigger<Data>[];
  timelineReplace?: TimelineReplacement[];
  timelineStyles?: TimelineStyle[];
  // Comments to be displayed alongside this trigger set where appropriate
  comments?: LocaleText;
};

// If Data contains required properties that are not on RaidbossData, require initData
export type TriggerSet<Data extends RaidbossData = RaidbossData> =
  & BaseTriggerSet<Data>
  & (RequiredFieldsAsUnion<Data> extends RequiredFieldsAsUnion<RaidbossData> ? {
      initData?: DataInitializeFunc<Data>;
    }
    : {
      initData: DataInitializeFunc<Data>;
    });

// Less strict type for user triggers + built-in triggers, including deprecated fields.
export type LooseTimelineTrigger = Partial<TimelineTrigger<RaidbossData>>;

export type LooseTrigger = Partial<
  & Omit<BaseNetTrigger<RaidbossData, 'None'>, 'netRegex'>
  & PartialRegexTrigger
  & {
    // Built-in cactbot netRegex only supports the `NetParams` variety of specification,
    // but for backwards compatibility, also handle anybody still using `NetRegexes.foo()`.
    netRegex: NetParams['None'] | CactbotBaseRegExp<'None'>;
  }
>;

export type LooseTriggerSet =
  & Omit<Partial<TriggerSet>, 'triggers' | 'timelineTriggers'>
  & {
    /** @deprecated Use zoneId instead */
    zoneRegex?:
      | RegExp
      | { [lang in Lang]?: RegExp };
    triggers?: LooseTrigger[];
    timelineTriggers?: LooseTimelineTrigger[];
    filename?: string;
    isUserTriggerSet?: boolean;
  };

export interface RaidbossFileData {
  [filename: string]: LooseTriggerSet | string;
}
