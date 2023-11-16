import { BaseOptions } from './data';
import { Job, Role } from './job';
import { OutputStringsParamObject } from './trigger';

export type BasePartyMemberParamObject = {
  role?: Role;
  job?: Job;
  roleName?: string;
  jobAbbr?: string;
  jobFull?: string;
  id?: string;
  name: string;
  nick: string;
  atIndex: number; // job index
};

export type PartyMemberParamObjectKeys = keyof BasePartyMemberParamObject;

export interface PartyMemberParamObject
  extends OutputStringsParamObject, BasePartyMemberParamObject {
  toString: () => string;
}

// This is a partial interface of both RaidbossOptions and OopsyOptions.
export interface PartyTrackerOptions extends BaseOptions {
  DefaultPlayerLabel: PartyMemberParamObjectKeys;
  PlayerNicks: { [gameName: string]: string };
}
