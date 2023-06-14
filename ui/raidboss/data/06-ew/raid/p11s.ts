import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { Output, TriggerSet } from '../../../../../types/trigger';

export const playstationMarkers = ['circle', 'cross', 'triangle', 'square'] as const;
export type lightAndDarks = 'none' | 'lightnear' | 'lightfar' | 'darknear' | 'darkfar';

export interface Data extends RaidbossData {
  prsDike?: number;
  prsStyx?: number;
  prsLnd?: lightAndDarks;
  prsTethers: string[];
  //
  lightDarkDebuff: { [name: string]: 'light' | 'dark' };
  lightDarkBuddy: { [name: string]: string };
  lightDarkTether: { [name: string]: 'near' | 'far' };
  cylinderValue?: number;
  numCylinders?: number;
}

export const prsP11Strings = {
  proteinpair: {
    en: '프로틴 (페어)',
  },
  proteinshare: {
    en: '프로틴 (힐러 4:4)',
  },
  proteinlightfar: {
    en: '프로틴: 그대로 대기',
  },
  proteinlightnear: {
    en: '프로틴: 90도 왼쪽 안으로',
  },
  proteindarkfar: {
    en: '프로틴: 45도 왼쪽으로',
  },
  proteindarknear: {
    en: '프로틴: 90+45도 왼쪽 안으로',
  },
  proteinunknown: {
    en: '프로틴 (${unk})',
  },
  unknown: Outputs.unknown,
};
export const prsJuryPrepare = (data: Data, output: Output, pair: boolean) => {
    const mesg = data.prsLnd
    ? {
      lightfar: output.proteinlightfar!(),
      lightnear: output.proteinlightnear!(),
      darkfar: output.proteindarkfar!(),
      darknear: output.proteindarknear!(),
      none: output.proteinunknown!({ unk: output.unknown!() }),
    }[data.prsLnd] : pair ? output.proteinpair!() : output.proteinshare!();
    return mesg;
};

