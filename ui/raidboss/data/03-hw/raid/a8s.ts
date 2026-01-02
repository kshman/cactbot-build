import Conditions from '../../../../../resources/conditions';
import Outputs from '../../../../../resources/outputs';
import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  seenLinkUp?: boolean;
  lightning?: string;
  longNeedleStack?: string;
  longNeedlePrey: string[];
  verdictMin?: string;
  verdictMax?: string;
  water?: string;
}

// TODO: Final Punishment stack counts are in the network log, but not in ACT log :C
// e.g. 4 stacks:
//   26|2020-02-08T21:03:07.8080000-08:00|403|Final Punishment|
//   39.95|E0000000||1068E9CB|Potato Chippy|04|19062|||0bd20f2b57d49b17a19caa10e1fb8734
// TODO: chakram safe spots lol?

const triggerSet: TriggerSet<Data> = {
  id: 'AlexanderTheBurdenOfTheSonSavage',
  zoneId: ZoneId.AlexanderTheBurdenOfTheSonSavage,
  timelineFile: 'a8s.txt',
  initData: () => {
    return {
      longNeedlePrey: [],
    };
  },
  timelineTriggers: [
    {
      id: 'A8S Hydrothermal Missile',
      regex: /Hydrothermal Missile/,
      beforeSeconds: 3,
      response: Responses.tankCleave(),
    },
    {
      id: 'A8S Swindler Add',
      regex: /Swindler/,
      beforeSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Swindler Soon',
          ja: 'まもなくスウィンドラー',
          ko: '곧 조작자 등장',
        },
      },
    },
    {
      id: 'A8S Vortexer Add',
      regex: /Vortexer/,
      beforeSeconds: 5,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Vortexer Soon',
          ja: 'まもなくボルテッカー',
          ko: '곧 교반자 등장',
        },
      },
    },
    {
      id: 'A8S Flarethrower',
      regex: /Flarethrower/,
      beforeSeconds: 3,
      response: Responses.tankCleave(),
    },
    {
      id: 'A8S Super Jump Soon',
      regex: /Super Jump/,
      beforeSeconds: 8,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Bait Super Jump',
          ja: 'スーパージャンプを誘導',
          ko: '슈퍼 점프',
        },
      },
    },
  ],
  triggers: [
    {
      id: 'A8S Megabeam Onslaughter',
      type: 'StartsUsing',
      netRegex: { source: 'Onslaughter', id: '162E', capture: false },
      // Insert sound effect from Arthars here.
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Megabeamu~',
          ja: 'メガビーム～',
          ko: '고출력 광선~',
        },
      },
    },
    {
      id: 'A8S Megabeam Brute Justice',
      type: 'StartsUsing',
      netRegex: { source: 'Brute Justice', id: '1664', capture: false },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Megabeamu~!',
          ja: 'メガビーム～',
          ko: '고출력 광선~!',
        },
      },
    },
    {
      id: 'A8S Execution',
      type: 'Ability',
      netRegex: { source: 'Onslaughter', id: '1632', capture: false },
      condition: (data) => data.role === 'dps' || data.job === 'BLU',
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Kill Regulators',
          ja: 'スチームジャッジを倒す',
          ko: '증기 감독 없애기',
        },
      },
    },
    {
      id: 'A8S Perpetual Ray',
      type: 'StartsUsing',
      netRegex: { source: 'Onslaughter', id: '162B' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'A8S Blaster Mirage',
      type: 'AddedCombatant',
      netRegex: { name: 'Blaster Mirage', capture: false },
      suppressSeconds: 99999,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mirage',
          ja: 'ミラージュ',
          ko: '환영',
        },
      },
    },
    {
      id: 'A8S Discoid',
      type: 'HeadMarker',
      netRegex: { id: '0023' },
      condition: (data, matches) => {
        // Verdict comes with the same headmarker.
        return data.me === matches.target && !data.seenLinkUp;
      },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Orb on YOU',
          ja: '自分に玉',
          ko: '구슬 대상자',
        },
      },
    },
    {
      id: 'A8S Mind Blast',
      type: 'StartsUsing',
      netRegex: { source: 'Blaster', id: '1639' },
      condition: (data) => data.CanSilence(),
      response: Responses.interrupt('alarm'),
    },
    {
      id: 'A8S Low Arithmeticks',
      type: 'GainsEffect',
      // Note: both high and low use '0025' headmarker
      netRegex: { effectId: '3FD' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get High',
          ja: '高い床に乗る',
          ko: '높은곳으로',
        },
      },
    },
    {
      id: 'A8S High Arithmeticks',
      type: 'GainsEffect',
      netRegex: { effectId: '3FE' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      suppressSeconds: 10,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Down',
          ja: '低い床に乗る',
          ko: '낮은곳으로',
        },
      },
    },
    {
      id: 'A8S Bio-Arithmeticks',
      type: 'StartsUsing',
      netRegex: { source: 'Swindler', id: '164A', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'A8S Super Cyclone',
      type: 'StartsUsing',
      netRegex: { source: 'Vortexer', id: '1657', capture: false },
      response: Responses.knockback('alarm'),
    },
    {
      id: 'A8S Compressed Lightning',
      type: 'GainsEffect',
      // Note: also the 0045 headmarker.
      netRegex: { effectId: '400' },
      // TODO: do we need a Responses.effectOn() that uses matches.effect?
      alarmText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.thunderOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me !== matches.target)
          return output.thunderOn!({ player: data.party.member(matches.target) });
      },
      run: (data, matches) => data.lightning = matches.target,
      outputStrings: {
        thunderOn: {
          en: 'Thunder on ${player}',
          ja: '${player}に雷',
          ko: '"${player}" 번개징',
        },
        thunderOnYou: {
          en: 'Thunder on YOU',
          ja: '自分に雷',
          ko: '번개징 대상자',
        },
      },
    },
    {
      id: 'A8S Compressed Lightning Lose',
      type: 'LosesEffect',
      netRegex: { effectId: '400', capture: false },
      run: (data) => delete data.lightning,
    },
    {
      id: 'A8S Compressed Lightning Soon',
      type: 'GainsEffect',
      netRegex: { effectId: '400' },
      condition: (data) => data.lightning !== undefined,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      infoText: (data, _matches, output) => {
        return output.text!({ player: data.party.member(data.lightning) });
      },
      outputStrings: {
        text: {
          en: 'Thunder Soon on ${player}',
          ja: '${player}に雷頭割り',
          ko: '"${player}" 번개징 곧 터짐',
        },
      },
    },
    {
      id: 'A8S Enumeration',
      type: 'HeadMarker',
      netRegex: { id: ['0040', '0041', '0042'] },
      infoText: (data, matches, output) => {
        // 0040 = 2, 0041 = 3, 0042 = 4
        const count = 2 + parseInt(matches.id, 16) - parseInt('0040', 16);
        return output.text!({ player: data.party.member(matches.target), count: count });
      },
      outputStrings: {
        text: {
          en: '${player}: ${count}',
          ja: '${player}: ${count}',
          ko: '${player}: ${count}',
        },
      },
    },
    {
      id: 'A8S Double Rocket Punch',
      type: 'StartsUsing',
      netRegex: { source: 'Brute Justice', id: '1663' },
      alertText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.sharedTankbusterOnYou!();

        if (data.role === 'tank' || data.role === 'healer')
          return output.sharedTankbusterOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        sharedTankbusterOnYou: {
          en: 'Shared Tankbuster on YOU',
          ja: '自分にタンクシェア',
          ko: '쉐어 탱버 대상자',
        },
        sharedTankbusterOn: {
          en: 'Shared Tankbuster on ${player}',
          ja: '${player} にタンクシェア',
          ko: '"${player}" 쉐어 탱버',
        },
      },
    },
    {
      id: 'A8S Long Needle Stack Collect',
      type: 'HeadMarker',
      netRegex: { id: '003E' },
      run: (data, matches) => data.longNeedleStack = matches.target,
    },
    {
      id: 'A8S Long Needle Prey Collect',
      type: 'HeadMarker',
      netRegex: { id: '001E' },
      run: (data, matches) => data.longNeedlePrey.push(matches.target),
    },
    {
      id: 'A8S Short Needle',
      type: 'Ability',
      netRegex: { source: 'Brute Justice', id: '1668', capture: false },
      response: Responses.aoe(),
    },
    {
      id: 'A8S Long Needle',
      type: 'StartsUsing',
      netRegex: { source: 'Brute Justice', id: '166A', capture: false },
      condition: (data) => data.longNeedleStack !== undefined && data.longNeedlePrey.length !== 0,
      suppressSeconds: 10,
      alarmText: (data, _matches, output) => {
        if (data.longNeedlePrey.includes(data.me))
          return output.preyGetOut!();
      },
      alertText: (data, _matches, output) => {
        if (data.longNeedlePrey.includes(data.me))
          return;
        const target = data.longNeedleStack;
        if (target === data.me)
          return output.stackOnYou!();

        return output.stackOn!({ player: data.party.member(target) });
      },
      run: (data) => {
        delete data.longNeedleStack;
        data.longNeedlePrey = [];
      },
      outputStrings: {
        stackOnYou: Outputs.stackOnYou,
        stackOn: Outputs.stackOnPlayer,
        preyGetOut: {
          en: 'Prey: Get Out',
          ja: '赤いマーク: 外へ',
          ko: '빨간징: 밖으로',
        },
      },
    },
    {
      id: 'A8S Super Jump',
      type: 'StartsUsing',
      netRegex: { source: 'Brute Justice', id: '1665' },
      alertText: (data, matches, output) => {
        if (data.me !== matches.target)
          return;
        return output.superJumpOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me === matches.target)
          return;
        return output.superJumpOn!({ player: data.party.member(matches.target) });
      },
      outputStrings: {
        superJumpOn: {
          en: 'Super Jump on ${player}',
          ja: '${player}にスーパージャンプ',
          ko: '"${player}" 슈퍼 점프',
        },
        superJumpOnYou: {
          en: 'Super Jump on YOU',
          ja: '自分にスーパージャンプ',
          ko: '슈퍼 점프 대상자',
        },
      },
    },
    {
      id: 'A8S Mirage Marker',
      type: 'HeadMarker',
      netRegex: { id: '0008' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Mirage on YOU',
          ja: '自分にミラージュ',
          ko: '환영 징 대상자',
        },
      },
    },
    {
      id: 'A8S Ice Missile Marker',
      type: 'HeadMarker',
      netRegex: { id: '0043' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Ice Missile on YOU',
          ja: '自分にアイスミサイル',
          ko: '얼음 미사일 대상자',
        },
      },
    },
    {
      id: 'A8S Hidden Minefield Intermission',
      type: 'Ability',
      // 165E used in both intermission and in final phase
      // 165C only used for intermission
      netRegex: { source: 'Hidden Mine', id: '165E', capture: false },
      condition: (data) => !data.seenLinkUp,
      suppressSeconds: 10,
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get Mines',
          ja: '地雷を踏む',
          ko: '지뢰 밟아요',
        },
      },
    },
    {
      id: 'A8S Mirage Blinder',
      type: 'StartsUsing',
      netRegex: { source: 'Blaster Mirage', id: '165A' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Look Away from Mirage',
          ja: 'ミラージュを見ない',
          ko: '환영 쳐다보지 않기',
        },
      },
    },
    {
      id: 'A8S Mirage Power Tackle',
      type: 'StartsUsing',
      netRegex: { source: 'Blaster Mirage', id: '165B' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Look Towards Mirage',
          ja: 'ミラージュを見る',
          ko: '환영 쳐다보기',
        },
      },
    },
    {
      id: 'A8S Link Up',
      type: 'Ability',
      netRegex: { source: 'Brute Justice', id: '1673', capture: false },
      run: (data) => data.seenLinkUp = true,
    },
    {
      id: 'A8S Verdict Min HP',
      type: 'GainsEffect',
      netRegex: { effectId: '408' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 8,
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Min HP: Provoke Boss => Late NE Tornado',
          ja: 'HP最小: ボスに挑発 => 北東竜巻',
          ko: 'HP 최소: 보스 도발 🔜 북동쪽 회오리',
        },
      },
    },
    {
      id: 'A8S Verdict Min HP Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '408' },
      run: (data, matches) => data.verdictMin = matches.target,
    },
    {
      id: 'A8S Verdict Min HP Tornado',
      type: 'GainsEffect',
      netRegex: { effectId: '408' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 27,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Get NE Tornado',
          ja: '北東竜巻に',
          ko: '북동쪽 회오리 밟아요',
        },
      },
    },
    {
      id: 'A8S Verdict Max HP Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '407' },
      run: (data, matches) => data.verdictMax = matches.target,
    },
    {
      id: 'A8S Verdict Max HP',
      type: 'GainsEffect',
      netRegex: { effectId: '407' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Max HP: Provoke Boss Second',
          ja: 'HP最大: 第二のボスを挑発',
          ko: 'HP 최대: 두번째로 보스 도발',
        },
      },
    },
    {
      // Final Punishment effect falling off due to auto.
      id: 'A8S Verdict Max HP Provoke',
      type: 'LosesEffect',
      netRegex: { effectId: '403' },
      condition: (data, matches) => {
        return matches.target === data.verdictMin && data.me === data.verdictMax;
      },
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Provoke Boss',
          ja: 'ボスを挑発',
          ko: '보스 도발',
        },
      },
    },
    {
      id: 'A8S Verdict Max HP Blu Devour',
      type: 'GainsEffect',
      netRegex: { effectId: '407' },
      condition: (data, matches) => data.me === matches.target && data.job === 'BLU',
      delaySeconds: 27,
      alarmText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Use Devour',
          ja: '捕食を使う',
          ko: '포식 사용하기',
        },
      },
    },
    {
      id: 'A8S Verdict Penalty 1',
      type: 'GainsEffect',
      netRegex: { effectId: '409' },
      condition: Conditions.targetIsYou(),
      durationSeconds: 10,
      // TODO: we could say who to share north orbs with?
      // TODO: we could also repeat the "share north orbs" after sw orb Explosion.
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Penalty 1: SW orb -> Share 2x North Orbs',
          ja: '1番: 南西にいる玉を喰らう => 北にいる玉と頭割り',
          ko: '약화 1: 남서쪽 구슬 -> 북쪽 구슬 2개',
        },
      },
    },
    {
      id: 'A8S Verdict Penalty 2',
      type: 'GainsEffect',
      netRegex: { effectId: '40A' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Penalty 2: NW Tornado',
          ja: '2番: 北西竜巻',
          ko: '약화 2: 북서쪽 회오리',
        },
      },
    },
    {
      id: 'A8S Verdict Penalty 3',
      type: 'GainsEffect',
      netRegex: { effectId: '40B' },
      condition: Conditions.targetIsYou(),
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Penalty 3: Get a South Tornado',
          ja: '3番: 南竜巻',
          ko: '약화 3: 남쪽 회오리 중 하나 밟아요',
        },
      },
    },
    {
      id: 'A8S Verdict Penalty 3 Orb',
      type: 'GainsEffect',
      netRegex: { effectId: '40B' },
      condition: Conditions.targetIsYou(),
      delaySeconds: 28,
      // TODO: we could collect who else has penalty 3 to share the orb with?
      // TODO: we could also say who to share north orb with.
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Share last orb after gavel',
          ja: 'そして最後の玉と頭割り',
          ko: '폐정 이후 구슬 남은거 처리',
        },
      },
    },
    {
      id: 'A8S Verdict Nisi A',
      type: 'GainsEffect',
      netRegex: { effectId: '40C' },
      condition: Conditions.targetIsYou(),
      // TODO: we could say east or west here after the regulators spawn?
      // TODO: we could also say who to share north orb with.
      // TODO: we could also repeat the share after the regular dies?
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Blue Regulator -> Share 1x North Orb',
          ja: '青いスチームジャッジ => 北の玉と頭割り',
          ko: '파란색 쫄 -> 북쪽 구슬 하나 처리',
        },
      },
    },
    {
      id: 'A8S Verdict Nisi B',
      type: 'GainsEffect',
      netRegex: { effectId: '40D' },
      condition: Conditions.targetIsYou(),
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Red Regulator -> Share 1x North Orb',
          ja: '赤いスチームジャッジ => 北の玉と頭割り',
          ko: '빨간색 쫄 -> 북쪽 구슬 하나 처리',
        },
      },
    },
    {
      id: 'A8S Compressed Water',
      type: 'GainsEffect',
      netRegex: { effectId: '3FF' },
      alarmText: (data, matches, output) => {
        if (data.me === matches.target)
          return output.waterOnYou!();
      },
      infoText: (data, matches, output) => {
        if (data.me !== matches.target)
          return output.waterOn!({ player: data.party.member(matches.target) });
      },
      run: (data, matches) => data.water = matches.target,
      outputStrings: {
        waterOn: {
          en: 'Water on ${player}',
          ja: '${player}に水',
          ko: '"${player}" 물징',
        },
        waterOnYou: {
          en: 'Water on YOU',
          ja: '自分に水',
          ko: '물징 대상자',
        },
      },
    },
    {
      id: 'A8S Compressed Water Lose',
      type: 'LosesEffect',
      netRegex: { effectId: '3FF', capture: false },
      run: (data) => {
        // rip, valiant mine sac
        delete data.water;
      },
    },
    {
      id: 'A8S Compressed Water Soon',
      type: 'GainsEffect',
      netRegex: { effectId: '3FF' },
      condition: (data) => data.water !== undefined,
      delaySeconds: (_data, matches) => parseFloat(matches.duration) - 5,
      infoText: (data, _matches, output) => {
        return output.text!({ player: data.party.member(data.water) });
      },
      outputStrings: {
        text: {
          en: 'Water Soon on ${player}',
          ja: 'まもなく、${player}に頭割り',
          ko: '"${player}" 물징 곧 터짐',
        },
      },
    },
    {
      id: 'A8S Final Punch',
      type: 'StartsUsing',
      netRegex: { source: 'Brute Justice', id: '170C' },
      response: Responses.tankBusterSwap(),
    },
    {
      id: 'A8S Final Beam',
      type: 'Ability',
      // id is for Final Apocalypse Ability
      netRegex: { source: 'Brute Justice', id: '1716', capture: false },
      infoText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Stack for Final Beam',
          ja: 'ファイナルメガビームに頭割り',
          ko: '최후의 고출력 광선 쉐어',
        },
      },
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Blaster Mirage': 'Blaster-Replikant',
        'Blaster(?! Mirage)': 'Blaster',
        'Brawler': 'Blechbrecher',
        'Brute Justice': 'Brutalus',
        'Hidden Mine': 'Minenfalle',
        'Onslaughter': 'Schlachter',
        'Steam Chakram': 'Dampf-Chakram',
        'Steam Regulator B': 'β-Dampfregler',
        'Swindler': 'Schwindler',
        'Vortexer': 'Wirbler',
      },
      'replaceText': {
        '--orbs--': '--kugeln--',
        '--regulator check--': '--dampfregler check--',
        '100-Megatonze Shock': '100-Megatonzen-Schock',
        'Apocalyptic Ray': 'Apokalyptischer Strahl',
        'Attachment': 'Anlegen',
        'Auxiliary Power': 'Notstrom',
        'Ballistic Missile': 'Ballistische Rakete',
        'Blaster': 'Blaster',
        'Blinder': 'Blendgeschoss',
        'Brawler': 'Blechbrecher',
        'Brute Force': 'Brutaler Schlag',
        'Crashing Thunder': 'Brechende Welle',
        'Discoid': 'Diskoid',
        'Double Buster': 'Doppelsprenger',
        'Double Drill Crush': 'Doppeldrill',
        'Double Rocket Punch': 'Doppelraketenschlag',
        'Drill Drive': 'Bohrschub',
        'Earth Missile': 'Erd-Geschoss',
        'Elemental Jammer': 'Elementarstörer',
        'Enumeration': 'Zählen',
        'Execution': 'Exekutive',
        'Eye of the Chakram': 'Auge des Chakrams',
        'Final Apocalypse': 'Finaler Apokalyptischer Strahl',
        'Final Beam': 'Finaler Megastrahl',
        'Final Punch': 'Endgültiger Doppelraketenschlag',
        'Flarethrower': 'Großflammenwerfer',
        'Gavel': 'Prozessende',
        'Height': 'Nivellierung',
        'Hidden Minefield': 'Getarntes Minenfeld',
        'Hydrothermal Missile': 'Hydrothermales Geschoss',
        'Ice Missile': 'Eisgeschoss',
        'J Kick': 'Gewissenstritt',
        'J Storm': 'Gerechter Sturm',
        'J Wave': 'Gerechte Schockwelle',
        'Justice': 'Großer Richter',
        'Legislation': 'Legislative',
        'Link-Up': 'Zusammenschluss',
        'Long Needle': 'Großes Kaliber',
        'Magicked Mark': 'Magiegeschoss',
        'Mechanic': 'Mechanik',
        'Mega Beam': 'Megastrahl',
        'Mind Blast': 'Geiststoß',
        'Mirage': 'Illusion',
        'Missile Command': 'Raketenkommando',
        'Perpetual Ray': 'Perpetueller Strahl',
        'Power Tackle': 'Niederringen',
        'Rocket Drill': 'Raketenbohrer',
        'Seed of the Sky': 'Samen des Himmels',
        'Short Needle': 'Kleines Kaliber',
        'Single Buster': 'Einzelsprenger',
        'Super Cyclone': 'Superzyklon',
        'Super Jump': 'Supersprung',
        'Supercharge': 'Superladung',
        'Swindler': 'Schwindler',
        'Transform': 'Geballte Rechtsgewalt',
        'Ultra Flash': 'Ultrablitz',
        'Verdict': 'Prozesseröffnung',
        'Vortexer': 'Wirbler',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Blaster Mirage': 'Réplique du Fracasseur',
        'Blaster(?! Mirage)': 'Fracasseur',
        'Brawler': 'Bagarreur',
        'Brute Justice': 'Justicier',
        'Hidden Mine': 'mine furtive',
        'Onslaughter': 'Attaqueur',
        'Steam Chakram': 'Chakram de vapeur',
        'Steam Regulator B': 'Régulateur de vapeur β',
        'Swindler': 'Arnaqueur',
        'Vortexer': 'Tourbillonneur',
      },
      'replaceText': {
        '--orbs--': '--orbes--',
        '--regulator check--': '--vérification du régulateur--',
        '100-Megatonze Shock': 'Choc de 100 mégatonz',
        'Apocalyptic Ray': 'Rayon apocalyptique',
        'Attachment': 'Extension',
        'Auxiliary Power': 'Soutien énergétique',
        'Ballistic Missile': 'Missiles balistiques',
        'Blaster': 'Fracasseur',
        'Blinder': 'Missile aveuglant',
        'Brawler(?! Mechanic)': 'Bagarreur',
        'Brawler Mechanic': 'Mécanique du Bagarreur',
        'Brute Force': 'Force brute',
        'Crashing Thunder': 'Éclair percutant',
        'Discoid': 'Discoïde',
        'Double Buster': 'Double pulsoréacteur',
        'Double Drill Crush': 'Écrasement foreuse double',
        'Double Rocket Punch': 'Double coup de roquette',
        'Drill Drive': 'Frappe foreuse',
        'Earth Missile': 'Missile de terre',
        'Elemental Jammer': 'Grippage élémentaire',
        'Enumeration': 'Compte',
        'Execution': 'Exécution',
        'Eye of the Chakram': 'Œil du chakram',
        'Final Apocalypse': 'Rayon apocalyptique final',
        'Final Beam': 'Mégarayon final',
        'Final Punch': 'Double coup de roquette final',
        'Flarethrower': 'Lance-brasiers',
        'Gavel': 'Conclusion de procès',
        'Height': 'Dénivellation',
        'Hidden Minefield': 'Champ de mines caché',
        'Hydrothermal Missile': 'Missile hydrothermique',
        'Ice Missile': 'Missile de glace',
        'J Kick': 'Pied justicier',
        'J Storm': 'Tempête justicière',
        'J Wave': 'Onde de choc justicière',
        'Justice': 'Justicier',
        'Legislation': 'Législation',
        'Link-Up': 'Effort collectif',
        'Long Needle': 'Gros missiles',
        'Magicked Mark': 'Tir magique',
        'Mega Beam': 'Mégarayon',
        'Mind Blast\\?': 'Explosion mentale ?',
        'Mirage': 'Mirage',
        'Missile Command': 'Commande missile',
        'Perpetual Ray': 'Rayon perpétuel',
        'Power Tackle': 'Tacle puissant',
        'Rocket Drill': 'Roquette-foreuse',
        'Seed Of The Sky': 'Graine du ciel',
        'Short Needle': 'Petits missiles',
        'Single Buster': 'Pulsoréacteur',
        'Super Cyclone': 'Super cyclone',
        'Super Jump': 'Super saut',
        'Supercharge': 'Super charge',
        'Swindler': 'Arnaqueur',
        'Transform': 'Assemblage Justicier',
        'Ultra Flash': 'Ultraflash',
        'Verdict': 'Ouverture de procès',
        'Vortexer': 'Tourbillonneur',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Blaster Mirage': 'ブラスター・ミラージュ',
        'Blaster(?! Mirage)': 'ブラスター',
        'Brawler': 'ブロウラー',
        'Brute Justice': 'ブルートジャスティス',
        'Hidden Mine': 'ステルス地雷',
        'Onslaughter': 'オンスローター',
        'Steam Chakram': 'スチームチャクラム',
        'Steam Regulator B': 'スチームジャッジβ',
        'Swindler': 'スウィンドラー',
        'Vortexer': 'ボルテッカー',
      },
      'replaceText': {
        '--orbs--': '--オーブ--',
        '--regulator check--': '--レギュレーターチェック--',
        '100-Megatonze Shock': '100メガトンズショック',
        'Apocalyptic Ray': 'アポカリプティクレイ',
        'Attachment': 'アタッチメント',
        'Auxiliary Power': 'エネルギー支援',
        'Ballistic Missile': 'ミサイル発射',
        'Blaster': 'ブラスター',
        'Blinder': 'ブラインダーミサイル',
        'Brawler(?! Mechanic)': 'ブロウラー',
        'Brawler Mechanic': 'ブロウラー ギミック',
        'Brute Force': 'ブルートパンチ',
        'Crashing Thunder': 'クラッシュサンダー',
        'Discoid': 'ディスコイド',
        'Double Buster': 'ダブルバスターアタック',
        'Double Drill Crush': 'ダブルドリルクラッシュ',
        'Double Rocket Punch': 'ダブルロケットパンチ',
        'Drill Drive': 'ドリルドライブ',
        'Earth Missile': 'アースミサイル',
        'Elemental Jammer': 'エレメンタルジャミング',
        'Enumeration': 'カウント',
        'Execution': '執行準備',
        'Eye of the Chakram': 'ビームチャクラム',
        'Final Apocalypse': 'ファイナルアポカリプティクレイ',
        'Final Beam': 'ファイナルメガビーム',
        'Final Punch': 'ファイナルダブルロケットパンチ',
        'Flarethrower': '大火炎放射',
        'Gavel': '最後の審判：結審',
        'Height': 'ハイト',
        'Hidden Minefield': 'ステルス地雷',
        'Hydrothermal Missile': '蒸気ミサイル',
        'Ice Missile': 'アイスミサイル',
        'J Kick': 'ジャスティスキック',
        'J Storm': 'ジャスティスストーム',
        'J Wave': 'ジャスティスショックウェーブ',
        'Justice': 'ジャスティス合神',
        'Legislation': '法整備',
        'Link-Up': 'システムリンク',
        'Long Needle': '大型ミサイル',
        'Magicked Mark': 'マジックショット',
        'Mega Beam': 'メガビーム',
        'Mind Blast': 'マインドブラスト',
        'Mirage': 'ミラージュシステム',
        'Missile Command': 'ミサイル全弾発射',
        'Perpetual Ray': 'パーペチュアルレイ',
        'Power Tackle': 'パワータックル',
        'Rocket Drill': 'ロケットドリル',
        'Seed of the Sky': 'シード・オブ・スカイ',
        'Short Needle': '小型ミサイル',
        'Single Buster': 'バスターアタック',
        'Super Cyclone': 'スーパーサイクロン',
        'Super Jump': 'スーパージャンプ',
        'Supercharge': 'スーパーチャージ',
        'Swindler': 'スウィンドラー',
        'Transform': 'ジャスティス合体',
        'Ultra Flash': 'ウルトラフラッシュ',
        'Verdict': '最後の審判：開廷',
        'Vortexer': 'ボルテッカー',
        'Seed Of The Sky': 'シード・オブ・スカイ',
        'Eye Of The Chakram': 'ビームチャクラム',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Blaster Mirage': '爆破者幻象',
        'Blaster(?! Mirage)': '爆破者',
        'Brawler': '争斗者',
        'Brute Justice': '残暴正义号',
        'Hidden Mine': '隐形地雷',
        'Onslaughter': '突击者',
        'Steam Chakram': '蒸汽战轮',
        'Steam Regulator B': '蒸汽调整者β',
        'Swindler': '欺诈者',
        'Vortexer': '环旋者',
      },
      'replaceText': {
        '--orbs--': '--球--',
        '--regulator check--': '--调节器检查--',
        '100-Megatonze Shock': '亿万吨震荡',
        'Apocalyptic Ray': '末世宣言',
        'Attachment': '配件更换',
        'Auxiliary Power': '能量支援',
        'Ballistic Missile': '导弹发射',
        'Blaster': '冲击波',
        'Blinder': '混合导弹',
        'Brawler': '争斗者',
        'Brute Force': '残暴铁拳',
        'Crashing Thunder': '冲击雷',
        'Discoid': '圆盘',
        'Double Buster': '双重破坏炮击',
        'Double Drill Crush': '双重飞钻冲击',
        'Double Rocket Punch': '双重火箭飞拳',
        'Drill Drive': '钻头驱动',
        'Earth Missile': '大地导弹',
        'Elemental Jammer': '元素干扰',
        'Enumeration': '计数',
        'Execution': '执行准备',
        'Eye of the Chakram': '激光战轮',
        'Final Apocalypse': '终极末世宣言',
        'Final Beam': '终极巨型光束炮',
        'Final Punch': '终极双重火箭飞拳',
        'Flarethrower': '大火炎放射',
        'Gavel': '终审闭庭',
        'Height': '高度算术',
        'Hidden Minefield': '隐形地雷散布',
        'Hydrothermal Missile': '蒸汽导弹',
        'Ice Missile': '寒冰导弹',
        'J Kick': '正义飞踢',
        'J Storm': '正义风暴',
        'J Wave': '正义震荡波',
        'Justice': '正义合神',
        'Legislation': '法制整顿',
        'Link-Up': '系统连接',
        'Long Needle': '大型导弹',
        'Magicked Mark': '魔力射击',
        'Mechanic': '争斗者变形',
        'Mega Beam': '巨型光束炮',
        'Mind Blast': '精神冲击',
        'Mirage': '幻影系统',
        'Missile Command': '导弹齐发',
        'Perpetual Ray': '永恒射线',
        'Power Tackle': '强力前冲拳',
        'Rocket Drill': '火箭飞钻',
        'Seed of the Sky': '天空之种',
        'Short Needle': '小型导弹',
        'Single Buster': '破坏炮击',
        'Super Cyclone': '超级气旋',
        'Super Jump': '超级跳跃',
        'Supercharge': '超突击',
        'Swindler': '欺诈者',
        'Transform': '正义合体',
        'Ultra Flash': '究极闪光',
        'Verdict': '终审开庭',
        'Vortexer': '环旋者',
      },
    },
    {
      'locale': 'tc',
      'replaceSync': {
        'Blaster Mirage': '爆破者幻象',
        'Blaster(?! Mirage)': '爆破者',
        'Brawler': '爭鬥者',
        'Brute Justice': '殘暴正義號',
        'Hidden Mine': '隱形地雷',
        'Onslaughter': '突擊者',
        'Steam Chakram': '蒸氣戰輪',
        'Steam Regulator B': '蒸氣調整者β',
        'Swindler': '欺詐者',
        'Vortexer': '環旋者',
      },
      'replaceText': {
        '--orbs--': '--球--',
        '--regulator check--': '--調節器檢查--',
        '100-Megatonze Shock': '億萬噸震盪',
        'Apocalyptic Ray': '末世宣言',
        'Attachment': '配件更換',
        'Auxiliary Power': '能量支援',
        'Ballistic Missile': '導彈發射',
        'Blaster': '衝擊波',
        'Blinder': '混合導彈',
        'Brawler(?! Mechanic)': '爭鬥者',
        'Brawler Mechanic': '爭鬥者變形',
        'Brute Force': '殘暴鐵拳',
        'Crashing Thunder': '衝擊雷',
        'Discoid': '圓盤',
        'Double Buster': '雙重破壞砲擊',
        'Double Drill Crush': '雙重飛鑽衝擊',
        'Double Rocket Punch': '雙重火箭拳擊',
        'Drill Drive': '鑽頭驅動',
        'Earth Missile': '大地導彈',
        'Elemental Jammer': '元素干擾',
        'Enumeration': '計數',
        'Execution': '執行準備',
        'Eye of the Chakram': '雷射戰輪',
        'Final Apocalypse': '終極末世宣言',
        'Final Beam': '終極巨型光束砲',
        'Final Punch': '終極雙重火箭拳擊',
        'Flarethrower': '大火炎放射',
        'Gavel': '終審閉庭',
        'Height': '高度算術',
        'Hidden Minefield': '隱形地雷散佈',
        'Hydrothermal Missile': '蒸氣導彈',
        'Ice Missile': '寒冰導彈',
        'J Kick': '正義飛踢',
        'J Storm': '正義風暴',
        'J Wave': '正義衝擊狂潮',
        'Justice': '正義合神',
        'Legislation': '法制整頓',
        'Link-Up': '系統連接',
        'Long Needle': '大型導彈',
        'Magicked Mark': '魔力射擊',
        'Mega Beam': '巨型光束砲',
        'Mind Blast': '精神衝擊',
        'Mirage': '幻影系統',
        'Missile Command': '導彈齊發',
        'Perpetual Ray': '永恆射線',
        'Power Tackle': '強力前衝拳',
        'Rocket Drill': '火箭飛鑽',
        'Seed of the Sky': '天空之種',
        'Short Needle': '小型導彈',
        'Single Buster': '破壞砲擊',
        'Super Cyclone': '超級颶風',
        'Super Jump': '超級跳躍',
        'Supercharge': '超突擊',
        'Swindler': '欺詐者',
        'Transform': '正義合體',
        'Ultra Flash': '究極閃光',
        'Verdict': '終審開庭',
        'Vortexer': '環旋者',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Blaster Mirage': '폭파자의 환영',
        'Blaster(?! Mirage)': '폭파자',
        'Brawler': '폭격자',
        'Brute Justice': '포악한 심판자',
        'Hidden Mine': '은폐 지뢰',
        'Onslaughter': '맹습자',
        'Steam Chakram': '증기 차크람',
        'Steam Regulator B': '증기 감독 β',
        'Swindler': '조작자',
        'Vortexer': '교반자',
      },
      'replaceText': {
        '--orbs--': '--구슬--',
        '--regulator check--': '--증기 감옥 확인--',
        '100-Megatonze Shock': '100메가톤즈 충격',
        'Apocalyptic Ray': '파멸 계시',
        'Attachment': '무기 장착',
        'Auxiliary Power': '에너지 지원',
        'Ballistic Missile': '미사일 발사',
        'Blaster': '폭파자',
        'Blinder': '섬광 미사일',
        'Brawler(?! Mechanic)': '폭격자',
        'Brawler Mechanic': '한손/양손 버스터/드릴',
        'Brute Force': '폭력적인 주먹',
        'Crashing Thunder': '충격의 번개',
        'Discoid': '원반',
        'Double Buster': '양손 버스터',
        'Double Drill Crush': '양손 드릴 분쇄',
        'Double Rocket Punch': '양손 로켓 주먹',
        'Drill Drive': '드릴 구동',
        'Earth Missile': '대지 미사일',
        'Elemental Jammer': '원소 간섭',
        'Enumeration': '계산',
        'Execution': '집행 준비',
        'Eye of the Chakram': '광선 차크람',
        'Final Apocalypse': '최후의 파멸 계시',
        'Final Beam': '최후의 고출력 광선',
        'Final Punch': '최후의 양손 로켓 주먹',
        'Flarethrower': '대화염방사',
        'Gavel': '최후의 심판: 폐정',
        'Height': '고도',
        'Hidden Minefield': '은폐 지뢰 살포',
        'Hydrothermal Missile': '증기 미사일',
        'Ice Missile': '얼음 미사일',
        'J Kick': '정의의 발차기',
        'J Storm': '정의의 폭풍',
        'J Wave': '정의의 충격파',
        'Justice': '정의의 합신',
        'Legislation': '법률 정비',
        'Link-Up': '시스템 연결',
        'Long Needle': '대형 미사일',
        'Magicked Mark': '마법 사격',
        'Mega Beam': '고출력 광선',
        'Mind Blast': '정신파괴',
        'Mirage': '환영 시스템',
        'Missile Command': '미사일 전탄 발사',
        'Perpetual Ray': '영원한 빛줄기',
        'Power Tackle': '강력 들이받기',
        'Rocket Drill': '한손 드릴',
        'Seed of the Sky': '하늘의 원천',
        'Short Needle': '소형 미사일',
        'Single Buster': '한손 버스터',
        'Super Cyclone': '대형 돌개바람',
        'Super Jump': '슈퍼 점프',
        'Supercharge': '강력 돌진',
        'Swindler': '조작자',
        'Transform': '정의의 합체',
        'Ultra Flash': '초섬광',
        'Verdict': '최후의 심판: 개정',
        'Vortexer': '교반자',
      },
    },
  ],
};

export default triggerSet;
