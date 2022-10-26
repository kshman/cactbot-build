import Conditions from '../../../../../resources/conditions';
import NetRegexes from '../../../../../resources/netregexes';
import { UnreachableCode } from '../../../../../resources/not_reached';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { PluginCombatantState } from '../../../../../types/event';
import { NetMatches } from '../../../../../types/net_matches';
import { TriggerSet } from '../../../../../types/trigger';

// TODO: Silkie specify which puff to get behind in first Slippery Soap
// TODO: Silkie specify where to point puff's tether
// TODO: Silkie call puff to go to for safety
// TODO: Additional Gladiator triggers and adjustments to timeline
// TODO: Additional Shadowcaster triggers and adjustments to timeline

export type Banishment = 'redLeft' | 'redRight' | 'blueLeft' | 'blueRight';

export interface Data extends RaidbossData {
  suds?: string;
  cleanCounter: 0;
  soapCounter: number;
  freshPuff: number;
  beaterCounter: number;
  hasLingering?: boolean;
  thunderousEchoPlayer?: string;
  rushCounter: number;
  rushNumbers: number[];
  rushCasts: (NetMatches['StartsUsing'])[];
  visageType?: 'hateful' | 'accursed';
  visageCounter?: number;
  explosionCounter?: number;
  explosionTime?: number;
  brandPhase: number;
  myBrand?: number;
  firesteelStrikes?: string[];
  banishment?: Banishment;

  arcaneFonts: PluginCombatantState[];
}

