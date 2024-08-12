import { Party } from '../types/event';
import { Job, Role } from '../types/job';
import { PartyMemberParamObject, PartyTrackerOptions } from '../types/party';
import { LocaleText } from '../types/trigger';

import Autumn from './autumn';
import Util from './util';

const emptyRoleToPartyNames = () => {
  return {
    tank: [],
    healer: [],
    dps: [],
    crafter: [],
    gatherer: [],
    none: [],
  };
};

const roleLocalized: Record<Role, LocaleText> = {
  tank: {
    en: 'tank',
    de: 'Verteidiger',
    fr: 'Tank',
    ja: 'タンク',
    cn: '坦克',
    ko: '탱크',
  },
  healer: {
    en: 'healer',
    de: 'Heiler',
    fr: 'Soigneur',
    ja: 'ヒーラー',
    cn: '治疗',
    ko: '힐러',
  },
  dps: {
    en: 'dps',
    de: 'DPS',
    fr: 'DPS',
    ja: 'DPS',
    cn: '输出',
    ko: 'DPS',
  },
  crafter: {
    en: 'crafter',
    de: 'Handwerker',
    fr: 'Artisan',
    ja: 'クラフター',
    cn: '能工巧匠',
    ko: '크래프터',
  },
  gatherer: {
    en: 'gatherer',
    de: 'Sammler',
    fr: 'Récolteur',
    ja: 'ギャザラー',
    cn: '大地使者',
    ko: '게더러',
  },
  none: {
    en: 'none',
    de: 'Keine',
    fr: 'Aucun',
    ja: '冒険者',
    cn: '冒险者',
    ko: '모험가',
  },
};