const triggerSet: TriggerSet<Data> = {
  id: 'AnabaseiosTheEleventhCircleSavage',
  zoneId: ZoneId.AnabaseiosTheEleventhCircleSavage,
  timelineFile: 'p11s.txt',
  initData: () => {
    return {
      prsTethers: [],
      //
      lightDarkDebuff: {},
      lightDarkBuddy: {},
      lightDarkTether: {},
    };
  },
  triggers: [
    {
      id: 'P11S Eunomia',
      type: 'StartsUsing',
      netRegex: { id: '822B', source: 'Themis', capture: false },
      response: Responses.bleedAoe(),
    },
    {
      id: 'P11S Jury Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '81E6', source: 'Themis', capture: false },
      alertText: (data, _matches, output) => prsJuryPrepare(data, output, false),
      outputStrings: prsP11Strings,
    },
    {
      id: 'P11S Jury Overruling Light 실행',
      type: 'StartsUsing',
      netRegex: { id: '81E6', source: 'Themis', capture: false },
      delaySeconds: 5.1,
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.prsLnd && data.prsLnd !== 'none')
          return output.lightLr!();
        return output.text!();
      },
      outputStrings: {
        text: {
          en: '(안쪽에서) 4:4 힐러랑 뭉쳐요',
          de: 'Himmelsrichtungen => Heiler Gruppen',
          fr: 'Positions => Package sur les heals',
          cn: '八方分散 => 治疗分摊',
          ko: '8방향 산개 => 힐러 그룹 쉐어',
        },
        lightLr: {
          en: '(왼쪽 돌아 마커) 4:4 힐러랑 뭉쳐요',
        },
      },
    },
    {
      id: 'P11S Jury Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '81E7', source: 'Themis', capture: false },
      alertText: (data, _matches, output) => prsJuryPrepare(data, output, true),
      outputStrings: prsP11Strings,
    },
    {
      id: 'P11S Jury Overruling Dark 실행',
      type: 'StartsUsing',
      netRegex: { id: '81E7', source: 'Themis', capture: false },
      delaySeconds: 5.1,
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        const mesg = data.prsLnd
        ? {
          lightfar: output.pairlightfar!(),
          lightnear: output.pairlightnear!(),
          darkfar: output.pairdarkfar!(),
          darknear: output.pairdarknear!(),
          none: output.unknown!(),
        }[data.prsLnd] : output.text!();
        return mesg;
      },
      outputStrings: {
        text: {
          en: '(마커에서) 페어',
          de: 'Himmelsrichtungen => Partner',
          fr: 'Positions => Partenaires',
          cn: '八方分散 => 两人分摊',
          ko: '8방향 산개 => 파트너',
        },
        pairlightfar: {
          en: '페어: 왼쪽 돌아 🟪로',
        },
        pairlightnear: {
          en: '페어: 밖으로 나가요',
        },
        pairdarkfar: {
          en: '페어: 그자리 대기',
        },
        pairdarknear: {
          en: '페어: 밖으로 나가요',
        },
        unknown: Outputs.unknown,
      },
    },
    {
      id: 'P11S Upheld Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '87D3', source: 'Themis', capture: false },
      durationSeconds: 11,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '한가운데 => 밖으로 4:4 힐러랑 뭉쳐요',
          de: 'Party Rein => Raus + Heiler Gruppen',
          fr: 'Intérieur => Extérieur + package sur les heals',
          cn: '场中集合 => 场边 + 治疗分摊',
          ko: '본대 안으로 => 밖으로 + 힐러 그룹 쉐어',
        },
      },
    },
    {
      id: 'P11S Upheld Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '87D4', source: 'Themis' },
      durationSeconds: 11,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank') {
          if (data.prsTethers.length === 0)
            return output.tankUnknown!();
          if (data.prsTethers.includes(data.me))
            return output.tank!();
        }
        return output.text!();
      },
      run: (data) => data.prsTethers = [],
      outputStrings: {
        text: {
          en: '밖으로 => 안쪽에서 페어',
          de: 'Party Raus => Rein + Partner',
          fr: 'Extérieur => Intérieur + package sur les heals',
          cn: '场外 => 场中 + 两人分摊',
          ko: '본대 밖으로 => 안으로 + 파트너',
        },
        tank: {
          en: '한가운데 줄 유도 => 안쪽에서 페어',
        },
        tankUnknown: {
          en: '줄 달리면 한가운데 유도 => 안쪽에서 페어',
        }
      },
    },
    {
      id: 'P11S Divisive Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '81EC', source: 'Themis', capture: false },
      durationSeconds: 11,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '옆으로 => 그대로 4:4 힐러랑 뭉쳐요',
          de: 'Seiten => Heiler Gruppen + Raus',
          fr: 'Côtés => Extérieur + Package sur les heals',
          cn: '两侧 => 治疗分摊 + 场外',
          ko: '양 옆 => 밖으로 + 힐러 그룹 쉐어',
        },
      },
    },
    {
      id: 'P11S Divisive Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '81ED', source: 'Themis', capture: false },
      durationSeconds: 11,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '옆으로 => 안쪽에서 페어',
          de: 'Seiten => Rein + Partner',
          fr: 'Côtés => Intérieur + Package sur les heals',
          cn: '两侧 => 两人分摊 + 场内',
          ko: '양 옆 => 안으로 + 파트너',
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
          en: '바깥에서 4:4 힐러랑 뭉쳐요',
          de: 'Heiler Gruppen + Raus',
          fr: 'Extérieur + Package sur les heals',
          cn: '治疗分摊 + 场外',
          ko: '힐러 그룹 쉐어 + 밖으로',
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
          en: '안쪽에서 페어',
          de: 'Partner + Rein',
          fr: 'Partenaires + Intérieur',
          cn: '两人分摊 + 场内',
          ko: '파트너 + 안으로',
        },
      },
    },
    {
      id: 'P11S Dismissal Overruling Light',
      type: 'StartsUsing',
      netRegex: { id: '8784', source: 'Themis', capture: false },
      durationSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백 먼저 => 바깥에서 4:4 힐러랑 뭉쳐요',
          de: 'Rückstoß => Heiler Gruppen + Raus',
          fr: 'Poussée => Extérieur + Package sur les heals',
          cn: '击退 => 治疗分摊 + 场外',
          ko: '넉백 => 밖으로 + 힐러 그룹 쉐어',
        },
      },
    },
    {
      id: 'P11S Dismissal Overruling Dark',
      type: 'StartsUsing',
      netRegex: { id: '8785', source: 'Themis', capture: false },
      durationSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '넉백 먼저 => 안쪽에서 페어',
          de: 'Rückstoß => Rein + Partner',
          fr: 'Poussée => Intérieur + Partenaires',
          cn: '击退 => 两人分摊 + 场内',
          ko: '넉백 => 안으로 + 파트너',
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
          en: '옆으로 => 🟪 포탈 안전',
          de: 'Geh zu einem Dunkel-Portal',
          fr: 'Allez vers les portails sombres',
          cn: '去暗门前',
          ko: '어둠 문 쪽으로',
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
          en: '옆으로 => 🟨 포탈 안전',
          de: 'Geh zu einem Licht-Portal',
          fr: 'Allez sur les portails de lumière',
          cn: '去光门前',
          ko: '빛 문 쪽으로',
        },
      },
    },
    {
      id: 'P11S Arcane Revelation Light Orbs',
      type: 'StartsUsing',
      netRegex: { id: '820F', source: 'Themis', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟣 구슬 쪽으로',
          de: 'Rotiere zu den dunklen Orbs',
          fr: 'Tournez vers les orbes sombres',
          cn: '暗球侧安全',
          ko: '어둠 구슬 쪽으로',
        },
      },
    },
    {
      id: 'P11S Arcane Revelation Dark Orbs',
      type: 'StartsUsing',
      netRegex: { id: '8210', source: 'Themis', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟡 구슬 쪽으로',
          de: 'Rotiere zu den licht Orbs',
          fr: 'Tournez ves les orbes de lumière',
          cn: '光球侧安全',
          ko: '빛 구슬 쪽으로',
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
            en: '🟡 니어: ${role}/${player} (${side})',
            de: 'Licht Nahe w/${player}',
            fr: 'Lumière proche avec ${player}',
            cn: '光靠近 => ${player}',
            ko: '빛 가까이 +${player}',
          },
          lightFar: {
            en: '🟡 파: ${role}/${player} (${side})',
            de: 'Licht Entfernt w/${player}',
            fr: 'Lumière éloignée avec ${player}',
            cn: '光远离 => ${player}',
            ko: '빛 멀리 +${player}',
          },
          darkNear: {
            en: '🟣 니어: ${role}/${player} (${side})',
            de: 'Dunkel Nahe w/${player}',
            fr: 'Sombre proche avec ${player}',
            cn: '暗靠近 => ${player}',
            ko: '어둠 가까이 +${player}',
          },
          darkFar: {
            en: '🟣 파: ${role}/${player} (${side})',
            de: 'Dunkel Entfernt w/${player}',
            fr: 'Sombre éloigné avec ${player}',
            cn: '暗远离 => ${player}',
            ko: '어둠 멀리 +${player}',
          },
          otherNear: {
            en: '다른팀 니어: ${player1}, ${player2}',
            de: 'Anderes Nahe: ${player1}, ${player2}',
            fr: 'Autre proche : ${player1}, ${player2}',
            ko: '다른 가까이: ${player1}, ${player2}',
          },
          otherFar: {
            en: '다른팀 파: ${player1}, ${player2}',
            de: 'Anderes Entfernt: ${player1}, ${player2}',
            fr: 'Autre éloigné : ${player1}, ${player2}',
            ko: '다른 멀리: ${player1}, ${player2}',
          },
          leftSide: {
            en: 'Ⓑ🡺',
          },
          rightSide: {
            en: '🡸Ⓓ',
          },
          roleTank: Outputs.roleTank,
          roleHeal: Outputs.roleHeal,
          roleDps: Outputs.roleDps,
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

        const mySide = data.role === 'dps'
        ? myColor === 'dark' ? output.rightSide!() : output.leftSide!()
        : myColor === 'dark' ? output.leftSide!() : output.rightSide!();

        if (myColor === 'light')
          data.prsLnd = myLength === 'near' ? 'lightnear' : 'lightfar';
        else
          data.prsLnd = myLength === 'near' ? 'darknear' : 'darkfar';

        const myBuddyRole = data.party.isTank(myBuddy)
          ? output.roleTank!() : data.party.isHealer(myBuddy)
          ? output.roleHeal!() : output.roleDps!();

        const myBuddyShort = data.ShortName(myBuddy);

        let alertText: string;
        if (myLength === 'near') {
          if (myColor === 'light')
            alertText = output.lightNear!({ role: myBuddyRole, player: myBuddyShort, side: mySide });
          else
            alertText = output.darkNear!({ role: myBuddyRole, player: myBuddyShort, side: mySide });
        } else {
          if (myColor === 'light')
            alertText = output.lightFar!({ prole: myBuddyRole, layer: myBuddyShort, side: mySide });
          else
            alertText = output.darkFar!({ role: myBuddyRole, player: myBuddyShort, side: mySide });
        }

        let infoText: string | undefined = undefined;

        const playerNames = Object.keys(data.lightDarkTether);
        const sameLength = playerNames.filter((x) => data.lightDarkTether[x] === myLength);
        const others = sameLength.filter((x) => x !== data.me && x !== myBuddy).sort();
        const [player1, player2] = others.map((x) => data.ShortName(x));
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
          en: '안전: 🟣🟪',
          de: 'Geh zum dunklen Orb + dunkle Portale',
          fr: 'Allez vers l\'orbe sombre + Portail sombre',
          cn: '去暗球 + 暗门',
          ko: '어둠 구슬 + 어둠 문',
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
          en: '안전: 🟡🟨',
          de: 'Geh zum hellen Orb + helle Portale',
          fr: 'Allez vers l\'orbe de lumière + Portail de lumière',
          cn: '去光球 + 光门',
          ko: '빛 구슬 + 빛 문',
        },
      },
    },
    {
      id: 'P11S Lightstream Collect',
      type: 'HeadMarker',
      // 00E6 = orange clockwise rotation
      // 00E7 = blue counterclockwise rotation
      netRegex: { id: '00E[67]', target: 'Arcane Cylinder' },
      run: (data, matches) => {
        // Create a 3 digit binary value, Orange = 0, Blue = 1.
        // e.g. BBO = 110 = 6
        data.cylinderValue ??= 0;
        data.numCylinders ??= 0;
        data.cylinderValue *= 2;
        if (matches.id === '00E7')
          data.cylinderValue += 1;
        data.numCylinders++;
      },
    },
    {
      id: 'P11S Lightstream',
      type: 'HeadMarker',
      netRegex: { id: '00E[67]', target: 'Arcane Cylinder', capture: false },
      condition: (data) => data.numCylinders === 3,
      alertText: (data, _matches, output) => {
        if (!data.cylinderValue || !(data.cylinderValue >= 0) || data.cylinderValue > 7)
          return;
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
        return outputs[data.cylinderValue];
      },
      run: (data) => {
        delete data.cylinderValue;
        delete data.numCylinders;
      },
      outputStrings: {
        east: Outputs.east,
        northeast: Outputs.northeast,
        northwest: Outputs.northwest,
        southeast: Outputs.southeast,
        southwest: Outputs.southwest,
        west: Outputs.west,
      },
    },
    {
      id: 'P11S 디케',
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
          en: '${num}번째  디케 둘이서 버스터!',
        },
      },
    },
    {
      id: 'P11S 스틱스',
      type: 'StartsUsing',
      netRegex: { id: '8217', source: 'Themis', capture: false },
      infoText: (data, _matches, output) => {
        data.prsStyx = (data.prsStyx ?? 4) + 1;
        return output.text!({ num: data.prsStyx });
      },
      outputStrings: {
        text: {
          en: '전체 연속 공격! ${num}번',
        },
      },
    },
    {
      id: 'P11S 샤도 메신저',
      type: 'StartsUsing',
      netRegex: { id: '8219', source: 'Themis', capture: false },
      durationSeconds: 12,
      infoText: (_data, _matches, output) => output.text!(),
      run: (data) => data.prsTethers = [],
      outputStrings: {
        text: {
          en: '옆으로 => 장판 깔리면 🟪쪽으로',
        },
      },
    },
    {
      id: 'P11S 샤도 메신저 보충',
      type: 'StartsUsing',
      netRegex: { id: '8219', source: 'Themis', capture: false },
      delaySeconds: 15,
      durationSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '돌 때는 바깥쪽으로! 줄 확인!',
        },
      },
    },
    {
      id: 'P11S 샤도 메신저 보충 줄 확인',
      type: 'StartsUsing',
      netRegex: { id: '8219', source: 'Themis', capture: false },
      delaySeconds: 25,
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.prsTethers.includes(data.me)) {
          if (data.role === 'tank')
            return output.tankTether!();
          return output.otherTether!();
        }
        return output.text!();
      },
      outputStrings: {
        tankTether: {
          en: '내게 줄! A로 유도',
        },
        otherTether: {
          en: '내게 줄! 한가운데 => 탱크쪽으로',
        },
        text: {
          en: '한가운데서 뭉쳤다 => 탱크쪽으로',
        },
      },
    },
    {
      id: 'P11S 보스와 연결 선',
      type: 'Tether',
      netRegex: { id: '00F9', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      run: (data, matches) => data.prsTethers.push(matches.target),
      outputStrings: {
        text: '내게 줄이 달렸어요',
      },
    },
    {
      id: 'P11S 라이트 스트림',
      type: 'StartsUsing',
      netRegex: { id: '8203', source: 'Themis', capture: false },
      durationSeconds: 7,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡸🡸🟦🟦 또는 🟥🟥🡺🡺',
        },
      },
    },
    {
      id: 'P11S 라이트 앤 다크 시작',
      type: 'StartsUsing',
      netRegex: { id: '81FE', source: 'Themis', capture: false },
      run: (data) => data.prsLnd = 'none',
    },
    {
      id: 'P11S Emissary 리셋',
      type: 'StartsUsing',
      netRegex: { id: '8202' },
      run: (data) => delete data.prsLnd,
    },
    {
      id: 'P11S 다크 커런트',
      type: 'StartsUsing',
      netRegex: { id: '8204', source: 'Themis', capture: false },
      durationSeconds: 7,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '달릴 준비! 먼저 옆으로',
        },
      },
    },
    {
      id: 'P11S 다크 커런트 프로틴',
      type: 'StartsUsing',
      netRegex: { id: '8204', source: 'Themis', capture: false },
      delaySeconds: 9,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '곧 프로틴, 자리 확인',
        },
      },
    },
    {
      id: 'P11S 레터 오브 더 로',
      type: 'StartsUsing',
      netRegex: { id: '87D2', source: 'Themis', capture: false },
      durationSeconds: 7,
      alertText: (data, _matches, output) => {
        if (data.role === 'tank') {
          if (data.prsTethers.length === 0)
            return output.tankUnknown!();
          if (data.prsTethers.includes(data.me))
            return output.tankTether!();
        }
        return output.others!();
      },
      run: (data) => data.prsTethers = [],
      outputStrings: {
        tankTether: '복합 기믹: 줄 달렸어요 북으로!',
        tankUnknown: {
          en: '복합 기믹: 즐🡺북으로 / 줄없음🡺남으로',
        },
        others: {
          en: '복합 기믹: 남쪽으로',
        },
      },
    },
    {
      id: 'P11S 하트 오브 저지 관련',
      type: 'StartsUsing',
      netRegex: { id: '8226', source: 'Themis', capture: false },
      delaySeconds: 3,
      durationSeconds: 10,
      alertText: (data, _matches, output) => {
        if (data.prsTethers.includes(data.me)) {
          if (data.role === 'tank')
            return output.tankTether!();
          return output.otherTether!();
        }
        return output.text!();
      },
      outputStrings: {
        tankTether: {
          en: '내게 줄! 한가운데서 무적 => 자기 자리로',
        },
        otherTether: {
          en: '내게 줄! 푹직쾅 => 한가운데 => 자기자리로'
        },
        text: {
          en: '푹직쾅 => 한가운데 => 자기 자리로',
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
      'missingTranslations': true,
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
        'Divisive Ruling': 'Auflösungsbeschluss',
        'Emissary\'s Will': 'Schlichtung',
        'Eunomia': 'Eunomia',
        '(?<!Magie)Explosion': 'Explosion',
        'Heart of Judgment': 'Urteilsschlag',
        'Inevitable Law': 'Langer Arm des Rechts',
        'Inevitable Sentence': 'Langer Arm der Strafe',
        'Letter of the Law': 'Phantomgesetz',
        'Lightburst': 'Lichtstoß',
        'Lightstream': 'Lichtstrahl',
        'Shadowed Messengers': 'Boten des Schattens',
        'Styx': 'Styx',
        'Ultimate Verdict': 'Letzte Schlichtung',
        'Unlucky Lot': 'Magieexplosion',
        'Upheld Ruling': 'Erhebungsbeschluss',
      },
    },
    {
      'locale': 'fr',
      'missingTranslations': true,
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
        'Divisive Ruling': 'Partage et décision',
        'Emissary\'s Will': 'Médiation',
        'Eunomia': 'Eunomia',
        'Explosion': 'Explosion',
        'Heart of Judgment': 'Onde pénale',
        'Inevitable Law': 'Ligne additionnelle',
        'Inevitable Sentence': 'Peine complémentaire',
        'Letter of the Law': 'Fantasmagorie des lois',
        'Lightburst': 'Éclat de lumière',
        'Lightstream': 'Flux lumineux',
        'Shadowed Messengers': 'Fantasmagorie des préceptes',
        'Styx': 'Styx',
        'Ultimate Verdict': 'Médiation ultime',
        'Unlucky Lot': 'Déflagration éthérée',
        'Upheld Ruling': 'Maintien et décision',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
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
        'Divisive Ruling': 'ディバイド＆ルーリング',
        'Emissary\'s Will': '調停',
        'Eunomia': 'エウノミアー',
        'Explosion': '爆発',
        'Heart of Judgment': '刑律の波動',
        'Inevitable Law': 'アディショナルロウ',
        'Inevitable Sentence': 'アディショナルセンテンス',
        'Letter of the Law': '理法の幻奏',
        'Lightburst': 'ライトバースト',
        'Lightstream': 'ライトストリーム',
        'Shadowed Messengers': '戒律の幻奏',
        'Styx': 'ステュクス',
        'Ultimate Verdict': '究極調停',
        'Unlucky Lot': '魔爆',
        'Upheld Ruling': 'アップヘルド＆ルーリング',
      },
    },
  ],
};

export default triggerSet;
