import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { Output, TriggerSet } from '../../../../../types/trigger';

// TODO: tankbuster calls
// TODO: call out where Arcane Revelation+Arche light/dark portals are
// TODO: if party standing on Dark Orbs during Arcane Revelation+Unlucky Lot, say rotate or stay?
// TODO: call out where Letter of the Law safe spots are (e.g. N lean E / S lean W)

export interface Data extends RaidbossData {
  prsDike?: number;
  prsLightAndDarks?: 'none' | 'lightnear' | 'lightfar' | 'darknear' | 'darkfar';
  prsTethers?: number;
  //
  decOffset?: number;
  phase?: 'messengers' | 'darkLight' | 'letter';
  upheldTethers: NetMatches['Tether'][];
  divisiveColor?: 'dark' | 'light';
  lightDarkDebuff: { [name: string]: 'light' | 'dark' };
  lightDarkBuddy: { [name: string]: string };
  lightDarkTether: { [name: string]: 'near' | 'far' };
  cylinderCollect: NetMatches['HeadMarker'][];
  styxCount: number;
}

const headmarkers = {
  // vfx/lockon/eff/tank_lockon04_7sk1.avfx
  dike: '01DB', // tankbuster
  // vfx/lockon/eff/com_share4a1.avfx
  styx: '0131', // multi-hit stack, currently unused
  // vfx/lockon/eff/m0515_turning_right01c.avfx
  orangeCW: '009C', // orange clockwise rotation
  // vfx/lockon/eff/m0515_turning_left01c.avfx
  blueCCW: '009D', // blue counterclockwise rotation
} as const;

const firstHeadmarker = parseInt(headmarkers.dike, 16);

const getHeadmarkerId = (data: Data, matches: NetMatches['HeadMarker']) => {
  if (data.decOffset === undefined)
    data.decOffset = parseInt(matches.id, 16) - firstHeadmarker;
  return (parseInt(matches.id, 16) - data.decOffset).toString(16).toUpperCase().padStart(4, '0');
};