const jobLocalizedAbbr: Record<Job, LocaleText> = {
  NONE: {
    en: 'NONE',
    de: 'Keine',
    fr: 'Aucun',
    ja: '冒険者',
    cn: '冒险',
    ko: '모험가',
  },
  GLA: {
    en: 'GLA',
    de: 'GLA',
    fr: 'GLA',
    ja: '剣術士',
    cn: '剑术',
    ko: '검술사',
  },
  PGL: {
    en: 'PGL',
    de: 'FST',
    fr: 'PGL',
    ja: '格闘士',
    cn: '格斗',
    ko: '격투사',
  },
  MRD: {
    en: 'MRD',
    de: 'MAR',
    fr: 'MRD',
    ja: '斧術士',
    cn: '斧术',
    ko: '도끼맨',
  },
  LNC: {
    en: 'LNC',
    de: 'PIK',
    fr: 'HAS',
    ja: '槍術士',
    cn: '枪术',
    ko: '랜서',
  },
  ARC: {
    en: 'ARC',
    de: 'WDL',
    fr: 'ARC',
    ja: '弓術士',
    cn: '弓箭',
    ko: '활쟁이',
  },
  CNJ: {
    en: 'CNJ',
    de: 'DRU',
    fr: 'ÉLM',
    ja: '幻術士',
    cn: '幻术',
    ko: '환술사',
  },
  THM: {
    en: 'THM',
    de: 'THM',
    fr: 'OCC',
    ja: '呪術士',
    cn: '咒术',
    ko: '주술사',
  },
  CRP: {
    en: 'CRP',
    de: 'ZMR',
    fr: 'MEN',
    ja: '木工',
    cn: '刻木',
    ko: '목수',
  },
  BSM: {
    en: 'BSM',
    de: 'GRS',
    fr: 'FRG',
    ja: '鍛冶',
    cn: '锻铁',
    ko: '대장',
  },
  ARM: {
    en: 'ARM',
    de: 'PLA',
    fr: 'ARM',
    ja: '甲冑',
    cn: '铸甲',
    ko: '갑주',
  },
  GSM: {
    en: 'GSM',
    de: 'GLD',
    fr: 'ORF',
    ja: '彫金',
    cn: '雕金',
    ko: '보석',
  },
  LTW: {
    en: 'LTW',
    de: 'GER',
    fr: 'TAN',
    ja: '革細',
    cn: '制革',
    ko: '가죽',
  },
  WVR: {
    en: 'WVR',
    de: 'WEB',
    fr: 'COU',
    ja: '裁縫',
    cn: '裁衣',
    ko: '재봉',
  },
  ALC: {
    en: 'ALC',
    de: 'ALC',
    fr: 'ALC',
    ja: '錬金',
    cn: '炼金',
    ko: '연금',
  },
  CUL: {
    en: 'CUL',
    de: 'GRM',
    fr: 'CUI',
    ja: '調理',
    cn: '烹调',
    ko: '요리',
  },
  MIN: {
    en: 'MIN',
    de: 'MIN',
    fr: 'MIN',
    ja: '採掘',
    cn: '采矿',
    ko: '광부',
  },
  BTN: {
    en: 'BTN',
    de: 'GÄR',
    fr: 'BOT',
    ja: '園芸',
    cn: '园艺',
    ko: '농부',
  },
  FSH: {
    en: 'FSH',
    de: 'FIS',
    fr: 'PEC',
    ja: '漁師',
    cn: '捕鱼',
    ko: '어부',
  },
  PLD: {
    en: 'PLD',
    de: 'PLD',
    fr: 'PLD',
    ja: 'ナイト',
    cn: '骑士',
    ko: '팔라',
  },
  MNK: {
    en: 'MNK',
    de: 'MÖN',
    fr: 'MOI',
    ja: 'モンク',
    cn: '武僧',
    ko: '몽크',
  },
  WAR: {
    en: 'WAR',
    de: 'KRG',
    fr: 'GUE',
    ja: '戦士',
    cn: '战士',
    ko: '전사',
  },
  DRG: {
    en: 'DRG',
    de: 'DRG',
    fr: 'DRG',
    ja: '竜騎士',
    cn: '龙骑',
    ko: '류상',
  },
  BRD: {
    en: 'BRD',
    de: 'BRD',
    fr: 'BRD',
    ja: '詩人',
    cn: '诗人',
    ko: '바드',
  },
  WHM: {
    en: 'WHM',
    de: 'WMA',
    fr: 'MBL',
    ja: '白魔',
    cn: '白魔',
    ko: '뱅마',
  },
  BLM: {
    en: 'BLM',
    de: 'SMA',
    fr: 'MNO',
    ja: '黒魔',
    cn: '黑魔',
    ko: '흥마',
  },
  ACN: {
    en: 'ACN',
    de: 'HRT',
    fr: 'ACN',
    ja: '巴術士',
    cn: '秘术',
    ko: '비술사',
  },
  SMN: {
    en: 'SMN',
    de: 'BSW',
    fr: 'INV',
    ja: '召喚',
    cn: '召唤',
    ko: '서모너',
  },
  SCH: {
    en: 'SCH',
    de: 'GLT',
    fr: 'ERU',
    ja: '学者',
    cn: '学者',
    ko: '학자',
  },
  ROG: {
    en: 'ROG',
    de: 'SCH',
    fr: 'SUR',
    ja: '双剣士',
    cn: '双剑',
    ko: '쌍검사',
  },
  NIN: {
    en: 'NIN',
    de: 'NIN',
    fr: 'NIN',
    ja: '忍者',
    cn: '忍者',
    ko: '닌자',
  },
  MCH: {
    en: 'MCH',
    de: 'MCH',
    fr: 'MCH',
    ja: '機工',
    cn: '机工',
    ko: '기공',
  },
  DRK: {
    en: 'DRK',
    de: 'DKR',
    fr: 'CHN',
    ja: '暗黒',
    cn: '暗骑',
    ko: '암흑',
  },
  AST: {
    en: 'AST',
    de: 'AST',
    fr: 'AST',
    ja: '占星',
    cn: '占星',
    ko: '점쟁이',
  },
  SAM: {
    en: 'SAM',
    de: 'SAM',
    fr: 'SAM',
    ja: '侍',
    cn: '武士',
    ko: '사무',
  },
  RDM: {
    en: 'RDM',
    de: 'RMA',
    fr: 'MRG',
    ja: '赤魔',
    cn: '赤魔',
    ko: '레드메',
  },
  BLU: {
    en: 'BLU',
    de: 'BMA',
    fr: 'MBU',
    ja: '青魔',
    cn: '青魔',
    ko: '블루메',
  },
  GNB: {
    en: 'GNB',
    de: 'REV',
    fr: 'PSB',
    ja: 'ガンブレ',
    cn: '绝枪',
    ko: '총칼',
  },
  DNC: {
    en: 'DNC',
    de: 'TÄN',
    fr: 'DNS',
    ja: '踊り子',
    cn: '舞者',
    ko: '춤꾼',
  },
  RPR: {
    en: 'RPR',
    de: 'SNT',
    fr: 'FCH',
    ja: 'リーパー',
    cn: '钐镰',
    ko: '리퍼',
  },
  SGE: {
    en: 'SGE',
    de: 'WEI',
    fr: 'SAG',
    ja: '賢者',
    cn: '贤者',
    ko: '현자',
  },
  VPR: {
    en: 'VPR',
    de: 'VPR',
    fr: 'VPR',
    ja: 'ヴァイパー',
    ko: '해적',
  },
  PCT: {
    en: 'PCT',
    de: 'PKT',
    fr: 'PIC',
    ja: 'ピクトマンサー',
    ko: '붓쟁이',
  },
};

