import Conditions from '../../../../../resources/conditions';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// AS를 ASS로 고치고 있음

export type Banishment = 'redLeft' | 'redRight' | 'blueLeft' | 'blueRight';

export interface Data extends RaidbossData {
  suds?: string;
  cleanCounter: 0;
  soapCounter: number;
  freshPuff: number;
  beaterCounter: number;
  hasLingering?: boolean;
  thunderousEchoPlayer?: string;
  arcaneFontCounter: number;
  myFlame?: number;
  brandEffects: { [effectId: number]: string };
  brandCounter: number;
  flameCounter: number;
  //
  rushCounter: number;
  rushNumbers: number[];
  rushCasts: (NetMatches['StartsUsing'])[];
  visageType?: 'hateful' | 'accursed';
  visageCounter?: number;
  explosionCounter?: number;
  explosionTime?: number;
  firesteelStrikes?: string[];
  banishment?: Banishment;
}

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AnotherSildihnSubterraneSavage,
  timelineFile: 'ass.txt',
  initData: () => {
    return {
      cleanCounter: 0,
      soapCounter: 0,
      freshPuff: 0,
      beaterCounter: 0,
      arcaneFontCounter: 0,
      brandEffects: {},
      brandCounter: 0,
      flameCounter: 0,
      //
      rushCounter: 0,
      rushNumbers: [],
      rushCasts: [],
    };
  },
  triggers: [
    // ---------------- first trash ----------------
    {
      id: 'ASSS Atropine Spore',
      type: 'StartsUsing',
      netRegex: { id: '7978', source: 'Aqueduct Belladonna', capture: false },
      response: Responses.getIn(),
    },
    {
      id: 'ASSS Frond Affront',
      type: 'StartsUsing',
      netRegex: { id: '7979', source: 'Aqueduct Belladonna', capture: false },
      response: Responses.lookAway(),
    },
    {
      id: 'ASSS Deracinator',
      type: 'StartsUsing',
      netRegex: { id: '797A', source: 'Aqueduct Belladonna' },
      response: Responses.tankBuster(),
    },
    {
      id: 'ASSS Left Sweep',
      type: 'StartsUsing',
      netRegex: { id: '797C', source: 'Aqueduct Kaluk', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    {
      id: 'ASSS Right Sweep',
      type: 'StartsUsing',
      netRegex: { id: '797B', source: 'Aqueduct Kaluk', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    {
      id: 'ASSS Creeping Ivy',
      type: 'StartsUsing',
      netRegex: { id: '797D', source: 'Aqueduct Kaluk', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'ASSS Honeyed Left',
      type: 'StartsUsing',
      netRegex: { id: '7973', source: 'Aqueduct Udumbara', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    {
      id: 'ASSS Honeyed Right',
      type: 'StartsUsing',
      netRegex: { id: '7974', source: 'Aqueduct Udumbara', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    {
      id: 'ASSS Honeyed Front',
      type: 'StartsUsing',
      netRegex: { id: '7975', source: 'Aqueduct Udumbara', capture: false },
      response: Responses.getBehind(),
    },
    {
      id: 'ASSS Arboreal Storm',
      type: 'StartsUsing',
      netRegex: { id: '796F', source: 'Aqueduct Dryad', capture: false },
      response: Responses.getOut(),
    },
    // Aqueduct Odqan: Gelid Gale
    {
      id: 'ASSS+ Gelid Gale',
      type: 'StartsUsing',
      netRegex: { id: '7971', source: 'Aqueduct Odqan', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '랜덤 장판',
          ja: 'ランタゲ範囲',
        },
      },
    },
    // Aqueduct Odqan: Uproot
    {
      id: 'ASSS+ Uproot',
      type: 'StartsUsing',
      netRegex: { id: '7972', source: 'Aqueduct Odqan', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '범위 공격',
          ja: '範囲攻撃',
        },
      },
    },
    // ---------------- Silkie ----------------
    {
      id: 'ASSS Soap\'s Up',
      type: 'StartsUsing',
      netRegex: { id: '777D', source: 'Silkie', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟡비스듬 → 십자➕로',
          ja: '🟡斜め → 十字➕で',
        },
      },
    },
    {
      id: 'ASSS Dust Bluster',
      type: 'StartsUsing',
      netRegex: { id: '778F', source: 'Silkie', capture: false },
      response: Responses.knockback(),
    },
    {
      id: 'ASSS Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: { id: ['7774', '7778'], source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        data.cleanCounter++;
        if (data.cleanCounter === 1)
          return output.left!();
      },
      outputStrings: {
        left: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    {
      id: 'ASSS Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: { id: ['7775', '7779'], source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        data.cleanCounter++;
        if (data.cleanCounter === 1)
          return output.right!();
      },
      outputStrings: {
        right: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    {
      id: 'ASSS Suds Collect',
      // 777A Bracing Suds (Wind / Donut)
      // 777B Chilling Suds (Ice / Cardinal)
      // 777C Fizzling Suds (Lightning / Intercardinal)
      type: 'StartsUsing',
      netRegex: { id: ['777A', '777B', '777C'], source: 'Silkie' },
      run: (data, matches) => data.suds = matches.id,
    },
    {
      id: 'ASSS Slippery Soap',
      // Happens 5 times in the encounter
      type: 'Ability',
      netRegex: { id: '79FB', source: 'Silkie' },
      preRun: (data) => data.soapCounter++,
      alertText: (data, matches, output) => {
        if (data.suds === '777A') {
          // Does not happen on first or third Slippery Soap
          if (matches.target === data.me)
            return output.getBehindPartyKnockback!();
          return output.getInFrontOfPlayerKnockback!({ player: data.ShortName(matches.target) });
        }
        if (matches.target === data.me) {
          if (data.soapCounter === 1)
            return output.getBehindPuff!();
          if (data.soapCounter === 3)
            return output.getBehindPuffs!();
          return output.getBehindParty!();
        }
        return output.getInFrontOfPlayer!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        getBehindPuff: {
          en: '구슬의 맨 뒤로',
          ja: 'たまの一番後ろへ',
        },
        getBehindPuffs: {
          en: '구슬의 맨 뒤로 (동서)',
          ja: 'たまの一番後ろへ (東西)',
        },
        getBehindParty: {
          en: '맨 뒤로',
          ja: '一番後ろへ',
        },
        getBehindPartyKnockback: {
          en: '넉백! 맨 뒤로',
          ja: 'ノックバック！ 一番後ろへ',
        },
        getInFrontOfPlayer: {
          en: '${player} 앞으로',
          ja: '${player}の前へ',
        },
        getInFrontOfPlayerKnockback: {
          en: '넉백! ${player} 앞으로',
          ja: 'ノックバック! ${player}の前へ',
        },
      },
    },
    {
      id: 'ASSS Slippery Soap with Chilling Suds',
      type: 'StartsUsing',
      netRegex: { id: '7781', source: 'Silkie' },
      condition: (data) => data.suds === '777B',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      response: Responses.moveAround(),
    },
    {
      id: 'ASSS Slippery Soap After',
      type: 'Ability',
      netRegex: { id: '7781', source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case '777A':
            return output.getUnder!();
          case '777B':
            return output.intercards!();
          case '777C':
            return output.spreadCardinals!();
        }
      },
      outputStrings: {
        getUnder: {
          en: '🟢바로 밑으로',
          ja: '🟢貼り付く',
        },
        spreadCardinals: {
          en: '🟡비스듬 → 흩어져요',
          ja: '🟡斜め → 散会',
        },
        intercards: {
          en: '🔵십자 장판',
          ja: '🔵十字, 避けて',
        },
      },
    },
    {
      id: 'ASSS Carpet Beater',
      type: 'StartsUsing',
      netRegex: { id: '7772', source: 'Silkie' },
      preRun: (data) => data.beaterCounter++,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          busterOnYou: Outputs.tankBusterOnYou,
          busterOnTarget: Outputs.tankBusterOnPlayer,
          busterOnYouPuffs: {
            en: '내게 탱크버스터, 동서 구슬 사이로 유도',
            ja: '自分にタンクバスタ、東西で誘導',
          },
        };

        if (matches.target === data.me) {
          if (data.beaterCounter === 2)
            return { alertText: output.busterOnYouPuffs!() };
          return { infoText: output.busterOnYou!() };
        }

        if (data.role !== 'tank' && data.role !== 'healer')
          return;

        return { infoText: output.busterOnTarget!({ player: data.ShortName(matches.target) }) };
      },
    },
    {
      id: 'ASSS Soaping Spree',
      // Boss does not cast Fizzling Duster with Soaping Spree
      type: 'StartsUsing',
      netRegex: { id: '778A', source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case '777A':
            return output.getUnder!();
          case '777B':
            return output.intercards!();
        }
      },
      outputStrings: {
        getUnder: {
          en: '🟢바로 밑으로',
          ja: '🟢貼り付く',
        },
        intercards: {
          en: '🔵십자 장판',
          ja: '🔵十字, 避けて',
        },
      },
    },
    {
      id: 'ASSS Total Wash',
      type: 'StartsUsing',
      netRegex: { id: '7773', source: 'Silkie', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 + 출혈',
          de: 'AoE + Blutung',
          fr: 'AoE + Saignement',
          ja: '全体攻撃 + 出血',
          ko: '전체 공격 + 도트',
        },
      },
    },
    // 실키: Fresh Puff
    {
      id: 'ASSS+ Fresh Puff',
      type: 'StartsUsing',
      netRegex: { id: '7789', source: 'Silkie' },
      preRun: (data) => {
        data.cleanCounter = 0;
        data.freshPuff++;
      },
      infoText: (data, _matches, output) => {
        if (data.freshPuff === 1)
          return output.p1!();
        else if (data.freshPuff === 2)
          return output.p2!();
        else if (data.freshPuff === 3)
          return output.p3!();
        else if (data.freshPuff === 4)
          return output.p4!();
        return output.px!();
      },
      outputStrings: {
        p1: {
          en: '솜털 세개 → 꼬리 휘두르기',
          ja: 'たま3個 → 水拭き',
        },
        p2: {
          en: '솜털 네개, 안전지대 만들어요',
          ja: 'たま4個, 安置を作りましょう',
        },
        p3: {
          en: '솜털 여덟개, 화이팅이요',
          ja: 'たま8個, がんばれ！！',
        },
        p4: {
          en: '솜털 네개 → 꼬리 방향으로 유도',
          ja: 'たま4個 → しっぽ誘導',
        },
        px: {
          en: '솜털 나와요',
          ja: 'たま出ます',
        },
      },
    },

    // ---------------- second trash ----------------
    {
      id: 'ASSS Infernal Pain',
      type: 'StartsUsing',
      netRegex: { id: '7981', source: 'Sil\'dihn Dullahan', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '전체 공격 + 출혈',
          de: 'AoE + Blutung',
          fr: 'AoE + Saignement',
          ja: '全体攻撃 + 出血',
          ko: '전체 공격 + 도트',
        },
      },
    },
    {
      id: 'ASSS Blighted Gloom',
      type: 'StartsUsing',
      netRegex: { id: '797E', source: 'Sil\'dihn Dullahan', capture: false },
      response: Responses.getOut(),
    },
    {
      id: 'ASSS Infernal Weight',
      type: 'StartsUsing',
      netRegex: { id: '7983', source: 'Aqueduct Armor', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '헤비, 발 밑으로',
          ja: 'ヘビィ, 足元へ',
        },
      },
    },
    {
      id: 'ASSS Dominion Slash',
      type: 'StartsUsing',
      netRegex: { id: '7982', source: 'Aqueduct Armor', capture: false },
      response: Responses.getBehind(),
    },
    // Sil'dihn Dullahan: King's Will
    {
      id: 'ASSS+ King\'s Will',
      type: 'StartsUsing',
      netRegex: { id: '7980', source: 'Sil\'dihn Dullahan', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자기 강화',
          ja: '自己強化',
        },
      },
    },
    // Aqueduct Armor: Hells' Nebula
    {
      id: 'ASSS+ Hells\' Nebula',
      type: 'StartsUsing',
      netRegex: { id: '7984', source: 'Aqueduct Armor', capture: false },
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '체력이 1이네!',
          ja: '体力１!',
        },
      },
    },
    // ---------------- Gladiator of Sil'dih ----------------
    {
      id: 'ASSS Flash of Steel',
      type: 'StartsUsing',
      netRegex: { id: '7671', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ASSS Sculptor\'s Passion',
      // This is a wild charge, player in front takes most damage
      type: 'Ability',
      netRegex: { id: '6854', source: 'Gladiator of Sil\'dih' },
      alertText: (data, matches, output) => {
        if (matches.target === data.me)
          return output.chargeOnYou!();
        return output.chargeOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        chargeOn: {
          en: '${player}에게 돌진!',
          de: 'Ansturm auf ${player}',
          fr: 'Charge sur ${player}',
          ja: '${player}に突進！',
          cn: '蓝球点${player}',
          ko: '"${player}" 야성의 돌진 대상',
        },
        chargeOnYou: {
          en: '내게 돌진!',
          de: 'Ansturm auf DIR',
          fr: 'Charge sur VOUS',
          ja: '自分に突進！',
          cn: '蓝球点名',
          ko: '야성의 돌진 대상자',
        },
      },
    },
    {
      id: 'ASSS Mighty Smite',
      type: 'StartsUsing',
      netRegex: { id: '7672', source: 'Gladiator of Sil\'dih' },
      response: Responses.tankBuster(),
    },
    {
      id: 'ASSS Lingering Echoes',
      // CDC Lingering Echoes (Spread + Move)
      type: 'GainsEffect',
      netRegex: { effectId: 'CDC' },
      condition: Conditions.targetIsYou(),
      preRun: (data) => data.hasLingering = true,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      // response: Responses.moveAway(),
    },
    {
      id: 'ASSS Thunderous Echo Collect',
      // CDD Thunderous Echo (Stack)
      type: 'GainsEffect',
      netRegex: { effectId: 'CDD' },
      preRun: (data, matches) => data.thunderousEchoPlayer = matches.target,
    },
    {
      id: 'ASSS Curse of the Fallen',
      // CDA Echoes of the Fallen (Spread)
      // Two players will not have a second debuff, so check CDA
      // 14s = first
      // 17s = second
      type: 'GainsEffect',
      netRegex: { effectId: 'CDA' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 0.1,
      durationSeconds: 10,
      infoText: (data, matches, output) => {
        if (data.hasLingering)
          return output.spreadThenSpread!();

        const duration = parseFloat(matches.duration);

        // Check if spread first
        if (duration < 16) {
          if (data.me === data.thunderousEchoPlayer)
            return output.spreadThenStackOnYou!();
          if (data.thunderousEchoPlayer === undefined)
            return output.spreadThenStack!();
          return output.spreadThenStackOn!({ player: data.ShortName(data.thunderousEchoPlayer) });
        }

        if (data.me === data.thunderousEchoPlayer)
          return output.stackOnYouThenSpread!();
        if (data.thunderousEchoPlayer === undefined)
          return output.stackThenSpread!();
        return output.stackOnThenSpread!({ player: data.ShortName(data.thunderousEchoPlayer) });
      },
      outputStrings: {
        stackThenSpread: Outputs.stackThenSpread,
        stackOnThenSpread: {
          en: '뭉쳤다 → 흩어져요 (${player})',
          ja: '頭割り → 散会 (${player})',
        },
        stackOnYouThenSpread: {
          en: '내게 뭉쳤다 → 흩어져요',
          ja: '自分に頭割り → 散会',
        },
        spreadThenStack: Outputs.spreadThenStack,
        spreadThenStackOn: {
          en: '흩어졌다 → 뭉쳐요 (${player})',
          ja: '散会 → 頭割り (${player})',
        },
        spreadThenStackOnYou: {
          en: '흩어졌다 → 내게 뭉쳐요',
          ja: '散会 → 自分に頭割り',
        },
        spreadThenSpread: {
          en: '내가 링거, 홀로 있어야 해요',
          ja: '自分に連呪、ひとりぼっちでずっと',
        },
      },
    },
    {
      id: 'ASSS Ring of Might',
      // There are 6 spells:
      //   Ring 1: 765D (9.7s) / 7660 (11.7s)
      //   Ring 2: 765E (9.7s) / 7661 (11.7s)
      //   Ring 3: 765F (9.7s) / 7662 (11.7s)
      // Only tracking the 11.7s spell
      type: 'StartsUsing',
      netRegex: { id: ['7660', '7661', '7662'], source: 'Gladiator of Sil\'dih' },
      infoText: (_data, matches, output) => {
        if (matches.id === '7660')
          return output.outsideInner!();
        if (matches.id === '7661')
          return output.outsideMiddle!();
        return output.outsideOuter!();
      },
      outputStrings: {
        outsideInner: {
          en: '링 차지 ①',
          ja: 'リングチャージ ①',
        },
        outsideMiddle: {
          en: '링 차지 ②',
          ja: 'リングチャージ ②',
        },
        outsideOuter: {
          en: '링 차지 ③',
          ja: 'リングチャージ ③',
        },
      },
    },
    {
      id: 'ASSS Echoes of the Fallen Reminder',
      // CDA Echoes of the Fallen (Spread)
      type: 'GainsEffect',
      netRegex: { effectId: 'CDA' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      response: Responses.spread(),
    },
    {
      id: 'ASSS Thunderous Echo Reminder',
      // CDD Thunderous Echo (Stack)
      type: 'GainsEffect',
      netRegex: { effectId: 'CDD' },
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      infoText: (data, matches, output) => {
        if (data.hasLingering)
          return output.spread!();
        if (matches.target === data.me)
          return output.stackOnYou!();
        return output.stackOn!({ player: data.ShortName(matches.target) });
      },
      outputStrings: {
        spread: Outputs.spread,
        stackOnYou: Outputs.stackOnYou,
        stackOn: Outputs.stackOnPlayer,
      },
    },
    {
      id: 'ASSS Curse of the Monument',
      type: 'StartsUsing',
      netRegex: { id: '7666', source: 'Gladiator of Sil\'dih' },
      infoText: (data, _matches, output) => {
        if (data.role === 'tank' || data.CanFeint())
          return output.east!();
        else if (data.role === 'healer' || data.CanAddle() || data.CanSilence())
          return output.west!();
        return output.move!();
      },
      run: (data) => {
        data.explosionCounter = 0;
        data.explosionTime = 0;
      },
      outputStrings: {
        east: {
          en: '🡺오른쪽에서 기둘',
          ja: '🡺右で線待つ',
        },
        west: {
          en: '왼쪽🡸에서 기둘',
          ja: '左🡸で線待つ',
        },
        move: {
          en: '옆에서 기둘',
          ja: '横でで線待つ',
        },
      },
    },
    {
      id: 'ASSS Curse of the Monument Break Chains',
      type: 'Ability',
      netRegex: { id: '7666', source: 'Gladiator of Sil\'dih', capture: false },
      response: Responses.breakChains(),
    },
    /* {
      id: 'ASSS+ Curse of the Monument Tether',
      type: 'Tether',
      netRegex: { id: '00A3' },
      condition: (data, matches) => matches.source === data.me || matches.target === data.me,
      alertText: (data, matches, output) => {
        const who = matches.source === data.me ? matches.target : matches.source;
        return output.run!({ player: data.ShortName(who) });
      },
      outputStrings: {
        run: {
          en: '줄 끊어요 (+${player})',
          ja: '線切 (+${player})',
        },
      },
    }, */
    //
    {
      id: 'ASSS+ Scream of the Fallen',
      type: 'GainsEffect',
      netRegex: { effectId: 'CDB' },
      condition: Conditions.targetIsYou(),
      preRun: (data, matches) => data.explosionTime = parseInt(matches.duration),
      durationSeconds: 12.5,
      infoText: (data, _matches, output) => {
        return data.explosionTime === 19 ? output.boom!() : output.tower!(); // 19초와 23초
      },
      outputStrings: {
        boom: {
          en: '먼저 폭파 (벽쪽에 대기)',
          ja: '先に爆発',
        },
        tower: {
          en: '먼저 타워 (한가운데로)',
          ja: '先に塔',
        },
      },
    },
    // 그라디아토르: Explosion(766A), Colossal Wreck(7669)도 여기서 표시
    {
      id: 'ASSS+ Explosion',
      type: 'StartsUsing',
      netRegex: { id: '766A', source: 'Gladiator of Sil\'dih' },
      preRun: (data) => data.explosionCounter = (data.explosionCounter ?? 0) + 1,
      infoText: (data, _matches, output) => {
        if (data.explosionCounter === 1)
          return data.explosionTime === 19 ? output.boom!() : output.tower!();
        else if (data.explosionCounter === 3)
          return data.explosionTime === 23 ? output.boom!() : output.tower!();
      },
      outputStrings: {
        boom: {
          en: '벽쪽에서 터뜨려요',
          ja: '外側で爆発',
        },
        tower: {
          en: '타워 밟아요',
          ja: '塔踏み',
        },
      },
    },
    // 그라디아토르: Specter of Might
    {
      id: 'ASSS+ Specter of Might',
      type: 'StartsUsing',
      netRegex: { id: '7673', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => {
        data.rushNumbers = [];
        data.rushCasts = [];
      },
    },
    // 그라디아토르: Rush of Might Number
    {
      id: 'ASSS+ Rush of Might Number',
      type: 'StartsUsing',
      netRegex: { id: ['7658', '7659', '765A'], source: 'Gladiator Mirage' },
      preRun: (data) => data.rushCounter++,
      durationSeconds: 9.4,
      infoText: (data, matches, output) => {
        const i2n: { [id: string]: number } = {
          '7658': 1,
          '7659': 2,
          '765A': 3,
        };
        data.rushNumbers.push(i2n[matches.id] ?? 0);
        if (data.rushNumbers.length !== 2)
          return;

        if (data.rushNumbers[0] === undefined || data.rushNumbers[1] === undefined)
          return output.unknown!();

        const n2s: { [id: number]: string } = {
          0: output.unknown!(),
          1: output.num1!(),
          2: output.num2!(),
          3: output.num3!(),
        };
        return output.rush!({ num1: n2s[data.rushNumbers[0]], num2: n2s[data.rushNumbers[1]] });
      },
      outputStrings: {
        rush: {
          en: '${num1} + ${num2}',
          ja: '${num1} + ${num2}',
        },
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        unknown: Outputs.unknown,
      },
    },
    // 그라디아토르: Rush of Might 위치
    {
      id: 'ASSS+ Rush of Might Collect',
      type: 'StartsUsing',
      netRegex: { id: ['765C', '765B'], source: 'Gladiator of Sil\'dih' },
      preRun: (data, matches) => data.rushCasts.push(matches),
    },
    // 그라디아토르: Rush of Might
    {
      id: 'ASSS+ Rush of Might',
      type: 'StartsUsing',
      netRegex: { id: ['765C', '765B'], source: 'Gladiator of Sil\'dih', capture: false },
      delaySeconds: 0.1,
      durationSeconds: 9.5,
      suppressSeconds: 1,
      infoText: (data, _matches, output) => {
        if (data.rushCasts.length !== 4)
          return;

        const mirage1 = data.rushCasts[0];
        const unkmir1 = data.rushCasts[1];
        const unkmir2 = data.rushCasts[2];
        if (mirage1 === undefined || unkmir1 === undefined || unkmir2 === undefined)
          throw new UnreachableCode();
        const mirage2 = mirage1.x === unkmir1.x && mirage1.y === unkmir1.y ? unkmir2 : unkmir1;

        const x1 = parseFloat(mirage1.x);
        const y1 = parseFloat(mirage1.y);
        const x2 = parseFloat(mirage2.x);
        const y2 = parseFloat(mirage2.y);
        const getRushOffset = (x: number) => {
          if (x > -46 && x < -43 || x > -27 && x < -24)
            return 3;
          if (x > -41 && x < -38 || x > -32 && x < -29)
            return 2;
          if (x > -37 && x < -33)
            return 1;
          return x;
        };
        const o1 = getRushOffset(x1);
        const o2 = getRushOffset(x2);
        const line = o1 > o2 ? o1 : o2;

        let dir;
        if (y1 < -271) {
          const x = y1 < y2 ? x1 : x2;
          dir = x < -35 ? 'west' : 'east';
        } else {
          const x = y1 > y2 ? x1 : x2;
          dir = x < -35 ? 'west' : 'east';
        }

        const dir2left: { [id: number]: string } = {
          1: output.l1!(),
          2: output.l2!(),
          3: output.l3!(),
        };
        const dir2right: { [id: number]: string } = {
          1: output.r1!(),
          2: output.r2!(),
          3: output.r3!(),
        };
        const even = data.rushCounter % 4 === 0;

        let arrow;
        let side;
        if (o1 === 2 && o2 === 3 || o1 === 3 && o2 === 2) {
          if (dir === 'west') {
            side = 'east';
            arrow = even ? dir2right[line] : dir2left[line];
          } else {
            side = 'west';
            arrow = even ? dir2left[line] : dir2right[line];
          }
        } else {
          if (dir === 'west') {
            side = 'west';
            arrow = even ? dir2right[line] : dir2left[line];
          } else {
            side = 'east';
            arrow = even ? dir2left[line] : dir2right[line];
          }
        }

        if (even)
          return output.rushrev!({ arrow: arrow, side: output[side]!() });
        return output.rush!({ arrow: arrow, side: output[side]!() });
      },
      run: (data) => data.rushCasts = [],
      outputStrings: {
        rush: {
          en: '${arrow} ${side}',
          ja: '${arrow} ${side}',
        },
        rushrev: {
          en: '${arrow} ${side} (남쪽 보고)',
          ja: '${arrow} ${side} (南向き)',
        },
        east: Outputs.right,
        west: Outputs.left,
        l1: {
          en: '🡸',
          ja: '🡸',
        },
        l2: {
          en: '🡸🡸',
          ja: '🡸🡸',
        },
        l3: {
          en: '🡸🡸🡸',
          ja: '🡸🡸🡸',
        },
        r1: {
          en: '🡺',
          ja: '🡺',
        },
        r2: {
          en: '🡺🡺',
          ja: '🡺🡺',
        },
        r3: {
          en: '🡺🡺🡺',
          ja: '🡺🡺🡺',
        },
      },
    },
    // 그라디아토르: Rush of Might Move
    {
      id: 'ASSS+ Rush of Might Move',
      type: 'Ability',
      netRegex: { id: '765B', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      response: Responses.moveAway(),
    },
    // 그라디아토르: Hateful Visage Collect
    {
      id: 'ASSS+ Hateful Visage',
      type: 'StartsUsing',
      netRegex: { id: '766E', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => data.visageType = 'hateful',
    },
    // 그라디아토르: Accursed Visage Collect
    {
      id: 'ASSS+ Accursed Visage',
      type: 'StartsUsing',
      netRegex: { id: '768D', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => {
        data.visageType = 'accursed';
        data.visageCounter = 0;
      },
    },
    // 그라디아토르: Wrath of Ruin
    {
      id: 'ASSS+ Wrath of Ruin',
      type: 'StartsUsing',
      netRegex: { id: '7663', source: 'Gladiator of Sil\'dih', capture: false },
      infoText: (data, _matches, output) => {
        if (data.visageType === 'hateful')
          return output.hateful!();
        /* else if (data.visageType === 'accursed')
          return output.accursed!();*/
      },
      outputStrings: {
        hateful: {
          en: '얼굴 빔 피해요',
          ja: '顔からビーム',
        },
        accursed: {
          en: '얼굴 빔 맞아야죠',
          ja: '顔からのビームに当たって',
        },
      },
    },
    // 그라디아토르: Gilded/Silvered Fate
    {
      id: 'ASSS+ Gilded/Silvered Fate',
      type: 'GainsEffect',
      netRegex: { effectId: ['CDF', 'CE0'] },
      condition: Conditions.targetIsYou(),
      durationSeconds: 8,
      infoText: (data, matches, output) => {
        data.visageCounter = (data.visageCounter ?? 0) + 1;
        if (data.visageCounter > 1)
          return;
        if (matches.effectId === 'CDF') {
          if (matches.count === '02')
            return output.g2!();
          return output.gs!();
        }
        if (matches.count === '02')
          return output.s2!();
        return output.gs!();
      },
      outputStrings: {
        g2: {
          en: '은🥈 두개',
          ja: '銀🥈 二つ',
        },
        s2: {
          en: '금🥇 두개',
          ja: '金🥇 二つ',
        },
        gs: {
          en: '금🥇은🥈 하나씩',
          ja: '金🥇銀🥈 一個ずつ',
        },
      },
    },
    // ---------------- Shadowcaster Zeless Gah ----------------
    {
      id: 'ASSS Show of Strength',
      type: 'StartsUsing',
      netRegex: { id: '74AF', source: 'Shadowcaster Zeless Gah', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'ASSS Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: { id: '74AD', source: 'Shadowcaster Zeless Gah' },
      response: Responses.tankCleave(),
    },
    {
      id: 'ASSS Infern Brand Counter',
      type: 'StartsUsing',
      netRegex: { id: '7491', source: 'Shadowcaster Zeless Gah', capture: false },
      preRun: (data) => {
        data.brandCounter++;
        data.arcaneFontCounter = 0;
      },
      durationSeconds: 3,
      infoText: (data, _matches, output) => {
        switch (data.brandCounter) {
          case 1:
            return output.p1!();
          case 2:
            return output.p2!();
          case 3:
            return output.p3!();
          case 4:
            return output.p4!();
          case 5:
            return output.p5!();
        }
      },
      outputStrings: {
        p1: {
          en: '① 돌아가는 동글동글',
          ja: '回る杖、安置探せ',
        },
        p2: {
          en: '② 마법진 커팅식',
          ja: '魔法陣: 北→🟥 / 西→🟦',
        },
        p3: {
          en: '③ 전이 기둥과 놀아요',
          ja: '転移と遊びましょう',
        },
        p4: {
          en: '④ 카드 전이 놀이',
          ja: 'カード転移、安置探せ',
        },
        p5: {
          en: '⑤ 1/2→가운데, 3/4→파란선 지팡이',
          ja: '1/2→真ん中, 3/4→青線つき杖',
        },
      },
    },
    {
      id: 'ASSS Arcane Font Tracker',
      type: 'AddedCombatant',
      netRegex: { name: 'Arcane Font', capture: false },
      // Only run this trigger for second Infern Band, first set of portals
      condition: (data) => data.myFlame === undefined,
      run: (data) => data.arcaneFontCounter++,
    },
    {
      id: 'ASSS Infern Brand Collect',
      // Count field on 95D on Infern Brand indicates Brand's number:
      //   1C2 - IC5, Orange 1 - 4
      //   1C6 - 1C9, Blue 1 - 4
      type: 'GainsEffect',
      netRegex: { effectId: '95D', target: 'Infern Brand' },
      run: (data, matches) => data.brandEffects[parseInt(matches.targetId, 16)] = matches.count,
    },
    {
      id: 'ASSS Infern Brand 2 Starting Corner',
      // CC4 First Brand
      // CC5 Second Brand
      // CC6 Third Brand
      // CC7 Fourth Brand
      type: 'GainsEffect',
      netRegex: { effectId: ['CC4', 'CC5', 'CC6', 'CC7'] },
      condition: (data, matches) => data.me === matches.target,
      delaySeconds: 0.1, // Delay to collect all Infern Brand Effects
      durationSeconds: (_data, matches) => parseFloat(matches.duration) - 0.1,
      infoText: (data, matches, output) => {
        const brandMap: { [effectId: string]: number } = {
          'CC4': 1,
          'CC5': 2,
          'CC6': 3,
          'CC7': 4,
        };
        const myNum = brandMap[matches.effectId];
        if (myNum === undefined)
          throw new UnreachableCode();

        // 5번일때
        if (data.brandCounter === 5)
          return output.brandNum!({ num: output['num' + myNum.toString()]!() });

        // 2번일때
        if (data.brandCounter !== 2)
          return;

        // Store for later trigger
        data.myFlame = myNum;

        if (Object.keys(data.brandEffects).length !== 8) {
          // Missing Infern Brands, output number
          return output.brandNum!({ num: output['num' + myNum.toString()]!() });
        }

        // Brands are located along East and South wall and in order by id
        // Blue N/S:
        //   304.00, -108.00, Used for NW/NE, 0 north
        //   304.00, -106.00, Used for NW/NE, 1 north
        //   304.00, -104.00, Used for SW/SE, 2 south
        //   304.00, -102.00, Used for SW/SE, 3 south
        // Orange E/W:
        //   286.00, -85.00, Used for SW/NW, 4 west
        //   288.00, -85.00, Used for SW/NW, 5 west
        //   290.00, -85.00, Used for SE/NE, 6 east
        //   292.00, -85.00, Used for SE/NE, 7 east
        // Set brandEffects to descending order to match
        const brandEffects = Object.entries(data.brandEffects).sort((a, b) => a[0] > b[0] ? -1 : 1);

        // Get just the effectIds
        const effectIds = brandEffects.map((value) => {
          return value.slice(1, 2)[0];
        });

        // Split the results
        const blueBrands = effectIds.slice(0, 4);
        const orangeBrands = effectIds.slice(4, 8);

        const myNumToBlue: { [num: number]: string } = {
          4: '1C9',
          3: '1C8',
          2: '1C7',
          1: '1C6',
        };
        const myNumToOrange: { [num: number]: string } = {
          4: '1C5',
          3: '1C4',
          2: '1C3',
          1: '1C2',
        };

        // Find where our numbers are in each set of brands
        const x = orangeBrands.indexOf(myNumToOrange[myNum]);
        const y = blueBrands.indexOf(myNumToBlue[myNum]) + 4;
        const indexToCardinal: { [num: number]: string } = {
          0: 'north',
          1: 'north',
          2: 'south',
          3: 'south',
          4: 'west',
          5: 'west',
          6: 'east',
          7: 'east',
        };

        const cardX = indexToCardinal[x];
        const cardY = indexToCardinal[y];

        // Not able to be undefined as values determined from array that only has 8 indices
        if (cardX === undefined || cardY === undefined)
          throw new UnreachableCode();

        return output.text!({ num: output['num' + myNum.toString()]!(), corner: output[cardX + cardY]!() });
      },
      run: (data) => data.brandEffects = {},
      outputStrings: {
        text: {
          en: '내 브렌드 ${num}: ${corner}',
        },
        brandNum: {
          en: '내 브렌드 ${num}',
        },
        northwest: Outputs.arrowNW,
        northeast: Outputs.arrowNE,
        southeast: Outputs.arrowSE,
        southwest: Outputs.arrowSW,
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        num4: Outputs.cnum4,
      },
    },
    {
      id: 'ASSS Infern Brand 2 First Flame',
      // CC8 First Flame
      // CC9 Second Flame
      // CCA Third Flame
      // CCB Fourth Flame
      type: 'GainsEffect',
      netRegex: { effectId: 'CC8' },
      condition: (data, matches) => data.me === matches.target && data.brandCounter === 2,
      alertText: (data, _matches, output) => {
        // Blue lines cut when three (West)
        if (data.arcaneFontCounter === 3) {
          // Set to two for 5th cut's color
          data.arcaneFontCounter = 2;
          return output.cutBlueOne!();
        }

        // Orange lines cut when two (North)
        if (data.arcaneFontCounter === 2) {
          // Set to three for 5th cut's color
          data.arcaneFontCounter = 3;
          return output.cutOrangeOne!();
        }
        return output.firstCut!();
      },
      outputStrings: {
        cutBlueOne: {
          en: '🟦파랑① 잘라요',
        },
        cutOrangeOne: {
          en: '🟥빨강① 잘라요',
        },
        firstCut: {
          en: '먼저 잘라요',
        },
      },
    },
    {
      id: 'ASSS Infern Brand 2 First Cuts',
      // This method works safely for cuts 2,3 and 4 by tracking Infern Brand losing debuff
      // Player receives Magic Vulnerability Up afterward which we need to wait on for safety
      // However, it is also possible to receive the same Magic Vulnerability Up for Cast Shadow
      // Alternative method would use Cryptic Flames hit +8s to trigger second cut callout, which is safe
      // but may be unreliable if cuts are made out of order
      type: 'LosesEffect',
      netRegex: { effectId: '95D', target: 'Infern Brand', count: '1C[2-9]' },
      condition: (data) => data.myFlame !== undefined && data.brandCounter === 2,
      preRun: (data) => data.flameCounter++,
      response: (data, matches, output) => {
        // cactbot-builtin-response
        output.responseOutputStrings = {
          cutOrangeNum: {
            en: '🟥빨강${num} 잘라요',
          },
          cutBlueNum: {
            en: '🟦파랑${num} 잘라요',
          },
          orangeNum: {
            en: '🟥빨강${num}',
          },
          blueNum: {
            en: '🟦파랑${num}',
          },
          num1: Outputs.cnum1,
          num2: Outputs.cnum2,
          num3: Outputs.cnum3,
          num4: Outputs.cnum4,
        };

        const countToNum: { [count: string]: number } = {
          '1C9': 4,
          '1C8': 3,
          '1C7': 2,
          '1C6': 1,
          '1C5': 4,
          '1C4': 3,
          '1C3': 2,
          '1C2': 1,
        };

        const flameCut = countToNum[matches.count];
        if (flameCut === undefined)
          return;

        // Wraparound and add 1 as we need next flame to cut
        if (flameCut % 4 + 1 !== data.myFlame)
          return;

        const cnum = output['num' + data.myFlame.toString()]!();
        if (data.arcaneFontCounter === 3 && matches.count.match(/1C[6-9]/)) {
          // Expected Blue and count is Blue
          data.arcaneFontCounter = 2;
          if (data.flameCounter < 4)
            return { alertText: output.cutBlueNum!({ num: cnum }) };
          return { infoText: output.blueNum!({ num: cnum }) };
        }
        if (data.arcaneFontCounter === 2 && matches.count.match(/1C[2-5]/)) {
          // Expected Orange and count is Orange
          data.arcaneFontCounter = 3;
          if (data.flameCounter < 4)
            return { alertText: output.cutOrangeNum!({ num: cnum }) };
          return { infoText: output.orangeNum!({ num: cnum }) };
        }
        // Unexpected result, mechanic is likely failed at this point
      },
      run: (data) => data.brandEffects = {},
    },
    /* //
    {
      id: 'AS+ 젤레스가 Cryptic Portal',
      type: 'StartsUsing',
      netRegex: { id: '7494', source: 'Shadowcaster Zeless Gah' },
    },*/
    //
    {
      id: 'ASSS+ Firesteel Strike',
      type: 'StartsUsing',
      netRegex: { id: '74B0', source: 'Shadowcaster Zeless Gah' },
      response: Responses.spread(),
      run: (data) => data.firesteelStrikes = [],
    },
    //
    {
      id: 'ASSS+ Firesteel Strike Collect',
      type: 'Ability',
      netRegex: { id: ['74B1', '74B2'], source: 'Shadowcaster Zeless Gah' },
      run: (data, matches) => data.firesteelStrikes?.push(matches.target),
    },
    //
    {
      id: 'ASSS+ Blessed Beacon',
      type: 'StartsUsing',
      netRegex: { id: '74B3', source: 'Shadowcaster Zeless Gah' },
      response: (data, _matches, output) => {
        if (data.firesteelStrikes === undefined || data.firesteelStrikes.length === 0)
          return { infoText: output.text!() };

        if (data.firesteelStrikes.includes(data.me))
          return { alarmText: output.behind!() };

        const players: string[] = [];
        data.firesteelStrikes.forEach((value) => players.push(data.ShortName(value)));
        return { infoText: output.front!({ players: players.join(', ') }) };
      },
      outputStrings: {
        text: {
          en: '두 번 내려치기',
          ja: '2回打ち下ろし',
        },
        front: {
          en: '앞에서 막아요 (${players})',
          ja: '前でカーバ (${players})',
        },
        behind: {
          en: '뒤로 숨어요',
          ja: '後ろに隠れる',
        },
      },
    },
    //
    {
      id: 'ASSS+ Banishment Debuff',
      type: 'GainsEffect',
      netRegex: { effectId: 'B9A' },
      condition: Conditions.targetIsYou(),
      infoText: (data, matches, output) => {
        if (matches.count === '1D2')
          data.banishment = 'redRight';
        else if (matches.count === '1D3')
          data.banishment = 'blueLeft';
        else if (matches.count === '1CD')
          data.banishment = 'blueRight';
        else if (matches.count === '1CE')
          data.banishment = 'redLeft';
        else
          throw new UnreachableCode();

        return output[data.banishment]!();
      },
      outputStrings: {
        redLeft: {
          en: '🡸 첫째줄',
          ja: '🡸 1列',
        },
        redRight: {
          en: '둘째줄 🡺',
          ja: '2列 🡺',
        },
        blueRight: {
          en: '셋째줄 🡺',
          ja: '3列 🡺',
        },
        blueLeft: {
          en: '🡸 맨아랫줄',
          ja: '🡸 一番下列',
        },
      },
    },
    //
    {
      id: 'ASSS+ Brands P5',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[4-7]' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 11,
      infoText: (data, _matches, output) => {
        if (data.brandCounter !== 5)
          return;
        if (data.myFlame === 1 || data.myFlame === 1)
          return output.f12!();
        if (data.myFlame === 3 || data.myFlame === 4)
          return output.f34!();
      },
      outputStrings: {
        f12: {
          en: '줄끊고 → 3/4 기둘 → 지팡이 불꽃 → 장판깔기',
          ja: '線切 → 3/4待つ → 杖の炎 → ゆか',
        },
        f34: {
          en: '지팡이 불꽃 → 줄끊고 → 원위치 → 장판깔기',
          ja: '杖の炎 → 線切 → 戻る → ゆか',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'en',
      'replaceText': {
        '(?<!/ )Chilling Duster / Fizzling Duster': 'Chilling/Fizzling Duster',
        'Bracing Suds / Chilling Suds(?! )': 'Bracing/Chilling Suds',
        'Bracing Duster / Chilling Duster(?! )': 'Bracing/Chilling Duster',
        'Bracing Suds / Fizzling Suds': 'Bracing/Fizzling Suds',
        'Bracing Duster / Fizzling Duster': 'Bracing/Fizzling Duster',
        'Bracing Duster / Chilling Duster / Fizzling Duster': 'Duster',
        'Bracing Suds / Chilling Suds / Fizzling Suds': 'Suds',
      },
    },
    {
      'locale': 'ja',
      'missingTranslations': true,
      'replaceSync': {
        'Gladiator of Sil\'dih': 'シラディハ・グラディアトル',
        'Gladiator Mirage': 'ミラージュ・グラディアトル',
        'Infern Brand': 'アマルジャの呪具',
        'Silkie': 'シルキー',
        'Shadowcaster Zeless Gah': '影火のゼレズ・ガー',
        'Thunderous Echo': '重怨の残響',
        'Lingering Echoes': '連呪の残響',
        'Echo of the Fallen': '呪怨の残響',
        'Gilded Fate': '黄金の呪い',
        'Silvered Fate': '白銀の呪い',
        'Golden Flame': '黄金の閃火',
        'Silver Flame': '白銀の閃火',
        'Scream of the Fallen': '呪怨の大残響',
      },
      'replaceText': {
        '(?<!/ )Chilling Duster / Fizzling Duster': 'ひえひえ/ぱちぱちダスター',
        'Accursed Visage': '呪怨呪像',
        'Banishment': '強制転移の呪',
        'Blazing Benifice': '聖火砲',
        'Blessed Beacon': '天の聖火',
        'Bracing Suds / Chilling Suds(?! )': 'そよそよ/ひえひえシャンプー',
        'Bracing Duster / Chilling Duster(?! )': 'そよそよ/ひえひえダスター',
        'Bracing Suds / Fizzling Suds': 'そよそよ/ぱちぱちシャンプー',
        'Bracing Duster / Fizzling Duster': 'そよそよ/ぱちぱちダスター',
        'Bracing Duster / Chilling Duster / Fizzling Duster': 'ダスター',
        'Bracing Suds / Chilling Suds / Fizzling Suds': 'シャンプー',
        'Bracing Suds': 'そよそよシャンプー',
        'Burn': '火球',
        'Carpet Beater': 'カーペットビーター',
        'Cast Shadow': '影火呪式',
        'Chilling Suds': 'ひえひえシャンプー',
        'Colossal Wreck': '亡国の霊塔',
        'Cryptic Flames': '火焔の呪印',
        'Cryptic Portal': '転移の呪印',
        'Curse of the Fallen': '呪怨の咆哮',
        'Curse of the Monument': '呪怨の連撃',
        'Dust Bluster': 'ダストブロワー',
        'Eastern Ewers': '洗い壺',
        'Echo of the Fallen': '呪怨の咆哮',
        'Explosion': '爆発',
        'Firesteel Fracture': '石火豪打',
        'Firesteel Strike': '石火豪衝',
        'Fizzling Suds': 'ぱちぱちシャンプー',
        'Flash of Steel': '闘人の波動',
        'Fresh Puff': 'ポンポン創出',
        'Gold Flame': '黄金の閃火',
        'Hateful Visage': '呪像起動',
        'Infern Brand': '呪具設置',
        'Infern Ward': '呪具警陣',
        'Infern Wave': '呪具流火',
        'Mighty Smite': '闘人の斬撃',
        'Nothing beside Remains': '座下隆起',
        'Pure Fire': '劫火',
        'Ring of Might': '大剛の旋撃',
        'Rush of Might': '大剛の突撃',
        'Scream of the Fallen': '呪怨の大残響',
        'Sculptor\'s Passion': '闘人砲',
        'Show of Strength': '勇士の咆哮',
        'Silver Flame': '白銀の閃火',
        'Slippery Soap': 'すべってシャンプーボム',
        'Soap\'s Up': 'シャンプーボム',
        'Soaping Spree': 'みんなでシャンプーボム',
        'Specter of Might': '亡念幻身',
        'Total Wash': '水拭き',
        'Wrath of Ruin': '亡念励起',
        /*
        실키
        'Bracing Duster': '',
        'Chilling Duster': '',
        'Fizzling Duster': '',
        'Puff and Tumble': '',
        'Rinse': '',
        'Soapsud Static': '',
        'Squeaky Clean': '',
        그라
        'Sundered Remains': '',
        */
      },
    },
  ],
};

export default triggerSet;
