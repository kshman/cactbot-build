import { Responses } from '../../../../../resources/responses';
import ZoneId from '../../../../../resources/zone_id';
import { RaidbossData } from '../../../../../types/data';
import { TriggerSet } from '../../../../../types/trigger';

export interface Data extends RaidbossData {
  pelicanPoisons: string[];
}

const triggerSet: TriggerSet<Data> = {
  id: 'BrayfloxsLongstop',
  zoneId: ZoneId.BrayfloxsLongstop,
  comments: {
    en: 'pre-6.1 rework',
    de: 'Vor der 6.1 Überarbeitung',
    fr: 'Avant le remaniement 6.1',
    cn: '6.1改版前',
    ko: '6.1 개편 전',
  },
  initData: () => {
    return {
      pelicanPoisons: [],
    };
  },
  triggers: [
    {
      id: 'Brayflox Normal Numbing Breath',
      type: 'StartsUsing',
      netRegex: { id: '1FA', source: 'Great Yellow Pelican' },
      condition: (data) => data.CanStun(),
      response: Responses.stun('info'),
    },
    {
      id: 'Brayflox Normal Pelican Poison Collect',
      type: 'GainsEffect',
      netRegex: { effectId: '12' },
      condition: (data) => data.CanCleanse(),
      run: (data, matches) => data.pelicanPoisons.push(matches.target),
    },
    {
      id: 'Brayflox Normal Pelican Poison Healer',
      type: 'GainsEffect',
      netRegex: { effectId: '12', capture: false },
      condition: (data) => data.CanCleanse(),
      delaySeconds: 1,
      suppressSeconds: 2,
      alertText: (data, _matches, output) => {
        const names = data.pelicanPoisons.sort();
        if (names.length === 1 && names[0] === data.me)
          return output.esunaYourPoison!();
        return output.esunaPoisonOn!({ players: names.map((x) => data.party.member(x)) });
      },
      run: (data) => data.pelicanPoisons = [],
      outputStrings: {
        esunaYourPoison: {
          en: 'Esuna Your Poison',
          de: 'Entferne dein Gift',
          fr: 'Purifiez-vous du poison',
          ja: '自分の毒をエスナ',
          cn: '康复自己的毒',
          ko: '내게 에스나',
        },
        esunaPoisonOn: {
          en: 'Esuna Poison on ${players}',
          de: 'Entferne Gift von ${players}',
          fr: 'Purifiez le poison sur ${players}',
          ja: '${players}の毒をエスナ',
          cn: '康复${players}',
          ko: '에스나: ${players}',
        },
      },
    },
    {
      // Pelican Adds
      // Only parsing for Sable Back since there is at least 1 Sable Back in each spawn pack.
      // The pack with the boss is 3 Violet Backs, not parsing for them prevents the trigger
      // from activating early when you pick up the Headgate Key and the boss and adds spawn.
      id: 'Brayflox Normal Pelican Adds',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '1283', capture: false },
      suppressSeconds: 2,
      response: Responses.killAdds(),
    },
    {
      id: 'Brayflox Normal Ashdrake Burning Cyclone',
      type: 'StartsUsing',
      netRegex: { id: '205', source: 'Ashdrake' },
      condition: (data) => data.CanStun(),
      response: Responses.stun('info'),
    },
    {
      // Tempest Biast Spawn
      id: 'Brayflox Normal Tempest Biast',
      type: 'AddedCombatant',
      netRegex: { npcNameId: '1285', capture: false },
      response: Responses.killAdds(),
    },
    {
      id: 'Brayflox Normal Inferno Drake Burning Cyclone',
      type: 'StartsUsing',
      netRegex: { id: '3D8', source: 'Inferno Drake' },
      condition: (data) => data.CanStun(),
      response: Responses.stun('info'),
    },
    {
      // Hellbender Bubble
      id: 'Brayflox Normal Hellbender Effluvium',
      type: 'Ability',
      netRegex: { id: '3D3', source: 'Hellbender' },
      infoText: (data, matches, output) => {
        if (matches.target !== data.me)
          return output.breakBubbleOn!({ player: data.party.member(matches.target) });

        if (matches.target === data.me)
          return output.breakYourBubble!();
      },
      outputStrings: {
        breakBubbleOn: {
          en: 'Break Bubble on ${player}',
          de: 'Besiege die Blase von ${player}',
          fr: 'Brisez la bulle de ${player}',
          ja: '${player}の泡を破れ',
          cn: '打${player}的泡泡',
          ko: '버블 부서요: ${player}',
        },
        breakYourBubble: {
          en: 'Break Your Bubble',
          de: 'Besiege deine Blase',
          fr: 'Brisez votre bulle',
          ja: '自分の泡を破れ',
          cn: '打自己的泡泡',
          ko: '내 버블 부셔요',
        },
      },
    },
    {
      // Stunnable Line Attack
      id: 'Brayflox Normal Aiatar Dragon Breath',
      type: 'StartsUsing',
      netRegex: { id: '22F', source: 'Aiatar' },
      condition: (data) => data.CanStun(),
      response: Responses.stun('info'),
    },
    {
      // Move Aiatar out of Puddles
      id: 'Brayflox Normal Aiatar Toxic Vomit Tank',
      type: 'GainsEffect',
      netRegex: { effectId: '117', capture: false },
      condition: (data) => data.role === 'tank',
      alertText: (_data, _matches, output) => output.text!(),
      outputStrings: {
        text: {
          en: 'Move Boss Out of Puddles',
          de: 'Bewege den Boss aus der Fläche',
          fr: 'Déplacez le boss hors des zones au sol',
          ja: 'ボスを円範囲の外に',
          cn: '把BOSS拉出圈圈',
          ko: '보스를 장판에서 빼와요',
        },
      },
    },
    {
      // Healer Esuna Poison.
      // This triggers on both Salivous Snap and Puddle Poison Application
      id: 'Brayflox Normal Aiatar Poison Healer',
      type: 'GainsEffect',
      netRegex: { effectId: '113' },
      condition: (data) => data.CanCleanse(),
      alertText: (data, matches, output) => {
        if (matches.target !== data.me)
          return output.esunaPoisonOn!({ player: data.party.member(matches.target) });

        return output.esunaYourPoison!();
      },
      outputStrings: {
        esunaPoisonOn: {
          en: 'Esuna Poison on ${player}',
          de: 'Entferne Gift von ${player}',
          fr: 'Purifiez le poison sur ${player}',
          ja: '${player}の毒をエスナ',
          cn: '康复${player}的毒',
          ko: '에스나: ${player}',
        },
        esunaYourPoison: {
          en: 'Esuna Your Poison',
          de: 'Entferne dein Gift',
          fr: 'Purifiez-vous du poison',
          ja: '自分の毒をエスナ',
          cn: '康复自己的毒',
          ko: '내게 에스나',
        },
      },
    },
    {
      id: 'Brayflox Normal Aiatar Salivous Snap',
      type: 'StartsUsing',
      netRegex: { id: '6FF3', source: 'Aiatar' },
      response: Responses.tankBuster(),
    },
  ],
  timelineReplace: [
    {
      'locale': 'de',
      'replaceSync': {
        'Aiatar': 'Aiatar',
        'Ashdrake': 'Asch-Drakon',
        'Great Yellow Pelican': 'Großer Gelbpelikan',
        'Hellbender': 'Höllenkrümmer',
        'Inferno Drake': 'Sonnen-Drakon',
      },
    },
    {
      'locale': 'fr',
      'replaceSync': {
        'Aiatar': 'Aiatar',
        'Ashdrake': 'draconide des cendres',
        'Great Yellow Pelican': 'grand pélican jaune',
        'Hellbender': 'ménopome',
        'Inferno Drake': 'draconide des brasiers',
      },
    },
    {
      'locale': 'ja',
      'replaceSync': {
        'Aiatar': 'アイアタル',
        'Ashdrake': 'アッシュドレイク',
        'Great Yellow Pelican': 'グレート・イエローペリカン',
        'Hellbender': 'ヘルベンダー',
        'Inferno Drake': 'インフェルノドレイク',
      },
    },
    {
      'locale': 'cn',
      'replaceSync': {
        'Aiatar': '阿杰特',
        'Ashdrake': '白烬火蛟',
        'Great Yellow Pelican': '大黄鹈鹕',
        'Hellbender': '水栖蝾螈',
        'Inferno Drake': '狱炎火蛟',
      },
    },
    {
      'locale': 'ko',
      'replaceSync': {
        'Aiatar': '아이아타르',
        'Ashdrake': '잿빛도마뱀',
        'Great Yellow Pelican': '노란 왕사다새',
        'Hellbender': '장수도롱뇽',
        'Inferno Drake': '지옥불 도마뱀',
      },
    },
  ],
};

export default triggerSet;