const jobLocalizedFull: Record<Job, LocaleText> = {
  NONE: {
    en: 'Adventurer',
    de: 'Abenteurer',
    fr: 'Aventurier',
    ja: '冒険者',
    cn: '冒险者',
    ko: '모험가',
  },
  GLA: {
    en: 'Gladiator',
    de: 'Gladiator',
    fr: 'Gladiateur',
    ja: '剣術士',
    cn: '剑术师',
    ko: '검술사',
  },
  PGL: {
    en: 'Pugilist',
    de: 'Faustkämpfer',
    fr: 'Pugiliste',
    ja: '格闘士',
    cn: '格斗家',
    ko: '격투가',
  },
  MRD: {
    en: 'Marauder',
    de: 'Marodeur',
    fr: 'Maraudeur',
    ja: '斧術士',
    cn: '斧术师',
    ko: '도끼술사',
  },
  LNC: {
    en: 'Lancer',
    de: 'Pikenier',
    fr: 'Maître d\'Hast',
    ja: '槍術士',
    cn: '枪术师',
    ko: '창술사',
  },
  ARC: {
    en: 'Archer',
    de: 'Waldläufer',
    fr: 'Archer',
    ja: '弓術士',
    cn: '弓箭手',
    ko: '궁술사',
  },
  CNJ: {
    en: 'Conjurer',
    de: 'Druide',
    fr: 'Élémentaliste',
    ja: '幻術士',
    cn: '幻术师',
    ko: '환술사',
  },
  THM: {
    en: 'Thaumaturge',
    de: 'Thaumaturg',
    fr: 'Occultiste',
    ja: '呪術士',
    cn: '咒术师',
    ko: '주술사',
  },
  CRP: {
    en: 'Carpenter',
    de: 'Zimmerer',
    fr: 'Charpentier',
    ja: '木工師',
    cn: '刻木匠',
    ko: '목수',
  },
  BSM: {
    en: 'Blacksmith',
    de: 'Grobschmied',
    fr: 'Forgeron',
    ja: '鍛冶師',
    cn: '锻铁匠',
    ko: '대장장이',
  },
  ARM: {
    en: 'Armorer',
    de: 'Plattner',
    fr: 'Armurier',
    ja: '甲冑師',
    cn: '铸甲匠',
    ko: '갑주제작사',
  },
  GSM: {
    en: 'Goldsmith',
    de: 'Goldschmied',
    fr: 'Orfèvre',
    ja: '彫金師',
    cn: '雕金匠',
    ko: '보석공예가',
  },
  LTW: {
    en: 'Leatherworker',
    de: 'Gerber',
    fr: 'Tanneur',
    ja: '革細工師',
    cn: '制革匠',
    ko: '가죽공예가',
  },
  WVR: {
    en: 'Weaver',
    de: 'Weber',
    fr: 'Couturier',
    ja: '裁縫師',
    cn: '裁衣匠',
    ko: '재봉사',
  },
  ALC: {
    en: 'Alchemist',
    de: 'Alchemist',
    fr: 'Alchimiste',
    ja: '錬金術師',
    cn: '炼金术士',
    ko: '연금술사',
  },
  CUL: {
    en: 'Culinarian',
    de: 'Gourmet',
    fr: 'Cuisinier',
    ja: '調理師',
    cn: '烹调师',
    ko: '요리사',
  },
  MIN: {
    en: 'Miner',
    de: 'Minenarbeiter',
    fr: 'Mineur',
    ja: '採掘師',
    cn: '采矿工',
    ko: '광부',
  },
  BTN: {
    en: 'Botanist',
    de: 'Gärtner',
    fr: 'Botaniste',
    ja: '園芸師',
    cn: '园艺工',
    ko: '원예가',
  },
  FSH: {
    en: 'Fisher',
    de: 'Fischer',
    fr: 'Pêcheur',
    ja: '漁師',
    cn: '捕鱼人',
    ko: '어부',
  },
  PLD: {
    en: 'Paladin',
    de: 'Paladin',
    fr: 'Paladin',
    ja: 'ナイト',
    cn: '骑士',
    ko: '나이트',
  },
  MNK: {
    en: 'Monk',
    de: 'Mönch',
    fr: 'Moine',
    ja: 'モンク',
    cn: '武僧',
    ko: '몽크',
  },
  WAR: {
    en: 'Warrior',
    de: 'Krieger',
    fr: 'Guerrier',
    ja: '戦士',
    cn: '战士',
    ko: '전사',
  },
  DRG: {
    en: 'Dragoon',
    de: 'Dragoon',
    fr: 'Chevalier dragon',
    ja: '竜騎士',
    cn: '龙骑士',
    ko: '용기사',
  },
  BRD: {
    en: 'Bard',
    de: 'Barde',
    fr: 'Barde',
    ja: '吟遊詩人',
    cn: '吟游诗人',
    ko: '음유시인',
  },
  WHM: {
    en: 'White Mage',
    de: 'Weißmagier',
    fr: 'Mage blanc',
    ja: '白魔道士',
    cn: '白魔法师',
    ko: '백마도사',
  },
  BLM: {
    en: 'Black Mage',
    de: 'Schwarzmagier',
    fr: 'Mage noir',
    ja: '黒魔道士',
    cn: '黑魔法师',
    ko: '흑마도사',
  },
  ACN: {
    en: 'Arcanist',
    de: 'Hermetiker',
    fr: 'Arcaniste',
    ja: '巴術士',
    cn: '秘术师',
    ko: '비슬사',
  },
  SMN: {
    en: 'Summoner',
    de: 'Beschwörer',
    fr: 'Invocateur',
    ja: '召喚士',
    cn: '召唤师',
    ko: '소환사',
  },
  SCH: {
    en: 'Scholar',
    de: 'Gelehrter',
    fr: 'Érudit',
    ja: '学者',
    cn: '学者',
    ko: '학자',
  },
  ROG: {
    en: 'Rogue',
    de: 'Schurke',
    fr: 'Surineur',
    ja: '双剣士',
    cn: '双剑师',
    ko: '쌍검사',
  },
  NIN: {
    en: 'Ninja',
    de: 'Ninja',
    fr: 'Ninja',
    ja: '忍者',
    cn: '忍者',
    ko: '닌자',
  },
  MCH: {
    en: 'Machinist',
    de: 'Maschinist',
    fr: 'Machiniste',
    ja: '機工士',
    cn: '机工士',
    ko: '기공사',
  },
  DRK: {
    en: 'Dark Knight',
    de: 'Dunkelritter',
    fr: 'Chevalier noir',
    ja: '暗黒騎士',
    cn: '暗黑骑士',
    ko: '암흑기사',
  },
  AST: {
    en: 'Astrologian',
    de: 'Astrologe',
    fr: 'Astromancien',
    ja: '占星術師',
    cn: '占星术士',
    ko: '점성술사',
  },
  SAM: {
    en: 'Samurai',
    de: 'Samurai',
    fr: 'Samuraï',
    ja: '侍',
    cn: '武士',
    ko: '사무라이',
  },
  RDM: {
    en: 'Red Mage',
    de: 'Rotmagier',
    fr: 'Mage rouge',
    ja: '赤魔道士',
    cn: '赤魔法师',
    ko: '적마도사',
  },
  BLU: {
    en: 'Blue Mage',
    de: 'Blaumagier',
    fr: 'Mage bleu',
    ja: '青魔道士',
    cn: '青魔法师',
    ko: '청마도사',
  },
  GNB: {
    en: 'Gunbreaker',
    de: 'Revolverklinge',
    fr: 'Pistosabreur',
    ja: 'ガンブレイカー',
    cn: '绝枪战士',
    ko: '건브레이커',
  },
  DNC: {
    en: 'Dancer',
    de: 'Tänzer',
    fr: 'Danseur',
    ja: '踊り子',
    cn: '舞者',
    ko: '무도가',
  },
  RPR: {
    en: 'Reaper',
    de: 'Schnitter',
    fr: 'Faucheur',
    ja: 'リーパー',
    cn: '钐镰客',
    ko: '리퍼',
  },
  SGE: {
    en: 'Sage',
    de: 'Weiser',
    fr: 'Sage',
    ja: '賢者',
    cn: '贤者',
    ko: '현자',
  },
  VPR: {
    en: 'Viper',
    de: 'Viper',
    fr: 'Rôdeur vipère',
    ja: 'ヴァイパー',
    ko: '바이퍼',
  },
  PCT: {
    en: 'Pictomancer',
    de: 'Piktomant',
    fr: 'Pictomancien',
    ja: 'ピクトマンサー',
    ko: '픽토맨서',
  },
};