export const prsJuryOverrulingStrings = {
  proteinpair: {
    en: 'Protean (Partner)',
    ja: '散会 (ペア)',
    ko: '프로틴 (페어)',
  },
  proteinshare: {
    en: 'Protean (4:4 Healer Groups)',
    ja: '散会 (4:4ヒラと頭割り)',
    ko: '프로틴 (4:4 뭉쳐요)',
  },
  proteinlightfar: {
    en: 'Protean: Wait',
    ja: '散会: そのまま',
    ko: '프로틴: 그자리 그대로',
  },
  proteinlightnear: {
    en: 'Protean: 🡼90 degree',
    ja: '散会: 🡼90度',
    ko: '프로틴: 🡼90도',
  },
  proteindarkfar: {
    en: 'Protean: 🡸45 degree',
    ja: '散会: 🡸45度',
    ko: '프로틴: 🡸45도',
  },
  proteindarknear: {
    en: 'Protean: 🡼🡹90+45 degree',
    ja: '散会: 🡼🡹90+45度',
    ko: '프로틴: 🡼🡹90+45도',
  },
  proteinunknown: {
    en: 'Protean (${unk})',
    ja: '散会 (${unk})',
    ko: '프로틴 (${unk})',
  },
  unknown: Outputs.unknown,
};
export const prsJuryPrepare = (data: Data, output: Output, pair: boolean) => {
  const mesg = data.prsLightAndDarks
    ? {
      lightfar: output.proteinlightfar!(),
      lightnear: output.proteinlightnear!(),
      darkfar: output.proteindarkfar!(),
      darknear: output.proteindarknear!(),
      none: output.proteinunknown!({ unk: output.unknown!() }),
    }[data.prsLightAndDarks]
    : pair
    ? output.proteinpair!()
    : output.proteinshare!();
  return mesg;
};

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheEleventhCircleSavage',
  zoneId: ZoneId.AnabaseiosTheEleventhCircleSavage,
  timelineFile: 'p11s.txt',
  initData: () => {
    return {
      upheldTethers: [],
      lightDarkDebuff: {},
      lightDarkBuddy: {},
      lightDarkTether: {},
      cylinderCollect: [],
      styxCount: 4,
    };
  },
  triggers: [
    {
      id: 'P11S Headmarker Tracker',
      type: 'HeadMarker',
      netRegex: {},
      condition: (data) => data.decOffset === undefined,
      suppressSeconds: 99999,
      // Unconditionally set the first headmarker here so that future triggers are conditional.
      run: (data, matches) => getHeadmarkerId(data, matches),
    },
    {
      id: 'P11S Phase Tracker',
      type: 'StartsUsing',
      netRegex: { id: ['8219', '81FE', '87D2'], source: 'Themis' },
      run: (data, matches) => {
        data.upheldTethers = [];
        const phaseMap: { [id: string]: Data['phase'] } = {
          '8219': 'messengers',
          '81FE': 'darkLight',
          '87D2': 'letter',
        } as const;
        data.phase = phaseMap[matches.id];
      },
    },
    {
      id: 'P11S Upheld Tether Collector',
      type: 'Tether',
      netRegex: { id: '00F9' },
      run: (data, matches) => data.upheldTethers.push(matches),
    },
    {
      id: 'P11S Eunomia',
      type: 'StartsUsing',
      netRegex: { id: '822B', source: 'Themis', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'P11S Dike',
      type: 'StartsUsing',
      netRegex: { id: ['822D', '822F', '8230'], source: 'Themis' },
      condition: (data, matches) => data.me === matches.target,
      suppressSeconds: 3,
      alertText: (data, _matches, output) => {
        data.prsDike = (data.prsDike ?? 0) + 1;
        return output.text!({ num: data.prsDike });
      },
      outputStrings: {
        text: {
          en: 'Dike Buster: ${num}',
          ko: '${num}번째 디케 버스터!',
        },
      },
    },
    {
      id: 'P11S Jury Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '81E6', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (data, _matches, output) => prsJuryPrepare(data, output, false),
      outputStrings: prsJuryOverrulingStrings,
    },
    {
      id: 'P11S Jury Overruling Light Followup',
      type: 'Ability',
      netRegex: { id: '81E8', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.prsLightAndDarks && data.prsLightAndDarks !== 'none')
          return output.lightLr!();
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Healer Stacks',
          de: 'Heiler Gruppen',
          fr: 'Groupes sur les heals',
          ja: '4:4あたまわり',
          cn: '治疗分摊',
          ko: '(안쪽에서) 4:4 뭉쳐요',
        },
        lightLr: {
          en: 'Healer Stacks',
          ko: '(왼쪽 마커) 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Jury Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '81E7', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (data, _matches, output) => prsJuryPrepare(data, output, true),
      outputStrings: prsJuryOverrulingStrings,
    },
    {
      id: 'P11S Jury Overruling Dark Followup',
      type: 'Ability',
      netRegex: { id: '81E9', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        const mesg = data.prsLightAndDarks
          ? {
            lightfar: output.pairlightfar!(),
            lightnear: output.pairlightnear!(),
            darkfar: output.pairdarkfar!(),
            darknear: output.pairdarknear!(),
            none: output.unknown!(),
          }[data.prsLightAndDarks]
          : output.text!();
        return mesg;
      },
      outputStrings: {
        text: {
          en: 'Partners',
          de: 'Partner',
          fr: 'Partenaires',
          ja: 'ぺあ',
          cn: '两人分摊',
          ko: '(마커에서) 페어',
        },
        pairlightfar: {
          en: 'Pair: Clockwise',
          ko: '페어: 왼쪽 돌아 🟪로',
        },
        pairlightnear: {
          en: 'Pair: Go out',
          ko: '페어: 밖으로 나가요',
        },
        pairdarkfar: {
          en: 'Pair: Stop',
          ko: '페어: 그대로 멈추쇼',
        },
        pairdarknear: {
          en: 'Pair: Go Out',
          ko: '페어: 밖으로 나가요',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P11S Upheld Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '87D3', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.upheldTethers = [],
      outputStrings: {
        text: {
          en: 'Party In => Out + Healer Stacks',
          de: 'Party Rein => Raus + Heiler Gruppen',
          fr: 'Intérieur => Extérieur + package sur les heals',
          ja: '内側から => 外側へ + 4:4あたまわり',
          cn: '场中集合 => 场边 + 治疗分摊',
          ko: '한가운데서 뭉쳤다 🔜 밖으로 + 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Upheld Overruling Light Followup',
      type: 'Ability',
      netRegex: { id: '81F2', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Out + Healer Stacks',
          de: 'Raus + Heiler Gruppen',
          fr: 'Extérieur + Package sur les heals',
          ja: '外側で + 4:4あたまわり',
          cn: '场外 + 治疗分摊',
          ko: '밖으로 + 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Upheld Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '87D4', source: 'Themis', capture: false },
      durationSeconds: 6,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          upheldOnYou: {
            en: 'You In (party out) => In + Partners',
            de: 'Du rein (Gruppe raus) => Rein + Partner',
            fr: 'Vous à l\'intérieur (groupe à l\'extérieur) => Intérieur + Partenaires',
            ja: '真ん中で誘導 => 内側で + ペア',
            cn: '引导月环 => 场中 + 两人分摊',
            ko: '한가운데서 줄 유도 🔜 안에서 + 페어',
          },
          upheldNotOnYou: {
            en: 'Party Out => In + Partners',
            de: 'Party Raus => Rein + Partner',
            fr: 'Groupe à l\'extérieur => Intérieur + Partenaires',
            ja: '外側へ => 内側で + ペア',
            cn: '场外 => 场中 + 两人分摊',
            ko: '밖으로 나가있다 🔜 안으로 + 페어',
          },
        };

        const [tether] = data.upheldTethers;
        if (tether === undefined || data.upheldTethers.length !== 1)
          return { alertText: output.upheldNotOnYou!() };

        if (tether.target === data.me)
          return { alarmText: output.upheldOnYou!() };

        return { alertText: output.upheldNotOnYou!() };
      },
      run: (data) => data.upheldTethers = [],
    },
    {
      id: 'P11S Upheld Overruling Dark Followup',
      type: 'Ability',
      netRegex: { id: '81F3', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Partners',
          de: 'Rein + Partner',
          fr: 'Intérieur + Partenaires',
          ja: '内側で + ペア',
          cn: '场中 + 两人分摊',
          ko: '안으로 + 페어',
        },
      },
    },
    {
      id: 'P11S Upheld Ruling Tether',
      type: 'StartsUsing',
      // Two adds tether players; the light add casts 87D0, the dark casts 87D1.
      // There's also a WeaponId 27/28 change too, but we don't need it.
      netRegex: { id: '87D1' },
      // Wait until after the Inevitable Law/Sentence during messengers.
      delaySeconds: (data) => data.phase === 'messengers' ? 5.7 : 0,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          tankTether: {
            en: 'Away from Party',
            de: 'Weg von der Gruppe',
            fr: 'Éloignez-vous du groupe',
            ja: 'みんなと離れる',
            cn: '远离放月环',
            ko: '줄 유도해요!',
          },
          partyStackPlayerOut: {
            en: 'Party Stack (${player} out)',
            de: 'Mit der Gruppe sammeln (${player} raus)',
            fr: 'Package en groupe (${player} à l\'extérieur)',
            ja: 'あたまわり (${player}が外側)',
            cn: '集合 (${player} 放月环)',
            ko: '모두 뭉쳐요 (줄 처리: ${player})',
          },
          // If we're not sure who the tether is on.
          partyStack: {
            en: 'Party Stack',
            de: 'In der Gruppe sammeln',
            fr: 'Package en groupe',
            ja: 'あたまわり',
            cn: '分摊',
            ko: '모두 뭉쳐요',
          },
          // 샤도우
          tankShadow: {
            en: 'Tether on YOU! Bait Ⓐ!',
            ko: '내게 줄! Ⓐ로 유도!',
          },
          partyShadow: {
            en: 'Stack in middle => Go to Ⓐ',
            ko: '한가운데서 뭉쳤다 🔜 탱크 쿵Ⓐ 안으로',
          },
          // 하트오브저지
          tankHeart: {
            en: 'Tether on YOU! Middle => Tower',
            ko: '내게 줄! 한가운데 🔜 내 타워로',
          },
          partyHeart: {
            en: 'Stack!',
            ko: '모두 뭉쳐 푹찍쾅',
          },
        };

        data.prsTethers = (data.prsTethers ?? 0) + 1;

        const sourceId = matches.sourceId;
        const [tether] = data.upheldTethers.filter((x) => x.sourceId === sourceId);
        if (tether === undefined || data.upheldTethers.length !== 2)
          return { alertText: output.partyStack!() };

        if (tether.target === data.me) {
          if (data.prsTethers === 1)
            return { alarmText: output.tankShadow!() };
          if (data.prsTethers === 2)
            return { alarmText: output.tankHeart!() };
          return { alarmText: output.tankTether!() };
        }

        if (data.prsTethers === 1)
          return { alertText: output.partyShadow!() };
        if (data.prsTethers === 2)
          return { alertText: output.partyHeart!() };
        return {
          alertText: output.partyStackPlayerOut!({ player: data.party.member(tether.target) }),
        };
      },
      run: (data) => data.upheldTethers = [],
    },
    {
      id: 'P11S Upheld Ruling Dark Followup',
      type: 'Ability',
      netRegex: { id: '8221', capture: false },
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.prsTethers === 1)
          return output.shadow!();
        if (data.prsTethers === 2)
          return output.heart!();
        return output.text!();
      },
      outputStrings: {
        text: {
          en: 'Get in Donut',
          de: 'Geh in den Donut',
          fr: 'Intérieur du donut',
          ja: 'ドーナツの内側へ',
          cn: '进入月环',
          ko: '안으로 드루와',
        },
        shadow: {
          en: 'Go to Ⓐ',
          ko: '탱크 쿵Ⓐ 안으로',
        },
        heart: {
          en: 'Stack in middle',
          ko: '한가운데서 모이고',
        },
      },
    },
    {
      id: 'P11S Dark Perimeter Followup',
      type: 'Ability',
      netRegex: { id: '8225', capture: false },
      condition: (data) => data.phase === 'letter',
      suppressSeconds: 5,
      response: Responses.getTowers('alert'),
    },
    {
      id: 'P11S Divisive Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '81EC', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.divisiveColor = 'light',
      outputStrings: {
        text: {
          en: 'Sides => Healer Stacks + Out',
          de: 'Seiten => Heiler Gruppen + Raus',
          fr: 'Côtés => Extérieur + Package sur les heals',
          ja: '横 => 外側で + 4:4あたまわり',
          cn: '两侧 => 治疗分摊 + 场外',
          ko: '옆으로 🔜 그대로 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Divisive Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '81ED', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      run: (data) => data.divisiveColor = 'dark',
      outputStrings: {
        text: {
          en: 'Sides => In + Partners',
          de: 'Seiten => Rein + Partner',
          fr: 'Côtés => Intérieur + Partenaires',
          ja: '横 => 内側で + ペア',
          cn: '两侧 => 两人分摊 + 场内',
          ko: '옆에 있다 🔜 안으로 + 페어',
        },
      },
    },
    {
      id: 'P11S Divisive Overruling Dark Followup',
      type: 'Ability',
      netRegex: { id: '81EE', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (data, _matches, output) => {
        if (data.divisiveColor === 'dark')
          return output.dark!();
        if (data.divisiveColor === 'light')
          return output.light!();
      },
      run: (data) => delete data.divisiveColor,
      outputStrings: {
        light: {
          en: 'Healer Stacks + Out',
          de: 'Heiler Gruppen + Raus',
          fr: 'Package sur les heals + Extérieur',
          ja: '4:4あたまわり + 外側へ',
          cn: '治疗分摊 + 场外',
          ko: '그대로 + 4:4 뭉쳐요',
        },
        dark: {
          en: 'In + Partners',
          de: 'Rein + Partner',
          fr: 'Intérieur + Partenaires',
          ja: '内側へ + ペア',
          cn: '场中 + 两人分摊',
          ko: '안으로 + 페어',
        },
      },
    },
    {
      id: 'P11S Divisive Overruling Light Shadowed Messengers',
      type: 'StartsUsing',
      netRegex: { id: '87B3', source: 'Themis', capture: false },
      durationSeconds: 11,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Healer Stacks + Out',
          de: 'Heiler Gruppen + Raus',
          fr: 'Extérieur + Package sur les heals',
          ja: '4:4あたまわり + 外側へ',
          cn: '治疗分摊 + 场外',
          ko: '밖으로 + 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Divisive Overruling Dark Shadowed Messengers',
      type: 'StartsUsing',
      netRegex: { id: '87B4', source: 'Themis', capture: false },
      durationSeconds: 11,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Partners + In',
          de: 'Partner + Rein',
          fr: 'Partenaires + Intérieur',
          ja: 'ペア + 内側へ',
          cn: '两人分摊 + 场内',
          ko: '안에서 + 페어',
        },
      },
    },
    {
      id: 'P11S Dismissal Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '8784', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback => Healer Stacks + Out',
          de: 'Rückstoß => Heiler Gruppen + Raus',
          fr: 'Poussée => Extérieur + Package sur les heals',
          ja: 'ノックバック => 外側で + 4:4あたまわり',
          cn: '击退 => 治疗分摊 + 场外',
          ko: '넉백 먼저 🔜 밖에서 + 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Dismissal Overruling Light Followup',
      type: 'Ability',
      netRegex: { id: '8784', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Healer Stacks + Out',
          de: 'Heiler Gruppen + Raus',
          fr: 'Package sur les heals + Extérieur',
          ja: '4:4あたまわり + 外側へ',
          cn: '治疗分摊 + 场外',
          ko: '밖에서 + 4:4 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Dismissal Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '8785', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Knockback => In + Partners',
          de: 'Rückstoß => Rein + Partner',
          fr: 'Poussée => Intérieur + Partenaires',
          ja: 'ノックバック => 内側で + ペア',
          cn: '击退 => 两人分摊 + 场内',
          ko: '넉백 먼저 🔜 안으로 + 페어',
        },
      },
    },
    {
      id: 'P11S Dismissal Overruling Dark Followup',
      type: 'Ability',
      netRegex: { id: '8785', capture: false },
      durationSeconds: 4,
      suppressSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'In + Partners',
          de: 'Rein + Partner',
          fr: 'Intérieur + Partenaires',
          ja: '内側で + ペア',
          cn: '场中 + 两人分摊',
          ko: '안으로 + 페어',
        },
      },
    },
    {
      id: 'P11S Arcane Revelation Light Portals',
      type: 'StartsUsing',
      netRegex: { id: '820D', source: 'Themis', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to Dark Portals',
          de: 'Geh zu einem Dunkel-Portal',
          fr: 'Allez vers les portails sombres',
          ja: 'やみの方へ',
          cn: '去暗门前',
          ko: '옆으로 🔜 🟪포탈 안전',
        },
      },
    },
    {
      id: 'P11S Arcane Revelation Dark Portals',
      type: 'StartsUsing',
      netRegex: { id: '820E', source: 'Themis', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to Light Portals',
          de: 'Geh zu einem Licht-Portal',
          fr: 'Allez sur les portails de lumière',
          ja: 'ひかりの方へ',
          cn: '去光门前',
          ko: '옆으로 🔜 🟨포탈 안전',
        },
      },
    },
    {
      id: 'P11S Arcane Revelation Light Orbs',
      type: 'StartsUsing',
      netRegex: { id: '820F', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Rotate to Dark Orbs',
          de: 'Rotiere zu den dunklen Orbs',
          fr: 'Tournez vers les orbes sombres',
          ja: 'やみの玉の方へ',
          cn: '暗球侧安全',
          ko: '🟣구슬 쪽으로',
        },
      },
    },
    {
      id: 'P11S Arcane Revelation Dark Orbs',
      type: 'StartsUsing',
      netRegex: { id: '8210', source: 'Themis', capture: false },
      durationSeconds: 6,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Rotate to Light Orbs',
          de: 'Rotiere zu den licht Orbs',
          fr: 'Tournez vers les orbes de lumière',
          ja: 'ひかりの玉の方へ',
          cn: '光球侧安全',
          ko: '🟡구슬 쪽으로',
        },
      },
    },
    {
      id: 'P11S Dark and Light Buff Collect',
      type: 'GainsEffect',
      // DE1 = Light's Accord
      // DE2 = Dark's Accord
      // DE3 = Light's Discord
      // DE4 = Dark's Discord
      netRegex: { effectId: ['DE1', 'DE2', 'DE3', 'DE4'] },
      run: (data, matches) => {
        const isLight = matches.effectId === 'DE1' || matches.effectId === 'DE3';
        data.lightDarkDebuff[matches.target] = isLight ? 'light' : 'dark';
      },
    },
    {
      id: 'P11S Dark and Light Tether Collect',
      type: 'Tether',
      // 00EC = light far tether (correct)
      // 00ED = light far tether (too close)
      // 00EE = dark far tether (correct)
      // 00EF = dark far tether (too close)
      // 00F0 = near tether (correct)
      // 00F1 = near tether (too far)
      netRegex: { id: ['00EC', '00ED', '00EE', '00EF', '00F0', '00F1'] },
      run: (data, matches) => {
        const isNear = matches.id === '00F0' || matches.id === '00F1';
        const nearFarStr = isNear ? 'near' : 'far';
        data.lightDarkTether[matches.source] = data.lightDarkTether[matches.target] = nearFarStr;

        data.lightDarkBuddy[matches.source] = matches.target;
        data.lightDarkBuddy[matches.target] = matches.source;
      },
    },
    {
      id: 'P11S Dark and Light Tether Callout',
      type: 'Tether',
      netRegex: { id: ['00EC', '00ED', '00EE', '00EF', '00F0', '00F1'], capture: false },
      delaySeconds: 0.5,
      durationSeconds: 9,
      suppressSeconds: 9999,
      response: (data, _matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          lightNear: {
            en: 'Light Near w/${player} (${role})',
            de: 'Licht Nahe w/${player} (${role})',
            fr: 'Lumière proche avec ${player} (${role})',
            ja: 'ひかりニア => ${player} (${role})',
            cn: '光靠近 => ${player} (${role})',
            ko: '🟡니어: ${player} (${role})',
          },
          lightFar: {
            en: 'Light Far w/${player} (${role})',
            de: 'Licht Entfernt w/${player} (${role})',
            fr: 'Lumière éloignée avec ${player} (${role})',
            ja: 'ひかりファー => ${player} (${role})',
            cn: '光远离 => ${player} (${role})',
            ko: '🟡파: ${player} (${role})',
          },
          darkNear: {
            en: 'Dark Near w/${player} (${role})',
            de: 'Dunkel Nahe w/${player} (${role})',
            fr: 'Sombre proche avec ${player} (${role})',
            ja: 'やみニア => ${player} (${role})',
            cn: '暗靠近 => ${player} (${role})',
            ko: '🟣니어: ${player} (${role})',
          },
          darkFar: {
            en: 'Dark Far w/${player} (${role})',
            de: 'Dunkel Entfernt w/${player} (${role})',
            fr: 'Sombre éloigné avec ${player} (${role})',
            ja: 'やみファー => ${player} (${role})',
            cn: '暗远离 => ${player} (${role})',
            ko: '🟣파: ${player} (${role})',
          },
          otherNear: {
            en: 'Other Near: ${player1}, ${player2}',
            de: 'Anderes Nahe: ${player1}, ${player2}',
            fr: 'Autre proche : ${player1}, ${player2}',
            ja: '他のペア: ${player1}, ${player2}',
            cn: '另一组靠近：${player1}, ${player2}',
            ko: '다른팀 니어: ${player1}, ${player2}',
          },
          otherFar: {
            en: 'Other Far: ${player1}, ${player2}',
            de: 'Anderes Entfernt: ${player1}, ${player2}',
            fr: 'Autre éloigné : ${player1}, ${player2}',
            ja: '他のペア: ${player1}, ${player2}',
            cn: '另一组远离：${player1}, ${player2}',
            ko: '다른팀 파: ${player1}, ${player2}',
          },
          lnSide: {
            en: '🟡Near: ${side} (${player})',
            ko: '🟡니어: ${side} (${player})',
          },
          lfSide: {
            en: '🟡Far: ${side} (${player})',
            ko: '🟡파: ${side} (${player})',
          },
          dnSide: {
            en: '🟣Near: ${side} (${player})',
            ko: '🟣니어: ${side} (${player})',
          },
          dfSide: {
            en: '🟣Far: ${side} (${player})',
            ko: '🟣파: ${side} (${player})',
          },
          leftSide: {
            en: 'Ⓑ🡺',
            ko: 'Ⓑ🡺',
          },
          rightSide: {
            en: '🡸Ⓓ',
            ko: '🡸Ⓓ',
          },
          tank: Outputs.tank,
          healer: Outputs.healer,
          dps: Outputs.dps,
          unknown: Outputs.unknown,
        };

        const myColor = data.lightDarkDebuff[data.me];
        const myBuddy = data.lightDarkBuddy[data.me];
        const myLength = data.lightDarkTether[data.me];

        if (myColor === undefined || myBuddy === undefined || myLength === undefined) {
          // Heuristic for "is this a synthetic execution".
          // TODO: maybe we need a field on data for this?
          if (Object.keys(data.lightDarkDebuff).length === 0)
            return;
          console.log(`Dark and Light: missing data for ${data.me}`);
          console.log(`Dark and Light: lightDarkDebuff: ${JSON.stringify(data.lightDarkDebuff)}`);
          console.log(`Dark and Light: lightDarkBuddy: ${JSON.stringify(data.lightDarkBuddy)}`);
          console.log(`Dark and Light: lightDarkTether: ${JSON.stringify(data.lightDarkTether)}`);
          return;
        }

        let myBuddyRole;
        if (data.party.isDPS(myBuddy))
          myBuddyRole = output.dps!();
        else if (data.party.isTank(myBuddy))
          myBuddyRole = output.tank!();
        else if (data.party.isHealer(myBuddy))
          myBuddyRole = output.healer!();
        else
          myBuddyRole = output.unknown!();

        if (myColor === 'light')
          data.prsLightAndDarks = myLength === 'near' ? 'lightnear' : 'lightfar';
        else
          data.prsLightAndDarks = myLength === 'near' ? 'darknear' : 'darkfar';

        const myBuddyShort = data.party.member(myBuddy);

        let alertText: string;
        if (myLength === 'near') {
          if (myColor === 'light')
            alertText = output.lightNear!({ player: myBuddyShort, role: myBuddyRole });
          else
            alertText = output.darkNear!({ player: myBuddyShort, role: myBuddyRole });
        } else {
          if (myColor === 'light')
            alertText = output.lightFar!({ player: myBuddyShort, role: myBuddyRole });
          else
            alertText = output.darkFar!({ player: myBuddyShort, role: myBuddyRole });
        }

        const myPartner = data.party.member(myBuddy);
        let mySide;
        if (data.role === 'dps')
          mySide = myColor === 'dark' ? output.rightSide!() : output.leftSide!();
        else
          mySide = myColor === 'dark' ? output.leftSide!() : output.rightSide!();
        if (myLength === 'near') {
          if (myColor === 'light')
            alertText = output.lnSide!({ player: myPartner, side: mySide });
          else
            alertText = output.dnSide!({ player: myPartner, side: mySide });
        } else {
          if (myColor === 'light')
            alertText = output.lfSide!({ player: myPartner, side: mySide });
          else
            alertText = output.dfSide!({ player: myPartner, side: mySide });
        }

        let infoText: string | undefined = undefined;

        const playerNames = Object.keys(data.lightDarkTether);
        const sameLength = playerNames.filter((x) => data.lightDarkTether[x] === myLength);
        const others = sameLength.filter((x) => x !== data.me && x !== myBuddy).sort();
        const [player1, player2] = others.map((x) => data.party.member(x));
        if (player1 !== undefined && player2 !== undefined) {
          if (myLength === 'near')
            infoText = output.otherNear!({ player1: player1, player2: player2 });
          else
            infoText = output.otherFar!({ player1: player1, player2: player2 });
        }
        return { alertText: alertText, infoText: infoText };
      },
    },
    {
      id: 'P11S Twofold Revelation Light',
      type: 'StartsUsing',
      netRegex: { id: '8211', source: 'Themis', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to Dark Orb + Dark Portals',
          de: 'Geh zum dunklen Orb + dunkle Portale',
          fr: 'Allez vers l\'orbe sombre + Portail sombre',
          ja: 'やみ玉 + ポータル',
          cn: '去暗球 + 暗门',
          ko: '안전: 🟣🟪',
        },
      },
    },
    {
      id: 'P11S Twofold Revelation Dark',
      type: 'StartsUsing',
      netRegex: { id: '8212', source: 'Themis', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Go to Light Orb + Light Portals',
          de: 'Geh zum hellen Orb + helle Portale',
          fr: 'Allez vers l\'orbe de lumière + Portail de lumière',
          ja: 'ひかり玉 ＋ ポータル',
          cn: '去光球 + 光门',
          ko: '안전: 🟡🟨',
        },
      },
    },
    {
      id: 'P11S Lightstream Collect',
      type: 'HeadMarker',
      netRegex: { target: 'Arcane Cylinder' },
      condition: (data, matches) => {
        const id = getHeadmarkerId(data, matches);
        if (id !== headmarkers.orangeCW && id !== headmarkers.blueCCW)
          return false;
        data.cylinderCollect.push(matches);
        return data.cylinderCollect.length === 3;
      },
      alertText: (data, _matches, output) => {
        let cylinderValue = 0;

        // targetId is in hex, but that's still lexicographically sorted so no need to parseInt.
        const sortedCylinders = data.cylinderCollect.sort((a, b) => {
          return a.targetId.localeCompare(b.targetId);
        });
        const markers = sortedCylinders.map((m) => getHeadmarkerId(data, m));

        // Once sorted by id, the lasers will always be in NW, S, NE order.
        // Create a 3 digit binary value, Orange = 0, Blue = 1.
        // e.g. BBO = 110 = 6
        for (const marker of markers) {
          cylinderValue *= 2;
          if (marker === headmarkers.blueCCW)
            cylinderValue += 1;
        }

        // The safe spot is the one just CW of two reds or just CCW of two blues.
        // There's always two of one color and one of the other.
        const outputs: { [cylinderValue: number]: string | undefined } = {
          0b000: undefined,
          0b001: output.northwest!(),
          0b010: output.east!(),
          0b011: output.northeast!(),
          0b100: output.southwest!(),
          0b101: output.west!(),
          0b110: output.southeast!(),
          0b111: undefined,
        };
        return outputs[cylinderValue];
      },
      run: (data) => data.cylinderCollect = [],
      outputStrings: {
        east: {
          en: 'Ⓑ East',
          ko: 'Ⓑ 동쪽',
        },
        northeast: {
          en: '① Northeast',
          ko: '① 북동',
        },
        northwest: {
          en: '④ Northwest',
          ko: '④ 북서',
        },
        southeast: {
          en: '② Southeast',
          ko: '② 남동',
        },
        southwest: {
          en: '③ Southwest',
          ko: '③ 남서',
        },
        west: {
          en: 'Ⓓ West',
          ko: 'Ⓓ 서쪽',
        },
      },
    },
    {
      id: 'P11S Styx Stack',
      type: 'StartsUsing',
      netRegex: { id: '8217', source: 'Themis', capture: false },
      preRun: (data) => {
        data.styxCount++;
      },
      infoText: (data, _matches, output) => output.text!({ num: data.styxCount }),
      outputStrings: {
        text: {
          en: 'Stack (${num} times)',
          de: 'Sammeln (${num} Mal)',
          fr: 'Packez-vous (${num} fois)',
          ja: '頭割り（${num}回）',
          cn: '集合分摊 (${num}次)',
          ko: '전체 연속 공격! ${num}번',
        },
      },
    },
    {
      id: 'P11S 샤도 메신저',
      type: 'StartsUsing',
      netRegex: { id: '8219', source: 'Themis', capture: false },
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Sides => Rotate🟪',
          ko: '옆으로 🔜 🟪쪽으로 돌아요',
        },
      },
    },
    {
      id: 'P11S 샤도 메신저 보충',
      type: 'StartsUsing',
      netRegex: { id: '8219', source: 'Themis', capture: false },
      delaySeconds: 15,
      durationSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Rotate outside! Tether check!',
          ko: '돌 때는 바깥쪽으로! 줄 확인!',
        },
      },
    },
    {
      id: 'P11S 라이트 앤 다크 시작',
      type: 'StartsUsing',
      netRegex: { id: '81FE', source: 'Themis', capture: false },
      run: (data) => data.prsLightAndDarks = 'none',
    },
    {
      id: 'P11S Emissary 리셋',
      type: 'StartsUsing',
      netRegex: { id: '8202', capture: false },
      run: (data) => delete data.prsLightAndDarks,
    },
    {
      id: 'P11S 다크 커런트',
      type: 'StartsUsing',
      netRegex: { id: '8204', source: 'Themis', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Ready to running!',
          ko: '달릴 준비! 먼저 옆으로',
        },
      },
    },
    {
      id: 'P11S 다크 커런트 흩어지기',
      type: 'StartsUsing',
      netRegex: { id: '8204', source: 'Themis', capture: false },
      delaySeconds: 9,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Spread soon, protein',
          ko: '곧 흩어지기, 프로틴 자리 확인',
        },
      },
    },
    {
      id: 'P11S 레터 오브 더 로',
      type: 'StartsUsing',
      netRegex: { id: '87D2', source: 'Themis', capture: false },
      durationSeconds: 6,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Prepare letter of the law',
          ko: '복합 기믹 시작해요',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        'Inevitable Law/Inevitable Sentence': 'Inevitable Law/Sentence',
      },
    },
    {
      'locale': 'de',
      'replaceSync': {
        'Arcane Cylinder': 'arkan(?:e|er|es|en) Zylinder',
        'Arcane Sphere': 'arkan(?:e|er|es|en) Körper',
        'Illusory Themis': 'Phantom-Themis',
        '(?<! )Themis': 'Themis',
      },
      'replaceText': {
        '\\(cast\\)': '(wirken)',
        '\\(enrage\\)': '(Finalangriff)',
        'Arcane Revelation': 'Arkane Enthüllung',
        'Arche': 'Arche',
        'Blinding Light': 'Blendendes Licht',
        'Dark Current': 'Dunkelstrahl',
        'Dark Perimeter': 'Dunkler Kreis',
        'Dark and Light': 'Licht-Dunkel-Schlichtung',
        'Dike': 'Dike',
        'Dismissal Overruling': 'Verweisungsbefehl',
        'Divisive Overruling': 'Auflösungsbefehl',
        'Divisive Ruling': 'Auflösungsbeschluss',
        'Emissary\'s Will': 'Schlichtung',
        'Eunomia': 'Eunomia',
        '(?<!Magie)Explosion': 'Explosion',
        'Heart of Judgment': 'Urteilsschlag',
        'Inevitable Law': 'Langer Arm des Rechts',
        'Inevitable Sentence': 'Langer Arm der Strafe',
        'Jury Overruling': 'Schöffenbefehl',
        'Letter of the Law': 'Phantomgesetz',
        'Lightburst': 'Lichtstoß',
        'Lightstream': 'Lichtstrahl',
        'Shadowed Messengers': 'Boten des Schattens',
        'Styx': 'Styx',
        'Twofold Revelation': 'Zweifache Enthüllung',
        'Ultimate Verdict': 'Letzte Schlichtung',
        'Unlucky Lot': 'Magieexplosion',
        'Upheld Overruling': 'Erhebungsbefehl',
        'Upheld Ruling': 'Erhebungsbeschluss',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Arcane Cylinder': 'sphère arcanique orientée',
        'Arcane Sphere': 'sphère arcanique',
        'Illusory Themis': 'spectre de Thémis',
        '(?<! )Themis': 'Thémis',
      },
      'replaceText': {
        'Arcane Revelation': 'Déploiement arcanique',
        'Arche': 'Arkhé',
        'Blinding Light': 'Lumière aveuglante',
        'Dark Current': 'Flux sombre',
        'Dark Perimeter': 'Cercle ténébreux',
        'Dark and Light': 'Médiation Lumière-Ténèbres',
        'Dike': 'Diké',
        'Dismissal Overruling': 'Rejet et annulation',
        'Divisive Overruling': 'Partage et annulation',
        'Divisive Ruling': 'Partage et décision',
        'Emissary\'s Will': 'Médiation',
        'Eunomia': 'Eunomia',
        'Explosion': 'Explosion',
        'Heart of Judgment': 'Onde pénale',
        'Inevitable Law': 'Ligne additionnelle',
        'Inevitable Sentence': 'Peine complémentaire',
        'Jury Overruling': 'Jugement et annulation',
        'Letter of the Law': 'Fantasmagorie des lois',
        'Lightburst': 'Éclat de lumière',
        'Lightstream': 'Flux lumineux',
        'Shadowed Messengers': 'Fantasmagorie des préceptes',
        'Styx': 'Styx',
        'Twofold Revelation': 'Double déploiement arcanique',
        'Ultimate Verdict': 'Médiation ultime',
        'Unlucky Lot': 'Déflagration éthérée',
        'Upheld Overruling': 'Maintien et annulation',
        'Upheld Ruling': 'Maintien et décision',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Arcane Cylinder': '指向魔法陣',
        'Arcane Sphere': '立体魔法陣',
        'Illusory Themis': 'テミスの幻影',
        '(?<! )Themis': 'テミス',
      },
      'replaceText': {
        'Arcane Revelation': '魔法陣展開',
        'Arche': 'アルケー',
        'Blinding Light': '光弾',
        'Dark Current': 'ダークストリーム',
        'Dark Perimeter': 'ダークサークル',
        'Dark and Light': '光と闇の調停',
        'Dike': 'ディケー',
        'Dismissal Overruling': 'ディスミサル＆オーバールール',
        'Divisive Overruling': 'ディバイド＆オーバールール',
        'Divisive Ruling': 'ディバイド＆ルーリング',
        'Emissary\'s Will': '調停',
        'Eunomia': 'エウノミアー',
        'Explosion': '爆発',
        'Heart of Judgment': '刑律の波動',
        'Inevitable Law': 'アディショナルロウ',
        'Inevitable Sentence': 'アディショナルセンテンス',
        'Jury Overruling': 'ジューリー＆オーバールール',
        'Letter of the Law': '理法の幻奏',
        'Lightburst': 'ライトバースト',
        'Lightstream': 'ライトストリーム',
        'Shadowed Messengers': '戒律の幻奏',
        'Styx': 'ステュクス',
        'Twofold Revelation': '二種魔法陣展開',
        'Ultimate Verdict': '究極調停',
        'Unlucky Lot': '魔爆',
        'Upheld Overruling': 'アップヘルド＆オーバールール',
        'Upheld Ruling': 'アップヘルド＆ルーリング',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Arcane Cylinder': '指向魔法阵',
        'Arcane Sphere': '立体魔法阵',
        'Illusory Themis': '特弥斯的幻影',
        '(?<! )Themis': '特弥斯',
      },
      'replaceText': {
        '\\(cast\\)': '(咏唱)',
        '\\(enrage\\)': '(狂暴)',
        'Arcane Revelation': '魔法阵展开',
        'Arche': '始基',
        'Blinding Light': '光弹',
        'Dark Current': '黑暗奔流',
        'Dark Perimeter': '黑暗回环',
        'Dark and Light': '光与暗的调停',
        'Dike': '正义',
        'Dismissal Overruling': '驳回否决',
        'Divisive Overruling': '分歧否决',
        'Divisive Ruling': '驳回判决',
        'Emissary\'s Will': '调停者之意',
        'Eunomia': '秩序',
        '(?<!Magie)Explosion': '爆炸',
        'Heart of Judgment': '刑律波动',
        'Inevitable Law': '追加律法',
        'Inevitable Sentence': '追加刑罚',
        'Jury Overruling': '陪审团否决',
        'Letter of the Law': '理法幻奏',
        'Lightburst': '光爆破',
        'Lightstream': '光明奔流',
        'Shadowed Messengers': '戒律幻奏',
        'Styx': '仇恨',
        'Twofold Revelation': '魔法阵双重展开',
        'Ultimate Verdict': '究极调停',
        'Unlucky Lot': '魔爆',
        'Upheld Overruling': '维持否决',
        'Upheld Ruling': '维持判决',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Arcane Cylinder': '방향마법진',
        'Arcane Sphere': '입체마법진',
        'Illusory Themis': '테미스의 환영',
        '(?<! )Themis': '테미스',
      },
      'replaceText': {
        '\\(cast\\)': '(시전)',
        'Arcane Revelation': '마법진 전개',
        'Arche': '아르케',
        'Blinding Light': '빛 폭탄',
        'Dark Current': '암운의 격류',
        'Dark Perimeter': '어둠의 둘레',
        'Dark and Light': '빛과 어둠의 조정',
        'Dike': '디케',
        'Dismissal Overruling': '퇴거 강행',
        'Divisive Overruling': '분할 강행',
        'Divisive Ruling': '분할 집행',
        'Emissary\'s Will': '조정',
        'Eunomia': '에우노미아',
        '(?<!Magie)Explosion': '폭발',
        'Heart of Judgment': '형률의 파동',
        'Inevitable Law': '추가 기소',
        'Inevitable Sentence': '추가 선고',
        'Jury Overruling': '배심 강행',
        'Letter of the Law': '이법의 환영',
        'Lightburst': '빛 분출',
        'Lightstream': '빛의 급류',
        'Shadowed Messengers': '계율의 환영',
        'Styx': '스틱스',
        'Twofold Revelation': '이중 마법진 전개',
        'Ultimate Verdict': '궁극의 조정',
        'Unlucky Lot': '마력 폭발',
        'Upheld Overruling': '확정 강행',
        'Upheld Ruling': '확정 집행',
      },
    },
  ],
};

export default triggerSet;
