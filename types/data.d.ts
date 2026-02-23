import { AutumnMoks } from '../resources/autumn';
import { Lang } from '../resources/languages';
import PartyTracker from '../resources/party';
import { ConfigValue } from '../resources/user_config';

import { SystemInfo } from './event';
import { Job, Role } from './job';

export interface BaseOptions {
  ParserLanguage: Lang;
  ShortLocale: Lang;
  DisplayLanguage: Lang;
  TextAlertsEnabled: boolean;
  SoundAlertsEnabled: boolean;
  SpokenAlertsEnabled: boolean;
  GroupSpokenAlertsEnabled: boolean;
  Skin?: string;
  SystemInfo: SystemInfo;
  Debug: boolean;
  AutumnParam?: string;
  AutumnOnly: boolean;
  [key: string]: unknown;
}

export interface RaidbossData {
  job: Job;
  me: string;
  role: Role;
  moks: AutumnMoks;
  party: PartyTracker;
  lang: Lang;
  parserLang: Lang;
  displayLang: Lang;
  currentHP: number;
  options: BaseOptions;
  inCombat: boolean;
  triggerSetConfig: { [key: string]: ConfigValue };
  StopCombat: () => void;
  CanStun: () => boolean;
  CanSilence: () => boolean;
  CanSleep: () => boolean;
  CanCleanse: () => boolean;
  CanFeint: () => boolean;
  CanAddle: () => boolean;
}