export default class PartyTracker {
  details: Party[] = [];
  partyNames_: string[] = [];
  partyIds_: string[] = [];
  allianceNames_: string[] = [];
  allianceIds_: string[] = [];
  nameToRole_: { [name: string]: Role } = {};
  idToName_: { [id: string]: string } = {};
  roleToPartyNames_: Record<Role, string[]> = emptyRoleToPartyNames();

  constructor(private options: PartyTrackerOptions) {}

  // Bind this to PartyChanged events.
  onPartyChanged(e: { party: Party[] }): void {
    this.reset();
    this.details = e.party;

    for (const p of e.party) {
      this.allianceIds_.push(p.id);
      this.allianceNames_.push(p.name);
      const jobName = Util.jobEnumToJob(p.job);
      const role = Util.jobToRole(jobName);
      this.idToName_[p.id] = p.name;
      this.nameToRole_[p.name] = role;
      if (p.inParty) {
        this.partyIds_.push(p.id);
        this.partyNames_.push(p.name);
        this.roleToPartyNames_[role].push(p.name);
      }
    }
  }

  reset(): void {
    // original event data
    this.details = [];
    this.partyNames_ = [];
    this.partyIds_ = [];
    this.allianceNames_ = [];
    this.allianceIds_ = [];
    this.nameToRole_ = {};
    this.idToName_ = {};

    // role -> [names] but only for party
    this.roleToPartyNames_ = emptyRoleToPartyNames();
  }