const triggerSet: TriggerSet<Data> = {
  zoneId: ZoneId.AnotherSildihnSubterrane,
  timelineFile: 'another_sildihn_subterrane.txt',
  initData: () => {
    return {
      cleanCounter: 0,
      soapCounter: 0,
      freshPuff: 0,
      beaterCounter: 0,
      rushCounter: 0,
      rushNumbers: [],
      rushCasts: [],
      brandPhase: 0,
      arcaneFonts: [],
    };
  },
  triggers: [
    // ---------------- first trash ----------------
    {
      id: 'ASS Atropine Spore',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7960', source: 'Aqueduct Belladonna', capture: false }),
      response: Responses.getIn(),
    },
    {
      id: 'ASS Frond Affront',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7961', source: 'Aqueduct Belladonna', capture: false }),
      response: Responses.lookAway(),
    },
    {
      id: 'ASS Deracinator',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7962', source: 'Aqueduct Belladonna' }),
      response: Responses.tankBuster(),
    },
    {
      id: 'ASS Left Sweep',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7964', source: 'Aqueduct Kaluk', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    {
      id: 'ASS Right Sweep',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7963', source: 'Aqueduct Kaluk', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    {
      id: 'ASS Creeping Ivy',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7965', source: 'Aqueduct Kaluk', capture: false }),
      response: Responses.getBehind(),
    },
    {
      id: 'ASS Honeyed Left',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795B', source: 'Aqueduct Udumbara', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🡺오른쪽',
          ja: '🡺右',
        },
      },
    },
    {
      id: 'ASS Honeyed Right',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795C', source: 'Aqueduct Udumbara', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '왼쪽🡸',
          ja: '左🡸',
        },
      },
    },
    {
      id: 'ASS Honeyed Front',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '795D', source: 'Aqueduct Udumbara', capture: false }),
      response: Responses.getBehind(),
    },
    {
      id: 'ASS Arboreal Storm',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7957', source: 'Aqueduct Dryad', capture: false }),
      response: Responses.getOut(),
    },
    // Aqueduct Odqan: Gelid Gale
    {
      id: 'ASS+ Gelid Gale',
      type: 'StartsUsing',
      netRegex: { id: '7959', source: 'Aqueduct Odqan', capture: false },
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
      id: 'ASS+ Uproot',
      type: 'StartsUsing',
      netRegex: { id: '795A', source: 'Aqueduct Odqan', capture: false },
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
      id: 'ASS Soap\'s Up',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775A', source: 'Silkie', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '🟡비스듬 → 십자➕로',
          ja: '🟡斜め → 十字➕で',
        },
      },
    },
    {
      id: 'ASS Dust Bluster',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '776C', source: 'Silkie', capture: false }),
      response: Responses.knockback(),
    },
    {
      id: 'ASS Squeaky Clean Right',
      type: 'StartsUsing',
      netRegex: { id: ['7751', '7755'], source: 'Silkie', capture: false },
      infoText: (data, _matches, output) => {
        // 왼쪽도 그렇지만 엄청 패다보면(!) 기믹이 스킵되는데 7755, 7756이 스킵되버린다.
        // 두번 나오게하기 싫어서 이런짓...
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
      id: 'ASS Squeaky Clean Left',
      type: 'StartsUsing',
      netRegex: { id: ['7752', '7756'], source: 'Silkie', capture: false },
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
      id: 'ASS Suds Collect',
      // 7757 Bracing Suds (Wind / Donut)
      // 7758 Chilling Suds (Ice / Cardinal)
      // 7759 Fizzling Suds (Lightning / Intercardinal)
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7757', '7758', '7759'], source: 'Silkie' }),
      run: (data, matches) => data.suds = matches.id,
    },
    {
      id: 'ASS Slippery Soap',
      // Happens 5 times in the encounter
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '79FB', source: 'Silkie' }),
      preRun: (data) => data.soapCounter++,
      alertText: (data, matches, output) => {
        if (data.suds === '7757') {
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
      id: 'ASS Slippery Soap with Chilling Suds',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '775E', source: 'Silkie' }),
      condition: (data) => data.suds === '7758',
      delaySeconds: (_data, matches) => parseFloat(matches.castTime) - 1,
      response: Responses.moveAround(),
    },
    {
      id: 'ASS Slippery Soap After',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '775E', source: 'Silkie', capture: false }),
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case '7757':
            return output.getUnder!();
          case '7758':
            return output.intercards!();
          case '7759':
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
      id: 'ASS Carpet Beater',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '774F', source: 'Silkie' }),
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
      id: 'ASS Soaping Spree',
      // Boss does not cast Fizzling Duster with Soaping Spree
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7767', source: 'Silkie', capture: false }),
      infoText: (data, _matches, output) => {
        switch (data.suds) {
          case '7757':
            return output.getUnder!();
          case '7758':
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
      id: 'ASS Total Wash',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7750', source: 'Silkie', capture: false }),
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
      id: 'ASS+ Fresh Puff',
      type: 'StartsUsing',
      netRegex: { id: '7766', source: 'Silkie' },
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
      id: 'ASS Infernal Pain',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7969', source: 'Sil\'dihn Dullahan', capture: false }),
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
      id: 'ASS Blighted Gloom',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7966', source: 'Sil\'dihn Dullahan', capture: false }),
      response: Responses.getOut(),
    },
    {
      id: 'ASS Infernal Weight',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796B', source: 'Aqueduct Armor', capture: false }),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '헤비, 발 밑으로',
          ja: 'ヘビィ, 足元へ',
        },
      },
    },
    {
      id: 'ASS Dominion Slash',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '796A', source: 'Aqueduct Armor', capture: false }),
      response: Responses.getBehind(),
    },
    // Sil'dihn Dullahan: King's Will
    {
      id: 'ASS+ King\'s Will',
      type: 'StartsUsing',
      netRegex: { id: '7968', source: 'Sil\'dihn Dullahan', capture: false },
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
      id: 'ASS+ Hells\' Nebula',
      type: 'StartsUsing',
      netRegex: { id: '796C', source: 'Aqueduct Armor', capture: false },
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
      id: 'ASS Flash of Steel',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7671', source: 'Gladiator of Sil\'dih', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'ASS Sculptor\'s Passion',
      // This is a wild charge, player in front takes most damage
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '6854', source: 'Gladiator of Sil\'dih' }),
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
      id: 'ASS Mighty Smite',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '7672', source: 'Gladiator of Sil\'dih' }),
      response: Responses.tankBuster(),
    },
    {
      id: 'ASS Lingering Echoes',
      // CDC Lingering Echoes (Spread + Move)
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDC' }),
      condition: Conditions.targetIsYou(),
      preRun: (data) => data.hasLingering = true,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 2,
      // response: Responses.moveAway(),
    },
    {
      id: 'ASS Thunderous Echo Collect',
      // CDD Thunderous Echo (Stack)
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDD' }),
      preRun: (data, matches) => data.thunderousEchoPlayer = matches.target,
    },
    {
      id: 'ASS Curse of the Fallen',
      // CDA Echoes of the Fallen (Spread)
      // Two players will not have a second debuff, so check CDA
      // 14s = first
      // 17s = second
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDA' }),
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
      id: 'ASS Ring of Might',
      // There are 6 spells:
      //   Ring 1: 765D (9.7s) / 7660 (11.7s)
      //   Ring 2: 765E (9.7s) / 7661 (11.7s)
      //   Ring 3: 765F (9.7s) / 7662 (11.7s)
      // Only tracking the 11.7s spell
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: ['7660', '7661', '7662'], source: 'Gladiator of Sil\'dih' }),
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
      id: 'ASS Echoes of the Fallen Reminder',
      // CDA Echoes of the Fallen (Spread)
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDA' }),
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 3,
      response: Responses.spread(),
    },
    {
      id: 'ASS Thunderous Echo Reminder',
      // CDD Thunderous Echo (Stack)
      type: 'GainsEffect',
      netRegex: NetRegexes.gainsEffect({ effectId: 'CDD' }),
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
      id: 'ASS Curse of the Monument',
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
      id: 'ASS Curse of the Monument Break Chains',
      type: 'Ability',
      netRegex: NetRegexes.ability({ id: '7666', source: 'Gladiator of Sil\'dih', capture: false }),
      response: Responses.breakChains(),
    },
    /* {
      id: 'ASS+ Curse of the Monument Tether',
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
      id: 'ASS+ Scream of the Fallen',
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
      id: 'ASS+ Explosion',
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
      id: 'ASS+ Specter of Might',
      type: 'StartsUsing',
      netRegex: { id: '7673', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => {
        data.rushNumbers = [];
        data.rushCasts = [];
      },
    },
    // 그라디아토르: Rush of Might Number
    {
      id: 'ASS+ Rush of Might Number',
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
      id: 'ASS+ Rush of Might Collect',
      type: 'StartsUsing',
      netRegex: { id: ['765C', '765B'], source: 'Gladiator of Sil\'dih' },
      preRun: (data, matches) => data.rushCasts.push(matches),
    },
    // 그라디아토르: Rush of Might
    {
      id: 'ASS+ Rush of Might',
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
      id: 'ASS+ Rush of Might Move',
      type: 'Ability',
      netRegex: { id: '765B', source: 'Gladiator of Sil\'dih', capture: false },
      suppressSeconds: 1,
      response: Responses.moveAway(),
    },
    // 그라디아토르: Hateful Visage Collect
    {
      id: 'ASS+ Hateful Visage',
      type: 'StartsUsing',
      netRegex: { id: '766E', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => data.visageType = 'hateful',
    },
    // 그라디아토르: Accursed Visage Collect
    {
      id: 'ASS+ Accursed Visage',
      type: 'StartsUsing',
      netRegex: { id: '768D', source: 'Gladiator of Sil\'dih', capture: false },
      run: (data) => {
        data.visageType = 'accursed';
        data.visageCounter = 0;
      },
    },
    // 그라디아토르: Wrath of Ruin
    {
      id: 'ASS+ Wrath of Ruin',
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
      id: 'ASS+ Gilded/Silvered Fate',
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
      id: 'ASS Show of Strength',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74AF', source: 'Shadowcaster Zeless Gah', capture: false }),
      response: Responses.aoe(),
    },
    {
      id: 'ASS Firesteel Fracture',
      type: 'StartsUsing',
      netRegex: NetRegexes.startsUsing({ id: '74AD', source: 'Shadowcaster Zeless Gah' }),
      response: Responses.tankCleave(),
    },
    //
    {
      id: 'ASS+ Infern Brand',
      type: 'StartsUsing',
      netRegex: { id: '7491', source: 'Shadowcaster Zeless Gah' },
      preRun: (data) => data.brandPhase++,
      infoText: (data, _matches, output) => {
        if (data.brandPhase === 1)
          return output.p1!();
        if (data.brandPhase === 2)
          return output.p2!();
        if (data.brandPhase === 3)
          return output.p3!();
        if (data.brandPhase === 4)
          return output.p4!();
        if (data.brandPhase === 5)
          return output.p5!();
      },
      outputStrings: {
        p1: {
          // AddCombatant 03:4000A70A:Ball of Fire 4개
          en: '돌아가는 동글이 두개',
          ja: '回る杖、安置探せ',
        },
        p2: {
          en: '위? 빨강🟥 / 옆? 파랑🟦',
          ja: '魔法陣: 北→🟥 / 西→🟦',
        },
        p3: {
          en: '전이 기둥과 놀아요',
          ja: '転移と遊びましょう',
        },
        p4: {
          en: '카드 전이, 안전지대를 찾아요',
          ja: 'カード転移、安置探せ',
        },
        p5: {
          en: '1/2→가운데, 3/4→파란선 지팡이',
          ja: '1/2→真ん中, 3/4→青線つき杖',
        },
      },
    },
    /* //
    {
      id: 'ASS+ Infern Brand 2nd',
      type: 'StartsUsing',
      netRegex: { id: '7491', source: 'Shadowcaster Zeless Gah' },
      condition: (data) => data.brandPhase === 2,
      // delaySeconds: 4,
      durationSeconds: 8,
      promise: async (data, _matches) => {
        const result = await callOverlayHandler({
          call: 'getCombatants',
          names: ['Arcane Font'],
        });
        data.arcaneFonts = result.combatants;
      },
      alarmText: (data, _matches, output) => {
        if (data.arcaneFonts.length < 2)
          return;
        if (data.arcaneFonts[0] === undefined || data.arcaneFonts[1] === undefined)
          return;
        if (data.arcaneFonts[0].PosY < -124 && data.arcaneFonts[1]?.PosY < -124)
          return output.red!();
        return output.blue!();
        // return output.test!({ count: data.arcaneFonts.length });
      },
      outputStrings: {
        test: '갯수: ${count}',
        red: '빨강🟥부터',
        blue: '파랑🟦부터',
      },
    },*/
    /* //
    {
      id: 'AS+ 젤레스가 Cryptic Portal',
      type: 'StartsUsing',
      netRegex: { id: '7494', source: 'Shadowcaster Zeless Gah' },
    },*/
    //
    {
      id: 'ASS+ Firesteel Strike',
      type: 'StartsUsing',
      netRegex: { id: '74B0', source: 'Shadowcaster Zeless Gah' },
      response: Responses.spread(),
      run: (data) => data.firesteelStrikes = [],
    },
    //
    {
      id: 'ASS+ Firesteel Strike Collect',
      type: 'Ability',
      netRegex: { id: ['74B1', '74B2'], source: 'Shadowcaster Zeless Gah' },
      run: (data, matches) => data.firesteelStrikes?.push(matches.target),
    },
    //
    {
      id: 'ASS+ Blessed Beacon',
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
      id: 'ASS+ Brands',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[4-7]' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      infoText: (data, matches, output) => {
        if (matches.effectId === 'CC4')
          data.myBrand = 1;
        else if (matches.effectId === 'CC5')
          data.myBrand = 2;
        else if (matches.effectId === 'CC6')
          data.myBrand = 3;
        else if (matches.effectId === 'CC7')
          data.myBrand = 4;
        else
          throw new UnreachableCode();
        return output.text!({ num: output['num' + data.myBrand.toString()]!() });
      },
      outputStrings: {
        text: {
          en: '내 브랜드: ${num}',
          ja: '自分のブランド: ${num}',
        },
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        num4: Outputs.cnum4,
      },
    },
    //
    {
      id: 'ASS+ Frames',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[89AB]' },
      condition: Conditions.targetIsYou(),
      durationSeconds: (_data, matches) => parseFloat(matches.duration),
      infoText: (data, matches, output) => {
        if (matches.effectId === 'CC8')
          data.myBrand = 1;
        else if (matches.effectId === 'CC9')
          data.myBrand = 2;
        else if (matches.effectId === 'CCA')
          data.myBrand = 3;
        else if (matches.effectId === 'CCB')
          data.myBrand = 4;
        else
          throw new UnreachableCode();
        return output.text!({ num: output['num' + data.myBrand.toString()]!() });
      },
      outputStrings: {
        text: {
          en: '내 플레임: ${num}',
          ja: '自分の火炎: ${num}',
        },
        num1: Outputs.cnum1,
        num2: Outputs.cnum2,
        num3: Outputs.cnum3,
        num4: Outputs.cnum4,
      },
    },
    //
    {
      id: 'ASS+ Frames Over',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[89AB]' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '안전 지대로 찾아 가욧',
          ja: '安置探して移動',
        },
      },
    },
    //
    {
      id: 'ASS+ Call of the Portal',
      type: 'GainsEffect',
      netRegex: { effectId: 'CCC' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) + 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '포탈 전이: 옆에 마커로 가욧',
          ja: 'ポータル転移: となりのマーカーへ',
        },
      },
    },
    //
    {
      id: 'ASS+ Rite of Passage',
      type: 'GainsEffect',
      netRegex: { effectId: 'CCD' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) + 1,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: '자가 전이: 옆에 마커로 가욧',
          ja: '自己転移: となりのマーカーへ',
        },
      },
    },
    //
    {
      id: 'ASS+ Banishment Debuff',
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
      id: 'ASS+ Brands P5',
      type: 'GainsEffect',
      netRegex: { effectId: 'CC[4-7]' },
      condition: Conditions.targetIsYou(),
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 3,
      durationSeconds: 11,
      infoText: (data, _matches, output) => {
        if (data.brandPhase !== 5)
          return;
        if (data.myBrand === 1 || data.myBrand === 1)
          return output.f12!();
        if (data.myBrand === 3 || data.myBrand === 4)
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