  // returns an array of the names of players in your immediate party
  get partyNames(): readonly string[] {
    return this.partyNames_;
  }

  get partyIds(): readonly string[] {
    return this.partyIds_;
  }

  // returns an array of the names of players in your alliance
  get allianceNames(): readonly string[] {
    return this.allianceNames_;
  }

  // returns an array of the names of tanks in your immediate party
  get tankNames(): readonly string[] {
    return this.roleToPartyNames_['tank'];
  }

  // returns an array of the names of healers in your immediate party
  get healerNames(): readonly string[] {
    return this.roleToPartyNames_['healer'];
  }

  // returns an array of the names of dps players in your immediate party
  get dpsNames(): readonly string[] {
    return this.roleToPartyNames_['dps'];
  }

  // returns true if the named player in your alliance is a particular role
  isRole(name: string, role: string): boolean {
    return this.nameToRole_[name] === role;
  }

  // returns true if the named player in your alliance is a tank
  isTank(name: string): boolean {
    return this.isRole(name, 'tank');
  }

  // returns true if the named player in your alliance is a healer
  isHealer(name: string): boolean {
    return this.isRole(name, 'healer');
  }

  // returns true if the named player in your alliance is a dps
  isDPS(name: string): boolean {
    return this.isRole(name, 'dps');
  }

  // returns true if the named player is in your immediate party
  inParty(name: string): boolean {
    return this.partyNames.includes(name);
  }

  // returns true if the named player is in your alliance
  inAlliance(name: string): boolean {
    return this.allianceNames.includes(name);
  }

  // for a named player, returns the other tank in your immediate party
  // if named player is not a tank, or there's not exactly two tanks
  // in your immediate party, returns null.
  otherTank(name: string): string | undefined {
    const names = this.tankNames;
    if (names.length !== 2)
      return;
    if (names[0] === name)
      return names[1];
    if (names[1] === name)
      return names[0];
  }

  // see: otherTank, but for healers.
  otherHealer(name: string): string | undefined {
    const names = this.healerNames;
    if (names.length !== 2)
      return;
    if (names[0] === name)
      return names[1];
    if (names[1] === name)
      return names[0];
  }

  // returns the job name of the specified party member
  jobName(name: string): Job | undefined {
    const partyIndex = this.partyNames.indexOf(name);
    if (partyIndex < 0)
      return;
    const job = this.details[partyIndex]?.job;
    if (job === undefined)
      return;
    return Util.jobEnumToJob(job);
  }

  nameFromId(id: string): string | undefined {
    return this.idToName_[id];
  }

  member(name?: string): PartyMemberParamObject {
    // For boilerplate convenience in triggers, handle undefined names.
    if (name === undefined) {
      const unknown = '???';
      return {
        name: unknown,
        nick: unknown,
        jobIndex: 0,
        toString: () => unknown,
      };
    }

    const partyMember = this.details.find((member) => member.name === name);
    let ret: PartyMemberParamObject;
    const nick = Util.shortName(name, this.options.PlayerNicks);

    if (!partyMember) {
      // If we can't find this party member for some reason, use some sort of default.
      ret = {
        name: name,
        nick: nick,
        jobIndex: 0,
      };
    } else {
      const lang = this.options.DisplayLanguage;
      const job = Util.jobEnumToJob(partyMember.job);
      const jobAbbr = jobLocalizedAbbr[job]?.[lang] ?? job;
      const jobFull = jobLocalizedFull[job]?.[lang] ?? job;
      const role = Util.jobToRole(job);
      const roleName = roleLocalized[role]?.[lang] ?? role;
      ret = {
        id: partyMember.id,
        jobAbbr: jobAbbr,
        jobFull: jobFull,
        roleName: roleName,
        name: name,
        nick: nick,
        role: role,
        job: job,
        jobIndex: partyMember.job,
      };
    }

    // Need to assign this afterwards so it can reference `ret`.
    ret.toString = () => {
      const retVal = ret[this.options.DefaultPlayerLabel];
      if (typeof retVal === 'string')
        return retVal;
      if (typeof retVal === 'number')
        return retVal.toString();
      return ret.jobAbbr ?? ret.nick;
    };

    return ret;
  }

  // 어듬이 잡 인덱스
  jobIndex(name: string): number {
    const partyMember = this.details.find((member) => member.name === name);
    if (partyMember === undefined)
      return 0;
    return partyMember.job;
  }

  // 어듬이 잡 이름 약자
  jobAbbr(name?: string): string | undefined {
    if (name === undefined)
      return;
    const partyMember = this.details.find((member) => member.name === name);
    if (partyMember === undefined)
      return;
    const job = Util.jobEnumToJob(partyMember.job);
    return jobLocalizedAbbr[job]?.[this.options.DisplayLanguage];
  }

  // 어듬이 잡 이름 전체
  jobFull(name?: string): string | undefined {
    if (name === undefined)
      return;
    const partyMember = this.details.find((member) => member.name === name);
    if (partyMember === undefined)
      return;
    const job = Util.jobEnumToJob(partyMember.job);
    return jobLocalizedFull[job]?.[this.options.DisplayLanguage];
  }

  // 멤버 목록을 만들어 준다
  members(names: readonly string[]): PartyMemberParamObject[] {
    const mm = names.map((x) => this.member(x));
    return mm;
  }

  // 멤버 목록을 문자열로 만들어 준다
  memberList(names: readonly string[]): string[] {
    const label = this.options.DefaultPlayerLabel;
    const ls = names.map((x) => {
      const m = this.member(x);
      const v = m[label];
      return typeof v === 'string' ? v : typeof v === 'number' ? v.toString() : m.nick;
    });
    return ls;
  }

  // 어듬이 형식으로 우선 순위 배열을 만들어 준다
  priorityList(names: readonly string[]): string[] {
    const ls: string[] = [];
    const ids: number[] = [];
    for (const n of names) {
      const index = this.partyNames.indexOf(n);
      if (index < 0) {
        const m = this.member(n);
        ls.push(m.toString());
      } else {
        const m = this.details[index];
        if (m !== undefined)
          ids.push(m.job);
      }
    }
    const sorted = Autumn.jobPriorityList(ids, this.options.DisplayLanguage);
    for (const i of sorted)
      ls.push(i);
    return ls;
  }
}
